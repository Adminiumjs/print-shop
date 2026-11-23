// @vitest-environment jsdom
/**
 * THE CHECKOUT, WITH AND WITHOUT A COUNTRY LISTED.
 *
 * With none it draws and sends what it always did. With one it offers the
 * works' own and that one, prices by the country, asks for a phone only for a
 * parcel going abroad, and says so plainly when a customer's country is not
 * there. Each state is held to axe.
 */
import axe from "axe-core";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "../i18n/index.tsx";
import { resetAfter } from "./after.ts";
import { firstChoice } from "./config.ts";
import { resetPay } from "./pay.ts";
import type { Catalogue, OrderBody } from "./port.ts";
import ShopApp from "./ShopApp.tsx";
import { resetShop, useShop, type ArtFile } from "./store.ts";
import { fakePort, IDS, sampleCatalogue, type FakePort } from "./testing.ts";

vi.mock("../../vendor/customiser/index.js", () => ({
  CustomiserEditor: () => <div>The editor</div>,
  WaysIn: () => <div role="group" aria-label="How would you like to make it?" />,
  YourDesigns: () => <h1>Your designs</h1>,
  designRefusal: () => null,
  heldDesign: () => null,
  hasSavedDesigns: () => false,
  readDesigns: async () => [],
  openSavedLink: async () => "unknown",
}));
vi.mock("../../vendor/customiser/editor.css", () => ({}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const LISTED: Catalogue["countries"] = [{ id: 7, code: "DE", price: "14.50" }];
const FILE: ArtFile = { id: "f1", name: "card.pdf", size: 10, status: "in", refusal: null, rows: [], accepted: true, upload: { id: "UPLOAD1", name: "card.pdf", size: 10, kind: "pdf" } };

let port: FakePort;
let root: Root | null = null;
let host: HTMLDivElement;

async function settle(): Promise<void> {
  for (let i = 0; i < 4; i += 1) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
  }
}

async function open(countries: Catalogue["countries"]): Promise<void> {
  const catalogue = { ...sampleCatalogue(), countries };
  port = fakePort(catalogue);
  resetShop(port);
  const product = catalogue.products.find((p) => p.id === IDS.cards)!;
  useShop.setState({ catalogue, basket: [{ id: "j1", productId: product.id, choice: firstChoice(catalogue, product), design: null, features: [], artwork: [FILE] }] });
  window.history.replaceState(null, "", "/basket");
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(
      <I18nProvider>
        <ShopApp />
      </I18nProvider>,
    );
  });
  await settle();
}

const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector);
const lastBody = (call: "quote" | "place") => (port.calls.filter((c) => c.call === call).at(-1) as { body: OrderBody } | undefined)?.body.values;
async function pick(code: string): Promise<void> {
  const select = $<HTMLSelectElement>("#mp-d-country")!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")!.set!.call(select, code);
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await settle();
}
async function type(selector: string, value: string): Promise<void> {
  const input = $<HTMLInputElement>(selector)!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function fillAddress(): Promise<void> {
  await type("#mp-d-name", "Heidi Vogel");
  await type("#mp-d-email", "heidi@vogel-studio.dev");
  await type("#mp-d-line1", "Hauptstr. 1");
  await type("#mp-d-town", "Berlin");
  await type("#mp-d-postcode", "10115");
}
const place = async () => {
  await act(async () => $<HTMLButtonElement>(".mp-summary .mp-button--accent")!.click());
  await settle();
};
async function clean(): Promise<void> {
  vi.useRealTimers();
  const found = await axe.run(document.body, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } });
  vi.useFakeTimers();
  expect(found.violations.map((v) => v.id)).toEqual([]);
}

beforeEach(() => {
  vi.useFakeTimers();
  sessionStorage.clear();
  localStorage.clear();
  localStorage.setItem("print-shop-locale", "en-US");
  window.scrollTo = () => {};
  resetAfter(null);
  resetPay();
});
afterEach(async () => {
  await act(async () => root?.unmount());
  root = null;
  host?.remove();
  vi.useRealTimers();
});

describe("with no country listed", () => {
  it("draws and sends what it always did", async () => {
    await open([]);
    expect($("#mp-d-country")).toBeNull();
    expect($("#mp-d-phone")).toBeNull();
    expect($(".mp-country-missing")).toBeNull();
    const sent = lastBody("quote")!;
    expect(sent).not.toHaveProperty("delivery_country_id");
    expect(sent).not.toHaveProperty("phone");
  });
});

describe("with a country listed", () => {
  it("offers the works' own and the listed one, and asks no phone at home", async () => {
    await open(LISTED);
    expect([...document.querySelectorAll<HTMLOptionElement>("#mp-d-country option")].map((o) => o.value)).toEqual(["GB", "DE"]);
    expect($("#mp-d-phone")).toBeNull();
    expect(lastBody("quote")).not.toHaveProperty("delivery_country_id");
    await clean();
  });

  it("prices by the country, and never sends the pricing number on a real order", async () => {
    await open(LISTED);
    await pick("DE");
    expect(lastBody("quote")).toMatchObject({ delivery_country_id: 7 });
    expect($(".mp-country-note")?.textContent).toContain("Import charges");
    await clean();
    await fillAddress();
    await place();
    expect($("#mp-d-phone-err")?.textContent).toContain("Add a phone number");
    expect(port.calls.some((c) => c.call === "place")).toBe(false);
    await type("#mp-d-phone", "call me");
    expect($("#mp-d-phone-err")?.textContent).toContain("Check this phone number");
    await type("#mp-d-phone", "+49 30 1234567");
    await place();
    expect(lastBody("place")).toMatchObject({ delivery_country_id: 7, phone: "+49 30 1234567" });
  });

  it("goes back to the works' own country with no phone sent", async () => {
    await open(LISTED);
    await pick("DE");
    await pick("GB");
    expect($("#mp-d-phone")).toBeNull();
    const sent = lastBody("quote")!;
    expect(sent).not.toHaveProperty("delivery_country_id");
    expect(sent).not.toHaveProperty("phone");
  });

  it("says who it delivers to when a customer's country is not there, and comes back", async () => {
    await open(LISTED);
    await act(async () => $<HTMLButtonElement>(".mp-country-missing")!.click());
    await settle();
    expect($("#mp-notserved-title")?.textContent).toContain("We don't deliver to your country yet");
    expect(document.activeElement?.id).toBe("mp-notserved-title");
    expect($(".mp-notserved-served")?.textContent).toMatch(/United Kingdom.*Germany/);
    await clean();
    await act(async () => $<HTMLButtonElement>(".mp-notserved .mp-button")!.click());
    await settle();
    expect(document.activeElement?.id).toBe("mp-d-country");
  });

  it("does not place an order to a country taken off the list, and says so", async () => {
    await open(LISTED);
    await pick("DE");
    await fillAddress();
    await type("#mp-d-phone", "+49 30 1234567");
    port.refuseNext({ code: "PUBLIC_WRITE_REFUSED", status: 400, column: "delivery_country_id", child: null, index: null, reason: "not-linkable", changed: null, raw: null });
    await place();
    expect(useShop.getState().destination).toBeNull();
    expect(text()).toContain("We no longer deliver to Germany");
    expect(port.calls.some((c) => c.call === "place")).toBe(false);
  });
});

const text = () => document.body.textContent ?? "";
