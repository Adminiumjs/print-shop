/**
 * Paying for an order online, as the manifest says it: which orders may be
 * paid and when, where a payment lands, who may write what of it, and who may
 * give money back.
 */
import { describe, expect, it } from "vitest";

import { evaluateFormula, type FormulaExpr } from "../demo/formula.ts";
import { validateManifest } from "../testing/manifest/index.ts";
import { buildManifest } from "./build.ts";
import { ONLINE_ONLY } from "./roles.ts";

type Json = Record<string, unknown>;
type Column = { ref: string; type: string; unique?: boolean; nullable?: boolean; rules?: Json };
type Role = { key: string; permissions: string[]; limits?: Record<string, Json> };

const manifest = buildManifest() as Json & {
  requiredSchema: { tables: { ref: string; columns: Column[] }[] };
  roles: Role[];
  publicAccess: { table: string; key?: string; methods: string[]; select?: string[]; writable?: string[] }[];
  payments: { payables: Json[] };
};
const table = (ref: string) => manifest.requiredSchema.tables.find((t) => t.ref === ref)!;
const column = (t: string, c: string) => table(t).columns.find((one) => one.ref === c)!;
const role = (key: string) => manifest.roles.find((r) => r.key === key)!;
const payable = manifest.payments.payables[0]!;
const formula = (t: string, c: string) => (column(t, c).rules!["formula"] as FormulaExpr);

describe("an order paid online", () => {
  it("is the one payable: its total, what is still to pay, the connection's currency, its payments in the order's own table", () => {
    expect(manifest.payments.payables).toHaveLength(1);
    expect(payable).toMatchObject({
      table: "orders",
      label: "number",
      amount: { column: "total" },
      currency: { connection: true },
      due: { column: "due" },
      customerEmail: "email",
      returnTo: "/order",
      receipt: "engine",
    });
    expect(payable["payments"]).toEqual({
      kind: "table",
      table: "payments",
      link: "order_id",
      amount: "amount",
      paidAt: "paid_at",
      method: { column: "method", values: { "*": "online" } },
      note: "note",
      reference: "payment_ref",
      approvalCode: "approval_code",
      last4: "card_last4",
      refunded: "refunded",
      provider: "provider",
      currency: "currency",
    });
    // No status is moved by a payment: an order's status is the works' floor, not its money.
    expect(payable["status"]).toBeUndefined();
  });

  it("may be paid once every proof is approved and no delivery price is still to agree, while placed, ready or on its way", () => {
    expect(payable["payableWhen"]).toEqual([
      { column: "pay_open", eq: 1 },
      { column: "status", in: ["placed", "ready", "dispatched"] },
    ]);
    const open = (row: Json) => evaluateFormula(formula("orders", "pay_open"), { ...row, quote_open: evaluateFormula(formula("orders", "quote_open"), row, 0) }, 0);
    const base = { item_count: 2, proofs_approved: 2, delivery_to_quote: 0, delivery_quote_state: null };
    expect(open(base)).toBe("1");
    // One job's proof still waiting.
    expect(open({ ...base, proofs_approved: 1 })).toBe("0");
    // A delivery the works still prices, or has priced and the customer has not accepted.
    expect(open({ ...base, delivery_to_quote: 1, delivery_quote_state: "to_quote" })).toBe("0");
    expect(open({ ...base, delivery_to_quote: 1, delivery_quote_state: "sent" })).toBe("0");
    // Accepted: the total is the one they pay.
    expect(open({ ...base, delivery_to_quote: 1, delivery_quote_state: "accepted" })).toBe("1");
    // Nothing on it.
    expect(open({ ...base, item_count: 0, proofs_approved: 0 })).toBe("0");
  });

  it("marks for the e-mails what holds of paying, each empty unless it holds", () => {
    const mark = (c: string, row: Json) => evaluateFormula(formula("orders", c), row, 0);
    expect([mark("collects", { delivery_method: "collect" }), mark("collects", { delivery_method: "deliver" })]).toEqual(["1", null]);
    const payable = { pay_open: 1, due: "20.00" };
    expect(mark("pay_collect", { ...payable, delivery_method: "collect" })).toBe("1");
    expect(mark("pay_collect", { ...payable, delivery_method: "deliver" })).toBeNull();
    expect(mark("pay_invoice", { ...payable, delivery_method: "deliver" })).toBe("1");
    expect(mark("pay_invoice", { pay_open: 0, due: "20.00", delivery_method: "deliver" })).toBeNull();
    expect(mark("pay_collect", { pay_open: 1, due: "0.00", delivery_method: "collect" })).toBeNull();
    const settled = { due: "0.00", paid_in: "120.00" };
    expect([mark("paid_all_online", { ...settled, paid: "120.00", paid_online: "120.00" }), mark("paid_by_hand", { ...settled, paid: "120.00", paid_online: "120.00" })]).toEqual(["1", null]);
    expect([mark("paid_all_online", { ...settled, paid: "120.00", paid_online: null }), mark("paid_by_hand", { ...settled, paid: "120.00", paid_online: null })]).toEqual([null, "1"]);
    expect([mark("paid_all_online", { due: "20.00", paid_in: "100.00", paid: "100.00", paid_online: "100.00" }), mark("paid_by_hand", { due: "20.00", paid_in: "0", paid: "0" })]).toEqual([null, null]);
  });

  it("counts a job's approved proof only while the job is not cancelled", () => {
    expect(column("orders", "proofs_approved").rules!["rollup"]).toEqual({ from: "jobs", via: "order_id", sum: "proof_ok", unlessSet: "cancelled_at" });
  });

  it("owes its total less what its payments took, never below nothing, and prints it only while something is owed", () => {
    const due = (row: Json) => evaluateFormula(formula("orders", "due"), row, 2);
    expect(due({ total: "120.00", paid_in: null })).toBe("120.00");
    expect(due({ total: "120.00", paid_in: "100.00" })).toBe("20.00");
    expect(due({ total: "120.00", paid_in: "130.00" })).toBe("0.00");
    // A refund does not make the order owe it again: the works gave it back.
    expect(due({ total: "120.00", paid_in: "120.00", paid: "108.00" })).toBe("0.00");
    expect(column("orders", "paid_in").rules!["rollup"]).toEqual({ from: "payments", via: "order_id", sum: "amount" });
    expect(evaluateFormula(formula("orders", "owing"), { due: "0.00" }, 2)).toBeNull();
    expect(evaluateFormula(formula("orders", "owing"), { due: "20.00" }, 2)).toBe("20.00");
    // A refund takes off what a payment kept.
    expect(evaluateFormula(formula("payments", "net_amount"), { amount: "120.00", refunded: "12.00" }, 2)).toBe("108.00");
    expect(column("orders", "paid").rules!["rollup"]).toEqual({ from: "payments", via: "order_id", sum: "net_amount" });
    expect(column("orders", "paid_online").rules!["rollup"]).toEqual({ from: "payments", via: "order_id", sum: "net_amount", where: { column: "method", eq: "online" } });
  });

  it("keeps each payment's reference in a text column marked unique, and its ways online and Adminium's ways by hand", () => {
    expect(column("payments", "payment_ref")).toMatchObject({ type: "text", unique: true, nullable: true });
    expect((column("payments", "method") as Column & { enum: string[] }).enum).toEqual(["online", "card", "cash", "bank-transfer", "cheque", "other"]);
    expect(column("payments", "approval_code")).toMatchObject({ type: "text", maxLength: 12 });
    expect(column("payments", "card_last4")).toMatchObject({ type: "text", maxLength: 4 });
  });

  it("reads at 0.3.62 once shipping is left out, whose e-mails follow payments, and an older Adminium refuses it", () => {
    const { shipping: _shipping, ...before } = manifest as Json;
    const unrighted = (before["roles"] as { permissions: string[] }[]).map((r) => ({ ...r, permissions: r.permissions.filter((p) => !p.startsWith("shipping:@:")) }));
    const at = (floor: string) => validateManifest({ ...before, roles: unrighted, compatibility: { ...(before["compatibility"] as Json), minAdminiumVersion: floor } });
    expect(at("0.3.62").ok).toBe(true);
    expect(at("0.3.61").ok).toBe(false);
    expect(at("0.3.59").ok).toBe(false);
  });
});

describe("who writes a payment, and who gives money back", () => {
  it("lets the owner alone refund, and only this app's payments", () => {
    expect(role("owner").permissions).toContain("payments:@:refund");
    for (const key of ["prepress", "press", "counter"]) expect(role(key).permissions.filter((p) => p.startsWith("payments:")), key).toEqual([]);
  });

  it("lets the counter read the payments and write none itself: Adminium records what it takes", () => {
    const held = role("counter").permissions.filter((p) => p.startsWith("table:@payments:"));
    expect(held).toEqual(["table:@payments:read"]);
    expect(role("counter").limits!["payments"]).toBeUndefined();
    // Recording a payment by hand asks to change the order: the counter may.
    expect(role("counter").permissions).toContain("table:@orders:update");
  });

  it("lets the press and prepress neither read nor write a payment", () => {
    for (const key of ["prepress", "press"]) expect(role(key).permissions.filter((p) => p.includes("@payments:")), key).toEqual([]);
  });

  it("never lets a role write what only an online payment fills, nor mark a payment online", () => {
    for (const r of manifest.roles) {
      const limit = r.limits?.["payments"] as { writable?: string[]; creatable?: string[]; creatableValues?: Json; writableValues?: Json } | undefined;
      if (!r.permissions.some((p) => /^table:@payments:(create|update)$/.test(p))) continue;
      expect(limit, r.key).toBeDefined();
      for (const c of ONLINE_ONLY) {
        expect(limit!.creatable ?? [], `${r.key} creates ${c}`).not.toContain(c);
        expect(limit!.writable ?? [], `${r.key} writes ${c}`).not.toContain(c);
      }
      expect(limit!.creatableValues, r.key).toEqual({ method: ["card", "cash", "bank-transfer", "cheque", "other"] });
      if (limit!.writable !== undefined) expect(limit!.writableValues, r.key).toEqual({ method: ["card", "cash", "bank-transfer", "cheque", "other"] });
    }
  });

  it("shows a customer what was paid and is still to pay, never a payment's own row", () => {
    expect(manifest.publicAccess.filter((e) => e.table === "payments")).toEqual([]);
    for (const entry of manifest.publicAccess.filter((e) => e.table === "orders" && e.methods.includes("GET"))) {
      expect(entry.select, entry.key ?? "customer").toEqual(expect.arrayContaining(["paid", "paid_online", "due", "last_paid_at", "pay_open"]));
      for (const c of ["paid", "due", "pay_open", "refunded"]) expect(entry.writable ?? [], c).not.toContain(c);
    }
  });
});
