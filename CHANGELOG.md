# Print Shop releases

## 0.2.4 (not released yet)

- **A proof is made with its PDF.** A proof added on the dashboard without its
  PDF is refused, and the form asks for it: the proof it would have sent again
  stays the customer's to answer, and nothing is said to be sent before there
  is something to open. The works' screens always sent the PDF with the proof.
- **The day a change adds stays on the ready-by.** Once a customer asks for a
  change, its working day stays on the job's ready-by after the next proof
  goes out and after the proof is approved, so the job, the order's page and
  the approval e-mail keep the day the customer was told. Each further change
  adds one more; erasing the customer's data keeps them.
- **Proofs are named by their order and number** ("MP-4129/1 #2", the second proof of the order's first job) wherever the
  dashboard links or opens one, and the New Proof form's job picker shows each
  job's order number with its product under it.

## 0.2.3 (10 November 2026)

Needs Adminium **0.3.52** and asks for the add-ons at **1.0.23**. Updating from
0.2.2, Adminium lists what the roles now hold more of the Customiser (the
owner changes its settings, prepress and the press read them) and updates once
the operator allows it (`roleTables`).

- **Every proof is e-mailed, not only an order's first.** A proof sent after a
  change asked, or sent again, now e-mails the customer its "proof ready" too,
  as the toast and the order's page promised. Each change a customer asks
  reaches the works' own address too, not only the first on an order. The
  e-mails are written in the language the order was placed in, as before.
- **Each job's approval is e-mailed.** An order with two jobs tells the
  customer "we're printing" for each, listing the jobs approved so far, not
  only for the first.
- **A proof with no PDF is never e-mailed.** A proof added on the dashboard
  without its PDF waits until it is given one, and is e-mailed then. The
  customer's order page no longer says such a proof, or the design, is "no
  longer kept": that is said only of a PDF erased with the customer's data.
  Proofs made before this release all came with their PDF, and still read as
  no longer kept once their customer is erased.
- **The ticket's proof history keeps the customer's change** once the next
  proof has replaced the one they answered, and says a replaced proof was
  replaced ("Proof 1 sent, since replaced").
- **Prepress, the press and the counter no longer ask Adminium for what their
  role does not read** (Holiday calendars' public holidays, and for the counter
  a design's versions), so their screens make no refused reads in the
  background. Prepress and the press no longer ask for the list of add-ons.
- **The counter books DHL's collection.** Its screens ask which add-ons the
  print shop has, which Adminium tells a screens-only role from 0.3.52, so
  "Book a collection" and DHL's shipments reach the counter too.
- **Prepress and the press read the Customiser's settings**, so a proof they
  make draws a one-colour picture to the shop's own line, as the shopper saw it.
- **The owner changes the Customiser's shop settings** (the bleed and safe
  area, the one-colour line, the thinnest line and the least resolution) on the
  set-up page's Shop settings (add-ons 1.0.23).
- **With the Maker Shop on the same install, the owner sees and changes only the
  print shop's own Customiser set-up.** A row the owner adds is the print
  shop's; another shop's bases, areas, pieces, ready-made designs and their
  parts, fonts, palettes, colours and priced features are not there to them.
  The starter fonts belong to no shop: the owner reads them and gives them their
  files, and never removes one; a font the owner adds is never a starter, and
  no font changes whether it is one. Likewise the owner, prepress, the press
  and the counter reach only the print shop's own customers' designs, and a
  design's versions and print files only the print shop's; a version they add
  is the print shop's.
- The shopper's editor is the Customiser 1.0.23's. The Customiser's `appGrants`
  are vendored with it
  (`vendor/customiser/app-grants.json`), and every role's hold on its tables is
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
