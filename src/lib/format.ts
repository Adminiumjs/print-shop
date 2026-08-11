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
import { PACKAGING_BATCH } from "./rates.ts";

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

/**
 * A PLAIN NUMBER, FOR THE PLACES A NUMBER GOES STRAIGHT INTO JSX.
 *
 * `t()` formats every number substituted into copy, which covers a sentence
 * with a figure in it and covers nothing else. A quantity rendered on its own —
 * `{job.quantity} · {mm(…)}` on a job card, a step number in a heading, the
 * quantity ticks under the break curve — never goes near `t()`, and those sat
 * in Arabic pages printing Latin digits beside prices this same module had
 * formatted. `<Mono>` catches the ones that pass through it; this is for the
 * ones that do not.
 */
export function num(value: number, opts?: Intl.NumberFormatOptions): string {
  return ambientNumber(value, opts);
}

/**
 * An area in square metres, WITH THE UNIT IN THE READER'S LANGUAGE.
 *
 * [Corrected 2026-08-11, wave 4b round 5.] The figure was already formatted and
 * the unit was glued on as a literal `m²`, so the Configure screen in ar-EG read
 * `٠٫١٢ m²` three lines above `limit.area`, which says `م²`, and one line below
 * a material chip that had just been fixed to say `جم/م²`. Chinese read `m²`
 * beside its own `平方米`. Every one of those units was already in the bundle,
 * in every locale, and this one function went around it — which is the same
 * shape as the studio's `mm()`, fixed there in an earlier round and not here.
 *
 * Through the AMBIENT `t` because this module is called from the store and the
 * quote engine, where no hook reaches the provider.
 */
export function sqm(area: number): string {
  return `${ambientNumber(Math.round(area * 100) / 100)} ${t("common.sqm")}`;
}

/**
 * WHAT A PACKAGING OPTION COSTS, said in words and priced by the quote engine.
 *
 * [Added 2026-08-11, wave 4b round 5.] The three hints used to be finished
 * sentences in the message bundle — `"$4.50 per 500"`, and in ar-EG
 * `"٤٫٥٠ $ لكل ٥٠٠"`. The digits were right, so the numerals guard was content,
 * and two other things were wrong with every one of them:
 *
 *   THE CURRENCY WAS A BARE `$`. Every other price on that same Configure
 *   screen goes through `Intl.NumberFormat` with `currency: "USD"` and renders
 *   `US$` in English and `$US` in French — because a bare `$` names about a
 *   dozen different currencies. These three said `$`.
 *
 *   AND A PRICE IN A TRANSLATED STRING CANNOT FOLLOW THE ENGINE. `rates.ts`
 *   holds `rateCents: 450`. Change it and eight bundles go on saying 4.50 — in
 *   eight languages, on the price list AND on the configurator, with the basket
 *   charging something else. A number a program computes must not also be typed
 *   into prose.
 *
 * So the bundle keeps the SENTENCE, keyed by the basis rather than by the
 * packaging, and the figures are substituted: the price through `cents`, the
 * batch size as a number so it is formatted too. Nothing in the bundle knows
 * what anything costs.
 */
export function packagingHint(
  t: (key: string, params?: Record<string, string | number>) => string,
  packaging: { basis: "included" | "per-unit" | "per-500"; rateCents: number },
): string {
  if (packaging.basis === "included") return t("data.packagingHint.included");
  if (packaging.basis === "per-unit") {
    return t("data.packagingHint.perUnit", { price: unitPrice(packaging.rateCents) });
  }
  return t("data.packagingHint.per500", {
    price: cents(packaging.rateCents),
    n: PACKAGING_BATCH,
  });
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
