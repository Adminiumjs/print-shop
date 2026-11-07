/**
 * The staff build's start: the works' screens served by Adminium at
 * `/apps/printing/staff/`, riding the signed-in person's session.
 *
 * It reads the staff `surface-config.json` (who is signed in, the tables'
 * real names, the works' zone and money and settings, the add-ons on), opens
 * the door over the session, reads the rows, loads the add-ons' fills this
 * build mounts (DHL's dispatch), and draws the works. Nobody signed in goes
 * to Adminium's sign-in and comes back. Every screen's address is kept in
 * step with the URL, and, inside the dashboard, with the host's sidebar,
 * theme and language.
 */
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";

import "../styles/tokens.css";
import "../styles/base.css";
import "./works.css";

import { createRegistry } from "../add-ons/host.ts";
import { loadConnectedAddOns } from "../add-ons/connected.ts";
import { I18nProvider, useI18n } from "../i18n/index.tsx";
import { resolveLocale } from "../i18n/locales.ts";
import { AdminiumWorks } from "./adminiumWorks.ts";
import { deviceNow } from "./clock.ts";
import { reload, WorksProvider, type WorksEnv } from "./env.tsx";
import { APP_KEY, WORKS_NAV, WORKS_PLACES } from "./nav.ts";
import { currentView, go, useWorks } from "./store.ts";
import { WorksApp } from "./WorksApp.tsx";
import { createSessionTransport } from "./transport/sessionSource.ts";
import { loadStaffConfig } from "./transport/staffConnection.ts";

/** The host's language, as the dashboard last said it; null until it says. */
let hostLocale: string | null = null;
const localeListeners = new Set<() => void>();

function HostLocale() {
  const { setLocale } = useI18n();
  useEffect(() => {
    const apply = () => {
      if (hostLocale !== null) setLocale(resolveLocale([hostLocale]));
    };
    apply();
    localeListeners.add(apply);
    return () => void localeListeners.delete(apply);
  }, [setLocale]);
  return null;
}

/** A failure before anything could be drawn: said plainly, in a box that needs nothing else to work. */
function fail(mount: HTMLElement, message: string): void {
  const box = document.createElement("div");
  box.setAttribute("role", "alert");
  box.className = "wk-failed";
  box.textContent = message;
  mount.replaceChildren(box);
}

/** The places in the dashboard the works' screens link out to. */
export const DASHBOARD_LINKS: Omit<WorksEnv, "door"> = {
  addOnPageHref: (key, ref) => `/add-ons/${encodeURIComponent(key)}/${encodeURIComponent(ref)}`,
  addOnsHref: "/studio/add-ons",
  signInHref: "/login",
  addOnSettingsHref: (key) => `/add-on-settings/${encodeURIComponent(key)}`,
  privacyHref: "/studio/privacy?tab=person",
};

export async function bootWorks(mount: HTMLElement): Promise<void> {
  const cfg = await loadStaffConfig();
  if (cfg === null) {
    fail(mount, "This Adminium did not answer the works' configuration. It may be older than this app, or the app is not installed.");
    return;
  }
  if (cfg.user === null || cfg.csrfToken === null) {
    window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    return;
  }
  if (cfg.appName !== null) document.title = cfg.appName;
  const transport = createSessionTransport({
    tableOfRef: cfg.tables,
    connectionId: cfg.connectionId ?? undefined,
    installId: cfg.installId,
    staff: { csrfToken: cfg.csrfToken, timezone: cfg.timezone, timezoneSource: cfg.timezoneSource, serverTimezone: cfg.serverTimezone, currency: cfg.currency },
    refreshToken: async () => (await loadStaffConfig())?.csrfToken ?? null,
  });
  const said = cfg.now === undefined || cfg.now === null ? Number.NaN : Date.parse(cfg.now);
  const door = new AdminiumWorks(transport, cfg, { skew: Number.isNaN(said) ? 0 : said - deviceNow() });
  const env: WorksEnv = { door, ...DASHBOARD_LINKS };

  // The address and the screen in step; inside the dashboard, its sidebar too.
  const { attachUrlSync } = await import("../urlSync.ts");
  let bridge: { navigated: (path: string) => void } | null = null;
  const sync = attachUrlSync({ nav: [...WORKS_NAV, ...WORKS_PLACES], side: "staff", go: (view) => go(view), current: currentView, onPath: (path) => bridge?.navigated(path) });
  const { connectToHost } = await import("../embed.ts");
  bridge = await connectToHost(APP_KEY, "staff", sync.path(), {
    onTheme: (theme) => useWorks.setState({ theme }),
    onLocale: (locale) => {
      hostLocale = locale;
      for (const listener of localeListeners) listener();
    },
    onPath: (path) => sync.applyPath(path),
  });
  useWorks.subscribe(sync.reflect);

  createRoot(mount).render(
    <StrictMode>
      <I18nProvider>
        <HostLocale />
        <WorksProvider env={env}>
          <WorksApp />
        </WorksProvider>
      </I18nProvider>
    </StrictMode>,
  );
  await reload(door);
  // DHL's dispatch flow, from the add-on Adminium has for this app: a broken add-on leaves its slot empty, never the works.
  // Only this install's: the config's add-ons are those attached to it, switched on and installed.
  const loaded = await loadConnectedAddOns({ appKey: APP_KEY, origin: window.location.origin, installId: cfg.installId, allowed: new Set(Object.keys(cfg.addOns)) });
  useWorks.setState({ registry: createRegistry(loaded.addOns) });
}
