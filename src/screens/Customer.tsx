/**
 * The customer's six core screens: products, the configurator, artwork, the
 * basket, the confirmation and order tracking.
 *
 * The configurator is the heart of the product and the only screen here worth
 * reading closely. Every control it draws comes from `quote.ts` — which options
 * exist, which are impossible and WHY — so nothing in this file decides what a
 * customer may have. It decides only how the answer looks.
 */

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  CircleCheck,
  Clock,
  CreditCard,
  FileCheck2,
  FileText,
  Flag,
  Image,
  Info,
  Layers,
  Mail,
  PackageOpen,
  Palette,
  Scissors,
  Search,
  Sticker,
  TrendingDown,
  TriangleAlert,
  Type,
  UploadCloud,
  UserCheck,
} from "lucide-react";
import { useState } from "react";

import { fileFromRef, jobSpecFor } from "../add-ons/artwork.ts";
import { AddOnSlot } from "../components/AddOnSlot.tsx";
import { Chip, EmptyState, Field, Mono, Tile } from "../components/Primitives.tsx";
import { useT } from "../i18n/index.tsx";
import { PRODUCTS, PRODUCT_BY_KEY, SIZE_BY_KEY, type Product } from "../lib/catalogue.ts";
import { cents, day, mm, shortDay, sqm, trim, unitPrice } from "../lib/format.ts";
import {
  artworkBlocked,
  artworkNeedsTick,
  checkArtwork,
  checkCustomSize,
  finishOptions,
  fromPriceCents,
  nextBreakSaving,
  priceLevers,
  priceQuote,
  promiseFor,
  resolveSize,
  type ArtworkFile,
  type Configuration,
  type Quote,
} from "../lib/quote.ts";
import {
  BLEED_MM,
  EXPRESS_UPLIFT,
  MATERIAL_BY_KEY,
  PROOF_BY_POST_CENTS,
  QUANTITY_BREAKS,
  SIZE_LIMITS,
  TAX_RATE,
} from "../lib/rates.ts";
import { useStore } from "../state/store.ts";

/* ── 1 · PRODUCTS ────────────────────────────────────────────────────────── */

export function Products() {
  const t = useT();
  const startConfigure = useStore((s) => s.startConfigure);

  return (
    <section className="mp-screen">
      <div style={{ maxInlineSize: 640, marginBlockEnd: 26 }}>
        <h1 className="mp-h1">{t("cust.products.title")}</h1>
        <p className="mp-lede">{t("cust.products.lede")}</p>
      </div>

      <div className="mp-grid">
        {PRODUCTS.map((product) => (
          <button
            key={product.key}
            type="button"
            className="mp-product mp-card"
            onClick={() => startConfigure(product.key)}
          >
            <Tile
              family={product.family}
              icon={<ProductIcon product={product} size={46} />}
              chip={sizeChipFor(product)}
              badge={t(`data.product.${product.key}` as never).split(" ")[0]}
            />
            <div className="mp-product-body">
              <div className="mp-product-name">{t(`data.product.${product.key}` as never)}</div>
              <div className="mp-product-line">
                {t(`data.productLine.${product.key}` as never)}
              </div>
              <div className="mp-sizes">
                {product.sizes.slice(0, 4).map((size) => (
                  <span key={size} className="mp-size-chip mp-mono">
                    {size === "custom"
                      ? t("data.size.custom")
                      : mm(SIZE_BY_KEY[size]!.widthMm, SIZE_BY_KEY[size]!.heightMm)}
                  </span>
                ))}
              </div>
              <div className="mp-from">
                <span className="mp-from-note">
                  {t("cust.products.from", {
                    price: cents(fromPriceCents(product.key)),
                    qty: product.fromQuantity,
                  })}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mp-strip">
        {(["digital", "large", "finishing", "days"] as const).map((key) => (
          <div key={key} className="mp-strip-item">
            <span className="mp-strip-mark">
              <StripIcon which={key} />
            </span>
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              {t(`cust.products.strip.${key}.title` as never)}
            </div>
            <div style={{ fontSize: 12.5, lineHeight: 1.45, color: "var(--fg-muted)" }}>
              {t(`cust.products.strip.${key}.body` as never)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function sizeChipFor(product: Product): string {
  const first = product.sizes[0]!;
  if (first === "custom") return "custom";
  const size = SIZE_BY_KEY[first]!;
  return `${size.widthMm} × ${size.heightMm}`;
}

/* ── 2 · CONFIGURATOR ────────────────────────────────────────────────────── */

export function Configurator() {
  const t = useT();
  const config = useStore((s) => s.config);
  const patch = useStore((s) => s.patchConfig);
  const go = useStore((s) => s.go);
  const openOverlay = useStore((s) => s.openOverlay);

  if (config === null) return null;
  const product = PRODUCT_BY_KEY[config.product];
  const quote = priceQuote(config);
  const blocked = quote.blocked.length > 0;

  return (
    <section className="mp-screen">
      <button type="button" className="mp-footer-link" onClick={() => go("products")}>
        <ArrowLeft size={15} aria-hidden="true" style={{ verticalAlign: "-2px" }} />{" "}
        {t("common.backToProducts")}
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "14px 0 20px" }}>
        <Tile
          family={product.family}
          icon={<ProductIcon product={product} size={24} />}
          style={{ inlineSize: 52, blockSize: 52, borderRadius: 13, flex: "0 0 auto" }}
        />
        <div>
          <h1 style={{ margin: 0, fontSize: 25, fontWeight: 800, letterSpacing: "-0.02em" }}>
            {t(`data.product.${product.key}` as never)}
          </h1>
          <p style={{ margin: "3px 0 0", fontSize: 13.5, color: "var(--fg-muted)" }}>
            {t(`data.productLine.${product.key}` as never)}
          </p>
        </div>
      </div>

      <div className="mp-config">
        <div className="mp-steps">
          <MaterialStep config={config} product={product} onChange={patch} />
          <SizeStep config={config} product={product} onChange={patch} />
          {product.sidesChoice && <SidesStep config={config} onChange={patch} />}
          <FinishStep
            config={config}
            onChange={patch}
            onExplain={(finish, reason) => openOverlay({ kind: "finish-reason", finish, reason })}
          />
          <QuantityStep config={config} product={product} onChange={patch} />
          <OptionsStep config={config} product={product} onChange={patch} />
        </div>

        <QuotePanel config={config} quote={quote} />
      </div>

      {/* The panel detaches into a fixed bar under ~1024px. */}
      <div className="mp-quotebar mp-narrow-bar">
        {blocked ? (
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--warn)" }}>
            {t("cust.quote.barBlocked")}
          </span>
        ) : (
          <div style={{ flex: 1, minInlineSize: 0, display: "flex", alignItems: "baseline", gap: 8 }}>
            <Mono className="mp-quotebar-total">{cents(quote.totalCents)}</Mono>
            <button
              type="button"
              className="mp-footer-link"
              style={{ color: "var(--accent)", textDecoration: "underline" }}
              onClick={() => openOverlay({ kind: "quote-sheet" })}
            >
              {t("cust.quote.breakdown")}
            </button>
          </div>
        )}
        <button
          type="button"
          className="mp-button mp-btn"
          disabled={blocked}
          onClick={() => useStore.getState().addToBasket()}
        >
          {t("cust.quote.barCta")}
        </button>
      </div>
    </section>
  );
}

function Step({
  n,
  title,
  hint,
  children,
}: {
  n: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mp-step">
      <div className="mp-step-head">
        <span className="mp-step-n">{String(n).padStart(2, "0")}</span>
        <h2 className="mp-h2">{title}</h2>
        {hint !== undefined && <span className="mp-step-hint">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function MaterialStep({
  config,
  product,
  onChange,
}: {
  config: Configuration;
  product: Product;
  onChange: (p: Partial<Configuration>) => void;
}) {
  const t = useT();
  return (
    <Step n={1} title={t("cust.config.step.material")}>
      {/* Materials that cannot make this product are ABSENT, not disabled. */}
      <div className="mp-tiles">
        {product.materials.map((key) => (
          <Chip
            key={key}
            selected={config.material === key}
            label={t(`data.material.${key}` as never)}
            sub={`${MATERIAL_BY_KEY[key].gsm > 0 ? `${MATERIAL_BY_KEY[key].gsm}gsm` : "vinyl"}`}
            onClick={() => onChange({ material: key })}
          />
        ))}
      </div>
    </Step>
  );
}

function SizeStep({
  config,
  product,
  onChange,
}: {
  config: Configuration;
  product: Product;
  onChange: (p: Partial<Configuration>) => void;
}) {
  const t = useT();
  const custom = product.sizes[0] === "custom";

  if (!custom) {
    return (
      <Step n={2} title={t("cust.config.step.size")} hint={t("cust.config.size.hintPreset")}>
        <div className="mp-chips">
          {product.sizes.map((key) => {
            const size = SIZE_BY_KEY[key]!;
            return (
              <Chip
                key={key}
                selected={config.size === key}
                label={t(`data.size.${key}` as never)}
                sub={mm(size.widthMm, size.heightMm)}
                onClick={() => onChange({ size: key })}
              />
            );
          })}
        </div>
      </Step>
    );
  }

  const stretched = config.finish === "stretched";
  const check = checkCustomSize(config.customWidthMm ?? 0, config.customHeightMm ?? 0, {
    stretched,
  });
  const area = ((config.customWidthMm ?? 0) / 1000) * ((config.customHeightMm ?? 0) / 1000);

  return (
    <Step n={2} title={t("cust.config.step.size")} hint={t("cust.config.size.hintCustom")}>
      <div className="mp-custom-size">
        <Field
          label={
            <>
              {t("cust.config.size.width")}{" "}
              <span style={{ color: "var(--fg-subtle)", fontWeight: 500 }}>
                {t("cust.config.size.widthNote")}
              </span>
            </>
          }
        >
          <span
            className="mp-mm"
            data-invalid={check.violations.some((v) => v.limit.includes("Width") || v.limit === "limit.rollAxis")}
          >
            <input
              type="number"
              value={config.customWidthMm ?? ""}
              onChange={(e) => onChange({ customWidthMm: Number(e.target.value) })}
              aria-label={t("cust.config.size.width")}
            />
            <span className="mp-mm-unit">{t("common.mm")}</span>
          </span>
        </Field>
        <span style={{ paddingBlockEnd: 11, color: "var(--fg-subtle)" }}>×</span>
        <Field
          label={
            <>
              {t("cust.config.size.height")}{" "}
              <span style={{ color: "var(--fg-subtle)", fontWeight: 500 }}>
                {t("cust.config.size.heightNote")}
              </span>
            </>
          }
        >
          <span className="mp-mm">
            <input
              type="number"
              value={config.customHeightMm ?? ""}
              onChange={(e) => onChange({ customHeightMm: Number(e.target.value) })}
              aria-label={t("cust.config.size.height")}
            />
            <span className="mp-mm-unit">{t("common.mm")}</span>
          </span>
        </Field>
        <div style={{ display: "flex", flexDirection: "column", gap: 3, paddingBlockEnd: 2 }}>
          <span style={{ fontSize: 11.5, color: "var(--fg-subtle)" }}>
            {t("cust.config.size.area")}
          </span>
          <Mono
            style={{ fontSize: 15, fontWeight: 700 }}
          >{sqm(area)}</Mono>
        </div>
      </div>

      <p className="mp-limits">
        {stretched
          ? t("cust.config.size.limitsFrame", {
              w: SIZE_LIMITS.frame.maxWidthMm,
              h: SIZE_LIMITS.frame.maxHeightMm,
            })
          : t("cust.config.size.limits", {
              min: SIZE_LIMITS.minSideMm,
              roll: SIZE_LIMITS.maxRollAxisMm,
              length: SIZE_LIMITS.maxLengthAxisMm,
              area: SIZE_LIMITS.maxAreaSqm,
            })}
      </p>

      {/*
       * An out-of-range size NAMES the limit it broke and offers the nearest
       * size that works as a button. Never a silent clamp, never a disabled
       * field — the customer typed a real number and deserves a real answer.
       */}
      {check.violations.map((violation, i) => (
        <div key={`${violation.limit}-${i}`} className="mp-violation">
          <span className="mp-violation-text">
            <TriangleAlert size={15} aria-hidden="true" style={{ flex: "0 0 auto", marginBlockStart: 1 }} />
            {t(violation.limit as never, { actual: trim(violation.actual), bound: violation.bound })}
          </span>
          <button
            type="button"
            className="mp-violation-fix mp-btn"
            onClick={() =>
              onChange({
                customWidthMm: violation.nearest.widthMm,
                customHeightMm: violation.nearest.heightMm,
              })
            }
          >
            {t("limit.useNearest", {
              w: violation.nearest.widthMm,
              h: violation.nearest.heightMm,
            })}
          </button>
        </div>
      ))}
    </Step>
  );
}

function SidesStep({
  config,
  onChange,
}: {
  config: Configuration;
  onChange: (p: Partial<Configuration>) => void;
}) {
  const t = useT();
  return (
    <Step n={3} title={t("cust.config.step.sides")}>
      <div className="mp-chips">
        {([1, 2] as const).map((sides) => (
          <Chip
            key={sides}
            selected={config.sides === sides}
            label={t(`data.sides.${sides}` as never)}
            onClick={() => onChange({ sides })}
          />
        ))}
      </div>
    </Step>
  );
}

/**
 * Finishes the material cannot take are DISABLED WITH THE REASON ON THE CHIP,
 * and tapping one opens the same words in a popover. A grey chip that says
 * nothing is the failure mode this whole configurator argues against.
 */
function FinishStep({
  config,
  onChange,
  onExplain,
}: {
  config: Configuration;
  onChange: (p: Partial<Configuration>) => void;
  onExplain: (finish: string, reason: string) => void;
}) {
  const t = useT();
  const options = finishOptions(config);

  return (
    <Step n={4} title={t("cust.config.step.finish")}>
      <div className="mp-chips">
        {options.map((option) => (
          <Chip
            key={option.key}
            selected={config.finish === option.key}
            label={t(`data.finish.${option.key}` as never)}
            reason={option.reason === null ? null : t(option.reason as never)}
            onClick={() => onChange({ finish: option.key })}
            onDisabledClick={() =>
              onExplain(
                t(`data.finish.${option.key}` as never),
                t(option.reason as never),
              )
            }
          />
        ))}
      </div>
    </Step>
  );
}

function QuantityStep({
  config,
  product,
  onChange,
}: {
  config: Configuration;
  product: Product;
  onChange: (p: Partial<Configuration>) => void;
}) {
  const t = useT();
  const saving = product.quantityMode === "breaks" ? nextBreakSaving(config) : null;

  if (product.quantityMode === "small-run") {
    return (
      <Step n={5} title={t("cust.config.step.quantity")}>
        <div className="mp-row">
          <span className="mp-mm">
            <input
              type="number"
              min={1}
              max={20}
              value={config.quantity}
              onChange={(e) =>
                onChange({ quantity: Math.max(1, Math.min(20, Number(e.target.value))) })
              }
              aria-label={t("cust.config.step.quantity")}
            />
          </span>
          <span style={{ fontSize: 12.5, color: "var(--fg-subtle)" }}>
            {t("cust.config.quantity.smallRun", { max: 20 })}
          </span>
        </div>
      </Step>
    );
  }

  return (
    <Step n={5} title={t("cust.config.step.quantity")}>
      <div className="mp-chips">
        {QUANTITY_BREAKS.map((step) => {
          const at = priceQuote({ ...config, quantity: step.quantity });
          return (
            <Chip
              key={step.quantity}
              selected={config.quantity === step.quantity}
              label={<Mono>{step.quantity}</Mono>}
              sub={unitPrice(at.unitCents)}
              onClick={() => onChange({ quantity: step.quantity })}
            />
          );
        })}
        <Field label={t("cust.config.quantity.any")}>
          <input
            className="mp-input mp-input--mono mp-fld"
            style={{ inlineSize: 108 }}
            type="number"
            min={1}
            value={config.quantity}
            onChange={(e) => onChange({ quantity: Math.max(1, Number(e.target.value)) })}
          />
        </Field>
      </div>

      {saving !== null && (
        <p className="mp-saving">
          <TrendingDown size={15} aria-hidden="true" style={{ flex: "0 0 auto", marginBlockStart: 1 }} />
          {t("cust.config.quantity.saving", {
            current: config.quantity,
            currentUnit: unitPrice(saving.currentUnitCents),
            next: saving.quantity,
            nextUnit: unitPrice(saving.nextUnitCents),
          })}
        </p>
      )}
    </Step>
  );
}

function OptionsStep({
  config,
  product,
  onChange,
}: {
  config: Configuration;
  product: Product;
  onChange: (p: Partial<Configuration>) => void;
}) {
  const t = useT();
  const now = useStore((s) => s.now);
  const expressDay = promiseFor({ ...config, express: true }, { iso: now.iso, hour: now.hour });

  return (
    <Step n={6} title={t("cust.config.step.options")}>
      <div className="mp-stack">
        {product.packaging.length > 1 && (
          <div>
            <div className="mp-label" style={{ marginBlockEnd: 7 }}>
              {t("cust.config.options.packaging")}
            </div>
            <div className="mp-chips">
              {product.packaging.map((key) => (
                <Chip
                  key={key}
                  selected={config.packaging === key}
                  label={t(`data.packaging.${key}` as never)}
                  sub={t(`data.packagingHint.${key}` as never)}
                  onClick={() => onChange({ packaging: key })}
                />
              ))}
            </div>
          </div>
        )}

        <div className="mp-optrow">
          <button
            type="button"
            className="mp-check mp-btn"
            aria-pressed={config.printedProof}
            onClick={() => onChange({ printedProof: !config.printedProof })}
          >
            <span className="mp-check-box">
              {config.printedProof && <Check size={13} aria-hidden="true" />}
            </span>
            <span style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontSize: 13.5, fontWeight: 700 }}>
                {t("cust.config.options.proof")}
              </span>
              <span style={{ fontSize: 11.5, color: "var(--fg-subtle)" }}>
                {t("cust.config.options.proofNote", { price: cents(PROOF_BY_POST_CENTS) })}
              </span>
            </span>
          </button>

          <button
            type="button"
            className="mp-check mp-btn"
            aria-pressed={config.express}
            onClick={() => onChange({ express: !config.express })}
          >
            <span className="mp-check-box">
              {config.express && <Check size={13} aria-hidden="true" />}
            </span>
            <span style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontSize: 13.5, fontWeight: 700 }}>
                {t("cust.config.options.express")}
              </span>
              <span style={{ fontSize: 11.5, color: "var(--fg-subtle)" }}>
                {t("cust.config.options.expressNote", {
                  pct: Math.round(EXPRESS_UPLIFT * 100),
                  day: shortDay(expressDay.readyBy),
                })}
              </span>
            </span>
          </button>
        </div>

        <div>
          <div className="mp-label" style={{ marginBlockEnd: 7 }}>
            {t("cust.config.options.getting")}
          </div>
          <div className="mp-chips">
            {(["collection", "band-2kg"] as const).map((key) => (
              <Chip
                key={key}
                selected={config.delivery === key}
                label={t(`data.delivery.${key}` as never)}
                onClick={() => onChange({ delivery: key })}
              />
            ))}
          </div>
        </div>
      </div>
    </Step>
  );
}

/** Every figure traces to a choice above it, and the lines add up on screen. */
export function QuotePanel({ config, quote }: { config: Configuration; quote: Quote }) {
  const t = useT();
  const now = useStore((s) => s.now);
  const addToBasket = useStore((s) => s.addToBasket);
  const saveQuote = useStore((s) => s.saveQuote);
  const toast = useStore((s) => s.toast);
  const [leversOpen, setLeversOpen] = useState(false);

  const blocked = quote.blocked.length > 0;
  const promise = promiseFor(config, { iso: now.iso, hour: now.hour });

  return (
    <aside className="mp-quote">
      <div className="mp-quote-head">
        <span style={{ fontSize: 14, fontWeight: 800 }}>{t("cust.quote.title")}</span>
        <span className="mp-mono" style={{ fontSize: 11, color: "var(--fg-subtle)" }}>
          {t("common.exTaxLines")}
        </span>
      </div>

      {blocked ? (
        <div style={{ padding: "22px 18px", textAlign: "center", color: "var(--fg-subtle)", fontSize: 13 }}>
          {t("cust.quote.blocked")}
        </div>
      ) : (
        <>
          <div className="mp-quote-body">
            {quote.lines.map((line) => (
              <div key={line.key} className="mp-qrow">
                <div style={{ minInlineSize: 0 }}>
                  <div className="mp-qrow-label">{t(`line.${line.key}` as never)}</div>
                  <div className="mp-qrow-detail">{lineDetail(line, t)}</div>
                </div>
                <Mono className="mp-qrow-amt">{cents(line.amountCents)}</Mono>
              </div>
            ))}

            <div className="mp-qrow">
              <div className="mp-qrow-label" style={{ color: "var(--fg-muted)", fontWeight: 500 }}>
                {t("line.tax", { pct: Math.round(TAX_RATE * 100) })}
              </div>
              <Mono className="mp-qrow-amt" style={{ color: "var(--fg-muted)" }}>
                {cents(quote.taxCents)}
              </Mono>
            </div>

            <div className="mp-qrow mp-qrow--total">
              <div className="mp-qrow-label">{t("line.total")}</div>
              <Mono className="mp-qrow-amt">{cents(quote.totalCents)}</Mono>
            </div>

            <div className="mp-qrow" style={{ borderBlockEnd: 0, paddingBlockStart: 0 }}>
              <div style={{ fontSize: 12, color: "var(--fg-subtle)" }}>{t("line.worksOutAt")}</div>
              <Mono className="mp-qrow-amt" style={{ fontSize: 12.5, color: "var(--fg-subtle)" }}>
                {unitPrice(quote.unitCents)} {t("common.each")}
              </Mono>
            </div>
          </div>

          <div className="mp-quote-foot">
            <div className="mp-ready">
              <CircleCheck size={17} aria-hidden="true" style={{ color: "var(--pos)", flex: "0 0 auto" }} />
              <span>
                <strong>{t("cust.quote.ready", { day: day(promise.readyBy) })}</strong>{" "}
                <span style={{ color: "var(--fg-subtle)" }}>
                  · {t("cust.quote.readySub", { days: promise.workingDays })}
                </span>
              </span>
            </div>

            <button
              type="button"
              className="mp-button mp-button--ghost mp-btn"
              style={{ justifyContent: "flex-start" }}
              aria-expanded={leversOpen}
              onClick={() => setLeversOpen((v) => !v)}
            >
              <Info size={15} aria-hidden="true" />
              {t("cust.quote.levers")}
            </button>

            {leversOpen && (
              <div className="mp-levers">
                {priceLevers(quote).map((lever, i) => (
                  <div key={lever.key} className="mp-lever">
                    <span className="mp-lever-n">{i + 1}</span>
                    <span>
                      {t("cust.quote.leverLine", {
                        label: t(`line.${lever.key}` as never),
                        pct: lever.sharePct,
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button type="button" className="mp-button mp-btn mp-button--block" onClick={addToBasket}>
              {t("cust.quote.cta")}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="mp-button mp-button--ghost mp-btn mp-button--block"
              onClick={() => {
                saveQuote();
                toast(t("toast.quoteSaved", { ref: `MP-${4111 + useStore.getState().savedQuotes.length - 1}` }));
              }}
            >
              {t("cust.quote.save")}
            </button>
          </div>
        </>
      )}
    </aside>
  );
}

function lineDetail(
  line: Quote["lines"][number],
  t: ReturnType<typeof useT>,
): string {
  const d = line.detail;
  if (line.key === "print" || line.key === "material") {
    if (typeof d.sheets === "number") {
      return `${t("lineDetail.print", { sheets: d.sheets, rate: cents(Number(d.rate)) })} · ${t("lineDetail.break", { qty: "" })}`.replace(
        / · .*$/,
        typeof d.multiplier === "number" && d.multiplier < 1
          ? ` · ×${d.multiplier}`
          : "",
      );
    }
    if (typeof d.sqm === "number") {
      return t("lineDetail.sqm", { sqm: d.sqm, rate: cents(Number(d.rate)) });
    }
  }
  if (line.key === "express") return t("lineDetail.express", { pct: Number(d.pct) });
  if (line.key === "delivery" && typeof d.kg === "number")
    return t("lineDetail.weight", { kg: d.kg });
  return "";
}

/* ── 3 · ARTWORK ─────────────────────────────────────────────────────────── */

/** The file the demo pretends the customer dropped. */
const DROPPED: ArtworkFile = {
  filename: "your-artwork.pdf",
  widthPx: 1075,
  heightPx: 721,
  widthMm: 91,
  heightMm: 61,
  bleedMm: 3,
  nearestInkMm: 1.8,
  colourSpace: "CMYK",
  fontsEmbedded: true,
  pages: 2,
};

export function Artwork() {
  const t = useT();
  const basket = useStore((s) => s.basket);
  const go = useStore((s) => s.go);
  const accepted = useStore((s) => s.artworkAccepted);
  const acceptWarning = useStore((s) => s.acceptWarning);
  const supplied = useStore((s) => s.suppliedArtwork);
  const supplyArtwork = useStore((s) => s.supplyArtwork);
  const clearSupplied = useStore((s) => s.clearSuppliedArtwork);
  const registry = useStore((s) => s.registry);
  const addOnSettings = useStore((s) => s.addOnSettings);
  const [dropped, setDropped] = useState(false);

  const line = basket[basket.length - 1];
  const config = line?.config ?? null;
  if (config === null) {
    return (
      <section className="mp-screen mp-narrow">
        <EmptyState>{t("cust.basket.emptyBody")}</EmptyState>
      </section>
    );
  }

  const size = resolveSize(config);
  const uploaded: ArtworkFile = {
    ...DROPPED,
    widthMm: size.widthMm + BLEED_MM * 2,
    heightMm: size.heightMm + BLEED_MM * 2,
    pages: config.sides,
  };
  /*
   * A design an add-on made stands in for the upload rather than sitting beside
   * it: one job takes one file, and two artwork panels on one screen would
   * leave a customer choosing between them with no way to tell which the works
   * will print. The checks below are the SAME checks — `checkArtwork` does not
   * know or care where the file came from (24 §5.5).
   */
  const real = supplied?.file ?? uploaded;
  const showFile = supplied !== null || dropped;
  const verdicts = checkArtwork(real, config);
  const blocked = artworkBlocked(verdicts);
  const needsTick = artworkNeedsTick(verdicts);
  const ticked = accepted.includes(real.filename);

  return (
    <section className="mp-screen mp-narrow">
      <button type="button" className="mp-footer-link" onClick={() => go("configure")}>
        <ArrowLeft size={15} aria-hidden="true" style={{ verticalAlign: "-2px" }} />{" "}
        {t("common.backToJob")}
      </button>

      <h1 className="mp-h1" style={{ marginBlockStart: 14, fontSize: 28 }}>
        {t("cust.artwork.title")}
      </h1>
      <p className="mp-lede">{t("cust.artwork.lede")}</p>

      {/* The requirements are stated BEFORE the upload, not after it fails. */}
      <div className="mp-panel mp-panel-pad" style={{ marginBlockEnd: 16 }}>
        <div className="mp-reqs">
          {(["bleed", "dpi", "cmyk", "fonts", "pages"] as const).map((key) => (
            <div key={key} className="mp-req">
              <span className="mp-req-mark">
                <ReqIcon which={key} />
              </span>
              <div style={{ minInlineSize: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  {t(`cust.artwork.req.${key}.title` as never)}
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.4, color: "var(--fg-subtle)" }}>
                  {t(`cust.artwork.req.${key}.body` as never)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {!showFile ? (
        <button type="button" className="mp-drop mp-btn" onClick={() => setDropped(true)}>
          <span
            style={{
              inlineSize: 52,
              blockSize: 52,
              borderRadius: 14,
              display: "grid",
              placeItems: "center",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--accent)",
            }}
          >
            <UploadCloud size={26} aria-hidden="true" />
          </span>
          <span style={{ fontSize: 15.5, fontWeight: 800 }}>{t("cust.artwork.drop")}</span>
          <Mono style={{ fontSize: 12.5, color: "var(--fg-subtle)" }}>
            {t("cust.artwork.dropHint")}
          </Mono>
        </button>
      ) : (
        <div className="mp-stack">
          <div
            className="mp-row"
            style={{
              border: `1px solid ${blocked ? "var(--danger)" : needsTick && !ticked ? "var(--warn)" : "var(--pos)"}`,
              background: blocked
                ? "var(--danger-soft)"
                : needsTick && !ticked
                  ? "var(--warn-soft)"
                  : "var(--pos-soft)",
              borderRadius: 13,
              padding: "12px 15px",
            }}
          >
            {/*
             * DECORATIVE, AND NOW SAYING SO. The sentence beside it is the
             * status — "we can print this", "have a look at this first" — so a
             * screen reader announcing the icon as well would read the state
             * twice, and announcing it as an unnamed graphic reads it as
             * nothing at all. Every other icon in this app already carried
             * `aria-hidden`; this banner did not, because it only appears once
             * artwork is actually attached and no tour had ever attached any.
             */}
            {blocked ? (
              <CircleAlert size={19} aria-hidden="true" />
            ) : (
              <Check size={19} aria-hidden="true" />
            )}
            <span style={{ fontSize: 13.5, fontWeight: 700, flex: 1 }}>
              {blocked
                ? t("cust.artwork.statusFail")
                : needsTick && !ticked
                  ? t("cust.artwork.statusWarn")
                  : t("cust.artwork.statusOk")}
            </span>
            <button
              type="button"
              className="mp-footer-link"
              onClick={() => {
                setDropped(false);
                clearSupplied();
              }}
            >
              {supplied === null ? t("cust.artwork.startOver") : t("addon.host.artwork.discard")}
            </button>
          </div>

          <div className="mp-file">
            <Tile
              family={PRODUCT_BY_KEY[config.product].family}
              icon={<FileCheck2 size={34} aria-hidden="true" />}
              chip={real.filename}
            />
            <div className="mp-file-body">
              {supplied !== null && (
                <div className="mp-stack" style={{ gap: 3, marginBlockEnd: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>
                    {t("addon.host.artwork.from", {
                      name: registry.byKey(supplied.source)?.name ?? supplied.source,
                    })}
                  </span>
                  <span style={{ fontSize: 12.5, lineHeight: 1.45, color: "var(--fg-muted)" }}>
                    {t("addon.host.artwork.why")}
                  </span>
                  {/*
                   * AC7, and the reason it belongs HERE rather than in a
                   * footnote: three of the works' six checks — ink near the
                   * trim, colour space, embedded fonts — have nothing to
                   * measure on an add-on-supplied design, because
                   * `artwork-source@1` does not carry those facts (see
                   * `add-ons/artwork.ts`). The verdict list below therefore
                   * shows only the checks that ran, and a customer reading
                   * "everything checks out" would take it to cover all six.
                   * So the screen names what was measured and what was not,
                   * beside the verdicts rather than under them.
                   */}
                  <span style={{ fontSize: 12.5, lineHeight: 1.45, color: "var(--fg-subtle)" }}>
                    {t("addon.host.artwork.unmeasured")}
                  </span>
                  {/*
                   * The shop's own setting, said out loud where it lands. An
                   * editor that could quietly switch the works' proof off from
                   * a settings panel would be overruling the shop's promise to
                   * its customers, so the switch is the shop's and the sentence
                   * is here.
                   */}
                  {registry
                    .byKey(supplied.source)
                    ?.proofsArtwork?.(addOnSettings[supplied.source] ?? {}) === true && (
                    <span style={{ fontSize: 12.5, lineHeight: 1.45, color: "var(--fg-subtle)" }}>
                      {t("addon.host.artwork.stillProofed")}
                    </span>
                  )}
                </div>
              )}
              {verdicts.map((verdict, i) => (
                <div key={`${verdict.key}-${i}`} className="mp-verdict" data-level={verdict.level}>
                  {verdict.level === "pass" ? (
                    <Check size={16} aria-hidden="true" />
                  ) : verdict.level === "warn" ? (
                    <TriangleAlert size={16} aria-hidden="true" />
                  ) : (
                    <CircleAlert size={16} aria-hidden="true" />
                  )}
                  <span>{t(verdict.key as never, verdict.measured)}</span>
                </div>
              ))}

              {needsTick && !ticked && (
                <button
                  type="button"
                  className="mp-button mp-btn"
                  style={{
                    alignSelf: "flex-start",
                    background: "var(--warn-soft)",
                    color: "var(--warn)",
                    border: "1.5px solid var(--warn)",
                    fontSize: 12.5,
                    padding: "7px 11px",
                  }}
                  onClick={() => acceptWarning(real.filename)}
                >
                  <Check size={14} aria-hidden="true" />
                  {t("cust.artwork.accept")}
                </button>
              )}
              {ticked && (
                <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 700, color: "var(--pos)" }}>
                  <Check size={14} aria-hidden="true" />
                  {t("cust.artwork.accepted")}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            className="mp-button mp-btn mp-button--block"
            disabled={blocked || (needsTick && !ticked)}
            onClick={() => {
              /*
               * The SOURCE travels with the file. `supplied` is set only when
               * an add-on produced the artwork, so a plain upload passes
               * `undefined` and the basket line says "uploaded" — the field was
               * being stored and never read, which made it dead plumbing on
               * both ends.
               */
              useStore.getState().attachArtwork(real.filename, supplied?.source);
              go("basket");
            }}
          >
            {blocked ? t("cust.artwork.ctaBlocked") : t("cust.artwork.ctaOk")}
            {!blocked && <ArrowRight size={16} aria-hidden="true" />}
          </button>
        </div>
      )}

      <p style={{ margin: "16px 0 0", fontSize: 13, color: "var(--fg-subtle)", display: "flex", alignItems: "center", gap: 8 }}>
        <UserCheck size={16} aria-hidden="true" />
        {t("cust.artwork.human")}
      </p>

      {/*
       * SLOT 1 of 4. Empty on purpose in a build with no add-ons: this is where
       * the shop's chosen artwork sources appear, and it is sized to hold two
       * or three actions comfortably.
       */}
      <div style={{ marginBlockStart: 20 }}>
        <AddOnSlot
          slot="artwork.sources"
          payload={{
            /*
             * THE JOB, RESOLVED HERE, IN MILLIMETRES.
             *
             * It used to travel as `{ config, size, productLabel, job }` — this
             * app's own configuration record, naming a size by PRESET KEY,
             * alongside three resolutions of it. Both artwork add-ons read the
             * config and each carried a COPY of this app's size table to turn
             * `a5` into millimetres, which drifts here and misses entirely
             * anywhere else. One resolved job crosses the seam now, and the
             * tables are gone from both add-ons.
             */
            job: jobSpecFor(config, t(`data.product.${config.product}` as never)),
            // The way back onto the order. Without it an add-on would have to
            // reach into the host's store, and an add-on that does that has
            // stopped being optional.
            onArtwork: (ref) => supplyArtwork(fileFromRef(ref), ref.source),
          }}
          fallback={
            <div className="mp-slot-empty">
              <div className="mp-slot-empty-title">{t("cust.artwork.slotTitle")}</div>
              <div className="mp-slot-empty-body">{t("cust.artwork.slotEmpty")}</div>
            </div>
          }
          wrap={(children) => (
            <div className="mp-panel" style={{ padding: 18 }}>
              <div className="mp-slot-empty-title" style={{ marginBlockEnd: 12 }}>
                {t("cust.artwork.slotTitle")}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(238px, 1fr))",
                  gap: 12,
                }}
              >
                {children}
              </div>
            </div>
          )}
        />
      </div>
    </section>
  );
}

/* ── icons ───────────────────────────────────────────────────────────────── */

function ProductIcon({ product, size }: { product: Product; size: number }) {
  const Icon = ICONS[product.icon] ?? PackageOpen;
  return <Icon size={size} aria-hidden="true" />;
}

function StripIcon({ which }: { which: string }) {
  const Icon =
    which === "digital" ? FileText : which === "large" ? Flag : which === "finishing" ? Layers : Clock;
  return <Icon size={18} aria-hidden="true" />;
}

function ReqIcon({ which }: { which: string }) {
  const Icon =
    which === "bleed" ? Scissors : which === "dpi" ? Search : which === "cmyk" ? Palette : which === "fonts" ? Type : FileText;
  return <Icon size={16} aria-hidden="true" />;
}

const ICONS: Record<string, typeof CreditCard> = {
  "credit-card": CreditCard,
  "file-text": FileText,
  mail: Mail,
  sticker: Sticker,
  image: Image,
  flag: Flag,
};
