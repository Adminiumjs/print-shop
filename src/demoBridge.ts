/**
 * The demo build's side of the website's demo card: the card says which
 * screen, person, language, theme and add-ons to show, presses shortcuts and
 * moves the clock; the page says where it is. DEMO BUILD ONLY — `main.tsx`
 * reaches it only behind the build-time `DEMO` flag, through the demo's own
 * start, so no surface bundle carries the protocol.
 *
 * Both ends speak only to their own origin: the card's page frames this one
 * from the same site, so a message from anywhere else, or from any window but
 * the one framing this page, is ignored, and nothing is ever posted to `*`.
 */
import { DEMO_MESSAGE_PREFIX, isDemoMessage, type DemoMessage } from "./demo-types.ts";
import { demoAdminium, useDemo } from "./demo/adminium.ts";
import { currentScreen, goScreen, moveClock, resetWorld, runShortcut, setPersona, SCREEN_IDS, SHORTCUT_IDS } from "./demo/shortcuts.ts";
import { CARD_ADD_ONS } from "./demo/world.ts";
import { reload } from "./studio/env.tsx";
import { useWorks } from "./studio/store.ts";
import { useShop } from "./shop/store.ts";
import { useAfter } from "./shop/after.ts";

export { SCREEN_IDS, SHORTCUT_IDS };

const APP_KEY = "printing";

/** What the shop keeps for the tab: a new demo page starts without the last one's basket, designs or sign-in. */
const TAB_SLOTS = ["printing.shop.basket", "printing.shop.designs", "printing.shop.lookedFor", "printing.shop.quotes"];

const locale = (): string => document.documentElement.lang || "en-US";

function post(message: DemoMessage): void {
  if (window.parent === window) return;
  window.parent.postMessage(message, window.location.origin);
}

/** The works' clock as the card prints it, in the page's language: "Wed 5 Aug · 10:20". */
export function clockLabel(): string {
  const w = demoAdminium().world;
  const tag = locale() === "en-US" ? "en-GB" : locale();
  const at = new Date(w.now);
  const day = new Intl.DateTimeFormat(tag, { timeZone: w.zone, weekday: "short", day: "numeric", month: "short" }).format(at);
  const time = new Intl.DateTimeFormat(tag, { timeZone: w.zone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(at);
  return `${day} · ${time}`;
}

/** Whether the page shows a dialog, a sheet or a panel over the screen: the card steps aside while it does. */
function overlay(): boolean {
  if (useDemo.getState().persona === "shop") {
    const s = useWorks.getState();
    return s.overlay !== null || s.navOpen;
  }
  return useAfter.getState().saving.open;
}

let queued = false;

/** Where the page is, for the card — once per burst of changes. */
export function reportState(): void {
  if (queued) return;
  queued = true;
  queueMicrotask(() => {
    queued = false;
    const addOns = demoAdminium().world.addOns;
    post({
      type: `${DEMO_MESSAGE_PREFIX}state` as "adminium:demo:state",
      dv: 1,
      screen: currentScreen(),
      persona: useDemo.getState().persona,
      mode: null,
      online: true,
      toggles: Object.fromEntries(CARD_ADD_ONS.map((key) => [key, addOns.has(key)])),
      locale: locale(),
      theme: useDemo.getState().theme,
      clockLabel: clockLabel(),
      overlay: overlay(),
    });
  });
}

export function clearTab(): void {
  try {
    for (const slot of TAB_SLOTS) sessionStorage.removeItem(slot);
    for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
      const key = sessionStorage.key(i);
      if (key !== null && key.startsWith("printing.shop.session.")) sessionStorage.removeItem(key);
    }
  } catch {
    // no storage: nothing kept to clear
  }
}

export async function applyDemoMessage(message: DemoMessage): Promise<void> {
  switch (message.type) {
    case "adminium:demo:init":
    case "adminium:demo:set": {
      if (message.theme !== undefined) useDemo.setState({ theme: message.theme });
      if (message.locale !== undefined) useDemo.setState({ locale: message.locale });
      if (message.persona === "customer" || message.persona === "shop") await setPersona(message.persona);
      if (message.type === "adminium:demo:init" && message.screen !== undefined) await goScreen(message.screen);
      if (message.type === "adminium:demo:set" && message.addOn !== undefined && (CARD_ADD_ONS as readonly string[]).includes(message.addOn.key)) {
        demoAdminium().world.setAddOn(message.addOn.key, message.addOn.on);
        if (useDemo.getState().persona === "shop") await reload(demoAdminium().works);
      }
      break;
    }
    case "adminium:demo:go":
      await goScreen(message.screen);
      break;
    case "adminium:demo:do":
      await runShortcut(message.shortcut);
      break;
    case "adminium:demo:clock":
      await moveClock(message.advance);
      break;
    case "adminium:demo:reset":
      clearTab();
      await resetWorld();
      break;
    default:
      break;
  }
  reportState();
}

export function attachDemoBridge(): void {
  window.addEventListener("message", (event: MessageEvent) => {
    if (event.source !== window.parent || event.origin !== window.location.origin || !isDemoMessage(event.data)) return;
    void applyDemoMessage(event.data);
  });
  for (const store of [useDemo, useShop, useWorks, useAfter]) (store as { subscribe: (f: () => void) => unknown }).subscribe(reportState);
  demoAdminium().world.onChange(reportState);
  new MutationObserver(reportState).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  post({ type: `${DEMO_MESSAGE_PREFIX}hello` as "adminium:demo:hello", dv: 1, appKey: APP_KEY });
}
