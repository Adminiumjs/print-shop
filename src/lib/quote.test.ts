/**
 * The configurator's rules: sizes, finishes, the working calendar and the
 * artwork checks. The prices are Adminium's, and the parity contract
 * (`src/contract/pricing-parity.test.ts`) holds them to the old figures but for
 * the fixes it names.
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
  isWorkingDay,
  promiseFor,
  type ArtworkFile,
  type Configuration,
} from './quote.ts';
import { SIZE_LIMITS } from './press.ts';
import { priced } from './priced.ts';

/** The pinned clock: Wednesday, 5 August 2026, 10:20. */
const NOW = { iso: '2026-08-05', hour: 10 };

/**
 * The worked example, verbatim from prompt I:
 *   500 business cards on 350gsm silk board, double-sided, matt lamination both
 *   sides, boxed, delivered under 2kg: its dates.
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
    const quote = priced({
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
    expect(quote!.totalCents).toBe(0);
    expect(quote!.blocked.length).toBeGreaterThan(0);
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
