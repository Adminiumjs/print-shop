/**
 * Your proofs: every proof the works has sent the customer, job by job,
 * with what was answered and when, and the one waiting answered here. Read
 * through the customer's own sign-in, or the order a link opened.
 */
import { CalendarCheck } from "lucide-react";

import { useI18n, type MessageKey } from "../../i18n/index.tsx";
import { signedIn, useAfter } from "../after.ts";
import { jobView, type JobView } from "../after-view.ts";
import { ProductIcon, tintOf } from "../parts.tsx";
import { useShop } from "../store.ts";
import { Gate, SessionBar } from "./Gate.tsx";
import { ProofCard, useDay } from "./Order.tsx";

/** The jobs with a proof, from whichever session reads them: newest order first. */
function proofJobs(): JobView[] {
  const s = useAfter.getState();
  const catalogue = useShop.getState().catalogue;
  if (catalogue === null) return [];
  const out: JobView[] = [];
  if (signedIn() && s.mine.rows !== null) {
    for (const order of s.mine.orders) {
      for (const job of s.mine.rows.jobs.filter((j) => String(j["order_id"]) === String(order["id"]))) out.push(jobView(catalogue, order, job, s.mine.rows.proofs, s.mine.rows.artwork));
    }
  } else if (s.opened?.via === "link" && s.opened.read !== null) {
    const read = s.opened.read;
    for (const job of read.jobs) out.push(jobView(catalogue, read.order, job, read.proofs, read.artwork));
  }
  return out.filter((j) => j.latest !== null && !j.cancelled);
}

const STATUS: Record<"sent" | "approved" | "change_asked", { key: MessageKey; tone: string }> = {
  sent: { key: "after.proofs.waiting", tone: "info" },
  approved: { key: "after.proofs.approved", tone: "pos" },
  change_asked: { key: "after.proofs.changing", tone: "warn" },
};

export function ProofsScreen() {
  const { t } = useI18n();
  useAfter((s) => s.mine);
  useAfter((s) => s.opened);
  useShop((s) => s.catalogue);
  const day = useDay();
  const open = signedIn() || useAfter.getState().opened?.via === "link";
  if (!open)
    return (
      <>
        <SessionBar />
        <Gate view="proofs" />
      </>
    );
  const jobs = proofJobs();
  return (
    <>
      <SessionBar />
      <section className="mp-screen ma-page" aria-labelledby="ma-proofs-title">
        <h1 id="ma-proofs-title" className="mp-h1">
          {t("after.proofs.title")}
        </h1>
        <p className="mp-lede">{t("after.proofs.lede")}</p>
        {jobs.length === 0 && <div className="ma-empty">{t("after.proofs.empty")}</div>}
        <ul className="ma-list">
          {jobs.map((job) => {
            const latest = job.latest!;
            const status = STATUS[latest.state === "superseded" ? "sent" : latest.state];
            const history = job.proofs.flatMap((p) => [
              ...(p.sentAt === null ? [] : [{ key: `${p.id}-s`, label: t("after.proofs.hist.sent"), at: p.sentAt, tone: "info" }]),
              ...(p.answeredAt !== null && p.state === "change_asked" ? [{ key: `${p.id}-c`, label: t("after.proofs.hist.change"), at: p.answeredAt, tone: "warn" }] : []),
              ...(p.answeredAt !== null && p.state === "approved" ? [{ key: `${p.id}-a`, label: t("after.proofs.hist.approved"), at: p.answeredAt, tone: "pos" }] : []),
            ]);
            return (
              <li key={job.id} className="mp-card ma-proof-item">
                <div className="ma-item-head">
                  <span className={`ma-item-icon ${tintOf(job.family)}`}>
                    <ProductIcon name={job.icon} size={21} />
                  </span>
                  <div className="ma-grow">
                    <div className="ma-item-name">
                      <span className="ma-strong">{job.name}</span>
                      <span className="mp-mono ma-ref">{job.orderNumber}</span>
                    </div>
                    <div className="ma-muted">{job.spec}</div>
                  </div>
                  <span className={`ma-pill ma-pill--${status.tone}`}>{t(status.key)}</span>
                </div>
                <ul className="ma-history" aria-label={t("after.proofs.history")}>
                  {history.map((h) => (
                    <li key={h.key}>
                      <span className={`ma-dot ma-dot--${h.tone}`} aria-hidden="true" />
                      {h.label}
                      <span className="mp-mono ma-faint">{day.short(h.at)}</span>
                    </li>
                  ))}
                </ul>
                {job.readyBy !== null && (
                  <p className="ma-ready-line">
                    <CalendarCheck size={15} aria-hidden="true" />
                    {t("after.order.readyBy", { date: day.full(job.readyBy) })}
                  </p>
                )}
                {job.waiting !== null && <ProofCard job={job} proof={job.waiting} compact />}
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
