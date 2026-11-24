/**
 * SHIP FROM and the carrier in use. Adminium keeps both per install and asks
 * for the right to manage shipping, so this screen is gated by its answer and
 * never by a role's name. A half-filled address saves: a missing field stops a
 * quote, not a save. The works' country is also what a new order starts from.
 */
import { useEffect, useMemo, useRef, useState, type ComponentType, type FormEvent, type KeyboardEvent } from "react";

import { countriesPanelOf, customsPanelOf } from "../../add-ons/connected.ts";
import type { EngineCarrier } from "../../add-ons/vendor/host/engine-carrier.ts";
import { countryPriceStore, type CountryPriceStore } from "../countryPrices.ts";
import { useData, useEnv, useRun } from "../env.tsx";
import { worksAddress } from "../outbound.ts";
import { carrierClient, chooseCarrier, COUNTRIES, countryName, readShipping, shippingReady, saveShipFrom, ShippingRefused, type ShipFromValues, type ShippingStatus } from "../shipping.ts";
import { toast, useWorks } from "../store.ts";
import { text } from "../wire.ts";
import { useI18n, useT, type MessageKey } from "../../i18n/index.tsx";

type Field = "name" | "line1" | "line2" | "city" | "postcode" | "country" | "phone" | "email";
const FIELDS: { field: Field; label: MessageKey; type?: string; auto: string }[] = [
  { field: "name", label: "works.shipFrom.name", auto: "organization" },
  { field: "line1", label: "works.shipFrom.street", auto: "address-line1" },
  { field: "line2", label: "works.shipFrom.street2", auto: "address-line2" },
  { field: "city", label: "works.shipFrom.town", auto: "address-level2" },
  { field: "postcode", label: "works.shipFrom.postcode", auto: "postal-code" },
  { field: "phone", label: "works.shipFrom.phone", type: "tel", auto: "tel" },
  { field: "email", label: "works.shipFrom.email", type: "email", auto: "email" },
];

type CountriesPanel = ComponentType<{ client: EngineCarrier; prices: CountryPriceStore; currency: string; onOpenCustoms?: () => void }>;
type CustomsPanel = ComponentType<{ client: EngineCarrier }>;

const TABS = ["from", "countries", "customs"] as const;
type Tab = (typeof TABS)[number];
const TAB_WORDS: Record<Tab, MessageKey> = { from: "works.shipFrom.tabFrom", countries: "works.shipFrom.tabCountries", customs: "works.shipFrom.tabCustoms" };

export function ShipFromScreen() {
  const t = useT();
  const { locale } = useI18n();
  const data = useData();
  const { door } = useEnv();
  const { busy, run } = useRun();
  const [status, setStatus] = useState<ShippingStatus | null>(null);
  const [refused, setRefused] = useState(false);
  const [form, setForm] = useState<Record<Field, string> | null>(null);
  const [pick, setPick] = useState("");
  const [tab, setTab] = useState<Tab>("from");
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});
  const facts = door.facts();
  const client = carrierClient(facts.carrier);
  const Countries = facts.carrier === null ? null : (countriesPanelOf(facts.carrier.key) as CountriesPanel | null);
  const Customs = facts.carrier === null ? null : (customsPanelOf(facts.carrier.key) as CustomsPanel | null);
  const prices = useMemo(() => countryPriceStore(door, client), [door, client]);

  // On a page opened at this address the add-ons are still loading: asking now would read as "not yours".
  const registry = useWorks((s) => s.registry);
  const ready = shippingReady() || registry !== null;

  useEffect(() => {
    if (!ready) return undefined;
    let live = true;
    readShipping().then(
      (read) => {
        if (!live) return;
        setStatus(read);
        setPick(read.activeCarrier ?? "");
        const saved = read.shipFrom;
        const home = text(data.settings?.["home_country"]) ?? "";
        const guess = worksAddress(data.settings, home);
        setForm({
          name: saved?.name ?? guess.name,
          line1: saved?.lines?.[0] ?? guess.lines[0] ?? "",
          line2: saved?.lines?.[1] ?? guess.lines[1] ?? "",
          city: saved?.city ?? guess.city,
          postcode: saved?.postcode ?? guess.postcode,
          country: saved?.country ?? home,
          phone: saved?.phone ?? text(data.settings?.["phone"]) ?? "",
          email: saved?.email ?? text(data.settings?.["email"]) ?? "",
        });
      },
      () => {
        if (live) setRefused(true);
      },
    );
    return () => {
      live = false;
    };
    // Read once for the screen: a reload of the works' rows must not overwrite what is being typed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  if (refused) {
    return (
      <section className="wk-screen wk-narrow">
        <h1 className="wk-h1">{t("works.shipFrom.title")}</h1>
        <div className="wk-empty">
          <div className="wk-empty-body">{t("works.shipFrom.notYours")}</div>
        </div>
      </section>
    );
  }
  if (status === null || form === null) return <div className="wk-muted" role="status">{t("works.loading")}</div>;

  const set = (field: Field, value: string) => setForm({ ...form, [field]: value });
  const options = form.country !== "" && !COUNTRIES.includes(form.country) ? [form.country, ...COUNTRIES] : COUNTRIES;

  const save = (event: FormEvent) => {
    event.preventDefault();
    const lines = [form.line1, form.line2].map((l) => l.trim()).filter((l) => l !== "");
    const values: ShipFromValues = { name: form.name, lines, city: form.city, postcode: form.postcode, country: form.country, phone: form.phone, email: form.email };
    void run(async (d, fresh) => {
      setStatus(await saveShipFrom(values));
      const settings = fresh.settings;
      if (settings !== null && form.country !== "" && text(settings["home_country"]) !== form.country && door.who().can("settings", "update")) {
        await d.updateSettings(settings, { home_country: form.country });
      }
      return t("works.shipFrom.saved");
    });
  };

  const useCarrier = () => {
    const name = status.carriers.find((c) => c.key === pick)?.name ?? pick;
    void chooseCarrier(pick).then(
      (next) => {
        setStatus(next);
        toast(t("works.shipFrom.carrierSaved", { carrier: name }), "pos");
      },
      (error: unknown) => toast(t(error instanceof ShippingRefused && error.status === 403 ? "works.shipFrom.notYours" : "works.shipFrom.carrierRefused"), "danger"),
    );
  };

  const openTab = (next: Tab) => {
    setTab(next);
    tabRefs.current[next]?.focus();
  };
  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    const at = TABS.indexOf(tab);
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const forward = rtl ? "ArrowLeft" : "ArrowRight";
    const back = rtl ? "ArrowRight" : "ArrowLeft";
    const to = event.key === forward ? TABS[(at + 1) % TABS.length] : event.key === back ? TABS[(at + TABS.length - 1) % TABS.length] : event.key === "Home" ? TABS[0] : event.key === "End" ? TABS[TABS.length - 1] : undefined;
    if (to === undefined) return;
    event.preventDefault();
    openTab(to);
  };

  return (
    <section className={`wk-screen ${tab === "from" ? "wk-narrow" : "wk-shipping-wide"}`} aria-labelledby="wk-shipfrom-title">
      <h1 className="wk-h1" id="wk-shipfrom-title">
        {t("works.shipFrom.title")}
      </h1>
      <p className="wk-lede">{t("works.shipFrom.lede")}</p>

      <div role="tablist" aria-label={t("works.shipFrom.tabs")} className="wk-tabs">
        {TABS.map((one) => (
          <button
            key={one}
            ref={(el) => {
              tabRefs.current[one] = el;
            }}
            type="button"
            role="tab"
            id={`wk-shipping-tab-${one}`}
            aria-selected={tab === one}
            aria-controls={`wk-shipping-panel-${one}`}
            tabIndex={tab === one ? 0 : -1}
            className="wk-tab"
            onClick={() => setTab(one)}
            onKeyDown={onTabKey}
          >
            {t(TAB_WORDS[one])}
          </button>
        ))}
      </div>

      {tab !== "from" && (
        <div role="tabpanel" id={`wk-shipping-panel-${tab}`} aria-labelledby={`wk-shipping-tab-${tab}`} className="wk-tabpanel">
          {client === null || Countries === null || Customs === null ? (
            <p className="wk-panel wk-muted">{t("works.shipFrom.abroadOff")}</p>
          ) : tab === "countries" ? (
            <Countries client={client} prices={prices} currency={facts.currency} onOpenCustoms={() => openTab("customs")} />
          ) : (
            <Customs client={client} />
          )}
        </div>
      )}

      {tab === "from" && (
        <div role="tabpanel" id="wk-shipping-panel-from" aria-labelledby="wk-shipping-tab-from" className="wk-tabpanel">
      <div className="wk-panel">
        <h2 className="wk-panel-head wk-panel-head--small">{t("works.shipFrom.carrier")}</h2>
        {status.carriers.length === 0 ? (
          <p className="wk-muted">{t("works.shipFrom.noCarrier")}</p>
        ) : (
          <div className="wk-action-row">
            <label className="wk-field">
              <span className="wk-field-label">{t("works.shipFrom.carrier")}</span>
              <select className="wk-input" value={pick} onChange={(e) => setPick(e.target.value)}>
                {status.activeCarrier === null && <option value="">{t("works.shipFrom.pick")}</option>}
                {status.carriers.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="wk-btn" disabled={pick === "" || pick === status.activeCarrier} onClick={useCarrier}>
              {t("works.shipFrom.useCarrier")}
            </button>
          </div>
        )}
      </div>

      <form className="wk-panel" onSubmit={save}>
        {FIELDS.map(({ field, label, type, auto }) => (
          <label key={field} className="wk-field">
            <span className="wk-field-label">{t(label)}</span>
            <input className="wk-input" type={type ?? "text"} autoComplete={auto} value={form[field]} aria-describedby={field === "phone" && form.phone.trim() === "" ? "wk-phone-note" : undefined} onChange={(e) => set(field, e.target.value)} />
            {field === "phone" && form.phone.trim() === "" && (
              <span className="wk-field-hint" id="wk-phone-note">
                {t("works.shipFrom.phoneNote")}
              </span>
            )}
          </label>
        ))}
        <label className="wk-field">
          <span className="wk-field-label">{t("works.shipFrom.country")}</span>
          <select className="wk-input" value={form.country} onChange={(e) => set("country", e.target.value)}>
            <option value="">—</option>
            {options.map((code) => (
              <option key={code} value={code}>
                {countryName(code, locale)}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="wk-action wk-action--primary" disabled={busy}>
          {t("works.shipFrom.save")}
        </button>
      </form>
        </div>
      )}
    </section>
  );
}
