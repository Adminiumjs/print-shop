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
