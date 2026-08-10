/*
 * VENDORED from add-ons/packages/shipping-dhl/src/label-store.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `shipping-dhl`; its manifest, tests and README live in the monorepo.
 */
/**
 * Where a label's bytes live — THIS ADD-ON'S OWN SHAPE, not part of
 * `shipping-carrier@1`.
 *
 * It used to sit at the bottom of this package's copy of the contract with a
 * comment saying it was not part of the contract, which is a distinction a
 * reader had to be trusted to notice. Now that the contract is one shared
 * package, the file boundary says it instead: `@adminium/add-on-host/contracts`
 * holds only what `@adminium/add-on-contracts` declares, and this is here.
 *
 * The contract returns a `FileRef` because in connected mode the host stores
 * the label through its own file seam and serves it by id. The demo transport
 * has no host to store anything in, so it implements this alongside the
 * contract and the client half reads bytes straight out of it. A real transport
 * leaves this to the host.
 */

export interface LabelStore {
  read(fileId: string): string | undefined;
}
