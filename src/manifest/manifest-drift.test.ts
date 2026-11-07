/**
 * `manifest.json` is written from `src/manifest/` (`npm run manifest`), and
 * this is what keeps the two from drifting: an edit to a module that was not
 * written out, or a hand edit to the file, fails here with the fix named.
 *
 * It also holds the manifest's own promises that the validator cannot see:
 * every total and date is Adminium's; a job's options are its own product's;
 * a customer reads nothing of anybody else's and nothing the works keeps to
 * itself; the Customiser is bound as its README asks; the works' roles write
 * only what their work needs.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { buildManifest, CUSTOMER_ROUTES, manifestText } from "./build.ts";
import { untranslated } from "./labels.ts";
import { VERSION_COPIES } from "./people.ts";
import { DESIGN_POSTING } from "./postings.ts";
import { CONFIG_SELECT, CONFIG_WRITABLE, JOB_SELECT, PUBLIC_REFS } from "./public.ts";
import { DECIDING_RULES } from "./roles.ts";
import { BREAKDOWN, PRICED } from "./tables.ts";
import UNTRANSLATED from "./untranslated-labels.json" with { type: "json" };

const FILE = join(__dirname, "..", "..", "manifest.json");

type Json = Record<string, unknown>;
type Entry = Json & { table: string; methods: string[]; key?: string; select?: string[]; writable?: string[] };
const manifest = buildManifest() as Json & {
  requiredSchema: { prefixed: boolean; tables: (Json & { ref: string; columns: (Json & { ref: string })[] })[] };
  publicAccess: Entry[];
  roles: (Json & { key: string; permissions: string[]; limits?: Record<string, Json>; tables?: Json[] })[];
  addOns: { requires: Json[]; suggests: Json[] };
  people: (Json & { copies: Json[] })[];
  outbox: Json & { classes: Record<string, string>; kinds: Record<string, string> };
};
const table = (ref: string) => manifest.requiredSchema.tables.find((t) => t.ref === ref)!;
const column = (t: string, c: string) => table(t).columns.find((col) => col.ref === c)!;
const rules = (t: string, c: string) => (column(t, c)["rules"] ?? {}) as Json;
const role = (key: string) => manifest.roles.find((r) => r.key === key)!;
const create = (t: string) => manifest.publicAccess.find((e) => e.table === t && e.methods.includes("POST"))!;

describe("manifest.json is what src/manifest/ writes", () => {
  it("is byte for byte the modules' output — run `npm run manifest` after changing them", () => {
    expect(readFileSync(FILE, "utf8") === manifestText()).toBe(true);
  });

  it("is prefixed, keyed printing, at 0.2.1, and needs the engine that reads its rules", () => {
    expect(manifest.requiredSchema.prefixed).toBe(true);
    expect(manifest["key"]).toBe("printing");
    expect(manifest["version"]).toBe("0.2.1");
    expect((manifest["compatibility"] as Json)["minAdminiumVersion"]).toBe("0.3.49");
    // Both sides may be installed once per database.
    expect((manifest["frontends"] as Json[]).map((f) => [f["side"], f["instances"]])).toEqual([["staff", true], ["customer", true]]);
  });

  it("holds its English-only labels to the list recorded, so a new one cannot slip in untranslated", () => {
    buildManifest();
    expect(untranslated()).toEqual(UNTRANSLATED);
  });
});

describe("the tables of the rate card, the orders and the works", () => {
  it("has every table, by its ref", () => {
    expect(manifest.requiredSchema.tables.map((t) => t.ref)).toEqual([
      "settings",
      "materials",
      "sizes",
      "finishes",
      "breaks",
      "packaging",
      "delivery_bands",
      "products",
      "options",
      "option_rules",
      "machines",
      "closures",
      "customers",
      "orders",
      "jobs",
      "job_features",
      "artwork",
      "proofs",
      "spoils",
      "saved_quotes",
      "quote_lines",
      "sample_requests",
      "sample_stocks",
      "messages",
    ]);
  });

  it("prices every line, and decides how an order travels, from the rate card: no figure a person types", () => {
    for (const name of PRICED) {
      const [t, c] = name.split(".") as [string, string];
      expect(DECIDING_RULES.filter((rule) => rules(t, c)[rule] !== undefined), name).toEqual(["formula"]);
    }
    // Every amount of a line's breakdown is Adminium's, and a customer reads each one.
    for (const t of ["jobs", "quote_lines"]) {
      for (const c of BREAKDOWN) expect(DECIDING_RULES.some((rule) => rules(t, c)[rule] !== undefined) || rules(t, c)["default"] !== undefined, `${t}.${c}`).toBe(true);
    }
    for (const c of BREAKDOWN) expect(CONFIG_SELECT, c).toContain(c);
    for (const c of BREAKDOWN) expect(CONFIG_WRITABLE, c).not.toContain(c);
    expect(rules("orders", "goods_sum")["rollup"]).toEqual({ from: "jobs", via: "order_id", sum: "price", unlessSet: "cancelled_at" });
    expect(rules("orders", "weight_kg")["rollup"]).toEqual({ from: "jobs", via: "order_id", sum: "weight_kg", unlessSet: "cancelled_at" });
    expect(rules("saved_quotes", "goods_sum")["rollup"]).toEqual({ from: "quote_lines", via: "quote_id", sum: "price" });
  });

  it("charges a job for the design's priced features it pays for, before express and at the next break alike", () => {
    expect(rules("jobs", "features_charge")["rollup"]).toEqual({ from: "job_features", via: "job_id", sum: "price" });
    expect(rules("job_features", "price")["copy"]).toEqual({ via: "option_id", from: "price", mode: "always" });
    expect(JSON.stringify(rules("jobs", "before_express")["formula"])).toContain('{"coalesce":["features_charge",0]}');
    expect(JSON.stringify(rules("jobs", "next_work")["formula"])).toContain('{"coalesce":["features_charge",0]}');
    // A saved quote's line pays for no feature: it has no such column.
    expect(table("quote_lines").columns.map((c) => c.ref)).not.toContain("features_charge");
    expect(JOB_SELECT).toContain("features_charge");
  });

  it("leaves a cancelled job out of its order's money, weight, parcel and ready-by, its invoice and its e-mails", () => {
    expect((rules("jobs", "cancelled_at")["stamp"] as Json)["on"]).toEqual({ column: "stage", values: ["cancelled"] });
    const rolled = table("orders").columns.filter((c) => ((c["rules"] as Json | undefined)?.["rollup"] as Json | undefined)?.["from"] === "jobs");
    const left = rolled.filter((c) => ((c["rules"] as Json)["rollup"] as Json)["unlessSet"] !== "cancelled_at").map((c) => c.ref);
    // Its floor count is the jobs still on the floor (a cancelled job is not), its warnings the customer's own.
    expect(left.sort()).toEqual(["jobs_on_floor", "warnings_accepted"]);
    expect(rolled.length).toBeGreaterThan(left.length + 6);
    const invoice = ((manifest["documents"] as Json[])[0]!["mapping"] as Json)["items"] as { collections: Json[] };
    expect(invoice.collections[0]!["unless"]).toBe("cancelled_at");
    const lists: Json[] = [];
    const walk = (v: unknown): void => {
      if (Array.isArray(v)) v.forEach(walk);
      else if (v !== null && typeof v === "object") {
        const o = v as Json;
        if (o["table"] === "jobs" && o["via"] === "order_id" && o["link"] === "order") lists.push(o);
        Object.values(o).forEach(walk);
      }
    };
    walk(manifest["emailTemplates"]);
    expect(lists.length).toBeGreaterThan(0);
    for (const from of lists) expect(from["where"]).toEqual({ column: "stage", in: ["prepress", "printing", "finishing", "ready", "collected", "dispatched"] });
  });

  it("works a large-format run's area from its own size and rounds it once; a piece's area is for the quote's words", () => {
    for (const t of ["jobs", "quote_lines"]) {
      expect(rules(t, "area_total")["formula"], t).toEqual({ round: [{ div: [{ mul: ["width_mm", "height_mm", "qty"] }, 1000000] }, 2] });
      expect(JSON.stringify(rules(t, "area_total")["formula"])).not.toContain("area_each");
    }
  });

  it("asks a sheet line for its size and a large-format line for its width and height, by the product's kind", () => {
    for (const t of ["jobs", "quote_lines"]) {
      expect(rules(t, "product_kind")["copy"], t).toEqual({ via: "product_id", from: "kind", mode: "always" });
      expect(rules(t, "size_option_id")["requiredWhen"], t).toEqual({ column: "product_kind", in: ["sheet"] });
      for (const c of ["width_mm", "height_mm"]) expect(rules(t, c)["requiredWhen"], `${t}.${c}`).toEqual({ column: "product_kind", in: ["large"] });
    }
  });

  it("never lets a line with no price drop out of the goods: they, the tax and the total go empty instead", () => {
    for (const [t, lines] of [["orders", "jobs"], ["saved_quotes", "quote_lines"]] as const) {
      expect(rules(lines, "priced")["formula"]).toEqual({ if: [{ isNull: "price" }, 0, 1] });
      expect((rules(t, "priced_lines")["rollup"] as Json)["sum"]).toBe("priced");
      expect(rules(t, "goods_total")["formula"]).toEqual({ if: [{ lt: [{ coalesce: ["priced_lines", 0] }, { coalesce: ["item_count", 0] }] }, { div: [0, 0] }, { coalesce: ["goods_sum", 0] }] });
      // Nothing after the goods reads an empty one as nought.
      const reads = (c: string) => JSON.stringify(rules(t, c)["formula"]);
      expect(reads("subtotal")).not.toContain('"coalesce":["goods_total"');
      expect(reads("tax")).not.toContain('"coalesce":["subtotal"');
      expect(reads("total")).not.toContain('"coalesce":["subtotal"');
    }
    expect(JSON.stringify(rules("orders", "quote_tax")["formula"])).not.toContain('"coalesce":["goods_total"');
  });
});

describe("every total, number and date is Adminium's", () => {
  it("holds a job's options to its own product's, a lamination to a coated stock and a spot UV to a lamination", () => {
    for (const t of ["jobs", "quote_lines"]) {
      for (const [link, kind] of [["material_option_id", "material"], ["size_option_id", "size"], ["sides_option_id", "sides"], ["corners_option_id", "corners"]] as const) {
        expect(rules(t, link)["linkable"]).toEqual({
          where: [{ column: "kind", eq: kind }, { column: "active", eq: true }],
          same: [{ column: "product_id", as: "product_id" }],
        });
      }
      expect((rules(t, "lamination_option_id")["linkable"] as Json)["same"]).toContainEqual({ column: "coated", as: "material_option_id.coated" });
      expect((rules(t, "spot_uv_option_id")["linkable"] as Json)["same"]).toContainEqual({ column: "coated", as: "lamination_option_id.coated" });
      expect(rules(t, "material_id")["copy"]).toEqual({ via: "material_option_id", from: "material_id", mode: "always" });
    }
    expect(rules("job_features", "option_id")["linkable"]).toEqual({
      where: [{ column: "kind", eq: "feature" }, { column: "active", eq: true }],
      same: [{ column: "product_id", as: "job_id.product_id" }],
    });
  });

  it("dates a job's ready-by in working days, with the cut-off and the closures, counted again on a change or an approval", () => {
    const set = ((rules("jobs", "ready_by")["stamp"] as Json)["set"] as Json)["addWorkingDays"];
    expect(set).toEqual({
      from: "now",
      days: "turnaround_days",
      weekdays: "working_days",
      cutoff: "cutoff",
      closures: { table: "closures", from: "from_date", to: "to_date", active: "active" },
    });
    expect((rules("jobs", "ready_by")["stamp"] as Json)["on"]).toEqual(["create", { column: "proof_state", values: ["approved"] }, { columns: ["turnaround_days"] }]);
    expect(rules("orders", "ready_by")["rollup"]).toEqual({ from: "jobs", via: "order_id", latest: { of: "ready_by", by: "ready_by" }, unlessSet: "cancelled_at" });
    const settings = manifest["settings"] as Json[];
    expect(settings.map((s) => [s["key"], s["default"]])).toEqual([["working_days", "mon,tue,wed,thu,fri"], ["cutoff", "14:00"]]);
  });

  it("numbers orders MP- and saved quotes MQ- without gaps, each its own series", () => {
    expect(rules("orders", "number_seq")["sequence"]).toEqual({ gapless: true, startSetting: { table: "settings", column: "first_order_number" } });
    expect(rules("orders", "number")["format"]).toEqual({ from: "number_seq", prefixSetting: { table: "settings", column: "ref_prefix" } });
    expect(rules("saved_quotes", "number_seq")["sequence"]).toEqual({ gapless: true, startSetting: { table: "settings", column: "first_quote_number" } });
    expect(rules("saved_quotes", "number")["format"]).toEqual({ from: "number_seq", prefixSetting: { table: "settings", column: "quote_prefix" } });
  });

  it("charges one delivery band on the basket's weight, and leaves an order over the top band to quote", () => {
    expect(rules("orders", "delivery_band_id")["band"]).toEqual({
      table: "delivery_bands",
      min: "min_kg",
      max: "max_kg",
      value: "weight_kg",
      scope: [{ column: "tube", equals: "tube" }],
      over: "empty",
    });
    expect(rules("orders", "tax_rate")["default"]).toEqual({ from: { table: "settings", column: "tax_rate" } });
  });

  it("ties a proof and a spoilage to their job's own order, which nobody types", () => {
    for (const t of ["proofs", "spoils"]) expect(rules(t, "order_id")["copy"], t).toEqual({ via: "job_id", from: "order_id", mode: "always" });
    expect((role("prepress").limits!["proofs"]!["creatable"] as string[])).not.toContain("order_id");
  });

  it("keeps nothing from the press before its proof is approved", () => {
    const moves = (table("jobs")["states"] as Json)["moves"] as Record<string, unknown[]>;
    expect(moves["prepress"]![0]).toEqual({ to: "printing", requires: { where: [{ column: "proof_ok", eq: 1 }] } });
  });

  it("takes artwork from a guest as PDF, TIFF or JPEG, up to 100 MB", () => {
    expect((rules("artwork", "file")["file"] as Json)).toEqual({
      accept: ["pdf", "jpeg", "tiff"],
      maxBytes: 104857600,
      upload: { kinds: ["pdf", "jpg", "tiff"], maxBytes: 104857600 },
    });
    const artwork = ((create("orders")["children"] as Json)["jobs"] as Json)["children"] as Record<string, Json>;
    expect(artwork["artwork"]!["uploads"]).toEqual(["file"]);
  });
});

describe("the Customiser is bound as its README asks", () => {
  it("requires it at the release that carries it, suggests neither Design Studio nor the Canva import, and names the page its saved-design mail opens", () => {
    expect(manifest.addOns.requires).toEqual([expect.objectContaining({ key: "customiser", range: "^1.0.19" })]);
    expect(manifest.addOns.suggests.map((s) => s["key"])).toEqual(["shipping-dhl", "inventory", "invoices", "holiday-calendars"]);
    expect(CUSTOMER_ROUTES.customiserDesign).toBe("/design");
  });

  it("links a product to its base, a feature option to its feature, and a job to its design by the design's code only", () => {
    expect(rules("products", "base_id")["addOnLink"]).toEqual({ addOn: "customiser", table: "bases" });
    expect(rules("options", "feature_id")["addOnLink"]).toEqual({ addOn: "customiser", table: "features" });
    expect(rules("jobs", "design_id")).toEqual({
      addOnLink: { addOn: "customiser", table: "designs" },
      lookup: { from: "design_code", table: { addOn: "customiser", table: "designs" }, column: "code" },
    });
    const jobs = (create("orders")["children"] as Json)["jobs"] as Json;
    expect(jobs["writable"]).toContain("design_code");
    expect(jobs["writable"]).not.toContain("design_id");
  });

  it("checks the design a job names against the features it pays for, and posts it when the job is made", () => {
    expect(table("jobs")["check"]).toEqual({ by: { addOn: "customiser" }, design: "design_id", paid: { table: "job_features", via: "job_id", feature: "feature" } });
    expect(table("jobs")["postings"]).toEqual([DESIGN_POSTING]);
  });

  it("names its feature options in the table the Customiser reads prices from, `printing:options`", () => {
    expect(column("options", "price")["type"]).toBe("decimal");
    expect(column("options", "feature_id")["rules"]).toEqual({ addOnLink: { addOn: "customiser", table: "features" } });
  });

  it("copies a person onto the designs their jobs name, and on into those designs' versions and files", () => {
    const copies = manifest.people[0]!.copies.filter((c) => c["addOn"] === "customiser");
    expect(copies).toEqual([
      { addOn: "customiser", table: "designs", column: "email", holds: "email", via: "jobs.design_id" },
      { addOn: "customiser", table: "designs", column: "values", holds: "details", via: "jobs.design_id" },
      ...VERSION_COPIES,
    ]);
  });
});

describe("a customer reads nothing of anyone else's, and nothing the works keeps", () => {
  const NEVER = ["link_token", "client_key", "customer_id", "number_seq", "number_code", "handed_over_by", "printed_by", "sent_by", "posted_by", "works_note", "may_email", "spoiled_sheets", "address_key"];
  const selects = (e: Json): string[] => [
    ...((e["select"] as string[] | undefined) ?? []),
    ...Object.values((e["children"] ?? {}) as Record<string, Json>).flatMap((child) => [
      ...((child["select"] as string[] | undefined) ?? []),
      ...Object.values((child["children"] ?? {}) as Record<string, Json>).flatMap((grand) => (grand["select"] as string[] | undefined) ?? []),
    ]),
  ];

  it("never selects a link code, a retry key, a stamp of who, or a works note", () => {
    for (const entry of manifest.publicAccess) {
      for (const name of NEVER) expect(selects(entry), `${entry.table} ${entry.methods.join(",")}`).not.toContain(name);
    }
  });

  it("never lets a customer write a price, a weight or the tube", () => {
    for (const writable of [CONFIG_WRITABLE, (create("orders")["writable"] as string[]), (create("saved_quotes")["writable"] as string[])]) {
      for (const name of ["price", "weight_kg", "tube"]) expect(writable).not.toContain(name);
    }
  });

  it("leaves the DHL service to the counter: no customer write names it", () => {
    for (const entry of manifest.publicAccess) expect(entry.writable ?? [], `${entry.table} ${entry.methods.join(",")}`).not.toContain("dhl_service");
    expect(role("counter").limits!["orders"]!["writable"]).toContain("dhl_service");
  });

  it("reads orders and quotes only through a signed-in customer, or one by its own link", () => {
    for (const entry of manifest.publicAccess.filter((e) => ["orders", "saved_quotes"].includes(e.table) && e.methods.includes("GET"))) {
      const claimed = entry["claimedBy"] !== undefined && entry["level"] === "verified";
      const own = (entry.key === "order" || entry.key === "quote") && (entry["claim"] as Json | undefined)?.["own"] === true;
      expect(claimed || own, `${entry.table} ${entry.key ?? "customer"}`).toBe(true);
    }
  });

  it("answers a proof only to approve it or ask for a change, while it waits", () => {
    const answers = manifest.publicAccess.filter((e) => e.table === "proofs");
    expect(answers.map((e) => e.key ?? "customer")).toEqual(["customer", "order"]);
    for (const entry of answers) {
      expect(entry["writable"]).toEqual(["state", "change_note"]);
      expect(entry["writableValues"]).toEqual({ state: ["approved", "change_asked"] });
      expect(entry["writableWhen"]).toEqual({ state: ["sent"] });
    }
  });

  it("answers a delivery quote only to accept it or collect instead, while it is sent", () => {
    const answers = manifest.publicAccess.filter((e) => e.table === "orders" && e.methods.includes("PATCH"));
    expect(answers.map((e) => e.key ?? "customer")).toEqual(["customer", "order"]);
    for (const entry of answers) {
      expect(entry["writableValues"]).toEqual({ delivery_quote_state: ["accepted"], delivery_method: ["collect"] });
      expect(entry["writableWhen"]).toEqual({ delivery_quote_state: ["sent"] });
    }
  });

  it("holds an accepted delivery quote to its amount: no writer changes it or takes it back once accepted", () => {
    const until = { while: { column: "delivery_quote_accepted_at", isNull: true } };
    expect(rules("orders", "delivery_quote")["changes"]).toEqual([until]);
    expect(rules("orders", "delivery_quote_state")["changes"]).toEqual([{ to: ["to_quote", "sent"], ...until }]);
    expect((rules("orders", "delivery_quote_accepted_at")["stamp"] as Json)["on"]).toEqual({ column: "delivery_quote_state", values: ["accepted"] });
  });

  it("places an order with a retry key, a quote first, and a refusal if the total moved", () => {
    const placed = create("orders");
    expect([placed["dryRun"], placed["expect"], placed["clientKey"], placed["humanCheck"]]).toEqual([true, "total", "client_key", true]);
    expect((placed["consent"] as Json)["column"]).toBe("may_email");
  });

  it("sends one sample pack to an address", () => {
    expect(column("sample_requests", "address_key")["unique"]).toBe(true);
    expect(rules("sample_requests", "address_key")).toEqual({ formula: { join: ["postcode", "address_line1"] }, normalize: "code" });
  });
});

describe("the customer side's pages call each entry by the ref Adminium gives it", () => {
  it("names every entry, in order, as Adminium names them", () => {
    const taken = new Set<string>();
    const refs = manifest.publicAccess.map((entry) => {
      const real = `printing_${entry.table}`;
      const reached = entry["claimedBy"] !== undefined || entry["visibleWith"] !== undefined;
      const base = entry["claim"] !== undefined || (reached && entry["level"] !== "verified") ? `${real}_claimed` : reached ? `${real}_verified` : real;
      let ref = base;
      for (let n = 2; taken.has(ref); n += 1) ref = `${base}_${String(n)}`;
      taken.add(ref);
      return ref;
    });
    expect(Object.values(PUBLIC_REFS)).toEqual(refs);
  });
});

describe("the e-mails", () => {
  it("sends the customer service mail only, and copies to the works unclassed", () => {
    expect(manifest.outbox.classes).toEqual({
      "order-received": "service",
      "proof-ready": "service",
      "proof-approved": "service",
      "order-ready": "service",
      "order-dispatched": "service",
      "quote-saved": "service",
      "sample-pack-sent": "service",
      "delivery-quote": "service",
    });
    expect(Object.keys(manifest.outbox.kinds)).toContain("change-asked");
    expect(Object.keys(manifest.outbox.kinds)).toContain("warnings-accepted");
  });
});

describe("the works writes only what its work needs", () => {
  it("keeps prepress, press and counter on the works' screens", () => {
    for (const key of ["prepress", "press", "counter"]) expect(role(key)["screensOnly"], key).toBe(true);
    expect(role("owner")["screensOnly"]).toBeUndefined();
  });

  it("reads the design a job names, for every role that sees jobs", () => {
    for (const key of ["owner", "prepress", "press", "counter"]) {
      const designs = (role(key).tables ?? []).find((g) => g["addOn"] === "customiser" && g["table"] === "designs");
      expect(designs?.["actions"], key).toContain("read");
    }
  });

  it("never lets a role write a total, a date Adminium works out, or the customer's own tick", () => {
    for (const key of ["owner", "prepress", "press", "counter"]) {
      for (const [ref, limit] of Object.entries(role(key).limits ?? {})) {
        for (const list of ["writable", "creatable"] as const) {
          const named = (limit[list] as string[] | undefined) ?? [];
          for (const c of named) {
            const r = rules(ref, c);
            expect(DECIDING_RULES.filter((k) => r[k] !== undefined), `${key} ${ref}.${c}`).toEqual([]);
          }
          if (ref === "orders" || ref === "saved_quotes") expect(named, key).not.toContain("may_email");
        }
      }
    }
  });

  it("shows a customer's e-mail and address only to the owner and the counter, who hand the order over", () => {
    const readers = manifest.roles.filter((r) => r.permissions.includes("table:@orders:read_pii")).map((r) => r.key);
    expect(readers).toEqual(["owner", "counter"]);
    // The name the board and the proof sheet say is no personal column, so prepress and the press read it without.
    expect(column("orders", "name")["semantic"]).toBe("name");
    expect(rules("orders", "name")["personal"]).toBeUndefined();
  });

  it("leaves the rate card to the owner", () => {
    for (const key of ["prepress", "press", "counter"]) {
      for (const t of ["settings", "materials", "sizes", "finishes", "breaks", "packaging", "delivery_bands", "products", "options", "option_rules"]) {
        expect(role(key).permissions, `${key} ${t}`).not.toContain(`table:@${t}:update`);
      }
    }
  });
});
