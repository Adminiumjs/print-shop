/**
 * `manifest.json`, put through the real validator.
 *
 * This app is the HOST three add-ons attach to, and until this file existed the
 * wave's acceptance criterion 10 — "`publisher.id` is `adminium` on all four" —
 * could not be met, because only three of the four manifests existed. An
 * add-on that declares `attaches: [{ app: "printing" }]` is attaching to a
 * document nobody had written.
 *
 * `validateManifest` here is `@adminium/manifest`'s own function, vendored
 * verbatim under `testing/manifest/` because the package is not published and
 * this repo must build from a clean clone. See that directory's headers; the
 * add-ons monorepo mirrors `@adminium/add-on-contracts`' zod validators the
 * same way and for the same reason.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { describe, expect, it } from 'vitest';

import manifest from '../manifest.json';
import {
  MANIFEST_CAPABILITIES,
  MANIFEST_CATEGORIES,
  MANIFEST_VERSION,
  RESERVED_KEYS,
  validateManifest,
} from './testing/manifest/index.ts';
import { JOB_STAGES } from './lib/jobs.ts';
import { HOSTED_SLOTS } from './add-ons/slots.ts';

/** The three add-ons that attach to this app, from their own manifests. */
const ATTACHED_ADD_ONS = ['design-studio', 'shipping-dhl', 'import-canva'];

describe('manifest.json validates', () => {
  const result = validateManifest(manifest);

  it('passes the real validator with no issues at all', () => {
    // Named rather than asserted as a bare boolean: a failure that prints
    // `expected true, got false` costs a debugging session that printing the
    // issue list does not.
    expect(result.ok ? [] : result.issues).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('is an app at the frozen spec version', () => {
    expect(manifest.kind).toBe('app');
    expect(manifest.manifestVersion).toBe(MANIFEST_VERSION);
  });

  it('is first-party, which is the only publisher v1 accepts (AC10, D13)', () => {
    expect(manifest.publisher.id).toBe('adminium');
    // And the validator agrees, rather than this being a fact about a string.
    const stranger = { ...manifest, publisher: { ...manifest.publisher, id: 'somebody-else' } };
    const refused = validateManifest(stranger);
    expect(refused.ok).toBe(false);
    expect(refused.ok ? [] : refused.issues.map((i) => i.path)).toContain('publisher.id');
  });

  it('takes its key and facet from the closed vocabularies', () => {
    expect(manifest.key).toBe('printing');
    expect(RESERVED_KEYS as readonly string[]).not.toContain(manifest.key);
    for (const facet of manifest.categories) {
      expect(MANIFEST_CATEGORIES as readonly string[]).toContain(facet);
    }
  });

  it('declares exactly the four capabilities 24 D3 names for this app', () => {
    expect([...manifest.capabilities].sort()).toEqual(
      ['email-delivery', 'file-storage', 'payments', 'realtime'].sort(),
    );
    for (const cap of manifest.capabilities) {
      expect(MANIFEST_CAPABILITIES as readonly string[]).toContain(cap);
    }
    // The two keys wave 4 added belong to ADD-ONS, not to the host: this app
    // makes no outbound call and runs no OAuth flow of its own.
    expect(manifest.capabilities).not.toContain('outbound-http');
    expect(manifest.capabilities).not.toContain('oauth-connect');
  });
});

/**
 * The columns as the SPEC shapes them, not as TypeScript infers them from the
 * literal. `resolveJsonModule` gives every column a union of the exact shapes
 * present in the file, so `references` is missing from the type of any column
 * that is not itself a foreign key — which is precisely the field the fk check
 * below needs to read.
 */
interface Column {
  ref: string;
  type: string;
  enum?: string[];
  references?: string;
}

describe('the schema it asks for is the one the app models', () => {
  const tables: { ref: string; columns: Column[] }[] = manifest.requiredSchema.tables;
  const byRef = new Map(tables.map((t) => [t.ref, t]));

  it('carries the tables the screens and the seed actually use', () => {
    // `jobs` and `materials` are the two the add-ons' `scopes` name, so a
    // rename here is a break in three other repos.
    for (const ref of ['jobs', 'materials', 'artwork', 'proofs', 'customers']) {
      expect(byRef.has(ref), ref).toBe(true);
    }
  });

  it('states the job machine as the engine states it', () => {
    // The stage list is the ONE place this document and `lib/jobs.ts` could
    // drift silently, because nothing at runtime reads the manifest.
    const stage = byRef.get('jobs')!.columns.find((c) => c.ref === 'stage');
    expect(stage?.type).toBe('enum');
    expect(stage?.enum).toEqual([...JOB_STAGES]);
  });

  it('points every foreign key at a table it also declares', () => {
    for (const table of tables) {
      for (const column of table.columns) {
        if (column.type !== 'fk') continue;
        expect(byRef.has(column.references!), `${table.ref}.${column.ref}`).toBe(true);
      }
    }
  });

  it('binds every page to a table it declares', () => {
    for (const page of manifest.pages) {
      for (const target of Object.values(page.bindings ?? {})) {
        expect(byRef.has(target), `${page.ref} → ${target}`).toBe(true);
      }
    }
  });
});

describe('what an app manifest may not do', () => {
  it('declares no add-on block — the fields belong to the other branch', () => {
    expect(manifest).not.toHaveProperty('addOn');
    // §5.7 item 6 in reverse: the union is discriminated, so an app carrying an
    // add-on block is refused rather than quietly ignored.
    const confused = { ...manifest, addOn: { attaches: [], provides: [] } };
    expect(validateManifest(confused).ok).toBe(false);
  });

  it('names no slot — a host HOSTS slots, it does not fill them', () => {
    // The slots this app hosts live in `src/add-ons/slots.ts` and are the
    // add-ons' business to fill. A `slots` key here would mean the host was
    // filling its own holes, which is the design D6 exists to prevent.
    expect(manifest).not.toHaveProperty('slots');
    expect(HOSTED_SLOTS.length).toBeGreaterThan(0);
  });

  it('is the app the three add-ons say they attach to', () => {
    // Their side of this is asserted in their own repos; this is the half that
    // fails if the key is ever renamed here.
    expect(ATTACHED_ADD_ONS.length).toBe(3);
    expect(manifest.key).toBe('printing');
  });
});

/**
 * AND THE VENDORED VALIDATOR ITSELF, HELD TO THE ONE THE PRODUCT RUNS.
 *
 * [Added 2026-08-11, wave 4b round 2.] Everything above runs `testing/manifest/`
 * — a verbatim COPY, taken because `@adminium/manifest` is on no registry — and
 * nothing anywhere compared the copy with its original. That is exactly the
 * argument `scripts/sync-add-ons.sh` makes about the vendored add-ons, one
 * directory over, and it had no equivalent here: the copy could drift a schema
 * behind the product and this whole file would stay green, validating a
 * manifest against rules the product no longer enforces.
 *
 * It is not hypothetical. The add-ons monorepo shipped an INVALID manifest with
 * a green suite for exactly this reason — its gate restated the rules by hand
 * instead of running them — and the fix there was to load the real validator
 * from a sibling product checkout. This does the same, and then asks the
 * sharper question a copy makes possible: do the two AGREE?
 *
 * Loaded by path rather than installed because the package cannot be installed:
 * its own package.json declares `zod: "catalog:"` and
 * `@adminium/add-on-contracts: "workspace:*"`, two pnpm protocols npm does not
 * resolve. `ADMINIUM_REPO` overrides the location; a clean clone of this app
 * alone prints what it looked for and skips, and the vendored validator above
 * still holds this document to the schema as it stood when it was copied.
 */
const PRODUCT_ROOT =
  process.env.ADMINIUM_REPO ?? fileURLToPath(new URL('../../adminium', import.meta.url));

const REAL_VALIDATOR = join(PRODUCT_ROOT, 'packages', 'manifest', 'dist', 'index.js');

interface RealValidator {
  validateManifest: (value: unknown) => { ok: boolean; issues?: readonly { path: string }[] };
}

const realAvailable = existsSync(REAL_VALIDATOR);

if (!realAvailable) {
  console.info(
    `[print-shop] the vendored validator was not compared with the real one: nothing at ` +
      `${REAL_VALIDATOR}. Clone the Adminium product beside this repo (or point ADMINIUM_REPO ` +
      'at it) and build packages/manifest, and src/testing/manifest/ is checked for drift.',
  );
}

const loadReal = async (): Promise<RealValidator['validateManifest']> => {
  const mod = (await import(/* @vite-ignore */ pathToFileURL(REAL_VALIDATOR).href)) as RealValidator;
  return mod.validateManifest;
};

/**
 * The documents both validators are asked about: the real one, and four with a
 * specific, realistic mistake in each. A copy that had drifted would answer at
 * least one of these differently — which is the whole point of asking about
 * FAILURES as well as the pass. Comparing only "both say yes" would be
 * satisfied by a validator that says yes to everything.
 */
const CASES: readonly (readonly [string, unknown])[] = [
  ['the manifest as it ships', manifest],
  ['a publisher that is not first-party', { ...manifest, publisher: { ...manifest.publisher, id: 'somebody-else' } }],
  ['an add-on block on an app', { ...manifest, addOn: { attaches: [], provides: [] } }],
  ['a facet outside the closed vocabulary', { ...manifest, categories: ['printing'] }],
  ['a capability nobody implements', { ...manifest, capabilities: [...manifest.capabilities, 'telepathy'] }],
];

describe.skipIf(!realAvailable)('the vendored validator has not drifted from @adminium/manifest', () => {
  it.each(CASES)('agrees with the real one about %s', async (_what, document) => {
    const real = await loadReal();
    const theirs = real(document);
    const ours = validateManifest(document);

    // The verdict first, because that is what every caller reads.
    expect({ ok: ours.ok }, 'the two validators disagree').toEqual({ ok: theirs.ok });
    // And the PATHS, so a copy that refuses the same document for a different
    // reason is a drift too. Sorted: neither promises an issue order.
    const paths = (r: { ok: boolean; issues?: readonly { path: string }[] }) =>
      [...(r.issues ?? [])].map((i) => i.path).sort();
    expect(paths(ours)).toEqual(paths(theirs));
  });

  it('is asked about at least one document each validator refuses', () => {
    // A drift check whose cases all PASS proves nothing: two validators that
    // accept everything agree perfectly. This is the case that keeps the list
    // above honest if somebody ever prunes it.
    const refused = CASES.filter(([, document]) => !validateManifest(document).ok);
    expect(refused.length).toBeGreaterThanOrEqual(4);
  });
});
