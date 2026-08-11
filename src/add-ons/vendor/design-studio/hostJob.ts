/*
 * VENDORED from add-ons/packages/design-studio/src/hostJob.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `design-studio`; its manifest, tests and README live in the monorepo.
 */
/**
 * What the host hands `artwork.sources`, and how this add-on reads it.
 *
 * ── A SIZE TABLE USED TO LIVE HERE, AND IT WAS A LIABILITY ──────────────────
 *
 * The slot payload used to be the host's own CONFIGURATION record — a product
 * key and a size PRESET KEY — so this file carried a copy of one print works'
 * `PRESET_SIZES` to turn `a5` into millimetres, with A4 as the fallback for a
 * key it did not recognise. Two things were wrong with that, and only the
 * second one was ever going to be noticed:
 *
 *   the table drifts, quietly, the day the host adds a size; and
 *   IN ANY OTHER HOST EVERY KEY MISSES, so every job silently became A4 — not
 *   an error, not an empty state, just the wrong sheet of paper.
 *
 * `ArtworkSlotPayload` is the shared registry's now, and it carries `job` in
 * MILLIMETRES, resolved by the host that owns the catalogue. Millimetres are
 * millimetres in every shop. This module is what is left of the conversion:
 * one function, no table, nothing to drift.
 */

import type { ArtworkSlotPayload } from "../host/index.ts";
import type { JobSpec } from "../host/contracts/index.ts";

export type { ArtworkSlotPayload };

/**
 * The job, as the `artwork-source@1` contract wants it.
 *
 * The two shapes agree member for member — deliberately, so that the seam a
 * host mounts stays free of the contract registry while an add-on that
 * implements the contract can pass the payload straight through.
 */
export function jobFromPayload(payload: ArtworkSlotPayload): JobSpec {
  return payload.job;
}
