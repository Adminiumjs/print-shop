/**
 * THE WORKS' DOOR ON THE WIRE: what each write sends Adminium, byte for byte
 * as the data API and the files route read it — the state the screen saw
 * beside each move, a proof's PDF stored for the proofs' `file` column with
 * the session's token, the spoilage row, a rate saved to its own row, an
 * add-on switched for this app — and how each read comes back (the tables'
 * real names, SQLite's moments and yes/no, the delivery company found by the
 * contract it provides, a closed table read as empty).
 */
import { describe, expect, it } from "vitest";

import { AdminiumWorks } from "./adminiumWorks.ts";
import type { SessionTransport } from "./transport/sessionSource.ts";
import { SessionPortError } from "./transport/sessionSource.ts";
import type { StaffConfig } from "./transport/staffConnection.ts";
import type { Row } from "./wire.ts";

const CONFIG: StaffConfig = {
  connectionId: "conn-1",
  appName: "Marlow Press",
  tables: { jobs: "printing_jobs", orders: "printing_orders", proofs: "printing_proofs", spoils: "printing_spoils", settings: "printing_settings" },
  settings: { working_days: "mon,tue,wed,thu,fri", cutoff: "14:00" },
  timezone: "Europe/London",
  timezoneSource: "operator",
  serverTimezone: "Europe/London",
  currency: "GBP",
  now: "2026-08-05T09:20:00.000Z",
  user: { id: "usr_1", name: "Rosa Marlow", email: "rosa@marlowpress.example" },
  csrfToken: "tok",
  publicKeys: {},
  access: null,
  addOns: { customiser: { version: "1.0.16", settings: {}, tables: {} }, "shipping-dhl": { version: "1.0.16", settings: { demo_transport: true }, tables: { shipments: "shipments" } } },
  sharedTables: {},
};

interface Sent {
  method: string;
  path: string;
  body?: unknown;
}

/** A transport that answers reads from a table of paths and records every write. */
function transport(reads: Record<string, unknown> = {}): { t: SessionTransport; sent: Sent[] } {
  const sent: Sent[] = [];
  const t = {
    port: { config: async () => ({}) },
    connection: async () => "conn-1",
    get: async <T,>(path: string): Promise<T> => {
      sent.push({ method: "GET", path });
      const key = Object.keys(reads).find((k) => path.startsWith(k));
      if (key === undefined) return { data: [] } as T;
      const answer = reads[key];
      if (answer instanceof Error) throw answer;
      return answer as T;
    },
    mutate: async <T,>(path: string, method: string, body?: unknown): Promise<T> => {
      sent.push({ method, path, body });
      if (path.endsWith("/copy")) return { ref: "/api/v1/files/file_01J8Z6Q3M4N5P6R7S8T9V0W1YY/content" } as T;
      return { data: Object.assign({}, (body as { values?: Row })?.values ?? {}, { id: 77 }) } as T;
    },
  } as unknown as SessionTransport;
  return { t, sent };
}

const JOB: Row = { id: 1, order_id: 4126, stage: "printing" };

describe("the writes, as Adminium reads them", () => {
  it("moves a job and an order with the state the screen saw", async () => {
    const { t, sent } = transport();
    const door = new AdminiumWorks(t, CONFIG);
    await door.moveJob(JOB, "finishing");
    await door.moveOrder({ id: 4119, status: "ready" }, "dispatched", { tracking: "00 34", dhl_service: "N" });
    expect(sent).toEqual([
      { method: "PATCH", path: "/api/v1/data/conn-1/printing_jobs/1", body: { values: { stage: "finishing" }, from: "printing" } },
      { method: "PATCH", path: "/api/v1/data/conn-1/printing_orders/4119", body: { values: { status: "dispatched", tracking: "00 34", dhl_service: "N" }, from: "ready" } },
    ]);
  });

  it("stores a proof's PDF for the proofs' file column, then sends the proof naming it", async () => {
    const { t, sent } = transport();
    const calls: { url: string; init: RequestInit }[] = [];
    const fetchImpl = (async (url: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} });
      return new Response(JSON.stringify({ ref: "/api/v1/files/file_01J8Z6Q3M4N5P6R7S8T9V0W1ZZ/content" }), { status: 201 });
    }) as typeof fetch;
    const door = new AdminiumWorks(t, CONFIG, { fetchImpl });
    const blob = new Blob(["%PDF-1.4"], { type: "application/pdf" });
    await door.sendProof({ job: { id: 2 }, kind: "post", file: { blob, filename: "proof-mp-4122.pdf" }, designVersionId: null, note: "Check the fold." });
    expect(calls[0]!.url).toBe("/api/v1/files?filename=proof-mp-4122.pdf&connectionId=conn-1&table=printing_proofs&column=file");
    expect(calls[0]!.init.method).toBe("POST");
    expect((calls[0]!.init.headers as Record<string, string>)["x-adminium-csrf"]).toBe("tok");
    expect(calls[0]!.init.body).toBe(blob);
    expect(sent).toEqual([
      { method: "POST", path: "/api/v1/data/conn-1/printing_proofs", body: { values: { job_id: 2, kind: "post", file: "/api/v1/files/file_01J8Z6Q3M4N5P6R7S8T9V0W1ZZ/content", note: "Check the fold." } } },
    ]);
  });

  it("copies the Customiser's proof of a design, and names the version it shows", async () => {
    const { t, sent } = transport();
    const door = new AdminiumWorks(t, CONFIG);
    await door.sendProof({ job: { id: 8 }, kind: "email", file: { copyOf: "file_01J8Z6Q3M4N5P6R7S8T9V0W1XA" }, designVersionId: 700, note: null });
    expect(sent.map((s) => [s.method, s.path, s.body])).toEqual([
      ["POST", "/api/v1/files/file_01J8Z6Q3M4N5P6R7S8T9V0W1XA/copy", { connectionId: "conn-1", table: "printing_proofs", column: "file" }],
      ["POST", "/api/v1/data/conn-1/printing_proofs", { values: { job_id: 8, kind: "email", file: "/api/v1/files/file_01J8Z6Q3M4N5P6R7S8T9V0W1YY/content", design_version_id: 700 } }],
    ]);
  });

  it("records spoilage as a row, supersedes a proof, sends a delivery quote and saves a rate", async () => {
    const { t, sent } = transport();
    const door = new AdminiumWorks(t, CONFIG);
    await door.spoil({ job: JOB, sheets: 12, note: null });
    await door.supersede({ id: 2, state: "sent" });
    await door.updateOrder({ id: 4127 }, { delivery_quote: 32.8, delivery_quote_state: "sent" });
    await door.saveRate("settings", { id: 1 }, { setup: 19 });
    expect(sent).toEqual([
      { method: "POST", path: "/api/v1/data/conn-1/printing_spoils", body: { values: { job_id: 1, qty: 12 } } },
      { method: "PATCH", path: "/api/v1/data/conn-1/printing_proofs/2", body: { values: { state: "superseded" }, from: "sent" } },
      { method: "PATCH", path: "/api/v1/data/conn-1/printing_orders/4127", body: { values: { delivery_quote: 32.8, delivery_quote_state: "sent" } } },
      { method: "PATCH", path: "/api/v1/data/conn-1/printing_settings/1", body: { values: { setup: 19 } } },
    ]);
  });

  it("switches an add-on on or off for this app alone", async () => {
    const { t, sent } = transport();
    await new AdminiumWorks(t, CONFIG).setAddOn("inventory", false);
    expect(sent).toEqual([{ method: "PATCH", path: "/api/v1/add-ons/inventory", body: { attachedTo: "printing", enabled: false } }]);
  });
});

describe("the reads", () => {
  it("finds the delivery company by the contract it provides, and reads what it booked", async () => {
    const { t, sent } = transport({
      "/api/v1/add-ons": { addOns: [{ key: "customiser", name: "Customiser", provides: [] }, { key: "shipping-dhl", name: "DHL Shipping", provides: [{ contract: "shipping-carrier", version: 1 }] }] },
      "/api/v1/data/conn-1/printing_jobs": { data: [{ id: 1, stage: "printing", express: 0, artwork_checked: 1, ready_by: "2026-08-10" }] },
      "/api/v1/data/conn-1/shipments": { data: [{ id: 5, order_reference: "MP-4119", created_at: "2026-08-05 10:24:00" }] },
    });
    const door = new AdminiumWorks(t, CONFIG);
    const data = await door.load();
    expect(door.facts().carrier).toEqual({ key: "shipping-dhl", name: "DHL Shipping" });
    expect(door.facts().addOnSettings["shipping-dhl"]).toEqual({ demo_transport: true });
    expect(data.jobs).toEqual([{ id: 1, stage: "printing", express: false, artwork_checked: true, ready_by: "2026-08-10" }]);
    // SQLite's wall time, read in the server's zone (British Summer Time): 09:24 UTC.
    expect(data.shipments).toEqual([{ id: 5, order_reference: "MP-4119", created_at: "2026-08-05T09:24:00.000Z" }]);
    expect(sent.some((s) => s.path.startsWith("/api/v1/data/conn-1/shipments?"))).toBe(true);
  });

  it("reads a table its roles do not open as empty, and Adminium's log as nothing for who may not read it", async () => {
    const closed = new SessionPortError("No.", 403, "FORBIDDEN");
    const { t } = transport({ "/api/v1/add-ons": closed, "/api/v1/audit": closed, "/api/v1/data/conn-1/printing_spoils": closed });
    const door = new AdminiumWorks(t, { ...CONFIG, access: { tables: { jobs: ["read"] }, roles: [{ slug: "printing-press", name: "Press" }] } });
    const data = await door.load();
    expect(data.spoils).toEqual([]);
    expect(door.facts().carrier).toBeNull();
    expect(await door.activity()).toEqual([]);
    expect(door.who().roles).toEqual(["press"]);
    expect(door.who().can("jobs", "read")).toBe(true);
    expect(door.who().can("jobs", "update")).toBe(false);
  });
});
