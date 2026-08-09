/*
 * VENDORED from add-on-design-studio/src/ui/Editor.tsx — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the add-on repo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `design-studio`; its manifest, tests and README live in that repo.
 */
/**
 * The editor (prompt J, screen 5).
 *
 * THE CANVAS IS DRAWN AT THE FINISHED SIZE. Not a preview of it, not a
 * proportional stand-in — the white rectangle is the piece, the hatch around it
 * is the 3mm the guillotine takes, and the dashed line inside it is where ink
 * stops being safe. Everything the customer does happens in those coordinates,
 * which is the entire reason the output cannot have the wrong bleed.
 *
 * Below 900px the layout inverts: canvas first, tools as a bottom bar,
 * inspector as a slide-up sheet. NOTHING here locks the document's scroll — see
 * `.ds-inspector--sheet` in the stylesheet for why that matters when you are a
 * guest inside somebody else's page.
 */

import {
  Circle,
  Image as ImageIcon,
  Minus,
  MousePointer2,
  Redo2,
  Ruler,
  SlidersHorizontal,
  Square,
  Type,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { ComponentType, PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";

import {
  PX_PER_MM_100,
  canRedo,
  canUndo,
  createDoc,
  layersOn,
  outsideSafeArea,
  type Doc,
  type Layer,
  type Side,
} from "../doc.ts";
import type { T } from "../i18n/strings.ts";
import { LAYOUTS, docFromLayout, draftFor, type StartingLayout } from "../layouts.ts";
import { Inspector } from "./Inspector.tsx";
import { LayoutPicker } from "./LayoutPicker.tsx";
import { Monogram } from "./Monogram.tsx";
import { editorReducer, initialState } from "./editorState.ts";
import { tint } from "./tint.ts";
import { useViewport } from "./useViewport.ts";

/** Points to millimetres. One point is 1/72 inch; 25.4/72 = 0.3528. */
const MM_PER_PT = 0.3528;

type IconComponent = ComponentType<{ size?: number; "aria-hidden"?: boolean }>;

type ToolId = "select" | "text" | "image" | "rect" | "ellipse" | "line";

const TOOLS: { id: ToolId; icon: IconComponent; key: string }[] = [
  { id: "select", icon: MousePointer2, key: "addon.design-studio.tool.select" },
  { id: "text", icon: Type, key: "addon.design-studio.tool.text" },
  { id: "image", icon: ImageIcon, key: "addon.design-studio.tool.image" },
  { id: "rect", icon: Square, key: "addon.design-studio.tool.rect" },
  { id: "ellipse", icon: Circle, key: "addon.design-studio.tool.ellipse" },
  { id: "line", icon: Minus, key: "addon.design-studio.tool.line" },
];

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

export interface EditorProps {
  /** The product being made, for the top bar. Absent when opened from a route. */
  productLabel?: string;
  /** The layouts the shop has switched on, in the order they are offered. */
  layouts: readonly StartingLayout[];
  /** Pre-selected by the caller when the job's finished size matched one. */
  initialLayout?: StartingLayout;
  t: T;
  /** "Use this design" — the document goes into the order. */
  onUse: (doc: Doc) => void;
  /** "Save and come back" — kept against the order, not sent with it. */
  onSave: (doc: Doc) => void;
  /** The customer backed out of the picker without starting anything. */
  onCancel: () => void;
}

export function Editor({
  productLabel,
  layouts,
  initialLayout,
  t,
  onUse,
  onSave,
  onCancel,
}: EditorProps) {
  const [state, dispatch] = useReducer(
    editorReducer,
    initialLayout ?? null,
    (layout): ReturnType<typeof initialState> =>
      initialState(
        layout === null
          ? // A placeholder standing in until the picker answers. It is never
            // drawn: `picked` gates the canvas on the customer having chosen.
            createDoc({ layoutId: "blank", widthMm: 210, heightMm: 297, sides: 1 })
          : docFromLayout(layout, seedText(t)),
      ),
  );
  const [picked, setPicked] = useState(initialLayout !== undefined);
  const [pickerOpen, setPickerOpen] = useState(initialLayout === undefined);
  const [zoomStep, setZoomStep] = useState(1);
  const [guides, setGuides] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { width, height, narrow } = useViewport();
  const doc = state.history.present;

  // Fit the sheet-plus-bleed into what is left of the viewport, then apply the
  // customer's zoom on top. The percentage shown in the top bar is PHYSICAL —
  // 100% means the card on screen is the size of the card in the hand.
  const pxPerMm = useMemo(() => {
    const bleedW = doc.widthMm + doc.bleedMm * 2;
    const bleedH = doc.heightMm + doc.bleedMm * 2;
    const maxW = narrow ? clamp(width - 52, 230, 520) : clamp(width - 400, 300, 700);
    const maxH = narrow ? 380 : clamp(height - 320, 230, 520);
    return Math.min(maxW / bleedW, maxH / bleedH) * zoomStep;
  }, [doc.widthMm, doc.heightMm, doc.bleedMm, width, height, narrow, zoomStep]);

  const physicalZoom = pxPerMm / PX_PER_MM_100;
  const px = useCallback((mm: number) => `${mm * pxPerMm}px`, [pxPerMm]);

  const layoutName = useMemo(() => {
    const match = LAYOUTS.find((l) => l.id === doc.layoutId);
    return match === undefined
      ? (productLabel ?? t("addon.design-studio.picker.blank"))
      : t(match.key as never);
  }, [doc.layoutId, productLabel, t]);

  // Escape closes the top overlay and nothing else. It never discards work: a
  // half-built design behind a dismissed sheet is still a half-built design.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (pickerOpen) {
        if (picked) setPickerOpen(false);
        else onCancel();
      } else if (sheetOpen) {
        setSheetOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pickerOpen, picked, sheetOpen, onCancel]);

  const pick = (layout: StartingLayout) => {
    dispatch({ type: "open", doc: docFromLayout(layout, seedText(t)) });
    setPicked(true);
    setPickerOpen(false);
    setZoomStep(1);
  };

  const addTool = (tool: ToolId) => {
    if (tool === "select") {
      dispatch({ type: "select", id: null });
      return;
    }
    dispatch({
      type: "add",
      draft: draftFor(
        doc,
        tool,
        {
          text: t("addon.design-studio.layer.text"),
          image: t("addon.design-studio.layer.image"),
          rect: t("addon.design-studio.layer.rect"),
          ellipse: t("addon.design-studio.layer.ellipse"),
          line: t("addon.design-studio.layer.line"),
        },
        {
          text: t("addon.design-studio.seed.textDefault"),
          imageLabel: t("addon.design-studio.seed.imageLabel"),
        },
        LAYOUTS.find((l) => l.id === doc.layoutId)?.tint ?? "paper",
      ),
    });
  };

  /**
   * One gesture, start to finish. The scale and zoom are captured at
   * pointer-down: a viewport resize mid-drag would otherwise change how far the
   * pointer has travelled, and nobody resizes a window while dragging a logo.
   */
  const beginDrag = (e: ReactPointerEvent<HTMLDivElement>, layer: Layer) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    dispatch({ type: "select", id: layer.id });

    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const startX = e.clientX;
    const startY = e.clientY;
    const originX = layer.xMm;
    const originY = layer.yMm;
    const scale = pxPerMm;
    const zoom = physicalZoom;

    const onMove = (ev: PointerEvent) => {
      dispatch({
        type: "drag",
        id: layer.id,
        xMm: originX + (ev.clientX - startX) / scale,
        yMm: originY + (ev.clientY - startY) / scale,
        zoom,
      });
    };
    const onUp = () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      dispatch({ type: "endGesture" });
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
  };

  const bleedW = doc.widthMm + doc.bleedMm * 2;
  const bleedH = doc.heightMm + doc.bleedMm * 2;
  const warn = outsideSafeArea(doc).length > 0;

  return (
    <>
      <section className="ds-editor" aria-label={layoutName}>
        <header className="ds-topbar">
          <Monogram />
          <div className="ds-title">
            <div className="ds-title-name">{layoutName}</div>
            {/*
             * Only the numbers are mono. JetBrains Mono carries no Arabic or
             * CJK glyphs, so a whole sentence in it falls back mid-string and
             * comes out letter-spaced and wrong in three of the eight locales.
             * Measurements are mono; the words around them are not.
             */}
            <div className="ds-title-size">
              <span className="ds-mono">
                {doc.widthMm} × {doc.heightMm}mm · {bleedW} × {bleedH}mm
              </span>{" "}
              {t("addon.design-studio.editor.withBleed")}
            </div>
          </div>

          {doc.sides === 2 && (
            <div className="ds-seg">
              {(["front", "back"] as Side[]).map((side) => (
                <button
                  key={side}
                  type="button"
                  aria-pressed={state.side === side}
                  onClick={() => dispatch({ type: "side", side })}
                >
                  {t(
                    side === "front"
                      ? "addon.design-studio.editor.front"
                      : "addon.design-studio.editor.back",
                  )}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 5, marginInlineStart: 4 }}>
            <button
              type="button"
              className="ds-iconbtn"
              disabled={!canUndo(state.history)}
              onClick={() => dispatch({ type: "undo" })}
              aria-label={t("addon.design-studio.editor.undo")}
              title={t("addon.design-studio.editor.undo")}
            >
              <Undo2 size={15} aria-hidden />
            </button>
            <button
              type="button"
              className="ds-iconbtn"
              disabled={!canRedo(state.history)}
              onClick={() => dispatch({ type: "redo" })}
              aria-label={t("addon.design-studio.editor.redo")}
              title={t("addon.design-studio.editor.redo")}
            >
              <Redo2 size={15} aria-hidden />
            </button>
          </div>

          <div className="ds-zoom">
            <button
              type="button"
              onClick={() => setZoomStep((z) => clamp(z * 0.8, 0.25, 6))}
              aria-label={t("addon.design-studio.editor.zoomOut")}
            >
              <ZoomOut size={14} aria-hidden />
            </button>
            <span className="ds-zoom-value ds-mono">{Math.round(physicalZoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoomStep((z) => clamp(z * 1.25, 0.25, 6))}
              aria-label={t("addon.design-studio.editor.zoomIn")}
            >
              <ZoomIn size={14} aria-hidden />
            </button>
          </div>

          <div className="ds-exits">
            <button type="button" className="ds-btn" onClick={() => onSave(doc)}>
              {t("addon.design-studio.editor.save")}
            </button>
            <button type="button" className="ds-btn ds-btn--primary" onClick={() => onUse(doc)}>
              {t("addon.design-studio.editor.use")}
            </button>
          </div>
        </header>

        <div className="ds-body">
          {!narrow && (
            <nav className="ds-rail" aria-label={t("addon.design-studio.tool.select")}>
              {TOOLS.map(({ id, icon: Icon, key }) => (
                <button
                  key={id}
                  type="button"
                  className="ds-tool"
                  onClick={() => addTool(id)}
                  aria-label={t(key as never)}
                  title={t(key as never)}
                >
                  <Icon size={17} aria-hidden />
                </button>
              ))}
              <span className="ds-rail-sep" aria-hidden="true" />
              <button
                type="button"
                className="ds-tool"
                aria-pressed={guides}
                onClick={() => setGuides((g) => !g)}
                aria-label={t("addon.design-studio.tool.guides")}
                title={t("addon.design-studio.tool.guides")}
              >
                <Ruler size={17} aria-hidden />
              </button>
            </nav>
          )}

          <div
            className="ds-canvas-scroll"
            onPointerDown={() => dispatch({ type: "select", id: null })}
          >
            <div className="ds-canvas-stack">
              {/*
               * `dir="ltr"` on the canvas and nowhere else. Millimetre
               * coordinates describe a physical sheet: a business card does not
               * mirror because the shop's site is being read in Arabic.
               */}
              <div
                dir="ltr"
                className="ds-bleed"
                style={{ inlineSize: px(bleedW), blockSize: px(bleedH) }}
              >
                <div
                  className="ds-trim"
                  style={{
                    insetInlineStart: px(doc.bleedMm),
                    insetBlockStart: px(doc.bleedMm),
                    inlineSize: px(doc.widthMm),
                    blockSize: px(doc.heightMm),
                  }}
                />

                {layersOn(doc, state.side).map((layer, index) => (
                  <div
                    key={layer.id}
                    className="ds-layer"
                    role="presentation"
                    aria-selected={state.selected === layer.id}
                    onPointerDown={(e) => beginDrag(e, layer)}
                    style={{
                      insetInlineStart: px(doc.bleedMm + layer.xMm),
                      insetBlockStart: px(doc.bleedMm + layer.yMm),
                      inlineSize: px(layer.wMm),
                      blockSize: px(layer.hMm),
                      display: layer.hidden ? "none" : "block",
                      zIndex: index + 1,
                    }}
                  >
                    <LayerBody layer={layer} pxPerMm={pxPerMm} />
                  </div>
                ))}

                {guides && (
                  <>
                    <div
                      className="ds-guide-trim"
                      style={{
                        insetInlineStart: px(doc.bleedMm),
                        insetBlockStart: px(doc.bleedMm),
                        inlineSize: px(doc.widthMm),
                        blockSize: px(doc.heightMm),
                      }}
                    />
                    <div
                      className="ds-guide-safe"
                      style={{
                        insetInlineStart: px(doc.bleedMm + doc.safeMm),
                        insetBlockStart: px(doc.bleedMm + doc.safeMm),
                        inlineSize: px(doc.widthMm - doc.safeMm * 2),
                        blockSize: px(doc.heightMm - doc.safeMm * 2),
                      }}
                    />
                  </>
                )}

                {state.snapLines.map((line) => (
                  <div
                    key={`${line.axis}-${line.atMm}`}
                    className="ds-snapline"
                    style={
                      line.axis === "x"
                        ? {
                            insetInlineStart: px(doc.bleedMm + line.atMm),
                            insetBlockStart: 0,
                            inlineSize: "1px",
                            blockSize: px(bleedH),
                          }
                        : {
                            insetInlineStart: 0,
                            insetBlockStart: px(doc.bleedMm + line.atMm),
                            inlineSize: px(bleedW),
                            blockSize: "1px",
                          }
                    }
                  />
                ))}
              </div>

              <div className="ds-legend">
                <span className="ds-legend-item">
                  <span className="ds-key-trim" aria-hidden="true" />
                  {t("addon.design-studio.legend.trim")}
                </span>
                <span className="ds-legend-item">
                  <span className="ds-key-bleed" aria-hidden="true" />
                  {t("addon.design-studio.legend.bleed")} —{" "}
                  <Measured
                    template={t("addon.design-studio.legend.bleedValue")}
                    value={`${doc.bleedMm}mm`}
                  />
                </span>
                <span className="ds-legend-item">
                  <span className="ds-key-safe" aria-hidden="true" />
                  {t("addon.design-studio.legend.safe")} —{" "}
                  <Measured
                    template={t("addon.design-studio.legend.safeValue")}
                    value={`${doc.safeMm}mm`}
                  />
                </span>
              </div>

              <p className="ds-note">{t("addon.design-studio.safeNote")}</p>
              {warn && (
                <p className="ds-warn" role="status">
                  {t("addon.design-studio.warn.outsideSafe")}
                </p>
              )}
              <p className="ds-honest">{t("addon.design-studio.honest")}</p>
            </div>
          </div>

          {!narrow && (
            <Inspector
              doc={doc}
              side={state.side}
              selected={state.selected}
              notice={state.notice}
              sheet={false}
              t={t}
              dispatch={dispatch}
            />
          )}
        </div>

        {narrow && (
          <nav className="ds-bottombar" aria-label={t("addon.design-studio.tool.select")}>
            {TOOLS.map(({ id, icon: Icon, key }) => (
              <button
                key={id}
                type="button"
                className="ds-tool"
                onClick={() => addTool(id)}
                aria-label={t(key as never)}
                title={t(key as never)}
              >
                <Icon size={18} aria-hidden />
              </button>
            ))}
            <button
              type="button"
              className="ds-tool"
              aria-pressed={guides}
              onClick={() => setGuides((g) => !g)}
              aria-label={t("addon.design-studio.tool.guides")}
            >
              <Ruler size={18} aria-hidden />
            </button>
            <button type="button" className="ds-props" onClick={() => setSheetOpen(true)}>
              <SlidersHorizontal size={16} aria-hidden />
              {t("addon.design-studio.properties")}
            </button>
          </nav>
        )}
      </section>

      {narrow && sheetOpen && (
        <>
          <button
            type="button"
            className="ds-scrim"
            aria-label={t("addon.design-studio.close")}
            onClick={() => setSheetOpen(false)}
          />
          <Inspector
            doc={doc}
            side={state.side}
            selected={state.selected}
            notice={state.notice}
            sheet
            t={t}
            dispatch={dispatch}
          />
        </>
      )}

      {pickerOpen && (
        <LayoutPicker
          layouts={layouts}
          t={t}
          onPick={pick}
          onClose={() => (picked ? setPickerOpen(false) : onCancel())}
        />
      )}
    </>
  );
}

/**
 * A phrase with one measurement in it, where only the measurement is mono.
 *
 * The template is fetched WITHOUT substitution so `{v}` survives to be split
 * on — which is the only way to put a React element inside a translated string
 * without letting a translator write markup.
 */
function Measured({ template, value }: { template: string; value: string }) {
  const [before, after = ""] = template.split("{v}");
  return (
    <>
      {before}
      <span className="ds-mono">{value}</span>
      {after}
    </>
  );
}

/** The seeded words a starting layout opens with, in the reader's language. */
function seedText(t: T) {
  return {
    headline: t("addon.design-studio.seed.headline"),
    detail: t("addon.design-studio.seed.detail"),
    back: t("addon.design-studio.seed.back"),
    textName: t("addon.design-studio.layer.text"),
    lineName: t("addon.design-studio.layer.line"),
  };
}

function LayerBody({ layer, pxPerMm }: { layer: Layer; pxPerMm: number }) {
  if (layer.kind === "text") {
    return (
      <span
        className="ds-layer-text"
        style={{
          fontFamily: layer.font,
          fontSize: `${layer.sizePt * MM_PER_PT * pxPerMm}px`,
          fontWeight: layer.weight,
          textAlign: layer.align,
          color: layer.colour,
        }}
      >
        {layer.text}
      </span>
    );
  }

  if (layer.kind === "image") {
    const iconSize = clamp(layer.wMm * pxPerMm * 0.22, 12, 34);
    return (
      <span className="ds-layer-image" style={{ background: tint(layer.tint) }}>
        <ImageIcon size={iconSize} aria-hidden />
        <span
          className="ds-mono"
          style={{ fontSize: `${clamp(layer.wMm * pxPerMm * 0.055, 7, 11)}px` }}
        >
          {layer.label}
        </span>
      </span>
    );
  }

  return (
    <span
      className="ds-layer-shape"
      style={{
        background: layer.fill === "none" ? "transparent" : layer.fill,
        border:
          layer.stroke === "none"
            ? undefined
            : `${Math.max(1, layer.strokeMm * pxPerMm)}px solid ${layer.stroke}`,
        borderRadius: layer.shape === "ellipse" ? "50%" : `${layer.radiusMm * pxPerMm}px`,
      }}
    />
  );
}
