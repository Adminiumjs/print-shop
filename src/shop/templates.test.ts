/**
 * The works' template files, as the shop ships them: one PDF a product of
 * the sample in `public/templates/`, each byte for byte what
 * `scripts/write-templates.ts` writes (`npm run templates` after a change),
 * each sheet size drawn at size with its bleed declared, and the name
 * Templates & sizes downloads it by.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { BLEED_MM, TEMPLATES_DIR, templateName, templates } from "../../scripts/write-templates.ts";
import { PRODUCTS, SIZES } from "../sample/marlow-press.ts";
import { templateFile } from "./after.ts";

const pt = (mm: number) => Math.round(((mm * 72) / 25.4) * 100) / 100;

describe("the template files", () => {
  it("ships one for every product of the sample, each as its source writes it", () => {
    const made = templates();
    expect(readdirSync(TEMPLATES_DIR).sort()).toEqual(Object.keys(made).sort());
    for (const [name, bytes] of Object.entries(made)) expect(readFileSync(join(TEMPLATES_DIR, name)).equals(bytes), name).toBe(true);
  });

  it("names each file as the page downloads it", () => {
    for (const product of PRODUCTS) expect(templateFile(product.id)).toBe(templateName(product.id));
  });

  it("draws each sheet size at size, its bleed and trim declared", () => {
    const cards = readFileSync(join(TEMPLATES_DIR, templateName("flyers")), "latin1");
    const flyers = PRODUCTS.find((p) => p.id === "flyers")!;
    const boxes = [...cards.matchAll(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\] \/TrimBox \[([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+)\]/g)].map((m) => m.slice(1).map(Number));
    expect(boxes).toHaveLength(flyers.sizes.length);
    flyers.sizes.forEach((code, i) => {
      const size = SIZES.find((s) => s.code === code)!;
      const [w, h, x0, y0, x1, y1] = boxes[i]!;
      expect([w, h]).toEqual([pt(size.w + 2 * BLEED_MM), pt(size.h + 2 * BLEED_MM)]);
      expect([x0, y0]).toEqual([pt(BLEED_MM), pt(BLEED_MM)]);
      expect([Math.round((x1! - x0!) * 10) / 10, Math.round((y1! - y0!) * 10) / 10]).toEqual([Math.round(pt(size.w) * 10) / 10, Math.round(pt(size.h) * 10) / 10]);
    });
    expect(cards.startsWith("%PDF-1.4\n")).toBe(true);
    expect(cards.trimEnd().endsWith("%%EOF")).toBe(true);
  });

  it("gives a large-format product one page of how to set the file up for the roll", () => {
    const banner = readFileSync(join(TEMPLATES_DIR, templateName("pvc-banners")), "latin1");
    expect(banner).toContain("/Count 1");
    expect(banner).toContain("(We print up to 1370 mm across the roll and scale from your artwork.)");
  });
});
