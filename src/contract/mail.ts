/**
 * The e-mail the outbox sends, followed from its row to the e2e server's SMTP
 * sink.
 *
 * The outbox records every e-mail as a row of the app's `messages` table and
 * then sends it on its own round; an address on a domain kept for examples
 * and tests (`example.com`, `.test`, `.invalid`, `.localhost`, `.example`) is
 * never sent to, and its row is `skipped`. So every person the contract
 * expects mail for has an address on a made-up domain that is not one of
 * those, and an e-mail is taken as sent only when its row says `sent` AND the
 * sink holds it, to that address, under the subject the installed manifest's
 * en-US template gives that kind.
 *
 * The subjects are read from the manifest text the run installs, never
 * written here: the templates are the app's to word.
 *
 * Tests only; nothing that ships imports it.
 */
import { expect } from "vitest";

export interface Mail {
  receivedAt: number;
  to: string[];
  subject: string;
  text: string;
  html: string;
}

type Row = Record<string, unknown>;

/** Everything the sink holds, oldest first. */
export const sinkMail = async (sink: string): Promise<Mail[]> => (await (await fetch(`${sink}/messages`)).json()) as Mail[];

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The en-US subject the manifest's template for an outbox kind has, as a
 * pattern: each `{{name}}` the contract knows (`known`) filled in, any other
 * matched by any words.
 */
export function subjectOf(manifest: string, kind: string, known: Record<string, string> = {}): RegExp {
  const parsed = JSON.parse(manifest) as { outbox?: { kinds?: Record<string, string> }; emailTemplates?: { key: string; locales: Record<string, { subject: string }> }[] };
  const key = parsed.outbox?.kinds?.[kind];
  if (key === undefined) throw new Error(`the manifest's outbox has no kind "${kind}"`);
  const subject = parsed.emailTemplates?.find((t) => t.key === key)?.locales["en-US"]?.subject;
  if (subject === undefined) throw new Error(`the manifest has no en-US subject for "${key}"`);
  const pattern = subject
    .split(/(\{\{\s*[\w.]+\s*\}\})/)
    .map((part) => {
      const name = /^\{\{\s*([\w.]+)\s*\}\}$/.exec(part)?.[1];
      if (name === undefined) return escape(part);
      return name in known ? escape(known[name]!) : ".+?";
    })
    .join("");
  return new RegExp(`^${pattern}$`);
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface Delivery {
  /** The sink's mailbox (`Server.sink`). */
  sink: string;
  /** The manifest text the run installed. */
  manifest: string;
  kind: string;
  to: string;
  /** What the contract knows of the template's names (`order.number`), for the subject. */
  known?: Record<string, string>;
  /** What the e-mail's body must carry (the order's own link). */
  body?: RegExp;
  /** The outbox row of this e-mail, once there is one. */
  row: () => Promise<Row | undefined>;
  ms?: number;
}

/**
 * Wait for an e-mail: its row `sent`, then the sink holding it. A row that
 * ends otherwise fails the check with what the row says went wrong, exactly.
 */
export async function delivered(d: Delivery): Promise<{ row: Row; mail: Mail }> {
  const deadline = Date.now() + (d.ms ?? 90_000);
  const subject = subjectOf(d.manifest, d.kind, d.known);
  let row: Row | undefined;
  for (;;) {
    row = await d.row();
    if (row !== undefined && row["status"] !== "queued" && row["status"] !== null && row["status"] !== undefined) break;
    if (Date.now() > deadline) throw new Error(`the ${d.kind} e-mail to ${d.to} never left the outbox: ${JSON.stringify(row ?? null)}`);
    await wait(1_000);
  }
  expect(
    { kind: d.kind, status: row["status"], to: row["to_address"] },
    `the ${d.kind} e-mail's row: ${JSON.stringify({ status: row["status"], error: row["error"] ?? null, skip_reason: row["skip_reason"] ?? null })}`,
  ).toEqual({ kind: d.kind, status: "sent", to: d.to });
  for (;;) {
    const held = (await sinkMail(d.sink)).filter((m) => m.to.includes(d.to) && subject.test(m.subject) && (d.body === undefined || d.body.test(`${m.text}\n${m.html}`)));
    if (held.length > 0) return { row, mail: held.at(-1)! };
    if (Date.now() > deadline) {
      const all = (await sinkMail(d.sink)).map((m) => [m.to, m.subject]);
      throw new Error(`the sink holds no ${d.kind} e-mail to ${d.to} under ${String(subject)}${d.body === undefined ? "" : ` carrying ${String(d.body)}`}; it holds: ${JSON.stringify(all)}`);
    }
    await wait(1_000);
  }
}
