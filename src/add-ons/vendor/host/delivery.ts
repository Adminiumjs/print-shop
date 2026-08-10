/*
 * VENDORED from add-ons/packages/host/src/delivery.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The ONE shared contract; the three add-ons here import it by relative path.
 */
/**
 * The one slot payload type that is SHARED, and the reason it is the only one.
 *
 * Everything else the host passes into a slot is read by the add-on and never
 * handed back, so each add-on narrows it to the fields it reads and keeps the
 * narrowing next to the engine that does the reading. `DeliveryChoice` is
 * different: a `checkout.delivery.methods` fill CONSTRUCTS one and hands it to
 * the host through `onChoose`, the host STORES it (`deliveryChoice` in the
 * Print Shop's store), and the host hands the same object back down as `chosen`
 * so the fill can draw which row is selected. A narrowing that dropped a field
 * here would not be a narrowing, it would be a delivery option the host cannot
 * record.
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
