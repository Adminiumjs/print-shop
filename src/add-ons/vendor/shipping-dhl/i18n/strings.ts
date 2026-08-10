/*
 * VENDORED from add-ons/packages/shipping-dhl/src/i18n/strings.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `shipping-dhl`; its manifest, tests and README live in the monorepo.
 */
/**
 * Every user-visible string this add-on has, in all eight locales.
 *
 * Same nested shape as the host's `src/i18n/strings/chrome.ts` — `{ locale:
 * { key: value } }` — because the host merges these into its own bundle and
 * types the key union off English. A locale missing a key is a COMPILE error
 * there, not a runtime fallback, which is the whole point of the shape.
 *
 * Keys are namespaced under `addon.shipping-dhl.*`. Every add-on's strings land
 * in one flat bundle with the host's, so a bare `rates.title` would be a
 * collision waiting for the second carrier.
 *
 * A NOTE FOR TRANSLATORS, and it is not optional. The English avoids a short
 * list of commercial and quantity-break words on purpose, and several of them
 * are the printing trade's own — which is exactly why the list is not spelled
 * out in this file. It lives in `sources.test.ts`, as the guard that fails the
 * build when one of them appears, so there is one copy of it and it is an
 * executable one rather than a comment that drifts. A parcel service costs
 * money and is named plainly: rates, prices, what it costs, no charge.
 *
 * Please keep the equivalent restraint in your language rather than reaching
 * for the marketing word, and where your language's natural term happens to
 * contain one of the forbidden English fragments as a substring, prefer the
 * plainer phrase a works would actually say — the release check reads bytes,
 * not meaning, so an innocent word with an unlucky spelling still trips it.
 *
 * Two more rules, both from 24 D12. The company is named ONLY to say what is
 * being connected to — never as a partner, never as an endorsement. And no
 * string here may be turned into a claim of affiliation by a translation that
 * reads more warmly than the English.
 */

export const strings = {
  "en-US": {
    // ── Host chrome this add-on owns: the connect sentence, its own settings
    //    panel copy, what a disconnect takes and keeps, and its activity lines.
    "addon.shipping-dhl.what": "This lets the works book a parcel collection from the job ticket, get rates back and print a label, instead of typing tracking numbers into an email.",
    "addon.shipping-dhl.set.demo": "Use the demo carrier",
    "addon.shipping-dhl.set.demoOn": "Rates, labels and tracking come back from a seeded stand-in. Nothing reaches a real carrier.",
    "addon.shipping-dhl.set.demoOff": "Calls go to the carrier with the account details you entered. Switch this back on to stop that.",
    "addon.shipping-dhl.set.cutoffLabel": "Collection cut-off",
    "addon.shipping-dhl.set.cutoffNote": "Book before this and the driver comes the same afternoon.",
    "addon.shipping-dhl.set.weights": "Default parcel weights",
    "addon.shipping-dhl.set.weightsNote": "Worked out from the material and the quantity on the job. The rate card behind them is edited in your Adminium dashboard.",
    "addon.shipping-dhl.disconnect.goes": "The job ticket loses “Book a collection”, checkout loses the carrier's rates, and a customer's order page goes back to collection from the works.",
    "addon.shipping-dhl.disconnect.stays": "Collections already booked keep their labels and tracking numbers. The account details are deleted.",
    "addon.shipping-dhl.act.1": "{when} · collection booked · {ref}",
    "addon.shipping-dhl.act.2": "{when} · rates fetched · {ref}",
    "addon.shipping-dhl.act.3": "{when} · label downloaded · {ref}",

    // ── the add-on itself ──────────────────────────────────────────────────
    "addon.shipping-dhl.line":
      "Books a parcel collection from a job that is ready, and brings back a label and a tracking reference.",
    "addon.shipping-dhl.notAffiliated": "Adminium is not affiliated with this company.",
    "addon.shipping-dhl.demoChip": "Demo carrier — no real shipment was booked",
    "addon.shipping-dhl.onlyCarrier": "DHL is the only delivery company connected.",
    "addon.shipping-dhl.connectAnother": "Connect another in Add-ons.",

    // ── what connecting allows ─────────────────────────────────────────────
    "addon.shipping-dhl.perm.rates": "Fetch rates for a parcel you are sending",
    "addon.shipping-dhl.perm.shipments": "Create shipments for orders you dispatch",
    "addon.shipping-dhl.perm.labels": "Download the labels for those shipments",

    /*
     * ── settings ─────────────────────────────────────────────────────────
     * These four are rendered by the HOST, not by anything in this repo: the
     * connect dialog and the manage panel are host surfaces, and they look a
     * setting's label up as `setting.<name>` and the line under it as
     * `setting.<name>Hint`. The two credential labels are also named directly
     * by `manifest.json`. The hints are not decoration — a switch that changes
     * whether a real carrier is called has to explain itself in the dialog
     * where the shop agrees to it.
     */
    "addon.shipping-dhl.setting.apiKey": "API key",
    "addon.shipping-dhl.setting.accountNumber": "Account number",
    "addon.shipping-dhl.setting.demo": "Use the demo carrier instead",
    "addon.shipping-dhl.setting.demoHint":
      "Rates, labels and tracking come back from a seeded stand-in, so you can try the whole flow without an account. Nothing is sent to a real carrier.",
    "addon.shipping-dhl.setting.cutoff": "Collection cut-off",
    "addon.shipping-dhl.setting.cutoffHint":
      "Book before this and the driver comes the same afternoon.",

    // ── the parcel ─────────────────────────────────────────────────────────
    "addon.shipping-dhl.action.book": "Book a collection",
    "addon.shipping-dhl.parcel.title": "The parcel",
    "addon.shipping-dhl.parcel.sub": "Filled in from the job. Change anything wrong.",
    "addon.shipping-dhl.parcel.contents": "Contents",
    "addon.shipping-dhl.parcel.weight": "Weight",
    "addon.shipping-dhl.parcel.dims": "Dimensions",
    "addon.shipping-dhl.parcel.goingTo": "Going to",

    // ── a customer this add-on cannot place ────────────────────────────────
    "addon.shipping-dhl.dest.unknownTitle": "No address on file for this customer",
    "addon.shipping-dhl.dest.unknownBody": "{customer} is not in this carrier's address book, so nothing has been filled in. Type where the parcel is going — no other customer's address is used in its place.",
    "addon.shipping-dhl.dest.name": "Send to",
    "addon.shipping-dhl.dest.street": "Street",
    "addon.shipping-dhl.dest.city": "Town or city",
    "addon.shipping-dhl.dest.needAddress": "Add a town and a postcode before you get rates.",
    "addon.shipping-dhl.parcel.contentsValue": "Printed work at {gsm}gsm, {packaging}",
    "addon.shipping-dhl.parcel.contentsFrom": "From job {ref}, quantity {quantity}",
    "addon.shipping-dhl.parcel.weightFrom": "{kg}kg — {sheets} × SRA3 at {gsm}gsm, {packaging}",
    "addon.shipping-dhl.parcel.weightFromRoll": "{kg}kg — {quantity} × roll media at {gsm}gsm, in a tube",
    "addon.shipping-dhl.parcel.dimsFrom": "The parcel this job goes in, {packaging}",
    "addon.shipping-dhl.pack.bundled": "bundled",
    "addon.shipping-dhl.pack.shrinkWrapped": "shrink-wrapped",
    "addon.shipping-dhl.pack.boxed": "boxed",
    "addon.shipping-dhl.pack.tube": "in a tube",

    // ── rates and booking ──────────────────────────────────────────────────
    "addon.shipping-dhl.rates.get": "Get rates",
    "addon.shipping-dhl.rates.title": "Rates for this parcel",
    "addon.shipping-dhl.rates.simulated": "These services, prices and dates come from a demo carrier. Nothing is sent to a real one.",
    "addon.shipping-dhl.rates.arrives": "arrives {date}",
    "addon.shipping-dhl.rates.cheapest": "cheapest",
    "addon.shipping-dhl.rates.book": "Book the collection",
    "addon.shipping-dhl.rates.cutoffLine":
      "Book before {cutoff} and the driver comes this afternoon. It is {now} now.",
    "addon.shipping-dhl.rates.cutoffMissed":
      "It is {now}, past the {cutoff} cut-off, so the van calls on {day}.",
    "addon.shipping-dhl.service.exp1200": "Express by 12:00",
    "addon.shipping-dhl.service.expNwd": "Express, next working day",
    "addon.shipping-dhl.service.eco2wd": "Economy, second working day",

    // ── the result ─────────────────────────────────────────────────────────
    "addon.shipping-dhl.booked.title": "Collection booked",
    "addon.shipping-dhl.booked.tracking": "Tracking reference",
    "addon.shipping-dhl.booked.window": "Collection window",
    "addon.shipping-dhl.booked.service": "Service",
    "addon.shipping-dhl.label.download": "Download",
    "addon.shipping-dhl.label.print": "Print",
    "addon.shipping-dhl.tracking.title": "Tracking",
    "addon.shipping-dhl.tracking.simulated": "Demo carrier — these scans are simulated",
    "addon.shipping-dhl.event.collected": "Picked up from the works",
    "addon.shipping-dhl.event.atHub": "Sorted at the depot",
    "addon.shipping-dhl.event.outForDelivery": "Out with the driver",

    // ── the refusal ────────────────────────────────────────────────────────
    "addon.shipping-dhl.error.title": "The carrier would not take this address",
    "addon.shipping-dhl.error.simulated": "Demo carrier — this refusal is simulated",
    "addon.shipping-dhl.error.remedy1":
      "Check the postcode against the country it is going to. For {country} it looks like {example}.",
    "addon.shipping-dhl.error.remedy2":
      "If the address is right as it stands, hand the job over the counter and mark it collected.",
    "addon.shipping-dhl.error.retry": "Try again",
    "addon.shipping-dhl.error.postcode": "Postcode",
    "addon.shipping-dhl.error.country": "Country",

    // ── the customer's two surfaces ────────────────────────────────────────
    "addon.shipping-dhl.checkout.title": "Delivery by DHL",
    "addon.shipping-dhl.checkout.sub": "Worked out from what is in your basket.",
    "addon.shipping-dhl.checkout.simulated":
      "These rates come from a demo carrier. Nothing is sent to a real one.",
    "addon.shipping-dhl.panel.carrier": "Carrier",
    "addon.shipping-dhl.panel.due": "Due",
    "addon.shipping-dhl.panel.notSent": "This order has not gone out with a carrier yet.",
    "addon.shipping-dhl.panel.trackIt": "Track it",
    "addon.shipping-dhl.panel.noPage":
      "The demo carrier has no tracking page of its own — the events above are all of it.",
  },

  "de-DE": {
    // ── Host chrome this add-on owns: the connect sentence, its own settings
    //    panel copy, what a disconnect takes and keeps, and its activity lines.
    "addon.shipping-dhl.what": "Damit bucht die Werkstatt die Paketabholung direkt vom Laufzettel aus, bekommt Preise zurück und druckt ein Etikett — statt Sendungsnummern in eine E-Mail zu tippen.",
    "addon.shipping-dhl.set.demo": "Den Demo-Versanddienst nutzen",
    "addon.shipping-dhl.set.demoOn": "Preise, Etiketten und Sendungsverfolgung kommen aus einem hinterlegten Ersatz. Nichts erreicht einen echten Versanddienst.",
    "addon.shipping-dhl.set.demoOff": "Anfragen gehen mit den eingegebenen Kontodaten an den Versanddienst. Schalten Sie das wieder ein, um das zu beenden.",
    "addon.shipping-dhl.set.cutoffLabel": "Annahmeschluss für die Abholung",
    "addon.shipping-dhl.set.cutoffNote": "Vorher gebucht, und der Fahrer kommt noch am selben Nachmittag.",
    "addon.shipping-dhl.set.weights": "Voreingestellte Paketgewichte",
    "addon.shipping-dhl.set.weightsNote": "Errechnet aus Material und Menge des Auftrags. Die Preisliste dahinter wird in Ihrem Adminium-Dashboard gepflegt.",
    "addon.shipping-dhl.disconnect.goes": "Dem Laufzettel fehlt „Abholung buchen“, der Kasse fehlen die Preise des Dienstes, und die Auftragsseite der Kundschaft zeigt wieder Abholung in der Werkstatt.",
    "addon.shipping-dhl.disconnect.stays": "Bereits gebuchte Abholungen behalten Etikett und Sendungsnummer. Die Kontodaten werden gelöscht.",
    "addon.shipping-dhl.act.1": "{when} · Abholung gebucht · {ref}",
    "addon.shipping-dhl.act.2": "{when} · Preise abgerufen · {ref}",
    "addon.shipping-dhl.act.3": "{when} · Etikett geladen · {ref}",

    "addon.shipping-dhl.line":
      "Bucht eine Paketabholung zu einem fertigen Auftrag und liefert Etikett und Sendungsnummer zurück.",
    "addon.shipping-dhl.notAffiliated": "Adminium steht in keiner Verbindung zu diesem Unternehmen.",
    "addon.shipping-dhl.demoChip": "Demo-Versender — es wurde keine echte Sendung gebucht",
    "addon.shipping-dhl.onlyCarrier": "DHL ist der einzige verbundene Lieferdienst.",
    "addon.shipping-dhl.connectAnother": "Weitere unter Add-ons verbinden.",

    "addon.shipping-dhl.perm.rates": "Preise für ein Paket abrufen, das Sie versenden",
    "addon.shipping-dhl.perm.shipments": "Sendungen zu Aufträgen anlegen, die Sie versenden",
    "addon.shipping-dhl.perm.labels": "Die Etiketten zu diesen Sendungen herunterladen",

    "addon.shipping-dhl.setting.apiKey": "API-Schlüssel",
    "addon.shipping-dhl.setting.accountNumber": "Kundennummer",
    "addon.shipping-dhl.setting.demo": "Stattdessen den Demo-Versender nutzen",
    "addon.shipping-dhl.setting.demoHint":
      "Preise, Etiketten und Sendungsverfolgung kommen aus einem hinterlegten Ersatz, sodass Sie den ganzen Ablauf ohne Konto ausprobieren können. Es geht nichts an einen echten Versender.",
    "addon.shipping-dhl.setting.cutoff": "Annahmeschluss für die Abholung",
    "addon.shipping-dhl.setting.cutoffHint":
      "Vorher gebucht, kommt der Fahrer noch am selben Nachmittag.",

    "addon.shipping-dhl.action.book": "Abholung buchen",
    "addon.shipping-dhl.parcel.title": "Das Paket",
    "addon.shipping-dhl.parcel.sub": "Aus dem Auftrag übernommen. Ändern Sie, was nicht stimmt.",
    "addon.shipping-dhl.parcel.contents": "Inhalt",
    "addon.shipping-dhl.parcel.weight": "Gewicht",
    "addon.shipping-dhl.parcel.dims": "Maße",
    "addon.shipping-dhl.parcel.goingTo": "Geht an",

    // ── a customer this add-on cannot place ────────────────────────────────
    "addon.shipping-dhl.dest.unknownTitle": "Für diesen Kunden ist keine Adresse hinterlegt",
    "addon.shipping-dhl.dest.unknownBody": "{customer} steht nicht im Adressbuch dieses Versenders, deshalb ist nichts vorausgefüllt. Tragen Sie ein, wohin das Paket geht — es wird keine andere Adresse eingesetzt.",
    "addon.shipping-dhl.dest.name": "Empfänger",
    "addon.shipping-dhl.dest.street": "Straße",
    "addon.shipping-dhl.dest.city": "Ort",
    "addon.shipping-dhl.dest.needAddress": "Ort und Postleitzahl eintragen, dann Preise abrufen.",
    "addon.shipping-dhl.parcel.contentsValue": "Drucksachen, {gsm}g/m², {packaging}",
    "addon.shipping-dhl.parcel.contentsFrom": "Aus Auftrag {ref}, Menge {quantity}",
    "addon.shipping-dhl.parcel.weightFrom": "{kg}kg — {sheets} × SRA3 mit {gsm}g/m², {packaging}",
    "addon.shipping-dhl.parcel.weightFromRoll":
      "{kg}kg — {quantity} × Rollenmaterial mit {gsm}g/m², in einer Hülse",
    "addon.shipping-dhl.parcel.dimsFrom": "Das Paket für diesen Auftrag, {packaging}",
    "addon.shipping-dhl.pack.bundled": "gebündelt",
    "addon.shipping-dhl.pack.shrinkWrapped": "eingeschweißt",
    "addon.shipping-dhl.pack.boxed": "im Karton",
    "addon.shipping-dhl.pack.tube": "in einer Hülse",

    "addon.shipping-dhl.rates.get": "Preise abrufen",
    "addon.shipping-dhl.rates.title": "Preise für dieses Paket",
    "addon.shipping-dhl.rates.simulated": "Diese Dienste, Preise und Termine kommen von einem Demo-Versender. Nichts geht an einen echten.",
    "addon.shipping-dhl.rates.arrives": "da am {date}",
    "addon.shipping-dhl.rates.cheapest": "am günstigsten",
    "addon.shipping-dhl.rates.book": "Abholung buchen",
    "addon.shipping-dhl.rates.cutoffLine":
      "Bis {cutoff} gebucht, kommt der Fahrer heute Nachmittag. Es ist jetzt {now}.",
    "addon.shipping-dhl.rates.cutoffMissed":
      "Es ist {now} und damit nach dem Annahmeschluss um {cutoff} — der Wagen kommt am {day}.",
    "addon.shipping-dhl.service.exp1200": "Express bis 12:00",
    "addon.shipping-dhl.service.expNwd": "Express, nächster Werktag",
    "addon.shipping-dhl.service.eco2wd": "Sparversand, zweiter Werktag",

    "addon.shipping-dhl.booked.title": "Abholung gebucht",
    "addon.shipping-dhl.booked.tracking": "Sendungsnummer",
    "addon.shipping-dhl.booked.window": "Abholfenster",
    "addon.shipping-dhl.booked.service": "Versandart",
    "addon.shipping-dhl.label.download": "Herunterladen",
    "addon.shipping-dhl.label.print": "Drucken",
    "addon.shipping-dhl.tracking.title": "Sendungsverfolgung",
    "addon.shipping-dhl.tracking.simulated": "Demo-Versender — diese Scans sind simuliert",
    "addon.shipping-dhl.event.collected": "In der Werkstatt abgeholt",
    "addon.shipping-dhl.event.atHub": "Im Verteilzentrum bearbeitet",
    "addon.shipping-dhl.event.outForDelivery": "Beim Fahrer zur Zustellung",

    "addon.shipping-dhl.error.title": "Der Versender hat diese Adresse abgelehnt",
    "addon.shipping-dhl.error.simulated": "Demo-Versender — diese Ablehnung ist simuliert",
    "addon.shipping-dhl.error.remedy1":
      "Prüfen Sie die Postleitzahl gegen das Zielland. Eine aus {country} sieht aus wie {example}.",
    "addon.shipping-dhl.error.remedy2":
      "Stimmt die Adresse so, geben Sie den Auftrag über den Tresen aus und setzen ihn auf abgeholt.",
    "addon.shipping-dhl.error.retry": "Erneut versuchen",
    "addon.shipping-dhl.error.postcode": "Postleitzahl",
    "addon.shipping-dhl.error.country": "Land",

    "addon.shipping-dhl.checkout.title": "Zustellung mit DHL",
    "addon.shipping-dhl.checkout.sub": "Aus dem Inhalt Ihres Warenkorbs ermittelt.",
    "addon.shipping-dhl.checkout.simulated":
      "Diese Preise kommen von einem Demo-Versender. Es geht nichts an einen echten.",
    "addon.shipping-dhl.panel.carrier": "Versender",
    "addon.shipping-dhl.panel.due": "Erwartet",
    "addon.shipping-dhl.panel.notSent": "Dieser Auftrag ist noch nicht mit einem Versender unterwegs.",
    "addon.shipping-dhl.panel.trackIt": "Sendung verfolgen",
    "addon.shipping-dhl.panel.noPage":
      "Der Demo-Versender hat keine eigene Verfolgungsseite — mehr als die Ereignisse oben gibt es nicht.",
  },

  "fr-FR": {
    // ── Host chrome this add-on owns: the connect sentence, its own settings
    //    panel copy, what a disconnect takes and keeps, and its activity lines.
    "addon.shipping-dhl.what": "Cela permet à l'atelier de réserver un enlèvement depuis la fiche de travail, de recevoir des tarifs et d'imprimer une étiquette, au lieu de recopier des numéros de suivi dans un courriel.",
    "addon.shipping-dhl.set.demo": "Utiliser le transporteur de démonstration",
    "addon.shipping-dhl.set.demoOn": "Tarifs, étiquettes et suivi viennent d'un substitut pré-rempli. Rien n'atteint un vrai transporteur.",
    "addon.shipping-dhl.set.demoOff": "Les appels partent chez le transporteur avec les identifiants saisis. Réactivez ceci pour y mettre fin.",
    "addon.shipping-dhl.set.cutoffLabel": "Heure limite d'enlèvement",
    "addon.shipping-dhl.set.cutoffNote": "Réservez avant, et le chauffeur passe le même après-midi.",
    "addon.shipping-dhl.set.weights": "Poids de colis par défaut",
    "addon.shipping-dhl.set.weightsNote": "Calculés d'après le support et la quantité du travail. Les tarifs derrière eux se modifient dans votre tableau de bord Adminium.",
    "addon.shipping-dhl.disconnect.goes": "La fiche de travail perd « Réserver un enlèvement », la caisse perd les tarifs du transporteur, et la page de commande du client revient au retrait à l'atelier.",
    "addon.shipping-dhl.disconnect.stays": "Les enlèvements déjà réservés gardent leur étiquette et leur numéro de suivi. Les identifiants sont supprimés.",
    "addon.shipping-dhl.act.1": "{when} · enlèvement réservé · {ref}",
    "addon.shipping-dhl.act.2": "{when} · tarifs demandés · {ref}",
    "addon.shipping-dhl.act.3": "{when} · étiquette téléchargée · {ref}",

    "addon.shipping-dhl.line":
      "Réserve un enlèvement de colis pour une commande prête, et renvoie une étiquette et un numéro de suivi.",
    "addon.shipping-dhl.notAffiliated": "Adminium n'est affilié à aucune de ces sociétés.",
    "addon.shipping-dhl.demoChip": "Transporteur de démonstration — aucun envoi réel n'a été créé",
    "addon.shipping-dhl.onlyCarrier": "DHL est la seule société de livraison connectée.",
    "addon.shipping-dhl.connectAnother": "Connectez-en une autre dans Add-ons.",

    "addon.shipping-dhl.perm.rates": "Obtenir les tarifs d'un colis que vous envoyez",
    "addon.shipping-dhl.perm.shipments": "Créer des envois pour les commandes que vous expédiez",
    "addon.shipping-dhl.perm.labels": "Télécharger les étiquettes de ces envois",

    "addon.shipping-dhl.setting.apiKey": "Clé API",
    "addon.shipping-dhl.setting.accountNumber": "Numéro de compte",
    "addon.shipping-dhl.setting.demo": "Utiliser plutôt le transporteur de démonstration",
    "addon.shipping-dhl.setting.demoHint":
      "Les tarifs, les étiquettes et le suivi viennent d'un remplaçant préchargé : vous essayez tout le parcours sans compte. Rien n'est envoyé à un vrai transporteur.",
    "addon.shipping-dhl.setting.cutoff": "Heure limite d'enlèvement",
    "addon.shipping-dhl.setting.cutoffHint":
      "Réservez avant cette heure et le chauffeur passe l'après-midi même.",

    "addon.shipping-dhl.action.book": "Réserver un enlèvement",
    "addon.shipping-dhl.parcel.title": "Le colis",
    "addon.shipping-dhl.parcel.sub": "Rempli depuis la commande. Corrigez ce qui ne va pas.",
    "addon.shipping-dhl.parcel.contents": "Contenu",
    "addon.shipping-dhl.parcel.weight": "Poids",
    "addon.shipping-dhl.parcel.dims": "Dimensions",
    "addon.shipping-dhl.parcel.goingTo": "Destinataire",

    // ── a customer this add-on cannot place ────────────────────────────────
    "addon.shipping-dhl.dest.unknownTitle": "Aucune adresse enregistrée pour ce client",
    "addon.shipping-dhl.dest.unknownBody": "{customer} ne figure pas dans le carnet d'adresses de ce transporteur ; rien n'a été prérempli. Saisissez la destination du colis — aucune adresse d'un autre client n'est utilisée à sa place.",
    "addon.shipping-dhl.dest.name": "Nom du destinataire",
    "addon.shipping-dhl.dest.street": "Rue",
    "addon.shipping-dhl.dest.city": "Ville",
    "addon.shipping-dhl.dest.needAddress": "Indiquez une ville et un code postal avant d'obtenir les tarifs.",
    "addon.shipping-dhl.parcel.contentsValue": "Imprimés en {gsm}g/m², {packaging}",
    "addon.shipping-dhl.parcel.contentsFrom": "Depuis la commande {ref}, quantité {quantity}",
    "addon.shipping-dhl.parcel.weightFrom": "{kg}kg — {sheets} × SRA3 en {gsm}g/m², {packaging}",
    "addon.shipping-dhl.parcel.weightFromRoll":
      "{kg}kg — {quantity} × support en rouleau de {gsm}g/m², en tube",
    "addon.shipping-dhl.parcel.dimsFrom": "Le colis de cette commande, {packaging}",
    "addon.shipping-dhl.pack.bundled": "en paquets",
    "addon.shipping-dhl.pack.shrinkWrapped": "sous film",
    "addon.shipping-dhl.pack.boxed": "en carton",
    "addon.shipping-dhl.pack.tube": "en tube",

    "addon.shipping-dhl.rates.get": "Obtenir les tarifs",
    "addon.shipping-dhl.rates.title": "Tarifs de ce colis",
    "addon.shipping-dhl.rates.simulated": "Ces services, tarifs et dates viennent d'un transporteur de démonstration. Rien n'est envoyé à un vrai.",
    "addon.shipping-dhl.rates.arrives": "arrive le {date}",
    "addon.shipping-dhl.rates.cheapest": "le moins cher",
    "addon.shipping-dhl.rates.book": "Réserver l'enlèvement",
    "addon.shipping-dhl.rates.cutoffLine":
      "Réservez avant {cutoff} et le chauffeur passe cet après-midi. Il est {now}.",
    "addon.shipping-dhl.rates.cutoffMissed":
      "Il est {now}, après l'heure limite de {cutoff} : la camionnette passera le {day}.",
    "addon.shipping-dhl.service.exp1200": "Express avant 12:00",
    "addon.shipping-dhl.service.expNwd": "Express, jour ouvré suivant",
    "addon.shipping-dhl.service.eco2wd": "Économique, deuxième jour ouvré",

    "addon.shipping-dhl.booked.title": "Enlèvement réservé",
    "addon.shipping-dhl.booked.tracking": "Numéro de suivi",
    "addon.shipping-dhl.booked.window": "Créneau d'enlèvement",
    "addon.shipping-dhl.booked.service": "Service",
    "addon.shipping-dhl.label.download": "Télécharger",
    "addon.shipping-dhl.label.print": "Imprimer",
    "addon.shipping-dhl.tracking.title": "Suivi",
    "addon.shipping-dhl.tracking.simulated": "Transporteur de démonstration — scans simulés",
    "addon.shipping-dhl.event.collected": "Enlevé à l'atelier",
    "addon.shipping-dhl.event.atHub": "Trié au centre de tri",
    "addon.shipping-dhl.event.outForDelivery": "En tournée de livraison",

    "addon.shipping-dhl.error.title": "Le transporteur a refusé cette adresse",
    "addon.shipping-dhl.error.simulated": "Transporteur de démonstration — refus simulé",
    "addon.shipping-dhl.error.remedy1":
      "Vérifiez le code postal par rapport au pays de destination. Un code {country} ressemble à {example}.",
    "addon.shipping-dhl.error.remedy2":
      "Si l'adresse est correcte telle quelle, remettez la commande au comptoir et marquez-la retirée.",
    "addon.shipping-dhl.error.retry": "Réessayer",
    "addon.shipping-dhl.error.postcode": "Code postal",
    "addon.shipping-dhl.error.country": "Pays",

    "addon.shipping-dhl.checkout.title": "Livraison par DHL",
    "addon.shipping-dhl.checkout.sub": "Calculé d'après le contenu de votre panier.",
    "addon.shipping-dhl.checkout.simulated":
      "Ces tarifs viennent d'un transporteur de démonstration. Rien n'est envoyé à un vrai.",
    "addon.shipping-dhl.panel.carrier": "Transporteur",
    "addon.shipping-dhl.panel.due": "Attendu",
    "addon.shipping-dhl.panel.notSent": "Cette commande n'est pas encore partie avec un transporteur.",
    "addon.shipping-dhl.panel.trackIt": "Suivre le colis",
    "addon.shipping-dhl.panel.noPage":
      "Le transporteur de démonstration n'a pas de page de suivi : les étapes ci-dessus sont tout ce qu'il y a.",
  },

  "cs-CZ": {
    // ── Host chrome this add-on owns: the connect sentence, its own settings
    //    panel copy, what a disconnect takes and keeps, and its activity lines.
    "addon.shipping-dhl.what": "Dílna objedná svoz balíku přímo z průvodky, dostane zpět ceny a vytiskne štítek — místo přepisování čísel zásilek do e-mailu.",
    "addon.shipping-dhl.set.demo": "Použít ukázkového dopravce",
    "addon.shipping-dhl.set.demoOn": "Ceny, štítky i sledování se vracejí z připravené náhrady. K opravdovému dopravci se nedostane nic.",
    "addon.shipping-dhl.set.demoOff": "Dotazy jdou k dopravci se zadanými údaji účtu. Zapněte to zpět a přestane to.",
    "addon.shipping-dhl.set.cutoffLabel": "Uzávěrka svozu",
    "addon.shipping-dhl.set.cutoffNote": "Objednejte dřív a řidič přijede ještě odpoledne.",
    "addon.shipping-dhl.set.weights": "Výchozí hmotnosti balíků",
    "addon.shipping-dhl.set.weightsNote": "Spočítané z materiálu a množství na zakázce. Ceník za nimi se upravuje ve vašem panelu Adminium.",
    "addon.shipping-dhl.disconnect.goes": "Průvodce zmizí „Objednat svoz“, pokladně ceny dopravce a stránka zakázky se zákazníkovi vrátí k vyzvednutí v dílně.",
    "addon.shipping-dhl.disconnect.stays": "Už objednané svozy si nechají štítek i číslo zásilky. Údaje účtu se smažou.",
    "addon.shipping-dhl.act.1": "{when} · svoz objednán · {ref}",
    "addon.shipping-dhl.act.2": "{when} · ceny načteny · {ref}",
    "addon.shipping-dhl.act.3": "{when} · štítek stažen · {ref}",

    "addon.shipping-dhl.line":
      "Objedná svoz zásilky k hotové zakázce a vrátí štítek se sledovacím číslem.",
    "addon.shipping-dhl.notAffiliated": "Adminium není nijak spojeno s touto společností.",
    "addon.shipping-dhl.demoChip": "Demo dopravce — žádná skutečná zásilka nevznikla",
    "addon.shipping-dhl.onlyCarrier": "DHL je jediný připojený dopravce.",
    "addon.shipping-dhl.connectAnother": "Další připojíte v Doplňcích.",

    "addon.shipping-dhl.perm.rates": "Zjistit sazby u zásilky, kterou posíláte",
    "addon.shipping-dhl.perm.shipments": "Zakládat zásilky k zakázkám, které expedujete",
    "addon.shipping-dhl.perm.labels": "Stahovat štítky k těmto zásilkám",

    "addon.shipping-dhl.setting.apiKey": "Klíč API",
    "addon.shipping-dhl.setting.accountNumber": "Číslo účtu",
    "addon.shipping-dhl.setting.demo": "Použít místo toho demo dopravce",
    "addon.shipping-dhl.setting.demoHint":
      "Sazby, štítky i sledování se vracejí z připravené náhrady, takže si celý postup vyzkoušíte bez účtu. Skutečnému dopravci se neodesílá nic.",
    "addon.shipping-dhl.setting.cutoff": "Uzávěrka svozu",
    "addon.shipping-dhl.setting.cutoffHint":
      "Objednáte-li dřív, řidič přijede ještě týž den odpoledne.",

    "addon.shipping-dhl.action.book": "Objednat svoz",
    "addon.shipping-dhl.parcel.title": "Zásilka",
    "addon.shipping-dhl.parcel.sub": "Vyplněno ze zakázky. Co nesedí, přepište.",
    "addon.shipping-dhl.parcel.contents": "Obsah",
    "addon.shipping-dhl.parcel.weight": "Hmotnost",
    "addon.shipping-dhl.parcel.dims": "Rozměry",
    "addon.shipping-dhl.parcel.goingTo": "Adresát",

    // ── a customer this add-on cannot place ────────────────────────────────
    "addon.shipping-dhl.dest.unknownTitle": "U tohoto zákazníka není uložená adresa",
    "addon.shipping-dhl.dest.unknownBody": "{customer} není v adresáři tohoto dopravce, proto se nic nepředvyplnilo. Napište, kam zásilka jde — žádná cizí adresa se nedosazuje.",
    "addon.shipping-dhl.dest.name": "Příjemce",
    "addon.shipping-dhl.dest.street": "Ulice",
    "addon.shipping-dhl.dest.city": "Město",
    "addon.shipping-dhl.dest.needAddress": "Doplňte město a PSČ, teprve pak zjistíte sazby.",
    "addon.shipping-dhl.parcel.contentsValue": "Tiskoviny, {gsm}g/m², {packaging}",
    "addon.shipping-dhl.parcel.contentsFrom": "Ze zakázky {ref}, množství {quantity}",
    "addon.shipping-dhl.parcel.weightFrom": "{kg}kg — {sheets} × SRA3 v {gsm}g/m², {packaging}",
    "addon.shipping-dhl.parcel.weightFromRoll":
      "{kg}kg — {quantity} × rolový materiál {gsm}g/m², v tubusu",
    "addon.shipping-dhl.parcel.dimsFrom": "Zásilka k této zakázce, {packaging}",
    "addon.shipping-dhl.pack.bundled": "svázané",
    "addon.shipping-dhl.pack.shrinkWrapped": "zafóliované",
    "addon.shipping-dhl.pack.boxed": "v krabici",
    "addon.shipping-dhl.pack.tube": "v tubusu",

    "addon.shipping-dhl.rates.get": "Zjistit sazby",
    "addon.shipping-dhl.rates.title": "Sazby této zásilky",
    "addon.shipping-dhl.rates.simulated": "Tyto služby, sazby i termíny pocházejí z ukázkového dopravce. Nic se neposílá skutečnému.",
    "addon.shipping-dhl.rates.arrives": "dorazí {date}",
    "addon.shipping-dhl.rates.cheapest": "nejlevnější",
    "addon.shipping-dhl.rates.book": "Objednat svoz",
    "addon.shipping-dhl.rates.cutoffLine":
      "Objednejte do {cutoff} a řidič přijede dnes odpoledne. Teď je {now}.",
    "addon.shipping-dhl.rates.cutoffMissed":
      "Je {now}, tedy po uzávěrce v {cutoff} — vůz přijede {day}.",
    "addon.shipping-dhl.service.exp1200": "Expres do 12:00",
    "addon.shipping-dhl.service.expNwd": "Expres, následující pracovní den",
    "addon.shipping-dhl.service.eco2wd": "Úsporně, druhý pracovní den",

    "addon.shipping-dhl.booked.title": "Svoz objednán",
    "addon.shipping-dhl.booked.tracking": "Sledovací číslo",
    "addon.shipping-dhl.booked.window": "Okno svozu",
    "addon.shipping-dhl.booked.service": "Služba",
    "addon.shipping-dhl.label.download": "Stáhnout",
    "addon.shipping-dhl.label.print": "Vytisknout",
    "addon.shipping-dhl.tracking.title": "Sledování",
    "addon.shipping-dhl.tracking.simulated": "Demo dopravce — tyto záznamy jsou simulované",
    "addon.shipping-dhl.event.collected": "Vyzvednuto v dílně",
    "addon.shipping-dhl.event.atHub": "Roztříděno v depu",
    "addon.shipping-dhl.event.outForDelivery": "Vezeme k adresátovi",

    "addon.shipping-dhl.error.title": "Dopravce tuto adresu nepřijal",
    "addon.shipping-dhl.error.simulated": "Demo dopravce — toto odmítnutí je simulované",
    "addon.shipping-dhl.error.remedy1":
      "Zkontrolujte PSČ oproti cílové zemi. Zápis země {country} vypadá takto: {example}.",
    "addon.shipping-dhl.error.remedy2":
      "Je-li adresa v pořádku, vydejte zakázku na pultu a označte ji jako vyzvednutou.",
    "addon.shipping-dhl.error.retry": "Zkusit znovu",
    "addon.shipping-dhl.error.postcode": "PSČ",
    "addon.shipping-dhl.error.country": "Země",

    "addon.shipping-dhl.checkout.title": "Doručení s DHL",
    "addon.shipping-dhl.checkout.sub": "Spočítáno z obsahu vašeho košíku.",
    "addon.shipping-dhl.checkout.simulated":
      "Tyto sazby vrací demo dopravce. Skutečnému se neodesílá nic.",
    "addon.shipping-dhl.panel.carrier": "Dopravce",
    "addon.shipping-dhl.panel.due": "Očekáváme",
    "addon.shipping-dhl.panel.notSent": "Tato zakázka zatím neodešla s dopravcem.",
    "addon.shipping-dhl.panel.trackIt": "Sledovat zásilku",
    "addon.shipping-dhl.panel.noPage":
      "Demo dopravce nemá vlastní stránku sledování — víc než události výše nenajdete.",
  },

  "da-DK": {
    // ── Host chrome this add-on owns: the connect sentence, its own settings
    //    panel copy, what a disconnect takes and keeps, and its activity lines.
    "addon.shipping-dhl.what": "Det lader værkstedet bestille en pakkeafhentning direkte fra følgesedlen, få priser tilbage og printe en label — i stedet for at taste sporingsnumre ind i en mail.",
    "addon.shipping-dhl.set.demo": "Brug demo-fragtfirmaet",
    "addon.shipping-dhl.set.demoOn": "Priser, labels og sporing kommer fra en indlagt stedfortræder. Intet når et rigtigt fragtfirma.",
    "addon.shipping-dhl.set.demoOff": "Kald går til fragtfirmaet med de kontooplysninger, du indtastede. Slå dette til igen for at standse det.",
    "addon.shipping-dhl.set.cutoffLabel": "Sidste frist for afhentning",
    "addon.shipping-dhl.set.cutoffNote": "Bestil før den, og chaufføren kommer samme eftermiddag.",
    "addon.shipping-dhl.set.weights": "Standardvægte for pakker",
    "addon.shipping-dhl.set.weightsNote": "Regnet ud fra materialet og antallet på opgaven. Prislisten bag dem redigeres i jeres Adminium-dashboard.",
    "addon.shipping-dhl.disconnect.goes": "Følgesedlen mister “Bestil afhentning”, kassen mister fragtfirmaets priser, og kundens ordreside går tilbage til afhentning på værkstedet.",
    "addon.shipping-dhl.disconnect.stays": "Allerede bestilte afhentninger beholder label og sporingsnummer. Kontooplysningerne slettes.",
    "addon.shipping-dhl.act.1": "{when} · afhentning bestilt · {ref}",
    "addon.shipping-dhl.act.2": "{when} · priser hentet · {ref}",
    "addon.shipping-dhl.act.3": "{when} · label hentet · {ref}",

    "addon.shipping-dhl.line":
      "Bestiller afhentning af en pakke til en færdig opgave og henter en label og et sporingsnummer.",
    "addon.shipping-dhl.notAffiliated": "Adminium er ikke tilknyttet dette selskab.",
    "addon.shipping-dhl.demoChip": "Demo-fragtfirma — der blev ikke oprettet en rigtig forsendelse",
    "addon.shipping-dhl.onlyCarrier": "DHL er det eneste tilsluttede fragtfirma.",
    "addon.shipping-dhl.connectAnother": "Tilslut et mere under Add-ons.",

    "addon.shipping-dhl.perm.rates": "Hente priser på en pakke, du sender",
    "addon.shipping-dhl.perm.shipments": "Oprette forsendelser til ordrer, I sender af sted",
    "addon.shipping-dhl.perm.labels": "Hente labels til de forsendelser",

    "addon.shipping-dhl.setting.apiKey": "API-nøgle",
    "addon.shipping-dhl.setting.accountNumber": "Kundenummer",
    "addon.shipping-dhl.setting.demo": "Brug demo-fragtfirmaet i stedet",
    "addon.shipping-dhl.setting.demoHint":
      "Priser, labels og sporing kommer fra en fast stedfortræder, så I kan prøve hele forløbet uden en konto. Der sendes intet til et rigtigt fragtfirma.",
    "addon.shipping-dhl.setting.cutoff": "Sidste frist for afhentning",
    "addon.shipping-dhl.setting.cutoffHint":
      "Bestil inden da, så kommer chaufføren samme eftermiddag.",

    "addon.shipping-dhl.action.book": "Bestil afhentning",
    "addon.shipping-dhl.parcel.title": "Pakken",
    "addon.shipping-dhl.parcel.sub": "Udfyldt fra opgaven. Ret det, der ikke passer.",
    "addon.shipping-dhl.parcel.contents": "Indhold",
    "addon.shipping-dhl.parcel.weight": "Vægt",
    "addon.shipping-dhl.parcel.dims": "Mål",
    "addon.shipping-dhl.parcel.goingTo": "Sendes til",

    // ── a customer this add-on cannot place ────────────────────────────────
    "addon.shipping-dhl.dest.unknownTitle": "Der er ingen adresse på denne kunde",
    "addon.shipping-dhl.dest.unknownBody": "{customer} står ikke i fragtfirmaets adressebog, så intet er udfyldt på forhånd. Skriv, hvor pakken skal hen — der bruges ikke en anden kundes adresse i stedet.",
    "addon.shipping-dhl.dest.name": "Modtager",
    "addon.shipping-dhl.dest.street": "Vej og nummer",
    "addon.shipping-dhl.dest.city": "By",
    "addon.shipping-dhl.dest.needAddress": "Udfyld by og postnummer, før du henter priser.",
    "addon.shipping-dhl.parcel.contentsValue": "Tryksager på {gsm}g/m², {packaging}",
    "addon.shipping-dhl.parcel.contentsFrom": "Fra opgave {ref}, antal {quantity}",
    "addon.shipping-dhl.parcel.weightFrom": "{kg}kg — {sheets} × SRA3 på {gsm}g/m², {packaging}",
    "addon.shipping-dhl.parcel.weightFromRoll":
      "{kg}kg — {quantity} × rullemateriale på {gsm}g/m², i et rør",
    "addon.shipping-dhl.parcel.dimsFrom": "Pakken til denne opgave, {packaging}",
    "addon.shipping-dhl.pack.bundled": "i bundter",
    "addon.shipping-dhl.pack.shrinkWrapped": "i krympefolie",
    "addon.shipping-dhl.pack.boxed": "i kasse",
    "addon.shipping-dhl.pack.tube": "i et rør",

    "addon.shipping-dhl.rates.get": "Hent priser",
    "addon.shipping-dhl.rates.title": "Priser for denne pakke",
    "addon.shipping-dhl.rates.simulated": "Disse services, priser og datoer kommer fra et demo-fragtfirma. Intet sendes til et rigtigt.",
    "addon.shipping-dhl.rates.arrives": "fremme {date}",
    "addon.shipping-dhl.rates.cheapest": "billigst",
    "addon.shipping-dhl.rates.book": "Bestil afhentningen",
    "addon.shipping-dhl.rates.cutoffLine":
      "Bestil inden {cutoff}, så kommer chaufføren i eftermiddag. Klokken er {now}.",
    "addon.shipping-dhl.rates.cutoffMissed":
      "Klokken er {now} og dermed efter fristen {cutoff} — bilen kommer {day}.",
    "addon.shipping-dhl.service.exp1200": "Ekspres inden kl. 12:00",
    "addon.shipping-dhl.service.expNwd": "Ekspres, næste hverdag",
    "addon.shipping-dhl.service.eco2wd": "Økonomi, anden hverdag",

    "addon.shipping-dhl.booked.title": "Afhentning bestilt",
    "addon.shipping-dhl.booked.tracking": "Sporingsnummer",
    "addon.shipping-dhl.booked.window": "Afhentningsvindue",
    "addon.shipping-dhl.booked.service": "Service",
    "addon.shipping-dhl.label.download": "Hent",
    "addon.shipping-dhl.label.print": "Udskriv",
    "addon.shipping-dhl.tracking.title": "Sporing",
    "addon.shipping-dhl.tracking.simulated": "Demo-fragtfirma — disse scanninger er simulerede",
    "addon.shipping-dhl.event.collected": "Hentet på værkstedet",
    "addon.shipping-dhl.event.atHub": "Sorteret i terminalen",
    "addon.shipping-dhl.event.outForDelivery": "Med chaufføren ud",

    "addon.shipping-dhl.error.title": "Fragtfirmaet ville ikke tage denne adresse",
    "addon.shipping-dhl.error.simulated": "Demo-fragtfirma — dette afslag er simuleret",
    "addon.shipping-dhl.error.remedy1":
      "Tjek postnummeret mod modtagerlandet. Et {country}-postnummer ser sådan ud: {example}.",
    "addon.shipping-dhl.error.remedy2":
      "Er adressen rigtig, som den står, så udlevér opgaven over disken og markér den som afhentet.",
    "addon.shipping-dhl.error.retry": "Prøv igen",
    "addon.shipping-dhl.error.postcode": "Postnummer",
    "addon.shipping-dhl.error.country": "Land",

    "addon.shipping-dhl.checkout.title": "Levering med DHL",
    "addon.shipping-dhl.checkout.sub": "Regnet ud fra indholdet af din kurv.",
    "addon.shipping-dhl.checkout.simulated":
      "Priserne her kommer fra et demo-fragtfirma. Der sendes intet til et rigtigt.",
    "addon.shipping-dhl.panel.carrier": "Fragtfirma",
    "addon.shipping-dhl.panel.due": "Ventes",
    "addon.shipping-dhl.panel.notSent": "Denne ordre er endnu ikke sendt af sted med et fragtfirma.",
    "addon.shipping-dhl.panel.trackIt": "Følg pakken",
    "addon.shipping-dhl.panel.noPage":
      "Demo-fragtfirmaet har ingen sporingsside — hændelserne ovenfor er det hele.",
  },

  "zh-CN": {
    // ── Host chrome this add-on owns: the connect sentence, its own settings
    //    panel copy, what a disconnect takes and keeps, and its activity lines.
    "addon.shipping-dhl.what": "工坊可以直接从工单预约取件、拿回运价并打印面单，不必再把运单号抄进邮件。",
    "addon.shipping-dhl.set.demo": "使用演示快递",
    "addon.shipping-dhl.set.demoOn": "运价、面单和轨迹都来自预置的替身。没有任何内容送到真实快递公司。",
    "addon.shipping-dhl.set.demoOff": "请求会带着您填的账号信息发往快递公司。重新打开这一项即可停止。",
    "addon.shipping-dhl.set.cutoffLabel": "取件截止时间",
    "addon.shipping-dhl.set.cutoffNote": "在此之前预约，司机当天下午就来。",
    "addon.shipping-dhl.set.weights": "默认包裹重量",
    "addon.shipping-dhl.set.weightsNote": "按工单上的材料与数量算出。背后的价目表在您的 Adminium 面板里维护。",
    "addon.shipping-dhl.disconnect.goes": "工单少了“预约取件”，结算页少了快递运价，客户的订单页也回到工坊自取。",
    "addon.shipping-dhl.disconnect.stays": "已预约的取件保留面单与运单号。账号信息会被删除。",
    "addon.shipping-dhl.act.1": "{when} · 已预约取件 · {ref}",
    "addon.shipping-dhl.act.2": "{when} · 已取运价 · {ref}",
    "addon.shipping-dhl.act.3": "{when} · 已下载面单 · {ref}",

    "addon.shipping-dhl.line": "为已就绪的工单预约包裹取件，并取回面单与运单号。",
    "addon.shipping-dhl.notAffiliated": "Adminium 与该公司没有任何关联。",
    "addon.shipping-dhl.demoChip": "演示承运商 — 未创建任何真实运单",
    "addon.shipping-dhl.onlyCarrier": "目前只连接了 DHL 一家快递公司。",
    "addon.shipping-dhl.connectAnother": "在“插件”中再连接一家。",

    "addon.shipping-dhl.perm.rates": "查询你要寄出的包裹运费",
    "addon.shipping-dhl.perm.shipments": "为你发出的订单创建运单",
    "addon.shipping-dhl.perm.labels": "下载这些运单的面单",

    "addon.shipping-dhl.setting.apiKey": "API 密钥",
    "addon.shipping-dhl.setting.accountNumber": "账号",
    "addon.shipping-dhl.setting.demo": "改用演示承运商",
    "addon.shipping-dhl.setting.demoHint":
      "运费、面单和轨迹都来自预置的替身，无需账号即可走完整个流程。不会向真实承运商发送任何内容。",
    "addon.shipping-dhl.setting.cutoff": "取件截止时间",
    "addon.shipping-dhl.setting.cutoffHint": "在此之前下单，司机当天下午就来。",

    "addon.shipping-dhl.action.book": "预约取件",
    "addon.shipping-dhl.parcel.title": "包裹",
    "addon.shipping-dhl.parcel.sub": "根据工单填好。有不对的地方直接改。",
    "addon.shipping-dhl.parcel.contents": "内容物",
    "addon.shipping-dhl.parcel.weight": "重量",
    "addon.shipping-dhl.parcel.dims": "尺寸",
    "addon.shipping-dhl.parcel.goingTo": "寄往",

    // ── a customer this add-on cannot place ────────────────────────────────
    "addon.shipping-dhl.dest.unknownTitle": "这位客户没有存过地址",
    "addon.shipping-dhl.dest.unknownBody": "{customer} 不在本承运商的地址簿里，所以没有预填任何内容。请填写包裹寄往何处 —— 不会拿别的客户的地址来顶替。",
    "addon.shipping-dhl.dest.name": "收件人",
    "addon.shipping-dhl.dest.street": "街道",
    "addon.shipping-dhl.dest.city": "城市",
    "addon.shipping-dhl.dest.needAddress": "先填城市和邮编，再查询运费。",
    "addon.shipping-dhl.parcel.contentsValue": "{gsm}克纸印品，{packaging}",
    "addon.shipping-dhl.parcel.contentsFrom": "来自工单 {ref}，数量 {quantity}",
    "addon.shipping-dhl.parcel.weightFrom": "{kg}公斤 — {sheets} 张 SRA3，{gsm}克纸，{packaging}",
    "addon.shipping-dhl.parcel.weightFromRoll": "{kg}公斤 — {quantity} 份 {gsm}克卷材，装筒",
    "addon.shipping-dhl.parcel.dimsFrom": "该工单的包裹，{packaging}",
    "addon.shipping-dhl.pack.bundled": "打捆",
    "addon.shipping-dhl.pack.shrinkWrapped": "热缩膜包",
    "addon.shipping-dhl.pack.boxed": "装箱",
    "addon.shipping-dhl.pack.tube": "装筒",

    "addon.shipping-dhl.rates.get": "查询运费",
    "addon.shipping-dhl.rates.title": "这件包裹的运费",
    "addon.shipping-dhl.rates.simulated": "这些服务、运费和日期都来自演示承运商，不会发给真实承运商。",
    "addon.shipping-dhl.rates.arrives": "{date} 送达",
    "addon.shipping-dhl.rates.cheapest": "最便宜",
    "addon.shipping-dhl.rates.book": "预约取件",
    "addon.shipping-dhl.rates.cutoffLine": "{cutoff} 前预约，司机今天下午就来。现在是 {now}。",
    "addon.shipping-dhl.rates.cutoffMissed": "现在是 {now}，已过 {cutoff} 的截止时间，车 {day} 来。",
    "addon.shipping-dhl.service.exp1200": "特快，12:00 前送达",
    "addon.shipping-dhl.service.expNwd": "特快，次个工作日",
    "addon.shipping-dhl.service.eco2wd": "经济，第二个工作日",

    "addon.shipping-dhl.booked.title": "取件已预约",
    "addon.shipping-dhl.booked.tracking": "运单号",
    "addon.shipping-dhl.booked.window": "取件时段",
    "addon.shipping-dhl.booked.service": "服务",
    "addon.shipping-dhl.label.download": "下载",
    "addon.shipping-dhl.label.print": "打印",
    "addon.shipping-dhl.tracking.title": "物流轨迹",
    "addon.shipping-dhl.tracking.simulated": "演示承运商 — 这些轨迹为模拟结果",
    "addon.shipping-dhl.event.collected": "已在车间取件",
    "addon.shipping-dhl.event.atHub": "已在转运中心分拣",
    "addon.shipping-dhl.event.outForDelivery": "派送员已带出",

    "addon.shipping-dhl.error.title": "承运商不接受这个地址",
    "addon.shipping-dhl.error.simulated": "演示承运商 — 此次拒收为模拟结果",
    "addon.shipping-dhl.error.remedy1": "对照收件国家核对邮编。{country} 的邮编形如 {example}。",
    "addon.shipping-dhl.error.remedy2": "地址本身没错的话，就在柜台把这批活交给客户，并标记为已自取。",
    "addon.shipping-dhl.error.retry": "再试一次",
    "addon.shipping-dhl.error.postcode": "邮编",
    "addon.shipping-dhl.error.country": "国家/地区",

    "addon.shipping-dhl.checkout.title": "由 DHL 送达",
    "addon.shipping-dhl.checkout.sub": "根据购物车里的东西算出来的。",
    "addon.shipping-dhl.checkout.simulated": "这些运费来自演示承运商，不会发给真实承运商。",
    "addon.shipping-dhl.panel.carrier": "承运商",
    "addon.shipping-dhl.panel.due": "预计",
    "addon.shipping-dhl.panel.notSent": "这份订单还没有交给快递发出。",
    "addon.shipping-dhl.panel.trackIt": "查看物流",
    "addon.shipping-dhl.panel.noPage": "演示承运商没有自己的查询页面 — 上面的轨迹就是全部。",
  },

  "zh-TW": {
    // ── Host chrome this add-on owns: the connect sentence, its own settings
    //    panel copy, what a disconnect takes and keeps, and its activity lines.
    "addon.shipping-dhl.what": "工坊可以直接從工單預約取件、拿回運價並列印面單，不必再把貨運單號抄進郵件。",
    "addon.shipping-dhl.set.demo": "使用示範快遞",
    "addon.shipping-dhl.set.demoOn": "運價、面單和軌跡都來自預置的替身。沒有任何內容送到真實快遞公司。",
    "addon.shipping-dhl.set.demoOff": "請求會帶著您填的帳號資訊送往快遞公司。重新打開這一項即可停止。",
    "addon.shipping-dhl.set.cutoffLabel": "取件截止時間",
    "addon.shipping-dhl.set.cutoffNote": "在此之前預約，司機當天下午就來。",
    "addon.shipping-dhl.set.weights": "預設包裹重量",
    "addon.shipping-dhl.set.weightsNote": "依工單上的材料與數量算出。背後的價目表在您的 Adminium 面板裡維護。",
    "addon.shipping-dhl.disconnect.goes": "工單少了「預約取件」，結帳頁少了快遞運價，客戶的訂單頁也回到工坊自取。",
    "addon.shipping-dhl.disconnect.stays": "已預約的取件保留面單與貨運單號。帳號資訊會被刪除。",
    "addon.shipping-dhl.act.1": "{when} · 已預約取件 · {ref}",
    "addon.shipping-dhl.act.2": "{when} · 已取運價 · {ref}",
    "addon.shipping-dhl.act.3": "{when} · 已下載面單 · {ref}",

    "addon.shipping-dhl.line": "為已就緒的工單預約包裹取件，並取回託運單與追蹤號碼。",
    "addon.shipping-dhl.notAffiliated": "Adminium 與該公司並無任何關聯。",
    "addon.shipping-dhl.demoChip": "示範業者 — 未建立任何真實託運",
    "addon.shipping-dhl.onlyCarrier": "目前只連接了 DHL 一家貨運公司。",
    "addon.shipping-dhl.connectAnother": "在「附加元件」裡再連接一家。",

    "addon.shipping-dhl.perm.rates": "查詢你要寄出的包裹運費",
    "addon.shipping-dhl.perm.shipments": "為你出貨的訂單建立託運單",
    "addon.shipping-dhl.perm.labels": "下載這些託運單的標籤",

    "addon.shipping-dhl.setting.apiKey": "API 金鑰",
    "addon.shipping-dhl.setting.accountNumber": "帳號",
    "addon.shipping-dhl.setting.demo": "改用示範業者",
    "addon.shipping-dhl.setting.demoHint":
      "運費、標籤與追蹤都來自預設的替身，不必開帳號就能走完整個流程。不會送出任何東西給真實業者。",
    "addon.shipping-dhl.setting.cutoff": "取件截止時間",
    "addon.shipping-dhl.setting.cutoffHint": "在這之前預約，司機當天下午就到。",

    "addon.shipping-dhl.action.book": "預約取件",
    "addon.shipping-dhl.parcel.title": "包裹",
    "addon.shipping-dhl.parcel.sub": "依工單填好。有不對的地方直接改。",
    "addon.shipping-dhl.parcel.contents": "內容物",
    "addon.shipping-dhl.parcel.weight": "重量",
    "addon.shipping-dhl.parcel.dims": "尺寸",
    "addon.shipping-dhl.parcel.goingTo": "寄往",

    // ── a customer this add-on cannot place ────────────────────────────────
    "addon.shipping-dhl.dest.unknownTitle": "這位客戶沒有存過地址",
    "addon.shipping-dhl.dest.unknownBody": "{customer} 不在本業者的地址簿裡，因此沒有預先填入任何內容。請填寫包裹要寄到哪裡 —— 不會拿別的客戶的地址來頂替。",
    "addon.shipping-dhl.dest.name": "收件人",
    "addon.shipping-dhl.dest.street": "街道",
    "addon.shipping-dhl.dest.city": "城市",
    "addon.shipping-dhl.dest.needAddress": "先填城市和郵遞區號，再查詢運費。",
    "addon.shipping-dhl.parcel.contentsValue": "{gsm}磅紙印刷品，{packaging}",
    "addon.shipping-dhl.parcel.contentsFrom": "來自工單 {ref}，數量 {quantity}",
    "addon.shipping-dhl.parcel.weightFrom": "{kg}公斤 — {sheets} 張 SRA3，{gsm}磅紙，{packaging}",
    "addon.shipping-dhl.parcel.weightFromRoll": "{kg}公斤 — {quantity} 份 {gsm}磅捲材，裝筒",
    "addon.shipping-dhl.parcel.dimsFrom": "這張工單的包裹，{packaging}",
    "addon.shipping-dhl.pack.bundled": "綁捆",
    "addon.shipping-dhl.pack.shrinkWrapped": "收縮膜包",
    "addon.shipping-dhl.pack.boxed": "裝箱",
    "addon.shipping-dhl.pack.tube": "裝筒",

    "addon.shipping-dhl.rates.get": "查詢運費",
    "addon.shipping-dhl.rates.title": "這件包裹的運費",
    "addon.shipping-dhl.rates.simulated": "這些服務、運費和日期都來自示範業者，不會送給真實業者。",
    "addon.shipping-dhl.rates.arrives": "{date} 送達",
    "addon.shipping-dhl.rates.cheapest": "最便宜",
    "addon.shipping-dhl.rates.book": "預約取件",
    "addon.shipping-dhl.rates.cutoffLine": "{cutoff} 前預約，司機今天下午就到。現在是 {now}。",
    "addon.shipping-dhl.rates.cutoffMissed": "現在是 {now}，已過 {cutoff} 的截止時間，車 {day} 才來。",
    "addon.shipping-dhl.service.exp1200": "快捷，12:00 前送達",
    "addon.shipping-dhl.service.expNwd": "快捷，次一個工作天",
    "addon.shipping-dhl.service.eco2wd": "經濟，第二個工作天",

    "addon.shipping-dhl.booked.title": "取件已預約",
    "addon.shipping-dhl.booked.tracking": "追蹤號碼",
    "addon.shipping-dhl.booked.window": "取件時段",
    "addon.shipping-dhl.booked.service": "服務",
    "addon.shipping-dhl.label.download": "下載",
    "addon.shipping-dhl.label.print": "列印",
    "addon.shipping-dhl.tracking.title": "追蹤紀錄",
    "addon.shipping-dhl.tracking.simulated": "示範業者 — 這些紀錄為模擬結果",
    "addon.shipping-dhl.event.collected": "已在工坊取件",
    "addon.shipping-dhl.event.atHub": "已在轉運站分揀",
    "addon.shipping-dhl.event.outForDelivery": "外務員已帶出",

    "addon.shipping-dhl.error.title": "貨運業者不收這個地址",
    "addon.shipping-dhl.error.simulated": "示範業者 — 此次拒收為模擬結果",
    "addon.shipping-dhl.error.remedy1": "對照收件國家核對郵遞區號。{country} 的寫法像 {example}。",
    "addon.shipping-dhl.error.remedy2": "地址本身沒錯的話，就在櫃檯把這批件交給客戶，並標記為已自取。",
    "addon.shipping-dhl.error.retry": "再試一次",
    "addon.shipping-dhl.error.postcode": "郵遞區號",
    "addon.shipping-dhl.error.country": "國家/地區",

    "addon.shipping-dhl.checkout.title": "由 DHL 配送",
    "addon.shipping-dhl.checkout.sub": "依購物車裡的東西算出來的。",
    "addon.shipping-dhl.checkout.simulated": "這些運費來自示範業者，不會送給真實業者。",
    "addon.shipping-dhl.panel.carrier": "貨運業者",
    "addon.shipping-dhl.panel.due": "預計",
    "addon.shipping-dhl.panel.notSent": "這份訂單還沒有交給貨運寄出。",
    "addon.shipping-dhl.panel.trackIt": "查看配送",
    "addon.shipping-dhl.panel.noPage": "示範業者沒有自己的查詢頁 — 上面的紀錄就是全部。",
  },

  "ar-EG": {
    // ── Host chrome this add-on owns: the connect sentence, its own settings
    //    panel copy, what a disconnect takes and keeps, and its activity lines.
    "addon.shipping-dhl.what": "يتيح للمطبعة حجز استلام طرد من بطاقة الشغل نفسها، واستعادة الأسعار وطباعة ملصق — بدل كتابة أرقام التتبّع في رسالة بريد.",
    "addon.shipping-dhl.set.demo": "استخدم شركة الشحن التجريبية",
    "addon.shipping-dhl.set.demoOn": "الأسعار والملصقات والتتبّع تأتي من بديل مُعدّ سلفًا. لا يصل شيء إلى شركة شحن حقيقية.",
    "addon.shipping-dhl.set.demoOff": "تذهب الطلبات إلى شركة الشحن ببيانات الحساب التي أدخلتها. أعد تشغيل هذا لإيقاف ذلك.",
    "addon.shipping-dhl.set.cutoffLabel": "آخر موعد للاستلام",
    "addon.shipping-dhl.set.cutoffNote": "احجز قبله ويأتي السائق بعد ظهر اليوم نفسه.",
    "addon.shipping-dhl.set.weights": "أوزان الطرود الافتراضية",
    "addon.shipping-dhl.set.weightsNote": "محسوبة من الخامة والكمية في الشغلة. أما قائمة الأسعار خلفها فتُحرَّر في لوحة Adminium.",
    "addon.shipping-dhl.disconnect.goes": "تفقد بطاقة الشغل «احجز استلامًا»، وتفقد صفحة الدفع أسعار شركة الشحن، وتعود صفحة طلب العميل إلى الاستلام من المطبعة.",
    "addon.shipping-dhl.disconnect.stays": "عمليات الاستلام المحجوزة تحتفظ بملصقاتها وأرقام تتبّعها. وتُحذف بيانات الحساب.",
    "addon.shipping-dhl.act.1": "{when} · حُجز استلام · {ref}",
    "addon.shipping-dhl.act.2": "{when} · جُلبت الأسعار · {ref}",
    "addon.shipping-dhl.act.3": "{when} · نُزّل الملصق · {ref}",

    "addon.shipping-dhl.line":
      "يحجز موعد استلام طرد لأمر شغل جاهز، ويرجّع ملصق الشحن ورقم التتبّع.",
    "addon.shipping-dhl.notAffiliated": "لا توجد أي علاقة بين Adminium وهذه الشركة.",
    "addon.shipping-dhl.demoChip": "شركة شحن تجريبية — لم تُنشأ أي شحنة حقيقية",
    "addon.shipping-dhl.onlyCarrier": "‏DHL هي شركة التوصيل الوحيدة الموصولة.",
    "addon.shipping-dhl.connectAnother": "أضف غيرها من صفحة الإضافات.",

    "addon.shipping-dhl.perm.rates": "جلب أسعار طرد أنت بصدد إرساله",
    "addon.shipping-dhl.perm.shipments": "إنشاء شحنات للطلبات التي تُخرجها من المطبعة",
    "addon.shipping-dhl.perm.labels": "تنزيل ملصقات تلك الشحنات",

    "addon.shipping-dhl.setting.apiKey": "مفتاح الـ API",
    "addon.shipping-dhl.setting.accountNumber": "رقم الحساب",
    "addon.shipping-dhl.setting.demo": "استخدم شركة الشحن التجريبية بدلاً منها",
    "addon.shipping-dhl.setting.demoHint":
      "الأسعار والملصقات والتتبّع كلها من بديل مُعدّ سلفًا، فتجرّب المسار كاملًا دون حساب. ولا يُرسَل أي شيء إلى شركة شحن حقيقية.",
    "addon.shipping-dhl.setting.cutoff": "آخر موعد لطلب الاستلام",
    "addon.shipping-dhl.setting.cutoffHint": "احجز قبله يمر السائق بعد ظهر اليوم نفسه.",

    "addon.shipping-dhl.action.book": "احجز موعد استلام",
    "addon.shipping-dhl.parcel.title": "الطرد",
    "addon.shipping-dhl.parcel.sub": "مملوء من أمر الشغل. عدّل ما لا يطابق.",
    "addon.shipping-dhl.parcel.contents": "المحتويات",
    "addon.shipping-dhl.parcel.weight": "الوزن",
    "addon.shipping-dhl.parcel.dims": "الأبعاد",
    "addon.shipping-dhl.parcel.goingTo": "إلى",

    // ── a customer this add-on cannot place ────────────────────────────────
    "addon.shipping-dhl.dest.unknownTitle": "لا يوجد عنوان محفوظ لهذا العميل",
    "addon.shipping-dhl.dest.unknownBody": "{customer} غير مسجَّل في دفتر عناوين شركة الشحن، لذلك لم يُملأ شيء. اكتب وجهة الطرد — لن يُستخدم عنوان عميل آخر بدلًا منه.",
    "addon.shipping-dhl.dest.name": "المرسَل إليه",
    "addon.shipping-dhl.dest.street": "الشارع",
    "addon.shipping-dhl.dest.city": "المدينة",
    "addon.shipping-dhl.dest.needAddress": "اكتب المدينة والرمز البريدي قبل جلب الأسعار.",
    "addon.shipping-dhl.parcel.contentsValue": "مطبوعات على ورق {gsm} جم/م²، {packaging}",
    "addon.shipping-dhl.parcel.contentsFrom": "من أمر الشغل {ref}، الكمية {quantity}",
    "addon.shipping-dhl.parcel.weightFrom": "{kg} كجم — {sheets} × SRA3 من ورق {gsm} جم/م²، {packaging}",
    "addon.shipping-dhl.parcel.weightFromRoll":
      "{kg} كجم — {quantity} × خامة لفّة {gsm} جم/م²، في أسطوانة",
    "addon.shipping-dhl.parcel.dimsFrom": "طرد أمر الشغل هذا، {packaging}",
    "addon.shipping-dhl.pack.bundled": "مربوط في رزم",
    "addon.shipping-dhl.pack.shrinkWrapped": "مغلّف بالحرارة",
    "addon.shipping-dhl.pack.boxed": "في كرتونة",
    "addon.shipping-dhl.pack.tube": "في أسطوانة",

    "addon.shipping-dhl.rates.get": "اجلب الأسعار",
    "addon.shipping-dhl.rates.title": "أسعار هذا الطرد",
    "addon.shipping-dhl.rates.simulated": "هذه الخدمات والأسعار والتواريخ من شركة شحن تجريبية. لا يُرسل شيء إلى شركة حقيقية.",
    "addon.shipping-dhl.rates.arrives": "يصل {date}",
    "addon.shipping-dhl.rates.cheapest": "الأرخص",
    "addon.shipping-dhl.rates.book": "احجز الاستلام",
    "addon.shipping-dhl.rates.cutoffLine":
      "احجز قبل {cutoff} يمر السائق بعد ظهر اليوم. الساعة الآن {now}.",
    "addon.shipping-dhl.rates.cutoffMissed":
      "الساعة {now}، أي بعد آخر موعد {cutoff} — ستمر السيارة يوم {day}.",
    "addon.shipping-dhl.service.exp1200": "سريع، قبل 12:00",
    "addon.shipping-dhl.service.expNwd": "سريع، يوم العمل التالي",
    "addon.shipping-dhl.service.eco2wd": "اقتصادي، ثاني يوم عمل",

    "addon.shipping-dhl.booked.title": "تم حجز الاستلام",
    "addon.shipping-dhl.booked.tracking": "رقم التتبّع",
    "addon.shipping-dhl.booked.window": "نافذة الاستلام",
    "addon.shipping-dhl.booked.service": "الخدمة",
    "addon.shipping-dhl.label.download": "تنزيل",
    "addon.shipping-dhl.label.print": "طباعة",
    "addon.shipping-dhl.tracking.title": "التتبّع",
    "addon.shipping-dhl.tracking.simulated": "شركة شحن تجريبية — هذه الحركات محاكاة",
    "addon.shipping-dhl.event.collected": "استُلم من المطبعة",
    "addon.shipping-dhl.event.atHub": "فُرز في المستودع",
    "addon.shipping-dhl.event.outForDelivery": "مع مندوب التوصيل",

    "addon.shipping-dhl.error.title": "شركة الشحن رفضت هذا العنوان",
    "addon.shipping-dhl.error.simulated": "شركة شحن تجريبية — هذا الرفض محاكاة",
    "addon.shipping-dhl.error.remedy1":
      "راجع الرمز البريدي مقابل بلد الوصول. رمز {country} يبدو هكذا: {example}.",
    "addon.shipping-dhl.error.remedy2":
      "إن كان العنوان صحيحًا كما هو، سلّم الشغل من على المكتب وسجّله مُستلمًا.",
    "addon.shipping-dhl.error.retry": "حاول مرة أخرى",
    "addon.shipping-dhl.error.postcode": "الرمز البريدي",
    "addon.shipping-dhl.error.country": "البلد",

    "addon.shipping-dhl.checkout.title": "التوصيل عبر DHL",
    "addon.shipping-dhl.checkout.sub": "محسوبة مما في سلّتك.",
    "addon.shipping-dhl.checkout.simulated":
      "هذه الأسعار من شركة شحن تجريبية. ولا يُرسَل شيء إلى شركة حقيقية.",
    "addon.shipping-dhl.panel.carrier": "شركة الشحن",
    "addon.shipping-dhl.panel.due": "متوقّع",
    "addon.shipping-dhl.panel.notSent": "لم يخرج هذا الطلب مع شركة شحن بعد.",
    "addon.shipping-dhl.panel.trackIt": "تتبّع الشحنة",
    "addon.shipping-dhl.panel.noPage":
      "شركة الشحن التجريبية ليس لها صفحة تتبّع خاصة — الأحداث أعلاه هي كل ما هناك.",
  },
} as const;

/** English defines the keys; the other seven must carry every one of them. */
export type StringKey = keyof (typeof strings)["en-US"];

export type LocaleTag = keyof typeof strings;

export const LOCALE_TAGS = Object.keys(strings) as LocaleTag[];

/**
 * Parity, enforced at COMPILE time rather than by a test that might not run.
 *
 * The annotation is the assertion: if a locale is missing a key or has grown
 * one English does not have, this line stops compiling. It is the same guard
 * the host's `messages/index.ts` puts around its own areas, restated here
 * because this repo builds on its own.
 */
const _parity: { [L in LocaleTag]: Record<StringKey, string> } = strings;
void _parity;
