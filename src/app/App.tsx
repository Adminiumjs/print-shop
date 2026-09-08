/**
 * The app root: theme stamping, the ambient i18n bridge, and the view switch.
 *
 * There is no router. This is a demo people click through, and a state-switched
 * view keeps the whole app one bundle with no history to get out of step with
 * the dock's persona segment.
 */

import { useEffect } from "react";

import { loadConnectedAddOns } from "../add-ons/connected.ts";
import { demoAddOns } from "../add-ons/registry.ts";
import { APP_KEY, HOSTED } from "../surface.ts";
import { DemoDock } from "../components/DemoDock.tsx";
import { isConnected } from "../data/source.ts";
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
   * Register the add-ons once, from whichever source this build has (26 §6).
   *
   * DEMO AND STANDALONE: the three compiled-in bundles, named by three imports
   * in `registry.ts`. REGISTERED IS NOT ENABLED — the `enabled` set starts
   * empty, so the app boots as its base state with the three honest empty
   * panels showing, and stays there until somebody flips a dock toggle or
   * connects one from the shelf. Registration only tells the host what COULD be
   * switched on.
   *
   * HOSTED: the list comes from this shop's own Adminium, over a same-origin
   * session, and the bundles are imported from it. Here registration IS
   * enablement: an operator already decided what is installed and switched on,
   * in Studio, and asking them to switch it on a second time in the shop would
   * be a second source of truth for one fact. So the connected keys go straight
   * into `enabled`.
   *
   * `HOSTED` folds to a literal at build time (`surface.ts` explains why it
   * must not be wrapped in a call), so the branch a build does not take is not
   * in that build's bytes — the demo carries no loader and no `fetch`.
   */
  useEffect(() => {
    if (!HOSTED) {
      useStore.getState().registerAddOns(demoAddOns());
      return;
    }
    let live = true;
    void loadConnectedAddOns({ appKey: APP_KEY, origin: window.location.origin }).then(
      ({ addOns, problems }) => {
        // The effect can be torn down before the fetch lands — React 19's
        // StrictMode double-mount does exactly that in development — and
        // registering into a store the app has moved on from would leave a
        // registry nobody asked for.
        if (!live) return;
        // Messages are registered inside the loader now, per add-on and inside
        // its guard — `registerAddOnMessages` THROWS, and one add-on with a
        // hole in its Arabic used to abort this whole callback: no registry, no
        // logged problems, a shop that looked like it had no add-ons at all.
        //
        // `registerAddOns` takes the enabled set in the SAME `set`, rather than
        // this looping over `connectAddOn`. That action is the operator's
        // Connect button and closes the open dialog as part of its meaning; N
        // of them firing whenever an async load happened to land would shut a
        // dialog somebody was reading.
        useStore.getState().registerAddOns(addOns, { enable: addOns.map((a) => a.key) });
        for (const problem of problems) {
          // Reported rather than swallowed, and reported per add-on: four
          // working add-ons and one broken one is a shop that runs, and the
          // operator needs to know which one is missing.
          console.warn(`[adminium] add-on "${problem.key}": ${problem.code} — ${problem.detail}`);
        }
      },
    );
    return () => {
      live = false;
    };
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
      {!isConnected() && <DemoDock />}
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
