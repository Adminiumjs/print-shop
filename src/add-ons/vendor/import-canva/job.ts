/*
 * VENDORED from add-ons/packages/import-canva/src/job.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `import-canva`; its manifest, tests and README live in the monorepo.
 */
/**
 * What the host hands `artwork.sources`, and how this add-on reads it.
 *
 * ── A SIZE TABLE USED TO LIVE HERE, AND IT WAS A LIABILITY ──────────────────
 *
 * The payload used to be the host's own CONFIGURATION record, naming a size by
 * PRESET KEY, so this file carried a copy of one print works' size table to
 * resolve it. Two things were wrong with that, and only the second was ever
 * going to be noticed: the copy drifts the day the host adds a size, and in any
 * OTHER host every key misses — so every import silently resolved to a size of
 * zero by zero, which is not an error and not an empty state, just wrong.
 *
 * `ArtworkSlotPayload` is the shared registry's now and carries `job` in
 * MILLIMETRES, resolved by the host that owns the catalogue. What is left here
 * is the conversion into this add-on's own import job.
 */

import type { ArtworkSlotPayload } from "../host/index.ts";
import type { JobSpec } from "../host/contracts/index.ts";
import type { ImportJob } from "./import.ts";

export type { ArtworkSlotPayload };

/** Copied from the host's `rates.ts`. The works' bleed and resolution floor. */
export const BLEED_MM = 3;
export const MIN_DPI = 150;

/**
 * The job, as the `artwork-source@1` contract wants it.
 *
 * The two shapes agree member for member — deliberately, so the seam a host
 * mounts stays free of the contract registry while an add-on that implements
 * the contract can pass the payload straight through.
 */
export function toJobSpec(payload: ArtworkSlotPayload): JobSpec {
  return payload.job;
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
