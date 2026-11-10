# Print Shop releases

## 0.2.5 (not released yet)

Corrects what 0.2.4 said of its update: "the update gives the jobs already
there their place in their order" was not so. The update named the proofs of
the jobs the shop had placed, but a job added on the dashboard in 0.2.3 or
before kept no place: it read "MP-4129", and its proofs "MP-4129 #2".

- **Jobs added on the dashboard before 0.2.4 are given their place.** Updating
  from 0.2.3 or earlier with Adminium 0.3.54, each job with no place is given
  the next in its order, and it and its proofs are named by it ("MP-4129/2",
  "MP-4129/2 #1"). Needs Adminium 0.3.54: with 0.3.53 they keep none. A works
  already on 0.2.4 keeps its jobs as they are: the update numbers only a place
  it numbers for the first time, and a place once numbered cannot be typed.
- **Each job is named by its order and its place** ("MP-4129/1") on the
  dashboard: the Jobs list, a job's page, and every picker and link to a job,
  so two jobs of one order (two lots of business cards) never read the same.
  The New Proof form's job picker offers each by that name, its product under
  it.
- **The customer and the works are told which job a proof is of.** On an
  order of several jobs the customer's order page names each job ("MP-4129/2
  · Business cards") on its proof and on the answer given, and the proof's
  file is named after its job. The "proof ready" e-mail and the works' copy of
  a change asked name the proof they are about ("Proof: MP-4129/2 #1") and
  list each proof by its job.
- **Jobs in progress keep their ready-by at the update.** The update counts,
  for each job, every change asked of its proofs, those sent again since
  included, and the working days they add; it writes no ready-by. So a job
  whose change was asked of a proof since sent again (the sample's MP-4114)
  keeps the day it had, which left that change's day out; its next change
  asked sets the day again from then, and its approval counts from the
  approval, never earlier.
- **The sample says only what it holds.** Its proofs never had a PDF, and the
  customer's page no longer says they are "no longer kept". Harbour Bakery's
  card (MP-4112) shows the place for a logo rather than "their own logo": the
  sample brings no logo file.

## 0.2.4 (10 November 2026)

Needs Adminium **0.3.53** and asks for the add-ons at **1.0.25**. The update
gives the jobs already there their place in their order and names their proofs.

- **The Customiser's panel draws on the works' screens again.** With the
  Customiser 1.0.24 a job's panel on prepress and the press stayed on
  "Loading"; 1.0.25 draws it.
- **Two customised jobs in one order.** With the Customiser 1.0.24, an order
  that holds two jobs a customer designed is taken: each design's version is
  labelled by its design, where two were refused as the same.
- **A proof is made with its PDF.** A proof added on the dashboard without its
  PDF is refused, and the form asks for it: the proof it would have sent again
  stays the customer's to answer, and nothing is said to be sent before there
  is something to open. The works' screens always sent the PDF with the proof.
  The dashboard's form also marks the PDF as needed when an older proof
  without one is edited.
- **The ready-by never moves earlier than the day the customer was told.** A
  change asked adds a working day, and it stays when the next proof goes out.
  An approval counts the work from the approval, but never before that day,
  whether it comes the same day or days later; taking back days on the
  dashboard (a proof by post) leaves the day as it is too. The job, the
  order's page and the approval e-mail say the same day. Each further change
  adds one more, and erasing the customer's data keeps them. Needs Adminium
  0.3.53.
- **Proofs are named by their order, job and number** ("MP-4129/1 #2", the
  second proof of the order's first job) wherever the dashboard links or opens
  one, and the New Proof form's job picker offers only the chosen order's
  jobs, each by its order number with its product under it. A job added on
  the dashboard is given the next place in its order. Proofs already there are
  named by the update.
- **The ticket keeps a replaced proof's change asked** once the customer's
  words were erased with their data.
- **The screens import only the add-on code that fills their slots.** From
  Adminium 0.3.53 the add-ons list also names add-on pages and record panels,
  and their code is never taken for a slot's; the counter's dispatch screen
  draws DHL's "Book a collection", which 0.3.53 serves it.

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
