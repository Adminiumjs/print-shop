/**
 * A job's price, as Adminium worked it out. The browser never prices a job:
 * the works' rate card is in Adminium, and every figure here is one of its
 * answers.
 *
 * These screens show the prices Adminium gave for the configurations they
 * open on (`data/price-book.json`): every product as it starts, at each of
 * its quantities and with each of its choices changed once, the reorders and
 * the saved quotes, each a dry run of a customer's order holding that one
 * line, recorded and held to Adminium's answer by the price-book contract
 * (`src/contract/price-book.test.ts`). A configuration Adminium has not
 * priced has no price here (`null`): the screen says the works will quote it.
 */
import BOOK from "../data/price-book.json" with { type: "json" };
import { checkCustomSize, resolveSize, type Configuration, type ResolvedSize, type SizeViolation } from "./quote.ts";

export type QuoteLineKey = "setup" | "print" | "material" | "finishing" | "packaging" | "proof" | "express" | "minimum" | "cap" | "delivery";

export interface QuoteLine {
  key: QuoteLineKey;
  amountCents: number;
  /** Numbers the mono sub-label renders, e.g. `{ sheets: 24, rate: 120 }`. */
  detail: Record<string, number | string>;
}

/** What Adminium answered for a configuration, in pence, as the quote panel lays it out. */
export interface PricedLine {
  lines: QuoteLine[];
  /** Sum of the lines, ex tax: the job and its delivery. */
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  /** The total a piece, as Adminium's total over the quantity, to the penny. */
  unitCents: number;
  sheets: number;
  up: number;
  weightKg: number;
  /** The quantity break's multiplier, 1 with none. */
  multiplier: number;
  /** Over the delivery bands: the works quotes the delivery. */
  deliveryToQuote: boolean;
}

export interface Quote extends PricedLine {
  size: ResolvedSize;
  rotated: boolean;
  /** A custom size outside the limits has no price, and says which limit. */
  blocked: SizeViolation[];
}

/** A configuration, as the book keys it: every choice, in one order; a delivery is a delivery whatever band it was set to. */
export function bookKey(config: Configuration): string {
  return [
    config.product,
    config.material,
    config.size,
    config.size === "custom" ? `${String(config.customWidthMm ?? 0)}x${String(config.customHeightMm ?? 0)}` : "",
    String(config.sides),
    config.finish,
    String(config.quantity),
    config.packaging,
    config.printedProof ? "proof" : "",
    config.express ? "express" : "",
    config.delivery === "collection" ? "collect" : "deliver",
  ].join("|");
}

const PRICES = BOOK as unknown as Record<string, PricedLine>;

/**
 * Adminium's price of a configuration, or null when it has none here. A
 * custom size outside the limits is blocked, with the limit it broke, and
 * carries no price.
 */
export function priced(config: Configuration): Quote | null {
  if (config.size === "custom") {
    const check = checkCustomSize(config.customWidthMm ?? 0, config.customHeightMm ?? 0, { stretched: config.finish === "stretched" });
    if (!check.ok) {
      return { lines: [], subtotalCents: 0, taxCents: 0, totalCents: 0, unitCents: 0, sheets: 0, up: 0, weightKg: 0, multiplier: 1, deliveryToQuote: false, size: check.size, rotated: false, blocked: check.violations };
    }
  }
  const found = PRICES[bookKey(config)];
  if (found === undefined) return null;
  return { ...found, size: resolveSize(config), rotated: false, blocked: [] };
}

/** The three biggest lines of a price, largest first, with their share of it: "What moves this price". */
export function priceLevers(quote: PricedLine): { key: QuoteLineKey; sharePct: number }[] {
  if (quote.subtotalCents === 0) return [];
  return [...quote.lines]
    .filter((l) => l.amountCents > 0)
    .sort((a, b) => b.amountCents - a.amountCents)
    .slice(0, 3)
    .map((l) => ({ key: l.key, sharePct: Math.round((l.amountCents / quote.subtotalCents) * 100) }));
}
