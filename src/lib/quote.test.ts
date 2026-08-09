/**
 * The arithmetic is right and asserted, not eyeballed (24 acceptance
 * criterion 2). The worked example below is the one figure that the prompt, the
 * comp, this suite and the running demo must all agree on — if it moves, one of
 * them is wrong and this file says which.
 */
import { describe, expect, it } from 'vitest';

import { PRODUCTS } from './catalogue.ts';
import {
  addWorkingDays,
  artworkBlocked,
  artworkNeedsTick,
  checkArtwork,
  checkCustomSize,
  finishOptions,
  fromPriceCents,
  isWorkingDay,
  nextBreakSaving,
  priceLevers,
  priceQuote,
  promiseFor,
  type ArtworkFile,
  type Configuration,
} from './quote.ts';
import { QUANTITY_BREAKS, SIZE_LIMITS, breakFor } from './rates.ts';

/** The pinned clock: Wednesday, 5 August 2026, 10:20. */
const NOW = { iso: '2026-08-05', hour: 10 };

/**
 * The worked example, verbatim from prompt I:
 *   500 business cards on 350gsm silk board, double-sided, matt lamination both
 *   sides, boxed, delivered under 2kg.
 */
const WORKED: Configuration = {
  product: 'business-cards',
  material: 'silk-350',
  size: 'business-card',
  sides: 2,
  finish: 'matt-lam',
  quantity: 500,
  packaging: 'boxed',
  printedProof: false,
  express: false,
  delivery: 'band-2kg',
};

describe('the worked example', () => {
  const quote = priceQuote(WORKED);
  const line = (key: string): number =>
    quote.lines.find((l) => l.key === key)?.amountCents ?? 0;

  it('imposes 21 up on SRA3 and takes 24 sheets', () => {
    expect(quote.up).toBe(21);
    expect(quote.sheets).toBe(24);
    expect(quote.rotated).toBe(false);
  });

  it('prices print and material at the 500 break, and nothing else at it', () => {
    // print 24 × $1.20 = $28.80, material 24 × $0.42 = $10.08,
    // together $38.88 × 0.66 = $25.66.
    expect(quote.multiplier).toBe(0.66);
    expect(line('print') + line('material')).toBe(2566);
  });

  it('prices lamination, setup, packaging and delivery at full rate', () => {
    expect(line('finishing')).toBe(2280); // 24 × $0.95
    expect(line('setup')).toBe(1800);
    expect(line('packaging')).toBe(450); // one box per 500
    expect(line('delivery')).toBe(650); // under 2kg
  });

  it('totals $92.95, which is $0.19 each', () => {
    expect(quote.subtotalCents).toBe(7746);
    expect(quote.taxCents).toBe(1549);
    expect(quote.totalCents).toBe(9295);
    expect(Math.round(quote.unitCents) / 100).toBeCloseTo(0.19, 2);
  });

  it('adds up on screen — the lines plus tax ARE the total', () => {
    const summed = quote.lines.reduce((sum, l) => sum + l.amountCents, 0);
    expect(summed + quote.taxCents).toBe(quote.totalCents);
  });

  it('derives the unit price from the total and never re-multiplies it', () => {
    expect(quote.unitCents * WORKED.quantity).toBeCloseTo(quote.totalCents, 6);
  });
});

describe('quantity breaks', () => {
  it('takes the break at or below a typed-in amount', () => {
    expect(breakFor(25).multiplier).toBe(1.0);
    expect(breakFor(300).multiplier).toBe(0.74); // the 250 break
    expect(breakFor(999).multiplier).toBe(0.66); // the 500 break
    expect(breakFor(5000).multiplier).toBe(0.58); // the top break
  });

  it('gives anything under the smallest break the smallest break', () => {
    expect(breakFor(10).multiplier).toBe(1.0);
  });

  it('makes the unit price fall as the quantity rises', () => {
    const units = QUANTITY_BREAKS.map(
      (step) => priceQuote({ ...WORKED, quantity: step.quantity }).unitCents,
    );
    for (let i = 1; i < units.length; i += 1) {
      expect(units[i]!).toBeLessThan(units[i - 1]!);
    }
  });

  it('says what the next break up would save, and nothing at the top', () => {
    const saving = nextBreakSaving({ ...WORKED, quantity: 250 });
    expect(saving?.quantity).toBe(500);
    expect(saving!.nextUnitCents).toBeLessThan(saving!.currentUnitCents);
    expect(nextBreakSaving({ ...WORKED, quantity: 1000 })).toBeNull();
  });
});

describe('custom sizes name the limit they broke', () => {
  it('accepts a size inside every limit', () => {
    const check = checkCustomSize(800, 2000);
    expect(check.ok).toBe(true);
    expect(check.violations).toHaveLength(0);
  });

  it('names the minimum side and offers the nearest size that works', () => {
    const check = checkCustomSize(120, 900);
    expect(check.ok).toBe(false);
    const violation = check.violations.find((v) => v.limit === 'limit.minSide');
    expect(violation?.actual).toBe(120);
    expect(violation?.bound).toBe(SIZE_LIMITS.minSideMm);
    expect(violation?.nearest.widthMm).toBe(SIZE_LIMITS.minSideMm);
  });

  it('names the roll axis when the width is over it', () => {
    const check = checkCustomSize(1500, 900);
    expect(check.violations.some((v) => v.limit === 'limit.rollAxis')).toBe(true);
    expect(check.size.widthMm).toBeLessThanOrEqual(SIZE_LIMITS.maxRollAxisMm);
  });

  it('names the area cap and keeps the customer’s proportions when shrinking', () => {
    const check = checkCustomSize(1300, 5000);
    const area = check.violations.find((v) => v.limit === 'limit.area');
    expect(area).toBeDefined();
    expect(check.size.areaSqm).toBeLessThanOrEqual(SIZE_LIMITS.maxAreaSqm);
    const ratioIn = 1300 / 5000;
    const ratioOut = check.size.widthMm / check.size.heightMm;
    expect(ratioOut).toBeCloseTo(ratioIn, 1);
  });

  it('applies the TIGHTER frame limit to stretched canvas, and says so', () => {
    const rolled = checkCustomSize(1200, 900, { stretched: false });
    expect(rolled.ok).toBe(true);

    const stretched = checkCustomSize(1200, 900, { stretched: true });
    expect(stretched.ok).toBe(false);
    expect(stretched.violations.some((v) => v.limit === 'limit.frameWidth')).toBe(true);
  });

  it('refuses to guess a price for a size outside the limits', () => {
    const quote = priceQuote({
      product: 'pvc-banners',
      material: 'pvc-510',
      size: 'custom',
      customWidthMm: 90,
      customHeightMm: 400,
      sides: 1,
      finish: 'hemmed',
      quantity: 1,
      packaging: 'bundled',
      printedProof: false,
      express: false,
      delivery: 'collection',
    });
    expect(quote.totalCents).toBe(0);
    expect(quote.blocked.length).toBeGreaterThan(0);
  });
});

describe('impossible finishes come back with a reason', () => {
  it('disables matt lamination on PVC and says why', () => {
    const options = finishOptions({
      ...WORKED,
      product: 'pvc-banners',
      material: 'pvc-510',
      finish: 'plain-edges',
    });
    // PVC banners do not offer lamination at all — it is absent, not disabled.
    expect(options.some((o) => o.key === 'matt-lam')).toBe(false);
  });

  it('disables spot UV on an unlaminated stock WITH its reason', () => {
    const options = finishOptions({ ...WORKED, material: 'uncoated-300' });
    const spotUv = options.find((o) => o.key === 'spot-uv');
    expect(spotUv?.available).toBe(false);
    expect(spotUv?.reason).toBe('reason.spotUvNeedsLaminate');
  });

  it('disables round corners above 350gsm WITH its reason', () => {
    const options = finishOptions({ ...WORKED, material: 'silk-350' });
    const corners = options.find((o) => o.key === 'round-corners');
    expect(corners?.available).toBe(false);
    expect(corners?.reason).toBe('reason.roundCornersTooHeavy');
  });

  it('never returns a bare false — every unavailable option carries a key', () => {
    for (const product of PRODUCTS) {
      for (const material of product.materials) {
        const options = finishOptions({
          ...WORKED,
          product: product.key,
          material,
          finish: product.finishes[0]!,
        });
        for (const option of options) {
          expect(option.available === (option.reason === null)).toBe(true);
        }
      }
    }
  });
});

describe('the working calendar', () => {
  it('knows the works runs Monday to Friday', () => {
    expect(isWorkingDay('2026-08-05')).toBe(true); // Wednesday
    expect(isWorkingDay('2026-08-08')).toBe(false); // Saturday
    expect(isWorkingDay('2026-08-09')).toBe(false); // Sunday
    expect(isWorkingDay('2026-08-10')).toBe(true); // Monday
  });

  it('skips the weekend when adding working days', () => {
    expect(addWorkingDays('2026-08-05', 3)).toBe('2026-08-10');
    expect(addWorkingDays('2026-08-06', 1)).toBe('2026-08-07');
    expect(addWorkingDays('2026-08-07', 1)).toBe('2026-08-10');
  });

  it('rolls a weekend date forward before counting', () => {
    expect(addWorkingDays('2026-08-08', 0)).toBe('2026-08-10');
  });

  it('promises Monday 10 August for a standard job ordered now', () => {
    expect(promiseFor(WORKED, NOW).readyBy).toBe('2026-08-10');
  });

  it('promises the next working day for express', () => {
    expect(promiseFor({ ...WORKED, express: true }, NOW).readyBy).toBe('2026-08-06');
  });

  it('adds two working days for a printed proof by post', () => {
    expect(promiseFor({ ...WORKED, printedProof: true }, NOW).readyBy).toBe('2026-08-12');
  });

  it('starts the clock the next morning after the 14:00 cut-off', () => {
    const late = { iso: '2026-08-05', hour: 15 };
    expect(promiseFor(WORKED, late).readyBy).toBe('2026-08-11');
  });
});

describe('express', () => {
  it('uplifts the works’ own charges by 35% but never the courier’s', () => {
    const standard = priceQuote(WORKED);
    const express = priceQuote({ ...WORKED, express: true });

    const upliftable = standard.lines
      .filter((l) => l.key !== 'delivery')
      .reduce((sum, l) => sum + l.amountCents, 0);
    const line = express.lines.find((l) => l.key === 'express');
    expect(line?.amountCents).toBe(Math.round(upliftable * 0.35));

    const deliveryOf = (q: typeof standard): number =>
      q.lines.find((l) => l.key === 'delivery')?.amountCents ?? 0;
    expect(deliveryOf(express)).toBe(deliveryOf(standard));
  });
});

describe('large format', () => {
  const BANNER: Configuration = {
    product: 'pvc-banners',
    material: 'pvc-510',
    size: 'custom',
    customWidthMm: 1000,
    customHeightMm: 2000,
    sides: 1,
    finish: 'hemmed',
    quantity: 1,
    packaging: 'bundled',
    printedProof: false,
    express: false,
    delivery: 'tube',
  };

  it('prices by the square metre', () => {
    const quote = priceQuote(BANNER);
    // 2 m² × $28 = $56.
    expect(quote.lines.find((l) => l.key === 'print')?.amountCents).toBe(5600);
  });

  it('charges hemming by the finished perimeter', () => {
    // (1.0 + 2.0) × 2 = 6 linear metres × $6 = $36.
    expect(priceQuote(BANNER).lines.find((l) => l.key === 'finishing')?.amountCents).toBe(3600);
  });

  it('never goes below the minimum, and shows the shortfall as its own line', () => {
    const tiny = priceQuote({
      ...BANNER,
      customWidthMm: 300,
      customHeightMm: 300,
      finish: 'plain-edges',
    });
    const worked = tiny.lines
      .filter((l) => l.key !== 'delivery')
      .reduce((sum, l) => sum + l.amountCents, 0);
    expect(worked).toBe(3500);
    expect(tiny.lines.some((l) => l.key === 'minimum')).toBe(true);
  });

  it('takes no quantity break — large-format runs are 1–20 at one rate', () => {
    expect(priceQuote({ ...BANNER, quantity: 20 }).multiplier).toBe(1);
  });
});

describe('artwork checks carry the number that produced them', () => {
  const GOOD: ArtworkFile = {
    filename: 'cards-front.pdf',
    widthPx: 1075,
    heightPx: 721,
    widthMm: 91,
    heightMm: 61,
    bleedMm: 3,
    nearestInkMm: 5,
    colourSpace: 'CMYK',
    fontsEmbedded: true,
    pages: 2,
  };

  it('passes a file built to the works’ requirements', () => {
    const verdicts = checkArtwork(GOOD, WORKED);
    expect(verdicts.every((v) => v.level === 'pass')).toBe(true);
    expect(artworkBlocked(verdicts)).toBe(false);
  });

  it('fails a low-resolution file and reports the dpi it measured', () => {
    /*
     * Prompt I illustrates this verdict as "3492 × 2244px at 216 × 138mm, which
     * is 118dpi". Those three figures cannot all be true: 3492px over 216mm is
     * 410dpi. 118dpi at 3492px is a 751 × 483mm finished size — and 751 : 483
     * matches the pixel aspect ratio to three decimal places while 216 : 138
     * does not, so the millimetres are the slip and the pixels are sound.
     * Recorded as a bracket amendment; the headline 118dpi survives intact.
     */
    const low: ArtworkFile = { ...GOOD, widthPx: 3492, heightPx: 2244, widthMm: 751, heightMm: 483 };
    const verdicts = checkArtwork(low, { ...WORKED, product: 'posters', sides: 1 });
    const dpi = verdicts.find((v) => v.key === 'verdict.dpiLow');
    expect(dpi?.level).toBe('fail');
    expect(dpi?.measured.dpi).toBe(118);
    expect(dpi?.measured.need).toBe(150);
  });

  it('fails a file with no bleed and states the size it would need', () => {
    const verdicts = checkArtwork({ ...GOOD, bleedMm: 0, widthMm: 85, heightMm: 55 }, WORKED);
    const bleed = verdicts.find((v) => v.key === 'verdict.bleedMissing');
    expect(bleed?.level).toBe('fail');
    expect(bleed?.measured.needW).toBe(91);
    expect(bleed?.measured.needH).toBe(61);
  });

  it('warns — rather than blocks — on ink close to the trim, and needs a tick', () => {
    const verdicts = checkArtwork({ ...GOOD, nearestInkMm: 1.8 }, WORKED);
    const near = verdicts.find((v) => v.key === 'verdict.nearTrim');
    expect(near?.level).toBe('warn');
    expect(near?.measured.mm).toBe(1.8);
    expect(artworkBlocked(verdicts)).toBe(false);
    expect(artworkNeedsTick(verdicts)).toBe(true);
  });

  it('gives every verdict at least one measured number, or none to give', () => {
    const verdicts = checkArtwork({ ...GOOD, bleedMm: 0, colourSpace: 'RGB' }, WORKED);
    for (const verdict of verdicts) {
      expect(typeof verdict.key).toBe('string');
      expect(verdict.measured).toBeTypeOf('object');
    }
  });
});

describe('the products grid', () => {
  it('computes every "from" figure rather than carrying a typed number', () => {
    for (const product of PRODUCTS) {
      expect(fromPriceCents(product.key)).toBeGreaterThan(0);
    }
  });

  it('names the three biggest levers on a price', () => {
    const levers = priceLevers(priceQuote(WORKED));
    expect(levers).toHaveLength(3);
    expect(levers[0]!.sharePct).toBeGreaterThanOrEqual(levers[1]!.sharePct);
    expect(levers.every((l) => l.sharePct > 0)).toBe(true);
  });
});
