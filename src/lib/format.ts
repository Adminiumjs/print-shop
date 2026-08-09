/**
 * Display formatting.
 *
 * Every function here goes through `i18n/ambient.ts` rather than taking a
 * locale argument, because the store, the seed and both engines call these from
 * outside React where no hook can reach the provider. The ambient module
 * mirrors whatever locale the tree is rendering, so a price formatted in the
 * store and a price formatted in a component always agree.
 */

import { money as ambientMoney, number as ambientNumber, locale, t } from "../i18n/ambient.ts";
import type { TintFamily } from "./catalogue.ts";

/** Cents → the reader's currency format. The engines work in integer cents. */
export function cents(value: number): string {
  return ambientMoney(value / 100);
}

/**
 * A unit price. Cards at $0.19 each are the figure a customer decides on, so
 * this keeps a third decimal where the second would round the difference
 * between two quantity breaks out of existence.
 */
export function unitPrice(valueCents: number): string {
  const major = valueCents / 100;
  return ambientMoney(major < 1 ? Math.round(major * 1000) / 1000 : major);
}

/** Millimetres, always LTR and tabular — `85 × 55` never flips under RTL. */
export function mm(width: number, height: number): string {
  return `${trim(width)} × ${trim(height)}`;
}

export function trim(n: number): string {
  return ambientNumber(Math.round(n * 10) / 10);
}

export function sqm(area: number): string {
  return `${ambientNumber(Math.round(area * 100) / 100)} m²`;
}

/** An ISO date, in the reader's calendar and language. */
export function day(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  const [y, m, d] = iso.split("-").map((n) => Number.parseInt(n, 10));
  const date = new Date(Date.UTC(y!, m! - 1, d!));
  return new Intl.DateTimeFormat(locale(), {
    timeZone: "UTC",
    ...(opts ?? { weekday: "long", day: "numeric", month: "long" }),
  }).format(date);
}

/** Short form for chips and table cells. */
export function shortDay(iso: string): string {
  return day(iso, { day: "numeric", month: "short" });
}

/** The dock's clock readout: pinned date and time, never a real one. */
export function clock(iso: string, hour: number, minute: number): string {
  const hh = String(hour).padStart(2, "0");
  const mm_ = String(minute).padStart(2, "0");
  return `${day(iso, { weekday: "short", day: "numeric", month: "short" })} ${hh}:${mm_}`;
}

/** Percentages in the reader's numerals. */
export function pct(value: number): string {
  return ambientNumber(value, { style: "percent", maximumFractionDigits: 0 });
}

/** The multiplier on the break curve, e.g. `×0.66`. */
export function multiplier(value: number): string {
  return `×${ambientNumber(value, { minimumFractionDigits: 2 })}`;
}

/** The CSS custom property carrying a product family's gradient. */
export function tint(family: TintFamily): string {
  return `var(--tint-${family})`;
}

/** The flat colour of the same family, for dots and small marks. */
export function flatTint(family: TintFamily): string {
  return `var(--tint-flat-${family})`;
}

/**
 * A due chip's words. Anything past the promise reads "overdue" rather than a
 * negative number — a works needs to act on it, not do the subtraction.
 */
export function dueLabel(days: number): string {
  if (days < 0) return t("due.overdue");
  if (days === 0) return t("due.today");
  if (days === 1) return t("due.tomorrow");
  return t("due.days", { days: ambientNumber(days) });
}
