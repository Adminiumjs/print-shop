/**
 * A small Marlow Press for the works' tests, as Adminium would answer it at
 * the comp's pinned moment (Wednesday 5 August 2026, 10:20 in Marlow): the
 * stored figures (a job's sheets, up, area, ready-by and proof state, an
 * order's weight, delivery and totals) are written in as the server keeps
 * them, because the screens only read them.
 *
 * Tests only; nothing that ships imports it.
 */
import type { Action, Person, Table, WorksData, WorksFacts } from "../door.ts";
import type { Row } from "../wire.ts";

/** 10:20 on Wednesday 5 August 2026 in Marlow (British Summer Time). */
export const WEDNESDAY = Date.parse("2026-08-05T09:20:00Z");

export const FACTS: WorksFacts = { zone: "Europe/London", currency: "GBP", workingDays: ["mon", "tue", "wed", "thu", "fri"], cutoff: "14:00", addOns: ["customiser"], carrier: null, connectionId: "conn-1" };

const r = (row: Record<string, unknown> & { id: number }): Row => row;

/** A stored proof file, as the files route's `url` reference spells it. */
export const PROOF_FILE = "/api/v1/files/file_01J8Z6Q3M4N5P6R7S8T9V0W1X2/content";
export const DESIGN_PROOF = "/api/v1/files/file_01J8Z6Q3M4N5P6R7S8T9V0W1XA/content";
export const ARTWORK_FILE = "/api/v1/files/file_01J8Z6Q3M4N5P6R7S8T9V0W1XB/content";

/** A sheet job's stored figures, with what differs. */
const sheetJob = (row: Record<string, unknown> & { id: number }): Row =>
  r({ product_kind: "sheet", width_mm: null, height_mm: null, express: false, proof_by_post: false, standard_days: 3, express_days: 1, proof_post_days: 2, change_days: 1, artwork_checked: true, spoiled_sheets: 0, design_id: null, on_floor: 1, ...row });

export function fixture(): WorksData {
  return {
    settings: r({
      id: 1,
      works_name: "Marlow Press",
      address: "3 Market Square, Marlow SL7 1AA",
      phone: "01628 482 190",
      email: "hello@marlowpress.example",
      hours: "Mon–Fri, 8:00–17:00",
      setup: "18.00",
      print_single: "0.85",
      print_double: "1.20",
      express_percent: "35",
      proof_post_price: "12.00",
      proof_post_days: 2,
      large_format_minimum: "35.00",
      sheet_width_mm: 320,
      sheet_height_mm: 450,
      tax_rate: "20",
      taking_orders: true,
      sample_packs: true,
    }),
    products: [
      r({ id: 1, code: "business-cards", name: "Business cards", family: "card", kind: "sheet", icon: "credit-card", published: true }),
      r({ id: 2, code: "flyers", name: "Flyers & leaflets", family: "paper", kind: "sheet", icon: "file-text", published: true }),
      r({ id: 3, code: "pvc-banners", name: "PVC banners", family: "banner", kind: "large", icon: "flag", published: true }),
      r({ id: 4, code: "stickers", name: "Stickers & labels", family: "sticker", kind: "sheet", icon: "sticker", published: true }),
    ],
    options: [
      r({ id: 11, product_id: 1, kind: "material", name: "350gsm silk board", material_id: 1, active: true }),
      r({ id: 12, product_id: 1, kind: "size", name: "Business card", size_id: 1, active: true }),
      r({ id: 13, product_id: 1, kind: "sides", name: "Both sides", sides: 2, active: true }),
      r({ id: 14, product_id: 1, kind: "lamination", name: "Lamination, both sides", finish_basis: "sheet", unit_price: "0.95", active: true }),
      r({ id: 21, product_id: 2, kind: "material", name: "170gsm silk", material_id: 2, active: true }),
      r({ id: 22, product_id: 2, kind: "size", name: "A5", size_id: 2, active: true }),
      r({ id: 31, product_id: 3, kind: "material", name: "510gsm PVC banner", material_id: 3, active: true }),
      r({ id: 32, product_id: 3, kind: "edges", name: "Hemmed & eyeletted", finish_basis: "metre", unit_price: "6.00", active: true }),
      r({ id: 33, product_id: 3, kind: "edges", name: "Plain edges", finish_basis: "none", unit_price: "0", active: true }),
    ],
    materials: [
      r({ id: 1, code: "silk350", name: "350gsm silk board", short_name: "350gsm silk board", kind: "sheet", coated: true, gsm: 350, rate: "0.42", active: true, position: 1 }),
      r({ id: 2, code: "silk170", name: "170gsm silk", short_name: "170gsm silk", kind: "sheet", coated: true, gsm: 170, rate: "0.14", active: true, position: 2 }),
      r({ id: 3, code: "pvc510", name: "510gsm PVC banner", short_name: "510gsm PVC", kind: "roll", coated: false, gsm: 510, rate: "28.00", roll_width_mm: 1370, active: true, position: 3 }),
      r({ id: 4, code: "vinyl", name: "Self-adhesive vinyl", short_name: "self-adhesive vinyl", kind: "roll", coated: false, gsm: 300, rate: "34.00", roll_width_mm: 1370, active: true, position: 4 }),
    ],
    sizes: [
      r({ id: 1, code: "bcard", name: "Business card", width_mm: 85, height_mm: 55, up: 21, up_upright: 21, up_rotated: 18, direct: false, active: true }),
      r({ id: 2, code: "a5", name: "A5", width_mm: 148, height_mm: 210, up: 4, up_upright: 4, up_rotated: 3, direct: false, active: true }),
      r({ id: 3, code: "a6", name: "A6", width_mm: 105, height_mm: 148, up: 8, up_upright: 8, up_rotated: 6, direct: false, active: true }),
    ],
    finishes: [
      r({ id: 1, code: "lam-one", name: "Lamination, one side", group: "lamination", basis: "sheet", price: "0.55", active: true }),
      r({ id: 2, code: "lam-both", name: "Lamination, both sides", group: "lamination", basis: "sheet", price: "0.95", active: true }),
      r({ id: 3, code: "lam-soft", name: "Soft-touch lamination", group: "lamination", basis: "sheet", price: "1.20", active: true }),
      r({ id: 4, code: "spot-uv", name: "Spot UV", group: "spot_uv", basis: "sheet", price: "2.40", active: true }),
      r({ id: 5, code: "corners", name: "Round corners", group: "corners", basis: "per_250", price: "6.00", active: true }),
      r({ id: 6, code: "hemmed", name: "Hemmed & eyeletted", group: "edges", basis: "metre", price: "6.00", active: true }),
      r({ id: 7, code: "pockets", name: "Pole pockets", group: "edges", basis: "piece", price: "9.00", count: 2, active: true }),
      r({ id: 8, code: "stretched", name: "Stretched on a 38mm frame", group: "canvas", basis: "m2", price: "22.00", active: true }),
    ],
    breaks: [
      r({ id: 1, min_qty: 25, multiplier: "1" }),
      r({ id: 2, min_qty: 50, multiplier: "0.92" }),
      r({ id: 3, min_qty: 100, multiplier: "0.84" }),
      r({ id: 4, min_qty: 250, multiplier: "0.74" }),
      r({ id: 5, min_qty: 500, multiplier: "0.66" }),
      r({ id: 6, min_qty: 1000, multiplier: "0.58" }),
    ],
    packaging: [
      r({ id: 1, code: "bundled", name: "Bundled in 50s", basis: "included", price: "0", product_kind: "sheet", active: true }),
      r({ id: 2, code: "shrink", name: "Shrink-wrapped", basis: "unit", price: "0.04", product_kind: "sheet", active: true }),
      r({ id: 3, code: "boxed", name: "Boxed", basis: "per_500", price: "4.50", product_kind: "sheet", active: true }),
    ],
    bands: [
      r({ id: 1, code: "light", name: "Up to 2kg", tube: 0, min_kg: "0", max_kg: "2", price: "6.50" }),
      r({ id: 2, code: "mid", name: "Up to 10kg", tube: 0, min_kg: "2.01", max_kg: "10", price: "9.80" }),
      r({ id: 3, code: "heavy", name: "Up to 30kg", tube: 0, min_kg: "10.01", max_kg: "30", price: "16.40" }),
      r({ id: 4, code: "tube", name: "Rolled tube, up to 1.5m", tube: 1, min_kg: "0", max_kg: "30", price: "14.00" }),
    ],
    machines: [
      r({ id: 1, code: "press", name: "Sheet press", kind: "press", active: true }),
      r({ id: 2, code: "roll", name: "Wide roll printer", kind: "wide", active: true }),
    ],
    closures: [r({ id: 1, from_date: "2026-08-31", to_date: "2026-08-31", reason: "Summer bank holiday", active: true })],
    orders: [
      r({ id: 4126, number: "MP-4126", status: "placed", name: "Harbour Bakery", email: "hello@harbourbakery.example", delivery_method: "collect", weight_kg: "1.02", delivery: "0", goods_total: "70.96", total: "85.15", ready_by: "2026-08-10" }),
      r({ id: 4123, number: "MP-4123", status: "placed", name: "Two Rivers Cycles", email: "ride@tworivers.example", delivery_method: "deliver", address_line1: "Mill Lane", town: "Henley", postcode: "RG9 1AA", weight_kg: "3.36", delivery: "14.00", goods_total: "294.00", total: "369.60", ready_by: "2026-08-06" }),
      r({ id: 4122, number: "MP-4122", status: "placed", name: "Ostara Flowers", email: "hi@ostara.example", delivery_method: "collect", weight_kg: "1.56", ready_by: "2026-08-06" }),
      r({ id: 4121, number: "MP-4121", status: "placed", name: "Kestrel Joinery", email: "office@kestrel.example", delivery_method: "collect", weight_kg: "0.47", ready_by: "2026-08-05" }),
      r({ id: 4125, number: "MP-4125", status: "placed", name: "Fenwick & Sons", email: "post@fenwick.example", delivery_method: "collect", weight_kg: "2.23", ready_by: "2026-08-07" }),
      r({ id: 4119, number: "MP-4119", status: "ready", name: "Marsh Lane Dental", email: "desk@marshlane.example", delivery_method: "deliver", address_line1: "12 Marsh Lane", town: "Marlow", postcode: "SL7 2BB", weight_kg: "1.55", delivery: "6.50", dhl_service: "N", ready_by: "2026-08-04" }),
      r({ id: 4115, number: "MP-4115", status: "ready", name: "Fenwick & Sons", email: "post@fenwick.example", delivery_method: "collect", weight_kg: "0.34", ready_by: "2026-08-04" }),
      r({ id: 4127, number: "MP-4127", status: "placed", name: "Harbour Bakery", email: "hello@harbourbakery.example", delivery_method: "deliver", address_line1: "1 Quay Street", town: "Marlow", postcode: "SL7 3CC", weight_kg: "53.2", delivery: "0", delivery_to_quote: 1, delivery_quote_state: null, ready_by: "2026-08-10" }),
    ],
    jobs: [
      sheetJob({ id: 1, order_id: 4126, position: 1, product_id: 1, product_name: "Business cards", qty: 500, material_option_id: 11, material_id: 1, size_option_id: 12, size_id: 1, sides: 2, lamination_option_id: 14, look: "matt", packaging_id: 3, up: 21, sheets: 24, stage: "printing", proof_state: "approved", proof_ok: 1, ready_by: "2026-08-10", weight_kg: "1.02", price: "70.96" }),
      sheetJob({ id: 2, order_id: 4122, position: 1, product_id: 2, product_name: "Flyers & leaflets", qty: 250, material_option_id: 21, material_id: 2, size_option_id: 22, size_id: 2, sides: 2, packaging_id: 1, up: 4, sheets: 63, stage: "prepress", proof_state: null, proof_ok: 0, artwork_checked: false, ready_by: "2026-08-06" }),
      sheetJob({ id: 3, order_id: 4121, position: 1, product_id: 4, product_name: "Stickers & labels", qty: 100, material_option_id: 21, material_id: 2, size_option_id: 22, size_id: 3, sides: 1, packaging_id: 1, up: 8, sheets: 13, stage: "prepress", proof_state: "sent", proof_ok: 0, ready_by: "2026-08-05" }),
      sheetJob({ id: 4, order_id: 4125, position: 1, product_id: 2, product_name: "Flyers & leaflets", qty: 250, material_option_id: 21, material_id: 2, size_option_id: 22, size_id: 2, sides: 1, packaging_id: 1, up: 4, sheets: 63, stage: "finishing", proof_state: "approved", proof_ok: 1, ready_by: "2026-08-07", spoiled_sheets: "10" }),
      r({ id: 5, order_id: 4123, position: 1, product_id: 3, product_name: "PVC banners", product_kind: "large", qty: 3, material_option_id: 31, material_id: 3, width_mm: 2000, height_mm: 1000, sides: 1, edges_option_id: 32, area_each: "2", area_total: "6", rolls: 0, stage: "prepress", proof_state: "approved", proof_ok: 1, ready_by: "2026-08-06", standard_days: 3, express_days: 1, express: false, artwork_checked: true, spoiled_sheets: 0, on_floor: 1 }),
      sheetJob({ id: 6, order_id: 4119, position: 1, product_id: 2, product_name: "Flyers & leaflets", qty: 500, material_option_id: 21, material_id: 2, size_option_id: 22, size_id: 2, sides: 1, packaging_id: 1, up: 4, sheets: 125, stage: "ready", proof_state: "approved", proof_ok: 1, ready_by: "2026-08-04", weight_kg: "1.55", on_floor: 0 }),
      sheetJob({ id: 7, order_id: 4115, position: 1, product_id: 1, product_name: "Business cards", qty: 100, material_option_id: 11, material_id: 1, size_option_id: 12, size_id: 1, sides: 1, packaging_id: 1, up: 21, sheets: 5, stage: "ready", proof_state: "approved", proof_ok: 1, ready_by: "2026-08-04", on_floor: 0 }),
      sheetJob({ id: 8, order_id: 4127, position: 1, product_id: 1, product_name: "Business cards", qty: 500, material_option_id: 11, material_id: 1, size_option_id: 12, size_id: 1, sides: 2, packaging_id: 3, up: 21, sheets: 24, stage: "prepress", proof_state: "sent", proof_ok: 0, ready_by: "2026-08-10", design_id: 70, design_code: "HB-CARD" }),
      sheetJob({ id: 9, order_id: 4127, position: 2, product_id: 2, product_name: "Flyers & leaflets", qty: 5000, material_option_id: 21, material_id: 2, size_option_id: 22, size_id: 2, sides: 2, packaging_id: 3, up: 4, sheets: 1250, stage: "prepress", proof_state: null, proof_ok: 0, ready_by: "2026-08-10" }),
    ],
    artwork: [
      r({ id: 1, job_id: 1, name: "harbour-front.pdf", file: ARTWORK_FILE, side: "front", accepted: false, checks: { language: "en-US", rows: [{ check: "bleed", level: "pos", text: "Bleed 3mm on all four edges." }, { check: "dpi", level: "pos", text: "Pictures at 300dpi." }] } }),
      r({ id: 2, job_id: 1, name: "harbour-back.pdf", file: ARTWORK_FILE, side: "back", accepted: true, checks: JSON.stringify({ language: "en-US", rows: [{ check: "colour", level: "warn", text: "RGB colours — they will shift a little in print." }] }) }),
      r({ id: 3, job_id: 3, name: "kestrel-sticker.pdf", file: ARTWORK_FILE, side: "front", accepted: false, checks: { language: "en-US", rows: [{ check: "bleed", level: "pos", text: "Bleed 3mm on all four edges." }] } }),
    ],
    proofs: [
      r({ id: 1, order_id: 4126, job_id: 1, version: 1, kind: "email", file: PROOF_FILE, note: "Proof by email.", state: "approved", sent_at: "2026-07-31T09:00:00.000Z", answered_at: "2026-08-01T09:00:00.000Z" }),
      r({ id: 2, order_id: 4121, job_id: 3, version: 1, kind: "email", file: PROOF_FILE, note: "Cut line shown in magenta.", state: "sent", sent_at: "2026-08-04T09:00:00.000Z" }),
      r({ id: 3, order_id: 4123, job_id: 5, version: 1, kind: "email", file: PROOF_FILE, note: null, state: "change_asked", change_note: "Make the logo bigger.", sent_at: "2026-08-03T09:00:00.000Z", answered_at: "2026-08-03T15:00:00.000Z" }),
      r({ id: 4, order_id: 4123, job_id: 5, version: 2, kind: "email", file: PROOF_FILE, note: "Second proof.", state: "approved", sent_at: "2026-08-04T09:00:00.000Z", answered_at: "2026-08-04T12:00:00.000Z" }),
      r({ id: 5, order_id: 4127, job_id: 8, version: 1, kind: "email", file: DESIGN_PROOF, note: "Made from the customer's design in the customiser.", state: "sent", sent_at: "2026-08-04T09:00:00.000Z" }),
    ],
    spoils: [r({ id: 1, job_id: 4, order_id: 4125, material_id: 2, qty: "10", spoiled_at: "2026-08-04T14:00:00.000Z" })],
    designs: [r({ id: 70, code: "HB-CARD", state: "ordered" })],
    versions: [r({ id: 700, design_id: 70, version: 1, proof_file: DESIGN_PROOF })],
    files: [r({ id: 7000, version_id: 700, kind: "print", name: "hb-card-print.pdf", about: "CMYK PDF, 3mm bleed", file: DESIGN_PROOF, position: 1 })],
    links: [],
    stock: [],
    shipments: [],
  };
}

/** Who is signed in, with these of the app's roles: what the manifest grants each, by table. */
export function person(roles: string[], name = "Rosa Marlow"): Person {
  const owner = roles.includes("owner");
  const grants: Record<string, Partial<Record<Table, Action[]>>> = {
    prepress: { jobs: ["read", "update"], proofs: ["read", "create", "update"], orders: ["read"], materials: ["read"], settings: ["read"], spoils: ["read"] },
    press: { jobs: ["read", "update"], orders: ["read", "update"], spoils: ["read", "create"], materials: ["read"], settings: ["read"], proofs: ["read"] },
    counter: { jobs: ["read", "update"], orders: ["read", "update"], materials: ["read"], settings: ["read"], proofs: ["read"], spoils: ["read"] },
  };
  return {
    name,
    roles,
    can: (table: Table, action: Action) => owner || roles.some((role) => grants[role]?.[table]?.includes(action) ?? false),
  };
}
