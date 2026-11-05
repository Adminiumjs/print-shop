/**
 * What the demo card's screens and shortcuts do (the comp `I - Marlow Press`,
 * `card()` 1895-1925): each one is what a person would do on the page (set up
 * a job, drop a file, type into a form, open the link in an e-mail), or what
 * would happen in the world meanwhile (a stock's price goes up, a customer
 * answers a proof), never a state the screens could not reach themselves.
 *
 * DEMO BUILD ONLY — nothing in a real build imports it.
 */
import { followAnother, openOrderLink, resetAfter, typeLookup, typeSamples, useAfter } from "../shop/after.ts";
import { firstChoice } from "../shop/config.ts";
import type { Id } from "../shop/port.ts";
import { addFiles, addJobForArtwork, addLinesToBasket, choose, chooseDelivery, goView, loadShop, openArtwork, openProduct, productOf, requoteBasket, resetShop, setDetails, useShop, type ShopView } from "../shop/store.ts";
import { reload } from "../studio/env.tsx";
import { go, toast as worksToast, useWorks, type View } from "../studio/store.ts";
import { cardWord } from "./card.ts";
import { demoAdminium, renewDemo, useDemo, type Persona } from "./adminium.ts";

/** Harbour Bakery, the customer the comp's shortcuts fill in, as the sample keeps them. */
const HARBOUR = { name: "Harbour Bakery", email: "hello@harbourbakery.example", line1: "12 Quay Street", line2: "", town: "Marlow", postcode: "SL7 1BT" };

const locale = (): string => document.documentElement.lang || "en-US";

/** The works' screen state as a new page has it, kept for "Back to Wednesday morning". */
const WORKS_START = { ...useWorks.getState() };
const demo = () => demoAdminium();

/** Wait, a little at a time and not for ever, until the page's answer is in. */
async function until(done: () => boolean, tries = 60): Promise<void> {
  for (let i = 0; i < tries && !done(); i += 1) await new Promise((resolve) => setTimeout(resolve, 50));
}

/** A product's own option, by its kind and code. */
function optionId(product: string, kind: string, code: string): Id | null {
  const s = useShop.getState();
  const p = productOf(product);
  return s.catalogue?.options.find((o) => p !== null && String(o.productId) === String(p.id) && o.kind === kind && o.code === code)?.id ?? null;
}

// ── the screens ─────────────────────────────────────────────────────────────

/** The card's customer screens, by the shop's own view. */
const SHOP_SCREENS: Record<string, ShopView> = {
  products: "products",
  config: "product",
  artwork: "artwork",
  basket: "basket",
  confirm: "confirmed",
  order: "order",
  reorder: "reorder",
  samples: "samples",
  templates: "templates",
  proof: "proofs",
  saved: "quotes",
  delivery: "delivery",
  findus: "findUs",
  missing: "missing",
};

/** The card's shop screens, by the works' own view. */
const WORKS_SCREENS: Record<string, View> = {
  today: "today",
  ticket: "ticket",
  jobs: "jobs",
  materials: "materials",
  prices: "prices",
  "shop-missing": "notfound",
};

export const SCREEN_IDS = [...Object.keys(SHOP_SCREENS), ...Object.keys(WORKS_SCREENS)];

/** Switch who is using it; the works reads its rows again as it opens. */
export async function setPersona(persona: Persona): Promise<void> {
  if (useDemo.getState().persona === persona) return;
  useDemo.setState({ persona });
  if (persona === "shop") await reload(demo().works);
  // The shop's screens read the address as they open: a screen the card asks for is opened after them, not under them.
  else await new Promise((resolve) => setTimeout(resolve, 60));
}

/** The job the ticket opens when the card asks for it: the one on the board with a proof to send, else the first. */
function ticketJob(): Id | null {
  const data = useWorks.getState().data;
  if (data === null) return null;
  const waiting = data.jobs.find((j) => j["stage"] === "prepress" && j["proof_state"] === null) ?? data.jobs.find((j) => j["stage"] === "prepress") ?? data.jobs[0];
  return waiting?.id ?? null;
}

/** A job set up on its product's page, priced there: the customer's own way to the configurator and the artwork. */
async function ready(): Promise<void> {
  if (useShop.getState().catalogue === null) await loadShop();
}

export async function goScreen(id: string): Promise<void> {
  const shopView = SHOP_SCREENS[id];
  if (shopView !== undefined) {
    await setPersona("customer");
    await ready();
    const s = useShop.getState();
    if (shopView === "product") openProduct(s.productCode ?? "business-cards");
    else if (shopView === "artwork") {
      if (s.artLine !== null) openArtwork(s.artLine);
      else {
        openProduct(s.productCode ?? "business-cards");
        addJobForArtwork();
      }
    } else if (shopView === "confirmed") goView(s.confirmed === null ? "basket" : "confirmed");
    else goView(shopView);
    return;
  }
  const worksView = WORKS_SCREENS[id];
  if (worksView !== undefined) {
    await setPersona("shop");
    if (worksView === "ticket") {
      if (useWorks.getState().data === null) await reload(demo().works);
      go("ticket", { jobId: useWorks.getState().jobId ?? ticketJob() });
    } else go(worksView);
  }
}

/** Where the page is, as the card names its screens. */
export function currentScreen(): string {
  if (useDemo.getState().persona === "shop") {
    const view = useWorks.getState().view;
    return Object.entries(WORKS_SCREENS).find(([, v]) => v === view)?.[0] ?? "shop-missing";
  }
  const view = useShop.getState().view;
  if (view === "design" || view === "blank") return "config";
  return Object.entries(SHOP_SCREENS).find(([, v]) => v === view)?.[0] ?? "missing";
}

// ── the files the artwork shortcuts drop ─────────────────────────────────────

/** A PDF for 85 × 55 mm cards with 3 mm bleed, both sides: in CMYK with its fonts in it, or in RGB (one warning to accept). */
function cardsPdf(name: string, colour: "DeviceCMYK" | "DeviceRGB"): File {
  const pt = (mm: number) => ((mm * 72) / 25.4).toFixed(2);
  const page = `<< /Type /Page /MediaBox [0 0 ${pt(91)} ${pt(61)}] >>\n`;
  return new File([`%PDF-1.4\n${page}${page}/ColorSpace /${colour}\n<< /Type /Font /FontFile2 3 0 R >>\n%%EOF\n`], name, { type: "application/pdf" });
}

/** A file the browser says is over the works' 100 MB, without holding 100 MB in the page. */
function bigFile(): File {
  const file = new File(["%PDF-1.4\n%%EOF\n"], "harbour-poster-final.pdf", { type: "application/pdf" });
  Object.defineProperty(file, "size", { value: 140 * 1024 * 1024 });
  return file;
}

/** The artwork screen for a job, opened for business cards when there is none yet. */
async function artworkFor(): Promise<void> {
  await ready();
  const s = useShop.getState();
  if (s.view === "artwork" && s.artLine !== null) return;
  openProduct("business-cards");
  addJobForArtwork();
}

// ── the shortcuts ───────────────────────────────────────────────────────────

const SHORTCUTS: Record<string, () => Promise<void>> = {
  async cards() {
    await ready();
    openProduct("business-cards");
    choose({ qty: 500, sidesId: optionId("business-cards", "sides", "double"), laminationId: optionId("business-cards", "lamination", "lam-both"), look: "matt" });
  },
  async flyers() {
    await ready();
    openProduct("flyers");
    choose({ qty: 999 });
  },
  async stickers() {
    await ready();
    openProduct("stickers");
    choose({ qty: 100, materialId: optionId("stickers", "material", "vinyl"), sizeId: optionId("stickers", "size", "sq95") });
  },
  async "too-big"() {
    await ready();
    openProduct("pvc-banners");
    const banner = productOf("pvc-banners");
    choose({ width: (banner?.maxWidth ?? 5000) + 1000, height: banner?.maxHeight ?? 1500 });
  },
  async "file-good"() {
    await artworkFor();
    addFiles([cardsPdf("harbour-cards.pdf", "DeviceCMYK")]);
  },
  async "file-warn"() {
    await artworkFor();
    addFiles([cardsPdf("harbour-cards-rgb.pdf", "DeviceRGB")]);
  },
  async "file-big"() {
    await artworkFor();
    addFiles([bigFile()]);
  },
  async "file-type"() {
    await artworkFor();
    addFiles([new File(["Harbour Bakery cards"], "harbour-cards.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })]);
  },
  async "fill-harbour"() {
    await ready();
    goView("basket");
    setDetails({ ...HARBOUR });
  },
  async "price-up"() {
    await ready();
    const s = useShop.getState();
    const line = s.basket[0];
    const material = line === undefined ? null : s.catalogue?.options.find((o) => String(o.id) === String(line.choice.materialId))?.materialId;
    const w = demo().world;
    const row = material === null || material === undefined ? w.all("materials")[0] : w.get("materials", material);
    if (row === undefined) return;
    // The works raises a stock's rate by 5 % while the customer shops: Adminium's next answer is the new price.
    w.write(() => w.update("materials", row.id, { rate: (Number(row["rate"]) * 1.05).toFixed(3) }));
    await loadShop();
    requoteBasket();
  },
  async heavy() {
    await ready();
    const s = useShop.getState();
    const flyers = productOf("flyers");
    if (flyers === null || s.catalogue === null) return;
    addLinesToBasket([{ productId: flyers.id, choice: { ...firstChoice(s.catalogue, flyers), qty: 5000, sizeId: optionId("flyers", "size", "a4") ?? firstChoice(s.catalogue, flyers).sizeId }, design: null, features: [], artwork: [] }]);
    chooseDelivery("deliver");
    goView("basket");
  },
  async "fill-lookup"() {
    await ready();
    followAnother();
    goView("order");
    typeLookup({ ref: "MP-4113", email: HARBOUR.email });
  },
  async "fill-code"() {
    const email = useAfter.getState().lookup.email || HARBOUR.email;
    const code = demo().after.codeFor(email);
    if (code !== null) typeLookup({ digits: code });
  },
  async "proof-waiting"() {
    await ready();
    const order = demo().world.all("orders").find((o) => o["number"] === "MP-4121");
    goView("order");
    if (order !== undefined) await openOrderLink(String(order["link_token"]));
  },
  async "same-address"() {
    await ready();
    goView("samples");
    typeSamples({ name: HARBOUR.name, email: HARBOUR.email, line1: HARBOUR.line1, town: HARBOUR.town, postcode: HARBOUR.postcode });
  },
  async "proof-approved"() {
    const w = demo().world;
    const waiting = w.all("proofs").find((p) => p["state"] === "sent");
    if (waiting === undefined) {
      worksToast(cardWord(locale(), "toast.no-proof"), "info");
      return;
    }
    // The customer's yes, on their own page: the job may go to press, its ready-by dated from now.
    w.write(() => w.update("proofs", waiting.id, { state: "approved" }));
    await reload(demo().works);
    const order = w.get("orders", waiting["order_id"]);
    worksToast(cardWord(locale(), "toast.approved", { ref: String(order?.["number"] ?? "") }));
  },
  async "send-proof"() {
    if (useWorks.getState().data === null) await reload(demo().works);
    const job = useWorks.getState().jobId ?? ticketJob();
    if (job === null) return;
    go("ticket", { jobId: job });
    useWorks.setState({ overlay: { kind: "proof", jobId: job } });
  },
};

export const SHORTCUT_IDS = Object.keys(SHORTCUTS);

export async function runShortcut(id: string): Promise<void> {
  const run = SHORTCUTS[id];
  if (run === undefined) return;
  await run();
  await until(() => useShop.getState().loading !== "loading");
}

/** The card's clock: a working day on, or past the 14:00 cut-off the same day. */
export async function moveClock(advance: string): Promise<void> {
  const w = demo().world;
  if (advance === "day") w.advanceWorkingDay();
  else if (advance === "cutoff") w.pastCutoff();
  else return;
  if (useDemo.getState().persona === "shop") await reload(demo().works);
  else {
    await loadShop();
    requoteBasket();
  }
}

/** "Back to Wednesday morning": a fresh Marlow Press, the same person, the same language and theme. */
export async function resetWorld(): Promise<void> {
  const fresh = renewDemo();
  resetShop(fresh.shop);
  resetAfter(fresh.after);
  useWorks.setState({ ...WORKS_START, theme: useWorks.getState().theme }, true);
  // A new page's address: the shop opens on its products again, whatever it showed before.
  window.history.replaceState(window.history.state, "", import.meta.env.BASE_URL);
  await loadShop();
  if (useDemo.getState().persona === "shop") await reload(fresh.works);
  else goView("products");
}
