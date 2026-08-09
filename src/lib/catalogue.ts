/**
 * The option graph: what the works prints, and which choices each thing allows.
 *
 * Split out of `quote.ts` for the same reason `rates.ts` is: this is DATA. The
 * engine reads it; no screen retypes a millimetre. Labels live in the i18n
 * bundle under `data.*` — nothing here is a display string, only keys and
 * numbers, so the whole catalogue translates without touching this file.
 */

import type { FinishKey, MaterialKey, PackagingKey } from './rates.ts';

/** Named sizes, in millimetres. The mono chips render these verbatim. */
export interface PresetSize {
  key: string;
  widthMm: number;
  heightMm: number;
}

export const PRESET_SIZES: readonly PresetSize[] = [
  { key: 'business-card', widthMm: 85, heightMm: 55 },
  { key: 'a6', widthMm: 105, heightMm: 148 },
  { key: 'a5', widthMm: 148, heightMm: 210 },
  { key: 'a4', widthMm: 210, heightMm: 297 },
  { key: 'a3', widthMm: 297, heightMm: 420 },
  { key: 'dl', widthMm: 210, heightMm: 99 },
  { key: 'us-letter', widthMm: 216, heightMm: 279 },
  { key: 'dl-envelope', widthMm: 220, heightMm: 110 },
  { key: 'c5', widthMm: 229, heightMm: 162 },
];

export const SIZE_BY_KEY: Readonly<Record<string, PresetSize>> = Object.fromEntries(
  PRESET_SIZES.map((s) => [s.key, s]),
);

export type ProductKey =
  | 'business-cards'
  | 'folded-cards'
  | 'flyers'
  | 'letterheads'
  | 'comp-slips'
  | 'envelopes'
  | 'stickers'
  | 'posters'
  | 'roll-up-banners'
  | 'pvc-banners'
  | 'canvas';

/** The tint family a product shares with its artwork tiles everywhere it appears. */
export type TintFamily = 'card' | 'paper' | 'mail' | 'label' | 'large' | 'fabric';

export interface Product {
  key: ProductKey;
  press: 'sheet' | 'large-format';
  family: TintFamily;
  /** Lucide icon name — one per family, reused wherever the family appears. */
  icon: string;
  /** Materials that can make this product. Anything absent is simply not offered. */
  materials: readonly MaterialKey[];
  /** Preset size keys, or `custom` for anything off the roll. */
  sizes: readonly string[];
  /** Whether both sides make sense. */
  sidesChoice: boolean;
  finishes: readonly FinishKey[];
  packaging: readonly PackagingKey[];
  /** Large format is 1–20 with no breaks; sheet work uses the break chips. */
  quantityMode: 'breaks' | 'small-run';
  /** The quantity the products grid's "from" figure is quoted at. */
  fromQuantity: number;
}

/**
 * Materials that cannot make a product are ABSENT here, not disabled. A finish
 * that a material cannot take IS listed and gets disabled with its reason —
 * the difference matters: "we don't print letterheads on PVC" is not a thing a
 * customer needs explained, but "matt lamination isn't offered on 510gsm PVC"
 * is, because they picked the PVC themselves.
 */
export const PRODUCTS: readonly Product[] = [
  {
    key: 'business-cards',
    press: 'sheet',
    family: 'card',
    icon: 'credit-card',
    materials: ['silk-350', 'uncoated-300'],
    sizes: ['business-card'],
    sidesChoice: true,
    finishes: ['none', 'gloss-lam', 'matt-lam', 'soft-touch', 'spot-uv', 'round-corners'],
    packaging: ['bundled', 'shrink-wrapped', 'boxed'],
    quantityMode: 'breaks',
    fromQuantity: 100,
  },
  {
    key: 'folded-cards',
    press: 'sheet',
    family: 'card',
    icon: 'credit-card',
    materials: ['silk-350', 'uncoated-300'],
    sizes: ['a6', 'a5'],
    sidesChoice: true,
    finishes: ['none', 'gloss-lam', 'matt-lam', 'soft-touch'],
    packaging: ['bundled', 'shrink-wrapped', 'boxed'],
    quantityMode: 'breaks',
    fromQuantity: 100,
  },
  {
    key: 'flyers',
    press: 'sheet',
    family: 'paper',
    icon: 'file-text',
    materials: ['silk-170', 'silk-130', 'uncoated-300'],
    sizes: ['a6', 'a5', 'a4', 'dl'],
    sidesChoice: true,
    finishes: ['none', 'gloss-lam', 'matt-lam'],
    packaging: ['bundled', 'shrink-wrapped', 'boxed'],
    quantityMode: 'breaks',
    fromQuantity: 250,
  },
  {
    key: 'letterheads',
    press: 'sheet',
    family: 'paper',
    icon: 'file-text',
    materials: ['silk-130', 'uncoated-300'],
    sizes: ['a4', 'us-letter'],
    sidesChoice: true,
    finishes: ['none'],
    packaging: ['bundled', 'shrink-wrapped', 'boxed'],
    quantityMode: 'breaks',
    fromQuantity: 250,
  },
  {
    key: 'comp-slips',
    press: 'sheet',
    family: 'paper',
    icon: 'file-text',
    materials: ['silk-130', 'silk-170', 'uncoated-300'],
    sizes: ['dl'],
    sidesChoice: true,
    finishes: ['none'],
    packaging: ['bundled', 'shrink-wrapped', 'boxed'],
    quantityMode: 'breaks',
    fromQuantity: 250,
  },
  {
    key: 'envelopes',
    press: 'sheet',
    family: 'mail',
    icon: 'mail',
    materials: ['uncoated-300', 'silk-130'],
    sizes: ['dl-envelope', 'c5'],
    sidesChoice: false,
    finishes: ['none'],
    packaging: ['bundled', 'boxed'],
    quantityMode: 'breaks',
    fromQuantity: 250,
  },
  {
    key: 'stickers',
    press: 'sheet',
    family: 'label',
    icon: 'sticker',
    materials: ['silk-170', 'vinyl'],
    sizes: ['a6', 'a5'],
    sidesChoice: false,
    finishes: ['none', 'gloss-lam', 'matt-lam', 'round-corners'],
    packaging: ['bundled', 'shrink-wrapped'],
    quantityMode: 'breaks',
    fromQuantity: 100,
  },
  {
    key: 'posters',
    press: 'sheet',
    family: 'paper',
    icon: 'image',
    materials: ['silk-170', 'silk-130'],
    sizes: ['a4', 'a3'],
    sidesChoice: false,
    finishes: ['none', 'gloss-lam', 'matt-lam'],
    packaging: ['bundled', 'shrink-wrapped'],
    quantityMode: 'breaks',
    fromQuantity: 50,
  },
  {
    key: 'roll-up-banners',
    press: 'large-format',
    family: 'large',
    icon: 'flag',
    materials: ['pvc-510'],
    sizes: ['custom'],
    sidesChoice: false,
    finishes: ['plain-edges', 'hemmed', 'pole-pockets'],
    packaging: ['bundled'],
    quantityMode: 'small-run',
    fromQuantity: 1,
  },
  {
    key: 'pvc-banners',
    press: 'large-format',
    family: 'large',
    icon: 'flag',
    materials: ['pvc-510', 'mesh-270'],
    sizes: ['custom'],
    sidesChoice: false,
    finishes: ['plain-edges', 'hemmed', 'pole-pockets'],
    packaging: ['bundled'],
    quantityMode: 'small-run',
    fromQuantity: 1,
  },
  {
    key: 'canvas',
    press: 'large-format',
    family: 'fabric',
    icon: 'image',
    materials: ['canvas-380'],
    sizes: ['custom'],
    sidesChoice: false,
    finishes: ['stretched', 'rolled'],
    packaging: ['bundled'],
    quantityMode: 'small-run',
    fromQuantity: 1,
  },
];

export const PRODUCT_BY_KEY: Readonly<Record<ProductKey, Product>> = Object.fromEntries(
  PRODUCTS.map((p) => [p.key, p]),
) as Record<ProductKey, Product>;

/**
 * The compatibility matrix. Every entry returns a REASON, not a boolean,
 * because the UI renders the reason on the disabled chip — a chip that is grey
 * with no explanation is the thing this whole design is arguing against.
 *
 * Keys are `<finish>@<material>`; the value is an i18n key under `reason.*`.
 */
const INCOMPATIBLE: Readonly<Record<string, string>> = {
  'matt-lam@pvc-510': 'reason.mattOnPvc',
  'matt-lam@mesh-270': 'reason.mattOnMesh',
  'gloss-lam@pvc-510': 'reason.glossOnPvc',
  'gloss-lam@mesh-270': 'reason.glossOnMesh',
  'soft-touch@silk-170': 'reason.softTouchNeedsBoard',
  'soft-touch@silk-130': 'reason.softTouchNeedsBoard',
  'spot-uv@uncoated-300': 'reason.spotUvNeedsLaminate',
  'spot-uv@silk-170': 'reason.spotUvNeedsLaminate',
  'spot-uv@silk-130': 'reason.spotUvNeedsLaminate',
  'round-corners@silk-350': 'reason.roundCornersTooHeavy',
};

/**
 * Why this finish cannot be had on this material, or null when it can.
 * The returned string is an i18n KEY — the caller translates it, so the same
 * matrix serves all eight locales.
 */
export function incompatibleReason(finish: FinishKey, material: MaterialKey): string | null {
  return INCOMPATIBLE[`${finish}@${material}`] ?? null;
}
