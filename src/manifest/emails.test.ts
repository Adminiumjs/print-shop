/**
 * The works' e-mails: every e-mail in every language has English's blocks and
 * English's variables, sentence by sentence; a translation may not drop a
 * `{{…}}` the outbox fills, or invent one it does not, nor stay in English.
 *
 * And every variable a template reads is one Adminium fills for that e-mail:
 * the link the kind's producer sets and the links filled from that row, the
 * works' settings by their own columns
 * (never `practice.name`, which the settings row has no column for), and
 * never a personal column of a linked row (an order's name or address),
 * which Adminium leaves out of every message, so the e-mail could never go.
 */
import { describe, expect, it } from "vitest";

import { bundleOffences } from "../testing/lexicon.ts";
import { EMAIL_EN, emailTemplates, emailWords, templateOf, variablesOf } from "./emails.ts";
import { LOCALES } from "./labels.ts";
import { KINDS, OUTBOX, type Kind } from "./outbox.ts";
import { TABLES } from "./tables.ts";

function leaves(value: unknown, path = ""): [string, string][] {
  if (typeof value === "string") return [[path, value]];
  if (Array.isArray(value)) return value.flatMap((v, i) => leaves(v, `${path}[${String(i)}]`));
  if (typeof value === "object" && value !== null) return Object.entries(value).flatMap(([k, v]) => leaves(v, path === "" ? k : `${path}.${k}`));
  return [];
}
const vars = (text: string) => [...text.matchAll(/\{\{([\w.|]+)\}\}/g)].map((m) => m[1]!).sort();

describe.each(LOCALES.filter((t) => t !== "en-US"))("the e-mails in %s", (tag) => {
  const words = emailWords()[tag];
  const en = new Map(leaves(EMAIL_EN));
  const local = new Map(leaves(words));

  it("has every sentence English has, and no other", () => {
    expect([...local.keys()].sort()).toEqual([...en.keys()].sort());
  });

  it("uses English's variables in each sentence", () => {
    const wrong = [...en].filter(([path, text]) => JSON.stringify(vars(text)) !== JSON.stringify(vars(local.get(path) ?? ""))).map(([path]) => path);
    expect(wrong).toEqual([]);
  });

  it("is not English", () => {
    const same = [...en].filter(([path, text]) => local.get(path) === text && /\p{L}/u.test(text.replace(/\{\{[\w.|]+\}\}/g, ""))).map(([path]) => path);
    expect(same.filter((p) => p !== "dhl")).toEqual([]);
  });

  it("says nothing the release vocabulary bans", () => {
    const hits = [...local].flatMap(([path, text]) => bundleOffences(text).map((o) => `${path} · ${o.token}`));
    expect(hits).toEqual([]);
  });

  it("lays out the same blocks as English, with the same lists", () => {
    for (const kind of KINDS) {
      const shape = (t: ReturnType<typeof templateOf>) => t.blocks.map((b) => [b.block, b.id, JSON.stringify((b.data as { from?: unknown }).from ?? null)]);
      expect(shape(templateOf(kind, tag)), kind).toEqual(shape(templateOf(kind, "en-US")));
    }
  });
});

const columnsOf = (ref: string) => new Map(TABLES.find((t) => t.ref === ref)!.columns.map((c) => [c.ref, c]));
const LINKED_TABLE: Record<string, string> = { order: "orders", quote: "saved_quotes", sample: "sample_requests", proof: "proofs" };
const linkNamed = (column: string) => Object.entries(OUTBOX.links).find(([, c]) => c === column)![0];
/**
 * The rows a kind's template may read: the row its producer links, and the
 * rows Adminium fills the outbox's other links with from it (a proof's order,
 * by the proof's own `order_id`). Every producer of a kind links the same.
 */
const LINKS_OF: Record<Kind, Set<string>> = Object.fromEntries(
  KINDS.map((kind) => {
    const own = [...new Set(OUTBOX.producers.filter((p) => p.kind === kind).map((p) => linkNamed(p.link)))];
    if (own.length !== 1) throw new Error(`${kind} is linked ${String(own.length)} ways`);
    const row = columnsOf(LINKED_TABLE[own[0]!]!);
    const filled = Object.entries(OUTBOX.links).filter(([name, column]) => name !== own[0] && LINKED_TABLE[name] !== undefined && row.get(column)?.type === "fk").map(([name]) => name);
    return [kind, new Set([own[0]!, ...filled])];
  }),
) as Record<Kind, Set<string>>;
/** A linked row's columns about the person: Adminium never puts them in a message. */
const PERSONAL = new Set(["name", "email", "address_line1", "address_line2", "town", "postcode", "client_key"]);
const SETTINGS = columnsOf("settings");
const FORMS = new Set(["money", "number", "percent", "label", "date", "time", "day_month", "relative_day", "days_since"]);
const GLOBALS = new Set(["appName", "manage_url", "booking_url", "staff_url", "recipient.name", "recipient.first_name"]);

describe("what the e-mails read", () => {
  it.each(KINDS)("%s reads only what Adminium fills for it", (kind) => {
    const links = LINKS_OF[kind];
    const wrong: string[] = [];
    for (const tag of LOCALES) {
      for (const { name, backup } of variablesOf(templateOf(kind, tag))) {
        if (GLOBALS.has(name) || name.startsWith("row.")) continue;
        const [head, column, form, ...rest] = name.split(".");
        if (head === "practice") {
          if (!SETTINGS.has(column!) || form !== undefined) wrong.push(`${tag} ${name}`);
          continue;
        }
        const table = LINKED_TABLE[head!];
        if (!links.has(head!) || table === undefined) {
          wrong.push(`${tag} ${name}: the e-mail is about its ${[...links].join(" and ")}`);
          continue;
        }
        const own = columnsOf(table);
        if (!own.has(column!)) {
          wrong.push(`${tag} ${name}: no column`);
          continue;
        }
        if (PERSONAL.has(column!)) wrong.push(`${tag} ${name}: a personal column`);
        if (rest.length > 0 || (form !== undefined && !FORMS.has(form))) wrong.push(`${tag} ${name}: no such form`);
        if (backup) wrong.push(`${tag} ${name}: a backup hides a missing value`);
      }
    }
    expect(wrong).toEqual([]);
  });

  it("signs every e-mail with the works' name, never a settings column it lacks", () => {
    const text = JSON.stringify(emailTemplates(KINDS));
    expect(text).not.toContain("{{practice.name}}");
    for (const kind of KINDS) expect(templateOf(kind, "en-US").footer).toContain("{{appName}}");
  });

  it("opens an order's page and a quote's page each by its own link code", () => {
    const urls = (kind: Kind) => templateOf(kind, "en-US").blocks.filter((b) => b.block === "email.button").map((b) => b.data["url"]);
    expect(urls("order-received")).toEqual(["{{manage_url}}#{{order.link_token}}"]);
    expect(urls("quote-saved")).toEqual(["{{booking_url}}#{{quote.link_token}}"]);
    expect(OUTBOX.pages).toEqual({ manage: "/order", booking: "/quote" });
  });

  it("says the delivery is to quote when the works has not priced it, and its price when it has", () => {
    const money = templateOf("order-received", "en-US").blocks.filter((b) => b.id.startsWith("money"));
    expect(money.map((b) => [b.id, b.data["onlyWith"] ?? null, b.data["onlyWithout"] ?? null])).toEqual([
      ["money", "order.delivery_priced", null],
      ["money-to-quote", null, "order.delivery_priced"],
    ]);
  });

  it("lists rows only from a table that links to the e-mail's row", () => {
    for (const kind of KINDS) {
      for (const block of templateOf(kind, "en-US").blocks.filter((b) => b.block === "email.rows")) {
        const from = block.data["from"] as { link: string; table: string; via: string };
        expect([...LINKS_OF[kind]], kind).toContain(from.link);
        expect(columnsOf(from.table).get(from.via)?.type, kind).toBe("fk");
      }
    }
  });
});
