/**
 * Which Adminium the shop talks to, and with which keys.
 *
 * In order:
 *   1. a build that baked `VITE_ADMINIUM_API_BASE_URL` and
 *      `VITE_ADMINIUM_PUBLISHABLE_KEY` (a shop served on its own) uses them,
 *      with `VITE_ADMINIUM_ORDER_KEY` and `VITE_ADMINIUM_DESIGN_KEY` for the
 *      order's and the design's own links where it has them;
 *   2. the shop Adminium serves (`/apps/printing/customer/`) asks for
 *      `surface-config.json` beside itself: the newest key bound to the app,
 *      the tables' real names and the other keys by purpose;
 *   3. neither: null, and the page says the shop is not connected.
 */
import type { ShopServed } from "./door.ts";

/**
 * Where to ask for the config document: the app's own mount, a database's
 * mount (its name before the side), or `/` on a domain of the shop's own.
 */
export function configBase(bakedBase: string, pathname: string): string {
  const baked = bakedBase.endsWith("/") ? bakedBase : `${bakedBase}/`;
  const b = baked.split("/").filter((p) => p !== "");
  if (b.length !== 3 || b[0] !== "apps") return baked;
  const [, appKey, side] = b;
  const parts = pathname.split("/").filter((p) => p !== "");
  const [root, app, slug, foundSide] = parts;
  if (root === "apps" && app === appKey && slug === side) return baked;
  if (parts.length >= 4 && root === "apps" && app === appKey && foundSide === side && slug !== undefined && slug !== "staff" && slug !== "customer") {
    return `/apps/${appKey}/${slug}/${side}/`;
  }
  if (root !== "apps") return "/";
  return baked;
}

/** A map of strings to strings, or null: anything else is ignored. */
function strings(value: unknown): Record<string, string> | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) if (typeof v === "string" && v !== "") out[k] = v;
  return Object.keys(out).length === 0 ? null : out;
}

export interface ResolveOptions {
  baked?: { baseUrl?: string; publishableKey?: string; orderKey?: string; designKey?: string };
  hosted?: boolean;
  base?: string;
  pathname?: string;
  origin?: string;
  fetchImpl?: typeof fetch;
}

export async function resolveShop(opts: ResolveOptions = {}): Promise<ShopServed | null> {
  const env = import.meta.env as Record<string, string | undefined>;
  const baked = opts.baked ?? {
    baseUrl: env["VITE_ADMINIUM_API_BASE_URL"],
    publishableKey: env["VITE_ADMINIUM_PUBLISHABLE_KEY"],
    orderKey: env["VITE_ADMINIUM_ORDER_KEY"],
    designKey: env["VITE_ADMINIUM_DESIGN_KEY"],
  };
  if (baked.baseUrl && baked.publishableKey) {
    const publicKeys: Record<string, string> = {};
    if (baked.orderKey) publicKeys["order"] = baked.orderKey;
    if (baked.designKey) publicKeys["customiser-link"] = baked.designKey;
    return { baseUrl: baked.baseUrl, publishableKey: baked.publishableKey, publicKeys };
  }
  if (opts.hosted === false) return null;
  const base = opts.base ?? configBase(import.meta.env.BASE_URL, opts.pathname ?? window.location.pathname);
  try {
    const res = await (opts.fetchImpl ?? fetch)(`${base}surface-config.json`, { cache: "no-store" });
    if (!res.ok) return null;
    const doc = (await res.json()) as Record<string, unknown> | null;
    if (doc === null || typeof doc !== "object") return null;
    const key = doc["publishableKey"];
    if (typeof key !== "string" || key === "") return null;
    const served = doc["baseUrl"];
    const tables = strings(doc["tables"]);
    const publicKeys = strings(doc["publicKeys"]);
    return {
      baseUrl: typeof served === "string" && served !== "" ? served : (opts.origin ?? window.location.origin),
      publishableKey: key,
      ...(tables === null ? {} : { tables }),
      ...(publicKeys === null ? {} : { publicKeys }),
    };
  } catch {
    // No answer, or the page's own HTML answered for the document: not configured.
    return null;
  }
}
