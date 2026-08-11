/**
 * WHEREVER A COMPANY IS NAMED, THE LINE IS ON THE SAME SCREEN (24 AC6).
 *
 * @vitest-environment jsdom
 *
 * ── THE DEFECT ──────────────────────────────────────────────────────────────
 *
 * AC6, as amended 2026-08-09, is about a READER: a surface that names a real
 * company carries the line saying Adminium is not affiliated with it. Round 6
 * enforced that over the HOST's own components — `shelfClaims.test.tsx` fails
 * any file of ours that prints `addOn.name` or `addOn.monogram` without
 * mounting `Affiliation` — and that rule cannot see the surfaces an ADD-ON
 * draws, because the add-on's components are vendored and its copy is its own.
 *
 * So the first customer-facing surface that named a company had nothing on it.
 * The `artwork.sources` tile reads *"Bring it from Canva — Choose a design from
 * your account…"*, on the artwork screen, with the add-ons on; a DOM scan of
 * that screen for "affiliat" came back EMPTY. The line existed one press
 * further in, inside the flow the tile opens, which is precisely the
 * arrangement AC6's amendment was written against: a disclaimer a reader meets
 * after the naming is a disclaimer they may never meet.
 *
 * ── SO THIS ASKS THE READER'S QUESTION, ON EVERY SURFACE ────────────────────
 *
 * The whole app is toured — every view, every overlay, every surface a press
 * opens, add-ons off and then on, in every locale — and each surface is read as
 * a reader reads it:
 *
 *     if the text on this screen contains a company's mark,
 *     the text on this screen contains the not-affiliated line
 *
 * It is one rule over rendered text, so it holds for a surface an add-on draws,
 * a surface this app draws, and a surface neither of them has written yet.
 *
 * ── WHERE THE MARKS COME FROM, WHICH IS THE HALF THAT KEEPS DRIFTING ────────
 *
 * From the add-ons, never from here. Each package exports `COMPANY_MARKS` in
 * its own `add-on-facts.ts`, the sync vendors it, and this file globs whatever
 * THIS app has vendored — the mechanism round 5 built for `NOT_A_QUANTITY` and
 * round 6 used for `INERT_ORIGINS` and `NEVER_IN_A_BROWSER`. A host-local list
 * of marks would be this wave's most-repeated defect a sixth time: a gate that
 * knows about the add-ons that happened to exist when it was written, and is
 * silent about the next one.
 *
 * An add-on that names no company declares an empty list, and an empty list
 * costs nothing here: there is no word to look for.
 *
 * ── AND WHAT IT CANNOT DECIDE ───────────────────────────────────────────────
 *
 * Whether the line is legible, near the naming, or in a place a person looks.
 * It is on the same surface, in the same rendered text, and that is as far as
 * text goes: `getClientRects` returns zero for everything under jsdom, so
 * proximity is not a question this environment can answer at all. Round 6's
 * `shelfClaims.test.tsx` scopes its own assertions to the card, which is the
 * finer reading where the DOM has a card to scope to.
 */

import { describe, expect, it } from "vitest";

import "./registry.ts";
import { LOCALE_TAGS } from "../i18n/locales.ts";
import { MESSAGES } from "../i18n/messages/index.ts";
import { tourEveryView } from "../testing/tour.tsx";

/** Every mark declared by an add-on THIS app has vendored. */
const VENDORED_FACTS = import.meta.glob<{
  COMPANY_MARKS?: readonly { mark: string; owner: string }[];
}>("./vendor/*/add-on-facts.ts", { eager: true });

const MARKS: readonly { mark: string; owner: string }[] = Object.values(VENDORED_FACTS).flatMap(
  (module) => [...(module.COMPANY_MARKS ?? [])],
);

/**
 * EVERY WAY THE LINE IS SPELLED IN ONE LOCALE, which is more than one on
 * purpose.
 *
 * The host has its own `shop.notAffiliated`, and an add-on that names a company
 * carries its own `addon.<key>.notAffiliated` — the same sentence, translated
 * independently, because an add-on's copy is written and reviewed in the
 * add-on's repository and not here. In Danish the host says "dette firma" and
 * Canva Import says "dette selskab"; both are right and neither is a copy of
 * the other. So the rule is satisfied by ANY not-affiliated line in the merged
 * bundle rather than by the host's wording, which would quietly require every
 * add-on to say it in the host's words.
 *
 * The add-ons' keys are in `MESSAGES` because registration merges them at
 * module load — `add-ons/registry.ts`, imported above for exactly that reason.
 */
const disclaimers = (locale: string): string[] => {
  const bundle = (MESSAGES as Record<string, Record<string, string>>)[locale] ?? {};
  return Object.entries(bundle)
    .filter(([key]) => key === "shop.notAffiliated" || /^addon\..+\.notAffiliated$/.test(key))
    .map(([, value]) => flat(value));
};

const flat = (text: string): string => text.replace(/\s+/g, " ").trim();

/**
 * IS THIS MARK ACTUALLY NAMED HERE, or is it a run of letters inside a word?
 *
 * A plain `includes` reported the works' own product list, in English only:
 * **Canva**s prints. That is this app's product and not anybody's mark, and a
 * gate that reports it on five screens teaches its reader to skim the failure —
 * which is the same way every list in this wave was eventually beaten.
 *
 * So a mark counts when no LATIN letter touches it on either side. That keeps
 * "Canva 带进来" (Chinese copy naming the company) and drops "Canvas prints",
 * without either a carve-out list or a word-boundary rule that does not exist
 * in two of the eight languages.
 */
const namesMark = (text: string, mark: string): boolean =>
  new RegExp(`(?<![A-Za-z])${mark.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![A-Za-z])`).test(text);

/**
 * WHAT A CUSTOMER READS: the page without the reviewer's control strip.
 *
 * `.mp-dock` is the demo dock — a row of toggle chips, each labelled with an
 * add-on's name, floating over every view in the app. Two of those names
 * contain a mark ("DHL Shipping", "Canva Import"), so a scan that included it
 * would report every surface in the app, in eight languages, and be switched
 * off inside a week.
 *
 * It is the SAME exemption `shelfClaims.test.tsx` makes for the same file, with
 * the same reason, and it is the only one: the dock is the reviewer's control
 * strip rather than the shop's chrome, it is not in the published demo's
 * reading path, and a paragraph inside a toggle chip is not a surface. Every
 * other pixel of the app is in scope.
 */
const asRead = (host: HTMLElement): string[] => {
  const copy = host.cloneNode(true) as HTMLElement;
  for (const dock of copy.querySelectorAll(".mp-dock")) dock.remove();

  /*
   * STRING BY STRING, AND NOT ONE `textContent` FOR THE WHOLE PAGE.
   *
   * `textContent` runs adjacent elements together with no separator: a heading
   * ending in the carrier's name, followed by the shop's own name, is the
   * single run "DHLMarlow Press", and the boundary rule below then decides the
   * mark is part of a longer word and says nothing. That was measured, not
   * imagined — a planted "Ships with DHL" in an always-rendered component
   * passed this gate in one host while being on 31 surfaces.
   *
   * A TEXT NODE is a string somebody wrote, so its edges are real edges. The
   * four attributes are here because a person reads them too: an `aria-label`
   * is what a screen-reader user is told the button is.
   */
  const out: string[] = [];
  const walk = document.createTreeWalker(copy, NodeFilter.SHOW_TEXT);
  for (let node = walk.nextNode(); node !== null; node = walk.nextNode()) {
    const text = flat(node.textContent ?? "");
    if (text !== "") out.push(text);
  }
  for (const el of copy.querySelectorAll("*")) {
    for (const name of ["aria-label", "title", "alt", "placeholder"]) {
      const value = flat(el.getAttribute(name) ?? "");
      if (value !== "") out.push(value);
    }
  }
  return out;
};

describe("no surface names a company without the line (24 AC6)", () => {
  it("has marks to look for, from the add-ons rather than from here", () => {
    // Guard on the guard. A glob that stopped matching, or a package that
    // stopped exporting, would make every case below pass by having nothing to
    // find — which is how a gate goes quietly blind.
    expect(MARKS.length, "no COMPANY_MARKS were vendored at all").toBeGreaterThan(0);
    expect(MARKS.every((entry) => entry.mark.length > 1 && entry.owner.length > 1)).toBe(true);
    const lines = disclaimers("en-US");
    expect(lines.length, "no not-affiliated line is in the bundle at all").toBeGreaterThan(1);
    expect(lines.every((line) => line.length > 10)).toBe(true);
  });

  it.each(LOCALE_TAGS)("%s — every surface that names a company carries it", async (locale) => {
    const lines = disclaimers(locale);
    const offenders: string[] = [];

    await tourEveryView(locale, ({ view, surface, connected, host }) => {
      const strings = asRead(host);
      const named = MARKS.filter((entry) =>
        strings.some((text) => namesMark(text, entry.mark)),
      ).map((entry) => entry.mark);
      if (named.length === 0) return;
      // The LINE is looked for across the whole surface rather than in one
      // string: an add-on that renders it as two keys side by side has still
      // put it in front of the reader.
      const whole = strings.join(" ");
      if (lines.some((line) => whole.includes(line))) return;
      offenders.push(
        `${view}${surface === "" ? "" : ` · ${surface}`} (connected=${connected}) — names ${named.join(", ")}`,
      );
    });

    expect(
      [...new Set(offenders)],
      "\nThese surfaces name a company and do not carry the not-affiliated line " +
        "(24 AC6). The reader meets the company here, so the line belongs here — " +
        "not one press further in:\n" +
        [...new Set(offenders)].join("\n") +
        "\n",
    ).toEqual([]);
  });
});
