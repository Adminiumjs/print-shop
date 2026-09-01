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
    "addon.shipping-dhl.what": "This lets the shop book a parcel collection from an order that is ready, get rates back and print a label, instead of typing tracking numbers into an email.",
    "addon.shipping-dhl.set.demo": "Use the demo carrier",
    "addon.shipping-dhl.set.demoOn": "Rates, labels and tracking come back from a seeded stand-in. Nothing reaches a real carrier.",
    "addon.shipping-dhl.set.demoOff":
      "In a real shop the calls would go to the carrier with the account details you entered. Nothing is sent from this demo either way — rates, labels and tracking still come back from the seeded stand-in.",
    "addon.shipping-dhl.set.cutoffLabel": "Collection cut-off",
    "addon.shipping-dhl.set.cutoffNote": "Book before this and the driver comes the same afternoon.",
    "addon.shipping-dhl.set.weights": "Default parcel weights",
    "addon.shipping-dhl.set.weightsNote": "Worked out from what the shop says one of each weighs, plus the box. The rate card behind them is edited in your Adminium dashboard.",
    "addon.shipping-dhl.set.weightAssumed": "{kg} kg — assumed",
    "addon.shipping-dhl.set.weightKg": "{kg} kg",
    "addon.shipping-dhl.disconnect.goes": "The order loses “Book a collection”, checkout loses the carrier's rates, and a customer's order page goes back to collection from the shop. The account details are deleted.",
    "addon.shipping-dhl.disconnect.stays": "Collections already booked keep their labels and tracking numbers.",
    "addon.shipping-dhl.act.1": "{when} · collection booked · {ref}",
    "addon.shipping-dhl.act.2": "{when} · rates fetched · {ref}",
    "addon.shipping-dhl.act.3": "{when} · label downloaded · {ref}",

    // ── the add-on itself ──────────────────────────────────────────────────
    "addon.shipping-dhl.line": "Books a parcel collection from an order that is ready, and brings back a label and a tracking reference.",
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
    "addon.shipping-dhl.parcel.sub": "Filled in from the order. Change anything wrong.",
    "addon.shipping-dhl.parcel.contents": "Contents",
    "addon.shipping-dhl.parcel.weight": "Weight",
    "addon.shipping-dhl.parcel.dims": "Dimensions",
    "addon.shipping-dhl.parcel.goingTo": "Going to",

    // ── a customer this add-on cannot place ────────────────────────────────
    "addon.shipping-dhl.dest.unknownTitle": "No address for this parcel",
    "addon.shipping-dhl.dest.unknownBody": "The shop has not said where {customer}'s parcel is going, so nothing has been filled in. Type the address — no other customer's is used in its place.",
    "addon.shipping-dhl.dest.name": "Send to",
    "addon.shipping-dhl.dest.street": "Street",
    "addon.shipping-dhl.dest.city": "Town or city",
    "addon.shipping-dhl.dest.needAddress": "Add a town and a postcode before you get rates.",
    "addon.shipping-dhl.parcel.contentsValue": "{quantity} × {what}",
    "addon.shipping-dhl.parcel.contentsValueMore": "{quantity} × {what} and {more} more",
    "addon.shipping-dhl.parcel.contentsFrom": "From order {ref}, quantity {quantity}",
    "addon.shipping-dhl.parcel.weightFrom": "{kg}kg — {quantity} at {each}g each, plus the box",
    "addon.shipping-dhl.parcel.weightAssumed": "{kg}kg — the shop has not said what these weigh: {what}. Type the real weight here.",
    "addon.shipping-dhl.parcel.dimsFrom": "A box sized for what is in it",
    "addon.shipping-dhl.parcel.dimsFromTube": "Rolled in a tube — the longest piece is over 60cm",

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
    "addon.shipping-dhl.service.exp1200": "Express by {by}",
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
    "addon.shipping-dhl.event.collected": "Picked up from the shop",
    "addon.shipping-dhl.event.atHub": "Sorted at the depot",
    "addon.shipping-dhl.event.outForDelivery": "Out with the driver",

    // ── the refusal ────────────────────────────────────────────────────────
    "addon.shipping-dhl.error.title": "The carrier would not take this address",
    "addon.shipping-dhl.error.simulated": "Demo carrier — this refusal is simulated",
    "addon.shipping-dhl.error.remedy1":
      "Check the postcode against the country it is going to. For {country} it looks like {example}.",
    "addon.shipping-dhl.error.remedy2": "If the address is right as it stands, hand the parcel over the counter and mark it collected.",
    "addon.shipping-dhl.error.retry": "Try again",
    "addon.shipping-dhl.error.postcode": "Postcode",
    "addon.shipping-dhl.error.country": "Country",

    // ── the customer's two surfaces ────────────────────────────────────────
    "addon.shipping-dhl.checkout.title": "Delivery by DHL",
    "addon.shipping-dhl.checkout.sub": "Worked out from what is in your basket.",
    "addon.shipping-dhl.checkout.fromReady":
      "Counted from {day}, the first day the shop can hand this over.",
    "addon.shipping-dhl.checkout.simulated":
      "These rates come from a demo carrier. Nothing is sent to a real one.",
    "addon.shipping-dhl.panel.carrier": "Carrier",
    "addon.shipping-dhl.panel.due": "Due",
    "addon.shipping-dhl.panel.notSent": "This order has not gone out with a carrier yet.",
    "addon.shipping-dhl.panel.trackIt": "Track it",
    "addon.shipping-dhl.panel.noPage":
      "The demo carrier has no tracking page of its own — the events above are all of it.",

    // ── the inbound half: a prepaid return label (31 O4) ──────────────────
    "addon.shipping-dhl.returns.title": "Prepaid return label",
    "addon.shipping-dhl.returns.intro": "Get a label to send this back. The shop pays the carriage — you put the label on the parcel and hand it over.",
    "addon.shipping-dhl.returns.toDepot": "It goes back to {name}, {city}.",
    "addon.shipping-dhl.returns.notSetUp": "The shop has not given the carrier a returns address yet, so no label can be made here.",
    "addon.shipping-dhl.returns.sender": "Collected from your address",
    "addon.shipping-dhl.returns.senderName": "Your name",
    "addon.shipping-dhl.returns.parcelNote": "A small parcel is assumed — about {kg} kg with the box. The depot weighs what actually arrives.",
    "addon.shipping-dhl.returns.make": "Get the prepaid label",
    "addon.shipping-dhl.returns.made": "Return label ready",
    "addon.shipping-dhl.returns.apply": "Print it, fix it to the parcel and hand the parcel over. The tracking follows it back.",
    "addon.shipping-dhl.set.returns": "Returns address",
    "addon.shipping-dhl.set.returnsName": "Name on the label",
    "addon.shipping-dhl.set.returnsNote": "Where a customer's return parcel is delivered. With no address here, the return surface says so and makes nothing.",
    "addon.shipping-dhl.setting.returnsName": "Returns address — name on the label",
    "addon.shipping-dhl.setting.returnsLines": "Returns address — street",
    "addon.shipping-dhl.setting.returnsCity": "Returns address — town or city",
    "addon.shipping-dhl.setting.returnsPostcode": "Returns address — postcode",
    "addon.shipping-dhl.setting.returnsCountry": "Returns address — country",
  },

  "de-DE": {
    // ── Host chrome this add-on owns: the connect sentence, its own settings
    //    panel copy, what a disconnect takes and keeps, and its activity lines.
    "addon.shipping-dhl.what": "Damit bucht der Betrieb eine Paketabholung direkt aus einem versandfertigen Auftrag, bekommt Preise zurück und druckt ein Label, statt Sendungsnummern in eine E-Mail zu tippen.",
    "addon.shipping-dhl.set.demo": "Den Demo-Versanddienst nutzen",
    "addon.shipping-dhl.set.demoOn": "Preise, Etiketten und Sendungsverfolgung kommen aus einem hinterlegten Ersatz. Nichts erreicht einen echten Versanddienst.",
    "addon.shipping-dhl.set.demoOff":
      "In einem echten Betrieb gingen die Anfragen mit den eingegebenen Kontodaten an den Versanddienst. Aus dieser Demo wird so oder so nichts gesendet — Preise, Etiketten und Sendungsverfolgung kommen weiterhin aus dem hinterlegten Ersatz.",
    "addon.shipping-dhl.set.cutoffLabel": "Annahmeschluss für die Abholung",
    "addon.shipping-dhl.set.cutoffNote": "Vorher gebucht, und der Fahrer kommt noch am selben Nachmittag.",
    "addon.shipping-dhl.set.weights": "Voreingestellte Paketgewichte",
    "addon.shipping-dhl.set.weightsNote": "Errechnet aus dem Stückgewicht, das der Betrieb angibt, plus Karton. Die Preisliste dahinter wird in Ihrem Adminium-Dashboard gepflegt.",
    "addon.shipping-dhl.set.weightAssumed": "{kg} kg — angenommen",
    "addon.shipping-dhl.set.weightKg": "{kg} kg",
    "addon.shipping-dhl.disconnect.goes": "Der Auftrag verliert „Abholung buchen“, die Kasse verliert die Preise des Dienstleisters, und die Bestellseite der Kundschaft zeigt wieder Abholung im Betrieb. Die Kontodaten werden gelöscht.",
    "addon.shipping-dhl.disconnect.stays": "Bereits gebuchte Abholungen behalten Etikett und Sendungsnummer.",
    "addon.shipping-dhl.act.1": "{when} · Abholung gebucht · {ref}",
    "addon.shipping-dhl.act.2": "{when} · Preise abgerufen · {ref}",
    "addon.shipping-dhl.act.3": "{when} · Etikett geladen · {ref}",

    "addon.shipping-dhl.line": "Bucht eine Paketabholung zu einem versandfertigen Auftrag und liefert Label und Sendungsnummer zurück.",
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
    "addon.shipping-dhl.dest.unknownTitle": "Keine Adresse für dieses Paket",
    "addon.shipping-dhl.dest.unknownBody": "Der Betrieb hat nicht angegeben, wohin das Paket für {customer} geht, deshalb ist nichts vorausgefüllt. Tragen Sie die Adresse ein — es wird keine andere Adresse ersatzweise verwendet.",
    "addon.shipping-dhl.dest.name": "Empfänger",
    "addon.shipping-dhl.dest.street": "Straße",
    "addon.shipping-dhl.dest.city": "Ort",
    "addon.shipping-dhl.dest.needAddress": "Ort und Postleitzahl eintragen, dann Preise abrufen.",
    "addon.shipping-dhl.parcel.contentsValue": "{quantity} × {what}",
    "addon.shipping-dhl.parcel.contentsValueMore": "{quantity} × {what} und {more} weitere",
    "addon.shipping-dhl.parcel.contentsFrom": "Aus Auftrag {ref}, Menge {quantity}",
    "addon.shipping-dhl.parcel.weightFrom": "{kg}kg — {quantity} à {each}g, plus Karton",
    "addon.shipping-dhl.parcel.weightAssumed": "{kg}kg — der Betrieb hat kein Gewicht angegeben für: {what}. Tragen Sie hier das echte Gewicht ein.",
    "addon.shipping-dhl.parcel.dimsFrom": "Ein Karton, passend zum Inhalt",
    "addon.shipping-dhl.parcel.dimsFromTube": "Gerollt in einer Hülse — das längste Stück misst über 60cm",

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
    "addon.shipping-dhl.service.exp1200": "Express bis {by}",
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
    "addon.shipping-dhl.event.collected": "Im Betrieb abgeholt",
    "addon.shipping-dhl.event.atHub": "Im Verteilzentrum bearbeitet",
    "addon.shipping-dhl.event.outForDelivery": "Beim Fahrer zur Zustellung",

    "addon.shipping-dhl.error.title": "Der Versender hat diese Adresse abgelehnt",
    "addon.shipping-dhl.error.simulated": "Demo-Versender — diese Ablehnung ist simuliert",
    "addon.shipping-dhl.error.remedy1":
      "Prüfen Sie die Postleitzahl gegen das Zielland. Eine aus {country} sieht aus wie {example}.",
    "addon.shipping-dhl.error.remedy2": "Stimmt die Adresse so, geben Sie das Paket über den Tresen und markieren Sie es als abgeholt.",
    "addon.shipping-dhl.error.retry": "Erneut versuchen",
    "addon.shipping-dhl.error.postcode": "Postleitzahl",
    "addon.shipping-dhl.error.country": "Land",

    "addon.shipping-dhl.checkout.title": "Zustellung mit DHL",
    "addon.shipping-dhl.checkout.sub": "Aus dem Inhalt Ihres Warenkorbs ermittelt.",
    "addon.shipping-dhl.checkout.fromReady":
      "Gerechnet ab {day}, dem ersten Tag, an dem der Laden das Paket abgeben kann.",
    "addon.shipping-dhl.checkout.simulated":
      "Diese Preise kommen von einem Demo-Versender. Es geht nichts an einen echten.",
    "addon.shipping-dhl.panel.carrier": "Versender",
    "addon.shipping-dhl.panel.due": "Erwartet",
    "addon.shipping-dhl.panel.notSent": "Dieser Auftrag ist noch nicht mit einem Versender unterwegs.",
    "addon.shipping-dhl.panel.trackIt": "Sendung verfolgen",
    "addon.shipping-dhl.panel.noPage":
      "Der Demo-Versender hat keine eigene Verfolgungsseite — mehr als die Ereignisse oben gibt es nicht.",

    // ── the inbound half: a prepaid return label (31 O4) ──────────────────
    "addon.shipping-dhl.returns.title": "Vorausbezahltes Rücksendeetikett",
    "addon.shipping-dhl.returns.intro": "Holen Sie ein Etikett, um dies zurückzuschicken. Der Betrieb übernimmt das Porto — Sie kleben das Etikett auf das Paket und geben es ab.",
    "addon.shipping-dhl.returns.toDepot": "Es geht zurück an {name}, {city}.",
    "addon.shipping-dhl.returns.notSetUp": "Der Betrieb hat dem Versanddienst noch keine Rücksendeadresse genannt, deshalb kann hier kein Etikett erstellt werden.",
    "addon.shipping-dhl.returns.sender": "Abholung an Ihrer Adresse",
    "addon.shipping-dhl.returns.senderName": "Ihr Name",
    "addon.shipping-dhl.returns.parcelNote": "Angenommen wird ein kleines Paket — etwa {kg} kg mit Karton. Das Depot wiegt, was tatsächlich ankommt.",
    "addon.shipping-dhl.returns.make": "Vorausbezahltes Etikett erstellen",
    "addon.shipping-dhl.returns.made": "Rücksendeetikett bereit",
    "addon.shipping-dhl.returns.apply": "Drucken Sie es, kleben Sie es auf das Paket und geben Sie das Paket ab. Die Sendungsverfolgung begleitet es zurück.",
    "addon.shipping-dhl.set.returns": "Rücksendeadresse",
    "addon.shipping-dhl.set.returnsName": "Name auf dem Etikett",
    "addon.shipping-dhl.set.returnsNote": "Wohin das Rücksendepaket einer Kundin oder eines Kunden geliefert wird. Ohne Adresse hier sagt die Rücksendefläche genau das und erstellt nichts.",
    "addon.shipping-dhl.setting.returnsName": "Rücksendeadresse — Name auf dem Etikett",
    "addon.shipping-dhl.setting.returnsLines": "Rücksendeadresse — Straße",
    "addon.shipping-dhl.setting.returnsCity": "Rücksendeadresse — Ort",
    "addon.shipping-dhl.setting.returnsPostcode": "Rücksendeadresse — Postleitzahl",
    "addon.shipping-dhl.setting.returnsCountry": "Rücksendeadresse — Land",
  },

  "fr-FR": {
    // ── Host chrome this add-on owns: the connect sentence, its own settings
    //    panel copy, what a disconnect takes and keeps, and its activity lines.
    "addon.shipping-dhl.what": "L'atelier réserve un enlèvement de colis depuis une commande prête, récupère les tarifs et imprime une étiquette, au lieu de recopier des numéros de suivi dans un e-mail.",
    "addon.shipping-dhl.set.demo": "Utiliser le transporteur de démonstration",
    "addon.shipping-dhl.set.demoOn": "Tarifs, étiquettes et suivi viennent d'un substitut pré-rempli. Rien n'atteint un vrai transporteur.",
    "addon.shipping-dhl.set.demoOff":
      "Dans une boutique réelle, les appels partiraient chez le transporteur avec les identifiants saisis. Rien ne quitte cette démo dans un cas comme dans l’autre : les tarifs, les étiquettes et le suivi viennent toujours du remplaçant intégré.",
    "addon.shipping-dhl.set.cutoffLabel": "Heure limite d'enlèvement",
    "addon.shipping-dhl.set.cutoffNote": "Réservez avant, et le chauffeur passe le même après-midi.",
    "addon.shipping-dhl.set.weights": "Poids de colis par défaut",
    "addon.shipping-dhl.set.weightsNote": "Calculés d'après le poids unitaire indiqué par l'atelier, plus le carton. Les tarifs derrière eux se modifient dans votre tableau de bord Adminium.",
    "addon.shipping-dhl.set.weightAssumed": "{kg} kg — estimé",
    "addon.shipping-dhl.set.weightKg": "{kg} kg",
    "addon.shipping-dhl.disconnect.goes": "La commande perd « Réserver un enlèvement », la caisse perd les tarifs du transporteur, et la page de commande du client revient au retrait à l'atelier. Les identifiants sont supprimés.",
    "addon.shipping-dhl.disconnect.stays": "Les enlèvements déjà réservés gardent leur étiquette et leur numéro de suivi.",
    "addon.shipping-dhl.act.1": "{when} · enlèvement réservé · {ref}",
    "addon.shipping-dhl.act.2": "{when} · tarifs demandés · {ref}",
    "addon.shipping-dhl.act.3": "{when} · étiquette téléchargée · {ref}",

    "addon.shipping-dhl.line": "Réserve un enlèvement de colis pour une commande prête et renvoie une étiquette et un numéro de suivi.",
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
    "addon.shipping-dhl.dest.unknownTitle": "Aucune adresse pour ce colis",
    "addon.shipping-dhl.dest.unknownBody": "L'atelier n'a pas indiqué où va le colis de {customer} ; rien n'a été prérempli. Saisissez l'adresse — aucune autre adresse client n'est utilisée à la place.",
    "addon.shipping-dhl.dest.name": "Nom du destinataire",
    "addon.shipping-dhl.dest.street": "Rue",
    "addon.shipping-dhl.dest.city": "Ville",
    "addon.shipping-dhl.dest.needAddress": "Indiquez une ville et un code postal avant d'obtenir les tarifs.",
    "addon.shipping-dhl.parcel.contentsValue": "{quantity} × {what}",
    "addon.shipping-dhl.parcel.contentsValueMore": "{quantity} × {what} et {more} de plus",
    "addon.shipping-dhl.parcel.contentsFrom": "Depuis la commande {ref}, quantité {quantity}",
    "addon.shipping-dhl.parcel.weightFrom": "{kg}kg — {quantity} à {each}g pièce, plus le carton",
    "addon.shipping-dhl.parcel.weightAssumed": "{kg}kg — l'atelier n'a pas donné de poids pour : {what}. Saisissez ici le poids réel.",
    "addon.shipping-dhl.parcel.dimsFrom": "Un carton à la taille du contenu",
    "addon.shipping-dhl.parcel.dimsFromTube": "Roulé en tube — la pièce la plus longue dépasse 60cm",

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
    "addon.shipping-dhl.service.exp1200": "Express avant {by}",
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
    "addon.shipping-dhl.error.remedy2": "Si l'adresse est correcte telle quelle, remettez le colis au comptoir et marquez-le comme retiré.",
    "addon.shipping-dhl.error.retry": "Réessayer",
    "addon.shipping-dhl.error.postcode": "Code postal",
    "addon.shipping-dhl.error.country": "Pays",

    "addon.shipping-dhl.checkout.title": "Livraison par DHL",
    "addon.shipping-dhl.checkout.sub": "Calculé d'après le contenu de votre panier.",
    "addon.shipping-dhl.checkout.fromReady":
      "Compté à partir du {day}, premier jour où la boutique peut le remettre.",
    "addon.shipping-dhl.checkout.simulated":
      "Ces tarifs viennent d'un transporteur de démonstration. Rien n'est envoyé à un vrai.",
    "addon.shipping-dhl.panel.carrier": "Transporteur",
    "addon.shipping-dhl.panel.due": "Attendu",
    "addon.shipping-dhl.panel.notSent": "Cette commande n'est pas encore partie avec un transporteur.",
    "addon.shipping-dhl.panel.trackIt": "Suivre le colis",
    "addon.shipping-dhl.panel.noPage":
      "Le transporteur de démonstration n'a pas de page de suivi : les étapes ci-dessus sont tout ce qu'il y a.",

    // ── the inbound half: a prepaid return label (31 O4) ──────────────────
    "addon.shipping-dhl.returns.title": "Étiquette de retour prépayée",
    "addon.shipping-dhl.returns.intro": "Obtenez une étiquette pour renvoyer ceci. L'atelier prend le transport en charge — collez l'étiquette sur le colis et déposez-le.",
    "addon.shipping-dhl.returns.toDepot": "Il repart vers {name}, {city}.",
    "addon.shipping-dhl.returns.notSetUp": "L'atelier n'a pas encore indiqué d'adresse de retour au transporteur ; aucune étiquette ne peut donc être créée ici.",
    "addon.shipping-dhl.returns.sender": "Enlèvement à votre adresse",
    "addon.shipping-dhl.returns.senderName": "Votre nom",
    "addon.shipping-dhl.returns.parcelNote": "Un petit colis est supposé — environ {kg} kg avec le carton. Le dépôt pèse ce qui arrive réellement.",
    "addon.shipping-dhl.returns.make": "Obtenir l'étiquette prépayée",
    "addon.shipping-dhl.returns.made": "Étiquette de retour prête",
    "addon.shipping-dhl.returns.apply": "Imprimez-la, fixez-la sur le colis et déposez le colis. Le suivi l'accompagne au retour.",
    "addon.shipping-dhl.set.returns": "Adresse de retour",
    "addon.shipping-dhl.set.returnsName": "Nom sur l'étiquette",
    "addon.shipping-dhl.set.returnsNote": "Où est livré le colis de retour d'un client. Sans adresse ici, la surface de retour le dit et ne crée rien.",
    "addon.shipping-dhl.setting.returnsName": "Adresse de retour — nom sur l'étiquette",
    "addon.shipping-dhl.setting.returnsLines": "Adresse de retour — rue",
    "addon.shipping-dhl.setting.returnsCity": "Adresse de retour — ville",
    "addon.shipping-dhl.setting.returnsPostcode": "Adresse de retour — code postal",
    "addon.shipping-dhl.setting.returnsCountry": "Adresse de retour — pays",
  },

  "cs-CZ": {
    // ── Host chrome this add-on owns: the connect sentence, its own settings
    //    panel copy, what a disconnect takes and keeps, and its activity lines.
    "addon.shipping-dhl.what": "Dílna si tím objedná svoz balíku přímo z připravené objednávky, dostane zpět ceny a vytiskne štítek, místo přepisování čísel zásilek do e-mailu.",
    "addon.shipping-dhl.set.demo": "Použít ukázkového dopravce",
    "addon.shipping-dhl.set.demoOn": "Ceny, štítky i sledování se vracejí z připravené náhrady. K opravdovému dopravci se nedostane nic.",
    "addon.shipping-dhl.set.demoOff":
      "Ve skutečném obchodě by dotazy šly k dopravci se zadanými údaji účtu. Z této ukázky se tak jako tak nic neodesílá — ceny, štítky i sledování stále vrací zabudovaná náhrada.",
    "addon.shipping-dhl.set.cutoffLabel": "Uzávěrka svozu",
    "addon.shipping-dhl.set.cutoffNote": "Objednejte dřív a řidič přijede ještě odpoledne.",
    "addon.shipping-dhl.set.weights": "Výchozí hmotnosti balíků",
    "addon.shipping-dhl.set.weightsNote": "Spočítané z hmotnosti jednoho kusu, kterou uvádí dílna, plus krabice. Ceník za nimi se upravuje ve vašem panelu Adminium.",
    "addon.shipping-dhl.set.weightAssumed": "{kg} kg — odhad",
    "addon.shipping-dhl.set.weightKg": "{kg} kg",
    "addon.shipping-dhl.disconnect.goes": "Objednávka přijde o „Objednat svoz“, pokladna o ceny dopravce a stránka objednávky zákazníka se vrátí k vyzvednutí v dílně. Údaje účtu se smažou.",
    "addon.shipping-dhl.disconnect.stays": "Už objednané svozy si nechají štítek i číslo zásilky.",
    "addon.shipping-dhl.act.1": "{when} · svoz objednán · {ref}",
    "addon.shipping-dhl.act.2": "{when} · ceny načteny · {ref}",
    "addon.shipping-dhl.act.3": "{when} · štítek stažen · {ref}",

    "addon.shipping-dhl.line": "Objedná svoz balíku k připravené objednávce a vrátí štítek a číslo zásilky.",
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
    "addon.shipping-dhl.parcel.sub": "Vyplněno z objednávky. Co nesedí, přepište.",
    "addon.shipping-dhl.parcel.contents": "Obsah",
    "addon.shipping-dhl.parcel.weight": "Hmotnost",
    "addon.shipping-dhl.parcel.dims": "Rozměry",
    "addon.shipping-dhl.parcel.goingTo": "Adresát",

    // ── a customer this add-on cannot place ────────────────────────────────
    "addon.shipping-dhl.dest.unknownTitle": "K této zásilce není adresa",
    "addon.shipping-dhl.dest.unknownBody": "Dílna neuvedla, kam má zásilka {customer} jít, takže není nic předvyplněno. Napište adresu — žádná jiná adresa se místo ní nepoužije.",
    "addon.shipping-dhl.dest.name": "Příjemce",
    "addon.shipping-dhl.dest.street": "Ulice",
    "addon.shipping-dhl.dest.city": "Město",
    "addon.shipping-dhl.dest.needAddress": "Doplňte město a PSČ, teprve pak zjistíte sazby.",
    "addon.shipping-dhl.parcel.contentsValue": "{quantity} × {what}",
    "addon.shipping-dhl.parcel.contentsValueMore": "{quantity} × {what} a {more} dalších",
    "addon.shipping-dhl.parcel.contentsFrom": "Z objednávky {ref}, množství {quantity}",
    "addon.shipping-dhl.parcel.weightFrom": "{kg}kg — {quantity} po {each}g, plus krabice",
    "addon.shipping-dhl.parcel.weightAssumed": "{kg}kg — dílna neuvedla hmotnost u: {what}. Napište sem skutečnou hmotnost.",
    "addon.shipping-dhl.parcel.dimsFrom": "Krabice na míru obsahu",
    "addon.shipping-dhl.parcel.dimsFromTube": "Sroluje se do tubusu — nejdelší kus přesahuje 60cm",

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
    "addon.shipping-dhl.service.exp1200": "Expres do {by}",
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
    "addon.shipping-dhl.error.remedy2": "Pokud je adresa správně, předejte zásilku přes pult a označte ji jako vyzvednutou.",
    "addon.shipping-dhl.error.retry": "Zkusit znovu",
    "addon.shipping-dhl.error.postcode": "PSČ",
    "addon.shipping-dhl.error.country": "Země",

    "addon.shipping-dhl.checkout.title": "Doručení s DHL",
    "addon.shipping-dhl.checkout.sub": "Spočítáno z obsahu vašeho košíku.",
    "addon.shipping-dhl.checkout.fromReady":
      "Počítáno od {day}, což je nejbližší den, kdy to obchod může předat.",
    "addon.shipping-dhl.checkout.simulated":
      "Tyto sazby vrací demo dopravce. Skutečnému se neodesílá nic.",
    "addon.shipping-dhl.panel.carrier": "Dopravce",
    "addon.shipping-dhl.panel.due": "Očekáváme",
    "addon.shipping-dhl.panel.notSent": "Tato zakázka zatím neodešla s dopravcem.",
    "addon.shipping-dhl.panel.trackIt": "Sledovat zásilku",
    "addon.shipping-dhl.panel.noPage":
      "Demo dopravce nemá vlastní stránku sledování — víc než události výše nenajdete.",

    // ── the inbound half: a prepaid return label (31 O4) ──────────────────
    "addon.shipping-dhl.returns.title": "Předplacený štítek k vrácení",
    "addon.shipping-dhl.returns.intro": "Získejte štítek a pošlete to zpět. Přepravu hradí dílna — štítek nalepíte na balík a balík předáte.",
    "addon.shipping-dhl.returns.toDepot": "Míří zpět na adresu {name}, {city}.",
    "addon.shipping-dhl.returns.notSetUp": "Dílna dopravci zatím nesdělila adresu vratek, takže tu štítek vytvořit nejde.",
    "addon.shipping-dhl.returns.sender": "Vyzvednutí na vaší adrese",
    "addon.shipping-dhl.returns.senderName": "Vaše jméno",
    "addon.shipping-dhl.returns.parcelNote": "Počítá se s malým balíkem — zhruba {kg} kg i s krabicí. Depo zváží, co skutečně dorazí.",
    "addon.shipping-dhl.returns.make": "Získat předplacený štítek",
    "addon.shipping-dhl.returns.made": "Štítek k vrácení je připraven",
    "addon.shipping-dhl.returns.apply": "Vytiskněte ho, nalepte na balík a balík předejte. Sledování jde s ním celou cestu zpět.",
    "addon.shipping-dhl.set.returns": "Adresa vratek",
    "addon.shipping-dhl.set.returnsName": "Jméno na štítku",
    "addon.shipping-dhl.set.returnsNote": "Kam se doručí vrácený balík zákazníka. Bez adresy to plocha vratek řekne a nic nevytvoří.",
    "addon.shipping-dhl.setting.returnsName": "Adresa vratek — jméno na štítku",
    "addon.shipping-dhl.setting.returnsLines": "Adresa vratek — ulice",
    "addon.shipping-dhl.setting.returnsCity": "Adresa vratek — město",
    "addon.shipping-dhl.setting.returnsPostcode": "Adresa vratek — PSČ",
    "addon.shipping-dhl.setting.returnsCountry": "Adresa vratek — země",
  },

  "da-DK": {
    // ── Host chrome this add-on owns: the connect sentence, its own settings
    //    panel copy, what a disconnect takes and keeps, and its activity lines.
    "addon.shipping-dhl.what": "Med den kan værkstedet bestille afhentning af en pakke direkte fra en ordre, der er klar, få priser retur og printe en label i stedet for at taste sporingsnumre ind i en mail.",
    "addon.shipping-dhl.set.demo": "Brug demo-fragtfirmaet",
    "addon.shipping-dhl.set.demoOn": "Priser, labels og sporing kommer fra en indlagt stedfortræder. Intet når et rigtigt fragtfirma.",
    "addon.shipping-dhl.set.demoOff":
      "I en rigtig butik ville kaldene gå til fragtfirmaet med de kontooplysninger, du indtastede. Der sendes ikke noget fra denne demo under nogen omstændigheder — priser, labels og sporing kommer stadig fra den indbyggede stedfortræder.",
    "addon.shipping-dhl.set.cutoffLabel": "Sidste frist for afhentning",
    "addon.shipping-dhl.set.cutoffNote": "Bestil før den, og chaufføren kommer samme eftermiddag.",
    "addon.shipping-dhl.set.weights": "Standardvægte for pakker",
    "addon.shipping-dhl.set.weightsNote": "Regnet ud fra den stykvægt, værkstedet oplyser, plus kassen. Prislisten bag dem redigeres i jeres Adminium-dashboard.",
    "addon.shipping-dhl.set.weightAssumed": "{kg} kg — anslået",
    "addon.shipping-dhl.set.weightKg": "{kg} kg",
    "addon.shipping-dhl.disconnect.goes": "Ordren mister “Bestil afhentning”, kassen mister transportørens priser, og kundens ordreside går tilbage til afhentning på værkstedet. Kontooplysningerne slettes.",
    "addon.shipping-dhl.disconnect.stays": "Allerede bestilte afhentninger beholder label og sporingsnummer.",
    "addon.shipping-dhl.act.1": "{when} · afhentning bestilt · {ref}",
    "addon.shipping-dhl.act.2": "{when} · priser hentet · {ref}",
    "addon.shipping-dhl.act.3": "{when} · label hentet · {ref}",

    "addon.shipping-dhl.line": "Bestiller afhentning af en pakke til en ordre, der er klar, og henter label og sporingsnummer tilbage.",
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
    "addon.shipping-dhl.parcel.sub": "Udfyldt fra ordren. Ret det, der ikke passer.",
    "addon.shipping-dhl.parcel.contents": "Indhold",
    "addon.shipping-dhl.parcel.weight": "Vægt",
    "addon.shipping-dhl.parcel.dims": "Mål",
    "addon.shipping-dhl.parcel.goingTo": "Sendes til",

    // ── a customer this add-on cannot place ────────────────────────────────
    "addon.shipping-dhl.dest.unknownTitle": "Ingen adresse til denne pakke",
    "addon.shipping-dhl.dest.unknownBody": "Værkstedet har ikke oplyst, hvor pakken til {customer} skal hen, så intet er udfyldt. Skriv adressen — ingen anden kundes adresse bruges i stedet.",
    "addon.shipping-dhl.dest.name": "Modtager",
    "addon.shipping-dhl.dest.street": "Vej og nummer",
    "addon.shipping-dhl.dest.city": "By",
    "addon.shipping-dhl.dest.needAddress": "Udfyld by og postnummer, før du henter priser.",
    "addon.shipping-dhl.parcel.contentsValue": "{quantity} × {what}",
    "addon.shipping-dhl.parcel.contentsValueMore": "{quantity} × {what} og {more} mere",
    "addon.shipping-dhl.parcel.contentsFrom": "Fra ordre {ref}, antal {quantity}",
    "addon.shipping-dhl.parcel.weightFrom": "{kg}kg — {quantity} à {each}g stykket, plus kassen",
    "addon.shipping-dhl.parcel.weightAssumed": "{kg}kg — værkstedet har ikke oplyst vægten på: {what}. Skriv den rigtige vægt her.",
    "addon.shipping-dhl.parcel.dimsFrom": "En kasse i størrelsen efter indholdet",
    "addon.shipping-dhl.parcel.dimsFromTube": "Rullet i et rør — det længste stykke er over 60cm",

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
    "addon.shipping-dhl.service.exp1200": "Ekspres inden kl. {by}",
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
    "addon.shipping-dhl.error.remedy2": "Er adressen rigtig, som den står, så udlevér pakken over disken og markér den som afhentet.",
    "addon.shipping-dhl.error.retry": "Prøv igen",
    "addon.shipping-dhl.error.postcode": "Postnummer",
    "addon.shipping-dhl.error.country": "Land",

    "addon.shipping-dhl.checkout.title": "Levering med DHL",
    "addon.shipping-dhl.checkout.sub": "Regnet ud fra indholdet af din kurv.",
    "addon.shipping-dhl.checkout.fromReady":
      "Regnet fra {day}, den første dag butikken kan aflevere pakken.",
    "addon.shipping-dhl.checkout.simulated":
      "Priserne her kommer fra et demo-fragtfirma. Der sendes intet til et rigtigt.",
    "addon.shipping-dhl.panel.carrier": "Fragtfirma",
    "addon.shipping-dhl.panel.due": "Ventes",
    "addon.shipping-dhl.panel.notSent": "Denne ordre er endnu ikke sendt af sted med et fragtfirma.",
    "addon.shipping-dhl.panel.trackIt": "Følg pakken",
    "addon.shipping-dhl.panel.noPage":
      "Demo-fragtfirmaet har ingen sporingsside — hændelserne ovenfor er det hele.",

    // ── the inbound half: a prepaid return label (31 O4) ──────────────────
    "addon.shipping-dhl.returns.title": "Forudbetalt returetiket",
    "addon.shipping-dhl.returns.intro": "Få en etiket til at sende dette tilbage. Værkstedet betaler fragten — du sætter etiketten på pakken og afleverer den.",
    "addon.shipping-dhl.returns.toDepot": "Den går tilbage til {name}, {city}.",
    "addon.shipping-dhl.returns.notSetUp": "Værkstedet har endnu ikke givet fragtfirmaet en returadresse, så der kan ikke laves en etiket her.",
    "addon.shipping-dhl.returns.sender": "Afhentes på din adresse",
    "addon.shipping-dhl.returns.senderName": "Dit navn",
    "addon.shipping-dhl.returns.parcelNote": "Der regnes med en lille pakke — cirka {kg} kg med kassen. Depotet vejer det, der faktisk ankommer.",
    "addon.shipping-dhl.returns.make": "Få den forudbetalte etiket",
    "addon.shipping-dhl.returns.made": "Returetiketten er klar",
    "addon.shipping-dhl.returns.apply": "Print den, sæt den på pakken og aflever pakken. Sporingen følger den tilbage.",
    "addon.shipping-dhl.set.returns": "Returadresse",
    "addon.shipping-dhl.set.returnsName": "Navn på etiketten",
    "addon.shipping-dhl.set.returnsNote": "Hvor en kundes returpakke leveres. Uden en adresse her siger returfladen det og laver ingenting.",
    "addon.shipping-dhl.setting.returnsName": "Returadresse — navn på etiketten",
    "addon.shipping-dhl.setting.returnsLines": "Returadresse — gade",
    "addon.shipping-dhl.setting.returnsCity": "Returadresse — by",
    "addon.shipping-dhl.setting.returnsPostcode": "Returadresse — postnummer",
    "addon.shipping-dhl.setting.returnsCountry": "Returadresse — land",
  },

  "zh-CN": {
    // ── Host chrome this add-on owns: the connect sentence, its own settings
    //    panel copy, what a disconnect takes and keeps, and its activity lines.
    "addon.shipping-dhl.what": "让店里直接从已备好的订单预约包裹取件，取回运费并打印面单，不必再把单号敲进邮件里。",
    "addon.shipping-dhl.set.demo": "使用演示快递",
    "addon.shipping-dhl.set.demoOn": "运价、面单和轨迹都来自预置的替身。没有任何内容送到真实快递公司。",
    "addon.shipping-dhl.set.demoOff":
      "在真实的店铺里，请求会带着您填的账号信息发往快递公司。但这个演示无论如何都不会向外发送任何东西——价格、面单和物流轨迹仍旧来自内置的替身。",
    "addon.shipping-dhl.set.cutoffLabel": "取件截止时间",
    "addon.shipping-dhl.set.cutoffNote": "在此之前预约，司机当天下午就来。",
    "addon.shipping-dhl.set.weights": "默认包裹重量",
    "addon.shipping-dhl.set.weightsNote": "按店里给出的单件重量加上包装箱算出。其后的价目表在 Adminium 控制台里修改。",
    "addon.shipping-dhl.set.weightAssumed": "{kg} 公斤 — 估算",
    "addon.shipping-dhl.set.weightKg": "{kg} 公斤",
    "addon.shipping-dhl.disconnect.goes": "订单上不再有“预约取件”，收银台不再显示承运商运费，客户的订单页恢复为到店自取。账号信息会被删除。",
    "addon.shipping-dhl.disconnect.stays": "已预约的取件保留面单与运单号。",
    "addon.shipping-dhl.act.1": "{when} · 已预约取件 · {ref}",
    "addon.shipping-dhl.act.2": "{when} · 已取运价 · {ref}",
    "addon.shipping-dhl.act.3": "{when} · 已下载面单 · {ref}",

    "addon.shipping-dhl.line": "为已备好的订单预约包裹取件，并取回面单和运单号。",
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
    "addon.shipping-dhl.parcel.sub": "根据订单填好。有不对的地方请改。",
    "addon.shipping-dhl.parcel.contents": "内容物",
    "addon.shipping-dhl.parcel.weight": "重量",
    "addon.shipping-dhl.parcel.dims": "尺寸",
    "addon.shipping-dhl.parcel.goingTo": "寄往",

    // ── a customer this add-on cannot place ────────────────────────────────
    "addon.shipping-dhl.dest.unknownTitle": "这件包裹没有地址",
    "addon.shipping-dhl.dest.unknownBody": "店里没有说明 {customer} 的包裹寄往何处，因此没有预填任何内容。请填写地址——不会用其他客户的地址顶替。",
    "addon.shipping-dhl.dest.name": "收件人",
    "addon.shipping-dhl.dest.street": "街道",
    "addon.shipping-dhl.dest.city": "城市",
    "addon.shipping-dhl.dest.needAddress": "先填城市和邮编，再查询运费。",
    "addon.shipping-dhl.parcel.contentsValue": "{quantity} × {what}",
    "addon.shipping-dhl.parcel.contentsValueMore": "{quantity} × {what}，另有 {more} 项",
    "addon.shipping-dhl.parcel.contentsFrom": "来自订单 {ref}，数量 {quantity}",
    "addon.shipping-dhl.parcel.weightFrom": "{kg} 公斤 — {quantity} 件，每件 {each} 克，加包装箱",
    "addon.shipping-dhl.parcel.weightAssumed": "{kg} 公斤 — 店里没有给出这些的重量：{what}。请在此填写实际重量。",
    "addon.shipping-dhl.parcel.dimsFrom": "按内容物大小配的箱子",
    "addon.shipping-dhl.parcel.dimsFromTube": "卷成筒装——最长的一件超过 60 厘米",

    "addon.shipping-dhl.rates.get": "查询运费",
    "addon.shipping-dhl.rates.title": "这件包裹的运费",
    "addon.shipping-dhl.rates.simulated": "这些服务、运费和日期都来自演示承运商，不会发给真实承运商。",
    "addon.shipping-dhl.rates.arrives": "{date} 送达",
    "addon.shipping-dhl.rates.cheapest": "最便宜",
    "addon.shipping-dhl.rates.book": "预约取件",
    "addon.shipping-dhl.rates.cutoffLine": "{cutoff} 前预约，司机今天下午就来。现在是 {now}。",
    "addon.shipping-dhl.rates.cutoffMissed": "现在是 {now}，已过 {cutoff} 的截止时间，车 {day} 来。",
    "addon.shipping-dhl.service.exp1200": "特快，{by} 前送达",
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
    "addon.shipping-dhl.event.collected": "已从店里取件",
    "addon.shipping-dhl.event.atHub": "已在转运中心分拣",
    "addon.shipping-dhl.event.outForDelivery": "派送员已带出",

    "addon.shipping-dhl.error.title": "承运商不接受这个地址",
    "addon.shipping-dhl.error.simulated": "演示承运商 — 此次拒收为模拟结果",
    "addon.shipping-dhl.error.remedy1": "对照收件国家核对邮编。{country} 的邮编形如 {example}。",
    "addon.shipping-dhl.error.remedy2": "如果地址本来就没错，请把包裹在柜台交付，并标记为已取走。",
    "addon.shipping-dhl.error.retry": "再试一次",
    "addon.shipping-dhl.error.postcode": "邮编",
    "addon.shipping-dhl.error.country": "国家/地区",

    "addon.shipping-dhl.checkout.title": "由 DHL 送达",
    "addon.shipping-dhl.checkout.sub": "根据购物车里的东西算出来的。",
    "addon.shipping-dhl.checkout.fromReady": "从 {day} 算起，那是店里最早能把它交出去的一天。",
    "addon.shipping-dhl.checkout.simulated": "这些运费来自演示承运商，不会发给真实承运商。",
    "addon.shipping-dhl.panel.carrier": "承运商",
    "addon.shipping-dhl.panel.due": "预计",
    "addon.shipping-dhl.panel.notSent": "这份订单还没有交给快递发出。",
    "addon.shipping-dhl.panel.trackIt": "查看物流",
    "addon.shipping-dhl.panel.noPage": "演示承运商没有自己的查询页面 — 上面的轨迹就是全部。",

    // ── the inbound half: a prepaid return label (31 O4) ──────────────────
    "addon.shipping-dhl.returns.title": "预付退货标签",
    "addon.shipping-dhl.returns.intro": "获取一张标签，把这件退回。运费由店里承担——你把标签贴在包裹上交寄即可。",
    "addon.shipping-dhl.returns.toDepot": "它将寄回 {name}，{city}。",
    "addon.shipping-dhl.returns.notSetUp": "店里尚未向承运商提供退货地址，因此这里无法生成标签。",
    "addon.shipping-dhl.returns.sender": "从你的地址取件",
    "addon.shipping-dhl.returns.senderName": "你的姓名",
    "addon.shipping-dhl.returns.parcelNote": "按小包裹估算——连箱约 {kg} 公斤。仓库会以实际到件的重量为准。",
    "addon.shipping-dhl.returns.make": "获取预付标签",
    "addon.shipping-dhl.returns.made": "退货标签已就绪",
    "addon.shipping-dhl.returns.apply": "打印后贴到包裹上，再把包裹交寄。下方的物流轨迹会随它一路回来。",
    "addon.shipping-dhl.set.returns": "退货地址",
    "addon.shipping-dhl.set.returnsName": "标签上的名称",
    "addon.shipping-dhl.set.returnsNote": "顾客的退货包裹会送到这里。此处没有地址时，退货界面会如实说明，并且不会生成标签。",
    "addon.shipping-dhl.setting.returnsName": "退货地址——标签上的名称",
    "addon.shipping-dhl.setting.returnsLines": "退货地址——街道",
    "addon.shipping-dhl.setting.returnsCity": "退货地址——城市",
    "addon.shipping-dhl.setting.returnsPostcode": "退货地址——邮编",
    "addon.shipping-dhl.setting.returnsCountry": "退货地址——国家或地区",
  },

  "zh-TW": {
    // ── Host chrome this add-on owns: the connect sentence, its own settings
    //    panel copy, what a disconnect takes and keeps, and its activity lines.
    "addon.shipping-dhl.what": "讓店裡直接從已備妥的訂單預約包裹取件，取回運費並列印面單，不必再把單號敲進郵件裡。",
    "addon.shipping-dhl.set.demo": "使用示範快遞",
    "addon.shipping-dhl.set.demoOn": "運價、面單和軌跡都來自預置的替身。沒有任何內容送到真實快遞公司。",
    "addon.shipping-dhl.set.demoOff":
      "在真實的店鋪裡，請求會帶著您填的帳號資訊送往快遞公司。但這個示範無論如何都不會向外送出任何東西——價格、面單和物流軌跡仍舊來自內建的替身。",
    "addon.shipping-dhl.set.cutoffLabel": "取件截止時間",
    "addon.shipping-dhl.set.cutoffNote": "在此之前預約，司機當天下午就來。",
    "addon.shipping-dhl.set.weights": "預設包裹重量",
    "addon.shipping-dhl.set.weightsNote": "依店裡提供的單件重量加上包裝箱算出。其後的價目表在 Adminium 控制台裡修改。",
    "addon.shipping-dhl.set.weightAssumed": "{kg} 公斤 — 估算",
    "addon.shipping-dhl.set.weightKg": "{kg} 公斤",
    "addon.shipping-dhl.disconnect.goes": "訂單上不再有「預約取件」，結帳不再顯示承運商運費，顧客的訂單頁回到到店自取。帳號資訊會被刪除。",
    "addon.shipping-dhl.disconnect.stays": "已預約的取件保留面單與貨運單號。",
    "addon.shipping-dhl.act.1": "{when} · 已預約取件 · {ref}",
    "addon.shipping-dhl.act.2": "{when} · 已取運價 · {ref}",
    "addon.shipping-dhl.act.3": "{when} · 已下載面單 · {ref}",

    "addon.shipping-dhl.line": "為已備妥的訂單預約包裹取件，並取回面單與追蹤號碼。",
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
    "addon.shipping-dhl.parcel.sub": "依訂單填好。有不對的地方請改。",
    "addon.shipping-dhl.parcel.contents": "內容物",
    "addon.shipping-dhl.parcel.weight": "重量",
    "addon.shipping-dhl.parcel.dims": "尺寸",
    "addon.shipping-dhl.parcel.goingTo": "寄往",

    // ── a customer this add-on cannot place ────────────────────────────────
    "addon.shipping-dhl.dest.unknownTitle": "這件包裹沒有地址",
    "addon.shipping-dhl.dest.unknownBody": "店裡沒有說明 {customer} 的包裹要寄到哪裡，因此沒有預先填入任何內容。請填寫地址——不會用其他顧客的地址頂替。",
    "addon.shipping-dhl.dest.name": "收件人",
    "addon.shipping-dhl.dest.street": "街道",
    "addon.shipping-dhl.dest.city": "城市",
    "addon.shipping-dhl.dest.needAddress": "先填城市和郵遞區號，再查詢運費。",
    "addon.shipping-dhl.parcel.contentsValue": "{quantity} × {what}",
    "addon.shipping-dhl.parcel.contentsValueMore": "{quantity} × {what}，另有 {more} 項",
    "addon.shipping-dhl.parcel.contentsFrom": "來自訂單 {ref}，數量 {quantity}",
    "addon.shipping-dhl.parcel.weightFrom": "{kg} 公斤 — {quantity} 件，每件 {each} 公克，加包裝箱",
    "addon.shipping-dhl.parcel.weightAssumed": "{kg} 公斤 — 店裡沒有提供這些的重量：{what}。請在此填入實際重量。",
    "addon.shipping-dhl.parcel.dimsFrom": "依內容物大小配的箱子",
    "addon.shipping-dhl.parcel.dimsFromTube": "捲成筒裝——最長的一件超過 60 公分",

    "addon.shipping-dhl.rates.get": "查詢運費",
    "addon.shipping-dhl.rates.title": "這件包裹的運費",
    "addon.shipping-dhl.rates.simulated": "這些服務、運費和日期都來自示範業者，不會送給真實業者。",
    "addon.shipping-dhl.rates.arrives": "{date} 送達",
    "addon.shipping-dhl.rates.cheapest": "最便宜",
    "addon.shipping-dhl.rates.book": "預約取件",
    "addon.shipping-dhl.rates.cutoffLine": "{cutoff} 前預約，司機今天下午就到。現在是 {now}。",
    "addon.shipping-dhl.rates.cutoffMissed": "現在是 {now}，已過 {cutoff} 的截止時間，車 {day} 才來。",
    "addon.shipping-dhl.service.exp1200": "快捷，{by} 前送達",
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
    "addon.shipping-dhl.event.collected": "已從店裡取件",
    "addon.shipping-dhl.event.atHub": "已在轉運站分揀",
    "addon.shipping-dhl.event.outForDelivery": "外務員已帶出",

    "addon.shipping-dhl.error.title": "貨運業者不收這個地址",
    "addon.shipping-dhl.error.simulated": "示範業者 — 此次拒收為模擬結果",
    "addon.shipping-dhl.error.remedy1": "對照收件國家核對郵遞區號。{country} 的寫法像 {example}。",
    "addon.shipping-dhl.error.remedy2": "若地址本來就正確，請將包裹在櫃檯交付，並標記為已取走。",
    "addon.shipping-dhl.error.retry": "再試一次",
    "addon.shipping-dhl.error.postcode": "郵遞區號",
    "addon.shipping-dhl.error.country": "國家/地區",

    "addon.shipping-dhl.checkout.title": "由 DHL 配送",
    "addon.shipping-dhl.checkout.sub": "依購物車裡的東西算出來的。",
    "addon.shipping-dhl.checkout.fromReady": "從 {day} 算起，那是店裡最早能把它交出去的一天。",
    "addon.shipping-dhl.checkout.simulated": "這些運費來自示範業者，不會送給真實業者。",
    "addon.shipping-dhl.panel.carrier": "貨運業者",
    "addon.shipping-dhl.panel.due": "預計",
    "addon.shipping-dhl.panel.notSent": "這份訂單還沒有交給貨運寄出。",
    "addon.shipping-dhl.panel.trackIt": "查看配送",
    "addon.shipping-dhl.panel.noPage": "示範業者沒有自己的查詢頁 — 上面的紀錄就是全部。",

    // ── the inbound half: a prepaid return label (31 O4) ──────────────────
    "addon.shipping-dhl.returns.title": "預付退貨標籤",
    "addon.shipping-dhl.returns.intro": "取得一張標籤，把這件退回。運費由店裡負擔——你把標籤貼在包裹上交寄即可。",
    "addon.shipping-dhl.returns.toDepot": "它將寄回 {name}，{city}。",
    "addon.shipping-dhl.returns.notSetUp": "店裡尚未向承運業者提供退貨地址，因此這裡無法產生標籤。",
    "addon.shipping-dhl.returns.sender": "從你的地址取件",
    "addon.shipping-dhl.returns.senderName": "你的姓名",
    "addon.shipping-dhl.returns.parcelNote": "按小包裹估算——連箱約 {kg} 公斤。倉庫會以實際到件的重量為準。",
    "addon.shipping-dhl.returns.make": "取得預付標籤",
    "addon.shipping-dhl.returns.made": "退貨標籤已就緒",
    "addon.shipping-dhl.returns.apply": "列印後貼到包裹上，再把包裹交寄。下方的追蹤紀錄會隨它一路回來。",
    "addon.shipping-dhl.set.returns": "退貨地址",
    "addon.shipping-dhl.set.returnsName": "標籤上的名稱",
    "addon.shipping-dhl.set.returnsNote": "顧客的退貨包裹會送到這裡。此處沒有地址時，退貨介面會如實說明，並且不會產生標籤。",
    "addon.shipping-dhl.setting.returnsName": "退貨地址——標籤上的名稱",
    "addon.shipping-dhl.setting.returnsLines": "退貨地址——街道",
    "addon.shipping-dhl.setting.returnsCity": "退貨地址——城市",
    "addon.shipping-dhl.setting.returnsPostcode": "退貨地址——郵遞區號",
    "addon.shipping-dhl.setting.returnsCountry": "退貨地址——國家或地區",
  },

  "ar-EG": {
    // ── Host chrome this add-on owns: the connect sentence, its own settings
    //    panel copy, what a disconnect takes and keeps, and its activity lines.
    "addon.shipping-dhl.what": "يتيح للمحل حجز استلام طرد من طلب جاهز، واسترجاع الأسعار وطباعة بطاقة الشحن، بدل كتابة أرقام التتبع في رسالة بريد.",
    "addon.shipping-dhl.set.demo": "استخدم شركة الشحن التجريبية",
    "addon.shipping-dhl.set.demoOn": "الأسعار والملصقات والتتبّع تأتي من بديل مُعدّ سلفًا. لا يصل شيء إلى شركة شحن حقيقية.",
    "addon.shipping-dhl.set.demoOff":
      "في متجر حقيقي كانت الطلبات ستذهب إلى شركة الشحن ببيانات الحساب التي أدخلتها. لا يُرسَل شيء من هذا العرض التوضيحي في الحالتين — الأسعار والملصقات والتتبّع تأتي دائمًا من البديل المضمَّن.",
    "addon.shipping-dhl.set.cutoffLabel": "آخر موعد للاستلام",
    "addon.shipping-dhl.set.cutoffNote": "احجز قبله ويأتي السائق بعد ظهر اليوم نفسه.",
    "addon.shipping-dhl.set.weights": "أوزان الطرود الافتراضية",
    "addon.shipping-dhl.set.weightsNote": "محسوبة من وزن القطعة الواحدة الذي يذكره المحل، زائد الصندوق. أما قائمة الأسعار خلفها فتُعدَّل من لوحة Adminium.",
    "addon.shipping-dhl.set.weightAssumed": "{kg} كجم — تقديري",
    "addon.shipping-dhl.set.weightKg": "{kg} كجم",
    "addon.shipping-dhl.disconnect.goes": "يفقد الطلب زر «احجز استلامًا»، وتفقد صفحة الدفع أسعار شركة الشحن، وتعود صفحة طلب العميل إلى الاستلام من المحل. وتُحذف بيانات الحساب.",
    "addon.shipping-dhl.disconnect.stays": "عمليات الاستلام المحجوزة تحتفظ بملصقاتها وأرقام تتبّعها.",
    "addon.shipping-dhl.act.1": "{when} · حُجز استلام · {ref}",
    "addon.shipping-dhl.act.2": "{when} · جُلبت الأسعار · {ref}",
    "addon.shipping-dhl.act.3": "{when} · نُزّل الملصق · {ref}",

    "addon.shipping-dhl.line": "يحجز استلام طرد لطلب جاهز، ويعيد بطاقة شحن ورقم تتبع.",
    "addon.shipping-dhl.notAffiliated": "لا توجد أي علاقة بين Adminium وهذه الشركة.",
    "addon.shipping-dhl.demoChip": "شركة شحن تجريبية — لم تُنشأ أي شحنة حقيقية",
    "addon.shipping-dhl.onlyCarrier": "‏DHL هي شركة التوصيل الوحيدة الموصولة.",
    "addon.shipping-dhl.connectAnother": "أضف غيرها من صفحة الإضافات.",

    "addon.shipping-dhl.perm.rates": "جلب أسعار طرد أنت بصدد إرساله",
    "addon.shipping-dhl.perm.shipments": "إنشاء شحنات للطلبات التي ترسلها",
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
    "addon.shipping-dhl.parcel.sub": "مملوء من الطلب. غيّر ما هو غير صحيح.",
    "addon.shipping-dhl.parcel.contents": "المحتويات",
    "addon.shipping-dhl.parcel.weight": "الوزن",
    "addon.shipping-dhl.parcel.dims": "الأبعاد",
    "addon.shipping-dhl.parcel.goingTo": "إلى",

    // ── a customer this add-on cannot place ────────────────────────────────
    "addon.shipping-dhl.dest.unknownTitle": "لا يوجد عنوان لهذا الطرد",
    "addon.shipping-dhl.dest.unknownBody": "لم يذكر المحل إلى أين يذهب طرد {customer}، لذلك لم يُملأ شيء. اكتب العنوان — ولن يُستخدم عنوان عميل آخر بدلًا منه.",
    "addon.shipping-dhl.dest.name": "المرسَل إليه",
    "addon.shipping-dhl.dest.street": "الشارع",
    "addon.shipping-dhl.dest.city": "المدينة",
    "addon.shipping-dhl.dest.needAddress": "اكتب المدينة والرمز البريدي قبل جلب الأسعار.",
    "addon.shipping-dhl.parcel.contentsValue": "{quantity} × {what}",
    "addon.shipping-dhl.parcel.contentsValueMore": "{quantity} × {what} و{more} غيرها",
    "addon.shipping-dhl.parcel.contentsFrom": "من الطلب {ref}، الكمية {quantity}",
    "addon.shipping-dhl.parcel.weightFrom": "{kg} كجم — {quantity} بوزن {each} جم للقطعة، زائد الصندوق",
    "addon.shipping-dhl.parcel.weightAssumed": "{kg} كجم — لم يذكر المحل وزن: {what}. اكتب الوزن الحقيقي هنا.",
    "addon.shipping-dhl.parcel.dimsFrom": "صندوق بمقاس ما بداخله",
    "addon.shipping-dhl.parcel.dimsFromTube": "ملفوف في أسطوانة — أطول قطعة تتجاوز ٦٠ سم",

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
    "addon.shipping-dhl.service.exp1200": "سريع، قبل {by}",
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
    "addon.shipping-dhl.event.collected": "تم الاستلام من المحل",
    "addon.shipping-dhl.event.atHub": "فُرز في المستودع",
    "addon.shipping-dhl.event.outForDelivery": "مع مندوب التوصيل",

    "addon.shipping-dhl.error.title": "شركة الشحن رفضت هذا العنوان",
    "addon.shipping-dhl.error.simulated": "شركة شحن تجريبية — هذا الرفض محاكاة",
    "addon.shipping-dhl.error.remedy1":
      "راجع الرمز البريدي مقابل بلد الوصول. رمز {country} يبدو هكذا: {example}.",
    "addon.shipping-dhl.error.remedy2": "إذا كان العنوان صحيحًا كما هو، فسلّم الطرد على الطاولة وعلّمه كمستلَم.",
    "addon.shipping-dhl.error.retry": "حاول مرة أخرى",
    "addon.shipping-dhl.error.postcode": "الرمز البريدي",
    "addon.shipping-dhl.error.country": "البلد",

    "addon.shipping-dhl.checkout.title": "التوصيل عبر DHL",
    "addon.shipping-dhl.checkout.sub": "محسوبة مما في سلّتك.",
    "addon.shipping-dhl.checkout.fromReady":
      "محسوبة من {day}، وهو أول يوم يستطيع فيه المحل تسليم الطرد.",
    "addon.shipping-dhl.checkout.simulated":
      "هذه الأسعار من شركة شحن تجريبية. ولا يُرسَل شيء إلى شركة حقيقية.",
    "addon.shipping-dhl.panel.carrier": "شركة الشحن",
    "addon.shipping-dhl.panel.due": "متوقّع",
    "addon.shipping-dhl.panel.notSent": "لم يخرج هذا الطلب مع شركة شحن بعد.",
    "addon.shipping-dhl.panel.trackIt": "تتبّع الشحنة",
    "addon.shipping-dhl.panel.noPage":
      "شركة الشحن التجريبية ليس لها صفحة تتبّع خاصة — الأحداث أعلاه هي كل ما هناك.",

    // ── the inbound half: a prepaid return label (31 O4) ──────────────────
    "addon.shipping-dhl.returns.title": "ملصق إرجاع مدفوع مسبقًا",
    "addon.shipping-dhl.returns.intro": "احصل على ملصق لإعادة هذا. المحل يتحمل تكلفة النقل — ألصق الملصق على الطرد وسلّمه.",
    "addon.shipping-dhl.returns.toDepot": "يعود إلى {name}، {city}.",
    "addon.shipping-dhl.returns.notSetUp": "لم يزوّد المحل شركة الشحن بعنوان للإرجاع بعد، لذلك لا يمكن إنشاء ملصق هنا.",
    "addon.shipping-dhl.returns.sender": "الاستلام من عنوانك",
    "addon.shipping-dhl.returns.senderName": "اسمك",
    "addon.shipping-dhl.returns.parcelNote": "نفترض طردًا صغيرًا — نحو {kg} كجم مع الصندوق. المستودع يزن ما يصل فعليًا.",
    "addon.shipping-dhl.returns.make": "الحصول على الملصق المدفوع مسبقًا",
    "addon.shipping-dhl.returns.made": "ملصق الإرجاع جاهز",
    "addon.shipping-dhl.returns.apply": "اطبعه وألصقه على الطرد ثم سلّم الطرد. التتبع أدناه يرافقه في طريق العودة.",
    "addon.shipping-dhl.set.returns": "عنوان الإرجاع",
    "addon.shipping-dhl.set.returnsName": "الاسم على الملصق",
    "addon.shipping-dhl.set.returnsNote": "المكان الذي يُسلَّم إليه طرد إرجاع العميل. بدون عنوان هنا، تقول واجهة الإرجاع ذلك ولا تنشئ شيئًا.",
    "addon.shipping-dhl.setting.returnsName": "عنوان الإرجاع — الاسم على الملصق",
    "addon.shipping-dhl.setting.returnsLines": "عنوان الإرجاع — الشارع",
    "addon.shipping-dhl.setting.returnsCity": "عنوان الإرجاع — المدينة",
    "addon.shipping-dhl.setting.returnsPostcode": "عنوان الإرجاع — الرمز البريدي",
    "addon.shipping-dhl.setting.returnsCountry": "عنوان الإرجاع — البلد",
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

/**
 * ── THE LATIN DIGITS IN THESE STRINGS THAT ARE NOT QUANTITIES ───────────────
 *
 * A host renders this bundle inside its own pages, and every host in this wave
 * runs the same rule over an Arabic page: a run of Latin digits that is not
 * inside an identifier is an unformatted number, and a defect. Some of an
 * add-on's own strings legitimately carry one anyway, and when they do THE
 * ADD-ON IS THE ONLY THING THAT KNOWS WHY.
 *
 * ── WHY THIS TRAVELS WITH THE STRINGS INSTEAD OF WITH THE HOST ──────────────
 *
 * It used to live in the host. Print Shop's `numerals.arabic.test.tsx` carried
 * Design Studio's specimen telephone number in ITS exemption list, and Maker
 * Shop did not — so wiring Design Studio into the second host, registration
 * only, zero bytes changed in any add-on, turned that host's suite red. The
 * fix was to edit a list in the host, which is exactly what AC20/D21 says must
 * never be necessary: an add-on is portable when moving it needs no edit in the
 * app that receives it.
 *
 * The same shape had already been fixed twice this wave (HOSTED_SLOTS, the
 * Czech "pro" carve-out). This is the third and it is fixed the same way: the
 * fact is declared beside the strings it is about, in the module the hosts
 * vendor, and each host's guard reads whatever is vendored into it. A host that
 * takes this add-on takes its allowances; a host that does not, does not.
 *
 * EVERY ADD-ON EXPORTS THIS, even when it is empty. A host asserts the export
 * exists on every bundle it has vendored, so a missing declaration is a red
 * suite rather than an allowance nobody notices is gone.
 */
export const NOT_A_QUANTITY: readonly { phrase: string; why: string }[] = [];

