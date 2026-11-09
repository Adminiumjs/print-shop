/**
 * The owner's and the floor roles' holds on the Customiser's tables, held to
 * what the add-on lets an app's role hold (`appGrants`), as vendored with its
 * editor (`vendor/customiser/app-grants.json`, written by
 * `scripts/sync-customiser.mjs`). The install cuts a grant to the add-on's
 * lists and says what it kept back, so a set-up column the add-on adds or
 * takes away would leave the owner's set-up page refused with no test
 * failing: here it fails the day the new release is vendored.
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { ROLES, SETUP_COLUMNS } from "./roles.ts";

type Grants = { actions: string[]; creatable?: string[]; writable?: string[]; readable?: string[] };
const VENDORED = JSON.parse(readFileSync(new URL("../../vendor/customiser/app-grants.json", import.meta.url), "utf8")) as Record<string, Grants>;
const VENDORED_VERSION = (JSON.parse(readFileSync(new URL("../../vendor/customiser/SOURCE.json", import.meta.url), "utf8")) as { version: string }).version;
const atLeast = (version: string, floor: string) => {
  const [a, b] = [version, floor].map((v) => v.split(".").map(Number));
  for (let i = 0; i < 3; i += 1) if (a![i] !== b![i]) return a![i]! > b![i]!;
  return true;
};

/**
 * Holds the manifest asks for ahead of the vendored release: the owner's
 * change of the settings (the set-up page's Shop settings) is in the
 * Customiser's `appGrants` from 1.0.23. Until 1.0.23 is vendored the install
 * cuts it and says so; once it is, nothing is excused and the test below
 * holds it like every other.
 */
const AHEAD: { role: string; table: string; action: string; from: string }[] = [{ role: "owner", table: "settings", action: "update", from: "1.0.23" }];
const excused = (role: string, table: string, action: string) => AHEAD.some((a) => a.role === role && a.table === table && a.action === action && !atLeast(VENDORED_VERSION, a.from));
type Held = { addOn?: string; table: string; actions: string[]; limit?: { creatable?: string[]; writable?: string[] } };
const heldBy = (key: string): Held[] => ((ROLES.find((r) => r.key === key)!.tables ?? []) as Held[]).filter((g) => g.addOn === "customiser");

describe("the Customiser's tables, as the vendored add-on lets an app's role hold them", () => {
  it("gives the owner's set-up writes exactly the add-on's columns: every column of the row, its app given on a new one", () => {
    expect(Object.keys(SETUP_COLUMNS).sort()).toEqual(Object.keys(VENDORED).filter((t) => VENDORED[t]!.writable !== undefined && !["design_versions", "version_files"].includes(t)).sort());
    for (const [table, columns] of Object.entries(SETUP_COLUMNS)) {
      expect(columns, `${table}: the columns the owner changes`).toEqual(VENDORED[table]!.writable);
      expect(["app", ...columns], `${table}: the columns a new row is given`).toEqual(VENDORED[table]!.creatable);
    }
  });

  it.each(ROLES.map((r) => r.key))("asks for no action or column past the add-on's for %s", (key) => {
    for (const grant of heldBy(key)) {
      const allowed = VENDORED[grant.table];
      expect(allowed, `${key}: ${grant.table} is given to no app's role`).toBeDefined();
      for (const action of grant.actions) if (!excused(key, grant.table, action)) expect(allowed!.actions, `${key}: ${grant.table} ${action}`).toContain(action);
      for (const column of grant.limit?.creatable ?? []) expect(allowed!.creatable ?? [], `${key}: ${grant.table} creates ${column}`).toContain(column);
      if (!excused(key, grant.table, "update")) for (const column of grant.limit?.writable ?? []) expect(allowed!.writable ?? [], `${key}: ${grant.table} changes ${column}`).toContain(column);
    }
  });

  it("excuses only what a release after the vendored one gives, and nothing once it is vendored", () => {
    for (const ahead of AHEAD) {
      const role = ROLES.find((r) => r.key === ahead.role)!;
      expect(heldBy(role.key).find((g) => g.table === ahead.table)?.actions, `${ahead.role} asks for ${ahead.table} ${ahead.action}`).toContain(ahead.action);
      if (atLeast(VENDORED_VERSION, ahead.from)) expect(VENDORED[ahead.table]!.actions, `${ahead.table} ${ahead.action} in ${VENDORED_VERSION}`).toContain(ahead.action);
      else expect(VENDORED[ahead.table]!.actions, `${ahead.table} ${ahead.action} is not yet in ${VENDORED_VERSION}`).not.toContain(ahead.action);
    }
  });
});
