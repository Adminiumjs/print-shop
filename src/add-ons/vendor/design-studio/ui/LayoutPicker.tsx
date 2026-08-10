/*
 * VENDORED from add-ons/packages/design-studio/src/ui/LayoutPicker.tsx — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `design-studio`; its manifest, tests and README live in the monorepo.
 */
/**
 * The starting-layout picker: the first thing the editor shows.
 *
 * It exists because "what size is it?" is the question a print job actually
 * starts with, and answering it first is what lets the canvas open at the
 * finished size with the bleed already drawn. An editor that opened onto an
 * arbitrary rectangle and asked about the size later would be an editor whose
 * bleed could be wrong — which is the one thing this add-on is for.
 */

import { BookOpen, CreditCard, Flag, FileText, Mail, Plus, Square, Sticker, X } from "lucide-react";
import type { ComponentType } from "react";

import type { T } from "../i18n/strings.ts";
import { BLANK_LAYOUT, type StartingLayout } from "../layouts.ts";
import { Monogram } from "./Monogram.tsx";
import { tint } from "./tint.ts";

const ICONS: Record<string, ComponentType<{ size?: number; "aria-hidden"?: boolean }>> = {
  "credit-card": CreditCard,
  "book-open": BookOpen,
  "file-text": FileText,
  mail: Mail,
  sticker: Sticker,
  flag: Flag,
  square: Square,
};

export function LayoutPicker({
  layouts,
  t,
  onPick,
  onClose,
}: {
  layouts: readonly StartingLayout[];
  t: T;
  onPick: (layout: StartingLayout) => void;
  onClose: () => void;
}) {
  return (
    <div className="ds-modal" role="dialog" aria-modal="true" aria-label={t("addon.design-studio.picker.title")}>
      <div className="ds-modal-card">
        <div className="ds-modal-head">
          <Monogram large />
          <span style={{ flex: 1 }}>
            <span className="ds-modal-title">{t("addon.design-studio.picker.title")}</span>
            <span className="ds-modal-sub">{t("addon.design-studio.picker.body")}</span>
          </span>
          <button
            type="button"
            className="ds-ghostbtn"
            onClick={onClose}
            aria-label={t("addon.design-studio.close")}
          >
            <X size={16} aria-hidden />
          </button>
        </div>

        <div className="ds-modal-body">
          <div className="ds-tiles">
            {layouts.map((layout) => {
              const Icon = ICONS[layout.icon] ?? Square;
              return (
                <button
                  key={layout.id}
                  type="button"
                  className="ds-tile"
                  onClick={() => onPick(layout)}
                >
                  <span className="ds-tile-art" style={{ background: tint(layout.tint) }}>
                    <Icon size={30} aria-hidden />
                    <span className="ds-tile-chip ds-mono">
                      {layout.widthMm} × {layout.heightMm}mm
                    </span>
                  </span>
                  <span className="ds-tile-body">
                    <span className="ds-tile-name">{t(layout.key as never)}</span>
                    <span className="ds-tile-sides">
                      {t(
                        layout.sides === 2
                          ? "addon.design-studio.picker.twoSides"
                          : "addon.design-studio.picker.oneSide",
                      )}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <button type="button" className="ds-blank" onClick={() => onPick(BLANK_LAYOUT)}>
            <Plus size={16} aria-hidden />
            {t("addon.design-studio.picker.blank")} —{" "}
            <span className="ds-mono">
              {BLANK_LAYOUT.widthMm} × {BLANK_LAYOUT.heightMm}mm
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
