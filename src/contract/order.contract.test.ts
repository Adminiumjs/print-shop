/**
 * A CUSTOMER ORDERS FROM MARLOW PRESS ON A BUILT ADMINIUM, THROUGH THE SHOP'S OWN DOOR.
 *
 * The app and the Customiser it requires are installed on a BUILT Adminium
 * (`ADMINIUM_REPO`, the core at 0.3.44) as an operator installs them, the
 * sample added at the moment the comps pin the works to (10:20 on Wednesday
 * 5 August 2026 in Marlow), and the shop is opened the way its customer
 * build opens it: the surface config Adminium serves, the shop's door
 * (`src/shop/door.ts`), the bodies the shop's state writes (`orderBody`,
 * `jobValues`). Then:
 *
 * - the rate card and catalogue read as the products page shows them;
 * - the products' "from" prices are one dry run, one job a product;
 * - a product's page is one dry run holding a job for each quantity break,
 *   and one of the job as its own order (its delivery band, its tax);
 * - the customer's artwork goes in as a guest upload for the order's jobs;
 * - the customer lays their name out on Harbour in the Customiser (a design
 *   saved through the shop's key, behind the human check);
 * - the order goes in as one write, held to the total the customer saw:
 *   the next `MP-` number, the jobs, the design's code, the artwork with
 *   what its checks said and the warning accepted; a retry answers the same
 *   order; the order's own link is open at once;
 * - a total that moved is refused with the figures it came to, and a field
 *   Adminium refuses is named.
 *
 * The job's price is the rate card's calculated columns; on the stand-in
 * `price` and `weight_kg` the works types for now, a dry run answers no
 * figure for them, so this holds the bodies and the shapes that come back,
 * not the amounts. The ready-by is Adminium's working-day stamp: Monday 10
 * August (`READY_BY_GAP=1` holds an older core that left it empty).
 *
 * It runs with `CONTRACT=1` where a built Adminium and a built add-ons
 * checkout are, and says why it skipped otherwise. It runs on SQLite: the
 * works' database is a file it makes (the engines' own install test, in the
 * core, covers Postgres and MySQL).
 */
import { rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { checkFile, needsAcceptance } from "../shop/checks.ts";
import { cappedAt, deliveryOf, EACH, figure, partsOf } from "../shop/figures.ts";
import { firstChoice, jobValues, optionsOf, stepsOf } from "../shop/config.ts";
import { AdminiumShop } from "../shop/door.ts";
import { isShopError, type Catalogue, type Row } from "../shop/port.ts";
import { orderBody, useShop, type ArtFile, type BasketLine } from "../shop/store.ts";
import { addOnBundle, appBundle, boot, Caller, ENGINES, missing, missingAddOn, ok, PORTS_PER_ENGINE, until, type Engine, type Server } from "./harness.ts";

const why = missing() ?? missingAddOn("customiser");
if (why !== null && process.env["ADMINIUM_REQUIRE_CONTRACT"] === "1") throw new Error(`the contract must run here, and cannot: ${why}`);
const PORT_BASE = Number(process.env["CONTRACT_PORT_BASE"] ?? 4990);
const ADMIN = { email: process.env["E2E_ADMIN_EMAIL"] ?? "e2e@adminium.local", password: process.env["E2E_ADMIN_PASSWORD"] ?? "adminium-e2e-password" };
/** 10:20 on Wednesday 5 August 2026 in Marlow (British Summer Time), before the two o'clock cut-off. */
const WEDNESDAY = Date.parse("2026-08-05T09:20:00Z");
/** 0.3.43 stamped no ready-by on a create whose days are a formula; 0.3.44 does (set `READY_BY_GAP=1` for the older core). */
const READY_BY_GAP = process.env["READY_BY_GAP"] === "1";
const CUSTOMER = { name: "Harbour Bakery", email: "hello@harbourbakery.example", address_line1: "12 Quay Street", town: "Marlow", postcode: "SL7 1BT", may_email: true, language: "en-US" };

/** A print-ready PDF for 85 × 55 mm cards, both sides, but in RGB: one warning to accept. */
function artwork(): File {
  const pt = (mm: number) => ((mm * 72) / 25.4).toFixed(2);
  const page = `<< /Type /Page /MediaBox [0 0 ${pt(91)} ${pt(61)}] >>\n`;
  return new File([`%PDF-1.4\n${page}${page}/ColorSpace /DeviceRGB\n<< /Type /Font /FontFile2 3 0 R >>\n%%EOF\n`], "harbour-cards.pdf", { type: "application/pdf" });
}

describe.skipIf(why !== null)(`a customer orders on a built Adminium${why === null ? "" : ` — skipped: ${why}`}`, () => {
  ENGINES.filter(([engine]) => engine === "sqlite").forEach(([engine, available], index) => {
    describe.skipIf(!available)(`on ${engine}`, () => {
      let server: Server;
      let staff: Caller;
      let door: AdminiumShop;
      let catalogue: Catalogue;

      beforeAll(async () => {
        server = await boot(engine as Engine, PORT_BASE + index * PORTS_PER_ENGINE, WEDNESDAY - 60_000, { database: `printing_shop_${engine}${process.env["CONTRACT_DB_SUFFIX"] ?? ""}` });
        staff = new Caller(server.base, { origin: server.base });
        await staff.signIn(ADMIN.email, ADMIN.password);
        // The works' own empty database (on the e2e Northwind beside it the install meets its bare `products`, `orders` and `customers`).
        const file = join(tmpdir(), `printing-shop-contract-${engine}-${String(PORT_BASE)}.db`);
        rmSync(file, { force: true });
        writeFileSync(file, "");
        const connectionId = ok(await staff.post<{ id: string }>("/api/v1/connections", { name: "marlow-press", engine: "sqlite", dsn: `sqlite:${file}` }), 201).id;

        // The Customiser first, staged at the release the app asks for; then the app, with it ticked.
        const addOn = addOnBundle("customiser");
        const stagedAddOn = await staff.post(`/api/v1/add-ons/upload?expectedSha512=${encodeURIComponent(addOn.integrity)}`, addOn.buffer);
        if (![200, 201].includes(stagedAddOn.status)) throw new Error(`add-on upload: ${JSON.stringify(stagedAddOn.body).slice(0, 600)}`);
        const app = appBundle();
        const staged = await staff.post(`/api/v1/apps/upload?expectedSha512=${encodeURIComponent(app.integrity)}`, app.buffer);
        if (![200, 201].includes(staged.status)) throw new Error(`upload: ${JSON.stringify(staged.body).slice(0, 600)}`);
        const body = { key: app.key, version: app.version, connectionId };
        const plan = ok(await staff.post<{ plan: { checksum: string; installable: boolean } }>("/api/v1/apps/plan", body)).plan;
        if (!plan.installable) throw new Error(`not installable: ${JSON.stringify(plan).slice(0, 2000)}`);
        const installed = ok(await staff.post<{ rules: { skipped: unknown[] } }>("/api/v1/apps/install", { ...body, planChecksum: plan.checksum, addOns: [{ key: addOn.key, version: addOn.version }] }));
        if (installed.rules.skipped.length > 0) throw new Error(`the install skipped rules: ${JSON.stringify(installed.rules.skipped).slice(0, 1500)}`);
        // The works' zone decides its two o'clock cut-off; its money is pounds.
        ok(await staff.patch(`/api/v1/connections/${connectionId}`, { timezone: "Europe/London", currency: "GBP" }));

        // The sample is written for 10:20 on the dot: the clock stands there while it goes in, then runs on.
        await server.setClock(WEDNESDAY, true);
        ok(await staff.post("/api/v1/apps/printing/sample-data"));
        await until(async () => (ok(await staff.get<{ loaded: boolean }>("/api/v1/apps/printing/sample-data")).loaded ? true : undefined), "the sample to be added");
        await server.setClock(WEDNESDAY);
        ok(await staff.put("/api/v1/public-api", { enabled: true }));
        ok(await staff.put("/api/v1/settings/email", { publicOrigin: server.base }));

        // The shop, opened as its customer build opens it.
        const served = ok(await new Caller(server.base).get<{ publishableKey: string; publicKeys?: Record<string, string>; tables?: Record<string, string> }>("/apps/printing/customer/surface-config.json"));
        const originFetch: typeof fetch = (input, init) => {
          const headers = new Headers(init?.headers);
          headers.set("origin", server.base);
          return fetch(input, { ...init, headers });
        };
        door = new AdminiumShop({ baseUrl: server.base, publishableKey: served.publishableKey, ...(served.tables === undefined ? {} : { tables: served.tables }), ...(served.publicKeys === undefined ? {} : { publicKeys: served.publicKeys }) }, { fetch: originFetch });
        catalogue = await door.catalogue();
        // The shop's state holds the catalogue it read, as the page does.
        useShop.setState({ catalogue });
      }, 420_000);

      afterAll(async () => {
        await server?.stop();
      });

      const productOf = (code: string) => catalogue.products.find((p) => p.code === code)!;
      const optionOf = (code: string, kind: string, option: string) => catalogue.options.find((o) => String(o.productId) === String(productOf(code).id) && o.kind === kind && o.code === option)!.id;

      it("reads the rate card and the catalogue as the products page shows them", () => {
        expect(catalogue.works).toMatchObject({ name: "Marlow Press", standardDays: 3, expressDays: 1, artworkMaxMb: 100, minDpi: 150, takingOrders: true });
        expect(catalogue.products.map((p) => p.code)).toEqual(["business-cards", "folded-cards", "flyers", "letterheads", "comp-slips", "envelopes", "stickers", "posters", "rollups", "pvc-banners", "canvas"]);
        expect(catalogue.breaks.map((b) => b.minQty)).toEqual([25, 50, 100, 250, 500, 1000]);
        expect(productOf("business-cards").baseId).not.toBeNull();
        expect(optionsOf(catalogue, productOf("business-cards").id, "lamination").map((o) => o.code)).toEqual(["lam-one", "lam-both", "lam-soft"]);
        expect(catalogue.rules.map((r) => r.test).sort()).toEqual(["no_lamination", "over_gsm", "roll", "uncoated"]);
        expect(catalogue.bands.map((b) => [b.code, b.tube])).toEqual([
          ["light", false],
          ["mid", false],
          ["heavy", false],
          ["tube", true],
        ]);
      });

      it("prices every product's 'from' in one dry run, one job a product", async () => {
        const jobs = catalogue.products.map((p) => ({ values: jobValues(catalogue, p, firstChoice(catalogue, p), p.kind === "sheet" ? p.fromQty : 1) }));
        const quoted = await door.quote({ values: { delivery_method: "collect", language: "en-US" }, children: { jobs } });
        expect(quoted.jobs.map((j) => j["product_name"])).toEqual(catalogue.products.map((p) => p.name));
        expect(quoted.jobs.every((j) => "price" in j && "weight_kg" in j)).toBe(true);
        expect(Number(quoted.order["delivery"])).toBe(0);
      });

      it("prices a product's page: a job for each break in one dry run, and the job as its own order", async () => {
        const cards = productOf("business-cards");
        const choice = { ...firstChoice(catalogue, cards), laminationId: optionOf("business-cards", "lamination", "lam-both"), look: "matt" as const };
        const steps = stepsOf(catalogue, cards);
        const chips = await door.quote({ values: { delivery_method: "collect", language: "en-US" }, children: { jobs: steps.map((qty) => ({ values: jobValues(catalogue, cards, choice, qty) })) } });
        expect(chips.jobs.map((j) => Number(j["qty"]))).toEqual(steps);
        const panel = await door.quote({ values: { delivery_method: "deliver", language: "en-US" }, children: { jobs: [{ values: jobValues(catalogue, cards, choice, 500) }] } }).catch((e: unknown) => {
          throw new Error(`refused: ${JSON.stringify(isShopError(e) ? { ...e.refused, raw: undefined } : String(e))}`);
        });
        expect(panel.jobs).toHaveLength(1);
        expect(panel.jobs[0]).toMatchObject({ product_name: "Business cards", qty: 500, look: "matt" });
        expect(Number(panel.order["tax_rate"])).toBe(20);
        expect(Object.keys(panel.order)).toEqual(expect.arrayContaining(["goods_total", "weight_kg", "delivery_band_id", "delivery", "delivery_to_quote", "tax", "total"]));
        // The panel's lines are the rate card's own columns, a piece's price among them (never divided in the browser).
        const job = panel.jobs[0]!;
        expect(partsOf(job).map((p) => p.part.column)).toEqual(["setup", "print_charge", "material_charge", "lamination_charge", "packaging_charge"]);
        expect(Number(figure(job, EACH))).toBe(Math.round((Number(job["price"]) / 500) * 100) / 100);
        expect(cappedAt(job)).toBeNull();
        expect(deliveryOf(panel.order, catalogue.bands)).toMatchObject({ toQuote: false, price: String(panel.order["delivery"]) });
        expect(deliveryOf(panel.order, catalogue.bands).band?.code).toBe("light");
      });

      it("caps 999 flyers at the 1000 price, and says so from the job's own columns", async () => {
        const flyers = productOf("flyers");
        const choice = { ...firstChoice(catalogue, flyers), sizeId: optionOf("flyers", "size", "a5"), materialId: optionOf("flyers", "material", "silk170") };
        const quoted = await door.quote({ values: { delivery_method: "collect", language: "en-US" }, children: { jobs: [999, 1000].map((qty) => ({ values: jobValues(catalogue, flyers, choice, qty) })) } });
        const [nine, thousand] = quoted.jobs;
        expect(cappedAt(nine)).toBe("1000");
        expect(Number(nine!["cap_charge"])).toBeLessThan(0);
        expect(String(nine!["price"])).toBe(String(thousand!["price"]));
        expect(partsOf(nine).map((p) => p.part.column)).toContain("cap_charge");
        expect(cappedAt(thousand)).toBeNull();
      });

      let uploaded: ArtFile;
      it("takes the customer's artwork as a guest upload for the order's jobs, with its checks read in the browser", async () => {
        const file = artwork();
        const rows = await checkFile(file, { trim: { w: 85, h: 55 }, sides: 2, minDpi: 150 });
        expect(rows.find((r) => r.check === "colour")?.level).toBe("warn");
        expect(needsAcceptance(rows)).toBe(true);
        const upload = await door.upload(file, file.name);
        expect(upload).toMatchObject({ name: "harbour-cards.pdf", kind: "pdf" });
        expect(upload.id).toMatch(/^[A-Za-z0-9_-]{32}$/);
        uploaded = { id: "f1", name: file.name, size: file.size, status: "in", refusal: null, rows, accepted: true, upload };
      });

      let code = "";
      it("saves the customer's design on Harbour through the shop's key", async () => {
        const api = door.customiser();
        const base = productOf("business-cards").baseId!;
        const rows = await api.catalogue(base);
        const harbour = rows.ready.find((r) => r["name"] === "Harbour")!;
        expect(harbour).toBeDefined();
        const saved = await api.create({ base_id: base, ready_design_id: harbour["id"] as number, values: { layout: "left", sides: 2, parts: { name: { text: "Harbour Bakery" } } } }, CUSTOMER.email);
        expect(saved.code).toMatch(/^[0-9A-Z-]{8,}$/);
        code = saved.code!;
      });

      let placed: Awaited<ReturnType<AdminiumShop["place"]>>;
      const clientKey = `printing-contract-${engine}-0123456789`;
      const basket = (): BasketLine[] => {
        const cards = productOf("business-cards");
        const own = { ...firstChoice(catalogue, cards), qty: 500, laminationId: optionOf("business-cards", "lamination", "lam-both"), look: "matt" as const };
        const design = { id: 0, code, base_id: 0, ready_design_id: null, values: { parts: {} }, state: "draft" as const, updatedAt: null, session: null, files: {} };
        return [
          { id: "j1", productId: cards.id, choice: own, design: null, features: [], artwork: [uploaded] },
          { id: "j2", productId: cards.id, choice: { ...own, qty: 250 }, design, features: [optionOf("business-cards", "feature", "print-back")], artwork: [] },
        ];
      };

      it("places the order as one write held to the total shown: the next MP- number, its jobs, the design, the artwork and what its checks said", async () => {
        const values = { ...CUSTOMER, delivery_method: "deliver" };
        const quoted = await door.quote(orderBody(values, basket()));
        const total = String(quoted.order["total"]);
        const body = orderBody(values, basket(), true);
        expect(body.children.jobs[0]!.children?.artwork?.[0]?.values).toMatchObject({ name: "harbour-cards.pdf", file: uploaded.upload!.id, side: "both", accepted: true });
        expect(body.children.jobs[1]!.values.design_code).toBe(code);
        placed = await door.place(body, clientKey, total);
        expect(placed.replayed).toBe(false);
        const order = placed.order;
        expect(order["number"]).toBe("MP-4127");
        expect(String(order["total"])).toBe(total);
        expect(order["status"]).toBe("placed");
        // The customer's own details are never answered back.
        expect(order["email"]).toBeUndefined();
        expect(placed.jobs.map((j: Row) => [j["product_name"], Number(j["qty"]), j["stage"], Number(j["artwork_count"]), Number(j["warnings_accepted"]), j["design_id"] === null])).toEqual([
          ["Business cards", 500, "prepress", 1, 1, true],
          ["Business cards", 250, "prepress", 0, 0, false],
        ]);
        if (READY_BY_GAP) expect(order["ready_by"] ?? null).toBeNull();
        else expect(String(order["ready_by"]).slice(0, 10)).toBe("2026-08-10");
        // The order's own link: its code for the page, a session on it already held.
        expect(placed.link?.token).toMatch(/^[0-9A-Za-z]{16}$/);
        const own = await door.orderClient!.list<Row>("printing_orders_claimed");
        expect(own.data.map((o) => [o["number"], String(o["total"])])).toEqual([["MP-4127", total]]);
        // The artwork is the job's, with the checks the customer was shown and the warning they accepted.
        const art = await door.orderClient!.list<Row>("printing_artwork_verified_2");
        expect(art.data).toHaveLength(1);
        const kept = art.data[0]!;
        expect([kept["name"], kept["side"], kept["accepted"] === true || kept["accepted"] === 1]).toEqual(["harbour-cards.pdf", "both", true]);
        const checks = typeof kept["checks"] === "string" ? JSON.parse(kept["checks"]) : kept["checks"];
        expect(checks.rows.find((r: { check: string }) => r.check === "colour")).toMatchObject({ level: "warn" });
      });

      it("answers a retry with the order already made", async () => {
        const again = await door.place(orderBody({ ...CUSTOMER, delivery_method: "deliver" }, basket().slice(1), true), clientKey, String(placed.order["total"]));
        expect([again.replayed, again.order["number"]]).toEqual([true, "MP-4127"]);
      });

      it("refuses a total that moved, with the figures the save came to, and keeps nothing", async () => {
        const letterheads = productOf("letterheads");
        const job: BasketLine = { id: "j3", productId: letterheads.id, choice: firstChoice(catalogue, letterheads), design: null, features: [], artwork: [] };
        const body = orderBody({ ...CUSTOMER, delivery_method: "collect" }, [job], true);
        const quoted = await door.quote(body);
        const wrong = (Number(quoted.order["total"] ?? 0) + 1).toFixed(2);
        const error = await door.place(body, `printing-contract-${engine}-moved-0001`, wrong).catch((e: unknown) => e);
        expect(isShopError(error)).toBe(true);
        if (!isShopError(error)) return;
        expect(error.refused.code).toBe("PUBLIC_PRICE_CHANGED");
        expect(Number(error.refused.changed?.order["total"])).toBe(Number(quoted.order["total"]));
        const orders = await door.orderClient!.list<Row>("printing_orders_claimed");
        expect(orders.data.map((o) => o["number"])).toEqual(["MP-4127"]);
      });

      it("names the field Adminium refuses", async () => {
        const letterheads = productOf("letterheads");
        const job: BasketLine = { id: "j4", productId: letterheads.id, choice: firstChoice(catalogue, letterheads), design: null, features: [], artwork: [] };
        const error = await door.quote(orderBody({ ...CUSTOMER, name: "Harbour 5551234567", delivery_method: "collect" }, [job])).catch((e: unknown) => e);
        expect(isShopError(error)).toBe(true);
        if (!isShopError(error)) return;
        expect([error.refused.code, error.refused.column]).toEqual(["PUBLIC_WRITE_REFUSED", "name"]);
      });
    });
  });
});
