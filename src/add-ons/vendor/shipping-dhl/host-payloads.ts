/*
 * VENDORED from add-ons/packages/shipping-dhl/src/host-payloads.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `shipping-dhl`; its manifest, tests and README live in the monorepo.
 */
/**
 * WHAT THE HOST HANDS THIS ADD-ON'S FILLS, as much of it as this add-on reads.
 *
 * These four shapes used to live in this package's private copy of the host
 * seam, beside `AddOn` and `SlotId`. The seam itself is now one shared mirror
 * in `@adminium/add-on-host`; these stayed behind, and the line between them is
 * the rule this repo works to:
 *
 *   a type the add-on CONSTRUCTS and hands back to the host must match the host
 *   exactly, so it is shared;
 *   a type the add-on only READS may be narrowed, so it lives with the add-on.
 *
 * Everything below is read-only traffic. The Print Shop passes `{ job }` into
 * `order.dispatch.*` and `{ basket, chosen, onChoose }` into
 * `checkout.delivery.methods`, out of its OWN job and basket records — records
 * with a dozen fields this add-on has no use for. It declares neither
 * `HostJob` nor `HostBasketLine` under those names anywhere, because there is
 * nothing for it to declare: they are this add-on's reading of what arrived.
 *
 * DELIBERATELY MINIMAL, and that is a feature rather than laziness. They name
 * the fields this add-on reads and nothing else, so a host that grows a field
 * on its job record does not break the add-on, and so the fields this add-on
 * depends on are legible in one screen rather than inferred from an app-sized
 * interface.
 *
 * `DeliveryChoice` is the exception that proves the rule and is NOT here: a
 * fill builds one and hands it over, the host stores it, and the host hands it
 * back. It is shared, in `@adminium/add-on-host`.
 */

import type { DeliveryChoice } from "../host/index.ts";

/**
 * One job on the works board, as much of it as this add-on reads.
 *
 * The slot registry says `order.dispatch.actions` is handed "the order + its
 * parcel estimate"; the print shop currently passes the job alone, which is why
 * `parcel.ts` estimates the parcel here. When a host starts passing an estimate,
 * that engine becomes the fallback rather than the source.
 */
export interface HostJob {
  ref: string;
  productKey: string;
  materialKey: string;
  /**
   * WHO the parcel is for, as the host spells it — a display name in the print
   * shop, since it resolves its own customer keys before it hands a job over.
   *
   * This field used to be documented as "a customer key" while the host passed
   * a name, and the add-on looked it up in a table keyed by key. Every lookup
   * missed, and the miss fell through to a seeded address — so the dispatch
   * screen pre-filled the WRONG customer's street for every job it was given.
   * `resolveDestination()` now matches on either spelling and, when both miss,
   * says so on screen instead of guessing (`seed.ts`).
   */
  customer: string;
  /**
   * The stable key, when the host has one to give.
   *
   * OPTIONAL, and preferred where it exists: a key survives a shop renaming its
   * customer, a display name does not. A host that passes it gets an exact
   * match; a host that does not is matched by name.
   */
  customerKey?: string;
  quantity: number;
  trimWidthMm: number;
  trimHeightMm: number;
  packagingKey: string;
  stage: string;
  promisedFor: string;
}

export interface DispatchPayload {
  job: HostJob;
}

/** One configured line in the customer's basket, as much of it as this add-on reads. */
export interface HostBasketLine {
  id: string;
  config: {
    product: string;
    material: string;
    /** A preset key from the host's size table, or `custom` with the millimetres. */
    size: string;
    customWidthMm?: number;
    customHeightMm?: number;
    quantity: number;
    packaging: string;
  };
}

/**
 * What `checkout.delivery.methods` is handed.
 *
 * THE SELECTION LIVES IN THE HOST, NOT HERE. It used to be local `useState` in
 * `DeliveryMethods.tsx`, which made the rate rows a control that looked
 * selectable and changed nothing: the host went on quoting its own standard
 * delivery, the order summary never mentioned the carrier, and the customer's
 * click bought them a filled radio dot. `chosen` is the host's record of what
 * it has been told, and `onChoose` is the only way it learns.
 */
export interface CheckoutPayload {
  basket: readonly HostBasketLine[];
  /**
   * What the host currently holds, or null. It is the same object this fill
   * handed over, so `addOn` is what tells a second delivery company's rows not
   * to light up because the first one's did — the host does not scope it,
   * because the host does not know which add-on drew which row.
   */
  chosen?: DeliveryChoice | null;
  onChoose?: (choice: DeliveryChoice) => void;
}
