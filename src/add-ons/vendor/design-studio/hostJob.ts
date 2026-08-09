/*
 * VENDORED from add-on-design-studio/src/hostJob.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the add-on repo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `design-studio`; its manifest, tests and README live in that repo.
 */
/**
 * Turning what the host hands the `artwork.sources` slot into a `JobSpec`.
 *
 * The slot's payload is the configuration the customer just built — product,
 * size key, sides, quantity — and the contract wants finished millimetres. The
 * preset table below is COPIED from the host's `src/lib/catalogue.ts`
 * (`PRESET_SIZES`) for the standing reason: this repo is published standalone
 * and cannot import the app it attaches to.
 *
 * Copying a table risks drift, so this reads the payload's own `job` FIRST when
 * the host supplies one. A host that resolves the size itself is always right;
 * the table is the fallback for one that does not, and an unknown key falls
 * through to A4 rather than to a crash — the customer is about to pick a
 * starting layout anyway, and the picked layout is what the document is built
 * from.
 */

import type { ArtworkRef, JobSpec } from "./contracts.ts";
import { BLEED_MM } from "./doc.ts";

/** Finished sizes in millimetres, keyed as the host keys them. */
const PRESET_SIZES: Record<string, { widthMm: number; heightMm: number }> = {
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

/** The host's configuration record, narrowed to the fields this add-on reads. */
export interface HostConfiguration {
  product: string;
  size: string;
  customWidthMm?: number;
  customHeightMm?: number;
  sides: 1 | 2;
  quantity: number;
}

/**
 * What the host passes into `artwork.sources`.
 *
 * `onArtwork` is how the finished `ArtworkRef` gets back into the order. It is
 * OPTIONAL because the host's slot payload is `{ config }` today; when it is
 * absent the tile still completes the flow and reports the result in place
 * rather than pretending the design reached an order it never touched.
 */
export interface ArtworkSlotPayload {
  config?: HostConfiguration;
  /** A host that has already resolved the job supplies it, and it wins. */
  job?: JobSpec;
  onArtwork?: (ref: ArtworkRef) => void;
}

const A4 = { widthMm: 210, heightMm: 297 };

export function jobFromPayload(payload: ArtworkSlotPayload): JobSpec {
  if (payload.job !== undefined) return payload.job;

  const config = payload.config;
  if (config === undefined) {
    return {
      productKey: "unknown",
      productLabel: "",
      trimWidthMm: A4.widthMm,
      trimHeightMm: A4.heightMm,
      bleedMm: BLEED_MM,
      sides: 1,
      quantity: 1,
    };
  }

  const size =
    config.size === "custom"
      ? {
          widthMm: config.customWidthMm ?? A4.widthMm,
          heightMm: config.customHeightMm ?? A4.heightMm,
        }
      : (PRESET_SIZES[config.size] ?? A4);

  return {
    productKey: config.product,
    productLabel: config.product,
    trimWidthMm: size.widthMm,
    trimHeightMm: size.heightMm,
    bleedMm: BLEED_MM,
    sides: config.sides,
    quantity: config.quantity,
  };
}
