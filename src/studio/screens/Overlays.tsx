/**
 * The overlays over the works' screens: the send-a-proof sheet and the
 * spoilage dialog (comp `I - Marlow Press` 1388-1430), the delivery quote
 * drawn on the proof sheet's anatomy (plan CR16, CR17), and the add-ons'
 * dialogs (`AddOnOverlays`). Each is a dialog with its own label, focus kept
 * inside it and given back to what opened it, closed by Escape.
 */
import { useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { CircleAlert, FileText, FileUp, Scissors, X } from "lucide-react";

import { sendDeliveryQuote, sendProof, customerOf, typedAmount } from "../actions.ts";
import { useData, useEnv, useRun } from "../env.tsx";
import { byId, isSheetWork, jobById, orderOf, refOf, versionOf } from "../facts.ts";
import { useFmt } from "../format.ts";
import { useWorks } from "../store.ts";
import { Mono, Typed } from "../ui.tsx";
import { num, text, type Row } from "../wire.ts";
import type { ProofFile } from "../door.ts";
import { close, Modal } from "./Modal.tsx";
import { AddOnOverlays } from "./AddOns.tsx";
import { useT } from "../../i18n/index.tsx";

/** What the proofs table's `file` column takes: a PDF, up to 100 MB (`manifest/tables.ts`). */
export const PROOF_MAX_MB = 100;
/** The most sheets one spoilage records, as the spoils table's `qty` allows. */
export const SPOIL_MAX = 5000;

export function Overlays() {
  const overlay = useWorks((s) => s.overlay);
  const data = useWorks((s) => s.data);
  if (overlay === null || data === null) return null;
  switch (overlay.kind) {
    case "proof": {
      const job = jobById(data, overlay.jobId);
      return job === undefined ? null : <ProofSheet job={job} />;
    }
    case "spoil": {
      const job = jobById(data, overlay.jobId);
      return job === undefined ? null : <SpoilDialog job={job} />;
    }
    case "quote": {
      const order = byId(data.orders, overlay.orderId);
      return order === undefined ? null : <QuoteSheet order={order} />;
    }
    default:
      return <AddOnOverlays />;
  }
}

type Picked = { name: string; size: number | null; file: ProofFile };

function ProofSheet({ job }: { job: Row }) {
  const t = useT();
  const fmt = useFmt();
  const data = useData();
  const { door } = useEnv();
  const { busy, run } = useRun();
  const titleId = useId();
  const errId = useId();
  const input = useRef<HTMLInputElement>(null);
  const order = orderOf(data, job);
  const version = job["design_id"] === null || job["design_id"] === undefined ? undefined : versionOf(data, job);
  const fromDesign = text(version?.["proof_file"]);
  const [picked, setPicked] = useState<Picked | null>(
    fromDesign === null ? null : { name: t("works.proofSheet.fromDesign", { version: fmt.number(version?.["version"] ?? 1) }), size: null, file: { copyOf: fromDesign } },
  );
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<"email" | "post">(job["proof_by_post"] === true ? "post" : "email");
  const [note, setNote] = useState("");
  const ref = refOf(data, job);
  const customer = customerOf(order);
  const paid = job["proof_by_post"] === true;
  const postDays = num(job["proof_post_days"]) ?? num(data.settings?.["proof_post_days"]) ?? 0;

  const take = (list: FileList | null) => {
    const file = list?.[0];
    if (file === undefined) return;
    const ext = file.name.includes(".") ? (file.name.split(".").pop() ?? "").toLowerCase() : "";
    if (ext !== "pdf") return void (setPicked(null), setError(t("works.proofSheet.notPdf")));
    if (file.size > PROOF_MAX_MB * 1048576) return void (setPicked(null), setError(t("works.proofSheet.tooBig", { mb: fmt.number(PROOF_MAX_MB) })));
    setError(null);
    setPicked({ name: file.name, size: file.size, file: { blob: file, filename: file.name } });
  };
  const send = () => {
    if (picked === null) {
      setError(t("works.proofSheet.missing"));
      return;
    }
    void run(async (d, fresh) => {
      await sendProof(d, fresh, jobById(fresh, job.id) ?? job, { file: picked.file, kind, note: note.trim() === "" ? null : note.trim() }, door.who());
      close();
      return t("works.proofSheet.sent", { customer });
    });
  };
  const radio = (value: "email" | "post", title: string, sub: string) => (
    <button type="button" role="radio" aria-checked={kind === value} className="wk-radio" onClick={() => setKind(value)}>
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
          {t("works.proofSheet.title")}
        </h2>
        <button type="button" className="wk-close" aria-label={t("works.close")} onClick={close}>
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="wk-sheet-body">
        <p className="wk-sheet-lede">{t("works.proofSheet.lede", { ref, customer })}</p>
        <div>
          <div className="wk-field-label">{t("works.proofSheet.file")}</div>
          <input ref={input} type="file" accept=".pdf,application/pdf" className="wk-hidden-input" tabIndex={-1} aria-hidden="true" onChange={(e: ChangeEvent<HTMLInputElement>) => take(e.target.files)} />
          {picked === null ? (
            <button
              type="button"
              className={`wk-drop${error === null ? "" : " wk-drop--bad"}`}
              aria-describedby={error === null ? undefined : errId}
              onClick={() => input.current?.click()}
              onDragOver={(e: DragEvent) => e.preventDefault()}
              onDrop={(e: DragEvent) => {
                e.preventDefault();
                take(e.dataTransfer.files);
              }}
            >
              <FileUp size={22} aria-hidden="true" />
              <span className="wk-drop-title">{t("works.proofSheet.drop")}</span>
              <Mono className="wk-drop-sub">{t("works.proofSheet.limit", { mb: fmt.number(PROOF_MAX_MB) })}</Mono>
            </button>
          ) : (
            <div className="wk-filechip">
              <FileText size={18} aria-hidden="true" />
              <span className="wk-filechip-text">
                <Mono className="wk-filechip-name">{picked.name}</Mono>
                {picked.size !== null && <Mono className="wk-filechip-size">{t("works.proofSheet.size", { mb: fmt.number(picked.size / 1048576, 1) })}</Mono>}
              </span>
              <button type="button" className="wk-close wk-close--small" aria-label={t("works.proofSheet.remove")} onClick={() => setPicked(null)}>
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          )}
          {error !== null && (
            <span id={errId} role="alert" className="wk-error">
              <CircleAlert size={13} aria-hidden="true" />
              {error}
            </span>
          )}
        </div>
        <div>
          <div className="wk-field-label" id={`${titleId}-how`}>
            {t("works.proofSheet.how")}
          </div>
          <div className="wk-radios" role="radiogroup" aria-labelledby={`${titleId}-how`}>
            {radio("email", t("works.proofSheet.email"), t("works.proofSheet.emailSub"))}
            {radio("post", paid ? t("works.proofSheet.postPaid", { price: fmt.money(job["proof_price"] ?? data.settings?.["proof_post_price"]) }) : t("works.proofSheet.postOurs"), t("works.proofSheet.postSub", {}, postDays))}
          </div>
        </div>
        <label className="wk-field">
          <span className="wk-field-label">{t("works.proofSheet.note")}</span>
          <textarea className="wk-textarea" rows={3} value={note} placeholder={t("works.proofSheet.notePlaceholder")} onChange={(e) => setNote(e.target.value)} />
        </label>
      </div>
      <div className="wk-sheet-foot">
        <button type="button" className={`wk-btn wk-btn--primary wk-grow${picked === null ? " wk-btn--off" : ""}`} disabled={busy} onClick={send}>
          {t("works.proofSheet.send")}
        </button>
        <button type="button" className="wk-btn" onClick={close}>
          {t("works.cancel")}
        </button>
      </div>
    </Modal>
  );
}

function SpoilDialog({ job }: { job: Row }) {
  const t = useT();
  const fmt = useFmt();
  const data = useData();
  const { busy, run } = useRun();
  const titleId = useId();
  const errId = useId();
  const field = useRef<HTMLInputElement>(null);
  const sheet = isSheetWork(job);
  const [value, setValue] = useState("10");
  const [error, setError] = useState<string | null>(null);
  const ref = refOf(data, job);

  const add = () => {
    const n = Number(value.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0 || (sheet && !Number.isInteger(n))) {
      setError(t(sheet ? "works.spoil.few" : "works.spoil.fewRoll"));
      field.current?.focus();
      return;
    }
    if (n > SPOIL_MAX) {
      setError(t("works.spoil.many", { max: fmt.number(SPOIL_MAX) }));
      field.current?.focus();
      return;
    }
    void run(async (d, fresh) => {
      await d.spoil({ job: jobById(fresh, job.id) ?? job, sheets: n, note: null });
      close();
      return t(sheet ? "works.spoil.done" : "works.spoil.doneRoll", { ref, n: fmt.number(n, 2) });
    });
  };

  return (
    <Modal labelledBy={titleId}>
      <span className="wk-dialog-icon wk-dialog-icon--warn" aria-hidden="true">
        <Scissors size={19} />
      </span>
      <h2 className="wk-dialog-title" id={titleId}>
        {t("works.spoil.title")}
      </h2>
      <p className="wk-dialog-text">{t(sheet ? "works.spoil.lede" : "works.spoil.ledeRoll")}</p>
      <label className="wk-field">
        <span className="wk-field-label">{t(sheet ? "works.spoil.label" : "works.spoil.labelRoll")}</span>
        <input
          ref={field}
          className={`wk-input wk-mono${error === null ? "" : " wk-input--bad"}`}
          inputMode={sheet ? "numeric" : "decimal"}
          value={value}
          aria-invalid={error !== null}
          aria-describedby={error === null ? undefined : errId}
          onChange={(e) => {
            setValue(e.target.value.replace(sheet ? /[^0-9]/g : /[^0-9.,]/g, ""));
            setError(null);
          }}
        />
        {error !== null && (
          <span id={errId} role="alert" className="wk-error">
            {error}
          </span>
        )}
      </label>
      <div className="wk-dialog-foot">
        <button type="button" className="wk-btn wk-btn--ink wk-grow" disabled={busy} onClick={add}>
          {t("works.spoil.add")}
        </button>
        <button type="button" className="wk-btn" onClick={close}>
          {t("works.cancel")}
        </button>
      </div>
    </Modal>
  );
}

/** The delivery bands' heaviest box: what one parcel of an order over the bands weighs at most, and costs. */
export function topBand(data: { bands: Row[] }): Row | undefined {
  return data.bands.filter((b) => num(b["tube"]) !== 1).sort((a, b) => (num(b["max_kg"]) ?? 0) - (num(a["max_kg"]) ?? 0))[0];
}

function QuoteSheet({ order }: { order: Row }) {
  const t = useT();
  const fmt = useFmt();
  const data = useData();
  const { busy, run } = useRun();
  const titleId = useId();
  const errId = useId();
  const band = topBand(data);
  const maxKg = num(band?.["max_kg"]);
  const price = num(band?.["price"]);
  const weight = num(order["weight_kg"]) ?? 0;
  // The ruled starting value (plan CR17): as many of the heaviest band's boxes as the weight needs, at its price. The works types over it.
  const parcels = maxKg === null || maxKg <= 0 ? 0 : Math.ceil(weight / maxKg);
  const start = price === null ? "" : (parcels * price).toFixed(2);
  const [value, setValue] = useState(start);
  const [error, setError] = useState<string | null>(null);
  const customer = customerOf(order);
  const ref = text(order["number"]) ?? "";

  const sendIt = () => {
    const amount = typedAmount(value);
    if (amount === null) {
      setError(t("works.quote.bad"));
      return;
    }
    void run(async (d) => {
      await sendDeliveryQuote(d, order, amount);
      close();
      return t("works.quote.sentToast", { customer });
    });
  };

  return (
    <Modal kind="sheet" labelledBy={titleId}>
      <div className="wk-sheet-head">
        <h2 className="wk-sheet-title" id={titleId}>
          {t("works.quote.title")}
        </h2>
        <button type="button" className="wk-close" aria-label={t("works.close")} onClick={close}>
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="wk-sheet-body">
        <p className="wk-sheet-lede">
          {t("works.quote.lede", { ref, kg: fmt.number(weight, 1), max: fmt.number(maxKg ?? 0) })} <Typed>{customer}</Typed>
        </p>
        <label className="wk-field">
          <span className="wk-field-label">{t("works.quote.field")}</span>
          <span className={`wk-money${error === null ? "" : " wk-money--bad"}`}>
            <input
              className="wk-input wk-mono"
              inputMode="decimal"
              value={value}
              aria-invalid={error !== null}
              aria-describedby={error === null ? `${titleId}-hint` : errId}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
            />
          </span>
          {error === null ? (
            <span id={`${titleId}-hint`} className="wk-field-hint">
              {t("works.quote.hint", { parcels: fmt.number(parcels), max: fmt.number(maxKg ?? 0), price: fmt.money(price) })}
            </span>
          ) : (
            <span id={errId} role="alert" className="wk-error">
              {error}
            </span>
          )}
        </label>
      </div>
      <div className="wk-sheet-foot">
        <button type="button" className="wk-btn wk-btn--primary wk-grow" disabled={busy} onClick={sendIt}>
          {t("works.quote.send")}
        </button>
        <button type="button" className="wk-btn" onClick={close}>
          {t("works.cancel")}
        </button>
      </div>
    </Modal>
  );
}
