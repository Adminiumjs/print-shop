/*
 * VENDORED from add-ons/packages/shipping-dhl/src/clock.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `shipping-dhl`; its manifest, tests and README live in the monorepo.
 */
/**
 * The clock, as an argument.
 *
 * Nothing in this repo reads a real one — no `Date.now()`, no `new Date()`
 * without an explicit value (24 D11). Every date the carrier produces is a
 * function of the pinned clock, which is what lets a delivery estimate be
 * asserted in a test and reproduced on the droplet a month later.
 *
 * Dates are handled as ISO `YYYY-MM-DD` strings through UTC midnight. A local
 * `new Date('2026-08-05')` in a browser west of Greenwich is the 4th, and a
 * carrier that ships a parcel a day early depending on where the shop's laptop
 * is standing is not a carrier.
 */

export interface Clock {
  /** ISO date, `YYYY-MM-DD`. */
  iso: string;
  hour: number;
  minute: number;
}

/**
 * Wednesday, 5 August 2026, 10:20 — THIS REPO'S OWN pin, and nobody else's.
 *
 * It used to be commented "the same instant the host app is pinned to", which
 * was true of the one host that existed and false the day a second one mounted
 * the add-on: Birch Row is pinned to Thursday the 6th at 16:40. A dispatch
 * panel then told a maker that today's van was still catchable six hours after
 * the cut-off, dated the collection window to the day before, and stamped a
 * "picked up from the shop" scan before the order had been opened. Nothing
 * threw; it was just the wrong day, in the one place a wrong day is expensive.
 *
 * SO NOTHING THE HOST CAN SEE READS THIS ANY MORE. The clock arrives in the
 * slot payload (`ShopClock`), the fills push it into `runtime.ts` and the demo
 * transport is built against it. What is left here is the fallback for this
 * repo's own suites and its standalone harness, which have no host to ask.
 */
export const PINNED_NOW: Clock = { iso: "2026-08-05", hour: 10, minute: 20 };

const DAY_MS = 86_400_000;

function toUtc(iso: string): number {
  const [y, m, d] = iso.split("-").map((n) => Number.parseInt(n, 10));
  return Date.UTC(y!, m! - 1, d!);
}

function toIso(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** A shop runs Monday to Friday, and so does the carrier's collection round. */
export function isWorkingDay(iso: string): boolean {
  const dow = new Date(toUtc(iso)).getUTCDay();
  return dow !== 0 && dow !== 6;
}

/** The next Mon–Fri strictly after `iso`. */
export function nextWorkingDay(iso: string): string {
  let ms = toUtc(iso) + DAY_MS;
  while (!isWorkingDay(toIso(ms))) ms += DAY_MS;
  return toIso(ms);
}

/** `iso` itself when it is a working day, else the next one. */
export function onOrAfterWorkingDay(iso: string): string {
  return isWorkingDay(iso) ? iso : nextWorkingDay(iso);
}

/** `days` working days after `iso`, counting only Mon–Fri. */
export function addWorkingDays(iso: string, days: number): string {
  let out = iso;
  for (let i = 0; i < days; i += 1) out = nextWorkingDay(out);
  return out;
}

/** Minutes since midnight, for comparing the clock against a `HH:MM` cut-off. */
export function minutesOfDay(clock: Clock): number {
  return clock.hour * 60 + clock.minute;
}

/** `HH:MM` → minutes since midnight. Returns null for anything malformed. */
export function parseTime(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (m === null) return null;
  const hour = Number.parseInt(m[1]!, 10);
  const minute = Number.parseInt(m[2]!, 10);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

/**
 * The day the driver actually comes.
 *
 * Book before the cut-off on a working day and the van calls that afternoon;
 * miss it — or book at the weekend — and it is the next working day. This is
 * the one piece of carrier behaviour the shop can change (the `collection_cutoff`
 * setting), so it takes the cut-off as an argument rather than reading it.
 */
export function collectionDay(clock: Clock, cutoff: string): string {
  const limit = parseTime(cutoff);
  const beforeCutoff = limit !== null && minutesOfDay(clock) < limit;
  if (isWorkingDay(clock.iso) && beforeCutoff) return clock.iso;
  return nextWorkingDay(clock.iso);
}

/**
 * THE DAY THE PARCEL CAN ACTUALLY BE HANDED OVER — the carrier's answer and the
 * shop's answer, whichever is later.
 *
 * `collectionDay` answers only half of it: when the van can come. The other
 * half is whether there is anything to put in it. A studio that cuts a name
 * into a board over four days cannot post today however early it is, and the
 * checkout it sits under says so in its own words two lines up. Without this,
 * the rates quoted transit from TODAY and the same panel read "posted by Mon 10
 * Aug" beside "arrives Fri 7 Aug".
 *
 * `readyOn` is a FLOOR, not an instruction. The carrier's own rules still
 * apply on top — a missed cut-off, a weekend — so a ready date in the past
 * changes nothing and a ready date on a Sunday moves to the Monday. Undefined
 * means "ready now", which is what a shop posting from stock means and what a
 * host that has not thought about it gets.
 */
export function dispatchDay(clock: Clock, cutoff: string, readyOn?: string): string {
  const carrierDay = collectionDay(clock, cutoff);
  if (readyOn === undefined || readyOn === "") return carrierDay;
  const shopDay = onOrAfterWorkingDay(readyOn);
  // ISO dates compare correctly as strings, which is the whole reason every
  // date in this add-on is one.
  return shopDay > carrierDay ? shopDay : carrierDay;
}

/**
 * How many working days lie between two dates — what a delivery estimate has to
 * be pushed by when the parcel is not going today after all.
 *
 * Never negative: a `to` at or before `from` is nothing to postpone by.
 */
export function workingDaysBetween(from: string, to: string): number {
  let count = 0;
  let cursor = from;
  while (cursor < to) {
    cursor = nextWorkingDay(cursor);
    count += 1;
  }
  return count;
}

/** `2026-08-05` + `14:00` → `2026-08-05T14:00:00`, the form the contract wants. */
export function isoDateTime(iso: string, time: string): string {
  return `${iso}T${time}:00`;
}
