/**
 * Paying for an order online.
 *
 * An order may be paid once every job's proof is approved and no delivery
 * price is still to agree (`pay_open`), while it is placed, ready or on its
 * way: from the customer's order page, and from the pay button the "proof
 * approved", "ready to collect" and "on its way" e-mails carry while
 * something is owed. A collected order was paid over the counter; a
 * cancelled one owes nothing.
 *
 * What is owed is the order's own balance (`due`: its total, less what its
 * payments kept), never a figure a page sends. A payment the service confirms
 * lands as a row of the order's payments, written by Adminium, with the
 * method `online`, the service it came through and its reference; a refund
 * writes what went back on that row. The counter's own payments (card on the
 * works' terminal, cash) are rows the works writes beside them.
 *
 * Installing or updating the app switches nothing on: the order arrives
 * switched off in Payments, and someone who manages payments switches it on.
 * Until then every page and e-mail reads as it did. Adminium sends the
 * receipt: the works has no receipt e-mail of its own. The pay page sends the
 * customer back to their order page, which finds the order again by the
 * session it already held (never by anything in the address).
 */
export const PAYMENTS = {
  payables: [
    {
      table: "orders",
      label: "number",
      amount: { column: "total" },
      currency: { connection: true },
      due: { column: "due" },
      payments: {
        kind: "table",
        table: "payments",
        link: "order_id",
        amount: "amount",
        paidAt: "paid_at",
        // Every payment service's payment is "online"; the counter writes its own ways.
        method: { column: "method", values: { "*": "online" } },
        note: "note",
        reference: "payment_ref",
        refunded: "refunded",
        provider: "provider",
        currency: "currency",
      },
      customerEmail: "email",
      payableWhen: [
        { column: "pay_open", eq: 1 },
        { column: "status", in: ["placed", "ready", "dispatched"] },
      ],
      returnTo: "/order",
      receipt: "engine",
    },
  ],
};
