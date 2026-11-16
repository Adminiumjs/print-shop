// @vitest-environment jsdom
/**
 * PAYING ONLINE FROM THE ORDER PAGE, DRAWN, AND EACH STATE UNDER AXE.
 *
 * With payments off the order page reads exactly as before. With them on:
 * the order's total, "Pay now" once every proof is approved beside the
 * works' own way, the wait while a delivery price is agreed, the test band
 * for someone rehearsing, the hand-off to the pay page (the tab keeping
 * which order it was), and the way back: checked, then paid, or as it stood.
 */
import axe from "axe-core";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "../i18n/index.tsx";
import { resetAfter } from "./after.ts";
import { PAYING_KEY, resetPay, setLeave } from "./pay.ts";
import ShopApp from "./ShopApp.tsx";
import { resetShop } from "./store.ts";
import { fakePort, type FakePort } from "./testing.ts";

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

let port: FakePort;
let root: Root | null = null;
let host: HTMLDivElement;
let left: string[] = [];

async function settle(times = 4): Promise<void> {
  for (let i = 0; i < times; i += 1) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
  }
}

async function mount(path: string, locale: "en-US" | "ar-EG" = "en-US"): Promise<void> {
  localStorage.setItem("print-shop-locale", locale);
  window.history.replaceState(null, "", path);
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

const text = () => document.body.textContent ?? "";
const press = async (selector: string): Promise<void> => {
  const el = document.querySelector<HTMLElement>(selector);
  if (el === null) throw new Error(`nothing to press at ${selector}`);
  await act(async () => el.click());
  await settle();
};
const calls = (name: string) => port.afterPort.calls.filter((c) => c.call === name);

async function sweep(label: string): Promise<void> {
  vi.useRealTimers();
  const result = await axe.run(document.body, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] }, rules: { "color-contrast": { enabled: false }, region: { enabled: false } } });
  vi.useFakeTimers();
  expect(result.passes.length, `${label}: axe examined nothing`).toBeGreaterThan(0);
  expect(result.violations.filter((v) => v.impact !== "minor").map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`), label).toEqual([]);
}

/** MP-4113, delivered: its proof approved, £104.69 owed, payable now. */
function payable(more: Record<string, unknown> = {}): void {
  const rows = port.afterPort.rows;
  Object.assign(rows.orders[0]!, { pay_open: 1, due: "104.69", paid_in: "0", paid: "0", paid_online: "0", last_paid_at: null, ...more });
  for (const proof of rows.proofs) if (proof["order_id"] === 13 && proof["state"] === "sent") proof["state"] = "approved";
  for (const job of rows.jobs) if (job["order_id"] === 13) job["proof_state"] = "approved";
}

const LINK = "/order#LINKCODE0000000A";

beforeEach(() => {
  vi.useFakeTimers();
  sessionStorage.clear();
  localStorage.clear();
  window.scrollTo = () => {};
  port = fakePort();
  resetShop(port);
  resetAfter(null);
  resetPay();
  left = [];
  setLeave((url) => left.push(url));
});
afterEach(async () => {
  await act(async () => root?.unmount());
  root = null;
  host?.remove();
  vi.useRealTimers();
});

describe("with payments off", () => {
  it("reads the order page as it always did: no total row, no pay box", async () => {
    payable();
    await mount(LINK);
    expect(text()).toContain("MP-4113");
    expect(document.querySelector('[data-testid="pay-box"]')).toBeNull();
    expect(document.querySelector('[data-testid="order-total"]')).toBeNull();
    expect(text()).not.toContain("Pay ");
  });
});

describe("with payments on", () => {
  beforeEach(() => {
    port.afterPort.paying = { online: true, test: false };
  });

  it("offers Pay now once every proof is approved, beside the invoice that comes with a delivery", async () => {
    payable();
    await mount(LINK);
    const box = document.querySelector('[data-testid="pay-box"]')!;
    expect(box.textContent).toContain("Ready to pay: £104.69");
    expect(box.textContent).toContain("Pay £104.69 now");
    expect(box.textContent).toContain("You'll pay on the Stripe or PayPal page.");
    expect(box.textContent).toContain("Or pay by the invoice we send with your delivery.");
    expect(box.textContent).not.toContain("Test mode");
    expect(document.querySelector('[data-testid="order-total"]')?.textContent).toContain("£104.69");
    await sweep("the pay box");
  });

  it("says the collection way for an order collected from the works", async () => {
    payable({ delivery_method: "collect" });
    await mount(LINK);
    expect(document.querySelector('[data-testid="pay-box"]')?.textContent).toContain("Or pay when you collect.");
  });

  it("offers no Pay now while a proof still waits", async () => {
    payable({ pay_open: 0 });
    await mount(LINK);
    expect(document.querySelector('[data-testid="pay-box"]')).toBeNull();
  });

  it("asks for payment only once the delivery price is agreed, while the works prices it and while its quote waits", async () => {
    for (const state of [null, "sent"]) {
      payable({ pay_open: 0, delivery_to_quote: 1, delivery_quote_state: state, delivery_quote: state === null ? null : "32.80" });
      await mount(LINK);
      expect(document.querySelector('[data-testid="pay-quote-wait"]')?.textContent).toBe("We'll ask you to pay once the delivery price is agreed.");
      expect(document.querySelector('[data-testid="pay-now"]')).toBeNull();
      expect(document.querySelector('[data-testid="order-total"]')?.textContent).toContain("Delivery: we'll e-mail a quote");
      await act(async () => root?.unmount());
      root = null;
      host.remove();
      resetAfter(null);
      port.afterPort.linkOpen = false;
    }
  });

  it("shows the test band once, for someone rehearsing", async () => {
    port.afterPort.paying = { online: true, test: true };
    payable();
    await mount(LINK);
    const notes = document.querySelectorAll('[role="note"]');
    expect(notes).toHaveLength(1);
    expect(notes[0]!.textContent).toBe("Test mode — only you see this. No money moves. This order is sample data and goes when you remove sample data.");
  });

  it("asks Adminium for the pay link through the order's own session, keeps which order it was, and goes to pay", async () => {
    payable();
    await mount(LINK);
    await press('[data-testid="pay-now"]');
    expect(calls("startPay").map((c) => c.args)).toEqual([["link", 13]]);
    expect(left).toEqual(["/pay/tok_13"]);
    const kept = JSON.parse(sessionStorage.getItem(PAYING_KEY)!) as Record<string, unknown>;
    expect(kept).toMatchObject({ via: "link", orderId: "13", session: { token: "LINKSESSION" } });
    // Nothing of the link's own code is kept, and nothing rides the pay page's address.
    expect(JSON.stringify(kept)).not.toContain("LINKCODE");
  });

  it("says a payment that could not start, and keeps the works' own way", async () => {
    payable();
    await mount(LINK);
    port.afterPort.refuseNext({ code: "PUBLIC_PAY_REFUSED", status: 409 });
    await press('[data-testid="pay-now"]');
    expect(left).toEqual([]);
    expect(text()).toContain("The payment didn't finish. Nothing was taken.");
    expect(text()).toContain("Or pay by the invoice we send with your delivery.");
    await sweep("a payment that did not start");
  });
});

describe("the website's demo", () => {
  it("pays by its stand-in: the hand-off a moment, then paid, with no page left and no money moving", async () => {
    port.afterPort.paying = { online: true, test: false, standIn: true };
    payable();
    const start = port.afterPort.startPay!.bind(port.afterPort);
    port.afterPort.startPay = async (via, id) => {
      const answer = await start(via, id);
      Object.assign(port.afterPort.rows.orders[0]!, { due: "0", paid_in: "104.69", paid: "104.69", paid_online: "104.69", last_paid_at: "2026-08-05T09:42:00Z" });
      return answer;
    };
    await mount(LINK);
    expect(document.querySelector('[data-testid="pay-box"]')?.textContent).toContain("Demo: no money moves.");
    await act(async () => document.querySelector<HTMLElement>('[data-testid="pay-now"]')!.click());
    expect(document.querySelector('[data-testid="pay-now"]')?.textContent).toBe("Taking you to the secure payment page…");
    await settle(4);
    expect(left).toEqual([]);
    expect(document.querySelector('[data-testid="pay-paid"]')?.textContent).toContain("Paid £104.69 online on Wednesday 5 August 2026.");
    expect(sessionStorage.getItem(PAYING_KEY)).toBeNull();
  });
});

describe("back from the pay page", () => {
  beforeEach(() => {
    port.afterPort.paying = { online: true, test: false };
    sessionStorage.setItem(PAYING_KEY, JSON.stringify({ via: "link", orderId: "13", session: { token: "LINKSESSION", expiresAt: Date.parse("2027-01-01") }, at: Date.now() }));
  });

  it("opens the order by the session it kept, and says it is paid", async () => {
    payable({ due: "0", paid_in: "104.69", paid: "104.69", paid_online: "104.69", last_paid_at: "2026-08-05T09:42:00Z" });
    await mount("/order");
    await settle(4);
    expect(calls("resumeSession").map((c) => c.args)).toEqual([["link", "LINKSESSION"]]);
    expect(document.querySelector('[data-testid="pay-paid"]')?.textContent).toBe("Paid £104.69 online on Wednesday 5 August 2026. We'll print and let you know when it's ready.");
    expect(document.querySelector('[data-testid="order-total"]')?.textContent).toContain("Paid");
    expect(document.querySelector('[data-testid="pay-now"]')).toBeNull();
    // The way back is taken once: a reload opens nothing by it.
    expect(sessionStorage.getItem(PAYING_KEY)).toBeNull();
    await sweep("back, paid");
  });

  it("checks, then shows the order as it stands when nothing has come in", async () => {
    payable();
    await mount("/order");
    expect(document.querySelector('[data-testid="pay-checking"]')?.textContent).toBe("Checking your payment…");
    await settle(12);
    expect(document.querySelector('[data-testid="pay-checking"]')).toBeNull();
    expect(document.querySelector('[data-testid="pay-now"]')).not.toBeNull();
    expect(calls("startPay")).toEqual([]);
  });

  it("in Arabic, right to left, with nothing left in English", async () => {
    payable({ due: "0", paid_in: "104.69", paid: "104.69", paid_online: "104.69", last_paid_at: "2026-08-05T09:42:00Z" });
    await mount("/order", "ar-EG");
    await settle(4);
    expect(document.documentElement.getAttribute("dir")).toBe("rtl");
    expect(document.querySelector('[data-testid="pay-paid"]')?.textContent).toContain("عبر الإنترنت");
    await sweep("ar-EG · back, paid");
  });
});
