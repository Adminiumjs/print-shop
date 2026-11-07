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
import { peopleFor } from "./people.ts";
import { PUBLIC_ACCESS, PUBLIC_KEYS } from "./public.ts";
import { rolesFor } from "./roles.ts";
import { SETTINGS } from "./settings.ts";
import { TABLES } from "./tables.ts";

export const VERSION = "0.2.1";

/**
 * The Adminium release that first reads everything below: delivery bands
 * picked by the basket's weight, ready-by dates in working days, a guest's
 * artwork uploaded into a job, the Customiser's design checked and
 * snapshotted by a job, its copies of a person, the panels' grants, a
 * formula's key kept by its `normalize` rule (one sample pack per address,
 * however the address is typed), and, from 0.3.47, the owner's erase of a
 * person, a role's personal columns and deletes of an add-on's rows (more
 * than twelve of its tables), and the columns the Jobs list opens on. 0.3.48
 * is the first to install the Customiser 1.0.19 it bundles, whose
 * `appGrants` let the works' roles save a proof on a design's version.
 * 0.3.49 installs the app once per database (`frontends[].instances`) and
 * tells each install's screens which install they are.
 */
export const MIN_ADMINIUM = "0.3.49";

/**
 * The release that reads two more things this app says: a role's grant of
 * the Customiser's panels on a job and a product, and a person's copies in
 * the versions of their designs and those versions' files. They are written
 * only in a manifest whose floor is that release or later; the floor above
 * is, so the manifest that ships says them.
 */
export const PANELS_AND_COPIES = "0.3.44";

/** Whether release `a` is `b` or later, on major.minor.patch. */
export function atLeast(a: string, b: string): boolean {
  const [x, y] = [a, b].map((v) => v.split(/[.-]/).slice(0, 3).map(Number));
  for (let i = 0; i < 3; i += 1) if (x![i] !== y![i]) return x![i]! > y![i]!;
  return true;
}

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
  // The sign-in link Adminium e-mails lands here, its code in the fragment.
  link: "/c",
};

/** `floor` builds the manifest for another floor than the one it ships with (the tests try an older one). */
export function buildManifest(options: { floor?: string } = {}): Record<string, unknown> {
  const floor = options.floor ?? MIN_ADMINIUM;
  const newer = atLeast(floor, PANELS_AND_COPIES);
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
      minAdminiumVersion: floor,
      engines: ["sqlite", "postgres", "mysql"],
    },
    capabilities: ["email-delivery", "file-storage"],
    frontends: [
      { side: "staff", kind: "spa", entry: "index.html", env: ENV, placement: "external", routes: STAFF_ROUTES, instances: true },
      { side: "customer", kind: "spa", entry: "index.html", env: ENV, routes: CUSTOMER_ROUTES, instances: true },
    ],
    settings: SETTINGS,
    addOns: ADD_ONS,
    documents: DOCUMENTS,
    navGroups: NAV_GROUPS,
    requiredSchema: { prefixed: true, tables: TABLES },
    pages: pages(),
    roles: rolesFor(newer),
    publicKeys: PUBLIC_KEYS,
    publicAccess: PUBLIC_ACCESS,
    outbox: OUTBOX,
    people: peopleFor(newer),
    emailTemplates: emailTemplates(KINDS),
    sampleData: { file: "seeds/printing.sample.json", addOns: { customiser: { file: "seeds/printing.customiser.sample.json" } } },
  };
}

/** The file's text: two-space JSON and a final newline. */
export function manifestText(options: { floor?: string } = {}): string {
  return `${JSON.stringify(buildManifest(options), null, 2)}\n`;
}
