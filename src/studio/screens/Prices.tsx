/**
 * THE PRICE LIST (comp `I - Marlow Press` 1280-1326): the rate card the
 * quotes are worked out from, all ex tax, every figure a row of Adminium's —
 * the settings' single figures, each stock's rate, the finishes, packaging and
 * delivery bands, and the quantity breaks drawn as a line. The owner edits a
 * section in place: each figure typed is checked as a number and saved to its
 * own row, and every quote after that is worked out from it. A job already
 * taken keeps the rate card it was written with; saved quotes and baskets are
 * priced again.
 */
import { useEffect, useId, useState } from "react";
import { Pencil, UserRoundCog } from "lucide-react";

import { useData, useEnv, useRun } from "../env.tsx";
import { useFmt } from "../format.ts";
import { mayEditRates } from "../roles.ts";
import { Mono } from "../ui.tsx";
import { num, text, type Row } from "../wire.ts";
import type { Table, WorksData } from "../door.ts";
import { useT, type MessageKey } from "../../i18n/index.tsx";

/** One figure of the rate card: the row it lives in, its column, and how it reads. */
export interface Rate {
  id: string;
  label: string;
  table: Table;
  row: Row;
  column: string;
  /** "money" with a unit after it (`/ sheet`), or a percentage. */
  shape: "money" | "percent";
  unit: string;
}
/** A line of a section that is said, not typed (bundled packaging, delivery over the bands). */
interface Said {
  id: string;
  label: string;
  value: string;
}
interface Section {
  key: MessageKey;
  lines: (Rate | Said)[];
}

const isRate = (line: Rate | Said): line is Rate => "column" in line;

/** The rate card, as the comp groups it, from the rows Adminium holds. */
export function useRateCard(): Section[] {
  const t = useT();
  const data = useData();
  const settings = data.settings;
  const setting = (column: string, label: MessageKey, unit: MessageKey | null, shape: "money" | "percent" = "money"): Rate[] =>
    settings === null ? [] : [{ id: `settings.${column}`, label: t(label), table: "settings", row: settings, column, shape, unit: unit === null ? "" : t(unit) }];
  const byBasis: Record<string, MessageKey> = { sheet: "works.prices.perSheet", per_250: "works.prices.per250", metre: "works.prices.perMetre", piece: "works.prices.each", m2: "works.prices.perM2" };
  const finish = (groups: string[], bases?: string[]): Rate[] =>
    data.finishes
      .filter((f) => groups.includes(String(f["group"])) && f["active"] !== false && f["basis"] !== "none" && (bases === undefined || bases.includes(String(f["basis"]))))
      .map((f) => ({ id: `finishes.${String(f.id)}`, label: text(f["name"]) ?? "", table: "finishes", row: f, column: "price", shape: "money", unit: byBasis[String(f["basis"])] === undefined ? "" : t(byBasis[String(f["basis"])]!) }));
  const material = (kind: string): Rate[] =>
    data.materials
      .filter((m) => m["kind"] === kind && m["active"] !== false)
      .map((m) => ({ id: `materials.${String(m.id)}`, label: text(m["name"]) ?? "", table: "materials", row: m, column: "rate", shape: "money", unit: kind === "roll" ? t("works.prices.perM2") : "" }));
  const packUnit: Record<string, MessageKey> = { unit: "works.prices.perUnit", per_500: "works.prices.per500" };
  const packaging = data.packaging
    .filter((p) => p["active"] !== false)
    .map((p): Rate | Said =>
      p["basis"] === "included"
        ? { id: `packaging.${String(p.id)}`, label: text(p["name"]) ?? "", value: t("works.prices.included") }
        : { id: `packaging.${String(p.id)}`, label: text(p["name"]) ?? "", table: "packaging", row: p, column: "price", shape: "money", unit: packUnit[String(p["basis"])] === undefined ? "" : t(packUnit[String(p["basis"])]!) },
    );
  const boxes = data.bands.filter((b) => num(b["tube"]) !== 1).sort((a, b) => (num(a["max_kg"]) ?? 0) - (num(b["max_kg"]) ?? 0));
  const tubes = data.bands.filter((b) => num(b["tube"]) === 1);
  const top = boxes.at(-1);
  const band = (b: Row): Rate => ({ id: `delivery_bands.${String(b.id)}`, label: text(b["name"]) ?? "", table: "delivery_bands", row: b, column: "price", shape: "money", unit: "" });
  return [
    { key: "works.prices.setup", lines: setting("setup", "works.prices.everyJob", "works.prices.perJob") },
    { key: "works.prices.printing", lines: [...setting("print_single", "works.prices.single", "works.prices.perSheet"), ...setting("print_double", "works.prices.double", "works.prices.perSheet")] },
    { key: "works.prices.materialSheet", lines: material("sheet") },
    { key: "works.prices.finishing", lines: finish(["lamination", "spot_uv", "corners"]) },
    { key: "works.prices.large", lines: [...material("roll"), ...finish(["edges", "canvas"]), ...setting("large_format_minimum", "works.prices.minimum", "works.prices.perJob")] },
    { key: "works.prices.turnaround", lines: [...setting("express_percent", "works.prices.express", null, "percent"), ...setting("proof_post_price", "works.prices.proof", null)] },
    { key: "works.prices.packaging", lines: packaging },
    {
      key: "works.prices.delivery",
      lines: [
        ...boxes.map(band),
        ...tubes.map(band),
        ...(top === undefined ? [] : [{ id: "delivery.over", label: t("works.prices.over", { kg: String(num(top["max_kg"]) ?? "") }), value: t("works.prices.overValue") }]),
        { id: "delivery.collect", label: t("works.prices.collection"), value: t("works.prices.collectionValue") },
      ],
    },
  ].filter((s) => s.lines.length > 0) as Section[];
}

/** A typed figure as the rate card stores it; null when it is not one. */
export function typedRate(raw: string): number | null {
  const value = raw.replace(",", ".").trim();
  return /^\d+(\.\d{1,3})?$/.test(value) ? Number(value) : null;
}

export function PricesScreen() {
  const t = useT();
  const data = useData();
  const { door } = useEnv();
  const sections = useRateCard();
  const [editing, setEditing] = useState<MessageKey | null>(null);
  const owner = mayEditRates(door.who());

  return (
    <section className="wk-screen wk-prices" aria-labelledby="wk-prices-title">
      <h1 className="wk-h1" id="wk-prices-title">
        {t("works.prices.title")}
      </h1>
      <p className="wk-lede">{t("works.prices.lede")}</p>
      <div className="wk-price-grid">
        {sections.map((section) => (
          <PriceSection key={section.key} section={section} editable={owner && editing === null} editing={editing === section.key} onEdit={() => setEditing(section.key)} onDone={() => setEditing(null)} />
        ))}
        <BreaksChart data={data} />
      </div>
      <p className="wk-price-note">
        <UserRoundCog size={14} aria-hidden="true" />
        {t(owner ? "works.prices.noteOwner" : "works.prices.noteOthers")}
      </p>
    </section>
  );
}

function PriceSection({ section, editable, editing, onEdit, onDone }: { section: Section; editable: boolean; editing: boolean; onEdit: () => void; onDone: () => void }) {
  const t = useT();
  const fmt = useFmt();
  const { busy, run } = useRun();
  const headId = useId();
  const rates = section.lines.filter(isRate);
  const shown = (rate: Rate) => (rate.shape === "percent" ? t("works.prices.percent", { n: fmt.number(rate.row[rate.column], 2) }) : `${fmt.money(rate.row[rate.column])}${rate.unit === "" ? "" : ` ${rate.unit}`}`);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!editing) return;
    setValues(Object.fromEntries(rates.map((r) => [r.id, String(num(r.row[r.column]) ?? "")])));
    setErrors({});
    // Opened: the values are the rows' as they stand now.
  }, [editing]);

  const save = () => {
    const bad = Object.fromEntries(rates.map((r) => [r.id, typedRate(values[r.id] ?? "") === null]));
    setErrors(bad);
    if (Object.values(bad).some(Boolean)) {
      document.getElementById(`${headId}-${rates.find((r) => bad[r.id])!.id}`)?.focus();
      return;
    }
    void run(async (door) => {
      for (const rate of rates) {
        const value = typedRate(values[rate.id] ?? "")!;
        if (value === num(rate.row[rate.column])) continue;
        await door.saveRate(rate.table, rate.row, { [rate.column]: value });
      }
      onDone();
      return t("works.prices.saved", { section: t(section.key) });
    });
  };

  return (
    <div className="wk-panel wk-price-card" aria-labelledby={headId} role="group">
      <div className="wk-price-head">
        <h2 className="wk-price-title" id={headId}>
          {t(section.key)}
        </h2>
        {editable && rates.length > 0 && (
          <button type="button" className="wk-btn wk-btn--small wk-btn--edit" aria-label={t("works.prices.editAria", { section: t(section.key) })} onClick={onEdit}>
            <Pencil size={13} aria-hidden="true" />
            {t("works.prices.edit")}
          </button>
        )}
      </div>
      {!editing ? (
        <dl className="wk-price-rows">
          {section.lines.map((line) => (
            <div key={line.id} className="wk-price-row">
              <dt>{line.label}</dt>
              <dd className="wk-mono">{isRate(line) ? shown(line) : line.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="wk-price-edit" onKeyDown={(e) => e.key === "Escape" && (e.stopPropagation(), onDone())}>
          {rates.map((rate) => {
            const id = `${headId}-${rate.id}`;
            return (
              <div key={rate.id} className="wk-price-field">
                <div className="wk-price-field-row">
                  <label htmlFor={id}>{rate.label}</label>
                  <span className={`wk-price-input${errors[rate.id] === true ? " wk-price-input--bad" : ""}`}>
                    <input
                      id={id}
                      className="wk-mono"
                      inputMode="decimal"
                      value={values[rate.id] ?? ""}
                      aria-invalid={errors[rate.id] === true}
                      aria-describedby={errors[rate.id] === true ? `${id}-err` : undefined}
                      onChange={(e) => {
                        setValues((v) => ({ ...v, [rate.id]: e.target.value }));
                        setErrors((x) => ({ ...x, [rate.id]: false }));
                      }}
                    />
                    <Mono className="wk-price-unit">{rate.shape === "percent" ? "%" : rate.unit}</Mono>
                  </span>
                </div>
                {errors[rate.id] === true && (
                  <span id={`${id}-err`} role="alert" className="wk-error wk-error--end">
                    {t("works.prices.bad")}
                  </span>
                )}
              </div>
            );
          })}
          <div className="wk-price-actions">
            <button type="button" className="wk-btn wk-btn--primary wk-grow" disabled={busy} onClick={save}>
              {t("works.prices.save")}
            </button>
            <button type="button" className="wk-btn" onClick={onDone}>
              {t("works.cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** The quantity breaks as the comp draws them: each break's multiplier, a point on a line. */
function BreaksChart({ data }: { data: WorksData }) {
  const t = useT();
  const fmt = useFmt();
  const breaks = [...data.breaks].sort((a, b) => (num(a["min_qty"]) ?? 0) - (num(b["min_qty"]) ?? 0));
  const ms = breaks.map((b) => num(b["multiplier"]) ?? 1);
  const max = Math.max(1, ...ms);
  const min = Math.min(0.55, ...ms);
  const step = breaks.length > 1 ? 292 / (breaks.length - 1) : 0;
  const y = (m: number) => 18 + ((max - m) / (max - min || 1)) * 88;
  const points = breaks.map((b, i) => ({ x: 24 + i * step, y: y(num(b["multiplier"]) ?? 1), m: num(b["multiplier"]) ?? 1, q: num(b["min_qty"]) ?? 0 }));
  return (
    <div className="wk-panel wk-price-card wk-price-chart">
      <h2 className="wk-price-title">{t("works.prices.breaks")}</h2>
      <p className="wk-price-chart-lede">{t("works.prices.breaksLede")}</p>
      <svg viewBox="0 0 340 132" className="wk-chart" role="img" aria-label={t("works.prices.breaksAria", { list: points.map((p) => t("works.prices.breakPoint", { qty: fmt.number(p.q), m: fmt.fixed(p.m, 2) })).join(", ") })}>
        <polyline points={points.map((p) => `${String(p.x)},${String(p.y)}`).join(" ")} className="wk-chart-line" />
        {points.map((p) => (
          <g key={p.q}>
            <circle cx={p.x} cy={p.y} r={4} className="wk-chart-dot" />
            <text x={p.x} y={p.y - 9} textAnchor="middle" className="wk-chart-m">
              {fmt.fixed(p.m, 2)}
            </text>
            <text x={p.x} y={126} textAnchor="middle" className="wk-chart-q">
              {fmt.number(p.q)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
