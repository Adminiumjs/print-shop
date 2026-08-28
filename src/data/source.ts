/**
 * The DataSource seam (18 D7).
 *
 * This app ships in demo mode: every read below returns the seeded fiction in
 * `demo.ts`, synchronously, with no network involved. The seam exists so that
 * pointing the app at a real Adminium deployment is a change to ONE file rather
 * than a rewrite — the screens and the store already talk to this interface and
 * never import `demo.ts` for data they render.
 *
 * That second implementation now exists: `adminiumSource.ts` reads a real
 * Adminium instance through `@adminiumjs/public-client` and is swapped in by
 * `main.tsx` before React mounts. `demoSource` remains the fallback whenever
 * either build-time env var is absent — which is the case for every
 * marketplace demo, and is why that fallback is structural rather than a catch.
 *
 * Records are copied on the way out, nested arrays and all, so a caller that
 * mutates what it is given cannot reach back into the seed. That is what lets
 * the demo reset cleanly without a page reload.
 */

import type { Job, StockRow } from '../lib/jobs.ts';
import {
  ARTWORK,
  CUSTOMERS,
  JOBS,
  NEXT_REF,
  NOW,
  PAST_JOBS,
  SAVED_QUOTES,
  STOCK,
  WORKS,
} from './demo.ts';
import type { ArtworkRecord, Customer, Now, SavedQuote } from './types.ts';

/**
 * The works itself — its name, where it is, and two facts the About page prints.
 *
 * This used to be typed `typeof WORKS`, and `WORKS` is `as const`: the seam
 * therefore declared, in the type system, that the works IS Marlow Press at
 * 3 Market Square. A second implementation could not return anything else
 * without a type error, which is a seam that cannot be swapped — the exact
 * failure this file exists to prevent, hiding in a return type.
 */
export interface Works {
  name: string;
  lines: readonly string[];
  city: string;
  postcode: string;
  country: string;
  /** ISO 3166-1 alpha-2, beside the name a reader sees. */
  countryCode: string;
  established: number;
  people: number;
}

export interface DataSource {
  /** The pinned clock. A live deployment would return the real one here. */
  now(): Now;
  jobs(): Job[];
  pastJobs(): Job[];
  savedQuotes(): SavedQuote[];
  customers(): Customer[];
  stock(): StockRow[];
  artwork(): ArtworkRecord[];
  nextRef(): string;
  works(): Works;
}

/**
 * Jobs carry a customer KEY in the seed. Resolving it here rather than in each
 * screen means one lookup, and it keeps `Job.customer` a display name for
 * everything downstream — the board, the ticket, search and the order view.
 */
const nameFor = (key: string): string =>
  CUSTOMERS.find((c) => c.key === key)?.name ?? key;

const copyJob = (j: Job): Job => ({
  ...j,
  customer: nameFor(j.customer),
  proofs: j.proofs.map((p) => ({ ...p })),
  ...(j.dispatch !== undefined ? { dispatch: { ...j.dispatch } } : {}),
});

export const demoSource: DataSource = {
  now: () => ({ ...NOW }),
  jobs: () => JOBS.map(copyJob),
  pastJobs: () => PAST_JOBS.map(copyJob),
  savedQuotes: () => SAVED_QUOTES.map((q) => ({ ...q, config: { ...q.config } })),
  customers: () => CUSTOMERS.map((c) => ({ ...c })),
  stock: () => STOCK.map((s) => ({ ...s })),
  artwork: () => ARTWORK.map((a) => ({ ...a })),
  nextRef: () => NEXT_REF,
  works: () => WORKS,
};

let current: DataSource = demoSource;
let read = false;

/**
 * The source the app is currently wired to.
 *
 * An indirection rather than a re-export, because `state/store.ts` reads it at
 * MODULE SCOPE — a re-exported binding would be captured at import time and a
 * later swap would change nothing.
 */
export const source: DataSource = {
  now: () => ((read = true), current.now()),
  jobs: () => ((read = true), current.jobs()),
  pastJobs: () => ((read = true), current.pastJobs()),
  savedQuotes: () => ((read = true), current.savedQuotes()),
  customers: () => ((read = true), current.customers()),
  stock: () => ((read = true), current.stock()),
  artwork: () => ((read = true), current.artwork()),
  nextRef: () => ((read = true), current.nextRef()),
  works: () => ((read = true), current.works()),
};

/**
 * Swap the backing source. Must happen before any module-scope read.
 *
 * The tripwire is the whole reason this is a function and not an assignment:
 * the ordering it depends on is invisible, and getting it wrong fails SILENTLY
 * — the app renders demo data against a configured backend and looks fine. A
 * thrown error at boot is the only way that mistake announces itself.
 */
export function setDataSource(next: DataSource): void {
  if (read) {
    throw new Error(
      'setDataSource() called after the store already read \u2014 import App dynamically, after the snapshot resolves.',
    );
  }
  current = next;
}

/**
 * True once a real backend is behind the seam.
 *
 * Read by the demo dock, which resets the works and advances the clock:
 * against a real shop's jobs those controls either lie or do damage, so it does
 * not render.
 */
export function isConnected(): boolean {
  return current !== demoSource;
}
