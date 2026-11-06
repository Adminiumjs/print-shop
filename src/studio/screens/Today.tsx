/**
 * TODAY ON THE FLOOR (comp `I - Marlow Press` 1061-1115, with the carrier's "Book a
 * collection" from `J - Marlow Press Add-ons` 1186-1188). Four counts read
 * off the rows, then the board: a job in each of four columns by its stage,
 * its ready-by chip from the date Adminium gave it. A job is moved from its
 * card's menu, or dragged to another column; each move is a write of the
 * job's stage, and its order follows its last job to ready. A job wears a
 * padlock in prepress until its proof is approved, and is not moved on until
 * then. A ready delivery order offers "Book a collection" while a delivery company is on.
 */
import { useState, type DragEvent } from "react";
import { ClipboardList, Ellipsis, FileText, Lock, PackageCheck, Printer, Scissors, Truck, User } from "lucide-react";

import { moveJobTo, forwardPath } from "../actions.ts";
import { useData, useEnv, useRun } from "../env.tsx";
import { closuresOf, dueOf, familyOf, FLOOR, floorFigures, lockOf, materialOf, orderOf, readyToGo, refOf, sizeMm, type FloorStage } from "../facts.ts";
import { useFmt } from "../format.ts";
import { movesFor } from "../roles.ts";
import { go, toast, useWorks } from "../store.ts";
import { DueChip, FamilyDot, Mono, Typed, useDueLabel } from "../ui.tsx";
import { same, text, type Row } from "../wire.ts";
import type { Person } from "../door.ts";
import { useT, type MessageKey } from "../../i18n/index.tsx";

export const STAGE_LABEL: Record<string, MessageKey> = {
  prepress: "works.stage.prepress",
  printing: "works.stage.printing",
  finishing: "works.stage.finishing",
  ready: "works.stage.ready",
  collected: "works.stage.collected",
  dispatched: "works.stage.dispatched",
  cancelled: "works.stage.cancelled",
};

const MOVE_ICON: Record<FloorStage, typeof Printer> = { prepress: ClipboardList, printing: Printer, finishing: Scissors, ready: PackageCheck };

/**
 * The columns a job may be moved to from its card: every one ahead of it the
 * person's role walks it to, and the owner's way back. A job held by its
 * proof keeps the press listed, so the reason is said when it is asked.
 */
export function targetsFor(job: Row, who: Person): FloorStage[] {
  const from = String(job["stage"]);
  const direct = new Set(movesFor(who, from));
  return FLOOR.filter((to) => {
    if (to === from) return false;
    if (direct.has(to)) return true;
    const path = forwardPath(from, to);
    if (path === null || path.length === 0) return false;
    let at = from;
    for (const step of path) {
      if (!movesFor(who, at).includes(step)) return false;
      at = step;
    }
    return true;
  });
}

/** The size a job is printed at: its preset's or its own, in millimetres. */
export function useSizeLabel(): (job: Row) => string {
  const t = useT();
  const data = useData();
  const fmt = useFmt();
  return (job) => {
    const size = sizeMm(data, job);
    return size === null ? "—" : t("works.size.mm", { w: fmt.number(size.w), h: fmt.number(size.h) });
  };
}

export function TodayScreen() {
  const t = useT();
  const fmt = useFmt();
  const data = useData();
  const { door } = useEnv();
  const today = fmt.today(door.now());
  const figures = floorFigures(data, today);
  const menu = useWorks((s) => s.boardMenu);

  const kpis = [
    { value: figures.dueToday, label: t("works.kpi.dueToday"), alarm: false },
    { value: figures.sheets, label: t("works.kpi.sheets"), alarm: false },
    { value: figures.waiting, label: t("works.kpi.waiting"), alarm: false },
    { value: figures.overdue, label: t("works.kpi.overdue"), alarm: figures.overdue > 0 },
  ];

  return (
    <section className="wk-screen" aria-labelledby="wk-today-title">
      <div className="wk-head">
        <h1 className="wk-h1" id="wk-today-title">
          {t("works.today.title")}
        </h1>
        <Mono className="wk-head-sub">{fmt.dayLong(today)}</Mono>
      </div>
      <ul className="wk-kpis" role="list">
        {kpis.map((k) => (
          <li key={k.label} className={`wk-kpi${k.alarm ? " wk-kpi--alarm" : ""}`}>
            <Mono className="wk-kpi-n">{fmt.number(k.value)}</Mono>
            <span className="wk-kpi-label">{k.label}</span>
          </li>
        ))}
      </ul>
      <div className="wk-board" role="group" aria-label={t("works.board.label")}>
        {FLOOR.map((stage) => (
          <Column key={stage} stage={stage} jobs={data.jobs.filter((j) => j["stage"] === stage)} today={today} />
        ))}
      </div>
      {menu !== null && <div className="wk-menu-scrim" onClick={() => useWorks.setState({ boardMenu: null })} aria-hidden="true" />}
    </section>
  );
}

function Column({ stage, jobs, today }: { stage: FloorStage; jobs: Row[]; today: string }) {
  const t = useT();
  const data = useData();
  const { door } = useEnv();
  const { run } = useRun();
  const [over, setOver] = useState(false);
  const labelId = `wk-col-${stage}`;
  const who = door.who();

  const drop = (event: DragEvent) => {
    event.preventDefault();
    setOver(false);
    const id = event.dataTransfer.getData("text/plain") || String(useWorks.getState().dragging ?? "");
    const job = data.jobs.find((j) => String(j.id) === id);
    if (job === undefined || job["stage"] === stage) return;
    void moveTo(job, stage);
  };
  const moveTo = async (job: Row, to: FloorStage): Promise<boolean> => {
    useWorks.setState({ boardMenu: null, dragging: null });
    if (!targetsFor(job, who).includes(to)) {
      toast(t("works.board.cantMove", { ref: refOf(data, job), stage: t(STAGE_LABEL[to]!) }), "warn");
      return false;
    }
    return run(async (d, fresh) => {
      await moveJobTo(d, fresh, job, to, who);
      return t("works.board.moved", { ref: refOf(fresh, job), stage: t(STAGE_LABEL[to]!) });
    });
  };

  return (
    <section
      className={`wk-col wk-col--${stage}`}
      aria-labelledby={labelId}
      data-over={over ? "true" : "false"}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={drop}
    >
      <h2 className="wk-col-head" id={labelId}>
        <span className="wk-col-label">{t(STAGE_LABEL[stage]!)}</span>
        <Mono className="wk-col-count">{jobs.length}</Mono>
      </h2>
      <div className="wk-col-body">
        {jobs.length === 0 ? (
          <div className="wk-col-empty">{t("works.board.empty")}</div>
        ) : (
          jobs.map((job) => <Card key={String(job.id)} job={job} today={today} onMove={moveTo} />)
        )}
      </div>
    </section>
  );
}

function Card({ job, today, onMove }: { job: Row; today: string; onMove: (job: Row, to: FloorStage) => Promise<boolean> }) {
  const t = useT();
  const data = useData();
  const { door } = useEnv();
  const sizeLabel = useSizeLabel();
  const dueLabel = useDueLabel();
  const menu = useWorks((s) => s.boardMenu);
  const facts = door.facts();
  const who = door.who();
  const ref = refOf(data, job);
  const order = orderOf(data, job);
  const lock = lockOf(job);
  const due = dueOf(job, today, facts.workingDays, closuresOf(data));
  const customer = text(order?.["name"]) ?? "";
  const product = text(job["product_name"]) ?? "";
  const qty = String(job["qty"] ?? "");
  const material = text(materialOf(data, job)?.["short_name"]) ?? text(materialOf(data, job)?.["name"]) ?? "";
  const open = menu !== null && same(menu, job.id);
  const targets = targetsFor(job, who);
  const carrier = facts.carrier !== null;
  const canDispatch = carrier && job["stage"] === "ready" && order !== undefined && readyToGo(data, order) && who.can("orders", "update");

  const openTicket = () => go("ticket", { jobId: job.id });
  const aria = t(lock === null ? "works.card.aria" : "works.card.ariaLocked", { ref, product, qty, customer, due: dueLabel(due.tone, due.day) });

  return (
    <div
      className="wk-card"
      draggable
      onDragStart={(e) => {
        useWorks.setState({ dragging: job.id });
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(job.id));
      }}
    >
      {/* The whole card opens the ticket: one button under the card's own controls, so nothing interactive nests. */}
      <button type="button" className="wk-card-open" aria-label={aria} onClick={openTicket} />
      <div className="wk-card-top">
        <span className="wk-card-ref">
          <FamilyDot family={familyOf(data, job)} />
          <Mono className="wk-card-ref-n">{ref}</Mono>
          {lock !== null && <Lock size={12} className="wk-lock" aria-hidden="true" />}
        </span>
        <button
          type="button"
          className="wk-card-menu-btn"
          aria-label={t("works.board.moveJob")}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={(e) => {
            e.stopPropagation();
            useWorks.setState({ boardMenu: open ? null : job.id });
          }}
        >
          <Ellipsis size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="wk-card-title">
        {t("works.card.title", { product, qty })}
      </div>
      <Mono className="wk-card-spec">{t("works.card.spec", { material, size: sizeLabel(job) })}</Mono>
      <div className="wk-card-foot">
        <span className="wk-card-customer">
          <User size={12} aria-hidden="true" />
          <Typed>{customer}</Typed>
        </span>
        <DueChip tone={due.tone} day={due.day} />
      </div>
      {canDispatch && (
        <button
          type="button"
          className="wk-card-dispatch"
          onClick={(e) => {
            e.stopPropagation();
            go("dispatch", { orderId: order.id });
          }}
        >
          <Truck size={14} aria-hidden="true" />
          {t("works.board.book")}
        </button>
      )}
      {open && (
        <div className="wk-menu" role="menu" aria-label={t("works.board.moveTo")} onClick={(e) => e.stopPropagation()}>
          <div className="wk-menu-head">{t("works.board.moveTo")}</div>
          {targets.map((to) => {
            const Icon = MOVE_ICON[to];
            return (
              <button key={to} type="button" role="menuitem" className="wk-menu-item" onClick={() => void onMove(job, to)}>
                <Icon size={14} aria-hidden="true" />
                {t(STAGE_LABEL[to]!)}
              </button>
            );
          })}
          {targets.length > 0 && <div className="wk-menu-rule" />}
          <button type="button" role="menuitem" className="wk-menu-item" onClick={openTicket}>
            <FileText size={14} aria-hidden="true" />
            {t("works.board.openTicket")}
          </button>
        </div>
      )}
    </div>
  );
}
