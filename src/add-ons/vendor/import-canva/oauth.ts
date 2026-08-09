/*
 * VENDORED from add-on-import-canva/src/oauth.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the add-on repo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `import-canva`; its manifest, tests and README live in that repo.
 */
/**
 * What this add-on declares about connecting, and — just as importantly — what
 * it does not implement.
 *
 * THE HOST RUNS THE FLOW (24 §5.6). This add-on declares an authorize URL, a
 * token URL and the scopes it wants; the host performs the authorization-code
 * exchange with PKCE, stores and refreshes the tokens, and hands back an
 * already-authorized HTTP client. There is no client secret in this repo, no
 * token endpoint call, and no refresh timer — and there must never be one. An
 * add-on that implements its own token dance is an add-on that has a copy of
 * the shop's credentials, which is the thing the host owning the flow exists to
 * prevent.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE THREE CONSTANTS BELOW ARE NOT VERIFIED, AND THAT IS DELIBERATE.
 *
 * The exact authorize and token endpoints, the scope identifiers and the
 * export-job shape must be READ FROM THE VENDOR'S CURRENT DOCUMENTATION at
 * implementation time and pinned in the README with the date they were read
 * (24 §8). This repo does not guess them into fact: nothing here is ever
 * called, the demo transport answers every request from a fixture (D11), and
 * the README's endpoint table carries "not yet read" until someone reads them.
 *
 * The one rule that outranks convenience when they ARE read: if the vendor's
 * real scope vocabulary cannot be narrowed to list-the-designs plus
 * export-the-one-chosen, that is a finding to bring back — NOT a scope to widen
 * quietly. The consent panel promises the customer two things and nothing else,
 * and a third scope arriving without the panel changing is how a permission
 * list becomes a lie.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Named nominatively — to say what is being connected to, and nothing more (D12). */
export const VENDOR_NAME = "Canva";

/**
 * The only hostname this add-on's egress allow-list carries. Exact hostname, no
 * wildcard, no scheme, no port (D14) — the manifest repeats it, and the host
 * refuses and audits a call to anything else.
 */
export const VENDOR_API_HOST = "api.canva.com";

/**
 * PENDING VERIFICATION — see the block comment above. Read from the vendor's
 * documentation before this add-on connects to anything real, and record the
 * date in the README.
 */
export const OAUTH = {
  verified: false,
  authorizeUrl: "https://www.canva.com/api/oauth/authorize",
  tokenUrl: `https://${VENDOR_API_HOST}/rest/v1/oauth/token`,
  /**
   * The narrowest pair that can serve this add-on: see the list, fetch the one
   * the customer picked. Nothing about editing, publishing, folders, brand
   * assets or account details.
   */
  scopes: ["design:meta:read", "design:content:read"],
} as const;

/**
 * The client the host hands over once the shop has authorized.
 *
 * Declared, not built: the add-on never constructs one, never sees the token
 * behind it, and cannot reach a hostname outside `network.allow` through it.
 * The demo transport ignores it entirely, which is why the demo needs no
 * credentials at all.
 */
export interface AuthorizedHttpClient {
  get(path: string): Promise<unknown>;
  post(path: string, body: unknown): Promise<unknown>;
}

/**
 * The consent panel's rows, in the order they are read.
 *
 * They are message keys rather than sentences because the panel is the last
 * thing a customer sees before agreeing, and a permission list that only exists
 * in English is a permission list most of the eight locales cannot read.
 */
export const CONSENT_PERMISSIONS = [
  "perm.list",
  "perm.export",
  "perm.nothingElse",
] as const;
