/*
 * VENDORED from add-ons/packages/shipping-dhl/src/index.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `shipping-dhl`; its manifest, tests and README live in the monorepo.
 */
/**
 * What the host gets when it registers this add-on.
 *
 * One function returning one plain object. No side effects at import time, no
 * global registration, no reaching into the host: the host asks, the add-on
 * answers, and everything the host needs to draw a shelf row, a connect dialog
 * and three surfaces is in the value it gets back.
 *
 * SCOPE, restated where someone would come looking to widen it (24 §7): this
 * books parcel collections with a carrier. It is not job dispatch, not
 * field-service routing and not driver management, and the fact that it fills a
 * slot called `order.dispatch.actions` does not make it any of those.
 */

import { createElement } from "react";

import type { AddOn, SettingsPanelPayload } from "../host/index.ts";
import type { CheckoutPayload, DispatchPayload } from "./host-payloads.ts";
import { strings } from "./i18n/strings.ts";
import { applySettings, DEFAULT_SETTINGS } from "./settings.ts";
import { DeliveryMethods } from "./ui/DeliveryMethods.tsx";
import { DispatchAction } from "./ui/DispatchAction.tsx";
import { SettingsPanel } from "./ui/SettingsPanel.tsx";
import { TrackingPanel } from "./ui/TrackingPanel.tsx";

export function register(): AddOn {
  return {
    key: "shipping-dhl",
    // A product name, not a message key: a translated product name is a
    // different product. Everything ABOUT the add-on is a key and does
    // translate. The company is named here only to say what is connected to.
    name: "DHL Shipping",
    shortName: "DHL",
    lineKey: "addon.shipping-dhl.line",
    whatKey: "addon.shipping-dhl.what",
    // Three letters on a neutral tile — never a mark, drawn or traced (D12).
    monogram: "DHL",
    category: "delivery",
    connect: "api-key",
    permissions: [
      { key: "addon.shipping-dhl.perm.rates" },
      { key: "addon.shipping-dhl.perm.shipments" },
      { key: "addon.shipping-dhl.perm.labels" },
    ],
    // The two secret settings are absent on purpose: `settings` here is what
    // the settings panel may render in the browser, and a secret has no
    // business in a client bundle (D15). The keys are machine keys — the same
    // ones `manifest.json` declares and `settings.ts` reads.
    settings: [
      { key: "demo_transport", kind: "boolean" },
      { key: "collection_cutoff", kind: "time" },
    ],
    defaultSettings: { ...DEFAULT_SETTINGS },
    /*
     * The host pushes; this add-on does not poll. Its engines are handed
     * settings rather than a store, so a rate quoted a second after the shop
     * moved the cut-off has to be priced off the new one.
     */
    applySettings,
    // The host merges these into its own bundle at registration and asserts
    // that all eight locales carry every key of the English set.
    messages: strings,
    disconnect: {
      goesKey: "addon.shipping-dhl.disconnect.goes",
      staysKey: "addon.shipping-dhl.disconnect.stays",
    },
    /*
     * The shop's seeded record of using this add-on, newest first, pinned to
     * the demo's Wednesday 5 August 2026 — no clock is read anywhere here.
     */
    activity: [
      { iso: "2026-08-05", hour: 9, minute: 58, ref: "MP-4119", messageKey: "addon.shipping-dhl.act.1" },
      { iso: "2026-08-05", hour: 9, minute: 55, ref: "MP-4119", messageKey: "addon.shipping-dhl.act.2" },
      { iso: "2026-08-04", hour: 15, minute: 2, ref: "MP-4116", messageKey: "addon.shipping-dhl.act.3" },
    ],
    /*
     * D11, declared rather than hard-coded in the host's dialog. The host shows
     * the switch and skips the credential fields while it is on; it does not
     * learn that "demo_transport" means a stand-in for a delivery company.
     */
    demoSwitch: {
      key: "demo_transport",
      labelKey: "addon.shipping-dhl.set.demo",
      noteOnKey: "addon.shipping-dhl.set.demoOn",
      noteOffKey: "addon.shipping-dhl.set.demoOff",
    },
    namesCompany: true,
    fills: [
      /*
       * `render` returns an ELEMENT rather than calling a function that uses
       * hooks. The host maps over fills inside its own render, so a fill that
       * called `useState` directly would be borrowing the host component's hook
       * slots — stable today, broken the first time a fill is conditional.
       */
      {
        slot: "order.dispatch.actions",
        order: 10,
        render: (payload) => createElement(DispatchAction, payload as DispatchPayload),
      },
      {
        slot: "checkout.delivery.methods",
        order: 10,
        render: (payload) => createElement(DeliveryMethods, payload as CheckoutPayload),
      },
      {
        slot: "order.dispatch.panel",
        order: 10,
        render: (payload) => createElement(TrackingPanel, payload as DispatchPayload),
      },
      /*
       * §5.4 declares `settings.add-on.panel` a real slot, and this is what
       * fills it — including the default parcel weights, which the host used to
       * compute by importing this repo's `parcel.ts` into its own chrome.
       */
      {
        slot: "settings.add-on.panel",
        order: 10,
        render: (payload) =>
          createElement(SettingsPanel, { payload: payload as SettingsPanelPayload }),
      },
    ] as AddOn["fills"],
  };
}

/** The strings the host merges into its own bundle before rendering any fill. */
export { strings } from "./i18n/strings.ts";

/**
 * Settings and the connected-mode seam — the client's whole public surface.
 *
 * `createDhlCarrier`, `WIRE` and the credential types are NOT re-exported here,
 * and the omission is load-bearing rather than tidy: this module is the entry
 * point of the CLIENT bundle, so anything reachable from it ends up in a
 * browser. The real transport belongs to the server half and lives behind
 * `src/server.ts`; `sources.test.ts` walks the import graph to keep it there.
 */
export { applySettings, DEFAULT_SETTINGS, type PublicSettings } from "./settings.ts";
export { useConnectedCarrier } from "./runtime.ts";
