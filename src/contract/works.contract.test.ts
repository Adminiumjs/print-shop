/**
 * THE WORKS, AGAINST A REAL ADMINIUM.
 *
 * This repo's manifest and sample, installed with the built Customiser on a
 * BUILT Adminium (`ADMINIUM_REPO`) at the comp's pinned moment: 10:20 on
 * Wednesday 5 August 2026 in Marlow. The works' own door (the code the staff
 * build runs, `studio/adminiumWorks.ts`, and its writes, `studio/actions.ts`)
 * is booted on each role's own session, as their screens boot it, and the
 * folded cards for Ostara Flowers (MP-4122) are walked through the works:
 *
 *   - prepress sends a proof with its PDF; the job may not go to press yet;
 *   - the proof comes back approved; Adminium dates the ready-by from it;
 *   - prepress puts the job on the press;
 *   - the press records spoilage (a row, added up on the job) and marks the
 *     job ready, and its order with it (the "ready to collect" e-mail);
 *   - the counter hands it over: the job and the order collected;
 *   - the owner saves a figure of the rate card to its row;
 *   - each floor role signs out, and its session reads nothing more.
 *
 * Each role is refused what its limits keep from it. It runs with
 * `CONTRACT=1` where a built Adminium (`ADMINIUM_REPO`) and a built add-ons
 * checkout (`ADD_ONS_REPO`) are, and says why it skipped otherwise. Its ports
 * start at `CONTRACT_PORT_BASE` (4990), three an engine.
 */
import { rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AdminiumWorks } from "../studio/adminiumWorks.ts";
import { collectJob, sendProof, walkJob } from "../studio/actions.ts";
import { createSessionTransport } from "../studio/transport/sessionSource.ts";
import { loadStaffConfig } from "../studio/transport/staffConnection.ts";
import { isApiError, num, type Row } from "../studio/wire.ts";
import { addOnBundle, appBundle, boot, Caller, ENGINES, missing, missingAddOn, ok, PORTS_PER_ENGINE, until, type Engine, type Server } from "./harness.ts";
import { MANIFEST_TEXT } from "./release.ts";

const why = missing() ?? missingAddOn("customiser");
if (why !== null && process.env["ADMINIUM_REQUIRE_CONTRACT"] === "1") throw new Error(`the contract must run here, and cannot: ${why}`);
const PORT_BASE = Number(process.env["CONTRACT_PORT_BASE"] ?? 4990);
const ADMIN = { email: process.env["E2E_ADMIN_EMAIL"] ?? "e2e@adminium.local", password: process.env["E2E_ADMIN_PASSWORD"] ?? "adminium-e2e-password" };
/** 10:20 on Wednesday 5 August 2026 in Marlow (British Summer Time). */
const WEDNESDAY = Date.parse("2026-08-05T09:20:00Z");
const newPassword = (): string => `${randomBytes(18).toString("base64url")}Aa1!`;

describe.skipIf(why !== null)(`the works against a built Adminium${why === null ? "" : ` — skipped: ${why}`}`, () => {
  ENGINES.forEach(([engine, available], index) => {
    describe.skipIf(!available)(`on ${engine}`, () => {
      let server: Server;
      let owner: Caller;
      let connectionId = "";
      let tables: Record<string, string> = {};
      const doors: Record<string, AdminiumWorks> = {};

      const rows = async (table: string): Promise<Row[]> => {
        const real = tables[table] ?? `printing_${table}`;
        const out: Row[] = [];
        for (let offset = 0; ; offset += 200) {
          const page = ok(await owner.get<{ data: Row[] }>(`/api/v1/data/${connectionId}/${encodeURIComponent(real)}?limit=200&offset=${String(offset)}`)).data;
          out.push(...page);
          if (page.length < 200) return out;
        }
      };
      const doorFor = async (caller: Caller): Promise<AdminiumWorks> => {
        const cfg = (await loadStaffConfig({ hostedStaff: true, base: "/apps/printing/staff/", fetchImpl: caller.fetchAs() }))!;
        tables = { ...tables, ...cfg.tables };
        const transport = createSessionTransport({
          tableOfRef: cfg.tables,
          connectionId: cfg.connectionId ?? undefined,
          staff: { csrfToken: cfg.csrfToken, timezone: cfg.timezone, timezoneSource: cfg.timezoneSource, serverTimezone: cfg.serverTimezone, currency: cfg.currency },
          fetchImpl: caller.fetchAs(),
        });
        const said = Date.parse(String(cfg.now));
        return new AdminiumWorks(transport, cfg, { fetchImpl: caller.fetchAs(), skew: Number.isNaN(said) ? 0 : said - Date.now() });
      };
      /** Someone holding one of the app's roles, signed in as their screens sign them in. */
      const staffAs = async (role: string, name: string): Promise<AdminiumWorks> => {
        const roles = ok(await owner.get<{ roles: { id: string; name: string; slug?: string }[] }>("/api/v1/roles")).roles;
        const found = roles.find((r) => r.slug === `printing-${role}`) ?? roles.find((r) => r.name.toLowerCase() === role)!;
        const email = `${role}.${engine}@marlowpress.example`;
        const invited = ok(await owner.post<{ invite: { token: string } }>("/api/v1/users", { email, name, roleIds: [found.id] }), 201);
        const password = newPassword();
        ok(await new Caller(server.base).post("/api/v1/auth/password/reset", { token: invited.invite.token, newPassword: password }));
        const caller = new Caller(server.base);
        ok(await caller.post("/api/v1/auth/login", { email, password }));
        return doorFor(caller);
      };
      const job = async (door: AdminiumWorks, number: string): Promise<{ data: Awaited<ReturnType<AdminiumWorks["load"]>>; job: Row; order: Row }> => {
        const data = await door.load();
        const order = data.orders.find((o) => o["number"] === number)!;
        return { data, order, job: data.jobs.find((j) => String(j["order_id"]) === String(order.id))! };
      };

      beforeAll(async () => {
        server = await boot(engine as Engine, PORT_BASE + index * PORTS_PER_ENGINE, WEDNESDAY - 60_000, { database: `printing_works_${engine}${process.env["CONTRACT_DB_SUFFIX"] ?? ""}` });
        owner = new Caller(server.base, { origin: server.base });
        await owner.signIn(ADMIN.email, ADMIN.password);
        if (engine === "sqlite") {
          const file = join(tmpdir(), `printing-works-contract-${String(PORT_BASE)}.db`);
          rmSync(file, { force: true });
          writeFileSync(file, "");
          connectionId = ok(await owner.post<{ id: string }>("/api/v1/connections", { name: "marlow-press", engine: "sqlite", dsn: `sqlite:${file}` }), 201).id;
        } else {
          connectionId = ok(await owner.get<{ connections: { id: string; name: string }[] }>("/api/v1/connections")).connections.find((c) => c.name === "northwind")!.id;
        }
        const customiser = addOnBundle("customiser");
        const stagedAddOn = await owner.post(`/api/v1/add-ons/upload?expectedSha512=${encodeURIComponent(customiser.integrity)}`, customiser.buffer);
        expect([200, 201], JSON.stringify(stagedAddOn.body).slice(0, 800)).toContain(stagedAddOn.status);
        const app = appBundle({ manifest: MANIFEST_TEXT });
        const staged = await owner.post(`/api/v1/apps/upload?expectedSha512=${encodeURIComponent(app.integrity)}`, app.buffer);
        expect([200, 201], JSON.stringify(staged.body).slice(0, 800)).toContain(staged.status);
        const body = { key: app.key, version: app.version, connectionId };
        const plan = ok(await owner.post<{ plan: { installable: boolean; checksum: string } }>("/api/v1/apps/plan", body)).plan;
        expect(plan.installable, JSON.stringify(plan).slice(0, 3000)).toBe(true);
        const install = await owner.post<{ rules: { skipped: unknown[] } }>("/api/v1/apps/install", { ...body, planChecksum: plan.checksum, addOns: [{ key: customiser.key, version: customiser.version }] });
        if (install.status !== 200) throw new Error(`install refused: ${JSON.stringify(install.body).slice(0, 3000)}`);
        expect(JSON.stringify(install.body.rules.skipped)).toBe("[]");
        ok(await owner.patch(`/api/v1/connections/${connectionId}`, { timezone: "Europe/London", currency: "GBP" }));

        await server.setClock(WEDNESDAY, true);
        ok(await owner.post("/api/v1/apps/printing/sample-data"));
        await until(async () => (ok(await owner.get<{ loaded: boolean }>("/api/v1/apps/printing/sample-data")).loaded ? true : undefined), "the sample to be added");
        doors["owner"] = await doorFor(owner);
        // On Postgres and MySQL the sample says it is loaded before the rows it adds through the Customiser's section are in (the jobs among them): wait for them.
        await until(async () => ((await doors["owner"]!.load()).jobs.length >= 15 ? true : undefined), "the sample's jobs to be added");
        await server.setClock(WEDNESDAY);

        doors["prepress"] = await staffAs("prepress", "Priya Shah");
        doors["press"] = await staffAs("press", "Tom Ellis");
        doors["counter"] = await staffAs("counter", "Jo Marsh");
      }, 600_000);

      afterAll(async () => {
        await server?.stop();
      });

      it("opens each role's screens on the rows its role reads", async () => {
        const press = await doors["press"]!.load();
        expect(press.jobs.length).toBeGreaterThan(10);
        expect(press.orders.find((o) => o["number"] === "MP-4122")).toBeDefined();
        expect(doors["press"]!.who().roles).toEqual(["press"]);
        expect(doors["prepress"]!.who().can("proofs", "create")).toBe(true);
        expect(doors["press"]!.who().can("proofs", "create")).toBe(false);
        expect(doors["owner"]!.facts().zone).toBe("Europe/London");
      });

      it("sends a proof with its PDF, and holds the job in prepress until it is approved", async () => {
        const prepress = doors["prepress"]!;
        const { data, job: cards } = await job(prepress, "MP-4122");
        expect(cards["stage"]).toBe("prepress");
        // Prepress reads the order's name, which the proof sheet says; never the customer's e-mail or address.
        const order = data.orders.find((o) => String(o.id) === String(cards["order_id"]))!;
        expect([order["name"], order["email"] ?? null, order["postcode"] ?? null]).toEqual(["Ostara Flowers", null, null]);
        const pdf = new Blob([new TextEncoder().encode("%PDF-1.4\n1 0 obj << /Type /Page /MediaBox [0 0 306 431] >>\n%%EOF\n")], { type: "application/pdf" });
        await sendProof(prepress, data, cards, { file: { blob: pdf, filename: "proof-mp-4122.pdf" }, kind: "email", note: "The fold is marked in blue." }, prepress.who());
        const proofs = (await rows("proofs")).filter((p) => String(p["job_id"]) === String(cards.id));
        expect(proofs.map((p) => [p["version"], p["state"], p["kind"], p["note"]])).toEqual([[1, "sent", "email", "The fold is marked in blue."]]);
        // Sent with no order: Adminium takes its job's.
        expect(String(proofs[0]!["order_id"])).toBe(String(cards["order_id"]));
        expect(String(proofs[0]!["file"])).toMatch(/file_/);
        const after = await job(prepress, "MP-4122");
        expect(after.job["proof_state"]).toBe("sent");
        expect(after.job["artwork_checked"]).toBe(true);
        // Not to press before the yes: refused by Adminium, whoever asks.
        const refused = await prepress.moveJob(after.job, "printing").catch((e: unknown) => e);
        expect(isApiError(refused) && refused.code).toBe("STATE_MOVE_REFUSED");
      });

      it("dates the ready-by from the approval, and lets prepress put the job on the press", async () => {
        const sent = (await rows("proofs")).find((p) => p["state"] === "sent" && p["note"] === "The fold is marked in blue.")!;
        // The customer's yes (their own claimed write is the after-order side's contract): the proof approved.
        ok(await owner.patch(`/api/v1/data/${connectionId}/${encodeURIComponent(tables["proofs"] ?? "printing_proofs")}/${String(sent.id)}`, { values: { state: "approved" }, from: "sent" }));
        const prepress = doors["prepress"]!;
        const approved = await job(prepress, "MP-4122");
        expect(approved.job["proof_state"]).toBe("approved");
        expect(num(approved.job["proof_ok"])).toBe(1);
        // Three working days from 10:20 on Wednesday, before the two o'clock cut-off.
        expect(String(approved.job["ready_by"]).slice(0, 10)).toBe("2026-08-10");
        const onPress = await walkJob(prepress, approved.data, approved.job, "printing", prepress.who());
        expect(onPress["stage"]).toBe("printing");
        // Prepress goes no further than the press.
        const further = await prepress.moveJob(onPress, "finishing").catch((e: unknown) => e);
        expect(isApiError(further) && [403, 409, 422].includes(further.status)).toBe(true);
      });

      it("records spoilage on the press as a row of its own, added up on the job", async () => {
        const press = doors["press"]!;
        const { job: cards } = await job(press, "MP-4122");
        await press.spoil({ job: cards, sheets: 7, note: null });
        const spoils = (await rows("spoils")).filter((s) => String(s["job_id"]) === String(cards.id));
        expect(spoils.map((s) => num(s["qty"]))).toEqual([7]);
        expect(String(spoils[0]!["material_id"])).toBe(String(cards["material_id"]));
        expect(spoils[0]!["spoiled_by"]).toBe("Tom Ellis");
        expect(num((await job(press, "MP-4122")).job["spoiled_sheets"])).toBe(7);
      });

      it("marks the job ready, and its order with its last job", async () => {
        const press = doors["press"]!;
        const { data, job: cards } = await job(press, "MP-4122");
        const ready = await walkJob(press, data, cards, "ready", press.who());
        expect(ready["stage"]).toBe("ready");
        const after = await job(press, "MP-4122");
        expect(after.order["status"]).toBe("ready");
        // Stamped when it went on the press, by prepress.
        expect(after.job["printed_by"]).toBe("Priya Shah");
        // The press is not the counter: it hands nothing over.
        const handed = await press.moveJob(after.job, "collected").catch((e: unknown) => e);
        expect(isApiError(handed) && [403, 409, 422].includes(handed.status)).toBe(true);
      });

      it("hands it over at the counter: the job and the order collected", async () => {
        const counter = doors["counter"]!;
        const { data, job: cards } = await job(counter, "MP-4122");
        await collectJob(counter, data, cards, counter.who());
        const after = await job(counter, "MP-4122");
        expect(after.job["stage"]).toBe("collected");
        expect(after.order["status"]).toBe("collected");
        expect(after.order["handed_over_by"]).toBe("Jo Marsh");
      });

      it("saves the owner's edit of the rate card to its row, and keeps it from the press", async () => {
        const ownerDoor = doors["owner"]!;
        const data = await ownerDoor.load();
        await ownerDoor.saveRate("settings", data.settings!, { setup: 19 });
        expect(num((await ownerDoor.load()).settings!["setup"])).toBe(19);
        const press = doors["press"]!;
        const refused = await press.saveRate("settings", (await press.load()).settings!, { setup: 1 }).catch((e: unknown) => e);
        expect(isApiError(refused) && refused.status).toBe(403);
      });

      // Last: the sessions it ends are the ones the tests above use.
      it("signs each floor role out: its session ends and its screens read nothing more", async () => {
        for (const role of ["prepress", "press", "counter"]) {
          const door = doors[role]!;
          await door.signOut();
          const after = await door.load().catch((e: unknown) => e);
          expect(isApiError(after) && after.status, role).toBe(401);
        }
      });
    });
  });
});
