/**
 * A stand-in for Adminium behind the shop's door, for the screens' tests: a
 * few of Marlow Press's products and its rate card's rows, and a dry run
 * that answers each job's and the order's figures in the shape the
 * manifest's columns answer them. Its figures are its own: it is not
 * Adminium, and the contract test (`src/contract/`) places the order on a
 * real one.
 *
 * Tests only; nothing that ships imports it.
 */
import type { CustomiserApi } from "../../vendor/customiser/index.js";
import { ShopError, type Catalogue, type Figures, type Id, type JobNode, type Option, type OrderBody, type Placed, type Product, type Refused, type Row, type ShopConfig, type ShopPort, type Uploaded } from "./port.ts";

const product = (p: Partial<Product> & Pick<Product, "id" | "code" | "name" | "family" | "kind">): Product => ({
  line: null,
  fromQty: 100,
  defaultWidth: null,
  defaultHeight: null,
  maxWidth: null,
  maxHeight: null,
  icon: null,
  photo: null,
  baseId: null,
  ...p,
});

const option = (o: Partial<Option> & Pick<Option, "id" | "productId" | "kind" | "code" | "name">): Option => ({
  materialId: null,
  sizeId: null,
  sides: null,
  finishId: null,
  coated: false,
  price: "0",
  featureCode: null,
  preselected: false,
  ...o,
});

export function sampleCatalogue(): Catalogue {
  return {
    products: [
      product({ id: 1, code: "business-cards", name: "Business cards", family: "card", kind: "sheet", line: "Printed one or both sides on heavy board, trimmed square.", icon: "credit-card", baseId: 101 }),
      product({ id: 2, code: "letterheads", name: "Letterheads", family: "paper", kind: "sheet", line: "Your heading on good stock, one or both sides.", icon: "file-text" }),
      product({ id: 3, code: "pvc-banners", name: "PVC banners", family: "banner", kind: "large", line: "Outdoor banner by the metre, finished to hang.", icon: "flag", fromQty: 1, defaultWidth: 1200, defaultHeight: 2000 }),
    ],
    options: [
      option({ id: 10, productId: 1, kind: "material", code: "silk350", name: "350gsm silk board", materialId: 1, coated: true, preselected: true }),
      option({ id: 11, productId: 1, kind: "material", code: "uncoated300", name: "300gsm uncoated board", materialId: 2 }),
      option({ id: 12, productId: 1, kind: "size", code: "bcard", name: "Business card", sizeId: 1, preselected: true }),
      option({ id: 13, productId: 1, kind: "sides", code: "single", name: "Single-sided", sides: 1 }),
      option({ id: 14, productId: 1, kind: "sides", code: "double", name: "Double-sided", sides: 2, preselected: true }),
      option({ id: 15, productId: 1, kind: "lamination", code: "lam-one", name: "Lamination, one side", finishId: 1, coated: true }),
      option({ id: 16, productId: 1, kind: "lamination", code: "lam-both", name: "Lamination, both sides", finishId: 2, coated: true }),
      option({ id: 17, productId: 1, kind: "lamination", code: "lam-soft", name: "Soft-touch lamination", finishId: 3, coated: true }),
      option({ id: 18, productId: 1, kind: "spot_uv", code: "spot-uv", name: "Spot UV", finishId: 4, coated: true }),
      option({ id: 19, productId: 1, kind: "corners", code: "corners", name: "Round corners", finishId: 5 }),
      option({ id: 20, productId: 1, kind: "feature", code: "print-back", name: "Print the back", featureCode: "print-back" }),
      option({ id: 30, productId: 2, kind: "material", code: "silk130", name: "130gsm silk", materialId: 3, coated: true, preselected: true }),
      option({ id: 31, productId: 2, kind: "size", code: "a4", name: "A4", sizeId: 2, preselected: true }),
      option({ id: 32, productId: 2, kind: "sides", code: "single", name: "Single-sided", sides: 1, preselected: true }),
      option({ id: 40, productId: 3, kind: "material", code: "pvc510", name: "510gsm PVC banner", materialId: 4, preselected: true }),
      option({ id: 41, productId: 3, kind: "sides", code: "single", name: "Single-sided", sides: 1, preselected: true }),
      option({ id: 42, productId: 3, kind: "edges", code: "plain", name: "Plain edges", finishId: 6, preselected: true }),
      option({ id: 43, productId: 3, kind: "edges", code: "hemmed", name: "Hemmed & eyeletted", finishId: 7 }),
    ],
    materials: [
      { id: 1, code: "silk350", name: "350gsm silk board", shortName: "350gsm silk board", spec: "350gsm · silk coated", kind: "sheet", coated: true, gsm: 350, rate: "0.42", rollWidth: null },
      { id: 2, code: "uncoated300", name: "300gsm uncoated board", shortName: "300gsm uncoated", spec: "300gsm · uncoated", kind: "sheet", coated: false, gsm: 300, rate: "0.38", rollWidth: null },
      { id: 3, code: "silk130", name: "130gsm silk", shortName: "130gsm silk", spec: "130gsm · silk coated", kind: "sheet", coated: true, gsm: 130, rate: "0.11", rollWidth: null },
      { id: 4, code: "pvc510", name: "510gsm PVC banner", shortName: "510gsm PVC", spec: "510gsm · PVC", kind: "roll", coated: false, gsm: 510, rate: "28.00", rollWidth: 1370 },
    ],
    sizes: [
      { id: 1, code: "bcard", name: "Business card", width: 85, height: 55 },
      { id: 2, code: "a4", name: "A4", width: 210, height: 297 },
    ],
    finishes: [],
    breaks: [25, 50, 100, 250, 500, 1000].map((minQty, i) => ({ id: i + 1, minQty })),
    packaging: [
      { id: 1, code: "bundled", name: "Bundled in 50s", basis: "included", price: "0.00", productKind: "sheet" },
      { id: 2, code: "shrink", name: "Shrink-wrapped", basis: "unit", price: "0.04", productKind: "sheet" },
      { id: 3, code: "boxed", name: "Boxed", basis: "per_500", price: "4.50", productKind: "sheet" },
    ],
    bands: [
      { id: 1, code: "light", name: "Up to 2kg", tube: false, maxKg: "2.00", price: "6.50" },
      { id: 2, code: "mid", name: "Up to 10kg", tube: false, maxKg: "10.00", price: "9.80" },
      { id: 3, code: "heavy", name: "Up to 30kg", tube: false, maxKg: "30.00", price: "16.40" },
      { id: 4, code: "tube", name: "Rolled tube, up to 1.5m", tube: true, maxKg: "30.00", price: "14.00" },
    ],
    rules: [
      { id: 1, group: "lamination", test: "uncoated", gsm: null, reason: "Lamination isn't offered on an uncoated stock — lamination needs a coated stock." },
      { id: 2, group: "lamination", test: "roll", gsm: null, reason: "Lamination isn't offered on large-format media." },
      { id: 3, group: "spot_uv", test: "no_lamination", gsm: null, reason: "Spot UV needs a laminated surface — add a lamination first." },
      { id: 4, group: "corners", test: "over_gsm", gsm: 350, reason: "Round corners aren't offered above 350gsm." },
    ],
    works: {
      name: "Marlow Press",
      address: "3 Market Square, Marlow SL7 1AA",
      phone: "01628 482 190",
      email: "hello@marlowpress.example",
      hours: "Mon–Fri, 8:00–17:00",
      about: null,
      taxRate: "20.00",
      standardDays: 3,
      expressDays: 1,
      expressPercent: "35.00",
      proofPostPrice: "12.00",
      proofPostDays: 2,
      artworkMaxMb: 100,
      minDpi: 150,
      takingOrders: true,
    },
  };
}

const cents = (n: number) => Math.round(n * 100);
const fixed = (c: number) => (c / 100).toFixed(2);

export interface FakeCall {
  call: "quote" | "place" | "upload";
  body?: OrderBody;
  clientKey?: string;
  expect?: string;
  name?: string;
}

export interface FakePort extends ShopPort {
  calls: FakeCall[];
  /** Raise every job's price by this much a piece (the price the next dry run says). */
  raise: (by: number) => void;
  /** Refuse the next call with this refusal. */
  refuseNext: (refused: Partial<Refused> & { code: string }) => void;
  /** Refuse the next upload with this reason. */
  refuseUpload: (reason: string) => void;
  /** Hold the next answers until let go. */
  hold: () => () => void;
  /** Hold the uploads until let go. */
  holdUploads: () => () => void;
  customiserApi: CustomiserApi;
}

export function fakePort(catalogue: Catalogue = sampleCatalogue()): FakePort {
  const calls: FakeCall[] = [];
  let bump = 0;
  let refusal: Refused | null = null;
  let uploadRefusal: string | null = null;
  let held: Promise<void> | null = null;
  let uploadsHeld: Promise<void> | null = null;
  let number = 4127;
  let uploadSeq = 0;

  const jobFigures = (job: JobNode): Row => {
    const v = job.values;
    const p = catalogue.products.find((one) => String(one.id) === String(v.product_id))!;
    const laminated = v.lamination_option_id !== undefined;
    const base = p.kind === "sheet" ? 18 + v.qty * (0.09 - Math.min(0.05, v.qty / 20000)) : 40 * v.qty;
    const price = cents(base + (laminated ? 9.6 : 0) + bump * v.qty + (v.proof_by_post ? 12 : 0));
    const capped = v.qty === 999 ? 1000 : null;
    return {
      product_id: p.id,
      product_name: p.name,
      qty: v.qty,
      price: fixed(price),
      each: fixed(Math.round(price / v.qty)),
      setup_cost: p.kind === "sheet" ? "18.00" : null,
      print_cost: p.kind === "sheet" ? fixed(price - 1800 - (laminated ? 960 : 0)) : null,
      lamination_cost: laminated ? "9.60" : null,
      cap_qty: capped,
      cap_saving: capped === null ? null : "-0.10",
      weight_kg: p.kind === "sheet" ? (v.qty / 400).toFixed(2) : (2.5 * v.qty).toFixed(2),
      design_id: v.design_code === undefined ? null : 900,
      turnaround_days: v.express ? 1 : 3,
      ready_by: v.express ? "2026-08-06" : "2026-08-10",
    };
  };

  const figures = (body: OrderBody): Figures => {
    const jobs = body.children.jobs.map(jobFigures);
    const goods = jobs.reduce((sum, j) => sum + cents(Number(j["price"])), 0);
    const weight = jobs.reduce((sum, j) => sum + Number(j["weight_kg"]), 0);
    const band = catalogue.bands.filter((b) => !b.tube).find((b) => weight <= Number(b.maxKg)) ?? null;
    const collect = body.values["delivery_method"] === "collect";
    const delivery = collect || band === null ? 0 : cents(Number(band.price));
    const subtotal = goods + delivery;
    const tax = Math.round(subtotal * 0.2);
    return {
      order: {
        delivery_method: body.values["delivery_method"] ?? "collect",
        item_count: jobs.length,
        goods_total: fixed(goods),
        weight_kg: weight.toFixed(2),
        delivery_band_id: band?.id ?? null,
        delivery: fixed(delivery),
        delivery_to_quote: !collect && band === null ? 1 : 0,
        subtotal: fixed(subtotal),
        tax_rate: "20.00",
        tax: fixed(tax),
        total: fixed(subtotal + tax),
        ready_by: jobs.map((j) => String(j["ready_by"])).sort().pop() ?? null,
      },
      jobs,
    };
  };

  const answer = async <T>(run: () => T): Promise<T> => {
    if (held !== null) await held;
    if (refusal !== null) {
      const r = refusal;
      refusal = null;
      throw new ShopError(r, r.code);
    }
    return run();
  };

  const holder = (put: (p: Promise<void> | null) => void) => {
    let release = () => {};
    put(
      new Promise<void>((resolve) => {
        release = () => {
          put(null);
          resolve();
        };
      }),
    );
    return () => release();
  };

  const api = {} as CustomiserApi;
  return {
    calls,
    customiserApi: api,
    raise: (by) => {
      bump += by;
    },
    refuseNext: (r) => {
      refusal = { status: 400, column: null, child: null, index: null, reason: null, changed: null, raw: { code: r.code, params: {} }, ...r };
    },
    refuseUpload: (reason) => {
      uploadRefusal = reason;
    },
    hold: () => holder((p) => (held = p)),
    holdUploads: () => holder((p) => (uploadsHeld = p)),
    config: async (): Promise<ShopConfig> => ({ timezone: "Europe/London", currency: "GBP" }),
    catalogue: async () => catalogue,
    quote: (body) => {
      calls.push({ call: "quote", body });
      return answer(() => figures(body));
    },
    place: (body, clientKey, expect) => {
      calls.push({ call: "place", body, clientKey, expect });
      return answer((): Placed => {
        const made = figures(body);
        if (made.order["total"] !== expect) {
          throw new ShopError({ code: "PUBLIC_PRICE_CHANGED", status: 409, column: null, child: null, index: null, reason: null, changed: made, raw: null }, "changed");
        }
        const order: Row = { ...made.order, number: `MP-${number}` };
        number += 1;
        return { order, jobs: made.jobs, replayed: false, link: { token: "LINKCODE0000000A" } };
      });
    },
    upload: async (file, name): Promise<Uploaded> => {
      calls.push({ call: "upload", name });
      if (uploadsHeld !== null) await uploadsHeld;
      if (uploadRefusal !== null) {
        const reason = uploadRefusal;
        uploadRefusal = null;
        throw new ShopError({ code: "PUBLIC_UPLOAD_REFUSED", status: 415, column: null, child: null, index: null, reason, changed: null, raw: null }, "refused");
      }
      uploadSeq += 1;
      return { id: `UPLOAD${String(uploadSeq).padStart(26, "0")}`, name, size: file.size, kind: name.endsWith(".pdf") ? "pdf" : "jpg" };
    },
    customiser: () => api,
  };
}

/** The ids of the sample catalogue the tests reach for. */
export const IDS = { cards: 1 as Id, letterheads: 2 as Id, banners: 3 as Id };
