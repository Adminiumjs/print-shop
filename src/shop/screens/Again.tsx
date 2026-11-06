/**
 * Order it again: the customer's past jobs, each set up again on its
 * product's page exactly as it went to press, and each priced afresh on
 * today's rate card (a dry run of the job as its own order, the way it went).
 */
import { RotateCcw } from "lucide-react";
import { useEffect } from "react";

import { useI18n } from "../../i18n/index.tsx";
import { againJobs, reorder, repriceAgain, signedIn, useAfter } from "../after.ts";
import { specOf } from "../after-view.ts";
import { money } from "../format.ts";
import { ProductIcon, tintOf } from "../parts.tsx";
import { productById, useShop } from "../store.ts";
import type { Id } from "../port.ts";
import { Gate, SessionBar } from "./Gate.tsx";
import { useDay } from "./Order.tsx";

export function AgainScreen() {
  const { t, locale } = useI18n();
  const mine = useAfter((s) => s.mine);
  const opened = useAfter((s) => s.opened);
  const reprices = useAfter((s) => s.reprices);
  const catalogue = useShop((s) => s.catalogue);
  const currency = useShop((s) => s.config.currency);
  const day = useDay();
  const open = signedIn() || opened?.via === "link";
  useEffect(() => {
    if (open && catalogue !== null) void repriceAgain();
  }, [open, catalogue, mine, opened]);
  if (!open || catalogue === null)
    return (
      <>
        <SessionBar />
        <Gate view="reorder" />
      </>
    );
  const jobs = againJobs();
  return (
    <>
      <SessionBar />
      <section className="mp-screen ma-page" aria-labelledby="ma-again-title">
        <h1 id="ma-again-title" className="mp-h1">
          {t("after.again.title")}
        </h1>
        <p className="mp-lede">{t("after.again.lede")}</p>
        {jobs.length === 0 && <div className="ma-empty">{t("after.again.empty")}</div>}
        <ul className="ma-list">
          {jobs.map(({ job, order }) => {
            const id = String(job["id"]);
            const product = productById(job["product_id"] as Id)!;
            const priced = reprices[id];
            const ref = String(order["number"] ?? "");
            return (
              <li key={id} className="mp-card ma-again">
                <span className={`ma-item-icon ma-item-icon--big ${tintOf(product.family)}`}>
                  <ProductIcon name={product.icon} size={22} />
                </span>
                <div className="ma-grow">
                  <div className="ma-item-name">
                    <span className="ma-strong">{String(job["product_name"] ?? product.name)}</span>
                    <span className="mp-mono ma-ref">{ref}</span>
                  </div>
                  <div className="ma-muted">
                    {specOf(catalogue, job)} · {t("after.again.printed", { qty: new Intl.NumberFormat(locale).format(Number(job["qty"] ?? 1)) })}
                  </div>
                  <div className="ma-faint">{t("after.again.when", { date: day.short(String(order["placed_at"] ?? "")) })}</div>
                </div>
                <div className="ma-again-side">
                  {priced?.state === "busy" || priced === undefined ? (
                    <div className="mp-skel ma-skel-price" role="status" aria-label={t("after.again.working")} />
                  ) : priced.state === "ok" ? (
                    <div className="mp-mono ma-total">{money(priced.total, currency, locale)}</div>
                  ) : (
                    <div className="ma-faint">{t("after.again.notPriced")}</div>
                  )}
                  <div className="ma-tiny">{t("after.again.today")}</div>
                  <button type="button" className="mp-button mp-button--accent mp-button--small" onClick={() => reorder(job, ref)}>
                    <RotateCcw size={14} aria-hidden="true" />
                    {t("after.again.cta")}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
