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
  HOMOGRAPH_TOKENS,
  PRO_PHRASES,
  SUBSTRING_BANNED,
  TIERING_PATTERNS,
  bundleOffences,
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
      for (const hit of bundleOffences(readFileSync(file, 'utf8'))) {
        offenders.push(`${rel(file)} · "${hit.word}" in "${hit.token}" · …${hit.context}…`);
      }
    }
    expect(offenders).toEqual([]);
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
  it('carries no secret setting key and no real third-party hostname', () => {
    /*
     * 24 D15 and D11 in the artefact. The first three are the credentialled
     * add-on's `secret: true` setting keys and the type its server half reads
     * them into; the last two are the only hostnames any add-on in this wave
     * would ever call, and neither has a reason to exist in a client bundle
     * whose transports are all demo ones.
     */
    const needles = [
      'api_key',
      'account_number',
      'CarrierCredentials',
      'express.api.dhl.com',
      'api.canva.com',
    ];
    const offenders: string[] = [];
    for (const file of built()) {
      const text = readFileSync(file, 'utf8');
      for (const needle of needles) {
        if (text.includes(needle)) offenders.push(`${rel(file)} · ${needle}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
