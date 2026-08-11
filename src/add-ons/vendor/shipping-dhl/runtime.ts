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

import { PINNED_NOW, type Clock } from "./clock.ts";
import type { Shipment, ShippingCarrier } from "../host/contracts/index.ts";
import type { LabelStore } from "./label-store.ts";
import { createDemoCarrier, type DemoCarrier } from "./demo-carrier.ts";
import { publicSettings } from "./settings.ts";

let demo: DemoCarrier | null = null;

/**
 * WHEN THE SHOP THINKS IT IS, as the host last told us.
 *
 * `PINNED_NOW` is the fallback rather than the answer, and the difference is
 * the whole of the 2026-08-10 fix: this repo's own pin is a fact about this
 * repo, and every date the demo transport mints — collection windows, delivery
 * estimates, tracking scans — has to be relative to the SHOP's today or it
 * contradicts the screen it is rendered on.
 */
let hostClock: Clock = PINNED_NOW;

/**
 * Take the host's clock off the slot payload.
 *
 * Called by the fills, which are the only things in this bundle that ever meet
 * a host. Rebuilding on a change rather than on every call is deliberate: the
 * demo transport holds the tracking counter and the shipments booked this
 * session, so replacing it discards a booking, and it must therefore happen at
 * most once — when a host first says what day it is.
 */
export function setHostClock(clock: Clock): void {
  if (
    clock.iso === hostClock.iso &&
    clock.hour === hostClock.hour &&
    clock.minute === hostClock.minute
  ) {
    return;
  }
  hostClock = clock;
  demo = null;
}

/** The clock every screen in this add-on dates itself from. */
export function shopClock(): Clock {
  return hostClock;
}

function demoCarrier(): DemoCarrier {
  demo ??= createDemoCarrier({
    clock: hostClock,
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

/**
 * IS THE DEMO CARRIER THE ONE ACTUALLY ANSWERING? — ONE PREDICATE, READ BY
 * EVERYTHING THAT TALKS TO IT.
 *
 * ── THE OTHER HOST'S TOWN, AND HOW IT GOT ONTO THE PAGE ─────────────────────
 *
 * [Repaired 2026-08-11, wave 4b round 3.] There used to be two answers to this
 * question in this file. `carrier()` said "the demo, unless a real client was
 * injected" — so with the "Use the demo carrier" switch OFF and no self-host
 * client behind it, which is every demo build, the demo still served every
 * quote and booking. The three functions below said something narrower: "only
 * when the switch is ON". So with the switch off, `rememberRoute` threw the
 * route away and the demo carrier fell back to the address it had been
 * CONSTRUCTED with — and the maker studio's tracking scans read "Picked up from
 * the shop · Marlow" and "Sorted at the depot · Marlow depot", naming the FIRST
 * host's town on the second host's screen, for a parcel that left Saltburn for
 * Castleton and never went near either.
 *
 * The origin was in the payload the whole time. The bug was not a missing fact;
 * it was two spellings of one condition, one of which quietly discarded it.
 *
 * `labels()` and `findShipment()` had the identical split and the identical
 * consequence: with the switch off, the demo booked shipments whose labels this
 * module then said it did not have and whose records it said it could not find.
 *
 * So the condition is written once. `isDemo()` — which the UI already read to
 * decide whether to print "Demo carrier — no real shipment was booked" — IS the
 * condition, and now nothing can disagree with the label on the screen.
 */
function usingDemo(): boolean {
  return publicSettings().demo_transport || injected === null;
}

export function carrier(): ShippingCarrier {
  return usingDemo() ? demoCarrier() : injected!;
}

/**
 * The bytes behind a label's `fileId`.
 *
 * Only the demo has them — see `label-store.ts`. In connected mode the host
 * stores the file and serves it by id, so the answer here is `null` and the UI
 * falls back to asking the host, which is the correct division: a client bundle
 * has no business holding a shipping label in memory.
 */
export function labels(): LabelStore | null {
  return usingDemo() ? demoCarrier().labels : null;
}

/** True while the UI must carry "Demo carrier — no real shipment was booked". */
export function isDemo(): boolean {
  return usingDemo();
}

/**
 * Only the demo remembers a ROUTE between `quote` and `book`.
 *
 * BOTH ENDS, not just the destination. The transport used to keep one origin —
 * whichever address it happened to be constructed with — so its tracking scans
 * named that town however far away the shop actually was. The shop's own
 * collection address arrives with every booking now, and it arrives whenever
 * the demo is the one answering rather than only when a switch says so.
 */
export function rememberRoute(
  reference: string,
  from: { name: string; lines: string[]; city: string; postcode: string; country: string },
  to: { name: string; lines: string[]; city: string; postcode: string; country: string },
): void {
  if (usingDemo()) demoCarrier().rememberRoute(reference, from, to);
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
  return usingDemo() ? demoCarrier().find(reference) : undefined;
}

/** Test seam: drop the memoized demo so a suite starts from a clean counter. */
export function resetRuntime(): void {
  demo = null;
  injected = null;
  // The clock goes back to this repo's own pin, not to the last host's. A suite
  // that inherited the previous case's Thursday would pass for the wrong
  // reason, and a harness with no host has only the pin to fall back on.
  hostClock = PINNED_NOW;
}
