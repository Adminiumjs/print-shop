/**
 * The public API's names for the shop's entries.
 *
 * Adminium names each entry of the manifest's `publicAccess` when it installs
 * the app: the table's real name, a suffix for what the entry is, and `_2`
 * for the second of the same. The table's real name is the one the server
 * sends in `surface-config.json` (`orders` → `printing_orders`); the suffixes
 * are the manifest's, written out in `PUBLIC_REFS` and held to the entries by
 * the manifest's drift test. `door.test.ts` holds this table to that one.
 */

/** Each entry the shop's pages call: the table, and its suffix. */
export const SHOP_REFS = {
  products: ["products", ""],
  options: ["options", ""],
  materials: ["materials", ""],
  sizes: ["sizes", ""],
  finishes: ["finishes", ""],
  breaks: ["breaks", ""],
  packaging: ["packaging", ""],
  deliveryBands: ["delivery_bands", ""],
  optionRules: ["option_rules", ""],
  settings: ["settings", ""],
  placeOrder: ["orders", "_verified_2"],
  orderByLink: ["orders", "_claimed"],
  saveQuote: ["saved_quotes", "_verified_2"],
  samplePack: ["sample_requests", ""],
} as const satisfies Record<string, readonly [string, string]>;

export type ShopRefName = keyof typeof SHOP_REFS;
export type ShopRefs = Record<ShopRefName, string>;

/** The app's key, which names its tables when the server does not say (`printing_orders`). */
export const APP_KEY = "printing";

/** Every ref by its real name, from the server's table names. */
export function shopRefs(tables: Readonly<Record<string, string>> = {}): ShopRefs {
  const out = {} as ShopRefs;
  for (const [name, [table, suffix]] of Object.entries(SHOP_REFS) as [ShopRefName, readonly [string, string]][]) {
    out[name] = `${tables[table] ?? `${APP_KEY}_${table}`}${suffix}`;
  }
  return out;
}

/** The artwork column a guest uploads into, under the order's entry: a job's artwork row's file. */
export const ARTWORK_COLUMN = "jobs.artwork.file";

/** The browser keys the shop uses beside its own, by the purpose Adminium serves them under. */
export const KEYS = {
  /** One order, by its own link (the manifest's `order` key). */
  order: "order",
  /** A saved design, by its own link: the Customiser's. */
  design: "customiser-link",
  /** One saved quote, by its own link (the manifest's `quote` key). */
  quote: "quote",
} as const;
