/**
 * The works' door into a real Adminium: the data API as the person signed in
 * to it, the app served by Adminium at `/apps/printing/staff/`, riding that
 * person's session. Their roles and limits hold every read and write: the
 * press may move a job along the floor and record spoilage, never touch a
 * price; prepress sends the proofs; the counter hands the work over.
 *
 * Everything the works needs to start is in the staff `surface-config.json`:
 * the connection, the tables' real names, the works' zone and money, its
 * settings, who is signed in and what they may do, the add-ons attached.
 *
 * A move is a change of a state column, judged by the table's states: the
 * state the screen saw goes with it (`from`), so a job that moved on since is
 * refused rather than moved twice. A proof's PDF is stored through the files
 * route first, for the proofs table's `file` column, and the row that sends it
 * names what that store answered.
 *
 * Each engine spells a moment and a yes/no its own way (SQLite: the server's
 * wall time with no zone, and 0 or 1); every row is read back here as the
 * screens expect it, an ISO instant and a boolean.
 */
import { deviceNow } from "./clock.ts";
import { withInstall, type StaffConfig } from "./transport/staffConnection.ts";
import { SessionPortError, type SessionTransport } from "./transport/sessionSource.ts";
import { momentOf } from "./time.ts";
import type { Action, ActivityEntry, AddOnTable, CatalogEntry, InstalledAddOn, PanelDoor, PanelList, PanelOpen, PanelUploaded, Person, ProofFile, Table, WorksData, WorksDoor, WorksFacts } from "./door.ts";
import { ApiError, text, type Id, type Row } from "./wire.ts";
import { loadPanelModule } from "../add-ons/connected.ts";
import { PANEL_HOST } from "./panels/host.tsx";
import { mayManageAddOns, mayReadAddOn } from "./roles.ts";

export const APP_KEY = "printing";
const PAGE = 200;

/** The moments each table holds: SQLite hands them back without a zone. */
export const MOMENTS: Readonly<Partial<Record<Table | AddOnTable, readonly string[]>>> = {
  orders: ["delivery_quote_sent_at", "delivery_quote_accepted_at", "placed_at", "ready_at", "collected_at", "dispatched_at", "cancelled_at", "link_expires"],
  jobs: ["artwork_checked_at", "printing_at", "finishing_at", "ready_at", "handed_over_at"],
  artwork: ["uploaded_at"],
  proofs: ["sent_at", "answered_at"],
  spoils: ["spoiled_at"],
  "customiser:designs": ["created_at", "updated_at"],
  "customiser:design_versions": ["made_at"],
  "customiser:version_files": ["made_at"],
};
/** A carrier's shipments' moments, whichever carrier keeps them. */
const SHIPMENT_MOMENTS = ["created_at", "collection_from", "collection_to"];
/** The contract a delivery company's add-on provides. */
export const CARRIER_CONTRACT = "shipping-carrier";
/** The add-on that keeps public holidays, each one the works may add as a closure. */
export const HOLIDAYS = "holiday-calendars";
/** The works is in England: of the sets Holiday calendars keeps, the bank holidays of England and Wales are its own. */
export const HOLIDAY_SET = { country: "GB", region: "england-and-wales" } as const;

/** The yes/no columns each table holds: SQLite and MySQL hand back 0 or 1. */
export const YES_NO: Readonly<Partial<Record<Table, readonly string[]>>> = {
  settings: ["taking_orders", "sample_packs"],
  materials: ["coated", "active"],
  sizes: ["direct", "active"],
  finishes: ["active"],
  packaging: ["active"],
  products: ["published"],
  options: ["coated", "framed", "preselected", "active"],
  closures: ["active"],
  machines: ["active"],
  orders: ["link_stopped", "may_email"],
  jobs: ["proof_by_post", "express", "artwork_checked", "framed"],
  artwork: ["accepted"],
};

const yesNo = (value: unknown): unknown =>
  value === null || value === undefined || typeof value === "boolean" ? value : value === 1 || value === "1" || value === "true";

/** The transport's refusal as the screens read one: its status, its code, what it said beside. */
function asApiError(error: unknown): unknown {
  if (error instanceof SessionPortError) {
    const details = error.details !== null && typeof error.details === "object" && !Array.isArray(error.details) ? (error.details as Record<string, unknown>) : {};
    return new ApiError(error.status, error.code, error.message, details);
  }
  return error;
}

/** A read the person's roles do not reach, or of a table not there: an empty answer, not a failure. */
const closed = (error: unknown): boolean => error instanceof SessionPortError && (error.status === 403 || error.status === 404);

const q = (value: unknown) => encodeURIComponent(JSON.stringify(value));

export interface WorksDoorOptions {
  /** The server's clock less the device's, as the config said it. */
  skew?: number;
  /** How a proof's PDF is sent, and a panel's code read: the browser's `fetch`, or a test's. */
  fetchImpl?: typeof fetch;
  /** The origin the works' screens were served from: where Adminium serves the add-ons' panels. */
  origin?: string;
  /** How a checked panel's code is imported: the browser's `import()`, or a test's. */
  importBundle?: (url: string) => Promise<unknown>;
}

export class AdminiumWorks implements WorksDoor {
  private readonly t: SessionTransport;
  private readonly cfg: StaffConfig;
  private readonly skew: number;
  private readonly fetchImpl: typeof fetch;
  private readonly options: WorksDoorOptions;
  /** The delivery company found on the last read. */
  private carrier: { key: string; name: string } | null = null;

  constructor(transport: SessionTransport, config: StaffConfig, options: WorksDoorOptions = {}) {
    this.t = transport;
    this.cfg = config;
    this.skew = options.skew ?? 0;
    // Round the transport too (a file's bytes, a panel's code), every call says which install it is from.
    this.fetchImpl = withInstall(options.fetchImpl ?? globalThis.fetch.bind(globalThis), config.installId);
    this.options = options;
  }

  // ── the wire ──────────────────────────────────────────────────────────────

  private get serverZone(): string {
    return this.cfg.serverTimezone ?? "UTC";
  }
  /** A table's real name: the server's, or the app's prefix when it does not say. */
  private real(table: Table): string {
    return this.cfg.tables[table] ?? `${APP_KEY}_${table}`;
  }
  /** An add-on's table's real name: the server's, or the add-on's own prefix. */
  private realAddOn(table: AddOnTable): string {
    const [addOn, ref] = table.split(":") as [string, string];
    return this.realOf(addOn, ref);
  }
  private realOf(addOn: string, ref: string): string {
    const table = `${addOn}:${ref}`;
    return this.cfg.addOns[addOn]?.tables[ref] ?? this.cfg.tables[table] ?? `${addOn.replaceAll("-", "_")}_${ref}`;
  }
  private async conn(): Promise<string> {
    return this.cfg.connectionId ?? (await this.t.connection());
  }
  private async path(real: string, rest = ""): Promise<string> {
    return `/api/v1/data/${encodeURIComponent(await this.conn())}/${encodeURIComponent(real)}${rest}`;
  }
  private row(table: Table | AddOnTable, row: Row): Row {
    const out: Row = { ...row };
    const moments = MOMENTS[table] ?? (table.endsWith(":shipments") ? SHIPMENT_MOMENTS : []);
    for (const column of moments) if (column in out) out[column] = momentOf(out[column], this.serverZone);
    for (const column of YES_NO[table as Table] ?? []) if (column in out) out[column] = yesNo(out[column]);
    return out;
  }
  private async run<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await work();
    } catch (error) {
      throw asApiError(error);
    }
  }
  private async listReal(table: Table | AddOnTable, real: string, query: { where?: unknown; order?: string } = {}): Promise<Row[]> {
    const rows: Row[] = [];
    const extra = `${query.where === undefined ? "" : `&where=${q(query.where)}`}${query.order === undefined ? "" : `&order=${encodeURIComponent(query.order)}`}`;
    for (let offset = 0; offset < 50 * PAGE; offset += PAGE) {
      const got = await this.t.get<{ data: Row[] }>(await this.path(real, `?limit=${String(PAGE)}&offset=${String(offset)}${extra}`));
      rows.push(...got.data.map((r) => this.row(table, r)));
      if (got.data.length < PAGE) break;
    }
    return rows;
  }
  /** A table the person may read, every row; none at all when their roles do not let them read it. */
  private async list(table: Table, order?: string): Promise<Row[]> {
    if (!this.who().can(table, "read")) return [];
    return this.listReal(table, this.real(table), order === undefined ? {} : { order });
  }
  /** An add-on's table, read as its readers may: none at all for someone it is closed to. */
  private async listAddOn(table: AddOnTable, query: { where?: unknown; order?: string } = {}): Promise<Row[]> {
    try {
      return await this.listReal(table, this.realAddOn(table), query);
    } catch (error) {
      if (closed(error)) return [];
      throw error;
    }
  }
  private async create(table: Table, values: Record<string, unknown>): Promise<Row> {
    return this.row(table, (await this.t.mutate<{ data: Row }>(await this.path(this.real(table)), "POST", { values })).data);
  }
  private async change(table: Table, id: Id, values: Record<string, unknown>, from?: string): Promise<Row> {
    const body = from === undefined ? { values } : { values, from };
    return this.row(table, (await this.t.mutate<{ data: Row }>(await this.path(this.real(table), `/${encodeURIComponent(String(id))}`), "PATCH", body)).data);
  }

  // ── who, and the works ────────────────────────────────────────────────────

  // ── the Customiser's panels ───────────────────────────────────────────────

  private panelDoor: PanelDoor | null = null;

  /**
   * The panels' door over this session: the add-on's tables by its short
   * names (their real names from the staff config), the data routes and the
   * files route as the person signed in, and the panel's code from the route
   * that serves it for one row (`/api/v1/add-ons/<key>/panels/<id>/bundle`),
   * which asks the row, the panel's table and the panel's permission again.
   * Rows come back as the routes answer them: the panel reads its own.
   */
  panels(): PanelDoor {
    if (this.panelDoor !== null) return this.panelDoor;
    const at = async (addOn: string, table: string, rest = "") => this.path(this.realOf(addOn, table), rest);
    const one = (key: Id) => `/${encodeURIComponent(String(key))}`;
    const written = (reply: { data: Row; postings?: unknown[] }) => ({ data: reply.data, ...(reply.postings === undefined ? {} : { postings: reply.postings }) });
    const ready = async () => {
      // The session's write token comes with the first read.
      await this.t.port.config();
    };
    this.panelDoor = {
      load: async (panel: PanelOpen) => {
        const query = new URLSearchParams({ connection: await this.conn(), table: await this.t.tableId(this.real(panel.table)), row: String(panel.row) });
        return loadPanelModule({
          url: `/api/v1/add-ons/customiser/panels/${encodeURIComponent(panel.id)}/bundle?${query.toString()}`,
          origin: this.options.origin ?? window.location.origin,
          host: PANEL_HOST,
          request: this.fetchImpl,
          ...(this.options.importBundle === undefined ? {} : { importBundle: this.options.importBundle }),
        });
      },
      list: async (addOn: string, table: string, query: PanelList) => {
        const search = new URLSearchParams({ limit: String(query.limit), offset: String(query.offset) });
        if (query.where !== undefined) search.set("where", JSON.stringify(query.where));
        if (query.order !== undefined && query.order !== "") search.set("order", query.order);
        if (query.select !== undefined && query.select.length > 0) search.set("select", query.select.join(","));
        return (await this.t.get<{ data: Row[] }>(await at(addOn, table, `?${search.toString()}`))).data;
      },
      get: async (addOn: string, table: string, key: Id) => {
        try {
          return (await this.t.get<{ data: Row }>(await at(addOn, table, one(key)))).data;
        } catch (error) {
          if (error instanceof SessionPortError && error.status === 404) return null;
          throw error;
        }
      },
      create: async (addOn: string, table: string, values: Record<string, unknown>) => {
        await ready();
        return written(await this.t.mutate<{ data: Row; postings?: unknown[] }>(await at(addOn, table), "POST", { values }));
      },
      update: async (addOn: string, table: string, key: Id, values: Record<string, unknown>) => {
        await ready();
        return written(await this.t.mutate<{ data: Row; postings?: unknown[] }>(await at(addOn, table, one(key)), "PATCH", { values }));
      },
      remove: async (addOn: string, table: string, key: Id) => {
        await ready();
        await this.t.mutate(await at(addOn, table, `${one(key)}?confirm=true`), "DELETE");
      },
      // Said by Adminium in the staff config, by the add-on's tables' real names (the dashboard's kit route is not a screen's).
      access: (addOn: string, table: string) => (this.cfg.access === null ? null : (this.cfg.access.tables[this.realOf(addOn, table)] ?? [])),
      upload: async (addOn: string, table: string, column: string, key: Id, file: Blob, name: string): Promise<PanelUploaded> => {
        await ready();
        const real = this.realOf(addOn, table);
        const query = new URLSearchParams({ filename: name, connectionId: await this.conn(), table: real, column });
        // The bytes are the body, the session's token beside them, as a proof's PDF goes.
        const res = await this.fetchImpl(`/api/v1/files?${query.toString()}`, {
          method: "POST",
          credentials: "same-origin",
          headers: { accept: "application/json", "content-type": file.type === "" ? "application/octet-stream" : file.type, ...(this.cfg.csrfToken === null ? {} : { "x-adminium-csrf": this.cfg.csrfToken }) },
          body: file,
        });
        const body = (await res.json().catch(() => null)) as { ref?: string; removed?: string[]; data?: { id?: string; filename?: string; mime?: string; sizeBytes?: number }; error?: { code?: string; message?: string; details?: unknown } } | null;
        if (!res.ok || body?.data?.id === undefined) {
          throw new SessionPortError(body?.error?.message ?? "The file was not stored.", res.status, body?.error?.code ?? "UPLOAD_FAILED", body?.error?.details);
        }
        const stored = body.data as { id: string; filename?: string; mime?: string; sizeBytes?: number };
        const ref = body.ref ?? stored.id;
        let saved: Row;
        try {
          saved = (await this.t.mutate<{ data: Row }>(await at(addOn, table, one(key)), "PATCH", { values: { [column]: ref } })).data;
        } catch (error) {
          // Nothing holds it: it goes now, with the refusal the panel shows.
          await this.t.mutate(`/api/v1/files/${encodeURIComponent(stored.id)}`, "DELETE").catch(() => undefined);
          throw error;
        }
        return { ref, id: stored.id, name: stored.filename ?? name, mime: stored.mime ?? file.type, size: stored.sizeBytes ?? file.size, removed: body.removed ?? [], row: saved };
      },
    };
    return this.panelDoor;
  }

  who(): Person {
    const prefix = `${APP_KEY}-`;
    const roles = (this.cfg.access?.roles ?? []).map((r) => r.slug).filter((slug) => slug.startsWith(prefix)).map((slug) => slug.slice(prefix.length));
    const access = this.cfg.access;
    return {
      name: this.cfg.user?.name ?? "",
      roles,
      can: (table: Table, action: Action) => access === null || (access.tables[table]?.includes(action) ?? false),
    };
  }

  facts(): WorksFacts {
    const days = this.cfg.settings["working_days"];
    const cutoff = this.cfg.settings["cutoff"];
    return {
      zone: this.cfg.timezone ?? this.cfg.serverTimezone ?? "UTC",
      currency: this.cfg.currency ?? "GBP",
      workingDays: (typeof days === "string" && days.trim() !== "" ? days : "mon,tue,wed,thu,fri").split(",").map((d) => d.trim().toLowerCase().slice(0, 3)),
      cutoff: typeof cutoff === "string" && /^\d{1,2}:\d{2}$/.test(cutoff.trim()) ? cutoff.trim() : "14:00",
      addOns: Object.keys(this.cfg.addOns),
      carrier: this.carrier,
      addOnSettings: Object.fromEntries(Object.entries(this.cfg.addOns).map(([key, addOn]) => [key, addOn.settings])),
      connectionId: this.cfg.connectionId,
    };
  }

  now(): number {
    return deviceNow() + this.skew;
  }

  load(): Promise<WorksData> {
    return this.run(async () => {
      // The session's write token comes with the first read.
      await this.t.port.config();
      const [settings, products, options, materials, sizes, finishes, breaks, packaging, bands, machines, closures, orders, jobs, artwork, proofs, spoils] = await Promise.all([
        this.list("settings"),
        this.list("products", "position.asc,id.asc"),
        this.list("options", "position.asc,id.asc"),
        this.list("materials", "position.asc,id.asc"),
        this.list("sizes", "position.asc,id.asc"),
        this.list("finishes", "position.asc,id.asc"),
        this.list("breaks", "min_qty.asc"),
        this.list("packaging", "position.asc,id.asc"),
        this.list("delivery_bands", "position.asc,id.asc"),
        this.list("machines", "position.asc,id.asc"),
        this.list("closures"),
        this.list("orders", "id.asc"),
        this.list("jobs", "order_id.asc,position.asc"),
        this.list("artwork", "job_id.asc,id.asc"),
        this.list("proofs", "job_id.asc,version.asc"),
        this.list("spoils", "job_id.asc,id.asc"),
      ]);
      const on = new Set(Object.keys(this.cfg.addOns));
      // Only what this person's role reads of the add-ons' tables: a read it is not given is never asked for.
      const who = this.who();
      const reads = (table: Parameters<typeof mayReadAddOn>[1]) => mayReadAddOn(who, table);
      // The designs the jobs name, and their versions and made files: the Customiser's rows, read as its readers may.
      const designIds = [...new Set(jobs!.map((j) => j["design_id"]).filter((v) => v !== null && v !== undefined))];
      const [designs, versions] =
        designIds.length === 0
          ? [[], []]
          : await Promise.all([
              reads("customiser:designs") ? this.listAddOn("customiser:designs", { where: { column: "id", op: "in", value: designIds } }) : [],
              reads("customiser:design_versions") ? this.listAddOn("customiser:design_versions", { where: { column: "design_id", op: "in", value: designIds }, order: "version.desc" }) : [],
            ]);
      const files = versions.length === 0 || !reads("customiser:version_files") ? [] : await this.listAddOn("customiser:version_files", { where: { column: "version_id", op: "in", value: versions.map((v) => v.id) }, order: "position.asc" });
      // What Inventory keeps of the materials, when it keeps the stock: each material's item, and that item's stock.
      let links: Row[] = [];
      let stock: Row[] = [];
      if (on.has("inventory") && materials!.length > 0 && reads("inventory:links") && reads("inventory:stock_points")) {
        links = await this.listAddOn("inventory:links", { where: { column: "source_table", op: "eq", value: this.real("materials") } });
        const items = [...new Set(links.map((l) => l["item_id"]).filter((v) => v !== null && v !== undefined))];
        if (items.length > 0) stock = await this.listAddOn("inventory:stock_points", { where: { column: "item_id", op: "in", value: items }, order: "id.asc" });
      }
      // The delivery company attached and on, and what it booked: asked only by whoever reads Adminium's list of add-ons.
      this.carrier = mayManageAddOns(who) ? await this.findCarrier(on) : null;
      const shipments = this.carrier === null ? [] : await this.listAddOn(`${this.carrier.key}:shipments`, { order: "created_at.desc" });
      // The public holidays of England and Wales, to add one as a closure: Holiday calendars on, and read by whoever may (the owner).
      const set = { and: [{ column: "country", op: "eq", value: HOLIDAY_SET.country }, { column: "region", op: "eq", value: HOLIDAY_SET.region }] };
      const holidays = on.has(HOLIDAYS) && reads("holiday-calendars:holidays") ? await this.listAddOn(`${HOLIDAYS}:holidays`, { where: set, order: "day.asc" }) : [];
      return {
        settings: settings![0] ?? null,
        products: products!,
        options: options!,
        materials: materials!,
        sizes: sizes!,
        finishes: finishes!,
        breaks: breaks!,
        packaging: packaging!,
        bands: bands!,
        machines: machines!,
        closures: closures!,
        orders: orders!,
        jobs: jobs!,
        artwork: artwork!,
        proofs: proofs!,
        spoils: spoils!,
        designs,
        versions,
        files,
        links,
        stock,
        shipments,
        holidays,
      };
    });
  }

  /** The add-on attached to this app and on that provides the carrier contract; none when no list answers. */
  private async findCarrier(on: ReadonlySet<string>): Promise<{ key: string; name: string } | null> {
    try {
      const got = await this.t.get<{ addOns: Record<string, unknown>[] }>("/api/v1/add-ons");
      const found = got.addOns.find(
        (a) => on.has(String(a["key"])) && (Array.isArray(a["provides"]) ? (a["provides"] as Record<string, unknown>[]) : []).some((p) => p["contract"] === CARRIER_CONTRACT),
      );
      return found === undefined ? null : { key: String(found["key"]), name: text(found["name"]) ?? String(found["key"]) };
    } catch (error) {
      if (closed(error)) return null;
      throw error;
    }
  }

  // ── the writes ────────────────────────────────────────────────────────────

  moveJob(job: Row, to: string, values: Record<string, unknown> = {}): Promise<Row> {
    return this.run(() => this.change("jobs", job.id, { stage: to, ...values }, String(job["stage"])));
  }

  updateJob(job: Row, values: Record<string, unknown>): Promise<Row> {
    return this.run(() => this.change("jobs", job.id, values));
  }

  moveOrder(order: Row, to: string, values: Record<string, unknown> = {}): Promise<Row> {
    return this.run(() => this.change("orders", order.id, { status: to, ...values }, String(order["status"])));
  }

  updateOrder(order: Row, values: Record<string, unknown>): Promise<Row> {
    return this.run(() => this.change("orders", order.id, values));
  }

  /** What the files route answers for the proofs' `file` column: the value the row stores. */
  private async storeFile(file: ProofFile): Promise<string> {
    const conn = await this.conn();
    const table = this.real("proofs");
    if ("copyOf" in file) {
      try {
        const made = await this.t.mutate<{ ref: string }>(`/api/v1/files/${encodeURIComponent(file.copyOf)}/copy`, "POST", { connectionId: conn, table, column: "file" });
        return made.ref;
      } catch (error) {
        // The copy route is the dashboard's: someone whose role opens only the app's screens is refused it.
        // Their own browser carries the bytes across instead, read and stored again as the proof's file.
        if (!(error instanceof SessionPortError && error.status === 403)) throw error;
        const res = await this.fetchImpl(`/api/v1/files/${encodeURIComponent(file.copyOf)}/content`, { credentials: "same-origin" });
        if (!res.ok) throw asApiError(error);
        return this.storeFile({ blob: await res.blob(), filename: `${file.copyOf}.pdf` });
      }
    }
    // The bytes are the body: the files route reads no multipart form. The session's token goes with them.
    await this.t.port.config();
    const query = new URLSearchParams({ filename: file.filename, connectionId: conn, table, column: "file" });
    const res = await this.fetchImpl(`/api/v1/files?${query.toString()}`, {
      method: "POST",
      credentials: "same-origin",
      headers: { accept: "application/json", "content-type": file.blob.type || "application/pdf", ...(this.cfg.csrfToken === null ? {} : { "x-adminium-csrf": this.cfg.csrfToken }) },
      body: file.blob,
    });
    const body = (await res.json().catch(() => null)) as { ref?: string; error?: { code?: string; message?: string; details?: Record<string, unknown> } } | null;
    if (!res.ok || typeof body?.ref !== "string") {
      throw new ApiError(res.status, body?.error?.code ?? "UPLOAD_FAILED", body?.error?.message ?? "The proof was not stored.", body?.error?.details ?? {});
    }
    return body.ref;
  }

  sendProof(input: { job: Row; kind: "email" | "post"; file: ProofFile; designVersionId: Id | null; note: string | null }): Promise<Row> {
    return this.run(async () => {
      const file = await this.storeFile(input.file);
      return this.create("proofs", {
        job_id: input.job.id,
        kind: input.kind,
        file,
        ...(input.designVersionId === null ? {} : { design_version_id: input.designVersionId }),
        ...(input.note === null ? {} : { note: input.note }),
      });
    });
  }

  spoil(input: { job: Row; sheets: number; note: string | null }): Promise<Row> {
    return this.run(() => this.create("spoils", { job_id: input.job.id, qty: input.sheets, ...(input.note === null ? {} : { note: input.note }) }));
  }

  saveRate(table: Table, row: Row, values: Record<string, unknown>): Promise<Row> {
    return this.run(() => this.change(table, row.id, values));
  }

  addClosure(holiday: Row): Promise<Row> {
    const day = String(holiday["day"] ?? "").slice(0, 10);
    return this.run(() => this.create("closures", { holiday_id: holiday.id, from_date: day, to_date: day, reason: text(holiday["name"]), active: true }));
  }

  // ── the add-ons ───────────────────────────────────────────────────────────

  addOns(): Promise<InstalledAddOn[]> {
    return this.run(async () => {
      const got = await this.t.get<{ addOns: Record<string, unknown>[] }>("/api/v1/add-ons");
      /*
       * One row per key, this install's. An add-on installed on two databases
       * is two rows with one key, each attachment naming the install of the
       * app it joins (`hostInstall`, from 0.3.49): this app's is the one on
       * this install. Its switch is this install's (the PATCH says which). A
       * row for a database this install is not on stands in only for a key
       * with no copy here.
       */
      const installId = this.cfg.installId;
      const attachmentOf = (a: Record<string, unknown>) =>
        (Array.isArray(a["attachments"]) ? (a["attachments"] as Record<string, unknown>[]) : []).find(
          (one) => one["attachedTo"] === APP_KEY && (installId === null || typeof one["hostInstall"] !== "string" || one["hostInstall"] === installId),
        );
      const rank = (a: Record<string, unknown>) => (attachmentOf(a) !== undefined ? 0 : a["connectionId"] === this.cfg.connectionId ? 1 : 2);
      const byKey = new Map<string, Record<string, unknown>>();
      for (const a of got.addOns) {
        const held = byKey.get(String(a["key"]));
        if (held === undefined || rank(a) < rank(held)) byKey.set(String(a["key"]), a);
      }
      return [...byKey.values()].map((a) => {
        const attachment = attachmentOf(a);
        const kind = a["connectKind"];
        const bundles = Array.isArray(a["bundles"]) ? (a["bundles"] as Record<string, unknown>[]) : [];
        return {
          key: String(a["key"]),
          name: text(a["name"]) ?? String(a["key"]),
          version: text(a["version"]) ?? "",
          connectKind: kind === "api-key" || kind === "oauth2" ? kind : "none",
          connected: a["connected"] === true,
          missing: a["missing"] === true,
          attached: attachment !== undefined,
          enabled: attachment?.["enabled"] === true,
          slots: (Array.isArray(a["slots"]) ? (a["slots"] as Record<string, unknown>[]) : []).map((s) => String(s["slot"])),
          networkAllow: (Array.isArray(a["networkAllow"]) ? (a["networkAllow"] as unknown[]) : []).map(String),
          pages: bundles.flatMap((b) => (typeof b["ref"] === "string" ? [b["ref"]] : [])),
          panels: bundles.flatMap((b) => (typeof b["panel"] === "string" ? [b["panel"]] : [])),
        };
      });
    });
  }

  setAddOn(key: string, enabled: boolean): Promise<void> {
    return this.run(async () => {
      await this.t.port.config();
      await this.t.mutate(`/api/v1/add-ons/${encodeURIComponent(key)}`, "PATCH", { attachedTo: APP_KEY, enabled });
    });
  }

  catalog(): Promise<CatalogEntry[]> {
    return this.run(async () => {
      try {
        const got = await this.t.get<{ addOns: Record<string, unknown>[] }>("/api/v1/add-ons/catalog");
        return got.addOns.map((a) => {
          const state = a["state"];
          const kind = a["connectKind"];
          return {
            key: String(a["key"]),
            name: text(a["name"]) ?? String(a["key"]),
            state: state === "installed" || state === "staged" || state === "missing" ? state : "available",
            tagline: text(a["tagline"]),
            categories: (Array.isArray(a["categories"]) ? (a["categories"] as unknown[]) : []).map(String),
            monogram: text(a["monogram"]),
            connectKind: kind === "api-key" || kind === "oauth2" ? kind : "none",
          };
        });
      } catch (error) {
        if (closed(error)) return [];
        throw error;
      }
    });
  }

  async signOut(): Promise<void> {
    await this.t.port.config();
    await this.t.mutate("/api/v1/auth/logout", "POST", {});
  }

  activity(): Promise<ActivityEntry[]> {
    return this.run(async () => {
      try {
        const got = await this.t.get<{ entries: Record<string, unknown>[] }>("/api/v1/audit?resource=add-on&limit=100");
        return got.entries.map((e) => {
          const entity = e["entity"] !== null && typeof e["entity"] === "object" ? (e["entity"] as Record<string, unknown>) : {};
          const action = String(e["action"] ?? "");
          return {
            id: String(e["id"]),
            at: Number(e["createdAt"]),
            addOn: text(entity["key"]) ?? text(entity["addOn"]) ?? text(entity["id"]) ?? "",
            action: action.startsWith("add-on.") ? action.slice("add-on.".length) : action,
            by: text(e["actorLabel"]) ?? "",
            ref: null,
          };
        });
      } catch (error) {
        // Adminium's log is for those who may read it; everyone else sees what the rows say.
        if (closed(error)) return [];
        throw error;
      }
    });
  }
}
