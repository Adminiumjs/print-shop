/*
 * VENDORED from add-ons/packages/import-canva/src/client/bits.tsx — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `import-canva`; its manifest, tests and README live in the monorepo.
 */
/**
 * The small pieces the three steps share. Nothing here holds state.
 */

import { FlaskConical } from "lucide-react";
import { useMemo, type ReactNode } from "react";

import { useAddOnT, useLocale } from "../i18n/useT.ts";
import type { MessageKey, TFunction } from "../i18n/t.ts";

/**
 * Two or three letters in a neutral tile — never a logo, drawn, traced or
 * approximated (24 D12). `aria-hidden` because the name is always beside it in
 * text; a screen reader announcing "C N V" adds nothing.
 */
export function Monogram({ small = false }: { small?: boolean }) {
  return (
    <span
      className={small ? "cvi-monogram cvi-monogram--sm" : "cvi-monogram"}
      aria-hidden="true"
    >
      CNV
    </span>
  );
}

/**
 * The simulation label, one step's worth of it (24 D11, AC7).
 *
 * Every step of this flow shows something a real account would have supplied —
 * the connect card offers to authorize one, the consent panel takes the
 * answer, the picker lists four designs, the import step reports on a file —
 * and in the demo every one of those comes from a fixture. So every one of them
 * carries this line, with wording that fits the step it is standing on.
 *
 * It renders ONLY when the transport says it is simulated, and `simulated` is a
 * property of the transport rather than a build flag: a self-host build that
 * swaps in the host's authorized client removes the labels by doing so, with no
 * copy left behind claiming a demo that no longer exists.
 */
export function DemoNote({ messageKey }: { messageKey: MessageKey }) {
  const t = useAddOnT();
  return (
    <p className="cvi-demo">
      <FlaskConical size={14} aria-hidden="true" />
      <span>{t(messageKey)}</span>
    </p>
  );
}

/**
 * A run of digits — millimetres, dpi, a file name, a date.
 *
 * Always tabular and always isolated LTR. Arabic reads right to left but its
 * numbers do not, and without the isolation the bidi algorithm cheerfully turns
 * `85 × 55` into `55 × 85` in exactly one of the eight locales.
 */
export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={className ? `cvi-mono ${className}` : "cvi-mono"}>{children}</span>;
}

/**
 * `85 × 55 mm`, in the one shape every size chip in this add-on uses — THROUGH
 * THE BUNDLE, because both the figures and the unit belong to the reader.
 *
 * [Corrected 2026-08-11, wave 4b round 5.] This built the chip in a template
 * literal: two raw JavaScript numbers and a hard-coded English `mm`, rendered
 * identically in all eight locales. On the design picker in ar-EG the chip read
 * `85 × 55 mm` while `check.bleedOk` and `fix.redo` — the very next things the
 * same flow says about the same design — wrote `مم`, and zh-CN read `mm` beside
 * its own `毫米`. The bundle already had the unit right in every locale; this
 * one function went around it.
 *
 * It takes `t` rather than calling a hook because it is a string, used inside
 * `<Mono>` and in an `aria-label`, and its callers are components that already
 * hold one. The numbers go in as NUMBERS so `translator`'s `Intl.NumberFormat`
 * gets them; rounding stays here because a tenth of a millimetre is a property
 * of the quantity, not of the language.
 */
export function sizeChip(t: TFunction, widthMm: number, heightMm: number): string {
  const round = (v: number): number => Math.round(v * 10) / 10;
  return t("dims", { w: round(widthMm), h: round(heightMm) });
}

/**
 * A bare figure with no words around it, in the reader's own digits.
 *
 * `t()` covers every number that sits inside a sentence. A number rendered
 * ALONE — the step numbers on the rail — never goes near it, and that is
 * exactly how `1 2 3` came to stand against Arabic labels on a wizard whose
 * every other figure was formatted. There is no string to translate here, only
 * a numeral system to respect.
 */
export function useNum(): (value: number) => string {
  const locale = useLocale();
  return useMemo(() => {
    const nf = new Intl.NumberFormat(locale);
    return (value: number) => nf.format(value);
  }, [locale]);
}

/**
 * A date the customer last touched a design. Parsed at midday UTC so the day
 * cannot slip backwards for a reader west of Greenwich — a demo whose seeded
 * dates depend on where it is opened is not a pinned demo.
 */
export function useDateFormat(): (iso: string) => string {
  const locale = useLocale();
  return (iso) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(
      new Date(`${iso}T12:00:00Z`),
    );
}

export function StepRail({ steps, current }: { steps: readonly string[]; current: number }) {
  const num = useNum();
  return (
    <div className="cvi-steps">
      {steps.map((label, i) => (
        <div
          key={label}
          className="cvi-step"
          data-state={i === current ? "current" : i < current ? "done" : "todo"}
        >
          {/*
           * `{i + 1}` is what this was: a bare Latin 1, 2, 3 against Arabic
           * labels. `.cvi-mono` isolates its run in CSS but declares no `dir`,
           * so these were not Latin islands either — just unformatted numbers
           * on a surface no host's tour reached, because the rail only exists
           * once the customer has clicked into the wizard.
           */}
          <Mono className="cvi-step-n">{num(i + 1)}</Mono>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
