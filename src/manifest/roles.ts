/**
 * Who may do what, enforced by Adminium on every read and write.
 *
 *   owner     everything: the dashboard section, the rate card and the
 *             catalogue, the settings, the customers, the e-mails; the
 *             works' own screens; and Holiday calendars' closed days (its
 *             settings).
 *   prepress  the works' screens, never the dashboard: the jobs and their
 *             artwork, marking the artwork checked, sending a proof (with its
 *             file) or sending one again, and putting an approved job on the
 *             press. Never a price, a customer's e-mail or address, or the
 *             settings: an order's name, which the ticket and the proof
 *             sheet say, is not personal data to Adminium.
 *   press     the works' screens: the jobs on the press, moving them through
 *             finishing to ready (and the order with its last job), and the
 *             sheets spoiled.
 *   counter   the works' screens: the orders ready to hand over, marking them
 *             collected or dispatched with the DHL service and a tracking
 *             number, pricing a delivery over the bands and sending its
 *             quote, and posting sample packs.
 *
 * Every role reads the Customiser's rows its work needs. The Customiser's
 * panels open for the roles below (`ROLE_PANELS`): a job's design for the
 * owner, prepress and the press, a product's base for the owner, drawn on the
 * works' own screens (and on the dashboard's record pages for the owner).
 * Those roles read what the panel draws a design from and write what it
 * makes: a design's version, its proof, the print files. The counter reads
 * only whether a job names a design. The owner reads Holiday calendars'
 * public holidays, to add one as a closure.
 *
 * The panel reads the customer's own words, logo and photo (the designs'
 * and versions' personal columns) and makes the files again by taking the
 * version's old files away, so its roles hold `read_pii` there and `delete`
 * on the files. The owner finds and erases a customer's data
 * (`privacy:@:people`, on the dashboard's privacy page).
 *
 * The screens show or hide a button by the role, but the grants and limits
 * below are what refuse the write: a hidden button is not a lock.
 */
import { PAGE_REFS } from "./pages.ts";
import { ROLE_PANELS } from "./panels.ts";
import { CUSTOMISER, HOLIDAYS } from "./postings.ts";
import { TABLE_REFS, TABLES } from "./tables.ts";

const grant = (table: string, ...actions: string[]) => actions.map((action) => `table:@${table}:${action}`);
const view = (page: string) => `page:@${page}:view`;
/** Seeing a table's personal columns. */
const pii = (table: string) => `table:@${table}:read_pii`;

/** The app a Customiser row belongs to, in its `app` column: a design, a version and its files, a row of the set-up. */
export const SETUP_APP = "printing";

/** The print shop's own rows of a Customiser table, by their `app`, now. */
const OWN_ROWS = { reach: "all", while: { column: "app", in: [SETUP_APP] } };
/** The starter fonts: the install's, no shop's (`app` empty, which a value limit cannot name), found by `starter`. */
const STARTER_ROWS = { reach: "all", while: { column: "starter", in: [true] } };

/** The set-up's tables, as the panel draws a design from them. */
const SET_UP_TABLES = ["bases", "ready_designs", "ready_parts", "base_areas", "base_pieces", "palettes", "palette_colours", "fonts", "features"];

/**
 * What the Customiser's panel on a job reads to draw the design as it will be
 * printed (its ready-made design and parts, the base's areas and pieces, the
 * palettes, colours and fonts, the settings' one-colour line), and what it
 * writes when the proof and the print files are made: a version of the design
 * where none was ordered yet, the proof file on it, and the files of the
 * version. The panel makes them in the browser and saves them as the person
 * signed in. With the Maker Shop on the same install, only the print shop's
 * customers' designs and versions are there to them (`ownPanel` in the
 * Customiser), and a version they add is the print shop's.
 */
const CUSTOMISER_PANEL = [
  { addOn: CUSTOMISER, table: "designs", actions: ["read", "read_pii"], limit: { rows: { read: OWN_ROWS } } },
  {
    addOn: CUSTOMISER,
    table: "design_versions",
    actions: ["read", "read_pii", "create", "update"],
    // The proof is the version's one column the panel writes: the rest the order's posting copied, and stays as copied.
    limit: { creatable: ["app", "design_id", "version", "values"], creatableValues: { app: [SETUP_APP] }, writable: ["proof_file"], rows: { read: OWN_ROWS, update: OWN_ROWS } },
  },
  {
    addOn: CUSTOMISER,
    table: "version_files",
    actions: ["read", "create", "update", "delete"],
    limit: { creatable: ["app", "version_id", "kind", "name", "about", "layers", "left_out", "position"], creatableValues: { app: [SETUP_APP] }, writable: ["file"], rows: { read: OWN_ROWS, update: OWN_ROWS, delete: OWN_ROWS } },
  },
  ...SET_UP_TABLES.map((table) => ({ addOn: CUSTOMISER, table, actions: ["read"] })),
  // The shop's settings: the one-colour line a proof is drawn to, the bleed and the least resolution.
  { addOn: CUSTOMISER, table: "settings", actions: ["read"] },
];

/**
 * The Customiser's tables its set-up page (the bases and their areas and
 * pieces, the ready-made designs and their parts, fonts, palettes and their
 * colours, priced features) adds to, and the columns a new row is given:
 * every column of the row, the app it belongs to beside them. The same lists
 * as the add-on's `appGrants`, so the install keeps nothing back. A row
 * changed keeps its app, and a font whether it is a starter (`NOT_CHANGED`).
 */
export const SETUP_COLUMNS: Record<string, string[]> = {
  bases: ["name", "kind", "width_mm", "height_mm", "depth_mm", "corner_mm", "bleed_mm", "safe_mm", "sides", "back_feature_id", "material", "thickness_mm", "outline_file", "model_file", "print_file", "faces", "offered", "state", "position"],
  base_pieces: ["base_id", "code", "name", "width_mm", "height_mm", "layers", "left_out", "file", "position"],
  base_areas: ["base_id", "code", "name", "side", "piece_id", "face", "shape", "x_mm", "y_mm", "w_mm", "h_mm", "takes", "required", "rules", "feature_id", "position"],
  ready_designs: ["base_id", "name", "tags", "layouts", "state", "preview_file", "position"],
  ready_parts: ["ready_design_id", "code", "name", "kind", "locked", "required", "side", "layout", "area_id", "piece_id", "x_mm", "y_mm", "w_mm", "h_mm", "rules", "value", "feature_id", "position"],
  fonts: ["family", "name", "style", "weights", "licence", "starter", "smallest_mm", "file", "active"],
  palettes: ["ready_design_id", "kind", "code", "name", "position"],
  palette_colours: ["palette_id", "code", "role", "name", "hex", "position"],
  features: ["code", "name", "active"],
};
/** Columns a new row is given and a change never moves: whether a font is one of the install's starters. */
export const NOT_CHANGED: Record<string, string[]> = { fonts: ["starter"] };
/** The columns the owner changes on a set-up table. */
export const setUpWritable = (table: string): string[] => SETUP_COLUMNS[table]!.filter((column) => !(NOT_CHANGED[table] ?? []).includes(column));

/**
 * The owner's hold on one set-up table, as the Customiser's `ownSetUp`
 * writes it (add-ons 1.0.23): a row they add is the print shop's own, and
 * never a starter font; they read, change and remove only the print shop's
 * own rows, never another shop's (to them it is not there). The starter
 * fonts are read and changed too, so the set-up still gives them their
 * files, and never removed. A base is never removed.
 */
export function setUpGrant(table: string): Record<string, unknown> {
  const actions = table === "bases" ? ["read", "create", "update"] : ["read", "create", "update", "delete"];
  const mine = table === "fonts" ? [OWN_ROWS, STARTER_ROWS] : OWN_ROWS;
  return {
    addOn: CUSTOMISER,
    table,
    actions,
    limit: {
      creatable: ["app", ...SETUP_COLUMNS[table]!],
      creatableValues: table === "fonts" ? { app: [SETUP_APP], starter: [false] } : { app: [SETUP_APP] },
      writable: setUpWritable(table),
      rows: { read: mine, update: mine, ...(actions.includes("delete") ? { delete: OWN_ROWS } : {}) },
    },
  };
}

/**
 * The Customiser's settings the owner changes on the set-up page's Shop
 * settings (add-ons 1.0.23): the bleed and safe area, the one-colour line,
 * the thinnest line and the least resolution.
 */
export const SETTINGS_COLUMNS = ["default_bleed_mm", "default_safe_mm", "one_colour_threshold", "smallest_line_mm", "min_dpi"];

/**
 * The owner's: the panel's (they make a job's proof and print files too), and
 * everything the Customiser's set-up page reads and writes, its settings
 * among them. From add-ons 1.0.21 the Customiser lets an app's role hold all
 * of it (its `appGrants`), so the owner opens and saves the set-up page on
 * their own role, no Customiser role beside it. Thirteen of the Customiser's
 * tables, within the 24 add-on tables a role holds.
 */
const CUSTOMISER_SETUP = [
  ...CUSTOMISER_PANEL.filter((entry) => !SET_UP_TABLES.includes(entry.table) && entry.table !== "settings"),
  ...SET_UP_TABLES.map(setUpGrant),
  { addOn: CUSTOMISER, table: "settings", actions: ["read", "update"], limit: { writable: SETTINGS_COLUMNS } },
];

/** The rules by which Adminium decides a column: nobody writes one, whatever their role. */
export const DECIDING_RULES = ["rollup", "formula", "copy", "band", "stamp", "sequence", "format", "code", "lookup"] as const;

/** Columns Adminium decides. */
const decided = (ref: string): Set<string> =>
  new Set(
    TABLES.find((t) => t.ref === ref)!
      .columns.filter((c) => {
        const rules = c.rules ?? {};
        return c.ref === "id" || DECIDING_RULES.some((rule) => rules[rule] !== undefined);
      })
      .map((c) => c.ref),
  );
const typed = (ref: string, ...leaveOut: string[]): string[] =>
  TABLES.find((t) => t.ref === ref)!
    .columns.map((c) => c.ref)
    .filter((c) => !decided(ref).has(c) && !leaveOut.includes(c));

/** What only the customer gives, on their own order or quote: the tick for the works' news, the link, the retry key. */
export const CUSTOMERS_OWN = ["may_email", "link_token", "client_key"];

/** The rate card and the catalogue: every role reads them, the owner alone edits them. */
const RATE_CARD = ["settings", "materials", "sizes", "finishes", "breaks", "packaging", "delivery_bands", "products", "options", "option_rules", "machines", "closures"];
const ORDER_READS = ["orders", "jobs", "job_features", "artwork", "proofs", "spoils"];

/** What every role reads of Inventory, when it keeps the stock: which item a material is, and its stock. */
const STOCK_READS = [
  { addOn: "inventory", table: "links", actions: ["read"] },
  { addOn: "inventory", table: "stock_points", actions: ["read"] },
];
/** What the owner and the counter read of DHL, when it is on: the collections it booked. */
const SHIPMENT_READS = [{ addOn: "shipping-dhl", table: "shipments", actions: ["read"] }];
/** What the owner reads of Holiday calendars, when it is on: the public holidays, each to add as a closure. */
const HOLIDAY_READS = [{ addOn: HOLIDAYS, table: "holidays", actions: ["read"] }];

/** The works' screens open records on these pages. */
export const WORKS_PAGES = ["printing-orders", "printing-jobs", "printing-proofs", "printing-artwork", "printing-samples"];

export const ROLES = [
  {
    key: "owner",
    name: "Owner",
    permissions: [
      "app:@:staff",
      ...TABLE_REFS.flatMap((table) =>
        // The e-mails are the works' record of what was sent: nobody deletes from it.
        table === "messages" ? grant(table, "read", "create", "update") : grant(table, "read", "create", "update", "delete"),
      ),
      ...PAGE_REFS.flatMap((page) => [view(page), `page:@${page}:edit`]),
      ...["orders", "customers", "saved_quotes", "sample_requests", "messages"].map(pii),
      // The Customiser's set-up page (fonts, palettes, ready-made designs): the works' Designs opens it.
      view(CUSTOMISER),
      // Holiday calendars' one setting, the days the works is closed: the owner's to keep, not only an administrator's.
      `addOn:${HOLIDAYS}:settings`,
      // A customer's data found, handed to them and erased, on the dashboard's privacy page.
      "privacy:@:people",
    ],
    limits: {
      orders: { writable: typed("orders", ...CUSTOMERS_OWN), creatable: typed("orders", ...CUSTOMERS_OWN) },
      saved_quotes: { writable: typed("saved_quotes", ...CUSTOMERS_OWN), creatable: typed("saved_quotes", ...CUSTOMERS_OWN) },
    },
    tables: [...CUSTOMISER_SETUP, ...STOCK_READS, ...SHIPMENT_READS, ...HOLIDAY_READS],
  },
  {
    key: "prepress",
    name: "Prepress",
    screensOnly: true,
    permissions: [
      "app:@:staff",
      ...[...RATE_CARD, ...ORDER_READS].flatMap((table) => grant(table, "read")),
      ...grant("jobs", "update"),
      // A proof sent again is a new one: Adminium sends the job's earlier one again in the same write (`states.supersedes`), so prepress changes no proof.
      ...grant("proofs", "create"),
      view("printing-orders"),
      view("printing-jobs"),
      view("printing-proofs"),
      view("printing-artwork"),
      // The Customiser's set-up page: never opened from the works' screens, but the starter fonts the panel prints with are handed out beside it.
      view(CUSTOMISER),
    ],
    limits: {
      // The artwork looked over, and an approved job onto the press.
      jobs: { writable: ["artwork_checked", "stage", "works_note"], writableValues: { stage: ["printing"] }, writableFrom: { stage: ["prepress"] } },
      // A proof: the job, its file, how it is sent, the note and the design version it shows.
      proofs: { creatable: ["job_id", "kind", "file", "design_version_id", "note"] },
    },
    tables: [...CUSTOMISER_PANEL, ...STOCK_READS],
  },
  {
    key: "press",
    name: "Press",
    screensOnly: true,
    permissions: [
      "app:@:staff",
      ...[...RATE_CARD, ...ORDER_READS].flatMap((table) => grant(table, "read")),
      ...grant("jobs", "update"),
      ...grant("spoils", "create"),
      ...grant("orders", "update"),
      view("printing-jobs"),
      // The starter fonts the panel prints with, handed out beside the Customiser's set-up page.
      view(CUSTOMISER),
    ],
    limits: {
      jobs: { writable: ["stage", "works_note"], writableValues: { stage: ["finishing", "ready"] }, writableFrom: { stage: ["printing", "finishing"] } },
      // Sheets spoiled on a job's run, with a note.
      spoils: { creatable: ["job_id", "qty", "note"] },
      // The order ready to hand over, once its last job is.
      orders: { writable: ["status"], writableValues: { status: ["ready"] }, writableFrom: { status: ["placed"] } },
    },
    tables: [...CUSTOMISER_PANEL, ...STOCK_READS],
  },
  {
    key: "counter",
    name: "Counter",
    screensOnly: true,
    permissions: [
      "app:@:staff",
      ...[...RATE_CARD, ...ORDER_READS, "sample_requests"].flatMap((table) => grant(table, "read")),
      pii("orders"),
      pii("sample_requests"),
      ...grant("orders", "update"),
      ...grant("jobs", "update"),
      ...grant("sample_requests", "update"),
      view("printing-orders"),
      view("printing-jobs"),
      view("printing-samples"),
    ],
    limits: {
      // Ready, then handed over; a delivery over the bands priced and its quote sent (fixed once the customer accepts it).
      orders: {
        writable: ["status", "tracking", "dhl_service", "delivery_quote", "delivery_quote_state"],
        writableValues: { status: ["ready", "collected", "dispatched"], delivery_quote_state: ["to_quote", "sent"] },
      },
      jobs: { writable: ["stage"], writableValues: { stage: ["collected", "dispatched"] }, writableFrom: { stage: ["ready"] } },
      sample_requests: { writable: ["status"], writableValues: { status: ["posted"] } },
    },
    // Whether a job names a design, of the print shop's customers alone.
    tables: [{ addOn: CUSTOMISER, table: "designs", actions: ["read"], limit: { rows: { read: OWN_ROWS } } }, ...STOCK_READS, ...SHIPMENT_READS],
  },
];

export { ROLE_PANELS };

/** The roles as a manifest at `floor` writes them: the panels' grants need the release that reads them. */
export function rolesFor(panels: boolean): typeof ROLES {
  if (!panels) return ROLES;
  return ROLES.map((role) => ({ ...role, permissions: [...role.permissions, ...(ROLE_PANELS[role.key] ?? []).map(view)] }));
}
