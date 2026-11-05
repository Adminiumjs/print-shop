/**
 * Marlow Press's sample, as Adminium would hold it once added: the two
 * bundles an operator adds (`seeds/printing.sample.json`, then the rows the
 * Customiser's section adds in `seeds/printing.customiser.sample.json`),
 * every row given a key, every `@ref` the key of the row it names, every
 * `@day`/`@time` the date or instant it means at the demo's moment.
 *
 * The sample is written for a Wednesday (`weekAnchor`), and the demo's clock
 * stands on that Wednesday, 5 August 2026 at 10:20, as the comps draw it, so
 * a `@week` day counts from it exactly. A wall time is the works' own
 * (Europe/London), turned into the instant it is. A decimal column holds its
 * decimal text, as the data API answers it.
 *
 * DEMO BUILD ONLY — nothing in a real build imports it.
 */
import WORKS_BUNDLE from "../../seeds/printing.sample.json" with { type: "json" };
import CUSTOMISER_BUNDLE from "../../seeds/printing.customiser.sample.json" with { type: "json" };

import { addDays, momentOf } from "../studio/time.ts";
import { TABLE_OF, type Row } from "./rules.ts";

export type { Row };

interface BundleTable {
  ref: string;
  rows: Record<string, unknown>[];
}
interface Bundle {
  tables: BundleTable[];
}

/** The demo's day and moment: Wednesday 5 August 2026, 10:20 in Marlow. */
export const DEMO_DAY = "2026-08-05";
export const DEMO_ZONE = "Europe/London";
export const DEMO_START = Date.parse("2026-08-05T09:20:00.000Z");

/** A wall time on a day in the works' zone, as the instant it is. */
function instantOf(day: string, time: string): string {
  return String(momentOf(`${day} ${time}`, DEMO_ZONE));
}

function resolveValue(value: unknown, labels: ReadonlyMap<string, number>): unknown {
  if (Array.isArray(value)) return value.map((v) => resolveValue(v, labels));
  if (typeof value !== "object" || value === null) return value;
  const record = value as Record<string, unknown>;
  if (typeof record["@ref"] === "string") {
    const id = labels.get(record["@ref"]);
    if (id === undefined) throw new Error(`the sample names "${record["@ref"]}" before any row is labelled so`);
    return id;
  }
  if (typeof record["@day"] === "number") {
    const day = addDays(DEMO_DAY, record["@day"]);
    return typeof record["@time"] === "string" ? instantOf(day, record["@time"]) : day;
  }
  return Object.fromEntries(Object.entries(record).map(([k, v]) => [k, resolveValue(v, labels)]));
}

/** The places a decimal column of the app's is kept to. */
function placesOf(table: string, column: string): number | null {
  const found = TABLE_OF.get(table)?.columns.find((c) => c.ref === column);
  if (found === undefined || found.type !== "decimal") return null;
  return found.scale === "currency" ? 2 : typeof found.scale === "number" ? found.scale : 4;
}

/** Every table of both bundles, its rows keyed from 1 in the order they are added. */
export function sampleTables(): Record<string, Row[]> {
  const labels = new Map<string, number>();
  const tables: Record<string, Row[]> = {};
  for (const bundle of [WORKS_BUNDLE, CUSTOMISER_BUNDLE] as unknown as Bundle[]) {
    for (const table of bundle.tables) {
      const rows = (tables[table.ref] ??= []);
      for (const raw of table.rows) {
        const id = rows.length + 1;
        const row: Row = { id };
        for (const [key, value] of Object.entries(raw)) {
          if (key === "@label") continue;
          const places = placesOf(table.ref, key);
          const resolved = resolveValue(value, labels);
          row[key] = places !== null && typeof resolved === "number" ? resolved.toFixed(places) : resolved;
        }
        if (typeof raw["@label"] === "string") labels.set(raw["@label"], id);
        rows.push(row);
      }
    }
  }
  return tables;
}
