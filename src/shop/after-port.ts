/**
 * What the shop's pages after an order ask of Adminium, and the door that
 * asks it.
 *
 * Three ways reach a customer's own rows, and only these (never a reference
 * alone, never an address alone):
 *
 *   - the customer signs in: Adminium e-mails a link and a six-digit code to
 *     the address typed, the code typed back proves the mailbox, and the
 *     session reads that customer's own orders, jobs, artwork, proofs and
 *     saved quotes;
 *   - an order's own link (the one its e-mails carry, and the one the
 *     confirmation page is handed) opens that one order, and only it;
 *   - a saved quote's own link opens that one quote.
 *
 * A proof is answered through whichever session opened it: approved, or a
 * change asked for in the customer's own words, while it waits. A delivery
 * the works quoted by hand is accepted, or the order collected instead.
 * Saving a quote and asking for a sample pack are guest writes behind the
 * human check. Nothing here works out a figure or a date: each is a stored
 * column or a dry run's.
 */
import { createPublicClient, PublicApiError, type PublicClient } from "@adminiumjs/public-client";

import { refusalOf } from "./door.ts";
import { ShopError, type Id, type Row } from "./port.ts";

/** The entries these pages call: the table, and its suffix (Adminium's naming, held to `PUBLIC_REFS`). */
export const AFTER_REFS = {
  signIn: ["customers", "_claimed"],
  myOrders: ["orders", "_verified"],
  myJobs: ["jobs", "_verified"],
  myFeatures: ["job_features", "_verified"],
  myArtwork: ["artwork", "_verified"],
  myProofs: ["proofs", "_verified"],
  myQuotes: ["saved_quotes", "_verified"],
  myQuoteLines: ["quote_lines", "_verified"],
  linkOrder: ["orders", "_claimed"],
  linkJobs: ["jobs", "_verified_2"],
  linkFeatures: ["job_features", "_verified_2"],
  linkArtwork: ["artwork", "_verified_2"],
  linkProofs: ["proofs", "_verified_2"],
  saveQuote: ["saved_quotes", "_verified_2"],
  linkQuote: ["saved_quotes", "_claimed"],
  linkQuoteLines: ["quote_lines", "_verified_2"],
  samplePack: ["sample_requests", ""],
} as const satisfies Record<string, readonly [string, string]>;

export type AfterRefName = keyof typeof AFTER_REFS;
export type AfterRefs = Record<AfterRefName, string>;

export function afterRefs(tables: Readonly<Record<string, string>> = {}): AfterRefs {
  const out = {} as AfterRefs;
  for (const [name, [table, suffix]] of Object.entries(AFTER_REFS) as [AfterRefName, readonly [string, string]][]) {
    out[name] = `${tables[table] ?? `printing_${table}`}${suffix}`;
  }
  return out;
}

/** Which session reads an order: the customer's own sign-in, or the order's own link. */
export type Via = "mine" | "link";

/** One order as its page shows it: the order, its jobs, their features, artwork and proofs. */
export interface OrderRead {
  via: Via;
  order: Row;
  jobs: Row[];
  features: Row[];
  artwork: Row[];
  proofs: Row[];
}

/** Every row the signed-in customer's orders hold. */
export interface MyRows {
  jobs: Row[];
  features: Row[];
  artwork: Row[];
  proofs: Row[];
}

/** The answer to a typed-back code, as the page says it. */
export type CodeAnswer = { ok: true } | { ok: false; reason: "wrong"; triesLeft: number } | { ok: false; reason: "spent" | "locked" };

/** A proof's answer, as the page sends it: approved, or a change asked for in the customer's words. */
export type ProofAnswer = { state: "approved" } | { state: "change_asked"; change_note: string };

/** The customer's answer to the works' delivery quote: accept it, or collect from the works instead. */
export type DeliveryAnswer = { delivery_quote_state: "accepted" } | { delivery_method: "collect" };

/** A session on a saved quote's own link, kept for the tab so "Saved quotes" lists what was saved on this visit. */
export interface HeldQuote {
  number: string;
  session: { token: string; expiresAt: number };
}

/** A saved quote and its lines. */
export interface QuoteRead {
  quote: Row;
  lines: Row[];
}

/** Who the signed-in session belongs to. */
export interface Me {
  name: string | null;
  email: string | null;
}

export interface AfterPort {
  /** E-mail a sign-in link, with a code for this page, to the address typed (the same answer for any address). */
  requestCode(email: string, language: string): Promise<void>;
  verifyCode(email: string, code: string): Promise<CodeAnswer>;
  /** The sign-in link from the e-mail, used once: true when it opened a session. */
  openSignInLink(token: string): Promise<boolean>;
  /** The first name the link greets its person by, spending nothing. */
  peekSignInLink(token: string): Promise<string | null>;
  signedIn(): boolean;
  /** Who is signed in: their name and address, as the works keeps them. */
  me(): Promise<Me | null>;
  signOut(): Promise<void>;
  /** The signed-in customer's orders, newest first. */
  myOrders(): Promise<Row[]>;
  /** Every job, feature, file and proof of the signed-in customer's orders. */
  myRows(): Promise<MyRows>;
  /** Open the order the link names: `opened`, `unknown` (opens nothing) or `closed` (stopped or expired). */
  openShared(token: string): Promise<"opened" | "unknown" | "closed">;
  /** Whether a session on an order's own link is held. */
  sharedHeld(): boolean;
  /** The order the held link opens, or null when it opens nothing now. */
  readShared(): Promise<OrderRead | null>;
  answerProof(via: Via, proofId: Id, answer: ProofAnswer): Promise<Row>;
  answerDelivery(via: Via, orderId: Id, answer: DeliveryAnswer): Promise<Row>;
  /** A proof's PDF, as the session reads it. */
  proofFile(via: Via, proofId: Id): Promise<{ blob: Blob; filename: string | null }>;
  /** The signed-in customer's saved quotes, newest first, and their lines. */
  myQuotes(): Promise<{ quotes: Row[]; lines: Row[] }>;
  /** Open the quote a link names, keeping its session for the tab. */
  openQuoteLink(token: string): Promise<HeldQuote | "unknown" | "closed">;
  /** A quote saved or opened on this visit, read by its own session; null when its link opens nothing now. */
  readHeldQuote(held: HeldQuote): Promise<QuoteRead | null>;
  /** A quote's own name: through the sign-in, or the quote's own link. */
  renameQuote(via: "mine" | HeldQuote, quoteId: Id, label: string): Promise<Row>;
  /** "Post me the pack": a guest's request, one to an address, with the stocks ticked. */
  askSamples(write: { values: Row; children: { sample_stocks: { values: { material_id: Id } }[] } }): Promise<Row>;
}

const PAGE = 200;

async function all(client: PublicClient, ref: string): Promise<Row[]> {
  const rows: Row[] = [];
  for (let offset = 0; offset < 50 * PAGE; offset += PAGE) {
    const page = await client.list<Row>(ref, { limit: PAGE, offset });
    rows.push(...page.data);
    if (page.data.length < PAGE) break;
  }
  return rows;
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

const newest = (column: string) => (a: Row, b: Row) => String(b[column] ?? "").localeCompare(String(a[column] ?? "")) || Number(b["id"]) - Number(a["id"]);

export interface AfterClients {
  /** The shop's own key: the sign-in, guest writes. */
  client: PublicClient;
  /** The `order` key's: the session an order's own link opens. */
  orderClient: PublicClient | null;
  /** A new client on the `quote` key, holding the session given (or none). */
  quoteClient: ((session?: { token: string; expiresAt: number }) => PublicClient) | null;
}

export class AdminiumAfter implements AfterPort {
  private readonly client: PublicClient;
  private readonly orderClient: PublicClient | null;
  private readonly quoteClient: AfterClients["quoteClient"];
  private readonly refs: AfterRefs;

  constructor(clients: AfterClients, tables: Readonly<Record<string, string>> = {}) {
    this.client = clients.client;
    this.orderClient = clients.orderClient;
    this.quoteClient = clients.quoteClient;
    this.refs = afterRefs(tables);
  }

  private on(via: Via): PublicClient {
    if (via === "mine") return this.client;
    if (this.orderClient === null) throw new Error("This shop has no key for an order's own link.");
    return this.orderClient;
  }

  private quoteOn(session?: { token: string; expiresAt: number }): PublicClient {
    if (this.quoteClient === null) throw new Error("This shop has no key for a quote's own link.");
    return this.quoteClient(session);
  }

  requestCode(email: string, language: string): Promise<void> {
    return answer(async () => {
      await this.client.requestLink({ email: email.trim(), lang: language });
    });
  }

  verifyCode(email: string, code: string): Promise<CodeAnswer> {
    return answer(async () => {
      try {
        const out = await this.client.verifyLinkCode({ email: email.trim(), code: code.trim() });
        return out.ok ? { ok: true } : out.triesLeft > 0 ? { ok: false, reason: "wrong", triesLeft: out.triesLeft } : { ok: false, reason: "spent" };
      } catch (error) {
        if (error instanceof PublicApiError && error.code === "PUBLIC_CODE_EXPIRED") return { ok: false, reason: "spent" };
        if (error instanceof PublicApiError && error.code === "PUBLIC_CLAIM_LOCKED") return { ok: false, reason: "locked" };
        throw error;
      }
    });
  }

  openSignInLink(token: string): Promise<boolean> {
    return answer(() => this.client.openLink(token));
  }

  peekSignInLink(token: string): Promise<string | null> {
    return answer(() => this.client.peekLink(token));
  }

  signedIn(): boolean {
    return this.client.session()?.level === "verified";
  }

  me(): Promise<Me | null> {
    return answer(async () => {
      if (!this.signedIn()) return null;
      const row = (await this.client.list<Row>(this.refs.signIn, { limit: 1 })).data[0];
      if (row === undefined) return null;
      const text = (value: unknown) => (typeof value === "string" && value !== "" ? value : null);
      return { name: text(row["name"]), email: text(row["email"]) };
    });
  }

  signOut(): Promise<void> {
    return answer(() => this.client.signOut());
  }

  myOrders(): Promise<Row[]> {
    return answer(async () => (await all(this.client, this.refs.myOrders)).sort(newest("placed_at")));
  }

  myRows(): Promise<MyRows> {
    return answer(async () => {
      const [jobs, features, artwork, proofs] = await Promise.all([this.refs.myJobs, this.refs.myFeatures, this.refs.myArtwork, this.refs.myProofs].map((ref) => all(this.client, ref)));
      return { jobs: jobs!, features: features!, artwork: artwork!, proofs: proofs! };
    });
  }

  openShared(token: string): Promise<"opened" | "unknown" | "closed"> {
    return answer(() => this.on("link").openShared(token));
  }

  sharedHeld(): boolean {
    return this.orderClient?.session() != null;
  }

  readShared(): Promise<OrderRead | null> {
    return answer(async () => {
      const client = this.on("link");
      if (client.session() === null) return null;
      const order = (await all(client, this.refs.linkOrder))[0];
      if (order === undefined) return null;
      const [jobs, features, artwork, proofs] = await Promise.all([this.refs.linkJobs, this.refs.linkFeatures, this.refs.linkArtwork, this.refs.linkProofs].map((ref) => all(client, ref)));
      return { via: "link", order, jobs: jobs!, features: features!, artwork: artwork!, proofs: proofs! };
    });
  }

  answerProof(via: Via, proofId: Id, answerTo: ProofAnswer): Promise<Row> {
    const ref = via === "mine" ? this.refs.myProofs : this.refs.linkProofs;
    return answer(() => this.on(via).update<Row>(ref, String(proofId), { ...answerTo }));
  }

  answerDelivery(via: Via, orderId: Id, answerTo: DeliveryAnswer): Promise<Row> {
    const ref = via === "mine" ? this.refs.myOrders : this.refs.linkOrder;
    return answer(() => this.on(via).update<Row>(ref, String(orderId), { ...answerTo }));
  }

  proofFile(via: Via, proofId: Id): Promise<{ blob: Blob; filename: string | null }> {
    const ref = via === "mine" ? this.refs.myProofs : this.refs.linkProofs;
    return answer(async () => {
      const file = await this.on(via).file(ref, proofId, "file");
      return { blob: file.blob, filename: file.filename };
    });
  }

  myQuotes(): Promise<{ quotes: Row[]; lines: Row[] }> {
    return answer(async () => {
      const [quotes, lines] = await Promise.all([all(this.client, this.refs.myQuotes), all(this.client, this.refs.myQuoteLines)]);
      return { quotes: quotes.sort(newest("created_at")), lines };
    });
  }

  openQuoteLink(token: string): Promise<HeldQuote | "unknown" | "closed"> {
    return answer(async () => {
      const client = this.quoteOn();
      const opened = await client.openShared(token);
      if (opened !== "opened") return opened;
      const session = client.session();
      const quote = (await client.list<Row>(this.refs.linkQuote, { limit: 1 })).data[0];
      if (session === null || quote === undefined) return "unknown";
      return { number: String(quote["number"] ?? ""), session: { token: session.token, expiresAt: session.expiresAt } };
    });
  }

  readHeldQuote(held: HeldQuote): Promise<QuoteRead | null> {
    return answer(async () => {
      const client = this.quoteOn(held.session);
      try {
        const quote = (await all(client, this.refs.linkQuote))[0];
        if (quote === undefined) return null;
        return { quote, lines: await all(client, this.refs.linkQuoteLines) };
      } catch (error) {
        // The link was stopped, ran out or was given a new code: it opens nothing now.
        if (error instanceof PublicApiError && (error.status === 401 || error.status === 403)) return null;
        throw error;
      }
    });
  }

  renameQuote(via: "mine" | HeldQuote, quoteId: Id, label: string): Promise<Row> {
    return answer(() => (via === "mine" ? this.client.update<Row>(this.refs.myQuotes, String(quoteId), { label }) : this.quoteOn(via.session).update<Row>(this.refs.linkQuote, String(quoteId), { label })));
  }

  askSamples(write: { values: Row; children: { sample_stocks: { values: { material_id: Id } }[] } }): Promise<Row> {
    return answer(async () => (await this.client.createTree<Row>(this.refs.samplePack, { values: write.values, children: write.children as never })).data);
  }
}

/** A client on a key, for the door to hand the pages: the shop's own options, a session it may hold. */
export function keyClient(baseUrl: string, publishableKey: string, fetchImpl: typeof fetch | undefined, session?: { token: string; expiresAt: number }): PublicClient {
  const made = createPublicClient({ baseUrl, publishableKey, ...(fetchImpl === undefined ? {} : { fetch: fetchImpl }), humanCheck: false });
  if (made === null) throw new Error("The key could not be used.");
  // Adopted as the order's own link is on placing: the session the server opened, held as it gave it.
  if (session !== undefined) made.adoptSession({ token: session.token, expiresAt: session.expiresAt, level: "verified" });
  return made;
}
