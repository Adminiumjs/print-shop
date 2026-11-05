/**
 * The demo build's start: the shop and the works' own screens, both, over the
 * one Marlow Press held in the page (`adminium.ts`), with no server anywhere.
 * Whoever the card says is using it — a customer or the works — has their
 * side drawn; an order placed on one side is on the other the moment it is
 * placed.
 *
 * The page answers the website's demo card (`demoBridge.ts`) and keeps no
 * card of its own. DEMO BUILD ONLY — `main.tsx` reaches it behind the
 * build-time `DEMO` flag.
 */
import { StrictMode, useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";

import "../shop/shop.css";
import "../studio/works.css";

import { I18nProvider, useI18n } from "../i18n/index.tsx";
import { resolveLocale } from "../i18n/locales.ts";
import ShopApp from "../shop/ShopApp.tsx";
import { useShop } from "../shop/store.ts";
import { WorksProvider, type WorksEnv } from "../studio/env.tsx";
import { useWorks } from "../studio/store.ts";
import { WorksApp } from "../studio/WorksApp.tsx";
import { attachDemoBridge, clearTab } from "../demoBridge.ts";
import { demoAdminium, useDemo } from "./adminium.ts";

/** The card's language, once it has said one. */
function CardLocale() {
  const { setLocale } = useI18n();
  const asked = useDemo((s) => s.locale);
  useEffect(() => {
    if (asked !== null) setLocale(resolveLocale([asked]));
  }, [asked, setLocale]);
  return null;
}

/** The works' theme and the card's, kept as one. */
function useOneTheme(): "light" | "dark" {
  const theme = useDemo((s) => s.theme);
  useEffect(() => {
    if (useWorks.getState().theme !== theme) useWorks.setState({ theme });
  }, [theme]);
  useEffect(
    () =>
      useWorks.subscribe((s) => {
        if (s.theme !== null && s.theme !== useDemo.getState().theme) useDemo.setState({ theme: s.theme });
      }),
    [],
  );
  return theme;
}

export function DemoRoot() {
  const persona = useDemo((s) => s.persona);
  const generation = useDemo((s) => s.generation);
  const theme = useOneTheme();
  const env = useMemo<WorksEnv>(
    // An add-on's page is the dashboard's, which the demo does not have: the links stay on this page.
    () => ({ door: demoAdminium().works, addOnPageHref: () => "#", addOnsHref: "#", signInHref: "#" }),
    // A fresh world is a new door.
    [generation],
  );
  return (
    <>
      <CardLocale />
      {persona === "customer" ? (
        <ShopApp theme={theme} onTheme={(next) => useDemo.setState({ theme: next })} />
      ) : (
        <WorksProvider env={env}>
          <WorksApp />
        </WorksProvider>
      )}
    </>
  );
}

export async function bootDemo(mount: HTMLElement): Promise<void> {
  // A new demo page is a new Marlow Press: nothing of the last one's basket, designs or sign-in.
  clearTab();
  useShop.setState({ port: demoAdminium().shop });
  createRoot(mount).render(
    <StrictMode>
      <I18nProvider>
        <DemoRoot />
      </I18nProvider>
    </StrictMode>,
  );
  attachDemoBridge();
}
