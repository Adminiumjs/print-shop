/*
 * VENDORED from add-on-import-canva/src/client/ImportFlow.tsx — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the add-on repo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `import-canva`; its manifest, tests and README live in that repo.
 */
/**
 * The three-step flow: connect, pick, import and check.
 *
 * It renders as an overlay rather than a route because this add-on fills ONE
 * slot (`artwork.sources`) and declares no `nav.add-on.routes` — it has no
 * business owning a URL in an app it does not own. Escape, the scrim and the
 * close button all resolve the chooser with `null`, which is the contract's
 * "the customer backed out" and leaves the order exactly as it was.
 *
 * The third step is the one this add-on exists for. It shows THE SAME VERDICT
 * ROWS the upload path shows, and when the seeded design fails it offers two
 * remedies that both carry their numbers — the scale with what it costs, and
 * going back with what to set. Neither is a dead end and neither is a shrug.
 */

import { useEffect, useMemo, useState } from "react";
// `Image` is aliased because it shadows the DOM constructor of that name, and a
// component file that quietly redefines a global is a file someone will debug.
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleX,
  Image as ImageIcon,
  Search,
  TriangleAlert,
  X,
} from "lucide-react";

import type { JobSpec } from "../contracts.ts";
import type { CanvaDesign, CanvaExport, CanvaTransport } from "../demo/transport.ts";
import type { MessageKey, TFunction } from "../i18n/t.ts";
import { useAddOnT } from "../i18n/useT.ts";
import {
  SAFE_AREA_MM,
  assessImport,
  scaleToCover,
  type ImportVerdict,
  type RedoRemedy,
  type ScaleRemedy,
} from "../import.ts";
import { toImportJob } from "../job.ts";
import { ConsentPanel } from "./ConsentPanel.tsx";
import { DemoNote, Monogram, Mono, StepRail, sizeChip, useDateFormat } from "./bits.tsx";

type Step = "connect" | "pick" | "import";

/** How the file on screen got there — the status line reads differently for each. */
type Provenance = "as-exported" | "scaled" | "refit";

interface Chosen {
  design: CanvaDesign;
  exported: CanvaExport;
  provenance: Provenance;
}

export function ImportFlow({
  job,
  designs,
  transport,
  onResolve,
}: {
  job: JobSpec;
  designs: readonly CanvaDesign[];
  transport: CanvaTransport;
  /** The chooser's resolution: what to import, or null if they backed out. */
  onResolve: (exported: CanvaExport | null) => void;
}) {
  const t = useAddOnT();
  const formatDate = useDateFormat();

  const [step, setStep] = useState<Step>("connect");
  const [consentOpen, setConsentOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [chosen, setChosen] = useState<Chosen | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  // The demo transport answers in a microtask, so this rarely paints here. It
  // is not decoration: an authorized client fetching a real export takes as
  // long as it takes, and a flow with no in-flight state is a flow that looks
  // broken the first time it is pointed at one.
  const [busy, setBusy] = useState(false);

  const importJob = useMemo(() => toImportJob(job), [job]);

  // Escape closes the innermost overlay first, then the flow — the house rule,
  // and the reason the consent panel does not need its own listener.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== "Escape") return;
      if (consentOpen) setConsentOpen(false);
      else onResolve(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [consentOpen, onResolve]);

  const pick = async (design: CanvaDesign): Promise<void> => {
    setBusy(true);
    try {
      const exported = await transport.export(design.id);
      setChosen({ design, exported, provenance: "as-exported" });
      setFailure(null);
      setStep("import");
    } catch (err) {
      // A transport that cannot produce the file says so and stays on the
      // picker. Never a spinner that quietly gives up.
      setFailure(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const applyScale = (): void => {
    if (chosen === null) return;
    const design = scaleToCover(chosen.exported.design, importJob);
    setChosen({
      ...chosen,
      exported: { ...chosen.exported, design },
      provenance: "scaled",
    });
  };

  const applyRefit = async (): Promise<void> => {
    if (chosen === null) return;
    const assessment = assessImport(chosen.exported.design, importJob);
    setBusy(true);
    try {
      const exported = await transport.export(chosen.design.id, {
        widthMm: assessment.requiredWidthMm,
        heightMm: assessment.requiredHeightMm,
        bleedMm: job.bleedMm,
      });
      setChosen({ design: chosen.design, exported, provenance: "refit" });
      setFailure(null);
    } catch (err) {
      setFailure(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const filtered = designs.filter((d) => {
    const q = query.trim().toLowerCase();
    return q === "" || t(d.nameKey as MessageKey).toLowerCase().includes(q);
  });

  return (
    <div className="cvi-scrim" onClick={() => onResolve(null)}>
      <div
        className="cvi-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={t("flow.title")}
        onClick={(e) => e.stopPropagation()}
      >
        {/* The comp's own words. The flow is an overlay rather than a screen,
            but "back to the artwork screen" is what leaving it actually does —
            "close" would describe the widget instead of the journey. */}
        <button type="button" className="cvi-back" onClick={() => onResolve(null)}>
          <ArrowLeft size={15} aria-hidden="true" />
          {t("flow.back")}
        </button>

        <div className="cvi-head">
          <Monogram />
          <div>
            <h2 className="cvi-h1">{t("flow.title")}</h2>
            <p className="cvi-lede">{t("flow.lede")}</p>
          </div>
          <button
            type="button"
            className="cvi-close"
            aria-label={t("flow.close")}
            onClick={() => onResolve(null)}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <StepRail
          steps={[t("step.connect"), t("step.pick"), t("step.import")]}
          current={step === "connect" ? 0 : step === "pick" ? 1 : 2}
        />

        {busy && (
          <div className="cvi-status" data-tone="neutral" style={{ marginBlockEnd: 14 }}>
            <Search size={19} aria-hidden="true" />
            <span>{t("import.checking")}</span>
          </div>
        )}

        {/* A transport that could not produce a file says so, in its own words,
            on whichever step the customer was standing on — never a spinner
            that gives up quietly. */}
        {failure !== null && (
          <div className="cvi-status" data-tone="danger" style={{ marginBlockEnd: 14 }}>
            <CircleX size={19} aria-hidden="true" />
            <Mono>{failure}</Mono>
          </div>
        )}

        {step === "connect" && (
          <div className="cvi-card">
            <Monogram />
            <div className="cvi-card-title">{t("connect.title")}</div>
            <p className="cvi-p">{t("connect.body")}</p>
            <button type="button" className="cvi-button" onClick={() => setConsentOpen(true)}>
              {t("connect.authorize")}
            </button>
            {/* AC7 — the first step is already a simulated one: pressing
                Authorize contacts nothing. Saying so here rather than three
                steps later is the difference between a labelled demo and a
                demo with a disclaimer at the end. */}
            {transport.simulated && <DemoNote messageKey="demo.connect" />}
            <p className="cvi-fine">{t("notAffiliated")}</p>
          </div>
        )}

        {step === "pick" && (
          <div>
            <div className="cvi-pickbar">
              <div className="cvi-search">
                <Search size={15} aria-hidden="true" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("pick.search")}
                  aria-label={t("pick.search")}
                />
              </div>
              <span className="cvi-fine">{t("pick.these")}</span>
            </div>

            {/* AC7 — the grid below is fixture data. The label sits ABOVE it,
                because a note underneath a list of four designs is a note the
                reader meets after they have already believed the list. */}
            {transport.simulated && (
              <div style={{ marginBlockEnd: 12 }}>
                <DemoNote messageKey="demo.pick" />
              </div>
            )}

            <div className="cvi-grid">
              {filtered.map((design) => (
                <button
                  key={design.id}
                  type="button"
                  className="cvi-design"
                  aria-label={t("pick.choose", { name: t(design.nameKey as MessageKey) })}
                  onClick={() => void pick(design)}
                >
                  <span className="cvi-thumb" data-tint={design.tint}>
                    <ImageIcon size={30} aria-hidden="true" />
                    <Mono className="cvi-thumb-chip">
                      {sizeChip(design.size.widthMm, design.size.heightMm)}
                    </Mono>
                  </span>
                  <span className="cvi-design-meta">
                    <span className="cvi-design-name">{t(design.nameKey as MessageKey)}</span>
                    <Mono className="cvi-design-edited">
                      {t("pick.edited", { date: formatDate(design.editedIso) })}
                    </Mono>
                  </span>
                </button>
              ))}
            </div>

            {filtered.length === 0 && <div className="cvi-empty">{t("pick.none")}</div>}
          </div>
        )}

        {step === "import" && chosen !== null && (
          <ImportStep
            t={t}
            chosen={chosen}
            job={job}
            simulated={transport.simulated}
            onPickAnother={() => {
              setChosen(null);
              setStep("pick");
            }}
            onScale={applyScale}
            onRefit={() => void applyRefit()}
            onUse={() => onResolve(chosen.exported)}
          />
        )}

      </div>

      {/* A sibling of the sheet, not a child of it: the sheet scrolls, and a
          consent panel that scrolled away from the button that opened it would
          be a consent panel a customer could miss. */}
      {consentOpen && (
        <ConsentPanel
          simulated={transport.simulated}
          onAuthorize={() => {
            setConsentOpen(false);
            setStep("pick");
          }}
          onCancel={() => setConsentOpen(false)}
        />
      )}
    </div>
  );
}

function ImportStep({
  t,
  chosen,
  job,
  simulated,
  onPickAnother,
  onScale,
  onRefit,
  onUse,
}: {
  t: TFunction;
  chosen: Chosen;
  job: JobSpec;
  simulated: boolean;
  onPickAnother: () => void;
  onScale: () => void;
  onRefit: () => void;
  onUse: () => void;
}) {
  const assessment = assessImport(chosen.exported.design, toImportJob(job));
  const scale = assessment.remedies.find((r): r is ScaleRemedy => r.kind === "scale");
  const redo = assessment.remedies.find((r): r is RedoRemedy => r.kind === "redo");
  const name = t(chosen.design.nameKey as MessageKey);

  const status = assessment.blocked
    ? t("import.blocked")
    : chosen.provenance === "as-exported"
      ? t("import.ok")
      : t("import.okAgain");

  return (
    <div className="cvi-stack">
      <div className="cvi-status" data-tone={assessment.blocked ? "danger" : "pos"}>
        {assessment.blocked ? (
          <CircleX size={19} aria-hidden="true" />
        ) : (
          <Check size={19} aria-hidden="true" />
        )}
        <span>{status}</span>
        <button type="button" className="cvi-link" onClick={onPickAnother}>
          {t("import.pickAnother")}
        </button>
      </div>

      <div className="cvi-file">
        <span className="cvi-thumb" data-tint={chosen.design.tint}>
          <Mono className="cvi-thumb-chip">{chosen.exported.filename}</Mono>
        </span>
        <div className="cvi-file-body">
          <div className="cvi-file-from">
            <Monogram small />
            <span>{t("import.from", { name })}</span>
          </div>
          {assessment.verdicts.map((verdict) => (
            <VerdictRow key={verdict.key} t={t} verdict={verdict} />
          ))}
        </div>
      </div>

      {assessment.blocked && (
        <div>
          <div className="cvi-fix-head">{t("fix.heading")}</div>
          <div className="cvi-fixes">
            {scale !== undefined && (
              <div className="cvi-fix">
                <div className="cvi-fix-title">
                  {t("fix.scale.title", { pct: scale.scalePct })}
                </div>
                <p className="cvi-fix-body">
                  {t("fix.scale.body", {
                    w: scale.scaledWidthMm,
                    mm: scale.trimPerEdgeMm,
                    safe: SAFE_AREA_MM,
                  })}
                </p>
                <button type="button" className="cvi-button cvi-button--block" onClick={onScale}>
                  {t("fix.scale.cta", { pct: scale.scalePct })}
                </button>
              </div>
            )}

            {redo !== undefined && (
              <div className="cvi-fix">
                <div className="cvi-fix-title">{t("fix.redo.title")}</div>
                <p className="cvi-fix-body">
                  {t("fix.redo.body", {
                    needW: redo.needWidthMm,
                    needH: redo.needHeightMm,
                    trimW: redo.trimWidthMm,
                    trimH: redo.trimHeightMm,
                    bleed: redo.bleedMm,
                  })}
                </p>
                <button
                  type="button"
                  className="cvi-button cvi-button--ghost cvi-button--block"
                  onClick={onRefit}
                >
                  {t("fix.redo.cta")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {!assessment.blocked && (
        <button
          type="button"
          className="cvi-button cvi-button--block"
          onClick={onUse}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        >
          {t("import.use")} <ArrowRight size={16} aria-hidden="true" />
        </button>
      )}

      {/* D11 — wherever a real account would have been read, the demo says so.
          This is the fourth of four such labels, not the only one. */}
      {simulated && <DemoNote messageKey="demo.note" />}
      <p className="cvi-fine">{t("notAffiliated")}</p>
    </div>
  );
}

function VerdictRow({ t, verdict }: { t: TFunction; verdict: ImportVerdict }) {
  const Icon =
    verdict.level === "pass" ? Check : verdict.level === "warn" ? TriangleAlert : CircleX;
  return (
    <div className="cvi-row" data-level={verdict.level}>
      <Icon size={16} aria-hidden="true" />
      {/* The engine's key is already this add-on's short form; the cast is the
          same one the host makes for a key it assembled rather than typed. */}
      <span>{t(verdict.key as MessageKey, verdict.measured)}</span>
    </div>
  );
}
