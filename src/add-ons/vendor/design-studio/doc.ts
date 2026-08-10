/*
 * VENDORED from add-ons/packages/design-studio/src/doc.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `design-studio`; its manifest, tests and README live in the monorepo.
 */
/**
 * The document engine (24 §6).
 *
 * Pure and deterministic. No `Date.now()`, no `Math.random()`, no `fetch`, no
 * React, no DOM: every clock reading is passed in and every id is derived from
 * the document it goes into, so the vitest suite and the running editor agree
 * by construction rather than by luck.
 *
 * THE UNIT IS THE MILLIMETRE, ALWAYS. Pixels exist only in the client, where a
 * zoom factor turns mm into screen px on the way out. A print document that
 * thinks in pixels has to guess a dpi somewhere, and the guess is what makes
 * bleed wrong. Here the finished size is the model, so `toArtworkRef()` cannot
 * produce a file at the wrong size — there is no other size to produce.
 *
 * Layer coordinates are measured from the TRIM box's start corner, not from the
 * bleed edge. That makes `x = 0` mean "on the cut line", which is the number a
 * customer is reasoning about, and it lets a deliberate full-bleed background
 * be the honest `x = -bleedMm` rather than a magic offset.
 *
 * THREE LAYER KINDS AND NO MORE — text, image, shape. The cutline in §6 is the
 * whole design: multi-page documents, warped text, image filters, gradients,
 * custom fonts and pen tools each turn a small editor into a design suite. If a
 * fourth kind starts to look necessary, that is the signal to stop.
 */

import type { ArtworkRef } from "../host/contracts/index.ts";

// ── constants ────────────────────────────────────────────────────────────────

/** The works needs 3mm on every edge. This is why the host's checks pass. */
export const BLEED_MM = 3;

/** Ink inside this margin risks the guillotine; the canvas draws it dashed. */
export const SAFE_MM = 4;

/** What the exporter renders at. Above the works' 150dpi floor with room over. */
export const OUTPUT_DPI = 300;

/**
 * Snap tolerance at 100% zoom, DIVIDED BY the zoom factor so the felt tolerance
 * on screen is constant. A tolerance fixed in millimetres would be unusably
 * sticky zoomed out and unreachable zoomed in — the customer is aiming with a
 * pointer, and the pointer does not know about millimetres.
 */
export const SNAP_TOLERANCE_MM = 0.5;

/** Bounded undo. Fifty steps is generous for a business card and cheap to hold. */
export const HISTORY_LIMIT = 50;

/** CSS reference pixels per millimetre at 100% zoom (96dpi). */
export const PX_PER_MM_100 = 96 / 25.4;

/**
 * A layer thinner or narrower than this is padded for hit-testing only. A 0.3mm
 * rule is a real thing to draw and an impossible thing to grab, and a customer
 * who cannot pick up their own line concludes the editor is broken.
 */
const HIT_PAD_MM = 0.6;

// ── the model ────────────────────────────────────────────────────────────────

export type Side = "front" | "back";
export type LayerKind = "text" | "image" | "shape";
export type ShapeKind = "rect" | "ellipse" | "line";
export type TextAlign = "start" | "center" | "end";
export type FontWeight = 400 | 600 | 700 | 800;

interface LayerCommon {
  id: string;
  /** Shown in the layers list. Already localized by the caller. */
  name: string;
  side: Side;
  hidden: boolean;
  /** Millimetres from the trim box's start corner; negative means into the bleed. */
  xMm: number;
  yMm: number;
  wMm: number;
  hMm: number;
}

export interface TextLayer extends LayerCommon {
  kind: "text";
  text: string;
  /** A family name from the short list in `layouts.ts` — never an uploaded font. */
  font: string;
  sizePt: number;
  weight: FontWeight;
  align: TextAlign;
  /** One of the twelve swatches. Free colour entry is not a thing this has. */
  colour: string;
}

export interface ImageLayer extends LayerCommon {
  kind: "image";
  /** What the customer will drop in. The demo draws a tinted placeholder. */
  label: string;
  tint: string;
}

export interface ShapeLayer extends LayerCommon {
  kind: "shape";
  shape: ShapeKind;
  fill: string | "none";
  stroke: string | "none";
  strokeMm: number;
  radiusMm: number;
}

export type Layer = TextLayer | ImageLayer | ShapeLayer;

export interface Doc {
  /** Which starting layout this came from; `blank` when it came from none. */
  layoutId: string;
  /** Finished (trim) size. */
  widthMm: number;
  heightMm: number;
  bleedMm: number;
  safeMm: number;
  sides: 1 | 2;
  /**
   * Both sides in one array. Relative order WITHIN a side is the z-order, back
   * to front — so the last same-side layer is the one on top.
   */
  layers: readonly Layer[];
}

// ── construction ─────────────────────────────────────────────────────────────

/** Round to the document's working resolution: a tenth of a millimetre. */
export function roundMm(n: number): number {
  return Math.round(n * 10) / 10;
}

export function createDoc(spec: {
  layoutId: string;
  widthMm: number;
  heightMm: number;
  sides: 1 | 2;
  bleedMm?: number;
  safeMm?: number;
  layers?: readonly Layer[];
}): Doc {
  return {
    layoutId: spec.layoutId,
    widthMm: spec.widthMm,
    heightMm: spec.heightMm,
    bleedMm: spec.bleedMm ?? BLEED_MM,
    safeMm: spec.safeMm ?? SAFE_MM,
    sides: spec.sides,
    layers: spec.layers ?? [],
  };
}

/** Everything on one side, back to front. */
export function layersOn(doc: Doc, side: Side): Layer[] {
  return doc.layers.filter((l) => l.side === side);
}

export function layerById(doc: Doc, id: string): Layer | undefined {
  return doc.layers.find((l) => l.id === id);
}

/**
 * A fresh id, derived from what is already in the document rather than from a
 * clock or a counter held outside it. Two runs that build the same document get
 * the same ids, which is what makes `fileIdFor()` reproducible.
 */
export function nextId(doc: Doc, kind: LayerKind): string {
  const prefix = `${kind}-`;
  const used = doc.layers
    .filter((l) => l.id.startsWith(prefix))
    .map((l) => Number.parseInt(l.id.slice(prefix.length), 10))
    .filter((n) => Number.isFinite(n));
  return `${prefix}${(used.length === 0 ? 0 : Math.max(...used)) + 1}`;
}

export type LayerDraft =
  | (Omit<TextLayer, "id" | "side" | "hidden"> & { kind: "text" })
  | (Omit<ImageLayer, "id" | "side" | "hidden"> & { kind: "image" })
  | (Omit<ShapeLayer, "id" | "side" | "hidden"> & { kind: "shape" });

/** Append a layer to the front of `side`'s stack. */
export function addLayer(doc: Doc, side: Side, draft: LayerDraft): { doc: Doc; id: string } {
  const id = nextId(doc, draft.kind);
  const layer = {
    ...draft,
    id,
    side,
    hidden: false,
    xMm: roundMm(draft.xMm),
    yMm: roundMm(draft.yMm),
    wMm: roundMm(draft.wMm),
    hMm: roundMm(draft.hMm),
  } as Layer;
  return { doc: { ...doc, layers: [...doc.layers, layer] }, id };
}

export function removeLayer(doc: Doc, id: string): Doc {
  return { ...doc, layers: doc.layers.filter((l) => l.id !== id) };
}

/**
 * Patch one layer. `patch` is deliberately loose about which layer kind it
 * belongs to — the caller has already narrowed — but the kind itself is never
 * patchable: a text layer does not become a rectangle, it is deleted and
 * replaced, and letting `kind` through would leave a text layer with no `text`.
 */
export function updateLayer(doc: Doc, id: string, patch: Partial<Omit<Layer, "id" | "kind">>): Doc {
  return {
    ...doc,
    layers: doc.layers.map((l) => (l.id === id ? ({ ...l, ...patch, id: l.id, kind: l.kind } as Layer) : l)),
  };
}

export function setHidden(doc: Doc, id: string, hidden: boolean): Doc {
  return updateLayer(doc, id, { hidden });
}

// ── hit-testing and selection ────────────────────────────────────────────────

export interface PointMm {
  xMm: number;
  yMm: number;
}

/** The box a pointer has to land in — the layer's own, padded when it is hairline. */
function hitBox(l: Layer): { x0: number; y0: number; x1: number; y1: number } {
  const padX = Math.max(0, (HIT_PAD_MM - l.wMm) / 2);
  const padY = Math.max(0, (HIT_PAD_MM - l.hMm) / 2);
  return {
    x0: l.xMm - padX,
    y0: l.yMm - padY,
    x1: l.xMm + l.wMm + padX,
    y1: l.yMm + l.hMm + padY,
  };
}

function contains(l: Layer, pt: PointMm): boolean {
  const b = hitBox(l);
  if (pt.xMm < b.x0 || pt.xMm > b.x1 || pt.yMm < b.y0 || pt.yMm > b.y1) return false;

  // An ellipse is tested against the ellipse, not against the box it sits in.
  // Clicking the corner of a circle and picking it up is the kind of small lie
  // that makes an editor feel approximate.
  if (l.kind === "shape" && l.shape === "ellipse" && l.wMm > 0 && l.hMm > 0) {
    const nx = (pt.xMm - (l.xMm + l.wMm / 2)) / (l.wMm / 2);
    const ny = (pt.yMm - (l.yMm + l.hMm / 2)) / (l.hMm / 2);
    return nx * nx + ny * ny <= 1;
  }
  return true;
}

/** The topmost visible layer under a point, or null. */
export function hitTest(doc: Doc, side: Side, pt: PointMm): Layer | null {
  const stack = layersOn(doc, side);
  for (let i = stack.length - 1; i >= 0; i -= 1) {
    const l = stack[i]!;
    if (!l.hidden && contains(l, pt)) return l;
  }
  return null;
}

/** Selection resolution: what a click at this point selects. */
export function selectAt(doc: Doc, side: Side, pt: PointMm): string | null {
  return hitTest(doc, side, pt)?.id ?? null;
}

// ── the snap solver ──────────────────────────────────────────────────────────

export interface SnapLine {
  axis: "x" | "y";
  /** Where the line is drawn, in mm from the trim origin. */
  atMm: number;
}

export interface SnapResult {
  xMm: number;
  yMm: number;
  /** Empty when nothing engaged; the client draws one thin accent line per entry. */
  lines: SnapLine[];
}

/**
 * Millimetres of slack at a given zoom. `zoom` is the PHYSICAL factor — 1 means
 * the canvas is drawn at true size — so the product `tolerance × zoom` is a
 * constant number of screen pixels whatever the customer has done to the view.
 */
export function snapToleranceMm(zoom: number): number {
  return SNAP_TOLERANCE_MM / (zoom > 0 ? zoom : 1);
}

interface Candidate {
  /** Where the moving layer's start edge would land. */
  pos: number;
  /** Where the guide line gets drawn. */
  guide: number;
}

/**
 * Candidates along one axis, in PRIORITY ORDER: page and guide alignments
 * first, then the other objects. Ties are broken by that order — a strict `<`
 * below means the first candidate at a given distance wins — so a layer sitting
 * on top of another at the page centre snaps to the PAGE, which is what the
 * customer means. Without a fixed order the answer would depend on array
 * shuffling that nothing else in the editor depends on.
 */
function candidates(
  doc: Doc,
  side: Side,
  movingId: string,
  axis: "x" | "y",
  size: number,
): Candidate[] {
  const page = axis === "x" ? doc.widthMm : doc.heightMm;
  const B = doc.bleedMm;
  const S = doc.safeMm;

  const out: Candidate[] = [
    { pos: 0, guide: 0 }, // trim, start edge
    { pos: page - size, guide: page }, // trim, end edge
    { pos: (page - size) / 2, guide: page / 2 }, // page centre
    { pos: S, guide: S }, // safe area, start edge
    { pos: page - S - size, guide: page - S }, // safe area, end edge
    { pos: -B, guide: -B }, // bleed, start edge
    { pos: page + B - size, guide: page + B }, // bleed, end edge
  ];

  for (const other of layersOn(doc, side)) {
    if (other.id === movingId || other.hidden) continue;
    const start = axis === "x" ? other.xMm : other.yMm;
    const extent = axis === "x" ? other.wMm : other.hMm;
    out.push(
      { pos: start, guide: start }, // edge to edge
      { pos: start + extent - size, guide: start + extent }, // edge to edge
      { pos: start + extent / 2 - size / 2, guide: start + extent / 2 }, // centre to centre
    );
  }
  return out;
}

function best(list: Candidate[], target: number, tol: number): Candidate | null {
  let winner: Candidate | null = null;
  let bestDistance = Infinity;
  for (const c of list) {
    const d = Math.abs(c.pos - target);
    if (d < tol && d < bestDistance) {
      winner = c;
      bestDistance = d;
    }
  }
  return winner;
}

/**
 * Where a layer being dragged to (`xMm`, `yMm`) should actually land.
 *
 * Returns unrounded positions on purpose: a snapped layer sits EXACTLY on the
 * guide, and rounding the answer to a tenth of a millimetre would push it back
 * off by up to 0.05mm — which is the difference between "it snapped" and "it
 * nearly snapped". The inspector rounds for display; the document does not.
 */
export function snap(
  doc: Doc,
  side: Side,
  movingId: string,
  xMm: number,
  yMm: number,
  zoom: number,
): SnapResult {
  const moving = layerById(doc, movingId);
  if (moving === undefined) return { xMm, yMm, lines: [] };

  const tol = snapToleranceMm(zoom);
  const lines: SnapLine[] = [];

  const bx = best(candidates(doc, side, movingId, "x", moving.wMm), xMm, tol);
  const by = best(candidates(doc, side, movingId, "y", moving.hMm), yMm, tol);
  if (bx !== null) lines.push({ axis: "x", atMm: bx.guide });
  if (by !== null) lines.push({ axis: "y", atMm: by.guide });

  return { xMm: bx?.pos ?? xMm, yMm: by?.pos ?? yMm, lines };
}

/** Move a layer to an absolute position, snapping on the way. */
export function moveLayer(
  doc: Doc,
  id: string,
  xMm: number,
  yMm: number,
  zoom: number,
): { doc: Doc; lines: SnapLine[] } {
  const layer = layerById(doc, id);
  if (layer === undefined) return { doc, lines: [] };
  const result = snap(doc, layer.side, id, xMm, yMm, zoom);
  return {
    doc: updateLayer(doc, id, { xMm: result.xMm, yMm: result.yMm }),
    lines: result.lines,
  };
}

// ── align, distribute, z-order ───────────────────────────────────────────────

export type PageAlign = "left" | "centreX" | "right" | "top" | "middle" | "bottom";

export function alignToPage(doc: Doc, id: string, align: PageAlign): Doc {
  const l = layerById(doc, id);
  if (l === undefined) return doc;
  switch (align) {
    case "left":
      return updateLayer(doc, id, { xMm: 0 });
    case "centreX":
      return updateLayer(doc, id, { xMm: roundMm((doc.widthMm - l.wMm) / 2) });
    case "right":
      return updateLayer(doc, id, { xMm: roundMm(doc.widthMm - l.wMm) });
    case "top":
      return updateLayer(doc, id, { yMm: 0 });
    case "middle":
      return updateLayer(doc, id, { yMm: roundMm((doc.heightMm - l.hMm) / 2) });
    case "bottom":
      return updateLayer(doc, id, { yMm: roundMm(doc.heightMm - l.hMm) });
  }
}

/**
 * Even gaps between three or more things, between the outermost two.
 *
 * The refusal is DATA, not a bare `false`: the button has to be able to say
 * "spreading needs three things on the canvas", and a boolean gives the UI
 * nothing to render. Two things already have exactly one gap, so there is
 * nothing to even out — that is a fact about the geometry, not a limitation.
 */
export type DistributeResult = { ok: true; doc: Doc } | { ok: false; reason: "needs-three" };

export function distribute(doc: Doc, side: Side, axis: "x" | "y"): DistributeResult {
  const movable = layersOn(doc, side).filter((l) => !l.hidden);
  if (movable.length < 3) return { ok: false, reason: "needs-three" };

  const startOf = (l: Layer) => (axis === "x" ? l.xMm : l.yMm);
  const sizeOf = (l: Layer) => (axis === "x" ? l.wMm : l.hMm);

  // Sorted by position, then by id so two things at the same coordinate keep a
  // stable order rather than depending on the sort's stability guarantees.
  const order = [...movable].sort((a, b) => startOf(a) - startOf(b) || a.id.localeCompare(b.id));
  const first = startOf(order[0]!);
  const last = startOf(order[order.length - 1]!) + sizeOf(order[order.length - 1]!);
  const occupied = order.reduce((sum, l) => sum + sizeOf(l), 0);
  const gap = (last - first - occupied) / (order.length - 1);

  let cursor = first;
  let next = doc;
  for (const l of order) {
    next = updateLayer(next, l.id, axis === "x" ? { xMm: roundMm(cursor) } : { yMm: roundMm(cursor) });
    cursor += sizeOf(l) + gap;
  }
  return { ok: true, doc: next };
}

export type ZMove = "front" | "forward" | "backward" | "back";

/**
 * Reorder within one side, leaving the other side's layers in exactly the slots
 * they already occupy. The flat array holds both sides, so a reorder that
 * ignored `side` would silently shuffle the back of a business card while the
 * customer was looking at the front.
 */
function reorderSide(doc: Doc, side: Side, mutate: (stack: Layer[]) => Layer[]): Doc {
  const slots: number[] = [];
  doc.layers.forEach((l, i) => {
    if (l.side === side) slots.push(i);
  });
  const reordered = mutate(slots.map((i) => doc.layers[i]!));
  const layers = [...doc.layers];
  slots.forEach((slot, k) => {
    layers[slot] = reordered[k]!;
  });
  return { ...doc, layers };
}

export function moveZ(doc: Doc, id: string, move: ZMove): Doc {
  const layer = layerById(doc, id);
  if (layer === undefined) return doc;

  return reorderSide(doc, layer.side, (stack) => {
    const from = stack.findIndex((l) => l.id === id);
    if (from === -1) return stack;
    const to =
      move === "front"
        ? stack.length - 1
        : move === "back"
          ? 0
          : move === "forward"
            ? Math.min(stack.length - 1, from + 1)
            : Math.max(0, from - 1);
    if (to === from) return stack;
    const next = [...stack];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved!);
    return next;
  });
}

// ── history ──────────────────────────────────────────────────────────────────

export interface History {
  past: readonly Doc[];
  present: Doc;
  future: readonly Doc[];
  /**
   * The coalescing token of the commit that produced `present`. Null between
   * gestures. Never persisted — it describes the session, not the document.
   */
  token: string | null;
}

export function createHistory(doc: Doc): History {
  return { past: [], present: doc, future: [], token: null };
}

/**
 * Record a new state.
 *
 * COALESCING IS THE WHOLE POINT. A drag fires a move event per pointer sample —
 * sixty for a short flick — and sixty undo steps to get back to where the layer
 * started is not an undo stack, it is a punishment. Passing the same
 * `coalesceToken` for every sample of one gesture keeps the FIRST snapshot and
 * replaces the present in place, so the gesture is one step. `endGesture()` on
 * pointer-up clears the token, so picking the same layer up again starts a new
 * one; a different token (a different layer, a different kind of edit) breaks
 * the run on its own.
 */
export function commit(h: History, next: Doc, coalesceToken?: string): History {
  if (coalesceToken !== undefined && coalesceToken === h.token) {
    return { past: h.past, present: next, future: [], token: coalesceToken };
  }
  const past = [...h.past, h.present];
  return {
    past: past.length > HISTORY_LIMIT ? past.slice(past.length - HISTORY_LIMIT) : past,
    present: next,
    future: [],
    token: coalesceToken ?? null,
  };
}

/** Close the current gesture so the next commit starts a fresh undo step. */
export function endGesture(h: History): History {
  return h.token === null ? h : { ...h, token: null };
}

export const canUndo = (h: History): boolean => h.past.length > 0;
export const canRedo = (h: History): boolean => h.future.length > 0;

export function undo(h: History): History {
  if (h.past.length === 0) return h;
  const present = h.past[h.past.length - 1]!;
  return {
    past: h.past.slice(0, -1),
    present,
    future: [h.present, ...h.future],
    // An undo always ends the gesture: otherwise the next drag sample would
    // coalesce into the state we just stepped back to and eat the undo.
    token: null,
  };
}

export function redo(h: History): History {
  if (h.future.length === 0) return h;
  const [present, ...rest] = h.future;
  return { past: [...h.past, h.present], present: present!, future: rest, token: null };
}

// ── warnings ─────────────────────────────────────────────────────────────────

/**
 * The layers a customer should be warned about: visible ink that crosses the
 * safe boundary and so may be trimmed off.
 *
 * A layer that COVERS THE WHOLE TRIM BOX is excluded, and that exclusion is the
 * only judgement in this function. A full-bleed background is meant to run off
 * the edge — warning about it teaches the customer that the warning is noise,
 * and the one warning that matters (their phone number 1mm from the cut) then
 * arrives in a list they have already learned to ignore.
 */
export function outsideSafeArea(doc: Doc): Layer[] {
  const S = doc.safeMm;
  return doc.layers.filter((l) => {
    if (l.hidden) return false;
    const coversPage =
      l.xMm <= 0 && l.yMm <= 0 && l.xMm + l.wMm >= doc.widthMm && l.yMm + l.hMm >= doc.heightMm;
    if (coversPage) return false;
    return (
      l.xMm < S ||
      l.yMm < S ||
      l.xMm + l.wMm > doc.widthMm - S ||
      l.yMm + l.hMm > doc.heightMm - S
    );
  });
}

// ── output ───────────────────────────────────────────────────────────────────

/**
 * A 32-bit FNV-1a over a canonical serialization of the document.
 *
 * The file id has to be stable — the same design exported twice is the same
 * file, and a cart line, a proof and the works' copy must all point at it — so
 * it is derived from CONTENT rather than from a clock or a counter. That also
 * keeps the whole engine free of `Date.now()`, which D11 requires of every
 * add-on in this wave and which a random id would quietly break.
 */
function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function canonical(doc: Doc): string {
  // Explicit field order rather than JSON.stringify(doc): key order in an
  // object literal is not something to bet a content hash on.
  const layers = doc.layers.map((l) =>
    [l.kind, l.id, l.side, l.hidden, l.xMm, l.yMm, l.wMm, l.hMm, JSON.stringify(l)].join("|"),
  );
  return [doc.layoutId, doc.widthMm, doc.heightMm, doc.bleedMm, doc.safeMm, doc.sides, ...layers].join(
    "~",
  );
}

export function fileIdFor(doc: Doc): string {
  return `ds-${fnv1a(canonical(doc))}`;
}

/** The file size the works receives: the trim size plus bleed on every edge. */
export function bleedSize(doc: Doc): { widthMm: number; heightMm: number } {
  return {
    widthMm: doc.widthMm + doc.bleedMm * 2,
    heightMm: doc.heightMm + doc.bleedMm * 2,
  };
}

/**
 * Millimetres from the nearest ink to the trim line — the number the works'
 * safe-area check measures. Negative when something crosses the cut.
 *
 * With nothing on the page there is no ink to be close to the edge, so the
 * answer is the farthest anything COULD be: the middle of the sheet.
 */
export function nearestInkMm(doc: Doc): number {
  const visible = doc.layers.filter((l) => !l.hidden);
  if (visible.length === 0) return Math.min(doc.widthMm, doc.heightMm) / 2;
  return visible.reduce((closest, l) => {
    const d = Math.min(
      l.xMm,
      l.yMm,
      doc.widthMm - (l.xMm + l.wMm),
      doc.heightMm - (l.yMm + l.hMm),
    );
    return Math.min(closest, d);
  }, Infinity);
}

/**
 * The print payload.
 *
 * `bleedMm` is 3 BY CONSTRUCTION: it is a property of the document the customer
 * has been editing all along, not a value computed at export time from
 * something that might have been wrong. That single fact is why the host's
 * `checkArtwork()` passes on this add-on's output and routinely fails on a
 * design brought in from outside — and it is why the host, not this add-on,
 * runs the check.
 */
export function toArtworkRef(
  doc: Doc,
  opts: { source?: string; withPreview?: boolean } = {},
): ArtworkRef {
  const fileId = fileIdFor(doc);
  const size = bleedSize(doc);
  return {
    fileId: `${fileId}.pdf`,
    source: opts.source ?? "design-studio",
    widthMm: size.widthMm,
    heightMm: size.heightMm,
    bleedMm: doc.bleedMm,
    dpi: OUTPUT_DPI,
    pages: doc.sides,
    ...(opts.withPreview === false ? {} : { previewFileId: `${fileId}-preview.png` }),
  };
}

/**
 * The same output described the way the HOST's `checkArtwork()` wants it.
 *
 * The extra four facts are not measurements of a mystery file — they are
 * decisions this exporter made. Colour is CMYK because the twelve swatches ARE
 * process colours; `fontsEmbedded` is true because text is written out as
 * outlines, so there is no font left to be missing; the pixel dimensions come
 * from the finished size at 300dpi; and `nearestInkMm` is measured off the
 * document rather than guessed.
 *
 * Structurally identical to the host's `ArtworkFile` (print-shop
 * `src/lib/quote.ts`), typed locally because this repo cannot import it.
 */
export interface ArtworkFileFacts {
  filename: string;
  widthPx: number;
  heightPx: number;
  widthMm: number;
  heightMm: number;
  bleedMm: number;
  nearestInkMm: number;
  colourSpace: "CMYK" | "RGB";
  fontsEmbedded: boolean;
  pages: number;
}

export function toArtworkFile(doc: Doc): ArtworkFileFacts {
  const size = bleedSize(doc);
  const px = (mm: number) => Math.round((mm / 25.4) * OUTPUT_DPI);
  return {
    filename: `${fileIdFor(doc)}.pdf`,
    widthPx: px(size.widthMm),
    heightPx: px(size.heightMm),
    widthMm: size.widthMm,
    heightMm: size.heightMm,
    bleedMm: doc.bleedMm,
    nearestInkMm: nearestInkMm(doc),
    colourSpace: "CMYK",
    fontsEmbedded: true,
    pages: doc.sides,
  };
}

/**
 * One row of `artwork_designs` — the single table this add-on brings, kept on
 * disconnect (D16). The clock is an argument, never read: a saved design that
 * timestamped itself from `Date.now()` would make two runs of the same demo
 * disagree, which is exactly what D11 rules out.
 */
export interface DesignRecord {
  id: string;
  jobRef: string;
  product: string;
  widthMm: number;
  heightMm: number;
  bleedMm: number;
  doc: Doc;
  previewFile: string;
  createdAt: string;
  updatedAt: string;
}

export function toDesignRecord(
  doc: Doc,
  meta: { id?: string; jobRef: string; product: string; nowIso: string; createdAtIso?: string },
): DesignRecord {
  const fileId = fileIdFor(doc);
  return {
    id: meta.id ?? fileId,
    jobRef: meta.jobRef,
    product: meta.product,
    widthMm: doc.widthMm,
    heightMm: doc.heightMm,
    bleedMm: doc.bleedMm,
    doc,
    previewFile: `${fileId}-preview.png`,
    createdAt: meta.createdAtIso ?? meta.nowIso,
    updatedAt: meta.nowIso,
  };
}
