/**
 * The small shared pieces. Nothing here holds state; everything takes props and
 * renders, so a screen can be read top to bottom without chasing a component.
 */

import type { ReactNode } from "react";

import { number as ambientNumber } from "../i18n/ambient.ts";
import { useT } from "../i18n/index.tsx";
import type { TintFamily } from "../lib/catalogue.ts";
import { tint } from "../lib/format.ts";

/**
 * A run of digits — a price, a millimetre, a reference, a date.
 *
 * Always tabular and always isolated LTR. Arabic reads right to left but its
 * numbers do not, and without the isolation the bidi algorithm cheerfully turns
 * `85 × 55` into `55 × 85` in exactly one of the eight locales.
 */
/**
 * A number handed to `<Mono>` IS FORMATTED, which is the other half of what
 * this component is for.
 *
 * `<Mono>{quantity}</Mono>` and `<Mono>{row.onHand}</Mono>` put a raw
 * JavaScript number into the DOM, and a raw number is Latin digits in every
 * locale — so the stock table sat a column of Latin figures beside Arabic
 * headings and Arabic prices, on the same row. Everything already formatted
 * arrives as a STRING (`cents()`, `mm()`, `day()`) and is untouched; what is
 * caught here is exactly the value nobody remembered to format, at the one seam
 * every such value already passes through.
 */
function localizeDigits(node: ReactNode): ReactNode {
  if (typeof node === "number") return ambientNumber(node);
  if (Array.isArray(node)) return node.map(localizeDigits);
  return node;
}

export function Mono({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span className={className ? `mp-mono ${className}` : "mp-mono"} style={style}>
      {localizeDigits(children)}
    </span>
  );
}

/**
 * SOMEBODY ELSE'S WORDS, IN SOMEBODY ELSE'S DIRECTION.
 *
 * A customer types "same as MP-4113, but 2019 instead" into the change box and
 * the works prints it back on the job's history. On an Arabic page that run is a LATIN island
 * inside RTL prose, and two things follow from that which the app was getting
 * wrong:
 *
 *   1. TYPOGRAPHY. Without a direction of its own the bidi algorithm reorders
 *      the run's punctuation against the paragraph — the quotes and the middle
 *      dot end up on the wrong sides of words the customer wrote.
 *   2. NUMERALS. `numerals.arabic.test.tsx` bans a Latin quantity on an Arabic
 *      page, and a year in a customer's own sentence is not a quantity this
 *      works computed — it is what they wrote, and it must come back to the
 *      press exactly as written.
 *
 * `dir="auto"` says exactly what is true: the direction is whatever the text
 * itself is, decided per value, so Arabic wording written by an Arabic customer
 * still reads RTL. It is the marker the guard reads and the fix the typography
 * needed, and it is one component rather than a `dir` remembered at every
 * call site.
 */
export function Typed({ children }: { children: ReactNode }) {
  return <span dir="auto">{children}</span>;
}

/*
 * THERE IS NO `<Code>` HERE, and Birch Row has one.
 *
 * Same idea, different shape: the codes this works prints — MP-4113, SRA3, a
 * postcode — all carry Latin LETTERS, so they are identifiers by the rule
 * `i18n/numerals.arabic.test.tsx` states and need no marker. The one place a
 * bare run of digits is a code rather than a quantity is the demo card on the
 * checkout, and those are `<input>` elements: an input takes its own `dir`, so
 * a wrapper would be a second element saying what the field already says.
 */

export function Tag({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "pos" | "warn" | "danger" | "info";
  children: ReactNode;
}) {
  return <span className={tone === "neutral" ? "mp-tag" : `mp-tag mp-tag--${tone}`}>{children}</span>;
}

/**
 * An option chip.
 *
 * `reason` is the whole point of this component: when it is present the chip is
 * disabled AND RENDERS THE REASON, so a customer who cannot have soft-touch on
 * a text weight is told why rather than left to guess. A disabled chip with no
 * reason is not a state this app has.
 */
export function Chip({
  selected = false,
  reason,
  label,
  sub,
  onClick,
  onDisabledClick,
}: {
  selected?: boolean;
  reason?: string | null;
  label: ReactNode;
  sub?: ReactNode;
  onClick?: () => void;
  onDisabledClick?: () => void;
}) {
  const blocked = typeof reason === "string" && reason.length > 0;
  return (
    <button
      type="button"
      className="mp-chip mp-btn"
      aria-pressed={selected}
      disabled={blocked}
      // A disabled button swallows clicks, so the explanation is reachable via
      // the wrapper: tapping the chip's row opens the same words in a popover.
      onClick={blocked ? undefined : onClick}
      onPointerDown={blocked ? onDisabledClick : undefined}
      title={blocked ? reason : undefined}
    >
      <span>{label}</span>
      {(sub !== undefined || blocked) && (
        <span className="mp-chip-sub">{blocked ? reason : sub}</span>
      )}
    </button>
  );
}

export function Field({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="mp-field">
      <span className="mp-label">{label}</span>
      {children}
    </label>
  );
}

/**
 * The gradient tile that stands in for a photograph.
 *
 * No photography anywhere in this app: a demo print works has no real product
 * shots, and a stock photo pretending to be one would be a worse lie than an
 * honest tinted panel. One tint per product family, reused everywhere that
 * family appears, so the colour becomes a name.
 */
export function Tile({
  family,
  icon,
  chip,
  badge,
  className,
  style,
}: {
  family: TintFamily;
  icon: ReactNode;
  chip?: ReactNode;
  badge?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={className ? `mp-tile ${className}` : "mp-tile"}
      style={{ ...style, ["--tile" as string]: tint(family) }}
    >
      {icon}
      {chip !== undefined && <span className="mp-tile-chip">{chip}</span>}
      {badge !== undefined && <span className="mp-tile-badge">{badge}</span>}
    </div>
  );
}

/**
 * A slot with nothing in it, speaking.
 *
 * Used only where an empty slot HAS SOMETHING TO EXPLAIN to a customer. The
 * staff-facing dispatch slot renders nothing at all instead — a dashed panel on
 * the shop floor saying "no carriers" would be noise nobody can act on.
 */
export function SlotEmpty({ title, body }: { title: string; body: string }) {
  return (
    <div className="mp-slot-empty">
      <div className="mp-slot-empty-title">{title}</div>
      <div className="mp-slot-empty-body">{body}</div>
    </div>
  );
}

/**
 * A setting that is on or off, with the sentence that explains it.
 *
 * The note is REQUIRED, not optional: every switch in the add-on chrome
 * changes something a shop owner cannot see from the label alone — whether a
 * real carrier is called, whether a design still gets proofed — and a bare
 * toggle would leave them to find out by flipping it.
 */
export function Switch({
  on,
  label,
  note,
  onChange,
}: {
  on: boolean;
  label: ReactNode;
  note: ReactNode;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      className="mp-switch mp-btn"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
    >
      <span className="mp-switch-track" aria-hidden="true">
        <span className="mp-switch-knob" />
      </span>
      <span className="mp-switch-body">
        <span className="mp-switch-label">{label}</span>
        <span className="mp-switch-note">{note}</span>
      </span>
    </button>
  );
}

export function Monogram({ letters, small = false }: { letters: string; small?: boolean }) {
  return (
    <span className={small ? "mp-monogram mp-monogram--sm" : "mp-monogram"} aria-hidden="true">
      {letters}
    </span>
  );
}

export function Skeleton({ height = 44, width }: { height?: number; width?: number | string }) {
  return <div className="mp-skel" style={{ height, width }} aria-hidden="true" />;
}

/** The loading shimmer a view switch shows for a beat. */
export function ScreenSkeleton() {
  const t = useT();
  return (
    <div className="mp-stack" aria-busy="true" aria-label={t("common.loading")}>
      <Skeleton height={34} width="min(320px, 60%)" />
      <div className="mp-grid">
        <Skeleton height={210} />
        <Skeleton height={210} />
        <Skeleton height={210} />
        <Skeleton height={210} />
      </div>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="mp-empty">{children}</div>;
}
