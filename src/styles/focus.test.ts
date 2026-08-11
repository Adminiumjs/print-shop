/**
 * A KEYBOARD USER CAN SEE WHERE THEY ARE — MEASURED, NOT EYEBALLED.
 *
 * ── THE DEFECT ──────────────────────────────────────────────────────────────
 *
 * `:focus-visible` drew `3px solid var(--accent-soft)`, and `--accent-soft` is
 * the accent at 10% (20% in dark) COMPOSITED OVER WHATEVER IS BEHIND IT. On this
 * app's own surfaces that ring measured 1.16:1 in light and 1.46:1 in dark. The
 * studio's was 1.18 and 1.44. WCAG 2.2 SC 1.4.11 asks for 3:1; at 1.16 the
 * standard is beside the point, because there is nothing on the screen to see.
 *
 * It shipped, in two apps, past four adversarial rounds, because a `--*-soft`
 * token in an outline reads as deliberate and nothing ever resolved it.
 *
 * ── WHY THIS TEST IS ARITHMETIC AND NOT A SNAPSHOT ──────────────────────────
 *
 * A test that asserted the string `var(--focus-ring)` would pass on the day
 * somebody redefined `--focus-ring` to a 10% mix, which is exactly how the
 * defect arrived: every rule LOOKED right. So this resolves the chain — token to
 * token, `color-mix` included — flattens any transparency onto the surface the
 * ring actually sits on, and computes the WCAG contrast. What it asserts is the
 * NUMBER a person would see.
 *
 * ── WHAT IT WOULD MISS, AND WHAT IS DONE ABOUT IT ───────────────────────────
 *
 * It reads the stylesheets, so a focus ring drawn from JavaScript, or in an
 * inline style, is outside it. The sweep below is the answer for everything that
 * IS in CSS: it walks `src/` — this app's stylesheets and every vendored add-on's
 * — and fails on any `:focus-visible` declaration that does not draw from the
 * measured token, so a new rule cannot be added quietly and an add-on cannot
 * bring its own dim one. A ring that never reaches CSS at all remains outside,
 * and that is said here rather than left to be discovered.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const STYLES = join(process.cwd(), "src/styles");

function css(file: string): string {
  return readFileSync(join(STYLES, file), "utf8");
}

/** Every `--name: value;` declaration in a block, in source order. */
function declarationsIn(block: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out.set(m[1]!, m[2]!.trim());
  return out;
}

/**
 * The token table for one theme.
 *
 * Light is every `:root` block that is not inside a dark selector; dark is those
 * plus the explicit `[data-theme="dark"]` overrides, which is how the cascade
 * actually resolves for a reader who has chosen dark.
 */
function tokensFor(theme: "light" | "dark"): Map<string, string> {
  const source = css("tokens.css");
  const table = new Map<string, string>();

  // Every top-level `:root { … }`, in order. Nested ones (inside the media
  // query) are matched separately below so the order of application is right.
  for (const m of source.matchAll(/(^|\n):root\s*\{([^}]*)\}/g)) {
    for (const [k, v] of declarationsIn(m[2]!)) table.set(k, v);
  }
  if (theme === "dark") {
    for (const m of source.matchAll(/:root\[data-theme="dark"\]\s*\{([^}]*)\}/g)) {
      for (const [k, v] of declarationsIn(m[1]!)) table.set(k, v);
    }
  }
  return table;
}

type Rgba = { r: number; g: number; b: number; a: number };

function parseHex(hex: string): Rgba | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (m === null) return null;
  let h = m[1]!;
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
    a: 1,
  };
}

/**
 * Resolve a CSS colour expression to straight RGBA.
 *
 * Handles the three forms these stylesheets use: a hex literal, `var(--token)`
 * with an optional fallback, and `color-mix(in srgb, <colour> N%, transparent)`
 * — which is where the whole defect lived, and which therefore has to be
 * evaluated rather than recognised.
 */
function resolve(expr: string, tokens: Map<string, string>, seen = new Set<string>()): Rgba {
  const value = expr.trim();

  const hex = parseHex(value);
  if (hex !== null) return hex;
  if (value === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
  if (value === "currentColor") throw new Error("currentColor has no value outside an element");

  const mix = /^color-mix\(\s*in\s+srgb\s*,\s*(.+?)\s+([\d.]+)%\s*,\s*(.+?)\s*\)$/i.exec(value);
  if (mix !== null) {
    const a = resolve(mix[1]!, tokens, seen);
    const pct = Number(mix[2]!) / 100;
    const b = resolve(mix[3]!, tokens, seen);
    return {
      r: a.r * pct + b.r * (1 - pct),
      g: a.g * pct + b.g * (1 - pct),
      b: a.b * pct + b.b * (1 - pct),
      a: a.a * pct + b.a * (1 - pct),
    };
  }

  const ref = /^var\(\s*(--[\w-]+)\s*(?:,\s*(.+))?\)$/.exec(value);
  if (ref !== null) {
    const name = ref[1]!;
    if (seen.has(name)) throw new Error(`the token ${name} refers to itself`);
    const next = tokens.get(name);
    if (next !== undefined) return resolve(next, tokens, new Set([...seen, name]));
    if (ref[2] !== undefined) return resolve(ref[2], tokens, seen);
    throw new Error(`no value for ${name}`);
  }

  throw new Error(`this test cannot resolve the colour “${value}”`);
}

/** Straight-alpha `over` composited onto opaque `under`. */
function flatten(over: Rgba, under: Rgba): Rgba {
  return {
    r: over.r * over.a + under.r * (1 - over.a),
    g: over.g * over.a + under.g * (1 - over.a),
    b: over.b * over.a + under.b * (1 - over.a),
    a: 1,
  };
}

function relativeLuminance({ r, g, b }: Rgba): number {
  const chan = (v: number): number => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
}

function contrast(a: Rgba, b: Rgba): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Every stylesheet this app loads — its own AND the add-ons' it vendors.
 *
 * Walked rather than listed: a stylesheet added tomorrow is swept tomorrow, and
 * a vendored add-on that arrives with one is swept the day it is vendored.
 */
function everyStylesheet(): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith(".css")) out.push(full);
    }
  };
  walk(join(process.cwd(), "src"));
  return out.sort();
}

/**
 * The surfaces a focus ring can land on.
 *
 * `outline-offset` puts a gap between the control and the ring, so what sits
 * behind the ring is the PAGE, never the control's own fill — which is why an
 * accent-coloured button does not need a case of its own here.
 */
const SURFACES = ["--bg", "--surface", "--surface-2", "--surface-3"] as const;

/** WCAG 2.2 SC 1.4.11, non-text contrast. */
const FLOOR = 3;

describe("the focus ring is visible to the person using it", () => {
  for (const theme of ["light", "dark"] as const) {
    it(`clears ${FLOOR}:1 against every surface in ${theme}`, () => {
      const tokens = tokensFor(theme);
      const ring = resolve("var(--focus-ring)", tokens);
      const measured = SURFACES.map((name) => {
        const surface = resolve(`var(${name})`, tokens);
        return {
          surface: name,
          ratio: Number(contrast(flatten(ring, surface), surface).toFixed(2)),
        };
      });
      const failing = measured.filter((m) => m.ratio < FLOOR);
      expect(failing, `\n${JSON.stringify(measured, null, 2)}\n`).toEqual([]);
    });
  }

  /**
   * THE GUARD ON THE GUARD, and the one that would have caught the original.
   *
   * Everything above is true of `--focus-ring` and says nothing about whether
   * any rule USES it. The defect was a rule pointing at the wrong token, so a
   * test that only measured the right token would have passed throughout.
   */
  /**
   * ── WHAT THE PATTERN THIS REPLACES COULD NOT SEE ──────────────────────────
   *
   * The sweep was `/(outline|box-shadow)\s*:\s*([^;]+);/` over
   * `/:focus-visible[^{]*\{([^}]*)\}/`, and it is a fingerprint of the four
   * stylesheets it was written against. Four shapes walk straight through it,
   * and each one puts back exactly the ring this file exists to keep out:
   *
   *   THE LONGHANDS. Having matched `outline` the pattern demands a `:` and
   *   finds a `-`, so `outline-color: #d9d9d9` is not a declaration it has ever
   *   seen. A rule may therefore set the shorthand from the token and then
   *   override the COLOUR, in the same block, invisibly.
   *
   *   THE LAST DECLARATION IN A BLOCK. `{ outline: 1px solid #ddd }` with no
   *   trailing semicolon is legal CSS, is what a minifier writes, and did not
   *   match a pattern that ended in `;`.
   *
   *   A TOKEN THAT MERELY STARTS THE SAME. `value.includes("var(--focus-ring")`
   *   accepts `var(--focus-ring-soft)` — the prefix-inherits hole `egress.ts`
   *   documents for origins, in the one file whose whole subject is a token
   *   that was quietly the wrong one.
   *
   *   AND `:focus` ITSELF, which is the one that matters most and is the reason
   *   the rule below is not simply "the same pattern, wider". Read on.
   *
   * ── WHAT A KEYBOARD USER ACTUALLY GETS, WHICH IS THE RULE ─────────────────
   *
   * Widening the block finder to any `:focus…` selector reports this, in both
   * apps, and it is CORRECT CSS:
   *
   *     .fld:focus         { border-color: var(--accent);
   *                          box-shadow: 0 0 0 3px var(--accent-soft);
   *                          outline: none; }
   *     .fld:focus-visible { outline: 3px solid var(--focus-ring);
   *                          outline-offset: 2px; }
   *
   * The soft glow is the RESTING LOOK of a field somebody clicked into, and a
   * pointer user does not need a 3:1 indicator to find the caret they placed.
   * What a keyboard user gets is the second rule — same specificity, declared
   * after, so it wins wherever `:focus-visible` matches.
   *
   * That pair is also why the check cannot just be "no dim colour anywhere near
   * `:focus`": a guard that fires on correct CSS acquires an exemption list,
   * and an exemption list is where every hole this wave has found came from.
   *
   * So the rule is about the KEYBOARD ring, in two halves:
   *
   *   1. A `:focus-visible` or `:focus-within` rule IS the keyboard indicator.
   *      Every colour it draws the ring with must be the measured token.
   *
   *   2. A bare `:focus` rule may decorate however it likes — UNLESS it takes
   *      the outline away. `outline: none` at a specificity that beats the
   *      global `:focus-visible` rule blinds the keyboard user, and the only
   *      thing that puts the ring back is a `:focus-visible` rule for the SAME
   *      selector. Its absence is the finding; the glow's colour is not.
   *
   * The second half is what the `.fld` pair satisfies, and what a vendored
   * add-on shipping `outline: none` and a 2px grey shadow does not.
   */

  /** Properties that decide what a focus ring LOOKS like, colour included. */
  const RING_COLOUR = /^(?:-webkit-|-moz-)?(?:outline|outline-color|box-shadow)$/;

  /**
   * Values that draw no ring at all, so there is no colour to measure.
   *
   * `outline: none` has always been allowed inside a `:focus-visible` block: a
   * rule is free to drop the outline and draw the ring with a box-shadow
   * instead, and the arithmetic above is what says the token is visible.
   */
  const DRAWS_NOTHING = /^(none|0|0px|unset|initial|revert|inherit)$/;

  /** `var(--focus-ring)` or `var(--focus-ring, fallback)` — never a longer name. */
  const FROM_TOKEN = /var\(\s*--focus-ring\s*[,)]/;

  /** `:focus` on its own, never the `-visible` or `-within` that start the same. */
  const BARE_FOCUS = /:focus(?![\w-])/;

  /** Every `property: value` inside one declaration block, lower-cased keys. */
  const declarationsIn = (block: string): [string, string][] =>
    block
      .split(";")
      .map((one) => one.trim())
      .filter((one) => one !== "")
      .flatMap((one) => {
        const at = one.indexOf(":");
        if (at < 0) return [];
        return [[one.slice(0, at).trim().toLowerCase(), one.slice(at + 1).trim()]] as [
          string,
          string,
        ][];
      });

  /**
   * Every rule in a stylesheet, as selector and declaration block.
   *
   * An at-rule's prelude is skipped for free: `[^{}]*` cannot swallow the inner
   * `{`, so `@media …` never matches and the rules nested inside it do.
   */
  const rulesIn = (source: string): [string, string][] =>
    [...source.replace(/\/\*[\s\S]*?\*\//g, " ").matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter((rule) => !rule[1]!.includes("@"))
      .flatMap((rule) =>
        rule[1]!
          .split(",")
          .map((selector) => selector.trim())
          .filter((selector) => selector !== "")
          .map((selector) => [selector, rule[2]!] as [string, string]),
      );

  /** The selector with its focus pseudo-class taken off — what a pair shares. */
  const baseOf = (selector: string) => selector.replace(/:focus[\w-]*/g, "").trim();

  /**
   * Everything wrong with the focus rings in one stylesheet. See the header for
   * the two halves; the cases below drive both over the shapes that beat the
   * pattern this replaced.
   */
  const focusFindings = (source: string): string[] => {
    const rules = rulesIn(source).filter(([selector]) => selector.includes(":focus"));
    /** Selectors whose `:focus-visible` really does draw the measured ring. */
    const measured = new Set(
      rules
        .filter(([selector]) => !BARE_FOCUS.test(selector))
        .filter(([, block]) =>
          declarationsIn(block).some(
            ([property, value]) => RING_COLOUR.test(property) && FROM_TOKEN.test(value),
          ),
        )
        .map(([selector]) => baseOf(selector)),
    );

    const out: string[] = [];
    for (const [selector, block] of rules) {
      const declarations = declarationsIn(block);
      if (BARE_FOCUS.test(selector)) {
        // Half two: a decoration is free, taking the ring away is not.
        const kills = declarations.some(
          ([property, value]) =>
            /^outline(-width|-style)?$/.test(property) &&
            DRAWS_NOTHING.test(value.replace(/\s*!important$/i, "").trim().toLowerCase()),
        );
        if (kills && !measured.has(baseOf(selector))) {
          out.push(
            `${selector}: takes the outline away and no ${baseOf(selector)}:focus-visible rule draws the measured ring back`,
          );
        }
        continue;
      }
      // Half one: this rule IS the keyboard indicator.
      for (const [property, raw] of declarations) {
        if (!RING_COLOUR.test(property)) continue;
        const value = raw.replace(/\s*!important$/i, "").trim();
        if (DRAWS_NOTHING.test(value.toLowerCase())) continue;
        if (FROM_TOKEN.test(value)) continue;
        out.push(`${selector}: ${property}: ${value}`);
      }
    }
    return out;
  };

  it("draws every focus ring from the measured token, in every stylesheet", () => {
    const files = everyStylesheet();
    // A sweep over nothing passes: this is the count that says it found the
    // vendored add-on stylesheets as well as this app's own.
    expect(files.length, "no stylesheets were swept at all").toBeGreaterThan(4);

    const wrong = files.flatMap((file) =>
      focusFindings(readFileSync(file, "utf8")).map(
        (finding) => `${relative(process.cwd(), file)}: ${finding}`,
      ),
    );
    expect(wrong, `\n${wrong.join("\n")}\n`).toEqual([]);
  });

  /**
   * THE MUTANTS, DRIVEN THROUGH THE SWEEP ITSELF.
   *
   * Every shape in the first half is a keyboard user who cannot see where they
   * are, and every one of them was read as clean by the pattern this replaced.
   * Every shape in the second is real CSS out of these stylesheets that must go
   * on passing — including the `:focus` / `:focus-visible` pair, which is the
   * case that decides whether this is a rule or one more list. A sweep that
   * stopped seeing any of the first, or started reporting any of the second,
   * fails here rather than reporting nothing forever.
   */
  it("still bites on the shapes the old pattern let through", () => {
    const dim: [string, string][] = [
      [
        "a longhand colour after a good shorthand",
        ".b:focus-visible { outline: 2px solid var(--focus-ring); outline-color: #d9d9d9; }",
      ],
      ["a longhand colour alone", ".b:focus-visible { outline-color: rgba(0,0,0,.06); }"],
      ["no trailing semicolon", ".b:focus-visible { outline: 1px solid #ddd }"],
      [":focus-within", ".b:focus-within { box-shadow: 0 0 0 2px #eee; }"],
      [
        "a token that merely starts the same",
        ".b:focus-visible { outline: 2px solid var(--focus-ring-soft); }",
      ],
      ["an !important override", ".b:focus-visible { outline-color: #ccc !important; }"],
      ["a vendor prefix", ".b:focus-visible { -webkit-box-shadow: 0 0 0 2px #eee; }"],
      [
        "an add-on that blinds the keyboard user and puts a grey glow back",
        ".ds-chip:focus { outline: none; box-shadow: 0 0 0 2px #eee; }",
      ],
      [
        "the same, spelt with a longhand",
        ".ds-chip:focus { outline-style: none; box-shadow: 0 0 0 2px #eee; }",
      ],
      [
        "a pair whose second half draws the wrong colour",
        ".fld:focus { outline: none; } .fld:focus-visible { outline: 3px solid var(--accent-soft); }",
      ],
      ["inside a media query", "@media (min-width: 40em) { .b:focus-visible { outline: 1px solid #ddd; } }"],
    ];
    for (const [what, source] of dim) {
      expect(focusFindings(source), `${what} was not reported`).not.toEqual([]);
    }

    const fine: [string, string][] = [
      [
        "the app's own rule",
        ".b:focus-visible { outline: 3px solid var(--focus-ring); outline-offset: 2px; }",
      ],
      [
        "an add-on's host-independent fallback",
        ".b:focus-visible { outline: 2px solid var(--focus-ring, currentColor); }",
      ],
      [
        "a ring handed to a box-shadow",
        ".b:focus-visible { outline: none; box-shadow: 0 0 0 3px var(--focus-ring); }",
      ],
      [
        "a width and a style, which carry no colour",
        ".b:focus-visible { outline-width: 3px; outline-style: solid; }",
      ],
      ["something that is not a ring at all", ".b:focus-visible { background: var(--surface-2); }"],
      ["a rule with no focus in it", ".b:hover { outline: 1px solid #ddd; }"],
      [
        "the field pair these apps really ship",
        ".fld:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); outline: none; }" +
          " .fld:focus-visible { outline: 3px solid var(--focus-ring); outline-offset: 2px; }",
      ],
      [
        "a pointer glow that leaves the global ring alone",
        ".b:focus { box-shadow: 0 0 0 3px var(--accent-soft); }",
      ],
    ];
    for (const [what, source] of fine) {
      expect(focusFindings(source), `${what} was reported and should not be`).toEqual([]);
    }
  });

  /**
   * THE VENDORED ADD-ONS ARE IN SCOPE, and that is not a detail.
   *
   * An add-on's stylesheet is loaded into these pages and draws focus rings on
   * controls a customer of THIS shop tabs to. Both add-ons that define one had
   * the same 1.16:1 ring, for the same reason, and a sweep over `src/styles/`
   * alone would have called this app fixed while two of its screens were not.
   *
   * They point at `var(--focus-ring, currentColor)`: the token when the host has
   * one, and the focused element's own text colour when it does not, so an
   * add-on installed in some other host never goes blind.
   */
  it("sweeps the vendored add-on stylesheets too, not only this app's own", () => {
    const vendored = everyStylesheet().filter((f) => f.includes("/vendor/"));
    expect(vendored.length, "no vendored add-on stylesheet was found").toBeGreaterThan(0);
    for (const file of vendored) {
      const source = readFileSync(file, "utf8");
      if (!source.includes(":focus-visible")) continue;
      expect(
        source,
        `${relative(process.cwd(), file)} draws a focus ring with no host-independent fallback`,
      ).toContain("var(--focus-ring, currentColor)");
    }
  });

  /**
   * AND THE ARITHMETIC ITSELF, driven over the value that shipped.
   *
   * `--accent-soft` is still a real token with a real job, so the number this
   * test reports for it can be checked against the number measured by hand off
   * a running browser: 1.16:1 in light. A resolver that quietly returned the
   * accent for it — by ignoring the `color-mix`, say — would make every case
   * above pass forever.
   */
  it("reports the ring that shipped as the invisible thing it was", () => {
    const tokens = tokensFor("light");
    const soft = resolve("var(--accent-soft)", tokens);
    const surface = resolve("var(--surface)", tokens);
    const ratio = contrast(flatten(soft, surface), surface);
    expect(soft.a, "the soft token is translucent, or the mix was not evaluated").toBeLessThan(0.25);
    expect(ratio).toBeLessThan(1.3);
    expect(ratio).toBeGreaterThan(1);
  });

  it("computes a contrast a reference case agrees with", () => {
    // Black on white is 21:1 exactly; a mid grey on white is 5.32:1. If these
    // two drift, every number above is decoration.
    const white = { r: 255, g: 255, b: 255, a: 1 };
    expect(contrast({ r: 0, g: 0, b: 0, a: 1 }, white)).toBeCloseTo(21, 5);
    expect(contrast({ r: 117, g: 117, b: 117, a: 1 }, white)).toBeCloseTo(4.6, 1);
  });
});
