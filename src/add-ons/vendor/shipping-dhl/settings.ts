/*
 * VENDORED from add-ons/packages/shipping-dhl/src/settings.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `shipping-dhl`; its manifest, tests and README live in the monorepo.
 */
/**
 * The settings the CLIENT half is allowed to see — `publicSettings` in the
 * manifest, and nothing else (24 D15).
 *
 * `api_key` and `account_number` are marked `secret: true` and are absent from
 * this module deliberately: they are injected into the server context, redacted
 * in every API response, and the packer greps the client bundle for their keys.
 * If a secret ever needs to reach a screen, the answer is a server call that
 * returns the ANSWER, never the secret.
 *
 * ONE ALPHABET, and it is the machine one. These field names are the keys
 * `manifest.json` declares, the keys `register()` lists in `settings`, and the
 * keys the host stores the shop's values under — so a value crosses the seam
 * without anyone translating it on the way. It used to be camelCase here and
 * snake_case in the manifest, with the host normalising between the two; a host
 * that has to know how an add-on spells its own fields is a host that has to be
 * edited when a second one spells them differently.
 */

export interface PublicSettings {
  /** D11 — on by default. The demo makes no third-party call, ever. */
  demo_transport: boolean;
  /** `HH:MM`. Book before it and the van calls the same afternoon. */
  collection_cutoff: string;
}

export const DEFAULT_SETTINGS: PublicSettings = {
  demo_transport: true,
  collection_cutoff: "15:00",
};

let current: PublicSettings = { ...DEFAULT_SETTINGS };

export function publicSettings(): PublicSettings {
  return current;
}

/**
 * Applied by the host when the shop changes something in the settings panel. It
 * replaces rather than merges partially so a caller cannot half-apply a
 * settings document and leave the transport in a state nobody chose.
 *
 * The parameter is deliberately loose — the host holds these values as an
 * opaque `Record<string, unknown>` and has no business knowing their types, so
 * the add-on is the one that reads them back into its own shape and ignores
 * anything it does not recognise.
 */
export function applySettings(next: Readonly<Record<string, unknown>>): void {
  const demo = next.demo_transport;
  const cutoff = next.collection_cutoff;
  current = {
    demo_transport: typeof demo === "boolean" ? demo : DEFAULT_SETTINGS.demo_transport,
    collection_cutoff:
      typeof cutoff === "string" && cutoff !== "" ? cutoff : DEFAULT_SETTINGS.collection_cutoff,
  };
}
