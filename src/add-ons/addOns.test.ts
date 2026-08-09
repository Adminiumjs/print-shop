/**
 * The add-on seam's own suite.
 *
 * What it is really testing is D6: that registering an add-on and enabling one
 * are different things, that a slot with nothing in it behaves the way the
 * screen was told it would, and — the assertion the whole wave rests on — that
 * turning an add-on off leaves the host exactly where it started. A demo where
 * a reviewer watches a feature arrive and leave is only worth anything if
 * "leave" is complete, and "complete" is not something a screenshot proves.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { applyAddOnSettings, createRegistry, isConnectable } from './host.ts';
import { SLOT_EMPTY_BEHAVIOUR, SLOT_FILL, HOSTED_SLOTS } from './slots.ts';
import { DEFAULT_ADD_ON_SETTINGS, demoAddOns, DEMO_KEYS } from './registry.ts';
import {
  fileFromRef,
  jobSpecFor,
  REF_UNMEASURED,
  REF_UNMEASURED_VALUES,
  type ArtworkRef,
} from './artwork.ts';
import { sampleJobs } from './samples.ts';
import { NOW } from '../data/demo.ts';
import { checkArtwork, type Configuration } from '../lib/quote.ts';

// The two `artwork-source` implementations, driven for real below.
import { createArtworkSource } from './vendor/design-studio/artworkSource.ts';
import { docFromLayout, layoutForSize } from './vendor/design-studio/layouts.ts';
import { createCanvaSource } from './vendor/import-canva/source.ts';
import { createDemoTransport } from './vendor/import-canva/demo/transport.ts';

const ALL = demoAddOns();
const KEYS = new Set(ALL.map((a) => a.key));

describe('the demo registry', () => {
  it('carries the three built add-ons plus four described ones', () => {
    expect(ALL).toHaveLength(7);
    for (const key of DEMO_KEYS) expect(KEYS.has(key)).toBe(true);
    expect(ALL.filter(isConnectable).map((a) => a.key).sort()).toEqual([...DEMO_KEYS].sort());
  });

  it('gives every add-on a monogram of two or three letters and no brand colour', () => {
    // 24 D12. A monogram is the entire visual identity an add-on gets, and the
    // registry is where a fourth-letter logo-ish mark would first appear.
    for (const addOn of ALL) {
      expect(addOn.monogram).toMatch(/^[A-Z]{2,3}$/);
      expect(JSON.stringify(addOn)).not.toMatch(/#[0-9a-f]{3,6}/i);
    }
  });

  it('only lets a described-but-not-built add-on claim a slot if it is built', () => {
    for (const addOn of ALL) {
      if (!isConnectable(addOn)) expect(addOn.fills).toHaveLength(0);
    }
  });

  it('names only slots the host actually hosts', () => {
    for (const addOn of ALL) {
      for (const fill of addOn.fills) expect(HOSTED_SLOTS).toContain(fill.slot);
    }
  });

  /**
   * 24 AC6, in the form that covers both kinds of add-on.
   *
   * The criterion is written as though every add-on carries "Adminium is not
   * affiliated with this company". One of the built three names no company at
   * all, and a disclaimer about a company that does not exist is noise — but
   * rendering NOTHING there is worse, because a reader cannot tell "connects to
   * nobody" from "somebody forgot the notice". So the rule the host enforces is
   * that the detail surfaces always say something about who else is involved:
   * the disclaimer where a company is named, the add-on's own positive sentence
   * where none is.
   *
   * `Affiliation` in `components/Overlays.tsx` renders whichever applies, on
   * all three surfaces. The keys belong to the ADD-ON (AC5) — the host holds no
   * sentence claiming an add-on connects to nothing.
   */
  it('leaves no detail surface silent about who else is involved (AC6)', () => {
    // SCOPED TO THE BUILT ONES, because they are the ones with a detail surface
    // at all: a described-but-not-built shelf entry has no Connect button, no
    // consent panel and no manage drawer, so there is no place the sentence
    // could go and nothing for a reader to misread.
    const silent = ALL.filter(isConnectable)
      .filter((addOn) => !addOn.namesCompany && (addOn.noCompanyKeys ?? []).length === 0)
      .map((addOn) => addOn.key);
    expect(silent).toEqual([]);
    for (const addOn of ALL) {
      // One or the other, never both: an add-on that names a company gets the
      // disclaimer, and a second sentence saying it names none would contradict
      // it on the same line.
      if (addOn.namesCompany) expect(addOn.noCompanyKeys ?? []).toEqual([]);
      // The add-on's own namespace. A host key here would be the host holding
      // an add-on's copy, which is the thing AC5 took away.
      for (const key of addOn.noCompanyKeys ?? []) {
        expect(key.startsWith(`addon.${addOn.key}.`), `${addOn.key} · ${key}`).toBe(true);
      }
    }
  });

  it('sorts by key so the shelf and every multi slot are stable', () => {
    const registry = createRegistry(ALL);
    expect(registry.all.map((a) => a.key)).toEqual([...registry.all.map((a) => a.key)].sort());
  });
});

describe('slot fills', () => {
  const registry = createRegistry(ALL);
  const all = new Set(ALL.map((a) => a.key));

  it('renders nothing at all until something is enabled', () => {
    // REGISTERED IS NOT ENABLED. The app boots with an empty `enabled` set and
    // must be its base state, not its filled one.
    for (const slot of HOSTED_SLOTS) {
      expect(registry.fillsFor(slot, new Set())).toHaveLength(0);
    }
  });

  it('puts the shop’s own editor ahead of the import in artwork.sources', () => {
    const fills = registry.fillsFor('artwork.sources', all);
    expect(fills.map((f) => f.fill.order)).toEqual([10, 20]);
  });

  it('scopes a per-add-on slot to the one add-on that was asked for', () => {
    // What the manage drawer relies on: three add-ons fill
    // `settings.add-on.panel`, and asking for one gets one — not three, and
    // never someone else's form under someone else's name.
    expect(SLOT_FILL['settings.add-on.panel']).toBe('per-add-on');
    const everyone = registry.fillsFor('settings.add-on.panel', all);
    expect(everyone.length).toBeGreaterThan(1);
    for (const key of DEMO_KEYS) {
      const mine = registry.fillsFor('settings.add-on.panel', all, key);
      expect(mine.map((f) => f.addOn)).toEqual([key]);
    }
  });

  it('fills the settings panel for every add-on that can be connected', () => {
    // §5.4 declares the slot; a declared-but-never-filled slot beside a host
    // that hand-wrote three forms is the defect this replaced.
    for (const addOn of ALL.filter(isConnectable)) {
      expect(addOn.fills.some((f) => f.slot === 'settings.add-on.panel'), addOn.key).toBe(true);
    }
  });

  it('takes only the lowest order in a single-fill slot', () => {
    for (const slot of HOSTED_SLOTS) {
      if (SLOT_FILL[slot] === 'single') {
        expect(registry.fillsFor(slot, all).length).toBeLessThanOrEqual(1);
      }
    }
  });

  it('leaves the works floor silent and speaks to the customer', () => {
    // The one asymmetry of D6, pinned so a later edit has to mean it: where an
    // empty slot has something to explain it says it in words; where it has
    // nothing to explain it renders nothing.
    expect(SLOT_EMPTY_BEHAVIOUR['order.dispatch.actions']).toBe('silent');
    expect(SLOT_EMPTY_BEHAVIOUR['artwork.sources']).toBe('speaks');
    expect(SLOT_EMPTY_BEHAVIOUR['checkout.delivery.methods']).toBe('speaks');
    expect(SLOT_EMPTY_BEHAVIOUR['order.dispatch.panel']).toBe('speaks');
  });

  it('mounts every slot it declares it hosts', () => {
    /*
     * THE CHECK THAT `nav.add-on.routes` FAILED. It was in `HOSTED_SLOTS` for a
     * release, Design Studio shipped a real fill for it, and no screen ever
     * rendered `<AddOnSlot slot="nav.add-on.routes">` — so the fill could not
     * draw and no link could reach it. A declared-but-unmounted slot is worse
     * than an absent one: an add-on author reads the list and writes code
     * against it.
     *
     * A grep over the sources rather than a render, because the failure is an
     * ABSENCE and no amount of mounting one screen proves the other four. The
     * vendored add-ons are excluded on purpose — an add-on FILLS a slot, and a
     * fill naming a slot is not the host mounting it.
     */
    const SRC = join(new URL('.', import.meta.url).pathname, '..');
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((entry) => {
        const full = join(dir, entry);
        return statSync(full).isDirectory() ? walk(full) : [full];
      });
    const host = walk(SRC).filter(
      (f) => /\.tsx?$/.test(f) && !f.includes('/vendor/') && !f.includes('.test.'),
    );
    const sources = host.map((f) => readFileSync(f, 'utf8')).join('\n');

    const unmounted = HOSTED_SLOTS.filter((slot) => !sources.includes(`slot="${slot}"`));
    expect(unmounted).toEqual([]);
  });

  it('goes back to exactly nothing when everything is switched off again', () => {
    const before = HOSTED_SLOTS.map((s) => registry.fillsFor(s, new Set()).length);
    HOSTED_SLOTS.forEach((s) => registry.fillsFor(s, all));
    const after = HOSTED_SLOTS.map((s) => registry.fillsFor(s, new Set()).length);
    expect(after).toEqual(before);
    expect(after.every((n) => n === 0)).toBe(true);
  });
});

/**
 * AC4 — "the host runs its own artwork checks on BOTH outputs".
 *
 * THE REFS BELOW ARE NOT WRITTEN DOWN. They used to be: two object literals
 * labelled "what Design Studio's exporter produces, by construction" and "the
 * Canva design, 85 × 55 at the trim". Both were accurate, and both were
 * fixtures — a test that asserts `checkArtwork` on numbers a human typed proves
 * that `checkArtwork` works, which nobody doubted, and proves NOTHING about the
 * two implementations it is named after. An exporter that started rounding its
 * bleed away would have left this suite green.
 *
 * So both providers are driven here, headlessly, through the same
 * `artwork-source@1` entry point the browser drives: `start(job)` with the
 * interactive step scripted. What comes back goes into the host's own
 * `checkArtwork`. That is the only version of this assertion that means what
 * the criterion says.
 */
describe('what comes back from an artwork add-on', () => {
  const config: Configuration = {
    product: 'business-cards',
    material: 'silk-350',
    size: 'business-card',
    sides: 2,
    finish: 'none',
    quantity: 500,
    packaging: 'boxed',
    printedProof: false,
    express: false,
    delivery: 'collection',
  };

  const job = jobSpecFor(config, 'Business cards');

  /**
   * Design Studio, run for real: the editor's `open` step is scripted to pick
   * the layout the configured size resolves to — which is exactly what
   * `SourceTile.tsx` does when the job already answers the picker's question —
   * and everything after it is the add-on's own code.
   */
  async function designStudioRef(): Promise<ArtworkRef> {
    const source = createArtworkSource({
      open: async (spec, layouts) => {
        const match = layoutForSize(spec.trimWidthMm, spec.trimHeightMm);
        const chosen = layouts.find((l) => l.id === match?.id) ?? layouts[0]!;
        return docFromLayout(chosen);
      },
    });
    const ref = await source.start(job);
    expect(ref, 'design-studio returned no artwork').not.toBeNull();
    return ref!;
  }

  /**
   * Canva Import, run for real against its demo transport (24 D11 — there is no
   * other transport in this bundle). The scripted chooser takes the seeded
   * loyalty card, which is the design the demo's own flow imports.
   */
  async function canvaRef(): Promise<ArtworkRef> {
    const source = createCanvaSource({
      transport: createDemoTransport(NOW),
      choose: async ({ designs, transport }) => {
        const design = designs.find((d) => d.id === 'bakery-loyalty') ?? designs[0]!;
        return transport.export(design.id);
      },
    });
    const ref = await source.start(job);
    expect(ref, 'import-canva returned no artwork').not.toBeNull();
    return ref!;
  }

  it('tells the customer which checks had nothing to measure (AC7)', async () => {
    /*
     * THE ONLY CHECK THIS SUITE MAKES OF A SENTENCE, and it earns its place.
     * `artwork-source@1` carries no ink-to-trim distance, no colour space and
     * no font-embedding flag, so `fileFromRef` fills those three with
     * constants — which means three of `checkArtwork`'s six branches cannot
     * fail on an add-on-supplied design however bad it is, and the verdict
     * list a customer reads is silently three checks short.
     *
     * That is a v2 gap in the contract, not a bug to paper over. What WOULD be
     * a bug is telling a customer "everything checks out" about facts nobody
     * measured, so the artwork screen prints `addon.host.artwork.unmeasured`.
     * These assertions tie the three together: the fields, the constants they
     * are filled with, and the fact that the copy exists in every locale.
     * Measure one of them for real in v2 and this fails until the copy moves.
     */
    const built = await designStudioRef();
    const file = fileFromRef(built);
    expect(REF_UNMEASURED).toEqual(['nearestInkMm', 'colourSpace', 'fontsEmbedded']);
    for (const field of REF_UNMEASURED) {
      expect(file[field], field).toEqual(REF_UNMEASURED_VALUES[field]);
    }
    // At the advisory threshold exactly, so the safe-area branch neither fires
    // nor reports a pass — the state the sentence is there to explain.
    expect(file.nearestInkMm).toBe(4);
    expect(checkArtwork(file, config).some((v) => v.key === 'verdict.nearTrim')).toBe(false);
  });

  it('passes every check the host runs on an upload', async () => {
    // The HOST runs the checks (24 §5.5). This is the assertion that says so:
    // the same `checkArtwork` an uploaded file goes through, on the ref the
    // editor actually produced.
    const built = await designStudioRef();
    expect(built.source).toBe('design-studio');
    const verdicts = checkArtwork(fileFromRef(built), config);
    expect(
      verdicts.filter((v) => v.level !== 'pass').map((v) => v.key),
      built.fileId,
    ).toEqual([]);
  });

  it('bleeds and resolves the way the works needs, because the editor made it that way', async () => {
    // Stated as measurements off the real output rather than as a fixture: the
    // finished size is the 85 × 55 trim with 3mm of bleed on every edge.
    const built = await designStudioRef();
    expect({ w: built.widthMm, h: built.heightMm, bleed: built.bleedMm, dpi: built.dpi }).toEqual({
      w: 91,
      h: 61,
      bleed: 3,
      dpi: 300,
    });
    expect(built.pages).toBe(config.sides);
  });

  it('fails the same checks when the imported design has no bleed', async () => {
    // The other implementation, on the same job, through the same host check.
    // The asymmetry between the two add-ons IS the demo, so it is measured here
    // rather than described: this ref comes out of the import flow, not a
    // literal, and it is 85 × 55 at the trim with nothing outside it.
    const imported = await canvaRef();
    expect(imported.source).toBe('import-canva');
    expect({ w: imported.widthMm, h: imported.heightMm, bleed: imported.bleedMm }).toEqual({
      w: 85,
      h: 55,
      bleed: 0,
    });
    const verdicts = checkArtwork(fileFromRef(imported), config);
    expect(verdicts.some((v) => v.level === 'fail' && v.key === 'verdict.bleedMissing')).toBe(true);
  });

  it('runs one check over two unrelated implementations and gets two answers', async () => {
    // The claim the contract rests on, stated in one place: the host does not
    // know which add-on made a file, and the verdict differs because the FILES
    // differ, not because the host treats them differently.
    const [built, imported] = await Promise.all([designStudioRef(), canvaRef()]);
    const level = (ref: ArtworkRef) =>
      checkArtwork(fileFromRef(ref), config).some((v) => v.level === 'fail') ? 'fail' : 'pass';
    expect([level(built), level(imported)]).toEqual(['pass', 'fail']);
  });

  it('derives pixels from the ref’s own dots rather than assuming 300', async () => {
    const built = await designStudioRef();
    const low = fileFromRef({ ...built, dpi: 150 });
    expect(low.widthPx).toBe(Math.round((built.widthMm / 25.4) * 150));
    expect(checkArtwork(low, config).some((v) => v.key === 'verdict.dpiLow')).toBe(false);
  });

  it('hands an add-on the resolved trim size, not the size key', () => {
    expect(job).toMatchObject({ trimWidthMm: 85, trimHeightMm: 55, bleedMm: 3, sides: 2, quantity: 500 });
  });
});

describe('settings and seeded facts', () => {
  /*
   * NOT ONE ADD-ON IS NAMED IN THIS BLOCK, and that is the assertion.
   *
   * It used to reach into one add-on's settings record by key and read a field
   * by name, which is the same defect the host chrome had: a test that must be
   * edited when the delivery company changes is testing the delivery company,
   * not the seam. Every check below is stated over whatever add-ons happen to
   * be registered.
   */
  const CONNECTABLE = ALL.filter(isConnectable);

  it('gives every registered add-on a settings record it owns the shape of', () => {
    for (const addOn of CONNECTABLE) {
      expect(DEFAULT_ADD_ON_SETTINGS[addOn.key], addOn.key).toEqual(addOn.defaultSettings ?? {});
    }
  });

  it('declares every setting it defaults, and defaults every setting it declares', () => {
    // The alphabet check (24 §5.4): one add-on used to declare i18n keys where
    // another declared machine keys, and the host normalised between them.
    for (const addOn of CONNECTABLE) {
      const declared = addOn.settings.map((s) => s.key).sort();
      expect(Object.keys(addOn.defaultSettings ?? {}).sort(), addOn.key).toEqual(declared);
      for (const key of declared) {
        expect(key, `${addOn.key} setting key`).toMatch(/^[a-z][a-z0-9_]*$/);
      }
    }
  });

  it('defaults every demo switch to on', () => {
    // 24 D11. A live demo that reached a real third party on every visitor
    // click would be a defect, not a feature. The host does not know which
    // setting means that — the add-on declares it.
    const withDemo = CONNECTABLE.filter((a) => a.demoSwitch !== undefined);
    expect(withDemo.length).toBeGreaterThan(0);
    for (const addOn of withDemo) {
      expect(DEFAULT_ADD_ON_SETTINGS[addOn.key]![addOn.demoSwitch!.key], addOn.key).toBe(true);
    }
  });

  it('holds no credential of any kind', () => {
    // 24 D15. The store is readable from the browser, so a secret reaching it
    // is a leak whatever else is true.
    const text = JSON.stringify(DEFAULT_ADD_ON_SETTINGS);
    for (const word of ['api_key', 'apiKey', 'account_number', 'accountNumber', 'token', 'secret']) {
      expect(text).not.toContain(word);
    }
  });

  it('pushes settings only to the add-ons that asked to be told', () => {
    const told: string[] = [];
    const listener = {
      ...CONNECTABLE[0]!,
      key: 'listener',
      applySettings: () => told.push('listener'),
    };
    applyAddOnSettings([...CONNECTABLE, listener], { ...DEFAULT_ADD_ON_SETTINGS, listener: {} });
    expect(told).toEqual(['listener']);
  });

  it('seeds activity only against add-ons that exist, newest first', () => {
    for (const addOn of ALL) {
      const entries = addOn.activity ?? [];
      const stamps = entries.map(
        (e) => `${e.iso} ${String(e.hour).padStart(2, '0')}:${String(e.minute).padStart(2, '0')}`,
      );
      expect(stamps, addOn.key).toEqual([...stamps].sort().reverse());
      for (const entry of entries) {
        // Pinned clock only — nothing here may drift past the demo's Wednesday.
        expect(entry.iso <= '2026-08-05', addOn.key).toBe(true);
        // Its own words, in its own namespace.
        expect(entry.messageKey.startsWith(`addon.${addOn.key}.`), entry.messageKey).toBe(true);
      }
    }
  });

  it('names what a disconnect takes and keeps, per add-on (D16)', () => {
    for (const addOn of CONNECTABLE) {
      expect(addOn.disconnect?.goesKey, addOn.key).toBeTruthy();
      expect(addOn.disconnect?.staysKey, addOn.key).toBeTruthy();
    }
  });
});

describe('what the host passes into a settings panel', () => {
  it('sends one representative job per product family and no estimate of any kind', () => {
    // The host's catalogue is host knowledge; what a job WEIGHS is not, and the
    // manage drawer used to compute it by importing an add-on's own engine.
    const samples = sampleJobs((key) => `label:${key}`);
    expect(samples.length).toBeGreaterThan(2);
    expect(new Set(samples.map((s) => s.productKey)).size).toBe(samples.length);
    for (const sample of samples) {
      expect(sample.label).toBe(`label:${sample.productKey}`);
      expect(sample.quantity).toBeGreaterThan(0);
      expect(sample.trimWidthMm).toBeGreaterThan(0);
      expect(Object.keys(sample).sort()).toEqual([
        'label',
        'materialKey',
        'packagingKey',
        'productKey',
        'quantity',
        'trimHeightMm',
        'trimWidthMm',
      ]);
    }
  });
});
