/*
 * VENDORED from add-on-design-studio/src/index.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the add-on repo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `design-studio`; its manifest, tests and README live in that repo.
 */
/**
 * Design Studio — the add-on's registration (24 §6).
 *
 * `register()` returns the object the host's `src/add-ons/host.ts` describes,
 * and that object is the whole public surface: the host's registry indexes it,
 * the dock's toggle flips it on and off, and its two fills are the only places
 * this add-on ever draws.
 *
 * IT FILLS `artwork.sources` AND `settings.add-on.panel`, AND NOT A ROUTE. An
 * earlier version also filled `nav.add-on.routes` with a full-screen editor at
 * `/add-ons/design-studio/edit`, and the Print Shop — which switches views off
 * one store field and has no router at all — never mounted that slot, so the
 * fill was dead code behind a URL nothing linked to. The editor is reached from
 * the artwork tile instead, which is the path `artworkSource.ts` and the
 * conformance suite both drive. A host with a router can host the slot; this
 * add-on no longer claims one. There is no side effect on import — no global, no
 * patched host, no listener — which is what lets the host register an add-on,
 * unregister it, and be back to exactly its base state (D6).
 *
 * `connect: "none"` is the honest answer here and it changes what the connect
 * dialog shows: no credential form, no account, one click. The permission list
 * is still explicit, because "it needs nothing" is a claim a shop owner should
 * be able to read rather than infer from an empty form.
 */

import { createElement } from "react";

import type { AddOn, AddOnSettingValues, SettingsPanelPayload } from "./host.ts";
import { designStudioStrings } from "./i18n/strings.ts";
import { LAYOUT_IDS } from "./layouts.ts";
import { ArtworkFill, SettingsFill } from "./ui/fills.tsx";
import type { ArtworkSlotPayload } from "./hostJob.ts";
import "./styles/design-studio.css";

export function register(): AddOn {
  return {
    key: "design-studio",
    // A name, not an i18n key: a translated product name is a different
    // product. Everything ABOUT the add-on below is a key and does translate.
    name: "Design Studio",
    shortName: "Design Studio",
    lineKey: "addon.design-studio.line",
    whatKey: "addon.design-studio.what",
    // Two letters in a neutral tile. Never a logo (D12) — and there is no
    // company here to have one.
    monogram: "DS",
    category: "artwork",
    connect: "none",

    permissions: [
      { key: "addon.design-studio.perm.readJob" },
      { key: "addon.design-studio.perm.saveDesigns" },
      { key: "addon.design-studio.perm.noAccount" },
    ],

    /*
     * MACHINE KEYS, matching `manifest.json` and the values the panel saves.
     * They were i18n keys here until the settings seam landed, which meant one
     * add-on's declaration spoke a different alphabet from the next one's and
     * the host normalised between them. The words on the controls are in
     * `ui/SettingsPanel.tsx`, where the add-on renders its own form.
     */
    settings: [
      { key: "starting_layouts", kind: "multi", options: LAYOUT_IDS },
      { key: "proof_required", kind: "boolean" },
    ],

    defaultSettings: {
      // Every layout the editor ships with, in its own order. A shop that wants
      // fewer turns them off; a shop that does nothing gets all six.
      starting_layouts: [...LAYOUT_IDS],
      // Default ON. The works checks every job and the site already says so, so
      // an add-on that quietly switched the proof off would be overruling the
      // shop's own promise from inside a settings panel.
      proof_required: true,
    },

    // The host merges these into its own bundle at registration and asserts
    // that all eight locales carry every key of the English set.
    messages: designStudioStrings,

    disconnect: {
      goesKey: "addon.design-studio.disconnect.goes",
      staysKey: "addon.design-studio.disconnect.stays",
    },

    /*
     * The shop's seeded record of using this add-on, newest first, pinned to
     * the demo's Wednesday 5 August 2026 — no clock is read anywhere here, so a
     * screenshot taken today still matches the app in a year.
     */
    activity: [
      { iso: "2026-08-05", hour: 9, minute: 41, ref: "MP-4124", messageKey: "addon.design-studio.act.1" },
      { iso: "2026-08-04", hour: 16, minute: 8, ref: "", messageKey: "addon.design-studio.act.2" },
      { iso: "2026-08-04", hour: 11, minute: 52, ref: "MP-4121", messageKey: "addon.design-studio.act.3" },
    ],

    /*
     * The host asks; it does not read `proof_required` itself. The switch is
     * this add-on's and the sentence the customer sees is the shop's, so the
     * question crosses the seam as a question rather than as a field name.
     */
    proofsArtwork: (settings: AddOnSettingValues) =>
      (settings as { proof_required?: boolean }).proof_required !== false,

    /**
     * FALSE, and the consequence is deliberate: the host renders "Adminium is
     * not affiliated with this company" only where a company is named, and this
     * add-on names none. It connects to nothing, calls nothing and needs no
     * account. Carrying a disclaimer about a company that does not exist would
     * be noise, and `TRADEMARKS.md` records the same fact in writing.
     */
    namesCompany: false,

    /*
     * AND THIS IS WHAT THE DETAIL SURFACES SAY INSTEAD, in all eight locales.
     *
     * The connect dialog, the consent panel and the manage drawer each end on
     * one line about who else is involved. For an add-on that names a company
     * that line is the disclaimer; for this one it is the positive fact, in the
     * same place, so a shop owner reading any of the three never has to work
     * out whether the notice is absent or merely forgotten.
     *
     * The words are here rather than in the host because the host names no
     * add-on and holds no add-on's copy (AC5): a host-side "this one connects
     * to nothing" would be the host asserting a fact about an add-on it is not
     * supposed to know. The settings panel repeats it at the foot of its own
     * form, where a shop owner changing a setting is looking.
     */
    noCompanyKeys: ["addon.design-studio.noCompany", "addon.design-studio.noAccount"],

    fills: [
      {
        slot: "artwork.sources",
        order: 10,
        render: (payload) =>
          createElement(ArtworkFill, { payload: payload as ArtworkSlotPayload }),
      },
      /*
       * §5.4 declares `settings.add-on.panel` a real slot, and this is what
       * fills it. Before, the manage drawer hand-wrote this form behind
       * `addOn.key === "design-studio"` — a declared-but-never-filled slot next
       * to a host that knew three add-ons by name.
       */
      {
        slot: "settings.add-on.panel",
        order: 10,
        render: (payload) =>
          createElement(SettingsFill, { payload: payload as SettingsPanelPayload }),
      },
    ],
  };
}

// The engine and the contract implementation, for a host that wants them
// without the React half — the server side of a Phase B install, and the
// website's demo build, both do.
export {
  BLEED_MM,
  OUTPUT_DPI,
  SAFE_MM,
  outsideSafeArea,
  toArtworkFile,
  toArtworkRef,
  toDesignRecord,
  type Doc,
  type DesignRecord,
} from "./doc.ts";
export { createArtworkSource, KEY } from "./artworkSource.ts";
export { LAYOUTS, LAYOUT_IDS, docFromLayout, layoutForSize } from "./layouts.ts";
export { designStudioStrings } from "./i18n/strings.ts";
export type { AddOn } from "./host.ts";
export type { ArtworkRef, ArtworkSource, JobSpec } from "./contracts.ts";
