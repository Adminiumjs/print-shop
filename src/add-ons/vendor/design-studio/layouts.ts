/*
 * VENDORED from add-ons/packages/design-studio/src/layouts.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `design-studio`; its manifest, tests and README live in the monorepo.
 */
/**
 * The six starting layouts, the short font list and the fixed twelve swatches.
 *
 * A starting layout is a SIZE plus a few things already on the page. Opening
 * onto an empty rectangle is technically a start and practically a wall — the
 * seeded headline, rule and line of contact details exist so the first thing a
 * customer does is edit something rather than invent something.
 *
 * A SIZE, AND NOT A BLEED. How far past the finished edge the artwork has to
 * reach is the JOB's fact, not this table's — a host that reproduces onto a
 * fixed-size object asks for none at all — so `docFromLayout()` takes it as an
 * argument. It read `BLEED_MM` here for a while, which made every document this
 * add-on built 3mm regardless of what the host had asked for.
 *
 * Everything here is expressed as a fraction of the page and then clamped into
 * the safe area, which is why a fresh document from any layout exports with
 * every one of the works' checks passing. That is a property of the seeds, not
 * a coincidence, and `doc.test.ts` asserts it for all six.
 */

import {
  BLEED_MM,
  SAFE_MM,
  addLayer,
  createDoc,
  roundMm,
  type Doc,
  type Layer,
  type Side,
} from "./doc.ts";

// ── swatches ─────────────────────────────────────────────────────────────────

/**
 * TWELVE, fixed, no colour picker.
 *
 * A picker invites a customer to choose a colour their file cannot hold and the
 * press cannot hit. These twelve are process colours the works already runs, so
 * "what you chose" and "what comes off the press" are the same question — which
 * is also what lets `toArtworkFile()` state CMYK as a fact rather than a hope.
 */
export interface Swatch {
  id: string;
  hex: string;
  /** i18n key for the accessible name. */
  key: string;
}

export const SWATCHES: readonly Swatch[] = [
  { id: "ink", hex: "#191920", key: "addon.design-studio.swatch.ink" },
  { id: "slate", hex: "#4a4a54", key: "addon.design-studio.swatch.slate" },
  { id: "mist", hex: "#b7b7c3", key: "addon.design-studio.swatch.mist" },
  { id: "paper", hex: "#ffffff", key: "addon.design-studio.swatch.paper" },
  { id: "magenta", hex: "#db2777", key: "addon.design-studio.swatch.magenta" },
  { id: "wine", hex: "#9f1239", key: "addon.design-studio.swatch.wine" },
  { id: "indigo", hex: "#4f46e5", key: "addon.design-studio.swatch.indigo" },
  { id: "teal", hex: "#0e7490", key: "addon.design-studio.swatch.teal" },
  { id: "green", hex: "#0b7d59", key: "addon.design-studio.swatch.green" },
  { id: "amber", hex: "#b25e09", key: "addon.design-studio.swatch.amber" },
  { id: "red", hex: "#cf273c", key: "addon.design-studio.swatch.red" },
  { id: "blue", hex: "#1c59e0", key: "addon.design-studio.swatch.blue" },
];

const HEX = Object.fromEntries(SWATCHES.map((s) => [s.id, s.hex])) as Record<string, string>;

/** Stroke offers the twelve plus "none", which fill does not need. */
export const NO_STROKE = "none";

/**
 * The whole font list. Two are the shop's own faces and two are on every
 * machine — custom fonts are on the cutline (§6), because the moment a customer
 * can upload one the works has to license it, embed it and explain why the one
 * they picked came out different.
 */
export const FONTS: readonly string[] = ["Manrope", "JetBrains Mono", "Georgia", "Helvetica"];

export const WEIGHTS = [400, 600, 700, 800] as const;

// ── layouts ──────────────────────────────────────────────────────────────────

export interface StartingLayout {
  id: string;
  widthMm: number;
  heightMm: number;
  sides: 1 | 2;
  /** A `--tint-*` family from the host's token set; the picker tile uses it. */
  tint: string;
  /** Lucide icon name for the tile. */
  icon: string;
  /** i18n key for the layout's name. */
  key: string;
}

export const LAYOUTS: readonly StartingLayout[] = [
  {
    id: "business-card",
    widthMm: 85,
    heightMm: 55,
    sides: 2,
    tint: "card",
    icon: "credit-card",
    key: "addon.design-studio.layout.business-card",
  },
  {
    id: "folded-card",
    widthMm: 210,
    heightMm: 148,
    sides: 2,
    tint: "paper",
    icon: "book-open",
    key: "addon.design-studio.layout.folded-card",
  },
  {
    id: "flyer",
    widthMm: 105,
    heightMm: 148,
    sides: 2,
    tint: "paper",
    icon: "file-text",
    key: "addon.design-studio.layout.flyer",
  },
  {
    id: "envelope",
    widthMm: 220,
    heightMm: 110,
    sides: 1,
    tint: "mail",
    icon: "mail",
    key: "addon.design-studio.layout.envelope",
  },
  {
    id: "sticker",
    widthMm: 60,
    heightMm: 60,
    sides: 1,
    tint: "label",
    icon: "sticker",
    key: "addon.design-studio.layout.sticker",
  },
  {
    id: "roll-up",
    widthMm: 850,
    heightMm: 2000,
    sides: 1,
    tint: "large",
    icon: "flag",
    key: "addon.design-studio.layout.roll-up",
  },
];

/** "Start from blank" — A4 upright, one side, nothing on it. */
export const BLANK_LAYOUT: StartingLayout = {
  id: "blank",
  widthMm: 210,
  heightMm: 297,
  sides: 1,
  tint: "paper",
  icon: "square",
  key: "addon.design-studio.picker.blank",
};

export const LAYOUT_IDS: readonly string[] = LAYOUTS.map((l) => l.id);

export function layoutById(id: string): StartingLayout | undefined {
  return id === BLANK_LAYOUT.id ? BLANK_LAYOUT : LAYOUTS.find((l) => l.id === id);
}

/**
 * The starting layout closest to a job's finished size, so a customer who has
 * already configured 500 business cards is not asked what they are making. An
 * exact match wins; otherwise the nearest by aspect ratio and area, which for
 * the six on offer is never a close call.
 */
export function layoutForSize(widthMm: number, heightMm: number): StartingLayout | undefined {
  const exact = LAYOUTS.find(
    (l) =>
      (l.widthMm === widthMm && l.heightMm === heightMm) ||
      (l.widthMm === heightMm && l.heightMm === widthMm),
  );
  if (exact !== undefined) return exact;

  const ratio = widthMm / heightMm;
  const area = widthMm * heightMm;
  let best: StartingLayout | undefined;
  let bestScore = Infinity;
  for (const l of LAYOUTS) {
    const lr = l.widthMm / l.heightMm;
    const score =
      Math.abs(Math.log(lr / ratio)) + Math.abs(Math.log((l.widthMm * l.heightMm) / area));
    if (score < bestScore) {
      bestScore = score;
      best = l;
    }
  }
  return best;
}

// ── seeds ────────────────────────────────────────────────────────────────────

/**
 * The words a seeded layout opens with. Supplied by the caller so the engine
 * stays free of i18n: the client passes the customer's language, the vitest
 * suite passes the English defaults, and neither has to know about the other.
 */
export interface SeedText {
  headline: string;
  detail: string;
  back: string;
  textName: string;
  lineName: string;
}

export const DEFAULT_SEED_TEXT: SeedText = {
  headline: "Your name here",
  detail: "what you do · 07700 900 000 · you@example.com",
  back: "Thank you",
  textName: "Text",
  lineName: "Line",
};

/** Keep a box inside the safe area; the seeds are the reason exports pass. */
function clampToSafe(
  layout: StartingLayout,
  x: number,
  y: number,
  w: number,
  h: number,
): { xMm: number; yMm: number; wMm: number; hMm: number } {
  const maxW = layout.widthMm - SAFE_MM * 2;
  const maxH = layout.heightMm - SAFE_MM * 2;
  const wMm = Math.min(w, maxW);
  const hMm = Math.min(h, maxH);
  return {
    xMm: roundMm(Math.min(Math.max(x, SAFE_MM), layout.widthMm - SAFE_MM - wMm)),
    yMm: roundMm(Math.min(Math.max(y, SAFE_MM), layout.heightMm - SAFE_MM - hMm)),
    wMm: roundMm(wMm),
    hMm: roundMm(hMm),
  };
}

/** Millimetres per point: one point is 1/72 inch. */
const MM_PER_PT = 0.3528;

/**
 * A rough average glyph advance as a fraction of the font size, for Manrope at
 * the weights these seeds use. It does not have to be exact — it has to keep
 * seeded text INSIDE its own box.
 */
const ADVANCE = 0.52;

/** Leaves the estimate a few percent of slack rather than sizing to the edge. */
const FIT_MARGIN = 0.96;

/**
 * Character count, with full-width CJK counted double.
 *
 * The seeds are translated into eight languages and two of them are Chinese,
 * where a glyph is about twice the advance of a Latin one. Counting characters
 * flat would size 这里写你的名字 as if it were seven narrow letters and let it
 * run out of its box in exactly the two locales nobody checks by eye.
 */
function weightedLength(text: string): number {
  let total = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    const wide =
      (code >= 0x1100 && code <= 0x115f) || // Hangul Jamo
      (code >= 0x2e80 && code <= 0xa4cf) || // CJK radicals through Yi
      (code >= 0xac00 && code <= 0xd7a3) || // Hangul syllables
      (code >= 0xf900 && code <= 0xfaff) || // CJK compatibility
      (code >= 0xff01 && code <= 0xff60); // full-width forms
    total += wide ? 2 : 1;
  }
  return total;
}

/**
 * A point size that fits `text` into a box, constrained by BOTH dimensions.
 *
 * Height alone is not enough and the roll-up banner is why: its headline box is
 * 561 × 260mm, so a size chosen from the height alone came out at 553pt, wrapped
 * to three lines, and ran straight through the line below it. Worse than ugly —
 * the drawn ink then left the safe area while `outsideSafeArea()`, which
 * measures boxes, reported nothing wrong. Text that overflows its own box makes
 * the model and the screen disagree, and the model is what gets printed.
 */
function fitPt(text: string, wMm: number, hMm: number, lines = 1): number {
  const byHeight = (hMm / lines) * 0.75;
  const perLine = Math.max(1, weightedLength(text) / lines);
  const byWidth = (wMm * FIT_MARGIN) / (ADVANCE * perLine);
  // Floor rather than round: rounding up by a fraction of a point is what turns
  // a line that just fits into a line that just wraps.
  return Math.max(5, Math.floor(Math.min(byHeight, byWidth) / MM_PER_PT));
}

/**
 * A document opened from a starting layout, seeded and ready to edit.
 *
 * Positions are fractions of the page rather than fixed millimetres so one set
 * of numbers serves an 85mm card and an 850mm banner, and every box is clamped
 * into the safe area on the way in.
 *
 * `bleedMm` DEFAULTS BUT IS NEVER DEFAULTED FOR A JOB. A caller holding a
 * `JobSpec` passes `job.bleedMm` and nothing else will do: zero is a real
 * instruction — reproduce the design at exactly its finished size — and reading
 * it as "missing" is how a file comes back the wrong size. The default is for
 * the callers that hold no job at all: this repo's suite, and a host driving the
 * engine to re-derive a document it already has. The seeds do not move when it
 * changes — they are clamped into the safe area, which is measured from the
 * trim — so the bleed changes the SHEET the design is drawn on and nothing else.
 */
export function docFromLayout(
  layout: StartingLayout,
  text: SeedText = DEFAULT_SEED_TEXT,
  bleedMm: number = BLEED_MM,
): Doc {
  let doc = createDoc({
    layoutId: layout.id,
    widthMm: layout.widthMm,
    heightMm: layout.heightMm,
    sides: layout.sides,
    bleedMm,
    safeMm: SAFE_MM,
  });
  if (layout.id === BLANK_LAYOUT.id) return doc;

  const W = layout.widthMm;
  const H = layout.heightMm;

  const headline = clampToSafe(layout, W * 0.08, H * 0.22, W * 0.66, H * 0.13);
  doc = addLayer(doc, "front", {
    kind: "text",
    name: text.textName,
    ...headline,
    text: text.headline,
    font: "Manrope",
    sizePt: fitPt(text.headline, headline.wMm, headline.hMm),
    weight: 800,
    align: "start",
    colour: HEX.ink!,
  }).doc;

  const rule = clampToSafe(layout, W * 0.08, H * 0.4, W * 0.24, Math.max(0.4, H * 0.008));
  doc = addLayer(doc, "front", {
    kind: "shape",
    name: text.lineName,
    ...rule,
    shape: "line",
    fill: HEX.magenta!,
    stroke: NO_STROKE,
    strokeMm: 0,
    radiusMm: 0,
  }).doc;

  // The detail line is sized for TWO lines inside its box. A box measured for
  // one line and filled with text that wraps is a layer whose drawn ink leaves
  // the safe area while `outsideSafeArea()` reports nothing — the two would
  // disagree on screen, which is worse than either being wrong on its own.
  const detail = clampToSafe(layout, W * 0.08, H * 0.48, W * 0.74, H * 0.16);
  doc = addLayer(doc, "front", {
    kind: "text",
    name: text.textName,
    ...detail,
    text: text.detail,
    font: "Manrope",
    sizePt: fitPt(text.detail, detail.wMm, detail.hMm, 2),
    weight: 400,
    align: "start",
    colour: HEX.slate!,
  }).doc;

  if (layout.sides === 2) {
    const back = clampToSafe(layout, W * 0.2, H * 0.45, W * 0.6, H * 0.1);
    doc = addLayer(doc, "back", {
      kind: "text",
      name: text.textName,
      ...back,
      text: text.back,
      font: "Manrope",
      sizePt: fitPt(text.back, back.wMm, back.hMm),
      weight: 700,
      align: "center",
      colour: HEX.ink!,
    }).doc;
  }

  return doc;
}

/**
 * A new layer of the chosen kind, centred on the page, sized against the page
 * so the same call is sensible on a card and on a banner.
 */
export function draftFor(
  doc: Doc,
  kind: "text" | "image" | "rect" | "ellipse" | "line",
  names: { text: string; image: string; rect: string; ellipse: string; line: string },
  seed: { text: string; imageLabel: string },
  tint: string,
): Parameters<typeof addLayer>[2] {
  const u = doc.widthMm / 85;
  const centre = (w: number, h: number) => ({
    xMm: roundMm((doc.widthMm - w) / 2),
    yMm: roundMm((doc.heightMm - h) / 2),
    wMm: roundMm(w),
    hMm: roundMm(h),
  });

  switch (kind) {
    case "text": {
      const box = centre(45 * u, 9 * u);
      return {
        kind: "text",
        name: names.text,
        ...box,
        text: seed.text,
        font: "Manrope",
        sizePt: fitPt(seed.text, box.wMm, box.hMm),
        weight: 700,
        align: "start",
        colour: HEX.ink!,
      };
    }
    case "image":
      return {
        kind: "image",
        name: names.image,
        ...centre(40 * u, 30 * u),
        label: seed.imageLabel,
        tint,
      };
    case "rect":
      return {
        kind: "shape",
        name: names.rect,
        ...centre(30 * u, 20 * u),
        shape: "rect",
        fill: HEX.ink!,
        stroke: NO_STROKE,
        strokeMm: 0,
        radiusMm: 0,
      };
    case "ellipse":
      return {
        kind: "shape",
        name: names.ellipse,
        ...centre(24 * u, 24 * u),
        shape: "ellipse",
        fill: HEX.green!,
        stroke: NO_STROKE,
        strokeMm: 0,
        radiusMm: 0,
      };
    case "line":
      return {
        kind: "shape",
        name: names.line,
        ...centre(40 * u, 0.8 * u),
        shape: "line",
        fill: HEX.ink!,
        stroke: NO_STROKE,
        strokeMm: 0,
        radiusMm: 0,
      };
  }
}

/** Everything on `side`, topmost first — the order the layers list reads in. */
export function layersTopFirst(doc: Doc, side: Side): Layer[] {
  return doc.layers.filter((l) => l.side === side).reverse();
}
