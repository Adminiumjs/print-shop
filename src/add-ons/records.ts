/**
 * THIS APP'S RECORDS, TURNED INTO SLOT PAYLOADS.
 *
 * ── WHY THE MAPPING LIVES HERE ──────────────────────────────────────────────
 *
 * A slot id names a surface, so its payload has to be a shape every host of
 * that surface can honestly produce (see `payloads.ts`). The works has JOBS —
 * a trim size, a press sheet, a grammage, a packaging key — and Birch Row has
 * order lines, and neither vocabulary is the seam's. Something has to convert,
 * and THE HOST IS THE RIGHT PLACE FOR IT: it is the only party that knows both
 * its own records and the shape it promised.
 *
 * This module used to be `samples.ts` and did a fraction of this. The rest of
 * the conversion was, in effect, inside the delivery add-on: it carried a copy
 * of this app's grammages, its SRA3 sheet area, its size presets, its three
 * packaging kinds and an address book keyed by this app's customer keys, so it
 * could work out from a job what a parcel weighed. Every one of those tables
 * was a fact about THIS app held by somebody else's repo, drifting quietly, and
 * missing entirely in any other shop.
 *
 * ── WHAT MOVED, AND WHAT DID NOT ────────────────────────────────────────────
 *
 * The works now says what ONE of a thing weighs and how big it is, out of the
 * engine that already computes it for the quote (`lib/quote.ts` prices delivery
 * off the same arithmetic). The carrier says what a PARCEL of them weighs —
 * goods plus wrap plus the box. Neither can do the other's half:
 *
 *   THE HOST does not know what a courier's box weighs or when something has
 *   to go in a tube instead;
 *   THE ADD-ON does not know that 500 business cards are imposed 21-up on an
 *   SRA3 sheet of 350gsm silk, and has no business learning it.
 *
 * The address is the same story. The works knows where it posts from and where
 * its customers are; that is seed data in `data/demo.ts` now, and this module
 * hands it over.
 */

import type {
  CartLinePayload,
  CatalogueSample,
  Money,
  OutboundOrder,
  PostalAddress,
  ShopClock,
  SlotItem,
} from './payloads.ts';
import { PRODUCTS, SIZE_BY_KEY } from '../lib/catalogue.ts';
import { imposition, type Job } from '../lib/jobs.ts';
import { MATERIAL_BY_KEY, PACKAGING_BY_KEY, sheetWeightKg } from '../lib/rates.ts';
import { priceQuote, resolveSize, type Configuration } from '../lib/quote.ts';
import { source } from '../data/source.ts';

/** What the shop quotes in, and what a carrier therefore bills in. */
const CURRENCY = 'USD';

/**
 * Vinyl's real grammage.
 *
 * `rates.ts` records it as `0` because vinyl is PRICED BY AREA rather than by
 * weight, which is true of the price and false of the parcel: a roll of vinyl
 * weighs something, and a courier is going to notice. The delivery add-on used
 * to carry this number, which meant an add-on held a fact about this shop's
 * materials. It is the works' fact and it is here.
 */
const VINYL_GSM = 440;

const gsmOf = (materialKey: string): number =>
  MATERIAL_BY_KEY[materialKey as keyof typeof MATERIAL_BY_KEY]?.gsm || VINYL_GSM;

/**
 * WHAT ONE PIECE WEIGHS, in grams — the works' own arithmetic, per unit.
 *
 * Sheet work is weighed by the SHEETS THE RUN CONSUMES rather than by the
 * trimmed pieces, which is the choice that surprises people and is the same one
 * `priceQuote` makes: a 500-run imposed 21-up eats 24 sheets, and the offcut
 * goes in the box or in the bin but it was still bought. Divided back down to
 * one piece so that the number crossing the seam is a property of the THING
 * rather than of this particular run.
 *
 * The wrap and the box are NOT in here. They belong to whoever packs the
 * parcel, and adding them at both ends is how a shop ends up declaring a weight
 * nobody can reproduce.
 */
export function unitWeightGrams(
  productKey: string,
  materialKey: string,
  quantity: number,
  widthMm: number,
  heightMm: number,
): number {
  const product = PRODUCTS.find((p) => p.key === productKey);
  const gsm = gsmOf(materialKey);
  const each = Math.max(1, quantity);

  if (product?.press === 'large-format') {
    // Off the roll: the piece's own area at the material's grammage.
    return ((widthMm / 1000) * (heightMm / 1000) * gsm * 1000) / 1000;
  }

  const { sheets } = imposition(widthMm, heightMm, each);
  return (sheetWeightKg(sheets, gsm) * 1000) / each;
}

/**
 * The works' own address, as the seam wants it.
 *
 * Through `source`, not through `data/demo.ts`. Reading the seed here meant a
 * connected shop would have printed MARLOW PRESS on every dispatch label while
 * the jobs above them came from the tenant's own database — an add-on quietly
 * posting one shop's parcels from another shop's address.
 */
const works = source.works();
export const SHOP_ORIGIN: PostalAddress = {
  name: works.name,
  lines: [...works.lines],
  city: works.city,
  postcode: works.postcode,
  country: works.countryCode,
};

/**
 * Where a customer is, by the display NAME a job carries.
 *
 * `Job.customer` is a display name by the time a screen sees it — the
 * `DataSource` resolves the key once, on the way out (`data/source.ts`) — so
 * that is what there is to match on. A miss returns `undefined` rather than
 * anything else: an add-on handed the wrong customer's street would print it
 * onto a label, and nothing on the screen would say it was a guess.
 */
export function addressFor(customerName: string): PostalAddress | undefined {
  const found = source.customers().find((c) => c.name === customerName);
  if (found === undefined) return undefined;
  return {
    name: found.name,
    lines: [...found.address.lines],
    city: found.address.city,
    postcode: found.address.postcode,
    country: found.address.country,
  };
}

const money = (cents: number): Money => ({ amount: cents, currency: CURRENCY });

/**
 * ONE JOB ON THE BOARD, as `order.dispatch.panel` and `order.dispatch.actions`
 * want to read it.
 *
 * A works job is one line of one thing, so the neutral order carries exactly
 * one item. `label` arrives translated because the words for what this shop
 * sells belong to this shop.
 */
export function outboundOrderFor(job: Job, label: (productKey: string) => string): OutboundOrder {
  const item: SlotItem = {
    id: job.ref,
    key: job.productKey,
    label: label(job.productKey),
    quantity: job.quantity,
    unitWeightGrams: unitWeightGrams(
      job.productKey,
      job.materialKey,
      job.quantity,
      job.trimWidthMm,
      job.trimHeightMm,
    ),
    unitSize: { widthMm: job.trimWidthMm, heightMm: job.trimHeightMm },
  };

  return {
    ref: job.ref,
    recipient: { name: job.customer },
    items: [item],
    origin: SHOP_ORIGIN,
    // Absent rather than guessed when the works has no address on file. The
    // add-on's own screen says so and takes one; see `payloads.ts`.
    ...(addressFor(job.customer) !== undefined
      ? { destination: addressFor(job.customer)! }
      : {}),
    promisedFor: job.promisedFor,
  };
}

/** One configured basket line, as the till's surfaces read it. */
export function slotItemFor(
  id: string,
  config: Configuration,
  label: (productKey: string) => string,
): SlotItem {
  const size = resolveSize(config);
  const quote = priceQuote(config);
  return {
    id,
    key: config.product,
    label: label(config.product),
    quantity: config.quantity,
    unitWeightGrams: unitWeightGrams(
      config.product,
      config.material,
      config.quantity,
      size.widthMm,
      size.heightMm,
    ),
    unitSize: { widthMm: size.widthMm, heightMm: size.heightMm },
    unitPrice: money(quote.unitCents),
  };
}

/** The whole basket, as `checkout.delivery.methods` reads it. */
export function checkoutItems(
  basket: readonly { id: string; config: Configuration }[],
  label: (productKey: string) => string,
): SlotItem[] {
  return basket.map((line) => slotItemFor(line.id, line.config, label));
}

/** One line for `cart.line.preview`, when this app comes to mount it. */
export function cartLinePayload(
  line: { id: string; config: Configuration },
  label: (productKey: string) => string,
): CartLinePayload {
  return { line: slotItemFor(line.id, line.config, label) };
}

/**
 * ONE REPRESENTATIVE RECORD PER FAMILY, for `settings.add-on.panel`.
 *
 * It is the shop's own catalogue, narrowed to one per family and labelled in
 * the reader's language — knowledge the host has and no add-on does. It is NOT
 * an estimate of a parcel: there is no box here, no size band and no rate. An
 * add-on with an opinion about the shop's catalogue forms it with its own
 * engine from these; an add-on with none ignores the field.
 *
 * One row per FAMILY rather than per product, because a settings panel listing
 * every product would be a catalogue, and the point of the row is the shape of
 * the thing rather than its name.
 */
export function sampleCatalogue(label: (productKey: string) => string): CatalogueSample[] {
  const seen = new Set<string>();
  const rows: CatalogueSample[] = [];

  for (const product of PRODUCTS) {
    if (seen.has(product.family)) continue;
    seen.add(product.family);
    const size = SIZE_BY_KEY[product.sizes[0]!];
    // Off the roll there is no preset, so the store's own default custom size
    // stands in — the same 800 × 2000mm a customer starts from.
    const widthMm = size?.widthMm ?? 800;
    const heightMm = size?.heightMm ?? 2000;
    const materialKey = product.materials[0]!;

    rows.push({
      key: product.key,
      label: label(product.key),
      quantity: product.fromQuantity,
      unitWeightGrams: unitWeightGrams(
        product.key,
        materialKey,
        product.fromQuantity,
        widthMm,
        heightMm,
      ),
      unitSize: { widthMm, heightMm },
    });
  }

  return rows;
}

/**
 * What the works' three packagings are, kept ONLY so a reader can see they were
 * deliberately not sent across the seam.
 *
 * A `packagingKey` of `boxed` means nothing in a shop that does not box things,
 * and the carrier that used to receive it kept a table mapping this app's three
 * keys to words. The box a parcel goes in is the carrier's to decide from what
 * is in it, so the seam carries a weight and a size and this stays at home.
 */
export const PACKAGING_STAYS_HERE = Object.keys(PACKAGING_BY_KEY);

/**
 * THE WORKS' OWN CLOCK, as the seam wants it.
 *
 * `iso` is `todayIso()` rather than the seeded date, so "+1 working day" moves
 * the carrier's estimates with every other date on the screen.
 *
 * It carries no surprise here — this app is pinned to the same instant the
 * delivery add-on used to hard-code, so nothing about these screens changes.
 * That is the point of passing it anyway: the add-on stopped ASSUMING and
 * started being TOLD, and the shop that disagreed with the assumption was the
 * one where the assumption was invisible. See `payloads.ts`.
 */
export function shopClock(iso: string, now: { hour: number; minute: number }): ShopClock {
  return { iso, hour: now.hour, minute: now.minute };
}
