/**
 * The rate card, as DATA.
 *
 * Every figure the quote panel, the products grid and the Price list screen
 * render comes from this file. Nothing retypes a number in JSX — that is the
 * single rule that stops the app drifting from the comp one hard-coded `$18`
 * at a time, and it is why the "from $X for 100" figures on the products grid
 * are computed rather than written.
 *
 * All amounts are ex-tax, in whole cents of the display currency. Cents rather
 * than floats because $0.04 a unit × 500 units is exactly the arithmetic that
 * goes wrong in binary — the engine works in integers and divides once, at the
 * edge, when it formats.
 */

/** Tax is one line on the quote, never folded into another figure. */
export const TAX_RATE = 0.2;

/** Bleed the works needs on every edge, in millimetres. */
export const BLEED_MM = 3;

/** Minimum resolution at the finished size. */
export const MIN_DPI = 150;

/** The safe area the templates draw, inside the trim. */
export const SAFE_MM = 4;

// ── press ────────────────────────────────────────────────────────────────────

/** An SRA3 press sheet is 320 × 450mm; this is what it can actually print. */
export const SRA3_PRINTABLE = { widthMm: 310, heightMm: 440 } as const;

/** Setup, per job. Charged once however many sheets the run takes. */
export const SETUP_CENTS = 1800;

/** Printing, per SRA3 press sheet. */
export const PRINT_PER_SHEET_CENTS = { 1: 85, 2: 120 } as const;

// ── materials ────────────────────────────────────────────────────────────────

export type MaterialKey =
  | 'silk-350'
  | 'uncoated-300'
  | 'silk-170'
  | 'silk-130'
  | 'pvc-510'
  | 'mesh-270'
  | 'canvas-380'
  | 'vinyl';

export interface Material {
  key: MaterialKey;
  /** Sheet stock is priced per SRA3 sheet; roll media per square metre. */
  kind: 'sheet' | 'roll';
  /** Cents per SRA3 sheet (sheet stock) or per m² (roll media). */
  rateCents: number;
  /** Grammage, for the spec line. */
  gsm: number;
  /** A tint for the gradient tiles — one per material family. */
  tint: string;
}

export const MATERIALS: readonly Material[] = [
  { key: 'silk-350', kind: 'sheet', rateCents: 42, gsm: 350, tint: 'silk' },
  { key: 'uncoated-300', kind: 'sheet', rateCents: 38, gsm: 300, tint: 'uncoated' },
  { key: 'silk-170', kind: 'sheet', rateCents: 14, gsm: 170, tint: 'silk' },
  { key: 'silk-130', kind: 'sheet', rateCents: 11, gsm: 130, tint: 'silk' },
  { key: 'pvc-510', kind: 'roll', rateCents: 2800, gsm: 510, tint: 'pvc' },
  { key: 'mesh-270', kind: 'roll', rateCents: 3200, gsm: 270, tint: 'mesh' },
  { key: 'canvas-380', kind: 'roll', rateCents: 4600, gsm: 380, tint: 'canvas' },
  { key: 'vinyl', kind: 'roll', rateCents: 3400, gsm: 0, tint: 'vinyl' },
];

export const MATERIAL_BY_KEY: Readonly<Record<MaterialKey, Material>> = Object.fromEntries(
  MATERIALS.map((m) => [m.key, m]),
) as Record<MaterialKey, Material>;

// ── finishing ────────────────────────────────────────────────────────────────

export type FinishKey =
  | 'none'
  | 'gloss-lam'
  | 'matt-lam'
  | 'soft-touch'
  | 'spot-uv'
  | 'round-corners'
  | 'hemmed'
  | 'pole-pockets'
  | 'plain-edges'
  | 'stretched'
  | 'rolled';

export interface Finish {
  key: FinishKey;
  /** Which press the finish belongs to — sheet work or large format. */
  press: 'sheet' | 'large-format';
  /**
   * How the charge is worked out:
   *  per-sheet     — cents × sheets
   *  per-250-units — cents × ceil(quantity / 250)
   *  per-linear-m  — cents × the finished perimeter in metres
   *  per-each      — cents × a count the customer implies (pole pockets: 2)
   *  per-sqm       — cents × area m² × quantity
   *  none          — no charge
   */
  basis: 'per-sheet' | 'per-250-units' | 'per-linear-m' | 'per-each' | 'per-sqm' | 'none';
  rateCents: number;
  /** Lamination side count, for the "one side / both sides" rate split. */
  sides?: 1 | 2;
}

export const FINISHES: readonly Finish[] = [
  { key: 'none', press: 'sheet', basis: 'none', rateCents: 0 },
  { key: 'gloss-lam', press: 'sheet', basis: 'per-sheet', rateCents: 55, sides: 1 },
  { key: 'matt-lam', press: 'sheet', basis: 'per-sheet', rateCents: 95, sides: 2 },
  { key: 'soft-touch', press: 'sheet', basis: 'per-sheet', rateCents: 120, sides: 2 },
  { key: 'spot-uv', press: 'sheet', basis: 'per-sheet', rateCents: 240 },
  { key: 'round-corners', press: 'sheet', basis: 'per-250-units', rateCents: 600 },
  { key: 'plain-edges', press: 'large-format', basis: 'none', rateCents: 0 },
  { key: 'hemmed', press: 'large-format', basis: 'per-linear-m', rateCents: 600 },
  { key: 'pole-pockets', press: 'large-format', basis: 'per-each', rateCents: 900 },
  { key: 'stretched', press: 'large-format', basis: 'per-sqm', rateCents: 2200 },
  { key: 'rolled', press: 'large-format', basis: 'none', rateCents: 0 },
];

export const FINISH_BY_KEY: Readonly<Record<FinishKey, Finish>> = Object.fromEntries(
  FINISHES.map((f) => [f.key, f]),
) as Record<FinishKey, Finish>;

/** Lamination applied to one side only, for products printed one side. */
export const LAMINATION_ONE_SIDE_CENTS = 55;

// ── quantity breaks ──────────────────────────────────────────────────────────

/**
 * The multiplier applies to PRINT + MATERIAL ONLY — never to setup, finishing,
 * packaging or delivery. A typed-in amount takes the break at or below it.
 *
 * Never call these tiers. The trade does, which is exactly why the word is on
 * the banned list: they are quantity breaks or price breaks.
 */
export interface QuantityBreak {
  quantity: number;
  multiplier: number;
}

export const QUANTITY_BREAKS: readonly QuantityBreak[] = [
  { quantity: 25, multiplier: 1.0 },
  { quantity: 50, multiplier: 0.92 },
  { quantity: 100, multiplier: 0.84 },
  { quantity: 250, multiplier: 0.74 },
  { quantity: 500, multiplier: 0.66 },
  { quantity: 1000, multiplier: 0.58 },
];

/** The break at or below `quantity`; the smallest break for anything under it. */
export function breakFor(quantity: number): QuantityBreak {
  let chosen = QUANTITY_BREAKS[0]!;
  for (const step of QUANTITY_BREAKS) {
    if (quantity >= step.quantity) chosen = step;
  }
  return chosen;
}

/** The next break up, or null when the customer is already at the biggest one. */
export function nextBreak(quantity: number): QuantityBreak | null {
  return QUANTITY_BREAKS.find((step) => step.quantity > quantity) ?? null;
}

// ── large format ─────────────────────────────────────────────────────────────

/** No large-format job leaves the works for less than this, whatever its area. */
export const LARGE_FORMAT_MINIMUM_CENTS = 3500;

/** Large-format runs are 1–20 with no breaks. */
export const LARGE_FORMAT_MAX_QUANTITY = 20;

/**
 * The custom-size envelope. Every limit here is rendered in words beside the
 * fields and named by the error that breaks it — never a silent clamp.
 */
export const SIZE_LIMITS = {
  minSideMm: 300,
  /** The roll is 1370mm wide; this is what it can print across. */
  maxRollAxisMm: 1350,
  maxLengthAxisMm: 5000,
  maxAreaSqm: 6,
  /** Stretched canvas is bounded by the frame, not the roll. */
  frame: { maxWidthMm: 1000, maxHeightMm: 1400 },
} as const;

// ── packaging ────────────────────────────────────────────────────────────────

export type PackagingKey = 'bundled' | 'shrink-wrapped' | 'boxed';

export interface Packaging {
  key: PackagingKey;
  basis: 'included' | 'per-unit' | 'per-500';
  rateCents: number;
}

export const PACKAGING: readonly Packaging[] = [
  { key: 'bundled', basis: 'included', rateCents: 0 },
  { key: 'shrink-wrapped', basis: 'per-unit', rateCents: 4 },
  { key: 'boxed', basis: 'per-500', rateCents: 450 },
];

export const PACKAGING_BY_KEY: Readonly<Record<PackagingKey, Packaging>> = Object.fromEntries(
  PACKAGING.map((p) => [p.key, p]),
) as Record<PackagingKey, Packaging>;

/** How many units a `per-500` line covers. Named, so the copy can say it. */
export const PACKAGING_BATCH = 500;

// ── proof, turnaround, delivery ──────────────────────────────────────────────

export const PROOF_BY_POST_CENTS = 1200;
export const PROOF_BY_POST_EXTRA_DAYS = 2;

/** Express multiplies everything above the delivery line. */
export const EXPRESS_UPLIFT = 0.35;

export const STANDARD_WORKING_DAYS = 3;

/** Artwork approved before this hour counts as that working day. */
export const CUTOFF_HOUR = 14;

export type DeliveryKey = 'collection' | 'band-2kg' | 'band-10kg' | 'band-30kg' | 'tube';

export interface DeliveryBand {
  key: DeliveryKey;
  /** Upper bound in kilograms; null for collection and the tube. */
  maxKg: number | null;
  rateCents: number;
}

export const DELIVERY_BANDS: readonly DeliveryBand[] = [
  { key: 'collection', maxKg: null, rateCents: 0 },
  { key: 'band-2kg', maxKg: 2, rateCents: 650 },
  { key: 'band-10kg', maxKg: 10, rateCents: 980 },
  { key: 'band-30kg', maxKg: 30, rateCents: 1640 },
  { key: 'tube', maxKg: null, rateCents: 1400 },
];

export const DELIVERY_BY_KEY: Readonly<Record<DeliveryKey, DeliveryBand>> = Object.fromEntries(
  DELIVERY_BANDS.map((d) => [d.key, d]),
) as Record<DeliveryKey, DeliveryBand>;

/**
 * The band a finished job falls into, by weight. Large-format work goes in a
 * tube rather than a box, so it takes the tube rate whatever it weighs.
 */
export function deliveryBandFor(weightKg: number, rolled: boolean): DeliveryBand {
  if (rolled) return DELIVERY_BY_KEY.tube;
  for (const band of DELIVERY_BANDS) {
    if (band.maxKg !== null && weightKg <= band.maxKg) return band;
  }
  return DELIVERY_BY_KEY['band-30kg'];
}

/**
 * Finished weight, in kilograms, from the sheets a run consumes. An SRA3 sheet
 * is 0.144 m², so grammage × area × sheets is the paper weight; the 8% is the
 * box, the tissue and the tape.
 */
export const SRA3_AREA_SQM = 0.32 * 0.45;

export function sheetWeightKg(sheets: number, gsm: number): number {
  return (sheets * SRA3_AREA_SQM * gsm) / 1000;
}
