/**
 * Marlow Press's Wednesday: the one source of the app's sample data.
 *
 * `npm run sample` writes two files from this module:
 *
 *   seeds/printing.sample.json             the works itself: its settings and
 *                                           rate card (materials, sizes,
 *                                           finishes, breaks, packaging,
 *                                           delivery bands, the option rules),
 *                                           its machines and closures, the
 *                                           customers, their orders and saved
 *                                           quotes, the sample pack posted;
 *   seeds/printing.customiser.sample.json  the Customiser's rows for Marlow
 *                                           Press (its business-card and A5
 *                                           flyer bases, the eight ready-made
 *                                           designs, Harbour Bakery's ordered
 *                                           card), copied from the Customiser's
 *                                           own `seeds/printing.sample.json`
 *                                           (`customiser-rows.json`), and the
 *                                           works' rows that link into them:
 *                                           the products and their options,
 *                                           every job with its features and
 *                                           proofs, the saved quotes' lines.
 *
 * Every product row is in the second file because two of them are designed on
 * a Customiser base, and a row of the first file cannot point at a row of the
 * second; a job follows its product, a proof its job. The Customiser is
 * required, so both files always go in together.
 *
 * The data are the comps' (`marlow-press-data.js`, `marlow-customiser-data.js`):
 * the rate card's own figures, the eleven products, the fifteen live jobs
 * MP-4112 to MP-4126 and their proofs, the two saved quotes, Harbour Bakery's
 * sample pack. Two jobs are put right: MP-4114 sits in prepress with its second
 * proof waiting (nothing is printed before a yes), and MP-4113's ready-by is
 * counted from its approval.
 *
 * Every figure the screens show is Adminium's: each job's price and weight,
 * worked out from the rate card as the job goes in (they come to the comp's
 * own quote of it, `JOB_FIGURES`), an order's goods, its delivery band and
 * price, its tax and total. What Adminium never
 * works out for history is written here: each job's ready-by (a stamp, which
 * sample data never fires).
 *
 * The works' clock is pinned to Wednesday 5 August 2026, 10:20, as the comps
 * draw it: every date is a `@week` day from the bundle's Wednesday, so it
 * keeps its weekday whatever day the sample is added on. The closures are
 * the exception: a bank holiday keeps its own date. The orders and quotes
 * carry their own numbers (MP-4112 to MP-4126, MQ-2037 and MQ-2041) and no
 * running number, so the works' own next order is MP-4127 and its next quote
 * MQ-2042. Addresses mailed end in `.example`, which Adminium never mails.
 */
import CUSTOMISER_ROWS from "./customiser-rows.json" with { type: "json" };


type Value = unknown;
type Row = Record<string, Value>;
interface Table {
  ref: string;
  own?: true;
  onlyIfEmpty?: true;
  rows: Row[];
}
export interface SampleBundle {
  format: "adminium.sample/1";
  app: "printing";
  addOn?: "customiser";
  weekAnchor: "wed";
  tables: Table[];
}

// ── the clock ───────────────────────────────────────────────────────────────

/** The day the sample is written for: Wednesday 5 August 2026. */
export const TODAY = "2026-08-05";
export const NOW_TIME = "10:20";
export const CUTOFF = "14:00";
/** Monday to Friday. */
export const WORKING_DAYS = [1, 2, 3, 4, 5];
/**
 * The bank holidays the works is shut: the rest of 2026's in England and
 * Wales, as Holiday calendars has them. Their own dates on every clock, never
 * moved with the sample's week; 2027's are the owner's to add from Holiday
 * calendars.
 */
export const CLOSURES = [
  { from: "2026-08-31", to: "2026-08-31", reason: "Summer bank holiday" },
  { from: "2026-12-25", to: "2026-12-25", reason: "Christmas Day" },
  { from: "2026-12-28", to: "2026-12-28", reason: "Boxing Day, observed" },
];

const parse = (iso: string): Date => {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d));
};
const isoOf = (d: Date): string => d.toISOString().slice(0, 10);
export const addDays = (iso: string, n: number): string => {
  const d = parse(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return isoOf(d);
};
/** Days from the bundle's Wednesday. */
const offset = (iso: string): number => Math.round((parse(iso).getTime() - parse(TODAY).getTime()) / 86_400_000);
const day = (iso: string): Row => ({ "@day": offset(iso), "@week": true });
const wall = (iso: string, time: string): Row => ({ "@day": offset(iso), "@time": time, "@week": true });

const isWorkday = (iso: string): boolean => WORKING_DAYS.includes(parse(iso).getUTCDay()) && !CLOSURES.some((c) => iso >= c.from && iso <= c.to);
const nextWorkday = (iso: string): string => {
  let d = addDays(iso, 1);
  while (!isWorkday(d)) d = addDays(d, 1);
  return d;
};
/**
 * The ready-by of a job counted from `iso` at `time`: it comes in that day
 * when that is a working day and it is before two, else on the next working
 * day; the date is the `days`-th working day after that. The same count
 * Adminium makes (`addWorkingDays`), for rows Adminium never stamps.
 */
export function readyBy(iso: string, time: string, days: number): string {
  let d = isWorkday(iso) && time < CUTOFF ? iso : nextWorkday(iso);
  for (let left = days; left > 0; left -= 1) d = nextWorkday(d);
  return d;
}

// ── the works and its rate card (`rate-card.ts`) ──────────────────────────────

import { BREAKS, DELIVERY_BANDS, FINISHES, MATERIALS, OPTION_RULES, PACKAGING, SETTINGS, SIZES } from "./rate-card.ts";

export { BREAKS, DELIVERY_BANDS, FINISHES, MATERIALS, OPTION_RULES, PACKAGING, SETTINGS, SIZES };

const materialByCode = new Map(MATERIALS.map((m) => [m.code, m]));
const sizeByCode = new Map(SIZES.map((s) => [s.code, s]));

const MACHINES = [
  { code: "press", name: "Sheet press", kind: "press", detail: "SRA3, 320 × 450 mm sheets, both sides" },
  { code: "wide", name: "Wide-format printer", kind: "wide", detail: "1370 mm roll" },
  { code: "laminator", name: "Laminator", kind: "finishing", detail: "SRA3, gloss, matt and soft-touch" },
];

// ── the products ────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  family: string;
  icon: string;
  line: string;
  materials: string[];
  sizes: string[];
  sides: ("single" | "double")[];
  defSides: "single" | "double";
  finishes: string[];
  from: number;
  lfDefault?: { w: number; h: number };
  frame?: { w: number; h: number };
  /** The Customiser's base it is designed on, by the Customiser sample's label. */
  base?: string;
  /** The Customiser's priced features it offers, by its sample's label and code. */
  features?: { label: string; code: string; name: string }[];
}
const PRINT_BACK = { label: "feature:printing-back", code: "print-back", name: "Print the back" };

/** The eleven products the works prints (data 128-194). */
export const PRODUCTS: Product[] = [
  { id: "business-cards", name: "Business cards", family: "card", icon: "credit-card", line: "Printed one or both sides on heavy board, trimmed square.", materials: ["silk350", "uncoated300"], sizes: ["bcard"], sides: ["single", "double"], defSides: "double", finishes: ["gloss", "matt", "soft", "spotuv", "corners"], from: 100, base: "base:cards", features: [PRINT_BACK] },
  { id: "folded-cards", name: "Folded cards", family: "card", icon: "credit-card", line: "Creased and folded to a card — greetings, menus, invitations.", materials: ["silk350", "uncoated300", "silk170"], sizes: ["a6", "a5"], sides: ["single", "double"], defSides: "double", finishes: ["gloss", "matt", "soft"], from: 100 },
  { id: "flyers", name: "Flyers & leaflets", family: "paper", icon: "file-text", line: "Single sheets for the hand or the letterbox.", materials: ["silk170", "silk130", "uncoated300"], sizes: ["a6", "a5", "a4", "dl"], sides: ["single", "double"], defSides: "double", finishes: ["gloss", "matt", "spotuv"], from: 100, base: "base:flyer-a5", features: [PRINT_BACK] },
  { id: "letterheads", name: "Letterheads", family: "paper", icon: "file-text", line: "Your heading on good stock, one or both sides.", materials: ["silk130", "silk170", "uncoated300"], sizes: ["a4", "usletter"], sides: ["single", "double"], defSides: "single", finishes: [], from: 100 },
  { id: "comp-slips", name: "Compliment slips", family: "paper", icon: "file-text", line: "A short note to go in with an order.", materials: ["silk130", "silk170"], sizes: ["dl"], sides: ["single", "double"], defSides: "single", finishes: [], from: 100 },
  { id: "envelopes", name: "Envelopes", family: "mail", icon: "mail", line: "Printed direct onto the envelope, one side.", materials: ["silk130", "uncoated300"], sizes: ["dlenv", "c5"], sides: ["single"], defSides: "single", finishes: [], from: 250 },
  { id: "stickers", name: "Stickers & labels", family: "sticker", icon: "sticker", line: "Paper labels by the sheet, or cut vinyl for outdoors.", materials: ["silk170", "vinyl"], sizes: ["sq95", "a6", "a5"], sides: ["single"], defSides: "single", finishes: ["gloss", "matt"], from: 100 },
  { id: "posters", name: "Posters", family: "image", icon: "image", line: "Sheet-printed posters up to A3.", materials: ["silk170", "silk130"], sizes: ["a4", "a3"], sides: ["single"], defSides: "single", finishes: ["matt"], from: 50 },
  { id: "rollups", name: "Roll-up banners", family: "banner", icon: "flag", line: "The printed media for a pull-up stand.", materials: ["pvc510", "mesh270"], sizes: [], sides: ["single"], defSides: "single", finishes: ["plain", "hemmed"], from: 1, lfDefault: { w: 850, h: 2000 } },
  { id: "pvc-banners", name: "PVC banners", family: "banner", icon: "flag", line: "Outdoor banner by the metre, finished to hang.", materials: ["pvc510", "mesh270"], sizes: [], sides: ["single"], defSides: "single", finishes: ["plain", "hemmed", "pockets"], from: 1, lfDefault: { w: 1200, h: 2000 } },
  { id: "canvas", name: "Canvas prints", family: "image", icon: "image", line: "Cotton canvas, rolled or stretched on a frame.", materials: ["canvas380"], sizes: [], sides: ["single"], defSides: "single", finishes: ["rolled", "stretched"], from: 1, lfDefault: { w: 600, h: 800 }, frame: { w: 1000, h: 1400 } },
];
const productById = new Map(PRODUCTS.map((p) => [p.id, p]));

const SIDE_NAMES = { single: "Single-sided", double: "Double-sided" } as const;
/** A product's laminations, by sides: gloss and matt are a look within them at the same price (data 216). */
const laminations = (p: Product): string[] => [
  ...(p.finishes.includes("gloss") || p.finishes.includes("matt") ? ["lam-one", "lam-both"] : []),
  ...(p.finishes.includes("soft") ? ["lam-soft"] : []),
];
const finishOptions = (p: Product): { kind: string; code: string }[] => [
  ...laminations(p).map((code) => ({ kind: "lamination", code })),
  ...(p.finishes.includes("spotuv") ? [{ kind: "spot_uv", code: "spot-uv" }] : []),
  ...(p.finishes.includes("corners") ? [{ kind: "corners", code: "corners" }] : []),
  ...p.finishes.filter((f) => ["plain", "hemmed", "pockets"].includes(f)).map((code) => ({ kind: "edges", code })),
  ...p.finishes.filter((f) => ["rolled", "stretched"].includes(f)).map((code) => ({ kind: "canvas", code })),
];

// ── the customers, their jobs, quotes and sample pack ───────────────────────

interface Config {
  productId: string;
  materialId: string;
  sizeId?: string;
  custom?: { w: number; h: number };
  sides: "single" | "double";
  /** A lamination by its finish code, and its look. */
  lam?: "lam-one" | "lam-both" | "lam-soft";
  look?: "gloss" | "matt";
  bannerFin?: "plain" | "hemmed" | "pockets";
  canvasFin?: "rolled" | "stretched";
  qty: number;
  packaging?: "bundled" | "shrink" | "boxed";
  /** How it reaches the customer: one of the comp's delivery choices. */
  delivery: "collect" | "light" | "mid" | "heavy" | "tube";
}
interface Proof {
  version: number;
  sent: string;
  note: string | null;
  answer?: { state: "approved" | "change_asked"; on: string; note?: string };
}
interface Job {
  ref: number;
  customer: string;
  cfg: Config;
  stage: "prepress" | "printing" | "finishing" | "ready";
  ordered: string;
  /** The ready-by the board shows. */
  due: string;
  proofs: Proof[];
  /** The Customiser design it is printed from, by the Customiser sample's label. */
  design?: string;
}

/**
 * The comp's quote of each job and saved quote, ex tax and without its
 * delivery, and its weight (`quote()`, data 260-382, run at the pinned clock):
 * what Adminium's own price of the sample comes to, which the contract holds
 * it to.
 */
export const JOB_FIGURES: Record<string, { price: number; weight: number }> = {
  "MP-4126": { price: 70.96, weight: 1.02 },
  "MP-4125": { price: 106.81, weight: 2.23 },
  "MP-4124": { price: 489.8, weight: 5.48 },
  "MP-4123": { price: 294, weight: 3.36 },
  "MP-4122": { price: 99.27, weight: 1.56 },
  "MP-4121": { price: 61.44, weight: 0.47 },
  "MP-4120": { price: 83.28, weight: 2.46 },
  "MP-4119": { price: 71.22, weight: 1.55 },
  "MP-4118": { price: 225.95, weight: 4.24 },
  "MP-4117": { price: 65.6, weight: 1.17 },
  "MP-4116": { price: 59.05, weight: 0.86 },
  "MP-4115": { price: 23.17, weight: 0.34 },
  "MP-4114": { price: 338.65, weight: 5.5 },
  "MP-4113": { price: 630, weight: 9.48 },
  "MP-4112": { price: 70.96, weight: 1.02 },
  "MQ-2041": { price: 192.09, weight: 1.97 },
  "MQ-2037": { price: 156.16, weight: 2.32 },
};

const sent = (date: string, note: string | null = null, answer?: Proof["answer"]): Proof => ({ version: 1, sent: date, note, ...(answer === undefined ? {} : { answer }) });
const approvedOn = (date: string) => ({ state: "approved" as const, on: date });

/** The live jobs (data 516-531), one order each, with the proof history (553-560). */
export const JOBS: Job[] = [
  { ref: 4126, customer: "Harbour Bakery", cfg: { productId: "business-cards", materialId: "silk350", sizeId: "bcard", sides: "double", lam: "lam-both", look: "matt", qty: 500, packaging: "boxed", delivery: "light" }, stage: "printing", ordered: "2026-07-31", due: "2026-08-10", proofs: [sent("2026-07-31", "Proof by email.", approvedOn("2026-08-01"))] },
  { ref: 4125, customer: "Fenwick & Sons", cfg: { productId: "letterheads", materialId: "silk130", sizeId: "a4", sides: "single", qty: 250, packaging: "bundled", delivery: "light" }, stage: "finishing", ordered: "2026-07-31", due: "2026-08-07", proofs: [sent("2026-08-01", null, approvedOn("2026-08-01"))] },
  { ref: 4124, customer: "Bramble Yoga", cfg: { productId: "flyers", materialId: "silk170", sizeId: "a5", sides: "double", lam: "lam-both", look: "gloss", qty: 1000, packaging: "shrink", delivery: "mid" }, stage: "printing", ordered: "2026-07-31", due: "2026-08-10", proofs: [sent("2026-07-31", null, approvedOn("2026-08-03"))] },
  { ref: 4123, customer: "Two Rivers Cycles", cfg: { productId: "pvc-banners", materialId: "pvc510", custom: { w: 2000, h: 1000 }, sides: "single", bannerFin: "hemmed", qty: 3, delivery: "tube" }, stage: "prepress", ordered: "2026-07-31", due: "2026-08-06", proofs: [sent("2026-08-04", "Proof by email.")] },
  { ref: 4122, customer: "Ostara Flowers", cfg: { productId: "folded-cards", materialId: "silk350", sizeId: "a6", sides: "double", lam: "lam-soft", qty: 250, packaging: "boxed", delivery: "light" }, stage: "prepress", ordered: "2026-07-31", due: "2026-08-06", proofs: [] },
  { ref: 4121, customer: "Kestrel Joinery", cfg: { productId: "stickers", materialId: "vinyl", sizeId: "sq95", sides: "single", qty: 100, packaging: "bundled", delivery: "light" }, stage: "prepress", ordered: "2026-07-31", due: "2026-08-05", proofs: [sent("2026-08-04", "Cut line shown in magenta.")] },
  { ref: 4120, customer: "The Little Gallery", cfg: { productId: "canvas", materialId: "canvas380", custom: { w: 800, h: 600 }, sides: "single", canvasFin: "stretched", qty: 2, delivery: "heavy" }, stage: "finishing", ordered: "2026-07-31", due: "2026-08-07", proofs: [sent("2026-07-31", null, approvedOn("2026-08-03"))] },
  { ref: 4119, customer: "Marsh Lane Dental", cfg: { productId: "comp-slips", materialId: "silk130", sizeId: "dl", sides: "single", qty: 500, packaging: "bundled", delivery: "light" }, stage: "ready", ordered: "2026-07-31", due: "2026-08-04", proofs: [sent("2026-07-31", null, approvedOn("2026-07-31"))] },
  { ref: 4118, customer: "Coble & Co", cfg: { productId: "flyers", materialId: "silk130", sizeId: "a6", sides: "double", qty: 2000, packaging: "boxed", delivery: "mid" }, stage: "printing", ordered: "2026-07-31", due: "2026-08-10", proofs: [sent("2026-07-31", null, approvedOn("2026-08-03"))] },
  { ref: 4117, customer: "Wold Cricket Club", cfg: { productId: "rollups", materialId: "pvc510", custom: { w: 850, h: 2000 }, sides: "single", bannerFin: "plain", qty: 1, delivery: "tube" }, stage: "prepress", ordered: "2026-07-31", due: "2026-08-06", proofs: [] },
  { ref: 4116, customer: "Harbour Bakery", cfg: { productId: "stickers", materialId: "silk170", sizeId: "a6", sides: "single", lam: "lam-one", look: "gloss", qty: 250, packaging: "bundled", delivery: "light" }, stage: "finishing", ordered: "2026-07-31", due: "2026-08-07", proofs: [sent("2026-07-31", null, approvedOn("2026-08-03"))] },
  { ref: 4115, customer: "Fenwick & Sons", cfg: { productId: "business-cards", materialId: "uncoated300", sizeId: "bcard", sides: "single", qty: 100, packaging: "bundled", delivery: "collect" }, stage: "ready", ordered: "2026-07-31", due: "2026-08-04", proofs: [sent("2026-07-31", null, approvedOn("2026-07-31"))] },
  // In prepress with its second proof waiting: nothing is printed before a yes. A change asked moves its ready-by a day.
  {
    ref: 4114,
    customer: "Bramble Yoga",
    cfg: { productId: "posters", materialId: "silk170", sizeId: "a3", sides: "single", lam: "lam-one", look: "matt", qty: 250, packaging: "bundled", delivery: "mid" },
    stage: "prepress",
    ordered: "2026-07-31",
    due: "2026-08-11",
    proofs: [
      { version: 1, sent: "2026-07-31", note: "Proof by email.", answer: { state: "change_asked", on: "2026-08-03", note: "Make the date line bigger." } },
      { version: 2, sent: "2026-08-04", note: "Second proof." },
    ],
  },
  // Approved on Monday morning: ready three working days on, Thursday.
  { ref: 4113, customer: "Harbour Bakery", cfg: { productId: "pvc-banners", materialId: "pvc510", custom: { w: 3000, h: 1000 }, sides: "single", bannerFin: "pockets", qty: 6, delivery: "heavy" }, stage: "prepress", ordered: "2026-07-31", due: readyBy("2026-08-03", "11:00", 3), proofs: [sent("2026-07-31", "Proof by email.", approvedOn("2026-08-03"))] },
  { ref: 4112, customer: "Harbour Bakery", cfg: { productId: "business-cards", materialId: "silk350", sizeId: "bcard", sides: "double", lam: "lam-both", look: "matt", qty: 500, packaging: "boxed", delivery: "light" }, stage: "prepress", ordered: "2026-08-03", due: "2026-08-10", proofs: [sent("2026-08-04", "Made from the customer's design in the customiser.")], design: "design:mp-4112" },
];

/** Two quotes saved and never ordered (data 547-550). */
export const SAVED_QUOTES = [
  { ref: "MQ-2041", customer: "Two Rivers Cycles", created: "2026-07-22", cfg: { productId: "flyers", materialId: "silk170", sizeId: "dl", sides: "double", lam: "lam-both", look: "matt", qty: 500, packaging: "shrink", delivery: "light" } as Config },
  { ref: "MQ-2037", customer: "The Little Gallery", created: "2026-07-18", cfg: { productId: "posters", materialId: "silk170", sizeId: "a3", sides: "single", lam: "lam-one", look: "matt", qty: 100, packaging: "bundled", delivery: "mid" } as Config },
];

/** The sample pack already posted, one to an address (data 563). */
export const SAMPLE_PACKS = [{ customer: "Harbour Bakery", line1: "12 Quay Street", town: "Marlow", postcode: "SL7 1BT", date: "2026-07-27" }];

/** Where each customer's deliveries go: the sample's own fiction, except Harbour Bakery's, which the comps print. */
const ADDRESSES: Record<string, { line1: string; town: string; postcode: string }> = {
  "Harbour Bakery": { line1: "12 Quay Street", town: "Marlow", postcode: "SL7 1BT" },
  "Fenwick & Sons": { line1: "4 West Street", town: "Marlow", postcode: "SL7 9ZZ" },
  "Bramble Yoga": { line1: "The Old Chapel, Dean Street", town: "Marlow", postcode: "SL7 9ZZ" },
  "Two Rivers Cycles": { line1: "8 Station Road", town: "Bourne End", postcode: "SL8 9ZZ" },
  "Ostara Flowers": { line1: "21 Spittal Street", town: "Marlow", postcode: "SL7 9ZZ" },
  "Kestrel Joinery": { line1: "Unit 3, Globe Park", town: "Marlow", postcode: "SL7 9ZZ" },
  "The Little Gallery": { line1: "2 Market Square", town: "Henley-on-Thames", postcode: "RG9 9ZZ" },
  "Marsh Lane Dental": { line1: "17 Marsh Lane", town: "Maidenhead", postcode: "SL6 9ZZ" },
  "Coble & Co": { line1: "5 Chapel Street", town: "Marlow", postcode: "SL7 9ZZ" },
  "Wold Cricket Club": { line1: "The Pavilion, Pound Lane", town: "Marlow", postcode: "SL7 9ZZ" },
};

/** A customer's e-mail: on a reserved `.example` domain, never mailed. */
export const emailOf = (customer: string): string => `hello@${customer.toLowerCase().replace(/&/g, "and").replace(/[^a-z]+/g, "")}.example`;

/** The works' order wall clock: the comps keep dates only, so an order came in mid-morning. */
const PLACED_AT = "10:00";
const PROOF_SENT_AT = "11:00";
/** An approval in the morning, before the cut-off. */
const ANSWERED_AT = "09:30";

// ── the bundles ─────────────────────────────────────────────────────────────

const optionLabel = (pid: string, kind: string, code: string): string => `option:${pid}:${kind}:${code}`;
const orderLabel = (ref: number): string => `order:MP-${String(ref)}`;
const jobLabel = (ref: number): string => `job:MP-${String(ref)}`;
const customerLabel = (name: string): string => `customer:${emailOf(name).split("@")[1]!.replace(".example", "")}`;
const isDelivered = (cfg: Config): boolean => cfg.delivery !== "collect";

/** The works' own sample: everything that does not point at a product. */
export function sampleBundle(): SampleBundle {
  const firstSeen = new Map<string, string>();
  for (const [name, on] of [...JOBS.map((j) => [j.customer, j.ordered] as const), ...SAVED_QUOTES.map((q) => [q.customer, q.created] as const)].sort((a, b) => a[1].localeCompare(b[1]))) {
    if (!firstSeen.has(name)) firstSeen.set(name, on);
  }
  return {
    format: "adminium.sample/1",
    app: "printing",
    weekAnchor: "wed",
    tables: [
      { ref: "settings", onlyIfEmpty: true, rows: [SETTINGS] },
      {
        ref: "materials",
        rows: MATERIALS.map((m, i) => ({
          "@label": `material:${m.code}`,
          code: m.code,
          name: m.name,
          short_name: m.short,
          spec: m.spec,
          kind: m.kind,
          coated: m.coated,
          gsm: m.gsm,
          rate: m.rate,
          roll_width_mm: m.rollWidth ?? null,
          active: true,
          position: i + 1,
        })),
      },
      {
        ref: "sizes",
        rows: SIZES.map((s, i) => ({
          "@label": `size:${s.code}`,
          code: s.code,
          name: s.name,
          width_mm: s.w,
          height_mm: s.h,
          up: s.up,
          up_upright: s.upright,
          up_rotated: s.rotated,
          direct: s.direct === true,
          active: true,
          position: i + 1,
        })),
      },
      {
        ref: "finishes",
        rows: FINISHES.map((f, i) => ({ "@label": `finish:${f.code}`, code: f.code, name: f.name, group: f.group, basis: f.basis, price: f.price, count: "count" in f ? f.count : 1, active: true, position: i + 1 })),
      },
      // Each break names the one above it, so the top break goes in first.
      {
        ref: "breaks",
        rows: BREAKS.map((b, i) => ({ "@label": `break:${String(b.min)}`, min_qty: b.min, multiplier: b.multiplier, next_id: i + 1 < BREAKS.length ? { "@ref": `break:${String(BREAKS[i + 1]!.min)}` } : null })).reverse(),
      },
      { ref: "packaging", rows: PACKAGING.map((p, i) => ({ "@label": `packaging:${p.code}`, code: p.code, name: p.name, basis: p.basis, price: p.price, product_kind: "sheet", active: true, position: i + 1 })) },
      { ref: "delivery_bands", rows: DELIVERY_BANDS.map((b, i) => ({ code: b.code, name: b.name, tube: b.tube, min_kg: b.min, max_kg: b.max, price: b.price, position: i + 1 })) },
      { ref: "option_rules", rows: OPTION_RULES.map((r, i) => ({ finish_group: r.group, test: r.test, gsm: r.gsm ?? null, reason: r.reason, active: true, position: i + 1 })) },
      { ref: "machines", rows: MACHINES.map((m, i) => ({ code: m.code, name: m.name, kind: m.kind, detail: m.detail, active: true, position: i + 1 })) },
      // A bank holiday is on the calendar's day, not the sample's: written as plain dates, which Adminium adds as they are.
      { ref: "closures", rows: CLOSURES.map((c) => ({ from_date: c.from, to_date: c.to, reason: c.reason, active: true })) },
      {
        ref: "customers",
        rows: [...firstSeen].map(([name, on]) => ({ "@label": customerLabel(name), email: emailOf(name), name, language: "en-US", may_email: false, created_at: wall(on, PLACED_AT) })),
      },
      {
        ref: "orders",
        rows: JOBS.map((j) => {
          const address = ADDRESSES[j.customer]!;
          const delivered = isDelivered(j.cfg);
          return {
            "@label": orderLabel(j.ref),
            number_seq: null,
            number: `MP-${String(j.ref)}`,
            status: j.stage === "ready" ? "ready" : "placed",
            name: j.customer,
            email: emailOf(j.customer),
            address_line1: delivered ? address.line1 : null,
            town: delivered ? address.town : null,
            postcode: delivered ? address.postcode : null,
            language: "en-US",
            customer_id: { "@ref": customerLabel(j.customer) },
            delivery_method: delivered ? "deliver" : "collect",
            placed_at: wall(j.ordered, PLACED_AT),
            ready_at: j.stage === "ready" ? wall(j.due, "16:00") : null,
            may_email: false,
          };
        }),
      },
      {
        ref: "saved_quotes",
        rows: SAVED_QUOTES.map((q) => ({
          "@label": `quote:${q.ref}`,
          number_seq: null,
          number: q.ref,
          name: q.customer,
          email: emailOf(q.customer),
          language: "en-US",
          customer_id: { "@ref": customerLabel(q.customer) },
          delivery_method: isDelivered(q.cfg) ? "deliver" : "collect",
          created_at: wall(q.created, "15:00"),
        })),
      },
      {
        ref: "sample_requests",
        rows: SAMPLE_PACKS.map((s) => ({
          status: "posted",
          name: s.customer,
          email: emailOf(s.customer),
          address_line1: s.line1,
          town: s.town,
          postcode: s.postcode,
          language: "en-US",
          created_at: wall(addDays(s.date, -3), "12:00"),
          posted_at: wall(s.date, "16:00"),
        })),
      },
    ],
  };
}

/** The Customiser's rows for Marlow Press, as its own sample ships them, each design version labelled for the proofs. */
function customiserTables(): Table[] {
  const tables = structuredClone(CUSTOMISER_ROWS.tables) as Table[];
  const versions = tables.find((t) => t.ref === "design_versions")!;
  for (const row of versions.rows) {
    const design = ((row["design_id"] as { "@ref": string })["@ref"]).replace("design:", "");
    row["@label"] = `version:${design}-${String(row["version"])}`;
  }
  return tables;
}

/** One of the Customiser's ordered designs, by its label: its code. */
function designCode(label: string): string {
  const designs = CUSTOMISER_ROWS.tables.find((t) => t.ref === "designs")!.rows as Row[];
  const found = designs.find((d) => d["@label"] === label);
  if (found === undefined) throw new Error(`the Customiser's sample has no ${label}`);
  return String(found["code"]);
}

/** A configuration as a job's or a quote line's columns, each option a row of the product's own. */
function configRow(cfg: Config): Row {
  const p = productById.get(cfg.productId)!;
  const opt = (kind: string, code: string | undefined): Row | null => (code === undefined ? null : { "@ref": optionLabel(p.id, kind, code) });
  const sheet = p.sizes.length > 0;
  return {
    product_id: { "@ref": `product:${p.id}` },
    qty: cfg.qty,
    material_option_id: opt("material", cfg.materialId),
    size_option_id: opt("size", cfg.sizeId),
    width_mm: cfg.custom?.w ?? null,
    height_mm: cfg.custom?.h ?? null,
    sides_option_id: opt("sides", cfg.sides),
    lamination_option_id: opt("lamination", cfg.lam),
    look: cfg.lam === undefined || cfg.lam === "lam-soft" ? null : (cfg.look ?? "matt"),
    spot_uv_option_id: null,
    corners_option_id: null,
    edges_option_id: opt("edges", cfg.bannerFin),
    canvas_option_id: opt("canvas", cfg.canvasFin),
    packaging_id: sheet ? { "@ref": `packaging:${cfg.packaging ?? "bundled"}` } : null,
    proof_by_post: false,
    express: false,
  };
}

/** The works' rows that link into the Customiser: the catalogue, and every job with its features and proofs, and the quotes' lines. */
export function customiserSection(): SampleBundle {
  const options: Row[] = [];
  for (const p of PRODUCTS) {
    let position = 0;
    const push = (kind: string, code: string, name: string, row: Row) =>
      options.push({ "@label": optionLabel(p.id, kind, code), product_id: { "@ref": `product:${p.id}` }, kind, code, name, active: true, position: (position += 1), ...row });
    p.materials.forEach((code, i) => {
      const m = materialByCode.get(code)!;
      push("material", code, m.name, { material_id: { "@ref": `material:${code}` }, coated: m.coated, preselected: i === 0 });
    });
    p.sizes.forEach((code, i) => push("size", code, sizeByCode.get(code)!.name, { size_id: { "@ref": `size:${code}` }, preselected: i === 0 }));
    for (const side of p.sides) push("sides", side, SIDE_NAMES[side], { sides: side === "double" ? 2 : 1, preselected: side === p.defSides });
    for (const f of finishOptions(p)) {
      const finish = FINISHES.find((x) => x.code === f.code)!;
      // A lamination and a spot UV need a coated surface under them.
      // A lamination and a spot UV need a coated surface under them; a canvas on a frame stays flat.
      push(f.kind, f.code, finish.name, { finish_id: { "@ref": `finish:${f.code}` }, coated: f.kind === "lamination" || f.kind === "spot_uv", framed: f.code === "stretched", preselected: f.code === "plain" || f.code === "rolled" });
    }
    for (const feature of p.features ?? []) push("feature", feature.code, feature.name, { price: 0, feature_code: feature.code, feature_id: { "@ref": feature.label } });
  }

  const jobs: Row[] = [];
  const features: Row[] = [];
  const proofs: Row[] = [];
  for (const j of JOBS) {
    jobs.push({
      "@label": jobLabel(j.ref),
      order_id: { "@ref": orderLabel(j.ref) },
      position: 1,
      ...configRow(j.cfg),
      design_code: j.design === undefined ? null : designCode(j.design),
      design_id: j.design === undefined ? null : { "@ref": j.design },
      ready_by: day(j.due),
      stage: j.stage,
      artwork_checked: j.proofs.length > 0,
    });
    // Harbour Bakery's card is printed on both sides: its design's back is a feature the job pays for.
    if (j.design !== undefined) {
      features.push({ job_id: { "@ref": jobLabel(j.ref) }, option_id: { "@ref": optionLabel(j.cfg.productId, "feature", PRINT_BACK.code) }, feature_id: { "@ref": PRINT_BACK.label } });
    }
    for (const pr of j.proofs) {
      proofs.push({
        job_id: { "@ref": jobLabel(j.ref) },
        version: pr.version,
        kind: "email",
        design_version_id: j.design === undefined ? null : { "@ref": `version:${j.design.replace("design:", "")}-${String(pr.version)}` },
        note: pr.note,
        state: pr.answer?.state ?? "sent",
        change_note: pr.answer?.note ?? null,
        sent_at: wall(pr.sent, PROOF_SENT_AT),
        answered_at: pr.answer === undefined ? null : wall(pr.answer.on, ANSWERED_AT),
      });
    }
  }

  const quoteLines = SAVED_QUOTES.map((q) => ({ quote_id: { "@ref": `quote:${q.ref}` }, position: 1, ...configRow(q.cfg), design_code: null, design_id: null }));

  return {
    format: "adminium.sample/1",
    app: "printing",
    addOn: "customiser",
    weekAnchor: "wed",
    tables: [
      ...customiserTables(),
      {
        ref: "products",
        own: true,
        rows: PRODUCTS.map((p, i) => ({
          "@label": `product:${p.id}`,
          code: p.id,
          name: p.name,
          family: p.family,
          kind: p.sizes.length > 0 ? "sheet" : "large",
          line: p.line,
          from_qty: p.from,
          default_width_mm: p.lfDefault?.w ?? null,
          default_height_mm: p.lfDefault?.h ?? null,
          max_width_mm: p.frame?.w ?? null,
          max_height_mm: p.frame?.h ?? null,
          icon: p.icon,
          base_id: p.base === undefined ? null : { "@ref": p.base },
          published: true,
          position: i + 1,
        })),
      },
      { ref: "options", own: true, rows: options },
      { ref: "jobs", own: true, rows: jobs },
      { ref: "job_features", own: true, rows: features },
      { ref: "proofs", own: true, rows: proofs },
      { ref: "quote_lines", own: true, rows: quoteLines },
    ],
  };
}
