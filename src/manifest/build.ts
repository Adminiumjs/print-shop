/**
 * `manifest.json`, assembled from the modules beside this file.
 *
 * The manifest is what Adminium installs: the tables and their rules, the
 * pages, the roles, the customer side's doors, the e-mails, the add-ons. It is
 * written from typed modules rather than by hand because it is long and says
 * many things more than once; the modules say each thing once. The file
 * itself is still the product's input, checked in, and
 * `manifest-drift.test.ts` fails when it and the modules disagree
 * (`npm run manifest` writes it again).
 */
import { ADD_ONS } from "./add-ons.ts";
import { DOCUMENTS } from "./documents.ts";
import { emailTemplates } from "./emails.ts";
import { KINDS, OUTBOX } from "./outbox.ts";
import { NAV_GROUPS, pages } from "./pages.ts";
import { PEOPLE } from "./people.ts";
import { PUBLIC_ACCESS, PUBLIC_KEYS } from "./public.ts";
import { ROLES } from "./roles.ts";
import { SETTINGS } from "./settings.ts";
import { TABLES } from "./tables.ts";

export const VERSION = "0.1.0";

/**
 * The Adminium release that first reads everything below: delivery bands
 * picked by the basket's weight, ready-by dates in working days, a guest's
 * artwork uploaded into a job, the Customiser's design checked and
 * snapshotted by a job, and its copies of a person.
 */
export const MIN_ADMINIUM = "0.3.43";

const ENV = {
  VITE_ADMINIUM_API_BASE_URL: { required: false, example: "https://admin.example.com" },
  VITE_ADMINIUM_PUBLISHABLE_KEY: { required: false, example: "adm_pub_..." },
};

/** The works' screens open on one address; their tabs are its own. */
export const STAFF_ROUTES = { works: "/" };

/** The customer side. An order's own link lands on `/order`, a quote's on `/quote`, the code in the fragment. */
export const CUSTOMER_ROUTES = {
  home: "/",
  product: "/product",
  artwork: "/artwork",
  basket: "/basket",
  confirmed: "/confirmed",
  order: "/order",
  find: "/find",
  reorder: "/reorder",
  proofs: "/proofs",
  quotes: "/quotes",
  quote: "/quote",
  samples: "/samples",
  templates: "/templates",
  delivery: "/delivery",
  findUs: "/find-us",
  // A saved design's link: the key the Customiser's own e-mail looks for.
  customiserDesign: "/design",
};

export function buildManifest(): Record<string, unknown> {
  return {
    kind: "app",
    manifestVersion: 1,
    key: "printing",
    name: "Print Shop",
    version: VERSION,
    publisher: { id: "adminium", name: "Adminium", url: "https://adminium.dev" },
    license: "AGPL-3.0-only",
    description: {
      key: "mft.printing.desc",
      fallback:
        "A print works, front and back. Customers choose a product, its stock, size, sides and finishes, fill in a ready-made design or send their own artwork, and see the price and the day it will be ready; the works proofs every job, prints it and hands it over — every price and date decided by your own database.",
    },
    categories: ["commerce"],
    compatibility: {
      minAdminiumVersion: MIN_ADMINIUM,
      engines: ["sqlite", "postgres", "mysql"],
    },
    capabilities: ["email-delivery", "file-storage"],
    frontends: [
      { side: "staff", kind: "spa", entry: "index.html", env: ENV, placement: "external", routes: STAFF_ROUTES },
      { side: "customer", kind: "spa", entry: "index.html", env: ENV, routes: CUSTOMER_ROUTES },
    ],
    settings: SETTINGS,
    addOns: ADD_ONS,
    documents: DOCUMENTS,
    navGroups: NAV_GROUPS,
    requiredSchema: { prefixed: true, tables: TABLES },
    pages: pages(),
    roles: ROLES,
    publicKeys: PUBLIC_KEYS,
    publicAccess: PUBLIC_ACCESS,
    outbox: OUTBOX,
    people: PEOPLE,
    emailTemplates: emailTemplates(KINDS),
    sampleData: { file: "seeds/printing.sample.json", addOns: { customiser: { file: "seeds/printing.customiser.sample.json" } } },
  };
}

/** The file's text: two-space JSON and a final newline. */
export function manifestText(): string {
  return `${JSON.stringify(buildManifest(), null, 2)}\n`;
}
