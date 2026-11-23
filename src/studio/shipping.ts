/**
 * What the works' screens know of a parcel, read from Adminium's booking
 * record and never remembered here. Buying a label moves nothing: the order
 * moves, and the customer hears, only when staff press "Handed over".
 */
import { useCallback, useEffect, useRef, useState } from "react";

import { engineClientOf, shippingSetup } from "../add-ons/connected.ts";
import type { EngineBooking, EngineCarrier } from "../add-ons/vendor/host/engine-carrier.ts";
import { text, type Row } from "./wire.ts";

/** Whether this order may be handed over, and with what. */
export type HandOver =
  | { kind: "none" }
  | { kind: "label"; tracking: string | null; carrier: string | null }
  | { kind: "test" }
  | { kind: "unsettled" }
  | { kind: "unread" };

const OPEN = new Set(["reserved", "calling", "unknown"]);

/**
 * A real purchase with no final answer stops the hand-over first, because a
 * parcel may already be paid for. A test label is never one a customer hears of.
 */
export function handOverOf(bookings: readonly EngineBooking[], order: Row): HandOver {
  const outbound = bookings.filter((b) => b.purpose === "outbound");
  if (outbound.some((b) => !b.test && OPEN.has(b.state))) return { kind: "unsettled" };
  const live = outbound.filter((b) => !b.test && b.state === "booked").sort((a, b) => a.parcelNumber - b.parcelNumber)[0];
  if (live !== undefined) {
    return { kind: "label", tracking: live.tracking ?? text(order["label_tracking"]), carrier: live.carrierName ?? text(order["label_carrier"]) };
  }
  if (outbound.some((b) => b.test && (b.state === "booked" || OPEN.has(b.state)))) return { kind: "test" };
  return { kind: "none" };
}

export type BookingsRead = { state: "none" | "loading" | "ready" | "failed"; bookings: EngineBooking[]; reread: () => void };

/** This order's bookings. Someone with no right on the labels has none to read, which is not a failure. */
export function useOrderBookings(client: EngineCarrier | null, orderId: unknown): BookingsRead {
  const id = String(orderId);
  const [read, setRead] = useState<Omit<BookingsRead, "reread">>({ state: client === null ? "none" : "loading", bookings: [] });
  const latest = useRef(0);
  const reread = useCallback(() => {
    if (client === null) {
      setRead({ state: "none", bookings: [] });
      return;
    }
    const mine = ++latest.current;
    client.bookings({ table: "orders", id }).then(
      (answer) => {
        if (mine === latest.current) setRead({ state: "ready", bookings: answer.bookings });
      },
      (error: unknown) => {
        if (mine !== latest.current) return;
        const status = (error as { status?: number | null }).status;
        setRead({ state: status === 403 ? "none" : "failed", bookings: [] });
      },
    );
  }, [client, id]);
  useEffect(() => reread(), [reread]);
  return { ...read, reread };
}

/** The client of the carrier this works uses, when its bundle is built for real carriers. */
export const carrierClient = (carrier: { key: string } | null): EngineCarrier | null => (carrier === null ? null : engineClientOf(carrier.key));

// ── Ship from and the carrier in use ────────────────────────────────────────

export interface ShipFromValues {
  name?: string;
  lines?: string[];
  city?: string;
  postcode?: string;
  country?: string;
  phone?: string;
  email?: string;
}

export interface ShippingStatus {
  carriers: { key: string; name: string; on: boolean; locked: boolean; connected: boolean }[];
  activeCarrier: string | null;
  shipFrom: ShipFromValues | null;
  shipFromMissing: string[];
}

export class ShippingRefused extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string) {
    super(code);
    this.name = "ShippingRefused";
    this.status = status;
    this.code = code;
  }
}

async function ask(method: "GET" | "PUT", path: string, body?: unknown): Promise<ShippingStatus> {
  const send = shippingSetup();
  if (send === null) throw new ShippingRefused(0, "NOT_LOADED");
  const reply = await send(method, path, body);
  const raw = await reply.text();
  type Answer = { data?: ShippingStatus; error?: { code?: string } };
  const parsed = ((): Answer | null => {
    try {
      return JSON.parse(raw) as Answer;
    } catch {
      return null;
    }
  })();
  if (reply.status >= 400 || parsed?.data === undefined) throw new ShippingRefused(reply.status, parsed?.error?.code ?? "BAD_ANSWER");
  return parsed.data;
}

export const readShipping = () => ask("GET", "");
export const saveShipFrom = (values: ShipFromValues) => ask("PUT", "/ship-from", values);
export const chooseCarrier = (carrier: string) => ask("PUT", "/active-carrier", { carrier });

/** The countries the form offers, as ISO codes; a saved one outside the list is added to it. */
export const COUNTRIES = ["GB", "IE", "US", "CA", "AU", "NZ", "DE", "FR", "ES", "IT", "NL", "BE", "AT", "CH", "DK", "SE", "NO", "FI", "PL", "CZ", "PT", "EG", "AE", "SA", "CN", "TW", "HK", "JP", "SG", "IN"];

/** A country's name in the reader's language; the code itself where the browser has none. */
export function countryName(code: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}
