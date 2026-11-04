/**
 * "Choose a design" and "Start from blank": the Customiser's editor on the
 * product's base, with the job as the configurator set it up. The editor
 * lays the customer's words, logo and colours out and saves the design; the
 * shop prices the job (the same dry run as the product's page, with the
 * priced features the design uses) and puts the design's code on the
 * basket's job. Opened from a basket job, it changes that job's design.
 */
import { useEffect } from "react";

import { CustomiserEditor, designRefusal } from "../../../vendor/customiser/index.js";
import "../../../vendor/customiser/editor.css";
import "../customiser-look.css";

import { useI18n } from "../../i18n/index.tsx";
import { LARGE_MAX_QTY, optionsOf, sidesOf, SHEET_MAX_QTY, stepsOf } from "../config.ts";
import { EACH, figure } from "../figures.ts";
import { dayShort, money } from "../format.ts";
import { addDesignToBasket, addJobForArtwork, choose, goView, jobFigures, keepHeld, openProduct, productOf, setUsedFeatures, stepFigures, toast, useShop } from "../store.ts";

export function DesignScreen({ blank }: { blank: boolean }) {
  const { t, locale } = useI18n();
  const code = useShop((s) => s.productCode);
  const port = useShop((s) => s.port);
  const catalogue = useShop((s) => s.catalogue);
  const currency = useShop((s) => s.config.currency);
  const choice = useShop((s) => s.choice);
  const quote = useShop((s) => s.jobQuote);
  useShop((s) => s.stepsQuote);
  const editing = useShop((s) => s.editing);
  const basket = useShop((s) => s.basket);
  const refusedLine = useShop((s) => s.refusedLine);
  const email = useShop((s) => s.details.email);
  const product = productOf(code);
  const plain = catalogue !== null && (product === null || product.baseId === null);
  // A product the Customiser does not design: its own page instead.
  useEffect(() => {
    if (plain) openProduct(code);
  }, [plain, code]);
  if (catalogue === null || port === null || product === null || product.baseId === null || choice === null) return null;

  const m = (value: unknown) => money(value, currency, locale);
  const { job, order } = jobFigures();
  const at = editing === null ? -1 : basket.findIndex((b) => b.id === editing);
  const design = at === -1 ? undefined : (basket[at]!.design ?? undefined);
  const refused = refusedLine !== null && refusedLine.index === at ? designRefusal(refusedLine.raw) : null;
  const each = figure(job, EACH);
  const breaks = stepsOf(catalogue, product).map((qty) => {
    const unit = figure(stepFigures(qty), EACH);
    return { qty, label: unit === null ? new Intl.NumberFormat(locale).format(qty) : t("shop.config.qty.each", { price: m(unit) }) };
  });
  const featurePrices = Object.fromEntries(
    optionsOf(catalogue, product.id, "feature")
      .filter((f) => f.featureCode !== null)
      .map((f) => [f.featureCode!, Number(f.price) > 0 ? t("shop.design.featurePrice", { price: m(f.price) }) : t("shop.design.featureIncluded")]),
  );
  const ready = job?.["ready_by"];

  return (
    <section className="mp-screen mp-design" aria-label={t("shop.design.title", { product: product.name })}>
      <CustomiserEditor
        api={port.customiser()}
        base={product.baseId}
        product={{ name: product.name }}
        {...(design === undefined ? {} : { design })}
        shop={catalogue.works.name}
        locale={locale}
        look="print"
        sides={sidesOf(catalogue, choice)}
        price={{
          total: order === null ? "…" : m(order["total"]),
          ...(each === null ? {} : { each: m(each) }),
          ...(typeof ready === "string" && ready !== "" ? { ready: dayShort(ready, locale) } : {}),
          pending: quote?.state === "busy",
        }}
        quantity={{
          value: choice.qty,
          min: 1,
          max: product.kind === "sheet" ? SHEET_MAX_QTY : LARGE_MAX_QTY,
          ...(breaks.length === 0 ? {} : { breaks }),
          onChange: (qty) => choose({ qty }),
        }}
        featurePrices={featurePrices}
        refused={refused}
        email={email.trim() === "" ? null : email.trim()}
        {...(editing === null ? {} : { addLabel: t("shop.design.update") })}
        {...(blank ? { start: "blank" as const } : {})}
        onDesignChange={({ used }) => setUsedFeatures(used)}
        onAddToBasket={(made) => {
          const done = addDesignToBasket(made);
          toast(done === "updated" ? "shop.toast.designUpdated" : "shop.toast.designAdded");
          goView("basket");
        }}
        onSaved={(saved, to) => keepHeld(saved, to)}
        onBack={() => openProduct(product.code, "product", editing)}
        onStartBlank={() => openProduct(product.code, "blank", editing)}
        onSendOwnFile={() => addJobForArtwork()}
        onChangeSides={() => openProduct(product.code, "product", editing)}
      />
    </section>
  );
}
