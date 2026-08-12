/**
 * IS THIS FILE STILL TEXT, OR HAVE THE TOOLS QUIETLY STOPPED READING IT?
 *
 * ── THE DEFECT ──────────────────────────────────────────────────────────────
 *
 * [2026-08-12. Found in `personalizer/src/store.ts`, and in two suites beside
 * it.]
 *
 * A separator that cannot occur in real data is a good idea. `store.ts` keys a
 * personalization by the piece and the shopper's words joined with a NUL,
 * precisely so that `"a b" + "c"` and `"a" + "b c"` cannot spell each other's
 * key; the fingerprint ledgers do the same with NUL between a locale and its
 * value. Every one of them was written as a RAW BYTE in the source rather than
 * as an escape, and that is not a matter of taste:
 *
 *   `file` calls the module DATA rather than source. `grep` decides it is
 *   binary and matches NOTHING inside it — silently, with exit status 0, so a
 *   search that should have hit comes back clean and reads as an answer.
 *
 * It cost something immediately. A search for a reset seam in `store.ts` came
 * back empty while `forgetAll` was sitting in that file exported, and a second
 * one was very nearly written next to the one that already existed. The same
 * blindness applies to every hand-run grep over these repos, and to the release
 * sweep, which IS a grep.
 *
 * ── WHY THE FAILURE SHAPE EARNS A GATE ──────────────────────────────────────
 *
 * A tool that skips a file reports exactly what a clean file reports. Nothing
 * turns red, no count goes down, and the answer is wrong in the direction that
 * reads as success — the shape every hole in this wave has had.
 *
 * ── WHAT IS ALLOWED, WHICH IS THREE BYTES ───────────────────────────────────
 *
 * Tab, newline and carriage return: the whitespace a text file is made of.
 * Everything else below U+0020 must be spelled as an escape (`\x00`, `\x01`).
 * The compiled string is identical — that is the whole point — and the file
 * stays readable by every tool that sniffs before it reads.
 *
 * ── AND IT IS ONE FILE ──────────────────────────────────────────────────────
 *
 * For the reason `purity.ts` gives at length: a rule of this shape kept as one
 * scanner per repo is not one rule, it is N rules that agree until the day one
 * of them is repaired. This is the scanner; each suite decides which files to
 * point it at.
 */

/** The three control bytes a text file is legitimately made of. */
const ALLOWED = new Set([0x09, 0x0a, 0x0d]);

export interface RawControl {
  /** 1-based, counted the way an editor counts. */
  line: number;
  /** The offending code unit, e.g. `0` for NUL. */
  code: number;
  /** `U+0000`, ready to print. */
  label: string;
}

/**
 * Every raw control character in `text`, in the order they appear.
 *
 * Read by code unit rather than by regular expression on purpose: a character
 * class spanning the C0 range is the one construct here that a reader cannot
 * check at a glance, and it is also what `no-control-regex` exists to complain
 * about. Three allowed bytes, named, and everything under U+0020 reported.
 */
export function rawControlsIn(text: string): RawControl[] {
  const out: RawControl[] = [];
  let line = 1;
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    if (code === 0x0a) line += 1;
    if (code > 0x1f || ALLOWED.has(code)) continue;
    out.push({ line, code, label: `U+${code.toString(16).padStart(4, '0').toUpperCase()}` });
  }
  return out;
}

/**
 * The findings for one file, ready to put in a failure message.
 *
 * Named rather than inlined because every suite that calls this wants the same
 * sentence, and a suite that phrased it its own way would be one more thing to
 * keep in step.
 */
export function rawControlOffences(name: string, text: string): string[] {
  return rawControlsIn(text).map((hit) => `${name}:${hit.line} · ${hit.label}`);
}

/** What a suite prints above the list, so a reader knows what to do about it. */
export const RAW_CONTROL_EXPLANATION =
  'These files carry a raw control byte, which makes `grep` treat them as binary ' +
  'and match nothing in them — silently, and with exit status 0. Write it as an ' +
  'escape (`\\x00`) instead: the string is identical and the file stays readable.';

/**
 * ── AND A SECOND COPY OF THIS SCANNER IS THE FAILURE, NOT THE FIX ───────────
 *
 * `purity.ts` carries the same pair for the same reason, and the reason is a
 * measured one: four packages had each written their own version of that rule
 * beside the shared file, none of them checked `crypto.getRandomValues`, and
 * every suite was green. A private second scanner does not announce itself —
 * the file passes, the claim gets made, and the two scanners only disagree
 * about the case nobody thought of.
 *
 * ── WHAT A RESTATEMENT OF *THIS* RULE LOOKS LIKE ────────────────────────────
 *
 * Not a character access. `charCodeAt` and `codePointAt` are ordinary and
 * frequent — hashing a string, looking a glyph up, turning a digit into an
 * Eastern Arabic one — and a detector that fired on them would be noise in
 * every repo that imports this. What is NOT ordinary is the C0 BOUNDARY: a
 * character class opening at NUL, or the number 0x1f used as a threshold.
 * Nothing in these repos spells either except this file.
 *
 * ── AND WHAT IT CANNOT SEE, STATED RATHER THAN IMPLIED ──────────────────────
 *
 * Someone determined to rewrite the scan can do it without either spelling —
 * `code < 32`, a loop over an explicit list, a `Buffer` comparison. This
 * catches the shapes a person reaches for when they are reimplementing rather
 * than evading, which is what actually happened with `purity.ts` four times
 * over. The import check in `shared-rule.test.ts` is the half that does not
 * depend on guessing a spelling: a repo that carries this file and calls
 * nothing in it is reported whatever its private version looks like.
 */
export interface EncodingRestatement {
  readonly pattern: RegExp;
  readonly means: string;
}

export const ENCODING_RESTATEMENTS: readonly EncodingRestatement[] = [
  {
    pattern: /\[\s*\\(?:x00|u0000|0)\s*-/,
    means: 'a character class opening at NUL — the C0 range, written out again',
  },
  {
    pattern: /0x1[fF]\b/,
    means: 'the C0 boundary as a number — the threshold this scanner already applies',
  },
];

/**
 * Every way `code` states this rule for itself, in the words of what it did.
 *
 * Read over source with its comments already stripped, like `restatementsIn`:
 * the prose here necessarily spells both patterns out, and a detector that
 * flagged the file explaining it would be one somebody switches off.
 */
export function encodingRestatementsIn(code: string): string[] {
  return ENCODING_RESTATEMENTS.filter((entry) => entry.pattern.test(code)).map(
    (entry) => entry.means,
  );
}
