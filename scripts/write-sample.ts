/**
 * `npm run sample`: write the two sample files from the one source of the
 * sample (`src/sample/marlow-press.ts`). `src/sample/sample-bundle.test.ts`
 * fails when a file and the source disagree.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { customiserSection, sampleBundle } from "../src/sample/marlow-press.ts";

const SEEDS = join(import.meta.dirname, "..", "seeds");
export const SAMPLE_FILE = join(SEEDS, "printing.sample.json");
export const SECTION_FILE = join(SEEDS, "printing.customiser.sample.json");

export const sampleText = (): string => `${JSON.stringify(sampleBundle(), null, 2)}\n`;
export const sectionText = (): string => `${JSON.stringify(customiserSection(), null, 2)}\n`;

if (process.env["VITEST"] === undefined) {
  writeFileSync(SAMPLE_FILE, sampleText());
  writeFileSync(SECTION_FILE, sectionText());
  for (const bundle of [sampleBundle(), customiserSection()]) {
    console.info(`[sample] ${bundle.addOn ?? "printing"}: ${bundle.tables.map((t) => `${t.ref} ${String(t.rows.length)}`).join(", ")}`);
  }
}
