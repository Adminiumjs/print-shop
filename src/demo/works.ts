/**
 * The works' door into the demo's Adminium: every row the screens read, and
 * each write made the way the real server makes it — a move refused when the
 * row has moved on since the screen read it or the table's states do not
 * allow it (a job held in prepress until its proof is approved, an order
 * ready only once no job of it is on the floor), a proof numbered per job,
 * a stamp (who put a job on the press, when) and every figure after it
 * worked out by the manifest's own rules.
 *
 * Signed in as Rosa Marlow, who owns the works, so every screen is open.
 *
 * DEMO BUILD ONLY — nothing in a real build imports it.
 */
import type { ActivityEntry, CatalogEntry, InstalledAddOn, Person, ProofFile, Table, WorksData, WorksDoor, WorksFacts } from "../studio/door.ts";
import { ApiError, type Id, type Row } from "../studio/wire.ts";
import { APP_SETTINGS, mayMove, WORKING_DAYS } from "./rules.ts";
import { CARD_ADD_ONS, START_ADD_ONS, type DemoWorld } from "./world.ts";

const same = (a: unknown, b: unknown) => a !== null && a !== undefined && b !== null && b !== undefined && String(a) === String(b);
const copy = <T>(value: T): T => structuredClone(value);
const byNumber = (column: string) => (a: Row, b: Row) => Number(a[column] ?? 0) - Number(b[column] ?? 0) || Number(a.id) - Number(b.id);

/** The person the works is signed in as. */
export const DEMO_PERSON: Person = { name: "Rosa Marlow", roles: ["owner"], can: () => true };

/** The add-ons the demo has installed, by key, with the names Adminium lists them by. */
const INSTALLED: Record<string, string> = {
  customiser: "Customiser",
  "shipping-dhl": "DHL Shipping",
  inventory: "Inventory",
  invoices: "Invoices & Receipts",
  "holiday-calendars": "Holiday Calendars",
};

export class DemoWorks implements WorksDoor {
  private readonly world: DemoWorld;

  constructor(world: DemoWorld) {
    this.world = world;
  }

  /** No Adminium serves the Customiser's panels to the demo: the sheet says where they are drawn. */
  panels(): null {
    return null;
  }

  who(): Person {
    return DEMO_PERSON;
  }

  facts(): WorksFacts {
    return {
      zone: this.world.zone,
      currency: this.world.currency,
      workingDays: [...WORKING_DAYS],
      cutoff: APP_SETTINGS.cutoff,
      addOns: [...this.world.addOns],
      // A carrier's own screens come from its add-on's bundle, which the demo has none of: no carrier is drawn.
      carrier: null,
      addOnSettings: {},
      connectionId: null,
    };
  }

  now(): number {
    return this.world.now;
  }

  async load(): Promise<WorksData> {
    const w = this.world;
    const jobs = [...w.all("jobs")].sort((a, b) => Number(a["order_id"]) - Number(b["order_id"]) || Number(a["position"] ?? 0) - Number(b["position"] ?? 0));
    const named = new Set(jobs.map((j) => String(j["design_id"] ?? "")).filter((id) => id !== ""));
    const versions = w.all("design_versions").filter((v) => named.has(String(v["design_id"]))).sort((a, b) => Number(b["version"]) - Number(a["version"]));
    const versionIds = new Set(versions.map((v) => String(v.id)));
    return copy({
      settings: w.settings(),
      products: [...w.all("products")].sort(byNumber("position")),
      options: [...w.all("options")].sort(byNumber("position")),
      materials: [...w.all("materials")].sort(byNumber("position")),
      sizes: [...w.all("sizes")].sort(byNumber("position")),
      finishes: [...w.all("finishes")].sort(byNumber("position")),
      breaks: [...w.all("breaks")].sort(byNumber("min_qty")),
      packaging: [...w.all("packaging")].sort(byNumber("position")),
      bands: [...w.all("delivery_bands")].sort(byNumber("position")),
      machines: [...w.all("machines")].sort(byNumber("position")),
      closures: w.all("closures"),
      orders: [...w.all("orders")].sort(byNumber("id")),
      jobs,
      artwork: [...w.all("artwork")].sort((a, b) => Number(a["job_id"]) - Number(b["job_id"]) || a.id - b.id),
      proofs: [...w.all("proofs")].sort((a, b) => Number(a["job_id"]) - Number(b["job_id"]) || Number(a["version"]) - Number(b["version"])),
      spoils: w.all("spoils"),
      designs: w.all("designs").filter((d) => named.has(String(d.id))),
      versions,
      files: w.all("version_files").filter((f) => versionIds.has(String(f["version_id"]))),
      links: [],
      stock: [],
      shipments: [],
      holidays: w.addOns.has("holiday-calendars") ? w.all("holidays") : [],
    });
  }

  /** A row moved along its table's states, from the state the screen saw. */
  private move(table: string, column: string, row: Row, to: string, values: Record<string, unknown>): Row {
    const w = this.world;
    const now = w.get(table, row.id);
    if (now === undefined) throw new ApiError(404, "NOT_FOUND", "No such row.");
    if (!same(now[column], row[column])) throw new ApiError(409, "STATE_MOVE_REFUSED", "It moved on since.", { named: column });
    if (!mayMove(table, now, to, DEMO_PERSON.roles)) throw new ApiError(409, "STATE_MOVE_REFUSED", "Not a move this row may make now.", { from: now[column], to, named: column });
    return copy(w.write(() => w.update(table, row.id, { ...values, [column]: to }), DEMO_PERSON.name));
  }

  private change(table: string, id: Id, values: Record<string, unknown>): Row {
    const w = this.world;
    if (w.get(table, id) === undefined) throw new ApiError(404, "NOT_FOUND", "No such row.");
    return copy(w.write(() => w.update(table, id, values), DEMO_PERSON.name));
  }

  async moveJob(job: Row, to: string, values: Record<string, unknown> = {}): Promise<Row> {
    return this.move("jobs", "stage", job, to, values);
  }

  async updateJob(job: Row, values: Record<string, unknown>): Promise<Row> {
    return this.change("jobs", job.id, values);
  }

  async moveOrder(order: Row, to: string, values: Record<string, unknown> = {}): Promise<Row> {
    return this.move("orders", "status", order, to, values);
  }

  async updateOrder(order: Row, values: Record<string, unknown>): Promise<Row> {
    return this.change("orders", order.id, values);
  }

  async sendProof(input: { job: Row; kind: "email" | "post"; file: ProofFile; designVersionId: Id | null; note: string | null }): Promise<Row> {
    const w = this.world;
    let file: string;
    if ("copyOf" in input.file) file = input.file.copyOf;
    else {
      file = `/api/v1/files/${w.code("file_", 30)}/content`;
      w.files.set(file, input.file.blob);
    }
    return copy(
      w.write(
        () => w.insert("proofs", { job_id: input.job.id, kind: input.kind, file, design_version_id: input.designVersionId, note: input.note, state: "sent" }),
        DEMO_PERSON.name,
      ),
    );
  }

  async spoil(input: { job: Row; sheets: number; note: string | null }): Promise<Row> {
    const w = this.world;
    return copy(w.write(() => w.insert("spoils", { job_id: input.job.id, qty: String(input.sheets), note: input.note }), DEMO_PERSON.name));
  }

  async saveRate(table: Table, row: Row, values: Record<string, unknown>): Promise<Row> {
    return this.change(table === "delivery_bands" ? "delivery_bands" : table, row.id, values);
  }

  async addClosure(holiday: Row): Promise<Row> {
    const w = this.world;
    const day = String(holiday["day"] ?? "").slice(0, 10);
    return copy(w.write(() => w.insert("closures", { holiday_id: holiday.id, from_date: day, to_date: day, reason: holiday["name"] ?? null, active: true }), DEMO_PERSON.name));
  }

  async addOns(): Promise<InstalledAddOn[]> {
    const keys = [...START_ADD_ONS, ...CARD_ADD_ONS].filter((k, i, all) => all.indexOf(k) === i);
    return keys.map((key) => ({
      key,
      name: INSTALLED[key] ?? key,
      version: "1.0.25",
      connectKind: "none",
      connected: true,
      missing: false,
      attached: true,
      enabled: this.world.addOns.has(key),
      slots: [],
      networkAllow: [],
      pages: [],
      panels: [],
    }));
  }

  async setAddOn(key: string, enabled: boolean): Promise<void> {
    this.world.setAddOn(key, enabled);
  }

  async catalog(): Promise<CatalogEntry[]> {
    return [];
  }

  async activity(): Promise<ActivityEntry[]> {
    return [];
  }
}
