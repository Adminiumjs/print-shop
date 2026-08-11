/**
 * WHAT EVERY HOST OF THESE ADD-ONS MUST DO — the list, in the shared mirror.
 *
 * ── THE FAILURE MODE THIS EXISTS FOR ────────────────────────────────────────
 *
 * Two shops vendor the same four add-ons through the same seam, and a defect
 * found in one of them gets fixed in one of them. That is not a hypothesis:
 *
 *   The studio found that a fill which EXISTS but draws nothing for a record
 *   suppresses the host's own content, and fixed it in round 2. The print works
 *   kept the old `AddOnSlot` for three more rounds, so connecting an add-on went
 *   on taking a picture away there.
 *
 *   The works routed its millimetres through `t()` so the unit could be a word.
 *   The studio's `sqm()` glued a literal `m²` on for two more rounds, beside a
 *   bundle that says `م²`.
 *
 *   The studio taught its spoilage field to accept Arabic-Indic digits in round
 *   4. Its OWN stock-count field, two screens away, went on throwing them away.
 *
 *   Both shops drew a focus ring 1.16:1 against their own pages, and both had to
 *   be measured before either was fixed.
 *
 * Every one of those was found by a person reading the other shop, which is not
 * a mechanism. This is the mechanism.
 *
 * ── HOW IT BITES ────────────────────────────────────────────────────────────
 *
 * The list lives HERE, in the package both hosts vendor, and each host's
 * `hostBehaviours.test.ts` maps every id to the case that demonstrates it. Add a
 * behaviour in the shop where you found it and the OTHER shop goes red on its
 * next run, naming the id and the reason — which is the whole of the repair,
 * because the reason a port does not happen is that nobody knows it is owed.
 *
 * It does NOT prove either host is correct. A host satisfies it by having a case
 * per id, and a bad case satisfies it as well as a good one. What it makes
 * impossible is the ASYMMETRY: one shop cannot quietly know something the other
 * does not.
 *
 * ── WHAT GOES IN IT ─────────────────────────────────────────────────────────
 *
 * Only behaviours that are TRUE OF BOTH HOSTS BY CONSTRUCTION — properties of
 * the seam, of the digit rules, of the empty-state contract. Never a fact about
 * one shop's catalogue, its screens or its copy. If it cannot be stated without
 * naming a shop, it does not belong here.
 */

export interface HostBehaviour {
  /** Stable id. A host maps this to the case that demonstrates it. */
  id: string;
  /** What a host must do, in one sentence a reviewer can disagree with. */
  must: string;
  /** The defect that put it on the list, so nobody deletes it as obvious. */
  because: string;
}

export const HOST_BEHAVIOURS: readonly HostBehaviour[] = [
  {
    id: 'slot-keeps-host-content-when-a-fill-draws-nothing',
    must:
      "An empty-state slot renders the host's own fallback even when a fill EXISTS, so that a " +
      'fill which draws nothing for this record does not blank the panel.',
    because:
      'A fill that returned null suppressed the fallback, and connecting an add-on replaced a ' +
      'real picture with a nought-by-nought div. Found in the studio in round 2; the works kept ' +
      'the defect until round 5.',
  },
  {
    id: 'digits-are-accepted-in-the-readers-own-numeral-system',
    must:
      'Every field that takes a number accepts Latin, Arabic-Indic and Eastern Arabic-Indic ' +
      'digits, and is seeded with the digits the reader reads.',
    because:
      "A field that stripped everything outside [0-9] made an Arabic reader's own keyboard " +
      'useless, and one seeded with String(n) showed a Latin digit in a value textContent does ' +
      'not carry. Both shipped; the second field in the same shop was still doing it in round 5.',
  },
  {
    id: 'a-unit-is-a-word-in-the-readers-language',
    must:
      'No unit symbol is written into JSX or glued onto a formatted figure: it comes from the ' +
      'message bundle, so each locale can spell it.',
    because:
      '`350gsm`, `5h 5m`, `${gsm}gsm` and a hard-coded `m²` all rendered English units on an ' +
      'Arabic page beside the same units the bundle already spelt correctly.',
  },
  {
    id: 'money-is-formatted-never-typed',
    must:
      'No message string in any locale carries a currency symbol or a typed amount: every ' +
      'price on a screen comes from the one money formatter, over a figure the engine holds.',
    because:
      'Packaging hints were finished sentences with `$4.50` in them: a bare `$` where every ' +
      'other price rendered `US$`, and a figure the quote engine could no longer move.',
  },
  {
    id: 'the-focus-ring-is-visible-and-measured',
    must:
      'The focus indicator clears 3:1 against every surface token in both themes, measured by ' +
      "resolving the token chain rather than by reading the rule's name.",
    because:
      'Both shops drew `3px solid var(--accent-soft)` — 1.16:1 and 1.18:1 — for the whole of ' +
      'this wave. Every rule looked deliberate; nothing had ever resolved one.',
  },
  {
    id: 'the-tour-gets-inside-an-add-ons-own-flow',
    must:
      "The surface crawl reaches screens several presses inside an add-on, and reports it when a " +
      'bound stops it rather than reading as finished.',
    because:
      'A press that was not awaited, and two controls sharing an accessible name, each left the ' +
      'crawl two presses deep while every coverage number read perfect — so whole screens were ' +
      'outside every guard in both repos.',
  },
  {
    id: 'the-documented-test-command-passes-on-a-clean-tree',
    must:
      'The command the README gives a reader is the command that is configured — a test that ' +
      'needs longer than the runner default says so in the repo, never on somebody\u2019s command line.',
    because:
      '`npm test` was red in both shops for a whole round. Three suites crawl the whole app, take ' +
      '7\u201319 s, and neither repo set `test.testTimeout`, so the 5 s default failed all three. The ' +
      'round that wrote them only ever ran vitest directly with its own flags.',
  },
  {
    id: 'a-host-greps-its-own-sources-for-an-add-ons-secrets',
    must:
      "Every add-on's server-only strings are checked in the host's SOURCES as well as in its " +
      'built artefact, off the add-on\u2019s own declaration rather than a list the host keeps.',
    because:
      'The works had a source-side D15 gate from round 1 and the studio never had one at all, ' +
      'though both vendor the same credentialled delivery add-on. Both hosts also hand-listed ' +
      'the needles, so a THIRD credentialled add-on would have shipped its secret setting keys ' +
      'with every gate green.',
  },
  {
    id: 'an-add-on-brings-its-own-facts-for-a-hosts-gates',
    must:
      "A host discovers what it needs to know about an add-on \u2014 the addresses it names and " +
      'cannot call, the strings that must never reach a browser, the Latin runs that are not ' +
      'quantities \u2014 from what it has VENDORED, never from a list of its own.',
    because:
      'Five host-local lists have now been found holding an add-on\u2019s facts: HOSTED_SLOTS, the ' +
      'Czech "pro" carve-out, the ar-EG numeral allowances, the inert origins and the D15 ' +
      'needles. Each one made a portable add-on require an edit inside the app receiving it.',
  },
  {
    id: 'the-focus-sweep-reads-every-focus-rule-and-both-longhands',
    must:
      'The focus-ring sweep reads every `:focus` selector \u2014 not only `:focus-visible` \u2014 the ' +
      'outline longhands as well as the shorthand, and a declaration with no trailing semicolon.',
    because:
      'The sweep matched `/(outline|box-shadow)\\s*:/` inside `:focus-visible` blocks only, so ' +
      '`outline-color: #ddd`, `{ outline: 1px solid #ddd }` and any `:focus` rule at all could ' +
      'put back the 1.16:1 ring that shipped past four rounds.',
  },
  {
    id: 'no-copy-changes-in-any-language-without-a-reviewer-reading-it',
    must:
      'Every message key is fingerprinted across all eight locales, and an addition, edit or ' +
      'removal in ANY language fails until somebody has read it and updated the ledger.',
    because:
      'The sweep lexicon is a regression set that cannot be made complete \u2014 deciding whether a ' +
      'sentence raises the subject of paying is reading for meaning. Two paid-tier upsells, in ' +
      'de-DE and ar-EG, passed every word list in three repos. v1 is free of charge.',
  },
  {
    id: 'a-fill-that-drew-nothing-leaves-the-hosts-own-content-alone',
    must:
      'A slot decides between an add-on\u2019s fill and the host\u2019s own content on whether the fill ' +
      'DREW anything, never on whether it emitted a node.',
    because:
      '`:empty` is a question about child nodes and this is a question about paint. Both shops ' +
      'keyed the fallback off `.slot-fill:not(:empty)`, so a fill returning a bare `<div/>` or a ' +
      'wrapper whose only child is `display: none` suppressed the host\u2019s own picture and left a ' +
      'blank box \u2014 the round-2 defect, one level down, in both hosts.',
  },
  {
    id: 'every-surface-that-names-a-company-carries-the-line',
    must:
      'The not-affiliated line sits on EVERY surface that names a company \u2014 each shelf card, each ' +
      'row, and every dialog \u2014 never once per page on behalf of all of them.',
    because:
      'The works printed it as a single footnote under a seven-card shelf: five cards had nothing ' +
      'to disclaim, the two that did said nothing, and a page-wide grep for "affiliat" passed. ' +
      'The studio had the per-card component from round 4 and the works did not.',
  },
  {
    id: 'a-tour-opens-a-surface-with-what-the-app-would-open-it-with',
    must:
      'Every string a test hands a surface must be one the app itself produces \u2014 a message in ' +
      'that locale or an identifier out of the demo\u2019s own records \u2014 never a literal the test ' +
      'invented.',
    because:
      'The works toured its finish-reason overlay with two English sentences the suite made up, in ' +
      'all eight locales, so the a11y and Arabic-numerals sweeps read copy the app never prints ' +
      'and never read the copy it does. The studio hard-coded two add-on keys, which would ' +
      'render an empty dialog the day either is renamed and still report the overlay as toured.',
  },
];
