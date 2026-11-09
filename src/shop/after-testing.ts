/**
 * A stand-in for Adminium behind the after-order door, for the screens'
 * tests: Harbour Bakery's orders (one with a proof waiting, one collected),
 * a saved quote, the code Adminium would e-mail, an order's own link and a
 * quote's. It records every call with its body, so a test can hold each
 * write to the exact body the page sends. It is not Adminium: the contract
 * test (`src/contract/after.contract.test.ts`) walks a real one.
 *
 * Tests only; nothing that ships imports it.
 */
import type { AfterPort, CodeAnswer, DeliveryAnswer, HeldQuote, Me, OrderRead, ProofAnswer, QuoteRead, Via } from "./after-port.ts";
import { ShopError, type Id, type Refused, type Row } from "./port.ts";

export interface AfterCall {
  call: string;
  args: unknown[];
}

export interface FakeRows {
  orders: Row[];
  jobs: Row[];
  features: Row[];
  artwork: Row[];
  proofs: Row[];
  quotes: Row[];
  quoteLines: Row[];
}

export interface FakeAfter extends AfterPort {
  calls: AfterCall[];
  /** The code the next e-mail carries. */
  code: string;
  /** Refuse the next write with this refusal. */
  refuseNext: (refused: Partial<Refused> & { code: string }) => void;
  /** The link the order's e-mails carry, and the quote's. */
  linkToken: string;
  quoteToken: string;
  rows: FakeRows;
  /** Who is signed in, by address, or nobody. */
  session: string | null;
  linkOpen: boolean;
}

export const CUSTOMER = { name: "Harbour Bakery", email: "hello@harbourbakery.example" };

/** The configuration a job of 500 business cards was ordered with (the sample catalogue's ids). */
const CARDS = { product_id: 1, product_name: "Business cards", product_kind: "sheet", qty: 500, material_option_id: 10, size_option_id: 12, sides_option_id: 14, lamination_option_id: 16, look: "matt", packaging_id: 1, proof_by_post: false, express: false };

export function sampleAfterRows(): FakeRows {
  return {
    orders: [
      {
        id: 13,
        number: "MP-4113",
        status: "placed",
        name: CUSTOMER.name,
        email: CUSTOMER.email,
        delivery_method: "deliver",
        address_line1: "12 Quay Street",
        town: "Marlow",
        postcode: "SL7 1BT",
        total: "104.69",
        delivery_to_quote: 0,
        delivery_quote: null,
        delivery_quote_state: null,
        placed_at: "2026-08-03T09:12:00Z",
        ready_by: "2026-08-07",
        dispatched_at: null,
        collected_at: null,
        tracking: null,
      },
      {
        id: 2,
        number: "MP-4102",
        status: "collected",
        name: CUSTOMER.name,
        email: CUSTOMER.email,
        delivery_method: "collect",
        total: "61.20",
        delivery_to_quote: 0,
        delivery_quote: null,
        delivery_quote_state: null,
        placed_at: "2026-07-14T10:00:00Z",
        ready_by: "2026-07-17",
        dispatched_at: null,
        collected_at: "2026-07-17T15:30:00Z",
        tracking: null,
      },
    ],
    jobs: [
      { id: 131, order_id: 13, position: 1, ...CARDS, design_code: null, design_id: null, stage: "prepress", proof_state: "sent", ready_by: "2026-08-07", turnaround_days: 3, artwork_checked_at: "2026-08-03T11:00:00Z", printing_at: null, finishing_at: null, ready_at: null },
      { id: 21, order_id: 2, position: 1, ...CARDS, qty: 250, lamination_option_id: null, look: null, design_code: "DSGN-7Q2K-X4PA", design_id: 900, stage: "collected", proof_state: "approved", ready_by: "2026-07-17", turnaround_days: 3, artwork_checked_at: "2026-07-14T11:00:00Z", printing_at: "2026-07-15T08:00:00Z", finishing_at: "2026-07-16T09:00:00Z", ready_at: "2026-07-16T16:00:00Z" },
    ],
    features: [],
    artwork: [
      { id: 7, job_id: 131, name: "harbour-front.pdf", file: "file_01ARTWORK7", side: "front", accepted: true, checks: { language: "en-US", rows: [{ check: "size", level: "pos", text: "85 × 55 mm with 3 mm bleed" }, { check: "colour", level: "warn", text: "RGB colours, we convert to CMYK" }] } },
    ],
    proofs: [
      { id: 501, file: "file_01PROOF501", order_id: 13, job_id: 131, version: 1, kind: "email", state: "change_asked", note: null, change_note: "The phone number is wrong.", sent_at: "2026-08-03T14:00:00Z", file_added_at: "2026-08-03T14:00:00Z", answered_at: "2026-08-03T15:20:00Z" },
      { id: 502, file: "file_01PROOF502", order_id: 13, job_id: 131, version: 2, kind: "email", state: "sent", note: null, change_note: null, sent_at: "2026-08-04T10:05:00Z", file_added_at: "2026-08-04T10:05:00Z", answered_at: null },
      { id: 401, file: "file_01PROOF401", order_id: 2, job_id: 21, version: 1, kind: "email", state: "approved", note: null, change_note: null, sent_at: "2026-07-14T14:00:00Z", file_added_at: "2026-07-14T14:00:00Z", answered_at: "2026-07-14T18:00:00Z" },
    ],
    quotes: [{ id: 41, number: "MQ-2041", label: null, email: CUSTOMER.email, delivery_method: "collect", total: "87.55", created_at: "2026-07-22T10:00:00Z" }],
    quoteLines: [{ id: 411, quote_id: 41, position: 1, ...CARDS, design_code: null }],
  };
}

export function fakeAfter(): FakeAfter {
  const calls: AfterCall[] = [];
  let refusal: Refused | null = null;
  const record = (call: string, ...args: unknown[]) => calls.push({ call, args });
  const refuse = () => {
    if (refusal === null) return;
    const r = refusal;
    refusal = null;
    throw new ShopError(r, r.code);
  };
  const mine = () => {
    if (fake.session === null) throw new ShopError({ code: "PUBLIC_CLAIM_REQUIRED", status: 401, column: null, child: null, index: null, reason: null, changed: null, raw: null }, "signed out");
  };
  const orderRead = (via: Via, order: Row): OrderRead => {
    const jobs = fake.rows.jobs.filter((j) => j["order_id"] === order["id"]);
    const ids = new Set(jobs.map((j) => j["id"]));
    return { via, order, jobs, features: [], artwork: fake.rows.artwork.filter((a) => ids.has(a["job_id"])), proofs: fake.rows.proofs.filter((p) => p["order_id"] === order["id"]) };
  };
  const fake: FakeAfter = {
    calls,
    code: "123456",
    linkToken: "LINKCODE0000000A",
    quoteToken: "QUOTECODE000000A",
    rows: sampleAfterRows(),
    session: null,
    linkOpen: false,
    refuseNext: (r) => {
      refusal = { status: 400, column: null, child: null, index: null, reason: null, changed: null, raw: null, ...r };
    },
    async requestCode(email, language) {
      record("requestCode", email, language);
    },
    async verifyCode(email, code): Promise<CodeAnswer> {
      record("verifyCode", email, code);
      if (code === "999999") return { ok: false, reason: "spent" };
      if (code !== fake.code) return { ok: false, reason: "wrong", triesLeft: 4 };
      fake.session = email;
      return { ok: true };
    },
    async openSignInLink(token) {
      record("openSignInLink", token);
      if (token !== "SIGNIN0000000000") return false;
      fake.session = CUSTOMER.email;
      return true;
    },
    async peekSignInLink(token) {
      record("peekSignInLink", token);
      return token === "SIGNIN0000000000" ? "Harbour" : null;
    },
    signedIn: () => fake.session !== null,
    async me(): Promise<Me | null> {
      return fake.session === null ? null : { name: CUSTOMER.name, email: fake.session };
    },
    async signOut() {
      record("signOut");
      fake.session = null;
    },
    async myOrders() {
      mine();
      return fake.rows.orders.filter((o) => o["email"] === fake.session);
    },
    async myRows() {
      mine();
      const orders = new Set(fake.rows.orders.filter((o) => o["email"] === fake.session).map((o) => o["id"]));
      const jobs = fake.rows.jobs.filter((j) => orders.has(j["order_id"]));
      const ids = new Set(jobs.map((j) => j["id"]));
      return { jobs, features: [], artwork: fake.rows.artwork.filter((a) => ids.has(a["job_id"])), proofs: fake.rows.proofs.filter((p) => orders.has(p["order_id"])) };
    },
    async openShared(token) {
      record("openShared", token);
      if (token === fake.linkToken) {
        fake.linkOpen = true;
        return "opened";
      }
      return token === "STOPPEDCODE00000" ? "closed" : "unknown";
    },
    sharedHeld: () => fake.linkOpen,
    async closeShared() {
      record("closeShared");
      fake.linkOpen = false;
    },
    async readShared() {
      return fake.linkOpen ? orderRead("link", fake.rows.orders[0]!) : null;
    },
    async answerProof(via: Via, proofId: Id, answer: ProofAnswer) {
      record("answerProof", via, proofId, answer);
      refuse();
      const proof = fake.rows.proofs.find((p) => String(p["id"]) === String(proofId))!;
      Object.assign(proof, answer, { answered_at: "2026-08-05T09:30:00Z" });
      const job = fake.rows.jobs.find((j) => j["id"] === proof["job_id"])!;
      job["proof_state"] = answer.state;
      if (answer.state === "approved") job["ready_by"] = "2026-08-10";
      return proof;
    },
    async answerDelivery(via: Via, orderId: Id, answer: DeliveryAnswer) {
      record("answerDelivery", via, orderId, answer);
      refuse();
      const order = fake.rows.orders.find((o) => String(o["id"]) === String(orderId))!;
      Object.assign(order, answer);
      return order;
    },
    async proofFile(via, proofId) {
      record("proofFile", via, proofId);
      return { blob: new Blob(["%PDF-1.4\n%%EOF\n"], { type: "application/pdf" }), filename: `proof-${String(proofId)}.pdf` };
    },
    async myQuotes() {
      mine();
      return { quotes: fake.rows.quotes.filter((q) => q["email"] === fake.session), lines: fake.rows.quoteLines };
    },
    async openQuoteLink(token): Promise<HeldQuote | "unknown" | "closed"> {
      record("openQuoteLink", token);
      return token === fake.quoteToken ? { number: "MQ-2041", session: { token: "QSESSION", expiresAt: Date.parse("2027-01-01") } } : "unknown";
    },
    async readHeldQuote(held: HeldQuote): Promise<QuoteRead | null> {
      const quote = fake.rows.quotes.find((q) => q["number"] === held.number);
      return quote === undefined ? null : { quote, lines: fake.rows.quoteLines.filter((l) => l["quote_id"] === quote["id"]) };
    },
    async renameQuote(via, quoteId, label) {
      record("renameQuote", via === "mine" ? "mine" : via.number, quoteId, label);
      refuse();
      const quote = fake.rows.quotes.find((q) => String(q["id"]) === String(quoteId))!;
      quote["label"] = label;
      return quote;
    },
    async askSamples(write) {
      record("askSamples", write);
      refuse();
      return { id: 1, status: "new" };
    },
  };
  return fake;
}
