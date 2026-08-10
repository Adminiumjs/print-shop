/**
 * The static list the demo registers at startup (24 §5.9).
 *
 * In DEMO MODE the three add-on bundles are compiled into the app and named
 * here; in CONNECTED MODE (Phase B) this list comes from `GET /api/v1/add-ons`
 * and the bundles are `import()`ed with their SRI hashes. Only the SOURCE of
 * the list changes — `createRegistry` and every surface below it stay exactly
 * as they are, which is the same seam rule `DataSource` follows.
 *
 * Each `register()` is a pure function returning a plain object. Importing an
 * add-on has no side effect beyond its stylesheet and its strings, so the host
 * can register one, drop it from `enabled`, and be back at its base state with
 * nothing left behind — which is the whole claim D6 makes.
 *
 * THE THREE IMPORTS BELOW ARE THE ONLY PLACE PRODUCTION SOURCE NAMES AN ADD-ON.
 * Not `src/` — the claim used to say that and it was false, and a false claim
 * in a header is worse than none, because it is the thing a reviewer checks
 * instead of the code. `manifest.test.ts`, `state/delivery.test.ts` and
 * `builtOutput.test.ts` all name add-ons on purpose: a suite that asserted the
 * seam without ever naming what is on the far side of it would be asserting
 * nothing. What is true, and what acceptance criterion 5 actually needs, is
 * that no SHIPPED module outside `./vendor/` and these three lines mentions
 * one. Their settings, their defaults, the words on their settings forms,
 * their eight-locale strings, their seeded activity and what their parcels
 * weigh all arrive inside the objects they return, so replacing the carrier is
 * replacing one import here and one repo over there.
 *
 * The four described-but-not-built shelf entries are NOT add-ons in this sense
 * and are not here: they are catalogue copy, they name no company at all, and
 * they live in `./shelf.ts` — see that file's header for why.
 *
 * `./vendor/<key>/` IS A SYNCED COPY, NOT A FORK. The add-ons are one
 * repository — `add-ons`, a package each — and this app is standalone, so there
 * is no npm package tying them together and the demo build gets a copy: the
 * same arrangement the marketplace apps already use for the demo-data toolkit.
 * Every vendored file says so in its own header. Edit the package and re-run
 * the sync script, `scripts/sync-add-ons.sh`, which ships in this repo so a
 * cloner and CI can both run it; a hand-edit here is invisible until it is a
 * bug in two places at once.
 *
 * `./vendor/host/` IS THE ADD-ONS' SHARED CONTRACT, vendored alongside them
 * because their sources import it and this app has no node_modules entry that
 * could resolve it. It is a MIRROR of `./host.ts` — the file directly below
 * this import list — and `./host.ts` stays authoritative: the three
 * `register()` calls return objects typed by the mirror and are assigned here
 * into `readonly AddOn[]` typed by ours, so `tsc -b` in this repo is itself the
 * check that the two still describe the same shape.
 */

import { registerAddOnMessages } from '../i18n/messages/index.ts';
import { register as designStudio } from './vendor/design-studio/index.ts';
import { register as importCanva } from './vendor/import-canva/index.ts';
import { register as shippingDhl } from './vendor/shipping-dhl/index.ts';
import { defaultSettingsFor, type AddOn, type AddOnSettings } from './host.ts';
import { NOT_IN_THIS_DEMO } from './shelf.ts';

/**
 * Registered once, at module load, because REGISTRATION IS WHERE THE MESSAGES
 * ARRIVE.
 *
 * An add-on's strings used to be imported by `i18n/messages/index.ts` and
 * type-unioned into the host's own `MessageKey`, which made the host's key
 * vocabulary depend on which add-ons happened to be vendored. They now travel
 * on the add-on object and are merged here. Doing it at module load rather than
 * in a mount effect is deliberate: this module is imported by the store, which
 * every screen imports, so the merge is complete before the first render reads
 * a bundle. What moved from compile time to registration time is stated in full
 * in `i18n/messages/index.ts`, next to the check that replaces the type.
 */
const REGISTERED: readonly AddOn[] = [designStudio(), shippingDhl(), importCanva()];
for (const addOn of REGISTERED) {
  if (addOn.messages !== undefined) registerAddOnMessages(addOn.key, addOn.messages);
}

/** Everything the shelf shows. Three that work, four that say they do not. */
export function demoAddOns(): AddOn[] {
  return [...REGISTERED, ...NOT_IN_THIS_DEMO];
}

/**
 * What every add-on starts from, keyed by add-on key and OPAQUE to the host.
 *
 * `api_key` and `account_number` are absent by construction rather than by
 * omission (24 D15): they are the credentialled add-on's two `secret: true`
 * settings, they live in its server half, and a store the browser can read is
 * precisely where they must never appear. The connect dialog collects them into
 * component state and drops them; nothing here ever holds one.
 */
export const DEFAULT_ADD_ON_SETTINGS: AddOnSettings = defaultSettingsFor(REGISTERED);

/** The keys the dock puts a toggle against — the ones a reviewer can watch. */
export const DEMO_KEYS: readonly string[] = REGISTERED.map((a) => a.key);
