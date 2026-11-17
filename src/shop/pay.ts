/**
 * Paying for an order online, from the customer's order page.
 *
 * Whether the page offers it is Adminium's answer (`payOffer`): only while
 * the works takes payments online. Otherwise there is no "Pay now" at all,
 * greyed or otherwise, and every page reads as it always has.
 *
 * "Pay now" asks Adminium for the order's pay link through the session that
 * reads the order (the amount is what the order still owes, never one the
 * page sends) and takes the customer to Adminium's pay page in this tab.
 * The pay page sends them back to the order page with nothing in the
 * address (a forwarded pay link must never hand the order over), so before
 * leaving, this tab keeps which order it was and the session that read it,
 * in its own storage, gone with the tab; on the way back the order is read
 * again by that session, and shows paid once Adminium has recorded the
 * payment.
 *
 *   idle      the pay box, beside the works' own ways
 *   taking    "Taking you to the secure payment page…"
 *   checking  back from the pay page: the order read again
 *   failed    no pay link was handed out (paid meanwhile, or the works
 *             stopped taking payments online): "The payment didn't
 *             finish. Nothing was taken."
 *
 * The website's demo has no pay page: its stand-in takes the payment when
 * "Pay now" is pressed, the hand-off is shown a moment, and the order reads
 * paid (no money moves).
 *
 * Coming back, the page asks Adminium how the order's newest payment stands
 * (`payState`) and says so: paid (the order read again); the bank still
 * confirming it, which some ways take days for (no "Pay now" then: it is
 * not to be paid twice); not finished, or the pay page's time run out
 * (nothing was taken, and "Pay now" is there again). A checkout the service
 * has not answered yet is asked about again, a few seconds apart.
 */
import { create } from "zustand";

import { deviceNow } from "../studio/clock.ts";
import type { PayOffer, PayStanding, Via } from "./after-port.ts";
import type { Id, Row } from "./port.ts";

export type PayPhase = "idle" | "taking" | "checking" | "failed";

/** What the way back from the pay page found, when it was not paid: the bank confirming it, not finished, or out of time. */
export type Returned = "confirming" | "failed" | "expired";

export interface PayState {
  /** Adminium's answer; null until asked, and then the page reads as it always has. */
  offer: PayOffer | null;
  phase: PayPhase;
  /** The order this tab came back to from the pay page and found paid: the page says so once. */
  paidOnReturn: Id | null;
  /** The order this tab came back to unpaid, and how its payment stands. */
  returned: { orderId: Id; standing: Returned } | null;
}

export const usePay = create<PayState>(() => ({ offer: null, phase: "idle", paidOnReturn: null, returned: null }));

/** Where this tab keeps the order it went to pay for, and how long that holds. */
export const PAYING_KEY = "printing.shop.paying";
const PAYING_HOLDS_MS = 3 * 3_600_000;

interface Kept {
  via: Via;
  orderId: string;
  session: { token: string; expiresAt: number };
  at: number;
}

function tab(): Storage | null {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    return null;
  }
}

/** The order this tab went to pay for lately, with the session that read it; null otherwise. Never throws. */
export function wentToPay(now = deviceNow()): Kept | null {
  try {
    const raw = tab()?.getItem(PAYING_KEY) ?? null;
    if (raw === null) return null;
    const kept = JSON.parse(raw) as Partial<Kept>;
    if ((kept.via !== "mine" && kept.via !== "link") || typeof kept.orderId !== "string" || typeof kept.at !== "number" || now - kept.at > PAYING_HOLDS_MS) return null;
    const session = kept.session;
    if (session === undefined || typeof session.token !== "string" || typeof session.expiresAt !== "number" || session.expiresAt <= now) return null;
    return { via: kept.via, orderId: kept.orderId, session, at: kept.at };
  } catch {
    return null;
  }
}

/** Forget the order this tab went to pay for (it came back, the customer signed out, or let the link go). */
export function forgetPaying(): void {
  try {
    tab()?.removeItem(PAYING_KEY);
  } catch {
    // It ends with the tab.
  }
}

function keep(kept: Kept): void {
  try {
    tab()?.setItem(PAYING_KEY, JSON.stringify(kept));
  } catch {
    // Without it the customer comes back to the order's own link from their e-mail, which still opens it.
  }
}

/** How the tab leaves for the pay page: the browser's own address, or a test's. */
let leave: (url: string) => void = (url) => window.location.assign(url);
export function setLeave(next: (url: string) => void): void {
  leave = next;
}

/** The order may be paid now: Adminium takes payments online, every proof is approved, no delivery price is open, and something is owed. */
export function mayPay(order: Row, offer: PayOffer | null): boolean {
  return offer?.online === true && Number(order["pay_open"] ?? 0) === 1 && Number(order["due"] ?? 0) > 0 && ["placed", "ready", "dispatched"].includes(String(order["status"]));
}

/** Nothing is owed any more, and something was paid. */
export const isPaid = (order: Row): boolean => order["due"] !== null && order["due"] !== undefined && Number(order["due"]) <= 0 && Number(order["paid_in"] ?? 0) > 0;

export interface PayDoor {
  payOffer?(): Promise<PayOffer>;
  payState?(via: Via, orderId: Id): Promise<PayStanding>;
  startPay?(via: Via, orderId: Id): Promise<{ payUrl: string }>;
  heldSession?(via: Via): { token: string; expiresAt: number } | null;
}

/** Ask Adminium whether this customer may pay online now. Never throws: no answer reads as "not online". */
export async function loadOffer(door: PayDoor | null): Promise<void> {
  if (door?.payOffer === undefined) {
    usePay.setState({ offer: null });
    return;
  }
  const offer = await door.payOffer().catch(() => null);
  usePay.setState({ offer });
}

/** "Pay now": the order's pay link, then this tab goes to the pay page, keeping which order it was. The demo's stand-in pays here. */
export async function payNow(door: PayDoor | null, via: Via, order: Row): Promise<"away" | "paid" | "failed"> {
  if (door?.startPay === undefined) {
    usePay.setState({ phase: "failed" });
    return "failed";
  }
  usePay.setState({ phase: "taking", paidOnReturn: null, returned: null });
  try {
    const { payUrl } = await door.startPay(via, order["id"] as Id);
    if (usePay.getState().offer?.standIn === true) {
      // The demo: the hand-off is shown a moment, and the stand-in has taken the payment already.
      await new Promise((resolve) => setTimeout(resolve, 600));
      return "paid";
    }
    const session = door.heldSession?.(via) ?? null;
    if (session !== null) keep({ via, orderId: String(order["id"]), session, at: deviceNow() });
    leave(payUrl);
    return "away";
  } catch {
    usePay.setState({ phase: "failed" });
    // Paying online may have closed meanwhile: the page then offers only the works' own ways.
    await loadOffer(door);
    return "failed";
  }
}

/** Back from the pay page: checking, until the order has been read again. */
export function checking(): void {
  usePay.setState({ phase: "checking" });
}

/**
 * The order as it stands after the way back: read (`reread`), then, with
 * Adminium's word on the payment (`ask`), a checkout still open is asked
 * about again, `wait` apart, a few times; then the order is read again and
 * the page says what was found. With no word to ask (an older door), the order alone is
 * read, twice, and shows paid or as it stood.
 */
export async function settle(reread: () => Promise<Row | null>, ask: (() => Promise<PayStanding>) | null = null, wait = 3_000, tries = 5): Promise<void> {
  const pause = () => new Promise((resolve) => setTimeout(resolve, wait));
  // The order first, so the page stands behind "Checking your payment…".
  let order = await reread();
  let standing: PayStanding | null = null;
  if (ask !== null) {
    for (let i = 0; i < tries; i += 1) {
      standing = await ask().catch(() => null);
      if (standing !== "open" || wait <= 0) break;
      await pause();
    }
    // What the payment did to the order: read it again.
    order = await reread();
  } else if (order !== null && !isPaid(order) && wait > 0) {
    await pause();
    order = await reread();
  }
  const paid = order !== null && (isPaid(order) || standing === "paid");
  const returned = !paid && order !== null && (standing === "confirming" || standing === "failed" || standing === "expired") ? { orderId: order["id"] as Id, standing } : null;
  usePay.setState({ phase: "idle", paidOnReturn: paid ? (order!["id"] as Id) : null, returned });
}

/** Forget the flow (sign-out, a test). */
export function resetPay(): void {
  usePay.setState({ offer: null, phase: "idle", paidOnReturn: null, returned: null });
}
