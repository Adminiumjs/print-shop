/**
 * The shop's state: what is on screen, the job being set up, the basket and
 * its artwork, the checkout's form, and Adminium's answers to them.
 *
 * Nothing here works out money or a date. The products' "from" prices are
 * one dry run of an order holding one job for each product; a product's page
 * is priced by one dry run holding one job for each quantity break (the
 * chips) and one of the job as it stands (the quote panel, whose delivery and
 * tax are the order's); the basket's figures are a dry run of the whole
 * order; the confirmation shows the row the order wrote. Placing sends the
 * total the customer was shown: a save that would come to another one is
 * refused and nothing is kept, and the page shows the new figures before the
 * next press.
 *
 * The basket lives for the tab (its own storage), with each job's artwork
 * (the uploads Adminium is keeping for the order, and what their checks
 * said) and the design sessions the Customiser handed it.
 */
import { create } from "zustand";

import type { MessageKey, TFunction } from "../i18n/index.tsx";

import { heldDesign, type DesignForBasket, type HeldDesign, type SavedDesign } from "../../vendor/customiser/index.js";
import { checkFile, isArtworkName, needsAcceptance, type CheckRow } from "./checks.ts";
import { firstChoice, jobValues, optionById, optionsOf, settle, sidesOf, sizeProblems, stepsOf, trimOf, type Choice, type FinishKind } from "./config.ts";
import { freshClientKey } from "./door.ts";
import type { Elsewhere } from "./route.ts";
import { isShopError, type ArtworkValues, type Catalogue, type Figures, type Id, type JobNode, type OrderBody, type Placed, type Product, type Refused, type Row, type ShopConfig, type ShopPort, type StoredChecks, type Uploaded } from "./port.ts";

export type ShopView = "products" | "product" | "design" | "blank" | "artwork" | "basket" | "confirmed" | "missing" | Elsewhere;

export type Delivery = "deliver" | "collect";

/** A file on the artwork screen: being sent, refused, or in with its checks. */
export interface ArtFile {
  id: string;
  name: string;
  size: number;
  status: "uploading" | "refused" | "in";
  refusal: ShopMessage | null;
  /** The checks, once read; null while they are being read. */
  rows: CheckRow[] | null;
  /** The customer said they are happy with its warnings. */
  accepted: boolean;
  /** What Adminium took, for the order to name. */
  upload: Uploaded | null;
}

/** A job in the basket: what the customer chose, never a price. */
export interface BasketLine {
  id: string;
  productId: Id;
  choice: Choice;
  /** The Customiser's design the job is printed from: its code, and the session that may change it. */
  design: SavedDesign | null;
  /** The priced features the design uses, as the product's own option rows. */
  features: Id[];
  /** The customer's own files for it, each in and checked. */
  artwork: ArtFile[];
}

export interface Details {
  name: string;
  email: string;
  line1: string;
  line2: string;
  town: string;
  postcode: string;
  news: boolean;
}

export type Field = "name" | "email" | "line1" | "town" | "postcode";
export const FIELDS: readonly Field[] = ["name", "email", "line1", "town", "postcode"];

export type ShopMessage =
  | "shop.checkout.err.name"
  | "shop.checkout.err.email"
  | "shop.checkout.err.emailShape"
  | "shop.checkout.err.line1"
  | "shop.checkout.err.town"
  | "shop.checkout.err.postcode"
  | "shop.checkout.err.refused"
  | "shop.artwork.refused.kind"
  | "shop.artwork.refused.big"
  | "shop.artwork.refused.cap"
  | "shop.artwork.refused.failed";

/** A field's error: a message key of the shop's, said beside the field. */
export type FieldErrors = Partial<Record<Field, ShopMessage>>;

export interface Quoted {
  /** What was asked: a later answer to an older question is dropped. */
  key: string;
  state: "busy" | "ok" | "failed";
  figures: Figures | null;
  /** A refusal the dry run gave, for the page to say where. */
  refused?: Refused | null;
}

/** One job whose price moved since the customer saw it: before and after, as Adminium said them. */
export interface PriceMove {
  lineId: string;
  was: string;
}

export interface Confirmed {
  order: Row;
  jobs: Row[];
  token: string | null;
}

export interface Toast {
  id: number;
  tone: "ok" | "info" | "warn";
  key: MessageKey;
  params?: Record<string, string | number>;
}

export interface ShopState {
  port: ShopPort | null;
  config: ShopConfig;
  catalogue: Catalogue | null;
  loading: "loading" | "ok" | "failed";
  view: ShopView;
  productCode: string | null;
  choice: Choice | null;
  /** The products page's "from" prices: one job a product. */
  fromQuote: Quoted | null;
  /** The quantity chips: one job a break. */
  stepsQuote: Quoted | null;
  /** The quote panel: the job as it stands, as its own order. */
  jobQuote: Quoted | null;
  /** The priced features the design in the editor uses, by feature code. */
  used: string[];
  /** The basket line the configurator or the editor is changing, when it opened from one. */
  editing: string | null;
  /** A saved design opened in the editor from Your designs, not from a basket line. */
  opening: SavedDesign | null;
  basket: BasketLine[];
  /** The basket line the artwork screen sends files for, and the files on it. */
  artLine: string | null;
  artFiles: ArtFile[];
  basketQuote: Quoted | null;
  delivery: Delivery;
  details: Details;
  tried: boolean;
  refusedFields: FieldErrors;
  refusedLine: { index: number; reason: string | null; raw: unknown } | null;
  failure: "unreachable" | "closed" | "refused" | null;
  checking: boolean;
  /** The total the basket showed, which the save is held to. */
  shownTotal: string | null;
  priceMoves: PriceMove[] | null;
  clientKey: string;
  confirmed: Confirmed | null;
  toasts: Toast[];
  /** Designs saved for later on this device, for "Your designs". */
  held: HeldDesign[];
}

const BASKET_SLOT = "printing.shop.basket";
const HELD_SLOT = "printing.shop.designs";

function tab(): Storage | null {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    return null;
  }
}

function readSlot<T>(slot: string, fallback: T): T {
  try {
    const raw = tab()?.getItem(slot) ?? null;
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function writeSlot(slot: string, value: unknown): void {
  try {
    tab()?.setItem(slot, JSON.stringify(value));
  } catch {
    // storage refused (full, blocked): the basket lasts until the page goes
  }
}

const NO_DETAILS: Details = { name: "", email: "", line1: "", line2: "", town: "", postcode: "", news: false };

function initial(): Omit<ShopState, "port"> {
  const kept = readSlot<{ lines: BasketLine[]; clientKey: string | null; delivery: Delivery | null }>(BASKET_SLOT, { lines: [], clientKey: null, delivery: null });
  return {
    config: { timezone: "UTC", currency: null },
    catalogue: null,
    loading: "loading",
    view: "products",
    productCode: null,
    choice: null,
    fromQuote: null,
    stepsQuote: null,
    jobQuote: null,
    used: [],
    editing: null,
    opening: null,
    basket: Array.isArray(kept.lines) ? kept.lines : [],
    artLine: null,
    artFiles: [],
    basketQuote: null,
    delivery: kept.delivery === "collect" ? "collect" : "deliver",
    details: NO_DETAILS,
    tried: false,
    refusedFields: {},
    refusedLine: null,
    failure: null,
    checking: false,
    shownTotal: null,
    priceMoves: null,
    clientKey: typeof kept.clientKey === "string" && kept.clientKey !== "" ? kept.clientKey : freshClientKey(),
    confirmed: null,
    toasts: [],
    held: readSlot<HeldDesign[]>(HELD_SLOT, []),
  };
}

export const useShop = create<ShopState>(() => ({ port: null, ...initial() }));

const get = () => useShop.getState();
const set = (patch: Partial<ShopState>) => useShop.setState(patch);

function keepBasket(): void {
  const s = get();
  writeSlot(BASKET_SLOT, { lines: s.basket, clientKey: s.clientKey, delivery: s.delivery });
}

const uploads = new Map<string, AbortController>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

/** For tests: back to a fresh page, with this port. */
export function resetShop(port: ShopPort | null): void {
  for (const timer of timers.values()) clearTimeout(timer);
  timers.clear();
  delete pendingProduct.job;
  delete pendingProduct.steps;
  for (const controller of uploads.values()) controller.abort();
  uploads.clear();
  useShop.setState({ port, ...initial(), basket: [], held: [], delivery: "deliver", clientKey: freshClientKey() }, true);
}

// ── reading the catalogue ─────────────────────────────────────────────────

const same = (a: Id | null | undefined, b: Id | null | undefined) => a !== null && a !== undefined && b !== null && b !== undefined && String(a) === String(b);

export function productOf(code: string | null): Product | null {
  return get().catalogue?.products.find((p) => p.code === code) ?? null;
}

export function productById(id: Id): Product | null {
  return get().catalogue?.products.find((p) => same(p.id, id)) ?? null;
}

function language(): string {
  return typeof document === "undefined" ? "en-US" : (document.documentElement.getAttribute("lang") ?? "en-US");
}

export async function loadShop(): Promise<void> {
  const port = get().port;
  if (port === null) return;
  set({ loading: "loading" });
  try {
    const [config, catalogue] = await Promise.all([port.config(), port.catalogue()]);
    set({ config, catalogue, loading: "ok" });
    const view = get().view;
    if (view === "product" || view === "design" || view === "blank") openProduct(get().productCode, view, get().editing);
    if (view === "artwork" && lineOf(get().artLine) === null) goView("basket");
    requoteFrom();
    requoteBasket();
  } catch {
    set({ loading: "failed" });
  }
}

// ── moving about ──────────────────────────────────────────────────────────

let onNavigate: ((view: ShopView, code: string | null) => void) | null = null;
/** The address bar's half: told of every move, so the address follows the screen. */
export function onShopNavigate(listener: ((view: ShopView, code: string | null) => void) | null): void {
  onNavigate = listener;
}

const withProduct = (view: ShopView) => view === "product" || view === "design" || view === "blank";

export function goView(view: ShopView, code: string | null = null): void {
  set({ view, productCode: code ?? (withProduct(view) ? get().productCode : null) });
  onNavigate?.(view, get().productCode);
  if (view === "products") requoteFrom();
  if (view === "basket") requoteBasket();
  if (view !== "basket") set({ priceMoves: null });
}

/** A product's page (or its design), with the works' first choices, or the basket line it opened from. */
export function openProduct(code: string | null, view: "product" | "design" | "blank" = "product", editing: string | null = null): void {
  const s = get();
  const product = productOf(code);
  const line = editing === null ? null : lineOf(editing);
  const editingId = line === null ? null : editing;
  // Moving between the page and its design, for the same job, keeps what was chosen.
  const keep = s.choice !== null && s.productCode === code && withProduct(s.view) && s.editing === editingId;
  set({ view, productCode: code, editing: editingId });
  onNavigate?.(view, code);
  if (product === null || s.catalogue === null) return;
  if (!keep) {
    const catalogue = s.catalogue;
    const used = line === null ? [] : line.features.map((id) => optionById(catalogue, id)?.featureCode).filter((c): c is string => typeof c === "string");
    set({ choice: line === null ? firstChoice(catalogue, product) : { ...line.choice }, used: used.sort(), jobQuote: null, stepsQuote: null });
  }
  requoteProduct();
}

/** Change the job's choices: the rules settle it (a finish no longer offered comes off, and is said), then it is priced again. */
export function choose(patch: Partial<Choice>): void {
  const s = get();
  const product = productOf(s.productCode);
  if (product === null || s.catalogue === null || s.choice === null) return;
  const { choice, dropped } = settle(s.catalogue, product, { ...s.choice, ...patch });
  set({ choice });
  const material = optionById(s.catalogue, choice.materialId);
  for (const kind of dropped) toast(`shop.toast.tookOff.${kind}` as MessageKey, { material: material?.name ?? "" }, "warn");
  requoteProduct();
}

/** A finish of a kind on or off: the same chip again takes it off. */
export function toggleFinish(kind: FinishKind, id: Id | null): void {
  const field = ({ lamination: "laminationId", spot_uv: "spotUvId", corners: "cornersId", edges: "edgesId", canvas: "canvasId" } as const)[kind];
  const current = get().choice?.[field] ?? null;
  // Edges and a canvas always have one: choosing it again keeps it.
  if (kind === "edges" || kind === "canvas") return choose({ [field]: id });
  choose({ [field]: id !== null && same(current, id) ? null : id, ...(kind === "lamination" && (id === null || same(current, id)) ? { spotUvId: null } : {}) });
}

/** The priced features the editor's design uses, by code: the job pays for each. */
export function setUsedFeatures(codes: readonly string[]): void {
  const sorted = [...codes].sort();
  if (sorted.join(",") === get().used.join(",")) return;
  set({ used: sorted });
  requoteProduct();
}

function featureOptions(productId: Id, codes: readonly string[]): Id[] {
  const catalogue = get().catalogue;
  if (catalogue === null) return [];
  const features = optionsOf(catalogue, productId, "feature");
  return codes.map((code) => features.find((f) => f.featureCode === code)?.id).filter((one): one is Id => one !== undefined);
}

// ── the bodies sent to Adminium ───────────────────────────────────────────

function jobNode(line: Pick<BasketLine, "productId" | "choice" | "design" | "features"> & { artwork?: ArtFile[] }, qty?: number, withArtwork = false): JobNode {
  const catalogue = get().catalogue!;
  const product = productById(line.productId)!;
  const values = { ...jobValues(catalogue, product, line.choice, qty), ...(line.design?.code ? { design_code: line.design.code } : {}) };
  const features = line.features.map((option_id) => ({ values: { option_id } }));
  const artwork = withArtwork ? artworkRows(line.artwork ?? [], sidesOf(catalogue, line.choice)) : [];
  const children = { ...(features.length === 0 ? {} : { job_features: features }), ...(artwork.length === 0 ? {} : { artwork }) };
  return Object.keys(children).length === 0 ? { values } : { values, children };
}

/** Which side a file prints: the only side, both of a two-page file, else front then back. */
function sideOf(sides: 1 | 2, count: number, index: number): ArtworkValues["side"] {
  if (sides === 1) return "front";
  if (count === 1) return "both";
  return index === 0 ? "front" : "back";
}

let shownT: TFunction | null = null;
/** The page's own words, for the checks a file is stored with: told by the screens. */
export function tellWords(t: TFunction): void {
  shownT = t;
}

/** What the customer's checks said, in the words they were shown. */
export function storedChecks(rows: readonly CheckRow[]): StoredChecks {
  return { language: language(), rows: rows.map((r) => ({ check: r.check, level: r.level, text: shownT === null ? r.key : shownT(r.key, r.params) })) };
}

function artworkRows(files: readonly ArtFile[], sides: 1 | 2): { values: ArtworkValues }[] {
  const kept = files.filter((f) => f.status === "in" && f.upload !== null);
  return kept.map((f, i) => ({
    values: { name: f.name, file: f.upload!.id, side: sideOf(sides, kept.length, i), checks: storedChecks(f.rows ?? []), accepted: f.accepted },
  }));
}

/** The order as it would be sent: the customer's values, then each job with its features (and, to place it, its artwork). */
export function orderBody(values: Row, lines: readonly BasketLine[], withArtwork = false): OrderBody {
  return { values, children: { jobs: lines.map((line) => jobNode(line, undefined, withArtwork)) } };
}

/** The customer's own values, only those typed, trimmed; an address only for a delivery. */
export function detailValues(details: Details, delivery: Delivery): Row {
  const out: Row = {};
  const put = (column: string, value: string) => {
    if (value.trim() !== "") out[column] = value.trim();
  };
  put("name", details.name);
  put("email", details.email);
  if (delivery === "deliver") {
    put("address_line1", details.line1);
    put("address_line2", details.line2);
    put("town", details.town);
    put("postcode", details.postcode);
  }
  out["may_email"] = details.news;
  return out;
}

// ── the dry runs ──────────────────────────────────────────────────────────

async function runQuote(body: OrderBody, key: string, put: (q: Quoted) => void, current: () => string | undefined): Promise<void> {
  const port = get().port;
  if (port === null) return;
  try {
    const figures = await port.quote(body);
    if (current() === key) put({ key, state: "ok", figures, refused: null });
  } catch (error) {
    if (current() === key) put({ key, state: "failed", figures: null, refused: isShopError(error) ? error.refused : null });
  }
}

/** Ask once a burst of changes has settled; a newer question replaces an older one. */
function debounce(name: string, ms: number, run: () => void): void {
  const before = timers.get(name);
  if (before !== undefined) clearTimeout(before);
  timers.set(
    name,
    setTimeout(() => {
      timers.delete(name);
      run();
    }, ms),
  );
}

const DEBOUNCE_MS = 250;

/** The products' "from" prices: one dry run, one job for each product at its "from" quantity, collected. */
export function requoteFrom(): void {
  const s = get();
  if (s.port === null || s.catalogue === null || s.catalogue.products.length === 0) return;
  const catalogue = s.catalogue;
  const jobs = catalogue.products.map((product) => ({ values: jobValues(catalogue, product, fromChoice(catalogue, product), product.kind === "sheet" ? product.fromQty : 1) }));
  const body: OrderBody = { values: { delivery_method: "collect", language: language() }, children: { jobs } };
  const key = JSON.stringify(body);
  if (s.fromQuote?.key === key && s.fromQuote.state !== "failed") return;
  set({ fromQuote: { key, state: "busy", figures: s.fromQuote?.figures ?? null } });
  void runQuote(body, key, (quoted) => set({ fromQuote: quoted }), () => get().fromQuote?.key);
}

/** A product's "from" job: its cheapest stock, its first size, one side, nothing finished. */
export function fromChoice(catalogue: Catalogue, product: Product): Choice {
  const start = firstChoice(catalogue, product);
  const stocks = optionsOf(catalogue, product.id, "material");
  const rate = (optionId: Id) => Number(catalogue.materials.find((m) => same(m.id, stocks.find((o) => same(o.id, optionId))?.materialId))?.rate ?? Infinity);
  const cheapest = [...stocks].sort((a, b) => rate(a.id) - rate(b.id))[0]?.id ?? start.materialId;
  const single = optionsOf(catalogue, product.id, "sides").find((o) => o.sides === 1)?.id ?? start.sidesId;
  return { ...start, materialId: cheapest, sidesId: single };
}

/** The "from" figures of one product: its job in the products' dry run. */
export function fromFigures(product: Product): Row | null {
  const s = get();
  const at = s.catalogue?.products.findIndex((p) => same(p.id, product.id)) ?? -1;
  return at === -1 ? null : (s.fromQuote?.figures?.jobs[at] ?? null);
}

/** The job being set up, as a line: its choices, the design of the line it was opened from, the features the design uses. */
function currentLine(): Pick<BasketLine, "productId" | "choice" | "design" | "features"> | null {
  const s = get();
  const product = productOf(s.productCode);
  if (product === null || s.choice === null) return null;
  const editing = s.editing === null ? null : lineOf(s.editing);
  return { productId: product.id, choice: s.choice, design: s.view === "product" ? (editing?.design ?? null) : null, features: featureOptions(product.id, s.used) };
}

/** The product page's questions waiting for the changes to settle. */
const pendingProduct: { job?: [OrderBody, string]; steps?: [OrderBody, string] } = {};

/**
 * Price the product's page: the quantity chips (one dry run, one job for
 * each break) and the quote panel (the job as it stands, as its own order,
 * so its delivery band and tax are the order's). Both once the changes
 * settle; the chips only when something other than the quantity moved.
 */
export function requoteProduct(): void {
  const s = get();
  const product = productOf(s.productCode);
  const line = currentLine();
  if (product === null || line === null || s.port === null || s.catalogue === null) return;
  const catalogue = s.catalogue;
  if (sizeProblems(catalogue, product, line.choice).length > 0) {
    set({ jobQuote: null });
    return;
  }
  const values = { delivery_method: s.delivery, language: language() };
  const jobBody: OrderBody = { values, children: { jobs: [jobNode(line)] } };
  const jobKey = JSON.stringify(jobBody);
  const steps = stepsOf(catalogue, product);
  const stepsBody: OrderBody | null = steps.length === 0 ? null : { values: { delivery_method: "collect", language: language() }, children: { jobs: steps.map((qty) => jobNode(line, qty)) } };
  const stepsKey = stepsBody === null ? null : JSON.stringify(stepsBody);
  const askJob = s.jobQuote?.key !== jobKey || s.jobQuote.state === "failed";
  const askSteps = stepsKey !== null && (s.stepsQuote?.key !== stepsKey || s.stepsQuote.state === "failed");
  if (!askJob && !askSteps) return;
  if (askJob) set({ jobQuote: { key: jobKey, state: "busy", figures: s.jobQuote?.figures ?? null } });
  if (askSteps) set({ stepsQuote: { key: stepsKey!, state: "busy", figures: s.stepsQuote?.figures ?? null } });
  if (stepsKey === null) set({ stepsQuote: null });
  if (askJob) pendingProduct.job = [jobBody, jobKey];
  if (askSteps) pendingProduct.steps = [stepsBody!, stepsKey!];
  debounce("product", DEBOUNCE_MS, () => {
    const { job, steps: chips } = pendingProduct;
    delete pendingProduct.job;
    delete pendingProduct.steps;
    if (job !== undefined) void runQuote(job[0], job[1], (quoted) => set({ jobQuote: quoted }), () => get().jobQuote?.key);
    if (chips !== undefined) void runQuote(chips[0], chips[1], (quoted) => set({ stepsQuote: quoted }), () => get().stepsQuote?.key);
  });
}

/** The job's figures and its order's, as the quote panel shows them. */
export function jobFigures(): { job: Row | null; order: Row | null } {
  const figures = get().jobQuote?.figures ?? null;
  return { job: figures?.jobs[0] ?? null, order: figures?.order ?? null };
}

/** One quantity chip's figures, from the chips' dry run. */
export function stepFigures(qty: number): Row | null {
  const s = get();
  const product = productOf(s.productCode);
  if (product === null || s.catalogue === null) return null;
  const at = stepsOf(s.catalogue, product).indexOf(qty);
  return at === -1 ? null : (s.stepsQuote?.figures?.jobs[at] ?? null);
}

// ── the basket ────────────────────────────────────────────────────────────

export function lineOf(id: string | null): BasketLine | null {
  return id === null ? null : (get().basket.find((b) => b.id === id) ?? null);
}

export function requoteBasket(): void {
  const s = get();
  if (s.port === null || s.catalogue === null) return;
  if (s.basket.length === 0) {
    set({ basketQuote: null });
    return;
  }
  const body = orderBody({ delivery_method: s.delivery, language: language() }, s.basket);
  const key = JSON.stringify(body);
  if (s.basketQuote?.key === key && s.basketQuote.state !== "failed") return;
  set({ basketQuote: { key, state: "busy", figures: s.basketQuote?.figures ?? null } });
  debounce("basket", DEBOUNCE_MS, () => {
    void runQuote(
      body,
      key,
      (quoted) => {
        set({ basketQuote: quoted });
        // The total the save is held to, until the customer is told of another.
        if (quoted.state === "ok" && get().priceMoves === null) set({ shownTotal: String(quoted.figures?.order["total"] ?? "") });
      },
      () => get().basketQuote?.key,
    );
  });
}

let toastSeq = 0;
export function toast(key: MessageKey, params?: Record<string, string | number>, tone: Toast["tone"] = "ok"): void {
  const id = (toastSeq += 1);
  set({ toasts: [...get().toasts, { id, tone, key, ...(params === undefined ? {} : { params }) }] });
  setTimeout(() => set({ toasts: get().toasts.filter((one) => one.id !== id) }), 3600);
}

/** A basket line's own id: one more than any the basket holds, so a kept basket's ids stay its own. */
function lineId(): string {
  const taken = get().basket.map((b) => Number.parseInt(b.id.replace(/^j/, ""), 36)).filter((n) => Number.isFinite(n));
  return `j${(Math.max(0, ...taken) + 1).toString(36)}`;
}

/**
 * "Send your artwork": the job as set up goes in the basket (or back into
 * the line it was opened from), and the artwork screen opens for it.
 */
export function addJobForArtwork(): BasketLine | null {
  const s = get();
  const product = productOf(s.productCode);
  if (product === null || s.choice === null || s.catalogue === null) return null;
  if (sizeProblems(s.catalogue, product, s.choice).length > 0) {
    toast("shop.toast.fixSize", undefined, "warn");
    return null;
  }
  const editing = s.editing === null ? null : lineOf(s.editing);
  const line: BasketLine = editing === null ? { id: lineId(), productId: product.id, choice: { ...s.choice }, design: null, features: [], artwork: [] } : { ...editing, choice: { ...s.choice } };
  set({ basket: editing === null ? [...s.basket, line] : s.basket.map((b) => (b.id === line.id ? line : b)), editing: null, priceMoves: null });
  keepBasket();
  openArtwork(line.id);
  return line;
}

/** What the editor hands over: the design saved, as a new job or the job it was opened from. */
export function addDesignToBasket(design: DesignForBasket): "added" | "updated" {
  const s = get();
  const product = productOf(s.productCode);
  if (product === null || s.choice === null) return "added";
  const features = featureOptions(product.id, design.used);
  const kept = { ...design } as SavedDesign & { used?: string[] };
  delete kept.used;
  keepHeld(design, null);
  const editing = s.editing === null ? null : lineOf(s.editing);
  if (editing !== null) {
    set({ basket: s.basket.map((b) => (b.id === editing.id ? { ...b, choice: { ...s.choice! }, design: kept, features } : b)), editing: null, priceMoves: null });
    keepBasket();
    return "updated";
  }
  const line: BasketLine = { id: lineId(), productId: product.id, choice: { ...s.choice }, design: kept, features, artwork: [] };
  set({ basket: [...s.basket, line], priceMoves: null });
  keepBasket();
  return "added";
}

/** A design saved for later: its session is kept, for "Your designs". */
export function keepHeld(design: SavedDesign, email: string | null): void {
  const held = heldDesign(design, email);
  if (held === null) return;
  const rest = get().held.filter((one) => String(one.id) !== String(held.id));
  set({ held: [held, ...rest] });
  writeSlot(HELD_SLOT, get().held);
}

/**
 * A product's page set up as a past job or a saved quote was (Order it
 * again, a saved quote's Open): the choices given, priced there afresh.
 */
export function openProductAs(code: string, choice: Choice): void {
  set({ view: "product", productCode: code, editing: null, opening: null, choice: { ...choice }, used: [], jobQuote: null, stepsQuote: null, priceMoves: null });
  onNavigate?.("product", code);
  requoteProduct();
}

/** A saved design opened in the editor, on the product made on its base ("Open" in Your designs). */
export function openDesign(design: SavedDesign): boolean {
  const s = get();
  const product = s.catalogue?.products.find((p) => p.baseId !== null && String(p.baseId) === String(design.base_id)) ?? null;
  if (product === null || s.catalogue === null) return false;
  set({ view: "design", productCode: product.code, editing: null, opening: design, choice: firstChoice(s.catalogue, product), used: [], jobQuote: null, stepsQuote: null });
  onNavigate?.("design", product.code);
  requoteProduct();
  return true;
}

/** Jobs put in the basket as they were (a saved quote's Add to order): each a new line, priced again by the basket's dry run. */
export function addLinesToBasket(lines: readonly Omit<BasketLine, "id">[]): void {
  for (const line of lines) set({ basket: [...get().basket, { ...line, id: lineId() }], priceMoves: null });
  keepBasket();
  requoteBasket();
}

/** Back to a basket job's own page, to change it; saving it puts it back in its place. */
export function editLine(id: string): void {
  const line = lineOf(id);
  const product = line === null ? null : productById(line.productId);
  if (line === null || product === null) return;
  openProduct(product.code, "product", id);
}

/** Back into the editor with a basket job's design. */
export function editLineDesign(id: string): void {
  const line = lineOf(id);
  const product = line === null ? null : productById(line.productId);
  if (line === null || product === null) return;
  openProduct(product.code, "design", id);
}

export function removeLine(id: string): void {
  set({ basket: get().basket.filter((b) => b.id !== id), refusedLine: null, priceMoves: null });
  keepBasket();
  requoteBasket();
  toast("shop.toast.removed", undefined, "info");
}

export function chooseDelivery(delivery: Delivery): void {
  set({ delivery, refusedFields: {} });
  keepBasket();
  requoteBasket();
  if (withProduct(get().view)) requoteProduct();
}

// ── the artwork ───────────────────────────────────────────────────────────

let fileSeq = 0;

export function openArtwork(lineId: string): void {
  const line = lineOf(lineId);
  set({ artLine: line === null ? null : lineId, artFiles: line === null ? [] : line.artwork.map((f) => ({ ...f })) });
  goView(line === null ? "basket" : "artwork");
}

function patchFile(id: string, patch: Partial<ArtFile>): void {
  set({ artFiles: get().artFiles.map((f) => (f.id === id ? { ...f, ...patch } : f)) });
}

/** The refusal Adminium gave a file, in the page's words. */
function uploadRefusal(error: unknown): ShopMessage {
  if (!isShopError(error)) return "shop.artwork.refused.failed";
  const reason = error.refused.reason;
  if (reason === "too-big") return "shop.artwork.refused.big";
  if (reason === "kind") return "shop.artwork.refused.kind";
  if (reason === "cap" || reason === "quota") return "shop.artwork.refused.cap";
  return "shop.artwork.refused.failed";
}

/**
 * The files the customer dropped or chose: each refused at once when it is
 * not a kind the works takes or over its cap, else sent to Adminium (which
 * judges it again by its bytes) while its five checks are read here.
 */
export function addFiles(files: readonly File[]): void {
  const s = get();
  const line = lineOf(s.artLine);
  const product = line === null ? null : productById(line.productId);
  if (line === null || product === null || s.catalogue === null || s.port === null) return;
  const port = s.port;
  const works = s.catalogue.works;
  const cap = works.artworkMaxMb * 1024 * 1024;
  const trim = trimOf(s.catalogue, product, line.choice) ?? { w: 0, h: 0 };
  const sides = sidesOf(s.catalogue, line.choice);
  for (const file of files) {
    fileSeq += 1;
    const id = `f${fileSeq.toString(36)}`;
    const refusal: ShopMessage | null = !isArtworkName(file.name) ? "shop.artwork.refused.kind" : file.size > cap ? "shop.artwork.refused.big" : null;
    const entry: ArtFile = { id, name: file.name, size: file.size, status: refusal === null ? "uploading" : "refused", refusal, rows: null, accepted: false, upload: null };
    set({ artFiles: [...get().artFiles, entry] });
    if (refusal !== null) continue;
    const controller = new AbortController();
    uploads.set(id, controller);
    void checkFile(file, { trim, sides, minDpi: works.minDpi }).then((rows) => patchFile(id, { rows }));
    port
      .upload(file, file.name, controller.signal)
      .then((upload) => {
        if (get().artFiles.some((f) => f.id === id && f.status === "uploading")) patchFile(id, { status: "in", upload });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        patchFile(id, { status: "refused", refusal: uploadRefusal(error) });
      })
      .finally(() => uploads.delete(id));
  }
}

/** Stop a file on its way, and take it off the list. */
export function dropFile(id: string): void {
  uploads.get(id)?.abort();
  uploads.delete(id);
  set({ artFiles: get().artFiles.filter((f) => f.id !== id) });
}

export function acceptFile(id: string): void {
  patchFile(id, { accepted: true });
}

export function startOver(): void {
  for (const f of get().artFiles) uploads.get(f.id)?.abort();
  set({ artFiles: [] });
}

/** Where the artwork screen stands, for its status line and its button. */
export function artworkState(files: readonly ArtFile[]): "empty" | "uploading" | "checking" | "none" | "warn" | "ok" {
  if (files.length === 0) return "empty";
  if (files.some((f) => f.status === "uploading")) return "uploading";
  const inFiles = files.filter((f) => f.status === "in");
  if (inFiles.length === 0) return "none";
  if (inFiles.some((f) => f.rows === null)) return "checking";
  if (inFiles.some((f) => needsAcceptance(f.rows!) && !f.accepted)) return "warn";
  return "ok";
}

/** The files in go with the job, and the basket opens. */
export function continueArtwork(): void {
  const s = get();
  if (artworkState(s.artFiles) !== "ok") return;
  const files = s.artFiles.filter((f) => f.status === "in");
  set({ basket: s.basket.map((b) => (b.id === s.artLine ? { ...b, artwork: files } : b)), artLine: null, artFiles: [] });
  keepBasket();
  goView("basket");
}

// ── the checkout ──────────────────────────────────────────────────────────

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** What the page itself can say of the form before anything is sent. */
export function formErrors(details: Details, delivery: Delivery): FieldErrors {
  const e: FieldErrors = {};
  if (details.name.trim() === "") e.name = "shop.checkout.err.name";
  if (details.email.trim() === "") e.email = "shop.checkout.err.email";
  else if (!EMAIL.test(details.email.trim())) e.email = "shop.checkout.err.emailShape";
  if (delivery === "deliver") {
    if (details.line1.trim() === "") e.line1 = "shop.checkout.err.line1";
    if (details.town.trim() === "") e.town = "shop.checkout.err.town";
    if (details.postcode.trim() === "") e.postcode = "shop.checkout.err.postcode";
  }
  return e;
}

export function setDetails(patch: Partial<Details>): void {
  const refused = { ...get().refusedFields };
  for (const key of Object.keys(patch)) delete refused[key as Field];
  set({ details: { ...get().details, ...patch }, refusedFields: refused, failure: null });
}

/** The column Adminium names, as the field it is typed into. */
const FIELD_OF: Record<string, Field> = { name: "name", email: "email", address_line1: "line1", town: "town", postcode: "postcode" };

/** Where a refusal goes: a field of the form, a job of the basket, or the summary. */
function placeRefusal(refused: Refused): void {
  const field = refused.child === null && refused.column !== null ? FIELD_OF[refused.column] : undefined;
  if (field !== undefined) {
    set({ refusedFields: { ...get().refusedFields, [field]: "shop.checkout.err.refused" }, failure: null });
    return;
  }
  if (refused.child === "jobs" && refused.index !== null) {
    set({ refusedLine: { index: refused.index, reason: refused.reason, raw: refused.raw }, failure: "refused" });
    return;
  }
  set({ failure: refused.code === "PUBLIC_SWITCHED_OFF" ? "closed" : "refused" });
}

/** The jobs whose price moved between two answers, with the price each was. */
function movesBetween(before: Figures | null, after: Figures): PriceMove[] {
  const lines = get().basket;
  return after.jobs
    .map((job, i) => ({ was: before?.jobs[i]?.["price"], now: job["price"], line: lines[i] }))
    .filter((m) => m.line !== undefined && m.was !== undefined && m.was !== null && String(m.was) !== String(m.now))
    .map((m) => ({ lineId: m.line!.id, was: String(m.was) }));
}

/** The first field with something to fix, for the page to move focus to. */
export function firstBadField(): Field | null {
  const s = get();
  const errors = { ...(s.tried ? formErrors(s.details, s.delivery) : {}), ...s.refusedFields };
  return FIELDS.find((f) => errors[f] !== undefined) ?? null;
}

/**
 * Place the order: the form checked here, then a dry run with the customer's
 * own values (Adminium's refusals land on their fields), then the one save,
 * held to the total shown, with every job's artwork. A total that moved
 * stops it, saves nothing, and shows the customer the new figures; their
 * next press orders at those.
 */
export async function placeOrder(): Promise<"placed" | "fix" | "moved" | "failed"> {
  const s = get();
  if (s.checking || s.port === null || s.basket.length === 0 || s.catalogue === null || s.shownTotal === null) return "failed";
  set({ tried: true, refusedLine: null, failure: null });
  if (Object.keys(formErrors(s.details, s.delivery)).length > 0 || Object.keys(s.refusedFields).length > 0) return "fix";
  set({ checking: true });
  const values = { ...detailValues(s.details, s.delivery), delivery_method: s.delivery, language: language() };
  try {
    const quoted = await s.port.quote(orderBody(values, s.basket));
    const total = String(quoted.order["total"] ?? "");
    const shown = get().shownTotal ?? "";
    if (shown !== total) {
      const moves = movesBetween(get().basketQuote?.figures ?? null, quoted);
      set({ checking: false, priceMoves: moves, shownTotal: total, basketQuote: { key: get().basketQuote?.key ?? "", state: "ok", figures: quoted } });
      return "moved";
    }
    const placed = await s.port.place(orderBody(values, s.basket, true), s.clientKey, shown);
    confirm(placed);
    return "placed";
  } catch (error) {
    set({ checking: false });
    if (!isShopError(error)) {
      set({ failure: "unreachable" });
      return "failed";
    }
    const refused = error.refused;
    if (refused.code === "PUBLIC_PRICE_CHANGED" && refused.changed !== null) {
      const moves = movesBetween(get().basketQuote?.figures ?? null, refused.changed);
      set({ priceMoves: moves, shownTotal: String(refused.changed.order["total"] ?? "") });
      return "moved";
    }
    placeRefusal(refused);
    return "fix";
  }
}

function confirm(placed: Placed): void {
  set({
    checking: false,
    confirmed: { order: placed.order, jobs: placed.jobs, token: placed.link?.token ?? null },
    basket: [],
    basketQuote: null,
    priceMoves: null,
    shownTotal: null,
    tried: false,
    refusedFields: {},
    clientKey: freshClientKey(),
  });
  keepBasket();
  goView("confirmed");
}
