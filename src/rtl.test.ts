// @vitest-environment jsdom
/**
 * RIGHT TO LEFT BY LOGICAL PROPERTIES, NEVER BY A SIDE.
 *
 * Arabic is one of the shop's languages, and the shop and the works mirror
 * under `dir="rtl"` because every box is placed by its inline START and END
 * (`margin-inline-start`, `inset-inline-end`, `text-align: start`), never by
 * a left or a right. One `margin-left` and a row's icon sits on the wrong
 * side of its words in Arabic, in a screen nobody reading English looks at.
 *
 * Three checks:
 *   1. every stylesheet the shop and the works ship (their own, and every
 *      sheet their code imports) is read declaration by declaration, and a
 *      physical side is refused: the `-left`/`-right` properties, `left:` and
 *      `right:`, `left`/`right` keywords, a shorthand whose two inline sides
 *      differ, a corner by its physical name, and a `translateX(` with no
 *      right-to-left counterpart;
 *   2. the shop's and the works' code has no inline `style` and no "left"
 *      or "right" as a value;
 *   3. a screen of each side, drawn in Arabic with those stylesheets on the
 *      page, has no element whose left and right differ.
 *
 * A deliberate physical side (a picture that must not mirror, a chart's
 * axis) is named in `ALLOWED` with the reason, by file, selector and
 * property; an entry that matches nothing fails too, so the list stays true.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../vendor/customiser/index.js", () => ({
  CustomiserEditor: () => null,
  YourDesigns: () => null,
  designRefusal: () => null,
  heldDesign: () => null,
  hasSavedDesigns: (held: readonly unknown[]) => held.length > 0,
  openSavedLink: async () => "unknown",
  readDesigns: async () => [],
}));
vi.mock("../vendor/customiser/editor.css", () => ({}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const SRC = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SRC, "..");
/** The two sides' folders: the shop, and the works (`studio/`). */
const SIDES = ["shop", "studio"] as const;

// ── the files ─────────────────────────────────────────────────────────────

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

type Side = (typeof SIDES)[number];

/** The code a side ships: its `.ts` and `.tsx`, not its tests or its test stand-ins. */
const codeOf = (sides: readonly Side[]) => sides.flatMap((side) => walk(join(SRC, side))).filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f) && !/[/\\]testing[/\\]|testing\.ts$/.test(f));
const CODE = codeOf(SIDES);

/** The app's shared sheets (`src/styles/`: the tokens and the base), which both sides' entries load. */
const SHARED = "styles";

/** Every stylesheet a side ships: its own, the shared ones, and each one its code or its sheets import, followed. */
function stylesheets(sides: readonly Side[] = SIDES): { sheets: string[]; missing: string[] } {
  const found = new Set<string>([...sides, SHARED].flatMap((dir) => walk(join(SRC, dir)).filter((f) => f.endsWith(".css"))));
  const missing: string[] = [];
  for (const file of codeOf(sides)) {
    for (const [, spec] of readFileSync(file, "utf8").matchAll(/import\s+["']([^"']+\.css)["']/g)) found.add(resolve(dirname(file), spec!));
  }
  const queue = [...found];
  while (queue.length > 0) {
    const sheet = queue.pop()!;
    let css: string;
    try {
      css = readFileSync(sheet, "utf8");
    } catch {
      missing.push(relative(ROOT, sheet));
      found.delete(sheet);
      continue;
    }
    for (const [, spec] of css.matchAll(/@import\s+(?:url\()?["']([^"']+)["']/g)) {
      const next = resolve(dirname(sheet), spec!);
      if (!found.has(next)) {
        found.add(next);
        queue.push(next);
      }
    }
  }
  return { sheets: [...found].sort(), missing };
}

// ── reading a stylesheet ──────────────────────────────────────────────────

interface Declaration {
  file: string;
  line: number;
  /** The selectors and at-rules it sits in, outermost first. */
  within: string[];
  prop: string;
  value: string;
}

/** Each declaration of a sheet, with where it sits. Comments are blanked, keeping the line count. */
function declarations(file: string, css: string): Declaration[] {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "));
  const out: Declaration[] = [];
  const stack: string[] = [];
  let buffer = "";
  let start = 1;
  let line = 1;
  let quote: string | null = null;
  let depth = 0;
  const flush = () => {
    const said = buffer.trim();
    const colon = said.indexOf(":");
    if (said !== "" && colon > 0 && !said.startsWith("@")) {
      out.push({ file, line: start + (buffer.slice(0, buffer.indexOf(said)).match(/\n/g)?.length ?? 0), within: [...stack], prop: said.slice(0, colon).trim().toLowerCase(), value: said.slice(colon + 1).trim() });
    }
    buffer = "";
    start = line;
  };
  for (const ch of text) {
    if (quote !== null) {
      buffer += ch;
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      buffer += ch;
    } else if (ch === "(") {
      depth += 1;
      buffer += ch;
    } else if (ch === ")") {
      depth -= 1;
      buffer += ch;
    } else if (ch === "{" && depth === 0) {
      stack.push(buffer.trim().replace(/\s+/g, " "));
      buffer = "";
      start = line;
    } else if (ch === "}" && depth === 0) {
      flush();
      stack.pop();
    } else if (ch === ";" && depth === 0) {
      flush();
    } else buffer += ch;
    if (ch === "\n") line += 1;
  }
  return out;
}

/** A value's top-level words: `0 8px calc(1px + 2px) 4px` → four. */
function words(value: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let word = "";
  for (const ch of value.replace(/!important$/, "").trim()) {
    if (ch === "(") depth += 1;
    if (ch === ")") depth -= 1;
    if (/\s/.test(ch) && depth === 0) {
      if (word !== "") out.push(word);
      word = "";
    } else word += ch;
  }
  if (word !== "") out.push(word);
  return out;
}

const SIDE_SHORTHANDS = new Set(["margin", "padding", "inset", "scroll-margin", "scroll-padding", "border-width", "border-style", "border-color"]);

/** Why a declaration places something by a physical side, or null when it does not. */
function physical(d: Declaration): string | null {
  const { prop, value } = d;
  if (/^(margin|padding|scroll-margin|scroll-padding)-(left|right)$/.test(prop)) return `${prop}: use the -inline-start / -inline-end form`;
  if (/^border-(left|right)(-|$)/.test(prop)) return `${prop}: use border-inline-start / border-inline-end`;
  if (prop === "left" || prop === "right") return `${prop}: use inset-inline-start / inset-inline-end`;
  if (/^border-(top|bottom)-(left|right)-radius$/.test(prop)) return `${prop}: use border-start-start-radius and its kin`;
  if (/^(text-align|float|clear|justify-content|justify-items|justify-self|caption-side)$/.test(prop) && /\b(left|right)\b/.test(value)) return `${prop}: ${value}: use start / end (inline-start / inline-end)`;
  if (/^(background-position|background-position-x|object-position|transform-origin|mask-position)$/.test(prop) && /\b(left|right)\b/.test(value)) return `${prop}: ${value}: a physical side`;
  if (SIDE_SHORTHANDS.has(prop)) {
    const w = words(value);
    if (w.length === 4 && w[1] !== w[3]) return `${prop}: ${value}: its right (${w[1]}) and left (${w[3]}) differ; use the -inline form`;
  }
  if (prop === "border-radius") {
    for (const part of value.split("/")) {
      const w = words(part);
      const lopsided = (w.length === 2 && w[0] !== w[1]) || (w.length === 3 && (w[0] !== w[1] || w[1] !== w[2])) || (w.length === 4 && (w[0] !== w[1] || w[2] !== w[3]));
      if (lopsided) return `border-radius: ${value}: corners named by side; use border-start-start-radius and its kin`;
    }
  }
  const mirrored = d.within.some((s) => /\[dir=["']?rtl/.test(s) || /:dir\(rtl\)/.test(s)) || /var\(--mp-dir\b/.test(value);
  if (!mirrored) {
    if (/\btranslateX\(/.test(value)) return `${prop}: ${value}: translateX with no right-to-left counterpart`;
    const two = /\btranslate(?:3d)?\(\s*([^,)]+)\s*,/.exec(value);
    if (two !== null && !/^0(px|%)?$/.test(two[1]!.trim())) return `${prop}: ${value}: a horizontal translate with no right-to-left counterpart`;
    if (prop === "translate" && words(value).length > 0 && !/^0(px|%)?$/.test(words(value)[0]!)) return `translate: ${value}: a horizontal translate with no right-to-left counterpart`;
  }
  return null;
}

/**
 * The physical sides meant: a file (from the app's root), a selector it sits
 * in (a part of the rule's prelude), the property, and why it must not mirror.
 */
const ALLOWED: { file: string; within: string; prop: string; why: string }[] = [];

const allowed = (d: Declaration) => ALLOWED.find((a) => relative(ROOT, d.file) === a.file && a.prop === d.prop && d.within.some((w) => w.includes(a.within)));

describe("the stylesheets the shop and the works ship", () => {
  const { sheets, missing } = stylesheets();

  it("are all there, and include each side's own and every shared sheet", () => {
    expect(missing, "imported but not there").toEqual([]);
    for (const side of SIDES) expect(sheets.some((s) => s.startsWith(join(SRC, side))), side).toBe(true);
    const shared = readdirSync(join(SRC, SHARED)).filter((n) => n.endsWith(".css"));
    expect(shared.length).toBeGreaterThan(1);
    for (const side of SIDES) for (const name of shared) expect(stylesheets([side]).sheets, `${side} ${name}`).toContain(join(SRC, SHARED, name));
  });

  it("place nothing by a physical side", () => {
    const hits = sheets.flatMap((file) =>
      declarations(file, readFileSync(file, "utf8"))
        .filter((d) => physical(d) !== null && allowed(d) === undefined)
        .map((d) => `${relative(ROOT, d.file)}:${d.line} ${d.within.at(-1) ?? ""} — ${physical(d)!}`),
    );
    expect(hits).toEqual([]);
  });

  it("allow only the physical sides that are there, each with its reason", () => {
    const all = sheets.flatMap((file) => declarations(file, readFileSync(file, "utf8")));
    for (const entry of ALLOWED) {
      expect(entry.why.trim(), `${entry.file} ${entry.within} ${entry.prop}`).not.toBe("");
      expect(
        all.some((d) => physical(d) !== null && allowed(d) === entry),
        `allowed but not there: ${entry.file} ${entry.within} ${entry.prop}`,
      ).toBe(true);
    }
  });

  it("are read whole: the reader finds the declarations, sides and all", () => {
    const sample = declarations("x.css", '@media (width < 600px) {\n  .a { margin: 0 4px 0 8px; content: "a;b"; }\n}\n[dir="rtl"] .b { transform: translateX(-4px); }\n.c { margin-left: 2px }');
    expect(sample.map((d) => [d.line, d.prop, d.within.at(-1)])).toEqual([
      [2, "margin", ".a"],
      [2, "content", ".a"],
      [4, "transform", '[dir="rtl"] .b'],
      [5, "margin-left", ".c"],
    ]);
    expect(sample.map((d) => physical(d) !== null)).toEqual([true, false, false, true]);
    for (const [prop, value] of [
      ["padding-right", "4px"],
      ["right", "0"],
      ["border-left", "1px solid"],
      ["border-top-left-radius", "4px"],
      ["text-align", "left"],
      ["float", "right"],
      ["border-radius", "4px 0 0 4px"],
      ["transform", "translateX(10px)"],
      ["transform", "translate(10px, 0)"],
    ] as const)
      expect(physical({ file: "x.css", line: 1, within: [".x"], prop, value }), `${prop}: ${value}`).not.toBeNull();
    for (const [prop, value] of [
      ["margin", "0 4px 0 4px"],
      ["inset-inline-start", "0"],
      ["text-align", "start"],
      ["border-radius", "4px"],
      ["border-start-start-radius", "4px"],
      ["transform", "translateX(calc(-102% * var(--mp-dir, 1)))"],
      ["transform", "translateY(8px) scale(0.98)"],
    ] as const)
      expect(physical({ file: "x.css", line: 1, within: [".x"], prop, value }), `${prop}: ${value}`).toBeNull();
  });
});

describe("the shop's and the works' code", () => {
  const lines = CODE.flatMap((file) =>
    readFileSync(file, "utf8")
      .split("\n")
      .map((text, i) => ({ where: `${relative(ROOT, file)}:${i + 1}`, text })),
  );

  it("draws nothing with an inline style", () => {
    expect(lines.filter((l) => /\bstyle=\{|\bstyle="|\.style\.[a-z]|setAttribute\(\s*["']style["']/.test(l.text)).map((l) => `${l.where} ${l.text.trim()}`)).toEqual([]);
  });

  it("names no side as a value", () => {
    expect(lines.filter((l) => /["'`](left|right)["'`]/.test(l.text)).map((l) => `${l.where} ${l.text.trim()}`)).toEqual([]);
  });
});

// ── a screen of each side, drawn right to left ────────────────────────────

let root: Root | null = null;

afterEach(async () => {
  await act(async () => root?.unmount());
  root = null;
  document.head.querySelectorAll("style[data-rtl-test]").forEach((s) => s.remove());
  document.body.replaceChildren();
  localStorage.clear();
});

/** Put the side's stylesheets on the page, as its build would. */
function styleThePage(side: Side): number {
  let rules = 0;
  for (const file of stylesheets([side]).sheets) {
    const style = document.createElement("style");
    style.dataset["rtlTest"] = relative(ROOT, file);
    style.textContent = readFileSync(file, "utf8");
    document.head.append(style);
    rules += style.sheet?.cssRules.length ?? 0;
  }
  return rules;
}

const PAIRS = [
  ["marginLeft", "marginRight"],
  ["paddingLeft", "paddingRight"],
  ["left", "right"],
  ["borderLeftWidth", "borderRightWidth"],
  ["borderLeftStyle", "borderRightStyle"],
  ["borderTopLeftRadius", "borderTopRightRadius"],
  ["borderBottomLeftRadius", "borderBottomRightRadius"],
] as const;

/** Every element whose two inline sides are set differently, or that is aligned or floated to a side. */
function lopsided(): string[] {
  const out: string[] = [];
  for (const el of document.body.querySelectorAll<HTMLElement>("*")) {
    const name = `${el.tagName.toLowerCase()}${el.className && typeof el.className === "string" ? `.${el.className.trim().split(/\s+/).join(".")}` : ""}`;
    if (el.hasAttribute("style")) out.push(`${name}: an inline style (${el.getAttribute("style")})`);
    const css = getComputedStyle(el);
    for (const [a, b] of PAIRS) if (css[a] !== css[b]) out.push(`${name}: ${a} ${css[a] || "—"} ≠ ${b} ${css[b] || "—"}`);
    for (const prop of ["textAlign", "float", "clear"] as const) if (/^(left|right)$/.test(css[prop])) out.push(`${name}: ${prop} ${css[prop]}`);
  }
  return out;
}

/** How many elements a rule of the sheets lays out as a flex or grid box: proof the sheets were read onto the page. */
const laidOutByTheSheets = () => [...document.body.querySelectorAll("*")].filter((el) => /^(flex|grid|inline-flex|inline-grid)$/.test(getComputedStyle(el).display)).length;

async function settle(): Promise<void> {
  for (let i = 0; i < 6; i += 1) await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
}

describe("a screen of each side, drawn in Arabic", () => {
  it("the shop's products: nothing reads a physical side", async () => {
    const { I18nProvider } = await import("./i18n/index.tsx");
    const { default: ShopApp } = await import("./shop/ShopApp.tsx");
    const { resetShop } = await import("./shop/store.ts");
    const { fakePort } = await import("./shop/testing.ts");
    window.scrollTo = () => {};
    resetShop(fakePort());
    localStorage.setItem("print-shop-locale", "ar-EG");
    window.history.replaceState(null, "", "/");
    expect(styleThePage("shop"), "the shop's stylesheets were read").toBeGreaterThan(50);
    const host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    await act(async () => root!.render(createElement(I18nProvider, null, createElement(ShopApp))));
    await settle();
    await act(async () => new Promise((resolve) => setTimeout(resolve, 400)));
    await settle();
    expect(document.documentElement.getAttribute("dir")).toBe("rtl");
    expect(document.querySelector(".mp-header, header"), "the products page drawn").not.toBeNull();
    expect(laidOutByTheSheets(), "the stylesheets reached the page").toBeGreaterThan(10);
    expect(lopsided()).toEqual([]);

    // And the check sees a side when one is there.
    const side = document.createElement("style");
    side.dataset["rtlTest"] = "a side";
    side.textContent = "header { margin-left: 3px; }";
    document.head.append(side);
    expect(lopsided().some((l) => l.includes("marginLeft 3px"))).toBe(true);
  });

  it("the works' Today: nothing reads a physical side", async () => {
    const { I18nProvider } = await import("./i18n/index.tsx");
    const { WorksProvider } = await import("./studio/env.tsx");
    const { WorksApp } = await import("./studio/WorksApp.tsx");
    const { useWorks } = await import("./studio/store.ts");
    const { FakeDoor } = await import("./studio/testing/fakeDoor.ts");
    const { DASHBOARD_LINKS } = await import("./studio/boot.tsx");
    localStorage.setItem("print-shop-locale", "ar-EG");
    expect(styleThePage("studio"), "the works' stylesheets were read").toBeGreaterThan(50);
    const door = new FakeDoor();
    useWorks.setState({ data: await door.load(), view: "today", overlay: null });
    const host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    await act(async () => root!.render(createElement(I18nProvider, null, createElement(WorksProvider, { env: { door, ...DASHBOARD_LINKS }, children: createElement(WorksApp) }))));
    await settle();
    expect(document.documentElement.getAttribute("dir")).toBe("rtl");
    expect(document.querySelector(".wk-card"), "Today drawn").not.toBeNull();
    expect(laidOutByTheSheets(), "the stylesheets reached the page").toBeGreaterThan(10);
    expect(lopsided()).toEqual([]);
  });
});
