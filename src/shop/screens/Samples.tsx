/**
 * Order a sample pack: the works' stocks to tick, and where to post them.
 * One guest write behind the human check, with the stocks as links; a
 * second pack to the same address Adminium refuses (the address is kept as
 * one code, unique), and the page says so on the address.
 */
import { Check, CircleAlert, Mail } from "lucide-react";

import { useI18n, type MessageKey } from "../../i18n/index.tsx";
import { sampleErrors, samePlace, sendSamples, toggleSample, typeSamples, useAfter, type SampleField, type SampleValues } from "../after.ts";
import { useShop } from "../store.ts";

const FIELDS: { field: SampleField | "line2"; key: keyof SampleValues; label: MessageKey; placeholder?: MessageKey; auto: string }[] = [
  { field: "name", key: "name", label: "after.samples.name", placeholder: "after.samples.namePlaceholder", auto: "name" },
  { field: "email", key: "email", label: "after.lookup.email", auto: "email" },
  { field: "line1", key: "line1", label: "after.samples.line1", placeholder: "after.samples.addressPlaceholder", auto: "address-line1" },
  { field: "line2", key: "line2", label: "after.samples.line2", auto: "address-line2" },
  { field: "town", key: "town", label: "after.samples.town", auto: "address-level2" },
  { field: "postcode", key: "postcode", label: "after.samples.postcode", auto: "postal-code" },
];

const ERRORS: Record<SampleField, MessageKey> = {
  name: "after.samples.err.name",
  email: "after.lookup.err.emailEmpty",
  line1: "after.samples.err.address",
  town: "after.samples.err.town",
  postcode: "after.samples.err.postcode",
};

/** A stock's swatch: its kind and coating, and the sample's own stocks by their codes. */
const swatchOf = (code: string, kind: string, coated: boolean) => `ma-swatch ma-swatch--${kind === "roll" ? "roll" : coated ? "coated" : "uncoated"} ma-swatch--${code.replace(/[^a-z0-9-]/gi, "")}`;

export function SamplesScreen() {
  const { t, locale } = useI18n();
  const catalogue = useShop((s) => s.catalogue);
  const materials = catalogue?.materials ?? [];
  const samples = useAfter((s) => s.samples);
  const errors = samples.tried ? sampleErrors(samples) : {};
  const same = samePlace(samples.refused);
  const ready = samples.picked.length > 0 && samples.values.name.trim() !== "" && samples.values.line1.trim() !== "";
  const count = samples.picked.length;
  const send = async () => {
    const done = await sendSamples();
    if (done === "fix") {
      const e = sampleErrors(useAfter.getState().samples);
      const first = FIELDS.find((f) => f.field !== "line2" && e[f.field as SampleField] !== undefined);
      const id = same || samePlace(useAfter.getState().samples.refused) ? "ma-s-line1" : first === undefined ? null : `ma-s-${first.field}`;
      if (id !== null) setTimeout(() => document.getElementById(id)?.focus(), 0);
    }
  };
  const refusedElse = samples.refused !== null && !same;
  return (
    <section className="mp-screen ma-page ma-page--wide" aria-labelledby="ma-samples-title">
      <h1 id="ma-samples-title" className="mp-h1">
        {t("after.samples.title")}
      </h1>
      <p className="mp-lede">{t("after.samples.lede")}</p>
      <div className="ma-swatches" role="group" aria-label={t("after.samples.stocks")} aria-describedby={errors.stocks === undefined ? undefined : "ma-s-stock-err"}>
        {materials.map((m) => {
          const on = samples.picked.includes(m.code);
          return (
            <button key={m.code} type="button" className={on ? "ma-stock ma-stock--on" : "ma-stock"} aria-pressed={on} onClick={() => toggleSample(m.code)}>
              {on && (
                <span className="ma-stock-mark" aria-hidden="true">
                  <Check size={14} />
                </span>
              )}
              <span className={swatchOf(m.code, m.kind, m.coated)} aria-hidden="true" />
              <span className="ma-stock-body">
                <span className="ma-stock-kind">{t(m.kind === "roll" ? "after.samples.roll" : "after.samples.sheet")}</span>
                <span className="ma-stock-name">{m.name}</span>
                {m.spec !== null && <span className="mp-mono ma-stock-spec">{m.spec}</span>}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mp-card ma-form">
        <div className="ma-eyebrow">{count === 0 ? t("after.samples.none") : t("after.samples.count", { n: new Intl.NumberFormat(locale).format(count) }, count)}</div>
        {errors.stocks !== undefined && (
          <span id="ma-s-stock-err" role="alert" className="mp-field-error">
            <CircleAlert size={13} aria-hidden="true" />
            {t("after.samples.err.stocks")}
          </span>
        )}
        {FIELDS.map(({ field, key, label, placeholder, auto }) => {
          const own = field === "line2" ? undefined : errors[field];
          const err = own === undefined ? null : field === "email" && own === "shape" ? "after.lookup.err.emailShape" : ERRORS[field as SampleField];
          const placeErr = field === "line1" && same;
          const ids = [err === null ? null : `ma-s-${field}-err`, placeErr ? "ma-s-same" : null, field === "line1" ? "ma-s-hint" : null].filter(Boolean).join(" ");
          return (
            <label key={field} className="mp-field">
              <span className="mp-field-label">
                {t(label)}
                {field === "line2" && <span> · {t("after.samples.optional")}</span>}
              </span>
              <input
                id={`ma-s-${field}`}
                className="mp-input"
                type={field === "email" ? "email" : "text"}
                autoComplete={auto}
                value={samples.values[key]}
                placeholder={placeholder === undefined ? undefined : t(placeholder)}
                aria-invalid={err !== null || placeErr}
                aria-describedby={ids === "" ? undefined : ids}
                onChange={(e) => typeSamples({ [key]: e.target.value })}
              />
              {err !== null && (
                <span id={`ma-s-${field}-err`} role="alert" className="mp-field-error">
                  <CircleAlert size={13} aria-hidden="true" />
                  {t(err as MessageKey)}
                </span>
              )}
              {placeErr && (
                <span id="ma-s-same" role="alert" className="mp-field-error">
                  <CircleAlert size={13} aria-hidden="true" />
                  {t("after.samples.err.same")}
                </span>
              )}
              {field === "line1" && (
                <span id="ma-s-hint" className="mp-field-hint">
                  {t("after.samples.onePer")}
                </span>
              )}
            </label>
          );
        })}
        {refusedElse && (
          <p role="alert" className="mp-field-error">
            <CircleAlert size={13} aria-hidden="true" />
            {t(samples.refused?.code === "PUBLIC_SWITCHED_OFF" ? "after.samples.off" : samples.refused?.code === "UNREACHABLE" ? "after.err.unreachable" : "after.samples.refused")}
          </p>
        )}
        <button type="button" className={ready ? "mp-button mp-button--accent ma-start" : "mp-button ma-start ma-cta--idle"} aria-busy={samples.sending || undefined} onClick={() => void send()}>
          <Mail size={16} aria-hidden="true" />
          {samples.sending ? t("after.sending") : t("after.samples.cta")}
        </button>
      </div>
    </section>
  );
}
