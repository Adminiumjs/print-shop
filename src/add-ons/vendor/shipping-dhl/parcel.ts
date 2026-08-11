/*
 * VENDORED from add-ons/packages/shipping-dhl/src/parcel.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `shipping-dhl`; its manifest, tests and README live in the monorepo.
 */
/**
 * THE PARCEL, worked out from what the shop says is in it.
 *
 * ── WHAT THIS USED TO BE, AND WHY IT COULD NOT TRAVEL ───────────────────────
 *
 * A copy of one print works' arithmetic. It held that shop's paper grammages by
 * material key, its SRA3 press-sheet area, its size presets by name and its
 * three packaging kinds, and it computed a weight by imposing the run onto
 * sheets. Every one of those tables was a guess about the host, and in any
 * other shop every guess missed: a maker studio has no grammage, no press
 * sheet, and a `packagingKey` of `boxed` nowhere in its records. The engine
 * would not have thrown — it would have quietly returned the fallback for
 * everything, which is worse, because a wrong weight on a dispatch screen is
 * indistinguishable from a right one until the depot re-weighs the box.
 *
 * ── THE DIVISION NOW, AND IT IS THE HONEST ONE ──────────────────────────────
 *
 *   THE SHOP says what ONE of a thing weighs and how big it is. That is a fact
 *   about its own goods, it is the only party that has it, and both hosts do:
 *   the print works divides a run's paper weight by the run, the maker studio
 *   knows a walnut coaster is 60 g.
 *
 *   THE CARRIER says what a PARCEL weighs. Goods plus wrap plus the box, in a
 *   box big enough for what is in it. That is a fact about carriage, and it is
 *   the only party that has THAT.
 *
 * Neither can do the other's half, and the seam between them is a number in
 * grams rather than a table of one shop's materials.
 *
 * ── AND WHEN THE SHOP DOES NOT KNOW ─────────────────────────────────────────
 *
 * `unitWeightGrams` is optional in the slot payload, because a host that sells
 * appointments is not a broken host. So this engine assumes a figure, RECORDS
 * WHICH LINES IT ASSUMED FOR, and the dispatch screen prints that list beside
 * the weight field the works can type over. An estimate the reader cannot tell
 * from a measurement is the one thing this module must never produce.
 */

import type { CatalogueSample, SlotItem } from "../host/index.ts";

/** Box, tape and void fill, in kilograms, before anything goes in. */
const PACKING_KG = 0.25;

/** Wrap and paper around the goods, as a fraction of what they weigh. */
const WRAP = 0.08;

/** No carrier quotes a parcel lighter than this, whatever is in it. */
const FLOOR_KG = 0.1;

/**
 * What one of a thing is taken to weigh when the shop has not said.
 *
 * Deliberately unremarkable — a quarter of a kilo is a small parcelled object —
 * and deliberately visible: every estimate that uses it names the lines it was
 * used for, so the number is a starting point the works corrects rather than an
 * answer the screen pretends to.
 */
export const ASSUMED_UNIT_GRAMS = 250;

/**
 * Anything with a side this long or longer travels rolled rather than flat.
 *
 * A property of the GOODS, not of a product key: a two-metre banner and a
 * two-metre roll of vinyl are the same problem for a van, and neither is
 * something a carrier should try to put in a 34 cm box.
 */
const ROLLED_FROM_CM = 60;

/** Boxes, smallest first. The first one that holds the weight wins. */
const BOXES: readonly { maxKg: number; lengthCm: number; widthCm: number; heightCm: number }[] = [
  { maxKg: 1, lengthCm: 32, widthCm: 24, heightCm: 8 },
  { maxKg: 3, lengthCm: 34, widthCm: 26, heightCm: 12 },
  { maxKg: 8, lengthCm: 40, widthCm: 30, heightCm: 18 },
  { maxKg: Number.POSITIVE_INFINITY, lengthCm: 50, widthCm: 40, heightCm: 26 },
];

/** Packing around the goods, per side, in centimetres. */
const CLEARANCE_CM = 4;

export interface ParcelEstimate {
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  /** The numbers the "where did this come from" notes are written from. */
  from: {
    /** How many things are in the box, across every line. */
    quantity: number;
    /** How many distinct lines. */
    lines: number;
    /** The first line's name, already translated by the host. */
    label: string;
    /** What one of them weighs, rounded to a tenth of a gram. */
    unitGrams: number;
    /**
     * The lines the shop gave no weight for, by their own labels. EMPTY is the
     * ordinary case and is what lets the screen say nothing; non-empty is what
     * the screen must say out loud.
     */
    assumed: readonly string[];
    /** True when the goods are too long for a box and travel in a tube. */
    rolled: boolean;
  };
}

/** Round to one decimal — a kilogram to the gram is false precision on a parcel. */
function kg(value: number): number {
  return Math.round(value * 10) / 10;
}

/** What the payload calls a weighable thing. Samples and lines are both. */
type Weighable = Pick<SlotItem, "label" | "quantity" | "unitWeightGrams" | "unitSize">;

/** The longest side of one item, in centimetres, or 0 where the host said nothing. */
function longestSideCm(item: Weighable): number {
  const size = item.unitSize;
  if (size === undefined) return 0;
  return Math.max(size.widthMm, size.heightMm, size.depthMm ?? 0) / 10;
}

/**
 * ONE PARCEL FOR A WHOLE LIST OF THINGS.
 *
 * A basket of three lines goes in ONE box, so the weights add and the box is
 * sized for the total — never the sum of three boxes, which is how a checkout
 * quotes a customer for a parcel nobody is going to send.
 *
 * The same function serves a single order line, a whole order and a whole
 * basket, because from a van's point of view those are the same question.
 */
export function parcelFor(items: readonly Weighable[]): ParcelEstimate {
  const assumed: string[] = [];
  let goodsGrams = 0;
  let quantity = 0;

  for (const item of items) {
    const grams = item.unitWeightGrams;
    if (grams === undefined) assumed.push(item.label);
    goodsGrams += (grams ?? ASSUMED_UNIT_GRAMS) * item.quantity;
    quantity += item.quantity;
  }

  const weightKg = Math.max(kg((goodsGrams / 1000) * (1 + WRAP) + PACKING_KG), FLOOR_KG);
  const longest = items.reduce((max, item) => Math.max(max, longestSideCm(item)), 0);
  const rolled = longest >= ROLLED_FROM_CM;

  const box = rolled
    ? // A tube: as long as the longest piece plus a hand's width, and round.
      { lengthCm: Math.ceil(longest) + 5, widthCm: 16, heightCm: 16 }
    : fitBox(weightKg, items);

  const first = items[0];
  return {
    weightKg,
    ...box,
    from: {
      quantity,
      lines: items.length,
      label: first?.label ?? "",
      unitGrams: quantity === 0 ? 0 : Math.round((goodsGrams / quantity) * 10) / 10,
      assumed,
      rolled,
    },
  };
}

/**
 * The smallest box that holds the weight, grown if something in it is wider
 * than that box.
 *
 * Both halves matter. A heavy small parcel needs a strong box rather than a big
 * one; a light awkward one — a single large print — needs a big box rather than
 * a strong one. Sizing on weight alone gave a 40 cm sheet a 32 cm box.
 */
function fitBox(
  weightKg: number,
  items: readonly Weighable[],
): { lengthCm: number; widthCm: number; heightCm: number } {
  const base = BOXES.find((b) => weightKg <= b.maxKg) ?? BOXES[BOXES.length - 1]!;

  let longest = 0;
  let shortest = 0;
  for (const item of items) {
    const size = item.unitSize;
    if (size === undefined) continue;
    longest = Math.max(longest, Math.max(size.widthMm, size.heightMm) / 10);
    shortest = Math.max(shortest, Math.min(size.widthMm, size.heightMm) / 10);
  }

  return {
    lengthCm: Math.max(base.lengthCm, Math.ceil(longest + CLEARANCE_CM)),
    widthCm: Math.max(base.widthCm, Math.ceil(shortest + CLEARANCE_CM)),
    heightCm: base.heightCm,
  };
}

/**
 * What one representative record from the shop's catalogue would weigh as a
 * parcel — the settings panel's table.
 *
 * A `CatalogueSample` is a `SlotItem` without an id or a note, so the same
 * engine answers, which is the property that matters: the number a shop owner
 * reads in the settings form and the number the dispatch screen quotes come
 * from ONE piece of arithmetic. A second table here that disagreed with the
 * first would be worse than no table at all.
 */
export function parcelForSample(sample: CatalogueSample): ParcelEstimate {
  return parcelFor([sample]);
}
