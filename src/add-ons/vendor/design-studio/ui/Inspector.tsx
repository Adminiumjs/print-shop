/*
 * VENDORED from add-on-design-studio/src/ui/Inspector.tsx — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the add-on repo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `design-studio`; its manifest, tests and README live in that repo.
 */
/**
 * The inspector: everything about the selected object, and the layers list.
 *
 * Millimetres in mono throughout, because these are measurements a customer
 * checks against a ruler and a proportional font makes a column of numbers
 * impossible to scan. Colour comes from twelve fixed swatches rather than a
 * picker — see `layouts.ts` for why a picker would be a promise the press
 * cannot keep.
 *
 * It renders as a 272px column beside the canvas, and below 900px as a slide-up
 * sheet. Same component, one class swapped: two implementations of one panel is
 * how the narrow one falls behind.
 */

import {
  AlignCenter,
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignLeft,
  AlignRight,
  AlignStartHorizontal,
  AlignStartVertical,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";
import type { ComponentType, Dispatch } from "react";

import { layersOn, roundMm, type Doc, type Layer, type PageAlign, type Side } from "../doc.ts";
import type { T } from "../i18n/strings.ts";
import { FONTS, NO_STROKE, SWATCHES, WEIGHTS } from "../layouts.ts";
import type { EditorAction } from "./editorState.ts";

type IconComponent = ComponentType<{ size?: number; "aria-hidden"?: boolean }>;

const PAGE_ALIGNS: { align: PageAlign; icon: IconComponent; key: string }[] = [
  { align: "left", icon: AlignStartVertical, key: "addon.design-studio.align.pageLeft" },
  { align: "centreX", icon: AlignCenterVertical, key: "addon.design-studio.align.pageCentre" },
  { align: "right", icon: AlignEndVertical, key: "addon.design-studio.align.pageRight" },
  { align: "top", icon: AlignStartHorizontal, key: "addon.design-studio.align.pageTop" },
  { align: "middle", icon: AlignCenterHorizontal, key: "addon.design-studio.align.pageMiddle" },
  { align: "bottom", icon: AlignEndHorizontal, key: "addon.design-studio.align.pageBottom" },
];

const TEXT_ALIGNS: { value: "start" | "center" | "end"; icon: IconComponent; key: string }[] = [
  { value: "start", icon: AlignLeft, key: "addon.design-studio.align.start" },
  { value: "center", icon: AlignCenter, key: "addon.design-studio.align.center" },
  { value: "end", icon: AlignRight, key: "addon.design-studio.align.end" },
];

const Z_MOVES = [
  { move: "front", key: "addon.design-studio.order.front" },
  { move: "forward", key: "addon.design-studio.order.forward" },
  { move: "backward", key: "addon.design-studio.order.backward" },
  { move: "back", key: "addon.design-studio.order.back" },
] as const;

export function Inspector({
  doc,
  side,
  selected,
  notice,
  sheet,
  t,
  dispatch,
}: {
  doc: Doc;
  side: Side;
  selected: string | null;
  notice: string | null;
  sheet: boolean;
  t: T;
  dispatch: Dispatch<EditorAction>;
}) {
  const layer = selected === null ? undefined : doc.layers.find((l) => l.id === selected);
  const stack = layersOn(doc, side);
  // Topmost first: the layers list reads the way the customer looks at the page.
  const listed = [...stack].reverse();

  const patch = (p: Partial<Omit<Layer, "id" | "kind">>, token?: string) =>
    dispatch({ type: "patch", patch: p, token });

  /** Ends the coalescing run a field started, so the next edit is a new step. */
  const done = () => dispatch({ type: "endGesture" });

  return (
    <aside className={sheet ? "ds-inspector ds-inspector--sheet" : "ds-inspector"}>
      {sheet && <div className="ds-sheet-handle" aria-hidden="true" />}

      {layer === undefined ? (
        <p className="ds-muted" style={{ padding: "16px 4px", margin: 0 }}>
          {t("addon.design-studio.insp.none")}
        </p>
      ) : (
        <div className="ds-stack">
          <div className="ds-row">
            <span className="ds-selname">{layer.name}</span>
            <button
              type="button"
              className="ds-smallbtn"
              onClick={() => dispatch({ type: "delete" })}
              aria-label={t("addon.design-studio.insp.delete")}
              title={t("addon.design-studio.insp.delete")}
            >
              <Trash2 size={14} aria-hidden />
            </button>
          </div>

          <div>
            <div className="ds-eyebrow">
              {t("addon.design-studio.insp.posSize")}{" "}
              {/* The unit is a WORD here, not a measurement — Arabic writes it
                  مم and CJK 毫米, neither of which the mono face carries. */}
              <span style={{ fontWeight: 600, letterSpacing: 0, textTransform: "none" }}>
                {t("addon.design-studio.insp.mm")}
              </span>
            </div>
            <div className="ds-grid2">
              <MmField
                label="X"
                value={layer.xMm}
                onChange={(v) => patch({ xMm: v }, `edit:${layer.id}:x`)}
                onDone={done}
              />
              <MmField
                label="Y"
                value={layer.yMm}
                onChange={(v) => patch({ yMm: v }, `edit:${layer.id}:y`)}
                onDone={done}
              />
              <MmField
                label="W"
                value={layer.wMm}
                onChange={(v) => patch({ wMm: v }, `edit:${layer.id}:w`)}
                onDone={done}
              />
              <MmField
                label="H"
                value={layer.hMm}
                onChange={(v) => patch({ hMm: v }, `edit:${layer.id}:h`)}
                onDone={done}
              />
            </div>
          </div>

          {layer.kind === "text" && (
            <div className="ds-stack" style={{ gap: 10 }}>
              <label className="ds-field">
                <span className="ds-eyebrow" style={{ marginBlockEnd: 0 }}>
                  {t("addon.design-studio.insp.text")}
                </span>
                <textarea
                  className="ds-textarea"
                  rows={2}
                  value={layer.text}
                  onChange={(e) => patch({ text: e.target.value } as never, `edit:${layer.id}:text`)}
                  onBlur={() => dispatch({ type: "endGesture" })}
                />
              </label>

              <div className="ds-grid2" style={{ gridTemplateColumns: "1fr 76px" }}>
                <label className="ds-field">
                  <span className="ds-label">{t("addon.design-studio.insp.font")}</span>
                  <select
                    className="ds-select"
                    value={layer.font}
                    onChange={(e) => patch({ font: e.target.value } as never)}
                  >
                    {FONTS.map((font) => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="ds-field">
                  <span className="ds-label">{t("addon.design-studio.insp.size")}</span>
                  <span className="ds-numfield">
                    <input
                      type="number"
                      step="0.5"
                      value={layer.sizePt}
                      onChange={(e) =>
                        patch({ sizePt: numberOr(e.target.value, layer.sizePt) } as never, `edit:${layer.id}:pt`)
                      }
                      onBlur={() => dispatch({ type: "endGesture" })}
                    />
                    <span className="ds-mono">pt</span>
                  </span>
                </label>
              </div>

              <label className="ds-field">
                <span className="ds-label">{t("addon.design-studio.insp.weight")}</span>
                <select
                  className="ds-select"
                  value={layer.weight}
                  onChange={(e) => patch({ weight: Number(e.target.value) } as never)}
                >
                  {WEIGHTS.map((weight) => (
                    <option key={weight} value={weight}>
                      {weight}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <div className="ds-label" style={{ marginBlockEnd: 5 }}>
                  {t("addon.design-studio.insp.alignment")}
                </div>
                <div className="ds-minirow">
                  {TEXT_ALIGNS.map(({ value, icon: Icon, key }) => (
                    <button
                      key={value}
                      type="button"
                      className="ds-minibtn"
                      aria-pressed={layer.align === value}
                      aria-label={t(key as never)}
                      title={t(key as never)}
                      onClick={() => patch({ align: value } as never)}
                    >
                      <Icon size={15} aria-hidden />
                    </button>
                  ))}
                </div>
              </div>

              <Swatches
                label={t("addon.design-studio.insp.colour")}
                current={layer.colour}
                t={t}
                onPick={(hex) => patch({ colour: hex } as never)}
              />
            </div>
          )}

          {layer.kind === "shape" && (
            <div className="ds-stack" style={{ gap: 10 }}>
              <Swatches
                label={t("addon.design-studio.insp.fill")}
                current={layer.fill}
                t={t}
                onPick={(hex) => patch({ fill: hex } as never)}
              />
              <Swatches
                label={t("addon.design-studio.insp.stroke")}
                current={layer.stroke}
                t={t}
                withNone
                onPick={(hex) => patch({ stroke: hex } as never)}
              />
              <div className="ds-grid2">
                <MmField
                  label={t("addon.design-studio.insp.lineWidth")}
                  value={layer.strokeMm}
                  step={0.1}
                  onChange={(v) => patch({ strokeMm: v } as never, `edit:${layer.id}:strokeW`)}
                  onDone={done}
                />
                <MmField
                  label={t("addon.design-studio.insp.radius")}
                  value={layer.radiusMm}
                  onChange={(v) => patch({ radiusMm: v } as never, `edit:${layer.id}:radius`)}
                  onDone={done}
                />
              </div>
            </div>
          )}

          <div>
            <div className="ds-eyebrow">{t("addon.design-studio.insp.alignPage")}</div>
            <div className="ds-align6">
              {PAGE_ALIGNS.map(({ align, icon: Icon, key }) => (
                <button
                  key={align}
                  type="button"
                  className="ds-minibtn"
                  aria-label={t(key as never)}
                  title={t(key as never)}
                  onClick={() => dispatch({ type: "alignPage", align })}
                >
                  <Icon size={15} aria-hidden />
                </button>
              ))}
            </div>
            <div className="ds-minirow" style={{ marginBlockStart: 6, flexWrap: "nowrap" }}>
              <button
                type="button"
                className="ds-minibtn"
                onClick={() => dispatch({ type: "distribute", axis: "x" })}
              >
                {t("addon.design-studio.insp.spreadX")}
              </button>
              <button
                type="button"
                className="ds-minibtn"
                onClick={() => dispatch({ type: "distribute", axis: "y" })}
              >
                {t("addon.design-studio.insp.spreadY")}
              </button>
            </div>
            {/* The refusal, in words, exactly where the button that refused is. */}
            {notice !== null && (
              <p className="ds-muted" style={{ margin: "6px 0 0" }} role="status">
                {t(notice as never)}
              </p>
            )}
          </div>

          <div>
            <div className="ds-eyebrow">{t("addon.design-studio.insp.order")}</div>
            <div className="ds-grid2">
              {Z_MOVES.map(({ move, key }) => (
                <button
                  key={move}
                  type="button"
                  className="ds-minibtn"
                  onClick={() => dispatch({ type: "z", move })}
                >
                  {t(key as never)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="ds-layers">
        <div className="ds-eyebrow">{t("addon.design-studio.layers")}</div>
        <div className="ds-layer-list">
          {listed.map((entry) => (
            <div
              key={entry.id}
              className="ds-layer-row"
              data-selected={entry.id === selected}
              data-hidden={entry.hidden}
            >
              <button
                type="button"
                className="ds-ghostbtn"
                aria-label={t("addon.design-studio.layers.toggle")}
                title={t("addon.design-studio.layers.toggle")}
                aria-pressed={!entry.hidden}
                onClick={() => dispatch({ type: "toggleHidden", id: entry.id })}
              >
                {entry.hidden ? <EyeOff size={13} aria-hidden /> : <Eye size={13} aria-hidden />}
              </button>
              <button
                type="button"
                className="ds-layer-name"
                style={{ fontWeight: entry.id === selected ? 800 : 600 }}
                onClick={() => dispatch({ type: "select", id: entry.id })}
              >
                {entry.name}
              </button>
              <button
                type="button"
                className="ds-ghostbtn"
                aria-label={t("addon.design-studio.layers.up")}
                title={t("addon.design-studio.layers.up")}
                onClick={() => {
                  dispatch({ type: "select", id: entry.id });
                  dispatch({ type: "z", move: "forward" });
                }}
              >
                <ChevronUp size={13} aria-hidden />
              </button>
              <button
                type="button"
                className="ds-ghostbtn"
                aria-label={t("addon.design-studio.layers.down")}
                title={t("addon.design-studio.layers.down")}
                onClick={() => {
                  dispatch({ type: "select", id: entry.id });
                  dispatch({ type: "z", move: "backward" });
                }}
              >
                <ChevronDown size={13} aria-hidden />
              </button>
            </div>
          ))}
          {listed.length === 0 && (
            <p className="ds-muted" style={{ margin: "6px 2px" }}>
              {t("addon.design-studio.layers.empty")}
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}

/**
 * A millimetre field. Rounds to a tenth on the way in, because that is the
 * document's working resolution and a customer typing 21.37 means 21.4.
 *
 * `onBlur` closes the coalescing run, exactly as the text area does: typing
 * `2`, `1`, `.`, `4` into X is one undo step, and coming back to X later is a
 * second one rather than the same one continued.
 */
function MmField({
  label,
  value,
  step = 0.5,
  onChange,
  onDone,
}: {
  label: string;
  value: number;
  step?: number;
  onChange: (value: number) => void;
  onDone: () => void;
}) {
  return (
    <label className="ds-numfield">
      <span className="ds-mono">{label}</span>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(roundMm(numberOr(e.target.value, value)))}
        onBlur={onDone}
      />
    </label>
  );
}

function numberOr(raw: string, fallback: number): number {
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function Swatches({
  label,
  current,
  withNone = false,
  t,
  onPick,
}: {
  label: string;
  current: string;
  withNone?: boolean;
  t: T;
  onPick: (hex: string) => void;
}) {
  return (
    <div>
      <div className="ds-label" style={{ marginBlockEnd: 6 }}>
        {label}
      </div>
      <div className="ds-swatches">
        {withNone && (
          <button
            type="button"
            className="ds-swatch"
            aria-pressed={current === NO_STROKE}
            aria-label={t("addon.design-studio.insp.noStroke")}
            title={t("addon.design-studio.insp.noStroke")}
            style={{ background: "transparent" }}
            onClick={() => onPick(NO_STROKE)}
          />
        )}
        {SWATCHES.map((swatch) => (
          <button
            key={swatch.id}
            type="button"
            className="ds-swatch"
            aria-pressed={current === swatch.hex}
            aria-label={t(swatch.key as never)}
            title={t(swatch.key as never)}
            style={{ background: swatch.hex }}
            onClick={() => onPick(swatch.hex)}
          />
        ))}
      </div>
    </div>
  );
}
