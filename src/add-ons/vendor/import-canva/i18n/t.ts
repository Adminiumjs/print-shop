/*
 * VENDORED from add-ons/packages/import-canva/src/i18n/t.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `import-canva`; its manifest, tests and README live in the monorepo.
 */
/**
 * The add-on's own translator — the half with NO React in it.
 *
 * It exists because a slot fill renders inside the host's React tree but is not
 * inside the host's i18n provider's module graph — a standalone repo cannot
 * import the host's `useT`. What both halves DO share is the `lang` attribute
 * the host stamps on `<html>`, which is the one switch that also turns RTL on.
 * Reading that is how this add-on and the app it fills can never disagree about
 * which language they are speaking.
 *
 * WHY THE HOOKS ARE NOT HERE. `provides[].server` in the manifest points at a
 * build output that must be loadable outside a browser and outside a React
 * tree, and `source.ts` — the `artwork-source@1` implementation — reaches this
 * module for `label()`. If the hooks lived here, the server output would carry
 * an `import … from "react"` it has no business carrying, and the client/server
 * split the manifest claims would be a claim about file names only. They live
 * in `useT.ts`, which only the `.tsx` files import; `built-output.test.ts`
 * asserts the separation survives bundling.
 *
 * Keys are written short here (`t("import.use")`) and stored long
 * (`addon.import-canva.import.use`), because the long form is what the host
 * looks up but the short form is what this repo's own components read.
 */

import { importCanvaStrings } from "./strings.ts";

/** Copied from the host's `i18n/locales.ts` — see `@adminium/add-on-host` for why. */
export const LOCALE_TAGS = [
  "en-US",
  "de-DE",
  "fr-FR",
  "cs-CZ",
  "da-DK",
  "zh-CN",
  "zh-TW",
  "ar-EG",
] as const;

export type LocaleTag = (typeof LOCALE_TAGS)[number];
export const DEFAULT_LOCALE: LocaleTag = "en-US";

type Bundle = (typeof importCanvaStrings)["en-US"];

/**
 * Parity, enforced by the compiler on this side too.
 *
 * The host runs the same check when it merges this area into its bundle, but a
 * translation that only breaks in the host's build breaks in someone else's
 * repo — and by then the person who can fix it has moved on.
 */
type Area<EN extends Record<string, string>> = { "en-US": EN } & Record<
  Exclude<LocaleTag, "en-US">,
  Record<keyof EN, string>
>;

export const STRINGS = importCanvaStrings satisfies Area<Bundle>;

const PREFIX = "addon.import-canva." as const;

/** `"import.use"` — every key with this add-on's namespace taken off the front. */
export type MessageKey = keyof Bundle extends `${typeof PREFIX}${infer Short}`
  ? Short
  : never;

export type TFunction = (
  key: MessageKey,
  params?: Record<string, string | number>,
) => string;

function isLocaleTag(v: unknown): v is LocaleTag {
  return typeof v === "string" && (LOCALE_TAGS as readonly string[]).includes(v);
}

/**
 * Best-effort match of an html `lang` to a locale this add-on speaks — exact
 * tag, then language-only (`de-AT` → `de-DE`), else English. `zh` is
 * disambiguated by script or region because Simplified and Traditional are
 * separately translated and must never fall through to each other.
 */
export function resolveLocale(tag: string | null): LocaleTag {
  if (isLocaleTag(tag)) return tag;
  if (tag === null || tag === "") return DEFAULT_LOCALE;
  const lower = tag.toLowerCase();
  if (lower.startsWith("zh")) return /hant|tw|hk|mo/.test(lower) ? "zh-TW" : "zh-CN";
  const lang = lower.split("-")[0];
  return LOCALE_TAGS.find((t) => t.split("-")[0] === lang) ?? DEFAULT_LOCALE;
}

export function makeT(locale: LocaleTag): TFunction {
  const bundle: Record<string, string> = STRINGS[locale];
  const fallback: Record<string, string> = STRINGS[DEFAULT_LOCALE];

  const nf = new Intl.NumberFormat(locale);

  return (key, params) => {
    const full = `${PREFIX}${key}`;
    const raw = bundle[full] ?? fallback[full] ?? full;
    if (params === undefined) return raw;
    /*
     * A NUMBER SUBSTITUTED INTO COPY IS FORMATTED, NEVER `String()`d — the one
     * line that decides whether Arabic reads ٣ or 3. Every host fixed this at
     * its own `t` seam and every add-on has a seam of its own, so every add-on
     * had a copy of the bug waiting for the first `t("…", { count })` somebody
     * wrote. A caller that has already formatted its value passes a STRING and
     * is left alone.
     */
    return raw.replace(/\{(\w+)\}/g, (whole: string, name: string) => {
      if (!(name in params)) return whole;
      const value = params[name];
      return typeof value === "number" ? nf.format(value) : String(value);
    });
  };
}

/**
 * The `lang` the host has stamped, or English before it has stamped one.
 *
 * Guarded on `document` rather than assuming a browser: this module is reached
 * by the `artwork-source@1` implementation, which the conformance suite runs
 * under Node and a connected host may one day run on a server.
 */
export function currentTag(): string {
  return typeof document === "undefined"
    ? DEFAULT_LOCALE
    : (document.documentElement.getAttribute("lang") ?? DEFAULT_LOCALE);
}

/** For the non-React half — `ArtworkSource.label()`, which the host calls directly. */
export const t: TFunction = (key, params) =>
  makeT(resolveLocale(currentTag()))(key, params);

/**
 * Subscribe to the host's `lang` attribute. Exported for `useT.ts` only — it is
 * the React-free half of the store the hook there reads.
 */
export function subscribeToLang(onChange: () => void): () => void {
  if (typeof document === "undefined") return () => {};
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"],
  });
  return () => observer.disconnect();
}
