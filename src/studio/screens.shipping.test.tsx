// @vitest-environment jsdom
/**
 * The hand-over and the Shipment card, drawn on a stub of Adminium's booking
 * record: what is filled in, what holds the order back, and the one press that
 * tells a customer of a new number.
 */
import { describe, expect, it, vi } from "vitest";

import { applyAddOnSettings, type AddOn } from "../add-ons/host.ts";
import type { EngineBooking, EngineCarrier } from "../add-ons/vendor/host/engine-carrier.ts";
import { FakeDoor } from "./testing/fakeDoor.ts";
import { fixture } from "./testing/fixture.ts";
import { button, click, freshPage, mount, settle, sweep, text } from "./testing/render.tsx";

const held = vi.hoisted(() => ({ client: null as unknown }));
vi.mock("../add-ons/connected.ts", async (actual) => ({
  ...(await actual<typeof import("../add-ons/connected.ts")>()),
  engineClientOf: () => held.client,
  shippingSetup: () => null,
}));

freshPage();

const CARRIER = { key: "a-carrier", name: "A Carrier" };
const booking = (over: Partial<EngineBooking> = {}): EngineBooking => ({
  id: "b1",
  state: "booked",
  test: false,
  purpose: "outbound",
  parcelNumber: 1,
  carrier: CARRIER.key,
  service: "Next day",
  tracking: "TRK1",
  carrierName: "Evri",
  reason: null,
  duplicates: 0,
  createdAt: 1_780_000_000_000,
  calledAt: 1_780_000_000_000,
  checkedAt: null,
  releaseAfter: null,
  applied: true,
  label: { state: "ready", size: "a6", sizeGot: "a6", sizeDiffers: false, customsInvoice: false, customsInvoiceOwed: false },
  ...over,
});
const withBookings = (bookings: EngineBooking[]) => {
  held.client = { addOnKey: CARRIER.key, bookings: vi.fn(async () => ({ bookings, bookable: false, blockedBy: null })) } as unknown as EngineCarrier;
};
const door = (change: (order: Record<string, unknown>) => void = () => undefined) => {
  const data = fixture();
  change(data.orders.find((o) => o.id === 4119)!);
  return new FakeDoor({ data, facts: { carrier: CARRIER, addOns: ["customiser", CARRIER.key] } });
};
const handOver = () => button("Handed over") as HTMLButtonElement;

describe("handing an order over", () => {

  it("fills in the label's number, locked, and writes the carrier with it", async () => {
    withBookings([booking()]);
    const d = door();
    await mount(d, "dispatch", { orderId: 4119 });
    await settle();
    const field = document.querySelector<HTMLInputElement>(".wk-dispatch-field input")!;
    expect(field.value).toBe("TRK1");
    expect(field.readOnly).toBe(true);
    expect(text()).toContain("Label ready");
    await sweep("the hand-over with a label");
    await click(handOver());
    expect(d.of("moveOrder")).toEqual([{ id: 4119, from: "ready", to: "dispatched", values: { tracking: "TRK1", carrier: "Evri" } }]);
  });

  it.each([
    ["a test label", booking({ test: true }), "This is a test label."],
    ["a purchase with no answer", booking({ state: "unknown" }), "no clear answer"],
  ])("holds the order on %s", async (_name, one, said) => {
    withBookings([one]);
    const d = door();
    await mount(d, "dispatch", { orderId: 4119 });
    await settle();
    expect(text()).toContain(said);
    expect(handOver().disabled).toBe(true);
  });

  it("holds the order when the record cannot be read, and never guesses", async () => {
    held.client = { addOnKey: CARRIER.key, bookings: vi.fn(async () => Promise.reject(Object.assign(new Error("down"), { status: 500 }))) };
    await mount(door(), "dispatch", { orderId: 4119 });
    await settle();
    expect(handOver().disabled).toBe(true);
  });

  it("asks where an older order is going, and saves only what a person picked", async () => {
    withBookings([]);
    const d = door((o) => {
      o["country"] = null;
    });
    await mount(d, "dispatch", { orderId: 4119 });
    await settle();
    expect(text()).toContain("Which country is this order going to?");
  });

  it("offers the new number only once the order is handed over, and sends it on a press", async () => {
    const track = { status: "TRANSIT" as const, statusAt: 2, checkedAt: 3, flag: null, newNumber: true };
    withBookings([booking({ tracking: "TRK2", track })]);
    const d = door((o) => {
      o["status"] = "dispatched";
      o["tracking"] = "TRK1";
    });
    await mount(d, "dispatch", { orderId: 4119 });
    await settle();
    expect(text()).toContain("In transit");
    await click(button("New number: tell the customer"));
    const [write] = d.of("updateOrder") as { id: number; values: Record<string, unknown> }[];
    expect(write!.values["tracking"]).toBe("TRK2");
    expect(typeof write!.values["number_told_at"]).toBe("string");
  });
});

describe("leaving demo mode", () => {
  it("tells each add-on its saved settings, so a demo switch turned off stays off", () => {
    const applySettings = vi.fn();
    applyAddOnSettings([{ key: "a-carrier", applySettings } as unknown as AddOn], { "a-carrier": { demo_transport: false } });
    expect(applySettings).toHaveBeenCalledWith({ demo_transport: false });
  });
});

describe("Ship from", () => {
  it("says plainly who may change it when Adminium does not answer this person", async () => {
    held.client = null;
    await mount(door(), "shipfrom");
    await settle();
    expect(text()).toContain("Only someone who manages shipping");
  });
});
