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
import { impuritiesIn, restatementsIn } from './testing/purity.ts';
import {
  foreignImportsIn,
  offendingAddresses,
  sendersIn,
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
 * The source with its comments removed.
 *
 * Every rule below is about what the CODE does, and the comments explaining
 * those rules necessarily quote the very things they forbid — this file's own
 * `Date.now()` would fail its own grep otherwise. Stripping first is what lets
 * the prose stay specific.
 */
const codeOf = (file: string) =>
  read(file)
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
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
 */
const OURS: readonly InertOrigin[] = [];

/** Ours, plus whatever the add-ons this app vendors declare for themselves. */
const INERT: readonly InertOrigin[] = [...OURS, ...addOnOrigins()];

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
    ]);
    expect(offenders).toEqual([]);
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
  it('reads no real clock and rolls no dice', () => {
    // 21 D6. Every date in the app derives from the pinned moment below, which
    // is what lets `quote.test.ts` assert a promise date and a screenshot taken
    // in a year still match the running demo.
    const offenders = SHIPPED.flatMap((file) =>
      impuritiesIn(codeOf(file)).map((means) => `${relative(file)} → ${means}`),
    );
    expect(offenders).toEqual([]);
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
