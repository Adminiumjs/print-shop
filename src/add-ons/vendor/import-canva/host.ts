/*
 * VENDORED from add-on-import-canva/src/host.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the add-on repo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `import-canva`; its manifest, tests and README live in that repo.
 */
/**
 * The `AddOn` object the host expects back from `register()`, copied from the
 * Print Shop's `src/add-ons/host.ts`.
 *
 * Copied for the same reason `contracts.ts` is: this repo is standalone and the
 * host is not a package it can depend on. The host owns these shapes — if it
 * changes one, this file follows rather than leads.
 *
 * `SlotId` is the six slots the Print Shop hosts, not the eleven in the closed
 * registry. Declaring only what the host offers means a typo in a slot id is a
 * compile error here instead of a fill that silently never renders.
 */

import type { ReactNode } from "react";

/**
 * The two slots this add-on fills, from the closed registry of 24 §5.4.
 *
 * Typed against WHAT THIS ADD-ON FILLS rather than against the whole registry,
 * so a typo in `index.ts` is a compile error here rather than a slot that
 * silently never renders.
 */
export type SlotId = "artwork.sources" | "settings.add-on.panel";

/** Add-on categories — the closed vocabulary of 24 D2. */
export type AddOnCategory = "artwork" | "delivery" | "payments" | "email" | "data";

/** What the shop must supply to connect (24 §5.6). */
export type ConnectKind = "none" | "api-key" | "oauth2";

/** One ticked row in the connect dialog's permission list. */
export interface Permission {
  /** i18n key under `addon.*`. */
  key: string;
}

/**
 * ONE ALPHABET: `key` is the add-on's own MACHINE key, the same identifier
 * `manifest.json` declares and the host stores values under — never an i18n
 * key. This add-on declares none: its whole configuration is the account, and
 * its settings panel says so in words rather than showing an empty form.
 */
export interface AddOnSetting {
  key: string;
  kind: "boolean" | "time" | "text" | "multi";
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
 * language. This add-on has no opinion about them and ignores the field; the
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
  /** A proper noun, never an i18n key — a translated product name is a different product. */
  name: string;
  shortName: string;
  /** i18n key under `addon.*` for the one-line description. */
  lineKey: string;
  /** i18n key for the plain sentence the connect dialog opens with. */
  whatKey: string;
  /** Two or three letters in a neutral tile. NEVER a company logo (24 D12). */
  monogram: string;
  category: AddOnCategory;
  connect: ConnectKind;
  permissions: readonly Permission[];
  /** Non-secret settings the manage panel exposes, in machine keys. */
  settings: readonly AddOnSetting[];
  /** The values a shop that has changed nothing has. None here. */
  defaultSettings?: AddOnSettingValues;
  /** Push saved values into the add-on's own engines. Not needed here. */
  applySettings?: (values: AddOnSettingValues) => void;
  /** This add-on's strings in all eight locales, merged by the host at registration. */
  messages?: Readonly<Record<string, Readonly<Record<string, string>>>>;
  /** i18n keys naming exactly what a disconnect removes and what it keeps (24 D16). */
  disconnect?: { goesKey: string; staysKey: string };
  /** Seeded "what it last did", newest first. */
  activity?: readonly ActivityEntry[];
  /** The account this `oauth2` add-on is signed in to, for the dialog's confirmation row. */
  account?: string;
  /** Which company, if any, this connects to — named nominatively only. */
  namesCompany: boolean;
  fills: readonly AddOnFill<never>[];
}
