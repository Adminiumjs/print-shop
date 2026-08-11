/**
 * CAN THIS CODE PRODUCE A DIFFERENT ANSWER TWICE?
 *
 * ── WHY THIS IS A FILE AND NOT THREE GREPS ──────────────────────────────────
 *
 * Every repo in this wave states the same rule — a demo's engines are pure, so
 * no real clock and no dice — and every repo stated it as a regular expression
 * of its own. They had drifted, and drifted in the way that is invisible:
 *
 *   the shared contract banned `Date.now`, `Math.random`, `new Date`,
 *   `performance.now` and `crypto.randomUUID`;
 *   the print works checked four of those, never `crypto.randomUUID`;
 *   the maker studio checked three, never `performance.now` either.
 *
 * Proven by appending one line to a shipped module in each host —
 *
 *     export const zzSeed = { at: performance.now(), id: crypto.randomUUID() };
 *
 * — and watching both suites stay green. Two clocks and a random identifier in
 * shipped code, past every gate in both apps.
 *
 * Nothing could have caught it. Three regular expressions in three repositories
 * have no place where two of them are in front of the same reader, which is the
 * same reason `host.ts` was mirrored, the same reason `egress.ts` is one file,
 * and the same reason `host-behaviours.ts` exists. So this is one file, copied
 * byte for byte into all three repos, and `host-mirror.test.ts` fails on any
 * difference — a repair made in one is a repair made in all three or a red run.
 *
 * ── WHAT IT BANS, AND WHY EACH IS THE CATEGORY RATHER THAN A SPELLING ──────
 *
 * Two categories, and both of them are about the same thing: a value the code
 * did not derive from its inputs.
 *
 *   A CLOCK. `Date.now()`, `new Date()` with no argument, `performance.now()`.
 *   Every date in these apps derives from a pinned instant the host passes in,
 *   which is what lets a test assert a promise date and a screenshot taken in a
 *   year still match the running demo.
 *
 *   A DIE. `Math.random()`, `crypto.randomUUID()`, `crypto.getRandomValues()`.
 *   The last two are the ones the hosts had never heard of, and they are the
 *   more likely arrival: a UUID looks like an identifier rather than like a
 *   random number, and the API that mints one is not named `random` anywhere a
 *   reader would notice.
 *
 * `new Date(x)` WITH AN ARGUMENT IS NOT BANNED, deliberately: it is arithmetic
 * over a value the caller controls, and `new Date(Date.UTC(2026, 7, 5))` is how
 * a pinned instant is written. The empty call is the one that reads the
 * machine.
 */

/** One way to get an answer that is not a function of the inputs. */
export interface Impurity {
  readonly pattern: RegExp;
  /** What it is, in the words a failure should use. */
  readonly means: string;
}

export const IMPURITIES: readonly Impurity[] = [
  { pattern: /(?<![\w$.])Date\s*\.\s*now\s*\(/, means: "Date.now() — the real clock" },
  { pattern: /new\s+Date\s*\(\s*\)/, means: "new Date() with no argument — the real clock" },
  {
    pattern: /(?<![\w$])performance\s*\.\s*now\s*\(/,
    means: "performance.now() — a clock under another name",
  },
  { pattern: /(?<![\w$.])Math\s*\.\s*random\s*\(/, means: "Math.random() — a die" },
  {
    pattern: /(?<![\w$])crypto\s*\.\s*randomUUID/,
    means: "crypto.randomUUID() — a die that looks like an identifier",
  },
  {
    pattern: /(?<![\w$])crypto\s*\.\s*getRandomValues/,
    means: "crypto.getRandomValues() — the same die, one level down",
  },
];

/**
 * Every impurity named in `code`. Pass code with its comments already stripped:
 * every one of these rules is documented in prose that has to quote the very
 * thing it forbids, this file included.
 */
export function impuritiesIn(code: string): string[] {
  return IMPURITIES.filter((impurity) => impurity.pattern.test(code)).map(
    (impurity) => impurity.means,
  );
}

/**
 * ── THE SECOND HALF OF THE SAME REPAIR: WHO MAY STATE THE RULE ──────────────
 *
 * The header above says a repair made in one copy is a repair made in all three
 * or a red run. That was true of the THREE COPIES OF THIS FILE and of nothing
 * else, and it left the more common way to hold a stale rule wide open: not
 * carrying an old copy of this file, but never having imported it.
 *
 * All four add-on packages restated the rule as an inline regular expression of
 * their own. None of the four checked `crypto.getRandomValues`, and one omitted
 * `crypto.randomUUID` as well. Appending
 *
 *     export const zzSeed = crypto.getRandomValues(new Uint8Array(4))[0];
 *
 * to `personalizer/src/template.ts` — the engine whose determinism is the whole
 * of AC17 — left the package at 157 of 157 green and put the die in both built
 * bundles. The byte-for-byte guard could not see it: there was no second copy
 * of this file to differ from.
 *
 * So the arrangement itself is now the thing under test. `shared-rule.test.ts`
 * asks two questions of every package and every host: does it IMPORT this file,
 * and does it state the rule anywhere else. The first catches a package that
 * dropped the shared rule; the second, below, catches one that grew a private
 * second copy beside it.
 *
 * ── HOW A RESTATEMENT IS TOLD FROM A MENTION ────────────────────────────────
 *
 * A pattern hunting `Date.now(` cannot spell it the way code does: a bare dot
 * matches any character and a bare paren opens a group, so it comes out as
 * `Date\.now\s*\(`. THE BACKSLASH IS THE WHOLE DISCRIMINATOR. Source that
 * merely contains `Date.now()` — a fixture, a string handed to `impuritiesIn`,
 * this very comment — carries no backslash and is not a restatement. Source
 * that spells the same call with regex escapes is doing this file's job again.
 *
 * Which is why this is NOT `impuritiesIn` pointed at the test files. That would
 * fail on every fixture, including the ones proving the rule works, and a guard
 * that fails on correct code is a guard somebody deletes by the end of the day.
 */

/** `\s*` — the filler a pattern writes where code would write a space. */
const GAP = String.raw`(?:\\s\*)?`;
/** The two characters `\` and `.`: a dot some pattern had to escape. */
const ESCAPED_DOT = String.raw`\\\.`;
/** The two characters `\` and `(`. */
const ESCAPED_OPEN = String.raw`\\\(`;

/** `owner.name`, as a pattern would have had to write it. */
const asPattern = (owner: string, name: string): RegExp =>
  new RegExp(
    // `crypto\.randomUUID`, `Date\s*\.\s*now` — the escaped dot, which is how
    // every one of the four copies happened to be written…
    `${owner}${GAP}${ESCAPED_DOT}${GAP}${name}` +
      // …and `Date.now\(`, where the dot was left bare and the call paren is
      // the character that had to be escaped instead.
      `|${owner}${GAP}\\.${GAP}${name}${GAP}${ESCAPED_OPEN}`,
  );

/** The same six APIs, spelled as a rival rule would have to spell them. */
export const RESTATEMENTS: readonly Impurity[] = [
  { pattern: asPattern("Date", "now"), means: "a second pattern for Date.now()" },
  {
    pattern: new RegExp(String.raw`new(?:\\s\+|\s)+Date${GAP}${ESCAPED_OPEN}`),
    means: "a second pattern for new Date()",
  },
  { pattern: asPattern("performance", "now"), means: "a second pattern for performance.now()" },
  { pattern: asPattern("Math", "random"), means: "a second pattern for Math.random()" },
  { pattern: asPattern("crypto", "randomUUID"), means: "a second pattern for crypto.randomUUID()" },
  {
    pattern: asPattern("crypto", "getRandomValues"),
    means: "a second pattern for crypto.getRandomValues()",
  },
];

/**
 * Every place `code` states this file's rule over again. Pass code with its
 * comments already stripped, for the reason `impuritiesIn` gives.
 *
 * A non-empty answer is not a bug in the code it was read from — it is a bug in
 * the ARRANGEMENT: two rules where there is meant to be one, and only one of
 * them gets repaired next time.
 */
export function restatementsIn(code: string): string[] {
  return RESTATEMENTS.filter((restated) => restated.pattern.test(code)).map(
    (restated) => restated.means,
  );
}
