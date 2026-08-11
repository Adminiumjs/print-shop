/**
 * The works floor: the board, the job ticket, the jobs list, materials and the
 * price list.
 *
 * The board's one hard rule lives in `jobs.ts`, not here: A LOCKED CARD CANNOT
 * LEAVE PREPRESS, and the refusal names what is missing. This file carries that
 * verdict to a toast — it never decides it, and it never bounces a card back
 * without saying why.
 */

import {
  ArrowLeft,
  Check,
  CircleCheck,
  Ellipsis,
  FileText,
  HandCoins,
  Lock,
  PackageCheck,
  Printer,
  Scissors,
  Send,
  TriangleAlert,
  User,
} from "lucide-react";

import { AddOnSlot } from "../components/AddOnSlot.tsx";
import { outboundOrderFor, shopClock } from "../add-ons/records.ts";
import { EmptyState, Mono, Tag, Tile, Typed } from "../components/Primitives.tsx";
import { useT } from "../i18n/index.tsx";
import { PRODUCT_BY_KEY, type ProductKey } from "../lib/catalogue.ts";
import { cents, day, dueLabel, flatTint, mm, multiplier, num, packagingHint, shortDay } from "../lib/format.ts";
import {
  BOARD_COLUMNS,
  boardKpis,
  columnFor,
  consumptionFor,
  daysBetween,
  dueState,
  isLocked,
  stockLines,
  type BoardColumn,
  type Job,
} from "../lib/jobs.ts";
import { checkArtwork } from "../lib/quote.ts";
import {
  BLEED_MM,
  DELIVERY_BANDS,
  FINISHES,
  LARGE_FORMAT_MINIMUM_CENTS,
  MATERIALS,
  MATERIAL_BY_KEY,
  PACKAGING,
  PRINT_PER_SHEET_CENTS,
  QUANTITY_BREAKS,
  SETUP_CENTS,
  type MaterialKey,
} from "../lib/rates.ts";
import { useStore } from "../state/store.ts";

/* ── 7 · TODAY ───────────────────────────────────────────────────────────── */

export function Today() {
  const t = useT();
  const jobs = useStore((s) => s.jobs);
  const todayIso = useStore((s) => s.todayIso);
  const iso = todayIso();
  const kpis = boardKpis(jobs, iso);

  return (
    <section className="mp-screen">
      <div className="mp-row" style={{ alignItems: "baseline", marginBlockEnd: 16 }}>
        <h1 className="mp-h1" style={{ fontSize: 24, margin: 0 }}>
          {t("shop.today.title")}
        </h1>
        <Mono style={{ fontSize: 12.5, color: "var(--fg-subtle)" }}>{day(iso)}</Mono>
      </div>

      <div className="mp-kpis">
        <Kpi value={kpis.dueToday} label={t("shop.kpi.dueToday")} />
        <Kpi value={kpis.sheetsToday} label={t("shop.kpi.sheets")} />
        <Kpi value={kpis.waitingOnCustomer} label={t("shop.kpi.waiting")} tone="warn" />
        <Kpi value={kpis.overdue} label={t("shop.kpi.overdue")} tone={kpis.overdue > 0 ? "danger" : undefined} />
      </div>

      <div className="mp-board">
        {BOARD_COLUMNS.map((column) => (
          <Column key={column} column={column} iso={iso} />
        ))}
      </div>
    </section>
  );
}

function Kpi({ value, label, tone }: { value: number; label: string; tone?: "warn" | "danger" }) {
  return (
    <div className="mp-kpi" data-tone={tone}>
      <Mono className="mp-kpi-value">{value}</Mono>
      <div className="mp-kpi-label">{label}</div>
    </div>
  );
}

function Column({ column, iso }: { column: BoardColumn; iso: string }) {
  const t = useT();
  const jobs = useStore((s) => s.jobs);
  const dragging = useStore((s) => s.dragging);
  const setDragging = useStore((s) => s.setDragging);
  const moveTo = useStore((s) => s.moveTo);
  const toast = useStore((s) => s.toast);

  const inColumn = jobs.filter((j) => columnFor(j.stage) === column);

  function drop() {
    if (dragging === null) return;
    moveTo(dragging, column);
    const refusal = useStore.getState().lastRefusal;
    if (refusal !== null) toast(t(refusal as never), "warn");
  }

  return (
    <div
      className="mp-column"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        drop();
      }}
    >
      <div className="mp-column-head">
        <span className="mp-column-title">{t(`column.${column}` as never)}</span>
        <Mono style={{ fontSize: 12, fontWeight: 700, color: "var(--fg-subtle)" }}>
          {inColumn.length}
        </Mono>
      </div>
      <div className="mp-column-body">
        {inColumn.map((job) => (
          <JobCard key={job.ref} job={job} iso={iso} onDrag={setDragging} />
        ))}
        {inColumn.length === 0 && (
          <div style={{ padding: "16px 8px", textAlign: "center", fontSize: 12, color: "var(--fg-subtle)" }}>
            {t("common.nothingHere")}
          </div>
        )}
      </div>
    </div>
  );
}

function JobCard({ job, iso, onDrag }: { job: Job; iso: string; onDrag: (ref: string | null) => void }) {
  const t = useT();
  const openTicket = useStore((s) => s.openTicket);
  const boardMenu = useStore((s) => s.boardMenu);
  const setBoardMenu = useStore((s) => s.setBoardMenu);
  const moveTo = useStore((s) => s.moveTo);
  const toast = useStore((s) => s.toast);

  const product = PRODUCT_BY_KEY[job.productKey as ProductKey];
  const state = dueState(job, iso);
  const locked = isLocked(job);

  return (
    <div
      className="mp-jobcard"
      draggable
      onDragStart={() => onDrag(job.ref)}
      onDragEnd={() => onDrag(null)}
      onClick={() => openTicket(job.ref)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openTicket(job.ref);
        }
      }}
    >
      <div className="mp-jobcard-top">
        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span className="mp-famdot" style={{ ["--fam" as string]: flatTint(product.family) }} />
          <Mono style={{ fontSize: 12, fontWeight: 700 }}>{job.ref}</Mono>
          {locked && (
            <Lock size={12} aria-label={t("shop.board.locked")} style={{ color: "var(--warn)" }} />
          )}
        </span>
        {/* Every move is available from this menu too, so the board works without dragging. */}
        <button
          type="button"
          className="mp-iconbtn"
          style={{ inlineSize: 24, blockSize: 24, border: 0, background: "transparent" }}
          aria-label={t("shop.board.moveJob")}
          onClick={(e) => {
            e.stopPropagation();
            setBoardMenu(boardMenu === job.ref ? null : job.ref);
          }}
        >
          <Ellipsis size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="mp-jobcard-title">{t(`data.product.${job.productKey}` as never)}</div>
      <div className="mp-jobcard-spec">
        {num(job.quantity)} · {mm(job.trimWidthMm, job.trimHeightMm)}
      </div>
      <div className="mp-jobcard-foot">
        <span className="mp-jobcard-cust">
          <User size={12} aria-hidden="true" style={{ color: "var(--fg-subtle)" }} />
          {job.customer}
        </span>
        <Tag tone={state === "overdue" ? "danger" : state === "due-soon" || state === "due-today" ? "warn" : "neutral"}>
          <Mono>{dueLabel(daysBetween(iso, job.promisedFor))}</Mono>
        </Tag>
      </div>

      {boardMenu === job.ref && (
        <div className="mp-menu" onClick={(e) => e.stopPropagation()}>
          <div className="mp-menu-head">{t("shop.board.moveTo")}</div>
          {BOARD_COLUMNS.filter((c) => c !== columnFor(job.stage)).map((column) => (
            <button
              key={column}
              type="button"
              className="mp-menu-item"
              onClick={() => {
                moveTo(job.ref, column);
                const refusal = useStore.getState().lastRefusal;
                if (refusal !== null) toast(t(refusal as never), "warn");
              }}
            >
              {t(`column.${column}` as never)}
            </button>
          ))}
          <div style={{ blockSize: 1, background: "var(--border)", margin: "4px 0" }} />
          <button type="button" className="mp-menu-item" onClick={() => openTicket(job.ref)}>
            <FileText size={14} aria-hidden="true" />
            {t("shop.board.openTicket")}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── 8 · JOB TICKET ──────────────────────────────────────────────────────── */

export function Ticket() {
  const t = useT();
  const ref = useStore((s) => s.ticketRef);
  const jobs = useStore((s) => s.jobs);
  const stock = useStore((s) => s.stock);
  const artwork = useStore((s) => s.artwork);
  const go = useStore((s) => s.go);
  const openOverlay = useStore((s) => s.openOverlay);
  const moveTo = useStore((s) => s.moveTo);
  const markCollected = useStore((s) => s.markCollected);
  const toast = useStore((s) => s.toast);
  const todayIso = useStore((s) => s.todayIso);
  const now = useStore((s) => s.now);

  const job = jobs.find((j) => j.ref === ref) ?? null;
  if (job === null) return <EmptyState>{t("common.nothingHere")}</EmptyState>;

  const product = PRODUCT_BY_KEY[job.productKey as ProductKey];
  const use = consumptionFor(job);
  const material = MATERIAL_BY_KEY[job.materialKey as MaterialKey];
  const line = stockLines(stock, jobs).find((l) => l.key === job.materialKey);
  const short = line !== undefined && line.onHand < use.totalSheets;
  const column = columnFor(job.stage);
  const ready = column === "ready";

  return (
    <section className="mp-screen" style={{ maxInlineSize: 920 }}>
      <button type="button" className="mp-footer-link" onClick={() => go("today")}>
        <ArrowLeft size={15} aria-hidden="true" style={{ verticalAlign: "-2px" }} />{" "}
        {t("common.backToBoard")}
      </button>

      <div className="mp-row" style={{ margin: "12px 0 18px" }}>
        <Tile
          family={product.family}
          icon={<Printer size={22} aria-hidden="true" />}
          style={{ inlineSize: 46, blockSize: 46, borderRadius: 11, flex: "0 0 auto" }}
        />
        <div>
          <div className="mp-row" style={{ gap: 9 }}>
            <Mono style={{ fontSize: 18, fontWeight: 700 }}>{job.ref}</Mono>
            <Tag>{t(`column.${column ?? "ready"}` as never)}</Tag>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBlockStart: 2 }}>
            {t(`data.product.${job.productKey}` as never)} · {job.customer}
          </div>
        </div>
        <Tag
          tone={dueState(job, todayIso()) === "overdue" ? "danger" : "neutral"}
        >
          <Mono>{dueLabel(daysBetween(todayIso(), job.promisedFor))}</Mono>
        </Tag>
      </div>

      <div className="mp-ticket">
        <div className="mp-stack" style={{ gap: 16 }}>
          <div className="mp-panel">
            <div className="mp-panel-head">{t("shop.ticket.spec")}</div>
            <div style={{ padding: "4px 15px 10px" }}>
              <SpecRow label={t("shop.ticket.spec.product")} value={t(`data.product.${job.productKey}` as never)} />
              <SpecRow label={t("shop.ticket.spec.material")} value={t(`data.material.${job.materialKey}` as never)} />
              <SpecRow label={t("shop.ticket.spec.finished")} value={<Mono>{mm(job.trimWidthMm, job.trimHeightMm)}</Mono>} />
              <SpecRow
                label={t("shop.ticket.spec.printed")}
                value={<Mono>{mm(job.trimWidthMm + BLEED_MM * 2, job.trimHeightMm + BLEED_MM * 2)}</Mono>}
              />
              <SpecRow label={t("shop.ticket.spec.sides")} value={t(`data.sides.${job.sides}` as never)} />
              <SpecRow label={t("shop.ticket.spec.finish")} value={t(`data.finish.${job.finishKey}` as never)} />
              <SpecRow label={t("shop.ticket.spec.quantity")} value={<Mono>{job.quantity}</Mono>} />
              <SpecRow label={t("shop.ticket.spec.packaging")} value={t(`data.packaging.${job.packagingKey}` as never)} />
              <SpecRow
                label={t("shop.ticket.spec.turnaround")}
                value={t(job.express ? "shop.ticket.turnaround.express" : "shop.ticket.turnaround.standard")}
              />
              <SpecRow label={t("shop.ticket.spec.promise")} value={<Mono>{day(job.promisedFor)}</Mono>} />
            </div>
          </div>

          {/* The ticket's most interesting number. */}
          <div className="mp-impos">
            <div className="mp-eyebrow" style={{ color: "var(--accent)", marginBlockEnd: 6 }}>
              {t("shop.ticket.imposition")}
            </div>
            <div className="mp-impos-line">
              {t("shop.ticket.imposLine", {
                up: use.up,
                sheets: use.totalSheets,
                size: mm(job.trimWidthMm, job.trimHeightMm),
              })}
            </div>
            {use.rotated && (
              <div className="mp-impos-note">
                {t("shop.ticket.imposRotated", { up: use.up, other: use.upIfNotRotated })}
              </div>
            )}
            {job.spoiledSheets > 0 && (
              <div className="mp-impos-note">
                {t("shop.ticket.spoilageNote", { n: job.spoiledSheets }, job.spoiledSheets)}
              </div>
            )}
          </div>

          <div className="mp-panel mp-panel-pad">
            <div style={{ fontSize: 14, fontWeight: 800, marginBlockEnd: 11 }}>
              {t("shop.ticket.artwork")}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 11 }}>
              {artwork
                .filter((a) => a.jobRef === job.ref)
                .map((file) => (
                  <div key={file.filename} style={{ border: "1px solid var(--border)", borderRadius: 11, overflow: "hidden" }}>
                    <Tile
                      family={product.family}
                      icon={<FileText size={24} aria-hidden="true" />}
                      chip={file.filename}
                      style={{ blockSize: 78 }}
                    />
                    <div style={{ padding: "9px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
                      {checkArtwork(file, {
                        product: job.productKey as never,
                        material: job.materialKey as never,
                        size: "a4",
                        sides: job.sides,
                        finish: "none",
                        quantity: job.quantity,
                        packaging: "bundled",
                        printedProof: false,
                        express: false,
                        delivery: "collection",
                      }).map((verdict, i) => (
                        <div key={i} className="mp-verdict" data-level={verdict.level} style={{ fontSize: 11.5 }}>
                          {verdict.level === "pass" ? <Check size={13} /> : <TriangleAlert size={13} />}
                          <span>{t(verdict.key as never, verdict.measured)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              {artwork.filter((a) => a.jobRef === job.ref).length === 0 && (
                <div style={{ fontSize: 12.5, color: "var(--fg-subtle)" }}>{t("common.nothingHere")}</div>
              )}
            </div>
          </div>

          <div className="mp-panel mp-panel-pad">
            <div style={{ fontSize: 14, fontWeight: 800, marginBlockEnd: 11 }}>
              {t("shop.ticket.proofHistory")}
            </div>
            {job.proofs.length === 0 ? (
              <div style={{ fontSize: 12.5, color: "var(--fg-subtle)" }}>{t("shop.ticket.noProof")}</div>
            ) : (
              <div>
                {job.proofs.map((proof, i) => (
                  <div
                    key={i}
                    style={{ display: "flex", gap: 11, alignItems: "flex-start", padding: "9px 0", borderBlockEnd: i < job.proofs.length - 1 ? "1px solid var(--border)" : 0 }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>
                        {t(`cust.proofs.hist.${proof.kind === "change-asked" ? "change" : proof.kind}` as never)}
                      </div>
                      {proof.note !== undefined && (
                        <div style={{ fontSize: 12, color: "var(--fg-muted)", lineHeight: 1.4 }}>
                          <Typed>{proof.note}</Typed>
                        </div>
                      )}
                    </div>
                    <Mono style={{ fontSize: 11, color: "var(--fg-subtle)" }}>{shortDay(proof.at)}</Mono>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mp-stack" style={{ gap: 14 }}>
          <div className="mp-panel mp-panel-pad">
            <div style={{ fontSize: 13, fontWeight: 800, marginBlockEnd: 9 }}>
              {t("shop.ticket.shelf")}
            </div>
            <div className="mp-matline" data-short={short}>
              <Mono style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.4 }}>
                {t("shop.ticket.matLine", {
                  sheets: use.totalSheets,
                  material: t(`data.material.${job.materialKey}` as never),
                })}
              </Mono>
              <div style={{ fontSize: 11.5, marginBlockStart: 4, color: short ? "var(--warn)" : "var(--fg-muted)" }}>
                {short
                  ? t("shop.ticket.matShort", {
                      onHand: line?.onHand ?? 0,
                      short: use.totalSheets - (line?.onHand ?? 0),
                    })
                  : t("shop.ticket.matStock", {
                      onHand: line?.onHand ?? 0,
                      spare: line?.spare ?? 0,
                    })}
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--fg-subtle)", marginBlockStart: 6 }}>
              {material.kind === "sheet" ? t("shop.materials.sheets") : t("shop.materials.metres")}
            </div>
          </div>

          <div className="mp-panel mp-panel-pad">
            <div style={{ fontSize: 13, fontWeight: 800, marginBlockEnd: 11 }}>
              {t("shop.ticket.actions")}
            </div>
            {!ready ? (
              <div className="mp-actions">
                <button
                  type="button"
                  className="mp-action mp-btn"
                  onClick={() => openOverlay({ kind: "proof-sheet", ref: job.ref })}
                >
                  <Send size={16} aria-hidden="true" style={{ color: "var(--accent)" }} />
                  {t("shop.ticket.sendProof")}
                </button>
                <button
                  type="button"
                  className="mp-action mp-btn"
                  onClick={() => {
                    moveTo(job.ref, "finishing");
                    const refusal = useStore.getState().lastRefusal;
                    if (refusal !== null) toast(t(refusal as never), "warn");
                    else toast(t("toast.markedPrinted", { ref: job.ref }));
                  }}
                >
                  <Printer size={16} aria-hidden="true" style={{ color: "var(--info)" }} />
                  {t("shop.ticket.markPrinted")}
                </button>
                <button
                  type="button"
                  className="mp-action mp-btn"
                  onClick={() => openOverlay({ kind: "spoilage", ref: job.ref })}
                >
                  <Scissors size={16} aria-hidden="true" style={{ color: "var(--warn)" }} />
                  {t("shop.ticket.recordSpoilage")}
                </button>
                <button
                  type="button"
                  className="mp-button mp-btn"
                  onClick={() => {
                    moveTo(job.ref, "ready");
                    const refusal = useStore.getState().lastRefusal;
                    if (refusal !== null) toast(t(refusal as never), "warn");
                    else toast(t("toast.markedReady", { ref: job.ref }), "pos");
                  }}
                >
                  <PackageCheck size={16} aria-hidden="true" />
                  {t("shop.ticket.markReady")}
                </button>
              </div>
            ) : job.stage === "collected" ? (
              <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, fontWeight: 700, color: "var(--pos)" }}>
                <CircleCheck size={17} aria-hidden="true" />
                {t("shop.ticket.collected")}
              </div>
            ) : (
              /*
               * SLOT 4 of 4, and the ONLY one that renders NOTHING when empty
               * (24 D6). A works with no carrier connected hands the job over
               * the counter; a dashed "no carriers" panel on the shop floor
               * would be noise nobody can act on. The spacer leaves room for a
               * second action to appear without the row jumping.
               */
              <div className="mp-dispatch-row">
                <button
                  type="button"
                  className="mp-button mp-button--pos mp-btn"
                  onClick={() => {
                    markCollected(job.ref);
                    toast(t("toast.markedCollected", { ref: job.ref }), "pos");
                  }}
                >
                  <HandCoins size={16} aria-hidden="true" />
                  {t("shop.ticket.markCollected")}
                </button>
                {/*
                  * THE JOB, MAPPED INTO THE NEUTRAL ORDER the slot declares.
                  *
                  * It used to be `payload={{ job }}` — this app's own record,
                  * straight across — which is exactly why the delivery add-on
                  * ended up carrying this shop's grammages, size presets,
                  * packaging keys and customer address book: nothing else could
                  * have read a `Job`. `records.ts` does the conversion, which is
                  * the host's job and the seam that makes the add-on portable.
                  */}
                <AddOnSlot
                  slot="order.dispatch.actions"
                  payload={{
                    order: outboundOrderFor(job, (key) => t(`data.product.${key}` as never)),
                    // The works' own clock, so "the van has gone" is about the
                    // works' afternoon — see `records.ts`.
                    now: shopClock(todayIso(), now),
                  }}
                />
                <div className="mp-dispatch-spacer" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function SpecRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="mp-spec-row">
      <span className="mp-spec-label">{label}</span>
      <span className="mp-spec-value">{value}</span>
    </div>
  );
}

/* ── JOBS LIST ───────────────────────────────────────────────────────────── */

export function JobsList() {
  const t = useT();
  const jobs = useStore((s) => s.jobs);
  const openTicket = useStore((s) => s.openTicket);
  const todayIso = useStore((s) => s.todayIso);
  const iso = todayIso();

  return (
    <section className="mp-screen">
      <h1 className="mp-h1" style={{ fontSize: 24, marginBlockEnd: 16 }}>
        {t("shop.jobs.title")}
      </h1>
      <div className="mp-table-wrap">
        <table className="mp-table">
          <thead>
            <tr>
              <th>{t("shop.jobs.col.ref")}</th>
              <th>{t("shop.jobs.col.job")}</th>
              <th>{t("shop.jobs.col.customer")}</th>
              <th>{t("shop.jobs.col.stage")}</th>
              <th className="mp-num">{t("shop.jobs.col.due")}</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.ref} data-clickable="true" onClick={() => openTicket(job.ref)}>
                <td>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                    <span
                      className="mp-famdot"
                      style={{ ["--fam" as string]: flatTint(PRODUCT_BY_KEY[job.productKey as ProductKey].family) }}
                    />
                    <Mono style={{ fontWeight: 700 }}>{job.ref}</Mono>
                  </span>
                </td>
                <td>
                  <span style={{ fontWeight: 700 }}>{t(`data.product.${job.productKey}` as never)}</span>
                  <Mono style={{ display: "block", fontSize: 10.5, color: "var(--fg-subtle)" }}>
                    {num(job.quantity)} · {mm(job.trimWidthMm, job.trimHeightMm)}
                  </Mono>
                </td>
                <td style={{ color: "var(--fg-muted)" }}>{job.customer}</td>
                <td>
                  <Tag>{t(`column.${columnFor(job.stage) ?? "ready"}` as never)}</Tag>
                </td>
                <td className="mp-num">
                  <Tag tone={dueState(job, iso) === "overdue" ? "danger" : "neutral"}>
                    <Mono>{dueLabel(daysBetween(iso, job.promisedFor))}</Mono>
                  </Tag>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ── 9 · MATERIALS ───────────────────────────────────────────────────────── */

export function Materials() {
  const t = useT();
  const stock = useStore((s) => s.stock);
  const jobs = useStore((s) => s.jobs);
  const lines = stockLines(stock, jobs);

  return (
    <section className="mp-screen" style={{ maxInlineSize: 920 }}>
      <h1 className="mp-h1" style={{ fontSize: 24 }}>
        {t("shop.materials.title")}
      </h1>
      <p className="mp-lede">{t("shop.materials.lede")}</p>

      {(["sheet", "roll"] as const).map((kind) => (
        <div key={kind} style={{ marginBlockEnd: 18 }}>
          <div className="mp-eyebrow" style={{ marginBlockEnd: 9 }}>
            {t(`shop.materials.group.${kind}` as never)}
          </div>
          <div className="mp-table-wrap">
            <table className="mp-table">
              <thead>
                <tr>
                  <th>{t("shop.materials.col.stock")}</th>
                  <th className="mp-num">{t("shop.materials.col.onHand")}</th>
                  <th className="mp-num">{t("shop.materials.col.committed")}</th>
                  <th className="mp-num">{t("shop.materials.col.spare")}</th>
                  <th className="mp-num" />
                </tr>
              </thead>
              <tbody>
                {lines
                  .filter((l) => l.kind === kind)
                  .map((line) => (
                    <tr key={line.key} style={line.belowReorder ? { background: "var(--warn-soft)" } : undefined}>
                      <td>
                        <span style={{ fontSize: 13.5, fontWeight: 700 }}>
                          {t(`data.material.${line.key}` as never)}
                        </span>
                        <Mono style={{ display: "block", fontSize: 10.5, color: "var(--fg-subtle)" }}>
                          {kind === "sheet" ? "SRA3" : t("shop.materials.metres")}
                        </Mono>
                      </td>
                      <td className="mp-num">
                        <Mono>{line.onHand}</Mono>
                      </td>
                      <td className="mp-num" style={{ color: "var(--fg-muted)" }}>
                        <Mono>{line.committed}</Mono>
                      </td>
                      <td className="mp-num">
                        <Mono style={{ fontWeight: 700, color: line.spare < 0 ? "var(--danger)" : undefined }}>
                          {line.spare}
                        </Mono>
                      </td>
                      <td className="mp-num">
                        {line.belowReorder && (
                          <Tag tone="warn">
                            <TriangleAlert size={12} aria-hidden="true" />
                            {t("shop.materials.orderMore")}
                          </Tag>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </section>
  );
}

/* ── 10 · PRICE LIST ─────────────────────────────────────────────────────── */

export function Prices() {
  const t = useT();

  return (
    <section className="mp-screen" style={{ maxInlineSize: 860 }}>
      <h1 className="mp-h1" style={{ fontSize: 24 }}>
        {t("shop.prices.title")}
      </h1>
      <p className="mp-lede">{t("shop.prices.lede")}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
        <PriceCard title={t("shop.prices.section.setup")}>
          <PriceRow label={t("line.setup")} value={`${cents(SETUP_CENTS)} ${t("shop.prices.perJob")}`} />
          <PriceRow label={t("shop.prices.perSide")} value={`${cents(PRINT_PER_SHEET_CENTS[1])} ${t("shop.prices.perSheet")}`} />
          <PriceRow label={t("shop.prices.bothSides")} value={`${cents(PRINT_PER_SHEET_CENTS[2])} ${t("shop.prices.perSheet")}`} />
        </PriceCard>

        <PriceCard title={t("shop.prices.section.material")}>
          {MATERIALS.filter((m) => m.kind === "sheet").map((m) => (
            <PriceRow key={m.key} label={t(`data.material.${m.key}` as never)} value={cents(m.rateCents)} />
          ))}
        </PriceCard>

        <PriceCard title={t("shop.prices.section.finishing")}>
          {FINISHES.filter((f) => f.press === "sheet" && f.basis !== "none").map((f) => (
            <PriceRow
              key={f.key}
              label={t(`data.finish.${f.key}` as never)}
              value={`${cents(f.rateCents)} ${f.basis === "per-250-units" ? t("shop.prices.per250") : t("shop.prices.perSheet")}`}
            />
          ))}
        </PriceCard>

        <PriceCard title={t("shop.prices.section.largeFormat")}>
          {MATERIALS.filter((m) => m.kind === "roll").map((m) => (
            <PriceRow key={m.key} label={t(`data.material.${m.key}` as never)} value={cents(m.rateCents)} />
          ))}
          <PriceRow label={t("shop.prices.minimum")} value={cents(LARGE_FORMAT_MINIMUM_CENTS)} />
        </PriceCard>

        <PriceCard title={t("shop.prices.section.packaging")}>
          {PACKAGING.map((p) => (
            <PriceRow
              key={p.key}
              label={t(`data.packaging.${p.key}` as never)}
              value={packagingHint(t as never, p)}
            />
          ))}
          {DELIVERY_BANDS.filter((b) => b.rateCents > 0).map((b) => (
            <PriceRow key={b.key} label={t(`data.delivery.${b.key}` as never)} value={cents(b.rateCents)} />
          ))}
        </PriceCard>

        <div className="mp-panel mp-panel-pad" style={{ gridColumn: "1 / -1" }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, marginBlockEnd: 4 }}>
            {t("shop.prices.breaks")}
          </div>
          <div style={{ fontSize: 12, color: "var(--fg-muted)", marginBlockEnd: 10 }}>
            {t("shop.prices.breaksNote")}
          </div>
          <BreakCurve />
        </div>
      </div>

      <p style={{ margin: "16px 0 0", fontSize: 12.5, color: "var(--fg-subtle)", display: "flex", alignItems: "center", gap: 8 }}>
        <Lock size={14} aria-hidden="true" />
        {t("shop.prices.editedElsewhere")}
      </p>
    </section>
  );
}

function PriceCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mp-panel mp-panel-pad">
      <div style={{ fontSize: 13.5, fontWeight: 800, marginBlockEnd: 10 }}>{title}</div>
      {children}
    </div>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 12,
        padding: "6px 0",
        borderBlockEnd: "1px solid var(--border)",
      }}
    >
      <span style={{ fontSize: 12.5, color: "var(--fg-muted)" }}>{label}</span>
      <Mono style={{ fontSize: 12.5, fontWeight: 700 }}>{value}</Mono>
    </div>
  );
}

/** The break curve, drawn from the same table the engine prices from. */
function BreakCurve() {
  // The chart's accessible name is copy like any other. It was hard-coded
  // English, so a screen-reader user in the other seven locales heard the one
  // string on this screen that had never been translated.
  const t = useT();
  const w = 340;
  const h = 100;
  const points = QUANTITY_BREAKS.map((step, i) => {
    const x = 20 + (i * (w - 40)) / (QUANTITY_BREAKS.length - 1);
    const y = 10 + (1 - (step.multiplier - 0.5) / 0.55) * (h - 30);
    return { x, y, step };
  });

  return (
    <svg
      viewBox={`0 0 ${w} ${h + 32}`}
      className="mp-break-chart"
      role="img"
      aria-label={t("shop.prices.breaksChart")}
    >
      <polyline
        points={points.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {points.map((p) => (
        <g key={p.step.quantity}>
          <circle cx={p.x} cy={p.y} r={4} fill="var(--surface)" stroke="var(--accent)" strokeWidth={2.5} />
          <text
            x={p.x}
            y={p.y - 10}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize={10}
            fontWeight={700}
            fill="var(--fg)"
          >
            {multiplier(p.step.multiplier)}
          </text>
          <text
            x={p.x}
            y={h + 22}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize={9.5}
            fill="var(--fg-subtle)"
          >
            {num(p.step.quantity)}
          </text>
        </g>
      ))}
    </svg>
  );
}
