import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
// `base` defaults to "/" (root deploy on Vercel / DigitalOcean). The
// `build:demo` script overrides it with --base=/demo/print-shop/ so the app
// can be served from the Adminium demo sub-path.
export default defineConfig({
  plugins: [react()],
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
});
