/*
 * VENDORED from add-ons/packages/import-canva/src/source.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `import-canva`; its manifest, tests and README live in the monorepo.
 */
/**
 * The `artwork-source@1` implementation — the half the host talks to.
 *
 * This add-on shares no code with Design Studio, the wave's other
 * implementation of this contract, and that is the point: two unrelated
 * providers, one shape, one conformance suite. If both pass
 * `describeArtworkSource`, the contract is real; if only one does, the contract
 * is a description of one add-on.
 *
 * What it deliberately does NOT do is judge the artwork. The verdicts the flow
 * shows come from `import.ts` so the customer can decide before they commit,
 * but the ruling that matters is the HOST's, run on the `ArtworkRef` this
 * returns (24 §5.5). That is why the ref carries the design's TRUE measurements
 * — a scaled import reports the scaled size and the resolution it cost, never
 * the numbers the works wanted to see.
 */

import type { ArtworkRef, ArtworkSource, AvailabilityVerdict, JobSpec } from "../host/contracts/index.ts";
import type { CanvaDesign, CanvaExport, CanvaTransport } from "./demo/transport.ts";
import { t } from "./i18n/t.ts";

export const ADD_ON_KEY = "import-canva";

/**
 * Past this, a design exported from a browser-based design tool has no business
 * being enlarged onto a banner. The refusal names the size and points at the
 * path that does work, because "not available" with no reason is not an answer.
 */
const MAX_TRIM_SIDE_MM = 1000;

export interface ChooserContext {
  job: JobSpec;
  designs: readonly CanvaDesign[];
  transport: CanvaTransport;
}

/**
 * How the flow ends. In the browser this is the three-step surface resolving
 * when the customer presses "Use this design"; in the conformance suite it is a
 * scripted function. `null` is the customer backing out, which the contract
 * requires and the suite checks.
 */
export type Chooser = (ctx: ChooserContext) => Promise<CanvaExport | null>;

export function createCanvaSource(opts: {
  transport: CanvaTransport;
  choose: Chooser;
}): ArtworkSource {
  const { transport, choose } = opts;

  const available = (job: JobSpec): AvailabilityVerdict => {
    const longest = Math.max(job.trimWidthMm, job.trimHeightMm);
    if (longest > MAX_TRIM_SIDE_MM) {
      return {
        ok: false,
        reason: t("unavailable.tooBig", { w: job.trimWidthMm, h: job.trimHeightMm }),
      };
    }
    return { ok: true };
  };

  return {
    key: ADD_ON_KEY,

    label: () => t("tile.title"),

    available,

    async start(job) {
      // The host does not offer an unavailable source, so this is a guard
      // rather than a code path: reaching it means the tile was rendered for a
      // job it declined, and backing out is the only honest answer left.
      if (!available(job).ok) return null;

      const designs = await transport.list();
      const chosen = await choose({ job, designs, transport });
      if (chosen === null) return null;
      return toArtworkRef(chosen);
    },
  };
}

export function toArtworkRef(exported: CanvaExport): ArtworkRef {
  const { design } = exported;
  return {
    fileId: exported.fileId,
    source: ADD_ON_KEY,
    widthMm: design.widthMm,
    heightMm: design.heightMm,
    bleedMm: design.bleedMm,
    dpi: Math.round(design.dpi),
    pages: design.pages,
    previewFileId: `${exported.fileId}-preview`,
  };
}
