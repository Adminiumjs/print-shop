/**
 * THE DISPATCH PAGE (comp `J - Marlow Press Add-ons` 1023-1149): a ready
 * delivery order going out with the delivery company that is on. The parcel,
 * its rates, booking the collection, the label and the tracking are the
 * company's own screens (its `order.dispatch.actions` fill), handed the order
 * as the works keeps it and the service the customer chose at checkout
 * (`orders.dhl_service`), so they open with it picked. Under them the works
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
import { mayManageAddOns } from "../roles.ts";
import { go, useWorks } from "../store.ts";
import { FamilyTile, Mono, Typed } from "../ui.tsx";
import { same, text, type Row } from "../wire.ts";
import { drewSomething } from "../../add-ons/slotContent.ts";
import type { PayloadFor } from "../../add-ons/payloads.ts";
import { useT } from "../../i18n/index.tsx";

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
  const [tracking, setTracking] = useState(text(order["tracking"]) ?? text(booked?.["tracking"]) ?? "");
  const queue = dispatchQueue(data).filter((o) => !same(o.id, order.id));
  const dispatched = order["status"] === "dispatched";

  const handOver = () =>
    run(async (d, fresh) => {
      const now = byId(fresh.orders, order.id) ?? order;
      await dispatchOrder(d, fresh, now, { tracking: tracking.trim() === "" ? null : tracking.trim(), service: text(booked?.["service"]) });
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
          {!dispatched && <DispatchFill order={order} />}
          <div className="wk-panel">
            <h2 className="wk-panel-head wk-panel-head--plain">{t("works.dispatch.handOver")}</h2>
            {dispatched ? (
              <div className="wk-done">{text(order["tracking"]) === null ? t("works.actions.dispatchedDone") : t("works.actions.dispatchedTracking", { tracking: text(order["tracking"]) ?? "" })}</div>
            ) : (
              <>
                <p className="wk-sheet-lede">{t("works.dispatch.handOverLede")}</p>
                <label className="wk-field wk-dispatch-field">
                  <span className="wk-field-label">{t("works.dispatch.tracking")}</span>
                  <input className="wk-input wk-mono" value={tracking} onChange={(e) => setTracking(e.target.value)} />
                </label>
                <button type="button" className="wk-action wk-action--pos" disabled={busy || !door.who().can("orders", "update")} onClick={() => void handOver()}>
                  <Truck size={16} aria-hidden="true" />
                  {t("works.actions.dispatched")}
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
