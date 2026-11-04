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
}

export const PARTS: Part[] = [
  { column: "setup_cost", label: "shop.quote.part.setup", lever: false },
  { column: "print_cost", label: "shop.quote.part.print", lever: true },
  { column: "material_cost", label: "shop.quote.part.material", lever: true },
  { column: "lamination_cost", label: { finish: "lamination" }, lever: true },
  { column: "spot_uv_cost", label: { finish: "spot_uv" }, lever: true },
  { column: "corners_cost", label: { finish: "corners" }, lever: true },
  { column: "edges_cost", label: { finish: "edges" }, lever: true },
  { column: "canvas_cost", label: { finish: "canvas" }, lever: true },
  { column: "minimum_cost", label: "shop.quote.part.minimum", lever: false },
  { column: "packaging_cost", label: "shop.quote.part.packaging", lever: true },
  { column: "proof_cost", label: "shop.quote.part.proof", lever: true },
  { column: "express_cost", label: "shop.quote.part.express", lever: true },
  { column: "cap_saving", label: "shop.quote.part.cap", lever: false },
];

/** The job's price a piece, as the rate card works it out. */
export const EACH = "each";
/** The quantity the job is capped at the price of, when the next break would cost no more. */
export const CAPPED_AT = "cap_qty";
/** The job's area, for a large-format job. */
export const AREA = "area_m2";

/** A figure the answer carries: its decimal text, or null when the row has none. */
export function figure(row: Row | null | undefined, column: string): string | null {
  const value = row?.[column];
  return value === null || value === undefined || value === "" ? null : String(value);
}

/** The parts of a job's price its answer carries, in the panel's order. */
export function partsOf(job: Row | null | undefined): { part: Part; amount: string }[] {
  return PARTS.map((part) => ({ part, amount: figure(job, part.column) })).filter((p): p is { part: Part; amount: string } => p.amount !== null);
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
 * weight falls in and that band's price, or none — over the top band, the
 * works quotes it by hand.
 */
export function deliveryOf(order: Row | null | undefined, bands: readonly Band[]): { band: Band | null; price: string | null; toQuote: boolean; weight: string | null } {
  const id = order?.["delivery_band_id"];
  const band = id === null || id === undefined ? null : (bands.find((b) => String(b.id) === String(id)) ?? null);
  const weight = figure(order, "weight_kg");
  // The band's price is the rate card's row; the order's own `band_price` is not among what it answers.
  return { band, price: figure(order, "band_price") ?? band?.price ?? null, toQuote: order !== null && order !== undefined && band === null && weight !== null, weight };
}

/** The top of the weight bands, in kilograms: over it, delivery is quoted by hand. */
export function topBand(bands: readonly Band[]): string | null {
  const tops = bands.filter((b) => !b.tube && b.maxKg !== null).map((b) => Number(b.maxKg));
  return tops.length === 0 ? null : String(Math.max(...tops));
}
