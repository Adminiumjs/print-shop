/*
 * VENDORED from add-on-shipping-dhl/src/ui/labels.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the add-on repo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `shipping-dhl`; its manifest, tests and README live in that repo.
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
import type { TrackEvent } from "../contracts.ts";

const PACKAGING: Readonly<Record<string, StringKey>> = {
  bundled: "addon.shipping-dhl.pack.bundled",
  "shrink-wrapped": "addon.shipping-dhl.pack.shrinkWrapped",
  boxed: "addon.shipping-dhl.pack.boxed",
  tube: "addon.shipping-dhl.pack.tube",
};

export function packagingKeyFor(key: string): StringKey {
  return PACKAGING[key] ?? "addon.shipping-dhl.pack.boxed";
}

const SERVICE: Readonly<Record<string, StringKey>> = {
  "EXP-1200": "addon.shipping-dhl.service.exp1200",
  "EXP-NWD": "addon.shipping-dhl.service.expNwd",
  "ECO-2WD": "addon.shipping-dhl.service.eco2wd",
};

/**
 * A service's display name.
 *
 * The three seeded codes translate. Anything else — and a real carrier's rate
 * list is full of products this add-on has never heard of — falls back to the
 * name the carrier itself returned, which is at least true even when it is only
 * available in one language.
 */
export function serviceName(t: TFunction, rate: { code: string; service: string }): string {
  const key = SERVICE[rate.code];
  return key === undefined ? rate.service : t(key);
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
