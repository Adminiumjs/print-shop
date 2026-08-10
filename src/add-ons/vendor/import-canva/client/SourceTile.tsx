/*
 * VENDORED from add-ons/packages/import-canva/src/client/SourceTile.tsx — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `import-canva`; its manifest, tests and README live in the monorepo.
 */
/**
 * The `artwork.sources` fill: one action tile, and the flow behind it.
 *
 * It fills the panel the host draws whether or not any add-on exists — "More
 * ways to send artwork", which reads as an honest empty state when nothing is
 * connected (24 D6). At order 20 this tile sits behind Design Studio's 10,
 * deliberately: the shop's own editor leads, and a customer who has not made
 * anything yet should meet it first.
 *
 * The tile drives the flow THROUGH the provider — `source.start(job)` — rather
 * than beside it. One code path serves both the contract and the screen, which
 * is the only way the conformance suite is evidence about what a customer
 * actually gets rather than about a second implementation kept alongside it.
 */

import { useMemo, useState } from "react";

import type { CanvaExport, CanvaTransport } from "../demo/transport.ts";
import { useAddOnT } from "../i18n/useT.ts";
import { toJobSpec, type ArtworkSlotPayload } from "../job.ts";
import { createCanvaSource, type ChooserContext } from "../source.ts";
import { ImportFlow } from "./ImportFlow.tsx";
import { Monogram } from "./bits.tsx";

/** A chooser waiting on the customer: what to show, and where to send the answer. */
interface Pending {
  ctx: ChooserContext;
  resolve: (exported: CanvaExport | null) => void;
}

export function SourceTile({
  payload,
  transport,
}: {
  payload: ArtworkSlotPayload;
  transport: CanvaTransport;
}) {
  const t = useAddOnT();
  const [pending, setPending] = useState<Pending | null>(null);

  const job = useMemo(() => toJobSpec(payload), [payload]);

  const source = useMemo(
    () =>
      createCanvaSource({
        transport,
        // The UI IS the chooser: `start()` blocks here until the customer picks
        // a design or backs out, which is exactly what the contract describes.
        choose: (ctx) =>
          new Promise<CanvaExport | null>((resolve) => setPending({ ctx, resolve })),
      }),
    [transport],
  );

  const availability = source.available(job);

  const open = async (): Promise<void> => {
    const ref = await source.start(job);
    setPending(null);
    // `onArtwork` is what carries the imported design onto the order. The host
    // does not pass it yet (see the README), so when it is absent the import
    // simply ends rather than pretending it landed somewhere.
    if (ref !== null) payload.onArtwork?.(ref);
  };

  if (!availability.ok) {
    // A source that cannot serve this job says why, in the tile's own space,
    // instead of vanishing and leaving a customer to wonder where it went.
    return (
      <div className="cvi-tile-action" style={{ cursor: "default" }}>
        <Monogram />
        <span>
          <span className="cvi-tile-title">{source.label(job)}</span>
          <span className="cvi-tile-body">{availability.reason}</span>
        </span>
      </div>
    );
  }

  return (
    <>
      <button type="button" className="cvi-tile-action" onClick={() => void open()}>
        <Monogram />
        <span>
          <span className="cvi-tile-title">{t("tile.title")}</span>
          <span className="cvi-tile-body">{t("tile.body")}</span>
        </span>
      </button>

      {pending !== null && (
        <ImportFlow
          job={pending.ctx.job}
          designs={pending.ctx.designs}
          transport={pending.ctx.transport}
          onResolve={(exported) => pending.resolve(exported)}
        />
      )}
    </>
  );
}
