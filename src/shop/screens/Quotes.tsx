/**
 * Saved quotes: the customer's own (signed in), and those saved or opened by
 * their own link on this visit. Each is priced afresh on today's rate card
 * (a dry run of the quote as it was saved), keeps the name the customer
 * gives it (a write through the session that reads it), opens on its
 * product's page, or goes into the order. And "Save this quote", the sheet
 * the product's page opens to ask where the quote's link goes.
 */
import { Pencil, Plus, X } from "lucide-react";
import { useEffect, useRef } from "react";

import { useI18n } from "../../i18n/index.tsx";
import {
  addQuoteToBasket,
  closeSaveQuote,
  findOlder,
  listedQuotes,
  loadHeldQuotes,
  openQuote,
  openQuoteLink,
  repriceQuotes,
  saveEmailError,
  saveName,
  saveQuote,
  signedIn,
  typeName,
  typeSaveEmail,
  useAfter,
} from "../after.ts";
import { specOf } from "../after-view.ts";
import { money } from "../format.ts";
import { ProductIcon, tintOf } from "../parts.tsx";
import type { Id } from "../port.ts";
import { productById, useShop } from "../store.ts";
import { Gate, SessionBar } from "./Gate.tsx";
import { linkInAddress, useDay } from "./Order.tsx";

export function QuotesScreen() {
  const { t, locale } = useI18n();
  const port = useShop((s) => s.port);
  const catalogue = useShop((s) => s.catalogue);
  const currency = useShop((s) => s.config.currency);
  const mine = useAfter((s) => s.mine);
  const heldState = useAfter((s) => s.heldState);
  const heldRead = useAfter((s) => s.heldRead);
  const prices = useAfter((s) => s.quotePrices);
  const names = useAfter((s) => s.names);
  const renaming = useAfter((s) => s.renaming);
  const older = useAfter((s) => s.olderGate);
  const link = useAfter((s) => s.quoteLink);
  const day = useDay();

  useEffect(() => {
    if (port === null) return;
    const token = linkInAddress();
    if (token !== null) void openQuoteLink(token);
    else if (useAfter.getState().heldState === "idle") void loadHeldQuotes();
  }, [port]);
  useEffect(() => {
    if (catalogue !== null) void repriceQuotes();
  }, [catalogue, mine, heldRead]);

  const listed = listedQuotes();
  const signed = signedIn();
  const linkAlert =
    link === null ? null : (
      <div role="alert" className="mp-alert mp-alert--danger">
        {t(link === "unknown" ? "after.quotes.linkUnknown" : "after.quotes.linkClosed")}
      </div>
    );
  if (!signed && (older || (heldState !== "loading" && listed.length === 0)))
    return (
      <>
        {linkAlert}
        <SessionBar />
        <Gate view="quotes" />
      </>
    );
  if (catalogue === null) return null;
  return (
    <>
      {linkAlert}
      <SessionBar />
      <section className="mp-screen ma-page ma-page--wide" aria-labelledby="ma-quotes-title">
        <h1 id="ma-quotes-title" className="mp-h1">
          {t("after.quotes.title")}
        </h1>
        <p className="mp-lede">{t("after.quotes.lede")}</p>
        {listed.length === 0 && heldState !== "loading" && <div className="ma-empty">{t("after.quotes.empty")}</div>}
        {!signed && listed.length > 0 && (
          <p className="ma-muted ma-gap">
            {t("after.quotes.visit")}{" "}
            <button type="button" className="mp-link" onClick={() => findOlder()}>
              {t("after.quotes.older")}
            </button>
          </p>
        )}
        <ul className="ma-quotes">
          {listed.map(({ quote, lines }) => {
            const id = String(quote["id"]);
            const first = [...lines].sort((a, b) => Number(a["position"] ?? 0) - Number(b["position"] ?? 0))[0] ?? null;
            const product = first === null ? null : productById(first["product_id"] as Id);
            const productName = String(first?.["product_name"] ?? product?.name ?? "");
            const saved = typeof quote["label"] === "string" ? quote["label"] : "";
            const draft = names[id] ?? saved;
            const dirty = draft.trim() !== saved;
            const priced = prices[id];
            const nameId = `ma-qname-${id}`;
            const save = () => {
              if (dirty) void saveName(id);
            };
            return (
              <li key={id} className="mp-card ma-quote">
                <div className="ma-item-head">
                  <span className={`ma-item-icon ${tintOf(product?.family ?? "other")}`}>
                    <ProductIcon name={product?.icon ?? null} size={20} />
                  </span>
                  <div className="ma-grow">
                    <div className="ma-strong">{saved !== "" ? saved : productName}</div>
                    {saved !== "" && <div className="ma-muted ma-small-text">{productName}</div>}
                    <div className="ma-item-name">
                      <span className="mp-mono ma-faint">{String(quote["number"] ?? "")}</span>
                      <span className="ma-faint">{t("after.quotes.when", { date: day.short(String(quote["created_at"] ?? "")) })}</span>
                    </div>
                  </div>
                  {priced?.state === "ok" ? (
                    <span className="mp-mono ma-total">{money(priced.total, currency, locale)}</span>
                  ) : priced?.state === "failed" ? (
                    <span className="ma-faint">{t("after.again.notPriced")}</span>
                  ) : (
                    <span className="mp-skel ma-skel-price" role="status" aria-label={t("after.again.working")} />
                  )}
                </div>
                <div className="ma-muted">
                  {first === null ? "" : `${specOf(catalogue, first)} · ${new Intl.NumberFormat(locale).format(Number(first["qty"] ?? 1))}`}
                  {lines.length > 1 && ` · ${t("after.quotes.more", undefined, lines.length - 1)}`}
                </div>
                <div className="ma-rename">
                  <label className="mp-sr" htmlFor={nameId}>
                    {t("after.quotes.nameLabel")}
                  </label>
                  <input
                    id={nameId}
                    className="mp-input ma-grow"
                    value={draft}
                    placeholder={t("after.quotes.namePlaceholder")}
                    maxLength={80}
                    onChange={(e) => typeName(id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") save();
                    }}
                  />
                  <button type="button" className={dirty ? "mp-button mp-button--small ma-save-name" : "mp-button mp-button--small ma-save-name ma-save-name--idle"} aria-disabled={!dirty} aria-busy={renaming === id || undefined} onClick={save}>
                    {dirty || saved === "" ? t("after.quotes.saveName") : t("after.quotes.savedName")}
                  </button>
                </div>
                <div className="ma-row ma-row--even">
                  <button type="button" className="mp-button mp-button--small" onClick={() => openQuote(lines)}>
                    <Pencil size={14} aria-hidden="true" />
                    {t("after.quotes.open")}
                  </button>
                  <button type="button" className="mp-button mp-button--accent mp-button--small" onClick={() => void addQuoteToBasket(lines, saved !== "" ? saved : productName)}>
                    <Plus size={14} aria-hidden="true" />
                    {t("after.quotes.add")}
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

/** "Save this quote": the e-mail its link goes to, then the one save. */
export function SaveQuoteSheet() {
  const { t } = useI18n();
  const saving = useAfter((s) => s.saving);
  const input = useRef<HTMLInputElement>(null);
  const opener = useRef<Element | null>(null);
  useEffect(() => {
    if (saving.open) {
      opener.current = document.activeElement;
      input.current?.focus();
    }
  }, [saving.open]);
  if (!saving.open) return null;
  const error = saving.tried ? saveEmailError(saving.email) : null;
  const close = () => {
    closeSaveQuote();
    (opener.current as HTMLElement | null)?.focus?.();
  };
  const submit = async () => {
    const done = await saveQuote();
    if (done) (opener.current as HTMLElement | null)?.focus?.();
    else input.current?.focus();
  };
  return (
    <div className="mp-scrim" onClick={close} onKeyDown={(e) => e.key === "Escape" && close()}>
      <div role="dialog" aria-modal="true" aria-labelledby="ma-save-title" aria-describedby="ma-save-body" className="mp-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ma-dialog-head">
          <h2 id="ma-save-title" className="ma-dialog-title">
            {t("after.save.title")}
          </h2>
          <button type="button" className="mp-icon-button" aria-label={t("shop.close")} onClick={close}>
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <p id="ma-save-body" className="ma-muted">
          {t("after.save.body")}
        </p>
        <label className="mp-field">
          <span className="mp-field-label">{t("after.lookup.email")}</span>
          <input
            ref={input}
            type="email"
            inputMode="email"
            autoComplete="email"
            className="mp-input"
            value={saving.email}
            aria-invalid={error !== null}
            aria-describedby={error === null ? undefined : "ma-save-err"}
            onChange={(e) => typeSaveEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
            }}
          />
          {error !== null && (
            <span id="ma-save-err" role="alert" className="mp-field-error">
              {t(error === "empty" ? "after.save.err.empty" : "after.lookup.err.emailShape")}
            </span>
          )}
        </label>
        {saving.failed !== null && (
          <p role="alert" className="mp-field-error">
            {t(saving.failed === "refused" ? "after.save.refused" : "after.err.unreachable")}
          </p>
        )}
        <div className="ma-row">
          <button type="button" className="mp-button mp-button--accent" aria-busy={saving.busy || undefined} onClick={() => void submit()}>
            {saving.busy ? t("after.save.saving") : t("after.save.cta")}
          </button>
          <button type="button" className="mp-button" onClick={close}>
            {t("after.save.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
