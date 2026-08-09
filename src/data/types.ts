/**
 * Domain types for the seed and the screens.
 *
 * The engines own their own types (`lib/quote.ts`, `lib/jobs.ts`); this module
 * carries the shapes the DATA has — customers, saved quotes, stock rows — plus
 * the pinned clock.
 */

import type { Job, StockRow } from '../lib/jobs.ts';
import type { Configuration } from '../lib/quote.ts';

export type { Job, StockRow };

/**
 * The pinned clock. Wednesday, 5 August 2026, 10:20 — nothing anywhere reads a
 * real one, which is what lets the demo's due chips, promise dates and
 * turnaround arithmetic be asserted in tests and reproduced on the droplet.
 */
export interface Now {
  iso: string;
  hour: number;
  minute: number;
}

export interface Customer {
  key: string;
  /** Invented small businesses that are clearly not real firms. */
  name: string;
  email: string;
  town: string;
}

/** A quote the customer saved without ordering. */
export interface SavedQuote {
  ref: string;
  config: Configuration;
  savedOn: string;
  customerKey: string;
  /** A name the customer gave it, if any. */
  label?: string;
}

/** One file a customer sent, with the numbers the checks measured. */
export interface ArtworkRecord {
  jobRef: string;
  filename: string;
  widthPx: number;
  heightPx: number;
  widthMm: number;
  heightMm: number;
  bleedMm: number;
  nearestInkMm: number;
  colourSpace: 'CMYK' | 'RGB';
  fontsEmbedded: boolean;
  pages: number;
  /** Which add-on produced it, when one did. Absent for a plain upload. */
  source?: string;
}
