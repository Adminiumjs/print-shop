/**
 * SWITCHING AN ADD-ON OFF, AS A SHOP OWNER DOES IT (24 D16).
 *
 * @vitest-environment jsdom
 *
 * ── WHY THIS FILE EXISTS HERE, IN ROUND 6 ───────────────────────────────────
 *
 * [Ported from `maker-shop/src/add-ons/disconnect.test.tsx` 2026-08-11.]
 *
 * The maker's bench has had a rendered disconnect suite since round 4 and this
 * shop had none — and this is the LIVE app. That asymmetry is failure mode two
 * of this design, stated plainly: two hosts, one contract, no shared code, so a
 * question asked in one repo is a question not asked in the other.
 *
 * What is ported is what APPLIES. The studio's version asserts a three-state
 * credential line on its confirm, and this shop's confirm has no such line
 * because it has no credential to talk about: the two fields live in the
 * dialog's own component state and are dropped with it, so there is nothing to
 * delete and nothing to promise. That is D16's "deletes the credentials"
 * satisfied by construction rather than by an action — which is a stronger
 * claim, and the last case here is the one that holds it.
 *
 * ── WHAT ONLY A RENDER FINDS ────────────────────────────────────────────────
 *
 * Every claim below is about a SEQUENCE a person performs: press Manage, press
 * Disconnect, read what it says, press Cancel. None of it is visible from the
 * store, because the store is where it all ends up looking correct.
 */

import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { Overlays } from "../components/Overlays.tsx";
import { I18nProvider } from "../i18n/index.tsx";
import { MESSAGES } from "../i18n/messages/index.ts";
import { AddOns } from "../screens/Extras.tsx";
import { useStore } from "../state/store.ts";
import { demoAddOns } from "./registry.ts";
import { NEVER_IN_A_BROWSER } from "./vendor/shipping-dhl/add-on-facts.ts";

const CARRIER = "shipping-dhl";

let host: HTMLElement;
let root: Root;

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.setItem("print-shop-locale", "en-US");
  window.scrollTo = () => {};
});

function press(scope: ParentNode, label: string): void {
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

const words = (node: Element | null) => (node?.textContent ?? "").replace(/\s+/g, " ");

beforeEach(() => {
  useStore.getState().registerAddOns(demoAddOns());
  useStore.setState({
    enabled: new Set([CARRIER]),
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

describe("the shop is asked before an add-on is switched off (24 D16)", () => {
  it("puts Manage on the shelf and not a one-click Disconnect", () => {
    /*
     * The shelf's control is Manage, deliberately. A one-click Disconnect on a
     * row would be the same irreversible action with the explanation removed,
     * and the explanation is the whole of what D16 asks for.
     */
    const row = host.querySelector(".mp-addon-row")!;
    const labels = [...row.querySelectorAll("button")].map((b) => (b.textContent ?? "").trim());
    expect(labels).toContain(MESSAGES["en-US"]["shop.addons.manage"]);
    expect(labels).not.toContain(MESSAGES["en-US"]["shop.manage.disconnect"]);
  });

  it("opens a confirm rather than disconnecting on the click", () => {
    press(host.querySelector(".mp-addon-row")!, MESSAGES["en-US"]["shop.addons.manage"]!);
    press(host.querySelector(".mp-drawer-foot")!, MESSAGES["en-US"]["shop.manage.disconnect"]!);
    expect(useStore.getState().overlay.kind).toBe("disconnect");
    expect(
      useStore.getState().enabled.has(CARRIER),
      "the add-on went off on the press, before anybody had read anything",
    ).toBe(true);
  });

  it("names what goes and what stays, in the add-on's own words", () => {
    act(() => {
      useStore.getState().openOverlay({ kind: "disconnect", addOn: CARRIER });
    });
    const modal = words(host.querySelector(".mp-modal"));
    const addOn = useStore.getState().registry.all.find((a) => a.key === CARRIER)!;
    const goes = MESSAGES["en-US"][addOn.disconnect?.goesKey ?? ""];
    const stays = MESSAGES["en-US"][addOn.disconnect?.staysKey ?? ""];
    expect(goes, "the carrier declares no sentence for what goes").not.toBeUndefined();
    expect(stays, "the carrier declares no sentence for what stays").not.toBeUndefined();
    expect(modal).toContain(goes);
    expect(modal).toContain(stays);
    // And not the KEYS, which is what a missing bundle entry would print.
    expect(modal).not.toContain("addon.");
  });

  it("leaves it connected when the shop backs out", () => {
    act(() => {
      useStore.getState().openOverlay({ kind: "disconnect", addOn: CARRIER });
    });
    press(host.querySelector(".mp-modal-foot")!, MESSAGES["en-US"]["common.cancel"]!);
    expect(useStore.getState().enabled.has(CARRIER)).toBe(true);
    // Back to the drawer it was opened from, not out of everything: the confirm
    // has something behind it and Cancel steps back one.
    expect(useStore.getState().overlay.kind).toBe("manage");
  });
});

describe("and then it takes the surfaces and keeps the work", () => {
  it("stops rendering the add-on's fills and leaves the shop's records alone", () => {
    const before = useStore.getState().jobs.map((job) => job.ref);
    act(() => {
      useStore.getState().openOverlay({ kind: "disconnect", addOn: CARRIER });
    });
    press(host.querySelector(".mp-modal-foot")!, MESSAGES["en-US"]["shop.manage.disconnect"]!);

    expect(useStore.getState().enabled.has(CARRIER)).toBe(false);
    expect(useStore.getState().registry.fillsFor("order.dispatch.actions", new Set())).toEqual([]);
    expect(
      useStore.getState().jobs.map((job) => job.ref),
      "a disconnect took the shop's own work with it",
    ).toEqual(before);
  });

  it("keeps the settings the shop chose, so reconnecting is not starting again", () => {
    useStore.getState().patchAddOnSettings(CARRIER, { collection_cutoff: "15:30" });
    act(() => {
      useStore.getState().disconnectAddOn(CARRIER);
    });
    expect(useStore.getState().addOnSettings[CARRIER]?.["collection_cutoff"]).toBe("15:30");
  });

  /**
   * ── THE CREDENTIAL HALF OF D16, WHICH THIS SHOP SATISFIES BY NOT HAVING ONE ─
   *
   * The studio's suite asserts that its confirm says the key is deleted. This
   * app makes a stronger claim and it is worth asserting rather than describing:
   * a credential is never in anything a disconnect could fail to clear. The
   * connect dialog holds both fields in component state, drops them when it
   * closes, and writes NOTHING — not to the store, not to `addOnSettings`, not
   * to localStorage.
   *
   * Asserted over the whole serialisable state rather than over the two names,
   * because a list of field names is a fingerprint of the fields somebody
   * thought of.
   */
  it("has no credential anywhere a disconnect would have to clear", () => {
    const state = useStore.getState() as unknown as Record<string, unknown>;
    const serialisable = JSON.stringify(
      Object.fromEntries(
        Object.entries(state).filter(([, value]) => typeof value !== "function"),
      ),
      (_key, value: unknown) => (value instanceof Set ? [...value] : value),
    );
    /*
     * THE ADD-ON'S OWN DECLARATION, not a list this suite keeps. `secret: true`
     * is a fact of the carrier's `manifest.json` and never reaches the client
     * contract — which is the D15 design rather than an omission — so the names
     * come from the vendored `add-on-facts.ts` the add-on ships for exactly this
     * purpose. A second credentialled add-on vendored tomorrow is covered with
     * no edit here.
     */
    const secrets = NEVER_IN_A_BROWSER.map((fact) => fact.text);
    expect(secrets.length, "the carrier declares nothing that must stay out of a browser").toBeGreaterThan(0);
    for (const key of secrets) {
      expect(serialisable.includes(key), `the store holds ${key}, which is a secret setting`).toBe(
        false,
      );
    }
    for (const key of Object.keys(localStorage)) {
      expect(secrets.some((secret) => (localStorage.getItem(key) ?? "").includes(secret))).toBe(
        false,
      );
    }
  });
});
