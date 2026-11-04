/**
 * The shop's start: find the Adminium it talks to, open its door, and draw
 * the customer's side. A build with nowhere to reach says so and stops; it
 * never shows invented rows.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./shop.css";

import { I18nProvider } from "../i18n/index.tsx";
import { AdminiumShop } from "./door.ts";
import { resolveShop } from "./served.ts";
import ShopApp from "./ShopApp.tsx";
import { useShop } from "./store.ts";

function notConnected(mount: HTMLElement): void {
  mount.innerHTML = "";
  const box = document.createElement("div");
  box.setAttribute("role", "alert");
  box.className = "mp-unconnected";
  const h = document.createElement("h1");
  h.textContent = "This shop is not connected";
  const p = document.createElement("p");
  p.textContent = "It needs a key bound to it in Adminium (or VITE_ADMINIUM_PUBLISHABLE_KEY and VITE_ADMINIUM_API_BASE_URL baked into a build of its own).";
  box.append(h, p);
  mount.append(box);
}

export async function bootShop(mount: HTMLElement): Promise<void> {
  const served = await resolveShop();
  if (served === null) {
    notConnected(mount);
    return;
  }
  useShop.setState({ port: new AdminiumShop(served) });
  createRoot(mount).render(
    <StrictMode>
      <I18nProvider>
        <ShopApp />
      </I18nProvider>
    </StrictMode>,
  );
}
