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
 * copies no longer agreed. They are one file now — `packages/host` — and every
 * package imports it.
 *
 * STILL COPIED RATHER THAN IMPORTED, for the same reason each copy gave: this
 * repo is published standalone to the Adminiumjs org, the closed registry lives
 * in `@adminium/add-on-contracts` inside the Adminium monorepo, and the host
 * apps that mount these slots (`print-shop/src/add-ons/slots.ts` and
 * `maker-shop/src/add-ons/slots.ts`) are two more standalone repos. None of the
 * four can depend on the others. What changed is the number of mirrors, not the
 * fact of mirroring.
 *
 * THE HOSTS ARE AUTHORITATIVE. Where this file and a host's own `slots.ts`
 * disagree, the host is right and this is stale — `host-mirror.test.ts` reads
 * BOTH hosts' sources and fails when an id either one mounts is missing here,
 * so "stale" is a red suite rather than a support ticket.
 *
 * ── TWO HOSTS, AND WHY THE LIST GREW ────────────────────────────────────────
 *
 * [Amended 2026-08-10, wave 4b.] This file used to hold the Print Shop's five,
 * because the Print Shop was the only host. Birch Row mounts eight, six of
 * which the print works does not, and that is not a widening of the contract —
 * it is D21 arriving: **a slot id names a surface, never an app**, so a second
 * host was always going to mount ids the first one had no use for. The union
 * below is the closed registry, minus nothing: every id in it is mounted by at
 * least one of the two hosts except `record.editor.panel`, whose host is
 * Adminium's generated dashboard rather than an example app and whose mount is
 * Phase B (§5.10, D20) — and, since 2026-08-28, `record.actions`.
 *
 * [Amended 2026-08-28, wave 6.] The registry is TWELVE. `record.actions` was
 * bought against the seven-exhibit dossier in 31 Appendix A.1 and arrives with
 * no fill anywhere in this repo, because the add-on that could have filled it
 * turned out not to need it. It is in the union for the same reason
 * `record.editor.panel` is: an add-on may name it in a manifest today, and a
 * union that omitted it would fail every such manifest at compile time while
 * the closed registry accepted it.
 *
 * WHICH MEANS THIS LIST NOW HAS TWO IDS NO EXAMPLE APP MOUNTS, and a reader
 * counting them is right to be uneasy. The guard that keeps it honest is not
 * here — it is in each host's own suite, where every id in THAT host's
 * `HOSTED_SLOTS` must be mounted somewhere in its `src/`. Nothing obliges a
 * host to host an id, and everything obliges a host that says it does.
 *
 * `nav.add-on.routes` is in the list and is now genuinely mounted — by Birch
 * Row, whose maker shell has a full-screen route for an add-on to occupy. The
 * amendment recorded against §5.4 stands as history: for one release the Print
 * Shop declared it, Design Studio filled it, and nothing anywhere drew it,
 * because the Print Shop switches views off one store field and has no router.
 * That is why each host's own `HOSTED_SLOTS` is asserted, in the host's own
 * suite, to be mounted somewhere in its `src/`.
 */

export const HOSTED_SLOTS = [
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
  'record.actions',
] as const;

/**
 * Every id a fill may name.
 *
 * The three old copies each narrowed this to the two-to-four ids their own
 * add-on filled, which is why one of them could keep filling a slot the host
 * had stopped hosting. The full union is the honest type: a slot the registry
 * drops disappears from HERE, and every add-on that named it goes red on the
 * next build. Where an add-on wants the narrower guarantee it says so locally —
 * see each package's `FILLED_SLOTS`.
 */
export type SlotId = (typeof HOSTED_SLOTS)[number];

/**
 * How a slot behaves when nothing fills it.
 *
 * `speaks` — the host renders a real, honest empty state IN WORDS. Used where
 * somebody has something to be told: that other ways to send artwork exist but
 * none is connected, that no carrier is available, that the studio posts
 * everything itself — and, the one that matters most in wave 4b, that a piece
 * can still be personalized with a note field and a proof (D19). A `speaks`
 * empty state is a FINISHED SCREEN, not a gap.
 *
 * `silent` — the host renders NOTHING. Not a dashed box, not a muted "no
 * add-ons here", not a heading with a gap under it. Used on the shop floor and
 * beside a basket line, where there is nothing a reader could act on and a
 * placeholder would make an unconnected shop look broken.
 *
 * ── AND THERE IS NO SHARED TABLE OF VALUES HERE. THAT IS THE RULING. ────────
 *
 * [Decided 2026-08-11, wave 4b round 3.] This file used to carry a
 * `SLOT_EMPTY_BEHAVIOUR` record — one value per slot id, mirrored from the
 * first host — and `host-mirror.test.ts` made every host agree with it. The
 * second host disagreed about `settings.add-on.panel` and the suite went red,
 * which is the question worth answering: is empty behaviour a property of the
 * SLOT, or of the HOST'S SCREEN?
 *
 * It is a property of the screen, and the two hosts were both right:
 *
 *   · Marlow Press mounts that slot inside a manage drawer that puts it under
 *     its own "Settings" HEADING, and has always passed
 *     `addon.host.manage.noSettings` — "This one has nothing to set." A heading
 *     with a gap under it is a hole, so that mount SPEAKS.
 *   · Birch Row inlines the same panel among the add-on's other rows with no
 *     heading of its own and passes no fallback. Nothing is promised, so
 *     nothing is owed, and that mount is SILENT.
 *
 * Neither is a mistake, and there is no third value that would let one table
 * describe both. The same slot id lands on two differently built screens, and
 * D19 is a rule about WHAT A READER SEES — a rule about screens.
 *
 * The strongest evidence came from inside ONE host: Birch Row mounts
 * `cart.line.preview` three times, and its own file already records that the
 * basket mount renders nothing while the order page and the send-a-proof dialog
 * hand over the material tile. One host, one slot id, two behaviours. A table
 * keyed by slot id cannot state that, so it is not the right key.
 *
 * WHERE THE DECLARATION LIVES NOW: each host declares its own
 * `SLOT_EMPTY_BEHAVIOUR`, keyed by ITS `HostedSlotId`, in its own
 * `src/add-ons/slots.ts` — and each host's `slotRender.test.tsx` checks that
 * declaration against ITS OWN RENDERED SCREENS, in both directions (a `silent`
 * mount hands over no fallback and carries no caption; a `speaks` mount hands
 * over real words). That is a stronger guard than agreement with a sibling repo
 * ever was: it compares a claim against the thing the claim is about.
 *
 * WHAT THIS REPO STILL GUARDS, so the ruling is not a licence to drift:
 * `host-mirror.test.ts` asserts, for every host beside it, that the host
 * decides a behaviour for EVERY slot it mounts and for no slot it does not, and
 * that every value is one of the two below. A host that grows a mount and
 * forgets to decide is still a red suite here, in one place, and the check no
 * longer forces two honest screens to tell the same lie.
 *
 * An add-on reads none of this. It renders when it is asked to and does not
 * know what the host draws in its absence — which is why the type is exported
 * and the values are not.
 */
export type SlotEmptyBehaviour = 'speaks' | 'silent';

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
  'nav.add-on.routes': 'multi',
  'product.options.personalize': 'single',
  'cart.line.preview': 'multi',
  'product.admin.panel': 'multi',
  'order.line.actions': 'multi',
  'record.editor.panel': 'multi',
  'record.actions': 'multi',
};
