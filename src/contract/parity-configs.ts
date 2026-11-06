/**
 * The jobs the parity check prices: about two hundred configurations the
 * works' catalogue offers, each said once in the catalogue's own codes and
 * turned into what the old browser code took (`toLegacy`) and what a job
 * line sends Adminium (`toLine`).
 *
 * The first ones are chosen to meet each fix (the vinyl stickers, 999 and 249
 * of a thing, an order over 30 kg, gloss on both sides and soft-touch on one,
 * a small banner under the minimum, a canvas on a frame, a banner too long
 * for the tube); the rest are drawn from everything the catalogue allows, by
 * a seeded draw, so the same two hundred are priced on every run.
 *
 * Tests only.
 */
import type { Configuration, FinishKey, MaterialKey, ProductKey, SizeKey } from "./legacy-price.ts";

export interface Job {
  product: string;
  material: string;
  size?: string;
  custom?: { w: number; h: number };
  sides: 1 | 2;
  /** A lamination: its look, or soft-touch. On both sides when the job prints both sides. */
  lam?: "gloss" | "matt" | "soft";
  spotUv?: true;
  corners?: true;
  edges?: "plain" | "hemmed" | "pockets";
  canvas?: "rolled" | "stretched";
  qty: number;
  packaging?: "bundled" | "shrink" | "boxed";
  proof?: true;
  express?: true;
  deliver?: true;
}

interface Offer {
  materials: string[];
  sizes: string[];
  sides: (1 | 2)[];
  lams: ("gloss" | "matt" | "soft")[];
  spotUv?: true;
  corners?: true;
  edges?: ("plain" | "hemmed" | "pockets")[];
  canvas?: ("rolled" | "stretched")[];
  /** Large format's own sizes, within what the old configurator let through. */
  custom?: { w: number; h: number }[];
}

/** What each product offers (the sample's catalogue, less the 95 mm square the old app never had). */
const CATALOGUE: Record<string, Offer> = {
  "business-cards": { materials: ["silk350", "uncoated300"], sizes: ["bcard"], sides: [1, 2], lams: ["gloss", "matt", "soft"], spotUv: true, corners: true },
  "folded-cards": { materials: ["silk350", "uncoated300", "silk170"], sizes: ["a6", "a5"], sides: [1, 2], lams: ["gloss", "matt", "soft"] },
  flyers: { materials: ["silk170", "silk130", "uncoated300"], sizes: ["a6", "a5", "a4", "dl"], sides: [1, 2], lams: ["gloss", "matt"], spotUv: true },
  letterheads: { materials: ["silk130", "silk170", "uncoated300"], sizes: ["a4", "usletter"], sides: [1, 2], lams: [] },
  "comp-slips": { materials: ["silk130", "silk170"], sizes: ["dl"], sides: [1, 2], lams: [] },
  envelopes: { materials: ["silk130", "uncoated300"], sizes: ["dlenv", "c5"], sides: [1], lams: [] },
  stickers: { materials: ["silk170", "vinyl"], sizes: ["a6", "a5"], sides: [1], lams: ["gloss", "matt"] },
  posters: { materials: ["silk170", "silk130"], sizes: ["a4", "a3"], sides: [1], lams: ["matt"] },
  rollups: { materials: ["pvc510", "mesh270"], sizes: [], sides: [1], lams: [], edges: ["plain", "hemmed"], custom: [{ w: 850, h: 2000 }, { w: 800, h: 2000 }, { w: 1000, h: 2100 }, { w: 900, h: 1500 }, { w: 600, h: 1600 }] },
  "pvc-banners": {
    materials: ["pvc510", "mesh270"],
    sizes: [],
    sides: [1],
    lams: [],
    edges: ["plain", "hemmed", "pockets"],
    custom: [{ w: 1200, h: 2000 }, { w: 1000, h: 3000 }, { w: 600, h: 1400 }, { w: 1350, h: 500 }, { w: 400, h: 300 }, { w: 1234, h: 567 }, { w: 1300, h: 4500 }],
  },
  canvas: { materials: ["canvas380"], sizes: [], sides: [1], lams: [], canvas: ["rolled", "stretched"], custom: [{ w: 600, h: 800 }, { w: 1000, h: 1400 }, { w: 400, h: 300 }, { w: 900, h: 1200 }, { w: 300, h: 300 }, { w: 333, h: 777 }] },
};
const COATED = new Set(["silk350", "silk170", "silk130"]);
const SHEET_QTYS = [25, 50, 99, 100, 150, 249, 250, 300, 499, 500, 750, 999, 1000, 2000, 5000];
const LARGE_QTYS = [1, 2, 3, 5, 10, 20];

/** The jobs chosen to meet each fix, and to check the sample's own kinds of job. */
const CHOSEN: Job[] = [
  // Vinyl stickers by the sheet (slip 1).
  { product: "stickers", material: "vinyl", size: "a6", sides: 1, qty: 100, deliver: true },
  { product: "stickers", material: "vinyl", size: "a5", sides: 1, qty: 250, packaging: "shrink", deliver: true },
  { product: "stickers", material: "vinyl", size: "a6", sides: 1, qty: 999 },
  // One short of a break (slip 2).
  { product: "flyers", material: "silk130", size: "a5", sides: 2, qty: 999, deliver: true },
  { product: "flyers", material: "silk170", size: "a5", sides: 1, qty: 249 },
  { product: "flyers", material: "silk170", size: "a6", sides: 2, lam: "matt", qty: 499, packaging: "boxed" },
  { product: "business-cards", material: "silk350", size: "bcard", sides: 2, qty: 99, express: true },
  { product: "letterheads", material: "silk130", size: "a4", sides: 1, qty: 999, proof: true },
  // Over 30 kg (slip 3).
  { product: "flyers", material: "uncoated300", size: "a4", sides: 2, qty: 5000, deliver: true },
  { product: "letterheads", material: "silk130", size: "a4", sides: 1, qty: 5000, deliver: true },
  { product: "posters", material: "silk170", size: "a3", sides: 1, qty: 2000, deliver: true },
  { product: "pvc-banners", material: "pvc510", custom: { w: 1300, h: 4500 }, sides: 1, edges: "hemmed", qty: 20, deliver: true },
  // Gloss on both sides, soft-touch on one (slip 4).
  { product: "business-cards", material: "silk350", size: "bcard", sides: 2, lam: "gloss", qty: 500, packaging: "boxed", deliver: true },
  { product: "business-cards", material: "silk350", size: "bcard", sides: 1, lam: "soft", qty: 250 },
  { product: "folded-cards", material: "silk350", size: "a6", sides: 2, lam: "soft", qty: 250, packaging: "boxed", deliver: true },
  { product: "folded-cards", material: "silk170", size: "a5", sides: 1, lam: "gloss", qty: 100 },
  // A lamination with spot UV, and round corners.
  { product: "business-cards", material: "silk350", size: "bcard", sides: 2, lam: "matt", spotUv: true, corners: true, qty: 1000, packaging: "boxed", deliver: true },
  { product: "flyers", material: "silk170", size: "a5", sides: 2, lam: "gloss", spotUv: true, qty: 250 },
  // Large format: under the minimum, on a frame, too long for the tube, an odd edge.
  { product: "pvc-banners", material: "pvc510", custom: { w: 400, h: 300 }, sides: 1, edges: "plain", qty: 1, deliver: true },
  { product: "canvas", material: "canvas380", custom: { w: 300, h: 300 }, sides: 1, canvas: "rolled", qty: 1, proof: true },
  { product: "canvas", material: "canvas380", custom: { w: 600, h: 800 }, sides: 1, canvas: "stretched", qty: 2, deliver: true },
  { product: "rollups", material: "pvc510", custom: { w: 850, h: 2000 }, sides: 1, edges: "plain", qty: 1, deliver: true },
  { product: "pvc-banners", material: "pvc510", custom: { w: 1234, h: 567 }, sides: 1, edges: "hemmed", qty: 3, express: true, deliver: true },
  { product: "pvc-banners", material: "mesh270", custom: { w: 600, h: 1400 }, sides: 1, edges: "pockets", qty: 6, deliver: true },
];

/** A small seeded draw: the same sequence on every run. */
function draw(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** About two hundred jobs: the chosen ones, then drawn ones, none twice. */
export function parityJobs(count = 200): Job[] {
  const next = draw(73);
  const pick = <T>(xs: readonly T[]): T => xs[Math.floor(next() * xs.length)]!;
  const out = [...CHOSEN];
  const seen = new Set(out.map((j) => JSON.stringify(j)));
  const products = Object.keys(CATALOGUE);
  while (out.length < count) {
    const product = pick(products);
    const offer = CATALOGUE[product]!;
    const material = pick(offer.materials);
    const large = offer.custom !== undefined;
    const job: Job = { product, material, sides: pick(offer.sides), qty: pick(large ? LARGE_QTYS : SHEET_QTYS) };
    if (large) job.custom = pick(offer.custom!);
    else job.size = pick(offer.sizes);
    if (COATED.has(material) && offer.lams.length > 0 && next() < 0.6) {
      job.lam = pick(offer.lams);
      if (offer.spotUv && job.lam !== "soft" && next() < 0.3) job.spotUv = true;
    }
    if (offer.corners && next() < 0.3) job.corners = true;
    if (offer.edges) job.edges = pick(offer.edges);
    if (offer.canvas) job.canvas = pick(offer.canvas);
    // The old configurator's frame: a stretched canvas no larger than 1000 × 1400.
    if (job.canvas === "stretched" && (job.custom!.w > 1000 || job.custom!.h > 1400)) continue;
    if (!large) job.packaging = pick(["bundled", "shrink", "boxed"] as const);
    if (next() < 0.2) job.proof = true;
    if (next() < 0.2) job.express = true;
    if (next() < 0.6) job.deliver = true;
    const key = JSON.stringify(job);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(job);
  }
  return out;
}

/** A job in a few words, for a failure to name it. */
export const describeJob = (j: Job): string =>
  [
    String(j.qty),
    j.product,
    j.material,
    j.size ?? `${String(j.custom!.w)}×${String(j.custom!.h)}`,
    `${String(j.sides)}-sided`,
    j.lam,
    j.spotUv ? "spot UV" : undefined,
    j.corners ? "corners" : undefined,
    j.edges,
    j.canvas,
    j.packaging,
    j.proof ? "proof" : undefined,
    j.express ? "express" : undefined,
    j.deliver ? "delivered" : "collected",
  ]
    .filter((x) => x !== undefined)
    .join(" ");

const LEGACY_PRODUCT: Record<string, ProductKey> = { rollups: "roll-up-banners" };
const LEGACY_MATERIAL: Record<string, MaterialKey> = {
  silk350: "silk-350",
  uncoated300: "uncoated-300",
  silk170: "silk-170",
  silk130: "silk-130",
  pvc510: "pvc-510",
  mesh270: "mesh-270",
  canvas380: "canvas-380",
  vinyl: "vinyl",
};
const LEGACY_SIZE: Record<string, SizeKey> = { bcard: "business-card", usletter: "us-letter", dlenv: "dl-envelope" };
const LEGACY_LAM = { gloss: "gloss-lam", matt: "matt-lam", soft: "soft-touch" } as const;
const LEGACY_EDGES = { plain: "plain-edges", hemmed: "hemmed", pockets: "pole-pockets" } as const;

/** The job as the old configurator took it. */
export function toLegacy(j: Job): Configuration {
  const finishes: FinishKey[] = [
    ...(j.lam === undefined ? [] : [LEGACY_LAM[j.lam]]),
    ...(j.spotUv ? (["spot-uv"] as const) : []),
    ...(j.corners ? (["round-corners"] as const) : []),
    ...(j.edges === undefined ? [] : [LEGACY_EDGES[j.edges]]),
    ...(j.canvas === undefined ? [] : [j.canvas]),
  ];
  return {
    product: LEGACY_PRODUCT[j.product] ?? (j.product as ProductKey),
    material: LEGACY_MATERIAL[j.material]!,
    size: j.size === undefined ? "custom" : (LEGACY_SIZE[j.size] ?? (j.size as SizeKey)),
    ...(j.custom === undefined ? {} : { customWidthMm: j.custom.w, customHeightMm: j.custom.h }),
    sides: j.sides,
    finishes,
    quantity: j.qty,
    packaging: j.packaging === "shrink" ? "shrink-wrapped" : (j.packaging ?? "bundled"),
    printedProof: j.proof === true,
    express: j.express === true,
    delivery: j.deliver ? "deliver" : "collection",
  };
}

/** The catalogue a page reads, by codes: the rows' keys. */
export interface Catalogue {
  product(code: string): unknown;
  option(product: string, kind: string, code: string): unknown;
  packaging(code: string): unknown;
}

/** The job as a line of an order sends it to Adminium: each choice an option of its own product. */
export function toLine(j: Job, c: Catalogue): Record<string, unknown> {
  const o = (kind: string, code: string | undefined) => (code === undefined ? null : c.option(j.product, kind, code));
  const lam = j.lam === undefined ? undefined : j.lam === "soft" ? "lam-soft" : j.sides === 2 ? "lam-both" : "lam-one";
  return {
    product_id: c.product(j.product),
    qty: j.qty,
    material_option_id: o("material", j.material),
    size_option_id: o("size", j.size),
    width_mm: j.custom?.w ?? null,
    height_mm: j.custom?.h ?? null,
    sides_option_id: o("sides", j.sides === 2 ? "double" : "single"),
    lamination_option_id: o("lamination", lam),
    look: j.lam === undefined || j.lam === "soft" ? null : j.lam,
    spot_uv_option_id: j.spotUv ? o("spot_uv", "spot-uv") : null,
    corners_option_id: j.corners ? o("corners", "corners") : null,
    edges_option_id: o("edges", j.edges),
    canvas_option_id: o("canvas", j.canvas),
    packaging_id: j.packaging === undefined ? null : c.packaging(j.packaging),
    proof_by_post: j.proof === true,
    express: j.express === true,
  };
}
