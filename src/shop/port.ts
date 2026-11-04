/**
 * What the shop's pages ask of Adminium, and the shapes it answers in.
 *
 * The pages never work a figure out: a price is a dry run's, a total the
 * row the order wrote, a ready-by the one Adminium stamped. Money stays the
 * decimal text the server sent ("87.55") until it is formatted.
 */
import type { CustomiserApi } from "../../vendor/customiser/index.js";

export type Id = string | number;
export type Row = Record<string, unknown>;

/** How a product is printed: on press sheets in breaks, or by the square metre from a roll. */
export type ProductKind = "sheet" | "large";

export interface Product {
  id: Id;
  code: string;
  name: string;
  family: string;
  kind: ProductKind;
  line: string | null;
  /** The quantity its "from" price is for. */
  fromQty: number;
  /** A large-format product's size to start from, and the largest it is made. */
  defaultWidth: number | null;
  defaultHeight: number | null;
  maxWidth: number | null;
  maxHeight: number | null;
  icon: string | null;
  photo: string | null;
  /** The Customiser's base it is designed on: set, the page offers the Customiser's ways in. */
  baseId: Id | null;
}

export type OptionKind = "material" | "size" | "sides" | "lamination" | "spot_uv" | "corners" | "edges" | "canvas" | "feature";

/** One of a product's own options: a material, a size, its sides, a finish, or a priced feature. */
export interface Option {
  id: Id;
  productId: Id;
  kind: OptionKind;
  code: string;
  name: string;
  materialId: Id | null;
  sizeId: Id | null;
  sides: number | null;
  finishId: Id | null;
  /** A material: the stock is coated. A lamination or spot UV: it needs a coated surface. */
  coated: boolean;
  /** A feature's price, flat for the job. */
  price: string;
  featureCode: string | null;
  preselected: boolean;
}

export interface Material {
  id: Id;
  code: string;
  name: string;
  shortName: string | null;
  spec: string | null;
  kind: "sheet" | "roll";
  coated: boolean;
  gsm: number;
  /** A sheet stock's price a press sheet; a roll's a square metre. */
  rate: string;
  rollWidth: number | null;
}

export interface Size {
  id: Id;
  code: string;
  name: string;
  width: number;
  height: number;
}

export interface Finish {
  id: Id;
  code: string;
  name: string;
  group: string;
}

export interface Break {
  id: Id;
  minQty: number;
}

export type PackagingBasis = "included" | "unit" | "per_500";

export interface Packaging {
  id: Id;
  code: string;
  name: string;
  basis: PackagingBasis;
  price: string;
  productKind: ProductKind;
}

export interface Band {
  id: Id;
  code: string;
  name: string;
  tube: boolean;
  maxKg: string | null;
  price: string;
}

export type RuleTest = "uncoated" | "roll" | "no_lamination" | "over_gsm";

/** A finish not offered on something, in the words the configurator shows beside it. */
export interface Rule {
  id: Id;
  group: string;
  test: RuleTest;
  gsm: number | null;
  reason: string;
}

/** The works and the rate card's single figures, as its settings row says them. */
export interface Works {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  hours: string | null;
  about: string | null;
  taxRate: string | null;
  standardDays: number | null;
  expressDays: number | null;
  expressPercent: string | null;
  proofPostPrice: string | null;
  proofPostDays: number | null;
  artworkMaxMb: number;
  minDpi: number;
  takingOrders: boolean;
}

export interface Catalogue {
  products: Product[];
  options: Option[];
  materials: Material[];
  sizes: Size[];
  finishes: Finish[];
  breaks: Break[];
  packaging: Packaging[];
  bands: Band[];
  rules: Rule[];
  works: Works;
}

/** The server's zone and money, from its config. */
export interface ShopConfig {
  timezone: string;
  currency: string | null;
}

/** What a customer chose for one job, as the order's job row takes it. Never a price. */
export interface JobValues {
  product_id: Id;
  qty: number;
  material_option_id: Id;
  sides_option_id: Id;
  size_option_id?: Id;
  width_mm?: number;
  height_mm?: number;
  lamination_option_id?: Id;
  look?: string;
  spot_uv_option_id?: Id;
  corners_option_id?: Id;
  edges_option_id?: Id;
  canvas_option_id?: Id;
  packaging_id?: Id;
  proof_by_post: boolean;
  express: boolean;
  design_code?: string;
}

/** A file the customer sent for a job: the upload's id, and the checks they were shown. */
export interface ArtworkValues {
  name: string;
  file: string;
  side: "front" | "back" | "both";
  checks: StoredChecks;
  accepted: boolean;
}

/** "What we showed you": each check's level and words, in the language they were shown in. */
export interface StoredChecks {
  language: string;
  rows: { check: string; level: CheckLevel; text: string }[];
}

export type CheckLevel = "pos" | "warn" | "danger" | "info";

export interface JobNode {
  values: JobValues;
  children?: {
    job_features?: { values: { option_id: Id } }[];
    artwork?: { values: ArtworkValues }[];
  };
}

/** An order as the page sends it: the customer's values, and each job with its features and artwork. */
export interface OrderBody {
  values: Row;
  children: { jobs: JobNode[] };
}

/** What a dry run or a save answers: the order's figures, and each job's. */
export interface Figures {
  order: Row;
  jobs: Row[];
}

/** An order placed: its figures, and its own link. */
export interface Placed extends Figures {
  replayed: boolean;
  link: { token: string } | null;
}

/** A file Adminium took for a job's artwork, until the order names it. */
export interface Uploaded {
  id: string;
  name: string;
  size: number;
  kind: string;
}

/** A refusal, as the pages read it. */
export interface Refused {
  code: string;
  status: number;
  /** The order's column, or a job's (with its place in the basket). */
  column: string | null;
  child: string | null;
  index: number | null;
  reason: string | null;
  /** On a changed price: the figures the save came to. */
  changed: Figures | null;
  /** The error as the client threw it, for the editor's own reading of a design's refusal. */
  raw: unknown;
}

export interface ShopPort {
  config(): Promise<ShopConfig>;
  catalogue(): Promise<Catalogue>;
  /** A dry run of the order: every figure the save would write, nothing kept. */
  quote(body: OrderBody): Promise<Figures>;
  /** The order, saved once, at the total the customer was shown. */
  place(body: OrderBody, clientKey: string, expectTotal: string): Promise<Placed>;
  /** One artwork file, taken for a job of the order about to be placed. */
  upload(file: Blob, name: string, signal?: AbortSignal): Promise<Uploaded>;
  /** The Customiser's calls, through the shop's own clients. */
  customiser(): CustomiserApi;
}

/** A refusal is a thrown `ShopError`; anything else is a failure to reach Adminium. */
export class ShopError extends Error {
  readonly refused: Refused;
  constructor(refused: Refused, message: string) {
    super(message);
    this.name = "ShopError";
    this.refused = refused;
  }
}

export const isShopError = (error: unknown): error is ShopError => error instanceof ShopError;
