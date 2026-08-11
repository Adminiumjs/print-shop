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

import { describe, expect, it } from 'vitest';

import { applyAddOnSettings, createRegistry, isConnectable, resolveActivity } from './host.ts';
import { activityRefs } from './useActivityContext.ts';
import { SLOT_EMPTY_BEHAVIOUR, SLOT_FILL, HOSTED_SLOTS } from './slots.ts';
import { DEFAULT_ADD_ON_SETTINGS, demoAddOns, DEMO_KEYS } from './registry.ts';
import {
  fileFromRef,
  jobSpecFor,
  REF_UNMEASURED,
  REF_UNMEASURED_VALUES,
  type ArtworkRef,
} from './artwork.ts';
import { outboundOrderFor, sampleCatalogue, SHOP_ORIGIN } from './records.ts';
import { JOBS, NOW } from '../data/demo.ts';
import { source } from '../data/source.ts';
import { checkArtwork, type Configuration } from '../lib/quote.ts';

// The two `artwork-source` implementations, driven for real below.
import { createArtworkSource } from './vendor/design-studio/artworkSource.ts';
import { docFromLayout, layoutForSize } from './vendor/design-studio/layouts.ts';
import { createCanvaSource } from './vendor/import-canva/source.ts';
import { createDemoTransport } from './vendor/import-canva/demo/transport.ts';

const ALL = demoAddOns();
const KEYS = new Set(ALL.map((a) => a.key));

describe('the demo registry', () => {
  /**
   * ── WHAT A REGISTRY SUITE MAY ASSERT, AND WHAT IT MAY NOT ─────────────────
   *
   * [Amended 2026-08-11, wave 4b round 4.] This opened with
   * `expect(ALL).toHaveLength(7)`, which turned "register one more add-on" into
   * a red suite on a LIVE app whose screens were faultless. It was found by
   * registering the maker studio's Live Personalizer here — the whole point of
   * a portable add-on — and it was the only thing in the experiment that
   * failed.
   *
   * It is the same shape as the `HOSTED_SLOTS` assertion removed further down
   * this file: a host forbidding, in its own tests, the thing 24 D21 says a
   * host must allow. A count is not an invariant. What holds however many
   * add-ons this build carries is the set of RELATIONS between the registry and
   * the vendored list, and those are what is asserted now.
   */
  it('registers every add-on it vendors, and describes others it has not built', () => {
    for (const key of DEMO_KEYS) expect(KEYS.has(key), `${key} is vendored, not registered`).toBe(true);
    expect(KEYS.size, 'two add-ons share a key').toBe(ALL.length);
    expect(ALL.filter(isConnectable).map((a) => a.key).sort()).toEqual([...DEMO_KEYS].sort());
    /*
     * The shelf says more than the build ships, which is the catalogue copy of
     * 24 D12 — described honestly, with a "Not in this demo" chip where the
     * Connect button would be. A shelf holding exactly what it ships reads as
     * though those are all there could ever be.
     */
    expect(ALL.filter((a) => !isConnectable(a)).length).toBeGreaterThan(0);
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

  /*
   * REMOVED, wave 4b round 2: `it('names only slots the host actually hosts')`,
   * which asserted `HOSTED_SLOTS` contained EVERY fill of EVERY registered
   * add-on.
   *
   * It forbids the thing 24 D21 claims. The personalizer declares six fills and
   * this works mounts five slots, five of which it does not host — so
   * registering a portable add-on here would have turned the LIVE app's suite
   * red while the app itself ran faultlessly, and the only way to keep it green
   * would have been to stop the add-on being portable. `slots.ts` states the
   * right rule in its header: a fill for a slot the host does not mount simply
   * does not render, and that IS portability.
   *
   * The half worth keeping — every id in `HOSTED_SLOTS` is really mounted — was
   * a grep over the sources for `slot="…"`, which a mount inside a comment
   * satisfies. Both now live in `slotRender.test.tsx`, where the app is
   * rendered and the mounts are the ones React actually reached.
   */
  /*
   * AND THE REPLACEMENT WAS VACUOUS TOO, so it has been replaced in turn
   * (wave 4b round 3). It asserted that `fillsFor` answers an unmounted slot
   * with `[]`. `createRegistry` never consults `HOSTED_SLOTS` — it filters by
   * enabled key, by `forAddOn` and by `SLOT_FILL` and by nothing else — so that
   * is not a property of the seam at all. It was green because no add-on
   * vendored here happens to fill a slot this works does not mount, which is a
   * fact about the fixture and would evaporate the day one did. Same failure
   * mode as the assertion it replaced: an accident wearing a claim's clothes.
   *
   * What is actually true, and what D21 actually needs, is below.
   */
  it('registers a fill for a slot this works does not mount, and mounts nothing for it (D21)', () => {
    const unhosted = 'product.options.personalize';
    expect(HOSTED_SLOTS as readonly string[]).not.toContain(unhosted);

    /*
     * A PORTABLE ADD-ON, STANDING IN FOR THE PERSONALIZER. It fills a real slot
     * in the closed registry that this works has no screen for. Synthesised
     * rather than vendored because the claim is about ANY such add-on, and
     * because a fixture that has to be installed to be tested is a fixture that
     * stops being run.
     */
    const elsewhere = {
      ...ALL.find(isConnectable)!,
      key: 'made-elsewhere',
      fills: [{ slot: unhosted, order: 1, render: () => null }],
    } as (typeof ALL)[number];

    const withIt = createRegistry([...ALL, elsewhere]);
    const everything = new Set([...ALL.map((a) => a.key), elsewhere.key]);

    /*
     * THE REGISTRY IS HONEST ABOUT IT — it hands the fill back, because a
     * registry that silently dropped fills for unmounted slots would hide the
     * difference between "this host has no screen for it" and "this add-on
     * declared nothing". The old assertion demanded exactly that silence.
     */
    expect(withIt.fillsFor(unhosted as never, everything).map((r) => r.addOn)).toEqual([
      elsewhere.key,
    ]);

    /*
     * AND NOTHING THIS WORKS DRAWS CHANGES. Every slot it mounts answers
     * identically with the portable add-on registered and without it, so
     * registering one cannot disturb a screen — which is the half of D21 this
     * file can prove.
     */
    const without = createRegistry(ALL);
    for (const slot of HOSTED_SLOTS) {
      const before = without.fillsFor(slot, everything).map((r) => r.addOn);
      const after = withIt.fillsFor(slot, everything).map((r) => r.addOn);
      expect(after, slot).toEqual(before);
    }

    /*
     * The other half — that the fill is never DRAWN, because no screen in this
     * app mounts the slot — is a claim about rendering and cannot be made here.
     * `slotRender.test.tsx` renders every surface this works has with exactly
     * this add-on registered and enabled, and asserts no mount ever names the
     * slot. That is where the property lives; this is where it is pointed at.
     */
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
  it('leaves no shelf entry silent about who else is involved (AC6)', () => {
    /*
     * EVERY ENTRY, NOT ONLY THE CONNECTABLE ONES — widened 2026-08-11, round 6.
     *
     * It used to be `ALL.filter(isConnectable)`, on the reasoning that a
     * described-but-not-built entry "has no detail surface, so there is nowhere
     * the sentence could go". That was true of the DIALOGS and false of the
     * screen: all seven entries are cards on the Add-ons shelf, and the shelf
     * renders `Affiliation` on each of them now. A scope written around where
     * the line happened to be mounted stopped being a rule the moment it was
     * mounted somewhere else.
     */
    const silent = ALL.filter(
      (addOn) => !addOn.namesCompany && (addOn.noCompanyKeys ?? []).length === 0,
    ).map((addOn) => addOn.key);
    expect(silent).toEqual([]);
    for (const addOn of ALL) {
      // One or the other, never both: an add-on that names a company gets the
      // disclaimer, and a second sentence saying it names none would contradict
      // it on the same line.
      if (addOn.namesCompany) expect(addOn.noCompanyKeys ?? []).toEqual([]);
      /*
       * THE ADD-ON'S OWN NAMESPACE — for the add-ons, which is what the rule
       * was ever about. A host key on a REGISTERED add-on would be the host
       * holding an add-on's copy, which is the thing AC5 took away.
       *
       * The four described-but-not-built entries are the other case and are
       * checked the other way: they have no repo behind them, their name, their
       * line and now their AC6 sentence are all `addon.stub.*` because they are
       * the HOST's own catalogue copy (`add-ons/shelf.ts` says why), and a key
       * in their own `addon.delivery-second-carrier.*` namespace would be a
       * namespace with nothing in it.
       */
      const own = isConnectable(addOn) ? `addon.${addOn.key}.` : 'addon.stub.';
      for (const key of addOn.noCompanyKeys ?? []) {
        expect(key.startsWith(own), `${addOn.key} · ${key} (expected ${own}…)`).toBe(true);
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

  /**
   * ORDER, NOT CENSUS. This asserted `[10, 20]` — the exact `order` values of
   * exactly two fills — so a fourth add-on filling `artwork.sources` turned it
   * red for adding a row, not for sorting wrongly. Same shape as the registry
   * count above it. What the rule actually is: the list comes back sorted, and
   * the shop's own editor is ahead of anything that imports from elsewhere.
   */
  it('puts the shop’s own editor ahead of the import in artwork.sources', () => {
    const fills = registry.fillsFor('artwork.sources', all);
    const orders = fills.map((f) => f.fill.order);
    expect(orders, 'the slot came back unsorted').toEqual([...orders].sort((a, b) => a - b));

    const keys = fills.map((f) => f.addOn);
    expect(keys.indexOf('design-studio')).toBeGreaterThanOrEqual(0);
    expect(keys.indexOf('design-studio')).toBeLessThan(keys.indexOf('import-canva'));
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

  /*
   * MOVED to `slotRender.test.tsx`: `it('mounts every slot it declares it
   * hosts')` walked `src/` and searched the text for `slot="…"`.
   *
   * It was written for a real defect — `nav.add-on.routes` sat in
   * `HOSTED_SLOTS` for a release, Design Studio shipped a fill for it, and no
   * screen ever drew it — and it could not have caught that defect, because a
   * mount inside a comment is text that matches. The maker studio proved
   * exactly that with a mutant. The check is now a render: a slot is recorded
   * when React CALLS the component, so a mount in a comment, behind a condition
   * that is never true, or in a file nothing renders, records nothing.
   */

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

  /*
   * REWRITTEN, wave 4b. This used to read `entry.iso`, `entry.hour` and
   * `entry.ref` off the DECLARED entries and assert `iso <= '2026-08-05'` —
   * which is to say it checked that an add-on had guessed this works' clock
   * correctly, and passed happily when a bundle shared with a second shop
   * guessed the other one's. An add-on no longer names a day or a reference at
   * all (`SeededActivityEntry`), so there is nothing there to check; what is
   * checkable is that the declaration is well formed and that the HOST's
   * resolution of it lands in this works' own day and paperwork.
   */
  it('declares activity relatively, newest first, in its own namespace', () => {
    for (const addOn of ALL) {
      const entries = addOn.activity ?? [];
      const ago = entries.map((e) => e.minutesAgo);
      // Newest first, and "newest" is now a smaller number rather than a later
      // stamp — a list sorted the other way would read backwards on screen.
      expect(ago, addOn.key).toEqual([...ago].sort((a, b) => a - b));
      for (const entry of entries) {
        expect(Number.isInteger(entry.minutesAgo) && entry.minutesAgo >= 0, addOn.key).toBe(true);
        if (entry.refIndex !== undefined) {
          expect(Number.isInteger(entry.refIndex) && entry.refIndex >= 0, addOn.key).toBe(true);
        }
        // Its own words, in its own namespace.
        expect(entry.messageKey.startsWith(`addon.${addOn.key}.`), entry.messageKey).toBe(true);
      }
    }
  });

  /**
   * THE CASE THAT COULD NOT PREVIOUSLY BE WRITTEN, and the defect it closes.
   *
   * These bundles are shared: the same `shipping-dhl` object is registered here
   * and in Birch Row. It used to ship `{ iso: '2026-08-05', hour: 9, minute: 58,
   * ref: 'MP-4119' }` — this works' Wednesday and this works' paperwork — so in
   * Birch Row the drawer listed Marlow Press's references, in a studio that has
   * never issued one beginning `MP`, on a day it does not think it is. Nothing
   * threw, because nothing compared the two.
   *
   * One declared seed, resolved twice, must give each shop its own answer.
   */
  it('resolves one declared seed into whichever shop is doing the showing', () => {
    const seeded = ALL.filter((a) => (a.activity ?? []).length > 0);
    expect(seeded.length).toBeGreaterThan(0);

    const here = { now: NOW, refs: activityRefs(JOBS) };
    const elsewhere = { now: { iso: '2026-08-06', hour: 16, minute: 40 }, refs: ['BR-2284', 'BR-2281'] };

    for (const addOn of seeded) {
      const mine = resolveActivity(addOn.activity, here);
      const theirs = resolveActivity(addOn.activity, elsewhere);

      for (const entry of mine) {
        // This works' own paperwork, or nothing at all.
        if (entry.ref !== '') expect(JOBS.some((j) => j.ref === entry.ref), entry.ref).toBe(true);
        // Never later than the pinned clock: a seeded line is history.
        expect(entry.iso <= NOW.iso, addOn.key).toBe(true);
      }
      for (const entry of theirs) {
        if (entry.ref !== '') expect(entry.ref.startsWith('BR-'), entry.ref).toBe(true);
        expect(entry.iso <= '2026-08-06', addOn.key).toBe(true);
      }
      // Same words either side; only the facts the host owns differ.
      expect(theirs.map((e) => e.messageKey)).toEqual(mine.map((e) => e.messageKey));
    }
  });

  /**
   * The list on screen is the RESOLVED one, so a shop with less history than an
   * add-on assumed shows fewer lines rather than a timestamp against a blank.
   * `Overlays.tsx` and `Extras.tsx` both read the resolved length for exactly
   * this reason.
   */
  it('drops a seeded line naming a reference this works has not got', () => {
    const seed = [
      { minutesAgo: 22, refIndex: 0, messageKey: 'addon.x.act.1' },
      { minutesAgo: 25, messageKey: 'addon.x.act.2' },
      { minutesAgo: 1_158, refIndex: 1, messageKey: 'addon.x.act.3' },
    ];
    const one = resolveActivity(seed, { now: NOW, refs: ['MP-4126'] });
    expect(one.map((e) => e.messageKey)).toEqual(['addon.x.act.1', 'addon.x.act.2']);
    expect(resolveActivity(seed, { now: NOW, refs: [] })).toHaveLength(1);
  });

  /**
   * The references the two screens hand `resolveActivity` are the works' own,
   * newest first — derived from the job board rather than written down beside
   * it. A hand-kept list is a second copy of the paperwork that nothing
   * compares with the first.
   */
  it('offers the works own job references, newest first', () => {
    const refs = activityRefs(JOBS);
    expect(refs).toHaveLength(JOBS.length);
    expect(new Set(refs).size).toBe(refs.length);
    expect(refs[0]).toBe('MP-4126');
    expect(refs).toEqual([...refs].sort().reverse());
    for (const ref of refs) expect(JOBS.some((j) => j.ref === ref), ref).toBe(true);
  });

  it('names what a disconnect takes and keeps, per add-on (D16)', () => {
    for (const addOn of CONNECTABLE) {
      expect(addOn.disconnect?.goesKey, addOn.key).toBeTruthy();
      expect(addOn.disconnect?.staysKey, addOn.key).toBeTruthy();
    }
  });
});

describe('what this app hands across the seam', () => {
  it('sends one representative record per family, and no parcel of any kind', () => {
    /*
     * THE DIVISION, ASSERTED. The catalogue is this app's knowledge and what a
     * PARCEL of something weighs is not: there is no box here, no dimensions in
     * centimetres and no rate. What did change is that the shop now states what
     * ONE of a thing weighs — a fact about its own goods that the delivery
     * add-on used to derive from a copy of this app's grammage table.
     */
    const samples = sampleCatalogue((key) => `label:${key}`);
    expect(samples.length).toBeGreaterThan(2);
    expect(new Set(samples.map((s) => s.key)).size).toBe(samples.length);
    for (const sample of samples) {
      expect(sample.label).toBe(`label:${sample.key}`);
      expect(sample.quantity).toBeGreaterThan(0);
      expect(sample.unitWeightGrams).toBeGreaterThan(0);
      expect(sample.unitSize?.widthMm).toBeGreaterThan(0);
      // Named for the surface, not for this app: no `trimWidthMm`, no
      // `packagingKey`, no `materialKey` — the three that made `SampleJob` a
      // print works' job record with the name filed off.
      expect(Object.keys(sample).sort()).toEqual([
        'key',
        'label',
        'quantity',
        'unitSize',
        'unitWeightGrams',
      ]);
    }
  });

  it('maps a job on the board into an order any shop could have produced', () => {
    const job = source.jobs()[0]!;
    const order = outboundOrderFor(job, (key) => `label:${key}`);

    expect(order.ref).toBe(job.ref);
    expect(order.recipient.name).toBe(job.customer);
    expect(order.origin).toEqual(SHOP_ORIGIN);
    expect(order.items).toHaveLength(1);

    const [item] = order.items;
    expect(item!.label).toBe(`label:${job.productKey}`);
    expect(item!.quantity).toBe(job.quantity);
    expect(item!.unitWeightGrams).toBeGreaterThan(0);

    // NOT ONE FIELD OF THIS APP'S VOCABULARY CROSSES. `trimWidthMm`,
    // `materialKey`, `packagingKey`, `stage` and `express` all stay at home;
    // an add-on that could read them would be an add-on that only runs here.
    const wire = JSON.stringify(order);
    for (const field of ['trimWidthMm', 'materialKey', 'packagingKey', 'stage', 'express']) {
      expect(wire, field).not.toContain(field);
    }
  });

  it('says nothing rather than guessing when a customer has no address on file', () => {
    // The regression that made this suite: a lookup that missed used to fall
    // through to a seeded address, and a dispatch screen pre-filled a DIFFERENT
    // customer's street in the same quiet grey box a correct one uses.
    const job = { ...source.jobs()[0]!, customer: 'Ashcombe Bindery' };
    const order = outboundOrderFor(job, (key) => key);
    expect(order.destination).toBeUndefined();
  });

  it('gives every seeded customer somewhere the van can actually go', () => {
    for (const job of source.jobs()) {
      const order = outboundOrderFor(job, (key) => key);
      expect(order.destination, job.ref).toBeDefined();
      expect(order.destination!.postcode, job.ref).not.toBe('');
      // A country CODE, because a carrier checks a postcode against one.
      expect(order.destination!.country, job.ref).toMatch(/^[A-Z]{2}$/);
    }
  });
});
