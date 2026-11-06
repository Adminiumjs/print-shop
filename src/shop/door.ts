/**
 * The shop's door into a real Adminium: the public API through the shop's
 * browser keys, one client each. The shop's own key (`customer`) reads the
 * rate card and the catalogue, takes the customer's artwork and places an
 * order; the `order` key opens the one order a placed order's link names;
 * the Customiser's link key holds a saved design.
 *
 * Every figure is Adminium's. A price is a dry run of the order (`quote`);
 * an order is saved once, carrying the total the customer was shown and a
 * retry key, and a save that would come to another total is refused with the
 * figures it came to. A retry of an order already made answers that order.
 */
import { createPublicClient, newClientKey, pictureUrl, PublicApiError, type PublicClient, type PublicConfig } from "@adminiumjs/public-client";

import { customiserApi, REFS as CUSTOMISER_REFS, type ClientLike, type CustomiserApi } from "../../vendor/customiser/index.js";
import { AdminiumAfter, keyClient, type AfterPort } from "./after-port.ts";
import { ARTWORK_COLUMN, KEYS, shopRefs, type ShopRefs } from "./refs.ts";
import {
  ShopError,
  type Band,
  type Break,
  type Catalogue,
  type Figures,
  type Finish,
  type Id,
  type Material,
  type Option,
  type OptionKind,
  type OrderBody,
  type Packaging,
  type PackagingBasis,
  type Placed,
  type Product,
  type Refused,
  type Row,
  type Rule,
  type RuleTest,
  type SavedQuote,
  type ShopConfig,
  type QuoteBody,
  type QuoteFigures,
  type ShopPort,
  type Size,
  type Uploaded,
  type Works,
} from "./port.ts";

export interface ShopServed {
  baseUrl: string;
  publishableKey: string;
  tables?: Record<string, string>;
  publicKeys?: Record<string, string>;
  /** The app's own settings as Adminium serves them (its working days, its cut-off). */
  settings?: Record<string, unknown>;
}

export interface ShopDoorOptions {
  /** Test seam; `globalThis.fetch` otherwise. */
  fetch?: typeof fetch;
  /** Test seam: the human check, as the client takes it. */
  humanCheck?: boolean | { refs?: readonly string[]; claim?: boolean };
}

const PAGE = 200;
/** The child list an order's jobs come back under. */
const JOBS = "jobs";
/** The child list a saved quote's lines come back under. */
const QUOTE_LINES = "quote_lines";

const text = (value: unknown): string | null => (value === null || value === undefined || value === "" ? null : String(value));
const num = (value: unknown): number | null => (value === null || value === undefined || value === "" || Number.isNaN(Number(value)) ? null : Number(value));
/** A yes/no as every engine answers it (SQLite and MySQL may say 0 and 1). */
const yes = (value: unknown): boolean => value === true || value === 1 || value === "1" || value === "true";
const id = (value: unknown): Id | null => (value === null || value === undefined || value === "" ? null : (value as Id));
const byPosition = (a: Row, b: Row) => Number(a["position"] ?? 0) - Number(b["position"] ?? 0) || Number(a["id"]) - Number(b["id"]);

/** The client's refusal as the pages read one. */
export function refusalOf(error: unknown): Refused | null {
  if (!(error instanceof PublicApiError)) return null;
  const params = error.params;
  const changed = error.priceChanged;
  return {
    code: error.code,
    status: error.status,
    column: typeof params["column"] === "string" ? params["column"] : null,
    child: typeof params["child"] === "string" ? params["child"] : null,
    index: typeof params["index"] === "number" ? params["index"] : null,
    reason: typeof params["reason"] === "string" ? params["reason"] : null,
    changed: changed === null ? null : { order: { total: changed.total }, jobs: (changed.lines[JOBS] ?? []).map((line) => line.data) },
    raw: error,
  };
}

async function answer<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    const refused = refusalOf(error);
    if (refused !== null) throw new ShopError(refused, (error as Error).message);
    throw error;
  }
}

function product(row: Row, photo: string | null): Product {
  return {
    id: row["id"] as Id,
    code: String(row["code"] ?? ""),
    name: String(row["name"] ?? ""),
    family: String(row["family"] ?? ""),
    kind: row["kind"] === "large" ? "large" : "sheet",
    line: text(row["line"]),
    fromQty: num(row["from_qty"]) ?? 1,
    defaultWidth: num(row["default_width_mm"]),
    defaultHeight: num(row["default_height_mm"]),
    maxWidth: num(row["max_width_mm"]),
    maxHeight: num(row["max_height_mm"]),
    icon: text(row["icon"]),
    photo,
    baseId: id(row["base_id"]),
  };
}

const option = (row: Row): Option => ({
  id: row["id"] as Id,
  productId: row["product_id"] as Id,
  kind: String(row["kind"]) as OptionKind,
  code: String(row["code"] ?? ""),
  name: String(row["name"] ?? ""),
  materialId: id(row["material_id"]),
  sizeId: id(row["size_id"]),
  sides: num(row["sides"]),
  finishId: id(row["finish_id"]),
  coated: yes(row["coated"]),
  price: String(row["price"] ?? "0"),
  featureCode: text(row["feature_code"]),
  preselected: yes(row["preselected"]),
});

const material = (row: Row): Material => ({
  id: row["id"] as Id,
  code: String(row["code"] ?? ""),
  name: String(row["name"] ?? ""),
  shortName: text(row["short_name"]),
  spec: text(row["spec"]),
  kind: row["kind"] === "roll" ? "roll" : "sheet",
  coated: yes(row["coated"]),
  gsm: num(row["gsm"]) ?? 0,
  rate: String(row["rate"] ?? "0"),
  rollWidth: num(row["roll_width_mm"]),
});

const size = (row: Row): Size => ({
  id: row["id"] as Id,
  code: String(row["code"] ?? ""),
  name: String(row["name"] ?? ""),
  width: num(row["width_mm"]) ?? 0,
  height: num(row["height_mm"]) ?? 0,
  up: num(row["up"]),
  direct: yes(row["direct"]),
});
const finish = (row: Row): Finish => ({ id: row["id"] as Id, code: String(row["code"] ?? ""), name: String(row["name"] ?? ""), group: String(row["group"] ?? "") });
const breakRow = (row: Row): Break => ({ id: row["id"] as Id, minQty: num(row["min_qty"]) ?? 1 });
const packaging = (row: Row): Packaging => ({
  id: row["id"] as Id,
  code: String(row["code"] ?? ""),
  name: String(row["name"] ?? ""),
  basis: String(row["basis"] ?? "included") as PackagingBasis,
  price: String(row["price"] ?? "0"),
  productKind: row["product_kind"] === "large" ? "large" : "sheet",
});
const band = (row: Row): Band => ({ id: row["id"] as Id, code: String(row["code"] ?? ""), name: String(row["name"] ?? ""), tube: yes(row["tube"]), maxKg: text(row["max_kg"]), price: String(row["price"] ?? "0") });
const rule = (row: Row): Rule => ({ id: row["id"] as Id, group: String(row["finish_group"] ?? ""), test: String(row["test"]) as RuleTest, gsm: num(row["gsm"]), reason: String(row["reason"] ?? "") });

function works(row: Row): Works {
  return {
    name: String(row["works_name"] ?? ""),
    address: text(row["address"]),
    phone: text(row["phone"]),
    email: text(row["email"]),
    hours: text(row["hours"]),
    about: text(row["about"]),
    taxRate: text(row["tax_rate"]),
    standardDays: num(row["standard_days"]),
    expressDays: num(row["express_days"]),
    expressPercent: text(row["express_percent"]),
    proofPostPrice: text(row["proof_post_price"]),
    proofPostDays: num(row["proof_post_days"]),
    changeDays: num(row["change_days"]),
    tubeMaxMm: num(row["tube_max_mm"]),
    refPrefix: text(row["ref_prefix"]),
    quotePrefix: text(row["quote_prefix"]),
    artworkMaxMb: num(row["artwork_max_mb"]) ?? 100,
    minDpi: num(row["min_dpi"]) ?? 150,
    takingOrders: row["taking_orders"] === undefined ? true : yes(row["taking_orders"]),
  };
}

/** The catalogue's rows, as the public entries answer them. */
export interface CatalogueRows {
  products: Row[];
  options: Row[];
  materials: Row[];
  sizes: Row[];
  finishes: Row[];
  breaks: Row[];
  packaging: Row[];
  bands: Row[];
  rules: Row[];
  settings: Row[];
}

/** The catalogue the pages read, from its rows: the same reading whoever answers them. */
export function catalogueFrom(rows: CatalogueRows, photo: (row: Row) => string | null): Catalogue {
  return {
    products: rows.products.map((row) => product(row, photo(row))),
    options: rows.options.map(option),
    materials: rows.materials.map(material),
    sizes: rows.sizes.map(size),
    finishes: rows.finishes.map(finish),
    breaks: rows.breaks.map(breakRow).sort((a, b) => a.minQty - b.minQty),
    packaging: rows.packaging.map(packaging),
    bands: rows.bands.map(band),
    rules: rows.rules.map(rule),
    works: works(rows.settings[0] ?? {}),
  };
}

/** The order and each job, out of a client's answer. */
const figuresOf = (made: { data: Row; children: Record<string, { data: Row }[]> }): Figures => ({ order: made.data, jobs: (made.children[JOBS] ?? []).map((job) => job.data) });

export class AdminiumShop implements ShopPort {
  private readonly served: ShopServed;
  private readonly refs: ShopRefs;
  private readonly fetchImpl: typeof fetch | undefined;
  readonly client: PublicClient;
  /** The order key's client: the session a placed order's link opens is held here. */
  readonly orderClient: PublicClient | null;
  private config$: Promise<PublicConfig> | null = null;
  private api: CustomiserApi | null = null;
  private afterPort: AfterPort | null = null;

  constructor(served: ShopServed, options: ShopDoorOptions = {}) {
    this.served = served;
    this.refs = shopRefs(served.tables);
    this.fetchImpl = options.fetch;
    const make = (publishableKey: string, humanCheck: ShopDoorOptions["humanCheck"]) =>
      createPublicClient({ baseUrl: served.baseUrl, publishableKey, ...(options.fetch === undefined ? {} : { fetch: options.fetch }), ...(humanCheck === undefined ? {} : { humanCheck }) });
    // Placing an order, saving a quote, asking for samples and saving a design all ask the human check: solved before they are sent.
    const client = make(served.publishableKey, options.humanCheck ?? { refs: [this.refs.placeOrder, this.refs.saveQuote, this.refs.samplePack, CUSTOMISER_REFS.designs] });
    if (client === null) throw new Error("The shop's key could not be used.");
    this.client = client;
    const orderKey = served.publicKeys?.[KEYS.order];
    this.orderClient = orderKey === undefined ? null : make(orderKey, false);
  }

  private clientConfig(): Promise<PublicConfig> {
    this.config$ ??= this.client.config().catch((error: unknown) => {
      this.config$ = null;
      throw error;
    });
    return this.config$;
  }

  private async list(ref: string): Promise<Row[]> {
    const rows: Row[] = [];
    for (let offset = 0; offset < 50 * PAGE; offset += PAGE) {
      const page = await this.client.list<Row>(ref, { limit: PAGE, offset });
      rows.push(...page.data);
      if (page.data.length < PAGE) break;
    }
    return rows.sort(byPosition);
  }

  config(): Promise<ShopConfig> {
    return answer(async () => {
      const config = await this.clientConfig();
      return { timezone: config.timezone, currency: config.currency };
    });
  }

  catalogue(): Promise<Catalogue> {
    return answer(async () => {
      const r = this.refs;
      const [products, options, materials, sizes, finishes, breaks, packs, bands, rules, settings] = await Promise.all(
        [r.products, r.options, r.materials, r.sizes, r.finishes, r.breaks, r.packaging, r.deliveryBands, r.optionRules, r.settings].map((ref) => this.list(ref)),
      );
      const config = await this.clientConfig();
      const photo = (row: Row) => pictureUrl(this.served.baseUrl, config, r.products, String(row["id"]), "photo", row["photo"]);
      return catalogueFrom({ products: products!, options: options!, materials: materials!, sizes: sizes!, finishes: finishes!, breaks: breaks!, packaging: packs!, bands: bands!, rules: rules!, settings: settings! }, photo);
    });
  }

  quote(body: OrderBody): Promise<Figures> {
    return answer(async () => figuresOf(await this.client.quote<Row>(this.refs.placeOrder, { values: body.values, children: body.children as never })));
  }

  place(body: OrderBody, clientKey: string, expectTotal: string): Promise<Placed> {
    return answer(async () => {
      const made = await this.client.createTree<Row>(this.refs.placeOrder, {
        values: { ...body.values, client_key: clientKey },
        children: body.children as never,
        expect: { total: expectTotal },
      });
      // The order's own link, a session on it already open: the order's page needs no claim.
      if (made.link !== null && this.orderClient !== null && made.link.session !== null && made.link.expiresAt !== null) {
        this.orderClient.adoptSession({ token: made.link.session, expiresAt: made.link.expiresAt, level: "verified" });
      }
      return { ...figuresOf(made), replayed: made.replayed, link: made.link === null ? null : { token: made.link.token } };
    });
  }

  priceQuote(body: QuoteBody): Promise<QuoteFigures> {
    return answer(async () => {
      const made = await this.client.quote<Row>(this.refs.saveQuote, { values: body.values, children: body.children as never });
      return { quote: made.data, lines: (made.children[QUOTE_LINES] ?? []).map((line) => line.data) };
    });
  }

  saveQuote(body: QuoteBody, clientKey: string, expectTotal: string): Promise<SavedQuote> {
    return answer(async () => {
      const made = await this.client.createTree<Row>(this.refs.saveQuote, { values: { ...body.values, client_key: clientKey }, children: body.children as never, expect: { total: expectTotal } });
      const link = made.link !== null && made.link.session !== null && made.link.expiresAt !== null ? { token: made.link.token, session: { token: made.link.session, expiresAt: made.link.expiresAt } } : null;
      return { quote: made.data, lines: (made.children[QUOTE_LINES] ?? []).map((line) => line.data), replayed: made.replayed, link };
    });
  }

  after(): AfterPort {
    if (this.afterPort !== null) return this.afterPort;
    const quoteKey = this.served.publicKeys?.[KEYS.quote];
    this.afterPort = new AdminiumAfter(
      {
        client: this.client,
        orderClient: this.orderClient,
        quoteClient: quoteKey === undefined ? null : (session) => keyClient(this.served.baseUrl, quoteKey, this.fetchImpl, session),
      },
      this.served.tables,
    );
    return this.afterPort;
  }

  /** The app's own settings, as Adminium served them with the keys. */
  settings(): Readonly<Record<string, unknown>> {
    return this.served.settings ?? {};
  }

  upload(file: Blob, name: string, signal?: AbortSignal): Promise<Uploaded> {
    return answer(() => this.client.upload(this.refs.placeOrder, ARTWORK_COLUMN, file, name, signal));
  }

  customiser(): CustomiserApi {
    if (this.api !== null) return this.api;
    const linkKey = this.served.publicKeys?.[KEYS.design];
    this.api = customiserApi({
      shop: this.client as unknown as ClientLike,
      link: () => {
        const made = createPublicClient({ baseUrl: this.served.baseUrl, publishableKey: linkKey ?? this.served.publishableKey, ...(this.fetchImpl === undefined ? {} : { fetch: this.fetchImpl }) });
        if (made === null) throw new Error("The design's own key could not be used.");
        return made as unknown as ClientLike;
      },
      baseUrl: this.served.baseUrl,
    });
    return this.api;
  }
}

/** A retry key for one basket, kept until its order is made. */
export const freshClientKey = (): string => newClientKey();
