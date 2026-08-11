/*
 * VENDORED from add-ons/packages/shipping-dhl/src/ui/TrackingPanel.tsx — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `shipping-dhl`; its manifest, tests and README live in the monorepo.
 */
/**
 * `order.dispatch.panel` — what the customer sees on their own order.
 *
 * READ-ONLY, and that is the design rather than a limitation: a customer can
 * see where their parcel is and nothing else. There is no rebooking, no address
 * edit and no cancel here, because none of those are the customer's to do once
 * the works has handed the parcel over.
 *
 * With the add-on switched off this fill disappears and the host's own words
 * come back — "Collection from the works" — with nothing about a carrier left
 * on the page. That round trip is the whole demo device (24 D6), so this
 * component owns no state the host cannot throw away.
 */

import { useEffect, useState } from "react";
import { PackageSearch } from "lucide-react";

import type { DispatchPayload } from "../../host/index.ts";
import type { Shipment, TrackEvent } from "../../host/contracts/index.ts";
import { useFormat, useT } from "../i18n/t.ts";
import { carrier, findShipment, isDemo } from "../runtime.ts";
import { Code, Monogram, Mono, NotAffiliated, Tag } from "./atoms.tsx";
import { eventText, serviceName } from "./labels.ts";

export function TrackingPanel({ order }: DispatchPayload) {
  const t = useT();
  const { clock, day, timeOfDay } = useFormat();

  const [shipment, setShipment] = useState<Shipment | null>(() => findShipment(order.ref) ?? null);
  const [events, setEvents] = useState<TrackEvent[]>([]);
  const [showNote, setShowNote] = useState(false);

  useEffect(() => {
    const found = findShipment(order.ref) ?? null;
    setShipment(found);
    if (found === null) {
      setEvents([]);
      return;
    }
    let live = true;
    void carrier()
      .track(found.tracking)
      .then((rows) => {
        if (live) setEvents(rows);
      });
    return () => {
      live = false;
    };
  }, [order.ref]);

  if (shipment === null) {
    /*
     * Not an empty state with a dashed border and an invitation — a fact. The
     * order simply has not gone out with a carrier, and there is nothing here
     * for the customer to do about it.
     *
     * THE NOT-AFFILIATED LINE BELONGS HERE TOO (24 AC6). It used to sit only in
     * the branch below, on the reasoning that a tracking timeline is where the
     * company is named. That reading was wrong about this branch: the monogram
     * reads "DHL", which is the company named as plainly as a word is, and a
     * customer whose order has not shipped yet sees THIS card and no other. A
     * page-wide grep for "affiliat" on a connected-but-not-dispatched order
     * came back empty — the disclosure was absent from the whole screen, not
     * merely from one corner of it.
     */
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, color: "var(--fg-muted)" }}>
          <Monogram letters="DHL" size={34} />
          <span style={{ fontSize: 13.5 }}>{t("addon.shipping-dhl.panel.notSent")}</span>
        </div>
        <NotAffiliated>{t("addon.shipping-dhl.notAffiliated")}</NotAffiliated>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 11 }}>
        <Monogram letters="DHL" size={34} />
        <div style={{ minInlineSize: 0, flex: 1 }}>
          <div style={{ fontSize: 11.5, color: "var(--fg-subtle)" }}>
            {t("addon.shipping-dhl.booked.tracking")}
          </div>
          <Code style={{ fontSize: 15, fontWeight: 700 }}>{shipment.tracking}</Code>
        </div>
        {isDemo() && <Tag tone="warn">{t("addon.shipping-dhl.demoChip")}</Tag>}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 18 }}>
        <div>
          <div style={{ fontSize: 11.5, color: "var(--fg-subtle)" }}>
            {t("addon.shipping-dhl.panel.carrier")}
          </div>
          {/* The company is named, in plain text, only to say who is carrying
              the parcel. That is the whole of the permitted use (24 D12). */}
          <span style={{ fontSize: 13, fontWeight: 700 }}>DHL</span>
        </div>
        <div>
          <div style={{ fontSize: 11.5, color: "var(--fg-subtle)" }}>
            {t("addon.shipping-dhl.booked.service")}
          </div>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{serviceName(t, shipment.rate, timeOfDay)}</span>
        </div>
        <div>
          <div style={{ fontSize: 11.5, color: "var(--fg-subtle)" }}>
            {t("addon.shipping-dhl.panel.due")}
          </div>
          <Mono style={{ fontSize: 12.5, fontWeight: 600 }}>
            {day(shipment.rate.estimatedDelivery)}
          </Mono>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {events.map((event, i) => (
          <div key={event.at} style={{ display: "grid", gridTemplateColumns: "16px 1fr", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span
                style={{
                  inlineSize: 9,
                  blockSize: 9,
                  borderRadius: 99,
                  background: i === events.length - 1 ? "var(--accent)" : "var(--pos)",
                  marginBlockStart: 5,
                }}
              />
              {i < events.length - 1 && (
                <span
                  style={{ inlineSize: 2, flex: 1, minBlockSize: 14, background: "var(--border-strong)" }}
                />
              )}
            </div>
            <div style={{ paddingBlockEnd: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{eventText(t, event)}</div>
              <Mono style={{ fontSize: 11, color: "var(--fg-subtle)", marginBlockStart: 2 }}>
                {`${day(event.at.slice(0, 10))} · ${clock(event.at)} · ${event.place}`}
              </Mono>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <button
          type="button"
          onClick={() => setShowNote((open) => !open)}
          aria-expanded={showNote}
          style={{
            alignSelf: "flex-start",
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            border: 0,
            background: "transparent",
            padding: 0,
            color: "var(--accent)",
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "underline",
            cursor: "pointer",
          }}
        >
          <PackageSearch size={15} aria-hidden="true" />
          {t("addon.shipping-dhl.panel.trackIt")}
        </button>
        {/* "Track it" leads somewhere real or it says why it does not. It never
            goes to a page that will not exist until someone connects a real
            account — a dead link is the one thing a tracking panel must not be. */}
        {showNote && (
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: "var(--fg-muted)" }}>
            {t("addon.shipping-dhl.panel.noPage")}
          </p>
        )}
        <NotAffiliated>{t("addon.shipping-dhl.notAffiliated")}</NotAffiliated>
      </div>
    </div>
  );
}
