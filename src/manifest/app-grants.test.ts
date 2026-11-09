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
      for (const action of grant.actions) expect(allowed!.actions, `${key}: ${grant.table} ${action}`).toContain(action);
      for (const column of grant.limit?.creatable ?? []) expect(allowed!.creatable ?? [], `${key}: ${grant.table} creates ${column}`).toContain(column);
      for (const column of grant.limit?.writable ?? []) expect(allowed!.writable ?? [], `${key}: ${grant.table} changes ${column}`).toContain(column);
    }
  });
});
