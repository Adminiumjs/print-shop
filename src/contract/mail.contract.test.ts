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
import type { ProofAnswer } from "../shop/after-port.ts";
import { type Catalogue, type Row } from "../shop/port.ts";
import { orderBody, useShop, type BasketLine } from "../shop/store.ts";
import { addOnBundle, appBundle, boot, Caller, ENGINES, missing, missingAddOn, ok, PORTS_PER_ENGINE, until, type Engine, type Server } from "./harness.ts";
import { MANIFEST_TEXT } from "./release.ts";
import { delivered, sinkMail, subjectOf, type Mail } from "./mail.ts";

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
      const place = async (lines: BasketLine[], method: "collect" | "deliver", who: typeof SHOPPER = SHOPPER) => {
        const values = { ...who, delivery_method: method };
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

      // An app's mail with no brand of its own is headed with the business's name (its outbox's `settings.name`).
      it("heads the customer's e-mail with the works' name, never Adminium's", () => {
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

      // The outbox sends a kind once per row its link names: each proof, and each change asked, is a row of its own.
      it("sends a fresh proof ready for the next proof after a change asked, and the works a copy of each change", async () => {
        const order = await place([cards(750)], "collect");
        const [job] = await jobsOf(order.order);
        const subject = subjectOf(MANIFEST, "proof-ready");
        const readyMails = async () => (await sinkMail(server.sink)).filter((m) => m.to.includes(SHOPPER.email) && subject.test(m.subject) && m.text.includes("750 × Business cards")).length;
        const first = await sendProof(job!);
        await delivered({ sink: server.sink, manifest: MANIFEST, kind: "proof-ready", to: SHOPPER.email, row: message("proof-ready", "proof_id", first["id"]), body: new RegExp(`/order#${order.link!.token}`) });
        expect(await readyMails()).toBe(1);
        const door = browser().after();
        expect(await door.openShared(order.link!.token)).toBe("opened");
        await door.answerProof("link", first["id"] as number, { state: "change_asked", change_note: "Make the logo smaller." });
        await delivered({ sink: server.sink, manifest: MANIFEST, kind: "change-asked", to: WORKS, row: message("change-asked", "proof_id", first["id"]) });

        const second = await sendProof(job!);
        const again = await delivered({ sink: server.sink, manifest: MANIFEST, kind: "proof-ready", to: SHOPPER.email, row: message("proof-ready", "proof_id", second["id"]), body: new RegExp(`/order#${order.link!.token}`) });
        expect(String(again.row["order_id"])).toBe(String(order.order["id"]));
        await until(async () => ((await readyMails()) === 2 ? true : undefined), "the second proof ready in the sink");
        // The second change asked reaches the works too.
        expect(await door.openShared(order.link!.token)).toBe("opened");
        await door.answerProof("link", second["id"] as number, { state: "change_asked", change_note: "Now the phone line, please." });
        await delivered({ sink: server.sink, manifest: MANIFEST, kind: "change-asked", to: WORKS, row: message("change-asked", "proof_id", second["id"]) });
        const copies = async () => (await sinkMail(server.sink)).filter((m) => m.to.includes(WORKS) && m.text.includes(`Change asked on ${String(order.order["number"])}`));
        await until(async () => ((await copies()).some((m) => m.text.includes("Now the phone line, please.")) ? true : undefined), "the works' copy of the second change");
        expect(await copies()).toHaveLength(2);
      }, 360_000);

      it("never e-mails a proof added with no PDF: it is refused, and the proof made with its PDF is e-mailed once", async () => {
        const order = await place([cards(600)], "collect");
        const [job] = await jobsOf(order.order);
        const bare = await staff.post<{ data: Row }>(`/api/v1/data/${connectionId}/${table("proofs")}`, { values: { job_id: job!["id"], kind: "email" } });
        expect([bare.status === 201, bare.code]).toEqual([false, "STATE_MOVE_REFUSED"]);
        expect((await rows("proofs")).filter((p) => String(p["job_id"]) === String(job!["id"]))).toEqual([]);
        const proof = await sendProof(job!);
        expect(proof["file_added_at"] ?? (await rows("proofs")).find((p) => String(p["id"]) === String(proof["id"]))!["file_added_at"]).not.toBeNull();
        await delivered({ sink: server.sink, manifest: MANIFEST, kind: "proof-ready", to: SHOPPER.email, row: message("proof-ready", "proof_id", proof["id"]), body: new RegExp(`/order#${order.link!.token}`) });
        expect((await rows("messages")).filter((m) => m["kind"] === "proof-ready" && String(m["proof_id"]) === String(proof["id"]))).toHaveLength(1);
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

      it("lists in the proof ready only the job the proof is of, not the order's other jobs", async () => {
        const two = await place([cards(300), flyers(500)], "collect");
        const job = (await jobsOf(two.order)).find((j) => Number(j["qty"]) === 300)!;
        await sendProof(job);
        const ready = await delivered({ sink: server.sink, manifest: MANIFEST, kind: "proof-ready", to: SHOPPER.email, row: message("proof-ready", "order_id", two.order["id"]), body: new RegExp(`/order#${two.link!.token}`) });
        expect(ready.mail.text).toContain("300 × Business cards");
        expect(ready.mail.text).not.toContain("Flyers");
      }, 240_000);

      it("sends a proof approved for each job of an order, listing the jobs approved so far", async () => {
        const two = await place([cards(400), flyers(800)], "collect");
        const jobs = await jobsOf(two.order);
        const door = browser().after();
        expect(await door.openShared(two.link!.token)).toBe("opened");
        const first = await sendProof(jobs.find((j) => Number(j["qty"]) === 400)!);
        await door.answerProof("link", first["id"] as number, { state: "approved" });
        const one = await delivered({ sink: server.sink, manifest: MANIFEST, kind: "proof-approved", to: SHOPPER.email, known: { "order.number": String(two.order["number"]) }, row: message("proof-approved", "proof_id", first["id"]) });
        expect(one.mail.text).toContain("400 × Business cards");
        expect(one.mail.text).not.toContain("Flyers");
        const second = await sendProof(jobs.find((j) => Number(j["qty"]) === 800)!);
        expect(await door.openShared(two.link!.token)).toBe("opened");
        await door.answerProof("link", second["id"] as number, { state: "approved" });
        await delivered({ sink: server.sink, manifest: MANIFEST, kind: "proof-approved", to: SHOPPER.email, row: message("proof-approved", "proof_id", second["id"]) });
        const approvals = async () => (await sinkMail(server.sink)).filter((m) => m.to.includes(SHOPPER.email) && m.subject.includes(String(two.order["number"])) && m.subject.includes("printing") && m.text.includes("800 × Flyers") && m.text.includes("400 × Business cards"));
        await until(async () => ((await approvals()).length === 1 ? true : undefined), "the second job's approval in the sink");
      }, 240_000);

      // A change asked adds a working day to the ready-by, and it stays: the next proof, the yes and an erase never take it back.
      it("keeps the day each change adds on the ready-by: on the job, the order's page and the approval mail, through the next proof and an erase", async () => {
        const who = { ...SHOPPER, name: "Nell Fairweather", email: "nell@fairweather-press.dev" };
        // An hour and ten minutes on (11:30, still before the cut-off): this file's orders have spent the hour's anonymous ones.
        await server.setClock(WEDNESDAY + 70 * 60_000);
        const order = await place([cards(700)], "collect", who);
        const [job] = await jobsOf(order.order);
        const door = browser().after();
        /** The ready-by on the job, its order, and the customer's page of the order. */
        const readyBy = async (): Promise<string[]> => {
          const stored = (await rows("jobs")).find((j) => String(j["id"]) === String(job!["id"]))!;
          const placed = (await rows("orders")).find((o) => String(o["id"]) === String(order.order["id"]))!;
          expect(await door.openShared(order.link!.token)).toBe("opened");
          const page = (await door.readShared())!;
          return [stored["ready_by"], placed["ready_by"], page.order["ready_by"], page.jobs[0]!["ready_by"]].map((d) => String(d).slice(0, 10));
        };
        const changesOf = async () => Number((await rows("jobs")).find((j) => String(j["id"]) === String(job!["id"]))!["changes"]);
        // Placed at 10:20 on Wednesday: three working days on, Monday 10 August.
        expect(await readyBy()).toEqual(Array(4).fill("2026-08-10"));
        const first = await sendProof(job!);
        await door.answerProof("link", first["id"] as number, { state: "change_asked", change_note: "A darker grey, please." });
        const number = String(order.order["number"]);
        const asked = await delivered({ sink: server.sink, manifest: MANIFEST, kind: "change-asked", to: WORKS, known: { "order.number": number }, row: message("change-asked", "proof_id", first["id"]) });
        expect(asked.mail.text, asked.mail.text).toMatch(/Ready by moves to: Tuesday,? (11 August|August 11),? 2026/);
        // A change adds a working day: Tuesday 11 August.
        expect([await changesOf(), ...(await readyBy())]).toEqual([1, ...Array(4).fill("2026-08-11")]);
        // The next proof sends the first again: the day the customer was told stays.
        const second = await sendProof(job!);
        expect((await rows("proofs")).find((p) => String(p["id"]) === String(first["id"]))!["state"]).toBe("superseded");
        expect([await changesOf(), ...(await readyBy())]).toEqual([1, ...Array(4).fill("2026-08-11")]);
        // A second change adds one more, and it too stays once the third proof goes out.
        await door.answerProof("link", second["id"] as number, { state: "change_asked", change_note: "And the phone line in bold." });
        expect([await changesOf(), ...(await readyBy())]).toEqual([2, ...Array(4).fill("2026-08-12")]);
        const third = await sendProof(job!);
        expect([await changesOf(), ...(await readyBy())]).toEqual([2, ...Array(4).fill("2026-08-12")]);
        // The yes, the same day: the approval mail says the day the customer was told.
        await door.answerProof("link", third["id"] as number, { state: "approved" });
        expect([await changesOf(), ...(await readyBy())]).toEqual([2, ...Array(4).fill("2026-08-12")]);
        const approved = await delivered({ sink: server.sink, manifest: MANIFEST, kind: "proof-approved", to: who.email, known: { "order.number": number }, row: message("proof-approved", "proof_id", third["id"]) });
        expect(approved.mail.text, approved.mail.text).toMatch(/Ready by: Wednesday,? (12 August|August 12),? 2026/);
        // Erasing the customer empties the words they asked in, never the days their changes added.
        ok(await staff.post("/api/v1/privacy/erase/preview", { address: who.email }));
        ok(await staff.post("/api/v1/privacy/erase", { address: who.email, confirm: who.email }));
        expect((await rows("proofs")).filter((p) => String(p["job_id"]) === String(job!["id"])).map((p) => p["change_note"] ?? null)).toEqual([null, null, null]);
        const kept = (await rows("jobs")).find((j) => String(j["id"]) === String(job!["id"]))!;
        expect([Number(kept["changes"]), String(kept["ready_by"]).slice(0, 10)]).toEqual([2, "2026-08-12"]);
        expect(String((await rows("orders")).find((o) => String(o["id"]) === String(order.order["id"]))!["ready_by"]).slice(0, 10)).toBe("2026-08-12");
      }, 360_000);

      /**
       * One customer's job, proofed and answered across the working week: the ready-by on the job and its order after
       * each step. Each case its own shopper, an order apart, so no hourly or per-address limit is spent.
       */
      const across = async (email: string) => {
        const who = { ...SHOPPER, name: "Ivo Marsh", email };
        const order = await place([cards(650)], "collect", who);
        const [job] = await jobsOf(order.order);
        const door = browser().after();
        const readyBy = async () => {
          const stored = (await rows("jobs")).find((j) => String(j["id"]) === String(job!["id"]))!;
          const placed = (await rows("orders")).find((o) => String(o["id"]) === String(order.order["id"]))!;
          return [stored["ready_by"], placed["ready_by"]].map((d) => String(d).slice(0, 10));
        };
        const answer = async (proof: Row, values: ProofAnswer) => {
          expect(await door.openShared(order.link!.token)).toBe("opened");
          await door.answerProof("link", proof["id"] as number, values);
        };
        return { who, order, job: job!, readyBy, answer };
      };
      const at = (iso: string) => server.setClock(Date.parse(iso));

      // Told Tuesday 11 August by a change on Wednesday; approved on Thursday, three working days on is that Tuesday too.
      it("keeps the day the customer was told when they approve on the next working day", async () => {
        await at("2026-08-05T11:00:00Z");
        const run = await across("orla@quayside-print.dev");
        await run.answer(await sendProof(run.job), { state: "change_asked", change_note: "Smaller logo." });
        expect(await run.readyBy()).toEqual(["2026-08-11", "2026-08-11"]);
        await at("2026-08-06T09:00:00Z");
        const second = await sendProof(run.job);
        await run.answer(second, { state: "approved" });
        expect(await run.readyBy()).toEqual(["2026-08-11", "2026-08-11"]);
        const approved = await delivered({ sink: server.sink, manifest: MANIFEST, kind: "proof-approved", to: run.who.email, known: { "order.number": String(run.order.order["number"]) }, row: message("proof-approved", "proof_id", second["id"]) });
        expect(approved.mail.text, approved.mail.text).toMatch(/Ready by: Tuesday,? (11 August|August 11),? 2026/);
      }, 240_000);

      // Told Thursday 13 August by a change on Friday; approved on Monday, three working days on is that Thursday.
      it("keeps the day the customer was told when they approve after a weekend", async () => {
        await at("2026-08-07T09:00:00Z");
        const run = await across("piet@quayside-print.dev");
        expect(await run.readyBy()).toEqual(["2026-08-12", "2026-08-12"]);
        await run.answer(await sendProof(run.job), { state: "change_asked", change_note: "Bigger phone number." });
        expect(await run.readyBy()).toEqual(["2026-08-13", "2026-08-13"]);
        await at("2026-08-10T09:00:00Z");
        await run.answer(await sendProof(run.job), { state: "approved" });
        expect(await run.readyBy()).toEqual(["2026-08-13", "2026-08-13"]);
      }, 240_000);

      // What the job waits on, taken back on the dashboard (a proof by post asked, then not): the day said already stands.
      // (A proof a change was asked of cannot be deleted to the same end: its e-mails name it.)
      it("keeps the day already said when the days the job waits on are taken back", async () => {
        await at("2026-08-10T10:00:00Z");
        const run = await across("rhea@quayside-print.dev");
        expect(await run.readyBy()).toEqual(["2026-08-13", "2026-08-13"]);
        await patch("jobs", run.job["id"], { proof_by_post: true });
        expect(await run.readyBy()).toEqual(["2026-08-17", "2026-08-17"]);
        await patch("jobs", run.job["id"], { proof_by_post: false });
        expect(Number((await rows("jobs")).find((j) => String(j["id"]) === String(run.job["id"]))!["turnaround_days"])).toBe(3);
        expect(await run.readyBy()).toEqual(["2026-08-17", "2026-08-17"]);
        const first = await sendProof(run.job);
        expect((await staff.send("DELETE", `/api/v1/data/${connectionId}/${table("proofs")}/${String(first["id"])}?confirm=true`)).status).not.toBe(200);
      }, 240_000);

      // Two lots of the same cards in one order: each proof ready, and the works' copy of a change, says which proof, and so
      // which job, it is about, and lists each proof by its job's name.
      it("names the proof and its job in the proof ready and the works' change asked, on an order of two jobs", async () => {
        await at("2026-08-11T09:00:00Z");
        const who = { ...SHOPPER, name: "Wren Hale", email: "wren@quayside-print.dev" };
        const order = await place([cards(100), { ...cards(200), id: "j2" }], "collect", who);
        const number = String(order.order["number"]);
        const jobs = (await jobsOf(order.order)).sort((a, b) => Number(a["position"]) - Number(b["position"]));
        expect(jobs.map((j) => [j["code"], Number(j["qty"])])).toEqual([
          [`${number}/1`, 100],
          [`${number}/2`, 200],
        ]);
        const first = await sendProof(jobs[0]!);
        const one = await delivered({ sink: server.sink, manifest: MANIFEST, kind: "proof-ready", to: who.email, known: { "order.number": number }, row: message("proof-ready", "proof_id", first["id"]) });
        expect(one.mail.text, one.mail.text).toContain(`Proof: ${number}/1 #1`);
        expect(one.mail.text).toContain(`${number}/1 · 100 × Business cards`);
        expect(one.mail.text).not.toContain(`${number}/2`);
        const second = await sendProof(jobs[1]!);
        const two = await delivered({ sink: server.sink, manifest: MANIFEST, kind: "proof-ready", to: who.email, known: { "order.number": number }, row: message("proof-ready", "proof_id", second["id"]), body: new RegExp(`Proof: ${number}/2 #1`) });
        expect(two.mail.text, two.mail.text).toContain(`${number}/2 · 200 × Business cards`);
        const door = browser().after();
        expect(await door.openShared(order.link!.token)).toBe("opened");
        await door.answerProof("link", first["id"] as number, { state: "change_asked", change_note: "A bigger logo on the first lot." });
        const asked = await delivered({ sink: server.sink, manifest: MANIFEST, kind: "change-asked", to: WORKS, known: { "order.number": number }, row: message("change-asked", "proof_id", first["id"]) });
        expect(asked.mail.text, asked.mail.text).toContain(`Proof: ${number}/1 #1`);
        expect(asked.mail.text).toContain(`${number}/1 · 100 × Business cards`);
        expect(asked.mail.text).toContain("A bigger logo on the first lot.");
        expect(asked.mail.text).not.toContain(`${number}/2`);
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
