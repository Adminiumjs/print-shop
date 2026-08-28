// SPDX-License-Identifier: AGPL-3.0-only
/**
 * A `DataSource` backed by a real Adminium instance (28-public-surface.md §5.2,
 * 28-T28 wave 3).
 *
 * ── READS DO NOT BECOME ASYNC ──────────────────────────────────────────────
 * `loadSnapshot` fetches the whole read-set once, before React mounts, and
 * hands back the same SYNCHRONOUS shapes `demoSource` returns — so the store,
 * the quote engine and every screen are untouched.
 *
 * ── THE EGRESS GATE IS NOT RELAXED FOR THIS FILE ───────────────────────────
 * This repo bans the MEANS of sending, over sources and over built output, and
 * §5.4 budgeted a "relax NET TWO for one declared file" change here. That turned
 * out to be the wrong shape and 28-T26 measured why: a connected data source
 * NAMES no request-issuing API — it imports a client that does — so NET TWO
 * never fires on it, while NET ONE reports the ORIGIN Vite inlines. So the only
 * widening is `connectedBackend(VITE_ADMINIUM_API_BASE_URL)`, which forgives one
 * host in EVERY file rather than every host in one file. A tracker's address in
 * THIS file is still a finding, which is the property a file-scoped exemption
 * would have thrown away.
 *
 * ── THE CATALOGUE IS CODE, AND THE DATABASE'S COPY IS NOT READ ─────────────
 * The biggest thing this connection reveals. `lib/catalogue.ts` and
 * `lib/rates.ts` hold the products, the materials, their rates and their
 * imposition — as compile-time unions the quote engine reasons about. The
 * database has `products` and `materials` tables that MIRROR them, and this
 * file reads them for exactly one purpose: to turn a job's `product_id` back
 * into the app's own key. A tenant who adds a product gets a row the generated
 * dashboard can edit and the shop floor cannot sell, and a job whose product or
 * material this build does not know is DROPPED rather than priced with the
 * wrong rate. That is the people-ops pattern applied to a catalogue, and it is
 * the argument for 28-T36 moving pricing into the schema.
 *
 * ── WHAT THE SCHEMA CANNOT SAY (WS-I gaps, marked not hidden) ──────────────
 * G-1 THE WORKS HAS NO RECORD. Its name, address, founding year and headcount
 *     are in `demo.ts` and nowhere in `db/schema.sql`. Connected mode returns a
 *     BLANK works rather than Marlow Press — because `add-ons/records.ts` puts
 *     that address on every dispatch label, and printing one shop's address on
 *     another shop's parcels is worse than printing none.
 * G-2 `customers` has a name, an e-mail and a town, and no postal address. The
 *     delivery add-on therefore resolves no address for anybody, which is what
 *     `addressFor` already returns for an unknown customer — a miss, handled.
 * G-3 There is no customer key, so a customer is addressed by row id. The app
 *     only ever renders the display name, so nothing downstream notices.
 * G-4 `artwork.file` is a `bytea` and is NOT read: the app renders the measured
 *     numbers, never the artwork, and pulling every original into the browser
 *     to display none of them would be a real cost for nothing.
 */

import { createPublicClient, toTenantDay, type PublicClient } from '@adminiumjs/public-client';

import { PRODUCTS } from '../lib/catalogue.ts';
import type { Job, JobStage, ProofEvent, StockRow } from '../lib/jobs.ts';
import { MATERIALS } from '../lib/rates.ts';
import type { Configuration } from '../lib/quote.ts';
import type { ArtworkRecord, Customer, Now, SavedQuote } from './types.ts';
import type { DataSource, Works } from './source.ts';

/* --------------------------------------------------------------- the wire */

interface WireCustomer {
  id: number;
  name: string;
  email: string;
  town: string;
}

interface WireKeyed {
  id: number;
  key: string;
}

interface WireMaterial extends WireKeyed {
  kind: 'sheet' | 'roll';
  on_hand: number;
  reorder_at: number;
}

interface WireQuote {
  ref: string;
  customer_id: number;
  label: string | null;
  configuration: Configuration | string;
  saved_on: string;
}

interface WireJob {
  id: number;
  ref: string;
  customer_id: number;
  product_id: number;
  material_id: number;
  quantity: number;
  /** `numeric` serializes as a STRING, not a number. */
  trim_width_mm: string;
  trim_height_mm: string;
  sides: number;
  finish_key: string;
  packaging_key: string;
  stage: string;
  promised_for: string;
  express: boolean;
  spoiled_sheets: number;
}

interface WireArtwork {
  job_id: number;
  filename: string;
  width_px: number;
  height_px: number;
  width_mm: string;
  height_mm: string;
  bleed_mm: string;
  nearest_ink_mm: string;
  colour_space: 'CMYK' | 'RGB';
  fonts_embedded: boolean;
  pages: number;
  source: string | null;
}

interface WireProof {
  job_id: number;
  kind: 'sent' | 'change-asked' | 'approved';
  note: string | null;
  at: string;
}

interface WireDispatch {
  job_id: number;
  kind: 'collected' | 'carrier';
  tracking: string | null;
  at: string;
}

/** The two stages that put a job in the ledger rather than on the board. */
const FINISHED: ReadonlySet<string> = new Set(['dispatched', 'collected']);

/**
 * WS-I G-1 — the works itself, which `db/schema.sql` has nowhere to put.
 *
 * Blank, not the seed's. `add-ons/records.ts` prints `SHOP_ORIGIN` on every
 * dispatch label, so carrying Marlow Press across would put one shop's address
 * on another shop's parcels — a defect a reader would only find in the post.
 */
const NO_WORKS: Works = {
  name: '',
  lines: [],
  city: '',
  postcode: '',
  country: '',
  countryCode: '',
  established: 0,
  people: 0,
};

/**
 * The columns the scope must expose, checked at boot.
 *
 * `artwork.file` is deliberately absent — see G-4.
 */
const REQUIRED = {
  customers: ['id', 'name', 'email', 'town'],
  products: ['id', 'key'],
  materials: ['id', 'key', 'kind', 'on_hand', 'reorder_at'],
  quotes: ['ref', 'customer_id', 'label', 'configuration', 'saved_on'],
  jobs: [
    'id', 'ref', 'customer_id', 'product_id', 'material_id', 'quantity',
    'trim_width_mm', 'trim_height_mm', 'sides', 'finish_key', 'packaging_key',
    'stage', 'promised_for', 'express', 'spoiled_sheets',
  ],
  artwork: [
    'job_id', 'filename', 'width_px', 'height_px', 'width_mm', 'height_mm',
    'bleed_mm', 'nearest_ink_mm', 'colour_space', 'fonts_embedded', 'pages', 'source',
  ],
  proofs: ['job_id', 'kind', 'note', 'at'],
  dispatches: ['job_id', 'kind', 'tracking', 'at'],
};

export interface Snapshot {
  now: Now;
  jobs: Job[];
  pastJobs: Job[];
  savedQuotes: SavedQuote[];
  customers: Customer[];
  stock: StockRow[];
  artwork: ArtworkRecord[];
  nextRef: string;
}

/**
 * The client, or null when either build-time variable is absent.
 *
 * The emptiness check is `createPublicClient`'s, not repeated here: it already
 * treats a missing or empty value as 'this build has no server', and a second
 * copy of that rule is a second place for it to drift.
 */
export function clientFromEnv(): PublicClient | null {
  return createPublicClient({
    baseUrl: import.meta.env['VITE_ADMINIUM_API_BASE_URL'] as string | undefined,
    publishableKey: import.meta.env['VITE_ADMINIUM_PUBLISHABLE_KEY'] as string | undefined,
  });
}

/** Read a whole ref, a page at a time, at whatever size the scope permits. */
async function listAll<T>(
  client: PublicClient,
  ref: string,
  size: number,
  max: number,
): Promise<T[]> {
  const out: T[] = [];
  const page = Math.max(1, Math.min(size, 500));
  for (let offset = 0; offset < max; offset += page) {
    const res = await client.list<T>(ref, { limit: page, offset });
    out.push(...res.data);
    if (res.data.length < page) return out;
  }
  console.warn(`[adminium] ${ref}: stopped at ${String(max)} rows — the rest were not read.`);
  return out;
}

/**
 * Fetch the read-set and map it into the app's shapes.
 *
 * Returns `null` on ANY failure so the caller falls back to demo mode
 * structurally rather than in a catch — the marketplace demos are static clones
 * with no server and must keep working byte-identically.
 */
export async function loadSnapshot(client: PublicClient): Promise<Snapshot | null> {
  try {
    await client.assertRefs(REQUIRED);
    const config = await client.config();
    const tz = config.timezone;
    const cap = (ref: string): number => config.refs[ref]?.limit ?? 100;

    const [customers, products, materials, quotes, jobs, artwork, proofs, dispatches] =
      await Promise.all([
        listAll<WireCustomer>(client, 'customers', cap('customers'), 20_000),
        listAll<WireKeyed>(client, 'products', cap('products'), 500),
        listAll<WireMaterial>(client, 'materials', cap('materials'), 500),
        listAll<WireQuote>(client, 'quotes', cap('quotes'), 20_000),
        listAll<WireJob>(client, 'jobs', cap('jobs'), 50_000),
        listAll<WireArtwork>(client, 'artwork', cap('artwork'), 50_000),
        listAll<WireProof>(client, 'proofs', cap('proofs'), 100_000),
        listAll<WireDispatch>(client, 'dispatches', cap('dispatches'), 50_000),
      ]);

    /* The catalogue is code. These two maps are the ONLY thing the database's
     * mirror of it is read for: turning a foreign key back into the key the
     * quote engine reasons about. A key this build does not know is not in the
     * map, and every job that uses it is dropped below. */
    const known = new Set(PRODUCTS.map((p) => p.key as string));
    const productKey = new Map<number, string>();
    for (const row of products) if (known.has(row.key)) productKey.set(row.id, row.key);

    const knownMaterial = new Set(MATERIALS.map((m) => m.key as string));
    const materialKey = new Map<number, string>();
    for (const row of materials) if (knownMaterial.has(row.key)) materialKey.set(row.id, row.key);

    const mappedCustomers: Customer[] = customers.map((row) => ({
      // WS-I G-3: no customer key column, so the row id is the key. Nothing
      // downstream renders it — the seam resolves it to a display name.
      key: String(row.id),
      name: row.name,
      email: row.email,
      town: row.town,
      // WS-I G-2: no postal address anywhere in this schema.
      address: { lines: [], city: '', postcode: '', country: '' },
    }));
    const nameOf = new Map(mappedCustomers.map((c) => [c.key, c.name]));

    const proofsByJob = new Map<number, ProofEvent[]>();
    for (const row of proofs) {
      const list = proofsByJob.get(row.job_id) ?? [];
      const event: ProofEvent = { kind: row.kind, at: row.at };
      if (row.note !== null && row.note.length > 0) event.note = row.note;
      list.push(event);
      proofsByJob.set(row.job_id, list);
    }

    const dispatchByJob = new Map<number, WireDispatch>();
    for (const row of dispatches) dispatchByJob.set(row.job_id, row);

    const refOfJob = new Map<number, string>(jobs.map((j) => [j.id, j.ref]));

    const live: Job[] = [];
    const past: Job[] = [];
    for (const row of jobs) {
      const product = productKey.get(row.product_id);
      const material = materialKey.get(row.material_id);
      /* A job priced against a product or a paper this build has never heard of
       * cannot be imposed, costed or scheduled. Dropped, not guessed at: the
       * alternative is a board showing a job with somebody else's rate. */
      if (product === undefined || material === undefined) continue;

      const dispatch = dispatchByJob.get(row.id);
      const job: Job = {
        ref: row.ref,
        productKey: product,
        materialKey: material,
        // The seam's own convention: a job carries a display NAME by the time a
        // screen sees it, resolved once here rather than in every screen.
        customer: nameOf.get(String(row.customer_id)) ?? String(row.customer_id),
        quantity: row.quantity,
        trimWidthMm: Number(row.trim_width_mm),
        trimHeightMm: Number(row.trim_height_mm),
        sides: row.sides === 2 ? 2 : 1,
        finishKey: row.finish_key,
        packagingKey: row.packaging_key,
        stage: row.stage as JobStage,
        promisedFor: row.promised_for,
        express: row.express,
        proofs: proofsByJob.get(row.id) ?? [],
        spoiledSheets: row.spoiled_sheets,
        ...(dispatch === undefined
          ? {}
          : {
              dispatch: {
                kind: dispatch.kind,
                at: toTenantDay(dispatch.at, tz),
                ...(dispatch.tracking === null ? {} : { tracking: dispatch.tracking }),
              },
            }),
      };
      (FINISHED.has(row.stage) ? past : live).push(job);
    }

    const savedQuotes: SavedQuote[] = [];
    for (const row of quotes) {
      /* `jsonb` comes back parsed on postgres and mysql and as TEXT on sqlite,
       * which is the same split `packages/meta`'s public-api repo had to handle
       * server-side. A quote that will not parse is dropped rather than thrown. */
      const parsed = parseConfiguration(row.configuration);
      if (parsed === null) continue;
      if (!known.has(parsed.product) || !knownMaterial.has(parsed.material)) continue;
      savedQuotes.push({
        ref: row.ref,
        config: parsed,
        savedOn: row.saved_on,
        customerKey: String(row.customer_id),
        ...(row.label === null || row.label.length === 0 ? {} : { label: row.label }),
      });
    }

    const nowIso = new Date().toISOString();
    const clock = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(nowIso));
    const parts = clock.split(':');

    return {
      now: {
        iso: toTenantDay(nowIso, tz),
        hour: Number(parts[0]),
        minute: Number(parts[1] ?? '0'),
      },
      jobs: live,
      pastJobs: past,
      savedQuotes,
      customers: mappedCustomers,
      stock: materials
        .filter((row) => knownMaterial.has(row.key))
        .map((row) => ({
          key: row.key,
          kind: row.kind,
          onHand: row.on_hand,
          reorderAt: row.reorder_at,
        })),
      artwork: artwork.flatMap((row) => {
        const jobRef = refOfJob.get(row.job_id);
        if (jobRef === undefined) return [];
        const record: ArtworkRecord = {
          jobRef,
          filename: row.filename,
          widthPx: row.width_px,
          heightPx: row.height_px,
          widthMm: Number(row.width_mm),
          heightMm: Number(row.height_mm),
          bleedMm: Number(row.bleed_mm),
          nearestInkMm: Number(row.nearest_ink_mm),
          colourSpace: row.colour_space,
          fontsEmbedded: row.fonts_embedded,
          pages: row.pages,
        };
        return [record];
      }),
      nextRef: nextRefFrom(jobs),
    };
  } catch (error) {
    console.warn('[adminium] connected mode unavailable, using demo data:', error);
    return null;
  }
}

/** `jsonb` arrives parsed on postgres and mysql, and as text on sqlite. */
function parseConfiguration(value: Configuration | string): Configuration | null {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value) as Configuration;
  } catch {
    return null;
  }
}

/**
 * The reference the next order takes, continuing the works' own sequence.
 *
 * The seed stops one short at `MP-4127`, and a connected shop has its own
 * prefix and its own count. Anything that does not end in digits is ignored
 * rather than parsed into `NaN`.
 */
function nextRefFrom(jobs: readonly WireJob[]): string {
  let prefix = '';
  let highest = 0;
  let width = 0;
  for (const row of jobs) {
    const match = /^(.*?)(\d+)$/.exec(row.ref);
    if (match === null) continue;
    const value = Number(match[2]);
    if (value <= highest) continue;
    highest = value;
    prefix = match[1] ?? '';
    width = (match[2] ?? '').length;
  }
  if (highest === 0) return '';
  return `${prefix}${String(highest + 1).padStart(width, '0')}`;
}

/** A synchronous `DataSource` over an already-fetched snapshot. */
export function snapshotSource(snap: Snapshot): DataSource {
  const copyJob = (j: Job): Job => ({
    ...j,
    proofs: j.proofs.map((p) => ({ ...p })),
    ...(j.dispatch !== undefined ? { dispatch: { ...j.dispatch } } : {}),
  });
  return {
    now: () => ({ ...snap.now }),
    jobs: () => snap.jobs.map(copyJob),
    pastJobs: () => snap.pastJobs.map(copyJob),
    savedQuotes: () => snap.savedQuotes.map((q) => ({ ...q, config: { ...q.config } })),
    customers: () => snap.customers.map((c) => ({ ...c, address: { ...c.address, lines: [] } })),
    stock: () => snap.stock.map((s) => ({ ...s })),
    artwork: () => snap.artwork.map((a) => ({ ...a })),
    nextRef: () => snap.nextRef,
    // WS-I G-1: blank, not Marlow Press. See the header.
    works: () => ({ ...NO_WORKS, lines: [] }),
  };
}
