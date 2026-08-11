/*
 * VENDORED from add-ons/packages/shipping-dhl/src/ui/DeliveryMethods.tsx — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `shipping-dhl`; its manifest, tests and README live in the monorepo.
 */
/**
 * `checkout.delivery.methods` — the customer's half of the same rate list.
 *
 * The same three rates the works sees, priced by the same engine from the same
 * parcel arithmetic. That is deliberate: a shop whose checkout quotes one price
 * and whose dispatch screen quotes another has two rate cards and one of them
 * is wrong.
 *
 * The destination is not in this payload — the host passes the basket, and the
 * delivery address is still being typed at this point in the flow — so the
 * estimate quotes domestically. In connected mode the host passes the address
 * with the basket and the zone comes from it; nothing else here changes.
 */

import { useEffect, useState } from "react";
import { Truck } from "lucide-react";

import { CarrierError, type Rate } from "../../host/contracts/index.ts";
import type { CheckoutPayload, DeliveryChoice } from "../../host/index.ts";
import { collectionDay, dispatchDay } from "../clock.ts";
import { useFormat, useT } from "../i18n/t.ts";
import { parcelFor } from "../parcel.ts";
import { cheapestCode, postponedTo, type QuotedRate } from "../rates.ts";
import { carrier, isDemo, setHostClock } from "../runtime.ts";
import { domesticStandIn, originOf } from "../seed.ts";
import { publicSettings } from "../settings.ts";
import { Monogram, Mono, NotAffiliated, Panel, PanelTitle, Tag } from "./atoms.tsx";
import { contentsLine, serviceName } from "./labels.ts";

/** This add-on's key, as its manifest declares it. */
const ADD_ON_KEY = "shipping-dhl";

export function DeliveryMethods({
  items,
  origin,
  destination,
  now,
  readyOn,
  chosen = null,
  onChoose,
}: CheckoutPayload) {
  const t = useT();
  const { money, day, timeOfDay } = useFormat();

  const [rates, setRates] = useState<QuotedRate[] | null>(null);
  const [refused, setRefused] = useState<string | null>(null);

  /*
   * THE DAY THE PARCEL ACTUALLY GOES, which is not always today.
   *
   * `collected` is the day the CARRIER could come; `dispatched` is the later of
   * that and the first day the SHOP can hand the thing over. A studio that
   * makes to order posts on neither of the two days a carrier knows about, and
   * until `readyOn` existed the panel quoted transit from today and printed an
   * arrival three days before the checkout above it said the parcel would be
   * posted.
   */
  const cutoff = publicSettings().collection_cutoff;
  const collected = collectionDay(now, cutoff);
  const dispatched = dispatchDay(now, cutoff, readyOn);
  const postponed = dispatched > collected;

  /*
   * THE CLOCK BY ITS PARTS. The host builds a fresh `{ iso, hour, minute }`
   * every render, so an effect depending on the OBJECT would re-quote forever;
   * the three primitives change exactly when the shop's day does, which is what
   * pressing "+1 studio day" moves.
   */
  const { iso: nowIso, hour: nowHour, minute: nowMinute } = now;

  useEffect(() => {
    let live = true;
    /*
     * "Arrives Friday" is arithmetic on the shop's today, so the transport has
     * to be built against the shop's clock before it is asked for a rate. The
     * till and the dispatch screen quote the same numbers from the same engine
     * (see this file's header) — which stops being true the moment one of them
     * is counting from a different Wednesday.
     *
     * IT IS IN THE EFFECT AND NOT IN THE RENDER, which is where it used to sit.
     * It was idempotent and guarded, so it never misbehaved — but writing to a
     * module-level store while React is rendering is a side effect in a place
     * that promises not to have one, and under a concurrent render it would be
     * doing it twice for a tree that may be thrown away. It only needs to
     * happen before the first `carrier()` call, and that call is on the next
     * line.
     */
    setHostClock({ iso: nowIso, hour: nowHour, minute: nowMinute });
    const estimate = parcelFor(items);
    const from = originOf({ origin });
    carrier()
      .quote(
        {
          weightKg: estimate.weightKg,
          lengthCm: estimate.lengthCm,
          widthCm: estimate.widthCm,
          heightCm: estimate.heightCm,
          // The contents line is the shop's business, not the customer's; the
          // carrier still needs one, so the parcel describes itself plainly,
          // out of the labels the host already translated.
          contents: contentsLine(t, estimate),
        },
        from,
        /*
         * NOBODY HAS TYPED AN ADDRESS YET, and that is not a gap to paper over.
         * A basket at the till has no destination — the host says so by passing
         * none — so the estimate is quoted in the shop's OWN country and the
         * copy under the heading says it is a domestic estimate. Quoting
         * against some seeded customer's address, which is what this used to
         * do, made the number confidently wrong in every shop but one.
         */
        destination === undefined ? domesticStandIn(from) : originOf({ origin: destination }),
      )
      .then((quoted: Rate[]) => {
        if (!live) return;
        /*
         * The carrier said how long it takes; the SHOP says when the clock
         * starts. `postponedTo` moves every arrival date by the working days
         * between the two and leaves the prices exactly as quoted — the transit
         * time is the carrier's to know and the rate card is the carrier's to
         * set, and neither of them is what a made-to-order studio changes.
         */
        setRates(postponedTo(quoted as QuotedRate[], collected, dispatched));
        /*
         * NOTHING IS PRE-SELECTED. An estimate that arrives already chosen
         * would either be a choice the customer did not make — and the host
         * would have to be told about it behind their back — or a highlighted
         * row that means nothing. The host's own delivery stays selected until
         * somebody presses one of these.
         */
      })
      .catch((err: unknown) => {
        // Even at checkout a refusal is words, not a spinner: a customer who
        // cannot see rates should be told the carrier said no.
        if (live) setRefused(err instanceof CarrierError ? err.carrierMessage : String(err));
      });
    return () => {
      live = false;
    };
  }, [collected, destination, dispatched, items, nowIso, nowHour, nowMinute, origin, t]);

  if (rates === null && refused === null) return null;

  const cheapest = rates === null ? null : cheapestCode(rates);

  return (
    <Panel>
      <div style={{ display: "flex", alignItems: "center", gap: 11, marginBlockEnd: 12 }}>
        <Monogram letters="DHL" size={34} />
        <div style={{ minInlineSize: 0 }}>
          <PanelTitle>{t("addon.shipping-dhl.checkout.title")}</PanelTitle>
          <div style={{ fontSize: 12.5, color: "var(--fg-subtle)", marginBlockStart: 2 }}>
            {t("addon.shipping-dhl.checkout.sub")}
          </div>
          {/*
            WHY THE DATES ARE FURTHER OUT THAN THE CUT-OFF WOULD SUGGEST.
            A customer reading "arrives Wed 12" under a carrier's name will
            assume the carrier is slow; the truth is the shop cannot post it
            until Monday, and the shop is the only party that knows. Rendered
            only when the ready date actually moves something, because a line
            saying "counted from today" on every basket is noise.
           */}
          {postponed && (
            <div style={{ fontSize: 12.5, color: "var(--fg-muted)", marginBlockStart: 3 }}>
              {t("addon.shipping-dhl.checkout.fromReady", { day: day(dispatched) })}
            </div>
          )}
        </div>
        <Truck size={17} aria-hidden="true" style={{ marginInlineStart: "auto", color: "var(--fg-subtle)" }} />
      </div>

      {refused !== null && (
        <div
          style={{
            fontFamily: "var(--font-mono, ui-monospace, monospace)",
            fontSize: 12.5,
            color: "var(--fg)",
            background: "var(--danger-soft)",
            borderRadius: 10,
            padding: "11px 13px",
          }}
        >
          “{refused}”
        </div>
      )}

      {/* AC7 — ABOVE the rates, not under them. A customer reads this list,
          presses one and changes what they owe; a label they meet after the
          decision is a disclaimer, not a label.
          IT COVERS THE REFUSAL TOO. An earlier version gated this on
          `rates.length > 0` and reasoned that the refusal quote above "only
          ever renders under this one" — which is exactly backwards: `refused`
          is set precisely WHEN `rates` is null, so the one branch that prints
          a carrier's verbatim words to a customer was the one branch with no
          chip. */}
      {isDemo() && ((rates ?? []).length > 0 || refused !== null) && (
        <div style={{ marginBlockEnd: 10 }}>
          <Tag tone="warn">{t("addon.shipping-dhl.checkout.simulated")}</Tag>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {(rates ?? []).map((rate) => {
          const selected = chosen?.addOn === ADD_ON_KEY && chosen.code === rate.code;
          const choice: DeliveryChoice = {
            addOn: ADD_ON_KEY,
            code: rate.code,
            // Translated here, because the words for a delivery service belong
            // to whoever sells it — the host renders this string as it stands.
            label: serviceName(t, rate, timeOfDay),
            amount: rate.amount,
            currency: rate.currency,
            estimatedDelivery: rate.estimatedDelivery,
          };
          return (
            <button
              key={rate.code}
              type="button"
              aria-pressed={selected}
              onClick={() => onChoose?.(choice)}
              style={{
                textAlign: "start",
                border: `1.5px solid ${selected ? "var(--accent)" : "var(--border-strong)"}`,
                background: "var(--surface-2)",
                borderRadius: 11,
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  inlineSize: 19,
                  blockSize: 19,
                  borderRadius: 99,
                  border: `1.5px solid ${selected ? "var(--accent)" : "var(--border-strong)"}`,
                  display: "grid",
                  placeItems: "center",
                  flex: "0 0 auto",
                }}
              >
                <span
                  style={{
                    inlineSize: 9,
                    blockSize: 9,
                    borderRadius: 99,
                    background: selected ? "var(--accent)" : "transparent",
                  }}
                />
              </span>
              <span style={{ flex: 1, minInlineSize: 0 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, display: "block" }}>
                  {serviceName(t, rate, timeOfDay)}
                </span>
                <Mono style={{ fontSize: 11.5, color: "var(--fg-subtle)", whiteSpace: "normal" }}>
                  {t("addon.shipping-dhl.rates.arrives", { date: day(rate.estimatedDelivery) })}
                </Mono>
              </span>
              {rate.code === cheapest && <Tag tone="pos">{t("addon.shipping-dhl.rates.cheapest")}</Tag>}
              <Mono style={{ fontSize: 14, fontWeight: 700 }}>{money(rate.amount, rate.currency)}</Mono>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBlockStart: 12 }}>
        <NotAffiliated>{t("addon.shipping-dhl.notAffiliated")}</NotAffiliated>
      </div>
    </Panel>
  );
}
