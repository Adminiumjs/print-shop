/*
 * VENDORED from add-ons/packages/host/src/host.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The ONE shared contract; the three add-ons here import it by relative path.
 */
/**
 * THE ONE MIRROR OF THE HOST'S ADD-ON SEAM (24 §5.9).
 *
 * ── WHY THIS FILE EXISTS AT ALL, AND WHY THERE IS NOW EXACTLY ONE OF IT ──────
 *
 * The seam an add-on plugs into is declared by the host app that mounts it:
 * `print-shop/src/add-ons/host.ts` and `.../slots.ts`. This repo cannot import
 * those — the Print Shop is a separate standalone repo published to the
 * Adminiumjs org. So the shape has to be restated somewhere on this side of
 * the wire.
 *
 * ── CORRECTED 2026-08-15: THE REGISTRY IS ON NPM NOW ────────────────────────
 *
 * This paragraph used to end "...and the closed contract registry it in turn
 * mirrors (`@adminium/add-on-contracts`) lives in the Adminium monorepo and is
 * not on npm." That is no longer true. It publishes as
 * **`@adminiumjs/add-on-contracts`** — the `adminiumjs` scope, NOT `adminium`,
 * so `npm view @adminium/add-on-contracts` 404s and means nothing — and has
 * been live since 0.2.1 on 2026-08-14.
 *
 * It does NOT make this file redundant. What this file mirrors is the HOST
 * APP's seam — `register()`, the settings shape, `demoSwitch`, the payload
 * casts — none of which the contracts package declares. That half still has to
 * be copied, for the unchanged reason above.
 *
 * What it does change is narrower and worth knowing: the closed slot-id union
 * and the `category` / `connect.kind` vocabularies now have a real published
 * home, so the part of `slots.ts` that restates THOSE could become a dependency
 * instead of a copy. That is an open option, not a decision taken here — and
 * it would trade this repo's zero-dependency posture for drift protection on
 * one half of the mirror.
 *
 * IT USED TO BE RESTATED THREE TIMES. Each add-on shipped as its own repo with
 * its own copy, and each copy carried only the members that add-on happened to
 * use. Within a day of shipping they disagreed: `demoSwitch` existed in one,
 * `account` in another, `proofsArtwork` in a third, and `nameKey` and `inDemo`
 * in none of them. Adding a field to the host meant three repos each having to
 * notice independently. At twenty add-ons that is not a maintenance cost, it is
 * a guarantee of drift.
 *
 * So: ONE mirror, in `packages/host`, imported by every add-on in this repo.
 * The reasoning for copying rather than importing is unchanged — this repo
 * still cannot depend on the monorepo or on the host app. What changed is the
 * number of copies.
 *
 * ── THE HOST WINS ───────────────────────────────────────────────────────────
 *
 * Everything below is the host's shape, not a shape this repo gets to choose.
 * Where a member here disagrees with `print-shop/src/add-ons/host.ts`, the host
 * is right and this file is stale. `host-mirror.test.ts` reads the host's own
 * source — when a checkout is beside this one — and fails when a member the
 * host declares is missing here, so "stale" is a red suite rather than a bug
 * report from an installer six weeks later.
 *
 * Do NOT narrow a member to what one add-on needs. Narrowing is what produced
 * the three disagreeing copies, and an optional member costs an add-on that
 * ignores it precisely nothing.
 *
 * ── WHERE THE PAYLOADS LIVE, AND WHY THIS PARAGRAPH CHANGED ─────────────────
 *
 * [Amended 2026-08-10, wave 4b.] This file used to say the per-slot payloads
 * were deliberately NOT here, under a rule that read:
 *
 *   a type the add-on CONSTRUCTS and hands back must match the host exactly,
 *   so it lives here;
 *   a type the add-on only READS may be narrowed, so it lives with the add-on.
 *
 * That rule is sound about OWNERSHIP and silent about SHAPE, and the shape is
 * what a second host changes. Each add-on duly wrote down "the fields I read",
 * which in practice was "the fields the one host I was built against happened
 * to send" — `HostJob` was a print works' job record, `HostBasketLine` a maker
 * studio's basket line, and `AddOnFill<never>` erased both so nothing compared
 * them. See `payloads.ts` for the whole account.
 *
 * So the payloads are HERE NOW, one per slot id, named for the SURFACE rather
 * than for a shop: `payloads.ts`, keyed by `SlotId`, reached through
 * `PayloadFor<S>`. An add-on may still narrow what it reads — `render` is
 * contravariant in its parameter — but it narrows against a shape both hosts
 * promise instead of against one host's memory.
 *
 * `DemoSwitch` and `AddOnSetting` are constructed by the add-on and handed
 * over, so they are here. `DeliveryChoice` travels BOTH ways (the fill builds
 * one, the host stores it, the host hands it back), so it is here too, in
 * `delivery.ts`.
 */

import type { ReactNode } from 'react';

import type { PayloadFor, ShopClock } from './payloads.ts';
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
 * writing copy for a thing it does not own.
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
 * WHAT THE HOST TELLS AN ADD-ON ABOUT ITS OWN PAST, so a seeded line can be
 * true in the shop that renders it.
 *
 * Both members are HOST FACTS and neither has an honest add-on-side answer.
 * `now` is the same `ShopClock` every dated surface already takes, for the same
 * reason (see `payloads.ts`). `refs` is the shop's OWN paperwork references,
 * newest first — `MP-4119`, `BR-2284`, an invoice number, whatever a shop
 * prints on its own documents — because a reference is the string BOTH sides
 * already use to find the same record, and an add-on that made one up would be
 * naming a record that does not exist.
 *
 * `refs` may be empty and that is ordinary: a host with no records to point at
 * seeds nothing, and an entry naming a reference it has not got is dropped
 * rather than rendered against a blank.
 */
export interface ActivityContext {
  now: ShopClock;
  /** The shop's own references, newest first. May be empty. */
  refs: readonly string[];
}

/**
 * A SEEDED LINE, AS THE ADD-ON DECLARES IT — relative, and referring rather
 * than naming.
 *
 * ── WHY THIS SHAPE, AND WHAT THE OLD ONE DID ────────────────────────────────
 *
 * [Amended 2026-08-10, wave 4b.] This used to be the shape `ActivityEntry`
 * below still is — `iso`, `hour`, `minute`, `ref` — AUTHORED BY THE ADD-ON.
 * That is precisely the defect `ShopClock` was added to kill, surviving in the
 * one place nothing had looked at: the members read like neutral data, and
 * every one of them is a fact about a HOST. An add-on picked an instant and a
 * paperwork reference out of the air, the host printed both verbatim, and
 * nothing anywhere compared them with the shop doing the printing.
 *
 * It was not theoretical. With the personalizer registered in Marlow Press —
 * pinned to Wednesday 5 August, 10:20 — the Add-ons drawer listed Birch Row's
 * Thursday the 6th against Birch Row's `BR-2284`, in a shop that has never
 * issued a reference beginning `BR` and does not think it is Thursday. Nothing
 * threw. It was simply somebody else's history, on this shop's screen.
 *
 * So an add-on says WHEN RELATIVE TO NOW and WHICH OF YOUR REFERENCES, and the
 * host turns that into an instant and a string it can stand behind. An add-on
 * cannot invent either, in the same way and for the same reason it can no
 * longer invent a clock.
 *
 * `minutesAgo` rather than a day offset because the two facts a seeded line
 * carries are "how long ago" and "in what order", and minutes give both at any
 * granularity. `refIndex` rather than a reference because the add-on knows it
 * wants THE MOST RECENT ORDER, not what that order is called here.
 */
export interface SeededActivityEntry {
  /** How long before the host's `now` this happened. */
  minutesAgo: number;
  /**
   * Which of `ActivityContext.refs` this line names, newest first — 0 is the
   * most recent. Leave it undefined for a line about nothing in particular
   * ("design saved for later"), and the resolved `ref` is empty.
   *
   * An index the host has no reference for DROPS the line. That is deliberate:
   * a shop with two orders should not be shown a third line pointing at a
   * blank, and an add-on cannot know how much history a host has.
   */
  refIndex?: number;
  /** i18n key in the add-on's own bundle, taking `{when}` and `{ref}`. */
  messageKey: string;
}

/**
 * A seeded line in the manage drawer's activity list, and the shelf's
 * "last used" — AS THE HOST RENDERS IT, after `resolveActivity` has dated it
 * against the shop's own clock and paperwork.
 *
 * The words are still the add-on's: `messageKey` resolves in its own bundle,
 * because what an add-on did is phrased by the add-on. A real install reads the
 * same list out of `adminium_audit_log` (24 §5.7, category `add-on`) and this
 * demo has no server to read; what a host must never do is keep a hand-written
 * history of one particular add-on, because that is a host that knows which
 * add-ons exist.
 */
export interface ActivityEntry {
  iso: string;
  hour: number;
  minute: number;
  /** The shop's own reference the line names, or empty where there is none. */
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

/**
 * ONE REGISTERED FILL, AND ITS PAYLOAD IS DECIDED BY THE SLOT IT NAMES.
 *
 * This used to read `AddOnFill<P = unknown, S extends SlotId = SlotId>`, with
 * `AddOn.fills` typed `readonly AddOnFill<never>[]`, and that pair of
 * declarations is the whole architectural defect 24 D21 tripped over. `never`
 * erased the payload: a fill could declare `render: (p: anything) => …` and be
 * assignable, so nothing anywhere compared what a HOST passes with what a FILL
 * reads. The seam type-checked perfectly and threw three times on the first
 * screen of the second host.
 *
 * Now `S` is the only parameter and the payload is derived from it. A fill for
 * `order.dispatch.panel` receives `SLOT_PAYLOADS['order.dispatch.panel']` and
 * nothing else; an add-on may still NARROW what it reads — `render` is
 * contravariant in its parameter, so a component asking for fewer fields is
 * assignable and one asking for a field the payload does not carry is not —
 * which is exactly the guarantee wanted in both directions:
 *
 *   the add-on reads a field no host promises  → red in the ADD-ON's repo
 *   the host passes a shape the slot does not  → red in the HOST's repo
 *
 * `SlotId` is still the host's union rather than a private one, so an id the
 * registry drops turns every fill naming it red. An add-on narrows to the ids
 * it fills with `satisfies readonly SlotId[]` in its own `slots.ts`.
 */
export interface AddOnFill<S extends SlotId = SlotId> {
  slot: S;
  /** Ties are broken by `order` then by add-on key, so the result is stable. */
  order: number;
  render: (payload: PayloadFor<S>) => ReactNode;
}

/**
 * A fill for SOME slot — the union over the registry, never `AddOnFill<SlotId>`.
 *
 * The difference is the point. `AddOnFill<SlotId>` would type `render` as
 * taking the UNION of every payload, which no real component accepts, so every
 * add-on would have to cast and the guarantee would be back where it started.
 * The distributed union pairs each `slot` literal with its own payload, so a
 * list of fills for different slots is well-typed and each entry still knows
 * which shape it gets.
 */
export type AnyAddOnFill = { [S in SlotId]: AddOnFill<S> }[SlotId];

export interface AddOn {
  key: string;
  /**
   * The name, as a proper noun. NOT an i18n key: an add-on's name is the name
   * of a thing, and a translated name would be a different thing. Everything
   * ABOUT an add-on — what it does, what it can see, what disconnecting keeps —
   * is a key and does translate.
   */
  name: string;
  /**
   * A key to render INSTEAD of `name`, for a shelf entry whose "name" is a
   * description rather than a proper noun.
   *
   * The described-but-not-built entries in the host's own shelf are the only
   * users and are meant to be: "a second delivery company" is a sentence, and a
   * sentence that stayed in English on an Arabic shelf would be the one
   * untranslated line on the screen. A real add-on leaves this undefined and
   * keeps its proper noun — which is why all three copies dropped it, and why
   * dropping it was still wrong: an add-on that does not set a member does not
   * get to decide the member does not exist.
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
   * at registration.
   */
  messages?: Readonly<Record<string, Readonly<Record<string, string>>>>;
  /** i18n keys naming exactly what a disconnect removes and what it keeps (24 D16). */
  disconnect?: { goesKey: string; staysKey: string };
  /**
   * Seeded "what it last did", newest first — RELATIVE, and resolved against
   * the host's own clock and references by `resolveActivity`.
   */
  activity?: readonly SeededActivityEntry[];
  /** For a credentialled add-on: the setting that means "use the demo transport". */
  demoSwitch?: DemoSwitch;
  /** The account an `oauth2` add-on is signed in to, for the dialog's confirmation row. */
  account?: string;
  /**
   * Does artwork this add-on supplies still go through the works' check?
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
   * all eight locales, and the host renders whichever of the two applies.
   */
  noCompanyKeys?: readonly string[];
  /**
   * Absent or `true` for an add-on that is actually built into a demo. `false`
   * marks a shelf entry that is described honestly but has nothing behind it:
   * the screen shows a muted "not in this demo" chip where the Connect button
   * would be, and the dock gives it no toggle. A button that does nothing is
   * worse than no button.
   *
   * OPTIONAL rather than required because an add-on does not know it is in a
   * demo — the three real ones omit it and are right to. They were wrong to
   * omit it from their COPIES of this interface, which is a different thing.
   */
  inDemo?: boolean;
  fills: readonly AnyAddOnFill[];
}

/** Whether an add-on can actually be switched on here. */
export function isConnectable(addOn: AddOn): boolean {
  return addOn.inDemo !== false;
}

/**
 * A fill with the key of the add-on that supplied it, so a caller can scope.
 *
 * Parameterised by the slot it was resolved FOR, so the mount site gets a
 * `render` it can call with that slot's payload rather than a union it would
 * have to cast its way out of.
 */
export interface ResolvedFill<S extends SlotId = SlotId> {
  addOn: string;
  fill: AddOnFill<S>;
}

export interface AddOnRegistry {
  all: readonly AddOn[];
  byKey: (key: string) => AddOn | undefined;
  /**
   * Every fill for a slot from the currently-enabled add-ons, ordered. Empty
   * when nothing is enabled — the CALLER decides whether that means an honest
   * empty state in words or nothing at all (see `SLOT_EMPTY_BEHAVIOUR`),
   * because only the caller knows whether there is anything to explain.
   *
   * `forAddOn` scopes the result to one add-on, which is what a `per-add-on`
   * slot means: the manage drawer asks for the panel of the add-on it is
   * managing and gets that one or nothing.
   */
  fillsFor: <S extends SlotId>(
    slot: S,
    enabled: ReadonlySet<string>,
    forAddOn?: string,
  ) => ResolvedFill<S>[];
}

/**
 * Build a registry over a static list. Add-ons are sorted by key so the shelf
 * and every multi-fill slot have a stable order that does not depend on the
 * sequence they happened to be registered in.
 *
 * IT IS HERE BECAUSE THE MIRROR IS A MIRROR. The host's file declares it, so
 * this one does too — and an add-on's suite can then build a registry over its
 * own `register()` and assert the host will resolve its fills in the order it
 * meant, without a running host. Nothing in an add-on's shipped bundle imports
 * it, so nothing in an add-on's shipped bundle contains it.
 */
export function createRegistry(addOns: readonly AddOn[]): AddOnRegistry {
  const all = [...addOns].sort((a, b) => a.key.localeCompare(b.key));
  const index = new Map(all.map((a) => [a.key, a]));

  return {
    all,
    byKey: (key) => index.get(key),
    fillsFor<S extends SlotId>(slot: S, enabled: ReadonlySet<string>, forAddOn?: string) {
      const fills = all
        .filter((addOn) => enabled.has(addOn.key))
        .filter((addOn) => forAddOn === undefined || addOn.key === forAddOn)
        .flatMap((addOn) =>
          addOn.fills
            .filter((f) => f.slot === slot)
            /*
             * THE ONE CAST IN THE SEAM, and the runtime check on the line above
             * is what earns it. `fills` is the union over every id, and a
             * `.filter()` predicate does not narrow a generic `S` for the
             * compiler however obvious it is to a reader. Everything either
             * side of this line is checked: the add-on declared `slot` and
             * `render` together (`AnyAddOnFill` pairs them), and the caller
             * asked for one id and gets that id's payload type back.
             */
            .map((f) => ({ addOn: addOn.key, fill: f as unknown as AddOnFill<S> })),
        )
        .sort((a, b) => a.fill.order - b.fill.order || a.addOn.localeCompare(b.addOn));

      // A single-fill slot takes the lowest order. The one that lost is not
      // silently overridden — the host's Add-ons screen surfaces the conflict.
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

// ── seeded activity, dated by the host ──────────────────────────────────────

/*
 * CIVIL DATES WITHOUT A `Date`.
 *
 * `purity.test.ts` bans `new Date(` in everything this package ships, and it is
 * right to: a bare `new Date('2026-08-05')` is UTC midnight, the same literal
 * with a time is LOCAL, and a seeded line that slid a day depending on which
 * side of Greenwich the shop's laptop was standing would be the same class of
 * bug this whole file exists to close. So the two conversions are the
 * days-from-civil pair — integer arithmetic, no timezone anywhere near it.
 */

function daysFromCivil(y: number, m: number, d: number): number {
  const shifted = y - (m <= 2 ? 1 : 0);
  const era = Math.floor(shifted / 400);
  const yearOfEra = shifted - era * 400;
  const dayOfYear = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
  const dayOfEra =
    yearOfEra * 365 + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100) + dayOfYear;
  return era * 146097 + dayOfEra - 719468;
}

function civilFromDays(days: number): { y: number; m: number; d: number } {
  const shifted = days + 719468;
  const era = Math.floor(shifted / 146097);
  const dayOfEra = shifted - era * 146097;
  const yearOfEra = Math.floor(
    (dayOfEra -
      Math.floor(dayOfEra / 1460) +
      Math.floor(dayOfEra / 36524) -
      Math.floor(dayOfEra / 146096)) /
      365,
  );
  const year = yearOfEra + era * 400;
  const dayOfYear =
    dayOfEra - (365 * yearOfEra + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100));
  const mp = Math.floor((5 * dayOfYear + 2) / 153);
  const d = dayOfYear - Math.floor((153 * mp + 2) / 5) + 1;
  const m = mp + (mp < 10 ? 3 : -9);
  return { y: year + (m <= 2 ? 1 : 0), m, d };
}

const pad = (n: number): string => String(n).padStart(2, '0');

/** `2026-08-05` shifted by whole days, both directions. */
function shiftIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map((part) => Number.parseInt(part, 10));
  const { y: yy, m: mm, d: dd } = civilFromDays(daysFromCivil(y!, m!, d!) + days);
  return `${String(yy).padStart(4, '0')}-${pad(mm)}-${pad(dd)}`;
}

/**
 * TURN AN ADD-ON'S "FORTY MINUTES AGO" INTO A DAY AND A TIME THIS SHOP AGREES
 * WITH.
 *
 * The host calls this everywhere it used to read `entry.iso` — the manage
 * drawer's list and the shelf's "last used" are the two — passing its own
 * pinned clock and its own recent references. It is the mirror of what
 * `<AddOnSlot>` already does with `now`: the add-on says what it wants
 * expressed, the host says what it is true of.
 *
 * PURE, and deterministic to the minute: no clock is read here either. A demo
 * whose seeded history moved would be a demo nobody can screenshot, which is
 * the whole reason `ShopClock` crosses the seam rather than being sampled.
 *
 * Entries naming a reference the host has not got are DROPPED (see
 * `SeededActivityEntry.refIndex`), so the resolved list can be shorter than the
 * declared one and callers must read its length rather than the add-on's.
 */
export function resolveActivity(
  entries: readonly SeededActivityEntry[] | undefined,
  context: ActivityContext,
): readonly ActivityEntry[] {
  if (entries === undefined) return [];
  const dayMinutes = 1440;
  const out: ActivityEntry[] = [];

  for (const entry of entries) {
    let ref = '';
    if (entry.refIndex !== undefined) {
      const found = context.refs[entry.refIndex];
      // The host has fewer records than this add-on assumed. A line pointing at
      // a blank is worse than no line.
      if (found === undefined) continue;
      ref = found;
    }

    const total = context.now.hour * 60 + context.now.minute - entry.minutesAgo;
    // `Math.floor` and not a truncation: going back past midnight has to move
    // the date to the day BEFORE, and `-1 / 1440 | 0` is zero.
    const dayShift = Math.floor(total / dayMinutes);
    const inDay = total - dayShift * dayMinutes;

    out.push({
      iso: shiftIso(context.now.iso, dayShift),
      hour: Math.floor(inDay / 60),
      minute: inDay % 60,
      ref,
      messageKey: entry.messageKey,
    });
  }

  return out;
}
