/*
 * VENDORED from add-on-design-studio/src/contracts.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the add-on repo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `design-studio`; its manifest, tests and README live in that repo.
 */
/**
 * `artwork-source@1`, copied from `@adminium/add-on-contracts`
 * (packages/add-on-contracts/src/{artwork-source,common}.ts).
 *
 * COPIED RATHER THAN IMPORTED because this is a standalone repo published to
 * the Adminiumjs org and the package is not on npm yet — the same reasoning
 * `styles/tokens.css` and `i18n/locales.ts` carry in the host app. When the
 * package ships, delete this file and import it, so an implementation and its
 * contract can never drift.
 *
 * ONE DELIBERATE OMISSION: the package's Zod validators are not copied here.
 * `zod` is not a dependency the host has, and D7 forbids an add-on's client
 * half taking one the host does not already carry. The validators live in
 * `testing/schemas.ts` instead, where zod is a devDependency and the bundle
 * never reaches them.
 *
 * The asymmetry that makes this contract worth having: the HOST, not the
 * add-on, runs the artwork checks on the returned `ArtworkRef`. This editor's
 * output passes because it was built at the finished size with the bleed
 * already on it — which is a fact about the construction, not a claim this
 * add-on gets to make about itself.
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

export type AvailabilityVerdict = { ok: true } | { ok: false; reason: string };

export interface ArtworkSource {
  readonly key: string;
  /** e.g. "Design it here" / "Bring it from Canva" — the host renders it. */
  label(job: JobSpec): string;
  available(job: JobSpec): AvailabilityVerdict;
  /** Resolves to the artwork, or null when the customer backed out. */
  start(job: JobSpec): Promise<ArtworkRef | null>;
}

/** Shared by more than one contract; the host stores every file through it. */
export interface FileRef {
  fileId: string;
  filename: string;
  mediaType: string;
  bytes: number;
}
