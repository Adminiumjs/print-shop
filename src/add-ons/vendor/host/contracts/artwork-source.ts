/*
 * VENDORED from add-ons/packages/host/src/contracts/artwork-source.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The ONE shared contract; the three add-ons here import it by relative path.
 */
/**
 * `artwork-source@1` — copied from `@adminium/add-on-contracts`
 * (`packages/add-on-contracts/src/artwork-source.ts`), not imported.
 *
 * COPIED because the package is not on npm and this repo is published
 * standalone to the Adminiumjs org — the same reasoning `tokens.css` and
 * `i18n/locales.ts` carry in the host app. When the package ships, delete this
 * file and import the types, so an implementation and its contract can never
 * drift.
 *
 * ONE COPY, NOT TWO. Design Studio and Canva Import each carried their own,
 * and the two had already picked up different comments; a field added to one
 * would not have been a fork of the contract in theory only. Do NOT change a
 * shape here to make local code compile: the whole point of a second
 * `artwork-source` implementation is that both are shaped the same.
 *
 * Types only, deliberately. The package's Zod validators need a runtime
 * dependency the host does not carry, and an add-on's shipped bundle may take
 * no runtime dependency the host does not already have (24 D7) — so they live
 * under `../testing/`, where `zod` is a devDependency and nothing ships.
 *
 * The asymmetry that makes this contract worth having: the HOST, not the
 * add-on, runs the artwork checks on the returned `ArtworkRef`. Design Studio's
 * output passes by construction because it was built at the finished size with
 * the bleed already on it; a design brought in from somewhere else routinely
 * does not. Neither implementation marks its own homework.
 */

/** The job the customer is supplying artwork for. */
export interface JobSpec {
  /** Family key, e.g. `business-cards`. */
  productKey: string;
  /** Human label, already localized by the host. */
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
