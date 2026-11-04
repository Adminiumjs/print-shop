/**
 * The works' rate card as Adminium holds it: the figures the price list and
 * the configurator's copy show ("Setup £18 a job", "+35%", "a printed proof
 * £12"), read from the rate card the sample installs (`sample/rate-card.ts`),
 * in whole pence for these screens' formatter. Nothing here works a price out:
 * a job's price is Adminium's (`lib/priced.ts`).
 */
import { BREAKS, DELIVERY_BANDS as BANDS, FINISHES as CARD_FINISHES, MATERIALS as STOCKS, PACKAGING as PACKS, SETTINGS } from "../sample/rate-card.ts";
import type { DeliveryKey, MaterialKey, PackagingKey } from "./press.ts";

const pence = (pounds: number): number => Math.round(pounds * 100);

/** The card's stock codes, by this app's keys. */
const STOCK_CODE: Record<MaterialKey, string> = {
  "silk-350": "silk350",
  "uncoated-300": "uncoated300",
  "silk-170": "silk170",
  "silk-130": "silk130",
  "pvc-510": "pvc510",
  "mesh-270": "mesh270",
  "canvas-380": "canvas380",
  vinyl: "vinyl",
};
const PACK_CODE: Record<PackagingKey, string> = { bundled: "bundled", "shrink-wrapped": "shrink", boxed: "boxed" };
const BAND_CODE: Partial<Record<DeliveryKey, string>> = { "band-2kg": "light", "band-10kg": "mid", "band-30kg": "heavy", tube: "tube" };

export const RATE_CARD = {
  setupCents: pence(SETTINGS.setup),
  printPerSheetCents: { 1: pence(SETTINGS.print_single), 2: pence(SETTINGS.print_double) } as const,
  proofByPostCents: pence(SETTINGS.proof_post_price),
  largeFormatMinimumCents: pence(SETTINGS.large_format_minimum),
  /** Express, as the percentage the card adds. */
  expressPct: SETTINGS.express_percent,
  /** Tax, as the percentage the card charges. */
  taxPct: SETTINGS.tax_rate,
};

/** A stock's rate: a press sheet's, or a square metre's off the roll. */
export function materialRateCents(key: MaterialKey): number {
  return pence(STOCKS.find((m) => m.code === STOCK_CODE[key])!.rate);
}

/** A packaging's price: a piece's, or a box of 500's; nothing when it is included. */
export function packagingRateCents(key: PackagingKey): number {
  return pence(PACKS.find((p) => p.code === PACK_CODE[key])!.price);
}

/** A delivery band's price; collection costs nothing. */
export function deliveryRateCents(key: DeliveryKey): number {
  const code = BAND_CODE[key];
  return code === undefined ? 0 : pence(BANDS.find((b) => b.code === code)!.price);
}

/** The multiplier a quantity break puts on the print and the stock, for the price list's chart. */
export function breakMultiplier(quantity: number): number {
  return BREAKS.find((b) => b.min === quantity)?.multiplier ?? 1;
}

/** A finish's price on the card, by the card's own code (`lam-one`, `spot-uv`, `corners` …). */
export function finishRateCents(code: string): number {
  return pence(CARD_FINISHES.find((f) => f.code === code)!.price);
}
