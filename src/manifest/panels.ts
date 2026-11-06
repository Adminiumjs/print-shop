/**
 * The Customiser's record panels, and which of the app's roles opens each.
 *
 * Its own small file because two halves read it: the manifest grants each
 * role the panels' view permission (`roles.ts`), and the works' screens show
 * a panel, and the way to it, only to a role that holds it. The grant is the
 * lock (Adminium serves a panel's code only to a role holding it); the
 * screens follow it so nobody is shown a button that opens nothing.
 */

/** The panel on a job (the customer's design, its proof and its print files) and the one on a product (its base). */
export type PanelId = "customiser-line" | "customiser-product";

/** The Customiser's record panels each role opens: the design on a job, the base on a product. */
export const ROLE_PANELS: Readonly<Record<string, readonly PanelId[]>> = {
  owner: ["customiser-line", "customiser-product"],
  prepress: ["customiser-line"],
  press: ["customiser-line"],
};
