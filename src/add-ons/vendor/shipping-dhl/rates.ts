/*
 * VENDORED from add-ons/packages/shipping-dhl/src/rates.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `shipping-dhl`; its manifest, tests and README live in the monorepo.
 */
/**
 * What a collection costs and when it lands — the pure half of both transports.
 *
 * The demo transport prices with this. The real transport does NOT: rates come
 * back from the carrier, because a carrier's own rate card is the only rate
 * card that is true. What the two share is the SHAPE and the ordering rules
 * below, so a rate row rendered from the demo and a rate row rendered from the
 * wire are the same row.
 *
 * Service names are descriptions, not product marks: "Express by 12:00" says
 * what the customer gets. Naming a carrier's trademarked product would be a
 * brand use beyond the nominative one D12 allows.
 */

import { addWorkingDays, workingDaysBetween, type Clock } from "./clock.ts";

export interface Service {
  code: string;
  /** i18n key under `addon.shipping-dhl.service.*` for the display name. */
  nameKey: string;
  /** English fallback, and what the wire adapter matches a carrier product to. */
  name: string;
  /** Cents before the per-kilogram part. */
  baseCents: number;
  centsPerKg: number;
  /** Working days from collection to delivery. */
  transitDays: number;
}

/**
 * Three services, cheapest last so `SERVICES[0]` is never accidentally "the
 * cheapest" — the cheapest is computed, and the UI marks it, because on a heavy
 * parcel to a far zone the ordering does change.
 */
export const SERVICES: readonly Service[] = [
  {
    code: "EXP-1200",
    nameKey: "addon.shipping-dhl.service.exp1200",
    name: "Express by 12:00",
    baseCents: 1290,
    centsPerKg: 240,
    transitDays: 1,
  },
  {
    code: "EXP-NWD",
    nameKey: "addon.shipping-dhl.service.expNwd",
    name: "Express, next working day",
    baseCents: 780,
    centsPerKg: 145,
    transitDays: 1,
  },
  {
    code: "ECO-2WD",
    nameKey: "addon.shipping-dhl.service.eco2wd",
    name: "Economy, second working day",
    baseCents: 450,
    centsPerKg: 85,
    transitDays: 2,
  },
];

export const SERVICE_BY_CODE: Readonly<Record<string, Service>> = Object.fromEntries(
  SERVICES.map((s) => [s.code, s]),
);

export type Zone = "domestic" | "near" | "far";

/**
 * Zone is a property of the ROUTE, not of the destination alone — the same
 * postcode is domestic from one works and far from another, which is why both
 * countries go in.
 */
const NEAR_COUNTRIES = new Set(["IE", "FR", "DE", "NL", "BE", "DK", "CZ", "ES", "IT", "PL"]);

export function zoneFor(fromCountry: string, toCountry: string): Zone {
  const from = fromCountry.trim().toUpperCase();
  const to = toCountry.trim().toUpperCase();
  if (from === to) return "domestic";
  return NEAR_COUNTRIES.has(to) ? "near" : "far";
}

const ZONE_MULTIPLIER: Readonly<Record<Zone, number>> = {
  domestic: 1,
  near: 1.35,
  far: 1.8,
};

/**
 * Chargeable weight: the greater of what it weighs and what it takes up.
 *
 * Volumetric weight is the carrier's oldest rule and the one that surprises a
 * print works most — a light box of flyers in a big carton is charged on the
 * carton. The 5000 divisor is the long-standing air-freight convention.
 */
export function chargeableKg(parcel: {
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}): number {
  const volumetric = (parcel.lengthCm * parcel.widthCm * parcel.heightCm) / 5000;
  const chargeable = Math.max(parcel.weightKg, volumetric);
  // Carriers round up to the next half kilo; so does this, so a 2.41kg parcel
  // and a 2.5kg parcel cost the same and the works can stop shaving grams.
  return Math.ceil(chargeable * 2) / 2;
}

/** Whole cents, always. Money is integers until the edge formats it. */
export function priceCents(service: Service, kgCharged: number, zone: Zone): number {
  const raw = (service.baseCents + service.centsPerKg * kgCharged) * ZONE_MULTIPLIER[zone];
  return Math.round(raw);
}

/** The ISO date the carrier commits to for a service collected on `collected`. */
export function deliveryDate(collected: string, service: Service): string {
  return addWorkingDays(collected, service.transitDays);
}

export interface QuotedRate {
  code: string;
  service: string;
  /** Major units, two decimals — the contract's `Rate.amount`. */
  amount: number;
  currency: string;
  estimatedDelivery: string;
}

/**
 * Every service, priced. Ordered cheapest first, which is the order the works
 * reads them in and the only ordering that makes "cheapest" a fact about the
 * list rather than a label someone stuck on a row.
 */
export function quoteAll(opts: {
  parcel: { weightKg: number; lengthCm: number; widthCm: number; heightCm: number };
  zone: Zone;
  collected: string;
  currency: string;
}): QuotedRate[] {
  const kgCharged = chargeableKg(opts.parcel);
  return SERVICES.map((service) => ({
    code: service.code,
    service: service.name,
    amount: priceCents(service, kgCharged, opts.zone) / 100,
    currency: opts.currency,
    estimatedDelivery: deliveryDate(opts.collected, service),
  })).sort((a, b) => a.amount - b.amount || a.code.localeCompare(b.code));
}

/**
 * PUSH A QUOTED LIST BACK TO THE DAY THE SHOP CAN ACTUALLY POST.
 *
 * A rate arrives quoted from the day the CARRIER could collect. When the shop
 * has to make the thing first, the parcel is not going that day, and every
 * arrival date on the list is that many working days out. Shifting the dates
 * rather than re-quoting is deliberate and it is what makes this work in
 * connected mode too: the transit time stays the carrier's — it is the one
 * thing only the carrier knows — and the only thing changed is the day the
 * clock starts.
 *
 * The price is untouched. Posting a parcel on Monday instead of Thursday costs
 * what the carrier says it costs; inventing a different figure here would be
 * this add-on quoting a rate card it does not have.
 */
export function postponedTo(
  rates: readonly QuotedRate[],
  collected: string,
  dispatched: string,
): QuotedRate[] {
  const days = workingDaysBetween(collected, dispatched);
  if (days === 0) return [...rates];
  return rates.map((rate) => ({
    ...rate,
    estimatedDelivery: addWorkingDays(rate.estimatedDelivery, days),
  }));
}

/** The cheapest rate's code, for the chip the UI puts on exactly one row. */
export function cheapestCode(rates: readonly QuotedRate[]): string | null {
  if (rates.length === 0) return null;
  return rates.reduce((a, b) => (b.amount < a.amount ? b : a)).code;
}

/**
 * The window the van calls in. Fixed at the afternoon round rather than derived
 * from the cut-off: the cut-off says whether you make TODAY's van, not when it
 * turns up.
 */
export const COLLECTION_WINDOW = { from: "14:00", to: "17:00" } as const;

/** Re-exported so callers building a quote do not also import `clock.ts`. */
export type { Clock };
