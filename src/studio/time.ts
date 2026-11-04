/**
 * The studio's calendar and clock.
 *
 * Every day the studio reads is ITS day, in its zone (the connection's, as
 * Adminium says it), on the server's clock: never the device's zone or time.
 * Days are `YYYY-MM-DD`, an instant epoch ms or an ISO string. The dates
 * themselves (a line's post-by) are Adminium's; this only says where today
 * stands against them.
 */

export type Day = string;

const parts = (instant: number, zone: string) => {
  const found = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instant));
  const get = (type: string) => found.find((part) => part.type === type)?.value ?? "";
  return { y: Number(get("year")), m: Number(get("month")), d: Number(get("day")), h: Number(get("hour")) % 24, min: Number(get("minute")), s: Number(get("second")) };
};

const pad = (n: number, width = 2) => String(n).padStart(width, "0");

/** How far `zone` is ahead of UTC at `instant`, in ms. */
export function zoneOffsetMs(zone: string, instant: number): number {
  const p = parts(instant, zone);
  const local = Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s);
  return Math.round((local - instant) / 60_000) * 60_000;
}

/** The studio's date of an instant. */
export function dayIn(instant: number | string, zone: string): Day {
  const p = parts(typeof instant === "number" ? instant : Date.parse(instant), zone);
  return `${pad(p.y, 4)}-${pad(p.m)}-${pad(p.d)}`;
}

/** A day so many calendar days on (or back). */
export function addDays(day: Day, n: number): Day {
  const at = Date.UTC(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10))) + n * 86_400_000;
  return new Date(at).toISOString().slice(0, 10);
}

const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/** A closure as its row keeps it: from and to (inclusive), and whether it is in effect. */
export interface Closure {
  from: Day;
  to: Day;
}

/** Whether the studio works on a day: one of its days, and not a day it is closed. */
export function isStudioDay(day: Day, studioDays: readonly string[], closures: readonly Closure[]): boolean {
  const weekday = WEEKDAYS[new Date(`${day}T12:00:00Z`).getUTCDay()]!;
  if (!studioDays.includes(weekday)) return false;
  return !closures.some((c) => day >= c.from && day <= c.to);
}

/**
 * Studio days from `from` to `to`: 0 on the same day, negative when `to` is
 * already past. What the board's post-by chip reads, never a date of its own.
 */
export function studioDaysBetween(from: Day, to: Day, studioDays: readonly string[], closures: readonly Closure[]): number {
  if (from === to) return 0;
  const step = to > from ? 1 : -1;
  let n = 0;
  let day = from;
  for (let guard = 0; day !== to && guard < 800; guard += 1) {
    day = addDays(day, step);
    if (isStudioDay(day, studioDays, closures)) n += step;
  }
  return n;
}

/**
 * A moment as SQLite hands it back (the server's wall time, `2026-07-28
 * 18:40:00[.123]`, no zone), as the instant it is, in ISO; any other spelling
 * as it came.
 */
export function momentOf(value: unknown, serverZone: string): unknown {
  if (typeof value !== "string") return value;
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,6}))?)?$/.exec(value);
  if (m === null) return value;
  const [y, mo, d, h, mi, s = "0", frac = "0"] = m.slice(1).map((part) => part ?? "0") as string[];
  const wall = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s), Number(frac.padEnd(3, "0").slice(0, 3)));
  const first = wall - zoneOffsetMs(serverZone, wall);
  const instant = wall - zoneOffsetMs(serverZone, first);
  return new Date(instant).toISOString();
}
