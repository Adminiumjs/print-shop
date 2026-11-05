/**
 * @vitest-environment jsdom
 *
 * THE HOST A CUSTOMISER PANEL DRAWS WITH ON THE WORKS' SCREENS, and the
 * loader that imports a panel's code: what a served bundle reads from the
 * global, the data kit's reads and writes as the door makes them, the
 * add-on's words in the reader's language, and the refusals of the loader.
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

import { loadPanelModule, PanelRefused } from "../../add-ons/connected.ts";
import { clearAddOnRuntime } from "../../add-ons/vendor/host/runtime/index.ts";
import { FakePanels } from "../testing/fakePanels.tsx";
import { formatMessage, listQuery, PANEL_HOST, PanelScopeProvider, registerMessages, useAccess, useRecords, useUpload } from "./host.tsx";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => clearAddOnRuntime());

describe("the add-on's words", () => {
  it("fills a value and picks the reader's plural, an exact case first", () => {
    const files = "{n, plural, =0 {no files} one {# file} other {# files}}";
    expect(formatMessage("Proof of {design} · version {n}", { design: "Corner shop", n: "2" })).toBe("Proof of Corner shop · version 2");
    expect([0, 1, 3].map((n) => formatMessage(files, { n }))).toEqual(["no files", "1 file", "3 files"]);
    const ar = "{n, plural, zero {لا ملفات} one {ملف واحد} two {ملفان} few {# ملفات} many {# ملفًا} other {# ملف}}";
    expect([2, 3, 11].map((n) => formatMessage(ar, { n }, "ar-EG"))).toEqual(["ملفان", "٣ ملفات", "١١ ملفًا"]);
    const cs = "{n, plural, one {# soubor} few {# soubory} other {# souborů}}";
    expect([1, 3, 5].map((n) => formatMessage(cs, { n }, "cs-CZ"))).toEqual(["1 soubor", "3 soubory", "5 souborů"]);
    // A value not given stays as it was written, so a missing one shows.
    expect(formatMessage("{name} — “{words}”", { name: "Lid" })).toBe("Lid — “{words}”");
  });

  it("answers in the reader's language, else the add-on's English, else the words at the call", async () => {
    const t = registerMessages("customiser", { "en-US": { "panel.title": "Customising", "panel.only": "Only English" }, "de-DE": { "panel.title": "Gestaltung" } });
    const seen: string[] = [];
    function Words() {
      seen.push(t("panel.title", "?"), t("panel.only", "?"), t("panel.none", "At the call"));
      return null;
    }
    const host = document.createElement("div");
    const root = createRoot(host);
    await act(async () => root.render(<PanelScopeProvider scope={{ door: new FakePanels(), addOn: "customiser", locale: "de-DE" }}><Words /></PanelScopeProvider>));
    act(() => root.unmount());
    expect(seen.slice(0, 3)).toEqual(["Gestaltung", "Only English", "At the call"]);
  });
});

describe("the data kit over the works' door", () => {
  it("asks the data routes as the dashboard's kit does: one row more than the page, its filters and order", () => {
    expect(listQuery({ filter: [{ column: "design_id", op: "eq", value: 3 }], sort: [{ column: "version", direction: "desc" }], pageSize: 50 }).query).toEqual({ where: { column: "design_id", op: "eq", value: 3 }, order: "version.desc", limit: 51, offset: 0 });
    expect(listQuery({ filter: [{ column: "a", op: "empty" }, { column: "b", op: "contains", value: "50%" }], page: 2, pageSize: 500 }).query).toEqual({ where: { and: [{ column: "a", op: "is_null" }, { column: "b", op: "ilike", value: "%50\\%%" }] }, limit: 200, offset: 199 });
  });

  it("reads the add-on's table by its short name, writes a file into a row, and reads again after", async () => {
    const door = new FakePanels({ design_versions: [{ id: 30, design_id: 3, version: 1, proof_file: null }] });
    const host = document.createElement("div");
    const root = createRoot(host);
    let upload: ReturnType<typeof useUpload> | null = null;
    function Probe() {
      const versions = useRecords("design_versions", { filter: [{ column: "design_id", op: "eq", value: 3 }] });
      upload = useUpload("design_versions", "proof_file");
      return <p>{versions.loading ? "reading" : versions.rows.map((row) => String(row["proof_file"])).join(",")}</p>;
    }
    await act(async () => root.render(<PanelScopeProvider scope={{ door, addOn: "customiser", locale: "en-US" }}><Probe /></PanelScopeProvider>));
    expect(host.textContent).toBe("null");
    await act(async () => void (await upload!.upload(30, new Blob(["%PDF"], { type: "application/pdf" }), { name: "3-v1-proof.pdf" })));
    expect(door.calls.filter((c) => c.method === "list")).toHaveLength(2);
    expect(host.textContent).toMatch(/^file_/);
    // A file with no name is refused before anything is sent.
    await act(async () => expect(upload!.upload(30, new Blob(["x"]))).rejects.toThrow(/needs one/));
    act(() => root.unmount());
  });

  it("says the reader's rights as Adminium answers them, and takes every right as held when they cannot be read", async () => {
    const door = new FakePanels();
    door.rights = { tables: { design_versions: { can: { read: true, create: false, update: true, delete: false }, unreadable: ["values"] }, fonts: { can: { read: true, create: false, update: false, delete: false }, unreadable: [] } }, has: {}, currency: "GBP" };
    const seen: string[] = [];
    function Probe() {
      const access = useAccess();
      seen.push(access.ready ? [access.canRead("fonts"), access.canRead("design_versions", ["values"]), access.canCreate("design_versions"), access.canUpdate("design_versions"), access.canRead("palettes")].join(",") : "waiting");
      return null;
    }
    const host = document.createElement("div");
    const root = createRoot(host);
    await act(async () => root.render(<PanelScopeProvider scope={{ door, addOn: "customiser", locale: "en-US" }}><Probe /></PanelScopeProvider>));
    expect(seen[0]).toBe("waiting");
    expect(seen.at(-1)).toBe("true,false,false,true,false");
    act(() => root.unmount());
    // An Adminium that does not answer: the panel is not held back, and the server refuses what it refuses.
    door.access = async () => {
      throw new Error("404");
    };
    seen.length = 0;
    const again = createRoot(document.createElement("div"));
    await act(async () => again.render(<PanelScopeProvider scope={{ door, addOn: "customiser", locale: "en-US" }}><Probe /></PanelScopeProvider>));
    expect(seen.at(-1)).toBe("true,true,true,true,true");
    act(() => again.unmount());
  });

  it("publishes the host a panel bundle reads: version 1, the data kit 1, every part the two panels draw", () => {
    expect(PANEL_HOST.version).toBe(1);
    expect(PANEL_HOST.data.version).toBe(1);
    const parts = { ui: ["Button", "EmptyState", "SegmentedControl"], data: ["Card", "Stack", "Grid", "KeyValueList", "StatusPill", "MonoText", "Link", "useRecords", "useRecord", "useWrite", "useUpload", "useAccess"], app: ["lucideByName", "registerMessages", "useLocaleTag", "useAppToasts"] } as const;
    for (const [where, names] of Object.entries(parts)) for (const name of names) expect(typeof (PANEL_HOST as unknown as Record<string, Record<string, unknown>>)[where]![name], `${where}.${name}`).toBe("function");
    expect(typeof PANEL_HOST.app.lucideByName("triangle-alert")).toBe("function");
  });
});

describe("a panel's code, loaded", () => {
  const ORIGIN = "https://shop.example.test";
  const URL_OK = "/api/v1/add-ons/customiser/panels/customiser-line/bundle?connection=c&table=main.printing_jobs&row=161";
  // sha256 of the empty body.
  const EMPTY = "sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=";
  const answer = (status: number, body: string, pin: string | null = EMPTY): typeof fetch =>
    (async () => new Response(body, { status, headers: pin === null ? {} : { "x-adminium-integrity": pin } })) as typeof fetch;

  it("publishes the host before the module is imported, and hands back its default export", async () => {
    let hostSeen: unknown;
    const Panel = () => null;
    const loaded = await loadPanelModule({
      url: URL_OK,
      origin: ORIGIN,
      host: PANEL_HOST,
      request: answer(200, ""),
      importBundle: async (url) => {
        expect(url).toBe(`${ORIGIN}${URL_OK}`);
        hostSeen = (globalThis as unknown as { __ADMINIUM_ADD_ON_RUNTIME__: { host: unknown; reactDom: unknown } }).__ADMINIUM_ADD_ON_RUNTIME__.host;
        return { default: Panel };
      },
    });
    expect([loaded, hostSeen]).toEqual([Panel, PANEL_HOST]);
  });

  it("throws the server's refusal with its status, and imports nothing", async () => {
    let imported = false;
    const importBundle = async () => ((imported = true), {});
    const refused = await loadPanelModule({ url: URL_OK, origin: ORIGIN, host: PANEL_HOST, request: answer(403, JSON.stringify({ error: { code: "FORBIDDEN", message: "You may not open the panel" } })), importBundle }).catch((e: unknown) => e);
    expect(refused).toBeInstanceOf(PanelRefused);
    expect(refused).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(await loadPanelModule({ url: URL_OK, origin: ORIGIN, host: PANEL_HOST, request: answer(200, "tampered"), importBundle }).catch((e: unknown) => e)).toMatchObject({ code: "INTEGRITY_MISMATCH" });
    expect(await loadPanelModule({ url: "https://evil.test/api/v1/add-ons/x.js", origin: ORIGIN, host: PANEL_HOST, request: answer(200, ""), importBundle }).catch((e: unknown) => e)).toMatchObject({ code: "UNSAFE_URL" });
    expect(imported).toBe(false);
  });
});
