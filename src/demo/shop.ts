/**
 * The shop's doors into the demo's Adminium: the catalogue, a dry run, an
 * order and a saved quote (`ShopPort`), the pages after an order
 * (`AfterPort`) and the Customiser's calls (`CustomiserApi`), each answering
 * as the real ones do — a dry run's figures worked out by the manifest's own
 * rules, an order saved once at the total the customer was shown, a code
 * "e-mailed" before the customer's own orders open — over the one world the
 * works reads.
 *
 * DEMO BUILD ONLY — nothing in a real build imports it.
 */
import type { CustomiserApi, DesignData, DesignValues, HeldSession, SavedDesign } from "../../vendor/customiser/index.js";
import type { AfterPort, CodeAnswer, DeliveryAnswer, HeldQuote, Me, MyRows, OrderRead, ProofAnswer, QuoteRead, Via } from "../shop/after-port.ts";
import { catalogueFrom } from "../shop/door.ts";
import { ShopError, type Catalogue, type Figures, type Id, type JobNode, type OrderBody, type Placed, type QuoteBody, type QuoteFigures, type Refused, type SavedQuote, type ShopConfig, type ShopPort, type Uploaded } from "../shop/port.ts";
import { APP_SETTINGS, deriveAll, mayMove, newRow, stamp, TABLE_OF, type Row, type Tables } from "./rules.ts";
import type { DemoWorld } from "./world.ts";

const same = (a: unknown, b: unknown) => a !== null && a !== undefined && b !== null && b !== undefined && String(a) === String(b);
const lower = (value: unknown) => String(value ?? "").trim().toLowerCase();
const copy = <T>(value: T): T => structuredClone(value);
const live = (row: Row) => row["active"] !== false && row["active"] !== 0;
const byPosition = (a: Row, b: Row) => Number(a["position"] ?? 0) - Number(b["position"] ?? 0) || a.id - b.id;

/** The codes the demo's Adminium "e-mails" for a sign-in, in the order it sends them. */
export const DEMO_CODES = ["482913", "730561", "195738", "864205"] as const;

/** A one-page PDF, as a proof the works exported: what a sample proof's file opens as in the demo. */
const PROOF_PDF = "%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 258 173] >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n";
/** What a sample proof's file reads as on the customer's pages: the PDF above, handed out by `proofFile`. */
const SAMPLE_PROOF = "demo-sample-proof.pdf";

function refusal(code: string, status: number, more: Partial<Refused> = {}): ShopError {
  return new ShopError({ code, status, column: null, child: null, index: null, reason: null, changed: null, raw: { code, params: {} }, ...more }, code);
}

/** A unique column a new row would share with a row already kept: the write is refused, as Adminium refuses it. */
function clash(world: DemoWorld, table: string, row: Row): string | null {
  for (const column of TABLE_OF.get(table)?.columns ?? []) {
    if ((column as { unique?: boolean }).unique !== true) continue;
    const value = row[column.ref];
    if (value === null || value === undefined || value === "") continue;
    if (world.all(table).some((r) => r !== row && same(r[column.ref], value))) return column.ref;
  }
  return null;
}

/** The scratch tables a dry run works in: the world's, copied, so nothing it adds is kept. */
interface Draft {
  tables: Tables;
  parent: Row;
  children: Row[];
}

/**
 * A parent and its child rows as the save would write them, worked out in a
 * copy of the world (`deriveAll`, then the stamps a create fires: a job's
 * ready-by), and nothing kept: a dry run.
 */
function draft(world: DemoWorld, table: "orders" | "saved_quotes", values: Record<string, unknown>, childTable: "jobs" | "quote_lines", children: JobNode[]): Draft {
  const before = copy(world.tables);
  const tables = copy(world.tables);
  const via = table === "orders" ? "order_id" : "quote_id";
  const id = -1;
  const parent = { ...newRow(table, { ...values }, tables, () => "DRYRUNDRYRUNDRYR"), id } as Row;
  (tables[table] ??= []).push(parent);
  const made = children.map((child, i) => {
    const row = { ...newRow(childTable, { position: i + 1, ...child.values, [via]: id }, tables, () => ""), id: -(i + 2) } as Row;
    (tables[childTable] ??= []).push(row);
    for (const [j, f] of (child.children?.job_features ?? []).entries()) (tables["job_features"] ??= []).push({ ...newRow("job_features", { job_id: row.id, option_id: f.values.option_id }, tables, () => ""), id: -(1000 + i * 50 + j) } as Row);
    for (const [j, a] of (child.children?.artwork ?? []).entries()) (tables["artwork"] ??= []).push({ ...newRow("artwork", { job_id: row.id, ...a.values }, tables, () => ""), id: -(5000 + i * 50 + j) } as Row);
    return row;
  });
  deriveAll(tables);
  for (let round = 0; round < 3 && stamp(tables, before, world.moment()); round += 1) deriveAll(tables);
  return { tables, parent, children: made };
}

export class DemoShop implements ShopPort {
  private readonly world: DemoWorld;
  readonly afterDoor: DemoAfter;
  private readonly api: CustomiserApi;

  constructor(world: DemoWorld) {
    this.world = world;
    this.afterDoor = new DemoAfter(world);
    this.api = demoCustomiser(world);
  }

  async config(): Promise<ShopConfig> {
    return { timezone: this.world.zone, currency: this.world.currency };
  }

  async catalogue(): Promise<Catalogue> {
    const w = this.world;
    return catalogueFrom(
      {
        products: w.all("products").filter((p) => p["published"] !== false).sort(byPosition).map(copy),
        options: w.all("options").filter(live).sort(byPosition).map(copy),
        materials: w.all("materials").filter(live).sort(byPosition).map(copy),
        sizes: w.all("sizes").filter(live).sort(byPosition).map(copy),
        finishes: w.all("finishes").filter(live).sort(byPosition).map(copy),
        breaks: w.all("breaks").map(copy),
        packaging: w.all("packaging").filter(live).sort(byPosition).map(copy),
        bands: w.all("delivery_bands").sort(byPosition).map(copy),
        rules: w.all("option_rules").filter(live).sort(byPosition).map(copy),
        settings: [copy(w.settings())],
      },
      () => null,
    );
  }

  async quote(body: OrderBody): Promise<Figures> {
    const made = draft(this.world, "orders", body.values, "jobs", body.children.jobs);
    return copy({ order: made.parent, jobs: made.children });
  }

  async place(body: OrderBody, clientKey: string, expectTotal: string): Promise<Placed> {
    const w = this.world;
    const again = w.all("orders").find((o) => o["client_key"] === clientKey);
    if (again !== undefined) {
      this.afterDoor.adopt(again.id);
      return copy({ order: again, jobs: w.all("jobs").filter((j) => same(j["order_id"], again.id)), replayed: true, link: { token: String(again["link_token"]) } });
    }
    if (w.settings()["taking_orders"] === false) throw refusal("PUBLIC_SWITCHED_OFF", 409);
    const dry = draft(w, "orders", body.values, "jobs", body.children.jobs);
    if (dry.parent["total"] !== expectTotal) throw refusal("PUBLIC_PRICE_CHANGED", 409, { changed: copy({ order: { total: dry.parent["total"] }, jobs: dry.children }) });

    const order = w.write(() => {
      const email = lower(body.values["email"]);
      const customer =
        w.all("customers").find((c) => lower(c["email"]) === email) ??
        w.insert("customers", { email, name: body.values["name"] ?? null, language: body.values["language"] ?? "en-US", may_email: body.values["may_email"] === true });
      const made = w.insert("orders", { ...body.values, email, customer_id: customer.id, client_key: clientKey });
      for (const [i, child] of body.children.jobs.entries()) {
        const job = w.insert("jobs", { position: i + 1, ...child.values, order_id: made.id });
        for (const f of child.children?.job_features ?? []) {
          const option = w.get("options", f.values.option_id);
          const feature = w.all("features").find((one) => same(one["code"], option?.["feature_code"]));
          w.insert("job_features", { job_id: job.id, option_id: f.values.option_id, feature_id: feature?.id ?? null });
        }
        for (const a of child.children?.artwork ?? []) w.insert("artwork", { job_id: job.id, ...a.values });
        if (job["design_code"] !== undefined && job["design_code"] !== null) {
          const design = w.all("designs").find((d) => same(d["code"], job["design_code"]));
          if (design !== undefined) w.update("designs", design.id, { state: "ordered" });
        }
      }
      return made;
    });
    this.afterDoor.adopt(order.id);
    return copy({ order: w.get("orders", order.id)!, jobs: w.all("jobs").filter((j) => same(j["order_id"], order.id)), replayed: false, link: { token: String(order["link_token"]) } });
  }

  async priceQuote(body: QuoteBody): Promise<QuoteFigures> {
    const made = draft(this.world, "saved_quotes", body.values, "quote_lines", body.children.quote_lines);
    return copy({ quote: made.parent, lines: made.children });
  }

  async saveQuote(body: QuoteBody, clientKey: string, expectTotal: string): Promise<SavedQuote> {
    const w = this.world;
    const again = w.all("saved_quotes").find((q) => q["client_key"] === clientKey);
    const session = (quote: Row) => ({ token: String(quote["link_token"]), session: this.afterDoor.quoteSession(quote.id) });
    if (again !== undefined) return copy({ quote: again, lines: w.all("quote_lines").filter((l) => same(l["quote_id"], again.id)), replayed: true, link: session(again) });
    const dry = draft(w, "saved_quotes", body.values, "quote_lines", body.children.quote_lines);
    if (dry.parent["total"] !== expectTotal) throw refusal("PUBLIC_PRICE_CHANGED", 409);
    const quote = w.write(() => {
      const email = lower(body.values["email"]);
      const customer = w.all("customers").find((c) => lower(c["email"]) === email);
      const made = w.insert("saved_quotes", { ...body.values, email, customer_id: customer?.id ?? null, client_key: clientKey });
      for (const [i, line] of body.children.quote_lines.entries()) w.insert("quote_lines", { position: i + 1, ...line.values, quote_id: made.id });
      return made;
    });
    return copy({ quote: w.get("saved_quotes", quote.id)!, lines: w.all("quote_lines").filter((l) => same(l["quote_id"], quote.id)), replayed: false, link: session(quote) });
  }

  async upload(file: Blob, name: string): Promise<Uploaded> {
    const id = this.world.code("UP", 32);
    this.world.files.set(id, file);
    const kind = /\.pdf$/i.test(name) ? "pdf" : /\.tiff?$/i.test(name) ? "tiff" : "jpeg";
    return { id, name, size: file.size, kind };
  }

  customiser(): CustomiserApi {
    return this.api;
  }

  after(): AfterPort {
    return this.afterDoor;
  }

  settings(): Readonly<Record<string, unknown>> {
    return { ...APP_SETTINGS };
  }
}

/** The pages after an order, as the demo's Adminium answers them. */
export class DemoAfter implements AfterPort {
  private readonly world: DemoWorld;
  /** Who is signed in, by address: a code typed back, or the card's "signed in as". */
  session: string | null = null;
  /** The order the order's own link opened. */
  private linked: Id | null = null;
  /** The quotes a quote's own link opened, by the session it holds. */
  private readonly quotes = new Map<string, Id>();

  constructor(world: DemoWorld) {
    this.world = world;
  }

  /** A placed order's own link, its session already held, as the real door adopts it. */
  adopt(orderId: Id): void {
    this.linked = orderId;
  }

  /** A session on a quote's own link, for the page to hold. */
  quoteSession(quoteId: Id): { token: string; expiresAt: number } {
    const token = this.world.code("QS", 24);
    this.quotes.set(token, quoteId);
    return { token, expiresAt: this.world.now + 30 * 86_400_000 };
  }

  async requestCode(email: string): Promise<void> {
    const key = lower(email);
    const sent = this.world.codes.get(key) ?? [];
    sent.push(DEMO_CODES[sent.length % DEMO_CODES.length]!);
    this.world.codes.set(key, sent);
  }

  /** The newest code sent to an address, as the card's "Fill the code" types it. */
  codeFor(email: string): string | null {
    const sent = this.world.codes.get(lower(email)) ?? [];
    return sent[sent.length - 1] ?? null;
  }

  async verifyCode(email: string, code: string): Promise<CodeAnswer> {
    const key = lower(email);
    const sent = this.world.codes.get(key) ?? [];
    const typed = code.replace(/\s/g, "");
    if (sent.length === 0 || typed !== sent[sent.length - 1]) return sent.slice(0, -1).includes(typed) ? { ok: false, reason: "spent" } : { ok: false, reason: "wrong", triesLeft: 4 };
    this.world.codes.set(key, []);
    this.session = key;
    return { ok: true };
  }

  async openSignInLink(): Promise<boolean> {
    return false;
  }

  async peekSignInLink(): Promise<string | null> {
    return null;
  }

  signedIn(): boolean {
    return this.session !== null;
  }

  async me(): Promise<Me | null> {
    if (this.session === null) return null;
    const customer = this.world.all("customers").find((c) => lower(c["email"]) === this.session);
    return { name: typeof customer?.["name"] === "string" ? customer["name"] : null, email: this.session };
  }

  async signOut(): Promise<void> {
    this.session = null;
  }

  private mine(): Row[] {
    return this.world.all("orders").filter((o) => this.session !== null && lower(o["email"]) === this.session);
  }

  private rowsOf(orders: readonly Row[]): MyRows {
    const ids = new Set(orders.map((o) => String(o.id)));
    const jobs = this.world.all("jobs").filter((j) => ids.has(String(j["order_id"])));
    const jobIds = new Set(jobs.map((j) => String(j.id)));
    return copy({
      jobs,
      features: this.world.all("job_features").filter((f) => jobIds.has(String(f["job_id"]))),
      artwork: this.world.all("artwork").filter((a) => jobIds.has(String(a["job_id"]))),
      // A sample proof was sent with a PDF a sample cannot carry: `proofFile` hands out the demo's own, so it reads as kept.
      proofs: this.world.all("proofs").filter((p) => ids.has(String(p["order_id"]))).map((p) => (typeof p["file"] === "string" && p["file"] !== "" ? p : { ...p, file: SAMPLE_PROOF })),
    });
  }

  async myOrders(): Promise<Row[]> {
    return copy(this.mine()).sort((a, b) => String(b["placed_at"] ?? "").localeCompare(String(a["placed_at"] ?? "")) || b.id - a.id);
  }

  async myRows(): Promise<MyRows> {
    return this.rowsOf(this.mine());
  }

  async openShared(token: string): Promise<"opened" | "unknown" | "closed"> {
    const order = this.world.all("orders").find((o) => o["link_token"] === token);
    if (order === undefined) return "unknown";
    if (order["link_stopped"] === true) return "closed";
    this.linked = order.id;
    return "opened";
  }

  sharedHeld(): boolean {
    return this.linked !== null;
  }

  async closeShared(): Promise<void> {
    this.linked = null;
  }

  async readShared(): Promise<OrderRead | null> {
    const order = this.linked === null ? undefined : this.world.get("orders", this.linked);
    if (order === undefined) return null;
    return { via: "link", order: copy(order), ...this.rowsOf([order]) };
  }

  /** Whether this session may answer for an order: the customer's own, or the one its link opened. */
  private reaches(via: Via, orderId: unknown): boolean {
    if (via === "link") return same(this.linked, orderId);
    return this.mine().some((o) => same(o.id, orderId));
  }

  async answerProof(via: Via, proofId: Id, answer: ProofAnswer): Promise<Row> {
    const w = this.world;
    const proof = w.get("proofs", proofId);
    if (proof === undefined || !this.reaches(via, proof["order_id"])) throw refusal("PUBLIC_NOT_FOUND", 404);
    if (!mayMove("proofs", proof, answer.state, [])) throw refusal("STATE_MOVE_REFUSED", 409);
    w.write(() => w.update("proofs", proofId, { ...answer }));
    return copy(w.get("proofs", proofId)!);
  }

  async answerDelivery(via: Via, orderId: Id, answer: DeliveryAnswer): Promise<Row> {
    const w = this.world;
    const order = w.get("orders", orderId);
    if (order === undefined || !this.reaches(via, orderId)) throw refusal("PUBLIC_NOT_FOUND", 404);
    if (order["delivery_quote_state"] !== "sent") throw refusal("PUBLIC_WRITE_REFUSED", 400, { column: "delivery_quote_state" });
    w.write(() => w.update("orders", orderId, { ...answer }));
    return copy(w.get("orders", orderId)!);
  }

  async proofFile(via: Via, proofId: Id): Promise<{ blob: Blob; filename: string | null }> {
    const proof = this.world.get("proofs", proofId);
    if (proof === undefined || !this.reaches(via, proof["order_id"])) throw refusal("PUBLIC_NOT_FOUND", 404);
    const kept = typeof proof["file"] === "string" ? this.world.files.get(proof["file"]) : undefined;
    const order = this.world.get("orders", proof["order_id"]);
    return { blob: kept ?? new Blob([PROOF_PDF], { type: "application/pdf" }), filename: `proof-${lower(order?.["number"])}-v${String(proof["version"] ?? 1)}.pdf` };
  }

  private linesOf(quoteIds: readonly Id[]): Row[] {
    return copy(this.world.all("quote_lines").filter((l) => quoteIds.some((id) => same(l["quote_id"], id))));
  }

  async myQuotes(): Promise<{ quotes: Row[]; lines: Row[] }> {
    const quotes = this.world.all("saved_quotes").filter((q) => this.session !== null && lower(q["email"]) === this.session);
    return { quotes: copy(quotes).sort((a, b) => String(b["created_at"] ?? "").localeCompare(String(a["created_at"] ?? "")) || b.id - a.id), lines: this.linesOf(quotes.map((q) => q.id)) };
  }

  async openQuoteLink(token: string): Promise<HeldQuote | "unknown" | "closed"> {
    const quote = this.world.all("saved_quotes").find((q) => q["link_token"] === token);
    if (quote === undefined) return "unknown";
    if (quote["link_stopped"] === true) return "closed";
    return { number: String(quote["number"] ?? ""), session: this.quoteSession(quote.id) };
  }

  async readHeldQuote(held: HeldQuote): Promise<QuoteRead | null> {
    const id = this.quotes.get(held.session.token);
    const quote = id === undefined ? undefined : this.world.get("saved_quotes", id);
    if (quote === undefined) return null;
    return { quote: copy(quote), lines: this.linesOf([quote.id]) };
  }

  async renameQuote(via: "mine" | HeldQuote, quoteId: Id, label: string): Promise<Row> {
    const w = this.world;
    const quote = w.get("saved_quotes", quoteId);
    const ours = quote !== undefined && (via === "mine" ? this.session !== null && lower(quote["email"]) === this.session : same(this.quotes.get(via.session.token), quoteId));
    if (!ours) throw refusal("PUBLIC_NOT_FOUND", 404);
    w.write(() => w.update("saved_quotes", quoteId, { label }));
    return copy(w.get("saved_quotes", quoteId)!);
  }

  async askSamples(write: { values: Record<string, unknown>; children: { sample_stocks: { values: { material_id: Id } }[] } }): Promise<Row> {
    const w = this.world;
    if (w.settings()["sample_packs"] === false) throw refusal("PUBLIC_SWITCHED_OFF", 409);
    const again = w.all("sample_requests").find((r) => r["client_key"] !== undefined && r["client_key"] !== null && r["client_key"] === write.values["client_key"]);
    if (again !== undefined) return copy(again);
    let refused: string | null = null;
    const made = w.write(() => {
      const row = w.insert("sample_requests", { ...write.values });
      deriveAll(w.tables);
      refused = clash(w, "sample_requests", row);
      if (refused !== null) {
        w.remove("sample_requests", row.id);
        return row;
      }
      for (const stock of write.children.sample_stocks) w.insert("sample_stocks", { request_id: row.id, material_id: stock.values.material_id });
      return row;
    });
    // Adminium names no column here, so nobody can learn which addresses have asked.
    if (refused !== null) throw refusal("PUBLIC_WRITE_REFUSED", 400);
    return copy(w.get("sample_requests", made.id)!);
  }
}

/**
 * The Customiser's calls over the world's rows: its bases, pieces, areas,
 * ready-made designs and palettes, and the designs a customer saves. No file
 * is stored for a design in the demo, so an upload of a logo is not offered.
 */
export function demoCustomiser(world: DemoWorld): CustomiserApi {
  const savedOf = (row: Row): SavedDesign => ({
    id: row.id,
    code: typeof row["code"] === "string" ? row["code"] : null,
    base_id: row["base_id"] as Id,
    ready_design_id: (row["ready_design_id"] as Id | null | undefined) ?? null,
    values: copy(row["values"] as DesignValues),
    state: row["state"] === "ordered" ? "ordered" : "draft",
    updatedAt: typeof row["updated_at"] === "string" ? row["updated_at"] : null,
    session: typeof row["session"] === "string" ? { token: row["session"], level: "verified", expiresAt: world.now + 30 * 86_400_000 } : null,
    files: {},
    link: typeof row["link"] === "string" ? row["link"] : null,
  });
  const ofBase = (table: string, base: unknown) => copy(world.all(table).filter((r) => same(r["base_id"], base)));
  const put = (values: Record<string, unknown>) => world.write(() => world.insert("designs", values));
  return {
    async catalogue(base) {
      const ready = ofBase("ready_designs", base).filter((r) => r["state"] !== "draft");
      const readyIds = new Set(ready.map((r) => String(r.id)));
      return {
        bases: copy(world.all("bases").filter((b) => same(b.id, base))),
        pieces: ofBase("base_pieces", base),
        areas: ofBase("base_areas", base),
        ready,
        parts: copy(world.all("ready_parts").filter((p) => readyIds.has(String(p["ready_design_id"])))),
        fonts: [],
        palettes: copy(world.all("palettes")),
        colours: copy(world.all("palette_colours")),
        features: copy(world.all("features")),
        settings: [],
      };
    },
    fontUrl: async () => null,
    async create(design: DesignData, email: string | null) {
      const row = put({ app: "printing", code: world.code("MPD", 10), format: 1, base_id: design.base_id, ready_design_id: design.ready_design_id, values: copy(design.values), email, state: "draft", session: world.code("S"), link: world.code("L"), updated_at: world.nowIso() });
      return savedOf(row);
    },
    async change(design: SavedDesign, values: DesignValues) {
      const row = world.write(() => world.update("designs", design.id, { values: copy(values), updated_at: world.nowIso() }));
      return savedOf(row);
    },
    async remove(design: SavedDesign) {
      world.remove("designs", design.id);
      world.changed();
    },
    async openLink(token: string) {
      const row = world.all("designs").find((d) => d["link"] === token);
      return row === undefined ? "unknown" : savedOf(row);
    },
    async reopen(session: HeldSession) {
      const row = world.all("designs").find((d) => d["session"] === session.token);
      return row === undefined ? null : savedOf(row);
    },
    async byCodes(codes: readonly string[]) {
      return world.all("designs").filter((d) => codes.includes(String(d["code"]))).map(savedOf);
    },
    upload: null,
    file: async () => null,
  };
}
