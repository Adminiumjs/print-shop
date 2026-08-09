/**
 * The works engine (24-marketplace-wave-4.md §4, D5): imposition, material
 * consumption and spoilage, and the job machine with its proof gate.
 *
 * Pure and deterministic, like `quote.ts` — the clock is always passed in.
 */

import { BLEED_MM, SRA3_PRINTABLE } from './rates.ts';

// ── imposition ───────────────────────────────────────────────────────────────

export interface Imposition {
  /** How many finished pieces fit on one press sheet. */
  up: number;
  /** True when turning the piece on the sheet is what won the count. */
  rotated: boolean;
  sheets: number;
  /** The count the losing orientation would have given — the ticket prints it. */
  upIfNotRotated: number;
}

/** How many `w × h` pieces fit in the printable area, laid out one way. */
function fit(pieceW: number, pieceH: number): number {
  return (
    Math.floor(SRA3_PRINTABLE.widthMm / pieceW) * Math.floor(SRA3_PRINTABLE.heightMm / pieceH)
  );
}

/**
 * How the run lays out on SRA3.
 *
 * The piece occupies its trim size PLUS bleed on every edge, which is why a
 * business card takes 91 × 61mm of sheet rather than 85 × 55mm. Both
 * orientations are tried and the better one wins; which one won is recorded
 * because the job ticket prints it ("6 up rotated, against 4 up upright") and
 * the works needs to know before it lays the sheet up.
 */
export function imposition(trimWidthMm: number, trimHeightMm: number, quantity: number): Imposition {
  const w = trimWidthMm + BLEED_MM * 2;
  const h = trimHeightMm + BLEED_MM * 2;

  const upright = fit(w, h);
  const turned = fit(h, w);
  const up = Math.max(upright, turned);

  if (up === 0) {
    // Bigger than the press sheet — the caller should not have got here, but a
    // division by zero would be a far worse way to find out.
    return { up: 0, rotated: false, sheets: 0, upIfNotRotated: 0 };
  }

  return {
    up,
    rotated: turned > upright,
    sheets: Math.ceil(quantity / up),
    upIfNotRotated: turned > upright ? upright : turned,
  };
}

// ── the job machine ──────────────────────────────────────────────────────────

export const JOB_STAGES = [
  'quoted',
  'ordered',
  'prepress',
  'proofed',
  'approved',
  'printing',
  'finishing',
  'ready',
  'dispatched',
  'collected',
] as const;
export type JobStage = (typeof JOB_STAGES)[number];

/** The four columns of the works board, and which stages sit in each. */
export const BOARD_COLUMNS = ['prepress', 'printing', 'finishing', 'ready'] as const;
export type BoardColumn = (typeof BOARD_COLUMNS)[number];

const STAGE_COLUMN: Readonly<Record<JobStage, BoardColumn | null>> = {
  quoted: null,
  ordered: 'prepress',
  prepress: 'prepress',
  proofed: 'prepress',
  approved: 'prepress',
  printing: 'printing',
  finishing: 'finishing',
  ready: 'ready',
  dispatched: null,
  collected: null,
};

export function columnFor(stage: JobStage): BoardColumn | null {
  return STAGE_COLUMN[stage];
}

export interface ProofEvent {
  kind: 'sent' | 'change-asked' | 'approved';
  /** ISO date. */
  at: string;
  note?: string;
}

export interface Job {
  ref: string;
  productKey: string;
  materialKey: string;
  customer: string;
  quantity: number;
  trimWidthMm: number;
  trimHeightMm: number;
  sides: 1 | 2;
  finishKey: string;
  packagingKey: string;
  stage: JobStage;
  /** ISO date the works promised. */
  promisedFor: string;
  express: boolean;
  proofs: ProofEvent[];
  /** Sheets added by spoilage, on top of what the imposition says the run needs. */
  spoiledSheets: number;
  /** Set once the job leaves the works. */
  dispatch?: { kind: 'collected' | 'carrier'; at: string; tracking?: string };
}

/** A job cannot leave prepress until its proof is approved. */
export function proofApproved(job: Job): boolean {
  return job.proofs.some((p) => p.kind === 'approved');
}

/** True when the board should draw the padlock. */
export function isLocked(job: Job): boolean {
  return columnFor(job.stage) === 'prepress' && !proofApproved(job);
}

export type MoveResult =
  | { ok: true; stage: JobStage }
  | { ok: false; reason: string; missing: 'proof' | 'artwork' | 'order' };

/**
 * Move a job to a board column.
 *
 * THE PROOF GATE: a locked card cannot leave prepress, and the refusal names
 * what is missing rather than bouncing the card back with no explanation. A
 * silent bounce is the single worst thing a drag-and-drop board can do, because
 * the works is left guessing whether the app or their hand was at fault.
 */
export function moveJob(job: Job, to: BoardColumn): MoveResult {
  const from = columnFor(job.stage);
  if (from === to) return { ok: true, stage: job.stage };

  if (from === 'prepress' && !proofApproved(job)) {
    const sent = job.proofs.some((p) => p.kind === 'sent');
    return {
      ok: false,
      missing: 'proof',
      reason: sent ? 'gate.awaitingApproval' : 'gate.noProofSent',
    };
  }

  const stage: JobStage =
    to === 'prepress' ? 'approved' : to === 'ready' ? 'ready' : to === 'printing' ? 'printing' : 'finishing';
  return { ok: true, stage };
}

// ── materials ────────────────────────────────────────────────────────────────

export interface Consumption {
  /** What the imposition says the run needs. */
  imposedSheets: number;
  /** Sheets added by spoilage. */
  spoiledSheets: number;
  /** What actually comes off the shelf. */
  totalSheets: number;
  up: number;
  rotated: boolean;
  upIfNotRotated: number;
}

export function consumptionFor(job: Job): Consumption {
  const impos = imposition(job.trimWidthMm, job.trimHeightMm, job.quantity);
  return {
    imposedSheets: impos.sheets,
    spoiledSheets: job.spoiledSheets,
    totalSheets: impos.sheets + job.spoiledSheets,
    up: impos.up,
    rotated: impos.rotated,
    upIfNotRotated: impos.upIfNotRotated,
  };
}

/**
 * Record spoilage. This is the one staff action that changes a number the
 * customer never sees: the run takes more sheets, the shelf loses them, and the
 * quoted price does not move.
 */
export function recordSpoilage(job: Job, sheets: number): Job {
  if (!Number.isFinite(sheets) || sheets <= 0) return job;
  return { ...job, spoiledSheets: job.spoiledSheets + Math.floor(sheets) };
}

export interface StockRow {
  key: string;
  kind: 'sheet' | 'roll';
  /** Sheets for sheet stock; metres remaining for roll media. */
  onHand: number;
  reorderAt: number;
}

export interface StockLine extends StockRow {
  /** Committed to jobs that have not yet left the works. */
  committed: number;
  /** On hand minus committed. Can go negative — and says so rather than clamping. */
  spare: number;
  belowReorder: boolean;
}

/** What the Materials screen shows: on hand, committed to open jobs, and spare. */
export function stockLines(rows: readonly StockRow[], jobs: readonly Job[]): StockLine[] {
  const open = jobs.filter((j) => j.stage !== 'collected' && j.stage !== 'dispatched');

  return rows.map((row) => {
    const committed = open
      .filter((j) => j.materialKey === row.key)
      .reduce((sum, j) => sum + consumptionFor(j).totalSheets, 0);
    const spare = row.onHand - committed;
    return { ...row, committed, spare, belowReorder: spare < row.reorderAt };
  });
}

// ── due dates ────────────────────────────────────────────────────────────────

export type DueState = 'ahead' | 'due-soon' | 'due-today' | 'overdue';

/** Whole days between two ISO dates, without a local-timezone Date. */
export function daysBetween(fromIso: string, toIso: string): number {
  const parse = (iso: string): number => {
    const [y, m, d] = iso.split('-').map((n) => Number.parseInt(n, 10));
    return Date.UTC(y!, m! - 1, d!);
  };
  return Math.round((parse(toIso) - parse(fromIso)) / 86_400_000);
}

/**
 * How a job's due chip reads against the pinned clock. `--warn` at one working
 * day left, `--danger` and reading "overdue" past the promise.
 */
export function dueState(job: Job, todayIso: string): DueState {
  const days = daysBetween(todayIso, job.promisedFor);
  if (days < 0) return 'overdue';
  if (days === 0) return 'due-today';
  if (days === 1) return 'due-soon';
  return 'ahead';
}

export interface BoardKpis {
  dueToday: number;
  sheetsToday: number;
  waitingOnCustomer: number;
  overdue: number;
}

export function boardKpis(jobs: readonly Job[], todayIso: string): BoardKpis {
  const live = jobs.filter((j) => columnFor(j.stage) !== null);
  return {
    dueToday: live.filter((j) => dueState(j, todayIso) === 'due-today').length,
    sheetsToday: live
      .filter((j) => ['printing', 'finishing'].includes(columnFor(j.stage) ?? ''))
      .reduce((sum, j) => sum + consumptionFor(j).totalSheets, 0),
    waitingOnCustomer: live.filter((j) => isLocked(j)).length,
    overdue: live.filter((j) => dueState(j, todayIso) === 'overdue').length,
  };
}

/** The customer-facing stage strip, in order, with the current one marked. */
export const CUSTOMER_STAGES = [
  'received',
  'artwork-checked',
  'proof-sent',
  'approved',
  'printing',
  'finishing',
  'ready',
] as const;
export type CustomerStage = (typeof CUSTOMER_STAGES)[number];

export function customerStageIndex(job: Job): number {
  if (job.stage === 'ready' || job.stage === 'dispatched' || job.stage === 'collected') return 6;
  if (job.stage === 'finishing') return 5;
  if (job.stage === 'printing') return 4;
  if (proofApproved(job)) return 3;
  if (job.proofs.some((p) => p.kind === 'sent')) return 2;
  if (job.stage === 'prepress') return 1;
  return 0;
}
