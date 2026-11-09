/**
 * The owner's and the floor roles' holds on the Customiser's tables, held to
 * what the add-on lets an app's role hold (`appGrants`), as vendored with its
 * editor (`vendor/customiser/app-grants.json`, written by
 * `scripts/sync-customiser.mjs`). The install cuts a grant to the add-on's
 * lists and says what it kept back, so a set-up column the add-on adds or
 * takes away would leave the owner's set-up page refused with no test
 * failing: here it fails the day the new release is vendored.
 *
 * The manifest is written for the Customiser 1.0.23, while 1.0.22 is the
 * one vendored until the release re-vendors it. What 1.0.23 changes
 * (`AHEAD`) is laid over the vendored grants while they are older; once
 * 1.0.23 is vendored nothing is laid over, and the test holds the manifest to
 * the add-on's own lists, so the allowance lapses by itself.
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { ROLES, SETTINGS_COLUMNS, SETUP_COLUMNS, setUpWritable } from "./roles.ts";

type Grants = { actions: string[]; creatable?: string[]; writable?: string[] };
const VENDORED = JSON.parse(readFileSync(new URL("../../vendor/customiser/app-grants.json", import.meta.url), "utf8")) as Record<string, Grants>;
const VENDORED_VERSION = (JSON.parse(readFileSync(new URL("../../vendor/customiser/SOURCE.json", import.meta.url), "utf8")) as { version: string }).version;
const atLeast = (version: string, floor: string) => {
  const [a, b] = [version, floor].map((v) => v.split(".").map(Number));
  for (let i = 0; i < 3; i += 1) if (a![i] !== b![i]) return a![i]! > b![i]!;
  return true;
};

/** The release the manifest is written for, and what it changes in the add-on's grants from the one before. */
const AHEAD_OF = "1.0.23";
const AHEAD: Record<string, (vendored: Grants) => Grants> = {
  // The set-up page's Shop settings: the settings changed, column by column.
  settings: (g) => ({ ...g, actions: ["read", "update"], writable: ["default_bleed_mm", "default_safe_mm", "one_colour_threshold", "smallest_line_mm", "min_dpi"] }),
  // Whether a font is one of the install's starters is given on a new font, and never changed.
  fonts: (g) => ({ ...g, writable: (g.writable ?? []).filter((c) => c !== "starter") }),
};
const LAID_OVER = !atLeast(VENDORED_VERSION, AHEAD_OF);
/** The grants the manifest is held to: the vendored ones, with 1.0.23's changes laid over while it is not yet vendored. */
const GRANTS: Record<string, Grants> = Object.fromEntries(Object.entries(VENDORED).map(([table, g]) => [table, LAID_OVER && AHEAD[table] !== undefined ? AHEAD[table]!(g) : g]));

type Held = { addOn?: string; table: string; actions: string[]; limit?: { creatable?: string[]; writable?: string[]; creatableValues?: Record<string, unknown[]> } };
const heldBy = (key: string): Held[] => ((ROLES.find((r) => r.key === key)!.tables ?? []) as Held[]).filter((g) => g.addOn === "customiser");

describe(`the Customiser's tables, as the add-on ${AHEAD_OF} lets an app's role hold them (vendored: ${VENDORED_VERSION})`, () => {
  it("gives the owner's set-up exactly the add-on's columns: every column a new row is given, every one a change moves", () => {
    expect(Object.keys(SETUP_COLUMNS).sort()).toEqual(Object.keys(GRANTS).filter((t) => GRANTS[t]!.writable !== undefined && !["design_versions", "version_files", "settings"].includes(t)).sort());
    for (const table of Object.keys(SETUP_COLUMNS)) {
      expect(["app", ...SETUP_COLUMNS[table]!], `${table}: the columns a new row is given`).toEqual(GRANTS[table]!.creatable);
      expect(setUpWritable(table), `${table}: the columns the owner changes`).toEqual(GRANTS[table]!.writable);
    }
    expect(SETTINGS_COLUMNS).toEqual(GRANTS["settings"]!.writable);
  });

  it.each(ROLES.map((r) => r.key))("asks for no action or column past the add-on's for %s", (key) => {
    for (const grant of heldBy(key)) {
      const allowed = GRANTS[grant.table];
      expect(allowed, `${key}: ${grant.table} is given to no app's role`).toBeDefined();
      for (const action of grant.actions) expect(allowed!.actions, `${key}: ${grant.table} ${action}`).toContain(action);
      for (const column of grant.limit?.creatable ?? []) expect(allowed!.creatable ?? [], `${key}: ${grant.table} creates ${column}`).toContain(column);
      for (const column of grant.limit?.writable ?? []) expect(allowed!.writable ?? [], `${key}: ${grant.table} changes ${column}`).toContain(column);
      for (const column of Object.keys(grant.limit?.creatableValues ?? {})) expect(grant.limit?.creatable ?? [], `${key}: ${grant.table} limits ${column}`).toContain(column);
    }
  });

  it(`lays ${AHEAD_OF}'s changes over an older vendored release only, and only where they change something`, () => {
    for (const [table, change] of Object.entries(AHEAD)) {
      const vendored = VENDORED[table]!;
      if (LAID_OVER) expect(change(vendored), `${table}: ${AHEAD_OF} changes it`).not.toEqual(vendored);
      // Once vendored, the add-on's own lists are 1.0.23's: nothing is laid over them, and they say the same.
      else expect(change(vendored), `${table} in ${VENDORED_VERSION}`).toEqual(vendored);
    }
  });
});
