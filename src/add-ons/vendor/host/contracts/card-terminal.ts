/*
 * VENDORED from add-ons/packages/host/src/contracts/card-terminal.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The shared contract the add-ons the works mounts are written against.
 */
/**
 * `card-terminal@1` — COPIED from `@adminium/add-on-contracts`
 * (`packages/add-on-contracts/src/card-terminal.ts`), not imported, with its
 * Zod validators moved to `../testing/card-terminal-schemas.ts` (the rule
 * `payment-provider.ts` here explains). Do NOT change a shape here to make local
 * code compile: a divergence from the package is a broken contract.
 */
import type {
  CredentialCheck,
  MinorAmount,
  PaymentEvent,
  PaymentMode,
  PaymentProviderContext,
  ProviderError,
  RefundInput,
  RefundState,
} from './payment-provider.ts';

export const CARD_TERMINAL_CONTRACT = 'card-terminal';
export const CARD_TERMINAL_VERSION = 1;
/** The server half's export an add-on providing the contract names. */
export const CARD_TERMINAL_FACTORY = 'createCardTerminal';

/** Where a charge on a reader stands. */
export const READER_CHARGE_STATUSES = ['waiting', 'on_reader', 'succeeded', 'declined', 'cancelled', 'offline'] as const;
export type ReaderChargeStatus = (typeof READER_CHARGE_STATUSES)[number];

/** A location the service keeps readers under (a shop, a counter). */
export interface ReaderLocation {
  readonly id: string;
  readonly name: string;
}
export interface ReaderLocations {
  readonly ok: true;
  readonly locations: readonly ReaderLocation[];
}
/** A reader the account holds. */
export interface Reader {
  readonly id: string;
  /** The name staff gave it ("Front counter"). */
  readonly label: string;
  readonly locationId: string | null;
  /** The model as the service names it ("BBPOS WisePOS E"). */
  readonly model: string | null;
  readonly online: boolean;
  /** When the service last heard from it, epoch ms, or null. */
  readonly lastSeenAt: number | null;
}
export interface ReaderList {
  readonly ok: true;
  readonly readers: readonly Reader[];
}
/** The first step of pairing: which way it runs, and the code when the person types it on the reader. */
export interface PairingStarted {
  readonly ok: true;
  /** `enter`: the reader shows a code the person types into Studio; `show`: the person types `code` on the reader. */
  readonly way: 'enter' | 'show';
  /** The code to type on the reader (`show`); null for `enter`. */
  readonly code: string | null;
  /** Passed back to `finishPairing`. */
  readonly pairing: string;
  /** Until when the pairing waits, epoch ms. */
  readonly expiresAt: number;
}
/** The second step: the reader paired, or still waiting for the person (`show`). */
export type PairingFinished = { readonly ok: true; readonly state: 'paired'; readonly reader: Reader } | { readonly ok: true; readonly state: 'waiting' };
export interface ReaderUnpaired {
  readonly ok: true;
}
/** An amount put on a reader. */
export interface ReaderChargeInput {
  readonly readerId: string;
  /** What is asked, the tip excluded. */
  readonly amount: string;
  readonly currency: string;
  /** Adminium's attempt id: the charge carries it, so a lost answer can be found again. */
  readonly attemptId: string;
  /** The same key for the same charge: sent again, it is one charge. */
  readonly idempotencyKey: string;
  /** Whether the reader offers a tip before the card. */
  readonly tipping: boolean;
}

/** Where a charge stands, as the reader says it. */
export interface ReaderChargeState {
  readonly ok: true;
  /** The service's own id for the charge: passed to `readerStatus` and `cancelOnReader`. */
  readonly ref: string;
  readonly status: ReaderChargeStatus;
  /** Taken in all, the tip included, once `succeeded`; null before. */
  readonly amount: string | null;
  /** The tip, once `succeeded`; "0" with none. */
  readonly tip: string | null;
  readonly currency: string;
  /** The payment's reference at the service once taken: what a refund names. */
  readonly paymentRef: string | null;
  /** The card's brand ("Visa"), its last four, and the bank's approval code, once taken. */
  readonly brand: string | null;
  readonly last4: string | null;
  readonly approvalCode: string | null;
  /** Whether the card was Interac (refunded only on the reader). */
  readonly interac: boolean;
  /** The service's words for a decline, or null. */
  readonly failureMessage: string | null;
}
/** Disputes and refunds made at the service, by polling (a reader payment has no webhook). */
export interface TerminalEvents {
  readonly ok: true;
  readonly events: readonly PaymentEvent[];
  readonly cursor: string | null;
  readonly more: boolean;
}
/** One card-reader service. */
export interface CardTerminal {
  readonly key: string;
  readonly mode: PaymentMode;
  checkCredentials(): Promise<CredentialCheck | ProviderError>;
  listLocations(): Promise<ReaderLocations | ProviderError>;
  listReaders(locationId?: string | null): Promise<ReaderList | ProviderError>;
  startPairing(input: { label: string; locationId: string | null }): Promise<PairingStarted | ProviderError>;
  finishPairing(input: { pairing: string; code: string | null }): Promise<PairingFinished | ProviderError>;
  unpairReader(readerId: string): Promise<ReaderUnpaired | ProviderError>;
  /** Puts the amount on the reader. Sent again with the same key, it answers the same charge. */
  sendToReader(input: ReaderChargeInput): Promise<ReaderChargeState | ProviderError>;
  /** An unknown ref is `NOT_FOUND`, never a throw. */
  readerStatus(ref: string): Promise<ReaderChargeState | ProviderError>;
  /** Takes the amount off the reader. A card taken first answers `succeeded`: that is a payment. */
  cancelOnReader(ref: string): Promise<ReaderChargeState | ProviderError>;
  refund(input: RefundInput): Promise<RefundState | ProviderError>;
  refundStatus(ref: string): Promise<RefundState | ProviderError>;
  listEvents(cursor: string | null): Promise<TerminalEvents | ProviderError>;
  toMinor(amount: string, currency: string): MinorAmount | ProviderError;
  fromMinor(minor: string, currency: string): string | ProviderError;
}

export type CreateCardTerminal = (context: PaymentProviderContext) => CardTerminal;

/** The schema each answer must pass, by call. */
