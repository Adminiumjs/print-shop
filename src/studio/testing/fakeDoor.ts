/**
 * A stand-in for the works' door: it keeps the fixture's rows, writes each
 * change into them the way the server would store it (a stage, a status, a
 * new proof row, a spoilage added up on its job), judges a move as the
 * manifest's states do (the proof's gate, an order ready once no job is on
 * the floor), and records every call, in order, with what it was given. A
 * test can make the next call of a kind refuse, as Adminium would.
 *
 * Tests only; nothing that ships imports it.
 */
import type { ActivityEntry, CatalogEntry, InstalledAddOn, PanelDoor, Person, ProofFile, Table, WorksData, WorksDoor, WorksFacts } from "../door.ts";
import { JOB_MOVES } from "../roles.ts";
import { ApiError, num, same, type Id, type Row } from "../wire.ts";
import { FACTS, fixture, person, WEDNESDAY } from "./fixture.ts";

export interface Call {
  method: string;
  args: Record<string, unknown>;
}

const ORDER_MOVES: Readonly<Record<string, readonly string[]>> = {
  placed: ["ready", "cancelled"],
  ready: ["collected", "dispatched", "placed"],
};

const TABLE_OF: Partial<Record<Table, keyof WorksData>> = {
  settings: "settings",
  materials: "materials",
  finishes: "finishes",
  packaging: "packaging",
  delivery_bands: "bands",
  breaks: "breaks",
  sizes: "sizes",
};

export class FakeDoor implements WorksDoor {
  data: WorksData;
  calls: Call[] = [];
  installed: InstalledAddOn[];
  log: ActivityEntry[];
  shelf: CatalogEntry[];
  private readonly person: Person;
  private readonly works: WorksFacts;
  private refusals = new Map<string, ApiError>();
  private nextId = 9000;

  constructor(options: { roles?: string[]; data?: WorksData; facts?: Partial<WorksFacts>; installed?: InstalledAddOn[]; activity?: ActivityEntry[]; catalog?: CatalogEntry[] } = {}) {
    this.data = options.data ?? fixture();
    this.person = person(options.roles ?? ["owner"]);
    this.works = { ...FACTS, ...options.facts };
    this.installed = options.installed ?? [];
    this.log = options.activity ?? [];
    this.shelf = options.catalog ?? [];
  }

  /** The next call of `method` is refused with this. */
  refuse(method: string, error: ApiError): void {
    this.refusals.set(method, error);
  }

  private record(method: string, args: Record<string, unknown>): void {
    this.calls.push({ method, args });
    const refusal = this.refusals.get(method);
    if (refusal !== undefined) {
      this.refusals.delete(method);
      throw refusal;
    }
  }

  /** The calls of one kind, in order. */
  of(method: string): Record<string, unknown>[] {
    return this.calls.filter((c) => c.method === method).map((c) => c.args);
  }

  private update(list: Row[], id: Id, values: Record<string, unknown>): Row {
    const i = list.findIndex((r) => same(r.id, id));
    if (i < 0) throw new ApiError(404, "NOT_FOUND", "No such row.");
    list[i] = { ...list[i]!, ...values };
    return list[i]!;
  }

  who(): Person {
    return this.person;
  }
  facts(): WorksFacts {
    return this.works;
  }
  now(): number {
    return WEDNESDAY;
  }
  async load(): Promise<WorksData> {
    return structuredClone(this.data);
  }

  async moveJob(job: Row, to: string, values: Record<string, unknown> = {}): Promise<Row> {
    this.record("moveJob", { id: job.id, from: job["stage"], to, values });
    const now = this.data.jobs.find((j) => same(j.id, job.id))!;
    if (now["stage"] !== job["stage"]) throw new ApiError(409, "STATE_MOVE_REFUSED", "It moved.", { named: "stage" });
    if (!(JOB_MOVES[String(now["stage"])] ?? []).includes(to)) throw new ApiError(409, "STATE_MOVE_REFUSED", "Not a move.", { from: now["stage"], to, named: "stage" });
    if (now["stage"] === "prepress" && to === "printing" && num(now["proof_ok"]) !== 1) throw new ApiError(409, "STATE_MOVE_REFUSED", "Not approved.", { from: "prepress", to: "printing" });
    const onFloor = to === "prepress" || to === "printing" || to === "finishing" ? 1 : 0;
    return this.update(this.data.jobs, job.id, { stage: to, on_floor: onFloor, ...values });
  }

  async updateJob(job: Row, values: Record<string, unknown>): Promise<Row> {
    this.record("updateJob", { id: job.id, values });
    return this.update(this.data.jobs, job.id, values);
  }

  async moveOrder(order: Row, to: string, values: Record<string, unknown> = {}): Promise<Row> {
    this.record("moveOrder", { id: order.id, from: order["status"], to, values });
    const now = this.data.orders.find((o) => same(o.id, order.id))!;
    if (now["status"] !== order["status"]) throw new ApiError(409, "STATE_MOVE_REFUSED", "It moved.", { named: "status" });
    if (!(ORDER_MOVES[String(now["status"])] ?? []).includes(to)) throw new ApiError(409, "STATE_MOVE_REFUSED", "Not a move.", { from: now["status"], to, named: "status" });
    const floor = this.data.jobs.filter((j) => same(j["order_id"], order.id) && num(j["on_floor"]) === 1).length;
    if (to === "ready" && floor > 0) throw new ApiError(409, "STATE_MOVE_REFUSED", "Jobs on the floor.", { from: now["status"], to: "ready" });
    return this.update(this.data.orders, order.id, { status: to, ...values });
  }

  async updateOrder(order: Row, values: Record<string, unknown>): Promise<Row> {
    this.record("updateOrder", { id: order.id, values });
    return this.update(this.data.orders, order.id, values);
  }

  async sendProof(input: { job: Row; kind: "email" | "post"; file: ProofFile; designVersionId: Id | null; note: string | null }): Promise<Row> {
    const file = "copyOf" in input.file ? { copyOf: input.file.copyOf } : { filename: input.file.filename, type: input.file.blob.type };
    this.record("sendProof", { jobId: input.job.id, kind: input.kind, file, designVersionId: input.designVersionId, note: input.note });
    this.nextId += 1;
    const version = this.data.proofs.filter((p) => same(p["job_id"], input.job.id)).length + 1;
    // Adminium sends the job's earlier proof still out again in the same write (`states.supersedes`).
    for (const p of this.data.proofs) if (same(p["job_id"], input.job.id) && (p["state"] === "sent" || p["state"] === "change_asked")) p["state"] = "superseded";
    const row: Row = { id: this.nextId, order_id: input.job["order_id"], job_id: input.job.id, version, kind: input.kind, file: "/api/v1/files/file_01J8Z6Q3M4N5P6R7S8T9V0W1ZZ/content", note: input.note, state: "sent", sent_at: new Date(WEDNESDAY).toISOString() };
    this.data.proofs.push(row);
    this.update(this.data.jobs, input.job.id, { proof_state: "sent", proof_ok: 0 });
    return row;
  }

  async addClosure(holiday: Row): Promise<Row> {
    this.record("addClosure", { holidayId: holiday.id });
    this.nextId += 1;
    const day = String(holiday["day"]).slice(0, 10);
    const row: Row = { id: this.nextId, holiday_id: holiday.id, from_date: day, to_date: day, reason: holiday["name"], active: true };
    this.data.closures.push(row);
    return row;
  }

  async spoil(input: { job: Row; sheets: number; note: string | null }): Promise<Row> {
    this.record("spoil", { jobId: input.job.id, qty: input.sheets, note: input.note });
    this.nextId += 1;
    const row: Row = { id: this.nextId, job_id: input.job.id, order_id: input.job["order_id"], material_id: input.job["material_id"], qty: String(input.sheets), spoiled_at: new Date(WEDNESDAY).toISOString() };
    this.data.spoils.push(row);
    const total = this.data.spoils.filter((s) => same(s["job_id"], input.job.id)).reduce((n, s) => n + (num(s["qty"]) ?? 0), 0);
    this.update(this.data.jobs, input.job.id, { spoiled_sheets: String(total) });
    return row;
  }

  async saveRate(table: Table, row: Row, values: Record<string, unknown>): Promise<Row> {
    this.record("saveRate", { table, id: row.id, values });
    const key = TABLE_OF[table];
    if (key === "settings") {
      this.data.settings = { ...this.data.settings!, ...values };
      return this.data.settings;
    }
    if (key === undefined) throw new ApiError(404, "NOT_FOUND", "No such table.");
    return this.update(this.data[key] as Row[], row.id, values);
  }

  async addOns(): Promise<InstalledAddOn[]> {
    this.record("addOns", {});
    return structuredClone(this.installed);
  }

  async setAddOn(key: string, enabled: boolean): Promise<void> {
    this.record("setAddOn", { key, enabled });
    this.installed = this.installed.map((a) => (a.key === key ? { ...a, enabled, attached: true } : a));
  }

  async catalog(): Promise<CatalogEntry[]> {
    this.record("catalog", {});
    return structuredClone(this.shelf);
  }

  /** The Customiser's panels' door a test hands in; none by default, as in the demo. */
  panelDoor: PanelDoor | null = null;
  panels(): PanelDoor | null {
    return this.panelDoor;
  }

  async signOut(): Promise<void> {
    this.record("signOut", {});
  }

  async activity(): Promise<ActivityEntry[]> {
    this.record("activity", {});
    return structuredClone(this.log);
  }
}
