/**
 * A product's page: the Customiser's three ways in (for a product designed
 * on one of its bases), the steps of the job (material, size, sides, finish,
 * quantity, options) and the quote beside them.
 *
 * Every figure is Adminium's: the chips' prices are one dry run holding one
 * job for each quantity break, and the quote panel is a dry run of the job as
 * its own order (its delivery band and tax are the order's). The page only
 * says which of the works' options this job may have, by its rules.
 */
import { ArrowLeft, ArrowRight, Calculator, CalendarCheck, Check, ChevronDown, ChevronRight, Info, Lock, Ruler, Store, TrendingDown, TriangleAlert, Truck, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { WaysIn } from "../../../vendor/customiser/index.js";
import "../../../vendor/customiser/editor.css";
import "../customiser-look.css";

import { useI18n, type MessageKey } from "../../i18n/index.tsx";
import { finishBlocked, LARGE_MAX_QTY, nextStep, optionById, optionsOf, packagingFor, sizeLimits, sizeProblems, stepsOf, type Choice, type FinishKind } from "../config.ts";
import { startSaveQuote, useAfter } from "../after.ts";
import { AREA, cappedAt, deliveryOf, EACH, figure, levers, partsOf, type Part } from "../figures.ts";
import { dayFull, decimal, money } from "../format.ts";
import { ProductIcon, rich, tintOf } from "../parts.tsx";
import type { Catalogue, Id, Option, Product, Row } from "../port.ts";
import { addJobForArtwork, choose, chooseDelivery, goView, jobFigures, openProduct, productOf, stepFigures, toggleFinish, useShop } from "../store.ts";

type T = ReturnType<typeof useI18n>["t"];
const same = (a: Id | null, b: Id | null) => a !== null && b !== null && String(a) === String(b);

function Step({ n, title, hint, children }: { n: number; title: string; hint?: string; children: ReactNode }) {
  const id = `mp-step-${String(n)}`;
  return (
    <section className="mp-step" aria-labelledby={id}>
      <div className="mp-step-head">
        <span className="mp-step-n" aria-hidden="true">
          {n}
        </span>
        <h2 id={id}>{title}</h2>
        {hint !== undefined && <span className="mp-step-hint">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

/** A finish the works does not offer on this job: shown, locked, and its reason one press away. */
function LockedChip({ label, reason, onWhy }: { label: string; reason: string; onWhy: (title: string, body: string) => void }) {
  return (
    <button type="button" className="mp-choice mp-choice--row mp-choice--off" aria-disabled="true" title={reason} onClick={() => onWhy(label, reason)}>
      <span>{label}</span>
      <Lock size={14} aria-hidden="true" />
    </button>
  );
}

function Pressable({ on, onPress, children, className = "mp-choice" }: { on: boolean; onPress: () => void; children: ReactNode; className?: string }) {
  return (
    <button type="button" className={className} aria-pressed={on} onClick={onPress}>
      {children}
    </button>
  );
}

function Sizes({ catalogue, product, choice }: { catalogue: Catalogue; product: Product; choice: Choice }) {
  const { t, locale } = useI18n();
  const job = jobFigures().job;
  if (product.kind === "sheet") {
    return (
      <div className="mp-chips" role="group" aria-label={t("shop.config.size")}>
        {optionsOf(catalogue, product.id, "size").map((o) => {
          const preset = catalogue.sizes.find((s) => same(s.id, o.sizeId));
          return (
            <Pressable key={String(o.id)} on={same(choice.sizeId, o.id)} onPress={() => choose({ sizeId: o.id })}>
              <span>{o.name}</span>
              {preset !== undefined && <span className="mp-choice-sub">{t("shop.mm2", { w: preset.width, h: preset.height })}</span>}
            </Pressable>
          );
        })}
      </div>
    );
  }
  const limits = sizeLimits(catalogue, product, choice);
  const problems = sizeProblems(catalogue, product, choice);
  const describedBy = (side: "width" | "height") => ["mp-size-limits", ...problems.filter((p) => p.side === side).map((p) => `mp-size-${p.side}`)].join(" ");
  const read = (value: string) => (value.replace(/[^0-9]/g, "") === "" ? 0 : Number.parseInt(value.replace(/[^0-9]/g, ""), 10));
  const area = figure(job, AREA);
  const problemText = (p: (typeof problems)[number]): string => {
    if (p.kind === "under") return t(p.side === "width" ? "shop.config.size.underWidth" : "shop.config.size.underHeight", { min: limits.minMm });
    if (limits.framed) return t(p.side === "width" ? "shop.config.size.overFrameWidth" : "shop.config.size.overFrameHeight", { w: limits.maxWidth, h: limits.maxHeight });
    return t(p.side === "width" ? "shop.config.size.overWidth" : "shop.config.size.overHeight", { max: p.fix });
  };
  return (
    <div>
      <div className="mp-size-row">
        <label className="mp-field">
          <span className="mp-field-label">
            {t("shop.config.size.width")} <span>{t("shop.config.size.across")}</span>
          </span>
          <span className="mp-with-unit">
            <input className="mp-input mp-input--num mp-input--mm" type="number" inputMode="numeric" value={choice.width ?? ""} aria-invalid={problems.some((p) => p.side === "width")} aria-describedby={describedBy("width")} onChange={(e) => choose({ width: read(e.target.value) })} />
            <span className="mp-unit">{t("shop.mm")}</span>
          </span>
        </label>
        <span className="mp-times" aria-hidden="true">
          ×
        </span>
        <label className="mp-field">
          <span className="mp-field-label">
            {t("shop.config.size.height")} <span>{t("shop.config.size.along")}</span>
          </span>
          <span className="mp-with-unit">
            <input className="mp-input mp-input--num mp-input--mm" type="number" inputMode="numeric" value={choice.height ?? ""} aria-invalid={problems.some((p) => p.side === "height")} aria-describedby={describedBy("height")} onChange={(e) => choose({ height: read(e.target.value) })} />
            <span className="mp-unit">{t("shop.mm")}</span>
          </span>
        </label>
        {area !== null && (
          <div className="mp-area">
            <span className="mp-small">{t("shop.config.size.area")}</span>
            <span className="mp-area-value">{t("shop.m2", { n: decimal(area, locale) })}</span>
          </div>
        )}
      </div>
      <p id="mp-size-limits" className="mp-limits">
        {limits.framed ? t("shop.config.size.limitsFrame", { w: limits.maxWidth, h: limits.maxHeight, min: limits.minMm }) : t("shop.config.size.limits", { min: limits.minMm, w: limits.maxWidth, h: limits.maxHeight })}
      </p>
      {problems.map((p) => (
        <div key={p.side} className="mp-fix">
          <span id={`mp-size-${p.side}`} role="alert" className="mp-fix-text">
            <TriangleAlert size={15} aria-hidden="true" />
            {problemText(p)}
          </span>
          <button type="button" className="mp-fix-button" onClick={() => choose({ [p.side]: p.fix })}>
            {t(p.side === "width" ? "shop.config.size.setWidth" : "shop.config.size.setHeight", { n: p.fix })}
          </button>
        </div>
      ))}
    </div>
  );
}

const FINISH_KINDS: Record<FinishKind, keyof Choice> = { lamination: "laminationId", spot_uv: "spotUvId", corners: "cornersId", edges: "edgesId", canvas: "canvasId" };

function Finishes({ catalogue, product, choice, onWhy }: { catalogue: Catalogue; product: Product; choice: Choice; onWhy: (title: string, body: string) => void }) {
  const { t } = useI18n();
  const of = (kind: FinishKind) => optionsOf(catalogue, product.id, kind);
  const chip = (kind: FinishKind, o: Option, toggle: boolean) => {
    const reason = finishBlocked(catalogue, choice, kind);
    if (reason !== null) return <LockedChip key={String(o.id)} label={o.name} reason={reason} onWhy={onWhy} />;
    const on = same(choice[FINISH_KINDS[kind]] as Id | null, o.id);
    return (
      <Pressable key={String(o.id)} on={on} className="mp-choice mp-choice--row" onPress={() => toggleFinish(kind, o.id)}>
        <span>{o.name}</span>
        {toggle && on && <Check size={14} aria-hidden="true" />}
      </Pressable>
    );
  };
  if (product.kind === "large") {
    const lamination = catalogue.rules.find((r) => r.group === "lamination" && r.test === "roll");
    return (
      <div className="mp-chips" role="group" aria-label={t("shop.config.finish")}>
        {of("edges").map((o) => chip("edges", o, false))}
        {of("edges").length > 0 && lamination !== undefined && <LockedChip label={t("shop.config.finish.lamination")} reason={lamination.reason} onWhy={onWhy} />}
        {of("canvas").map((o) => chip("canvas", o, false))}
      </div>
    );
  }
  const laminations = of("lamination");
  const lamination = optionById(catalogue, choice.laminationId);
  const looks = lamination !== null && lamination.code !== "lam-soft";
  return (
    <div>
      <div className="mp-chips" role="group" aria-label={t("shop.config.finish")}>
        {laminations.length > 0 && (
          <Pressable on={choice.laminationId === null} className="mp-choice mp-choice--row" onPress={() => choose({ laminationId: null, spotUvId: null })}>
            <span>{t("shop.config.finish.none")}</span>
          </Pressable>
        )}
        {laminations.map((o) => chip("lamination", o, false))}
        {of("spot_uv").map((o) => chip("spot_uv", o, true))}
        {of("corners").map((o) => chip("corners", o, true))}
      </div>
      {looks && (
        <div className="mp-looks">
          <div id="mp-look-label" className="mp-sublabel">
            {t("shop.config.look")} <span>{t("shop.config.look.same")}</span>
          </div>
          <div role="radiogroup" aria-labelledby="mp-look-label" className="mp-chips">
            {(["gloss", "matt"] as const).map((look) => (
              <button key={look} type="button" role="radio" aria-checked={choice.look === look} className="mp-choice" onClick={() => choose({ look })}>
                {t(`shop.config.look.${look}`)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Quantity({ catalogue, product, choice }: { catalogue: Catalogue; product: Product; choice: Choice }) {
  const { t, locale } = useI18n();
  const currency = useShop((s) => s.config.currency);
  const busy = useShop((s) => s.stepsQuote?.state === "busy");
  const [typed, setTyped] = useState<string>(String(choice.qty));
  useEffect(() => setTyped(String(choice.qty)), [choice.qty]);
  const m = (v: unknown) => money(v, currency, locale);
  const n = (v: number) => new Intl.NumberFormat(locale).format(v);
  if (product.kind === "large") {
    return (
      <div className="mp-stepper">
        <div className="mp-stepper-box" role="group" aria-label={t("shop.config.quantity")}>
          <button type="button" aria-label={t("shop.config.qty.less")} onClick={() => choose({ qty: choice.qty - 1 })}>
            −
          </button>
          <span className="mp-stepper-value" aria-live="polite">
            {n(choice.qty)}
          </span>
          <button type="button" aria-label={t("shop.config.qty.more")} onClick={() => choose({ qty: choice.qty + 1 })}>
            +
          </button>
        </div>
        <span className="mp-small">{t("shop.config.qty.large", { max: LARGE_MAX_QTY })}</span>
      </div>
    );
  }
  const steps = stepsOf(catalogue, product);
  const { job } = jobFigures();
  const capped = cappedAt(job);
  const next = nextStep(catalogue, product, choice.qty);
  const each = figure(job, EACH);
  const nextEach = next === null ? null : figure(stepFigures(next), EACH);
  const saving = capped === null && each !== null && nextEach !== null && Number(nextEach) < Number(each);
  return (
    <div>
      <div className="mp-chips">
        {steps.map((qty) => {
          const unit = figure(stepFigures(qty), EACH);
          return (
            <Pressable key={qty} on={choice.qty === qty} className="mp-choice mp-choice--qty" onPress={() => choose({ qty })}>
              <span className="mp-choice-qty">{n(qty)}</span>
              {busy ? <span className="mp-choice-sub">…</span> : unit !== null && <span className="mp-choice-sub">{t("shop.config.qty.each", { price: m(unit) })}</span>}
            </Pressable>
          );
        })}
        <label className="mp-field">
          <span className="mp-field-label">{t("shop.config.qty.any")}</span>
          <input
            className="mp-input mp-input--num"
            type="number"
            inputMode="numeric"
            min={1}
            value={typed}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, "");
              setTyped(raw);
              if (raw !== "") choose({ qty: Number.parseInt(raw, 10) });
            }}
          />
        </label>
      </div>
      {capped !== null && (
        <p className="mp-say mp-say--pos">
          <TrendingDown size={15} aria-hidden="true" />
          <span>
            {t("shop.config.qty.capped", { n: n(Number(capped)) })}{" "}
            <button type="button" className="mp-link" onClick={() => choose({ qty: Number(capped) })}>
              {t("shop.config.qty.makeIt", { n: n(Number(capped)) })}
            </button>
          </span>
        </p>
      )}
      {saving && (
        <p className="mp-say mp-say--pos">
          <TrendingDown size={15} aria-hidden="true" />
          {t("shop.config.qty.saving", { qty: n(choice.qty), each: m(each), next: n(next!), nextEach: m(nextEach) })}
        </p>
      )}
    </div>
  );
}

function Options({ catalogue, product, choice }: { catalogue: Catalogue; product: Product; choice: Choice }) {
  const { t, locale } = useI18n();
  const currency = useShop((s) => s.config.currency);
  const delivery = useShop((s) => s.delivery);
  const works = catalogue.works;
  const m = (v: unknown) => money(v, currency, locale);
  const { order } = jobFigures();
  const band = deliveryOf(order, catalogue.bands);
  const hint = (basis: string, price: string) => (basis === "unit" ? t("shop.config.pack.unit", { price: m(price) }) : basis === "per_500" ? t("shop.config.pack.per500", { price: m(price) }) : t("shop.config.pack.included"));
  return (
    <div className="mp-options">
      {product.kind === "sheet" && (
        <div>
          <div id="mp-pack-label" className="mp-sublabel">
            {t("shop.config.pack")}
          </div>
          <div className="mp-chips" role="group" aria-labelledby="mp-pack-label">
            {packagingFor(catalogue, product).map((p) => (
              <Pressable key={String(p.id)} on={same(choice.packagingId, p.id)} onPress={() => choose({ packagingId: p.id })}>
                <span>{p.name}</span>
                <span className="mp-choice-sub">{hint(p.basis, p.price)}</span>
              </Pressable>
            ))}
          </div>
        </div>
      )}
      <div className="mp-toggles">
        <button type="button" className="mp-toggle" aria-pressed={choice.proof} onClick={() => choose({ proof: !choice.proof })}>
          <span className="mp-tick">{choice.proof && <Check size={13} aria-hidden="true" />}</span>
          <span className="mp-toggle-text">
            <span className="mp-toggle-title">{t("shop.config.proof")}</span>
            <span className="mp-toggle-sub">{t("shop.config.proof.sub", { price: m(works.proofPostPrice ?? "0") }, works.proofPostDays ?? 0)}</span>
          </span>
        </button>
        <button type="button" className="mp-toggle" aria-pressed={choice.express} onClick={() => choose({ express: !choice.express })}>
          <span className="mp-tick">{choice.express && <Check size={13} aria-hidden="true" />}</span>
          <span className="mp-toggle-text">
            <span className="mp-toggle-title">{t("shop.config.express")}</span>
            <span className="mp-toggle-sub">{t("shop.config.express.sub", { pct: decimal(works.expressPercent ?? "0", locale) }, works.expressDays ?? 1)}</span>
          </span>
        </button>
      </div>
      <div>
        <div id="mp-getting-label" className="mp-sublabel">
          {t("shop.config.getting")}
        </div>
        <div className="mp-chips" role="radiogroup" aria-labelledby="mp-getting-label">
          <button type="button" role="radio" aria-checked={delivery === "deliver"} className="mp-choice mp-choice--row" onClick={() => chooseDelivery("deliver")}>
            <Truck size={15} aria-hidden="true" />
            <span>{band.toQuote ? t("shop.config.deliver.quote") : band.band === null ? t("shop.config.deliver") : t("shop.config.deliver.band", { band: band.band.name })}</span>
            <span className="mp-mono">{band.toQuote ? t("shop.toQuote") : band.price === null ? "" : m(band.price)}</span>
          </button>
          <button type="button" role="radio" aria-checked={delivery === "collect"} className="mp-choice mp-choice--row" onClick={() => chooseDelivery("collect")}>
            <Store size={15} aria-hidden="true" />
            <span>{t("shop.config.collect")}</span>
            <span className="mp-mono">{m("0.00")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/** A part's row name: its own, or the finish option the job chose. */
function partLabel(part: Part, catalogue: Catalogue, choice: Choice, t: T, job: Row | null, locale: string): string {
  if (typeof part.label === "string") {
    if (part.column === "cap_charge") return t(part.label, { n: new Intl.NumberFormat(locale).format(Number(cappedAt(job) ?? 0)) });
    return t(part.label);
  }
  const option = optionById(catalogue, choice[FINISH_KINDS[part.label.finish]] as Id | null);
  return option?.name ?? t(`shop.config.finish.${part.label.finish}` as MessageKey);
}

/** The quote's rows, its tax, total and price a piece: what both the panel and the phone's sheet show. */
export function QuoteRows({ catalogue, choice }: { catalogue: Catalogue; choice: Choice }) {
  const { t, locale } = useI18n();
  const currency = useShop((s) => s.config.currency);
  const delivery = useShop((s) => s.delivery);
  const m = (v: unknown) => money(v, currency, locale);
  const { job, order } = jobFigures();
  const parts = partsOf(job);
  const price = figure(job, "price");
  const band = deliveryOf(order, catalogue.bands);
  const weight = figure(order, "weight_kg");
  const rows: { key: string; label: string; detail?: string; amount: string; tone?: "strong" | "zero" | "pos" }[] = [];
  if (parts.length === 0 && price !== null) rows.push({ key: "price", label: t("shop.quote.part.job"), amount: m(price), tone: "strong" });
  for (const { part, amount } of parts) {
    rows.push({ key: part.column, label: partLabel(part, catalogue, choice, t, job, locale), amount: m(amount), ...(part.column === "cap_charge" ? { tone: "pos" as const } : Number(amount) === 0 ? { tone: "zero" as const } : ["print_charge", "material_charge", "setup"].includes(part.column) ? { tone: "strong" as const } : {}) });
  }
  if (order !== null) {
    const about = weight === null ? undefined : t("shop.quote.about", { kg: decimal(weight, locale, 1) });
    if (delivery === "collect") rows.push({ key: "delivery", label: t("shop.quote.collect"), detail: t("shop.quote.counter"), amount: m(order["delivery"] ?? "0"), tone: "zero" });
    else if (band.toQuote) rows.push({ key: "delivery", label: t("shop.quote.toQuote"), ...(about === undefined ? {} : { detail: t("shop.quote.overTop", { kg: decimal(weight, locale, 1) }) }), amount: t("shop.toQuote") });
    else rows.push({ key: "delivery", label: band.band === null ? t("shop.config.deliver") : t("shop.config.deliver.band", { band: band.band.name }), ...(about === undefined ? {} : { detail: about }), amount: m(order["delivery"]) });
  }
  const each = figure(job, EACH);
  return (
    <dl className="mp-rows">
      {rows.map((row) => (
        <div key={row.key} className={row.tone === undefined ? "mp-row" : `mp-row mp-row--${row.tone}`}>
          <dt>
            {row.label}
            {row.detail !== undefined && <span className="mp-row-detail">{row.detail}</span>}
          </dt>
          <dd>{row.amount}</dd>
        </div>
      ))}
      {order !== null && (
        <>
          <div className="mp-row mp-row--tax">
            <dt>{t("shop.quote.tax", { rate: decimal(order["tax_rate"] ?? catalogue.works.taxRate ?? "0", locale) })}</dt>
            <dd>{m(order["tax"])}</dd>
          </div>
          <div className="mp-row mp-row--total">
            <dt>{t("shop.quote.total")}</dt>
            <dd>{m(order["total"])}</dd>
          </div>
        </>
      )}
      {each !== null && (
        <div className="mp-row mp-row--each">
          <dt>{t("shop.quote.worksOut")}</dt>
          <dd>{t("shop.config.qty.each", { price: m(each) })}</dd>
        </div>
      )}
    </dl>
  );
}

/** "Ready Monday 10 August 2026 · three working days": the job's own ready-by, as Adminium stamps it. */
function Ready({ choice }: { choice: Choice }) {
  const { t, locale } = useI18n();
  const { job } = jobFigures();
  const ready = job?.["ready_by"];
  if (typeof ready !== "string" || ready === "") return null;
  const days = Number(job?.["turnaround_days"] ?? 0);
  const sub = choice.express ? t("shop.quote.ready.express", undefined, days) : choice.proof ? t("shop.quote.ready.proof", undefined, days) : t("shop.quote.ready.standard", undefined, days);
  return (
    <div className="mp-ready">
      <CalendarCheck size={17} aria-hidden="true" />
      <span>
        <strong>{rich(t, "shop.quote.ready", { day: <span className="mp-mono">{dayFull(ready, locale)}</span> })}</strong>
        <span className="mp-ready-sub"> · {sub}</span>
      </span>
    </div>
  );
}

function QuotePanel({ catalogue, product, choice }: { catalogue: Catalogue; product: Product; choice: Choice }) {
  const { t, locale } = useI18n();
  const quote = useShop((s) => s.jobQuote);
  const delivery = useShop((s) => s.delivery);
  const [open, setOpen] = useState(false);
  const blocked = sizeProblems(catalogue, product, choice).length > 0;
  const busy = quote?.state === "busy";
  const failed = quote?.state === "failed";
  const { job, order } = jobFigures();
  const moves = levers(job);
  const saving = useAfter((s) => s.saving.busy);
  const deliveryMoves = delivery === "deliver" && Number(order?.["delivery"] ?? 0) > 0;
  return (
    <aside className="mp-quote mp-quote--panel" aria-labelledby="mp-quote-title">
      <div className="mp-quote-head">
        <h2 id="mp-quote-title">{t("shop.quote.title")}</h2>
        <span className="mp-small mp-mono">{t("shop.quote.exTax")}</span>
      </div>
      {blocked ? (
        <div className="mp-quote-blocked">
          <Ruler size={22} aria-hidden="true" />
          <div>{t("shop.quote.blocked")}</div>
        </div>
      ) : (
        <div>
          <div role="status" aria-live="polite">
            {busy && (
              <div className="mp-pricing">
                <div className="mp-pricing-title">
                  <Calculator size={14} aria-hidden="true" />
                  {t("shop.quote.working")}
                </div>
                <div className="mp-skel" />
                <div className="mp-skel" />
                <div className="mp-skel" />
                <div className="mp-skel" />
                <div className="mp-skel" />
              </div>
            )}
            {failed && <p className="mp-quote-blocked">{t("shop.quote.failed")}</p>}
          </div>
          {!busy && !failed && <QuoteRows catalogue={catalogue} choice={choice} />}
          <div className="mp-quote-foot">
            <Ready choice={choice} />
            {(moves.length > 0 || deliveryMoves) && (
              <>
                <button type="button" className="mp-levers-button" aria-expanded={open} onClick={() => setOpen(!open)}>
                  {open ? <ChevronDown size={15} aria-hidden="true" /> : <ChevronRight size={15} aria-hidden="true" className="mp-flip" />}
                  {t("shop.quote.levers")}
                </button>
                {open && (
                  <ol className="mp-levers">
                    {[...moves.map((part) => partLabel(part, catalogue, choice, t, job, locale)), ...(deliveryMoves && moves.length < 3 ? [t("shop.quote.lever.delivery")] : [])].map((text, i) => (
                      <li key={text}>
                        <span className="mp-levers-n" aria-hidden="true">
                          {i + 1}
                        </span>
                        <span>{text}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </>
            )}
            <button type="button" className="mp-button mp-button--accent mp-quote-cta" onClick={() => addJobForArtwork()}>
              {t("shop.quote.send")}
              <ArrowRight size={16} aria-hidden="true" className="mp-flip" />
            </button>
            <button type="button" className="mp-button mp-quote-save" aria-busy={saving || undefined} onClick={() => void startSaveQuote()}>
              {t("after.save.button")}
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

/** The phone's bar: the total and the breakdown in a sheet, and the same way on to the artwork. */
function QuoteBar({ catalogue, product, choice }: { catalogue: Catalogue; product: Product; choice: Choice }) {
  const { t, locale } = useI18n();
  const currency = useShop((s) => s.config.currency);
  const quote = useShop((s) => s.jobQuote);
  const [sheet, setSheet] = useState(false);
  const close = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (sheet) close.current?.focus();
  }, [sheet]);
  const blocked = sizeProblems(catalogue, product, choice).length > 0;
  const { order } = jobFigures();
  const shut = () => {
    setSheet(false);
    opener.current?.focus();
  };
  return (
    <>
      <div className="mp-quote-bar">
        <div className="mp-quote-bar-total">
          {blocked ? (
            <span className="mp-say--warn">{t("shop.quote.blockedShort")}</span>
          ) : quote?.state === "busy" ? (
            <span role="status">{t("shop.quote.working")}</span>
          ) : (
            order !== null && (
              <>
                <span className="mp-quote-bar-amount">{money(order["total"], currency, locale)}</span>
                <button ref={opener} type="button" className="mp-link" onClick={() => setSheet(true)}>
                  {t("shop.quote.breakdown")}
                </button>
              </>
            )
          )}
        </div>
        <button type="button" className="mp-button mp-button--accent" aria-disabled={blocked} onClick={() => addJobForArtwork()}>
          {t("shop.quote.sendShort")}
        </button>
      </div>
      {sheet && (
        <div className="mp-scrim mp-scrim--sheet" onClick={shut} onKeyDown={(e) => e.key === "Escape" && shut()}>
          <div role="dialog" aria-modal="true" aria-labelledby="mp-sheet-title" className="mp-dialog mp-dialog--sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mp-quote-head">
              <h2 id="mp-sheet-title">{t("shop.quote.title")}</h2>
              <button ref={close} type="button" className="mp-icon-button" aria-label={t("shop.close")} onClick={shut}>
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <QuoteRows catalogue={catalogue} choice={choice} />
            <div className="mp-quote-foot">
              <Ready choice={choice} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Why a finish is not offered here, in the works' own words. */
function WhySheet({ why, onClose }: { why: { title: string; body: string } | null; onClose: () => void }) {
  const { t } = useI18n();
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (why !== null) button.current?.focus();
  }, [why]);
  if (why === null) return null;
  return (
    <div className="mp-scrim" onClick={onClose} onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="mp-why-title" aria-describedby="mp-why-body" className="mp-dialog" onClick={(e) => e.stopPropagation()}>
        <h2 id="mp-why-title">{why.title}</h2>
        <p id="mp-why-body">{why.body}</p>
        <button ref={button} type="button" className="mp-button" onClick={onClose}>
          {t("shop.config.why.ok")}
        </button>
      </div>
    </div>
  );
}

export function ConfigureScreen() {
  const { t, locale } = useI18n();
  const code = useShop((s) => s.productCode);
  const catalogue = useShop((s) => s.catalogue);
  const choice = useShop((s) => s.choice);
  const port = useShop((s) => s.port);
  const editing = useShop((s) => s.editing);
  // Read so the panel follows each answer.
  useShop((s) => s.jobQuote);
  useShop((s) => s.stepsQuote);
  const [why, setWhy] = useState<{ title: string; body: string; from: HTMLElement | null } | null>(null);
  const product = productOf(code);
  if (catalogue === null || product === null || choice === null || port === null) {
    return catalogue !== null && product === null ? <MissingProduct /> : null;
  }
  const sides = optionsOf(catalogue, product.id, "sides");
  const finishes = (["lamination", "spot_uv", "corners", "edges", "canvas"] as const).some((kind) => optionsOf(catalogue, product.id, kind).length > 0);
  let n = 0;
  const step = () => (n += 1);
  return (
    <section className="mp-screen" aria-labelledby="mp-config-title">
      <button type="button" className="mp-back" onClick={() => goView("products")}>
        <ArrowLeft size={15} aria-hidden="true" className="mp-flip" /> {t("shop.config.all")}
      </button>
      <div className="mp-config-head">
        <span className={`mp-config-mark ${tintOf(product.family)}`}>
          <ProductIcon name={product.icon} size={24} />
        </span>
        <div>
          <h1 id="mp-config-title">{product.name}</h1>
          {product.line !== null && <p>{product.line}</p>}
        </div>
      </div>
      {product.baseId !== null && (
        <div className="mp-ways">
          <WaysIn
            api={port.customiser()}
            base={product.baseId}
            product={product.name.toLocaleLowerCase(locale)}
            locale={locale}
            onChoose={() => openProduct(product.code, "design", editing)}
            onStartBlank={() => openProduct(product.code, "blank", editing)}
            onSendOwnFile={() => addJobForArtwork()}
          />
        </div>
      )}
      <div className="mp-config">
        <div className="mp-steps">
          <Step n={step()} title={t("shop.config.material")}>
            <div className="mp-tiles" role="group" aria-label={t("shop.config.material")}>
              {optionsOf(catalogue, product.id, "material").map((o) => {
                const stock = catalogue.materials.find((m) => same(m.id, o.materialId));
                return (
                  <Pressable key={String(o.id)} on={same(choice.materialId, o.id)} className="mp-choice mp-choice--tile" onPress={() => choose({ materialId: o.id })}>
                    <span>{o.name}</span>
                    {stock?.spec !== null && stock?.spec !== undefined && <span className="mp-choice-sub">{stock.spec}</span>}
                  </Pressable>
                );
              })}
            </div>
          </Step>
          <Step n={step()} title={t("shop.config.size")} hint={product.kind === "sheet" ? t("shop.config.size.trimmed") : t("shop.config.size.within")}>
            <Sizes catalogue={catalogue} product={product} choice={choice} />
          </Step>
          {sides.length > 1 && (
            <Step n={step()} title={t("shop.config.sides")}>
              <div className="mp-chips" role="group" aria-label={t("shop.config.sides")}>
                {sides.map((o) => (
                  <Pressable key={String(o.id)} on={same(choice.sidesId, o.id)} onPress={() => choose({ sidesId: o.id })}>
                    <span>{o.name}</span>
                  </Pressable>
                ))}
              </div>
            </Step>
          )}
          {finishes && (
            <Step n={step()} title={t("shop.config.finish")}>
              <Finishes catalogue={catalogue} product={product} choice={choice} onWhy={(title, body) => setWhy({ title, body, from: document.activeElement as HTMLElement | null })} />
            </Step>
          )}
          <Step n={step()} title={t("shop.config.quantity")}>
            <Quantity catalogue={catalogue} product={product} choice={choice} />
          </Step>
          <Step n={step()} title={t("shop.config.options")}>
            <Options catalogue={catalogue} product={product} choice={choice} />
          </Step>
        </div>
        <QuotePanel catalogue={catalogue} product={product} choice={choice} />
      </div>
      <QuoteBar catalogue={catalogue} product={product} choice={choice} />
      <WhySheet
        why={why}
        onClose={() => {
          why?.from?.focus();
          setWhy(null);
        }}
      />
    </section>
  );
}

function MissingProduct() {
  const { t } = useI18n();
  return (
    <section className="mp-screen mp-empty" aria-labelledby="mp-noproduct-title">
      <span className="mp-empty-icon">
        <Info size={26} aria-hidden="true" />
      </span>
      <h1 id="mp-noproduct-title" className="mp-empty-title">
        {t("shop.config.missing")}
      </h1>
      <button type="button" className="mp-button mp-button--accent" onClick={() => goView("products")}>
        {t("shop.basket.see")}
      </button>
    </section>
  );
}
