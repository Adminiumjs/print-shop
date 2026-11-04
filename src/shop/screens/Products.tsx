/**
 * "The things we print, priced as you build them.": every product the works
 * shows, each with its "from" price — the job's own price in one dry run of
 * an order holding one job for each product, at its "from" quantity on its
 * cheapest stock, collected.
 */
import { CalendarCheck, Flag, Layers, Printer, Ruler, Scissors, Truck } from "lucide-react";

import { useI18n } from "../../i18n/index.tsx";
import { money } from "../format.ts";
import { familyKey, ProductIcon, tintOf } from "../parts.tsx";
import { fromFigures, goView, openProduct, useShop } from "../store.ts";
import type { Product } from "../port.ts";

function FromPrice({ product }: { product: Product }) {
  const { t, locale } = useI18n();
  const quote = useShop((s) => s.fromQuote);
  const currency = useShop((s) => s.config.currency);
  const job = fromFigures(product);
  const price = job?.["price"];
  if (quote === null || (quote.state === "busy" && job === null)) return <span className="mp-skel" aria-hidden="true" />;
  if (price === null || price === undefined || price === "") return null;
  const note =
    product.kind === "sheet"
      ? t("shop.products.fromFor", { qty: new Intl.NumberFormat(locale).format(product.fromQty) })
      : t("shop.products.fromEach", { w: new Intl.NumberFormat(locale).format(product.defaultWidth ?? 0), h: new Intl.NumberFormat(locale).format(product.defaultHeight ?? 0) });
  return (
    <>
      <span className="mp-sr">{t("shop.products.from")} </span>
      <span className="mp-from-price">{money(price, currency, locale)}</span>
      <span className="mp-from-note">{note}</span>
    </>
  );
}

/** The size chip and the size names a tile shows: its presets', or "custom size". */
function sizesOf(product: Product, catalogue: NonNullable<ReturnType<typeof useShop.getState>["catalogue"]>, t: ReturnType<typeof useI18n>["t"]): { chip: string; names: string[] } {
  if (product.kind === "large") return { chip: t("shop.products.customSize"), names: [t("shop.products.customSize")] };
  const presets = catalogue.options
    .filter((o) => String(o.productId) === String(product.id) && o.kind === "size")
    .map((o) => catalogue.sizes.find((s) => String(s.id) === String(o.sizeId)))
    .filter((s): s is NonNullable<typeof s> => s !== undefined);
  const first = presets[0];
  return { chip: first === undefined ? "" : t("shop.mm2", { w: first.width, h: first.height }), names: presets.slice(0, 4).map((s) => s.name) };
}

export function ProductsScreen() {
  const { t } = useI18n();
  const catalogue = useShop((s) => s.catalogue);
  if (catalogue === null) return null;
  const strip = [
    { icon: <Printer size={18} aria-hidden="true" />, title: "shop.products.strip.sheet.title", body: "shop.products.strip.sheet.body" },
    { icon: <Flag size={18} aria-hidden="true" />, title: "shop.products.strip.large.title", body: "shop.products.strip.large.body" },
    { icon: <Scissors size={18} aria-hidden="true" />, title: "shop.products.strip.finishing.title", body: "shop.products.strip.finishing.body" },
    { icon: <CalendarCheck size={18} aria-hidden="true" />, title: "shop.products.strip.days.title", body: "shop.products.strip.days.body" },
  ] as const;
  const works = catalogue.works;
  return (
    <section className="mp-screen" aria-labelledby="mp-products-title">
      <div className="mp-intro">
        <h1 id="mp-products-title">{t("shop.products.title")}</h1>
        <p>{works.about ?? t("shop.products.lede")}</p>
      </div>
      <nav className="mp-doors" aria-label={t("shop.products.before")}>
        <button type="button" className="mp-door" onClick={() => goView("samples")}>
          <Layers size={16} aria-hidden="true" />
          {t("shop.door.samples")}
        </button>
        <button type="button" className="mp-door" onClick={() => goView("templates")}>
          <Ruler size={16} aria-hidden="true" />
          {t("shop.door.templates")}
        </button>
        <button type="button" className="mp-door" onClick={() => goView("delivery")}>
          <Truck size={16} aria-hidden="true" />
          {t("shop.door.delivery")}
        </button>
      </nav>
      <ul className="mp-grid" aria-label={t("shop.products.list")}>
        {catalogue.products.map((product) => {
          const sizes = sizesOf(product, catalogue, t);
          return (
            <li key={String(product.id)} className="mp-tile-wrap">
              <button type="button" className="mp-tile" onClick={() => openProduct(product.code)}>
                <span className={`mp-tile-art ${tintOf(product.family)}`}>
                  {product.photo !== null ? <img src={product.photo} alt="" /> : <ProductIcon name={product.icon} size={46} />}
                  {sizes.chip !== "" && <span className="mp-tile-size mp-mono">{sizes.chip}</span>}
                  <span className="mp-tile-family">{t(familyKey(product.family))}</span>
                </span>
                <span className="mp-tile-body">
                  <span className="mp-tile-name">{product.name}</span>
                  {product.line !== null && <span className="mp-tile-line">{product.line}</span>}
                  <span className="mp-tags">
                    {sizes.names.map((name) => (
                      <span key={name} className="mp-tag">
                        {name}
                      </span>
                    ))}
                  </span>
                  <span className="mp-from">
                    <FromPrice product={product} />
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mp-strip">
        {strip.map((item) => (
          <div key={item.title} className="mp-strip-item">
            <span className="mp-strip-icon">{item.icon}</span>
            <div className="mp-strip-title">{item.title === "shop.products.strip.days.title" ? t(item.title, undefined, works.standardDays ?? 0) : t(item.title)}</div>
            <div className="mp-strip-body">{item.body === "shop.products.strip.days.body" ? t(item.body, { express: works.expressDays ?? 0 }, works.standardDays ?? 0) : t(item.body)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
