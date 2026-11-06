/**
 * The five checks on a customer's artwork file, read from its own bytes in
 * the browser: bleed, resolution, colour, fonts and pages. They are advice
 * only — a person checks every file before the proof goes out — and what
 * they said is stored with the file as "what we showed you".
 *
 * A PDF is read for its page box, its pictures' pixel sizes, its colour
 * spaces, its fonts and its pages; a JPEG for its frame header; a TIFF for
 * its first directory and the count of the rest. Nothing is sent anywhere.
 */
import type { MessageKey } from "../i18n/index.tsx";
import type { CheckLevel } from "./port.ts";

/** One check's answer: its level and the message that says it. */
export interface CheckRow {
  check: "bleed" | "dpi" | "colour" | "fonts" | "pages" | "file";
  level: CheckLevel;
  key: MessageKey;
  params?: Record<string, string | number>;
}

/** The bleed every edge of a print file carries, in millimetres. */
export const BLEED_MM = 3;

/** The kinds the works takes, by the end of a file's name. */
export const ARTWORK_EXTENSIONS = ["pdf", "tif", "tiff", "jpg", "jpeg"] as const;
export const ARTWORK_ACCEPT = ".pdf,.tif,.tiff,.jpg,.jpeg,application/pdf,image/tiff,image/jpeg";

export const extensionOf = (name: string): string => (name.includes(".") ? (name.split(".").pop() ?? "").toLowerCase() : "");
export const isArtworkName = (name: string): boolean => (ARTWORK_EXTENSIONS as readonly string[]).includes(extensionOf(name));

const PT_MM = 25.4 / 72;
const round = (n: number) => Math.round(n);

interface Job {
  /** The finished size, in millimetres. */
  trim: { w: number; h: number };
  sides: number;
  minDpi: number;
}

const fits = (w: number, h: number, tw: number, th: number, tol: number) => (Math.abs(w - tw) <= tol && Math.abs(h - th) <= tol) || (Math.abs(w - th) <= tol && Math.abs(h - tw) <= tol);

function bleedByPage(w: number, h: number, job: Job): CheckRow {
  const want = { w: job.trim.w + 2 * BLEED_MM, h: job.trim.h + 2 * BLEED_MM };
  if (fits(w, h, want.w, want.h, 1)) return { check: "bleed", level: "pos", key: "shop.check.bleed.ok", params: { bleed: BLEED_MM, w: round(w), h: round(h) } };
  if (fits(w, h, job.trim.w, job.trim.h, 1)) return { check: "bleed", level: "warn", key: "shop.check.bleed.none", params: { bleed: BLEED_MM, w: round(w), h: round(h) } };
  return { check: "bleed", level: "warn", key: "shop.check.bleed.scale", params: { w: round(w), h: round(h), tw: job.trim.w, th: job.trim.h } };
}

function bleedByShape(px: number, py: number, job: Job): CheckRow {
  const want = { w: job.trim.w + 2 * BLEED_MM, h: job.trim.h + 2 * BLEED_MM };
  const close = (x: number, y: number) => Math.abs(x - y) / y < 0.01 || Math.abs(1 / x - y) / y < 0.01;
  const shape = px / py;
  if (close(shape, want.w / want.h) && !close(shape, job.trim.w / job.trim.h)) return { check: "bleed", level: "pos", key: "shop.check.bleed.shapeOk", params: { bleed: BLEED_MM } };
  if (close(shape, job.trim.w / job.trim.h)) return { check: "bleed", level: "warn", key: "shop.check.bleed.shapeTrim", params: { bleed: BLEED_MM } };
  return { check: "bleed", level: "warn", key: "shop.check.bleed.shapeOff", params: { tw: job.trim.w, th: job.trim.h } };
}

function resolution(px: number, py: number, job: Job): CheckRow {
  const want = { w: (job.trim.w + 2 * BLEED_MM) / 25.4, h: (job.trim.h + 2 * BLEED_MM) / 25.4 };
  // Either way round: the picture may be turned to the page.
  const dpi = round(Math.max(Math.min(px / want.w, py / want.h), Math.min(py / want.w, px / want.h)));
  const params = { px, py, dpi, tw: job.trim.w, th: job.trim.h, min: job.minDpi };
  return dpi >= job.minDpi ? { check: "dpi", level: "pos", key: "shop.check.dpi.ok", params } : { check: "dpi", level: "danger", key: "shop.check.dpi.low", params };
}

function pagesRow(pages: number, job: Job): CheckRow {
  return pages === job.sides ? { check: "pages", level: "pos", key: "shop.check.pages.ok", params: { n: pages } } : { check: "pages", level: "warn", key: "shop.check.pages.wrong", params: { n: pages, sides: job.sides } };
}

const unread = (key: MessageKey): CheckRow[] => [{ check: "file", level: "warn", key }];

/** Latin-1 text of the bytes, in pieces small enough for `fromCharCode`. */
function latin1(bytes: Uint8Array): string {
  let out = "";
  const CHUNK = 32768;
  for (let i = 0; i < bytes.length; i += CHUNK) out += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  return out;
}

function readPdf(bytes: Uint8Array, job: Job): CheckRow[] {
  const s = latin1(bytes);
  const rows: CheckRow[] = [];
  const pages = (s.match(/\/Type\s*\/Page(?![a-zA-Z])/g) ?? []).length || 1;
  const box = /\/(?:BleedBox|MediaBox)\s*\[\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*\]/.exec(s);
  rows.push(box === null ? { check: "bleed", level: "warn", key: "shop.check.bleed.unread" } : bleedByPage((Number(box[3]) - Number(box[1])) * PT_MM, (Number(box[4]) - Number(box[2])) * PT_MM, job));
  const pictures: [number, number][] = [];
  const picture = /\/Subtype\s*\/Image[\s\S]{0,400}?\/Width\s+(\d+)[\s\S]{0,200}?\/Height\s+(\d+)/g;
  for (let m = picture.exec(s); m !== null && pictures.length < 40; m = picture.exec(s)) pictures.push([Number(m[1]), Number(m[2])]);
  if (pictures.length === 0) rows.push({ check: "dpi", level: "pos", key: "shop.check.dpi.vector" });
  else {
    const [px, py] = pictures.sort((a, b) => b[0] * b[1] - a[0] * a[1])[0]!;
    rows.push(resolution(px, py, job));
  }
  const rgb = /\/(DeviceRGB|CalRGB)/.test(s);
  const cmyk = /\/DeviceCMYK/.test(s);
  rows.push(rgb && !cmyk ? { check: "colour", level: "warn", key: "shop.check.colour.rgb" } : { check: "colour", level: "pos", key: cmyk ? "shop.check.colour.cmyk" : "shop.check.colour.ok" });
  const fonts = (s.match(/\/Type\s*\/Font(?![a-zA-Z])/g) ?? []).length;
  const embedded = (s.match(/\/FontFile[23]?/g) ?? []).length;
  rows.push(fonts > 0 && embedded === 0 ? { check: "fonts", level: "warn", key: "shop.check.fonts.missing" } : { check: "fonts", level: "pos", key: fonts > 0 ? "shop.check.fonts.embedded" : "shop.check.fonts.outlined" });
  rows.push(pagesRow(pages, job));
  return rows;
}

function readJpeg(bytes: Uint8Array, job: Job): CheckRow[] {
  let i = 2;
  let w = 0;
  let h = 0;
  let components = 3;
  while (i < bytes.length - 9) {
    if (bytes[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = bytes[i + 1]!;
    const length = (bytes[i + 2]! << 8) | bytes[i + 3]!;
    // A start-of-frame marker: every SOFn but the huffman, arithmetic-table and colour-table ones.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      h = (bytes[i + 5]! << 8) | bytes[i + 6]!;
      w = (bytes[i + 7]! << 8) | bytes[i + 8]!;
      components = bytes[i + 9]!;
      break;
    }
    i += 2 + length;
  }
  if (w === 0) return unread("shop.check.file.jpeg");
  return [
    bleedByShape(w, h, job),
    resolution(w, h, job),
    components === 4 ? { check: "colour", level: "pos", key: "shop.check.colour.cmyk" } : { check: "colour", level: "warn", key: "shop.check.colour.rgb" },
    { check: "fonts", level: "pos", key: "shop.check.fonts.flat" },
    job.sides > 1 ? { check: "pages", level: "warn", key: "shop.check.pages.back" } : { check: "pages", level: "pos", key: "shop.check.pages.one" },
  ];
}

function readTiff(bytes: Uint8Array, job: Job): CheckRow[] {
  if (bytes.length < 8) return unread("shop.check.file.tiff");
  const le = bytes[0] === 0x49;
  const u16 = (o: number) => (le ? bytes[o]! | (bytes[o + 1]! << 8) : (bytes[o]! << 8) | bytes[o + 1]!);
  const u32 = (o: number) => (le ? (bytes[o]! | (bytes[o + 1]! << 8) | (bytes[o + 2]! << 16)) + bytes[o + 3]! * 16777216 : bytes[o]! * 16777216 + ((bytes[o + 1]! << 16) | (bytes[o + 2]! << 8) | bytes[o + 3]!));
  let at = u32(4);
  let pages = 0;
  let w = 0;
  let h = 0;
  let photometric = 2;
  while (at > 0 && at < bytes.length - 2 && pages < 50) {
    const entries = u16(at);
    if (pages === 0) {
      for (let k = 0; k < entries; k += 1) {
        const e = at + 2 + k * 12;
        if (e + 12 > bytes.length) break;
        const tag = u16(e);
        const value = u16(e + 2) === 3 ? u16(e + 8) : u32(e + 8);
        if (tag === 256) w = value;
        if (tag === 257) h = value;
        if (tag === 262) photometric = value;
      }
    }
    pages += 1;
    const next = at + 2 + entries * 12;
    if (next + 4 > bytes.length) break;
    at = u32(next);
  }
  if (w === 0) return unread("shop.check.file.tiff");
  return [
    bleedByShape(w, h, job),
    resolution(w, h, job),
    photometric === 5 ? { check: "colour", level: "pos", key: "shop.check.colour.cmyk" } : { check: "colour", level: "warn", key: "shop.check.colour.rgb" },
    { check: "fonts", level: "pos", key: "shop.check.fonts.flat" },
    pagesRow(pages, job),
  ];
}

/** The five checks on one file, for a job of this finished size and sides. */
export async function checkFile(file: Blob & { name: string }, job: Job): Promise<CheckRow[]> {
  const ext = extensionOf(file.name);
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (ext === "pdf") return readPdf(bytes, job);
    if (ext === "jpg" || ext === "jpeg") return readJpeg(bytes, job);
    if (ext === "tif" || ext === "tiff") return readTiff(bytes, job);
  } catch {
    // unreadable: said so below
  }
  return unread("shop.check.file.unread");
}

/** Whether a file's checks ask the customer to say they are happy with it: any warning, or worse. */
export const needsAcceptance = (rows: readonly CheckRow[]): boolean => rows.some((r) => r.level === "warn" || r.level === "danger");
