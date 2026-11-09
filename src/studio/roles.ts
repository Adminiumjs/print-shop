/**
 * What each of the app's roles does on the floor, as the manifest's limits
 * say it (`manifest/roles.ts`): the screens offer only the moves a person's
 * role makes, and Adminium refuses the rest anyway. `roles.test.ts` holds
 * this to the manifest.
 *
 *   owner     every move the job's states have, the way back included
 *   prepress  an approved job onto the press
 *   press     the press through finishing to ready
 *   counter   a ready job handed over: collected, or dispatched
 */
import type { Person } from "./door.ts";
import { ROLE_PANELS, type PanelId } from "../manifest/panels.ts";

/** The moves a job's stage takes (`jobs.states.moves`), with the owner's way back. */
export const JOB_MOVES: Readonly<Record<string, readonly string[]>> = {
  prepress: ["printing", "cancelled"],
  printing: ["finishing", "ready", "prepress"],
  finishing: ["ready", "printing"],
  ready: ["collected", "dispatched", "finishing"],
};

/** The moves only the owner makes: a job taken back a stage. */
export const OWNER_ONLY: Readonly<Record<string, readonly string[]>> = {
  printing: ["prepress"],
  finishing: ["printing"],
  ready: ["finishing"],
};

/** What each role other than the owner may move a job to, from where. */
export const ROLE_MOVES: Readonly<Record<string, Readonly<Record<string, readonly string[]>>>> = {
  prepress: { prepress: ["printing"] },
  press: { printing: ["finishing", "ready"], finishing: ["ready"] },
  counter: { ready: ["collected", "dispatched"] },
};

export const isOwner = (who: Person): boolean => who.roles.includes("owner");

/** The stages this person may move a job to straight from `from`. */
export function movesFor(who: Person, from: string): string[] {
  const all = JOB_MOVES[from] ?? [];
  if (!who.can("jobs", "update")) return [];
  if (isOwner(who) || who.roles.length === 0) return [...all];
  const mine = new Set(who.roles.flatMap((role) => ROLE_MOVES[role]?.[from] ?? []));
  return all.filter((to) => mine.has(to));
}

/** Whether this person hands work over at the counter: collected, dispatched, a delivery priced. */
export const mayHandOver = (who: Person): boolean => isOwner(who) || who.roles.includes("counter") || who.roles.length === 0;

/** Whether this person edits the rate card. */
export const mayEditRates = (who: Person): boolean => who.can("materials", "update") && who.can("settings", "update");

/** Whether this person looks after the add-ons (the shelf is theirs). */
export const mayManageAddOns = (who: Person): boolean => isOwner(who) || who.roles.length === 0;

/**
 * Whether this person opens one of the Customiser's panels on the works'
 * screens: their role holds it (`ROLE_PANELS`). Adminium serves the panel's
 * code only to a role that holds it; this keeps the way to it off the screen
 * of anyone else.
 */
export const mayOpenPanel = (who: Person, panel: PanelId): boolean => who.roles.length === 0 || who.roles.some((role) => ROLE_PANELS[role]?.includes(panel) === true);

/** Whether this person sets up the Customiser (its fonts, palettes, ready-made designs): the owner, whose role opens its page. */
export const maySetUpDesigns = (who: Person): boolean => isOwner(who) || who.roles.length === 0;

/** Whether this person finds and erases a customer's data on the dashboard's privacy page: the owner, whose role holds it. */
export const mayErase = (who: Person): boolean => isOwner(who) || who.roles.length === 0;

/** The add-ons' tables the works' screens read, as `<add-on>:<table>`. */
export const SCREEN_ADD_ON_READS = [
  "customiser:designs",
  "customiser:design_versions",
  "customiser:version_files",
  "inventory:links",
  "inventory:stock_points",
  // What the delivery company attached booked: its shipments, whichever add-on it is.
  "carrier:shipments",
  "holiday-calendars:holidays",
] as const;
export type ScreenAddOnRead = (typeof SCREEN_ADD_ON_READS)[number];

/**
 * Which of them each role reads: its grants on the add-ons' tables
 * (`roles[].tables` in the manifest; `roles.test.ts` holds this to it). The
 * screens never ask for a read the role is not given, which Adminium would
 * refuse: the counter reads whether a job names a design but none of its
 * versions, and only the owner reads Holiday calendars' public holidays.
 */
export const ADD_ON_READS: Readonly<Record<string, readonly ScreenAddOnRead[]>> = {
  owner: [...SCREEN_ADD_ON_READS],
  prepress: ["customiser:designs", "customiser:design_versions", "customiser:version_files", "inventory:links", "inventory:stock_points"],
  press: ["customiser:designs", "customiser:design_versions", "customiser:version_files", "inventory:links", "inventory:stock_points"],
  counter: ["customiser:designs", "inventory:links", "inventory:stock_points", "carrier:shipments"],
};

/** Whether this person's role reads an add-on's table (somebody with none of the app's roles, an administrator, reads every one). */
export const mayReadAddOn = (who: Person, table: ScreenAddOnRead): boolean => who.roles.length === 0 || who.roles.some((role) => ADD_ON_READS[role]?.includes(table) === true);
