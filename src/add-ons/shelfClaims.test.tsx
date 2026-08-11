/**
 * WHAT THE ADD-ONS SHELF CLAIMS ABOUT A COMPANY, RENDERED (24 AC6).
 *
 * @vitest-environment jsdom
 *
 * ── THE DEFECT THIS EXISTS TO CLOSE, AND WHY ONLY A RENDER FINDS IT ─────────
 *
 * [Added 2026-08-11, wave 4b round 6. The maker's bench has carried the twin of
 * this file since round 4; this shop is the LIVE one and had nothing.]
 *
 * `screens/Extras.tsx` printed "Adminium is not affiliated with this company."
 * exactly ONCE, at the bottom of the whole shelf, under both lists and on no
 * card at all. Seven entries are on that screen; two of them name a real
 * company and five name none. So the sentence disclaimed a relationship on
 * behalf of five cards that have nothing to disclaim, and the two cards that
 * print a company's name, its monogram and its category said nothing.
 *
 * WHAT MADE IT SURVIVE FOUR ROUNDS is the shape this wave keeps finding: a
 * page-wide grep for "affiliat" over the rendered shelf came back GREEN. The
 * criterion was satisfied by an arrangement no reader reads — filter the shelf
 * to `delivery` and the carrier's card is alone on the page with the footnote
 * three sections below it, after an empty Connected state.
 *
 * So EVERY ASSERTION HERE IS SCOPED TO ONE CARD. A page-wide `toContain` is
 * satisfied by exactly the arrangement that was broken, which makes it worse
 * than no assertion: it reports coverage for the defect.
 *
 * The last case is the general one — the source sweep. A rule about "every
 * surface that names a company" cannot be held by naming the surfaces, because
 * the failure mode is a surface nobody thought of.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { Overlays } from "../components/Overlays.tsx";
import { I18nProvider } from "../i18n/index.tsx";
import { MESSAGES } from "../i18n/messages/index.ts";
import { AddOns } from "../screens/Extras.tsx";
import { useStore } from "../state/store.ts";
import { demoAddOns } from "./registry.ts";

const CARRIER = "shipping-dhl"; // `namesCompany: true`
const IMPORTER = "import-canva"; // `namesCompany: true`
const ARTWORK = "design-studio"; // `namesCompany: false`, with its own sentence

/** The one sentence the host owns, and the only one it may print about this. */
const DISCLAIMER = "Adminium is not affiliated with this company.";

let host: HTMLElement;
let root: Root;

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.setItem("print-shop-locale", "en-US");
  window.scrollTo = () => {};
});

/**
 * One add-on's card or row, found by the name the shelf prints on it.
 *
 * Scoped to `.mp-addon-card` / `.mp-addon-row` — the two shapes an entry takes,
 * available and connected — so nothing here can be satisfied by a sentence
 * somewhere else on the page.
 */
function card(name: string): HTMLElement {
  const entries = [...host.querySelectorAll(".mp-addon-card, .mp-addon-row")];
  const found = entries.find((node) => (node.textContent ?? "").includes(name));
  if (found === undefined) {
    throw new Error(
      `no shelf entry naming "${name}". On screen: ${entries
        .map((n) => `"${(n.textContent ?? "").replace(/\s+/g, " ").slice(0, 40)}"`)
        .join(", ")}`,
    );
  }
  return found as HTMLElement;
}

const wordsOn = (name: string) => (card(name).textContent ?? "").replace(/\s+/g, " ");

function clickIn(scope: HTMLElement, label: string): void {
  const button = [...scope.querySelectorAll("button")].find(
    (b) => (b.textContent ?? "").trim() === label,
  );
  if (button === undefined) {
    throw new Error(
      `no button reading "${label}". On screen: ${[...scope.querySelectorAll("button")]
        .map((b) => `"${(b.textContent ?? "").trim()}"`)
        .join(", ")}`,
    );
  }
  act(() => {
    button.click();
  });
}

beforeEach(() => {
  useStore.getState().registerAddOns(demoAddOns());
  useStore.setState({
    enabled: new Set(),
    authorizedAddOns: new Set(),
    overlay: { kind: "none" },
    addOnCategory: "all",
  });
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root.render(
      <I18nProvider>
        <AddOns />
        <Overlays />
      </I18nProvider> as ReactNode,
    );
  });
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  host.remove();
});

describe("wherever a company is named, the card says what that is not (AC6)", () => {
  it("carries the disclaimer on the card of the add-on that names a carrier", () => {
    expect(wordsOn("DHL Shipping")).toContain(DISCLAIMER);
  });

  it("carries it on the other one too, which is the point of not naming surfaces", () => {
    expect(wordsOn("Canva Import")).toContain(DISCLAIMER);
  });

  it("keeps carrying it once the add-on is connected and the card becomes a row", () => {
    act(() => {
      useStore.getState().toggleAddOn(CARRIER);
    });
    // A connected entry is drawn as a ROW, by different code, in a different
    // section — which is exactly the kind of second surface a per-page footnote
    // hides. The row prints the same name and the same monogram.
    expect(wordsOn("DHL Shipping")).toContain(DISCLAIMER);
  });

  it("says the positive fact, in the add-on's own words, where none is named", () => {
    const on = wordsOn("Design Studio");
    expect(on, "the host disclaims a relationship this add-on does not have").not.toContain(
      DISCLAIMER,
    );
    // The add-on's own sentence, out of its own bundle — not a key, not a blank.
    expect(on.length).toBeGreaterThan(0);
    const addOn = useStore.getState().registry.all.find((a) => a.key === ARTWORK)!;
    expect(addOn.noCompanyKeys ?? []).not.toEqual([]);
  });

  /**
   * THE RULE OVER THE WHOLE SHELF, card by card. Every entry either names a
   * company and disclaims it, or says it names none — including the four
   * described-but-not-built ones, which are cards on this screen like any other.
   */
  it("leaves no card silent about who else is involved", () => {
    for (const addOn of useStore.getState().registry.all) {
      /*
       * The name the SHELF prints, which for the four described-but-not-built
       * entries is a translated `nameKey` rather than the English `name` on the
       * object. They happen to be equal in en-US; relying on that would make
       * this case pass for the wrong reason and fail in seven languages.
       */
      const name =
        addOn.nameKey === undefined ? addOn.name : (MESSAGES["en-US"][addOn.nameKey] ?? addOn.name);
      const on = wordsOn(name);
      if (addOn.namesCompany) {
        expect(on, `${addOn.key} names a company with no disclaimer on its card`).toContain(
          DISCLAIMER,
        );
      } else {
        expect(
          (addOn.noCompanyKeys ?? []).length,
          `${addOn.key} names no company and says nothing about it`,
        ).toBeGreaterThan(0);
        expect(
          on.replace(/\s+/g, " ").length,
          `${addOn.key} rendered no line at all where its own sentence should be`,
        ).toBeGreaterThan(name.length);
      }
    }
  });

  /**
   * ── AND IT IS NOT A FOOTNOTE ANY MORE ──────────────────────────────────────
   *
   * The case that would have failed before the repair AND would fail again if
   * somebody restored the page-wide line: the sentence appears once per card
   * that needs it, and the shelf as a whole holds no copy of it that belongs to
   * no card.
   */
  it("prints it once per card that needs it, and nowhere loose on the page", () => {
    const namesACompany = useStore
      .getState()
      .registry.all.filter((addOn) => addOn.namesCompany).length;
    expect(namesACompany, "no add-on on this shelf names a company at all").toBeGreaterThan(0);

    const onThePage = (host.textContent ?? "").split(DISCLAIMER).length - 1;
    const onCards = [...host.querySelectorAll(".mp-addon-card, .mp-addon-row")].filter((node) =>
      (node.textContent ?? "").includes(DISCLAIMER),
    ).length;
    expect(onCards).toBe(namesACompany);
    expect(
      onThePage,
      "the shelf prints the disclaimer somewhere that is not a card — a footnote " +
        "under everything is what this file exists to prevent",
    ).toBe(onCards);
  });

  /**
   * THE DIALOGS TOO. A reader who opens Connect straight from the dock never saw
   * the shelf, and each dialog puts the company's name in its own title bar.
   */
  it("carries it in the connect dialog", () => {
    clickIn(card("DHL Shipping"), "Connect");
    const modal = host.querySelector(".mp-modal")!;
    expect((modal.textContent ?? "").replace(/\s+/g, " ")).toContain(DISCLAIMER);
  });

  it("carries it in the consent panel the OAuth add-on opens", () => {
    act(() => {
      useStore.getState().openOverlay({ kind: "consent", addOn: IMPORTER });
    });
    const modal = host.querySelector(".mp-modal")!;
    expect((modal.textContent ?? "").replace(/\s+/g, " ")).toContain(DISCLAIMER);
  });

  it("carries it in the manage drawer", () => {
    act(() => {
      useStore.getState().toggleAddOn(CARRIER);
      useStore.getState().openOverlay({ kind: "manage", addOn: CARRIER });
    });
    const drawer = host.querySelector(".mp-drawer-body")!;
    expect((drawer.textContent ?? "").replace(/\s+/g, " ")).toContain(DISCLAIMER);
  });

  it("carries it in the disconnect confirm, which is where it was missing", () => {
    act(() => {
      useStore.getState().toggleAddOn(CARRIER);
      useStore.getState().openOverlay({ kind: "disconnect", addOn: CARRIER });
    });
    const modal = host.querySelector(".mp-modal")!;
    expect((modal.textContent ?? "").replace(/\s+/g, " ")).toContain(DISCLAIMER);
  });
});

/**
 * ── THE RULE, OVER THE SOURCES, SO A SURFACE ADDED TOMORROW IS COVERED ──────
 *
 * Every case above names a surface, and a rule held by naming surfaces cannot
 * see the surface nobody thought of — which is precisely how the shelf card was
 * missed while three dialogs were right.
 *
 * So: any of this app's own components that RENDERS an add-on's name or its
 * monogram must also render `Affiliation`. Two files are exempt and both are
 * named, with the reason, rather than being quietly skipped.
 */
describe("no host surface names an add-on without the line", () => {
  const SRC = join(process.cwd(), "src");

  /**
   * The exemptions, each with its reason. An exemption list is where holes come
   * from, so this one is TWO entries long and each is a place a sentence cannot
   * physically go rather than a place somebody decided not to put one.
   */
  const EXEMPT: Readonly<Record<string, string>> = {
    "src/components/DemoDock.tsx":
      "the reviewer's control strip, not the shop's chrome: a row of toggle chips and " +
      "the transient toasts they raise. It is the one surface that is not part of the " +
      "product, and a paragraph inside a chip is not a surface either.",
    "src/components/Affiliation.tsx": "is the line",
  };

  function sources(dir: string): string[] {
    return readdirSync(dir).flatMap((entry) => {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        return entry === "vendor" ? [] : sources(full);
      }
      return full.endsWith(".tsx") && !full.includes(".test.") ? [full] : [];
    });
  }

  it("renders Affiliation wherever it renders an add-on's name or monogram", () => {
    const offenders: string[] = [];
    for (const file of sources(SRC)) {
      const rel = file.slice(process.cwd().length + 1);
      if (rel in EXEMPT) continue;
      const code = readFileSync(file, "utf8");
      const names = /addOn\.(name|shortName|monogram)\b/.test(code);
      if (!names) continue;
      if (!code.includes("Affiliation")) offenders.push(rel);
    }
    expect(
      offenders,
      "\nThese surfaces print an add-on's name or its monogram and carry nothing about " +
        "who else is involved (24 AC6). Mount `Affiliation`, or add the file to EXEMPT " +
        "with the reason it cannot:\n" +
        offenders.join("\n") +
        "\n",
    ).toEqual([]);
  });

  it("keeps the exemptions real", () => {
    // A file that no longer exists, or that no longer names an add-on, is an
    // exemption doing nothing but widening the rule.
    for (const [rel, why] of Object.entries(EXEMPT)) {
      const code = readFileSync(join(process.cwd(), rel), "utf8");
      expect(why.length, `${rel} is exempt with no reason given`).toBeGreaterThan(10);
      expect(
        /addOn\.(name|shortName|monogram)\b|Affiliation/.test(code),
        `${rel} is exempt from a rule it is not subject to`,
      ).toBe(true);
    }
  });
});
