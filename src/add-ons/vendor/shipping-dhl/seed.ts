/*
 * VENDORED from add-ons/packages/shipping-dhl/src/seed.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `shipping-dhl`; its manifest, tests and README live in the monorepo.
 */
/**
 * WHAT THIS ADD-ON SEEDS, now that it has stopped seeding somebody else's shop.
 *
 * ── WHAT WAS HERE, AND WHY IT COULD NOT TRAVEL ──────────────────────────────
 *
 * An address book keyed by ONE print works' customer keys (`kestrel`,
 * `tworivers`, `harbour` …), that works' own street address as the collection
 * point, and two of its job references — `MP-4126`, `MP-4125` — as the jobs
 * "ready to go". Every one of those is a fact about a host, held by an add-on.
 * Mounted in a second shop the whole file missed: no customer resolved, the
 * collection address was another town's print works, and the seeded jobs named
 * references that shop has never issued. The add-on could not demo there even
 * with the payload shapes fixed.
 *
 * ── WHERE THOSE FACTS LIVE NOW ──────────────────────────────────────────────
 *
 * With the host. A shop knows where it posts FROM — it is on its own paperwork
 * — and it knows where its customer lives, so `OutboundOrder` carries `origin`
 * and `destination` and this file carries neither. `resolveDestination()` is
 * now a two-line reading of the payload rather than a lookup, and it keeps the
 * property the lookup was rewritten to guarantee: WHEN THE HOST HAS NOT SAID
 * WHERE A PARCEL IS GOING, THE ANSWER IS "I DO NOT KNOW" AND THE WORKS IS SHOWN
 * AN EMPTY FORM. Never a fallback address, never another customer's street.
 *
 * What is left is seeded BY SHAPE: a country's postcode pattern, the transport's
 * own tracking counter, and one sample order used only to drive this repo's own
 * suites and its standalone harness. The sample names no host's references and
 * no host's customers.
 */

import type { OutboundOrder, PostalAddress, SlotItem } from "../host/index.ts";
import type { Address } from "../host/contracts/index.ts";

/** The display currency the demo transport quotes in. */
export const CURRENCY = "USD";

/**
 * What a postcode for that country should look like once it is right.
 *
 * Keyed by country code, which is a fact about the world rather than about a
 * host, so it stays here. The refusal path the demo carrier seeds is a postcode
 * that does not fit its country's shape — the shop typed the old branch's
 * postcode after the customer moved — and this is what the remedy line quotes
 * back as an example.
 */
export const POSTCODE_HINT: Readonly<Record<string, string>> = {
  GB: "ML7 2QF",
  IE: "A96 X4T2",
  US: "94105",
};

/**
 * The address the demo TRANSPORT falls back to when a caller constructs it
 * without one.
 *
 * Not a shop's address and not rendered as one: every screen passes
 * `order.origin`, which the host supplies. This exists so `createDemoCarrier()`
 * has a defined `from` in a test that does not care about the route.
 *
 * IT SAID `Marlow` UNTIL WAVE 4B ROUND 3, and "not rendered as one" turned out
 * to be a hope rather than a fact: `runtime.ts` discarded the host's origin
 * whenever the demo switch was off, this fallback took its place, and the maker
 * studio's tracking scans read "Picked up from the shop · Marlow" — the FIRST
 * host's town, on the second host's screen. The condition is repaired there,
 * and the town is gone from here as well, because a fallback that names a real
 * demo shop is a fallback that reads as correct on the day it should not have
 * been reached. Every field now says "nowhere in particular" out loud: if this
 * address ever appears on a page again, the page says so itself.
 */
export const DEMO_ORIGIN: Address = {
  name: "Demo collection point",
  lines: ["Depot road"],
  city: "Demo depot",
  postcode: "ML7 2QF",
  country: "GB",
};

/**
 * ONE SAMPLE ORDER, SEEDED BY SHAPE.
 *
 * It exists for this repo's own suites and for driving the add-on with no host
 * beside it. Everything about it is generic on purpose: the reference is this
 * add-on's own `SAMPLE-1` rather than a borrowed `MP-4126`, the customer is
 * plainly a stand-in, and the single line carries a weight and a size because
 * that is what the parcel engine reads. Nothing in the shipped UI imports it.
 */
export const SAMPLE_ITEM: SlotItem = {
  id: "sample-1",
  key: "sample",
  label: "Sample goods",
  quantity: 500,
  unitWeightGrams: 2.4,
  unitSize: { widthMm: 85, heightMm: 55 },
};

export const SAMPLE_ORDER: OutboundOrder = {
  ref: "SAMPLE-1",
  recipient: { name: "Sample recipient", key: "sample" },
  items: [SAMPLE_ITEM],
  origin: DEMO_ORIGIN,
  destination: {
    name: "Sample recipient",
    lines: ["1 Sample Street"],
    city: "Nether Wold",
    postcode: "NW3 6BD",
    country: "GB",
  },
  promisedFor: "2026-08-05",
};

/**
 * The answer to "where is this parcel going?", and it is allowed to be "I do
 * not know".
 *
 * THERE IS NO FALLBACK ADDRESS, and its absence is the whole point of this
 * type. An earlier version ended in `?? DESTINATIONS.harbour` — one unlucky
 * lookup and a dispatch screen quietly pre-filled a DIFFERENT customer's
 * street, city and postcode, which the works would then have printed onto a
 * label. A wrong address on a dispatch screen is the worst possible silent
 * default: nothing on the screen said it was a guess, so nothing could catch
 * it. An unresolved destination is a state the works can SEE and fix.
 */
export type Destination =
  | { readonly status: "resolved"; readonly address: Address }
  | { readonly status: "unresolved"; readonly customer: string };

/** A host address as the carrier contract wants it. The shapes agree; the arrays do not. */
function asCarrierAddress(address: PostalAddress): Address {
  return {
    name: address.name,
    lines: [...address.lines],
    city: address.city,
    postcode: address.postcode,
    country: address.country,
  };
}

/**
 * Read the destination the host supplied, or say that it did not.
 *
 * A LOOKUP USED TO LIVE HERE and it was the wrong shape of solution however
 * carefully it was written: an add-on matching a customer against its own
 * address book is an add-on that has an opinion about who the shop's customers
 * are. The shop knows. What survives is the refusal to invent — a host that
 * passes no address gets the loud empty form, in every shop, for every
 * customer, rather than in whichever shop the book happened not to cover.
 */
export function resolveDestination(order: {
  recipient: { name: string };
  destination?: PostalAddress;
}): Destination {
  const address = order.destination;
  if (address === undefined || address.city.trim() === "") {
    return { status: "unresolved", customer: order.recipient.name };
  }
  return { status: "resolved", address: asCarrierAddress(address) };
}

/** The collection address, as the carrier contract wants it. */
export function originOf(order: { origin: PostalAddress }): Address {
  return asCarrierAddress(order.origin);
}

/**
 * The empty form an unresolved destination gets, with the customer's own name
 * on it and nothing else filled in.
 *
 * The country is the one the shop collects FROM — the overwhelming case, and a
 * country is not an address. Every field that could put a parcel through the
 * wrong door is blank, which is what makes the missing address visible rather
 * than plausible.
 */
export function blankAddress(customer: string, fromCountry: string): Address {
  return { name: customer, lines: [""], city: "", postcode: "", country: fromCountry };
}

/** Enough of an address to quote against: somewhere to go, and a postcode. */
export function addressIsUsable(address: Address): boolean {
  return address.city.trim() !== "" && address.postcode.trim() !== "";
}

/**
 * A stand-in destination in the shop's OWN country, for a surface that has to
 * quote before anyone has typed an address — a basket at the till.
 *
 * It is not presented as the customer's address anywhere; it exists so the
 * zone the rate is priced in is the honest one (domestic) rather than a guess
 * at another country. The checkout copy says the estimate is domestic.
 */
export function domesticStandIn(origin: Address): Address {
  return { ...origin, name: "", lines: [] };
}

/**
 * The first tracking reference the seeded counter mints.
 *
 * Held here rather than in the transport because it is seed data the comp
 * shows on three screens, and a test that asserts it should read the same
 * constant the demo does.
 */
export const FIRST_TRACKING = "00 3400 1234 5678 9012";

/** The numeric part the counter increments — `00` is a constant prefix. */
export const TRACKING_SEED = 3_400_123_456_789_012;
