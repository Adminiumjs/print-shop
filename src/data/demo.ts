/**
 * The seeded fiction, and the pinned clock.
 *
 * Marlow Press is an invented nine-person print works in a market town, and
 * every customer in here is an invented small business that is clearly not a
 * real firm. Nothing in this file reads a real clock: `NOW` is Wednesday,
 * 5 August 2026, 10:20, and every due chip, promise date and turnaround figure
 * in the app is derived from it.
 *
 * References run MP-4098 … MP-4126; the next order placed in the demo takes
 * MP-4127, which is why the confirmation screen can name it before it exists.
 */

import type { Job, StockRow } from '../lib/jobs.ts';
import type { ArtworkRecord, Customer, Now, SavedQuote } from './types.ts';

export const NOW: Now = { iso: '2026-08-05', hour: 10, minute: 20 };

/** The reference the next order takes. The seed deliberately stops one short. */
export const NEXT_REF = 'MP-4127';

/**
 * The seven, each with somewhere the van can actually deliver.
 *
 * TWO RIVERS IS THE SEEDED REFUSAL, and it is one wrong field rather than a
 * flag that says "fail here": the shop is posting to the customer's new branch
 * across the water and typed the old GB postcode onto an IE address. A carrier
 * refuses that on its own postcode check, so the dispatch screen's failure path
 * is real, and fixing the postcode there makes the retry genuinely succeed.
 */
export const CUSTOMERS: readonly Customer[] = [
  {
    key: 'harbour',
    name: 'Harbour Bakery',
    email: 'orders@harbourbakery.example',
    town: 'Marlow',
    address: { lines: ['12 Quay Street'], city: 'Marlow', postcode: 'ML7 1AA', country: 'GB' },
  },
  {
    key: 'fenwick',
    name: 'Fenwick & Sons',
    email: 'office@fenwickandsons.example',
    town: 'Marlow',
    address: {
      lines: ['Fenwick Yard', 'Bell Street'],
      city: 'Marlow',
      postcode: 'ML7 3RH',
      country: 'GB',
    },
  },
  {
    key: 'bramble',
    name: 'Bramble Yoga',
    email: 'hello@brambleyoga.example',
    town: 'Nether Wold',
    address: {
      lines: ['The Old Chapel', 'Wold Lane'],
      city: 'Nether Wold',
      postcode: 'NW3 5QP',
      country: 'GB',
    },
  },
  {
    key: 'tworivers',
    name: 'Two Rivers Cycles',
    email: 'shop@tworiverscycles.example',
    town: 'Marlow',
    address: {
      lines: ['Unit 4, Canal Wharf'],
      city: 'Dún Laoghaire',
      // A GB postcode on an IE address — the seeded refusal. See above.
      postcode: 'ML9 4TT',
      country: 'IE',
    },
  },
  {
    key: 'ostara',
    name: 'Ostara Flowers',
    email: 'post@ostaraflowers.example',
    town: 'Kingsbridge',
    address: { lines: ['7 Fore Street'], city: 'Kingsbridge', postcode: 'KB2 8LN', country: 'GB' },
  },
  {
    key: 'kestrel',
    name: 'Kestrel Joinery',
    email: 'workshop@kestreljoinery.example',
    town: 'Nether Wold',
    address: {
      lines: ['The Joinery Shop', 'Wold Lane'],
      city: 'Nether Wold',
      postcode: 'NW3 6BD',
      country: 'GB',
    },
  },
  {
    key: 'gallery',
    name: 'The Little Gallery',
    email: 'front@thelittlegallery.example',
    town: 'Marlow',
    address: { lines: ['2a Market Square'], city: 'Marlow', postcode: 'ML7 1DE', country: 'GB' },
  },
];

export const CUSTOMER_BY_KEY: Readonly<Record<string, Customer>> = Object.fromEntries(
  CUSTOMERS.map((c) => [c.key, c]),
);

/**
 * Fourteen live jobs across the four columns.
 *
 * Two are locked with no proof sent at all (waiting on artwork), three have a
 * proof sent and are waiting on the customer, and one — MP-4118 — is past its
 * promise and reads as overdue against the pinned clock. Those three facts are
 * what the board's KPI chips count, so they are seeded rather than incidental.
 */
export const JOBS: readonly Job[] = [
  // ── PREPRESS ───────────────────────────────────────────────────────────────
  {
    ref: 'MP-4113',
    productKey: 'business-cards',
    materialKey: 'silk-350',
    customer: 'harbour',
    quantity: 500,
    trimWidthMm: 85,
    trimHeightMm: 55,
    sides: 2,
    finishKey: 'matt-lam',
    packagingKey: 'boxed',
    stage: 'ordered',
    promisedFor: '2026-08-11',
    express: false,
    proofs: [],
    spoiledSheets: 0,
  },
  {
    ref: 'MP-4114',
    productKey: 'flyers',
    materialKey: 'silk-170',
    customer: 'bramble',
    quantity: 250,
    trimWidthMm: 105,
    trimHeightMm: 148,
    sides: 2,
    finishKey: 'none',
    packagingKey: 'bundled',
    stage: 'ordered',
    promisedFor: '2026-08-12',
    express: false,
    proofs: [],
    spoiledSheets: 0,
  },
  {
    ref: 'MP-4115',
    productKey: 'letterheads',
    materialKey: 'silk-130',
    customer: 'fenwick',
    quantity: 1000,
    trimWidthMm: 210,
    trimHeightMm: 297,
    sides: 1,
    finishKey: 'none',
    packagingKey: 'boxed',
    stage: 'proofed',
    promisedFor: '2026-08-10',
    express: false,
    proofs: [{ kind: 'sent', at: '2026-08-04' }],
    spoiledSheets: 0,
  },
  {
    ref: 'MP-4116',
    productKey: 'folded-cards',
    materialKey: 'uncoated-300',
    customer: 'ostara',
    quantity: 250,
    trimWidthMm: 105,
    trimHeightMm: 148,
    sides: 2,
    finishKey: 'soft-touch',
    packagingKey: 'boxed',
    stage: 'proofed',
    promisedFor: '2026-08-07',
    express: false,
    proofs: [
      { kind: 'sent', at: '2026-08-03' },
      { kind: 'change-asked', at: '2026-08-04', note: 'Move the address block down a shade — it sits too close to the fold.' },
      { kind: 'sent', at: '2026-08-04' },
    ],
    spoiledSheets: 0,
  },
  {
    ref: 'MP-4117',
    productKey: 'stickers',
    materialKey: 'vinyl',
    customer: 'tworivers',
    quantity: 500,
    trimWidthMm: 105,
    trimHeightMm: 148,
    sides: 1,
    finishKey: 'gloss-lam',
    packagingKey: 'shrink-wrapped',
    stage: 'proofed',
    promisedFor: '2026-08-06',
    express: true,
    proofs: [{ kind: 'sent', at: '2026-08-05' }],
    spoiledSheets: 0,
  },

  // ── PRINTING ───────────────────────────────────────────────────────────────
  {
    ref: 'MP-4118',
    productKey: 'posters',
    materialKey: 'silk-170',
    customer: 'gallery',
    quantity: 100,
    trimWidthMm: 297,
    trimHeightMm: 420,
    sides: 1,
    finishKey: 'matt-lam',
    packagingKey: 'bundled',
    stage: 'printing',
    // Past its promise against the pinned clock — the board's one overdue job.
    promisedFor: '2026-08-04',
    express: false,
    proofs: [
      { kind: 'sent', at: '2026-07-30' },
      { kind: 'approved', at: '2026-07-31' },
    ],
    spoiledSheets: 4,
  },
  {
    ref: 'MP-4119',
    productKey: 'business-cards',
    materialKey: 'uncoated-300',
    customer: 'kestrel',
    quantity: 250,
    trimWidthMm: 85,
    trimHeightMm: 55,
    sides: 2,
    finishKey: 'none',
    packagingKey: 'bundled',
    stage: 'printing',
    promisedFor: '2026-08-05',
    express: false,
    proofs: [
      { kind: 'sent', at: '2026-08-01' },
      { kind: 'approved', at: '2026-08-03' },
    ],
    spoiledSheets: 0,
  },
  {
    ref: 'MP-4120',
    productKey: 'comp-slips',
    materialKey: 'silk-130',
    customer: 'fenwick',
    quantity: 500,
    trimWidthMm: 210,
    trimHeightMm: 99,
    sides: 1,
    finishKey: 'none',
    packagingKey: 'bundled',
    stage: 'printing',
    promisedFor: '2026-08-06',
    express: false,
    proofs: [
      { kind: 'sent', at: '2026-08-03' },
      { kind: 'approved', at: '2026-08-03' },
    ],
    spoiledSheets: 0,
  },
  {
    ref: 'MP-4121',
    productKey: 'pvc-banners',
    materialKey: 'pvc-510',
    customer: 'bramble',
    quantity: 2,
    trimWidthMm: 900,
    trimHeightMm: 2000,
    sides: 1,
    finishKey: 'hemmed',
    packagingKey: 'bundled',
    stage: 'printing',
    promisedFor: '2026-08-07',
    express: false,
    proofs: [
      { kind: 'sent', at: '2026-08-04' },
      { kind: 'approved', at: '2026-08-04' },
    ],
    spoiledSheets: 0,
  },

  // ── FINISHING ──────────────────────────────────────────────────────────────
  {
    ref: 'MP-4122',
    productKey: 'business-cards',
    materialKey: 'silk-350',
    customer: 'ostara',
    quantity: 1000,
    trimWidthMm: 85,
    trimHeightMm: 55,
    sides: 2,
    finishKey: 'soft-touch',
    packagingKey: 'boxed',
    stage: 'finishing',
    promisedFor: '2026-08-06',
    express: false,
    proofs: [
      { kind: 'sent', at: '2026-07-31' },
      { kind: 'approved', at: '2026-08-01' },
    ],
    spoiledSheets: 6,
  },
  {
    ref: 'MP-4123',
    productKey: 'envelopes',
    materialKey: 'uncoated-300',
    customer: 'harbour',
    quantity: 500,
    trimWidthMm: 220,
    trimHeightMm: 110,
    sides: 1,
    finishKey: 'none',
    packagingKey: 'boxed',
    stage: 'finishing',
    promisedFor: '2026-08-06',
    express: false,
    proofs: [
      { kind: 'sent', at: '2026-08-01' },
      { kind: 'approved', at: '2026-08-03' },
    ],
    spoiledSheets: 0,
  },
  {
    ref: 'MP-4124',
    productKey: 'canvas',
    materialKey: 'canvas-380',
    customer: 'gallery',
    quantity: 3,
    trimWidthMm: 600,
    trimHeightMm: 900,
    sides: 1,
    finishKey: 'stretched',
    packagingKey: 'bundled',
    stage: 'finishing',
    promisedFor: '2026-08-07',
    express: false,
    proofs: [
      { kind: 'sent', at: '2026-08-03' },
      { kind: 'approved', at: '2026-08-04' },
    ],
    spoiledSheets: 0,
  },

  // ── READY ──────────────────────────────────────────────────────────────────
  {
    ref: 'MP-4125',
    productKey: 'flyers',
    materialKey: 'silk-130',
    customer: 'tworivers',
    quantity: 1000,
    trimWidthMm: 148,
    trimHeightMm: 210,
    sides: 2,
    finishKey: 'none',
    packagingKey: 'boxed',
    stage: 'ready',
    promisedFor: '2026-08-05',
    express: false,
    proofs: [
      { kind: 'sent', at: '2026-07-30' },
      { kind: 'approved', at: '2026-07-31' },
    ],
    spoiledSheets: 2,
  },
  {
    ref: 'MP-4126',
    productKey: 'business-cards',
    materialKey: 'silk-350',
    customer: 'kestrel',
    quantity: 500,
    trimWidthMm: 85,
    trimHeightMm: 55,
    sides: 2,
    finishKey: 'matt-lam',
    packagingKey: 'boxed',
    stage: 'ready',
    promisedFor: '2026-08-05',
    express: false,
    proofs: [
      { kind: 'sent', at: '2026-07-31' },
      { kind: 'approved', at: '2026-08-01' },
    ],
    spoiledSheets: 0,
  },
];

/**
 * Jobs that already left the works. They give "Order it again" something real
 * to reorder and the customer lookup something to find besides live work.
 */
export const PAST_JOBS: readonly Job[] = [
  {
    ref: 'MP-4104',
    productKey: 'business-cards',
    materialKey: 'silk-350',
    customer: 'harbour',
    quantity: 250,
    trimWidthMm: 85,
    trimHeightMm: 55,
    sides: 2,
    finishKey: 'matt-lam',
    packagingKey: 'bundled',
    stage: 'collected',
    promisedFor: '2026-06-18',
    express: false,
    proofs: [
      { kind: 'sent', at: '2026-06-15' },
      { kind: 'approved', at: '2026-06-15' },
    ],
    spoiledSheets: 0,
    dispatch: { kind: 'collected', at: '2026-06-18' },
  },
  {
    ref: 'MP-4098',
    productKey: 'flyers',
    materialKey: 'silk-170',
    customer: 'bramble',
    quantity: 500,
    trimWidthMm: 105,
    trimHeightMm: 148,
    sides: 2,
    finishKey: 'none',
    packagingKey: 'bundled',
    stage: 'collected',
    promisedFor: '2026-05-22',
    express: false,
    proofs: [
      { kind: 'sent', at: '2026-05-19' },
      { kind: 'approved', at: '2026-05-20' },
    ],
    spoiledSheets: 0,
    dispatch: { kind: 'collected', at: '2026-05-22' },
  },
  {
    ref: 'MP-4107',
    productKey: 'posters',
    materialKey: 'silk-170',
    customer: 'gallery',
    quantity: 50,
    trimWidthMm: 297,
    trimHeightMm: 420,
    sides: 1,
    finishKey: 'none',
    packagingKey: 'bundled',
    stage: 'dispatched',
    promisedFor: '2026-07-02',
    express: false,
    proofs: [
      { kind: 'sent', at: '2026-06-29' },
      { kind: 'approved', at: '2026-06-29' },
    ],
    spoiledSheets: 0,
    dispatch: { kind: 'collected', at: '2026-07-02' },
  },
  {
    ref: 'MP-4110',
    productKey: 'comp-slips',
    materialKey: 'silk-130',
    customer: 'fenwick',
    quantity: 250,
    trimWidthMm: 210,
    trimHeightMm: 99,
    sides: 1,
    finishKey: 'none',
    packagingKey: 'bundled',
    stage: 'collected',
    promisedFor: '2026-07-24',
    express: false,
    proofs: [
      { kind: 'sent', at: '2026-07-21' },
      { kind: 'approved', at: '2026-07-21' },
    ],
    spoiledSheets: 0,
    dispatch: { kind: 'collected', at: '2026-07-24' },
  },
];

/** Two quotes saved from the configurator and never ordered. */
export const SAVED_QUOTES: readonly SavedQuote[] = [
  {
    ref: 'MP-4111',
    savedOn: '2026-07-29',
    customerKey: 'kestrel',
    label: 'Workshop cards, heavier board',
    config: {
      product: 'business-cards',
      material: 'silk-350',
      size: 'business-card',
      sides: 2,
      finish: 'soft-touch',
      quantity: 500,
      packaging: 'boxed',
      printedProof: false,
      express: false,
      delivery: 'band-2kg',
    },
  },
  {
    ref: 'MP-4112',
    savedOn: '2026-08-03',
    customerKey: 'bramble',
    config: {
      product: 'roll-up-banners',
      material: 'pvc-510',
      size: 'custom',
      customWidthMm: 850,
      customHeightMm: 2000,
      sides: 1,
      finish: 'hemmed',
      quantity: 1,
      packaging: 'bundled',
      printedProof: false,
      express: false,
      delivery: 'tube',
    },
  },
];

/**
 * Five sheet stocks and four roll media. `pvc-510` sits under its reorder point
 * — the one row the Materials screen flags in `--warn`.
 */
export const STOCK: readonly StockRow[] = [
  { key: 'silk-350', kind: 'sheet', onHand: 260, reorderAt: 80 },
  { key: 'uncoated-300', kind: 'sheet', onHand: 420, reorderAt: 100 },
  { key: 'silk-170', kind: 'sheet', onHand: 980, reorderAt: 200 },
  { key: 'silk-130', kind: 'sheet', onHand: 1240, reorderAt: 250 },
  { key: 'silk-350-sra2', kind: 'sheet', onHand: 120, reorderAt: 40 },
  { key: 'pvc-510', kind: 'roll', onHand: 18, reorderAt: 25 },
  { key: 'mesh-270', kind: 'roll', onHand: 46, reorderAt: 20 },
  { key: 'canvas-380', kind: 'roll', onHand: 32, reorderAt: 15 },
  { key: 'vinyl', kind: 'roll', onHand: 58, reorderAt: 20 },
];

/**
 * Artwork on file, with the numbers the checks measured. MP-4115's second page
 * is the one warning in the seed — ink 1.8mm from the trim, which the customer
 * has to tick to accept rather than something the works quietly prints.
 */
export const ARTWORK: readonly ArtworkRecord[] = [
  {
    jobRef: 'MP-4113',
    filename: 'harbour-cards-front.pdf',
    widthPx: 1075,
    heightPx: 721,
    widthMm: 91,
    heightMm: 61,
    bleedMm: 3,
    nearestInkMm: 5.2,
    colourSpace: 'CMYK',
    fontsEmbedded: true,
    pages: 2,
  },
  {
    jobRef: 'MP-4115',
    filename: 'fenwick-letterhead.pdf',
    widthPx: 2551,
    heightPx: 3579,
    widthMm: 216,
    heightMm: 303,
    bleedMm: 3,
    nearestInkMm: 1.8,
    colourSpace: 'CMYK',
    fontsEmbedded: true,
    pages: 1,
  },
  {
    jobRef: 'MP-4118',
    filename: 'gallery-autumn-poster.pdf',
    widthPx: 3579,
    heightPx: 5031,
    widthMm: 303,
    heightMm: 426,
    bleedMm: 3,
    nearestInkMm: 8,
    colourSpace: 'CMYK',
    fontsEmbedded: true,
    pages: 1,
  },
  {
    jobRef: 'MP-4116',
    filename: 'ostara-folded-card.pdf',
    widthPx: 1311,
    heightPx: 1831,
    widthMm: 111,
    heightMm: 154,
    bleedMm: 3,
    nearestInkMm: 6.4,
    colourSpace: 'CMYK',
    fontsEmbedded: true,
    pages: 2,
  },
];

/** The works' own address, for the dispatch panel and Find us. */
export const WORKS = {
  name: 'Marlow Press',
  lines: ['3 Market Square'],
  city: 'Marlow',
  postcode: 'ML1 2QT',
  country: 'United Kingdom',
  /**
   * ISO 3166-1 alpha-2, beside the name a reader sees.
   *
   * A carrier checks a postcode against a COUNTRY CODE, and "United Kingdom" is
   * display text — so the works' own address carries both rather than making
   * whoever needs the code translate the name back into one.
   */
  countryCode: 'GB',
  established: 1994,
  people: 9,
} as const;
