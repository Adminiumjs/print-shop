/**
 * The app's screens, as data, for `surface.json`: the file each surface
 * build writes beside its `index.html`, which Adminium reads to list the
 * app's sections. Each side's entries come from that side's own module.
 *
 * Icons are lucide NAMES in kebab-case, never imported components: this
 * module is read by the Vite config.
 */
import type { MessageKey } from "./i18n/messages/index.ts";
import { SHOP_NAV } from "./shop/nav.ts";
import { WORKS_NAV } from "./studio/nav.ts";

export const APP_KEY = "printing";

/** The app's name, as the sidebar heads its section. */
export const APP_LABEL_KEY: MessageKey = "chrome.brand";

export const SURFACE_NAV = [...SHOP_NAV, ...WORKS_NAV] as const;
