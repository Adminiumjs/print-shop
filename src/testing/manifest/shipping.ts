/*
 * VENDORED VERBATIM from packages/manifest/src/shipping.ts.
 * Never hand-edit this copy: change the monorepo package and re-run
 * `node scripts/sync-manifest-validator.mjs`.
 *
 * WHY A COPY. `@adminium/manifest` is not published to npm and this app is a
 * standalone repo that must build from a clean clone, so it cannot depend on
 * the monorepo. It lives under `testing/` because `zod` is a devDependency
 * here and a runtime dependency the host does not carry — nothing in
 * the shipped bundle's import graph may reach it, which sources.test.ts gates.
 *
 * The only edits are import specifiers: `.js` becomes `.ts`, and the
 * `@adminium/add-on-contracts` package import becomes relative ones.
 */
/**
 * `shipping` — where an app keeps what a carrier needs to know about an order.
 *
 * ```json
 * "shipping": {
 *   "orders": [{
 *     "table": "orders",
 *     "reference": "number",
 *     "address": { "name": "ship_name", "lines": ["ship_line1", "ship_line2"], "city": "ship_city",
 *                  "region": "ship_region", "postcode": "ship_postcode", "country": "ship_country",
 *                  "phone": "ship_phone", "email": "ship_email", "company": "ship_company" }
 *   }]
 * }
 * ```
 *
 * The server reads the address from these columns, so a request can never name
 * where a parcel goes. An app without this block has not been updated for real
 * carriers, and the engine refuses it one: a released app sends a sample
 * address, and a real carrier would buy a label for it.
 *
 * `name`, `lines` (one to three), `city`, `postcode`, `country` and `reference`
 * are required, the rest optional, and a table is named once. `tracking` and
 * `carrier` name text columns the engine fills once a real label is bought; it
 * never moves the order's status.
 *
 * `customs` says where an order's goods are, for a parcel that leaves the
 * shop's country: the lines table, the column naming the order, and each line's
 * quantity, one unit's value and description. Without it the engine sends this
 * order nowhere abroad, whatever the shop's settings say.
 *
 * Pure.
 */
import { z } from 'zod';

import { refSchema, type ReferenceIssue, type TableIndex } from './refs.ts';

/** What may hold a line of an address: words, or a fixed list (a country picked from one). */
const ADDRESS_TYPES: readonly string[] = ['text', 'enum'];
/** What a bought label's number and carrier are written into. */
const TEXT_TYPES: readonly string[] = ['text'];
/** What may hold an order's reference: `MP-4118`, or a plain number. */
const REFERENCE_TYPES: readonly string[] = ['text', 'int', 'bigint', 'uuid'];
/** What may hold how many of a thing were ordered. */
const COUNT_TYPES: readonly string[] = ['int', 'bigint'];
/** What may hold one unit's value, in the shop's main currency unit. */
const VALUE_TYPES: readonly string[] = ['decimal', 'money'];
/** What may hold one unit's weight. */
const WEIGHT_TYPES: readonly string[] = ['int', 'bigint', 'decimal', 'float'];
/** A column that holds a moment. */
const MOMENT_TYPES: readonly string[] = ['timestamptz', 'timestamp', 'datetime'];

const shippingAddressSchema = z
  .object({
    name: refSchema,
    lines: z.array(refSchema).min(1).max(3),
    city: refSchema,
    region: refSchema.optional(),
    postcode: refSchema,
    country: refSchema,
    phone: refSchema.optional(),
    email: refSchema.optional(),
    company: refSchema.optional(),
  })
  .strict();

const shippingCustomsSchema = z
  .object({
    lines: z
      .object({
        table: refSchema,
        /** The column naming the order. */
        order: refSchema,
        quantity: refSchema,
        /** One unit's value, as the customer paid it. Or `lineTotal`, for a line priced as a whole. */
        unitValue: refSchema.optional(),
        /** What the customer paid for the whole line. One unit's value is worked out from it, exact to six places. */
        lineTotal: refSchema.optional(),
        description: refSchema,
        sku: refSchema.optional(),
        /** One unit's net weight, in `weightUnit`. Both or neither. */
        unitWeight: refSchema.optional(),
        weightUnit: z.enum(['g', 'kg']).optional(),
        /** Where a line's SKU is kept when the line itself does not hold one. */
        product: z.object({ column: refSchema, table: refSchema, sku: refSchema }).strict().optional(),
        /** A column that, once filled, says this line is not in the parcel: a cancelled line is never declared. */
        unlessSet: refSchema.optional(),
        /** A column whose value says this line is not in the parcel, for an app that keeps a line's state rather than a stamp. An empty value is a line still in it. */
        unless: z.object({ column: refSchema, in: z.array(z.string().min(1).max(64)).min(1).max(16) }).strict().optional(),
      })
      .strict(),
    /** The order's column holding its currency. Without one, the shop's customs currency is used. */
    currency: refSchema.optional(),
    /** The order's column holding what was refunded. While it is above zero the declared values are not what the customer paid, so the order cannot be declared. */
    refunded: refSchema.optional(),
    /** The order's column holding when it was placed. An order with no currency of its own, placed before the shop's currency changed, cannot be declared. */
    placedAt: refSchema.optional(),
  })
  .strict();

export const shippingOrderSchema = z
  .object({
    table: refSchema,
    reference: refSchema,
    address: shippingAddressSchema,
    /** Where a bought label's tracking number is written, for the order's own screens and mail. */
    tracking: refSchema.optional(),
    /** Where the name of the company moving the parcel is written. */
    carrier: refSchema.optional(),
    /**
     * An app that takes returns: which table, the column naming the order, its
     * status, and the states a return label may be bought in. Without this
     * block the engine sells no return label for this order.
     */
    returns: z
      .object({
        table: refSchema,
        order: refSchema,
        status: refSchema,
        approved: z.array(z.string().min(1).max(64)).min(1).max(8),
      })
      .strict()
      .optional(),
    /** Where this order's goods are, for a parcel going abroad. */
    customs: shippingCustomsSchema.optional(),
  })
  .strict();

export const shippingSchema = z
  .object({
    orders: z.array(shippingOrderSchema).min(1).max(8),
  })
  .strict();

export type Shipping = z.infer<typeof shippingSchema>;
export type ShippingOrder = z.infer<typeof shippingOrderSchema>;
export type ShippingAddressColumns = ShippingOrder['address'];

/** Everything wrong with an app's `shipping`, checked against its own tables and columns. */
export function shippingIssues<C extends { ref: string; type: string }>(m: { shipping?: Shipping | undefined }, index: TableIndex<C>): ReferenceIssue[] {
  const out: ReferenceIssue[] = [];
  const seen = new Set<string>();
  (m.shipping?.orders ?? []).forEach((order, o) => {
    const at = (...rest: (string | number)[]) => ['shipping', 'orders', o, ...rest];
    if (seen.has(order.table)) out.push({ path: at('table'), message: `"${order.table}" is named twice` });
    seen.add(order.table);
    if (index.table(order.table) === undefined) {
      out.push({ path: at('table'), message: `"${order.table}" is not a table of this app` });
      return;
    }
    const column = (ref: string, types: readonly string[], path: (string | number)[]): void => {
      const found = index.column(order.table, ref);
      if (found === undefined) out.push({ path, message: `"${order.table}" has no column "${ref}"` });
      else if (!types.includes(found.type)) out.push({ path, message: `"${order.table}.${ref}" is a ${found.type} column, which cannot hold this` });
    };
    column(order.reference, REFERENCE_TYPES, at('reference'));
    if (order.tracking !== undefined) column(order.tracking, TEXT_TYPES, at('tracking'));
    if (order.carrier !== undefined) column(order.carrier, TEXT_TYPES, at('carrier'));
    const { lines, ...single } = order.address;
    for (const [field, ref] of Object.entries(single)) if (ref !== undefined) column(ref, ADDRESS_TYPES, at('address', field));
    lines.forEach((ref, l) => {
      column(ref, ADDRESS_TYPES, at('address', 'lines', l));
      if (lines.indexOf(ref) !== l) out.push({ path: at('address', 'lines', l), message: `"${ref}" is named twice` });
    });
    if (order.returns !== undefined) {
      const { table, order: link, status } = order.returns;
      if (index.table(table) === undefined) out.push({ path: at('returns', 'table'), message: `"${table}" is not a table of this app` });
      else {
        if (index.column(table, link) === undefined) out.push({ path: at('returns', 'order'), message: `"${table}" has no column "${link}"` });
        if (index.column(table, status) === undefined) out.push({ path: at('returns', 'status'), message: `"${table}" has no column "${status}"` });
      }
    }
    if (order.customs !== undefined) {
      const { lines, currency, refunded, placedAt } = order.customs;
      if (currency !== undefined) column(currency, ADDRESS_TYPES, at('customs', 'currency'));
      if (refunded !== undefined) column(refunded, VALUE_TYPES, at('customs', 'refunded'));
      if (placedAt !== undefined) column(placedAt, MOMENT_TYPES, at('customs', 'placedAt'));
      const onTable = (table: string, ref: string, types: readonly string[] | null, path: (string | number)[]): void => {
        const found = index.column(table, ref);
        if (found === undefined) out.push({ path, message: `"${table}" has no column "${ref}"` });
        else if (types !== null && !types.includes(found.type)) out.push({ path, message: `"${table}.${ref}" is a ${found.type} column, which cannot hold this` });
      };
      const inLines = (...rest: (string | number)[]) => at('customs', 'lines', ...rest);
      if ((lines.unitWeight === undefined) !== (lines.weightUnit === undefined)) out.push({ path: inLines('weightUnit'), message: 'unitWeight and weightUnit go together' });
      if (index.table(lines.table) === undefined) out.push({ path: inLines('table'), message: `"${lines.table}" is not a table of this app` });
      else {
        onTable(lines.table, lines.order, null, inLines('order'));
        onTable(lines.table, lines.quantity, COUNT_TYPES, inLines('quantity'));
        if ((lines.unitValue === undefined) === (lines.lineTotal === undefined)) out.push({ path: inLines('unitValue'), message: 'name one of unitValue and lineTotal' });
        if (lines.unitValue !== undefined) onTable(lines.table, lines.unitValue, VALUE_TYPES, inLines('unitValue'));
        if (lines.lineTotal !== undefined) onTable(lines.table, lines.lineTotal, VALUE_TYPES, inLines('lineTotal'));
        onTable(lines.table, lines.description, ADDRESS_TYPES, inLines('description'));
        if (lines.sku !== undefined) onTable(lines.table, lines.sku, TEXT_TYPES, inLines('sku'));
        if (lines.unitWeight !== undefined) onTable(lines.table, lines.unitWeight, WEIGHT_TYPES, inLines('unitWeight'));
        if (lines.product !== undefined) onTable(lines.table, lines.product.column, null, inLines('product', 'column'));
        if (lines.unlessSet !== undefined) onTable(lines.table, lines.unlessSet, null, inLines('unlessSet'));
        if (lines.unless !== undefined) {
          onTable(lines.table, lines.unless.column, ADDRESS_TYPES, inLines('unless', 'column'));
          const held = (index.column(lines.table, lines.unless.column) as { enum?: readonly string[] } | undefined)?.enum;
          if (held !== undefined) {
            lines.unless.in.forEach((value, v) => {
              if (!held.includes(value)) out.push({ path: inLines('unless', 'in', v), message: `"${lines.table}.${lines.unless!.column}" can never hold "${value}"` });
            });
          }
        }
      }
      if (lines.product !== undefined) {
        if (index.table(lines.product.table) === undefined) out.push({ path: inLines('product', 'table'), message: `"${lines.product.table}" is not a table of this app` });
        else onTable(lines.product.table, lines.product.sku, TEXT_TYPES, inLines('product', 'sku'));
      }
    }
  });
  return out;
}
