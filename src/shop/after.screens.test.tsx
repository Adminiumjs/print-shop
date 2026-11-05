// @vitest-environment jsdom
/**
 * THE CUSTOMER SIDE AFTER THE ORDER, DRAWN, AND EACH STATE UNDER AXE.
 *
 * The whole customer side is mounted against a stand-in for Adminium and
 * walked as a customer walks it after ordering: the lookup (a reference and
 * the e-mail, a wrong code, the right one), the order open (its stages, the
 * proof waiting, approved, a change asked), an order opened by its own link
 * (and a link that opens nothing), the works' delivery quote, Your proofs,
 * Order it again, Saved quotes (renamed, opened, put in the order), "Save
 * this quote" from a product's page, the sample pack (and a second one to
 * the same address), the templates, delivery and collection, find us, Your
 * designs and the sign-in link's page. Every state is swept by axe in
 * English and in Arabic, and every write's body is held to its exact shape.
 */
import axe from "axe-core";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "../i18n/index.tsx";
import { resetAfter, useAfter } from "./after.ts";
import ShopApp from "./ShopApp.tsx";
import { goView, openProduct, resetShop, useShop } from "./store.ts";
import { fakePort, type FakePort } from "./testing.ts";

const stand = vi.hoisted(() => ({ codes: null as readonly string[] | null }));
vi.mock("../../vendor/customiser/index.js", () => ({
  CustomiserEditor: () => <div>The editor</div>,
  WaysIn: () => <div role="group" aria-label="How would you like to make it?" />,
  YourDesigns: (props: { codes?: readonly string[] }) => {
    stand.codes = props.codes ?? null;
    return (
      <div>
        <h1>Your designs</h1>
        <p>{(props.codes ?? []).join(", ")}</p>
      </div>
    );
  },
  designRefusal: () => null,
  heldDesign: () => null,
  hasSavedDesigns: () => false,
  readDesigns: async () => [],
  openSavedLink: async () => "unknown",
}));
vi.mock("../../vendor/customiser/editor.css", () => ({}));

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let port: FakePort;
let root: Root | null = null;
let host: HTMLDivElement;

async function settle(times = 4): Promise<void> {
  for (let i = 0; i < times; i += 1) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
  }
}

async function mount(locale: "en-US" | "ar-EG" = "en-US", path = "/"): Promise<void> {
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

const type = async (selector: string, value: string): Promise<void> => {
  const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
  if (el === null) throw new Error(`no field ${selector}`);
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value")!.set!;
  await act(async () => {
    setter.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await settle(1);
};
const text = () => document.body.textContent ?? "";
const press = async (target: string | HTMLElement): Promise<void> => {
  const el = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
  if (el === null) throw new Error(`nothing to press at ${String(target)}`);
  await act(async () => el.click());
  await settle();
};
const go = async (view: Parameters<typeof goView>[0]) => {
  await act(async () => goView(view));
  await settle();
};
const calls = (name: string) => port.afterPort.calls.filter((c) => c.call === name);

async function sweep(label: string): Promise<void> {
  vi.useRealTimers();
  const result = await axe.run(document.body, { runOnly: { type: "tag", values: TAGS }, rules: { "color-contrast": { enabled: false }, region: { enabled: false } } });
  vi.useFakeTimers();
  const bad = result.violations.filter((v) => v.impact === "critical" || v.impact === "serious" || v.impact === "moderate");
  expect(result.passes.length, `${label}: axe examined nothing`).toBeGreaterThan(0);
  expect(
    bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
    label,
  ).toEqual([]);
}

/** The lookup, as a customer fills it: a reference, the e-mail, the code from the e-mail. */
async function signIn(code = "123456"): Promise<void> {
  await type("#ma-lu-ref", "mp-4113");
  await type("#ma-lu-email", "hello@harbourbakery.example");
  await press(".ma-gate-send");
  for (let i = 0; i < 6; i += 1) await type(`#ma-code-${i}`, code[i]!);
  await press(".ma-code .mp-button--accent");
}

beforeEach(() => {
  vi.useFakeTimers();
  sessionStorage.clear();
  localStorage.clear();
  window.history.replaceState(null, "", "/");
  window.scrollTo = () => {};
  URL.createObjectURL = () => "blob:proof";
  URL.revokeObjectURL = () => {};
  port = fakePort();
  resetShop(port);
  resetAfter(null);
  stand.codes = null;
});
afterEach(async () => {
  await act(async () => root?.unmount());
  root = null;
  host?.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("the writes and reads the pages after an order send", () => {
  it("asks for a code for the address typed, opens the order the reference names, and answers its proof as the customer", async () => {
    await mount();
    await go("order");
    await type("#ma-lu-ref", "mp-4113");
    await type("#ma-lu-email", " Hello@HarbourBakery.example ");
    await press(".ma-gate-send");
    expect(calls("requestCode").map((c) => c.args)).toEqual([["hello@harbourbakery.example", "en-US"]]);
    for (let i = 0; i < 6; i += 1) await type(`#ma-code-${i}`, "123456"[i]!);
    await press(".ma-code .mp-button--accent");
    expect(calls("verifyCode").map((c) => c.args)).toEqual([["hello@harbourbakery.example", "123456"]]);
    expect(useAfter.getState().opened?.read?.order["number"]).toBe("MP-4113");

    // Approve waits until the proof is opened; then the customer's own write.
    const approve = document.querySelector<HTMLButtonElement>(".ma-approve")!;
    expect(approve.getAttribute("aria-disabled")).toBe("true");
    await press(approve);
    expect(calls("answerProof")).toEqual([]);
    await press(".ma-open-proof");
    expect(calls("proofFile").map((c) => c.args)).toEqual([["mine", "502"]]);
    await press(".ma-approve");
    expect(calls("answerProof").map((c) => c.args)).toEqual([["mine", "502", { state: "approved" }]]);
    expect(text()).toContain("The ready-by date is now Monday 10 August 2026.");
  });

  it("asks for a change only with the customer's words, and sends them as typed", async () => {
    await mount();
    await go("order");
    await signIn();
    await press(".ma-ask");
    expect(calls("answerProof")).toEqual([]);
    expect(document.activeElement?.id).toBe("ma-note-502");
    await type("#ma-note-502", "  The phone number should end 302.  ");
    await press(".ma-ask");
    expect(calls("answerProof").map((c) => c.args)).toEqual([["mine", "502", { state: "change_asked", change_note: "The phone number should end 302." }]]);
  });

  it("opens an order by its own link with no code, and answers the works' delivery quote through it", async () => {
    port.afterPort.rows.orders[0]!["delivery_quote_state"] = "sent";
    port.afterPort.rows.orders[0]!["delivery_quote"] = "48.00";
    await mount("en-US", "/order#LINKCODE0000000A");
    expect(calls("openShared").map((c) => c.args)).toEqual([["LINKCODE0000000A"]]);
    expect(window.location.hash).toBe("");
    expect(text()).toContain("Opened from the link in your order e-mails.");
    expect(text()).toContain("£48.00");
    await press([...document.querySelectorAll<HTMLButtonElement>(".ma-proof button")].find((b) => b.textContent === "Accept the quote")!);
    expect(calls("answerDelivery").map((c) => c.args)).toEqual([["link", 13, { delivery_quote_state: "accepted" }]]);
  });

  it("prices each past job on today's rate card as its own order, the way it went, and sets it up again", async () => {
    await mount();
    await go("reorder");
    await signIn();
    const priced = port.calls.filter((c) => c.call === "quote" && c.body!.children.jobs.length === 1 && c.body!.values["address_line1"] !== undefined);
    expect(priced[0]!.body).toEqual({
      values: { delivery_method: "deliver", language: "en-US", address_line1: "12 Quay Street", town: "Marlow", postcode: "SL7 1BT" },
      children: { jobs: [{ values: { product_id: 1, qty: 500, material_option_id: 10, size_option_id: 12, sides_option_id: 14, lamination_option_id: 16, look: "matt", packaging_id: 1, proof_by_post: false, express: false } }] },
    });
    await press(document.querySelectorAll<HTMLButtonElement>(".ma-again .mp-button--accent")[0]!);
    expect(window.location.pathname).toBe("/product/business-cards");
    expect(useShop.getState().choice).toMatchObject({ qty: 500, materialId: 10, sidesId: 14, laminationId: 16, look: "matt" });
  });

  it("saves a quote from a product's page: a dry run of it, then the one save held to its total, its link kept for the visit", async () => {
    await mount();
    await act(async () => openProduct("letterheads"));
    await settle();
    await press(".mp-quote-save");
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain("Save this quote");
    await press([...document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')].find((b) => b.textContent === "Save the quote")!);
    expect(port.calls.filter((c) => c.call === "saveQuote")).toEqual([]);
    expect(text()).toContain("Type the e-mail the link should go to.");
    await type('[role="dialog"] input', "hello@harbourbakery.example");
    await press([...document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')].find((b) => b.textContent === "Save the quote")!);
    const body = { values: { email: "hello@harbourbakery.example", language: "en-US", delivery_method: "deliver" }, children: { quote_lines: [{ values: { product_id: 2, qty: 100, material_option_id: 30, sides_option_id: 32, size_option_id: 31, packaging_id: 1, proof_by_post: false, express: false } }] } };
    expect(port.calls.filter((c) => c.call === "priceQuote").map((c) => c.quoteBody)).toEqual([body]);
    const saved = port.calls.filter((c) => c.call === "saveQuote");
    expect(saved.map((c) => [c.quoteBody, c.clientKey!.length > 8, c.expect])).toEqual([[body, true, expect.stringMatching(/^\d+\.\d\d$/)]]);
    expect(text()).toContain("Quote saved as MQ-2042");
    expect(useAfter.getState().held.map((h) => h.number)).toEqual(["MQ-2042"]);
  });

  it("leaves nothing of the customer's in the tab on Sign out: no order open, by sign-in or by link, and no quote held", async () => {
    await mount();
    // A quote saved on this visit, held for the tab.
    await act(async () => openProduct("letterheads"));
    await settle();
    await press(".mp-quote-save");
    await type('[role="dialog"] input', "hello@harbourbakery.example");
    await press([...document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')].find((b) => b.textContent === "Save the quote")!);
    expect(useAfter.getState().held.map((h) => h.number)).toEqual(["MQ-2042"]);
    expect(sessionStorage.getItem("printing.shop.quotes")).toContain("MQ-2042");
    // The order opened by signing in.
    await go("order");
    await signIn();
    expect(useAfter.getState().opened?.read?.order["number"]).toBe("MP-4113");
    await press(".ma-session .ma-small-link");
    expect(calls("signOut")).toHaveLength(1);
    expect(calls("closeShared")).toHaveLength(1);
    const after = useAfter.getState();
    expect([after.me, after.opened, after.link, after.held, after.heldRead, after.mine.orders]).toEqual([null, null, null, [], {}, []]);
    expect(sessionStorage.getItem("printing.shop.quotes")).toBeNull();
    expect(text()).not.toContain("MQ-2042");
    expect(text()).not.toContain("Harbour Bakery");
  });

  it("renames a quote through the session that reads it, prices it afresh, and puts it in the order", async () => {
    await mount();
    await go("quotes");
    await signIn("123456");
    expect(port.calls.filter((c) => c.call === "priceQuote").map((c) => c.quoteBody)).toEqual([
      { values: { delivery_method: "collect", email: "hello@harbourbakery.example", language: "en-US" }, children: { quote_lines: [{ values: { product_id: 1, qty: 500, material_option_id: 10, size_option_id: 12, sides_option_id: 14, lamination_option_id: 16, look: "matt", packaging_id: 1, proof_by_post: false, express: false } }] } },
    ]);
    await type("#ma-qname-41", "  Harbour cards, summer  ");
    await press(".ma-save-name");
    expect(calls("renameQuote").map((c) => c.args)).toEqual([["mine", "41", "Harbour cards, summer"]]);
    await press([...document.querySelectorAll<HTMLButtonElement>(".ma-quote button")].find((b) => b.textContent === "Add to order")!);
    expect(useShop.getState().basket.map((b) => [b.productId, b.choice.qty])).toEqual([[1, 500]]);
  });

  it("asks for a sample pack with the stocks as links, and says when the address has had one", async () => {
    await mount();
    await go("samples");
    await press(".ma-start");
    expect(calls("askSamples")).toEqual([]);
    expect(text()).toContain("Tick at least one stock to send.");
    await press(document.querySelectorAll<HTMLButtonElement>(".ma-stock")[0]!);
    await press(document.querySelectorAll<HTMLButtonElement>(".ma-stock")[3]!);
    await type("#ma-s-name", "Harbour Bakery");
    await type("#ma-s-email", "hello@harbourbakery.example");
    await type("#ma-s-line1", "12 Quay Street");
    await type("#ma-s-town", "Marlow");
    await type("#ma-s-postcode", "SL7 1BT");
    port.afterPort.refuseNext({ code: "PUBLIC_WRITE_REFUSED", column: "address_key", reason: "unique" });
    await press(".ma-start");
    const [sent] = calls("askSamples");
    expect(sent!.args[0]).toEqual({
      values: { name: "Harbour Bakery", email: "hello@harbourbakery.example", address_line1: "12 Quay Street", town: "Marlow", postcode: "SL7 1BT", language: "en-US", client_key: expect.any(String) },
      children: { sample_stocks: [{ values: { material_id: 1 } }, { values: { material_id: 4 } }] },
    });
    expect(text()).toContain("A pack has already gone to this address.");
    expect(document.activeElement?.id).toBe("ma-s-line1");
  });

  it("links each template file beside the shop's pages, and says when it went", async () => {
    await mount();
    await go("templates");
    const link = document.querySelector<HTMLAnchorElement>('[aria-label="Download the Business cards template"]')!;
    expect([link.getAttribute("href"), link.getAttribute("download")]).toEqual(["/templates/marlow-press-business-cards-template.pdf", "marlow-press-business-cards-template.pdf"]);
    link.addEventListener("click", (e) => e.preventDefault());
    await press(link);
    expect(text()).toContain("Downloaded");
    expect(text()).toContain("marlow-press-business-cards-template.pdf");
  });

  it("signs in from the e-mail's link only on Continue, and opens the order looked for", async () => {
    sessionStorage.setItem("printing.shop.lookedFor", "MP-4113");
    await mount("en-US", "/c#SIGNIN0000000000");
    expect(calls("peekSignInLink").map((c) => c.args)).toEqual([["SIGNIN0000000000"]]);
    expect(calls("openSignInLink")).toEqual([]);
    expect(text()).toContain("Hello, Harbour");
    await press([...document.querySelectorAll<HTMLButtonElement>("button")].find((b) => b.textContent === "Continue")!);
    expect(calls("openSignInLink").map((c) => c.args)).toEqual([["SIGNIN0000000000"]]);
    expect(window.location.pathname).toBe("/order");
    expect(useAfter.getState().opened?.read?.order["number"]).toBe("MP-4113");
  });
});

describe.each(["en-US", "ar-EG"] as const)("the pages after an order in %s", (locale) => {
  const english = locale === "en-US";

  it("the lookup: its errors, the code step, a wrong code, and the order open with its proof waiting", async () => {
    await mount(locale);
    await go("order");
    if (english) expect(text()).toContain("Every order has its own private link in its e-mails");
    await sweep(`${locale} · lookup`);
    await press(".ma-gate-send");
    expect(document.activeElement?.id).toBe("ma-lu-ref");
    if (english) expect(text()).toContain("Type the reference from your confirmation e-mail — it starts MP- or MQ-.");
    await sweep(`${locale} · lookup, its errors`);
    await type("#ma-lu-ref", "MP-4113");
    await type("#ma-lu-email", "hello@harbourbakery.example");
    await press(".ma-gate-send");
    if (english) expect(text()).toContain("We've e-mailed a 6-digit code to hello@harbourbakery.example.");
    await sweep(`${locale} · the code step`);
    for (let i = 0; i < 6; i += 1) await type(`#ma-code-${i}`, "000000"[i]!);
    await press(".ma-code .mp-button--accent");
    if (english) expect(text()).toContain("Wrong code — check the e-mail and try again.");
    await sweep(`${locale} · a wrong code`);
    for (let i = 0; i < 6; i += 1) await type(`#ma-code-${i}`, "123456"[i]!);
    await press(".ma-code .mp-button--accent");
    if (english) {
      expect(text()).toContain("Showing what belongs to Harbour Bakery");
      expect(text()).toContain("Ready by Friday 7 August 2026");
      expect(text()).toContain("A proof is waiting for you");
      expect(text()).toContain("harbour-front.pdf — RGB colours, we convert to CMYK");
      expect(text()).toContain("Delivery by courier — we'll e-mail you when it leaves the works.");
    }
    expect(document.querySelectorAll(".ma-stage--done")).toHaveLength(2);
    expect(document.querySelector(".ma-stage--current")?.textContent).toContain(english ? "Proof sent" : "");
    await sweep(`${locale} · the order, a proof waiting`);
    await press(".ma-ask");
    await sweep(`${locale} · the order, a change asked with no words`);
    await press(".ma-open-proof");
    await press(".ma-approve");
    if (english) expect(text()).toContain("Proof approved — it's on the schedule.");
    await sweep(`${locale} · the order, its proof approved`);
  });

  it("a link that opens nothing, an order by its link, and a change asked", async () => {
    await mount(locale, "/order#NOBODYSLINK00000");
    if (english) expect(text()).toContain("That link doesn't open an order.");
    await sweep(`${locale} · a link that opens nothing`);
    await act(async () => root?.unmount());
    host.remove();
    port.afterPort.rows.proofs[1]!["state"] = "change_asked";
    port.afterPort.rows.proofs[1]!["answered_at"] = "2026-08-04T15:00:00Z";
    port.afterPort.rows.orders[0]!["delivery_quote_state"] = "sent";
    port.afterPort.rows.orders[0]!["delivery_quote"] = "48.00";
    await mount(locale, "/order#LINKCODE0000000A");
    if (english) {
      expect(text()).toContain("We've got your change.");
      expect(text()).toContain("Your delivery quote");
    }
    await sweep(`${locale} · an order by its link, a change asked, a delivery quote`);
  });

  it("Your proofs, Order it again and Saved quotes, signed in", async () => {
    await mount(locale);
    await go("proofs");
    await sweep(`${locale} · Your proofs, the gate`);
    await signIn();
    if (english) {
      expect(text()).toContain("Waiting on your approval");
      expect(text()).toContain("Approved — on the schedule");
    }
    await sweep(`${locale} · Your proofs`);
    await go("reorder");
    if (english) expect(text()).toContain("re-priced on today's rate card, inc. tax");
    await sweep(`${locale} · Order it again`);
    await go("quotes");
    if (english) expect(text()).toContain("MQ-2041");
    await sweep(`${locale} · Saved quotes`);
    await type("#ma-qname-41", "Summer cards");
    await sweep(`${locale} · Saved quotes, a name being typed`);
    await go("savedDesign");
    expect(stand.codes).toEqual(["DSGN-7Q2K-X4PA"]);
    await sweep(`${locale} · Your designs`);
  });

  it("Saved quotes before signing in, the save sheet, and a quote by its link", async () => {
    await mount(locale);
    await go("quotes");
    await sweep(`${locale} · Saved quotes, the gate`);
    await act(async () => openProduct("letterheads"));
    await settle();
    await press(".mp-quote-save");
    await sweep(`${locale} · the save sheet`);
    await press([...document.querySelectorAll<HTMLButtonElement>('[role="dialog"] .mp-button--accent')][0]!);
    await sweep(`${locale} · the save sheet, its error`);
    await act(async () => root?.unmount());
    host.remove();
    await mount(locale, "/quote#QUOTECODE000000A");
    if (english) {
      expect(text()).toContain("These are the quotes you saved on this visit.");
      expect(text()).toContain("MQ-2041");
    }
    await sweep(`${locale} · a quote by its link`);
  });

  it("the sample pack, templates, delivery and collection, find us, and the sign-in link's page", async () => {
    await mount(locale);
    await go("samples");
    await sweep(`${locale} · sample pack`);
    await press(".ma-start");
    await sweep(`${locale} · sample pack, its errors`);
    await go("templates");
    if (english) {
      expect(text()).toContain("24 up on SRA3");
      expect(text()).toContain("150dpi at final size, minimum");
    }
    await sweep(`${locale} · templates`);
    await go("delivery");
    if (english) {
      expect(text()).toContain("in working days, Monday to Friday");
      expect(text()).toContain("The 14:00 cut-off.");
      expect(text()).toContain("Over 30 kg");
      expect(text()).toContain("Express is the next working day, at +35% on the work.");
    }
    await sweep(`${locale} · delivery and collection`);
    await go("findUs");
    if (english) expect(text()).toContain("3 Market Square");
    await sweep(`${locale} · find us`);
    await act(async () => root?.unmount());
    host.remove();
    await mount(locale, "/c#SIGNIN0000000000");
    await sweep(`${locale} · the sign-in link's page`);
  });
});
