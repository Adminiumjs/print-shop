/*
 * VENDORED from add-ons/packages/design-studio/src/artworkSource.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `design-studio`; its manifest, tests and README live in the monorepo.
 */
/**
 * The `artwork-source@1` implementation (24 §5.5).
 *
 * It is deliberately thin: everything true about the output is already true of
 * the document, so `start()` is "open the editor, and if a document comes back,
 * describe it". There is no fixing-up step here, and there must not be — a
 * source that adjusts its own output on the way out is a source that can get it
 * wrong on the way out.
 *
 * WHAT IS NOT HERE, on purpose: any check of the artwork. The host runs
 * `checkArtwork()` on the returned `ArtworkRef` (§5.5), so this add-on cannot
 * mark its own homework. `doc.test.ts` asserts that the host's own checks pass
 * on this output, which is a very different claim from asserting it here.
 */

import type { ArtworkRef, ArtworkSource, AvailabilityVerdict, JobSpec } from "../host/contracts/index.ts";
import type { Doc } from "./doc.ts";
import { toArtworkRef } from "./doc.ts";
import { translator, type T } from "./i18n/strings.ts";
import { LAYOUT_IDS, layoutById, type StartingLayout } from "./layouts.ts";

/**
 * The works' own size limits (24 D5), restated here because the editor has to
 * decline BEFORE it opens rather than after the customer has drawn something.
 * A canvas larger than this is a job for a print-ready PDF, and saying so up
 * front is more honest than a browser tab that gives up halfway through.
 */
export const MAX_SIDE_MM = 5000;
export const MAX_AREA_SQM = 6;

export interface ArtworkSourceDeps {
  /**
   * Opens the editor and resolves with the finished document, or `null` when
   * the customer backed out. Injected rather than imported so the contract can
   * be exercised headlessly — the conformance suite drives this, not a browser.
   */
  open: (job: JobSpec, layouts: readonly StartingLayout[]) => Promise<Doc | null>;
  /**
   * Which starting layouts the shop has switched on (the manage-panel setting).
   * Defaults to all six.
   */
  allowedLayouts?: readonly string[];
  /** The reader's language; defaults to English for headless callers. */
  t?: T;
}

export const KEY = "design-studio";

export function createArtworkSource(deps: ArtworkSourceDeps): ArtworkSource {
  const t = deps.t ?? translator();
  const allowed = deps.allowedLayouts ?? LAYOUT_IDS;

  const usable = (): StartingLayout[] =>
    allowed.map((id) => layoutById(id)).filter((l): l is StartingLayout => l !== undefined);

  return {
    key: KEY,

    label: () => t("addon.design-studio.tile.title"),

    available(job: JobSpec): AvailabilityVerdict {
      if (usable().length === 0) {
        return { ok: false, reason: t("addon.design-studio.reason.noLayouts") };
      }
      const areaSqm = (job.trimWidthMm / 1000) * (job.trimHeightMm / 1000);
      if (
        job.trimWidthMm > MAX_SIDE_MM ||
        job.trimHeightMm > MAX_SIDE_MM ||
        areaSqm > MAX_AREA_SQM
      ) {
        return { ok: false, reason: t("addon.design-studio.reason.tooBig") };
      }
      return { ok: true };
    },

    async start(job: JobSpec): Promise<ArtworkRef | null> {
      const doc = await deps.open(job, usable());
      return doc === null ? null : toArtworkRef(doc, { source: KEY });
    },
  };
}
