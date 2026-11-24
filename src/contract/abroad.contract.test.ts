/**
 * A WORKS ON THE RELEASED 0.2.6 TAKES THIS RELEASE, AND THEN SELLS ABROAD.
 *
 * On a built Adminium, on SQLite, Postgres and MySQL, along the path a works
 * takes. Print 0.2.6 is installed from its own commit with its sample and a
 * carrier, and an order is placed on it. This checkout's manifest updates it
 * in place. Until the owner lists a country nothing changes: the same order
 * costs the same, and nobody abroad can be sold to. Then the owner lists one,
 * and a customer abroad orders at that country's price with a phone number,
 * and the order goes from the checkout to a customs label.
 *
 * The carrier is a stand-in with no network. It writes what it was asked to a
 * file, so this reads the declaration a real carrier would have been sent.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { firstChoice } from "../shop/config.ts";
import { AdminiumShop } from "../shop/door.ts";
import { createPublicClient } from "@adminiumjs/public-client";

import { isShopError, type Catalogue, type Row } from "../shop/port.ts";
import { orderBody, useShop, type BasketLine } from "../shop/store.ts";
import { ADD_ONS_REPO, addOnBundle, appBundle, boot, bundle, Caller, ENGINES, missing, missingAddOn, ok, PORTS_PER_ENGINE, until, type Engine, type Server } from "./harness.ts";
import { sinkMail } from "./mail.ts";
import { engineAtLeast, MANIFEST_TEXT } from "./release.ts";
import { ADMIN, emptyDatabase, WEDNESDAY } from "./works.ts";

const REPO = fileURLToPath(new URL("../..", import.meta.url));
/** The commit Print 0.2.6 was released from. */
const RELEASED = "96f2029";
const at = (path: string): string | null => {
  try {
    return execFileSync("git", ["-C", REPO, "show", `${RELEASED}:${path}`], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 * 1024 * 1024 });
  } catch {
    return null;
  }
};
const FROM_MANIFEST = at("manifest.json");
const reason = missing() ?? missingAddOn("customiser") ?? (FROM_MANIFEST === null ? `no commit ${RELEASED} in this checkout` : !engineAtLeast("0.3.74") ? "needs Adminium 0.3.74" : !existsSync(join(ADD_ONS_REPO, "packages", "shipping-shippo", "manifest.json")) ? "no Shippo add-on" : null);
const PORT_BASE = Number(process.env["CONTRACT_PORT_BASE"] ?? 5340);
const SHOPPER = { name: "Heidi Vogel", email: "heidi@vogel-studio.dev", address_line1: "Hauptstr. 1", town: "Berlin", postcode: "10115", language: "en-US", may_email: false };
const HOME = { ...SHOPPER, name: "Harbour Bakery", email: "orders@harbourbakery.example", address_line1: "12 Quay Street", town: "Marlow", postcode: "SL7 1BT", delivery_method: "deliver" };
const PHONE = "+49 30 1234567";

/** The stand-in carrier's server half: rates, a label and a customs invoice, and a note of each declaration it was given. */
const CARRIER = `import { appendFileSync } from "node:fs";
const note = (kind, customs) => { if (process.env.CONTRACT_CARRIER_LOG) appendFileSync(process.env.CONTRACT_CARRIER_LOG, JSON.stringify({ kind, customs: customs ?? null }) + "\\n"); };
const RATE = { code: "lab-eco", service: "Economy", amount: 9.5, amountDecimal: "9.50", currency: "GBP", estimatedDays: 4, carrier: "Northway", handover: "drop-off", tracked: true, ref: "lab-rate", carrierToken: "tok-nw" };
const PDF = new TextEncoder().encode("%PDF-1.4 stand-in");
let bought = 0;
export function createShippingCarrier() {
  return {
    key: "shipping-shippo",
    quote: async (parcel, from, to, options) => { note("quote", options && options.customs); return [RATE]; },
    book: async (rate, order, details) => {
      note("book", details && details.customs);
      bought += 1;
      return { id: "lab-" + bought, tracking: "LAB10000" + bought, labelFileId: "lab-file", carrier: "Northway", carrierToken: "tok-nw", rate: RATE, test: false, documents: [{ kind: "label", mediaType: "application/pdf" }, { kind: "customs-invoice", mediaType: "application/pdf" }] };
    },
    recover: async () => ({ outcome: "no-match" }),
    fetchDocument: async (id, kind) => ({ kind, mediaType: "application/pdf", filename: id + ".pdf", bytes: PDF }),
    track: async () => [],
    label: async () => { throw new Error("not used"); },
    cancel: async () => undefined,
    checkCredentials: async () => ({ outcome: "ok", mode: "live", accountFingerprint: "lab", carriers: ["Northway"] }),
  };
}
`;

function carrierBundle() {
  const dir = join(ADD_ONS_REPO, "packages", "shipping-shippo");
  const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8")) as { version: string };
  const files = {
    "package.json": Buffer.from(JSON.stringify({ name: "@adminiumjs/add-on-shipping-shippo", version: manifest.version })),
    "manifest.json": Buffer.from(JSON.stringify(manifest)),
    "dist/client.js": Buffer.from("export const register = () => ({ key: 'shipping-shippo', fills: [] });\n"),
    "dist/server.js": Buffer.from(CARRIER),
  };
  return { ...bundle(files), key: "shipping-shippo", version: manifest.version };
}

const money = (value: unknown) => Number(value).toFixed(2);

describe.skipIf(reason !== null)(`a works updated from 0.2.6, then selling abroad${reason === null ? "" : ` — skipped: ${reason}`}`, () => {
  ENGINES.forEach(([engine, available], index) => {
    describe.skipIf(!available)(`on ${engine}`, () => {
      let server: Server;
      let staff: Caller;
      let connectionId = "";
      let served: { publishableKey: string; publicKeys?: Record<string, string>; tables?: Record<string, string>; settings?: Record<string, unknown> };
      let catalogue: Catalogue;
      let keys = 0;
      const log = join(tmpdir(), `printing-abroad-carrier-${engine}-${String(process.pid)}.log`);
      const seeds = join(tmpdir(), `printing-abroad-seeds-${engine}-${String(process.pid)}`);
      const notes = (): { kind: string; customs: { items: Row[]; signer: string; certified: boolean } | null }[] => (existsSync(log) ? readFileSync(log, "utf8").trim().split("\n").filter(Boolean).map((line) => JSON.parse(line) as never) : []);

      const originFetch: typeof fetch = (input, init) => {
        const headers = new Headers(init?.headers);
        headers.set("origin", server.base);
        return fetch(input, { ...init, headers });
      };
      const browser = () => new AdminiumShop({ baseUrl: server.base, publishableKey: served.publishableKey, ...(served.tables === undefined ? {} : { tables: served.tables }), ...(served.publicKeys === undefined ? {} : { publicKeys: served.publicKeys }), ...(served.settings === undefined ? {} : { settings: served.settings }) }, { fetch: originFetch });
      const table = (ref: string) => encodeURIComponent(served?.tables?.[ref] ?? `printing_${ref}`);
      const rows = async (ref: string): Promise<Row[]> => {
        const out: Row[] = [];
        for (let offset = 0; ; offset += 200) {
          const got = ok(await staff.get<{ data: Row[] }>(`/api/v1/data/${connectionId}/${table(ref)}?limit=200&offset=${String(offset)}`)).data;
          out.push(...got);
          if (got.length < 200) return out;
        }
      };
      const lineOf = (code: string, qty: number, id: string): BasketLine => {
        const product = catalogue.products.find((p) => p.code === code)!;
        return { id, productId: product.id, choice: { ...firstChoice(catalogue, product), qty }, design: null, features: [], artwork: [] };
      };
      const place = async (values: Row, lines: BasketLine[]) => {
        const shop = browser();
        const quoted = await shop.quote(orderBody(values, lines, true));
        keys += 1;
        return shop.place(orderBody(values, lines, true), `printing-abroad-${engine}-${String(keys).padStart(10, "0")}`, String(quoted.order["total"]));
      };
      const refusal = async (values: Row, lines: BasketLine[]) => {
        const caught = await browser().quote(orderBody(values, lines, true)).then(() => null, (error: unknown) => error);
        return isShopError(caught) ? caught.refused : null;
      };
      const shippingApi = "/api/v1/apps/printing/shipping";

      let onRelease: { id: unknown; total: string; delivery: string };
      let homeBefore: Row;
      let german: Row;
      let germanBooking = "";
      const documentOf = (booking: string, kind: "label" | "customs-invoice") => fetch(`${server.base}${shippingApi}/bookings/${booking}/documents/${kind}`, { headers: { cookie: staff.cookies } });

      beforeAll(async () => {
        rmSync(log, { force: true });
        process.env["CONTRACT_CARRIER_LOG"] = log;
        mkdirSync(seeds, { recursive: true });
        const from = JSON.parse(FROM_MANIFEST!) as { sampleData: { file: string; addOns?: Record<string, { file: string }> } };
        for (const file of [from.sampleData.file, ...Object.values(from.sampleData.addOns ?? {}).map((one) => one.file)]) {
          writeFileSync(join(seeds, file.replace(/^seeds\//, "")), at(file)!);
        }
        server = await boot(engine as Engine, PORT_BASE + index * PORTS_PER_ENGINE, WEDNESDAY - 60_000, { database: `printing_abroad_${engine}${process.env["CONTRACT_DB_SUFFIX"] ?? ""}` });
        staff = new Caller(server.base, { origin: server.base });
        await staff.signIn(ADMIN.email, ADMIN.password);
        const dsn = emptyDatabase(engine as Engine, `printing_abroad_works_${engine}${process.env["CONTRACT_DB_SUFFIX"] ?? ""}`);
        connectionId = ok(await staff.post<{ id: string }>("/api/v1/connections", { name: "marlow-press", engine, dsn }), 201).id;

        const customiser = addOnBundle("customiser");
        const carrier = carrierBundle();
        for (const pack of [customiser, carrier]) {
          const staged = await staff.post(`/api/v1/add-ons/upload?expectedSha512=${encodeURIComponent(pack.integrity)}`, pack.buffer);
          if (![200, 201].includes(staged.status)) throw new Error(`add-on upload: ${JSON.stringify(staged.body).slice(0, 600)}`);
        }
        const app = appBundle({ manifest: FROM_MANIFEST!, seeds });
        expect(app.version).toBe("0.2.6");
        const uploaded = await staff.post(`/api/v1/apps/upload?expectedSha512=${encodeURIComponent(app.integrity)}`, app.buffer);
        if (![200, 201].includes(uploaded.status)) throw new Error(`upload: ${JSON.stringify(uploaded.body).slice(0, 600)}`);
        const body = { key: app.key, version: app.version, connectionId };
        const plan = ok(await staff.post<{ plan: { checksum: string; installable: boolean } }>("/api/v1/apps/plan", { ...body, addOns: [customiser.key, carrier.key] })).plan;
        if (!plan.installable) throw new Error(`not installable: ${JSON.stringify(plan).slice(0, 3000)}`);
        ok(await staff.post("/api/v1/apps/install", { ...body, planChecksum: plan.checksum, addOns: [{ key: customiser.key, version: customiser.version }, { key: carrier.key, version: carrier.version }], shippingUnticked: [] }));
        ok(await staff.patch(`/api/v1/connections/${connectionId}`, { timezone: "Europe/London", currency: "GBP" }));
        await server.setClock(WEDNESDAY, true);
        ok(await staff.post("/api/v1/apps/printing/sample-data"));
        await until(async () => (ok(await staff.get<{ loaded: boolean }>("/api/v1/apps/printing/sample-data")).loaded ? true : undefined), "the sample to be added");
        await server.setClock(WEDNESDAY);
        ok(await staff.put("/api/v1/public-api", { enabled: true }));
        served = ok(await new Caller(server.base).get<typeof served>("/apps/printing/customer/surface-config.json"));
        ok(await staff.put(`${shippingApi}/ship-from`, { name: "Marlow Press", lines: ["3 Market Square"], city: "Marlow", postcode: "SL7 1AA", country: "GB", phone: "+44 1628 482190" }));
        ok(await staff.put(`${shippingApi}/carriers/shipping-shippo/key`, { fields: { api_key: "lab-live-key" } }));
        ok(await staff.put(`${shippingApi}/active-carrier`, { carrier: "shipping-shippo" }));

        // On the release itself: its checkout has no country list and this checkout's shop must still open on it.
        catalogue = await browser().catalogue();
        expect(catalogue.countries).toEqual([]);
        useShop.setState({ catalogue });
        const placed = await place(HOME, [lineOf("business-cards", 250, "j1")]);
        onRelease = { id: placed.order["id"], total: String(placed.order["total"]), delivery: String(placed.order["delivery"]) };
        homeBefore = (await browser().quote(orderBody(HOME, [lineOf("business-cards", 500, "j1")], true))).order;
      }, 600_000);

      afterAll(async () => {
        await server?.stop();
        rmSync(log, { force: true });
        rmSync(seeds, { recursive: true, force: true });
      });

      it("updates in place from 0.2.6, with every order as it was", async () => {
        const manifest = JSON.stringify({ ...(JSON.parse(MANIFEST_TEXT) as Row), version: "0.2.7" });
        const app = appBundle({ manifest });
        const staged = await staff.post(`/api/v1/apps/upload?expectedSha512=${encodeURIComponent(app.integrity)}`, app.buffer);
        expect([200, 201], JSON.stringify(staged.body).slice(0, 600)).toContain(staged.status);
        const plan = ok(await staff.post<{ plan: { checksum: string; installable: boolean; problems: unknown[] } }>("/api/v1/apps/plan", { key: app.key, version: app.version, connectionId })).plan;
        expect([plan.installable, plan.problems]).toEqual([true, []]);
        const reply = await staff.post<{ from: string; to: string }>("/api/v1/apps/printing/update", { planChecksum: plan.checksum, publicAccess: true, publicWider: true, roleTables: true, roleGrants: true });
        expect(reply.status, JSON.stringify(reply.body).slice(0, 1500)).toBe(200);
        expect([reply.body.from, reply.body.to]).toEqual(["0.2.6", "0.2.7"]);
        served = ok(await new Caller(server.base).get<typeof served>("/apps/printing/customer/surface-config.json"));
        const order = (await rows("orders")).find((o) => String(o["id"]) === String(onRelease.id))!;
        expect([money(order["total"]), money(order["delivery"])]).toEqual([money(onRelease.total), money(onRelease.delivery)]);
        expect(order["phone"] ?? null).toBeNull();
        expect(order["delivery_country_id"] ?? null).toBeNull();
        expect(order["country"]).toBe("GB");
      }, 300_000);

      it("changes nothing for a shopper until a country is listed", async () => {
        catalogue = await browser().catalogue();
        useShop.setState({ catalogue });
        expect(catalogue.countries).toEqual([]);
        expect(catalogue.works.homeCountry).toBe("GB");
        const now = (await browser().quote(orderBody(HOME, [lineOf("business-cards", 500, "j1")], true))).order;
        expect([money(now["delivery"]), money(now["tax"]), money(now["total"])]).toEqual([money(homeBefore["delivery"]), money(homeBefore["tax"]), money(homeBefore["total"])]);
        // A country nobody listed cannot be asked for.
        const refused = await refusal({ ...SHOPPER, delivery_method: "deliver", delivery_country_id: 999, phone: PHONE }, [lineOf("business-cards", 250, "j1")]);
        expect(refused).not.toBeNull();
        // And staff are still refused a label to it.
        const made = ok(await staff.post<{ data: Row }>(`/api/v1/data/${connectionId}/${table("orders")}`, { values: { ...SHOPPER, delivery_method: "deliver", country: "DE", phone: PHONE } }), 201).data;
        const quote = await staff.post<{ error?: { code?: string } }>(`${shippingApi}/quotes`, { source: { table: "orders", id: String(made["id"]) }, parcel: { weightKg: 1, lengthCm: 30, widthCm: 20, heightCm: 10, contents: "Printed goods" } });
        expect(quote.status).toBe(422);
        expect(quote.body.error?.code).toBe("OUTSIDE_OWN_COUNTRY");
        expect(notes()).toEqual([]);
      }, 120_000);

      it("sells to a listed country at its own price, and asks for a phone", async () => {
        ok(await staff.put(`${shippingApi}/international`, { countries: ["DE"], currency: "GBP", originCountry: "GB", hsCode: "4911.10" }));
        const row = ok(await staff.post<{ data: Row }>(`/api/v1/data/${connectionId}/${table("delivery_countries")}`, { values: { code: "DE", price: "14.50", active: true } }), 201).data;
        catalogue = await browser().catalogue();
        useShop.setState({ catalogue });
        expect(catalogue.countries.map((c) => [c.code, money(c.price)])).toEqual([["DE", "14.50"]]);

        const lines = [lineOf("business-cards", 250, "j1"), lineOf("flyers", 500, "j2")];
        const values = { ...SHOPPER, delivery_method: "deliver", delivery_country_id: row["id"] };
        const noPhone = await refusal(values, lines);
        expect([noPhone?.column]).toEqual(["phone"]);
        const badPhone = await refusal({ ...values, phone: "call me" }, lines);
        expect([badPhone?.column]).toEqual(["phone"]);

        const placed = await place({ ...values, phone: PHONE }, lines);
        const stored = (await rows("orders")).find((o) => String(o["id"]) === String(placed.order["id"]))!;
        expect([stored["country"], money(stored["delivery"]), stored["phone"]]).toEqual(["DE", "14.50", PHONE]);
        // Tax is on the goods and the delivery, as on any order.
        const subtotal = Number(stored["goods_total"]) + 14.5;
        expect(money(stored["subtotal"])).toBe(money(subtotal));
        german = stored;
        // The phone is never in what the customer's own key reads back.
        expect(JSON.stringify(placed.order)).not.toContain(PHONE);

        // A home order next to it still goes by weight.
        const home = (await browser().quote(orderBody(HOME, [lineOf("business-cards", 500, "j1")], true))).order;
        expect(money(home["delivery"])).toBe(money(homeBefore["delivery"]));

        // Off the list: no new sale, and the order already taken keeps its price.
        ok(await staff.patch(`/api/v1/data/${connectionId}/${table("delivery_countries")}/${String(row["id"])}`, { values: { active: false } }));
        expect((await browser().catalogue()).countries).toEqual([]);
        expect(await refusal({ ...values, phone: PHONE }, lines)).not.toBeNull();
        const kept = (await rows("orders")).find((o) => String(o["id"]) === String(german["id"]))!;
        expect(money(kept["delivery"])).toBe("14.50");
        ok(await staff.patch(`/api/v1/data/${connectionId}/${table("delivery_countries")}/${String(row["id"])}`, { values: { active: true } }));
      }, 180_000);

      it("declares what is really in the parcel, at what was paid, and buys a label with a customs invoice", async () => {
        const jobs = (await rows("jobs")).filter((j) => String(j["order_id"]) === String(german["id"]));
        expect(jobs).toHaveLength(2);
        const kept = jobs.find((j) => j["product_name"] === "Business cards" || Number(j["qty"]) === 250)!;
        const dropped = jobs.find((j) => j !== kept)!;
        ok(await staff.patch(`/api/v1/data/${connectionId}/${table("jobs")}/${String(dropped["id"])}`, { values: { stage: "cancelled" } }));

        const form = ok(await staff.get<{ data: { abroad: boolean; lines: { line: string; quantity: number; unitValue: string; description: string; skuCode?: string; unitWeightKg: number }[]; problems: unknown[] } }>(`${shippingApi}/customs?table=orders&id=${String(german["id"])}`)).data;
        expect(form.problems).toEqual([]);
        expect(form.lines).toHaveLength(1);
        const line = form.lines[0]!;
        expect(line.quantity).toBe(250);
        expect(line.description).toBe(kept["product_name"]);
        expect(line.skuCode).toBe("business-cards");
        // What the customer paid for the line, exact: the rounded "each" would state a different total.
        expect(Math.abs(Number(line.unitValue) * 250 - Number(kept["price"]))).toBeLessThan(0.001);
        expect(line.unitWeightKg).toBeGreaterThan(0);
        expect(line.unitWeightKg * 250).toBeLessThanOrEqual(Number(kept["weight_kg"]));

        const parcel = { weightKg: Math.max(Number(kept["weight_kg"]), 0.1), lengthCm: 30, widthCm: 20, heightCm: 10, contents: "Printed goods" };
        const unticked = await staff.post<{ error?: { code?: string } }>(`${shippingApi}/quotes`, { source: { table: "orders", id: String(german["id"]) }, parcel });
        expect(unticked.body.error?.code).toBe("CUSTOMS_NOT_CONFIRMED");
        const quoted = ok(await staff.post<{ data: { quoteId: string; rates: { rateId: string }[] } }>(`${shippingApi}/quotes`, { source: { table: "orders", id: String(german["id"]) }, parcel, customs: { certified: true } })).data;
        const bought = ok(await staff.post<{ data: { id: string; label: { state: string; customsInvoice: boolean; customsInvoiceOwed: boolean } } }>(`${shippingApi}/bookings`, { quoteId: quoted.quoteId, rateId: quoted.rates[0]!.rateId })).data;
        expect(bought.label).toMatchObject({ state: "ready", customsInvoice: true, customsInvoiceOwed: false });
        germanBooking = bought.id;
        const invoice = await fetch(`${server.base}${shippingApi}/bookings/${bought.id}/documents/customs-invoice`, { headers: { cookie: staff.cookies } });
        expect(invoice.status).toBe(200);

        const sent = notes().find((n) => n.kind === "book")!.customs!;
        expect(sent.certified).toBe(true);
        expect(sent.items).toHaveLength(1);
        expect(sent.items[0]).toMatchObject({ quantity: 250, currency: "GBP", originCountry: "GB", hsCode: "491110", skuCode: "business-cards" });
        expect(String(sent.items[0]!["unitValue"])).toBe(line.unitValue);
        // Adminium writes the number onto the order in the background, once the label is safely recorded.
        await until(async () => {
          const after = (await rows("orders")).find((o) => String(o["id"]) === String(german["id"]))!;
          return after["label_tracking"] === "LAB100001" ? true : undefined;
        }, "the label's number on the order", 60_000);
      }, 180_000);

      it("takes a customer's label and customs invoice when they delete their own details", async () => {
        const country = (await rows("delivery_countries")).find((c) => c["code"] === "DE")!;
        const email = "erika@vogel-studio.dev";
        const placed = await place({ ...SHOPPER, name: "Erika Vogel", email, delivery_method: "deliver", delivery_country_id: country["id"], phone: PHONE }, [lineOf("flyers", 500, "j1")]);
        const order = placed.order["id"];
        const job = (await rows("jobs")).find((j) => String(j["order_id"]) === String(order))!;
        const parcel = { weightKg: Math.max(Number(job["weight_kg"]), 0.1), lengthCm: 30, widthCm: 20, heightCm: 10, contents: "Printed goods" };
        const quoted = ok(await staff.post<{ data: { quoteId: string; rates: { rateId: string }[] } }>(`${shippingApi}/quotes`, { source: { table: "orders", id: String(order) }, parcel, customs: { certified: true } })).data;
        const booked = ok(await staff.post<{ data: { id: string } }>(`${shippingApi}/bookings`, { quoteId: quoted.quoteId, rateId: quoted.rates[0]!.rateId })).data;
        expect((await documentOf(booked.id, "label")).status).toBe(200);
        expect((await documentOf(booked.id, "customs-invoice")).status).toBe(200);

        // Her own door: the link from her e-mail, then "Delete my details".
        const customer = createPublicClient({ baseUrl: server.base, publishableKey: served.publishableKey, fetch: originFetch })!;
        ok(await staff.put("/api/v1/settings/email", { publicOrigin: server.base }));
        const before = (await sinkMail(server.sink)).length;
        await customer.requestLink({ email });
        const mail = await until(async () => (await sinkMail(server.sink)).slice(before).find((m) => m.to.includes(email) && /\b\d{6}\b/.test(m.text)), "her sign-in code", 60_000);
        expect(await customer.verifyLinkCode({ email, code: /\b(\d{6})\b/.exec(mail.text)![1]! })).toMatchObject({ ok: true });
        await customer.forgetMe();

        for (const kind of ["label", "customs-invoice"] as const) {
          const gone = await documentOf(booked.id, kind);
          expect(gone.status, kind).toBeGreaterThanOrEqual(400);
          expect(((await gone.json()) as { error?: { code?: string } }).error?.code, kind).toBe("LABEL_GONE");
        }
        const kept = (await rows("orders")).find((o) => String(o["id"]) === String(order))!;
        expect(kept["phone"] ?? null).toBeNull();
        // Another customer's parcel is not hers to delete.
        expect((await documentOf(germanBooking, "label")).status).toBe(200);
        expect((await documentOf(germanBooking, "customs-invoice")).status).toBe(200);
      }, 180_000);

      it("erases the customer's phone with the rest of their details", async () => {
        ok(await staff.post("/api/v1/privacy/erase", { address: SHOPPER.email, confirm: SHOPPER.email }));
        const after = (await rows("orders")).find((o) => String(o["id"]) === String(german["id"]))!;
        expect(after["phone"] ?? null).toBeNull();
      }, 120_000);
    });
  });
});
