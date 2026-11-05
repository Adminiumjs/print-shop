/**
 * The add-ons this app needs and the ones it works better with.
 *
 * It needs the Customiser: a customer fills in a ready-made design or starts
 * from blank there, and the job names the design they made. Everything else is
 * offered: the works takes, prints and hands over jobs without any of them.
 * Neither Design Studio nor the Canva import is offered: the Customiser took
 * the first's place, and a customer who made their artwork in Canva sends it
 * as a print PDF.
 *
 * The ranges name the add-ons' release that first carries the Customiser and
 * attaches each of these to this app.
 */
import { l } from "./labels.ts";
import { CUSTOMISER } from "./postings.ts";

/** The add-ons' release that first carries the Customiser and attaches them all to this app. */
export const ADD_ONS_RANGE = "^1.0.19";

export const ADD_ONS = {
  requires: [{ key: CUSTOMISER, range: ADD_ONS_RANGE, reason: l("Customers fill in a ready-made design, or start from blank, with their own words and logo.") }],
  suggests: [
    { key: "shipping-dhl", range: ADD_ONS_RANGE, reason: l("Book DHL for a delivery, print its label, and send the customer a tracking number.") },
    { key: "inventory", range: ADD_ONS_RANGE, reason: l("Keep the sheet stocks and rolls in stock, with what each job takes and spoils.") },
    { key: "invoices", range: ADD_ONS_RANGE, checked: true, reason: l("Send an invoice with each delivery, and print one at the counter.") },
    { key: "holiday-calendars", range: ADD_ONS_RANGE, reason: l("Close the works for public holidays in a tap.") },
  ],
  features: [
    { id: "tracking", label: l("Tracking numbers"), requires: ["shipping-dhl"] },
    { id: "stock", label: l("Stock through Inventory"), requires: ["inventory"] },
    { id: "invoices", label: l("Invoices"), requires: ["invoices"] },
    { id: "holiday-closures", label: l("Public holidays as closures"), requires: ["holiday-calendars"] },
  ],
};
