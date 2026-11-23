/**
 * When an order may be handed over: read from the booking record, with a
 * purchase nobody is sure of and a test label both holding it back.
 */
import { describe, expect, it, vi } from "vitest";

import { engineSend } from "../add-ons/connected.ts";
import type { EngineBooking } from "../add-ons/vendor/host/engine-carrier.ts";
import { tellNewNumber } from "./actions.ts";
import type { WorksDoor } from "./door.ts";
import { outboundOrder } from "./outbound.ts";
import { handOverOf } from "./shipping.ts";
import { stateWord } from "./screens/ShipmentCard.tsx";
import type { WorksData } from "./door.ts";

const booking = (over: Partial<EngineBooking> = {}): EngineBooking => ({
  id: "b1",
  state: "booked",
  test: false,
  purpose: "outbound",
  parcelNumber: 1,
  carrier: "a-carrier",
  service: "Next day",
  tracking: "TRK1",
  carrierName: "Evri",
  reason: null,
  duplicates: 0,
  createdAt: 1,
  calledAt: 1,
  checkedAt: null,
  releaseAfter: null,
  applied: true,
  label: { state: "ready", size: "a6", sizeGot: "a6", sizeDiffers: false, customsInvoice: false, customsInvoiceOwed: false },
  ...over,
});
const order = { id: 7, number: "MP-7", status: "ready" };

describe("what may be handed over", () => {
  it("fills in the bought label's number and carrier", () => {
    expect(handOverOf([booking()], order)).toEqual({ kind: "label", tracking: "TRK1", carrier: "Evri" });
  });
  it("takes the first parcel's number", () => {
    expect(handOverOf([booking({ id: "b2", parcelNumber: 2, tracking: "TRK2" }), booking()], order)).toMatchObject({ tracking: "TRK1" });
  });
  it.each(["unknown", "calling", "reserved"] as const)("holds the order while a purchase is %s, even beside a good label", (state) => {
    expect(handOverOf([booking(), booking({ id: "b2", parcelNumber: 2, state })], order)).toEqual({ kind: "unsettled" });
  });
  it("never hands over on a test label", () => {
    expect(handOverOf([booking({ test: true })], order)).toEqual({ kind: "test" });
  });
  it("lets a live label win over an earlier test one", () => {
    expect(handOverOf([booking({ id: "t", test: true }), booking()], order)).toMatchObject({ kind: "label", tracking: "TRK1" });
  });
  it("has nothing to say with no booking, or one refused or released", () => {
    expect(handOverOf([], order)).toEqual({ kind: "none" });
    expect(handOverOf([booking({ state: "refused" }), booking({ id: "b2", state: "released" })], order)).toEqual({ kind: "none" });
  });
  it("ignores a return label", () => {
    expect(handOverOf([booking({ purpose: "return" })], order)).toEqual({ kind: "none" });
  });
});

describe("the card's word", () => {
  it("never calls an unsure purchase bought", () => {
    expect(stateWord(booking({ state: "unknown" }), false)).toBe("works.card.unknown");
  });
  it("says label ready, then handed over, and tracking never moves the order's word back", () => {
    expect(stateWord(booking(), false)).toBe("works.card.labelReady");
    expect(stateWord(booking(), true)).toBe("works.actions.handedOver");
    const track = { status: "DELIVERED" as const, statusAt: 2, checkedAt: 3, flag: null, newNumber: false };
    expect(stateWord(booking({ track }), true)).toBe("works.shipments.delivered");
  });
});

describe("telling the customer of a new number", () => {
  it("writes the number and the stamp that sends the e-mail, and nothing else", async () => {
    const updateOrder = vi.fn(async (_o: unknown, v: Record<string, unknown>) => ({ id: 7, ...v }));
    await tellNewNumber({ updateOrder } as unknown as WorksDoor, order, "TRK2", Date.UTC(2026, 10, 23, 9));
    expect(updateOrder).toHaveBeenCalledWith(order, { tracking: "TRK2", number_told_at: "2026-11-23T09:00:00.000Z" });
  });
});

describe("the order a carrier is handed", () => {
  const data = { settings: { works_name: "Marlow Press", address: "3 Market Square, Marlow SL7 1AA", home_country: "DE" }, jobs: [] } as unknown as WorksData;
  it("names its row, and its own country over the works' and over the money's", () => {
    const out = outboundOrder(data, { id: 9, number: "MP-9", name: "A", address_line1: "1 St", town: "T", postcode: "P", country: "FR" }, "GBP");
    expect(out.source).toEqual({ table: "orders", id: "9" });
    expect(out.destination?.country).toBe("FR");
    expect(out.origin.country).toBe("DE");
  });
});

describe("the carrier's sender", () => {
  const reply = () => new Response("label", { status: 200 });
  it("reads a label file as a blob, and sends the token only on a write", async () => {
    const request = vi.fn(async () => reply());
    const send = engineSend(request as unknown as typeof fetch, "https://works.test", () => "csrf");
    const got = await send("/api/v1/apps/printing/shipping/bookings/b1/documents/label", { method: "GET", headers: {} });
    expect(await (await got.blob!()).text()).toBe("label");
    await send("/api/v1/apps/printing/shipping/bookings", { method: "POST", headers: {}, body: "{}" });
    const calls = request.mock.calls as unknown as [string, RequestInit][];
    expect(calls[0]![1].headers).toEqual({});
    expect(calls[1]![1].headers).toEqual({ "x-adminium-csrf": "csrf" });
    expect(calls[1]![1].redirect).toBe("error");
  });
  it("refuses anything but this app's shipping routes", async () => {
    const send = engineSend(vi.fn() as unknown as typeof fetch, "https://works.test", () => null);
    await expect(send("/api/v1/roles", { method: "GET", headers: {} })).rejects.toThrow();
    await expect(send("https://elsewhere.test/api/v1/apps/printing/shipping/access", { method: "GET", headers: {} })).rejects.toThrow();
  });
});

describe("what a customer can read of a label", () => {
  it("is only what was told at hand-over: never the label's own columns", async () => {
    const { ORDER_SELECT } = await import("../manifest/public.ts");
    expect(ORDER_SELECT).toEqual(expect.arrayContaining(["tracking", "carrier"]));
    for (const column of ["label_tracking", "label_carrier", "number_told_at"]) expect(ORDER_SELECT).not.toContain(column);
  });
});
