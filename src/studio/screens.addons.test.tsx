/**
 * @vitest-environment jsdom
 *
 * THE DELIVERY COMPANY'S PAGES AND THE ADD-ONS, DRAWN AND USED: the dispatch
 * page with the company's own flow handed the order and the service the
 * customer chose, the hand-over that dispatches the order with its tracking,
 * the shipments, the shelf with exactly the add-ons this app names, an
 * add-on's page, its activity, and the connect, manage, disconnect and
 * "where they appear" dialogs — every state swept by axe, every write
 * recorded with what it sent.
 */
import { act } from "react";
import { describe, expect, it } from "vitest";

import { createRegistry, type AddOn } from "../add-ons/host.ts";
import type { PayloadFor } from "../add-ons/payloads.ts";
import type { CatalogEntry, InstalledAddOn } from "./door.ts";
import { dispatchPayload, worksAddress } from "./outbound.ts";
import { useWorks } from "./store.ts";
import { FakeDoor } from "./testing/fakeDoor.ts";
import { fixture, WEDNESDAY } from "./testing/fixture.ts";
import { button, click, freshPage, mount, settle, sweep, text, toasts, type } from "./testing/render.tsx";

freshPage();

const CARRIER = { key: "shipping-dhl", name: "DHL Shipping" };

/** A delivery company's dispatch flow, as a fill draws it: what it was handed. */
const seen: PayloadFor<"order.dispatch.actions">[] = [];
const carrierAddOn = {
  key: CARRIER.key,
  name: CARRIER.name,
  fills: [
    {
      slot: "order.dispatch.actions",
      order: 10,
      render: (payload: PayloadFor<"order.dispatch.actions">) => {
        seen.push(payload);
        return (
          <div className="fake-flow">
            <h2>The parcel</h2>
            <p>
              {payload.order.ref} · picked {payload.chosen?.code ?? "first"}
            </p>
          </div>
        );
      },
    },
  ],
} as unknown as AddOn;

const installed = (key: string, more: Partial<InstalledAddOn> = {}): InstalledAddOn => ({
  key,
  name: key,
  version: "1.0.17",
  connectKind: "none",
  connected: false,
  missing: false,
  attached: true,
  enabled: true,
  slots: [],
  networkAllow: [],
  pages: [],
  panels: [],
  ...more,
});
const INSTALLED: InstalledAddOn[] = [
  installed("customiser", { name: "Customiser", pages: ["customiser"], panels: ["customiser-line"] }),
  installed(CARRIER.key, { name: CARRIER.name, connectKind: "api-key", connected: true, slots: ["order.dispatch.actions", "checkout.delivery.methods", "order.dispatch.panel", "settings.add-on.panel"], networkAllow: ["express.api.dhl.com"] }),
  installed("inventory", { name: "Inventory", enabled: false }),
];
const CATALOG: CatalogEntry[] = [
  { key: "customiser", name: "Customiser", state: "installed", tagline: "Designs a customer fills in, checked and kept.", categories: ["artwork"], monogram: "CU", connectKind: "none" },
  { key: CARRIER.key, name: CARRIER.name, state: "installed", tagline: "Book a parcel collection and print its label.", categories: ["delivery"], monogram: "DHL", connectKind: "api-key" },
  { key: "inventory", name: "Inventory", state: "installed", tagline: "Stock by place and by batch.", categories: ["data"], monogram: "IN", connectKind: "none" },
  { key: "invoices", name: "Invoices & Receipts", state: "available", tagline: "An invoice with each order.", categories: ["data"], monogram: "IR", connectKind: "none" },
];

/** A works with DHL on: MP-4119 ready to go, a booking already made for MP-4115, one refused for MP-4123. */
function shipping() {
  const data = fixture();
  data.shipments = [
    { id: 1, order_reference: "MP-4119", carrier: "DHL", service: "DHL · Standard", tracking: "00 3400 1234 5678 9012", label_file: "/api/v1/files/file_01J8Z6Q3M4N5P6R7S8T9V0W1XC/content", status: "booked", created_at: "2026-08-05T09:00:00.000Z", collection_from: "2026-08-05T13:00:00.000Z", collection_to: "2026-08-05T16:00:00.000Z" },
    { id: 2, order_reference: "MP-4123", carrier: "DHL", service: "DHL · Economy", tracking: null, label_file: null, status: "refused", created_at: "2026-08-04T10:00:00.000Z" },
  ];
  return new FakeDoor({ data, facts: { carrier: CARRIER, addOns: ["customiser", CARRIER.key] }, installed: INSTALLED, catalog: CATALOG, activity: [{ id: "a1", at: Date.parse("2026-08-04T08:00:00.000Z"), addOn: CARRIER.key, action: "connected", by: "Rosa Marlow", ref: null }] });
}

describe("the dispatch page", () => {
  it("hands the delivery company's flow the order as the works keeps it, with the service the customer chose", async () => {
    seen.length = 0;
    await mount(shipping(), "dispatch", { orderId: 4119, registry: createRegistry([carrierAddOn]) });
    expect(text()).toContain("DHL Shipping is the only delivery company connected.");
    expect(text()).toContain("MP-4119 · picked N");
    const payload = seen.at(-1)!;
    expect(payload.chosen).toEqual({ addOn: "shipping-dhl", code: "N" });
    expect(payload.order.origin).toEqual({ name: "Marlow Press", lines: ["3 Market Square"], city: "Marlow", postcode: "SL7 1AA", country: "GB" });
    expect(payload.order.destination).toEqual({ name: "Marsh Lane Dental", lines: ["12 Marsh Lane"], city: "Marlow", postcode: "SL7 2BB", country: "GB" });
    expect(payload.order.items).toEqual([{ id: "6", key: "2", label: "500 × Flyers & leaflets", quantity: 1, unitWeightGrams: 1550 }]);
    expect(payload.now).toEqual({ iso: "2026-08-05", hour: 10, minute: 20 });
    await sweep("the dispatch page");
  });

  it("hands the order over with the tracking reference the booking gave", async () => {
    const door = shipping();
    await mount(door, "dispatch", { orderId: 4119, registry: createRegistry([carrierAddOn]) });
    const field = document.querySelector<HTMLInputElement>(".wk-dispatch-field input")!;
    expect(field.value).toBe("00 3400 1234 5678 9012");
    await click(button("Mark dispatched"));
    expect(door.of("moveJob")).toEqual([{ id: 6, from: "ready", to: "dispatched", values: {} }]);
    expect(door.of("moveOrder")).toEqual([{ id: 4119, from: "ready", to: "dispatched", values: { tracking: "00 3400 1234 5678 9012", dhl_service: "DHL · Standard" } }]);
    expect(toasts()).toEqual(["MP-4119 is on its way."]);
  });

  it("lists the other orders ready to go, and says when the order is not one", async () => {
    const door = shipping();
    door.data.orders = door.data.orders.map((o) => (o.id === 4123 ? { ...o, status: "ready" } : o));
    door.data.jobs = door.data.jobs.map((j) => (j.id === 5 ? { ...j, stage: "ready", on_floor: 0 } : j));
    await mount(door, "dispatch", { orderId: 4119 });
    expect([...document.querySelectorAll(".wk-queue-item")].map((b) => b.textContent)).toEqual(["MP-4123PVC bannersTwo Rivers Cycles"]);
    await click(document.querySelector(".wk-queue-item"));
    expect(useWorks.getState().orderId).toBe(4123);
    await mount(shipping(), "dispatch", { orderId: 4126 });
    expect(text()).toContain("That order isn't ready to go out.");
  });

  it("builds the works' address from its one line", () => {
    expect(worksAddress({ id: 1, works_name: "W", address: "Unit 2, Mill Lane, Henley RG9 1AA" }, "GB")).toEqual({ name: "W", lines: ["Unit 2", "Mill Lane"], city: "Henley", postcode: "RG9 1AA", country: "GB" });
    expect(worksAddress({ id: 1, works_name: "W", address: "Somewhere" }, "GB")).toEqual({ name: "W", lines: ["Somewhere"], city: "", postcode: "", country: "GB" });
    expect(dispatchPayload(fixture(), fixture().orders[0]!, { currency: "GBP", zone: "Europe/London", now: WEDNESDAY, carrier: "x" }).chosen).toBeNull();
  });
});

describe("shipments", () => {
  it("lists what the delivery company booked, its label, and a refused one to try again", async () => {
    await mount(shipping(), "shipments");
    const rows = [...document.querySelectorAll(".wk-ship")].map((r) => r.textContent);
    expect(rows[0]).toContain("MP-4119Marsh Lane DentalBooked");
    expect(rows[0]).toContain("00 3400 1234 5678 9012");
    expect(rows[1]).toContain("Refused");
    expect(rows[1]).toContain("Going to Henley, RG9 1AA");
    expect([...document.querySelectorAll("a")].find((a) => a.textContent === "Label")?.getAttribute("href")).toBe("/api/v1/files/file_01J8Z6Q3M4N5P6R7S8T9V0W1XC/content");
    await sweep("shipments");
    await click(button("Fix and try again"));
    expect(useWorks.getState().view).toBe("dispatch");
    expect(useWorks.getState().orderId).toBe(4123);
  });

  it("says nothing has gone out yet", async () => {
    await mount(new FakeDoor({ facts: { carrier: CARRIER } }), "shipments");
    expect(text()).toContain("Nothing has gone out with a carrier yet.");
    await sweep("no shipments");
  });
});

describe("the add-ons shelf", () => {
  it("lists exactly the add-ons this app names, connected and available, by kind", async () => {
    const door = shipping();
    await mount(door, "addons");
    const connected = [...document.querySelectorAll(".wk-addon-row-name")].map((n) => n.firstChild?.textContent);
    const available = [...document.querySelectorAll(".wk-addon-card-name")].map((n) => n.textContent);
    expect(connected).toEqual(["Customiser", "DHL Shipping"]);
    expect(available).toEqual(["Inventory", "Invoices & Receipts", "holiday-calendars"]);
    expect([...document.querySelectorAll(".wk-cat")].map((c) => c.textContent)).toEqual(["All5", "Artwork1", "Delivery1", "Records2"]);
    await sweep("the shelf");
    await click([...document.querySelectorAll(".wk-cat")].find((c) => c.textContent === "Records2"));
    expect([...document.querySelectorAll(".wk-addon-card-name")].map((n) => n.textContent)).toEqual(["Inventory", "Invoices & Receipts"]);
  });

  it("switches an installed add-on on for the works once Adminium has it", async () => {
    const door = shipping();
    await mount(door, "addons");
    await click(button("Connect Inventory"));
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain("Inventory needs no account");
    await sweep("the connect dialog");
    await click([...document.querySelectorAll<HTMLButtonElement>(".wk-sheet-foot button")].find((b) => b.textContent === "Connect Inventory"));
    expect(door.of("setAddOn")).toEqual([{ key: "inventory", enabled: true }]);
    expect(toasts()).toEqual(["Inventory is connected."]);
  });

  it("sends an add-on not yet installed to Adminium's own add-ons page, and keeps Connect off", async () => {
    await mount(shipping(), "addons");
    await click(button("Connect Invoices & Receipts"));
    const link = [...document.querySelectorAll("a")].find((a) => a.textContent === "Open the Invoices & Receipts settings in Adminium");
    expect(link?.getAttribute("href")).toBe("/studio/add-ons");
    expect(link?.getAttribute("rel")).toBe("noopener noreferrer");
    const connect = [...document.querySelectorAll<HTMLButtonElement>(".wk-sheet-foot button")].find((b) => b.textContent === "Connect Invoices & Receipts")!;
    expect(connect.disabled).toBe(true);
  });

  it("manages and disconnects an add-on, and never offers to disconnect the one the shop needs", async () => {
    const door = shipping();
    await mount(door, "addons");
    await click(button("Manage Customiser"));
    expect(button("Disconnect Customiser")).toBeUndefined();
    await click(button("Close"));
    await click(button("Manage DHL Shipping"));
    expect(text()).toContain("Reach express.api.dhl.com, and nothing else.");
    expect(text()).toContain("Connected by Rosa Marlow");
    await sweep("the manage sheet");
    await click(button("Disconnect DHL Shipping"));
    expect(document.querySelector('[role="alertdialog"]')).not.toBeNull();
    await sweep("the disconnect dialog");
    await click(button("Disconnect"));
    expect(door.of("setAddOn")).toEqual([{ key: "shipping-dhl", enabled: false }]);
    expect(toasts()).toEqual(["DHL Shipping is disconnected."]);
  });

  it("shows where the add-ons appear in the shop, filled and empty", async () => {
    await mount(shipping(), "addons");
    await click(button("Where they appear"));
    const holes = [...document.querySelectorAll(".wk-hole")].map((h) => h.textContent);
    expect(holes).toEqual([
      "More ways to send artworkNothing else is connected yet.",
      "Delivery companiesDHL Shipping's services and prices replace the delivery bands. Collection from the works stays.",
      "DispatchOn its way with DHL Shipping, with its tracking.",
    ]);
    await sweep("where they appear");
  });
});

describe("an add-on's page and the activity", () => {
  it("says what an add-on does, where it appears and what it may do", async () => {
    await mount(shipping(), "addon", { addOnKey: "shipping-dhl" });
    expect(text()).toContain("Book a parcel collection and print its label.");
    expect([...document.querySelectorAll(".wk-appears-row")].map((r) => r.textContent)).toEqual([
      "works · dispatchBooking a collection for a ready delivery, its label and its tracking.",
      "customer · checkoutIts services, prices and days at checkout, beside collection from the works.",
      "customer · your orderWhere the parcel is, on the customer's own order page.",
      "Adminium · its settingsIts own settings, kept in Adminium.",
    ]);
    expect(text()).toContain("Marlow Press is not affiliated with the company behind DHL Shipping.");
    await sweep("an add-on's page");
    await mount(shipping(), "addon", { addOnKey: "customiser" });
    expect(text()).toContain("The shop needs this one: it stays connected.");
    await mount(shipping(), "addon", { addOnKey: "holiday-calendars" });
    expect(text()).toContain("Adminium says where it appears once it is installed.");
    await mount(shipping(), "addon", { addOnKey: "nothing" });
    expect(text()).toContain("That add-on isn't one the works uses.");
  });

  it("lists what the add-ons did by day, Adminium's log and the collections booked, filtered by add-on", async () => {
    await mount(shipping(), "activity");
    await settle();
    expect([...document.querySelectorAll(".wk-act-day h2")].map((h) => h.textContent)).toEqual(["Wednesday, August 5", "Tuesday, August 4"]);
    expect([...document.querySelectorAll(".wk-act-text")].map((r) => r.textContent)).toEqual([
      "DHL Shipping · Collection booked · DHL · Standard · 00 3400 1234 5678 9012",
      "DHL Shipping · Collection booked · DHL · Economy",
      "DHL Shipping · Connected by Rosa Marlow",
    ]);
    await sweep("the activity");
    await click([...document.querySelectorAll(".wk-filter")].find((f) => f.textContent?.startsWith("Customiser")));
    expect(text()).toContain("Nothing from this add-on yet.");
  });
});

describe("the shell, with a delivery company on", () => {
  it("offers Shipments, and the board's Book a collection leads to the dispatch page", async () => {
    await mount(shipping(), "today");
    expect([...document.querySelectorAll(".wk-nav-item")].map((n) => n.textContent)).toEqual(["Today", "Jobs", "Materials", "Price list", "Designs", "Shipments", "Add-ons"]);
    await click(button("Book a collection"));
    expect(useWorks.getState().view).toBe("dispatch");
    await act(async () => undefined);
    await type(document.querySelector(".wk-dispatch-field input"), "TRACK-1");
    expect(document.querySelector<HTMLInputElement>(".wk-dispatch-field input")?.value).toBe("TRACK-1");
  });
});
