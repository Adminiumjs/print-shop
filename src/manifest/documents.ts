/**
 * The one document this app declares: the invoice for an order, drawn by
 * Invoices & Receipts (the feature `invoices`). The customer pays when they
 * collect, or by the invoice sent with the delivery.
 *
 * Each line is a job as the order kept it: what was printed, how many, and
 * its price. The delivery and the tax are the order's own, under them.
 */
import { l } from "./labels.ts";

export const DOCUMENTS = [
  {
    kind: "invoice",
    addOn: "invoices",
    table: "orders",
    feature: "invoices",
    name: l("Invoice"),
    mapping: {
      items: {
        collections: [
          {
            table: "jobs",
            via: "order_id",
            orderBy: "position",
            columns: { desc: "product_name", qty: "qty", amount: "price" },
          },
        ],
      },
      subtotal: { column: "subtotal" },
      tax: { column: "tax" },
      total: { column: "total" },
      reference: { column: "number" },
      issuedAt: { column: "placed_at" },
    },
  },
];
