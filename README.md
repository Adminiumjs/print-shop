# Print Shop

A print works, front and back, installed into [Adminium](https://adminium.dev).
Customers choose a product, its stock, size, sides and finishes, fill in a
ready-made design in the Customiser or send their own artwork, and see the price
at every quantity and the day it will be ready; the works proofs every job,
prints it and hands it over at the counter or sends it. Adminium decides every
price (the rate card, the quantity breaks, the sheets a run takes, the delivery
band), every ready-by date, order and quote number and status — the pages only
ask.

**Made it in Canva?** Download it as PDF Print and send the file: the artwork
step checks it (size, bleed, resolution, colour, fonts) before anybody prints
anything.

The demo is dressed as **Marlow Press**, a fictional print works on the market
square in Marlow. Its clock stands at **Wednesday 5 August 2026, 10:20** — before
the two o'clock cut-off — and the works prints Monday to Friday.

**Live demo → [adminium.dev/demo/print-shop](https://adminium.dev/demo/print-shop)**

## What it needs

- Adminium **0.3.54** or later, on SQLite, Postgres or MySQL.
- The **Customiser** add-on (1.0.26 or later): it is where a customer fills in a
  ready-made design or starts from blank, and the job names the design they
  made. Adminium installs it with the app.
- Nothing else. Four add-ons are offered at install, and the app is whole without
  any of them:
  - **DHL shipping** — book a collection for a delivery, with the service the
    customer chose already picked, print its label, and send the customer the
    tracking number. Without it, the "on its way" e-mail says the works' own
    courier took it and has no tracking number.
  - **Inventory** — the sheet stocks and rolls kept as stock, with what each job
    takes and spoils.
  - **Invoices & Receipts** — an invoice with each delivery, printed at the
    counter.
  - **Holiday calendars** — the coming bank holidays of England and Wales on the
    works' price list, each added as a closure in a tap, so no job is due on one.

## What it does

**For customers** (the app's customer side):
- The products and a product's configurator: its stocks, sizes, sides and
  finishes (a finish a stock cannot take is locked, with the reason), the price
  at each quantity step and what moves it, and the ready-by date, all worked out
  by Adminium before anything is placed.
- "Design it" opens the Customiser's editor on the page; "Send your artwork"
  uploads a PDF, TIFF or JPEG and shows its five checks, a warning accepted kept
  with the file.
- The basket and the checkout: one delivery for the whole order (by weight, a
  delivery band; over the bands the works prices it and e-mails a quote), or
  collection from the works. One write places the order, its jobs, their designs
  and artwork, checked against the total the customer saw.
- An e-mail with the order's own link; the order's page with each job's stages
  and its proofs, each answered there ("Approve" or "Ask for a change"); finding
  an order by its number and a code e-mailed to the customer; ordering again at
  today's prices; saved quotes (`MQ-…`); a sample pack of the stocks; templates
  and sizes; delivery and collection; find us; their designs.

**For the works** (the app's staff side): Today's board with the proof gate (a
job goes to press only once its proof is approved), the job ticket (the
imposition, the artwork and its checks, the Customiser's panel on a designed job
where its proof and print files are made, the proofs sent and answered,
spoilage, printed, ready, collected or dispatched; a proof sent again sends the
job's earlier one still out again, whether it is sent from the ticket or made in
the dashboard), the jobs, materials and
stock, the price list (the rate card edited in place, the closures, and the
public holidays to add as one), DHL's dispatch page and shipments, and the
add-ons; a sign-out in the header. Roles: **owner** (everything, the
Customiser's set-up page on the owner's own role, its starter fonts added on the
way in, and only the print shop's own set-up rows where the Maker Shop shares
the install (every role reaches only the print shop's customers' designs), Holiday calendars' closed days, and finding and erasing a customer's
data on the dashboard's privacy page), **prepress** (the artwork, the
proofs and the Customiser's panel, an approved job onto the press), **press**
(the press, the finishing, spoilage, the Customiser's panel) and **counter**
(handing over, a delivery quote, the sample packs).

**In the dashboard** (the Print Shop section): orders, jobs (the list opens on
the order, product, quantity, stage, proof and ready-by), proofs, artwork,
saved quotes, sample packs, the rate card (products, options, materials, sizes,
finishes, quantity breaks, packaging, delivery bands, the rules between options),
machines and closures, customers, the e-mails sent, and the works' settings.

**E-mails.** Order received, proof ready, proof approved, ready to collect, on
its way, quote saved, sample pack posted and the delivery quote of an order over
the bands go to the customer, in the language the order was placed in (eight
languages); a change asked to a proof and a new order whose customer accepted an
artwork warning are copied to the works' own address. All of them are service
mail: the do-not-email list never stops them and none has an unsubscribe line.
The sign-in code is Adminium's own e-mail; the saved design's is the
Customiser's.

## Installing it

Install Print Shop from Adminium's app catalog and pick the database it should
use. Adminium creates the app's tables (each named `printing_…`), installs the
Customiser, and makes the dashboard pages, the four roles, the shop's browser
keys and the e-mails. Tick sample data at the install step to start with Marlow
Press's Wednesday, or add it later from the app's settings.

Once installed, the works' screens are served at `/apps/printing/staff/` and the
shop at `/apps/printing/customer/`. A works can also give the shop a domain of
its own.

**Coming from 0.1.x?** The 0.1 Print Shop was an example with its own database,
and the Design studio and Import from Canva add-ons in place of the Customiser.
0.2 is a different app on new tables:

1. **Detach and remove Design studio and Import from Canva** from the app on its
   Add-ons page. Both are retired: the Customiser does what Design studio did,
   and a design made in Canva comes in as its PDF Print file.
2. **Then install Print Shop 0.2** on the same database. Its tables are all named
   `printing_…`, so the old `jobs`, `quotes`, `customers` and the rest stay
   exactly as they are, row for row, and nothing is carried over from them.
   Drop them yourself once you no longer need them.

## Local development

```bash
npm install
npm run dev        # the demo: the shop and the works on Marlow Press's sample, in the browser
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server on the in-browser demo. |
| `npm run dev:staff` | The dev server on the works' hosted side (it reads its session from the Adminium that serves it). |
| `npm run build` | Type-check and build to `dist/` (the demo). |
| `npm run build:demo` | Build the website's demo, at base `/demo/print-shop/app/`, with its `demo.json`. |
| `npm run build:surface` | Build the two sides Adminium serves (`dist-surface/printing/`). |
| `npm run manifest` | Write `manifest.json` from `src/manifest/`. A test fails when the two disagree. |
| `npm run manifest:check` | Validate `manifest.json` with the vendored validator. |
| `npm run sample` | Write the sample bundle (`seeds/`) from `src/sample/`. |
| `npm run templates` | Write the templates' PDFs (`public/templates/`) from the products' sizes. |
| `npm run sync:customiser` | Vendor the Customiser's editor from its release (`vendor/customiser/`); `-- --check` only compares. |
| `npm test` | Run the suite. |
| `npm run contract` | Run the contract against a built Adminium (`ADMINIUM_REPO`) and add-ons (`ADD_ONS_REPO`) checkout, on SQLite and, with `TEST_POSTGRES_URL` / `TEST_MYSQL_URL`, Postgres and MySQL. |

## Project structure

```
manifest.json  what Adminium installs (written from src/manifest/)
seeds/         the sample bundle, the app's rows and the Customiser's (written from src/sample/)
public/        the fonts, and the templates customers download
src/
  manifest/    the tables and their rules (the rate card and the price as
               calculated columns), the pages, the roles, the shop's doors,
               the e-mails in eight languages, the people, the add-ons
  shop/        the customer's side: its screens and its door (the public API)
  studio/      the works' side: its screens and its door (the staff session)
  add-ons/     the host the works mounts DHL's dispatch flow with
  demo/        the in-browser demo for the website's card (never in a hosted build)
  sample/      Marlow Press's Wednesday, which both the bundle and the demo are made from
  contract/    the contract with a built Adminium (`npm run contract`)
  i18n/        the 8-locale runtime and the keyed strings
  styles/      design tokens and base styles
  testing/     the product's manifest validator, vendored for the tests
vendor/        the Customiser's editor, as its release ships it
```

## License

[AGPL-3.0](LICENSE) © 2026 Print Shop. An example app for Adminium.

## Building on this app with a coding agent

The Adminium skills teach Claude Code, Codex and other agents to build and change an app:
`npx skills add Adminiumjs/skills` — https://github.com/Adminiumjs/skills
