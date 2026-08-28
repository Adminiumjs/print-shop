/**
 * WHAT EACH SLOT IS HANDED — one payload per id in the closed registry, and not
 * one of them named after this app.
 *
 * ── WHY THIS FILE EXISTS ────────────────────────────────────────────────────
 *
 * It did not, and its absence is what made 24 D21's claim false. The payloads
 * were declared by each ADD-ON, as "the fields I read", which sounds like a
 * consumer narrowing safely and was in practice each add-on writing down the
 * record layout of the one host it had been built against. The delivery add-on
 * declared `SampleJob` with `trimWidthMm` and `packagingKey` — the print
 * works' job with `Job` filed off the front. The personalizer read
 * `payload.config.note` and `payload.line.productKey` — Birch Row's basket
 * line, equally particular, in the other direction. Wired into a second host by
 * registration alone, `tsc` passed and three components threw.
 *
 * ── THE RULE ────────────────────────────────────────────────────────────────
 *
 * A slot id names a SURFACE. Its payload is the smallest shape EVERY host of
 * that surface can honestly produce, named for the surface. This app maps its
 * own records into these shapes at the mount site — see `records.ts` — and
 * THAT MAPPING IS THE HOST'S JOB. It is the seam that makes an add-on
 * portable; pushing it into the add-on is how one shop's vocabulary ends up
 * inside twenty add-ons.
 *
 * Where an add-on genuinely needs something only some hosts have, the field is
 * OPTIONAL and the add-on handles its absence in words on screen.
 *
 * ── AND THE TYPE SYSTEM CHECKS IT NOW ───────────────────────────────────────
 *
 * `SlotPayloads` maps every id to its payload, `AddOnFill<S>` in `host.ts` is
 * parameterised by slot id, and `<AddOnSlot>` is generic over the id it mounts.
 * A screen that passes the wrong shape is a compile error in THIS repo; an
 * add-on that reads a field no host promises is a compile error in ITS repo.
 *
 * THIS FILE IS MIRRORED, and this app is the authority. `add-ons/packages/host`
 * carries the same declarations for the add-ons to compile against, and that
 * repo's `host-mirror.test.ts` reads THIS file and fails when a member here is
 * missing there.
 */

import type { DeliveryChoice } from '../state/store.ts';
import type { AddOnSettingValues } from './host.ts';
import type { SlotId } from './slots.ts';

/**
 * Every fill is handed the shop's saved values FOR ITS OWN ADD-ON under
 * `settings`, injected by the host's `<AddOnSlot>`. A screen therefore never
 * looks a settings document up by add-on key to pass it along — which is how
 * `settings['design-studio']` used to appear in a customer-facing screen.
 */
export interface SlotPayload {
  settings?: AddOnSettingValues;
}

// ── the neutral vocabulary ──────────────────────────────────────────────────

/** How big one thing is. Millimetres, because a shop's own units vary and mm do not. */
export interface Dimensions {
  widthMm: number;
  heightMm: number;
  depthMm?: number;
}

/**
 * An amount in the smallest unit of `currency` — cents, pence, yen.
 *
 * Integer minor units rather than a float, for the reason every till learns
 * once: `0.1 + 0.2` is not `0.3`, and a delivery estimate that disagrees with
 * the basket by a cent is a support ticket.
 */
export interface Money {
  /** In the smallest unit of `currency`. */
  amount: number;
  /** ISO 4217, e.g. `USD`. */
  currency: string;
}

/**
 * Somewhere a parcel can go, or be collected from.
 *
 * `country` IS A CODE, not a country's name in the reader's language: it is the
 * one field in here a machine reads — a carrier checks the postcode against it
 * — so `GB` rather than "United Kingdom", and the host converts on the way out.
 * Everything else is display text the host already holds.
 */
export interface PostalAddress {
  name: string;
  lines: readonly string[];
  city: string;
  postcode: string;
  /** ISO 3166-1 alpha-2. */
  country: string;
}

/**
 * WHEN THIS SHOP THINKS IT IS.
 *
 * Every engine here is pure — no `Date.now()`, no bare `new Date()` (24 D11) —
 * so this app pins a clock, and so does every other host. THEY ARE NOT THE SAME
 * INSTANT and they are not meant to be: the print works is pinned to Wednesday
 * 5 August at 10:20 and Birch Row to Thursday the 6th at 16:40.
 *
 * The delivery add-on used to carry its own `PINNED_NOW` commented "the same
 * instant the host app is pinned to". True of the host it was written against,
 * false in the second one, and the result was the quietest possible kind of
 * wrong: a dispatch panel saying "Book before 15:00 and the driver comes this
 * afternoon. It is 10:20 now" beside a dock reading 16:40, a collection window
 * dated the day before, and a "picked up from the shop" scan stamped before the
 * order was opened. Nothing threw and no build went red.
 *
 * A CLOCK IS A HOST FACT, like an address. So it crosses the seam wherever it
 * changes the answer, and it is REQUIRED for the same reason `origin` is: a
 * shop that does not know what day it is has no honest state to be in.
 */
export interface ShopClock {
  /** ISO date, `YYYY-MM-DD`, in the shop's own reckoning. */
  iso: string;
  /** 0-23, local to the shop. */
  hour: number;
  minute: number;
}

/**
 * A person or firm at one end of a transaction.
 *
 * TWO SPELLINGS, ON PURPOSE. `name` is display text and always present, because
 * every host has something to put on a label. `key` is the shop's own stable
 * identifier and is optional, because a host that resolves its keys to names
 * before it hands a record over has none left to give. An add-on that matches
 * on one should try the other — a key survives a shop renaming a customer and a
 * name does not, and a host that passes only the name is not doing anything
 * wrong.
 */
export interface Party {
  name: string;
  key?: string;
}

/**
 * ONE THING BEING SOLD, MADE OR SENT — a basket line, an order line, a job on a
 * board. All three are the same shape from a slot's point of view.
 *
 * `label` ARRIVES TRANSLATED. The host owns its own catalogue's words and has a
 * `t` to hand; an add-on that received `walnut-coasters` could only either
 * print the key at a customer or invent English for it.
 *
 * The three optional facts are the ones a host may not have. A shop that makes
 * physical things knows what one weighs and how big it is; a shop that sells
 * appointments knows neither, and is not a broken host for it.
 */
export interface SlotItem {
  /** Unique within the order or basket it belongs to. */
  id: string;
  /** The host's own stable key for the THING — its catalogue key, not this line's. */
  key: string;
  /** The thing's name, already in the reader's language. */
  label: string;
  quantity: number;
  /** The customer's own words about this line, when the host keeps any. */
  note?: string;
  /** What ONE of them weighs. The host's own fact; the parcel is the add-on's. */
  unitWeightGrams?: number;
  /** How big ONE of them is, as it leaves the shop. */
  unitSize?: Dimensions;
  /** What ONE of them costs. */
  unitPrice?: Money;
}

/**
 * One representative record per family of what the shop sells, for a settings
 * form.
 *
 * It exists so an add-on that has something to say about the shop's catalogue
 * can say it without the host guessing what that is: the carrier turns these
 * into default parcel weights with its own engine, and an add-on with no
 * opinion about them ignores the field. THE HOST DOES NOT COMPUTE A PARCEL —
 * it says what one of a thing weighs, which it knows, and the add-on says what
 * a box of them weighs, which it knows.
 */
export interface CatalogueSample {
  key: string;
  /** The family's name, already translated by the host. */
  label: string;
  /** A representative order quantity — what somebody actually buys. */
  quantity: number;
  unitWeightGrams?: number;
  unitSize?: Dimensions;
  unitPrice?: Money;
}

/** One thing in the catalogue, as a product-page or setup surface reads it. */
export interface HostProduct {
  key: string;
  /** Already in the reader's language. */
  label: string;
  /**
   * How many characters the HOST's own free-text field accepts, when it caps
   * them. An add-on that replaces that field should not let a shopper type more
   * than the shop can store, because the words go back into the host's field.
   */
  noteLimit?: number;
  unitSize?: Dimensions;
}

/** The order a line belongs to, as much of it as a line-level surface needs. */
export interface LineOrder {
  ref: string;
  recipient?: Party;
  /** ISO date. */
  placedOn?: string;
}

/**
 * SOMETHING THAT HAS TO LEAVE THE BUILDING.
 *
 * The neutral reading of a works job, a studio order, a wholesale consignment.
 * `ref` is the reference BOTH sides already use — whatever a shop prints on its
 * own paperwork — so a booking made through an add-on can be found again from
 * the shop's own screen.
 *
 * `origin` AND `destination` ARE THE HOST'S TO SUPPLY, and the add-on that used
 * to hold them learned why: it shipped an address book keyed by one shop's
 * customer keys, so in any other shop every order resolved to nothing. A shop
 * knows where it posts from and where its customer lives.
 *
 * They differ in whether they are required, and the difference is what each
 * party can honestly claim. `origin` is REQUIRED: a shop's own address is on
 * its own paperwork and every host has one, so an optional field would only
 * have let a host mount the surface having thought about it not at all.
 * `destination` is OPTIONAL because a shop genuinely may not know yet — the
 * customer has not said, or the record predates the field — and an add-on that
 * needs one says so on screen and takes it in a form rather than guessing.
 */
export interface OutboundOrder {
  ref: string;
  recipient: Party;
  items: readonly SlotItem[];
  /** Where the shop sends from. Every shop has one. */
  origin: PostalAddress;
  /** Where this one is going, when the shop knows. */
  destination?: PostalAddress;
  /** ISO date the shop promised. */
  promisedFor?: string;
  /** What the whole thing is worth, for a customs line or an insured value. */
  value?: Money;
}

// ── the eleven payloads ─────────────────────────────────────────────────────

/**
 * `artwork.sources` — the ways a customer can supply a design.
 *
 * `ArtworkJob` and `ArtworkResult` restate `artwork-source@1` structurally
 * rather than importing `./contracts/`, so the seam a host mirrors stays free
 * of the contract registry: a host mounts this surface without implementing,
 * or even knowing about, the contract its add-ons happen to provide.
 */
export interface ArtworkJob {
  productKey: string;
  /** Already translated. */
  productLabel: string;
  trimWidthMm: number;
  trimHeightMm: number;
  bleedMm: number;
  sides: 1 | 2;
  quantity: number;
}

/** What an artwork add-on resolves its flow to, and hands back. */
export interface ArtworkResult {
  fileId: string;
  /** The add-on key that produced it. */
  source: string;
  widthMm: number;
  heightMm: number;
  bleedMm: number;
  dpi: number;
  pages: number;
  previewFileId?: string;
}

export interface ArtworkSlotPayload extends SlotPayload {
  /**
   * What is being made, RESOLVED BY THE HOST. It used to be the host's own
   * configuration record — a product key and a size PRESET KEY — which meant
   * both artwork add-ons carried a copy of one shop's size table and would have
   * silently fallen back to A4 in any other. Millimetres are millimetres
   * everywhere.
   */
  job: ArtworkJob;
  /**
   * How the finished design gets back onto the order. Optional: a host may
   * mount this surface with nowhere to put the result yet, and the fill then
   * reports what it made in place rather than pretending it landed.
   */
  onArtwork?: (result: ArtworkResult) => void;
}

/** `checkout.delivery.methods` — what it costs to send what is in the basket. */
export interface CheckoutPayload extends SlotPayload {
  /** Everything at the till, which travels as one parcel. */
  items: readonly SlotItem[];
  /** Where the shop sends from — required here for the same reason as on an order. */
  origin: PostalAddress;
  /**
   * Where it is going, when the shop has asked yet. At a till it usually has
   * not, which is the case this optionality is for: an add-on quotes the shop's
   * own country and says so, rather than pretending to know the route.
   */
  destination?: PostalAddress;
  /** What the goods come to, before delivery. */
  total?: Money;
  /**
   * When the shop thinks it is. A delivery estimate is date arithmetic and
   * every answer it gives is relative to today.
   */
  now: ShopClock;
  /**
   * What the host currently holds, or null. It is the same object this fill
   * handed over, so `addOn` is what tells a second delivery company's rows not
   * to light up because the first one's did — the host does not scope it,
   * because the host does not know which add-on drew which row.
   */
  /**
   * THE FIRST DAY THIS WORKS CAN ACTUALLY HAND THE PARCEL OVER — ISO date.
   *
   * [Added 2026-08-11, wave 4b round 2, after the maker studio hit it.] A
   * delivery estimate is `collection day + transit`, and `now` gives only the
   * first half of the first term. The second half is whether there is anything
   * to collect — and a print works prints to order: the basket beside this slot
   * already reads "ready by …", computed from the same `promiseFor` this passes.
   * Without the field a carrier quoted transit from TODAY and one panel could
   * offer a delivery date before the day the works said it would be ready.
   *
   * OPTIONAL, because a shop selling off a shelf has nothing to say here: its
   * ready day IS today, and passing `now.iso` and passing nothing mean the same
   * thing. It is a FLOOR, not an instruction — the add-on still applies its own
   * cut-off and its own weekend on top, so the collection day is the later of
   * what the carrier can do and what the works can do.
   */
  readyOn?: string;
  chosen?: DeliveryChoice | null;
  onChoose?: (choice: DeliveryChoice) => void;
}

/** `order.dispatch.panel` and `order.dispatch.actions` — the same subject, two readers. */
export interface DispatchPayload extends SlotPayload {
  order: OutboundOrder;
  /**
   * When the shop thinks it is. Required, and the field this surface cannot be
   * honest without: "has today's van gone?" and "which day does the driver
   * come?" are questions about THIS shop's clock, and an add-on answering them
   * off its own is telling a works about somebody else's Tuesday.
   */
  now: ShopClock;
}

/** `settings.add-on.panel` — one add-on's own form inside the manage drawer. */
export interface SettingsPanelPayload extends SlotPayload {
  /** Save a partial change to this add-on's own values. */
  patch: (values: Record<string, unknown>) => void;
  /**
   * REQUIRED, and it is worth saying why an optional field would have been the
   * easier and worse choice. Every host has a catalogue — it is what a shop is
   * — so "I have nothing to sample" is not an honest state, and making the
   * field optional would let a host mount the surface having thought about it
   * not at all. That is exactly what happened: the second host passed `{ patch }`
   * alone, tsc was happy, and the carrier's settings form threw on `.map`.
   */
  samples: readonly CatalogueSample[];
}

/** `nav.add-on.routes` — a whole page in the host's shell, for an add-on that needs one. */
export type RoutePayload = SlotPayload;

/**
 * `product.options.personalize` — the surface a shopper says what they want on.
 *
 * `note` and `setNote` ARE THE WHOLE INTEGRATION, and they are the host's own
 * free-text field rather than anything the add-on invents. A shop with nothing
 * connected has a note field; an add-on replaces the block and writes the words
 * back through the same setter, so the basket line reads the same either way
 * and a disconnect leaves the customer's request in plain language rather than
 * locked inside a picture nobody can open (24 D16).
 */
export interface PersonalizePayload extends SlotPayload {
  product: HostProduct;
  /** The shopper's own words, as the host stores them. Empty is ordinary. */
  note: string;
  setNote: (note: string) => void;
  /**
   * "NOT YET, AND HERE IS WHY" — the one thing this surface could not say.
   *
   * A host with nothing connected gates its own button on its own rules: a
   * character limit, a required field. An add-on that REPLACES the block brings
   * rules the host cannot know — a name that will not fit the area at any size
   * the studio cuts, a character it has no letter for — and until this existed
   * it had no way to say so. The consequence was not cosmetic: the personalizer
   * wrote an EMPTY note whenever a zone failed, so a shopper could add a piece
   * whose wording could not be made and lose the words they had typed on the
   * way. Silently discarding what somebody typed is the worst of the three
   * possible behaviours, and the reason it was chosen is that the other two
   * needed this field.
   *
   * The host disables its own "add to basket" and shows `reason` beside it.
   * `undefined` clears the gate. The string is ALREADY TRANSLATED by the
   * add-on, because it is the add-on's rule and only the add-on can phrase it.
   *
   * OPTIONAL, and the absence is handled in words rather than by throwing: a
   * host whose personalize surface has no gate to close — a saved-design editor,
   * a quote form — simply does not pass it, and the add-on keeps saying the
   * same thing on its own surface, where the failing area already carries its
   * reason and its remedy buttons. What is lost there is the gate, not the
   * explanation.
   *
   * A FILL THAT SETS THIS MUST CLEAR IT WHEN IT UNMOUNTS. Switching the add-on
   * off is a normal act (24 D6), and a gate left closed by a fill that no
   * longer exists is a shop that cannot sell anything.
   */
  setBlocked?: (reason: string | undefined) => void;

  /**
   * WHAT THE HOST ALREADY SAYS AROUND ITS OWN FIELD, already translated.
   *
   * ── SWITCHING AN ADD-ON ON MUST NOT TAKE WORDS OFF THE PAGE ──────────────
   *
   * `product.options.personalize` is a `single` slot: while a fill is mounted
   * the host's own block is GONE. That block is not a placeholder — D19 is the
   * rule that it is a finished thing — and on this host it is three parts: the
   * note field with its counter, the maker's own instructions for what to type,
   * and the promise that a picture comes back before anything is made.
   *
   * An add-on that draws a live preview has honestly IMPROVED on the last two:
   * the shopper sees the piece instead of being told what will happen to it.
   * An add-on that falls back to a plain note field — for a piece the shop has
   * not set up yet — has improved on nothing, and dropping the instructions and
   * the promise there is a downgrade dressed as an upgrade. It is also not
   * something the add-on could fix on its own: those sentences are the SHOP's,
   * in the shop's voice, and no add-on can write them.
   *
   * So the host hands them over. Already in the reader's language, because they
   * are the host's own copy and it has already resolved them; a list rather
   * than named fields, because what a shop chooses to say beside its own field
   * is the shop's business and the add-on only has to not lose it.
   *
   * OPTIONAL. A host whose personalize surface says nothing but "type here"
   * passes nothing, and the add-on renders nothing extra.
   */
  hostSays?: readonly string[];
}

/** `cart.line.preview` — beside one line in the basket. */
export interface CartLinePayload extends SlotPayload {
  line: SlotItem;
}

/** `product.admin.panel` — the shop's own setup for one thing it sells. */
export interface ProductAdminPayload extends SlotPayload {
  product: HostProduct;
}

/** `order.line.actions` — what staff can do with one line of a live order. */
export interface OrderLinePayload extends SlotPayload {
  order: LineOrder;
  line: SlotItem;
}

/**
 * `record.editor.panel` — the one slot whose host is Adminium's generated
 * dashboard rather than an example app (24 §5.10, D20).
 *
 * Declared here with the rest because the registry is closed and an add-on may
 * name it in a manifest today; nothing mounts it until the add-on runtime
 * lands, which is Phase B.
 */
export interface RecordEditorPayload extends SlotPayload {
  /** The table the record belongs to, as `addOn.attaches[].table` names it. */
  table: string;
  record: Readonly<Record<string, unknown>>;
  patchRecord: (patch: Record<string, unknown>) => void;
}

/**
 * `record.actions` — one opening, on the screen where somebody is already
 * looking at ONE record, to do a thing to it (bought 2026-08-28, 31 O1).
 *
 * Declared here with the rest because the registry is closed and an add-on may
 * name it in a manifest today. THIS APP DOES NOT MOUNT IT — see `slots.ts` —
 * and neither does the other example shop; its first consumer is the paperwork
 * add-on, which is wave 5. Nothing here is waiting on it.
 *
 * `entity` and not `table`: every host of this surface is a shop whose records
 * live in a store, and only the generated dashboard has tables. `patchRecord`
 * is OPTIONAL because rendering a document writes nothing back, and forcing a
 * read-only host to pass a handle would be forcing it to pass a lie. The long
 * version of both, and the seven exhibits the slot was bought against, are in
 * the monorepo's own `packages/host/src/payloads.ts`.
 */
export interface RecordActionsPayload extends SlotPayload {
  /** The host's own word for what kind of record this is, lower-case. */
  entity: string;
  /** The record's identity WITHIN its entity, as the host knows it. */
  recordId: string;
  record: Readonly<Record<string, unknown>>;
  /** When the host thinks it is — a document dated off any other clock lies. */
  now: ShopClock;
  /** Write back, or nothing where the host allows no write. */
  patchRecord?: (patch: Record<string, unknown>) => void;
}

/**
 * THE MAP. Every id in the closed registry, and its payload.
 *
 * Keyed by the slot id union rather than by a hand-written list, so an id added
 * to `HOSTED_SLOTS` with no payload here is a compile error in this file rather
 * than an `unknown` somewhere downstream.
 */
export interface SlotPayloads {
  'artwork.sources': ArtworkSlotPayload;
  'checkout.delivery.methods': CheckoutPayload;
  'order.dispatch.panel': DispatchPayload;
  'order.dispatch.actions': DispatchPayload;
  'settings.add-on.panel': SettingsPanelPayload;
  'nav.add-on.routes': RoutePayload;
  'product.options.personalize': PersonalizePayload;
  'cart.line.preview': CartLinePayload;
  'product.admin.panel': ProductAdminPayload;
  'order.line.actions': OrderLinePayload;
  'record.editor.panel': RecordEditorPayload;
  'record.actions': RecordActionsPayload;
}

/**
 * The map covers the registry exactly — no id without a payload, no payload for
 * an id that does not exist.
 *
 * A compile-time assertion rather than a test, because the failure it catches
 * is a missing TYPE and a suite cannot see one. Adding an id to `HOSTED_SLOTS`
 * and forgetting this file turns the line below red in this file, which is
 * where the fix belongs.
 */
/**
 * The map covers the registry exactly — no id without a payload, no payload
 * for an id that does not exist.
 *
 * A compile-time assertion rather than a test, because the failure it catches
 * is a MISSING TYPE and no suite can see one.
 */
type Assert<T extends true> = T;
export type EveryIdHasAPayload = Assert<SlotId extends keyof SlotPayloads ? true : false>;
export type EveryPayloadHasAnId = Assert<keyof SlotPayloads extends SlotId ? true : false>;

/** What a slot fill is handed, by id. */
export type PayloadFor<S extends SlotId> = SlotPayloads[S];
