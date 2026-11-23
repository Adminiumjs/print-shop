/*
 * VENDORED from add-ons/packages/host/src/contracts/shipping-carrier.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The shared contract the add-ons the works mounts are written against.
 */
/**
 * `shipping-carrier@1` — COPIED from `@adminium/add-on-contracts`
 * (`packages/add-on-contracts/src/shipping-carrier.ts`), not imported.
 *
 * The same reasoning `tokens.css` and `i18n/locales.ts` carry in the host app:
 * this repo is published standalone to the Adminiumjs org and the package is
 * not yet on npm. When it is published, delete this file and import the types.
 * Until then: do NOT change a shape here to make local code compile — a
 * divergence between this copy and the package is a broken contract that the
 * conformance suite cannot catch, because the suite is copied from the same
 * place and would move with it.
 *
 * The package's Zod validators are deliberately NOT here. They are the only
 * part of the contract that needs a runtime dependency, they are used only by
 * the conformance suite, and an add-on's shipped bundle may take no runtime
 * dependency the host does not already have — so they live under
 * `../testing/`, where `zod` is a devDependency and nothing ships.
 *
 * `LabelStore` used to sit at the bottom of this file with a note saying it is
 * not part of the contract. It now lives where its one implementation does, in
 * the delivery add-on, which is what "not part of the contract" means.
 */

import type { FileRef } from './common.ts';

/** The name a carrier add-on's server half exports its transport factory under. */
export const SHIPPING_CARRIER_FACTORY = 'createShippingCarrier';

export const SHIPMENT_PURPOSES = ['outbound', 'return', 'replacement'] as const;
export type ShipmentPurpose = (typeof SHIPMENT_PURPOSES)[number];

/** How the parcel really leaves the shop. `unknown` is an honest answer, never a default to a van. */
export const HANDOVER_KINDS = ['collection-booked', 'drop-off', 'carrier-collects', 'unknown'] as const;
export type HandoverKind = (typeof HANDOVER_KINDS)[number];

export const LABEL_SIZES = ['a4', 'a6', '4x6'] as const;
export type LabelSize = (typeof LABEL_SIZES)[number];

export const CUSTOMS_CONTENTS = ['merchandise', 'gift', 'sample', 'documents', 'return', 'other'] as const;
export type CustomsContents = (typeof CUSTOMS_CONTENTS)[number];

export const SHIPMENT_DOCUMENT_KINDS = ['label', 'customs-invoice'] as const;
export type ShipmentDocumentKind = (typeof SHIPMENT_DOCUMENT_KINDS)[number];

/** What a clear refusal was about, so the screen can say what to do next. */
export const CARRIER_REFUSALS = ['address', 'customs', 'payment', 'credentials', 'rate-expired', 'unavailable'] as const;
export type CarrierRefusal = (typeof CARRIER_REFUSALS)[number];

export const CARRIER_OUTCOMES = ['refused', 'unknown'] as const;
export type CarrierOutcome = (typeof CARRIER_OUTCOMES)[number];

/** A cancel on a real carrier is a refund request, and it can take days or be refused. */
export const CANCEL_STATES = ['requested', 'pending', 'refunded', 'refused'] as const;
export type CancelState = (typeof CANCEL_STATES)[number];

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
  /** A state, province or region, where the country has them: printed after the city, never checked. */
  region?: string;
  country: string;
  company?: string;
  /** Plain text. It is normalised by the caller, and sent only when the carrier needs it. */
  phone?: string;
  email?: string;
}

export interface Rate {
  /** The stable service token. It survives a new quote, so a shop's preferred service can match it. */
  code: string;
  service: string;
  amount: number;
  /** The carrier's exact decimal, kept because `amount` is a float. */
  amountDecimal?: string;
  currency: string;
  /** ISO date — when the carrier says it arrives. Absent when it does not say. */
  estimatedDelivery?: string;
  /** The working days the carrier states. Absent when it states none. */
  estimatedDays?: number;
  /** The carrier's opaque handle for THIS quote. It changes on every quote. */
  ref?: string;
  /** ISO datetime — when this quote stops being buyable, if the carrier says. */
  expiresAt?: string;
  /** The company that moves the parcel, when the transport sells for several. */
  carrier?: string;
  /** The token the transport needs to track this carrier's parcels. */
  carrierToken?: string;
  handover?: HandoverKind;
  tracked?: boolean;
}

export interface OrderRef {
  /** The host's own reference, e.g. `MP-4118`. */
  reference: string;
  /** Absent means `outbound`. */
  purpose?: ShipmentPurpose;
  /** Which parcel of the order, from 1. Absent means 1. */
  parcel?: number;
  /** On a look-up: the carrier's handles for every rate this order may have been bought at. */
  rateRefs?: string[];
}

export interface CustomsItem {
  /** In English, specific enough for a customs officer. */
  description: string;
  quantity: number;
  /** One unit's value as an exact decimal string. The total is quantity × this. */
  unitValue: string;
  currency: string;
  /** One unit's net weight. */
  unitWeightKg: number;
  originCountry: string;
  hsCode?: string;
  skuCode?: string;
  manufacturerCode?: string;
}

/** The kinds of exporter tax number a declaration can state. An IOSS number has its own field. */
export const CUSTOMS_TAX_ID_TYPES = ['EIN', 'VAT', 'ARN'] as const;
export type CustomsTaxIdType = (typeof CUSTOMS_TAX_ID_TYPES)[number];

/** A US export filing exemption. It is a legal statement, so it is only ever sent when a shop chose it. */
export const CUSTOMS_FILING_CODES = ['NOEEI_30_37_a', 'NOEEI_30_37_h', 'NOEEI_30_37_f', 'NOEEI_30_36'] as const;
export type CustomsFilingCode = (typeof CUSTOMS_FILING_CODES)[number];

/** The shop's own export numbers. Each is optional, and is stated only when the shop entered it. */
export interface CustomsExporter {
  eori?: string;
  /** Only on a parcel into the EU whose VAT was collected at checkout. */
  ioss?: string;
  taxId?: { type: CustomsTaxIdType; number: string };
}

export interface CustomsDeclaration {
  contents: CustomsContents;
  /** The named person who declares the values are true. */
  signer: string;
  /** Always `true`: a declaration nobody confirmed cannot be expressed. */
  certified: true;
  nonDelivery: 'return' | 'abandon';
  items: CustomsItem[];
  exporter?: CustomsExporter;
  filingCode?: CustomsFilingCode;
}

export interface QuoteOptions {
  purpose?: ShipmentPurpose;
  customs?: CustomsDeclaration;
}

/** What the server re-read for this booking. A carrier that binds them at quote time may ignore them. */
export interface BookingDetails {
  parcel: Parcel;
  from: Address;
  to: Address;
  customs?: CustomsDeclaration;
  labelSize?: LabelSize;
}

export interface TrackOptions {
  carrierToken?: string;
}

/** A document a shipment has. It holds no address to fetch it from: a signed link is never stored. */
export interface ShipmentDocument {
  kind: ShipmentDocumentKind;
  mediaType?: string;
}

export interface ShipmentDocumentFile {
  kind: ShipmentDocumentKind;
  mediaType: string;
  filename?: string;
  bytes: Uint8Array;
}

export interface Shipment {
  id: string;
  tracking: string;
  labelFileId: string;
  /** ISO datetime — the collection window the carrier committed to. Both or neither. */
  collectionFrom?: string;
  collectionTo?: string;
  rate: Rate;
  /** The company that moves the parcel, when the transport sells for several. */
  carrier?: string;
  carrierToken?: string;
  /** The carrier's own tracking page. Absent means the screen shows the number alone. */
  trackingUrl?: string;
  /** Bought with a test key: nothing will be delivered. */
  test?: boolean;
  documents?: ShipmentDocument[];
}

export interface TrackEvent {
  at: string;
  /** Absent when the carrier gave no location for this scan. */
  place?: string;
  status: string;
  description: string;
}

export interface CancelResult {
  state: CancelState;
  /** The carrier's reference for this request. */
  reference?: string;
  /** The carrier's own words, on a refusal. */
  carrierMessage?: string;
  /** What came back, only when the carrier reports it. */
  amountDecimal?: string;
  currency?: string;
}

export interface CredentialCheckQuery {
  /** The shop's country, to ask which carriers answer for it. */
  country?: string;
}

export type CarrierCredentialCheck =
  | {
      outcome: 'ok';
      mode: 'live' | 'test';
      /** Identifies the account without revealing the key. */
      accountFingerprint?: string;
      /** The carriers that answer for the asked country. Empty is a real answer. */
      carriers: string[];
    }
  | { outcome: 'refused'; carrierMessage?: string }
  | { outcome: 'unreachable' };

/**
 * What a look-up after an unanswered purchase found. `no-match` proves nothing:
 * the carrier may not have indexed the purchase yet, so it never frees an order.
 */
export type RecoveryResult =
  /** `duplicates`: further labels for the same purchase, for a person to refund. */
  | { outcome: 'found'; shipment: Shipment; duplicates?: Shipment[] }
  | { outcome: 'not-bought'; carrierMessage?: string }
  | { outcome: 'no-match' };

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
  /** `refused` is the carrier's clear no. On `book`, anything else may have been bought. */
  readonly outcome?: CarrierOutcome;
  readonly reason?: CarrierRefusal;

  constructor(opts: {
    code: string;
    carrierMessage: string;
    retryable?: boolean;
    outcome?: CarrierOutcome;
    reason?: CarrierRefusal;
  }) {
    super(opts.carrierMessage);
    this.name = 'CarrierError';
    this.code = opts.code;
    this.carrierMessage = opts.carrierMessage;
    this.retryable = opts.retryable ?? true;
    if (opts.outcome !== undefined) this.outcome = opts.outcome;
    if (opts.reason !== undefined) this.reason = opts.reason;
  }
}

/** What a failed `book` means, whichever bundle the error's class came from. */
export interface BookFailure {
  outcome: CarrierOutcome;
  code: string;
  /** Present only on a recognised carrier error: other errors can hold anything. */
  carrierMessage?: string;
  reason?: CarrierRefusal;
  /** Whether the same purchase may be tried again. Never true for `unknown`. */
  retryable: boolean;
}

export const BOOK_OUTCOME_UNKNOWN = 'CARRIER_OUTCOME_UNKNOWN';

/**
 * Reads a thrown value by SHAPE, because each add-on's server bundle inlines its
 * own copy of `CarrierError` and `instanceof` is false across that line.
 */
function carrierErrorFields(err: unknown): {
  code: string;
  carrierMessage: string;
  retryable: unknown;
  outcome: unknown;
  reason: unknown;
} | null {
  if (typeof err !== 'object' || err === null) return null;
  const fields = err as Record<string, unknown>;
  if (fields.name !== 'CarrierError') return null;
  const { code, carrierMessage, retryable, outcome, reason } = fields;
  if (typeof code !== 'string' || typeof carrierMessage !== 'string') return null;
  return { code, carrierMessage, retryable, outcome, reason };
}

/**
 * THE RULE THAT PREVENTS A SECOND PAID LABEL: on `book`, only an explicit
 * `outcome: 'refused'` proves nothing was bought. A timeout, a crash, a bad
 * answer and a carrier error that does not say are all `unknown`.
 */
export function classifyBookFailure(err: unknown): BookFailure {
  const fields = carrierErrorFields(err);
  if (fields === null) return { outcome: 'unknown', code: BOOK_OUTCOME_UNKNOWN, retryable: false };
  if (fields.outcome !== 'refused') {
    return { outcome: 'unknown', code: fields.code, carrierMessage: fields.carrierMessage, retryable: false };
  }
  const reason = (CARRIER_REFUSALS as readonly unknown[]).includes(fields.reason)
    ? (fields.reason as CarrierRefusal)
    : undefined;
  return {
    outcome: 'refused',
    code: fields.code,
    carrierMessage: fields.carrierMessage,
    ...(reason === undefined ? {} : { reason }),
    retryable: fields.retryable !== false,
  };
}

export interface ShippingCarrier {
  readonly key: string;
  quote(parcel: Parcel, from: Address, to: Address, options?: QuoteOptions): Promise<Rate[]>;
  book(rate: Rate, order: OrderRef, details?: BookingDetails): Promise<Shipment>;
  /** An unknown reference returns an empty list — it never throws. */
  track(tracking: string, options?: TrackOptions): Promise<TrackEvent[]>;
  label(shipmentId: string): Promise<FileRef>;
  cancel(shipmentId: string): Promise<void>;
  /** The file itself. A carrier without it has only `label`'s metadata. */
  fetchDocument?(shipmentId: string, kind: ShipmentDocumentKind): Promise<ShipmentDocumentFile>;
  /** A cancel that can say what happened. Preferred over `cancel` when present. */
  requestCancel?(shipmentId: string): Promise<CancelResult>;
  cancelStatus?(shipmentId: string): Promise<CancelResult>;
  checkCredentials?(query?: CredentialCheckQuery): Promise<CarrierCredentialCheck>;
  /** Looks for a purchase whose answer never arrived. Never buys anything. */
  recover?(order: OrderRef): Promise<RecoveryResult>;
}

// ── What the engine hands a transport ───────────────────────────────────────

export interface ShippingHttpResponse {
  readonly status: number;
  readonly headers: { get(name: string): string | null };
  text(): Promise<string>;
  arrayBuffer(): Promise<ArrayBuffer>;
}

/** Egress-bound: only hosts in the add-on's `network.allow`, and a redirect is refused. */
export type ShippingHttpClient = (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string; signal?: AbortSignal },
) => Promise<ShippingHttpResponse>;

export interface ShippingCarrierContext {
  readonly http: ShippingHttpClient;
  /** The stored setting names, decrypted for one call. */
  readonly credentials: Readonly<Record<string, string>>;
  /** The shop's date, so a transport never reads a clock of its own. */
  readonly todayIso: string;
  readonly signal?: AbortSignal;
}
