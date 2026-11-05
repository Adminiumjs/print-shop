/**
 * Who may do what, enforced by Adminium on every read and write.
 *
 *   owner     everything: the dashboard section, the rate card and the
 *             catalogue, the settings, the customers, the e-mails; and the
 *             works' own screens.
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
 * Every role reads the Customiser's rows its work needs: the design a job
 * names, its versions and files. The Customiser's panels on a record page
 * open for the roles below (`ROLE_PANELS`): a job's design for the owner,
 * prepress and the press, a product's base for the owner. Adminium reads that
 * grant from 0.3.44; on an older floor the panels open only for a person who
 * also holds one of the Customiser's own roles. The owner reads Holiday
 * calendars' public holidays, to add one as a closure.
 *
 * The screens show or hide a button by the role, but the grants and limits
 * below are what refuse the write: a hidden button is not a lock.
 */
import { PAGE_REFS } from "./pages.ts";
import { CUSTOMISER, HOLIDAYS } from "./postings.ts";
import { TABLE_REFS, TABLES } from "./tables.ts";

const grant = (table: string, ...actions: string[]) => actions.map((action) => `table:@${table}:${action}`);
const view = (page: string) => `page:@${page}:view`;
/** Seeing a table's personal columns. */
const pii = (table: string) => `table:@${table}:read_pii`;

/** What the works reads of the Customiser: the design a job names, its versions and files, a product's base. */
const CUSTOMISER_READS = [
  { addOn: CUSTOMISER, table: "designs", actions: ["read"] },
  { addOn: CUSTOMISER, table: "design_versions", actions: ["read"] },
  { addOn: CUSTOMISER, table: "version_files", actions: ["read"] },
  { addOn: CUSTOMISER, table: "bases", actions: ["read"] },
  { addOn: CUSTOMISER, table: "features", actions: ["read"] },
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
    ],
    limits: {
      orders: { writable: typed("orders", ...CUSTOMERS_OWN), creatable: typed("orders", ...CUSTOMERS_OWN) },
      saved_quotes: { writable: typed("saved_quotes", ...CUSTOMERS_OWN), creatable: typed("saved_quotes", ...CUSTOMERS_OWN) },
    },
    tables: [...CUSTOMISER_READS, ...STOCK_READS, ...SHIPMENT_READS, ...HOLIDAY_READS],
  },
  {
    key: "prepress",
    name: "Prepress",
    screensOnly: true,
    permissions: [
      "app:@:staff",
      ...[...RATE_CARD, ...ORDER_READS].flatMap((table) => grant(table, "read")),
      ...grant("jobs", "update"),
      ...grant("proofs", "create", "update"),
      view("printing-orders"),
      view("printing-jobs"),
      view("printing-proofs"),
      view("printing-artwork"),
    ],
    limits: {
      // The artwork looked over, and an approved job onto the press.
      jobs: { writable: ["artwork_checked", "stage", "works_note"], writableValues: { stage: ["printing"] }, writableFrom: { stage: ["prepress"] } },
      // A proof: the job, its file, how it is sent, the note and the design version it shows; or sent again.
      proofs: {
        creatable: ["job_id", "kind", "file", "design_version_id", "note"],
        writable: ["state"],
        writableValues: { state: ["superseded"] },
      },
    },
    tables: [...CUSTOMISER_READS, ...STOCK_READS],
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
    ],
    limits: {
      jobs: { writable: ["stage", "works_note"], writableValues: { stage: ["finishing", "ready"] }, writableFrom: { stage: ["printing", "finishing"] } },
      // Sheets spoiled on a job's run, with a note.
      spoils: { creatable: ["job_id", "qty", "note"] },
      // The order ready to hand over, once its last job is.
      orders: { writable: ["status"], writableValues: { status: ["ready"] }, writableFrom: { status: ["placed"] } },
    },
    tables: [
      { addOn: CUSTOMISER, table: "designs", actions: ["read"] },
      { addOn: CUSTOMISER, table: "design_versions", actions: ["read"] },
      { addOn: CUSTOMISER, table: "version_files", actions: ["read"] },
      ...STOCK_READS,
    ],
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
      // Ready, then handed over; a delivery over the bands priced and its quote sent.
      orders: {
        writable: ["status", "tracking", "dhl_service", "delivery_quote", "delivery_quote_state"],
        writableValues: { status: ["ready", "collected", "dispatched"], delivery_quote_state: ["to_quote", "sent"] },
      },
      jobs: { writable: ["stage"], writableValues: { stage: ["collected", "dispatched"] }, writableFrom: { stage: ["ready"] } },
      sample_requests: { writable: ["status"], writableValues: { status: ["posted"] } },
    },
    tables: [{ addOn: CUSTOMISER, table: "designs", actions: ["read"] }, ...STOCK_READS, ...SHIPMENT_READS],
  },
];

/** The Customiser's record panels each role opens: the design on a job, the base on a product. */
export const ROLE_PANELS: Record<string, string[]> = {
  owner: ["customiser-line", "customiser-product"],
  prepress: ["customiser-line"],
  press: ["customiser-line"],
};

/** The roles as a manifest at `floor` writes them: the panels' grants need the release that reads them. */
export function rolesFor(panels: boolean): typeof ROLES {
  if (!panels) return ROLES;
  return ROLES.map((role) => ({ ...role, permissions: [...role.permissions, ...(ROLE_PANELS[role.key] ?? []).map(view)] }));
}
