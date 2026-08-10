/*
 * VENDORED from add-ons/packages/import-canva/src/job.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `import-canva`; its manifest, tests and README live in the monorepo.
 */
/**
 * Turning what the host hands a slot fill into what this add-on needs.
 *
 * The `artwork.sources` slot's payload is the CONFIGURED JOB — the host's own
 * `Configuration` object, which names a size by preset key rather than in
 * millimetres. Resolving that key needs the preset table, so the table is
 * copied here for the same reason the contracts and `tokens.css` are mirrored:
 * a standalone repo cannot import the host app's `catalogue.ts`.
 *
 * Copied numbers are a liability, so this reads the host's own resolution FIRST
 * (`payload.size`) and only falls back to the table when the host did not send
 * one. A host that grows a new preset therefore keeps working here without this
 * file being touched — the fallback exists for the six sizes that have been
 * there since the app shipped, not as a second source of truth.
 */

import type { ArtworkRef, JobSpec } from "../host/contracts/index.ts";
import type { ImportJob } from "./import.ts";

/** Copied from the host's `rates.ts`. The works' bleed and resolution floor. */
export const BLEED_MM = 3;
export const MIN_DPI = 150;

/** Copied from the host's `catalogue.ts`, in millimetres. */
const PRESET_SIZES: Readonly<Record<string, { widthMm: number; heightMm: number }>> = {
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

/** The subset of the host's `Configuration` this add-on reads. */
export interface HostConfiguration {
  product: string;
  /** A preset key, or `custom` with the millimetres below. */
  size: string;
  customWidthMm?: number;
  customHeightMm?: number;
  sides: 1 | 2;
  quantity: number;
}

/**
 * What the host passes into the `artwork.sources` fill.
 *
 * `onArtwork` is optional because the Print Shop currently passes `{ config }`
 * and nothing else — see the README's "What the host still owes this add-on".
 * When it is absent the flow still runs and still resolves an `ArtworkRef`
 * through the provider, but nothing carries the result back onto the order, so
 * the fill renders its result and stops rather than pretending it landed.
 */
export interface ArtworkSlotPayload {
  config: HostConfiguration;
  /** The host's own resolution of the configured size, when it sends one. */
  size?: { widthMm: number; heightMm: number };
  /** The product's name, already localized by the host. */
  productLabel?: string;
  onArtwork?: (ref: ArtworkRef) => void;
}

export function toJobSpec(payload: ArtworkSlotPayload): JobSpec {
  const { config } = payload;
  const resolved =
    payload.size ??
    (config.size === "custom"
      ? {
          widthMm: config.customWidthMm ?? 0,
          heightMm: config.customHeightMm ?? 0,
        }
      : PRESET_SIZES[config.size]) ??
    { widthMm: 0, heightMm: 0 };

  return {
    productKey: config.product,
    // Falling back to the key rather than to an invented English name: a raw
    // `business-cards` on screen is obviously a bug, whereas a hard-coded
    // "Business cards" would silently be wrong in seven locales.
    productLabel: payload.productLabel ?? config.product,
    trimWidthMm: resolved.widthMm,
    trimHeightMm: resolved.heightMm,
    bleedMm: BLEED_MM,
    sides: config.sides,
    quantity: config.quantity,
  };
}

export function toImportJob(job: JobSpec): ImportJob {
  return {
    trimWidthMm: job.trimWidthMm,
    trimHeightMm: job.trimHeightMm,
    bleedMm: job.bleedMm,
    sides: job.sides,
    minDpi: MIN_DPI,
  };
}
