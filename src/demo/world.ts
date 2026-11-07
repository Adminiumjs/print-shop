/**
 * The demo's Adminium for Marlow Press, in the page: the sample's rows, held
 * in memory and worked by the manifest's own rules (`rules.ts`), a clock that
 * stands on Wednesday 5 August 2026 at 10:20 until the demo card moves it,
 * and the add-ons switched on. The shop's door (`shop.ts`) and the works'
 * (`works.ts`) both read and write this one world, so an order placed in the
 * shop is on Today's board the moment it is placed.
 *
 * Every write goes the way Adminium's does: the new row's defaults, running
 * number and link code (`newRow`), the values over it, every figure worked
 * out again (`deriveAll`), then the stamps the write fired (`stamp`: a job's
 * ready-by, a state's moment), and the figures again.
 *
 * DEMO BUILD ONLY — nothing in a real build imports it.
 */
import { dayIn, momentOf } from "../studio/time.ts";
import { deriveAll, newRow, nextWorkingDay, closuresIn, stamp, supersede, type Moment, type Tables } from "./rules.ts";
import { DEMO_START, DEMO_ZONE, sampleTables, type Row } from "./sample.ts";

/** Tables the sample adds no rows to, which the screens still read or write. */
const EMPTY = ["artwork", "spoils", "job_features", "messages", "sample_stocks", "version_files", "customers"];

/** The add-ons a new demo starts with: the Customiser the app requires, and Invoices, which the install ticks. */
export const START_ADD_ONS = ["customiser", "invoices"] as const;

/** The add-ons the demo card switches, by their marketplace keys. */
export const CARD_ADD_ONS = ["shipping-dhl", "inventory", "invoices", "holiday-calendars"] as const;
export type CardAddOn = (typeof CARD_ADD_ONS)[number];


/**
 * Holiday calendars' table as the demo has it: the England and Wales set the
 * add-on keeps (`country` GB, `region` england-and-wales), the rows of its
 * 1.0.17 seed in their order, which "Add as a closure" offers from. The
 * add-on keeps the other countries' sets beside it; the works reads only this
 * one, so the demo holds no other.
 */
export const DEMO_HOLIDAYS: readonly Row[] = [
  ["2026-01-01", "New Year's Day"],
  ["2026-04-03", "Good Friday"],
  ["2026-04-06", "Easter Monday"],
  ["2026-05-04", "Early May bank holiday"],
  ["2026-05-25", "Spring bank holiday"],
  ["2026-08-31", "Summer bank holiday"],
  ["2026-12-25", "Christmas Day"],
  ["2026-12-28", "Boxing Day (substitute day)"],
  ["2027-01-01", "New Year's Day"],
  ["2027-03-26", "Good Friday"],
  ["2027-03-29", "Easter Monday"],
  ["2027-05-03", "Early May bank holiday"],
  ["2027-05-31", "Spring bank holiday"],
  ["2027-08-30", "Summer bank holiday"],
  ["2027-12-27", "Christmas Day (substitute day)"],
  ["2027-12-28", "Boxing Day (substitute day)"],
].map(([day, name], i) => ({ id: i + 1, country: "GB", region: "england-and-wales", day, name }));

const same = (a: unknown, b: unknown) => a !== null && a !== undefined && b !== null && b !== undefined && String(a) === String(b);
const pad = (n: number, width: number) => String(n).padStart(width, "0");

export class DemoWorld {
  now: number;
  readonly zone = DEMO_ZONE;
  readonly currency = "GBP";
  readonly tables: Tables;
  readonly addOns: Set<string>;
  /** The codes "e-mailed" to an address, newest last: the demo has no post office, so the card types them. */
  readonly codes = new Map<string, string[]>();
  /** The files the demo keeps, by the reference a row holds (a proof's PDF, an artwork upload). */
  readonly files = new Map<string, Blob>();
  private readonly nextIds: Record<string, number> = {};
  private readonly listeners = new Set<() => void>();
  private serial = 0;

  constructor(start = DEMO_START) {
    this.now = start;
    const sample = sampleTables();
    this.tables = {};
    for (const table of EMPTY) this.tables[table] = [];
    // Each row added as Adminium adds a sample row: its defaults, then its own values; no stamp fires for history.
    for (const [table, rows] of Object.entries(sample)) {
      this.tables[table] = rows.map((row) => ({ ...newRow(table, row, this.tables, (n) => this.code("S", n)), id: row.id }) as Row);
      // A later table's defaults read an earlier one's worked figures (a job reads the settings' press sheet area).
      deriveAll(this.tables);
    }
    this.tables["holidays"] = DEMO_HOLIDAYS.map((h) => ({ ...h }));
    for (const [table, rows] of Object.entries(this.tables)) this.nextIds[table] = Math.max(0, ...rows.map((r) => r.id)) + 1;
    this.addOns = new Set(START_ADD_ONS);
    deriveAll(this.tables);
  }

  // ── reading ───────────────────────────────────────────────────────────────

  all(table: string): Row[] {
    return (this.tables[table] ??= []);
  }

  get(table: string, id: unknown): Row | undefined {
    return this.all(table).find((r) => same(r.id, id));
  }

  settings(): Row {
    return this.all("settings")[0] ?? { id: 1 };
  }

  /** The works' day and wall time now. */
  today(): string {
    return dayIn(this.now, this.zone);
  }

  wallTime(): string {
    return new Intl.DateTimeFormat("en-GB", { timeZone: this.zone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(this.now));
  }

  nowIso(): string {
    return new Date(this.now).toISOString();
  }

  moment(by: string | null = null): Moment {
    return { iso: this.nowIso(), day: this.today(), time: this.wallTime(), by };
  }

  // ── writing ───────────────────────────────────────────────────────────────

  /**
   * One write, as Adminium makes it: `work` adds and changes rows (through
   * `insert` and `update`), then every figure is worked out, the stamps the
   * write fired are set, and the figures worked out again.
   */
  write<T>(work: () => T, by: string | null = null): T {
    const before = structuredClone(this.tables);
    const out = work();
    deriveAll(this.tables);
    for (let round = 0; round < 3 && stamp(this.tables, before, this.moment(by)); round += 1) deriveAll(this.tables);
    for (const listener of this.listeners) listener();
    return out;
  }

  /** A new row with the defaults, running number and link code Adminium gives it, its earlier rows moved on as its states say. Inside `write`. */
  insert(table: string, values: Record<string, unknown>): Row {
    const id = (this.nextIds[table] ??= 1);
    this.nextIds[table] = id + 1;
    const row = { ...newRow(table, values, this.tables, (n) => this.code("", n)), id } as Row;
    this.all(table).push(row);
    supersede(table, row, this.tables);
    return row;
  }

  /** A row's values changed. Inside `write`. */
  update(table: string, id: unknown, values: Record<string, unknown>): Row {
    const row = this.get(table, id);
    if (row === undefined) throw new Error(`no ${table} ${String(id)}`);
    Object.assign(row, values);
    return row;
  }

  remove(table: string, id: unknown): void {
    this.tables[table] = this.all(table).filter((r) => !same(r.id, id));
  }

  /** Something outside a write moved (the clock, an add-on): whoever is watching hears of it. */
  changed(): void {
    deriveAll(this.tables);
    for (const listener of this.listeners) listener();
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** A code nobody else has, of a given length: counted, never drawn at random. */
  code(prefix: string, length = 16): string {
    this.serial += 1;
    return `${prefix}${"DEMO"}${pad(this.serial, Math.max(1, length - prefix.length - 4))}`.slice(0, length).toUpperCase();
  }

  // ── the clock and the add-ons ─────────────────────────────────────────────

  /** "+1 working day": the next day the works prints (Monday to Friday, not a closure), at the same time of day. */
  advanceWorkingDay(): void {
    const next = nextWorkingDay(this.today(), closuresIn(this.tables));
    this.now = Date.parse(String(momentOf(`${next} ${this.wallTime()}`, this.zone)));
    this.changed();
  }

  /** "Past the 14:00 cut-off": the same day at 14:05. */
  pastCutoff(): void {
    this.now = Date.parse(String(momentOf(`${this.today()} 14:05`, this.zone)));
    this.changed();
  }

  setAddOn(key: string, on: boolean): void {
    if (on) this.addOns.add(key);
    else this.addOns.delete(key);
    this.changed();
  }
}
