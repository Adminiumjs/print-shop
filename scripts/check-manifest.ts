/**
 * `npm run manifest:check`: the manifest the modules write, put through the
 * vendored validator, every issue and warning printed.
 */
import { buildManifest } from "../src/manifest/build.ts";
import { manifestWarnings, validateManifest } from "../src/testing/manifest/validate.ts";

const doc = buildManifest();
const result = validateManifest(doc) as { ok: boolean; issues?: { path: unknown; message: string }[] };
for (const issue of result.issues ?? []) console.info(`✗ ${JSON.stringify(issue.path)}: ${issue.message}`);
if (result.ok) {
  for (const warning of manifestWarnings(doc as never)) console.info(`! ${JSON.stringify(warning.path)}: ${warning.message}`);
}
console.info(result.ok ? "[manifest] valid" : `[manifest] ${String(result.issues?.length ?? 0)} issues`);
process.exitCode = result.ok ? 0 : 1;
