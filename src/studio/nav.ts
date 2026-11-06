/**
 * The works' screens with an address of their own, as data: the staff build
 * routes by them (`urlSync.ts`), Adminium's sidebar offers them
 * (`surface.json`), and the works' own sidebar lists them. Labels are message
 * keys every locale carries. A job's ticket opens over the board and keeps
 * the board's address; Shipments shows only while a delivery company is on.
 */
import type { MessageKey } from "../i18n/messages/index.ts";
import type { SurfaceNavEntry } from "../surface-types.ts";
import type { View } from "./view.ts";

export const APP_KEY = "printing";

export type WorksNavEntry = SurfaceNavEntry<View> & { labelKey: MessageKey; icon: string };

export const WORKS_NAV = [
  { id: "today", path: "", view: "today", side: "staff", icon: "layout-grid", labelKey: "works.nav.today" },
  { id: "jobs", path: "jobs", view: "jobs", side: "staff", icon: "list", labelKey: "works.nav.jobs" },
  { id: "materials", path: "materials", view: "materials", side: "staff", icon: "layers", labelKey: "works.nav.materials" },
  { id: "prices", path: "prices", view: "prices", side: "staff", icon: "receipt-text", labelKey: "works.nav.prices" },
  { id: "shipments", path: "shipments", view: "shipments", side: "staff", icon: "package", labelKey: "works.nav.shipments" },
  { id: "addons", path: "add-ons", view: "addons", side: "staff", icon: "puzzle", labelKey: "works.nav.addOns" },
] as const satisfies readonly WorksNavEntry[];

/**
 * The works' screens with an address but no sidebar item of their own: the
 * ticket and the dispatch page under Today, an add-on's page and the
 * add-ons' activity under Add-ons.
 */
export const WORKS_PLACES = [
  { id: "ticket", path: "job", view: "ticket", side: "staff", icon: "clipboard-list", labelKey: "works.ticket.title" },
  { id: "dispatch", path: "dispatch", view: "dispatch", side: "staff", icon: "truck", labelKey: "works.dispatch.title" },
  { id: "addon", path: "add-on", view: "addon", side: "staff", icon: "puzzle", labelKey: "works.addOn.title" },
  { id: "activity", path: "add-ons/activity", view: "activity", side: "staff", icon: "history", labelKey: "works.activity.title" },
] as const satisfies readonly WorksNavEntry[];

/** The sidebar item a screen lights: a ticket under Today, an add-on's page under Add-ons. */
export function navOf(view: View): string {
  if (view === "ticket" || view === "dispatch") return "today";
  if (view === "addon" || view === "activity") return "addons";
  return view;
}
