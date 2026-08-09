/**
 * The DataSource seam (18 D7).
 *
 * This app ships in demo mode: every read below returns the seeded fiction in
 * `demo.ts`, synchronously, with no network involved. The seam exists so that
 * pointing the app at a real Adminium deployment is a change to ONE file rather
 * than a rewrite — the screens and the store already talk to this interface and
 * never import `demo.ts` for data they render.
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
  works(): typeof WORKS;
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

/** The source the app is currently wired to. */
export const source: DataSource = demoSource;
