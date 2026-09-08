import { defineConfig, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Vite's config type plus the block vitest reads out of the same file.
 *
 * NOT `import { defineConfig } from "vitest/config"`, and not
 * `/// <reference types="vitest/config" />` either. The import drags in the copy
 * of Vite nested under `vitest/`, and `tsc -b` then refuses the React plugin —
 * a `PluginOption` from one Vite is not assignable to `PluginOption` from the
 * other — which fails a build whose first half IS `tsc -b`. The triple-slash
 * reference does not augment under this tsconfig's resolution at all. One local
 * interface types the two settings that are actually used, keeps the plugin
 * types on Vite's own copy, and is checked like everything else.
 */
interface ViteWithVitest extends UserConfig {
  test: { testTimeout: number; hookTimeout: number };
}

// https://vite.dev/config/
// `base` defaults to "/" (root deploy on Vercel / DigitalOcean). The
// `build:demo` script overrides it with --base=/demo/print-shop/ so the app
// can be served from the Adminium demo sub-path.
const config: ViteWithVitest = {
  plugins: [react()],
  /*
   * ── THE DEV SERVER, AND THE ONE THING IT PROXIES (26-T13) ─────────────────
   *
   * Connected add-on mode reads `GET /api/v1/add-ons`, which is behind
   * `manifests.manage` on a real Adminium SESSION rather than a publishable
   * key. A session is a cookie, and a cookie belongs to an ORIGIN — so the only
   * arrangement in which this works is the app being served from the same
   * origin as the API. In production that is what a hosted surface IS; Adminium
   * serves the bundle itself.
   *
   * `npm run dev:hosted` reproduces that without a surface build: the dev
   * server proxies `/api` to a local Adminium, so the browser signs in through
   * this origin, keeps the cookie on this origin, and the loader's own
   * same-origin fence is exercised for real rather than only in a suite. Point
   * it elsewhere with ADMINIUM_ORIGIN.
   *
   * It is dev-only. `vite build` does not read `server`, so nothing here
   * reaches a bundle — which is why this is not an address `sources.test.ts`
   * has to forgive: that gate walks `src/`, and this file is not in it.
   */
  server: {
    proxy: {
      '/api': {
        target: process.env['ADMINIUM_ORIGIN'] ?? 'http://127.0.0.1:4600',
        changeOrigin: false,
      },
    },
  },
  /*
   * ── THE TEST RUN, AND WHY IT NEEDS A TIMEOUT AT ALL ───────────────────────
   *
   * `npm test` was RED on a clean tree for a whole round. Three suites —
   * `a11y.test.tsx`, `add-ons/egress.test.tsx` and `i18n/numerals.arabic.test.tsx`
   * — each failed with "Test timed out in 5000ms", and every one of them passes.
   * Nothing was wrong with them; nothing here said how long they are allowed to
   * take, so vitest's 5 s default applied, and the round that wrote them only
   * ever ran vitest directly with `--testTimeout` on the command line. A gate
   * that is green only when it is run with a flag the README does not mention is
   * not a gate. This is that flag, in the file, where the documented command
   * picks it up.
   *
   * ── WHY THOSE THREE ARE SLOW, WHICH IS NOT A DEFECT ───────────────────────
   *
   * All three are the same thing: `testing/tour.tsx` mounts the whole app and
   * CRAWLS it — every view, every overlay, every surface a press opens, with the
   * add-ons off and on, up to a 400-render budget. That crawl is the coverage.
   * It is what reaches inside an add-on's own flow, and the three questions
   * asked of it (is everything named, does anything reach off-origin, is there a
   * Latin digit on an Arabic page) are only as wide as it is. Measured on this
   * repo: about 17 s per suite, ~40 ms per render.
   *
   * The three files run in PARALLEL, so the whole documented run is about 19 s
   * of wall clock — the cost of one crawl, not three. That is a gate a developer
   * waits for. Making the number smaller would mean crawling less, which is the
   * one saving not worth having.
   *
   * So the timeout is generous rather than tight: enough headroom for a loaded
   * CI box (3× the measured worst case), still short enough that a genuinely
   * hung test fails the run instead of hanging it. `src/sources.test.ts` asserts
   * it is still here — this is the sort of line that gets lost in a merge and is
   * missed only by whoever next runs the command as documented.
   */
  test: {
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
  build: {
    rollupOptions: {
      output: {
        /*
         * Two vendor chunks. React barely changes between releases and the
         * icon set is the biggest dependency, so splitting them keeps the app
         * chunk under Rollup's 500 kB warning and lets a browser reuse both
         * across deploys.
         */
        manualChunks(id) {
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return "react";
          if (id.includes("node_modules/lucide-react")) return "icons";
          /*
           * The three add-ons in one chunk of their own. In demo mode they are
           * compiled in and always loaded, so this is not code-splitting — it is
           * keeping the app's own bundle a readable size, and it draws the same
           * line in the build output that `src/add-ons/vendor/` draws in the
           * tree. Phase B imports these from the server by SRI hash instead, at
           * which point the chunk becomes the thing that is fetched.
           */
          if (id.includes("/src/add-ons/vendor/")) return "add-ons";
          return undefined;
        },
      },
    },
  },
};

export default defineConfig(config);
