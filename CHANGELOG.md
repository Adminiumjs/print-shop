# Print Shop releases

## 0.2.2 (not released yet)

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
