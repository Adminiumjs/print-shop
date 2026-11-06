/**
 * "Your order": the basket and the checkout on one page, as the works draws
 * it. Each job with its choices, its artwork or its design, and its price
 * from a dry run of the whole order; one delivery for the whole order (one
 * band on its weight, or collection, or over the top band a quote by hand);
 * the customer's details, the news tick and the line that says it can be
 * undone; how paying works (nothing is charged now); the summary.
 *
 * Placing is one write of the order with every job, its features and its
 * artwork, held to the total shown; a total that moved is refused, nothing
 * is kept, and the new figures are shown before the next press.
 */
import { CalendarCheck, CircleAlert, PackageOpen, Palette, Paperclip, Pencil, ReceiptText, TrendingUp, TriangleAlert } from "lucide-react";
import { useEffect, useRef } from "react";

import { useI18n } from "../../i18n/index.tsx";
import { optionById, optionsOf, sidesOf, trimOf } from "../config.ts";
import { deliveryOf, figure, topBand } from "../figures.ts";
import { dayFull, decimal, money } from "../format.ts";
import { ProductIcon, rich, tintOf } from "../parts.tsx";
import type { Catalogue, Id } from "../port.ts";
import { chooseDelivery, editLine, editLineDesign, firstBadField, formErrors, goView, openArtwork, placeOrder, productById, removeLine, setDetails, useShop, type BasketLine, type Field } from "../store.ts";

type T = ReturnType<typeof useI18n>["t"];

/** The job's choices as the basket's chips say them. */
function chipsOf(line: BasketLine, catalogue: Catalogue, t: T, locale: string): string[] {
  const product = productById(line.productId);
  if (product === null) return [];
  const c = line.choice;
  const name = (id: Id | null) => optionById(catalogue, id)?.name ?? null;
  const stock = optionById(catalogue, c.materialId);
  const material = catalogue.materials.find((m) => stock !== null && String(m.id) === String(stock.materialId));
  const chips: (string | null)[] = [material?.shortName ?? stock?.name ?? null];
  const trim = trimOf(catalogue, product, c);
  if (trim !== null) chips.push(t("shop.mm2", { w: trim.w, h: trim.h }));
  if (product.kind === "sheet" && optionsOf(catalogue, product.id, "sides").length > 1) chips.push(name(c.sidesId));
  chips.push(name(c.laminationId), name(c.spotUvId), name(c.cornersId));
  if (product.kind === "large") {
    const edges = optionById(catalogue, c.edgesId);
    if (edges !== null && edges.code !== "plain") chips.push(edges.name);
    const canvas = optionById(catalogue, c.canvasId);
    if (canvas !== null && canvas.code !== "rolled") chips.push(canvas.name);
  }
  chips.push(t("shop.basket.qty", { n: new Intl.NumberFormat(locale).format(c.qty) }));
  const pack = catalogue.packaging.find((p) => String(p.id) === String(c.packagingId));
  if (pack !== undefined && pack.basis !== "included") chips.push(pack.name);
  if (c.proof) chips.push(t("shop.basket.proof"));
  if (c.express) chips.push(t("shop.basket.express"));
  return chips.filter((x): x is string => x !== null && x !== "");
}

function Line({ line, index }: { line: BasketLine; index: number }) {
  const { t, locale } = useI18n();
  const catalogue = useShop((s) => s.catalogue)!;
  const currency = useShop((s) => s.config.currency);
  const quote = useShop((s) => s.basketQuote);
  const moves = useShop((s) => s.priceMoves);
  const refused = useShop((s) => s.refusedLine);
  const product = productById(line.productId);
  if (product === null) return null;
  const m = (v: unknown) => money(v, currency, locale);
  const job = quote?.figures?.jobs[index] ?? null;
  const price = figure(job, "price");
  const was = moves?.find((mv) => mv.lineId === line.id)?.was ?? null;
  const art = line.artwork.map((f) => (f.accepted ? t("shop.basket.artAccepted", { file: f.name }) : f.name)).join(", ");
  const missing = line.design === null && line.artwork.length === 0;
  const isRefused = refused !== null && refused.index === index;
  const sides = sidesOf(catalogue, line.choice);
  return (
    <li className={isRefused || missing ? "mp-line mp-line--refused" : "mp-line"}>
      <div className="mp-line-top">
        <span className={`mp-line-mark ${tintOf(product.family)}`}>
          <ProductIcon name={product.icon} size={22} />
        </span>
        <div className="mp-line-body">
          <div className="mp-line-head">
            <span className="mp-line-name">{product.name}</span>
            <span className="mp-line-price">
              {was !== null && (
                <s>
                  <span className="mp-sr">{t("shop.basket.was")} </span>
                  {m(was)}
                </s>
              )}
              {quote?.state === "busy" && price === null ? <span className="mp-skel mp-skel--price" aria-hidden="true" /> : price !== null && <span>{m(price)}</span>}
            </span>
          </div>
          {line.design !== null && <div className="mp-line-design">{t(sides === 2 ? "shop.basket.designBoth" : "shop.basket.designFront")}</div>}
          {line.artwork.length > 0 && (
            <div className="mp-line-art">
              <Paperclip size={11} aria-hidden="true" />
              {art}
            </div>
          )}
          {missing && (
            <div className="mp-line-art mp-line-art--missing">
              <TriangleAlert size={11} aria-hidden="true" />
              {t("shop.basket.noArtwork")}
            </div>
          )}
          <div className="mp-tags">
            {chipsOf(line, catalogue, t, locale).map((chip, i) => (
              <span key={`${chip}-${String(i)}`} className="mp-tag">
                {chip}
              </span>
            ))}
          </div>
        </div>
      </div>
      {isRefused && (
        <p className="mp-line-refusal" role="alert">
          <CircleAlert size={13} aria-hidden="true" />
          {t("shop.basket.lineRefused")}
        </p>
      )}
      <div className="mp-line-actions">
        {line.design !== null ? (
          <button type="button" className="mp-button mp-button--small" onClick={() => editLineDesign(line.id)}>
            <Palette size={14} aria-hidden="true" />
            {t("shop.basket.editDesign")}
          </button>
        ) : (
          <button type="button" className="mp-button mp-button--small" onClick={() => openArtwork(line.id)}>
            <Paperclip size={14} aria-hidden="true" />
            {line.artwork.length === 0 ? t("shop.basket.sendArtwork") : t("shop.basket.changeArtwork")}
          </button>
        )}
        <button type="button" className="mp-button mp-button--small" aria-label={t("shop.basket.editAria", { product: product.name })} onClick={() => editLine(line.id)}>
          <Pencil size={14} aria-hidden="true" />
          {t("shop.basket.edit")}
        </button>
        <button type="button" className="mp-button mp-button--small mp-button--remove" aria-label={t("shop.basket.removeAria", { product: product.name })} onClick={() => removeLine(line.id)}>
          {t("shop.basket.remove")}
        </button>
      </div>
    </li>
  );
}

function Getting() {
  const { t, locale } = useI18n();
  const catalogue = useShop((s) => s.catalogue)!;
  const currency = useShop((s) => s.config.currency);
  const delivery = useShop((s) => s.delivery);
  const order = useShop((s) => s.basketQuote?.figures?.order ?? null);
  const m = (v: unknown) => money(v, currency, locale);
  const band = deliveryOf(order, catalogue.bands);
  const kg = band.weight === null ? null : decimal(band.weight, locale, 1);
  const works = catalogue.works;
  const deliverLabel = band.toQuote ? t("shop.basket.deliver.quote") : t("shop.basket.deliver");
  const deliverSub = band.toQuote ? t("shop.basket.deliver.quoteSub", { top: decimal(topBand(catalogue.bands) ?? "0", locale), kg: kg ?? "" }) : band.band === null ? "" : kg === null ? band.band.name : t("shop.basket.deliver.sub", { band: band.band.name, kg });
  return (
    <section className="mp-card" aria-labelledby="mp-getting-title">
      <h2 id="mp-getting-title" className="mp-card-title">
        {t("shop.config.getting")}
      </h2>
      <div className="mp-radios" role="radiogroup" aria-labelledby="mp-getting-title">
        <button type="button" role="radio" aria-checked={delivery === "deliver"} className="mp-radio" onClick={() => chooseDelivery("deliver")}>
          <span className="mp-radio-ring" aria-hidden="true" />
          <span className="mp-radio-text">
            <span className="mp-radio-label">{deliverLabel}</span>
            {deliverSub !== "" && <span className="mp-radio-sub">{deliverSub}</span>}
          </span>
          <span className="mp-radio-price">{band.toQuote ? t("shop.toQuote") : band.offered === null ? "" : m(band.offered)}</span>
        </button>
        <button type="button" role="radio" aria-checked={delivery === "collect"} className="mp-radio" onClick={() => chooseDelivery("collect")}>
          <span className="mp-radio-ring" aria-hidden="true" />
          <span className="mp-radio-text">
            <span className="mp-radio-label">{t("shop.config.collect")}</span>
            {(works.address !== null || works.hours !== null) && <span className="mp-radio-sub">{[works.address, works.hours].filter((x) => x !== null).join(", ")}</span>}
          </span>
          <span className="mp-radio-price">{m("0.00")}</span>
        </button>
      </div>
    </section>
  );
}

function Input({ field, label, auto, type = "text", hint }: { field: Field | "line2"; label: string; auto: string; type?: string; hint?: string }) {
  const { t } = useI18n();
  const details = useShop((s) => s.details);
  const delivery = useShop((s) => s.delivery);
  const tried = useShop((s) => s.tried);
  const refused = useShop((s) => s.refusedFields);
  const key = field === "line2" ? null : field;
  const error = key === null ? undefined : (refused[key] ?? (tried ? formErrors(details, delivery)[key] : undefined));
  const value = details[field];
  const id = `mp-d-${field}`;
  const described = [error === undefined ? null : `${id}-err`, hint === undefined ? null : `${id}-hint`].filter((x) => x !== null).join(" ");
  return (
    <label className="mp-field">
      <span className="mp-field-label">{label}</span>
      <input
        id={id}
        className="mp-input"
        type={type}
        value={value}
        autoComplete={auto}
        aria-invalid={error !== undefined}
        {...(described === "" ? {} : { "aria-describedby": described })}
        onChange={(e) => setDetails({ [field]: e.target.value })}
      />
      {error !== undefined && (
        <span id={`${id}-err`} role="alert" className="mp-field-error">
          <CircleAlert size={13} aria-hidden="true" />
          {t(error)}
        </span>
      )}
      {hint !== undefined && (
        <span id={`${id}-hint`} className="mp-field-hint">
          {hint}
        </span>
      )}
    </label>
  );
}

function Details() {
  const { t } = useI18n();
  const delivery = useShop((s) => s.delivery);
  const news = useShop((s) => s.details.news);
  const works = useShop((s) => s.catalogue?.works.name ?? "");
  return (
    <section className="mp-card" aria-labelledby="mp-details-title">
      <h2 id="mp-details-title" className="mp-card-title">
        {t("shop.checkout.details")}
      </h2>
      <div className="mp-details">
        <Input field="name" label={t("shop.checkout.name")} auto="organization" />
        <Input field="email" label={t("shop.checkout.email")} auto="email" type="email" hint={t("shop.checkout.emailHint")} />
      </div>
      {delivery === "deliver" && (
        <div className="mp-details mp-details--address">
          <Input field="line1" label={t("shop.checkout.line1")} auto="address-line1" />
          <Input field="line2" label={t("shop.checkout.line2")} auto="address-line2" />
          <Input field="town" label={t("shop.checkout.town")} auto="address-level2" />
          <Input field="postcode" label={t("shop.checkout.postcode")} auto="postal-code" />
        </div>
      )}
      <label className="mp-consent">
        <input type="checkbox" checked={news} aria-describedby="mp-news-line" onChange={(e) => setDetails({ news: e.target.checked })} />
        <span>{t("shop.checkout.news", { works })}</span>
      </label>
      <p id="mp-news-line" className="mp-consent-line">
        {t("shop.checkout.newsLine")}
      </p>
    </section>
  );
}

function Summary() {
  const { t, locale } = useI18n();
  const catalogue = useShop((s) => s.catalogue)!;
  const currency = useShop((s) => s.config.currency);
  const quote = useShop((s) => s.basketQuote);
  const delivery = useShop((s) => s.delivery);
  const checking = useShop((s) => s.checking);
  const moves = useShop((s) => s.priceMoves);
  const shown = useShop((s) => s.shownTotal);
  const failure = useShop((s) => s.failure);
  const basket = useShop((s) => s.basket);
  const m = (v: unknown) => money(v, currency, locale);
  const order = quote?.figures?.order ?? null;
  const band = deliveryOf(order, catalogue.bands);
  const missing = basket.find((line) => line.design === null && line.artwork.length === 0);
  const ready = order?.["ready_by"];
  const place = async () => {
    if (missing !== undefined) return;
    const done = await placeOrder();
    if (done === "fix") document.getElementById(`mp-d-${firstBadField() ?? "name"}`)?.focus();
    if (done === "moved") window.scrollTo?.(0, 0);
  };
  return (
    <aside className="mp-summary" aria-labelledby="mp-summary-title">
      <h2 id="mp-summary-title">{t("shop.basket.summary")}</h2>
      <dl className="mp-sums">
        <dt>{t("shop.basket.goods")}</dt>
        <dd>{m(order?.["goods_total"])}</dd>
        {delivery === "deliver" && band.toQuote ? (
          <dt className="mp-sums-wide">{t("shop.basket.deliveryQuote")}</dt>
        ) : (
          <>
            <dt>{delivery === "collect" ? t("shop.basket.collection") : t("shop.basket.delivery")}</dt>
            <dd>{m(order?.["delivery"])}</dd>
          </>
        )}
        <dt>{t("shop.quote.tax", { rate: decimal(order?.["tax_rate"] ?? catalogue.works.taxRate ?? "0", locale) })}</dt>
        <dd>{m(order?.["tax"])}</dd>
      </dl>
      <dl className="mp-sum-total">
        <dt>{t("shop.quote.total")}</dt>
        <dd>{m(order?.["total"])}</dd>
      </dl>
      {typeof ready === "string" && ready !== "" && (
        <div className="mp-ready">
          <CalendarCheck size={16} aria-hidden="true" />
          <strong>{rich(t, "shop.quote.ready", { day: <span className="mp-mono">{dayFull(ready, locale)}</span> })}</strong>
        </div>
      )}
      {missing !== undefined && (
        <p className="mp-line-refusal" role="alert">
          <TriangleAlert size={13} aria-hidden="true" />
          {t("shop.basket.needsArtwork", { product: productById(missing.productId)?.name ?? "" })}
        </p>
      )}
      {failure !== null && (
        <p className="mp-line-refusal" role="alert">
          <CircleAlert size={13} aria-hidden="true" />
          {t(failure === "closed" ? "shop.checkout.closed" : failure === "unreachable" ? "shop.checkout.unreachable" : "shop.checkout.refused")}
        </p>
      )}
      <button type="button" className="mp-button mp-button--accent mp-button--wide" aria-busy={checking} aria-disabled={checking || missing !== undefined || shown === null} onClick={() => void place()}>
        {checking && <span className="mp-spinner" aria-hidden="true" />}
        {checking ? t("shop.checkout.checking") : moves !== null ? t("shop.checkout.orderAt", { total: m(shown) }) : t("shop.checkout.place")}
      </button>
    </aside>
  );
}

export function BasketScreen() {
  const { t } = useI18n();
  const basket = useShop((s) => s.basket);
  const moves = useShop((s) => s.priceMoves);
  const catalogue = useShop((s) => s.catalogue);
  const alert = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (moves !== null) alert.current?.focus();
  }, [moves]);
  if (catalogue === null) return null;
  return (
    <section className="mp-screen" aria-labelledby="mp-basket-title">
      <h1 id="mp-basket-title" className="mp-h1 mp-h1--basket">
        {t("shop.basket.title")}
      </h1>
      {moves !== null && (
        <div ref={alert} tabIndex={-1} role="alert" className="mp-alert">
          <TrendingUp size={18} aria-hidden="true" />
          <span>
            {t("shop.basket.moved")}
            <span className="mp-alert-sub">{t("shop.basket.movedSub")}</span>
          </span>
        </div>
      )}
      {basket.length === 0 ? (
        <div className="mp-empty">
          <span className="mp-empty-icon">
            <PackageOpen size={26} aria-hidden="true" />
          </span>
          <h2 className="mp-empty-title">{t("shop.basket.empty")}</h2>
          <p>{t("shop.basket.emptyBody")}</p>
          <button type="button" className="mp-button mp-button--accent" onClick={() => goView("products")}>
            {t("shop.basket.see")}
          </button>
        </div>
      ) : (
        <div className="mp-basket">
          <div className="mp-basket-main">
            <ul className="mp-lines" aria-label={t("shop.basket.jobs")}>
              {basket.map((line, i) => (
                <Line key={line.id} line={line} index={i} />
              ))}
            </ul>
            <Getting />
            <Details />
            <section className="mp-card" aria-labelledby="mp-paying-title">
              <h2 id="mp-paying-title" className="mp-card-title">
                {t("shop.checkout.paying")}
              </h2>
              <div className="mp-paying">
                <ReceiptText size={18} aria-hidden="true" />
                <p>{t("shop.checkout.payingBody")}</p>
              </div>
            </section>
          </div>
          <Summary />
        </div>
      )}
    </section>
  );
}
