/**
 * MATERIALS (comp `I - Marlow Press` 1245-1278): the works' stocks, sheet and
 * roll, with what the shelf holds of each. The counts are Inventory's (the
 * feature `stock`): each material's item, its stock on hand, what open work
 * holds of it and what is spare, and whether it has fallen below its reorder
 * level. A stock delivery is received on Inventory's own page; spoilage on a
 * run comes off the shelf from the job's ticket. With Inventory off, or a
 * stock not yet linked to its item, the screen says so instead of a figure.
 */
import { PackagePlus, TriangleAlert } from "lucide-react";

import { useData, useEnv } from "../env.tsx";
import { stockOf } from "../facts.ts";
import { useFmt } from "../format.ts";
import { mayManageAddOns } from "../roles.ts";
import { go } from "../store.ts";
import { Mono } from "../ui.tsx";
import { num, text, type Row } from "../wire.ts";
import { useT, type MessageKey } from "../../i18n/index.tsx";

/** The add-on that keeps the stock, and its page a delivery is received on. */
export const STOCK_ADD_ON = { key: "inventory", receive: "inventory-receive" } as const;

export function MaterialsScreen() {
  const t = useT();
  const data = useData();
  const env = useEnv();
  const { door } = env;
  const inventory = door.facts().addOns.includes(STOCK_ADD_ON.key);
  const groups: { kind: "sheet" | "roll"; title: MessageKey }[] = [
    { kind: "sheet", title: "works.materials.sheet" },
    { kind: "roll", title: "works.materials.roll" },
  ];

  return (
    <section className="wk-screen wk-materials" aria-labelledby="wk-materials-title">
      <div className="wk-head wk-head--tight">
        <h1 className="wk-h1" id="wk-materials-title">
          {t("works.materials.title")}
        </h1>
        {inventory && (
          <a className="wk-btn wk-btn--link wk-head-end" href={env.addOnPageHref(STOCK_ADD_ON.key, STOCK_ADD_ON.receive)} target="_top">
            <PackagePlus size={15} aria-hidden="true" />
            {t("works.materials.delivery")}
          </a>
        )}
      </div>
      <p className="wk-lede">{t("works.materials.lede")}</p>
      {!inventory && (
        <div className="wk-note">
          <span>{t("works.materials.noInventory")}</span>
          {mayManageAddOns(door.who()) && (
            <button type="button" className="wk-btn wk-btn--small" onClick={() => go("addon", { addOnKey: STOCK_ADD_ON.key })}>
              {t("works.materials.openAddOn")}
            </button>
          )}
        </div>
      )}
      {groups.map((group) => {
        const rows = data.materials.filter((m) => m["kind"] === group.kind && m["active"] !== false);
        if (rows.length === 0) return null;
        return (
          <div key={group.kind} className="wk-group">
            <h2 className="wk-group-title">{t(group.title)}</h2>
            <div className="wk-table-wrap">
              <table className="wk-table">
                <thead>
                  <tr>
                    <th scope="col">{t("works.materials.stock")}</th>
                    <th scope="col" className="wk-end">
                      {t("works.materials.onHand")}
                    </th>
                    <th scope="col" className="wk-end">
                      {t("works.materials.committed")}
                    </th>
                    <th scope="col" className="wk-end">
                      {t("works.materials.spare")}
                    </th>
                    <th scope="col" className="wk-end">
                      <span className="wk-sr">{t("works.materials.reorder")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.flatMap((material) => {
                    const points = stockOf(data, material);
                    return points.length === 0 ? [<MaterialRow key={String(material.id)} material={material} point={null} linked={false} inventory={inventory} />] : points.map((point) => <MaterialRow key={`${String(material.id)}-${String(point.id)}`} material={material} point={point} linked inventory={inventory} place={points.length > 1 ? text(point["place_name"]) : null} />);
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </section>
  );
}

function MaterialRow({ material, point, linked, inventory, place = null }: { material: Row; point: Row | null; linked: boolean; inventory: boolean; place?: string | null }) {
  const t = useT();
  const fmt = useFmt();
  const data = useData();
  const sheet = material["kind"] === "sheet";
  const low = point !== null && num(point["low"]) === 1;
  const unit = t(sheet ? "works.materials.unitSheets" : "works.materials.unitMetres");
  const size = sheet
    ? num(data.settings?.["sheet_width_mm"]) === 320 && num(data.settings?.["sheet_height_mm"]) === 450
      ? t("works.materials.sra3")
      : t("works.size.mm", { w: fmt.number(data.settings?.["sheet_width_mm"]), h: fmt.number(data.settings?.["sheet_height_mm"]) })
    : t("works.materials.rollSize", { width: fmt.number(material["roll_width_mm"]) });
  const figure = (value: unknown) => (point === null ? "—" : fmt.number(value, 2));
  return (
    <tr className={low ? "wk-row-low" : undefined}>
      <td>
        <span className="wk-cell-strong">{text(material["name"]) ?? ""}</span>
        {place !== null && <span className="wk-cell-muted"> · {place}</span>}
        <Mono className="wk-cell-sub">{size}</Mono>
        {inventory && !linked && <span className="wk-cell-sub">{t("works.shelf.notLinked")}</span>}
      </td>
      <td className="wk-end wk-mono">{figure(point?.["on_hand"])}</td>
      <td className="wk-end wk-mono wk-cell-muted">{figure(point?.["reserved"])}</td>
      <td className={`wk-end wk-mono wk-cell-strong${low ? " wk-low" : ""}`}>{point === null ? "—" : t("works.materials.spareValue", { n: fmt.number(point["available"], 2), unit })}</td>
      <td className="wk-end">
        {low && (
          <span className="wk-order-more">
            <TriangleAlert size={12} aria-hidden="true" />
            {t("works.materials.orderMore")}
          </span>
        )}
      </td>
    </tr>
  );
}
