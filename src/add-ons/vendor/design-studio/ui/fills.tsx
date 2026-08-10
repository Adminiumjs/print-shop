/*
 * VENDORED from add-ons/packages/design-studio/src/ui/fills.tsx — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `design-studio`; its manifest, tests and README live in the monorepo.
 */
/**
 * The two slot fills, wrapped so `index.ts` can stay a plain registration
 * module with no JSX in it.
 *
 * Each wrapper does one thing the raw component cannot: reach the host's
 * language (`useHostT`) and unpack the shop's saved settings out of the
 * payload. A fill is handed a payload and nothing else, so this is where the
 * outside world gets turned into props.
 *
 * The host injects THIS add-on's own saved values as `payload.settings` — it
 * does not look them up by add-on key and pass them along, because that would
 * be a customer-facing screen naming an add-on.
 */

import { LAYOUT_IDS } from "../layouts.ts";
import type { SettingsPanelPayload } from "../../host/index.ts";
import type { ArtworkSlotPayload } from "../hostJob.ts";
import { SettingsPanel, type PublicSettings } from "./SettingsPanel.tsx";
import { ArtworkSourceTile } from "./SourceTile.tsx";
import { useHostT } from "./useHostLocale.ts";

/**
 * The non-secret settings the client half may read (`publicSettings` in the
 * manifest, D15), declared beside the panel that edits them. There is nothing
 * secret to leak here — `connect` is `none` and there is no account — but the
 * declaration is not conditional on having something to hide, and an add-on
 * that only declares its surface when it is inconvenient not to has not really
 * declared it.
 */
export type { PublicSettings };

/** The shop's settings form. See `SettingsPanel.tsx` for why it lives here. */
export function SettingsFill({ payload }: { payload: SettingsPanelPayload }) {
  return <SettingsPanel payload={payload} />;
}

export function ArtworkFill({
  payload,
}: {
  payload: ArtworkSlotPayload & { settings?: PublicSettings };
}) {
  const t = useHostT();
  return (
    <ArtworkSourceTile
      payload={payload}
      t={t}
      allowedLayouts={payload.settings?.starting_layouts ?? LAYOUT_IDS}
    />
  );
}
