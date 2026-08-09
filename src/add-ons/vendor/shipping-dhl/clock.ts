/*
 * VENDORED from add-on-shipping-dhl/src/clock.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the add-on repo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `shipping-dhl`; its manifest, tests and README live in that repo.
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

/** Wednesday, 5 August 2026, 10:20 — the same instant the host app is pinned to. */
export const PINNED_NOW: Clock = { iso: "2026-08-05", hour: 10, minute: 20 };

const DAY_MS = 86_400_000;

function toUtc(iso: string): number {
  const [y, m, d] = iso.split("-").map((n) => Number.parseInt(n, 10));
  return Date.UTC(y!, m! - 1, d!);
}

function toIso(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** The works runs Monday to Friday, and so does the carrier's collection round. */
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

/** `2026-08-05` + `14:00` → `2026-08-05T14:00:00`, the form the contract wants. */
export function isoDateTime(iso: string, time: string): string {
  return `${iso}T${time}:00`;
}
