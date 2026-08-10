/*
 * VENDORED from add-ons/packages/design-studio/src/ui/tint.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `design-studio`; its manifest, tests and README live in the monorepo.
 */
/**
 * Product-family tints.
 *
 * The host defines `--tint-card`, `--tint-paper` and the rest as part of its own
 * token layer, and reusing them is what makes a starting-layout tile look like
 * the product grid the customer just came from. The fallbacks exist because
 * those names are the print shop's vocabulary rather than part of the canonical
 * token set — an add-on that renders as a black rectangle in a host that never
 * heard of `--tint-label` is a worse outcome than one that carries five
 * gradients it usually does not use.
 *
 * No photography anywhere: a demo works has no real product shots, and a stock
 * photograph pretending to be one is a worse lie than an honest tinted panel.
 */

const FALLBACK: Record<string, string> = {
  card: "linear-gradient(135deg, #db2777 0%, #9d174d 100%)",
  paper: "linear-gradient(135deg, #4f46e5 0%, #312e81 100%)",
  mail: "linear-gradient(135deg, #0e7490 0%, #134e4a 100%)",
  label: "linear-gradient(135deg, #b25e09 0%, #7c2d12 100%)",
  large: "linear-gradient(135deg, #0f766e 0%, #134e4a 100%)",
};

export function tint(family: string): string {
  return `var(--tint-${family}, ${FALLBACK[family] ?? FALLBACK.paper})`;
}
