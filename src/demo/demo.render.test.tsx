// @vitest-environment jsdom
/**
 * THE DEMO, DRAWN: both sides boot over the one Marlow Press in the page,
 * with no server; the card's messages move it (a screen, a shortcut, the
 * clock, an add-on, back to Wednesday morning) and it says where it is; an
 * order the customer places is on the works' board.
 *
 * The Customiser's editor is the add-on's own and is swept by its suite; a
 * stand-in takes its place here, as in the shop's screen suite.
 */
import { act } from "react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("../../vendor/customiser/index.js", () => ({
  CustomiserEditor: () => <div>The editor</div>,
  WaysIn: () => null,
  designRefusal: () => null,
  heldDesign: () => null,
  hasSavedDesigns: (held: readonly unknown[]) => held.length > 0,
  openSavedLink: async () => "unknown",
  readDesigns: async () => [],
  YourDesigns: () => null,
}));
vi.mock("../../vendor/customiser/editor.css", () => ({}));

import type { DemoMessage } from "../demo-types.ts";
import { applyDemoMessage, clockLabel } from "../demoBridge.ts";
import { addJobForArtwork, goView, openProduct, placeOrder, setDetails, useShop } from "../shop/store.ts";
import { useWorks } from "../studio/store.ts";
import { demoAdminium, resetDemo, useDemo } from "./adminium.ts";
import { bootDemo } from "./boot.tsx";
import { currentScreen } from "./shortcuts.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
// jsdom draws no page to scroll; a new screen asks to start at its top.
window.scrollTo = () => {};

let host: HTMLElement;

/** Let the screens' effects, the doors' promises and the dry runs' short waits run. */
async function settle(ms = 600): Promise<void> {
  for (let i = 0; i < 4; i += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, ms / 4));
    });
  }
}

const send = async (message: Record<string, unknown>) => {
  await act(async () => {
    await applyDemoMessage({ dv: 1, ...message } as DemoMessage);
  });
  await settle();
};

beforeAll(async () => {
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

describe("the demo, with no server", () => {
  it("opens on Marlow Press's products, its catalogue and its clock the sample's", () => {
    expect(useDemo.getState().persona).toBe("customer");
    expect(useShop.getState().loading).toBe("ok");
    expect(host.textContent).toContain("Business cards");
    expect(host.textContent).toContain("PVC banners");
    expect(clockLabel()).toBe("Wed 5 Aug · 10:20");
    expect(currentScreen()).toBe("products");
  });

  it("sets up the comp's 500 business cards from the card's shortcut, priced by Adminium's rules", async () => {
    await send({ type: "adminium:demo:go", screen: "config" });
    await send({ type: "adminium:demo:do", shortcut: "cards" });
    const s = useShop.getState();
    expect([s.view, s.productCode, s.choice?.qty, s.choice?.look]).toEqual(["product", "business-cards", 500, "matt"]);
    expect(currentScreen()).toBe("config");
    // The comp's quote of these cards (P1-C5): £66.46 of work, delivery £6.50, total £87.55.
    expect(host.textContent).toContain("Material£6.65");
    expect(host.textContent).toContain("Total£87.55");
  });

  it("places the order as MP-4127 at the total the basket showed", async () => {
    await act(async () => {
      openProduct("business-cards");
      addJobForArtwork();
      goView("basket");
      setDetails({ name: "Harbour Bakery", email: "hello@harbourbakery.example", line1: "12 Quay Street", town: "Marlow", postcode: "SL7 1BT" });
    });
    await settle();
    await send({ type: "adminium:demo:do", shortcut: "fill-harbour" });
    let placed = "";
    await act(async () => {
      placed = await placeOrder();
    });
    await settle();
    expect(placed).toBe("placed");
    expect(useShop.getState().view).toBe("confirmed");
    expect(host.textContent).toContain("MP-4127");
  });

  it("shows that order on the works' board when the card switches to the shop", async () => {
    await send({ type: "adminium:demo:go", screen: "jobs" });
    expect(useDemo.getState().persona).toBe("shop");
    expect(useWorks.getState().view).toBe("jobs");
    expect(host.textContent).toContain("MP-4127");
    const order = demoAdminium().world.all("orders").find((o) => o["number"] === "MP-4127")!;
    expect(order["ready_by"]).toBe("2026-08-10");
  });

  it("answers a proof yes from the card, and moves the clock a working day and past the cut-off", async () => {
    await send({ type: "adminium:demo:go", screen: "today" });
    await send({ type: "adminium:demo:do", shortcut: "proof-approved" });
    expect(demoAdminium().world.all("proofs").filter((p) => p["state"] === "approved").length).toBeGreaterThan(0);
    await send({ type: "adminium:demo:clock", advance: "day" });
    expect(clockLabel()).toBe("Thu 6 Aug · 10:20");
    await send({ type: "adminium:demo:clock", advance: "cutoff" });
    expect(clockLabel()).toBe("Thu 6 Aug · 14:05");
  });

  it("switches Holiday calendars on, and the price list offers its days", async () => {
    await send({ type: "adminium:demo:set", addOn: { key: "holiday-calendars", on: true } });
    await send({ type: "adminium:demo:go", screen: "prices" });
    expect(demoAdminium().works.facts().addOns).toContain("holiday-calendars");
    expect(host.textContent).toContain("Christmas Day");
  });

  it("goes back to Wednesday morning, with a fresh Marlow Press and the same person", async () => {
    await send({ type: "adminium:demo:reset" });
    expect(clockLabel()).toBe("Wed 5 Aug · 10:20");
    expect(useDemo.getState().persona).toBe("shop");
    expect(demoAdminium().world.all("orders").some((o) => o["number"] === "MP-4127")).toBe(false);
    await send({ type: "adminium:demo:set", persona: "customer" });
    expect(currentScreen()).toBe("products");
  });
});
