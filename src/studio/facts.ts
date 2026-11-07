/**
 * What the works' screens read off the rows: which job is where on the
 * floor, which is held back by its proof, what each job is, what its order
 * is, what the shelf holds of its stock. Every figure here is a count of rows
 * or a stored column; no price, total, weight, sheet count or date is worked
 * out in the browser.
 */
import type { WorksData } from "./door.ts";
import { addDays, isStudioDay, studioDaysBetween, type Closure, type Day } from "./time.ts";
import { dayOf, num, same, text, type Id, type Row } from "./wire.ts";

/** The floor's four columns, in order. */
export const FLOOR = ["prepress", "printing", "finishing", "ready"] as const;
export type FloorStage = (typeof FLOOR)[number];

/** Whether a job is still being made: in prepress, on the press or in finishing. */
export const isLive = (job: Row): boolean => job["stage"] === "prepress" || job["stage"] === "printing" || job["stage"] === "finishing";
/** Whether a job is on the board at all: being made, or ready to hand over. */
export const onBoard = (job: Row): boolean => isLive(job) || job["stage"] === "ready";

export const byId = (rows: readonly Row[], id: unknown): Row | undefined => (id === null || id === undefined ? undefined : rows.find((r) => same(r.id, id)));

export const orderOf = (data: WorksData, job: Row): Row | undefined => byId(data.orders, job["order_id"]);
export const productOf = (data: WorksData, job: Row): Row | undefined => byId(data.products, job["product_id"]);
export const materialOf = (data: WorksData, job: Row): Row | undefined => byId(data.materials, job["material_id"]);
export const sizeOf = (data: WorksData, job: Row): Row | undefined => byId(data.sizes, job["size_id"]);
export const optionOf = (data: WorksData, id: unknown): Row | undefined => byId(data.options, id);
export const packagingOf = (data: WorksData, job: Row): Row | undefined => byId(data.packaging, job["packaging_id"]);

/** An order's jobs, in their order. */
export const jobsOf = (data: WorksData, order: Row): Row[] => data.jobs.filter((j) => same(j["order_id"], order.id)).sort((a, b) => (num(a["position"]) ?? 0) - (num(b["position"]) ?? 0) || Number(a.id) - Number(b.id));

/** A job's proofs, first sent first. */
export const proofsOf = (data: WorksData, job: Row): Row[] => data.proofs.filter((p) => same(p["job_id"], job.id)).sort((a, b) => (num(a["version"]) ?? 0) - (num(b["version"]) ?? 0));

export const artworkOf = (data: WorksData, job: Row): Row[] => data.artwork.filter((a) => same(a["job_id"], job.id));
export const spoilsOf = (data: WorksData, job: Row): Row[] => data.spoils.filter((s) => same(s["job_id"], job.id));

/** Whether Adminium will let a job leave prepress: its latest proof is approved (`proof_ok`). */
export const proofOk = (job: Row): boolean => num(job["proof_ok"]) === 1 || job["proof_state"] === "approved";

/**
 * Why a job may not leave prepress, or null when it may: a proof sent and
 * waiting on the customer, or nothing approved yet.
 */
export function lockOf(job: Row): "waiting" | "unapproved" | null {
  if (job["stage"] !== "prepress" || proofOk(job)) return null;
  return job["proof_state"] === "sent" ? "waiting" : "unapproved";
}

/** A job's reference: its order's number, and its place on the order when the order holds more than one job. */
export function refOf(data: WorksData, job: Row): string {
  const order = orderOf(data, job);
  const number = text(order?.["number"]) ?? `#${String(job.id)}`;
  if (order === undefined) return number;
  const jobs = jobsOf(data, order);
  if (jobs.length < 2) return number;
  return `${number}/${String(jobs.findIndex((j) => same(j.id, job.id)) + 1)}`;
}

/** A job's finished size in millimetres: its preset's, or its own for large format. */
export function sizeMm(data: WorksData, job: Row): { w: number; h: number } | null {
  const size = sizeOf(data, job);
  const w = num(job["width_mm"]) ?? num(size?.["width_mm"]);
  const h = num(job["height_mm"]) ?? num(size?.["height_mm"]);
  return w === null || h === null ? null : { w, h };
}

/** The product family a job's tint and dot come from. */
export const familyOf = (data: WorksData, job: Row): string => text(productOf(data, job)?.["family"]) ?? "paper";

/** Whether a job is sheet work (imposed on press sheets) or large format off the roll. */
export const isSheetWork = (job: Row): boolean => job["product_kind"] !== "large";

/** The works' closures in effect, as days. */
export function closuresOf(data: WorksData): Closure[] {
  return data.closures
    .filter((c) => c["active"] !== false)
    .flatMap((c) => {
      const from = dayOf(c["from_date"]);
      const to = dayOf(c["to_date"]) ?? from;
      return from === null || to === null ? [] : [{ from, to }];
    });
}

/** `next`: the next day the works prints on, when that is not tomorrow (Monday, seen on a Friday). */
export type DueTone = "ready" | "overdue" | "today" | "tomorrow" | "next" | "later" | "none";

/** Where a job's ready-by stands against today, in the works' days. */
export function dueOf(job: Row, today: Day, workingDays: readonly string[], closures: readonly Closure[]): { tone: DueTone; day: Day | null } {
  const due = dayOf(job["ready_by"]);
  if (!isLive(job)) return { tone: "ready", day: due };
  if (due === null) return { tone: "none", day: null };
  if (due < today) return { tone: "overdue", day: due };
  const days = studioDaysBetween(today, due, workingDays, closures);
  if (days === 0) return { tone: "today", day: due };
  // The next working day is "tomorrow" only when it is the next day on the calendar.
  if (days === 1) return { tone: due === addDays(today, 1) ? "tomorrow" : "next", day: due };
  return { tone: "later", day: due };
}

/** Whether today is one the works prints on. */
export const isWorkingDay = (day: Day, workingDays: readonly string[], closures: readonly Closure[]): boolean => isStudioDay(day, workingDays, closures);

/** The four figures over the board: counts of jobs and the press sheets they hold, every one a stored column. */
export function floorFigures(data: WorksData, today: Day): { dueToday: number; sheets: number; waiting: number; overdue: number } {
  const live = data.jobs.filter(isLive);
  return {
    dueToday: live.filter((j) => dayOf(j["ready_by"]) === today).length,
    sheets: data.jobs.filter((j) => j["stage"] === "printing").reduce((n, j) => n + (num(j["sheets"]) ?? 0), 0),
    waiting: data.jobs.filter((j) => j["stage"] === "prepress" && !proofOk(j)).length,
    overdue: live.filter((j) => {
      const due = dayOf(j["ready_by"]);
      return due !== null && due < today;
    }).length,
  };
}

/** What a stored artwork row's checks said, as the customer was shown them. */
export function checksOf(artwork: Row): { level: string; text: string }[] {
  let value: unknown = artwork["checks"];
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  const rows = value !== null && typeof value === "object" && Array.isArray((value as { rows?: unknown }).rows) ? (value as { rows: unknown[] }).rows : [];
  return rows.flatMap((r) => {
    const row = r as Record<string, unknown>;
    return typeof row["text"] === "string" ? [{ level: String(row["level"] ?? "info"), text: row["text"] }] : [];
  });
}

/** The newest version of a job's design: what its proof and its print files are drawn from. */
export function versionOf(data: WorksData, job: Row): Row | undefined {
  return data.versions.filter((v) => same(v["design_id"], job["design_id"])).sort((a, b) => (num(b["version"]) ?? 0) - (num(a["version"]) ?? 0))[0];
}

/** The id of a stored file, from the value its column holds (`…/api/v1/files/<id>/content`, or the id itself). */
export function fileIdOf(ref: unknown): string | null {
  const value = text(ref);
  if (value === null) return null;
  const m = /(file_[0-9A-HJKMNP-TV-Z]{26})/.exec(value);
  return m === null ? null : m[1]!;
}

/** Where a stored file is read from, at this origin: its content route, whatever spelling its column keeps. */
export function fileSrc(ref: unknown): string | null {
  const id = fileIdOf(ref);
  if (id !== null) return `/api/v1/files/${id}/content`;
  return text(ref);
}

/** The stock Inventory keeps of a material: one row a place, when the material is linked to an item. */
export function stockOf(data: WorksData, material: Row): Row[] {
  const link = data.links.find((l) => String(l["source_row"]) === String(material.id) && l["item_id"] !== null && l["item_id"] !== undefined);
  if (link === undefined) return [];
  return data.stock.filter((s) => same(s["item_id"], link["item_id"]));
}

/** A delivery order of the board that is ready to go and has not gone: what "Book a collection" is for. */
export function readyToGo(data: WorksData, order: Row): boolean {
  if (order["delivery_method"] !== "deliver" || order["status"] === "dispatched" || order["status"] === "collected" || order["status"] === "cancelled") return false;
  const jobs = jobsOf(data, order).filter((j) => j["stage"] !== "cancelled");
  return jobs.length > 0 && jobs.every((j) => j["stage"] === "ready");
}

/** The orders ready to go out with a carrier, oldest first. */
export const dispatchQueue = (data: WorksData): Row[] => data.orders.filter((o) => readyToGo(data, o));

/** A job of an order, by its key. */
export const jobById = (data: WorksData, id: Id | null): Row | undefined => byId(data.jobs, id);
