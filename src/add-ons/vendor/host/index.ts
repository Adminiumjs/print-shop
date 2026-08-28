/*
 * VENDORED from add-ons/packages/host/src/index.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The ONE shared contract; the three add-ons here import it by relative path.
 */
/**
 * `@adminium/add-on-host` — the host seam every add-on in this repo registers
 * against.
 *
 * ONE MIRROR. See `host.ts` for why it is a mirror at all and why there used to
 * be three of them.
 *
 * Everything exported here is either a type or a pure function over plain data.
 * There is no React, no `zod`, no `fetch`, no clock and no storage — an add-on
 * takes no runtime dependency the host does not already have (24 D7), and the
 * package an add-on imports is the last place that rule may be bent.
 */

export type {
  ActivityContext,
  ActivityEntry,
  SeededActivityEntry,
  AddOn,
  AddOnCategory,
  AddOnFill,
  AddOnRegistry,
  AddOnSetting,
  AddOnSettings,
  AddOnSettingValues,
  AnyAddOnFill,
  ConnectKind,
  DemoSwitch,
  Permission,
  ResolvedFill,
} from './host.ts';

/**
 * THE PAYLOADS, one per slot in the closed registry.
 *
 * They were not here, and their absence is what made the cross-app claim false:
 * each add-on wrote down "what the one host that existed happened to send", so
 * the seam became one shop's record layout under general-sounding names. See
 * `payloads.ts` for the whole account.
 */
export type {
  ArtworkJob,
  ArtworkResult,
  ArtworkSlotPayload,
  CartLinePayload,
  CatalogueSample,
  CheckoutPayload,
  Dimensions,
  DispatchPayload,
  HostProduct,
  LineOrder,
  Money,
  OrderLinePayload,
  OutboundOrder,
  Party,
  PayloadFor,
  PersonalizePayload,
  PostalAddress,
  ProductAdminPayload,
  RecordActionsPayload,
  RecordEditorPayload,
  RoutePayload,
  SettingsPanelPayload,
  ShopClock,
  SlotItem,
  SlotPayload,
  SlotPayloads,
} from './payloads.ts';

export {
  applyAddOnSettings,
  createRegistry,
  defaultSettingsFor,
  EMPTY_REGISTRY,
  isConnectable,
  resolveActivity,
} from './host.ts';

export type { SlotEmptyBehaviour, SlotId } from './slots.ts';
/*
 * `SLOT_EMPTY_BEHAVIOUR` is NOT here, and its absence is a decision — see
 * `slots.ts`. What a host draws where nothing fills a slot is a property of
 * that host's screen, so each host declares its own table and each host's
 * render suite checks it against its own pages. The type crosses the seam; the
 * values never did anything but let one shop's screen speak for another's.
 */
export { HOSTED_SLOTS, SLOT_FILL } from './slots.ts';

export type { DeliveryChoice } from './delivery.ts';
