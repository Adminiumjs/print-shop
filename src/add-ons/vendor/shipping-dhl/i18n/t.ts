/*
 * VENDORED from add-on-shipping-dhl/src/i18n/t.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the add-on repo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `shipping-dhl`; its manifest, tests and README live in that repo.
 */
/**
 * A ~70-line message lookup, and the reason it exists rather than a hook from
 * the host.
 *
 * A slot fill is handed a payload and nothing else. It cannot import the host's
 * `useT` — that would be a runtime dependency on the host's module graph, which
 * 24 D7 does not allow — so it has to work out the reader's language for
 * itself. The one thing the host guarantees is `<html lang>` and `<html dir>`,
 * stamped by its i18n provider; this module reads that attribute and
 * re-renders when it changes.
 *
 * `useSyncExternalStore` over a `MutationObserver` rather than reading the
 * attribute during render: the host sets `lang` in an effect, so a plain read
 * would be one render behind on every language switch, and the add-on's panel
 * would sit in the old language until something else moved.
 */

import { useCallback, useSyncExternalStore } from "react";

import { strings, type LocaleTag, type StringKey } from "./strings.ts";

const DEFAULT_LOCALE: LocaleTag = "en-US";

function isLocaleTag(value: string | null): value is LocaleTag {
  return value !== null && value in strings;
}

/**
 * Resolve the document's `lang` to a locale we have.
 *
 * `zh` is split by script rather than by prefix, because Simplified and
 * Traditional are separately translated and falling one through to the other
 * would silently ship the wrong Chinese.
 */
export function localeFromLang(lang: string | null): LocaleTag {
  if (isLocaleTag(lang)) return lang;
  if (lang === null || lang.length === 0) return DEFAULT_LOCALE;
  const lower = lang.toLowerCase();
  if (lower.startsWith("zh")) return /hant|tw|hk|mo/.test(lower) ? "zh-TW" : "zh-CN";
  const prefix = lower.split("-")[0];
  const hit = (Object.keys(strings) as LocaleTag[]).find(
    (tag) => tag.toLowerCase().split("-")[0] === prefix,
  );
  return hit ?? DEFAULT_LOCALE;
}

function currentLocale(): LocaleTag {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  return localeFromLang(document.documentElement.getAttribute("lang"));
}

function subscribe(onChange: () => void): () => void {
  if (typeof MutationObserver === "undefined") return () => {};
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributeFilter: ["lang"] });
  return () => observer.disconnect();
}

export type TFunction = (key: StringKey, params?: Record<string, string | number>) => string;

/** Pure lookup with `{placeholder}` substitution — no plurals, by design. */
export function translate(
  locale: LocaleTag,
  key: StringKey,
  params?: Record<string, string | number>,
): string {
  const raw = strings[locale][key] ?? strings[DEFAULT_LOCALE][key] ?? key;
  if (params === undefined) return raw;
  return raw.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in params ? String(params[name]) : whole,
  );
}

export function useLocale(): LocaleTag {
  return useSyncExternalStore(subscribe, currentLocale, () => DEFAULT_LOCALE);
}

export function useT(): TFunction {
  const locale = useLocale();
  return useCallback((key, params) => translate(locale, key, params), [locale]);
}

/**
 * Money and dates in the reader's own numerals and calendar.
 *
 * Currency is a property of the money, never of the reader's language: a rate
 * quoted in USD stays USD however the number is written out.
 */
export function useFormat(): {
  money: (major: number, currency: string) => string;
  day: (iso: string, opts?: Intl.DateTimeFormatOptions) => string;
} {
  const locale = useLocale();
  return {
    money: (major, currency) =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(major),
    day: (iso, opts) => {
      const [y, m, d] = iso.split("-").map((n) => Number.parseInt(n, 10));
      // UTC midnight, then formatted in UTC: a delivery date must not slide a
      // day because the shop's laptop is west of Greenwich.
      const at = new Date(Date.UTC(y!, m! - 1, d!));
      return new Intl.DateTimeFormat(locale, {
        timeZone: "UTC",
        ...(opts ?? { weekday: "short", day: "numeric", month: "short" }),
      }).format(at);
    },
  };
}
