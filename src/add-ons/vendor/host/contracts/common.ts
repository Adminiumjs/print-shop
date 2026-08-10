/*
 * VENDORED from add-ons/packages/host/src/contracts/common.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The ONE shared contract; the three add-ons here import it by relative path.
 */
/**
 * The one shape more than one contract uses.
 *
 * Copied from `@adminium/add-on-contracts` (`src/common.ts`), not imported: the
 * package is not on npm and this repo is published standalone to the Adminiumjs
 * org. It was copied into two of the three add-ons separately, with the same
 * five lines and two different comments; there is one copy now.
 */

/** A file the host stores: labels here, production files elsewhere, one seam. */
export interface FileRef {
  fileId: string;
  filename: string;
  mediaType: string;
  bytes: number;
}
