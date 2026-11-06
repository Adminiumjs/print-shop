/**
 * Money and days as the shop shows them: formatting only. Every figure comes
 * from Adminium as it is (a price as decimal text, a post-by as a date); this
 * file only writes it in the reader's language and numerals.
 */
import { formatTenantMoney } from "@adminiumjs/public-client";

/** The shop's English reads its dates the British way, as the studio writes them ("Tue 11 Aug"). */
const dateLocale = (locale: string) => (locale === "en-US" ? "en-GB" : locale);

/** A decimal from the server ("34.00"), in the shop's currency. */
export function money(value: unknown, currency: string | null, locale: string): string {
  if (value === null || value === undefined || value === "") return "";
  return formatTenantMoney(String(value), currency, locale);
}

/** A difference, signed ("+£6.00", "−£10.00"), or null when there is none. */
export function signedMoney(value: string, currency: string | null, locale: string): { text: string; sign: 1 | -1 } | null {
  const trimmed = value.trim();
  if (/^-?0*(\.0*)?$/.test(trimmed)) return null;
  const negative = trimmed.startsWith("-");
  return { text: `${negative ? "−" : "+"}${money(negative ? trimmed.slice(1) : trimmed, currency, locale)}`, sign: negative ? -1 : 1 };
}

/** A whole number in the reader's numerals. */
export function count(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}

/** A percentage the server worked out ("8.00"), as "8%". */
export function percent(value: string | null, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 2 }).format(Number(value ?? 0) / 100);
}

function asDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return match === null ? null : new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

/** "Tue 11 Aug". */
export function dayShort(iso: unknown, locale: string): string {
  const date = typeof iso === "string" ? asDate(iso) : null;
  return date === null ? "" : new Intl.DateTimeFormat(dateLocale(locale), { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" }).format(date);
}

/** "Tuesday 11 August". */
export function dayLong(iso: unknown, locale: string): string {
  const date = typeof iso === "string" ? asDate(iso) : null;
  return date === null ? "" : new Intl.DateTimeFormat(dateLocale(locale), { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" }).format(date);
}

/** "Monday 10 August 2026": a ready-by standing on its own. */
export function dayFull(iso: unknown, locale: string): string {
  const date = typeof iso === "string" ? asDate(iso) : null;
  if (date === null) return "";
  const written = new Intl.DateTimeFormat(dateLocale(locale), { timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date);
  // British English writes no comma after the weekday ("Monday 10 August 2026").
  return dateLocale(locale) === "en-GB" ? written.replace(/^(\p{L}+), /u, "$1 ") : written;
}

/** A file's size, in the reader's numerals: "4.2 MB", "320 KB". */
export function fileSize(bytes: number, locale: string): string {
  const mb = bytes / 1048576;
  if (mb >= 1) return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(mb)} MB`;
  return `${new Intl.NumberFormat(locale).format(Math.max(1, Math.round(bytes / 1024)))} KB`;
}

/** A decimal the server worked out ("2.23"), in the reader's numerals, to as many places as it has. */
export function decimal(value: unknown, locale: string, digits = 2): string {
  if (value === null || value === undefined || value === "") return "";
  return new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(Number(value));
}
