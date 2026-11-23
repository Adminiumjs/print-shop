/*
 * VENDORED from add-ons/packages/host/src/contracts/index.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The shared contract the add-ons the works mounts are written against.
 */
/**
 * The contract mirror, in one entry point.
 *
 * `@adminium/add-on-host/contracts` — the implementation contracts an add-on
 * declares in `manifest.json` under `addOn.provides[]`. Separate from the
 * package's main entry on purpose: the main entry is the HOST's seam (what
 * `register()` returns), this is the CONTRACT registry (what an engine
 * implements), and an add-on that provides neither `artwork-source` nor
 * `shipping-carrier` should not have to load either.
 *
 * It also keeps the shipped bytes honest. `CarrierError`, `isDocumentError`
 * and `DOCUMENT_LOCALE_IDS` are the runtime values in here, so the delivery
 * add-on's bundle pulls this file in and the artwork add-ons' bundles do not —
 * and neither ever pulls in the host seam, which they import as types alone.
 */

export type { FileRef } from './common.ts';
export type {
  ArtworkRef,
  ArtworkSource,
  AvailabilityVerdict,
  JobSpec,
} from './artwork-source.ts';
export { DOCUMENT_LOCALE_IDS, isDocumentError } from './document-render.ts';
export type {
  DocumentCoverage,
  DocumentError,
  DocumentErrorCode,
  DocumentFormat,
  DocumentKind,
  DocumentLocaleId,
  DocumentOutline,
  DocumentPaper,
  DocumentPictureMediaType,
  DocumentPictureValue,
  DocumentQrValue,
  DocumentRenderer,
  DocumentSubject,
  LocalizedText,
  OutlineSlot,
  OutlineSlotDefault,
  OutlineSlotType,
  PublicDocumentRequest,
  RecordRef,
  RenderInput,
  RenderedDocument,
} from './document-render.ts';
export type {
  Personalization,
  PreviewRef,
  ProductPersonalizer,
  ProductRef,
  Template,
  Verdict,
  Zone,
  ZoneFinish,
  ZoneKind,
} from './product-personalizer.ts';
export {
  BOOK_OUTCOME_UNKNOWN,
  CANCEL_STATES,
  CARRIER_OUTCOMES,
  CARRIER_REFUSALS,
  CUSTOMS_CONTENTS,
  CUSTOMS_FILING_CODES,
  CUSTOMS_TAX_ID_TYPES,
  CarrierError,
  HANDOVER_KINDS,
  LABEL_SIZES,
  SHIPMENT_DOCUMENT_KINDS,
  SHIPMENT_PURPOSES,
  SHIPPING_CARRIER_FACTORY,
  classifyBookFailure,
} from './shipping-carrier.ts';
export type {
  Address,
  BookFailure,
  BookingDetails,
  CancelResult,
  CancelState,
  CarrierCredentialCheck,
  CarrierOutcome,
  CarrierRefusal,
  CredentialCheckQuery,
  CustomsContents,
  CustomsDeclaration,
  CustomsExporter,
  CustomsFilingCode,
  CustomsTaxIdType,
  CustomsItem,
  HandoverKind,
  LabelSize,
  OrderRef,
  Parcel,
  QuoteOptions,
  Rate,
  RecoveryResult,
  Shipment,
  ShipmentDocument,
  ShipmentDocumentFile,
  ShipmentDocumentKind,
  ShipmentPurpose,
  ShippingCarrier,
  ShippingCarrierContext,
  ShippingHttpClient,
  ShippingHttpResponse,
  TrackEvent,
  TrackOptions,
} from './shipping-carrier.ts';
export {
  CHECKOUT_STATUSES,
  DISPUTE_STATUSES,
  PAYMENT_EVENT_KINDS,
  PAYMENT_MODES,
  PAYMENT_PROVIDER_CONTRACT,
  PAYMENT_PROVIDER_FACTORY,
  PAYMENT_WEBHOOK_EVENTS_EXPORT,
  PAYMENT_KEY_APP_EXPORT,
  PAYMENT_PROVIDER_VERSION,
  PROVIDER_ERROR_CODES,
  REFUND_REASONS,
  REFUND_STATUSES,
  isProviderError,
  providerError,
} from './payment-provider.ts';
export type {
  CheckoutCreated,
  CheckoutInput,
  CheckoutPayable,
  CheckoutState,
  CheckoutStatus,
  CreatePaymentProvider,
  CredentialCheck,
  ExpireResult,
  MethodList,
  MethodQuery,
  MinorAmount,
  MissedEvents,
  PaidWith,
  PaymentCredentials,
  PaymentEvent,
  PaymentEventKind,
  PaymentDispute,
  DisputeStatus,
  PaymentHttpClient,
  PaymentHttpResponse,
  PaymentMethodInfo,
  PaymentMode,
  PaymentProvider,
  PaymentProviderContext,
  ProviderError,
  ProviderErrorCode,
  RefundInput,
  RefundReason,
  RefundState,
  RefundStatus,
  WebhookDelivery,
} from './payment-provider.ts';
export {
  addAmounts,
  compareAmounts,
  decimalToMinor,
  isoExponent,
  minorToDecimal,
  sameAmount,
  subtractAmounts,
} from './payment-money.ts';

export {
  CARD_TERMINAL_CONTRACT,
  CARD_TERMINAL_FACTORY,
  CARD_TERMINAL_VERSION,
  READER_CHARGE_STATUSES,
} from './card-terminal.ts';
export type {
  CardTerminal,
  CreateCardTerminal,
  PairingFinished,
  PairingStarted,
  Reader,
  ReaderChargeInput,
  ReaderChargeState,
  ReaderChargeStatus,
  ReaderList,
  ReaderLocation,
  ReaderLocations,
  ReaderUnpaired,
  TerminalEvents,
} from './card-terminal.ts';
