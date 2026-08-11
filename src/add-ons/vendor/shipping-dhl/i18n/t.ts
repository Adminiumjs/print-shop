/*
 * VENDORED from add-ons/packages/shipping-dhl/src/i18n/t.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `shipping-dhl`; its manifest, tests and README live in the monorepo.
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

/**
 * Pure lookup with `{placeholder}` substitution — no plurals, by design.
 *
 * A NUMBER SUBSTITUTED INTO COPY IS FORMATTED, NEVER `String()`d, and this one
 * line is what decides whether Arabic reads ٠٫٦ or 0.6. Every `t("…", { kg })`
 * and `{ quantity }` in this add-on used to drop a Latin numeral into the
 * middle of a right-to-left sentence, beside host strings on the same screen
 * rendering ٦ and ٤٠ — the settings panel said "0.6 kg" between two Arabic
 * lines, and the parcel hints did the same. The host fixed the identical defect
 * at its own `t` seam; an add-on has its own seam and therefore its own copy of
 * the bug.
 *
 * Fixing it HERE rather than at each call site fixes the call sites nobody has
 * written yet. A caller that has already formatted its value passes a STRING
 * and is left alone, which is what keeps money and dates — both of which have
 * their own formatters below — coming out right.
 */
export function translate(
  locale: LocaleTag,
  key: StringKey,
  params?: Record<string, string | number>,
): string {
  const raw = strings[locale][key] ?? strings[DEFAULT_LOCALE][key] ?? key;
  if (params === undefined) return raw;
  const nf = new Intl.NumberFormat(locale);
  return raw.replace(/\{(\w+)\}/g, (whole, name: string) => {
    if (!(name in params)) return whole;
    const value = params[name];
    return typeof value === "number" ? nf.format(value) : String(value);
  });
}

export function useLocale(): LocaleTag {
  return useSyncExternalStore(subscribe, currentLocale, () => DEFAULT_LOCALE);
}

export function useT(): TFunction {
  const locale = useLocale();
  return useCallback((key, params) => translate(locale, key, params), [locale]);
}

/**
 * A CLOCK FACE IN THE READER'S NUMERALS — pure, so the label table can use it.
 *
 * `String(hour).padStart(2, "0")` is what the dispatch dialog did, and it is
 * the same defect the `t` seam above had, one layer down: the padding produced
 * a LATIN zero, so an Arabic shop read "الجمعة، ٧ أغسطس 10:20" — an Arabic date
 * and a Latin time, in one chip. `minimumIntegerDigits` pads with whatever zero
 * the locale writes.
 */
export function timeOfDay(locale: LocaleTag, hour: number, minute: number): string {
  const two = (value: number) =>
    new Intl.NumberFormat(locale, {
      minimumIntegerDigits: 2,
      useGrouping: false,
    }).format(value);
  return `${two(hour)}:${two(minute)}`;
}

/**
 * A CLOCK FACE THAT ARRIVED AS A WIRE STRING, formatted like any other.
 *
 * `timeOfDay` above has always been right and has always been available; the
 * three places that drew a time did not use it. A tracking event carries an ISO
 * datetime and the panels rendered `event.at.slice(11, 16)` — the substring — so
 * the collection window read `14:00–17:00` and every scan on the tracking list
 * read `08:05`, in Latin digits, beside dates the very same component had just
 * formatted into Arabic. `timeOfDay` was destructured on the same line in two of
 * the three files.
 *
 * That is the shape of every digit defect in this wave: a formatter that exists,
 * beside a value that goes round it. So the wire string is what this takes —
 * `"2026-08-05T14:32:00"` or `"14:00"`, whatever a caller is holding — and there
 * is no shorter path to a rendered time than calling it.
 */
export function clockFromWire(locale: LocaleTag, wire: string): string {
  const at = /(\d{1,2}):(\d{2})/.exec(wire);
  if (at === null) return wire;
  return timeOfDay(locale, Number(at[1]), Number(at[2]));
}

/**
 * A NUMBER A PERSON TYPED, IN WHATEVER DIGITS THEIR KEYBOARD MAKES.
 *
 * The parcel's weight and dimensions are editable fields, and the moment their
 * DISPLAY is localised — which it must be, or an Arabic shop reads a Latin
 * weight beside Arabic prices — `Number.parseFloat` stops understanding what
 * comes back out of them. So reading is localised too: the Arabic-Indic and
 * extended-Arabic digit blocks are folded onto 0–9, the Arabic decimal
 * separator onto a point, and anything else is left for `parseFloat` to reject
 * exactly as it did before.
 */
export function parseNumber(text: string): number {
  const folded = text.replace(/[٠-٩۰-۹]/g, (d) => {
    const code = d.codePointAt(0)!;
    return String(code - (code >= 0x06f0 ? 0x06f0 : 0x0660));
  });
  return Number.parseFloat(folded.replace(/٫/g, ".").replace(/[٬،\s]/g, ""));
}

/**
 * Money, numbers, times and dates in the reader's own numerals and calendar.
 *
 * Currency is a property of the money, never of the reader's language: a rate
 * quoted in USD stays USD however the number is written out.
 */
export function useFormat(): {
  money: (major: number, currency: string) => string;
  number: (value: number, opts?: Intl.NumberFormatOptions) => string;
  timeOfDay: (hour: number, minute: number) => string;
  clock: (wire: string) => string;
  day: (iso: string, opts?: Intl.DateTimeFormatOptions) => string;
} {
  const locale = useLocale();
  return {
    number: (value, opts) => new Intl.NumberFormat(locale, opts).format(value),
    timeOfDay: (hour, minute) => timeOfDay(locale, hour, minute),
    clock: (wire) => clockFromWire(locale, wire),
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
