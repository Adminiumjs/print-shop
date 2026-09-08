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
import { APP_KEY } from './surface.ts';
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

  it('is the same key `surface.ts` hands connected mode (26-T13)', () => {
    // `APP_KEY` is a literal rather than an import of this file, because
    // importing the manifest would put the whole document — every label in
    // eight locales — into the shipped bundle to read one string out of it.
    // This is what stops the literal drifting from the file that decides it: a
    // rename here that missed `surface.ts` would silently narrow the server's
    // add-on list to nothing, and an empty list is exactly what a shop with no
    // add-ons installed looks like.
    expect(APP_KEY).toBe(manifest.key);
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
  process.env.ADMINIUM_REPO || fileURLToPath(new URL('../../adminium', import.meta.url));

const REAL_VALIDATOR = join(PRODUCT_ROOT, 'packages', 'manifest', 'dist', 'index.js');

interface RealValidator {
  validateManifest: (value: unknown) => { ok: boolean; issues?: readonly { path: string }[] };
}

const realAvailable = existsSync(REAL_VALIDATOR);

/** CI sets this beside the product checkout; see .github/workflows/ci.yml. */
const VALIDATOR_REQUIRED = process.env.ADMINIUM_REQUIRE_VALIDATOR === 'true';

/**
 * ── AND CI MAY NOT SKIP IT (28-T26 follow-up) ──────────────────────────────
 *
 * `describe.skipIf` above is right for a developer with no product checkout —
 * somebody reading the example app is not required to clone the product. It was
 * WRONG for CI, where it meant half this file, the whole drift check included,
 * never ran anywhere automated while the job reported green.
 *
 * The workflow sets `ADMINIUM_REQUIRE_VALIDATOR` in the same condition that
 * checks the product out, so the two cannot disagree: if CI promised the
 * validator and it is not there, that is a failure, not a skip.
 */
it.skipIf(!VALIDATOR_REQUIRED)('has the product validator that CI promised', () => {
  expect(
    realAvailable,
    `ADMINIUM_REQUIRE_VALIDATOR is set, so the real validator must be present, and ` +
      `nothing is at ${REAL_VALIDATOR}. The checkout or build step did not run.`,
  ).toBe(true);
});


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
 * ── FOUR MISTAKES THE SCHEMA CANNOT SEE, AND NOBODY WAS CHECKING ──────────
 *
 * [Added 2026-08-20 from an adversarial pass.] The schema is genuinely
 * enforced — the drift block below proves the copy agrees with the product on
 * every mutation thrown at it — but a schema constrains SHAPES, and these four
 * documents are all correctly shaped and still wrong. Both validators accept
 * every one of them, and until now so did this suite.
 *
 * They are asserted here rather than in the product because each is a fact
 * about THIS app. The general forms — a duplicate `ref`, a `bindings` target
 * that is not a table — belong in `packages/manifest` and are worth raising
 * there; a per-repo assertion is what can be had today without re-vendoring
 * the validator into fifteen repos.
 */
describe('mistakes that are correctly shaped and still wrong', () => {
  it('gives every page a distinct ref', () => {
    // Two pages with one ref is an install that silently drops a screen.
    const refs = manifest.pages.map((page) => page.ref);
    expect(refs.length, `duplicate page refs: ${refs.join(', ')}`).toBe(new Set(refs).size);
  });

  it('gives every table a distinct ref', () => {
    const refs = manifest.requiredSchema.tables.map((table) => table.ref);
    expect(refs.length, `duplicate table refs: ${refs.join(', ')}`).toBe(new Set(refs).size);
  });

  it('names each facet once', () => {
    expect(manifest.categories.length).toBe(new Set(manifest.categories).size);
  });

  it('gives every declared side something to load', () => {
    // A `frontends[]` entry with no entry point is a side the installer cannot
    // serve. The schema only requires the entry to be well-formed.
    for (const frontend of manifest.frontends as { side: string; entry?: string }[]) {
      expect(typeof frontend.entry, `${frontend.side} has no entry`).toBe('string');
      expect((frontend.entry ?? '').length, `${frontend.side} entry is blank`).toBeGreaterThan(0);
    }
  });
});

/**
 * ── WHY THE DRIFT CASES ARE GENERATED AND NOT LISTED ──────────────────────
 *
 * [Changed 2026-08-20 by an adversarial pass.] Five hand-written documents
 * stood here, and five documents can only detect a drift they happen to touch:
 * any product change tightening or loosening a rule those five do not exercise
 * left the copy a rule behind with this block green. That is the exact failure
 * the block exists to prevent, reached from a different direction — and this is
 * the repo whose copy actually did sit a whole schema behind the product.
 *
 * So the documents are DERIVED from the manifest instead: every top-level key
 * removed and re-typed in turn, every table removed and its ref duplicated,
 * every column's type corrupted, every page's binding pointed at nothing, plus
 * the hand-written ones worth keeping by name.
 */
function mutations(): { what: string; document: unknown }[] {
  const out: { what: string; document: unknown }[] = [];
  const base = manifest as unknown as Record<string, unknown>;
  const clone = (): Record<string, unknown> => structuredClone(base) as Record<string, unknown>;

  out.push({ what: 'as it ships', document: manifest });

  for (const key of Object.keys(base)) {
    const dropped = clone();
    delete dropped[key];
    out.push({ what: `without ${key}`, document: dropped });

    // A wrong TYPE is a different refusal from a missing key, and a copy can
    // drift on one without drifting on the other.
    for (const [label, value] of [
      ['a number', 42],
      ['null', null],
      ['an array', []],
      ['an object', {}],
    ] as const) {
      const retyped = clone();
      retyped[key] = value;
      out.push({ what: `${key} as ${label}`, document: retyped });
    }
  }

  const tables = (
    base['requiredSchema'] as { tables: { ref: string; columns: { type: string }[] }[] }
  ).tables;
  for (let t = 0; t < tables.length; t += 1) {
    const dropped = clone();
    (dropped['requiredSchema'] as { tables: unknown[] }).tables.splice(t, 1);
    out.push({ what: `without table ${tables[t]?.ref ?? String(t)}`, document: dropped });

    const duped = clone();
    const list = (duped['requiredSchema'] as { tables: { ref: string }[] }).tables;
    list.push(structuredClone(list[t]!));
    out.push({ what: `table ${tables[t]?.ref ?? String(t)} declared twice`, document: duped });

    const columns = tables[t]?.columns ?? [];
    for (let c = 0; c < columns.length; c += 1) {
      const broken = clone();
      const target = (broken['requiredSchema'] as { tables: { columns: { type: string }[] }[] })
        .tables[t]?.columns[c];
      if (target === undefined) continue;
      // `varchar` is what somebody who thinks in SQL writes; the abstract types
      // are the contract.
      target.type = 'varchar';
      out.push({ what: `${tables[t]?.ref ?? ''}.column[${String(c)}] typed varchar`, document: broken });
    }
  }

  const pages = base['pages'] as { ref: string; bindings?: Record<string, string> }[];
  for (let i = 0; i < pages.length; i += 1) {
    const broken = clone();
    const page = (broken['pages'] as { bindings?: Record<string, string> }[])[i];
    if (page?.bindings === undefined) continue;
    for (const key of Object.keys(page.bindings)) page.bindings[key] = 'no_such_table';
    out.push({ what: `page ${pages[i]?.ref ?? ''} bound to nothing`, document: broken });
  }

  for (const [what, patch] of [
    ['a publisher that is not first-party', { publisher: { ...manifest.publisher, id: 'somebody-else' } }],
    ['an add-on block on an app', { addOn: { attaches: [], provides: [] } }],
    ['a facet outside the closed vocabulary', { categories: ['printing'] }],
    ['a capability nobody implements', { capabilities: [...manifest.capabilities, 'telepathy'] }],
    ['an app with no side at all', { frontends: [] }],
    ['a manifest version that is not the frozen one', { manifestVersion: 2 }],
  ] as const) {
    out.push({ what, document: { ...manifest, ...patch } });
  }

  return out;
}

describe.skipIf(!realAvailable)('the vendored validator has not drifted from @adminium/manifest', () => {
  it('agrees with the real one about every derived document', async () => {
    const real = await loadReal();
    const paths = (r: { ok: boolean; issues?: readonly { path: string }[] }): string =>
      [...(r.issues ?? [])]
        .map((i) => i.path)
        .sort()
        .join('|');

    const disagreements: string[] = [];
    const cases = mutations();
    for (const { what, document } of cases) {
      const theirs = real(document);
      const ours = validateManifest(document);
      if (ours.ok !== theirs.ok) {
        disagreements.push(`${what}: vendored ok=${String(ours.ok)}, real ok=${String(theirs.ok)}`);
      } else if (paths(ours) !== paths(theirs)) {
        disagreements.push(`${what}: same verdict, different paths`);
      }
    }
    expect(disagreements, `${String(cases.length)} documents compared`).toEqual([]);
  });

  it('asks about enough documents, and enough that are REFUSED', () => {
    // A drift check whose cases all PASS proves nothing: two validators that
    // accept everything agree perfectly.
    const cases = mutations();
    expect(cases.length).toBeGreaterThan(40);
    const refused = cases.filter(({ document }) => !validateManifest(document).ok);
    expect(refused.length, 'too few refused documents to prove anything').toBeGreaterThan(20);
  });
});
