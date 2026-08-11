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
  {
    token: 'tarifs',
    language: 'French',
    means:
      '“rates” — what a carrier charges to carry a parcel, the plural of tarif. ' +
      'The German Tarif is a PLAN and is banned; this exact plural is not a German ' +
      'word, so the singular, Tarife and Tarifwechsel all still fail',
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
 * ── THE BANNED IDEAS, SPELT IN EVERY LANGUAGE ───────────────────────────────
 *
 * [Rewritten 2026-08-11, wave 4b round 4.] What stood here was a table called
 * `TIERING_WORDS` holding, per language, the spelling of ONE idea — "premium".
 * It was a fingerprint, and it was proven blind: planting
 * "الترقية إلى الباقة المدفوعة" ("upgrade to the paid plan") in an ar-EG bundle
 * and "Jetzt auf den bezahlten Tarif wechseln" ("switch to the paid tariff
 * now") in a de-DE one left all twelve built-output cases green. Neither
 * sentence contains an English banned run, and neither is the word "premium".
 *
 * This wave has now been bitten three separate times by a fingerprint standing
 * in for a rule — SCARCITY, the mount grep, and a coverage test that listed its
 * own hole — so the shape is the defect, not the missing entry.
 *
 * ── WHAT THE RULE IS ────────────────────────────────────────────────────────
 *
 * 17 §2 bans a set of IDEAS and happens to spell them in English:
 * `pricing`, `plan`, `tier`, `billing`, `upgrade`, `free`, plus D12's
 * `premium`/`pro`. Copy in the other seven languages says the same things in
 * its own words and the release grep cannot see any of it.
 *
 * So the table below is `IDEA × LANGUAGE`, and it is TOTAL BY TYPE: every idea
 * has a cell in every non-English language, and adding a language or an idea is
 * a compile-and-test failure until somebody fills the cells in.
 *
 * ── AND TOTAL BY TYPE IS NOT COMPLETE, WHICH IS THIS FILE'S OWN TRAP ────────
 *
 * [Round 6.] The paragraph that stood here said the totality made this "a rule
 * rather than a list — you cannot forget a cell, you can only leave a list
 * short." That is false, and it is the eleventh fingerprint-standing-in-for-a-
 * rule this wave has found. YOU CANNOT FORGET A CELL; YOU CAN LEAVE EVERY CELL
 * SHORT. Each one is a hand-picked list of stems, so the table catches its own
 * examples and looks finished while doing it. Two plants walked through it:
 *
 *     "Wechseln Sie jetzt zur kostenpflichtigen Vollversion."   (de-DE)
 *     "انتقل إلى النسخة المدفوعة للحصول على مزايا إضافية."        (ar-EG)
 *
 * "Switch now to the paid full version" and "move to the paid version for extra
 * benefits" — a paid-tier upsell in two shipped locales, with every built-output
 * case green. Neither says Tarif, Abo, Preisstufe, باقة or ترقية. They did not
 * have to: a language has more than one way to say a thing, and a stem list
 * knows the ways its author thought of.
 *
 * ── A COMPLETE MECHANICAL RULE HERE IS IMPOSSIBLE, AND SAYING SO IS THE ─────
 * ── ONLY HONEST THING TO DO ─────────────────────────────────────────────────
 *
 * The rule being enforced is: v1 ships completely free of charge, so no
 * sentence anywhere may raise the subject of paying for the product. Deciding
 * whether an arbitrary sentence in seven languages raises that subject is
 * reading for MEANING. No list of stems can do it, no larger list can do it,
 * and a bigger table would only be a slower way to arrive back here — the same
 * conclusion `app-neutral.test.ts` reached about `ONE_SHOP_WORDS` and wrote
 * down rather than papering over.
 *
 * SO THIS TABLE IS A REGRESSION SET. It holds every spelling that has actually
 * got through, in every language, and it will go on growing that way. It is
 * worth having and it must not be read as coverage: a green run here means
 * "nothing we have been bitten by before", never "no upsell in this bundle".
 *
 * ── WHAT A REVIEWER MUST DO, BECAUSE THE GATE CANNOT ────────────────────────
 *
 * For every new or changed string in ANY locale, ask one question:
 *
 *     does this sentence tell the reader that something costs money, or that
 *     more of the product can be had by paying — in any words at all?
 *
 * If yes, it does not ship, whatever language it is in and whatever words it
 * used. A translator reaching for their language's natural marketing phrase is
 * the ordinary way this arrives; it is not a translation error, it is a release
 * defect, and it is caught by reading rather than by grepping.
 *
 * ── AND THE MECHANICAL CHECK THAT IS POSSIBLE, WHICH IS OVER CHANGE ─────────
 *
 * "Does this sentence mean X" is undecidable here. "Has a human read every
 * sentence that ships" is not. Each host carries a copy ledger over its whole
 * message bundle — `i18n/reviewed-copy.json`, one fingerprint per key across
 * all eight locales — and a string that is added, edited or removed in any
 * language fails that suite until somebody updates the ledger, naming the keys
 * that moved. That is the gate this table cannot be; it decides nothing about
 * the words and it makes the reading happen.
 *
 * ── AND WHY THE STEMS ARE THE COMMERCIAL ONES, NOT THE ORDINARY ONES ────────
 *
 * A shop says "price" on every page and must go on saying it: the English ban
 * is on `pricing`, not `price`, and the same distinction has to be kept in each
 * language or the gate fails on copy that is simply copy. So German is
 * `Preisgestaltung` and not `Preis`, French is `tarification` and not `tarif`,
 * Czech is `cenový plán` and not `cena`. Three words that would have been
 * obvious choices are DELIBERATELY ABSENT, each because it means something
 * ordinary in a shop that posts parcels: German `Paket`, Czech `balíček` and
 * Danish `pakke` all mean "parcel", and banning them would ban the delivery
 * add-on's own vocabulary in three languages.
 *
 * A cell may be empty ONLY where the language borrows the English word and the
 * substring ban already catches it — `upgrade` in Danish, say. `[]` is written
 * out and the reason is in the comment beside it, so an empty cell is a
 * decision on the page rather than a gap.
 */

/**
 * The ideas 17 §2 and 24 D12 forbid, named once.
 *
 * `paid` ON ITS OWN IS DELIBERATELY NOT ONE OF THEM, and the attempt is worth
 * recording. It was in this list for one run and came straight back out: a shop
 * is PAID for what it makes, so `screen.confirm.paid` reads "المدفوع" and the
 * add-on shelf has a "المدفوعات" category, both of them ordinary and both of
 * them hits.
 *
 * `paid-version` IS one of them, and it is the round-6 regression. "The paid
 * version" and "the full version" are how an upsell is written when the writer
 * is not reaching for a plan or a tier — which is exactly what both plants did,
 * in two languages, past a table that had a cell for every idea it knew about.
 * The phrase is the unit: `paid` alone is a shop's own word, `paid version` is
 * never anything else.
 */
export const BANNED_IDEAS = [
  "pricing",
  "plan",
  "tier",
  "billing",
  "upgrade",
  "free",
  "premium",
  "paid-version",
] as const;

export type BannedIdea = (typeof BANNED_IDEAS)[number];

/** The seven languages whose spellings the English substring ban cannot see. */
export const OTHER_LANGUAGES = [
  "de-DE",
  "fr-FR",
  "cs-CZ",
  "da-DK",
  "zh-CN",
  "zh-TW",
  "ar-EG",
] as const;

/**
 * TOTAL BY TYPE, WHICH IS WHAT MAKES IT A RULE RATHER THAN A LIST.
 *
 * `Record<Language, Record<BannedIdea, …>>` over the two arrays above: delete a
 * cell and `tsc` names the missing idea; add a language or an idea and every
 * gap is a compile error until somebody fills it in. A list can be short and
 * look finished — that is exactly what the one-word table it replaced did.
 */
export const IDEA_IN_LANGUAGE: Record<
  (typeof OTHER_LANGUAGES)[number],
  Record<BannedIdea, RegExp[]>
> = {
  "de-DE": {
    // Preisgestaltung/Preismodell — never bare `Preis`, which is what every
    // product page says, and never `Preisliste`: the delivery add-on's German
    // copy says "Die Preisliste dahinter wird … gepflegt" of the carrier's own
    // rate card, and a PRICE LIST is a thing a shop has. English bans `pricing`
    // and does not ban `price list` either.
    pricing: [/preisgestaltung/i, /preismodell/i],
    // `Tarif` is the word the plant used. A print works and a maker studio
    // never say it; a mobile network does.
    plan: [/\btarif/i, /\babo\b/i, /abonnement/i],
    tier: [/preisstufe/i, /\bstufenpreis/i, /\btarif/i],
    billing: [/abrechnung/i, /rechnungsstellung/i],
    // German borrows "Upgrade", which the English substring ban already sees;
    // these are the German-formed alternatives it does not.
    upgrade: [/höherstufen/i, /hochstufen/i, /aufwerten auf/i],
    free: [/kostenlos/i, /\bgratis/i, /umsonst/i],
    premium: [/premium/i, /\bprofi/i],
    // THE ROUND-6 PLANT: "Wechseln Sie jetzt zur kostenpflichtigen
    // Vollversion." `kostenpflichtig` is "subject to a charge" and a works
    // never says it; `Vollversion`/`Bezahlversion` are the software-upsell
    // words. Bare `Kosten` is absent on purpose — a shop talks about costs.
    "paid-version": [/kostenpflichtig/i, /vollversion/i, /bezahlversion/i],
  },
  "fr-FR": {
    // `tarif` alone is French for "rate" and is legitimate on a delivery page.
    pricing: [/tarification/i, /grille tarifaire/i],
    plan: [/forfait/i, /abonnement/i],
    // NEVER bare `palier`: it is the French for a quantity BREAK, and the
    // works' own price page is headed "Paliers de quantité". English calls
    // those "breaks" and does not ban the word either.
    tier: [/palier tarifaire/i, /niveau tarifaire/i],
    billing: [/facturation/i],
    upgrade: [/mise à niveau/i, /surclassement/i, /passer à l'offre/i],
    free: [/gratuit/i],
    premium: [/premium/i],
    // `payant` qualifies a THING that costs; a works quotes prices without it.
    "paid-version": [/version payante/i, /version complète/i, /offre payante/i],
  },
  "cs-CZ": {
    // `ceník` is an ordinary price list and a works has one; `cenový plán` is
    // the commercial idea.
    pricing: [/cenový plán/i, /cenová politika/i],
    plan: [/\btarif/i, /předplatn/i],
    tier: [/cenová hladina/i, /\btarif/i],
    billing: [/fakturace/i, /vyúčtování/i],
    upgrade: [/povýšit na/i, /vyšší tarif/i],
    free: [/zdarma/i, /zadarmo/i, /bezplatn/i],
    premium: [/prémiov/i, /profesion\u00e1l/i],
    // `placená verze` / `plná verze`. `\S*` rather than `\w*`: Czech endings
    // are accented and `\w` is ASCII, so `plná verze` slipped a `\w*` pattern.
    "paid-version": [/placen\S*\s+verz/i, /pln\S*\s+verz/i],
  },
  "da-DK": {
    // `prisliste` is an ordinary price list; `prisplan`/`prismodel` are not.
    pricing: [/prisplan/i, /prismodel/i],
    plan: [/abonnement/i],
    tier: [/prisniveau/i, /pristrin/i],
    billing: [/fakturering/i, /betalingsplan/i],
    // Danish borrows "upgrade" as `opgradering`, which the substring ban does
    // NOT see — `opgrader` is not `upgrade`.
    upgrade: [/opgrader/i],
    free: [/\bgratis/i, /vederlagsfri/i],
    premium: [/premium/i],
    "paid-version": [/betalingsversion/i, /betalt version/i, /fuld version/i],
  },
  "zh-CN": {
    pricing: [/定价/, /价格方案/],
    plan: [/套餐/, /订阅/],
    // NEVER bare `档位`: the delivery copy says 档位由我们替您选好 of the weight
    // bracket a parcel falls into, which is a bracket and not a plan.
    tier: [/价格档/, /套餐档/],
    billing: [/账单/, /计费/],
    upgrade: [/升级/],
    free: [/免费/],
    premium: [/高级版/, /专业版/],
    "paid-version": [/付费版/, /完整版/],
  },
  "zh-TW": {
    pricing: [/定價/, /價格方案/],
    plan: [/方案/, /訂閱/],
    // NEVER bare `級距`, for the same reason as zh-CN's 档位.
    tier: [/價格級/, /方案級/],
    billing: [/帳單/, /計費/],
    upgrade: [/升級/],
    free: [/免費/],
    premium: [/高級版/, /專業版/],
    "paid-version": [/付費版/, /完整版/],
  },
  "ar-EG": {
    pricing: [/التسعير/, /تسعير/],
    // `باقة` — the plant's word for a package a shop pays for.
    plan: [/باقة/, /الباقة/, /اشتراك/],
    tier: [/فئة سعرية/, /مستوى سعري/],
    billing: [/فوترة/, /الفوترة/],
    // `ترقية` — the plant's word for "upgrade".
    upgrade: [/ترقية/],
    free: [/مجان/],
    premium: [/احترافي/, /مميز/],
    // THE OTHER ROUND-6 PLANT: "انتقل إلى النسخة المدفوعة …". The PHRASE, never bare
    // مدفوع — a shop's own confirm screen says المدفوع of an order.
    "paid-version": [
      /النسخة المدفوعة/,
      /نسخة مدفوعة/,
      /الإصدار المدفوع/,
      /النسخة الكاملة/,
    ],
  },
};

/**
 * The per-locale view the message-bundle suites want.
 *
 * `en-US` is the English substring ban's own job, so its only entry is the pair
 * D12 adds on top: `premium` is not in 17 §2's run of substrings.
 */
export const TIERING_WORDS: Record<string, RegExp[]> = {
  /*
   * English's own cell, which is NOT empty and used to be nearly so. 17 §2's
   * substring run covers `pricing plan tier billing upgrade free /mo` and D12
   * adds `premium`; none of them appears in "switch to the paid version for
   * more", which is the round-6 plant written in English. The hole was in every
   * language including this one.
   */
  "en-US": [/premium/i, /paid version/i, /full version/i, /paid account/i],
  ...Object.fromEntries(
    OTHER_LANGUAGES.map((language) => [
      language,
      BANNED_IDEAS.flatMap((idea) => IDEA_IN_LANGUAGE[language][idea]),
    ]),
  ),
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

/**
 * WHAT A READER COULD READ IN A BUILT SCRIPT: its string and template literals.
 *
 * ── WHY THE GREP STOPPED READING CODE ───────────────────────────────────────
 *
 * [Added 2026-08-11, wave 4b round 3.] The bundle grep ran over the WHOLE
 * minified file, code included, and a minifier writes code that spells things.
 * With the personalizer registered it reported `"/mo" in "/mo"` against
 * `E=b/mo` — a division by a one-letter identifier the minifier happened to
 * name `mo`. Nothing was wrong, nothing was on a screen, and no word in the app
 * had changed; a variable had been renamed by a tool nobody drives.
 *
 * That is a false positive rather than a miss, and it is still serious. A gate
 * whose output has to be inspected hit by hit is a gate a hurried reviewer
 * waves through, and one that fires on a change altering no words teaches
 * everybody that its red means nothing. Both failure modes end with a real hit
 * going past.
 *
 * ── AND IT LOSES NOTHING WORTH KEEPING ──────────────────────────────────────
 *
 * The ban is on WORDS A SHOP OWNER READS. A banned run inside a minified
 * identifier is not one: `E=b/mo` is invisible, and so is `.plannedSheets` in a
 * property name. This file's header already says as much about the identifiers
 * this repo renamed — `StockLine.free` became `spare` because a NAME is free to
 * change — and it is the same argument one step further: the reason to rename
 * them was never that a bundle might spell them, it was that a name leaks into
 * copy. Copy is what is checked.
 *
 * Everything a reader can read in a script is in a string: every locale bundle,
 * every label, every URL, every `aria-label`. `index.html` is hand-written
 * markup and is still checked whole, with no allowance of any kind.
 *
 * ── IT IS A SCANNER, NOT A REGEX, AND IT HAS TO BE ──────────────────────────
 *
 * Quotes appear inside comments and inside regular-expression literals, so a
 * pattern that matched `'…'` would desynchronise on the first `/["']/` in the
 * bundle and read the rest of the file as one giant string. This walks the
 * source once and tracks which of the seven states it is in. A `/` starts a
 * regex only where a value cannot have just ended, which is the same rule a
 * JavaScript parser applies and the reason `E=b/mo` reads as division.
 *
 * `lexicon.test.ts` drives it over a fixture holding all seven states.
 */
/**
 * One escape sequence, DECODED, and the index of its last character.
 *
 * Decoding is not tidiness. A bundler is free to write any character as
 * `\uXXXX` — esbuild does exactly that whenever its charset is `ascii`, which
 * is one config line away — and a gate reading `free` sees no `free` at
 * all. Reading the escapes back means the scanner's answer is the STRING, not
 * the source of the string, so the ban keeps biting whatever spelling the
 * packer chose.
 */
function unescape(source: string, at: number): [string, number] {
  const c = source[at + 1] ?? '';
  const simple: Record<string, string> = {
    n: '\n',
    t: '\t',
    r: '\r',
    b: '\b',
    f: '\f',
    v: '\v',
    '0': '\0',
  };
  if (c === 'u' && source[at + 2] === '{') {
    const end = source.indexOf('}', at + 3);
    if (end > 0) {
      const code = Number.parseInt(source.slice(at + 3, end), 16);
      return [Number.isNaN(code) ? '' : String.fromCodePoint(code), end];
    }
  }
  if (c === 'u') {
    const code = Number.parseInt(source.slice(at + 2, at + 6), 16);
    return [Number.isNaN(code) ? '' : String.fromCharCode(code), at + 5];
  }
  if (c === 'x') {
    const code = Number.parseInt(source.slice(at + 2, at + 4), 16);
    return [Number.isNaN(code) ? '' : String.fromCharCode(code), at + 3];
  }
  // `\"`, `\'`, `\\`, `\/` and a line continuation all stand for themselves.
  return [simple[c] ?? c, at + 1];
}

export function readableText(source: string): string {
  const out: string[] = [];
  let literal = '';
  /** Nested `${…}` inside template literals, innermost last. */
  const templates: number[] = [];
  let state: 'code' | 'line' | 'block' | 'regex' | "'" | '"' | '`' = 'code';
  /** The last character that could end a value — decides `/` division vs regex. */
  let prev = '';
  let braces = 0;

  for (let i = 0; i < source.length; i += 1) {
    const c = source[i]!;
    const next = source[i + 1] ?? '';

    if (state === 'line') {
      if (c === '\n') state = 'code';
      continue;
    }
    if (state === 'block') {
      if (c === '*' && next === '/') {
        state = 'code';
        i += 1;
      }
      continue;
    }
    if (state === 'regex') {
      if (c === '\\') i += 1;
      else if (c === '[') {
        // A character class may hold an unescaped `/`; skip to its end.
        while (i + 1 < source.length && source[i + 1] !== ']') {
          if (source[i + 1] === '\\') i += 1;
          i += 1;
        }
        i += 1;
      } else if (c === '/') {
        state = 'code';
        prev = 'x';
      }
      continue;
    }
    if (state === "'" || state === '"') {
      if (c === '\\') {
        const [decoded, after] = unescape(source, i);
        literal += decoded;
        i = after;
        continue;
      }
      if (c === state) {
        out.push(literal);
        literal = '';
        state = 'code';
        prev = 'x';
        continue;
      }
      literal += c;
      continue;
    }
    if (state === '`') {
      if (c === '\\') {
        const [decoded, after] = unescape(source, i);
        literal += decoded;
        i = after;
        continue;
      }
      if (c === '$' && next === '{') {
        // The expression inside is CODE. Remember the template to come back to.
        out.push(literal);
        literal = '';
        // `${` counts as an opening brace, so an object literal inside the
        // expression closes its own braces before this one is reached.
        templates.push(braces);
        braces += 1;
        state = 'code';
        prev = '';
        i += 1;
        continue;
      }
      if (c === '`') {
        out.push(literal);
        literal = '';
        state = 'code';
        prev = 'x';
        continue;
      }
      literal += c;
      continue;
    }

    // ── code ────────────────────────────────────────────────────────────────
    if (c === '/' && next === '/') {
      state = 'line';
      i += 1;
      continue;
    }
    if (c === '/' && next === '*') {
      state = 'block';
      i += 1;
      continue;
    }
    if (c === '/') {
      // After a value — an identifier, a number, `)`, `]` or a string — this is
      // division. Anywhere else it opens a regular expression.
      state = /[\p{L}\p{N}_$)\]]/u.test(prev) ? 'code' : 'regex';
      continue;
    }
    if (c === "'" || c === '"' || c === '`') {
      state = c;
      continue;
    }
    if (c === '{') braces += 1;
    if (c === '}') {
      braces -= 1;
      if (templates.length > 0 && braces === templates[templates.length - 1]) {
        templates.pop();
        state = '`';
        continue;
      }
    }
    if (!/\s/.test(c)) prev = c;
  }

  return out.join('\n');
}

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
      const token = tokenAround(text, at, end);
      /*
       * THE HOMOGRAPH CARVE-OUT APPLIES HERE TOO, and it did not, which only
       * mattered once the tiering table stopped being one word per language. A
       * built file interleaves all eight locales and no byte can be attributed
       * back to the language it came from, so the union runs over everything —
       * and the union is where German's `Tarif` (a PLAN) meets French's
       * `tarifs` (what a carrier charges). One is banned, the other is on the
       * delivery page in front of a customer. The exact-token list is the
       * mechanism this file already has for exactly that.
       */
      if (ALLOWED_TOKENS.has(token.toLowerCase())) continue;
      out.push({
        word: pattern.source,
        token,
        context: context(at, end),
      });
    }
  }

  return out;
}
