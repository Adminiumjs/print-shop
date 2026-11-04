/**
 * What the customer side's pages may read and write, through three browser
 * keys.
 *
 * The `customer` key is the shop's: the rate card and the catalogue (the
 * products in the shop with their options, the materials, sizes, finishes,
 * breaks, packaging, delivery bands and the rules that say which finish is
 * not offered on what), the closures, the works' public settings; placing an
 * order with its jobs, their features and their artwork in one write, priced
 * by Adminium and checked against the total the customer saw; saving a quote;
 * asking for a sample pack. A customer who signs in with a link or code
 * e-mailed to them reads their own orders, jobs, artwork, proofs and saved
 * quotes, answers a proof (approve it, or ask for a change), renames a quote,
 * and answers a delivery quote (accept it, or collect instead).
 *
 * The `order` key opens one order by the code in its own link (the link its
 * confirmation e-mail carries, and the one the confirmation page is handed
 * once), with the same reads and answers. The `quote` key opens one saved
 * quote by its own link.
 *
 * The Customiser declares its own entries on the `customer` key (its
 * catalogue for this shop, a customer's design and its link), not here.
 *
 * What never leaves through these keys: anybody else's order, who in the works
 * did what, the works' notes, an order's link code and retry key, the stock.
 */
import { NEWS_TICK } from "./people.ts";

/** What a customer sees of an order: its progress, their details, what it costs. */
export const ORDER_SELECT = [
  "id",
  "number",
  "status",
  "name",
  "email",
  "address_line1",
  "address_line2",
  "town",
  "postcode",
  "delivery_method",
  "dhl_service",
  "item_count",
  "goods_total",
  "weight_kg",
  "delivery_band_id",
  "delivery",
  "delivery_to_quote",
  "delivery_quote",
  "delivery_quote_state",
  "subtotal",
  "tax_rate",
  "tax",
  "total",
  "placed_at",
  "ready_by",
  "ready_at",
  "collected_at",
  "dispatched_at",
  "tracking",
  "cancelled_at",
  "link_expires",
];

/** What placing an order answers: its figures, never the customer's own details back. */
export const PLACED_SELECT = ORDER_SELECT.filter((column) => !["name", "email", "address_line1", "address_line2", "town", "postcode"].includes(column));

/** A job's configuration, as the customer chose it and the rate card priced it. */
export const CONFIG_SELECT = [
  "product_id",
  "product_name",
  "product_kind",
  "qty",
  "material_option_id",
  "material_id",
  "size_option_id",
  "size_id",
  "width_mm",
  "height_mm",
  "sides_option_id",
  "sides",
  "lamination_option_id",
  "look",
  "spot_uv_option_id",
  "corners_option_id",
  "edges_option_id",
  "canvas_option_id",
  "packaging_id",
  "proof_by_post",
  "express",
  "price",
  "weight_kg",
];
/** What a customer chooses for a job: never its price, weight or anything Adminium works out. */
export const CONFIG_WRITABLE = [
  "product_id",
  "qty",
  "material_option_id",
  "size_option_id",
  "width_mm",
  "height_mm",
  "sides_option_id",
  "lamination_option_id",
  "look",
  "spot_uv_option_id",
  "corners_option_id",
  "edges_option_id",
  "canvas_option_id",
  "packaging_id",
  "proof_by_post",
  "express",
];

export const JOB_SELECT = [
  "id",
  "order_id",
  "position",
  ...CONFIG_SELECT,
  "design_id",
  "proof_state",
  "changes",
  "turnaround_days",
  "ready_by",
  "artwork_count",
  "warnings_accepted",
  "stage",
  "artwork_checked_at",
  "printing_at",
  "finishing_at",
  "ready_at",
  "handed_over_at",
];
export const FEATURE_SELECT = ["id", "job_id", "option_id", "feature", "feature_id", "name", "price"];
export const ARTWORK_SELECT = ["id", "job_id", "name", "file", "side", "checks", "accepted", "uploaded_at"];
export const PROOF_SELECT = ["id", "order_id", "job_id", "version", "kind", "file", "design_version_id", "note", "state", "change_note", "sent_at", "answered_at"];

export const QUOTE_SELECT = [
  "id",
  "number",
  "label",
  "name",
  "email",
  "delivery_method",
  "item_count",
  "goods_total",
  "weight_kg",
  "delivery_band_id",
  "delivery",
  "delivery_to_quote",
  "subtotal",
  "tax_rate",
  "tax",
  "total",
  "created_at",
  "link_expires",
];
export const QUOTE_LINE_SELECT = ["id", "quote_id", "position", ...CONFIG_SELECT, "design_id"];

/** The customer's answer to a proof: approve it, or ask for a change in their own words, while it waits. */
const ANSWER = {
  writable: ["state", "change_note"],
  writableValues: { state: ["approved", "change_asked"] },
  writableWhen: { state: ["sent"] },
};

/** The customer's answer to the works' delivery quote: accept it, or collect from the works instead. */
const DELIVERY_ANSWER = {
  writable: ["delivery_quote_state", "delivery_method"],
  writableValues: { delivery_quote_state: ["accepted"], delivery_method: ["collect"] },
  writableWhen: { delivery_quote_state: ["sent"] },
};

/** A quote's own name, the one thing a customer changes on it. */
const RENAME = { writable: ["label"] };

/** An order's jobs, features, artwork and proofs, read where the order is; a proof answered there too. */
function underOrder(key?: string) {
  const keyed = key === undefined ? {} : { key };
  return [
    { table: "jobs", ...keyed, methods: ["GET"], level: "verified", visibleWith: { table: "orders", via: "order_id" }, select: JOB_SELECT },
    { table: "job_features", ...keyed, methods: ["GET"], level: "verified", visibleWith: { table: "jobs", via: "job_id" }, select: FEATURE_SELECT },
    { table: "artwork", ...keyed, methods: ["GET"], level: "verified", visibleWith: { table: "jobs", via: "job_id" }, select: ARTWORK_SELECT, files: ["file"] },
    { table: "proofs", ...keyed, methods: ["GET", "PATCH"], level: "verified", visibleWith: { table: "orders", via: "order_id" }, select: PROOF_SELECT, files: ["file"], ...ANSWER },
  ];
}

/** A quote's lines, read where the quote is. */
function underQuote(key?: string) {
  const keyed = key === undefined ? {} : { key };
  return [{ table: "quote_lines", ...keyed, methods: ["GET"], level: "verified", visibleWith: { table: "saved_quotes", via: "quote_id" }, select: QUOTE_LINE_SELECT }];
}

export const PRODUCT_SELECT = [
  "id",
  "code",
  "name",
  "family",
  "kind",
  "line",
  "from_qty",
  "default_width_mm",
  "default_height_mm",
  "max_width_mm",
  "max_height_mm",
  "icon",
  "photo",
  "base_id",
  "position",
];
export const OPTION_SELECT = ["id", "product_id", "kind", "code", "name", "material_id", "size_id", "sides", "finish_id", "coated", "price", "feature_code", "feature_id", "preselected", "position"];

export const SETTINGS_SELECT = [
  "id",
  "works_name",
  "address",
  "phone",
  "email",
  "hours",
  "about",
  "tax_rate",
  "setup",
  "standard_days",
  "express_days",
  "express_percent",
  "proof_post_price",
  "proof_post_days",
  "change_days",
  "sheet_width_mm",
  "sheet_height_mm",
  "large_format_minimum",
  "tube_max_mm",
  "artwork_max_mb",
  "min_dpi",
  "taking_orders",
  "sample_packs",
];

/** The order key: one order, by its own link. */
export const ORDER_KEY = "order";
/** The quote key: one saved quote, by its own link. */
export const QUOTE_KEY = "quote";

export const PUBLIC_KEYS = { [ORDER_KEY]: {}, [QUOTE_KEY]: {} };

/** A guest's create: a few a day from one address, a few an hour from one visitor. */
const PLAIN_ADDRESS = ["name", "town", { column: "address_line1", digits: 4, max: 120 }, { column: "address_line2", digits: 4, max: 120 }];

export const PUBLIC_ACCESS = [
  // ── the customer who signs in with a link or code e-mailed to them ─────────
  {
    table: "customers",
    methods: ["GET"],
    select: ["name", "email"],
    claim: { verify: "email-link", email: "email" },
    humanCheck: true,
    // "Delete my details" also stops every link their orders were e-mailed with, and takes back the newsletter.
    forget: { columns: ["email", "name", "may_email"], stamp: "forgotten_at", links: true },
  },
  { table: "orders", methods: ["GET", "PATCH"], level: "verified", claimedBy: { table: "customers", column: "customer_id" }, select: ORDER_SELECT, ...DELIVERY_ANSWER },
  ...underOrder(),
  { table: "saved_quotes", methods: ["GET", "PATCH"], level: "verified", claimedBy: { table: "customers", column: "customer_id" }, select: QUOTE_SELECT, ...RENAME },
  ...underQuote(),

  // ── the rate card, the catalogue and the calendar ────────────────────────────
  { table: "products", methods: ["GET"], select: PRODUCT_SELECT, filters: [{ column: "published", op: "eq", value: true }], pictures: ["photo"] },
  { table: "options", methods: ["GET"], select: OPTION_SELECT, filters: [{ column: "active", op: "eq", value: true }] },
  { table: "materials", methods: ["GET"], select: ["id", "code", "name", "short_name", "spec", "kind", "coated", "gsm", "rate", "roll_width_mm", "position"], filters: [{ column: "active", op: "eq", value: true }] },
  { table: "sizes", methods: ["GET"], select: ["id", "code", "name", "width_mm", "height_mm", "up", "up_upright", "up_rotated", "direct", "position"], filters: [{ column: "active", op: "eq", value: true }] },
  { table: "finishes", methods: ["GET"], select: ["id", "code", "name", "group", "basis", "price", "count", "position"], filters: [{ column: "active", op: "eq", value: true }] },
  { table: "breaks", methods: ["GET"], select: ["id", "min_qty", "multiplier"] },
  { table: "packaging", methods: ["GET"], select: ["id", "code", "name", "basis", "price", "product_kind", "position"], filters: [{ column: "active", op: "eq", value: true }] },
  { table: "delivery_bands", methods: ["GET"], select: ["id", "code", "name", "tube", "min_kg", "max_kg", "price", "position"] },
  { table: "option_rules", methods: ["GET"], select: ["id", "finish_group", "test", "gsm", "reason", "position"], filters: [{ column: "active", op: "eq", value: true }] },
  {
    table: "closures",
    methods: ["GET"],
    select: ["id", "from_date", "to_date", "reason"],
    filters: [
      { column: "active", op: "eq", value: true },
      { column: "to_date", op: "from-today" },
    ],
  },
  { table: "settings", methods: ["GET"], select: SETTINGS_SELECT },

  // ── placing an order ─────────────────────────────────────────────────────────
  {
    table: "orders",
    methods: ["POST"],
    humanCheck: true,
    level: "verified",
    select: PLACED_SELECT,
    writable: ["name", "email", "address_line1", "address_line2", "town", "postcode", "language", "delivery_method", "dhl_service", "client_key", "may_email"],
    requires: ["name", "email", "delivery_method"],
    requireSetting: [{ table: "settings", column: "taking_orders" }],
    claimedBy: { table: "customers", column: "customer_id", optional: true },
    identity: { table: "customers", email: "email", link: "customer_id", fill: { name: "name", language: "language" } },
    consent: NEWS_TICK,
    shareLink: "link_token",
    anonymous: { perValue: { columns: ["email"], n: 10 }, perIpHour: 10, perKeyHour: 300, plainText: PLAIN_ADDRESS },
    children: {
      jobs: {
        via: "order_id",
        writable: [...CONFIG_WRITABLE, "design_code"],
        requires: ["product_id", "material_option_id", "sides_option_id"],
        select: JOB_SELECT.filter((c) => c !== "order_id"),
        position: "position",
        min: 1,
        max: 20,
        children: {
          job_features: { via: "job_id", writable: ["option_id"], select: FEATURE_SELECT.filter((c) => c !== "job_id"), max: 4 },
          artwork: {
            via: "job_id",
            writable: ["name", "file", "side", "checks", "accepted"],
            uploads: ["file"],
            requires: ["name", "file"],
            select: ARTWORK_SELECT.filter((c) => c !== "job_id"),
            max: 4,
          },
        },
      },
    },
    dryRun: true,
    expect: "total",
    clientKey: "client_key",
  },

  // ── saving a quote, and asking for a sample pack ─────────────────────────────
  {
    table: "saved_quotes",
    methods: ["POST"],
    humanCheck: true,
    level: "verified",
    select: QUOTE_SELECT.filter((c) => !["name", "email"].includes(c)),
    writable: ["label", "name", "email", "language", "delivery_method", "client_key"],
    requires: ["email", "delivery_method"],
    claimedBy: { table: "customers", column: "customer_id", optional: true },
    identity: { table: "customers", email: "email", link: "customer_id", fill: { name: "name", language: "language" } },
    shareLink: "link_token",
    anonymous: { perValue: { columns: ["email"], n: 10 }, perIpHour: 10, perKeyHour: 300, plainText: ["name", { column: "label", digits: 4, max: 80 }] },
    children: {
      quote_lines: {
        via: "quote_id",
        writable: [...CONFIG_WRITABLE, "design_code"],
        requires: ["product_id", "material_option_id", "sides_option_id"],
        select: QUOTE_LINE_SELECT.filter((c) => c !== "quote_id"),
        position: "position",
        min: 1,
        max: 20,
      },
    },
    dryRun: true,
    expect: "total",
    clientKey: "client_key",
  },
  {
    table: "sample_requests",
    methods: ["POST"],
    humanCheck: true,
    select: ["id", "status"],
    writable: ["name", "email", "address_line1", "address_line2", "town", "postcode", "language", "client_key"],
    requires: ["name", "email", "address_line1", "town", "postcode"],
    requireSetting: [{ table: "settings", column: "sample_packs" }],
    anonymous: { perValue: { columns: ["email"], n: 3 }, perIpHour: 3, perKeyHour: 60, plainText: PLAIN_ADDRESS },
    clientKey: "client_key",
  },

  // ── one order, by its own link ───────────────────────────────────────────────
  {
    table: "orders",
    key: ORDER_KEY,
    methods: ["GET", "PATCH"],
    select: ORDER_SELECT,
    claim: { by: "token", column: "link_token", expires: "link_expires", stopped: "link_stopped", own: true, address: "email" },
    ...DELIVERY_ANSWER,
  },
  ...underOrder(ORDER_KEY),

  // ── one saved quote, by its own link ─────────────────────────────────────────
  {
    table: "saved_quotes",
    key: QUOTE_KEY,
    methods: ["GET", "PATCH"],
    select: QUOTE_SELECT,
    claim: { by: "token", column: "link_token", expires: "link_expires", stopped: "link_stopped", own: true, address: "email" },
    ...RENAME,
  },
  ...underQuote(QUOTE_KEY),
];

/**
 * The ref Adminium gives each entry above, in order, as the customer side's
 * pages call it: the table's installed name (`printing_` and its ref), with
 * `_claimed` for an entry that opens a row by a claim, `_verified` for one
 * that reads at the verified level through a claim or a parent, and `_2` for
 * the second of the same. This is Adminium's naming (`publicEntryRefs`),
 * written out once so the pages need not work it out; the drift test holds it
 * to the entries.
 */
export const PUBLIC_REFS = {
  signIn: "printing_customers_claimed",
  myOrders: "printing_orders_verified",
  myJobs: "printing_jobs_verified",
  myFeatures: "printing_job_features_verified",
  myArtwork: "printing_artwork_verified",
  myProofs: "printing_proofs_verified",
  myQuotes: "printing_saved_quotes_verified",
  myQuoteLines: "printing_quote_lines_verified",
  products: "printing_products",
  options: "printing_options",
  materials: "printing_materials",
  sizes: "printing_sizes",
  finishes: "printing_finishes",
  breaks: "printing_breaks",
  packaging: "printing_packaging",
  deliveryBands: "printing_delivery_bands",
  optionRules: "printing_option_rules",
  closures: "printing_closures",
  settings: "printing_settings",
  placeOrder: "printing_orders_verified_2",
  saveQuote: "printing_saved_quotes_verified_2",
  samplePack: "printing_sample_requests",
  orderByLink: "printing_orders_claimed",
  linkJobs: "printing_jobs_verified_2",
  linkFeatures: "printing_job_features_verified_2",
  linkArtwork: "printing_artwork_verified_2",
  linkProofs: "printing_proofs_verified_2",
  quoteByLink: "printing_saved_quotes_claimed",
  quoteLinkLines: "printing_quote_lines_verified_2",
} as const;
