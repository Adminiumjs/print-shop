/**
 * Follow your order: found by a reference and the e-mail with the code
 * Adminium sends, or opened straight by the link its e-mails carry. Each
 * job's stages, dated by the stamps Adminium wrote; the proof waiting,
 * opened as the works sent it, approved or a change asked for through the
 * customer's own session; the works' delivery quote, accepted or collected
 * instead; the files sent and what their checks said; how it leaves.
 */
import { Check, CircleAlert, CircleCheckBig, CircleX, FileText, FolderHeart, Link2, MailCheck, MessageSquareText, PenTool, Store, TriangleAlert, Truck } from "lucide-react";
import { useEffect } from "react";

import { useI18n, type MessageKey } from "../../i18n/index.tsx";
import { answerDelivery, answerProof, followAnother, openCodes, openMine, openOrderLink, openProof, readLinked, signedIn, typeChange, useAfter } from "../after.ts";
import { jobViews, leavingOf, type JobView, type ProofView, type StageKey } from "../after-view.ts";
import { dayFull, dayShort, money } from "../format.ts";
import { tintOf } from "../parts.tsx";
import { goView, useShop } from "../store.ts";
import { Gate, SessionBar } from "./Gate.tsx";

const STAGE_LABELS: Record<StageKey, MessageKey> = {
  received: "after.stage.received",
  checked: "after.stage.checked",
  proofSent: "after.stage.proofSent",
  approved: "after.stage.approved",
  printing: "after.stage.printing",
  finishing: "after.stage.finishing",
  ready: "after.stage.ready",
};

/** A moment's day on the works' own calendar, as `YYYY-MM-DD`. */
export function dayIn(moment: Date, zone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(moment);
  } catch {
    return moment.toISOString().slice(0, 10);
  }
}

/** A stored day, or a stored moment read on the works' calendar: short ("Tue 4 Aug") or in full. */
export function useDay(): { short: (value: string | null) => string; full: (value: string | null) => string } {
  const { locale } = useI18n();
  const zone = useShop((s) => s.config.timezone);
  const day = (value: string) => (/^\d{4}-\d{2}-\d{2}$/.test(value) ? value : dayIn(new Date(value), zone));
  return { short: (value) => (value === null ? "" : dayShort(day(value), locale)), full: (value) => (value === null ? "" : dayFull(day(value), locale)) };
}

/** The order's own link from the address bar (`/order#<code>`), taken off it once read. */
export function linkInAddress(): string | null {
  const token = window.location.hash.replace(/^#/, "").split("&")[0] ?? "";
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(token)) return null;
  window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}`);
  return token;
}

export function OrderScreen() {
  const { t } = useI18n();
  const opened = useAfter((s) => s.opened);
  const link = useAfter((s) => s.link);
  const mine = useAfter((s) => s.mine);
  const step = useAfter((s) => s.lookup.step);
  const port = useShop((s) => s.port);

  useEffect(() => {
    if (port === null) return;
    const token = linkInAddress();
    if (token !== null) void openOrderLink(token);
    // A link this tab opened before (the confirmation's), unless the one just tried opened nothing.
    else if (useAfter.getState().opened === null && useAfter.getState().link === null && port.after().sharedHeld()) void readLinked();
  }, [port]);

  const showing = opened !== null && (opened.state !== "ok" || opened.read !== null);
  // Signed in by the e-mail's link with no reference asked for: their orders, to pick from.
  const picking = !showing && step === "find" && signedIn() && mine.state === "ok" && mine.orders.length > 0;
  return (
    <>
      {link === "unknown" || link === "closed" ? (
        <div role="alert" className="mp-alert mp-alert--danger">
          <CircleAlert size={16} aria-hidden="true" />
          {t(link === "unknown" ? "after.link.unknown" : "after.link.closed")}
        </div>
      ) : null}
      <SessionBar />
      {showing ? <Opened /> : picking ? <Picker /> : <Gate view="order" />}
    </>
  );
}

/** The signed-in customer's orders: one to follow. */
function Picker() {
  const { t } = useI18n();
  const orders = useAfter((s) => s.mine.orders);
  const day = useDay();
  return (
    <section className="mp-screen ma-page" aria-labelledby="ma-pick-title">
      <h1 id="ma-pick-title" className="mp-h1">
        {t("after.order.title")}
      </h1>
      <p className="mp-lede">{t("after.mine.pick")}</p>
      <ul className="ma-list">
        {orders.map((o) => (
          <li key={String(o["id"])}>
            <button type="button" className="mp-card ma-pick" onClick={() => void openMine(o)}>
              <span className="mp-mono ma-ref">{String(o["number"] ?? "")}</span>
              <span className="ma-muted">{t("after.mine.placed", { date: day.short(String(o["placed_at"] ?? "")) })}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Opened() {
  const { t } = useI18n();
  const opened = useAfter((s) => s.opened)!;
  const catalogue = useShop((s) => s.catalogue);
  if (opened.state === "loading" || catalogue === null)
    return (
      <div className="mp-loading" aria-busy="true">
        <span className="mp-sr">{t("after.order.loading")}</span>
        <div className="mp-skel mp-skel--title" />
      </div>
    );
  if (opened.state === "failed" || opened.state === "gone" || opened.read === null)
    return (
      <section className="mp-screen ma-page" aria-labelledby="ma-order-title">
        <h1 id="ma-order-title" className="mp-h1">
          {t("after.order.title")}
        </h1>
        <div role="alert" className="mp-alert mp-alert--danger">
          <CircleAlert size={16} aria-hidden="true" />
          {t(opened.state === "gone" ? "after.order.gone" : "after.order.failed")}
        </div>
      </section>
    );
  return <OrderPage />;
}

function OrderPage() {
  const { t } = useI18n();
  const opened = useAfter((s) => s.opened)!;
  const me = useAfter((s) => s.me);
  const catalogue = useShop((s) => s.catalogue)!;
  const day = useDay();
  const read = opened.read!;
  const order = read.order;
  const jobs = jobViews(catalogue, read);
  const codes = openCodes();
  const live = jobs.filter((j) => !j.cancelled);
  const title = live.length === 1 ? t("after.order.jobTitle", { product: live[0]!.name, qty: live[0]!.qty }) : t("after.order.jobs", undefined, live.length);
  const ready = typeof order["ready_by"] === "string" && order["ready_by"] !== "" ? String(order["ready_by"]) : null;
  return (
    <section className="mp-screen ma-page" aria-labelledby="ma-order-title">
      <h1 id="ma-order-title" className="mp-h1">
        {t("after.order.title")}
      </h1>
      <p className="ma-via">
        <span className="ma-via-line">
          <Link2 size={14} aria-hidden="true" className="ma-pos" />
          {opened.via === "link" ? t("after.order.viaLink") : t("after.order.viaCode", { email: me?.email ?? "" })}
        </span>
        <button type="button" className="mp-link ma-small-link" onClick={() => followAnother()}>
          {t("after.order.another")}
        </button>
        {codes.length > 0 && (
          <button type="button" className="mp-link ma-small-link ma-designs-link" onClick={() => goView("savedDesign")}>
            <FolderHeart size={14} aria-hidden="true" />
            {t("after.designs.link")}
          </button>
        )}
      </p>
      <div className="ma-stack">
        <div className="mp-card ma-head-card">
          <div className="ma-head">
            <span className="mp-mono ma-number">{String(order["number"] ?? "")}</span>
            <span className="ma-head-title">{title}</span>
            <span className="ma-head-side">
              {String(order["name"] ?? "")}
              {ready !== null && (
                <>
                  {" · "}
                  <strong>{t("after.order.readyBy", { date: day.full(ready) })}</strong>
                </>
              )}
            </span>
          </div>
          {jobs.map((job) => (
            <div key={job.id} className="ma-job">
              {jobs.length > 1 && <div className="ma-job-title">{t("after.order.jobTitle", { product: job.name, qty: job.qty })}</div>}
              {job.cancelled ? <p className="ma-muted">{t("after.order.jobCancelled")}</p> : <Strip job={job} />}
            </div>
          ))}
        </div>

        {jobs.map((job) => (
          <ProofAnswerCards key={job.id} job={job} />
        ))}

        <DeliveryQuote />

        {jobs.map((job) => (
          <ArtworkCard key={job.id} job={job} several={jobs.length > 1} />
        ))}

        <Dispatch />
      </div>
    </section>
  );
}

/** The job's seven stages, each lit by where the job is and dated by its stamp. */
function Strip({ job }: { job: JobView }) {
  const { t } = useI18n();
  const day = useDay();
  return (
    <ol className="ma-strip" aria-label={t("after.stage.label", { product: job.name })}>
      {job.stages.map((stage, i) => (
        <li key={stage.key} className={stage.done ? "ma-stage ma-stage--done" : stage.current ? "ma-stage ma-stage--current" : "ma-stage"} aria-current={stage.current ? "step" : undefined}>
          {i > 0 && <span className="ma-stage-line" aria-hidden="true" />}
          <span className="ma-stage-dot" aria-hidden="true">
            {stage.done && <Check size={11} />}
          </span>
          <span className="ma-stage-label">
            {t(STAGE_LABELS[stage.key])}
            {stage.done && <span className="mp-sr"> · {t("after.stage.done")}</span>}
          </span>
          <span className="mp-mono ma-stage-date">{day.short(stage.at)}</span>
        </li>
      ))}
    </ol>
  );
}

/** A proof file's name as the page names it before it is opened. */
export const proofName = (job: JobView, proof: ProofView): string => `proof-${job.orderNumber.toLowerCase()}${proof.version > 1 ? `-v${String(proof.version)}` : ""}.pdf`;

/** The proof waiting, and what the customer answered this visit; a change asked stays said until the next proof. */
function ProofAnswerCards({ job }: { job: JobView }) {
  const { t } = useI18n();
  const answered = useAfter((s) => s.answered);
  const works = useShop((s) => s.catalogue?.works ?? null);
  const day = useDay();
  const latest = job.latest;
  if (latest === null) return null;
  if (job.waiting !== null) return <ProofCard job={job} proof={job.waiting} />;
  // Its file deleted with the customer's data: said plainly, with nothing to open or answer.
  if (job.gone !== null)
    return (
      <div role="status" className="ma-done ma-done--plain">
        <FileText size={20} aria-hidden="true" />
        <div>
          <div className="ma-done-title">{t("after.proof.goneTitle")}</div>
          <div className="ma-muted">{t("after.proof.goneBody")}</div>
        </div>
      </div>
    );
  if (latest.state === "approved" && answered[latest.id] === "approved")
    return (
      <div role="status" className="ma-done ma-done--pos">
        <CircleCheckBig size={20} aria-hidden="true" />
        <div>
          <div className="ma-done-title">{t("after.proof.approved")}</div>
          {job.readyBy !== null && <div className="ma-muted">{t("after.proof.approvedSub", { date: day.full(job.readyBy) })}</div>}
        </div>
      </div>
    );
  if (latest.state === "change_asked")
    return (
      <div role="status" className="ma-done ma-done--warn">
        <MessageSquareText size={20} aria-hidden="true" />
        <div>
          <div className="ma-done-title">{t("after.proof.changed")}</div>
          <div className="ma-muted">{job.readyBy === null ? t("after.proof.changedNoDate", undefined, works?.changeDays ?? 1) : t("after.proof.changedSub", { date: day.full(job.readyBy) }, works?.changeDays ?? 1)}</div>
        </div>
      </div>
    );
  return null;
}

/** "A proof is waiting for you": open it, then approve it or ask for a change. */
export function ProofCard({ job, proof, compact = false }: { job: JobView; proof: ProofView; compact?: boolean }) {
  const { t } = useI18n();
  const looked = useAfter((s) => s.looked[proof.id] === true);
  const typed = useAfter((s) => s.change[proof.id]);
  const change = typed ?? { note: "", tried: false };
  const answering = useAfter((s) => s.answering === proof.id);
  const failed = useAfter((s) => s.answerFailed === proof.id);
  const noteId = `ma-note-${proof.id}`;
  const errId = `ma-note-err-${proof.id}`;
  const hintId = `ma-approve-hint-${proof.id}`;
  const empty = change.tried && change.note.trim() === "";
  const ask = async () => {
    const done = await answerProof(proof.id, "change_asked");
    if (done === "fix") setTimeout(() => document.getElementById(noteId)?.focus(), 0);
  };
  const approve = (
    <button
      type="button"
      className={looked ? "mp-button ma-approve" : "mp-button ma-approve ma-approve--off"}
      aria-disabled={!looked}
      aria-describedby={looked ? undefined : hintId}
      aria-busy={answering || undefined}
      onClick={() => void answerProof(proof.id, "approved")}
    >
      <Check size={15} aria-hidden="true" />
      {t("after.proof.approve")}
    </button>
  );
  const hint = !looked && (
    <span id={hintId} className="mp-small">
      {compact ? t("after.proof.openFirstLong") : t("after.proof.openFirst")}
    </span>
  );
  const controls = (
    <>
      <div className="ma-row">
        <button type="button" className="mp-button ma-open-proof" onClick={() => void openProof(proof.id)}>
          <FileText size={15} aria-hidden="true" />
          {t("after.proof.open")}
          {looked && (
            <span className="ma-opened">
              <Check size={12} aria-hidden="true" />
              {t("after.proof.opened")}
            </span>
          )}
        </button>
        {compact && (
          <>
            <span className="mp-mono ma-file-chip">{proofName(job, proof)}</span>
            <span className="ma-push">{approve}</span>
          </>
        )}
      </div>
      {compact ? (
        hint
      ) : (
        <div className="ma-row">
          {approve}
          {hint}
        </div>
      )}
      <label className="mp-field">
        <span className="mp-field-label">
          {t("after.proof.change")} <span>· {t("after.proof.required")}</span>
        </span>
        <textarea
          id={noteId}
          className="mp-input ma-textarea"
          rows={compact ? 2 : 3}
          value={change.note}
          placeholder={compact ? t("after.proof.changeHintShort") : t("after.proof.changeHint")}
          aria-invalid={empty}
          aria-describedby={empty ? errId : undefined}
          onChange={(e) => typeChange(proof.id, e.target.value)}
        />
        {empty && (
          <span id={errId} role="alert" className="mp-field-error">
            {t("after.proof.changeEmpty")}
          </span>
        )}
      </label>
      <button type="button" className="mp-button ma-ask" aria-busy={answering || undefined} onClick={() => void ask()}>
        {t("after.proof.ask")}
      </button>
      {failed && (
        <p role="alert" className="mp-field-error">
          <TriangleAlert size={13} aria-hidden="true" />
          {t("after.proof.failed")}
        </p>
      )}
    </>
  );
  if (compact) return <div className="ma-compact">{controls}</div>;
  return (
    <div className="mp-card ma-proof">
      <div className="ma-proof-head">
        <MailCheck size={18} aria-hidden="true" className="ma-accent" />
        <h2 className="ma-proof-title">{t("after.proof.waiting")}</h2>
      </div>
      <div className="ma-proof-grid">
        <div className={`ma-proof-art ${tintOf(job.family)}`} aria-hidden="true">
          <span className="ma-proof-page">
            <FileText size={28} />
          </span>
          <span className="mp-mono ma-chip ma-chip--top">{t("after.proof.page1")}</span>
          <span className="mp-mono ma-chip ma-chip--bottom">{proofName(job, proof)}</span>
        </div>
        <div className="ma-col">
          <p className="ma-proof-body">{t("after.proof.body")}</p>
          {job.designCode !== null && (
            <p className="ma-proof-design">
              <PenTool size={14} aria-hidden="true" />
              {t("after.proof.fromDesign")}
            </p>
          )}
          {proof.note !== null && <p className="ma-proof-note">{t("after.proof.note", { note: proof.note })}</p>}
          {controls}
        </div>
      </div>
    </div>
  );
}

/** "Your delivery quote": the works' price for a delivery over every band, accepted or collected instead. */
function DeliveryQuote() {
  const { t, locale } = useI18n();
  const order = useAfter((s) => s.opened?.read?.order ?? null);
  const answer = useAfter((s) => s.deliveryAnswer);
  const currency = useShop((s) => s.config.currency);
  if (order === null) return null;
  if (answer.done !== null)
    return (
      <div role="status" className="ma-done ma-done--pos">
        <CircleCheckBig size={20} aria-hidden="true" />
        <div className="ma-done-title">{t(answer.done === "accepted" ? "after.delivery.accepted" : "after.delivery.collect")}</div>
      </div>
    );
  if (leavingOf(order) !== "quoteSent") return null;
  return (
    <div className="mp-card ma-proof">
      <div className="ma-proof-head">
        <Truck size={18} aria-hidden="true" className="ma-accent" />
        <h2 className="ma-proof-title">{t("after.delivery.title")}</h2>
      </div>
      <p className="ma-proof-body">{t("after.delivery.body", { price: money(order["delivery_quote"], currency, locale) })}</p>
      <div className="ma-row">
        <button type="button" className="mp-button mp-button--accent" aria-busy={answer.busy || undefined} onClick={() => void answerDelivery("accepted")}>
          {t("after.delivery.accept")}
        </button>
        <button type="button" className="mp-button" aria-busy={answer.busy || undefined} onClick={() => void answerDelivery("collect")}>
          {t("after.delivery.instead")}
        </button>
      </div>
      {answer.failed && (
        <p role="alert" className="mp-field-error">
          <TriangleAlert size={13} aria-hidden="true" />
          {t("after.delivery.failed")}
        </p>
      )}
    </div>
  );
}

const LEVEL_ICON = { pos: Check, warn: TriangleAlert, danger: CircleX, info: CircleCheckBig } as const;

/** The files the customer sent for a job and what their checks said; a design made in the customiser instead. */
function ArtworkCard({ job, several }: { job: JobView; several: boolean }) {
  const { t } = useI18n();
  if (job.cancelled || (job.files.length === 0 && job.designCode === null)) return null;
  const design = job.designCode !== null && job.files.length === 0;
  return (
    <div className="mp-card">
      <h2 className="mp-card-title">
        {design ? t("after.art.design") : t("after.art.title")}
        {several && <span className="ma-muted ma-card-sub"> · {job.name}</span>}
      </h2>
      {design && job.forgotten ? (
        <p className="ma-muted">{t("after.art.designGone")}</p>
      ) : design ? (
        <p className="ma-muted">
          {t("after.art.designBody")}{" "}
          <button type="button" className="mp-link" onClick={() => goView("savedDesign")}>
            {t("after.designs.link")}
          </button>
        </p>
      ) : (
        <ul className="ma-verdicts">
          {job.files.flatMap((file) =>
            !file.kept
              ? [
                  <li key={`${file.id}-gone`} className="ma-verdict ma-verdict--info">
                    <CircleCheckBig size={16} aria-hidden="true" />
                    <span>{t("after.art.gone")}</span>
                  </li>,
                ]
              : (file.rows.length === 0 ? [{ level: "info" as const, text: t("after.art.kept") }] : file.rows.slice(0, 2)).map((row, i) => {
              const Icon = LEVEL_ICON[row.level];
              return (
                <li key={`${file.id}-${String(i)}`} className={`ma-verdict ma-verdict--${row.level}`}>
                  <Icon size={16} aria-hidden="true" />
                  <span>
                    <span className="mp-mono ma-verdict-file">{file.name}</span> — {row.text}
                  </span>
                </li>
              );
            }),
          )}
        </ul>
      )}
    </div>
  );
}

/** How the order leaves the works: collection, a courier, a delivery to quote, or gone. */
function Dispatch() {
  const { t, locale } = useI18n();
  const order = useAfter((s) => s.opened?.read?.order ?? null);
  const currency = useShop((s) => s.config.currency);
  const day = useDay();
  if (order === null) return null;
  const leaving = leavingOf(order);
  const words: Record<typeof leaving, string> = {
    collect: t("after.dispatch.collect"),
    collected: t("after.dispatch.collected", { date: day.full(typeof order["collected_at"] === "string" ? order["collected_at"] : null) }),
    deliver: t("after.dispatch.deliver"),
    toQuote: t("after.dispatch.toQuote"),
    quoteSent: t("after.dispatch.toQuote"),
    quoteAccepted: t("after.dispatch.quoted", { price: money(order["delivery_quote"], currency, locale) }),
    dispatched: t("after.dispatch.sent", { date: day.full(typeof order["dispatched_at"] === "string" ? order["dispatched_at"] : null) }),
    cancelled: t("after.dispatch.cancelled"),
  };
  const tracking = typeof order["tracking"] === "string" && order["tracking"] !== "" ? order["tracking"] : null;
  const collecting = leaving === "collect" || leaving === "collected";
  return (
    <div className="mp-card">
      <h2 className="mp-card-title">{t("after.dispatch.title")}</h2>
      <div className="ma-dispatch">
        <span className="ma-dispatch-icon">{collecting ? <Store size={17} aria-hidden="true" /> : <Truck size={17} aria-hidden="true" />}</span>
        <span>
          {words[leaving]}
          {tracking !== null && (
            <>
              {" "}
              <span className="ma-muted">{t("after.dispatch.tracking", { tracking })}</span>
            </>
          )}
        </span>
      </div>
    </div>
  );
}
