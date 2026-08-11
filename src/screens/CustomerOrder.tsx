/**
 * Basket & checkout, the confirmation, and order tracking.
 *
 * Two of the app's four add-on slots live in here, and both SPEAK when empty:
 * the carrier list at checkout, and the dispatch panel on the customer's order
 * view. A customer looking at either has something to be told — that carrier
 * options would appear there, that this job is collected from the counter — so
 * the empty state is words rather than nothing.
 */

import { ArrowRight, Check, CircleCheck, FileCheck2, Info, PackageOpen, Search, Store, Truck } from "lucide-react";
import { useState } from "react";

import { AddOnSlot } from "../components/AddOnSlot.tsx";
import { checkoutItems, outboundOrderFor, shopClock, SHOP_ORIGIN } from "../add-ons/records.ts";
import { EmptyState, Field, Mono, Tag, Tile } from "../components/Primitives.tsx";
import { useI18n, useT } from "../i18n/index.tsx";
import { PRODUCT_BY_KEY } from "../lib/catalogue.ts";
import { cents, day, mm, num, shortDay } from "../lib/format.ts";
import { CUSTOMER_STAGES, customerStageIndex, proofApproved } from "../lib/jobs.ts";
import { checkArtwork, priceQuote, promiseFor, resolveSize } from "../lib/quote.ts";
import { TAX_RATE } from "../lib/rates.ts";
import { useStore, worksBandFor } from "../state/store.ts";

export function Basket() {
  const t = useT();
  // A carrier quotes in its own currency; the goods are in the shop's. Both are
  // formatted as what they are rather than assumed to be the same money.
  const { money } = useI18n();
  const basket = useStore((s) => s.basket);
  const details = useStore((s) => s.details);
  const setDetails = useStore((s) => s.setDetails);
  const removeLine = useStore((s) => s.removeLine);
  const editLine = useStore((s) => s.editLine);
  const placeOrder = useStore((s) => s.placeOrder);
  const go = useStore((s) => s.go);
  const now = useStore((s) => s.now);
  const todayIso = useStore((s) => s.todayIso);
  const toast = useStore((s) => s.toast);
  const registry = useStore((s) => s.registry);
  /*
   * ONE DECISION IN ONE PLACE (see `state/store.ts`'s `Delivery`). This used to
   * be a local `useState` beside a slot whose rate rows kept a selection of
   * their own, so both controls looked live and neither was: the summary quoted
   * the works' own delivery whatever the customer pressed.
   */
  const deliveryChoice = useStore((s) => s.deliveryChoice);
  const chooseWorks = useStore((s) => s.chooseWorksDelivery);
  const chooseAddOn = useStore((s) => s.chooseAddOnDelivery);

  if (basket.length === 0) {
    return (
      <section className="mp-screen mp-narrow">
        <h1 className="mp-h1" style={{ fontSize: 28 }}>
          {t("cust.basket.title")}
        </h1>
        <div className="mp-panel" style={{ padding: "40px 24px", textAlign: "center" }}>
          <span
            style={{
              inlineSize: 52,
              blockSize: 52,
              borderRadius: 14,
              display: "inline-grid",
              placeItems: "center",
              background: "var(--surface-3)",
              color: "var(--fg-subtle)",
              marginBlockEnd: 12,
            }}
          >
            <PackageOpen size={26} aria-hidden="true" />
          </span>
          <div style={{ fontSize: 16, fontWeight: 700, marginBlockEnd: 6 }}>
            {t("cust.basket.empty")}
          </div>
          <p style={{ margin: "0 0 16px", fontSize: 13.5, color: "var(--fg-muted)" }}>
            {t("cust.basket.emptyBody")}
          </p>
          <button type="button" className="mp-button mp-btn" onClick={() => go("products")}>
            {t("cust.basket.emptyCta")}
          </button>
        </div>
      </section>
    );
  }

  const quotes = basket.map((line) => priceQuote(line.config));
  /*
   * A carrier's quote is taxed like anything else the customer is charged, and
   * it is zero unless one was chosen — `chooseAddOnDelivery` has already set
   * every line to collection, so the works' own band is not in `goods` at the
   * same time.
   */
  const carriage = deliveryChoice === null ? 0 : Math.round(deliveryChoice.amount * 100);
  const goods = quotes.reduce((sum, q) => sum + q.subtotalCents, 0) + carriage;
  const tax = Math.round(goods * TAX_RATE);
  const total = goods + tax;
  const readyBy = basket
    .map((line) => promiseFor(line.config, { iso: now.iso, hour: now.hour }).readyBy)
    .sort()
    .at(-1)!;

  return (
    <section className="mp-screen">
      <h1 className="mp-h1" style={{ fontSize: 28, marginBlockEnd: 18 }}>
        {t("cust.basket.title")}
      </h1>

      <div className="mp-config">
        <div className="mp-stack">
          {basket.map((line, i) => {
            const product = PRODUCT_BY_KEY[line.config.product];
            const size = resolveSize(line.config);
            return (
              <div key={line.id} className="mp-panel mp-panel-pad">
                <div style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
                  <Tile
                    family={product.family}
                    icon={<PackageOpen size={22} aria-hidden="true" />}
                    style={{ inlineSize: 46, blockSize: 46, borderRadius: 11, flex: "0 0 auto" }}
                  />
                  <div style={{ flex: 1, minInlineSize: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                      <span style={{ fontSize: 16, fontWeight: 800 }}>
                        {t(`data.product.${product.key}` as never)}
                      </span>
                      <Mono style={{ fontSize: 15, fontWeight: 700 }}>
                        {cents(quotes[i]!.totalCents)}
                      </Mono>
                    </div>
                    <div className="mp-sizes" style={{ marginBlockStart: 8 }}>
                      <span className="mp-size-chip mp-mono">{num(line.config.quantity)}</span>
                      <span className="mp-size-chip mp-mono">
                        {mm(size.widthMm, size.heightMm)}
                      </span>
                      <span className="mp-size-chip">
                        {t(`data.material.${line.config.material}` as never)}
                      </span>
                      <span className="mp-size-chip">
                        {t(`data.finish.${line.config.finish}` as never)}
                      </span>
                    </div>
                  </div>
                </div>
                {/*
                  * WHERE THE ARTWORK CAME FROM, on the line it is going on.
                  * `artwork.source` is the key of the add-on that produced it
                  * and is absent for a plain upload — it was stored and never
                  * rendered, which made the whole field dead plumbing.
                  */}
                {line.artwork !== undefined && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      marginBlockStart: 11,
                      fontSize: 12.5,
                      color: "var(--fg-subtle)",
                    }}
                  >
                    <FileCheck2 size={14} aria-hidden="true" style={{ flex: "0 0 auto" }} />
                    <span style={{ minInlineSize: 0, overflowWrap: "anywhere" }}>
                      {line.artwork.source === undefined
                        ? t("cust.basket.artworkUpload", { file: line.artwork.filename })
                        : t("cust.basket.artworkFrom", {
                            file: line.artwork.filename,
                            name:
                              registry.byKey(line.artwork.source)?.name ?? line.artwork.source,
                          })}
                    </span>
                  </div>
                )}
                <div className="mp-row" style={{ marginBlockStart: 12 }}>
                  <button
                    type="button"
                    className="mp-button mp-button--ghost mp-btn"
                    style={{ padding: "7px 13px", fontSize: 12.5 }}
                    onClick={() => editLine(line.id)}
                  >
                    {t("common.edit")}
                  </button>
                  <button
                    type="button"
                    className="mp-button mp-button--ghost mp-btn"
                    style={{ padding: "7px 13px", fontSize: 12.5 }}
                    onClick={() => {
                      removeLine(line.id);
                      toast(t("toast.removed"));
                    }}
                  >
                    {t("common.remove")}
                  </button>
                </div>
              </div>
            );
          })}

          <div className="mp-panel mp-panel-pad">
            <h2 className="mp-h2" style={{ marginBlockEnd: 12 }}>
              {t("cust.basket.getting")}
            </h2>
            <div className="mp-stack" style={{ gap: 9 }}>
              {(["standard", "collect"] as const).map((key) => {
                // Selected only when the works IS delivering it. Choosing a
                // carrier below unselects both of these, because the customer
                // cannot have picked two ways of getting the same parcel.
                const selected = deliveryChoice === null && worksBandFor(basket) === key;
                return (
                <button
                  key={key}
                  type="button"
                  className="mp-check mp-btn"
                  aria-pressed={selected}
                  onClick={() => chooseWorks(key)}
                >
                  <span className="mp-check-box" style={{ borderRadius: 999 }}>
                    {selected && <Check size={13} aria-hidden="true" />}
                  </span>
                  <span style={{ flex: 1 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, display: "block" }}>
                      {t(key === "standard" ? "cust.basket.standard" : "cust.basket.collect")}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--fg-subtle)" }}>
                      {t(key === "standard" ? "cust.basket.standardSub" : "cust.basket.collectSub")}
                    </span>
                  </span>
                </button>
                );
              })}
            </div>

            {/* SLOT 2 of 4 — carrier options, speaking when empty. */}
            <div style={{ marginBlockStart: 12 }}>
              <AddOnSlot
                slot="checkout.delivery.methods"
                payload={{
                  /*
                   * THE BASKET, MAPPED INTO NEUTRAL LINES — a key, a label
                   * already translated, a quantity, what one weighs and how big
                   * it is. It used to be `basket` itself, this app's own
                   * `BasketLine[]`, which is why the delivery add-on carried a
                   * copy of this shop's size presets and grammages: nothing else
                   * could have priced a parcel from it.
                   */
                  items: checkoutItems(basket, (key) => t(`data.product.${key}` as never)),
                  /*
                   * WHEN THE WORKS THINKS IT IS. "Arrives Friday" counts from
                   * today, and the add-on used to count from a pin of its own —
                   * which agreed with this app and with no other.
                   */
                  now: shopClock(todayIso(), now),
                  /*
                   * AND WHEN THERE WILL BE SOMETHING TO COLLECT. This works
                   * prints to order, and the summary on this same screen says
                   * "ready by …" from the same `promiseFor`. Without this the
                   * carrier quoted transit from today, so the panel could offer
                   * a delivery day BEFORE the day the works said it would be
                   * ready. Same value, so the two cannot disagree.
                   */
                  readyOn: readyBy,
                  // Where the works posts from. A shop knows its own address;
                  // the add-on that used to hold this one held it for every shop.
                  origin: SHOP_ORIGIN,
                  /*
                   * The host's record, handed back down so the fill draws the
                   * selection rather than remembering one of its own. Scoped by
                   * add-on key: a second delivery company's rows must not light
                   * up because the first one's did.
                   */
                  chosen: deliveryChoice,
                  onChoose: chooseAddOn,
                }}
                fallback={
                  <div className="mp-slot-empty" style={{ minBlockSize: 88, borderRadius: 13 }}>
                    <div className="mp-slot-empty-title">{t("cust.basket.slotTitle")}</div>
                    <div className="mp-slot-empty-body">{t("cust.basket.slotEmpty")}</div>
                  </div>
                }
                wrap={(children) => <div className="mp-stack" style={{ gap: 9, marginBlockStart: 12 }}>{children}</div>}
              />
            </div>
          </div>

          <div className="mp-panel mp-panel-pad">
            <h2 className="mp-h2" style={{ marginBlockEnd: 12 }}>
              {t("cust.basket.details")}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 11 }}>
              <Field label={t("cust.basket.name")}>
                <input
                  className="mp-input mp-fld"
                  value={details.name}
                  onChange={(e) => setDetails({ name: e.target.value })}
                  placeholder="Harbour Bakery"
                />
              </Field>
              <Field label={t("cust.basket.email")}>
                <input
                  className="mp-input mp-fld"
                  value={details.email}
                  onChange={(e) => setDetails({ email: e.target.value })}
                  placeholder="you@example.com"
                />
              </Field>
            </div>
          </div>

          <div className="mp-panel mp-panel-pad">
            <h2 className="mp-h2" style={{ marginBlockEnd: 12 }}>
              {t("cust.basket.payment")}
            </h2>
            <div className="mp-stack" style={{ gap: 11 }}>
              <Field label={t("cust.basket.card")}>
                <input
                  dir="ltr"
                  className="mp-input mp-input--mono"
                  value="4242 4242 4242 4242"
                  readOnly
                />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
                <Field label={t("cust.basket.expiry")}>
                  <input dir="ltr" className="mp-input mp-input--mono" value="04 / 29" readOnly />
                </Field>
                <Field label={t("cust.basket.cvc")}>
                  <input dir="ltr" className="mp-input mp-input--mono" value="123" readOnly />
                </Field>
              </div>
              <div
                className="mp-row"
                style={{
                  background: "var(--info-soft)",
                  border: "1px solid var(--info)",
                  borderRadius: 11,
                  padding: "11px 13px",
                  color: "var(--info)",
                  flexWrap: "nowrap",
                }}
              >
                <Info size={17} aria-hidden="true" style={{ flex: "0 0 auto" }} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{t("cust.basket.demoCallout")}</span>
              </div>
            </div>
          </div>
        </div>

        <aside className="mp-quote" style={{ padding: "17px 18px" }}>
          <h2 className="mp-h2" style={{ marginBlockEnd: 12 }}>
            {t("cust.basket.summary")}
          </h2>
          <div className="mp-qrow" style={{ borderBlockEnd: 0 }}>
            <div className="mp-qrow-label" style={{ fontWeight: 500, color: "var(--fg-muted)" }}>
              {t("cust.basket.goods")}
            </div>
            <Mono className="mp-qrow-amt">{cents(goods)}</Mono>
          </div>
          {/*
            * WHAT THE CUSTOMER ACTUALLY CHOSE, priced. The works' own delivery
            * is already inside the line prices above — the engine charges a
            * band by weight — so this row says where it went rather than
            * charging it twice. A carrier's quote is not in those prices, and
            * it is added here.
            */}
          <div className="mp-qrow" style={{ borderBlockEnd: 0 }}>
            <div className="mp-qrow-label" style={{ fontWeight: 500, color: "var(--fg-muted)" }}>
              {t("cust.basket.deliveryRow")}
            </div>
            <Mono className="mp-qrow-amt">
              {/*
                * `Rate.amount` is major units with two decimals — the contract
                * says so — and every figure on this panel is cents, so the
                * conversion happens once, here and in `carriage`.
                */}
              {deliveryChoice === null ? "" : money(carriage / 100, deliveryChoice.currency)}
            </Mono>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              fontSize: 12,
              lineHeight: 1.45,
              color: "var(--fg-subtle)",
              marginBlockEnd: 9,
            }}
          >
            <Truck size={14} aria-hidden="true" style={{ flex: "0 0 auto" }} />
            <span>
              {deliveryChoice === null
                ? t(
                    worksBandFor(basket) === "collect"
                      ? "cust.basket.deliveryCollect"
                      : "cust.basket.deliveryInPrices",
                  )
                : `${deliveryChoice.label} · ${t("cust.basket.deliveryBy", {
                    name: registry.byKey(deliveryChoice.addOn)?.name ?? deliveryChoice.addOn,
                    day: shortDay(deliveryChoice.estimatedDelivery),
                  })}`}
            </span>
          </div>
          <div className="mp-qrow" style={{ borderBlockEnd: 0 }}>
            <div className="mp-qrow-label" style={{ fontWeight: 500, color: "var(--fg-muted)" }}>
              {t("line.tax", { pct: Math.round(TAX_RATE * 100) })}
            </div>
            <Mono className="mp-qrow-amt">{cents(tax)}</Mono>
          </div>
          <div className="mp-qrow mp-qrow--total">
            <div className="mp-qrow-label">{t("line.total")}</div>
            <Mono className="mp-qrow-amt">{cents(total)}</Mono>
          </div>
          <div className="mp-ready" style={{ marginBlock: "13px 14px" }}>
            <CircleCheck size={16} aria-hidden="true" style={{ color: "var(--pos)" }} />
            <strong>{t("cust.quote.ready", { day: day(readyBy) })}</strong>
          </div>
          <button
            type="button"
            className="mp-button mp-btn mp-button--block"
            onClick={() => {
              const ref = useStore.getState().jobs.length >= 0 ? "MP-4127" : "MP-4127";
              placeOrder();
              toast(t("toast.orderPlaced", { ref }), "pos");
            }}
          >
            {t("cust.basket.place")}
          </button>
        </aside>
      </div>
    </section>
  );
}

export function Confirmation() {
  const t = useT();
  const placedRef = useStore((s) => s.placedRef);
  const go = useStore((s) => s.go);
  const now = useStore((s) => s.now);
  const readyBy = promiseFor(
    {
      product: "business-cards",
      material: "silk-350",
      size: "business-card",
      sides: 2,
      finish: "none",
      quantity: 500,
      packaging: "bundled",
      printedProof: false,
      express: false,
      delivery: "collection",
    },
    { iso: now.iso, hour: now.hour },
  ).readyBy;

  return (
    <section className="mp-screen mp-narrower mp-centre">
      <span
        style={{
          inlineSize: 72,
          blockSize: 72,
          borderRadius: 999,
          display: "inline-grid",
          placeItems: "center",
          background: "var(--pos-soft)",
          color: "var(--pos)",
          marginBlockEnd: 18,
        }}
      >
        <Check size={38} aria-hidden="true" />
      </span>
      <h1 className="mp-h1" style={{ fontSize: 28 }}>
        {t("cust.confirm.title")}
      </h1>
      <p className="mp-lede" style={{ marginInline: "auto" }}>
        {t("cust.confirm.lede")}
      </p>

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 12,
          border: "1px solid var(--border-strong)",
          background: "var(--surface)",
          borderRadius: 13,
          padding: "14px 20px",
          marginBlockEnd: 22,
        }}
      >
        <Mono style={{ fontSize: 24, fontWeight: 700 }}>{placedRef ?? "MP-4127"}</Mono>
        <span style={{ inlineSize: 1, blockSize: 26, background: "var(--border)" }} />
        <span style={{ textAlign: "start" }}>
          <span style={{ display: "block", fontSize: 11, color: "var(--fg-subtle)" }}>
            {t("cust.confirm.readyBy")}
          </span>
          <span style={{ fontSize: 13.5, fontWeight: 700 }}>{day(readyBy)}</span>
        </span>
      </div>

      <div className="mp-panel" style={{ textAlign: "start", padding: 18, marginBlockEnd: 16 }}>
        <div className="mp-label" style={{ marginBlockEnd: 13 }}>
          {t("cust.confirm.next")}
        </div>
        <div className="mp-stack">
          {([1, 2, 3] as const).map((n) => (
            <div key={n} style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
              <span
                className="mp-mono"
                style={{
                  inlineSize: 28,
                  blockSize: 28,
                  borderRadius: 999,
                  display: "grid",
                  placeItems: "center",
                  background: "var(--accent-soft)",
                  color: "var(--accent)",
                  fontWeight: 700,
                  flex: "0 0 auto",
                }}
              >
                {num(n)}
              </span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>
                  {t(`cust.confirm.step${n}.title` as never)}
                </div>
                <div style={{ fontSize: 13, color: "var(--fg-muted)", lineHeight: 1.45 }}>
                  {t(`cust.confirm.step${n}.body` as never)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--fg-subtle)" }}>
        {t("cust.confirm.note")}
      </p>
      <div className="mp-row" style={{ justifyContent: "center" }}>
        <button type="button" className="mp-button mp-btn" onClick={() => go("order")}>
          {t("cust.confirm.follow")}
        </button>
        <button
          type="button"
          className="mp-button mp-button--ghost mp-btn"
          onClick={() => go("products")}
        >
          {t("common.backToProducts")}
        </button>
      </div>
    </section>
  );
}

export function OrderLookup() {
  const t = useT();
  const now = useStore((s) => s.now);
  const todayIso = useStore((s) => s.todayIso);
  const lookup = useStore((s) => s.lookup);
  const setLookup = useStore((s) => s.setLookup);
  const doLookup = useStore((s) => s.doLookup);
  const result = useStore((s) => s.lookupResult);
  const jobs = useStore((s) => s.jobs);
  const pastJobs = useStore((s) => s.pastJobs);
  const approveProof = useStore((s) => s.approveProof);
  const askChange = useStore((s) => s.askChange);
  const artwork = useStore((s) => s.artwork);
  const toast = useStore((s) => s.toast);
  const [note, setNote] = useState("");

  const job =
    result?.kind === "job"
      ? [...jobs, ...pastJobs].find((j) => j.ref === result.ref) ?? null
      : null;

  return (
    <section className="mp-screen mp-narrow">
      <h1 className="mp-h1" style={{ fontSize: 28 }}>
        {t("cust.order.title")}
      </h1>
      <p className="mp-lede">{t("cust.order.lede")}</p>

      <div className="mp-panel mp-panel-pad" style={{ marginBlockEnd: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr)) auto", gap: 11, alignItems: "end" }}>
          <Field label={t("cust.order.ref")}>
            <input
              className="mp-input mp-input--mono mp-fld"
              value={lookup.ref}
              onChange={(e) => setLookup({ ref: e.target.value })}
              placeholder="MP-0000"
            />
          </Field>
          <Field label={t("cust.basket.email")}>
            <input
              className="mp-input mp-fld"
              value={lookup.email}
              onChange={(e) => setLookup({ email: e.target.value })}
              placeholder="you@example.com"
            />
          </Field>
          <button type="button" className="mp-button mp-btn" onClick={doLookup}>
            <Search size={15} aria-hidden="true" />
            {t("cust.order.find")}
          </button>
        </div>

        <div className="mp-row" style={{ marginBlockStart: 12, gap: 6 }}>
          <span style={{ fontSize: 11.5, color: "var(--fg-subtle)" }}>{t("cust.order.try")}</span>
          {["MP-4115", "MP-4118", "MP-4111"].map((ref) => (
            <button
              key={ref}
              type="button"
              className="mp-tag mp-btn"
              style={{ fontFamily: "var(--font-mono)", cursor: "pointer" }}
              onClick={() => {
                setLookup({ ref });
                window.setTimeout(doLookup, 0);
              }}
            >
              {ref}
            </button>
          ))}
        </div>
      </div>

      {result?.kind === "none" && (
        <div
          className="mp-row"
          style={{
            border: "1px solid var(--warn)",
            background: "var(--warn-soft)",
            borderRadius: 13,
            padding: "14px 16px",
            color: "var(--warn)",
          }}
        >
          <span style={{ fontSize: 13.5, fontWeight: 600 }}>{t("cust.order.notFound")}</span>
        </div>
      )}

      {result?.kind === "quote" && (
        <div className="mp-panel" style={{ padding: 18 }}>
          <div className="mp-row" style={{ marginBlockEnd: 8 }}>
            <Mono style={{ fontSize: 16, fontWeight: 700 }}>{result.ref}</Mono>
            <Tag tone="info">{t("cust.order.savedQuote")}</Tag>
          </div>
          <p style={{ margin: "0 0 14px", fontSize: 14, color: "var(--fg-muted)" }}>
            {t("cust.order.savedBody", { product: result.ref })}
          </p>
          <button type="button" className="mp-button mp-btn">
            {t("cust.order.savedCta")}
          </button>
        </div>
      )}

      {job !== null && (
        <div className="mp-stack" style={{ gap: 16 }}>
          <div className="mp-panel" style={{ padding: 18 }}>
            <div className="mp-row" style={{ marginBlockEnd: 16 }}>
              <Mono style={{ fontSize: 18, fontWeight: 700 }}>{job.ref}</Mono>
              <span style={{ fontSize: 15, fontWeight: 700 }}>
                {t(`data.product.${job.productKey}` as never)}
              </span>
              <span style={{ marginInlineStart: "auto", fontSize: 13, color: "var(--fg-muted)" }}>
                {job.customer}
              </span>
            </div>

            <div className="mp-stages">
              {CUSTOMER_STAGES.map((stage, i) => {
                const current = customerStageIndex(job);
                return (
                  <div
                    key={stage}
                    className="mp-stage"
                    data-done={i <= current}
                    data-current={i === current}
                  >
                    {i > 0 && <span className="mp-stage-line" />}
                    <span className="mp-stage-dot">
                      {i <= current && <Check size={11} aria-hidden="true" />}
                    </span>
                    <span className="mp-stage-label">{t(`stage.${stage}` as never)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {!proofApproved(job) && job.proofs.some((p) => p.kind === "sent") && (
            <div className="mp-panel" style={{ padding: 18, borderColor: "var(--accent)", borderWidth: 1.5 }}>
              <div className="mp-row" style={{ marginBlockEnd: 14 }}>
                <span style={{ fontSize: 15, fontWeight: 800 }}>{t("cust.order.proofWaiting")}</span>
              </div>
              <p style={{ margin: "0 0 14px", fontSize: 13.5, lineHeight: 1.55, color: "var(--fg-muted)" }}>
                {t("cust.order.proofBody")}
              </p>
              <div className="mp-row" style={{ marginBlockEnd: 14 }}>
                <button
                  type="button"
                  className="mp-button mp-button--pos mp-btn"
                  onClick={() => {
                    approveProof(job.ref);
                    toast(t("toast.proofApproved", { day: shortDay(job.promisedFor) }), "pos");
                  }}
                >
                  <Check size={15} aria-hidden="true" />
                  {t("cust.order.approve")}
                </button>
              </div>
              <Field label={t("cust.order.askChange")}>
                <textarea
                  className="mp-input mp-fld"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("cust.order.askPlaceholder")}
                />
              </Field>
              <button
                type="button"
                className="mp-button mp-button--ghost mp-btn"
                style={{ marginBlockStart: 9 }}
                disabled={note.trim().length === 0}
                onClick={() => {
                  askChange(job.ref, note.trim());
                  setNote("");
                  toast(t("toast.changeSent", { day: shortDay(job.promisedFor) }));
                }}
              >
                {t("cust.order.sendChange")}
              </button>
            </div>
          )}

          {proofApproved(job) && (
            <div
              className="mp-row"
              style={{
                border: "1px solid var(--pos)",
                background: "var(--pos-soft)",
                borderRadius: 15,
                padding: "16px 18px",
                alignItems: "flex-start",
                flexWrap: "nowrap",
              }}
            >
              <CircleCheck size={20} aria-hidden="true" style={{ color: "var(--pos)", flex: "0 0 auto" }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--pos)" }}>
                  {t("cust.order.proofDone")}
                </div>
                <div style={{ fontSize: 13, color: "var(--fg-muted)", marginBlockStart: 2 }}>
                  {t("cust.order.proofDoneSub", { day: day(job.promisedFor) })}
                </div>
              </div>
            </div>
          )}

          <div className="mp-panel" style={{ padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBlockEnd: 12 }}>
              {t("cust.order.artwork")}
            </div>
            <div className="mp-stack" style={{ gap: 9 }}>
              {artwork
                .filter((a) => a.jobRef === job.ref)
                .map((file) => {
                  const verdicts = checkArtwork(file, {
                    product: job.productKey as never,
                    material: job.materialKey as never,
                    size: "a4",
                    sides: job.sides,
                    finish: "none",
                    quantity: job.quantity,
                    packaging: "bundled",
                    printedProof: false,
                    express: false,
                    delivery: "collection",
                  });
                  return verdicts.map((verdict, i) => (
                    <div
                      key={`${file.filename}-${i}`}
                      className="mp-verdict"
                      data-level={verdict.level}
                      style={{
                        padding: "9px 11px",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        background: "var(--surface-2)",
                      }}
                    >
                      <span>
                        <Mono style={{ color: "var(--fg-subtle)" }}>{file.filename}</Mono> —{" "}
                        {t(verdict.key as never, verdict.measured)}
                      </span>
                    </div>
                  ));
                })}
            </div>
          </div>

          {/* SLOT 3 of 4 — the dispatch panel, speaking when empty. */}
          <div className="mp-panel" style={{ padding: 18 }}>
            {/*
              * A HEADING, WRITTEN AS ONE. This was a `<div>` at 800 weight —
              * a heading to a reader and a bare line of prose to anything that
              * reads markup, sitting directly above a slot mount. D19's rule is
              * that nothing the host draws captions a slot, and the only thing
              * that distinguishes "Dispatch" (the name of the panel) from a
              * caption is that it is a heading. So it says so.
              */}
            <h3 style={{ fontSize: 14, fontWeight: 800, margin: "0 0 10px" }}>
              {t("cust.order.dispatch")}
            </h3>
            <AddOnSlot
              slot="order.dispatch.panel"
              payload={{
                order: outboundOrderFor(job, (key) => t(`data.product.${key}` as never)),
                // The works' own clock — see `records.ts`.
                now: shopClock(todayIso(), now),
              }}
              fallback={
                <div className="mp-row" style={{ color: "var(--fg-muted)", flexWrap: "nowrap" }}>
                  <span
                    style={{
                      inlineSize: 34,
                      blockSize: 34,
                      borderRadius: 9,
                      display: "grid",
                      placeItems: "center",
                      background: "var(--surface-3)",
                      color: "var(--fg-subtle)",
                      flex: "0 0 auto",
                    }}
                  >
                    <Store size={17} aria-hidden="true" />
                  </span>
                  <span style={{ fontSize: 13.5 }}>{t("cust.order.dispatchEmpty")}</span>
                </div>
              }
            />
          </div>
        </div>
      )}

      {result === null && <EmptyState>{t("cust.proofs.empty")}</EmptyState>}
    </section>
  );
}

export { ArrowRight };
