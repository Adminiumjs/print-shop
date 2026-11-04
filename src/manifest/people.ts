/**
 * The works' customers, as Adminium is told of them (`people`), and the tick
 * a customer gives at checkout ("News from the print works").
 *
 * A customer is made by their first order (or saved quote) from the address
 * they type, and signs in to follow their orders by a link or code e-mailed to
 * it. Their language is the one that order was placed in. `may_email` is the
 * newsletter's consent, kept in step with Adminium's consent log.
 *
 * A customer is also copied onto every order and saved quote of theirs (the
 * name and the address it goes to, the address the e-mails went to), onto a
 * sample pack they asked for, and onto the designs they made in the
 * Customiser (the address the design's link went to, and the words and
 * choices in it). Each copy is declared, so finding, exporting and erasing a
 * person reaches it. An order and its jobs are the works' record of a sale,
 * which the law keeps, so an erasure leaves those as they are; the artwork a
 * customer sent goes with them, as every file a guest uploads does.
 */
import { CUSTOMISER } from "./postings.ts";

/** The sentence shown beside the tick at checkout, and its version. */
export const NEWS_TICK = {
  column: "may_email",
  purpose: "newsletter",
  wording: {
    version: 1,
    // The other languages come with the checkout's own words.
    text: { "en-US": "Send me news from Marlow Press now and then. You can say no to news at any time — every e-mail has a link." },
  },
};

export const PEOPLE = [
  {
    table: "customers",
    kind: "people",
    email: "email",
    name: "name",
    firstName: "firstWordOfName",
    language: "language",
    consent: { column: "may_email", purpose: "newsletter" },
    copies: [
      { table: "orders", column: "name", holds: "name", via: "customer_id" },
      { table: "orders", column: "email", holds: "email", via: "customer_id" },
      { table: "orders", column: "address_line1", holds: "details", via: "customer_id" },
      { table: "orders", column: "address_line2", holds: "details", via: "customer_id" },
      { table: "orders", column: "town", holds: "details", via: "customer_id" },
      { table: "orders", column: "postcode", holds: "details", via: "customer_id" },
      { table: "saved_quotes", column: "name", holds: "name", via: "customer_id" },
      { table: "saved_quotes", column: "email", holds: "email", via: "customer_id" },
      // A sample pack is nobody's account: found by the address it holds.
      { table: "sample_requests", column: "name", holds: "name" },
      { table: "sample_requests", column: "email", holds: "email" },
      { table: "sample_requests", column: "address_line1", holds: "details" },
      { table: "sample_requests", column: "address_line2", holds: "details" },
      { table: "sample_requests", column: "town", holds: "details" },
      { table: "sample_requests", column: "postcode", holds: "details" },
      // The designs their jobs name: the address its link went to, and what they put on it.
      { addOn: CUSTOMISER, table: "designs", column: "email", holds: "email", via: "jobs.design_id" },
      { addOn: CUSTOMISER, table: "designs", column: "values", holds: "details", via: "jobs.design_id" },
    ],
  },
];
