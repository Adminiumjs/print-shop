/**
 * The press and the catalogue's own shape: what the works prints on, the
 * limits a size is held to, the checks a file is held to, and the keys of
 * its stocks, finishes and packaging. No money: every price is Adminium's,
 * worked out from the works' rate card (`lib/rateCard.ts` shows the card,
 * `lib/priced.ts` the prices).
 */

/** Bleed the works needs on every edge, in millimetres. */
export const BLEED_MM = 3;

/** Minimum resolution at the finished size. */
export const MIN_DPI = 150;

/** The safe area the templates draw, inside the trim. */
export const SAFE_MM = 4;

/** An SRA3 press sheet is 320 × 450mm; this is what it can actually print. */
export const SRA3_PRINTABLE = { widthMm: 310, heightMm: 440 } as const;

export type MaterialKey = "silk-350" | "uncoated-300" | "silk-170" | "silk-130" | "pvc-510" | "mesh-270" | "canvas-380" | "vinyl";

export interface Material {
  key: MaterialKey;
  /** Sheet stock goes on the press; roll media off the roll. */
  kind: "sheet" | "roll";
  /** Grammage, for the spec line. */
  gsm: number;
  /** A tint for the gradient tiles — one per material family. */
  tint: string;
}

export const MATERIALS: readonly Material[] = [
  { key: "silk-350", kind: "sheet", gsm: 350, tint: "silk" },
  { key: "uncoated-300", kind: "sheet", gsm: 300, tint: "uncoated" },
  { key: "silk-170", kind: "sheet", gsm: 170, tint: "silk" },
  { key: "silk-130", kind: "sheet", gsm: 130, tint: "silk" },
  { key: "pvc-510", kind: "roll", gsm: 510, tint: "pvc" },
  { key: "mesh-270", kind: "roll", gsm: 270, tint: "mesh" },
  { key: "canvas-380", kind: "roll", gsm: 380, tint: "canvas" },
  { key: "vinyl", kind: "roll", gsm: 300, tint: "vinyl" },
];

export const MATERIAL_BY_KEY: Readonly<Record<MaterialKey, Material>> = Object.fromEntries(MATERIALS.map((m) => [m.key, m])) as Record<MaterialKey, Material>;

export type FinishKey = "none" | "gloss-lam" | "matt-lam" | "soft-touch" | "spot-uv" | "round-corners" | "hemmed" | "pole-pockets" | "plain-edges" | "stretched" | "rolled";

export interface Finish {
  key: FinishKey;
  /** Which press the finish belongs to — sheet work or large format. */
  press: "sheet" | "large-format";
  /** How the works charges it: by the sheet, every 250, the metre of edge, the piece, the square metre, or not at all. */
  basis: "per-sheet" | "per-250-units" | "per-linear-m" | "per-each" | "per-sqm" | "none";
}

export const FINISHES: readonly Finish[] = [
  { key: "none", press: "sheet", basis: "none" },
  { key: "gloss-lam", press: "sheet", basis: "per-sheet" },
  { key: "matt-lam", press: "sheet", basis: "per-sheet" },
  { key: "soft-touch", press: "sheet", basis: "per-sheet" },
  { key: "spot-uv", press: "sheet", basis: "per-sheet" },
  { key: "round-corners", press: "sheet", basis: "per-250-units" },
  { key: "plain-edges", press: "large-format", basis: "none" },
  { key: "hemmed", press: "large-format", basis: "per-linear-m" },
  { key: "pole-pockets", press: "large-format", basis: "per-each" },
  { key: "stretched", press: "large-format", basis: "per-sqm" },
  { key: "rolled", press: "large-format", basis: "none" },
];

export const FINISH_BY_KEY: Readonly<Record<FinishKey, Finish>> = Object.fromEntries(FINISHES.map((f) => [f.key, f])) as Record<FinishKey, Finish>;

/** The quantities a break starts at: the quantity chips. Never call these tiers. */
export const BREAK_QUANTITIES: readonly number[] = [25, 50, 100, 250, 500, 1000];

/** The next break up, or null at the biggest one. */
export function nextBreakQuantity(quantity: number): number | null {
  return BREAK_QUANTITIES.find((q) => q > quantity) ?? null;
}

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

export type PackagingKey = "bundled" | "shrink-wrapped" | "boxed";

export interface Packaging {
  key: PackagingKey;
  basis: "included" | "per-unit" | "per-500";
}

export const PACKAGING: readonly Packaging[] = [
  { key: "bundled", basis: "included" },
  { key: "shrink-wrapped", basis: "per-unit" },
  { key: "boxed", basis: "per-500" },
];

export const PACKAGING_BY_KEY: Readonly<Record<PackagingKey, Packaging>> = Object.fromEntries(PACKAGING.map((p) => [p.key, p])) as Record<PackagingKey, Packaging>;

/** How many units a `per-500` line covers. Named, so the copy can say it. */
export const PACKAGING_BATCH = 500;

/** A printed proof by post adds this many working days. */
export const PROOF_BY_POST_EXTRA_DAYS = 2;

export const STANDARD_WORKING_DAYS = 3;

/** Artwork approved before this hour counts as that working day. */
export const CUTOFF_HOUR = 14;

export type DeliveryKey = "collection" | "band-2kg" | "band-10kg" | "band-30kg" | "tube";

export interface DeliveryBand {
  key: DeliveryKey;
  /** Upper bound in kilograms; null for collection and the tube. */
  maxKg: number | null;
}

export const DELIVERY_BANDS: readonly DeliveryBand[] = [
  { key: "collection", maxKg: null },
  { key: "band-2kg", maxKg: 2 },
  { key: "band-10kg", maxKg: 10 },
  { key: "band-30kg", maxKg: 30 },
  { key: "tube", maxKg: null },
];

/** An SRA3 sheet's area, in square metres. */
export const SRA3_AREA_SQM = 0.32 * 0.45;

/** The paper a run of press sheets weighs, in kilograms (for a parcel's weight per piece). */
export function sheetWeightKg(sheets: number, gsm: number): number {
  return (sheets * SRA3_AREA_SQM * gsm) / 1000;
}
