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

  it("ships at 0.3.53, which reads the panels' grants, the copies into the versions, a role's personal columns and deletes, the owner's erase, installs the app once per database, sends a proof's earlier one again, installs the Customiser whose set-up the owner opens, tells the counter which add-ons it has, and keeps a ready-by from moving earlier", () => {
    expect(MIN_ADMINIUM).toBe("0.3.53");
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

  // The Customiser's `appGrants` (add-ons 1.0.21) let an app's role hold all of this: the owner sets the shop up on their own role.
  it("gives the owner everything the Customiser's set-up page reads and writes, and no more than the add-on lets an app's role hold", () => {
    type Grant = { addOn?: string; table: string; actions: string[] };
    const tables = roleOf(shipped, "owner").tables as Grant[];
    const held = Object.fromEntries(tables.filter((g) => g.addOn === "customiser").map((g) => [g.table, g.actions]));
    for (const table of ["base_areas", "base_pieces", "ready_designs", "ready_parts", "fonts", "palettes", "palette_colours", "features"]) expect(held[table], table).toEqual(["read", "create", "update", "delete"]);
    // A base is added and changed on the set-up page, never taken away by an app's role.
    expect(held["bases"]).toEqual(["read", "create", "update"]);
    // The set-up page's Shop settings (add-ons 1.0.23): read, and changed column by column.
    expect(held["settings"]).toEqual(["read", "update"]);
    // The set-up page asks whether a customer's design came from a ready-made design before it removes one.
    expect(held["designs"]).toContain("read");
    expect(Object.keys(held).length).toBe(13);
    // Each write names the columns the add-on's `appGrants` give an app's role, so the install keeps nothing back: every column of the row, its app given once.
    type Limited = Grant & { limit?: { creatable: string[]; writable: string[] } };
    const limits = Object.fromEntries((tables as Limited[]).filter((g) => g.addOn === "customiser").map((g) => [g.table, g.limit]));
    for (const table of ["bases", "base_areas", "base_pieces", "ready_designs", "ready_parts", "fonts", "palettes", "palette_colours", "features"]) {
      expect(limits[table]?.creatable[0], table).toBe("app");
      // Whether a font is a starter is given on a new font and never changed.
      expect(limits[table]?.creatable.slice(1).filter((c) => !(table === "fonts" && c === "starter")), table).toEqual(limits[table]?.writable);
      expect(limits[table]?.writable, table).not.toContain("app");
    }
    expect(limits["fonts"]?.creatable).toContain("starter");
    expect(limits["fonts"]?.writable).not.toContain("starter");
    const own = { reach: "all", while: { column: "app", in: ["printing"] } };
    expect(limits["features"]).toEqual({ creatable: ["app", "code", "name", "active"], writable: ["code", "name", "active"], creatableValues: { app: ["printing"] }, rows: { read: own, update: own, delete: own } });
    expect(tables.length).toBeLessThanOrEqual(24);
    expect(roleOf(shipped, "owner").permissions).toContain("page:@customiser:view");
  });

  // With the Maker Shop on the same install, its owner and this one share the Customiser's set-up tables.
  it("lets the owner read, add, change and remove only the print shop's own set-up rows, never another shop's", () => {
    type Limit = { creatableValues?: Record<string, unknown[]>; rows?: Record<string, unknown> };
    const tables = roleOf(shipped, "owner").tables as { addOn?: string; table: string; actions: string[]; limit?: Limit }[];
    const limits = Object.fromEntries(tables.filter((g) => g.addOn === "customiser").map((g) => [g.table, { actions: g.actions, limit: g.limit }]));
    const own = { reach: "all", while: { column: "app", in: ["printing"] } };
    for (const table of ["bases", "base_areas", "base_pieces", "ready_designs", "ready_parts", "fonts", "palettes", "palette_colours", "features"]) {
      const { actions, limit } = limits[table]!;
      // A new font is never one of the install's starters.
      expect(limit?.creatableValues, table).toEqual(table === "fonts" ? { app: ["printing"], starter: [false] } : { app: ["printing"] });
      // The starter fonts belong to no shop (an empty app, which no value limit names): read and changed by `starter`, never removed.
      const mine = table === "fonts" ? [own, { reach: "all", while: { column: "starter", in: [true] } }] : own;
      expect(limit?.rows, table).toEqual({ read: mine, update: mine, ...(actions.includes("delete") ? { delete: own } : {}) });
    }
    expect(limits["bases"]!.actions).not.toContain("delete");
    // The install's one row of settings: read, and changed column by column (never the unit, the shopper's own).
    expect(limits["settings"]).toEqual({ actions: ["read", "update"], limit: { writable: ["default_bleed_mm", "default_safe_mm", "one_colour_threshold", "smallest_line_mm", "min_dpi"] } });
  });

  // A customer's design, its versions and their files are the print shop's customers' alone, for every role that reaches them.
  it("keeps every role to the print shop's own customers' designs, versions and files, and tags a version it adds", () => {
    type Grant = { addOn?: string; table: string; actions: string[]; limit?: { creatableValues?: Record<string, unknown[]>; rows?: Record<string, unknown> } };
    const own = { reach: "all", while: { column: "app", in: ["printing"] } };
    for (const key of ["owner", "prepress", "press"]) {
      const held = Object.fromEntries(((roleOf(shipped, key).tables ?? []) as Grant[]).filter((g) => g.addOn === "customiser").map((g) => [g.table, g]));
      expect([held["designs"]?.actions, held["designs"]?.limit?.rows], key).toEqual([["read", "read_pii"], { read: own }]);
      expect([held["design_versions"]?.limit?.creatableValues, held["design_versions"]?.limit?.rows], key).toEqual([{ app: ["printing"] }, { read: own, update: own }]);
      expect([held["version_files"]?.limit?.creatableValues, held["version_files"]?.limit?.rows], key).toEqual([{ app: ["printing"] }, { read: own, update: own, delete: own }]);
      if (key !== "owner") for (const table of ["bases", "ready_designs", "ready_parts", "base_areas", "base_pieces", "palettes", "palette_colours", "fonts", "features", "settings"]) expect([table, held[table]?.actions, held[table]?.limit], key).toEqual([table, ["read"], undefined]);
    }
    const counter = ((roleOf(shipped, "counter").tables ?? []) as Grant[]).filter((g) => g.addOn === "customiser");
    expect(counter).toEqual([{ addOn: "customiser", table: "designs", actions: ["read"], limit: { rows: { read: own } } }]);
  });

  // The panel draws a one-colour picture to the shop's own line, as the shopper saw it: every role that opens it reads the settings.
  it("lets every role that makes a design's proof read the Customiser's settings", () => {
    const makers = Object.keys(ROLE_PANELS).filter((k) => ROLE_PANELS[k]!.includes("customiser-line"));
    expect(makers.sort()).toEqual(["owner", "prepress", "press"]);
    for (const key of makers) {
      const settings = (roleOf(shipped, key).tables ?? []).find((g) => g.addOn === "customiser" && g.table === "settings");
      expect(settings?.actions, key).toContain("read");
    }
    expect((roleOf(shipped, "counter").tables ?? []).find((g) => g.addOn === "customiser" && g.table === "settings")).toBeUndefined();
  });

  // From 0.3.50: a new proof sends the job's earlier one still out again in its own write, whoever makes it.
  it("sends a job's earlier proof still out again when a new one is made, and lets prepress change no proof", () => {
    const proofs = ((shipped["requiredSchema"] as { tables: { ref: string; states?: Json }[] }).tables.find((t) => t.ref === "proofs")!).states!;
    expect(proofs["supersedes"]).toEqual({ by: "job_id", from: ["sent", "change_asked"], to: "superseded" });
    expect(roleOf(shipped, "prepress").permissions).toContain("table:@proofs:create");
    expect(roleOf(shipped, "prepress").permissions).not.toContain("table:@proofs:update");
    expect(validateManifest({ ...shipped, compatibility: { ...(shipped["compatibility"] as Json), minAdminiumVersion: "0.3.49" } }).ok).toBe(false);
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
    expect(suggests.find((s) => s.key === "holiday-calendars")?.range).toBe("^1.0.25");
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
