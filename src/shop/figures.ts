/**
 * Which of a job's own figures the quote panel shows, and under what name.
 *
 * The job's price is the rate card's: calculated columns on the job row work
 * it out, and a dry run of the order answers each of them. The panel lists
 * the ones the answer carries, in this order, and leaves out the rest; it
 * adds nothing up. `price` is the job's whole price ex tax (the column every
 * order total reads); the others are its parts.
 *
 * The parts' column names are this page's contract with the rate card's
 * columns: a part the answer does not carry is simply not listed, so the
 * panel stays right while the columns are being written.
 */
import type { MessageKey } from "../i18n/index.tsx";
import type { Band, Row } from "./port.ts";

export interface Part {
  /** The job's column. */
  column: string;
  /** Its row's name, or, for a finish, the option's own name (`finish`). */
  label: MessageKey | { finish: "lamination" | "spot_uv" | "corners" | "edges" | "canvas" };
  /** What a row of this kind counts toward in "What moves this price". */
  lever: boolean;
  /** Whether the job takes this line: a finish it chose, its packing, a proof by post, express, a cap. */
  shown: (amount: string, job: Row) => boolean;
}

const yes = (value: unknown): boolean => value === true || value === 1 || value === "1" || value === "true";
const always = () => true;
const nonZero = (amount: string) => Number(amount) !== 0;

export const PARTS: Part[] = [
  { column: "setup", label: "shop.quote.part.setup", lever: false, shown: always },
  { column: "print_charge", label: "shop.quote.part.print", lever: true, shown: always },
  { column: "material_charge", label: "shop.quote.part.material", lever: true, shown: always },
  { column: "lamination_charge", label: { finish: "lamination" }, lever: true, shown: nonZero },
  { column: "spot_uv_charge", label: { finish: "spot_uv" }, lever: true, shown: nonZero },
  { column: "corners_charge", label: { finish: "corners" }, lever: true, shown: nonZero },
  { column: "edges_charge", label: { finish: "edges" }, lever: true, shown: nonZero },
  { column: "canvas_charge", label: { finish: "canvas" }, lever: true, shown: nonZero },
  { column: "minimum_charge", label: "shop.quote.part.minimum", lever: false, shown: (amount) => Number(amount) > 0 },
  // The design's priced features (printing its back), one price a job: shown when they add something.
  { column: "features_charge", label: "shop.quote.part.features", lever: true, shown: (amount) => Number(amount) > 0 },
  { column: "packaging_charge", label: "shop.quote.part.packaging", lever: true, shown: (_, job) => job["packaging_id"] !== null && job["packaging_id"] !== undefined },
  { column: "proof_charge", label: "shop.quote.part.proof", lever: true, shown: (_, job) => yes(job["proof_by_post"]) },
  { column: "express_charge", label: "shop.quote.part.express", lever: true, shown: (_, job) => yes(job["express"]) },
  // Negative when the next break would cost no less: the difference comes off.
  { column: "cap_charge", label: "shop.quote.part.cap", lever: false, shown: (amount) => Number(amount) < 0 },
];

/** The job's price a piece, ex tax, as the rate card works it out (`price` over `qty`, rounded by Adminium). */
export const EACH = "each";
/** The next quantity break: what a capped job costs the same as. */
export const NEXT_QTY = "next_qty";
/** The line a capped job's price is held down by. */
export const CAP = "cap_charge";
/** A large-format piece's area, in square metres. */
export const AREA = "area_each";

/** A figure the answer carries: its decimal text, or null when the row has none. */
export function figure(row: Row | null | undefined, column: string): string | null {
  const value = row?.[column];
  return value === null || value === undefined || value === "" ? null : String(value);
}

/** The quantity a job is capped at the price of (999 flyers cost what 1000 do), or null when it is not capped. */
export function cappedAt(job: Row | null | undefined): string | null {
  const cap = figure(job, CAP);
  return cap !== null && Number(cap) < 0 ? figure(job, NEXT_QTY) : null;
}

/** The parts of a job's price its answer carries and the job takes, in the panel's order. */
export function partsOf(job: Row | null | undefined): { part: Part; amount: string }[] {
  if (job === null || job === undefined) return [];
  return PARTS.map((part) => ({ part, amount: figure(job, part.column) })).filter((p): p is { part: Part; amount: string } => p.amount !== null && p.part.shown(p.amount, job));
}

/**
 * The three parts that move the price most, biggest first: the answer's own
 * figures, compared and never added.
 */
export function levers(job: Row | null | undefined): Part[] {
  return partsOf(job)
    .filter((p) => p.part.lever && Number(p.amount) > 0)
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, 3)
    .map((p) => p.part);
}

/**
 * The delivery an order comes to, as its answer says it: the band its
 * weight falls in, the order's own `delivery`, and whether the works quotes
 * it by hand (`delivery_to_quote`: delivered, and over every band).
 */
export function deliveryOf(
  order: Row | null | undefined,
  bands: readonly Band[],
): { band: Band | null; price: string | null; offered: string | null; toQuote: boolean; weight: string | null } {
  const id = order?.["delivery_band_id"];
  const band = id === null || id === undefined ? null : (bands.find((b) => String(b.id) === String(id)) ?? null);
  const price = figure(order, "delivery");
  // What delivering costs, picked or not: the order's own delivery once picked, else its band's price (a collected order's delivery is nothing).
  const delivering = order?.["delivery_method"] === "deliver";
  const offered = delivering ? price : (band?.price ?? null);
  const weight = figure(order, "weight_kg");
  // Over the top band delivery is quoted by hand: Adminium says so of a delivered order, and a collected one has a weight but no band.
  const toQuote = Number(order?.["delivery_to_quote"] ?? 0) === 1 || (!delivering && band === null && weight !== null && Number(weight) > 0);
  return { band, price, offered, toQuote, weight };
}

/** The top of the weight bands, in kilograms: over it, delivery is quoted by hand. */
export function topBand(bands: readonly Band[]): string | null {
  const tops = bands.filter((b) => !b.tube && b.maxKg !== null).map((b) => Number(b.maxKg));
  return tops.length === 0 ? null : String(Math.max(...tops));
}
