/*
 * VENDORED from add-ons/packages/host/src/contracts/index.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The ONE shared contract; the three add-ons here import it by relative path.
 */
/**
 * The contract mirror, in one entry point.
 *
 * `@adminium/add-on-host/contracts` — the implementation contracts an add-on
 * declares in `manifest.json` under `addOn.provides[]`. Separate from the
 * package's main entry on purpose: the main entry is the HOST's seam (what
 * `register()` returns), this is the CONTRACT registry (what an engine
 * implements), and an add-on that provides neither `artwork-source` nor
 * `shipping-carrier` should not have to load either.
 *
 * It also keeps the shipped bytes honest. `CarrierError` is the one runtime
 * value in here, so the delivery add-on's bundle pulls this file in and the
 * artwork add-ons' bundles do not — and neither ever pulls in the host seam,
 * which they import as types alone.
 */

export type { FileRef } from './common.ts';
export type {
  ArtworkRef,
  ArtworkSource,
  AvailabilityVerdict,
  JobSpec,
} from './artwork-source.ts';
export type {
  Personalization,
  PreviewRef,
  ProductPersonalizer,
  ProductRef,
  Template,
  Verdict,
  Zone,
  ZoneFinish,
  ZoneKind,
} from './product-personalizer.ts';
export { CarrierError } from './shipping-carrier.ts';
export type {
  Address,
  OrderRef,
  Parcel,
  Rate,
  Shipment,
  ShippingCarrier,
  TrackEvent,
} from './shipping-carrier.ts';
