/**
 * The shop after an order: finding it (a reference and the e-mail, then the
 * code Adminium e-mails), opening it by its own link, answering its proofs
 * and its delivery quote, ordering a job again, the saved quotes, the sample
 * pack and the template files.
 *
 * Every figure and date shown is one Adminium stored or worked out: a job's
 * stages are its stamps, its ready-by its own column, a price on Order it
 * again or Saved quotes a fresh dry run. The page only says them.
 */
import { create } from "zustand";

import { openSavedLink, readDesigns, type SavedDesign } from "../../vendor/customiser/index.js";
import { freshClientKey } from "./door.ts";
import type { AfterPort, CodeAnswer, DeliveryAnswer, HeldQuote, Me, MyRows, OrderRead, ProofAnswer, QuoteRead, Via } from "./after-port.ts";
import { choiceOf, jobValues } from "./config.ts";
import { isShopError, type Id, type JobValues, type QuoteBody, type Row } from "./port.ts";
import { addLinesToBasket, goView, keepHeld, openProductAs, productById, toast, useShop, type BasketLine } from "./store.ts";

// ── finding an order: a reference and the e-mail, then the code ────────────

/** The four pages that open the same way, each with its own words. */
export type GateView = "order" | "proofs" | "reorder" | "quotes";

export type LookupError = "mismatch" | "unreachable" | "noMail";
export type CodeError = "short" | "wrong" | "spent" | "locked" | "unreachable";

export interface Lookup {
  step: "find" | "code";
  ref: string;
  email: string;
  tried: boolean;
  err: LookupError | null;
  digits: string;
  codeErr: CodeError | null;
  triesLeft: number | null;
  /** How many codes this page has asked for: each one starts "Send a new code in 0:30" again. */
  sends: number;
  /** Whether thirty seconds have gone since the last code was asked for. */
  canResend: boolean;
  busy: boolean;
}

const NO_LOOKUP: Lookup = { step: "find", ref: "", email: "", tried: false, err: null, digits: "", codeErr: null, triesLeft: null, sends: 0, canResend: false, busy: false };

/** The order open on Follow your order: by the customer's sign-in, or by the order's own link. */
export interface Opened {
  via: Via;
  state: "loading" | "ok" | "failed" | "gone";
  read: OrderRead | null;
}

/** A fresh price for a past job or a saved quote: being asked, the total inc. tax, or no answer. */
export interface Repriced {
  state: "busy" | "ok" | "failed";
  total: string | null;
}

export interface SampleValues {
  name: string;
  email: string;
  line1: string;
  line2: string;
  town: string;
  postcode: string;
}
export type SampleField = "name" | "email" | "line1" | "town" | "postcode";

export interface AfterState {
  port: AfterPort | null;
  lookup: Lookup;
  /** The signed-in customer, once read; null when nobody is signed in on this page. */
  me: Me | null;
  /** Every row the signed-in customer's orders hold. */
  mine: { state: "idle" | "loading" | "ok" | "failed"; orders: Row[]; rows: MyRows | null; quotes: Row[]; quoteLines: Row[] };
  opened: Opened | null;
  /** How the order's own link went: being opened, opening nothing, or stopped. */
  link: "opening" | "unknown" | "closed" | null;
  /** The proofs this page opened (Approve waits until the customer has looked). */
  looked: Record<string, true>;
  /** Each proof's change box: what is typed, and whether Ask was pressed empty. */
  change: Record<string, { note: string; tried: boolean }>;
  answering: string | null;
  /** What the customer answered on each proof this visit: the note the page shows after. */
  answered: Record<string, "approved" | "changed">;
  answerFailed: string | null;
  /** The delivery quote's answer: being sent, or refused. */
  deliveryAnswer: { busy: boolean; failed: boolean; done: "accepted" | "collect" | null };
  /** Order it again: each past job's price on today's rate card, by its id. */
  reprices: Record<string, Repriced>;
  /** Saved quotes: those saved or opened on this visit, read by their own links. */
  held: HeldQuote[];
  heldRead: Record<string, QuoteRead | null>;
  heldState: "idle" | "loading" | "ok" | "failed";
  /** A quote's own link from the address bar: opening nothing, or stopped. */
  quoteLink: "unknown" | "closed" | null;
  /** Each quote's price on today's rate card, by its id. */
  quotePrices: Record<string, Repriced>;
  /** The name being typed for each quote, by its id, until it is saved. */
  names: Record<string, string>;
  renaming: string | null;
  /** "Find an older quote": the lookup, over the quotes saved on this visit. */
  olderGate: boolean;
  /** "Save this quote": its sheet, the e-mail it goes to, and how saving went. */
  saving: { open: boolean; email: string; tried: boolean; busy: boolean; failed: "unreachable" | "refused" | null; clientKey: string };
  samples: { picked: string[]; values: SampleValues; tried: boolean; sending: boolean; refused: { column: string | null; reason: string | null; code: string } | null; clientKey: string };
  /** The template files downloaded on this visit, by their product's code. */
  templates: Record<string, "done">;
  /** The sign-in link from the e-mail (`/c#…`): the name it greets, and how opening it went. */
  signIn: { token: string | null; name: string | null; state: "idle" | "peeking" | "ready" | "opening" | "used" | "done" };
}

const HELD_QUOTES = "printing.shop.quotes";
const LOOKED_FOR = "printing.shop.lookedFor";

function tab(): Storage | null {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    return null;
  }
}

function readHeld(): HeldQuote[] {
  try {
    const raw = tab()?.getItem(HELD_QUOTES) ?? null;
    const parsed: unknown = raw === null ? [] : JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HeldQuote[]).filter((q) => typeof q?.number === "string" && typeof q?.session?.token === "string") : [];
  } catch {
    return [];
  }
}

function keepHeldQuotes(held: readonly HeldQuote[]): void {
  try {
    if (held.length === 0) tab()?.removeItem(HELD_QUOTES);
    else tab()?.setItem(HELD_QUOTES, JSON.stringify(held));
  } catch {
    // not kept: listed until the page goes
  }
}

const NO_SAMPLES: SampleValues = { name: "", email: "", line1: "", line2: "", town: "", postcode: "" };

function initial(): Omit<AfterState, "port"> {
  return {
    lookup: NO_LOOKUP,
    me: null,
    mine: { state: "idle", orders: [], rows: null, quotes: [], quoteLines: [] },
    opened: null,
    link: null,
    looked: {},
    change: {},
    answering: null,
    answered: {},
    answerFailed: null,
    deliveryAnswer: { busy: false, failed: false, done: null },
    reprices: {},
    held: readHeld(),
    heldRead: {},
    heldState: "idle",
    quoteLink: null,
    quotePrices: {},
    names: {},
    renaming: null,
    olderGate: false,
    saving: { open: false, email: "", tried: false, busy: false, failed: null, clientKey: freshClientKey() },
    samples: { picked: [], values: NO_SAMPLES, tried: false, sending: false, refused: null, clientKey: freshClientKey() },
    templates: {},
    signIn: { token: null, name: null, state: "idle" },
  };
}

export const useAfter = create<AfterState>(() => ({ port: null, ...initial() }));

const get = () => useAfter.getState();
const set = (patch: Partial<AfterState>) => useAfter.setState(patch);

/** The after-order door: the shop's own, once it is open. */
function port(): AfterPort | null {
  const own = get().port;
  if (own !== null) return own;
  const shop = useShop.getState().port;
  return shop === null ? null : shop.after();
}

/** For tests: back to a fresh page, with this door. */
export function resetAfter(next: AfterPort | null): void {
  useAfter.setState({ port: next, ...initial(), held: [] }, true);
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** A reference as it is written: a prefix, then its number ("MP-4113", "MQ-2041"). */
const REFERENCE = /^[A-Z]{1,8}-?\d{1,8}$/;

export const normaliseRef = (ref: string): string => ref.trim().toUpperCase();
export const normaliseEmail = (email: string): string => email.trim().toLowerCase();

/** The language the customer reads the shop in: their e-mails come in it. */
function language(): string {
  return typeof document === "undefined" ? "en-US" : (document.documentElement.getAttribute("lang") ?? "en-US");
}

/** The works' quote prefix ("MQ-"): a reference that starts with it is a saved quote. */
function quotePrefix(): string {
  return (useShop.getState().catalogue?.works.quotePrefix ?? "MQ-").toUpperCase();
}

const isQuoteRef = (ref: string) => normaliseRef(ref).startsWith(quotePrefix());

/** What the page itself can say of the reference and the e-mail before anything is sent. */
export function lookupErrors(lookup: Pick<Lookup, "ref" | "email">): { ref?: "empty" | "shape"; email?: "empty" | "shape" } {
  const ref = normaliseRef(lookup.ref);
  const email = normaliseEmail(lookup.email);
  return {
    ...(ref === "" ? { ref: "empty" as const } : !REFERENCE.test(ref) ? { ref: "shape" as const } : {}),
    ...(email === "" ? { email: "empty" as const } : !EMAIL.test(email) ? { email: "shape" as const } : {}),
  };
}

function setLookup(patch: Partial<Lookup>): void {
  set({ lookup: { ...get().lookup, ...patch } });
}

export function typeLookup(patch: Partial<Pick<Lookup, "ref" | "email" | "digits">>): void {
  setLookup({ ...patch, ...("digits" in patch ? { codeErr: null } : { err: null }) });
}

/** The reference the page last looked for, kept for the tab: a sign-in link opened later opens that order. */
function remember(ref: string | null): void {
  try {
    if (ref === null) tab()?.removeItem(LOOKED_FOR);
    else tab()?.setItem(LOOKED_FOR, ref);
  } catch {
    // not kept
  }
}
function remembered(): string | null {
  try {
    return tab()?.getItem(LOOKED_FOR) ?? null;
  } catch {
    return null;
  }
}

/** Whether this page holds a signed-in customer's session. */
export function signedIn(): boolean {
  return port()?.signedIn() ?? false;
}

/**
 * "Send me a code": checked here first, then, when this browser is already
 * signed in as that address, the reference is looked for at once; otherwise
 * Adminium e-mails the address a code (the same answer whoever it is).
 */
export async function findOrder(view: GateView): Promise<"code" | "open" | "fix" | "failed"> {
  const door = port();
  const lookup = get().lookup;
  if (door === null || lookup.busy) return "failed";
  if (Object.keys(lookupErrors(lookup)).length > 0) {
    setLookup({ tried: true, err: null });
    return "fix";
  }
  const email = normaliseEmail(lookup.email);
  setLookup({ tried: false, err: null, busy: true });
  remember(normaliseRef(lookup.ref));
  try {
    if (door.signedIn() && normaliseEmail(get().me?.email ?? "") === email) return await afterSignIn(view);
    await door.requestCode(email, language());
    sent();
    setLookup({ step: "code", digits: "", codeErr: null, triesLeft: null, busy: false });
    return "code";
  } catch (error) {
    setLookup({ busy: false, err: isShopError(error) && error.refused.code === "PUBLIC_CODE_UNAVAILABLE" ? "noMail" : "unreachable" });
    return "failed";
  }
}

/** A code went: another may be asked for in thirty seconds. */
function sent(): void {
  const sends = get().lookup.sends + 1;
  setLookup({ sends, canResend: false });
  setTimeout(() => {
    if (get().lookup.sends === sends) setLookup({ canResend: true });
  }, 30_000);
}

/** "Send a new code": not before thirty seconds have gone since the last. */
export async function resendCode(): Promise<boolean> {
  const door = port();
  const lookup = get().lookup;
  if (door === null || lookup.busy || !lookup.canResend) return false;
  setLookup({ busy: true });
  try {
    await door.requestCode(normaliseEmail(lookup.email), language());
    sent();
    setLookup({ busy: false, digits: "", codeErr: null, triesLeft: null });
    toast("after.toast.newCode", { email: lookup.email.trim() }, "info");
    return true;
  } catch {
    setLookup({ busy: false, codeErr: "unreachable" });
    return false;
  }
}

export function backToFind(): void {
  setLookup({ step: "find", digits: "", codeErr: null, triesLeft: null });
}

/** The code typed back: right, it signs the customer in and opens what the reference names. */
export async function checkCode(view: GateView): Promise<"open" | "fix" | "failed"> {
  const door = port();
  const lookup = get().lookup;
  if (door === null || lookup.busy) return "failed";
  if (lookup.digits.length < 6) {
    setLookup({ codeErr: "short" });
    return "fix";
  }
  setLookup({ busy: true, codeErr: null });
  let answered: CodeAnswer;
  try {
    answered = await door.verifyCode(normaliseEmail(lookup.email), lookup.digits);
  } catch {
    setLookup({ busy: false, codeErr: "unreachable" });
    return "failed";
  }
  if (!answered.ok) {
    setLookup({ busy: false, codeErr: answered.reason, triesLeft: answered.reason === "wrong" ? answered.triesLeft : null, digits: "" });
    return "fix";
  }
  try {
    return await afterSignIn(view);
  } catch {
    setLookup({ busy: false, codeErr: "unreachable" });
    return "failed";
  }
}

/** Signed in: the reference among the customer's own orders and quotes, or "we couldn't match that". */
async function afterSignIn(view: GateView): Promise<"open" | "fix"> {
  const ref = normaliseRef(get().lookup.ref);
  await loadMine();
  const mine = get().mine;
  const quote = mine.quotes.find((q) => normaliseRef(String(q["number"] ?? "")) === ref);
  const order = mine.orders.find((o) => normaliseRef(String(o["number"] ?? "")) === ref);
  if (quote === undefined && order === undefined) {
    setLookup({ step: "find", busy: false, err: "mismatch", digits: "" });
    return "fix";
  }
  setLookup({ ...NO_LOOKUP, sends: get().lookup.sends });
  set({ olderGate: false });
  // A quote's reference opens Saved quotes; an order's opens the order on Follow your order.
  if (quote !== undefined && order === undefined) {
    goView("quotes");
    void repriceQuotes();
    return "open";
  }
  if (view === "order") await openMine(order!);
  if (view === "reorder") void repriceAgain();
  if (view === "quotes") void repriceQuotes();
  return "open";
}

/** Who is signed in, and every row of theirs: read once, and again after an answer. */
export async function loadMine(): Promise<void> {
  const door = port();
  if (door === null || !door.signedIn()) return;
  set({ mine: { ...get().mine, state: "loading" } });
  try {
    const [me, orders, rows, quoted] = await Promise.all([door.me(), door.myOrders(), door.myRows(), door.myQuotes()]);
    set({ me, mine: { state: "ok", orders, rows, quotes: quoted.quotes, quoteLines: quoted.lines } });
  } catch {
    set({ mine: { ...get().mine, state: "failed" } });
  }
}

/**
 * "Not you? Sign out": the session ends here and on the server, and the pages
 * lock again. Nothing of the customer's stays in the tab for whoever comes
 * next: no order open (by the sign-in or by its own link, whose session ends
 * too), no saved quote held from this visit, nothing typed or answered.
 */
export async function signOut(): Promise<void> {
  const door = port();
  for (const end of [() => door?.signOut(), () => door?.closeShared()]) {
    try {
      await end();
    } catch {
      // the session ends on this page either way
    }
  }
  remember(null);
  keepHeldQuotes([]);
  set({ ...initial(), held: [], templates: get().templates });
}

// ── the order open ─────────────────────────────────────────────────────────

/** The signed-in customer's order, with its jobs and what they hold. */
export async function openMine(order: Row): Promise<void> {
  const rows = get().mine.rows;
  if (rows === null) return;
  const jobs = rows.jobs.filter((j) => String(j["order_id"]) === String(order["id"]));
  const ids = new Set(jobs.map((j) => String(j["id"])));
  const read: OrderRead = {
    via: "mine",
    order,
    jobs,
    features: rows.features.filter((f) => ids.has(String(f["job_id"]))),
    artwork: rows.artwork.filter((a) => ids.has(String(a["job_id"]))),
    proofs: rows.proofs.filter((p) => String(p["order_id"]) === String(order["id"])),
  };
  set({ opened: { via: "mine", state: "ok", read }, link: null, deliveryAnswer: { busy: false, failed: false, done: null } });
}

/** "Follow a different order": back to the lookup, the session kept. */
export function followAnother(): void {
  set({ opened: null, link: null, answered: {}, answerFailed: null });
}

/** The order the link in its e-mail opens (`/order#<code>`): no code step. */
export async function openOrderLink(token: string): Promise<void> {
  const door = port();
  if (door === null) return;
  set({ link: "opening", opened: { via: "link", state: "loading", read: null }, answered: {}, answerFailed: null });
  try {
    const opened = await door.openShared(token);
    if (opened !== "opened") {
      set({ link: opened, opened: null });
      return;
    }
    set({ link: null });
    await readLinked();
  } catch {
    set({ link: null, opened: { via: "link", state: "failed", read: null } });
  }
}

/** The order a link this tab already opened (the confirmation's, or one before a reload). */
export async function readLinked(): Promise<void> {
  const door = port();
  if (door === null) return;
  const before = get().opened?.read ?? null;
  set({ opened: { via: "link", state: before === null ? "loading" : "ok", read: before } });
  try {
    const read = await door.readShared();
    set({ opened: read === null ? { via: "link", state: "gone", read: null } : { via: "link", state: "ok", read } });
  } catch {
    set({ opened: { via: "link", state: "failed", read: null } });
  }
}

/** Read what the page shows again, after an answer: the order open, and the signed-in lists. */
async function reread(): Promise<void> {
  const opened = get().opened;
  if (opened?.via === "link") await readLinked();
  if (signedIn()) {
    await loadMine();
    if (opened?.via === "mine" && opened.read !== null) {
      const order = get().mine.orders.find((o) => String(o["id"]) === String(opened.read!.order["id"]));
      if (order !== undefined) await openMine(order);
    }
  }
}

/** The session a proof is read and answered through: the order's own link when that is what opened it. */
function viaOf(proofId: string): Via {
  const opened = get().opened;
  if (opened?.via === "link" && opened.read?.proofs.some((p) => String(p["id"]) === proofId)) return "link";
  return signedIn() ? "mine" : "link";
}

/** "Open the proof (PDF)": the works' file, opened in the browser's own viewer; Approve then wakes. */
export async function openProof(proofId: string): Promise<boolean> {
  const door = port();
  if (door === null) return false;
  try {
    const file = await door.proofFile(viaOf(proofId), proofId);
    set({ looked: { ...get().looked, [proofId]: true } });
    if (typeof URL.createObjectURL === "function") {
      const url = URL.createObjectURL(file.blob);
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }
    return true;
  } catch {
    toast("after.toast.proofFailed", undefined, "warn");
    return false;
  }
}

export function typeChange(proofId: string, note: string): void {
  set({ change: { ...get().change, [proofId]: { note, tried: false } } });
}

/** Approve, or Ask for a change: the customer's answer to one proof, written through their session. */
export async function answerProof(proofId: string, kind: "approved" | "change_asked"): Promise<"done" | "fix" | "failed"> {
  const door = port();
  if (door === null || get().answering !== null) return "failed";
  const note = (get().change[proofId]?.note ?? "").trim();
  if (kind === "change_asked" && note === "") {
    set({ change: { ...get().change, [proofId]: { note: "", tried: true } } });
    return "fix";
  }
  if (kind === "approved" && get().looked[proofId] !== true) return "fix";
  const answerTo: ProofAnswer = kind === "approved" ? { state: "approved" } : { state: "change_asked", change_note: note };
  set({ answering: proofId, answerFailed: null });
  try {
    await door.answerProof(viaOf(proofId), proofId, answerTo);
    const change = { ...get().change };
    delete change[proofId];
    set({ answering: null, answered: { ...get().answered, [proofId]: kind === "approved" ? "approved" : "changed" }, change });
    await reread();
    return "done";
  } catch {
    set({ answering: null, answerFailed: proofId });
    return "failed";
  }
}

/** "Accept the quote", or "Collect it from the works instead": the customer's answer to the works' delivery price. */
export async function answerDelivery(kind: "accepted" | "collect"): Promise<boolean> {
  const door = port();
  const opened = get().opened;
  if (door === null || opened?.read == null || get().deliveryAnswer.busy) return false;
  const answerTo: DeliveryAnswer = kind === "accepted" ? { delivery_quote_state: "accepted" } : { delivery_method: "collect" };
  set({ deliveryAnswer: { busy: true, failed: false, done: null } });
  try {
    await door.answerDelivery(opened.via, opened.read.order["id"] as Id, answerTo);
    set({ deliveryAnswer: { busy: false, failed: false, done: kind } });
    await reread();
    return true;
  } catch {
    set({ deliveryAnswer: { busy: false, failed: true, done: null } });
    return false;
  }
}

/** The design codes the open order's jobs name: Your designs reads each by its code. */
export function openCodes(): string[] {
  const read = get().opened?.read;
  return read == null ? [] : read.jobs.map((j) => j["design_code"]).filter((c): c is string => typeof c === "string" && c !== "");
}

// ── a job's values, from its row ───────────────────────────────────────────

const VALUE_COLUMNS = [
  "product_id",
  "qty",
  "material_option_id",
  "size_option_id",
  "width_mm",
  "height_mm",
  "sides_option_id",
  "lamination_option_id",
  "look",
  "spot_uv_option_id",
  "corners_option_id",
  "edges_option_id",
  "canvas_option_id",
  "packaging_id",
] as const;

const yes = (value: unknown) => value === true || value === 1 || value === "1" || value === "true";

/** A job or a quote line as it was configured, as a new job's values: never its price. */
export function valuesOf(row: Row): JobValues {
  const out: Row = {};
  for (const column of VALUE_COLUMNS) {
    const value = row[column];
    if (value !== null && value !== undefined && value !== "") out[column] = column === "qty" || column === "width_mm" || column === "height_mm" ? Number(value) : value;
  }
  out["proof_by_post"] = yes(row["proof_by_post"]);
  out["express"] = yes(row["express"]);
  if (typeof row["design_code"] === "string" && row["design_code"] !== "") out["design_code"] = row["design_code"];
  return out as unknown as JobValues;
}

/** The job as it is in the catalogue today, as the configurator takes it: an option no longer offered falls back to the works' first. */
function choiceFor(row: Row) {
  const catalogue = useShop.getState().catalogue;
  const product = productById(row["product_id"] as Id);
  return catalogue === null || product === null ? null : { product, choice: choiceOf(catalogue, product, row) };
}

// ── order it again ─────────────────────────────────────────────────────────

/** The past jobs Order it again lists: the signed-in customer's, or those of the order a link opened; newest first, six at most. */
export function againJobs(): { job: Row; order: Row }[] {
  const s = get();
  const pairs: { job: Row; order: Row }[] = [];
  if (signedIn() && s.mine.rows !== null) {
    for (const order of s.mine.orders) for (const job of s.mine.rows.jobs.filter((j) => String(j["order_id"]) === String(order["id"]))) pairs.push({ job, order });
  } else if (s.opened?.via === "link" && s.opened.read !== null) {
    for (const job of s.opened.read.jobs) pairs.push({ job, order: s.opened.read.order });
  }
  return pairs.filter((p) => p.job["stage"] !== "cancelled" && productById(p.job["product_id"] as Id) !== null).slice(0, 6);
}

/** The order's own way of getting it, for a past job's fresh price: its method and, for a delivery, its address. */
function getting(order: Row): Row {
  const out: Row = { delivery_method: order["delivery_method"] === "deliver" ? "deliver" : "collect", language: language() };
  if (out["delivery_method"] === "deliver") for (const column of ["address_line1", "address_line2", "town", "postcode"]) if (typeof order[column] === "string" && order[column] !== "") out[column] = order[column];
  return out;
}

/**
 * Each past job priced on today's rate card: one dry run of the job as its
 * own order, the way it went (collected, or delivered to the same address),
 * so its total carries its delivery and tax.
 */
export async function repriceAgain(): Promise<void> {
  const shop = useShop.getState().port;
  if (shop === null) return;
  const jobs = againJobs();
  const ask = jobs.filter(({ job }) => get().reprices[String(job["id"])] === undefined || get().reprices[String(job["id"])]?.state === "failed");
  if (ask.length === 0) return;
  set({ reprices: { ...get().reprices, ...Object.fromEntries(ask.map(({ job }) => [String(job["id"]), { state: "busy", total: null }])) } });
  await Promise.all(
    ask.map(async ({ job, order }) => {
      const id = String(job["id"]);
      try {
        const quoted = await shop.quote({ values: getting(order), children: { jobs: [{ values: valuesOf(job) }] } });
        set({ reprices: { ...get().reprices, [id]: { state: "ok", total: String(quoted.order["total"] ?? "") } } });
      } catch {
        set({ reprices: { ...get().reprices, [id]: { state: "failed", total: null } } });
      }
    }),
  );
}

/** "Reorder": the job set up again on its product's page, as it went to press, priced there on today's rate card. */
export function reorder(job: Row, ref: string): boolean {
  const found = choiceFor(job);
  if (found === null) return false;
  openProductAs(found.product.code, found.choice);
  setTimeout(() => toast("after.toast.loaded", { ref }), 0);
  return true;
}

// ── saved quotes ───────────────────────────────────────────────────────────

/** The quotes Saved quotes lists: the signed-in customer's, then any saved or opened on this visit that are not among them. */
export function listedQuotes(): { quote: Row; lines: Row[]; via: "mine" | HeldQuote }[] {
  const s = get();
  const out: { quote: Row; lines: Row[]; via: "mine" | HeldQuote }[] = [];
  const seen = new Set<string>();
  if (signedIn()) {
    for (const quote of s.mine.quotes) {
      seen.add(String(quote["number"]));
      out.push({ quote, lines: s.mine.quoteLines.filter((l) => String(l["quote_id"]) === String(quote["id"])), via: "mine" });
    }
  }
  for (const held of s.held) {
    const read = s.heldRead[held.number];
    if (read === undefined || read === null || seen.has(held.number)) continue;
    out.push({ quote: read.quote, lines: read.lines, via: held });
  }
  return out;
}

/** The quotes saved or opened on this visit, read by their own links; one whose link opens nothing now is dropped. */
export async function loadHeldQuotes(): Promise<void> {
  const door = port();
  const held = get().held;
  if (door === null) return;
  if (held.length === 0) {
    set({ heldState: "ok" });
    return;
  }
  set({ heldState: "loading" });
  try {
    const reads = await Promise.all(held.map((h) => door.readHeldQuote(h).catch(() => null)));
    const heldRead: Record<string, QuoteRead | null> = {};
    held.forEach((h, i) => (heldRead[h.number] = reads[i] ?? null));
    const live = held.filter((h) => heldRead[h.number] !== null);
    set({ heldRead, held: live, heldState: "ok" });
    keepHeldQuotes(live);
  } catch {
    set({ heldState: "failed" });
  }
}

/** A quote's own link from the address bar (`/quote#<code>`): kept for the visit, so Saved quotes lists it. */
export async function openQuoteLink(token: string): Promise<void> {
  const door = port();
  if (door === null) return;
  try {
    const opened = await door.openQuoteLink(token);
    if (typeof opened === "string") {
      set({ quoteLink: opened });
      return;
    }
    hold(opened);
    set({ quoteLink: null });
    await loadHeldQuotes();
    void repriceQuotes();
  } catch {
    set({ quoteLink: "unknown" });
  }
}

function hold(quote: HeldQuote): void {
  const held = [quote, ...get().held.filter((h) => h.number !== quote.number)];
  set({ held });
  keepHeldQuotes(held);
}

/** Each listed quote on today's rate card: one dry run of the quote as it was saved, its lines and its way of getting it. */
export async function repriceQuotes(): Promise<void> {
  const shop = useShop.getState().port;
  if (shop === null) return;
  const ask = listedQuotes().filter(({ quote }) => get().quotePrices[String(quote["id"])] === undefined);
  if (ask.length === 0) return;
  set({ quotePrices: { ...get().quotePrices, ...Object.fromEntries(ask.map(({ quote }) => [String(quote["id"]), { state: "busy" as const, total: null }])) } });
  await Promise.all(
    ask.map(async ({ quote, lines }) => {
      const id = String(quote["id"]);
      const body: QuoteBody = {
        values: { delivery_method: quote["delivery_method"] === "deliver" ? "deliver" : "collect", email: String(quote["email"] ?? ""), language: language() },
        children: { quote_lines: [...lines].sort(byPosition).map((line) => ({ values: valuesOf(line) })) },
      };
      try {
        const priced = await shop.priceQuote(body);
        set({ quotePrices: { ...get().quotePrices, [id]: { state: "ok", total: String(priced.quote["total"] ?? "") } } });
      } catch {
        set({ quotePrices: { ...get().quotePrices, [id]: { state: "failed", total: null } } });
      }
    }),
  );
}

const byPosition = (a: Row, b: Row) => Number(a["position"] ?? 0) - Number(b["position"] ?? 0) || Number(a["id"]) - Number(b["id"]);

export function typeName(quoteId: string, name: string): void {
  set({ names: { ...get().names, [quoteId]: name } });
}

/** "Save name": the quote's own name, written through the session that reads it. */
export async function saveName(quoteId: string): Promise<boolean> {
  const door = port();
  const listed = listedQuotes().find((q) => String(q.quote["id"]) === quoteId);
  const typed = get().names[quoteId];
  if (door === null || listed === undefined || typed === undefined || get().renaming !== null) return false;
  const label = typed.trim();
  set({ renaming: quoteId });
  try {
    const saved = await door.renameQuote(listed.via, quoteId, label);
    const names = { ...get().names };
    delete names[quoteId];
    const patch = (q: Row) => (String(q["id"]) === quoteId ? { ...q, label: saved["label"] ?? label } : q);
    const heldRead = Object.fromEntries(Object.entries(get().heldRead).map(([k, read]) => [k, read === null ? null : { ...read, quote: patch(read.quote) }]));
    set({ renaming: null, names, mine: { ...get().mine, quotes: get().mine.quotes.map(patch) }, heldRead });
    toast(label === "" ? "after.toast.nameCleared" : "after.toast.named", { name: label });
    return true;
  } catch {
    set({ renaming: null });
    toast("after.toast.nameFailed", undefined, "warn");
    return false;
  }
}

/** "Open": the quote's first job on its product's page, as it was saved, to keep tweaking. */
export function openQuote(lines: readonly Row[]): boolean {
  const first = [...lines].sort(byPosition)[0];
  const found = first === undefined ? null : choiceFor(first);
  if (found === null) return false;
  openProductAs(found.product.code, found.choice);
  setTimeout(() => toast("after.toast.openedQuote"), 0);
  return true;
}

/** "Add to order": every line of the quote into the basket as it was saved, priced again by the basket's dry run. */
export async function addQuoteToBasket(lines: readonly Row[], name: string): Promise<boolean> {
  const sorted = [...lines].sort(byPosition);
  const codes = sorted.map((l) => l["design_code"]).filter((c): c is string => typeof c === "string" && c !== "");
  const shop = useShop.getState().port;
  let designs: SavedDesign[] = [];
  if (codes.length > 0 && shop !== null) designs = await readDesigns(shop.customiser(), codes).catch(() => []);
  const basket: Omit<BasketLine, "id">[] = [];
  for (const line of sorted) {
    const found = choiceFor(line);
    if (found === null) continue;
    const code = typeof line["design_code"] === "string" && line["design_code"] !== "" ? line["design_code"] : null;
    const design = code === null ? null : (designs.find((d) => d.code === code) ?? { id: (line["design_id"] as Id | null) ?? 0, code, base_id: found.product.baseId ?? 0, ready_design_id: null, values: { parts: {} }, state: "draft" as const, updatedAt: null, session: null, files: {} });
    basket.push({ productId: found.product.id, choice: found.choice, design, features: [], artwork: [] });
  }
  if (basket.length === 0) return false;
  addLinesToBasket(basket);
  toast("after.toast.addedQuote", { name });
  return true;
}

export function findOlder(): void {
  set({ olderGate: true });
}

// ── save this quote ────────────────────────────────────────────────────────

/** "Save this quote": straight away for a signed-in customer, otherwise the sheet that asks where to send its link. */
export async function startSaveQuote(): Promise<"saved" | "ask" | "failed"> {
  const me = get().me;
  if (signedIn() && me?.email != null) return (await saveQuote(me.email)) ? "saved" : "failed";
  const typed = useShop.getState().details.email;
  set({ saving: { ...get().saving, open: true, email: get().saving.email || typed, tried: false, failed: null } });
  return "ask";
}

export function typeSaveEmail(email: string): void {
  set({ saving: { ...get().saving, email, failed: null } });
}

export function closeSaveQuote(): void {
  set({ saving: { ...get().saving, open: false, tried: false, failed: null } });
}

export function saveEmailError(email: string): "empty" | "shape" | null {
  const e = email.trim();
  return e === "" ? "empty" : EMAIL.test(e) ? null : "shape";
}

/**
 * The job on the product's page saved as a quote: a dry run of it as the
 * quote it would be, then the one save held to that total, with a retry key.
 * Its link comes back with a session on it, kept for the visit; the e-mail
 * Adminium sends carries the same link.
 */
export async function saveQuote(email: string = get().saving.email): Promise<boolean> {
  const shop = useShop.getState();
  const product = productById(shop.catalogue?.products.find((p) => p.code === shop.productCode)?.id ?? -1);
  if (shop.port === null || shop.catalogue === null || shop.choice === null || product === null || get().saving.busy) return false;
  if (saveEmailError(email) !== null) {
    set({ saving: { ...get().saving, tried: true } });
    return false;
  }
  const editing = shop.editing === null ? null : (shop.basket.find((b) => b.id === shop.editing) ?? null);
  const line = { ...jobValues(shop.catalogue, product, shop.choice), ...(editing?.design?.code ? { design_code: editing.design.code } : {}) };
  const body: QuoteBody = { values: { email: email.trim(), language: language(), delivery_method: shop.delivery }, children: { quote_lines: [{ values: line }] } };
  set({ saving: { ...get().saving, busy: true, failed: null } });
  try {
    const priced = await shop.port.priceQuote(body);
    const made = await shop.port.saveQuote(body, get().saving.clientKey, String(priced.quote["total"] ?? ""));
    const number = String(made.quote["number"] ?? "");
    if (made.link !== null) hold({ number, session: made.link.session });
    set({ saving: { open: false, email: email.trim(), tried: false, busy: false, failed: null, clientKey: freshClientKey() }, heldState: "idle" });
    toast("after.toast.quoteSaved", { ref: number });
    if (signedIn()) void loadMine();
    return true;
  } catch (error) {
    set({ saving: { ...get().saving, busy: false, failed: isShopError(error) ? "refused" : "unreachable" } });
    return false;
  }
}

// ── the sample pack ────────────────────────────────────────────────────────

export function toggleSample(code: string): void {
  const picked = get().samples.picked;
  set({ samples: { ...get().samples, picked: picked.includes(code) ? picked.filter((c) => c !== code) : [...picked, code], refused: null } });
}

export function typeSamples(patch: Partial<SampleValues>): void {
  set({ samples: { ...get().samples, values: { ...get().samples.values, ...patch }, refused: null } });
}

/** What the page itself can say of the pack's form before it is sent. */
export function sampleErrors(s: AfterState["samples"]): Partial<Record<SampleField | "stocks", "empty" | "shape">> {
  const v = s.values;
  const email = v.email.trim();
  return {
    ...(s.picked.length === 0 ? { stocks: "empty" as const } : {}),
    ...(v.name.trim() === "" ? { name: "empty" as const } : {}),
    ...(email === "" ? { email: "empty" as const } : !EMAIL.test(email) ? { email: "shape" as const } : {}),
    ...(v.line1.trim() === "" ? { line1: "empty" as const } : {}),
    ...(v.town.trim() === "" ? { town: "empty" as const } : {}),
    ...(v.postcode.trim() === "" ? { postcode: "empty" as const } : {}),
  };
}

/** The write "Post me the pack" sends: only what was typed, trimmed, and each stock picked as a link to it. */
export function sampleBody(s: AfterState["samples"]): { values: Row; children: { sample_stocks: { values: { material_id: Id } }[] } } {
  const materials = useShop.getState().catalogue?.materials ?? [];
  const v = s.values;
  const values: Row = { name: v.name.trim(), email: v.email.trim(), address_line1: v.line1.trim(), town: v.town.trim(), postcode: v.postcode.trim(), language: language(), client_key: s.clientKey };
  if (v.line2.trim() !== "") values["address_line2"] = v.line2.trim();
  const picked = s.picked.map((code) => materials.find((m) => m.code === code)?.id).filter((id): id is Id => id !== undefined);
  return { values, children: { sample_stocks: picked.map((material_id) => ({ values: { material_id } })) } };
}

/** "Post me the pack": one guest write; a second pack to an address Adminium refuses. */
export async function sendSamples(): Promise<"sent" | "fix" | "failed"> {
  const door = port();
  const s = get().samples;
  if (door === null || s.sending) return "failed";
  if (Object.keys(sampleErrors(s)).length > 0) {
    set({ samples: { ...s, tried: true } });
    return "fix";
  }
  set({ samples: { ...s, tried: true, sending: true, refused: null } });
  try {
    await door.askSamples(sampleBody(s));
    set({ samples: { picked: [], values: NO_SAMPLES, tried: false, sending: false, refused: null, clientKey: freshClientKey() } });
    toast("after.toast.samples");
    return "sent";
  } catch (error) {
    const refused = isShopError(error) ? { column: error.refused.column, reason: error.refused.reason, code: error.refused.code } : { column: null, reason: null, code: "UNREACHABLE" };
    set({ samples: { ...get().samples, sending: false, refused } });
    return isShopError(error) ? "fix" : "failed";
  }
}

/** Whether Adminium refused the pack because one has already gone to the address. */
export function samePlace(refused: AfterState["samples"]["refused"]): boolean {
  return refused !== null && (refused.column === "address_key" || refused.reason === "unique" || refused.reason === "taken" || refused.code === "PUBLIC_DUPLICATE");
}

// ── templates ──────────────────────────────────────────────────────────────

/** A product's template file, as the shop ships it beside its pages. */
export const templateFile = (code: string): string => `marlow-press-${code}-template.pdf`;

/** "Download template": the file is a link beside the shop's pages; once followed, the page says it went. */
export function downloadedTemplate(code: string): void {
  set({ templates: { ...get().templates, [code]: "done" } });
}

/** Where a product's template file is served: beside the shop's own pages. */
export const templateHref = (code: string, base: string): string => `${base.endsWith("/") ? base : `${base}/`}templates/${templateFile(code)}`;

// ── the sign-in link, Your designs ─────────────────────────────────────────

/** The sign-in link's page (`/c#<code>`): the name it greets, read without using it. */
export async function peekSignIn(token: string): Promise<void> {
  const door = port();
  if (door === null || get().signIn.token === token) return;
  set({ signIn: { token, name: null, state: "peeking" } });
  try {
    const name = await door.peekSignInLink(token);
    set({ signIn: { token, name, state: name === null ? "used" : "ready" } });
  } catch {
    set({ signIn: { token, name: null, state: "ready" } });
  }
}

/** "Continue": the link used, the customer signed in; the order they looked for opens, or their orders to pick from. */
export async function continueSignIn(): Promise<boolean> {
  const door = port();
  const { token } = get().signIn;
  if (door === null || token === null) return false;
  set({ signIn: { ...get().signIn, state: "opening" } });
  try {
    if (!(await door.openSignInLink(token))) {
      set({ signIn: { ...get().signIn, state: "used" } });
      return false;
    }
    set({ signIn: { ...get().signIn, state: "done" } });
    await loadMine();
    const wanted = remembered();
    if (wanted !== null && isQuoteRef(wanted)) {
      goView("quotes");
      void repriceQuotes();
      return true;
    }
    const found = wanted === null ? undefined : get().mine.orders.find((o) => normaliseRef(String(o["number"] ?? "")) === wanted);
    goView("order");
    if (found !== undefined) await openMine(found);
    return true;
  } catch {
    set({ signIn: { ...get().signIn, state: "used" } });
    return false;
  }
}

/** A saved design's own link (`/design#<code>`): kept on this device, so Your designs lists it. */
export async function openDesignLink(token: string): Promise<"opened" | "unknown" | "closed"> {
  const shop = useShop.getState().port;
  if (shop === null) return "unknown";
  const opened = await openSavedLink(shop.customiser(), token).catch(() => "unknown" as const);
  if (typeof opened === "string") return opened;
  keepHeld(opened, null);
  return "opened";
}
