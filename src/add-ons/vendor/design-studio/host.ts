/*
 * VENDORED from add-on-design-studio/src/host.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the add-on repo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `design-studio`; its manifest, tests and README live in that repo.
 */
/**
 * The host's add-on interface, copied from `print-shop/src/add-ons/host.ts`
 * and `print-shop/src/add-ons/slots.ts`.
 *
 * COPIED RATHER THAN IMPORTED for the same reason `contracts.ts` is: this repo
 * stands alone and cannot depend on the host's sources. Nothing here is
 * invented — the slot ids are the closed registry of 24 §5.4 and the `AddOn`
 * shape is what `createRegistry()` on the other side consumes. If a field
 * disagrees with the host, the host is right and this file is stale.
 *
 * `slot` is typed against the slot ids THIS add-on fills rather than all
 * eleven, so a typo in `index.ts` is a compile error here rather than a slot
 * that silently never renders.
 *
 * WHAT THE HOST NO LONGER HOLDS, and why every field below exists. The host
 * names no add-on and no add-on's fields (24 acceptance criterion 5), so the
 * connect sentence, the settings defaults, the words on the settings form, what
 * a disconnect takes and keeps, the eight-locale string bundle and the seeded
 * activity all travel in the object `register()` returns.
 */

import type { ReactNode } from "react";

/** The two slots Design Studio fills (24 §6). */
export type SlotId = "artwork.sources" | "settings.add-on.panel";

/** Add-on categories — the closed vocabulary of 24 D2. */
export type AddOnCategory = "artwork" | "delivery" | "payments" | "email" | "data";

/** What the shop must supply to connect (24 §5.6). */
export type ConnectKind = "none" | "api-key" | "oauth2";

/** One ticked row in the connect dialog's permission list. */
export interface Permission {
  /** i18n key. */
  key: string;
}

/**
 * ONE ALPHABET: `key` is this add-on's own MACHINE key — `starting_layouts`,
 * `proof_required` — the same identifier `manifest.json` declares, the same one
 * the saved values are stored under, and the same one the fills read back out
 * of the payload. It is never an i18n key. The words on the control are this
 * add-on's business and it renders them itself in `settings.add-on.panel`.
 */
export interface AddOnSetting {
  key: string;
  kind: "boolean" | "time" | "text" | "multi";
  /** Options for `multi`, in the same machine alphabet. Ignored otherwise. */
  options?: readonly string[];
}

/** One add-on's saved values, under its own machine keys. Opaque to the host. */
export type AddOnSettingValues = Readonly<Record<string, unknown>>;

/** Every fill is handed the shop's saved values for THIS add-on under `settings`. */
export interface SlotPayload {
  settings?: AddOnSettingValues;
}

/**
 * One representative job per product family, already labelled in the reader's
 * language. Design Studio has no opinion about them and ignores the field; the
 * carrier turns them into default parcel weights.
 */
export interface SampleJob {
  label: string;
  productKey: string;
  materialKey: string;
  quantity: number;
  trimWidthMm: number;
  trimHeightMm: number;
  packagingKey: string;
}

/** What `settings.add-on.panel` is handed. */
export interface SettingsPanelPayload extends SlotPayload {
  /** Save a partial change to this add-on's own values. */
  patch: (values: Record<string, unknown>) => void;
  samples: readonly SampleJob[];
}

/** A seeded line in the manage drawer's activity list, and the shelf's "last used". */
export interface ActivityEntry {
  iso: string;
  hour: number;
  minute: number;
  /** The works reference the line names, or empty where there is none. */
  ref: string;
  /** i18n key in THIS add-on's bundle, taking `{when}` and `{ref}`. */
  messageKey: string;
}

export interface AddOnFill<P = unknown> {
  slot: SlotId;
  /** Ties are broken by `order` then by add-on key, so the result is stable. */
  order: number;
  render: (payload: P) => ReactNode;
}

export interface AddOn {
  key: string;
  /**
   * The product's name, as a name rather than a phrase. NOT an i18n key — a translated
   * product name would be a different product. Everything ABOUT the add-on is
   * a key and does translate.
   */
  name: string;
  /** Two or three words for the dock's toggle, where the full name will not fit. */
  shortName: string;
  /** i18n key for the one-line description. */
  lineKey: string;
  /** i18n key for the plain sentence the connect dialog opens with. */
  whatKey: string;
  /**
   * Two or three letters, rendered in a neutral --surface-3 tile. NEVER a real
   * company logo, drawn, traced or approximated (24 D12).
   */
  monogram: string;
  category: AddOnCategory;
  connect: ConnectKind;
  /** What connecting lets it do — shown as ticked rows before the shop agrees. */
  permissions: readonly Permission[];
  /** Non-secret settings the manage panel exposes, in machine keys. */
  settings: readonly AddOnSetting[];
  /** The values a shop that has changed nothing has, under those same keys. */
  defaultSettings?: AddOnSettingValues;
  /** Push saved values into the add-on's own engines. Not needed here. */
  applySettings?: (values: AddOnSettingValues) => void;
  /** This add-on's strings in all eight locales, merged by the host at registration. */
  messages?: Readonly<Record<string, Readonly<Record<string, string>>>>;
  /** i18n keys naming exactly what a disconnect removes and what it keeps (24 D16). */
  disconnect?: { goesKey: string; staysKey: string };
  /** Seeded "what it last did", newest first. */
  activity?: readonly ActivityEntry[];
  /**
   * Does artwork this add-on supplies still go through the works' proof?
   * The host asks instead of reading a settings field it would have to name.
   */
  proofsArtwork?: (settings: AddOnSettingValues) => boolean;
  /** Which company, if any, this connects to — named nominatively only. */
  namesCompany: boolean;
  /**
   * What the detail surfaces say WHERE the not-affiliated line would go, for an
   * add-on that reports `namesCompany: false`.
   *
   * i18n keys in THIS add-on's bundle, rendered in order and joined with a
   * space. The host renders one sentence or the other and knows neither — see
   * `TRADEMARKS.md` for why an absent line is worse than a positive one.
   */
  noCompanyKeys?: readonly string[];
  fills: readonly AddOnFill<never>[];
}
