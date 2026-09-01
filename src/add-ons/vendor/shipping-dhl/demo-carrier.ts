/*
 * VENDORED from add-ons/packages/shipping-dhl/src/demo-carrier.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `shipping-dhl`; its manifest, tests and README live in the monorepo.
 */
/**
 * The demo transport — the DEFAULT one (24 D11).
 *
 * A live demo that posts to a real carrier on every visitor click is a defect,
 * not a feature, so this repo ships a carrier that books nothing. Everything it
 * returns is a pure function of the pinned clock, the parcel and a seeded
 * counter: no `fetch`, no `Date.now()`, no `Math.random()`, no randomness of
 * any kind anywhere in the module.
 *
 * It is a full `ShippingCarrier`, not a stub, and it runs the SAME conformance
 * suite as the real transport (`demo-carrier.test.ts`). That is what makes the
 * demo device honest: what a reviewer watches on the dispatch screen is the
 * contract behaving, not a screen pretending.
 *
 * ONE SEEDED DESTINATION IS REFUSED, and it is refused by a rule rather than by
 * a flag: the carrier checks the postcode against the destination country's
 * format, and the seed contains one address where those disagree. Fixing the
 * postcode in the dispatch screen therefore makes the retry genuinely work,
 * which a hard-coded "this address always fails" could never do.
 */

import { collectionDay, isoDateTime, type Clock } from "./clock.ts";
import {
  CarrierError,
  type Address,
  type FileRef,
  type OrderRef,
  type Parcel,
  type Rate,
  type Shipment,
  type ShippingCarrier,
  type TrackEvent,
} from "../host/contracts/index.ts";
import { labelFilename, renderLabelPdf } from "./label.ts";
import type { LabelStore } from "./label-store.ts";
import { COLLECTION_WINDOW, quoteAll, zoneFor } from "./rates.ts";
import { CURRENCY, DEMO_ORIGIN, TRACKING_SEED } from "./seed.ts";

/**
 * Postcode shapes, by country.
 *
 * Deliberately short: a carrier's real validator knows every country and this
 * one knows three, which is all the seed needs. An unlisted country accepts any
 * non-empty postcode — refusing what it cannot check would be a worse lie than
 * accepting it — and the real transport does not do this check at all, because
 * the carrier does it and its answer is the only one that counts.
 */
const POSTCODE_FORMAT: Readonly<Record<string, RegExp>> = {
  GB: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/,
  IE: /^[A-Z]\d{2}\s?[A-Z0-9]{4}$/,
  US: /^\d{5}(-\d{4})?$/,
};

/** The carrier's own words, quoted verbatim in the UI and never paraphrased. */
export const POSTCODE_REFUSAL = "Postcode not recognised for the destination country";

/**
 * The same refusal at the other end of the route (31 O4). A label must carry a
 * resolvable address at BOTH ends, so an address this carrier would refuse as a
 * recipient it refuses as a sender — which is what makes a return flow's
 * "fix the postcode and retry" demo a real rule rather than a flag.
 */
export const SENDER_POSTCODE_REFUSAL = "Postcode not recognised for the sender's country";

export function postcodeFits(postcode: string, country: string): boolean {
  const normalised = postcode.trim().toUpperCase();
  if (normalised.length === 0) return false;
  const format = POSTCODE_FORMAT[country.trim().toUpperCase()];
  return format === undefined ? true : format.test(normalised);
}

export interface DemoCarrierOptions {
  clock: Clock;
  /** `HH:MM`. Miss it and the van comes the next working day. */
  cutoff: string;
  from?: Address;
  currency?: string;
}

/**
 * A demo transport is a `ShippingCarrier` plus two things the contract has no
 * business carrying (see `label-store.ts`): the bytes of the labels it made, and
 * a memory of where each order was quoted to.
 *
 * `book(rate, order)` takes no address — the contract books a rate, not a
 * destination — because a real carrier holds the address against the rate id it
 * issued. The demo has no server to hold it in, so the client half tells it.
 */
export type DemoCarrier = ShippingCarrier & {
  readonly labels: LabelStore;
  /** Called by the client half between quoting and booking. */
  rememberRoute(reference: string, from: Address, to: Address): void;
  /**
   * What the host's `shipments` table would answer. The customer's order view
   * asks "has this order gone out with a carrier?", which is a question about
   * the shop's records rather than about the carrier — so a connected build
   * answers it from the database and never calls out at all.
   */
  find(reference: string): Shipment | undefined;
};

/** `3400123456789012` → `00 3400 1234 5678 9012`. */
function formatTracking(serial: number): string {
  const digits = String(serial).padStart(16, "0");
  return `00 ${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)} ${digits.slice(12)}`;
}

interface Booked {
  shipment: Shipment;
  /** Where it was collected FROM — the shop's own address, per booking. */
  from: Address;
  to: Address;
  order: OrderRef;
  collected: string;
}

/**
 * Three events at fixed times of day.
 *
 * The `status` codes are stable and the UI translates them; the descriptions
 * are the carrier's own English, which is what the UI falls back to for a
 * status it does not recognise — the same two-source arrangement a real
 * carrier's tracking feed forces on you.
 */
function eventsFor(record: Booked): TrackEvent[] {
  return [
    {
      at: isoDateTime(record.collected, "14:32"),
      // WHERE IT WAS ACTUALLY COLLECTED FROM, per booking. This read the town
      // the transport happened to be CONSTRUCTED with, which is one shop's
      // address — so every scan line in a second shop named the first one's
      // town. The shop's own origin travels with the booking now.
      place: record.from.city,
      status: "collected",
      description: "Shipment picked up",
    },
    {
      at: isoDateTime(record.collected, "20:14"),
      // A depot on the route rather than a place name out of one app's
      // fiction: "Kingsbridge depot" was the print works' own county.
      place: `${record.from.city} depot`,
      status: "at-hub",
      description: "Processed at the sorting depot",
    },
    {
      at: isoDateTime(record.shipment.rate.estimatedDelivery, "08:05"),
      place: record.to.city,
      status: "out-for-delivery",
      description: "With the delivery driver",
    },
  ];
}

export function createDemoCarrier(options: DemoCarrierOptions): DemoCarrier {
  const from = options.from ?? DEMO_ORIGIN;
  const currency = options.currency ?? CURRENCY;

  // The counter, the bookings and the label bytes are the transport's whole
  // state, and it is per-instance: two demos in one page cannot mint the same
  // reference, and a test gets a clean carrier by constructing one.
  let minted = 0;
  const byOrder = new Map<string, Booked>();
  const byShipment = new Map<string, Booked>();
  const byTracking = new Map<string, Booked>();
  const labelBytes = new Map<string, string>();
  const quotedTo = new Map<string, Address>();
  const quotedFrom = new Map<string, Address>();

  function refuseUnknownAddress(address: Address, message: string): void {
    if (postcodeFits(address.postcode, address.country)) return;
    throw new CarrierError({
      code: "POSTCODE_NOT_FOUND",
      carrierMessage: message,
      // Retryable means the works can act and try again — fix the postcode —
      // not that repeating the identical call might come out differently.
      retryable: true,
    });
  }

  const collected = (): string => collectionDay(options.clock, options.cutoff);

  return {
    key: "shipping-dhl",

    async quote(parcel: Parcel, origin: Address, to: Address): Promise<Rate[]> {
      // Both ends, sender first (31 O4): a route is unserviceable whichever end
      // the unresolvable address sits at, and the message says which one it is.
      refuseUnknownAddress(origin, SENDER_POSTCODE_REFUSAL);
      refuseUnknownAddress(to, POSTCODE_REFUSAL);
      return quoteAll({
        parcel,
        zone: zoneFor(origin.country, to.country),
        collected: collected(),
        currency,
      });
    },

    async book(rate: Rate, order: OrderRef): Promise<Shipment> {
      const existing = byOrder.get(order.reference);
      // Idempotent for one OrderRef: a shop that double-clicks Book must not
      // end up with two collections and two labels for one job.
      if (existing !== undefined) return existing.shipment;

      const day = collected();
      const tracking = formatTracking(TRACKING_SEED + minted);
      minted += 1;
      const id = `dhl-shp-${order.reference}`;
      const fileId = `dhl-label-${order.reference}`;

      const shipment: Shipment = {
        id,
        tracking,
        labelFileId: fileId,
        collectionFrom: isoDateTime(day, COLLECTION_WINDOW.from),
        collectionTo: isoDateTime(day, COLLECTION_WINDOW.to),
        rate,
      };

      const to = quotedTo.get(order.reference) ?? from;
      const record: Booked = {
        shipment,
        from: quotedFrom.get(order.reference) ?? from,
        to,
        order,
        collected: day,
      };
      byOrder.set(order.reference, record);
      byShipment.set(id, record);
      byTracking.set(tracking, record);

      labelBytes.set(
        fileId,
        renderLabelPdf({
          tracking,
          service: rate.service,
          reference: order.reference,
          collection: `${day} ${COLLECTION_WINDOW.from}-${COLLECTION_WINDOW.to}`,
          delivery: rate.estimatedDelivery,
          to,
          // THE QUOTED ROUTE'S SENDER, not the address this transport was
          // constructed with. `eventsFor` had this exact repair (see its
          // comment) and the label escaped it: for an outbound booking the two
          // are the same shop address, so nothing ever looked wrong — and for
          // an inbound RETURN (31 O4) the constructed address is the wrong end
          // of the route entirely, printing the depot as its own sender.
          from: record.from,
        }),
      );

      return shipment;
    },

    async track(tracking: string): Promise<TrackEvent[]> {
      const record = byTracking.get(tracking);
      // An unknown reference is an empty list, never an exception: a works
      // pasting a reference out of an email wants "nothing yet", not a crash.
      if (record === undefined) return [];
      return eventsFor(record);
    },

    async label(shipmentId: string): Promise<FileRef> {
      const record = byShipment.get(shipmentId);
      if (record === undefined) {
        throw new CarrierError({
          code: "SHIPMENT_NOT_FOUND",
          carrierMessage: "No shipment with that reference",
          retryable: false,
        });
      }
      const bytes = labelBytes.get(record.shipment.labelFileId) ?? "";
      return {
        fileId: record.shipment.labelFileId,
        filename: labelFilename(record.shipment.tracking),
        mediaType: "application/pdf",
        bytes: bytes.length,
      };
    },

    async cancel(shipmentId: string): Promise<void> {
      const record = byShipment.get(shipmentId);
      // Cancelling something already gone is a success, not an error: the works
      // wants the collection not to happen, and it is not happening.
      if (record === undefined) return;
      byShipment.delete(shipmentId);
      byOrder.delete(record.order.reference);
      byTracking.delete(record.shipment.tracking);
      labelBytes.delete(record.shipment.labelFileId);
    },

    labels: {
      read: (fileId) => labelBytes.get(fileId),
    },

    rememberRoute(reference, from, to) {
      quotedFrom.set(reference, from);
      quotedTo.set(reference, to);
    },

    find: (reference) => byOrder.get(reference)?.shipment,
  };
}
