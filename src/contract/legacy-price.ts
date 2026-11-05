/**
 * The browser's price code as the app shipped it before Adminium priced the
 * work (`src/lib/rates.ts`, `quote.ts` `priceQuote`, `jobs.ts` `imposition`),
 * kept here frozen, for the parity check alone: nothing that ships imports it.
 *
 * With no fixes it is that code, figure for figure (amounts in whole pence,
 * worked in floating point). Each fix is one difference between it and
 * Adminium's price, named: the four slips the plan found in it, and the
 * places it had drifted from the works' own rate card and the comp. With
 * every fix on, it must come to Adminium's figures to the penny, so every
 * difference between the old price and the new one is one of these.
 */

// ── the fixes ───────────────────────────────────────────────────────────────

/**
 * Each fix is where Adminium's price differs from the old code's, and why.
 * The first four are the known slips of the old price (the next break, and
 * the delivery over the bands among them).
 */
export const FIXES = {
  /** Slip 1. A roll stock on a sheet product (vinyl stickers) was charged its square-metre rate for every press sheet. */
  vinylBySheetArea: "a roll stock on the sheet press costs the area a sheet prints, not a square metre a sheet",
  /** Slip 2. 999 flyers cost more than 1000: the break was picked at or below, with no cap. */
  neverDearerThanNextBreak: "a line never costs more than the next break's quantity would",
  /** Slip 3. Over 30 kg was charged the 30 kg band. */
  over30kgQuotedByHand: "an order over the top band has no delivery price: the works quotes it",
  /** Slip 4. Gloss lamination was always one side and matt always two (soft-touch on one side too). */
  laminationBySides: "a lamination is priced by the sides it covers, the look at the same price",
  /** The works' own up-count for a size (the rate card's `sizes.up`), where the old code worked one out with its own bleed and margin. */
  upFromTheSize: "a size prints as many up as the rate card says",
  /** What a parcel weighs: the finished pieces and the packing, a canvas's frame; not the press sheets plus 8 % (and vinyl at its 300 gsm, not nothing). */
  weightAsPosted: "the weight is the finished pieces, the frames and the packing",
  /** Every large-format job went in a tube, a stretched canvas and a 3 m banner too. */
  tubeOnlyWhenItRolls: "the tube only for large format that rolls: not on a frame, no longer than the tube",
  /** Areas and edges are counted to the hundredth of a square metre and of a metre, as the comp counts them; a run's area once, over the whole run. */
  areaToTheHundredth: "areas and edges to the hundredth, a run's area rounded once",
  /** The large-format minimum tops up the roll's work (stock and finishing), not the setup and the proof as well. */
  minimumOnTheRollWork: "the large-format minimum is on the work of the roll alone",
  /** Pennies counted exactly: the browser rounded floating-point pence, which can fall a hair under a half. */
  exactPennies: "every amount rounded exactly, half away from zero",
} as const;
export type Fix = keyof typeof FIXES;
export const ALL_FIXES: ReadonlySet<Fix> = new Set(Object.keys(FIXES) as Fix[]);
export const SLIPS: readonly Fix[] = ["vinylBySheetArea", "neverDearerThanNextBreak", "over30kgQuotedByHand", "laminationBySides"];

// ── the rate card (rates.ts) ────────────────────────────────────────────────

export const TAX_RATE = 0.2;
export const BLEED_MM = 3;
export const SRA3_PRINTABLE = { widthMm: 310, heightMm: 440 } as const;
export const SETUP_CENTS = 1800;
export const PRINT_PER_SHEET_CENTS = { 1: 85, 2: 120 } as const;

export type MaterialKey = "silk-350" | "uncoated-300" | "silk-170" | "silk-130" | "pvc-510" | "mesh-270" | "canvas-380" | "vinyl";
interface Material {
  key: MaterialKey;
  kind: "sheet" | "roll";
  rateCents: number;
  gsm: number;
}
export const MATERIALS: readonly Material[] = [
  { key: "silk-350", kind: "sheet", rateCents: 42, gsm: 350 },
  { key: "uncoated-300", kind: "sheet", rateCents: 38, gsm: 300 },
  { key: "silk-170", kind: "sheet", rateCents: 14, gsm: 170 },
  { key: "silk-130", kind: "sheet", rateCents: 11, gsm: 130 },
  { key: "pvc-510", kind: "roll", rateCents: 2800, gsm: 510 },
  { key: "mesh-270", kind: "roll", rateCents: 3200, gsm: 270 },
  { key: "canvas-380", kind: "roll", rateCents: 4600, gsm: 380 },
  // The old card weighed vinyl at 0 gsm; the works' rate card (and Adminium) at 300.
  { key: "vinyl", kind: "roll", rateCents: 3400, gsm: 0 },
];
const MATERIAL_BY_KEY = Object.fromEntries(MATERIALS.map((m) => [m.key, m])) as Record<MaterialKey, Material>;
/** The works' rate card weighs its vinyl. */
const RATE_CARD_GSM: Partial<Record<MaterialKey, number>> = { vinyl: 300 };

export type FinishKey = "none" | "gloss-lam" | "matt-lam" | "soft-touch" | "spot-uv" | "round-corners" | "hemmed" | "pole-pockets" | "plain-edges" | "stretched" | "rolled";
interface Finish {
  key: FinishKey;
  basis: "per-sheet" | "per-250-units" | "per-linear-m" | "per-each" | "per-sqm" | "none";
  rateCents: number;
  sides?: 1 | 2;
}
const FINISHES: readonly Finish[] = [
  { key: "none", basis: "none", rateCents: 0 },
  { key: "gloss-lam", basis: "per-sheet", rateCents: 55, sides: 1 },
  { key: "matt-lam", basis: "per-sheet", rateCents: 95, sides: 2 },
  { key: "soft-touch", basis: "per-sheet", rateCents: 120, sides: 2 },
  { key: "spot-uv", basis: "per-sheet", rateCents: 240 },
  { key: "round-corners", basis: "per-250-units", rateCents: 600 },
  { key: "plain-edges", basis: "none", rateCents: 0 },
  { key: "hemmed", basis: "per-linear-m", rateCents: 600 },
  { key: "pole-pockets", basis: "per-each", rateCents: 900 },
  { key: "stretched", basis: "per-sqm", rateCents: 2200 },
  { key: "rolled", basis: "none", rateCents: 0 },
];
const FINISH_BY_KEY = Object.fromEntries(FINISHES.map((f) => [f.key, f])) as Record<FinishKey, Finish>;
const LAMINATION_ONE_SIDE_CENTS = 55;
/** The works' rate card: lamination by the sides it covers (one, both, soft-touch). */
const LAMINATION_BY_SIDES_CENTS = { one: 55, both: 95, soft: 120 } as const;

const QUANTITY_BREAKS = [
  { quantity: 25, multiplier: 1.0 },
  { quantity: 50, multiplier: 0.92 },
  { quantity: 100, multiplier: 0.84 },
  { quantity: 250, multiplier: 0.74 },
  { quantity: 500, multiplier: 0.66 },
  { quantity: 1000, multiplier: 0.58 },
] as const;
function breakFor(quantity: number) {
  let chosen: (typeof QUANTITY_BREAKS)[number] = QUANTITY_BREAKS[0];
  for (const step of QUANTITY_BREAKS) if (quantity >= step.quantity) chosen = step;
  return chosen;
}
const nextBreak = (quantity: number) => QUANTITY_BREAKS.find((step) => step.quantity > quantity) ?? null;

const LARGE_FORMAT_MINIMUM_CENTS = 3500;

export type PackagingKey = "bundled" | "shrink-wrapped" | "boxed";
const PACKAGING: Record<PackagingKey, { basis: "included" | "per-unit" | "per-500"; rateCents: number }> = {
  bundled: { basis: "included", rateCents: 0 },
  "shrink-wrapped": { basis: "per-unit", rateCents: 4 },
  boxed: { basis: "per-500", rateCents: 450 },
};

const PROOF_BY_POST_CENTS = 1200;
const EXPRESS_UPLIFT = 0.35;

type DeliveryKey = "collection" | "band-2kg" | "band-10kg" | "band-30kg" | "tube";
const DELIVERY_BANDS: readonly { key: DeliveryKey; maxKg: number | null; rateCents: number }[] = [
  { key: "collection", maxKg: null, rateCents: 0 },
  { key: "band-2kg", maxKg: 2, rateCents: 650 },
  { key: "band-10kg", maxKg: 10, rateCents: 980 },
  { key: "band-30kg", maxKg: 30, rateCents: 1640 },
  { key: "tube", maxKg: null, rateCents: 1400 },
];
const DELIVERY_BY_KEY = Object.fromEntries(DELIVERY_BANDS.map((d) => [d.key, d])) as Record<DeliveryKey, (typeof DELIVERY_BANDS)[number]>;
const SRA3_AREA_SQM = 0.32 * 0.45;

// ── the catalogue (catalogue.ts) ────────────────────────────────────────────

export const PRESET_SIZES = {
  "business-card": { widthMm: 85, heightMm: 55 },
  a6: { widthMm: 105, heightMm: 148 },
  a5: { widthMm: 148, heightMm: 210 },
  a4: { widthMm: 210, heightMm: 297 },
  a3: { widthMm: 297, heightMm: 420 },
  dl: { widthMm: 210, heightMm: 99 },
  "us-letter": { widthMm: 216, heightMm: 279 },
  "dl-envelope": { widthMm: 220, heightMm: 110 },
  c5: { widthMm: 229, heightMm: 162 },
} as const;
export type SizeKey = keyof typeof PRESET_SIZES;
/** The works' rate card: how many of each size print up on a press sheet (`sizes.up`). */
const RATE_CARD_UP: Record<SizeKey, number> = { "business-card": 21, a6: 8, a5: 4, a4: 2, a3: 1, dl: 6, "us-letter": 2, "dl-envelope": 4, c5: 4 };

export type ProductKey = "business-cards" | "folded-cards" | "flyers" | "letterheads" | "comp-slips" | "envelopes" | "stickers" | "posters" | "roll-up-banners" | "pvc-banners" | "canvas";
const LARGE_FORMAT: readonly ProductKey[] = ["roll-up-banners", "pvc-banners", "canvas"];

// ── imposition (jobs.ts) ────────────────────────────────────────────────────

function imposition(trimWidthMm: number, trimHeightMm: number, quantity: number): { up: number; sheets: number } {
  const w = trimWidthMm + BLEED_MM * 2;
  const h = trimHeightMm + BLEED_MM * 2;
  const fit = (pw: number, ph: number) => Math.floor(SRA3_PRINTABLE.widthMm / pw) * Math.floor(SRA3_PRINTABLE.heightMm / ph);
  const up = Math.max(fit(w, h), fit(h, w));
  if (up === 0) return { up: 0, sheets: 0 };
  return { up, sheets: Math.ceil(quantity / up) };
}

// ── the configuration and its price (quote.ts) ──────────────────────────────

export interface Configuration {
  product: ProductKey;
  material: MaterialKey;
  /** A preset key, or `custom` with the millimetres below. */
  size: SizeKey | "custom";
  customWidthMm?: number;
  customHeightMm?: number;
  sides: 1 | 2;
  /**
   * The finishes. The old configurator took one; a job with a lamination
   * and a spot UV (or round corners) is priced as the old code priced each,
   * added up.
   */
  finishes: FinishKey[];
  quantity: number;
  packaging: PackagingKey;
  printedProof: boolean;
  express: boolean;
  delivery: "collection" | "deliver";
}

export interface LegacyQuote {
  /** The line's work, ex tax and without its delivery, in pence. */
  workCents: number;
  weightKg: number;
  /** Delivery in pence; null when the works quotes it by hand. */
  deliveryCents: number | null;
  taxCents: number;
  totalCents: number;
  /** The line of the old breakdown each amount sat on, for a failure to show. */
  lines: { key: string; amountCents: number }[];
}

/**
 * Price a configuration as the old browser did, with the fixes named in
 * `fixes` put right.
 */
export function legacyQuote(config: Configuration, fixes: ReadonlySet<Fix> = new Set()): LegacyQuote {
  const on = (fix: Fix) => fixes.has(fix);
  // Rounding a pence figure: the browser's own, or exactly (half away from zero) once the float's noise is gone.
  const cents = (n: number): number => (on("exactPennies") ? Math.round(Number(n.toPrecision(12))) : Math.round(n));
  const hundredth = (n: number): number => (on("areaToTheHundredth") ? Math.round(Number((n * 100).toPrecision(12))) / 100 : n);

  const large = LARGE_FORMAT.includes(config.product);
  const material = MATERIAL_BY_KEY[config.material];
  const widthMm = config.size === "custom" ? config.customWidthMm! : PRESET_SIZES[config.size].widthMm;
  const heightMm = config.size === "custom" ? config.customHeightMm! : PRESET_SIZES[config.size].heightMm;
  const areaEach = hundredth((widthMm / 1000) * (heightMm / 1000));
  // The run's area from its own size, rounded once: never a piece's rounded area times the run.
  const areaTotal = on("areaToTheHundredth") ? hundredth((widthMm * heightMm * config.quantity) / 1e6) : areaEach * config.quantity;

  const sheetsAt = (quantity: number): number => {
    if (config.size === "custom") return 0;
    if (on("upFromTheSize")) return Math.ceil(quantity / RATE_CARD_UP[config.size]);
    return imposition(widthMm, heightMm, quantity).sheets;
  };

  const finishCents = (key: FinishKey, sheets: number, quantity: number): { key: string; amountCents: number } => {
    const finish = FINISH_BY_KEY[key];
    switch (finish.basis) {
      case "none":
        return { key, amountCents: 0 };
      case "per-sheet": {
        let rate = finish.rateCents;
        if (finish.sides !== undefined) {
          // The old split: matt and soft-touch fell to the one-side rate on a one-sided job; gloss was always one side.
          if (on("laminationBySides")) rate = key === "soft-touch" ? LAMINATION_BY_SIDES_CENTS.soft : config.sides === 2 ? LAMINATION_BY_SIDES_CENTS.both : LAMINATION_BY_SIDES_CENTS.one;
          else if (finish.sides === 2 && config.sides === 1) rate = LAMINATION_ONE_SIDE_CENTS;
        }
        return { key, amountCents: cents(sheets * rate) };
      }
      case "per-250-units":
        return { key, amountCents: cents(Math.ceil(quantity / 250) * finish.rateCents) };
      case "per-linear-m": {
        const perimeterM = hundredth(((widthMm + heightMm) * 2) / 1000);
        return { key, amountCents: cents(perimeterM * finish.rateCents * quantity) };
      }
      case "per-each":
        return { key, amountCents: cents(2 * finish.rateCents * quantity) };
      case "per-sqm":
        return { key, amountCents: cents(on("areaToTheHundredth") ? areaTotal * finish.rateCents : areaEach * quantity * finish.rateCents) };
    }
  };

  const packagingCents = (quantity: number): number => {
    const p = PACKAGING[config.packaging];
    if (p.basis === "per-unit") return cents(quantity * p.rateCents);
    if (p.basis === "per-500") return cents(Math.ceil(quantity / 500) * p.rateCents);
    return 0;
  };

  /** The work at a quantity: every line above the delivery, express included. */
  const workAt = (quantity: number): { key: string; amountCents: number }[] => {
    const lines: { key: string; amountCents: number }[] = [{ key: "setup", amountCents: SETUP_CENTS }];
    if (!large) {
      const sheets = sheetsAt(quantity);
      const multiplier = breakFor(quantity).multiplier;
      const sheetRate = on("vinylBySheetArea") && material.kind === "roll" ? material.rateCents * SRA3_AREA_SQM : material.rateCents;
      lines.push({ key: "print", amountCents: cents(sheets * PRINT_PER_SHEET_CENTS[config.sides] * multiplier) });
      lines.push({ key: "material", amountCents: cents(sheets * sheetRate * multiplier) });
      for (const f of config.finishes) lines.push(finishCents(f, sheets, quantity));
      lines.push({ key: "packaging", amountCents: packagingCents(quantity) });
      if (config.printedProof) lines.push({ key: "proof", amountCents: PROOF_BY_POST_CENTS });
    } else {
      const print = cents((on("areaToTheHundredth") ? areaTotal : areaEach * quantity) * material.rateCents);
      lines.push({ key: "print", amountCents: print });
      const finishing = config.finishes.map((f) => finishCents(f, 0, quantity));
      lines.push(...finishing);
      if (config.printedProof) lines.push({ key: "proof", amountCents: PROOF_BY_POST_CENTS });
      const counted = on("minimumOnTheRollWork") ? print + finishing.reduce((s, l) => s + l.amountCents, 0) : lines.reduce((s, l) => s + l.amountCents, 0);
      if (counted < LARGE_FORMAT_MINIMUM_CENTS) lines.push({ key: "minimum", amountCents: LARGE_FORMAT_MINIMUM_CENTS - counted });
    }
    if (config.express) {
      const upliftable = lines.reduce((s, l) => s + l.amountCents, 0);
      lines.push({ key: "express", amountCents: cents(upliftable * EXPRESS_UPLIFT) });
    }
    return lines;
  };

  const lines = workAt(config.quantity);
  let workCents = lines.reduce((s, l) => s + l.amountCents, 0);
  if (on("neverDearerThanNextBreak") && !large) {
    const next = nextBreak(config.quantity);
    if (next !== null) {
      const nextCents = workAt(next.quantity).reduce((s, l) => s + l.amountCents, 0);
      if (nextCents < workCents) {
        lines.push({ key: "cap", amountCents: nextCents - workCents });
        workCents = nextCents;
      }
    }
  }

  // The weight, and the delivery band it falls in.
  let weightKg: number;
  if (on("weightAsPosted")) {
    const gsm = RATE_CARD_GSM[material.key] ?? material.gsm;
    weightKg = large
      ? (areaTotal * gsm + (config.finishes.includes("stretched") ? config.quantity * 900 : 0)) / 1000 + 0.3
      : (config.quantity * widthMm * heightMm * gsm) / 1e9 + 0.2;
    weightKg = Math.round(Number((weightKg * 100).toPrecision(12))) / 100;
  } else {
    const gsm = material.gsm;
    weightKg = large ? areaEach * config.quantity * (gsm / 1000) * 1.15 : ((sheetsAt(config.quantity) * SRA3_AREA_SQM * gsm) / 1000) * 1.08;
  }
  const rolls = large && (!on("tubeOnlyWhenItRolls") || (!config.finishes.includes("stretched") && Math.max(widthMm, heightMm) <= 1500));
  let deliveryCents: number | null;
  if (config.delivery === "collection") deliveryCents = 0;
  else if (on("over30kgQuotedByHand") && weightKg > 30) deliveryCents = null;
  else if (rolls) deliveryCents = DELIVERY_BY_KEY.tube.rateCents;
  else deliveryCents = (DELIVERY_BANDS.find((b) => b.maxKg !== null && weightKg <= b.maxKg) ?? DELIVERY_BY_KEY["band-30kg"]).rateCents;

  const subtotalCents = workCents + (deliveryCents ?? 0);
  const taxCents = cents(subtotalCents * TAX_RATE);
  return { workCents, weightKg: Math.round(weightKg * 100) / 100, deliveryCents, taxCents, totalCents: subtotalCents + taxCents, lines };
}
