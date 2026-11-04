/**
 * `npm run manifest`: write `manifest.json` again from `src/manifest/`.
 *
 * It also writes the list of labels still in English only to
 * `src/manifest/untranslated-labels.json`, which the drift test holds the
 * modules to: the list is reviewed in the diff, and can only be changed here.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { manifestText } from "../src/manifest/build.ts";
import { untranslated } from "../src/manifest/labels.ts";

const file = join(import.meta.dirname, "..", "manifest.json");
writeFileSync(file, manifestText());
writeFileSync(join(import.meta.dirname, "..", "src", "manifest", "untranslated-labels.json"), `${JSON.stringify(untranslated(), null, 2)}\n`);
console.info(`[manifest] wrote manifest.json (${String(untranslated().length)} labels in English only)`);
