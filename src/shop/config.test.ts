/**
 * The configurator's rules, from the rate card's own rows, and the five
 * artwork checks on real bytes; and the shop's paths, both ways.
 */
import { describe, expect, it } from "vitest";

import { CUSTOMER_ROUTES } from "../manifest/build.ts";
import { checkFile, needsAcceptance } from "./checks.ts";
import { finishBlocked, firstChoice, jobValues, settle, sizeLimits, sizeProblems, stepsOf } from "./config.ts";
import { ELSEWHERE, pathOf, placeOf, relativePath } from "./route.ts";
import { sampleCatalogue } from "./testing.ts";

const catalogue = sampleCatalogue();
const cards = catalogue.products[0]!;
const banners = catalogue.products[2]!;

describe("the configurator's rules", () => {
  it("opens on the works' first choices, nothing finished, at the 'from' quantity", () => {
    expect(firstChoice(catalogue, cards)).toMatchObject({ materialId: 10, sizeId: 12, sidesId: 14, laminationId: null, spotUvId: null, cornersId: null, packagingId: 1, qty: 100, proof: false, express: false });
    expect(firstChoice(catalogue, banners)).toMatchObject({ width: 1200, height: 2000, edgesId: 42, qty: 1, packagingId: null });
  });

  it("says why a finish is not offered, in the works' own words", () => {
    const start = firstChoice(catalogue, cards);
    expect(finishBlocked(catalogue, start, "spot_uv")).toBe("Spot UV needs a laminated surface — add a lamination first.");
    expect(finishBlocked(catalogue, { ...start, laminationId: 16 }, "spot_uv")).toBeNull();
    expect(finishBlocked(catalogue, { ...start, materialId: 11 }, "lamination")).toContain("uncoated");
    expect(finishBlocked(catalogue, start, "corners")).toBeNull();
  });

  it("takes off a finish the rules no longer offer, and names it", () => {
    const laminated = { ...firstChoice(catalogue, cards), laminationId: 16, spotUvId: 18 };
    const { choice, dropped } = settle(catalogue, cards, { ...laminated, materialId: 11 });
    expect([choice.laminationId, choice.spotUvId, dropped]).toEqual([null, null, ["lamination", "spot_uv"]]);
  });

  it("holds a large-format job to its roll and the job's own limits, with the size that puts it right", () => {
    const start = firstChoice(catalogue, banners);
    expect(sizeLimits(catalogue, banners, start)).toEqual({ minMm: 50, maxWidth: 1370, maxHeight: 5000, framed: false });
    expect(sizeProblems(catalogue, banners, { ...start, width: 1600, height: 20 })).toEqual([
      { side: "width", kind: "over", fix: 1370 },
      { side: "height", kind: "under", fix: 50 },
    ]);
  });

  it("writes a job as its row takes it: each option by id, a look only on a lamination that has one", () => {
    const start = firstChoice(catalogue, cards);
    expect(jobValues(catalogue, cards, { ...start, laminationId: 16, look: "gloss" }, 250)).toEqual({ product_id: 1, qty: 250, material_option_id: 10, sides_option_id: 14, size_option_id: 12, lamination_option_id: 16, look: "gloss", packaging_id: 1, proof_by_post: false, express: false });
    expect(jobValues(catalogue, cards, { ...start, laminationId: 17 }).look).toBeUndefined();
    expect(stepsOf(catalogue, cards)).toEqual([25, 50, 100, 250, 500, 1000]);
    expect(stepsOf(catalogue, banners)).toEqual([]);
  });
});

/** A PDF of one or more pages, its box in points. */
const pdf = (w: number, h: number, pages: number, extra = "") => {
  const pt = (mm: number) => ((mm * 72) / 25.4).toFixed(2);
  return new File([`%PDF-1.4\n${`<< /Type /Page /MediaBox [0 0 ${pt(w)} ${pt(h)}] >>\n`.repeat(pages)}${extra}%%EOF`], "art.pdf");
};

/** A JPEG's start-of-frame header: its size and colour components. */
const jpeg = (w: number, h: number, components: number) => new File([new Uint8Array([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, h >> 8, h & 255, w >> 8, w & 255, components, 0, 0, 0, 0, 0, 0, 0, 0])], "art.jpg");

/** A little-endian TIFF with one directory: width, height, photometric. */
function tiff(w: number, h: number, photometric: number): File {
  const b = new Uint8Array(8 + 2 + 3 * 12 + 4);
  const v = new DataView(b.buffer);
  b.set([0x49, 0x49, 42, 0]);
  v.setUint32(4, 8, true);
  v.setUint16(8, 3, true);
  [
    [256, w],
    [257, h],
    [262, photometric],
  ].forEach(([tag, value], i) => {
    const at = 10 + i * 12;
    v.setUint16(at, tag!, true);
    v.setUint16(at + 2, 4, true);
    v.setUint32(at + 4, 1, true);
    v.setUint32(at + 8, value!, true);
  });
  return new File([b], "art.tif");
}

const JOB = { trim: { w: 85, h: 55 }, sides: 2, minDpi: 150 };
const levels = (rows: { check: string; level: string }[]) => Object.fromEntries(rows.map((r) => [r.check, r.level]));

describe("the five artwork checks", () => {
  it("read a print-ready PDF as good: bleed, vector, CMYK, fonts embedded, a page a side", async () => {
    const rows = await checkFile(pdf(91, 61, 2, "/DeviceCMYK << /Type /Font /FontFile2 4 0 R >>"), JOB);
    expect(levels(rows)).toEqual({ bleed: "pos", dpi: "pos", colour: "pos", fonts: "pos", pages: "pos" });
    expect(needsAcceptance(rows)).toBe(false);
  });

  it("warn of no bleed, RGB, fonts not embedded and too few pages, and stop a picture too coarse to print", async () => {
    const rows = await checkFile(pdf(85, 55, 1, "/DeviceRGB << /Type /Font >> /Subtype /Image /Width 300 /Height 200"), JOB);
    expect(levels(rows)).toEqual({ bleed: "warn", dpi: "danger", colour: "warn", fonts: "warn", pages: "warn" });
    expect(rows.find((r) => r.check === "dpi")?.params).toMatchObject({ px: 300, py: 200, dpi: 83, min: 150 });
    expect(needsAcceptance(rows)).toBe(true);
  });

  it("read a JPEG's frame and a TIFF's directory", async () => {
    expect(levels(await checkFile(jpeg(1075, 720, 4), { ...JOB, sides: 1 }))).toEqual({ bleed: "pos", dpi: "pos", colour: "pos", fonts: "pos", pages: "pos" });
    expect(levels(await checkFile(tiff(1075, 720, 2), { ...JOB, sides: 1 }))).toEqual({ bleed: "pos", dpi: "pos", colour: "warn", fonts: "pos", pages: "pos" });
    expect(await checkFile(new File(["nothing"], "art.jpg"), JOB)).toEqual([{ check: "file", level: "warn", key: "shop.check.file.jpeg" }]);
  });
});

describe("the shop's paths", () => {
  it("reads what follows the shop's mount, hosted, for one database, or on its own domain", () => {
    expect(relativePath("/apps/printing/customer/product/business-cards", "/apps/printing/customer/")).toBe("product/business-cards");
    expect(relativePath("/apps/printing/marlow/customer/basket", "/apps/printing/customer/")).toBe("basket");
    expect(relativePath("/basket", "/")).toBe("basket");
  });

  it("opens each screen its path names, and writes the same path back", () => {
    const cases: [string, ReturnType<typeof placeOf>][] = [
      ["", { view: "products", code: null }],
      ["product/business-cards", { view: "product", code: "business-cards" }],
      ["product/business-cards/design", { view: "design", code: "business-cards" }],
      ["product/business-cards/blank", { view: "blank", code: "business-cards" }],
      ["artwork", { view: "artwork", code: null }],
      ["basket", { view: "basket", code: null }],
      ["confirmed", { view: "confirmed", code: null }],
    ];
    for (const [path, place] of cases) {
      expect(placeOf(path)).toEqual(place);
      expect(pathOf(place)).toBe(path);
    }
    expect(placeOf("product")).toEqual({ view: "products", code: null });
    expect(placeOf("product/business-cards/other")).toEqual({ view: "missing", code: null });
  });

  it("names a screen for every customer route of the manifest", () => {
    const own = ["/", "/product", "/artwork", "/basket", "/confirmed"];
    for (const path of Object.values(CUSTOMER_ROUTES)) {
      if (own.includes(path)) continue;
      expect(Object.values(ELSEWHERE), path).toContain(path.slice(1));
    }
  });
});
