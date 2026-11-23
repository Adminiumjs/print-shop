/**
 * THE SHIPMENT CARD: what became of an order's labels, on every status.
 * Read-only about the order: tracking never moves it. The one write here is
 * "New number: tell the customer", which a person presses.
 */
import { useState } from "react";
import { Download, Megaphone, RefreshCw } from "lucide-react";

import { tellNewNumber } from "../actions.ts";
import { useEnv, useRun } from "../env.tsx";
import { useFmt } from "../format.ts";
import { toast } from "../store.ts";
import { Mono } from "../ui.tsx";
import { text, type Row } from "../wire.ts";
import type { BookingsRead } from "../shipping.ts";
import type { EngineBooking, EngineCarrier } from "../../add-ons/vendor/host/engine-carrier.ts";
import { useT, type MessageKey } from "../../i18n/index.tsx";

const TRACK_WORD: Record<string, MessageKey> = {
  TRANSIT: "works.shipments.inTransit",
  DELIVERED: "works.shipments.delivered",
  FAILURE: "works.card.problem",
  RETURNED: "works.card.problem",
};

/** The word for where a label stands: never "bought" while nobody knows. */
export function stateWord(b: EngineBooking, handedOver: boolean): MessageKey {
  if (b.state !== "booked") return "works.card.unknown";
  const moved = b.track?.status === null || b.track?.status === undefined ? undefined : TRACK_WORD[b.track.status];
  if (moved !== undefined) return moved;
  return handedOver ? "works.actions.handedOver" : "works.card.labelReady";
}

function saveFile(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function Parcel({ booking, order, client, reread }: { booking: EngineBooking; order: Row; client: EngineCarrier; reread: () => void }) {
  const t = useT();
  const fmt = useFmt();
  const { door } = useEnv();
  const { busy, run } = useRun();
  const [working, setWorking] = useState(false);
  const ref = text(order["number"]) ?? "";
  const handedOver = order["status"] === "dispatched";
  const bought = booking.state === "booked";
  const checkedAt = booking.track?.checkedAt ?? null;
  const told = text(order["tracking"]);
  const newNumber = bought && !booking.test && handedOver && booking.track?.newNumber === true && booking.tracking !== null && booking.tracking !== told;

  const guarded = async (work: () => Promise<void>) => {
    setWorking(true);
    try {
      await work();
    } catch {
      toast(t("works.card.labelFailed"), "danger");
    } finally {
      setWorking(false);
      reread();
    }
  };
  const download = () => guarded(async () => saveFile(await client.downloadDocument(booking.id, "label"), `${ref}-label.pdf`));
  const fetchAgain = () => guarded(async () => void (await client.fetchDocument(booking.id, "label")));
  const refresh = () => guarded(async () => void (await client.refreshBooking(booking.id)));
  const tell = () =>
    run(async (d) => {
      await tellNewNumber(d, order, booking.tracking!, door.now());
      reread();
      return t("works.card.told");
    });

  return (
    <div className="wk-ship-card" data-testid={`shipment-${booking.id}`}>
      <div className="wk-ship-line">
        <span className={`wk-ship-status wk-ship-status--${bought ? "booked" : "refused"}`}>{t(stateWord(booking, handedOver))}</span>
        {booking.test && <span className="wk-ship-sample">{t("works.card.sample")}</span>}
      </div>
      {bought && !handedOver && !booking.test && <p className="wk-muted">{t("works.card.notHanded")}</p>}
      <dl className="wk-ship-facts">
        <div>
          <dt>{t("works.card.carrier")}</dt>
          <dd>{booking.carrierName ?? booking.carrier}</dd>
        </div>
        <div>
          <dt>{t("works.card.service")}</dt>
          <dd>{booking.service}</dd>
        </div>
        {bought ? (
          <div>
            <dt>{t("works.shipments.tracking")}</dt>
            <dd className="wk-mono">{booking.tracking ?? "—"}</dd>
          </div>
        ) : (
          <div>
            <dt>{t("works.card.problem")}</dt>
            <dd>{t("works.card.askedAt", { time: fmt.moment(new Date(booking.calledAt ?? booking.createdAt).toISOString()) })}</dd>
          </div>
        )}
      </dl>
      {bought && (
        <div className="wk-action-row">
          {booking.label.state === "ready" && (
            <button type="button" className="wk-btn wk-btn--small" disabled={working} onClick={() => void download()}>
              <Download size={14} aria-hidden="true" />
              {t("works.card.download")}
            </button>
          )}
          {booking.label.state === "owed" && (
            <button type="button" className="wk-btn wk-btn--small" disabled={working} onClick={() => void fetchAgain()}>
              <RefreshCw size={14} aria-hidden="true" />
              {t("works.card.fetch")}
            </button>
          )}
          {!booking.test && (
            <button type="button" className="wk-btn wk-btn--small" disabled={working} onClick={() => void refresh()}>
              <RefreshCw size={14} aria-hidden="true" />
              {t("works.card.refresh")}
            </button>
          )}
          {newNumber && door.who().can("orders", "update") && (
            <button type="button" className="wk-btn wk-btn--small" disabled={busy} onClick={() => void tell()}>
              <Megaphone size={14} aria-hidden="true" />
              {t("works.card.newNumber")}
            </button>
          )}
        </div>
      )}
      {bought && !booking.test && (
        <p className="wk-field-hint">
          {checkedAt !== null && (
            <>
              <Mono>{t("works.card.checked", { time: fmt.moment(new Date(checkedAt).toISOString()) })}</Mono>{" "}
            </>
          )}
          {t("works.card.onlyRefresh")}
        </p>
      )}
    </div>
  );
}

export function ShipmentCard({ order, client, read }: { order: Row; client: EngineCarrier | null; read: BookingsRead }) {
  const t = useT();
  const shown = read.bookings.filter((b) => b.state === "booked" || b.state === "unknown" || b.state === "calling" || b.state === "reserved");
  if (client === null || shown.length === 0) return null;
  return (
    <section className="wk-panel" aria-labelledby="wk-shipment-title">
      <h2 className="wk-panel-head wk-panel-head--small" id="wk-shipment-title">
        {t("works.shipment.title")}
      </h2>
      {shown.map((b) => (
        <Parcel key={b.id} booking={b} order={order} client={client} reread={read.reread} />
      ))}
    </section>
  );
}
