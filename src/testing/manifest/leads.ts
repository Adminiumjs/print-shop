/*
 * VENDORED VERBATIM from packages/manifest/src/leads.ts.
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
 * LEADS: THE ADD-ON BLOCK'S `leads` WORD.
 *
 * An add-on that finds companies and people (it declares `addOn.sources` and
 * provides `lead-source`) names the two of its own tables the engine keeps
 * what was found in:
 *
 * ```json
 * "addOn": { "leads": { "foundPeople": "found_people", "fieldSources": "field_sources" } }
 * ```
 *
 *  - `foundPeople`: one row per person a source found and Adminium stored in
 *    an app's people table: which row, which company, which source, when, the
 *    purpose they are kept for, by when they must be told and when they were,
 *    and the pages a source saw their address on;
 *  - `fieldSources`: one row per field a source filled on a record: which
 *    table, row and column, which source, when, and a hash of the value it
 *    wrote (a field's note shows only while the value still hashes the same).
 *
 * Each table must have the columns the engine reads and writes, by these
 * names and of these kinds ({@link LEADS_COLUMNS}), and a numbered key.
 * Adminium alone writes both: no role of the add-on, no app's grant and no
 * step writes them, and no public entry opens them. Staff read them (the
 * add-on's pages list the people found). Staff write the add-on's one
 * settings row ({@link LEADS_SETTINGS_COLUMNS}), which the engine reads.
 *
 * No column here is JSON but the purpose's words: a found person's pages are
 * one https address per line. A found person's address is kept on their row
 * (`email`): the add-on's tell mail reads its recipient from it.
 *
 * Pure: no I/O, and nothing imported from the manifest's own schema file, so
 * that file may import this one.
 */
import { z } from 'zod';

import { contractColumns, describeContractColumn, type ContractColumn, type FormsAddOnShape, type FormsTableShape } from './forms.ts';
import { refSchema, type ReferenceIssue } from './refs.ts';

/** The block: the add-on's own tables, by ref. Both are required. */
export const addOnLeadsSchema = z
  .object({
    foundPeople: refSchema,
    fieldSources: refSchema,
  })
  .strict();
export type AddOnLeads = z.infer<typeof addOnLeadsSchema>;

/** The two parts a leads block names. */
export type LeadsPart = keyof AddOnLeads;
export const LEADS_PARTS = ['foundPeople', 'fieldSources'] as const satisfies readonly LeadsPart[];

/** The category a package that declares leads is filed under. */
export const LEADS_CATEGORY = 'marketing';

/** What one column of a leads table, or of its settings table, must be. */
export type LeadsColumn = ContractColumn<LeadsPart>;

/** Where a found person stands: waiting to be told, told, the mail failed, or they objected. */
export const FOUND_PERSON_STATES = ['waiting', 'told', 'failed', 'objected'] as const;
/** The longest list of a found person's pages, one https address per line. */
export const FOUND_PERSON_PAGES_MAX = 4000;
/** The longest address a found person is kept with. */
export const FOUND_PERSON_EMAIL_MAX = 320;
/** The longest purpose a found person is kept for, as copied when they are stored. */
export const FOUND_PERSON_PURPOSE_MAX = 500;
/** The years a found person is kept by default, and the range the owner may set. */
export const LEADS_KEEP_YEARS_DEFAULT = 3;
export const LEADS_KEEP_YEARS_MIN = 1;
export const LEADS_KEEP_YEARS_MAX = 10;
/** The columns of a field's source that name one field: no two rows name the same. */
export const FIELD_SOURCE_KEY = ['table_ref', 'row_key', 'column_name'] as const;

const { text, moment, date, json, whole, bool, choice } = contractColumns;

/**
 * The columns each part has, which the engine reads and writes by these
 * names. A table may have more of its own; each other column is one an
 * insert may leave out, as Adminium alone writes both. A column not marked
 * nullable is always written, so it may not be nullable either.
 */
export const LEADS_COLUMNS: Readonly<Record<LeadsPart, Readonly<Record<string, LeadsColumn>>>> = {
  foundPeople: {
    /** The people row the person was stored as: its table (`<app>:<table>`) and key. */
    person_table: text(64),
    person_key: text(200),
    /** The company row they were found at, when there is one. */
    company_table: text(64, true),
    company_key: text(200, true),
    /** The source id that found them (`addOn.sources[].id`). */
    source: text(32),
    found_at: moment(),
    /** The purpose they are kept for, copied from the add-on's settings when they were stored. */
    purpose: text(FOUND_PERSON_PURPOSE_MAX),
    /** The day they must be told by, and when they were. */
    tell_by: date(),
    told_at: moment(true),
    /** The outbox row of the mail that tells them. */
    outbox_id: text(64, true),
    state: choice(FOUND_PERSON_STATES),
    /** The pages a source saw their address on, one https address per line. */
    source_pages: text(FOUND_PERSON_PAGES_MAX, true),
    /**
     * Their address as found: where the tell mail goes (the add-on's outbox
     * reads its recipient from here). Personal, so it is found, downloaded
     * and erased with the row.
     */
    email: text(FOUND_PERSON_EMAIL_MAX, true),
  },
  fieldSources: {
    /** The record's table (`<app>:<table>`), its key, and the column filled. */
    table_ref: text(64),
    row_key: text(200),
    column_name: text(64),
    source: text(32),
    found_at: moment(),
    /** The sha-256, in hex, of the value written, as the record page reads it (text, trimmed). */
    value_hash: text(64),
  },
};

/**
 * The columns of the add-on's one settings row (`addOn.settingsTable`) the
 * engine reads. Staff write them. A `json` column takes no default, so it is
 * nullable: the engine reads an empty one as nothing set.
 */
export const LEADS_SETTINGS_COLUMNS: Readonly<Record<string, LeadsColumn>> = {
  /** Whether people are found and stored at all. */
  people_on: bool(),
  /** Why found people are kept, as Words: one plain sentence per language, no links. */
  purpose: json(true),
  /** How many years a found person is kept (1 to 10). */
  keep_years: whole(),
};

/** The actions on a table no grant gives on a table only Adminium writes. */
const WRITES = ['create', 'update', 'import'] as const;

/** A table of the add-on, with the unique sets it declares. */
export type LeadsTableShape = FormsTableShape & { unique?: readonly (readonly string[])[] | undefined };

/** What the checks read of the add-on beside its leads block. */
export interface LeadsAddOnShape extends Omit<FormsAddOnShape, 'tables'> {
  tables: readonly LeadsTableShape[];
}

/** Everything wrong with an add-on's leads block, against its own tables, settings table, roles, entries and steps. */
export function leadsBlockIssues(block: AddOnLeads, m: LeadsAddOnShape): ReferenceIssue[] {
  const out: ReferenceIssue[] = [];
  const tables = new Map(m.tables.map((table, t) => [table.ref, { table, t }]));
  const at = (...rest: (string | number)[]) => ['addOn', 'leads', ...rest];

  if (!m.categories.includes(LEADS_CATEGORY)) out.push({ path: ['categories'], message: `an add-on that declares leads is filed under the "${LEADS_CATEGORY}" category` });
  if (block.foundPeople === block.fieldSources) out.push({ path: at('fieldSources'), message: `"${block.fieldSources}" holds the people found already: each part of leads is a table of its own` });

  for (const part of LEADS_PARTS) {
    const ref = block[part];
    const found = tables.get(ref);
    if (found === undefined) {
      out.push({ path: at(part), message: `"${ref}" is not one of this add-on's tables` });
      continue;
    }
    const { table, t } = found;
    const contract = LEADS_COLUMNS[part];
    const what = part === 'foundPeople' ? 'the people found' : "the fields' sources";
    out.push(...columnIssues(table, t, what, contract));

    // A numbered key: the engine's own increment.
    const k = table.columns.findIndex((column) => column.role === 'pk');
    const key = table.columns[k];
    if (key === undefined) out.push({ path: at(part), message: `"${ref}" holds ${what}, so its rows are numbered: give it an int key (role "pk")` });
    else if (key.type !== 'int' && key.type !== 'bigint') out.push({ path: ['requiredSchema', 'tables', t, 'columns', k, 'type'], message: `"${ref}" holds ${what}, so its rows are numbered: its key "${key.ref}" is an int or a bigint, not ${key.type}` });

    // A field is named once: the engine replaces its source when it fills the field again.
    if (part === 'fieldSources') {
      const want = [...FIELD_SOURCE_KEY].sort().join('\u0000');
      if (!(table.unique ?? []).some((set) => [...set].sort().join('\u0000') === want)) {
        out.push({ path: ['requiredSchema', 'tables', t, 'unique'], message: `"${ref}" names each field once: make ${FIELD_SOURCE_KEY.map((name) => `"${name}"`).join(', ')} a unique set` });
      }
    }

    // Strangers never reach what was found about people.
    (m.publicAccess ?? []).forEach((entry, e) => {
      if (entry.table === ref) out.push({ path: ['publicAccess', e, 'table'], message: `"${ref}" holds ${what}, which Adminium alone writes: no public entry opens it` });
    });

    // A table only Adminium writes: every other column is one its insert may leave out.
    table.columns.forEach((column, c) => {
      if (contract[column.ref] !== undefined || column.role === 'pk' || column.nullable === true || column.default !== undefined || m.decided?.(ref, column.ref) === true) return;
      out.push({ path: ['requiredSchema', 'tables', t, 'columns', c], message: `"${ref}" is written by Adminium alone, which never fills "${column.ref}": make it nullable or give it a default` });
    });
    out.push(...onlyAdminiumWrites(ref, t, what, m));
  }

  // The settings the engine reads: whether people are found, why they are kept, and for how long.
  const settings = m.settingsTable === undefined ? undefined : tables.get(m.settingsTable);
  if (m.settingsTable === undefined) {
    out.push({ path: ['addOn', 'settingsTable'], message: 'an add-on that declares leads keeps whether people are found, why and for how long in a one-row settings table: name it in addOn.settingsTable' });
  } else if (settings !== undefined) {
    out.push(...columnIssues(settings.table, settings.t, 'the settings of what is found', LEADS_SETTINGS_COLUMNS));
    const c = settings.table.columns.findIndex((column) => column.ref === 'keep_years');
    const keep = settings.table.columns[c]?.default;
    if (c >= 0 && keep !== undefined && (typeof keep !== 'number' || !Number.isInteger(keep) || keep < LEADS_KEEP_YEARS_MIN || keep > LEADS_KEEP_YEARS_MAX)) {
      out.push({ path: ['requiredSchema', 'tables', settings.t, 'columns', c, 'default'], message: `"${settings.table.ref}.keep_years" is a number of years from ${String(LEADS_KEEP_YEARS_MIN)} to ${String(LEADS_KEEP_YEARS_MAX)} (${String(LEADS_KEEP_YEARS_DEFAULT)} by default)` });
    }
  }
  return out;
}

/** Each column a contract names, on one table: there, of its kind, its values, its width and its emptiness. */
function columnIssues(table: LeadsTableShape, t: number, holds: string, contract: Readonly<Record<string, LeadsColumn>>): ReferenceIssue[] {
  const out: ReferenceIssue[] = [];
  const ref = table.ref;
  for (const [name, want] of Object.entries(contract)) {
    const c = table.columns.findIndex((column) => column.ref === name);
    const column = table.columns[c];
    if (column === undefined) {
      out.push({ path: ['requiredSchema', 'tables', t, 'columns'], message: `"${ref}" holds ${holds}, so it has a column "${name}" (${describeContractColumn(want)})` });
      continue;
    }
    const say = (message: string, ...rest: (string | number)[]) => out.push({ path: ['requiredSchema', 'tables', t, 'columns', c, ...rest], message: `"${ref}.${name}" ${message}` });
    if (!want.types.includes(column.type)) {
      say(`is read and written by Adminium as ${describeContractColumn(want)}, not ${column.type}`, 'type');
      continue;
    }
    if (want.nullable === true && column.nullable !== true) say('is written empty until there is something to put in it: make it nullable', 'nullable');
    if (want.nullable !== true && column.nullable === true) say('always holds a value, which Adminium reads: make it not nullable', 'nullable');
    if (want.atLeast !== undefined && column.maxLength !== undefined && column.maxLength < want.atLeast) say(`takes up to ${String(want.atLeast)} characters: leave out maxLength, or make it at least that`, 'maxLength');
    if (want.values !== undefined) {
      const values = new Set(column.enum ?? []);
      if (values.size !== want.values.length || !want.values.every((value) => values.has(value))) say(`takes exactly ${want.values.map((value) => `"${value}"`).join(', ')}`, 'enum');
    }
  }
  return out;
}

/**
 * Nothing of the add-on writes a table only Adminium writes: no role's
 * create, update or import, no app's grant beyond reading, no step (and no
 * public entry). Staff read them.
 */
function onlyAdminiumWrites(ref: string, t: number, what: string, m: LeadsAddOnShape): ReferenceIssue[] {
  const out: ReferenceIssue[] = [];
  const why = `${what} are written by Adminium alone`;
  const roles = m.roles ?? [];
  roles.forEach((role, r) => {
    const from = role.cloneFrom === undefined ? undefined : roles.find((other) => other.key === role.cloneFrom);
    const grants = new Set([...(from?.permissions ?? []), ...(role.permissions ?? [])]);
    for (const action of WRITES) {
      if (grants.has(`table:@${ref}:${action}`) || grants.has(`table:@*:${action}`)) {
        out.push({ path: ['roles', r, 'permissions'], message: `"${role.key}" may ${action} "${ref}", and ${why}: a role reads them` });
      }
    }
  });
  (m.tables[t]?.appGrants?.actions ?? []).forEach((action, a) => {
    if (action !== 'read') out.push({ path: ['requiredSchema', 'tables', t, 'appGrants', 'actions', a], message: `${why}: an app's role may only read "${ref}"` });
  });
  (m.steps ?? []).forEach((step, s) => {
    if (step.writes.table === ref) out.push({ path: ['addOn', 'steps', s, 'writes', 'table'], message: `${why}: the step "${step.key}" may not write a row of "${ref}"` });
  });
  return out;
}
