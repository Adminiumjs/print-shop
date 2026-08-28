/**
 * The rules that are easier to break than to notice.
 *
 * Four of this wave's non-negotiables cannot be checked by reading a diff,
 * because each of them is about an ABSENCE: no real third-party call, no real
 * clock, no secret in the browser, no physical CSS direction. A grep over the
 * sources is the only test shape that catches them, so it lives here rather
 * than in a review checklist somebody will one day skim.
 *
 * Each package in the add-ons monorepo ships this suite over its own sources.
 * This is the host's copy, and it deliberately covers `src/add-ons/vendor/` as
 * well: the vendored halves are compiled into THIS bundle, so a `fetch` that
 * reached a customer's browser would reach it from here whatever the add-on's
 * own suite said about its own package.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { NOW } from './data/demo.ts';
import { IMPURITIES, impuritiesIn, restatementsIn } from './testing/purity.ts';
import {
  RAW_CONTROL_EXPLANATION,
  rawControlOffences,
  rawControlsIn,
} from './testing/encoding.ts';
import {
  connectedBackend,
  foreignImportsIn,
  foreignModulesIn,
  offendingAddresses,
  sendersIn,
  withoutComments,
  type AllowedModule,
  type InertOrigin,
} from './testing/egress.ts';

const SRC = new URL('.', import.meta.url).pathname;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const ALL = walk(SRC).filter((f) => /\.(ts|tsx)$/.test(f));
/** The shipped half: everything that is not itself a test or a test helper. */
const SHIPPED = ALL.filter((f) => !f.includes('.test.') && !f.includes(`${'testing'}/`));

const read = (file: string) => readFileSync(file, 'utf8');

/**
 * ── THE ONE FILE THAT MAY READ THE REAL CLOCK (28-T28) ─────────────────────
 *
 * `purity.ts`'s rule is about the DEMO's reproducibility: every date derives
 * from a pinned instant so that a test can assert a promise date and a
 * screenshot taken in a year still matches the running app. A CONNECTED build
 * is the case that rule was never about — its job is to show what the works is
 * doing NOW, and the tenant's real clock is the input it is missing.
 *
 * So this is not "`adminiumSource.ts` is exempt", which is the shape this file
 * argues against for egress and would forgive a die as readily as a clock. It
 * is TWO MEANS, in ONE FILE. A `Math.random()` in the connected source is still
 * a finding, a clock in any other file is still a finding, and the test below
 * drives both of those rather than asserting them in prose.
 */
const CONNECTED_SOURCE = 'data/adminiumSource.ts';

/** The clock half of `IMPURITIES`, by the exact words that file emits. */
const CLOCKS: readonly string[] = [
  'Date.now() \u2014 the real clock',
  'new Date() with no argument \u2014 the real clock',
  'performance.now() \u2014 a clock under another name',
];

/**
 * The source with its comments removed.
 *
 * Every rule below is about what the CODE does, and the comments explaining
 * those rules necessarily quote the very things they forbid — this file's own
 * `Date.now()` would fail its own grep otherwise. Stripping first is what lets
 * the prose stay specific.
 */
/**
 * The source with its comments removed, by a LEXER and not two regexes.
 *
 * [Changed 2026-08-20.] What stood here deleted everything between a block
 * comment opener and the next closer, wherever they appeared. An adversarial
 * pass put those two tokens inside two ORDINARY STRING LITERALS with a real
 * third-party import between them, and every static net below went blind at
 * once: the import, an image beacon and a literal tracker address all vanished
 * before any scanner ran, the suite stayed green, and the module reached the
 * built bundle. It was not one gate's hole, it was this function's.
 *
 * Half of it was already known — the line-comment regex carried an explicit
 * guard so a `https` prefix inside a string was not read as a comment. There
 * was no counterpart for block comments. `withoutComments` is string-aware for
 * both, and is the same file in all three repos.
 */
const codeOf = (file: string) => withoutComments(read(file));
const relative = (file: string) => file.slice(SRC.length);

/**
 * THE ADDRESSES THIS BUNDLE IS ALLOWED TO NAME, AND WHY EACH IS INERT.
 *
 * Every entry is a decision somebody wrote down. Anything not here is reported,
 * including a second path on a host already listed — the comparison is on the
 * origin and it is exact, so `api.canva.com.somewhere-else.test` does not
 * inherit `api.canva.com`'s allowance.
 */
/**
 * ── AN ADDRESS AN ADD-ON NAMES IS THE ADD-ON'S FACT, NOT THIS APP'S ─────────
 *
 * What stood here was a list of origins this app allows, and two of the entries
 * were Canva's — declared by an app that merely RECEIVES the add-on that names
 * them. That is AC20/D21 broken in both directions, and it was demonstrated in
 * both: vendoring the personalizer into this app unchanged, registration only,
 * turned this suite red on
 * `add-ons/vendor/personalizer/template.ts → http://www.w3.org/2000/svg`, and
 * vendoring Canva Import into the studio turned ITS suite red the same way.
 * Making a portable add-on pass required an edit to an exemption list inside
 * the host — the exact thing a closed slot registry exists to make unnecessary.
 *
 * This is the FOURTH host-local list found holding an add-on's fact, after
 * `HOSTED_SLOTS`, the Czech "pro" carve-out and the ar-EG numeral allowances.
 * Round 5 built the mechanism for the third; this is that mechanism, applied.
 * Every add-on exports `INERT_ORIGINS` from its own `add-on-facts.ts`, the
 * sync vendors it, and `addOnOrigins()` reads whatever THIS app has vendored.
 * Vendor an add-on and its declarations arrive; drop it and they leave; nothing
 * in this file changes either way.
 *
 * `import.meta.glob` is resolved by the bundler, so by the time this runs it is
 * a static list of modules — no filesystem read, no dynamic import.
 */
const VENDORED_ORIGINS = import.meta.glob<{
  INERT_ORIGINS?: readonly { origin: string; why: string }[];
  NEVER_IN_A_BROWSER?: readonly { text: string; why: string }[];
}>("./add-ons/vendor/*/add-on-facts.ts", { eager: true });

function addOnOrigins(): InertOrigin[] {
  return Object.values(VENDORED_ORIGINS).flatMap((module) => [...(module.INERT_ORIGINS ?? [])]);
}

/**
 * What every add-on this app vendors declares must never reach a browser.
 *
 * The same discovery the inert origins use, off the same file. See
 * `builtOutput.test.ts` for why these are the add-on's facts and not this
 * app's, and what shipped green while they were this app's.
 */
function addOnNeedles(): { text: string; why: string }[] {
  return Object.values(VENDORED_ORIGINS).flatMap((module) => [
    ...(module.NEVER_IN_A_BROWSER ?? []),
  ]);
}


/**
 * THIS APP'S OWN, WHICH IS NONE.
 *
 * The works names no address anywhere in its own sources — it has no egress to
 * declare — and an empty list is the strictest state there is: the net reports
 * EVERY address, so the day this app names one somebody has to come here and
 * write down why it cannot cause a request.
 *
 * ── AND CONNECTED MODE DOES NOT RELAX THIS LIST, ON PURPOSE (28-T26) ───────
 *
 * `builtOutput.test.ts` declares the Adminium instance a connected build was
 * pointed at, because Vite inlines that origin into the shipped bytes and it
 * has to be allowed there. This list stays empty, and the asymmetry is the
 * rule: THE BACKEND ADDRESS COMES FROM CONFIGURATION, NEVER FROM A SOURCE
 * LITERAL. A source that hardcodes the instance is still a finding here, which
 * is what stops one tenant's URL from being baked into an app the marketplace
 * serves to everybody.
 */
const OURS: readonly InertOrigin[] = [];

/**
 * ── AND THE PACKAGES A SHIPPED SOURCE MAY IMPORT (28-T26 follow-up) ────────
 *
 * Net two banned the APIs that send and the dynamic `import()` of anything but
 * a relative literal, and read as though it covered "reaching outside this
 * repo". A STATIC import was in neither half: `import { track } from
 * "some-analytics-sdk"` matched nothing, because the `fetch` is in the SDK and
 * not in our file. This is the closed set that makes the default a refusal.
 *
 * Each entry is a package this app already declares in its own package.json,
 * and the `why` is what a reviewer reads. None of them is claimed to be
 * AUDITED — `react` is here because a React app imports React. What the list
 * buys is that a name nobody agreed to cannot appear in a shipped source.
 */
const ALLOWED_MODULES: readonly AllowedModule[] = [
  { name: 'react', why: 'the renderer; this is a React app and every screen imports it' },
  { name: 'react-dom', why: 'the renderer\u2019s DOM half \u2014 `react-dom/client` mounts the root, once' },
  {
    name: 'lucide-react',
    why: 'icons, which compile to inline `<svg>` elements. It fetches nothing: an icon that named an address would be reported by net one over the built output',
  },
  { name: 'zustand', why: 'the in-memory store. It holds state and makes no request' },
  {
    name: '@adminiumjs/public-client',
    why: 'the connected mode\u2019s client for this shop\u2019s own Adminium instance (28-T28). It DOES issue requests, which is what it is for, and the address it may reach is not forgiven here \u2014 it is `connectedBackend`\u2019s single declared origin, checked over every file and over the built output',
  },
];

/*
 * Ours, plus whatever the add-ons this app vendors declare for themselves, plus
 * the backend a CONNECTED build was pointed at (28-T26, 28-T28).
 *
 * Empty in every demo build, which is every build the marketplace serves and
 * every build CI makes. When `VITE_ADMINIUM_API_BASE_URL` is set, Vite inlines
 * it into `data/adminiumSource.ts` as a literal and this is the declaration
 * that says so — one host, forgiven in EVERY file, rather than every host
 * forgiven in one file. `builtOutput.test.ts` carries the same line for the
 * shipped bytes.
 */
const INERT: readonly InertOrigin[] = [
  ...OURS,
  ...addOnOrigins(),
  ...connectedBackend(process.env['VITE_ADMINIUM_API_BASE_URL']),
];

describe('no real third-party call, no real clock (24 D11)', () => {
  /*
   * D11 AS A RULE, NOT A WORD LIST — and this repo is where the word list was
   * beaten. A verifier put two real requests inside the vendored delivery
   * add-on's `UnresolvedDestination`:
   *
   *     const img = new Image();
   *     img.src = "https://tracking.example-analytics.net/p?c=" + …
   *
   * `new Image()` is not `fetch(`, `XMLHttpRequest`, `new WebSocket` or
   * `navigator.sendBeacon`, so the four-word grep that used to stand here saw
   * nothing, and the bytes reached the live app's bundle. Neither would it have
   * seen a `<script>` tag, a `<link rel=preconnect>`, a form `action`, a CSS
   * `url()`, an `<iframe>`, a `Worker`, a dynamic `import()` or `sendBeacon`
   * under an alias.
   *
   * `testing/egress.ts` states the category instead, in three nets. Two of them
   * are static and are below; the third watches the running page and is in
   * `add-ons/egress.test.tsx`, because the value handed to `img.src` is not a
   * property of the text.
   */
  it('names no address outside the ones declared inert', () => {
    const offenders = SHIPPED.flatMap((file) =>
      offendingAddresses(codeOf(file), INERT).map((url) => `${relative(file)} → ${url}`),
    );
    expect(offenders).toEqual([]);
  });

  it('carries nothing that can issue a request', () => {
    // A demo that posted to a real carrier or a real design tool on every
    // visitor's click would be a defect, not a feature. In connected mode the
    // call belongs to the SERVER half of an add-on, which is not in this
    // bundle and cannot be — `scripts/sync-add-ons.sh` refuses to vendor it.
    //
    // This is also what makes the two declared Canva endpoints above harmless:
    // an address with no way to send is a string.
    const offenders = SHIPPED.flatMap((file) => [
      ...sendersIn(codeOf(file)).map((means) => `${relative(file)} → ${means}`),
      ...foreignImportsIn(codeOf(file)).map((spec) => `${relative(file)} → ${spec}`),
      // The static half, which neither of the two above ever looked at.
      ...foreignModulesIn(codeOf(file), ALLOWED_MODULES).map(
        (spec) => `${relative(file)} → imports ${spec}, which nobody declared`,
      ),
    ]);
    expect(offenders).toEqual([]);
  });

  /*
   * ── THE STATIC-IMPORT RULE, DRIVEN AT ITS EDGES ──────────────────────────
   *
   * Over the rule rather than over `src/`, so these stay true on the day the
   * app's dependency list changes. The two that matter most are the
   * side-effect import — no symbol in the file to notice — and the lookalike,
   * because a `startsWith` would forgive it.
   */
  it('sees a static import, in the spellings the old net two could not', () => {
    const allowed = [{ name: 'react', why: 'test' }];
    const seen = (code: string): string[] => foreignModulesIn(code, allowed);

    expect(seen('import { track } from "some-analytics-sdk";')).toEqual(['some-analytics-sdk']);
    // No bindings at all: it imports nothing and runs everything in the module.
    expect(seen('import "some-analytics-sdk";')).toEqual(['some-analytics-sdk']);
    expect(seen('export { z } from "exfil-pkg";')).toEqual(['exfil-pkg']);
    expect(seen('import {\n  a,\n} from "beacon-pkg";')).toEqual(['beacon-pkg']);
    expect(seen('import type { T } from "types-pkg";')).toEqual(['types-pkg']);
    expect(seen('export * from "@evil/scope-pkg/deep";')).toEqual(['@evil/scope-pkg/deep']);
  });


  /*
   * ── THE FIVE WAYS AN ADVERSARIAL PASS BEAT THIS, ALL DRIVEN ──────────────
   *
   * Every one of these was confirmed end to end on 2026-08-20 — planted in a
   * shipped source, built, and found in `dist/` — against the first draft,
   * which anchored the pattern to the start of a line instead of lexing. They
   * are here so no repair quietly drops one.
   */
  it('is not blinded by two string literals carrying the comment tokens', () => {
    // THE WORST OF THEM, because it defeated every static net at once: the
    // opener inside the first string began a comment that ran to the closer
    // inside the third, and the harness deleted the import before any scanner
    // ran. `withoutComments` is string-aware, so nothing is deleted.
    const open = `${'/'}${'*'}`;
    const close = `${'*'}${'/'}`;
    const source = [
      `const openTok = "x ${open}";`,
      'import { track } from "some-analytics-sdk";',
      `const closeTok = "z ${close}";`,
    ].join('\n');
    expect(foreignModulesIn(source, [])).toEqual(['some-analytics-sdk']);
    expect(withoutComments(source)).toContain('some-analytics-sdk');
  });

  it('sees an import that does not begin its line', () => {
    // Legal top-level ES that Vite bundles. The line-start anchor missed it.
    expect(foreignModulesIn('const a = 1; import { t } from "sdk";', [])).toEqual(['sdk']);
  });

  it('sees an import behind any ES whitespace, not just tab and space', () => {
    // The anchor allowed [\t ]. The WhiteSpace production also admits these,
    // and every one of them was silent while the bundler resolved the module.
    for (const code of [0x00a0, 0x000b, 0x000c, 0x2000, 0xfeff]) {
      const source = `${String.fromCharCode(code)}import "sdk";`;
      expect(foreignModulesIn(source, []), `U+${code.toString(16)}`).toEqual(['sdk']);
    }
  });

  it('does not read a docs snippet inside a template literal as an import', () => {
    // The other half of the same defect: a README, an install block or an i18n
    // message held in a template is prose. Reporting it names a package that
    // does not exist and blocks the build, which is how gates earn exemptions.
    const help = 'const help = `\nimport { Button } from "@acme/ui";\n`;';
    expect(foreignModulesIn(help, [])).toEqual([]);
  });

  it('does not let a traversal segment inherit a declared package', () => {
    // `react/../evil` does not resolve inside react, so it must not borrow
    // react's allowance. Resolvers mostly refuse it, but that is the package's
    // exports map protecting us, not this gate.
    expect(foreignModulesIn('import x from "react/../evil";', [{ name: 'react', why: 't' }])).toEqual(
      ['react/../evil'],
    );
  });

  it('forgives that package and no other, subpaths included', () => {
    const allowed = [{ name: 'react-dom', why: 'test' }];
    expect(foreignModulesIn('import { createRoot } from "react-dom/client";', allowed)).toEqual([]);
    expect(foreignModulesIn('import x from "react-dom-tracker";', allowed)).toEqual([
      'react-dom-tracker',
    ]);
    expect(foreignModulesIn('import x from "./local.ts";', allowed)).toEqual([]);
  });

  it('does not mistake the word `import` inside a string for one', () => {
    // This repo really does have `setStep('import')`, and the first draft of
    // the scanner read the closing quote as an opening one and reported a
    // paragraph of JSX as a package. A gate that cries wolf gets an exemption
    // list, and an exemption list is where the last nine defects came from.
    expect(foreignModulesIn('const step = "import";\nsetStep("import");', [])).toEqual([]);
  });

  /*
   * THE RULE IS `testing/purity.ts` NOW — one file, byte for byte in this repo,
   * the maker studio and the add-ons monorepo, with the mirror guard there
   * failing on any difference. There were three separate regular expressions
   * before, they had drifted, and the drift was invisible: this app never
   * checked `crypto.randomUUID` and the studio checked neither that nor
   * `performance.now`, so appending
   *
   *     export const zzSeed = { at: performance.now(), id: crypto.randomUUID() };
   *
   * to a shipped module left both suites green.
   */
  /*
   * ── THE CONNECTED-BUILD RELAXATION, DRIVEN AT ITS EDGES (28-T26) ─────────
   *
   * `connectedBackend` is the only thing that can widen NET ONE, so it is the
   * only thing worth trying to beat. These run over the rule itself rather than
   * over `src/`, so they stay true on a day this app has no connected build --
   * which is every day until the rollout reaches it.
   */
  it('declares nothing in a demo build, which is what the marketplace ships', () => {
    expect(connectedBackend(undefined)).toEqual([]);
    expect(connectedBackend('')).toEqual([]);
    expect(connectedBackend('   ')).toEqual([]);
  });

  it('declares exactly the configured origin, port and all', () => {
    expect(connectedBackend('https://api.tenant.example.test').map((e) => e.origin)).toEqual([
      'https://api.tenant.example.test',
    ]);
    // A path is normal for a base URL and is not part of the origin. A default
    // port is NOT dropped, because the inlined literal would still carry it and
    // both sides of the comparison have to spell the host the same way.
    expect(
      connectedBackend('https://api.tenant.example.test:8443/api/v1/public').map((e) => e.origin),
    ).toEqual(['https://api.tenant.example.test:8443']);
  });

  it('forgives that host and no other, so a lookalike is still a finding', () => {
    const inert = connectedBackend('https://api.tenant.example.test');
    expect(offendingAddresses('const a = "https://api.tenant.example.test/x";', inert)).toEqual([]);
    expect(
      offendingAddresses('const a = "https://api.tenant.example.test.attacker.test/x";', inert),
    ).toEqual(['https://api.tenant.example.test.attacker.test/x']);
    // The whole point of an origin and not a file: the declared backend does
    // not forgive a beacon that happens to sit in the same source.
    expect(offendingAddresses('img.src = "https://tracking.example-analytics.net/p";', inert)).toEqual(
      ['https://tracking.example-analytics.net/p'],
    );
  });

  it('declares nothing when the value is not exactly one address, so it fails closed', () => {
    // A half-written value must not quietly widen the net. Each of these leaves
    // the inlined literal to be reported, which is the loud outcome.
    for (const bad of ['not a url', '/api/v1/public', 'https://a.test https://b.test', 'https://']) {
      expect(connectedBackend(bad), bad).toEqual([]);
    }
  });

  it('reads no real clock and rolls no dice', () => {
    // 21 D6. Every date in the app derives from the pinned moment below, which
    // is what lets `quote.test.ts` assert a promise date and a screenshot taken
    // in a year still match the running demo.
    const offenders = SHIPPED.flatMap((file) =>
      impuritiesIn(codeOf(file))
        .filter((means) => !(relative(file) === CONNECTED_SOURCE && CLOCKS.includes(means)))
        .map((means) => `${relative(file)} → ${means}`),
    );
    expect(offenders).toEqual([]);
  });

  it('still refuses a die in the connected source, and a clock anywhere else', () => {
    // The exemption above is two MEANS in one FILE, not a file that may do as
    // it likes. Driven over the rule rather than over `src/`, so it stays true
    // on a day this app has no connected source at all.
    const die = 'const id = crypto.randomUUID();';
    expect(impuritiesIn(die).filter((m) => !CLOCKS.includes(m))).toHaveLength(1);
    // …and every name in the allow-list is a means `purity.ts` actually emits,
    // so renaming one there fails here instead of quietly widening the net.
    const known = IMPURITIES.map((impurity) => impurity.means);
    expect(CLOCKS.filter((means) => !known.includes(means))).toEqual([]);
  });

  it('would say so if one arrived, in every spelling the three repos disagreed on', () => {
    // The mutant that proved the drift, driven through the shared rule rather
    // than through a restatement of it.
    expect(
      impuritiesIn('export const zzSeed = { at: performance.now(), id: crypto.randomUUID() };')
        .length,
    ).toBe(2);
    expect(impuritiesIn('const t = Date.now();').length).toBe(1);
    expect(impuritiesIn('const d = new Date();').length).toBe(1);
    expect(impuritiesIn('const r = Math.random();').length).toBe(1);
    expect(impuritiesIn('crypto.getRandomValues(new Uint8Array(8))').length).toBe(1);
    // …and pure arithmetic over a value passed in stays quiet.
    expect(impuritiesIn('const d = new Date(Date.UTC(2026, 7, 5));')).toEqual([]);
    expect(impuritiesIn('const d = new Date(iso);')).toEqual([]);
    expect(impuritiesIn('const at = clock.now();')).toEqual([]);
  });

  /**
   * AND NOBODY HERE MAY STATE THE RULE A SECOND TIME.
   *
   * The byte-for-byte mirror guard in the add-ons repo can only see a copy of
   * `testing/purity.ts` that DIFFERS. It is blind to the commoner shape, which
   * is a file that never imported it and is running its own regex beside it —
   * and that is precisely what all four add-on packages were doing while every
   * suite in this wave was green. This repo is where that would show up as an
   * app shipping a die, so the check runs here too rather than only in the
   * monorepo, which a published clone of this app does not have beside it.
   *
   * `testing/purity.ts` is excluded because it IS the rule and has to spell
   * every pattern out. Nothing else may.
   */
  it('states that rule in exactly one file, and this is not it', () => {
    const offenders = ALL.filter((f) => !f.endsWith(join('testing', 'purity.ts'))).flatMap((file) =>
      restatementsIn(codeOf(file)).map((means) => `${relative(file)} → ${means}`),
    );
    expect(
      offenders,
      'a pattern of its own beside the shared rule is two rules, and only one of them gets ' +
        'repaired next time — see testing/purity.ts',
    ).toEqual([]);
  });


  it('is pinned to the demo’s Wednesday', () => {
    expect(NOW).toEqual({ iso: '2026-08-05', hour: 10, minute: 20 });
  });
});

describe('secrets are server-only (24 D15)', () => {
  /**
   * ── THE SAME NEEDLES, ONE BUILD EARLIER, AND THEY ARE THE ADD-ON'S ────────
   *
   * `builtOutput.test.ts` greps the artefact; this catches a leak at the import
   * that would have caused one. Both used to spell the needles out — the
   * credentialled add-on's two `secret: true` setting keys and the type its
   * server half reads them into — inside an app that merely receives it, so a
   * THIRD credentialled add-on would have been checked for nothing at all.
   * They come off each vendored add-on's own `add-on-facts.ts` now; see the
   * block in `builtOutput.test.ts` for the argument.
   *
   * `apiKey` in camelCase is deliberately not among them, and that stays true
   * whoever declares it: the connect dialog holds one in component state while
   * the shop types it and drops it on submit, and `shop.connect.apiKey` is the
   * LABEL on that field. Banning the words a credential form has to say would
   * be banning the form, not the leak. What must never appear is the key a
   * value would be SAVED under.
   *
   * THE DECLARATION FILES THEMSELVES ARE NOT A LEAK. `add-on-facts.ts` exists
   * to NAME these strings, so it names them; it is data, it is imported by no
   * screen, and every other gate in this file — senders, clocks, the ban on
   * reaching `testing/` — still applies to it exactly as to any other vendored
   * module. Nothing else is excused.
   */
  it('keeps every secret setting out of the client half', () => {
    const needles = addOnNeedles();
    expect(needles.length, 'no add-on declared anything server-only').toBeGreaterThan(0);
    const offenders = SHIPPED.filter(
      (file) =>
        !file.endsWith('add-on-facts.ts') &&
        needles.some((needle) => codeOf(file).includes(needle.text)),
    );
    expect(offenders.map(relative)).toEqual([]);
  });

  it('never puts a typed credential into the store', () => {
    // The other half of the same rule: the dialog may collect one, and the
    // store — which any browser console can read — may never receive it.
    const store = codeOf(join(SRC, 'state', 'store.ts'));
    expect(/apiKey|accountNumber|credential/i.test(store)).toBe(false);
  });

  it('never lets shipped code reach the test-only directory, or zod', () => {
    /*
     * `src/testing/` holds the vendored manifest validator and the lexicon
     * fixture. Both import `zod`, which is a devDependency and a runtime
     * dependency the host does not carry (24 D7) — and the lexicon module
     * spells every banned word, so shipping it would fail the very grep it
     * defines. An import from a screen is the one way either could get out.
     */
    const offenders = SHIPPED.filter((file) =>
      /from ['"][^'"]*\/testing\/|from ['"]zod['"]/.test(codeOf(file)),
    );
    expect(offenders.map(relative)).toEqual([]);
  });

  it('vendors no add-on’s server half', () => {
    // `scripts/sync-add-ons.sh` names these as forbidden and fails its own
    // status check if one appears. Asserted here as well, because that script
    // can only COMPARE when the three add-on checkouts are beside this one,
    // and a clean clone of this repo alone has just this.
    const server = SHIPPED.filter((file) =>
      /\/vendor\/[^/]+\/(carrier|http|server)\.ts$|\/vendor\/[^/]+\/server\//.test(file),
    );
    expect(server.map(relative)).toEqual([]);
  });

  it('holds no credential in any seeded value', () => {
    const store = read(join(SRC, 'add-ons', 'registry.ts'));
    for (const word of ['sk_live', 'Bearer ', 'password']) {
      expect(store).not.toContain(word);
    }
  });
});

describe('CSS logical properties only', () => {
  it('uses no physical direction in any rendered style', () => {
    // The app renders Arabic right-to-left with no RTL stylesheet, so a
    // physical `left` is a bug that only one of eight locales would show.
    const physical =
      /\b(margin|padding|border|inset)(Left|Right)\b|textAlign:\s*"(left|right)"|\b(left|right):\s*\d/;
    const offenders = SHIPPED.filter((file) => /\.tsx$/.test(file) && physical.test(codeOf(file)));
    expect(offenders.map(relative)).toEqual([]);
  });

  it('has no stylesheet reaching for a physical side', () => {
    const css = walk(SRC).filter((f) => f.endsWith('.css'));
    expect(css.length).toBeGreaterThan(0);
    const physical = /(^|[\s;{])(margin|padding|border|text-align)-(left|right)\s*:|(^|[\s;{])(left|right)\s*:\s*[-\d]/;
    const offenders = css.filter((file) =>
      physical.test(read(file).replace(/\/\*[\s\S]*?\*\//g, ' ')),
    );
    expect(offenders.map(relative)).toEqual([]);
  });
});

describe('the vendored halves are copies, and say so', () => {
  /*
   * `scripts/sync-add-ons.sh` writes a five-line header onto every file it
   * vendors and `status` compares the rest byte for byte with the add-ons
   * monorepo. That comparison needs the monorepo checked out beside this one,
   * which a clean clone of THIS repo does not have — so the part that can
   * always be checked is checked here: every file under `vendor/` carries the
   * header, names the package it came from, and points at the script that
   * ships.
   *
   * A hand-edit is still invisible to this. It is not invisible to the script,
   * and the script is in the repo now, which is the whole of the fix.
   */
  const vendored = () =>
    walk(join(SRC, 'add-ons', 'vendor')).filter((f) => /\.(ts|tsx|css)$/.test(f));

  it('carries the sync header on every vendored file', () => {
    const files = vendored();
    expect(files.length).toBeGreaterThan(40);
    const offenders = files.filter((file) => {
      const head = read(file).split('\n').slice(0, 5).join('\n');
      return (
        !/^\/\*\n \* VENDORED from add-ons\/packages\/[a-z-]+\/src\/\S+ — synced by scripts\/sync-add-ons\.sh\.$/m.test(
          head,
        ) || !head.includes('Never hand-edit this copy')
      );
    });
    expect(offenders.map(relative)).toEqual([]);
  });

  /*
   * THE VENDORED TREE HAS TO BE SELF-CONTAINED, and this is the assertion that
   * says so from this side.
   *
   * The add-ons are one repository now, and they import their shared contract
   * as `@adminium/add-on-host`. This app has no node_modules entry for that
   * package and never will — it is built from a clean clone with no sibling
   * checkout of anything — so the sync vendors the shared package too, into
   * `vendor/host/`, and rewrites those specifiers onto it.
   *
   * `status` cannot catch a rewrite that fails to fire, because it applies the
   * SAME rewrite to the source before comparing: two files neither of which was
   * rewritten agree perfectly, and the build is what breaks. It happened on the
   * first run of the rewired script (a `sed -E` backreference that matches
   * nothing on BSD), the vendored tree came out full of unresolvable imports,
   * and `status` reported everything green. So the check belongs here as well,
   * where it is about the tree rather than about the copy.
   */
  it('resolves every vendored import inside the vendor tree', () => {
    const bare = /(?:from|import)\s*\(?\s*['"](@[^'"]+|[a-z][^'"./]*)['"]/g;
    /** What the host app itself already depends on (24 D7). */
    const ALLOWED = new Set(['react', 'react-dom', 'react/jsx-runtime', 'lucide-react']);
    const offenders = vendored().flatMap((file) =>
      [...codeOf(file).matchAll(bare)]
        .map((m) => m[1])
        .filter((spec) => !ALLOWED.has(spec))
        .map((spec) => `${relative(file)} · ${spec}`),
    );
    expect(offenders).toEqual([]);
  });

  it('vendors the shared contract exactly once', () => {
    // The reason the three add-on repos became one. Each used to carry its own
    // copy of `AddOn`, they disagreed within a day, and this app held all three
    // of them. There is one now, under `vendor/host/`, and the three import it.
    const declares = vendored().filter((f) => /\binterface AddOn\b/.test(read(f)));
    expect(declares.map(relative)).toEqual(['add-ons/vendor/host/host.ts']);
  });
});

describe('the host names no company (acceptance criterion 5)', () => {
  /*
   * AC5 says nothing in `printing` names a carrier, and the grep the criterion
   * prescribes is "dhl" — which is exactly the name this app does NOT contain
   * and so proved nothing. What it did contain, until this suite existed, was
   * `name: 'Royal Mail Shipping'`, `'Stripe Payments'` and `'Mailchimp Lists'`
   * in `add-ons/registry.ts`: three real firms named in host source for
   * integrations that do not exist. They are descriptions now (`shelf.ts`).
   *
   * So the grep is widened to the firms a print works would plausibly reach
   * for, and pointed at PRODUCTION SOURCE OUTSIDE `vendor/`. The vendored
   * halves are the add-ons themselves and name their own companies
   * nominatively, with a `TRADEMARKS.md` beside the claim in their own repos.
   */
  const COMPANIES =
    /\b(dhl|canva|royal ?mail|stripe|mailchimp|fedex|ups|dpd|hermes|paypal|klarna|sendgrid|shopify)\b/i;

  /** The three lines `registry.ts` is allowed to have, and no others. */
  const IMPORT_LINE = /^import \{ register as \w+ \} from '\.\/vendor\/[a-z-]+\/index\.ts';$/;

  it('mentions one only where an add-on bundle is imported', () => {
    const own = SHIPPED.filter((file) => !file.includes(`/vendor/`));
    const offenders = own.flatMap((file) =>
      codeOf(file)
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => COMPANIES.test(line) && !IMPORT_LINE.test(line))
        .map((line) => `${relative(file)} · ${line}`),
    );
    expect(offenders).toEqual([]);
  });

  it('would notice a company name put back on the shelf', () => {
    // The guard is an absence; this is it biting on the exact defect it closes.
    expect(COMPANIES.test("    name: 'Royal Mail Shipping',")).toBe(true);
    expect(COMPANIES.test("    name: 'A second delivery company',")).toBe(false);
    // And the one allowance is narrow: a path, not a display string.
    expect(IMPORT_LINE.test("import { register as shippingDhl } from './vendor/shipping-dhl/index.ts';")).toBe(true);
    expect(IMPORT_LINE.test("const carrier = 'DHL';")).toBe(false);
  });
});

describe('no path a banned grep would find (17 §2)', () => {
  it('writes no href containing the banned fragment', () => {
    const offenders = SHIPPED.filter((file) => /href=["'][^"']*\/mo/.test(codeOf(file)));
    expect(offenders.map(relative)).toEqual([]);
  });
});

/**
 * THE DOCUMENTED COMMAND IS THE ONE THAT HAS TO PASS.
 *
 * `npm test` shipped RED on a clean tree for a whole round. Three suites take
 * 7–19 s — they mount the app and crawl it — and nothing configured a timeout,
 * so vitest's 5 s default failed all three. Every one of them passed for the
 * round that wrote them, because that round ran `npx vitest run --testTimeout=…`
 * with its own flags and never ran the command the README gives a reader.
 *
 * The repair is in `vite.config.ts`. This is the part that keeps it there: a
 * config line has no other test, it reads as boilerplate in a diff, and the only
 * person who notices its absence is whoever next runs the documented command.
 */
describe("the test command a reader is given is the one that is configured", () => {
  const config = readFileSync(join(process.cwd(), "vite.config.ts"), "utf8");

  it("gives the suites long enough to finish", () => {
    const declared = /testTimeout:\s*([\d_]+)/.exec(config);
    expect(declared, "vite.config.ts sets no test.testTimeout — see the block there").not.toBe(
      null,
    );
    /*
     * The slowest suite measured about 17 s. Anything under 30 s is a gate that
     * goes red on a loaded CI box, which is the same defect one machine later.
     */
    expect(Number((declared?.[1] ?? "0").replace(/_/g, ""))).toBeGreaterThanOrEqual(30_000);
  });

  it("runs the whole suite, with no flag a reader would have to know", () => {
    // `vitest run` and nothing else. A `--testTimeout` here would be the same
    // defect wearing the fix's clothes: the flag would live in one repo's
    // package.json and the reason for it nowhere.
    const scripts = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };
    expect(scripts.scripts.test).toBe("vitest run");
    expect(readFileSync(join(process.cwd(), "README.md"), "utf8")).toContain("npm test");
  });
});

/**
 * AND THE DISCOVERY ITSELF IS GUARDED, because it is only as honest as what it
 * finds.
 *
 * A vendored package that exported nothing would contribute nothing and read
 * exactly like a package with nothing to declare. A renamed export, or a sync
 * that dropped the file, would leave this app quietly allowing no origin at all
 * — which fails loudly here rather than silently on the day an add-on that
 * really does name an address is vendored.
 */
describe('an add-on brings its own inert origins with it (24 AC20, D21)', () => {
  it('reads a declaration off every add-on this app vendors', () => {
    const declared = Object.entries(VENDORED_ORIGINS);
    expect(declared.length, 'no vendored inert-origin declarations were found').toBeGreaterThan(0);
    const silent = declared
      .filter(([, module]) => module.INERT_ORIGINS === undefined)
      .map(([file]) => file);
    expect(silent, 'these vendored packages export no INERT_ORIGINS').toEqual([]);
  });

  it('keeps no origin of its own that belongs to an add-on', () => {
    // The ratchet on the repair. Re-adding an add-on's address to this app's
    // own list would work, and would put the defect straight back: every entry
    // here has to be an address THIS app names, and this app names none.
    expect(OURS).toEqual([]);
  });

  it('says why, for every origin it allows, wherever it came from', () => {
    expect(INERT.length, 'nothing was discovered at all').toBeGreaterThan(0);
    for (const entry of INERT) {
      expect(
        { origin: entry.origin, explained: entry.why.length > 30 },
        `${entry.origin} is allowed with no reason a reviewer can read`,
      ).toEqual({ origin: entry.origin, explained: true });
    }
  });

  it('forgives the declared origin and nothing that merely starts the same', () => {
    // The comparison is exact, and this is the case that says so: an add-on
    // declaring `api.canva.com` does not hand a look-alike host an allowance.
    const declared = INERT[0]!.origin;
    expect(offendingAddresses(`const a = "${declared}/x";`, INERT)).toEqual([]);
    expect(offendingAddresses(`const a = "${declared}.attacker.test/x";`, INERT)).not.toEqual([]);
  });
});

/**
 * ── EVERY SOURCE FILE IS TEXT, OR THE TOOLS STOP READING IT ─────────────────
 *
 * [Added 2026-08-12, with the eight raw bytes it found in this repo's own
 * `i18n/reviewedCopy.test.ts`.]
 *
 * The rule and the argument for it are in `testing/encoding.ts`, which is the
 * add-on monorepo's copy byte for byte — the same arrangement `testing/purity.ts`
 * and `testing/egress.ts` are under, and `host-mirror.test.ts` fails on any
 * difference. It is imported rather than restated for the reason
 * `shared-rule.test.ts` gives: a scanner kept one-per-repo is not one rule, it
 * is N rules that agree until the day one of them is repaired.
 *
 * What is decided HERE is only which files it is pointed at: everything this
 * suite already walks, which is `.ts` and `.tsx` under `src/` — the vendored
 * add-ons included, since that is where a re-sync would bring a raw byte back
 * in. Stylesheets are outside this walk and so outside this rule.
 */
describe('every source file is text a tool will read', () => {
  it('writes control characters as escapes, never as raw bytes', () => {
    const offenders = ALL.flatMap((file) =>
      rawControlOffences(file.slice(SRC.length), readFileSync(file, 'utf8')),
    );
    expect(offenders, `\n${RAW_CONTROL_EXPLANATION}\n${offenders.join('\n')}\n`).toEqual([]);
  });

  it('would report one, which is what makes the absence worth reading', () => {
    // Driven over the scanner rather than over `src/`, so this stays true on a
    // day every file is clean — which is every day until somebody pastes one.
    const planted = `const k = \`a${String.fromCharCode(0)}b\`;\nconst j = 'x${String.fromCharCode(1)}y';`;
    expect(rawControlsIn(planted).map((hit) => hit.label)).toEqual(['U+0000', 'U+0001']);
    expect(rawControlsIn(planted).map((hit) => hit.line)).toEqual([1, 2]);
    // And the escaped spelling of the same two strings is not a finding.
    expect(rawControlsIn(String.raw`const k = 'a\x00b', j = 'x\x01y';`)).toEqual([]);
    // Tabs and newlines are text, not findings.
    expect(rawControlsIn('a\tb\r\nc')).toEqual([]);
  });
});
