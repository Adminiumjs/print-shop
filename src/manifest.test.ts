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
 * three add-on repos vendor `@adminium/add-on-contracts`' zod validators the
 * same way and for the same reason.
 */

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
