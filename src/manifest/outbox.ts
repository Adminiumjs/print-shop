/**
 * The works' e-mails: the `messages` table is the outbox, and every e-mail is
 * a row in it the dashboard lists.
 *
 * To the customer, every one a service mail (each is about their own order,
 * proof, quote or sample pack):
 *   order-received      the order is in: its jobs, what it costs, when it
 *                       will be ready, and the order's own link;
 *   proof-ready         a proof of a job is waiting: open it, then approve it
 *                       or ask for a change;
 *   proof-approved      the proof is approved, the job is on the press, and
 *                       the day it will be ready;
 *   order-ready         ready to collect at the works;
 *   order-dispatched    on its way: the carrier, and the tracking number when
 *                       DHL carried it;
 *   quote-saved         the saved quote and its link;
 *   sample-pack-sent    the sample pack is in the post;
 *   delivery-quote      an order over the delivery bands: the price the works
 *                       set for its delivery, to accept or collect instead.
 * To the works' own address (staff mail, no class):
 *   change-asked        a customer asked for a change on a proof;
 *   warnings-accepted   a new order whose customer accepted artwork warnings.
 *
 * The code a customer signs in with and the saved design's link are not here:
 * Adminium sends the first (in its own eight languages), the Customiser the
 * second. Every template is in `emails.ts`, in the app's eight languages.
 */

export const KINDS = [
  "order-received",
  "proof-ready",
  "proof-approved",
  "order-ready",
  "order-dispatched",
  "quote-saved",
  "sample-pack-sent",
  "delivery-quote",
  "change-asked",
  "warnings-accepted",
] as const;
export type Kind = (typeof KINDS)[number];

/** Mail to the works' own address: no class. */
export const TO_WORKS: ReadonlySet<Kind> = new Set(["change-asked", "warnings-accepted"]);

/** The outbox's kinds, as the E-mails page names them. */
export const KIND_NAMES: Record<Kind, string> = {
  "order-received": "Order received",
  "proof-ready": "Proof ready",
  "proof-approved": "Proof approved",
  "order-ready": "Ready to collect",
  "order-dispatched": "Dispatched",
  "quote-saved": "Quote saved",
  "sample-pack-sent": "Sample pack sent",
  "delivery-quote": "Delivery quote",
  "change-asked": "Change asked: works copy",
  "warnings-accepted": "Warnings accepted: works copy",
};

const works = { setting: { table: "settings", column: "email" } };

export const OUTBOX = {
  table: "messages",
  columns: {
    kind: "kind",
    status: "status",
    to: "to_address",
    language: "language",
    due: "due",
    sentAt: "sent_at",
    error: "error",
    skipReason: "skip_reason",
    repeatKey: "repeat_key",
  },
  links: { order: "order_id", proof: "proof_id", quote: "quote_id", sample: "sample_id", customer: "customer_id" },
  recipient: {
    via: "customer_id",
    table: "customers",
    email: "email",
    name: "name",
    // Written in the language the order was placed in, whatever the customer's own row says.
    language: { column: "language" },
    fallback: { via: "order_id", email: "email", name: "name", language: "language" },
  },
  settings: { table: "settings", name: "works_name", phone: "phone" },
  // An order's own link opens its page on the customer side, a saved quote's its own; each code rides the fragment.
  // (`booking_url` is the outbox's second page: here, a saved quote's.)
  pages: { manage: "/order", booking: "/quote" },
  kinds: Object.fromEntries(KINDS.map((kind) => [kind, `printing-${kind}`])),
  classes: Object.fromEntries(KINDS.filter((kind) => !TO_WORKS.has(kind)).map((kind) => [kind, "service"])),
  producers: [
    { kind: "order-received", link: "order_id", onCreate: { table: "orders" } },
    // About the proof itself, so each proof of an order is its own e-mail (a fresh one after a change asked too); the
    // order and its customer are found through it. Only a proof with its PDF: one added on the dashboard with none has
    // nothing to open, and is e-mailed once it is given its PDF.
    { kind: "proof-ready", link: "proof_id", onCreate: { table: "proofs", where: { column: "file", isNull: false } } },
    { kind: "proof-ready", link: "proof_id", onChange: { table: "proofs", columns: ["file"], changed: true, where: { column: "file", isNull: false } } },
    // Each proof approved, about its own proof: an order's second job approved is told the customer too.
    { kind: "proof-approved", link: "proof_id", onChange: { table: "proofs", column: "state", to: "approved" } },
    { kind: "order-ready", link: "order_id", onChange: { table: "orders", column: "status", to: "ready", where: { column: "delivery_method", eq: "collect" } } },
    { kind: "order-dispatched", link: "order_id", onChange: { table: "orders", column: "status", to: "dispatched" } },
    { kind: "quote-saved", link: "quote_id", onCreate: { table: "saved_quotes" }, recipient: { column: "email", name: "name", language: "language" } },
    { kind: "sample-pack-sent", link: "sample_id", onChange: { table: "sample_requests", column: "status", to: "posted" }, recipient: { column: "email", name: "name", language: "language" } },
    { kind: "delivery-quote", link: "order_id", onChange: { table: "orders", column: "delivery_quote_state", to: "sent" } },
    // Each change asked, about its own proof: a second change on the next proof is told the works too.
    { kind: "change-asked", link: "proof_id", onChange: { table: "proofs", column: "state", to: "change_asked" }, recipient: works },
    { kind: "warnings-accepted", link: "order_id", onCreate: { table: "orders", where: { column: "has_warnings", eq: 1 } }, recipient: works },
  ],
};
