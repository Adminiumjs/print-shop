/**
 * The shop's door, on the wire: the refs it calls by, the one write that
 * places an order exactly as it goes over HTTP (the order, its jobs, their
 * features and artwork, the retry key, the total shown), its dry run, an
 * artwork file sent for the order's jobs, and a refusal read back with the
 * field it names.
 */
import { describe, expect, it } from "vitest";

import { PUBLIC_REFS } from "../manifest/public.ts";
import { AdminiumShop } from "./door.ts";
import { ARTWORK_COLUMN, shopRefs } from "./refs.ts";
import { isShopError, type OrderBody } from "./port.ts";

interface Sent {
  method: string;
  path: string;
  query: Record<string, string>;
  body: unknown;
}

function wire(answers: Record<string, { status?: number; body: unknown }>): { fetch: typeof fetch; sent: Sent[] } {
  const sent: Sent[] = [];
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const method = init?.method ?? "GET";
    const raw = init?.body;
    const body = raw === undefined || raw === null ? null : typeof raw === "string" ? JSON.parse(raw) : "(file)";
    sent.push({ method, path: url.pathname, query: Object.fromEntries(url.searchParams), body });
    const answer = answers[`${method} ${url.pathname}`] ?? { status: 404, body: { error: { code: "PUBLIC_REF_NOT_FOUND", message: "no" } } };
    return new Response(JSON.stringify(answer.body), { status: answer.status ?? 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  return { fetch: fetchImpl, sent };
}

const BODY: OrderBody = {
  values: { name: "Harbour Bakery", email: "hello@harbourbakery.example", address_line1: "12 Quay Street", town: "Marlow", postcode: "SL7 1BT", may_email: true, delivery_method: "deliver", language: "en-GB" },
  children: {
    jobs: [
      {
        values: { product_id: 1, qty: 500, material_option_id: 10, sides_option_id: 14, size_option_id: 12, lamination_option_id: 16, look: "matt", packaging_id: 3, proof_by_post: false, express: false, design_code: "DSGN-7Q2K-X4PA" },
        children: {
          job_features: [{ values: { option_id: 20 } }],
          artwork: [{ values: { name: "harbour-back.pdf", file: "U".repeat(32), side: "both", checks: { language: "en-US", rows: [{ check: "bleed", level: "warn", text: "No bleed." }] }, accepted: true } }],
        },
      },
    ],
  },
};

const SERVED = { baseUrl: "https://works.example", publishableKey: "adm_pub_shop", publicKeys: { order: "adm_pub_order" } };

describe("the shop's refs", () => {
  it("are the manifest's, named as Adminium names them", () => {
    const refs = shopRefs();
    for (const [name, ref] of Object.entries(refs)) expect(Object.values(PUBLIC_REFS), name).toContain(ref);
    expect(refs.placeOrder).toBe(PUBLIC_REFS.placeOrder);
    expect(shopRefs({ orders: "shop_orders" }).placeOrder).toBe("shop_orders_verified_2");
  });
});

describe("placing an order through the door", () => {
  it("sends the order, its jobs, their features and artwork, the retry key and the total shown in one write", async () => {
    const { fetch, sent } = wire({
      "POST /api/v1/public/records/printing_orders_verified_2": {
        status: 201,
        body: { data: { number: "MP-4127", total: "87.55", ready_by: "2026-08-10" }, children: { jobs: [{ data: { product_name: "Business cards", price: "66.46" } }] }, link: { key: "order", token: "LINKCODE0000000A", session: "S1", expiresAt: 4102444800000 } },
      },
    });
    const door = new AdminiumShop(SERVED, { fetch, humanCheck: false });
    const placed = await door.place(BODY, "basket-key-0123456789abcdef", "87.55");
    expect(sent).toEqual([
      {
        method: "POST",
        path: "/api/v1/public/records/printing_orders_verified_2",
        query: {},
        body: { values: { ...BODY.values, client_key: "basket-key-0123456789abcdef" }, children: BODY.children, expect: { total: "87.55" } },
      },
    ]);
    expect(placed.order["number"]).toBe("MP-4127");
    expect(placed.jobs[0]?.["price"]).toBe("66.46");
    expect(placed.link).toEqual({ token: "LINKCODE0000000A" });
    // The order's own key now holds the session the save opened: its page needs no claim.
    expect(door.orderClient?.session()?.token).toBe("S1");
  });

  it("dry-runs the same body without the retry key or the total", async () => {
    const { fetch, sent } = wire({
      "POST /api/v1/public/records/printing_orders_verified_2/dry-run": { body: { data: { total: "87.55" }, children: { jobs: [{ data: { price: "66.46" } }] } } },
    });
    const door = new AdminiumShop(SERVED, { fetch, humanCheck: false });
    const quoted = await door.quote(BODY);
    expect(sent[0]).toEqual({ method: "POST", path: "/api/v1/public/records/printing_orders_verified_2/dry-run", query: {}, body: { values: BODY.values, children: BODY.children } });
    expect(quoted).toEqual({ order: { total: "87.55" }, jobs: [{ price: "66.46" }] });
  });

  it("sends an artwork file for the order's jobs, into the job's artwork column", async () => {
    const { fetch, sent } = wire({
      "POST /api/v1/public/uploads": { status: 201, body: { data: { id: "U".repeat(32), name: "harbour-front.pdf", size: 4, kind: "pdf" } } },
    });
    const door = new AdminiumShop(SERVED, { fetch, humanCheck: false });
    const taken = await door.upload(new Blob(["%PDF"], { type: "application/pdf" }), "harbour-front.pdf");
    expect(sent).toEqual([{ method: "POST", path: "/api/v1/public/uploads", query: { ref: "printing_orders_verified_2", column: ARTWORK_COLUMN, name: "harbour-front.pdf" }, body: "(file)" }]);
    expect(ARTWORK_COLUMN).toBe("jobs.artwork.file");
    expect(taken).toEqual({ id: "U".repeat(32), name: "harbour-front.pdf", size: 4, kind: "pdf" });
  });

  it("reads an upload's refusal with its reason", async () => {
    const { fetch } = wire({ "POST /api/v1/public/uploads": { status: 415, body: { error: { code: "PUBLIC_UPLOAD_REFUSED", message: "not taken", params: { reason: "kind" } } } } });
    const door = new AdminiumShop(SERVED, { fetch, humanCheck: false });
    const error = await door.upload(new Blob(["x"]), "menu.docx").catch((e: unknown) => e);
    expect(isShopError(error) && [error.refused.code, error.refused.reason]).toEqual(["PUBLIC_UPLOAD_REFUSED", "kind"]);
  });

  it("reads a refusal with the job and column it names", async () => {
    const { fetch } = wire({
      "POST /api/v1/public/records/printing_orders_verified_2": {
        status: 400,
        body: { error: { code: "PUBLIC_WRITE_REFUSED", message: "refused", params: { child: "jobs", index: 0, column: "design_code", reason: "too-long", part: "name" } } },
      },
    });
    const door = new AdminiumShop(SERVED, { fetch, humanCheck: false });
    const error = await door.place(BODY, "basket-key-0123456789abcdef", "87.55").catch((e: unknown) => e);
    expect(isShopError(error)).toBe(true);
    if (!isShopError(error)) return;
    expect(error.refused).toMatchObject({ code: "PUBLIC_WRITE_REFUSED", child: "jobs", index: 0, column: "design_code", reason: "too-long" });
  });

  it("reads a changed price with the figures the save came to", async () => {
    const { fetch } = wire({
      "POST /api/v1/public/records/printing_orders_verified_2": {
        status: 409,
        body: { error: { code: "PUBLIC_PRICE_CHANGED", message: "moved", params: { total: "87.96", lines: { jobs: [{ data: { price: "66.80" } }] } } } },
      },
    });
    const door = new AdminiumShop(SERVED, { fetch, humanCheck: false });
    const error = await door.place(BODY, "basket-key-0123456789abcdef", "87.55").catch((e: unknown) => e);
    expect(isShopError(error) && error.refused.changed).toEqual({ order: { total: "87.96" }, jobs: [{ price: "66.80" }] });
  });
});
