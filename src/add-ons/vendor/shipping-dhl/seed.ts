/*
 * VENDORED from add-on-shipping-dhl/src/seed.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the add-on repo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `shipping-dhl`; its manifest, tests and README live in that repo.
 */
/**
 * Seed data for the demo: the works' own address, the customers it posts to,
 * and the two dispatch-ready jobs the comp shows.
 *
 * Both jobs are real jobs from the print shop's own board (`MP-4125`,
 * `MP-4126`) so the add-on's dispatch screen and the works board are talking
 * about the same work. One books cleanly. The other is going to an address
 * whose postcode does not fit its country, so the carrier refuses it — the
 * failure path is seeded rather than staged, and fixing the postcode in the
 * dispatch screen makes the retry genuinely succeed.
 */

import type { Address } from "./contracts.ts";
import type { HostJob } from "./host.ts";

/** Where the van collects from. */
export const WORKS_ADDRESS: Address = {
  name: "Marlow Press",
  lines: ["Unit 3, The Old Maltings", "Bridge Street"],
  city: "Marlow",
  postcode: "ML7 2QF",
  country: "GB",
};

/** The display currency the host quotes in; the carrier bills in the same one. */
export const CURRENCY = "USD";

/**
 * The address book, keyed by the host's customer key.
 *
 * Every customer the print shop seeds is in here, because a works can move any
 * job to *ready* and then dispatch it — an address book that covered only the
 * two jobs the comp shows would leave the other five looking like a defect.
 *
 * `tworivers` is the seeded refusal: the shop is sending to the customer's new
 * branch across the water and typed the old postcode, which is a GB one. The
 * carrier's own postcode check is what rejects it (`demo-carrier.ts`), so this
 * is one wrong field rather than a flag that says "fail here".
 */
export const DESTINATIONS: Readonly<Record<string, Address>> = {
  kestrel: {
    name: "Kestrel Joinery",
    lines: ["The Joinery Shop", "Wold Lane"],
    city: "Nether Wold",
    postcode: "NW3 6BD",
    country: "GB",
  },
  tworivers: {
    name: "Two Rivers Cycles",
    lines: ["Unit 4, Canal Wharf"],
    city: "Dún Laoghaire",
    postcode: "ML9 4TT",
    country: "IE",
  },
  harbour: {
    name: "Harbour Bakery",
    lines: ["12 Quay Street"],
    city: "Marlow",
    postcode: "ML7 1AA",
    country: "GB",
  },
  fenwick: {
    name: "Fenwick & Sons",
    lines: ["Fenwick Yard", "Bell Street"],
    city: "Marlow",
    postcode: "ML7 3RH",
    country: "GB",
  },
  bramble: {
    name: "Bramble Yoga",
    lines: ["The Old Chapel", "Wold Lane"],
    city: "Nether Wold",
    postcode: "NW3 5QP",
    country: "GB",
  },
  ostara: {
    name: "Ostara Flowers",
    lines: ["7 Fore Street"],
    city: "Kingsbridge",
    postcode: "KB2 8LN",
    country: "GB",
  },
  gallery: {
    name: "The Little Gallery",
    lines: ["2a Market Square"],
    city: "Marlow",
    postcode: "ML7 1DE",
    country: "GB",
  },
};

/** What a postcode for that country should look like once it is right. */
export const POSTCODE_HINT: Readonly<Record<string, string>> = {
  GB: "ML7 2QF",
  IE: "A96 X4T2",
  US: "94105",
};

/**
 * The two jobs on the board that are ready to go.
 *
 * The host passes the real job in through the slot; these stand in when the
 * add-on is driven on its own — the dispatch screen's "other jobs ready to go"
 * rail, and every test in this repo.
 */
export const DISPATCH_READY: readonly HostJob[] = [
  {
    ref: "MP-4126",
    productKey: "business-cards",
    materialKey: "silk-350",
    customer: "kestrel",
    quantity: 500,
    trimWidthMm: 85,
    trimHeightMm: 55,
    packagingKey: "boxed",
    stage: "ready",
    promisedFor: "2026-08-05",
  },
  {
    ref: "MP-4125",
    productKey: "flyers",
    materialKey: "silk-130",
    customer: "tworivers",
    quantity: 1000,
    trimWidthMm: 148,
    trimHeightMm: 210,
    packagingKey: "boxed",
    stage: "ready",
    promisedFor: "2026-08-05",
  },
];

/**
 * The answer to "where is this parcel going?", and it is allowed to be "I do
 * not know".
 *
 * THERE IS NO FALLBACK ADDRESS, and its absence is the whole point of this
 * type. `destinationFor()` used to end in `?? DESTINATIONS.harbour` — one
 * unlucky lookup and a dispatch screen quietly pre-filled a DIFFERENT
 * customer's street, city and postcode, which the works would then have printed
 * onto a label. A wrong address on a dispatch screen is the worst possible
 * silent default: nothing on the screen said it was a guess, so nothing could
 * catch it. An unresolved customer is now a state the works can see and fix.
 */
export type Destination =
  | { readonly status: "resolved"; readonly address: Address; readonly matchedOn: "key" | "name" }
  | { readonly status: "unresolved"; readonly customer: string };

/** Trim and case-fold, so "Fenwick & Sons " and "fenwick & sons" are one name. */
function normalise(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

const BY_NAME: ReadonlyMap<string, Address> = new Map(
  Object.values(DESTINATIONS).map((address) => [normalise(address.name), address]),
);

/**
 * Resolve a host job to a destination, by key first and by name second.
 *
 * TWO WAYS IN, ON PURPOSE. `customerKey` is the explicit contract and the one a
 * host should pass: keys are stable, names are display text that a shop can
 * edit. But the print shop resolves its own customer keys to names before it
 * hands the job over — `Job.customer` is a display name there — so matching on
 * the name as well is what makes the contract work with the host as it actually
 * is, rather than as `host.ts` once described it. Both are checked; neither
 * invents an address when both miss.
 */
export function resolveDestination(job: {
  customer: string;
  customerKey?: string;
}): Destination {
  const byKey = job.customerKey === undefined ? undefined : DESTINATIONS[job.customerKey];
  if (byKey !== undefined) return { status: "resolved", address: byKey, matchedOn: "key" };

  // The host may still be passing the key in `customer`; that is a key match,
  // not a name match, and it is worth keeping the two apart in the result.
  const asKey = DESTINATIONS[job.customer];
  if (asKey !== undefined) return { status: "resolved", address: asKey, matchedOn: "key" };

  const byName = BY_NAME.get(normalise(job.customer));
  if (byName !== undefined) return { status: "resolved", address: byName, matchedOn: "name" };

  return { status: "unresolved", customer: job.customer };
}

/**
 * The empty form an unresolved customer gets, with the customer's own name on
 * it and nothing else filled in.
 *
 * The country is the works' own — the overwhelming case, and a country is not
 * an address. Every field that could put a parcel through the wrong door is
 * blank, which is what makes the missing address visible rather than plausible.
 */
export function blankAddress(customer: string): Address {
  return {
    name: customer,
    lines: [""],
    city: "",
    postcode: "",
    country: WORKS_ADDRESS.country,
  };
}

/** Enough of an address to quote against: somewhere to go, and a postcode. */
export function addressIsUsable(address: Address): boolean {
  return address.city.trim() !== "" && address.postcode.trim() !== "";
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
