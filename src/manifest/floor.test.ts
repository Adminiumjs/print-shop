/**
 * The manifest at the next floor: what raising `MIN_ADMINIUM` to 0.3.44
 * writes, held to the validator of that release before anybody raises it.
 * And what is written at every floor: the closure's link to a public holiday
 * Holiday calendars keeps, and the owner's read of those holidays.
 */
import { describe, expect, it } from "vitest";

import { validateManifest } from "../testing/manifest/index.ts";
import { buildManifest, MIN_ADMINIUM, PANELS_AND_COPIES } from "./build.ts";
import { ROLE_PANELS } from "./roles.ts";

type Json = Record<string, unknown>;
type Role = { key: string; permissions: string[]; tables?: { addOn?: string; table: string; actions: string[] }[] };
const roleOf = (m: Json, key: string) => (m["roles"] as Role[]).find((r) => r.key === key)!;
const copiesOf = (m: Json) => ((m["people"] as Json[])[0]!["copies"] as Json[]).filter((c) => c["addOn"] === "customiser").map((c) => `${String(c["table"])}.${String(c["column"])}`);
const panelsOf = (m: Json, key: string) => roleOf(m, key).permissions.filter((p) => p.startsWith("page:@customiser-"));

describe("the manifest at the floor it ships with", () => {
  const shipped = buildManifest();

  it("says none of the next release's words", () => {
    expect(shipped["compatibility"]).toMatchObject({ minAdminiumVersion: MIN_ADMINIUM });
    for (const role of ["owner", "prepress", "press", "counter"]) expect(panelsOf(shipped, role)).toEqual([]);
    expect(copiesOf(shipped)).toEqual(["designs.email", "designs.values"]);
  });

  it("links a closure to the public holiday it was added for, and lets the owner read those holidays", () => {
    const closures = ((shipped["requiredSchema"] as { tables: { ref: string; columns: Json[] }[] }).tables.find((t) => t.ref === "closures")!).columns;
    expect(closures.find((c) => c["ref"] === "holiday_id")).toMatchObject({ type: "int", nullable: true, rules: { addOnLink: { addOn: "holiday-calendars", table: "holidays" } } });
    expect(roleOf(shipped, "owner").tables).toContainEqual({ addOn: "holiday-calendars", table: "holidays", actions: ["read"] });
    const suggests = (shipped["addOns"] as { suggests: { key: string; range: string }[] }).suggests;
    expect(suggests.find((s) => s.key === "holiday-calendars")?.range).toBe("^1.0.16");
  });
});

describe(`the manifest at ${PANELS_AND_COPIES}`, () => {
  const next = buildManifest({ floor: PANELS_AND_COPIES });

  it("passes that release's validator", () => {
    const result = validateManifest(next);
    expect(result.ok ? [] : result.issues).toEqual([]);
  });

  it("grants the Customiser's job panel to the owner, prepress and the press, its product panel to the owner, and none to the counter", () => {
    for (const [key, panels] of Object.entries(ROLE_PANELS)) {
      expect(panelsOf(next, key).sort()).toEqual(panels.map((p) => `page:@${p}:view`).sort());
      // A panel on a job opens over a job the role reads.
      expect(roleOf(next, key).permissions).toContain("table:@jobs:read");
      expect(roleOf(next, key).tables).toContainEqual({ addOn: "customiser", table: "designs", actions: ["read"] });
    }
    expect(panelsOf(next, "counter")).toEqual([]);
  });

  it("follows a person into their designs' logo, photo, versions and files", () => {
    expect(copiesOf(next)).toEqual(["designs.email", "designs.values", "designs.logo_file", "designs.photo_file", "design_versions.values", "design_versions.proof_file", "version_files.file"]);
  });

  it("is refused by the validator at the older floor, so the words cannot ship early", () => {
    expect(validateManifest({ ...next, compatibility: { ...(next["compatibility"] as Json), minAdminiumVersion: MIN_ADMINIUM } }).ok).toBe(false);
  });
});
