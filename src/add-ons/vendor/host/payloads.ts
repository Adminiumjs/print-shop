/*
 * VENDORED from add-ons/packages/host/src/payloads.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The ONE shared contract; the three add-ons here import it by relative path.
 */
/**
 * WHAT EACH SLOT IS HANDED — one payload per id in the closed registry, and not
 * one of them named after a shop.
 *
 * ── WHY THIS FILE EXISTS ────────────────────────────────────────────────────
 *
 * It did not, and its absence was the single defect that made 24 D21's central
 * claim false. The rule this repo worked to said a payload an add-on only READS
 * may be narrowed and therefore belongs with the add-on; the shared mirror
 * carried only what an add-on hands BACK. That reasoning is sound about
 * ownership and silent about SHAPE, and the shape is what a second host
 * changes. So each add-on wrote down "what arrived", meaning what the ONE host
 * that existed happened to send, and the seam quietly became that host's record
 * layout under a general-sounding name:
 *
 *   `SampleJob` declared `trimWidthMm`, `packagingKey`, `productKey` and
 *   `materialKey` — a print works' job with `Job` filed off the front.
 *   `DispatchPayload` was `{ job }`; the second host passes `{ order }`.
 *   The personalizer read `payload.config.note` and `payload.line.productKey` —
 *   a maker studio's basket line, equally particular, in the other direction.
 *
 * Wired into the second host with registration alone, the delivery add-on
 * compiled and then threw three times in three different components, because
 * `AddOnFill<never>` erased the payload type and nothing anywhere compared the
 * two sides. NEITHER add-on was portable, and both repos said in their headers
 * that they were.
 *
 * ── THE RULE, RESTATED ──────────────────────────────────────────────────────
 *
 * A slot id names a SURFACE. Its payload must therefore be the smallest shape
 * EVERY host of that surface can honestly produce, named for the surface rather
 * than for any one shop's records. A print works has jobs and a maker studio
 * has order lines; the payload is neither, and both hosts map their own records
 * into it at the mount site. THAT MAPPING IS THE HOST'S JOB — it is the seam
 * that makes the add-on portable, and pushing it into the add-on is how one
 * shop's vocabulary gets into twenty add-ons.
 *
 * Where an add-on genuinely needs something only some hosts have, the field is
 * OPTIONAL and the add-on handles its absence IN WORDS on screen. A weight is
 * the worked example: a shop that makes physical things knows what one of them
 * weighs, a shop that sells hours does not, and the carrier says "the shop has
 * not told us what this weighs" and lets the works type it rather than
 * inventing a number or throwing.
 *
 * ── THE ONE PAYLOAD THAT IS SHAPED BY ITS DOMAIN, SAID OUT LOUD ─────────────
 *
 * `ArtworkJob` carries `trimWidthMm`, `bleedMm` and `sides`, and a reader
 * auditing this file for neutrality should stop at those and want an answer.
 * They are not the old defect returning. `SampleJob` was a print works' JOB
 * RECORD under a general name — `packagingKey` and `materialKey` are that
 * shop's own vocabulary and no other shop has them. Bleed and sides are facts
 * about REPRODUCING A DESIGN, which is what the `artwork.sources` surface is
 * for and what `artwork-source@1` restates: any host that mounts it is a host
 * that reproduces artwork, and it has a trim area and knows whether it prints
 * one face or two. A host that reproduces nothing does not mount the surface —
 * Birch Row does not — rather than mounting it and passing zeroes.
 *
 * The test is "would a SECOND host of THIS SURFACE have these?", not "does
 * every host in the world have these?". By that test `packagingKey` failed and
 * `bleedMm` passes.
 *
 * ── AND THE ARGUMENT AGAINST `bleedMm`, ANSWERED ────────────────────────────
 *
 * [Re-examined 2026-08-11, wave 4b round 3.] A reviewer put the sharpest
 * version of it: bleed is a fact about work that is TRIMMED AFTER PRINTING, not
 * about reproducing a design in general, so a host that reproduces artwork onto
 * a fixed-size object — a mug, a slate, a phone case — has no honest value and
 * the field fails the paragraph above's own test.
 *
 * The premise is right and the conclusion does not follow, because of what the
 * field MEANS. `bleedMm` is not "does this shop trim?" — it is HOW FAR PAST THE
 * FINISHED EDGE THE ARTWORK MUST REACH, and it sits beside `trimWidthMm` and
 * `trimHeightMm`, which give that finished edge. Every host of this surface has
 * one: it is telling an add-on what area to fill. A host that prints onto a
 * fixed-size object knows the artwork must reach the edge and no further, and
 * says `bleedMm: 0`.
 *
 * ZERO IS AN ANSWER HERE, WHICH IS EXACTLY WHAT IT WAS NOT FOR `packagingKey`.
 * That field asked which of a print works' box types a job goes in; there is no
 * value of it meaning "this shop does not think in boxes", so a second host
 * could only invent one or pass a lie. And it is not the `weightGrams` case
 * either: there the absent value is UNKNOWN, so it is optional and the carrier
 * says on screen that the shop has not told it. Nothing is unknown here.
 *
 * The distinction the paragraph above is drawing when it says "rather than
 * mounting it and passing zeroes" is that one: a zero standing in for a fact
 * the host has no concept of is a lie, and a zero that IS the fact is not.
 *
 * The corollary is binding on every add-on and is guarded rather than asserted
 * here: `bleedMm === 0` is a real INSTRUCTION — reproduce the design at exactly
 * its finished size — and must never be read as "missing" or quietly replaced
 * with a default. Canva Import's `import.test.ts` drives a zero-bleed job end
 * to end and holds that line. The same add-on already meets the zero from the
 * other direction — the seeded bakery card comes back at `bleedMm: 0` because
 * the customer made it at trim size — which is why its checks were the ones
 * ready to be asked.
 *
 * ── AND `sides: 1 | 2` IS A CLOSED UNION, WHICH IS THE HARDER CASE ──────────
 *
 * [Re-examined 2026-08-10, wave 4b.] A closed union fitting exactly one host's
 * model is the shape this file is most likely to be wrong about, and a reader
 * asking "what does a folded card, a three-panel leaflet or a wrap put here?"
 * is asking the right question. The answer is that all three have a truthful
 * value, and it falls out of what `ArtworkJob` already says one job IS.
 *
 * A job here is ONE AREA being reproduced, described by ONE trim rectangle and
 * ONE bleed. `sides` is not a count of panels, pages or print positions — it is
 * how many FACES OF THAT AREA carry artwork, and a physical area has a front
 * and a back. A three-panel leaflet is one sheet printed on two sides and
 * folded twice; the folds are a finishing operation no artwork add-on sees, and
 * the panels share the sheet's single trim. A folded card is the same: two
 * sides. A mug or a bottle wrap is one continuous face: one side.
 *
 * The union is therefore not narrower than the surface — it is exactly as wide.
 * `sides: 3` would be INCOHERENT with the rest of this shape rather than merely
 * unsupported: a garment printed front, back and sleeve has three areas with
 * three different trims, so it cannot be one job with any value of `sides`, and
 * a host with independent print areas mounts the surface once per area. A
 * multi-page document reports itself through `ArtworkResult.pages`, which is
 * where a page count already lives and is deliberately not a `1 | 2`.
 *
 * So it stays closed, and the reason is written down where the next reader will
 * ask. What would genuinely reopen it is a host that reproduces something with
 * more than two faces sharing ONE trim — and if that host appears, `sides`
 * widens to `number` and the two artwork add-ons say what they can draw, which
 * is the same move the weight made.
 *
 * ── AND THE TYPE SYSTEM NOW CHECKS IT ───────────────────────────────────────
 *
 * `SLOT_PAYLOADS` below maps every id to its payload, `AddOnFill<S>` in
 * `host.ts` is parameterised by slot id, and each host's `<AddOnSlot>` is
 * generic over the id it mounts. A host that passes the wrong shape and an
 * add-on that reads a field the shape does not carry are both compile errors in
 * the repo that made the mistake. Three runtime crashes became three red
 * builds, which is the only kind of guarantee worth writing in a header.
 */

import type { DeliveryChoice } from './delivery.ts';
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
 * WHEN THE SHOP THINKS IT IS.
 *
 * ── WHY THE HOST HAS TO SAY, AND AN ADD-ON MAY NOT ASSUME ───────────────────
 *
 * Every engine in this system is pure: no `Date.now()`, no bare `new Date()`
 * (24 D11), because a demo whose dates move is a demo nobody can screenshot or
 * assert. So each app pins a clock — and each app pins its OWN. The print works
 * is pinned to Wednesday 5 August at 10:20 and Birch Row to Thursday the 6th at
 * 16:40, and neither is wrong.
 *
 * The delivery add-on used to hold `PINNED_NOW` as a constant with a comment
 * saying it was "the same instant the host app is pinned to". That was true of
 * the one host it was written against and became false the moment it was
 * mounted in the second, where it produced exactly the class of screen this
 * repo exists to prevent: a dispatch panel reading "Book before 15:00 and the
 * driver comes this afternoon. It is 10:20 now" beside a dock reading 16:40,
 * a collection window dated the day BEFORE the shop's today, and a "picked up
 * from the shop" scan timestamped before the order was looked at. Nothing threw
 * and nothing was red. It was simply, quietly, the wrong day.
 *
 * A CLOCK IS A HOST FACT, like an address and unlike a parcel. So it crosses
 * the seam on the surfaces where it changes the answer, and it is REQUIRED for
 * the same reason `origin` is: "I do not know what day it is" is not an honest
 * state for a shop, and an optional field would only have let a host mount a
 * dispatch surface having thought about it not at all.
 */
export interface ShopClock {
  /** ISO date, `YYYY-MM-DD`, in the shop's own reckoning. */
  iso: string;
  /** 0–23, local to the shop. */
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
  /**
   * How many faces of THIS area carry artwork. Closed at two because an area
   * has a front and a back — see this file's header for why a folded card, a
   * leaflet and a wrap all have a truthful value here, and why a third face
   * would be a second job rather than a third side.
   */
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
   * When the shop thinks it is. A delivery estimate is a date arithmetic
   * problem and every one of its answers is relative to today.
   */
  now: ShopClock;
  /**
   * THE FIRST DAY THE SHOP CAN ACTUALLY HAND THE PARCEL OVER — ISO date.
   *
   * ── THE DATE THAT CONTRADICTED THE ONE BESIDE IT ────────────────────────
   *
   * A delivery estimate is `collection day + transit`, and `now` only gives the
   * first half of the first term. The second half is whether there is anything
   * to collect. Birch Row makes things to order — a name cut into a board takes
   * four studio days — and its own checkout says so directly above this slot:
   * "posted by Mon 10 Aug". With no field for it the carrier quoted transit
   * from TODAY, so the same panel read "posted by Mon 10 Aug" and "arrives Fri
   * 7 Aug", three days before the studio can post it. A shop that has to MAKE
   * the thing cannot ship it this afternoon, and nothing in the payload let it
   * say so.
   *
   * OPTIONAL, because plenty of hosts have nothing to say here and are not
   * broken for it: a shop selling off a shelf posts from stock, its ready day
   * IS today, and passing `now.iso` and passing nothing must mean the same
   * thing. An add-on treats the absence as "ready now" and quotes from the
   * ordinary collection day.
   *
   * IT IS A FLOOR, NOT AN INSTRUCTION. The add-on still applies its own rules
   * on top — a cut-off it missed, a weekend, a carrier that does not collect on
   * a Sunday — so the collection day is the LATER of what the carrier can do
   * and what the shop can do. A host passing a date in the past is therefore
   * harmless rather than a special case.
   */
  readyOn?: string;
  /**
   * What the host currently holds, or null. It is the same object this fill
   * handed over, so `addOn` is what tells a second delivery company's rows not
   * to light up because the first one's did — the host does not scope it,
   * because the host does not know which add-on drew which row.
   */
  chosen?: DeliveryChoice | null;
  onChoose?: (choice: DeliveryChoice) => void;
}

/** `order.dispatch.panel` and `order.dispatch.actions` — the same subject, two readers. */
export interface DispatchPayload extends SlotPayload {
  order: OutboundOrder;
  /**
   * When the shop thinks it is. Required, and it is the field this surface
   * cannot be honest without: "has today's van gone?" and "which day does the
   * driver come?" are questions about the SHOP's clock, and an add-on that
   * answers them off its own is telling a works about somebody else's Tuesday.
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
 * ── WHY IT IS NOT `record.editor.panel` WITH A DIFFERENT NAME ───────────────
 *
 * They are a panel and an action, in different buildings. `record.editor.panel`
 * mounts inside the generated dashboard's record EDITOR — a form, on Adminium's
 * own surface, where an add-on adds a section. This is a button on a shop's own
 * screen: an invoice row in a help desk, a folio in a hotel, a certificate a
 * student is looking at. No example app has a record editor to put a panel in,
 * and the dashboard has no invoice row. A single id serving both would have to
 * carry a `table` that eleven of the twelve exhibit screens do not have.
 *
 * ── `entity` AND NOT `table` ────────────────────────────────────────────────
 *
 * `table` is right in `RecordEditorPayload` for the reason its own comment
 * gives: that slot's host is Adminium, where a table is a literal thing with a
 * name in a manifest. Every host of THIS surface is an app whose records live
 * in a store, and calling a help desk's invoice a "table" would be this file's
 * founding mistake in the other direction — the dashboard's vocabulary pushed
 * onto shops that do not use it, exactly as `packagingKey` once pushed a print
 * works' onto everyone.
 *
 * So: `entity`, a plain lower-case name for what kind of record this is
 * (`invoice`, `folio`, `certificate`), and the dashboard — when it mounts this
 * — passes its table name into it. THAT MAPPING IS THE HOST'S JOB, as always.
 *
 * ── `patchRecord` IS OPTIONAL, AND THAT IS THE INTERESTING FIELD ────────────
 *
 * `SettingsPanelPayload.samples` is required and its comment explains at length
 * why an optional field would have been the easier and worse choice. This one
 * goes the other way, and the difference is worth stating so the two do not
 * read as inconsistent.
 *
 * `samples` is optional-or-not on a question every host can answer: every shop
 * has a catalogue, so "I have nothing to sample" is never honest. Whether an
 * add-on may WRITE BACK to a record is a question hosts genuinely differ on.
 * The dossier's own seven exhibits split down the middle: rendering an invoice
 * to a file writes nothing to the invoice, and a student's certificate sheet is
 * a read-only page by design — while logging a call onto a deal, or recording
 * that a document was issued, is nothing BUT a write. A required handle would
 * force the read-only hosts to pass one that lies.
 *
 * The absence is handled IN WORDS, per this file's rule: an add-on that wanted
 * to record its result says the shop has not given it anywhere to put one, and
 * still does the part it can. It never throws, and it never quietly skips the
 * action — that is the `weight` precedent (see the header) applied to a
 * capability rather than to a fact.
 *
 * ── AND IT SHIPS UNFILLED ───────────────────────────────────────────────────
 *
 * Nothing in this repo fills it yet. Its first consumer is `docs-paperwork`,
 * which is wave 5. The closed registry's own entry sets out why a purchase on
 * seven exhibits is not the guess the registry refuses; this file only repeats
 * the consequence, which is that a reader will not find a fill by grepping.
 */
export interface RecordActionsPayload extends SlotPayload {
  /**
   * What kind of record this is — the host's own word for it, lower-case and
   * stable: `invoice`, `folio`, `appointment`, `certificate`.
   *
   * REQUIRED, because an action that does not know what it has been handed
   * cannot decide whether it applies, and the alternative to knowing is
   * sniffing the record's fields — which is one shop's layout leaking into an
   * add-on by the back door.
   */
  entity: string;
  /**
   * A stable identifier for the record WITHIN its entity, as the host knows it.
   *
   * Separate from `record` rather than dug out of it, because which field is
   * the identity is a host fact: `id`, `ref`, `number` and `code` are all in
   * use across the fifteen apps, and an add-on guessing between them is the
   * same defect as an add-on guessing at a weight.
   */
  recordId: string;
  /** The record itself, as the host holds it. Read-only: see `patchRecord`. */
  record: Readonly<Record<string, unknown>>;
  /**
   * When the host thinks it is — the same `ShopClock` the dispatch surfaces
   * take, and required for the same reason: a document dated off the add-on's
   * own clock is dated off somebody else's Tuesday.
   */
  now: ShopClock;
  /**
   * Write back to this record, or nothing if the host does not allow it.
   *
   * OPTIONAL BY DESIGN — see the header above. An add-on handed no write
   * handle says so on screen and does the readable half of its job.
   */
  patchRecord?: (patch: Record<string, unknown>) => void;
}

/**
 * `shell.overlay` — the layer ABOVE a customer app's pages: a floating
 * affordance in the corner and the panel it opens (bought 2026-09-01, 33 O1).
 *
 * ── WHAT MAKES THIS PAYLOAD DIFFERENT FROM EVERY OTHER ONE IN THIS FILE ─────
 *
 * The other twelve hand over A RECORD — a job, a basket line, an order, a
 * dispatch, a product. This one has no record to hand over, because the surface
 * is not on a record: it is reachable from every screen the app has, including
 * the ones with nothing on them. So what crosses the seam here is THE SHELL
 * ITSELF plus the ENVIRONMENT, and the environment is the interesting half.
 *
 * An add-on may not read a clock, mint a random number, reach the network or
 * touch storage (24 D7, D11; the purity suite enforces all four). Every other
 * surface in this file gets away with that because a record is a static fact
 * and the host had already done the impure work. An overlay that talks to
 * anybody cannot: it needs an id nobody can guess, a place to put it, and
 * somewhere to send what the visitor typed. So the host passes those in as
 * HANDLES, and the fill's own bundle stays free of all four APIs.
 *
 * THE PAYLOAD IS THE ONLY DOOR (31 A.1's rule, kept). No overlay fill reaches
 * into a host store, and every optional handle below has a written answer for
 * what the fill does without it — a host that passes none still gets a working
 * panel, which is the test that keeps this from becoming one app's shell under
 * a general name.
 */
export interface ShellOverlayPayload extends SlotPayload {
  /**
   * The host's display name, for a fill that greets somebody.
   *
   * NOT a brand kit and not a logo: one string, already in the reader's
   * language, and the only thing about the host's identity that crosses. A fill
   * that wanted colours has the host's CSS custom properties, which it inherits
   * by being rendered inside the host — see `renders` on the registry entry.
   */
  brand: string;
  /**
   * Which of the host's screens the visitor is on — the host's own view id,
   * lower-case and stable (`orders`, `track`, `checkout`).
   *
   * Free text rather than an enum, because there is no vocabulary of screens
   * fifteen different apps share, and the value is for the operator to read
   * later ("they asked from the checkout") rather than for the add-on to
   * branch on. A fill that branched on it would be one app's routing table
   * baked into the seam.
   */
  screen: string;
  /** BCP 47, as the host's own i18n resolved it. */
  locale: string;
  /**
   * The reading direction the host is laid out in.
   *
   * Passed rather than derived, for the reason `now` is passed: the fill has no
   * business asking the document what direction it is in when the host already
   * knows, and a fill that guessed from `locale` would get Kurdish wrong.
   */
  dir: 'ltr' | 'rtl';
  /** When the host thinks it is — the same clock the dispatch surfaces take. */
  now: ShopClock;
  /**
   * What the host ALREADY knows about the visitor, or `null` when it knows
   * nothing.
   *
   * Every field optional and the whole thing nullable, because the four states
   * are all real: a storefront with an anonymous shopper knows nothing; a
   * portal with a signed-in account knows a name and an e-mail; a tracking page
   * with a claimed order knows a reference and no name. It PREFILLS and never
   * gates — a fill that refused to open without an e-mail would be unusable on
   * the host that has the most visitors.
   */
  customer: { name?: string; email?: string; reference?: string } | null;
  /**
   * A monotonic counter the host bumps to ask the overlays to open.
   *
   * A COUNTER AND NOT A BOOLEAN, because a boolean cannot express "open again":
   * a visitor who closes the panel and presses the footer link a second time
   * has changed nothing about a `boolean`, and the second press would do
   * nothing. The fill remembers the last value it acted on and opens when the
   * number moves.
   *
   * It opens EVERY enabled fill, which is honest while there is one and is
   * recorded as the thing to widen when there are two (33 D16). The slot is
   * `multi` so the corner can hold two; the request is not yet addressed to
   * one, and inventing a `target` no host would pass is worse than saying so.
   */
  openRequest: number;
  /**
   * Mint an unguessable token — at least 128 bits, hex, from the HOST's CSPRNG.
   *
   * Required, not optional, and this is the field a host is most likely to want
   * to skip. It cannot be: an overlay that identifies a visitor to a server
   * needs a secret nobody can guess, `crypto` is banned in add-on code, and the
   * alternatives an add-on could reach for on its own — a counter, a timestamp,
   * `Math.random()` — are all guessable. A host that will not supply one is a
   * host that should not mount an overlay that needs identity, and the fill
   * would have no honest way to say so after the fact.
   */
  mintToken: () => string;
  /**
   * A token the host has been holding from an earlier visit, or `null`.
   *
   * WHERE IT WAS HELD IS THE HOST'S DECISION and deliberately not the add-on's:
   * a storefront may keep it for the tab, a portal may key it to the signed-in
   * account, and an app with a privacy promise may keep it nowhere and pass
   * `null` for ever. Storage APIs are banned in add-on code, so this is the
   * only way a conversation survives a reload — and a host that passes `null`
   * and ignores `remember` gets a panel that works and forgets, which is a
   * legitimate product decision rather than a broken one.
   */
  resumeToken: string | null;
  /** Hand the host a token to keep, or `null` to forget the one it has. */
  remember: (token: string | null) => void;
  /**
   * A way to reach the operator's Adminium instance, or `undefined` when there
   * is none.
   *
   * ── `undefined` IS THE DEMO BRANCH, AND IT IS THE ONLY ONE ──────────────
   *
   * An example app running on fixtures has no server. Rather than each fill
   * inventing its own idea of "am I connected", THIS FIELD'S ABSENCE is the
   * single source every label reads (25 D9's pattern) — one `isDemo()`, and
   * every simulated result on the panel is paired with it.
   *
   * ── AND IT IS `clientFor(key)`, NOT A CLIENT ────────────────────────────
   *
   * The host does not hand over ITS client. An overlay that writes to the
   * public surface writes through its OWN publishable key, minted against its
   * own scope, held in its own settings — because a scope document carries
   * exactly one claim, and an add-on that identified a visitor through the
   * app's claim would be reading the app's records. So the host hands over a
   * FACTORY: the fill supplies the key it holds and gets a client for it. The
   * host never reads the add-on's settings, which is the seam rule, and the
   * add-on's key is revocable on its own.
   */
  publicApi?: { clientFor: (publishableKey: string) => PublicSurfaceClient };
  /**
   * Answer a visitor's question from whatever the host knows, if it knows
   * anything.
   *
   * OPTIONAL, and the absence is ordinary: a help desk has a knowledge base to
   * search, a storefront has nothing to search, and neither is a broken host.
   * A fill handed no `suggest` simply does not offer suggestions — it does not
   * apologise for the host and it does not invent answers.
   *
   * Synchronous, because every host that has one is searching data it already
   * holds. A host that would need a round trip should return nothing rather
   * than block a keystroke.
   */
  suggest?: (query: string) => readonly OverlaySuggestion[];
  /**
   * Hand what the visitor has been saying over to the HOST'S OWN model — a
   * ticket, a contact record, an e-mail — and tell the fill what came of it.
   *
   * OPTIONAL for the reason `patchRecord` is optional on `record.actions`:
   * hosts genuinely differ. A help desk has tickets and this is the whole point
   * of it; a storefront has nothing to escalate to and honestly says so. A fill
   * handed no `handoff` says the app has no way to pass this on and offers what
   * it can instead — it never throws and never quietly drops the request.
   */
  handoff?: (handoff: OverlayHandoff) => HandoffReceipt | Promise<HandoffReceipt>;
}

/** One thing the host found, and a way to put the visitor in front of it. */
export interface OverlaySuggestion {
  id: string;
  /** Already in the reader's language — the host owns its own catalogue's words. */
  title: string;
  /** Navigate to it. The host decides what that means on its own screens. */
  open: () => void;
}

/**
 * WHAT AN OVERLAY HANDS TO THE HOST WHEN IT GIVES UP AND ASKS FOR A PERSON.
 *
 * ── IT IS NOT A CHAT TRANSCRIPT, AND THE NAMING IS THE POINT ────────────────
 *
 * The plan this slot was bought under drafted this type as `ConversationSummary`
 * with `messages: { who: 'customer' | 'staff' | 'bot' }` — the live chat's own
 * record shape, in the shared mirror, under a general-sounding name. That is
 * this file's founding defect exactly (see the header: `SampleJob` was a print
 * works' job record with `Job` filed off the front), and it would have bound
 * every future host of this surface to one add-on's vocabulary: a host writing
 * a `handoff` would be writing against a chat whether or not it had one.
 *
 * So it is named for what the surface does — something was said in the corner
 * of the page and the app is being asked to take it somewhere — and a chat maps
 * its transcript into it at the boundary, which is four lines in the add-on and
 * the mapping the seam exists to force. A feedback tab hands over one line, a
 * callback request hands over none, and both are the same shape.
 *
 * `who` is `visitor | operator | app` and not `customer | staff | bot` for the
 * same reason: `bot` is a fact about how one add-on generates a line, and no
 * host has any use for the distinction between a canned reply and a typed one.
 * `app` is honest about all of them — the host said this, not a person.
 */
export interface OverlayHandoff {
  /**
   * One line naming what this is about, already in the visitor's language.
   *
   * The fill writes it, because the fill is the only thing that knows: a chat
   * summarises what was asked, a feedback tab uses the rating. A host putting
   * this on a ticket has something to show in a list.
   */
  subject: string;
  /** What was said, oldest first. Empty is legitimate — see `who`. */
  lines: readonly OverlayHandoffLine[];
  /** What the fill collected or was handed about the visitor. */
  customer: ShellOverlayPayload['customer'];
  /**
   * The add-on's own reference for the thing being handed over, where it has
   * one — a conversation id, a request number. Absent in demo mode, where
   * nothing was ever written down.
   */
  reference?: string;
}

/** One line of what was said in the corner of the page. */
export interface OverlayHandoffLine {
  who: 'visitor' | 'operator' | 'app';
  text: string;
  /** ISO instant, where the fill has one to give. */
  at?: string;
}

/** What the host did with a hand-off, in the host's own vocabulary. */
export interface HandoffReceipt {
  /** What the visitor can quote back — a ticket number, a message id. */
  reference: string;
  kind: 'ticket' | 'message' | 'email';
}

/**
 * THE ADMINIUM PUBLIC SURFACE, AS AN OVERLAY MAY USE IT.
 *
 * A structural copy of `PublicClient` from `@adminiumjs/public-client`, and
 * copied for the reason everything else here is copied: this repo publishes
 * standalone and takes no runtime dependency an add-on's host does not already
 * have. A real client satisfies this type — the member signatures are the
 * package's own, verbatim — so a host passes `clientFor` straight through with
 * no cast and no adapter.
 *
 * NARROWED IN EXACTLY ONE PLACE: the real interface also has `config()`,
 * returning the whole compiled scope document. It is left out because
 * `assertRefs` answers the only question a fill has about a scope — is what I
 * need still here — and the difference matters: `assertRefs` names what is
 * missing and fails at boot, while a fill reading `config()` would be an add-on
 * inspecting the operator's configuration to decide what it is allowed to do.
 */
export interface PublicSurfaceClient {
  list: <T = PublicRow>(ref: string, options?: PublicListOptions) => Promise<PublicListResult<T>>;
  get: <T = PublicRow>(ref: string, id: string, signal?: AbortSignal) => Promise<T>;
  create: <T = PublicRow>(ref: string, values: PublicRow) => Promise<T>;
  update: <T = PublicRow>(ref: string, id: string, values: PublicRow) => Promise<T>;
  /** Identify the visitor. `false` means the details did not match. */
  claim: (match: Record<string, unknown>) => Promise<boolean>;
  signOut: () => Promise<void>;
  /** Is a claim session currently held? */
  isClaimed: () => boolean;
  /**
   * Assert the live scope still carries what this fill needs, naming what is
   * missing when it does not. Called at boot; an operator can narrow a scope at
   * any time, and this turns the 403 that would produce into a legible failure.
   */
  assertRefs: (required: Record<string, string[]>) => Promise<void>;
}

/** One row as the public surface exposes it. */
export type PublicRow = Record<string, unknown>;

export interface PublicListResult<T = PublicRow> {
  data: T[];
  page?: { limit: number; offset: number; total: number | null };
  cursor?: { next: string | null };
}

/** The filter grammar, exactly as the public surface accepts it. */
export type PublicFilterOp =
  | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'
  | 'in' | 'like' | 'ilike' | 'is_null' | 'not_null' | 'between';

export type PublicFilter =
  | { column: string; op: PublicFilterOp; value?: unknown }
  | { and: PublicFilter[] }
  | { or: PublicFilter[] };

export interface PublicListOptions {
  where?: PublicFilter;
  q?: string;
  order?: string;
  limit?: number;
  offset?: number;
  cursor?: string;
  signal?: AbortSignal;
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
  'shell.overlay': ShellOverlayPayload;
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
type Assert<T extends true> = T;
export type EveryIdHasAPayload = Assert<SlotId extends keyof SlotPayloads ? true : false>;
export type EveryPayloadHasAnId = Assert<keyof SlotPayloads extends SlotId ? true : false>;

/** What a slot fill is handed, by id. */
export type PayloadFor<S extends SlotId> = SlotPayloads[S];
