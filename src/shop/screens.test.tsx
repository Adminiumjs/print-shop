// @vitest-environment jsdom
/**
 * THE CUSTOMER SIDE'S SCREENS, DRAWN, AND EACH STATE UNDER AXE.
 *
 * The whole customer side is mounted (its header, footer and toasts)
 * against a stand-in for Adminium, and walked as a customer walks it: the
 * products and their "from" prices, a product's page with its chips and its
 * quote (working, priced, a finish not offered, the 999 cap, a large-format
 * size out of bounds), the Customiser's ways in and its editor, sending
 * artwork (uploading, checked, a warning accepted, refused), the basket and
 * checkout (its errors, a refusal on its field, Checking…, a moved price)
 * and the confirmation. Every state is swept by axe in English and in
 * Arabic. No stylesheet is loaded, so axe reads names, roles, labels and
 * the ties between a field and its messages, never colour.
 *
 * Each write's body is held to its exact shape. The Customiser's editor and
 * ways in are the add-on's, swept by its own suite; here stand-ins take
 * their place and record what the shop hands them.
 */
import axe from "axe-core";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CustomiserEditorProps, WaysInProps } from "../../vendor/customiser/index.js";
import { I18nProvider } from "../i18n/index.tsx";
import ShopApp from "./ShopApp.tsx";
import { goView, openProduct, resetShop, useShop } from "./store.ts";
import { fakePort, type FakePort } from "./testing.ts";

const stand = vi.hoisted(() => ({ editor: null as CustomiserEditorProps | null, ways: null as WaysInProps | null }));
vi.mock("../../vendor/customiser/index.js", () => ({
  CustomiserEditor: (props: CustomiserEditorProps) => {
    stand.editor = props;
    return (
      <div className="stand-editor">
        <h2>The editor</h2>
        <button type="button" onClick={() => props.onAddToBasket({ id: 7, code: "DSGN-7Q2K-X4PA", base_id: 101, ready_design_id: 5, values: { parts: { name: { text: "Harbour Bakery" } } }, state: "draft", updatedAt: null, session: null, files: {}, used: ["print-back"] })}>
          {props.addLabel ?? "Add to basket"}
        </button>
      </div>
    );
  },
  WaysIn: (props: WaysInProps) => {
    stand.ways = props;
    return (
      <div className="stand-ways" role="group" aria-label="How would you like to make it?">
        <button type="button" onClick={props.onChoose}>
          Choose a design
        </button>
        <button type="button" onClick={props.onStartBlank}>
          Start from blank
        </button>
        <button type="button" onClick={props.onSendOwnFile}>
          Send your own file
        </button>
      </div>
    );
  },
  designRefusal: () => null,
  heldDesign: () => null,
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

async function mount(locale: "en-US" | "ar-EG" = "en-US"): Promise<void> {
  localStorage.setItem("print-shop-locale", locale);
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
  const el = document.querySelector<HTMLInputElement>(selector)!;
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value")!.set!;
  await act(async () => {
    setter.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await settle(1);
};
const text = () => document.body.textContent ?? "";
const button = (label: string): HTMLButtonElement => {
  const found = [...document.querySelectorAll<HTMLButtonElement>("button")].find((b) => (b.textContent ?? "").trim() === label || b.getAttribute("aria-label") === label);
  if (found === undefined) throw new Error(`no button "${label}"`);
  return found;
};
const press = async (target: string | HTMLElement): Promise<void> => {
  const el = typeof target === "string" ? document.querySelector<HTMLElement>(target)! : target;
  await act(async () => el.click());
  await settle();
};

/** Every axe violation that matters, named. */
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

/** A small PDF the checks can read: its page box in points, its pages, its colour and fonts. */
function pdf(name: string, { w, h, pages, rgb = false, fonts = true }: { w: number; h: number; pages: number; rgb?: boolean; fonts?: boolean }): File {
  const pt = (mm: number) => ((mm * 72) / 25.4).toFixed(2);
  const page = `<< /Type /Page /MediaBox [0 0 ${pt(w)} ${pt(h)}] >>\n`;
  const body = `%PDF-1.4\n${page.repeat(pages)}/ColorSpace /${rgb ? "DeviceRGB" : "DeviceCMYK"}\n${fonts ? "<< /Type /Font /FontFile2 3 0 R >>\n" : ""}%%EOF\n`;
  return new File([body], name, { type: "application/pdf" });
}

async function drop(files: File[]): Promise<void> {
  const input = document.querySelector<HTMLInputElement>("#mp-art-input")!;
  Object.defineProperty(input, "files", { value: files, configurable: true });
  await act(async () => input.dispatchEvent(new Event("change", { bubbles: true })));
  await settle();
}

beforeEach(() => {
  vi.useFakeTimers();
  sessionStorage.clear();
  localStorage.clear();
  window.history.replaceState(null, "", "/");
  window.scrollTo = () => {};
  port = fakePort();
  resetShop(port);
  stand.editor = null;
  stand.ways = null;
});
afterEach(async () => {
  await act(async () => root?.unmount());
  root = null;
  host?.remove();
  vi.useRealTimers();
});

const quotes = () => port.calls.filter((c) => c.call === "quote");

describe("the bodies the pages send", () => {
  it("prices every product's 'from' in one dry run, one job a product, collected", async () => {
    await mount();
    const from = quotes();
    expect(from).toHaveLength(1);
    expect(from[0]!.body).toEqual({
      values: { delivery_method: "collect", language: "en-US" },
      children: {
        jobs: [
          // Business cards on their cheapest stock, one side, nothing finished, at the "from" quantity.
          { values: { product_id: 1, qty: 100, material_option_id: 11, sides_option_id: 13, size_option_id: 12, packaging_id: 1, proof_by_post: false, express: false } },
          { values: { product_id: 2, qty: 100, material_option_id: 30, sides_option_id: 32, size_option_id: 31, packaging_id: 1, proof_by_post: false, express: false } },
          { values: { product_id: 3, qty: 1, material_option_id: 40, sides_option_id: 41, width_mm: 1200, height_mm: 2000, edges_option_id: 42, proof_by_post: false, express: false } },
        ],
      },
    });
  });

  it("prices a product's page as one dry run holding a job for each break, and the job as its own order, once a burst settles", async () => {
    await mount();
    port.calls.length = 0;
    await act(async () => openProduct("business-cards"));
    // Three quick changes: one question each once they settle, not three.
    await act(async () => button("Lamination, both sides").click());
    await act(async () => button("Matt").click());
    await act(async () => document.querySelectorAll<HTMLButtonElement>(".mp-toggle")[1]!.click());
    await settle();
    const asked = quotes();
    expect(asked).toHaveLength(2);
    const job = { product_id: 1, material_option_id: 10, sides_option_id: 14, size_option_id: 12, lamination_option_id: 16, look: "matt", packaging_id: 1, proof_by_post: false, express: true };
    const chips = asked.find((c) => c.body!.children.jobs.length > 1)!;
    expect(chips.body).toEqual({ values: { delivery_method: "collect", language: "en-US" }, children: { jobs: [25, 50, 100, 250, 500, 1000].map((qty) => ({ values: { ...job, qty } })) } });
    const panel = asked.find((c) => c.body!.children.jobs.length === 1)!;
    expect(panel.body).toEqual({ values: { delivery_method: "deliver", language: "en-US" }, children: { jobs: [{ values: { ...job, qty: 100 } }] } });
    // The quantity alone moves only the panel's question.
    port.calls.length = 0;
    await act(async () => document.querySelectorAll<HTMLButtonElement>(".mp-choice--qty")[4]!.click());
    await settle();
    expect(quotes().map((c) => c.body!.children.jobs.map((j) => j.values.qty))).toEqual([[500]]);
  });
});

describe.each(["en-US", "ar-EG"] as const)("the customer side in %s", (locale) => {
  const english = locale === "en-US";

  it("the products, priced from, and while they are being priced", async () => {
    const release = port.hold();
    await mount(locale);
    expect(document.querySelectorAll(".mp-tile")).toHaveLength(3);
    expect(document.querySelectorAll(".mp-from .mp-skel")).toHaveLength(3);
    await sweep(`${locale} · products, pricing`);
    release();
    await settle();
    if (english) {
      expect(text()).toContain("Business cards");
      expect(text()).toContain("£26.50");
      expect(text()).toContain("for 100");
    }
    await sweep(`${locale} · products`);
  });

  it("a product's page: working, priced, a finish not offered, and the 999 cap", async () => {
    await mount(locale);
    const release = port.hold();
    await press(document.querySelectorAll<HTMLButtonElement>(".mp-tile")[0]!);
    expect(window.location.pathname).toBe("/product/business-cards");
    expect(document.querySelector(".mp-pricing")).not.toBeNull();
    await sweep(`${locale} · configure, working out the price`);
    release();
    await settle();
    expect(document.querySelector(".mp-pricing")).toBeNull();
    if (english) {
      expect(text()).toContain("Your quote");
      expect(text()).toContain("Setup");
      expect(text()).toContain("Delivery — Up to 2kg");
      expect(text()).toContain("Tax (20%)");
      expect(text()).toContain("Ready Monday 10 August 2026");
    }
    await sweep(`${locale} · configure, priced`);

    // Spot UV needs a lamination: locked, its reason one press away.
    const spot = document.querySelector<HTMLButtonElement>('.mp-choice--off[title^="Spot UV"]')!;
    expect(spot.getAttribute("aria-disabled")).toBe("true");
    await press(spot);
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain("Spot UV needs a laminated surface");
    await sweep(`${locale} · configure, why a finish is not offered`);
    await act(async () => document.querySelector<HTMLButtonElement>('[role="dialog"] button')!.click());

    // A lamination on, then an uncoated stock: it comes off, and says so.
    await press(document.querySelectorAll<HTMLButtonElement>('.mp-step:nth-of-type(4) .mp-choice')[2]!);
    expect(useShop.getState().choice?.laminationId).toBe(16);
    expect(document.querySelector('[role="radiogroup"]')).not.toBeNull();
    await press(document.querySelectorAll<HTMLButtonElement>(".mp-choice--tile")[1]!);
    expect(useShop.getState().choice?.laminationId).toBeNull();
    if (english) expect(text()).toContain("Lamination isn't offered on 300gsm uncoated board");
    await sweep(`${locale} · configure, the lamination taken off`);

    await type(".mp-input--num", "999");
    expect(document.querySelector(".mp-say--pos")).not.toBeNull();
    if (english) expect(text()).toContain("1,000 costs the same — get 1,000?");
    await sweep(`${locale} · configure, 999 capped`);
    await press(document.querySelector<HTMLButtonElement>(".mp-say--pos .mp-link")!);
    expect(useShop.getState().choice?.qty).toBe(1000);
  });

  it("a large-format job: its size out of bounds, put right", async () => {
    await mount(locale);
    await act(async () => openProduct("pvc-banners"));
    await settle();
    const width = document.querySelectorAll<HTMLInputElement>(".mp-input--mm")[0]!;
    await type(".mp-input--mm", "1600");
    expect(width.getAttribute("aria-invalid")).toBe("true");
    expect(document.querySelector("#mp-size-width")).not.toBeNull();
    expect(document.querySelector(".mp-quote-blocked")).not.toBeNull();
    await sweep(`${locale} · configure, too wide for the roll`);
    await press(".mp-fix-button");
    expect(useShop.getState().choice?.width).toBe(1370);
    await sweep(`${locale} · configure, large format`);
  });

  it("the Customiser's ways in: a design, put in the basket, priced with the feature it uses", async () => {
    await mount(locale);
    await act(async () => openProduct("business-cards"));
    await settle();
    expect(stand.ways?.base).toBe(101);
    await sweep(`${locale} · configure, the ways in`);
    await press(button("Choose a design"));
    expect(window.location.pathname).toBe("/product/business-cards/design");
    expect(stand.editor?.base).toBe(101);
    expect(stand.editor?.look).toBe("print");
    expect(stand.editor?.sides).toBe(2);
    expect(stand.editor?.start).toBeUndefined();
    port.calls.length = 0;
    await act(async () => stand.editor!.onDesignChange?.({ design: { base_id: 101, ready_design_id: 5, values: { parts: {} } }, used: ["print-back"], ok: true }));
    await settle();
    expect(quotes().find((c) => c.body!.children.jobs.length === 1)!.body!.children.jobs[0]!.children).toEqual({ job_features: [{ values: { option_id: 20 } }] });
    if (english) expect(stand.editor?.price?.total).toMatch(/^£/);
    await sweep(`${locale} · the editor`);
    await press(".stand-editor button");
    expect(window.location.pathname).toBe("/basket");
    const line = useShop.getState().basket[0]!;
    expect([line.design?.code, line.features]).toEqual(["DSGN-7Q2K-X4PA", [20]]);
    const basket = quotes().at(-1)!.body!;
    expect(basket.children.jobs[0]).toMatchObject({ values: { design_code: "DSGN-7Q2K-X4PA" }, children: { job_features: [{ values: { option_id: 20 } }] } });
    await sweep(`${locale} · basket, a designed job`);
    // Start from blank opens the editor on a blank page.
    await act(async () => openProduct("business-cards", "blank"));
    await settle();
    expect(stand.editor?.start).toBe("blank");
  });

  it("sending artwork: uploading, checked, a warning accepted, and the two refusals", async () => {
    await mount(locale);
    await act(async () => openProduct("business-cards"));
    await settle();
    await press(button("Send your own file"));
    expect(window.location.pathname).toBe("/artwork");
    await sweep(`${locale} · artwork, before a file`);

    const release = port.holdUploads();
    await drop([pdf("harbour-front.pdf", { w: 91, h: 61, pages: 2 }), pdf("harbour-back.pdf", { w: 85, h: 55, pages: 2, rgb: true }), new File(["x"], "menu-draft.docx")]);
    expect(document.querySelectorAll('[role="progressbar"]')).toHaveLength(2);
    expect(document.querySelector('.mp-button--wide[aria-disabled="true"]')).not.toBeNull();
    if (english) expect(text()).toContain("That isn't a PDF, TIFF or JPEG");
    await sweep(`${locale} · artwork, uploading, one refused`);
    release();
    await settle();
    expect(port.calls.filter((c) => c.call === "upload").map((c) => c.name)).toEqual(["harbour-front.pdf", "harbour-back.pdf"]);
    if (english) {
      expect(text()).toContain("Bleed 3mm on all four edges (91×61mm page).");
      expect(text()).toContain("exactly the trim, so there's no bleed");
      expect(text()).toContain("RGB, not CMYK");
    }
    expect(document.querySelector(".mp-accept")).not.toBeNull();
    await sweep(`${locale} · artwork, checked, a warning to accept`);
    await press(".mp-accept");
    expect(document.querySelector(".mp-accepted")).not.toBeNull();
    await press(".mp-file--refused .mp-button--small");
    expect(document.querySelector('.mp-button--wide[aria-disabled="true"]')).toBeNull();
    await sweep(`${locale} · artwork, ready`);

    port.refuseUpload("too-big");
    await drop([pdf("poster.pdf", { w: 91, h: 61, pages: 2 })]);
    if (english) expect(text()).toContain("That file is over 100 MB");
    await press(".mp-file--refused .mp-button--small");
    await press(".mp-button--wide");
    expect(window.location.pathname).toBe("/basket");
    const files = useShop.getState().basket[0]!.artwork;
    expect(files.map((f) => [f.name, f.accepted])).toEqual([
      ["harbour-front.pdf", false],
      ["harbour-back.pdf", true],
    ]);
    if (english) expect(text()).toContain("harbour-back.pdf (warning accepted)");
    await sweep(`${locale} · basket, a job with its files`);
  });

  it("the checkout: its errors, a refusal on its field, Checking…, a moved price, and the confirmation", async () => {
    await mount(locale);
    await act(async () => openProduct("letterheads"));
    await settle();
    await press(".mp-quote-cta");
    await drop([pdf("heading.pdf", { w: 216, h: 303, pages: 1 })]);
    await press(".mp-button--wide");
    expect(window.location.pathname).toBe("/basket");
    if (english) {
      expect(text()).toContain("Delivery");
      expect(text()).toContain("Up to 2kg · about 0.3 kg for the whole order");
    }
    await sweep(`${locale} · basket and checkout`);

    await press(".mp-summary .mp-button--wide");
    expect(document.querySelectorAll('[aria-invalid="true"]')).toHaveLength(5);
    expect(document.activeElement?.id).toBe("mp-d-name");
    await sweep(`${locale} · checkout, the form's errors`);

    await type("#mp-d-name", "Harbour Bakery");
    await type("#mp-d-email", "hello@harbourbakery.example");
    await type("#mp-d-line1", "12 Quay Street");
    await type("#mp-d-town", "Marlow");
    await type("#mp-d-postcode", "SL7 1BT");
    await act(async () => document.querySelector<HTMLInputElement>('.mp-consent input')!.click());
    port.refuseNext({ code: "PUBLIC_WRITE_REFUSED", column: "postcode", reason: "plain-text" });
    await press(".mp-summary .mp-button--wide");
    expect(document.querySelector("#mp-d-postcode")!.getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement?.id).toBe("mp-d-postcode");
    await sweep(`${locale} · checkout, refused on its field`);

    await type("#mp-d-postcode", "SL7 1BU");
    const release = port.hold();
    await act(async () => document.querySelector<HTMLButtonElement>(".mp-summary .mp-button--wide")!.click());
    await act(async () => {
      await Promise.resolve();
    });
    expect(document.querySelector('.mp-summary [aria-busy="true"]')).not.toBeNull();
    if (english) expect(text()).toContain("Checking…");
    await sweep(`${locale} · checkout, checking`);
    port.raise(0.01);
    release();
    await settle();
    expect(document.querySelector(".mp-alert")).not.toBeNull();
    expect(document.querySelector(".mp-line-price s")).not.toBeNull();
    expect(port.calls.some((c) => c.call === "place")).toBe(false);
    await sweep(`${locale} · checkout, the price moved`);

    await press(".mp-summary .mp-button--wide");
    const placed = port.calls.find((c) => c.call === "place")!;
    const total = useShop.getState().confirmed?.order["total"];
    expect(placed.expect).toBe(total);
    expect(placed.clientKey).toMatch(/.{16,}/);
    expect(placed.body).toEqual({
      values: { name: "Harbour Bakery", email: "hello@harbourbakery.example", address_line1: "12 Quay Street", town: "Marlow", postcode: "SL7 1BU", may_email: true, delivery_method: "deliver", language: locale },
      children: {
        jobs: [
          {
            values: { product_id: 2, qty: 100, material_option_id: 30, sides_option_id: 32, size_option_id: 31, packaging_id: 1, proof_by_post: false, express: false },
            children: {
              artwork: [
                {
                  values: {
                    name: "heading.pdf",
                    file: "UPLOAD00000000000000000000000001",
                    side: "front",
                    accepted: false,
                    checks: { language: locale, rows: expect.arrayContaining([expect.objectContaining({ check: "bleed", level: "pos" }), expect.objectContaining({ check: "pages", level: "pos" })]) },
                  },
                },
              ],
            },
          },
        ],
      },
    });
    expect(window.location.pathname).toBe("/confirmed");
    expect(text()).toContain("MP-4127");
    if (english) {
      expect(text()).toContain("That's booked in.");
      expect(text()).toContain("Monday 10 August 2026");
    }
    await sweep(`${locale} · confirmation`);
    await press(".mp-confirmed-actions .mp-button--accent");
    expect(window.location.pathname).toBe("/order");
    expect(window.location.hash).toBe("#LINKCODE0000000A");
  });

  it("an empty basket, collection, a failed shop and a page that isn't here", async () => {
    await mount(locale);
    await act(async () => goView("basket"));
    await settle();
    expect(document.querySelector(".mp-empty")).not.toBeNull();
    await sweep(`${locale} · basket, empty`);
    await act(async () => goView("missing"));
    await settle();
    await sweep(`${locale} · not here`);
    await act(async () => useShop.setState({ loading: "failed" }));
    await sweep(`${locale} · the shop failed to open`);
  });
});
