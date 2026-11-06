/**
 * "Send your artwork": the customer's own files for one job of the basket.
 *
 * Each file is refused at once when it is not a PDF, TIFF or JPEG or is over
 * the works' cap, else sent to Adminium (which keeps it for the order and
 * judges it again by its bytes) while its five checks are read in the
 * browser. The checks are advice: a warning, or worse, asks the customer to
 * say they are happy with it, and what the checks said is stored with the
 * file. A person checks every file before the proof goes out.
 */
import { ArrowLeft, ArrowRight, Check, CircleCheck, CircleX, CloudUpload, FileImage, FileText, FileX, Files, Gauge, Palette, ScanLine, ScanSearch, TriangleAlert, Type, Upload, UserCheck, X } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";

import { useI18n, type MessageKey } from "../../i18n/index.tsx";
import { ARTWORK_ACCEPT, BLEED_MM, extensionOf, needsAcceptance, type CheckRow } from "../checks.ts";
import { fileSize } from "../format.ts";
import { tintOf } from "../parts.tsx";
import { acceptFile, addFiles, artworkState, continueArtwork, dropFile, editLine, lineOf, productById, startOver, useShop, type ArtFile } from "../store.ts";

const ICON = { pos: Check, warn: TriangleAlert, danger: CircleX, info: ScanSearch } as const;

function Row({ row, accepted }: { row: CheckRow; accepted: boolean }) {
  const { t } = useI18n();
  const settled = accepted && (row.level === "warn" || row.level === "danger");
  const Icon = settled ? Check : ICON[row.level];
  return (
    <li className={`mp-check mp-check--${row.level}${settled ? " mp-check--accepted" : ""}`}>
      <Icon size={16} aria-hidden="true" />
      <span>{t(row.key, row.params)}</span>
    </li>
  );
}

function FileCard({ file, family, onResend }: { file: ArtFile; family: string; onResend: () => void }) {
  const { t, locale } = useI18n();
  const size = fileSize(file.size, locale);
  const pdf = extensionOf(file.name) === "pdf";
  const rows = file.rows;
  const asks = file.status === "in" && rows !== null && needsAcceptance(rows);
  const danger = file.status === "in" && rows !== null && rows.some((r) => r.level === "danger");
  const dot = file.status === "refused" || (danger && !file.accepted) ? "danger" : file.status === "uploading" ? "info" : asks && !file.accepted ? "warn" : "pos";
  return (
    <li className={file.status === "refused" ? "mp-file mp-file--refused" : "mp-file"}>
      <div className={file.status === "refused" ? "mp-file-art" : `mp-file-art ${tintOf(pdf ? family : "image")}`}>
        {file.status === "refused" ? <FileX size={34} aria-hidden="true" /> : pdf ? <FileText size={34} aria-hidden="true" /> : <FileImage size={34} aria-hidden="true" />}
        <span className="mp-file-name">{file.name}</span>
        <span className={`mp-file-dot mp-file-dot--${dot}`} aria-hidden="true" />
      </div>
      <div className="mp-file-body">
        {file.status === "uploading" && (
          <>
            <div className="mp-file-line">
              <strong>{t("shop.artwork.uploading")}</strong>
            </div>
            <div className="mp-progress" role="progressbar" aria-label={t("shop.artwork.uploadingFile", { file: file.name })} />
            <div className="mp-file-line">
              <span className="mp-file-size">{size}</span>
              <button type="button" className="mp-button mp-button--small" aria-label={t("shop.artwork.cancelFile", { file: file.name })} onClick={() => dropFile(file.id)}>
                <X size={13} aria-hidden="true" />
                {t("shop.artwork.cancel")}
              </button>
            </div>
          </>
        )}
        {file.status === "refused" && (
          <>
            <div role="alert" className="mp-refusal">
              <CircleX size={16} aria-hidden="true" />
              <span>{file.refusal === null ? "" : t(file.refusal, { mb: useShop.getState().catalogue?.works.artworkMaxMb ?? 100 })}</span>
            </div>
            <div className="mp-file-line">
              <span className="mp-file-size">{t("shop.artwork.notKept", { size })}</span>
              <button type="button" className="mp-button mp-button--small" aria-label={t("shop.artwork.removeFile", { file: file.name })} onClick={() => dropFile(file.id)}>
                {t("shop.artwork.remove")}
              </button>
            </div>
          </>
        )}
        {file.status === "in" && (
          <>
            <ul className="mp-checks" aria-label={t("shop.artwork.checksOf", { file: file.name })}>
              {rows === null ? <Row row={{ check: "file", level: "info", key: "shop.check.reading" }} accepted={false} /> : rows.map((row) => <Row key={row.check + row.key} row={row} accepted={file.accepted} />)}
            </ul>
            {asks && !file.accepted && (
              <button type="button" className="mp-accept" onClick={() => acceptFile(file.id)}>
                <Check size={14} aria-hidden="true" />
                {t("shop.artwork.accept")}
              </button>
            )}
            {asks && file.accepted && (
              <span className="mp-accepted">
                <Check size={14} aria-hidden="true" />
                {t("shop.artwork.accepted")}
              </span>
            )}
            {danger && (
              <button type="button" className="mp-resend" onClick={onResend}>
                {t("shop.artwork.resend")}
              </button>
            )}
          </>
        )}
      </div>
    </li>
  );
}

const STATUS: Record<Exclude<ReturnType<typeof artworkState>, "empty">, { key: MessageKey; tone: string; icon: typeof Upload }> = {
  uploading: { key: "shop.artwork.status.uploading", tone: "", icon: Upload },
  checking: { key: "shop.artwork.status.checking", tone: "", icon: ScanSearch },
  none: { key: "shop.artwork.status.none", tone: " mp-status--danger", icon: CircleX },
  warn: { key: "shop.artwork.status.warn", tone: " mp-status--warn", icon: TriangleAlert },
  ok: { key: "shop.artwork.status.ok", tone: " mp-status--pos", icon: CircleCheck },
};

const CTA: Record<ReturnType<typeof artworkState>, MessageKey> = {
  empty: "shop.artwork.cta.none",
  uploading: "shop.artwork.cta.uploading",
  checking: "shop.artwork.cta.checking",
  none: "shop.artwork.cta.none",
  warn: "shop.artwork.cta.fix",
  ok: "shop.artwork.cta.go",
};

export function ArtworkScreen() {
  const { t } = useI18n();
  const lineId = useShop((s) => s.artLine);
  const files = useShop((s) => s.artFiles);
  const works = useShop((s) => s.catalogue?.works ?? null);
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const line = lineOf(lineId);
  const product = line === null ? null : productById(line.productId);
  if (line === null || product === null || works === null) return null;
  const state = artworkState(files);
  const status = state === "empty" ? null : STATUS[state];
  const pick = () => input.current?.click();
  const take = (list: FileList | null) => {
    if (list !== null && list.length > 0) addFiles([...list]);
  };
  const onDrop = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setOver(false);
    take(e.dataTransfer?.files ?? null);
  };
  const reqs = [
    { icon: ScanLine, title: t("shop.artwork.req.bleed", { bleed: BLEED_MM }), body: t("shop.artwork.req.bleedBody") },
    { icon: Gauge, title: t("shop.artwork.req.dpi", { dpi: works.minDpi }), body: t("shop.artwork.req.dpiBody") },
    { icon: Palette, title: t("shop.artwork.req.cmyk"), body: t("shop.artwork.req.cmykBody") },
    { icon: Type, title: t("shop.artwork.req.fonts"), body: t("shop.artwork.req.fontsBody") },
    { icon: Files, title: t("shop.artwork.req.pages"), body: t("shop.artwork.req.pagesBody") },
  ];
  return (
    <section className="mp-screen mp-narrow" aria-labelledby="mp-artwork-title">
      <button type="button" className="mp-back" onClick={() => editLine(line.id)}>
        <ArrowLeft size={15} aria-hidden="true" className="mp-flip" /> {t("shop.artwork.back")}
      </button>
      <h1 id="mp-artwork-title" className="mp-h1">
        {t("shop.artwork.title")}
      </h1>
      <p className="mp-lede">{t("shop.artwork.lede", { product: product.name })}</p>
      <div className="mp-card">
        <ul className="mp-reqs" aria-label={t("shop.artwork.reqs")}>
          {reqs.map(({ icon: Icon, title, body }) => (
            <li key={title} className="mp-req">
              <span className="mp-req-icon">
                <Icon size={16} aria-hidden="true" />
              </span>
              <span>
                <span className="mp-req-title">{title}</span>
                <span className="mp-req-body">{body}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <input
        ref={input}
        id="mp-art-input"
        className="mp-file-input"
        type="file"
        multiple
        accept={ARTWORK_ACCEPT}
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          take(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        className={over ? "mp-drop mp-drop--over" : "mp-drop"}
        onClick={pick}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        <span className="mp-drop-icon">
          <CloudUpload size={26} aria-hidden="true" />
        </span>
        <span className="mp-drop-title">{t("shop.artwork.drop")}</span>
        <span className="mp-drop-sub">{t("shop.artwork.kinds", { mb: works.artworkMaxMb })}</span>
      </button>
      {status !== null && (
        <div className="mp-status-wrap">
          <div className={`mp-status${status.tone}`} role="status">
            <status.icon size={19} aria-hidden="true" />
            <span>{t(status.key, { mb: works.artworkMaxMb })}</span>
            <button type="button" className="mp-link" onClick={() => startOver()}>
              {t("shop.artwork.startOver")}
            </button>
          </div>
          <ul className="mp-files" aria-label={t("shop.artwork.files")}>
            {files.map((file) => (
              <FileCard key={file.id} file={file} family={product.family} onResend={pick} />
            ))}
          </ul>
        </div>
      )}
      {state !== "empty" && (
        <button type="button" className="mp-button mp-button--accent mp-button--wide" aria-disabled={state !== "ok"} onClick={() => continueArtwork()}>
          {t(CTA[state], { mb: works.artworkMaxMb })}
          {state === "ok" && <ArrowRight size={16} aria-hidden="true" className="mp-flip" />}
        </button>
      )}
      <p className="mp-note">
        <UserCheck size={16} aria-hidden="true" />
        {t("shop.artwork.person")}
      </p>
      <div className="mp-other-ways">
        <strong>{t("shop.artwork.export.title")}</strong>
        <span>{t("shop.artwork.export.body")}</span>
      </div>
    </section>
  );
}
