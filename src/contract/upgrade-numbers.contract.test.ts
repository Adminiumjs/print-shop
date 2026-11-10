/**
 * A WORKS ON 0.2.3 TAKES THE NEXT RELEASE: THE JOBS IT ADDED BY HAND ARE GIVEN THEIR PLACE.
 *
 * On 0.2.3 a job's place in its order was the shop's to send, and a job added
 * on the dashboard had none. The next release numbers a job's place
 * (`sequence`) and names a job ("MP-4122/2") and its proofs ("MP-4122/2 #1")
 * after it. The released 0.2.3 manifest (kept in `released/`, held to its
 * tag) installed with the Customiser on a BUILT Adminium, on SQLite, Postgres
 * and MySQL, with the sample it shipped; a second job added by hand to the
 * sample's MP-4122, and its proof sent with its PDF. Then this checkout's
 * manifest staged and the app updated in place:
 *
 *   - the job added by hand is given the next place in its order, and is
 *     named by it, and so is its proof (Adminium 0.3.54 numbers the rows an
 *     update finds without a place; an older Adminium leaves them without one,
 *     and that check is marked as failing there);
 *   - every other job keeps its place, and is named by it;
 *   - a job in progress keeps the ready-by it had: MP-4114, whose change
 *     asked of a proof sent again since now counts on the job, keeps the day
 *     it fell back to on 0.2.3 (only its next change or its approval sets it
 *     again).
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

import { CONFIG_WRITABLE } from "../manifest/public.ts";
import { addOnBundle, appBundle, boot, Caller, ENGINES, missing, missingAddOn, ok, PORTS_PER_ENGINE, until, type Engine, type Server } from "./harness.ts";
import { engineAtLeast, MANIFEST_TEXT } from "./release.ts";

const why = missing() ?? missingAddOn("customiser");
if (why !== null && process.env["ADMINIUM_REQUIRE_CONTRACT"] === "1") throw new Error(`the numbering upgrade contract must run here, and cannot: ${why}`);
const PORT_BASE = Number(process.env["CONTRACT_PORT_BASE"] ?? 4980);
const ADMIN = { email: process.env["E2E_ADMIN_EMAIL"] ?? "e2e@adminium.local", password: process.env["E2E_ADMIN_PASSWORD"] ?? "adminium-e2e-password" };
/** 10:20 on Wednesday 5 August 2026 in Marlow (British Summer Time). */
const WEDNESDAY = Date.parse("2026-08-05T09:20:00Z");
const REPO = fileURLToPath(new URL("../..", import.meta.url));
const FROM = "0.2.3";
/** Adminium numbers, at an update, the rows a newly numbered column finds empty. */
const NUMBERS = engineAtLeast("0.3.54");
const FROM_MANIFEST = readFileSync(join(REPO, "src", "contract", "released", `printing-${FROM}.manifest.json`), "utf8");
/** The sample files 0.2.3 shipped: the same as 0.2.2's, kept once beside them. */
const FROM_SEEDS = join(REPO, "src", "contract", "released", "seeds-0.2.2");
/** A file at the tag, or null in a checkout with no tags (CI's). */
const tagged = (path: string): string | null => {
  try {
    return execFileSync("git", ["-C", REPO, "show", `v${FROM}:${path}`], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 * 1024 * 1024 });
  } catch {
    return null;
  }
};
const TAGGED = tagged("manifest.json");

describe(`the released ${FROM} manifest kept beside the numbering upgrade contract`, () => {
  const skipped = TAGGED === null ? " — skipped: this checkout has no tags" : "";
  it.skipIf(TAGGED === null)(`is the one tagged v${FROM}${skipped}`, () => {
    expect(FROM_MANIFEST === TAGGED).toBe(true);
  });
  it.skipIf(TAGGED === null)(`is installed with the sample files tagged v${FROM}${skipped}`, () => {
    const files = JSON.parse(FROM_MANIFEST) as { sampleData: { file: string; addOns: Record<string, { file: string }> } };
    for (const file of [files.sampleData.file, ...Object.values(files.sampleData.addOns).map((a) => a.file)]) {
      expect(readFileSync(join(FROM_SEEDS, file.replace(/^seeds\//, "")), "utf8") === tagged(file), file).toBe(true);
    }
  });
  it(`says it is ${FROM}, and gives a job's place no number`, () => {
    const manifest = JSON.parse(FROM_MANIFEST) as { version: string; requiredSchema: { tables: { ref: string; columns: { ref: string; rules?: Record<string, unknown> }[] }[] } };
    expect(manifest.version).toBe(FROM);
    const position = manifest.requiredSchema.tables.find((t) => t.ref === "jobs")!.columns.find((c) => c.ref === "position")!;
    expect(position.rules?.["sequence"]).toBeUndefined();
  });
});

const PDF = Buffer.from("%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 258 173] >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n", "latin1");
type Row = Record<string, unknown>;

describe.skipIf(why !== null)(`a works on ${FROM} with a job added by hand, updated${why === null ? "" : ` — skipped: ${why}`}`, () => {
  ENGINES.forEach(([engine, available], index) => {
    describe.skipIf(!available)(`on ${engine}`, () => {
      let server: Server;
      let staff: Caller;
      let connectionId = "";
      let tables: Record<string, string> = {};
      const table = (ref: string) => encodeURIComponent(tables[ref] ?? `printing_${ref}`);
      const rows = async (ref: string): Promise<Row[]> => ok(await staff.get<{ data: Row[] }>(`/api/v1/data/${connectionId}/${table(ref)}?limit=200`)).data;
      const install = async (manifest: string, seeds?: string) => {
        const app = appBundle({ manifest, ...(seeds === undefined ? {} : { seeds }) });
        const staged = await staff.post(`/api/v1/apps/upload?expectedSha512=${encodeURIComponent(app.integrity)}`, app.buffer);
        if (![200, 201].includes(staged.status)) throw new Error(`upload: ${JSON.stringify(staged.body).slice(0, 600)}`);
        return app;
      };
      const orderOf = async (number: string) => (await rows("orders")).find((o) => o["number"] === number)!;
      const jobOf = async (id: unknown) => (await rows("jobs")).find((j) => String(j["id"]) === String(id))!;

      /** The job added by hand on 0.2.3, and its proof. */
      let added: Row;
      let addedProof: Row;
      /** MP-4114's job as 0.2.3 left it. */
      let posters: Row;

      beforeAll(async () => {
        server = await boot(engine as Engine, PORT_BASE + index * PORTS_PER_ENGINE, WEDNESDAY - 60_000, { database: `printing_numbers_${engine}${process.env["CONTRACT_DB_SUFFIX"] ?? ""}` });
        staff = new Caller(server.base, { origin: server.base });
        await staff.signIn(ADMIN.email, ADMIN.password);
        if (engine === "sqlite") {
          const file = join(tmpdir(), `printing-numbers-contract-${String(PORT_BASE)}.db`);
          rmSync(file, { force: true });
          writeFileSync(file, "");
          connectionId = ok(await staff.post<{ id: string }>("/api/v1/connections", { name: "marlow-press", engine: "sqlite", dsn: `sqlite:${file}` }), 201).id;
        } else {
          connectionId = ok(await staff.get<{ connections: { id: string; name: string }[] }>("/api/v1/connections")).connections.find((c) => c.name === "northwind")!.id;
        }
        const addOn = addOnBundle("customiser");
        const stagedAddOn = await staff.post(`/api/v1/add-ons/upload?expectedSha512=${encodeURIComponent(addOn.integrity)}`, addOn.buffer);
        if (![200, 201].includes(stagedAddOn.status)) throw new Error(`add-on upload: ${JSON.stringify(stagedAddOn.body).slice(0, 600)}`);
        const app = await install(FROM_MANIFEST, FROM_SEEDS);
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
        tables = ok(await new Caller(server.base).get<{ tables?: Record<string, string> }>("/apps/printing/customer/surface-config.json")).tables ?? {};
        await until(async () => ((await rows("jobs")).length >= 15 ? true : undefined), "the sample's jobs to be added");
        await server.setClock(WEDNESDAY);
        // On 0.2.3: the same work again added to MP-4122 on the dashboard, with no place (0.2.3 gives it none), and its proof.
        const order = await orderOf("MP-4122");
        const first = (await rows("jobs")).find((j) => String(j["order_id"]) === String(order["id"]))!;
        const values = Object.fromEntries(CONFIG_WRITABLE.filter((c) => c !== "position" && first[c] !== null && first[c] !== undefined).map((c) => [c, first[c]]));
        added = ok(await staff.post<{ data: Row }>(`/api/v1/data/${connectionId}/${table("jobs")}`, { values: { ...values, order_id: order["id"] } }), 201).data;
        expect([Number(first["position"]), (await jobOf(added["id"]))["position"] ?? null]).toEqual([1, null]);
        const stored = ok(await staff.send<{ ref: string }>("POST", `/api/v1/files?${new URLSearchParams({ filename: "proof.pdf", connectionId, table: tables["proofs"] ?? "printing_proofs", column: "file" }).toString()}`, PDF, { "content-type": "application/pdf" }), 201);
        addedProof = ok(await staff.post<{ data: Row }>(`/api/v1/data/${connectionId}/${table("proofs")}`, { values: { job_id: added["id"], kind: "email", file: stored.ref } }), 201).data;
        const mp4114 = await orderOf("MP-4114");
        posters = (await rows("jobs")).find((j) => String(j["order_id"]) === String(mp4114["id"]))!;
        expect(Number(posters["changes"])).toBe(0);
      }, 600_000);

      afterAll(async () => {
        await server?.stop();
      });

      it(`updates in place from ${FROM}: every job already placed named by its place, and MP-4114 keeps its ready-by`, async () => {
        const app = await install(MANIFEST_TEXT);
        const plan = ok(await staff.post<{ plan: { checksum: string; installable: boolean; problems: unknown[] } }>("/api/v1/apps/plan", { key: app.key, version: app.version, connectionId })).plan;
        expect([plan.installable, plan.problems]).toEqual([true, []]);
        const reply = await staff.post<{ from: string; to: string }>("/api/v1/apps/printing/update", { planChecksum: plan.checksum, publicAccess: true, roleTables: true });
        expect(reply.status, JSON.stringify(reply.body).slice(0, 1500)).toBe(200);
        expect([reply.body.from, reply.body.to]).toEqual([FROM, app.version]);
        const numbers = new Map((await rows("orders")).map((o) => [String(o["id"]), String(o["number"])]));
        const placed = (await rows("jobs")).filter((j) => String(j["id"]) !== String(added["id"]));
        expect(placed.length).toBeGreaterThanOrEqual(15);
        for (const job of placed) expect(job["code"], String(job["id"])).toBe(`${numbers.get(String(job["order_id"]))!}/${String(job["position"])}`);
        // The change asked of MP-4114's first proof, sent again since, now counts on the job; the ready-by 0.2.3 left stays.
        const after = await jobOf(posters["id"]);
        expect([Number(after["changes"]), String(after["ready_by"]).slice(0, 10)]).toEqual([1, String(posters["ready_by"]).slice(0, 10)]);
        expect(String(after["ready_by"]).slice(0, 10)).toBe("2026-08-11");
      }, 300_000);

      (NUMBERS ? it : it.fails)(
        `gives the job added by hand on ${FROM} the next place in its order, and names it and its proof by it${NUMBERS ? "" : " — needs Adminium 0.3.54's update numbering"}`,
        async () => {
          const job = await jobOf(added["id"]);
          expect([job["position"] === null ? null : Number(job["position"]), job["code"]]).toEqual([2, "MP-4122/2"]);
          const proof = (await rows("proofs")).find((p) => String(p["id"]) === String(addedProof["id"]))!;
          expect([proof["job_position"] === null ? null : Number(proof["job_position"]), proof["title"]]).toEqual([2, "MP-4122/2 #1"]);
          expect((await rows("proofs")).filter((p) => !/^MP-\d+\/\d+ #\d+$/.test(String(p["title"] ?? ""))).map((p) => p["title"])).toEqual([]);
        },
        120_000,
      );

      it("gives the next job added on the dashboard the place after it", async () => {
        const order = await orderOf("MP-4122");
        const values = Object.fromEntries(CONFIG_WRITABLE.filter((c) => c !== "position" && added[c] !== null && added[c] !== undefined).map((c) => [c, added[c]]));
        const third = ok(await staff.post<{ data: Row }>(`/api/v1/data/${connectionId}/${table("jobs")}`, { values: { ...values, order_id: order["id"] } }), 201).data;
        const stored = await jobOf(third["id"]);
        // After the largest place the order holds: the hand-added job's, once numbered, else the first's.
        expect([Number(stored["position"]), stored["code"]]).toEqual(NUMBERS ? [3, "MP-4122/3"] : [2, "MP-4122/2"]);
      }, 120_000);
    });
  });
});
