/**
 * The works' door into Adminium: what the staff screens read and the writes
 * they make, whichever Adminium answers (the real one over the signed-in
 * person's session, or a test's stand-in). Screens never reach past it.
 *
 * Every figure the screens show is a stored column Adminium worked out: a
 * job's sheets, price, weight and ready-by, an order's totals and delivery,
 * the stock Inventory keeps. The door hands rows back as the API answers them
 * and never adds a figure of its own.
 */
import type { Id, Row } from "./wire.ts";
import type { PanelId } from "../manifest/panels.ts";

/** The app's tables, by the names the manifest gives them. */
export type Table =
  | "settings"
  | "products"
  | "options"
  | "materials"
  | "sizes"
  | "finishes"
  | "breaks"
  | "packaging"
  | "delivery_bands"
  | "machines"
  | "closures"
  | "customers"
  | "orders"
  | "jobs"
  | "job_features"
  | "artwork"
  | "proofs"
  | "spoils";

/** The add-ons' tables the works reads, by add-on and table (`customiser:designs`; a carrier's `shipments`). */
export type AddOnTable = `${string}:${string}`;

export type Action = "read" | "create" | "update" | "delete";

/** The person signed in: their name, and what the app's roles let them do. */
export interface Person {
  name: string;
  /** The app's roles they hold, by the manifest's key (`owner`, `prepress`, `press`, `counter`). */
  roles: string[];
  /** Whether they may do this to the app's table; true when the server does not say. */
  can(table: Table, action: Action): boolean;
}

/** Everything the works' screens read, at one moment. */
export interface WorksData {
  settings: Row | null;
  products: Row[];
  options: Row[];
  materials: Row[];
  sizes: Row[];
  finishes: Row[];
  breaks: Row[];
  packaging: Row[];
  bands: Row[];
  machines: Row[];
  closures: Row[];
  orders: Row[];
  jobs: Row[];
  artwork: Row[];
  proofs: Row[];
  spoils: Row[];
  /** The Customiser's designs the jobs name, and their versions (newest first per design), and their made files. */
  designs: Row[];
  versions: Row[];
  files: Row[];
  /** What Inventory keeps of the materials, when it is on: the links from a material to its item, and the item's stock. */
  links: Row[];
  stock: Row[];
  /** What the delivery company booked, when one is on and the person may read it. */
  shipments: Row[];
  /** The public holidays Holiday calendars keeps, when it is on and the person may read them (the owner). */
  holidays: Row[];
}

/** The works' facts that are not rows: its zone, money, working week, clock and add-ons. */
export interface WorksFacts {
  /** The works' zone (its days and times are read in it). */
  zone: string;
  currency: string;
  /** The works' days, Monday first: `mon,tue,wed,thu,fri`. */
  workingDays: string[];
  /** An order before this time of day starts that day: `14:00`. */
  cutoff: string;
  /** The add-ons attached to the app and switched on, by key. */
  addOns: string[];
  /**
   * The delivery company attached and on, when there is one: the add-on that
   * provides `shipping-carrier@1`, by its key and the name Adminium lists it
   * by. The works' screens never name one themselves.
   */
  carrier: { key: string; name: string } | null;
  /** Each add-on's settings it marks for a browser (never a secret), by key: what its fills are handed. */
  addOnSettings: Record<string, Record<string, unknown>>;
  /** The connection the app's tables are in: a record page's address names it. */
  connectionId: string | null;
}

/** One installed add-on as Adminium lists it, narrowed to what the shelf reads. */
export interface InstalledAddOn {
  key: string;
  name: string;
  version: string;
  connectKind: "none" | "api-key" | "oauth2";
  connected: boolean;
  missing: boolean;
  /** Attached to this app, and switched on for it. */
  attached: boolean;
  enabled: boolean;
  /** The slots it fills. */
  slots: string[];
  /** The one address it may reach, when it reaches any. */
  networkAllow: string[];
  /** Its own pages in Adminium, and its panels on a record's page, by their refs. */
  pages: string[];
  panels: string[];
}

/** One add-on as Adminium's catalogue shows it: its line, its kinds, its tile. */
export interface CatalogEntry {
  key: string;
  name: string;
  state: "installed" | "staged" | "available" | "missing";
  tagline: string | null;
  categories: string[];
  monogram: string | null;
  connectKind: "none" | "api-key" | "oauth2";
}

/** One thing an add-on did, as Adminium's log says it. */
export interface ActivityEntry {
  id: string;
  /** Epoch ms. */
  at: number;
  addOn: string;
  action: string;
  by: string;
  /** The order reference it was about, when it was about one. */
  ref: string | null;
}

/** The proof file: a PDF picked in this browser, or a copy of one the Customiser made. */
export type ProofFile = { blob: Blob; filename: string } | { copyOf: string };

/** One of the Customiser's record panels, opened on a row of the app's: a job's design, a product's base. */
export interface PanelOpen {
  id: PanelId;
  table: "jobs" | "products";
  row: Id;
}

/** A list of one of an add-on's tables, as the data routes take it. */
export interface PanelList {
  where?: unknown;
  /** `column.dir,column.dir` */
  order?: string;
  select?: readonly string[];
  limit: number;
  offset: number;
}

/** What a file put into one of an add-on's file columns answers: the reference the row now holds, the file, the row saved. */
export interface PanelUploaded {
  ref: string;
  id: string;
  name: string;
  mime: string;
  size: number;
  removed: string[];
  row: Row;
}

/**
 * What a Customiser panel drawn on a works screen reads and writes through:
 * the add-on's own tables by their short names, as the person signed in, and
 * the panel's code as Adminium serves it to them for that row. A refusal is
 * the server's, with its code, its words and what it said beside.
 */
export interface PanelDoor {
  /** The panel's code (its default export), served for that row only to a role that holds the panel; refused (403) otherwise. */
  load(panel: PanelOpen): Promise<unknown>;
  list(addOn: string, table: string, query: PanelList): Promise<Row[]>;
  /** One row by its key; null when it is not there or out of reach. */
  get(addOn: string, table: string, key: Id): Promise<Row | null>;
  create(addOn: string, table: string, values: Record<string, unknown>): Promise<{ data: Row; postings?: unknown[] }>;
  update(addOn: string, table: string, key: Id, values: Record<string, unknown>): Promise<{ data: Row; postings?: unknown[] }>;
  remove(addOn: string, table: string, key: Id): Promise<void>;
  /** The bytes stored for a file column of the row `key`, then the row saved with them; a save refused throws the file away. */
  upload(addOn: string, table: string, column: string, key: Id, file: Blob, name: string): Promise<PanelUploaded>;
  /** What the person signed in may do with the add-on's tables, as Adminium answers the dashboard's kit. */
  access(addOn: string): Promise<PanelAccess>;
}

/** What a person may do with each of an add-on's tables (by its short name), and which of its columns they may not read. */
export interface PanelAccess {
  tables: Record<string, { can: { read: boolean; create: boolean; update: boolean; delete: boolean }; unreadable: string[] }>;
  has: Record<string, boolean>;
  currency: string | null;
}

export interface WorksDoor {
  who(): Person;
  /** The door the Customiser's panels draw through on these screens; null where no Adminium serves them (the demo). */
  panels(): PanelDoor | null;
  facts(): WorksFacts;
  /** The server's clock, as epoch ms. */
  now(): number;
  load(): Promise<WorksData>;

  /** A job along the floor; `from` is the stage the screen saw, so a job moved on since is refused. */
  moveJob(job: Row, to: string, values?: Record<string, unknown>): Promise<Row>;
  /** A job's own columns that are not its stage (the artwork looked over, a note). */
  updateJob(job: Row, values: Record<string, unknown>): Promise<Row>;
  /** An order along its states, from the one the screen saw. */
  moveOrder(order: Row, to: string, values?: Record<string, unknown>): Promise<Row>;
  /** An order's own columns that are not its state (a delivery quote sent). */
  updateOrder(order: Row, values: Record<string, unknown>): Promise<Row>;
  /** A proof the works sent before, answered by the one it sends now. */
  supersede(proof: Row): Promise<Row>;
  /** A proof of a job: its PDF stored first, then the row that sends it (Adminium numbers it and e-mails it). */
  sendProof(input: { job: Row; kind: "email" | "post"; file: ProofFile; designVersionId: Id | null; note: string | null }): Promise<Row>;
  /** Sheets spoiled on a job's run: a row of their own, which Inventory is told of when it keeps the stock. */
  spoil(input: { job: Row; sheets: number; note: string | null }): Promise<Row>;
  /** A row of the rate card, changed. */
  saveRate(table: Table, row: Row, values: Record<string, unknown>): Promise<Row>;
  /** A public holiday of Holiday calendars added as one of the works' closures: its day and its name, linked to it. */
  addClosure(holiday: Row): Promise<Row>;

  /** The add-ons installed, as Adminium lists them for this app. */
  addOns(): Promise<InstalledAddOn[]>;
  /** An installed add-on switched on or off for this app (only who manages add-ons may). */
  setAddOn(key: string, enabled: boolean): Promise<void>;
  /** Adminium's catalogue of add-ons; empty for someone who may not manage add-ons, or offline. */
  catalog(): Promise<CatalogEntry[]>;
  /** What the add-ons did, newest first; empty for someone who may not read Adminium's log. */
  activity(): Promise<ActivityEntry[]>;
  /** The person's Adminium session ended. Absent where nobody signed in (the demo): no sign-out is drawn. */
  signOut?(): Promise<void>;
}
