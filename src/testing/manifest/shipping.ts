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

export const shippingOrderSchema = z
  .object({
    table: refSchema,
    reference: refSchema,
    address: shippingAddressSchema,
    /** Where a bought label's tracking number is written, for the order's own screens and mail. */
    tracking: refSchema.optional(),
    /** Where the name of the company moving the parcel is written. */
    carrier: refSchema.optional(),
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
  });
  return out;
}
