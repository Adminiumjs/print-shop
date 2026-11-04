/**
 * JOBS (comp `I - Marlow Press` 1216-1243): every job on the floor in one
 * table, by stage and then newest first, each opening its ticket. The
 * reference is a button, so a keyboard reaches every row.
 */
import { useData, useEnv } from "../env.tsx";
import { closuresOf, dueOf, familyOf, FLOOR, materialOf, onBoard, orderOf, refOf } from "../facts.ts";
import { useFmt } from "../format.ts";
import { go } from "../store.ts";
import { DueChip, FamilyDot, Mono, Typed } from "../ui.tsx";
import { text } from "../wire.ts";
import { STAGE_LABEL, useSizeLabel } from "./Today.tsx";
import { useT } from "../../i18n/index.tsx";

export function JobsScreen() {
  const t = useT();
  const fmt = useFmt();
  const data = useData();
  const { door } = useEnv();
  const sizeLabel = useSizeLabel();
  const facts = door.facts();
  const today = fmt.today(door.now());
  const closures = closuresOf(data);
  const rank = (stage: unknown) => FLOOR.indexOf(String(stage) as (typeof FLOOR)[number]);
  const jobs = data.jobs.filter(onBoard).sort((a, b) => rank(a["stage"]) - rank(b["stage"]) || refOf(data, b).localeCompare(refOf(data, a)));

  return (
    <section className="wk-screen" aria-labelledby="wk-jobs-title">
      <h1 className="wk-h1 wk-h1--alone" id="wk-jobs-title">
        {t("works.jobs.title")}
      </h1>
      <div className="wk-table-wrap">
        <table className="wk-table wk-table--jobs">
          <thead>
            <tr>
              <th scope="col">{t("works.jobs.ref")}</th>
              <th scope="col">{t("works.jobs.job")}</th>
              <th scope="col">{t("works.jobs.customer")}</th>
              <th scope="col">{t("works.jobs.stage")}</th>
              <th scope="col" className="wk-end">
                {t("works.jobs.due")}
              </th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => {
              const due = dueOf(job, today, facts.workingDays, closures);
              const material = materialOf(data, job);
              const stage = String(job["stage"]);
              return (
                <tr key={String(job.id)} className="wk-row-link" onClick={() => go("ticket", { jobId: job.id })}>
                  <td>
                    <button type="button" className="wk-ref-btn" onClick={(e) => (e.stopPropagation(), go("ticket", { jobId: job.id }))}>
                      <FamilyDot family={familyOf(data, job)} />
                      <Mono>{refOf(data, job)}</Mono>
                    </button>
                  </td>
                  <td>
                    <span className="wk-cell-strong">{t("works.card.title", { product: text(job["product_name"]) ?? "", qty: String(job["qty"] ?? "") })}</span>
                    <Mono className="wk-cell-sub">{t("works.card.spec", { material: text(material?.["short_name"]) ?? text(material?.["name"]) ?? "", size: sizeLabel(job) })}</Mono>
                  </td>
                  <td className="wk-cell-muted">
                    <Typed>{text(orderOf(data, job)?.["name"]) ?? ""}</Typed>
                  </td>
                  <td>
                    <span className={`wk-stage-pill wk-stage--${stage}`}>{t(STAGE_LABEL[stage] ?? "works.stage.prepress")}</span>
                  </td>
                  <td className="wk-end">
                    <DueChip tone={due.tone} day={due.day} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
