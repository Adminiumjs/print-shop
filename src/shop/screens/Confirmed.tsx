/**
 * "That's booked in.": the order as Adminium wrote it — its `MP-` number,
 * its total and its ready-by — and what happens next. The confirmation
 * e-mail carries the order's own link; this page holds a session on it
 * already, so "Follow this order" opens it with no code.
 */
import { Check, Truck } from "lucide-react";

import { useI18n } from "../../i18n/index.tsx";
import { dayFull, money } from "../format.ts";
import { goView, useShop } from "../store.ts";

export function ConfirmedScreen() {
  const { t, locale } = useI18n();
  const confirmed = useShop((s) => s.confirmed);
  const currency = useShop((s) => s.config.currency);
  if (confirmed === null) return null;
  const order = confirmed.order;
  const ready = order["ready_by"];
  const toQuote = Number(order["delivery_to_quote"] ?? 0) === 1;
  const follow = () => {
    goView("order");
    if (confirmed.token !== null) window.location.hash = confirmed.token;
  };
  const steps = [
    { title: t("shop.confirmed.step1"), body: t("shop.confirmed.step1Body") },
    { title: t("shop.confirmed.step2"), body: t("shop.confirmed.step2Body") },
    { title: t("shop.confirmed.step3"), body: t("shop.confirmed.step3Body") },
  ];
  return (
    <section className="mp-screen mp-confirmed" aria-labelledby="mp-confirmed-title">
      <span className="mp-confirmed-mark">
        <Check size={38} aria-hidden="true" />
      </span>
      <h1 id="mp-confirmed-title" className="mp-h1">
        {t("shop.confirmed.title")}
      </h1>
      <p>{t("shop.confirmed.body")}</p>
      <dl className="mp-ref-box">
        <div className="mp-ref-part">
          <dt className="mp-sr">{t("shop.confirmed.ref")}</dt>
          <dd className="mp-ref">{String(order["number"] ?? "")}</dd>
        </div>
        <span className="mp-ref-rule" aria-hidden="true" />
        <div className="mp-ref-part">
          <dt>{t("shop.quote.total")}</dt>
          <dd className="mp-mono">{money(order["total"], currency, locale)}</dd>
        </div>
        {typeof ready === "string" && ready !== "" && (
          <>
            <span className="mp-ref-rule" aria-hidden="true" />
            <div className="mp-ref-part">
              <dt>{t("shop.confirmed.readyBy")}</dt>
              <dd className="mp-mono">{dayFull(ready, locale)}</dd>
            </div>
          </>
        )}
      </dl>
      <div className="mp-next">
        <h2 className="mp-next-title">{t("shop.confirmed.next")}</h2>
        <ol>
          {steps.map((step, i) => (
            <li key={step.title}>
              <span className="mp-next-n" aria-hidden="true">
                {i + 1}
              </span>
              <div>
                <div className="mp-next-head">{step.title}</div>
                <div className="mp-next-body">{step.body}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
      {toQuote && (
        <p className="mp-confirmed-quote">
          <Truck size={15} aria-hidden="true" />
          {t("shop.basket.deliveryQuote")}
        </p>
      )}
      <p className="mp-confirmed-after">{t("shop.confirmed.after")}</p>
      <div className="mp-confirmed-actions">
        <button type="button" className="mp-button mp-button--accent" onClick={follow}>
          {t("shop.confirmed.follow")}
        </button>
        <button type="button" className="mp-button" onClick={() => goView("products")}>
          {t("shop.confirmed.back")}
        </button>
      </div>
    </section>
  );
}
