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

describe('no real third-party call, no real clock (24 D11)', () => {
  it('has no fetch, no XHR and no WebSocket anywhere in the shipped sources', () => {
    const offenders = SHIPPED.filter((file) =>
      /\bfetch\s*\(|XMLHttpRequest|new WebSocket|navigator\.sendBeacon/.test(codeOf(file)),
    );
    // A demo that posted to a real carrier or a real design tool on every
    // visitor's click would be a defect, not a feature. In connected mode the
    // call belongs to the SERVER half of an add-on, which is not in this
    // bundle and cannot be — `scripts/sync-add-ons.sh` refuses to vendor it.
    expect(offenders.map(relative)).toEqual([]);
  });

  it('reads no real clock and rolls no dice', () => {
    const offenders = SHIPPED.filter((file) =>
      /Date\.now\s*\(|Math\.random\s*\(|new Date\s*\(\s*\)|performance\.now\s*\(/.test(codeOf(file)),
    );
    // 21 D6. Every date in the app derives from the pinned moment below, which
    // is what lets `quote.test.ts` assert a promise date and a screenshot taken
    // in a year still match the running demo.
    expect(offenders.map(relative)).toEqual([]);
  });

  it('is pinned to the demo’s Wednesday', () => {
    expect(NOW).toEqual({ iso: '2026-08-05', hour: 10, minute: 20 });
  });
});

describe('secrets are server-only (24 D15)', () => {
  it('keeps every secret setting out of the client half', () => {
    /*
     * The MACHINE KEYS of the credentialled add-on's two `secret: true`
     * settings, and the type its server half reads them into. The packer greps
     * a built bundle for exactly these; this catches it a build earlier, at the
     * import that would have leaked one.
     *
     * `apiKey` in camelCase is deliberately NOT here. The connect dialog holds
     * one in component state while the shop types it and drops it on submit,
     * and `shop.connect.apiKey` is the LABEL on that field — banning the words
     * a credential form has to say would be banning the form, not the leak.
     * What must never appear is the key a value would be SAVED under.
     */
    const offenders = SHIPPED.filter((file) =>
      /api_key|account_number|CarrierCredentials/.test(codeOf(file)),
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
