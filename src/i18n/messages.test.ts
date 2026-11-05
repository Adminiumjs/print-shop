/**
 * The message bundle's own suite: parity, placeholders, and the vocabulary ban.
 *
 * Parity is already a COMPILE error in `messages/index.ts`, so what this adds
 * is the two things a type cannot see — that a translation still carries the
 * placeholders its English does, and that nobody has reached for a banned word.
 *
 * An add-on's own strings arrive only when a connected add-on's bundle
 * registers them (`add-ons/connected.ts`); its repo holds them to the same
 * rules.
 */

import { describe, expect, it } from 'vitest';

import { bannedSubstringsIn, TIERING_WORDS } from '../testing/lexicon.ts';
import { LOCALE_TAGS, type LocaleTag } from './locales.ts';
import { MESSAGES } from './messages/index.ts';

/** Placeholder names are not copy — `{spare}` is a number, not a word. */
const strip = (value: string) => value.replace(/\{\w+\}/g, '');

/**
 * The DISTINCT placeholder names, not every occurrence.
 *
 * A message may carry `|`-separated plural variants, and a locale with six
 * CLDR categories repeats `{count}` six times where English repeats it twice.
 * Counting occurrences would fail Arabic on every plural in the app for being
 * correctly Arabic.
 */
const placeholders = (value: string) =>
  [...new Set([...value.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!))].sort();

describe('every locale carries every key', () => {
  const english = Object.keys(MESSAGES['en-US']);

  it('has eight locales and a non-trivial bundle', () => {
    expect(LOCALE_TAGS).toHaveLength(8);
    expect(english.length).toBeGreaterThan(700);
  });

  for (const locale of LOCALE_TAGS.filter((l): l is LocaleTag => l !== 'en-US')) {
    it(`${locale} matches English key for key`, () => {
      expect(Object.keys(MESSAGES[locale]).sort()).toEqual([...english].sort());
    });

    it(`${locale} keeps every placeholder`, () => {
      // A dropped `{ref}` is a sentence with a hole in it, and it renders
      // perfectly in seven locales while being wrong in the eighth.
      for (const key of english) {
        expect({ key, ph: placeholders(MESSAGES[locale][key]!) }).toEqual({
          key,
          ph: placeholders(MESSAGES['en-US'][key]!),
        });
      }
    });

    it(`${locale} has no empty string`, () => {
      for (const key of english) expect(MESSAGES[locale][key]!.trim()).not.toBe('');
    });
  }
});

describe('the vocabulary ban', () => {
  /*
   * English gets the full list as WORDS. Six of them are the print trade's own
   * — a quantity break wants to be called a tier and a proof wants to be free —
   * so this is the guard that catches the first draft of the next screen.
   */
  const BANNED_EN = /\b(pricing|tiers?|free|plans?|upgrade|billing|premium|pro)\b/i;

  /*
   * The other seven get the four that have no innocent homograph. The full
   * list cannot run against them: German "pro Stück" means "each", Czech "pro"
   * means "for", Danish "planen" means "the schedule, and a test that forced a
   * translator away from the ordinary word in their language would be trading
   * a real defect for an imaginary one.
   */
  const BANNED_ANY = /pricing|premium|upgrade|billing/i;

  /*
   * THE SAME SEMANTICS AS THE RELEASE GATE, which the word-anchored regex above
   * does not have. The release grep is case-insensitive and UNANCHORED, so
   * "explanation" is a hit on "plan" and "frontier" is a hit on "tier" — the
   * two named traps, and neither is visible to `\b(plans?|tiers?)\b`.
   * A word-anchored guard is a guard that passes while the gate fails, which is
   * the worst kind.
   *
   * THE LIST IS IMPORTED, not retyped. This file and `builtOutput.test.ts` used
   * to hold two hand-written copies of it and they had drifted apart by two
   * words, which is how `free` and `plan` came to be enforced here and nowhere
   * near the bytes that ship. One array, in `testing/lexicon.ts`, is the fix.
   *
   * `pro` is deliberately NOT a substring and stays word-anchored above: a
   * print works says "proof", "process" and "product" on nearly every screen,
   * and a substring rule that banned those would trade a real defect for an
   * imaginary one. `lexicon.ts` makes the same split (`WORD_BANNED`) and the
   * built output is checked both ways in `builtOutput.test.ts`.
   */
  const substringHits = (value: string) => bannedSubstringsIn(strip(value));

  it('keeps the English copy clear of all of them', () => {
    const hits = Object.entries(MESSAGES['en-US'])
      .filter(([, v]) => BANNED_EN.test(strip(v)))
      .map(([k]) => k);
    expect(hits).toEqual([]);
  });

  it('catches them as SUBSTRINGS too — "explanation" hides "plan", "frontier" hides "tier"', () => {
    const hits = Object.entries(MESSAGES['en-US'])
      .filter(([, v]) => substringHits(v).length > 0)
      .map(([k, v]) => `${k} · ${substringHits(v).join(',')} · ${v}`);
    expect(hits).toEqual([]);
  });

  it('would actually catch the two named traps', () => {
    // The guard above is an absence, and an absence proves nothing unless the
    // check is shown to bite. These are the exact two named traps.
    expect(substringHits('a short explanation of the sizes')).toContain('plan');
    expect(substringHits('the frontier of large format')).toContain('tier');
    // The two a shortened list had dropped, which is the defect this closes.
    expect(substringHits('proofs are free')).toContain('free');
    expect(substringHits('the flatplan')).toContain('plan');
    // And the word-anchored guard is shown NOT to, which is why both exist.
    expect(BANNED_EN.test('a short explanation of the sizes')).toBe(false);
    expect(BANNED_EN.test('the frontier of large format')).toBe(false);
  });

  it('keeps the marketing words out of every translation', () => {
    for (const locale of LOCALE_TAGS) {
      const hits = Object.entries(MESSAGES[locale])
        .filter(([, v]) => BANNED_ANY.test(strip(v)))
        .map(([k]) => `${locale} ${k}`);
      expect(hits).toEqual([]);
    }
  });

  it('spells the tiering idea in no language', () => {
    /*
     * The ban is on the IDEA, and the idea is spelt differently per language:
     * German advertises "Profi", Czech "prémiový"/"profesionální", Chinese
     * 高级版/专业版, Arabic احترافي/مميز. Not one of those carries an English
     * banned run, so nothing but a per-language table would ever catch them —
     * which is why `\bpro\b` alone was never enough. Same table as the three
     * add-on repos, and the same union runs over the built bundle.
     */
    for (const locale of LOCALE_TAGS) {
      const patterns = TIERING_WORDS[locale] ?? [];
      expect(patterns.length, locale).toBeGreaterThan(0);
      const hits = Object.entries(MESSAGES[locale])
        .filter(([, v]) => patterns.some((p) => p.test(strip(v))))
        .map(([k, v]) => `${locale} ${k} · ${v}`);
      expect(hits).toEqual([]);
    }
  });

  it('never writes a path containing /mo', () => {
    for (const locale of LOCALE_TAGS) {
      for (const [key, value] of Object.entries(MESSAGES[locale])) {
        expect({ key, hit: /\/mo\b/.test(value) }).toEqual({ key, hit: false });
      }
    }
  });
});

/**
 * NO PRICE IS TYPED INTO A TRANSLATED STRING.
 *
 * [Added 2026-08-11, wave 4b round 5.] Three packaging hints were finished
 * sentences carrying their own money: `"$4.50 per 500"` in English and
 * `"٤٫٥٠ $ لكل ٥٠٠"` in Arabic. The digits were correct for their locale, so the
 * numerals guard was satisfied, and two things were still wrong:
 *
 *   THE CURRENCY WAS A BARE `$`, where every price on the same screen renders
 *   `US$` / `$US` through `Intl.NumberFormat`. A bare `$` names a dozen
 *   currencies.
 *
 *   AND A TYPED PRICE CANNOT FOLLOW THE RATE CARD. The rate lives in Adminium;
 *   change it and eight bundles go on quoting the old figure on two screens
 *   while the basket charges the new one.
 *
 * ── WHY A SYMBOL AND NOT A NUMBER ───────────────────────────────────────────
 *
 * "No number in a message" is unenforceable — bundles legitimately carry years,
 * limits and step counts, and a rule with a list of allowed numbers is a rule
 * that gets one added to it whenever it fails. A CURRENCY SIGIL has no such
 * excuse: money is formatted, always, by one function, and a sigil in a message
 * means somebody wrote a price by hand. There is nothing to allow.
 *
 * It reads the sigils, not the amounts, so `{price} a unit` — the repaired
 * shape, where the figure is substituted — passes and must.
 */
describe("money is formatted, never typed", () => {
  /** Sigils, not amounts: what a hand-written price cannot avoid carrying. */
  const CURRENCY = /[$€£¥₹₽₩]|\bUSD\b|\bEUR\b|\bGBP\b/;

  it("carries no currency symbol in any locale's messages", () => {
    const bad: string[] = [];
    for (const [tag, bundle] of Object.entries(MESSAGES)) {
      for (const [key, value] of Object.entries(bundle as Record<string, string>)) {
        if (CURRENCY.test(value)) bad.push(`${tag} · ${key} = “${value}”`);
      }
    }
    expect(bad, `\n${bad.join("\n")}\n`).toEqual([]);
  });

  it("knows a typed price from a substituted one", () => {
    // The guard on the guard: a matcher that matched nothing would keep the
    // case above green through anything.
    expect(CURRENCY.test("$4.50 per 500")).toBe(true);
    expect(CURRENCY.test("٤٫٥٠ $ لكل ٥٠٠")).toBe(true);
    expect(CURRENCY.test("0,04 $ l'unité")).toBe(true);
    expect(CURRENCY.test("{price} a unit")).toBe(false);
    expect(CURRENCY.test("每 {n} 件 {price}")).toBe(false);
  });
});
