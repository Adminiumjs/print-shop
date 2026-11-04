/**
 * The types of the Customiser's browser entry (`index.js` beside this file),
 * as the shop's pages call it.
 *
 * The add-on publishes its editor as built JavaScript; these declarations
 * are written out from its `src/browser/index.ts` for the calls the shop
 * makes, and `src/shop/customiser.test.ts` holds every name declared here
 * to an export the built file really has. `sync-customiser.mjs` leaves this
 * file alone.
 */
import type { JSX } from "react";

export type Row = Record<string, unknown>;

/** One part of a design: its words, font, size and colour, or its logo. */
export interface PartValue {
  text?: string;
  font?: string;
  size?: number;
  colour?: string;
  finish?: string;
  choice?: string;
  mode?: "words" | "logo";
  file?: string;
  fit?: string;
  scale?: number;
  nx?: number;
  ny?: number;
  threshold?: number;
}

/** What a design is made of: its layout and each part's value. */
export interface DesignValues {
  layout?: string;
  palette?: string;
  finish?: string;
  sides?: number;
  parts: Record<string, PartValue>;
  placed?: Row[];
}

export type Reason =
  | "too-long"
  | "required-empty"
  | "font-not-allowed"
  | "size-out-of-range"
  | "colour-not-allowed"
  | "choice-not-allowed"
  | "part-locked"
  | "file-missing"
  | "file-kind"
  | "design-unknown"
  | "format-unknown";

/** Why an order refused a design, and at which part. */
export interface Refusal {
  part?: string;
  reason: Reason;
}

export interface HeldSession {
  token: string;
  level: "lookup" | "verified";
  expiresAt: number;
}

/** The calls of the public client the editor makes. */
export interface ClientLike {
  config: () => Promise<{ assets?: string; pictures?: string; refs: Record<string, { assets?: string[]; pictures?: string[]; limit?: number; filterable?: string[] }> }>;
  list: <T = Row>(ref: string, options?: { where?: unknown; limit?: number; offset?: number; code?: string; signal?: AbortSignal }) => Promise<{ data: T[] }>;
  createWithRank: <T = Row>(ref: string, values: Row) => Promise<{ data: T; link: { key: string; token: string; session: string | null; expiresAt: number | null } | null }>;
  update: <T = Row>(ref: string, id: string, values: Row) => Promise<T>;
  remove?: (ref: string, id: string) => Promise<unknown>;
  openShared: (token: string) => Promise<"opened" | "unknown" | "closed">;
  adoptSession: (session: { token: string; expiresAt: number; level?: "lookup" | "verified" }) => void;
  session: () => HeldSession | null;
  upload?: (ref: string, column: string, file: Blob, name?: string) => Promise<{ id: string; name: string; size: number; kind: string }>;
  file?: (ref: string, id: string | number, column: string) => Promise<{ blob: Blob }>;
}

export interface CustomiserClients {
  /** The app's client, of its customer key. */
  shop: ClientLike;
  /** A new client of the add-on's link key (`customiser-link`), each call a fresh one. */
  link: () => ClientLike;
  /** The address the clients talk to. */
  baseUrl: string;
}

export interface DesignData {
  base_id: string | number;
  ready_design_id: string | number | null;
  values: DesignValues;
}

/** A design kept on the server, with the code an order line names it by. */
export interface SavedDesign extends DesignData {
  id: string | number;
  code: string | null;
  state: "draft" | "ordered";
  updatedAt: string | null;
  session: HeldSession | null;
  files: Readonly<Record<string, string>>;
  link?: string | null;
}

export interface CatalogueRows {
  bases: Row[];
  pieces: Row[];
  areas: Row[];
  ready: Row[];
  parts: Row[];
  fonts: Row[];
  palettes: Row[];
  colours: Row[];
  features: Row[];
  settings?: Row[];
}

/** What the editor asks of Adminium. */
export interface CustomiserApi {
  catalogue: (base: string | number, signal?: AbortSignal) => Promise<CatalogueRows>;
  fontUrl: (font: Row) => Promise<string | null>;
  outlineUrl?: (base: Row) => Promise<string | null>;
  modelUrl?: (base: Row) => Promise<string | null>;
  pieceUrl?: (piece: Row) => Promise<string | null>;
  create: (design: DesignData, email: string | null, files?: Readonly<Record<string, string>>) => Promise<SavedDesign>;
  change: (design: SavedDesign, values: DesignValues, files?: Readonly<Record<string, string>>) => Promise<SavedDesign>;
  remove: (design: SavedDesign) => Promise<void>;
  openLink: (token: string) => Promise<SavedDesign | "unknown" | "closed">;
  reopen: (session: HeldSession) => Promise<SavedDesign | null>;
  byCodes: (codes: readonly string[]) => Promise<SavedDesign[]>;
  upload: ((column: string, file: Blob, name: string, session: HeldSession | null) => Promise<{ id: string; name: string; size: number; kind: string }>) | null;
  file: (design: SavedDesign, column: string) => Promise<Blob | null>;
}

/** The add-on's public entries, by what they hold. */
export declare const REFS: {
  readonly bases: "customiser_bases";
  readonly pieces: "customiser_base_pieces";
  readonly areas: "customiser_base_areas";
  readonly ready: "customiser_ready_designs";
  readonly parts: "customiser_ready_parts";
  readonly fonts: "customiser_fonts";
  readonly palettes: "customiser_palettes";
  readonly colours: "customiser_palette_colours";
  readonly features: "customiser_features";
  readonly settings: "customiser_settings";
  readonly designs: "customiser_designs";
  readonly own: "customiser_designs_claimed";
  readonly byCode: "customiser_designs_unlocked";
};

export declare const DESIGN_FORMAT: 1;
export declare const LOCALES: readonly ["en-US", "de-DE", "fr-FR", "da-DK", "cs-CZ", "ar-EG", "zh-CN", "zh-TW"];

export declare function customiserApi(clients: CustomiserClients): CustomiserApi;

export type Look = "maker" | "print";

export interface EditorPrice {
  total: string;
  each?: string;
  detail?: string;
  ready?: string;
  note?: string;
  pending?: boolean;
}

export interface EditorQuantity {
  value: number;
  min?: number;
  max?: number;
  breaks?: readonly { qty: number; label: string }[];
  onChange: (qty: number) => void;
}

/** A design handed to the app for its basket: the design, and the priced features it uses (their codes). */
export interface DesignForBasket extends SavedDesign {
  used: string[];
}

export interface CustomiserEditorProps {
  api: CustomiserApi;
  base: string | number;
  product: { name: string; price?: string; unit?: string };
  readyDesigns?: readonly (string | number)[];
  design?: SavedDesign | DesignData;
  shop?: string;
  locale?: string;
  look?: Look;
  sides?: 1 | 2;
  price?: EditorPrice;
  quantity?: EditorQuantity;
  featurePrices?: Readonly<Record<string, string>>;
  refused?: Refusal | null;
  email?: string | null;
  addLabel?: string;
  preview?: boolean;
  onDesignChange?: (change: { design: DesignData; used: string[]; ok: boolean }) => void;
  onAddToBasket: (design: DesignForBasket) => void;
  onSaved?: (design: SavedDesign, email: string | null) => void;
  onBack?: () => void;
  start?: "blank";
  onStartBlank?: () => void;
  onSendOwnFile?: () => void;
  onChangeSides?: () => void;
}

export declare function CustomiserEditor(props: CustomiserEditorProps): JSX.Element;

/** One design a browser holds: what the app keeps for "Your designs". */
export interface HeldDesign {
  id: string | number;
  base: string | number;
  session: HeldSession;
  email: string | null;
  savedAt: string;
}

export interface YourDesignsProps {
  api: CustomiserApi;
  held?: readonly HeldDesign[];
  onForget?: (held: HeldDesign) => void;
  codes?: readonly string[];
  locale?: string;
  look?: Look;
  shop?: string;
  onOpen: (design: SavedDesign) => void;
  onOrder: (design: SavedDesign) => void;
  onChoose?: () => void;
}

export declare function YourDesigns(props: YourDesignsProps): JSX.Element;

export interface WaysInProps {
  api: CustomiserApi;
  base: string | number;
  product: string;
  readyDesigns?: readonly (string | number)[];
  locale?: string;
  open?: "choose" | "blank" | "own" | null;
  onChoose: () => void;
  onStartBlank: () => void;
  onSendOwnFile: () => void;
}

export declare function WaysIn(props: WaysInProps): JSX.Element;

export declare function heldDesign(design: SavedDesign, email?: string | null): HeldDesign | null;
export declare function liveDesigns(held: readonly HeldDesign[], now?: number): HeldDesign[];
export declare function hasSavedDesigns(held: readonly HeldDesign[], now?: number): boolean;
export declare function openSavedLink(api: CustomiserApi, token: string): Promise<SavedDesign | "unknown" | "closed">;
export declare function readDesigns(api: CustomiserApi, codes: readonly string[]): Promise<SavedDesign[]>;
export declare function designRefusal(error: unknown): Refusal | null;
