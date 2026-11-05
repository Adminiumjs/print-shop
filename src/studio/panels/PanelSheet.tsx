/**
 * THE CUSTOMISER'S PANEL, ON THE WORKS' SCREENS: a sheet over the ticket (a
 * job's design: as it will be printed, its proof, the print files).
 *
 * The panel is the Customiser's own code, served by Adminium for that one row
 * to the person signed in (their role must hold the panel, `ROLE_PANELS`),
 * and drawn with the works' host (`host.tsx`). It makes the proof and the
 * files in this browser and saves them as that person. When the sheet
 * closes the works reads its rows again, so the ticket and the proof sheet
 * find the proof the panel just made.
 *
 * What it says when the panel does not come: the role does not open it (the
 * server's 403), there is no panel here (404: the Customiser is off for the
 * works), it would not load (nothing of it ran), or, in the demo, that the
 * panel draws here on an Adminium.
 */
import { Component, Suspense, useEffect, useId, useMemo, useState, type ComponentType, type ReactNode } from "react";
import { X } from "lucide-react";

import type { PanelOpen } from "../door.ts";
import { reload, useEnv } from "../env.tsx";
import type { Id } from "../wire.ts";
import { PanelRefused } from "../../add-ons/connected.ts";
import { useI18n, useT } from "../../i18n/index.tsx";
import { close, Modal } from "../screens/Modal.tsx";
import { PanelScopeProvider } from "./host.tsx";
import "./panels.css";

const ADD_ON = "customiser";

interface PanelProps {
  connectionId: string;
  table: string;
  row: string;
  linked: string | null;
}

type Loaded = { status: "loading" } | { status: "ready"; Panel: ComponentType<PanelProps> } | { status: "refused" } | { status: "none" } | { status: "failed" };

/** A panel's own crash, kept off the works' screens: the sheet says it failed. */
class PanelBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { crashed: boolean }> {
  override state = { crashed: false };
  static getDerivedStateFromError(): { crashed: boolean } {
    return { crashed: true };
  }
  override render(): ReactNode {
    return this.state.crashed ? this.props.fallback : this.props.children;
  }
}

const isComponent = (value: unknown): value is ComponentType<PanelProps> => typeof value === "function" || (typeof value === "object" && value !== null && "$$typeof" in value);

export function PanelSheet({ panel, linked, title }: { panel: PanelOpen; linked: Id | null; title: string }) {
  const t = useT();
  const { locale } = useI18n();
  const { door } = useEnv();
  const titleId = useId();
  const panels = door.panels();
  const [loaded, setLoaded] = useState<Loaded>({ status: "loading" });

  useEffect(() => {
    if (panels === null) return;
    let live = true;
    setLoaded({ status: "loading" });
    panels.load(panel).then(
      (value) => live && setLoaded(isComponent(value) ? { status: "ready", Panel: value } : { status: "failed" }),
      (caught: unknown) => {
        if (!live) return;
        if (caught instanceof PanelRefused && caught.status === 403) setLoaded({ status: "refused" });
        else if (caught instanceof PanelRefused && caught.status === 404) setLoaded({ status: "none" });
        else setLoaded({ status: "failed" });
      },
    );
    return () => {
      live = false;
    };
  }, [panels, panel.id, panel.table, panel.row]);

  // What the panel made (a proof, the files) is read again when the sheet goes.
  useEffect(() => () => void reload(door), [door]);

  const scope = useMemo(() => (panels === null ? null : { door: panels, addOn: ADD_ON, locale }), [panels, locale]);
  const failed = <p className="wk-cz-small" role="alert">{t("works.panel.failed")}</p>;
  let body: ReactNode;
  if (panels === null || scope === null) body = <div className="wk-empty">{t("works.panel.demo")}</div>;
  else if (loaded.status === "loading") body = <div className="wk-cz-small" role="status">{t("works.panel.loading")}</div>;
  else if (loaded.status === "refused") body = <div className="wk-empty">{t("works.panel.refused")}</div>;
  else if (loaded.status === "none") body = <div className="wk-empty">{t("works.panel.none")}</div>;
  else if (loaded.status === "failed") body = failed;
  else {
    const Panel = loaded.Panel;
    body = (
      <PanelBoundary fallback={failed}>
        <Suspense fallback={<div className="wk-cz-small" role="status">{t("works.panel.loading")}</div>}>
          <PanelScopeProvider scope={scope}>
            <Panel connectionId={door.facts().connectionId ?? ""} table={panel.table} row={String(panel.row)} linked={linked === null || linked === undefined || linked === "" ? null : String(linked)} />
          </PanelScopeProvider>
        </Suspense>
      </PanelBoundary>
    );
  }

  return (
    <Modal kind="sheet" labelledBy={titleId}>
      <div className="wk-sheet-head">
        <h2 className="wk-sheet-title" id={titleId}>
          {title}
        </h2>
        <button type="button" className="wk-close" aria-label={t("works.close")} onClick={close}>
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="wk-sheet-body wk-cz">{body}</div>
    </Modal>
  );
}
