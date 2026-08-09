/**
 * The message bundle's own suite: parity, placeholders, and the vocabulary ban.
 *
 * Parity is already a COMPILE error in `messages/index.ts`, so what this adds
 * is the two things a type cannot see — that a translation still carries the
 * placeholders its English does, and that nobody has reached for a banned word.
 *
 * It runs over the MERGED bundle, which means it covers the add-ons' vendored
 * strings as well as the app's own. That is the point: an add-on translates its
 * copy in its own repo, and this is the only place all eight locales of every
 * source are in one object at once.
 *
 * IMPORTING THE REGISTRY IS LOAD-BEARING, not tidiness. An add-on's strings are
 * no longer imported by `messages/index.ts`; they arrive when the add-on
 * REGISTERS, which happens at module load in `add-ons/registry.ts`. Without
 * this import the bundle here would hold the host's own areas and nothing else,
 * and every assertion below would pass while proving nothing about the add-ons.
 */

import { describe, expect, it } from 'vitest';

import { demoAddOns } from '../add-ons/registry.ts';
import { bannedSubstringsIn, TIERING_WORDS } from '../testing/lexicon.ts';
import { isConnectable } from '../add-ons/host.ts';
import { LOCALE_TAGS, type LocaleTag } from './locales.ts';
import { MESSAGES, registeredAddOnMessageKeys } from './messages/index.ts';

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

describe('the vocabulary ban (24 D10)', () => {
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
   * does not have. 17 §2's grep is case-insensitive and UNANCHORED, so
   * "explanation" is a hit on "plan" and "frontier" is a hit on "tier" — the
   * two traps D10 names by name, and neither is visible to `\b(plans?|tiers?)\b`.
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
    // check is shown to bite. These are the exact two words D10 names.
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

  it('spells the tiering idea in no language (24 D12)', () => {
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

describe('the add-ons’ own strings arrived', () => {
  /*
   * The runtime half of what used to be a type. `registerAddOnMessages` throws
   * on a bundle that is short a locale or a key, so the fact that this module
   * loaded at all is already an assertion; these check the other direction —
   * that every add-on the demo registers actually got merged, and that the keys
   * its own object points at resolve rather than rendering as raw dotted text.
   */
  const CONNECTABLE = demoAddOns().filter(isConnectable);

  it('registered a bundle for every add-on that can be connected', () => {
    expect(registeredAddOnMessageKeys()).toEqual(CONNECTABLE.map((a) => a.key).sort());
  });

  it('resolves every key each add-on hands the host, in English and in Arabic', () => {
    for (const addOn of CONNECTABLE) {
      const keys = [
        addOn.lineKey,
        addOn.whatKey,
        addOn.disconnect!.goesKey,
        addOn.disconnect!.staysKey,
        ...addOn.permissions.map((p) => p.key),
        ...(addOn.activity ?? []).map((e) => e.messageKey),
        ...(addOn.demoSwitch === undefined
          ? []
          : [addOn.demoSwitch.labelKey, addOn.demoSwitch.noteOnKey, addOn.demoSwitch.noteOffKey]),
      ];
      for (const key of keys) {
        expect(MESSAGES['en-US'][key], `en-US ${key}`).toBeTruthy();
        expect(MESSAGES['ar-EG'][key], `ar-EG ${key}`).toBeTruthy();
      }
    }
  });
});
