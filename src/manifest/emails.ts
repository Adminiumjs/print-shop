/**
 * The works' e-mails, one template per outbox kind.
 *
 * PLACEHOLDERS: each template is a heading and a few plain sentences in
 * English, enough for the outbox to send something true. The drawn e-mails
 * (`Marlow Press Emails`), with their blocks and their eight languages,
 * replace them; nothing else reads these words.
 *
 * `{{…}}` are the outbox's variables, filled by Adminium when it sends:
 * `order.*`, `quote.*` and `sample.*` through the message's links;
 * `practice.*` the works' settings row; `recipient.first_name` the customer;
 * `manage_url` the customer side's order page.
 */
import { KIND_NAMES, type Kind } from "./outbox.ts";

interface Words {
  subject: string;
  preheader: string;
  heading: string;
  paras: string[];
  /** A button to the order's own page, with the order's link code. */
  button?: string;
}

const WORDS: Record<Kind, Words> = {
  "order-received": {
    subject: "Your order {{order.number}} is in",
    preheader: "Ready by {{order.ready_by}}.",
    heading: "Thank you, {{recipient.first_name}}.",
    paras: [
      "We have your order {{order.number}}. It comes to {{order.total}}, and it will be ready by {{order.ready_by}}.",
      "You pay when you collect, or by the invoice we send with your delivery.",
      "We'll e-mail you a proof of each job before we print anything.",
    ],
    button: "Follow your order",
  },
  "proof-ready": {
    subject: "Your proof for {{order.number}} is ready",
    preheader: "Open it, then approve it or ask for a change.",
    heading: "Your proof is ready.",
    paras: ["Open the proof for your order {{order.number}}, then approve it or tell us what to change.", "We won't print anything until you say yes."],
    button: "Open your proof",
  },
  "proof-approved": {
    subject: "We're printing {{order.number}}",
    preheader: "Ready by {{order.ready_by}}.",
    heading: "Thanks, we're printing it.",
    paras: ["Your proof for {{order.number}} is approved. It will be ready by {{order.ready_by}}."],
    button: "Follow your order",
  },
  "order-ready": {
    subject: "Your order {{order.number}} is ready to collect",
    preheader: "Come by the works when it suits you.",
    heading: "It's ready.",
    paras: ["Your order {{order.number}} is ready to collect from the works. You pay {{order.total}} when you collect."],
    button: "Follow your order",
  },
  "order-dispatched": {
    subject: "Your order {{order.number}} is on its way",
    preheader: "It left the works today.",
    heading: "It's on its way.",
    paras: ["Your order {{order.number}} left the works today."],
    button: "Follow your order",
  },
  "quote-saved": {
    subject: "Your quote {{quote.number}}",
    preheader: "Saved for when you're ready.",
    heading: "Your quote is saved.",
    paras: ["We've saved your quote {{quote.number}} at {{quote.total}}.", "Prices can change; we'll show you today's price when you order."],
  },
  "sample-pack-sent": {
    subject: "Your sample pack is on its way",
    preheader: "It's in the post.",
    heading: "Your sample pack is on its way.",
    paras: ["We've posted your sample pack to {{sample.address_line1}}, {{sample.town}}. There's no charge."],
  },
  "delivery-quote": {
    subject: "Your delivery quote for {{order.number}}",
    preheader: "Accept it, or collect from the works instead.",
    heading: "Your delivery quote.",
    paras: ["Your order {{order.number}} is over our delivery bands, so we've priced its delivery for you: {{order.delivery_quote}}.", "Accept the quote, or collect it from the works instead."],
    button: "Accept the quote",
  },
  "change-asked": {
    subject: "Change asked on {{order.number}}",
    preheader: "From {{order.name}}.",
    heading: "A change was asked for.",
    paras: ["{{order.name}} asked for a change on a proof for {{order.number}}."],
  },
  "warnings-accepted": {
    subject: "New order {{order.number}}: artwork warnings accepted",
    preheader: "From {{order.name}}.",
    heading: "Artwork warnings accepted.",
    paras: ["{{order.name}} placed {{order.number}} and accepted a warning on their artwork. Check it before the proof."],
  },
};

function layout(kind: Kind) {
  const w = WORDS[kind];
  const blocks: Record<string, unknown>[] = [
    { block: "email.heading", id: "heading", data: { text: w.heading } },
    { block: "email.text", id: "body", data: { paras: w.paras } },
  ];
  if (w.button !== undefined) blocks.push({ block: "email.button", id: "follow", data: { label: w.button, url: "{{manage_url}}#{{order.link_token}}" } });
  return { subject: w.subject, preheader: w.preheader, blocks, footer: "{{practice.name}}" };
}

/** The variables each template reads, for the template editor's list. */
function varsOf(kind: Kind): string[] {
  const text = JSON.stringify(layout(kind));
  const found = new Set<string>();
  for (const [, name] of text.matchAll(/\{\{([A-Za-z_.]+)\}\}/g)) found.add(name!);
  return [...found].sort();
}

/** The manifest's `emailTemplates`: one per kind. */
export function emailTemplates(kinds: readonly Kind[]): unknown[] {
  return kinds.map((kind) => ({
    key: `printing-${kind}`,
    name: { "en-US": KIND_NAMES[kind] },
    vars: varsOf(kind),
    locales: { "en-US": layout(kind) },
  }));
}
