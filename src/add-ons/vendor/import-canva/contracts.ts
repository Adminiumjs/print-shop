/*
 * VENDORED from add-on-import-canva/src/contracts.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the add-on repo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `import-canva`; its manifest, tests and README live in that repo.
 */
/**
 * `artwork-source@1`, copied from `@adminium/add-on-contracts`
 * (packages/add-on-contracts/src/artwork-source.ts).
 *
 * COPIED RATHER THAN IMPORTED because this is a standalone repo published to
 * the Adminiumjs org and the package is not yet on npm — the same reasoning
 * `styles/tokens.css` and `i18n/locales.ts` carry in the host app. When the
 * package ships, delete this file and import the types. Until then: do NOT
 * change a shape here. A field added on this side is not an extension of the
 * contract, it is a fork of it, and the whole point of a second
 * `artwork-source` implementation is that both are shaped the same.
 *
 * Types only, deliberately: the package's Zod validators come with a `zod`
 * dependency the host does not ship, and D7 forbids one. The validator this
 * repo does need — `artworkRefSchema`, for the conformance suite — lives in
 * `src/testing/conformance.ts`, which is test-only and never bundled.
 *
 * The asymmetry that makes this contract worth having: the HOST, not the
 * add-on, runs the artwork checks on the returned `ArtworkRef`. Design Studio's
 * output passes by construction because it was built at the finished size with
 * the bleed already on it; a design brought in from somewhere else routinely
 * does not. Neither implementation marks its own homework.
 */

/** The job the customer is supplying artwork for. */
export interface JobSpec {
  /** Product family key, e.g. `business-cards`. */
  productKey: string;
  /** Human label for the product, already localized by the host. */
  productLabel: string;
  /** Finished (trim) size in millimetres. */
  trimWidthMm: number;
  trimHeightMm: number;
  /** Bleed the works needs on every edge, in millimetres. */
  bleedMm: number;
  sides: 1 | 2;
  quantity: number;
}

/** What an artwork source hands back to the host. */
export interface ArtworkRef {
  fileId: string;
  /** The add-on key that produced it. */
  source: string;
  widthMm: number;
  heightMm: number;
  bleedMm: number;
  dpi: number;
  pages: number;
  previewFileId?: string;
}

export interface ArtworkSource {
  readonly key: string;
  /** e.g. "Design it here" / "Bring it from Canva" — the host renders it. */
  label(job: JobSpec): string;
  available(job: JobSpec): AvailabilityVerdict;
  /** Resolves to the artwork, or null when the customer backed out. */
  start(job: JobSpec): Promise<ArtworkRef | null>;
}

export type AvailabilityVerdict = { ok: true } | { ok: false; reason: string };
