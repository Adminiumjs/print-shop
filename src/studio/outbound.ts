/**
 * An order as a delivery company's dispatch flow reads it
 * (`order.dispatch.actions`, `DispatchPayload`): the works' own address it
 * goes from, the customer's it goes to, each job as a line with what it
 * weighs (Adminium's `weight_kg`, in grams), the day it was promised, what
 * it is worth, the works' clock, and the service the customer chose at
 * checkout, so the flow opens with it picked.
 */
import type { DispatchPayload, OutboundOrder, PostalAddress, ShopClock } from "../add-ons/payloads.ts";
import type { WorksData } from "./door.ts";
import { jobsOf } from "./facts.ts";
import { dayIn } from "./time.ts";
import { dayOf, num, text, type Row } from "./wire.ts";

/** A postcode at the end of an address line: what a carrier checks the country against. */
const POSTCODE = /\s([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})$/i;

/**
 * The works' own address, as its settings keep it (one line: "3 Market
 * Square, Marlow SL7 1AA"): the street before the last comma, the town and
 * postcode after it. The country is the works' (its money's).
 */
export function worksAddress(settings: Row | null, country: string): PostalAddress {
  const name = text(settings?.["works_name"]) ?? "";
  const whole = (text(settings?.["address"]) ?? "").trim();
  const cut = whole.lastIndexOf(",");
  const street = cut < 0 ? whole : whole.slice(0, cut).trim();
  const tail = cut < 0 ? "" : whole.slice(cut + 1).trim();
  const post = POSTCODE.exec(` ${tail}`);
  const postcode = post === null ? "" : post[1]!.toUpperCase();
  const city = post === null ? tail : ` ${tail}`.slice(0, post.index).trim();
  return { name, lines: street === "" ? [] : street.split(",").map((l) => l.trim()), city, postcode, country };
}

/** The country a works' money says it is in, for a carrier; Great Britain for pounds. */
export function countryOf(currency: string): string {
  const known: Record<string, string> = { GBP: "GB", EUR: "IE", DKK: "DK", CZK: "CZ", USD: "US", CNY: "CN", TWD: "TW", EGP: "EG" };
  return known[currency] ?? "GB";
}

export function outboundOrder(data: WorksData, order: Row, currency: string): OutboundOrder {
  const country = countryOf(currency);
  const line1 = text(order["address_line1"]);
  const total = num(order["total"]);
  return {
    ref: text(order["number"]) ?? String(order.id),
    recipient: { name: text(order["name"]) ?? "", key: String(order["customer_id"] ?? order.id) },
    items: jobsOf(data, order)
      .filter((j) => j["stage"] !== "cancelled")
      .map((job) => {
        const kg = num(job["weight_kg"]);
        return {
          id: String(job.id),
          key: String(job["product_id"] ?? job.id),
          label: `${String(job["qty"] ?? "")} × ${text(job["product_name"]) ?? ""}`,
          quantity: 1,
          ...(kg === null ? {} : { unitWeightGrams: Math.round(kg * 1000) }),
        };
      }),
    origin: worksAddress(data.settings, country),
    ...(line1 === null
      ? {}
      : {
          destination: {
            name: text(order["name"]) ?? "",
            lines: [line1, text(order["address_line2"])].filter((l): l is string => l !== null),
            city: text(order["town"]) ?? "",
            postcode: text(order["postcode"]) ?? "",
            country,
          },
        }),
    ...(dayOf(order["ready_by"]) === null ? {} : { promisedFor: dayOf(order["ready_by"])! }),
    ...(total === null ? {} : { value: { amount: Math.round(total * 100), currency } }),
  };
}

/** The works' clock, as a carrier asks for it. */
export function shopClock(now: number, zone: string): ShopClock {
  const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: zone }).formatToParts(new Date(now));
  const part = (type: string) => Number(time.find((p) => p.type === type)?.value ?? "0");
  return { iso: dayIn(now, zone), hour: part("hour") % 24, minute: part("minute") };
}

/** Everything the dispatch flow is handed, the stored service included. */
export function dispatchPayload(data: WorksData, order: Row, input: { currency: string; zone: string; now: number; carrier: string | null }): Omit<DispatchPayload, "settings"> {
  const service = text(order["dhl_service"]);
  return {
    order: outboundOrder(data, order, input.currency),
    now: shopClock(input.now, input.zone),
    chosen: service === null || input.carrier === null ? null : { addOn: input.carrier, code: service },
  };
}
