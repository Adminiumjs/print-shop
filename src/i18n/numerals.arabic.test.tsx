/**
 * NO LATIN DIGIT SURVIVES ONTO AN ARABIC PAGE.
 *
 * @vitest-environment jsdom
 *
 * ── WHY A FOURTH SUITE ABOUT NUMERALS ───────────────────────────────────────
 *
 * `numerals.test.tsx` fixed this at the `t()` seam and states the rule there.
 * It is a good suite and it was not enough, three times over. The defect came
 * back through:
 *
 *   1. `<Mono>` and bare JSX — a number rendered next to a translated word
 *      rather than through it, so `t()` never saw it;
 *   2. `.toFixed(2)` — a number turned into a STRING before it reached `t()`,
 *      which the seam then passes through untouched, on purpose, because that
 *      is how an already-formatted price gets past it;
 *   3. a translator's keyboard — "18 مم/ث بقدرة 78%" typed straight into the
 *      ar-EG bundle, where there is no number for any formatter to format.
 *
 * Three different seams, one defect, and no suite that watched any of them
 * would have caught the other two. What they have in common is not a seam at
 * all: it is what a person READS. So this suite asserts the thing the reader
 * would say — there is a Latin digit on my Arabic page — by rendering every
 * view in ar-EG and looking.
 *
 * ── THE RULE, AND WHY IT IS NOT "NO LATIN DIGITS" ───────────────────────────
 *
 * A page has proper nouns on it. An order reads BR-2287, a postcode reads YO21
 * 2NH, a paper size is A4 in every language on earth — those are IDENTIFIERS,
 * they are written in Latin script, and transliterating their digits would be a
 * worse bug than the one being fixed. What is never an identifier is a bare
 * QUANTITY: a weight, a count, a speed, a percentage.
 *
 * ── HOW THE TWO ARE TOLD APART, AND HOW THAT WAS WRONG FOR THREE ROUNDS ─────
 *
 * The rule used to be "the token carries a Latin letter, so it is an
 * identifier", written against the four examples above. It is a fingerprint of
 * those four, and it exempts the whole of the category it was meant to catch:
 *
 *     latinNumbersIn("5h 5m")    →  []
 *     latinNumbersIn("350gsm")   →  []
 *
 * A QUANTITY WITH ITS UNIT GLUED ON has a Latin letter in it too, and gluing a
 * unit on is the ordinary way to write one. Three separate unformatted-number
 * defects shipped through that hole.
 *
 * So the two are told apart by WHAT THEY ARE, structurally:
 *
 *   AN IDENTIFIER IS A CODE. It opens with a letter (`BR-2287`, `A4`, `SRA3`,
 *   `YO21`, `MP-4127`), or — when a code's second half opens with a digit, as a
 *   UK postcode's does — its letters are CAPITALS (`2NH`). Capitals are how a
 *   code is written, in every one of these examples, in every language.
 *
 *   A QUANTITY OPENS WITH ITS FIGURE and any letters after it are its unit,
 *   written in lower case because that is how a unit symbol is written:
 *   `5h`, `5m`, `350gsm`, `18mm`, `2x3`, `21st`.
 *
 * Neither half is a list of words. `isQuantityWithUnit` below is the whole of
 * it, and the cases at the foot of this file drive it over both categories so a
 * reader can see the line rather than take it on trust.
 *
 * So the rule is
 *
 *     on an Arabic page, a run of Latin digits that is not inside an
 *     IDENTIFIER, in the page's own prose, is a defect
 *
 * ── "IN THE PAGE'S OWN PROSE", AND WHY THAT IS NOT A LOOPHOLE ───────────────
 *
 * Some runs on the page are not the page's prose at all. A customer types "same
 * as MP-4113, but 2019 instead" into the change box and the works prints it
 * back; the demo card on the checkout reads 4242 4242 4242 4242. Those are
 * Latin ISLANDS, and the app declares them as such with `dir` — `<Typed>` for
 * somebody else's words, the attribute itself on a field whose value is a code —
 * because an undeclared Latin run inside RTL prose is a bidi bug quite apart
 * from its digits. This guard reads that declaration.
 *
 * It is a marker rather than a list, and it costs something to use: `dir`
 * changes how the run is LAID OUT, so it cannot be sprinkled on a weight to
 * quiet the guard without visibly moving the weight. The app's own sentences
 * carry no `dir` anywhere, which is what makes the marker mean something.
 *
 * The handful of exceptions after that are the places where a bare Latin number
 * sits inside a sentence and is genuinely not a quantity this app computed.
 */

import { describe, expect, it } from "vitest";

import { MESSAGES } from "./messages/index.ts";
import { tourEveryView } from "../testing/tour.tsx";

/**
 * A word, for the purpose of asking what a digit is sitting inside.
 *
 * The hyphen and the underscore are IN, because `BR-2287` is one thing a person
 * reads and `BR` + `2287` is two things a regular expression found. The decimal
 * point is OUT, so `0.45` is two bare numbers rather than one token that could
 * never carry a letter.
 */
const WORD = /[\p{L}\p{N}_-]/u;
const LATIN_LETTER = /[A-Za-z]/;
const LATIN_DIGIT = /[0-9]/;

/**
 * Is a token carrying Latin letters a QUANTITY WITH ITS UNIT rather than an
 * IDENTIFIER? See the header for why this replaced "it has a letter in it".
 *
 * Two structural facts, and neither is a vocabulary:
 *
 *   IT OPENS WITH ITS FIGURE. A code opens with its letters — `BR-2287`, `A4`,
 *   `SRA3`, `YO21`, `MP-4127` — because that is what makes it recognisable as
 *   the kind of thing it is. A quantity opens with the number, because the
 *   number is what it is.
 *
 *   AND WHERE IT OPENS WITH A FIGURE AND CARRIES CAPITALS, WHAT DECIDES IS THE
 *   TOKEN BESIDE IT. The clause here used to be "its letters are lower case",
 *   written to let `2NH` — the second half of the postcode `YO21 2NH` — through.
 *   It is a fingerprint of that one example and it exempts a whole category:
 *
 *       latinNumbersIn("مساحة 200MB")  →  []
 *       latinNumbersIn("بسرعة 50Hz")   →  []
 *
 *   `200MB`, `12GB`, `50Hz`, `40W`, `5kW`, `240V` and `30dB` are quantities
 *   whose UNIT SYMBOL is capitalised, which is not unusual — it is what the SI
 *   requires of a symbol named after a person (`W`, `V`, `Hz`, `Pa`, `N`) and
 *   what every byte count on earth does. All seven walked onto an Arabic page.
 *
 *   Nothing inside `2NH` distinguishes it from `40W`: both open with a figure
 *   and end in capitals. What distinguishes them is that `2NH` is standing next
 *   to `YO21` — a CODE, which is a token that opens with letters and carries a
 *   digit — and `40W` is standing next to Arabic prose. So the neighbour is
 *   what is read, and the ambiguity is resolved where it actually lives instead
 *   of being legislated away in the token.
 *
 * Deliberately NOT a list of unit names. A list would forgive `350gsm` and miss
 * `350msnm` the day somebody invented it, which is precisely the failure this
 * function exists to end.
 *
 * WHAT IT STILL CANNOT DO, said plainly: a capitalised quantity written
 * immediately after a code — "MP-4127 200MB" — is read as that code's second
 * half. There is nothing in the text that says otherwise, and the alternative
 * (report it) would fire on every postcode this app prints. A reviewer seeing a
 * quantity next to a reference is the backstop, and it is a narrower one than
 * the whole category this clause used to forgive.
 */
function isQuantityWithUnit(token: string, precededByCode: boolean): boolean {
  if (!LATIN_DIGIT.test(token[0] ?? "")) return false; // opens with letters — a code
  if (!/[A-Z]/.test(token)) return true; // lower-case letters after a figure — a unit
  return !precededByCode;
}

/**
 * Is the token ending at `at` a CODE — letters first, a digit somewhere — with
 * nothing but a space or a hyphen between it and what follows?
 *
 * `YO21 ` and `MP-4127-` qualify; an Arabic word, a full stop and the start of
 * the run do not.
 */
function endsWithACode(text: string, at: number): boolean {
  return /(?:^|[^\p{L}\p{N}_-])[A-Za-z][\p{L}\p{N}_-]*[0-9][\p{L}\p{N}_-]*[ \u00A0-]$/u.test(
    text.slice(0, at),
  );
}

/**
 * The bare Latin numbers allowed on an Arabic page, and why.
 *
 * ── PHRASES, NOT TOKENS ─────────────────────────────────────────────────────
 *
 * The first draft of this listed bare tokens — `"3"`, `"6"`, `"11"` — for the
 * house numbers in street addresses, and that is a hole the size of the rule:
 * allowing the token `"3"` allows a Latin 3 ANYWHERE, so a quantity, a count of
 * days or a weight rounding to 3 would walk straight through the guard that
 * exists to catch it.
 *
 * So an exception names the WHOLE PHRASE it belongs to, the way `PRO_PHRASES`
 * in `testing/lexicon.ts` does, and a digit is forgiven only where it sits
 * inside one. `"© 2026"` forgives that year in the footer and forgives no other
 * 2026 anywhere.
 *
 * Nothing here is a figure this app worked out — that is the line, and it is
 * why no quantity can ever be added: a quantity would have to be formatted
 * instead, which is the entire point.
 *
 * ── AND THIS LIST IS THIS APP'S OWN, NOT THE ADD-ONS' ───────────────────────
 *
 * It used to carry `07700 900 000`, the specimen telephone number on Design
 * Studio's sample business card — an ADD-ON's string, allowed for by a list in
 * a HOST. A verifier wired Design Studio into the maker studio, registration
 * only, zero bytes changed in any add-on, and that host's suite went red on
 * three Latin tokens it had never heard of. Making a portable add-on pass
 * required editing a list in the app receiving it, which is the exact thing
 * AC20/D21 says must never be necessary — and the third time this wave that a
 * fact about an add-on was kept in the host (after HOSTED_SLOTS and the Czech
 * "pro" carve-out).
 *
 * So the allowances now travel with the strings: every add-on exports
 * `NOT_A_QUANTITY` from its own `i18n/strings.ts`, and `addOnAllowances()`
 * below reads whatever this app has VENDORED. Vendor an add-on and its
 * allowances arrive with it; drop it and they leave. Nothing here changes
 * either way.
 */
const NOT_A_QUANTITY: readonly { phrase: string; why: string }[] = [
  {
    phrase: "© 2026",
    why: "the year in the footer's copyright line — a legal notice, written the way the notice is written",
  },
  {
    phrase: "404",
    why: "the HTTP status on the not-found page: a code the web assigns, not a count of anything",
  },
  {
    phrase: "3 Market Square",
    why: "the works' own street address — transcribed as the postman reads it, never translated",
  },
];

/**
 * Every allowance the add-ons THIS APP HAS VENDORED declare for themselves.
 *
 * Discovered from the vendor tree rather than imported by name: an add-on
 * vendored tomorrow is read tomorrow, and one removed stops being read, with no
 * edit in this file either way. That is the whole point — see the block above.
 *
 * `import.meta.glob` is resolved by the bundler at build time, so this is a
 * static list of modules by the time it runs; there is no filesystem read and
 * no dynamic import in a jsdom test.
 */
const VENDORED = import.meta.glob<{ NOT_A_QUANTITY?: readonly { phrase: string; why: string }[] }>(
  "../add-ons/vendor/*/i18n/strings.ts",
  { eager: true },
);

function addOnAllowances(): { phrase: string; why: string }[] {
  return Object.values(VENDORED).flatMap((module) => [...(module.NOT_A_QUANTITY ?? [])]);
}

/** This app's own allowances, plus every one its add-ons brought with them. */
const ALLOWED: readonly { phrase: string; why: string }[] = [
  ...NOT_A_QUANTITY,
  ...addOnAllowances(),
];

/** Whether the digits at `[from, to)` sit inside one of the phrases above. */
function forgiven(text: string, from: number, to: number): boolean {
  return ALLOWED.some(({ phrase }) => {
    for (let at = text.indexOf(phrase); at >= 0; at = text.indexOf(phrase, at + 1)) {
      if (at <= from && to <= at + phrase.length) return true;
    }
    return false;
  });
}

export interface DigitOffence {
  token: string;
  context: string;
}

/** Every bare Latin number in `text` that no exception above covers. */
export function latinNumbersIn(text: string): DigitOffence[] {
  const out: DigitOffence[] = [];
  for (let i = 0; i < text.length; i += 1) {
    if (!LATIN_DIGIT.test(text[i]!)) continue;
    let from = i;
    while (from > 0 && WORD.test(text[from - 1]!)) from -= 1;
    let to = i + 1;
    while (to < text.length && WORD.test(text[to]!)) to += 1;
    const token = text.slice(from, to);
    i = to;
    if (LATIN_LETTER.test(token) && !isQuantityWithUnit(token, endsWithACode(text, from)))
      continue; // an identifier
    if (forgiven(text, from, to)) continue;
    out.push({
      token,
      context: text.slice(Math.max(0, from - 40), Math.min(text.length, to + 40)).replace(/\s+/g, " "),
    });
  }
  return out;
}

/**
 * Everything a person could read off this page — not just its text.
 *
 * A placeholder, a tooltip and an `aria-label` are all read, one of them out
 * loud, and all three are ordinary places for a `t()` call to land. An input's
 * VALUE is read too and is not in `textContent` at all, which is where the
 * stock-count screen keeps its numbers.
 */
function everythingReadable(host: HTMLElement): string[] {
  /*
   * ONE RUN PER TEXT NODE, never the page's whole `textContent`. Concatenating
   * the tree glues one element's last word onto the next one's first, so a shop
   * that renders `<b>BR-2262</b><span>ابحث</span>` produces the token
   * "2262ابحث", which is a defect the guard invented. What a reader sees are
   * separate runs, and so are these.
   */
  const parts: string[] = [];
  const walker = host.ownerDocument.createTreeWalker(host, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    if (inAnIsland(node.parentElement)) continue;
    parts.push(node.textContent ?? "");
  }
  for (const el of host.querySelectorAll("*")) {
    if (inAnIsland(el)) continue;
    for (const attr of ["aria-label", "title", "placeholder", "alt", "aria-valuetext"]) {
      const value = el.getAttribute(attr);
      if (value !== null) parts.push(value);
    }
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      /*
       * A NATIVE DATE, TIME OR NUMBER FIELD HOLDS A MACHINE FORMAT AND THE
       * BROWSER DRAWS IT. `<input type="time" value="15:00">` is `15:00` in the
       * DOM in every language and `١٥:٠٠` on an Arabic screen, because the
       * control is rendered by the platform from the reader's own locale. Its
       * value is a wire format, like an ISO date, and reading it here would
       * report a defect that does not exist on any screen.
       */
      if (!["time", "date", "datetime-local", "month", "week", "number"].includes(el.type)) {
        parts.push(el.value);
      }
    }
  }
  return parts;
}

/** Inside a run the app has declared is not its own prose (`<Typed>`, `dir`). */
function inAnIsland(el: Element | null): boolean {
  return el !== null && el.closest('[dir="auto"], [dir="ltr"]') !== null;
}

describe("an Arabic page carries no Latin quantity", () => {
  it("holds over every view, with the add-ons off and with them on", async () => {
    const bad: {
      view: string;
      surface: string;
      connected: boolean;
      token: string;
      context: string;
    }[] = [];
    await tourEveryView("ar-EG", ({ view, surface, connected, host }) => {
      for (const run of everythingReadable(host)) {
        for (const offence of latinNumbersIn(run)) {
          bad.push({ view, surface, connected, ...offence });
        }
      }
    });
    expect(bad).toEqual([]);
  });

  /*
   * THE BUNDLE, SEPARATELY — because a string nothing renders today is a string
   * something renders tomorrow, and because this is where the third seam was.
   * The tour above only sees the copy the demo's own data reaches.
   */
  it("holds over every string in the ar-EG bundle", () => {
    const bad: { key: string; token: string }[] = [];
    for (const [key, value] of Object.entries(MESSAGES["ar-EG"])) {
      for (const offence of latinNumbersIn(value)) bad.push({ key, token: offence.token });
    }
    expect(bad).toEqual([]);
  });

  it("names every exception, so an allowance is read rather than discovered", () => {
    for (const entry of ALLOWED) {
      expect({ phrase: entry.phrase, explained: entry.why.length > 20 }).toEqual({
        phrase: entry.phrase,
        explained: true,
      });
    }
  });

  /**
   * AND EVERY VENDORED ADD-ON DECLARES ONE, EVEN WHEN IT IS EMPTY.
   *
   * The discovery above is only as honest as what it finds. A bundle that
   * exported nothing would contribute nothing and read exactly like a bundle
   * with no allowances to declare, so a renamed export or a missed sync would
   * be silent — and silence here is the defect coming back in the other
   * direction, with this app's guard blind to strings it renders.
   */
  it("reads an allowance declaration off every add-on this app vendors", () => {
    const bundles = Object.entries(VENDORED);
    expect(bundles.length, "no vendored string bundles were found at all").toBeGreaterThan(0);
    const silent = bundles
      .filter(([, module]) => module.NOT_A_QUANTITY === undefined)
      .map(([file]) => file);
    expect(silent, "these vendored bundles export no NOT_A_QUANTITY").toEqual([]);
  });

  /*
   * AND AN EXCEPTION FORGIVES ITS OWN PHRASE AND NOTHING ELSE. This is the
   * assertion the token-shaped first draft could not have passed.
   */
  it("forgives a phrase, never the digits in it", () => {
    expect(latinNumbersIn("© 2026 Birch Row").map((o) => o.token)).toEqual([]);
    expect(latinNumbersIn("جاهزة خلال 2026 يوم").map((o) => o.token)).toEqual(["2026"]);
  });

  /*
   * AND THE RULE ITSELF, DRIVEN — a guard whose matcher is wrong is a guard
   * that reports nothing forever.
   */
  it("tells an identifier from a quantity", () => {
    expect(latinNumbersIn("طلبك BR-2287 جاهز").map((o) => o.token)).toEqual([]);
    expect(latinNumbersIn("الرمز البريدي YO21 2NH").map((o) => o.token)).toEqual([]);
    expect(latinNumbersIn("مقاس A4 على فرخ SRA3").map((o) => o.token)).toEqual([]);
    expect(latinNumbersIn("نحو 0.45 كجم").map((o) => o.token)).toEqual(["0", "45"]);
    expect(latinNumbersIn("18 مم/ث بقدرة 78%").map((o) => o.token)).toEqual(["18", "78"]);
    expect(latinNumbersIn("نحو ٠٫٤٥ كجم")).toEqual([]);
  });
  /*
   * THE HOLE THE OLD RULE HAD, KEPT AS THE CASE THAT WOULD REOPEN IT.
   *
   * `if (LATIN_LETTER.test(token)) continue` returned [] for every line below,
   * which is why three unformatted-number defects reached screens. Each of
   * these is a QUANTITY WITH ITS UNIT GLUED ON — the ordinary way to write one
   * — and the identifiers above must keep passing at the same time, which is
   * what makes this a rule rather than a second fingerprint.
   */
  it("reports a quantity with its unit glued on, which a Latin letter used to hide", () => {
    expect(latinNumbersIn("خلال 5h 5m").map((o) => o.token)).toEqual(["5h", "5m"]);
    expect(latinNumbersIn("ورق 350gsm").map((o) => o.token)).toEqual(["350gsm"]);
    expect(latinNumbersIn("سرعة 18mm/s").map((o) => o.token)).toEqual(["18mm"]);
    expect(latinNumbersIn("مقاس 2x3").map((o) => o.token)).toEqual(["2x3"]);
    expect(latinNumbersIn("الطابق 21st").map((o) => o.token)).toEqual(["21st"]);
    // …and the codes stay quiet, which is the half a stricter rule would break.
    expect(latinNumbersIn("YO21 2NH · BR-2287 · A4 · SRA3").map((o) => o.token)).toEqual([]);
  });

  /*
   * THE SECOND HOLE IN THE SAME CLAUSE, ROUND 6.
   *
   * "its letters are lower case" replaced one fitted rule with another: every
   * quantity whose UNIT SYMBOL is capitalised was forgiven, which is most of
   * the ones a workshop and a print works measure things in. All seven of these
   * returned [] before `endsWithACode` decided the ambiguous case by looking at
   * the neighbour instead of at the capitals.
   */
  it("reports a quantity whose unit symbol is capitalised", () => {
    for (const [run, token] of [
      ["مساحة 200MB", "200MB"],
      ["ذاكرة 12GB", "12GB"],
      ["بتردد 50Hz", "50Hz"],
      ["بقدرة 40W", "40W"],
      ["بقدرة 5kW", "5kW"],
      ["جهد 240V", "240V"],
      ["ضوضاء 30dB", "30dB"],
    ] as const) {
      expect(latinNumbersIn(run).map((o) => o.token), run).toEqual([token]);
    }
    // And the one case those capitals were let through for keeps working, in
    // both the orders a postcode is written in.
    expect(latinNumbersIn("الرمز البريدي YO21 2NH").map((o) => o.token)).toEqual([]);
    expect(latinNumbersIn("MP-4127-2NH").map((o) => o.token)).toEqual([]);
    // …but a capitalised unit after ordinary prose is still a quantity, even
    // when a code appeared earlier in the same run.
    expect(latinNumbersIn("طلب BR-2287 بمساحة 200MB").map((o) => o.token)).toEqual(["200MB"]);
  });
});
