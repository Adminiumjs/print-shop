/**
 * The old screens show Adminium's prices and work none out: what the price
 * book holds (recorded from Adminium, and held to it, by the parity contract),
 * or nothing.
 */
import { describe, expect, it } from "vitest";

import BOOK from "../data/price-book.json" with { type: "json" };
import { bookConfigs } from "../contract/price-book.ts";
import { defaultConfig } from "../state/store.ts";
import { PRODUCTS } from "./catalogue.ts";
import { bookKey, priced, type PricedLine } from "./priced.ts";

const entries = Object.entries(BOOK as unknown as Record<string, PricedLine | null>);

describe("the old screens' prices are Adminium's", () => {
  it("holds Adminium's answer for every configuration the screens open on, and nothing else", () => {
    expect(Object.keys(BOOK).sort()).toEqual(bookConfigs().map(bookKey).sort());
  });

  it("prices every product as it starts", () => {
    for (const p of PRODUCTS) expect(priced(defaultConfig(p.key)), p.key).not.toBeNull();
  });

  it("adds up on screen: the lines are the subtotal, and the subtotal and the tax the total", () => {
    for (const [key, entry] of entries) {
      if (entry === null) continue;
      expect(entry.lines.reduce((sum, l) => sum + l.amountCents, 0), key).toBe(entry.subtotalCents);
      expect(entry.subtotalCents + entry.taxCents, key).toBe(entry.totalCents);
    }
  });

  it("comes to Adminium's figures for 500 business cards on silk board, both sides, collected", () => {
    // 18 setup + 24 sheets × 1.20 × 0.66 + 24 × 0.42 × 0.66 = 43.66, and 20 % tax.
    const quote = priced({ ...defaultConfig("business-cards"), quantity: 500 })!;
    expect([quote.subtotalCents, quote.taxCents, quote.totalCents, quote.sheets, quote.up, quote.multiplier]).toEqual([4366, 873, 5239, 24, 21, 0.66]);
    expect(quote.lines.map((l) => [l.key, l.amountCents])).toEqual([["setup", 1800], ["print", 1901], ["material", 665]]);
  });

  it("names a delivery over the bands as the works' to quote, at no price", () => {
    const heavy = entries.filter(([, e]) => e?.deliveryToQuote === true);
    for (const [key, e] of heavy) expect(e!.lines.find((l) => l.key === "delivery"), key).toMatchObject({ amountCents: 0, detail: { toQuote: 1 } });
  });

  it("has no price for a configuration Adminium has not priced, and blocks a size outside the limits", () => {
    expect(priced({ ...defaultConfig("flyers"), quantity: 777, express: true, printedProof: true })).toBeNull();
    const banner = priced({ ...defaultConfig("pvc-banners"), customWidthMm: 90, customHeightMm: 400 });
    expect(banner!.blocked.length).toBeGreaterThan(0);
    expect(banner!.totalCents).toBe(0);
  });
});
