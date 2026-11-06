// @vitest-environment jsdom
/**
 * The demo page's side of the website's demo card, as a framed page meets it:
 * it says hello to the window framing it, answers the card's init with where
 * it is, takes messages from that window at this origin only, presses the
 * customer's shortcuts on their screens (the lookup filled and its code
 * "e-mailed", a price that moves while the customer shops, a file with a
 * warning), and hides the card while a sheet is open.
 */
import { act } from "react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("./../vendor/customiser/index.js", () => ({
  CustomiserEditor: () => null,
  WaysIn: () => null,
  designRefusal: () => null,
  heldDesign: () => null,
  hasSavedDesigns: () => false,
  openSavedLink: async () => "unknown",
  readDesigns: async () => [],
  YourDesigns: () => null,
}));
vi.mock("./../vendor/customiser/editor.css", () => ({}));

import type { DemoMessage } from "./demo-types.ts";
import { demoAdminium, resetDemo } from "./demo/adminium.ts";
import { bootDemo } from "./demo/boot.tsx";
import { useAfter } from "./shop/after.ts";
import { placeOrder, useShop } from "./shop/store.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
window.scrollTo = () => {};

let card: Window;
const sent: { message: DemoMessage; origin: string }[] = [];
let host: HTMLElement;

async function settle(ms = 600): Promise<void> {
  for (let i = 0; i < 3; i += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, ms / 3));
    });
  }
}

/** A message from the card, as the browser hands it over. */
async function send(data: Record<string, unknown>, from: { source?: Window; origin?: string } = {}): Promise<void> {
  await act(async () => {
    window.dispatchEvent(new MessageEvent("message", { data: { dv: 1, ...data }, origin: from.origin ?? window.location.origin, source: from.source ?? card }));
  });
  await settle();
}

const lastState = () => [...sent].reverse().find((s) => s.message.type === "adminium:demo:state")?.message as Extract<DemoMessage, { type: "adminium:demo:state" }> | undefined;

beforeAll(async () => {
  // The website's page, framing this one: its window is the parent, at the same origin.
  const frame = document.createElement("iframe");
  document.body.append(frame);
  card = frame.contentWindow!;
  vi.spyOn(card, "postMessage").mockImplementation(((message: DemoMessage, origin: string) => {
    sent.push({ message, origin });
  }) as typeof card.postMessage);
  Object.defineProperty(window, "parent", { configurable: true, value: card });
  localStorage.setItem("print-shop-locale", "en-US");
  resetDemo();
  host = document.createElement("div");
  document.body.append(host);
  await act(async () => {
    await bootDemo(host);
  });
  await settle();
});

afterAll(() => {
  host.remove();
});

describe("the demo bridge", () => {
  it("says hello to the window framing it, at this origin only", () => {
    expect(sent[0]).toEqual({ message: { type: "adminium:demo:hello", dv: 1, appKey: "printing" }, origin: window.location.origin });
    expect(sent.every((s) => s.origin === window.location.origin)).toBe(true);
  });

  it("answers the card's init with where it is, and the works' clock as the card prints it", async () => {
    await send({ type: "adminium:demo:init", locale: "en-US", theme: "dark", screen: "templates" });
    expect(useShop.getState().view).toBe("templates");
    expect(lastState()).toMatchObject({ screen: "templates", persona: "customer", theme: "dark", clockLabel: "Wed 5 Aug · 10:20", overlay: false, toggles: { "shipping-dhl": false, inventory: false, invoices: true, "holiday-calendars": false } });
  });

  it("takes no message from another window, or from another origin", async () => {
    await send({ type: "adminium:demo:go", screen: "findus" }, { source: window });
    await send({ type: "adminium:demo:go", screen: "findus" }, { origin: "https://elsewhere.example" });
    expect(useShop.getState().view).toBe("templates");
    await send({ type: "adminium:demo:go", screen: "findus" });
    expect(useShop.getState().view).toBe("findUs");
  });

  it("fills the order lookup, asks for its code and types it back", async () => {
    await send({ type: "adminium:demo:go", screen: "order" });
    await send({ type: "adminium:demo:do", shortcut: "fill-lookup" });
    expect(useAfter.getState().lookup).toMatchObject({ ref: "MP-4113", email: "hello@harbourbakery.example" });
    await act(async () => {
      await demoAdminium().after.requestCode("hello@harbourbakery.example");
    });
    await send({ type: "adminium:demo:do", shortcut: "fill-code" });
    expect(useAfter.getState().lookup.digits).toBe("482913");
  });

  it("drops a file with a warning on the artwork screen, its checks read", async () => {
    await send({ type: "adminium:demo:go", screen: "artwork" });
    await send({ type: "adminium:demo:do", shortcut: "file-warn" });
    await settle(900);
    const files = useShop.getState().artFiles;
    expect(files.map((f) => [f.name, f.status])).toEqual([["harbour-cards-rgb.pdf", "in"]]);
    expect(files[0]?.rows?.some((r) => r.level === "warn")).toBe(true);
  });

  it("raises a price while the customer shops, and the page finds out when they place", async () => {
    await send({ type: "adminium:demo:go", screen: "basket" });
    await send({ type: "adminium:demo:do", shortcut: "fill-harbour" });
    const before = useShop.getState().shownTotal;
    await send({ type: "adminium:demo:do", shortcut: "price-up" });
    let placed = "";
    await act(async () => {
      placed = await placeOrder();
    });
    await settle();
    expect(placed).toBe("moved");
    expect(Number(useShop.getState().shownTotal)).toBeGreaterThan(Number(before));
  });
});
