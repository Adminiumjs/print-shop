// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Preloaded into the contract's Adminium (`node --import`) only when
 * `CONTRACT_ENGINE_RELEASE` names the release a checkout becomes: a checkout
 * built before its version was moved still says the release before in
 * `apps/server/package.json`, and refuses, by that number, a manifest whose
 * floor is the release it is about to be. Its server reads its version from
 * that one file, so that one file's version is read as the release named.
 * Nothing else is touched. Never used in CI, which runs a released Adminium.
 */
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import { fileURLToPath } from "node:url";

const release = process.env.CONTRACT_ENGINE_RELEASE;
if (release) {
  const read = fs.readFileSync;
  const isServerPackage = (path) => {
    const file = path instanceof URL ? fileURLToPath(path) : String(path);
    return /[\\/]apps[\\/]server[\\/]package\.json$/.test(file);
  };
  fs.readFileSync = function readFileSync(path, ...rest) {
    const out = read.call(this, path, ...rest);
    if (!isServerPackage(path)) return out;
    const text = typeof out === "string" ? out : out.toString("utf8");
    const patched = JSON.stringify({ ...JSON.parse(text), version: release });
    return typeof out === "string" ? patched : Buffer.from(patched);
  };
  syncBuiltinESMExports();
}
