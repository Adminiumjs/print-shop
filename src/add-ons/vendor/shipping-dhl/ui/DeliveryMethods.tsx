/*
 * VENDORED from add-on-shipping-dhl/src/ui/DeliveryMethods.tsx — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the add-on repo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `shipping-dhl`; its manifest, tests and README live in that repo.
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

import { CarrierError, type Rate } from "../contracts.ts";
import type { CheckoutPayload, DeliveryChoice } from "../host.ts";
import { useFormat, useT } from "../i18n/t.ts";
import { parcelForBasket } from "../parcel.ts";
import { cheapestCode, type QuotedRate } from "../rates.ts";
import { carrier, isDemo } from "../runtime.ts";
import { DESTINATIONS, WORKS_ADDRESS } from "../seed.ts";
import { Monogram, Mono, NotAffiliated, Panel, PanelTitle, Tag } from "./atoms.tsx";
import { packagingKeyFor, serviceName } from "./labels.ts";

/** This add-on's key, as its manifest declares it. */
const ADD_ON_KEY = "shipping-dhl";

export function DeliveryMethods({ basket, chosen = null, onChoose }: CheckoutPayload) {
  const t = useT();
  const { money, day } = useFormat();

  const [rates, setRates] = useState<QuotedRate[] | null>(null);
  const [refused, setRefused] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    const estimate = parcelForBasket(basket);
    carrier()
      .quote(
        {
          weightKg: estimate.weightKg,
          lengthCm: estimate.lengthCm,
          widthCm: estimate.widthCm,
          heightCm: estimate.heightCm,
          // The contents line is the works' business, not the customer's; the
          // carrier still needs one, so the parcel describes itself plainly.
          contents: t("addon.shipping-dhl.parcel.contentsValue", {
            gsm: estimate.from.gsm,
            packaging: t(packagingKeyFor(estimate.from.packagingKey)),
          }),
        },
        WORKS_ADDRESS,
        DESTINATIONS.harbour!,
      )
      .then((quoted: Rate[]) => {
        if (!live) return;
        setRates(quoted as QuotedRate[]);
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
  }, [basket, t]);

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
            label: serviceName(t, rate),
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
                  {serviceName(t, rate)}
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
