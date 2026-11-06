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
 * which the law keeps, so an erasure leaves those as they are. The artwork a
 * customer sent and the proof PDFs the works sent them show their design, so
 * those files go with them (with the artwork's file name and the checks
 * shown on it, and the change they asked for, in their words);
 * the artwork and proof rows stay, emptied, as the job's record.
 */
import { shop } from "../i18n/strings/shop.ts";
import { LOCALES } from "./labels.ts";
import { CUSTOMISER } from "./postings.ts";

/** The sentence shown beside the tick at checkout, and its version. */
export const NEWS_TICK = {
  column: "may_email",
  purpose: "newsletter",
  wording: {
    version: 1,
    // The checkout's own words beside the tick, in each language it shows them.
    text: Object.fromEntries(LOCALES.map((tag) => [tag, `${shop[tag]["shop.checkout.news"].replace("{works}", "Marlow Press")}. ${shop[tag]["shop.checkout.newsLine"]}`])),
  },
};

/**
 * The logo and photo a customer put on their design, the versions of it the
 * Customiser keeps as it was ordered, and their files: the person's because
 * their design is, so erasing them deletes the logo and photo, blanks the
 * words in each version and deletes its proof picture and production files.
 * Adminium empties a copy that holds files, and follows one that far into an
 * add-on, from 0.3.44.
 */
export const VERSION_COPIES = [
  { addOn: CUSTOMISER, table: "designs", column: "logo_file", holds: "details", via: "jobs.design_id" },
  { addOn: CUSTOMISER, table: "designs", column: "photo_file", holds: "details", via: "jobs.design_id" },
  { addOn: CUSTOMISER, table: "design_versions", column: "values", holds: "details", via: "jobs.design_id", from: ["design_id"] },
  { addOn: CUSTOMISER, table: "design_versions", column: "proof_file", holds: "details", via: "jobs.design_id", from: ["design_id"] },
  { addOn: CUSTOMISER, table: "version_files", column: "file", holds: "details", via: "jobs.design_id", from: ["version_id", "design_id"] },
];

/** The people declaration as a manifest at a floor that reads `from` writes it. */
export function peopleFor(versions: boolean): typeof PEOPLE {
  if (!versions) return PEOPLE;
  return PEOPLE.map((person) => ({ ...person, copies: [...person.copies, ...VERSION_COPIES] })) as typeof PEOPLE;
}

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
      // The artwork they sent and the proofs the works sent them: the files go, the rows stay as the job's record.
      { table: "artwork", column: "file", holds: "details", via: "customer_id" },
      // …and what names it or says what was in it: the file's own name, and the checks shown on it.
      { table: "artwork", column: "name", holds: "details", via: "customer_id" },
      { table: "artwork", column: "checks", holds: "details", via: "customer_id" },
      { table: "proofs", column: "file", holds: "details", via: "customer_id" },
      { table: "proofs", column: "change_note", holds: "details", via: "customer_id" },
      // The designs their jobs name: the address its link went to, and what they put on it.
      { addOn: CUSTOMISER, table: "designs", column: "email", holds: "email", via: "jobs.design_id" },
      { addOn: CUSTOMISER, table: "designs", column: "values", holds: "details", via: "jobs.design_id" },
    ],
  },
];
