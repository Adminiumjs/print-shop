/**
 * Which Adminium the contract runs on.
 *
 * The contract installs the manifest that ships (`manifest.json`, at the
 * floor `MIN_ADMINIUM`), so the Adminium under test is that release or a
 * later one.
 *
 * Tests only; nothing that ships imports it.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { atLeast } from "../manifest/build.ts";

const REPO = fileURLToPath(new URL("../..", import.meta.url));

/** The release of the Adminium under test, as its server's own package says it ("0.0.0" when there is no checkout). */
export const ENGINE_VERSION: string = (() => {
  const file = join(process.env["ADMINIUM_REPO"] ?? "", "apps", "server", "package.json");
  if (!existsSync(file)) return "0.0.0";
  return (JSON.parse(readFileSync(file, "utf8")) as { version?: string }).version ?? "0.0.0";
})();

/** Whether the Adminium under test is that release or a later one. */
export const engineAtLeast = (release: string): boolean => atLeast(ENGINE_VERSION, release);

/** The manifest the contract installs: the one that ships. */
export const MANIFEST_TEXT: string = readFileSync(join(REPO, "manifest.json"), "utf8");
