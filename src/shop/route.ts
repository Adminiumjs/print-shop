/**
 * The shop's address bar: which path shows which screen, both ways.
 *
 * Paths are relative to where the shop is served (`/apps/printing/customer/`
 * hosted, `/` on its own domain or standalone), so the same bundle reads the
 * same paths wherever it is placed. A product's page carries its code
 * (`product/business-cards`), and the Customiser's two ways in one more step
 * (`product/business-cards/design`, `product/business-cards/blank`).
 */
import type { ShopView } from "./store.ts";

/** The screens other parts of the shop draw, by their path, with the manifest's route keys. */
export const ELSEWHERE = {
  order: "order",
  find: "find",
  reorder: "reorder",
  proofs: "proofs",
  quotes: "quotes",
  quote: "quote",
  samples: "samples",
  templates: "templates",
  delivery: "delivery",
  findUs: "find-us",
  savedDesign: "design",
} as const;
export type Elsewhere = keyof typeof ELSEWHERE;

export interface Place {
  view: ShopView | Elsewhere;
  code: string | null;
}

/** The part of a page's path the shop reads: what follows its own mount. */
export function relativePath(pathname: string, base: string): string {
  const clean = (base.endsWith("/") ? base : `${base}/`).replace(/^\/*/, "/");
  if (pathname.startsWith(clean)) return pathname.slice(clean.length);
  // Mounted for one of several databases, a name before the side: `/apps/printing/<name>/customer/…`.
  const side = /^\/apps\/[^/]+\/(?:[^/]+\/)?customer\/(.*)$/.exec(pathname);
  if (side !== null) return side[1] ?? "";
  return pathname.replace(/^\/+/, "");
}

export function placeOf(relative: string): Place {
  const parts = relative.split("/").filter((p) => p !== "").map((p) => decodeURIComponent(p));
  if (parts.length === 0) return { view: "products", code: null };
  const [first, code, more] = parts;
  // `/product` alone (the manifest's product route, with no product named): the products.
  if (first === "product" && code === undefined) return { view: "products", code: null };
  if (first === "product" && code !== undefined) {
    if (more === undefined) return { view: "product", code };
    if ((more === "design" || more === "blank") && parts.length === 3) return { view: more, code };
  }
  if (parts.length === 1) {
    if (first === "artwork") return { view: "artwork", code: null };
    if (first === "basket") return { view: "basket", code: null };
    if (first === "confirmed") return { view: "confirmed", code: null };
    const elsewhere = (Object.entries(ELSEWHERE) as [Elsewhere, string][]).find(([, path]) => path === first);
    if (elsewhere !== undefined) return { view: elsewhere[0], code: null };
  }
  return { view: "missing", code: null };
}

export function pathOf(place: Place): string {
  switch (place.view) {
    case "products":
    case "missing":
      return "";
    case "product":
      return `product/${encodeURIComponent(place.code ?? "")}`;
    case "design":
    case "blank":
      return `product/${encodeURIComponent(place.code ?? "")}/${place.view}`;
    case "artwork":
    case "basket":
    case "confirmed":
      return place.view;
    default:
      return ELSEWHERE[place.view];
  }
}

/** The mount the shop is served at: Vite's base, as built. */
export function mountBase(): string {
  return import.meta.env.BASE_URL ?? "/";
}

/** The page's mount as the address bar shows it (a mount for one database keeps its name). */
function liveBase(pathname: string, base: string): string {
  const clean = base.endsWith("/") ? base : `${base}/`;
  if (pathname.startsWith(clean)) return clean;
  const side = /^(\/apps\/[^/]+\/(?:[^/]+\/)?customer\/)/.exec(pathname);
  return side?.[1] ?? clean;
}

/**
 * Keep the address and the screen together: a move writes the path, the
 * back button reads it. `go` opens the screen a path names.
 */
export function attachShopUrl(go: (place: Place) => void): { push: (place: Place) => void; current: () => Place; detach: () => void } {
  const base = () => liveBase(window.location.pathname, mountBase());
  const current = () => placeOf(relativePath(window.location.pathname, mountBase()));
  const onPop = () => go(current());
  window.addEventListener("popstate", onPop);
  return {
    current,
    push(place) {
      const path = `${base()}${pathOf(place)}`;
      if (path === window.location.pathname) return;
      window.history.pushState(window.history.state, "", path);
    },
    detach: () => window.removeEventListener("popstate", onPop),
  };
}
