/**
 * THE FIVE SLOTS THIS APP HOSTS, ASSERTED BY RENDERING THE APP.
 *
 * @vitest-environment jsdom
 *
 * ── WHY IT REPLACES A GREP ──────────────────────────────────────────────────
 *
 * `addOns.test.ts` used to hold "mounts every slot it declares it hosts" as a
 * SEARCH OVER THE SOURCES for `slot="…"`. It was written for a real defect —
 * `nav.add-on.routes` sat in `HOSTED_SLOTS` for a release, Design Studio
 * shipped a fill for it, and no screen ever drew it — and it could not have
 * caught that defect either, because a mount inside a comment satisfies a grep.
 * The maker studio proved exactly that with a mutant and replaced its own copy
 * with a render; this is the same repair on this side.
 *
 * A slot is recorded here only when React CALLS the component. A mount behind a
 * condition that is never true, in a file nothing renders, or inside `{/* … *\/}`
 * records nothing and fails.
 *
 * ── AND THE ASSERTION THAT WAS ACTIVELY WRONG ───────────────────────────────
 *
 * The same file also asserted the OPPOSITE direction — that `HOSTED_SLOTS`
 * contains every fill of every registered add-on — which forbids the thing 24
 * D21 claims. The personalizer declares six fills and this works mounts five
 * slots, five of which it does not host; registering a perfectly good portable
 * add-on here would have turned the live app's suite red while the app itself
 * ran faultlessly. A fill for a slot the host does not mount simply does not
 * render, and that IS portability. `slots.ts` says so in its header; the suite
 * said the reverse. It is gone, and what is left is the half worth having.
 *
 * WHY A DOM AND NOT `renderToStaticMarkup`: zustand v5 serves
 * `getInitialState()` as its server snapshot, so a server render shows the
 * state the store was BORN in and no amount of driving it has any effect.
 * `jsdom` is a devDependency and ships in nothing.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { HOSTED_SLOTS, SLOT_EMPTY_BEHAVIOUR, type HostedSlotId } from "./slots.ts";
import { demoAddOns, DEMO_KEYS } from "./registry.ts";
import { JOBS } from "../data/demo.ts";
import { I18nProvider } from "../i18n/index.tsx";
import { Overlays } from "../components/Overlays.tsx";
import { Artwork } from "../screens/Customer.tsx";
import { Basket, OrderLookup } from "../screens/CustomerOrder.tsx";
import { AddOns } from "../screens/Extras.tsx";
import { Ticket } from "../screens/Shop.tsx";
import { useStore } from "../state/store.ts";

/** The recorder, hoisted so `vi.mock` — which runs first — can close over it. */
const { mounts } = vi.hoisted(() => ({
  mounts: [] as { slot: string; fallback: ReactNode | undefined }[],
}));

/**
 * The one component every fill reaches the page through, replaced by a spy.
 *
 * It draws a MARKER rather than the fill: this suite is about the mount sites a
 * screen offers and the empty states it hands them, not about what an add-on
 * draws — the fills have their own suites in their own package, and letting
 * them render here would make a screen's D19 behaviour depend on which add-ons
 * happened to be vendored. The marker carries no words and takes no space, and
 * exists so the assertions can ask what the host put NEXT TO a mount.
 */
vi.mock("../components/AddOnSlot.tsx", () => ({
  AddOnSlot: (props: { slot: string; fallback?: ReactNode }) => {
    mounts.push({ slot: props.slot, fallback: props.fallback });
    return <div hidden data-slot-mount={props.slot} />;
  },
}));

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  // Pinned, so the suite reads one language rather than the machine's.
  localStorage.setItem("print-shop-locale", "en-US");
  // `go()` scrolls a real window back to the top; jsdom has no viewport and
  // says so, loudly, once per view change.
  window.scrollTo = () => {};
  /*
   * The store is born with an EMPTY registry — `App.tsx` registers on mount,
   * because in connected mode the list arrives from the server (24 §5.9). A
   * suite that skipped this would render every add-on surface against nothing
   * and pass by having no add-ons to get wrong.
   */
  useStore.getState().registerAddOns(demoAddOns());
});

/**
 * Mount, read what the browser would have, unmount.
 *
 * `inspect` runs while the tree is still ON THE PAGE — the only moment a
 * question about the markup AROUND a mount can be asked, because `innerHTML` is
 * a string and knows nothing about siblings.
 */
function render(node: ReactNode, inspect?: (host: HTMLElement) => void): string {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() => {
    root.render(<I18nProvider>{node}</I18nProvider>);
  });
  const html = host.innerHTML;
  inspect?.(host);
  act(() => {
    root.unmount();
  });
  host.remove();
  return html;
}

/**
 * Every surface in this app that mounts a slot, with whatever state it takes to
 * reach the mount — a basket with something in it, an order looked up, a job
 * ticket open, the manage drawer of a connected add-on. Each is driven through
 * the store's OWN actions rather than by writing state in by hand, so a screen
 * that quietly started rendering its "nothing here yet" state instead would
 * stop recording and fail.
 */
function renderEveryHostSurface(inspect?: (host: HTMLElement) => void): void {
  const store = () => useStore.getState();

  store().startConfigure("business-cards");
  store().addToBasket();
  render(<Artwork />, inspect);
  render(<Basket />, inspect);

  const job = JOBS[0]!;
  store().setLookup({ ref: job.ref, email: "" });
  store().doLookup();
  render(<OrderLookup />, inspect);

  /*
   * A job that is READY, not just any job. `order.dispatch.actions` lives in
   * the half of the ticket that only appears once the work is done — booking a
   * collection for something still on the press would be the wrong offer — so
   * opening MP-4113, which is in prepress, reaches four mounts and quietly
   * misses the fifth.
   */
  const ready = JOBS.find((j) => j.stage === "ready")!;
  store().openTicket(ready.ref);
  render(<Ticket />, inspect);

  render(<AddOns />, inspect);

  /*
   * The fifth slot lives inside the manage drawer of a CONNECTED add-on, so it
   * is only reachable once something is switched on. A shop with nothing
   * connected never draws it, which is correct — and is why the two-pass shape
   * below exists rather than one pass demanding a mount the app is right not to
   * render.
   */
  const first = DEMO_KEYS[0]!;
  if (store().enabled.has(first)) {
    store().openOverlay({ kind: "manage", addOn: first });
    render(<Overlays />, inspect);
    store().closeOverlay();
  }
}

const seen = (slot: string) => mounts.filter((m) => m.slot === slot);
const emptyStateOf = (mount: { fallback: ReactNode | undefined }) =>
  mount.fallback === undefined ? "" : render(<>{mount.fallback}</>);

/** Both passes a reviewer can be in: nothing connected, then everything. */
function renderBothStates(inspect?: (host: HTMLElement) => void): void {
  useStore.setState({ enabled: new Set() });
  renderEveryHostSurface(inspect);
  for (const key of DEMO_KEYS) useStore.getState().toggleAddOn(key);
  renderEveryHostSurface(inspect);
}

beforeEach(() => {
  mounts.length = 0;
  useStore.setState({ enabled: new Set(), basket: [] });
});

describe("every slot this app hosts is really mounted (24 §5.4, D6)", () => {
  it("reaches all five mounts across the two states a reviewer can be in", () => {
    renderEveryHostSurface();
    const withNothingOn = new Set(mounts.map((m) => m.slot));

    for (const key of DEMO_KEYS) useStore.getState().toggleAddOn(key);
    renderEveryHostSurface();

    expect([...new Set(mounts.map((m) => m.slot))].sort()).toEqual([...HOSTED_SLOTS].sort());
    // And four of the five are there before anybody connects anything.
    expect([...withNothingOn].sort()).toEqual(
      [...HOSTED_SLOTS].filter((s) => s !== "settings.add-on.panel").sort(),
    );
  });

  it("would not accept a mount that only exists in a comment", () => {
    /*
     * The proof this is a render and not a grep. These two ids appear in
     * `slots.ts`, in this app's prose and in its suites, and this works draws
     * neither: `record.editor.panel` is a dashboard surface and
     * `product.options.personalize` is the maker studio's. Nothing here can be
     * satisfied by text, because a slot is recorded only when React calls the
     * component.
     */
    renderBothStates();
    const rendered = new Set(mounts.map((m) => m.slot));
    expect(rendered.has("record.editor.panel")).toBe(false);
    expect(rendered.has("product.options.personalize")).toBe(false);
    expect(rendered.has("nav.add-on.routes")).toBe(false);
  });

  /**
   * D21, STATED AS THE PROPERTY THE OLD ASSERTION DENIED.
   *
   * An add-on may declare a fill for a slot this works does not mount. It does
   * not render, nothing breaks, and that is precisely what makes the same
   * bundle run in a print works and a maker studio with no code changed in
   * either. The old case asserted `HOSTED_SLOTS` contained every fill of every
   * registered add-on, which would fail the moment a portable add-on was
   * registered here — a suite forbidding the wave's headline claim.
   */
  /*
   * AND IT IS PROVED BY RENDERING, not by asking the registry (round 3).
   *
   * This case used to assert `fillsFor(unhosted, …) === []`. `createRegistry`
   * does not consult `HOSTED_SLOTS` at all, so that was never a property of the
   * seam — it was green because nothing vendored here fills an unmounted slot.
   * The property that IS true is a fact about screens, and this file renders
   * them: register an add-on that fills a slot this works has no screen for,
   * switch it on, draw every surface, and no mount ever names it.
   */
  it("draws nothing for a fill naming a slot this works does not mount", () => {
    const unhosted = "product.options.personalize";
    expect(HOSTED_SLOTS as readonly string[]).not.toContain(unhosted);

    const registered = useStore.getState().registry.all;
    const elsewhere = {
      ...registered[0]!,
      key: "made-elsewhere",
      fills: [{ slot: unhosted, order: 1, render: () => <p>drawn by the portable add-on</p> }],
    } as (typeof registered)[number];

    useStore.getState().registerAddOns([...registered, elsewhere]);
    try {
      useStore.setState({ enabled: new Set([...DEMO_KEYS, elsewhere.key]) });
      renderEveryHostSurface();

      // The app still drew every one of its own mounts — the portable add-on
      // did not take a screen down on its way to not being rendered.
      expect([...new Set(mounts.map((m) => m.slot))].sort()).toEqual([...HOSTED_SLOTS].sort());
      // And not one of them is the slot it fills, because no screen mounts it.
      expect(mounts.filter((m) => m.slot === unhosted)).toEqual([]);
    } finally {
      useStore.getState().registerAddOns(registered);
    }
  });
});

/**
 * The words a control carries are a thing to press, not a caption. Anything
 * whose subtree holds one is content in its own right.
 */
const CONTROLS = "button, a, input, select, textarea, label, [role='button'], [role='link']";

/**
 * WHAT A CAPTION WOULD BE PRESSED AGAINST — the mount, or the wrapper that
 * stands for it.
 *
 * The rules below all ask what is IMMEDIATELY beside a mount, and "beside" has
 * to mean what a reader sees rather than what the DOM happens to nest. A mount
 * wrapped in a `<div>` of its own has no siblings at all: every caption in the
 * world could sit next to that wrapper and `mount.nextSibling` would be `null`.
 *
 * So the anchor climbs while the parent holds nothing else that speaks. A
 * wrapper around one silent thing is that thing, positionally, and the caption
 * beside it is beside the mount. It stops the moment the parent has content of
 * its own, which is the panel the mount lives in and not a wrapper at all.
 */
function anchorOf(mount: Element): Element {
  let node = mount;
  for (let up = 0; up < 5; up += 1) {
    const parent = node.parentElement;
    if (parent === null || parent.hasAttribute("data-slot-mount")) return node;
    const speaksOtherwise = [...parent.childNodes].some(
      (child) => child !== node && (child.textContent ?? "").trim() !== "",
    );
    if (speaksOtherwise) return node;
    node = parent;
  }
  return node;
}

/**
 * Everything the host draws AFTER a mount, inside the mount's own container,
 * that is a bare run of words. Text nodes count as well as elements: a sentence
 * typed straight into the JSX is the same defect without a wrapper.
 */
function captionsUnder(mount: Element): string[] {
  const out: string[] = [];
  for (let node = anchorOf(mount).nextSibling; node !== null; node = node.nextSibling) {
    if (node.nodeType === Node.TEXT_NODE) {
      const words = (node.textContent ?? "").trim();
      if (words !== "") out.push(words);
      continue;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    const el = node as Element;
    if (el.hasAttribute("hidden")) continue; // another mount's marker
    const words = (el.textContent ?? "").replace(/\s+/g, " ").trim();
    if (words === "") continue;
    if (el.matches(CONTROLS) || el.querySelector(CONTROLS) !== null) continue;
    out.push(`<${el.tagName.toLowerCase()} class="${el.getAttribute("class") ?? ""}"> ${words}`);
  }
  return out;
}


/**
 * What this works's own markup uses to say "this is a heading".
 *
 * Real tags, plus the classes the stylesheet gives the small capitalised label
 * above a block and every `…-title`, `…-head`, `…-header` this app names. A
 * heading is the one kind of prose that legitimately sits above a mount, so it
 * has to be recognisable to a machine — and it is, because a heading is a
 * styled thing rather than a sentence in a `<div>`.
 */
const HEADINGS =
  'h1, h2, h3, h4, h5, h6, legend, .mp-eyebrow, .mp-label, [class$="-title"], [class$="-head"], [class$="-header"]';

/**
 * Is this element ONE RUN OF WORDS, rather than a block of structured content?
 *
 * The distinction the "above" rule turns on, and it is a structural one rather
 * than a judgement about tone. A placeholder is a sentence: its words live in a
 * single text run, however many wrappers are around it. A panel's real content
 * — a spec grid, a quote's rows, a job's facts — spreads its words across
 * SIBLING elements, because it is a list of separate things and is marked up as
 * one.
 *
 * So: two or more element children carrying text means content, and this
 * returns false. One means a wrapper, and it looks inside. None means the words
 * are the element's own, which is a line of prose.
 */
function isBareProse(el: Element): boolean {
  const speaking = [...el.children].filter((child) => (child.textContent ?? "").trim() !== "");
  if (speaking.length >= 2) return false;
  if (speaking.length === 1) return isBareProse(speaking[0]!);
  return true;
}

/**
 * ── MUTANT C, WHICH WAS STILL OPEN ON THE LIVE APP ──────────────────────────
 *
 * `captionsUnder` walks `nextSibling` and only `nextSibling`, so it sees prose
 * BELOW a silent mount and never prose ABOVE it. A verifier wrote
 *
 *     <div className="mp-slot-line">No delivery company is connected yet.</div>
 *
 * immediately before the silent `order.dispatch.actions` mount in
 * `screens/Shop.tsx` and the whole suite stayed green — a sentence on a works's
 * ticket, telling the shop about a feature it has not bought, which is exactly
 * what D19 forbids and exactly what the check below the mount exists to catch.
 * The maker studio closed this hole in its own copy; the repair never crossed
 * the two repos, and the app it was found in kept the defect.
 *
 * The reason the hole was left open was right about HEADINGS and wrong about
 * everything else. So the rule is narrowed to what the reason actually
 * supports: the sibling IMMEDIATELY BEFORE a mount may be a heading, a control,
 * or a block of structured content — but a bare line of prose pressed against
 * the mount is a caption that happens to be on the other side of it.
 *
 * Three exemptions, each of which a real screen in this works needs:
 *
 *   A HEADING is what the mounted thing is CALLED.
 *   A CONTROL is a thing to press, exactly as it is below the mount.
 *   STRUCTURED CONTENT is a panel's own body, and the mount is simply the next
 *   thing in the panel.
 *
 * Only the immediate neighbour, deliberately. Content further up the container
 * is the section's own body and has nothing to do with the slot; reading all of
 * it would ban a panel from having one. The defect shape — and every plausible
 * version of it — is a line touching the mount.
 */
function nearestProse(mount: Element, step: (node: Node) => Node | null): string[] {
  for (let node = step(anchorOf(mount)); node !== null; node = step(node)) {
    if (node.nodeType === Node.TEXT_NODE) {
      const words = (node.textContent ?? "").trim();
      if (words === "") continue;
      return [words];
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    const el = node as Element;
    if (el.hasAttribute("hidden")) continue; // another mount's marker
    const words = (el.textContent ?? "").replace(/\s+/g, " ").trim();
    if (words === "") continue;
    if (el.matches(HEADINGS) || el.querySelector(HEADINGS) !== null) return [];
    if (el.matches(CONTROLS) || el.querySelector(CONTROLS) !== null) return [];
    if (!isBareProse(el)) return [];
    return [`<${el.tagName.toLowerCase()} class="${el.getAttribute("class") ?? ""}"> ${words}`];
  }
  return [];
}

const captionAbove = (mount: Element): string[] =>
  nearestProse(mount, (node) => node.previousSibling);

/**
 * A bare line of words TOUCHING a mount on either side.
 *
 * The rule that holds for every slot, silent or speaking. `captionsUnder` is
 * stricter and stays that way for the silent ones — a silent mount with nothing
 * connected leaves a container that should hold nothing at all, so structured
 * content below it is a defect there too. A speaking slot sits in the middle of
 * a page that has plenty else to say, and the only thing wrong next to it is a
 * sentence about the slot.
 */
function captionsTouching(mount: Element): string[] {
  return [
    ...captionAbove(mount).map((line) => `above · ${line}`),
    ...nearestProse(mount, (node) => node.nextSibling).map((line) => `below · ${line}`),
  ];
}

/** Both sides of a silent mount: a caption above, and anything at all below. */
function captionsAround(mount: Element): string[] {
  return [...captionAbove(mount).map((line) => `above · ${line}`), ...captionsUnder(mount)];
}

/**
 * The slots whose own empty state carries a heading — see the case below that
 * uses it. Computed from the recorded `fallback`, so a slot that stops naming
 * itself stops being exempt on the same day.
 */
function slotsThatNameThemselves(): Set<string> {
  const out = new Set<string>();
  for (const mount of mounts) {
    const markup = emptyStateOf(mount);
    if (markup === "") continue;
    const probe = document.createElement("div");
    probe.innerHTML = markup;
    if (probe.querySelector(HEADINGS) !== null) out.add(mount.slot);
  }
  return out;
}

describe("what a person sees where a slot is (24 D19)", () => {
  it("draws not one byte where a slot is declared silent", () => {
    renderBothStates();
    const noisy: string[] = [];
    for (const mount of mounts) {
      if (SLOT_EMPTY_BEHAVIOUR[mount.slot as HostedSlotId] !== "silent") continue;
      const markup = emptyStateOf(mount);
      if (markup !== "") noisy.push(`${mount.slot} · ${markup.slice(0, 120)}`);
    }
    expect(noisy).toEqual([]);
  });

  it("gives every slot declared speaking a real empty state in words", () => {
    renderBothStates();
    const mute: string[] = [];
    for (const slot of HOSTED_SLOTS) {
      if (SLOT_EMPTY_BEHAVIOUR[slot] !== "speaks") continue;
      const found = seen(slot);
      expect({ slot, mounted: found.length > 0 }).toEqual({ slot, mounted: true });
      for (const mount of found) {
        // Words, not a box: something a person can read has to come back.
        const words = emptyStateOf(mount).replace(/<[^>]*>/g, "");
        if (!/\p{L}{4}/u.test(words)) mute.push(`${slot} · ${words}`);
      }
    }
    expect(mute).toEqual([]);
  });

  it("prints no caption under a silent slot with nothing connected", () => {
    /*
     * The maker studio shipped exactly this defect and its suite could not see
     * it: a muted line under a silent mount, unconditional, which sat beneath
     * whatever an add-on drew the moment one was switched on and captioned
     * something the host cannot see. Reading the `fallback` prop can never
     * catch it, because a sibling is not a fallback.
     */
    useStore.setState({ enabled: new Set(), basket: [] });
    const found: string[] = [];
    const captioned: string[] = [];
    renderEveryHostSurface((host) => {
      for (const mount of host.querySelectorAll("[data-slot-mount]")) {
        const slot = mount.getAttribute("data-slot-mount") as HostedSlotId;
        if (SLOT_EMPTY_BEHAVIOUR[slot] !== "silent") continue;
        found.push(slot);
        for (const caption of captionsAround(mount)) captioned.push(`${slot} · ${caption}`);
      }
    });
    // The guard has to have SEEN something, or an empty result reads as a pass.
    expect(found.length).toBeGreaterThan(0);
    expect(captioned).toEqual([]);
  });

  /**
   * AND THE SAME RULE FOR EVERY MOUNT, because the defect does not care which
   * kind of slot it is standing next to.
   *
   * The check above is scoped to the SILENT slots, which is where the mutant
   * was written. That scope was never part of the reasoning: the argument is
   * that words touching a mount caption whatever the ADD-ON drew there once one
   * is connected, and an add-on's panel replaces a speaking slot's empty state
   * just as completely as it fills a silent one. The maker studio shipped
   * exactly that — a line under a `speaks` mount on a customer-facing page —
   * and its suite could not see it for the same reason.
   *
   * The state is still the empty works: connecting an add-on legitimately puts
   * D16's "what a disconnect takes and keeps" sentence under the manage
   * drawer's own panel, and a rule scoped to the empty shop needs no carve-out
   * for it. A carve-out list is what stops a gate being one.
   */
  it("holds for every mount on the page, speaking ones included", () => {
    useStore.setState({ enabled: new Set(), basket: [] });
    const found = new Set<string>();
    const captioned: string[] = [];
    // Recorded on a first pass, because the mock erases `wrap` and `fallback`
    // from the DOM and only the recorded props still carry them.
    renderEveryHostSurface();
    const namesItself = slotsThatNameThemselves();
    mounts.length = 0;
    renderEveryHostSurface((host) => {
      for (const mount of host.querySelectorAll("[data-slot-mount]")) {
        const slot = mount.getAttribute("data-slot-mount")!;
        found.add(slot);
        /*
         * A SLOT THAT NAMES ITSELF CANNOT BE CAPTIONED FROM OUTSIDE.
         *
         * `artwork.sources` draws its own titled panel — "More ways to send
         * artwork", in the empty state and in the `wrap` alike — so the page's
         * own sentence above it ("A person checks every file here before it
         * prints") is the artwork section's copy and not a caption for an
         * add-on. Between that sentence and anything an add-on draws there is a
         * heading, which is the one thing the rule has always allowed above a
         * mount. The suite could not see it only because the mount is MOCKED
         * here: the marker replaces the whole component, `wrap` and `fallback`
         * included, so what is a heading on the page is nothing in this DOM.
         *
         * The judgement is made from the mount's own declared empty state,
         * which the mock does record, rather than from a list of slots.
         */
        const rules = namesItself.has(slot) ? captionsUnder(mount) : captionsTouching(mount);
        for (const caption of rules) captioned.push(`${slot} · ${caption}`);
      }
    });
    // The guard has to have SEEN something. Every slot but the drawer's own
    // panel is on a page in the empty works.
    expect([...found].sort()).toEqual(
      [...HOSTED_SLOTS].filter((slot) => slot !== "settings.add-on.panel").sort(),
    );
    expect(captioned).toEqual([]);
  });

  /**
   * MUTANT C, KEPT — the one that was still open on the live app.
   *
   * A verifier wrote `<div className="mp-slot-line">No delivery company is
   * connected yet.</div>` immediately ABOVE the silent `order.dispatch.actions`
   * mount in `screens/Shop.tsx`, and the whole suite stayed green: every
   * assertion here walked `nextSibling` and nothing walked back. This drives
   * the detector over that exact markup, and over the three shapes that are NOT
   * captions, so the line it draws is visible rather than asserted.
   */
  it("separates a heading above the mount from a placeholder above it", () => {
    const host = document.createElement("div");
    host.innerHTML = [
      '<div class="mp-panel">',
      '  <div class="mp-eyebrow">Getting it there</div>',
      '  <div hidden data-slot-mount="order.dispatch.actions"></div>',
      "</div>",
    ].join("");
    const mount = host.querySelector("[data-slot-mount]")!;
    // A heading is what the mounted thing is called, not a caption for it.
    expect(captionAbove(mount)).toEqual([]);

    // The mutant, verbatim.
    const line = document.createElement("div");
    line.className = "mp-slot-line";
    line.textContent = "No delivery company is connected yet.";
    mount.parentElement!.insertBefore(line, mount);
    expect(captionAbove(mount)).toEqual([
      '<div class="mp-slot-line"> No delivery company is connected yet.',
    ]);
    expect(captionsAround(mount)).toEqual([
      'above · <div class="mp-slot-line"> No delivery company is connected yet.',
    ]);

    // A control immediately above is a thing to press, not a caption.
    line.remove();
    const action = document.createElement("div");
    action.innerHTML = "<button>Book a collection</button>";
    mount.parentElement!.insertBefore(action, mount);
    expect(captionAbove(mount)).toEqual([]);

    // And a panel's own structured content above it is content.
    action.remove();
    const facts = document.createElement("div");
    facts.innerHTML = "<span>Sheets</span><span>120</span>";
    mount.parentElement!.insertBefore(facts, mount);
    expect(captionAbove(mount)).toEqual([]);
  });

  /**
   * THE ASYMMETRY THE OTHER WAY, which neither host had closed.
   *
   * Every version of this rule asked about the mount's OWN siblings, and a
   * mount wrapped in a `<div>` of its own has none — so a caption beside the
   * wrapper was invisible from both directions at once, in both apps. Wrapping
   * a mount is an ordinary thing to do for layout, which is what made it worth
   * finding: it is a defect a stylesheet change could introduce with nobody
   * touching the sentence.
   *
   * `anchorOf` is the answer: while a parent holds nothing else that speaks, it
   * IS the mount as far as position goes.
   */
  it("sees a caption pressed against a wrapper that holds only the mount", () => {
    const host = document.createElement("div");
    host.innerHTML = [
      '<div class="mp-panel">',
      '  <div class="mp-slot-line">No delivery company is connected yet.</div>',
      '  <div class="mp-dispatch"><div hidden data-slot-mount="order.dispatch.actions"></div></div>',
      "</div>",
    ].join("");
    const mount = host.querySelector("[data-slot-mount]")!;
    expect(mount.previousSibling).toBeNull();
    expect(captionAbove(mount)).toEqual([
      '<div class="mp-slot-line"> No delivery company is connected yet.',
    ]);

    // …and a wrapper that holds the mount AND real content is a panel, not a
    // wrapper: the mount's own neighbours are what count again.
    const panel = document.createElement("div");
    panel.innerHTML = [
      '<div class="mp-slot-line">A caption on the panel.</div>',
      '<div class="mp-dispatch"><div class="mp-panel-title">Getting it there</div>',
      '<div hidden data-slot-mount="order.dispatch.actions"></div></div>',
    ].join("");
    const nested = panel.querySelector("[data-slot-mount]")!;
    // The mount's own neighbour here is a heading, which is what a mount is
    // allowed to sit under; the caption on the panel is two levels out and
    // captions the panel.
    expect(captionAbove(nested)).toEqual([]);
  });
});

describe("the component that decides an empty slot", () => {
  it("keeps the host's own content when a fill has nothing to draw", async () => {
    /*
     * "NOTHING FILLS THIS SLOT" AND "THE FILL HAD NOTHING TO DRAW" ARE TWO
     * THINGS, and treating them as one puts an empty box on a real screen.
     *
     * [Ported from `maker-shop` 2026-08-11, wave 4b round 5.] The studio found
     * this in round 2, fixed it in its own `AddOnSlot`, and this host kept the
     * old one for three more rounds — the exact drift this round was sent to
     * find. An add-on registers a fill and correctly draws NOTHING for a record
     * it has nothing for; `fills.length === 0` is false, so the fallback was
     * suppressed and the fill rendered null. CONNECTING AN ADD-ON TOOK A
     * PICTURE AWAY.
     *
     * The host cannot ask an add-on whether it has anything for a record, so
     * the fallback is rendered anyway and the stylesheet decides. This asserts
     * the two halves that make that work: the fallback is IN the tree, and it
     * is LAST — the sibling rule reaches it no other way.
     */
    const actual = await vi.importActual<typeof import("../components/AddOnSlot.tsx")>(
      "../components/AddOnSlot.tsx",
    );
    const Slot = actual.AddOnSlot as (props: {
      slot: HostedSlotId;
      payload: unknown;
      fallback?: ReactNode;
    }) => ReactNode;

    // A fill that exists and draws nothing, registered against a real slot. It
    // is written here rather than borrowed from a vendored add-on so the case
    // states its own premise: what matters is a fill that returns null, not
    // which add-on happens to do that this month.
    useStore.setState({
      registry: {
        ...useStore.getState().registry,
        fillsFor: () => [{ addOn: "silent", fill: { slot: "order.dispatch.actions", render: () => null } }],
      } as never,
    });

    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    act(() => {
      root.render(
        <I18nProvider>
          <Slot
            slot="order.dispatch.actions"
            payload={{ job: JOBS[0]! }}
            fallback={<span data-host-tile>the works' own words</span>}
          />
        </I18nProvider>,
      );
    });

    const fill = host.querySelector(".mp-slot-fill");
    const spare = host.querySelector(".mp-slot-spare");
    expect(fill, "the add-on's fill is mounted").not.toBeNull();
    expect(fill!.innerHTML, "and it drew nothing for this job").toBe("");
    expect(spare, "the works' own content is still in the tree").not.toBeNull();
    expect(spare!.querySelector("[data-host-tile]")).not.toBeNull();
    // LAST, because `.mp-slot-fill:not(:empty) ~ .mp-slot-spare` is a sibling
    // rule: put the spare first and it stops being reachable, and the content
    // doubles up wherever a fill DOES draw.
    expect(host.lastElementChild).toBe(spare);

    act(() => {
      root.unmount();
    });
    host.remove();
  });

  /**
   * ── AND THE SAME THING FOR A FILL THAT DREW NOTHING WITHOUT RETURNING NULL ──
   *
   * [Added 2026-08-11, round 6.] The case above is the one shape `:empty` gets
   * right. This is the shape it gets WRONG, and it is the reported defect: a
   * fill that returns a wrapper — a bare `<div/>`, or one whose only child is
   * `display: none` — has child nodes, so `.mp-slot-fill:not(:empty)` matched
   * and the works' own content was hidden on its behalf. Connecting an add-on
   * still took the picture away, one level down.
   *
   * `SlotFill` marks the wrapper `data-drew="none"` and the stylesheet's second
   * condition reads it. jsdom applies no stylesheet, so what is asserted here is
   * the ATTRIBUTE — and the case below asserts the selector that consumes it.
   */
  it.each([
    { what: "a bare wrapper", render: () => <div /> },
    {
      what: "a wrapper whose only child is hidden",
      render: () => (
        <div>
          <span style={{ display: "none" }}>a preview it has nothing for</span>
        </div>
      ),
    },
  ])("keeps it when the fill drew nothing but emitted $what", async ({ render }) => {
    const actual = await vi.importActual<typeof import("../components/AddOnSlot.tsx")>(
      "../components/AddOnSlot.tsx",
    );
    const Slot = actual.AddOnSlot as (props: {
      slot: HostedSlotId;
      payload: unknown;
      fallback?: ReactNode;
    }) => ReactNode;

    const registry = useStore.getState().registry;
    useStore.setState({
      registry: { ...registry, fillsFor: () => [{ addOn: "silent", fill: { slot: "order.dispatch.actions", render } }] } as never,
    });

    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    act(() => {
      root.render(
        <I18nProvider>
          <Slot
            slot="order.dispatch.actions"
            payload={{ job: JOBS[0]! }}
            fallback={<span data-host-tile>the works' own words</span>}
          />
        </I18nProvider>,
      );
    });

    const fill = host.querySelector(".mp-slot-fill")!;
    expect(fill.matches(":empty"), "this is exactly the shape `:empty` gets wrong").toBe(false);
    expect(
      fill.getAttribute("data-drew"),
      "the fill drew nothing, and nothing marked it as such — so the sibling rule " +
        "hides the works' own content and the reader gets a blank box",
    ).toBe("none");
    expect(host.querySelector("[data-host-tile]")).not.toBeNull();

    act(() => {
      root.unmount();
    });
    host.remove();
    // The registry this case swapped out is shared state; leaving the stub in
    // place makes the NEXT case render a fill on a slot that has none.
    useStore.setState({ registry });
  });

  it("takes the mark straight back off when the fill does draw", async () => {
    // The other direction, because a rule that always says "nothing" would pass
    // every case above and double the content on every slot that is filled.
    const actual = await vi.importActual<typeof import("../components/AddOnSlot.tsx")>(
      "../components/AddOnSlot.tsx",
    );
    const Slot = actual.AddOnSlot as (props: {
      slot: HostedSlotId;
      payload: unknown;
      fallback?: ReactNode;
    }) => ReactNode;

    const registry = useStore.getState().registry;
    useStore.setState({
      registry: {
        ...registry,
        fillsFor: () => [
          {
            addOn: "loud",
            fill: { slot: "order.dispatch.actions", render: () => <div>Collection booked</div> },
          },
        ],
      } as never,
    });

    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    act(() => {
      root.render(
        <I18nProvider>
          <Slot
            slot="order.dispatch.actions"
            payload={{ job: JOBS[0]! }}
            fallback={<span data-host-tile>the works' own words</span>}
          />
        </I18nProvider>,
      );
    });
    expect(host.querySelector(".mp-slot-fill")!.getAttribute("data-drew")).toBeNull();
    act(() => {
      root.unmount();
    });
    host.remove();
    useStore.setState({ registry });
  });

  it("carries the stylesheet rule the component depends on", () => {
    /*
     * The half of the repair that lives in CSS, asserted where the other half
     * is. Delete either rule and the component above is drawing two things on
     * top of each other, or none — and no DOM assertion would notice, because
     * jsdom applies no stylesheet.
     */
    const css = readFileSync(join(process.cwd(), "src/styles/components.css"), "utf8").replace(
      /\s+/g,
      " ",
    );
    expect(css).toContain(".mp-slot-spare { display: contents; }");
    // BOTH conditions. `:empty` alone is the round-6 defect; the `data-drew`
    // half alone would lose the correct first paint before the measurement runs.
    expect(css).toContain(
      '.mp-slot-fill:not(:empty):not([data-drew="none"]) ~ .mp-slot-spare { display: none; }',
    );
  });
});
