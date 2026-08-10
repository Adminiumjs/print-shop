/*
 * VENDORED from add-ons/packages/design-studio/src/ui/SettingsPanel.tsx — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `design-studio`; its manifest, tests and README live in the monorepo.
 */
/**
 * Design Studio's own settings form, rendered into `settings.add-on.panel`.
 *
 * IT LIVES HERE AND NOT IN THE HOST, and that is the whole point of the slot.
 * The manage drawer used to hand-write this form behind `addOn.key ===
 * "design-studio"`, which meant the host knew that this add-on has starting
 * layouts and that turning them all off is a mistake worth warning about. It
 * does not know either of those things now: it renders a slot and this fills it.
 *
 * A generic `{ key, kind }` form driven off `AddOn.settings` was considered and
 * rejected, and the reason is visible below: every control carries a SENTENCE,
 * and the sentence changes with the value. "A design still needs a proof" reads
 * one way when it is on and another when it is off, and a schema cannot supply
 * either. The add-on owns the control and the sentence together or it owns
 * neither.
 *
 * Styling is from the host's token custom properties only — never its class
 * names. `.mp-switch` existing is one app's private business; `--accent` is the
 * contract. CSS LOGICAL PROPERTIES throughout, because the host renders Arabic
 * right-to-left with no RTL stylesheet.
 */

import { Check } from "lucide-react";

import type { SettingsPanelPayload } from "../../host/index.ts";
import type { DesignStudioKey } from "../i18n/strings.ts";
import { LAYOUTS, LAYOUT_IDS } from "../layouts.ts";
import { useHostT } from "./useHostLocale.ts";

/** The values this panel edits, under the add-on's own machine keys (24 D15). */
export interface PublicSettings {
  starting_layouts?: readonly string[];
  proof_required?: boolean;
}

function read(settings: SettingsPanelPayload["settings"]): Required<PublicSettings> {
  const values = (settings ?? {}) as PublicSettings;
  return {
    starting_layouts: values.starting_layouts ?? LAYOUT_IDS,
    proof_required: values.proof_required !== false,
  };
}

export function SettingsPanel({ payload }: { payload: SettingsPanelPayload }) {
  const t = useHostT();
  const values = read(payload.settings);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBlockEnd: 8 }}>
          {t("addon.design-studio.set.layouts")}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 7 }}>
          {LAYOUTS.map((layout) => {
            const on = values.starting_layouts.includes(layout.id);
            return (
              <button
                key={layout.id}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  payload.patch({
                    starting_layouts: on
                      ? values.starting_layouts.filter((id) => id !== layout.id)
                      : [...values.starting_layouts, layout.id],
                  })
                }
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  border: `1.5px solid ${on ? "var(--accent)" : "var(--border)"}`,
                  background: on ? "var(--accent-soft)" : "var(--surface-2)",
                  borderRadius: 9,
                  padding: "7px 11px",
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: on ? "var(--accent)" : "var(--fg-muted)",
                  cursor: "pointer",
                }}
              >
                {on && <Check size={13} aria-hidden="true" />}
                {t(layout.key as DesignStudioKey)}
              </button>
            );
          })}
        </div>
        {values.starting_layouts.length === 0 && (
          <div style={{ fontSize: 12, color: "var(--warn)", marginBlockStart: 8 }}>
            {t("addon.design-studio.set.layoutsNone")}
          </div>
        )}
      </div>

      <SettingsSwitch
        on={values.proof_required}
        label={t("addon.design-studio.set.proof")}
        note={t(
          values.proof_required
            ? "addon.design-studio.set.proofOn"
            : "addon.design-studio.set.proofOff",
        )}
        onChange={(next) => payload.patch({ proof_required: next })}
      />

      {/*
        24 AC6 asks every add-on to carry the "not affiliated" line on its
        detail surface, and the host renders that line only where `namesCompany`
        is true. This add-on reports FALSE, which is the honest value — it names
        no company, so a disclaimer about one would be a sentence about nothing.
        What the criterion is really asking for is that a shop owner reading the
        detail surface never has to guess who else is involved, so this says it
        the only way that is true here: nobody is.

        IT LIVES IN THE ADD-ON, not in the host, for the reason the whole slot
        exists (§6, AC5): the host names no add-on and holds no add-on's copy.
        A generic host-side "this one connects to nothing" line would be the
        host asserting a fact about an add-on it is not supposed to know.
      */}
      <p
        style={{
          margin: 0,
          fontSize: 11.5,
          lineHeight: 1.5,
          color: "var(--fg-subtle)",
        }}
      >
        {t("addon.design-studio.noCompany")} {t("addon.design-studio.noAccount")}
      </p>
    </div>
  );
}

/**
 * The host's switch, drawn from tokens rather than borrowed from its stylesheet.
 *
 * Copied into each add-on that needs one instead of shared, for the same reason
 * the host seam and the contracts are mirrored: this repo publishes standalone and
 * there is no package between them. Twenty lines duplicated is a smaller cost
 * than a runtime dependency the host would have to keep.
 */
export function SettingsSwitch({
  on,
  label,
  note,
  onChange,
}: {
  on: boolean;
  label: string;
  note: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      style={{
        textAlign: "start",
        border: `1px solid ${on ? "var(--accent)" : "var(--border)"}`,
        background: on ? "var(--accent-soft)" : "var(--surface-2)",
        borderRadius: 12,
        padding: "13px 14px",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        inlineSize: "100%",
        cursor: "pointer",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: "relative",
          inlineSize: 38,
          blockSize: 22,
          borderRadius: 999,
          background: on ? "var(--accent)" : "var(--border-strong)",
          flex: "0 0 auto",
          marginBlockStart: 1,
        }}
      >
        <span
          style={{
            position: "absolute",
            insetBlockStart: 3,
            insetInlineStart: on ? 19 : 3,
            inlineSize: 16,
            blockSize: 16,
            borderRadius: 999,
            background: on ? "var(--accent-fg)" : "var(--surface)",
          }}
        />
      </span>
      <span style={{ minInlineSize: 0 }}>
        <span style={{ display: "block", fontSize: 13.5, fontWeight: 700 }}>{label}</span>
        <span
          style={{
            display: "block",
            fontSize: 12.5,
            lineHeight: 1.45,
            color: "var(--fg-muted)",
            marginBlockStart: 3,
          }}
        >
          {note}
        </span>
      </span>
    </button>
  );
}
