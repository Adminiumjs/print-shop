/**
 * The comp's supporting screens — find us, order again, the sample pack,
 * templates & sizes, your proofs, saved quotes, delivery & collection — plus
 * the shop's own Add-ons shelf and the 404.
 *
 * The Add-ons screen is host surface, not add-on surface: it ships with the
 * `AddOnHost` and is a complete screen in a build with no add-ons at all,
 * because its honest empty state — "Nothing is connected yet. The shop works
 * fine without any of these." — is a settled fact rather than a gap.
 */

import {
  Check,
  Clock,
  Download,
  FileQuestion,
  History,
  Info,
  Mail,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Store,
  Truck,
} from "lucide-react";
import { useState } from "react";

import { isConnectable, resolveActivity, type AddOn } from "../add-ons/host.ts";
import { useActivityContext } from "../add-ons/useActivityContext.ts";
import { Affiliation } from "../components/Affiliation.tsx";
import { EmptyState, Field, Monogram, Mono, Tag, Tile } from "../components/Primitives.tsx";
import { useT } from "../i18n/index.tsx";
import { PRODUCTS, PRODUCT_BY_KEY, SIZE_BY_KEY, type ProductKey } from "../lib/catalogue.ts";
import { cents, clock, day, mm, shortDay } from "../lib/format.ts";
import { imposition, proofApproved } from "../lib/jobs.ts";
import { priceQuote, resolveSize } from "../lib/quote.ts";
import { BLEED_MM, DELIVERY_BANDS, MATERIALS, SAFE_MM } from "../lib/rates.ts";
import { useStore } from "../state/store.ts";

/**
 * What the shelf calls an add-on.
 *
 * A built add-on's name is a proper noun and is rendered verbatim; the four
 * described-but-not-built entries carry a `nameKey` because their "name" is a
 * description of a capability, and a description belongs in the message bundle
 * with the other eight locales. See `add-ons/shelf.ts`.
 */
function addOnName(addOn: AddOn, t: ReturnType<typeof useT>): string {
  return addOn.nameKey === undefined ? addOn.name : t(addOn.nameKey as never);
}

/* ── Find us ─────────────────────────────────────────────────────────────── */

export function FindUs() {
  const t = useT();
  return (
    <section className="mp-screen mp-narrow">
      <h1 className="mp-h1" style={{ fontSize: 30 }}>
        {t("cust.find.title")}
      </h1>
      <p className="mp-lede">{t("cust.find.lede")}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        {(["where", "when", "talk"] as const).map((key) => (
          <div key={key} className="mp-panel mp-panel-pad">
            <span className="mp-strip-mark" style={{ marginBlockEnd: 9 }}>
              {key === "where" ? <MapPin size={17} /> : key === "when" ? <Clock size={17} /> : <Mail size={17} />}
            </span>
            <div style={{ fontSize: 14, fontWeight: 700, marginBlockEnd: 4 }}>
              {t(`cust.find.${key}.title` as never)}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--fg-muted)", whiteSpace: "pre-line" }}>
              {t(`cust.find.${key}.body` as never)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Order it again ──────────────────────────────────────────────────────── */

export function Reorder() {
  const t = useT();
  const pastJobs = useStore((s) => s.pastJobs);
  const startConfigure = useStore((s) => s.startConfigure);

  return (
    <section className="mp-screen mp-narrow">
      <h1 className="mp-h1" style={{ fontSize: 28 }}>
        {t("cust.reorder.title")}
      </h1>
      <p className="mp-lede">{t("cust.reorder.lede")}</p>
      <div className="mp-stack" style={{ gap: 12 }}>
        {pastJobs.map((job) => {
          const product = PRODUCT_BY_KEY[job.productKey as ProductKey];
          const quote = priceQuote({
            product: job.productKey as never,
            material: job.materialKey as never,
            size: product.sizes[0]!,
            sides: job.sides,
            finish: job.finishKey as never,
            quantity: job.quantity,
            packaging: job.packagingKey as never,
            printedProof: false,
            express: false,
            delivery: "collection",
          });
          return (
            <div key={job.ref} className="mp-panel mp-panel-pad mp-row" style={{ flexWrap: "nowrap", gap: 15 }}>
              <Tile
                family={product.family}
                icon={<RotateCcw size={22} aria-hidden="true" />}
                style={{ inlineSize: 44, blockSize: 44, borderRadius: 11, flex: "0 0 auto" }}
              />
              <div style={{ flex: 1, minInlineSize: 0 }}>
                <div className="mp-row" style={{ gap: 9, alignItems: "baseline" }}>
                  <span style={{ fontSize: 15, fontWeight: 800 }}>
                    {t(`data.product.${job.productKey}` as never)}
                  </span>
                  <Mono style={{ fontSize: 11.5, color: "var(--fg-subtle)" }}>{job.ref}</Mono>
                </div>
                <div style={{ fontSize: 12.5, color: "var(--fg-muted)", marginBlockStart: 2 }}>
                  {t(`data.material.${job.materialKey}` as never)} · {job.quantity}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--fg-subtle)", marginBlockStart: 2 }}>
                  {t("cust.reorder.when", { date: shortDay(job.promisedFor) })}
                </div>
              </div>
              <div style={{ textAlign: "end", flex: "0 0 auto" }}>
                <Mono style={{ fontSize: 15, fontWeight: 800, display: "block" }}>
                  {cents(quote.totalCents)}
                </Mono>
                <div style={{ fontSize: 10.5, color: "var(--fg-subtle)", marginBlockEnd: 7 }}>
                  {t("cust.reorder.today")}
                </div>
                <button
                  type="button"
                  className="mp-button mp-btn"
                  style={{ padding: "8px 14px", fontSize: 13 }}
                  onClick={() => startConfigure(job.productKey as never)}
                >
                  <RotateCcw size={14} aria-hidden="true" />
                  {t("cust.reorder.cta")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ── Sample pack ─────────────────────────────────────────────────────────── */

export function Samples() {
  const t = useT();
  const selection = useStore((s) => s.sampleSelection);
  const toggle = useStore((s) => s.toggleSample);
  const toast = useStore((s) => s.toast);
  const [form, setForm] = useState({ name: "", address: "" });

  return (
    <section className="mp-screen" style={{ maxInlineSize: 880 }}>
      <h1 className="mp-h1" style={{ fontSize: 28 }}>
        {t("cust.samples.title")}
      </h1>
      <p className="mp-lede">{t("cust.samples.lede")}</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 12,
          marginBlockEnd: 22,
        }}
      >
        {MATERIALS.map((material) => {
          const chosen = selection.includes(material.key);
          return (
            <button
              key={material.key}
              type="button"
              className="mp-product mp-btn"
              style={{ borderColor: chosen ? "var(--accent)" : undefined, borderWidth: 1.5 }}
              aria-pressed={chosen}
              onClick={() => toggle(material.key)}
            >
              <span
                className="mp-swatch"
                style={{ ["--tile" as string]: `var(--tint-${material.kind === "sheet" ? "paper" : "large"})` }}
              />
              <span style={{ display: "block", padding: "10px 12px 12px", textAlign: "start" }}>
                <span className="mp-eyebrow" style={{ display: "block", marginBlockEnd: 3 }}>
                  {t(`cust.samples.kind.${material.kind}` as never)}
                </span>
                <span style={{ display: "block", fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>
                  {t(`data.material.${material.key}` as never)}
                </span>
                {chosen && (
                  <span style={{ display: "inline-flex", marginBlockStart: 6, color: "var(--accent)" }}>
                    <Check size={14} aria-hidden="true" />
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mp-panel mp-panel-pad mp-stack" style={{ maxInlineSize: 520 }}>
        <div className="mp-eyebrow" style={{ color: "var(--accent)" }}>
          {selection.length === 0
            ? t("cust.samples.countNone")
            : t("cust.samples.count", { count: selection.length }, selection.length)}
        </div>
        <Field label={t("cust.samples.name")}>
          <input
            className="mp-input mp-fld"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={t("cust.samples.namePlaceholder")}
          />
        </Field>
        <Field label={t("cust.samples.address")}>
          <textarea
            className="mp-input mp-fld"
            rows={3}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder={t("cust.samples.addressPlaceholder")}
          />
        </Field>
        <button
          type="button"
          className="mp-button mp-btn"
          style={{ alignSelf: "flex-start" }}
          disabled={selection.length === 0 || form.name.trim() === "" || form.address.trim() === ""}
          onClick={() => toast(t("toast.samplesSent"), "pos")}
        >
          <Mail size={16} aria-hidden="true" />
          {t("cust.samples.cta")}
        </button>
      </div>
    </section>
  );
}

/* ── Templates & sizes ───────────────────────────────────────────────────── */

export function Templates() {
  const t = useT();
  const toast = useStore((s) => s.toast);

  return (
    <section className="mp-screen" style={{ maxInlineSize: 920 }}>
      <h1 className="mp-h1" style={{ fontSize: 28 }}>
        {t("cust.templates.title")}
      </h1>
      <p className="mp-lede">{t("cust.templates.lede")}</p>

      <div className="mp-row" style={{ gap: 8, marginBlockEnd: 24 }}>
        {(
          [
            ["bleed", `${BLEED_MM}mm`],
            ["safe", `${SAFE_MM}mm`],
            ["dpi", "150dpi"],
            ["cmyk", "CMYK"],
            ["fonts", ""],
          ] as const
        ).map(([key]) => (
          <Tag key={key}>{t(`cust.templates.spec.${key}` as never)}</Tag>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 14 }}>
        {PRODUCTS.map((product) => (
          <div key={product.key} className="mp-panel mp-panel-pad mp-stack" style={{ gap: 12 }}>
            <div className="mp-row" style={{ flexWrap: "nowrap" }}>
              <Tile
                family={product.family}
                icon={<Download size={19} aria-hidden="true" />}
                style={{ inlineSize: 38, blockSize: 38, borderRadius: 10, flex: "0 0 auto" }}
              />
              <span style={{ fontSize: 15, fontWeight: 800 }}>
                {t(`data.product.${product.key}` as never)}
              </span>
            </div>

            {product.sizes[0] === "custom" ? (
              <p style={{ margin: 0, fontSize: 12.5, color: "var(--fg-muted)", lineHeight: 1.5 }}>
                {t("cust.templates.lfNote")}
              </p>
            ) : (
              <div>
                {product.sizes.map((key) => {
                  const size = SIZE_BY_KEY[key]!;
                  const impos = imposition(size.widthMm, size.heightMm, 1);
                  return (
                    <div
                      key={key}
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: "7px 0",
                        borderBlockEnd: "1px solid var(--border)",
                      }}
                    >
                      <span style={{ fontSize: 12.5, fontWeight: 600 }}>
                        {t(`data.size.${key}` as never)}
                      </span>
                      <Mono style={{ fontSize: 11, color: "var(--fg-subtle)" }}>
                        {t("cust.templates.up", { up: impos.up })}
                      </Mono>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              className="mp-button mp-button--ghost mp-btn"
              style={{ alignSelf: "flex-start", marginBlockStart: "auto", padding: "8px 13px", fontSize: 12.5 }}
              onClick={() =>
                toast(t("toast.templateDownloaded", { name: t(`data.product.${product.key}` as never) }))
              }
            >
              <Download size={14} aria-hidden="true" />
              {t("cust.templates.download")}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Your proofs ─────────────────────────────────────────────────────────── */

export function Proofs() {
  const t = useT();
  const jobs = useStore((s) => s.jobs);
  const approveProof = useStore((s) => s.approveProof);
  const toast = useStore((s) => s.toast);

  const waiting = jobs.filter((j) => j.proofs.some((p) => p.kind === "sent"));

  return (
    <section className="mp-screen mp-narrow">
      <h1 className="mp-h1" style={{ fontSize: 28 }}>
        {t("cust.proofs.title")}
      </h1>
      <p className="mp-lede">{t("cust.proofs.lede")}</p>

      {waiting.length === 0 ? (
        <EmptyState>{t("cust.proofs.empty")}</EmptyState>
      ) : (
        <div className="mp-stack">
          {waiting.map((job) => {
            const done = proofApproved(job);
            return (
              <div key={job.ref} className="mp-panel mp-panel-pad">
                <div className="mp-row" style={{ flexWrap: "nowrap", alignItems: "flex-start" }}>
                  <Tile
                    family={PRODUCT_BY_KEY[job.productKey as ProductKey].family}
                    icon={<Check size={21} aria-hidden="true" />}
                    style={{ inlineSize: 42, blockSize: 42, borderRadius: 11, flex: "0 0 auto" }}
                  />
                  <div style={{ flex: 1, minInlineSize: 0 }}>
                    <div className="mp-row" style={{ gap: 9, alignItems: "baseline" }}>
                      <span style={{ fontSize: 15, fontWeight: 800 }}>
                        {t(`data.product.${job.productKey}` as never)}
                      </span>
                      <Mono style={{ fontSize: 11.5, color: "var(--fg-subtle)" }}>{job.ref}</Mono>
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--fg-muted)", marginBlockStart: 2 }}>
                      {job.quantity} · {mm(job.trimWidthMm, job.trimHeightMm)}
                    </div>
                  </div>
                  <Tag tone={done ? "pos" : "warn"}>
                    {t(done ? "cust.proofs.approved" : "cust.proofs.waiting")}
                  </Tag>
                </div>

                <div className="mp-row" style={{ marginBlockStart: 13, justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12.5, color: "var(--fg-muted)" }}>
                    {t("cust.proofs.readyLabel", { day: day(job.promisedFor) })}
                  </span>
                  {!done && (
                    <button
                      type="button"
                      className="mp-button mp-button--pos mp-btn"
                      style={{ padding: "8px 14px", fontSize: 12.5 }}
                      onClick={() => {
                        approveProof(job.ref);
                        toast(t("toast.proofApproved", { day: shortDay(job.promisedFor) }), "pos");
                      }}
                    >
                      <Check size={14} aria-hidden="true" />
                      {t("cust.order.approve")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ── Saved quotes ────────────────────────────────────────────────────────── */

export function SavedQuotes() {
  const t = useT();
  const saved = useStore((s) => s.savedQuotes);
  const startConfigure = useStore((s) => s.startConfigure);
  const toast = useStore((s) => s.toast);

  return (
    <section className="mp-screen" style={{ maxInlineSize: 920 }}>
      <h1 className="mp-h1" style={{ fontSize: 28 }}>
        {t("cust.saved.title")}
      </h1>
      <p className="mp-lede">{t("cust.saved.lede")}</p>

      {saved.length === 0 ? (
        <EmptyState>{t("cust.saved.empty")}</EmptyState>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
          {saved.map((quote) => {
            const product = PRODUCT_BY_KEY[quote.config.product];
            const priced = priceQuote(quote.config);
            const size = resolveSize(quote.config);
            return (
              <div key={quote.ref} className="mp-panel mp-panel-pad mp-stack" style={{ gap: 12 }}>
                <div className="mp-row" style={{ flexWrap: "nowrap" }}>
                  <Tile
                    family={product.family}
                    icon={<Pencil size={20} aria-hidden="true" />}
                    style={{ inlineSize: 40, blockSize: 40, borderRadius: 10, flex: "0 0 auto" }}
                  />
                  <div style={{ flex: 1, minInlineSize: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 800 }}>
                      {t(`data.product.${product.key}` as never)}
                    </div>
                    <div className="mp-row" style={{ gap: 8 }}>
                      <Mono style={{ fontSize: 11, color: "var(--fg-subtle)" }}>{quote.ref}</Mono>
                      <span style={{ fontSize: 11, color: "var(--fg-subtle)" }}>
                        {t("cust.saved.when", { date: shortDay(quote.savedOn) })}
                      </span>
                    </div>
                  </div>
                  <Mono style={{ fontSize: 14.5, fontWeight: 800, flex: "0 0 auto" }}>
                    {cents(priced.totalCents)}
                  </Mono>
                </div>
                <div style={{ fontSize: 12.5, color: "var(--fg-muted)" }}>
                  {quote.config.quantity} · {mm(size.widthMm, size.heightMm)} ·{" "}
                  {t(`data.material.${quote.config.material}` as never)}
                </div>
                <div className="mp-row" style={{ gap: 9, flexWrap: "nowrap" }}>
                  <button
                    type="button"
                    className="mp-button mp-button--ghost mp-btn"
                    style={{ flex: 1, padding: 9, fontSize: 12.5 }}
                    onClick={() => startConfigure(quote.config.product)}
                  >
                    <Pencil size={14} aria-hidden="true" />
                    {t("common.open")}
                  </button>
                  <button
                    type="button"
                    className="mp-button mp-btn"
                    style={{ flex: 1, padding: 9, fontSize: 12.5 }}
                    onClick={() => {
                      startConfigure(quote.config.product);
                      toast(t("toast.addedToOrder"));
                    }}
                  >
                    <Plus size={14} aria-hidden="true" />
                    {t("cust.saved.add")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ── Delivery & collection ───────────────────────────────────────────────── */

export function DeliveryInfo() {
  const t = useT();
  return (
    <section className="mp-screen mp-narrow">
      <h1 className="mp-h1" style={{ fontSize: 28 }}>
        {t("cust.delivery.title")}
      </h1>
      <p className="mp-lede">{t("cust.delivery.lede")}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginBlockEnd: 16 }}>
        {(["collect", "courier"] as const).map((key) => (
          <div key={key} className="mp-panel mp-panel-pad">
            <span className="mp-strip-mark" style={{ marginBlockEnd: 12 }}>
              {key === "collect" ? <Store size={20} /> : <Truck size={20} />}
            </span>
            <div style={{ fontSize: 16, fontWeight: 800, marginBlockEnd: 6 }}>
              {t(`cust.delivery.${key}.title` as never)}
            </div>
            <p style={{ margin: 0, fontSize: 13.5, color: "var(--fg-muted)", lineHeight: 1.55 }}>
              {t(`cust.delivery.${key}.body` as never)}
            </p>
          </div>
        ))}
      </div>

      <div className="mp-panel" style={{ padding: "6px 18px", marginBlockEnd: 22 }}>
        {DELIVERY_BANDS.map((band, i) => (
          <div
            key={band.key}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              padding: "13px 0",
              borderBlockEnd: i < DELIVERY_BANDS.length - 1 ? "1px solid var(--border)" : 0,
            }}
          >
            <span style={{ fontSize: 13.5, fontWeight: 700 }}>
              {t(`data.delivery.${band.key}` as never)}
            </span>
            <Mono style={{ fontSize: 14, fontWeight: 800 }}>{cents(band.rateCents)}</Mono>
          </div>
        ))}
      </div>

      <div className="mp-stack" style={{ gap: 12 }}>
        {(["cutoff", "turnaround"] as const).map((key) => (
          <div key={key} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <Clock size={19} aria-hidden="true" style={{ color: "var(--accent)", flex: "0 0 auto", marginBlockStart: 1 }} />
            <p style={{ margin: 0, fontSize: 13.5, color: "var(--fg-muted)", lineHeight: 1.55 }}>
              <strong style={{ color: "var(--fg)", fontWeight: 700 }}>
                {t(`cust.delivery.${key}.title` as never)}
              </strong>{" "}
              {t(`cust.delivery.${key}.body` as never)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── The shop's Add-ons shelf ────────────────────────────────────────────── */

export function AddOns() {
  const t = useT();
  const registry = useStore((s) => s.registry);
  const enabled = useStore((s) => s.enabled);
  const openOverlay = useStore((s) => s.openOverlay);
  const category = useStore((s) => s.addOnCategory);
  const setCategory = useStore((s) => s.setAddOnCategory);
  /** Which "Not in this demo" chip has been asked to explain itself. */
  const [tip, setTip] = useState<string | null>(null);

  const connected = registry.all.filter((a) => enabled.has(a.key));
  /*
   * The same context the manage drawer uses (`useActivityContext`), so "last
   * used" on the shelf and the first line inside the drawer are the same
   * instant rather than two independent guesses.
   */
  const activityContext = useActivityContext();
  const available = registry.all
    .filter((a) => !enabled.has(a.key))
    .filter((a) => category === "all" || a.category === category);

  const CATS = ["all", "artwork", "delivery", "payments", "email", "data"] as const;

  return (
    <section className="mp-screen">
      <h1 className="mp-h1" style={{ fontSize: 24 }}>
        {t("shop.addons.title")}
      </h1>
      <p className="mp-lede">{t("shop.addons.lede")}</p>

      <div className="mp-addons">
        <nav className="mp-cat-rail" aria-label={t("shop.addons.title")}>
          {CATS.map((cat) => (
            <button
              key={cat}
              type="button"
              className="mp-cat"
              aria-pressed={category === cat}
              onClick={() => setCategory(cat)}
            >
              <span style={{ flex: 1 }}>{t(`shop.addons.cat.${cat}` as never)}</span>
              <Mono className="mp-cat-count">
                {cat === "all"
                  ? registry.all.length
                  : registry.all.filter((a) => a.category === cat).length}
              </Mono>
            </button>
          ))}
        </nav>

        <div className="mp-stack" style={{ gap: 26 }}>
          <div>
            <div className="mp-row" style={{ alignItems: "baseline", gap: 9, marginBlockEnd: 11 }}>
              <h2 className="mp-eyebrow" style={{ margin: 0 }}>
                {t("shop.addons.connected")}
              </h2>
              <Mono style={{ fontSize: 11.5, color: "var(--fg-subtle)" }}>{connected.length}</Mono>
            </div>

            {/* The honest empty state — a settled fact, not a gap. */}
            {connected.length === 0 ? (
              <div className="mp-slot-empty" style={{ padding: "26px 20px" }}>
                <div style={{ fontSize: 15, fontWeight: 800 }}>{t("shop.addons.noneTitle")}</div>
                <div style={{ fontSize: 13.5, color: "var(--fg-muted)" }}>
                  {t("shop.addons.noneBody")}
                </div>
              </div>
            ) : (
              <div className="mp-stack" style={{ gap: 10 }}>
                {connected.map((addOn) => {
                  /*
                   * Resolved, not declared. `resolveActivity` drops any seeded
                   * line naming a reference this works has not got, so the
                   * "never used" branch below now also covers "every seeded
                   * line was about somebody else's paperwork" — which is the
                   * honest thing to say when there is nothing left to date.
                   */
                  const last = resolveActivity(addOn.activity, activityContext)[0];
                  return (
                    <div key={addOn.key} className="mp-addon-row">
                      <Monogram letters={addOn.monogram} />
                      <div style={{ minInlineSize: 170, flex: 1 }}>
                        <div className="mp-row" style={{ gap: 9 }}>
                          <span style={{ fontSize: 15.5, fontWeight: 800 }}>{addOnName(addOn, t)}</span>
                          <Tag tone="pos">
                            <Check size={11} aria-hidden="true" />
                            {t("shop.addons.connected")}
                          </Tag>
                        </div>
                        <div style={{ fontSize: 13, color: "var(--fg-muted)", marginBlockStart: 3 }}>
                          {t(addOn.lineKey as never)}
                        </div>
                        <Mono style={{ fontSize: 11, color: "var(--fg-subtle)" }}>
                          {last === undefined
                            ? t("shop.addons.neverUsed")
                            : t("shop.addons.lastUsed", {
                                when: clock(last.iso, last.hour, last.minute),
                              })}
                        </Mono>
                        {/*
                         * 24 AC6, on the ROW and not only on the card. A shop
                         * that has connected the carrier sees it here and never
                         * again on this screen — the available grid it used to
                         * sit in no longer holds that add-on at all.
                         */}
                        <Affiliation addOn={addOn} style={{ marginBlockStart: 4 }} />
                      </div>
                      <div className="mp-row" style={{ marginInlineStart: "auto", flexWrap: "nowrap" }}>
                        {/*
                         * Manage, not Disconnect. Disconnecting is behind the
                         * drawer's own confirm, which names what disappears and
                         * what stays — a one-click Disconnect on the shelf would
                         * be the same action with the explanation removed.
                         */}
                        <button
                          type="button"
                          className="mp-button mp-button--ghost mp-btn"
                          style={{ padding: "9px 14px", fontSize: 12.5 }}
                          onClick={() => openOverlay({ kind: "manage", addOn: addOn.key })}
                        >
                          <SlidersHorizontal size={14} aria-hidden="true" />
                          {t("shop.addons.manage")}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <div className="mp-row" style={{ alignItems: "baseline", gap: 9, marginBlockEnd: 11 }}>
              <h2 className="mp-eyebrow" style={{ margin: 0 }}>
                {t("shop.addons.available")}
              </h2>
              <Mono style={{ fontSize: 11.5, color: "var(--fg-subtle)" }}>{available.length}</Mono>
            </div>
            {available.length === 0 ? (
              <EmptyState>{t("common.nothingHere")}</EmptyState>
            ) : (
              <div className="mp-addon-grid">
                {available.map((addOn) => (
                  <div key={addOn.key} className="mp-addon-card mp-card">
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <Monogram letters={addOn.monogram} />
                      <div style={{ minInlineSize: 0, flex: 1 }}>
                        <div style={{ fontSize: 15.5, fontWeight: 800 }}>{addOnName(addOn, t)}</div>
                        <Tag>{t(`shop.addons.cat.${addOn.category}` as never)}</Tag>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--fg-muted)", flex: 1 }}>
                      {t(addOn.lineKey as never)}
                    </div>
                    {/*
                     * 24 AC6, ON THE CARD. This used to be one footnote under
                     * the whole shelf — see `components/Affiliation.tsx` for
                     * why that is not the criterion, and why a page-wide grep
                     * for it went green on a page where no card said it.
                     */}
                    <Affiliation addOn={addOn} />
                    <div className="mp-row" style={{ gap: 5 }}>
                      <span className="mp-size-chip mp-mono">
                        {t(
                          addOn.connect === "none"
                            ? "shop.addons.needs.nothing"
                            : addOn.connect === "api-key"
                              ? "shop.addons.needs.apiKey"
                              : "shop.addons.needs.account",
                        )}
                      </span>
                    </div>

                    {/*
                     * A chip that says why, never a button that does nothing.
                     * These four are described so the shelf reads honestly —
                     * the shape of a second wave — and pretending they were one
                     * click away would be the only dishonest thing on it.
                     */}
                    {isConnectable(addOn) ? (
                      <button
                        type="button"
                        className="mp-button mp-btn mp-button--block"
                        onClick={() => openOverlay({ kind: "connect", addOn: addOn.key })}
                      >
                        {t("shop.addons.connect")}
                      </button>
                    ) : (
                      <div>
                        <button
                          type="button"
                          className="mp-not-in-demo mp-btn"
                          aria-expanded={tip === addOn.key}
                          onClick={() => setTip(tip === addOn.key ? null : addOn.key)}
                        >
                          <Info size={13} aria-hidden="true" />
                          {t("shop.addons.notInDemo")}
                        </button>
                        {tip === addOn.key && (
                          <div className="mp-tip" role="note">
                            {t("shop.addons.notInDemoTip")}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/*
           * THE FOOTNOTE THAT USED TO BE HERE IS GONE, AND ITS ABSENCE IS THE
           * REPAIR (24 AC6).
           *
           * It printed `shop.notAffiliated` once, under both lists, on behalf
           * of seven cards — five of which name no company and had nothing to
           * disclaim. A reader filtering the shelf to `delivery` got the
           * carrier's card at the top and the sentence three sections below it,
           * past an empty Connected state. Meanwhile a page-wide grep for
           * "affiliat" passed, which is why it survived four rounds.
           *
           * The line is on the card that needs it now, and every card says
           * something about who else is involved. Do not restore this: a
           * blanket footnote makes the per-card assertions in
           * `add-ons/shelfClaims.test.tsx` unnecessary and the page-wide one
           * true again.
           */}
        </div>
      </div>
    </section>
  );
}

/* ── 404 ─────────────────────────────────────────────────────────────────── */

export function NotFound() {
  const t = useT();
  const persona = useStore((s) => s.persona);
  const go = useStore((s) => s.go);

  return (
    <section className="mp-screen mp-narrower mp-centre" style={{ paddingBlock: "40px 20px" }}>
      <span
        style={{
          inlineSize: 64,
          blockSize: 64,
          borderRadius: 16,
          display: "inline-grid",
          placeItems: "center",
          background: "var(--surface-3)",
          color: "var(--fg-subtle)",
          marginBlockEnd: 16,
        }}
      >
        <FileQuestion size={32} aria-hidden="true" />
      </span>
      <Mono style={{ fontSize: 13, fontWeight: 700, color: "var(--fg-subtle)", letterSpacing: "0.06em" }}>
        {t("shop.404.code")}
      </Mono>
      <h1 className="mp-h1" style={{ fontSize: 26, marginBlock: "6px 8px" }}>
        {t("shop.404.title")}
      </h1>
      <p style={{ margin: "0 0 20px", fontSize: 14.5, color: "var(--fg-muted)" }}>
        {t("shop.404.body")}
      </p>
      <button
        type="button"
        className="mp-button mp-btn"
        onClick={() => go(persona === "customer" ? "products" : "today")}
      >
        {t(persona === "customer" ? "shop.404.homeCustomer" : "shop.404.home")}
      </button>
    </section>
  );
}

export { History };
