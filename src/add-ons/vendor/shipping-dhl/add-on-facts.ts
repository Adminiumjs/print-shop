/*
 * VENDORED from add-ons/packages/shipping-dhl/src/add-on-facts.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `shipping-dhl`; its manifest, tests and README live in the monorepo.
 */
/**
 * THE FACTS A HOST'S OWN GATES NEED FROM THIS ADD-ON.
 *
 * ── WHY THESE LIVE HERE AND NOT IN THE APPS THAT RECEIVE THEM ───────────────
 *
 * A host app runs release gates over the code it ships, and some of those gates
 * need to know things that are true of an ADD-ON: which addresses it names and
 * cannot call, which of its strings must never reach a browser. Both used to be
 * written out inside each host — so the Print Shop's D11 list carried Canva's
 * endpoints, and BOTH hosts' D15 bundle gate carried the delivery add-on's
 * secret setting keys and its carrier hostname.
 *
 * That is AC20/D21 broken, and it was demonstrated in both directions:
 * vendoring the personalizer into the print works unchanged, registration only,
 * turned that host's `sources.test.ts` red on an address it had never heard of;
 * vendoring Canva Import into the studio did the same there. Making a portable
 * add-on pass required editing an exemption list inside the app receiving it.
 *
 * It is worse than red suites in the other direction, which is what the second
 * export is for. A host's "no credential reached the browser" gate was a list
 * of the two add-ons that happened to exist; a THIRD credentialled add-on
 * vendored into either shop would have shipped its secret setting keys with
 * that gate fully green, because a gate cannot look for a needle nobody told it
 * about. The two hosts' lists had ALREADY drifted apart by one entry.
 *
 * So the facts travel with the add-on. Each host discovers whatever it has
 * VENDORED with `import.meta.glob` — the mechanism round 5 built for
 * `NOT_A_QUANTITY`, which stays in `i18n/strings.ts` beside the strings it is
 * about. Vendor this add-on and its facts arrive; drop it and they leave;
 * nothing in either host changes either way.
 *
 * ── AND THEY ARE CHECKED AGAINST THE MANIFEST, NOT TRUSTED ──────────────────
 *
 * `NEVER_IN_A_BROWSER` would be one more hand-kept list if nothing compared it
 * with what this add-on actually declares. This package's own manifest suite
 * asserts it covers every `secret: true` setting key and every `network.allow`
 * hostname in `manifest.json` — the two things a manifest already states — so
 * the day one is added there and not here, that suite is red in the one repo
 * that holds both files.
 *
 * The shapes are declared inline rather than imported from
 * `@adminium/add-on-host/testing`: this is shipped code, `testing/` is the
 * test-only entry point that pulls in zod, and no module that ships may reach
 * it (24 D7). The structure is what the hosts read, not the type.
 */

/**
 * ADDRESSES THIS ADD-ON NAMES, AND WHY NONE CAN CAUSE A REQUEST.
 *
 * A host's D11 net reports every absolute URL in what it ships whose ORIGIN
 * nobody has declared inert. An entry is a decision somebody wrote down, with a
 * reason a reviewer reads instead of a pattern they have to trust — never a
 * licence to CALL the address, because the net beside it bans everything that
 * could. An empty list is the strictest state there is: every address is
 * reported, so naming one means coming here and saying why it stays a string.
 */
export const INERT_ORIGINS: readonly { origin: string; why: string }[] = [];

/**
 * STRINGS THAT MUST NEVER APPEAR IN A CLIENT BUNDLE (24 D15, D11).
 *
 * A host greps every emitted file for each of these. They are this add-on's
 * server-side facts: the machine keys a credential would be SAVED under, the
 * type its server half reads them into, and the real hostname that half calls.
 * A demo's transports are all demo ones, so none of them has any business in a
 * browser — and a leak is silent otherwise, because a bundle full of minified
 * identifiers looks the same either way.
 */
export const NEVER_IN_A_BROWSER: readonly { text: string; why: string }[] = [
  {
    text: "api_key",
    why: "a `secret: true` setting key from manifest.json \u2014 the name a credential would be SAVED under, which is the leak. The connect dialog's own LABEL is a different string and is allowed to exist",
  },
  {
    text: "account_number",
    why: "the other `secret: true` setting key from manifest.json",
  },
  {
    text: "CarrierCredentials",
    why: "the type the server half reads both of them into. Not in the manifest \u2014 a type name is a code fact \u2014 so it is declared here and is the reason this export is not simply generated",
  },
  {
    text: "express.api.dhl.com",
    why: "the one hostname manifest.json's `network.allow` carries. The server half calls it; the client half must not be able to name it",
  },
];

/**
 * COMPANY MARKS THIS ADD-ON'S OWN SCREENS MAY PRINT (24 AC6).
 *
 * ── WHY A HOST NEEDS THIS, AND WHY IT CANNOT HOLD IT ITSELF ─────────────────
 *
 * AC6, as amended 2026-08-09, is about the READER: wherever a customer meets
 * the name of a real company, the line saying Adminium is not affiliated with
 * it has to be in front of them — not one screen further in. Each host proves
 * that by touring its own app and asking, of every surface, whether anything on
 * it names a company (`src/add-ons/affiliation.test.tsx`).
 *
 * To ask, it has to know which words are marks, and a host that held the list
 * would be holding an add-on's fact — the defect this wave found five times,
 * most recently with two hosts' `NEVER_IN_A_BROWSER` lists a whole entry apart.
 * So the marks travel with the add-on, exactly as its inert origins and its
 * server-side needles do. Vendor this add-on and its marks arrive; drop it and
 * they leave; nothing in either host changes either way.
 *
 * AN EMPTY LIST IS A STATEMENT AND NOT A DEFAULT: it says this add-on names no
 * company, which is the same fact `namesCompany: false` reports to the host and
 * the same fact its section of `TRADEMARKS.md` states in prose.
 */
export const COMPANY_MARKS: readonly { mark: string; owner: string }[] = [
  { mark: "DHL", owner: "Deutsche Post AG" },
  /*
   * The owner's own name, because the label the demo prints and the carrier
   * copy both can say it. A mark is a mark whether or not it is the short one.
   */
  { mark: "Deutsche Post", owner: "Deutsche Post AG" },
];
