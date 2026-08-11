/**
 * THIS SHOP DOES EVERYTHING THE SHELF'S HOSTS ARE REQUIRED TO DO.
 *
 * @vitest-environment jsdom
 *
 * `testing/host-behaviours.ts` is the shared list, mirrored byte for byte from
 * `add-ons/packages/host` (`host-mirror.test.ts` there fails if the three copies
 * drift). This file is this shop's side of it: every id in the list is mapped to
 * the case that demonstrates it HERE.
 *
 * ── WHY A LIST AND NOT JUST THE CASES ───────────────────────────────────────
 *
 * Because the defect being prevented is not a missing test, it is a missing
 * PORT. Four times in this wave a repair landed in the shop where it was noticed
 * and nowhere else, and each time the other shop's suite was completely green —
 * it had never been asked the question.
 *
 * Adding a behaviour to the shared list turns that around: the shop that has not
 * done the work goes red on its next run, naming the id and the defect that put
 * it there. The reason a port does not happen is that nobody knows it is owed,
 * and this is what says so.
 *
 * ── WHAT THIS DOES NOT CLAIM ────────────────────────────────────────────────
 *
 * That either shop is correct. A host satisfies the list by mapping every id to
 * a case, and this file cannot judge whether that case is any good — a reviewer
 * does that, in the file the case lives in. What becomes impossible is the
 * ASYMMETRY: one shop cannot quietly know something the other does not.
 *
 * So the mapping points at real suites by path, and the paths are checked to
 * exist. A behaviour mapped to a file that was deleted or renamed is a behaviour
 * nothing demonstrates, and reads as one.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { HOST_BEHAVIOURS } from "./host-behaviours.ts";

/**
 * Where this shop demonstrates each behaviour.
 *
 * A behaviour may be shown in more than one place — the digit rule is both a
 * formatter and a screen — and all of them are named, because a reviewer
 * following an id wants every place it is held.
 */
const SHOWN_IN: Readonly<Record<string, readonly string[]>> = {
  "slot-keeps-host-content-when-a-fill-draws-nothing": [
    // "keeps the host's own content when a fill has nothing to draw", plus the
    // stylesheet half beside it.
    "src/add-ons/slotRender.test.tsx",
    "src/components/AddOnSlot.tsx",
    "src/styles/components.css",
  ],
  "digits-are-accepted-in-the-readers-own-numeral-system": [
    // This shop's numeric fields are `type="number"`, which the platform draws
    // in the reader's own digits and hands back as a wire format — so there is
    // no hand-rolled digit filter here to get wrong. The tour reads every input
    // VALUE on an Arabic page, which is what would catch one arriving.
    "src/i18n/numerals.arabic.test.tsx",
    "src/screens/Customer.tsx",
  ],
  "a-unit-is-a-word-in-the-readers-language": [
    "src/i18n/numerals.arabic.test.tsx",
    "src/lib/format.ts",
    "src/i18n/strings/chrome.ts",
  ],
  "money-is-formatted-never-typed": ["src/i18n/messages.test.ts", "src/lib/format.ts"],
  "the-focus-ring-is-visible-and-measured": ["src/styles/focus.test.ts", "src/styles/tokens.css"],
  "the-tour-gets-inside-an-add-ons-own-flow": ["src/testing/tour.test.tsx", "src/testing/tour.tsx"],
  "the-documented-test-command-passes-on-a-clean-tree": [
    // "the test command a reader is given is the one that is configured"
    "src/sources.test.ts",
    "vite.config.ts",
  ],
  "a-host-greps-its-own-sources-for-an-add-ons-secrets": [
    "src/sources.test.ts",
    "src/builtOutput.test.ts",
  ],
  "an-add-on-brings-its-own-facts-for-a-hosts-gates": [
    "src/sources.test.ts",
    "src/builtOutput.test.ts",
    "src/i18n/numerals.arabic.test.tsx",
    "src/add-ons/vendor/shipping-dhl/add-on-facts.ts",
  ],
  "the-focus-sweep-reads-every-focus-rule-and-both-longhands": ["src/styles/focus.test.ts"],
  "a-fill-that-drew-nothing-leaves-the-hosts-own-content-alone": [
    // The rule, its mutants, the component that applies it and the two-condition
    // selector it feeds.
    "src/add-ons/slotContent.ts",
    "src/add-ons/slotContent.test.ts",
    "src/components/AddOnSlot.tsx",
    "src/styles/components.css",
  ],
  "every-surface-that-names-a-company-carries-the-line": [
    "src/add-ons/shelfClaims.test.tsx",
    "src/components/Affiliation.tsx",
    "src/add-ons/addOns.test.ts",
  ],
  "a-tour-opens-a-surface-with-what-the-app-would-open-it-with": [
    "src/testing/tour.test.tsx",
    "src/testing/tour.tsx",
  ],
  "no-copy-changes-in-any-language-without-a-reviewer-reading-it": [
    "src/i18n/reviewedCopy.test.ts",
    "src/i18n/reviewed-copy.json",
  ],
};

describe("this shop satisfies every behaviour the shared list requires", () => {
  it("maps every declared behaviour to somewhere it is demonstrated", () => {
    const unmapped = HOST_BEHAVIOURS.filter(
      (behaviour) => (SHOWN_IN[behaviour.id] ?? []).length === 0,
    ).map((behaviour) => `${behaviour.id}\n    must: ${behaviour.must}\n    because: ${behaviour.because}`);
    expect(
      unmapped,
      "\nThe shared behaviour list requires something this shop has not done or has not " +
        "pointed at. Port it, then name where it lives:\n\n" +
        unmapped.join("\n\n") +
        "\n",
    ).toEqual([]);
  });

  it("names no behaviour the shared list does not declare", () => {
    // The other direction: a mapping left behind after a behaviour is dropped
    // reads as coverage this shop no longer has any claim to.
    const declared = new Set(HOST_BEHAVIOURS.map((b) => b.id));
    const stale = Object.keys(SHOWN_IN).filter((id) => !declared.has(id));
    expect(stale, `\n${stale.join("\n")}\n`).toEqual([]);
  });

  it("points at files that exist", () => {
    const missing: string[] = [];
    for (const [id, paths] of Object.entries(SHOWN_IN)) {
      for (const path of paths) {
        if (!existsSync(join(process.cwd(), path))) missing.push(`${id} → ${path}`);
      }
    }
    expect(missing, `\n${missing.join("\n")}\n`).toEqual([]);
  });

  it("carries a list that is worth reading", () => {
    // Guard on the guard: an empty list, or one whose entries say nothing,
    // would make every case above pass forever.
    expect(HOST_BEHAVIOURS.length).toBeGreaterThan(3);
    for (const behaviour of HOST_BEHAVIOURS) {
      expect(behaviour.must.length, `${behaviour.id} says nothing`).toBeGreaterThan(60);
      expect(behaviour.because.length, `${behaviour.id} gives no reason`).toBeGreaterThan(60);
    }
  });
});
