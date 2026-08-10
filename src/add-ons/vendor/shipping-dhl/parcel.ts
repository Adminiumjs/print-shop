/*
 * VENDORED from add-ons/packages/shipping-dhl/src/parcel.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `shipping-dhl`; its manifest, tests and README live in the monorepo.
 */
/**
 * The parcel, filled in from the job.
 *
 * WHY THIS EXISTS AT ALL. The slot registry says `order.dispatch.actions` is
 * handed "the order + its parcel estimate", but the print shop passes the job
 * record alone, so the estimate has to be made here. That makes this the one
 * module in the repo with a real duplication risk: the tables below MIRROR the
 * host's `lib/rates.ts` and `lib/catalogue.ts`, and a parcel weight that
 * disagrees with the app's own delivery band is a defect the works would notice
 * before any test did. When a host starts passing an estimate, this becomes the
 * fallback rather than the source — nothing else in the repo depends on it.
 *
 * The weight follows the host's arithmetic exactly, including the choice that
 * surprises people: sheet work is weighed by the SHEETS the run consumes, not
 * by the trimmed pieces, plus 8% for the wrap. That is deliberately generous —
 * a works would rather over-declare a parcel than have it re-weighed at the
 * depot — and it is the same number the customer already saw on their quote.
 */

/** An SRA3 press sheet is 320 × 450mm; this is what it can actually print. */
const SRA3_PRINTABLE = { widthMm: 310, heightMm: 440 } as const;

/** Area of one SRA3 sheet, in m². */
const SRA3_AREA_SQM = 0.144;

/** Bleed the works needs on every edge, in millimetres. */
const BLEED_MM = 3;

/**
 * Grammage per material key (host `rates.ts`). Vinyl is the one deviation: the
 * host records it as `0` because it is priced by area rather than by weight,
 * and a parcel still has to weigh something, so a real grammage stands here.
 */
const GSM: Readonly<Record<string, number>> = {
  "silk-350": 350,
  "uncoated-300": 300,
  "silk-170": 170,
  "silk-130": 130,
  "pvc-510": 510,
  "mesh-270": 270,
  "canvas-380": 380,
  vinyl: 440,
};

/** The three products that come off the roll printer rather than the sheet press. */
const LARGE_FORMAT = new Set(["roll-up-banners", "pvc-banners", "canvas"]);

/** Size presets, in millimetres (host `catalogue.ts`). */
const SIZES: Readonly<Record<string, { widthMm: number; heightMm: number }>> = {
  "business-card": { widthMm: 85, heightMm: 55 },
  a6: { widthMm: 105, heightMm: 148 },
  a5: { widthMm: 148, heightMm: 210 },
  a4: { widthMm: 210, heightMm: 297 },
  a3: { widthMm: 297, heightMm: 420 },
  dl: { widthMm: 210, heightMm: 99 },
  "us-letter": { widthMm: 216, heightMm: 279 },
  "dl-envelope": { widthMm: 220, heightMm: 110 },
  c5: { widthMm: 229, heightMm: 162 },
};

/**
 * What the packaging adds, in kilograms, and how big the box ends up.
 *
 * Outer dimensions are what the carrier charges volume on, so they are declared
 * per packaging kind rather than derived from the finished size: a bundle of
 * cards and a box of cards are the same paper and two different parcels.
 */
const PACKAGING: Readonly<
  Record<string, { addKg: number; lengthCm: number; widthCm: number; heightCm: number }>
> = {
  bundled: { addKg: 0.1, lengthCm: 32, widthCm: 24, heightCm: 8 },
  "shrink-wrapped": { addKg: 0.15, lengthCm: 33, widthCm: 25, heightCm: 9 },
  boxed: { addKg: 0.45, lengthCm: 34, widthCm: 26, heightCm: 12 },
};

const FALLBACK_PACKAGING = PACKAGING.boxed!;

export interface JobLike {
  productKey: string;
  materialKey: string;
  quantity: number;
  trimWidthMm: number;
  trimHeightMm: number;
  packagingKey: string;
}

export interface ParcelEstimate {
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  /** The numbers the "where did this come from" notes are written from. */
  from: {
    quantity: number;
    productKey: string;
    gsm: number;
    packagingKey: string;
    /** Absent for roll work, which is weighed by area rather than by sheets. */
    sheets?: number;
  };
}

/**
 * How many pieces fit on one press sheet, and how many sheets a run needs.
 *
 * `up = max(fit(w,h), fit(h,w))` over the printable area with the piece at trim
 * plus bleed on every edge. The rotation that wins is recorded on the job
 * ticket in the host app; here it only ever moves the weight, but it moves it
 * by a third on A6 work, so it is worth getting right rather than approximating.
 */
export function sheetsFor(widthMm: number, heightMm: number, quantity: number): number {
  const w = widthMm + BLEED_MM * 2;
  const h = heightMm + BLEED_MM * 2;
  const fit = (a: number, b: number) =>
    Math.floor(SRA3_PRINTABLE.widthMm / a) * Math.floor(SRA3_PRINTABLE.heightMm / b);
  const up = Math.max(fit(w, h), fit(h, w));
  if (up <= 0) return quantity;
  return Math.ceil(quantity / up);
}

/** Round to one decimal — a kilogram to the gram is a false precision on a parcel. */
function kg(value: number): number {
  return Math.round(value * 10) / 10;
}

export function parcelFor(job: JobLike): ParcelEstimate {
  const gsm = GSM[job.materialKey] ?? 250;
  const pack = PACKAGING[job.packagingKey] ?? FALLBACK_PACKAGING;
  const rolled = LARGE_FORMAT.has(job.productKey);

  if (rolled) {
    // Roll media is weighed by the area printed, plus 15% for the core and the
    // wrap, and it travels in a tube rather than the packaging the job names.
    const areaSqm = (job.trimWidthMm / 1000) * (job.trimHeightMm / 1000) * job.quantity;
    const weightKg = Math.max(kg(areaSqm * (gsm / 1000) * 1.15 + 0.3), 0.5);
    return {
      weightKg,
      lengthCm: 120,
      widthCm: 16,
      heightCm: 16,
      from: { quantity: job.quantity, productKey: job.productKey, gsm, packagingKey: "tube" },
    };
  }

  const sheets = sheetsFor(job.trimWidthMm, job.trimHeightMm, job.quantity);
  const paperKg = (sheets * SRA3_AREA_SQM * gsm) / 1000;
  const weightKg = Math.max(kg(paperKg * 1.08 + pack.addKg), 0.1);

  return {
    weightKg,
    lengthCm: pack.lengthCm,
    widthCm: pack.widthCm,
    heightCm: pack.heightCm,
    from: {
      quantity: job.quantity,
      productKey: job.productKey,
      gsm,
      packagingKey: job.packagingKey,
      sheets,
    },
  };
}

/** The finished size a basket line resolves to, whichever way it was chosen. */
export function sizeOf(config: {
  size: string;
  customWidthMm?: number;
  customHeightMm?: number;
}): { widthMm: number; heightMm: number } {
  if (config.size === "custom") {
    return {
      widthMm: config.customWidthMm ?? 210,
      heightMm: config.customHeightMm ?? 297,
    };
  }
  return SIZES[config.size] ?? { widthMm: 210, heightMm: 297 };
}

/**
 * One parcel for a whole basket.
 *
 * A basket of three lines goes in one box, so the weights add and the box is
 * the largest of the packagings — never the sum of three boxes, which is how a
 * checkout quotes a customer for a parcel nobody is going to send.
 */
export function parcelForBasket(
  lines: readonly {
    config: {
      product: string;
      material: string;
      size: string;
      customWidthMm?: number;
      customHeightMm?: number;
      quantity: number;
      packaging: string;
    };
  }[],
): ParcelEstimate {
  if (lines.length === 0) {
    return {
      weightKg: 0.5,
      lengthCm: FALLBACK_PACKAGING.lengthCm,
      widthCm: FALLBACK_PACKAGING.widthCm,
      heightCm: FALLBACK_PACKAGING.heightCm,
      from: { quantity: 0, productKey: "", gsm: 0, packagingKey: "boxed" },
    };
  }

  const each = lines.map((line) => {
    const size = sizeOf(line.config);
    return parcelFor({
      productKey: line.config.product,
      materialKey: line.config.material,
      quantity: line.config.quantity,
      trimWidthMm: size.widthMm,
      trimHeightMm: size.heightMm,
      packagingKey: line.config.packaging,
    });
  });

  const heaviest = each.reduce((a, b) => (b.weightKg > a.weightKg ? b : a));
  return {
    weightKg: kg(each.reduce((sum, p) => sum + p.weightKg, 0)),
    lengthCm: Math.max(...each.map((p) => p.lengthCm)),
    widthCm: Math.max(...each.map((p) => p.widthCm)),
    // One box gets taller as more goes in it; it does not get wider.
    heightCm: Math.min(60, each.reduce((sum, p) => sum + p.heightCm, 0)),
    from: {
      ...heaviest.from,
      quantity: lines.reduce((sum, l) => sum + l.config.quantity, 0),
    },
  };
}
