/*
 * VENDORED from add-ons/packages/host/src/contracts/document-render.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The ONE shared contract; the three add-ons here import it by relative path.
 */
/**
 * `document-render@1` — COPIED from `@adminium/add-on-contracts`
 * (`packages/add-on-contracts/src/document-render.ts`), not imported.
 *
 * Same rule as `shipping-carrier.ts` beside it: this repo is published
 * standalone and the package is not on npm here, so the shapes are vendored.
 * Do NOT change one here to make local code compile — a divergence between
 * this copy and the package is a broken contract the conformance suite cannot
 * catch, because the suite is copied from the same place and would move with
 * it.
 *
 * The Zod validators stay behind (24 D7 — a shipped bundle takes no runtime
 * dependency the host lacks). Two runtime values do come across, for the same
 * reason `CarrierError` does: a provider cannot be written without them.
 * `DOCUMENT_LOCALE_IDS` is how an implementation builds an eight-locale record
 * without retyping eight tags eight times, and `isDocumentError` is how a
 * caller narrows `render`'s union.
 *
 * ── WHAT THIS CONTRACT IS FOR ──────────────────────────────────────────────
 *
 * Kinds of document an add-on can DESCRIBE — an outline of slots, labelled in
 * all eight locales — and RENDER to bytes. It is the first contract Adminium
 * itself consumes: the engine document pipeline selects a provider by add-on
 * key and hands it a SUBJECT of values. No database handle, no network, and no
 * clock — `subject.now` is the only time a provider may read, which is what
 * makes "the same subject renders to the same bytes" testable.
 */

/**
 * The eight compiled locales. Named for the contract rather than `Builtin…`
 * because `@adminium/i18n` already exports a `BuiltinLocaleId` whose members
 * are the UNDERSCORE spellings — `en_US`, `ar_EG` — and two same-named unions
 * with different members is a data bug waiting in any tree that imports both.
 */
export const DOCUMENT_LOCALE_IDS = [
  'ar-EG',
  'cs-CZ',
  'da-DK',
  'de-DE',
  'en-US',
  'fr-FR',
  'zh-CN',
  'zh-TW',
] as const;

export type DocumentLocaleId = (typeof DOCUMENT_LOCALE_IDS)[number];

/**
 * A string in every one of the eight locales — no fallback, no partial. A
 * record missing one fails the conformance suite, because these labels are
 * rendered directly in Studio and a hole becomes a raw slot id on a screen.
 */
export type LocalizedText = Readonly<Record<DocumentLocaleId, string>>;

export type DocumentFormat = 'html' | 'pdf';
export type DocumentPaper = 'a4' | 'letter' | 'receipt-80mm';

/**
 * Which glyphs the kind's PDF writer can draw. `ascii` is 0x20..0x7E;
 * `winansi` is base-14 Helvetica's repertoire (Latin-1 plus €, the smart
 * quotes and the dashes); `all` cannot refuse.
 */
export type DocumentCoverage = 'ascii' | 'winansi' | 'all';

export interface DocumentKind {
  id: string;
  label: LocalizedText;
  /** PER KIND. A label sheet is `['pdf']`; "html always" is not the law. */
  formats: readonly DocumentFormat[];
  paper: readonly DocumentPaper[];
  coverage: DocumentCoverage;
}

export type OutlineSlotType =
  | 'text'
  | 'text[]'
  | 'date'
  | 'email'
  | 'money'
  | 'percent'
  | 'currency'
  | 'number'
  | 'collection';

export type OutlineSlotDefault = 'sequence' | 'connection' | 'setting' | 'now';

export interface OutlineSlot {
  id: string;
  label: LocalizedText;
  help?: LocalizedText;
  type: OutlineSlotType;
  required: boolean;
  default?: OutlineSlotDefault;
  /** For `collection` only — the columns of one row. Never nested twice. */
  columns?: readonly OutlineSlot[];
}

export interface DocumentOutline {
  slots: readonly OutlineSlot[];
}

/**
 * A soft reference to the record a document was issued for. Structurally the
 * same object as the engine's own `recordRefSchema`, which is the authority.
 */
export interface RecordRef {
  connectionId: string;
  table: string;
  pk: Readonly<Record<string, unknown>>;
  label: string;
}

/**
 * What a PUBLIC caller may send: values, and nothing that decides anything.
 * The server stamps `business`, `now`, `currency`, `entity` and `number`
 * itself. `customerEmail` is stored and never sent unattended.
 */
export interface PublicDocumentRequest {
  kind: string;
  locale?: string;
  fields: Readonly<Record<string, unknown>>;
  collections: Readonly<Record<string, readonly Readonly<Record<string, unknown>>[]>>;
  customerEmail?: string;
}

export interface DocumentSubject {
  /** The only clock the provider may read. */
  now: { iso: string; timezone: string };
  locale: string;
  /** ISO-4217. */
  currency: string;
  business: { name: string; lines: readonly string[]; logoDataUrl?: string };
  entity: RecordRef | null;
  /** `null` until minted; a re-render carries the number it already has. */
  number: string | null;
  /** Money is INTEGER MINOR UNITS; percent is BASIS POINTS. */
  fields: Readonly<Record<string, unknown>>;
  collections: Readonly<Record<string, readonly Readonly<Record<string, unknown>>[]>>;
}

export interface RenderInput {
  kind: string;
  subject: DocumentSubject;
  formats: readonly DocumentFormat[];
  paper: DocumentPaper;
  /** The add-on's own non-secret values. A secret never reaches a renderer. */
  settings: Readonly<Record<string, unknown>>;
  /**
   * The authored composition, when there is one. OPAQUE by ruling: the
   * provider owns the schema and validates it, so a new block kind is a
   * provider release rather than a contract release across eighteen repos.
   */
  body?: Readonly<Record<string, unknown>>;
}

export interface RenderedDocument {
  format: DocumentFormat;
  filename: string;
  mediaType: string;
  /** The document itself — not a file reference, whose `bytes` is a count. */
  bytes: Uint8Array;
  locale: string;
  warnings: readonly string[];
}

export type DocumentErrorCode =
  | 'LATIN_ONLY'
  | 'UNSUPPORTED_KIND'
  | 'MISSING_SLOT'
  | 'INVALID_SUBJECT';

/**
 * A refusal is DATA, returned — never thrown, and never a silent partial
 * result. A writer that dropped the letters it could not draw would ship an
 * invoice with a customer's name missing characters and tell nobody.
 */
export interface DocumentError {
  code: DocumentErrorCode;
  detail?: string;
  /** `LATIN_ONLY` only: the glyphs that could not be drawn. */
  dropped?: readonly string[];
}

/** Narrows `render`'s union without a `code in x` incantation at every call site. */
export function isDocumentError(
  value: readonly RenderedDocument[] | DocumentError,
): value is DocumentError {
  return !Array.isArray(value);
}

export interface DocumentRenderer {
  /** The add-on's key — how a profile names the provider it wants. */
  readonly key: string;
  kinds(): readonly DocumentKind[];
  describe(kind: string): DocumentOutline;
  render(input: RenderInput): Promise<readonly RenderedDocument[] | DocumentError>;
}
