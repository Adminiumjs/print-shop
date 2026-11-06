/**
 * The works' writes that take more than one row: a job walked along the
 * floor to a stage (each step a declared move, the proof's gate first), its
 * order made ready with its last job, a job handed over and its order with
 * it, an order dispatched with its tracking number, a proof sent in place of
 * the one before it. Each step is Adminium's move, judged by the table's
 * states; a refusal stops the walk where it stands.
 */
import type { Person, ProofFile, WorksData, WorksDoor } from "./door.ts";
import { HeldByProof } from "./env.tsx";
import { jobsOf, lockOf, openProofOf, orderOf, refOf, versionOf } from "./facts.ts";
import { same, text, type Row } from "./wire.ts";

/** The way forward along the floor, one declared move at a time. */
const FORWARD: Readonly<Record<string, string>> = {
  prepress: "printing",
  printing: "finishing",
  finishing: "ready",
};

/**
 * The stages a job passes through to reach `to` going forward; null when `to`
 * is not ahead of it. Ready is reached straight from the press (a job with no
 * finishing to do skips it), as the job's states allow.
 */
export function forwardPath(from: string, to: string): string[] | null {
  const path: string[] = [];
  let at = from;
  while (at !== to) {
    const next = FORWARD[at];
    if (next === undefined) return null;
    path.push(next);
    at = next;
  }
  return to === "ready" && from !== "finishing" ? path.filter((stage) => stage !== "finishing") : path;
}

/** Whether an order's jobs are all ready (or beyond): what lets it be handed over. */
function allAt(jobs: readonly Row[], stages: readonly string[]): boolean {
  const kept = jobs.filter((j) => j["stage"] !== "cancelled");
  return kept.length > 0 && kept.every((j) => stages.includes(String(j["stage"])));
}

/** The order's jobs with one of them as it stands now. */
const withJob = (data: WorksData, order: Row, job: Row): Row[] => jobsOf(data, order).map((j) => (same(j.id, job.id) ? job : j));

/**
 * The order made ready once its last job is: the "ready to collect" e-mail
 * goes then. Nothing when another job is still on the floor, the order has
 * moved on, or the person may not move orders.
 */
export async function readyOrderWith(door: WorksDoor, data: WorksData, job: Row, who: Person): Promise<Row | null> {
  const order = orderOf(data, job);
  if (order === undefined || order["status"] !== "placed" || !who.can("orders", "update")) return null;
  if (!allAt(withJob(data, order, job), ["ready", "collected", "dispatched"])) return null;
  return door.moveOrder(order, "ready");
}

/**
 * A job walked forward to a stage, one declared move at a time: through the
 * proof's gate first (said here before Adminium refuses it), then along the
 * floor. Its order follows it to ready. Returns the job as it stands.
 */
export async function walkJob(door: WorksDoor, data: WorksData, job: Row, to: string, who: Person): Promise<Row> {
  const path = forwardPath(String(job["stage"]), to);
  if (path === null || path.length === 0) return job;
  const lock = lockOf(job);
  if (lock !== null) throw new HeldByProof(lock, refOf(data, job));
  let at = job;
  for (const stage of path) at = await door.moveJob(at, stage);
  if (at["stage"] === "ready") await readyOrderWith(door, data, at, who);
  return at;
}

/** A job moved straight to a stage the board offers it (a step forward, or the owner's way back). */
export async function moveJobTo(door: WorksDoor, data: WorksData, job: Row, to: string, who: Person): Promise<Row> {
  const forward = forwardPath(String(job["stage"]), to);
  if (forward !== null) return walkJob(door, data, job, to, who);
  return door.moveJob(job, to);
}

/**
 * A ready job handed over the counter, and its order with its last job: the
 * order made ready first when it was not yet (so it is judged as the floor
 * left it), then collected.
 */
export async function collectJob(door: WorksDoor, data: WorksData, job: Row, who: Person): Promise<Row> {
  const done = await door.moveJob(job, "collected");
  const order = orderOf(data, job);
  if (order === undefined || !who.can("orders", "update")) return done;
  if (!allAt(withJob(data, order, done), ["collected"])) return done;
  let at = order;
  if (at["status"] === "placed") at = await door.moveOrder(at, "ready");
  if (at["status"] === "ready") at = await door.moveOrder(at, "collected");
  return done;
}

/**
 * A delivery order sent out: each ready job dispatched, then the order with
 * the carrier's tracking number and the service it went by. The order is
 * made ready first when it was not yet.
 */
export async function dispatchOrder(door: WorksDoor, data: WorksData, order: Row, input: { tracking: string | null; service: string | null }): Promise<Row> {
  for (const job of jobsOf(data, order)) if (job["stage"] === "ready") await door.moveJob(job, "dispatched");
  let at = order;
  if (at["status"] === "placed") at = await door.moveOrder(at, "ready");
  const values: Record<string, unknown> = {};
  if (input.tracking !== null) values["tracking"] = input.tracking;
  if (input.service !== null) values["dhl_service"] = input.service;
  return door.moveOrder(at, "dispatched", values);
}

/**
 * A proof of a job sent: the one still open before it (waiting, or the
 * change it answers) superseded first, then the new one with its PDF and,
 * for a job made in the Customiser, the version it shows. A first proof also
 * says the artwork was looked over.
 */
export async function sendProof(door: WorksDoor, data: WorksData, job: Row, input: { file: ProofFile; kind: "email" | "post"; note: string | null }, who: Person): Promise<Row> {
  const order = orderOf(data, job);
  if (order === undefined) throw new Error("This job has no order.");
  const open = openProofOf(data, job);
  if (open !== undefined) await door.supersede(open);
  const version = job["design_id"] === null || job["design_id"] === undefined ? undefined : versionOf(data, job);
  const sent = await door.sendProof({ job, kind: input.kind, file: input.file, designVersionId: version?.id ?? null, note: input.note });
  if (job["artwork_checked"] !== true && who.can("jobs", "update")) await door.updateJob(job, { artwork_checked: true });
  return sent;
}

/** A delivery the bands cannot price, priced by the works and sent to the customer to accept. */
export function sendDeliveryQuote(door: WorksDoor, order: Row, amount: number): Promise<Row> {
  return door.updateOrder(order, { delivery_quote: amount, delivery_quote_state: "sent" });
}

/** A typed amount of money, read as the reader may type it: "32.80", "32,80". Null when it is not one. */
export function typedAmount(raw: string): number | null {
  const value = raw.replace(",", ".").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
  return Number(value);
}

/** The customer's name on an order, for a toast. */
export const customerOf = (order: Row | undefined): string => text(order?.["name"]) ?? "";
