/**
 * The staff surface's connection binding.
 *
 * Every case here is a way the answer can be ABSENT, because absent is the
 * common case — unbound surfaces, and any Adminium older than the binding —
 * and all of them must keep the app booting on its old inference.
 */
import { describe, expect, it, vi } from "vitest";

import { createSessionTransport, INSTALL_HEADER } from "./sessionSource.ts";
import { configBase, loadStaffConfig, resolveStaffConnectionId, withInstall } from "./staffConnection.ts";

const ok = (doc: unknown) =>
  vi.fn(async () =>
    new Response(JSON.stringify(doc), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  ) as unknown as typeof fetch;

describe("resolveStaffConnectionId", () => {
  it("reads the bound connection from the served document", async () => {
    const fetchImpl = ok({ connectionId: "con_42" });
    expect(
      await resolveStaffConnectionId({ hostedStaff: true, base: "/apps/clients/staff/", fetchImpl }),
    ).toBe("con_42");
  });

  it("returns null for an UNBOUND surface — a complete answer, not a failure", async () => {
    const fetchImpl = ok({ connectionId: null });
    expect(
      await resolveStaffConnectionId({ hostedStaff: true, base: "/apps/clients/staff/", fetchImpl }),
    ).toBeNull();
  });

  it("returns null when an older server answers with the SPA index", async () => {
    // The route does not exist there; the wildcard serves index.html and
    // `json()` throws. The app must still boot against that Adminium.
    const fetchImpl = vi.fn(
      async () => new Response("<!doctype html><html></html>", { status: 200 }),
    ) as unknown as typeof fetch;
    expect(
      await resolveStaffConnectionId({ hostedStaff: true, base: "/apps/clients/staff/", fetchImpl }),
    ).toBeNull();
  });

  it("never asks on a non-staff build", async () => {
    // A demo or customer bundle has no session and no business fetching this.
    const fetchImpl = ok({ connectionId: "con_42" });
    expect(await resolveStaffConnectionId({ hostedStaff: false, fetchImpl })).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("configBase", () => {
  const BAKED = "/apps/clients/staff/";

  it("asks the INSTANCE mount when the page is served from one", () => {
    expect(configBase(BAKED, "/apps/clients/berlin/staff/invoices")).toBe(
      "/apps/clients/berlin/staff/",
    );
  });

  it("keeps the baked base on the unslugged mount", () => {
    expect(configBase(BAKED, "/apps/clients/staff/invoices")).toBe(BAKED);
  });

  it("asks `/` on a MAPPED DOMAIN, which is the only place its instance is known", () => {
    /*
     * Reversed deliberately. This returned the baked `/apps/…` form while
     * nothing answered at the root — but a mapped host can now point at an
     * instance, and the bundle never sees the domain map, so the root document
     * is the only thing that can tell it which database it belongs to. Asking
     * the baked form would pin every mapped host to the app's own.
     */
    expect(configBase(BAKED, "/invoices/7")).toBe("/");
    expect(configBase(BAKED, "/")).toBe("/");
  });

  it("never reads the unslugged mount as an instance called `staff`", () => {
    // `/apps/clients/staff/staff` is a deep link, not an instance.
    expect(configBase(BAKED, "/apps/clients/staff/staff")).toBe(BAKED);
  });

  it("ignores an instance path belonging to a DIFFERENT app or side", () => {
    // One bundle must never fetch another surface's binding.
    expect(configBase(BAKED, "/apps/clinic/berlin/staff/x")).toBe(BAKED);
    expect(configBase(BAKED, "/apps/clients/berlin/customer/x")).toBe(BAKED);
  });
});

describe("loadStaffConfig", () => {
  it("reads everything a till boots from, and keeps nothing it does not understand", async () => {
    const fetchImpl = ok({
      connectionId: "con_42",
      installId: "inst_7",
      appName: null,
      tables: { tickets: "pos_tickets", odd: 7 },
      settings: { business_type: "retail" },
      timezone: "Europe/Lisbon",
      timezoneSource: "operator",
      serverTimezone: "UTC",
      currency: "EUR",
      now: "2026-07-28T13:05:00.000Z",
      user: { id: "usr_1", name: "Cara", email: "cara@example.com" },
      csrfToken: "tok",
      publicKeys: { kiosk: "adm_pub_k", broken: 3 },
      access: { tables: { tickets: ["read", "update", "fly"], odd: "all" }, roles: [{ slug: "pos-cashier", name: "POS cashier" }, { name: "no slug" }] },
      addOns: { invoices: { version: "1.0.3", settings: { business_name: "Harbour Café" }, tables: { profiles: "invoices_profiles", odd: 4 } }, odd: 3 },
      sharedTables: { menu_items: ["ordering"], tickets: [], odd: "all" },
    });
    expect(await loadStaffConfig({ hostedStaff: true, base: "/apps/pos/staff/", fetchImpl })).toEqual({
      connectionId: "con_42",
      installId: "inst_7",
      appName: null,
      tables: { tickets: "pos_tickets" },
      settings: { business_type: "retail" },
      timezone: "Europe/Lisbon",
      timezoneSource: "operator",
      serverTimezone: "UTC",
      currency: "EUR",
      now: "2026-07-28T13:05:00.000Z",
      user: { id: "usr_1", name: "Cara", email: "cara@example.com" },
      csrfToken: "tok",
      publicKeys: { kiosk: "adm_pub_k" },
      access: { tables: { tickets: ["read", "update"] }, roles: [{ slug: "pos-cashier", name: "POS cashier" }] },
      addOns: { invoices: { version: "1.0.3", settings: { business_name: "Harbour Café" }, tables: { profiles: "invoices_profiles" } } },
      sharedTables: { menu_items: ["ordering"] },
    });
  });

  it("says nothing of access when the server said nothing, so no button is hidden on a guess", async () => {
    const fetchImpl = ok({ connectionId: "con_42", tables: {} });
    const config = await loadStaffConfig({ hostedStaff: true, base: "/apps/pos/staff/", fetchImpl });
    expect(config?.access).toBeNull();
    // An Adminium older than installs per database names none: nothing is sent.
    expect(config?.installId).toBeNull();
    expect(config?.publicKeys).toEqual({});
    // No add-on said attached: a feature that needs one stays off.
    expect(config?.addOns).toEqual({});
    // Nor any table another app shares (a server up to 0.3.7 does not say).
    expect(config?.sharedTables).toEqual({});
  });

  it("is null outside a hosted staff build", async () => {
    const fetchImpl = ok({});
    expect(await loadStaffConfig({ hostedStaff: false, fetchImpl })).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("one app installed on two databases", () => {
  /** Adminium as two installs answer it: the bare one on db-1, `kiln` on db-2, each with its own add-ons. */
  const served: Record<string, unknown> = {
    "/apps/printing/staff/surface-config.json": { connectionId: "db-1", installId: "inst-1", csrfToken: "tok-1", addOns: { "holiday-calendars": { version: "1.0.0", settings: {} } } },
    "/apps/printing/kiln/staff/surface-config.json": { connectionId: "db-2", installId: "inst-2", csrfToken: "tok-2", addOns: {} },
  };
  const adminium = (calls: { url: string; headers: Record<string, string> }[]) =>
    (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      calls.push({ url, headers: { ...(init?.headers as Record<string, string> | undefined) } });
      const doc = served[url] ?? { data: [] };
      return new Response(JSON.stringify(doc), { status: 200, headers: { "content-type": "application/json" } });
    }) as typeof fetch;

  it("reads the second install's own config, and every call it makes says that install", async () => {
    const calls: { url: string; headers: Record<string, string> }[] = [];
    const base = configBase("/apps/printing/staff/", "/apps/printing/kiln/staff/orders");
    expect(base).toBe("/apps/printing/kiln/staff/");
    const cfg = (await loadStaffConfig({ hostedStaff: true, base, fetchImpl: adminium(calls) }))!;
    expect(cfg.installId).toBe("inst-2");
    expect(cfg.connectionId).toBe("db-2");
    // Its add-ons are its own: the first install's are not listed here.
    expect(cfg.addOns).toEqual({});

    calls.length = 0;
    const t = createSessionTransport({ tableOfRef: {}, connectionId: cfg.connectionId ?? undefined, installId: cfg.installId, staff: { csrfToken: cfg.csrfToken }, fetchImpl: adminium(calls) });
    await t.get("/api/v1/data/db-2/printing_orders");
    await t.mutate("/api/v1/add-ons/holiday-calendars", "PATCH", { attachedTo: "printing", enabled: false });
    // And round the transport: a file's bytes, a panel's code.
    await withInstall(adminium(calls), cfg.installId)("/api/v1/files?filename=a.pdf", { method: "POST", headers: new Headers({ "x-adminium-csrf": "tok-2" }) });
    expect(calls).toHaveLength(3);
    for (const call of calls) expect(call.headers[INSTALL_HEADER]).toBe("inst-2");
    expect(calls[2]!.headers["x-adminium-csrf"]).toBe("tok-2");
  });

  it("the first install's config names the first install", async () => {
    const cfg = (await loadStaffConfig({ hostedStaff: true, base: configBase("/apps/printing/staff/", "/apps/printing/staff/"), fetchImpl: adminium([]) }))!;
    expect(cfg.installId).toBe("inst-1");
    expect(Object.keys(cfg.addOns)).toEqual(["holiday-calendars"]);
  });

  it("sends nothing extra when the config names no install", async () => {
    const calls: { url: string; headers: Record<string, string> }[] = [];
    const send = adminium(calls);
    for (const id of [null, undefined, ""]) expect(withInstall(send, id)).toBe(send);
    await withInstall(send, null)("/api/v1/files", { headers: { accept: "application/json" } });
    expect(INSTALL_HEADER in calls[0]!.headers).toBe(false);
  });
});
