/**
 * The footer's pages: Templates & sizes (the works' template files, shipped
 * beside the shop's pages, and each product's sizes from its rows),
 * Delivery & collection (the bands from the rate card, the working week and
 * the cut-off from the app's settings, the turnaround from the works'
 * settings row) and Find us (the settings row). Every figure on them is a
 * row's; nothing is typed here that the works keeps.
 */
import { CalendarCheck, CircleCheck, Clock, Download, Image, MapPin, Palette, Phone, ScanLine, SquareDashed, Store, Truck, Type, type LucideIcon } from "lucide-react";

import { useI18n, type MessageKey } from "../../i18n/index.tsx";
import { downloadedTemplate, templateFile, templateHref, useAfter } from "../after.ts";
import { optionsOf } from "../config.ts";
import { decimal, money } from "../format.ts";
import { ProductIcon, tintOf } from "../parts.tsx";
import type { Catalogue, Product } from "../port.ts";
import { mountBase } from "../route.ts";
import { useShop } from "../store.ts";

// ── templates & sizes ──────────────────────────────────────────────────────

const SPECS: { icon: LucideIcon; key: MessageKey }[] = [
  { icon: ScanLine, key: "after.templates.spec.bleed" },
  { icon: SquareDashed, key: "after.templates.spec.safe" },
  { icon: Palette, key: "after.templates.spec.cmyk" },
  { icon: Type, key: "after.templates.spec.fonts" },
  { icon: Image, key: "after.templates.spec.dpi" },
];

/** The widest a product's roll stocks print across, in millimetres. */
function rollWidth(catalogue: Catalogue, product: Product): number | null {
  const widths = optionsOf(catalogue, product.id, "material")
    .map((o) => catalogue.materials.find((m) => String(m.id) === String(o.materialId))?.rollWidth ?? null)
    .filter((w): w is number => w !== null);
  return widths.length === 0 ? null : Math.max(...widths);
}

export function TemplatesScreen() {
  const { t, locale } = useI18n();
  const catalogue = useShop((s) => s.catalogue);
  const states = useAfter((s) => s.templates);
  if (catalogue === null) return null;
  const n = (v: number) => new Intl.NumberFormat(locale).format(v);
  return (
    <section className="mp-screen ma-page ma-page--wide" aria-labelledby="ma-templates-title">
      <h1 id="ma-templates-title" className="mp-h1">
        {t("after.templates.title")}
      </h1>
      <p className="mp-lede">{t("after.templates.lede")}</p>
      <ul className="ma-specs">
        {SPECS.map(({ icon: Icon, key }) => (
          <li key={key} className="ma-spec">
            <Icon size={14} aria-hidden="true" />
            {t(key, { dpi: catalogue.works.minDpi })}
          </li>
        ))}
      </ul>
      <ul className="ma-templates">
        {catalogue.products.map((product) => {
          const sizes = optionsOf(catalogue, product.id, "size")
            .map((o) => ({ option: o, size: catalogue.sizes.find((s) => String(s.id) === String(o.sizeId)) }))
            .filter((z) => z.size !== undefined);
          const state = states[product.code];
          const roll = rollWidth(catalogue, product);
          return (
            <li key={product.code} className="mp-card ma-template">
              <div className="ma-item-head">
                <span className={`ma-item-icon ma-item-icon--small ${tintOf(product.family)}`}>
                  <ProductIcon name={product.icon} size={19} />
                </span>
                <h2 className="ma-template-name">{product.name}</h2>
              </div>
              {sizes.length > 0 ? (
                <dl className="ma-sizes">
                  {sizes.map(({ option, size }) => (
                    <div key={String(option.id)} className="ma-size">
                      <dt>
                        {size!.name} · <span className="mp-mono">{t("shop.mm2", { w: n(size!.width), h: n(size!.height) })}</span>
                      </dt>
                      <dd className="mp-mono">{size!.direct || size!.up === null ? t("after.templates.direct") : t("after.templates.up", { up: n(size!.up) })}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="ma-muted">{roll === null ? t("after.templates.ownSize") : t("after.templates.lfNote", { mm: n(roll) })}</p>
              )}
              <div className="ma-template-foot">
                {state === undefined ? (
                  <a className="mp-button mp-button--small" href={templateHref(product.code, mountBase())} download={templateFile(product.code)} aria-label={t("after.templates.downloadAria", { product: product.name })} onClick={() => downloadedTemplate(product.code)}>
                    <Download size={14} aria-hidden="true" />
                    {t("after.templates.download")}
                  </a>
                ) : (
                  <>
                    <span role="status" className="ma-downloaded">
                      <CircleCheck size={15} aria-hidden="true" />
                      {t("after.templates.done")}
                    </span>
                    <span className="mp-mono ma-faint">{templateFile(product.code)}</span>
                    <a className="mp-link ma-small-link" href={templateHref(product.code, mountBase())} download={templateFile(product.code)}>
                      {t("after.templates.again")}
                    </a>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ── delivery & collection ──────────────────────────────────────────────────

const WEEK = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

/** The works' week, as the app's setting writes it ("mon,tue,wed,thu,fri"), in the reader's words: "Monday to Friday". */
export function weekWords(setting: unknown, locale: string, range: (from: string, to: string) => string): string | null {
  if (typeof setting !== "string") return null;
  const days = setting
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter((d): d is (typeof WEEK)[number] => (WEEK as readonly string[]).includes(d));
  if (days.length === 0) return null;
  // 5 January 2026 was a Monday.
  const name = (d: (typeof WEEK)[number]) => new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2026, 0, 5 + WEEK.indexOf(d))));
  const idx = days.map((d) => WEEK.indexOf(d)).sort((a, b) => a - b);
  const run = idx.every((v, i) => i === 0 || v === idx[i - 1]! + 1);
  if (run && idx.length > 2) return range(name(WEEK[idx[0]!]!), name(WEEK[idx.at(-1)!]!));
  return new Intl.ListFormat(locale, { type: "conjunction" }).format(idx.map((i) => name(WEEK[i]!)));
}

/** A 24-hour time from the app's setting ("14:00"), in the reader's way of writing a time. */
export function timeWords(setting: unknown, locale: string): string | null {
  if (typeof setting !== "string" || !/^\d{1,2}:\d{2}$/.test(setting)) return null;
  const [h, m] = setting.split(":").map(Number) as [number, number];
  return new Intl.DateTimeFormat(locale === "en-US" ? "en-GB" : locale, { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(new Date(Date.UTC(2026, 0, 5, h, m)));
}

/** What the sample's bands usually carry, by their codes: a band the works adds has none. */
const BAND_NOTES: Record<string, MessageKey> = {
  light: "after.delivery.note.light",
  mid: "after.delivery.note.mid",
  heavy: "after.delivery.note.heavy",
  tube: "after.delivery.note.tube",
};

export function DeliveryScreen() {
  const { t, locale } = useI18n();
  const catalogue = useShop((s) => s.catalogue);
  const port = useShop((s) => s.port);
  const currency = useShop((s) => s.config.currency);
  if (catalogue === null) return null;
  const works = catalogue.works;
  const settings = port?.settings() ?? {};
  const week = weekWords(settings["working_days"], locale, (from, to) => t("after.delivery.range", { from, to })) ?? t("after.delivery.workingDays");
  const cutoff = timeWords(settings["cutoff"], locale);
  const tops = catalogue.bands.filter((b) => !b.tube && b.maxKg !== null).map((b) => Number(b.maxKg));
  const top = tops.length === 0 ? null : Math.max(...tops);
  return (
    <section className="mp-screen ma-page" aria-labelledby="ma-delivery-title">
      <h1 id="ma-delivery-title" className="mp-h1">
        {t("after.delivery.pageTitle")}
      </h1>
      <p className="mp-lede">{t("after.delivery.lede", { week })}</p>
      <div className="ma-two">
        <div className="mp-card ma-way">
          <span className="ma-way-icon">
            <Store size={20} aria-hidden="true" />
          </span>
          <h2 className="ma-way-title">{t("after.delivery.collectTitle")}</h2>
          <p className="ma-muted">{t("after.delivery.collectBody", { hours: works.hours ?? week })}</p>
        </div>
        <div className="mp-card ma-way">
          <span className="ma-way-icon ma-way-icon--accent">
            <Truck size={20} aria-hidden="true" />
          </span>
          <h2 className="ma-way-title">{t("after.delivery.courierTitle")}</h2>
          <p className="ma-muted">{t("after.delivery.courierBody")}</p>
        </div>
      </div>
      <dl className="mp-card ma-bands">
        {catalogue.bands.map((band) => (
          <div key={String(band.id)} className="ma-band">
            <dt>
              <span className="ma-strong">{band.name}</span>
              {BAND_NOTES[band.code] !== undefined && <span className="ma-faint ma-band-note">{t(BAND_NOTES[band.code]!)}</span>}
            </dt>
            <dd className="mp-mono ma-band-price">{money(band.price, currency, locale)}</dd>
          </div>
        ))}
        {top !== null && (
          <div className="ma-band">
            <dt>
              <span className="ma-strong">{t("after.delivery.over", { kg: decimal(top, locale) })}</span>
              <span className="ma-faint ma-band-note">{t("after.delivery.overNote")}</span>
            </dt>
            <dd className="mp-mono ma-band-price">{t("after.delivery.weQuote")}</dd>
          </div>
        )}
      </dl>
      <div className="ma-facts">
        {cutoff !== null && (
          <p className="ma-fact">
            <Clock size={19} aria-hidden="true" className="ma-accent" />
            <span>
              <strong>{t("after.delivery.cutoffTitle", { time: cutoff })}</strong> {t("after.delivery.cutoffBody", { time: cutoff })}
            </span>
          </p>
        )}
        <p className="ma-fact">
          <CalendarCheck size={19} aria-hidden="true" className="ma-accent" />
          <span>
            <strong>{t("after.delivery.turnTitle")}</strong> {t("after.delivery.standard", undefined, works.standardDays ?? 3)} {t("after.delivery.express", { pct: decimal(works.expressPercent ?? "0", locale) }, works.expressDays ?? 1)}{" "}
            {t("after.delivery.proof", { price: money(works.proofPostPrice ?? "0", currency, locale) }, works.proofPostDays ?? 2)} {t("after.delivery.change", undefined, works.changeDays ?? 1)} {t("after.delivery.seeIt")}
          </span>
        </p>
      </div>
    </section>
  );
}

// ── find us ────────────────────────────────────────────────────────────────

export function FindUsScreen() {
  const { t } = useI18n();
  const works = useShop((s) => s.catalogue?.works ?? null);
  if (works === null) return null;
  const cards: { icon: LucideIcon; title: MessageKey; body: string | null }[] = [
    { icon: MapPin, title: "after.find.where", body: works.address === null ? null : works.address.replace(/,\s*/g, "\n") },
    { icon: Clock, title: "after.find.when", body: works.hours },
    { icon: Phone, title: "after.find.talk", body: [works.phone, works.email].filter((v): v is string => v !== null).join("\n") || null },
  ];
  return (
    <section className="mp-screen ma-page" aria-labelledby="ma-find-title">
      <h1 id="ma-find-title" className="mp-h1">
        {t("chrome.nav.findus")}
      </h1>
      <p className="mp-lede">{works.about ?? t("after.find.lede")}</p>
      <ul className="ma-find">
        {cards
          .filter((c) => c.body !== null)
          .map(({ icon: Icon, title, body }) => (
            <li key={title} className="mp-card ma-find-card">
              <span className="ma-icon">
                <Icon size={17} aria-hidden="true" />
              </span>
              <h2 className="ma-find-title">{t(title)}</h2>
              <p className="ma-find-body">{body}</p>
            </li>
          ))}
      </ul>
      <div className="ma-map" aria-hidden="true">
        <MapPin size={38} />
        {works.address !== null && <span className="mp-mono ma-map-chip">{works.address}</span>}
      </div>
    </section>
  );
}
