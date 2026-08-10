/*
 * VENDORED from add-ons/packages/shipping-dhl/src/ui/DispatchAction.tsx — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `shipping-dhl`; its manifest, tests and README live in the monorepo.
 */
/**
 * `order.dispatch.actions` — the works books a collection.
 *
 * This is the whole reason the add-on exists, and it is also the whole of its
 * staff-facing scope. It books parcel collections with a carrier. It is NOT job
 * dispatch, NOT field-service routing and NOT driver management, and it gains
 * none of those screens even as an empty state (24 §7). If a future change here
 * starts to look like a round plan, it belongs in a different product.
 *
 * The failure path is not optional and not a variant: the second seeded job's
 * address is refused, and this component renders the carrier's own words
 * verbatim, what the works can do about it, and a retry that genuinely works
 * once the postcode is fixed. A spinner that gives up silently is the defect
 * this screen was designed against.
 */

import { useCallback, useMemo, useState } from "react";
import {
  CircleX,
  CornerDownRight,
  Download,
  FileText,
  MapPinOff,
  PackageCheck,
  Printer,
  RefreshCw,
  Search,
  Truck,
} from "lucide-react";

import { collectionDay, isWorkingDay, minutesOfDay, parseTime, PINNED_NOW } from "../clock.ts";
import { CarrierError, type Address, type FileRef, type Shipment, type TrackEvent } from "../../host/contracts/index.ts";
import type { DispatchPayload } from "../host-payloads.ts";
import { useFormat, useT } from "../i18n/t.ts";
import { parcelFor, type ParcelEstimate } from "../parcel.ts";
import { cheapestCode, COLLECTION_WINDOW, type QuotedRate } from "../rates.ts";
import { carrier, isDemo, labels, rememberDestination } from "../runtime.ts";
import {
  addressIsUsable,
  blankAddress,
  POSTCODE_HINT,
  resolveDestination,
  WORKS_ADDRESS,
} from "../seed.ts";
import { publicSettings } from "../settings.ts";
import {
  Button,
  Field,
  inputStyle,
  Mono,
  monoInputStyle,
  NotAffiliated,
  Panel,
  PanelTitle,
  Tag,
} from "./atoms.tsx";
import { eventText, packagingKeyFor, serviceName } from "./labels.ts";

/** `34 × 26 × 12` in any of the shapes a shop floor actually types it. */
function parseDims(text: string): { lengthCm: number; widthCm: number; heightCm: number } | null {
  const parts = text
    .split(/[×x*/,]/)
    .map((p) => Number.parseFloat(p.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (parts.length !== 3) return null;
  return { lengthCm: parts[0]!, widthCm: parts[1]!, heightCm: parts[2]! };
}

function formatDims(estimate: ParcelEstimate): string {
  return `${estimate.lengthCm} × ${estimate.widthCm} × ${estimate.heightCm}`;
}

/** `10:20` from the pinned clock, never from a real one. */
function clockText(): string {
  return `${String(PINNED_NOW.hour).padStart(2, "0")}:${String(PINNED_NOW.minute).padStart(2, "0")}`;
}

/**
 * Hand the label to the operating system.
 *
 * A blob rather than a link: the demo transport holds the bytes in memory and
 * there is no server to fetch them from, which is exactly the arrangement
 * `LabelStore` exists to describe. Print goes through a hidden iframe because
 * `window.open` is blocked in enough embeddings to be unreliable, and a Print
 * button that silently does nothing is worse than no Print button.
 */
function withLabelBlob(bytes: string, use: (url: string) => void): void {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  use(url);
  // Long enough for the download to start or the frame to load; the object URL
  // is the only thing leaked if it is not revoked, so err on the side of late.
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

interface Booked {
  shipment: Shipment;
  file: FileRef;
  events: TrackEvent[];
}

/**
 * THE LOUD FALLBACK — what a customer this add-on cannot place looks like.
 *
 * It is a separate component so that it can be rendered and read on its own,
 * which is how `destination.test.ts` proves the property that matters: the
 * works is TOLD the address is missing and given an empty form, rather than
 * handed another customer's street with nothing on screen to say so. The old
 * behaviour rendered identically to a resolved address — same box, same mono
 * lines — which is precisely why nobody caught it.
 *
 * Every field starts empty except the customer's own name and the works'
 * country; `addressIsUsable` keeps "Get rates" disabled until a town and a
 * postcode exist, so an empty address cannot be quoted, booked or printed by
 * pressing on through.
 */
export function UnresolvedDestination({
  customer,
  to,
  onChange,
}: {
  customer: string;
  to: Address;
  onChange: (next: Address) => void;
}) {
  const t = useT();
  return (
    <div
      data-testid="destination-unresolved"
      style={{
        border: "1.5px solid var(--danger)",
        borderRadius: 11,
        background: "var(--danger-soft, var(--surface-2))",
        padding: "12px 13px",
        display: "flex",
        flexDirection: "column",
        gap: 11,
      }}
    >
      <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
        <MapPinOff
          size={16}
          aria-hidden="true"
          style={{ color: "var(--danger)", flex: "0 0 auto", marginBlockStart: 2 }}
        />
        <div style={{ minInlineSize: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--fg)" }}>
            {t("addon.shipping-dhl.dest.unknownTitle")}
          </div>
          <div
            style={{
              fontSize: 12.5,
              lineHeight: 1.5,
              color: "var(--fg-muted)",
              marginBlockStart: 3,
            }}
          >
            {t("addon.shipping-dhl.dest.unknownBody", { customer })}
          </div>
        </div>
      </div>

      <Field label={t("addon.shipping-dhl.dest.name")}>
        <input value={to.name} onChange={(e) => onChange({ ...to, name: e.target.value })} style={inputStyle} />
      </Field>
      <Field label={t("addon.shipping-dhl.dest.street")}>
        <input
          value={to.lines.join(", ")}
          onChange={(e) => onChange({ ...to, lines: e.target.value.split(",").map((l) => l.trim()) })}
          style={inputStyle}
        />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        <Field label={t("addon.shipping-dhl.dest.city")}>
          <input value={to.city} onChange={(e) => onChange({ ...to, city: e.target.value })} style={inputStyle} />
        </Field>
        <Field label={t("addon.shipping-dhl.error.postcode")}>
          <input
            value={to.postcode}
            onChange={(e) => onChange({ ...to, postcode: e.target.value })}
            style={monoInputStyle}
          />
        </Field>
        <Field label={t("addon.shipping-dhl.error.country")}>
          <input value={to.country} onChange={(e) => onChange({ ...to, country: e.target.value })} style={inputStyle} />
        </Field>
      </div>
    </div>
  );
}

export function DispatchAction({ job }: DispatchPayload) {
  const t = useT();
  const { money, day } = useFormat();

  const estimate = useMemo(() => parcelFor(job), [job]);
  const [open, setOpen] = useState(false);
  const [contents, setContents] = useState(() =>
    t("addon.shipping-dhl.parcel.contentsValue", {
      gsm: estimate.from.gsm,
      packaging: t(packagingKeyFor(estimate.from.packagingKey)),
    }),
  );
  const [weight, setWeight] = useState(() => String(estimate.weightKg));
  const [dims, setDims] = useState(() => formatDims(estimate));

  /*
   * WHERE IT IS GOING, or the honest admission that the add-on does not know.
   *
   * There is no fallback address behind this (`seed.ts`): an unresolved
   * customer renders an empty form the works fills in, never another
   * customer's postcode dressed up as this one's.
   */
  const destination = useMemo(() => resolveDestination(job), [job]);
  const [to, setTo] = useState<Address>(() =>
    destination.status === "resolved" ? destination.address : blankAddress(job.customer),
  );
  const unresolved = destination.status === "unresolved";

  const [rates, setRates] = useState<QuotedRate[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [booked, setBooked] = useState<Booked | null>(null);
  const [failure, setFailure] = useState<CarrierError | null>(null);
  const [busy, setBusy] = useState(false);

  const getRates = useCallback(async () => {
    setBusy(true);
    setFailure(null);
    const size = parseDims(dims) ?? estimate;
    try {
      const quoted = (await carrier().quote(
        {
          weightKg: Number.parseFloat(weight) || estimate.weightKg,
          lengthCm: size.lengthCm,
          widthCm: size.widthCm,
          heightCm: size.heightCm,
          contents,
        },
        WORKS_ADDRESS,
        to,
      )) as QuotedRate[];
      setRates(quoted);
      setSelected(quoted[0]?.code ?? null);
    } catch (err) {
      // A refusal is DATA. It renders; it does not go to the console and leave
      // the works watching a spinner.
      setRates(null);
      setFailure(err instanceof CarrierError ? err : new CarrierError({
        code: "UNKNOWN",
        carrierMessage: String(err),
      }));
    } finally {
      setBusy(false);
    }
  }, [contents, dims, estimate, to, weight]);

  const book = useCallback(async () => {
    const rate = rates?.find((r) => r.code === selected) ?? rates?.[0];
    if (rate === undefined) return;
    setBusy(true);
    try {
      rememberDestination(job.ref, to);
      const shipment = await carrier().book(rate, { reference: job.ref });
      const [file, events] = await Promise.all([
        carrier().label(shipment.id),
        carrier().track(shipment.tracking),
      ]);
      setBooked({ shipment, file, events });
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
  }, [job.ref, rates, selected, to]);

  const labelBytes = booked === null ? undefined : labels()?.read(booked.file.fileId);

  if (!open) {
    return (
      <Button variant="ghost" onClick={() => setOpen(true)} style={{ fontSize: 12.5, padding: "9px 14px" }}>
        <Truck size={15} aria-hidden="true" />
        {t("addon.shipping-dhl.action.book")}
      </Button>
    );
  }

  const cutoff = publicSettings().collection_cutoff;
  const now = clockText();
  const cheapest = rates === null ? null : cheapestCode(rates);

  // Whether today's van is still catchable. A works booking at 16:00 needs to
  // be told the parcel goes tomorrow BEFORE it books, not after it has printed
  // a label and put the box by the door.
  const limit = parseTime(cutoff);
  const madeTheVan =
    limit !== null && isWorkingDay(PINNED_NOW.iso) && minutesOfDay(PINNED_NOW) < limit;
  const vanDay = day(collectionDay(PINNED_NOW, cutoff));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, inlineSize: "100%", minInlineSize: 0 }}>
      {/* The line that makes the plural obvious: one carrier is a choice the
          shop made, not the way the app works. */}
      <p style={{ margin: 0, fontSize: 13, color: "var(--fg-muted)" }}>
        {t("addon.shipping-dhl.onlyCarrier")} {t("addon.shipping-dhl.connectAnother")}
      </p>

      <Panel>
        <PanelTitle>{t("addon.shipping-dhl.parcel.title")}</PanelTitle>
        <div style={{ fontSize: 12.5, color: "var(--fg-subtle)", marginBlock: "4px 14px" }}>
          {t("addon.shipping-dhl.parcel.sub")}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          <Field
            label={t("addon.shipping-dhl.parcel.contents")}
            hint={t("addon.shipping-dhl.parcel.contentsFrom", {
              ref: job.ref,
              quantity: estimate.from.quantity,
            })}
          >
            <input
              value={contents}
              onChange={(e) => setContents(e.target.value)}
              style={inputStyle}
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
            <Field
              label={t("addon.shipping-dhl.parcel.weight")}
              hint={
                estimate.from.sheets === undefined
                  ? t("addon.shipping-dhl.parcel.weightFromRoll", {
                      kg: estimate.weightKg,
                      quantity: estimate.from.quantity,
                      gsm: estimate.from.gsm,
                    })
                  : t("addon.shipping-dhl.parcel.weightFrom", {
                      kg: estimate.weightKg,
                      sheets: estimate.from.sheets,
                      gsm: estimate.from.gsm,
                      packaging: t(packagingKeyFor(estimate.from.packagingKey)),
                    })
              }
            >
              <span style={{ display: "flex", alignItems: "center", ...inputStyle, padding: 0 }}>
                <input
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  inputMode="decimal"
                  style={{ ...monoInputStyle, border: 0, background: "transparent" }}
                />
                <Mono style={{ fontSize: 11, color: "var(--fg-subtle)", paddingInlineEnd: 11 }}>kg</Mono>
              </span>
            </Field>

            <Field
              label={t("addon.shipping-dhl.parcel.dims")}
              hint={t("addon.shipping-dhl.parcel.dimsFrom", {
                packaging: t(packagingKeyFor(estimate.from.packagingKey)),
              })}
            >
              <span style={{ display: "flex", alignItems: "center", ...inputStyle, padding: 0 }}>
                <input
                  value={dims}
                  onChange={(e) => setDims(e.target.value)}
                  style={{ ...monoInputStyle, border: 0, background: "transparent" }}
                />
                <Mono style={{ fontSize: 11, color: "var(--fg-subtle)", paddingInlineEnd: 11 }}>cm</Mono>
              </span>
            </Field>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--fg-muted)", marginBlockEnd: 6 }}>
              {t("addon.shipping-dhl.parcel.goingTo")}
            </div>
            {unresolved ? (
              <UnresolvedDestination customer={destination.customer} to={to} onChange={setTo} />
            ) : (
              <div
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 11,
                  background: "var(--surface-2)",
                  padding: "11px 13px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                }}
              >
                {[to.name, ...to.lines, to.city, to.postcode, to.country].map((line, i) => (
                  <Mono key={`${line}-${i}`} style={{ fontSize: 12, color: "var(--fg-muted)" }}>
                    {line}
                  </Mono>
                ))}
              </div>
            )}
          </div>
        </div>
      </Panel>

      {failure !== null && (
        <Panel tone="danger">
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 9,
              marginBlockEnd: 10,
            }}
          >
            <CircleX size={18} aria-hidden="true" style={{ color: "var(--danger)" }} />
            <PanelTitle tone="danger">{t("addon.shipping-dhl.error.title")}</PanelTitle>
            {/* D11 — a refusal is a result like any other, and this one was
                written by the demo carrier: no real carrier ever saw this
                address. The rates card that carried the chip is gone by the
                time this one renders, so this card has to say it itself. */}
            {isDemo() && (
              <span style={{ marginInlineStart: "auto" }}>
                <Tag tone="warn">{t("addon.shipping-dhl.error.simulated")}</Tag>
              </span>
            )}
          </div>

          {/* The carrier's own message, verbatim and in quotation marks. It is
              not paraphrased and it is not translated: inventing words the
              carrier did not say is how a works stops trusting the screen. */}
          <div
            style={{
              fontFamily: "var(--font-mono, ui-monospace, monospace)",
              fontSize: 12.5,
              lineHeight: 1.5,
              color: "var(--fg)",
              background: "var(--danger-soft)",
              borderRadius: 10,
              padding: "11px 13px",
              marginBlockEnd: 13,
            }}
          >
            “{failure.carrierMessage}”
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBlockEnd: 14 }}>
            {[
              t("addon.shipping-dhl.error.remedy1", {
                country: to.country,
                example: POSTCODE_HINT[to.country] ?? "—",
              }),
              t("addon.shipping-dhl.error.remedy2"),
            ].map((remedy) => (
              <div key={remedy} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                <CornerDownRight
                  size={15}
                  aria-hidden="true"
                  style={{ color: "var(--fg-subtle)", flex: "0 0 auto", marginBlockStart: 2 }}
                />
                <span style={{ fontSize: 13, lineHeight: 1.5, color: "var(--fg-muted)" }}>{remedy}</span>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
              marginBlockEnd: 14,
            }}
          >
            <Field label={t("addon.shipping-dhl.error.postcode")}>
              <input
                value={to.postcode}
                onChange={(e) => setTo({ ...to, postcode: e.target.value })}
                style={{ ...monoInputStyle, borderColor: "var(--danger)" }}
              />
            </Field>
            <Field label={t("addon.shipping-dhl.error.country")}>
              <input
                value={to.country}
                onChange={(e) => setTo({ ...to, country: e.target.value })}
                style={inputStyle}
              />
            </Field>
          </div>

          <Button
            variant="solid"
            onClick={() => void getRates()}
            disabled={busy || !addressIsUsable(to)}
          >
            <RefreshCw size={15} aria-hidden="true" />
            {t("addon.shipping-dhl.error.retry")}
          </Button>
        </Panel>
      )}

      {rates !== null && booked === null && (
        <Panel>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
            <PanelTitle>{t("addon.shipping-dhl.rates.title")}</PanelTitle>
            {/* D11 — the services, the prices and the delivery dates below are
                all simulated, so the panel that shows them says so. The chip on
                the booked result is not enough: a works reads these numbers,
                picks one and commits before that panel ever renders. */}
            {isDemo() && (
              <span style={{ marginInlineStart: "auto" }}>
                <Tag tone="warn">{t("addon.shipping-dhl.rates.simulated")}</Tag>
              </span>
            )}
          </div>
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
                      border: `1.5px solid ${chosen ? "var(--accent)" : "var(--border-strong)"}`,
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
                        background: chosen ? "var(--accent)" : "transparent",
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
                  {rate.code === cheapest && (
                    <Tag tone="pos">{t("addon.shipping-dhl.rates.cheapest")}</Tag>
                  )}
                  <Mono style={{ fontSize: 14, fontWeight: 700 }}>
                    {money(rate.amount, rate.currency)}
                  </Mono>
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 12,
              marginBlockStart: 14,
            }}
          >
            <Button onClick={() => void book()} disabled={busy}>
              {t("addon.shipping-dhl.rates.book")}
            </Button>
            <span style={{ fontSize: 12.5, color: "var(--fg-muted)" }}>
              {madeTheVan
                ? t("addon.shipping-dhl.rates.cutoffLine", { cutoff, now })
                : t("addon.shipping-dhl.rates.cutoffMissed", { cutoff, now, day: vanDay })}
            </span>
          </div>
        </Panel>
      )}

      {booked !== null && (
        <>
          <Panel tone="pos" style={{ padding: 17 }}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 10,
                marginBlockEnd: 14,
              }}
            >
              <PackageCheck size={19} aria-hidden="true" style={{ color: "var(--pos)" }} />
              <PanelTitle tone="pos">{t("addon.shipping-dhl.booked.title")}</PanelTitle>
              {/* D11 — wherever a real shipment would have been created, the
                  screen says one was not. */}
              {isDemo() && (
                <span style={{ marginInlineStart: "auto" }}>
                  <Tag tone="warn">{t("addon.shipping-dhl.demoChip")}</Tag>
                </span>
              )}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 16,
                alignItems: "start",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11.5, color: "var(--fg-subtle)", marginBlockEnd: 3 }}>
                    {t("addon.shipping-dhl.booked.tracking")}
                  </div>
                  <Mono style={{ fontSize: 19, fontWeight: 700 }}>{booked.shipment.tracking}</Mono>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 18 }}>
                  <div>
                    <div style={{ fontSize: 11.5, color: "var(--fg-subtle)", marginBlockEnd: 3 }}>
                      {t("addon.shipping-dhl.booked.window")}
                    </div>
                    <Mono style={{ fontSize: 12.5, fontWeight: 600 }}>
                      {`${day(booked.shipment.collectionFrom.slice(0, 10))} ${COLLECTION_WINDOW.from}–${COLLECTION_WINDOW.to}`}
                    </Mono>
                  </div>
                  <div>
                    <div style={{ fontSize: 11.5, color: "var(--fg-subtle)", marginBlockEnd: 3 }}>
                      {t("addon.shipping-dhl.booked.service")}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>
                      {serviceName(t, booked.shipment.rate)}
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "var(--surface-2)",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    blockSize: 96,
                    display: "grid",
                    placeItems: "center",
                    background: "var(--surface-3)",
                  }}
                >
                  <FileText size={30} aria-hidden="true" style={{ color: "var(--fg-subtle)" }} />
                  <Mono
                    style={{
                      position: "absolute",
                      insetInlineStart: 10,
                      insetBlockEnd: 8,
                      fontSize: 10,
                      color: "var(--fg-muted)",
                      background: "var(--surface)",
                      padding: "3px 7px",
                      borderRadius: 6,
                    }}
                  >
                    {booked.file.filename}
                  </Mono>
                </div>
                <div style={{ padding: 10, display: "flex", gap: 8 }}>
                  <Button
                    variant="ghost"
                    disabled={labelBytes === undefined}
                    onClick={() => {
                      if (labelBytes === undefined) return;
                      withLabelBlob(labelBytes, (url) => {
                        const anchor = document.createElement("a");
                        anchor.href = url;
                        anchor.download = booked.file.filename;
                        anchor.click();
                      });
                    }}
                    style={{ flex: 1, fontSize: 12.5, padding: 8 }}
                  >
                    <Download size={14} aria-hidden="true" />
                    {t("addon.shipping-dhl.label.download")}
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={labelBytes === undefined}
                    onClick={() => {
                      if (labelBytes === undefined) return;
                      withLabelBlob(labelBytes, (url) => {
                        const frame = document.createElement("iframe");
                        frame.style.display = "none";
                        frame.src = url;
                        frame.onload = () => frame.contentWindow?.print();
                        document.body.appendChild(frame);
                      });
                    }}
                    style={{ flex: 1, fontSize: 12.5, padding: 8 }}
                  >
                    <Printer size={14} aria-hidden="true" />
                    {t("addon.shipping-dhl.label.print")}
                  </Button>
                </div>
              </div>
            </div>
          </Panel>

          <Panel>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
              <PanelTitle>{t("addon.shipping-dhl.tracking.title")}</PanelTitle>
              {/* D11 — scans with places and times read as a parcel that moved.
                  These were seeded from the pinned clock, and the chip on the
                  card above does not reach this one: they are two cards, and a
                  works scrolls to the timeline and screenshots it on its own. */}
              {isDemo() && (
                <span style={{ marginInlineStart: "auto" }}>
                  <Tag tone="warn">{t("addon.shipping-dhl.tracking.simulated")}</Tag>
                </span>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", marginBlockStart: 14 }}>
              {booked.events.map((event, i) => (
                <div key={event.at} style={{ display: "grid", gridTemplateColumns: "16px 1fr", gap: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <span
                      style={{
                        inlineSize: 9,
                        blockSize: 9,
                        borderRadius: 99,
                        background: i === booked.events.length - 1 ? "var(--accent)" : "var(--pos)",
                        marginBlockStart: 5,
                      }}
                    />
                    {i < booked.events.length - 1 && (
                      <span
                        style={{
                          inlineSize: 2,
                          flex: 1,
                          minBlockSize: 14,
                          background: "var(--border-strong)",
                        }}
                      />
                    )}
                  </div>
                  <div style={{ paddingBlockEnd: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{eventText(t, event)}</div>
                    <Mono style={{ fontSize: 11, color: "var(--fg-subtle)", marginBlockStart: 2 }}>
                      {`${day(event.at.slice(0, 10))} · ${event.at.slice(11, 16)} · ${event.place}`}
                    </Mono>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </>
      )}

      {rates === null && booked === null && failure === null && (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
          {/* An empty address cannot be quoted, so it cannot be booked or
              printed either — the button is the gate, not a warning. */}
          <Button
            onClick={() => void getRates()}
            disabled={busy || !addressIsUsable(to)}
            style={{ alignSelf: "flex-start" }}
          >
            <Search size={15} aria-hidden="true" />
            {t("addon.shipping-dhl.rates.get")}
          </Button>
          {!addressIsUsable(to) && (
            <span style={{ fontSize: 12.5, color: "var(--fg-muted)" }}>
              {t("addon.shipping-dhl.dest.needAddress")}
            </span>
          )}
        </div>
      )}

      <NotAffiliated>{t("addon.shipping-dhl.notAffiliated")}</NotAffiliated>
    </div>
  );
}
