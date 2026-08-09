/**
 * The release sweep's word list, in one executable place.
 *
 * THE GUARD HAS TO BE THE RELEASE GREP, NOT A POLITER VERSION OF IT. The sweep
 * (17 §2) reads BUILT OUTPUT case-insensitively for
 * `pricing|plan|tier|billing|upgrade|/mo|free` as SUBSTRINGS, and 24 D12 adds
 * `premium` and `pro` for add-ons. A `\b`-anchored version of that list is
 * strictly weaker than the thing it claims to enforce: "explanation",
 * "frontier", "freephone" and "flatplan" all pass a word boundary and all fail
 * the release. Substrings here, no anchors.
 *
 * THE LIST IS NEVER SHORTENED TO MAKE A BUILD PASS. An earlier version of this
 * file kept a second, reduced array for the bundle with `free` and `plan`
 * dropped, on the grounds that a minified file cannot tell German copy from a
 * JavaScript identifier. That is true and it is not a reason to drop a word: it
 * is a reason to name the exceptions. So the full list runs over the bundle,
 * and the handful of genuine non-English homographs are allowed ONE EXACT TOKEN
 * AT A TIME in `HOMOGRAPH_TOKENS` below, each with the language it belongs to
 * and what it actually means. A word the gate has to allow is a word a reviewer
 * gets to read.
 *
 * The identifiers went the other way. `StockLine.free`, the message key
 * `shop.materials.col.free`, its `{free}` placeholder and `Consumption
 * .plannedSheets` were all this repo's own names, and a name is free to change:
 * they are `spare`, `shop.materials.col.spare`, `{spare}` and `imposedSheets`
 * now, so a bare `free` or `plan` in the bundle is a real hit with nothing to
 * argue about.
 *
 * It lives in `testing/` because it is a test fixture and must never reach a
 * bundle — a module that spells every banned word would fail the very grep it
 * defines if it shipped. `src/sources.test.ts` asserts nothing shipped imports
 * this directory, and `scripts/sync-add-ons.sh` never vendors one.
 */

/** Every substring the release grep looks for. */
export const SUBSTRING_BANNED = [
  'pricing',
  'plan',
  'tier',
  'billing',
  'upgrade',
  'free',
  'premium',
  '/mo',
] as const;

/**
 * The one 24 D12 adds that is a WORD rather than a substring.
 *
 * "pro" is not in 17 §2's run of substrings and must not be turned into one: a
 * print works says "proof", "process", "product" and "properties" on nearly
 * every screen, and a substring rule over those would trade a real defect for
 * an imaginary one. What D12 forbids is the marketing word — a "Pro" add-on, a
 * "Pro" account — so it is checked as a standalone token, and the six places a
 * translator legitimately wrote it are allowed by exact phrase in `PRO_PHRASES`.
 */
export const WORD_BANNED = ['pro'] as const;

/**
 * The only tokens allowed to carry a banned substring in built output.
 *
 * Each entry is an EXACT token, matched case-insensitively against the whole
 * run of word characters around the hit — never a loosened pattern. "planen"
 * is allowed; "plan", "planning" and "planned" are not, and an English sentence
 * that reaches for any of them fails the gate exactly as the release would.
 *
 * Everything here is a word in one of the seven non-English locales that
 * happens to spell an English marketing word inside it. Forcing a translator
 * away from the ordinary word in their own language would be trading a real
 * defect for an imaginary one; naming the word costs one line.
 */
export const HOMOGRAPH_TOKENS: readonly {
  token: string;
  language: string;
  means: string;
}[] = [
  {
    token: 'eingeplant',
    language: 'German',
    means: '“scheduled in” — the past participle of einplanen, used of a job that has a slot',
  },
  {
    token: 'planen',
    language: 'Danish (also German)',
    means: 'Danish “the schedule” (the definite form of plan); German “to plan”',
  },
  {
    token: 'Planches',
    language: 'French',
    means: '“sheets”, the plural of planche — a sheet of die-cut stickers',
  },
];

/**
 * The only phrases allowed to contain a standalone "pro".
 *
 * A phrase and not a token, because the token IS "pro" in every case and an
 * allow-list of the bare token would wave the English marketing word straight
 * through. Each entry must match from the "pro" onwards, case-insensitively.
 */
export const PRO_PHRASES: readonly {
  phrase: string;
  language: string;
  means: string;
}[] = [
  { phrase: 'pro Stück', language: 'German', means: '“per item”, i.e. each' },
  { phrase: 'pro kterou', language: 'Czech', means: '“for which”' },
  { phrase: 'pro účetnictví', language: 'Czech', means: '“for the accounts”' },
  {
    phrase: 'pro {ref}',
    language: 'Czech',
    means: 'the preposition “for” in front of a job-reference placeholder',
  },
];

/**
 * THE TIERING IDEA, SPELT PER LANGUAGE — the third table, and the one that
 * makes a word-anchored `pro` safe.
 *
 * D12 forbids the idea of a ranked add-on, not one English word, and the idea
 * is spelt differently in each language: German advertises `Profi`, Czech
 * `prémiový` / `profesionální`, Chinese 高级版 / 专业版, Arabic احترافي / مميز.
 * None of those contain an English banned run, so nothing but a per-language
 * table would ever catch them — and none of them is a standalone "pro", so the
 * word-anchored check above would not either. The two tables cover each other:
 * `WORD_BANNED` catches "a Pro account", this catches "Profi-Tarif".
 *
 * The three add-on repos carry the identical table, deliberately: a shelf where
 * the host forbids a word and an add-on advertises it is not a shelf with a
 * rule. Keep them in step.
 */
export const TIERING_WORDS: Record<string, RegExp[]> = {
  'en-US': [/premium/i],
  'de-DE': [/\bprofi/i, /premium/i],
  'fr-FR': [/premium/i],
  'cs-CZ': [/prémiov/i, /profesionál/i],
  'da-DK': [/premium/i],
  'zh-CN': [/高级版/, /专业版/],
  'zh-TW': [/高級版/, /專業版/],
  'ar-EG': [/احترافي/, /مميز/],
};

/**
 * Every pattern above, flattened, for the built bundle.
 *
 * A built file carries all eight locales interleaved and there is no way to
 * attribute a byte back to the language it came from, so the built check runs
 * the UNION. That is stricter than the per-locale check, which is the right
 * direction.
 */
export const TIERING_PATTERNS: RegExp[] = Object.values(TIERING_WORDS).flat();

/** Every banned substring present in `value`, case-insensitively. */
export function bannedSubstringsIn(
  value: string,
  words: readonly string[] = SUBSTRING_BANNED,
): string[] {
  const lower = value.toLowerCase();
  return words.filter((word) => lower.includes(word));
}

/** One place a banned run of letters survived into built output. */
export interface Offence {
  /** The banned substring, or `pro`. */
  word: string;
  /** The whole word the hit sits inside — what an allow-list entry names. */
  token: string;
  /** Enough either side to recognise the sentence. */
  context: string;
}

const WORD_CHAR = /[\p{L}\p{N}_$]/u;

/** The maximal run of word characters around `[at, end)`. */
function tokenAround(text: string, at: number, end: number): string {
  let i = at;
  while (i > 0 && WORD_CHAR.test(text[i - 1]!)) i -= 1;
  let j = end;
  while (j < text.length && WORD_CHAR.test(text[j]!)) j += 1;
  return text.slice(i, j);
}

const ALLOWED_TOKENS = new Set(HOMOGRAPH_TOKENS.map((h) => h.token.toLowerCase()));

/**
 * Every banned run of letters in `text` that no explicit carve-out covers.
 *
 * THE SAME SEMANTICS AS THE RELEASE GREP, with two named departures and no
 * others: a hit whose whole token is in `HOMOGRAPH_TOKENS`, and a standalone
 * "pro" that begins one of `PRO_PHRASES`. Both lists are printed by the suite
 * that calls this, so the carve-outs are read rather than discovered.
 */
export function bundleOffences(text: string): Offence[] {
  const lower = text.toLowerCase();
  const out: Offence[] = [];

  const context = (at: number, end: number) =>
    text.slice(Math.max(0, at - 55), Math.min(text.length, end + 55)).replace(/\s+/g, ' ');

  for (const word of SUBSTRING_BANNED) {
    for (let at = lower.indexOf(word); at >= 0; at = lower.indexOf(word, at + 1)) {
      const end = at + word.length;
      // `/mo` is punctuation-led: it has no enclosing word and no carve-out.
      const token = WORD_CHAR.test(word[0]!) ? tokenAround(text, at, end) : word;
      if (ALLOWED_TOKENS.has(token.toLowerCase())) continue;
      out.push({ word, token, context: context(at, end) });
    }
  }

  for (const word of WORD_BANNED) {
    const standalone = new RegExp(`(?<![\\p{L}\\p{N}_$])${word}(?![\\p{L}\\p{N}_$])`, 'giu');
    for (const match of lower.matchAll(standalone)) {
      const at = match.index;
      const end = at + word.length;
      const covered = PRO_PHRASES.some(
        (p) => lower.slice(at, at + p.phrase.length) === p.phrase.toLowerCase(),
      );
      if (covered) continue;
      out.push({ word, token: text.slice(at, end), context: context(at, end) });
    }
  }

  for (const pattern of TIERING_PATTERNS) {
    // Fresh, global, so every occurrence is reported rather than the first.
    const all = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
    for (const match of text.matchAll(all)) {
      const at = match.index;
      const end = at + match[0].length;
      out.push({
        word: pattern.source,
        token: tokenAround(text, at, end),
        context: context(at, end),
      });
    }
  }

  return out;
}
