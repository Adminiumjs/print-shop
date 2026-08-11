/**
 * The slots this app hosts (24 §5.4, D6).
 *
 * A mirror of the closed registry in `@adminium/add-on-contracts`, copied
 * rather than imported for the same reason `styles/tokens.css` and
 * `i18n/locales.ts` are: this app is a standalone repo published to the
 * Adminiumjs org and cannot depend on the monorepo. The ids are the contract —
 * do not invent one here.
 *
 * FOUR of the five this app hosts say something in words when nothing fills
 * them; one — the works' dispatch actions — renders nothing at all, because a
 * shop floor with no carrier connected simply hands the job over the counter.
 * THE EMPTY STATES ARE NOT AN OVERSIGHT. They exist whether or not a single
 * add-on does, which is what makes an add-on optional rather than the way the
 * app was always going to work.
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

/**
 * THE CLOSED REGISTRY (24 §5.4). Eleven names, and not a twelfth.
 *
 * ── WHY THIS LIST EXISTS SEPARATELY FROM `HOSTED_SLOTS` ─────────────────────
 *
 * [Added 2026-08-10, wave 4b.] `SlotId` used to BE this app's hosted five, and
 * conflating the two was wrong in a way that only a second host could show.
 * A slot id names a SURFACE and belongs to the registry; which surfaces THIS
 * app mounts is this app's own business. An add-on written for a maker studio
 * may fill `product.options.personalize`, and the print works not mounting it
 * is not a reason for that add-on to fail to compile — it is exactly what D21
 * claims when it says the same add-on runs in both shops with no change to
 * either repo. A fill for a slot nobody here mounts simply never renders.
 *
 * `payloads.ts` maps every id below to its payload and asserts, at compile
 * time, that the two lists cover each other exactly.
 */
export const SLOT_IDS = [
  'artwork.sources',
  'checkout.delivery.methods',
  'order.dispatch.panel',
  'order.dispatch.actions',
  'settings.add-on.panel',
  'nav.add-on.routes',
  'product.options.personalize',
  'cart.line.preview',
  'product.admin.panel',
  'order.line.actions',
  'record.editor.panel',
] as const;

export type SlotId = (typeof SLOT_IDS)[number];

/** THE FIVE THIS APP MOUNTS. */
export const HOSTED_SLOTS = [
  'artwork.sources',
  'checkout.delivery.methods',
  'order.dispatch.panel',
  'order.dispatch.actions',
  'settings.add-on.panel',
] as const satisfies readonly SlotId[];

export type HostedSlotId = (typeof HOSTED_SLOTS)[number];

/** Whether this build mounts a slot at all. */
export function isHosted(slot: SlotId): slot is HostedSlotId {
  return (HOSTED_SLOTS as readonly string[]).includes(slot);
}

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
 *
 * ── THIS TABLE IS THIS APP'S, AND NO OTHER APP'S ────────────────────────────
 *
 * [Ruled 2026-08-11, wave 4b round 3.] The add-on monorepo used to keep a
 * shared copy of these values and make every host match it. It is gone, because
 * empty behaviour is a property of THE SCREEN A HOST BUILT, not of the slot id:
 * this works speaks into `settings.add-on.panel` because its manage drawer puts
 * that panel under a heading, and the maker studio is silent in the same slot
 * because its drawer inlines the panel with nothing promised above it. Both
 * screens are right and no single value describes both.
 *
 * So the declaration is local and what checks it is local: `slotRender.test.tsx`
 * renders THIS app and compares every line below against what the page actually
 * hands its mounts, in both directions. The monorepo still checks, across both
 * hosts, that a host decides a behaviour for every slot it mounts and for no
 * slot it does not — the drift that guard exists to catch, minus the part that
 * forced two honest screens to agree.
 */
export const SLOT_EMPTY_BEHAVIOUR: Readonly<Record<HostedSlotId, 'speaks' | 'silent'>> = {
  'artwork.sources': 'speaks',
  'checkout.delivery.methods': 'speaks',
  'order.dispatch.panel': 'speaks',
  'order.dispatch.actions': 'silent',
  /*
   * SPEAKS, and this table said `silent` until a render suite looked at the
   * page (2026-08-11, wave 4b round 2). The manage drawer puts this slot under
   * its own "Settings" heading, and has always passed
   * `addon.host.manage.noSettings` — "This one has nothing to set." — as the
   * fallback. A heading with nothing under it is not a silent slot, it is a
   * hole; the words are right and the table was wrong, so the table moved.
   *
   * Nothing on screen changed. What changed is that the declaration and the
   * screen now agree, which is the only reason the declaration is worth having.
   *
   * The maker studio says `silent` for this same id and is equally right: its
   * drawer inlines the panel among the add-on's other rows with no heading of
   * its own, so nothing there is promised and nothing is owed. That is the case
   * that settled where this table belongs — see the header.
   */
  'settings.add-on.panel': 'speaks',
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
  'nav.add-on.routes': 'multi',
  'product.options.personalize': 'single',
  'cart.line.preview': 'multi',
  'product.admin.panel': 'multi',
  'order.line.actions': 'multi',
  'record.editor.panel': 'multi',
};
