/**
 * The figures Adminium keeps for Marlow Press, worked out by the manifest's
 * own rules, read off the manifest itself (`manifest.json`'s
 * `requiredSchema`), never written out a second time here: each column's
 * `copy` (a line's rate card read from its options, its material, its
 * settings), its `default` from the settings row on a new row, its `band`
 * (a job's quantity break, an order's delivery band by its weight), its
 * `formula` (the twenty-nine price columns of a job, an order's tax and
 * total) worked by Adminium's own exact arithmetic (`formula.ts`), its
 * `rollup` over child rows, its `join`, and its `stamp` on a write (a
 * job's ready-by in working days from the two o'clock cut-off, past the
 * works' closures). A price the demo shows is therefore the price the same
 * manifest gives on a real Adminium; the contract (`src/contract/`) holds
 * the real one to it.
 *
 * The screens never work a figure out, so the demo's Adminium has to: this
 * is that half of it. Money is kept as the decimal text the data API answers
 * ("66.46").
 *
 * DEMO BUILD ONLY — nothing in a real build imports it.
 */
import { requiredSchema } from "../../manifest.json";
import { addDays, isStudioDay, type Closure } from "../studio/time.ts";
import { evaluateFormula, formulaKeepOf, formulaOrder, holds, rollupValue, type FormulaCondition, type FormulaExpr } from "./formula.ts";

export type Row = Record<string, unknown> & { id: number };
export type Tables = Record<string, Row[]>;

interface Column {
  ref: string;
  type: string;
  maxLength?: number;
  scale?: number | "currency";
  references?: string;
  rules?: Record<string, unknown>;
}
interface Table {
  ref: string;
  columns: Column[];
  states?: {
    column: string;
    initial: string;
    moves: Record<string, (string | { to: string; requires?: { where: FormulaCondition[] | { column: string; eq: unknown }[] }; roles?: string[] })[]>;
    supersedes?: { by: string; from: string[]; to: string };
  };
}

const TABLES = requiredSchema.tables as unknown as Table[];
export const TABLE_OF: ReadonlyMap<string, Table> = new Map(TABLES.map((t) => [t.ref, t]));

/** The app's own settings (`working_days`, `cutoff`), as the install keeps their defaults. */
export const APP_SETTINGS = { working_days: "mon,tue,wed,thu,fri", cutoff: "14:00" } as const;
export const WORKING_DAYS = APP_SETTINGS.working_days.split(",");

const same = (a: unknown, b: unknown) => a !== null && a !== undefined && b !== null && b !== undefined && String(a) === String(b);
const blank = (v: unknown) => v === null || v === undefined || v === "";

/** The places a column's value is kept to: money 2, a decimal its scale (4 for a formula's without one), a whole number 0. */
function placesOf(column: Column): number {
  if (column.scale === "currency") return 2;
  if (typeof column.scale === "number") return column.scale;
  return column.type === "int" || column.type === "bigint" ? 0 : 4;
}

/** The table a link column points into: the app's own by its `references`, or an add-on's by its `addOnLink`. */
function targetOf(column: Column | undefined): string | null {
  if (column === undefined) return null;
  if (typeof column.references === "string") return column.references;
  const link = column.rules?.["addOnLink"] as { table?: string } | undefined;
  return link?.table ?? null;
}

const byId = (tables: Tables, table: string | null, id: unknown): Row | undefined => (table === null || blank(id) ? undefined : (tables[table] ?? []).find((r) => same(r.id, id)));

/** A number as the row keeps one: an int as a number, a decimal as its text. */
function kept(column: Column, text: string | null): unknown {
  if (text === null) return null;
  return column.type === "int" || column.type === "bigint" ? Number(text) : text;
}

// ── one row's own rules ─────────────────────────────────────────────────────

/** Every rule of a table that reads other rows or the row itself, applied to one row: copies, bands, look-ups, formulas. */
function deriveRow(table: Table, row: Row, tables: Tables): void {
  const columns = new Map(table.columns.map((c) => [c.ref, c]));
  for (const column of table.columns) {
    const rules = column.rules ?? {};
    const copy = rules["copy"] as { via: string; from: string; mode?: string } | undefined;
    if (copy !== undefined && (copy.mode === "always" || row[column.ref] === undefined)) {
      const source = byId(tables, targetOf(columns.get(copy.via)), row[copy.via]);
      row[column.ref] = source === undefined ? null : (source[copy.from] ?? null);
    }
    const lookup = rules["lookup"] as { from: string; table: string | { table: string }; column: string } | undefined;
    if (lookup !== undefined) {
      const into = typeof lookup.table === "string" ? lookup.table : lookup.table.table;
      const typed = row[lookup.from];
      row[column.ref] = blank(typed) ? null : ((tables[into] ?? []).find((r) => same(r[lookup.column], typed))?.id ?? null);
    }
  }
  // Bands, then the formulas in the order they read each other; a band reads a formula (a weight) and a formula a band (a rate), so twice.
  for (let pass = 0; pass < 2; pass += 1) {
    for (const column of table.columns) {
      const band = column.rules?.["band"] as { table: string; min: string; max?: string; value: string; scope?: { column: string; equals: string }[]; over?: string } | undefined;
      if (band === undefined) continue;
      const value = Number(row[band.value]);
      if (blank(row[band.value]) || !Number.isFinite(value)) {
        row[column.ref] = null;
        continue;
      }
      const fits = (tables[band.table] ?? [])
        .filter((b) => (band.scope ?? []).every((s) => same(b[s.column], row[s.equals])))
        .filter((b) => Number(b[band.min]) <= value && (band.max === undefined || blank(b[band.max]) || value <= Number(b[band.max])))
        .sort((a, b) => Number(b[band.min]) - Number(a[band.min]));
      row[column.ref] = fits[0]?.id ?? null;
    }
    // A copy that reads through a band (the next break) follows it.
    for (const column of table.columns) {
      const copy = column.rules?.["copy"] as { via: string; from: string; mode?: string } | undefined;
      if (copy === undefined || copy.mode !== "always" || columns.get(copy.via)?.rules?.["band"] === undefined) continue;
      const source = byId(tables, targetOf(columns.get(copy.via)), row[copy.via]);
      row[column.ref] = source === undefined ? null : (source[copy.from] ?? null);
    }
    const formulas = new Map<string, FormulaExpr>();
    for (const column of table.columns) {
      const formula = column.rules?.["formula"] as FormulaExpr | undefined;
      if (formula !== undefined) formulas.set(column.ref, formula);
    }
    for (const ref of formulaOrder(formulas)) {
      const column = columns.get(ref)!;
      // Kept as the server keeps it: by the column's `normalize` rule, a join cut to the column's length.
      row[ref] = kept(column, evaluateFormula(formulas.get(ref)!, row, placesOf(column), formulaKeepOf(column)));
    }
    // A copy of a formula column of another row (a finish's price a piece) is read again once that row's formulas are in.
  }
}

/** The totals a row keeps of its children: a sum, a count, the newest child's value. */
function rollRow(table: Table, row: Row, tables: Tables): void {
  for (const column of table.columns) {
    const rollup = column.rules?.["rollup"] as
      | { from: string; via: string; sum?: string; count?: true; times?: string; where?: { column: string; eq: unknown }; unlessSet?: string; latest?: { of: string; by: string } }
      | undefined;
    if (rollup === undefined) continue;
    // A child row with a value in `unlessSet` (a cancelled job) is left out.
    const children = (tables[rollup.from] ?? []).filter(
      (c) => same(c[rollup.via], row.id) && (rollup.where === undefined || holds({ eq: [rollup.where.column, rollup.where.eq as string] }, c, 4)) && (rollup.unlessSet === undefined || blank(c[rollup.unlessSet])),
    );
    if (rollup.latest !== undefined) {
      const by = rollup.latest.by;
      const later = (a: unknown, b: unknown) => (Number.isFinite(Number(a)) && Number.isFinite(Number(b)) ? Number(a) - Number(b) : String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0);
      const newest = [...children].filter((c) => !blank(c[by])).sort((a, b) => later(b[by], a[by]))[0];
      row[column.ref] = newest === undefined ? null : (newest[rollup.latest.of] ?? null);
      continue;
    }
    if (rollup.sum === undefined && rollup.count !== true) continue;
    // An empty list sums to nothing: Adminium keeps a sum of no rows as empty, a count of none as 0.
    if (rollup.count !== true && children.length === 0) {
      row[column.ref] = null;
      continue;
    }
    row[column.ref] = kept(column, rollupValue(children, { sum: rollup.sum, times: rollup.times, count: rollup.count }, placesOf(column)));
  }
}

/** The tables in the order their rows read each other: a line after its rate card, an order after its lines. */
const ORDER = ["settings", "materials", "sizes", "finishes", "breaks", "packaging", "delivery_bands", "products", "options", "option_rules", "machines", "closures", "customers", "artwork", "proofs", "job_features", "spoils", "jobs", "orders", "quote_lines", "saved_quotes", "sample_stocks", "sample_requests", "messages"];

/** Every stored figure again, after a write: rate card, lines, orders, until nothing moves. */
export function deriveAll(tables: Tables): void {
  for (let pass = 0; pass < 3; pass += 1) {
    for (const ref of ORDER) {
      const table = TABLE_OF.get(ref);
      if (table === undefined) continue;
      for (const row of tables[ref] ?? []) {
        rollRow(table, row, tables);
        deriveRow(table, row, tables);
      }
    }
  }
}

// ── a new row ───────────────────────────────────────────────────────────────

/**
 * What Adminium gives a new row before its rules run: each column the write
 * left out at its default (a fixed value, or the settings row's column), a
 * running number and its formatted reference, a link code.
 */
export function newRow(ref: string, values: Record<string, unknown>, tables: Tables, code: (length: number) => string): Record<string, unknown> {
  const table = TABLE_OF.get(ref);
  const row: Record<string, unknown> = { ...values };
  if (table === undefined) return row;
  const settings = tables["settings"]?.[0];
  for (const column of table.columns) {
    if (row[column.ref] !== undefined) continue;
    const rules = column.rules ?? {};
    const fromSetting = (rules["default"] as { from?: { table: string; column: string } } | undefined)?.from;
    if (fromSetting !== undefined) row[column.ref] = settings?.[fromSetting.column] ?? null;
    else if ((column as { default?: unknown }).default !== undefined) row[column.ref] = (column as { default?: unknown }).default;
    const sequence = rules["sequence"] as { startSetting?: { column: string }; scope?: string } | undefined;
    if (sequence !== undefined) {
      const rows = (tables[ref] ?? []).filter((r) => sequence.scope === undefined || same(r[sequence.scope], row[sequence.scope]));
      const given = rows.map((r) => Number(r[column.ref])).filter((n) => Number.isFinite(n) && n > 0);
      const first = sequence.startSetting === undefined ? 1 : Number(settings?.[sequence.startSetting.column] ?? 1);
      row[column.ref] = given.length === 0 ? first : Math.max(...given) + 1;
    }
    const codeRule = rules["code"] as { length: number } | undefined;
    if (codeRule !== undefined) row[column.ref] = code(codeRule.length);
  }
  for (const column of table.columns) {
    const format = column.rules?.["format"] as { from: string; prefixSetting?: { column: string } } | undefined;
    if (format === undefined || row[column.ref] !== undefined) continue;
    row[column.ref] = `${String(format.prefixSetting === undefined ? "" : (settings?.[format.prefixSetting.column] ?? ""))}${String(row[format.from])}`;
  }
  return row;
}

// ── stamps ──────────────────────────────────────────────────────────────────

export interface Moment {
  /** The instant, as ISO text. */
  iso: string;
  /** The works' day and wall time then. */
  day: string;
  time: string;
  /** Who made the write, for a `user-name` stamp. */
  by: string | null;
}

/** The works' closures in effect, as the calendar reads them. */
export function closuresIn(tables: Tables): Closure[] {
  return (tables["closures"] ?? []).filter((c) => c["active"] !== false && c["active"] !== 0).map((c) => ({ from: String(c["from_date"]).slice(0, 10), to: String(c["to_date"]).slice(0, 10) }));
}

/** The next working day after `day`. */
export function nextWorkingDay(day: string, closures: readonly Closure[]): string {
  let d = addDays(day, 1);
  for (let guard = 0; !isStudioDay(d, WORKING_DAYS, closures) && guard < 400; guard += 1) d = addDays(d, 1);
  return d;
}

/** `addWorkingDays` from now: that day when it is a working day before the cut-off, else the next one; then so many working days on. */
export function workingDaysOn(at: Moment, days: number, closures: readonly Closure[]): string {
  let d = isStudioDay(at.day, WORKING_DAYS, closures) && at.time < APP_SETTINGS.cutoff ? at.day : nextWorkingDay(at.day, closures);
  for (let left = days; left > 0; left -= 1) d = nextWorkingDay(d, closures);
  return d;
}

type On = "create" | { column: string; values: unknown[] } | { column: string; filled: true } | { columns: string[] };

function fires(on: On | On[], before: Row | undefined, after: Row): boolean {
  const list = Array.isArray(on) ? on : [on];
  return list.some((o) => {
    if (o === "create") return before === undefined;
    if ("columns" in o) return before !== undefined && o.columns.some((c) => !same(before[c], after[c]) && !(blank(before[c]) && blank(after[c])));
    // The moment a nullable column is first filled (a proof given its PDF).
    if ("filled" in o) return !blank(after[o.column]) && (before === undefined || blank(before[o.column]));
    const changed = before === undefined || !same(before[o.column], after[o.column]);
    return changed && o.values.some((v) => same(after[o.column], v) || (v === true && after[o.column] === 1));
  });
}

/**
 * The stamps a write sets: for every row it made or changed (`before` is the
 * tables as they were), each stamp whose `on` fires, set to now, the person,
 * a moment some days on, or a day so many working days on. A new row keeps
 * a stamp the write itself gave (a sample's own dates); a `notEarlier` stamp
 * never moves its column earlier. True when one fired.
 */
export function stamp(tables: Tables, before: Tables, at: Moment): boolean {
  let any = false;
  const closures = closuresIn(tables);
  for (const table of TABLES) {
    const stamps = table.columns.filter((c) => c.rules?.["stamp"] !== undefined);
    if (stamps.length === 0) continue;
    const was = new Map((before[table.ref] ?? []).map((r) => [String(r.id), r]));
    for (const row of tables[table.ref] ?? []) {
      const old = was.get(String(row.id));
      for (const column of stamps) {
        const rule = column.rules!["stamp"] as { set: unknown; on: On | On[]; notEarlier?: true };
        if (!fires(rule.on, old, row)) continue;
        if (old === undefined && row[column.ref] !== undefined && row[column.ref] !== null) continue;
        const set = rule.set;
        let value: unknown;
        if (set === "now") value = column.type === "date" ? at.day : at.iso;
        else if (set === "user-name") value = at.by;
        else if (typeof set === "object" && set !== null && "moment" in set) {
          const m = (set as { moment: { column: string; plus: { days: number } } }).moment;
          const from = Date.parse(String(row[m.column] ?? ""));
          value = Number.isNaN(from) ? null : new Date(from + m.plus.days * 86_400_000).toISOString();
        } else if (typeof set === "object" && set !== null && "addWorkingDays" in set) {
          const w = (set as { addWorkingDays: { days: string } }).addWorkingDays;
          const days = Number(row[w.days]);
          value = Number.isFinite(days) ? workingDaysOn(at, days, closures) : null;
        }
        // `notEarlier`: the later of what the row holds and the new value (an empty one takes the new).
        const held = Date.parse(String(row[column.ref] ?? ""));
        if (rule.notEarlier === true && !Number.isNaN(held) && value !== null && Date.parse(String(value)) < held) value = row[column.ref];
        if (!same(row[column.ref], value)) any = true;
        row[column.ref] = value;
      }
    }
  }
  return any;
}

// ── states ──────────────────────────────────────────────────────────────────

/**
 * Whether a table's states let a row move from where it is to `to`, for a
 * person with these roles: a move the table lists, and its `requires` met.
 */
export function mayMove(ref: string, row: Row, to: string, roles: readonly string[]): boolean {
  const states = TABLE_OF.get(ref)?.states;
  if (states === undefined) return true;
  const from = String(row[states.column] ?? states.initial);
  const move = (states.moves[from] ?? []).find((m) => (typeof m === "string" ? m : m.to) === to);
  if (move === undefined) return false;
  if (typeof move === "string") return true;
  if (move.roles !== undefined && !move.roles.some((r) => roles.includes(r))) return false;
  const where = (move.requires?.where ?? []) as { column: string; eq: unknown }[];
  return where.every((w) => same(row[w.column], w.eq));
}

/**
 * A new row's earlier rows that share its link and still wait in one of the
 * `from` states, moved on in the same write (`states.supersedes`): a proof
 * sent again sends the job's earlier one still out again, whoever sends it.
 * The new row itself never moves, and one with the link empty moves nothing.
 */
export function supersede(ref: string, row: Row, tables: Tables): void {
  const states = TABLE_OF.get(ref)?.states;
  const rule = states?.supersedes;
  if (states === undefined || rule === undefined || blank(row[rule.by])) return;
  for (const other of tables[ref] ?? []) {
    if (other === row || !same(other[rule.by], row[rule.by])) continue;
    if (rule.from.includes(String(other[states.column] ?? states.initial))) other[states.column] = rule.to;
  }
}
