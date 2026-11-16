/**
 * THE ORDER'S MONEY ON THE JOB TICKET (comp `Marlow Press Payments` 362,
 * 380-401, 438-535): a Paid / Not paid chip beside the reference; the
 * Payment card with each payment (online, with the service it came through;
 * by hand, with its way and, for a card on the works' terminal, the slip's
 * approval code and last four), each refund, and what is paid or still to
 * pay; "Copy pay link" while something is owed; "Refund" on an online
 * payment for someone who may give money back. And the counter's sheet,
 * "Take payment and hand over": card on the terminal, cash, or the pay link
 * on the customer's own phone, recorded through Adminium, then handed over.
 *
 * A refund is Adminium's own: its kit draws the two steps with the
 * dashboard's words. A payment taken by hand is Adminium's to write, as the
 * person who took it, never above what is due.
 *
 * With payments off and nothing ever paid, none of this is drawn.
 */
import { CircleCheckBig, Copy, Globe, HandCoins, Link2, QrCode, Undo2, X } from "lucide-react";
import { qrSvg } from "@adminiumjs/public-client/qr";
import { useEffect, useId, useState } from "react";

import { collectJob, customerOf } from "../actions.ts";
import { deviceNow } from "../clock.ts";
import { reload, useData, useEnv, useRun } from "../env.tsx";
import { byId, jobById, orderOf, refOf } from "../facts.ts";
import { useFmt } from "../format.ts";
import { KitPart } from "../kit.tsx";
import { orderPayment, type HandWay, type OrderPayment, type PaidLine } from "../payment.ts";
import { toast, useWorks } from "../store.ts";
import { Mono, Typed } from "../ui.tsx";
import { isApiError, num, text, type Row } from "../wire.ts";
import type { PaymentPanel } from "../door.ts";
import { close, Modal } from "./Modal.tsx";
import { useI18n, useT, type MessageKey } from "../../i18n/index.tsx";

const WAY_KEY: Record<HandWay, MessageKey> = {
  card: "works.pay.way.card",
  cash: "works.pay.way.cash",
  "bank-transfer": "works.pay.way.bank-transfer",
  cheque: "works.pay.way.cheque",
  other: "works.pay.way.other",
};

/**
 * Adminium's payment panel on an order, read again whenever the order's
 * money changes (a payment, a refund): who may do what, and each online
 * payment's refunds. None while the works takes no payments.
 */
export function usePanel(order: Row | undefined): PaymentPanel | null {
  const { door } = useEnv();
  const [panel, setPanel] = useState<PaymentPanel | null>(null);
  const on = door.facts().payments?.on === true;
  // What the order's money is now: the panel is read again only when it moves.
  const stamp = order === undefined ? "" : [order.id, order["due"], order["paid"], order["refunded"], order["status"]].map(String).join("|");
  useEffect(() => {
    const pay = door.payments();
    if (pay === null || !on || order === undefined) {
      setPanel(null);
      return;
    }
    let gone = false;
    pay.state(order).then(
      (said) => !gone && setPanel(said),
      () => !gone && setPanel(null),
    );
    return () => {
      gone = true;
    };
    // `stamp` says when the order's money moved: the order object is new on every read, and a door may hand
    // out a new payments object each time it is asked, so neither is a key (an effect keyed on one never rests).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stamp, door, on]);
  return panel;
}

/** The order's payment as the ticket shows it. */
export function useOrderPayment(order: Row | undefined, panel: PaymentPanel | null): OrderPayment | null {
  const data = useData();
  const { door } = useEnv();
  return order === undefined ? null : orderPayment(data, order, door.facts().payments, panel);
}

/** Paid · Online · Stripe, Paid, Not paid, Refunded: beside the reference. */
export function PaymentChip({ payment }: { payment: OrderPayment | null }) {
  const t = useT();
  const fmt = useFmt();
  if (payment === null || !payment.shown) return null;
  const tone = payment.chip === "notPaid" ? "warn" : payment.chip === "paid" ? "pos" : "neutral";
  const words =
    payment.chip === "notPaid"
      ? t("works.pay.chip.notPaid")
      : payment.chip === "refunded"
        ? t("works.pay.chip.refunded")
        : payment.chip === "partRefunded"
          ? t("works.pay.refundedAmount", { amount: fmt.money(payment.refunded) })
          : payment.service === null
            ? t("works.pay.chip.paid")
            : `${t("works.pay.chip.paid")} · ${t("works.pay.online", { service: payment.service })}`;
  return (
    <span className={`wk-pay-chip wk-pay-chip--${tone}`} data-testid="pay-chip">
      {words}
    </span>
  );
}

/** Whether the ticket's order may be paid by its pay link now: the works takes payments, the order owes, and Adminium has a link for it. */
const mayLink = (order: Row, payment: OrderPayment): boolean => payment.due > 0 && num(order["pay_open"]) === 1 && ["placed", "ready", "dispatched"].includes(String(order["status"]));

export function PaymentCard({ order, payment, panel }: { order: Row; payment: OrderPayment; panel: PaymentPanel | null }) {
  const t = useT();
  const fmt = useFmt();
  const { door } = useEnv();
  const [busy, setBusy] = useState(false);
  const facts = door.facts().payments;
  const pay = door.payments();
  const headId = useId();
  if (!payment.shown) return null;
  const mayRefund = facts?.refund === true && panel?.mayRefund === true;
  const copyable = facts?.on === true && pay !== null && panel?.mayChange === true && mayLink(order, payment);
  const copy = async () => {
    if (pay === null) return;
    setBusy(true);
    try {
      const link = await pay.link(order);
      try {
        await navigator.clipboard.writeText(link.url);
        toast(t("works.pay.copied", { amount: fmt.money(payment.due) }), "pos");
      } catch {
        toast(t("works.pay.copyBlocked", { url: link.url }), "info");
      }
    } catch (error) {
      toast(t("works.pay.linkFailed", { why: error instanceof Error ? error.message : String(error) }), "danger");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="wk-panel wk-pay" aria-labelledby={headId} data-testid="ticket-payment">
      <h2 className="wk-panel-head wk-panel-head--small" id={headId}>
        {t("works.pay.title")}
      </h2>
      {payment.lines.length > 0 && (
        <ul className="wk-pay-rows">
          {payment.lines.map((line) =>
            line.kind === "paid" ? (
              <li key={line.key} className="wk-pay-row">
                <span className="wk-pay-label">{line.online ? t("works.pay.onlineRow") : line.way === null ? t("works.pay.way.other") : t(WAY_KEY[line.way])}</span>
                {line.online && line.service !== null && (
                  <span className="wk-pay-chip wk-pay-chip--info">
                    <Globe size={12} aria-hidden="true" />
                    {t("works.pay.online", { service: line.service })}
                  </span>
                )}
                <Mono className="wk-pay-amount">{fmt.money(line.amount)}</Mono>
                <span className="wk-pay-meta">{meta(line)}</span>
                {mayRefund && line.attemptId !== null && line.refundable > 0 && (
                  <button type="button" className="wk-btn wk-btn--small wk-pay-refund" onClick={() => useWorks.setState({ overlay: { kind: "refund", orderId: order.id, attemptId: line.attemptId! } })}>
                    <Undo2 size={13} className="wk-flip" aria-hidden="true" />
                    {t("works.pay.refund")}
                  </button>
                )}
              </li>
            ) : (
              <li key={line.key} className="wk-pay-row wk-pay-row--refund">
                <span className="wk-pay-label">{line.done ? t("works.pay.refunded") : t("works.pay.refundAsked")}</span>
                <Mono className="wk-pay-amount">−{fmt.money(line.amount)}</Mono>
                <span className="wk-pay-meta">{line.at === null ? "" : fmt.moment(new Date(line.at).toISOString())}</span>
              </li>
            ),
          )}
        </ul>
      )}
      <div className="wk-pay-sum">
        <span>{payment.due > 0 ? t("works.pay.sumOwed") : t("works.pay.sumPaid")}</span>
        <Mono>{fmt.money(payment.due > 0 ? payment.due : payment.paid)}</Mono>
      </div>
      {copyable && (
        <div className="wk-pay-link">
          <p className="wk-muted">{t("works.pay.linkHint", { amount: fmt.money(payment.due) })}</p>
          <button type="button" className="wk-action" disabled={busy} aria-busy={busy || undefined} onClick={() => void copy()} data-testid="copy-pay-link">
            <Link2 size={16} className="wk-ic-accent" aria-hidden="true" />
            {t("works.pay.copyLink")}
          </button>
        </div>
      )}
    </section>
  );

  function meta(line: PaidLine): string {
    const day = fmt.moment(line.at);
    const card = line.way === "card" && line.approvalCode !== null && line.last4 !== null ? ` · ${t("works.pay.cardMeta", { code: line.approvalCode, last4: line.last4 })}` : "";
    if (line.online) return t("works.pay.fromPage", { day, time: fmt.time(line.at) });
    return `${t("works.pay.byHand", { day, name: line.by ?? "—" })}${card}`;
  }
}

/** The kit's refund, in a sheet of the works': Adminium's own two steps, words and toast. */
export function RefundSheet({ orderId, attemptId }: { orderId: unknown; attemptId: string }) {
  const t = useT();
  const { locale, dir } = useI18n();
  const { door } = useEnv();
  const data = useData();
  const titleId = useId();
  const kit = door.payments()?.kit() ?? null;
  const order = byId(data.orders, orderId);
  const [props] = useState(() => ({
    attemptId,
    csrfToken: kit?.csrfToken ?? "",
    locale,
    dir,
    ...(kit === null ? {} : { fetch: kit.fetch }),
    onRefunded: () => void reload(door),
  }));
  return (
    <Modal kind="sheet" labelledBy={titleId}>
      <div className="wk-sheet-head">
        <h2 className="wk-sheet-title" id={titleId}>
          {t("works.pay.refundTitle")}
        </h2>
        <button type="button" className="wk-close" aria-label={t("works.close")} onClick={close}>
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="wk-sheet-body">
        {order !== undefined && (
          <p className="wk-sheet-lede">
            <Mono>{text(order["number"]) ?? ""}</Mono> · <Typed>{customerOf(order)}</Typed>
          </p>
        )}
        <KitPart kit={kit} part="refund" props={props} fallback={<p className="wk-muted">{t("works.pay.kitMissing")}</p>} />
      </div>
    </Modal>
  );
}

type Way = "card" | "cash" | "link";

/**
 * A key for one payment taken, made when the sheet opens: the same payment
 * asked twice (a press again after a lost answer) is recorded once. Adminium
 * holds a key to the person and the order, so the order and the moment the
 * sheet opened are enough to tell one taking from the next.
 */
function newKey(orderId: unknown): string {
  return `counter_${String(orderId)}_${deviceNow().toString(36)}`.replace(/[^A-Za-z0-9_-]/g, "").padEnd(16, "0").slice(0, 59);
}

const APPROVAL = /^[A-Za-z0-9]{1,12}$/;
const LAST4 = /^\d{4}$/;

/** "Take payment and hand over": how the customer pays at the counter, recorded through Adminium, then the job handed over. */
export function TakeSheet({ jobId }: { jobId: unknown }) {
  const t = useT();
  const fmt = useFmt();
  const data = useData();
  const { door } = useEnv();
  const { busy, run } = useRun();
  const titleId = useId();
  const howId = useId();
  const live = useId();
  const job = jobById(data, jobId as never);
  const order = job === undefined ? undefined : orderOf(data, job);
  const payment = useOrderPayment(order, null);
  const pay = door.payments();
  const online = door.facts().payments?.online === true;
  const [way, setWay] = useState<Way>("card");
  const [approval, setApproval] = useState("");
  const [last4, setLast4] = useState("");
  const [tried, setTried] = useState(false);
  const [key] = useState(() => newKey(job?.["order_id"]));
  const [link, setLink] = useState<{ state: "idle" | "making" | "ready" | "failed"; url: string | null; why: string | null }>({ state: "idle", url: null, why: null });
  const [qr, setQr] = useState(false);
  const [check, setCheck] = useState<"idle" | "checking" | "notYet">("idle");
  const [said, setSaid] = useState("");

  // The pay link, asked for once when that way is picked; keyed on the choice alone (the order and the door's
  // payments object are new on every read).
  useEffect(() => {
    const door$ = door.payments();
    if (way !== "link" || link.state !== "idle" || door$ === null || order === undefined) return;
    setLink({ state: "making", url: null, why: null });
    door$.link(order).then(
      (made) => setLink({ state: "ready", url: made.url, why: null }),
      (error: unknown) => setLink({ state: "failed", url: null, why: error instanceof Error ? error.message : String(error) }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [way, link.state]);

  if (job === undefined || order === undefined || payment === null) return null;
  const ref = refOf(data, job);
  const customer = customerOf(order);
  const due = payment.due;
  const settled = due <= 0;
  const onlinePaid = payment.lines.filter((l): l is PaidLine => l.kind === "paid" && l.online);
  const byHand = payment.lines.filter((l): l is PaidLine => l.kind === "paid" && !l.online);
  const approvalBad = tried && way === "card" && !APPROVAL.test(approval.trim());
  const last4Bad = tried && way === "card" && !LAST4.test(last4.trim());
  const wayWord = (w: Way) => t(w === "card" ? "works.pay.way.card" : "works.pay.way.cash");

  const handOver = (toastText: string) =>
    run(async (d, fresh) => {
      await collectJob(d, fresh, jobById(fresh, job.id) ?? job, d.who());
      close();
      return toastText;
    });

  const record = () => {
    if (settled) return void handOver(t("works.ticket.collectedToast", { ref }));
    if (way === "link") return void checkLink();
    setTried(true);
    if (way === "card" && (!APPROVAL.test(approval.trim()) || !LAST4.test(last4.trim()))) {
      setSaid(!APPROVAL.test(approval.trim()) ? t("works.take.approvalBad") : t("works.take.last4Bad"));
      return;
    }
    if (pay === null) return;
    const amount = due.toFixed(2);
    void run(async (d, fresh) => {
      const now = byId(fresh.orders, order.id) ?? order;
      try {
        await pay.record(now, { amount, way, approvalCode: way === "card" ? approval.trim() : null, last4: way === "card" ? last4.trim() : null, paidOn: fmt.today(d.now()), key });
      } catch (error) {
        if (isApiError(error) && error.params["reason"] === "BALANCE_EXCEEDED") {
          toast(t("works.take.tooMuch"), "warn");
          return;
        }
        throw error;
      }
      await collectJob(d, fresh, jobById(fresh, job.id) ?? job, d.who());
      close();
      return t("works.take.handed", { ref: text(order["number"]) ?? ref, amount: fmt.money(due), way: wayWord(way) });
    });
  };

  // The pay link's payment, looked for: the order read again; paid in, the sheet says so and hands over on the next press.
  const checkLink = () => {
    setCheck("checking");
    setSaid(t("works.take.checking"));
    void (async () => {
      await reload(door);
      const fresh = useWorks.getState().data;
      const now = fresh === null ? undefined : byId(fresh.orders, order.id);
      const owes = now === undefined ? due : (num(now["due"]) ?? due);
      if (owes > 0) {
        setCheck("notYet");
        setSaid(t("works.take.notYet"));
      } else {
        setCheck("idle");
        setSaid(t("works.take.paidIn"));
      }
    })();
  };

  const radio = (value: Way, title: string, sub: string) => (
    <button type="button" role="radio" aria-checked={way === value} className="wk-radio" onClick={() => setWay(value)}>
      <span className="wk-radio-ring" aria-hidden="true">
        <span className="wk-radio-dot" />
      </span>
      <span>
        <span className="wk-radio-title">{title}</span>
        <span className="wk-radio-sub">{sub}</span>
      </span>
    </button>
  );

  return (
    <Modal kind="sheet" labelledBy={titleId}>
      <div className="wk-sheet-head">
        <h2 className="wk-sheet-title" id={titleId}>
          {t("works.actions.takeHand")}
        </h2>
        <button type="button" className="wk-close" aria-label={t("works.close")} onClick={close}>
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="wk-sheet-body">
        <p className="wk-sheet-lede">
          {customer !== "" && (
            <>
              <Typed>{customer}</Typed>
              {" · "}
            </>
          )}
          <Mono>{text(order["number"]) ?? ref}</Mono> · <Mono>{fmt.money(settled ? payment.paid : due)}</Mono>
        </p>
        {settled ? (
          <div className="wk-take-paid" data-testid="take-already">
            <CircleCheckBig size={18} className="wk-ic-pos" aria-hidden="true" />
            <div>
              {onlinePaid.length > 0 ? (
                <>
                  <div className="wk-take-paid-title">{t("works.take.alreadyPaid")}</div>
                  <div className="wk-muted">{t("works.pay.fromPage", { day: fmt.moment(onlinePaid[0]!.at), time: fmt.time(onlinePaid[0]!.at) })}</div>
                  {onlinePaid[0]!.service !== null && <span className="wk-pay-chip wk-pay-chip--info">{t("works.pay.online", { service: onlinePaid[0]!.service })}</span>}
                </>
              ) : (
                <div className="wk-take-paid-title">{t("works.take.paidByHand", { amount: fmt.money(payment.paid), way: byHand[0]?.way === null || byHand[0] === undefined ? t("works.pay.way.other") : t(WAY_KEY[byHand[0].way]) })}</div>
              )}
            </div>
            <Mono className="wk-pay-amount">{fmt.money(payment.paid)}</Mono>
          </div>
        ) : (
          <>
            <div className="wk-field-label" id={howId}>
              {t("works.take.how")}
            </div>
            <div className="wk-radios" role="radiogroup" aria-labelledby={howId}>
              {radio("card", t("works.take.card"), t("works.take.cardSub"))}
              {radio("cash", t("works.take.cash"), t("works.take.cashSub", { amount: fmt.money(due) }))}
              {online && pay !== null && num(order["pay_open"]) === 1 && radio("link", t("works.take.link"), t("works.take.linkSub"))}
            </div>
            {way === "card" && (
              <div className="wk-take-card">
                <label className="wk-field">
                  <span className="wk-field-label">{t("works.take.approval")}</span>
                  <input
                    className="wk-input wk-mono"
                    value={approval}
                    maxLength={12}
                    autoComplete="off"
                    aria-invalid={approvalBad}
                    aria-describedby={`${titleId}-ap-help${approvalBad ? ` ${titleId}-ap-err` : ""}`}
                    onChange={(e) => setApproval(e.target.value)}
                    data-testid="take-approval"
                  />
                  <span id={`${titleId}-ap-help`} className="wk-field-hint">
                    {t("works.take.approvalHelp")}
                  </span>
                  {approvalBad && (
                    <span id={`${titleId}-ap-err`} className="wk-error">
                      {t("works.take.approvalBad")}
                    </span>
                  )}
                </label>
                <label className="wk-field">
                  <span className="wk-field-label">{t("works.take.last4")}</span>
                  <input
                    className="wk-input wk-mono"
                    value={last4}
                    maxLength={4}
                    inputMode="numeric"
                    autoComplete="off"
                    aria-invalid={last4Bad}
                    aria-describedby={`${titleId}-l4-help${last4Bad ? ` ${titleId}-l4-err` : ""}`}
                    onChange={(e) => setLast4(e.target.value)}
                    data-testid="take-last4"
                  />
                  <span id={`${titleId}-l4-help`} className="wk-field-hint">
                    {t("works.take.last4Help")}
                  </span>
                  {last4Bad && (
                    <span id={`${titleId}-l4-err`} className="wk-error">
                      {t("works.take.last4Bad")}
                    </span>
                  )}
                </label>
              </div>
            )}
            {way === "link" && (
              <div className="wk-take-link" data-testid="take-link">
                {link.state === "making" && <p className="wk-muted">{t("works.take.making")}</p>}
                {link.state === "failed" && <p className="wk-error">{t("works.pay.linkFailed", { why: link.why ?? "" })}</p>}
                {link.state === "ready" && link.url !== null && (
                  <>
                    <Mono className="wk-take-url">{link.url}</Mono>
                    <div className="wk-take-link-actions">
                      <button
                        type="button"
                        className="wk-btn wk-btn--small"
                        onClick={() =>
                          void navigator.clipboard.writeText(link.url!).then(
                            () => toast(t("works.pay.copied", { amount: fmt.money(due) }), "pos"),
                            () => toast(t("works.pay.copyBlocked", { url: link.url! }), "info"),
                          )
                        }
                      >
                        <Copy size={13} aria-hidden="true" />
                        {t("works.take.copy")}
                      </button>
                      <button type="button" className="wk-btn wk-btn--small" aria-expanded={qr} onClick={() => setQr((v) => !v)}>
                        <QrCode size={13} aria-hidden="true" />
                        {qr ? t("works.take.hideQr") : t("works.take.showQr")}
                      </button>
                    </div>
                    {qr && <Qr url={link.url} label={t("works.take.qr")} />}
                    <p className="wk-muted">{t("works.take.linkNote")}</p>
                  </>
                )}
              </div>
            )}
          </>
        )}
        <p id={live} className="wk-take-said" role="status" aria-live="polite" data-check={check}>
          {said}
        </p>
      </div>
      <div className="wk-sheet-foot">
        <button type="button" className="wk-btn wk-btn--primary wk-grow" disabled={busy || check === "checking"} aria-busy={busy || check === "checking" || undefined} onClick={record} data-testid="take-record">
          <HandCoins size={16} aria-hidden="true" />
          {t("works.take.record")}
        </button>
        <button type="button" className="wk-btn" onClick={close}>
          {t("works.cancel")}
        </button>
      </div>
    </Modal>
  );
}

/** The pay link as a QR code, drawn here from the link itself: nothing is sent anywhere to draw it. */
function Qr({ url, label }: { url: string; label: string }) {
  let svg: string | null;
  try {
    svg = qrSvg(url, { size: 176, page: true });
  } catch {
    svg = null;
  }
  if (svg === null) return null;
  return <div className="wk-take-qr" role="img" aria-label={label} dangerouslySetInnerHTML={{ __html: svg }} />;
}
