/*
 * VENDORED from add-ons/packages/import-canva/src/index.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `import-canva`; its manifest, tests and README live in the monorepo.
 */
/**
 * Canva Import — the add-on's entry point.
 *
 * `register()` returns the plain object the host's `AddOn` interface describes.
 * It is a description, not a runtime: the host owns the registry, the enabled
 * set, the OAuth flow, the artwork checks and the order. Everything this
 * add-on does happens inside a slot the host chose to offer.
 *
 * What it exports beyond that is the provider half — `createCanvaSource` — so a
 * host with a provider registry (Phase B, 24 §5.10) can build the
 * `artwork-source@1` implementation without going through a React tree, and the
 * strings, so the host can merge them into its own bundle where the parity
 * check lives.
 */

import { createElement } from "react";

import { SettingsPanel } from "./client/SettingsPanel.tsx";
import { SourceTile } from "./client/SourceTile.tsx";
import "./client/styles.css";
import { createDemoTransport, DEMO_ACCOUNT, type Clock } from "./demo/transport.ts";
import { importCanvaStrings } from "./i18n/strings.ts";
import type { AddOn, AddOnFill } from "../host/index.ts";
import { CONSENT_PERMISSIONS } from "./oauth.ts";
import { ADD_ON_KEY } from "./source.ts";

/**
 * The pinned demo clock: Wednesday, 5 August 2026, 10:20 — the same moment the
 * host pins (`data/demo.ts`'s `NOW`), mirrored rather than imported because
 * this repo cannot depend on the host app.
 *
 * It is the ONLY source of time in this add-on. There is no `Date.now()`
 * anywhere here, so two visitors a month apart see the same four designs edited
 * on the same days, and a screenshot taken today still matches the app in a
 * year (24 D6/D11).
 */
export const PINNED_CLOCK: Clock = { iso: "2026-08-05", hour: 10, minute: 20 };

export function register(): AddOn {
  const transport = createDemoTransport(PINNED_CLOCK);

  /*
   * `AddOnFill<"artwork.sources">` — parameterised by the SLOT, not by a
   * payload type this add-on picks. It used to be `AddOnFill<ArtworkSlotPayload>`
   * and then cast to `AddOnFill<never>` on the way into `fills`, which is the
   * shape of the whole defect in one line: the add-on named the payload, the
   * cast threw the name away, and nothing ever checked it against the host.
   */
  const artworkSource: AddOnFill<"artwork.sources"> = {
    slot: "artwork.sources",
    // Behind Design Studio's 10, on purpose: the shop's own editor leads.
    order: 20,
    render: (payload) => createElement(SourceTile, { payload, transport }),
  };

  return {
    key: ADD_ON_KEY,
    // A proper noun. "Canva" is used nominatively — to say what is being
    // connected to — and nothing here states or implies a partnership, an
    // endorsement or an official status of any kind (24 D12).
    name: "Canva Import",
    shortName: "Canva Import",
    lineKey: "addon.import-canva.line",
    whatKey: "addon.import-canva.what",
    // Letters in a neutral tile. Never a logo, drawn, traced or approximated.
    monogram: "CNV",
    category: "artwork",
    connect: "oauth2",
    permissions: CONSENT_PERMISSIONS.map((key) => ({ key: `addon.import-canva.${key}` })),
    // Nothing beyond the account itself, and no defaults to go with it. The
    // settings panel below says that in words rather than showing an empty
    // form with a heading over it.
    settings: [],
    // The host merges these into its own bundle at registration and asserts
    // that all eight locales carry every key of the English set.
    messages: importCanvaStrings,
    disconnect: {
      goesKey: "addon.import-canva.disconnect.goes",
      staysKey: "addon.import-canva.disconnect.stays",
    },
    /*
     * The shop's seeded record of using this add-on, newest first — RELATIVE,
     * because a day and a paperwork reference are facts about a HOST and this
     * add-on has no way to know either. It used to name `2026-08-04` and
     * `MP-4122`, both of them the print works' own, and both of them printed
     * verbatim in whatever shop registered the add-on.
     *
     * The host dates these with `resolveActivity` and hands them its own recent
     * references; no clock is read here, so the list is still the same list on
     * every run.
     */
    activity: [
      { minutesAgo: 1_198, refIndex: 0, messageKey: "addon.import-canva.act.1" },
      { minutesAgo: 1_200, messageKey: "addon.import-canva.act.2" },
      { minutesAgo: 5_715, messageKey: "addon.import-canva.act.3" },
    ],
    /*
     * The account the connect dialog shows once the consent panel has run. It
     * is this add-on's fact, not the host's — the host used to hold a constant
     * named after this company.
     */
    account: DEMO_ACCOUNT,
    namesCompany: true,
    fills: [
      artworkSource,
      // §5.4's `settings.add-on.panel`, filled rather than declared and left.
      // The transport goes in so the panel can say its account row is a
      // fixture — see `SettingsPanel.tsx` for why that is not optional (AC7).
      {
        slot: "settings.add-on.panel",
        order: 10,
        render: () => createElement(SettingsPanel, { transport }),
      },
    ],
  };
}

export { importCanvaStrings };
export { createCanvaSource, toArtworkRef, ADD_ON_KEY, type Chooser } from "./source.ts";
export { createDemoTransport, type CanvaDesign, type CanvaTransport, type Clock } from "./demo/transport.ts";
export {
  assessImport,
  coverScale,
  requiredSize,
  scaleToCover,
  SAFE_AREA_MM,
  type ImportAssessment,
  type ImportRemedy,
  type ImportVerdict,
} from "./import.ts";
/*
 * WHAT IS DELIBERATELY NOT RE-EXPORTED HERE: `OAUTH` and `VENDOR_API_HOST`.
 *
 * This file is the CLIENT entry point — `manifest.json` points both slot fills
 * at the bundle built from it, and that bundle is served into a page. The
 * vendor's authorize URL, token URL and API hostname are not the client's
 * business: §5.6 gives the OAuth flow to the HOST, so nothing reachable from a
 * browser here ever calls them. Re-exporting them put the vendor hostname in
 * `dist/client.js` twice, which is bytes shipped to every visitor for a value
 * only the installer and the manifest need.
 *
 * They live in `oauth.ts`, which the manifest mirrors, `manifest.test.ts`
 * checks the manifest against, and `server.ts` re-exports for the half that has
 * a use for them. `built-output.test.ts` asserts none of the three strings
 * reaches `dist/client.js` or its stylesheet, so re-adding the export below
 * fails a test rather than quietly growing the bundle again.
 *
 * `CONSENT_PERMISSIONS` stays where it is used — the consent panel imports it
 * directly — and is not part of this file's public surface either.
 */
export type { AddOn } from "../host/index.ts";
export type { ArtworkRef, ArtworkSource, JobSpec } from "../host/contracts/index.ts";
