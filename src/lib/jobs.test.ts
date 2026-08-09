/**
 * The works engine. The two imposition figures asserted here are the ones the
 * plan, the comp and the job ticket all quote — 21 up / 24 sheets, and 6 up
 * rotated against 4 up upright / 42 sheets (24 acceptance criterion 2).
 */
import { describe, expect, it } from 'vitest';

import {
  boardKpis,
  columnFor,
  consumptionFor,
  customerStageIndex,
  daysBetween,
  dueState,
  imposition,
  isLocked,
  moveJob,
  proofApproved,
  recordSpoilage,
  stockLines,
  type Job,
  type StockRow,
} from './jobs.ts';

const TODAY = '2026-08-05';

function job(over: Partial<Job> = {}): Job {
  return {
    ref: 'MP-4101',
    productKey: 'business-cards',
    materialKey: 'silk-350',
    customer: 'Harbour Bakery',
    quantity: 500,
    trimWidthMm: 85,
    trimHeightMm: 55,
    sides: 2,
    finishKey: 'matt-lam',
    packagingKey: 'boxed',
    stage: 'prepress',
    promisedFor: '2026-08-10',
    express: false,
    proofs: [],
    spoiledSheets: 0,
    ...over,
  };
}

describe('imposition', () => {
  it('puts 21 business cards on an SRA3 sheet, upright', () => {
    // 85 × 55 + 3mm bleed all round = 91 × 61.
    // Upright: floor(310/91) × floor(440/61) = 3 × 7 = 21.
    // Turned:  floor(310/61) × floor(440/91) = 5 × 4 = 20.
    const impos = imposition(85, 55, 500);
    expect(impos.up).toBe(21);
    expect(impos.rotated).toBe(false);
    expect(impos.sheets).toBe(24);
  });

  it('turns an A6 flyer on the sheet, winning 6 up against 4', () => {
    // 105 × 148 + 3mm = 111 × 154.
    // Upright: floor(310/111) × floor(440/154) = 2 × 2 = 4.
    // Turned:  floor(310/154) × floor(440/111) = 2 × 3 = 6.
    const impos = imposition(105, 148, 250);
    expect(impos.up).toBe(6);
    expect(impos.rotated).toBe(true);
    expect(impos.upIfNotRotated).toBe(4);
    expect(impos.sheets).toBe(42);
  });

  it('counts bleed against the sheet, not just the trim size', () => {
    // Without bleed a 155 × 220 piece would go 2 up; with it, it does not.
    expect(imposition(155, 220, 10).up).toBeLessThan(imposition(149, 214, 10).up);
  });

  it('returns zero rather than dividing by it when a piece is bigger than the sheet', () => {
    const impos = imposition(900, 1200, 5);
    expect(impos.up).toBe(0);
    expect(impos.sheets).toBe(0);
  });

  it('rounds part sheets up — you cannot print 23.8 sheets', () => {
    expect(imposition(85, 55, 1).sheets).toBe(1);
    expect(imposition(85, 55, 22).sheets).toBe(2);
  });
});

describe('the proof gate', () => {
  it('locks a prepress job whose proof is not approved', () => {
    expect(isLocked(job())).toBe(true);
    expect(isLocked(job({ proofs: [{ kind: 'sent', at: TODAY }] }))).toBe(true);
    expect(isLocked(job({ proofs: [{ kind: 'approved', at: TODAY }] }))).toBe(false);
  });

  it('refuses to move a locked card out of prepress, NAMING what is missing', () => {
    const result = moveJob(job(), 'printing');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.missing).toBe('proof');
      expect(result.reason).toBe('gate.noProofSent');
    }
  });

  it('distinguishes "no proof sent" from "waiting on the customer"', () => {
    const waiting = moveJob(job({ proofs: [{ kind: 'sent', at: TODAY }] }), 'printing');
    expect(waiting.ok).toBe(false);
    if (!waiting.ok) expect(waiting.reason).toBe('gate.awaitingApproval');
  });

  it('lets an approved job through', () => {
    const approved = job({ proofs: [{ kind: 'approved', at: TODAY }] });
    expect(proofApproved(approved)).toBe(true);
    const result = moveJob(approved, 'printing');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.stage).toBe('printing');
  });

  it('never gates a move that does not leave prepress', () => {
    expect(moveJob(job({ stage: 'printing' }), 'finishing').ok).toBe(true);
    expect(moveJob(job({ stage: 'finishing' }), 'ready').ok).toBe(true);
  });

  it('treats a move to the column it is already in as a no-op, not a refusal', () => {
    expect(moveJob(job(), 'prepress').ok).toBe(true);
  });
});

describe('the board columns', () => {
  it('maps every live stage to one of the four columns', () => {
    expect(columnFor('ordered')).toBe('prepress');
    expect(columnFor('proofed')).toBe('prepress');
    expect(columnFor('approved')).toBe('prepress');
    expect(columnFor('printing')).toBe('printing');
    expect(columnFor('finishing')).toBe('finishing');
    expect(columnFor('ready')).toBe('ready');
  });

  it('keeps quoted and finished jobs off the board entirely', () => {
    expect(columnFor('quoted')).toBeNull();
    expect(columnFor('collected')).toBeNull();
    expect(columnFor('dispatched')).toBeNull();
  });
});

describe('spoilage', () => {
  it('adds sheets to the run without touching the quoted quantity', () => {
    const before = consumptionFor(job());
    const after = consumptionFor(recordSpoilage(job(), 3));
    expect(before.imposedSheets).toBe(24);
    expect(after.imposedSheets).toBe(24);
    expect(after.totalSheets).toBe(27);
  });

  it('accumulates across several recordings', () => {
    let j = job();
    j = recordSpoilage(j, 2);
    j = recordSpoilage(j, 5);
    expect(consumptionFor(j).totalSheets).toBe(31);
  });

  it('ignores a nonsense figure rather than corrupting the run', () => {
    expect(recordSpoilage(job(), 0).spoiledSheets).toBe(0);
    expect(recordSpoilage(job(), -4).spoiledSheets).toBe(0);
    expect(recordSpoilage(job(), Number.NaN).spoiledSheets).toBe(0);
  });

  it('does not mutate the job it was given', () => {
    const original = job();
    recordSpoilage(original, 10);
    expect(original.spoiledSheets).toBe(0);
  });
});

describe('materials', () => {
  const ROWS: StockRow[] = [
    { key: 'silk-350', kind: 'sheet', onHand: 260, reorderAt: 60 },
    { key: 'silk-130', kind: 'sheet', onHand: 900, reorderAt: 200 },
    { key: 'pvc-510', kind: 'roll', onHand: 18, reorderAt: 25 },
  ];

  it('commits open jobs against the shelf and leaves the rest spare', () => {
    const lines = stockLines(ROWS, [job(), job({ ref: 'MP-4102' })]);
    const silk = lines.find((l) => l.key === 'silk-350')!;
    expect(silk.committed).toBe(48); // two 24-sheet runs
    expect(silk.spare).toBe(212);
  });

  it('does not commit jobs that have already left the works', () => {
    const lines = stockLines(ROWS, [job({ stage: 'collected' }), job({ stage: 'dispatched' })]);
    expect(lines.find((l) => l.key === 'silk-350')!.committed).toBe(0);
  });

  it('counts spoilage against the shelf too', () => {
    const lines = stockLines(ROWS, [recordSpoilage(job(), 6)]);
    expect(lines.find((l) => l.key === 'silk-350')!.committed).toBe(30);
  });

  it('flags a row under its reorder point', () => {
    const lines = stockLines(ROWS, []);
    expect(lines.find((l) => l.key === 'pvc-510')!.belowReorder).toBe(true);
    expect(lines.find((l) => l.key === 'silk-130')!.belowReorder).toBe(false);
  });

  it('lets spare go negative rather than clamping a shortfall out of sight', () => {
    const heavy = Array.from({ length: 12 }, (_, i) => job({ ref: `MP-42${i}` }));
    const lines = stockLines(ROWS, heavy);
    expect(lines.find((l) => l.key === 'silk-350')!.spare).toBeLessThan(0);
  });
});

describe('due dates', () => {
  it('counts whole days between two ISO dates', () => {
    expect(daysBetween('2026-08-05', '2026-08-10')).toBe(5);
    expect(daysBetween('2026-08-10', '2026-08-05')).toBe(-5);
  });

  it('escalates as the promise approaches and past it', () => {
    expect(dueState(job({ promisedFor: '2026-08-12' }), TODAY)).toBe('ahead');
    expect(dueState(job({ promisedFor: '2026-08-06' }), TODAY)).toBe('due-soon');
    expect(dueState(job({ promisedFor: '2026-08-05' }), TODAY)).toBe('due-today');
    expect(dueState(job({ promisedFor: '2026-08-04' }), TODAY)).toBe('overdue');
  });
});

describe('board KPIs', () => {
  const JOBS = [
    job({ ref: 'MP-4110', promisedFor: '2026-08-05', proofs: [{ kind: 'approved', at: TODAY }], stage: 'printing' }),
    job({ ref: 'MP-4111', promisedFor: '2026-08-04', proofs: [{ kind: 'approved', at: TODAY }], stage: 'finishing' }),
    job({ ref: 'MP-4112', promisedFor: '2026-08-11' }), // locked in prepress
    job({ ref: 'MP-4113', promisedFor: '2026-08-11', stage: 'collected' }),
  ];

  it('counts what is due today, overdue, and waiting on a customer', () => {
    const kpis = boardKpis(JOBS, TODAY);
    expect(kpis.dueToday).toBe(1);
    expect(kpis.overdue).toBe(1);
    expect(kpis.waitingOnCustomer).toBe(1);
  });

  it('counts sheets scheduled on the presses, not the whole board', () => {
    // Two 24-sheet runs are on the presses; the locked and collected jobs are not.
    expect(boardKpis(JOBS, TODAY).sheetsToday).toBe(48);
  });

  it('ignores jobs that have left the works', () => {
    expect(boardKpis([job({ stage: 'collected', promisedFor: '2026-08-01' })], TODAY).overdue).toBe(0);
  });
});

describe('the customer stage strip', () => {
  it('walks the seven stages in order as the job progresses', () => {
    expect(customerStageIndex(job({ stage: 'ordered' }))).toBe(0);
    expect(customerStageIndex(job({ stage: 'prepress' }))).toBe(1);
    expect(customerStageIndex(job({ stage: 'prepress', proofs: [{ kind: 'sent', at: TODAY }] }))).toBe(2);
    expect(
      customerStageIndex(job({ stage: 'prepress', proofs: [{ kind: 'approved', at: TODAY }] })),
    ).toBe(3);
    expect(customerStageIndex(job({ stage: 'printing' }))).toBe(4);
    expect(customerStageIndex(job({ stage: 'finishing' }))).toBe(5);
    expect(customerStageIndex(job({ stage: 'ready' }))).toBe(6);
  });

  it('keeps a dispatched or collected job at the last stage rather than resetting it', () => {
    expect(customerStageIndex(job({ stage: 'collected' }))).toBe(6);
    expect(customerStageIndex(job({ stage: 'dispatched' }))).toBe(6);
  });
});
