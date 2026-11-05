/*
 * COPIED VERBATIM from the evaluating half of `src/testing/manifest/formula.ts`
 * (itself Adminium's `packages/manifest/src/formula.ts`): the exact
 * arithmetic Adminium works a formula, a join, a condition and a total out
 * with, and nothing of the schemas (`zod` stays a devDependency). The demo's
 * Adminium (`rules.ts`) prices Marlow Press's work by the manifest's own
 * rules with these, so the demo's figures are Adminium's to the penny.
 * `formula.test.ts` holds every declaration here to its source, byte for
 * byte: re-copy them after `sync-manifest-validator.mjs` changes the source.
 *
 * DEMO BUILD ONLY — nothing in a real build imports it.
 */
export type FormulaExpr =
  | number
  | string
  | { add: FormulaExpr[] }
  | { sub: [FormulaExpr, FormulaExpr] }
  | { mul: FormulaExpr[] }
  | { div: [FormulaExpr, FormulaExpr] }
  | { min: FormulaExpr[] }
  | { max: FormulaExpr[] }
  | { round: FormulaExpr | [FormulaExpr, number] }
  | { ceil: FormulaExpr | [FormulaExpr, number] }
  | { floor: FormulaExpr | [FormulaExpr, number] }
  | { coalesce: [FormulaExpr, FormulaExpr] }
  | { if: [FormulaCondition, FormulaExpr, FormulaExpr] }
  | { hoursBetween: [string, string] }
  | { daysBetween: [string, string] }
  | { join: string[] };

export type FormulaCondition =
  | { eq: [string, string | number | boolean] }
  | { neq: [string, string | number | boolean] }
  | { gt: [FormulaExpr, FormulaExpr] }
  | { gte: [FormulaExpr, FormulaExpr] }
  | { lt: [FormulaExpr, FormulaExpr] }
  | { lte: [FormulaExpr, FormulaExpr] }
  | { isNull: string }
  | { and: FormulaCondition[] }
  | { or: FormulaCondition[] };

/** Whether a part of a `join` names a column of the row; any other part is text written as it is. */
export function isJoinColumn(part: string): boolean {
  return /^[a-z][a-z0-9_]*$/.test(part);
}

/** Every column a formula reads, in the order it first names them. */
export function formulaColumns(expr: FormulaExpr | FormulaCondition): string[] {
  const out: string[] = [];
  const walk = (node: unknown): void => {
    if (typeof node === 'string') {
      if (!out.includes(node)) out.push(node);
      return;
    }
    if (typeof node !== 'object' || node === null) return;
    const [op, args] = Object.entries(node)[0] as [string, unknown];
    if (op === 'eq' || op === 'neq') {
      walk((args as unknown[])[0]);
      return;
    }
    if (op === 'join') {
      (args as string[]).filter(isJoinColumn).forEach(walk);
      return;
    }
    if (op === 'isNull') {
      walk(args);
      return;
    }
    if (Array.isArray(args)) args.forEach(walk);
    else walk(args);
  };
  walk(expr);
  return out;
}

/**
 * A table's formula columns in the order they can be worked out: each after
 * every formula column it reads. Assumes no cycle (checked at validation).
 */
export function formulaOrder(formulas: ReadonlyMap<string, FormulaExpr>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const visit = (name: string): void => {
    if (seen.has(name)) return;
    seen.add(name);
    for (const next of formulaColumns(formulas.get(name)!)) if (formulas.has(next)) visit(next);
    out.push(name);
  };
  for (const name of formulas.keys()) visit(name);
  return out;
}

/** A fraction of two big integers; `d` is always positive. */
interface Ratio {
  n: bigint;
  d: bigint;
}

const DECIMAL_TEXT = /^([+-]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/;

function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) [x, y] = [y, x % y];
  return x === 0n ? 1n : x;
}

function ratio(n: bigint, d: bigint): Ratio {
  if (d < 0n) return ratio(-n, -d);
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}

/**
 * A stored value as an exact fraction: the decimal text of a number (never a
 * float product), a decimal string as a driver returns it, a bigint, or a
 * boolean (1 / 0, as MySQL and SQLite store one). `null` for an empty value or
 * text that is not a number.
 */
export function toRatio(value: unknown): Ratio | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'bigint') return { n: value, d: 1n };
  if (typeof value === 'boolean') return { n: value ? 1n : 0n, d: 1n };
  let text: string;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    text = String(value);
  } else if (typeof value === 'string') {
    text = value.trim();
  } else {
    return null;
  }
  const match = DECIMAL_TEXT.exec(text);
  if (match === null) return null;
  const [, sign = '', whole = '', fraction = '', exponent = '0'] = match;
  if (whole === '' && fraction === '') return null;
  let n = BigInt(`${whole}${fraction}` === '' ? '0' : `${whole}${fraction}`);
  let d = 10n ** BigInt(fraction.length);
  const e = Number.parseInt(exponent, 10);
  if (e > 0) n *= 10n ** BigInt(e);
  else if (e < 0) d *= 10n ** BigInt(-e);
  return ratio(sign === '-' ? -n : n, d);
}

const add = (a: Ratio, b: Ratio) => ratio(a.n * b.d + b.n * a.d, a.d * b.d);
const sub = (a: Ratio, b: Ratio) => ratio(a.n * b.d - b.n * a.d, a.d * b.d);
const mul = (a: Ratio, b: Ratio) => ratio(a.n * b.n, a.d * b.d);
const cmp = (a: Ratio, b: Ratio) => {
  const left = a.n * b.d;
  const right = b.n * a.d;
  return left < right ? -1 : left > right ? 1 : 0;
};

/** Round half away from zero to `scale` places. */
function roundTo(value: Ratio, scale: number): Ratio {
  const factor = 10n ** BigInt(scale);
  const scaled = value.n * factor;
  const negative = scaled < 0n;
  const magnitude = negative ? -scaled : scaled;
  let q = magnitude / value.d;
  const r = magnitude % value.d;
  if (r * 2n >= value.d) q += 1n;
  return ratio(negative ? -q : q, factor);
}

/**
 * Round up (`ceil`, towards plus infinity) or down (`floor`, towards minus
 * infinity) to `scale` places: `ceil(-1.5)` is -1, `floor(-1.5)` is -2, and a
 * value already at that scale (`2.000`) stays as it is. Print's sheets are
 * `ceil(quantity / pieces per sheet)`: 101 cards at 100 a sheet need 2 sheets.
 */
function roundToward(value: Ratio, scale: number, up: boolean): Ratio {
  const factor = 10n ** BigInt(scale);
  const scaled = value.n * factor;
  // BigInt division truncates towards zero; step one unit away from it when
  // something was cut off and the direction asks for it.
  let q = scaled / value.d;
  const cut = scaled % value.d !== 0n;
  if (cut && up && scaled > 0n) q += 1n;
  if (cut && !up && scaled < 0n) q -= 1n;
  return ratio(q, factor);
}

/** A fraction as decimal text with exactly `scale` places (`12.50`, `-3`, `0.125`). */
export function ratioText(value: Ratio, scale: number): string {
  const rounded = roundTo(value, scale);
  const factor = 10n ** BigInt(scale);
  const units = (rounded.n * factor) / rounded.d;
  const negative = units < 0n;
  const digits = (negative ? -units : units).toString().padStart(scale + 1, '0');
  const whole = scale === 0 ? digits : digits.slice(0, -scale);
  const fraction = scale === 0 ? '' : `.${digits.slice(-scale)}`;
  return `${negative && units !== 0n ? '-' : ''}${whole}${fraction}`;
}

/**
 * What a total over child rows comes to, exactly: each row's `sum` (times its
 * `times`) added up as fractions and rounded once to `places`, or the rows
 * counted. A row whose value is empty or not a number adds nothing, as SQL's
 * `sum` leaves it out. SQLite adds decimals as floats, where 1.500 × 0.33 is
 * a hair under 0.495 and rounds to 0.49; this answers 0.50, as Postgres and
 * MySQL do.
 */
export function rollupValue(
  rows: readonly Readonly<Record<string, unknown>>[],
  spec: { sum?: string | undefined; times?: string | undefined; count?: true | undefined },
  places: number,
): string {
  if (spec.count === true) return String(rows.length);
  let total: Ratio = { n: 0n, d: 1n };
  for (const row of rows) {
    const amount = spec.sum === undefined ? null : toRatio(row[spec.sum]);
    if (amount === null) continue;
    if (spec.times === undefined) {
      total = add(total, amount);
      continue;
    }
    const times = toRatio(row[spec.times]);
    if (times !== null) total = add(total, mul(amount, times));
  }
  return ratioText(total, places);
}

/** Whether two decimals are the same number at `places` (`90` and `"90.00"` are; `"89.999"` at 2 is `"90.00"`). */
export function sameDecimal(a: unknown, b: unknown, places: number): boolean {
  const left = toRatio(a);
  const right = toRatio(b);
  if (left === null || right === null) return left === right;
  return ratioText(left, places) === ratioText(right, places);
}

function sameValue(stored: unknown, literal: string | number | boolean): boolean {
  if (stored === null || stored === undefined) return false;
  if (typeof literal === 'boolean') {
    return stored === literal || stored === (literal ? 1 : 0) || stored === (literal ? '1' : '0') || stored === String(literal);
  }
  if (typeof literal === 'number') {
    const a = toRatio(stored);
    const b = toRatio(literal);
    return a !== null && b !== null && cmp(a, b) === 0;
  }
  return String(stored) === literal;
}

/**
 * Work a formula out over a row, exactly: the result as decimal text at
 * `scale` places, or `null` when an input it needs is empty or a divisor is
 * zero. `row` holds the stored row with the new values over it.
 */
export function evaluateFormula(expr: FormulaExpr, row: Readonly<Record<string, unknown>>, scale: number, keep: FormulaKeep = {}): string | null {
  if (typeof expr === 'object' && 'join' in expr) {
    const joined = joinText(expr.join, row);
    if (joined === null) return null;
    const text = keep.normalize === undefined ? joined : normalizedText(keep.normalize, joined);
    // A joined text longer than its column holds is cut to it (by characters), never refused: a long name is still a name.
    return keep.maxLength !== undefined && [...text].length > keep.maxLength ? [...text].slice(0, keep.maxLength).join('').trimEnd() : text;
  }
  const value = evaluate(expr, row, scale);
  if (value === null) return null;
  const text = ratioText(value, scale);
  return keep.normalize === undefined ? text : normalizedText(keep.normalize, text);
}

/** `column.normalize`: how a `text` value is kept, whoever writes it or works it out. */
export type NormalizeRule = 'trim' | 'email' | 'code';

/**
 * `text` as a column with `normalize: how` keeps it: `trim` without spaces at
 * either end, `email` trimmed and in lower case, `code` as a code is compared
 * (upper case, spaces and dashes left out). The one rule for a typed value
 * and a worked-out one, on the server and in an app's demo.
 */
export function normalizedText(how: NormalizeRule, text: string): string {
  if (how === 'email') return text.trim().toLowerCase();
  if (how === 'code') return text.toUpperCase().replace(/[\s-]+/g, '');
  return text.trim();
}

/**
 * What a formula column keeps of the value worked out: its `normalize` rule,
 * then, for a join, its longest (cut there rather than refused).
 */
export interface FormulaKeep {
  normalize?: NormalizeRule | undefined;
  maxLength?: number | undefined;
}

/**
 * A manifest column's {@link FormulaKeep}: its `normalize`, and for a join
 * the shorter of its `maxLength` and its `validation.maxLength`. Passed to
 * {@link evaluateFormula}, a demo keeps the value the server would store.
 */
export function formulaKeepOf(column: {
  maxLength?: number | undefined;
  rules?: { formula?: FormulaExpr | undefined; normalize?: NormalizeRule | undefined; validation?: { maxLength?: number | undefined } | undefined } | undefined;
}): FormulaKeep {
  const formula = column.rules?.formula;
  const lengths = [column.maxLength, column.rules?.validation?.maxLength].filter((n): n is number => typeof n === 'number' && n > 0);
  const joined = typeof formula === 'object' && 'join' in formula && lengths.length > 0 ? Math.min(...lengths) : undefined;
  return {
    ...(column.rules?.normalize === undefined ? {} : { normalize: column.rules.normalize }),
    ...(joined === undefined ? {} : { maxLength: joined }),
  };
}

function evaluate(expr: FormulaExpr, row: Readonly<Record<string, unknown>>, scale: number): Ratio | null {
  if (typeof expr === 'number') return toRatio(expr);
  if (typeof expr === 'string') return toRatio(row[expr]);
  const [op, args] = Object.entries(expr)[0] as [string, unknown];
  const all = (list: FormulaExpr[]): Ratio[] | null => {
    const out: Ratio[] = [];
    for (const item of list) {
      const v = evaluate(item, row, scale);
      if (v === null) return null;
      out.push(v);
    }
    return out;
  };
  switch (op) {
    case 'add':
    case 'mul':
    case 'min':
    case 'max': {
      const values = all(args as FormulaExpr[]);
      if (values === null) return null;
      return values.reduce((a, b) =>
        op === 'add' ? add(a, b) : op === 'mul' ? mul(a, b) : op === 'min' ? (cmp(a, b) <= 0 ? a : b) : cmp(a, b) >= 0 ? a : b,
      );
    }
    case 'sub': {
      const values = all(args as FormulaExpr[]);
      return values === null ? null : sub(values[0]!, values[1]!);
    }
    case 'div': {
      const values = all(args as FormulaExpr[]);
      if (values === null || values[1]!.n === 0n) return null;
      return ratio(values[0]!.n * values[1]!.d, values[0]!.d * values[1]!.n);
    }
    case 'round':
    case 'ceil':
    case 'floor': {
      const [inner, places] = Array.isArray(args) ? (args as [FormulaExpr, number]) : [args as FormulaExpr, scale];
      const v = evaluate(inner, row, scale);
      if (v === null) return null;
      return op === 'round' ? roundTo(v, places) : roundToward(v, places, op === 'ceil');
    }
    case 'coalesce': {
      const [first, second] = args as [FormulaExpr, FormulaExpr];
      return evaluate(first, row, scale) ?? evaluate(second, row, scale);
    }
    case 'if': {
      const [condition, then, otherwise] = args as [FormulaCondition, FormulaExpr, FormulaExpr];
      return evaluate(holds(condition, row, scale) ? then : otherwise, row, scale);
    }
    case 'hoursBetween': {
      const [start, stop] = (args as [string, string]).map((column) => momentOf(row[column]));
      if (start === null || start === undefined || stop === null || stop === undefined || stop < start) return null;
      return ratio(BigInt(stop - start), MS_PER_HOUR);
    }
    case 'daysBetween': {
      const [start, stop] = (args as [string, string]).map((column) => dayNumberOf(row[column]));
      if (start === null || start === undefined || stop === null || stop === undefined || stop < start) return null;
      return { n: BigInt(stop - start), d: 1n };
    }
    default:
      return null;
  }
}

const MS_PER_HOUR = 3_600_000n;

/**
 * A time as the drivers and a form spell one — `2026-09-25 09:15:00`,
 * `2026-09-25T09:15` — and its zone when it has one: `Z`, `+02:00`, `+0200`
 * or `+02`, straight after the time or after a space
 * (`2026-09-25 09:15:00 +02:00`).
 */
const TIME = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?(?: ?(Z|[+-]\d{2}(?::?\d{2})?))?$/i;

/** Whether the parts name a day and a time the calendar has: no 30 February, no 25 o'clock. */
function onTheCalendar(y: number, mo: number, d: number, h: number, mi: number, s: number): boolean {
  if (mo < 1 || mo > 12 || d < 1 || h > 23 || mi > 59 || s > 59) return false;
  return d <= new Date(Date.UTC(y, mo, 0)).getUTCDate();
}

/**
 * A stored moment as milliseconds since the epoch, or `null` when it is empty
 * or not a time: a `Date` as a driver hands one back; a number as the seconds
 * since 1970 SQLite's `unixepoch()` fills a column with; a zoned text as the
 * moment it names, and a zone-less one on this clock (see the header). A day
 * or an hour the calendar does not have (30 February) is no time, not the one
 * it would roll over to.
 */
export function momentOf(value: unknown): number | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.getTime();
  if (typeof value === 'number') return Number.isFinite(value) ? Math.round(value * 1000) : null;
  if (typeof value === 'bigint') return Number(value) * 1000;
  if (typeof value !== 'string') return null;
  const found = TIME.exec(value.trim());
  if (found === null) return null;
  const [y, mo, d, h, mi, s] = found.slice(1, 7).map((part) => Number(part ?? 0)) as [number, number, number, number, number, number];
  if (!onTheCalendar(y, mo, d, h, mi, s)) return null;
  const ms = Number((found[7] ?? '').slice(0, 3).padEnd(3, '0'));
  const zone = found[8];
  if (zone === undefined) return new Date(y, mo - 1, d, h, mi, s, ms).getTime();
  const [, sign, hours, minutes] = /^([+-])(\d{2}):?(\d{2})?$/.exec(zone) ?? [];
  const offset = sign === undefined ? 0 : (sign === '-' ? -1 : 1) * (Number(hours) * 60 + Number(minutes ?? 0));
  return Date.UTC(y, mo - 1, d, h, mi, s, ms) - offset * 60_000;
}

/** A date as the drivers and a form spell one: `2026-08-03`, optionally followed by a time. */
const DAY = /^(\d{4})-(\d{2})-(\d{2})(?:$|[T ])/;

/**
 * A stored date as a day number (days since 1970-01-01 on the calendar), or
 * `null` when it is empty or not a day the calendar has. Text is read as the
 * calendar day it spells, whatever the zone; a `Date` (how a driver hands a
 * DATE back) as the day it falls on on this clock, since the drivers make it
 * at local midnight. The count is of calendar days, so a night the clocks
 * change is still one night.
 */
export function dayNumberOf(value: unknown): number | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()) / 86_400_000;
  }
  if (typeof value !== 'string') return null;
  const found = DAY.exec(value.trim());
  if (found === null) return null;
  const [y, mo, d] = found.slice(1, 4).map(Number) as [number, number, number];
  if (!onTheCalendar(y, mo, d, 0, 0, 0)) return null;
  return Date.UTC(y, mo - 1, d) / 86_400_000;
}

// ── a text joined from columns ─────────────────────────────────────────────

/**
 * The column types a join reads: text, and whole numbers. A decimal
 * (`8.250` on one database, `8.25` on another), a yes or no (`true`, `1`) or
 * a time (on the server's clock) would join differently on each engine.
 */
export const JOIN_COLUMN_TYPES: readonly string[] = ['text', 'int', 'bigint'];

/** A value as a joined text spells it: text trimmed, a whole number as its digits; anything else adds nothing. */
function joinedPart(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'bigint') return String(value);
  if (typeof value === 'number' && Number.isSafeInteger(value)) return String(value);
  return '';
}

/**
 * A `join` worked out: its columns' values and its text, in order. An empty
 * column is left out, and so is the text between it and its neighbour (a
 * guest with no last name is "Mia", not "Mia "); text before the first
 * column or after the last stays while that column has a value. The result
 * is trimmed, and empty when every column is.
 */
export function joinText(parts: readonly string[], row: Readonly<Record<string, unknown>>): string | null {
  const columns = parts.map((part) => isJoinColumn(part));
  const filled = parts.map((part, i) => (columns[i] ? joinedPart(row[part]) !== '' : true));
  let out = '';
  let any = false;
  parts.forEach((part, i) => {
    if (columns[i]) {
      if (!filled[i]) return;
      out += joinedPart(row[part]);
      any = true;
      return;
    }
    // Text sits between the nearest columns on each side: kept only while both (that there are) have a value.
    let left = i - 1;
    while (left >= 0 && !columns[left]) left -= 1;
    let right = i + 1;
    while (right < parts.length && !columns[right]) right += 1;
    const leftOk = left < 0 || filled[left];
    const rightOk = right >= parts.length || filled[right];
    if (leftOk && rightOk) out += part;
  });
  const text = out.trim();
  return any && text !== '' ? text : null;
}

/** Whether a condition holds for the row; a comparison with an empty side does not. */
export function holds(condition: FormulaCondition, row: Readonly<Record<string, unknown>>, scale: number): boolean {
  const [op, args] = Object.entries(condition)[0] as [string, unknown];
  switch (op) {
    case 'eq': {
      const [column, value] = args as [string, string | number | boolean];
      return sameValue(row[column], value);
    }
    case 'neq': {
      const [column, value] = args as [string, string | number | boolean];
      return row[column] !== null && row[column] !== undefined && !sameValue(row[column], value);
    }
    case 'isNull': {
      const stored = row[args as string];
      return stored === null || stored === undefined || stored === '';
    }
    case 'and':
      return (args as FormulaCondition[]).every((c) => holds(c, row, scale));
    case 'or':
      return (args as FormulaCondition[]).some((c) => holds(c, row, scale));
    default: {
      const [left, right] = (args as [FormulaExpr, FormulaExpr]).map((side) => evaluate(side, row, scale));
      if (left === null || left === undefined || right === null || right === undefined) return false;
      const order = cmp(left, right);
      return op === 'gt' ? order > 0 : op === 'gte' ? order >= 0 : op === 'lt' ? order < 0 : order <= 0;
    }
  }
}
