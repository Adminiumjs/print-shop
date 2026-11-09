/**
 * What the pages after an order show of a job, read off the rows Adminium
 * keeps: each stage lit by the job's own stage and proof, and dated by the
 * stamp Adminium wrote when it got there; the proof waiting; the proofs so
 * far; the files the customer sent with what their checks said. Nothing
 * here works a date out; a stage reached with no stamp shows none.
 */
import type { OrderRead } from "./after-port.ts";
import type { Catalogue, Id, Row } from "./port.ts";

export const STAGE_KEYS = ["received", "checked", "proofSent", "approved", "printing", "finishing", "ready"] as const;
export type StageKey = (typeof STAGE_KEYS)[number];

export interface Stage {
  key: StageKey;
  done: boolean;
  current: boolean;
  /** The stamp that lit it, or null. */
  at: string | null;
}

export interface ProofView {
  id: string;
  version: number;
  state: "sent" | "approved" | "change_asked" | "superseded";
  kind: "email" | "post";
  note: string | null;
  changeNote: string | null;
  sentAt: string | null;
  answeredAt: string | null;
  /** Its PDF is still kept: a proof whose file was deleted with the customer's data has none to open. */
  kept: boolean;
  /**
   * It was given a PDF once (`file_added_at`). A proof added on the dashboard
   * with none never had one: nothing was taken from the customer, and nothing
   * was sent them to open. A proof made before 0.2.3 holds neither stamp
   * (`recorded_at` either): those all came from the works' screens with their
   * PDF, so one with no PDF now had it erased.
   */
  filed: boolean;
}

export interface FileView {
  id: string;
  name: string;
  /** What its checks said, as the customer was shown them. */
  rows: { level: "pos" | "warn" | "danger" | "info"; text: string }[];
  accepted: boolean;
  /** The file is still kept (not deleted with the customer's data). */
  kept: boolean;
}

export interface JobView {
  id: string;
  orderId: string;
  orderNumber: string;
  name: string;
  qty: number;
  /** "350gsm silk board · 85×55mm". */
  spec: string;
  icon: string | null;
  family: string;
  stage: string;
  stages: Stage[];
  /** The latest proof, and the one waiting on the customer when it is. */
  latest: ProofView | null;
  waiting: ProofView | null;
  /** The latest proof was sent, but its file was deleted with the customer's data: nothing to open or answer. */
  gone: ProofView | null;
  /** A proof's or a file's contents were deleted with the customer's data (never a proof that had no PDF to delete). */
  forgotten: boolean;
  proofs: ProofView[];
  files: FileView[];
  readyBy: string | null;
  designCode: string | null;
  cancelled: boolean;
}

const text = (value: unknown): string | null => (value === null || value === undefined || value === "" ? null : String(value));
const same = (a: unknown, b: unknown) => a !== null && a !== undefined && b !== null && b !== undefined && String(a) === String(b);

function proofView(p: Row): ProofView {
  const state = String(p["state"] ?? "sent");
  return {
    id: String(p["id"]),
    version: Number(p["version"] ?? 1),
    state: state === "approved" || state === "change_asked" || state === "superseded" ? state : "sent",
    kind: p["kind"] === "post" ? "post" : "email",
    note: text(p["note"]),
    changeNote: text(p["change_note"]),
    sentAt: text(p["sent_at"]),
    answeredAt: text(p["answered_at"]),
    kept: text(p["file"]) !== null,
    filed: text(p["file"]) !== null || text(p["file_added_at"]) !== null || text(p["recorded_at"]) === null,
  };
}

/** The checks a file was stored with: "what we showed you", each row's level and words. */
function checksOf(value: unknown): FileView["rows"] {
  let parsed: unknown = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      return [];
    }
  }
  const rows = (parsed as { rows?: unknown } | null)?.rows;
  if (!Array.isArray(rows)) return [];
  return rows
    .map((r: { level?: unknown; text?: unknown }): FileView["rows"][number] => ({ level: r?.level === "pos" || r?.level === "warn" || r?.level === "danger" ? r.level : "info", text: typeof r?.text === "string" ? r.text : "" }))
    .filter((r) => r.text !== "");
}

/** How far along a job is, on the seven-stage strip: the index of the stage it is at. */
function reached(job: Row, latest: ProofView | null): number {
  const stage = String(job["stage"] ?? "prepress");
  if (["ready", "collected", "dispatched"].includes(stage)) return 6;
  if (stage === "finishing") return 5;
  if (stage === "printing") return 4;
  if (job["proof_state"] === "approved") return 3;
  if (latest !== null) return 2;
  if (text(job["artwork_checked_at"]) !== null) return 1;
  return 0;
}

/** The job's size as the customer chose it: its preset's, or its own width and height. */
function sizeText(catalogue: Catalogue, job: Row): string | null {
  if (job["product_kind"] === "large" || (job["width_mm"] != null && job["size_option_id"] == null)) {
    return job["width_mm"] == null || job["height_mm"] == null ? null : `${String(job["width_mm"])}×${String(job["height_mm"])}mm`;
  }
  const option = catalogue.options.find((o) => same(o.id, job["size_option_id"]));
  const preset = option === undefined ? undefined : catalogue.sizes.find((s) => same(s.id, option.sizeId));
  return preset === undefined ? (option?.name ?? null) : `${String(preset.width)}×${String(preset.height)}mm`;
}

/** "350gsm silk board · 85×55mm": the stock's short name and the size, as the works keeps them. */
export function specOf(catalogue: Catalogue, job: Row): string {
  const option = catalogue.options.find((o) => same(o.id, job["material_option_id"]));
  const material = option === undefined ? undefined : catalogue.materials.find((m) => same(m.id, option.materialId));
  return [material?.shortName ?? material?.name ?? option?.name ?? null, sizeText(catalogue, job)].filter((p): p is string => p !== null).join(" · ");
}

export function jobView(catalogue: Catalogue, order: Row, job: Row, proofs: readonly Row[], artwork: readonly Row[]): JobView {
  const own = proofs.filter((p) => same(p["job_id"], job["id"])).map(proofView).sort((a, b) => a.version - b.version);
  const latest = own.at(-1) ?? null;
  const at = reached(job, latest);
  const approved = [...own].reverse().find((p) => p.state === "approved") ?? null;
  const stamps: (string | null)[] = [
    text(order["placed_at"]),
    text(job["artwork_checked_at"]),
    latest?.sentAt ?? null,
    approved?.answeredAt ?? null,
    text(job["printing_at"]),
    text(job["finishing_at"]),
    text(job["ready_at"]),
  ];
  const product = catalogue.products.find((p) => same(p.id, job["product_id"]));
  const files = artwork
    .filter((a) => same(a["job_id"], job["id"]))
    .map((a) => ({ id: String(a["id"]), name: String(a["name"] ?? ""), rows: checksOf(a["checks"]), accepted: a["accepted"] === true || a["accepted"] === 1 || a["accepted"] === "1", kept: text(a["file"]) !== null }));
  return {
    id: String(job["id"]),
    orderId: String(order["id"]),
    orderNumber: String(order["number"] ?? ""),
    name: text(job["product_name"]) ?? product?.name ?? "",
    qty: Number(job["qty"] ?? 1),
    spec: specOf(catalogue, job),
    icon: product?.icon ?? null,
    family: product?.family ?? "other",
    stage: String(job["stage"] ?? "prepress"),
    stages: STAGE_KEYS.map((key, i) => ({ key, done: i < at, current: i === at, at: i <= at ? stamps[i]! : null })),
    latest,
    waiting: latest?.state === "sent" && latest.kept ? latest : null,
    gone: latest?.state === "sent" && !latest.kept && latest.filed ? latest : null,
    forgotten: own.some((p) => p.filed && !p.kept) || files.some((f) => !f.kept),
    proofs: own,
    files,
    readyBy: text(job["ready_by"]),
    designCode: text(job["design_code"]),
    cancelled: job["stage"] === "cancelled",
  };
}

/** Every job of an order as its page shows them, in the order the customer put them in. */
export function jobViews(catalogue: Catalogue, read: OrderRead): JobView[] {
  return [...read.jobs]
    .sort((a, b) => Number(a["position"] ?? 0) - Number(b["position"] ?? 0) || Number(a["id"]) - Number(b["id"]))
    .map((job) => jobView(catalogue, read.order, job, read.proofs, read.artwork));
}

/** How the order leaves the works, as the page says it. */
export type Leaving = "collect" | "collected" | "deliver" | "toQuote" | "quoteSent" | "quoteAccepted" | "dispatched" | "cancelled";

export function leavingOf(order: Row): Leaving {
  const status = String(order["status"] ?? "placed");
  if (status === "cancelled") return "cancelled";
  if (status === "collected") return "collected";
  if (status === "dispatched") return "dispatched";
  if (order["delivery_method"] !== "deliver") return "collect";
  const quote = order["delivery_quote_state"];
  if (quote === "sent") return "quoteSent";
  if (quote === "accepted") return "quoteAccepted";
  return Number(order["delivery_to_quote"] ?? 0) === 1 ? "toQuote" : "deliver";
}

export const idOf = (value: Id | unknown): string => String(value);
