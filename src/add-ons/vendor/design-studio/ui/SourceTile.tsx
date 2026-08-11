/*
 * VENDORED from add-ons/packages/design-studio/src/ui/SourceTile.tsx — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `design-studio`; its manifest, tests and README live in the monorepo.
 */
/**
 * The `artwork.sources` fill: one action tile, and the flow behind it.
 *
 * The tile is the whole of this add-on's presence in the base app. With it
 * switched off the host renders its own honest empty state ("More ways to send
 * artwork") and nothing here leaves a trace — no orphan button, no dead link,
 * no placeholder (24 D6). That is what makes an add-on optional rather than
 * the way the app was always going to work.
 *
 * The flow runs through the CONTRACT rather than around it: `start()` from
 * `artworkSource.ts` opens the editor and resolves to an `ArtworkRef`, exactly
 * as it does headlessly in the conformance suite. Wiring the UI to a different
 * path than the one the tests exercise is how a passing suite stops meaning
 * anything.
 */

import { CheckCircle2, PenLine } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { createArtworkSource } from "../artworkSource.ts";
import type { ArtworkRef } from "../../host/contracts/index.ts";
import type { Doc } from "../doc.ts";
import type { T } from "../i18n/strings.ts";
import { jobFromPayload, type ArtworkSlotPayload } from "../hostJob.ts";
import { layoutForSize, type StartingLayout } from "../layouts.ts";
import { Editor } from "./Editor.tsx";
import { Monogram } from "./Monogram.tsx";

/**
 * What became of the flow. `saved` and `used` are genuinely different outcomes
 * and the copy says so: one design is on the job, the other is waiting in the
 * customer's own designs, and telling a customer their artwork is attached when
 * it is not is the kind of small lie that costs a reprint.
 */
type Outcome = { kind: "used"; ref: ArtworkRef } | { kind: "saved" } | null;

export function ArtworkSourceTile({
  payload,
  t,
  allowedLayouts,
}: {
  payload: ArtworkSlotPayload;
  t: T;
  /** The layouts the shop has switched on, from the manage panel. */
  allowedLayouts?: readonly string[];
}) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [offered, setOffered] = useState<readonly StartingLayout[]>([]);
  const [outcome, setOutcome] = useState<Outcome>(null);

  // Held across the await: `start()` resolves when the editor closes, and this
  // is the only thing that knows how to close it.
  const resolve = useRef<((doc: Doc | null) => void) | null>(null);

  const job = useMemo(() => jobFromPayload(payload), [payload]);

  const source = useMemo(
    () =>
      createArtworkSource({
        allowedLayouts,
        t,
        open: (_job, layouts) => {
          setOffered(layouts);
          setEditorOpen(true);
          return new Promise<Doc | null>((r) => {
            resolve.current = r;
          });
        },
      }),
    [allowedLayouts, t],
  );

  const verdict = source.available(job);

  const begin = () => {
    setOutcome(null);
    void source.start(job).then((produced) => {
      if (produced === null) return;
      setOutcome({ kind: "used", ref: produced });
      // When the host has wired the sink, the design goes into the order. When
      // it has not, the card below is the honest end of the flow.
      payload.onArtwork?.(produced);
    });
  };

  const close = (doc: Doc | null) => {
    setEditorOpen(false);
    resolve.current?.(doc);
    resolve.current = null;
  };

  return (
    <>
      {outcome === null ? (
        <button
          type="button"
          className="ds-source-tile"
          onClick={begin}
          disabled={!verdict.ok}
          title={verdict.ok ? undefined : verdict.reason}
        >
          <Monogram />
          <span style={{ minInlineSize: 0 }}>
            <span className="ds-source-title">
              <PenLine size={14} aria-hidden style={{ display: "inline", verticalAlign: "-2px" }} />{" "}
              {source.label(job)}
            </span>
            <span className="ds-source-body">
              {verdict.ok ? t("addon.design-studio.tile.body") : verdict.reason}
            </span>
          </span>
        </button>
      ) : (
        <div className="ds-result">
          <div className="ds-result-head">
            <CheckCircle2 size={16} aria-hidden />
            {t("addon.design-studio.result.title")}
          </div>
          {outcome.kind === "used" && (
            <div className="ds-result-facts">
              {/*
                      * THROUGH `t()`, so the figures are formatted and the unit
                      * is translated. Written as `{w} × {h}mm` in JSX this was
                      * three separate text nodes — a raw number, a separator, a
                      * raw number — and an English unit glued to the second. On
                      * an Arabic page that is Latin digits; the host's own
                      * guard could not see them because its rule exempted any
                      * token with a Latin letter in it, and `55mm` has two.
                      */}
              <span className="ds-chip ds-mono">
                {t("addon.design-studio.dims", {
                  w: outcome.ref.widthMm,
                  h: outcome.ref.heightMm,
                })}
              </span>
              <span className="ds-chip ds-mono">
                {t("addon.design-studio.mmValue", { v: outcome.ref.bleedMm })}
              </span>
              <span className="ds-chip ds-mono">
                {t("addon.design-studio.dpiValue", { v: outcome.ref.dpi })}
              </span>
              <span className="ds-chip ds-mono">{outcome.ref.fileId}</span>
            </div>
          )}
          <p className="ds-source-body" style={{ margin: 0 }}>
            {t(
              outcome.kind === "used"
                ? "addon.design-studio.result.why"
                : "addon.design-studio.result.saved",
            )}
          </p>
          <button type="button" className="ds-btn" style={{ alignSelf: "start" }} onClick={begin}>
            {t("addon.design-studio.result.reopen")}
          </button>
        </div>
      )}

      {editorOpen && (
        <Editor
          productLabel={job.productLabel}
          layouts={offered}
          initialLayout={initialLayoutFor(job.trimWidthMm, job.trimHeightMm, offered)}
          t={t}
          onUse={(doc) => close(doc)}
          onSave={() => {
            // "Save and come back" keeps the design against the order WITHOUT
            // sending it, so the flow resolves to null — nothing reached the job.
            close(null);
            setOutcome({ kind: "saved" });
          }}
          onCancel={() => close(null)}
        />
      )}
    </>
  );
}

/**
 * Skip the picker when the configured job already answers its question. A
 * customer who has just chosen 500 business cards should not be asked what they
 * are making — but only if that layout is one the shop still offers.
 */
function initialLayoutFor(
  widthMm: number,
  heightMm: number,
  offered: readonly StartingLayout[],
): StartingLayout | undefined {
  const match = layoutForSize(widthMm, heightMm);
  if (match === undefined) return undefined;
  const exact = match.widthMm === widthMm && match.heightMm === heightMm;
  return exact && offered.some((l) => l.id === match.id) ? match : undefined;
}
