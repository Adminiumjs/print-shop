/**
 * THE JOB TICKET (comp `I - Marlow Press` 1116-1215). What the job is (the
 * spec, every value a stored column or the row it links), how it sits on the
 * press sheet (Adminium's `up` and `sheets`), the customer's own files with
 * the checks they were shown, the proofs as they went and came back, what it
 * takes off the shelf (Inventory's count when Inventory keeps the stock), and
 * what the person may do next: send a proof, mark it printed or ready, record
 * spoilage, hand it over, book its collection, price a delivery over the
 * bands. A job made in the Customiser shows the design it was made from and
 * the files the Customiser made of it; its panel on the job's own page makes
 * the proof and the print files.
 */
import { ArrowLeft, Calculator, CircleCheckBig, CircleX, Download, FileCheck, HandCoins, LayoutTemplate, PackageCheck, Printer, Scissors, Send, Truck, TriangleAlert, Check, MessageSquareText } from "lucide-react";

import { collectJob, dispatchOrder, walkJob } from "../actions.ts";
import { useData, useEnv, useRun } from "../env.tsx";
import {
  artworkOf,
  checksOf,
  closuresOf,
  dueOf,
  familyOf,
  fileSrc,
  isLive,
  jobById,
  materialOf,
  optionOf,
  orderOf,
  packagingOf,
  productOf,
  proofsOf,
  readyToGo,
  refOf,
  sizeMm,
  sizeOf,
  stockOf,
  versionOf,
  isSheetWork,
} from "../facts.ts";
import { useFmt } from "../format.ts";
import { mayHandOver, mayOpenPanel, movesFor } from "../roles.ts";
import { go, useWorks } from "../store.ts";
import { DueChip, FamilyTile, Mono, Typed } from "../ui.tsx";
import { num, same, text, type Id, type Row } from "../wire.ts";
import { STAGE_LABEL, targetsFor } from "./Today.tsx";
import { BLEED_MM } from "../../shop/checks.ts";
import { useT, type MessageKey } from "../../i18n/index.tsx";

/** The finishes a job takes, by the option it names: a finish that costs nothing (plain edges, rolled) says nothing. */
const FINISH_OPTIONS = ["lamination_option_id", "spot_uv_option_id", "corners_option_id", "edges_option_id", "canvas_option_id"] as const;

const LEVEL_ICON: Record<string, typeof Check> = { pos: Check, warn: TriangleAlert, danger: CircleX, info: Check };

export function TicketScreen() {
  const t = useT();
  const data = useData();
  const jobId = useWorks((s) => s.jobId);
  const job = jobById(data, jobId);
  if (job === undefined) {
    return (
      <section className="wk-screen wk-narrow">
        <div className="wk-empty">
          <div className="wk-empty-title">{t("works.ticket.none")}</div>
          <button type="button" className="wk-btn" onClick={() => go("today")}>
            {t("works.back.board")}
          </button>
        </div>
      </section>
    );
  }
  return <Ticket job={job} />;
}

function Ticket({ job }: { job: Row }) {
  const t = useT();
  const fmt = useFmt();
  const data = useData();
  const { door } = useEnv();
  const facts = door.facts();
  const today = fmt.today(door.now());
  const order = orderOf(data, job);
  const product = productOf(data, job);
  const ref = refOf(data, job);
  const due = dueOf(job, today, facts.workingDays, closuresOf(data));
  const stage = String(job["stage"]);

  return (
    <section className="wk-screen wk-ticket" aria-labelledby="wk-ticket-ref">
      <button type="button" className="wk-back" onClick={() => go("today")}>
        <ArrowLeft size={15} className="wk-flip" aria-hidden="true" />
        {t("works.back.board")}
      </button>
      <div className="wk-ticket-head">
        <FamilyTile family={familyOf(data, job)} icon={text(product?.["icon"])} size="lg" />
        <div>
          <div className="wk-ticket-refline">
            <Mono className="wk-ticket-ref">
              <span id="wk-ticket-ref">{ref}</span>
            </Mono>
            <span className={`wk-stage wk-stage--${stage}`}>{t(STAGE_LABEL[stage] ?? "works.stage.prepress")}</span>
          </div>
          <div className="wk-ticket-title">
            {t("works.card.title", { product: text(job["product_name"]) ?? "", qty: String(job["qty"] ?? "") })} · <Typed>{text(order?.["name"]) ?? ""}</Typed>
          </div>
        </div>
        <span className="wk-ticket-due">
          <DueChip tone={due.tone} day={due.day} big />
        </span>
      </div>
      <div className="wk-ticket-grid">
        <div className="wk-ticket-main">
          <Spec job={job} />
          <Imposition job={job} />
          <Artwork job={job} />
          <ProofHistory job={job} />
        </div>
        <div className="wk-ticket-side">
          <Shelf job={job} />
          <Actions job={job} order={order} />
        </div>
      </div>
    </section>
  );
}

function Spec({ job }: { job: Row }) {
  const t = useT();
  const fmt = useFmt();
  const data = useData();
  const size = sizeMm(data, job);
  const sizeText = size === null ? "—" : t("works.size.mm", { w: fmt.number(size.w), h: fmt.number(size.h) });
  const finishes = FINISH_OPTIONS.flatMap((column) => {
    const option = optionOf(data, job[column]);
    if (option === undefined || option["finish_basis"] === "none") return [];
    const name = text(option["name"]) ?? "";
    if (column === "lamination_option_id" && text(job["look"]) !== null) return [t("works.spec.look", { finish: name, look: t(job["look"] === "gloss" ? "works.spec.gloss" : "works.spec.matt") })];
    return [name];
  });
  const sheet = isSheetWork(job);
  const packaging = packagingOf(data, job);
  const express = job["express"] === true;
  const days = num(job[express ? "express_days" : "standard_days"]) ?? 0;
  const rows: { label: MessageKey; value: string; mono?: boolean }[] = [
    { label: "works.spec.product", value: text(job["product_name"]) ?? "—" },
    { label: "works.spec.material", value: text(materialOf(data, job)?.["name"]) ?? "—" },
    { label: "works.spec.finished", value: sizeText, mono: true },
    { label: "works.spec.printed", value: size === null ? "—" : t("works.spec.bleed", { size: sizeText, bleed: fmt.number(BLEED_MM) }), mono: true },
    { label: "works.spec.sides", value: t(num(job["sides"]) === 2 ? "works.spec.double" : "works.spec.single") },
    { label: "works.spec.finish", value: finishes.length === 0 ? t("works.spec.none") : finishes.join(", ") },
    { label: "works.spec.qty", value: fmt.number(job["qty"]), mono: true },
    { label: "works.spec.packaging", value: sheet ? (text(packaging?.["name"]) ?? "—") : t(num(job["rolls"]) === 1 ? "works.spec.rolled" : "works.spec.flat") },
    { label: "works.spec.turnaround", value: t(express ? "works.spec.express" : "works.spec.standard", {}, days) },
    { label: "works.spec.promise", value: fmt.dayLong(text(job["ready_by"])), mono: true },
  ];
  return (
    <div className="wk-panel">
      <h2 className="wk-panel-head">{t("works.spec.title")}</h2>
      <dl className="wk-spec">
        {rows.map((r) => (
          <div key={r.label} className="wk-spec-row">
            <dt>{t(r.label)}</dt>
            <dd className={r.mono === true ? "wk-mono" : undefined}>{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Imposition({ job }: { job: Row }) {
  const t = useT();
  const fmt = useFmt();
  const data = useData();
  const size = sizeMm(data, job);
  const preset = sizeOf(data, job);
  const material = materialOf(data, job);
  let line: string;
  let note: string | null = null;
  if (isSheetWork(job)) {
    const sw = num(data.settings?.["sheet_width_mm"]);
    const sh = num(data.settings?.["sheet_height_mm"]);
    const sra3 = sw === 320 && sh === 450;
    const params = { up: fmt.number(job["up"]), sheets: fmt.number(job["sheets"]), w: fmt.number(size?.w ?? 0), h: fmt.number(size?.h ?? 0), sw: fmt.number(sw ?? 0), sh: fmt.number(sh ?? 0) };
    line = t(sra3 ? "works.impose.sra3" : "works.impose.sheet", params);
    const upright = num(preset?.["up_upright"]);
    const rotated = num(preset?.["up_rotated"]);
    if (preset?.["direct"] === true) note = t("works.impose.direct");
    else if (upright !== null && rotated !== null && rotated > upright) note = t("works.impose.rotated", { rotated: fmt.number(rotated), upright: fmt.number(upright) });
  } else {
    line = t("works.impose.roll", { qty: fmt.number(job["qty"]), area: fmt.number(job["area_each"], 2), material: text(material?.["short_name"]) ?? text(material?.["name"]) ?? "" });
    const width = num(material?.["roll_width_mm"]);
    if (width !== null) note = t("works.impose.rollWidth", { width: fmt.number(width) });
  }
  return (
    <div className="wk-panel wk-panel--accent">
      <div className="wk-impose-head">
        <LayoutTemplate size={16} aria-hidden="true" />
        {t("works.impose.title")}
      </div>
      <Mono className="wk-impose-line">{line}</Mono>
      {note !== null && <div className="wk-impose-note">{note}</div>}
    </div>
  );
}

function Artwork({ job }: { job: Row }) {
  const t = useT();
  const data = useData();
  const { door } = useEnv();
  // A design's files sit under Actions for a role that opens its panel; the counter, which has none, is told who makes them.
  const designLine = mayOpenPanel(door.who(), "customiser-line") ? "works.art.design" : "works.art.designElsewhere";
  const files = artworkOf(data, job);
  const family = familyOf(data, job);
  const product = productOf(data, job);
  return (
    <div className="wk-panel">
      <h2 className="wk-panel-head wk-panel-head--plain">{t("works.art.title")}</h2>
      {files.length === 0 ? (
        <div className="wk-muted">{t(job["design_id"] === null || job["design_id"] === undefined ? "works.art.none" : designLine)}</div>
      ) : (
        <ul className="wk-art-grid" role="list">
          {files.map((file) => {
            const src = fileSrc(file["file"]);
            // Deleted with the customer's data: the row stays as the job's record, its name and checks gone with the file.
            if (src === null && (text(file["name"]) ?? "") === "")
              return (
                <li key={String(file.id)} className="wk-art">
                  <div className="wk-muted">{t("works.art.gone")}</div>
                </li>
              );
            const name = text(file["name"]) ?? "";
            const checks = checksOf(file).slice(0, 2);
            return (
              <li key={String(file.id)} className="wk-art">
                <div className={`wk-art-tile wk-tint--${family === "card" || family === "paper" || family === "mail" || family === "sticker" || family === "image" || family === "banner" ? family : "other"}`}>
                  <FamilyTile family={family} icon={text(product?.["icon"])} />
                  {src === null ? (
                    <Mono className="wk-art-name">{name}</Mono>
                  ) : (
                    <a className="wk-art-name wk-mono" href={src} download={name} aria-label={t("works.art.download", { name })}>
                      {name}
                    </a>
                  )}
                </div>
                <ul className="wk-art-rows" role="list">
                  {checks.map((row, i) => {
                    const Icon = LEVEL_ICON[row.level] ?? Check;
                    return (
                      <li key={i} className={`wk-art-row wk-level--${row.level}`}>
                        <Icon size={13} aria-hidden="true" />
                        <span>{row.text}</span>
                      </li>
                    );
                  })}
                  {file["accepted"] === true && (
                    <li className="wk-art-row wk-level--accepted">
                      <CircleCheckBig size={13} aria-hidden="true" />
                      <span>{t("works.art.accepted")}</span>
                    </li>
                  )}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ProofHistory({ job }: { job: Row }) {
  const t = useT();
  const fmt = useFmt();
  const data = useData();
  type Entry = { key: string; kind: "sent" | "approved" | "changes"; title: string; note: string | null; at: unknown; file: string | null };
  const entries = proofsOf(data, job).flatMap((proof): Entry[] => {
    const how = t(proof["kind"] === "post" ? "works.proof.byPost" : "works.proof.byEmail");
    const note = text(proof["note"]);
    const sent: Entry = { key: `${String(proof.id)}-sent`, kind: "sent", title: t("works.proof.sent", { n: fmt.number(proof["version"]) }), note: note === null ? how : t("works.proof.sentNote", { how, note }), at: proof["sent_at"], file: fileSrc(proof["file"]) };
    if (proof["state"] === "approved") return [sent, { key: `${String(proof.id)}-yes`, kind: "approved", title: t("works.proof.approved"), note: null, at: proof["answered_at"], file: null }];
    if (proof["state"] === "change_asked") return [sent, { key: `${String(proof.id)}-change`, kind: "changes", title: t("works.proof.change"), note: text(proof["change_note"]), at: proof["answered_at"], file: null }];
    return [sent];
  });
  const ICON = { sent: Send, approved: Check, changes: MessageSquareText };
  return (
    <div className="wk-panel">
      <h2 className="wk-panel-head wk-panel-head--plain">{t("works.proof.title")}</h2>
      {entries.length === 0 ? (
        <div className="wk-muted">{t("works.proof.none")}</div>
      ) : (
        <ol className="wk-history">
          {entries.map((e) => {
            const Icon = ICON[e.kind];
            return (
              <li key={e.key} className="wk-history-row">
                <span className={`wk-history-icon wk-history-icon--${e.kind}`} aria-hidden="true">
                  <Icon size={14} />
                </span>
                <div className="wk-history-text">
                  <div className="wk-history-title">
                    {e.file === null ? (
                      e.title
                    ) : (
                      <a href={e.file} target="_blank" rel="noopener noreferrer">
                        {e.title}
                      </a>
                    )}
                  </div>
                  {e.note !== null && <div className="wk-history-note">{e.note}</div>}
                </div>
                <Mono className="wk-history-date">{fmt.moment(e.at)}</Mono>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function Shelf({ job }: { job: Row }) {
  const t = useT();
  const fmt = useFmt();
  const data = useData();
  const { door } = useEnv();
  const material = materialOf(data, job);
  const name = text(material?.["name"]) ?? "";
  const sheet = isSheetWork(job);
  const spoiled = num(job["spoiled_sheets"]) ?? 0;
  const stock = material === undefined ? [] : stockOf(data, material);
  const inventory = door.facts().addOns.includes("inventory");
  const low = stock.some((s) => num(s["low"]) === 1);
  const line = sheet ? t("works.shelf.sheets", { sheets: fmt.number(job["sheets"]), material: name }) : t("works.shelf.roll", { area: fmt.number(job["area_total"], 2), material: name });
  return (
    <div className="wk-panel">
      <h2 className="wk-panel-head wk-panel-head--small">{t("works.shelf.title")}</h2>
      <div className={`wk-shelf${low ? " wk-shelf--low" : ""}`}>
        <Mono className="wk-shelf-line">{line}</Mono>
        {spoiled > 0 && <div className="wk-shelf-sub">{t(sheet ? "works.shelf.spoiled" : "works.shelf.spoiledRoll", { n: fmt.number(spoiled, 2) })}</div>}
        {stock.length > 0
          ? stock.map((point) => (
              <div key={String(point.id)} className="wk-shelf-sub">
                {t(sheet ? "works.shelf.spare" : "works.shelf.spareRoll", { n: fmt.number(point["available"], 2), place: text(point["place_name"]) ?? "" })}
              </div>
            ))
          : <div className="wk-shelf-sub">{t(inventory ? "works.shelf.notLinked" : "works.shelf.noInventory")}</div>}
      </div>
    </div>
  );
}

function Actions({ job, order }: { job: Row; order: Row | undefined }) {
  const t = useT();
  const fmt = useFmt();
  const data = useData();
  const { door } = useEnv();
  const { busy, run } = useRun();
  const who = door.who();
  const stage = String(job["stage"]);
  const ref = refOf(data, job);
  const targets: string[] = targetsFor(job, who);
  const moves = movesFor(who, stage);
  const live = isLive(job);
  const deliver = order?.["delivery_method"] === "deliver";
  const carrier = door.facts().carrier !== null;
  const handOver = mayHandOver(who);
  const design = job["design_id"] === null || job["design_id"] === undefined ? undefined : data.designs.find((d) => same(d.id, job["design_id"]));
  const version = design === undefined ? undefined : versionOf(data, job);
  const made = version === undefined ? [] : data.files.filter((f) => same(f["version_id"], version.id));
  const quoteState = text(order?.["delivery_quote_state"]);
  const toQuote = num(order?.["delivery_to_quote"]) === 1 && deliver;

  const walk = (to: "finishing" | "ready", said: MessageKey) =>
    run(async (d, fresh) => {
      const fresher = jobById(fresh, job.id) ?? job;
      await walkJob(d, fresh, fresher, to, who);
      return t(said, { ref });
    });
  const collect = () =>
    run(async (d, fresh) => {
      await collectJob(d, fresh, jobById(fresh, job.id) ?? job, who);
      return t("works.ticket.collectedToast", { ref });
    });
  const dispatch = () =>
    run(async (d, fresh) => {
      if (order === undefined) return;
      await dispatchOrder(d, fresh, order, { tracking: null, service: null });
      return t("works.ticket.dispatchedToast", { ref: text(order["number"]) ?? ref });
    });

  return (
    <div className="wk-panel">
      <h2 className="wk-panel-head wk-panel-head--small">{t("works.actions.title")}</h2>
      <div className="wk-actions">
        {design !== undefined && (
          <div className="wk-design">
            <div className="wk-design-line">{t("works.design.made", { name: text(design["code"]) ?? "", version: fmt.number(version?.["version"] ?? 1) })}</div>
            {made.map((f) => {
              const src = fileSrc(f["file"]);
              const name = text(f["name"]) ?? text(f["kind"]) ?? "";
              return (
                <div key={String(f.id)} className="wk-made">
                  <div className="wk-made-text">
                    <Mono className="wk-made-name">{name}</Mono>
                    <Mono className="wk-made-meta">{text(f["about"]) ?? t(f["kind"] === "machine" ? "works.design.machine" : "works.design.print")}</Mono>
                  </div>
                  {src !== null && (
                    <a className="wk-made-get" href={src} download={name} aria-label={t("works.design.download", { name })}>
                      <Download size={13} aria-hidden="true" />
                      {t("works.design.get")}
                    </a>
                  )}
                </div>
              );
            })}
            {mayOpenPanel(who, "customiser-line") && (
              <>
                <button
                  type="button"
                  className="wk-action"
                  onClick={() => useWorks.setState({ overlay: { kind: "panel", panel: { id: "customiser-line", table: "jobs", row: job.id }, linked: job["design_id"] as Id, title: t("works.panel.title", { ref }) } })}
                >
                  <FileCheck size={16} aria-hidden="true" />
                  {t("works.design.make")}
                </button>
                <span className="wk-design-note">{t("works.design.note")}</span>
              </>
            )}
          </div>
        )}

        {live && (
          <>
            {who.can("proofs", "create") && (
              <button type="button" className="wk-action" disabled={busy} onClick={() => useWorks.setState({ overlay: { kind: "proof", jobId: job.id } })}>
                <Send size={16} className="wk-ic-accent" aria-hidden="true" />
                {t("works.actions.proof")}
              </button>
            )}
            {(stage === "prepress" || stage === "printing") && targets.includes("finishing") && (
              <button type="button" className="wk-action" disabled={busy} onClick={() => void walk("finishing", "works.ticket.printedToast")}>
                <Printer size={16} className="wk-ic-info" aria-hidden="true" />
                {t("works.actions.printed")}
              </button>
            )}
            {who.can("spoils", "create") && (
              <button type="button" className="wk-action" disabled={busy} onClick={() => useWorks.setState({ overlay: { kind: "spoil", jobId: job.id } })}>
                <Scissors size={16} className="wk-ic-warn" aria-hidden="true" />
                {t("works.actions.spoil")}
              </button>
            )}
            {targets.includes("ready") && (
              <button type="button" className="wk-action wk-action--primary" disabled={busy} onClick={() => void walk("ready", "works.ticket.readyToast")}>
                <PackageCheck size={16} aria-hidden="true" />
                {t("works.actions.ready")}
              </button>
            )}
          </>
        )}

        {toQuote && order !== undefined && (
          <div className="wk-quote-state">
            {quoteState === "sent" || quoteState === "accepted" ? (
              <span className={`wk-quote-chip wk-quote-chip--${quoteState}`}>
                {t(quoteState === "sent" ? "works.quote.sent" : "works.quote.accepted", { price: fmt.money(order["delivery_quote"]) })}
              </span>
            ) : (
              handOver &&
              who.can("orders", "update") && (
                <button type="button" className="wk-action" disabled={busy} onClick={() => useWorks.setState({ overlay: { kind: "quote", orderId: order.id } })}>
                  <Calculator size={16} className="wk-ic-accent" aria-hidden="true" />
                  {t("works.actions.quote")}
                </button>
              )
            )}
          </div>
        )}

        {stage === "ready" && !deliver && moves.includes("collected") && (
          <div className="wk-action-row">
            <button type="button" className="wk-action wk-action--pos" disabled={busy} onClick={() => void collect()}>
              <HandCoins size={16} aria-hidden="true" />
              {t("works.actions.collected")}
            </button>
          </div>
        )}
        {stage === "ready" && deliver && order !== undefined && moves.includes("dispatched") && (
          <div className="wk-action-col">
            {carrier && readyToGo(data, order) && (
              <button type="button" className="wk-action" disabled={busy} onClick={() => go("dispatch", { orderId: order.id })}>
                <Truck size={16} className="wk-ic-accent" aria-hidden="true" />
                {t("works.board.book")}
              </button>
            )}
            {!carrier && (
              <button type="button" className="wk-action wk-action--pos" disabled={busy || !readyToGo(data, order)} onClick={() => void dispatch()}>
                <Truck size={16} aria-hidden="true" />
                {t("works.actions.dispatched")}
              </button>
            )}
            {!readyToGo(data, order) && <span className="wk-muted">{t("works.actions.waitForOthers")}</span>}
          </div>
        )}
        {stage === "collected" && (
          <div className="wk-done">
            <CircleCheckBig size={17} aria-hidden="true" />
            {t("works.actions.collectedDone")}
          </div>
        )}
        {stage === "dispatched" && (
          <div className="wk-done">
            <CircleCheckBig size={17} aria-hidden="true" />
            {text(order?.["tracking"]) === null ? t("works.actions.dispatchedDone") : t("works.actions.dispatchedTracking", { tracking: text(order?.["tracking"]) ?? "" })}
          </div>
        )}
        {stage === "ready" && !moves.includes("collected") && !moves.includes("dispatched") && <span className="wk-muted">{t("works.actions.counter")}</span>}
      </div>
    </div>
  );
}
