#!/usr/bin/env node
// Writes db/seed.sql from the TypeScript seed, so the two can never drift.
//
//   node db/generate-seed.mjs        rewrite db/seed.sql
//   node db/generate-seed.mjs --check   fail if it is out of date, write nothing
//
// Everything the SQL says is READ from `src/data/demo.ts`, `src/lib/*.ts` and
// the en-US strings — the shop's fourteen live jobs, its four finished ones, its
// nine stock rows, its two saved quotes and its four artwork records, with every
// price put through `priceQuote()` rather than typed in by hand. Change the
// fiction in `demo.ts`, run this, and the database the Docker stack seeds still
// shows the works the app shows.
//
// Needs Node 22.18+ (it imports the app's `.ts` modules directly, which is also
// why it has no dependencies and no build step of its own).

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ARTWORK, CUSTOMERS, JOBS, NOW, PAST_JOBS, SAVED_QUOTES, STOCK } from '../src/data/demo.ts';
import { data } from '../src/i18n/strings/data.ts';
import { PRESET_SIZES, PRODUCTS, PRODUCT_BY_KEY } from '../src/lib/catalogue.ts';
import { consumptionFor } from '../src/lib/jobs.ts';
import { priceQuote } from '../src/lib/quote.ts';
import { MATERIAL_BY_KEY } from '../src/lib/rates.ts';

const DB_DIR = dirname(fileURLToPath(import.meta.url));
const OUT = join(DB_DIR, 'seed.sql');
const EN = data['en-US'];

/**
 * Marlow Press is in one town in one time zone, and every date in the fiction
 * falls between May and August 2026 — British Summer Time throughout. Writing
 * the offset rather than leaning on the container's TZ means the seed lands on
 * the same instant in a database that was set up somewhere else.
 */
const OFFSET = '+01';

/** The demo's customers predate its oldest job (19 May 2026) by a season. */
const CUSTOMERS_OPENED = '2026-04-02';

// ── SQL literals ─────────────────────────────────────────────────────────────

const str = (value) =>
  value === undefined || value === null ? 'NULL' : `'${String(value).replaceAll("'", "''")}'`;
const num = (value) => (value === undefined || value === null ? 'NULL' : String(value));
const bool = (value) => (value ? 'true' : 'false');
/** Cents to a numeric(12, 2) literal — the engine's integers, divided once. */
const money = (cents) => (cents / 100).toFixed(2);
const stamp = (isoDate, time) => `'${isoDate} ${time}:00${OFFSET}'`;
const json = (value) => `${str(JSON.stringify(value))}::jsonb`;

const row = (values) => `  (${values.join(', ')})`;
const insert = (table, columns, rows) =>
  `INSERT INTO ${table} (${columns.join(', ')}) VALUES\n${rows.join(',\n')};`;

// ── the fiction, indexed ─────────────────────────────────────────────────────

const ALL_JOBS = [...JOBS, ...PAST_JOBS];

const customerId = new Map(CUSTOMERS.map((c, i) => [c.key, i + 1]));
const productId = new Map(PRODUCTS.map((p, i) => [p.key, i + 1]));
const materialId = new Map(STOCK.map((s, i) => [s.key, i + 1]));
const jobId = new Map(ALL_JOBS.map((j, i) => [j.ref, i + 1]));

/**
 * The configuration a job was sold as, rebuilt from what the job records.
 *
 * A job stores its trim size in millimetres rather than a preset key, so the
 * preset is found by matching — and a size that matches nothing is a hard
 * error, because a job the configurator could not have produced is drift
 * between `demo.ts` and the catalogue rather than a row worth seeding.
 *
 * Two fields are not on a job at all: every job in the seed is collected from
 * the counter (all four finished ones were), and none of them paid for a proof
 * by post. Both are stated here rather than guessed per job.
 */
function configurationFor(job) {
  const product = PRODUCT_BY_KEY[job.productKey];
  const custom = product.sizes.includes('custom');
  const preset = PRESET_SIZES.find(
    (s) => s.widthMm === job.trimWidthMm && s.heightMm === job.trimHeightMm,
  );

  if (!custom && (preset === undefined || !product.sizes.includes(preset.key))) {
    throw new Error(
      `${job.ref}: ${job.trimWidthMm} × ${job.trimHeightMm}mm is not a size ${job.productKey} offers`,
    );
  }

  return {
    product: job.productKey,
    material: job.materialKey,
    size: custom ? 'custom' : preset.key,
    ...(custom ? { customWidthMm: job.trimWidthMm, customHeightMm: job.trimHeightMm } : {}),
    sides: job.sides,
    finish: job.finishKey,
    quantity: job.quantity,
    packaging: job.packagingKey,
    printedProof: false,
    express: job.express,
    delivery: 'collection',
  };
}

/** What the works quoted, ex nothing: the engine's total, tax included. */
function totalFor(config, label) {
  const quote = priceQuote(config);
  if (quote.blocked.length > 0) {
    throw new Error(`${label}: the engine refuses to price it — ${quote.blocked[0].limit}`);
  }
  return quote.totalCents;
}

const dated = (job, kinds) =>
  job.proofs.filter((p) => kinds.includes(p.kind)).map((p) => p.at);

/** The day the works took the order: its first proof, or yesterday if none. */
function createdOn(job) {
  const first = job.proofs[0]?.at;
  if (first !== undefined) return first;
  const day = new Date(`${NOW.iso}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() - 1);
  return day.toISOString().slice(0, 10);
}

/** The last thing the demo records about the job. */
function updatedOn(job) {
  return job.dispatch?.at ?? job.proofs.at(-1)?.at ?? createdOn(job);
}

// ── the statements ───────────────────────────────────────────────────────────

const parts = [];

parts.push(
  insert(
    'customers',
    ['id', 'name', 'email', 'town', 'created_at'],
    CUSTOMERS.map((c) =>
      row([
        num(customerId.get(c.key)),
        str(c.name),
        str(c.email),
        str(c.town),
        stamp(CUSTOMERS_OPENED, '09:00'),
      ]),
    ),
  ),
);

parts.push(
  insert(
    'products',
    ['id', 'key', 'name', 'family', 'from_quantity', 'sides_choice'],
    PRODUCTS.map((p) =>
      row([
        num(productId.get(p.key)),
        str(p.key),
        str(EN[`data.product.${p.key}`]),
        str(p.family),
        num(p.fromQuantity),
        bool(p.sidesChoice),
      ]),
    ),
  ),
);

parts.push(
  insert(
    'materials',
    ['id', 'key', 'name', 'kind', 'gsm', 'sheet_cost', 'on_hand', 'reorder_at'],
    STOCK.map((s) => {
      const rated = MATERIAL_BY_KEY[s.key];
      // `silk-350-sra2` is stock the works keeps for hand-fed work and the
      // configurator never quotes, so it is not on the rate card. An SRA2 sheet
      // is two SRA3s, which is the only defensible cost to put against it.
      const sheetCost = rated?.rateCents ?? MATERIAL_BY_KEY['silk-350'].rateCents * 2;
      const gsm = rated?.gsm ?? 350;
      return row([
        num(materialId.get(s.key)),
        str(s.key),
        str(EN[`data.material.${s.key}`]),
        str(s.kind),
        // Vinyl is sold by the sheet or the metre, never by grammage — the rate
        // card carries 0 for it, and 0 g/m² is not a weight.
        num(gsm > 0 ? gsm : null),
        money(sheetCost),
        num(s.onHand),
        num(s.reorderAt),
      ]);
    }),
  ),
);

parts.push(
  insert(
    'quotes',
    ['id', 'ref', 'customer_id', 'label', 'configuration', 'total', 'saved_on', 'created_at'],
    SAVED_QUOTES.map((q, i) =>
      row([
        num(i + 1),
        str(q.ref),
        num(customerId.get(q.customerKey)),
        str(q.label),
        json(q.config),
        money(totalFor(q.config, q.ref)),
        str(q.savedOn),
        stamp(q.savedOn, '11:00'),
      ]),
    ),
  ),
);

parts.push(
  insert(
    'jobs',
    [
      'id',
      'ref',
      'customer_id',
      'product_id',
      'material_id',
      'quantity',
      'trim_width_mm',
      'trim_height_mm',
      'sides',
      'finish_key',
      'packaging_key',
      'stage',
      'promised_for',
      'express',
      'spoiled_sheets',
      'total',
      'created_at',
      'updated_at',
    ],
    ALL_JOBS.map((job) =>
      row([
        num(jobId.get(job.ref)),
        str(job.ref),
        num(customerId.get(job.customer)),
        num(productId.get(job.productKey)),
        num(materialId.get(job.materialKey)),
        num(job.quantity),
        num(job.trimWidthMm),
        num(job.trimHeightMm),
        num(job.sides),
        str(job.finishKey),
        str(job.packagingKey),
        str(job.stage),
        str(job.promisedFor),
        bool(job.express),
        num(job.spoiledSheets),
        money(totalFor(configurationFor(job), job.ref)),
        stamp(createdOn(job), '09:00'),
        stamp(updatedOn(job), '16:30'),
      ]),
    ),
  ),
);

parts.push(
  insert(
    'artwork',
    [
      'id',
      'job_id',
      'filename',
      'file',
      'width_px',
      'height_px',
      'width_mm',
      'height_mm',
      'bleed_mm',
      'nearest_ink_mm',
      'colour_space',
      'fonts_embedded',
      'pages',
      'source',
      'created_at',
    ],
    ARTWORK.map((a, i) => {
      const job = ALL_JOBS.find((j) => j.ref === a.jobRef);
      if (job === undefined) throw new Error(`artwork for an unknown job: ${a.jobRef}`);
      return row([
        num(i + 1),
        num(jobId.get(a.jobRef)),
        str(a.filename),
        // The demo ships no binaries: fifteen bytes stand in for the customer's
        // PDF so the column can be NOT NULL, as the manifest says it is. Every
        // number beside it is real — those are what the checks measured.
        String.raw`convert_to(e'%PDF-1.7\n%%EOF\n', 'UTF8')`,
        num(a.widthPx),
        num(a.heightPx),
        num(a.widthMm),
        num(a.heightMm),
        num(a.bleedMm),
        num(a.nearestInkMm),
        str(a.colourSpace),
        bool(a.fontsEmbedded),
        num(a.pages),
        str(a.source),
        stamp(createdOn(job), '09:30'),
      ]);
    }),
  ),
);

let proofSeq = 0;
parts.push(
  insert(
    'proofs',
    ['id', 'job_id', 'kind', 'note', 'at'],
    ALL_JOBS.flatMap((job) =>
      job.proofs.map((p) =>
        row([num(++proofSeq), num(jobId.get(job.ref)), str(p.kind), str(p.note), str(p.at)]),
      ),
    ),
  ),
);

let dispatchSeq = 0;
parts.push(
  insert(
    'dispatches',
    ['id', 'job_id', 'kind', 'tracking', 'at'],
    ALL_JOBS.filter((j) => j.dispatch !== undefined).map((job) =>
      row([
        num(++dispatchSeq),
        num(jobId.get(job.ref)),
        str(job.dispatch.kind),
        str(job.dispatch.tracking),
        stamp(job.dispatch.at, '16:30'),
      ]),
    ),
  ),
);

/**
 * The shelf ledger.
 *
 * A job only appears here once it has actually been on the press — approving
 * the proof is what releases it, so that is the date the sheets came off the
 * shelf. `sheets` counts press sheets for sheet stock and METRES off the roll
 * for roll media, exactly as `materials.on_hand` does (`StockRow` in
 * `lib/jobs.ts` says so in as many words), because a 900 × 2000mm banner does
 * not impose onto an SRA3 sheet at all.
 *
 * The three deliveries are the only rows in this file with no counterpart in
 * `demo.ts`: without them the ledger only ever runs one way, and `delivery` is
 * a third of the enum the manifest declares.
 */
const ON_PRESS = ['printing', 'finishing', 'ready', 'dispatched', 'collected'];
const DELIVERIES = [
  { material: 'silk-170', sheets: 500, on: '2026-07-28' },
  { material: 'silk-130', sheets: 1000, on: '2026-07-31' },
  { material: 'silk-350', sheets: 250, on: '2026-08-03' },
];

let movementSeq = 0;
const movements = [];

for (const job of ALL_JOBS) {
  if (!ON_PRESS.includes(job.stage)) continue;
  const approved = job.proofs.find((p) => p.kind === 'approved')?.at;
  if (approved === undefined) {
    throw new Error(`${job.ref} reached ${job.stage} with no approved proof`);
  }

  const { imposedSheets, spoiledSheets } = consumptionFor(job);
  // Zero imposed sheets means the piece is bigger than a press sheet: large
  // format, metered off the roll by the length axis instead.
  const consumed =
    imposedSheets > 0 ? imposedSheets : Math.ceil((job.trimHeightMm * job.quantity) / 1000);

  movements.push(
    row([
      num(++movementSeq),
      num(materialId.get(job.materialKey)),
      num(jobId.get(job.ref)),
      str('consumed'),
      num(consumed),
      stamp(approved, '08:30'),
    ]),
  );

  if (spoiledSheets > 0) {
    movements.push(
      row([
        num(++movementSeq),
        num(materialId.get(job.materialKey)),
        num(jobId.get(job.ref)),
        str('spoilage'),
        num(spoiledSheets),
        stamp(approved, '14:00'),
      ]),
    );
  }
}

for (const delivery of DELIVERIES) {
  movements.push(
    row([
      num(++movementSeq),
      num(materialId.get(delivery.material)),
      'NULL',
      str('delivery'),
      num(delivery.sheets),
      stamp(delivery.on, '07:45'),
    ]),
  );
}

parts.push(
  insert('stock_movements', ['id', 'material_id', 'job_id', 'kind', 'sheets', 'at'], movements),
);

// Every id above is written out, so each sequence has to be moved past what the
// seed laid down or the first row anybody adds collides with a demo row.
const TABLES = [
  'customers',
  'products',
  'materials',
  'quotes',
  'jobs',
  'artwork',
  'proofs',
  'dispatches',
  'stock_movements',
];
parts.push(
  `DO $$
DECLARE
  seeded text;
BEGIN
  FOREACH seeded IN ARRAY ARRAY[${TABLES.map((t) => `'${t}'`).join(', ')}] LOOP
    EXECUTE format(
      'SELECT setval(pg_get_serial_sequence(%L, ''id''), (SELECT max(id) FROM %I))',
      seeded, seeded);
  END LOOP;
END $$;`,
);

// ── the file ─────────────────────────────────────────────────────────────────

const HEADER = `-- Print Shop — seed data. GENERATED; do not edit by hand.
--
-- Mirrors src/data/demo.ts row for row: the same seven customers, the same
-- fourteen live jobs MP-4113…MP-4126 and four finished ones, the same nine
-- stock rows with pvc-510 under its reorder point, the same two saved quotes
-- and the same four artwork records — including the letterhead with ink 1.8mm
-- from the trim. Run the app and the generated Adminium dashboard side by side
-- and they show the same Wednesday: the same overdue MP-4118, the same two jobs
-- locked with no proof sent.
--
-- Every price here came out of \`priceQuote()\` rather than a keyboard, at
-- collection and with no printed proof, which is how all eighteen were sold.
-- \`total\` is the figure the customer was quoted, tax included.
--
-- Regenerate with:  node db/generate-seed.mjs
--
-- Three sets of values have no counterpart in demo.ts, because the manifest's
-- schema carries columns the TypeScript seed does not: the timestamps
-- (\`created_at\` is the day a job's first proof went out, or the day before the
-- pinned clock for a job that has none; \`updated_at\` is the last thing the demo
-- records about it), the fifteen-byte placeholder standing in for each artwork
-- file, and three stock deliveries. All three are derived in
-- db/generate-seed.mjs, where the rules are written down.

BEGIN;
`;

const sql = `${HEADER}\n${parts.join('\n\n')}\n\nCOMMIT;\n`;

if (process.argv.includes('--check')) {
  const current = readFileSync(OUT, 'utf8');
  if (current !== sql) {
    console.error('✗ db/seed.sql is out of date. Regenerate it:  node db/generate-seed.mjs');
    process.exit(1);
  }
  console.log('✓ db/seed.sql matches src/data/demo.ts');
} else {
  writeFileSync(OUT, sql);
  const rows = sql.match(/^ {2}\(/gm)?.length ?? 0;
  console.log(`✓ wrote db/seed.sql — ${rows} rows across ${TABLES.length} tables`);
}
