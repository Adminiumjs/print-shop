/**
 * Marlow Press's rate card, as its sample installs it into Adminium: the
 * works' settings row (its details and the card's single figures), its stocks,
 * sizes, finishes, quantity breaks, packaging, delivery bands and the rules on
 * which finish goes on what. The comps' own figures (`marlow-press-data.js`).
 *
 * Its own module, with no JSON beside it, so the works' screens can show the
 * card as Adminium holds it without the rest of the sample.
 */
type Row = Record<string, unknown>;

// ── the works and its rate card ─────────────────────────────────────────────

/** The works' settings row: its details and the rate card's single figures. */
export const SETTINGS = {
  "@label": "settings",
  works_name: "Marlow Press",
  address: "3 Market Square, Marlow SL7 1AA",
  phone: "01628 482 190",
  email: "hello@marlowpress.example",
  hours: "Mon–Fri, 8:00–17:00",
  about: "A print works on the market square: business cards and flyers on the sheet press, banners and canvas off the roll, and a person who checks every file.",
  ref_prefix: "MP-",
  first_order_number: 4127,
  quote_prefix: "MQ-",
  first_quote_number: 2042,
  tax_rate: 20,
  setup: 18,
  print_single: 0.85,
  print_double: 1.2,
  standard_days: 3,
  express_days: 1,
  express_percent: 35,
  proof_post_price: 12,
  proof_post_days: 2,
  change_days: 1,
  sheet_width_mm: 320,
  sheet_height_mm: 450,
  large_format_minimum: 35,
  tube_max_mm: 1500,
  sheet_packing_kg: 0.2,
  roll_packing_kg: 0.3,
  frame_grams: 900,
  artwork_max_mb: 100,
  min_dpi: 150,
  taking_orders: true,
  sample_packs: true,
} satisfies Row;

interface Material {
  code: string;
  name: string;
  short: string;
  spec: string;
  kind: "sheet" | "roll";
  coated: boolean;
  gsm: number;
  /** A sheet stock's price a press sheet; a roll's a square metre. */
  rate: number;
  rollWidth?: number;
}
/** The stocks the rate card prices (`marlow-press-data.js` 88-97), the rolls' widths from the shelf (466-476). */
export const MATERIALS: Material[] = [
  { code: "silk350", name: "350gsm silk board", short: "350gsm silk board", spec: "350gsm · silk coated", kind: "sheet", coated: true, gsm: 350, rate: 0.42 },
  { code: "uncoated300", name: "300gsm uncoated board", short: "300gsm uncoated", spec: "300gsm · uncoated", kind: "sheet", coated: false, gsm: 300, rate: 0.38 },
  { code: "silk170", name: "170gsm silk", short: "170gsm silk", spec: "170gsm · silk coated", kind: "sheet", coated: true, gsm: 170, rate: 0.14 },
  { code: "silk130", name: "130gsm silk", short: "130gsm silk", spec: "130gsm · silk coated", kind: "sheet", coated: true, gsm: 130, rate: 0.11 },
  { code: "pvc510", name: "510gsm PVC banner", short: "510gsm PVC", spec: "510gsm · PVC", kind: "roll", coated: false, gsm: 510, rate: 28, rollWidth: 1370 },
  { code: "mesh270", name: "270gsm mesh banner", short: "270gsm mesh", spec: "270gsm · mesh, wind-through", kind: "roll", coated: false, gsm: 270, rate: 32, rollWidth: 1370 },
  { code: "canvas380", name: "380gsm cotton canvas", short: "380gsm canvas", spec: "380gsm · cotton canvas", kind: "roll", coated: false, gsm: 380, rate: 46, rollWidth: 1120 },
  { code: "vinyl", name: "Self-adhesive vinyl", short: "self-adhesive vinyl", spec: "self-adhesive · matt vinyl", kind: "roll", coated: false, gsm: 300, rate: 34, rollWidth: 1370 },
];

/** The preset sizes and how many print up on a press sheet (data 111-122). */
export const SIZES = [
  { code: "bcard", name: "Business card", w: 85, h: 55, up: 21, upright: 21, rotated: 18 },
  { code: "a6", name: "A6", w: 105, h: 148, up: 8, upright: 8, rotated: 6 },
  { code: "a5", name: "A5", w: 148, h: 210, up: 4, upright: 4, rotated: 3 },
  { code: "a4", name: "A4", w: 210, h: 297, up: 2, upright: 1, rotated: 2 },
  { code: "a3", name: "A3", w: 297, h: 420, up: 1, upright: 1, rotated: 1 },
  { code: "dl", name: "DL", w: 210, h: 99, up: 6, upright: 4, rotated: 6 },
  { code: "usletter", name: "US Letter", w: 216, h: 279, up: 2, upright: 1, rotated: 2 },
  { code: "dlenv", name: "DL envelope", w: 220, h: 110, up: 4, upright: 4, rotated: 4, direct: true },
  { code: "c5", name: "C5 envelope", w: 229, h: 162, up: 4, upright: 4, rotated: 4, direct: true },
  { code: "sq95", name: "Square 95mm", w: 95, h: 95, up: 12, upright: 12, rotated: 12 },
];

/** The finishes, by group, and how each is charged (`RATE`, data 66-85; lamination by sides, data 213-218). */
export const FINISHES = [
  { code: "lam-one", name: "Lamination, one side", group: "lamination", basis: "sheet", price: 0.55 },
  { code: "lam-both", name: "Lamination, both sides", group: "lamination", basis: "sheet", price: 0.95 },
  { code: "lam-soft", name: "Soft-touch lamination", group: "lamination", basis: "sheet", price: 1.2 },
  { code: "spot-uv", name: "Spot UV", group: "spot_uv", basis: "sheet", price: 2.4 },
  { code: "corners", name: "Round corners", group: "corners", basis: "per_250", price: 6 },
  { code: "plain", name: "Plain edges", group: "edges", basis: "none", price: 0 },
  { code: "hemmed", name: "Hemmed & eyeletted", group: "edges", basis: "metre", price: 6 },
  { code: "pockets", name: "Pole pockets", group: "edges", basis: "piece", price: 9, count: 2 },
  { code: "rolled", name: "Rolled", group: "canvas", basis: "none", price: 0 },
  { code: "stretched", name: "Stretched on a 38mm frame", group: "canvas", basis: "m2", price: 22 },
] as const;

/** The quantity breaks: a multiplier on a sheet job's print and material (data 72-75). */
export const BREAKS = [
  { min: 25, multiplier: 1 },
  { min: 50, multiplier: 0.92 },
  { min: 100, multiplier: 0.84 },
  { min: 250, multiplier: 0.74 },
  { min: 500, multiplier: 0.66 },
  { min: 1000, multiplier: 0.58 },
];

export const PACKAGING = [
  { code: "bundled", name: "Bundled in 50s", basis: "included", price: 0 },
  { code: "shrink", name: "Shrink-wrapped", basis: "unit", price: 0.04 },
  { code: "boxed", name: "Boxed", basis: "per_500", price: 4.5 },
];

/** One band on the basket's weight, and the tube for rolled large format (data 84, 395-402). Over 30 kg is quoted by hand. */
export const DELIVERY_BANDS = [
  { code: "light", name: "Up to 2kg", tube: 0, min: 0, max: 2, price: 6.5 },
  { code: "mid", name: "Up to 10kg", tube: 0, min: 2.01, max: 10, price: 9.8 },
  { code: "heavy", name: "Up to 30kg", tube: 0, min: 10.01, max: 30, price: 16.4 },
  { code: "tube", name: "Rolled tube, up to 1.5m", tube: 1, min: 0, max: 30, price: 14 },
];

/** Which finish is not offered on what, in the comp's words (data 219-244). */
export const OPTION_RULES = [
  { group: "lamination", test: "uncoated", reason: "Lamination isn't offered on an uncoated stock — lamination needs a coated stock." },
  { group: "lamination", test: "roll", reason: "Lamination isn't offered on large-format media." },
  { group: "spot_uv", test: "no_lamination", reason: "Spot UV needs a laminated surface — add a lamination first." },
  { group: "corners", test: "over_gsm", gsm: 350, reason: "Round corners aren't offered above 350gsm." },
];
