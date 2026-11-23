/*
 * VENDORED VERBATIM from packages/manifest/src/landing.ts.
 * Never hand-edit this copy: change the monorepo package and re-run
 * `node scripts/sync-manifest-validator.mjs`.
 *
 * WHY A COPY. `@adminium/manifest` is not published to npm and this app is a
 * standalone repo that must build from a clean clone, so it cannot depend on
 * the monorepo. It lives under `testing/` because `zod` is a devDependency
 * here and a runtime dependency the host does not carry — nothing in
 * the shipped bundle's import graph may reach it, which sources.test.ts gates.
 *
 * The only edits are import specifiers: `.js` becomes `.ts`, and the
 * `@adminium/add-on-contracts` package import becomes relative ones.
 */
/**
 * LANDING: THE ADD-ON BLOCK'S `landing` WORD.
 *
 * A landing pages add-on names which of its own tables hold its pages and its
 * funnels:
 *
 * ```json
 * "addOn": { "landing": { "pages": "pages", "funnels": "funnels" } }
 * ```
 *
 * (`addOn.pages` is another word: the add-on's own staff screens.)
 *
 * The engine draws every live page for a stranger (no add-on code runs for
 * one) and reads the funnels' steps, so each table must have the columns the
 * engine reads, by these names and of these kinds ({@link LANDING_COLUMNS}),
 * and a numbered key (a funnel's step and a page's link name a page by it).
 * Staff write both tables through the add-on's screens, so roles and grants
 * may write them; the engine seals the columns that publish a page (its
 * state, its published copy and when it was published) in its own write
 * service. No public entry of the add-on opens either table: strangers are
 * served by the engine alone.
 *
 * A package declares one stranger's door: `landing` beside `forms` or `chat`
 * is refused, since each door is vouched for, and its rows kept, per package.
 *
 * Pure: no I/O, and nothing imported from the manifest's own schema file, so
 * that file may import this one.
 */
import { z } from 'zod';

import { contractColumnIssues, contractColumns, type ContractColumn, type FormsAddOnShape } from './forms.ts';
import { refSchema, type ReferenceIssue } from './refs.ts';

/** The block: the add-on's own tables, by ref. Both are required. */
export const addOnLandingSchema = z
  .object({
    pages: refSchema,
    funnels: refSchema,
  })
  .strict();
export type AddOnLanding = z.infer<typeof addOnLandingSchema>;

/** The two parts a landing block names. */
export type LandingPart = keyof AddOnLanding;
export const LANDING_PARTS = ['pages', 'funnels'] as const satisfies readonly LandingPart[];

/** The category a package that declares landing pages is filed under. */
export const LANDING_CATEGORY = 'marketing';

/** What one column of a landing table must be. */
export type LandingColumn = ContractColumn<LandingPart>;

/** Where a page stands: being written, served to strangers, or switched off. */
export const LANDING_STATES = ['draft', 'live', 'off'] as const;
/** The longest a page's slug is (the landing slug rule in `@adminium/add-on-contracts/landing`). */
export const LANDING_SLUG_MAX = 80;
/** The most steps one funnel has. */
export const LANDING_FUNNEL_STEPS_MAX = 8;

const { text, moment, json, choice } = contractColumns;

/**
 * The columns each part has, which the engine reads (and, for a page's
 * publish columns, seals) by these names. A table may have more of its own,
 * each nullable, with a default, decided by a rule, or a moment its role
 * stamps (`created_at`, `updated_at`): nothing else the engine writes fills it.
 */
export const LANDING_COLUMNS: Readonly<Record<LandingPart, Readonly<Record<string, LandingColumn>>>> = {
  pages: {
    /** Staff's own name for the page, never shown to a stranger. */
    name: text(200),
    /** The last part of its address (`/x/pages/<slug>`). */
    slug: text(LANDING_SLUG_MAX),
    state: choice(LANDING_STATES),
    /** The one language the page is written in. */
    language: text(10),
    /** The page document staff are working on; it may carry the assistant's marks. */
    draft: json(),
    /** The page document frozen at publish: strangers are served only this, and it never carries a mark. */
    published: json(true),
    /** When the published copy was written, set by the engine. */
    published_at: moment(true),
    updated_at: moment(),
  },
  funnels: {
    name: text(200),
    /** `[{ "kind": "page" | "form", "key": "…" }]`, at most eight, each naming a row by its key. */
    steps: json(),
    /** The rule picked by hand as what happens after the funnel. */
    rule_id: text(64, true),
  },
};

/** What the checks read of the add-on beside its landing block. */
export interface LandingAddOnShape extends FormsAddOnShape {
  /** Whether the add-on declares forms too. */
  forms?: boolean | undefined;
  /** Whether the add-on declares chat too. */
  chat?: boolean | undefined;
}

/**
 * Whether Adminium writes a column on every create by its role: a moment
 * (a time or a date) whose role is `created_at` or `updated_at` is stamped
 * with the moment its row is made, and an `updated_at` again at each change,
 * through every door (the kit's writes included). A role on any other type
 * stamps nothing.
 */
function stampedByRole(column: { type: string; role?: string | undefined }): boolean {
  return (column.role === 'created_at' || column.role === 'updated_at') && (column.type === 'timestamptz' || column.type === 'date');
}

/** Everything wrong with an add-on's landing block, against its own tables and entries. */
export function landingBlockIssues(block: AddOnLanding, m: LandingAddOnShape): ReferenceIssue[] {
  const out: ReferenceIssue[] = [];
  const tables = new Map(m.tables.map((table, t) => [table.ref, { table, t }]));
  const at = (...rest: (string | number)[]) => ['addOn', 'landing', ...rest];

  if (!m.categories.includes(LANDING_CATEGORY)) out.push({ path: ['categories'], message: `an add-on that declares landing pages is filed under the "${LANDING_CATEGORY}" category` });
  // Each door is vouched for, and its rows kept, per package: one package with two would mix them.
  if (m.forms === true) out.push({ path: at(), message: 'an add-on declares landing pages or forms, not both: each is a package of its own' });
  if (m.chat === true) out.push({ path: at(), message: 'an add-on declares landing pages or chat, not both: each is a package of its own' });

  const seen = new Map<string, LandingPart>();
  for (const part of LANDING_PARTS) {
    const ref = block[part];
    const other = seen.get(ref);
    if (other !== undefined) out.push({ path: at(part), message: `"${ref}" holds the ${other} already: each part of landing is a table of its own` });
    seen.set(ref, part);
  }

  for (const part of LANDING_PARTS) {
    const ref = block[part];
    const found = tables.get(ref);
    if (found === undefined) {
      out.push({ path: at(part), message: `"${ref}" is not one of this add-on's tables` });
      continue;
    }
    const { table, t } = found;
    const contract = LANDING_COLUMNS[part];
    out.push(...contractColumnIssues(table, t, `the ${part}`, contract, (to) => block[to]));

    // A numbered key: a funnel's step and a page's link name a row by it.
    const k = table.columns.findIndex((column) => column.role === 'pk');
    const key = table.columns[k];
    if (key === undefined) out.push({ path: at(part), message: `"${ref}" holds the ${part}, so its rows are numbered: give it an int key (role "pk")` });
    else if (key.type !== 'int' && key.type !== 'bigint') out.push({ path: ['requiredSchema', 'tables', t, 'columns', k, 'type'], message: `"${ref}" holds the ${part}, so its rows are numbered: its key "${key.ref}" is an int or a bigint, not ${key.type}` });

    // Every other column is one a write may leave out: nothing the engine writes fills it, but for a moment it stamps.
    table.columns.forEach((column, c) => {
      if (contract[column.ref] !== undefined || column.role === 'pk' || column.nullable === true || column.default !== undefined || m.decided?.(ref, column.ref) === true) return;
      if (stampedByRole(column)) return;
      out.push({ path: ['requiredSchema', 'tables', t, 'columns', c], message: `"${ref}" holds the ${part}, and Adminium never fills "${column.ref}": make it nullable or give it a default` });
    });

    // The engine serves a stranger a live page and nothing else: no public entry of the add-on opens a landing table.
    (m.publicAccess ?? []).forEach((entry, e) => {
      if (entry.table === ref) out.push({ path: ['publicAccess', e, 'table'], message: `"${ref}" holds the ${part}, which Adminium alone serves to strangers: no public entry opens it` });
    });
  }
  return out;
}
