# Print Shop releases

## 0.2.3 (not released yet)

- **Every proof is e-mailed, not only an order's first.** A proof sent after a
  change asked, or sent again, now e-mails the customer its "proof ready" too,
  as the toast and the order's page promised. Each change a customer asks
  reaches the works' own address too, not only the first on an order. The
  e-mails are written in the language the order was placed in, as before.
- **A proof with no PDF is never e-mailed.** A proof added on the dashboard
  without its PDF waits until it is given one, and is e-mailed then. The
  customer's order page no longer says such a proof, or the design, is "no
  longer kept": that is said only of a PDF erased with the customer's data.
- **The ticket's proof history keeps the customer's change** once the next
  proof has replaced the one they answered, and says a replaced proof was
  replaced ("Proof 1 sent, since replaced").
- **Prepress, the press and the counter no longer ask Adminium for what their
  role does not read** (the list of add-ons, Holiday calendars' public holidays,
  and for the counter a design's versions), so their screens make no refused
  reads in the background.
- **With the Maker Shop on the same install, the owner changes only the print
  shop's own Customiser set-up.** A row the owner adds is the print shop's, and
  they change and remove only the print shop's bases, areas, pieces, ready-made
  designs and their parts, palettes, colours and priced features. The starter
  fonts belong to no shop and stay theirs to give files to.
- The Customiser's `appGrants` are vendored with its editor
  (`vendor/customiser/app-grants.json`), and the owner's set-up columns are
  tested against them.

## 0.2.2 (8 November 2026)

Needs Adminium **0.3.51** and asks for the add-ons at **1.0.22**.

- **A proof sent again sends the earlier one again, wherever it is made.** A new
  proof of a job moves the job's earlier proof still out (waiting, or with a
  change asked) to "Sent again" in the same write. Adminium does it
  (`states.supersedes` on the proofs, from 0.3.50), so a proof made in the
  dashboard or through the data API does the same as one sent from the ticket.
  The ticket no longer moves the earlier proof itself, and prepress no longer
  changes a proof: sending again is a new one.
- **The owner sets the shop up on their own role.** The Customiser's set-up page
  reads its settings and the customers' designs, and adds, changes and takes
  away ready-made designs and their parts, the bases' areas and pieces, fonts,
  palettes and their colours, and priced features; a base is added and changed,
  never taken away. Thirteen of the Customiser's tables, within the 24 a role
  holds. The owner no longer needs a Customiser role beside theirs.
- **The starter fonts' files are added the first time the owner opens the
  set-up**, so a shopper's editor loads every starter font.
- **Each part of a ready-made design is listed once** on a job's Customiser
  panel, for a design with more than one layout.
- **The Customiser's 3D models are seen from above** (add-ons 1.0.22), in the
  shopper's editor the shop ships.
- From Adminium 0.3.50 and the add-ons 1.0.21: erasing a customer also takes
  the earlier files of a proof made again; the record page's Edit dialog uses
  the designed form, and the dashboard's lists open on their stored order;
  Holiday calendars' picker starts on the shop's own country (Great Britain
  for Marlow Press).

Upgrading from 0.2.1 changes no table. The prepress role loses its change of a
proof's answer, which nothing uses any more.
