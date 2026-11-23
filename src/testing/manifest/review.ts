/*
 * VENDORED VERBATIM from packages/manifest/src/review.ts.
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
 * REVIEWS: A CUSTOMER'S WORD ON WHAT THEY BOUGHT, KEPT BY AN ADD-ON.
 *
 * The host says what a review is about — `review`, on the table of the rows
 * reviewed (a shipped order line, a visit): the add-on that keeps them, what
 * the row is about (a product, a service) and its name, when it may be
 * reviewed (the order shipped), whose review it is (the person the row's
 * claim reaches) and the column Adminium stamps when it is taken:
 *
 * ```json
 * "review": { "by": { "addOn": "forms" }, "needs": "reviews",
 *   "about": { "link": "product_id", "name": "product_name" },
 *   "when": { "path": ["order_id", "status"], "in": ["shipped"] },
 *   "person": ["order_id", "customer_id"],
 *   "shownName": { "first": "first_name", "last": "last_name" },
 *   "stamp": "reviewed_at" }
 * ```
 *
 * The add-on says where it keeps them — `addOn.reviews`: its `reviews` table
 * and its `totals` table, each held to the columns the engine writes
 * ({@link REVIEW_COLUMNS}, {@link REVIEW_TOTALS_COLUMNS}). Adminium writes
 * every review, from a session that reads the row, with the subject, the
 * about, the name shown and the person filled by the server; staff move a
 * review's state, give a reason to hide it, and reply. Adminium keeps the
 * totals of the published ones. Nobody deletes a review.
 *
 * Pure: no I/O, and nothing imported from the manifest's own schema file, so
 * that file may import this one.
 */
import { z } from 'zod';

import { contractColumns, contractColumnIssues, type ContractColumn, type FormsTableShape } from './forms.ts';
import { refSchema, scalarSchema, type ReferenceIssue } from './refs.ts';

const addOnKey = z.string().regex(/^[a-z][a-z0-9-]{1,79}$/, 'an add-on key');
const tableRef = z.string().regex(/^[a-z][a-z0-9_]*$/, 'a table ref');
/** Links then a column, or links alone: one to three steps. */
const pathSchema = z.array(refSchema).min(1).max(3);

/** A review's states, the reasons it is hidden for, and what staff change of one. */
export const REVIEW_STATES = ['waiting', 'published', 'hidden'] as const;
export const REVIEW_HIDE_REASONS = ['abusive', 'names-someone', 'not-about-us', 'looks-fake', 'author-asked'] as const;
/** The reasons every keeping add-on holds. The fifth, "the author asked", came later: an add-on released before it still fits. */
const REVIEW_HIDE_REASONS_FIRST = REVIEW_HIDE_REASONS.slice(0, 4);
export const REVIEW_STAFF_COLUMNS = ['state', 'hide_reason', 'reply'] as const;
/** The longest title and words a review takes. */
export const REVIEW_TITLE_MAX = 80;
export const REVIEW_BODY_MAX = 2_000;
/** The longest name a review shows ("Priya R."). */
export const REVIEW_SHOWN_NAME_MAX = 80;

// ── the host's word ──────────────────────────────────────────────────────────

export const reviewSchema = z
  .object({
    by: z.object({ addOn: addOnKey }).strict(),
    /** The word is live only while this feature's add-ons are there. */
    needs: z.string().regex(/^[a-z][a-z0-9-]{0,39}$/, 'a feature id').optional(),
    /** What the row is about: a link of this table, and the thing's name (and a second line) copied when the review is taken. */
    about: z
      .object({
        link: refSchema,
        name: z.union([refSchema, pathSchema]),
        detail: z.union([refSchema, pathSchema]).optional(),
      })
      .strict(),
    /** The row may be reviewed only while the value along `path` (links, then a column) is one of `in`. */
    when: z.object({ path: pathSchema, in: z.array(scalarSchema).min(1).max(16) }).strict(),
    /** The links from this row to the person whose review it is: the way the row's claim reaches them. */
    person: pathSchema,
    /**
     * The yes/no along this path (links, then a column) that says the person proved who they are when the row
     * was made: a guest's typed address proves nothing. With it, a row's own link may review only a proved row,
     * and is never told the name an unproved one would be shown with; a person signed in on their own row
     * always may. Without it, a row's own link may review any row its `when` allows.
     */
    proved: pathSchema.optional(),
    /** How the person's name is shown: first name and the last name's initial, or a whole name cut the same way. */
    shownName: z.union([z.object({ first: refSchema, last: refSchema.optional() }).strict(), z.object({ full: refSchema }).strict()]),
    /** The moment Adminium writes on the row when its review is taken. */
    stamp: refSchema,
  })
  .strict();
export type Review = z.infer<typeof reviewSchema>;

/** A path given as one column or as steps. */
export const pathOf = (path: string | readonly string[]): readonly string[] => (typeof path === 'string' ? [path] : path);

// ── the add-on's block ──────────────────────────────────────────────────────

export const addOnReviewsSchema = z.object({ reviews: tableRef, totals: tableRef }).strict();
export type AddOnReviews = z.infer<typeof addOnReviewsSchema>;

/** A text bounded at exactly `n`: part of a unique set, which MySQL builds only over bounded text. */
const exactly = (n: number, nullable?: true): ContractColumn<never> & { exactly: number } => ({ ...contractColumns.text(n, nullable), exactly: n });
const { text, moment, whole, choice } = contractColumns;

/** The columns of the reviews table, which Adminium reads and writes by these names. */
export const REVIEW_COLUMNS: Readonly<Record<string, ContractColumn<never> & { exactly?: number }>> = {
  app: exactly(64),
  subject_table: exactly(64),
  subject_key: exactly(200),
  about_table: text(64),
  about_key: text(200),
  about_name: text(200),
  about_detail: text(200, true),
  stars: whole(),
  title: text(REVIEW_TITLE_MAX, true),
  body: text(REVIEW_BODY_MAX, true),
  shown_name: text(REVIEW_SHOWN_NAME_MAX),
  state: choice(REVIEW_STATES),
  hide_reason: { ...choice(REVIEW_HIDE_REASONS_FIRST, true), mayAlso: ['author-asked'] },
  reply: text(REVIEW_BODY_MAX, true),
  replied_at: moment(true),
  submitted_at: moment(),
  person_table: text(64, true),
  person_key: text(200, true),
};

/** The columns of the totals table: one row per thing reviewed, and one for the whole app (its about empty). */
export const REVIEW_TOTALS_COLUMNS: Readonly<Record<string, ContractColumn<never> & { exactly?: number }>> = {
  app: exactly(64),
  about_table: exactly(64),
  about_key: exactly(200),
  count: whole(),
  sum: whole(),
  c1: whole(),
  c2: whole(),
  c3: whole(),
  c4: whole(),
  c5: whole(),
};

/** The unique set of each table: one review per reviewed row, one total per thing. */
export const REVIEW_UNIQUE = ['app', 'subject_table', 'subject_key'] as const;
export const REVIEW_TOTALS_UNIQUE = ['app', 'about_table', 'about_key'] as const;

/** What the block's checks read of a table, beside its columns. */
export interface ReviewTableShape extends FormsTableShape {
  unique?: readonly (readonly string[])[] | undefined;
  appGrants?: { actions: readonly string[]; writable?: readonly string[] | undefined; readable?: readonly string[] | undefined; appColumn?: string | undefined } | undefined;
}

/** What else of the add-on the block's checks read. */
export interface ReviewsAddOnShape {
  tables: readonly ReviewTableShape[];
  roles?: readonly { key: string; cloneFrom?: string | undefined; permissions?: readonly string[] | undefined }[] | undefined;
  publicAccess?: readonly { table: string; methods: readonly string[]; appColumn?: string | undefined; select?: readonly string[] | undefined; filters?: readonly unknown[] | undefined }[] | undefined;
  steps?: readonly { key: string; writes: { table: string } }[] | undefined;
}

/**
 * Everything wrong with an add-on's reviews block: its two tables, their
 * columns and unique sets; what an app's role and the add-on's own roles may
 * hold of them (an app's role reads and moderates its own app's reviews; the
 * add-on's roles hold nothing of them); no step writes them; a public entry
 * only reads them, held to its app.
 */
export function reviewsBlockIssues(block: AddOnReviews, m: ReviewsAddOnShape): ReferenceIssue[] {
  const out: ReferenceIssue[] = [];
  const at = (...rest: (string | number)[]) => ['addOn', 'reviews', ...rest];
  if (block.reviews === block.totals) out.push({ path: at('totals'), message: 'the reviews and their totals are two tables' });
  for (const [part, ref, contract, unique] of [
    ['reviews', block.reviews, REVIEW_COLUMNS, REVIEW_UNIQUE],
    ['totals', block.totals, REVIEW_TOTALS_COLUMNS, REVIEW_TOTALS_UNIQUE],
  ] as const) {
    const t = m.tables.findIndex((table) => table.ref === ref);
    const table = m.tables[t];
    if (table === undefined) {
      out.push({ path: at(part), message: `"${ref}" is not one of this add-on's tables` });
      continue;
    }
    const holds = part === 'reviews' ? 'the reviews' : 'the totals of the reviews';
    out.push(...contractColumnIssues(table, t, holds, contract, () => undefined));
    // The columns of the unique set: bounded, so the set builds on every engine.
    for (const [name, want] of Object.entries(contract)) {
      if (want.exactly === undefined) continue;
      const c = table.columns.findIndex((column) => column.ref === name);
      const column = table.columns[c];
      if (column !== undefined && column.type === 'text' && column.maxLength !== want.exactly) {
        out.push({ path: ['requiredSchema', 'tables', t, 'columns', c, 'maxLength'], message: `"${ref}.${name}" is part of a unique set, which MySQL builds only over bounded text: maxLength ${String(want.exactly)}` });
      }
    }
    const sets = table.unique ?? [];
    if (!sets.some((set) => set.length === unique.length && unique.every((column) => set.includes(column)))) {
      out.push({ path: ['requiredSchema', 'tables', t, 'unique'], message: `"${ref}" holds ${holds}, one a ${part === 'reviews' ? 'reviewed row' : 'thing'}: unique together ${unique.join(', ')}` });
    }
    // An app's role: reads, and on the reviews moderates (state, hide reason, reply), its own app's rows only.
    const grants = table.appGrants;
    if (grants !== undefined) {
      const allowed = part === 'reviews' ? ['read', 'update'] : ['read'];
      grants.actions.forEach((action, a) => {
        if (!allowed.includes(action)) out.push({ path: ['requiredSchema', 'tables', t, 'appGrants', 'actions', a], message: `an app's role may ${allowed.join(' and ')} "${ref}", never ${action}` });
      });
      (grants.writable ?? []).forEach((column, w) => {
        if (!(REVIEW_STAFF_COLUMNS as readonly string[]).includes(column)) out.push({ path: ['requiredSchema', 'tables', t, 'appGrants', 'writable', w], message: `staff change a review's ${REVIEW_STAFF_COLUMNS.join(', ')}, and Adminium the rest: "${column}" is not writable` });
      });
      if (grants.appColumn !== 'app') out.push({ path: ['requiredSchema', 'tables', t, 'appGrants', 'appColumn'], message: `"${ref}" is shared by every app it is attached to: its grants are held to the app's own rows ("appColumn": "app")` });
      if (part === 'reviews' && grants.readable === undefined) {
        out.push({ path: ['requiredSchema', 'tables', t, 'appGrants'], message: 'an app\'s role reads the columns a review shows staff, named in "readable": never whose a review is' });
      }
      if (part === 'reviews' && (grants.readable ?? []).some((column) => column === 'person_table' || column === 'person_key')) {
        out.push({ path: ['requiredSchema', 'tables', t, 'appGrants', 'readable'], message: 'whose a review is, is erasure\'s to read: person_table and person_key are not readable by an app\'s role' });
      }
    }
    // The add-on's own roles hold nothing of them: the moderators are the apps' roles and the workspace's.
    (m.roles ?? []).forEach((role, r) => {
      for (const grant of role.permissions ?? []) {
        const match = /^table:@([^:]+):([a-z_]+)$/.exec(grant);
        // A review is moderated by the apps' roles, each held to its own app; an add-on's role is held to none, so it holds nothing of them. The totals it may read.
        if (match !== null && (match[1] === ref || match[1] === '*') && (part === 'reviews' || match[2] !== 'read')) {
          out.push({ path: ['roles', r, 'permissions'], message: part === 'reviews' ? `"${role.key}" may ${match[2]!} "${ref}": the add-on's own roles hold nothing of the reviews, which each app's own roles read and moderate` : `"${role.key}" may ${match[2]!} "${ref}": the add-on's own roles only read ${holds}` });
        }
      }
    });
    (m.steps ?? []).forEach((step, s) => {
      if (step.writes.table === ref) out.push({ path: ['addOn', 'steps', s, 'writes', 'table'], message: `Adminium alone writes ${holds}: the step "${step.key}" may not write a row of "${ref}"` });
    });
    (m.publicAccess ?? []).forEach((entry, e) => {
      if (entry.table !== ref) return;
      if (entry.methods.some((method) => method !== 'GET')) out.push({ path: ['publicAccess', e, 'methods'], message: `"${ref}" holds ${holds}, which a stranger only reads: Adminium takes a review through the app's own review word` });
      if (entry.appColumn !== 'app') out.push({ path: ['publicAccess', e, 'appColumn'], message: `"${ref}" holds every app's ${part}: an entry on it is held to its app ("appColumn": "app")` });
      if (part === 'reviews') {
        // A stranger reads published reviews, and never whose they are, the row reviewed, or why one was hidden.
        const published = (entry.filters ?? []).some((filter) => {
          const f = filter as { column?: unknown; op?: unknown; value?: unknown };
          return f.column === 'state' && f.op === 'eq' && f.value === 'published';
        });
        if (!published) out.push({ path: ['publicAccess', e, 'filters'], message: `a stranger reads the published reviews only: a fixed filter "state" eq "published"` });
        const hidden = ['person_table', 'person_key', 'subject_table', 'subject_key', 'hide_reason'];
        if (entry.select === undefined) out.push({ path: ['publicAccess', e, 'select'], message: `an entry on "${ref}" names what it shows: never ${hidden.join(', ')}` });
        else {
          const shown = entry.select.filter((column) => hidden.includes(column));
          if (shown.length > 0) out.push({ path: ['publicAccess', e, 'select'], message: `a stranger never reads ${shown.join(', ')} of a review` });
        }
      }
    });
  }
  return out;
}

// ── what one manifest can check of the host's word ─────────────────────────

/** What the host's checks read of a table. */
export interface ReviewHostTableShape {
  ref: string;
  columns: readonly { ref: string; type: string; role?: string | undefined; nullable?: boolean | undefined; references?: string | undefined }[];
}

/** What the host's checks read of an entry: how a person reaches the rows. */
export interface ReviewHostEntryShape {
  table: string;
  key?: string | undefined;
  methods: readonly string[];
  writable?: readonly string[] | undefined;
  writableValues?: Readonly<Record<string, unknown>> | undefined;
  defaults?: Readonly<Record<string, unknown>> | undefined;
  claimedBy?: { table: string; column: string } | undefined;
  visibleWith?: { table: string; via: string } | undefined;
  children?: Readonly<Record<string, { writable: readonly string[]; writableValues?: Readonly<Record<string, unknown>> | undefined; defaults?: Readonly<Record<string, unknown>> | undefined; children?: unknown }>> | undefined;
}

/**
 * The ways the app's entries reach a person from a row of `table`: a
 * person's own rows (`claimedBy`), or rows seen with a parent that is one
 * (`visibleWith`, then the parent's `claimedBy`). Each is the path of links
 * from the row to the person's row, and the person's table.
 */
export function claimChains(table: string, entries: readonly ReviewHostEntryShape[]): { path: readonly string[]; people: string }[] {
  const out: { path: readonly string[]; people: string }[] = [];
  const add = (path: readonly string[], people: string) => {
    if (!out.some((chain) => chain.people === people && chain.path.join('.') === path.join('.'))) out.push({ path, people });
  };
  for (const entry of entries) {
    if (entry.table !== table) continue;
    if (entry.claimedBy !== undefined) add([entry.claimedBy.column], entry.claimedBy.table);
    const parent = entry.visibleWith;
    if (parent !== undefined) {
      for (const up of entries) {
        if (up.table === parent.table && up.claimedBy !== undefined) add([parent.via, up.claimedBy.column], up.claimedBy.table);
      }
    }
  }
  return out;
}

/** Everything wrong with a table's review word that this manifest can see. */
export function reviewIssues(
  table: ReviewHostTableShape,
  review: Review,
  ctx: {
    kind: 'app' | 'add-on';
    tables: ReadonlyMap<string, ReviewHostTableShape>;
    named: ReadonlySet<string>;
    features: ReadonlyMap<string, readonly string[]>;
    entries: readonly ReviewHostEntryShape[];
  },
  at: (...rest: (string | number)[]) => (string | number)[],
): ReferenceIssue[] {
  const out: ReferenceIssue[] = [];
  const here = (...rest: (string | number)[]) => at('review', ...rest);
  const column = (of: ReviewHostTableShape | undefined, ref: string) => of?.columns.find((candidate) => candidate.ref === ref);

  if (ctx.kind !== 'app') out.push({ path: here(), message: "an app's rows are reviewed: an add-on's own tables carry no review word" });
  else if (!ctx.named.has(review.by.addOn)) out.push({ path: here('by', 'addOn'), message: `"${review.by.addOn}" is not an add-on this manifest names: add it to addOns.requires or addOns.suggests` });
  if (review.needs !== undefined) {
    const feature = ctx.features.get(review.needs);
    if (feature === undefined) out.push({ path: here('needs'), message: `"${review.needs}" is not one of the app's addOns.features` });
    else if (!feature.includes(review.by.addOn)) out.push({ path: here('needs'), message: `the feature "${review.needs}" does not need "${review.by.addOn}", so it cannot switch this word` });
  }
  if (table.columns.filter((candidate) => candidate.role === 'pk').length !== 1) out.push({ path: here(), message: `a reviewed row is named by one key column, and "${table.ref}" has ${String(table.columns.filter((candidate) => candidate.role === 'pk').length)}` });

  /** A path from this table: its links, then (when `ends` is a column) a column of the row they reach. */
  const follow = (path: readonly string[], where: (string | number)[], ends: 'column' | 'row'): { table: ReviewHostTableShape; column?: ReviewHostTableShape['columns'][number] } | null => {
    let of: ReviewHostTableShape | undefined = table;
    const links = ends === 'column' ? path.slice(0, -1) : path;
    for (const link of links) {
      const found = column(of, link);
      if (found === undefined || found.type !== 'fk' || found.references === undefined) {
        out.push({ path: where, message: `"${of?.ref ?? ''}.${link}" is not a link of this app` });
        return null;
      }
      of = ctx.tables.get(found.references);
      if (of === undefined) {
        out.push({ path: where, message: `"${found.references}" is not one of this app's tables` });
        return null;
      }
    }
    if (ends === 'row') return { table: of! };
    const last = path[path.length - 1]!;
    const found = column(of, last);
    if (found === undefined) {
      out.push({ path: where, message: `"${of!.ref}" has no column "${last}"` });
      return null;
    }
    return { table: of!, column: found };
  };

  // What the row is about: a link, and its name as text.
  const about = column(table, review.about.link);
  if (about === undefined || about.type !== 'fk') out.push({ path: here('about', 'link'), message: `"${table.ref}.${review.about.link}" names what the row is about: a link` });
  for (const key of ['name', 'detail'] as const) {
    const named = review.about[key];
    if (named === undefined) continue;
    const found = follow(pathOf(named), here('about', key), 'column');
    if (found?.column !== undefined && found.column.type !== 'text' && found.column.type !== 'enum') out.push({ path: here('about', key), message: `"${found.table.ref}.${found.column.ref}" is copied as text: a text column` });
  }
  follow(review.when.path, here('when', 'path'), 'column');
  if (review.proved !== undefined) {
    const proved = follow(review.proved, here('proved'), 'column');
    if (proved?.column !== undefined && proved.column.type !== 'bool') out.push({ path: here('proved'), message: `"${proved.table.ref}.${proved.column.ref}" says whether the person proved who they are: a yes/no column` });
  }

  // Whose review it is: the way the app's own entries reach a person from this row, never another link.
  const chains = claimChains(table.ref, ctx.entries);
  if (chains.length === 0) {
    out.push({ path: here('person'), message: `no entry reaches "${table.ref}" as a person's own rows (claimedBy, or visibleWith a parent that is), so nobody could be proved to have bought one` });
  } else {
    const chain = chains.find((one) => one.path.join('.') === review.person.join('.'));
    if (chain === undefined) {
      out.push({ path: here('person'), message: `the person is the one the row's claim reaches: ${chains.map((one) => JSON.stringify(one.path)).join(' or ')}` });
    } else {
      const people = ctx.tables.get(chain.people);
      const names = 'full' in review.shownName ? [review.shownName.full] : [review.shownName.first, ...(review.shownName.last === undefined ? [] : [review.shownName.last])];
      names.forEach((name) => {
        const found = column(people, name);
        if (found === undefined) out.push({ path: here('shownName'), message: `"${chain.people}" has no column "${name}"` });
        else if (found.type !== 'text') out.push({ path: here('shownName'), message: `"${chain.people}.${name}" is a name: a text column` });
      });
    }
  }

  // The stamp: a moment Adminium writes, and no browser.
  const stamp = column(table, review.stamp);
  if (stamp === undefined) out.push({ path: here('stamp'), message: `"${table.ref}" has no column "${review.stamp}"` });
  else if (stamp.type !== 'timestamptz' || stamp.nullable !== true) out.push({ path: here('stamp'), message: `"${table.ref}.${review.stamp}" is stamped when the review is taken: a nullable timestamptz` });
  const writes = (node: { writable?: readonly string[] | undefined; writableValues?: Readonly<Record<string, unknown>> | undefined; defaults?: Readonly<Record<string, unknown>> | undefined }) =>
    (node.writable ?? []).includes(review.stamp) || Object.prototype.hasOwnProperty.call(node.writableValues ?? {}, review.stamp) || Object.prototype.hasOwnProperty.call(node.defaults ?? {}, review.stamp);
  const childWrites = (children: ReviewHostEntryShape['children'], name: string): boolean =>
    Object.entries(children ?? {}).some(([child, node]) => (child === name && writes(node)) || childWrites(node.children as ReviewHostEntryShape['children'], name));
  ctx.entries.forEach((entry) => {
    if ((entry.table === table.ref && writes(entry)) || childWrites(entry.children, table.ref)) {
      out.push({ path: here('stamp'), message: `"${table.ref}.${review.stamp}" is Adminium's to stamp when a review is taken: no entry writes it` });
    }
  });
  return out;
}
