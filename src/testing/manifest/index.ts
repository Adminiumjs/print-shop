/**
 * The vendored `@adminium/manifest` surface this repo's suite uses.
 *
 * The five modules beside this one are verbatim copies of the monorepo's
 * `packages/manifest` and `packages/add-on-contracts` sources — see the header
 * each carries, and `scripts/sync-manifest-validator.mjs`, which writes them.
 * Never hand-edit one: run that script, or `--check` it in CI. This barrel
 * exists so a test imports `validateManifest` from one place, exactly as it
 * would from the package.
 *
 * NOTHING UNDER `src/testing/` MAY BE IMPORTED BY SHIPPED CODE. `zod` is a
 * devDependency here and a runtime dependency the host does not carry (24 D7),
 * so an import from a screen would put a validator in a customer's browser.
 * `src/sources.test.ts` asserts that no shipped module reaches this directory.
 */

export {
  FIRST_PARTY_PUBLISHER_ID,
  MANIFEST_CAPABILITIES,
  MANIFEST_CATEGORIES,
  MANIFEST_KINDS,
  MANIFEST_VERSION,
  RESERVED_KEYS,
  appManifestSchema,
  isAddOnManifest,
  manifestSchema,
  type AppManifest,
  type Manifest,
} from './schema.ts';
export {
  validateManifest,
  type ManifestIssue,
  type ValidateManifestResult,
} from './validate.ts';
