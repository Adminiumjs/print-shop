/*
 * VENDORED from add-ons/packages/host/src/delivery.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The ONE shared contract; the three add-ons here import it by relative path.
 */
/**
 * THE ONE SHAPE THAT TRAVELS BOTH WAYS.
 *
 * ── WHAT THIS HEADER USED TO SAY, AND WHY IT IS GONE ────────────────────────
 *
 * [Rewritten 2026-08-10, wave 4b.] It used to open "the one slot payload type
 * that is SHARED, and the reason it is the only one", and go on to state the
 * rule that everything else a host passes into a slot "is read by the add-on
 * and never handed back, so each add-on narrows it to the fields it reads".
 *
 * That rule is the CAUSE of the 24 D21 failure, not a description of the seam,
 * and it had been superseded for a day by the time anyone read this file again.
 * `payloads.ts` documents the whole account: each add-on duly wrote down "the
 * fields I read", which in practice was "the fields the one host I was built
 * against happened to send", and the second host's first screen threw three
 * times. Every payload now lives in the shared mirror, one per slot id, keyed
 * by `SlotId` and reached through `PayloadFor<S>`. NOTHING is narrowed on the
 * add-on's side of the wire; an add-on narrows what it READS, against a shape
 * both hosts promise.
 *
 * A stale header is not a cosmetic problem here. This file and `payloads.ts`
 * are the two places an add-on author looks to learn where a shape belongs, and
 * they were giving opposite answers — one of them the answer that broke the
 * thing.
 *
 * ── WHY `DeliveryChoice` IS STILL FILED ON ITS OWN ──────────────────────────
 *
 * Because it is the only shape in the seam that is not a payload at all. Every
 * type in `payloads.ts` travels host → add-on. This one travels BOTH ways: a
 * `checkout.delivery.methods` fill CONSTRUCTS one and hands it over through
 * `onChoose`, the host STORES it, and the host hands the same object back down
 * as `chosen` so the fill can draw which row is selected. `CheckoutPayload`
 * imports it from here rather than declaring it, so the type the host records
 * and the type the add-on builds cannot come apart.
 *
 * NEUTRAL BY CONSTRUCTION, which is the point of it. There is no carrier in
 * this shape, no service code the host understands and no tracking: it is a
 * label, an amount, a currency and a date, all of them the add-on's own. The
 * label arrives already translated because the words for a delivery service
 * belong to whoever sells it. Swapping the delivery company changes nothing
 * here, which is the same claim `AddOn` makes one file over.
 */

export interface DeliveryChoice {
  /**
   * The add-on that quoted it, so the host can drop the choice when that
   * add-on is switched off — and so a second delivery company's rows do not
   * light up because the first one's did. The host does not scope it, because
   * the host does not know which add-on drew which row.
   */
  addOn: string;
  /** The add-on's own service code. Opaque to the host; it is how the fill re-selects. */
  code: string;
  /** Already in the reader's language — the add-on renders its own names. */
  label: string;
  amount: number;
  currency: string;
  /** ISO date the add-on estimated. */
  estimatedDelivery: string;
}
