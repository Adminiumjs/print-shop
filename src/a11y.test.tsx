/**
 * NOTHING A PERSON CAN OPERATE OR LOOK AT IS UNNAMED.
 *
 * @vitest-environment jsdom
 *
 * ── WHY, AND WHERE THIS CAME FROM ───────────────────────────────────────────
 *
 * The Live Personalizer's flagship surface — the picture of the piece with the
 * shopper's own words cut into it — shipped as an `<svg role="img">` with no
 * title, no `aria-label` and no `aria-hidden`. A screen reader announced
 * "image", five times over on five different pages, and the one thing the
 * picture existed to communicate was the one thing it did not pass on.
 *
 * That is not an add-on's private defect, and it is the reason this suite lives
 * in the HOST rather than only in the add-on's repo: a missing name matters
 * because the node appears on a page the HOST draws. The works does not vendor
 * the personalizer — it vendors three other add-ons — and the rule is the same
 * one, which is the whole argument for it living in both hosts: a defect found
 * in one shop must not be fixed only in that shop.
 *
 * ── THE THREE RULES, WHICH ARE THE THREE WAYS A CONTROL GOES SILENT ─────────
 *
 *   1. A GRAPHIC either says what it is or says it is decoration. `role="img"`
 *      with neither is the worst of both: announced, and empty.
 *   2. A FIELD has a label. Placeholder text is not one — it disappears the
 *      moment somebody types, and several screen readers never speak it.
 *   3. A CONTROL has a name. An icon-only button whose whole content is an
 *      `aria-hidden` glyph is a button announced as "button".
 *
 * Each is checked over the WHOLE APP, in both personas, with the add-ons off
 * and on, through `testing/tour.tsx` — so a surface added tomorrow is covered
 * tomorrow, and so a vendored add-on's fills are checked in the page they
 * actually draw in.
 */

import { describe, expect, it } from "vitest";

import { tourEveryView } from "./testing/tour.tsx";

interface Unnamed {
  view: string;
  connected: boolean;
  what: string;
  markup: string;
}

/** A short, recognisable print of an element — enough to find it by. */
function shortMarkup(el: Element): string {
  const html = el.outerHTML.replace(/\s+/g, " ");
  return html.length > 160 ? `${html.slice(0, 160)}…` : html;
}

/**
 * The accessible name of `el`, as far as the four mechanisms this app uses.
 *
 * Deliberately NOT a full AccName implementation — jsdom computes no
 * accessibility tree and a re-implementation of the spec would be a second
 * thing to get wrong. What it covers is exactly what this app and its add-ons
 * have available: an explicit label, a referenced one, an SVG `<title>`, and
 * the element's own text.
 */
function accessibleName(el: Element): string {
  const label = el.getAttribute("aria-label");
  if (label !== null && label.trim() !== "") return label.trim();

  const ref = el.getAttribute("aria-labelledby");
  if (ref !== null) {
    const named = ref
      .split(/\s+/)
      .map((id) => el.ownerDocument.getElementById(id)?.textContent ?? "")
      .join(" ")
      .trim();
    if (named !== "") return named;
  }

  const title = el.querySelector(":scope > title");
  if (title !== null && (title.textContent ?? "").trim() !== "") {
    return (title.textContent ?? "").trim();
  }

  /*
   * Text INSIDE the control, with anything hidden from the tree removed — an
   * icon-only button is a button whose only child is `aria-hidden`, and reading
   * `textContent` straight off it would happily count the glyph as words.
   */
  const clone = el.cloneNode(true) as Element;
  for (const hidden of clone.querySelectorAll('[aria-hidden="true"], [hidden]')) {
    hidden.remove();
  }
  return (clone.textContent ?? "").trim();
}

/** Whether the accessibility tree is told to skip this node entirely. */
function isHidden(el: Element): boolean {
  return el.closest('[aria-hidden="true"], [hidden]') !== null;
}

/** A field's label, by any of the three ways one can be attached. */
function hasLabel(el: Element): boolean {
  if (accessibleName(el) !== "") return true;
  if (el.closest("label") !== null) return true;
  const id = el.getAttribute("id");
  return id !== null && el.ownerDocument.querySelector(`label[for="${id}"]`) !== null;
}

const GRAPHICS = 'img, [role="img"], svg';
const FIELDS = "input, select, textarea";
const CONTROLS = 'button, [role="button"], a[href], summary';

function unnamedIn(host: HTMLElement): { what: string; markup: string }[] {
  const bad: { what: string; markup: string }[] = [];

  for (const el of host.querySelectorAll(GRAPHICS)) {
    if (isHidden(el)) continue;
    if (accessibleName(el) === "") bad.push({ what: "graphic", markup: shortMarkup(el) });
  }

  for (const el of host.querySelectorAll(FIELDS)) {
    if (isHidden(el)) continue;
    if (el.getAttribute("type") === "hidden") continue;
    if (!hasLabel(el)) bad.push({ what: "field", markup: shortMarkup(el) });
  }

  for (const el of host.querySelectorAll(CONTROLS)) {
    if (isHidden(el)) continue;
    if (accessibleName(el) === "") bad.push({ what: "control", markup: shortMarkup(el) });
  }

  return bad;
}

describe("every surface names what it shows and what it does", () => {
  it("leaves no unnamed graphic, field or control on any view", async () => {
    const bad: Unnamed[] = [];
    await tourEveryView("en-US", ({ view, connected, host }) => {
      for (const found of unnamedIn(host)) bad.push({ view, connected, ...found });
    });
    expect(bad).toEqual([]);
  });

  /*
   * THE MATCHER ITSELF, DRIVEN. A name-finder that returns something for
   * everything is a guard that reports nothing, forever — and this one had to
   * be written by hand because jsdom builds no accessibility tree.
   */
  it("knows a named control from a silent one", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    host.innerHTML = `
      <button type="button"><svg aria-hidden="true"></svg></button>
      <button type="button" aria-label="Close"><svg aria-hidden="true"></svg></button>
      <button type="button">Book the van</button>
      <svg role="img"></svg>
      <svg role="img"><title>A walnut coaster</title></svg>
      <svg role="img" aria-hidden="true"></svg>
      <input type="text" />
      <input type="text" aria-label="Your order number" />
      <label>Email <input type="email" /></label>
      <input type="text" placeholder="BR-0000" />
    `;
    const found = unnamedIn(host).map((f) => f.what);
    // one silent button, one unnamed svg, and two fields with only a
    // placeholder between them.
    expect(found).toEqual(["graphic", "field", "field", "control"]);
    host.remove();
  });
});
