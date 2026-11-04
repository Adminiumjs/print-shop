/**
 * The Print Shop section in the dashboard: its pages, their forms and the
 * groups they sit in.
 *
 * The works' own screens (Today's board, the job ticket, the price list) are
 * the app's staff side, on their own address; these pages are the records
 * behind them: orders and their jobs, proofs and artwork, saved quotes and
 * sample packs, the rate card, the works' machines and closures, the
 * customers, the e-mails and the settings.
 *
 * Forms are v2 documents. A value Adminium works out (a total, a number, a
 * stamp) shows in a form and cannot be typed over.
 */
import { l, titles } from "./labels.ts";

export const NAV_GROUPS = [
  { key: "orders", label: l("Orders"), order: 1 },
  { key: "rates", label: l("Rate card"), order: 2 },
  { key: "works", label: l("Works"), order: 3 },
  { key: "people", label: l("People"), order: 4 },
  { key: "manage", label: l("Manage"), order: 5 },
];

type Field = Record<string, unknown>;
const f = (column: string, more: Field = {}): Field => ({ column, ...more });
const title = (column: string): Field => ({ column, control: "title", span: 2 });
const wide = (column: string, control = "textarea"): Field => ({ column, control, span: 2 });
const toggle = (column: string): Field => ({ column, control: "toggle-row" });
const ref = (column: string): Field => ({ column, control: "reference" });
const money = (column: string): Field => ({ column, control: "currency" });
const number = (column: string): Field => ({ column, control: "number" });
const when = (column: string): Field => ({ column, control: "datetime" });
const rows = (relation: string, columns: Field[]): Field => ({ relation, control: "child-rows", span: 2, columns });
const form = (...sections: Field[][]) => ({
  form: { v: 2, sections: sections.map((fields, i) => ({ id: `s${String(i + 1)}`, fields })) },
});

/** A job's or a quote line's configuration, in its form. */
const CONFIG_FIELDS: Field[] = [
  ref("product_id"),
  f("qty", { control: "stepper" }),
  ref("material_option_id"),
  ref("size_option_id"),
  number("width_mm"),
  number("height_mm"),
  ref("sides_option_id"),
  ref("lamination_option_id"),
  f("look", { control: "segmented" }),
  ref("spot_uv_option_id"),
  ref("corners_option_id"),
  ref("edges_option_id"),
  ref("canvas_option_id"),
  ref("packaging_id"),
  toggle("proof_by_post"),
  toggle("express"),
];

/** An order's or a quote's money, in its form. */
const MONEY_FIELDS: Field[] = [
  f("delivery_method", { control: "segmented" }),
  number("weight_kg"),
  number("tube"),
  ref("delivery_band_id"),
  money("delivery"),
  money("goods_total"),
  money("subtotal"),
  number("tax_rate"),
  money("tax"),
  money("total"),
];

interface PageSpec {
  ref: string;
  title: string;
  group: string;
  icon: string;
  order: number;
  table: string;
  config: Record<string, unknown>;
}

const SPECS: PageSpec[] = [
  // ── orders ─────────────────────────────────────────────────────────────────
  {
    ref: "printing-orders",
    title: "Orders",
    group: "orders",
    icon: "receipt",
    order: 1,
    table: "orders",
    config: form(
      [title("number"), f("status", { control: "segmented" }), when("placed_at"), f("ready_by", { control: "date" })],
      [f("name"), f("email", { control: "email" }), f("address_line1"), f("address_line2"), f("town"), f("postcode"), f("language")],
      [
        rows("jobs", [
          { column: "product_id", control: "reference", width: "2fr" },
          { column: "qty", width: "90px" },
          { column: "stage", width: "110px" },
          { column: "ready_by", width: "120px" },
          { column: "price", control: "currency", width: "110px" },
        ]),
      ],
      MONEY_FIELDS,
      [f("dhl_service"), money("delivery_quote"), f("delivery_quote_state", { control: "segmented" }), when("delivery_quote_sent_at"), when("delivery_quote_accepted_at")],
      [when("ready_at"), when("collected_at"), when("dispatched_at"), f("handed_over_by"), f("tracking"), when("cancelled_at"), wide("cancel_reason", "text")],
      [ref("customer_id"), number("warnings_accepted"), when("link_expires"), toggle("link_stopped")],
    ),
  },
  {
    ref: "printing-jobs",
    title: "Jobs",
    group: "orders",
    icon: "clipboard-list",
    order: 2,
    table: "jobs",
    config: form(
      [title("product_name"), ref("order_id"), f("stage", { control: "segmented" }), f("ready_by", { control: "date" })],
      CONFIG_FIELDS,
      [money("price"), number("weight_kg"), f("design_code")],
      [f("proof_state", { control: "segmented" }), number("changes"), number("turnaround_days"), toggle("artwork_checked"), number("artwork_count"), number("warnings_accepted")],
      [when("printing_at"), f("printed_by"), when("finishing_at"), when("ready_at"), when("handed_over_at"), number("spoiled_sheets"), wide("works_note", "text")],
    ),
  },
  {
    ref: "printing-proofs",
    title: "Proofs",
    group: "orders",
    icon: "file-check",
    order: 3,
    table: "proofs",
    config: form(
      [ref("order_id"), ref("job_id"), number("version"), f("state", { control: "segmented" })],
      [f("kind", { control: "segmented" }), f("file"), wide("note", "text"), wide("change_note", "text")],
      [when("sent_at"), f("sent_by"), when("answered_at")],
    ),
  },
  {
    ref: "printing-artwork",
    title: "Artwork",
    group: "orders",
    icon: "file-image",
    order: 4,
    table: "artwork",
    config: form([ref("job_id"), title("name"), f("file"), f("side", { control: "segmented" }), toggle("accepted"), when("uploaded_at")]),
  },
  {
    ref: "printing-quotes",
    title: "Saved quotes",
    group: "orders",
    icon: "bookmark",
    order: 5,
    table: "saved_quotes",
    config: form(
      [title("number"), f("label"), when("created_at")],
      [f("name"), f("email", { control: "email" }), f("language"), ref("customer_id")],
      [
        rows("quote_lines", [
          { column: "product_id", control: "reference", width: "2fr" },
          { column: "qty", width: "90px" },
          { column: "price", control: "currency", width: "110px" },
        ]),
      ],
      MONEY_FIELDS,
      [when("link_expires"), toggle("link_stopped")],
    ),
  },
  {
    ref: "printing-samples",
    title: "Sample packs",
    group: "orders",
    icon: "package-open",
    order: 6,
    table: "sample_requests",
    config: form(
      [title("name"), f("status", { control: "segmented" }), when("created_at")],
      [f("email", { control: "email" }), f("address_line1"), f("address_line2"), f("town"), f("postcode"), f("language")],
      [when("posted_at"), f("posted_by")],
    ),
  },

  // ── the rate card ───────────────────────────────────────────────────────────
  {
    ref: "printing-products",
    title: "Products",
    group: "rates",
    icon: "package",
    order: 1,
    table: "products",
    config: form(
      [title("name"), f("code"), f("family", { control: "select" }), f("kind", { control: "segmented" }), wide("line", "text"), f("from_qty", { control: "number" })],
      [number("default_width_mm"), number("default_height_mm"), number("max_width_mm"), number("max_height_mm")],
      [f("photo", { control: "image" }), f("icon")],
      [toggle("published"), f("position", { control: "stepper" })],
    ),
  },
  {
    ref: "printing-options",
    title: "Options",
    group: "rates",
    icon: "list-checks",
    order: 2,
    table: "options",
    config: form(
      [title("name"), ref("product_id"), f("kind", { control: "select" }), f("code")],
      [ref("material_id"), ref("size_id"), number("sides"), ref("finish_id"), toggle("coated")],
      [money("price"), f("feature_code")],
      [toggle("preselected"), toggle("active"), f("position", { control: "stepper" })],
    ),
  },
  {
    ref: "printing-materials",
    title: "Materials",
    group: "rates",
    icon: "layers",
    order: 3,
    table: "materials",
    config: form(
      [title("name"), f("code"), f("short_name"), f("spec"), f("kind", { control: "segmented" }), toggle("coated"), number("gsm")],
      [money("rate"), number("roll_width_mm"), toggle("active"), f("position", { control: "stepper" })],
    ),
  },
  {
    ref: "printing-sizes",
    title: "Sizes",
    group: "rates",
    icon: "ruler",
    order: 4,
    table: "sizes",
    config: form([title("name"), f("code"), number("width_mm"), number("height_mm"), number("up"), number("up_upright"), number("up_rotated"), toggle("direct"), toggle("active"), f("position", { control: "stepper" })]),
  },
  {
    ref: "printing-finishes",
    title: "Finishes",
    group: "rates",
    icon: "sparkles",
    order: 5,
    table: "finishes",
    config: form([title("name"), f("code"), f("group", { control: "select" }), f("basis", { control: "select" }), money("price"), number("count"), toggle("active"), f("position", { control: "stepper" })]),
  },
  {
    ref: "printing-breaks",
    title: "Quantity breaks",
    group: "rates",
    icon: "chart-no-axes-column-decreasing",
    order: 6,
    table: "breaks",
    config: form([number("min_qty"), number("multiplier")]),
  },
  {
    ref: "printing-packaging",
    title: "Packaging",
    group: "rates",
    icon: "box",
    order: 7,
    table: "packaging",
    config: form([title("name"), f("code"), f("basis", { control: "select" }), money("price"), f("product_kind", { control: "segmented" }), toggle("active"), f("position", { control: "stepper" })]),
  },
  {
    ref: "printing-delivery",
    title: "Delivery bands",
    group: "rates",
    icon: "truck",
    order: 8,
    table: "delivery_bands",
    config: form([title("name"), f("code"), number("tube"), number("min_kg"), number("max_kg"), money("price"), f("position", { control: "stepper" })]),
  },
  {
    ref: "printing-rules",
    title: "Option rules",
    group: "rates",
    icon: "ban",
    order: 9,
    table: "option_rules",
    config: form([f("finish_group", { control: "select" }), f("test", { control: "select" }), number("gsm"), wide("reason", "text"), toggle("active"), f("position", { control: "stepper" })]),
  },

  // ── the works ───────────────────────────────────────────────────────────────
  {
    ref: "printing-machines",
    title: "Machines",
    group: "works",
    icon: "printer",
    order: 1,
    table: "machines",
    config: form([title("name"), f("code"), f("kind", { control: "segmented" }), f("detail"), toggle("active"), f("position", { control: "stepper" })]),
  },
  {
    ref: "printing-closures",
    title: "Closures",
    group: "works",
    icon: "calendar-x",
    order: 2,
    table: "closures",
    config: form([f("from_date", { control: "date" }), f("to_date", { control: "date" }), wide("reason", "text"), toggle("active")]),
  },

  // ── people ───────────────────────────────────────────────────────────────────
  {
    ref: "printing-customers",
    title: "Customers",
    group: "people",
    icon: "contact",
    order: 1,
    table: "customers",
    config: form([title("name"), f("email", { control: "email" }), f("language"), toggle("may_email"), when("created_at"), when("forgotten_at")]),
  },

  // ── the e-mails and the settings ────────────────────────────────────────────
  {
    ref: "printing-messages",
    title: "E-mails",
    group: "manage",
    icon: "message-square",
    order: 1,
    table: "messages",
    config: form([
      f("kind", { control: "select" }),
      f("status", { control: "select" }),
      f("to_address", { control: "email" }),
      f("language"),
      ref("order_id"),
      ref("proof_id"),
      ref("quote_id"),
      ref("sample_id"),
      ref("customer_id"),
      when("due"),
      when("sent_at"),
      f("skip_reason", { control: "select" }),
      wide("error", "text"),
    ]),
  },
  {
    ref: "printing-settings",
    title: "Settings",
    group: "manage",
    icon: "settings",
    order: 2,
    table: "settings",
    config: form(
      [title("works_name"), f("phone", { control: "phone" }), f("email", { control: "email" }), wide("address", "text"), f("hours"), wide("about")],
      [f("ref_prefix"), number("first_order_number"), f("quote_prefix"), number("first_quote_number"), number("tax_rate"), toggle("taking_orders"), toggle("sample_packs")],
      [money("setup"), number("standard_days"), number("express_days"), number("express_percent"), money("proof_post_price"), number("proof_post_days"), number("change_days")],
      [number("sheet_width_mm"), number("sheet_height_mm"), money("large_format_minimum"), number("tube_max_mm"), number("sheet_packing_kg"), number("roll_packing_kg"), number("frame_grams")],
      [number("artwork_max_mb"), number("min_dpi")],
    ),
  },
];

/** A page as the manifest carries it. */
const pageOf = (spec: PageSpec) => ({
  ref: spec.ref,
  template: "page-crud",
  title: { key: `mft.${spec.ref.replaceAll("-", ".")}`, fallback: spec.title },
  titles: titles(spec.title),
  nav: { group: spec.group, icon: spec.icon, order: spec.order },
  bindings: { rows: spec.table },
  config: spec.config,
});

export function pages(): unknown[] {
  return SPECS.map(pageOf);
}

/** Every page's ref, in order (the owner's role grants them by name). */
export const PAGE_REFS = SPECS.map((spec) => spec.ref);
