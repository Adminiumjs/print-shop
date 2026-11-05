/**
 * EVERY E-MAIL THE WORKS SENDS, SENT BY A BUILT ADMINIUM.
 *
 * This repo's manifest and sample, installed with the Customiser on a BUILT
 * Adminium (`ADMINIUM_REPO`) on SQLite, Postgres and MySQL, at the comp's
 * pinned moment (10:20 on Wednesday 5 August 2026 in Marlow), the customer
 * side opened as its build opens it. A shopper with an address the outbox
 * really sends to (the sample's customers are on `.example`, which it never
 * sends to), and the works' own address moved to one too; then each e-mail is
 * made happen the way it happens at the works, and taken as sent only when
 * its outbox row says `sent` AND the e-mail server holds it, to that address,
 * under the subject the installed template gives it (`mail.ts`):
 *
 *   order received (with the order's own link, its jobs, its money), proof
 *   ready, proof approved, ready to collect, on its way (with DHL's tracking
 *   number, and with the works' own courier), quote saved (with the quote's
 *   own link), sample pack posted, the delivery quote of an order over the
 *   delivery bands (and its order-received e-mail saying the delivery is to
 *   quote), and the works' two copies: a change asked, and a new order whose
 *   customer accepted an artwork warning.
 *
 * Last, no row of the outbox failed: an e-mail naming a variable Adminium
 * does not fill (a settings column the works has not got, a personal column
 * of a linked row) would sit there `failed`, "Not sent: nothing fills …".
 *
 * It runs with `CONTRACT=1` where a built Adminium and a built add-ons
 * checkout are, and says why it skipped otherwise. Its ports start at
 * `CONTRACT_PORT_BASE` (4980), three an engine.
 */
import { rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { checkFile } from "../shop/checks.ts";
import { firstChoice, jobValues } from "../shop/config.ts";
import { AdminiumShop } from "../shop/door.ts";
import { type Catalogue, type Row } from "../shop/port.ts";
import { orderBody, useShop, type BasketLine } from "../shop/store.ts";
import { addOnBundle, appBundle, boot, Caller, ENGINES, missing, missingAddOn, ok, PORTS_PER_ENGINE, until, type Engine, type Server } from "./harness.ts";
import { MANIFEST_TEXT } from "./release.ts";
import { delivered, sinkMail, type Mail } from "./mail.ts";

const why = missing() ?? missingAddOn("customiser");
if (why !== null && process.env["ADMINIUM_REQUIRE_CONTRACT"] === "1") throw new Error(`the mail contract must run here, and cannot: ${why}`);
const PORT_BASE = Number(process.env["CONTRACT_PORT_BASE"] ?? 4980);
const ADMIN = { email: process.env["E2E_ADMIN_EMAIL"] ?? "e2e@adminium.local", password: process.env["E2E_ADMIN_PASSWORD"] ?? "adminium-e2e-password" };
/** 10:20 on Wednesday 5 August 2026 in Marlow (British Summer Time), before the two o'clock cut-off. */
const WEDNESDAY = Date.parse("2026-08-05T09:20:00Z");
const MANIFEST = MANIFEST_TEXT;
/** A shopper the outbox sends to: not a reserved example domain. */
const SHOPPER = { name: "Ruth Okafor", email: "ruth@okafor-studio.dev", address_line1: "4 Mill Lane", town: "Bourne End", postcode: "SL8 5PQ", may_email: false, language: "en-US" };
/** The works' own address for its copies. */
const WORKS = "orders@marlow-press.dev";
/** A one-page PDF: the proof as the works' prepress exports it. */
const PDF = Buffer.from("%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 258 173] >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n", "latin1");

/** A print-ready PDF for 85 × 55 mm cards, both sides, but in RGB: one warning to accept. */
function artwork(): File {
  const pt = (mm: number) => ((mm * 72) / 25.4).toFixed(2);
  const page = `<< /Type /Page /MediaBox [0 0 ${pt(91)} ${pt(61)}] >>\n`;
  return new File([`%PDF-1.4\n${page}${page}/ColorSpace /DeviceRGB\n<< /Type /Font /FontFile2 3 0 R >>\n%%EOF\n`], "ruth-cards.pdf", { type: "application/pdf" });
}

describe.skipIf(why !== null)(`every e-mail, sent by a built Adminium${why === null ? "" : ` — skipped: ${why}`}`, () => {
  ENGINES.forEach(([engine, available], index) => {
    describe.skipIf(!available)(`on ${engine}`, () => {
      let server: Server;
      let staff: Caller;
      let connectionId = "";
      let served: { publishableKey: string; publicKeys?: Record<string, string>; tables?: Record<string, string>; settings?: Record<string, unknown> };
      let shop: AdminiumShop;
      let catalogue: Catalogue;
      const tables = () => served.tables ?? {};
      const table = (ref: string) => encodeURIComponent(tables()[ref] ?? `printing_${ref}`);
      const originFetch: typeof fetch = (input, init) => {
        const headers = new Headers(init?.headers);
        headers.set("origin", server.base);
        return fetch(input, { ...init, headers });
      };
      const browser = () => new AdminiumShop({ baseUrl: server.base, publishableKey: served.publishableKey, ...(served.tables === undefined ? {} : { tables: served.tables }), ...(served.publicKeys === undefined ? {} : { publicKeys: served.publicKeys }), ...(served.settings === undefined ? {} : { settings: served.settings }) }, { fetch: originFetch });
      const rows = async (ref: string): Promise<Row[]> => {
        const out: Row[] = [];
        for (let offset = 0; ; offset += 200) {
          const page = ok(await staff.get<{ data: Row[] }>(`/api/v1/data/${connectionId}/${table(ref)}?limit=200&offset=${String(offset)}`)).data;
          out.push(...page);
          if (page.length < 200) return out;
        }
      };
      const patch = async (ref: string, id: unknown, values: Row, from?: string) => ok(await staff.patch(`/api/v1/data/${connectionId}/${table(ref)}/${String(id)}`, { values, ...(from === undefined ? {} : { from }) }));
      /** The outbox row of one kind about one row of the link. */
      const message = (kind: string, link: string, id: unknown) => async () => (await rows("messages")).find((m) => m["kind"] === kind && String(m[link]) === String(id));
      const productOf = (code: string) => catalogue.products.find((p) => p.code === code)!;
      const optionOf = (code: string, kind: string, option: string) => catalogue.options.find((o) => String(o.productId) === String(productOf(code).id) && o.kind === kind && o.code === option)!.id;
      const cards = (qty: number): BasketLine => {
        const p = productOf("business-cards");
        return { id: "j1", productId: p.id, choice: { ...firstChoice(catalogue, p), qty, laminationId: optionOf("business-cards", "lamination", "lam-both"), look: "matt" }, design: null, features: [], artwork: [] };
      };
      const flyers = (qty: number): BasketLine => {
        const p = productOf("flyers");
        return { id: "j2", productId: p.id, choice: { ...firstChoice(catalogue, p), qty }, design: null, features: [], artwork: [] };
      };
      let keys = 0;
      const place = async (lines: BasketLine[], method: "collect" | "deliver") => {
        const values = { ...SHOPPER, delivery_method: method };
        const quoted = await shop.quote(orderBody(values, lines, true));
        keys += 1;
        return shop.place(orderBody(values, lines, true), `printing-mail-${engine}-${String(keys).padStart(10, "0")}`, String(quoted.order["total"]));
      };
      const jobsOf = async (order: Row) => (await rows("jobs")).filter((j) => String(j["order_id"]) === String(order["id"]));
      const sendProof = async (job: Row): Promise<Row> => {
        const stored = ok(await staff.send<{ ref: string }>("POST", `/api/v1/files?${new URLSearchParams({ filename: "proof.pdf", connectionId, table: tables()["proofs"] ?? "printing_proofs", column: "file" }).toString()}`, PDF, { "content-type": "application/pdf" }), 201);
        return ok(await staff.post<{ data: Row }>(`/api/v1/data/${connectionId}/${table("proofs")}`, { values: { job_id: job["id"], kind: "email", file: stored.ref } }), 201).data;
      };
      /** A job approved, printed and ready, and its order with it. */
      const finish = async (order: Row) => {
        for (const job of await jobsOf(order)) {
          const proof = await sendProof(job);
          await patch("proofs", proof["id"], { state: "approved" }, "sent");
          await patch("jobs", job["id"], { stage: "printing" }, "prepress");
          await patch("jobs", job["id"], { stage: "ready" }, "printing");
        }
        await patch("orders", order["id"], { status: "ready" }, "placed");
      };

      beforeAll(async () => {
        server = await boot(engine as Engine, PORT_BASE + index * PORTS_PER_ENGINE, WEDNESDAY - 60_000, { database: `printing_mail_${engine}${process.env["CONTRACT_DB_SUFFIX"] ?? ""}` });
        staff = new Caller(server.base, { origin: server.base });
        await staff.signIn(ADMIN.email, ADMIN.password);
        if (engine === "sqlite") {
          const file = join(tmpdir(), `printing-mail-contract-${String(PORT_BASE)}.db`);
          rmSync(file, { force: true });
          writeFileSync(file, "");
          connectionId = ok(await staff.post<{ id: string }>("/api/v1/connections", { name: "marlow-press", engine: "sqlite", dsn: `sqlite:${file}` }), 201).id;
        } else {
          // The e2e Northwind: the install's prefixed tables sit beside its bare `orders`, `products` and `customers`.
          connectionId = ok(await staff.get<{ connections: { id: string; name: string }[] }>("/api/v1/connections")).connections.find((c) => c.name === "northwind")!.id;
        }
        const addOn = addOnBundle("customiser");
        const stagedAddOn = await staff.post(`/api/v1/add-ons/upload?expectedSha512=${encodeURIComponent(addOn.integrity)}`, addOn.buffer);
        if (![200, 201].includes(stagedAddOn.status)) throw new Error(`add-on upload: ${JSON.stringify(stagedAddOn.body).slice(0, 600)}`);
        const app = appBundle({ manifest: MANIFEST_TEXT });
        const staged = await staff.post(`/api/v1/apps/upload?expectedSha512=${encodeURIComponent(app.integrity)}`, app.buffer);
        if (![200, 201].includes(staged.status)) throw new Error(`upload: ${JSON.stringify(staged.body).slice(0, 600)}`);
        const body = { key: app.key, version: app.version, connectionId };
        const plan = ok(await staff.post<{ plan: { checksum: string; installable: boolean } }>("/api/v1/apps/plan", body)).plan;
        if (!plan.installable) throw new Error(`not installable: ${JSON.stringify(plan).slice(0, 4000)}`);
        const installed = ok(await staff.post<{ rules: { skipped: unknown[] } }>("/api/v1/apps/install", { ...body, planChecksum: plan.checksum, addOns: [{ key: addOn.key, version: addOn.version }] }));
        if (installed.rules.skipped.length > 0) throw new Error(`the install skipped rules: ${JSON.stringify(installed.rules.skipped).slice(0, 1500)}`);
        ok(await staff.patch(`/api/v1/connections/${connectionId}`, { timezone: "Europe/London", currency: "GBP" }));
        await server.setClock(WEDNESDAY, true);
        ok(await staff.post("/api/v1/apps/printing/sample-data"));
        await until(async () => (ok(await staff.get<{ loaded: boolean }>("/api/v1/apps/printing/sample-data")).loaded ? true : undefined), "the sample to be added");
        ok(await staff.put("/api/v1/public-api", { enabled: true }));
        ok(await staff.put("/api/v1/settings/email", { publicOrigin: server.base }));
        served = ok(await new Caller(server.base).get<typeof served>("/apps/printing/customer/surface-config.json"));
        // On Postgres and MySQL the sample says it is loaded before the rows it adds through the Customiser's section are in.
        await until(async () => ((await rows("jobs")).length >= 15 ? true : undefined), "the sample's jobs to be added");
        await server.setClock(WEDNESDAY);
        const settings = (await rows("settings"))[0]!;
        await patch("settings", settings["id"], { email: WORKS });
        shop = browser();
        catalogue = await shop.catalogue();
        useShop.setState({ catalogue });
      }, 600_000);

      afterAll(async () => {
        await server?.stop();
      });

      let collect: Awaited<ReturnType<AdminiumShop["place"]>>;
      let received: Mail | null = null;

      it("sends the order received: its jobs, its money, the day it is ready, and the order's own link", async () => {
        collect = await place([cards(500)], "collect");
        const { mail } = await delivered({ sink: server.sink, manifest: MANIFEST, kind: "order-received", to: SHOPPER.email, known: { "order.number": String(collect.order["number"]) }, row: message("order-received", "order_id", collect.order["id"]), body: new RegExp(`/order#${collect.link!.token}`) });
        expect(mail.text).toContain("500 × Business cards");
        expect(mail.text).toMatch(/Total: £\d+\.\d\d/);
        expect(mail.text).toContain("Collection from the works: £0.00");
        expect(mail.text).toMatch(/Ready by: Monday, (10 August|August 10), 2026/);
        expect(mail.text).toContain("This link is just for you");
        expect(mail.text).toContain("Marlow Press · 3 Market Square, Marlow SL7 1AA");
        expect(mail.text).toContain(`because of your order ${String(collect.order["number"])}`);
        received = mail;
      }, 240_000);

      // MAIL-BRAND: Adminium heads an app's mail with the workspace's name, not the app's own (its outbox's `settings.name`).
      it.fails("heads the customer's e-mail with the works' name, never Adminium's", () => {
        const band = /font-size:15px;font-weight:800;letter-spacing:-\.01em;[^"]*">([^<]*)</.exec(received?.html ?? "");
        expect(band?.[1]).toBe("Marlow Press");
      });

      it("sends the proof ready, then the proof approved", async () => {
        const [job] = await jobsOf(collect.order);
        const proof = await sendProof(job!);
        const ready = await delivered({ sink: server.sink, manifest: MANIFEST, kind: "proof-ready", to: SHOPPER.email, row: message("proof-ready", "order_id", collect.order["id"]), body: new RegExp(`/order#${collect.link!.token}`) });
        expect(ready.mail.text).toContain("Open the proof (PDF)");
        expect(ready.mail.text).toContain("500 × Business cards");
        // The customer's yes, through the order's own link as the e-mail opens it.
        const door = browser().after();
        expect(await door.openShared(collect.link!.token)).toBe("opened");
        await door.answerProof("link", proof["id"] as number, { state: "approved" });
        const approved = await delivered({ sink: server.sink, manifest: MANIFEST, kind: "proof-approved", to: SHOPPER.email, row: message("proof-approved", "order_id", collect.order["id"]) });
        expect(approved.mail.text).toContain("Ready by:");
      }, 240_000);

      it("sends ready to collect, with where and what to pay", async () => {
        const [job] = await jobsOf(collect.order);
        await patch("jobs", job!["id"], { stage: "printing" }, "prepress");
        await patch("jobs", job!["id"], { stage: "ready" }, "printing");
        await patch("orders", collect.order["id"], { status: "ready" }, "placed");
        const { mail } = await delivered({ sink: server.sink, manifest: MANIFEST, kind: "order-ready", to: SHOPPER.email, row: message("order-ready", "order_id", collect.order["id"]) });
        expect(mail.text).toContain("Where: 3 Market Square, Marlow SL7 1AA");
        expect(mail.text).toMatch(/You pay £\d+\.\d\d when you collect/);
      }, 240_000);

      it("sends on its way: with DHL's tracking number and its link, and with the works' own courier", async () => {
        const dhl = await place([cards(250)], "deliver");
        await finish(dhl.order);
        await patch("orders", dhl.order["id"], { tracking: "00340012345678901234" });
        await patch("orders", dhl.order["id"], { status: "dispatched" }, "ready");
        const tracked = await delivered({ sink: server.sink, manifest: MANIFEST, kind: "order-dispatched", to: SHOPPER.email, known: { "order.number": String(dhl.order["number"]) }, row: message("order-dispatched", "order_id", dhl.order["id"]) });
        expect(tracked.mail.text).toContain("Tracking number: 00340012345678901234");
        expect(tracked.mail.text).toContain("tracking-id=00340012345678901234");

        const courier = await place([cards(100)], "deliver");
        await finish(courier.order);
        await patch("orders", courier.order["id"], { status: "dispatched" }, "ready");
        const sent = await delivered({ sink: server.sink, manifest: MANIFEST, kind: "order-dispatched", to: SHOPPER.email, known: { "order.number": String(courier.order["number"]) }, row: message("order-dispatched", "order_id", courier.order["id"]) });
        expect(sent.mail.text).toContain("Sent with: Our courier");
        expect(sent.mail.text).not.toContain("Track it");
      }, 480_000);

      it("sends the works its copy of a change asked, with the customer's words", async () => {
        const order = await place([cards(1000)], "collect");
        const [job] = await jobsOf(order.order);
        const proof = await sendProof(job!);
        const door = browser().after();
        expect(await door.openShared(order.link!.token)).toBe("opened");
        await door.answerProof("link", proof["id"] as number, { state: "change_asked", change_note: "Make the phone number bigger." });
        const { mail } = await delivered({ sink: server.sink, manifest: MANIFEST, kind: "change-asked", to: WORKS, row: message("change-asked", "order_id", order.order["id"]) });
        expect(mail.text).toContain("Make the phone number bigger.");
        expect(mail.text).toContain(`Sent to the works about ${String(order.order["number"])}`);
        expect(mail.text).toContain(`${server.base}/apps/printing/staff/`);
      }, 240_000);

      it("sends the works its copy of a new order whose artwork warning was accepted", async () => {
        const file = artwork();
        const checks = await checkFile(file, { trim: { w: 85, h: 55 }, sides: 2, minDpi: 150 });
        const upload = await shop.upload(file, file.name);
        const line: BasketLine = { ...cards(500), artwork: [{ id: "f1", name: file.name, size: file.size, status: "in", refusal: null, rows: checks, accepted: true, upload }] };
        const order = await place([line], "collect");
        expect(Number(order.order["has_warnings"] ?? (await rows("orders")).find((o) => String(o["id"]) === String(order.order["id"]))!["has_warnings"])).toBe(1);
        const { mail } = await delivered({ sink: server.sink, manifest: MANIFEST, kind: "warnings-accepted", to: WORKS, row: message("warnings-accepted", "order_id", order.order["id"]) });
        expect(mail.text).toContain("500 × Business cards");
      }, 240_000);

      it("sends the quote saved, with the quote's own link", async () => {
        const door = browser();
        const letterheads = productOf("letterheads");
        const body = { values: { email: SHOPPER.email, name: SHOPPER.name, language: "en-US", delivery_method: "collect" }, children: { quote_lines: [{ values: jobValues(catalogue, letterheads, firstChoice(catalogue, letterheads), 250) }] } };
        const priced = await door.priceQuote(body);
        const saved = await door.saveQuote(body, `printing-mail-${engine}-quote-000001`, String(priced.quote["total"]));
        const { mail } = await delivered({ sink: server.sink, manifest: MANIFEST, kind: "quote-saved", to: SHOPPER.email, known: { "quote.number": String(saved.quote["number"]) }, row: message("quote-saved", "quote_id", saved.quote["id"]), body: new RegExp(`/quote#${saved.link!.token}`) });
        expect(mail.text).toContain("250 × Letterheads");
        expect(mail.text).toContain("Prices can change");
      }, 240_000);

      it("sends the sample pack posted", async () => {
        const door = browser().after();
        const stocks = catalogue.materials.filter((m) => m.code === "silk350").map((m) => ({ values: { material_id: m.id } }));
        await door.askSamples({ values: { name: SHOPPER.name, email: SHOPPER.email, address_line1: SHOPPER.address_line1, town: SHOPPER.town, postcode: SHOPPER.postcode, language: "en-US", client_key: `printing-mail-${engine}-pack-000001` }, children: { sample_stocks: stocks } });
        const request = (await rows("sample_requests")).find((r) => r["email"] === SHOPPER.email)!;
        await patch("sample_requests", request["id"], { status: "posted" }, "new");
        const { mail } = await delivered({ sink: server.sink, manifest: MANIFEST, kind: "sample-pack-sent", to: SHOPPER.email, row: message("sample-pack-sent", "sample_id", request["id"]) });
        expect(mail.text).toContain("There's no charge.");
        expect(mail.text).toMatch(/Posted: \w+day/);
      }, 240_000);

      it("says the delivery of an order over the bands is to quote, then sends the works' delivery quote to accept", async () => {
        const heavy = await place([flyers(20000)], "deliver");
        const received = await delivered({ sink: server.sink, manifest: MANIFEST, kind: "order-received", to: SHOPPER.email, known: { "order.number": String(heavy.order["number"]) }, row: message("order-received", "order_id", heavy.order["id"]) });
        expect(received.mail.text).toContain("Delivery: we'll e-mail a quote");
        await patch("orders", heavy.order["id"], { delivery_quote: "32.80", delivery_quote_state: "sent" });
        const { mail } = await delivered({ sink: server.sink, manifest: MANIFEST, kind: "delivery-quote", to: SHOPPER.email, row: message("delivery-quote", "order_id", heavy.order["id"]), body: new RegExp(`/order#${heavy.link!.token}`) });
        const order = (await rows("orders")).find((o) => String(o["id"]) === String(heavy.order["id"]))!;
        expect(mail.text).toContain("£32.80");
        expect(mail.text).toContain(`Total with delivery: ${new Intl.NumberFormat("en-US", { style: "currency", currency: "GBP" }).format(Number(order["quote_total"]))}`);
        expect(Number(order["quote_total"])).toBeCloseTo((Number(order["goods_total"]) + 32.8) * 1.2, 1);
      }, 240_000);

      it("leaves no e-mail failed: every one names only what Adminium fills", async () => {
        const failed = (await rows("messages")).filter((m) => m["status"] === "failed").map((m) => [m["kind"], m["error"]]);
        expect(failed).toEqual([]);
        const all = await sinkMail(server.sink);
        expect(all.length).toBeGreaterThanOrEqual(10);
        // `MAIL_DUMP=<file>` keeps what the sink holds, to read the e-mails as sent.
        const dump = process.env["MAIL_DUMP"];
        if (dump !== undefined && dump !== "") writeFileSync(dump.replace("{engine}", engine), JSON.stringify(all, null, 2));
      }, 60_000);
    });
  });
});
