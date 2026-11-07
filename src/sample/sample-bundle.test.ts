/**
 * THE SAMPLE FILES, THEIR SOURCE AND THE MANIFEST AGREE.
 *
 * `seeds/printing.sample.json` and `seeds/printing.customiser.sample.json`
 * are what an operator adds from Adminium. They are written from
 * `marlow-press.ts` (`npm run sample`); this fails when a file and the source
 * drift, puts both through the checks Adminium runs when they are added
 * (vendored with the rest of the manifest checks), and then checks what a
 * sample load cannot.
 *
 * The figures Adminium works out of these rows (an order's delivery band and
 * tax, the ready-by dates of a new order) are proved on a real install by the
 * engine's `print-rework-install.test.ts`; the dates written here for history
 * are held to the same working-day rule below.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { sampleText, sectionText } from "../../scripts/write-sample.ts";
import { sampleBundleIssues, sampleBundleSchema, sampleSectionIssues } from "../testing/manifest/sample.ts";
import type { AppManifest, Manifest } from "../testing/manifest/schema.ts";
import CUSTOMISER_ROWS from "./customiser-rows.json" with { type: "json" };
import { readyBy } from "./marlow-press.ts";

type Row = Record<string, unknown>;
interface Bundle {
  tables: { ref: string; own?: true; rows: Row[] }[];
}
const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");
const manifest = JSON.parse(read("../../manifest.json")) as Manifest & { sampleData: { file: string; addOns: Record<string, { file: string }> } };
const main = JSON.parse(read("../../seeds/printing.sample.json")) as Bundle;
const section = JSON.parse(read("../../seeds/printing.customiser.sample.json")) as Bundle;
const rowsOf = (bundle: Bundle, ref: string) => bundle.tables.find((t) => t.ref === ref)?.rows ?? [];
const refOf = (value: unknown) => (value as { "@ref": string } | null)?.["@ref"];

describe("the sample files are what their source writes", () => {
  it("are byte for byte `marlow-press.ts`'s bundles — run `npm run sample` after changing it", () => {
    expect(read("../../seeds/printing.sample.json") === sampleText()).toBe(true);
    expect(read("../../seeds/printing.customiser.sample.json") === sectionText()).toBe(true);
  });

  it("are the files the manifest names", () => {
    expect(manifest.sampleData.file).toBe("seeds/printing.sample.json");
    expect(manifest.sampleData.addOns).toEqual({ customiser: { file: "seeds/printing.customiser.sample.json" } });
  });

  it("carry the Customiser's own rows for Marlow Press as it ships them, each design version labelled", () => {
    for (const table of CUSTOMISER_ROWS.tables) {
      const ours = section.tables.find((t) => t.ref === table.ref)!.rows;
      const unlabelled = table.ref === "design_versions" ? ours.map(({ "@label": _label, ...rest }) => rest) : ours;
      expect(unlabelled, table.ref).toEqual(table.rows);
    }
  });
});

describe("Adminium would add them", () => {
  it("are well-formed adminium.sample/1 bundles", () => {
    expect(sampleBundleSchema.safeParse(main).success).toBe(true);
    expect(sampleBundleSchema.safeParse(section).success).toBe(true);
  });

  it("pass the checks Adminium runs before it adds them", () => {
    expect(sampleBundleIssues(main as never, manifest)).toEqual([]);
    expect(sampleSectionIssues(section as never, manifest as AppManifest)).toEqual([]);
  });
});

describe("the rate card is the comp's", () => {
  it("prices the stocks, the finishes by sides, the breaks and the bands as the rate card does", () => {
    const rate = (code: string) => rowsOf(main, "materials").find((m) => m["code"] === code)!["rate"];
    expect([rate("silk350"), rate("uncoated300"), rate("silk170"), rate("silk130"), rate("pvc510"), rate("vinyl")]).toEqual([0.42, 0.38, 0.14, 0.11, 28, 34]);
    expect(rowsOf(main, "finishes").filter((f) => f["group"] === "lamination").map((f) => [f["code"], f["price"]])).toEqual([
      ["lam-one", 0.55],
      ["lam-both", 0.95],
      ["lam-soft", 1.2],
    ]);
    const breaks = rowsOf(main, "breaks");
    expect(breaks.map((b) => [b["min_qty"], b["multiplier"]]).reverse()).toEqual([[25, 1], [50, 0.92], [100, 0.84], [250, 0.74], [500, 0.66], [1000, 0.58]]);
    // Each break names the one above it, which goes in before it; the top one names none.
    expect(breaks.map((b) => [b["@label"], b["next_id"] === null ? null : refOf(b["next_id"])])).toEqual([
      ["break:1000", null],
      ["break:500", "break:1000"],
      ["break:250", "break:500"],
      ["break:100", "break:250"],
      ["break:50", "break:100"],
      ["break:25", "break:50"],
    ]);
    expect(rowsOf(main, "settings")[0]).toMatchObject({ print_single: 0.85, print_double: 1.2 });
    expect(rowsOf(main, "delivery_bands").map((b) => [b["code"], b["max_kg"], b["price"]])).toEqual([["light", 2, 6.5], ["mid", 10, 9.8], ["heavy", 30, 16.4], ["tube", 30, 14]]);
    expect(rowsOf(main, "settings")[0]).toMatchObject({ setup: 18, tax_rate: 20, express_percent: 35, proof_post_price: 12, proof_post_days: 2, standard_days: 3, express_days: 1, large_format_minimum: 35 });
  });

  it("offers each product only its own options, a lamination and a spot UV on a coated surface", () => {
    const options = rowsOf(section, "options");
    const of = (pid: string, kind: string) => options.filter((o) => refOf(o["product_id"]) === `product:${pid}` && o["kind"] === kind).map((o) => o["code"]);
    expect(of("business-cards", "material")).toEqual(["silk350", "uncoated300"]);
    expect(of("business-cards", "lamination")).toEqual(["lam-one", "lam-both", "lam-soft"]);
    expect(of("envelopes", "sides")).toEqual(["single"]);
    expect(of("stickers", "lamination")).toEqual(["lam-one", "lam-both"]);
    for (const o of options.filter((x) => x["kind"] === "lamination" || x["kind"] === "spot_uv")) expect(o["coated"]).toBe(true);
    expect(options.find((o) => o["@label"] === "option:business-cards:material:uncoated300")!["coated"]).toBe(false);
    expect(of("business-cards", "feature")).toEqual(["print-back"]);
    // Only a canvas on a frame stays flat: it never rolls into a tube.
    expect(options.filter((o) => o["framed"] === true).map((o) => o["@label"])).toEqual(["option:canvas:canvas:stretched"]);
  });

  it("leaves every price, weight and tube to Adminium: no figure is written", () => {
    for (const t of ["jobs", "quote_lines"]) for (const row of rowsOf(section, t)) for (const c of ["price", "weight_kg", "sheets", "work"]) expect(row[c], `${t}.${c}`).toBeUndefined();
    for (const t of ["orders", "saved_quotes"]) for (const row of rowsOf(main, t)) expect(row["tube"], `${t}.tube`).toBeUndefined();
  });
});

describe("every row is one the works could have made", () => {
  it("mails nobody real: every address is on a reserved .example domain", () => {
    const addresses = [...JSON.stringify([main, section]).matchAll(/"email":\s*"([^"]+)"/g)].map((m) => m[1]!);
    expect(addresses.length).toBeGreaterThan(20);
    for (const address of addresses) expect(address, address).toMatch(/\.example$/);
  });

  it("numbers its orders and quotes off the running series, so the works' own next are MP-4127 and MQ-2042", () => {
    const orders = rowsOf(main, "orders");
    for (const row of orders) {
      expect(row["number"]).toMatch(/^MP-\d{4}$/);
      expect(row["number_seq"]).toBeNull();
    }
    expect(orders.map((row) => Number(String(row["number"]).slice(3))).sort((a, b) => b - a)[0]).toBe(4126);
    expect(rowsOf(main, "saved_quotes").map((q) => q["number"])).toEqual(["MQ-2041", "MQ-2037"]);
    expect(rowsOf(main, "settings")[0]).toMatchObject({ ref_prefix: "MP-", first_order_number: 4127, quote_prefix: "MQ-", first_quote_number: 2042 });
  });

  it("dates a job by the working-day rule: Wednesday 10:20 gives Mon 10, express Thu 6, a printed proof Wed 12, a change Tue 11", () => {
    expect([3, 1, 5, 4].map((days) => readyBy("2026-08-05", "10:20", days))).toEqual(["2026-08-10", "2026-08-06", "2026-08-12", "2026-08-11"]);
    // After two, the order comes in on the next working day; a bank holiday is skipped.
    expect(readyBy("2026-08-05", "14:05", 3)).toBe("2026-08-11");
    expect(readyBy("2026-08-28", "10:00", 3)).toBe("2026-09-03");
  });

  it("shuts on the bank holidays' own dates, never moved with the sample's week", () => {
    expect(rowsOf(main, "closures").map((c) => [c["from_date"], c["to_date"], c["reason"]])).toEqual([
      ["2026-08-31", "2026-08-31", "Summer bank holiday"],
      ["2026-12-25", "2026-12-25", "Christmas Day"],
      ["2026-12-28", "2026-12-28", "Boxing Day, observed"],
    ]);
  });

  it("prints nothing before a yes: every job on the press or past it has an approved proof", () => {
    const jobs = rowsOf(section, "jobs");
    const proofs = rowsOf(section, "proofs");
    for (const job of jobs.filter((j) => j["stage"] !== "prepress")) {
      const latest = proofs.filter((p) => refOf(p["job_id"]) === job["@label"]).sort((a, b) => Number(b["version"]) - Number(a["version"]))[0];
      expect(latest?.["state"], String(job["@label"])).toBe("approved");
    }
    const mp4114 = proofs.filter((p) => refOf(p["job_id"]) === "job:MP-4114").map((p) => [p["version"], p["state"]]);
    // The first, a change asked on it, was sent again by the second: no job holds two proofs still out.
    expect(mp4114).toEqual([[1, "superseded"], [2, "sent"]]);
  });

  it("prints Harbour Bakery's MP-4112 from its Customiser design, paying for the back it uses", () => {
    const job = rowsOf(section, "jobs").find((j) => j["@label"] === "job:MP-4112")!;
    expect(job).toMatchObject({ design_code: "MP4112C8G2S6E4WB", design_id: { "@ref": "design:mp-4112" }, sides_option_id: { "@ref": "option:business-cards:sides:double" } });
    expect(rowsOf(section, "job_features")).toEqual([
      { job_id: { "@ref": "job:MP-4112" }, option_id: { "@ref": "option:business-cards:feature:print-back" }, feature_id: { "@ref": "feature:printing-back" } },
    ]);
  });

  it("has posted one sample pack, to Harbour Bakery", () => {
    expect(rowsOf(main, "sample_requests")).toEqual([expect.objectContaining({ name: "Harbour Bakery", status: "posted", postcode: "SL7 1BT" })]);
  });

  it("says nothing the product never says", () => {
    const words = JSON.stringify([main, section]).toLowerCase();
    for (const banned of ["upgrade", "tier", "pricing", "demo", "lorem"]) expect(words, banned).not.toContain(banned);
    expect(words).not.toMatch(/\bfree\b/);
    expect(words).not.toMatch(/\bcanva\b/);
  });
});
