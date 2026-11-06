/**
 * What the studio's screens read and write, as Adminium's data API answers
 * it: rows are a table's columns by their names (`post_by`, `line_total`),
 * moments ISO strings, dates `YYYY-MM-DD` on the studio's calendar, money a
 * decimal string or number. A refusal is an {@link ApiError}: its HTTP
 * status, its code and its params; the code is the contract, never the
 * message.
 */

export type Id = number | string;

/** A row as the data API answers it. */
export type Row = Record<string, unknown> & { id: Id };

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly params: Readonly<Record<string, unknown>>;
  constructor(status: number, code: string, message: string, params: Record<string, unknown> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.params = params;
  }
}

export const isApiError = (error: unknown): error is ApiError =>
  error instanceof ApiError || (typeof error === "object" && error !== null && (error as { name?: unknown }).name === "ApiError");

/** A text column's value, or null when it is empty. */
export function text(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : typeof value === "number" ? String(value) : null;
}

/** A number column's value (each engine spells one its own way), or null when it is empty. */
export function num(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Whether two keys name the same row, however each engine spells a key. */
export const same = (a: unknown, b: unknown): boolean => a !== null && a !== undefined && b !== null && b !== undefined && String(a) === String(b);

/** A date column as `YYYY-MM-DD` (a moment or a date, however the engine handed it back). */
export function dayOf(value: unknown): string | null {
  const t = text(value);
  return t === null ? null : t.slice(0, 10);
}
