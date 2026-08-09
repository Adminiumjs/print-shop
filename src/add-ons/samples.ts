/**
 * One representative job per product family, for `settings.add-on.panel`.
 *
 * WHAT THIS IS AND WHAT IT IS NOT. It is the shop's own catalogue, narrowed to
 * one job per family and labelled in the reader's language — knowledge the host
 * has and no add-on does. It is NOT an estimate of anything: there is no weight
 * here, no size band, no rate. An add-on that has an opinion about the shop's
 * catalogue forms it with its own engine from these jobs, and an add-on that has
 * none ignores the field.
 *
 * The manage drawer used to hold a table of default parcel weights computed by
 * importing the carrier's `parcelFor()` into host chrome. That is the seam this
 * module replaces: the host passes the job, the add-on decides what it weighs.
 */

import type { SampleJob } from './host.ts';
import { PRODUCTS, SIZE_BY_KEY } from '../lib/catalogue.ts';

/**
 * `label` is resolved by the caller, which is the only part that needs a `t`.
 * One row per FAMILY rather than per product, because a settings panel listing
 * every product would be a catalogue, and the point of the row is the shape of
 * the thing rather than its name.
 */
export function sampleJobs(label: (productKey: string) => string): SampleJob[] {
  const seen = new Set<string>();
  const rows: SampleJob[] = [];

  for (const product of PRODUCTS) {
    if (seen.has(product.family)) continue;
    seen.add(product.family);
    const size = SIZE_BY_KEY[product.sizes[0]!];
    rows.push({
      label: label(product.key),
      productKey: product.key,
      materialKey: product.materials[0]!,
      quantity: product.fromQuantity,
      // Off the roll there is no preset, so the store's own default custom
      // size stands in — the same 800 × 2000mm a customer starts from.
      trimWidthMm: size?.widthMm ?? 800,
      trimHeightMm: size?.heightMm ?? 2000,
      packagingKey: product.packaging[0]!,
    });
  }

  return rows;
}
