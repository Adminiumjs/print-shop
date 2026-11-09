/**
 * A WORKS ON 0.2.2 TAKES THE NEXT RELEASE, AND ITS PROOFS STAY TRUE.
 *
 * The released 0.2.2 manifest (kept in `released/`, held to its tag) installed
 * with the Customiser on a BUILT Adminium, on SQLite, Postgres and MySQL; its
 * sample added and a customer's order proofed from the works' screens, with
 * its PDF. Then this checkout's manifest, packed as the next release, staged
 * and the app updated in place, the operator allowing what it asks (prepress
 * and the press now read the Customiser's settings). The update adds the proofs' two stamps
 * (`file_added_at`, `recorded_at`) empty on the proof already there, as it
 * adds every new column. Last the customer is erased: their proof's PDF goes,
 * and their order's page says the proof is no longer kept, never that it is
 * waiting. A proof made after the update, with its PDF, reads as waiting.
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

import { jobViews } from "../shop/after-view.ts";
import { firstChoice } from "../shop/config.ts";
import { AdminiumShop } from "../shop/door.ts";
import { type Catalogue, type Row } from "../shop/port.ts";
import { orderBody, useShop, type BasketLine } from "../shop/store.ts";
import { addOnBundle, appBundle, boot, Caller, ENGINES, missing, missingAddOn, ok, PORTS_PER_ENGINE, until, type Engine, type Server } from "./harness.ts";
import { MANIFEST_TEXT } from "./release.ts";

const why = missing() ?? missingAddOn("customiser");
if (why !== null && process.env["ADMINIUM_REQUIRE_CONTRACT"] === "1") throw new Error(`the upgrade contract must run here, and cannot: ${why}`);
const PORT_BASE = Number(process.env["CONTRACT_PORT_BASE"] ?? 4980);
const ADMIN = { email: process.env["E2E_ADMIN_EMAIL"] ?? "e2e@adminium.local", password: process.env["E2E_ADMIN_PASSWORD"] ?? "adminium-e2e-password" };
/** 10:20 on Wednesday 5 August 2026 in Marlow (British Summer Time). */
const WEDNESDAY = Date.parse("2026-08-05T09:20:00Z");
const REPO = fileURLToPath(new URL("../..", import.meta.url));
const FROM = "0.2.2";
/**
 * The released 0.2.2's own manifest, kept beside this test
 * (`released/printing-0.2.2.manifest.json`): read the same in a shallow CI
 * checkout with no tags, and held to the release's tag where there is one.
 */
const FROM_FILE = join(REPO, "src", "contract", "released", `printing-${FROM}.manifest.json`);
const FROM_MANIFEST = readFileSync(FROM_FILE, "utf8");
/** The tag's manifest, or null in a checkout with no tags (CI's). */
const TAGGED = (() => {
  try {
    return execFileSync("git", ["-C", REPO, "show", `v${FROM}:manifest.json`], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return null;
  }
})();

describe(`the released ${FROM} manifest kept beside the upgrade contract`, () => {
  it.skipIf(TAGGED === null)(`is the one tagged v${FROM}${TAGGED === null ? " — skipped: this checkout has no tags" : ""}`, () => {
    expect(FROM_MANIFEST).toBe(TAGGED);
  });
  it(`says it is ${FROM}`, () => {
    expect((JSON.parse(FROM_MANIFEST) as { version: string }).version).toBe(FROM);
  });
});
/** This checkout's manifest, as the release after 0.2.2 (the release stamps its number). */
const TO_MANIFEST = (() => {
  const manifest = JSON.parse(MANIFEST_TEXT) as { version: string };
  return manifest.version === FROM ? JSON.stringify({ ...manifest, version: "0.2.3" }, null, 2) : MANIFEST_TEXT;
})();
const SHOPPER = { name: "Nell Harper", email: "nell@harper-press.dev", address_line1: "2 Mill Lane", town: "Bourne End", postcode: "SL8 5PQ", may_email: false, language: "en-US" };
const PDF = Buffer.from("%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 258 173] >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n", "latin1");

describe.skipIf(why !== null)(`a works on ${FROM} updated, its proofs as they were${why === null ? "" : ` — skipped: ${why}`}`, () => {
  ENGINES.forEach(([engine, available], index) => {
    describe.skipIf(!available)(`on ${engine}`, () => {
      let server: Server;
      let staff: Caller;
      let connectionId = "";
      let served: { publishableKey: string; publicKeys?: Record<string, string>; tables?: Record<string, string>; settings?: Record<string, unknown> };
      let catalogue: Catalogue;
      const table = (ref: string) => encodeURIComponent(served?.tables?.[ref] ?? `printing_${ref}`);
      const originFetch: typeof fetch = (input, init) => {
        const headers = new Headers(init?.headers);
        headers.set("origin", server.base);
        return fetch(input, { ...init, headers });
      };
      const browser = () => new AdminiumShop({ baseUrl: server.base, publishableKey: served.publishableKey, ...(served.tables === undefined ? {} : { tables: served.tables }), ...(served.publicKeys === undefined ? {} : { publicKeys: served.publicKeys }), ...(served.settings === undefined ? {} : { settings: served.settings }) }, { fetch: originFetch });
      const rows = async (ref: string): Promise<Row[]> => ok(await staff.get<{ data: Row[] }>(`/api/v1/data/${connectionId}/${table(ref)}?limit=200`)).data;
      const install = async (manifest: string) => {
        const app = appBundle({ manifest });
        const staged = await staff.post(`/api/v1/apps/upload?expectedSha512=${encodeURIComponent(app.integrity)}`, app.buffer);
        if (![200, 201].includes(staged.status)) throw new Error(`upload: ${JSON.stringify(staged.body).slice(0, 600)}`);
        return app;
      };
      const sendProof = async (job: Row): Promise<Row> => {
        const stored = ok(await staff.send<{ ref: string }>("POST", `/api/v1/files?${new URLSearchParams({ filename: "proof.pdf", connectionId, table: served.tables?.["proofs"] ?? "printing_proofs", column: "file" }).toString()}`, PDF, { "content-type": "application/pdf" }), 201);
        return ok(await staff.post<{ data: Row }>(`/api/v1/data/${connectionId}/${table("proofs")}`, { values: { job_id: job["id"], kind: "email", file: stored.ref } }), 201).data;
      };
      let keys = 0;
      const place = async () => {
        const shop = browser();
        const p = catalogue.products.find((one) => one.code === "business-cards")!;
        const line: BasketLine = { id: "j1", productId: p.id, choice: { ...firstChoice(catalogue, p), qty: 250 }, design: null, features: [], artwork: [] };
        const values = { ...SHOPPER, delivery_method: "collect" };
        const quoted = await shop.quote(orderBody(values, [line], true));
        keys += 1;
        return shop.place(orderBody(values, [line], true), `printing-upgrade-${engine}-${String(keys).padStart(10, "0")}`, String(quoted.order["total"]));
      };
      /** The customer's order page, as its link reads it: each job's view. */
      const page = async (token: string) => {
        const door = browser().after();
        expect(await door.openShared(token)).toBe("opened");
        return jobViews(catalogue, (await door.readShared())!);
      };

      let before: Awaited<ReturnType<typeof place>>;
      let oldProof: Row;

      beforeAll(async () => {
        server = await boot(engine as Engine, PORT_BASE + index * PORTS_PER_ENGINE, WEDNESDAY - 60_000, { database: `printing_upgrade_${engine}${process.env["CONTRACT_DB_SUFFIX"] ?? ""}` });
        staff = new Caller(server.base, { origin: server.base });
        await staff.signIn(ADMIN.email, ADMIN.password);
        if (engine === "sqlite") {
          const file = join(tmpdir(), `printing-upgrade-contract-${String(PORT_BASE)}.db`);
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
        expect(app.version).toBe(FROM);
        const body = { key: app.key, version: app.version, connectionId };
        const plan = ok(await staff.post<{ plan: { checksum: string; installable: boolean } }>("/api/v1/apps/plan", body)).plan;
        if (!plan.installable) throw new Error(`not installable: ${JSON.stringify(plan).slice(0, 3000)}`);
        ok(await staff.post("/api/v1/apps/install", { ...body, planChecksum: plan.checksum, addOns: [{ key: addOn.key, version: addOn.version }] }));
        ok(await staff.patch(`/api/v1/connections/${connectionId}`, { timezone: "Europe/London", currency: "GBP" }));
        await server.setClock(WEDNESDAY, true);
        ok(await staff.post("/api/v1/apps/printing/sample-data"));
        await until(async () => (ok(await staff.get<{ loaded: boolean }>("/api/v1/apps/printing/sample-data")).loaded ? true : undefined), "the sample to be added");
        ok(await staff.put("/api/v1/public-api", { enabled: true }));
        served = ok(await new Caller(server.base).get<typeof served>("/apps/printing/customer/surface-config.json"));
        await until(async () => ((await rows("jobs")).length >= 15 ? true : undefined), "the sample's jobs to be added");
        await server.setClock(WEDNESDAY);
        catalogue = await browser().catalogue();
        useShop.setState({ catalogue });
        // On 0.2.2: an order, and its proof sent from the works' screens with its PDF.
        before = await place();
        const job = (await rows("jobs")).find((j) => String(j["order_id"]) === String(before.order["id"]))!;
        oldProof = await sendProof(job);
      }, 600_000);

      afterAll(async () => {
        await server?.stop();
      });

      it(`updates in place from ${FROM}, adding the proofs' two stamps empty on the proof already there`, async () => {
        const app = await install(TO_MANIFEST);
        const plan = ok(await staff.post<{ plan: { checksum: string; installable: boolean; problems: unknown[] } }>("/api/v1/apps/plan", { key: app.key, version: app.version, connectionId })).plan;
        expect([plan.installable, plan.problems]).toEqual([true, []]);
        // Prepress and the press now read the Customiser's settings (a proof's one-colour line): the operator allows it.
        const asked = await staff.post<{ error: { details: { reason: string; roleTables: { role: string; table: string; wider: { actions: string[] } }[] } } }>("/api/v1/apps/printing/update", { planChecksum: plan.checksum, publicAccess: true });
        expect(asked.status, JSON.stringify(asked.body).slice(0, 600)).toBe(422);
        expect(asked.body.error.details.reason).toBe("ROLE_TABLES_WIDER");
        expect(asked.body.error.details.roleTables.map((w) => [w.role, w.table, w.wider.actions])).toEqual([
          ["prepress", "settings", ["read"]],
          ["press", "settings", ["read"]],
        ]);
        const reply = await staff.post<{ from: string; to: string }>("/api/v1/apps/printing/update", { planChecksum: plan.checksum, publicAccess: true, roleTables: true });
        expect(reply.status, JSON.stringify(reply.body).slice(0, 1500)).toBe(200);
        expect([reply.body.from, reply.body.to]).toEqual([FROM, app.version]);
        served = ok(await new Caller(server.base).get<typeof served>("/apps/printing/customer/surface-config.json"));
        const kept = (await rows("proofs")).find((p) => String(p["id"]) === String(oldProof["id"]))!;
        expect([kept["file_added_at"] ?? null, kept["recorded_at"] ?? null]).toEqual([null, null]);
        expect(kept["file"]).not.toBeNull();
        // Its customer's page still offers it: the PDF is there.
        const [job] = await page(before.link!.token);
        expect(job!.waiting?.id).toBe(String(oldProof["id"]));
      }, 300_000);

      it("says the proof made before the update is no longer kept once its customer is erased, never that it is waiting", async () => {
        const preview = await staff.post("/api/v1/privacy/erase/preview", { address: SHOPPER.email });
        expect(preview.status, JSON.stringify(preview.body).slice(0, 400)).toBe(200);
        const erased = await staff.post("/api/v1/privacy/erase", { address: SHOPPER.email, confirm: SHOPPER.email });
        expect(erased.status, JSON.stringify(erased.body).slice(0, 400)).toBe(200);
        const gone = (await rows("proofs")).find((p) => String(p["id"]) === String(oldProof["id"]))!;
        expect(gone["file"] ?? null).toBeNull();
        const [job] = await page(before.link!.token);
        expect(job!.waiting).toBeNull();
        expect(job!.gone?.id).toBe(String(oldProof["id"]));
        expect(job!.forgotten).toBe(true);
      }, 300_000);

      it("reads a proof made after the update, with its PDF, as waiting, with both stamps", async () => {
        const after = await place();
        const job = (await rows("jobs")).find((j) => String(j["order_id"]) === String(after.order["id"]))!;
        const proof = await sendProof(job);
        const stored = (await rows("proofs")).find((p) => String(p["id"]) === String(proof["id"]))!;
        expect(stored["file_added_at"]).not.toBeNull();
        expect(stored["recorded_at"]).not.toBeNull();
        const [view] = await page(after.link!.token);
        expect(view!.waiting?.id).toBe(String(proof["id"]));
        expect(view!.forgotten).toBe(false);
      }, 300_000);
    });
  });
});
