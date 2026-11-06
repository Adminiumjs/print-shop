/**
 * The manifest at the floor it ships with: the Customiser's panels granted to
 * the roles that work a job, a person's copies followed into the versions of
 * their designs, the closure's link to a public holiday Holiday calendars
 * keeps, and the owner's read of those holidays. And the same modules at an
 * older floor: those words left out, and the validator refusing them there.
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

/** The release before the panels' grants and the copies into the versions. */
const OLDER = "0.3.43";

describe("the manifest at the floor it ships with", () => {
  const shipped = buildManifest();

  it("ships at 0.3.48, which reads the panels' grants, the copies into the versions, a role's personal columns and deletes, the owner's erase, and installs the Customiser that lets a role save a proof", () => {
    expect(MIN_ADMINIUM).toBe("0.3.48");
    expect(shipped["compatibility"]).toMatchObject({ minAdminiumVersion: MIN_ADMINIUM });
    const result = validateManifest(shipped);
    expect(result.ok ? [] : result.issues).toEqual([]);
  });

  it("grants the Customiser's job panel to the owner, prepress and the press, its product panel to the owner, and none to the counter", () => {
    for (const [key, panels] of Object.entries(ROLE_PANELS)) {
      expect(panelsOf(shipped, key).sort()).toEqual(panels.map((p) => `page:@${p}:view`).sort());
      // A panel on a job opens over a job the role reads.
      expect(roleOf(shipped, key).permissions).toContain("table:@jobs:read");
      expect(roleOf(shipped, key).tables?.find((g) => g.addOn === "customiser" && g.table === "designs")?.actions).toContain("read");
    }
    expect(panelsOf(shipped, "counter")).toEqual([]);
  });

  it("gives the owner, prepress and the press what the Customiser's job panel reads and writes, and the counter only the design", () => {
    type Grant = { addOn?: string; table: string; actions: string[] };
    const tablesOf = (key: string) => Object.fromEntries((roleOf(shipped, key).tables as Grant[]).filter((g) => g.addOn === "customiser").map((g) => [g.table, g.actions]));
    const reads = ["designs", "bases", "ready_designs", "ready_parts", "base_areas", "base_pieces", "palettes", "palette_colours", "fonts"];
    for (const key of ["owner", "prepress", "press"]) {
      const held = tablesOf(key);
      for (const table of reads) expect(held[table], `${key} reads ${table}`).toContain("read");
      // The customer's words, logo and photo in clear; the version's old files taken away when the files are made again.
      expect(held["designs"], key).toEqual(["read", "read_pii"]);
      expect(held["design_versions"], key).toEqual(["read", "read_pii", "create", "update"]);
      expect(held["version_files"], key).toEqual(["read", "create", "update", "delete"]);
      if (key !== "owner") expect(held["features"], key).toEqual(["read"]);
      // The starter fonts the panel prints with are handed out beside the set-up page.
      expect(roleOf(shipped, key).permissions, key).toContain("page:@customiser:view");
      // A role holds up to twenty-four of the add-ons' tables: Inventory's stock is read beside the panel's.
      const all = (roleOf(shipped, key).tables ?? []) as Grant[];
      expect(all.length, key).toBeLessThanOrEqual(24);
      expect(all.filter((g) => g.addOn === "inventory").map((g) => g.table), key).toEqual(["links", "stock_points"]);
    }
    expect((roleOf(shipped, "owner").tables as Grant[]).filter((g) => g.addOn === "shipping-dhl").map((g) => g.table)).toEqual(["shipments"]);
    expect(tablesOf("counter")).toEqual({ designs: ["read"] });
    expect(roleOf(shipped, "counter").permissions).not.toContain("page:@customiser:view");
  });

  // The Customiser keeps these back from an app's role today (its `appGrants`): asked, so the owner holds them once it lets them.
  it("asks for the owner everything the Customiser's set-up page reads and writes, its settings among them", () => {
    type Grant = { addOn?: string; table: string; actions: string[] };
    const held = Object.fromEntries((roleOf(shipped, "owner").tables as Grant[]).filter((g) => g.addOn === "customiser").map((g) => [g.table, g.actions]));
    for (const table of ["bases", "base_areas", "base_pieces", "fonts", "palettes", "palette_colours", "features"]) expect(held[table], table).toEqual(["read", "create", "update", "delete"]);
    for (const table of ["ready_designs", "ready_parts", "settings"]) expect(held[table], table).toEqual(["read"]);
    expect(roleOf(shipped, "owner").permissions).toContain("page:@customiser:view");
  });

  it("lets the owner, and no floor role, find and erase a customer's data", () => {
    expect(roleOf(shipped, "owner").permissions).toContain("privacy:@:people");
    for (const key of ["prepress", "press", "counter"]) expect(roleOf(shipped, key).permissions.filter((p) => p.startsWith("privacy:")), key).toEqual([]);
  });

  it("opens the Jobs list on the order's number and customer, the product, its quantity, its stage, its proof and its day", () => {
    const jobs = (shipped["pages"] as { ref: string; config: Json }[]).find((p) => p.ref === "printing-jobs")!;
    expect(jobs.config["columns"]).toEqual(["order_number", "order_id", "product_name", "qty", "stage", "proof_state", "ready_by"]);
  });

  it("gives the owner Holiday calendars' settings, and no other role", () => {
    expect(roleOf(shipped, "owner").permissions).toContain("addOn:holiday-calendars:settings");
    for (const key of ["prepress", "press", "counter"]) expect(roleOf(shipped, key).permissions.filter((p) => p.startsWith("addOn:"))).toEqual([]);
  });

  it("follows a person into their designs' logo, photo, versions and files", () => {
    expect(copiesOf(shipped)).toEqual(["designs.email", "designs.values", "designs.logo_file", "designs.photo_file", "design_versions.values", "design_versions.proof_file", "version_files.file"]);
  });

  it("links a closure to the public holiday it was added for, and lets the owner read those holidays", () => {
    const closures = ((shipped["requiredSchema"] as { tables: { ref: string; columns: Json[] }[] }).tables.find((t) => t.ref === "closures")!).columns;
    expect(closures.find((c) => c["ref"] === "holiday_id")).toMatchObject({ type: "int", nullable: true, rules: { addOnLink: { addOn: "holiday-calendars", table: "holidays" } } });
    expect(roleOf(shipped, "owner").tables).toContainEqual({ addOn: "holiday-calendars", table: "holidays", actions: ["read"] });
    const suggests = (shipped["addOns"] as { suggests: { key: string; range: string }[] }).suggests;
    expect(suggests.find((s) => s.key === "holiday-calendars")?.range).toBe("^1.0.19");
  });

  it("is refused by the validator at an older floor, so its words cannot ship on a release that cannot read them", () => {
    expect(validateManifest({ ...shipped, compatibility: { ...(shipped["compatibility"] as Json), minAdminiumVersion: OLDER } }).ok).toBe(false);
  });
});

describe(`the same modules at a floor before ${PANELS_AND_COPIES}`, () => {
  const older = buildManifest({ floor: OLDER });

  it("say none of the panels' grants or the copies into the versions", () => {
    for (const role of ["owner", "prepress", "press", "counter"]) expect(panelsOf(older, role)).toEqual([]);
    expect(copiesOf(older)).toEqual(["designs.email", "designs.values"]);
  });
});
