/**
 * Every overlay in the app, and the one Escape handler that closes them.
 *
 * Exactly one overlay is open at a time — the store holds a discriminated union
 * rather than a pile of booleans, so two sheets can never fight over the scrim.
 */

import { Check, CircleCheck, ShieldCheck, Unplug, X } from "lucide-react";
import { useEffect, useState } from "react";

import { resolveActivity, type AddOn } from "../add-ons/host.ts";
import { sampleCatalogue } from "../add-ons/records.ts";
import { useActivityContext } from "../add-ons/useActivityContext.ts";
import { AddOnSlot } from "./AddOnSlot.tsx";
import { Affiliation } from "./Affiliation.tsx";
import { useT, type TFunction } from "../i18n/index.tsx";
import { cents, clock } from "../lib/format.ts";
import { priceQuote } from "../lib/quote.ts";
import { PROOF_BY_POST_CENTS, TAX_RATE } from "../lib/rates.ts";
import { useStore } from "../state/store.ts";
import { NavSheet } from "./Shell.tsx";
import { Field, Mono, Monogram, Switch, Tag } from "./Primitives.tsx";

export function Overlays() {
  const overlay = useStore((s) => s.overlay);
  const close = useStore((s) => s.closeOverlay);
  const openOverlay = useStore((s) => s.openOverlay);

  /*
   * ESCAPE DISMISSES THE TOP OVERLAY — and two of them have something behind
   * them rather than nothing.
   *
   * The consent panel was opened from the connect dialog and the disconnect
   * confirm from the manage drawer, and in both the scrim and the Cancel button
   * step BACK to that dialog rather than closing the lot. Escape used to close
   * everything, so the same overlay answered its three dismissals three
   * different ways and a shop owner who pressed Escape to get out of the
   * confirm lost the drawer they were working in.
   */
  useEffect(() => {
    if (overlay.kind === "none") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (overlay.kind === "consent") openOverlay({ kind: "connect", addOn: overlay.addOn });
      else if (overlay.kind === "disconnect") openOverlay({ kind: "manage", addOn: overlay.addOn });
      else close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlay, close, openOverlay]);

  switch (overlay.kind) {
    case "none":
      return null;
    case "nav":
      return <NavSheet />;
    case "quote-sheet":
      return <QuoteSheet />;
    case "finish-reason":
      return <FinishReason finish={overlay.finish} reason={overlay.reason} />;
    case "proof-sheet":
      return <ProofSheet jobRef={overlay.ref} />;
    case "spoilage":
      return <SpoilageDialog jobRef={overlay.ref} />;
    case "connect":
      return <ConnectDialog addOnKey={overlay.addOn} />;
    case "consent":
      return <ConsentPanel addOnKey={overlay.addOn} />;
    case "manage":
      return <ManageDrawer addOnKey={overlay.addOn} />;
    case "disconnect":
      return <DisconnectConfirm addOnKey={overlay.addOn} />;
    default:
      return null;
  }
}

/** The add-on the open overlay is about, or null if the registry lost it. */
function useAddOn(key: string): AddOn | null {
  const registry = useStore((s) => s.registry);
  return registry.byKey(key) ?? null;
}

function Modal({ title, children, foot }: { title: string; children: React.ReactNode; foot?: React.ReactNode }) {
  const t = useT();
  const close = useStore((s) => s.closeOverlay);
  return (
    <div className="mp-scrim mp-modal-scrim" onClick={close} role="presentation">
      <div className="mp-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="mp-modal-head">
          <span style={{ flex: 1, fontSize: 16, fontWeight: 800 }}>{title}</span>
          <button type="button" className="mp-iconbtn" aria-label={t("common.close")} onClick={close}>
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="mp-modal-body">{children}</div>
        {foot !== undefined && <div className="mp-modal-foot">{foot}</div>}
      </div>
    </div>
  );
}

/** The quote breakdown, for the narrow layout where the panel became a bar. */
function QuoteSheet() {
  const t = useT();
  const config = useStore((s) => s.config);
  if (config === null) return null;
  const quote = priceQuote(config);

  return (
    <Modal title={t("cust.quote.breakdownTitle")}>
      {quote.lines.map((line) => (
        <div key={line.key} className="mp-qrow">
          <div className="mp-qrow-label">{t(`line.${line.key}` as never)}</div>
          <Mono className="mp-qrow-amt">{cents(line.amountCents)}</Mono>
        </div>
      ))}
      <div className="mp-qrow">
        <div className="mp-qrow-label" style={{ fontWeight: 500, color: "var(--fg-muted)" }}>
          {t("line.tax", { pct: Math.round(TAX_RATE * 100) })}
        </div>
        <Mono className="mp-qrow-amt">{cents(quote.taxCents)}</Mono>
      </div>
      <div className="mp-qrow mp-qrow--total">
        <div className="mp-qrow-label">{t("line.total")}</div>
        <Mono className="mp-qrow-amt">{cents(quote.totalCents)}</Mono>
      </div>
    </Modal>
  );
}

/** Why a finish is unavailable — the same words the disabled chip carries. */
function FinishReason({ finish, reason }: { finish: string; reason: string }) {
  const t = useT();
  const close = useStore((s) => s.closeOverlay);
  return (
    <Modal
      title={finish}
      foot={
        <button type="button" className="mp-button mp-btn" onClick={close}>
          {t("common.gotIt")}
        </button>
      }
    >
      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "var(--fg-muted)" }}>{reason}</p>
    </Modal>
  );
}

function ProofSheet({ jobRef }: { jobRef: string }) {
  const t = useT();
  const jobs = useStore((s) => s.jobs);
  const sendProof = useStore((s) => s.sendProof);
  const close = useStore((s) => s.closeOverlay);
  const toast = useStore((s) => s.toast);
  const [note, setNote] = useState("");
  const [how, setHow] = useState<"email" | "post">("email");

  const job = jobs.find((j) => j.ref === jobRef);
  if (job === undefined) return null;

  return (
    <Modal
      title={t("overlay.proof.title")}
      foot={
        <>
          <button
            type="button"
            className="mp-button mp-btn"
            style={{ flex: 1 }}
            onClick={() => {
              sendProof(jobRef, note);
              toast(t("toast.proofSent", { customer: job.customer }), "pos");
            }}
          >
            {t("overlay.proof.send")}
          </button>
          <button type="button" className="mp-button mp-button--ghost mp-btn" onClick={close}>
            {t("common.cancel")}
          </button>
        </>
      }
    >
      <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--fg-muted)" }}>
        {t("overlay.proof.forJob", { ref: job.ref, customer: job.customer })}
      </p>
      <div className="mp-label" style={{ marginBlockEnd: 8 }}>
        {t("overlay.proof.how")}
      </div>
      <div className="mp-stack" style={{ gap: 9, marginBlockEnd: 16 }}>
        {(["email", "post"] as const).map((key) => (
          <button
            key={key}
            type="button"
            className="mp-check mp-btn"
            aria-pressed={how === key}
            onClick={() => setHow(key)}
          >
            <span className="mp-check-box" style={{ borderRadius: 999 }} />
            <span>
              <span style={{ fontSize: 13.5, fontWeight: 700, display: "block" }}>
                {t(key === "email" ? "overlay.proof.email" : "overlay.proof.post")}
              </span>
              <span style={{ fontSize: 12, color: "var(--fg-subtle)" }}>
                {key === "email"
                  ? t("overlay.proof.emailNote")
                  : t("overlay.proof.postNote", { price: cents(PROOF_BY_POST_CENTS) })}
              </span>
            </span>
          </button>
        ))}
      </div>
      <Field label={t("overlay.proof.note")}>
        <textarea
          className="mp-input mp-fld"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("overlay.proof.notePlaceholder")}
        />
      </Field>
    </Modal>
  );
}

/**
 * Spoilage: the one staff action that changes a number the customer never sees.
 * The run takes more sheets and the shelf loses them; the quoted price does not
 * move, and the toast names the new sheet count so the change is visible.
 */
function SpoilageDialog({ jobRef }: { jobRef: string }) {
  const t = useT();
  const addSpoilage = useStore((s) => s.addSpoilage);
  const close = useStore((s) => s.closeOverlay);
  const toast = useStore((s) => s.toast);
  const [sheets, setSheets] = useState("10");

  return (
    <Modal
      title={t("overlay.spoil.title")}
      foot={
        <>
          <button
            type="button"
            className="mp-button mp-btn"
            style={{ flex: 1 }}
            onClick={() => {
              addSpoilage(jobRef, Number(sheets));
              const job = useStore.getState().jobs.find((j) => j.ref === jobRef);
              const total = job === undefined ? 0 : job.spoiledSheets;
              toast(t("toast.spoilage", { ref: jobRef, sheets: total }), "warn");
            }}
          >
            {t("overlay.spoil.confirm")}
          </button>
          <button type="button" className="mp-button mp-button--ghost mp-btn" onClick={close}>
            {t("common.cancel")}
          </button>
        </>
      }
    >
      <p style={{ margin: "0 0 15px", fontSize: 13, lineHeight: 1.5, color: "var(--fg-muted)" }}>
        {t("overlay.spoil.body")}
      </p>
      <Field label={t("overlay.spoil.field")}>
        <input
          className="mp-input mp-input--mono mp-fld"
          type="number"
          min={1}
          value={sheets}
          onChange={(e) => setSheets(e.target.value)}
        />
      </Field>
    </Modal>
  );
}

/* ── The add-on chrome ───────────────────────────────────────────────────── */

function AddOnHead({ addOn, sub }: { addOn: AddOn; sub?: React.ReactNode }) {
  const t = useT();
  const close = useStore((s) => s.closeOverlay);
  return (
    <div className="mp-modal-head">
      <Monogram letters={addOn.monogram} />
      <span style={{ flex: 1, minInlineSize: 0 }}>
        <span style={{ display: "block", fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em" }}>
          {t("shop.connect.title", { name: addOn.name })}
        </span>
        {sub}
      </span>
      <button type="button" className="mp-iconbtn" aria-label={t("common.close")} onClick={close}>
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

/** The ticked rows, used verbatim by the dialog, the consent panel and the drawer. */
function Permissions({ addOn, t, muted = false }: { addOn: AddOn; t: TFunction; muted?: boolean }) {
  return (
    <div className="mp-stack" style={{ gap: muted ? 7 : 8 }}>
      {addOn.permissions.map((permission) => (
        <div key={permission.key} className={muted ? "mp-perm mp-perm--plain" : "mp-perm"}>
          <Check size={15} aria-hidden="true" />
          <span>{t(permission.key as never)}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * One dialog, three shapes (24 §5.6).
 *
 * The three `connect` kinds differ only in the credential step, and the parts
 * that do NOT differ are the point: the plain sentence, the explicit permission
 * list, and "You can disconnect at any time." A shop owner reads the same
 * shape every time and only the middle changes.
 */
function ConnectDialog({ addOnKey }: { addOnKey: string }) {
  const t = useT();
  const addOn = useAddOn(addOnKey);
  const close = useStore((s) => s.closeOverlay);
  const connect = useStore((s) => s.connectAddOn);
  const openOverlay = useStore((s) => s.openOverlay);
  const toast = useStore((s) => s.toast);
  const settings = useStore((s) => s.addOnSettings);
  const patch = useStore((s) => s.patchAddOnSettings);
  const authorized = useStore((s) => s.authorizedAddOns);

  /*
   * The two credential fields live HERE and nowhere else — not in the store,
   * not in localStorage, not in a settings record the browser can read back
   * (24 D15). They exist while the dialog is open and are dropped with it.
   */
  const [apiKey, setApiKey] = useState("");
  const [account, setAccount] = useState("");

  if (addOn === null) return null;

  /*
   * "Use the demo instead" is DECLARED by the add-on (24 D11), not recognised
   * by the host. An add-on that reaches a third party names which of its own
   * settings means "do not reach it" and supplies the words for the switch;
   * this dialog flips that setting and skips the credential fields while it is
   * on, without ever learning that the third party is a delivery company.
   */
  const demoSwitch = addOn.demoSwitch;
  const demo =
    demoSwitch === undefined ? false : (settings[addOn.key]?.[demoSwitch.key] ?? false) === true;
  const isAuthorized = authorized.has(addOn.key);
  const credentialsReady =
    addOn.connect === "none" ||
    (addOn.connect === "api-key" && (demo || (apiKey.trim() !== "" && account.trim() !== ""))) ||
    (addOn.connect === "oauth2" && isAuthorized);

  return (
    <div className="mp-scrim mp-modal-scrim" onClick={close} role="presentation">
      <div
        className="mp-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={t("shop.connect.title", { name: addOn.name })}
      >
        <AddOnHead addOn={addOn} />

        <div className="mp-modal-body mp-stack" style={{ gap: 17 }}>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--fg-muted)" }}>
            {t(addOn.whatKey as never)}
          </p>

          <div>
            <div className="mp-eyebrow" style={{ marginBlockEnd: 9 }}>
              {t("shop.connect.canDo")}
            </div>
            <Permissions addOn={addOn} t={t} />
          </div>

          {/* `none` — the honest answer, said out loud rather than left as an
              empty credential form for the shop to puzzle over. */}
          {addOn.connect === "none" && (
            <div className="mp-note mp-note--pos">
              <ShieldCheck size={16} aria-hidden="true" />
              <span>{t("shop.connect.noAccount")}</span>
            </div>
          )}

          {addOn.connect === "api-key" && (
            <div className="mp-stack" style={{ gap: 13 }}>
              <div className="mp-eyebrow">{t("shop.connect.credentials")}</div>
              {/* ON by default (D11). A live demo that reached the real service
                  on every visitor click would be a defect, not a feature. */}
              {demoSwitch !== undefined && (
                <Switch
                  on={demo}
                  label={t(demoSwitch.labelKey as never)}
                  note={t((demo ? demoSwitch.noteOnKey : demoSwitch.noteOffKey) as never)}
                  onChange={(next) => patch(addOn.key, { [demoSwitch.key]: next })}
                />
              )}
              <Field label={t("shop.connect.apiKey")}>
                <input
                  className="mp-input mp-input--mono mp-fld"
                  type="password"
                  autoComplete="off"
                  disabled={demo}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="••••••••••••••••"
                />
              </Field>
              <Field label={t("shop.connect.accountNumber")}>
                <input
                  className="mp-input mp-input--mono mp-fld"
                  type="password"
                  autoComplete="off"
                  disabled={demo}
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  placeholder="••••••••"
                />
              </Field>
            </div>
          )}

          {addOn.connect === "oauth2" && (
            <div className="mp-panel" style={{ padding: 14, background: "var(--surface-2)" }}>
              {isAuthorized ? (
                <>
                  <div className="mp-row" style={{ flexWrap: "nowrap" }}>
                    <CircleCheck size={18} aria-hidden="true" style={{ color: "var(--pos)" }} />
                    <span style={{ fontSize: 13.5, fontWeight: 700 }}>
                      {t("addon.host.connect.authorized")}
                    </span>
                    {/* The add-on's own fact, carried on the add-on object. */}
                    <Mono style={{ fontSize: 12, color: "var(--fg-subtle)", marginInlineStart: "auto" }}>
                      {addOn.account ?? ""}
                    </Mono>
                  </div>
                  {/*
                    AC7. An account name beside a green tick is the most
                    convincing thing on this dialog, and no account was ever
                    contacted. The consent screen says so — but a shop owner who
                    reopens Connect later never sees the consent screen again.
                   */}
                  <p style={{ margin: "9px 0 0", fontSize: 12, lineHeight: 1.45, color: "var(--fg-subtle)" }}>
                    {t("addon.host.connect.simulated")}
                  </p>
                </>
              ) : (
                <div className="mp-row" style={{ gap: 12 }}>
                  <span style={{ fontSize: 13, color: "var(--fg-muted)", flex: 1, minInlineSize: 180 }}>
                    {t("addon.host.connect.authNote")}
                  </span>
                  <button
                    type="button"
                    className="mp-button mp-button--ghost mp-btn"
                    style={{ padding: "10px 15px", fontSize: 13 }}
                    onClick={() => openOverlay({ kind: "consent", addOn: addOn.key })}
                  >
                    {t("shop.connect.authorize")}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="mp-stack" style={{ gap: 6 }}>
            <span style={{ fontSize: 12.5, color: "var(--fg-muted)" }}>
              {t("shop.connect.disconnectAny")}
            </span>
            <Affiliation addOn={addOn} />
          </div>
        </div>

        <div className="mp-modal-foot" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="mp-button mp-button--ghost mp-btn" onClick={close}>
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className="mp-button mp-btn"
            disabled={!credentialsReady}
            onClick={() => {
              connect(addOn.key);
              // The toast and the dock's toggle come from the same `enabled`
              // set, so the two controls cannot end up disagreeing.
              toast(t("toast.addonConnected", { name: addOn.name }), "pos");
            }}
          >
            {t("shop.addons.connect")}
          </button>
        </div>
      </div>
    </div>
  );
}

/** The same permission list again, in the words the account holder agrees to. */
function ConsentPanel({ addOnKey }: { addOnKey: string }) {
  const t = useT();
  const addOn = useAddOn(addOnKey);
  const authorize = useStore((s) => s.authorizeAddOn);
  const openOverlay = useStore((s) => s.openOverlay);
  if (addOn === null) return null;

  const back = () => openOverlay({ kind: "connect", addOn: addOn.key });

  return (
    <div className="mp-scrim mp-modal-scrim" onClick={back} role="presentation">
      <div
        className="mp-modal mp-modal--narrow"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={t("shop.consent.title")}
      >
        <div className="mp-modal-body mp-stack" style={{ gap: 14 }}>
          <Monogram letters={addOn.monogram} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, marginBlockEnd: 6 }}>
              {t("shop.consent.title")}
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "var(--fg-muted)" }}>
              {t("shop.consent.body", { name: addOn.name })}
            </p>
          </div>
          <Permissions addOn={addOn} t={t} muted />
          <p style={{ margin: 0, fontSize: 12, color: "var(--fg-subtle)" }}>
            {t("addon.host.connect.simulated")}
          </p>
          <Affiliation addOn={addOn} />
        </div>
        <div className="mp-modal-foot">
          <button
            type="button"
            className="mp-button mp-btn"
            style={{ flex: 1 }}
            onClick={() => authorize(addOn.key)}
          >
            {t("shop.consent.allow")}
          </button>
          <button type="button" className="mp-button mp-button--ghost mp-btn" onClick={back}>
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * The manage drawer for a connected add-on.
 *
 * THE SETTINGS SECTION IS A SLOT, not three branches on `addOn.key`. It used to
 * be the latter — one block per add-on, each naming its key and its fields —
 * and the argument for it was sound as far as it went: a generic form built
 * from `{ key, kind }` would give a shop six checkboxes and no idea what
 * turning one off does, because every setting here carries a SENTENCE and a
 * sentence is not something a schema can supply.
 *
 * The right conclusion from that argument is not that the host should write the
 * sentences. It is that the ADD-ON should, which is what `settings.add-on.panel`
 * is for and why §5.4 declared it. The add-on owns the control and the sentence
 * together; the drawer owns the heading above them and the disconnect below.
 * An add-on that has nothing to set fills the slot anyway and says so in its
 * own words — and one that does not fill it at all gets the fallback.
 */
function ManageDrawer({ addOnKey }: { addOnKey: string }) {
  const t = useT();
  const addOn = useAddOn(addOnKey);
  const close = useStore((s) => s.closeOverlay);
  const openOverlay = useStore((s) => s.openOverlay);
  const patch = useStore((s) => s.patchAddOnSettings);
  /*
   * The add-on declares its history relative — "39 minutes ago, about your most
   * recent job" — and this works dates it. The shelf in `Extras.tsx` reads the
   * SAME context from the same hook, which is what stops the two screens
   * disagreeing about when a seeded line happened.
   */
  const activityContext = useActivityContext();
  if (addOn === null) return null;
  const activity = resolveActivity(addOn.activity, activityContext);

  return (
    <div className="mp-scrim mp-drawer-scrim" onClick={close} role="presentation">
      <aside
        className="mp-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={t("shop.manage.title", { name: addOn.name })}
      >
        <div className="mp-modal-head">
          <Monogram letters={addOn.monogram} />
          <span style={{ flex: 1, minInlineSize: 0 }}>
            <span style={{ display: "block", fontSize: 16, fontWeight: 800 }}>{addOn.name}</span>
            <Tag tone="pos">
              <Check size={11} aria-hidden="true" />
              {t("shop.addons.connected")}
            </Tag>
          </span>
          <button type="button" className="mp-iconbtn" aria-label={t("common.close")} onClick={close}>
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="mp-drawer-body">
          <section>
            <div className="mp-eyebrow" style={{ marginBlockEnd: 9 }}>
              {t("shop.manage.permissions")}
            </div>
            <Permissions addOn={addOn} t={t} muted />
          </section>

          <section>
            <div className="mp-eyebrow" style={{ marginBlockEnd: 10 }}>
              {t("shop.manage.settings")}
            </div>

            {/*
              SLOT 5 of 6 — `settings.add-on.panel`, scoped to the add-on this
              drawer is managing. The add-on renders its own form, including the
              sentence under every control; the fallback is for one that fills
              no panel at all.
             */}
            <AddOnSlot
              slot="settings.add-on.panel"
              forAddOn={addOn.key}
              payload={{
                patch: (values: Record<string, unknown>) => patch(addOn.key, values),
                // What the host knows and no add-on does: its own catalogue,
                // one job per family. Nothing is estimated here — an add-on
                // with an opinion about these forms it with its own engine.
                samples: sampleCatalogue((productKey: string) =>
                  t(`data.product.${productKey}` as never),
                ),
              }}
              fallback={
                <div style={{ fontSize: 12.5, color: "var(--fg-muted)" }}>
                  {t("addon.host.manage.noSettings")}
                </div>
              }
            />
          </section>

          <section>
            <div className="mp-eyebrow" style={{ marginBlockEnd: 9 }}>
              {t("shop.manage.activity")}
            </div>
            {/* The add-on's own record, in its own words. A real install reads
                the same list out of `adminium_audit_log` (24 §5.7). */}
            <div className="mp-stack" style={{ gap: 6 }}>
              {/*
                AC7. Timestamps, job references and "collection booked" are
                exactly what a real integration's audit trail looks like, and a
                reviewer could screenshot this list and read it as one. It is
                seeded, so it says so — above the lines, because a caption
                under them is read after the damage.
               */}
              {/*
                READ `activity.length`, NEVER `addOn.activity.length`. An entry
                naming a reference this works has not got is dropped by
                `resolveActivity`, so the declared list can be longer than the
                one on screen — and an add-on that seeded three lines into a
                works with one job must not caption an empty list "these are
                seeded" or, worse, claim it has never been used while three
                lines are drawn underneath.
               */}
              {activity.length > 0 && (
                <span style={{ fontSize: 12, lineHeight: 1.45, color: "var(--fg-subtle)" }}>
                  {t("addon.host.manage.activitySeeded")}
                </span>
              )}
              {activity.map((entry, i) => (
                <Mono key={`${entry.iso}-${i}`} className="mp-activity">
                  {t(entry.messageKey as never, {
                    when: clock(entry.iso, entry.hour, entry.minute),
                    ref: entry.ref,
                  })}
                </Mono>
              ))}
              {activity.length === 0 && (
                <span style={{ fontSize: 12.5, color: "var(--fg-subtle)" }}>
                  {t("shop.manage.noActivity")}
                </span>
              )}
            </div>
          </section>

          <Affiliation addOn={addOn} />
        </div>

        <div className="mp-drawer-foot">
          <button
            type="button"
            className="mp-button mp-button--ghost mp-btn mp-button--block mp-danger-hover"
            onClick={() => openOverlay({ kind: "disconnect", addOn: addOn.key })}
          >
            <Unplug size={15} aria-hidden="true" />
            {t("shop.manage.disconnect")}
          </button>
        </div>
      </aside>
    </div>
  );
}

/**
 * The confirm that names what disappears and what stays (24 D16).
 *
 * Two labelled blocks, never one paragraph: "are you sure?" teaches a shop
 * owner nothing, and the fear it leaves behind is that switching an add-on off
 * might take the work with it. It does not, and this is where that is said.
 */
function DisconnectConfirm({ addOnKey }: { addOnKey: string }) {
  const t = useT();
  const addOn = useAddOn(addOnKey);
  const disconnect = useStore((s) => s.disconnectAddOn);
  const openOverlay = useStore((s) => s.openOverlay);
  const toast = useStore((s) => s.toast);
  if (addOn === null) return null;

  const back = () => openOverlay({ kind: "manage", addOn: addOn.key });

  return (
    <div className="mp-scrim mp-modal-scrim" onClick={back} role="presentation">
      <div
        className="mp-modal mp-modal--narrow"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={t("shop.manage.disconnectTitle", { name: addOn.name })}
      >
        <div className="mp-modal-body mp-stack" style={{ gap: 14 }}>
          <span className="mp-danger-mark" aria-hidden="true">
            <Unplug size={19} />
          </span>
          <div style={{ fontSize: 16, fontWeight: 800 }}>
            {t("shop.manage.disconnectTitle", { name: addOn.name })}
          </div>

          <div>
            <div className="mp-eyebrow" style={{ marginBlockEnd: 6 }}>
              {t("shop.manage.disconnectGoes")}
            </div>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "var(--fg-muted)" }}>
              {t(addOn.disconnect?.goesKey as never)}
            </p>
          </div>
          <div>
            <div className="mp-eyebrow" style={{ marginBlockEnd: 6 }}>
              {t("shop.manage.disconnectKeeps")}
            </div>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "var(--fg-muted)" }}>
              {t(addOn.disconnect?.staysKey as never)}
            </p>
          </div>

          {/*
           * 24 AC6 — THE FOURTH SURFACE, AND THE ONE IT WAS MISSING FROM.
           *
           * Connect, consent and manage all carried the line; this confirm puts
           * the company's name in its own heading twice (the visible title and
           * the dialog's accessible name) and said nothing. The maker's bench
           * has carried it here since round 4, which is the whole of why it was
           * worth re-reading every surface in this app rather than the one that
           * was reported.
           */}
          <Affiliation addOn={addOn} />
        </div>

        <div className="mp-modal-foot">
          <button
            type="button"
            className="mp-button mp-button--danger mp-btn"
            style={{ flex: 1 }}
            onClick={() => {
              disconnect(addOn.key);
              toast(t("toast.addonDisconnected", { name: addOn.name }));
            }}
          >
            {t("shop.manage.disconnect")}
          </button>
          <button type="button" className="mp-button mp-button--ghost mp-btn" onClick={back}>
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Toasts() {
  const toasts = useStore((s) => s.toasts);
  if (toasts.length === 0) return null;
  return (
    <div className="mp-toasts" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={toast.tone === "neutral" ? "mp-toast" : `mp-toast mp-toast--${toast.tone}`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
