# Print Shop

An open-source **print works, front and back** — an example app for
[Adminium](https://adminium.dev), and the host the wave's three demo add-ons
attach to. The demo shop is called **Marlow Press**.

A customer configures a job — product, material, size, sides, finish, quantity,
packaging, delivery — and watches the price and the ready-by date move as they
do, then sends artwork and gets it checked before anybody prints anything. The
works imposes that job onto SRA3 sheets, holds it behind an approved proof, runs
it, and hands it over the counter or to a carrier.

Everything on screen is fiction: the shop, its customers, its jobs and its rate
card are invented, and no real company appears anywhere.

## The two people it is for

The dock's segment switches between them, and they are genuinely different apps
sharing one bundle:

| Persona | What they do here |
|---|---|
| **Customer** | build a job, see the price break down line by line, save a quote, send artwork and read its verdicts, approve a proof, track an order |
| **Print shop** | today's board, a job ticket with the imposition and the proof gate, materials and spoilage, the rate card, the add-on shelf |

Out of the SPA on purpose (21 D4): full-table CRUD, bulk operations, imports,
role admin and analytics past a glanceable KPI. **The SPA quotes, takes and runs
jobs; the rate card itself is edited in the generated Adminium dashboard**, and
the Price list screen says exactly that.

## The clock is pinned

Nothing anywhere reads a real clock. Every date derives from **Wednesday
5 August 2026, 10:20** — `NOW` in `src/data/demo.ts` — which is what lets the
promise dates, the due chips and the overdue count be asserted in tests and
reproduced in a screenshot a year from now. `src/sources.test.ts` fails the
build if a `Date.now()`, a `new Date()` or a `Math.random()` appears in a
shipped module.

The dock's **+1 working day** chip advances an OFFSET IN WORKING DAYS, never a
date, so every view moves together and two screens cannot disagree about what
day it is.

## The add-on slots

This app is designed **with the holes already in it** (24 D6). Five slots exist
whether or not a single add-on does, and four of them are visible surfaces with
a real empty state:

| Slot | Where | With nothing filling it |
|---|---|---|
| `artwork.sources` | the artwork screen | **speaks** — "More ways to send artwork / Nothing else is connected yet." |
| `checkout.delivery.methods` | the basket | **speaks** — "No delivery companies are connected / Carrier options with their own prices and days would show here." |
| `order.dispatch.panel` | the customer's order view | **speaks** — "Collection from the works — we'll text you when it's ready." |
| `order.dispatch.actions` | the works' job ticket | **silent** — "Mark collected" stands alone |
| `settings.add-on.panel` | the manage drawer | silent by nature; each add-on renders its own settings form here |

The one asymmetry is deliberate: **where an empty slot has something to explain
to a customer it says it in words; where it has nothing to explain it renders
nothing.** A works with no carrier connected hands the job over the counter, and
a dashed "no carriers" panel on the shop floor would be noise nobody can act on.

An empty slot never renders as an error, a placeholder or an upsell, and an
add-on never edits app code. Switching every add-on off returns the app to
exactly its base state with no orphan button and no dead link —
`src/add-ons/addOns.test.ts` asserts it rather than leaving it to a screenshot.

`nav.add-on.routes` is in the closed slot registry and **this app does not host
it**: there is no router here — `src/app/App.tsx` switches views off one store
field — so a route slot would be a declaration nothing could mount.
`addOns.test.ts` asserts that every slot in `HOSTED_SLOTS` is mounted somewhere
in `src/`, in both directions.

## The three demo add-ons, and how they get here

The add-ons live in **one repository**, `add-ons`, each as a package with its
own manifest, tests and README:

| Key | Package | What it adds |
|---|---|---|
| `design-studio` | `add-ons/packages/design-studio` | a small in-browser artwork editor, on the artwork screen |
| `shipping-dhl` | `add-ons/packages/shipping-dhl` | carrier rates at checkout, a booking action on the ticket, tracking on the order |
| `import-canva` | `add-ons/packages/import-canva` | bring a design in from an outside design tool, with the bleed maths shown |

They were three separate repositories for exactly one day. Each carried its own
copy of the host contract — this app's `AddOn` interface — narrowed to the
members that add-on happened to use, and the three copies disagreed before
anyone had changed anything: 19 members, 18 and 18, with two the host declares
in none of them. Nothing failed, and nothing could have, because no suite
anywhere had two copies in front of it. There is **one** contract now,
`add-ons/packages/host`, and a suite in that repo reads *this* app's
`src/add-ons/host.ts` and fails when a member it declares is missing there.

There is no npm package tying that repo to this one, so **the client half of
each add-on is vendored** under `src/add-ons/vendor/<key>/`, byte-derived and
synced by **`scripts/sync-add-ons.sh`, which ships in this repo**. The shared
contract is vendored too, once, into `src/add-ons/vendor/host/`, and the copied
files' `@adminium/add-on-host` imports are rewritten onto it — so the vendored
tree compiles with nothing beside it, which is what a clean clone has.
`src/sources.test.ts` fails if a specifier survives that this app cannot
resolve, and if `AddOn` is ever declared under `vendor/` more than once.

Every vendored file carries a header saying where it came from. Clone the
monorepo beside this one as `../add-ons` (or point `ADD_ONS_DIR` at wherever it
lives) and the script compares every vendored byte with its source; with it
absent the script says so and exits clean, so a clone of this app alone still
builds and still tests.

> **The monorepo is the source of truth.** Never hand-edit a vendored copy —
> edit the package and re-run `npm run add-ons:sync`. A hand-edit here is
> invisible until it is a bug in two places at once.

The sync deliberately does **not** copy an add-on's tests, its conformance
harness or its **server half**: secrets are server-only (24 D15), and a module
that reads a credential must not be reachable from a browser bundle at all.
`src/sources.test.ts` and `src/builtOutput.test.ts` both fail if one appears.

Nothing in the demo makes a real third-party call (24 D11). Every add-on ships a
deterministic demo transport seeded from the pinned clock, and every simulated
result is labelled as such on screen.

`src/add-ons/registry.ts` is **the only production module outside `vendor/`
that names an add-on** — three import lines, and `src/sources.test.ts` fails if
a fourth mention appears anywhere else. (The test suites name them on purpose:
a suite that asserted the seam without naming what is on the far side of it
would be asserting nothing.) An add-on's settings, its defaults, the words on
its settings form, its eight-locale strings and its seeded activity all arrive
inside the object `register()` returns, so replacing the delivery company is one
import here and one package over there.

The four entries on the shelf that are **described but not built** live in
`src/add-ons/shelf.ts` and name **no company at all** — "a second delivery
company", "a card payment processor", "a mailing-list service". The shelf reads
honestly without this app printing the name of a firm it does not integrate
with.

## Running it

Node 20+.

```sh
npm ci
npm run dev            # http://localhost:5173
```

```sh
npm run build          # tsc -b && vite build
npm run build:demo     # the same, based at /demo/print-shop/
npm test               # vitest: engines, i18n, add-on seam, manifest, built output
```

The verification order this repo is held to is **`npx tsc -b && npx vitest run
&& npx vite build`**, and all three have to pass.

To re-sync the vendored add-ons after changing one of their packages:

```sh
npm run add-ons:status   # what is vendored, and whether it drifted from source
npm run add-ons:sync     # re-copy from ../add-ons (or $ADD_ONS_DIR)
```

### The full self-host stack

`docker-compose.yml` brings up the app, Postgres and Caddy. Copy `.env.example`
to `.env` and set `ADMINIUM_SECRET` first. Demo rows load on first boot unless
`DEMO_DATA=0`, and you can change your mind later:

```sh
npm run demo:status    # what is loaded
npm run demo:import    # load the demo rows
npm run demo:wipe      # remove them — your own rows and the schema stay
npm run demo:reset     # wipe, then import
```

## The manifest

`manifest.json` is the marketplace's document about this app: `kind: "app"`, key
`printing`, publisher `adminium`, the tables it needs, the dashboard pages it
installs, and the four capabilities it declares (`payments`, `file-storage`,
`email-delivery`, `realtime`). `src/manifest.test.ts` puts it through the real
validator and checks the job machine it declares still matches `src/lib/jobs.ts`.

## Eight languages

`en-US`, `de-DE`, `fr-FR`, `cs-CZ`, `da-DK`, `zh-CN`, `zh-TW`, `ar-EG` — Arabic
right-to-left with no separate stylesheet, because every rule in this repo uses
CSS logical properties and a test enforces it. An add-on registers its own
strings in all eight; a bundle that is short a locale or a key throws at boot
rather than rendering a raw dotted key at one reader.

## Licence

AGPL-3.0-only. See `LICENSE`.
