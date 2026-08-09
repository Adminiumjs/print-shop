/*
 * VENDORED from add-on-shipping-dhl/src/host.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the add-on repo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `shipping-dhl`; its manifest, tests and README live in that repo.
 */
/**
 * The host's side of the seam — COPIED from the print shop's
 * `src/add-ons/{host,slots}.ts`, for the reason `contracts.ts` gives.
 *
 * Only what `register()` has to satisfy is here: the `AddOn` object shape, the
 * slot ids this add-on fills, and structural types for the payloads the host
 * passes in. The payload types are DELIBERATELY MINIMAL — they name the fields
 * this add-on reads and nothing else, so a host that grows a field on its job
 * record does not break the add-on, and so the fields the add-on depends on are
 * legible in one screen rather than inferred from an app-sized interface.
 */

import type { ReactNode } from "react";

/** The closed add-on category vocabulary (24 D2). */
export type AddOnCategory = "artwork" | "delivery" | "payments" | "email" | "data";

/** What the shop must supply to connect (24 §5.6). */
export type ConnectKind = "none" | "api-key" | "oauth2";

/**
 * The four slots this add-on fills, from the closed registry of 24 §5.4. Never
 * invent one.
 *
 * Typed against WHAT THIS ADD-ON FILLS rather than against the whole registry,
 * so a typo in `index.ts` is a compile error here rather than a slot that
 * silently never renders — and so a slot the host stops hosting shows up as a
 * red build in this repo instead of a fill nothing ever mounts. That is exactly
 * how `nav.add-on.routes` survived a release in a sibling add-on.
 */
export type SlotId =
  | "checkout.delivery.methods"
  | "order.dispatch.panel"
  | "order.dispatch.actions"
  | "settings.add-on.panel";

export interface Permission {
  /** i18n key under `addon.*`. */
  key: string;
}

/**
 * ONE ALPHABET: `key` is this add-on's own MACHINE key — `demo_transport`,
 * `collection_cutoff` — the same identifier `manifest.json` declares, the same
 * one the host stores the shop's values under, and the same one `settings.ts`
 * reads back. It is never an i18n key. The words on the control belong to
 * `ui/SettingsPanel.tsx`, which is where this add-on draws its own form.
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
 * language, handed to `settings.add-on.panel`.
 *
 * THIS IS WHY THE HOST DOES NOT KNOW WHAT A PARCEL WEIGHS. The default weight
 * per product family used to be computed in the host's manage drawer, which
 * imported this repo's `parcelFor()` directly — host chrome calling one
 * carrier's weight engine. The host now passes the jobs and the carrier decides
 * what they weigh, which is the same division `order.dispatch.actions` already
 * had and the reason the next carrier is this repo with one file replaced.
 */
export interface SampleJob {
  /** The product family's name, already translated by the host. */
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

/**
 * The declaration that lets the host's connect dialog offer "use the demo
 * instead" without knowing what a carrier is (24 D11).
 *
 * This add-on says which of ITS settings means "do not reach the real service"
 * and supplies the words for the switch. The host shows it, skips the
 * credential fields while it is on, and never learns what the setting means.
 */
export interface DemoSwitch {
  key: string;
  labelKey: string;
  noteOnKey: string;
  noteOffKey: string;
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
  /** The values a shop that has changed nothing has, under those same keys. */
  defaultSettings?: AddOnSettingValues;
  /**
   * Push saved values into this add-on's own engines.
   *
   * The transport keeps its own copy because its engines are handed settings,
   * not a store — a client half that reached into the host's Zustand would have
   * stopped being optional.
   */
  applySettings?: (values: AddOnSettingValues) => void;
  /** This add-on's strings in all eight locales, merged by the host at registration. */
  messages?: Readonly<Record<string, Readonly<Record<string, string>>>>;
  /** i18n keys naming exactly what a disconnect removes and what it keeps (24 D16). */
  disconnect?: { goesKey: string; staysKey: string };
  /** Seeded "what it last did", newest first. */
  activity?: readonly ActivityEntry[];
  /** For a credentialled add-on: the setting that means "use the demo transport". */
  demoSwitch?: DemoSwitch;
  /** Which company, if any, this connects to — named nominatively only. */
  namesCompany: boolean;
  fills: readonly AddOnFill<never>[];
}

/**
 * One job on the works board, as much of it as this add-on reads.
 *
 * The slot registry says `order.dispatch.actions` is handed "the order + its
 * parcel estimate"; the print shop currently passes the job alone, which is why
 * `parcel.ts` estimates the parcel here. When a host starts passing an estimate,
 * that engine becomes the fallback rather than the source.
 */
export interface HostJob {
  ref: string;
  productKey: string;
  materialKey: string;
  /**
   * WHO the parcel is for, as the host spells it — a display name in the print
   * shop, since it resolves its own customer keys before it hands a job over.
   *
   * This field used to be documented as "a customer key" while the host passed
   * a name, and the add-on looked it up in a table keyed by key. Every lookup
   * missed, and the miss fell through to a seeded address — so the dispatch
   * screen pre-filled the WRONG customer's street for every job it was given.
   * `resolveDestination()` now matches on either spelling and, when both miss,
   * says so on screen instead of guessing (`seed.ts`).
   */
  customer: string;
  /**
   * The stable key, when the host has one to give.
   *
   * OPTIONAL, and preferred where it exists: a key survives a shop renaming its
   * customer, a display name does not. A host that passes it gets an exact
   * match; a host that does not is matched by name.
   */
  customerKey?: string;
  quantity: number;
  trimWidthMm: number;
  trimHeightMm: number;
  packagingKey: string;
  stage: string;
  promisedFor: string;
}

export interface DispatchPayload {
  job: HostJob;
}

/** One configured line in the customer's basket, as much of it as this add-on reads. */
export interface HostBasketLine {
  id: string;
  config: {
    product: string;
    material: string;
    /** A preset key from the host's size table, or `custom` with the millimetres. */
    size: string;
    customWidthMm?: number;
    customHeightMm?: number;
    quantity: number;
    packaging: string;
  };
}

/**
 * A delivery option, in the shape the HOST records it.
 *
 * Deliberately not a `Rate`: the host has no business holding a carrier's
 * service code as a meaningful value, and a shape with `carrier` in it would be
 * the host learning what a carrier is. It is a label the add-on has already
 * translated, an amount, a currency and a date — everything the summary line
 * renders and nothing else. `code` travels back down as `chosen` so this fill
 * can show which row is selected; it is opaque on the way through.
 */
export interface DeliveryChoice {
  /** This add-on's key, so the host can drop the choice if it is switched off. */
  addOn: string;
  code: string;
  label: string;
  amount: number;
  currency: string;
  /** ISO date. */
  estimatedDelivery: string;
}

/**
 * What `checkout.delivery.methods` is handed.
 *
 * THE SELECTION LIVES IN THE HOST, NOT HERE. It used to be local `useState` in
 * `DeliveryMethods.tsx`, which made the rate rows a control that looked
 * selectable and changed nothing: the host went on quoting its own standard
 * delivery, the order summary never mentioned the carrier, and the customer's
 * click bought them a filled radio dot. `chosen` is the host's record of what
 * it has been told, and `onChoose` is the only way it learns.
 */
export interface CheckoutPayload {
  basket: readonly HostBasketLine[];
  /**
   * What the host currently holds, or null. It is the same object this fill
   * handed over, so `addOn` is what tells a second delivery company's rows not
   * to light up because the first one's did — the host does not scope it,
   * because the host does not know which add-on drew which row.
   */
  chosen?: DeliveryChoice | null;
  onChoose?: (choice: DeliveryChoice) => void;
}
