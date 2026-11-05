/*
 * Entry point: which of the app's starts this bundle runs.
 *
 *   the customer build   the shop, on the key Adminium binds to it;
 *   the staff build      the works' own screens, on the signed-in person's
 *                        session;
 *   the demo build       both, side by side over one Marlow Press held in
 *                        the page, for the website's demo card;
 *   a connected build    the shop on its own domain, on the address and key
 *                        baked in (`VITE_ADMINIUM_API_BASE_URL` and
 *                        `VITE_ADMINIUM_PUBLISHABLE_KEY`).
 *
 * Each start is a dynamic import behind a flag `surface.ts` folds at build
 * time, so a bundle carries only its own: no surface build holds the
 * demo's Marlow Press, and the demo holds no session transport.
 *
 * The two stylesheets are the tokens both sides draw with and the reset
 * under them, first, so every side's own sheet wins a tie.
 */

import "./styles/tokens.css";
import "./styles/base.css";

import { DEMO, SURFACE_SIDE } from "./surface.ts";

const container = document.getElementById("root");
if (!container) throw new Error("Missing #root — check index.html");

async function boot(mount: HTMLElement): Promise<void> {
  if (SURFACE_SIDE === "staff") {
    const { bootWorks } = await import("./studio/boot.tsx");
    await bootWorks(mount);
    return;
  }
  if (DEMO) {
    const { bootDemo } = await import("./demo/boot.tsx");
    await bootDemo(mount);
    return;
  }
  const { bootShop } = await import("./shop/boot.tsx");
  await bootShop(mount);
}

void boot(container);
