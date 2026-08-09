/**
 * The two shells, switched by the dock's persona segment.
 *
 * Customer: a warm public site — wordmark, a short nav, a centred column and no
 * sidebar. Print shop: internal chrome with a sidebar and a topbar carrying a
 * search over references, customer names and products.
 *
 * They are deliberately different products wearing the same tokens. A customer
 * should never feel they have wandered into the back office, and the works
 * should never be asked to read marketing copy at a press.
 */

import {
  FileText,
  Layers,
  LayoutGrid,
  Menu,
  Printer,
  Puzzle,
  Receipt,
  Search,
  X,
} from "lucide-react";
import type { ReactNode } from "react";

import { useI18n, useT } from "../i18n/index.tsx";
import { PRODUCTS, PRODUCT_BY_KEY } from "../lib/catalogue.ts";
import { useStore, type CustomerView, type ShopView } from "../state/store.ts";
import { ThemeToggle, LocalePicker } from "./DemoDock.tsx";

const CUST_NAV: { view: CustomerView; key: string }[] = [
  { view: "products", key: "chrome.nav.products" },
  { view: "order", key: "chrome.nav.order" },
  { view: "findus", key: "chrome.nav.findus" },
];

const SHOP_NAV: { view: ShopView; key: string; icon: string }[] = [
  { view: "today", key: "chrome.nav.today", icon: "today" },
  { view: "jobs", key: "chrome.nav.jobs", icon: "jobs" },
  { view: "materials", key: "chrome.nav.materials", icon: "materials" },
  { view: "prices", key: "chrome.nav.prices", icon: "prices" },
  { view: "addons", key: "chrome.nav.addons", icon: "addons" },
];

function Brand({ onClick, small = false }: { onClick: () => void; small?: boolean }) {
  const t = useT();
  return (
    <button type="button" className="mp-brand" onClick={onClick}>
      <span className="mp-brand-mark">
        <Printer size={small ? 16 : 18} aria-hidden="true" />
      </span>
      <span style={{ display: "flex", flexDirection: "column" }}>
        <span className="mp-brand-name" style={small ? { fontSize: 14.5 } : undefined}>
          {t("chrome.brand")}
        </span>
        {!small && <span className="mp-brand-tag">{t("chrome.brandTag")}</span>}
      </span>
    </button>
  );
}

export function CustomerShell({ children }: { children: ReactNode }) {
  const t = useT();
  const view = useStore((s) => s.view);
  const go = useStore((s) => s.go);

  return (
    <>
      <header className="mp-cust-header">
        <div className="mp-wrap">
          <Brand onClick={() => go("products")} />
          <nav className="mp-cust-nav" aria-label={t("chrome.brand")}>
            {CUST_NAV.map((item) => (
              <button
                key={item.view}
                type="button"
                className="mp-navlink"
                aria-current={view === item.view ? "page" : undefined}
                onClick={() => go(item.view)}
              >
                {t(item.key as never)}
              </button>
            ))}
            <LocalePicker />
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main className="mp-main">
        <div className="mp-wrap">{children}</div>
      </main>
      <CustomerFooter />
    </>
  );
}

function CustomerFooter() {
  const t = useT();
  const go = useStore((s) => s.go);
  return (
    <footer className="mp-footer">
      <div className="mp-wrap mp-footer-cols">
        <div style={{ minInlineSize: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBlockEnd: 10 }}>
            <span className="mp-brand-mark" style={{ inlineSize: 26, blockSize: 26, borderRadius: 7 }}>
              <Printer size={14} aria-hidden="true" />
            </span>
            <span style={{ fontSize: 14, fontWeight: 800 }}>{t("chrome.brand")}</span>
          </div>
          <p style={{ margin: 0, fontSize: 12.5, color: "var(--fg-subtle)", lineHeight: 1.5, maxInlineSize: 240 }}>
            {t("chrome.brandBlurb")}
          </p>
        </div>
        <div className="mp-footer-col">
          <span className="mp-footer-head">{t("chrome.footer.beforeYouOrder")}</span>
          <button type="button" className="mp-footer-link" onClick={() => go("samples")}>
            {t("chrome.footer.samples")}
          </button>
          <button type="button" className="mp-footer-link" onClick={() => go("templates")}>
            {t("chrome.footer.templates")}
          </button>
          <button type="button" className="mp-footer-link" onClick={() => go("delivery")}>
            {t("chrome.footer.delivery")}
          </button>
        </div>
        <div className="mp-footer-col">
          <span className="mp-footer-head">{t("chrome.footer.yourOrders")}</span>
          <button type="button" className="mp-footer-link" onClick={() => go("order")}>
            {t("chrome.footer.follow")}
          </button>
          <button type="button" className="mp-footer-link" onClick={() => go("proofs")}>
            {t("chrome.footer.proofs")}
          </button>
          <button type="button" className="mp-footer-link" onClick={() => go("saved")}>
            {t("chrome.footer.saved")}
          </button>
          <button type="button" className="mp-footer-link" onClick={() => go("reorder")}>
            {t("chrome.footer.reorder")}
          </button>
        </div>
      </div>
      <div className="mp-footer-bar">
        <div className="mp-wrap">
          <span className="mp-footer-note">{t("chrome.footer.copyright")}</span>
          <span
            className="mp-mono"
            style={{
              fontSize: 11,
              color: "var(--fg-subtle)",
              padding: "4px 9px",
              border: "1px solid var(--border-strong)",
              borderRadius: 7,
              background: "var(--surface-2)",
            }}
          >
            {t("chrome.footer.demoPath")}
          </span>
        </div>
      </div>
    </footer>
  );
}

export function ShopShell({ children }: { children: ReactNode }) {
  const t = useT();
  const go = useStore((s) => s.go);
  const openOverlay = useStore((s) => s.openOverlay);

  return (
    <div className="mp-shop">
      <aside className="mp-sidebar">
        <div className="mp-sidebar-head">
          <Brand onClick={() => go("today")} small />
        </div>
        <ShopNav />
        <div className="mp-sidebar-note">{t("chrome.sidebarNote")}</div>
      </aside>

      <div className="mp-shop-body">
        <header className="mp-topbar">
          <button
            type="button"
            className="mp-iconbtn mp-narrow-only"
            aria-label={t("chrome.menu")}
            onClick={() => openOverlay({ kind: "nav" })}
          >
            <Menu size={18} aria-hidden="true" />
          </button>
          <ShopSearch />
          <div style={{ marginInlineStart: "auto", display: "flex", alignItems: "center", gap: 9 }}>
            <LocalePicker />
            <ThemeToggle />
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 11px 5px 6px",
                border: "1px solid var(--border)",
                borderRadius: 999,
                background: "var(--surface-2)",
                whiteSpace: "nowrap",
              }}
            >
              <span
                className="mp-mono"
                style={{
                  inlineSize: 26,
                  blockSize: 26,
                  borderRadius: 999,
                  display: "grid",
                  placeItems: "center",
                  background: "var(--accent-soft)",
                  color: "var(--accent)",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                RM
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>{t("chrome.staff")}</span>
            </span>
          </div>
        </header>

        <main className="mp-shop-main">{children}</main>

        <footer className="mp-footer">
          <div className="mp-wrap mp-footer-bar" style={{ borderBlockStart: 0 }}>
            <div className="mp-wrap" style={{ paddingInline: 0 }}>
              <span className="mp-footer-note">{t("chrome.footer.copyright")}</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export function ShopNav({ onNavigate }: { onNavigate?: () => void } = {}) {
  const t = useT();
  const view = useStore((s) => s.view);
  const go = useStore((s) => s.go);
  return (
    <nav className="mp-sidebar-nav" aria-label={t("chrome.nav.today")}>
      {SHOP_NAV.map((item) => (
        <button
          key={item.view}
          type="button"
          className="mp-sidebar-item"
          aria-current={view === item.view ? "page" : undefined}
          onClick={() => {
            go(item.view);
            onNavigate?.();
          }}
        >
          <NavIcon name={item.icon} />
          {t(item.key as never)}
        </button>
      ))}
    </nav>
  );
}

function NavIcon({ name }: { name: string }) {
  const size = 17;
  // A switch rather than a map keyed by string: lucide-react is tree-shakeable
  // only when each icon is referenced by name, and a lookup table would pull
  // the whole set into the bundle.
  switch (name) {
    case "today":
      return <LayoutGrid size={size} aria-hidden="true" />;
    case "jobs":
      return <FileText size={size} aria-hidden="true" />;
    case "materials":
      return <Layers size={size} aria-hidden="true" />;
    case "prices":
      return <Receipt size={size} aria-hidden="true" />;
    default:
      return <Puzzle size={size} aria-hidden="true" />;
  }
}

/** Search over references, customer names and products. */
function ShopSearch() {
  const t = useT();
  const jobs = useStore((s) => s.jobs);
  const openTicket = useStore((s) => s.openTicket);
  const query = useStore((s) => s.searchQuery);
  const setQuery = useStore((s) => s.setSearchQuery);

  const q = query.trim().toLowerCase();
  const results =
    q.length < 2
      ? []
      : jobs
          .filter((j) => {
            const product = t(`data.product.${j.productKey}` as never).toLowerCase();
            return (
              j.ref.toLowerCase().includes(q) ||
              j.customer.toLowerCase().includes(q) ||
              product.includes(q)
            );
          })
          .slice(0, 6);

  return (
    <div style={{ position: "relative", flex: 1, maxInlineSize: 440 }}>
      <Search
        size={16}
        aria-hidden="true"
        style={{
          position: "absolute",
          insetInlineStart: 11,
          insetBlockStart: "50%",
          transform: "translateY(-50%)",
          color: "var(--fg-subtle)",
        }}
      />
      <input
        className="mp-input mp-fld"
        style={{ paddingInlineStart: 34 }}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("chrome.search.placeholder")}
        aria-label={t("chrome.search.placeholder")}
      />
      {q.length >= 2 && (
        <div
          style={{
            position: "absolute",
            insetBlockStart: 46,
            insetInline: 0,
            zIndex: 40,
            background: "var(--surface)",
            border: "1px solid var(--border-strong)",
            borderRadius: 12,
            boxShadow: "var(--shadow-lift)",
            overflow: "hidden",
            maxBlockSize: 340,
            overflowY: "auto",
          }}
        >
          {results.length === 0 ? (
            <div style={{ padding: 14, fontSize: 13, color: "var(--fg-subtle)", textAlign: "center" }}>
              {t("chrome.search.empty")}
            </div>
          ) : (
            results.map((job) => (
              <button
                key={job.ref}
                type="button"
                style={{
                  inlineSize: "100%",
                  textAlign: "start",
                  border: 0,
                  borderBlockEnd: "1px solid var(--border)",
                  background: "transparent",
                  padding: "10px 13px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  color: "inherit",
                }}
                onClick={() => {
                  setQuery("");
                  openTicket(job.ref);
                }}
              >
                <span className="mp-mono" style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>
                  {job.ref}
                </span>
                <span style={{ fontSize: 13, flex: 1 }}>
                  {t(`data.product.${job.productKey}` as never)}
                </span>
                <span style={{ fontSize: 11.5, color: "var(--fg-subtle)" }}>{job.customer}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/** The slide-in nav for narrow works viewports. */
export function NavSheet() {
  const t = useT();
  const closeOverlay = useStore((s) => s.closeOverlay);
  return (
    <div className="mp-scrim" onClick={closeOverlay} role="presentation">
      <aside
        className="mp-navsheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={t("chrome.menu")}
      >
        <div className="mp-sidebar-head" style={{ justifyContent: "space-between" }}>
          <span style={{ fontSize: 14.5, fontWeight: 800 }}>{t("chrome.brand")}</span>
          <button type="button" className="mp-iconbtn" aria-label={t("common.close")} onClick={closeOverlay}>
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <ShopNav onNavigate={closeOverlay} />
      </aside>
    </div>
  );
}

/** Product lookup used by several screens' headers. */
export function productName(key: string, t: ReturnType<typeof useT>): string {
  return t(`data.product.${key}` as never);
}

export { PRODUCTS, PRODUCT_BY_KEY };

// Re-exported for screens that need the same locale-aware direction flag.
export function useDir() {
  return useI18n().dir;
}
