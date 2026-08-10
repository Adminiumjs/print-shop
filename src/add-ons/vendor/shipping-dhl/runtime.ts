/*
 * VENDORED from add-ons/packages/shipping-dhl/src/runtime.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `shipping-dhl`; its manifest, tests and README live in the monorepo.
 */
/**
 * Which transport the client half is talking to.
 *
 * In DEMO MODE — what ships, and the default (24 D11) — that is the seeded
 * carrier in this repo, running in the page. In CONNECTED MODE the host swaps
 * in a proxy that forwards each contract call to the add-on's SERVER half,
 * where the credentials live and where the only `fetch` in the system happens.
 * The screens do not change and do not know which one they have; only this
 * module's `carrier()` answer does. That is the same seam rule the host applies
 * to its own `DataSource`.
 *
 * There is exactly one demo instance per page. The seeded tracking counter and
 * the booked shipments live inside it, so a second instance would mint the same
 * reference twice and a booking made on the dispatch screen would be invisible
 * on the customer's order view.
 */

import { PINNED_NOW } from "./clock.ts";
import type { Shipment, ShippingCarrier } from "../host/contracts/index.ts";
import type { LabelStore } from "./label-store.ts";
import { createDemoCarrier, type DemoCarrier } from "./demo-carrier.ts";
import { publicSettings } from "./settings.ts";

let demo: DemoCarrier | null = null;

function demoCarrier(): DemoCarrier {
  demo ??= createDemoCarrier({
    clock: PINNED_NOW,
    cutoff: publicSettings().collection_cutoff,
  });
  return demo;
}

let injected: ShippingCarrier | null = null;

/**
 * Connected mode's entry point. The host calls this once, after it has checked
 * credentials, with a client bound to the manifest's allow-list.
 */
export function useConnectedCarrier(carrier: ShippingCarrier): void {
  injected = carrier;
}

export function carrier(): ShippingCarrier {
  if (!publicSettings().demo_transport && injected !== null) return injected;
  return demoCarrier();
}

/**
 * The bytes behind a label's `fileId`.
 *
 * Only the demo has them — see `label-store.ts`. In connected mode the host
 * stores the file and serves it by id, so the answer here is `undefined` and
 * the UI falls back to asking the host, which is the correct division: a client
 * bundle has no business holding a shipping label in memory.
 */
export function labels(): LabelStore | null {
  return publicSettings().demo_transport ? demoCarrier().labels : null;
}

/** True while the UI must carry "Demo carrier — no real shipment was booked". */
export function isDemo(): boolean {
  return publicSettings().demo_transport || injected === null;
}

/** Only the demo remembers a destination between `quote` and `book`. */
export function rememberDestination(
  reference: string,
  to: { name: string; lines: string[]; city: string; postcode: string; country: string },
): void {
  if (publicSettings().demo_transport) demoCarrier().rememberDestination(reference, to);
}

/**
 * Has this order gone out with a carrier?
 *
 * A question about the shop's own records, not about the carrier: a connected
 * build answers it from the `shipments` table this add-on brings, which is why
 * it makes no call and returns synchronously. Only the demo has to look inside
 * the transport, because the transport is where its records live.
 */
export function findShipment(reference: string): Shipment | undefined {
  return publicSettings().demo_transport ? demoCarrier().find(reference) : undefined;
}

/** Test seam: drop the memoized demo so a suite starts from a clean counter. */
export function resetRuntime(): void {
  demo = null;
  injected = null;
}
