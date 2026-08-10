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
  ActivityEntry,
  AddOn,
  AddOnCategory,
  AddOnFill,
  AddOnRegistry,
  AddOnSetting,
  AddOnSettings,
  AddOnSettingValues,
  ConnectKind,
  DemoSwitch,
  Permission,
  ResolvedFill,
  SampleJob,
  SettingsPanelPayload,
  SlotPayload,
} from './host.ts';

export {
  applyAddOnSettings,
  createRegistry,
  defaultSettingsFor,
  EMPTY_REGISTRY,
  isConnectable,
} from './host.ts';

export type { SlotId } from './slots.ts';
export { HOSTED_SLOTS, SLOT_EMPTY_BEHAVIOUR, SLOT_FILL } from './slots.ts';

export type { DeliveryChoice } from './delivery.ts';
