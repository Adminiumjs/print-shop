/*
 * VENDORED from add-ons/packages/host/src/contracts/payment-provider.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The shared contract the add-ons the works mounts are written against.
 */
/**
 * `payment-provider@1` — COPIED from `@adminium/add-on-contracts`
 * (`packages/add-on-contracts/src/payment-provider.ts`), not imported, with its
 * Zod validators moved to `../testing/payment-schemas.ts` (the rule
 * `shipping-carrier.ts` here explains: a shipped bundle takes no runtime
 * dependency the host lacks). Do NOT change a shape here to make local code
 * compile: a divergence from the package is a broken contract the conformance
 * suite cannot catch, because the suite is copied from the same place.
 */
export const PAYMENT_PROVIDER_CONTRACT = 'payment-provider';
export const PAYMENT_PROVIDER_VERSION = 1;

/** The name of the factory a server half must export. */
export const PAYMENT_PROVIDER_FACTORY = 'createPaymentProvider';

/**
 * The name of an OPTIONAL second export of the server half: the event types
 * the admin ticks when making the webhook at the provider, in the provider's
 * own spelling (`checkout.session.completed`, `PAYMENT.CAPTURE.COMPLETED`).
 * Studio lists them beside the webhook address with a copy button each, so
 * the admin ticks exactly what the provider half listens for. A server half
 * without it gets a webhook card with no list.
 */
export const PAYMENT_WEBHOOK_EVENTS_EXPORT = 'webhookEvents';

/**
 * The name of an OPTIONAL export of the server half for a provider whose key is
 * made by an app the shop uploads to its own account: `(input: { shopName;
 * installId }) => { appId; appName; files }`. The host's "Download the app
 * template" calls it with a per-install id and zips the files.
 */
export const PAYMENT_KEY_APP_EXPORT = 'keyAppTemplate';

/** A key belongs to one mode; so does every checkout, event and refund made with it. */
export const PAYMENT_MODES = ['test', 'live'] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];

/**
 * How a checkout stands at the provider.
 *
 * `processing`: the money is on its way but not there (SEPA, a voucher, a
 * pending capture). `requires_action`: the customer still has a step to take.
 */
export const CHECKOUT_STATUSES = [
  'pending',
  'processing',
  'succeeded',
  'failed',
  'cancelled',
  'expired',
  'requires_action',
] as const;
export type CheckoutStatus = (typeof CHECKOUT_STATUSES)[number];

/** How a refund stands. `requires_action`: the customer must give bank details. */
export const REFUND_STATUSES = ['pending', 'succeeded', 'failed', 'cancelled', 'requires_action'] as const;
export type RefundStatus = (typeof REFUND_STATUSES)[number];

/** What a verified event is about, so the engine knows which record to look up. */
export const PAYMENT_EVENT_KINDS = ['checkout', 'refund', 'dispute', 'other'] as const;
export type PaymentEventKind = (typeof PAYMENT_EVENT_KINDS)[number];

/** Why a refund is made, in the words the provider's own list uses. */
export const REFUND_REASONS = ['requested_by_customer', 'duplicate', 'fraudulent', 'other'] as const;
export type RefundReason = (typeof REFUND_REASONS)[number];

/**
 * Every refusal code. Closed: an engine branch on a code the contract never
 * named would be a guess.
 */
export const PROVIDER_ERROR_CODES = [
  /** The key or credentials were refused (revoked, wrong, app uninstalled). */
  'CREDENTIALS_REFUSED',
  /** The key works but lacks a permission the call needs. */
  'PERMISSION_MISSING',
  /** The key belongs to the other mode. */
  'MODE_MISMATCH',
  /** No such checkout, payment, refund or event at the provider. */
  'NOT_FOUND',
  /** The amount cannot be represented exactly in the provider's units. */
  'AMOUNT_UNREPRESENTABLE',
  /** The provider takes no payments in this currency. */
  'CURRENCY_UNSUPPORTED',
  /** A webhook's signature did not verify, or it was too old. */
  'SIGNATURE_INVALID',
  /** The provider refused the refund (window passed, more than was taken, disputed). */
  'REFUND_REFUSED',
  /** A checkout could not be ended because it already completed. */
  'ALREADY_COMPLETED',
  /** The provider refused the request as malformed. */
  'INVALID_REQUEST',
  /** Too many requests; try later. */
  'RATE_LIMITED',
  /** The provider could not be reached or failed; try later. */
  'UNAVAILABLE',
] as const;
export type ProviderErrorCode = (typeof PROVIDER_ERROR_CODES)[number];

/** A refusal, returned as data. */
export interface ProviderError {
  readonly ok: false;
  readonly code: ProviderErrorCode;
  /** The provider's own words, shown quoted to staff. Never a secret. */
  readonly providerMessage: string;
  readonly retryable: boolean;
}

/** True for a refusal. Checks the shape, never a class. */
export function isProviderError(value: unknown): value is ProviderError {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { ok?: unknown }).ok === false &&
    typeof (value as { code?: unknown }).code === 'string'
  );
}

/** Builds a refusal. */
export function providerError(code: ProviderErrorCode, providerMessage: string, retryable = false): ProviderError {
  return { ok: false, code, providerMessage, retryable };
}

// ─── Money ──────────────────────────────────────────────────────────────────

export interface MinorAmount {
  readonly minor: string;
  readonly currency: string;
}

// ─── What the engine hands a provider ───────────────────────────────────────

/** The fields of an HTTP response a transport reads. A real `Response` has them all. */
export interface PaymentHttpResponse {
  readonly status: number;
  readonly headers: { get(name: string): string | null };
  text(): Promise<string>;
}

/**
 * The egress-bound client. Only hosts in the add-on's `network.allow` are
 * reachable, and a redirect is refused rather than followed.
 */
export type PaymentHttpClient = (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
) => Promise<PaymentHttpResponse>;

/**
 * One mode's credential fields, decrypted for one call. The field names are
 * the provider's own (a Stripe key; a PayPal client id, secret and webhook id),
 * plus `webhookSecret` where the provider signs webhooks with a shared secret.
 */
export type PaymentCredentials = Readonly<Record<string, string>>;

export interface PaymentProviderContext {
  readonly http: PaymentHttpClient;
  readonly credentials: PaymentCredentials;
  readonly mode: PaymentMode;
}

// ─── The calls ──────────────────────────────────────────────────────────────

/** What `checkCredentials` learns: whose account, which mode, what is missing. */
export interface CredentialCheck {
  readonly ok: true;
  /** The provider's account id (`acct_…`, a PayPal merchant id). Shown everywhere. */
  readonly accountId: string;
  readonly livemode: boolean;
  /** Each missing permission, named in the provider's own dashboard words. Empty when the key is complete. */
  readonly missing: readonly string[];
}

/** The thing being paid, as the provider needs to show it. Never carries a secret. */
export interface CheckoutPayable {
  /** The invoice or record number the customer recognises ("INV-0042"). */
  readonly reference: string;
  /** One line describing it, shown on the provider's page. */
  readonly description: string;
  readonly amount: string;
  readonly currency: string;
  /** Prefills the provider's email field; never required. */
  readonly customerEmail: string | null;
  /** One of Adminium's locales (`en-US`, `ar-EG`, …); the provider maps it to its own. */
  readonly locale: string | null;
}

export interface CheckoutInput {
  readonly payable: CheckoutPayable;
  /** The ways to pay the shop's rules allow for this customer, by the ids `methodsFor` returned. */
  readonly methods: readonly string[];
  /** Where the provider sends the customer back. Adminium's own URLs, never the customer's. */
  readonly successUrl: string;
  readonly cancelUrl: string;
  /** Adminium's attempt id: the provider's client reference and metadata. */
  readonly attemptId: string;
  readonly idempotencyKey: string;
}

export interface CheckoutCreated {
  readonly ok: true;
  /** The provider's id for the checkout (a session id, an order id). */
  readonly ref: string;
  /** The hosted page. The engine checks its host before sending anyone there. */
  readonly url: string;
  /** When the provider will end it (epoch ms), if it says. */
  readonly expiresAt: number | null;
}

/** How the customer paid, as staff will read it. */
export interface PaidWith {
  /** The provider's method id (`card`, `sepa_debit`, `paypal`). */
  readonly method: string;
  /** "Visa ••4242" or the method's name. Never a full number. */
  readonly label: string;
  /** True for a method whose money arrives later (SEPA, vouchers). */
  readonly delayed: boolean;
}

/** How a checkout stands, re-read from the provider (never from a webhook body). */
export interface CheckoutState {
  readonly ok: true;
  readonly ref: string;
  readonly status: CheckoutStatus;
  /** The client reference the checkout was made with: Adminium's attempt id. */
  readonly attemptId: string | null;
  /** What the provider TOOK. Null until money moved. May differ from what was asked. */
  readonly amount: string | null;
  readonly currency: string | null;
  readonly livemode: boolean;
  /** The provider's id for the money itself (a PaymentIntent, a capture), once there is one. */
  readonly paymentRef: string | null;
  readonly paidWith: PaidWith | null;
  /** When the provider says it succeeded (epoch ms). */
  readonly settledAt: number | null;
  /** The provider's words for a failure, if any. */
  readonly failureMessage: string | null;
}

export interface ExpireResult {
  readonly ok: true;
  readonly ref: string;
  /** The checkout's state after the call: `expired`, or what it already was. */
  readonly status: CheckoutStatus;
}

export interface RefundInput {
  /** The provider's id for the money (`CheckoutState.paymentRef`). */
  readonly paymentRef: string;
  readonly amount: string;
  readonly currency: string;
  readonly reason: RefundReason;
  /** Minted at the confirm step, bound to (payment, amount), reused on every retry. */
  readonly idempotencyKey: string;
}

export interface RefundState {
  readonly ok: true;
  /** The provider's id for the refund. */
  readonly ref: string;
  readonly paymentRef: string;
  readonly status: RefundStatus;
  readonly amount: string;
  readonly currency: string;
  readonly failureMessage: string | null;
}

/** A webhook's identity, after its signature verified. Never a status to trust. */
export interface PaymentEvent {
  readonly ok: true;
  /** The provider's event id: unique per provider and mode. */
  readonly eventId: string;
  /** The provider's own type (`checkout.session.completed`). */
  readonly type: string;
  readonly kind: PaymentEventKind;
  /** The checkout the event is about (a session or order id), when it says. */
  readonly checkoutRef: string | null;
  /** The money it is about (a PaymentIntent or capture), when it says. */
  readonly paymentRef: string | null;
  /** The refund it is about, when it says. */
  readonly refundRef: string | null;
  readonly livemode: boolean;
  /** When the provider made the event (epoch ms). */
  readonly occurredAt: number;
}

export interface MissedEvents {
  readonly ok: true;
  readonly events: readonly PaymentEvent[];
  /** Pass back next time. Null when the provider keeps no cursor. */
  readonly cursor: string | null;
  /** More events wait past this page. */
  readonly more: boolean;
}

/** A way to pay the account has switched on. */
export interface PaymentMethodInfo {
  /** The provider's id, passed back in `CheckoutInput.methods`. */
  readonly id: string;
  /** Its name, as staff see it ("Cards", "Link (Stripe)", "SEPA Direct Debit"). */
  readonly label: string;
  readonly delayed: boolean;
}

export interface MethodList {
  readonly ok: true;
  readonly methods: readonly PaymentMethodInfo[];
}

export interface MethodQuery {
  /** ISO 3166-1 alpha-2, the customer's country, or null when unknown. */
  readonly country: string | null;
  readonly currency: string;
  readonly amount: string;
}

/** A webhook as received: the exact bytes (as UTF-8 text) and the headers, names in lower case. */
export interface WebhookDelivery {
  readonly rawBody: string;
  readonly headers: Readonly<Record<string, string | undefined>>;
}

/**
 * One payment service. Every method may return a `ProviderError` instead of
 * its answer; none throws for an ordinary refusal.
 */
export interface PaymentProvider {
  /** The add-on's key. */
  readonly key: string;
  readonly mode: PaymentMode;
  checkCredentials(): Promise<CredentialCheck | ProviderError>;
  createCheckout(input: CheckoutInput): Promise<CheckoutCreated | ProviderError>;
  /** An unknown ref is `NOT_FOUND`, never a throw. */
  status(ref: string): Promise<CheckoutState | ProviderError>;
  /** Finishes a two-step payment (a PayPal capture). A one-step provider returns `status(ref)`. */
  complete(ref: string, idempotencyKey: string): Promise<CheckoutState | ProviderError>;
  /** Ends an open checkout. One that already completed is `ALREADY_COMPLETED`. */
  expire(ref: string): Promise<ExpireResult | ProviderError>;
  refund(input: RefundInput): Promise<RefundState | ProviderError>;
  refundStatus(ref: string): Promise<RefundState | ProviderError>;
  verifyWebhook(delivery: WebhookDelivery): Promise<PaymentEvent | ProviderError>;
  listMissedEvents(cursor: string | null): Promise<MissedEvents | ProviderError>;
  methodsFor(query: MethodQuery): Promise<MethodList | ProviderError>;
  /** The provider's own exponent table. Refuses an amount it cannot hold exactly. */
  toMinor(amount: string, currency: string): MinorAmount | ProviderError;
  fromMinor(minor: string, currency: string): string | ProviderError;
}

/** The server half's export. Called once per operation. */
export type CreatePaymentProvider = (context: PaymentProviderContext) => PaymentProvider;
