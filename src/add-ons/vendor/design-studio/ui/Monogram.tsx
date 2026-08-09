/*
 * VENDORED from add-on-design-studio/src/ui/Monogram.tsx — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the add-on repo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `design-studio`; its manifest, tests and README live in that repo.
 */
/**
 * The add-on's mark: two letters in a neutral tile (24 D12).
 *
 * NEVER a company logo, drawn, traced, approximated or embedded — and for this
 * add-on there is not even a company to name. The tile stays neutral anyway,
 * because a shelf of twenty add-ons has to read as one system rather than as
 * twenty logos, and an add-on that gave itself a brand colour would be the
 * first crack in that.
 */
export function Monogram({ large = false }: { large?: boolean }) {
  return (
    <span className={large ? "ds-monogram ds-monogram--lg" : "ds-monogram"} aria-hidden="true">
      DS
    </span>
  );
}
