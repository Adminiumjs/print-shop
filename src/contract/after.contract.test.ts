/**
 * AFTER THE ORDER, ON A BUILT ADMINIUM, THROUGH THE SHOP'S OWN DOOR.
 *
 * The app and the Customiser it requires are installed on a BUILT Adminium
 * (`ADMINIUM_REPO`, the core at 0.3.53) as an operator installs them, the
 * sample added at the moment the comps pin the works to (10:20 on Wednesday
 * 5 August 2026 in Marlow), and the shop opened the way its customer build
 * opens it. Harbour Bakery orders 500 business cards; the works sends a
 * proof (its PDF stored through the files route); then, each through the
 * door the shop's pages use (`after-port.ts`):
 *
 * - the order's own link (the one the save handed the confirmation) opens
 *   that one order and no other, a link that is nobody's opens nothing; the
 *   proof's PDF is read through it, and the proof APPROVED by the customer's
 *   claimed write on Thursday afternoon: Adminium lets the job go to press
 *   and stores its ready-by again from the approval (Monday 10 August when
 *   placed, Wednesday 12 August once approved past the cut-off);
 * - the lookup: a code asked for the address, read from the e-mail Adminium
 *   sent, a wrong one said as wrong, the right one typed back; the
 *   customer's own orders read (Harbour Bakery's, nobody else's); a second
 *   proof answered with a CHANGE in the customer's words, the job held back;
 * - a past job priced again on today's rate card by a dry run;
 * - a quote saved (its `MQ-` number, its total held), read by its own link,
 *   renamed through it, and listed among the signed-in customer's own;
 * - a sample pack asked for, its stocks as links; a second to an address
 *   that has had one refused;
 * - the works' delivery quote accepted through the order's link, the
 *   order's delivery and total moving to it.
 *
 * It runs with `CONTRACT=1` where a built Adminium and a built add-ons
 * checkout are, and says why it skipped otherwise. It runs on SQLite (the
 * works' database is a file it makes), and on Postgres and MySQL beside the
 * e2e Northwind's bare tables when their URLs are set.
 */
import { rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { sampleRefusal, samePlace, valuesOf } from "../shop/after.ts";
import type { DeliveryAnswer } from "../shop/after-port.ts";
import { firstChoice, jobValues } from "../shop/config.ts";
import { AdminiumShop } from "../shop/door.ts";
import { isShopError, type Catalogue, type Row } from "../shop/port.ts";
import { orderBody, useShop, type BasketLine } from "../shop/store.ts";
import { addOnBundle, appBundle, boot, Caller, ENGINES, missing, missingAddOn, ok, PORTS_PER_ENGINE, until, type Engine, type Server } from "./harness.ts";
import { MANIFEST_TEXT } from "./release.ts";

const why = missing() ?? missingAddOn("customiser");
if (why !== null && process.env["ADMINIUM_REQUIRE_CONTRACT"] === "1") throw new Error(`the contract must run here, and cannot: ${why}`);
const PORT_BASE = Number(process.env["CONTRACT_PORT_BASE"] ?? 4980);
const ADMIN = { email: process.env["E2E_ADMIN_EMAIL"] ?? "e2e@adminium.local", password: process.env["E2E_ADMIN_PASSWORD"] ?? "adminium-e2e-password" };
/** 10:20 on Wednesday 5 August 2026 in Marlow (British Summer Time), before the two o'clock cut-off. */
const WEDNESDAY = Date.parse("2026-08-05T09:20:00Z");
/** 15:00 on Thursday 6 August, past the cut-off: when the customer approves the first proof. */
const THURSDAY_LATE = Date.parse("2026-08-06T14:00:00Z");
const HARBOUR = { name: "Harbour Bakery", email: "hello@harbourbakery.example", address_line1: "12 Quay Street", town: "Marlow", postcode: "SL7 1BT", may_email: false, language: "en-US" };
/** A one-page PDF: the proof as the works' prepress exports it. */
const PDF = Buffer.from("%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 258 173] >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n", "latin1");

interface Mail {
  to: string[];
  subject: string;
  text: string;
  html: string;
}

describe.skipIf(why !== null)(`after the order, on a built Adminium${why === null ? "" : ` — skipped: ${why}`}`, () => {
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
      /** A new browser: its own door, holding no session. */
      const browser = () => new AdminiumShop({ baseUrl: server.base, publishableKey: served.publishableKey, ...(served.tables === undefined ? {} : { tables: served.tables }), ...(served.publicKeys === undefined ? {} : { publicKeys: served.publicKeys }), ...(served.settings === undefined ? {} : { settings: served.settings }) }, { fetch: originFetch });
      const rows = async (ref: string): Promise<Row[]> => ok(await staff.get<{ data: Row[] }>(`/api/v1/data/${connectionId}/${table(ref)}?limit=200`)).data;
      const mail = async (): Promise<Mail[]> => (await (await fetch(`${server.sink}/messages`)).json()) as Mail[];
      const mailTo = (address: string, match: RegExp, after = 0) =>
        until(async () => (await mail()).slice(after).filter((m) => m.to.includes(address) && match.test(`${m.text}\n${m.html}`)).at(-1), `an e-mail to ${address} matching ${String(match)}`, 60_000).catch(async (error: unknown) => {
          throw new Error(`${String(error)}; the sink holds: ${JSON.stringify((await mail()).map((m) => [m.to, m.subject]))}`);
        });
      const said = (error: unknown) => (isShopError(error) ? JSON.stringify({ code: error.refused.code, column: error.refused.column, reason: error.refused.reason, child: error.refused.child }) : String(error));
      const yes = (value: unknown) => value === true || value === 1 || value === "1";

      beforeAll(async () => {
        server = await boot(engine as Engine, PORT_BASE + index * PORTS_PER_ENGINE, WEDNESDAY - 60_000, { database: `printing_after_${engine}${process.env["CONTRACT_DB_SUFFIX"] ?? ""}` });
        staff = new Caller(server.base, { origin: server.base });
        await staff.signIn(ADMIN.email, ADMIN.password);
        if (engine === "sqlite") {
          const file = join(tmpdir(), `printing-after-contract-${engine}-${String(PORT_BASE)}.db`);
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
        if (!plan.installable) {
          const { create: _create, ...rest } = plan as Record<string, unknown>;
          throw new Error(`not installable: ${JSON.stringify(rest).slice(0, 4000)}`);
        }
        const installed = ok(await staff.post<{ rules: { skipped: unknown[] } }>("/api/v1/apps/install", { ...body, planChecksum: plan.checksum, addOns: [{ key: addOn.key, version: addOn.version }] }));
        if (installed.rules.skipped.length > 0) throw new Error(`the install skipped rules: ${JSON.stringify(installed.rules.skipped).slice(0, 1500)}`);
        ok(await staff.patch(`/api/v1/connections/${connectionId}`, { timezone: "Europe/London", currency: "GBP" }));
        await server.setClock(WEDNESDAY, true);
        ok(await staff.post("/api/v1/apps/printing/sample-data"));
        await until(async () => (ok(await staff.get<{ loaded: boolean }>("/api/v1/apps/printing/sample-data")).loaded ? true : undefined), "the sample to be added");
        // On Postgres and MySQL the sample says it is loaded before the rows it adds through the Customiser's section are in.
        await until(async () => (ok(await staff.get<{ data: Row[] }>(`/api/v1/data/${connectionId}/printing_jobs?limit=200`)).data.length >= 15 ? true : undefined), "the sample's jobs to be added");
        await server.setClock(WEDNESDAY);
        ok(await staff.put("/api/v1/public-api", { enabled: true }));
        ok(await staff.put("/api/v1/settings/email", { publicOrigin: server.base }));

        served = ok(await new Caller(server.base).get<typeof served>("/apps/printing/customer/surface-config.json"));
        shop = browser();
        catalogue = await shop.catalogue();
        useShop.setState({ catalogue });
      }, 420_000);

      afterAll(async () => {
        await server?.stop();
      });

      const productOf = (code: string) => catalogue.products.find((p) => p.code === code)!;
      const optionOf = (code: string, kind: string, option: string) => catalogue.options.find((o) => String(o.productId) === String(productOf(code).id) && o.kind === kind && o.code === option)!.id;
      const cards = (qty: number): BasketLine => {
        const p = productOf("business-cards");
        return { id: "j1", productId: p.id, choice: { ...firstChoice(catalogue, p), qty, laminationId: optionOf("business-cards", "lamination", "lam-both"), look: "matt" }, design: null, features: [], artwork: [] };
      };
      /** An order placed through the shop's door, as its checkout places it. */
      const place = async (door: AdminiumShop, line: BasketLine, key: string, values: Row = { ...HARBOUR, delivery_method: "collect" }) => {
        const body = orderBody(values, [line], true);
        const quoted = await door.quote(body);
        return door.place(body, key, String(quoted.order["total"]));
      };
      /** The works sends a proof of a job: its PDF stored through the files route, then the proof row. */
      const sendProof = async (job: Row): Promise<Row> => {
        const stored = ok(await staff.send<{ ref: string }>("POST", `/api/v1/files?${new URLSearchParams({ filename: "proof.pdf", connectionId, table: tables()["proofs"] ?? "printing_proofs", column: "file" }).toString()}`, PDF, { "content-type": "application/pdf" }), 201);
        return ok(await staff.post<{ data: Row }>(`/api/v1/data/${connectionId}/${table("proofs")}`, { values: { job_id: job["id"], kind: "email", file: stored.ref } }), 201).data;
      };

      let placed: Awaited<ReturnType<AdminiumShop["place"]>>;
      let job: Row;

      it("opens the order by its own link, reads its proof's PDF, and approves it: the job may go to press, its ready-by stored again", async () => {
        placed = await place(shop, cards(500), `printing-after-${engine}-0000000001`);
        expect(placed.order["number"]).toBe("MP-4127");
        job = (await rows("jobs")).find((j) => String(j["order_id"]) === String(placed.order["id"]))!;
        const proof = await sendProof(job);

        const door = browser().after();
        expect(door.sharedHeld()).toBe(false);
        expect(await door.openShared("AAAAAAAAAAAAAAAA")).toBe("unknown");
        expect(await door.openShared(placed.link!.token)).toBe("opened");
        const read = (await door.readShared())!;
        expect([read.order["number"], read.jobs.length, read.proofs.map((p) => [Number(p["version"]), p["state"]])]).toEqual(["MP-4127", 1, [[1, "sent"]]]);
        // That order alone: the link reaches no other job.
        expect(read.jobs.every((j) => String(j["order_id"]) === String(placed.order["id"]))).toBe(true);
        expect(read.jobs[0]).toHaveProperty("design_code");

        const pdf = await door.proofFile("link", proof["id"] as number);
        expect(Buffer.from(await pdf.blob.arrayBuffer()).subarray(0, 8).toString("latin1")).toBe("%PDF-1.4");

        const before = (await rows("jobs")).find((j) => String(j["id"]) === String(job["id"]))!;
        expect([before["proof_state"], Number(before["proof_ok"])]).toEqual(["sent", 0]);
        // Placed at 10:20 on Wednesday, before the cut-off: three working days on, Monday 10 August.
        expect(String(before["ready_by"]).slice(0, 10)).toBe("2026-08-10");
        // The customer answers on Thursday afternoon, past the two o'clock cut-off: the work starts Friday.
        await server.setClock(THURSDAY_LATE);
        // A day on, the link in the e-mail is opened again: the session the first visit held has run out.
        expect(await door.openShared(placed.link!.token)).toBe("opened");
        const answered = await door.answerProof("link", proof["id"] as number, { state: "approved" }).catch((e: unknown) => {
          throw new Error(`the approval was refused: ${said(e)}`);
        });
        expect(answered["state"]).toBe("approved");
        const after = (await rows("jobs")).find((j) => String(j["id"]) === String(job["id"]))!;
        expect([after["proof_state"], Number(after["proof_ok"]), Number(after["turnaround_days"])]).toEqual(["approved", 1, 3]);
        // The ready-by is stored again from the approval: Friday and three working days on, Wednesday 12 August.
        expect(String(after["ready_by"]).slice(0, 10)).toBe("2026-08-12");
        expect((await rows("proofs")).find((p) => String(p["id"]) === String(proof["id"]))!["answered_at"]).not.toBeNull();

        // A proof answered is answered: a second answer is refused.
        const again = await door.answerProof("link", proof["id"] as number, { state: "change_asked", change_note: "Bigger" }).catch((e: unknown) => e);
        expect(isShopError(again)).toBe(true);
        // And the job may now leave prepress.
        ok(await staff.patch(`/api/v1/data/${connectionId}/${table("jobs")}/${String(job["id"])}`, { values: { stage: "printing" }, from: "prepress" }));
        const printing = (await door.readShared())!.jobs[0]!;
        expect([printing["stage"], printing["printing_at"] !== null]).toEqual(["printing", true]);
      }, 240_000);

      it("finds the customer's orders by the e-mailed code, theirs alone, and asks for a change in their words", async () => {
        const door = browser().after();
        const asked = (await mail()).length;
        await door.requestCode(HARBOUR.email, "en-US");
        const message = await mailTo(HARBOUR.email, /\b\d{6}\b/, asked);
        const code = /\b(\d{6})\b/.exec(message.text)![1]!;
        expect(await door.verifyCode(HARBOUR.email, code === "000001" ? "000002" : "000001")).toMatchObject({ ok: false, reason: "wrong" });
        expect(await door.verifyCode(HARBOUR.email, code)).toEqual({ ok: true });
        expect(door.signedIn()).toBe(true);
        expect(await door.me()).toMatchObject({ email: HARBOUR.email });

        // Harbour Bakery's orders, and nobody else's.
        const mine = await door.myOrders();
        expect(mine.map((o) => o["number"]).sort()).toEqual(["MP-4112", "MP-4113", "MP-4116", "MP-4126", "MP-4127"]);
        const own = await door.myRows();
        const ids = new Set(mine.map((o) => String(o["id"])));
        expect(own.jobs.every((j) => ids.has(String(j["order_id"])))).toBe(true);
        expect(own.jobs.find((j) => String(j["order_id"]) === String(mine.find((o) => o["number"] === "MP-4112")!["id"]))!["design_code"]).toEqual(expect.any(String));

        // MP-4112's proof waits: a change, in the customer's words.
        const order = mine.find((o) => o["number"] === "MP-4112")!;
        const waiting = own.proofs.find((p) => String(p["order_id"]) === String(order["id"]) && p["state"] === "sent")!;
        const changed = await door.answerProof("mine", waiting["id"] as number, { state: "change_asked", change_note: "The phone number should end 302." });
        expect(changed["state"]).toBe("change_asked");
        const stored = (await rows("proofs")).find((p) => String(p["id"]) === String(waiting["id"]))!;
        expect([stored["state"], stored["change_note"]]).toEqual(["change_asked", "The phone number should end 302."]);
        const held = (await rows("jobs")).find((j) => String(j["id"]) === String(waiting["job_id"]))!;
        expect([held["proof_state"], Number(held["proof_ok"]), Number(held["changes"])]).toEqual(["change_asked", 0, 1]);
      }, 180_000);

      it("prices a past job again on today's rate card, by a dry run of it as its own order", async () => {
        const quoted = await shop.quote({ values: { delivery_method: "collect", language: "en-US" }, children: { jobs: [{ values: valuesOf(job) }] } });
        expect(quoted.jobs.map((j) => [j["product_name"], Number(j["qty"])])).toEqual([["Business cards", 500]]);
        expect(Number(quoted.order["total"])).toBeGreaterThan(0);
        expect(String(quoted.order["total"])).toBe(String(placed.order["total"]));
      }, 60_000);

      it("saves a quote held to its total, reads it by its own link, renames it there, and lists it among the customer's own", async () => {
        const door = browser();
        const letterheads = productOf("letterheads");
        const body = { values: { email: HARBOUR.email, language: "en-US", delivery_method: "collect" }, children: { quote_lines: [{ values: jobValues(catalogue, letterheads, firstChoice(catalogue, letterheads), 250) }] } };
        const priced = await door.priceQuote(body);
        const saved = await door.saveQuote(body, `printing-after-${engine}-quote-000001`, String(priced.quote["total"])).catch((e: unknown) => {
          throw new Error(`the quote was refused: ${said(e)}`);
        });
        expect(saved.quote["number"]).toBe("MQ-2042");
        expect(String(saved.quote["total"])).toBe(String(priced.quote["total"]));
        expect(saved.link?.token).toMatch(/^[0-9A-Za-z]{16}$/);

        const after = door.after();
        const held = { number: "MQ-2042", session: saved.link!.session };
        const read = (await after.readHeldQuote(held).catch((e: unknown) => {
          throw new Error(`the quote's link read nothing: ${said(e)} · link ${JSON.stringify({ ...saved.link, token: undefined, session: undefined, key: (saved.link as { key?: string } | null)?.key })} · keys ${JSON.stringify(Object.keys(served.publicKeys ?? {}))}`);
        }))!;
        expect([read.quote["number"], read.lines.map((l) => [l["product_name"], Number(l["qty"])])]).toEqual(["MQ-2042", [["Letterheads", 250]]]);
        const renamed = await after.renameQuote(held, read.quote["id"] as number, "Harbour letterheads");
        expect(renamed["label"]).toBe("Harbour letterheads");
        // Opened afresh by its link, as the quote's e-mail opens it.
        const opened = await browser().after().openQuoteLink(saved.link!.token);
        expect(typeof opened === "object" && opened.number).toBe("MQ-2042");

        // Signed in as the customer, it is among their quotes.
        const signed = browser().after();
        const asked = (await mail()).length;
        await signed.requestCode(HARBOUR.email, "en-US");
        const code = /\b(\d{6})\b/.exec((await mailTo(HARBOUR.email, /\b\d{6}\b/, asked)).text)![1]!;
        expect(await signed.verifyCode(HARBOUR.email, code)).toEqual({ ok: true });
        const quotes = await signed.myQuotes();
        expect(quotes.quotes.map((q) => [q["number"], q["label"]])).toContainEqual(["MQ-2042", "Harbour letterheads"]);
      }, 180_000);

      it("takes a sample pack with its stocks as links, and refuses a second one to the same address", async () => {
        const door = browser().after();
        const stocks = catalogue.materials.filter((m) => m.code === "silk350" || m.code === "uncoated300").map((m) => ({ values: { material_id: m.id } }));
        const asked = await door
          .askSamples({ values: { name: "Two Rivers Cycles", email: "ride@tworivers.example", address_line1: "8 Station Road", town: "Bourne End", postcode: "SL8 5QH", language: "en-US", client_key: `printing-after-${engine}-pack-000001` }, children: { sample_stocks: stocks } })
          .catch((e: unknown) => {
            throw new Error(`the pack was refused: ${said(e)}`);
          });
        expect(asked["status"]).toBe("new");
        const request = (await rows("sample_requests")).find((r) => String(r["postcode"]).replace(/\s/g, "").toUpperCase() === "SL85QH")!;
        const kept = (await rows("sample_stocks")).filter((s) => String(s["request_id"]) === String(request["id"]));
        expect(kept.map((s) => String(s["material_id"])).sort()).toEqual(stocks.map((s) => String(s.values.material_id)).sort());

        // Harbour Bakery's address has had its pack (the sample's, posted on Monday 27 July): typed as the sample has it, refused.
        const before = (await rows("sample_requests")).length;
        const refused = await door
          .askSamples({ values: { name: "Harbour Bakery", email: "orders@harbourbakery.example", address_line1: "12 Quay Street", town: "Marlow", postcode: "SL7 1BT", language: "en-US", client_key: `printing-after-${engine}-pack-000002` }, children: { sample_stocks: stocks.slice(0, 1) } })
          .catch((e: unknown) => e);
        expect(isShopError(refused), "kept a second pack to the same address").toBe(true);
        // The page's sentence on the address shows for exactly what Adminium answers.
        expect(samePlace(sampleRefusal(refused)), said(refused)).toBe(true);
        expect((await rows("sample_requests")).length).toBe(before);
      }, 60_000);

      // The key is kept by the column's `normalize: "code"` rule, so the address typed in another case is the same address.
      it("refuses a second pack to the same address typed another way", async () => {
        const door = browser().after();
        const stock = catalogue.materials.filter((m) => m.code === "silk170").map((m) => ({ values: { material_id: m.id } }));
        const refused = await door
          .askSamples({ values: { name: "Harbour Bakery", email: "post@harbourbakery.example", address_line1: "12 quay street", town: "Marlow", postcode: "sl7 1bt", language: "en-US", client_key: `printing-after-${engine}-pack-000003` }, children: { sample_stocks: stock } })
          .catch((e: unknown) => e);
        expect(isShopError(refused)).toBe(true);
        expect(samePlace(sampleRefusal(refused)), said(refused)).toBe(true);
      }, 60_000);

      it("accepts the works' delivery quote through the order's own link: the order's delivery and total move to it", async () => {
        const made = await place(shop, cards(250), `printing-after-${engine}-0000000002`, { ...HARBOUR, delivery_method: "deliver" });
        const id = String(made.order["id"]);
        ok(await staff.patch(`/api/v1/data/${connectionId}/${table("orders")}/${id}`, { values: { delivery_quote: "48.00", delivery_quote_state: "sent" } }));
        const door = browser().after();
        expect(await door.openShared(made.link!.token)).toBe("opened");
        const read = (await door.readShared())!;
        expect([read.order["delivery_quote_state"], Number(read.order["delivery_quote"])]).toEqual(["sent", 48]);
        // The customer answers the quote; its amount is never theirs to write, alone or beside the answer.
        const typed = (values: Record<string, unknown>) => door.answerDelivery("link", id, values as unknown as DeliveryAnswer).catch((e: unknown) => e);
        for (const values of [{ delivery_quote: "1.00" }, { delivery_quote_state: "accepted", delivery_quote: "1.00" }]) {
          expect(isShopError(await typed(values)), JSON.stringify(values)).toBe(true);
        }
        expect(Number((await rows("orders")).find((o) => String(o["id"]) === id)!["delivery_quote"])).toBe(48);
        await door.answerDelivery("link", id, { delivery_quote_state: "accepted" }).catch((e: unknown) => {
          throw new Error(`the answer was refused: ${said(e)}`);
        });
        const order = (await rows("orders")).find((o) => String(o["id"]) === id)!;
        expect([order["delivery_quote_state"], Number(order["delivery"])]).toEqual(["accepted", 48]);
        expect(Number(order["total"])).toBeCloseTo((Number(order["goods_total"]) + 48) * 1.2, 1);
        // Accepted, the amount is the price agreed: the works changes it no more, nor takes the quote back to send again.
        const path = `/api/v1/data/${connectionId}/${table("orders")}/${id}`;
        for (const values of [{ delivery_quote: "52.00" }, { delivery_quote_state: "sent" }, { delivery_quote: "52.00", delivery_quote_state: "sent" }]) {
          const moved = await staff.patch(path, { values });
          expect([moved.status, moved.code], JSON.stringify(values)).toEqual([403, "COLUMN_FORBIDDEN"]);
        }
        const held = (await rows("orders")).find((o) => String(o["id"]) === id)!;
        expect([held["delivery_quote_state"], Number(held["delivery_quote"]), Number(held["delivery"])]).toEqual(["accepted", 48, 48]);
        // Answered, the quote is the customer's no more: neither a second answer nor its amount.
        for (const values of [{ delivery_quote_state: "accepted" }, { delivery_quote: "1.00" }]) {
          expect(isShopError(await typed(values)), JSON.stringify(values)).toBe(true);
        }
        expect(yes(order["link_stopped"] ?? false)).toBe(false);
      }, 120_000);
    });
  });
});
