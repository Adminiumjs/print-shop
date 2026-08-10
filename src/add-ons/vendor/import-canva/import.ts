/*
 * VENDORED from add-ons/packages/import-canva/src/import.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `import-canva`; its manifest, tests and README live in the monorepo.
 */
/**
 * The import engine: what a design exported from somewhere else measures, what
 * the job needs, and the two honest ways out when they disagree.
 *
 * Pure and deterministic — no clock, no network, no randomness. There is no
 * clock argument here because bleed geometry has none; the pinned clock enters
 * this add-on in `demo/transport.ts`, which is the only module that has dates
 * to invent.
 *
 * The rule this module exists to keep: A REMEDY WITHOUT ITS NUMBERS IS NOT A
 * REMEDY. "Scale it up so it bleeds" is a shrug; "scale it up 10.9%, at which
 * about 1.6mm comes off each of the left and right edges" is a decision a
 * customer can actually make. Both remedies carry every figure their copy
 * renders, computed here rather than typed into a screen.
 *
 * It is also deliberately NOT the judge of whether artwork may print. The host
 * runs its own checks on the `ArtworkRef` this add-on hands back (24 §5.5) —
 * these verdicts exist so the customer sees the same answer BEFORE they commit,
 * in the same words, and so this add-on refuses to hand over a file it already
 * knows will be rejected.
 */

/** A design as the vendor exported it, in millimetres at its natural size. */
export interface DesignSize {
  widthMm: number;
  heightMm: number;
  /** Bleed present on every edge. A design made at trim size has none. */
  bleedMm: number;
  /** Resolution at that natural size. Scaling up divides it. */
  dpi: number;
  pages: number;
}

/** The job the design has to fit. Mirrors the host's `JobSpec` numbers. */
export interface ImportJob {
  trimWidthMm: number;
  trimHeightMm: number;
  /** Bleed the works needs on every edge. */
  bleedMm: number;
  sides: 1 | 2;
  /** The lowest resolution the works will print at the finished size. */
  minDpi: number;
}

/**
 * One check, carrying THE MEASURED NUMBER that produced it — the same shape as
 * the host's `ArtworkVerdict`, so the import screen renders the identical rows
 * the upload path renders. The wording of the `check.*` messages deliberately
 * matches the host's `verdict.*` messages: one check reported by one sentence,
 * whichever door the artwork came in through.
 */
export interface ImportVerdict {
  level: "pass" | "warn" | "fail";
  /** i18n key under `addon.import-canva.check.*`. */
  key: string;
  measured: Record<string, number | string>;
}

/** Scale the design up until it covers the job, and lose the overshoot to the knife. */
export interface ScaleRemedy {
  kind: "scale";
  /** Uniform factor, e.g. 1.109. */
  scale: number;
  /** The same figure as a percentage increase, e.g. 10.9. */
  scalePct: number;
  scaledWidthMm: number;
  scaledHeightMm: number;
  /** Millimetres trimmed from EACH of the left and right edges beyond the bleed. */
  trimPerEdgeMm: number;
  /** The same for the top and bottom edges. */
  blockTrimPerEdgeMm: number;
  /** Resolution once the design has been enlarged. */
  scaledDpi: number;
}

/** Go back to the design tool, make it the right size, and import it again. */
export interface RedoRemedy {
  kind: "redo";
  /** What to set the design size to — trim plus bleed on every edge. */
  needWidthMm: number;
  needHeightMm: number;
  trimWidthMm: number;
  trimHeightMm: number;
  bleedMm: number;
  /** How far in from the edge anything important should sit. */
  safeAreaMm: number;
}

export type ImportRemedy = ScaleRemedy | RedoRemedy;

export interface ImportAssessment {
  /** Trim plus bleed on every edge — the size the works needs the file at. */
  requiredWidthMm: number;
  requiredHeightMm: number;
  verdicts: ImportVerdict[];
  /** Empty when nothing is wrong. Never a single remedy when two are honest. */
  remedies: ImportRemedy[];
  /** True when at least one verdict is a `fail`: the design cannot print as it is. */
  blocked: boolean;
}

/**
 * Anything important should sit this far in from the trim. Advisory, not a
 * refusal — a customer who wants ink to the very edge may mean it.
 */
export const SAFE_AREA_MM = 4;

/**
 * How much overshoot beyond the bleed passes without comment. Two millimetres
 * is roughly what a guillotine takes anyway; more than that and the design is a
 * different shape from the job, which the customer should hear about before the
 * knife tells them.
 */
export const SHAPE_TOLERANCE_MM = 2;

/** Millimetres compare to a nanometre — the slack is for binary fractions, not for tolerance. */
const EPS = 1e-9;

const round1 = (v: number): number => Math.round(v * 10) / 10;
const round3 = (v: number): number => Math.round(v * 1000) / 1000;

export function requiredSize(job: ImportJob): { widthMm: number; heightMm: number } {
  return {
    widthMm: job.trimWidthMm + job.bleedMm * 2,
    heightMm: job.trimHeightMm + job.bleedMm * 2,
  };
}

/**
 * The uniform factor that makes a design cover the job on BOTH axes — the
 * larger of the two ratios, because the smaller one would leave a bare edge.
 * Never below 1: a design that already covers is left alone rather than shrunk
 * to fit, which would throw away bleed the customer already paid attention to.
 */
export function coverScale(design: DesignSize, job: ImportJob): number {
  const need = requiredSize(job);
  return Math.max(need.widthMm / design.widthMm, need.heightMm / design.heightMm, 1);
}

/**
 * The first remedy, applied: the design as it would arrive after scaling.
 *
 * Two consequences fall out of the arithmetic rather than being asserted, and
 * both are why this is a transform rather than a flag. The bleed becomes the
 * smaller of the two per-edge margins the enlargement creates — which is
 * exactly the works' bleed on the binding axis, never more. And the resolution
 * divides by the same factor, so a design scaled far enough to cover can fail
 * the resolution check it passed a moment ago. Re-assessing the RESULT is what
 * catches that; nothing here has to remember to.
 */
export function scaleToCover(design: DesignSize, job: ImportJob): DesignSize {
  const scale = coverScale(design, job);
  const widthMm = design.widthMm * scale;
  const heightMm = design.heightMm * scale;
  return {
    widthMm,
    heightMm,
    bleedMm: Math.min(
      (widthMm - job.trimWidthMm) / 2,
      (heightMm - job.trimHeightMm) / 2,
    ),
    dpi: design.dpi / scale,
    pages: design.pages,
  };
}

function verdictsFor(design: DesignSize, job: ImportJob): ImportVerdict[] {
  const need = requiredSize(job);
  const verdicts: ImportVerdict[] = [];

  const covers =
    design.widthMm >= need.widthMm - EPS && design.heightMm >= need.heightMm - EPS;
  const hasBleed = design.bleedMm >= job.bleedMm - EPS;

  if (covers && hasBleed) {
    verdicts.push({ level: "pass", key: "check.bleedOk", measured: { mm: round1(design.bleedMm) } });
  } else {
    verdicts.push({
      level: "fail",
      key: "check.bleedMissing",
      measured: {
        mm: round1(design.bleedMm),
        needMm: job.bleedMm,
        haveW: round1(design.widthMm),
        haveH: round1(design.heightMm),
        needW: round1(need.widthMm),
        needH: round1(need.heightMm),
      },
    });
  }

  const dpi = Math.round(design.dpi);
  if (dpi >= job.minDpi) {
    verdicts.push({ level: "pass", key: "check.dpiOk", measured: { dpi } });
  } else {
    verdicts.push({
      level: "fail",
      key: "check.dpiLow",
      measured: { dpi, need: job.minDpi },
    });
  }

  // Shape. Only worth a row once the design covers: while it is too small the
  // bleed row above has already said the size is wrong, and a second sentence
  // about proportions would be noise on top of it.
  if (covers) {
    const inlineTrim = (design.widthMm - need.widthMm) / 2;
    const blockTrim = (design.heightMm - need.heightMm) / 2;
    if (inlineTrim > SHAPE_TOLERANCE_MM || blockTrim > SHAPE_TOLERANCE_MM) {
      verdicts.push({
        level: "warn",
        key: "check.shapeOff",
        measured: { inline: round1(inlineTrim), block: round1(blockTrim) },
      });
    } else {
      verdicts.push({ level: "pass", key: "check.shapeOk", measured: {} });
    }
  }

  if (design.pages === job.sides) {
    verdicts.push({
      level: "pass",
      key: "check.pages",
      measured: { pages: design.pages, sides: job.sides },
    });
  } else if (design.pages < job.sides) {
    verdicts.push({
      level: "fail",
      key: "check.pagesShort",
      measured: { pages: design.pages, need: job.sides },
    });
  } else {
    verdicts.push({
      level: "warn",
      key: "check.pagesExtra",
      measured: { pages: design.pages, need: job.sides },
    });
  }

  return verdicts;
}

const blockedBy = (verdicts: readonly ImportVerdict[]): boolean =>
  verdicts.some((v) => v.level === "fail");

/**
 * Assess a design against a job: the rows to show, and what can be done.
 *
 * The scale remedy is offered only when scaling actually FIXES the file — the
 * result is assessed before it is offered, so a design that would merely trade
 * a missing bleed for too few dots never gets a button promising otherwise.
 * The redo remedy is offered whenever the design is blocked, because going back
 * and setting the size correctly always works.
 */
export function assessImport(design: DesignSize, job: ImportJob): ImportAssessment {
  const need = requiredSize(job);
  const verdicts = verdictsFor(design, job);
  const blocked = blockedBy(verdicts);
  const remedies: ImportRemedy[] = [];

  if (blocked) {
    const scale = coverScale(design, job);
    if (scale > 1 + EPS) {
      const scaled = scaleToCover(design, job);
      if (!blockedBy(verdictsFor(scaled, job))) {
        remedies.push({
          kind: "scale",
          scale: round3(scale),
          scalePct: round1((scale - 1) * 100),
          scaledWidthMm: round1(scaled.widthMm),
          scaledHeightMm: round1(scaled.heightMm),
          trimPerEdgeMm: round1((scaled.widthMm - need.widthMm) / 2),
          blockTrimPerEdgeMm: round1((scaled.heightMm - need.heightMm) / 2),
          scaledDpi: Math.round(scaled.dpi),
        });
      }
    }

    remedies.push({
      kind: "redo",
      needWidthMm: round1(need.widthMm),
      needHeightMm: round1(need.heightMm),
      trimWidthMm: job.trimWidthMm,
      trimHeightMm: job.trimHeightMm,
      bleedMm: job.bleedMm,
      safeAreaMm: SAFE_AREA_MM,
    });
  }

  return {
    requiredWidthMm: round1(need.widthMm),
    requiredHeightMm: round1(need.heightMm),
    verdicts,
    remedies,
    blocked,
  };
}
