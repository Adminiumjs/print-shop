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
  Record<keyof EN, string>
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
 * A key that collides with one already in the bundle is refused for the same
 * reason: a later area silently winning a collision is how an add-on ends up
 * quietly rewriting the host's copy.
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

  for (const key of keys) {
    const owner = MESSAGES["en-US"][key];
    if (owner !== undefined) {
      throw new Error(`add-on "${addOnKey}" would overwrite the existing message key "${key}"`);
    }
  }

  // Mutating the same objects rather than rebuilding `MESSAGES` is what lets
  // the i18n provider hold a reference to a locale's bundle across a
  // registration — and registration happens at module load, before any of them
  // is read, so nothing is ever read half-merged.
  for (const locale of LOCALE_TAGS) Object.assign(MESSAGES[locale], bundle[locale]);
  registered.add(addOnKey);
}
