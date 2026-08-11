/**
 * A SEEDED ADD-ON HISTORY IS TRUE OF THIS WORKS, OR IT IS NOT DRAWN.
 *
 * @vitest-environment jsdom
 *
 * ── WHAT THIS EXISTS TO STOP ────────────────────────────────────────────────
 *
 * [Ported from `maker-shop/src/add-ons/activity.test.tsx` 2026-08-11, round 6.
 * The studio has had it since round 4; this shop had the hook and the screen
 * and nothing asserting either.]
 *
 * An add-on used to AUTHOR its own history — absolute timestamps and order
 * references written into the bundle. The carrier is the same bundle both shops
 * host, so a line naming one shop's reference was drawn verbatim on the other's
 * shelf. `SeededActivityEntry` is RELATIVE now ("22 minutes ago, about your most
 * recent job") and `resolveActivity` turns that into a day, a time and one of
 * THIS works' own references, dropping any line whose reference this works has
 * not got.
 *
 * The property asserted here is the one the mechanism exists for — the date and
 * the reference on screen are this shop's — rather than the presence of a call.
 * A guard on a mechanism nothing renders is a guard on nothing, which is exactly
 * what the studio found when it went looking: the function was exported, mirrored
 * and asserted, and had no consumer in `src/` at all.
 */

import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { JOBS } from "../data/demo.ts";
import { I18nProvider } from "../i18n/index.tsx";
import { MESSAGES } from "../i18n/messages/index.ts";
import { AddOns } from "../screens/Extras.tsx";
import { useStore } from "../state/store.ts";
import { resolveActivity } from "./host.ts";
import { demoAddOns } from "./registry.ts";
import { activityRefs } from "./useActivityContext.ts";

const CARRIER = "shipping-dhl";

let host: HTMLElement;
let root: Root;

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.setItem("print-shop-locale", "en-US");
  window.scrollTo = () => {};
});

const words = () => (host.textContent ?? "").replace(/\s+/g, " ");

beforeEach(() => {
  useStore.getState().registerAddOns(demoAddOns());
  useStore.setState({
    enabled: new Set(),
    authorizedAddOns: new Set(),
    overlay: { kind: "none" },
    addOnCategory: "all",
    dayOffset: 0,
  });
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => {
    root.render(
      <I18nProvider>
        <AddOns />
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

describe("what a connected add-on last did, on this works' shelf", () => {
  it("draws a resolved line rather than nothing at all", () => {
    // Nothing connected: there is no connected row at all, so no add-on has a
    // history to show. This is the state a reviewer opens.
    expect(host.querySelector(".mp-addon-row")).toBeNull();

    act(() => {
      useStore.getState().toggleAddOn(CARRIER);
    });

    /*
     * The seam's second half, on the page. `neverUsed` is the honest thing to
     * print when every seeded line named somebody else's paperwork — so a shelf
     * showing THAT for an add-on whose lines all resolve is the defect, not the
     * empty state.
     */
    const row = (host.querySelector(".mp-addon-row")?.textContent ?? "").replace(/\s+/g, " ");
    expect(row, "no seeded add-on history is rendered anywhere").toContain(
      MESSAGES["en-US"]["shop.addons.lastUsed"]!.replace(/\{when\}.*$/, "").trim(),
    );
    expect(row).not.toContain(MESSAGES["en-US"]["shop.addons.neverUsed"]);
  });

  it("dates it against this works' own clock, on this works' own day", () => {
    act(() => {
      useStore.getState().toggleAddOn(CARRIER);
    });

    const state = useStore.getState();
    const addOn = state.registry.all.find((a) => a.key === CARRIER)!;
    const resolved = resolveActivity(addOn.activity, {
      now: { iso: state.todayIso(), hour: state.now.hour, minute: state.now.minute },
      refs: activityRefs(state.jobs),
    });
    expect(resolved.length, "every seeded line was dropped").toBeGreaterThan(0);

    const newest = resolved[0]!;
    expect(newest.iso).toBe(state.todayIso());
    expect(words()).toContain(
      `${String(newest.hour).padStart(2, "0")}:${String(newest.minute).padStart(2, "0")}`,
    );
    // And the reference it names is one of this works' own jobs.
    expect(JOBS.map((job) => job.ref)).toContain(newest.ref);
  });

  it("names no other shop's paperwork anywhere on the page", () => {
    act(() => {
      for (const key of ["design-studio", CARRIER, "import-canva"]) {
        useStore.getState().toggleAddOn(key);
      }
    });
    /*
     * The shape of the original defect, checked on the rendered page rather
     * than in a bundle: the maker studio's references are `BR-` and four
     * digits, and this works' are `MP-`. One of these belongs here.
     */
    expect(words()).not.toMatch(/\bBR-\d{3,}\b/);
  });

  it("advances with this works' own day", () => {
    act(() => {
      useStore.getState().toggleAddOn(CARRIER);
    });
    const before = words();

    act(() => {
      useStore.getState().advanceDay();
    });

    /*
     * A seeded line dated against the PIN while the board says tomorrow is the
     * same untruth this mechanism exists to stop, with the two shops being one
     * shop on two different days. The context reads `todayIso()`, not the pin.
     */
    expect(words(), "the shelf's dated line did not move with the shop's day").not.toBe(before);
  });
});
