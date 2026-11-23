/**
 * THE DISPATCH PAGE (comp `J - Marlow Press Add-ons` 1023-1149): a ready
 * delivery order going out with the delivery company that is on. The parcel,
 * its rates, booking the collection, the label and the tracking are the
 * company's own screens (its `order.dispatch.actions` fill), handed the order
 * as the works keeps it and the service the counter booked it with before
 * (`orders.dhl_service`, the works' own: no customer writes it), so they open
 * with it picked. Under them the works
 * hands the order over: dispatched, with the tracking number the booking
 * gave, which sends the customer their "on its way" e-mail. Beside them, the
 * other orders ready to go.
 */
import { useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, Truck } from "lucide-react";

import { dispatchOrder } from "../actions.ts";
import { useData, useEnv, useRun } from "../env.tsx";
import { byId, dispatchQueue, familyOf, jobsOf, productOf, readyToGo } from "../facts.ts";
import { dispatchPayload } from "../outbound.ts";
import { carrierClient, COUNTRIES, countryName, handOverOf, useOrderBookings, type HandOver } from "../shipping.ts";
import { ShipmentCard } from "./ShipmentCard.tsx";
import { mayManageAddOns } from "../roles.ts";
import { go, useWorks } from "../store.ts";
import { FamilyTile, Mono, Typed } from "../ui.tsx";
import { same, text, type Row } from "../wire.ts";
import { drewSomething } from "../../add-ons/slotContent.ts";
import type { PayloadFor } from "../../add-ons/payloads.ts";
import { useI18n, useT } from "../../i18n/index.tsx";

/** What an order's jobs are, for a heading: their products, in order. */
export function productsOf(data: ReturnType<typeof useData>, order: Row): string {
  return jobsOf(data, order)
    .filter((j) => j["stage"] !== "cancelled")
    .map((j) => text(j["product_name"]) ?? "")
    .join(", ");
}

/** The delivery company's dispatch flow for an order, or nothing when its fill is not loaded or drew nothing. */
function DispatchFill({ order }: { order: Row }) {
  const data = useData();
  const { door } = useEnv();
  const registry = useWorks((s) => s.registry);
  const facts = door.facts();
  const box = useRef<HTMLDivElement>(null);
  const [drew, setDrew] = useState(true);
  useLayoutEffect(() => {
    if (box.current !== null) setDrew(drewSomething(box.current));
  });
  if (registry === null || facts.carrier === null) return null;
  const fills = registry.fillsFor("order.dispatch.actions", new Set([facts.carrier.key]));
  if (fills.length === 0) return null;
  const payload = dispatchPayload(data, order, { currency: facts.currency, zone: facts.zone, now: door.now(), carrier: facts.carrier.key });
  return (
    <div ref={box} className="wk-fill" data-add-on-slot="order.dispatch.actions" data-drew={drew ? undefined : "none"}>
      {fills.map((entry, i) => (
        <div key={i}>{entry.fill.render({ ...payload, settings: facts.addOnSettings[entry.addOn] ?? {} } as PayloadFor<"order.dispatch.actions">)}</div>
      ))}
    </div>
  );
}

export function DispatchScreen() {
  const t = useT();
  const data = useData();
  const orderId = useWorks((s) => s.orderId);
  const order = byId(data.orders, orderId);
  if (order === undefined || (!readyToGo(data, order) && order["status"] !== "dispatched")) {
    return (
      <section className="wk-screen wk-narrow">
        <div className="wk-empty">
          <div className="wk-empty-title">{t("works.dispatch.none")}</div>
          <button type="button" className="wk-btn" onClick={() => go("today")}>
            {t("works.back.board")}
          </button>
        </div>
      </section>
    );
  }
  return <Dispatch order={order} />;
}

/** An order made before orders kept a country: a person says where it goes, and nothing guesses. */
function AskCountry({ order }: { order: Row }) {
  const t = useT();
  const { locale } = useI18n();
  const data = useData();
  const { door } = useEnv();
  const { busy, run } = useRun();
  const [country, setCountry] = useState(text(data.settings?.["home_country"]) ?? "");
  if (text(order["country"]) !== null || !door.who().can("orders", "update")) return null;
  const save = () =>
    run(async (d) => {
      await d.updateOrder(order, { country });
      return t("works.country.saved");
    });
  return (
    <div className="wk-panel">
      <label className="wk-field wk-dispatch-country">
        <span className="wk-field-label">{t("works.country.ask")}</span>
        <select className="wk-input" value={country} onChange={(e) => setCountry(e.target.value)}>
          <option value="">—</option>
          {COUNTRIES.map((code) => (
            <option key={code} value={code}>
              {countryName(code, locale)}
            </option>
          ))}
        </select>
      </label>
      <button type="button" className="wk-btn" disabled={busy || country === ""} onClick={() => void save()}>
        {t("works.country.save")}
      </button>
    </div>
  );
}

/** The shape Adminium holds a phone column to. */
const PHONE = /^\+?\(?[0-9][0-9\s().-]{4,}$/;

/**
 * A parcel going abroad needs the customer's phone for the carrier. It is asked
 * at checkout; here staff add one an order lacks or correct one the carrier
 * would refuse, for those whose role changes the order and reads its details.
 */
function AskPhone({ order }: { order: Row }) {
  const t = useT();
  const data = useData();
  const { door } = useEnv();
  const { busy, run } = useRun();
  const held = text(order["phone"]) ?? "";
  const [phone, setPhone] = useState(held);
  const who = door.who();
  const home = text(data.settings?.["home_country"]);
  const country = text(order["country"]);
  const mayFix = who.can("orders", "update") && (who.roles.length === 0 || who.roles.includes("owner") || who.roles.includes("counter"));
  if (country === null || home === null || country === home || !mayFix) return null;
  const typed = phone.trim();
  const bad = typed !== "" && (!PHONE.test(typed) || typed.length > 32);
  const save = () =>
    run(async (d) => {
      await d.updateOrder(order, { phone: typed });
      return t("works.phone.saved");
    });
  return (
    <div className="wk-panel">
      <label className="wk-field wk-dispatch-country">
        <span className="wk-field-label">{t("works.phone.label")}</span>
        <input className="wk-input wk-mono" type="tel" autoComplete="off" value={phone} aria-invalid={bad} aria-describedby="wk-phone-why" onChange={(e) => setPhone(e.target.value)} />
        <span className="wk-field-hint" id="wk-phone-why" role={bad ? "alert" : undefined}>
          {t(bad ? "works.phone.bad" : "works.phone.why")}
        </span>
      </label>
      <button type="button" className="wk-btn" disabled={busy || typed === "" || bad || typed === held} onClick={() => void save()}>
        {t("works.phone.save")}
      </button>
    </div>
  );
}

/** Why the order cannot be handed over yet, in the words of what is holding it. */
const HELD: Partial<Record<HandOver["kind"], "works.handOver.testLabel" | "works.handOver.unsettled" | "works.handOver.unread">> = {
  test: "works.handOver.testLabel",
  unsettled: "works.handOver.unsettled",
  unread: "works.handOver.unread",
};

function Dispatch({ order }: { order: Row }) {
  const t = useT();
  const data = useData();
  const { door } = useEnv();
  const { busy, run } = useRun();
  const facts = door.facts();
  const carrier = facts.carrier;
  const first = jobsOf(data, order)[0];
  const ref = text(order["number"]) ?? "";
  const booked = data.shipments.find((s) => text(s["order_reference"]) === ref && s["status"] !== "refused" && s["status"] !== "cancelled");
  const client = carrierClient(carrier);
  const read = useOrderBookings(client, order.id);
  const state: HandOver = read.state === "failed" || read.state === "loading" ? { kind: "unread" } : handOverOf(read.bookings, order);
  const fromLabel = state.kind === "label";
  const held = HELD[state.kind];
  const [typed, setTyped] = useState(text(order["tracking"]) ?? text(booked?.["tracking"]) ?? "");
  const tracking = state.kind === "label" ? (state.tracking ?? "") : typed;
  const queue = dispatchQueue(data).filter((o) => !same(o.id, order.id));
  const dispatched = order["status"] === "dispatched";

  const handOver = () =>
    run(async (d, fresh) => {
      const now = byId(fresh.orders, order.id) ?? order;
      await dispatchOrder(d, fresh, now, {
        tracking: tracking.trim() === "" ? null : tracking.trim(),
        // The stored service is the demo's own code: a real label's service stays on its booking.
        service: state.kind === "label" ? null : text(booked?.["service"]),
        carrier: state.kind === "label" ? state.carrier : null,
      });
      return t("works.ticket.dispatchedToast", { ref });
    });

  return (
    <section className="wk-screen wk-dispatch" aria-labelledby="wk-dispatch-ref">
      <button type="button" className="wk-back" onClick={() => go("today")}>
        <ArrowLeft size={15} className="wk-flip" aria-hidden="true" />
        {t("works.back.board")}
      </button>
      <div className="wk-ticket-head wk-dispatch-head">
        <FamilyTile family={first === undefined ? "other" : familyOf(data, first)} icon={first === undefined ? null : text(productOf(data, first)?.["icon"])} size="lg" />
        <div>
          <div className="wk-ticket-refline">
            <Mono className="wk-ticket-ref">
              <span id="wk-dispatch-ref">{ref}</span>
            </Mono>
            <span className={`wk-stage wk-stage--${dispatched ? "dispatched" : "ready"}`}>{t(dispatched ? "works.stage.dispatched" : "works.stage.ready")}</span>
          </div>
          <div className="wk-ticket-title">
            {productsOf(data, order)} · <Typed>{text(order["name"]) ?? ""}</Typed>
          </div>
        </div>
      </div>
      <p className="wk-dispatch-lede">
        {carrier === null ? t("works.dispatch.noCarrier") : t("works.dispatch.only", { carrier: carrier.name })}{" "}
        {mayManageAddOns(door.who()) && (
          <button type="button" className="wk-inline-link" onClick={() => go("addons")}>
            {t("works.dispatch.another")}
          </button>
        )}
      </p>
      <div className="wk-dispatch-grid">
        <div className="wk-dispatch-main">
          {!dispatched && <AskCountry order={order} />}
          {!dispatched && <AskPhone order={order} />}
          {!dispatched && <DispatchFill order={order} />}
          <ShipmentCard order={order} client={client} read={read} />
          <div className="wk-panel">
            <h2 className="wk-panel-head wk-panel-head--plain">{t("works.dispatch.handOver")}</h2>
            {dispatched ? (
              <div className="wk-done">{text(order["tracking"]) === null ? t("works.actions.dispatchedDone") : t("works.actions.dispatchedTracking", { tracking: text(order["tracking"]) ?? "" })}</div>
            ) : (
              <>
                <p className="wk-sheet-lede">{t("works.handOver.tells")}</p>
                <label className="wk-field wk-dispatch-field">
                  <span className="wk-field-label">{t("works.dispatch.tracking")}</span>
                  <input className="wk-input wk-mono" value={tracking} readOnly={fromLabel} aria-describedby={fromLabel ? "wk-from-label" : undefined} onChange={(e) => setTyped(e.target.value)} />
                  {fromLabel && (
                    <span className="wk-field-hint" id="wk-from-label">
                      {t("works.handOver.fromLabel")}
                    </span>
                  )}
                </label>
                {held !== undefined && (read.state !== "loading" || state.kind !== "unread") && (
                  <p className="wk-muted" role="status">
                    {t(held)}
                  </p>
                )}
                <button type="button" className="wk-action wk-action--pos" disabled={busy || held !== undefined || !door.who().can("orders", "update")} onClick={() => void handOver()}>
                  <Truck size={16} aria-hidden="true" />
                  {t("works.actions.handedOver")}
                </button>
              </>
            )}
          </div>
        </div>
        <aside className="wk-panel wk-dispatch-queue" aria-labelledby="wk-queue-title">
          <h2 className="wk-panel-head wk-panel-head--small" id="wk-queue-title">
            {t("works.dispatch.queue")}
          </h2>
          {queue.length === 0 ? (
            <div className="wk-muted">{t("works.dispatch.queueEmpty")}</div>
          ) : (
            queue.map((o) => (
              <button key={String(o.id)} type="button" className="wk-queue-item" onClick={() => go("dispatch", { orderId: o.id })}>
                <Mono className="wk-queue-ref">{text(o["number"]) ?? ""}</Mono>
                <span className="wk-queue-product">{productsOf(data, o)}</span>
                <span className="wk-queue-customer">
                  <Typed>{text(o["name"]) ?? ""}</Typed>
                </span>
              </button>
            ))
          )}
          {carrier !== null && <div className="wk-affiliation">{t("works.dispatch.notAffiliated", { works: text(data.settings?.["works_name"]) ?? "", carrier: carrier.name })}</div>}
        </aside>
      </div>
    </section>
  );
}
