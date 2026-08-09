/**
 * AddOnHost — the seam add-ons plug into (24 §5.9).
 *
 * It mirrors the `DataSource` seam exactly. In DEMO MODE (what ships here) the
 * add-on bundles are built into the app and registered from a static list, and
 * the dock's toggles flip an `enabled` set so surfaces appear and disappear
 * live. In CONNECTED MODE (Phase B) the enabled list comes from
 * `GET /api/v1/add-ons` and the bundles are `import()`ed from the server with
 * their SRI hashes. The seam does not change; only its source does.
 *
 * The demo device is not a shortcut around the real mechanism — it IS the real
 * registry, driven by a different switch. That is what lets a reviewer watch a
 * feature arrive and leave, and it costs nothing.
 *
 * THE HOST NAMES NO ADD-ON AND NO ADD-ON'S FIELDS (acceptance criterion 5).
 * Everything an add-on is particular about — its settings and their defaults,
 * the words on its settings form, the sentence the connect dialog opens with,
 * what a disconnect takes and keeps, its own strings in eight locales, what a
 * parcel weighs — arrives through the object `register()` returns. The host
 * knows there is an add-on with settings; it never knows that one of them is a
 * carrier with a collection cut-off. That is what makes the second delivery
 * company this repo with one file replaced.
 */

import type { ReactNode } from 'react';

import { SLOT_FILL, type SlotId } from './slots.ts';

/** Add-on categories — the closed vocabulary of 24 D2. */
export type AddOnCategory = 'artwork' | 'delivery' | 'payments' | 'email' | 'data';

/** What the shop must supply to connect (24 §5.6). */
export type ConnectKind = 'none' | 'api-key' | 'oauth2';

/** One ticked row in the connect dialog's permission list. */
export interface Permission {
  /** i18n key under `addon.*`. */
  key: string;
}

/**
 * ONE ALPHABET: `key` is the add-on's own MACHINE key — `demo_transport`,
 * `starting_layouts` — the same identifier its manifest declares, the same one
 * its saved values are stored under, and the same one it reads back out of the
 * payload. It is never an i18n key. The words on the control are the add-on's
 * business and it renders them itself in `settings.add-on.panel`, which is why
 * this declaration carries no label: a host that translated a setting would be
 * writing copy for a product it does not own.
 */
export interface AddOnSetting {
  key: string;
  kind: 'boolean' | 'time' | 'text' | 'multi';
  /** Options for `multi`, in the add-on's own machine alphabet. */
  options?: readonly string[];
}

/** One add-on's saved values, under its own machine keys. Opaque to the host. */
export type AddOnSettingValues = Readonly<Record<string, unknown>>;

/**
 * Every fill is handed the shop's saved values FOR ITS OWN ADD-ON under
 * `settings`, injected by `<AddOnSlot>`. A screen therefore never looks a
 * settings document up by add-on key to pass it along — which is how
 * `settings['design-studio']` used to appear in a customer-facing screen.
 */
export interface SlotPayload {
  settings?: AddOnSettingValues;
}

/**
 * One representative job per product family, already labelled in the reader's
 * language, handed to `settings.add-on.panel`.
 *
 * It exists so an add-on that has something to say about the shop's catalogue
 * can say it without the host guessing what that is. The carrier turns these
 * into default parcel weights with its own engine; an add-on that has no
 * opinion about them ignores the field. THE HOST DOES NOT COMPUTE A WEIGHT —
 * it does not know what a job weighs, and a weight table here that disagreed
 * with the one the dispatch screen quotes would be worse than no table at all.
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

/**
 * A seeded line in the manage drawer's activity list, and the shelf's
 * "last used".
 *
 * The add-on supplies these rather than the host: they are what THIS add-on
 * did, phrased in its own words (`messageKey` resolves in its own bundle). A
 * real install reads the same list out of `adminium_audit_log` (24 §5.7,
 * category `add-on`) and this demo has no server to read; what a host must
 * never do is keep a hand-written history of one particular add-on, because
 * that is a host that knows which add-ons exist.
 */
export interface ActivityEntry {
  iso: string;
  hour: number;
  minute: number;
  /** The works reference the line names, or empty where there is none. */
  ref: string;
  /** i18n key in the add-on's own bundle, taking `{when}` and `{ref}`. */
  messageKey: string;
}

/**
 * The declaration that lets the connect dialog offer "use the demo instead"
 * without knowing what a carrier is (24 D11).
 *
 * An add-on that reaches a third party says which of ITS settings means "do
 * not reach it", and supplies the words for the switch. The host shows the
 * switch, skips the credential fields while it is on, and never learns the
 * setting's meaning.
 */
export interface DemoSwitch {
  /** The machine key in this add-on's own settings. */
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
  /**
   * The product's name, as a proper noun. NOT an i18n key: an add-on's name is
   * the name of a thing, and a translated product name would be a different
   * product. Everything ABOUT an add-on — what it does, what it can see, what
   * disconnecting keeps — is a key and does translate.
   */
  name: string;
  /**
   * A key to render INSTEAD of `name`, for a shelf entry whose "name" is a
   * description rather than a proper noun.
   *
   * The four described-but-not-built entries in `shelf.ts` are the only users
   * and are meant to be: "a second delivery company" is a sentence, and a
   * sentence that stayed in English on an Arabic shelf would be the one
   * untranslated line on the screen. A real add-on leaves this undefined and
   * keeps its proper noun.
   */
  nameKey?: string;
  /** Two or three words for the dock's toggle, where the full name will not fit. */
  shortName: string;
  /** i18n key under `addon.*` for the one-line description. */
  lineKey: string;
  /**
   * i18n key for the plain sentence the connect dialog opens with. Owned by the
   * add-on because it is a description of the add-on; the host used to hold a
   * map from add-on key to sentence, which is a host that knows the shelf.
   */
  whatKey: string;
  /**
   * Two or three letters, rendered in a neutral --surface-3 tile. NEVER a real
   * company logo, drawn, traced or approximated (24 D12) — a shelf of twenty
   * add-ons has to read as one system rather than twenty logos, and a redrawn
   * mark would be a legal problem rather than a taste problem.
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
  /**
   * Push saved values into the add-on's own engines.
   *
   * Optional because most add-ons read their settings out of the slot payload
   * and need nothing pushed. The carrier's transport keeps its own copy —
   * its engines are handed settings, not a store, and a client half that
   * reached into the host's Zustand would have stopped being optional.
   */
  applySettings?: (values: AddOnSettingValues) => void;
  /**
   * This add-on's strings in all eight locales, merged into the host's bundle
   * at registration (see `i18n/messages/index.ts`).
   */
  messages?: Readonly<Record<string, Readonly<Record<string, string>>>>;
  /** i18n keys naming exactly what a disconnect removes and what it keeps (24 D16). */
  disconnect?: { goesKey: string; staysKey: string };
  /** Seeded "what it last did", newest first. */
  activity?: readonly ActivityEntry[];
  /** For a credentialled add-on: the setting that means "use the demo transport". */
  demoSwitch?: DemoSwitch;
  /** The account an `oauth2` add-on is signed in to, for the dialog's confirmation row. */
  account?: string;
  /**
   * Does artwork this add-on supplies still go through the works' proof?
   *
   * The host asks rather than reading a settings field it would otherwise have
   * to name — only the add-on knows which of its settings decides this, and the
   * sentence the customer reads is the SHOP's promise, so the host renders it.
   */
  proofsArtwork?: (settings: AddOnSettingValues) => boolean;
  /** Which company, if any, this connects to — named nominatively only. */
  namesCompany: boolean;
  /**
   * What the detail surfaces say WHERE the not-affiliated line would go, for an
   * add-on that reports `namesCompany: false`.
   *
   * i18n keys in the add-on's own bundle, rendered in order and joined with a
   * space. 24 AC6 asks every add-on's detail surface to be clear about who else
   * is involved; an add-on that names no company has no relationship to
   * disclaim, and rendering nothing there is indistinguishable from having
   * forgotten the notice. So it states the positive fact — that it connects to
   * no outside company and needs no account anywhere — in its own words and in
   * all eight locales, and `Affiliation` in `components/Overlays.tsx` renders
   * whichever of the two sentences applies.
   *
   * IT IS THE ADD-ON'S COPY, not the host's (AC5). The host does not know which
   * add-ons connect to nothing and must not carry a sentence claiming it does.
   */
  noCompanyKeys?: readonly string[];
  /**
   * Absent or `true` for an add-on that is actually built into this demo.
   * `false` marks a shelf entry that is described honestly but has nothing
   * behind it: the screen shows a muted "Not in this demo" chip where the
   * Connect button would be, and the dock gives it no toggle. A button that
   * does nothing is worse than no button.
   *
   * OPTIONAL rather than required because an add-on repo does not know it is
   * in a demo — the three real ones omit it and are right to.
   */
  inDemo?: boolean;
  fills: readonly AddOnFill<never>[];
}

/** Whether an add-on can actually be switched on here. */
export function isConnectable(addOn: AddOn): boolean {
  return addOn.inDemo !== false;
}

/** A fill with the key of the add-on that supplied it, so a caller can scope. */
export interface ResolvedFill {
  addOn: string;
  fill: AddOnFill<never>;
}

export interface AddOnRegistry {
  all: readonly AddOn[];
  byKey: (key: string) => AddOn | undefined;
  /**
   * Every fill for a slot from the currently-enabled add-ons, ordered. Empty
   * when nothing is enabled — the CALLER decides whether that means an honest
   * empty state in words or nothing at all (see `SLOT_EMPTY_BEHAVIOUR`), because
   * only the caller knows whether there is anything to explain.
   *
   * `forAddOn` scopes the result to one add-on, which is what a `per-add-on`
   * slot means: the manage drawer asks for the panel of the add-on it is
   * managing and gets that one or nothing.
   */
  fillsFor: (slot: SlotId, enabled: ReadonlySet<string>, forAddOn?: string) => ResolvedFill[];
}

/**
 * Build a registry over a static list. Add-ons are sorted by key so the
 * shelf and every multi-fill slot have a stable order that does not depend on
 * the sequence they happened to be registered in.
 */
export function createRegistry(addOns: readonly AddOn[]): AddOnRegistry {
  const all = [...addOns].sort((a, b) => a.key.localeCompare(b.key));
  const index = new Map(all.map((a) => [a.key, a]));

  return {
    all,
    byKey: (key) => index.get(key),
    fillsFor(slot, enabled, forAddOn) {
      const fills = all
        .filter((addOn) => enabled.has(addOn.key))
        .filter((addOn) => forAddOn === undefined || addOn.key === forAddOn)
        .flatMap((addOn) =>
          addOn.fills.filter((f) => f.slot === slot).map((f) => ({ addOn: addOn.key, fill: f })),
        )
        .sort((a, b) => a.fill.order - b.fill.order || a.addOn.localeCompare(b.addOn));

      // A single-fill slot takes the lowest order. The one that lost is not
      // silently overridden — the Add-ons screen surfaces the conflict — but a
      // demo with three add-ons cannot produce one, so there is nothing to
      // report here beyond taking the winner.
      return SLOT_FILL[slot] === 'single' ? fills.slice(0, 1) : fills;
    },
  };
}

/**
 * The values every registered add-on starts from, keyed by add-on key.
 *
 * `Record<string, …>` and not a hand-written interface: the host holds these,
 * it never reads inside one, and the moment it declared the shape of an
 * add-on's settings it would have to be edited to add a second carrier.
 */
export type AddOnSettings = Readonly<Record<string, AddOnSettingValues>>;

export function defaultSettingsFor(addOns: readonly AddOn[]): AddOnSettings {
  return Object.fromEntries(addOns.map((a) => [a.key, { ...(a.defaultSettings ?? {}) }]));
}

/**
 * Push the saved values into whichever add-ons asked to be told.
 *
 * On startup and on every change — an add-on that keeps its own copy must not
 * have to poll, or a rate quoted a second later is priced off the old value.
 */
export function applyAddOnSettings(addOns: readonly AddOn[], settings: AddOnSettings): void {
  for (const addOn of addOns) addOn.applySettings?.(settings[addOn.key] ?? {});
}

/** An empty registry — what a build with no add-ons compiled in gets. */
export const EMPTY_REGISTRY: AddOnRegistry = createRegistry([]);
