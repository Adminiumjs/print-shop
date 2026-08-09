/**
 * The app root: theme stamping, the ambient i18n bridge, and the view switch.
 *
 * There is no router. This is a demo people click through, and a state-switched
 * view keeps the whole app one bundle with no history to get out of step with
 * the dock's persona segment.
 */

import { useEffect } from "react";

import { demoAddOns } from "../add-ons/registry.ts";
import { DemoDock } from "../components/DemoDock.tsx";
import { Overlays, Toasts } from "../components/Overlays.tsx";
import { ScreenSkeleton } from "../components/Primitives.tsx";
import { CustomerShell, ShopShell } from "../components/Shell.tsx";
import { setAmbient } from "../i18n/ambient.ts";
import { useI18n } from "../i18n/index.tsx";
import { Artwork, Configurator, Products } from "../screens/Customer.tsx";
import { Basket, Confirmation, OrderLookup } from "../screens/CustomerOrder.tsx";
import {
  AddOns,
  DeliveryInfo,
  FindUs,
  NotFound,
  Proofs,
  Reorder,
  Samples,
  SavedQuotes,
  Templates,
} from "../screens/Extras.tsx";
import { JobsList, Materials, Prices, Ticket, Today } from "../screens/Shop.tsx";
import { personaFor, useStore } from "../state/store.ts";

export default function App() {
  const { locale, t, money, number } = useI18n();
  const view = useStore((s) => s.view);
  const theme = useStore((s) => s.theme);
  const loading = useStore((s) => s.loading);

  // Keep the pure modules — the store, the seed, both engines — formatting in
  // whatever locale the tree is rendering.
  setAmbient(locale, t, money, number);

  /*
   * `null` means "follow the OS", which is what tokens.css does by default.
   * Stamping the attribute only once a choice exists is what lets the media
   * query work until the visitor overrides it, and the override win after.
   */
  useEffect(() => {
    const root = document.documentElement;
    if (theme === null) root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
  }, [theme]);

  /*
   * Register the compiled-in add-ons once. REGISTERED IS NOT ENABLED: the
   * `enabled` set starts empty, so the app boots as its base state with the
   * three honest empty panels showing, and stays there until somebody flips a
   * dock toggle or connects one from the shelf. Registration only tells the
   * host what COULD be switched on.
   */
  useEffect(() => {
    useStore.getState().registerAddOns(demoAddOns());
  }, []);

  const persona = personaFor(view);
  const body = loading ? <ScreenSkeleton /> : <Screen />;

  return (
    <div className="mp-app">
      {persona === "customer" ? (
        <CustomerShell>{body}</CustomerShell>
      ) : (
        <ShopShell>{body}</ShopShell>
      )}
      <DemoDock />
      <Overlays />
      <Toasts />
    </div>
  );
}

function Screen() {
  const view = useStore((s) => s.view);

  switch (view) {
    // Customer
    case "products":
      return <Products />;
    case "configure":
      return <Configurator />;
    case "artwork":
      return <Artwork />;
    case "basket":
      return <Basket />;
    case "confirm":
      return <Confirmation />;
    case "order":
      return <OrderLookup />;
    case "findus":
      return <FindUs />;
    case "reorder":
      return <Reorder />;
    case "samples":
      return <Samples />;
    case "templates":
      return <Templates />;
    case "proofs":
      return <Proofs />;
    case "saved":
      return <SavedQuotes />;
    case "delivery":
      return <DeliveryInfo />;

    // Print shop
    case "today":
      return <Today />;
    case "ticket":
      return <Ticket />;
    case "jobs":
      return <JobsList />;
    case "materials":
      return <Materials />;
    case "prices":
      return <Prices />;
    case "addons":
      return <AddOns />;

    default:
      return <NotFound />;
  }
}
