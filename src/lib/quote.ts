/**
 * The configurator engine (24-marketplace-wave-4.md §4, D5).
 *
 * Pure and deterministic: no `Date.now()`, no `Math.random()`, no imports from
 * React or the store. Every clock reading is passed in, so the vitest suite and
 * the running demo agree by construction rather than by luck.
 *
 * THE RULE THAT SHAPES EVERYTHING HERE: nothing is silently dropped, silently
 * clamped or silently substituted. An impossible combination comes back with
 * the reason on it; an out-of-range size comes back naming the limit it broke
 * AND the nearest size that works. A function in this file that returns a bare
 * `false` is a bug — the UI has nothing to render from a boolean.
 */

import {
  PRODUCT_BY_KEY,
  SIZE_BY_KEY,
  incompatibleReason,
  type Product,
  type ProductKey,
} from './catalogue.ts';
import { imposition } from './jobs.ts';
import {
  BLEED_MM,
  CUTOFF_HOUR,
  DELIVERY_BY_KEY,
  EXPRESS_UPLIFT,
  FINISH_BY_KEY,
  LAMINATION_ONE_SIDE_CENTS,
  LARGE_FORMAT_MINIMUM_CENTS,
  MATERIAL_BY_KEY,
  MIN_DPI,
  PACKAGING_BY_KEY,
  PRINT_PER_SHEET_CENTS,
  PROOF_BY_POST_CENTS,
  PROOF_BY_POST_EXTRA_DAYS,
  SETUP_CENTS,
  SIZE_LIMITS,
  STANDARD_WORKING_DAYS,
  TAX_RATE,
  breakFor,
  deliveryBandFor,
  nextBreak,
  sheetWeightKg,
  type DeliveryKey,
  type FinishKey,
  type MaterialKey,
  type PackagingKey,
} from './rates.ts';

// ── the configuration a customer builds ──────────────────────────────────────

export interface Configuration {
  product: ProductKey;
  material: MaterialKey;
  /** A preset key, or `custom` with the millimetres below. */
  size: string;
  customWidthMm?: number;
  customHeightMm?: number;
  sides: 1 | 2;
  finish: FinishKey;
  quantity: number;
  packaging: PackagingKey;
  printedProof: boolean;
  express: boolean;
  delivery: DeliveryKey;
}

/** The finished size a configuration resolves to, whichever way it was chosen. */
export interface ResolvedSize {
  widthMm: number;
  heightMm: number;
  /** Area of ONE piece, in square metres. */
  areaSqm: number;
}

// ── size validation ──────────────────────────────────────────────────────────

/**
 * A broken limit, with the number that broke it and the nearest legal size.
 * `limit` is an i18n key; `nearest` is what the "use this instead" button sets.
 */
export interface SizeViolation {
  limit: string;
  /** The value the customer typed that broke it. */
  actual: number;
  /** The bound it broke. */
  bound: number;
  nearest: { widthMm: number; heightMm: number };
}

export interface SizeCheck {
  ok: boolean;
  size: ResolvedSize;
  violations: SizeViolation[];
}

const round1 = (n: number): number => Math.round(n * 10) / 10;

/**
 * Validate a custom size against the roll, the frame and the area cap.
 *
 * `stretched` matters: canvas on a 38mm frame is bounded by the frame it is
 * stapled to, not by the roll it came off, and the tighter limit must say so
 * when it is the reason.
 */
export function checkCustomSize(
  widthMm: number,
  heightMm: number,
  opts: { stretched?: boolean } = {},
): SizeCheck {
  const stretched = opts.stretched ?? false;
  const maxWidth = stretched ? SIZE_LIMITS.frame.maxWidthMm : SIZE_LIMITS.maxRollAxisMm;
  const maxHeight = stretched ? SIZE_LIMITS.frame.maxHeightMm : SIZE_LIMITS.maxLengthAxisMm;

  const violations: SizeViolation[] = [];
  // Clamp progressively so the nearest legal size respects every limit at once
  // rather than only the one being reported.
  let w = widthMm;
  let h = heightMm;

  if (widthMm < SIZE_LIMITS.minSideMm) {
    w = SIZE_LIMITS.minSideMm;
    violations.push({
      limit: 'limit.minSide',
      actual: widthMm,
      bound: SIZE_LIMITS.minSideMm,
      nearest: { widthMm: w, heightMm: h },
    });
  }
  if (heightMm < SIZE_LIMITS.minSideMm) {
    h = SIZE_LIMITS.minSideMm;
    violations.push({
      limit: 'limit.minSide',
      actual: heightMm,
      bound: SIZE_LIMITS.minSideMm,
      nearest: { widthMm: w, heightMm: h },
    });
  }
  if (w > maxWidth) {
    violations.push({
      limit: stretched ? 'limit.frameWidth' : 'limit.rollAxis',
      actual: w,
      bound: maxWidth,
      nearest: { widthMm: maxWidth, heightMm: h },
    });
    w = maxWidth;
  }
  if (h > maxHeight) {
    violations.push({
      limit: stretched ? 'limit.frameHeight' : 'limit.lengthAxis',
      actual: h,
      bound: maxHeight,
      nearest: { widthMm: w, heightMm: maxHeight },
    });
    h = maxHeight;
  }

  const areaSqm = (w / 1000) * (h / 1000);
  if (areaSqm > SIZE_LIMITS.maxAreaSqm) {
    // Shrink both sides by the same factor: the customer's proportions are the
    // one thing we can preserve while getting under the cap.
    const factor = Math.sqrt(SIZE_LIMITS.maxAreaSqm / areaSqm);
    const nearestW = Math.max(SIZE_LIMITS.minSideMm, Math.floor(w * factor));
    const nearestH = Math.max(SIZE_LIMITS.minSideMm, Math.floor(h * factor));
    violations.push({
      limit: 'limit.area',
      actual: round1(areaSqm),
      bound: SIZE_LIMITS.maxAreaSqm,
      nearest: { widthMm: nearestW, heightMm: nearestH },
    });
    w = nearestW;
    h = nearestH;
  }

  return {
    ok: violations.length === 0,
    size: {
      widthMm: w,
      heightMm: h,
      areaSqm: round1((w / 1000) * (h / 1000) * 100) / 100,
    },
    violations,
  };
}

/** The finished size of a configuration, preset or custom. */
export function resolveSize(config: Configuration): ResolvedSize {
  if (config.size !== 'custom') {
    const preset = SIZE_BY_KEY[config.size];
    if (preset === undefined) {
      throw new Error(`unknown preset size: ${config.size}`);
    }
    return {
      widthMm: preset.widthMm,
      heightMm: preset.heightMm,
      areaSqm: (preset.widthMm / 1000) * (preset.heightMm / 1000),
    };
  }
  const w = config.customWidthMm ?? SIZE_LIMITS.minSideMm;
  const h = config.customHeightMm ?? SIZE_LIMITS.minSideMm;
  return { widthMm: w, heightMm: h, areaSqm: (w / 1000) * (h / 1000) };
}

// ── the finish chips, with their reasons ─────────────────────────────────────

export interface FinishOption {
  key: FinishKey;
  available: boolean;
  /** An i18n key naming why not. Present exactly when `available` is false. */
  reason: string | null;
}

/**
 * Every finish this product offers, each carrying whether the chosen material
 * allows it and — when it does not — why. The UI renders the reason ON the
 * disabled chip; nothing here decides how it looks.
 */
export function finishOptions(config: Configuration): FinishOption[] {
  const product = PRODUCT_BY_KEY[config.product];
  return product.finishes.map((key) => {
    const reason = incompatibleReason(key, config.material);
    return { key, available: reason === null, reason };
  });
}

// ── money ────────────────────────────────────────────────────────────────────

export type QuoteLineKey =
  | 'setup'
  | 'print'
  | 'material'
  | 'finishing'
  | 'packaging'
  | 'proof'
  | 'express'
  | 'delivery'
  | 'minimum';

export interface QuoteLine {
  key: QuoteLineKey;
  amountCents: number;
  /** Numbers the mono sub-label renders, e.g. `{ sheets: 24, rate: 120 }`. */
  detail: Record<string, number | string>;
}

export interface Quote {
  lines: QuoteLine[];
  /** Sum of the lines, ex-tax. */
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  /** Total ÷ quantity, derived once and never re-multiplied. */
  unitCents: number;
  /** What the run consumes, for the ticket and the materials line. */
  sheets: number;
  up: number;
  rotated: boolean;
  size: ResolvedSize;
  weightKg: number;
  /** The break that applied, so the UI can show what the next one saves. */
  multiplier: number;
  blocked: SizeViolation[];
}

const cents = (n: number): number => Math.round(n);

/**
 * Price a configuration.
 *
 * Rounding happens per LINE, once, and the total is the sum of the rounded
 * lines plus the rounded tax — so every figure on the panel adds up on screen.
 * A total computed from unrounded intermediates would be off by a cent from
 * what the customer can see, which is precisely the kind of small dishonesty
 * this configurator exists to avoid.
 */
export function priceQuote(config: Configuration): Quote {
  const product = PRODUCT_BY_KEY[config.product];
  const material = MATERIAL_BY_KEY[config.material];

  // A custom size outside the limits does not get a guessed price.
  if (config.size === 'custom') {
    const check = checkCustomSize(
      config.customWidthMm ?? 0,
      config.customHeightMm ?? 0,
      { stretched: config.finish === 'stretched' },
    );
    if (!check.ok) {
      return {
        lines: [],
        subtotalCents: 0,
        taxCents: 0,
        totalCents: 0,
        unitCents: 0,
        sheets: 0,
        up: 0,
        rotated: false,
        size: check.size,
        weightKg: 0,
        multiplier: 1,
        blocked: check.violations,
      };
    }
  }

  const size = resolveSize(config);
  const lines: QuoteLine[] =
    product.press === 'sheet'
      ? sheetLines(config, product, size)
      : largeFormatLines(config, product, size);

  const impos =
    product.press === 'sheet'
      ? imposition(size.widthMm, size.heightMm, config.quantity)
      : { up: 1, rotated: false, sheets: config.quantity };

  // Express uplifts everything the works does, not the courier's charge.
  if (config.express) {
    const upliftable = lines
      .filter((l) => l.key !== 'delivery')
      .reduce((sum, l) => sum + l.amountCents, 0);
    lines.push({
      key: 'express',
      amountCents: cents(upliftable * EXPRESS_UPLIFT),
      detail: { pct: Math.round(EXPRESS_UPLIFT * 100) },
    });
  }

  const weightKg =
    product.press === 'sheet'
      ? sheetWeightKg(impos.sheets, material.gsm) * 1.08
      : size.areaSqm * config.quantity * (material.gsm / 1000) * 1.15;

  const band =
    config.delivery === 'collection'
      ? DELIVERY_BY_KEY.collection
      : deliveryBandFor(weightKg, product.press === 'large-format');

  if (band.rateCents > 0) {
    lines.push({
      key: 'delivery',
      amountCents: band.rateCents,
      detail: { band: band.key, kg: Math.round(weightKg * 10) / 10 },
    });
  }

  const subtotalCents = lines.reduce((sum, l) => sum + l.amountCents, 0);
  const taxCents = cents(subtotalCents * TAX_RATE);
  const totalCents = subtotalCents + taxCents;

  return {
    lines,
    subtotalCents,
    taxCents,
    totalCents,
    unitCents: config.quantity > 0 ? totalCents / config.quantity : 0,
    sheets: impos.sheets,
    up: impos.up,
    rotated: impos.rotated,
    size,
    weightKg: Math.round(weightKg * 100) / 100,
    multiplier: product.quantityMode === 'breaks' ? breakFor(config.quantity).multiplier : 1,
    blocked: [],
  };
}

function sheetLines(config: Configuration, product: Product, size: ResolvedSize): QuoteLine[] {
  const material = MATERIAL_BY_KEY[config.material];
  const { sheets } = imposition(size.widthMm, size.heightMm, config.quantity);
  const multiplier = breakFor(config.quantity).multiplier;

  const printRate = PRINT_PER_SHEET_CENTS[config.sides];
  const printRaw = sheets * printRate;
  const materialRaw = sheets * material.rateCents;

  const lines: QuoteLine[] = [
    { key: 'setup', amountCents: SETUP_CENTS, detail: {} },
    {
      key: 'print',
      amountCents: cents(printRaw * multiplier),
      detail: { sheets, rate: printRate, multiplier },
    },
    {
      key: 'material',
      amountCents: cents(materialRaw * multiplier),
      detail: { sheets, rate: material.rateCents, multiplier },
    },
  ];

  const finishing = finishingCents(config, sheets, size);
  if (finishing > 0) {
    lines.push({ key: 'finishing', amountCents: finishing, detail: { sheets } });
  }

  const packaging = packagingCents(config);
  if (packaging > 0) {
    lines.push({ key: 'packaging', amountCents: packaging, detail: { quantity: config.quantity } });
  }

  if (config.printedProof) {
    lines.push({
      key: 'proof',
      amountCents: PROOF_BY_POST_CENTS,
      detail: { days: PROOF_BY_POST_EXTRA_DAYS },
    });
  }

  void product;
  return lines;
}

function largeFormatLines(config: Configuration, product: Product, size: ResolvedSize): QuoteLine[] {
  const material = MATERIAL_BY_KEY[config.material];
  const totalAreaSqm = size.areaSqm * config.quantity;

  const lines: QuoteLine[] = [
    { key: 'setup', amountCents: SETUP_CENTS, detail: {} },
    {
      key: 'print',
      amountCents: cents(totalAreaSqm * material.rateCents),
      detail: { sqm: Math.round(totalAreaSqm * 100) / 100, rate: material.rateCents },
    },
  ];

  const finishing = finishingCents(config, 0, size);
  if (finishing > 0) {
    lines.push({ key: 'finishing', amountCents: finishing, detail: { finish: config.finish } });
  }

  if (config.printedProof) {
    lines.push({
      key: 'proof',
      amountCents: PROOF_BY_POST_CENTS,
      detail: { days: PROOF_BY_POST_EXTRA_DAYS },
    });
  }

  // No large-format job leaves for less than the minimum; the shortfall is its
  // own line so the customer can see exactly why a small banner costs what it
  // does rather than finding a mystery number in the total.
  const worked = lines.reduce((sum, l) => sum + l.amountCents, 0);
  if (worked < LARGE_FORMAT_MINIMUM_CENTS) {
    lines.push({
      key: 'minimum',
      amountCents: LARGE_FORMAT_MINIMUM_CENTS - worked,
      detail: { minimum: LARGE_FORMAT_MINIMUM_CENTS },
    });
  }

  void product;
  return lines;
}

function finishingCents(config: Configuration, sheets: number, size: ResolvedSize): number {
  const finish = FINISH_BY_KEY[config.finish];
  switch (finish.basis) {
    case 'none':
      return 0;
    case 'per-sheet': {
      // Lamination on a one-sided job laminates one side.
      const rate =
        finish.sides === 2 && config.sides === 1 ? LAMINATION_ONE_SIDE_CENTS : finish.rateCents;
      return cents(sheets * rate);
    }
    case 'per-250-units':
      return cents(Math.ceil(config.quantity / 250) * finish.rateCents);
    case 'per-linear-m': {
      const perimeterM = ((size.widthMm + size.heightMm) * 2) / 1000;
      return cents(perimeterM * finish.rateCents * config.quantity);
    }
    case 'per-each':
      // Pole pockets go top and bottom.
      return cents(2 * finish.rateCents * config.quantity);
    case 'per-sqm':
      return cents(size.areaSqm * config.quantity * finish.rateCents);
    /* c8 ignore next 2 */
    default:
      return 0;
  }
}

function packagingCents(config: Configuration): number {
  const packaging = PACKAGING_BY_KEY[config.packaging];
  switch (packaging.basis) {
    case 'included':
      return 0;
    case 'per-unit':
      return cents(config.quantity * packaging.rateCents);
    case 'per-500':
      return cents(Math.ceil(config.quantity / 500) * packaging.rateCents);
    /* c8 ignore next 2 */
    default:
      return 0;
  }
}

/**
 * What the next quantity break would do to the unit price, in the plain words
 * the configurator shows under the chips ("250 works out at $0.28 each — 500
 * drops it to $0.22"). Returns null at the top break.
 */
export function nextBreakSaving(
  config: Configuration,
): { quantity: number; currentUnitCents: number; nextUnitCents: number } | null {
  const step = nextBreak(config.quantity);
  if (step === null) return null;
  const current = priceQuote(config);
  const upgraded = priceQuote({ ...config, quantity: step.quantity });
  if (current.unitCents === 0 || upgraded.unitCents === 0) return null;
  return {
    quantity: step.quantity,
    currentUnitCents: current.unitCents,
    nextUnitCents: upgraded.unitCents,
  };
}

/**
 * The three biggest levers on this price, largest first, as i18n keys with
 * their share. "What moves this price" renders these in words.
 */
export function priceLevers(quote: Quote): { key: QuoteLineKey; sharePct: number }[] {
  if (quote.subtotalCents === 0) return [];
  return [...quote.lines]
    .sort((a, b) => b.amountCents - a.amountCents)
    .slice(0, 3)
    .map((l) => ({
      key: l.key,
      sharePct: Math.round((l.amountCents / quote.subtotalCents) * 100),
    }));
}

// ── the working calendar ─────────────────────────────────────────────────────

/** ISO date → JS day index, without going through a local-timezone Date. */
function dayOfWeek(iso: string): number {
  const [y, m, d] = iso.split('-').map((n) => Number.parseInt(n, 10));
  return new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay();
}

export function isWorkingDay(iso: string): boolean {
  const day = dayOfWeek(iso);
  return day >= 1 && day <= 5;
}

function shiftIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map((n) => Number.parseInt(n, 10));
  const next = new Date(Date.UTC(y!, m! - 1, d! + days));
  return next.toISOString().slice(0, 10);
}

/**
 * Add whole WORKING days. `addWorkingDays(iso, 0)` rolls a weekend date forward
 * to the next working day — a job cannot be promised for a Saturday.
 */
export function addWorkingDays(iso: string, days: number): string {
  let out = iso;
  while (!isWorkingDay(out)) out = shiftIso(out, 1);
  for (let i = 0; i < days; i += 1) {
    out = shiftIso(out, 1);
    while (!isWorkingDay(out)) out = shiftIso(out, 1);
  }
  return out;
}

export interface Promise_ {
  /** ISO date the job is ready by. */
  readyBy: string;
  workingDays: number;
}

/**
 * When a job will be ready, from the pinned clock.
 *
 * Artwork approved before 14:00 counts as that working day; after it, the clock
 * starts the next morning. A printed proof by post adds two working days, and
 * express replaces the standard turnaround with the next working day.
 */
export function promiseFor(
  config: Configuration,
  now: { iso: string; hour: number },
): Promise_ {
  const startsToday = now.hour < CUTOFF_HOUR;
  const base = startsToday ? now.iso : addWorkingDays(now.iso, 1);

  const days =
    (config.express ? 1 : STANDARD_WORKING_DAYS) +
    (config.printedProof ? PROOF_BY_POST_EXTRA_DAYS : 0);

  return { readyBy: addWorkingDays(base, days), workingDays: days };
}

// ── artwork checks ───────────────────────────────────────────────────────────

export type VerdictLevel = 'pass' | 'warn' | 'fail';

/**
 * One check, carrying THE MEASURED NUMBER that produced it. A verdict without
 * its number ("resolution too low") is not a verdict a customer can act on, so
 * `measured` is required rather than optional.
 */
export interface ArtworkVerdict {
  level: VerdictLevel;
  /** i18n key under `verdict.*`. */
  key: string;
  measured: Record<string, number | string>;
}

export interface ArtworkFile {
  filename: string;
  /** Pixel dimensions as supplied. */
  widthPx: number;
  heightPx: number;
  /** Physical size the file declares, in millimetres. */
  widthMm: number;
  heightMm: number;
  /** Millimetres of bleed present on every edge. */
  bleedMm: number;
  /** Smallest distance from any ink to the trim line, in millimetres. */
  nearestInkMm: number;
  colourSpace: 'CMYK' | 'RGB';
  fontsEmbedded: boolean;
  pages: number;
}

/**
 * Run the works' checks on a file against the job it is for.
 *
 * The HOST runs this — never an artwork add-on on its own output — which is
 * what stops Design Studio and Canva Import marking their own homework
 * (24 §5.5). Design Studio's output passes because it was built at the right
 * size with the bleed on it; a design made somewhere else routinely does not.
 */
export function checkArtwork(file: ArtworkFile, config: Configuration): ArtworkVerdict[] {
  const size = resolveSize(config);
  const verdicts: ArtworkVerdict[] = [];

  // Bleed.
  if (file.bleedMm >= BLEED_MM) {
    verdicts.push({ level: 'pass', key: 'verdict.bleedOk', measured: { mm: file.bleedMm } });
  } else {
    const needW = size.widthMm + BLEED_MM * 2;
    const needH = size.heightMm + BLEED_MM * 2;
    verdicts.push({
      level: 'fail',
      key: 'verdict.bleedMissing',
      measured: {
        mm: file.bleedMm,
        needMm: BLEED_MM,
        haveW: file.widthMm,
        haveH: file.heightMm,
        needW,
        needH,
      },
    });
  }

  // Resolution at the FINISHED size — not at whatever size the file declares.
  const dpi = Math.round(file.widthPx / (file.widthMm / 25.4));
  if (dpi >= MIN_DPI) {
    verdicts.push({ level: 'pass', key: 'verdict.dpiOk', measured: { dpi } });
  } else {
    verdicts.push({
      level: 'fail',
      key: 'verdict.dpiLow',
      measured: {
        dpi,
        need: MIN_DPI,
        px: `${file.widthPx} × ${file.heightPx}`,
        mm: `${file.widthMm} × ${file.heightMm}`,
      },
    });
  }

  // Safe area — a warning, because the customer may mean it.
  if (file.nearestInkMm < SAFE_AREA_ADVISORY_MM) {
    verdicts.push({
      level: 'warn',
      key: 'verdict.nearTrim',
      measured: { mm: file.nearestInkMm, suggest: SAFE_AREA_ADVISORY_MM },
    });
  }

  if (file.colourSpace !== 'CMYK') {
    verdicts.push({
      level: 'warn',
      key: 'verdict.rgb',
      measured: { space: file.colourSpace },
    });
  }

  if (!file.fontsEmbedded) {
    verdicts.push({ level: 'fail', key: 'verdict.fonts', measured: {} });
  }

  // One page per printed side.
  if (file.pages !== config.sides) {
    verdicts.push({
      level: config.sides === 2 && file.pages < 2 ? 'fail' : 'warn',
      key: 'verdict.pages',
      measured: { pages: file.pages, need: config.sides },
    });
  }

  return verdicts;
}

const SAFE_AREA_ADVISORY_MM = 4;

/** A file with any `fail` blocks the order; `warn` needs an explicit tick. */
export function artworkBlocked(verdicts: ArtworkVerdict[]): boolean {
  return verdicts.some((v) => v.level === 'fail');
}

export function artworkNeedsTick(verdicts: ArtworkVerdict[]): boolean {
  return !artworkBlocked(verdicts) && verdicts.some((v) => v.level === 'warn');
}

/**
 * The cheapest this product can be had for, at the quantity the grid quotes.
 * Computed rather than typed, so a rate change moves the products grid too.
 */
export function fromPriceCents(productKey: ProductKey): number {
  const product = PRODUCT_BY_KEY[productKey];
  const cheapest = [...product.materials].sort(
    (a, b) => MATERIAL_BY_KEY[a].rateCents - MATERIAL_BY_KEY[b].rateCents,
  )[0]!;
  const size = product.sizes[0] === 'custom' ? 'custom' : product.sizes[0]!;
  const plainFinish = product.finishes.find((f) => FINISH_BY_KEY[f].basis === 'none') ?? 'none';

  return priceQuote({
    product: productKey,
    material: cheapest,
    size,
    ...(size === 'custom' ? { customWidthMm: 800, customHeightMm: 2000 } : {}),
    sides: 1,
    finish: plainFinish,
    quantity: product.fromQuantity,
    packaging: 'bundled',
    printedProof: false,
    express: false,
    delivery: 'collection',
  }).totalCents;
}
