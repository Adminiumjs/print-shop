/**
 * The works' e-mails, one template per outbox kind, in the eight languages the
 * app ships (the comp `Marlow Press Emails`).
 *
 * Each e-mail's words are a small record of sentences (`EmailWords`), and the
 * layout that holds them is written once below, so a translation is only the
 * words: nobody re-builds a block list per language, and no language can lose
 * a block the others have.
 *
 * `{{…}}` are the outbox's variables, filled by Adminium when it sends:
 * `order.*`, `quote.*` and `sample.*` through the message's links (and one
 * link further from a list's row, `row.material_option.name`); `row.*` inside a list of an
 * order's jobs, a quote's lines or an order's proofs; `practice.*` the works'
 * settings row by its own columns (`practice.address`, `practice.hours`);
 * `appName` the works' name; `manage_url` the order's page and `booking_url`
 * the saved quote's page on the customer side, each opened by the row's own
 * link code after `#`; `staff_url` the works' own side. Money, dates and
 * numbers are written in the reader's language by Adminium (`.money`,
 * `.number`, `.percent`, a date's long form); a choice by its label
 * (`.label`).
 *
 * A linked row's personal columns (an order's name, e-mail and address, a
 * sample pack's address) are never read: Adminium leaves them out of a
 * message, so a template that named one could never be sent. The customer is
 * the one the e-mail goes to; the address is theirs to know.
 *
 * Catalogue words (a product, a stock, a finish, a delivery band) print as
 * the works wrote them, in every language; the sentences and the labels
 * around them are translated.
 *
 * The code a customer signs in with is Adminium's own e-mail (in the eight
 * languages it ships); the saved design's e-mail is the Customiser's.
 */
import { EMAIL_TRANSLATIONS } from "./emails-i18n.ts";
import type { Tag } from "./labels.ts";
import { TO_WORKS, type Kind } from "./outbox.ts";
import { STAGES } from "./tables.ts";

/** One e-mail's own sentences. */
export interface Words {
  /** The template's name, as the E-mails page lists it. */
  name: string;
  subject: string;
  preheader: string;
  /** The small line above the heading. */
  eyebrow: string;
  heading: string;
  paras: string[];
  /** The main button, to the order's or the quote's own page. */
  button?: string;
}

export type EmailWords = Record<Kind, Words> & {
  /** "This link is just for you — don't forward it." */
  own: string;
  /** "Or copy this link:", before the link written out. */
  copy: string;
  /** The rows of a job's price. */
  price: string;
  goods: string;
  /** "Tax", before its rate in brackets. */
  tax: string;
  total: string;
  totalWithDelivery: string;
  /** In place of a delivery's price while the works is still to price it. */
  deliveryToQuote: string;
  readyBy: string;
  /** Ready to collect: where, and when the works is open. */
  where: string;
  open: string;
  /** On its way: who carries it, its tracking number, its weight. */
  sentWith: string;
  dhl: string;
  ourCourier: string;
  tracking: string;
  trackIt: string;
  weight: string;
  /** "Saved", "Posted": a day a quote was saved or a pack posted. */
  saved: string;
  posted: string;
  /** "Proof", before a proof's name ("MP-4129/2 #1"). */
  proof: string;
  /** Proof ready's other two buttons. */
  approve: string;
  askChange: string;
  /** The works' copies: the button to the works' own side, and a change's wait. */
  openWorks: string;
  readyMoves: string;
  /** The footers: an order's, a quote's, a sample pack's, and the works' own copies. */
  footOrder: string;
  footQuote: string;
  footSample: string;
  footWorks: string;
};

export const EMAIL_EN: EmailWords = {
  own: "This link is just for you — don't forward it.",
  copy: "Or copy this link:",
  price: "Price (ex tax)",
  goods: "Goods (ex tax)",
  tax: "Tax",
  total: "Total",
  totalWithDelivery: "Total with delivery",
  deliveryToQuote: "Delivery: we'll e-mail a quote",
  readyBy: "Ready by",
  where: "Where",
  open: "Open",
  sentWith: "Sent with",
  dhl: "DHL",
  ourCourier: "Our courier",
  tracking: "Tracking number",
  trackIt: "Track it",
  weight: "Weight",
  saved: "Saved",
  posted: "Posted",
  proof: "Proof",
  approve: "Approve",
  askChange: "Ask for a change",
  openWorks: "Open the works",
  readyMoves: "Ready by moves to",
  footOrder: "You're getting this e-mail because of your order {{order.number}}.",
  footQuote: "You're getting this e-mail because you saved the quote {{quote.number}}.",
  footSample: "You're getting this e-mail because you asked for a sample pack.",
  footWorks: "Sent to the works about {{order.number}}.",
  "order-received": {
    name: "Order received",
    subject: "Thanks — we've got your order {{order.number}}",
    preheader: "Ready by {{order.ready_by}}.",
    eyebrow: "Order received",
    heading: "Thanks — we've got your order {{order.number}}.",
    paras: ["You pay when you collect, or by the invoice we send with your delivery."],
    button: "Follow your order",
  },
  "proof-ready": {
    name: "Proof ready",
    subject: "Your proof for {{order.number}} is ready",
    preheader: "Open it, then approve it or ask for a change.",
    eyebrow: "Proof",
    heading: "Your proof is ready",
    paras: ["We won't print anything until you say yes."],
    button: "Open the proof (PDF)",
  },
  "proof-approved": {
    name: "Proof approved",
    subject: "Thanks — we're printing {{order.number}}",
    preheader: "Ready by {{order.ready_by}}.",
    eyebrow: "Proof approved",
    heading: "Thanks — we're printing it.",
    paras: [],
    button: "Follow your order",
  },
  "order-ready": {
    name: "Ready to collect",
    subject: "{{order.number}} is ready to collect",
    preheader: "You pay {{order.total.money}} when you collect.",
    eyebrow: "Ready",
    heading: "Your order is ready to collect",
    paras: ["You pay {{order.total.money}} when you collect, tax included."],
    button: "Follow your order",
  },
  "order-dispatched": {
    name: "On its way",
    subject: "{{order.number}} is on its way",
    preheader: "It left the works today.",
    eyebrow: "On its way",
    heading: "Your order is on its way",
    paras: ["The invoice comes with your delivery."],
    button: "Follow your order",
  },
  "quote-saved": {
    name: "Quote saved",
    subject: "Your quote {{quote.number}}",
    preheader: "Saved for when you're ready.",
    eyebrow: "Saved quote",
    heading: "Your quote {{quote.number}}",
    paras: ["Prices can change; we'll show you today's price when you order."],
    button: "Open your quote",
  },
  "sample-pack-sent": {
    name: "Sample pack sent",
    subject: "Your sample pack is on its way",
    preheader: "There's no charge.",
    eyebrow: "Sample pack",
    heading: "Your sample pack is on its way",
    paras: ["It should reach you in 2–3 working days. There's no charge."],
  },
  "delivery-quote": {
    name: "Delivery quote",
    subject: "Your delivery quote for {{order.number}}",
    preheader: "Accept it, or collect from the works instead.",
    eyebrow: "Delivery quote",
    heading: "Your delivery quote",
    paras: [
      "Your order weighs about {{order.weight_kg.number}}\u00a0kg. That's over our delivery bands, so we've priced the delivery for you: {{order.delivery_quote.money}}.",
      "Rather collect it? Collection from the works costs nothing.",
    ],
    button: "Accept the quote",
  },
  "change-asked": {
    name: "Change asked: works copy",
    subject: "Change asked on {{order.number}}",
    preheader: "A customer asked for a change on a proof.",
    eyebrow: "For the works · proof",
    heading: "Change asked on {{order.number}}",
    paras: [],
  },
  "warnings-accepted": {
    name: "Warnings accepted: works copy",
    subject: "New order {{order.number}} — artwork warnings accepted",
    preheader: "Check the artwork before the proof.",
    eyebrow: "For the works · new order",
    heading: "New order {{order.number}} — artwork warnings accepted",
    paras: ["The customer ticked a warning on their artwork at checkout. Check it before you make the proof."],
  },
};

type Block = { block: string; id: string; data: Record<string, unknown> };

const text = (id: string, paras: string[]): Block => ({ block: "email.text", id, data: { paras } });
const facts = (id: string, lines: [string, string][], extra: Record<string, unknown> = {}): Block => ({
  block: "email.tax-breakdown",
  id,
  data: { lines: lines.map(([label, amount]) => ({ label, amount })), ...extra },
});
const button = (id: string, label: string, url: string, extra: Record<string, unknown> = {}): Block => ({ block: "email.button", id, data: { label, url, ...extra } });

/** The order's own page, opened by its link code. */
const ORDER_URL = "{{manage_url}}#{{order.link_token}}";
/** The saved quote's own page, opened by its link code. */
const QUOTE_URL = "{{booking_url}}#{{quote.link_token}}";
/** DHL's own tracking page for the order's tracking number. */
const TRACK_URL = "https://www.dhl.com/gb-en/home/tracking/tracking-parcel.html?submit=1&tracking-id={{order.tracking}}";

/**
 * A job as one line: how many of which product, its size and stock and
 * sides, its finish under them, its price at the far side. Catalogue names
 * print as the works wrote them; a preset size by its name, a large-format
 * job by its own width and height (`dims`), never both.
 */
const JOB_ROW = {
  title: "{{row.qty.number}} × {{row.product_name}}",
  meta: "{{row.size_option.name|}}{{row.dims|}} · {{row.material_option.name|}} · {{row.sides_option.name|}}",
  note: "{{row.lamination_option.name|}}{{row.edges_option.name|}}",
};

/** An order's jobs, with their prices or without: a cancelled job is no longer listed, as the order's money leaves it out. */
const jobs = (priced: boolean): Block => ({
  block: "email.rows",
  id: "jobs",
  data: {
    from: { link: "order", table: "jobs", via: "order_id", orderBy: "position", where: { column: "stage", in: STAGES.filter((s) => s !== "cancelled") }, limit: 50 },
    row: priced ? { ...JOB_ROW, amount: "{{row.price.money}}" } : JOB_ROW,
  },
});

/** A saved quote's lines, priced. */
const QUOTE_LINES: Block = {
  block: "email.rows",
  id: "lines",
  data: {
    from: { link: "quote", table: "quote_lines", via: "quote_id", orderBy: "position", limit: 50 },
    row: { ...JOB_ROW, amount: "{{row.price.money}}" },
  },
};

/** A proof as one line, by the job it is of: the job's name ("MP-4129/2", which of the order's jobs), how many of what. */
const PROOF_ROW = { title: "{{row.job.code}} · {{row.job.qty}} × {{row.job.product_name}}", meta: "{{row.job.dims|}}" };

/** The proofs of an order in one state, by the job each is of. */
const proofs = (state: string, note?: string): Block => ({
  block: "email.rows",
  id: "proofs",
  data: {
    from: { link: "order", table: "proofs", via: "order_id", orderBy: "version", where: { column: "state", in: [state] }, limit: 20 },
    row: { ...PROOF_ROW, ...(note === undefined ? {} : { note }) },
  },
});

/** The proof the e-mail is about, by its name: its order's number, its job's place and its own number ("MP-4129/2 #1"). */
const thisProof = (w: EmailWords): Block => facts("proof", [[w.proof, "{{proof.title}}"]]);

/**
 * An order's money: the goods, ONE delivery line for the whole order (or
 * the collection), the tax at the order's own rate
 * and the total. While the works is still to price a delivery over the bands
 * the delivery line says so and the total is the goods and their tax.
 */
function orderMoney(w: EmailWords): Block[] {
  const tax = `${w.tax} ({{order.tax_rate.percent}})`;
  return [
    facts(
      "money",
      [
        [w.price, "{{order.goods_total.money}}"],
        ["{{order.delivery_method.label}}", "{{order.delivery_priced.money}}"],
        [tax, "{{order.tax.money}}"],
        [w.total, "{{order.total.money}}"],
      ],
      { onlyWith: "order.delivery_priced" },
    ),
    facts(
      "money-to-quote",
      [
        [w.price, "{{order.goods_total.money}}"],
        [w.deliveryToQuote, ""],
        [tax, "{{order.tax.money}}"],
        [w.total, "{{order.total.money}}"],
      ],
      { onlyWithout: "order.delivery_priced" },
    ),
  ];
}

/** The private-link lines under a button: whose link it is, and the link written out. */
const ownLink = (w: EmailWords, url: string): Block => text("own", [w.own, `${w.copy} ${url}`]);

function body(kind: Kind, w: EmailWords): Block[] {
  const own = w[kind];
  const head: Block[] = [
    { block: "email.legal", id: "eyebrow", data: { text: own.eyebrow } },
    { block: "email.heading", id: "heading", data: { text: own.heading } },
  ];
  const paras = own.paras.length === 0 ? [] : [text("body", own.paras)];
  const follow = (label: string) => [button("follow", label, ORDER_URL), ownLink(w, ORDER_URL)];
  switch (kind) {
    case "order-received":
      return [...head, jobs(true), ...orderMoney(w), facts("ready", [[w.readyBy, "{{order.ready_by}}"]]), ...paras, ...follow(own.button!)];
    case "proof-ready":
      return [
        ...head,
        // Which proof, and so which job, this one is; then the order's proofs waiting, each by its job (a second job may have none yet).
        thisProof(w),
        proofs("sent"),
        button("open", own.button!, ORDER_URL),
        button("approve", w.approve, ORDER_URL),
        button("change", w.askChange, ORDER_URL),
        ...paras,
        ownLink(w, ORDER_URL),
      ];
    case "proof-approved":
      // The jobs approved so far, never one still waiting on its proof.
      return [...head, facts("ready", [[w.readyBy, "{{order.ready_by}}"]]), proofs("approved"), ...follow(own.button!)];
    case "order-ready":
      return [...head, jobs(false), facts("where", [[w.where, "{{practice.address}}"], [w.open, "{{practice.hours}}"]]), ...paras, ...follow(own.button!)];
    case "order-dispatched":
      return [
        ...head,
        jobs(false),
        facts(
          "carrier",
          [
            [w.sentWith, w.dhl],
            [w.tracking, "{{order.tracking}}"],
          ],
          { onlyWith: "order.tracking" },
        ),
        facts(
          "courier",
          [
            [w.sentWith, w.ourCourier],
            [w.weight, "{{order.weight_kg.number}}\u00a0kg"],
          ],
          { onlyWithout: "order.tracking" },
        ),
        button("track", w.trackIt, TRACK_URL, { onlyWith: "order.tracking" }),
        ...paras,
        ...follow(own.button!),
      ];
    case "quote-saved":
      return [
        ...head,
        facts("saved", [[w.saved, "{{quote.created_at.date}}"]]),
        QUOTE_LINES,
        facts(
          "money",
          [
            [w.price, "{{quote.goods_total.money}}"],
            ["{{quote.delivery_method.label}}", "{{quote.delivery_priced.money}}"],
            [`${w.tax} ({{quote.tax_rate.percent}})`, "{{quote.tax.money}}"],
            [w.total, "{{quote.total.money}}"],
          ],
          { onlyWith: "quote.delivery_priced" },
        ),
        facts(
          "money-to-quote",
          [
            [w.price, "{{quote.goods_total.money}}"],
            [w.deliveryToQuote, ""],
            [`${w.tax} ({{quote.tax_rate.percent}})`, "{{quote.tax.money}}"],
            [w.total, "{{quote.total.money}}"],
          ],
          { onlyWithout: "quote.delivery_priced" },
        ),
        ...paras,
        button("open", own.button!, QUOTE_URL),
        ownLink(w, QUOTE_URL),
      ];
    case "sample-pack-sent":
      return [...head, ...paras, facts("posted", [[w.posted, "{{sample.posted_at.date}}"]])];
    case "delivery-quote":
      return [
        ...head,
        text("body", [own.paras[0]!]),
        jobs(true),
        facts("money", [
          [w.goods, "{{order.goods_total.money}}"],
          ["{{order.delivery_method.label}}", "{{order.delivery_quote.money}}"],
          [`${w.tax} ({{order.tax_rate.percent}})`, "{{order.quote_tax.money}}"],
          [w.totalWithDelivery, "{{order.quote_total.money}}"],
        ]),
        button("follow", own.button!, ORDER_URL),
        text("own", [own.paras[1]!, w.own, `${w.copy} ${ORDER_URL}`]),
      ];
    case "change-asked":
      return [
        ...head,
        // The proof the change is asked of; then the order's proofs with a change asked, each by its job, in the customer's words.
        thisProof(w),
        proofs("change_asked", "“{{row.change_note|}}”"),
        facts("ready", [[w.readyMoves, "{{order.ready_by}}"]]),
        button("works", w.openWorks, "{{staff_url}}", { onlyWith: "staff_url" }),
      ];
    case "warnings-accepted":
      return [...head, ...paras, jobs(false), facts("ready", [[w.readyBy, "{{order.ready_by}}"]]), button("works", w.openWorks, "{{staff_url}}", { onlyWith: "staff_url" })];
  }
}

/** The works' name and where to find it, then why this e-mail came. */
function footer(kind: Kind, w: EmailWords): string {
  const why = TO_WORKS.has(kind) ? w.footWorks : kind === "quote-saved" ? w.footQuote : kind === "sample-pack-sent" ? w.footSample : w.footOrder;
  return `{{appName}} · {{practice.address}}\n{{practice.phone}} · {{practice.email}}\n{{practice.hours}}\n${why}`;
}

function layout(kind: Kind, w: EmailWords) {
  const own = w[kind];
  return { subject: own.subject, preheader: own.preheader, blocks: body(kind, w), footer: footer(kind, w) };
}

/** Every language's words: English here, the others in `emails-i18n.ts`. */
export function emailWords(): Record<Tag, EmailWords> {
  return { "en-US": EMAIL_EN, ...EMAIL_TRANSLATIONS };
}

/** Every variable a template reads, `row.*` inside its lists included, and those with a backup (`{{x|}}`) marked. */
export function variablesOf(template: unknown): { name: string; backup: boolean }[] {
  const text = JSON.stringify(template);
  return [...text.matchAll(/\{\{([A-Za-z_.]+)(\|[^}]*)?\}\}/g)].map((m) => ({ name: m[1]!, backup: m[2] !== undefined }));
}

/** The variables each template reads, for the template editor's list. */
function varsOf(kind: Kind): string[] {
  const found = new Set(variablesOf(layout(kind, EMAIL_EN)).map((v) => v.name));
  return [...found].filter((name) => !name.startsWith("row.")).sort();
}

/** One kind's template in one language, as the manifest carries it. */
export function templateOf(kind: Kind, tag: Tag) {
  return layout(kind, emailWords()[tag]);
}

/** The manifest's `emailTemplates`: one per kind, in every language the words are in. */
export function emailTemplates(kinds: readonly Kind[]): unknown[] {
  const words = emailWords();
  return kinds.map((kind) => ({
    key: `printing-${kind}`,
    name: Object.fromEntries(Object.entries(words).map(([tag, w]) => [tag, w[kind].name])),
    vars: varsOf(kind),
    locales: Object.fromEntries(Object.entries(words).map(([tag, w]) => [tag, layout(kind, w)])),
  }));
}
