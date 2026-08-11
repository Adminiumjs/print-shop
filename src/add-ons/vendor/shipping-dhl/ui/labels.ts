/*
 * VENDORED from add-ons/packages/shipping-dhl/src/ui/labels.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `shipping-dhl`; its manifest, tests and README live in the monorepo.
 */
/**
 * Data keys → message keys.
 *
 * The transports speak in codes — `boxed`, `ECO-2WD`, `at-hub` — because a code
 * is what survives a round trip through a carrier and a database. The screens
 * speak in the reader's language. This module is the only place the two meet,
 * so adding a service or a packaging kind is one entry here rather than a
 * `switch` in three components.
 *
 * Every branch falls back rather than throwing: a code the add-on has never
 * seen is still a shipment the works has to get out of the door.
 */

import type { StringKey } from "../i18n/strings.ts";
import type { TFunction } from "../i18n/t.ts";
import type { TrackEvent } from "../../host/contracts/index.ts";

/**
 * WHAT IS IN THE BOX, in one line, for the carrier's contents field.
 *
 * A TABLE OF PACKAGING KEYS USED TO LIVE HERE — `bundled`, `shrink-wrapped`,
 * `boxed` — mapped to words. Those were one print works' own keys, so in any
 * other shop every lookup missed and every parcel was described as "boxed".
 * The host already translates what it sells, so the contents line is built from
 * the labels it sent: no vocabulary of the shop's is guessed at, and a shop
 * that sells something this add-on has never heard of describes itself
 * correctly on the first try.
 */
export function contentsLine(
  t: TFunction,
  estimate: { from: { quantity: number; lines: number; label: string } },
): string {
  const { quantity, lines, label } = estimate.from;
  if (lines <= 1) {
    return t("addon.shipping-dhl.parcel.contentsValue", { quantity, what: label });
  }
  return t("addon.shipping-dhl.parcel.contentsValueMore", {
    quantity,
    what: label,
    more: lines - 1,
  });
}

/**
 * A service's message key, and the hour it promises where it names one.
 *
 * THE HOUR IS DATA HERE BECAUSE IT WAS PROSE IN EIGHT BUNDLES. "Express by
 * 12:00" was written out per language, digits included, and the Arabic one read
 * "سريع، قبل 12:00" — a Latin clock face inside an Arabic sentence, beside
 * Arabic-Indic prices, with no number anywhere for a formatter to reach. A time
 * a service promises is a FIGURE, so it lives here and the sentence takes a
 * placeholder.
 */
const SERVICE: Readonly<Record<string, { key: StringKey; by?: readonly [number, number] }>> = {
  "EXP-1200": { key: "addon.shipping-dhl.service.exp1200", by: [12, 0] },
  "EXP-NWD": { key: "addon.shipping-dhl.service.expNwd" },
  "ECO-2WD": { key: "addon.shipping-dhl.service.eco2wd" },
};

/**
 * A service's display name.
 *
 * The three seeded codes translate. Anything else — and a real carrier's rate
 * list is full of products this add-on has never heard of — falls back to the
 * name the carrier itself returned, which is at least true even when it is only
 * available in one language.
 *
 * `clock` is the reader's own clock face, from `useFormat`. It is a parameter
 * rather than a lookup because this module is pure and knows no locale, and
 * because every caller already holds one.
 */
export function serviceName(
  t: TFunction,
  rate: { code: string; service: string },
  clock: (hour: number, minute: number) => string,
): string {
  const entry = SERVICE[rate.code];
  if (entry === undefined) return rate.service;
  return entry.by === undefined
    ? t(entry.key)
    : t(entry.key, { by: clock(entry.by[0], entry.by[1]) });
}

/**
 * A tracking event's words.
 *
 * The carrier sends a stable status code AND its own English sentence. Known
 * codes are translated; anything else falls back to what the carrier actually
 * said, because a status this add-on has not seen before is still information
 * and "unknown event" is not.
 */
export function eventText(t: TFunction, event: TrackEvent): string {
  switch (event.status) {
    case "collected":
      return t("addon.shipping-dhl.event.collected");
    case "at-hub":
      return t("addon.shipping-dhl.event.atHub");
    case "out-for-delivery":
      return t("addon.shipping-dhl.event.outForDelivery");
    default:
      return event.description;
  }
}
