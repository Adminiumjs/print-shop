/**
 * THE CUSTOMISER'S PANELS ON THE WORKS' SCREENS, AGAINST A REAL ADMINIUM.
 *
 * This repo's manifest and sample, installed with the built Customiser on a
 * BUILT Adminium (`ADMINIUM_REPO`), on every engine this run reaches. The
 * works' own door is booted on an owner's, a prepress's, a press's and a
 * counter's sessions (each holding the app's role and no other), as their
 * screens boot it, and the Customiser's panels are asked for as the ticket
 * asks for them:
 *
 *   - the job's panel is served to the owner, prepress and the press (the
 *     last two open only the works' screens), and refused to the counter;
 *   - the REAL panel code Adminium serves is imported and drawn here with the
 *     works' host (`studio/panels/host.tsx`), and draws the design from the
 *     Customiser's rows, read as that role;
 *   - what the panel saves when it makes a proof and the print files is saved
 *     as each of those roles, through the same door calls the host's
 *     `useWrite` and `useUpload` make (the drawing itself needs a browser's
 *     canvas, which this suite has not);
 *   - the product's panel is served to the owner, and refused to the press;
 *   - the owner opens the Customiser's set-up page on their own role: every
 *     read it makes answered, a change saved, the starter fonts' files added;
 *   - the owner keeps Holiday calendars' closed days (its settings grant),
 *     and finds a customer to erase; prepress does not;
 *   - last, the owner erases that customer: the proof PDF sent them and the
 *     artwork they sent go with their design's pictures, proof and print
 *     files, and the proofs made again over (in the bin), each counted in
 *     the preview first.
 *
 * The role holds the customer's words in clear, saves the proof on the
 * design's version (the Customiser's `appGrants`) and takes old files away.
 *
 * It runs with `CONTRACT=1` where a built Adminium (`ADMINIUM_REPO`) and a
 * built add-ons checkout (`ADD_ONS_REPO`) are, and says why it skipped
 * otherwise. Its ports start at `CONTRACT_PORT_BASE` (4980), three an engine.
 */
import { createHash, randomBytes } from "node:crypto";
import { rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { deflateSync } from "node:zlib";
import { Blob as NodeBlob } from "node:buffer";

import { JSDOM } from "jsdom";
import { act } from "react";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PanelRefused } from "../add-ons/connected.ts";
import { sendProof } from "../studio/actions.ts";
import { AdminiumWorks } from "../studio/adminiumWorks.ts";
import type { PanelDoor, WorksData } from "../studio/door.ts";
import { PanelScopeProvider } from "../studio/panels/host.tsx";
import { createSessionTransport } from "../studio/transport/sessionSource.ts";
import { loadStaffConfig } from "../studio/transport/staffConnection.ts";
import type { Row } from "../studio/wire.ts";
import { addOnBundle, appBundle, boot, Caller, ENGINES, missing, missingAddOn, ok, PORTS_PER_ENGINE, until, type Engine, type Server } from "./harness.ts";
import { ENGINE_VERSION, engineAtLeast, MANIFEST_TEXT } from "./release.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** The names a page gives React and the panel, put on this process for the drawing and taken away after. */
const PAGE_NAMES = ["window", "document", "navigator", "Node", "Element", "HTMLElement", "SVGElement", "HTMLCanvasElement", "HTMLIFrameElement", "Text", "Event", "CustomEvent", "MutationObserver", "getComputedStyle", "requestAnimationFrame", "cancelAnimationFrame", "Image"] as const;

/** Draw something in a page of its own, at the server's address (the panel reads its files from there). */
async function inAPage<T>(base: string, work: (page: Document) => Promise<T>): Promise<T> {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: base, pretendToBeVisual: true });
  const held = globalThis as unknown as Record<string, unknown>;
  const before = new Map(PAGE_NAMES.map((name) => [name, Object.getOwnPropertyDescriptor(held, name)]));
  for (const name of PAGE_NAMES) Object.defineProperty(held, name, { value: (dom.window as unknown as Record<string, unknown>)[name], configurable: true, writable: true });
  try {
    return await work(dom.window.document);
  } finally {
    for (const [name, descriptor] of before) {
      if (descriptor === undefined) delete held[name];
      else Object.defineProperty(held, name, descriptor);
    }
    dom.window.close();
  }
}

const CRC = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return (bytes: Buffer) => {
    let c = 0xffffffff;
    for (const b of bytes) c = table[(c ^ b) & 0xff]! ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
})();

/** A real PNG of one colour: what a browser's canvas hands back for a proof. */
function png(width = 12, height = 8): Buffer {
  const chunk = (type: string, data: Buffer) => {
    const head = Buffer.alloc(4);
    head.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(CRC(body));
    return Buffer.concat([head, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const rows = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) rows.set([0xd9, 0x2b, 0x6b], y * (width * 3 + 1) + 1 + x * 3);
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(rows)), chunk("IEND", Buffer.alloc(0))]);
}

const why = missing() ?? missingAddOn("customiser");
if (why !== null && process.env["ADMINIUM_REQUIRE_CONTRACT"] === "1") throw new Error(`the contract must run here, and cannot: ${why}`);
const PORT_BASE = Number(process.env["CONTRACT_PORT_BASE"] ?? 4980);
const ADMIN = { email: process.env["E2E_ADMIN_EMAIL"] ?? "e2e@adminium.local", password: process.env["E2E_ADMIN_PASSWORD"] ?? "adminium-e2e-password" };
/** 10:20 on Wednesday 5 August 2026 in Marlow (British Summer Time). */
const WEDNESDAY = Date.parse("2026-08-05T09:20:00Z");
const newPassword = (): string => `${randomBytes(18).toString("base64url")}Aa1!`;

/** Files as the browser hands them over, in the bytes this process's `fetch` sends. */
const pngFile = () => new NodeBlob([new Uint8Array(png())], { type: "image/png" }) as unknown as Blob;
const pdfFile = () => new NodeBlob(["%PDF-1.4\n1 0 obj << /Type /Page /MediaBox [0 0 252 156] >>\n%%EOF\n"], { type: "application/pdf" }) as unknown as Blob;

/** A file reference as a row holds it: the bare id, or the column's `{ id }`. */
const fileIdOf = (value: unknown): string | null => (typeof value === "string" ? value : value !== null && typeof value === "object" && typeof (value as { id?: unknown }).id === "string" ? (value as { id: string }).id : null);

describe.skipIf(why !== null)(`the Customiser's panels on the works' screens, against a built Adminium${why === null ? "" : ` — skipped: ${why}`}`, () => {
  ENGINES.forEach(([engine, available], index) => {
    describe.skipIf(!available)(`on ${engine}`, () => {
      let server: Server;
      let admin: Caller;
      let connectionId = "";
      const doors: Record<string, AdminiumWorks> = {};
      /** The proofs the panel made on Harbour's version, each one made again over by the next: their files kept in the bin, still the customer's. */
      const remade: string[] = [];
      const callers: Record<string, Caller> = {};

      /** A door booted as the staff build boots it, on a person's own session; a panel's code imported as the browser imports it. */
      const doorFor = async (caller: Caller): Promise<AdminiumWorks> => {
        const cfg = (await loadStaffConfig({ hostedStaff: true, base: "/apps/printing/staff/", fetchImpl: caller.fetchAs() }))!;
        const transport = createSessionTransport({
          tableOfRef: cfg.tables,
          connectionId: cfg.connectionId ?? undefined,
          staff: { csrfToken: cfg.csrfToken, timezone: cfg.timezone, timezoneSource: cfg.timezoneSource, serverTimezone: cfg.serverTimezone, currency: cfg.currency },
          fetchImpl: caller.fetchAs(),
        });
        const importBundle = async (url: string) => {
          const code = await (await caller.fetchAs()(url)).text();
          const file = join(tmpdir(), `printing-panel-${createHash("sha256").update(code).digest("hex").slice(0, 16)}.mjs`);
          writeFileSync(file, code);
          return import(/* @vite-ignore */ pathToFileURL(file).href);
        };
        const said = Date.parse(String(cfg.now));
        return new AdminiumWorks(transport, cfg, { fetchImpl: caller.fetchAs(), origin: server.base, importBundle, skew: Number.isNaN(said) ? 0 : said - Date.now() });
      };
      /** Someone holding one of the app's roles and no other, signed in as their screens sign them in. */
      const personWith = async (role: string, name: string): Promise<Caller> => {
        const roles = ok(await admin.get<{ roles: { id: string; name: string; slug?: string }[] }>("/api/v1/roles")).roles;
        const found = roles.find((r) => r.slug === `printing-${role}`) ?? roles.find((r) => r.name.toLowerCase() === role)!;
        const email = `${role}.panel.${engine}@marlowpress.example`;
        const invited = ok(await admin.post<{ invite: { token: string } }>("/api/v1/users", { email, name, roleIds: [found.id] }), 201);
        const password = newPassword();
        ok(await new Caller(server.base).post("/api/v1/auth/password/reset", { token: invited.invite.token, newPassword: password }));
        const caller = new Caller(server.base);
        ok(await caller.post("/api/v1/auth/login", { email, password }));
        return caller;
      };
      /** Harbour Bakery's business cards (MP-4112): the sample's job made in the Customiser. */
      const designedJob = (data: WorksData): Row => {
        const order = data.orders.find((o) => o["number"] === "MP-4112")!;
        return data.jobs.find((j) => String(j["order_id"]) === String(order.id) && j["design_id"] !== null && j["design_id"] !== undefined)!;
      };
      const panelsOf = (who: string): PanelDoor => doors[who]!.panels();
      /** The session's write token, as the person's screens take it from the staff config. */
      const tokenOf = async (who: string): Promise<Record<string, string>> => ({ "x-adminium-csrf": (await loadStaffConfig({ hostedStaff: true, base: "/apps/printing/staff/", fetchImpl: callers[who]!.fetchAs() }))!.csrfToken ?? "" });

      beforeAll(async () => {
        server = await boot(engine as Engine, PORT_BASE + index * PORTS_PER_ENGINE, WEDNESDAY - 60_000, { database: `printing_panel_${engine}${process.env["CONTRACT_DB_SUFFIX"] ?? ""}` });
        admin = new Caller(server.base, { origin: server.base });
        await admin.signIn(ADMIN.email, ADMIN.password);
        if (engine === "sqlite") {
          const file = join(tmpdir(), `printing-panel-contract-${String(PORT_BASE)}.db`);
          rmSync(file, { force: true });
          writeFileSync(file, "");
          connectionId = ok(await admin.post<{ id: string }>("/api/v1/connections", { name: "marlow-press", engine: "sqlite", dsn: `sqlite:${file}` }), 201).id;
        } else {
          connectionId = ok(await admin.get<{ connections: { id: string; name: string }[] }>("/api/v1/connections")).connections.find((c) => c.name === "northwind")!.id;
        }
        const bundles = ["customiser", "holiday-calendars"].map((key) => addOnBundle(key));
        for (const addOn of bundles) {
          const stagedAddOn = await admin.post(`/api/v1/add-ons/upload?expectedSha512=${encodeURIComponent(addOn.integrity)}`, addOn.buffer);
          expect([200, 201], JSON.stringify(stagedAddOn.body).slice(0, 800)).toContain(stagedAddOn.status);
        }
        const app = appBundle({ manifest: MANIFEST_TEXT });
        const staged = await admin.post(`/api/v1/apps/upload?expectedSha512=${encodeURIComponent(app.integrity)}`, app.buffer);
        expect([200, 201], JSON.stringify(staged.body).slice(0, 800)).toContain(staged.status);
        const body = { key: app.key, version: app.version, connectionId };
        const plan = ok(await admin.post<{ plan: { installable: boolean; checksum: string } }>("/api/v1/apps/plan", { ...body, addOns: bundles.map((addOn) => addOn.key) })).plan;
        expect(plan.installable, JSON.stringify(plan).slice(0, 3000)).toBe(true);
        const install = await admin.post("/api/v1/apps/install", { ...body, planChecksum: plan.checksum, addOns: bundles.map((addOn) => ({ key: addOn.key, version: addOn.version })) });
        if (install.status !== 200) throw new Error(`install refused: ${JSON.stringify(install.body).slice(0, 3000)}`);
        ok(await admin.patch(`/api/v1/connections/${connectionId}`, { timezone: "Europe/London", currency: "GBP" }));
        await server.setClock(WEDNESDAY, true);
        ok(await admin.post("/api/v1/apps/printing/sample-data"));
        await until(async () => (ok(await admin.get<{ loaded: boolean }>("/api/v1/apps/printing/sample-data")).loaded ? true : undefined), "the sample to be added");
        // The clock runs again before the four sign-ins: a fifth sign-in in a window waits for the window to pass.
        await server.setClock(WEDNESDAY);
        for (const [role, name] of [["owner", "Rosa Marlow"], ["prepress", "Priya Shah"], ["press", "Tom Ellis"], ["counter", "Jo Marsh"]] as const) {
          callers[role] = await personWith(role, name);
          doors[role] = await doorFor(callers[role]!);
        }
        // On Postgres and MySQL the sample says it is loaded before the rows it adds through the Customiser's section are in.
        await until(async () => ((await doors["owner"]!.load()).jobs.some((j) => j["design_id"] !== null && j["design_id"] !== undefined) ? true : undefined), "the sample's designed job");
      }, 600_000);

      afterAll(async () => {
        await server?.stop();
      });

      it("serves the job's panel to the owner, prepress and the press, and refuses it to the counter", async () => {
        const job = designedJob(await doors["press"]!.load());
        for (const who of ["owner", "prepress", "press"]) {
          const loaded = await panelsOf(who).load({ id: "customiser-line", table: "jobs", row: job.id });
          expect(typeof loaded, who).toBe("function");
        }
        const refused = await panelsOf("counter").load({ id: "customiser-line", table: "jobs", row: job.id }).catch((e: unknown) => e);
        expect(refused).toBeInstanceOf(PanelRefused);
        expect((refused as PanelRefused).status).toBe(403);
      });

      /*
       * The counter books a delivery company's collection, so its screens ask
       * Adminium which add-ons the print shop has. Adminium tells a
       * screens-only role so from 0.3.52; before, it refuses the read (403)
       * and the counter's screens go on without a delivery company.
       */
      it(`tells the counter which add-ons the print shop has (from Adminium 0.3.52; ${ENGINE_VERSION} ${engineAtLeast("0.3.52") ? "does" : "refuses it, 403"})`, async () => {
        const listed = await callers["counter"]!.get<{ addOns: { key: string; attachments?: { attachedTo: string }[] }[] }>("/api/v1/add-ons");
        if (!engineAtLeast("0.3.52")) {
          expect(listed.status, JSON.stringify(listed.body).slice(0, 300)).toBe(403);
          expect((await doors["counter"]!.load()).jobs.length).toBeGreaterThan(0);
          expect(doors["counter"]!.facts().carrier).toBeNull();
          return;
        }
        expect(listed.status, JSON.stringify(listed.body).slice(0, 300)).toBe(200);
        const customiser = listed.body.addOns.find((a) => a.key === "customiser");
        expect(customiser?.attachments?.some((one) => one.attachedTo === "printing")).toBe(true);
      });

      it("serves the product's panel to the owner, and refuses it to the press", async () => {
        const data = await doors["owner"]!.load();
        const product = data.products.find((p) => p["base_id"] !== null && p["base_id"] !== undefined)!;
        expect(typeof (await panelsOf("owner").load({ id: "customiser-product", table: "products", row: product.id }))).toBe("function");
        expect(await panelsOf("press").load({ id: "customiser-product", table: "products", row: product.id }).catch((e: unknown) => (e as PanelRefused).status)).toBe(403);
      });

      it("tells the panel each role's rights on the Customiser's tables, as the staff config says them", async () => {
        for (const who of ["owner", "prepress", "press"]) {
          expect(panelsOf(who).access("customiser", "fonts"), who).toContain("read");
          expect(panelsOf(who).access("customiser", "version_files"), who).toEqual(expect.arrayContaining(["read", "create", "update"]));
        }
        expect(panelsOf("counter").access("customiser", "version_files")).toEqual([]);
      });

      // The starter fonts' files are handed out beside the set-up page, to a role holding its page, screens-only or not.
      for (const who of ["owner", "prepress", "press"] as const) {
        it(`hands ${who} a starter font's file to make the print files with`, async () => {
          const answer = await callers[who]!.fetchAs()("/api/v1/add-ons/customiser/pages/customiser/files/fonts/Manrope-OFL.txt");
          expect(answer.status).toBe(200);
        });
      }

      // ── the owner's own: Holiday calendars' closed days, and a customer erased ──

      it("lets the owner keep Holiday calendars' closed days, and refuses the press", async () => {
        const days = [{ day: "2026-12-28", name: "Bank holiday", from: { country: "GB", region: "england-and-wales", year: 2026 } }];
        const kept = await callers["owner"]!.put<{ values: Record<string, unknown> }>("/api/v1/add-ons/holiday-calendars/settings", { values: { days } }, await tokenOf("owner"));
        expect(kept.status, JSON.stringify(kept.body).slice(0, 400)).toBe(200);
        // The works' screens read them back from the staff config, as the add-on's public setting.
        const cfg = (await loadStaffConfig({ hostedStaff: true, base: "/apps/printing/staff/", fetchImpl: callers["owner"]!.fetchAs() }))!;
        expect(cfg.addOns["holiday-calendars"]?.settings["days"]).toEqual(days);
        const refused = await callers["press"]!.put("/api/v1/add-ons/holiday-calendars/settings", { values: { days: [] } }, await tokenOf("press"));
        expect([refused.status, refused.code === "CSRF_FAILED"]).toEqual([403, false]);
      });

      /*
       * Finding and erasing a person is the owner's (`privacy:@:people`, on
       * the dashboard's privacy page): never a screens-only role's.
       */
      it("lets the owner find a customer to erase them, and no floor role", async () => {
        const found = await callers["owner"]!.post("/api/v1/privacy/find", { address: "hello@harbourbakery.example" }, await tokenOf("owner"));
        expect(found.status, JSON.stringify(found.body).slice(0, 400)).toBe(200);
        const refused = await callers["prepress"]!.post("/api/v1/privacy/find", { address: "hello@harbourbakery.example" }, await tokenOf("prepress"));
        expect([refused.status, refused.code === "CSRF_FAILED"]).toEqual([403, false]);
      });

      /** The Customiser's own job panel, drawn here with the works' host as this role: what it says. */
      const drawnFor = async (who: string, job: Row): Promise<string> => {
        const Panel = (await panelsOf(who).load({ id: "customiser-line", table: "jobs", row: job.id })) as (props: Record<string, unknown>) => null;
        return inAPage(server.base, async (page) => {
          // React's page half, imported once there is a page for it.
          const { createRoot } = await import("react-dom/client");
          const host = page.createElement("div");
          page.body.append(host);
          const root = createRoot(host);
          await act(async () =>
            root.render(
              <PanelScopeProvider scope={{ door: panelsOf(who), addOn: "customiser", locale: "en-US" }}>
                <Panel connectionId={doors[who]!.facts().connectionId} table="jobs" row={String(job.id)} linked={String(job["design_id"])} />
              </PanelScopeProvider>,
            ),
          );
          const deadline = Date.now() + 30_000;
          while (!(host.textContent ?? "").includes("Make the proof") && Date.now() < deadline) await act(async () => new Promise((resolve) => setTimeout(resolve, 200)));
          const said = host.textContent ?? "";
          act(() => root.unmount());
          return said;
        });
      };
      /** The customer's own words on the job's design, as the operator reads them. */
      const wordsOf = async (job: Row): Promise<string[]> => {
        const design = (await admin.get<{ data: Row }>(`/api/v1/data/${connectionId}/customiser_designs/${String(job["design_id"])}`)).body.data;
        const values = typeof design["values"] === "string" ? (JSON.parse(design["values"]) as { parts?: Record<string, { text?: string }> }) : ((design["values"] ?? {}) as { parts?: Record<string, { text?: string }> });
        return Object.values(values.parts ?? {}).map((part) => part.text).filter((text): text is string => typeof text === "string" && text !== "");
      };

      for (const who of ["owner", "prepress", "press"] as const) {
        it(`draws the Customiser's own panel on a job for ${who}, from the rows of the design that role reads`, async () => {
          const drawn = await drawnFor(who, designedJob(await doors[who]!.load()));
          // Past "Loading": the design, its ready-made design and base, the parts, fonts, palettes and versions all read as this role.
          expect(drawn, drawn.slice(0, 600)).toContain("Make the proof");
          expect(drawn).toContain("Design");
        }, 60_000);

        // The role holds the designs' and versions' personal columns in clear (`read_pii`): the customer's own words.
        it(`shows ${who} the customer's own words in the panel`, async () => {
          const job = designedJob(await doors[who]!.load());
          const words = await wordsOf(job);
          expect(words.length).toBeGreaterThan(0);
          expect(await drawnFor(who, job)).toContain(words[0]!);
        }, 60_000);

        it(`stores the print file the panel makes as ${who}: a row of the design's version, then its file`, async () => {
          const job = designedJob(await doors[who]!.load());
          const panels = panelsOf(who);
          const version = (await panels.list("customiser", "design_versions", { where: { column: "design_id", op: "eq", value: job["design_id"] }, order: "version.desc", limit: 51, offset: 0 }))[0]!;
          const made = await panels.create("customiser", "version_files", { app: version["app"], version_id: version.id, kind: "print", name: `cards-${who}.pdf`, about: "Business cards · 85 × 55 mm", position: 1 });
          const file = await panels.upload("customiser", "version_files", "file", made.data.id, pdfFile(), `cards-${who}.pdf`);
          expect(fileIdOf(file.row["file"])).toMatch(/^file_[0-9A-Z]{26}$/);
          expect((await panels.get("customiser", "version_files", made.data.id))?.["file"]).toEqual(file.row["file"]);
        }, 60_000);

        // `design_versions` is a table the Customiser's designs ledger writes; the add-on's `appGrants` open its proof to an app's role.
        it(`stores the proof the panel makes as ${who}`, async () => {
          const job = designedJob(await doors[who]!.load());
          const panels = panelsOf(who);
          const version = (await panels.list("customiser", "design_versions", { where: { column: "design_id", op: "eq", value: job["design_id"] }, order: "version.desc", limit: 51, offset: 0 }))[0]!;
          const proof = await panels.upload("customiser", "design_versions", "proof_file", version.id, pngFile(), `${String(job["design_id"])}-v${String(version["version"])}-proof-${who}.png`);
          expect(fileIdOf(proof.row["proof_file"])).toMatch(/^file_[0-9A-Z]{26}$/);
          remade.push(fileIdOf(proof.row["proof_file"])!);
        }, 60_000);
      }

      // "Make the files again" takes the version's old files away first: the role deletes the version's files.
      it("lets prepress make the files again: the version's old files taken away", async () => {
        const panels = panelsOf("prepress");
        const files = await panels.list("customiser", "version_files", { where: { column: "name", op: "eq", value: "cards-prepress.pdf" }, limit: 2, offset: 0 });
        expect(files.length).toBe(1);
        await panels.remove("customiser", "version_files", files[0]!.id);
      });

      // Harbour keeps each part once a layout (logo left, logo top): the panel lists the parts of the layout the design uses (add-ons 1.0.21).
      it("lists each part of the design once on the job's panel", async () => {
        const drawn = await drawnFor("owner", designedJob(await doors["owner"]!.load()));
        expect(drawn.split("Job title").length - 1).toBe(1);
      }, 60_000);

      // ── the Customiser's set-up page (the owner's "Customising set-up"), as the owner ──

      /** Every table the Customiser's set-up page reads (its README, "The set-up page"). */
      const SETUP_TABLES = ["settings", "designs", "bases", "base_areas", "base_pieces", "ready_designs", "ready_parts", "fonts", "palettes", "palette_colours", "features"];

      /*
       * The owner opens the set-up page on their own role, no Customiser role
       * beside it: the page's code and its kit are served, every table it
       * reads answers, and a change on it is saved.
       */
      it("opens the Customiser's set-up page as the owner: the page served, every read it makes answered, a priced feature's change saved", async () => {
        const owner = callers["owner"]!;
        expect((await owner.get("/api/v1/add-ons/customiser/pages/customiser/bundle")).status).toBe(200);
        expect((await owner.get("/api/v1/add-ons/customiser/kit")).status).toBe(200);
        for (const table of SETUP_TABLES) expect((await owner.get(`/api/v1/data/${connectionId}/customiser_${table}?limit=1`)).status, table).toBe(200);
        const feature = ok(await owner.get<{ data: Row[] }>(`/api/v1/data/${connectionId}/customiser_features?limit=1`)).data[0]!;
        const saved = await owner.patch(`/api/v1/data/${connectionId}/customiser_features/${String(feature.id)}`, { values: { name: feature["name"] } }, await tokenOf("owner"));
        expect(saved.status, JSON.stringify(saved.body).slice(0, 400)).toBe(200);
        // A finish added to a palette and taken away again, as the set-up page's finishes step does.
        const colour = ok(await owner.get<{ data: Row[] }>(`/api/v1/data/${connectionId}/customiser_palette_colours?limit=1`)).data[0]!;
        const added = await owner.post<{ data: Row }>(`/api/v1/data/${connectionId}/customiser_palette_colours`, { values: { app: colour["app"], palette_id: colour["palette_id"], code: "contract-blue", name: "Contract blue", hex: "#1f4e9c" } }, await tokenOf("owner"));
        expect(added.status, JSON.stringify(added.body).slice(0, 400)).toBe(201);
        expect([200, 204]).toContain((await owner.send("DELETE", `/api/v1/data/${connectionId}/customiser_palette_colours/${String(added.body.data.id)}`, undefined, await tokenOf("owner"))).status);
      });

      /*
       * With the Maker Shop on the same install, both shops' set-up rows sit in
       * the Customiser's one set of tables, each tagged with its shop (`app`).
       * The print shop's owner reads, changes, removes and adds only the print
       * shop's: to them a base, a priced feature and a font of the maker's, as
       * an operator adds them, are not there (404), and a new row tagged as the
       * maker's is refused (403). The starter fonts are nobody's: the owner
       * reads and changes them (the set-up gives them their files), and never
       * removes one.
       */
      it("hides another shop's set-up rows from the owner, refuses adding one as that shop's, and keeps the starter fonts usable but not removable", async () => {
        const owner = callers["owner"]!;
        const at = (table: string, id?: unknown) => `/api/v1/data/${connectionId}/customiser_${table}${id === undefined ? "" : `/${String(id)}`}`;
        const said = (r: { status: number; body: unknown }) => `${String(r.status)} ${JSON.stringify(r.body).slice(0, 300)}`;
        const base = ok(await admin.post<{ data: Row }>(at("bases"), { values: { app: "maker", name: "Maker's coaster", kind: "piece", width_mm: 95, height_mm: 95 } }), 201).data;
        const feature = ok(await admin.post<{ data: Row }>(at("features"), { values: { app: "maker", code: "maker-gift-box", name: "Gift box" } }), 201).data;
        const font = ok(await admin.post<{ data: Row }>(at("fonts"), { values: { app: "maker", family: "Maker Serif", name: "Maker Serif", licence: "The maker's own", starter: false } }), 201).data;
        for (const [table, row] of [["bases", base], ["features", feature], ["fonts", font]] as const) {
          const read = await owner.get(at(table, row.id));
          expect(read.status, `${table} read: ${said(read)}`).toBe(404);
          const listed = ok(await owner.get<{ data: Row[] }>(`${at(table)}?limit=200`)).data;
          expect(listed.some((r) => String(r.id) === String(row.id)), `${table} listed`).toBe(false);
          const changed = await owner.patch(at(table, row.id), { values: { name: "Taken over" } }, await tokenOf("owner"));
          expect(changed.status, `${table} changed: ${said(changed)}`).toBe(404);
        }
        for (const [table, row] of [["features", feature], ["fonts", font]] as const) {
          const removed = await owner.send("DELETE", at(table, row.id), undefined, await tokenOf("owner"));
          expect(removed.status, `${table} removed: ${said(removed)}`).toBe(404);
        }
        const tagged = await owner.post(at("features"), { values: { app: "maker", code: "print-sneaks-in", name: "Sneaks in" } }, await tokenOf("owner"));
        expect(tagged.status, `a row tagged the maker's: ${said(tagged)}`).toBe(403);
        // All three stay the maker's, as the operator added them.
        expect(ok(await admin.get<{ data: Row }>(at("bases", base.id))).data["name"]).toBe("Maker's coaster");
        expect(ok(await admin.get<{ data: Row }>(at("features", feature.id))).data["name"]).toBe("Gift box");
        expect(ok(await admin.get<{ data: Row }>(at("fonts", font.id))).data["name"]).toBe("Maker Serif");
        // The print shop's own rows stay the owner's: a feature added as the print shop's, read, changed and removed.
        const own = await owner.post<{ data: Row }>(at("features"), { values: { app: "printing", code: "print-own-box", name: "Box" } }, await tokenOf("owner"));
        expect(own.status, said(own)).toBe(201);
        expect((await owner.get(at("features", own.body.data.id))).status).toBe(200);
        expect((await owner.patch(at("features", own.body.data.id), { values: { name: "Gift box" } }, await tokenOf("owner"))).status).toBe(200);
        expect([200, 204]).toContain((await owner.send("DELETE", at("features", own.body.data.id), undefined, await tokenOf("owner"))).status);
        // A starter font: read and changed by the owner, never removed.
        const starter = ok(await admin.get<{ data: Row[] }>(`${at("fonts")}?limit=200`)).data.find((f) => (f["starter"] === true || f["starter"] === 1) && (f["app"] === null || f["app"] === undefined))!;
        expect(starter, "a starter font").toBeDefined();
        expect((await owner.get(at("fonts", starter.id))).status).toBe(200);
        const renamed = await owner.patch(at("fonts", starter.id), { values: { name: `${String(starter["name"])} (ours)` } }, await tokenOf("owner"));
        expect(renamed.status, said(renamed)).toBe(200);
        expect((await owner.patch(at("fonts", starter.id), { values: { name: starter["name"] } }, await tokenOf("owner"))).status).toBe(200);
        const dropped = await owner.send("DELETE", at("fonts", starter.id), undefined, await tokenOf("owner"));
        expect(dropped.status, `starter removed: ${said(dropped)}`).toBe(404);
        expect(ok(await admin.get<{ data: Row }>(at("fonts", starter.id))).data["name"]).toBe(starter["name"]);
      });

      /*
       * The install adds the open-licence starter fonts as rows with no file;
       * the set-up page, opened by someone who may change the fonts, uploads
       * each one's file from beside its code into its row (add-ons 1.0.21).
       * The owner may: their read of the page's files and their upload into
       * each row, as the page makes them.
       */
      it("adds a file to every starter font the install added, as the owner's set-up page does on the way in", async () => {
        const starters = ok(await admin.get<{ data: Row[] }>(`/api/v1/data/${connectionId}/customiser_fonts?limit=200`)).data.filter((f) => f["starter"] === true || f["starter"] === 1);
        expect(starters.length).toBeGreaterThan(0);
        for (const font of starters.filter((f) => fileIdOf(f["file"]) === null)) {
          const name = `${String(font["family"]).replace(/\s+/g, "")}.woff2`;
          const answer = await callers["owner"]!.fetchAs()(`/api/v1/add-ons/customiser/pages/customiser/files/fonts/${name}`);
          expect(answer.status, name).toBe(200);
          const bytes = new NodeBlob([new Uint8Array(await answer.arrayBuffer())], { type: "font/woff2" }) as unknown as Blob;
          await panelsOf("owner").upload("customiser", "fonts", "file", font.id, bytes, name);
        }
        const after = ok(await admin.get<{ data: Row[] }>(`/api/v1/data/${connectionId}/customiser_fonts?limit=200`)).data.filter((f) => f["starter"] === true || f["starter"] === 1);
        expect(after.filter((f) => fileIdOf(f["file"]) === null).map((f) => f["family"])).toEqual([]);
      }, 120_000);

      // ── last, since it empties Harbour Bakery: the shop owner erases a customer whose design was proofed ──

      /** Every row of a table, as the operator reads them. */
      const everyRow = async (table: string): Promise<Row[]> => {
        const out: Row[] = [];
        for (let offset = 0; ; offset += 200) {
          const page = ok(await admin.get<{ data: Row[] }>(`/api/v1/data/${connectionId}/${encodeURIComponent(table)}?limit=200&offset=${String(offset)}`)).data;
          out.push(...page);
          if (page.length < 200) return out;
        }
      };
      /** Every file kept about the customer at an address: their artwork and the proofs sent them, and their designs' pictures, proofs and print files. */
      const filesOf = async (address: string): Promise<{ proofs: Row[]; artwork: Row[]; files: Set<string> }> => {
        const orders = new Set((await everyRow("printing_orders")).filter((o) => o["email"] === address).map((o) => String(o.id)));
        const jobs = (await everyRow("printing_jobs")).filter((j) => orders.has(String(j["order_id"])));
        const jobIds = new Set(jobs.map((j) => String(j.id)));
        const designs = new Set(jobs.map((j) => j["design_id"]).filter((d) => d !== null && d !== undefined).map(String));
        const proofs = (await everyRow("printing_proofs")).filter((p) => jobIds.has(String(p["job_id"])));
        const artwork = (await everyRow("printing_artwork")).filter((a) => jobIds.has(String(a["job_id"])));
        const versions = (await everyRow("customiser_design_versions")).filter((v) => designs.has(String(v["design_id"])));
        const versionIds = new Set(versions.map((v) => String(v.id)));
        const versionFiles = (await everyRow("customiser_version_files")).filter((f) => versionIds.has(String(f["version_id"])));
        const pictures = (await everyRow("customiser_designs")).filter((d) => designs.has(String(d.id))).flatMap((d) => [d["logo_file"], d["photo_file"]]);
        const held = [...proofs.map((p) => p["file"]), ...artwork.map((a) => a["file"]), ...pictures, ...versions.map((v) => v["proof_file"]), ...versionFiles.map((f) => f["file"])];
        return { proofs, artwork, files: new Set(held.map(fileIdOf).filter((id): id is string => id !== null)) };
      };

      it("erases a customer as the owner: the proof PDF e-mailed to them and the artwork they sent (its name and checks too) go with their design's files, each counted first", async () => {
        const address = "hello@harbourbakery.example";
        const owner = doors["owner"]!;
        const data = await owner.load();
        const job = designedJob(data);
        // The PDF proof the panel makes on the design's version, then sent to the customer as the job's proof: the works' copy of it.
        const version = (await panelsOf("owner").list("customiser", "design_versions", { where: { column: "design_id", op: "eq", value: job["design_id"] }, order: "version.desc", limit: 1, offset: 0 }))[0]!;
        const made = fileIdOf((await panelsOf("owner").upload("customiser", "design_versions", "proof_file", version.id, pdfFile(), `${String(job["design_id"])}-v${String(version["version"])}-proof.pdf`)).row["proof_file"]);
        expect(made).toMatch(/^file_/);
        const sent = await sendProof(owner, data, job, { file: { copyOf: made! }, kind: "email", note: null }, owner.who());
        const proofFile = fileIdOf(sent["file"])!;
        expect(proofFile).toMatch(/^file_/);
        expect(proofFile).not.toBe(made);
        // The artwork they sent with an order of theirs, as the checkout stores it: a row of the job with its file.
        const upload = await admin.send<{ ref: string }>("POST", `/api/v1/files?${new URLSearchParams({ filename: "harbour-logo.pdf", connectionId, table: "printing_artwork", column: "file" }).toString()}`, Buffer.from("%PDF-1.4\n%%EOF\n"), { "content-type": "application/pdf" });
        expect(upload.status, JSON.stringify(upload.body).slice(0, 400)).toBe(201);
        ok(await admin.post(`/api/v1/data/${connectionId}/printing_artwork`, { values: { job_id: job.id, name: "harbour-logo.pdf", file: upload.body.ref, checks: { language: "en-US", rows: [{ check: "size", level: "warn", text: "harbour-logo.pdf is 72 dpi" }] } } }), 201);

        const before = await filesOf(address);
        expect(before.files).toContain(proofFile);
        expect(before.files).toContain(upload.body.ref);
        for (const id of [proofFile, upload.body.ref]) expect((await admin.get(`/api/v1/files/${id}/content`)).status, id).toBe(200);

        // The proofs made on the version before this one are in the bin, no longer on any row: the customer's still, so they go too (Adminium 0.3.50).
        expect(remade.length).toBe(3);
        for (const id of remade) expect(before.files.has(id), id).toBe(false);
        const every = new Set([...before.files, ...remade]);

        // The preview counts every one of those files, and the erase takes the same.
        const preview = await callers["owner"]!.post<{ data: { goes: { kind: string; count: number }[] } }>("/api/v1/privacy/erase/preview", { address }, await tokenOf("owner"));
        expect(preview.status, JSON.stringify(preview.body).slice(0, 400)).toBe(200);
        expect(preview.body.data.goes.find((g) => g.kind === "files")?.count).toBe(every.size);

        const erased = await callers["owner"]!.post<{ data: { counts: Record<string, number>; filesFailed: number } }>("/api/v1/privacy/erase", { address, confirm: address }, await tokenOf("owner"));
        expect(erased.status, JSON.stringify(erased.body).slice(0, 400)).toBe(200);
        expect([erased.body.data.counts["files"], erased.body.data.filesFailed]).toEqual([every.size, 0]);
        for (const id of every) expect((await admin.get(`/api/v1/files/${id}/content`)).status, id).toBe(404);
        // The proofs and the artwork rows stay, as the works' record of the job; their files are gone.
        const after = await filesOf(address);
        expect(after.proofs.map((p) => p.id)).toEqual(before.proofs.map((p) => p.id));
        expect(after.artwork.map((a) => a.id)).toEqual(before.artwork.map((a) => a.id));
        expect([...after.proofs, ...after.artwork].map((r) => r["file"] ?? null).filter((f) => f !== null && f !== "")).toEqual([]);
        expect(after.proofs.map((p) => p["change_note"] ?? null).filter((n) => n !== null && n !== "")).toEqual([]);
        // The artwork's own name and the checks shown on it go too: a file's name may name its sender.
        expect(before.artwork.map((a) => a["name"])).toContain("harbour-logo.pdf");
        expect(after.artwork.map((a) => a["name"] ?? "").filter((n) => n !== "")).toEqual([]);
        const checks = (value: unknown) => (typeof value === "string" ? (JSON.parse(value) as unknown) : value);
        expect(after.artwork.map((a) => checks(a["checks"]) ?? null).filter((c) => c !== null && JSON.stringify(c) !== "{}" && JSON.stringify(c) !== "[]")).toEqual([]);
      }, 120_000);
    });
  });
});
