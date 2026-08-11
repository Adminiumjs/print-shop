/**
 * The HOST's own add-on chrome, and NOTHING THAT IS ABOUT A PARTICULAR ADD-ON.
 *
 * That distinction is the whole of this file now. What is left is the wording
 * the shop reads around any add-on — the OAuth note, "Account authorized", the
 * line that says the sign-in is simulated, the fallback where an add-on renders
 * no settings, the words on the artwork screen — plus the four shelf entries
 * that are described honestly but not built, which are the host's own copy
 * because there is no repo behind them to hold it.
 *
 * Those four (`addon.stub.*`) NAME NO COMPANY, in any locale. They say what the
 * thing would do — a second delivery company, a card payment processor, a
 * mailing-list service — because a host that printed three real firms' names
 * for integrations it does not have would be failing acceptance criterion 5 in
 * eight languages at once. `add-ons/shelf.ts` holds the entries themselves and
 * the full reasoning; a translator who reaches for a brand name here is
 * reintroducing the defect.
 *
 * What LEFT, and where it went: the sentence the connect dialog opens with
 * (`addon.host.what.<key>`), the words on each add-on's settings form, the
 * seeded activity lines, and `addon.host.disconnect.<key>.goes`/`.stays` all
 * moved into the add-on repos, because a key with an add-on's name inside it is
 * a host that knows which add-ons exist. Each add-on now points at its own keys
 * through `whatKey`, `disconnect`, `activity[].messageKey` and its
 * `settings.add-on.panel` fill. A confirm dialog that says "are you sure?" and
 * nothing else is still how a shop owner learns what disconnecting does by
 * doing it — the sentences did not go away, they changed owner (24 D16).
 *
 * Translators: the six banned words of `chrome.ts` apply here in full, and two
 * more for add-ons — never "premium" and never "pro", because neither the word
 * nor the idea of a ranked add-on exists in this product. Watch the substring
 * as well as the word: German -ieren verbs after a t ("importieren",
 * "sortieren") and French "métier" all carry a banned run of letters, and the
 * plainer verb is usually the better translation anyway.
 */

export const addOns = {
  "en-US": {
    // ── The four described-but-not-built shelf entries ─────────────────────
    "addon.stub.secondCarrier.name": "A second delivery company",
    "addon.stub.cardPayments.name": "A card payment processor",
    "addon.stub.mailingList.name": "A mailing-list service",
    "addon.stub.sheets.name": "Spreadsheet export",
    "addon.stub.secondCarrier.line":
      "Book collections with another delivery company. Every carrier is its own add-on, so the works can run two.",
    "addon.stub.cardPayments.line":
      "Take card payments on the site instead of invoicing after collection.",
    "addon.stub.mailingList.line":
      "Add customers who opt in to a mailing list, so the works can tell them when a run is on.",
    "addon.stub.sheets.line":
      "Write each finished job to a spreadsheet overnight, for the accounts.",
    // 24 AC6, on the SHELF CARD: each of the four says, in its own key,
    // that it names no company. See `add-ons/shelf.ts` — these entries are
    // the host’s own catalogue copy, so the sentence is the host’s too;
    // the three BUILT add-ons carry theirs in their own repos.
    "addon.stub.secondCarrier.noCompany":
      "Described here, not built — and it names no company, only what one would do.",
    "addon.stub.cardPayments.noCompany":
      "Described here, not built — and it names no company, only what one would do.",
    "addon.stub.mailingList.noCompany":
      "Described here, not built — and it names no company, only what one would do.",
    "addon.stub.sheets.noCompany":
      "Described here, not built — and it names no company, only what one would do.",

    // ── What the connect dialog says each one will be able to do ───────────

    // ── Connect dialog ────────────────────────────────────────────────────
    "addon.host.connect.authNote":
      "You will sign in and approve the list above. Nothing is read until you do.",
    "addon.host.connect.authorized": "Account authorized",
    "addon.host.connect.simulated":
      "In this demo the sign-in is simulated and nothing leaves the page.",

    // ── Manage drawer ─────────────────────────────────────────────────────
    "addon.host.manage.seeAll": "See all",
    "addon.host.manage.noSettings": "This one has nothing to set.",

    // ── Disconnect confirm: what goes, and what stays (24 D16) ─────────────

    // ── Manage drawer activity, in mono ───────────────────────────────────

    // ── The artwork screen, once an add-on has handed a design over ───────
    "addon.host.artwork.from": "From {name}",
    "addon.host.artwork.why":
      "Built at the finished size with the bleed already correct, so the checks that can be measured pass.",
    "addon.host.artwork.stillProofed":
      "The works still sends a proof before it goes on a press — that is the shop’s own rule, not the editor’s.",
    "addon.host.artwork.unmeasured":
      "Three of the six checks had nothing to measure: a design handed over by an add-on arrives as numbers — size, bleed, resolution, pages — with no ink-to-trim distance, no colour space and no embedded fonts in it. The works looks at those three when it opens the file.",
    "addon.host.manage.activitySeeded":
      "Seeded for this demo — nothing here was produced by a real service. A connected add-on lists what it actually did, read from the audit log.",
    "addon.host.artwork.discard": "Send a different file instead",
  },

  "de-DE": {
    "addon.stub.secondCarrier.name": "Ein weiterer Versanddienst",
    "addon.stub.cardPayments.name": "Ein Kartenzahlungsdienst",
    "addon.stub.mailingList.name": "Ein Verteilerlisten-Dienst",
    "addon.stub.sheets.name": "Tabellen-Export",
    "addon.stub.secondCarrier.line":
      "Abholungen bei einem weiteren Versanddienst buchen. Jeder Dienst ist eine eigene Erweiterung, die Werkstatt kann also zwei betreiben.",
    "addon.stub.cardPayments.line":
      "Kartenzahlung auf der Website annehmen, statt nach der Abholung eine Rechnung zu schreiben.",
    "addon.stub.mailingList.line":
      "Kundschaft, die zustimmt, in eine Verteilerliste aufnehmen, damit die Werkstatt von einer Auflage erzählen kann.",
    "addon.stub.sheets.line":
      "Jeden fertigen Auftrag über Nacht in eine Tabelle schreiben, für die Buchhaltung.",
    "addon.stub.secondCarrier.noCompany":
      "Hier nur beschrieben, nicht gebaut — und es nennt keine Firma, nur das, was so etwas täte.",
    "addon.stub.cardPayments.noCompany":
      "Hier nur beschrieben, nicht gebaut — und es nennt keine Firma, nur das, was so etwas täte.",
    "addon.stub.mailingList.noCompany":
      "Hier nur beschrieben, nicht gebaut — und es nennt keine Firma, nur das, was so etwas täte.",
    "addon.stub.sheets.noCompany":
      "Hier nur beschrieben, nicht gebaut — und es nennt keine Firma, nur das, was so etwas täte.",


    "addon.host.connect.authNote":
      "Sie melden sich an und bestätigen die Liste oben. Vorher wird nichts gelesen.",
    "addon.host.connect.authorized": "Konto bestätigt",
    "addon.host.connect.simulated":
      "In dieser Demo ist die Anmeldung nachgestellt, und nichts verlässt die Seite.",

    "addon.host.manage.seeAll": "Alles ansehen",
    "addon.host.manage.noSettings": "Hier gibt es nichts einzustellen.",



    "addon.host.artwork.from": "Aus {name}",
    "addon.host.artwork.why":
      "Im Endformat gebaut, der Anschnitt stimmt bereits — deshalb gehen die messbaren Prüfungen durch.",
    "addon.host.artwork.stillProofed":
      "Die Werkstatt schickt trotzdem einen Andruck, bevor es auf die Maschine geht — das ist die Regel des Betriebs, nicht die des Editors.",
    "addon.host.artwork.unmeasured":
      "Drei der sechs Prüfungen hatten nichts zu messen: Ein übergebener Entwurf kommt als Zahlen an — Format, Anschnitt, Auflösung, Seiten — ohne Abstand der Farbe zum Schnitt, ohne Farbraum und ohne eingebettete Schriften. Die Werkstatt sieht sich diese drei beim Öffnen der Datei an.",
    "addon.host.manage.activitySeeded":
      "Für diese Demo vorbelegt — nichts davon stammt von einem echten Dienst. Eine verbundene Erweiterung listet hier auf, was sie tatsächlich getan hat, aus dem Prüfprotokoll.",
    "addon.host.artwork.discard": "Stattdessen eine andere Datei schicken",
  },

  "fr-FR": {
    "addon.stub.secondCarrier.name": "Un autre transporteur",
    "addon.stub.cardPayments.name": "Un service de paiement par carte",
    "addon.stub.mailingList.name": "Un service de liste de diffusion",
    "addon.stub.sheets.name": "Export vers un tableur",
    "addon.stub.secondCarrier.line":
      "Réserver des enlèvements chez un autre transporteur. Chaque transporteur est un module à part, l'atelier peut donc en avoir deux.",
    "addon.stub.cardPayments.line":
      "Encaisser par carte sur le site, au lieu d'envoyer une facture après le retrait.",
    "addon.stub.mailingList.line":
      "Ajouter à une liste de diffusion les clients qui l'acceptent, pour annoncer un tirage.",
    "addon.stub.sheets.line":
      "Écrire chaque travail terminé dans un tableur pendant la nuit, pour la comptabilité.",
    "addon.stub.secondCarrier.noCompany":
      "Décrit ici, pas construit — et il ne nomme aucune société, seulement ce qu’un tel module ferait.",
    "addon.stub.cardPayments.noCompany":
      "Décrit ici, pas construit — et il ne nomme aucune société, seulement ce qu’un tel module ferait.",
    "addon.stub.mailingList.noCompany":
      "Décrit ici, pas construit — et il ne nomme aucune société, seulement ce qu’un tel module ferait.",
    "addon.stub.sheets.noCompany":
      "Décrit ici, pas construit — et il ne nomme aucune société, seulement ce qu’un tel module ferait.",


    "addon.host.connect.authNote":
      "Vous vous connecterez et validerez la liste ci-dessus. Rien n'est lu avant cela.",
    "addon.host.connect.authorized": "Compte autorisé",
    "addon.host.connect.simulated":
      "Dans cette démo la connexion est simulée et rien ne quitte la page.",

    "addon.host.manage.seeAll": "Tout voir",
    "addon.host.manage.noSettings": "Celui-ci n'a rien à régler.",



    "addon.host.artwork.from": "Depuis {name}",
    "addon.host.artwork.why":
      "Composé au format fini, avec le fond perdu déjà correct — les contrôles mesurables passent.",
    "addon.host.artwork.stillProofed":
      "L'atelier envoie quand même un bon à tirer avant la mise en machine — c'est la règle de la maison, pas celle de l'éditeur.",
    "addon.host.artwork.unmeasured":
      "Trois des six contrôles n’avaient rien à mesurer : un visuel transmis arrive sous forme de nombres — format, fond perdu, résolution, pages — sans distance de l’encre à la coupe, sans espace colorimétrique et sans polices incorporées. L’atelier regarde ces trois-là en ouvrant le fichier.",
    "addon.host.manage.activitySeeded":
      "Rempli d’avance pour cette démo — rien ici ne vient d’un vrai service. Un module connecté liste ce qu’il a réellement fait, d’après le journal.",
    "addon.host.artwork.discard": "Envoyer plutôt un autre fichier",
  },

  "cs-CZ": {
    "addon.stub.secondCarrier.name": "Další dopravce",
    "addon.stub.cardPayments.name": "Zpracovatel plateb kartou",
    "addon.stub.mailingList.name": "Rozesílková služba",
    "addon.stub.sheets.name": "Export do tabulky",
    "addon.stub.secondCarrier.line":
      "Objednávejte svozy u dalšího dopravce. Každý dopravce je vlastní doplněk, dílna jich tedy může mít dva.",
    "addon.stub.cardPayments.line":
      "Přijímejte platby kartou na webu místo faktury po vyzvednutí.",
    "addon.stub.mailingList.line":
      "Přidávejte zákazníky, kteří souhlasí, do rozesílky, aby dílna mohla dát vědět o nákladu.",
    "addon.stub.sheets.line":
      "Zapisujte každou hotovou zakázku přes noc do tabulky, pro účetnictví.",
    "addon.stub.secondCarrier.noCompany":
      "Tady jen popsané, ne postavené — a nejmenuje žádnou firmu, jen to, co by takové rozšíření dělalo.",
    "addon.stub.cardPayments.noCompany":
      "Tady jen popsané, ne postavené — a nejmenuje žádnou firmu, jen to, co by takové rozšíření dělalo.",
    "addon.stub.mailingList.noCompany":
      "Tady jen popsané, ne postavené — a nejmenuje žádnou firmu, jen to, co by takové rozšíření dělalo.",
    "addon.stub.sheets.noCompany":
      "Tady jen popsané, ne postavené — a nejmenuje žádnou firmu, jen to, co by takové rozšíření dělalo.",


    "addon.host.connect.authNote":
      "Přihlásíte se a potvrdíte seznam výše. Do té doby se nic nečte.",
    "addon.host.connect.authorized": "Účet potvrzen",
    "addon.host.connect.simulated":
      "V této ukázce je přihlášení nasimulované a nic ze stránky neodchází.",

    "addon.host.manage.seeAll": "Zobrazit vše",
    "addon.host.manage.noSettings": "U tohohle není co nastavovat.",



    "addon.host.artwork.from": "Z {name}",
    "addon.host.artwork.why":
      "Postaveno v čistém formátu se správným spadem, takže měřitelné kontroly projdou.",
    "addon.host.artwork.stillProofed":
      "Dílna pošle nátisk i tak, než to půjde do stroje — to je pravidlo dílny, ne editoru.",
    "addon.host.artwork.unmeasured":
      "Tři z šesti kontrol neměly co měřit: předaný návrh přichází jako čísla — formát, spadávka, rozlišení, strany — bez vzdálenosti barvy od ořezu, bez barevného prostoru a bez vložených písem. Dílna se na tyto tři podívá při otevření souboru.",
    "addon.host.manage.activitySeeded":
      "Předvyplněno v této ukázce — nic z toho nevzniklo u skutečné služby. Připojený doplněk vypisuje, co doopravdy udělal, z protokolu.",
    "addon.host.artwork.discard": "Poslat radši jiný soubor",
  },

  "da-DK": {
    "addon.stub.secondCarrier.name": "Endnu et fragtfirma",
    "addon.stub.cardPayments.name": "En kortbetalingsudbyder",
    "addon.stub.mailingList.name": "En mailelistetjeneste",
    "addon.stub.sheets.name": "Regnearkseksport",
    "addon.stub.secondCarrier.line":
      "Bestil afhentninger hos endnu et fragtfirma. Hvert firma er sin egen udvidelse, så værkstedet kan køre to.",
    "addon.stub.cardPayments.line":
      "Tag imod kortbetaling på siden i stedet for at sende en faktura efter afhentning.",
    "addon.stub.mailingList.line":
      "Skriv kunder, der siger ja, på en maileliste, så værkstedet kan fortælle om et oplag.",
    "addon.stub.sheets.line":
      "Skriv hver færdig opgave til et regneark om natten, til bogholderiet.",
    "addon.stub.secondCarrier.noCompany":
      "Kun beskrevet her, ikke bygget — og den nævner intet firma, kun hvad sådan en ville gøre.",
    "addon.stub.cardPayments.noCompany":
      "Kun beskrevet her, ikke bygget — og den nævner intet firma, kun hvad sådan en ville gøre.",
    "addon.stub.mailingList.noCompany":
      "Kun beskrevet her, ikke bygget — og den nævner intet firma, kun hvad sådan en ville gøre.",
    "addon.stub.sheets.noCompany":
      "Kun beskrevet her, ikke bygget — og den nævner intet firma, kun hvad sådan en ville gøre.",


    "addon.host.connect.authNote":
      "Du logger ind og godkender listen ovenfor. Der læses ingenting før det.",
    "addon.host.connect.authorized": "Konto godkendt",
    "addon.host.connect.simulated":
      "I denne demo er login efterlignet, og intet forlader siden.",

    "addon.host.manage.seeAll": "Se alt",
    "addon.host.manage.noSettings": "Denne har ikke noget at indstille.",



    "addon.host.artwork.from": "Fra {name}",
    "addon.host.artwork.why":
      "Bygget i færdigt format med beskæringen allerede rigtig, så de kontroller, der kan måles, går igennem.",
    "addon.host.artwork.stillProofed":
      "Værkstedet sender stadig en prøve, før det går i maskinen — det er husets regel, ikke editorens.",
    "addon.host.artwork.unmeasured":
      "Tre af de seks kontroller havde intet at måle: et afleveret design kommer som tal — format, beskæring, opløsning, sider — uden afstand fra farve til snit, uden farverum og uden indlejrede skrifter. Værkstedet ser på de tre, når filen åbnes.",
    "addon.host.manage.activitySeeded":
      "Lagt ind til denne demo — intet her kommer fra en rigtig tjeneste. En tilsluttet udvidelse viser, hvad den faktisk har gjort, fra loggen.",
    "addon.host.artwork.discard": "Send en anden fil i stedet",
  },

  "zh-CN": {
    "addon.stub.secondCarrier.name": "另一家快递公司",
    "addon.stub.cardPayments.name": "银行卡收款服务",
    "addon.stub.mailingList.name": "邮件名单服务",
    "addon.stub.sheets.name": "表格导出",
    "addon.stub.secondCarrier.line":
      "向另一家快递公司预约取件。每家快递都是独立的扩展，因此工坊可以同时接两家。",
    "addon.stub.cardPayments.line": "在网站上直接收银行卡付款，不必等取件后再开发票。",
    "addon.stub.mailingList.line":
      "把同意的客户加入邮件名单，工坊开印时就能通知他们。",
    "addon.stub.sheets.line": "每晚把当天完工的活儿写进一份表格，供账房查阅。",
    "addon.stub.secondCarrier.noCompany":
      "这里只是描述，并没有做出来；它没有点名任何公司，只说这样一个扩展会做什么。",
    "addon.stub.cardPayments.noCompany":
      "这里只是描述，并没有做出来；它没有点名任何公司，只说这样一个扩展会做什么。",
    "addon.stub.mailingList.noCompany":
      "这里只是描述，并没有做出来；它没有点名任何公司，只说这样一个扩展会做什么。",
    "addon.stub.sheets.noCompany":
      "这里只是描述，并没有做出来；它没有点名任何公司，只说这样一个扩展会做什么。",


    "addon.host.connect.authNote": "您将登录并确认上面这份清单。在此之前不会读取任何内容。",
    "addon.host.connect.authorized": "账号已授权",
    "addon.host.connect.simulated": "本演示中的登录是模拟的，没有任何内容离开这个页面。",

    "addon.host.manage.seeAll": "查看全部",
    "addon.host.manage.noSettings": "这一个没有可设的东西。",



    "addon.host.artwork.from": "来自 {name}",
    "addon.host.artwork.why": "按成品尺寸做的，出血本来就对，所以能测量的那几项检查都通过。",
    "addon.host.artwork.stillProofed":
      "上机之前工坊仍会先送一份样稿——这是工坊自己的规矩，不是编辑器的。",
    "addon.host.artwork.unmeasured":
      "六项检查里有三项无从测量：扩展交过来的设计只是一组数字——尺寸、出血、分辨率、页数——不含油墨到裁切线的距离、色彩空间和嵌入字体。工坊打开文件时会亲自看这三项。",
    "addon.host.manage.activitySeeded":
      "这些是为演示预置的记录，没有一条出自真实服务。接上真账号后，这里列出的是扩展实际做过的事，取自审计日志。",
    "addon.host.artwork.discard": "改送另一个文件",
  },

  "zh-TW": {
    "addon.stub.secondCarrier.name": "另一家快遞公司",
    "addon.stub.cardPayments.name": "信用卡收款服務",
    "addon.stub.mailingList.name": "郵件名單服務",
    "addon.stub.sheets.name": "試算表匯出",
    "addon.stub.secondCarrier.line":
      "向另一家快遞公司預約取件。每家快遞都是獨立的擴充，工坊可以同時接兩家。",
    "addon.stub.cardPayments.line": "在網站上直接收信用卡付款，不必等取件後再開發票。",
    "addon.stub.mailingList.line":
      "把同意的客戶加入郵件名單，工坊開印時就能通知他們。",
    "addon.stub.sheets.line": "每晚把當天完工的活兒寫進一份試算表，供帳房查閱。",
    "addon.stub.secondCarrier.noCompany":
      "這裡只是描述，並沒有做出來；它沒有點名任何公司，只說這樣一個擴充會做什麼。",
    "addon.stub.cardPayments.noCompany":
      "這裡只是描述，並沒有做出來；它沒有點名任何公司，只說這樣一個擴充會做什麼。",
    "addon.stub.mailingList.noCompany":
      "這裡只是描述，並沒有做出來；它沒有點名任何公司，只說這樣一個擴充會做什麼。",
    "addon.stub.sheets.noCompany":
      "這裡只是描述，並沒有做出來；它沒有點名任何公司，只說這樣一個擴充會做什麼。",


    "addon.host.connect.authNote": "您將登入並確認上面這份清單。在此之前不會讀取任何內容。",
    "addon.host.connect.authorized": "帳號已授權",
    "addon.host.connect.simulated": "本示範中的登入是模擬的，沒有任何內容離開這個頁面。",

    "addon.host.manage.seeAll": "查看全部",
    "addon.host.manage.noSettings": "這一個沒有可設的東西。",



    "addon.host.artwork.from": "來自 {name}",
    "addon.host.artwork.why": "依成品尺寸做的，出血本來就對，所以能量測的那幾項檢查都通過。",
    "addon.host.artwork.stillProofed":
      "上機之前工坊仍會先送一份樣稿——這是工坊自己的規矩，不是編輯器的。",
    "addon.host.artwork.unmeasured":
      "六項檢查裡有三項無從測量：擴充交過來的設計只是一組數字——尺寸、出血、解析度、頁數——不含油墨到裁切線的距離、色彩空間與嵌入字型。工坊開檔時會親自看這三項。",
    "addon.host.manage.activitySeeded":
      "這些是為示範預置的紀錄，沒有一條出自真實服務。接上真帳號後，這裡列出的是擴充實際做過的事，取自稽核日誌。",
    "addon.host.artwork.discard": "改送另一個檔案",
  },

  "ar-EG": {
    "addon.stub.secondCarrier.name": "شركة شحن أخرى",
    "addon.stub.cardPayments.name": "خدمة دفع بالبطاقة",
    "addon.stub.mailingList.name": "خدمة قوائم بريدية",
    "addon.stub.sheets.name": "تصدير إلى جدول بيانات",
    "addon.stub.secondCarrier.line":
      "احجز استلام الطرود مع شركة شحن أخرى. كل شركة إضافة مستقلة، فيمكن للمطبعة تشغيل اثنتين.",
    "addon.stub.cardPayments.line":
      "اقبل الدفع بالبطاقة على الموقع بدل إرسال فاتورة بعد الاستلام.",
    "addon.stub.mailingList.line":
      "أضف العملاء الموافقين إلى قائمة بريدية، حتى تخبرهم المطبعة عند تشغيل طبعة.",
    "addon.stub.sheets.line":
      "اكتب كل شغلة منتهية في جدول بيانات أثناء الليل، لأجل الحسابات.",
    "addon.stub.secondCarrier.noCompany":
      "موصوف هنا فقط وغير مبني، ولا يذكر أي شركة، بل ما قد يفعله شيء كهذا.",
    "addon.stub.cardPayments.noCompany":
      "موصوف هنا فقط وغير مبني، ولا يذكر أي شركة، بل ما قد يفعله شيء كهذا.",
    "addon.stub.mailingList.noCompany":
      "موصوف هنا فقط وغير مبني، ولا يذكر أي شركة، بل ما قد يفعله شيء كهذا.",
    "addon.stub.sheets.noCompany":
      "موصوف هنا فقط وغير مبني، ولا يذكر أي شركة، بل ما قد يفعله شيء كهذا.",


    "addon.host.connect.authNote":
      "ستسجّل الدخول وتوافق على القائمة أعلاه. لا يُقرأ شيء قبل ذلك.",
    "addon.host.connect.authorized": "تم اعتماد الحساب",
    "addon.host.connect.simulated":
      "في هذا العرض التوضيحي تسجيل الدخول محاكاة، ولا يغادر شيء الصفحة.",

    "addon.host.manage.seeAll": "عرض الكل",
    "addon.host.manage.noSettings": "هذه ليس فيها ما يُضبط.",



    "addon.host.artwork.from": "من {name}",
    "addon.host.artwork.why":
      "مبنيّ بالمقاس النهائي والهدر حوله مضبوط سلفًا، فتنجح الفحوص التي يمكن قياسها.",
    "addon.host.artwork.stillProofed":
      "ترسل المطبعة بروفة قبل الطبع رغم ذلك — وهذه قاعدة المطبعة نفسها لا قاعدة المحرّر.",
    "addon.host.artwork.unmeasured":
      "ثلاث من الفحوص الست لم تجد ما تقيسه: التصميم المُسلَّم يصل أرقامًا — المقاس والحد الزائد والدقة وعدد الصفحات — بلا مسافة بين الحبر وخط القص، ولا فضاء لوني، ولا خطوط مضمّنة. المطبعة تنظر في هذه الثلاث عند فتح الملف.",
    "addon.host.manage.activitySeeded":
      "هذه سجلات مُهيّأة للعرض التجريبي، ولم ينتج أيٌّ منها عن خدمة حقيقية. الإضافة الموصولة تعرض هنا ما فعلته فعلًا، من سجل التدقيق.",
    "addon.host.artwork.discard": "أرسل ملفًا آخر بدلًا منه",
  },
} as const;
