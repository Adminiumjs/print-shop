/**
 * How the works' figures read, in the reader's language and the works' zone
 * and money: a stored amount, a stored date, a stored weight. Nothing here
 * works a figure out; it only says one.
 */
import { useMemo } from "react";

import { useI18n } from "../i18n/index.tsx";
import { useEnv } from "./env.tsx";
import { dayIn } from "./time.ts";
import { num } from "./wire.ts";

export interface Fmt {
  /** A stored amount in the works' money; a dash when it is empty. */
  money(value: unknown): string;
  /** A stored date (`YYYY-MM-DD`): "Wed 5 Aug". */
  day(day: string | null): string;
  /** A stored date's weekday alone: "Monday". */
  weekday(day: string | null): string;
  /** A stored date in full, with its year: "Wednesday 5 August 2026". */
  dayLong(day: string | null): string;
  /** A stored date's day heading: "Wednesday 5 August". */
  dayHeading(day: string | null): string;
  /** An instant, as the works' date: "Wed 5 Aug". */
  moment(iso: unknown): string;
  /** An instant's time of day on the works' clock, 24-hour: "10:20". */
  time(at: unknown): string;
  /** An instant's year, on the works' calendar. */
  year(at: number): string;
  /** A count or an amount, in the reader's digits. */
  number(value: unknown, digits?: number): string;
  /** An amount with exactly so many decimals: a multiplier reads "0.66", "1.00". */
  fixed(value: unknown, digits: number): string;
  /** The works' day of an instant. */
  today(at: number): string;
}

const noon = (day: string) => new Date(`${day}T12:00:00Z`);

export function useFmt(): Fmt {
  const { locale, money, number } = useI18n();
  const { door } = useEnv();
  const { zone, currency } = door.facts();
  return useMemo<Fmt>(() => {
    const short = new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
    const long = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
    const heading = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
    const weekday = new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" });
    const year = new Intl.DateTimeFormat(locale, { year: "numeric", timeZone: zone });
    const clock = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: zone });
    return {
      money: (value) => {
        const n = num(value);
        return n === null ? "—" : money(n, currency);
      },
      day: (day) => (day === null ? "—" : short.format(noon(day))),
      weekday: (day) => (day === null ? "—" : weekday.format(noon(day))),
      dayLong: (day) => (day === null ? "—" : long.format(noon(day))),
      dayHeading: (day) => (day === null ? "—" : heading.format(noon(day))),
      moment: (iso) => (typeof iso === "string" && iso !== "" ? short.format(noon(dayIn(iso, zone))) : "—"),
      time: (at) => (typeof at === "number" || (typeof at === "string" && at !== "") ? clock.format(new Date(typeof at === "number" ? at : Date.parse(at))) : "—"),
      year: (at) => year.format(new Date(at)),
      number: (value, digits = 0) => {
        const n = num(value);
        return n === null ? "—" : number(n, { maximumFractionDigits: digits });
      },
      fixed: (value, digits) => {
        const n = num(value);
        return n === null ? "—" : number(n, { minimumFractionDigits: digits, maximumFractionDigits: digits });
      },
      today: (at) => dayIn(at, zone),
    };
  }, [locale, money, number, zone, currency]);
}
