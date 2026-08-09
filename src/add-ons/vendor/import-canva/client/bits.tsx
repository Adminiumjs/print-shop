/*
 * VENDORED from add-on-import-canva/src/client/bits.tsx — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the add-on repo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `import-canva`; its manifest, tests and README live in that repo.
 */
/**
 * The small pieces the three steps share. Nothing here holds state.
 */

import { FlaskConical } from "lucide-react";
import type { ReactNode } from "react";

import { useAddOnT, useLocale } from "../i18n/useT.ts";
import type { MessageKey } from "../i18n/t.ts";

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

/** `85 × 55 mm`, in the one shape every size chip in this add-on uses. */
export function sizeChip(widthMm: number, heightMm: number): string {
  const round = (v: number): number => Math.round(v * 10) / 10;
  return `${round(widthMm)} × ${round(heightMm)} mm`;
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
  return (
    <div className="cvi-steps">
      {steps.map((label, i) => (
        <div
          key={label}
          className="cvi-step"
          data-state={i === current ? "current" : i < current ? "done" : "todo"}
        >
          <Mono className="cvi-step-n">{i + 1}</Mono>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
