/**
 * @vitest-environment jsdom
 *
 * THE WORKS' SCREENS, DRAWN AND USED: every screen and every state a person
 * reaches (the board and a card's menu, a ticket in each stage, the jobs,
 * the send-a-proof sheet, spoilage, the delivery quote, the 404, the shell's
 * loading and failure), each swept by axe; and the writes the screens make,
 * against a stand-in door that records them, with the bodies they send.
 */
import { act } from "react";
import { describe, expect, it } from "vitest";

import { screensFor } from "./WorksApp.tsx";
import { useWorks, type View, type WorksState } from "./store.ts";
import { FakeDoor } from "./testing/fakeDoor.ts";
import { button, choose, click, freshPage, mount, mountBare, settle, sweep, text, toasts, type, unmount } from "./testing/render.tsx";
import { ApiError } from "./wire.ts";

freshPage();

const card = (ref: string): HTMLElement | undefined => [...document.querySelectorAll<HTMLElement>(".wk-card")].find((c) => (c.querySelector(".wk-card-open")?.getAttribute("aria-label") ?? "").includes(ref));

describe("every screen and state, swept by axe", () => {
  const states: [string, View, Partial<WorksState>, string][] = [
    ["today", "today", {}, "Today on the floor"],
    ["a card's menu", "today", { boardMenu: 1 }, "Open the ticket"],
    ["the search", "today", { query: "harbour" }, "MP-4126"],
    ["a ticket on the press", "ticket", { jobId: 1 }, "21 up on SRA3 · 24 sheets · trimmed to 85×55"],
    ["a ticket waiting on its proof", "ticket", { jobId: 3 }, "Cut line shown in magenta."],
    ["a ticket with nothing approved", "ticket", { jobId: 2 }, "No proof sent yet."],
    ["a large-format ticket", "ticket", { jobId: 5 }, "3 × 2 m² on the roll"],
    ["a ticket in finishing, with spoilage", "ticket", { jobId: 4 }, "10 sheets spoiled on the run"],
    ["a ready delivery", "ticket", { jobId: 6 }, "Mark dispatched"],
    ["a ready collection", "ticket", { jobId: 7 }, "Mark collected"],
    ["a job made in the customiser, over the bands", "ticket", { jobId: 8 }, "Made in the customiser · HB-CARD · version 1"],
    ["a ticket not there", "ticket", { jobId: 999 }, "That job isn't on the floor any more."],
    ["the jobs", "jobs", {}, "MP-4127/2"],
    ["the 404", "notfound", {}, "This one never went to press."],
  ];
  for (const [label, view, more, shows] of states) {
    it(`draws ${label}`, async () => {
      await mount(new FakeDoor(), view, more);
      expect(text()).toContain(shows);
      await sweep(label);
    });
  }

  it("draws the proof sheet, the spoilage dialog and the delivery quote", async () => {
    for (const [overlay, shows] of [
      [{ kind: "proof", jobId: 2 }, "Drop the proof PDF, or choose it"],
      [{ kind: "proof", jobId: 8 }, "The design's proof, version 1"],
      [{ kind: "spoil", jobId: 1 }, "How many extra sheets did the run take?"],
      [{ kind: "spoil", jobId: 5 }, "Spoiled metres"],
      [{ kind: "quote", orderId: 4127 }, "Delivery to quote"],
    ] as const) {
      await mount(new FakeDoor(), "ticket", { jobId: 1, overlay });
      expect(text()).toContain(shows);
      expect(document.querySelector('[role="dialog"][aria-modal="true"]')).not.toBeNull();
      await sweep(overlay.kind);
      unmount();
    }
  });

  it("draws the shell while it reads and when the read failed", async () => {
    await mountBare(new FakeDoor());
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();
    await sweep("loading");
    await act(async () => useWorks.setState({ failure: "the network is down" }));
    expect(text()).toContain("The works' rows could not be read: the network is down");
    await sweep("failed");
  });
});

describe("the board", () => {
  it("counts the floor from the rows: due today, the press's sheets, waiting on a customer, overdue", async () => {
    await mount(new FakeDoor());
    const kpis = [...document.querySelectorAll(".wk-kpi")].map((k) => k.textContent);
    // MP-4121 is due today and late for nothing yet; MP-4126's 24 sheets are on the press;
    // three prepress jobs wait (MP-4122 unapproved, MP-4121 and MP-4127/1 sent); nothing is overdue on Wednesday.
    expect(kpis).toEqual(["1jobs due today", "24sheets on the press today", "4waiting on a customer", "0overdue"]);
  });

  it("puts each job in its column, with a padlock while its proof is not approved", async () => {
    await mount(new FakeDoor());
    const columns = [...document.querySelectorAll(".wk-col")].map((c) => [c.querySelector(".wk-col-label")?.textContent, c.querySelectorAll(".wk-card").length]);
    expect(columns).toEqual([
      ["Prepress", 5],
      ["Printing", 1],
      ["Finishing", 1],
      ["Ready", 2],
    ]);
    expect(card("MP-4121")?.querySelector(".wk-lock")).not.toBeNull();
    expect(card("MP-4123")?.querySelector(".wk-lock")).toBeNull();
    expect(card("MP-4121")?.querySelector(".wk-card-open")?.getAttribute("aria-label")).toBe("Open MP-4121 — Stickers & labels · 100 for Kestrel Joinery, waiting on the proof, due today");
  });

  it("refuses a job out of prepress before its proof is approved, in the comp's words, and asks Adminium nothing", async () => {
    const door = new FakeDoor();
    await mount(door, "today", { boardMenu: 3 });
    await click(button("Printing"));
    expect(toasts()).toEqual(["MP-4121 is waiting on the customer to approve the proof — it can't leave prepress."]);
    expect(door.of("moveJob")).toEqual([]);
  });

  it("walks an approved job onto the press and through to ready, one declared move at a time", async () => {
    const door = new FakeDoor();
    await mount(door, "today", { boardMenu: 5 });
    await click(button("Ready"));
    expect(door.of("moveJob").map((c) => [c["from"], c["to"]])).toEqual([
      ["prepress", "printing"],
      ["printing", "ready"],
    ]);
    expect(toasts()).toEqual(["MP-4123 moved to Ready."]);
    // Its order's last job is ready: the order is made ready, so the "ready" e-mail goes.
    expect(door.of("moveOrder")).toEqual([{ id: 4123, from: "placed", to: "ready", values: {} }]);
  });

  it("offers the press only its own moves", async () => {
    await mount(new FakeDoor({ roles: ["press"] }), "today", { boardMenu: 1 });
    const menu = [...document.querySelectorAll(".wk-menu-item")].map((b) => b.textContent);
    expect(menu).toEqual(["Finishing", "Ready", "Open the ticket"]);
  });

  it("drops a dragged job into a column", async () => {
    const door = new FakeDoor();
    await mount(door);
    const target = [...document.querySelectorAll<HTMLElement>(".wk-col")][2]!;
    useWorks.setState({ dragging: 1 });
    await act(async () => {
      const drop = new Event("drop", { bubbles: true }) as Event & { dataTransfer: unknown };
      Object.defineProperty(drop, "dataTransfer", { value: { getData: () => "1" } });
      target.dispatchEvent(drop);
    });
    await settle();
    expect(door.of("moveJob")).toEqual([{ id: 1, from: "printing", to: "finishing", values: {} }]);
  });

  it("offers Book a collection on a ready delivery only while a delivery company is on", async () => {
    await mount(new FakeDoor());
    expect(button("Book a collection")).toBeUndefined();
    unmount();
    await mount(new FakeDoor({ facts: { carrier: { key: "carrier", name: "Parcel Co" } } }));
    expect([...document.querySelectorAll(".wk-card-dispatch")].length).toBe(1);
    await click(button("Book a collection"));
    expect(useWorks.getState().view).toBe("dispatch");
    expect(useWorks.getState().orderId).toBe(4119);
  });

  it("opens a ticket from the search", async () => {
    await mount(new FakeDoor(), "today", { query: "kestrel" });
    await click(document.querySelector(".wk-search-row"));
    expect(useWorks.getState().view).toBe("ticket");
    expect(useWorks.getState().jobId).toBe(3);
  });
});

describe("the ticket's writes", () => {
  it("sends a proof with its PDF: the open one superseded first, the artwork marked looked over", async () => {
    const door = new FakeDoor();
    await mount(door, "ticket", { jobId: 3, overlay: { kind: "proof", jobId: 3 } });
    await choose(document.querySelector<HTMLInputElement>('input[type="file"]')!, new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], "proof-mp-4121.pdf", { type: "application/pdf" }));
    expect(text()).toContain("proof-mp-4121.pdf");
    await type(document.querySelector("textarea"), "Cut line moved in.");
    await click(button("Send"));
    expect(door.of("supersede")).toEqual([{ id: 2, from: "sent" }]);
    expect(door.of("sendProof")).toEqual([{ orderId: 4121, jobId: 3, kind: "email", file: { filename: "proof-mp-4121.pdf", type: "application/pdf" }, designVersionId: null, note: "Cut line moved in." }]);
    expect(toasts()).toEqual(["Proof sent — we've e-mailed Kestrel Joinery."]);
    expect(useWorks.getState().overlay).toBeNull();
  });

  it("refuses a proof that is not a PDF, or none at all, in the comp's words", async () => {
    const door = new FakeDoor();
    await mount(door, "ticket", { jobId: 2, overlay: { kind: "proof", jobId: 2 } });
    await click(button("Send"));
    expect(document.querySelector('[role="alert"]')?.textContent).toBe("Add the proof PDF before you send it.");
    await choose(document.querySelector<HTMLInputElement>('input[type="file"]')!, new File(["x"], "menu-draft.docx"));
    expect(document.querySelector('[role="alert"]')?.textContent).toBe("That isn't a PDF — a proof goes out as a PDF file.");
    expect(door.of("sendProof")).toEqual([]);
  });

  it("attaches the Customiser's proof of the design, sends it by post when the order paid for it, and names the version", async () => {
    const door = new FakeDoor();
    const data = door.data;
    data.jobs = data.jobs.map((j) => (j.id === 8 ? { ...j, proof_by_post: true, proof_price: "12.00" } : j));
    await mount(door, "ticket", { jobId: 8, overlay: { kind: "proof", jobId: 8 } });
    expect(button(/Printed, by post \(£12\.00\)/)?.getAttribute("aria-checked")).toBe("true");
    await click(button("Send"));
    expect(door.of("sendProof")).toEqual([{ orderId: 4127, jobId: 8, kind: "post", file: { copyOf: "/api/v1/files/file_01J8Z6Q3M4N5P6R7S8T9V0W1XA/content" }, designVersionId: 700, note: null }]);
  });

  it("records spoilage as a row of its own, and refuses a number a run cannot take", async () => {
    const door = new FakeDoor();
    await mount(door, "ticket", { jobId: 1, overlay: { kind: "spoil", jobId: 1 } });
    await type(document.querySelector(".wk-dialog input"), "0");
    await click(button("Add to the run"));
    expect(document.querySelector('[role="alert"]')?.textContent).toBe("Type how many sheets were spoiled — at least 1.");
    await type(document.querySelector(".wk-dialog input"), "9000");
    await click(button("Add to the run"));
    expect(document.querySelector('[role="alert"]')?.textContent).toBe("That's more than a run takes — check the number (5,000 at most).");
    await type(document.querySelector(".wk-dialog input"), "12");
    await click(button("Add to the run"));
    expect(door.of("spoil")).toEqual([{ jobId: 1, qty: 12, note: null }]);
    expect(toasts()).toEqual(["Spoilage recorded on MP-4126 — 12 sheets."]);
    expect(text()).toContain("12 sheets spoiled on the run");
  });

  it("marks a job printed and ready, and its order with its last job", async () => {
    const door = new FakeDoor();
    await mount(door, "ticket", { jobId: 1 });
    await click(button("Mark printed"));
    expect(door.of("moveJob").map((c) => c["to"])).toEqual(["finishing"]);
    expect(toasts()).toEqual(["MP-4126 moved to Finishing."]);
    await click(button("Mark ready"));
    expect(door.of("moveJob").map((c) => c["to"])).toEqual(["finishing", "ready"]);
    expect(door.of("moveOrder")).toEqual([{ id: 4126, from: "placed", to: "ready", values: {} }]);
  });

  it("hands a ready job over the counter and its order with it", async () => {
    const door = new FakeDoor({ roles: ["counter"] });
    await mount(door, "ticket", { jobId: 7 });
    await click(button("Mark collected"));
    expect(door.of("moveJob")).toEqual([{ id: 7, from: "ready", to: "collected", values: {} }]);
    expect(door.of("moveOrder")).toEqual([{ id: 4115, from: "ready", to: "collected", values: {} }]);
    expect(toasts()).toEqual(["MP-4115 handed over the counter."]);
    expect(text()).toContain("Collected — over the counter.");
  });

  it("dispatches a ready delivery with no delivery company on: each job, then the order", async () => {
    const door = new FakeDoor({ roles: ["counter"] });
    await mount(door, "ticket", { jobId: 6 });
    await click(button("Mark dispatched"));
    expect(door.of("moveJob")).toEqual([{ id: 6, from: "ready", to: "dispatched", values: {} }]);
    expect(door.of("moveOrder")).toEqual([{ id: 4119, from: "ready", to: "dispatched", values: {} }]);
  });

  it("prices a delivery over the bands: the ruled starting value, then the works' own price sent", async () => {
    const door = new FakeDoor({ roles: ["counter"] });
    await mount(door, "ticket", { jobId: 8 });
    await click(button("Price the delivery"));
    const field = document.querySelector<HTMLInputElement>(".wk-sheet input")!;
    // 53.2 kg over the 30 kg band: two parcels at £16.40, as plan CR17 rules.
    expect(field.value).toBe("32.80");
    expect(text()).toContain("2 parcels of up to 30kg at £16.40 each");
    await type(field, "thirty");
    await click(button("Send the quote"));
    expect(document.querySelector('[role="alert"]')?.textContent).toBe("Type an amount, like 32.80.");
    await type(field, "29,50");
    await click(button("Send the quote"));
    expect(door.of("updateOrder")).toEqual([{ id: 4127, values: { delivery_quote: 29.5, delivery_quote_state: "sent" } }]);
    expect(toasts()).toEqual(["Delivery quote sent — we've e-mailed Harbour Bakery."]);
    expect(text()).toContain("Delivery quote sent · £29.50 · waiting on the customer");
  });

  it("says a refusal in the reader's words and reads the rows again", async () => {
    const door = new FakeDoor();
    door.refuse("moveJob", new ApiError(403, "FORBIDDEN", "No."));
    await mount(door, "ticket", { jobId: 1 });
    await click(button("Mark printed"));
    expect(toasts()).toEqual(["Your role can't do that here."]);
    door.refuse("moveJob", new ApiError(409, "STATE_MOVE_REFUSED", "It moved.", { named: "stage" }));
    await click(button("Mark printed"));
    expect(toasts().at(-1)).toBe("That job moved on while you were looking — here it is as it stands now.");
  });

  it("shows each role only what it does", async () => {
    await mount(new FakeDoor({ roles: ["press"] }), "ticket", { jobId: 1 });
    expect([button("Send a proof"), button("Mark printed"), button("Record spoilage"), button("Mark ready")].map((b) => b !== undefined)).toEqual([false, true, true, true]);
    unmount();
    await mount(new FakeDoor({ roles: ["prepress"] }), "ticket", { jobId: 3 });
    expect([button("Send a proof"), button("Mark printed"), button("Record spoilage"), button("Mark ready")].map((b) => b !== undefined)).toEqual([true, false, false, false]);
    unmount();
    await mount(new FakeDoor({ roles: ["press"] }), "ticket", { jobId: 7 });
    expect(text()).toContain("The counter hands this one over.");
  });
});

describe("the shell", () => {
  it("lists the works' screens a role reaches, and Shipments only with a delivery company on", () => {
    const door = new FakeDoor();
    expect(screensFor(door.who(), false)).toEqual(["today", "jobs", "materials", "prices", "addons"]);
    expect(screensFor(door.who(), true)).toEqual(["today", "jobs", "materials", "prices", "shipments", "addons"]);
    expect(screensFor(new FakeDoor({ roles: ["press"] }).who(), true)).toEqual(["today", "jobs", "materials", "prices", "shipments"]);
  });

  it("says who is signed in, the works' own address and its week", async () => {
    await mount(new FakeDoor());
    expect(document.querySelector(".wk-user")?.textContent).toBe("RMRosa · owner");
    expect(document.querySelector(".wk-sidebar-foot")?.textContent).toBe("Mon–Fri · Sheet press, Wide roll printer");
    expect(document.querySelector(".wk-footer")?.textContent).toContain("© 2026 Marlow Press · 3 Market Square, Marlow SL7 1AA");
  });

  it("goes back to the board from the 404", async () => {
    await mount(new FakeDoor(), "notfound");
    await click(button("Back to the board"));
    expect(useWorks.getState().view).toBe("today");
  });
});
