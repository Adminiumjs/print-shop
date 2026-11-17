/**
 * AN ORDER'S PAYMENT, as the job ticket reads it: whether to say anything at
 * all, the chip beside the reference, each payment and each refund, and what
 * is paid or still to pay.
 *
 * Every figure is the server's: what is taken, kept and still to pay are the
 * order's own columns, each payment a row of its payments (Adminium writes
 * an online one, and one taken by hand as the person who took it). A
 * refund's state is Adminium's own, from its payment panel.
 *
 * With payments off and nothing ever paid, there is nothing to say: the
 * ticket reads as it always did.
 */
import type { PaymentPanel, PaymentsFacts, WorksData } from "./door.ts";
import { num, same, text, type Row } from "./wire.ts";

/** The ways a payment by hand is written, as the payments' `method` holds them. */
export const HAND_WAYS = ["card", "cash", "bank-transfer", "cheque", "other"] as const;
export type HandWay = (typeof HAND_WAYS)[number];

/** A payment service as a person reads its name: Adminium writes the service's own word. */
export function serviceName(provider: unknown): string | null {
  const said = text(provider);
  if (said === null) return null;
  const plain = said.replace(/^payments-/, "").toLowerCase();
  if (plain === "stripe") return "Stripe";
  if (plain === "paypal") return "PayPal";
  return said;
}

export interface PaidLine {
  kind: "paid";
  key: string;
  amount: number;
  /** When it was paid, as stored. */
  at: string | null;
  /** Online through a service, or a way by hand. */
  online: boolean;
  service: string | null;
  way: HandWay | null;
  /** Who recorded one taken by hand. */
  by: string | null;
  approvalCode: string | null;
  last4: string | null;
  /** The online payment behind it, and what may still be given back of it; nothing for one taken by hand. */
  attemptId: string | null;
  refundable: number;
}

export interface RefundLine {
  kind: "refund";
  key: string;
  amount: number;
  /** Epoch ms, when Adminium said; null when only the payment's own total says it. */
  at: number | null;
  done: boolean;
  /** Who asked for it in Adminium, and why (its reason, or the words typed), when Adminium tells this person. */
  by: string | null;
  reason: string | null;
  note: string | null;
}

export type PaymentLine = PaidLine | RefundLine;

export interface OrderPayment {
  /** Whether the ticket says anything of the order's money. */
  shown: boolean;
  lines: PaymentLine[];
  total: number;
  paid: number;
  due: number;
  refunded: number;
  /** The chip beside the reference. */
  chip: "paid" | "notPaid" | "refunded" | "partRefunded";
  /** Paid in full and wholly online through one service: the chip names it. */
  service: string | null;
}

const money = (value: unknown): number => num(value) ?? 0;

/** The order's payments, oldest first. */
export const paymentsOf = (data: WorksData, order: Row): Row[] =>
  data.payments.filter((p) => same(p["order_id"], order.id)).sort((a, b) => String(a["paid_at"] ?? "").localeCompare(String(b["paid_at"] ?? "")) || Number(a.id) - Number(b.id));

/** Still taking money: an order the customer may still pay (a collected one was paid over the counter; a cancelled one owes nothing). */
export const takesMoney = (order: Row): boolean => order["status"] === "placed" || order["status"] === "ready" || order["status"] === "dispatched";

export function orderPayment(data: WorksData, order: Row, facts: PaymentsFacts | null, panel: PaymentPanel | null = null): OrderPayment {
  const rows = paymentsOf(data, order);
  const lines: PaymentLine[] = [];
  for (const row of rows) {
    const online = row["method"] === "online";
    const ref = text(row["payment_ref"]);
    const held = online && ref !== null ? panel?.payments.find((one) => one.attemptId === ref) : undefined;
    const way = HAND_WAYS.find((w) => w === row["method"]) ?? null;
    lines.push({
      kind: "paid",
      key: `p${String(row.id)}`,
      amount: money(row["amount"]),
      at: text(row["paid_at"]),
      online,
      service: online ? serviceName(row["provider"]) : null,
      way: online ? null : way,
      by: online ? null : text(row["taken_by"]),
      approvalCode: text(row["approval_code"]),
      last4: text(row["card_last4"]),
      attemptId: online ? ref : null,
      refundable: held === undefined ? 0 : money(held.refundable),
    });
    const refunds = (held?.refunds ?? []).filter((r) => r.state !== "failed" && r.state !== "cancelled");
    if (refunds.length > 0) {
      for (const refund of refunds) lines.push({ kind: "refund", key: `r${refund.id}`, amount: money(refund.amount), at: refund.createdAt, done: refund.state === "succeeded", by: refund.by, reason: refund.reason, note: refund.note });
    } else if (money(row["refunded"]) > 0) {
      lines.push({ kind: "refund", key: `r${String(row.id)}`, amount: money(row["refunded"]), at: null, done: true, by: null, reason: null, note: null });
    }
  }
  const total = money(order["total"]);
  const taken = money(order["paid_in"]);
  const paid = money(order["paid"]);
  const refunded = money(order["refunded"]);
  // Before Adminium has worked it out (a row read from an older answer), what is due is the total.
  const due = order["due"] === null || order["due"] === undefined ? Math.max(0, total - taken) : money(order["due"]);
  const chip = due > 0 ? "notPaid" : refunded > 0 && refunded >= taken ? "refunded" : refunded > 0 ? "partRefunded" : "paid";
  const services = [...new Set(lines.flatMap((l) => (l.kind === "paid" && l.online ? [l.service] : l.kind === "paid" ? ["hand"] : [])))];
  const service = chip === "paid" && services.length === 1 && services[0] !== "hand" ? (services[0] ?? null) : null;
  const shown = rows.length > 0 || (facts?.on === true && takesMoney(order));
  return { shown, lines, total, paid, due, refunded, chip, service };
}
