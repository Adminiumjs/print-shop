/*
 * VENDORED from add-ons/packages/shipping-dhl/src/ui/atoms.tsx — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `shipping-dhl`; its manifest, tests and README live in the monorepo.
 */
/**
 * The small pieces the three slot fills share.
 *
 * Everything is styled from the token custom properties the host already
 * defines (`--surface`, `--fg-muted`, `--pos`…), never from the host's class
 * names: an add-on that depended on `.mp-panel` existing would break the moment
 * a second app hosted the same slot. Tokens are the contract; class names are
 * one app's private business.
 *
 * CSS LOGICAL PROPERTIES ONLY — `padding-inline`, `inset-inline-start`,
 * `border-block-end`. The host renders Arabic right-to-left with no RTL
 * stylesheet, so a physical `left` here is a bug that only one of eight locales
 * would show.
 */

import type { CSSProperties, ReactNode } from "react";

export const MONO = "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)";

/**
 * A run of digits — a price, a weight, a tracking reference, a date.
 *
 * Always isolated LTR. Arabic reads right to left but its numbers do not, and
 * without the isolation the bidi algorithm cheerfully turns `34 × 26 × 12` into
 * `12 × 26 × 34` in exactly one of the eight locales.
 */
export function Mono({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <span
      style={{
        fontFamily: MONO,
        fontVariantNumeric: "tabular-nums",
        direction: "ltr",
        unicodeBidi: "isolate",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/**
 * The monogram tile (24 D12).
 *
 * Two or three letters on `--surface-3` with a 1px border, in `--fg-muted`. It
 * is not a logo, it is not a logo redrawn, and it carries no brand colour —
 * which is what lets a shelf of twenty add-ons read as one system instead of
 * twenty marks. `aria-hidden` because the add-on's name is always beside it.
 */
export function Monogram({ letters, size = 44 }: { letters: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        inlineSize: size,
        blockSize: size,
        borderRadius: size < 40 ? 9 : 11,
        display: "grid",
        placeItems: "center",
        background: "var(--surface-3)",
        border: "1px solid var(--border-strong)",
        fontSize: size < 40 ? 10 : 12.5,
        fontWeight: 700,
        color: "var(--fg-muted)",
        letterSpacing: "0.02em",
        flex: "0 0 auto",
      }}
    >
      {letters}
    </span>
  );
}

export type Tone = "neutral" | "pos" | "warn" | "danger" | "info";

export function Tag({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  const fg = tone === "neutral" ? "var(--fg-muted)" : `var(--${tone})`;
  const bg = tone === "neutral" ? "var(--surface-3)" : `var(--${tone}-soft)`;
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: fg,
        background: bg,
        padding: "3px 9px",
        borderRadius: 99,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export function Panel({
  children,
  tone,
  style,
}: {
  children: ReactNode;
  /** A coloured edge for the two cards that carry an outcome. */
  tone?: "pos" | "danger";
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        border: tone === undefined ? "1px solid var(--border)" : `1.5px solid var(--${tone})`,
        background: "var(--surface)",
        borderRadius: 14,
        padding: "16px 17px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function PanelTitle({ children, tone }: { children: ReactNode; tone?: "pos" | "danger" }) {
  return (
    <div
      style={{
        fontSize: 14,
        fontWeight: 800,
        color: tone === undefined ? "var(--fg)" : `var(--${tone})`,
      }}
    >
      {children}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = "accent",
  disabled = false,
  style,
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: "accent" | "ghost" | "solid";
  disabled?: boolean;
  style?: CSSProperties;
}) {
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 11,
    padding: "11px 16px",
    fontSize: 13.5,
    fontWeight: 800,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.55 : 1,
  };
  const skin: CSSProperties =
    variant === "ghost"
      ? { border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--fg)" }
      : variant === "solid"
        ? { border: 0, background: "var(--fg)", color: "var(--bg)" }
        : { border: 0, background: "var(--accent)", color: "var(--accent-fg)" };

  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{ ...base, ...skin, ...style }}>
      {children}
    </button>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5, minInlineSize: 0 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--fg-muted)" }}>{label}</span>
      {children}
      {hint !== undefined && (
        <Mono style={{ fontSize: 10.5, color: "var(--fg-subtle)", whiteSpace: "normal" }}>{hint}</Mono>
      )}
    </label>
  );
}

export const inputStyle: CSSProperties = {
  border: "1px solid var(--border-strong)",
  borderRadius: 10,
  background: "var(--surface-2)",
  padding: "10px 12px",
  fontSize: 13.5,
  color: "var(--fg)",
  inlineSize: "100%",
  minInlineSize: 0,
};

export const monoInputStyle: CSSProperties = {
  ...inputStyle,
  fontFamily: MONO,
  direction: "ltr",
};

/** The muted line D12 requires on every add-on surface that names a company. */
export function NotAffiliated({ children }: { children: ReactNode }) {
  return (
    <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.5, color: "var(--fg-subtle)" }}>{children}</p>
  );
}
