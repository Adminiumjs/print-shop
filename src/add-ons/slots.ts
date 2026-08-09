/**
 * The slots this app hosts (24 §5.4, D6).
 *
 * A mirror of the closed registry in `@adminium/add-on-contracts`, copied
 * rather than imported for the same reason `styles/tokens.css` and
 * `i18n/locales.ts` are: this app is a standalone repo published to the
 * Adminiumjs org and cannot depend on the monorepo. The ids are the contract —
 * do not invent one here.
 *
 * FOUR of the five this app hosts are customer- or staff-facing surfaces with
 * an empty state; the fifth — the settings panel — has no visible empty state
 * by nature. THE EMPTY STATES ARE NOT AN OVERSIGHT. They exist whether or not a
 * single add-on does, which is what makes an add-on optional rather than the
 * way the app was always going to work.
 *
 * `settings.add-on.panel` is FILLED, not merely declared: all three add-ons
 * render their own settings form into it, which is why the manage drawer no
 * longer carries a branch per add-on key.
 *
 * ── WHY `nav.add-on.routes` IS NOT HERE ─────────────────────────────────────
 *
 * The closed registry in `@adminium/add-on-contracts` still carries it, and an
 * app with a router should host it. THIS APP HAS NO ROUTER — `app/App.tsx`
 * switches views off one store field on purpose, so the whole demo is one
 * bundle with no history to get out of step with the dock's persona segment.
 *
 * It was listed here for one release, Design Studio shipped a real fill for it,
 * and nothing ever mounted it: the fill could not render, and there was no link
 * anywhere that could have reached its route if it had. A slot a host declares
 * and never mounts is worse than an absent one, because an add-on author reads
 * the list and writes code against it. Design Studio's editor is reachable —
 * through `artwork.sources`, which is the path the conformance suite drives —
 * so nothing was lost by dropping the fill along with the declaration.
 *
 * `addOns.test.ts` now asserts that EVERY id below is mounted somewhere in
 * `src/`, so this cannot happen again in either direction.
 */

export const HOSTED_SLOTS = [
  'artwork.sources',
  'checkout.delivery.methods',
  'order.dispatch.panel',
  'order.dispatch.actions',
  'settings.add-on.panel',
] as const;

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
 * the fill rule `@adminium/add-on-contracts` already records for
 * `settings.add-on.panel` in the closed registry, restated here because this
 * app cannot import that package.
 */
export const SLOT_FILL: Readonly<Record<SlotId, 'single' | 'multi' | 'per-add-on'>> = {
  'artwork.sources': 'multi',
  'checkout.delivery.methods': 'multi',
  'order.dispatch.panel': 'single',
  'order.dispatch.actions': 'multi',
  'settings.add-on.panel': 'per-add-on',
};
