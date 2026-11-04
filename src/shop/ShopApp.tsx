/**
 * The customer's side: its header and footer, the screen the address names,
 * and the toasts.
 *
 * The screens of an order after it is placed (Follow an order, Reorder,
 * proofs, saved quotes, sample packs, templates, delivery, find us, a saved
 * design's own page) are routed here and drawn by their own modules
 * (`ELSEWHERE` in `route.ts`).
 */
import { CircleCheck, FileQuestion, Info, Moon, Printer, ShoppingBasket, Sun, TriangleAlert } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import "./shop.css";

import { useI18n, type MessageKey } from "../i18n/index.tsx";
import { attachShopUrl, type Place } from "./route.ts";
import { goView, loadShop, onShopNavigate, openArtwork, openProduct, tellWords, useShop, type ShopView } from "./store.ts";
import { ArtworkScreen } from "./screens/Artwork.tsx";
import { BasketScreen } from "./screens/Basket.tsx";
import { ConfigureScreen } from "./screens/Configure.tsx";
import { ConfirmedScreen } from "./screens/Confirmed.tsx";
import { DesignScreen } from "./screens/Design.tsx";
import { ProductsScreen } from "./screens/Products.tsx";

const NAV: [ShopView, MessageKey][] = [
  ["products", "chrome.nav.products"],
  ["reorder", "shop.nav.reorder"],
  ["order", "shop.nav.follow"],
  ["findUs", "chrome.nav.findus"],
];

const THEME_SLOT = "print-shop-theme";

function initialTheme(): "light" | "dark" {
  try {
    const kept = localStorage.getItem(THEME_SLOT);
    if (kept === "light" || kept === "dark") return kept;
  } catch {
    // no storage: follow the device
  }
  return typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Open the screen a place names. */
export function openPlace(place: Place): void {
  const s = useShop.getState();
  if (place.view === "product" || place.view === "design" || place.view === "blank") openProduct(place.code, place.view, s.productCode === place.code ? s.editing : null);
  else if (place.view === "confirmed") goView(s.confirmed === null ? "basket" : "confirmed");
  else if (place.view === "artwork") {
    if (s.artLine !== null) openArtwork(s.artLine);
    else goView("basket");
  } else goView(place.view);
}

function Screen({ view }: { view: ShopView }): ReactNode {
  switch (view) {
    case "products":
      return <ProductsScreen />;
    case "product":
      return <ConfigureScreen />;
    case "design":
      return <DesignScreen blank={false} />;
    case "blank":
      return <DesignScreen blank />;
    case "artwork":
      return <ArtworkScreen />;
    case "basket":
      return <BasketScreen />;
    case "confirmed":
      return <ConfirmedScreen />;
    case "missing":
      return <Missing />;
    default:
      return <Elsewhere />;
  }
}

/** "This one never went to press.": an address the shop has no screen for. */
function Missing() {
  const { t } = useI18n();
  return (
    <section className="mp-screen mp-empty" aria-labelledby="mp-404-title">
      <span className="mp-empty-icon">
        <FileQuestion size={32} aria-hidden="true" />
      </span>
      <div className="mp-mono mp-small">{t("shop.missing.code")}</div>
      <h1 id="mp-404-title" className="mp-h1">
        {t("shop.missing.title")}
      </h1>
      <p>{t("shop.missing.body")}</p>
      <div className="mp-confirmed-actions">
        <button type="button" className="mp-button mp-button--accent" onClick={() => goView("products")}>
          {t("shop.basket.see")}
        </button>
        <button type="button" className="mp-button" onClick={() => goView("order")}>
          {t("shop.nav.follow")}
        </button>
      </div>
    </section>
  );
}

/** A screen the shop's other parts draw, not in this build. */
function Elsewhere() {
  const { t } = useI18n();
  return (
    <section className="mp-screen mp-empty" aria-labelledby="mp-elsewhere-title">
      <h1 id="mp-elsewhere-title" className="mp-empty-title">
        {t("shop.elsewhere.title")}
      </h1>
      <button type="button" className="mp-button mp-button--accent" onClick={() => goView("products")}>
        {t("shop.basket.see")}
      </button>
    </section>
  );
}

function Loading() {
  const { t } = useI18n();
  return (
    <div className="mp-loading" aria-busy="true">
      <span className="mp-sr">{t("shop.loading")}</span>
      <div className="mp-skel mp-skel--title" />
      <div className="mp-grid">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="mp-skel mp-skel--tile" />
        ))}
      </div>
    </div>
  );
}

function Failed() {
  const { t } = useI18n();
  return (
    <section className="mp-screen mp-empty" aria-labelledby="mp-failed-title">
      <h1 id="mp-failed-title" className="mp-empty-title">
        {t("shop.failed.title")}
      </h1>
      <p>{t("shop.failed.body")}</p>
      <button type="button" className="mp-button mp-button--accent" onClick={() => void loadShop()}>
        {t("shop.retry")}
      </button>
    </section>
  );
}

function Toasts() {
  const { t } = useI18n();
  const toasts = useShop((s) => s.toasts);
  return (
    <div className="mp-toasts" role="status" aria-live="polite">
      {toasts.map((one) => (
        <div key={one.id} className="mp-toast">
          {one.tone === "ok" ? <CircleCheck size={16} aria-hidden="true" /> : one.tone === "warn" ? <TriangleAlert size={16} aria-hidden="true" /> : <Info size={16} aria-hidden="true" />}
          <span>{t(one.key, one.params)}</span>
        </div>
      ))}
    </div>
  );
}

export default function ShopApp() {
  const { t, locale } = useI18n();
  tellWords(t);
  const view = useShop((s) => s.view);
  const loading = useShop((s) => s.loading);
  const works = useShop((s) => s.catalogue?.works ?? null);
  const jobs = useShop((s) => s.basket.length);
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(THEME_SLOT, theme);
    } catch {
      // not remembered, still shown
    }
  }, [theme]);

  useEffect(() => {
    const url = attachShopUrl(openPlace);
    openPlace(url.current());
    onShopNavigate((next, code) => url.push({ view: next, code }));
    void loadShop();
    return () => {
      onShopNavigate(null);
      url.detach();
    };
  }, []);

  // A new screen starts at its top.
  useEffect(() => {
    window.scrollTo?.(0, 0);
  }, [view]);

  const current = (target: ShopView) => view === target || (target === "products" && (view === "product" || view === "design" || view === "blank"));
  const name = works?.name ?? t("chrome.brand");
  return (
    <div className="mp-app">
      <header className="mp-header">
        <div className="mp-header-row">
          <button type="button" className="mp-brand" onClick={() => goView("products")}>
            <span className="mp-brand-mark">
              <Printer size={18} aria-hidden="true" />
            </span>
            <span className="mp-brand-text">
              <span className="mp-brand-name">{name}</span>
              <span className="mp-brand-tag">{t("chrome.brandTag")}</span>
            </span>
          </button>
          <nav className="mp-nav" aria-label={t("shop.nav.label")}>
            {NAV.map(([target, key]) => (
              <button key={target} type="button" className="mp-nav-item" aria-current={current(target) ? "page" : undefined} onClick={() => goView(target)}>
                {t(key)}
              </button>
            ))}
            <button type="button" className="mp-basket-button" aria-current={view === "basket" ? "page" : undefined} aria-label={t("shop.nav.basketAria", undefined, jobs)} onClick={() => goView("basket")}>
              <ShoppingBasket size={16} aria-hidden="true" />
              <span>{t("chrome.nav.order")}</span>
              {jobs > 0 && <span className="mp-count">{new Intl.NumberFormat(locale).format(jobs)}</span>}
            </button>
            <button type="button" className="mp-icon-button" aria-label={t("shop.theme")} title={theme === "dark" ? t("shop.theme.toLight") : t("shop.theme.toDark")} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
            </button>
          </nav>
        </div>
      </header>

      <main className="mp-main">
        <div className="mp-page">{loading === "loading" ? <Loading /> : loading === "failed" ? <Failed /> : <Screen view={view} />}</div>
      </main>

      <footer className="mp-footer">
        <div className="mp-footer-top">
          <div className="mp-footer-brand">
            <div className="mp-footer-mark">
              <span>
                <Printer size={14} aria-hidden="true" />
              </span>
              {name}
            </div>
            <p>{t("shop.footer.blurb")}</p>
          </div>
          <nav className="mp-footer-col" aria-labelledby="mp-footer-before">
            <h2 id="mp-footer-before" className="mp-footer-head">
              {t("shop.footer.before")}
            </h2>
            <button type="button" className="mp-footer-link" onClick={() => goView("samples")}>
              {t("shop.door.samples")}
            </button>
            <button type="button" className="mp-footer-link" onClick={() => goView("templates")}>
              {t("shop.door.templates")}
            </button>
            <button type="button" className="mp-footer-link" onClick={() => goView("delivery")}>
              {t("shop.door.delivery")}
            </button>
          </nav>
          <nav className="mp-footer-col" aria-labelledby="mp-footer-orders">
            <h2 id="mp-footer-orders" className="mp-footer-head">
              {t("chrome.footer.yourOrders")}
            </h2>
            <button type="button" className="mp-footer-link" onClick={() => goView("order")}>
              {t("shop.nav.follow")}
            </button>
            <button type="button" className="mp-footer-link" onClick={() => goView("proofs")}>
              {t("shop.footer.proofs")}
            </button>
            <button type="button" className="mp-footer-link" onClick={() => goView("quotes")}>
              {t("shop.footer.quotes")}
            </button>
            <button type="button" className="mp-footer-link" onClick={() => goView("reorder")}>
              {t("shop.footer.again")}
            </button>
          </nav>
        </div>
        {works !== null && (
          <div className="mp-footer-bottom">
            <div className="mp-footer-bottom-row">
              <span>{t("shop.footer.line", { works: works.name, address: works.address ?? "" })}</span>
              <span className="mp-footer-contact">
                {works.phone !== null && (
                  <a className="mp-mono" href={`tel:${works.phone.replace(/\s/g, "")}`}>
                    {works.phone}
                  </a>
                )}
                {works.email !== null && <a href={`mailto:${works.email}`}>{works.email}</a>}
                {works.hours !== null && <span>{works.hours}</span>}
              </span>
            </div>
          </div>
        )}
      </footer>

      <Toasts />
    </div>
  );
}
