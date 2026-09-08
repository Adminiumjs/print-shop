/*
 * VENDORED from add-ons/packages/host/src/runtime/index.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The ONE shared contract; the three add-ons here import it by relative path.
 */
/**
 * THE ADD-ON RUNTIME CONTRACT — how a client bundle gets React from its host.
 *
 * ─── The problem this exists to solve ──────────────────────────────────────
 *
 * An add-on's client bundle used to declare `react`, `react/jsx-runtime` and
 * `lucide-react` as Rollup EXTERNALS, for a reason that was right: two copies
 * of React in one page is two reconcilers arguing over one DOM tree, so an
 * add-on must use the host's React and not its own.
 *
 * External is the correct answer when a BUNDLER resolves the import — which is
 * what demo mode does, compiling the add-on into the host's own build. It is
 * the wrong answer the moment a BROWSER resolves it. `dist/client.js` opened
 * with `import { useMemo } from "react"`, and a bare specifier cannot be
 * resolved by `import()` at all without an import map. So the artefact that
 * 26 §6 says the host "`import()`s from the server" could not be imported by a
 * browser, and the demo build worked only because Vite resolved those imports
 * before they ever reached one.
 *
 * ─── The fix: React arrives through the host, not through the module graph ──
 *
 * The host publishes its React on a well-known global before it imports any
 * add-on. Each add-on aliases `react` and `react/jsx-runtime` to the shims
 * beside this file, which read that global — so a built bundle contains NO bare
 * imports, is loadable from any URL, and still uses exactly one React.
 *
 * `lucide-react` is deliberately NOT part of this contract and is bundled into
 * each add-on instead. The identity rule is about React alone: two Reacts break
 * hooks and context, whereas two copies of a set of SVG components are merely
 * two copies of some SVG. Tree-shaking means an add-on carries only the icons
 * it actually draws, which is a handful.
 *
 * ─── The ordering rule, stated once ────────────────────────────────────────
 *
 * A host MUST call {@link installAddOnRuntime} before it imports an add-on
 * bundle. The shims read the global when their module initialises, so an
 * add-on imported first would see nothing — and the error it throws says so by
 * name rather than failing later as `undefined is not a function` somewhere
 * inside a hook.
 *
 * Demo mode does not need it: there, Vite resolves `react` to the host's own
 * copy at build time and the alias never applies.
 */

/**
 * The React values an add-on's client half may use.
 *
 * Typed as an index signature rather than a hand-listed set on purpose: the
 * host passes its React NAMESPACE straight through, and a narrower type would
 * have to be widened every time a bundled dependency reached for something
 * ordinary — which is exactly how the first version of the shim broke, on
 * `lucide-react`'s `forwardRef`.
 */
export type AddOnReactRuntime = Readonly<Record<string, unknown>>;

/** The automatic JSX runtime's entry points. */
export interface AddOnJsxRuntime {
  jsx: unknown;
  jsxs: unknown;
  Fragment: unknown;
}

export interface AddOnRuntime {
  react: AddOnReactRuntime;
  jsx: AddOnJsxRuntime;
}

/**
 * The global a host publishes on.
 *
 * A global rather than an argument to `register()` because JSX compiles to
 * `jsx(...)` calls at MODULE scope — a bundle's very first expression may
 * already need the runtime, long before anything calls `register()`. Passing it
 * in would work only for an add-on that used `createElement` by hand.
 */
export const ADD_ON_RUNTIME_KEY = '__ADMINIUM_ADD_ON_RUNTIME__';

interface RuntimeCarrier {
  [ADD_ON_RUNTIME_KEY]?: AddOnRuntime;
}

/** Called by the HOST, once, before importing any add-on bundle. */
export function installAddOnRuntime(runtime: AddOnRuntime): void {
  (globalThis as unknown as RuntimeCarrier)[ADD_ON_RUNTIME_KEY] = runtime;
}

/** Whether a host has published a runtime yet. */
export function hasAddOnRuntime(): boolean {
  return (globalThis as unknown as RuntimeCarrier)[ADD_ON_RUNTIME_KEY] !== undefined;
}

/**
 * Read the runtime, or explain precisely what the host forgot.
 *
 * The message names the call and the ordering, because the alternative failure
 * is an add-on's first hook throwing `undefined is not a function` from inside
 * a minified bundle, which says nothing about whose mistake it was.
 */
export function requireAddOnRuntime(): AddOnRuntime {
  const runtime = (globalThis as unknown as RuntimeCarrier)[ADD_ON_RUNTIME_KEY];
  if (runtime === undefined) {
    throw new Error(
      'No add-on runtime was installed by the host. Call installAddOnRuntime({ react, jsx }) ' +
        'BEFORE importing any add-on bundle — the bundle reads it as its module initialises, ' +
        'so installing it afterwards is too late.',
    );
  }
  return runtime;
}

/** For a host to clear between tests. */
export function clearAddOnRuntime(): void {
  delete (globalThis as unknown as RuntimeCarrier)[ADD_ON_RUNTIME_KEY];
}
