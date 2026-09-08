/**
 * The message registry.
 *
 * The app's strings are split across area modules under `../strings/` so they
 * can be authored without one enormous file. This module is the only place that
 * knows they are separate: it flattens them into one bundle per locale, which
 * is what the runtime looks keys up in.
 *
 * Keys must be unique across areas — a later area silently wins a collision,
 * so namespace them (`chrome.*`, `screen.*`, `data.*`, `addon.*`).
 *
 * ── WHERE THE ADD-ONS' STRINGS COME FROM, AND WHAT THAT COST ────────────────
 *
 * They used to be imported here — three `import … from '../../add-ons/vendor/…'`
 * lines, folded into `AREAS`, and folded into the exported `MessageKey` union.
 * That gave add-on keys the same compile-time guarantees the host's own keys
 * have, and it was the wrong trade: it meant the HOST's key vocabulary was a
 * function of which add-ons happened to be vendored, and that this module — the
 * host's own i18n core — named three add-ons. A host that has to be edited to
 * add a fourth add-on does not have an add-on system.
 *
 * An add-on now REGISTERS its bundle (`registerAddOnMessages`, called from
 * `add-ons/registry.ts` at module load), and here is the honest accounting of
 * what moved:
 *
 *   LOST   — an add-on's keys are no longer members of `MessageKey`, so
 *            `t('addon.design-studio.line')` is not spell-checked by the
 *            compiler. Host code that renders an add-on string already went
 *            through a cast, because the keys were only ever known through the
 *            add-on object anyway.
 *   LOST   — a locale missing a key inside an add-on bundle is no longer a
 *            compile error in this repo. It is still a compile error IN THE
 *            ADD-ON'S OWN REPO, where the person who can fix it works: each
 *            ships the same `Area<>` annotation over its own bundle.
 *   KEPT   — the guarantee itself, moved from the type checker to
 *            `registerAddOnMessages`, which walks the bundle at registration
 *            and THROWS naming the locale and the key. It runs on every boot,
 *            including the demo, so it cannot be skipped the way a test can.
 *   KEPT   — the runtime suite in `messages.test.ts`, which asserts parity,
 *            placeholders and the vocabulary ban over the MERGED bundle, and
 *            which now imports the registry for the side effect of registering.
 *   KEPT   — full compile-time parity for the HOST's own five areas, below,
 *            unchanged.
 *
 * The three bundles are VENDORED copies (see `src/add-ons/vendor/`), synced
 * from the add-ons monorepo by `scripts/sync-add-ons.sh` and never hand-edited.
 */
import type { Translated } from "../untranslated.ts";
import { LOCALE_TAGS, type LocaleTag } from "../locales.ts";
import { addOns } from "../strings/addOns.ts";
import { chrome } from "../strings/chrome.ts";
import { screensCustomer } from "../strings/screensCustomer.ts";
import { screensShop } from "../strings/screensShop.ts";
import { data } from "../strings/data.ts";

/**
 * Parity guard. `en-US` defines the keys; the other seven must each carry a
 * string for every one of them. A translation module that is missing an English
 * key is a COMPILE error here rather than a silent per-key fallback to English
 * at runtime — which is the failure mode this whole layer exists to prevent.
 */
type Area<EN extends Record<string, string>> = { "en-US": EN } & Record<
  Exclude<LocaleTag, "en-US">,
  Translated<EN>
>;

const AREAS: [
  Area<(typeof chrome)["en-US"]>,
  Area<(typeof screensCustomer)["en-US"]>,
  Area<(typeof screensShop)["en-US"]>,
  Area<(typeof data)["en-US"]>,
  Area<(typeof addOns)["en-US"]>,
] = [chrome, screensCustomer, screensShop, data, addOns];

export const MESSAGES = Object.fromEntries(
  LOCALE_TAGS.map((t) => [t, Object.assign({}, ...AREAS.map((a) => a[t] ?? {}))]),
) as Record<LocaleTag, Record<string, string>>;

/** Keys are typed off English — the source of truth — so a typo is a compile error. */
export type MessageKey =
  | keyof (typeof chrome)["en-US"]
  | keyof (typeof screensCustomer)["en-US"]
  | keyof (typeof screensShop)["en-US"]
  | keyof (typeof data)["en-US"]
  | keyof (typeof addOns)["en-US"];

/** One add-on's bundle, as it travels on the add-on object. */
export type AddOnMessages = Readonly<Record<string, Readonly<Record<string, string>>>>;

/** Which add-ons have registered, for the suite that checks they all did. */
const registered = new Set<string>();

/**
 * WHICH ADD-ON OWNS EACH KEY THIS MAP GAINED — the half connected mode needs.
 *
 * The collision rule below is right and stays: an add-on that would overwrite a
 * key somebody else already holds is refused. What it could not tell apart, as
 * long as registration happened exactly once at module load, is the SAME add-on
 * arriving twice.
 *
 * Connected mode makes that ordinary rather than exotic. `registry.ts` runs its
 * merge as a module-load side effect and the store imports it for
 * `DEFAULT_ADD_ON_SETTINGS`, so those three bundles are in this map before any
 * boot decides which source it is using — and a server that then delivers one
 * of the same three would collide with a copy of itself. Refusing that is a
 * boot that dies on a correct configuration.
 *
 * So the question the rule asks becomes "does somebody ELSE hold this key",
 * which is the question it was always trying to ask. Re-registering the same
 * add-on OVERWRITES its own keys, deliberately: a server may deliver a newer
 * version whose strings have changed, and silently keeping the older copy would
 * be a shop running on a build's worth of stale words with nothing to say so.
 */
const owners = new Map<string, string>();

export function registeredAddOnMessageKeys(): readonly string[] {
  return [...registered].sort();
}

/**
 * Merge an add-on's strings into the runtime bundle, refusing a bundle that is
 * not complete in all eight locales.
 *
 * THIS THROWS, and loudly, on purpose. The check it replaces was a type error,
 * and the failure it guards against — a key present in English and missing in
 * Arabic — renders a raw dotted key on a screen in exactly one of eight
 * languages, which is the failure mode nobody notices until a reader complains.
 * A boot that dies with the locale and the key named is strictly better than a
 * shop running with a hole in its Arabic.
 *
 * A key that collides with one somebody ELSE already holds is refused for the
 * same reason: a later area silently winning a collision is how an add-on ends
 * up quietly rewriting the host's copy. An add-on re-registering its OWN keys
 * is an update rather than a collision — see `owners` above for why connected
 * mode makes that the ordinary case.
 */
export function registerAddOnMessages(addOnKey: string, bundle: AddOnMessages): void {
  const english = bundle["en-US"];
  if (english === undefined) {
    throw new Error(`add-on "${addOnKey}" registered no en-US strings`);
  }

  const keys = Object.keys(english);
  for (const locale of LOCALE_TAGS) {
    const localeBundle = bundle[locale];
    if (localeBundle === undefined) {
      throw new Error(`add-on "${addOnKey}" is missing the ${locale} locale entirely`);
    }
    for (const key of keys) {
      const value = localeBundle[key];
      if (typeof value !== "string" || value.trim() === "") {
        throw new Error(`add-on "${addOnKey}" is missing ${locale} for "${key}"`);
      }
    }
  }

  /*
   * THE KEYS ARE THE UNION ACROSS EVERY LOCALE, not the English set.
   *
   * The collision check used to read `Object.keys(english)` while the merge
   * three blocks down does `Object.assign(MESSAGES[locale], bundle[locale])` —
   * the WHOLE bundle, locale by locale. So a key present in one of the seven
   * non-English bundles and absent from `en-US` was merged with no collision
   * check and no owner recorded, which quietly falsified the sentence directly
   * below it: the host's own keys were overwritable after all, and two add-ons
   * could fight over one with neither registration refused.
   *
   * Checking the union costs one pass and closes it. The parity loop above
   * still keys off English, and correctly — a key only some locales carry is a
   * different fault, and it is the one this function has always reported first.
   */
  const everyKey = new Set(keys);
  for (const locale of LOCALE_TAGS) {
    for (const key of Object.keys(bundle[locale] ?? {})) everyKey.add(key);
  }

  for (const key of everyKey) {
    if (MESSAGES["en-US"][key] === undefined && !owners.has(key)) continue;
    const owner = owners.get(key);
    // `undefined` means the HOST's own five areas hold it — never overwritable.
    if (owner !== addOnKey) {
      throw new Error(
        `add-on "${addOnKey}" would overwrite the ` +
          (owner === undefined ? "host's own" : `"${owner}" add-on's`) +
          ` message key "${key}"`,
      );
    }
  }

  // Mutating the same objects rather than rebuilding `MESSAGES` is what lets
  // the i18n provider hold a reference to a locale's bundle across a
  // registration — and registration happens at module load, before any of them
  // is read, so nothing is ever read half-merged.
  for (const locale of LOCALE_TAGS) Object.assign(MESSAGES[locale], bundle[locale]);
  for (const key of everyKey) owners.set(key, addOnKey);
  registered.add(addOnKey);
}
