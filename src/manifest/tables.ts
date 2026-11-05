/**
 * The works' tables, as the manifest asks Adminium to make them.
 *
 * Three groups:
 *
 *   - **the rate card**, which anybody may read (it is a price list) and only
 *     the owner edits: `settings` (the works and the card's single figures:
 *     setup, tax, express, the printed proof, the working days a job takes),
 *     `materials`, `sizes`, `finishes`, `breaks`, `packaging`,
 *     `delivery_bands`; with the catalogue, `products`, the `options` each
 *     product offers (its materials, sizes, sides and finishes, and the
 *     Customiser's priced features) and the `option_rules` that say which
 *     finish is not offered on what;
 *   - **orders**: `customers`, `orders` (one basket, one delivery, one tax),
 *     their `jobs` (one a configured line), the features a job pays for, the
 *     customer's `artwork` and the works' `proofs`; `saved_quotes` and their
 *     `quote_lines`; `sample_requests`;
 *   - **the works**: `machines`, `closures`, and the outbox, `messages`.
 *
 * Every figure a customer or the works reads is decided here, by Adminium,
 * never by a page:
 *
 *   - a job's options are rows of its own product's (`linkable.same`), and a
 *     lamination only on a coated stock, a spot UV only on a lamination;
 *   - an order's number runs without gaps, `MP-4127` and on, a saved quote's
 *     its own, `MQ-2042` and on, each from the settings' first number and
 *     prefix;
 *   - a job's ready-by is so many working days after the order came in
 *     (`addWorkingDays`: the works' days and its two o'clock cut-off are
 *     settings, its closures a table): the standard days or the express
 *     days, the printed proof's post days, a working day for each change
 *     asked; counted again from the moment a change is asked or its proof
 *     approved;
 *   - an order's delivery is one band on the basket's weight, collection
 *     costs nothing, and over the top band the works quotes it by hand; its
 *     tax is the settings' rate on the goods and the delivery;
 *   - a job naming a design in the Customiser has the design checked inside
 *     the save (`check`) and snapshotted when the order is made (the `design`
 *     posting); nothing is printed before its proof is approved.
 *
 *   - a job's price and weight (and a saved quote's line's) are worked out
 *     from the rate card in the line itself (`pricing()`): sheets, the
 *     break, every finish by its basis, packing, the printed proof, express,
 *     never more than the next break; an order's goods add them up, and it
 *     goes in a tube only when all its large format rolls.
 *
 * Stock is the works' sheets and rolls, kept by Inventory. Sheets spoiled
 * on a run are a row each (`spoils`), added up on the job, and Inventory is
 * told of them when it keeps the stock.
 */
import { l, type Labels } from "./labels.ts";
import { KIND_NAMES } from "./outbox.ts";
import { DESIGN_POSTING, CUSTOMISER, HOLIDAYS } from "./postings.ts";
import { CUTOFF, WORKING_DAYS } from "./settings.ts";

type Tone = "pos" | "warn" | "danger" | "info" | "neutral" | "accent";

export interface Column {
  ref: string;
  type: "int" | "text" | "decimal" | "money" | "bool" | "enum" | "date" | "timestamptz" | "fk" | "json";
  role?: "pk" | "created_at";
  semantic?: "name" | "email" | "image" | "money";
  nullable?: true;
  enum?: string[];
  references?: string;
  default?: string | number | boolean;
  maxLength?: number;
  unique?: true;
  index?: true;
  scale?: number | "currency";
  rules?: Record<string, unknown>;
  label?: Labels | Record<string, string>;
}

export interface Table {
  ref: string;
  label: Labels | Record<string, string>;
  labelPlural: Labels | Record<string, string>;
  keyField?: string;
  unique?: string[][];
  states?: Record<string, unknown>;
  postings?: Record<string, unknown>[];
  check?: Record<string, unknown>;
  keep?: { law: "tax" | "health" | "contract" | "safety" };
  columns: Column[];
}

/** The record of a sale and its money, kept for the tax years whoever asks to be forgotten. */
const KEPT_FOR_TAX = { law: "tax" } as const;

// ── column makers ───────────────────────────────────────────────────────────

const id: Column = { ref: "id", type: "int", role: "pk" };
const opt = { nullable: true } as const;

function text(ref: string, maxLength: number, label: string, more: Partial<Column> = {}): Column {
  return { ref, type: "text", maxLength, label: l(label), ...more };
}
function int(ref: string, label: string, more: Partial<Column> = {}): Column {
  return { ref, type: "int", label: l(label), ...more };
}
function bool(ref: string, label: string, value: boolean): Column {
  return { ref, type: "bool", default: value, label: l(label) };
}
function fk(ref: string, references: string, label: string, more: Partial<Column> = {}): Column {
  return { ref, type: "fk", references, label: l(label), ...more };
}
function date(ref: string, label: string, more: Partial<Column> = {}): Column {
  return { ref, type: "date", label: l(label), ...more };
}
function at(ref: string, label: string, more: Partial<Column> = {}): Column {
  return { ref, type: "timestamptz", label: l(label), ...more };
}
function num(ref: string, scale: number, label: string, more: Partial<Column> = {}): Column {
  return { ref, type: "decimal", scale, label: l(label), ...more };
}
/** A price somebody types: the works', in the connection's currency. */
function price(ref: string, label: string, more: Partial<Column> = {}): Column {
  return { ref, type: "decimal", scale: "currency", label: l(label), ...more };
}
/** Money Adminium works out: empty until it has what it needs. */
function money(ref: string, label: string, rules: Record<string, unknown>): Column {
  return { ref, type: "decimal", scale: "currency", nullable: true, label: l(label), rules };
}
/** A whole number or decimal Adminium works out. */
function figure(ref: string, type: "int" | "decimal", label: string, rules: Record<string, unknown>, scale?: number): Column {
  return { ref, type, nullable: true, label: l(label), rules, ...(scale === undefined ? {} : { scale }) };
}
/** An enum, each value labelled, with tones where a list shows it as a chip. */
function choice(
  ref: string,
  label: string,
  values: Record<string, string>,
  more: Partial<Column> & { tones?: Record<string, Tone> } = {},
): Column {
  const { tones, rules, ...rest } = more;
  return {
    ref,
    type: "enum",
    enum: Object.keys(values),
    label: l(label),
    ...rest,
    rules: {
      ...rules,
      enumLabels: {
        labels: Object.fromEntries(Object.entries(values).map(([value, word]) => [value, l(word)])),
        ...(tones === undefined ? {} : { tones }),
      },
    },
  };
}
/** A row of the Customiser's, by its key. No database link: the add-on keeps its own tables. */
function link(ref: string, table: string, label: string, rules: Record<string, unknown> = {}): Column {
  return { ref, type: "int", nullable: true, label: l(label), rules: { addOnLink: { addOn: CUSTOMISER, table }, ...rules } };
}
/** A picture somebody uploads for the row, shown on the customer side where an entry says so. */
function picture(ref: string, label: string): Column {
  return { ref, type: "text", maxLength: 64, nullable: true, semantic: "image", label: l(label), rules: { file: { accept: ["png", "jpeg", "webp"], maxBytes: 5242880 } } };
}
const stamp = (set: unknown, on: unknown) => ({ stamp: { set, on } });
const onCreate = "create";
const onState = (column: string, ...values: string[]) => ({ column, values });
const setting = (column: string) => ({ table: "settings", column });
const fromSetting = (column: string) => ({ default: { from: setting(column) } });

// ── the words the tables share ──────────────────────────────────────────────

/** The eight languages an order or a request may be written in, by their own names. */
export const LANGUAGES: Record<string, string> = {
  "en-US": "English",
  "de-DE": "Deutsch",
  "fr-FR": "Français",
  "da-DK": "Dansk",
  "cs-CZ": "Čeština",
  "ar-EG": "العربية",
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
};

/** A language column: the emails read their language from it. */
function language(ref: string): Column {
  return {
    ref,
    type: "text",
    maxLength: 16,
    nullable: true,
    label: l("Language"),
    rules: { options: { values: Object.entries(LANGUAGES).map(([value, label]) => ({ value, label })) } },
  };
}

/** A product's family, as the products page groups and tints it. */
export const FAMILIES: Record<string, string> = {
  card: "Cards",
  paper: "Paper",
  mail: "Envelopes",
  sticker: "Stickers",
  image: "Posters and prints",
  banner: "Banners",
};

/** How a product is printed: on press sheets in breaks, or by the square metre from a roll. */
export const PRODUCT_KINDS: Record<string, string> = { sheet: "Sheet work", large: "Large format" };

/** A stock's kind: SRA3 press sheets, or a roll for large format. */
export const MATERIAL_KINDS: Record<string, string> = { sheet: "Sheet", roll: "Roll" };

/** The groups of finishes: a job takes at most one of each. */
export const FINISH_GROUPS: Record<string, string> = {
  lamination: "Lamination",
  spot_uv: "Spot UV",
  corners: "Round corners",
  edges: "Banner edges",
  canvas: "Canvas finish",
};

/** How a finish is charged. */
export const FINISH_BASES: Record<string, string> = {
  sheet: "A press sheet",
  per_250: "Every 250 pieces",
  metre: "A metre of edge",
  piece: "A piece",
  m2: "A square metre",
  none: "No charge",
};

/**
 * The kinds of a product's own options. A material, a size, the sides and a
 * finish of each group are the configurator's choices; a feature is one of the
 * Customiser's priced features (printing the back of a ready-made design),
 * named by its code.
 */
export const OPTION_KINDS: Record<string, string> = {
  material: "Material",
  size: "Size",
  sides: "Sides",
  lamination: "Lamination",
  spot_uv: "Spot UV",
  corners: "Round corners",
  edges: "Banner edges",
  canvas: "Canvas finish",
  feature: "Customising feature",
};

/** What makes a finish not offered: the rule's test, read with the finish's group. */
export const RULE_TESTS: Record<string, string> = {
  uncoated: "On an uncoated stock",
  roll: "On a roll",
  no_lamination: "Without a lamination",
  over_gsm: "On a stock heavier than",
};

/** How a packaging is charged. */
export const PACKAGING_BASES: Record<string, string> = { included: "Included", unit: "A piece", per_500: "Every 500 pieces" };

/** The two looks of a lamination, at the same price. */
export const LOOKS: Record<string, string> = { gloss: "Gloss", matt: "Matt" };

/** How an order reaches its customer. */
export const DELIVERY_METHODS: Record<string, string> = { deliver: "Delivery", collect: "Collection from the works" };

/** Where a job is on the works' floor. */
export const STAGES = ["prepress", "printing", "finishing", "ready", "collected", "dispatched", "cancelled"] as const;
const STAGE_LABELS: Record<(typeof STAGES)[number], string> = {
  prepress: "Prepress",
  printing: "Printing",
  finishing: "Finishing",
  ready: "Ready",
  collected: "Collected",
  dispatched: "Dispatched",
  cancelled: "Cancelled",
};

const ORDER_STATUSES: Record<string, string> = {
  placed: "Placed",
  ready: "Ready",
  collected: "Collected",
  dispatched: "Dispatched",
  cancelled: "Cancelled",
};

/** A proof's answer. A proof sent again supersedes the one before it. */
export const PROOF_STATES = ["sent", "approved", "change_asked", "superseded"] as const;
const PROOF_STATE_LABELS: Record<(typeof PROOF_STATES)[number], string> = {
  sent: "Waiting",
  approved: "Approved",
  change_asked: "Change asked",
  superseded: "Sent again",
};

/** Where a delivery the works prices by hand stands. */
const DELIVERY_QUOTE_STATES: Record<string, string> = { to_quote: "To quote", sent: "Quote sent", accepted: "Accepted" };

// ── formulas ────────────────────────────────────────────────────────────────

const yes = (column: string) => ({ eq: [column, true] });
/** The working days a job's own work takes: express or standard. */
const WORK_DAYS = { if: [yes("express"), { coalesce: ["express_days", 1] }, { coalesce: ["standard_days", 3] }] };
/**
 * The days a job waits on its proof, until it is approved: the post days when
 * the proof goes by post (the customer ordered it, or the works posts one),
 * and a working day for each change asked.
 */
const PROOF_WAIT_DAYS = {
  if: [
    { eq: ["proof_state", "approved"] },
    0,
    {
      add: [
        { if: [{ or: [yes("proof_by_post"), { gt: ["posted_proofs", 0] }] }, { coalesce: ["proof_post_days", 2] }, 0] },
        { mul: [{ coalesce: ["changes", 0] }, { coalesce: ["change_days", 1] }] },
      ],
    },
  ],
};
/** Whether a job is still on the works' floor. */
const ON_FLOOR = { if: [{ or: [{ eq: ["stage", "prepress"] }, { eq: ["stage", "printing"] }, { eq: ["stage", "finishing"] }] }, 1, 0] };
/** Whether a job may go to press: only once its latest proof is approved. */
const PROOF_OK = { if: [{ eq: ["proof_state", "approved"] }, 1, 0] };

/** An order's delivery: nothing to collect; the works' quote once the customer accepts it; else the band's price. */
const DELIVERY = {
  if: [
    { eq: ["delivery_method", "collect"] },
    0,
    { if: [{ eq: ["delivery_quote_state", "accepted"] }, { coalesce: ["delivery_quote", 0] }, { coalesce: ["band_price", 0] }] },
  ],
};
/** A saved quote's delivery: nothing to collect, else the band's price. */
const QUOTE_DELIVERY = { if: [{ eq: ["delivery_method", "collect"] }, 0, { coalesce: ["band_price", 0] }] };
/** Delivered, and over every band: the works prices the delivery by hand. */
const DELIVERY_TO_QUOTE = { if: [{ and: [{ eq: ["delivery_method", "deliver"] }, { isNull: "delivery_band_id" }] }, 1, 0] };
/** The delivery as priced: empty (a sum over nothing) while it is still to quote. */
const DELIVERY_PRICED = { if: [{ eq: ["delivery_to_quote", 1] }, { div: [0, 0] }, "delivery"] };
/** An order with the works' delivery quote on it, before the customer accepts it: its tax and total. */
const QUOTED_SUBTOTAL = { add: ["goods_total", "delivery_quote"] };
const QUOTED_TAX = { round: [{ div: [{ mul: [QUOTED_SUBTOTAL, { coalesce: ["tax_rate", 0] }] }, 100] }, 2] };
/** The lines' prices added up, while every line has one; empty while one has none. */
const GOODS = { if: [{ lt: [{ coalesce: ["priced_lines", 0] }, { coalesce: ["item_count", 0] }] }, { div: [0, 0] }, { coalesce: ["goods_sum", 0] }] };
const SUBTOTAL = { add: ["goods_total", { coalesce: ["delivery", 0] }] };
/** Tax on the goods and the delivery, at the settings' rate, rounded to the penny. */
const TAX = { round: [{ div: [{ mul: ["subtotal", { coalesce: ["tax_rate", 0] }] }, 100] }, 2] };
const TOTAL = { add: ["subtotal", { coalesce: ["tax", 0] }] };

// ── a job's configuration, shared by a job and a saved quote's line ─────────

/** An option of the line's own product, of one kind. */
function option(ref: string, kind: string, label: string, same: Record<string, unknown>[] = [], more: Record<string, unknown> = {}): Column {
  return fk(ref, "options", label, {
    ...opt,
    rules: { linkable: { where: [{ column: "kind", eq: kind }, { column: "active", eq: true }], same: [{ column: "product_id", as: "product_id" }, ...same] }, ...more },
  });
}
/** Asked for while the line's product is printed one way: a sheet job's preset size, a large-format job's own width and height. */
const neededFor = (kind: "sheet" | "large") => ({ requiredWhen: { column: "product_kind", in: [kind] } });
const always = (via: string, from: string) => ({ copy: { via, from, mode: "always" } });

/**
 * What the customer chose: the product, how many, and its options, each a row
 * of that product's own. A lamination names a coated surface and goes only on
 * a stock whose option says it is coated; a spot UV goes only on a lamination.
 * A sheet job names its preset size and a large-format job gives its own
 * width and height: a line without them has nothing to be priced by, so it is
 * refused rather than taken at a price that leaves the run out.
 *
 * The line's price and weight follow, worked out from the rate card (`pricing()`).
 */
function configuration(features: boolean): Column[] {
  return [
    fk("product_id", "products", "Product", { rules: { linkable: { where: [{ column: "published", eq: true }] } } }),
    text("product_name", 80, "Product name", { ...opt, rules: always("product_id", "name") }),
    choice("product_kind", "Printed as", PRODUCT_KINDS, { ...opt, rules: always("product_id", "kind") }),
    int("qty", "Quantity", { default: 1, rules: { validation: { min: 1, max: 100000 } } }),
    option("material_option_id", "material", "Material"),
    fk("material_id", "materials", "Stock", { ...opt, rules: always("material_option_id", "material_id") }),
    option("size_option_id", "size", "Size", [], neededFor("sheet")),
    fk("size_id", "sizes", "Preset size", { ...opt, rules: always("size_option_id", "size_id") }),
    // A large-format job's own size; a sheet job's is its preset's.
    int("width_mm", "Width (mm)", { ...opt, rules: { validation: { min: 50, max: 5000 }, ...neededFor("large") } }),
    int("height_mm", "Height (mm)", { ...opt, rules: { validation: { min: 50, max: 5000 }, ...neededFor("large") } }),
    // A large-format job's size as one text ("3000 × 1000 mm"), for its e-mails; empty for a preset size.
    text("dims", 24, "Size as made", { ...opt, rules: { formula: { join: ["width_mm", " \u00d7 ", "height_mm", "\u00a0mm"] } } }),
    option("sides_option_id", "sides", "Sides"),
    figure("sides", "int", "Printed sides", always("sides_option_id", "sides")),
    option("lamination_option_id", "lamination", "Lamination", [{ column: "coated", as: "material_option_id.coated" }]),
    choice("look", "Look", LOOKS, opt),
    option("spot_uv_option_id", "spot_uv", "Spot UV", [{ column: "coated", as: "lamination_option_id.coated" }]),
    option("corners_option_id", "corners", "Round corners"),
    option("edges_option_id", "edges", "Banner edges"),
    option("canvas_option_id", "canvas", "Canvas finish"),
    fk("packaging_id", "packaging", "Packaging", {
      ...opt,
      rules: { linkable: { where: [{ column: "active", eq: true }], same: [{ column: "product_kind", as: "product_id.kind" }] } },
    }),
    bool("proof_by_post", "Printed proof by post", false),
    bool("express", "Express", false),
    ...pricing(features),
  ];
}

// ── a line's price, worked out from the rate card ───────────────────────────

const isSheet = { eq: ["product_kind", "sheet"] };
const isLarge = { eq: ["product_kind", "large"] };
const zero = (value: unknown) => ({ coalesce: [value, 0] });
const cents = (expr: unknown) => ({ round: [expr, 2] });
/** Rounded up: a run of 250 pieces at 24 a sheet takes 11 sheets. */
const ceilOf = (a: unknown, b: unknown) => ({ ceil: [{ div: [a, b] }, 0] });

/** The line's figures a finish is charged by, at a quantity: its sheets, its pieces, its edges and its area. */
interface Units {
  sheets: unknown;
  qty: unknown;
  metres: unknown;
  area: unknown;
}
/**
 * How many of a finish's basis a line takes: its press sheets, every 250
 * pieces begun, its metres of edge, its pieces, its square metres; nothing
 * for a finish that costs nothing.
 */
function unitsOf(basis: string, u: Units): unknown {
  return {
    if: [
      { eq: [basis, "sheet"] },
      u.sheets,
      { if: [{ eq: [basis, "per_250"] }, ceilOf(u.qty, 250), { if: [{ eq: [basis, "metre"] }, u.metres, { if: [{ eq: [basis, "piece"] }, u.qty, { if: [{ eq: [basis, "m2"] }, u.area, 0] }] }] }] },
    ],
  };
}
/** A sheet finish's units at the next break: its sheets, every 250 begun, its pieces. */
const nextUnitsOf = (basis: string) => ({
  if: [{ eq: [basis, "sheet"] }, "next_sheets", { if: [{ eq: [basis, "per_250"] }, ceilOf("next_qty", 250), { if: [{ eq: [basis, "piece"] }, "next_qty", 0] }] }],
});
/** A packaging's units at a quantity: every piece, every 500 begun, or none (included). */
const packUnits = (qty: unknown) => ({ if: [{ eq: ["packaging_basis", "unit"] }, qty, { if: [{ eq: ["packaging_basis", "per_500"] }, ceilOf(qty, 500), 0] }] });

/** The finish groups a line may take one of each of, and the option column that names it. */
export const FINISH_LINES = [
  { group: "lamination", option: "lamination_option_id", label: "Lamination" },
  { group: "spot_uv", option: "spot_uv_option_id", label: "Spot UV" },
  { group: "corners", option: "corners_option_id", label: "Round corners" },
  { group: "edges", option: "edges_option_id", label: "Banner edges" },
  { group: "canvas", option: "canvas_option_id", label: "Canvas finish" },
] as const;
/** The finishes a sheet line takes: what the next break's price counts again. */
const SHEET_FINISHES = ["lamination", "spot_uv", "corners"] as const;

const NOW_UNITS: Units = { sheets: "sheets", qty: "qty", metres: { mul: ["perimeter_m", "qty"] }, area: "area_total" };

/** The work before express: setup, the run, its finishing, the design's priced features, its packing and a printed proof. */
const beforeExpress = (features: boolean) => ({
  add: [zero("setup"), zero("print_charge"), "material_charge", "finishing", ...(features ? [zero("features_charge")] : []), zero("packaging_charge"), "proof_charge"],
});
/** Express adds its percentage of the work, rounded to the penny. */
const expressOn = (work: unknown) => ({ if: [yes("express"), cents({ div: [{ mul: [work, zero("express_percent")] }, 100] }), 0] });
/** The next break's work, priced as the line would be at its quantity: setup, run, finishes, the features (one price a job), packing and proof, then express. */
const nextBeforeExpress = (features: boolean) => ({ add: [zero("setup"), "next_run", "next_extras", ...(features ? [zero("features_charge")] : []), "proof_charge"] });

/**
 * What a configured line costs, ex tax and without its delivery, and what it
 * weighs, each figure Adminium's and each shown on the quote's breakdown. The
 * rate card is read into the line as it stood when the line was written
 * (the settings' single figures, the stock's rate, the size's up-count, the
 * finishes' prices), so a rate changed later never re-prices a job already
 * taken.
 *
 * A sheet job is imposed on press sheets: `up` pieces a sheet (the size's own
 * count), `sheets` the quantity over it rounded up. Its print and its stock are
 * per sheet at the quantity break's multiplier; a roll stock on a sheet
 * product (vinyl stickers) is charged for the printed area of each sheet, not
 * for a square metre a sheet. Its finishes are by their basis; its packing by
 * the piece or the box. A large-format job is its own size: its stock by the
 * square metre, its edges by the metre or the piece, a canvas frame by the
 * square metre, and never less than the large-format minimum on that work.
 * A job's priced features (the Customiser's, printing a design's back) are
 * each one price for the job, added up from the rows it pays for. A printed
 * proof by post and express (a percentage of all the work) go on top. A sheet line never costs more than the next break's quantity would:
 * 999 flyers cost what 1000 do (`cap_charge` takes the difference off).
 *
 * The weight is the finished pieces' paper and the packing (a sheet job), or
 * the printed area, the frames and the tube or box (large format); whether
 * the line rolls into a tube (`rolls`) is large format that is not on a frame
 * and is no longer than the tube takes. The order sums both.
 */
function pricing(features: boolean): Column[] {
  const finishColumns = FINISH_LINES.flatMap(({ group, option: via, label }) => [
    money(`${group}_price`, `${label} price`, always(via, "unit_price")),
    choice(`${group}_basis`, `${label} charged by`, FINISH_BASES, { ...opt, rules: always(via, "finish_basis") }),
  ]);
  const finishCharges = FINISH_LINES.map(({ group, label }) => money(`${group}_charge`, label, { formula: cents({ mul: [`${group}_price`, unitsOf(`${group}_basis`, NOW_UNITS)] }) }));
  return [
    // The rate card's single figures, as they stood when the line was written.
    money("setup", "Setup", fromSetting("setup")),
    money("print_one", "Printing a sheet, one side", fromSetting("print_single")),
    money("print_two", "Printing a sheet, both sides", fromSetting("print_double")),
    figure("sheet_mm2", "int", "Press sheet area (mm²)", fromSetting("sheet_mm2")),
    money("proof_price", "Printed proof price", fromSetting("proof_post_price")),
    figure("express_percent", "decimal", "Express (+%)", fromSetting("express_percent"), 2),
    money("lf_minimum", "Large-format minimum", fromSetting("large_format_minimum")),
    figure("sheet_packing_kg", "decimal", "Packing, sheet work (kg)", fromSetting("sheet_packing_kg"), 2),
    figure("roll_packing_kg", "decimal", "Packing, large format (kg)", fromSetting("roll_packing_kg"), 2),
    figure("frame_grams", "int", "A frame weighs (g)", fromSetting("frame_grams")),
    figure("tube_max_mm", "int", "A tube takes up to (mm)", fromSetting("tube_max_mm")),
    // The stock, the size and the quantity break.
    money("material_rate", "Stock rate", always("material_id", "rate")),
    choice("material_kind", "Stock kind", MATERIAL_KINDS, { ...opt, rules: always("material_id", "kind") }),
    figure("gsm", "int", "Stock weight (gsm)", always("material_id", "gsm")),
    figure("up", "int", "Up on a sheet", always("size_id", "up")),
    figure("piece_mm2", "int", "A piece's area (mm²)", always("size_id", "area_mm2")),
    fk("break_id", "breaks", "Quantity break", { ...opt, rules: { band: { table: "breaks", min: "min_qty", value: "qty" } } }),
    figure("multiplier", "decimal", "Break multiplier", always("break_id", "multiplier"), 4),
    fk("next_break_id", "breaks", "Next break", { ...opt, rules: always("break_id", "next_id") }),
    figure("next_qty", "int", "Next break from", always("next_break_id", "min_qty")),
    figure("next_multiplier", "decimal", "Next break multiplier", always("next_break_id", "multiplier"), 4),
    ...finishColumns,
    money("packaging_price", "Packaging price", always("packaging_id", "price")),
    choice("packaging_basis", "Packaging charged by", PACKAGING_BASES, { ...opt, rules: always("packaging_id", "basis") }),
    { ref: "framed", type: "bool", nullable: true, label: l("On a frame"), rules: always("canvas_option_id", "framed") },
    // The run.
    money("print_rate", "Printing a sheet", { formula: { if: [{ eq: ["sides", 2] }, "print_two", "print_one"] } }),
    figure("sheets", "int", "Press sheets", { formula: ceilOf("qty", "up") }),
    // A sheet of a roll stock is charged for the area it prints.
    figure("sheet_rate", "decimal", "Stock a sheet", { formula: { if: [{ eq: ["material_kind", "roll"] }, { div: [{ mul: ["material_rate", "sheet_mm2"] }, 1000000] }, "material_rate"] } }, 4),
    figure("area_each", "decimal", "Area each (m²)", { formula: cents({ div: [{ mul: ["width_mm", "height_mm"] }, 1000000] }) }, 2),
    figure("area_total", "decimal", "Area (m²)", { formula: cents({ mul: ["area_each", "qty"] }) }, 2),
    figure("perimeter_m", "decimal", "Edge each (m)", { formula: cents({ div: [{ mul: [2, { add: ["width_mm", "height_mm"] }] }, 1000] }) }, 2),
    money("print_charge", "Print", { formula: cents({ mul: ["sheets", "print_rate", { coalesce: ["multiplier", 1] }] }) }),
    money("material_charge", "Material", {
      formula: { if: [isSheet, cents({ mul: ["sheets", "sheet_rate", { coalesce: ["multiplier", 1] }] }), cents({ mul: ["area_total", "material_rate"] })] },
    }),
    // Its finishing, and the large-format minimum on the work of the roll.
    ...finishCharges,
    money("minimum_charge", "Large-format minimum", {
      formula: { if: [isLarge, { max: [0, { sub: ["lf_minimum", { add: [zero("material_charge"), zero("edges_charge"), zero("canvas_charge")] }] }] }, 0] },
    }),
    money("finishing", "Finishing", { formula: { add: [...FINISH_LINES.map(({ group }) => zero(`${group}_charge`)), "minimum_charge"] } }),
    // The design's priced features: a job pays for each a row of its own (`job_features`); a saved quote's line takes none.
    ...(features ? [money("features_charge", "Design extras", { rollup: { from: "job_features", via: "job_id", sum: "price" } })] : []),
    money("packaging_charge", "Packaging", { formula: cents({ mul: ["packaging_price", packUnits("qty")] }) }),
    money("proof_charge", "Printed proof", { formula: { if: [yes("proof_by_post"), zero("proof_price"), 0] } }),
    money("before_express", "Work before express", { formula: beforeExpress(features) }),
    money("express_charge", "Express", { formula: expressOn("before_express") }),
    money("work", "Work", { formula: { add: ["before_express", "express_charge"] } }),
    // The next break's price, worked out as the line's own: a line never costs more.
    figure("next_sheets", "int", "Sheets at the next break", { formula: ceilOf("next_qty", "up") }),
    money("next_run", "Run at the next break", {
      formula: { add: [cents({ mul: ["next_sheets", "print_rate", "next_multiplier"] }), cents({ mul: ["next_sheets", "sheet_rate", "next_multiplier"] })] },
    }),
    money("next_extras", "Finishing and packing at the next break", {
      formula: { add: [...SHEET_FINISHES.map((group) => zero({ mul: [`${group}_price`, nextUnitsOf(`${group}_basis`)] })), zero({ mul: ["packaging_price", packUnits("next_qty")] })] },
    }),
    money("next_work", "Work at the next break", { formula: { add: [nextBeforeExpress(features), expressOn(nextBeforeExpress(features))] } }),
    money("cap_charge", "Capped at the next break", { formula: { if: [{ and: [isSheet, { lt: ["next_work", "work"] }] }, { sub: ["next_work", "work"] }, 0] } }),
    money("price", "Price (ex tax)", { formula: { add: ["work", "cap_charge"] } }),
    // The price a piece, ex tax: what the quantity chips and the quote panel say "each" by.
    money("each", "Price a piece (ex tax)", { formula: cents({ div: ["price", "qty"] }) }),
    // What it weighs, and how it travels.
    figure("weight_kg", "decimal", "Weight (kg)", {
      formula: {
        if: [
          isSheet,
          cents({ add: [{ div: [{ mul: ["qty", "piece_mm2", "gsm"] }, 1000000000] }, zero("sheet_packing_kg")] }),
          cents({ add: [{ div: [{ add: [{ mul: ["area_total", "gsm"] }, { if: [{ eq: ["framed", true] }, { mul: ["qty", zero("frame_grams")] }, 0] }] }, 1000] }, zero("roll_packing_kg")] }),
        ],
      },
    }, 2),
    figure("rolls", "int", "Rolls into a tube", {
      formula: { if: [isLarge, { if: [{ eq: ["framed", true] }, 0, { if: [{ lte: [{ max: ["width_mm", "height_mm"] }, "tube_max_mm"] }, 1, 0] }] }, 0] },
    }),
    figure("flat", "int", "Large format, not rolled", { formula: { if: [isLarge, { sub: [1, "rolls"] }, 0] } }),
    // Whether the line has a price: its order's goods count it, so a line with none never drops out of them unseen.
    figure("priced", "int", "Has a price", { formula: { if: [{ isNull: "price" }, 0, 1] } }),
  ];
}

/**
 * The money columns an order and a saved quote share: goods, one delivery,
 * tax, total. The goods are the lines' prices added up only while every line
 * has one: a line Adminium could not price leaves the goods, the tax and the
 * total empty, never a smaller sum that leaves it out.
 */
function basketMoney(lines: string, via: string, delivery: Record<string, unknown>): Column[] {
  return [
    choice("delivery_method", "Getting it", DELIVERY_METHODS, { default: "collect" }),
    figure("item_count", "int", "Jobs", { rollup: { from: lines, via, count: true } }),
    money("goods_sum", "Lines' prices added up", { rollup: { from: lines, via, sum: "price" } }),
    figure("priced_lines", "int", "Lines with a price", { rollup: { from: lines, via, sum: "priced" } }),
    money("goods_total", "Goods (ex tax)", { formula: GOODS }),
    figure("weight_kg", "decimal", "Weight (kg)", { rollup: { from: lines, via, sum: "weight_kg" } }, 2),
    // Rolled in a tube when it holds large format and every large-format line rolls; else one box by weight.
    figure("rolled_lines", "int", "Lines that roll", { rollup: { from: lines, via, sum: "rolls" } }),
    figure("flat_lines", "int", "Large format that doesn't roll", { rollup: { from: lines, via, sum: "flat" } }),
    figure("tube", "int", "In a tube", { formula: { if: [{ and: [{ gt: [zero("rolled_lines"), 0] }, { lte: [zero("flat_lines"), 0] }] }, 1, 0] } }),
    fk("delivery_band_id", "delivery_bands", "Delivery band", {
      ...opt,
      rules: { band: { table: "delivery_bands", min: "min_kg", max: "max_kg", value: "weight_kg", scope: [{ column: "tube", equals: "tube" }], over: "empty" } },
    }),
    money("band_price", "Band price", always("delivery_band_id", "price")),
    money("delivery", "Delivery", { formula: delivery }),
    figure("delivery_to_quote", "int", "Delivery to quote", { formula: DELIVERY_TO_QUOTE }),
    // The delivery as a priced figure, empty while the works is still to price it: what an e-mail prints.
    money("delivery_priced", "Delivery as priced", { formula: DELIVERY_PRICED }),
    money("subtotal", "Subtotal (ex tax)", { formula: SUBTOTAL }),
    figure("tax_rate", "decimal", "Tax rate (%)", fromSetting("tax_rate"), 2),
    money("tax", "Tax", { formula: TAX }),
    money("total", "Total", { formula: TOTAL }),
  ];
}

/**
 * With Inventory keeping the stock (the feature `stock`), sheets a run spoils
 * are taken off Inventory's shelf in the same save: the material is the row
 * Inventory links to its item. A delivery and a count are Inventory's own, on
 * its own pages.
 */
const SPOIL_POSTINGS = [
  {
    id: "spoiled",
    into: { addOn: "inventory", ledger: "stock", action: "use" },
    needs: "stock",
    post: { on: { create: true } },
    map: { what: "material_id", quantity: "qty", kind: { value: "written_off" } },
  },
];

// ── the tables ──────────────────────────────────────────────────────────────

export const TABLES: Table[] = [
  // ── the rate card ────────────────────────────────────────────────────────
  {
    ref: "settings",
    label: l("Works settings"),
    labelPlural: l("Works settings"),
    keyField: "works_name",
    columns: [
      id,
      text("works_name", 80, "Works name"),
      // A business's own address, phone and e-mail, shown on its pages: not a person's.
      text("address", 160, "Address", { ...opt, rules: { personal: false } }),
      text("phone", 32, "Phone", { ...opt, rules: { personal: false, validation: { format: "phone" } } }),
      text("email", 254, "Works e-mail", { ...opt, rules: { personal: false, validation: { format: "email" } } }),
      text("hours", 80, "Opening hours", opt),
      text("about", 400, "About the works", opt),
      // The order and quote numbers: their prefixes and the first number of each series.
      text("ref_prefix", 8, "Order number prefix", { default: "MP-" }),
      int("first_order_number", "First order number", { default: 1001, rules: { validation: { min: 1 } } }),
      text("quote_prefix", 8, "Quote number prefix", { default: "MQ-" }),
      int("first_quote_number", "First quote number", { default: 1001, rules: { validation: { min: 1 } } }),
      num("tax_rate", 2, "Tax rate (%)", { default: 20, rules: { validation: { min: 0, max: 50 } } }),
      // The rate card's single figures.
      price("setup", "Setup, per job", { default: 0, rules: { validation: { min: 0 } } }),
      // Printing a press sheet, by its sides.
      price("print_single", "Printing a press sheet, one side", { default: 0, rules: { validation: { min: 0 } } }),
      price("print_double", "Printing a press sheet, both sides", { default: 0, rules: { validation: { min: 0 } } }),
      int("standard_days", "Standard turnaround (working days)", { default: 3, rules: { validation: { min: 0, max: 60 } } }),
      int("express_days", "Express turnaround (working days)", { default: 1, rules: { validation: { min: 0, max: 60 } } }),
      num("express_percent", 2, "Express (+%)", { default: 35, rules: { validation: { min: 0, max: 200 } } }),
      price("proof_post_price", "Printed proof by post", { default: 0, rules: { validation: { min: 0 } } }),
      int("proof_post_days", "Printed proof adds (working days)", { default: 2, rules: { validation: { min: 0, max: 30 } } }),
      int("change_days", "A change asked adds (working days)", { default: 1, rules: { validation: { min: 0, max: 30 } } }),
      // The press sheet every sheet job is imposed on (SRA3), and the large-format work's least charge.
      int("sheet_width_mm", "Press sheet width (mm)", { default: 320, rules: { validation: { min: 50, max: 2000 } } }),
      int("sheet_height_mm", "Press sheet height (mm)", { default: 450, rules: { validation: { min: 50, max: 2000 } } }),
      // What a sheet prints, for a roll stock run on the sheet press.
      figure("sheet_mm2", "int", "Press sheet area (mm²)", { formula: { mul: ["sheet_width_mm", "sheet_height_mm"] } }),
      price("large_format_minimum", "Large-format minimum charge", { default: 0, rules: { validation: { min: 0 } } }),
      // A large-format job rolls into a tube up to this length; a longer one goes by weight.
      int("tube_max_mm", "Rolled in a tube up to (mm)", { default: 1500, rules: { validation: { min: 100, max: 5000 } } }),
      // What the packing adds to a parcel: a sheet job's, a large-format job's, a stretched canvas's frame.
      num("sheet_packing_kg", 2, "Packing, sheet work (kg)", { default: 0.2, rules: { validation: { min: 0, max: 50 } } }),
      num("roll_packing_kg", 2, "Packing, large format (kg)", { default: 0.3, rules: { validation: { min: 0, max: 50 } } }),
      int("frame_grams", "A canvas frame weighs (g)", { default: 900, rules: { validation: { min: 0, max: 20000 } } }),
      // The artwork the customer sends: the largest file, and the resolution the checks ask for.
      int("artwork_max_mb", "Artwork files up to (MB)", { default: 100, rules: { validation: { min: 1, max: 100 } } }),
      int("min_dpi", "Least resolution (dpi)", { default: 150, rules: { validation: { min: 72, max: 1200 } } }),
      bool("taking_orders", "Taking orders", true),
      bool("sample_packs", "Sending sample packs", true),
    ],
  },
  {
    ref: "materials",
    label: l("Material"),
    labelPlural: l("Materials"),
    keyField: "name",
    columns: [
      id,
      text("code", 32, "Code", { unique: true }),
      text("name", 80, "Name"),
      text("short_name", 40, "Short name", opt),
      text("spec", 80, "Spec", opt),
      choice("kind", "Kind", MATERIAL_KINDS),
      bool("coated", "Coated", false),
      int("gsm", "Weight (gsm)", { rules: { validation: { min: 1, max: 2000 } } }),
      // A sheet stock's price a press sheet; a roll's a square metre.
      price("rate", "Rate", { rules: { validation: { min: 0 } } }),
      int("roll_width_mm", "Roll width (mm)", { ...opt, rules: { validation: { min: 100, max: 5000 } } }),
      bool("active", "In use", true),
      int("position", "Position", opt),
    ],
  },
  {
    // The preset sheet sizes, with how many print on one press sheet.
    ref: "sizes",
    label: l("Size"),
    labelPlural: l("Sizes"),
    keyField: "name",
    columns: [
      id,
      text("code", 32, "Code", { unique: true }),
      text("name", 80, "Name"),
      int("width_mm", "Width (mm)", { rules: { validation: { min: 1, max: 2000 } } }),
      int("height_mm", "Height (mm)", { rules: { validation: { min: 1, max: 2000 } } }),
      // Up on a press sheet: the best of upright and turned, and each, for the ticket's imposition line.
      int("up", "Up on a sheet", { rules: { validation: { min: 1, max: 200 } } }),
      int("up_upright", "Up, upright", { ...opt, rules: { validation: { min: 0, max: 200 } } }),
      int("up_rotated", "Up, turned", { ...opt, rules: { validation: { min: 0, max: 200 } } }),
      // A piece's area, for its weight.
      figure("area_mm2", "int", "Area (mm²)", { formula: { mul: ["width_mm", "height_mm"] } }),
      // Printed straight onto the piece (an envelope), not cut from a sheet.
      bool("direct", "Printed direct", false),
      bool("active", "In use", true),
      int("position", "Position", opt),
    ],
  },
  {
    ref: "finishes",
    label: l("Finish"),
    labelPlural: l("Finishes"),
    keyField: "name",
    columns: [
      id,
      text("code", 32, "Code", { unique: true }),
      text("name", 80, "Name"),
      choice("group", "Group", FINISH_GROUPS),
      choice("basis", "Charged by", FINISH_BASES),
      price("price", "Price", { default: 0, rules: { validation: { min: 0 } } }),
      // How many of the basis a piece takes: a banner has two pole pockets.
      int("count", "A piece takes", { default: 1, rules: { validation: { min: 1, max: 20 } } }),
      bool("active", "Offered", true),
      int("position", "Position", opt),
    ],
  },
  {
    // The quantity breaks: a sheet job's print and material at a multiplier from a quantity on.
    ref: "breaks",
    label: l("Quantity break"),
    labelPlural: l("Quantity breaks"),
    keyField: "min_qty",
    columns: [
      id,
      int("min_qty", "From (quantity)", { unique: true, rules: { validation: { min: 1, max: 1000000 } } }),
      num("multiplier", 4, "Multiplier", { rules: { validation: { min: 0, max: 1 } } }),
      // The break above it: a line never costs more than that break's quantity would.
      fk("next_id", "breaks", "Next break up", opt),
    ],
  },
  {
    ref: "packaging",
    label: l("Packaging"),
    labelPlural: l("Packaging"),
    keyField: "name",
    columns: [
      id,
      text("code", 32, "Code", { unique: true }),
      text("name", 80, "Name"),
      choice("basis", "Charged by", PACKAGING_BASES),
      price("price", "Price", { default: 0, rules: { validation: { min: 0 } } }),
      // Which work it packs: sheet work is packed; large format goes rolled or boxed as it is.
      choice("product_kind", "Packs", PRODUCT_KINDS, { default: "sheet" }),
      bool("active", "Offered", true),
      int("position", "Position", opt),
    ],
  },
  {
    // One delivery for the whole order, by its weight; the tube for rolled large format.
    ref: "delivery_bands",
    label: l("Delivery band"),
    labelPlural: l("Delivery bands"),
    keyField: "name",
    unique: [["tube", "min_kg"]],
    columns: [
      id,
      text("code", 32, "Code", { unique: true }),
      text("name", 80, "Name"),
      int("tube", "Rolled in a tube", { default: 0, rules: { validation: { min: 0, max: 1 } } }),
      num("min_kg", 2, "From (kg)", { default: 0, rules: { validation: { min: 0 } } }),
      num("max_kg", 2, "Up to (kg)", { ...opt, rules: { validation: { min: 0 } } }),
      price("price", "Price", { rules: { validation: { min: 0 } } }),
      int("position", "Position", opt),
    ],
  },
  {
    ref: "products",
    label: l("Product"),
    labelPlural: l("Products"),
    keyField: "name",
    columns: [
      id,
      text("code", 32, "Code", { unique: true }),
      text("name", 80, "Name"),
      choice("family", "Family", FAMILIES),
      choice("kind", "Printed as", PRODUCT_KINDS),
      text("line", 160, "What it is", opt),
      // The quantity its "from" price is for.
      int("from_qty", "Priced from (quantity)", { default: 1, rules: { validation: { min: 1, max: 100000 } } }),
      // A large-format product's size to start from, and the largest it is made.
      int("default_width_mm", "Starting width (mm)", { ...opt, rules: { validation: { min: 50, max: 5000 } } }),
      int("default_height_mm", "Starting height (mm)", { ...opt, rules: { validation: { min: 50, max: 5000 } } }),
      int("max_width_mm", "Largest width (mm)", { ...opt, rules: { validation: { min: 50, max: 5000 } } }),
      int("max_height_mm", "Largest height (mm)", { ...opt, rules: { validation: { min: 50, max: 5000 } } }),
      text("icon", 32, "Icon", opt),
      picture("photo", "Photo"),
      // The Customiser's base this product is designed on: set, the product page offers "Choose a design" and "Start from blank".
      link("base_id", "bases", "Customiser base"),
      bool("published", "In the shop", true),
      int("position", "Position", opt),
    ],
  },
  {
    // One table for every option of a product: its materials, sizes, sides, finishes, and the Customiser's priced features.
    ref: "options",
    label: l("Option"),
    labelPlural: l("Options"),
    keyField: "name",
    unique: [["product_id", "kind", "code"]],
    columns: [
      id,
      fk("product_id", "products", "Product"),
      choice("kind", "Kind", OPTION_KINDS),
      text("code", 32, "Code", { rules: { normalize: "trim" } }),
      text("name", 80, "Name"),
      fk("material_id", "materials", "Stock", { ...opt, rules: { requiredWhen: { column: "kind", in: ["material"] } } }),
      fk("size_id", "sizes", "Preset size", { ...opt, rules: { requiredWhen: { column: "kind", in: ["size"] } } }),
      int("sides", "Printed sides", { ...opt, rules: { validation: { min: 1, max: 2 }, requiredWhen: { column: "kind", in: ["sides"] } } }),
      fk("finish_id", "finishes", "Finish", { ...opt, rules: { requiredWhen: { column: "kind", in: ["lamination", "spot_uv", "corners", "edges", "canvas"] } } }),
      // A material: the stock is coated. A lamination or a spot UV: it needs a coated surface under it.
      bool("coated", "Coated surface", false),
      // A canvas finish on a frame: it can't be rolled into a tube, and the frame adds weight.
      bool("framed", "On a frame", false),
      // A finish's price and basis, kept in step with the finish; its price a piece takes (two pole pockets).
      money("finish_price", "Finish price", { copy: { via: "finish_id", from: "price", mode: "always", follow: true } }),
      choice("finish_basis", "Finish charged by", FINISH_BASES, { ...opt, rules: { copy: { via: "finish_id", from: "basis", mode: "always", follow: true } } }),
      figure("finish_count", "int", "A piece takes", { copy: { via: "finish_id", from: "count", mode: "always", follow: true } }),
      money("unit_price", "Finish price a piece", { formula: { mul: ["finish_price", { coalesce: ["finish_count", 1] }] } }),
      // A feature: its price, flat for the job, and the Customiser's feature it pays for, by its code.
      price("price", "Price", { default: 0, rules: { validation: { min: 0 } } }),
      text("feature_code", 40, "Feature code", { ...opt, rules: { requiredWhen: { column: "kind", in: ["feature"] } } }),
      link("feature_id", "features", "Customiser feature"),
      // The choice the configurator starts on, of its kind.
      bool("preselected", "Chosen first", false),
      bool("active", "Offered", true),
      int("position", "Position", opt),
    ],
  },
  {
    // Which finish is not offered on what, in the words the configurator shows beside it.
    ref: "option_rules",
    label: l("Option rule"),
    labelPlural: l("Option rules"),
    keyField: "reason",
    columns: [
      id,
      choice("finish_group", "Finish", FINISH_GROUPS),
      choice("test", "Not offered", RULE_TESTS),
      int("gsm", "Heavier than (gsm)", { ...opt, rules: { validation: { min: 1, max: 2000 }, requiredWhen: { column: "test", in: ["over_gsm"] } } }),
      text("reason", 200, "Reason shown"),
      bool("active", "In effect", true),
      int("position", "Position", opt),
    ],
  },

  // ── the works ────────────────────────────────────────────────────────────
  {
    ref: "machines",
    label: l("Machine"),
    labelPlural: l("Machines"),
    keyField: "name",
    columns: [
      id,
      text("code", 32, "Code", { unique: true }),
      text("name", 80, "Name"),
      choice("kind", "Kind", { press: "Sheet press", wide: "Wide format", finishing: "Finishing" }),
      text("detail", 120, "Detail", opt),
      bool("active", "In use", true),
      int("position", "Position", opt),
    ],
  },
  {
    ref: "closures",
    label: l("Closure"),
    labelPlural: l("Closures"),
    keyField: "reason",
    columns: [
      id,
      // The public holiday from Holiday calendars this closure was added for ("Add as a closure" on the works'
      // price list writes its day and name in; they stay the works' to change).
      { ref: "holiday_id", type: "int", nullable: true, label: l("Public holiday"), rules: { addOnLink: { addOn: HOLIDAYS, table: "holidays" } } },
      date("from_date", "From"),
      date("to_date", "To"),
      text("reason", 120, "Reason", opt),
      // Switched off, a closure is kept but no longer closes the works.
      bool("active", "In effect", true),
    ],
  },

  // ── customers and orders ─────────────────────────────────────────────────
  {
    ref: "customers",
    label: l("Customer"),
    labelPlural: l("Customers"),
    keyField: "email",
    columns: [
      id,
      text("email", 254, "E-mail", { ...opt, unique: true, semantic: "email", rules: { normalize: "email", validation: { format: "email" } } }),
      text("name", 80, "Name or business", opt),
      language("language"),
      // "News from the print works": kept in step with Adminium's consent log, set by the tick at checkout.
      bool("may_email", "News from the print works", false),
      at("forgotten_at", "Details deleted", opt),
      at("created_at", "First order", { ...opt, rules: stamp("now", onCreate) }),
    ],
  },
  {
    ref: "orders",
    keep: KEPT_FOR_TAX,
    label: l("Order"),
    labelPlural: l("Orders"),
    keyField: "number",
    states: {
      column: "status",
      initial: "placed",
      moves: {
        // Ready once none of its jobs is still on the floor.
        placed: [{ to: "ready", requires: { where: [{ column: "jobs_on_floor", eq: 0 }] } }, "cancelled"],
        ready: ["collected", "dispatched", "placed"],
      },
      lock: { when: ["collected", "dispatched", "cancelled"], except: ["link_stopped", "tracking"] },
    },
    columns: [
      id,
      int("number_seq", "Number (running)", { ...opt, rules: { sequence: { gapless: true, startSetting: setting("first_order_number") } } }),
      text("number", 16, "Number", { ...opt, unique: true, rules: { format: { from: "number_seq", prefixSetting: setting("ref_prefix") } } }),
      // The number as a typed code is read: what the order lookup finds it by.
      text("number_code", 16, "Number as typed", { ...opt, unique: true, rules: { formula: { join: ["number", " "] }, normalize: "code" } }),
      choice("status", "Status", ORDER_STATUSES, {
        default: "placed",
        tones: { placed: "info", ready: "accent", collected: "pos", dispatched: "pos", cancelled: "danger" },
      }),
      // Who it is for: the customer's own details, kept with the order. An address only for a delivery.
      text("name", 80, "Name or business", { semantic: "name" }),
      text("email", 254, "E-mail", { semantic: "email", rules: { validation: { format: "email" } } }),
      text("address_line1", 120, "Address", { ...opt, rules: { requiredWhen: { column: "delivery_method", in: ["deliver"] } } }),
      text("address_line2", 120, "Address, second line", opt),
      text("town", 80, "Town", { ...opt, rules: { requiredWhen: { column: "delivery_method", in: ["deliver"] } } }),
      text("postcode", 16, "Postcode", { ...opt, rules: { requiredWhen: { column: "delivery_method", in: ["deliver"] } } }),
      language("language"),
      fk("customer_id", "customers", "Customer", opt),
      ...basketMoney("jobs", "order_id", DELIVERY),
      // The DHL service the customer chose, which Dispatch books when DHL is on.
      text("dhl_service", 32, "DHL service", opt),
      // Over the delivery bands: the works types the delivery's price and sends it; the customer accepts it.
      price("delivery_quote", "Delivery quote", { ...opt, rules: { validation: { min: 0 } } }),
      choice("delivery_quote_state", "Delivery quote", DELIVERY_QUOTE_STATES, { ...opt, tones: { to_quote: "warn", sent: "info", accepted: "pos" } }),
      // What the order comes to with the works' quote on it, as the quote's e-mail and page show it.
      money("quote_tax", "Tax with the delivery quote", { formula: QUOTED_TAX }),
      money("quote_total", "Total with the delivery quote", { formula: { add: [QUOTED_SUBTOTAL, "quote_tax"] } }),
      at("delivery_quote_sent_at", "Delivery quote sent", { ...opt, rules: stamp("now", onState("delivery_quote_state", "sent")) }),
      at("delivery_quote_accepted_at", "Delivery quote accepted", { ...opt, rules: stamp("now", onState("delivery_quote_state", "accepted")) }),
      // Artwork warnings the customer accepted at checkout, on all its jobs.
      figure("warnings_accepted", "int", "Warnings accepted", { rollup: { from: "jobs", via: "order_id", sum: "warnings_accepted" } }),
      figure("has_warnings", "int", "Has accepted warnings", { formula: { if: [{ gt: ["warnings_accepted", 0] }, 1, 0] } }),
      at("placed_at", "Placed", { ...opt, rules: stamp("now", onCreate) }),
      // How many of its jobs are still in prepress, on the press or in finishing.
      figure("jobs_on_floor", "int", "Jobs still on the floor", { rollup: { from: "jobs", via: "order_id", sum: "on_floor" } }),
      // The day the last of its jobs is ready: its latest job's.
      date("ready_by", "Ready by", { ...opt, rules: { rollup: { from: "jobs", via: "order_id", latest: { of: "ready_by", by: "ready_by" } } } }),
      at("ready_at", "Ready", { ...opt, rules: stamp("now", onState("status", "ready")) }),
      at("collected_at", "Collected", { ...opt, rules: stamp("now", onState("status", "collected")) }),
      at("dispatched_at", "Dispatched", { ...opt, rules: stamp("now", onState("status", "dispatched")) }),
      text("handed_over_by", 80, "Handed over by", { ...opt, rules: stamp("user-name", onState("status", "collected", "dispatched")) }),
      // A tracking number comes only through DHL.
      text("tracking", 64, "Tracking number", opt),
      at("cancelled_at", "Cancelled", { ...opt, rules: stamp("now", onState("status", "cancelled")) }),
      text("cancel_reason", 160, "Why it was cancelled", opt),
      // The order's own link, e-mailed to the customer: no staff screen reads or copies it.
      text("link_token", 16, "Link code", { ...opt, rules: { code: { length: 16, hiddenFromStaff: true } } }),
      // The link works for a year after the order.
      at("link_expires", "Link works until", { ...opt, rules: stamp({ moment: { column: "placed_at", plus: { days: 365 } } }, { columns: ["placed_at"] }) }),
      bool("link_stopped", "Link stopped", false),
      // The customer's retry key: a retried order lands on the same row.
      text("client_key", 64, "Retry key", { ...opt, unique: true }),
      // The tick the customer gave at checkout: theirs, written by nobody else.
      bool("may_email", "News from the print works", false),
    ],
  },
  {
    // One configured line of an order: what is printed, its options, its ready-by and where it is on the floor.
    ref: "jobs",
    keep: KEPT_FOR_TAX,
    label: l("Job"),
    labelPlural: l("Jobs"),
    keyField: "product_name",
    states: {
      column: "stage",
      initial: "prepress",
      moves: {
        // Nothing goes to press before its proof is approved.
        prepress: [{ to: "printing", requires: { where: [{ column: "proof_ok", eq: 1 }] } }, "cancelled"],
        printing: ["finishing", "ready", { to: "prepress", roles: ["owner"] }],
        finishing: ["ready", { to: "printing", roles: ["owner"] }],
        ready: ["collected", "dispatched", { to: "finishing", roles: ["owner"] }],
      },
    },
    check: { by: { addOn: CUSTOMISER }, design: "design_id", paid: { table: "job_features", via: "job_id", feature: "feature" } },
    postings: [DESIGN_POSTING],
    columns: [
      id,
      fk("order_id", "orders", "Order", { index: true }),
      int("position", "Position", opt),
      ...configuration(true),
      // A design in the Customiser, found by its code: the customer's browser sends the code, Adminium fills the link.
      text("design_code", 40, "Design code", opt),
      link("design_id", "designs", "Design", { lookup: { from: "design_code", table: { addOn: CUSTOMISER, table: "designs" }, column: "code" } }),
      // How long the work takes, as the rate card said when the job came in.
      figure("standard_days", "int", "Standard days", fromSetting("standard_days")),
      figure("express_days", "int", "Express days", fromSetting("express_days")),
      figure("proof_post_days", "int", "Proof post days", fromSetting("proof_post_days")),
      figure("change_days", "int", "Days a change adds", fromSetting("change_days")),
      // Its proofs: the latest one's answer, the changes asked, and the proofs the works posted.
      choice("proof_state", "Proof", PROOF_STATE_LABELS, { ...opt, rules: { rollup: { from: "proofs", via: "job_id", latest: { of: "state", by: "version" } } } }),
      figure("changes", "int", "Changes asked", { rollup: { from: "proofs", via: "job_id", count: true, where: { column: "state", eq: "change_asked" } } }),
      figure("posted_proofs", "int", "Proofs by post", { rollup: { from: "proofs", via: "job_id", count: true, where: { column: "kind", eq: "post" } } }),
      figure("proof_ok", "int", "Ready for press", { formula: PROOF_OK }),
      figure("turnaround_days", "int", "Working days to ready", { formula: { add: [WORK_DAYS, PROOF_WAIT_DAYS] } }),
      // Counted from the order coming in, and again from the moment a change is asked or the proof approved.
      date("ready_by", "Ready by", {
        ...opt,
        rules: stamp(
          {
            addWorkingDays: {
              from: "now",
              days: "turnaround_days",
              weekdays: WORKING_DAYS,
              cutoff: CUTOFF,
              closures: { table: "closures", from: "from_date", to: "to_date", active: "active" },
            },
          },
          [onCreate, onState("proof_state", "approved"), { columns: ["turnaround_days"] }],
        ),
      }),
      // Its artwork: how many files, and the warnings the customer accepted on them.
      figure("artwork_count", "int", "Artwork files", { rollup: { from: "artwork", via: "job_id", count: true } }),
      figure("warnings_accepted", "int", "Warnings accepted", { rollup: { from: "artwork", via: "job_id", count: true, where: { column: "accepted", eq: true } } }),
      choice("stage", "Stage", STAGE_LABELS, {
        default: "prepress",
        tones: { prepress: "info", printing: "warn", finishing: "accent", ready: "pos", collected: "neutral", dispatched: "neutral", cancelled: "danger" },
      }),
      // Prepress has looked the files over: the customer's stage strip says "Artwork checked".
      bool("artwork_checked", "Artwork checked", false),
      at("artwork_checked_at", "Artwork checked", { ...opt, rules: stamp("now", { column: "artwork_checked", values: [true] }) }),
      at("printing_at", "On the press", { ...opt, rules: stamp("now", onState("stage", "printing")) }),
      at("finishing_at", "Into finishing", { ...opt, rules: stamp("now", onState("stage", "finishing")) }),
      at("ready_at", "Ready", { ...opt, rules: stamp("now", onState("stage", "ready")) }),
      text("printed_by", 80, "Printed by", { ...opt, rules: stamp("user-name", onState("stage", "printing")) }),
      at("handed_over_at", "Handed over", { ...opt, rules: stamp("now", onState("stage", "collected", "dispatched")) }),
      // Still on the floor: in prepress, on the press or in finishing. Its order is ready once none is.
      figure("on_floor", "int", "On the floor", { formula: ON_FLOOR }),
      // What its runs spoiled, added up: sheets for sheet work, metres of the roll for large format.
      figure("spoiled_sheets", "decimal", "Spoiled", { rollup: { from: "spoils", via: "job_id", sum: "qty" } }, 2),
      text("works_note", 280, "Works note", opt),
    ],
  },
  {
    // The Customiser's priced features a job pays for: one a row, each named by its option.
    ref: "job_features",
    keep: KEPT_FOR_TAX,
    label: l("Feature on a job"),
    labelPlural: l("Features on jobs"),
    keyField: "feature",
    unique: [["job_id", "option_id"]],
    columns: [
      id,
      fk("job_id", "jobs", "Job"),
      fk("option_id", "options", "Option", {
        rules: { linkable: { where: [{ column: "kind", eq: "feature" }, { column: "active", eq: true }], same: [{ column: "product_id", as: "job_id.product_id" }] } },
      }),
      text("feature", 40, "Feature", { ...opt, rules: always("option_id", "feature_code") }),
      // The Customiser's feature itself, for the works' screens: a link into an add-on is a person's to name, never a copy.
      link("feature_id", "features", "Customiser feature"),
      text("name", 80, "Name", { ...opt, rules: always("option_id", "name") }),
      money("price", "Price", always("option_id", "price")),
    ],
  },
  {
    // A file the customer sent for a job, with the checks their browser showed them and whether they accepted its warnings.
    ref: "artwork",
    label: l("Artwork"),
    labelPlural: l("Artwork"),
    keyField: "name",
    columns: [
      id,
      fk("job_id", "jobs", "Job", { index: true }),
      text("name", 160, "File name"),
      text("file", 64, "File", {
        ...opt,
        rules: { file: { accept: ["pdf", "jpeg", "tiff"], maxBytes: 104857600, upload: { kinds: ["pdf", "jpg", "tiff"], maxBytes: 104857600 } } },
      }),
      choice("side", "Side", { front: "Front", back: "Back", both: "Both sides" }, opt),
      // What the checks said, as shown: each row's level and words. Advice: a person checks every file.
      { ref: "checks", type: "json", nullable: true, label: l("Checks shown") },
      bool("accepted", "Warnings accepted", false),
      at("uploaded_at", "Sent", { ...opt, rules: stamp("now", onCreate) }),
    ],
  },
  {
    // A proof of a job: a PDF the works sends, numbered per job. The customer approves it or asks for a change.
    ref: "proofs",
    label: l("Proof"),
    labelPlural: l("Proofs"),
    keyField: "version",
    states: {
      column: "state",
      initial: "sent",
      moves: {
        sent: ["approved", "change_asked", "superseded"],
        change_asked: ["superseded"],
      },
    },
    columns: [
      id,
      fk("order_id", "orders", "Order"),
      fk("job_id", "jobs", "Job", { index: true }),
      int("version", "Proof", { ...opt, rules: { sequence: { gapless: true, scope: "job_id", sample: true } } }),
      // By e-mail, or printed and posted: the order's choice, or the works' own at its cost.
      choice("kind", "Sent", { email: "By e-mail", post: "Printed, by post" }, { default: "email" }),
      text("file", 64, "Proof PDF", { ...opt, rules: { file: { accept: ["pdf"], maxBytes: 104857600 } } }),
      // The Customiser's version of the design this proof shows, when the job has one.
      link("design_version_id", "design_versions", "Design version"),
      text("note", 280, "Note to the customer", opt),
      choice("state", "Answer", PROOF_STATE_LABELS, { default: "sent", tones: { sent: "info", approved: "pos", change_asked: "warn", superseded: "neutral" } }),
      // What the customer asked to change, in their words.
      text("change_note", 400, "What to change", opt),
      at("sent_at", "Sent", { ...opt, rules: stamp("now", onCreate) }),
      text("sent_by", 80, "Sent by", { ...opt, rules: stamp("user-name", onCreate) }),
      at("answered_at", "Answered", { ...opt, rules: stamp("now", onState("state", "approved", "change_asked")) }),
    ],
  },
  {
    // Sheets a job's run spoiled (metres of the roll for large format): one row each time the press says so.
    ref: "spoils",
    label: l("Spoilage"),
    labelPlural: l("Spoilage"),
    keyField: "qty",
    postings: SPOIL_POSTINGS,
    columns: [
      id,
      fk("job_id", "jobs", "Job", { index: true }),
      fk("order_id", "orders", "Order", { ...opt, rules: always("job_id", "order_id") }),
      // The stock the job runs on: what Inventory takes the spoiled sheets off.
      fk("material_id", "materials", "Stock", { ...opt, rules: always("job_id", "material_id") }),
      num("qty", 2, "Spoiled", { rules: { validation: { min: 0.01, max: 5000 } } }),
      text("note", 200, "Note", opt),
      at("spoiled_at", "Recorded", { ...opt, rules: stamp("now", onCreate) }),
      text("spoiled_by", 80, "Recorded by", { ...opt, rules: stamp("user-name", onCreate) }),
    ],
  },
  {
    // A quote the customer saved: its own MQ- number, the same rate card and the same totals as an order.
    ref: "saved_quotes",
    label: l("Saved quote"),
    labelPlural: l("Saved quotes"),
    keyField: "number",
    columns: [
      id,
      int("number_seq", "Number (running)", { ...opt, rules: { sequence: { gapless: true, startSetting: setting("first_quote_number") } } }),
      text("number", 16, "Number", { ...opt, unique: true, rules: { format: { from: "number_seq", prefixSetting: setting("quote_prefix") } } }),
      // The customer's own name for it; they may rename it.
      text("label", 80, "Name", opt),
      text("name", 80, "Name or business", { ...opt, semantic: "name" }),
      text("email", 254, "E-mail", { semantic: "email", rules: { validation: { format: "email" } } }),
      language("language"),
      fk("customer_id", "customers", "Customer", opt),
      ...basketMoney("quote_lines", "quote_id", QUOTE_DELIVERY),
      at("created_at", "Saved", { ...opt, rules: stamp("now", onCreate) }),
      // The quote's own link, e-mailed to the customer.
      text("link_token", 16, "Link code", { ...opt, rules: { code: { length: 16, hiddenFromStaff: true } } }),
      at("link_expires", "Link works until", { ...opt, rules: stamp({ moment: { column: "created_at", plus: { days: 365 } } }, { columns: ["created_at"] }) }),
      bool("link_stopped", "Link stopped", false),
      text("client_key", 64, "Retry key", { ...opt, unique: true }),
    ],
  },
  {
    ref: "quote_lines",
    label: l("Quote line"),
    labelPlural: l("Quote lines"),
    keyField: "product_name",
    columns: [
      id,
      fk("quote_id", "saved_quotes", "Quote", { index: true }),
      int("position", "Position", opt),
      ...configuration(false),
      // A design the customer made for it, kept so the quote orders again with it: found by its code, as a job's is.
      text("design_code", 40, "Design code", opt),
      link("design_id", "designs", "Design", { lookup: { from: "design_code", table: { addOn: CUSTOMISER, table: "designs" }, column: "code" } }),
    ],
  },
  {
    // A free pack of the works' papers and finishes: one to an address.
    ref: "sample_requests",
    label: l("Sample pack"),
    labelPlural: l("Sample packs"),
    keyField: "name",
    states: { column: "status", initial: "new", moves: { new: ["posted"] } },
    columns: [
      id,
      choice("status", "Status", { new: "To post", posted: "Posted" }, { default: "new", tones: { new: "info", posted: "pos" } }),
      text("name", 80, "Name or business", { semantic: "name" }),
      text("email", 254, "E-mail", { semantic: "email", rules: { validation: { format: "email" } } }),
      text("address_line1", 120, "Address", { rules: { normalize: "trim" } }),
      text("address_line2", 120, "Address, second line", opt),
      text("town", 80, "Town"),
      text("postcode", 16, "Postcode", { rules: { normalize: "code" } }),
      // The address as one code, upper case without spaces: a second pack to it is refused.
      text("address_key", 160, "Address as a code", { ...opt, unique: true, rules: { formula: { join: ["postcode", "address_line1"] }, normalize: "code" } }),
      language("language"),
      at("created_at", "Asked", { ...opt, rules: stamp("now", onCreate) }),
      at("posted_at", "Posted", { ...opt, rules: stamp("now", onState("status", "posted")) }),
      text("posted_by", 80, "Posted by", { ...opt, rules: stamp("user-name", onState("status", "posted")) }),
      text("client_key", 64, "Retry key", { ...opt, unique: true }),
    ],
  },
  {
    // A stock the customer ticked to see in their sample pack: one a row.
    ref: "sample_stocks",
    label: l("Stock in a sample pack"),
    labelPlural: l("Stocks in sample packs"),
    keyField: "material_id",
    unique: [["request_id", "material_id"]],
    columns: [
      id,
      fk("request_id", "sample_requests", "Sample pack"),
      fk("material_id", "materials", "Stock", { rules: { linkable: { where: [{ column: "active", eq: true }] } } }),
    ],
  },
  {
    ref: "messages",
    label: l("E-mail"),
    labelPlural: l("E-mails"),
    keyField: "kind",
    columns: [
      id,
      choice("kind", "Kind", KIND_NAMES),
      choice("status", "Status", { queued: "Going out", sent: "Sent", failed: "Not sent", skipped: "Skipped" }, {
        default: "queued",
        tones: { queued: "info", sent: "pos", failed: "danger", skipped: "neutral" },
      }),
      text("to_address", 254, "Sent to", { ...opt, semantic: "email" }),
      text("language", 16, "Language", opt),
      fk("order_id", "orders", "Order", opt),
      fk("proof_id", "proofs", "Proof", opt),
      fk("quote_id", "saved_quotes", "Quote", opt),
      fk("sample_id", "sample_requests", "Sample pack", opt),
      fk("customer_id", "customers", "Customer", opt),
      at("due", "Due", opt),
      at("created_at", "Created", { ...opt, rules: stamp("now", onCreate) }),
      at("sent_at", "Sent", opt),
      text("error", 500, "What went wrong", opt),
      text("repeat_key", 64, "Resend key", opt),
      choice("skip_reason", "Why it was skipped", {
        overtaken: "A later e-mail took its place",
        paid: "Paid",
        void: "Void",
        "no-longer-needed": "No longer needed",
        "by-hand": "Skipped by hand",
      }, opt),
    ],
  },
];

export const TABLE_REFS = TABLES.map((t) => t.ref);

/** The figures a line, an order and a quote are priced by: each Adminium's, never typed. */
export const PRICED = [
  "jobs.price",
  "jobs.weight_kg",
  "quote_lines.price",
  "quote_lines.weight_kg",
  "orders.tube",
  "saved_quotes.tube",
] as const;

/**
 * A line's quote, as its breakdown shows it: each amount ex tax, in the order
 * the quote panel lists them, and the line's price at the bottom. An empty
 * amount is a line the job does not take.
 */
export const BREAKDOWN = [
  "setup",
  "print_charge",
  "material_charge",
  ...FINISH_LINES.map(({ group }) => `${group}_charge` as const),
  "minimum_charge",
  "packaging_charge",
  "proof_charge",
  "express_charge",
  "cap_charge",
  "price",
] as const;

/** A job's breakdown line a saved quote's line has not: the design's priced features. */
export const JOB_BREAKDOWN = ["features_charge"] as const;

/** What the breakdown's words are counted from: sheets, up, the rates and the break. */
export const BREAKDOWN_DETAIL = [
  "each",
  "up",
  "sheets",
  "print_rate",
  "sheet_rate",
  "material_rate",
  "multiplier",
  "next_qty",
  "area_each",
  "area_total",
  "perimeter_m",
  ...FINISH_LINES.map(({ group }) => `${group}_price` as const),
  "packaging_price",
  "express_percent",
  "weight_kg",
  "rolls",
] as const;
