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
 * SOMEBODY ELSE'S WORDS — a person's name, a street, a town.
 *
 * ── WHY THIS IS NOT `Mono`, WHICH IS WHERE IT WAS ───────────────────────────
 *
 * The destination panel drew every line of the recipient's address through
 * `Mono`, and a host's Arabic-digit guard reported "21 Westgate" as a Latin
 * quantity on an Arabic page. It is not one — a house number is part of an
 * address and transliterating it would misdeliver the parcel — but nothing in
 * the markup said so, and there was no honest way for the host to know.
 *
 * `Mono` DECLARES ITS ISOLATION IN CSS (`direction: ltr; unicode-bidi:
 * isolate`) and not in the `dir` attribute. That is enough for the bidi
 * algorithm and invisible to everything else: a host reads the attribute,
 * because the attribute is the semantic statement and the CSS is a
 * presentational consequence of it. So this is not a new idea, it is the same
 * idea written where a reader — human or otherwise — can see it.
 *
 * ── AND WHY `Mono` DOES NOT SIMPLY GAIN A `dir` ─────────────────────────────
 *
 * Because `Mono` is where every price, weight and dimension in this add-on
 * goes, and those ARE quantities: a host's guard is supposed to report them
 * when they are unformatted, and this add-on shipped exactly that defect once
 * already ("8.5 مم" beside the host's own "٣ مم"). Marking them all as islands
 * would quiet the guard by lying to it, which is the failure mode the hosts'
 * own note about `dir` warns against.
 *
 * `dir="auto"` rather than `"ltr"`: an Arabic customer's address is Arabic, and
 * "auto" is a statement about whose text it is rather than a guess at which way
 * it runs.
 */
export function Typed({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <span
      dir="auto"
      style={{
        fontFamily: MONO,
        fontVariantNumeric: "tabular-nums",
        unicodeBidi: "isolate",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/**
 * A CODE — a consignment number, a reference, something a machine issued.
 *
 * ── WHY IT IS NOT `Mono`, WHICH IS ALSO WHERE THIS WAS ──────────────────────
 *
 * `Mono` isolates its run in CSS. That is correct typography and it is not a
 * DECLARATION: a host's Arabic-page guard reads `dir`, because `dir` is the only
 * marker that costs something to apply — it moves the run on the page, so it
 * cannot be sprinkled on a weight to quiet a guard without the weight visibly
 * moving. Everything drawn through `Mono` therefore reads to a host as the app's
 * own prose, which is exactly what makes the guard worth having: every price and
 * every weight in this add-on goes through `Mono` and must stay visible to it.
 *
 * A consignment number is the other thing. `00 3400 1234 5678 9012` is an
 * identifier the carrier issued, its digits are not a quantity anybody computed,
 * and transliterating them into ٠٠ ٣٤٠٠ … would be the worse bug — it is copied
 * into a carrier's own tracking box. So it declares itself with `dir`, and the
 * host guard reads the declaration and leaves it alone.
 *
 * It was in `Mono`, so the maker's dispatch panel and the tracking list both
 * showed four bare Latin runs on an Arabic page with nothing saying why. Neither
 * host's tour had ever booked a collection, so neither host had ever seen it.
 *
 * `Typed` is not this: `Typed` is `dir="auto"`, for somebody else's WORDS, whose
 * direction depends on what they wrote. A code is always LTR.
 */
export function Code({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <span
      dir="ltr"
      style={{
        fontFamily: MONO,
        fontVariantNumeric: "tabular-nums",
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

/**
 * A pill. IT WRAPS, and the reason is a bug rather than a preference.
 *
 * It used to be `whiteSpace: "nowrap"`, which is right for `cheapest` and for a
 * tracking status and wrong for the longest thing this component is ever asked
 * to hold: the D11 label, "These services, prices and dates come from a demo
 * carrier. Nothing is sent to a real one." In the print works' wide dispatch
 * column that sentence fitted. In Birch Row's narrower one it was 483px of
 * unbreakable text in a 415px row — it overflowed the panel, ran off the
 * viewport, and the words a reader most needed ("Nothing is sent to a real
 * one") were the ones cut off. A label whose whole job is to say a result is
 * simulated is not allowed to be the label that does not fit.
 *
 * `minInlineSize: 0` is the other half: without it the pill refuses to shrink
 * below its content in a flex row and wrapping never gets a chance.
 */
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
        lineHeight: 1.45,
        minInlineSize: 0,
        overflowWrap: "anywhere",
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
