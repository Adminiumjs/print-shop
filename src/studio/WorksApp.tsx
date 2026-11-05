/**
 * The works' shell (comp `I - Marlow Press` 1015-1361, the add-ons' items
 * from `J - Marlow Press Add-ons` 2790-2793): the sidebar with the works'
 * screens, the header with search, the theme and the person signed in, the
 * screen, the footer with the works' own address; the nav drawer on a narrow
 * screen; the overlays and the toasts.
 *
 * A screen shows only to a person whose roles reach it: the price list to
 * every role (the owner alone edits it), Shipments while a delivery company is on, the
 * add-ons to the owner. What their roles cannot do, Adminium refuses anyway.
 */
import { useEffect, useId, useState, type ReactNode } from "react";
import { FileQuestion, LayoutGrid, LayoutTemplate, Layers, List, LogOut, Menu, Moon, Package, Printer, Puzzle, ReceiptText, Search, Sun, UserX, X } from "lucide-react";

import { useData, useEnv } from "./env.tsx";
import { onBoard, orderOf, refOf } from "./facts.ts";
import { useFmt } from "./format.ts";
import { navOf, WORKS_NAV, type WorksNavEntry } from "./nav.ts";
import { mayErase, mayManageAddOns, maySetUpDesigns } from "./roles.ts";
import { go, useWorks, type View } from "./store.ts";
import { TodayScreen } from "./screens/Today.tsx";
import { TicketScreen } from "./screens/Ticket.tsx";
import { JobsScreen } from "./screens/Jobs.tsx";
import { MaterialsScreen } from "./screens/Materials.tsx";
import { PricesScreen } from "./screens/Prices.tsx";
import { DispatchScreen } from "./screens/Dispatch.tsx";
import { ShipmentsScreen } from "./screens/Shipments.tsx";
import { ActivityScreen, AddOnScreen, AddOnsScreen } from "./screens/AddOns.tsx";
import { Overlays } from "./screens/Overlays.tsx";
import { Mono, Typed } from "./ui.tsx";
import { text } from "./wire.ts";
import type { Person, WorksData, WorksDoor } from "./door.ts";
import { useT, type MessageKey } from "../i18n/index.tsx";

const ICON: Record<string, ReactNode> = {
  "layout-grid": <LayoutGrid size={17} aria-hidden="true" />,
  list: <List size={17} aria-hidden="true" />,
  layers: <Layers size={17} aria-hidden="true" />,
  "receipt-text": <ReceiptText size={17} aria-hidden="true" />,
  package: <Package size={17} aria-hidden="true" />,
  puzzle: <Puzzle size={17} aria-hidden="true" />,
};

const ROLE_WORD: Record<string, MessageKey> = {
  owner: "works.role.owner",
  prepress: "works.role.prepress",
  press: "works.role.press",
  counter: "works.role.counter",
};

/** Which of the works' screens a person reaches, with the add-ons that are on. */
export function screensFor(who: Person, carrier: boolean): string[] {
  return WORKS_NAV.filter((entry) => {
    switch (entry.id) {
      case "shipments":
        return carrier && who.can("orders", "read");
      case "addons":
        return mayManageAddOns(who);
      case "materials":
        return who.can("materials", "read");
      case "prices":
        return who.can("settings", "read");
      default:
        return who.can("jobs", "read");
    }
  }).map((entry) => entry.id);
}

export function WorksApp() {
  const t = useT();
  const data = useWorks((s) => s.data);
  const failure = useWorks((s) => s.failure);
  const theme = useWorks((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === null) root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
  }, [theme]);

  // Escape closes a board menu or the search before anything else.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const s = useWorks.getState();
      if (s.boardMenu !== null) useWorks.setState({ boardMenu: null });
      else if (s.query !== "") useWorks.setState({ query: "" });
      else if (s.navOpen) useWorks.setState({ navOpen: false });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (data === null) {
    return (
      <div className="wk-app">
        <main className="wk-main">
          {failure === null ? (
            <div role="status" aria-busy="true" className="wk-loading">
              <span className="wk-sr">{t("works.loading")}</span>
              <div className="wk-skel wk-skel--title" />
              <div className="wk-skel-row">
                <div className="wk-skel wk-skel--col" />
                <div className="wk-skel wk-skel--col" />
                <div className="wk-skel wk-skel--col" />
                <div className="wk-skel wk-skel--col" />
              </div>
            </div>
          ) : (
            <div className="wk-failed" role="alert">
              <span>{t("works.failed", { why: failure })}</span>
              <button type="button" className="wk-btn" onClick={() => window.location.reload()}>
                {t("works.retry")}
              </button>
            </div>
          )}
        </main>
      </div>
    );
  }
  return <Shell />;
}

function Shell() {
  const t = useT();
  const fmt = useFmt();
  const data = useData();
  const { door, signInHref } = useEnv();
  const view = useWorks((s) => s.view);
  const navOpen = useWorks((s) => s.navOpen);
  const toasts = useWorks((s) => s.toasts);
  const theme = useWorks((s) => s.theme);
  const who = door.who();
  const facts = door.facts();
  const reach = screensFor(who, facts.carrier !== null);
  const settings = data.settings;
  const works = text(settings?.["works_name"]) ?? "";
  const phone = text(settings?.["phone"]);
  const email = text(settings?.["email"]);
  const dark = theme === "dark" || (theme === null && typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches === true);
  const first = who.name.split(/\s+/).filter(Boolean)[0] ?? who.name;
  const initials = who.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toLocaleUpperCase())
    .join("");
  const role = who.roles.find((r) => ROLE_WORD[r] !== undefined);

  return (
    <div className="wk-app">
      <aside className="wk-sidebar">
        <Brand name={works} />
        <Nav view={view} reach={reach} />
        <div className="wk-sidebar-foot">{t("works.sidebar.foot", { days: daysLabel(facts.workingDays, t), machines: machinesOf(data) })}</div>
      </aside>
      <div className="wk-column">
        <header className="wk-header">
          <button type="button" className="wk-iconbtn wk-menu-btn" aria-label={t("works.menu")} aria-expanded={navOpen} onClick={() => useWorks.setState({ navOpen: true })}>
            <Menu size={18} aria-hidden="true" />
          </button>
          <SearchBox />
          <div className="wk-header-end">
            <button
              type="button"
              className="wk-iconbtn"
              aria-label={t("works.theme")}
              title={t(dark ? "works.theme.toLight" : "works.theme.toDark")}
              onClick={() => useWorks.setState({ theme: dark ? "light" : "dark" })}
            >
              {dark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
            </button>
            <span className="wk-user">
              <Mono className="wk-user-initials">{initials}</Mono>
              <span className="wk-user-name">{role === undefined ? first : t("works.user", { name: first, role: t(ROLE_WORD[role]!) })}</span>
            </span>
            {door.signOut !== undefined && (
              <button type="button" className="wk-iconbtn" aria-label={t("works.signOut")} title={t("works.signOut")} onClick={() => void signOut(door, signInHref)}>
                <LogOut size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        </header>
        <main className="wk-main" id="wk-main">
          <Screen view={view} reach={reach} />
        </main>
        <footer className="wk-footer">
          <span>{t("works.footer", { year: fmt.year(door.now()), works, address: text(settings?.["address"]) ?? "" })}</span>
          <span className="wk-footer-links">
            {phone !== null && (
              <a className="wk-mono" href={`tel:${phone.replace(/\s/g, "")}`}>
                {phone}
              </a>
            )}
            {email !== null && <a href={`mailto:${email}`}>{email}</a>}
            {text(settings?.["hours"]) !== null && <span className="wk-footer-hours">{text(settings?.["hours"])}</span>}
          </span>
        </footer>
      </div>
      {navOpen && <Drawer works={works} view={view} reach={reach} />}
      <Overlays />
      <div className="wk-toasts" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`wk-toast wk-toast--${toast.tone}`}>
            {toast.text}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * "Sign out": the session ended, then Adminium's sign-in, in the whole
 * window when the screens are drawn inside the dashboard. A sign-out that
 * failed still leaves: the sign-in says whether the session is still there.
 */
async function signOut(door: WorksDoor, signInHref: string): Promise<void> {
  try {
    await door.signOut?.();
  } catch {
    // Signed out or not, the sign-in page is where this person goes next.
  }
  let target: Window = window;
  try {
    if (window.top !== null && window.top.location.origin === window.location.origin) target = window.top;
  } catch {
    // A frame of another origin: this window leaves alone.
  }
  target.location.assign(signInHref);
}

const WEEK = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_KEY: Record<string, MessageKey> = {
  mon: "works.day.mon",
  tue: "works.day.tue",
  wed: "works.day.wed",
  thu: "works.day.thu",
  fri: "works.day.fri",
  sat: "works.day.sat",
  sun: "works.day.sun",
};

/** The works' week as the sidebar says it: "Mon–Fri" for a run of days, else each day. */
function daysLabel(days: readonly string[], t: (key: MessageKey, params?: Record<string, string | number>) => string): string {
  const on = WEEK.filter((d) => days.includes(d));
  if (on.length === 0) return "";
  const firstAt = WEEK.indexOf(on[0]!);
  const run = on.every((d, i) => WEEK.indexOf(d) === firstAt + i);
  if (run && on.length > 2) return t("works.days.run", { from: t(DAY_KEY[on[0]!]!), to: t(DAY_KEY[on.at(-1)!]!) });
  return on.map((d) => t(DAY_KEY[d]!)).join(", ");
}

/** The machines in use, by name, as the works' rows give them. */
const machinesOf = (data: WorksData): string =>
  data.machines
    .filter((m) => m["active"] !== false)
    .map((m) => text(m["name"]) ?? "")
    .filter(Boolean)
    .join(", ");

function Brand({ name }: { name: string }) {
  return (
    <div className="wk-brand">
      <span className="wk-brand-mark" aria-hidden="true">
        <Printer size={16} />
      </span>
      <span className="wk-brand-name">{name}</span>
    </div>
  );
}

function Nav({ view, reach }: { view: View; reach: string[] }) {
  const t = useT();
  const env = useEnv();
  // The Customiser's set-up (fonts, palettes, ready-made designs) is the owner's: no other role's grant opens it.
  const setsUp = maySetUpDesigns(env.door.who());
  const lit = navOf(view);
  const items = WORKS_NAV.filter((entry) => reach.includes(entry.id));
  const designs = items.findIndex((e) => e.id === "prices") + 1;
  const button = (entry: WorksNavEntry) => (
    <button key={entry.id} type="button" className="wk-nav-item" aria-current={lit === entry.id ? "page" : undefined} onClick={() => go(entry.view)}>
      {ICON[entry.icon]}
      {t(entry.labelKey)}
    </button>
  );
  return (
    <nav className="wk-nav" aria-label={t("works.nav.label")}>
      {items.slice(0, designs).map(button)}
      {setsUp && (
        <a className="wk-nav-item" href={env.addOnPageHref("customiser", "customiser")} target="_top">
          <LayoutTemplate size={17} aria-hidden="true" />
          {t("works.nav.designs")}
        </a>
      )}
      {mayErase(env.door.who()) && (
        <a className="wk-nav-item" href={env.privacyHref} target="_top">
          <UserX size={17} aria-hidden="true" />
          {t("works.nav.privacy")}
        </a>
      )}
      {items.slice(designs).map(button)}
    </nav>
  );
}

function Drawer({ works, view, reach }: { works: string; view: View; reach: string[] }) {
  const t = useT();
  const titleId = useId();
  const closeIt = () => useWorks.setState({ navOpen: false });
  return (
    <div className="wk-scrim wk-scrim--drawer" onClick={closeIt}>
      <aside className="wk-drawer" role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={(e) => e.stopPropagation()}>
        <div className="wk-drawer-head">
          <span id={titleId}>
            <Brand name={works} />
          </span>
          <button type="button" className="wk-close" aria-label={t("works.close")} onClick={closeIt}>
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <Nav view={view} reach={reach} />
      </aside>
    </div>
  );
}

function SearchBox() {
  const t = useT();
  const data = useData();
  const query = useWorks((s) => s.query);
  const listId = useId();
  const [focused, setFocused] = useState(false);
  const q = query.trim().toLocaleLowerCase();
  const results =
    q === ""
      ? []
      : data.jobs
          .filter(onBoard)
          .filter((job) => {
            const order = orderOf(data, job);
            return [refOf(data, job), text(order?.["name"]) ?? "", text(job["product_name"]) ?? ""].some((s) => s.toLocaleLowerCase().includes(q));
          })
          .slice(0, 6);
  return (
    <div className="wk-search">
      <Search size={16} className="wk-search-icon" aria-hidden="true" />
      <input
        className="wk-search-input"
        type="search"
        value={query}
        placeholder={t("works.search.placeholder")}
        aria-label={t("works.search.placeholder")}
        aria-controls={q === "" ? undefined : listId}
        aria-expanded={q !== "" && focused}
        role="combobox"
        aria-autocomplete="list"
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        onChange={(e) => useWorks.setState({ query: e.target.value })}
      />
      {q !== "" && (
        <div className="wk-search-results" id={listId} role="listbox" aria-label={t("works.search.results")}>
          {results.map((job) => (
            <button key={String(job.id)} type="button" role="option" aria-selected="false" className="wk-search-row" onClick={() => go("ticket", { jobId: job.id })}>
              <Mono className="wk-search-ref">{refOf(data, job)}</Mono>
              <span className="wk-search-title">{text(job["product_name"]) ?? ""}</span>
              <span className="wk-search-sub">
                <Typed>{text(orderOf(data, job)?.["name"]) ?? ""}</Typed>
              </span>
            </button>
          ))}
          {results.length === 0 && <div className="wk-search-empty">{t("works.search.none")}</div>}
        </div>
      )}
    </div>
  );
}

function Screen({ view, reach }: { view: View; reach: string[] }) {
  const lit = navOf(view);
  if (view !== "notfound" && WORKS_NAV.some((e) => e.id === lit) && !reach.includes(lit)) return <NotFoundScreen />;
  switch (view) {
    case "today":
      return <TodayScreen />;
    case "ticket":
      return <TicketScreen />;
    case "jobs":
      return <JobsScreen />;
    case "materials":
      return <MaterialsScreen />;
    case "prices":
      return <PricesScreen />;
    case "dispatch":
      return <DispatchScreen />;
    case "shipments":
      return <ShipmentsScreen />;
    case "addons":
      return <AddOnsScreen />;
    case "addon":
      return <AddOnScreen />;
    case "activity":
      return <ActivityScreen />;
    default:
      return <NotFoundScreen />;
  }
}

/** The shop 404 (comp `I - Marlow Press` 1328-1339). */
export function NotFoundScreen() {
  const t = useT();
  return (
    <section className="wk-screen wk-404" aria-labelledby="wk-404-title">
      <span className="wk-404-icon" aria-hidden="true">
        <FileQuestion size={32} />
      </span>
      <Mono className="wk-404-code">{t("works.missing.code")}</Mono>
      <h1 className="wk-404-title" id="wk-404-title">
        {t("works.missing.title")}
      </h1>
      <p className="wk-404-body">{t("works.missing.body")}</p>
      <button type="button" className="wk-btn wk-btn--primary wk-btn--big" onClick={() => go("today")}>
        {t("works.back.board")}
      </button>
    </section>
  );
}
