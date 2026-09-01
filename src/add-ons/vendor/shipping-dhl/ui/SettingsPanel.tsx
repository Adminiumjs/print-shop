/*
 * VENDORED from add-ons/packages/shipping-dhl/src/ui/SettingsPanel.tsx — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `shipping-dhl`; its manifest, tests and README live in the monorepo.
 */
/**
 * The carrier's own settings form, rendered into `settings.add-on.panel`.
 *
 * TWO THINGS MOVED HERE FROM THE HOST, and both were the same defect wearing
 * different clothes. The manage drawer used to write this form inline behind
 * `addOn.key === "shipping-dhl"`, and it used to compute the default parcel
 * weights by importing `parcel.ts` from this repo — host chrome calling one
 * carrier's weight engine, in an app whose central claim is that the second
 * delivery company is the same app with one file replaced.
 *
 * Now the host passes what it does know — one representative job per product
 * family, labelled in the reader's language — and the carrier answers what it
 * weighs. That is the same division `order.dispatch.actions` already had.
 *
 * The weights are computed rather than typed in, because a table that
 * disagreed with the weight the dispatch screen quotes would be worse than no
 * table at all: the works would read one number here and watch a different one
 * go on the label. Same engine, one source.
 *
 * Styling is from the host's token custom properties only — never its class
 * names — and in CSS LOGICAL PROPERTIES, because the host renders Arabic
 * right-to-left with no RTL stylesheet.
 */

import { useMemo } from "react";

import type { SettingsPanelPayload } from "../../host/index.ts";
import { useT } from "../i18n/t.ts";
import { parcelForSample } from "../parcel.ts";
import { DEFAULT_SETTINGS } from "../settings.ts";
import { Field, Mono, inputStyle } from "./atoms.tsx";

/** The saved values this panel edits, under the add-on's own machine keys. */
interface Values {
  demo_transport: boolean;
  collection_cutoff: string;
  returns_name: string;
  returns_lines: string;
  returns_city: string;
  returns_postcode: string;
  returns_country: string;
}

function read(settings: SettingsPanelPayload["settings"]): Values {
  const values = settings ?? {};
  const text = (key: keyof Values): string => {
    const value = values[key];
    return typeof value === "string" ? value : "";
  };
  return {
    demo_transport:
      typeof values.demo_transport === "boolean"
        ? values.demo_transport
        : DEFAULT_SETTINGS.demo_transport,
    collection_cutoff:
      typeof values.collection_cutoff === "string" && values.collection_cutoff !== ""
        ? values.collection_cutoff
        : DEFAULT_SETTINGS.collection_cutoff,
    // The returns depot (31 O4). Empty is a real state — NOT CONFIGURED — and
    // the return surface says so, so no field here invents a default.
    returns_name: text("returns_name"),
    returns_lines: text("returns_lines"),
    returns_city: text("returns_city"),
    returns_postcode: text("returns_postcode"),
    returns_country: text("returns_country"),
  };
}

export function SettingsPanel({ payload }: { payload: SettingsPanelPayload }) {
  const t = useT();
  const values = read(payload.settings);

  /*
   * THE HOST SAYS WHAT ONE WEIGHS; THIS SAYS WHAT A PARCEL OF THEM WEIGHS.
   *
   * `assumed` is non-empty when the shop gave no weight for a sample, and the
   * row then says so instead of printing a number that looks measured. That is
   * not a corner case dressed up: a host that sells something it does not weigh
   * is an ordinary host, and the field is optional in the contract precisely so
   * it can be honest here rather than crash there.
   */
  const weights = useMemo(
    () =>
      payload.samples.map((sample) => {
        const parcel = parcelForSample(sample);
        return {
          label: sample.label,
          weightKg: parcel.weightKg,
          assumed: parcel.from.assumed.length > 0,
        };
      }),
    [payload.samples],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <SettingsSwitch
        on={values.demo_transport}
        label={t("addon.shipping-dhl.set.demo")}
        note={t(
          values.demo_transport
            ? "addon.shipping-dhl.set.demoOn"
            : "addon.shipping-dhl.set.demoOff",
        )}
        onChange={(next) => payload.patch({ demo_transport: next })}
      />

      <Field label={t("addon.shipping-dhl.set.cutoffLabel")}>
        <input
          type="time"
          value={values.collection_cutoff}
          onChange={(e) => payload.patch({ collection_cutoff: e.target.value })}
          style={{ ...inputStyle, maxInlineSize: 140, fontVariantNumeric: "tabular-nums" }}
        />
      </Field>
      <div style={{ fontSize: 11.5, color: "var(--fg-subtle)", marginBlockStart: -8 }}>
        {t("addon.shipping-dhl.set.cutoffNote")}
      </div>

      {/*
       * The returns depot (31 O4) — where a customer's return parcel is
       * delivered. The shop tells its carrier where returns go; a host payload
       * carries no address for that surface, so the fact lives here, in the
       * add-on's own saved values. All five fields empty is a real state the
       * return surface names on screen rather than papering over.
       */}
      <div>
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 700,
            color: "var(--fg-muted)",
            marginBlockEnd: 8,
          }}
        >
          {t("addon.shipping-dhl.set.returns")}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          <Field label={t("addon.shipping-dhl.set.returnsName")}>
            <input
              value={values.returns_name}
              onChange={(e) => payload.patch({ returns_name: e.target.value })}
              style={inputStyle}
            />
          </Field>
          <Field label={t("addon.shipping-dhl.dest.street")}>
            <input
              value={values.returns_lines}
              onChange={(e) => payload.patch({ returns_lines: e.target.value })}
              style={inputStyle}
            />
          </Field>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 12,
            }}
          >
            <Field label={t("addon.shipping-dhl.dest.city")}>
              <input
                value={values.returns_city}
                onChange={(e) => payload.patch({ returns_city: e.target.value })}
                style={inputStyle}
              />
            </Field>
            <Field label={t("addon.shipping-dhl.error.postcode")}>
              <input
                value={values.returns_postcode}
                onChange={(e) => payload.patch({ returns_postcode: e.target.value })}
                style={inputStyle}
              />
            </Field>
            <Field label={t("addon.shipping-dhl.error.country")}>
              <input
                value={values.returns_country}
                onChange={(e) => payload.patch({ returns_country: e.target.value })}
                style={inputStyle}
              />
            </Field>
          </div>
        </div>
        <div style={{ fontSize: 11.5, color: "var(--fg-subtle)", marginBlockStart: 8 }}>
          {t("addon.shipping-dhl.set.returnsNote")}
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 700,
            color: "var(--fg-muted)",
            marginBlockEnd: 8,
          }}
        >
          {t("addon.shipping-dhl.set.weights")}
        </div>
        <div
          style={{ border: "1px solid var(--border)", borderRadius: 11, overflow: "hidden" }}
        >
          {weights.map((row, i) => (
            <div
              key={row.label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                padding: "9px 12px",
                background: "var(--surface-2)",
                borderBlockEnd:
                  i === weights.length - 1 ? "0" : "1px solid var(--border)",
              }}
            >
              <span style={{ fontSize: 12.5 }}>{row.label}</span>
              <Mono
                style={{
                  fontSize: 12,
                  color: row.assumed ? "var(--fg-subtle)" : "var(--fg-muted)",
                }}
              >
                {row.assumed
                  ? t("addon.shipping-dhl.set.weightAssumed", { kg: row.weightKg })
                  : t("addon.shipping-dhl.set.weightKg", { kg: row.weightKg })}
              </Mono>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--fg-subtle)", marginBlockStart: 8 }}>
          {t("addon.shipping-dhl.set.weightsNote")}
        </div>
      </div>
    </div>
  );
}

/**
 * The host's switch, drawn from tokens rather than borrowed from its stylesheet.
 *
 * Copied into each add-on that needs one instead of shared, for the same reason
 * the host seam and the contracts are mirrored: this repo publishes standalone and
 * there is no package between them.
 */
function SettingsSwitch({
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
