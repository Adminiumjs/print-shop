/**
 * @vitest-environment jsdom
 *
 * THE ORDER'S MONEY ON THE JOB TICKET, drawn and used: with payments off the
 * ticket reads as it did; with them on, the Paid / Not paid chip, the
 * Payment card, "Copy pay link", "Refund" for someone who may, and the
 * counter's "Take payment and hand over" by card on the terminal, cash or the
 * pay link, each against a stand-in door that records what is sent.
 */
import { describe, expect, it, vi } from "vitest";

import type { PaymentPanel, PaymentsFacts } from "./door.ts";
import { FakeDoor } from "./testing/fakeDoor.ts";
import { fixture } from "./testing/fixture.ts";
import { button, click, freshPage, mount, settle, sweep, text, toasts, type } from "./testing/render.tsx";
import { same, type Row } from "./wire.ts";

freshPage();

const ON: PaymentsFacts = { on: true, online: true, test: false, refund: true };

/** MP-4115, ready to collect: £30.00, nothing paid, its proofs approved. */
function owing(): ReturnType<typeof fixture> {
  const data = fixture();
  data.orders = data.orders.map((o) => (same(o.id, 4115) ? { ...o, total: "30.00", due: "30.00", paid_in: "0", paid: "0", refunded: "0", pay_open: 1 } : o));
  return data;
}

/** MP-4115 paid online through Stripe on the morning it was ready. */
function paidOnline(refunded = "0"): ReturnType<typeof fixture> {
  const data = owing();
  data.orders = data.orders.map((o) => (same(o.id, 4115) ? { ...o, due: "0", paid_in: "30.00", paid: (30 - Number(refunded)).toFixed(2), refunded, last_paid_at: "2026-08-05T08:42:00.000Z" } : o));
  data.payments = [{ id: 1, order_id: 4115, amount: "30.00", method: "online", provider: "Stripe", payment_ref: "pat_1", paid_at: "2026-08-05T08:42:00.000Z", refunded, net_amount: (30 - Number(refunded)).toFixed(2) }];
  return data;
}

const panel = (over: Partial<PaymentPanel> = {}) => (order: Row): PaymentPanel => ({
  payable: { kind: "profile", connectionId: "conn-1", tableName: "main.printing_orders", rowKey: String(order.id) },
  due: String(order["due"] ?? "0"),
  mayChange: true,
  mayRefund: true,
  waiting: false,
  payments: [],
  ...over,
});

function paying(data: ReturnType<typeof fixture>, roles = ["owner"], facts: PaymentsFacts = ON, over: Partial<PaymentPanel> = {}): FakeDoor {
  const door = new FakeDoor({ data, roles, facts: { payments: facts } });
  door.paying = { panel: panel(over), link: "https://pay.example/p/tok_7Hq", kit: false };
  return door;
}

const ticket = { jobId: 7 } as const;

describe("with payments off", () => {
  it("reads as it always did: Mark collected, no chip, no payment card", async () => {
    await mount(new FakeDoor({ data: owing() }), "ticket", ticket);
    expect(button("Mark collected")).toBeDefined();
    expect(button("Take payment and hand over")).toBeUndefined();
    expect(document.querySelector('[data-testid="pay-chip"]')).toBeNull();
    expect(document.querySelector('[data-testid="ticket-payment"]')).toBeNull();
  });

  it("says nothing either from an Adminium that switched the works on but serves no payment door", async () => {
    await mount(new FakeDoor({ data: owing(), facts: { payments: ON } }), "ticket", ticket);
    expect(button("Mark collected")).toBeDefined();
  });
});

describe("with payments on, an order not paid", () => {
  it("says Not paid beside the reference, what is to pay, and offers its pay link to copy", async () => {
    const door = paying(owing());
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    await mount(door, "ticket", ticket);
    expect(document.querySelector('[data-testid="pay-chip"]')?.textContent).toBe("Not paid");
    const card = document.querySelector('[data-testid="ticket-payment"]')!;
    expect(card.textContent).toContain("To pay");
    expect(card.textContent).toContain("£30.00");
    expect(card.textContent).toContain("Not paid. A pay link opens the pay page for £30.00. Send it by e-mail.");
    await click(button("Copy pay link"));
    expect(door.of("payLink")).toEqual([{ id: 4115 }]);
    expect(writeText).toHaveBeenCalledWith("https://pay.example/p/tok_7Hq");
    expect(toasts()).toContain("Pay link copied. It opens the pay page for £30.00.");
    // The panel is read once per change of the order's money, never in a loop.
    expect(door.of("paymentState").length).toBeLessThanOrEqual(2);
    await sweep("a ticket not paid");
  });

  it("offers no pay link to copy to someone who may not change the order", async () => {
    await mount(paying(owing(), ["owner"], ON, { mayChange: false }), "ticket", ticket);
    expect(button("Copy pay link")).toBeUndefined();
  });

  it("asks the counter to take payment as it hands the order over", async () => {
    await mount(paying(owing(), ["counter"]), "ticket", ticket);
    expect(button("Take payment and hand over")).toBeDefined();
    expect(button("Mark collected")).toBeUndefined();
  });
});

describe("taking payment at the counter", () => {
  it("says what a card's slip must give before anything is sent, each error tied to its field", async () => {
    const door = paying(owing(), ["counter"]);
    await mount(door, "ticket", ticket);
    await click(button("Take payment and hand over"));
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain("How are they paying?");
    await click(button("Record and hand over"));
    expect(door.of("recordPayment")).toEqual([]);
    for (const id of ["take-approval", "take-last4"]) {
      const field = document.querySelector<HTMLInputElement>(`[data-testid="${id}"]`)!;
      expect(field.getAttribute("aria-invalid")).toBe("true");
      const described = field.getAttribute("aria-describedby")!.split(" ");
      expect(described).toHaveLength(2);
      for (const one of described) expect(document.getElementById(one)).not.toBeNull();
    }
    expect(text()).toContain("Type the approval code, up to 12 letters or numbers.");
    expect(text()).toContain("Type exactly 4 digits.");
    await sweep("the card's errors");
  });

  it("records a card on the terminal through Adminium, then hands the job over", async () => {
    const door = paying(owing(), ["counter"]);
    await mount(door, "ticket", ticket);
    await click(button("Take payment and hand over"));
    await type(document.querySelector('[data-testid="take-approval"]'), "084213");
    await type(document.querySelector('[data-testid="take-last4"]'), "4417");
    await click(button("Record and hand over"));
    const [recorded] = door.of("recordPayment");
    expect(recorded).toMatchObject({ id: 4115, amount: "30.00", way: "card", approvalCode: "084213", last4: "4417", paidOn: "2026-08-05" });
    expect(String(recorded!["key"])).toMatch(/^[A-Za-z0-9_-]{16,59}$/);
    expect(door.of("moveJob")).toEqual([{ id: 7, from: "ready", to: "collected", values: {} }]);
    expect(toasts()).toContain("MP-4115 handed over. £30.00 recorded · Card on the terminal.");
  });

  it("records cash with no card details", async () => {
    const door = paying(owing(), ["counter"]);
    await mount(door, "ticket", ticket);
    await click(button("Take payment and hand over"));
    await click(button(/^Cash/));
    expect(text()).toContain("Take £30.00 in cash.");
    await click(button("Record and hand over"));
    expect(door.of("recordPayment")).toMatchObject([{ way: "cash", approvalCode: null, last4: null, amount: "30.00" }]);
    expect(toasts()).toContain("MP-4115 handed over. £30.00 recorded · Cash.");
  });

  it("hands nothing over when Adminium refuses more than is due", async () => {
    const door = paying(owing(), ["counter"]);
    await mount(door, "ticket", ticket);
    await click(button("Take payment and hand over"));
    await click(button(/^Cash/));
    // Paid elsewhere meanwhile: Adminium has the order owing less than the sheet read.
    door.data.orders = door.data.orders.map((o) => (same(o.id, 4115) ? { ...o, due: "10.00" } : o));
    await click(button("Record and hand over"));
    expect(door.of("moveJob")).toEqual([]);
    expect(toasts()).toContain("That is more than the order still owes. Read it again.");
  });

  it("shows the pay link and its QR for the customer's own phone, and hands nothing over until it is paid", async () => {
    const door = paying(owing(), ["counter"]);
    await mount(door, "ticket", ticket);
    await click(button("Take payment and hand over"));
    await click(button(/^Pay link/));
    expect(door.of("payLink")).toEqual([{ id: 4115 }]);
    expect(document.querySelector('[data-testid="take-link"]')?.textContent).toContain("https://pay.example/p/tok_7Hq");
    await click(button("Show its QR"));
    const qr = document.querySelector('[role="img"][aria-label="QR code for the pay link"]');
    expect(qr?.querySelector("svg")).not.toBeNull();
    await sweep("the pay link and its QR");
    await click(button("Record and hand over"));
    expect(door.of("recordPayment")).toEqual([]);
    expect(door.of("moveJob")).toEqual([]);
    expect(document.querySelector('[role="status"][data-check]')?.textContent).toBe("Not paid yet. Nothing was handed over.");
  });

  it("offers no pay link way while customers cannot pay online", async () => {
    await mount(paying(owing(), ["counter"], { ...ON, online: false }), "ticket", ticket);
    await click(button("Take payment and hand over"));
    expect(button(/^Pay link/)).toBeUndefined();
  });

  it("finds an order already paid online, and only hands it over", async () => {
    const door = paying(paidOnline(), ["counter"]);
    await mount(door, "ticket", ticket);
    expect(document.querySelector('[data-testid="pay-chip"]')?.textContent).toBe("Paid · Online · Stripe");
    await click(button("Take payment and hand over"));
    const already = document.querySelector('[data-testid="take-already"]')!;
    expect(already.textContent).toContain("Already paid online");
    expect(already.textContent).toContain("Online · Stripe");
    await click(button("Record and hand over"));
    expect(door.of("recordPayment")).toEqual([]);
    expect(door.of("moveJob")).toEqual([{ id: 7, from: "ready", to: "collected", values: {} }]);
  });
});

describe("a payment taken by hand, and a refund", () => {
  it("reads a card payment as Paid, with its way and its slip, and no pay link", async () => {
    const data = owing();
    data.orders = data.orders.map((o) => (same(o.id, 4115) ? { ...o, due: "0", paid_in: "30.00", paid: "30.00" } : o));
    data.payments = [{ id: 2, order_id: 4115, amount: "30.00", method: "card", approval_code: "084213", card_last4: "4417", payment_ref: "hand_k", paid_at: "2026-08-05T12:00:00.000Z", taken_by: "Ben", refunded: "0", net_amount: "30.00" }];
    await mount(paying(data), "ticket", ticket);
    expect(document.querySelector('[data-testid="pay-chip"]')?.textContent).toBe("Paid");
    const card = document.querySelector('[data-testid="ticket-payment"]')!;
    expect(card.textContent).toContain("Card on the terminal");
    expect(card.textContent).toContain("approval 084213 · ••4417");
    expect(card.textContent).toContain("by Ben");
    expect(card.textContent).not.toContain("Online");
    expect(button("Copy pay link")).toBeUndefined();
    expect(button("Refund")).toBeUndefined();
  });

  it("offers Refund on an online payment to someone who may, and draws Adminium's own refund in a sheet", async () => {
    const door = paying(paidOnline(), ["owner"], ON, { payments: [{ attemptId: "pat_1", refundable: "30.00", refunds: [] }] });
    await mount(door, "ticket", ticket);
    await click(button("Refund"));
    const sheet = document.querySelector('[role="dialog"]')!;
    expect(sheet.textContent).toContain("Refund a payment");
    // This stand-in serves no kit: the sheet says where to refund instead.
    expect(sheet.textContent).toContain("This Adminium cannot show the refund here. Refund it in Payments.");
    await sweep("the refund sheet");
  });

  it("shows nothing extra to someone who may not refund: no greyed button", async () => {
    await mount(paying(paidOnline(), ["counter"], { ...ON, refund: false }, { mayRefund: false, payments: [{ attemptId: "pat_1", refundable: "30.00", refunds: [] }] }), "ticket", ticket);
    expect(button("Refund")).toBeUndefined();
    expect(document.querySelector(".wk-pay-refund")).toBeNull();
  });

  it("lists a refund under its payment, and calls an order wholly given back Refunded", async () => {
    const door = paying(paidOnline("30.00"), ["owner"], ON, { payments: [{ attemptId: "pat_1", refundable: "0", refunds: [{ id: "r1", amount: "30.00", state: "succeeded", createdAt: Date.parse("2026-08-05T09:00:00Z"), by: "Rosa Marlow", reason: "other", note: null }] }] });
    await mount(door, "ticket", ticket);
    await settle();
    expect(document.querySelector('[data-testid="pay-chip"]')?.textContent).toBe("Refunded");
    const card = document.querySelector('[data-testid="ticket-payment"]')!;
    expect(card.textContent).toContain("Refunded");
    expect(card.textContent).toContain("−£30.00");
    // Who gave it back and why, as Adminium tells the owner: the reason picked when no words were typed.
    expect(card.textContent).toContain("Wed, Aug 5 · by Rosa Marlow · Other");
    expect(button("Refund")).toBeUndefined();
  });

  it("calls a part given back by what went back, and says why in the words typed", async () => {
    await mount(paying(paidOnline("12.00"), ["owner"], ON, { payments: [{ attemptId: "pat_1", refundable: "18.00", refunds: [{ id: "r2", amount: "12.00", state: "succeeded", createdAt: Date.parse("2026-08-05T09:00:00Z"), by: "Rosa Marlow", reason: "requested_by_customer", note: "Flyers trimmed short" }] }] }), "ticket", ticket);
    expect(document.querySelector('[data-testid="pay-chip"]')?.textContent).toBe("Refunded £12.00");
    expect(document.querySelector('[data-testid="ticket-payment"]')?.textContent).toContain("Wed, Aug 5 · by Rosa Marlow · Flyers trimmed short");
  });

  it("says no person for a refund Adminium names none for (one made in the service's own dashboard)", async () => {
    await mount(paying(paidOnline("12.00"), ["owner"], ON, { payments: [{ attemptId: "pat_1", refundable: "18.00", refunds: [{ id: "r3", amount: "12.00", state: "succeeded", createdAt: Date.parse("2026-08-05T09:00:00Z"), by: null, reason: null, note: null }] }] }), "ticket", ticket);
    const card = document.querySelector('[data-testid="ticket-payment"]')!.textContent ?? "";
    expect(card).toContain("Refunded");
    expect(card).not.toContain(" by ");
  });
});

describe("in Arabic, right to left", () => {
  it("draws the payment card and the counter's sheet with nothing left in English", async () => {
    localStorage.setItem("print-shop-locale", "ar-EG");
    await mount(paying(owing(), ["counter"]), "ticket", ticket);
    expect(document.documentElement.getAttribute("dir")).toBe("rtl");
    expect(document.querySelector('[data-testid="pay-chip"]')?.textContent).toBe("غير مدفوع");
    await click(document.querySelector('[data-testid="take-payment"]'));
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain("كيف يدفع العميل؟");
    await sweep("ar-EG · the counter's sheet");
  });
});
