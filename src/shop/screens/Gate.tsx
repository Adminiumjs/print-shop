/**
 * Finding an order: a reference and the e-mail it was ordered with, then the
 * six-digit code Adminium e-mails to that address. Follow your order, Your
 * proofs, Order it again and Saved quotes all open this way, each with its
 * own words; none opens anything on a reference alone or an address alone.
 * And the line that says whose rows are showing, with "Not you? Sign out".
 */
import { CircleAlert, Lock, Mail, SearchX, UserRoundCheck } from "lucide-react";
import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent } from "react";

import { useI18n, type MessageKey } from "../../i18n/index.tsx";
import { backToFind, checkCode, findOrder, lookupErrors, resendCode, signOut, typeLookup, useAfter, type GateView } from "../after.ts";
import { useShop } from "../store.ts";

const TITLES: Record<GateView, MessageKey> = {
  order: "after.order.title",
  proofs: "after.proofs.title",
  reorder: "after.again.title",
  quotes: "after.quotes.title",
};
const INTROS: Record<GateView, MessageKey> = {
  order: "after.gate.order",
  proofs: "after.gate.proofs",
  reorder: "after.gate.reorder",
  quotes: "after.gate.quotes",
};

const focusSoon = (id: string) => setTimeout(() => document.getElementById(id)?.focus(), 0);

function FieldError({ id, children }: { id: string; children: string }) {
  return (
    <span id={id} role="alert" className="mp-field-error">
      <CircleAlert size={13} aria-hidden="true" />
      {children}
    </span>
  );
}

/** "Showing what belongs to Harbour Bakery · Not you? Sign out", while a customer is signed in. */
export function SessionBar() {
  const { t } = useI18n();
  const me = useAfter((s) => s.me);
  if (me === null) return null;
  return (
    <div className="ma-session">
      <UserRoundCheck size={15} aria-hidden="true" className="ma-session-icon" />
      <span>{t("after.session.who", { who: me.name ?? me.email ?? "" })}</span>
      <button type="button" className="mp-link ma-small-link" onClick={() => void signOut()}>
        {t("after.session.out")}
      </button>
    </div>
  );
}

/** The gate: the page's title and words, the reference and the e-mail, then the code. */
export function Gate({ view }: { view: GateView }) {
  const { t } = useI18n();
  const step = useAfter((s) => s.lookup.step);
  return (
    <section className="mp-screen ma-page" aria-labelledby="ma-gate-title" data-screen-label="Find your order">
      <h1 id="ma-gate-title" className="mp-h1">
        {t(TITLES[view])}
      </h1>
      <p className="mp-lede">{t(INTROS[view])}</p>
      {step === "code" ? <CodeStep view={view} /> : <LookupForm view={view} />}
    </section>
  );
}

export function LookupForm({ view }: { view: GateView }) {
  const { t } = useI18n();
  const lookup = useAfter((s) => s.lookup);
  const prefix = useShop((s) => s.catalogue?.works.refPrefix ?? null) ?? "MP-";
  const quotes = useShop((s) => s.catalogue?.works.quotePrefix ?? null) ?? "MQ-";
  const errors = lookup.tried ? lookupErrors(lookup) : {};
  const refErr: MessageKey | null = errors.ref === "empty" ? "after.lookup.err.refEmpty" : errors.ref === "shape" ? "after.lookup.err.refShape" : null;
  const emailErr: MessageKey | null = errors.email === "empty" ? "after.lookup.err.emailEmpty" : errors.email === "shape" ? "after.lookup.err.emailShape" : null;
  const whole: MessageKey | null = lookup.err === "mismatch" ? "after.lookup.err.mismatch" : lookup.err === "noMail" ? "after.lookup.err.noMail" : lookup.err === "unreachable" ? "after.err.unreachable" : null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const done = await findOrder(view);
    const after = useAfter.getState().lookup;
    if (done === "code") focusSoon("ma-code-0");
    else if (done === "fix") focusSoon(lookupErrors(after).ref !== undefined || after.err === "mismatch" ? "ma-lu-ref" : "ma-lu-email");
  };
  const describe = (own: string | null) => [own, whole === null ? null : "ma-lu-err"].filter(Boolean).join(" ") || undefined;
  return (
    <form className="mp-card ma-gate" onSubmit={(e) => void submit(e)} noValidate>
      <div className="ma-gate-row">
        <label className="mp-field">
          <span className="mp-field-label">{t("after.lookup.ref")}</span>
          <input
            id="ma-lu-ref"
            className="mp-input mp-mono"
            value={lookup.ref}
            onChange={(e) => typeLookup({ ref: e.target.value })}
            placeholder={`${prefix}0000`}
            autoComplete="off"
            aria-invalid={refErr !== null || lookup.err === "mismatch"}
            aria-describedby={describe(refErr === null ? null : "ma-lu-ref-err")}
          />
          {refErr !== null && <FieldError id="ma-lu-ref-err">{t(refErr, { order: prefix, quote: quotes })}</FieldError>}
        </label>
        <label className="mp-field">
          <span className="mp-field-label">{t("after.lookup.email")}</span>
          <input
            id="ma-lu-email"
            type="email"
            inputMode="email"
            className="mp-input"
            value={lookup.email}
            onChange={(e) => typeLookup({ email: e.target.value })}
            placeholder={t("after.lookup.emailHint")}
            autoComplete="email"
            aria-invalid={emailErr !== null || lookup.err === "mismatch"}
            aria-describedby={describe(emailErr === null ? null : "ma-lu-email-err")}
          />
          {emailErr !== null && <FieldError id="ma-lu-email-err">{t(emailErr)}</FieldError>}
        </label>
        <button type="submit" className="mp-button mp-button--accent ma-gate-send" aria-busy={lookup.busy || undefined}>
          {lookup.busy ? t("after.sending") : t("after.lookup.send")}
        </button>
      </div>
      {whole !== null && (
        <div id="ma-lu-err" role="alert" className="ma-warn">
          <SearchX size={16} aria-hidden="true" />
          {t(whole)}
        </div>
      )}
      <p className="ma-lock">
        <Lock size={13} aria-hidden="true" />
        {t("after.lookup.lock")}
      </p>
    </form>
  );
}

/** The seconds left before another code may be asked for, counted down from each code sent. */
function useLeft(sends: number, canResend: boolean): number {
  const [left, setLeft] = useState(30);
  useEffect(() => {
    setLeft(30);
    const timer = setInterval(() => setLeft((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(timer);
  }, [sends]);
  return canResend ? 0 : Math.max(1, left);
}

function CodeStep({ view }: { view: GateView }) {
  const { t, locale } = useI18n();
  const lookup = useAfter((s) => s.lookup);
  const left = useLeft(lookup.sends, lookup.canResend);
  const first = useRef(false);
  useEffect(() => {
    if (first.current) return;
    first.current = true;
    document.getElementById("ma-code-0")?.focus();
  }, []);

  const digits = lookup.digits;
  const setDigits = (next: string, focusAt?: number) => {
    typeLookup({ digits: next.replace(/\D/g, "").slice(0, 6) });
    if (focusAt !== undefined) focusSoon(`ma-code-${Math.max(0, Math.min(5, focusAt))}`);
  };
  const check = async () => {
    const done = await checkCode(view);
    if (done === "fix") focusSoon(`ma-code-${Math.min(5, useAfter.getState().lookup.digits.length)}`);
  };
  const codeErr: MessageKey | null =
    lookup.codeErr === "short"
      ? "after.code.err.short"
      : lookup.codeErr === "wrong"
        ? "after.code.err.wrong"
        : lookup.codeErr === "spent"
          ? "after.code.err.spent"
          : lookup.codeErr === "locked"
            ? "after.code.err.locked"
            : lookup.codeErr === "unreachable"
              ? "after.err.unreachable"
              : null;
  const nf = (n: number, min = 1) => new Intl.NumberFormat(locale, { minimumIntegerDigits: min, useGrouping: false }).format(n);
  const wait = `${nf(Math.floor(left / 60))}:${nf(left % 60, 2)}`;

  return (
    <div className="mp-card ma-code">
      <div className="ma-code-head">
        <span className="ma-icon">
          <Mail size={17} aria-hidden="true" />
        </span>
        <div>
          <div id="ma-code-title" className="ma-strong">
            {t("after.code.title")}
          </div>
          <div className="ma-muted">{t("after.code.sent", { email: lookup.email.trim() })}</div>
        </div>
      </div>
      <div role="group" aria-labelledby="ma-code-title" aria-describedby={codeErr === null ? undefined : "ma-code-err"} dir="ltr" className="ma-digits">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <input
            key={i}
            id={`ma-code-${i}`}
            className="ma-digit mp-mono"
            value={digits[i] ?? ""}
            inputMode="numeric"
            maxLength={6}
            autoComplete="one-time-code"
            aria-label={t("after.code.digit", { n: nf(i + 1), all: nf(6) })}
            aria-invalid={codeErr !== null}
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              const typed = e.target.value.replace(/\D/g, "");
              if (typed === "") {
                setDigits(digits.slice(0, i) + digits.slice(i + 1));
                return;
              }
              setDigits((digits.slice(0, i) + typed).slice(0, 6), i + typed.length);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") void check();
              if (e.key === "Backspace" && (digits[i] ?? "") === "" && i > 0) {
                e.preventDefault();
                setDigits(digits.slice(0, i - 1), i - 1);
              }
            }}
            onPaste={(e: ClipboardEvent<HTMLInputElement>) => {
              const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
              if (pasted.length > 1) {
                e.preventDefault();
                setDigits(pasted, pasted.length - 1);
              }
            }}
          />
        ))}
      </div>
      {codeErr !== null && <FieldError id="ma-code-err">{t(codeErr)}</FieldError>}
      <div className="ma-row">
        <button type="button" className="mp-button mp-button--accent" onClick={() => void check()} aria-busy={lookup.busy || undefined}>
          {lookup.busy ? t("after.code.checking") : t("after.code.open")}
        </button>
        <button type="button" className="mp-link ma-resend" aria-disabled={left > 0} onClick={() => void resendCode().then((sent) => sent && focusSoon("ma-code-0"))}>
          {left > 0 ? t("after.code.resendIn", { time: wait }) : t("after.code.resend")}
        </button>
        <button type="button" className="mp-link ma-back-link" onClick={() => backToFind()}>
          {t("after.code.back")}
        </button>
      </div>
    </div>
  );
}
