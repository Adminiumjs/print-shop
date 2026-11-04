/**
 * The price book's configurations, and how a dry run's answer becomes one of
 * its entries.
 *
 * The book (`src/data/price-book.json`) holds Adminium's price of every
 * configuration the old screens open on: each product as it starts
 * (`defaultConfig`), with each of its choices changed once, each at every
 * quantity the configurator offers; each product's "from" configuration; the
 * demo's saved quotes and reorders. An entry is `null` where Adminium refuses
 * the configuration (spot UV with no lamination under it, a lamination on an
 * uncoated stock, a stock the works no longer offers on that product): the
 * screen says the works will quote it.
 *
 * Tests only: the book is written by the price-book contract
 * (`UPDATE_PRICE_BOOK=1`), from Adminium's answers.
 */
import { PAST_JOBS, SAVED_QUOTES } from "../data/demo.ts";
import { PRODUCTS, PRODUCT_BY_KEY, type Product } from "../lib/catalogue.ts";
import { BREAK_QUANTITIES } from "../lib/press.ts";
import { bookKey, type PricedLine, type QuoteLine } from "../lib/priced.ts";
import type { Configuration } from "../lib/quote.ts";
import { materialRateCents } from "../lib/rateCard.ts";
import { defaultConfig } from "../state/store.ts";
import type { Job } from "./parity-configs.ts";

/** The quantities a product's configurator offers: its breaks, or a large-format run's 1 to 20. */
const quantitiesOf = (p: Product): number[] => (p.quantityMode === "breaks" ? [...BREAK_QUANTITIES] : [1, 2, 3, 5, 10, 20]);

/** Every configuration the book holds, each once. */
export function bookConfigs(): Configuration[] {
  const out = new Map<string, Configuration>();
  const add = (c: Configuration) => out.set(bookKey(c), c);
  for (const p of PRODUCTS) {
    const base = defaultConfig(p.key);
    const variants: Configuration[] = [
      base,
      ...p.materials.map((material) => ({ ...base, material })),
      ...p.sizes.filter((size) => size !== "custom").map((size) => ({ ...base, size })),
      ...(p.sidesChoice ? ([1, 2] as const).map((sides) => ({ ...base, sides })) : []),
      ...p.finishes.map((finish) => ({ ...base, finish })),
      ...p.packaging.map((packaging) => ({ ...base, packaging })),
      { ...base, printedProof: true },
      { ...base, express: true },
      { ...base, delivery: "band-2kg" as const },
    ];
    for (const v of variants) for (const quantity of quantitiesOf(p)) add({ ...v, quantity });
    // The products grid's "from": the cheapest stock, plain, one side, collected.
    const cheapest = [...p.materials].sort((a, b) => materialRateCents(a) - materialRateCents(b))[0]!;
    const plain = p.finishes.find((f) => f === "none" || f === "plain-edges" || f === "rolled") ?? p.finishes[0]!;
    add({ ...base, material: cheapest, sides: 1, finish: plain, packaging: "bundled", printedProof: false, express: false, delivery: "collection" });
  }
  for (const q of SAVED_QUOTES) add({ ...q.config });
  for (const job of PAST_JOBS) {
    const product = PRODUCT_BY_KEY[job.productKey as Product["key"]];
    add({ product: product.key, material: job.materialKey as never, size: product.sizes[0]!, sides: job.sides, finish: job.finishKey as never, quantity: job.quantity, packaging: job.packagingKey as never, printedProof: false, express: false, delivery: "collection" });
  }
  return [...out.values()];
}

const PRODUCT_CODE: Partial<Record<string, string>> = { "roll-up-banners": "rollups" };
const MATERIAL_CODE: Record<string, string> = {
  "silk-350": "silk350",
  "uncoated-300": "uncoated300",
  "silk-170": "silk170",
  "silk-130": "silk130",
  "pvc-510": "pvc510",
  "mesh-270": "mesh270",
  "canvas-380": "canvas380",
  vinyl: "vinyl",
};
const SIZE_CODE: Partial<Record<string, string>> = { "business-card": "bcard", "us-letter": "usletter", "dl-envelope": "dlenv" };

/** An old configuration as a job in the catalogue's codes (one finish; a lamination on the sides printed). */
export function jobOf(c: Configuration): Job {
  const f = c.finish;
  return {
    product: PRODUCT_CODE[c.product] ?? c.product,
    material: MATERIAL_CODE[c.material]!,
    ...(c.size === "custom" ? { custom: { w: c.customWidthMm ?? 800, h: c.customHeightMm ?? 2000 } } : { size: SIZE_CODE[c.size] ?? c.size }),
    sides: c.sides,
    ...(f === "gloss-lam" ? { lam: "gloss" as const } : f === "matt-lam" ? { lam: "matt" as const } : f === "soft-touch" ? { lam: "soft" as const } : {}),
    ...(f === "spot-uv" ? { spotUv: true as const } : {}),
    ...(f === "round-corners" ? { corners: true as const } : {}),
    ...(f === "plain-edges" ? { edges: "plain" as const } : f === "hemmed" ? { edges: "hemmed" as const } : f === "pole-pockets" ? { edges: "pockets" as const } : {}),
    ...(f === "stretched" || f === "rolled" ? { canvas: f } : {}),
    qty: c.quantity,
    ...(PRODUCT_BY_KEY[c.product].press === "sheet" ? { packaging: c.packaging === "shrink-wrapped" ? ("shrink" as const) : c.packaging } : {}),
    ...(c.printedProof ? { proof: true as const } : {}),
    ...(c.express ? { express: true as const } : {}),
    ...(c.delivery === "collection" ? {} : { deliver: true as const }),
  };
}

type Row = Record<string, unknown>;
const pence = (value: unknown): number => Math.round(Number(value) * 100);
const has = (value: unknown): boolean => value !== null && value !== undefined && Number(value) !== 0;

/** Adminium's answer for a one-line order, laid out as the quote panel shows it. */
export function entryOf(order: Row, line: Row): PricedLine {
  const sheet = line["product_kind"] === "sheet";
  const multiplier = line["multiplier"] === null || line["multiplier"] === undefined ? 1 : Number(line["multiplier"]);
  const lines: QuoteLine[] = [{ key: "setup", amountCents: pence(line["setup"]), detail: {} }];
  if (sheet) {
    lines.push({ key: "print", amountCents: pence(line["print_charge"]), detail: { sheets: Number(line["sheets"]), rate: pence(line["print_rate"]), multiplier } });
    lines.push({ key: "material", amountCents: pence(line["material_charge"]), detail: { sheets: Number(line["sheets"]), rate: Number(line["sheet_rate"]) * 100, multiplier } });
  } else {
    lines.push({ key: "print", amountCents: pence(line["material_charge"]), detail: { sqm: Number(line["area_total"]), rate: pence(line["material_rate"]) } });
  }
  const finishing = ["lamination", "spot_uv", "corners", "edges", "canvas"].reduce((sum, g) => sum + pence(line[`${g}_charge`] ?? 0), 0);
  if (finishing > 0) lines.push({ key: "finishing", amountCents: finishing, detail: sheet ? { sheets: Number(line["sheets"]) } : {} });
  if (has(line["minimum_charge"])) lines.push({ key: "minimum", amountCents: pence(line["minimum_charge"]), detail: {} });
  if (has(line["packaging_charge"])) lines.push({ key: "packaging", amountCents: pence(line["packaging_charge"]), detail: { quantity: Number(line["qty"]) } });
  if (has(line["proof_charge"])) lines.push({ key: "proof", amountCents: pence(line["proof_charge"]), detail: {} });
  if (has(line["express_charge"])) lines.push({ key: "express", amountCents: pence(line["express_charge"]), detail: { pct: Number(line["express_percent"]) } });
  if (has(line["cap_charge"])) lines.push({ key: "cap", amountCents: pence(line["cap_charge"]), detail: { qty: Number(line["next_qty"]) } });
  const toQuote = Number(order["delivery_to_quote"]) === 1;
  if (order["delivery_method"] === "deliver") lines.push({ key: "delivery", amountCents: toQuote ? 0 : pence(order["delivery"]), detail: { kg: Number(order["weight_kg"]), ...(toQuote ? { toQuote: 1 } : {}) } });
  const totalCents = pence(order["total"]);
  return {
    lines,
    subtotalCents: pence(order["subtotal"]),
    taxCents: pence(order["tax"]),
    totalCents,
    unitCents: totalCents / Number(line["qty"]),
    sheets: sheet ? Number(line["sheets"]) : Number(line["qty"]),
    up: sheet ? Number(line["up"]) : 1,
    weightKg: Number(line["weight_kg"]),
    multiplier: sheet ? multiplier : 1,
    deliveryToQuote: toQuote,
  };
}
