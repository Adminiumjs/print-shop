/**
 * The one store. Zustand, no middleware, no persistence beyond the theme and
 * the locale — a demo that remembered a half-built basket across reloads would
 * be harder to review, not easier.
 *
 * The clock lives here as an OFFSET IN WORKING DAYS from the pinned moment,
 * never as a date. Everything downstream derives from `todayIso()`, so the
 * dock's "+1 working day" chip moves due chips, promise dates and the overdue
 * count together and cannot leave two views disagreeing about what day it is.
 */

import { create } from "zustand";

import type { AddOn, AddOnSettings } from "../add-ons/host.ts";
import { applyAddOnSettings, createRegistry, type AddOnRegistry } from "../add-ons/host.ts";
import { DEFAULT_ADD_ON_SETTINGS } from "../add-ons/registry.ts";
import { source } from "../data/source.ts";
import type { ArtworkRecord, Customer, Now, SavedQuote } from "../data/types.ts";
import { PRODUCT_BY_KEY, type ProductKey } from "../lib/catalogue.ts";
import type { ArtworkFile } from "../lib/quote.ts";
import {
  columnFor,
  moveJob,
  recordSpoilage,
  type BoardColumn,
  type Job,
} from "../lib/jobs.ts";
import { addWorkingDays, priceQuote, type Configuration } from "../lib/quote.ts";
import type { StockRow } from "../lib/jobs.ts";

export type Persona = "customer" | "shop";

/**
 * ── THE VIEW LISTS ARE THE SOURCE, AND THE TYPES COME OFF THEM ──────────────
 *
 * These used to be two hand-written unions with a separate `CUSTOMER_VIEWS`
 * array further down repeating the first one. A suite that wants to visit EVERY
 * view — `a11y.test.tsx` and `i18n/numerals.arabic.test.tsx` both do — could
 * then only be handed a third copy, and a third copy goes stale the day
 * somebody adds a screen. The array is the fact now and the union is derived
 * from it, so a new view is covered without anybody remembering.
 */
export const CUSTOMER_VIEWS = [
  "products",
  "configure",
  "artwork",
  "basket",
  "confirm",
  "order",
  "findus",
  "reorder",
  "samples",
  "templates",
  "proofs",
  "saved",
  "delivery",
] as const;

export type CustomerView = (typeof CUSTOMER_VIEWS)[number];

export const SHOP_VIEWS = [
  "today",
  "ticket",
  "jobs",
  "materials",
  "prices",
  "addons",
] as const;

export type ShopView = (typeof SHOP_VIEWS)[number];

export type View = CustomerView | ShopView | "404";

/** Every view the app can show, the 404 included. */
export const ALL_VIEWS: readonly View[] = [...CUSTOMER_VIEWS, ...SHOP_VIEWS, "404"];

export interface BasketLine {
  id: string;
  config: Configuration;
  /**
   * Set once artwork has been supplied for this line.
   *
   * `source` is the key of the add-on that produced it, absent for a plain
   * upload. The order line renders it — "Design Studio" beside the filename —
   * so a customer who used two sources can tell which design went on which
   * line, and so the works ticket does not have to guess.
   */
  artwork?: { filename: string; source?: string };
}

/**
 * A delivery option an add-on quoted and the customer chose.
 *
 * NEUTRAL BY CONSTRUCTION. There is no carrier in this shape, no service code
 * the host understands and no tracking: it is a label, a price and a date, all
 * of them the add-on's own — the label arrives already translated because the
 * words for a delivery service belong to whoever sells it. Swapping the
 * delivery company changes nothing here, which is the same claim `AddOn` makes
 * one directory over.
 */
export interface DeliveryChoice {
  /** The add-on that quoted it, for the summary's "quoted by" line. */
  addOn: string;
  /** The add-on's own service code. Opaque here; it is how the fill re-selects. */
  code: string;
  /** Already in the reader's language — the add-on renders its own names. */
  label: string;
  amount: number;
  currency: string;
  /** ISO date the add-on estimated. */
  estimatedDelivery: string;
}

/**
 * How the whole basket is getting to the customer, DERIVED FROM THE LINES.
 *
 * ONE DECISION, ONE PLACE, and the place is `config.delivery` on each line —
 * the field the quote engine already prices from. The checkout used to hold a
 * local `useState` for "standard or collect" that nothing read, beside a slot
 * whose carrier rows kept their own selection that nothing read either: two
 * dead controls that looked live, and a third truth in the engine that
 * disagreed with both.
 *
 * `deliveryChoice` holds the ONE thing the lines cannot: which add-on quoted
 * the carriage and what it costs. When it is set the built-in choice is
 * unselected, because a customer cannot have picked two ways of getting one
 * parcel — and choosing a built-in option clears it again.
 */
export function worksBandFor(basket: readonly BasketLine[]): "standard" | "collect" {
  return basket.every((line) => line.config.delivery === "collection") ? "collect" : "standard";
}

export interface Toast {
  id: number;
  message: string;
  tone: "neutral" | "pos" | "warn";
}

/** Which overlay is open. Exactly one at a time — Escape closes the top one. */
export type Overlay =
  | { kind: "none" }
  | { kind: "quote-sheet" }
  | { kind: "finish-reason"; finish: string; reason: string }
  | { kind: "proof-sheet"; ref: string }
  | { kind: "spoilage"; ref: string }
  | { kind: "nav" }
  | { kind: "connect"; addOn: string }
  | { kind: "consent"; addOn: string }
  | { kind: "manage"; addOn: string }
  | { kind: "disconnect"; addOn: string };

interface State {
  // chrome
  persona: Persona;
  view: View;
  theme: "light" | "dark" | null;
  overlay: Overlay;
  toasts: Toast[];
  loading: boolean;

  // the pinned clock, plus however many working days the dock has advanced
  now: Now;
  dayOffset: number;

  // data
  jobs: Job[];
  pastJobs: Job[];
  savedQuotes: SavedQuote[];
  customers: Customer[];
  stock: StockRow[];
  artwork: ArtworkRecord[];

  // customer flow
  config: Configuration | null;
  basket: BasketLine[];
  /** Set only when an add-on quoted the carriage. Null means the works is. */
  deliveryChoice: DeliveryChoice | null;
  artworkAccepted: string[];
  details: { name: string; email: string };
  lookup: { ref: string; email: string };
  lookupResult: { kind: "job"; ref: string } | { kind: "quote"; ref: string } | { kind: "none" } | null;
  placedRef: string | null;
  sampleSelection: string[];

  // works flow
  searchQuery: string;
  ticketRef: string | null;
  boardMenu: string | null;
  dragging: string | null;
  /** Why the last board move was refused, for the toast. Cleared on success. */
  lastRefusal: string | null;

  // add-ons
  registry: AddOnRegistry;
  enabled: Set<string>;
  addOnCategory: string;
  addOnSettings: AddOnSettings;
  /**
   * Which OAuth add-ons have been through their consent panel.
   *
   * Separate from `enabled` because the two are genuinely different facts: an
   * authorization is a credential, and connecting is a decision. The consent
   * panel grants the first, the connect dialog's button makes the second, and
   * disconnecting revokes the credential while keeping the data (24 D16) —
   * which is exactly why this set is cleared there and `basket` is not.
   */
  authorizedAddOns: Set<string>;
  /**
   * Artwork an add-on produced, waiting on the artwork screen.
   *
   * The HOST checks it — `checkArtwork()` runs here exactly as it does on an
   * upload — so neither artwork add-on marks its own homework (24 §5.5). It is
   * cleared when the add-on that made it is switched off, because a design
   * sitting on a screen whose source no longer exists is precisely the leftover
   * D6 forbids.
   */
  suppliedArtwork: { source: string; file: ArtworkFile } | null;
}

interface Actions {
  todayIso: () => string;
  go: (view: View) => void;
  setPersona: (p: Persona) => void;
  setTheme: (t: "light" | "dark") => void;
  openOverlay: (o: Overlay) => void;
  closeOverlay: () => void;
  toast: (message: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: number) => void;

  advanceDay: () => void;
  resetDay: () => void;

  startConfigure: (product: ProductKey) => void;
  patchConfig: (patch: Partial<Configuration>) => void;
  addToBasket: () => void;
  removeLine: (id: string) => void;
  editLine: (id: string) => void;
  /** `addOnKey` names the add-on that made the artwork; absent for an upload. */
  attachArtwork: (filename: string, addOnKey?: string) => void;
  chooseWorksDelivery: (band: "standard" | "collect") => void;
  chooseAddOnDelivery: (choice: DeliveryChoice) => void;
  acceptWarning: (filename: string) => void;
  setDetails: (patch: Partial<{ name: string; email: string }>) => void;
  placeOrder: () => void;
  saveQuote: () => void;
  setLookup: (patch: Partial<{ ref: string; email: string }>) => void;
  doLookup: () => void;
  approveProof: (ref: string) => void;
  askChange: (ref: string, note: string) => void;
  toggleSample: (key: string) => void;

  setSearchQuery: (q: string) => void;
  openTicket: (ref: string) => void;
  setBoardMenu: (ref: string | null) => void;
  setDragging: (ref: string | null) => void;
  moveTo: (ref: string, column: BoardColumn) => void;
  sendProof: (ref: string, note: string) => void;
  addSpoilage: (ref: string, sheets: number) => void;
  markCollected: (ref: string) => void;

  /**
   * Install a registry, seed defaults, and optionally say what is ENABLED.
   *
   * `enable` exists because connected mode has no separate switching-on step:
   * an operator already decided in Studio what is installed and on, and asking
   * them to flip it again in the shop would be a second source of truth for one
   * fact. It rides in the same `set` as the registry — a loop over
   * `connectAddOn` would have worked and would also have closed whatever dialog
   * was open, N times, at whatever moment the async load happened to land.
   */
  registerAddOns: (addOns: readonly AddOn[], options?: { enable?: readonly string[] }) => void;
  toggleAddOn: (key: string) => void;
  connectAddOn: (key: string) => void;
  disconnectAddOn: (key: string) => void;
  authorizeAddOn: (key: string) => void;
  setAddOnCategory: (category: string) => void;
  /**
   * `Record<string, unknown>` and not a typed patch: the host holds an add-on's
   * settings and never reads inside one. The add-on's own settings panel is
   * what calls this, with its own machine keys.
   */
  patchAddOnSettings: (addOn: string, patch: Record<string, unknown>) => void;
  supplyArtwork: (file: ArtworkFile, addOnKey: string) => void;
  clearSuppliedArtwork: () => void;
}

function defaultConfig(product: ProductKey): Configuration {
  const p = PRODUCT_BY_KEY[product];
  const size = p.sizes[0]!;
  return {
    product,
    material: p.materials[0]!,
    size,
    ...(size === "custom" ? { customWidthMm: 800, customHeightMm: 2000 } : {}),
    sides: p.sidesChoice ? 2 : 1,
    finish: p.finishes[0]!,
    quantity: p.fromQuantity,
    packaging: p.packaging[0]!,
    printedProof: false,
    express: false,
    delivery: "collection",
  };
}

let toastSeq = 0;
let lineSeq = 0;

export const useStore = create<State & Actions>((set, get) => ({
  persona: "customer",
  view: "products",
  theme: null,
  overlay: { kind: "none" },
  toasts: [],
  loading: false,

  now: source.now(),
  dayOffset: 0,

  jobs: source.jobs(),
  pastJobs: source.pastJobs(),
  savedQuotes: source.savedQuotes(),
  customers: source.customers(),
  stock: source.stock(),
  artwork: source.artwork(),

  config: null,
  basket: [],
  deliveryChoice: null,
  artworkAccepted: [],
  details: { name: "", email: "" },
  lookup: { ref: "", email: "" },
  lookupResult: null,
  placedRef: null,
  sampleSelection: [],

  searchQuery: "",
  ticketRef: null,
  boardMenu: null,
  dragging: null,
  lastRefusal: null,

  registry: createRegistry([]),
  enabled: new Set<string>(),
  addOnCategory: "all",
  addOnSettings: DEFAULT_ADD_ON_SETTINGS,
  authorizedAddOns: new Set<string>(),
  suppliedArtwork: null,

  // ── clock ────────────────────────────────────────────────────────────────

  todayIso: () => {
    const { now, dayOffset } = get();
    return dayOffset === 0 ? now.iso : addWorkingDays(now.iso, dayOffset);
  },

  advanceDay: () => {
    set((s) => ({ dayOffset: s.dayOffset + 1 }));
  },

  resetDay: () => set({ dayOffset: 0 }),

  // ── chrome ───────────────────────────────────────────────────────────────

  /**
   * Switching views scrolls back to the top. Opening a job ticket has to land
   * on its header, not halfway down the spec table where the board left the
   * scroll position.
   */
  go: (view) => {
    set({ view, overlay: { kind: "none" }, boardMenu: null, loading: true });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" });
      window.setTimeout(() => set({ loading: false }), 180);
    } else {
      set({ loading: false });
    }
  },

  setPersona: (persona) => {
    const view: View = persona === "customer" ? "products" : "today";
    set({ persona, view, overlay: { kind: "none" }, boardMenu: null });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "auto" });
  },

  setTheme: (theme) => set({ theme }),

  openOverlay: (overlay) => set({ overlay }),
  closeOverlay: () => set({ overlay: { kind: "none" } }),

  toast: (message, tone = "neutral") => {
    toastSeq += 1;
    const id = toastSeq;
    set((s) => ({ toasts: [...s.toasts, { id, message, tone }] }));
    if (typeof window !== "undefined") {
      window.setTimeout(() => get().dismissToast(id), 4200);
    }
  },

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  // ── the customer's flow ──────────────────────────────────────────────────

  startConfigure: (product) => {
    set({ config: defaultConfig(product) });
    get().go("configure");
  },

  /**
   * Every choice narrows the next. When a material changes, a finish that the
   * new material cannot take is replaced with one it can — but ONLY when the
   * old choice has actually become impossible, so a customer never loses a
   * selection that was still valid.
   */
  patchConfig: (patch) => {
    const current = get().config;
    if (current === null) return;
    const next = { ...current, ...patch };
    const product = PRODUCT_BY_KEY[next.product];

    if (!product.materials.includes(next.material)) next.material = product.materials[0]!;
    if (!product.sizes.includes(next.size)) next.size = product.sizes[0]!;
    if (!product.finishes.includes(next.finish)) next.finish = product.finishes[0]!;
    if (!product.packaging.includes(next.packaging)) next.packaging = product.packaging[0]!;
    if (!product.sidesChoice) next.sides = 1;

    set({ config: next });
  },

  addToBasket: () => {
    const { config, basket } = get();
    if (config === null) return;
    lineSeq += 1;
    set({ basket: [...basket, { id: `line-${lineSeq}`, config: { ...config } }] });
    get().go("artwork");
  },

  removeLine: (id) => set((s) => ({ basket: s.basket.filter((l) => l.id !== id) })),

  editLine: (id) => {
    const line = get().basket.find((l) => l.id === id);
    if (line === undefined) return;
    set({ config: { ...line.config }, basket: get().basket.filter((l) => l.id !== id) });
    get().go("configure");
  },

  /**
   * Both delivery decisions, and the arithmetic they share.
   *
   * `config.delivery` is the ENGINE's field and it takes two meaningful values:
   * `collection` (the works charges nothing) or a band key, which the engine
   * then recomputes from the finished weight — so `band-2kg` here means "the
   * works is delivering it", exactly as the configurator's own chip means it.
   *
   * Choosing a carrier sets every line to `collection`, because the works is
   * not delivering it and charging its own band beside a carrier's quote would
   * bill the same parcel twice. The carrier's amount is added to the total in
   * the summary instead, where it says whose it is.
   */
  chooseWorksDelivery: (band) =>
    set((s) => ({
      deliveryChoice: null,
      basket: s.basket.map((line) => ({
        ...line,
        config: { ...line.config, delivery: band === "collect" ? "collection" : "band-2kg" },
      })),
    })),

  chooseAddOnDelivery: (choice) =>
    set((s) => ({
      deliveryChoice: choice,
      basket: s.basket.map((line) => ({
        ...line,
        config: { ...line.config, delivery: "collection" },
      })),
    })),

  attachArtwork: (filename, addOnKey) => {
    set((s) => {
      const basket = [...s.basket];
      const last = basket[basket.length - 1];
      if (last !== undefined) {
        basket[basket.length - 1] = {
          ...last,
          artwork: { filename, ...(addOnKey !== undefined ? { source: addOnKey } : {}) },
        };
      }
      return { basket };
    });
  },

  acceptWarning: (filename) =>
    set((s) => ({
      artworkAccepted: s.artworkAccepted.includes(filename)
        ? s.artworkAccepted
        : [...s.artworkAccepted, filename],
    })),

  setDetails: (patch) => set((s) => ({ details: { ...s.details, ...patch } })),

  placeOrder: () => {
    const ref = source.nextRef();
    set({
      placedRef: ref,
      basket: [],
      config: null,
      // The quote belonged to the basket that has just gone.
      deliveryChoice: null,
    });
    get().go("confirm");
  },

  saveQuote: () => {
    const { config, savedQuotes } = get();
    if (config === null) return;
    const ref = `MP-${4111 + savedQuotes.length}`;
    set({
      savedQuotes: [
        ...savedQuotes,
        { ref, config: { ...config }, savedOn: get().todayIso(), customerKey: "harbour" },
      ],
    });
  },

  setLookup: (patch) => set((s) => ({ lookup: { ...s.lookup, ...patch } })),

  doLookup: () => {
    const { lookup, jobs, pastJobs, savedQuotes } = get();
    const ref = lookup.ref.trim().toUpperCase();
    const job = [...jobs, ...pastJobs].find((j) => j.ref === ref);
    if (job !== undefined) {
      set({ lookupResult: { kind: "job", ref: job.ref } });
      return;
    }
    const quote = savedQuotes.find((q) => q.ref === ref);
    set({ lookupResult: quote !== undefined ? { kind: "quote", ref: quote.ref } : { kind: "none" } });
  },

  approveProof: (ref) => {
    const today = get().todayIso();
    set((s) => ({
      jobs: s.jobs.map((j) =>
        j.ref === ref
          ? { ...j, stage: "approved", proofs: [...j.proofs, { kind: "approved", at: today }] }
          : j,
      ),
    }));
  },

  askChange: (ref, note) => {
    const today = get().todayIso();
    set((s) => ({
      jobs: s.jobs.map((j) =>
        j.ref === ref
          ? {
              ...j,
              // A change costs a working day, and the promise moves with it.
              promisedFor: addWorkingDays(j.promisedFor, 1),
              proofs: [...j.proofs, { kind: "change-asked", at: today, note }],
            }
          : j,
      ),
    }));
  },

  toggleSample: (key) =>
    set((s) => ({
      sampleSelection: s.sampleSelection.includes(key)
        ? s.sampleSelection.filter((k) => k !== key)
        : [...s.sampleSelection, key],
    })),

  // ── the works' flow ──────────────────────────────────────────────────────

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  openTicket: (ref) => {
    set({ ticketRef: ref, searchQuery: "" });
    get().go("ticket");
  },

  setBoardMenu: (ref) => set({ boardMenu: ref }),
  setDragging: (ref) => set({ dragging: ref }),

  /**
   * The proof gate lives in `jobs.ts`; this only carries its verdict to the UI.
   * A refused move raises a toast NAMING what is missing — never a silent
   * bounce, which would leave the works guessing whether the app or their hand
   * was at fault.
   */
  moveTo: (ref, column) => {
    const job = get().jobs.find((j) => j.ref === ref);
    if (job === undefined) return;
    const result = moveJob(job, column);
    set({ boardMenu: null, dragging: null });
    if (!result.ok) {
      set({ lastRefusal: result.reason });
      return;
    }
    set((s) => ({
      lastRefusal: null,
      jobs: s.jobs.map((j) => (j.ref === ref ? { ...j, stage: result.stage } : j)),
    }));
  },

  sendProof: (ref, note) => {
    const today = get().todayIso();
    set((s) => ({
      jobs: s.jobs.map((j) =>
        j.ref === ref
          ? {
              ...j,
              stage: columnFor(j.stage) === "prepress" ? "proofed" : j.stage,
              proofs: [...j.proofs, { kind: "sent", at: today, ...(note ? { note } : {}) }],
            }
          : j,
      ),
      overlay: { kind: "none" },
    }));
  },

  addSpoilage: (ref, sheets) =>
    set((s) => ({
      jobs: s.jobs.map((j) => (j.ref === ref ? recordSpoilage(j, sheets) : j)),
      overlay: { kind: "none" },
    })),

  markCollected: (ref) => {
    const today = get().todayIso();
    set((s) => ({
      jobs: s.jobs.map((j) =>
        j.ref === ref ? { ...j, stage: "collected", dispatch: { kind: "collected", at: today } } : j,
      ),
    }));
  },

  // ── add-ons ──────────────────────────────────────────────────────────────

  registerAddOns: (addOns, options) => {
    /*
     * SEED DEFAULTS FOR ANYTHING THIS STORE HAS NOT MET (26-T13).
     *
     * `addOnSettings` starts as `DEFAULT_ADD_ON_SETTINGS`, which is computed at
     * module load from the three add-ons compiled into THIS bundle. In demo
     * mode that covers everything registered, so nothing below ever fires.
     *
     * In connected mode the list arrives from the server and none of it is in
     * that constant. `applyAddOnSettings` reads `settings[key] ?? {}`, so a
     * server-delivered add-on would be pushed an EMPTY document — not its own
     * `defaultSettings` — and the failure is a quiet one: a delivery add-on
     * whose demo switch defaults to on would come up off, and the panel that
     * should have drawn would render nothing at all. Which is indistinguishable
     * from a slot nobody filled.
     *
     * Seeded rather than overwritten: an add-on the operator has already
     * configured keeps what they set, and only keys this store has never seen
     * take a default.
     */
    const settings = { ...get().addOnSettings };
    for (const addOn of addOns) {
      /*
       * PER SETTING, not per add-on. An all-or-nothing test on the add-on KEY
       * looked right and was not, for two reasons that both bite in connected
       * mode:
       *
       *  - `addOnSettings` starts as `DEFAULT_ADD_ON_SETTINGS`, and that
       *    constant is `defaultSettingsFor(REGISTERED)` over the three add-ons
       *    VENDORED into this build. `registry.ts` is imported unconditionally
       *    by this module, so those three keys are already present in a HOSTED
       *    build too — which are exactly the three a real Adminium is most
       *    likely to deliver. The key test then skipped them and the vendored
       *    build's constants were pushed into the server-delivered object.
       *  - A newer version of an add-on that adds a setting would never get its
       *    default, because its key was already there.
       */
      const current = settings[addOn.key] ?? {};
      const merged: Record<string, unknown> = { ...(addOn.defaultSettings ?? {}) };
      // The operator's own values win over every default, which is the half
      // that was right the first time.
      for (const [key, value] of Object.entries(current)) merged[key] = value;
      settings[addOn.key] = merged;
    }
    set({
      registry: createRegistry(addOns),
      addOnSettings: settings,
      ...(options?.enable === undefined ? {} : { enabled: new Set(options.enable) }),
    });
    applyAddOnSettings(addOns, settings);
  },

  /**
   * The dock's toggles and the Add-ons screen's Connect/Disconnect buttons
   * drive THIS ONE SET, so the two controls can never disagree about what is
   * on. Turning one off removes its surfaces and leaves nothing behind.
   */
  toggleAddOn: (key) => {
    if (get().enabled.has(key)) get().disconnectAddOn(key);
    else get().connectAddOn(key);
  },

  connectAddOn: (key) =>
    set((s) => {
      const next = new Set(s.enabled);
      next.add(key);
      return { enabled: next, overlay: { kind: "none" } };
    }),

  /**
   * DISCONNECT REMOVES SURFACES, NEVER DATA (24 D16).
   *
   * What goes: the add-on's fills stop rendering, so its tiles, its rate rows
   * and its tracking panel are gone from the moment the set changes.
   *
   * What stays: everything the customer or the shop has made. A design that
   * reached an order is on that order, a booked shipment is still booked, and
   * the settings the shop chose are still here if it reconnects. The confirm
   * dialog says all of this in words before anything happens.
   *
   * ── THE DESIGN THAT USED TO GO WITH IT ──────────────────────────────────
   *
   * [Repaired 2026-08-11, wave 4b round 4.] This used to null `suppliedArtwork`
   * when its source was the add-on being disconnected, reasoned as "an artwork
   * item whose source no longer exists is a leftover". Driven live, that reads
   * differently: a customer makes a design in the editor, walks away from the
   * artwork screen and comes back to find it still there — then the shop toggles
   * the add-on off and on in the dock and the design is gone for good. It is not
   * a leftover. It is a finished file, produced, named and measured, and by the
   * time it is sitting on the artwork screen it is indistinguishable from one
   * the customer uploaded. D16 says a disconnect keeps the data and deletes the
   * credentials, and a customer's artwork is data by any reading of the word.
   *
   * Nothing on the screen needs the add-on to render it. `checkArtwork` never
   * knew where a file came from (§5.5), and `registry.byKey` answers for a
   * REGISTERED add-on whether or not it is enabled — registering and enabling
   * being different things is the whole of D6 — so "From Design Studio" and the
   * unmeasured-checks note still resolve, and still say something true about
   * where the file came from.
   *
   * The DELIVERY QUOTE below is the genuine leftover and stays deleted, and the
   * difference is worth naming: a rate row is a PRICE A DISCONNECTED COMPANY
   * QUOTED, still sitting on a basket nobody has paid for. It is not a thing the
   * customer made; it is a promise the shop can no longer keep.
   */
  disconnectAddOn: (key) =>
    set((s) => {
      const next = new Set(s.enabled);
      next.delete(key);
      const authorizedAddOns = new Set(s.authorizedAddOns);
      authorizedAddOns.delete(key);
      /*
       * A delivery option this add-on quoted is a surface too — it is on the
       * summary of a basket the customer has not paid for yet, priced by a
       * company that is no longer connected. The lines go back to COLLECTION,
       * which is where a works with no carrier connected always was: it is the
       * app's own default, it is what the order view's empty dispatch panel
       * promises, and D6 asks for exactly the base state rather than a
       * plausible neighbouring one.
       */
      const droppedQuote = s.deliveryChoice?.addOn === key;

      return {
        enabled: next,
        authorizedAddOns,
        overlay: { kind: "none" },
        ...(droppedQuote
          ? {
              deliveryChoice: null,
              basket: s.basket.map((line) => ({
                ...line,
                config: { ...line.config, delivery: "collection" as const },
              })),
            }
          : {}),
      };
    }),

  authorizeAddOn: (key) =>
    set((s) => {
      const authorizedAddOns = new Set(s.authorizedAddOns);
      authorizedAddOns.add(key);
      // Back to the connect dialog, which is where the shop still has to press
      // Connect. Authorizing an account and connecting an add-on are two
      // decisions and the flow keeps them two.
      return { authorizedAddOns, overlay: { kind: "connect", addOn: key } };
    }),

  setAddOnCategory: (addOnCategory) => set({ addOnCategory }),

  patchAddOnSettings: (addOn, patch) => {
    const addOnSettings = {
      ...get().addOnSettings,
      [addOn]: { ...(get().addOnSettings[addOn] ?? {}), ...patch },
    };
    set({ addOnSettings });
    // An add-on that keeps its own copy is PUSHED to, never left to poll: a
    // value read a second later must be the one the shop just chose.
    applyAddOnSettings(get().registry.all, addOnSettings);
  },

  supplyArtwork: (file, addOnKey) => set({ suppliedArtwork: { source: addOnKey, file } }),

  clearSuppliedArtwork: () => set({ suppliedArtwork: null }),
}));

/** Whether a view belongs to the customer's site or the works floor. */
export function personaFor(view: View): Persona {
  return (CUSTOMER_VIEWS as readonly string[]).includes(view) ? "customer" : "shop";
}

/** The live quote for whatever is currently in the configurator. */
export function useQuote() {
  const config = useStore((s) => s.config);
  return config === null ? null : priceQuote(config);
}
