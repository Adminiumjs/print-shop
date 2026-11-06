/**
 * The frozen copy of the old browser price is the old browser price: with no
 * fix it comes, figure for figure, to what the app's own `priceQuote` said for
 * every parity job it could take (one finish a job), recorded from that code
 * in `old-browser-figures.json` before it was deleted (at `d6f7aae`).
 *
 * And each fix does only what it says: with all of them on, a job none of them
 * touches costs what it did.
 */
import { describe, expect, it } from "vitest";

import { ALL_FIXES, FIXES, legacyQuote, SLIPS, type Fix } from "./legacy-price.ts";
import OLD from "./old-browser-figures.json" with { type: "json" };
import { describeJob, parityJobs, toLegacy } from "./parity-configs.ts";

const jobs = parityJobs();

describe("the old browser's price, kept for the parity check", () => {
  it("draws about two hundred jobs, the same ones every run", () => {
    expect(jobs.length).toBe(200);
    expect(new Set(jobs.map(describeJob)).size).toBe(200);
    expect(parityJobs().map(describeJob)).toEqual(jobs.map(describeJob));
  });

  it("comes, with no fix, to the figures the app's own price code gave", () => {
    const single = jobs.filter((j) => toLegacy(j).finishes.length <= 1);
    expect(Object.keys(OLD).length).toBe(single.length);
    for (const job of single) {
      const q = legacyQuote(toLegacy(job));
      const { workCents, weightKg, deliveryCents, taxCents, totalCents } = q;
      expect({ workCents, weightKg, deliveryCents, taxCents, totalCents }, describeJob(job)).toEqual(OLD[describeJob(job) as keyof typeof OLD]);
    }
  });

  it("names the four slips among its fixes, each with what it puts right", () => {
    expect(SLIPS).toEqual(["vinylBySheetArea", "neverDearerThanNextBreak", "over30kgQuotedByHand", "laminationBySides"]);
    for (const fix of Object.keys(FIXES) as Fix[]) expect(FIXES[fix].length).toBeGreaterThan(20);
    expect(ALL_FIXES.size).toBe(10);
  });

  it("puts each slip right where the plan found it", () => {
    const price = (job: Parameters<typeof toLegacy>[0], fixes: ReadonlySet<Fix>) => legacyQuote(toLegacy(job), fixes);
    const none = new Set<Fix>();
    // 100 A6 vinyl stickers, collected: 618.79 by the old code, sheet-area priced once fixed.
    const vinyl = { product: "stickers", material: "vinyl", size: "a6", sides: 1 as const, qty: 100 };
    expect(price(vinyl, none).totalCents).toBe(61879);
    expect(price(vinyl, new Set<Fix>(["vinylBySheetArea"])).workCents).toBeLessThan(price(vinyl, none).workCents / 4);
    // 999 flyers no dearer than 1000.
    const flyers = (qty: number) => ({ product: "flyers", material: "silk130", size: "a5", sides: 2 as const, qty });
    expect(price(flyers(999), none).workCents).toBeGreaterThan(price(flyers(1000), none).workCents);
    expect(price(flyers(999), new Set<Fix>(["neverDearerThanNextBreak"])).workCents).toBe(price(flyers(1000), none).workCents);
    // 5000 A4 flyers on board: over 30 kg, charged the 30 kg band; quoted by hand once fixed.
    const heavy = { product: "flyers", material: "uncoated300", size: "a4", sides: 2 as const, qty: 5000, deliver: true as const };
    expect(price(heavy, none).deliveryCents).toBe(1640);
    expect(price(heavy, new Set<Fix>(["over30kgQuotedByHand"])).deliveryCents).toBeNull();
    // Gloss on a double-sided card: one side's rate, until lamination goes by its sides.
    const gloss = { product: "business-cards", material: "silk350", size: "bcard", sides: 2 as const, lam: "gloss" as const, qty: 500 };
    expect(price(gloss, new Set<Fix>(["laminationBySides"])).workCents - price(gloss, none).workCents).toBe(24 * (95 - 55));
  });
});
