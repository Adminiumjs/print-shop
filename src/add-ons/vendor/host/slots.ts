/*
 * VENDORED from add-ons/packages/host/src/slots.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The ONE shared contract; the three add-ons here import it by relative path.
 */
/**
 * The slots a host app offers, and how each behaves (24 §5.4, D6).
 *
 * ONE MIRROR, NOT THREE. Every add-on in this repo used to carry its own copy
 * of this list, narrowed to the ids it happened to fill, and after a day the
 * copies no longer agreed. They are one file now — `packages/host` — and the
 * three add-ons import it.
 *
 * STILL COPIED RATHER THAN IMPORTED, for the same reason each copy gave: this
 * repo is published standalone to the Adminiumjs org, the closed registry lives
 * in `@adminium/add-on-contracts` inside the Adminium monorepo, and the host
 * app that mounts these slots (`print-shop/src/add-ons/slots.ts`) is a third
 * standalone repo. None of the three can depend on the others. What changed is
 * the number of mirrors, not the fact of mirroring.
 *
 * THE HOST IS AUTHORITATIVE. Where this file and `print-shop/src/add-ons/
 * slots.ts` disagree, the host is right and this is stale —
 * `host-mirror.test.ts` reads the host's own source and fails when an id here
 * is missing from it, so "stale" is a red suite rather than a support ticket.
 *
 * `nav.add-on.routes` is deliberately absent: the closed registry carries it,
 * but the Print Shop has no router and mounts no such slot. A slot an add-on
 * can declare and nothing will ever mount is worse than an absent one, because
 * an add-on author reads the list and writes code against it.
 */

export const HOSTED_SLOTS = [
  'artwork.sources',
  'checkout.delivery.methods',
  'order.dispatch.panel',
  'order.dispatch.actions',
  'settings.add-on.panel',
] as const;

/**
 * Every id a fill may name.
 *
 * The three copies each narrowed this to the two-to-four ids their own add-on
 * filled, which is why one of them could keep filling `nav.add-on.routes` for a
 * release after the host stopped hosting it. The full union is the honest type:
 * a slot the host drops disappears from HERE, and every add-on that named it
 * goes red on the next build. Where an add-on wants the narrower guarantee it
 * says so locally — see each package's `FILLED_SLOTS`.
 */
export type SlotId = (typeof HOSTED_SLOTS)[number];

/**
 * How a slot behaves when nothing fills it.
 *
 * `speaks` — the host renders a real, honest empty state IN WORDS. Used where a
 * customer has something to be told: that other ways to send artwork exist but
 * none is connected, that no carrier is available, that the job will be
 * collected rather than posted.
 *
 * `silent` — the host renders NOTHING. Used on the shop floor, where a works
 * with no carrier connected simply hands the job over the counter and a dashed
 * "no carriers" panel would be noise nobody can act on.
 *
 * Where an empty slot has something to explain it says it in words; where it
 * has nothing to explain it renders nothing.
 */
export const SLOT_EMPTY_BEHAVIOUR: Readonly<Record<SlotId, 'speaks' | 'silent'>> = {
  'artwork.sources': 'speaks',
  'checkout.delivery.methods': 'speaks',
  'order.dispatch.panel': 'speaks',
  'order.dispatch.actions': 'silent',
  'settings.add-on.panel': 'silent',
};

/**
 * `single` slots take the lowest `order`; `multi` render every fill;
 * `per-add-on` renders the fill belonging to ONE add-on, named by the caller.
 *
 * The third value is not a special case bolted on for the manage drawer — it is
 * the fill rule the closed registry already records for `settings.add-on.panel`,
 * restated here because this repo cannot import that package.
 */
export const SLOT_FILL: Readonly<Record<SlotId, 'single' | 'multi' | 'per-add-on'>> = {
  'artwork.sources': 'multi',
  'checkout.delivery.methods': 'multi',
  'order.dispatch.panel': 'single',
  'order.dispatch.actions': 'multi',
  'settings.add-on.panel': 'per-add-on',
};
