/**
 * @vitest-environment jsdom
 *
 * MATERIALS AND THE PRICE LIST, DRAWN AND USED: the shelf as Inventory keeps
 * it (and what the screen says without it), a stock delivery received on
 * Inventory's own page, the rate card in its sections and the breaks drawn,
 * and the owner's edits — each figure checked, then saved to its own row —
 * against a stand-in door that records them. Every state swept by axe.
 */
import { describe, expect, it } from "vitest";

import { FakeDoor } from "./testing/fakeDoor.ts";
import { stocked } from "./testing/fixture.ts";
import { button, click, freshPage, mount, press, sweep, text, toasts, type, unmount } from "./testing/render.tsx";
import { typedRate } from "./screens/Prices.tsx";

freshPage();

const rows = () => [...document.querySelectorAll(".wk-table tbody tr")].map((tr) => [...tr.querySelectorAll("td")].map((td) => (td.textContent ?? "").trim()));

describe("materials", () => {
  it("shows the shelf as Inventory keeps it, a low stock marked, and receives a delivery on Inventory's page", async () => {
    await mount(new FakeDoor({ data: stocked(), facts: { addOns: ["customiser", "inventory"] } }), "materials");
    expect(rows()).toEqual([
      ["350gsm silk boardSRA3", "2,600", "340", "2,260 sheets", ""],
      ["170gsm silkSRA3", "5,200", "1,180", "4,020 sheets", ""],
      ["510gsm PVC banner1,370mm roll", "38", "22", "16 m", "order more"],
      ["Self-adhesive vinyl1,370mm rollThis stock isn't linked to an item in Inventory yet.", "—", "—", "—", ""],
    ]);
    const delivery = [...document.querySelectorAll("a")].find((a) => a.textContent === "Record a stock delivery");
    expect(delivery?.getAttribute("href")).toBe("/add-ons/inventory/inventory-receive");
    await sweep("materials with Inventory");
  });

  it("says where the count comes from while Inventory is off, and offers the owner its page", async () => {
    await mount(new FakeDoor(), "materials");
    expect(text()).toContain("The shelf count comes from Inventory, which isn't connected");
    expect(rows()[0]).toEqual(["350gsm silk boardSRA3", "—", "—", "—", ""]);
    await sweep("materials without Inventory");
    await click(button("See Inventory"));
    unmount();
    await mount(new FakeDoor({ roles: ["press"] }), "materials");
    expect(button("See Inventory")).toBeUndefined();
  });
});

describe("the price list", () => {
  it("reads the rate card from its rows, section by section, and draws the breaks", async () => {
    await mount(new FakeDoor(), "prices");
    const sections = [...document.querySelectorAll(".wk-price-card")].map((c) => c.querySelector(".wk-price-title")?.textContent);
    expect(sections).toEqual(["Setup", "Sheet printing", "Material (per SRA3 sheet)", "Finishing", "Large format (per m²)", "Turnaround & proofs", "Packaging", "Delivery", "Quantity breaks"]);
    const lines = [...document.querySelectorAll(".wk-price-row")].map((r) => `${r.querySelector("dt")?.textContent} ${r.querySelector("dd")?.textContent}`);
    expect(lines).toEqual([
      "Every job £18.00 / job",
      "Single-sided £0.85 / sheet",
      "Double-sided £1.20 / sheet",
      "350gsm silk board £0.42",
      "170gsm silk £0.14",
      "Lamination, one side £0.55 / sheet",
      "Lamination, both sides £0.95 / sheet",
      "Soft-touch lamination £1.20 / sheet",
      "Spot UV £2.40 / sheet",
      "Round corners £6.00 / 250",
      "510gsm PVC banner £28.00 / m²",
      "Self-adhesive vinyl £34.00 / m²",
      "Hemmed & eyeletted £6.00 / lin m",
      "Pole pockets £9.00 each",
      "Stretched on a 38mm frame £22.00 / m²",
      "Minimum charge £35.00 / job",
      "Express +35%",
      "Printed proof by post £12.00",
      "Bundled in 50s included",
      "Shrink-wrapped £0.04 / unit",
      "Boxed £4.50 / 500",
      "Up to 2kg £6.50",
      "Up to 10kg £9.80",
      "Up to 30kg £16.40",
      "Rolled tube, up to 1.5m £14.00",
      "Over 30kg collection, or we quote",
      "Collection no charge",
    ]);
    expect([...document.querySelectorAll(".wk-chart-m")].map((n) => n.textContent)).toEqual(["1.00", "0.92", "0.84", "0.74", "0.66", "0.58"]);
    expect(text()).toContain("Orders already placed keep their price; saved quotes and baskets are priced again.");
    await sweep("the price list");
  });

  it("lets the owner edit a section: a figure that is not a number is refused, the rest saved row by row", async () => {
    const door = new FakeDoor();
    await mount(door, "prices");
    await click(button("Edit Sheet printing"));
    expect(button("Edit Setup")).toBeUndefined();
    const fields = [...document.querySelectorAll<HTMLInputElement>(".wk-price-edit input")];
    expect(fields.map((f) => f.value)).toEqual(["0.85", "1.2"]);
    await sweep("a section being edited");
    await type(fields[0], "eighty");
    await click(button("Save"));
    expect(document.querySelector('[role="alert"]')?.textContent).toBe("Type a number, like 0.85.");
    expect(door.of("saveRate")).toEqual([]);
    await type(fields[0], "0,90");
    await click(button("Save"));
    expect(door.of("saveRate")).toEqual([{ table: "settings", id: 1, values: { print_single: 0.9 } }]);
    expect(toasts()).toEqual(["Sheet printing saved — every new quote uses it straight away."]);
    expect(text()).toContain("Single-sided£0.90 / sheet");
  });

  it("saves a stock's rate to its own row, and Escape leaves an edit unsaved", async () => {
    const door = new FakeDoor();
    await mount(door, "prices");
    await click(button("Edit Material (per SRA3 sheet)"));
    await type(document.querySelectorAll<HTMLInputElement>(".wk-price-edit input")[1], "0.15");
    await click(button("Save"));
    expect(door.of("saveRate")).toEqual([{ table: "materials", id: 2, values: { rate: 0.15 } }]);
    await click(button("Edit Turnaround & proofs"));
    await type(document.querySelector<HTMLInputElement>(".wk-price-edit input"), "40");
    await press(document.querySelector(".wk-price-edit input"), "Escape");
    expect(document.querySelector(".wk-price-edit")).toBeNull();
    expect(door.of("saveRate")).toHaveLength(1);
  });

  it("is read only for everyone but the owner", async () => {
    await mount(new FakeDoor({ roles: ["press"] }), "prices");
    expect(button(/^Edit/)).toBeUndefined();
    expect(text()).toContain("Only the owner can change the rate card.");
  });

  it("reads a typed figure as the rate card keeps it", () => {
    expect([typedRate("0.85"), typedRate("0,85"), typedRate(" 12 "), typedRate("1.2345"), typedRate("-1"), typedRate("")]).toEqual([0.85, 0.85, 12, null, null, null]);
  });
});
