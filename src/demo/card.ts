/**
 * What the website's demo card offers for Marlow Press (the comp `I - Marlow
 * Press`, its demo card 1439-1494 and `card()` 1895-1925): the customer's
 * fourteen screens and the shop's six, the shortcuts that make something
 * happen on them, the two people, the works' clock (a working day on, the
 * 14:00 cut-off passed, back to Wednesday morning) and the add-ons a works may
 * switch on — and the card's words in its eight languages. `vite.config.ts`
 * writes `demo.json` from it in the demo build; the bridge answers to its ids.
 *
 * A screen is labelled with the app's own words where the app has them (its
 * section names, already translated and reviewed); the card's own words —
 * a screen the app names no other way, a shortcut, the clock, a person — are
 * below, one row a key, the comp's own translations where it has them.
 *
 * DEMO ONLY — no surface bundle imports it.
 */
import type { DemoEmitOptions } from "../../demo-emit.ts";
import { MESSAGES } from "../i18n/messages/index.ts";

type Locale = "en-US" | "de-DE" | "fr-FR" | "da-DK" | "cs-CZ" | "ar-EG" | "zh-CN" | "zh-TW";
const LOCALES: Locale[] = ["en-US", "de-DE", "fr-FR", "da-DK", "cs-CZ", "ar-EG", "zh-CN", "zh-TW"];

/** Each label in the eight languages, in the order of `LOCALES`. */
const WORDS: Record<string, [string, string, string, string, string, string, string, string]> = {
  "screen.configure": ["Configure", "Konfigurieren", "Configurer", "Konfigurer", "Nastavit", "التهيئة", "配置", "配置"],
  "screen.artwork": ["Artwork", "Druckdaten", "Fichiers", "Trykfil", "Podklady", "التصميم", "印稿", "印稿"],
  "screen.basket": ["Basket", "Warenkorb", "Panier", "Kurv", "Košík", "السلة", "购物篮", "購物籃"],
  "screen.confirm": ["Confirmation", "Bestätigung", "Confirmation", "Bekræftelse", "Potvrzení", "التأكيد", "确认", "確認"],
  "screen.samples": ["Sample pack", "Musterpaket", "Échantillons", "Prøvepakke", "Vzorky", "حزمة عينات", "样品包", "樣品包"],
  "screen.delivery": ["Delivery & collection", "Lieferung & Abholung", "Livraison et retrait", "Levering og afhentning", "Doručení a vyzvednutí", "التوصيل والاستلام", "配送与自取", "配送與自取"],
  "screen.404": ["404", "404", "404", "404", "404", "404", "404", "404"],

  "do.cards": ["500 business cards, both sides, laminated", "500 Visitenkarten, beidseitig, kaschiert", "500 cartes de visite, recto verso, pelliculées", "500 visitkort, tosidet, lamineret", "500 vizitek, oboustranně, laminované", "٥٠٠ بطاقة عمل، وجهان، مغلّفة", "500 张名片，双面，覆膜", "500 張名片，雙面，上膜"],
  "do.flyers": ["999 flyers", "999 Flyer", "999 prospectus", "999 løbesedler", "999 letáků", "٩٩٩ نشرة", "999 张传单", "999 張傳單"],
  "do.stickers": ["100 vinyl stickers", "100 Vinyl-Aufkleber", "100 autocollants vinyle", "100 vinylklistermærker", "100 vinylových samolepek", "١٠٠ ملصق فينيل", "100 张乙烯贴纸", "100 張乙烯貼紙"],
  "do.too-big": ["Too big for the roll", "Zu groß für die Rolle", "Trop grand pour le rouleau", "For stor til rullen", "Příliš velké na roli", "أكبر من عرض اللفة", "超出卷材幅宽", "超出捲材幅寬"],
  "do.file-good": ["A good file", "Eine gute Datei", "Un bon fichier", "En god fil", "Dobrý soubor", "ملف سليم", "合格的文件", "合格的檔案"],
  "do.file-warn": ["A file with a warning", "Eine Datei mit Hinweis", "Un fichier avec un avertissement", "En fil med en advarsel", "Soubor s upozorněním", "ملف عليه تنبيه", "有警告的文件", "有警告的檔案"],
  "do.file-big": ["A file over 100 MB", "Eine Datei über 100 MB", "Un fichier de plus de 100 Mo", "En fil på over 100 MB", "Soubor větší než 100 MB", "ملف يتجاوز ١٠٠ ميغابايت", "超过 100 MB 的文件", "超過 100 MB 的檔案"],
  "do.file-type": ["Not a PDF", "Keine PDF-Datei", "Pas un PDF", "Ikke en PDF", "Není to PDF", "ليس ملف PDF", "不是 PDF", "不是 PDF"],
  "do.fill-harbour": ["Fill Harbour Bakery's details", "Angaben von Harbour Bakery eintragen", "Remplir pour Harbour Bakery", "Udfyld Harbour Bakerys oplysninger", "Vyplnit údaje Harbour Bakery", "املأ بيانات Harbour Bakery", "填入 Harbour Bakery 的信息", "填入 Harbour Bakery 的資料"],
  "do.price-up": ["A price goes up", "Ein Preis steigt", "Un prix augmente", "En pris stiger", "Cena stoupne", "يرتفع سعر", "价格上涨", "價格上漲"],
  "do.heavy": ["Over 30 kg", "Über 30 kg", "Plus de 30 kg", "Mere end 30 kg", "Přes 30 kg", "أكثر من ٣٠ كغ", "超过 30 公斤", "超過 30 公斤"],
  "do.fill-lookup": ["Fill MP-4113 and its e-mail", "MP-4113 und die E-Mail eintragen", "Remplir MP-4113 et son e-mail", "Udfyld MP-4113 og e-mailen", "Vyplnit MP-4113 a e-mail", "املأ MP-4113 وبريده", "填入 MP-4113 及其邮箱", "填入 MP-4113 及其電郵"],
  "do.fill-code": ["Fill the code", "Code eintragen", "Saisir le code", "Udfyld koden", "Vyplnit kód", "املأ الرمز", "填入验证码", "填入驗證碼"],
  "do.proof-waiting": ["A proof waiting", "Ein wartender Andruck", "Une épreuve en attente", "En korrektur venter", "Čekající náhled", "بروفة بانتظارك", "一份待确认的校样", "一份待確認的打樣"],
  "do.same-address": ["Ask again for the same address", "Noch einmal für dieselbe Adresse anfordern", "Redemander pour la même adresse", "Bed igen til samme adresse", "Požádat znovu na stejnou adresu", "اطلب مجددًا للعنوان نفسه", "同一地址再次申请", "同一地址再次申請"],
  "do.proof-approved": ["A proof comes back approved", "Ein Proof kommt freigegeben zurück", "Une épreuve revient validée", "En korrektur kommer godkendt tilbage", "Nátisk se vrátí schválený", "تعود بروفة بالموافقة", "一份校样获得确认", "一份打樣獲得確認"],
  "do.send-proof": ["Send a proof", "Proof senden", "Envoyer une épreuve", "Send en korrektur", "Poslat nátisk", "أرسل بروفة", "发送校样", "傳送打樣"],

  "persona.customer": ["Customer", "Kunde", "Client", "Kunde", "Zákazník", "العميل", "客户", "客戶"],
  "persona.shop": ["Shop", "Druckerei", "Atelier", "Trykkeri", "Tiskárna", "المطبعة", "印刷店", "印刷店"],
  "clock.day": ["+1 working day", "+1 Arbeitstag", "+1 jour ouvré", "+1 arbejdsdag", "+1 pracovní den", "+ يوم عمل واحد", "+1 个工作日", "+1 個工作天"],
  "clock.cutoff": ["Past the 14:00 cut-off", "Nach Annahmeschluss 14:00", "Après la limite de 14:00", "Efter fristen kl. 14:00", "Po uzávěrce 14:00", "بعد موعد ١٤:٠٠", "已过 14:00 截止", "已過 14:00 截止"],
  "clock.reset": ["Back to Wednesday morning", "Zurück auf Mittwochmorgen", "Retour à mercredi matin", "Tilbage til onsdag morgen", "Zpět na středu ráno", "العودة إلى صباح الأربعاء", "回到周三上午", "回到週三上午"],

  "addon.shipping-dhl": ["DHL Shipping", "DHL-Versand", "Expédition DHL", "DHL-forsendelse", "Doprava DHL", "الشحن عبر DHL", "DHL 发货", "DHL 寄送"],
  "addon.inventory": ["Inventory", "Lagerbestand", "Inventaire", "Lager", "Sklad", "المخزون", "库存", "庫存"],
  "addon.invoices": ["Invoices & Receipts", "Rechnungen & Belege", "Factures et reçus", "Fakturaer og kvitteringer", "Faktury a účtenky", "الفواتير والإيصالات", "发票与收据", "發票與收據"],
  "addon.holiday-calendars": ["Holiday Calendars", "Feiertagskalender", "Calendriers des jours fériés", "Helligdagskalendere", "Kalendáře svátků", "تقويمات العطلات", "节假日日历", "假日日曆"],

  // What a shortcut says on the works' side when nothing else on the screen does.
  "toast.approved": ["The customer approved the proof for {ref}.", "Die Kundschaft hat den Proof für {ref} freigegeben.", "Le client a validé l'épreuve de {ref}.", "Kunden har godkendt korrekturen til {ref}.", "Zákazník schválil nátisk k {ref}.", "وافق العميل على بروفة {ref}.", "客户已确认 {ref} 的校样。", "客戶已確認 {ref} 的打樣。"],
  "toast.no-proof": ["No proof is waiting on a reply.", "Kein Proof wartet auf Antwort.", "Aucune épreuve n'attend de réponse.", "Ingen korrektur venter på svar.", "Žádný nátisk nečeká na odpověď.", "لا توجد بروفة بانتظار رد.", "没有等待回复的校样。", "沒有等待回覆的打樣。"],
};

/** The app's own section names the card borrows, by the app's keys. */
const APP_KEYS = [
  "chrome.nav.products",
  "shop.nav.follow",
  "after.again.title",
  "after.templates.title",
  "after.proofs.title",
  "after.quotes.title",
  "chrome.nav.findus",
  "works.nav.today",
  "works.ticket.title",
  "works.nav.jobs",
  "works.nav.materials",
  "works.nav.prices",
] as const;

export const CARD_MESSAGES: Record<Locale, Record<string, string>> = Object.fromEntries(
  LOCALES.map((locale, i) => [
    locale,
    {
      ...Object.fromEntries(APP_KEYS.map((key) => [key, (MESSAGES[locale] as Record<string, string>)[key] ?? ""])),
      ...Object.fromEntries(Object.entries(WORDS).map(([key, words]) => [key, words[i]!])),
    },
  ]),
) as Record<Locale, Record<string, string>>;

/** The card's own words, by key, in each language: for the tests that read every one. */
export const CARD_WORDS: Readonly<Record<string, readonly string[]>> = WORDS;

/** A card string in the page's language. */
export function cardWord(locale: string, key: string, params: Record<string, string> = {}): string {
  const raw = CARD_MESSAGES[(LOCALES as string[]).includes(locale) ? (locale as Locale) : "en-US"][key] ?? key;
  return raw.replace(/\{(\w+)\}/g, (m, name: string) => params[name] ?? m);
}

type Screen = DemoEmitOptions["screens"][number];
type Shortcut = [id: string, icon: string];
const customer = (id: string, view: string, icon: string, labelKey: string, shortcuts?: Shortcut[]): Screen => ({
  id,
  view,
  icon,
  side: "customer",
  persona: "customer",
  labelKey,
  ...(shortcuts === undefined ? {} : { shortcuts: shortcuts.map(([sid, sicon]) => ({ id: sid, icon: sicon, labelKey: `do.${sid}` })) }),
});
const shop = (id: string, view: string, icon: string, labelKey: string, shortcuts?: Shortcut[]): Screen => ({ ...customer(id, `works:${view}`, icon, labelKey, shortcuts), side: "staff", persona: "shop" });

/** The card's declaration; `messages` is added where it is emitted. */
export const DEMO_CARD: Omit<DemoEmitOptions, "messages"> = {
  appKey: "printing",
  dir: "print-shop",
  frames: ["desktop", "phone"],
  personas: [
    { id: "customer", icon: "user-round", labelKey: "persona.customer" },
    { id: "shop", icon: "printer", labelKey: "persona.shop" },
  ],
  screens: [
    customer("products", "products", "layout-grid", "chrome.nav.products"),
    customer("config", "product", "sliders-horizontal", "screen.configure", [
      ["cards", "wand-sparkles"],
      ["flyers", "calculator"],
      ["stickers", "sticker"],
      ["too-big", "ruler"],
    ]),
    customer("artwork", "artwork", "upload", "screen.artwork", [
      ["file-good", "file-check"],
      ["file-warn", "triangle-alert"],
      ["file-big", "file-x"],
      ["file-type", "file-question"],
    ]),
    customer("basket", "basket", "shopping-basket", "screen.basket", [
      ["fill-harbour", "wand-sparkles"],
      ["price-up", "trending-up"],
      ["heavy", "weight"],
    ]),
    customer("confirm", "confirmed", "party-popper", "screen.confirm"),
    customer("order", "order", "package-search", "shop.nav.follow", [
      ["fill-lookup", "wand-sparkles"],
      ["fill-code", "key-round"],
      ["proof-waiting", "file-check"],
    ]),
    customer("reorder", "reorder", "repeat", "after.again.title"),
    customer("samples", "samples", "swatch-book", "screen.samples", [["same-address", "repeat"]]),
    customer("templates", "templates", "ruler", "after.templates.title"),
    customer("proof", "proofs", "file-check", "after.proofs.title"),
    customer("saved", "quotes", "bookmark", "after.quotes.title"),
    customer("delivery", "delivery", "truck", "screen.delivery"),
    customer("findus", "findUs", "map-pin", "chrome.nav.findus"),
    customer("missing", "missing", "file-x", "screen.404"),
    shop("today", "today", "house", "works.nav.today", [["proof-approved", "badge-check"]]),
    shop("ticket", "ticket", "clipboard-list", "works.ticket.title", [["send-proof", "send"]]),
    shop("jobs", "jobs", "list", "works.nav.jobs"),
    shop("materials", "materials", "layers", "works.nav.materials"),
    shop("prices", "prices", "receipt", "works.nav.prices"),
    shop("shop-missing", "notfound", "file-x", "screen.404"),
  ],
  clock: {
    advance: [
      { id: "day", labelKey: "clock.day" },
      { id: "cutoff", labelKey: "clock.cutoff" },
    ],
    reset: { labelKey: "clock.reset" },
  },
  addOns: [
    { key: "shipping-dhl", labelKey: "addon.shipping-dhl" },
    { key: "inventory", labelKey: "addon.inventory" },
    { key: "invoices", labelKey: "addon.invoices" },
    { key: "holiday-calendars", labelKey: "addon.holiday-calendars" },
  ],
};
