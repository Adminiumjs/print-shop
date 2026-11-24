/*
 * VENDORED from add-ons/packages/host/src/engine-carrier.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The shared contract the add-ons the works mounts are written against.
 */
/**
 * `createEngineCarrier` — the client a shop's screens use to reach Adminium's
 * shipping routes. Plan 79, T09, rulings W2 and D15.
 *
 * ── IT SENDS NOTHING ITSELF ─────────────────────────────────────────────────
 *
 * Three gates ban any way of issuing a request from what an add-on ships or an
 * app vendors. So this file names none: the app's `connected.ts`, already the
 * one declared sender, passes a `send` that carries the session cookie, the
 * CSRF token and the install header. Nothing here can reach any other address,
 * because every path it builds starts at this app's shipping routes.
 *
 * ── NOT A `ShippingCarrier`, ON PURPOSE ─────────────────────────────────────
 *
 * That contract is what a TRANSPORT implements on the server, with addresses
 * and money in hand. The screen has neither: the engine re-reads the order and
 * its addresses itself, buys from a stored quote, and gives someone who may not
 * see prices a rate with no price at all. Forcing that into `Rate.amount` would
 * mean inventing a number.
 *
 * ── A PURCHASE IS ASKED FOR ONCE ────────────────────────────────────────────
 *
 * No method here retries. On `book`, `refused` means this parcel has no label
 * and none is on its way. So it is only a refusal the engine gives before it
 * buys, or a carrier's no that the saved booking itself records as `refused`.
 * Silence, a broken reply, a server error, a parcel that already has a booking
 * and a code this build does not know all read as `unknown`, because a label
 * may have been paid for. The booking list then says what really happened.
 *
 * ── NO CARRIER KEY PASSES THROUGH ───────────────────────────────────────────
 *
 * Replies are read field by field, so a field this file does not name never
 * reaches a screen. Free text from a carrier is scrubbed of anything shaped
 * like a credential. A transport error is dropped rather than quoted, and
 * nothing here logs.
 */

import {
  CARRIER_REFUSALS,
  CUSTOMS_TAX_ID_TYPES,
  CarrierError,
  HANDOVER_KINDS,
  type CarrierOutcome,
  type CarrierRefusal,
  type CustomsTaxIdType,
  type HandoverKind,
  type ShipmentDocumentKind,
  type ShipmentPurpose,
} from './contracts/shipping-carrier.ts';

// ── what the app hands in ───────────────────────────────────────────────────

export interface EngineRequest {
  method: 'GET' | 'POST' | 'PUT';
  headers: Record<string, string>;
  body?: string;
}

export interface EngineReply {
  readonly status: number;
  text(): Promise<string>;
  /**
   * The body as a file, for a label. Optional so an app built before labels
   * still compiles: without it `downloadDocument` refuses and the screen says so.
   * A plain link cannot stand in, because it would not carry the install header.
   */
  blob?(): Promise<Blob>;
}

/** Same origin, with the session, the CSRF token and the install header. The app's own. */
export type EngineSend = (path: string, init: EngineRequest) => Promise<EngineReply>;

export interface EngineCarrierOptions {
  send: EngineSend;
  /** The app's manifest key: the engine's shipping routes belong to the app. */
  appKey: string;
  /** The carrier add-on this client serves. A quote from another carrier is refused. */
  addOnKey: string;
}

// ── what the engine answers ─────────────────────────────────────────────────

export type EngineMode = 'live' | 'test';
export type EngineBookingState = 'reserved' | 'calling' | 'booked' | 'refused' | 'unknown' | 'released' | 'voiding' | 'voided';
export type EngineBookingBlock = 'booking' | 'label-on-order' | 'no-carrier';
export type EngineLookUpOutcome = 'found' | 'not-bought' | 'no-match' | 'no-answer' | 'cannot-check' | 'other-account' | 'other-rate';

export interface EngineAccess {
  appUpdated: boolean;
  carrier: string | null;
  /** True when the shop's active carrier is the add-on this client serves. */
  activeHere: boolean;
  mode: EngineMode | null;
  manages: boolean;
  mayBook: boolean;
  mayCancel: boolean;
  mayCustoms: boolean;
  /** May send a parcel abroad and see what it declares. False from an engine older than customs. */
  mayShipAbroad: boolean;
  /** The shop has listed a country abroad. While false, nothing about customs is drawn or asked for. */
  shipsAbroad: boolean;
  pricesHidden: boolean;
  booking: 'open' | 'no-limit' | 'daily-limit' | 'no-right';
  usedToday?: number;
  dailyLabels?: number;
}

interface EngineRateFields {
  rateId: string;
  code: string;
  service: string;
  withinLimit: boolean;
  estimatedDelivery?: string;
  estimatedDays?: number;
  expiresAt?: string;
  carrier?: string;
  handover?: HandoverKind;
  tracked?: boolean;
}

export interface PricedEngineRate extends EngineRateFields {
  priced: true;
  /** The carrier's exact decimal, never a float. */
  amountDecimal: string;
  currency: string;
}

export interface PricelessEngineRate extends EngineRateFields {
  priced: false;
}

interface EngineQuoteFields {
  quoteId: string;
  carrier: string;
  mode: EngineMode;
  expiresAt: number;
}

export type EngineQuote =
  | (EngineQuoteFields & { pricesHidden: false; rates: PricedEngineRate[] })
  | (EngineQuoteFields & { pricesHidden: true; rates: PricelessEngineRate[] });

export type EngineLabelState = 'none' | 'ready' | 'owed' | 'gone';

/** Where a bought label's file stands. Offer a download only on `ready`. */
export interface EngineLabel {
  state: EngineLabelState;
  /** The size asked for. */
  size: string | null;
  /** The size the carrier's file really is, when it can be read. */
  sizeGot: string | null;
  sizeDiffers: boolean;
  customsInvoice: boolean;
  /** The carrier made a customs invoice and it has not been stored yet: a person retries. */
  customsInvoiceOwed: boolean;
}

export type EngineTrackStatus = 'UNKNOWN' | 'PRE_TRANSIT' | 'TRANSIT' | 'FAILURE' | 'RETURNED' | 'DELIVERED';

/** Where a parcel is. `checkedAt` is a person's Refresh, never a webhook. */
export interface EngineTrack {
  status: EngineTrackStatus | null;
  statusAt: number | null;
  checkedAt: number | null;
  flag: string | null;
  newNumber: boolean;
}

export type EngineRefreshOutcome = 'updated' | 'unchanged' | 'no-events' | 'recent' | 'test' | 'not-open' | 'other-account' | 'no-answer' | 'rate-limited';

export interface EngineRefresh {
  outcome: EngineRefreshOutcome;
  track: EngineTrack | null;
}

/** "Refresh open parcels". `oldestCheckedAt` is the oldest check, so nothing reads fresher than it is. */
export interface EngineRefreshOpen {
  outcome: 'done' | 'recent' | 'rate-limited';
  checked: number;
  updated: number;
  failed: number;
  remaining: number;
  more: boolean;
  oldestCheckedAt: number | null;
  neverChecked: number;
  retryAt: number | null;
}

/** How a label's refund stands. The dates are the server's. An amount appears only if the carrier reported one. */
export interface EngineRefund {
  state: 'requested' | 'pending' | 'refunded' | 'refused' | null;
  askedAt: number | null;
  settledAt: number | null;
  heardAt: number | null;
  /** Asked for, and the carrier has not confirmed hearing it. */
  unconfirmed: boolean;
  expectedBy: number | null;
  claimBy: number;
  tooLate: boolean;
  scanned: boolean;
  canRequest: boolean;
  message: string | null;
  amount?: string;
  currency?: string;
}

export type EngineRefundOutcome = 'requested' | 'pending' | 'refunded' | 'refused' | 'no-answer' | 'other-account' | 'cannot-check' | 'not-open';

export interface EngineRefundAnswer {
  outcome: EngineRefundOutcome;
  booking: EngineBooking;
}

export interface EngineBooking {
  id: string;
  state: EngineBookingState;
  test: boolean;
  purpose: string;
  parcelNumber: number;
  carrier: string;
  service: string;
  tracking: string | null;
  carrierName: string | null;
  reason: string | null;
  duplicates: number;
  createdAt: number;
  calledAt: number | null;
  checkedAt: number | null;
  releaseAfter: number | null;
  applied: boolean;
  label: EngineLabel;
  /** Null for an attempt that never became a label. Absent from an engine older than the refund routes. */
  refund?: EngineRefund | null;
  amount?: string;
  currency?: string;
  chargeDiffers?: boolean;
  /** Absent or null until the parcel has a tracking record. */
  track?: EngineTrack | null;
}

export interface EngineBookings {
  bookings: EngineBooking[];
  /** True only on a positive "no booking": anything unsure is false, and `blockedBy` says why. */
  bookable: boolean;
  blockedBy: EngineBookingBlock | null;
  /** The parcel the answer is about: a return's place, worked out by the engine. */
  parcelNumber?: number;
}

export interface EngineLookUp {
  outcome: EngineLookUpOutcome;
  booking: EngineBooking;
}

export const ENGINE_ATTENTION_REASONS = ['unknown', 'duplicates', 'refund-refused', 'refund-pending', 'label-owed', 'new-number', 'tracking-failed', 'returned', 'ambiguous', 'quiet'] as const;
export type EngineAttentionReason = (typeof ENGINE_ATTENTION_REASONS)[number];

/** A label that needs a person, on an order this person reaches. */
export interface EngineAttentionItem {
  /** Most pressing first. A reason this build has no word for is left out, so the list can be empty. */
  reasons: EngineAttentionReason[];
  reference: string;
  source: { table: string; id: string };
  /** The order was deleted, so there is none to open. Only ever true for someone who manages shipping. */
  orderGone: boolean;
  booking: EngineBooking;
}

export interface EngineAttention {
  items: EngineAttentionItem[];
  /** The engine stopped looking, so more may be waiting. */
  more: boolean;
}

export interface EngineQuoteRequest {
  source: { table: string; id: string };
  parcel: { weightKg: number; lengthCm: number; widthCm: number; heightCm: number; contents: string };
  purpose?: ShipmentPurpose;
  parcelNumber?: number;
  /** The approved return a return label is for. The engine works out its place. */
  returnId?: string;
  /** A parcel going abroad: a person's tick, and the corrections they made. Values stay the order's. */
  customs?: EngineCustomsTick;
}

export interface EngineCustomsEdit {
  line: string;
  description?: string;
  hsCode?: string;
  manufacturerCode?: string;
}

export interface EngineCustomsTick {
  certified: true;
  lines?: EngineCustomsEdit[];
}

/** One line of an order's customs form. Quantity, value and origin are the order's, and read-only. */
export interface EngineCustomsLine {
  line: string;
  description: string | null;
  quantity: number | null;
  unitValue: string | null;
  originCountry: string;
  hsCode?: string;
  skuCode?: string;
  manufacturerCode?: string;
}

export const ENGINE_CUSTOMS_FAULTS = ['lines', 'description', 'quantity', 'unitValue', 'currency', 'originCountry', 'weight'] as const;
export type EngineCustomsFault = (typeof ENGINE_CUSTOMS_FAULTS)[number];
export const ENGINE_CUSTOMS_WARNINGS = ['hsCode', 'skuCode', 'manufacturerCode'] as const;
export type EngineCustomsWarning = (typeof ENGINE_CUSTOMS_WARNINGS)[number];

export type EngineCustomsForm =
  | { abroad: false }
  | { abroad: true; offered: false; to: string }
  | {
      abroad: true;
      offered: true;
      ownCountry: string;
      to: string;
      /** The official code list for the shop's country, where the engine knows one. */
      codeListUrl: string | null;
      /** Null when the person named no longer holds the customs right. */
      signer: string | null;
      currency: string | null;
      lines: EngineCustomsLine[];
      faults: { line?: string; field: EngineCustomsFault }[];
      warnings: { line: string; field: EngineCustomsWarning }[];
    };

export interface EngineCustomsProduct {
  sku: string;
  hsCode?: string;
  originCountry?: string;
  manufacturerCode?: string;
}

/** The shop's export numbers. Blank removes one, and leaving the whole field out keeps them. */
export interface EngineExporter {
  eori?: string;
  ioss?: string;
  taxId?: { type: CustomsTaxIdType; number: string };
}

/** The US export filing statements a shop may choose: both are true of a sale of goods, on the parcels they fit. */
export const ENGINE_FILING_CODES = ["NOEEI_30_37_a", "NOEEI_30_36"] as const;
export type EngineFilingCode = (typeof ENGINE_FILING_CODES)[number];

/** A shop's countries and customs defaults, for someone who manages shipping. */
export interface EngineInternational {
  /** The shop's own country, once Ship from has one. */
  ownCountry: string | null;
  /** The official code list for that country, where the engine knows one. */
  codeListUrl: string | null;
  /** True once a country is listed and the app says where an order's goods are. */
  shipsAbroad: boolean;
  /** Nothing saved yet. */
  settings: {
    countries: string[];
    currency: string;
    originCountry: string;
    description?: string;
    hsCode?: string;
    signerId: string;
    /** Null when the person named no longer holds the customs right. */
    signerName: string | null;
    products: EngineCustomsProduct[];
    exporter?: EngineExporter;
    /** The US export filing statement the shop chose. Absent means none is ever stated. */
    filingCode?: EngineFilingCode;
  } | null;
}

export interface EngineInternationalBody {
  countries: string[];
  currency: string;
  originCountry: string;
  description?: string;
  hsCode?: string;
  signerId?: string;
  products?: EngineCustomsProduct[];
  exporter?: EngineExporter;
  /** Left out, it stays as it was. Null removes it. */
  filingCode?: EngineFilingCode | null;
}

export interface EngineBookingsQuery {
  table: string;
  id: string;
  connectionId?: string;
  purpose?: ShipmentPurpose;
  parcelNumber?: number;
  returnId?: string;
}

export interface EngineBookRequest {
  quoteId: string;
  rateId: string;
  /** Someone who manages shipping saw an earlier attempt cannot be looked up, and means to buy anyway. */
  confirmEarlier?: boolean;
  /** Someone who may cancel was told both labels stay paid until the refund lands, and means to book another. */
  replaceRefunding?: boolean;
  /** The approved return this label is for, asked again at purchase. */
  returnId?: string;
}

export interface EngineCarrier {
  readonly addOnKey: string;
  access(): Promise<EngineAccess>;
  quote(request: EngineQuoteRequest): Promise<EngineQuote>;
  bookings(query: EngineBookingsQuery): Promise<EngineBookings>;
  /** Asked for once, never retried. A thrown `unknown` means a label may have been paid for. */
  book(request: EngineBookRequest): Promise<EngineBooking>;
  checkBooking(id: string): Promise<EngineLookUp>;
  /** The person's own declaration that no label exists. */
  releaseBooking(id: string): Promise<EngineBooking>;
  /** The person's own declaration that this label was not used. A second press reports the first. */
  requestRefund(id: string): Promise<EngineRefundAnswer>;
  /** Asks the carrier where a pending refund stands. */
  checkRefund(id: string): Promise<EngineRefundAnswer>;
  /** Asks the carrier for a file that is owed. The booking comes back with its new `label`. */
  fetchDocument(id: string, kind: ShipmentDocumentKind): Promise<EngineBooking>;
  /** The stored file. Only for a label whose `state` is `ready`. */
  downloadDocument(id: string, kind: ShipmentDocumentKind): Promise<Blob>;
  refreshBooking(id: string): Promise<EngineRefresh>;
  refreshOpenParcels(): Promise<EngineRefreshOpen>;
  /** The labels that need a person. Reads what is stored: no carrier is asked. */
  attention(): Promise<EngineAttention>;
  /** One order's customs form, filled in from the order. Needs the right to send it abroad. */
  customsForm(source: { table: string; id: string }): Promise<EngineCustomsForm>;
  /** The shop's countries and customs defaults. For someone who manages shipping. */
  international(): Promise<EngineInternational>;
  saveInternational(body: EngineInternationalBody): Promise<EngineInternational>;
  /** Who may be named on a declaration: only people holding the customs right. */
  customsSigners(): Promise<{ id: string; name: string }[]>;
}

// ── failures ────────────────────────────────────────────────────────────────

export const ENGINE_NO_ANSWER = 'ENGINE_NO_ANSWER';
export const ENGINE_BAD_ANSWER = 'ENGINE_BAD_ANSWER';
export const ENGINE_OTHER_CARRIER = 'ENGINE_OTHER_CARRIER';
/** The app's sender cannot hand back a file yet. */
export const ENGINE_NO_DOWNLOAD = 'ENGINE_NO_DOWNLOAD';

/**
 * A refusal, read by shape through `classifyBookFailure` like any `CarrierError`.
 * `booking` is the one holding this parcel, when the engine names it.
 */
export class EngineCarrierError extends CarrierError {
  readonly status: number | null;
  readonly retryAfterSeconds?: number;
  readonly booking?: EngineBooking;
  /** The engine's own word for why, such as `over-limit` or `daily-limit`. */
  readonly refusalDetail?: string;
  /** Which fields stopped it, when the engine names them: `phone`, `weight` and the like. */
  readonly refusalFields?: readonly string[];

  constructor(opts: {
    code: string;
    message: string;
    status: number | null;
    retryable: boolean;
    outcome?: CarrierOutcome;
    reason?: CarrierRefusal;
    retryAfterSeconds?: number;
    booking?: EngineBooking;
    refusalDetail?: string;
    refusalFields?: readonly string[];
  }) {
    super({
      code: opts.code,
      carrierMessage: opts.message,
      retryable: opts.retryable,
      ...(opts.outcome === undefined ? {} : { outcome: opts.outcome }),
      ...(opts.reason === undefined ? {} : { reason: opts.reason }),
    });
    this.status = opts.status;
    if (opts.retryAfterSeconds !== undefined) this.retryAfterSeconds = opts.retryAfterSeconds;
    if (opts.booking !== undefined) this.booking = opts.booking;
    if (opts.refusalDetail !== undefined) this.refusalDetail = opts.refusalDetail;
    if (opts.refusalFields !== undefined) this.refusalFields = opts.refusalFields;
  }
}

/**
 * The engine's refusals that can only come before a purchase is attempted, on a
 * parcel with no label. Left out on purpose: `QUOTE_NOT_FOUND` (a quote is
 * deleted just before it is bought, so a repeat of a purchase in flight gets
 * it), `BOOKING_EXISTS` and `ALREADY_BOUGHT` (a label may be paid for), and
 * `CARRIER_REFUSED` (said after the call: see `refusalFrom`).
 */
const REFUSED_BEFORE_BUYING: ReadonlySet<string> = new Set([
  'UNAUTHENTICATED',
  'SESSION_EXPIRED',
  'FORBIDDEN',
  'TABLE_FORBIDDEN',
  'APP_SCREENS_ONLY',
  'READ_ONLY_MODE',
  'APP_INSTALL_AMBIGUOUS',
  'CSRF_FAILED',
  'VALIDATION_FAILED',
  'RATE_LIMITED',
  'APP_NOT_UPDATED',
  'NOT_A_SHIPPING_TABLE',
  'NO_ACTIVE_CARRIER',
  'CARRIER_LOCKED',
  'CARRIER_NOT_INSTALLED',
  'CARRIER_SWITCHED_OFF',
  'CARRIER_NOT_LOADED',
  'CARRIER_NO_FACTORY',
  'CARRIER_NO_CREDENTIAL',
  'CARRIER_NOT_CHECKED',
  'CARRIER_SERVER_WIDE',
  'SHIP_FROM_INCOMPLETE',
  'ADDRESS_INCOMPLETE',
  'COUNTRY_NOT_RECORDED',
  'OUTSIDE_OWN_COUNTRY',
  'COUNTRY_NOT_OFFERED',
  'CUSTOMS_NOT_DECLARED',
  'CUSTOMS_NOT_CONFIRMED',
  'CUSTOMS_NOT_NEEDED',
  'CUSTOMS_INCOMPLETE',
  'CUSTOMS_ONE_PARCEL',
  'CUSTOMS_SIGNER',
  'ORDER_CANCELLED',
  'OWNER_BOOKS',
  'QUOTE_EXPIRED',
  'QUOTE_STALE',
  'RATE_NOT_IN_QUOTE',
  'REBUY_UNCHECKED',
]);

const REASON_OF_CODE: Readonly<Record<string, CarrierRefusal>> = {
  SHIP_FROM_INCOMPLETE: 'address',
  ADDRESS_INCOMPLETE: 'address',
  COUNTRY_NOT_RECORDED: 'address',
  OUTSIDE_OWN_COUNTRY: 'address',
  COUNTRY_NOT_OFFERED: 'address',
  CUSTOMS_NOT_DECLARED: 'customs',
  CUSTOMS_NOT_CONFIRMED: 'customs',
  CUSTOMS_NOT_NEEDED: 'customs',
  CUSTOMS_INCOMPLETE: 'customs',
  CUSTOMS_ONE_PARCEL: 'customs',
  CUSTOMS_SIGNER: 'customs',
  CARRIER_NO_CREDENTIAL: 'credentials',
  CARRIER_NOT_CHECKED: 'credentials',
  QUOTE_EXPIRED: 'rate-expired',
  QUOTE_STALE: 'rate-expired',
  RATE_NOT_IN_QUOTE: 'rate-expired',
};

const HIDDEN = '[hidden]';

/**
 * Takes out anything shaped like a credential. A second line of defence: the
 * engine already keeps keys out of its replies, and a carrier's own error text
 * is the one place a key could still be quoted back.
 */
export function scrubCredentials(text: string): string {
  return text
    .replace(/\bShippoToken\s+[^\s"',;]+/gi, HIDDEN)
    // Long enough to be a token, so "Basic parcels only" stays a sentence.
    .replace(/\b(?:Bearer|Basic)\s+[A-Za-z0-9+/=._~-]{16,}/gi, HIDDEN)
    .replace(/\bshippo_(?:live|test)_[A-Za-z0-9]+/gi, HIDDEN)
    .replace(
      /\b(api[_-]?(?:key|secret|token)|access[_-]?token|authorization|password|account[_-]?number)(["']?\s*[:=]\s*["']?)[^\s"',;&}]+/gi,
      `$1$2${HIDDEN}`,
    );
}

// ── reading a reply, field by field ─────────────────────────────────────────

type Fields = Readonly<Record<string, unknown>>;

const fieldsOf = (value: unknown): Fields | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Fields) : null;

function badAnswer(buying: boolean): EngineCarrierError {
  return new EngineCarrierError({
    code: ENGINE_BAD_ANSWER,
    message: 'Adminium answered in a way this screen does not understand.',
    status: null,
    retryable: !buying,
    ...(buying ? { outcome: 'unknown' as const } : {}),
  });
}

/** Reads one reply. Every `need` that fails is the same bad answer. */
function reader(buying: boolean) {
  const fail = (): never => {
    throw badAnswer(buying);
  };
  const text = (from: Fields, key: string): string => {
    const value = from[key];
    return typeof value === 'string' ? value : fail();
  };
  const number = (from: Fields, key: string): number => {
    const value = from[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : fail();
  };
  const flag = (from: Fields, key: string): boolean => {
    const value = from[key];
    return typeof value === 'boolean' ? value : fail();
  };
  const oneOf = <T extends string>(from: Fields, key: string, allowed: readonly T[]): T => {
    const value = from[key];
    return (allowed as readonly unknown[]).includes(value) ? (value as T) : fail();
  };
  const orNull = <T>(from: Fields, key: string, read: (from: Fields, key: string) => T): T | null =>
    from[key] === null ? null : read(from, key);
  const maybe = <T>(from: Fields, key: string, read: (from: Fields, key: string) => T): T | undefined =>
    from[key] === undefined ? undefined : read(from, key);
  const object = (value: unknown): Fields => fieldsOf(value) ?? fail();
  const list = (value: unknown): readonly unknown[] => (Array.isArray(value) ? value : fail());
  return { text, number, flag, oneOf, orNull, maybe, object, list };
}

type Reader = ReturnType<typeof reader>;

const optional = <K extends string, V>(key: K, value: V | undefined): { [P in K]?: V } =>
  (value === undefined ? {} : { [key]: value }) as { [P in K]?: V };

const BOOKING_STATES = ['reserved', 'calling', 'booked', 'refused', 'unknown', 'released', 'voiding', 'voided'] as const;
const BOOKING_BLOCKS = ['booking', 'label-on-order', 'no-carrier'] as const;
const LOOK_UP_OUTCOMES = ['found', 'not-bought', 'no-match', 'no-answer', 'cannot-check', 'other-account', 'other-rate'] as const;
const MODES = ['live', 'test'] as const;
const BOOKING_ROOM = ['open', 'no-limit', 'daily-limit', 'no-right'] as const;
const LABEL_STATES = ['none', 'ready', 'owed', 'gone'] as const;
const TRACK_STATUSES = ['UNKNOWN', 'PRE_TRANSIT', 'TRANSIT', 'FAILURE', 'RETURNED', 'DELIVERED'] as const;
const REFRESH_OUTCOMES = ['updated', 'unchanged', 'no-events', 'recent', 'test', 'not-open', 'other-account', 'no-answer', 'rate-limited'] as const;
const REFRESH_OPEN_OUTCOMES = ['done', 'recent', 'rate-limited'] as const;

function readLabel(read: Reader, value: unknown): EngineLabel {
  const raw = read.object(value);
  return {
    state: read.oneOf(raw, 'state', LABEL_STATES),
    size: read.orNull(raw, 'size', read.text),
    sizeGot: read.orNull(raw, 'sizeGot', read.text),
    sizeDiffers: read.flag(raw, 'sizeDiffers'),
    customsInvoice: read.flag(raw, 'customsInvoice'),
    customsInvoiceOwed: read.maybe(raw, 'customsInvoiceOwed', read.flag) ?? false,
  };
}

function readTrack(read: Reader, value: unknown): EngineTrack {
  const raw = read.object(value);
  return {
    status: read.orNull(raw, 'status', (from, key) => read.oneOf(from, key, TRACK_STATUSES)),
    statusAt: read.orNull(raw, 'statusAt', read.number),
    checkedAt: read.orNull(raw, 'checkedAt', read.number),
    flag: read.orNull(raw, 'flag', read.text),
    newNumber: read.flag(raw, 'newNumber'),
  };
}

const REFUND_STATES = ['requested', 'pending', 'refunded', 'refused'] as const;
const REFUND_OUTCOMES = ['requested', 'pending', 'refunded', 'refused', 'no-answer', 'other-account', 'cannot-check', 'not-open'] as const;

function readRefund(read: Reader, value: unknown): EngineRefund {
  const raw = read.object(value);
  const message = read.orNull(raw, 'message', read.text);
  return {
    state: read.orNull(raw, 'state', (from, key) => read.oneOf(from, key, REFUND_STATES)),
    askedAt: read.orNull(raw, 'askedAt', read.number),
    settledAt: read.orNull(raw, 'settledAt', read.number),
    heardAt: read.orNull(raw, 'heardAt', read.number),
    unconfirmed: read.flag(raw, 'unconfirmed'),
    expectedBy: read.orNull(raw, 'expectedBy', read.number),
    claimBy: read.number(raw, 'claimBy'),
    tooLate: read.flag(raw, 'tooLate'),
    scanned: read.flag(raw, 'scanned'),
    canRequest: read.flag(raw, 'canRequest'),
    message: message === null ? null : scrubCredentials(message),
    ...optional('amount', read.maybe(raw, 'amount', read.text)),
    ...optional('currency', read.maybe(raw, 'currency', read.text)),
  };
}

function readBooking(read: Reader, value: unknown): EngineBooking {
  const raw = read.object(value);
  const carrierName = read.orNull(raw, 'carrierName', read.text);
  const reason = read.orNull(raw, 'reason', read.text);
  return {
    id: read.text(raw, 'id'),
    state: read.oneOf(raw, 'state', BOOKING_STATES),
    test: read.flag(raw, 'test'),
    purpose: read.text(raw, 'purpose'),
    parcelNumber: read.number(raw, 'parcelNumber'),
    carrier: read.text(raw, 'carrier'),
    service: scrubCredentials(read.text(raw, 'service')),
    tracking: read.orNull(raw, 'tracking', read.text),
    carrierName: carrierName === null ? null : scrubCredentials(carrierName),
    reason: reason === null ? null : scrubCredentials(reason),
    duplicates: read.number(raw, 'duplicates'),
    createdAt: read.number(raw, 'createdAt'),
    calledAt: read.orNull(raw, 'calledAt', read.number),
    checkedAt: read.orNull(raw, 'checkedAt', read.number),
    releaseAfter: read.orNull(raw, 'releaseAfter', read.number),
    applied: read.flag(raw, 'applied'),
    label: readLabel(read, raw.label),
    ...(raw.refund === undefined ? {} : { refund: raw.refund === null ? null : readRefund(read, raw.refund) }),
    ...optional('amount', read.maybe(raw, 'amount', read.text)),
    ...optional('currency', read.maybe(raw, 'currency', read.text)),
    ...optional('chargeDiffers', read.maybe(raw, 'chargeDiffers', read.flag)),
    ...(raw.track === undefined ? {} : { track: raw.track === null ? null : readTrack(read, raw.track) }),
  };
}

function readAttentionItem(read: Reader, value: unknown): EngineAttentionItem {
  const raw = read.object(value);
  const source = read.object(raw.source);
  return {
    // An engine newer than this build can name a reason it has no word for. The row still shows.
    reasons: read.list(raw.reasons).filter((reason): reason is EngineAttentionReason => (ENGINE_ATTENTION_REASONS as readonly unknown[]).includes(reason)),
    reference: read.text(raw, 'reference'),
    source: { table: read.text(source, 'table'), id: read.text(source, 'id') },
    orderGone: read.flag(raw, 'orderGone'),
    booking: readBooking(read, raw.booking),
  };
}

function readRateFields(read: Reader, raw: Fields): EngineRateFields {
  const company = read.maybe(raw, 'carrier', read.text);
  return {
    rateId: read.text(raw, 'rateId'),
    code: read.text(raw, 'code'),
    service: scrubCredentials(read.text(raw, 'service')),
    withinLimit: read.flag(raw, 'withinLimit'),
    ...optional('estimatedDelivery', read.maybe(raw, 'estimatedDelivery', read.text)),
    ...optional('estimatedDays', read.maybe(raw, 'estimatedDays', read.number)),
    ...optional('expiresAt', read.maybe(raw, 'expiresAt', read.text)),
    ...optional('carrier', company === undefined ? undefined : scrubCredentials(company)),
    ...optional(
      'handover',
      read.maybe(raw, 'handover', (from, key) => read.oneOf(from, key, HANDOVER_KINDS)),
    ),
    ...optional('tracked', read.maybe(raw, 'tracked', read.flag)),
  };
}

function readQuote(read: Reader, value: unknown): EngineQuote {
  const raw = read.object(value);
  const fields: EngineQuoteFields = {
    quoteId: read.text(raw, 'quoteId'),
    carrier: read.text(raw, 'carrier'),
    mode: read.oneOf(raw, 'mode', MODES),
    expiresAt: read.number(raw, 'expiresAt'),
  };
  const rates = read.list(raw.rates).map((rate) => read.object(rate));
  if (read.flag(raw, 'pricesHidden')) {
    // Whatever else the reply held, a person who may not see prices gets none from here.
    return { ...fields, pricesHidden: true, rates: rates.map((rate) => ({ ...readRateFields(read, rate), priced: false })) };
  }
  return {
    ...fields,
    pricesHidden: false,
    rates: rates.map((rate) => ({
      ...readRateFields(read, rate),
      priced: true,
      amountDecimal: read.text(rate, 'amountDecimal'),
      currency: read.text(rate, 'currency'),
    })),
  };
}

function readAccess(read: Reader, value: unknown, addOnKey: string): EngineAccess {
  const raw = read.object(value);
  const carrier = read.orNull(raw, 'carrier', read.text);
  return {
    appUpdated: read.flag(raw, 'appUpdated'),
    carrier,
    activeHere: carrier === addOnKey,
    mode: read.orNull(raw, 'mode', (from, key) => read.oneOf(from, key, MODES)),
    manages: read.flag(raw, 'manages'),
    mayBook: read.flag(raw, 'mayBook'),
    mayCancel: read.flag(raw, 'mayCancel'),
    mayCustoms: read.flag(raw, 'mayCustoms'),
    mayShipAbroad: read.maybe(raw, 'mayShipAbroad', read.flag) ?? false,
    shipsAbroad: read.maybe(raw, 'shipsAbroad', read.flag) ?? false,
    pricesHidden: read.flag(raw, 'pricesHidden'),
    booking: read.oneOf(raw, 'booking', BOOKING_ROOM),
    ...optional('usedToday', read.maybe(raw, 'usedToday', read.number)),
    ...optional('dailyLabels', read.maybe(raw, 'dailyLabels', read.number)),
  };
}

/** A link to open in a new tab: https only, whatever the reply held. */
function readCodeList(read: Reader, raw: Fields): string | null {
  const url = read.maybe(raw, 'codeListUrl', (from, key) => read.orNull(from, key, read.text)) ?? null;
  return url !== null && url.startsWith('https://') ? url : null;
}

function readCustomsLine(read: Reader, value: unknown): EngineCustomsLine {
  const raw = read.object(value);
  return {
    line: read.text(raw, 'line'),
    description: read.orNull(raw, 'description', read.text),
    quantity: read.orNull(raw, 'quantity', read.number),
    unitValue: read.orNull(raw, 'unitValue', read.text),
    originCountry: read.text(raw, 'originCountry'),
    ...optional('hsCode', read.maybe(raw, 'hsCode', read.text)),
    ...optional('skuCode', read.maybe(raw, 'skuCode', read.text)),
    ...optional('manufacturerCode', read.maybe(raw, 'manufacturerCode', read.text)),
  };
}

function readCustomsForm(read: Reader, value: unknown): EngineCustomsForm {
  const raw = read.object(value);
  if (!read.flag(raw, 'abroad')) return { abroad: false };
  if (!read.flag(raw, 'offered')) return { abroad: true, offered: false, to: read.text(raw, 'to') };
  return {
    abroad: true,
    offered: true,
    ownCountry: read.text(raw, 'ownCountry'),
    to: read.text(raw, 'to'),
    codeListUrl: readCodeList(read, raw),
    signer: read.orNull(raw, 'signer', read.text),
    currency: read.orNull(raw, 'currency', read.text),
    lines: read.list(raw.lines).map((line) => readCustomsLine(read, line)),
    faults: read.list(raw.problems).map((item) => {
      const fault = read.object(item);
      return { ...optional('line', read.maybe(fault, 'line', read.text)), field: read.oneOf(fault, 'field', ENGINE_CUSTOMS_FAULTS) };
    }),
    warnings: read.list(raw.warnings).map((item) => {
      const warning = read.object(item);
      return { line: read.text(warning, 'line'), field: read.oneOf(warning, 'field', ENGINE_CUSTOMS_WARNINGS) };
    }),
  };
}

function readCustomsProduct(read: Reader, value: unknown): EngineCustomsProduct {
  const raw = read.object(value);
  return {
    sku: read.text(raw, 'sku'),
    ...optional('hsCode', read.maybe(raw, 'hsCode', read.text)),
    ...optional('originCountry', read.maybe(raw, 'originCountry', read.text)),
    ...optional('manufacturerCode', read.maybe(raw, 'manufacturerCode', read.text)),
  };
}

function readExporter(read: Reader, value: unknown): EngineExporter {
  const raw = read.object(value);
  const tax = raw.taxId === undefined ? undefined : read.object(raw.taxId);
  return {
    ...optional('eori', read.maybe(raw, 'eori', read.text)),
    ...optional('ioss', read.maybe(raw, 'ioss', read.text)),
    ...(tax === undefined ? {} : { taxId: { type: read.oneOf(tax, 'type', CUSTOMS_TAX_ID_TYPES), number: read.text(tax, 'number') } }),
  };
}

/** Field by field from the shop's status: its keys and limits never reach a screen through this. */
function readInternational(read: Reader, value: unknown): EngineInternational {
  const raw = read.object(value);
  const shipFrom = raw.shipFrom === null || raw.shipFrom === undefined ? null : read.object(raw.shipFrom);
  const customs = raw.customs === null || raw.customs === undefined ? null : read.object(raw.customs);
  return {
    ownCountry: shipFrom === null ? null : (read.maybe(shipFrom, 'country', read.text) ?? null),
    codeListUrl: readCodeList(read, raw),
    shipsAbroad: read.flag(raw, 'international'),
    settings:
      customs === null
        ? null
        : {
            countries: read.list(customs.countries).map((one) => read.text({ one }, 'one')),
            currency: read.text(customs, 'currency'),
            originCountry: read.text(customs, 'originCountry'),
            ...optional('description', read.maybe(customs, 'description', read.text)),
            ...optional('hsCode', read.maybe(customs, 'hsCode', read.text)),
            signerId: read.text(customs, 'signerId'),
            signerName: read.orNull(customs, 'signerName', read.text),
            products: read.list(customs.products).map((one) => readCustomsProduct(read, one)),
            ...(customs.exporter === undefined ? {} : { exporter: readExporter(read, customs.exporter) }),
            ...(customs.filingCode === undefined ? {} : { filingCode: read.oneOf(customs, "filingCode", ENGINE_FILING_CODES) }),
          },
  };
}

/** What a non-2xx reply means. Only a named engine refusal is ever a clear no. */
function refusalFrom(status: number, body: unknown, buying: boolean): EngineCarrierError {
  const envelope = fieldsOf(fieldsOf(body)?.error);
  const code = typeof envelope?.code === 'string' ? envelope.code : null;
  const isClientError = status >= 400 && status < 500;
  const details = fieldsOf(envelope?.details);

  let booking: EngineBooking | undefined;
  if (details?.booking !== undefined) {
    try {
      booking = readBooking(reader(buying), details.booking);
    } catch {
      // The refusal stands without it; the booking list is the record.
    }
  }

  // Said after the carrier was called, so it counts only if the saved booking agrees.
  const carrierSaidNo = code === 'CARRIER_REFUSED' && booking?.state === 'refused';
  const refused = code !== null && isClientError && (!buying || carrierSaidNo || REFUSED_BEFORE_BUYING.has(code));
  // The carrier's own words when the engine passes them on, for the screen to quote.
  const words = typeof details?.carrierMessage === 'string' && details.carrierMessage !== '' ? details.carrierMessage : envelope?.message;
  const message = typeof words === 'string' ? scrubCredentials(words) : 'Adminium did not give a reason.';

  const said = details?.reason;
  const carrierReason = (CARRIER_REFUSALS as readonly unknown[]).includes(said) ? (said as CarrierRefusal) : undefined;
  const reason = carrierReason ?? (code === null ? undefined : REASON_OF_CODE[code]);
  const after = details?.retryAfterSeconds;
  const named = [
    ...(Array.isArray(details?.fields) ? details.fields : []),
    ...(Array.isArray(details?.problems) ? details.problems.map((one) => fieldsOf(one)?.field) : []),
  ].filter((one): one is string => typeof one === 'string');

  return new EngineCarrierError({
    code: code ?? ENGINE_BAD_ANSWER,
    message,
    status,
    retryable: !buying && (status === 429 || status >= 500 || code === null),
    ...(refused ? { outcome: 'refused' as const } : buying ? { outcome: 'unknown' as const } : {}),
    ...optional('reason', refused ? reason : undefined),
    ...optional('retryAfterSeconds', typeof after === 'number' && Number.isFinite(after) ? after : undefined),
    ...optional('booking', booking),
    ...optional('refusalDetail', typeof said === 'string' && carrierReason === undefined ? scrubCredentials(said) : undefined),
    ...optional('refusalFields', named.length === 0 ? undefined : named),
  });
}

// ── the client ──────────────────────────────────────────────────────────────

export function createEngineCarrier(options: EngineCarrierOptions): EngineCarrier {
  const { send, appKey, addOnKey } = options;
  const base = `/api/v1/apps/${encodeURIComponent(appKey)}/shipping`;

  /** One request, one answer. A transport's own error is dropped: it can quote the request it failed on. */
  async function ask(method: EngineRequest['method'], path: string, body: unknown, buying: boolean): Promise<unknown> {
    const noAnswer = () =>
      new EngineCarrierError({
        code: ENGINE_NO_ANSWER,
        message: 'Adminium did not answer.',
        status: null,
        retryable: !buying,
        ...(buying ? { outcome: 'unknown' as const } : {}),
      });
    let status: number;
    let raw: string;
    try {
      const reply = await send(`${base}${path}`, {
        method,
        headers: { accept: 'application/json', ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      status = reply.status;
      raw = await reply.text();
    } catch {
      throw noAnswer();
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = undefined;
    }
    if (status < 200 || status >= 300) throw refusalFrom(status, parsed, buying);
    const data = fieldsOf(parsed)?.data;
    if (data === undefined) throw badAnswer(buying);
    return data;
  }

  return {
    addOnKey,

    async access() {
      return readAccess(reader(false), await ask('GET', '/access', undefined, false), addOnKey);
    },

    async quote(request) {
      const { source, parcel } = request;
      // Named field by field, so nothing a caller added to these objects is ever sent.
      const body = {
        source: { table: source.table, id: source.id },
        parcel: {
          weightKg: parcel.weightKg,
          lengthCm: parcel.lengthCm,
          widthCm: parcel.widthCm,
          heightCm: parcel.heightCm,
          contents: parcel.contents,
        },
        ...optional('purpose', request.purpose),
        ...optional('returnId', request.returnId),
        ...optional('parcelNumber', request.parcelNumber),
        ...(request.customs === undefined
          ? {}
          : {
              customs: {
                certified: true as const,
                ...(request.customs.lines === undefined
                  ? {}
                  : {
                      lines: request.customs.lines.map((one) => ({
                        line: one.line,
                        ...optional('description', one.description),
                        ...optional('hsCode', one.hsCode),
                        ...optional('manufacturerCode', one.manufacturerCode),
                      })),
                    }),
              },
            }),
      };
      const quote = readQuote(reader(false), await ask('POST', '/quotes', body, false));
      if (quote.carrier !== addOnKey) {
        throw new EngineCarrierError({
          code: ENGINE_OTHER_CARRIER,
          message: 'Another carrier is active for this shop.',
          status: null,
          retryable: false,
          outcome: 'refused',
        });
      }
      return quote;
    },

    async bookings(query) {
      const params = new URLSearchParams({ table: query.table, id: query.id });
      if (query.connectionId !== undefined) params.set('connectionId', query.connectionId);
      if (query.purpose !== undefined) params.set('purpose', query.purpose);
      if (query.parcelNumber !== undefined) params.set('parcelNumber', String(query.parcelNumber));
      if (query.returnId !== undefined) params.set('returnId', query.returnId);
      const read = reader(false);
      const raw = read.object(await ask('GET', `/bookings?${params.toString()}`, undefined, false));
      return {
        bookings: read.list(raw.bookings).map((booking) => readBooking(read, booking)),
        bookable: read.flag(raw, 'bookable'),
        blockedBy: read.orNull(raw, 'blockedBy', (from, key) => read.oneOf(from, key, BOOKING_BLOCKS)),
        ...optional('parcelNumber', read.maybe(raw, 'parcelNumber', read.number)),
      };
    },

    async book(request) {
      const body = {
        quoteId: request.quoteId,
        rateId: request.rateId,
        ...optional('confirmEarlier', request.confirmEarlier),
        ...optional('replaceRefunding', request.replaceRefunding),
        ...optional('returnId', request.returnId),
      };
      return readBooking(reader(true), await ask('POST', '/bookings', body, true));
    },

    async checkBooking(id) {
      const read = reader(false);
      const raw = read.object(await ask('POST', `/bookings/${encodeURIComponent(id)}/check`, undefined, false));
      return { outcome: read.oneOf(raw, 'outcome', LOOK_UP_OUTCOMES), booking: readBooking(read, raw.booking) };
    },

    async releaseBooking(id) {
      const body = { declaration: 'no-label-exists' };
      return readBooking(reader(false), await ask('POST', `/bookings/${encodeURIComponent(id)}/release`, body, false));
    },

    async requestRefund(id) {
      const read = reader(false);
      const raw = read.object(await ask('POST', `/bookings/${encodeURIComponent(id)}/refund`, { declaration: 'label-not-used' }, false));
      return { outcome: read.oneOf(raw, 'outcome', REFUND_OUTCOMES), booking: readBooking(read, raw.booking) };
    },

    async checkRefund(id) {
      const read = reader(false);
      const raw = read.object(await ask('POST', `/bookings/${encodeURIComponent(id)}/refund/check`, undefined, false));
      return { outcome: read.oneOf(raw, 'outcome', REFUND_OUTCOMES), booking: readBooking(read, raw.booking) };
    },

    async fetchDocument(id, kind) {
      return readBooking(reader(false), await ask('POST', `/bookings/${encodeURIComponent(id)}/documents/${encodeURIComponent(kind)}`, undefined, false));
    },

    async downloadDocument(id, kind) {
      const noAnswer = () => new EngineCarrierError({ code: ENGINE_NO_ANSWER, message: 'Adminium did not answer.', status: null, retryable: true });
      let reply: EngineReply;
      try {
        reply = await send(`${base}/bookings/${encodeURIComponent(id)}/documents/${encodeURIComponent(kind)}`, { method: 'GET', headers: { accept: 'application/pdf, image/png, application/json' } });
      } catch {
        throw noAnswer();
      }
      if (reply.status < 200 || reply.status >= 300) {
        let parsed: unknown;
        try {
          parsed = JSON.parse(await reply.text());
        } catch {
          parsed = undefined;
        }
        throw refusalFrom(reply.status, parsed, false);
      }
      if (reply.blob === undefined) {
        throw new EngineCarrierError({ code: ENGINE_NO_DOWNLOAD, message: 'This app cannot download a label yet.', status: null, retryable: false });
      }
      try {
        return await reply.blob();
      } catch {
        throw noAnswer();
      }
    },

    async refreshBooking(id) {
      const read = reader(false);
      const raw = read.object(await ask('POST', `/bookings/${encodeURIComponent(id)}/refresh`, undefined, false));
      return { outcome: read.oneOf(raw, 'outcome', REFRESH_OUTCOMES), track: raw.track === null ? null : readTrack(read, raw.track) };
    },

    async refreshOpenParcels() {
      const read = reader(false);
      const raw = read.object(await ask('POST', '/tracking/refresh', undefined, false));
      return {
        outcome: read.oneOf(raw, 'outcome', REFRESH_OPEN_OUTCOMES),
        checked: read.number(raw, 'checked'),
        updated: read.number(raw, 'updated'),
        failed: read.number(raw, 'failed'),
        remaining: read.number(raw, 'remaining'),
        more: read.flag(raw, 'more'),
        oldestCheckedAt: read.orNull(raw, 'oldestCheckedAt', read.number),
        neverChecked: read.number(raw, 'neverChecked'),
        retryAt: read.orNull(raw, 'retryAt', read.number),
      };
    },

    async attention() {
      const read = reader(false);
      const raw = read.object(await ask('GET', '/attention', undefined, false));
      return {
        items: read.list(raw.items).map((item) => readAttentionItem(read, item)),
        more: read.flag(raw, 'more'),
      };
    },

    async customsForm(source) {
      const params = new URLSearchParams({ table: source.table, id: source.id });
      return readCustomsForm(reader(false), await ask('GET', `/customs?${params.toString()}`, undefined, false));
    },

    async international() {
      return readInternational(reader(false), await ask('GET', '', undefined, false));
    },

    async saveInternational(body) {
      const sent = {
        countries: body.countries,
        currency: body.currency,
        originCountry: body.originCountry,
        ...optional('description', body.description),
        ...optional('hsCode', body.hsCode),
        ...optional('signerId', body.signerId),
        ...(body.products === undefined
          ? {}
          : {
              products: body.products.map((one) => ({
                sku: one.sku,
                ...optional('hsCode', one.hsCode),
                ...optional('originCountry', one.originCountry),
                ...optional('manufacturerCode', one.manufacturerCode),
              })),
            }),
        ...(body.exporter === undefined
          ? {}
          : {
              exporter: {
                ...optional('eori', body.exporter.eori),
                ...optional('ioss', body.exporter.ioss),
                ...(body.exporter.taxId === undefined ? {} : { taxId: { type: body.exporter.taxId.type, number: body.exporter.taxId.number } }),
              },
            }),
        ...(body.filingCode === undefined ? {} : { filingCode: body.filingCode }),
      };
      return readInternational(reader(false), await ask('PUT', '/international', sent, false));
    },

    async customsSigners() {
      const read = reader(false);
      const raw = read.object(await ask('GET', '/customs/signers', undefined, false));
      return read.list(raw.signers).map((one) => {
        const signer = read.object(one);
        return { id: read.text(signer, 'id'), name: read.text(signer, 'name') };
      });
    },
  };
}
