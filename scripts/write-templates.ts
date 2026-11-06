/**
 * `npm run templates`: write the works' artwork templates, one PDF a product
 * of the sample, into `public/templates/` (shipped beside the shop's pages,
 * so Templates & sizes downloads them). A sheet product's file has a page
 * for each of its sizes, drawn at size with its 3 mm bleed: the page is the
 * bleed edge, the trim box is drawn and declared (`TrimBox`, `BleedBox`),
 * and the safe area 4 mm inside the trim is dashed. A large-format
 * product's file is one A4 page of how to set the file up for the roll.
 *
 * `src/shop/templates.test.ts` fails when a file and this source disagree.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { MATERIALS, PRODUCTS, SIZES } from "../src/sample/marlow-press.ts";

export const TEMPLATES_DIR = join(import.meta.dirname, "..", "public", "templates");
export const BLEED_MM = 3;
export const SAFE_MM = 4;

const pt = (mm: number) => (mm * 72) / 25.4;
const n = (v: number) => (Math.round(v * 100) / 100).toFixed(2);
/** PDF text: plain ASCII, with the three characters a literal string escapes. */
const lit = (s: string) => `(${s.replace(/[^\x20-\x7e]/g, "-").replace(/([\\()])/g, "\\$1")})`;

interface Page {
  /** The trim size, in millimetres; null for a page of words only (A4). */
  trim: { w: number; h: number } | null;
  lines: string[];
}

/** One PDF of the pages given: standard Helvetica, no pictures, every box declared. */
export function pdf(pages: readonly Page[]): Buffer {
  const objects: string[] = [];
  const add = (body: string) => {
    objects.push(body);
    return objects.length;
  };
  const font = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const pagesRef = objects.length + 1;
  add("PAGES");
  const kids: number[] = [];
  for (const page of pages) {
    const trimW = page.trim === null ? 210 : page.trim.w;
    const trimH = page.trim === null ? 297 : page.trim.h;
    const bleed = page.trim === null ? 0 : BLEED_MM;
    const W = pt(trimW + 2 * bleed);
    const H = pt(trimH + 2 * bleed);
    const b = pt(bleed);
    const s = pt(bleed + SAFE_MM);
    const size = Math.max(4, Math.min(11, pt(trimH) / 24));
    const ops: string[] = [];
    if (page.trim !== null) {
      ops.push("0.85 0.1 0.35 RG 0.5 w", `${n(b)} ${n(b)} ${n(W - 2 * b)} ${n(H - 2 * b)} re S`);
      ops.push("0.1 0.45 0.85 RG 0.4 w [2 2] 0 d", `${n(s)} ${n(s)} ${n(W - 2 * s)} ${n(H - 2 * s)} re S`, "[] 0 d");
    }
    ops.push("0.15 0.15 0.18 rg BT", `/F1 ${n(size)} Tf`, `${n(page.trim === null ? 56 : s + 2)} ${n(H - (page.trim === null ? 72 : s + size + 2))} Td`, `${n(size * 1.35)} TL`);
    page.lines.forEach((line, i) => ops.push(`${i === 0 ? "" : "T* "}${lit(line)} Tj`));
    ops.push("ET");
    const stream = ops.join("\n");
    const content = add(`<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`);
    const boxes = page.trim === null ? "" : ` /TrimBox [${n(b)} ${n(b)} ${n(W - b)} ${n(H - b)}] /BleedBox [0 0 ${n(W)} ${n(H)}]`;
    kids.push(add(`<< /Type /Page /Parent ${pagesRef} 0 R /MediaBox [0 0 ${n(W)} ${n(H)}]${boxes} /Resources << /Font << /F1 ${font} 0 R >> >> /Contents ${content} 0 R >>`));
  }
  objects[pagesRef - 1] = `<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(" ")}] /Count ${kids.length} >>`;
  const catalog = add(`<< /Type /Catalog /Pages ${pagesRef} 0 R >>`);
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(out, "latin1"));
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = Buffer.byteLength(out, "latin1");
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, "latin1");
}

export const templateName = (code: string): string => `marlow-press-${code}-template.pdf`;

/** Every product's template, by its file name. */
export function templates(): Record<string, Buffer> {
  const out: Record<string, Buffer> = {};
  const sizeOf = new Map(SIZES.map((s) => [s.code, s]));
  const widthOf = new Map(MATERIALS.map((m) => [m.code, m.rollWidth ?? null]));
  for (const product of PRODUCTS) {
    const sizes = product.sizes.map((code) => sizeOf.get(code)).filter((s) => s !== undefined);
    const pages: Page[] =
      sizes.length > 0
        ? sizes.map((size) => ({
            trim: { w: size.w, h: size.h },
            lines: [
              `Marlow Press - ${product.name} template`,
              `${size.name}: ${size.w} x ${size.h} mm trim, ${BLEED_MM} mm bleed on all four edges`,
              `Safe area ${SAFE_MM} mm in from the trim (dashed). Keep words inside it.`,
              "CMYK, not RGB. Fonts outlined or embedded. 150 dpi at final size, minimum.",
            ],
          }))
        : [
            {
              trim: null,
              lines: [
                `Marlow Press - ${product.name} template`,
                "Set your file up at the final size, in millimetres.",
                `We print up to ${Math.max(...product.materials.map((m) => widthOf.get(m) ?? 0))} mm across the roll and scale from your artwork.`,
                `Keep words ${SAFE_MM} mm in from every edge; hems and eyelets take the edge.`,
                "CMYK, not RGB. Fonts outlined or embedded. 150 dpi at final size, minimum.",
              ],
            },
          ];
    out[templateName(product.id)] = pdf(pages);
  }
  return out;
}

if (process.env["VITEST"] === undefined) {
  mkdirSync(TEMPLATES_DIR, { recursive: true });
  for (const [name, bytes] of Object.entries(templates())) writeFileSync(join(TEMPLATES_DIR, name), bytes);
  console.info(`[templates] wrote ${String(Object.keys(templates()).length)} files to public/templates/`);
}
