/*
 * VENDORED from add-on-shipping-dhl/src/contracts.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the add-on repo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `shipping-dhl`; its manifest, tests and README live in that repo.
 */
/**
 * `shipping-carrier@1` — COPIED from `@adminium/add-on-contracts`
 * (`packages/add-on-contracts/src/{shipping-carrier,common}.ts`), not imported.
 *
 * The same reasoning `tokens.css` and `i18n/locales.ts` carry in the host app:
 * this is a standalone repo published to the Adminiumjs org and the package is
 * not yet on npm. When it is published, delete this file and import the types.
 * Until then: do NOT change a shape here to make local code compile — a
 * divergence between this copy and the package is a broken contract that the
 * conformance suite cannot catch, because the suite is copied from the same
 * place and would move with it.
 *
 * The package's Zod validators are deliberately NOT here. They are the only
 * part of the contract that needs a runtime dependency, they are used only by
 * the conformance suite, and an add-on's shipped bundle may take no runtime
 * dependency the host does not already have (24 D7) — so they live under
 * `src/testing/`, where `zod` is a devDependency and nothing ships.
 */

/** A file the host stores: labels here, production files elsewhere, one seam. */
export interface FileRef {
  fileId: string;
  filename: string;
  mediaType: string;
  bytes: number;
}

export interface Parcel {
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  contents: string;
}

export interface Address {
  name: string;
  lines: string[];
  city: string;
  postcode: string;
  country: string;
}

export interface Rate {
  code: string;
  service: string;
  amount: number;
  currency: string;
  /** ISO date — when the carrier says it arrives. */
  estimatedDelivery: string;
}

export interface OrderRef {
  /** The host's own reference, e.g. `MP-4118`. */
  reference: string;
}

export interface Shipment {
  id: string;
  tracking: string;
  labelFileId: string;
  /** ISO datetime — the collection window the carrier committed to. */
  collectionFrom: string;
  collectionTo: string;
  rate: Rate;
}

export interface TrackEvent {
  at: string;
  place: string;
  status: string;
  description: string;
}

/**
 * A carrier refusal is DATA, never a thrown string: the works needs the
 * carrier's own message verbatim to act on it, and a rejected postcode is an
 * ordinary outcome rather than a crash.
 */
export class CarrierError extends Error {
  readonly code: string;
  /** The carrier's own words, rendered in mono and quoted in the UI. */
  readonly carrierMessage: string;
  readonly retryable: boolean;

  constructor(opts: { code: string; carrierMessage: string; retryable?: boolean }) {
    super(opts.carrierMessage);
    this.name = "CarrierError";
    this.code = opts.code;
    this.carrierMessage = opts.carrierMessage;
    this.retryable = opts.retryable ?? true;
  }
}

export interface ShippingCarrier {
  readonly key: string;
  quote(parcel: Parcel, from: Address, to: Address): Promise<Rate[]>;
  book(rate: Rate, order: OrderRef): Promise<Shipment>;
  /** An unknown reference returns an empty list — it never throws. */
  track(tracking: string): Promise<TrackEvent[]>;
  label(shipmentId: string): Promise<FileRef>;
  cancel(shipmentId: string): Promise<void>;
}

/**
 * Where a label's bytes live.
 *
 * NOT part of `shipping-carrier@1`, and that is the point: the contract returns
 * a `FileRef` because in connected mode the host stores the label through its
 * own file seam and serves it by id. The demo transport has no host to store
 * anything in, so it implements this alongside the contract and the client half
 * reads bytes straight out of it. A real transport leaves this to the host.
 */
export interface LabelStore {
  read(fileId: string): string | undefined;
}
