/**
 * CONNECTED MODE: the add-on list from the server, and the bundles it names.
 *
 * `registry.ts` is the DEMO source — three add-ons compiled into this bundle,
 * named by three imports. This is the other source. Only the source changes;
 * `createRegistry`, every slot and every surface below them are untouched,
 * which is the seam rule `DataSource` follows one directory over.
 *
 * Demo mode is not replaced (26 D7). A build with no surface side has no server
 * to ask, `HOSTED` is false, and nothing in this file is reached.
 *
 * ── THIS IS THE ONE FILE IN `src/` THAT MAY SEND, AND IT IS DECLARED ────────
 *
 * `testing/egress.ts` bans two things this file does. Both bans are right and
 * both are why the exemption is written down in `sources.test.ts` rather than
 * worked around here:
 *
 *   NET TWO bans naming `fetch`, because a demo that posted to a real service
 *   on every visitor's click would be a defect. This build is not that demo: it
 *   is a shop's own staff console, served BY its own Adminium, asking that
 *   Adminium what it has installed. The exemption is for ONE means — "fetch
 *   reached through a global", which is the `globalThis.fetch.bind(globalThis)`
 *   default below — and every other sender in the list is still a finding here.
 *
 *   `foreignImportsIn` bans `import(anythingButARelativeLiteral)`, and its own
 *   comment names this exact case — "`import(whateverTheServerSaid)` is a
 *   script from somewhere else". It is right, and the narrowing below is what
 *   makes the exemption honest rather than a hole: a bundle URL is REFUSED
 *   unless it is same-origin and under the add-on bundle path. A server that
 *   answered with `https://somewhere.example/evil.js` gets nothing imported and
 *   a recorded problem. `connected.test.ts` drives that refusal with the
 *   shapes that would otherwise get through, including the four that look
 *   same-origin and are not.
 *
 * A rename would have hidden both from a reader grepping for them. That is the
 * hole `testing/egress.ts`'s own header warns about — "a sender reached through
 * an alias is invisible to it" — so the spellings stay, in one file, declared.
 *
 * ── WHAT THE INTEGRITY CHECK IS WORTH, PRECISELY ───────────────────────────
 *
 * Each bundle arrives with a `sha256-…` the server derived from the hash it
 * recorded when it unpacked the package, and re-checks the bytes against on
 * every read. This file fetches the bytes, hashes them, and refuses a mismatch.
 *
 * WHAT THAT PROVES: the bytes this browser received are the bytes the same
 * reply described. It catches a cache or a proxy substituting one and not the
 * other.
 *
 * WHAT IT DOES NOT PROVE: anything about a compromised server. The list and the
 * hash come from the same place as the bundle, so a server that wanted to serve
 * something else would simply describe it correctly — and it served this
 * application too. The real control against a bad package is server-side, where
 * the tree is pinned at unpack and re-verified on every read.
 *
 * AND IT IS NOT SRI. A browser cannot be told to enforce `integrity` on a
 * dynamic `import()`; the attribute exists only on elements, and a
 * `<script type="module" src>` hands nothing back to the importer. The two
 * arrangements that would give real enforcement — a blob URL, or an import map
 * — both need `script-src` widened beyond `'self'`, and 26 §0.5 records that no
 * CSP change was needed or made. So this fetches, verifies, and then imports the
 * SAME URL, relying on the HTTP cache to make the second read the first read's
 * bytes. That is a weaker claim than SRI and it is stated here rather than
 * implied by the word "integrity".
 *
 * ── THE HOST PUBLISHES ITS REACT FIRST, AND THE ORDER IS LOAD-BEARING ──────
 *
 * A built add-on bundle contains no `import … from "react"` — it cannot, or a
 * browser could not resolve it (26 §0.7) — so each one aliases `react` and
 * `react/jsx-runtime` to shims that read a well-known global. Those shims run
 * when the MODULE INITIALISES, before anything calls `register()`, because JSX
 * compiles to `jsx(...)` calls at module scope.
 *
 * So `installAddOnRuntime` has to happen before the first `import()`, and it
 * happens once, below, rather than per bundle. Two Reacts in one page is two
 * reconcilers arguing over one DOM tree, which is why the add-on gets the
 * host's own copy rather than shipping its own.
 *
 * This was NOT wired at first, and the live round trip is what found it: every
 * bundle imported cleanly and every `register()` threw. The contract's error
 * message names the call and the ordering for exactly that reason — the
 * alternative failure is `undefined is not a function` from inside a minified
 * bundle, which says nothing about whose mistake it was.
 *
 * ── THE KEY IS CHECKED AGAINST THE ONE THE SERVER NAMED ────────────────────
 *
 * A bundle's `register()` returns an add-on with its own `key`, and that key is
 * a namespace: it selects the add-on's settings, its message bundle and which
 * fills the registry attributes to it. A bundle served as `holiday-calendars`
 * that returned `key: 'shipping-dhl'` would take over the delivery add-on's
 * settings and overwrite its strings. So the two must agree, and a bundle that
 * disagrees is dropped with a problem rather than registered.
 */

import * as React from 'react';
import * as JsxRuntime from 'react/jsx-runtime';

import type { AddOn } from './host.ts';
import { registerAddOnMessages } from '../i18n/messages/index.ts';
import { installAddOnRuntime } from './vendor/host/runtime/index.ts';

/** One add-on's client bundle, as `GET /api/v1/add-ons` describes it. */
export interface ConnectedBundle {
  path: string;
  url: string;
  integrity: string;
}

/** One installed add-on, as the server describes it. Narrowed to what is read. */
export interface ConnectedAddOnDto {
  key: string;
  name: string;
  version: string;
  attachments: readonly { attachedTo: string; enabled: boolean }[];
  bundles: readonly ConnectedBundle[];
}

/**
 * Why one add-on did not make it, in a shape a caller can log or render.
 *
 * A list rather than a throw: one broken add-on must not stop the other four.
 * That is the same rule the server's own provider registry follows, and it is
 * the difference between a shop with a missing panel and a shop with a white
 * screen.
 */
export interface ConnectedProblem {
  key: string;
  code:
    | 'LIST_UNAVAILABLE'
    | 'NO_BUNDLE'
    | 'UNSAFE_URL'
    | 'BUNDLE_UNAVAILABLE'
    | 'INTEGRITY_MISMATCH'
    | 'NO_REGISTER'
    | 'KEY_MISMATCH'
    | 'NO_DISCLAIMER'
    | 'MALFORMED';
  detail: string;
}

export interface ConnectedLoad {
  addOns: AddOn[];
  problems: ConnectedProblem[];
}

/**
 * The prefix a bundle URL must sit under.
 *
 * 26 §5.4 put the bundle inside `/api/v1` rather than at `/add-ons/<key>.js`
 * deliberately, so this is a real path and not a coincidence — but this file
 * treats it as a FENCE rather than as a route it constructs. The server sends
 * the URL; this only decides whether it is one this app will import.
 */
const BUNDLE_PREFIX = '/api/v1/add-ons/';

/** Where the list lives, relative to the origin serving this app. */
const LIST_PATH = '/api/v1/add-ons';

/**
 * Is this a URL this app will import a script from?
 *
 * `new URL(raw, origin)` RESOLVES rather than parses, which is what makes the
 * check meaningful: a relative `../../evil.js` and an absolute
 * `https://elsewhere.test/evil.js` both come out as absolute URLs whose origin
 * can be compared. Four shapes that read as same-origin and are not:
 *
 *   `https://evil.test/api/v1/add-ons/x.js`     right path, wrong origin
 *   `//evil.test/api/v1/add-ons/x.js`           protocol-relative
 *   `/api/v1/add-ons/../../../evil.js`          escapes the fence when resolved
 *   `https://own.test@evil.test/…`              the origin is `evil.test`
 *
 * The last two are why this compares the RESOLVED `pathname` and `origin`
 * rather than testing the raw string with `startsWith`.
 */
export function bundleUrlIsSafe(raw: string, pageOrigin: string): boolean {
  let url: URL;
  try {
    url = new URL(raw, pageOrigin);
  } catch {
    return false;
  }
  if (url.origin !== new URL(pageOrigin).origin) return false;
  // `pathname` is already normalised by `URL`, so `..` has been applied.
  return url.pathname.startsWith(BUNDLE_PREFIX);
}

/**
 * Is this entry the shape this file reads?
 *
 * ── THE SERVER IS UNTRUSTED FOR SHAPE TOO, NOT ONLY FOR CONTENT ────────────
 *
 * Everything else here treats the reply as untrusted — the bundle URL is
 * fenced, the bytes are hashed, the registered key is compared. The SHAPE was
 * trusted blindly, and `listed` is whatever `res.json()` produced. So
 * `dto.attachments.some(...)` on an entry with no `attachments` threw a
 * `TypeError` out of a function whose docblock promises it NEVER THROWS,
 * `App.tsx` had no `.catch`, and ONE malformed entry anywhere in the list meant
 * zero add-ons loaded and no problem reported — the precise opposite of "one
 * broken add-on must not stop the other four".
 *
 * It does not take a hostile server. This app and Adminium are separately
 * versioned and separately deployed; a field renamed on one side is enough.
 *
 * Hand-written rather than a schema: `zod` is a devDependency here and
 * `sources.test.ts` forbids a shipped module from importing it.
 */
function isConnectedDto(value: unknown): value is ConnectedAddOnDto {
  if (typeof value !== 'object' || value === null) return false;
  const dto = value as Record<string, unknown>;
  if (typeof dto['key'] !== 'string' || dto['key'] === '') return false;
  if (!Array.isArray(dto['attachments'])) return false;
  if (!Array.isArray(dto['bundles'])) return false;
  for (const a of dto['attachments'] as unknown[]) {
    if (typeof a !== 'object' || a === null) return false;
    const at = (a as Record<string, unknown>)['attachedTo'];
    if (typeof at !== 'string') return false;
  }
  for (const b of dto['bundles'] as unknown[]) {
    if (typeof b !== 'object' || b === null) return false;
    const bundle = b as Record<string, unknown>;
    if (typeof bundle['url'] !== 'string') return false;
    if (typeof bundle['integrity'] !== 'string') return false;
    if (typeof bundle['path'] !== 'string') return false;
  }
  return true;
}

/**
 * Does this add-on's own message bundle carry a not-affiliated line?
 *
 * Every locale, not just English: a shop read in Arabic with the line only in
 * English has an undisclaimed surface for its actual readers, which is the
 * whole of what AC6 is about. The key is the one every add-on that names a
 * company already uses — `addon.<key>.notAffiliated`.
 */
function hasDisclaimer(addOn: AddOn): boolean {
  // Defensive about the VALUES, not only the presence: this runs on an object a
  // downloaded bundle returned, where a message that is not a string is one
  // `.trim()` away from throwing out of a function that must not.
  const messages: unknown = addOn.messages;
  if (typeof messages !== 'object' || messages === null) return false;
  const bundles = Object.values(messages as Record<string, unknown>);
  if (bundles.length === 0) return false;
  return bundles.every((bundle) => {
    if (typeof bundle !== 'object' || bundle === null) return false;
    return Object.entries(bundle as Record<string, unknown>).some(
      ([key, value]) =>
        key.endsWith('.notAffiliated') && typeof value === 'string' && value.trim() !== '',
    );
  });
}

/** `sha256-<base64>` over these bytes, in the spelling the server sends. */
async function sha256Integrity(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  let binary = '';
  for (const byte of new Uint8Array(digest)) binary += String.fromCharCode(byte);
  return `sha256-${btoa(binary)}`;
}

/**
 * Constant-time-ish comparison is not the point here and is not attempted: the
 * hash is public, both sides come from the same reply, and a timing signal on a
 * value the caller already has is not a leak. What matters is that a mismatch
 * refuses rather than warns.
 */
function sameIntegrity(a: string, b: string): boolean {
  return a === b && a.startsWith('sha256-');
}

export interface ConnectedOptions {
  /** This app's own manifest key, so the list can be narrowed to it. */
  appKey: string;
  /** The origin serving this page. Injected so a suite can drive the fence. */
  origin: string;
  /**
   * Injected for the suite. The default is the reason this file is declared in
   * `sources.test.ts`; see the header.
   */
  request?: typeof fetch;
  /** Injected for the suite. Same. */
  importBundle?: (url: string) => Promise<unknown>;
}

/**
 * A bundle's shape, as far as this file is concerned.
 *
 * `register` is checked for being a function before it is called, because a
 * module that exports a string named `register` would otherwise throw inside
 * the loop and take the other add-ons down with it.
 */
interface BundleModule {
  register?: unknown;
}

/**
 * Fetch the list, load what this host hosts, and hand back registered add-ons.
 *
 * NEVER THROWS. Every failure is a `ConnectedProblem`, including the list
 * itself being unreachable — a shop whose Adminium is briefly down should show
 * its own screens with the add-on panels empty, which is exactly what this
 * host's five slots already do when nothing fills them.
 */
export async function loadConnectedAddOns(options: ConnectedOptions): Promise<ConnectedLoad> {
  const { appKey, origin } = options;
  const request = options.request ?? globalThis.fetch.bind(globalThis);
  const importBundle =
    options.importBundle ?? ((url: string): Promise<unknown> => import(/* @vite-ignore */ url));

  /*
   * BEFORE ANY IMPORT — see the header. Idempotent, so a second load (a
   * StrictMode double-mount, a refresh of the list) simply republishes the same
   * two namespaces.
   */
  installAddOnRuntime({
    react: React as unknown as Readonly<Record<string, unknown>>,
    jsx: {
      jsx: (JsxRuntime as unknown as { jsx: unknown }).jsx,
      jsxs: (JsxRuntime as unknown as { jsxs: unknown }).jsxs,
      Fragment: (JsxRuntime as unknown as { Fragment: unknown }).Fragment,
    },
  });

  const problems: ConnectedProblem[] = [];
  let listed: readonly unknown[];
  try {
    // Same-origin, so the operator's session cookie rides along with no header
    // and no key. That is the whole reason connected add-on mode is a HOSTED
    // build only: a standalone build carries a publishable key, and the add-on
    // routes are behind `manifests.manage` on a real session.
    const res = await request(new URL(LIST_PATH, origin).toString(), {
      credentials: 'same-origin',
      headers: { accept: 'application/json' },
    });
    if (!res.ok) {
      problems.push({
        key: '*',
        code: 'LIST_UNAVAILABLE',
        detail: `GET ${LIST_PATH} answered ${String(res.status)}`,
      });
      return { addOns: [], problems };
    }
    const body = (await res.json()) as { addOns?: unknown };
    listed = Array.isArray(body.addOns) ? (body.addOns as readonly unknown[]) : [];
  } catch (cause) {
    problems.push({
      key: '*',
      code: 'LIST_UNAVAILABLE',
      detail: cause instanceof Error ? cause.message : String(cause),
    });
    return { addOns: [], problems };
  }

  /*
   * ATTACHED TO THIS HOST AND SWITCHED ON THERE.
   *
   * The reply lists every add-on the instance has installed, across every host
   * app on it. An add-on attached only to the clinic is not this shop's, and
   * one disabled on this host is off HERE while staying on elsewhere — which is
   * what a per-attachment `enabled` is for. Filtering by both is what makes
   * acceptance #3's "disabling it makes the surface disappear" true.
   */
  const wellFormed: ConnectedAddOnDto[] = [];
  for (const entry of listed) {
    if (isConnectedDto(entry)) {
      wellFormed.push(entry);
      continue;
    }
    // Named where it can be, so an operator reading the console can tell WHICH
    // entry the server got wrong rather than only that something was.
    const key =
      typeof (entry as { key?: unknown } | null)?.key === 'string'
        ? String((entry as { key: string }).key)
        : '?';
    problems.push({ key, code: 'MALFORMED', detail: 'the server described this add-on in a shape this build does not read' });
  }

  const mine = wellFormed.filter((dto) =>
    dto.attachments.some((a) => a.attachedTo === appKey && a.enabled === true),
  );

  const addOns: AddOn[] = [];
  for (const dto of mine) {
    const bundle = dto.bundles[0];
    if (bundle === undefined) {
      // A data pack: it fills no slot, so it ships no client half. Not a
      // failure — there is simply nothing for this host to mount.
      continue;
    }
    if (!bundleUrlIsSafe(bundle.url, origin)) {
      problems.push({ key: dto.key, code: 'UNSAFE_URL', detail: bundle.url });
      continue;
    }

    const absolute = new URL(bundle.url, origin).toString();
    let bytes: ArrayBuffer;
    try {
      const res = await request(absolute, { credentials: 'same-origin' });
      if (!res.ok) {
        problems.push({
          key: dto.key,
          code: 'BUNDLE_UNAVAILABLE',
          detail: `${bundle.path} answered ${String(res.status)}`,
        });
        continue;
      }
      bytes = await res.arrayBuffer();
    } catch (cause) {
      problems.push({
        key: dto.key,
        code: 'BUNDLE_UNAVAILABLE',
        detail: cause instanceof Error ? cause.message : String(cause),
      });
      continue;
    }

    const seen = await sha256Integrity(bytes);
    if (!sameIntegrity(seen, bundle.integrity)) {
      problems.push({
        key: dto.key,
        code: 'INTEGRITY_MISMATCH',
        detail: `${bundle.path}: expected ${bundle.integrity}, got ${seen}`,
      });
      continue;
    }

    let module: BundleModule;
    try {
      module = (await importBundle(absolute)) as BundleModule;
    } catch (cause) {
      problems.push({
        key: dto.key,
        code: 'NO_REGISTER',
        detail: cause instanceof Error ? cause.message : String(cause),
      });
      continue;
    }
    if (typeof module.register !== 'function') {
      problems.push({
        key: dto.key,
        code: 'NO_REGISTER',
        detail: `${bundle.path} exports no register()`,
      });
      continue;
    }

    /*
     * EVERYTHING THE BUNDLE'S RETURN VALUE TOUCHES IS INSIDE THIS TRY.
     *
     * The `register()` CALL was guarded and its RESULT was not, which is a
     * distinction with no defensive value: `register: () => null` threw on the
     * first property read, a message value that is not a string threw inside
     * `hasDisclaimer`, and a getter that throws did it from anywhere. All of
     * them escaped a function documented NEVER THROWS and took every other
     * add-on with them.
     *
     * The value is only TYPED `AddOn`. It arrives from `import()` as `unknown`
     * and is cast, so the type says nothing about what is actually there — the
     * same reason the guard two blocks up checks `typeof register === 'function'`
     * rather than trusting the interface.
     *
     * MESSAGE REGISTRATION IS IN HERE TOO, and that is the other half of the
     * same defect. `registerAddOnMessages` is documented to THROW — on a
     * missing locale, a missing key in any of the eight, or a collision — and
     * `App.tsx` was calling it in an un-guarded `.then()`. One add-on with a
     * hole in its Arabic aborted the whole callback: the registry was never
     * installed, the `problems` were never even logged, and the shop looked
     * exactly like an instance with no add-ons at all. Doing it here makes a
     * bad bundle one `NO_REGISTER` row, which is what the rest of this file
     * already promises.
     */
    let addOn: AddOn;
    let refusal: ConnectedProblem | null = null;
    try {
      addOn = (module.register as () => AddOn)();
      if (typeof addOn !== 'object' || addOn === null || typeof addOn.key !== 'string') {
        throw new Error('register() returned something that is not an add-on');
      }
      // EVERY read of the returned object is in here, including the two
      // refusals below — a `get namesCompany() { throw }` is one line of a
      // downloaded bundle away, and reading it outside would put the throw
      // straight back where it was.
      if (addOn.key !== dto.key) {
        // The key is a namespace: it selects the add-on's settings, its message
        // bundle and which fills the registry attributes to it. A bundle served
        // as one add-on and registering as another would take over the other's
        // settings and overwrite its strings.
        refusal = {
          key: dto.key,
          code: 'KEY_MISMATCH',
          detail: `served as "${dto.key}", registered as "${String(addOn.key)}"`,
        };
      } else if (addOn.namesCompany === true && !hasDisclaimer(addOn)) {
        refusal = {
          key: dto.key,
          code: 'NO_DISCLAIMER',
          detail: 'declares namesCompany and ships no notAffiliated line (24 AC6)',
        };
      } else if (addOn.messages !== undefined) {
        registerAddOnMessages(addOn.key, addOn.messages);
      }
    } catch (cause) {
      problems.push({
        key: dto.key,
        code: 'NO_REGISTER',
        detail: cause instanceof Error ? cause.message : String(cause),
      });
      continue;
    }
    if (refusal !== null) {
      /*
       * AC6 AND THE KEY CHECK, DECIDED ABOVE AND REPORTED HERE.
       *
       * `affiliation.test.tsx` tours every surface and requires the
       * not-affiliated line wherever a company's mark appears. It reads its
       * marks from `import.meta.glob("./vendor/*​/add-on-facts.ts")`, which the
       * BUNDLER resolves — so it sees the three add-ons compiled into this
       * build and is structurally incapable of seeing one that arrived over the
       * wire. That is not a gap in the test; it is a question a build-time glob
       * cannot be asked.
       *
       * So the check moved to registration, which is the same move
       * `registerAddOnMessages` made when add-on keys stopped being part of the
       * host's `MessageKey` union: the guarantee leaves the type checker and
       * becomes a boot-time refusal, on every boot, in the shop where the
       * add-on is actually running.
       *
       * WHAT IT CANNOT CHECK, and the tour still can for a vendored copy:
       * whether the line is on the SAME SURFACE as the naming. That is the
       * amendment AC6 exists for — "a disclaimer a reader meets after the
       * naming is a disclaimer they may never meet" — and answering it needs
       * the add-on's own screens rendered, which is the add-on repository's to
       * do and not this shop's.
       */
      problems.push(refusal);
      continue;
    }
    addOns.push(addOn);
  }

  return { addOns, problems };
}
