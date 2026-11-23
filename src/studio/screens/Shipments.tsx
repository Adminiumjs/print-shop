/**
 * SHIPMENTS (comp `J - Marlow Press Add-ons` 1388-1434): everything the works
 * sent with the delivery company, as the company's own `shipments` rows keep
 * it — the order it was for, the service, the tracking reference, when it
 * was booked, the collection window, its status and its label. A collection
 * the carrier refused offers the dispatch page again. Shown only while a
 * delivery company is on.
 */
import { useEffect, useState, type ComponentType } from "react";
import { Download, MapPin, RefreshCw } from "lucide-react";

import { useData, useEnv } from "../env.tsx";
import { fileSrc } from "../facts.ts";
import { useFmt } from "../format.ts";
import { mayManageAddOns } from "../roles.ts";
import { carrierClient } from "../shipping.ts";
import { go, toast } from "../store.ts";
import { openParcelsRefreshOf } from "../../add-ons/connected.ts";
import type { EngineCarrier } from "../../add-ons/vendor/host/engine-carrier.ts";
import { Mono, Typed } from "../ui.tsx";
import { text } from "../wire.ts";
import { useT, type MessageKey } from "../../i18n/index.tsx";

const STATUS: Record<string, MessageKey> = {
  booked: "works.shipments.booked",
  collected: "works.shipments.collected",
  "in-transit": "works.shipments.inTransit",
  delivered: "works.shipments.delivered",
  cancelled: "works.shipments.cancelled",
  refused: "works.shipments.refused",
};

/** The carrier's own "Refresh open parcels" where its bundle shares it, or the same press with the works' words. */
function RefreshOpen({ carrierKey, client, hasOpen, nowMs, onDone }: { carrierKey: string; client: EngineCarrier; hasOpen: boolean; nowMs: number; onDone: () => void }) {
  const t = useT();
  const [working, setWorking] = useState(false);
  const Shared = openParcelsRefreshOf(carrierKey) as ComponentType<{ nowMs?: number; hasOpenParcels?: boolean; onRefreshed?: () => void }> | null;
  if (Shared !== null) return <Shared nowMs={nowMs} hasOpenParcels={hasOpen} onRefreshed={onDone} />;
  const press = () => {
    setWorking(true);
    client
      .refreshOpenParcels()
      .then(onDone, () => toast(t("works.refused", { why: t("works.shipments.refreshOpen") }), "danger"))
      .finally(() => setWorking(false));
  };
  return (
    <button type="button" className="wk-btn wk-btn--small" disabled={working || !hasOpen} onClick={press}>
      <RefreshCw size={14} aria-hidden="true" />
      {t("works.shipments.refreshOpen")}
    </button>
  );
}

export function ShipmentsScreen() {
  const t = useT();
  const fmt = useFmt();
  const data = useData();
  const { door } = useEnv();
  const carrier = door.facts().carrier;
  const client = carrierClient(carrier);
  const [testMode, setTestMode] = useState(false);
  const [attention, setAttention] = useState<{ reference: string; id: string }[]>([]);
  const [round, setRound] = useState(0);
  useEffect(() => {
    if (client === null) return;
    let live = true;
    client.access().then((a) => { if (live) setTestMode(a.mode === "test"); }, () => undefined);
    client.attention().then(
      (a) => { if (live) setAttention(a.items.filter((i) => !i.orderGone).map((i) => ({ reference: i.reference, id: i.source.id }))); },
      () => { if (live) setAttention([]); },
    );
    return () => { live = false; };
  }, [client, round]);

  return (
    <section className="wk-screen wk-shipments" aria-labelledby="wk-shipments-title">
      <h1 className="wk-h1" id="wk-shipments-title">
        {t("works.shipments.title")}
      </h1>
      <p className="wk-lede">
        {t("works.shipments.lede", { carrier: carrier?.name ?? "" })}{" "}
        {mayManageAddOns(door.who()) && (
          <button type="button" className="wk-inline-link" onClick={() => go("addons")}>
            {t("works.dispatch.another")}
          </button>
        )}
      </p>
      <div className="wk-action-row">
        {door.who().can("settings", "update") && (
          <button type="button" className="wk-btn wk-btn--small" onClick={() => go("shipfrom")}>
            <MapPin size={14} aria-hidden="true" />
            {t("works.shipFrom.title")}
          </button>
        )}
        {client !== null && carrier !== null && <RefreshOpen carrierKey={carrier.key} client={client} hasOpen={data.shipments.length > 0} nowMs={door.now()} onDone={() => setRound((n) => n + 1)} />}
      </div>
      {testMode && <p className="wk-muted" role="status">{t("works.shipments.sample")}</p>}
      {attention.length > 0 && (
        <div className="wk-panel">
          <h2 className="wk-panel-head wk-panel-head--small">{t("works.card.problem")}</h2>
          {attention.map((item) => (
            <button key={`${item.id}-${item.reference}`} type="button" className="wk-queue-item" onClick={() => go("dispatch", { orderId: item.id })}>
              <Mono className="wk-queue-ref">{item.reference}</Mono>
            </button>
          ))}
        </div>
      )}
      {data.shipments.length === 0 ? (
        <div className="wk-empty">
          <div className="wk-empty-title">{t("works.shipments.empty")}</div>
          <div className="wk-empty-body">{t("works.shipments.emptyBody")}</div>
        </div>
      ) : (
        <ul className="wk-ship-list" role="list">
          {data.shipments.map((s) => {
            const ref = text(s["order_reference"]) ?? "";
            const order = data.orders.find((o) => text(o["number"]) === ref);
            const status = String(s["status"] ?? "booked");
            const bad = status === "refused";
            const label = fileSrc(s["label_file"]);
            return (
              <li key={String(s.id)} className={`wk-ship${bad ? " wk-ship--bad" : ""}`}>
                <span className="wk-ship-mono" aria-hidden="true">
                  {(carrier?.name ?? "").slice(0, 3).toLocaleUpperCase()}
                </span>
                <div className="wk-ship-what">
                  <div className="wk-ship-line">
                    <Mono className="wk-ship-ref">{ref}</Mono>
                    <span className="wk-cell-strong">
                      <Typed>{text(order?.["name"]) ?? ""}</Typed>
                    </span>
                    <span className={`wk-ship-status wk-ship-status--${status}`}>{t(status === "booked" ? (order?.["status"] === "dispatched" ? "works.actions.handedOver" : "works.card.labelReady") : (STATUS[status] ?? "works.shipments.booked"))}</span>
                  </div>
                  <div className="wk-ship-service">{bad && order !== undefined ? t("works.shipments.goingTo", { town: text(order["town"]) ?? "", postcode: text(order["postcode"]) ?? "" }) : (text(s["service"]) ?? "")}</div>
                </div>
                <dl className="wk-ship-facts">
                  {!bad && (
                    <div>
                      <dt>{t("works.shipments.tracking")}</dt>
                      <dd className="wk-mono">{text(s["tracking"]) ?? "—"}</dd>
                    </div>
                  )}
                  <div>
                    <dt>{t(bad ? "works.shipments.attempted" : "works.shipments.bookedOn")}</dt>
                    <dd className="wk-mono">{fmt.moment(s["created_at"])}</dd>
                  </div>
                  {!bad && (
                    <div>
                      <dt>{t("works.shipments.collection")}</dt>
                      <dd className="wk-mono">{s["collection_from"] === null || s["collection_from"] === undefined ? "—" : t("works.shipments.window", { day: fmt.moment(s["collection_from"]), from: fmt.time(s["collection_from"]), to: fmt.time(s["collection_to"]) })}</dd>
                    </div>
                  )}
                </dl>
                <div className="wk-ship-end">
                  {!bad && label !== null && (
                    <a className="wk-made-get" href={label} download aria-label={t("works.shipments.labelAria", { ref })}>
                      <Download size={14} aria-hidden="true" />
                      {t("works.shipments.label")}
                    </a>
                  )}
                  {bad && order !== undefined && (
                    <button type="button" className="wk-btn wk-btn--small wk-btn--retry" onClick={() => go("dispatch", { orderId: order.id })}>
                      <RefreshCw size={14} aria-hidden="true" />
                      {t("works.shipments.retry")}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
