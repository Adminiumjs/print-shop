/**
 * Which Adminium the contract runs on, and so which manifest it installs.
 *
 * The app ships at its floor (`MIN_ADMINIUM`), but the same modules write the
 * manifest for the next release, which grants the Customiser's panels on a
 * job and a product and lets a person's copies follow into the versions of
 * their designs. On an Adminium that reads those, the contract installs that
 * manifest, so the checks of the next release run against the real thing; on
 * an older one it installs the manifest that ships.
 *
 * Tests only; nothing that ships imports it.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { atLeast, manifestText, PANELS_AND_COPIES } from "../manifest/build.ts";

const REPO = fileURLToPath(new URL("../..", import.meta.url));

/** The release of the Adminium under test, as its server's own package says it ("0.0.0" when there is no checkout). */
export const ENGINE_VERSION: string = (() => {
  const file = join(process.env["ADMINIUM_REPO"] ?? "", "apps", "server", "package.json");
  if (!existsSync(file)) return "0.0.0";
  return (JSON.parse(readFileSync(file, "utf8")) as { version?: string }).version ?? "0.0.0";
})();

/** Whether the Adminium under test is that release or a later one. */
export const engineAtLeast = (release: string): boolean => atLeast(ENGINE_VERSION, release);

/** Whether that Adminium reads the panels' grants and the copies into the Customiser's versions. */
export const READS_PANELS_AND_COPIES = engineAtLeast(PANELS_AND_COPIES);

/** The manifest the contract installs: written for the next release when the Adminium reads it, else the one that ships. */
export const MANIFEST_TEXT: string = READS_PANELS_AND_COPIES ? manifestText({ floor: PANELS_AND_COPIES }) : readFileSync(join(REPO, "manifest.json"), "utf8");
