// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Connected mode (28-public-surface.md §5.2, 28-T28 wave 3).
 *
 * ── WHY THIS DRIVES A REAL CLIENT ──────────────────────────────────────────
 * `createPublicClient` takes an injectable `fetch`, so these run the SHIPPED
 * client against canned wire responses rather than a hand-written stub of it.
 * `assertRefs`, the config fetch, the paging and the URL building are therefore
 * under test too.
 *
 * ── THE TWO PROPERTIES THIS REPO CARES ABOUT MOST ──────────────────────────
 *  1. A job priced against a product or a paper this build does not know is
 *     DROPPED. The catalogue is compile-time code; the database's copy of it is
 *     read only to turn a foreign key back into a key the quote engine knows.
 *     Keeping such a job would put somebody else's rate on this shop's board.
 *  2. The works is BLANK, not Marlow Press. `add-ons/records.ts` stamps that
 *     address on every dispatch label, and one shop's address on another shop's
 *     parcels is a defect a reader only finds in the post.
 */

import { describe, expect, it } from 'vitest';

import { createPublicClient } from '@adminiumjs/public-client';

import { loadSnapshot, snapshotSource } from './adminiumSource.ts';
import { demoSource, isConnected, setDataSource, source } from './source.ts';

const REFS = [
  'customers', 'products', 'materials', 'quotes', 'jobs', 'artwork', 'proofs', 'dispatches',
];

const ROWS: Record<string, unknown[]> = {
  customers: [
    { id: 1, name: 'Two Rivers Bakery', email: 'hello@tworivers.example', town: 'Marlow' },
  ],
  products: [
    { id: 5, key: 'business-cards' },
    { id: 6, key: 'holograms' },
  ],
  materials: [
    { id: 8, key: 'silk-350', kind: 'sheet', on_hand: 900, reorder_at: 200 },
    { id: 9, key: 'unobtanium-900', kind: 'sheet', on_hand: 10, reorder_at: 1 },
  ],
  quotes: [
    {
      ref: 'MP-Q-88', customer_id: 1, label: 'Reprint',
      configuration: {
        product: 'business-cards', material: 'silk-350', size: 'bc-85x55', sides: 2,
        finish: 'matt-lam', quantity: 500, packaging: 'boxed', printedProof: false,
        express: false, delivery: 'collect',
      },
      saved_on: '2026-08-01',
    },
  ],
  jobs: [
    {
      id: 100, ref: 'MP-4126', customer_id: 1, product_id: 5, material_id: 8, quantity: 500,
      trim_width_mm: '85.0', trim_height_mm: '55.0', sides: 2, finish_key: 'matt-lam',
      packaging_key: 'boxed', stage: 'printing', promised_for: '2026-08-07',
      express: false, spoiled_sheets: 3,
    },
    {
      id: 101, ref: 'MP-4125', customer_id: 1, product_id: 5, material_id: 8, quantity: 250,
      trim_width_mm: '85.0', trim_height_mm: '55.0', sides: 1, finish_key: 'none',
      packaging_key: 'boxed', stage: 'dispatched', promised_for: '2026-08-01',
      express: true, spoiled_sheets: 0,
    },
    {
      id: 102, ref: 'MP-4200', customer_id: 1, product_id: 6, material_id: 9, quantity: 10,
      trim_width_mm: '85.0', trim_height_mm: '55.0', sides: 1, finish_key: 'none',
      packaging_key: 'boxed', stage: 'ordered', promised_for: '2026-08-09',
      express: false, spoiled_sheets: 0,
    },
  ],
  artwork: [
    {
      job_id: 100, filename: 'cards_front.pdf', width_px: 1050, height_px: 675,
      width_mm: '89.0', height_mm: '59.0', bleed_mm: '2.0', nearest_ink_mm: '3.5',
      colour_space: 'CMYK', fonts_embedded: true, pages: 2, source: 'upload',
    },
  ],
  proofs: [
    { job_id: 100, kind: 'sent', note: null, at: '2026-08-03' },
    { job_id: 100, kind: 'approved', note: 'Looks right', at: '2026-08-04' },
  ],
  dispatches: [
    { job_id: 101, kind: 'carrier', tracking: 'TRK-9', at: '2026-08-02T09:15:00Z' },
  ],
};

interface FakeOptions {
  rows?: Record<string, unknown[]>;
  expose?: (ref: string) => string[];
  /** The scope's per-ref page ceiling — the operator's number, not the app's. */
  limit?: number;
}

/** A server that answers exactly what the scope would, paging included. */
function fakeFetch(overrides: FakeOptions = {}) {
  const rows = overrides.rows ?? ROWS;
  const limit = overrides.limit ?? 500;
  return async (input: RequestInfo | URL): Promise<Response> => {
    const url = new URL(String(input));
    const json = (body: unknown) =>
      new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });

    if (url.pathname.endsWith('/public/config')) {
      const refs: Record<string, unknown> = {};
      for (const ref of REFS) {
        refs[ref] = {
          actions: ['list'],
          expose: overrides.expose?.(ref) ?? Object.keys((rows[ref]?.[0] ?? {}) as object),
          filterable: [], searchable: [], orderable: [], writable: [], limit,
        };
      }
      // `/public/config` is the one route the client unwraps: it reads
      // `body.data`, while `list` reads the body itself.
      return json({
        data: { version: 1, side: 'staff', timezone: 'Europe/London', currency: 'GBP', claim: null, refs },
      });
    }

    const ref = url.pathname.split('/').pop() ?? '';
    const all = rows[ref] ?? [];
    const offset = Number(url.searchParams.get('offset') ?? '0');
    const size = Number(url.searchParams.get('limit') ?? String(all.length));
    return json({ data: all.slice(offset, offset + size) });
  };
}

const clientWith = (fetch: ReturnType<typeof fakeFetch>) =>
  createPublicClient({ baseUrl: 'https://api.example.test', publishableKey: 'adm_pub_test', fetch });

const snapshot = async (overrides: FakeOptions = {}) =>
  loadSnapshot(clientWith(fakeFetch(overrides))!);

describe('demo mode is the structural default', () => {
  it('builds no client when either variable is absent', () => {
    expect(createPublicClient({ baseUrl: 'https://x.test', publishableKey: '' })).toBeNull();
    expect(createPublicClient({ baseUrl: '', publishableKey: 'adm_pub_x' })).toBeNull();
    expect(createPublicClient(undefined)).toBeNull();
  });

  it('falls back rather than throwing when the server is unreachable', async () => {
    const client = clientWith(async () => {
      throw new Error('ECONNREFUSED');
    });
    expect(await loadSnapshot(client!)).toBeNull();
  });

  it('falls back when the scope does not expose a column the app reads', async () => {
    expect(await snapshot({ expose: () => ['id'] })).toBeNull();
  });
});

describe('the catalogue is code, and the database only maps back onto it', () => {
  it('drops a job whose product or paper this build has never heard of', async () => {
    const snap = await snapshot();
    expect(snap).not.toBeNull();
    // `holograms` and `unobtanium-900` are rows a tenant added; the quote engine
    // cannot impose, cost or schedule either. Pricing them with somebody else's
    // rate is the failure this drop prevents.
    expect([...snap!.jobs, ...snap!.pastJobs].map((j) => j.ref)).toEqual(['MP-4126', 'MP-4125']);
    // Stock is the same story: a paper with no rate has no shelf on this board.
    expect(snap!.stock.map((s) => s.key)).toEqual(['silk-350']);
  });

  it('splits the board from the ledger by stage', async () => {
    const snap = await snapshot();
    expect(snap!.jobs.map((j) => j.ref)).toEqual(['MP-4126']);
    expect(snap!.pastJobs.map((j) => j.ref)).toEqual(['MP-4125']);
    // A dispatch is one row per job and carries the day it left, in the WORKS'
    // zone — 09:15Z is still 2 August in London, and reading it anywhere else
    // could move it across midnight with no error.
    expect(snap!.pastJobs[0]!.dispatch).toEqual({
      kind: 'carrier', at: '2026-08-02', tracking: 'TRK-9',
    });
    expect(snap!.jobs[0]!.dispatch).toBeUndefined();
  });

  it('resolves a job to a display name, as the seam has always promised', async () => {
    const snap = await snapshot();
    // `Job.customer` is a NAME by the time a screen sees it — one lookup here
    // rather than one in the board, the ticket, search and the order view.
    expect(snap!.jobs[0]!.customer).toBe('Two Rivers Bakery');
    expect(snap!.jobs[0]!.proofs).toEqual([
      { kind: 'sent', at: '2026-08-03' },
      { kind: 'approved', at: '2026-08-04', note: 'Looks right' },
    ]);
    // `numeric` arrives as a string and must not reach arithmetic as one.
    expect(snap!.jobs[0]!.trimWidthMm).toBe(85);
    expect(snap!.artwork[0]!.bleedMm).toBe(2);
    expect(snap!.artwork[0]!.jobRef).toBe('MP-4126');
  });

  it('parses a jsonb configuration whether it arrives parsed or as text', async () => {
    const parsed = await snapshot();
    expect(parsed!.savedQuotes[0]!.config.quantity).toBe(500);
    expect(parsed!.savedQuotes[0]!.label).toBe('Reprint');
    // sqlite hands a `json` column back as TEXT while postgres and mysql parse
    // it — the same split `packages/meta`'s public-api repo had to handle.
    const asText = await snapshot({
      rows: {
        ...ROWS,
        quotes: [{ ...(ROWS['quotes']![0] as object), configuration: JSON.stringify((ROWS['quotes']![0] as { configuration: unknown }).configuration) }],
      },
    });
    expect(asText!.savedQuotes[0]!.config.quantity).toBe(500);
  });

  it('continues the works’ own reference sequence, prefix and width included', async () => {
    const snap = await snapshot();
    // The seed stops one short at MP-4127. A connected shop has its own prefix
    // and its own count, and MP-4200 is the highest here.
    expect(snap!.nextRef).toBe('MP-4201');
  });

  it('reads every page, not just the first the scope allows', async () => {
    const snap = await snapshot({ limit: 1 });
    expect(snap!.jobs[0]!.proofs).toHaveLength(2);
    expect([...snap!.jobs, ...snap!.pastJobs]).toHaveLength(2);
  });
});

describe('what a connected build refuses to carry over', () => {
  it('returns a blank works rather than the seed’s address', async () => {
    const connected = snapshotSource((await snapshot())!);
    // WS-I G-1. `add-ons/records.ts` stamps this on every dispatch label.
    expect(connected.works()).toEqual({
      name: '', lines: [], city: '', postcode: '', country: '', countryCode: '',
      established: 0, people: 0,
    });
    // WS-I G-2: `customers` has a town and no postal address at all, so the
    // delivery add-on resolves nothing — which is the miss it already handles.
    expect(connected.customers()[0]!.address).toEqual({
      lines: [], city: '', postcode: '', country: '',
    });
  });

  it('hands back the same shapes demoSource does', async () => {
    const connected = snapshotSource((await snapshot())!);
    for (const key of Object.keys(demoSource) as (keyof typeof demoSource)[]) {
      expect(typeof connected[key]).toBe('function');
    }
    connected.jobs()[0]!.proofs.push({ kind: 'sent', at: 'x' });
    expect(connected.jobs()[0]!.proofs).toHaveLength(2);
  });

  it('reads the clock in the tenant’s zone, in the app’s own shape', async () => {
    const snap = await snapshot();
    expect(snap!.now.iso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(snap!.now.hour).toBeGreaterThanOrEqual(0);
    expect(snap!.now.hour).toBeLessThan(24);
    expect(snap!.now.minute).toBeLessThan(60);
  });
});

describe('the seam', () => {
  it('reports demo mode until a real source is installed', () => {
    expect(isConnected()).toBe(false);
  });

  it('refuses a swap that arrives after the store has read', () => {
    // THE SILENT FAILURE THIS PINS. `state/store.ts` and `add-ons/records.ts`
    // both read at module scope, so a static `import App` evaluates them during
    // main.tsx's own imports — before any fetch can resolve. The app then runs
    // on demo data against a configured backend and looks entirely correct.
    source.jobs();
    expect(() => setDataSource(demoSource)).toThrow(/after the store already read/);
  });
});
