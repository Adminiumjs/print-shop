/*
 * VENDORED from add-ons/packages/shipping-dhl/src/ui/ReturnLabel.tsx — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `shipping-dhl`; its manifest, tests and README live in the monorepo.
 */
/**
 * `record.actions` — a prepaid return label for the record in front of you.
 *
 * ── THE INBOUND HALF OF THE CARRIER (31 O4, ruled 2026-09-01) ───────────────
 *
 * A customer sending something back is the same contract with the route
 * reversed: `quote` takes two addresses and has no opinion about which one is
 * the shop, `book` buys a prepaid label the SENDER applies, and `track` follows
 * the parcel toward whoever is receiving it. The conformance suite says so
 * executably — quote is direction-symmetric and the refusal is end-symmetric —
 * so nothing here bends the contract; it points it the other way.
 *
 * ── WHY THIS SURFACE, AND NOT THE DISPATCH SLOTS ────────────────────────────
 *
 * `order.dispatch.panel` is the customer's READ-ONLY view of a parcel the shop
 * sent — its own header says nothing there is the customer's to do. A return
 * inverts that sentence: booking the return label is EXACTLY the customer's to
 * do, and `record.actions` is the surface bought for "act on the record in
 * front of you", on either side of the counter (`surface: 'both'`, and the
 * dossier's own exhibits include the reader's own record). Once the label is
 * booked, the unmodified TrackingPanel renders the inbound timeline from the
 * same reference, which is the composition doing the work a payload change
 * would otherwise have been asked to do.
 *
 * ── WHAT THIS FILL READS, AND POINTEDLY DOES NOT ────────────────────────────
 *
 * Like the first fill of this slot (barcode-labels' RecordAction, whose header
 * is the precedent), it reads `entity`, `recordId`, `now` and its OWN settings
 * — and not one field of `record`. The two addresses a label needs come from
 * the two parties who own them: the RETURNS DEPOT is the operator's
 * configuration of this add-on (the settings panel's returns section — the
 * shop tells its carrier where returns go, which is how the real product
 * works), and the SENDER types their own address into the form below, which is
 * `payloads.ts`'s blessed shape for a fact the payload does not carry: say so
 * on screen and take it in a form rather than guessing.
 *
 * `entity !== "return"` renders NOTHING, by design: this slot is multi-fill
 * and hosts mount it on records this fill has no business with (a works item,
 * a studio piece). A fill that correctly draws nothing is the case the seam's
 * paint-detection exists for.
 */

import { useEffect, useState } from "react";
import { CircleX, CornerDownRight, RefreshCw, Undo2 } from "lucide-react";

import { CarrierError, type Address, type Shipment } from "../../host/contracts/index.ts";
import type { RecordActionsPayload } from "../../host/index.ts";
import { useFormat, useT } from "../i18n/t.ts";
import { labelFilename } from "../label.ts";
import { parcelFor } from "../parcel.ts";
import { cheapestCode, type QuotedRate } from "../rates.ts";
import { carrier, findShipment, isDemo, labels, rememberRoute, setHostClock } from "../runtime.ts";
import { addressIsUsable, blankAddress, POSTCODE_HINT } from "../seed.ts";
import {
  Button,
  Code,
  Field,
  inputStyle,
  Mono,
  Monogram,
  monoInputStyle,
  NotAffiliated,
  Panel,
  PanelTitle,
  Tag,
} from "./atoms.tsx";
import { serviceName } from "./labels.ts";

/** The entity this fill serves. Anything else draws nothing — see the header. */
const SERVED_ENTITY = "return";

/**
 * The returns depot, out of the add-on's own saved values — or null, which the
 * screen states in words. The five keys are the ones `manifest.json` declares
 * under `publicSettings` and the settings panel edits; an address without a
 * usable town and postcode is treated as not configured rather than half-used,
 * because a label with half an address on it is worse than no label.
 */
export function depotFrom(settings: RecordActionsPayload["settings"]): Address | null {
  const values = settings ?? {};
  const text = (key: string): string => {
    const value = values[key];
    return typeof value === "string" ? value.trim() : "";
  };
  const depot: Address = {
    name: text("returns_name"),
    lines: text("returns_lines")
      .split(",")
      .map((line) => line.trim())
      .filter((line) => line.length > 0),
    city: text("returns_city"),
    postcode: text("returns_postcode"),
    country: text("returns_country").toUpperCase(),
  };
  return addressIsUsable(depot) && depot.name.length > 0 ? depot : null;
}

function withLabelBlob(bytes: string, use: (url: string) => void): void {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  use(url);
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function ReturnLabel({ payload }: { payload: RecordActionsPayload }) {
  const t = useT();
  const { day, money, timeOfDay } = useFormat();

  const depot = depotFrom(payload.settings);
  const reference = payload.recordId;

  // The customer's own address. Starts empty apart from the depot's country —
  // most returns are domestic — and "Get rates" stays disabled until a town
  // and a postcode exist, so an empty address cannot be quoted.
  const [sender, setSender] = useState<Address>(() => blankAddress("", depot?.country ?? "GB"));

  const [rates, setRates] = useState<QuotedRate[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  // A label made earlier outlives this component. It lives in the transport —
  // the same place the customer's order page reads from — so the initial state
  // ASKS rather than remembers, exactly as TrackingPanel does. The read is
  // synchronous because `find` is a records question, not a carrier call.
  const [made, setMade] = useState<Shipment | null>(() => findShipment(reference) ?? null);
  const [failure, setFailure] = useState<CarrierError | null>(null);
  const [busy, setBusy] = useState(false);

  // The shop's clock, before anything is dated against it — the same
  // arrangement DispatchAction documents at length.
  const { iso: nowIso, hour: nowHour, minute: nowMinute } = payload.now;
  useEffect(() => {
    setHostClock({ iso: nowIso, hour: nowHour, minute: nowMinute });
  }, [nowIso, nowHour, nowMinute]);

  if (payload.entity !== SERVED_ENTITY) return null;

  if (depot === null) {
    // The weight precedent applied to an address: the shop has not told its
    // carrier where returns go, and the surface says so instead of guessing.
    return (
      <Panel>
        <div style={{ display: "flex", alignItems: "center", gap: 11, color: "var(--fg-muted)" }}>
          <Monogram letters="DHL" size={34} />
          <span style={{ fontSize: 13.5 }}>{t("addon.shipping-dhl.returns.notSetUp")}</span>
        </div>
        <div style={{ marginBlockStart: 8 }}>
          <NotAffiliated>{t("addon.shipping-dhl.notAffiliated")}</NotAffiliated>
        </div>
      </Panel>
    );
  }

  const getRates = async () => {
    setBusy(true);
    setFailure(null);
    const estimate = parcelFor([]);
    try {
      const quoted = (await carrier().quote(
        {
          weightKg: estimate.weightKg,
          lengthCm: estimate.lengthCm,
          widthCm: estimate.widthCm,
          heightCm: estimate.heightCm,
          contents: reference,
        },
        sender,
        depot,
      )) as QuotedRate[];
      setRates(quoted);
      setSelected(cheapestCode(quoted));
    } catch (err) {
      // A refusal is DATA. It renders; it does not go to the console.
      setRates(null);
      setFailure(
        err instanceof CarrierError
          ? err
          : new CarrierError({ code: "UNKNOWN", carrierMessage: String(err) }),
      );
    } finally {
      setBusy(false);
    }
  };

  const makeLabel = async () => {
    const rate = rates?.find((r) => r.code === selected) ?? rates?.[0];
    if (rate === undefined) return;
    setBusy(true);
    try {
      rememberRoute(reference, sender, depot);
      const shipment = await carrier().book(rate, { reference });
      setMade(shipment);
      setFailure(null);
    } catch (err) {
      setFailure(
        err instanceof CarrierError
          ? err
          : new CarrierError({ code: "UNKNOWN", carrierMessage: String(err) }),
      );
    } finally {
      setBusy(false);
    }
  };

  if (made !== null) {
    const bytes = labels()?.read(made.labelFileId);
    return (
      <Panel>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
          <PanelTitle tone="pos">{t("addon.shipping-dhl.returns.made")}</PanelTitle>
          {isDemo() && <Tag tone="warn">{t("addon.shipping-dhl.demoChip")}</Tag>}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginBlockStart: 12 }}>
          <div>
            <div style={{ fontSize: 11.5, color: "var(--fg-subtle)" }}>
              {t("addon.shipping-dhl.booked.tracking")}
            </div>
            <Code style={{ fontSize: 14.5, fontWeight: 700 }}>{made.tracking}</Code>
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: "var(--fg-subtle)" }}>
              {t("addon.shipping-dhl.booked.service")}
            </div>
            <span style={{ fontSize: 13, fontWeight: 700 }}>
              {serviceName(t, made.rate, timeOfDay)}
            </span>
          </div>
        </div>

        <p style={{ margin: "12px 0 0", fontSize: 12.5, lineHeight: 1.5, color: "var(--fg-muted)" }}>
          {t("addon.shipping-dhl.returns.apply")}
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBlockStart: 12 }}>
          <Button
            variant="solid"
            disabled={bytes === undefined}
            onClick={() => {
              if (bytes === undefined) return;
              withLabelBlob(bytes, (url) => {
                const a = document.createElement("a");
                a.href = url;
                a.download = labelFilename(made.tracking);
                a.click();
              });
            }}
          >
            {t("addon.shipping-dhl.label.download")}
          </Button>
        </div>

        <div style={{ marginBlockStart: 10 }}>
          <NotAffiliated>{t("addon.shipping-dhl.notAffiliated")}</NotAffiliated>
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
        <Undo2 size={16} aria-hidden="true" style={{ color: "var(--fg-muted)" }} />
        <PanelTitle>{t("addon.shipping-dhl.returns.title")}</PanelTitle>
        {isDemo() && rates !== null && (
          <span style={{ marginInlineStart: "auto" }}>
            <Tag tone="warn">{t("addon.shipping-dhl.rates.simulated")}</Tag>
          </span>
        )}
      </div>

      <p style={{ margin: "6px 0 0", fontSize: 12.5, lineHeight: 1.5, color: "var(--fg-muted)" }}>
        {t("addon.shipping-dhl.returns.intro")}{" "}
        {t("addon.shipping-dhl.returns.toDepot", { name: depot.name, city: depot.city })}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBlockStart: 12 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--fg-muted)" }}>
          {t("addon.shipping-dhl.returns.sender")}
        </div>
        <Field label={t("addon.shipping-dhl.returns.senderName")}>
          <input
            value={sender.name}
            onChange={(e) => setSender({ ...sender, name: e.target.value })}
            style={inputStyle}
          />
        </Field>
        <Field label={t("addon.shipping-dhl.dest.street")}>
          <input
            value={sender.lines.join(", ")}
            onChange={(e) =>
              setSender({ ...sender, lines: e.target.value.split(",").map((l) => l.trim()) })
            }
            style={inputStyle}
          />
        </Field>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12,
          }}
        >
          <Field label={t("addon.shipping-dhl.dest.city")}>
            <input
              value={sender.city}
              onChange={(e) => setSender({ ...sender, city: e.target.value })}
              style={inputStyle}
            />
          </Field>
          <Field label={t("addon.shipping-dhl.error.postcode")}>
            <input
              value={sender.postcode}
              onChange={(e) => setSender({ ...sender, postcode: e.target.value })}
              style={monoInputStyle}
            />
          </Field>
          <Field label={t("addon.shipping-dhl.error.country")}>
            <input
              value={sender.country}
              onChange={(e) => setSender({ ...sender, country: e.target.value })}
              style={inputStyle}
            />
          </Field>
        </div>
      </div>

      <p style={{ margin: "10px 0 0", fontSize: 11.5, lineHeight: 1.5, color: "var(--fg-subtle)" }}>
        {t("addon.shipping-dhl.returns.parcelNote", { kg: parcelFor([]).weightKg })}
      </p>

      {failure !== null && (
        <div
          style={{
            border: "1.5px solid var(--danger)",
            borderRadius: 11,
            background: "var(--danger-soft, var(--surface-2))",
            padding: "12px 13px",
            marginBlockStart: 12,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 9 }}>
            <CircleX size={16} aria-hidden="true" style={{ color: "var(--danger)" }} />
            <span style={{ fontSize: 13, fontWeight: 700 }}>
              {t("addon.shipping-dhl.error.title")}
            </span>
            {isDemo() && (
              <span style={{ marginInlineStart: "auto" }}>
                <Tag tone="warn">{t("addon.shipping-dhl.error.simulated")}</Tag>
              </span>
            )}
          </div>
          {/* The carrier's own message, verbatim and never paraphrased. */}
          <Mono style={{ fontSize: 12.5, whiteSpace: "normal" }}>“{failure.carrierMessage}”</Mono>
          <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
            <CornerDownRight
              size={15}
              aria-hidden="true"
              style={{ color: "var(--fg-subtle)", flex: "0 0 auto", marginBlockStart: 2 }}
            />
            <span style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--fg-muted)" }}>
              {t("addon.shipping-dhl.error.remedy1", {
                country: sender.country,
                example: POSTCODE_HINT[sender.country] ?? "—",
              })}
            </span>
          </div>
        </div>
      )}

      {rates !== null && (
        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBlockStart: 12 }}>
          {rates.map((rate) => {
            const chosen = rate.code === selected;
            return (
              <button
                key={rate.code}
                type="button"
                onClick={() => setSelected(rate.code)}
                aria-pressed={chosen}
                style={{
                  textAlign: "start",
                  border: `1.5px solid ${chosen ? "var(--accent)" : "var(--border-strong)"}`,
                  background: chosen ? "var(--accent-soft, var(--surface-2))" : "var(--surface-2)",
                  borderRadius: 11,
                  padding: "11px 13px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  cursor: "pointer",
                }}
              >
                <span style={{ flex: 1, minInlineSize: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, display: "block" }}>
                    {serviceName(t, rate, timeOfDay)}
                  </span>
                  <Mono style={{ fontSize: 11.5, color: "var(--fg-subtle)", whiteSpace: "normal" }}>
                    {t("addon.shipping-dhl.rates.arrives", { date: day(rate.estimatedDelivery) })}
                  </Mono>
                </span>
                {rate.code === cheapestCode(rates) && (
                  <Tag tone="pos">{t("addon.shipping-dhl.rates.cheapest")}</Tag>
                )}
                <Mono style={{ fontSize: 13.5, fontWeight: 700 }}>
                  {money(rate.amount, rate.currency)}
                </Mono>
              </button>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBlockStart: 14 }}>
        {rates === null ? (
          <Button
            variant="solid"
            onClick={() => void getRates()}
            disabled={busy || !addressIsUsable(sender)}
          >
            {failure !== null && <RefreshCw size={15} aria-hidden="true" />}
            {t(failure === null ? "addon.shipping-dhl.rates.get" : "addon.shipping-dhl.error.retry")}
          </Button>
        ) : (
          <Button variant="solid" onClick={() => void makeLabel()} disabled={busy}>
            {t("addon.shipping-dhl.returns.make")}
          </Button>
        )}
      </div>

      <div style={{ marginBlockStart: 10 }}>
        <NotAffiliated>{t("addon.shipping-dhl.notAffiliated")}</NotAffiliated>
      </div>
    </Panel>
  );
}
