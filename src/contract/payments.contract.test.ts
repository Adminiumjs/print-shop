/**
 * A WORKS ON 0.2.5 TAKES THE RELEASE THAT TAKES PAYMENTS, AND KEEPS EVERY ROW.
 *
 * The released 0.2.5 manifest (at its tag, kept beside this test) installed
 * with the Customiser on a BUILT Adminium, its sample in; then this
 * checkout's manifest, packed as the next release, updated in place, the
 * operator allowing what it asks. Then:
 *
 *   - every order and job already there is kept, row for row, and each order
 *     reads as owing its total, with nothing paid;
 *   - the payments table is there, empty, and the order is payable, arriving
 *     switched off: the works' screens are told payments are off, and the
 *     shop that nothing can be paid online;
 *   - someone who manages payments switches the app on; the counter's
 *     payment by card on the works' terminal is recorded by Adminium into the
 *     order's payments as the person who took it, with the slip's approval
 *     code and last four, and the order then owes nothing; more than is owed
 *     is refused, and the counter writes no payment row of its own.
 *
 * It runs with `CONTRACT=1` where a built Adminium and a built add-ons
 * checkout are, and says why it skipped otherwise. Its ports start at
 * `CONTRACT_PORT_BASE` (4980), three an engine.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AdminiumShop } from "../shop/door.ts";
import { addOnBundle, appBundle, boot, Caller, ENGINES, missing, missingAddOn, ok, PORTS_PER_ENGINE, until, type Engine, type Server } from "./harness.ts";
import { engineAtLeast, MANIFEST_TEXT } from "./release.ts";

const why = missing() ?? missingAddOn("customiser") ?? (engineAtLeast("0.3.60") ? null : "an app takes payments from Adminium 0.3.60");
if (why !== null && process.env["ADMINIUM_REQUIRE_CONTRACT"] === "1") throw new Error(`the payments contract must run here, and cannot: ${why}`);
const PORT_BASE = Number(process.env["CONTRACT_PORT_BASE"] ?? 4980);
const ADMIN = { email: process.env["E2E_ADMIN_EMAIL"] ?? "e2e@adminium.local", password: process.env["E2E_ADMIN_PASSWORD"] ?? "adminium-e2e-password" };
/** 10:20 on Wednesday 5 August 2026 in Marlow (British Summer Time). */
const WEDNESDAY = Date.parse("2026-08-05T09:20:00Z");
const REPO = fileURLToPath(new URL("../..", import.meta.url));
const FROM = "0.2.5";
/** The released 0.2.5's manifest, kept beside this test, held to its tag where there is one. */
const FROM_FILE = join(REPO, "src", "contract", "released", `printing-${FROM}.manifest.json`);
const FROM_MANIFEST = readFileSync(FROM_FILE, "utf8");
const tagged = (() => {
  try {
    return execFileSync("git", ["-C", REPO, "show", `v${FROM}:manifest.json`], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 * 1024 * 1024 });
  } catch {
    return null;
  }
})();
/** This checkout's manifest, packed as the release after 0.2.5 while its version still says 0.2.5. */
const NEXT = (() => {
  const manifest = JSON.parse(MANIFEST_TEXT) as { version: string };
  return manifest.version === FROM ? JSON.stringify({ ...manifest, version: "0.2.6" }, null, 2) : MANIFEST_TEXT;
})();

type Row = Record<string, unknown>;
const money = (value: unknown): string => (value === null || value === undefined ? "0.00" : Number(value).toFixed(2));

describe(`the released ${FROM} manifest kept beside the payments contract`, () => {
  it.skipIf(tagged === null)(`is the one tagged v${FROM}${tagged === null ? " — skipped: this checkout has no tags" : ""}`, () => {
    expect(FROM_MANIFEST === tagged).toBe(true);
  });
  it(`says it is ${FROM}, and has no payments`, () => {
    const manifest = JSON.parse(FROM_MANIFEST) as { version: string; payments?: unknown; requiredSchema: { tables: { ref: string }[] } };
    expect(manifest.version).toBe(FROM);
    expect(manifest.payments).toBeUndefined();
    expect(manifest.requiredSchema.tables.map((t) => t.ref)).not.toContain("payments");
  });
});

describe.skipIf(why !== null)(`a works on ${FROM}, updated to take payments${why === null ? "" : ` — skipped: ${why}`}`, () => {
  ENGINES.forEach(([engine, available], index) => {
    describe.skipIf(!available)(`on ${engine}`, () => {
      let server: Server;
      let staff: Caller;
      let connectionId = "";
      let tables: Record<string, string> = {};
      const table = (ref: string) => encodeURIComponent(tables[ref] ?? `printing_${ref}`);
      const rows = async (ref: string): Promise<Row[]> => ok(await staff.get<{ data: Row[] }>(`/api/v1/data/${connectionId}/${table(ref)}?limit=200`)).data;
      const install = async (manifest: string) => {
        const app = appBundle({ manifest });
        const staged = await staff.post(`/api/v1/apps/upload?expectedSha512=${encodeURIComponent(app.integrity)}`, app.buffer);
        if (![200, 201].includes(staged.status)) throw new Error(`upload: ${JSON.stringify(staged.body).slice(0, 600)}`);
        return app;
      };
      /** Every order and job as 0.2.5 left them. */
      let before: { orders: Row[]; jobs: Row[] };

      beforeAll(async () => {
        server = await boot(engine as Engine, PORT_BASE + index * PORTS_PER_ENGINE, WEDNESDAY - 60_000, { database: `printing_payments_${engine}${process.env["CONTRACT_DB_SUFFIX"] ?? ""}` });
        staff = new Caller(server.base, { origin: server.base });
        await staff.signIn(ADMIN.email, ADMIN.password);
        if (engine === "sqlite") {
          const file = join(tmpdir(), `printing-payments-contract-${String(PORT_BASE)}.db`);
          rmSync(file, { force: true });
          writeFileSync(file, "");
          connectionId = ok(await staff.post<{ id: string }>("/api/v1/connections", { name: "marlow-press", engine: "sqlite", dsn: `sqlite:${file}` }), 201).id;
        } else {
          connectionId = ok(await staff.get<{ connections: { id: string; name: string }[] }>("/api/v1/connections")).connections.find((c) => c.name === "northwind")!.id;
        }
        const addOn = addOnBundle("customiser");
        const stagedAddOn = await staff.post(`/api/v1/add-ons/upload?expectedSha512=${encodeURIComponent(addOn.integrity)}`, addOn.buffer);
        if (![200, 201].includes(stagedAddOn.status)) throw new Error(`add-on upload: ${JSON.stringify(stagedAddOn.body).slice(0, 600)}`);
        const app = await install(FROM_MANIFEST);
        const body = { key: app.key, version: app.version, connectionId };
        const plan = ok(await staff.post<{ plan: { checksum: string; installable: boolean } }>("/api/v1/apps/plan", body)).plan;
        if (!plan.installable) throw new Error(`not installable: ${JSON.stringify(plan).slice(0, 3000)}`);
        ok(await staff.post("/api/v1/apps/install", { ...body, planChecksum: plan.checksum, addOns: [{ key: addOn.key, version: addOn.version }] }));
        ok(await staff.patch(`/api/v1/connections/${connectionId}`, { timezone: "Europe/London", currency: "GBP" }));
        await server.setClock(WEDNESDAY, true);
        ok(await staff.post("/api/v1/apps/printing/sample-data"));
        await until(async () => (ok(await staff.get<{ loaded: boolean }>("/api/v1/apps/printing/sample-data")).loaded ? true : undefined), "the sample to be added");
        ok(await staff.put("/api/v1/public-api", { enabled: true }));
        tables = ok(await new Caller(server.base).get<{ tables?: Record<string, string> }>("/apps/printing/customer/surface-config.json")).tables ?? {};
        await until(async () => ((await rows("jobs")).length >= 15 ? true : undefined), "the sample's jobs to be added");
        await server.setClock(WEDNESDAY);
        before = { orders: await rows("orders"), jobs: await rows("jobs") };
        expect(before.orders.length).toBeGreaterThanOrEqual(10);
      }, 600_000);

      afterAll(async () => {
        await server?.stop();
      });

      it(`updates in place from ${FROM}, keeping every order and job, each order owing its total`, async () => {
        const app = await install(NEXT);
        const plan = ok(await staff.post<{ plan: { checksum: string; installable: boolean; problems: unknown[] } }>("/api/v1/apps/plan", { key: app.key, version: app.version, connectionId })).plan;
        expect([plan.installable, plan.problems]).toEqual([true, []]);
        const reply = await staff.post<{ from: string; to: string }>("/api/v1/apps/printing/update", { planChecksum: plan.checksum, publicAccess: true, publicWider: true, roleTables: true, roleGrants: true });
        expect(reply.status, JSON.stringify(reply.body).slice(0, 1500)).toBe(200);
        expect([reply.body.from, reply.body.to]).toEqual([FROM, app.version]);
        tables = ok(await new Caller(server.base).get<{ tables?: Record<string, string> }>("/apps/printing/customer/surface-config.json")).tables ?? {};
        const orders = await rows("orders");
        const jobs = await rows("jobs");
        const keep = (list: Row[], columns: string[]) => list.map((r) => Object.fromEntries(columns.map((c) => [c, r[c] === null || r[c] === undefined ? null : String(r[c])]))).sort((a, b) => Number(a["id"]) - Number(b["id"]));
        const orderColumns = ["id", "number", "status", "name", "email", "delivery_method", "total", "placed_at", "link_token"];
        const jobColumns = ["id", "order_id", "code", "stage", "price", "proof_state", "ready_by"];
        expect(keep(orders, orderColumns)).toEqual(keep(before.orders, orderColumns));
        expect(keep(jobs, jobColumns)).toEqual(keep(before.jobs, jobColumns));
        for (const order of orders) {
          expect([money(order["due"]), money(order["paid"])], String(order["number"])).toEqual([money(order["total"]), "0.00"]);
        }
        expect(await rows("payments")).toEqual([]);
      }, 300_000);

      it("arrives switched off: the works is told payments are off, and the shop that nothing can be paid online", async () => {
        const apps = ok(await staff.get<{ data: { apps: { appKey: string; connectionId: string; enabled: boolean; tables: { valid: boolean }[] }[] } }>("/api/v1/payments/apps")).data.apps;
        const printing = apps.find((a) => a.appKey === "printing" && a.connectionId === connectionId)!;
        expect([printing.enabled, printing.tables.map((t) => t.valid)]).toEqual([false, [true]]);
        const config = ok(await staff.get<{ payments?: { on: boolean } }>("/apps/printing/staff/surface-config.json"));
        expect(config.payments?.on).toBe(false);
        // The shop's own door, as the customer's browser at the shop's address asks.
        const served = ok(await new Caller(server.base).get<{ publishableKey: string; tables?: Record<string, string>; publicKeys?: Record<string, string> }>("/apps/printing/customer/surface-config.json"));
        const browser = new Caller(server.base).fetchAs();
        const shop = new AdminiumShop({ baseUrl: server.base, publishableKey: served.publishableKey, ...(served.tables === undefined ? {} : { tables: served.tables }), ...(served.publicKeys === undefined ? {} : { publicKeys: served.publicKeys }) }, { fetch: browser });
        expect(await shop.after().payOffer!()).toEqual({ online: false, test: false });
      }, 120_000);

      it("records the counter's card payment through Adminium once switched on, and the order then owes nothing", async () => {
        ok(await staff.post("/api/v1/payments/apps/switch", { connectionId, appKey: "printing", enabled: true }));
        const config = ok(await staff.get<{ payments?: { on: boolean; refund: boolean } }>("/apps/printing/staff/surface-config.json"));
        expect(config.payments?.on).toBe(true);
        const order = (await rows("orders")).find((o) => o["status"] === "ready" && o["delivery_method"] === "collect") ?? (await rows("orders")).find((o) => o["status"] === "ready")!;
        const tableId = ok(await staff.get<{ model: { tables: { id: string; name: string }[] } }>(`/api/v1/connections/${connectionId}/schema`)).model.tables.find((t) => t.name === (tables["orders"] ?? "printing_orders"))!.id;
        const record = { connectionId, table: tableId, recordId: String(order["id"]), paidOn: "2026-08-05", note: null, key: "counter-0123456789abcdef" };
        // More than is owed is refused, and nothing is written.
        const over = await staff.post<{ error: { details?: { reason?: string } } }>("/api/v1/payments/record-payment", { ...record, amount: (Number(order["total"]) + 1).toFixed(2), way: "cash", approvalCode: null, last4: null, key: "counter-over-0123456789" });
        expect(over.status).toBe(422);
        expect(await rows("payments")).toEqual([]);
        const said = ok(await staff.post<{ data: { due: string; already: boolean } }>("/api/v1/payments/record-payment", { ...record, amount: money(order["total"]), way: "card", approvalCode: "084213", last4: "4417" }));
        expect([said.data.already, Number(said.data.due)]).toEqual([false, 0]);
        const [payment] = await rows("payments");
        expect(payment).toMatchObject({ method: "card", approval_code: "084213", card_last4: "4417" });
        expect(money(payment!["amount"])).toBe(money(order["total"]));
        expect(String(payment!["payment_ref"])).toBe("hand_counter-0123456789abcdef");
        const after = (await rows("orders")).find((o) => String(o["id"]) === String(order["id"]))!;
        expect([money(after["due"]), money(after["paid"]), money(after["paid_in"])]).toEqual(["0.00", money(order["total"]), money(order["total"])]);
        // The same key again records nothing new.
        const again = ok(await staff.post<{ data: { already: boolean } }>("/api/v1/payments/record-payment", { ...record, amount: money(order["total"]), way: "card", approvalCode: "084213", last4: "4417" }));
        expect(again.data.already).toBe(true);
        expect(await rows("payments")).toHaveLength(1);
      }, 120_000);
    });
  });
});
