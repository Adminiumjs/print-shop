/*
 * VENDORED from add-ons/packages/import-canva/src/i18n/strings.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `import-canva`; its manifest, tests and README live in the monorepo.
 */
/**
 * Everything this add-on says, in all eight locales.
 *
 * The shape is the host's area-module shape (`src/i18n/strings/chrome.ts`) so
 * the host can drop this straight into its `AREAS` list, where its `Area<>`
 * type turns a missing translation into a COMPILE error rather than a per-key
 * fallback to English at runtime. Every locale therefore carries every key.
 *
 * Keys are namespaced under `addon.import-canva.` because apps and add-ons
 * share one flat message bundle and a later area silently wins a collision.
 * They are written out in full here rather than nested, because that is the
 * string the host looks up (`t(addOn.lineKey)`); `t.ts` is what lets this
 * add-on's own components write the short half.
 *
 * A NOTE FOR TRANSLATORS, and it is not optional. The English copy avoids a
 * short list of marketing words on purpose, and avoids them as SUBSTRINGS
 * rather than as words, because the release sweep greps built output
 * case-insensitively. The banned runs are listed in `strings.test.ts`, which
 * checks all eight locales against them; they are NOT spelled out in this file
 * because this file SHIPS — Vite's library build keeps comments, so a warning
 * about a banned run that itself contained the run would be the first thing the
 * release grep found in `dist/`. `built-output.test.ts` is what catches that.
 *
 * The traps are not the obvious ones. Ordinary words in several of these
 * languages carry a banned run in the middle: a German verb ending shared by
 * every borrowed verb, the German and Danish noun for a schedule, a French
 * adjective meaning whole, an English word for a clarification and an English
 * word for a border. Where your language's natural term is one of those, prefer
 * the plainer phrase a print works would actually say; the suite will tell you
 * if you did not. Two more rules with no substring to them: nothing about this
 * add-on may read as a paid-up version of a lesser one, and no sentence may
 * suggest that the company named endorses this product.
 *
 * The check.* messages deliberately echo the host's own `verdict.*` wording.
 * They are the same checks, and a customer who uploads a file one day and
 * imports one the next must not be told the same thing in two different voices.
 */

export const importCanvaStrings = {
  "en-US": {
    // ── Host chrome this add-on owns: the connect sentence, its own settings
    //    panel copy, what a disconnect takes and keeps, and its activity lines.
    "addon.import-canva.what": "This lets a customer bring a design they already made in their own account. The shop runs the same checks on it as on an uploaded file.",
    "addon.import-canva.set.account": "Account",
    "addon.import-canva.set.accountWhen": "{account} · authorized {when}",
    "addon.import-canva.set.nothingElse": "There is nothing else to set. The account is the whole of it.",
    "addon.import-canva.disconnect.goes": "Customers will no longer see “Bring it from Canva” on the artwork screen. The authorization is revoked and the token deleted.",
    "addon.import-canva.disconnect.stays": "Designs already brought onto orders are kept.",
    "addon.import-canva.act.1": "{when} · design brought in · {ref}",
    "addon.import-canva.act.2": "{when} · list of designs read",
    "addon.import-canva.act.3": "{when} · account authorized",

    "addon.import-canva.line":
      "Bring in a design you already made in Canva, and run the same checks on it as an upload.",

    "addon.import-canva.tile.title": "Bring it from Canva",
    "addon.import-canva.tile.body":
      "Choose a design from your account. We check it exactly as we check an upload.",

    "addon.import-canva.flow.title": "Bring it from Canva",
    "addon.import-canva.flow.lede": "We run the same checks on it as we do on an upload.",
    "addon.import-canva.flow.back": "Back to the artwork screen",
    "addon.import-canva.flow.close": "Close",

    "addon.import-canva.step.connect": "Connect",
    "addon.import-canva.step.pick": "Pick a design",
    "addon.import-canva.step.import": "Import and check",
    "addon.import-canva.dims": "{w} × {h} mm",

    "addon.import-canva.connect.title": "Connect your Canva account",
    "addon.import-canva.connect.body":
      "We will read the list of your designs so you can choose one, and download the one you pick. Nothing else.",
    "addon.import-canva.connect.authorize": "Authorize",

    "addon.import-canva.consent.title": "What you are agreeing to",
    "addon.import-canva.consent.body":
      "Signing in to your Canva account lets this site do these things, and nothing else.",
    "addon.import-canva.consent.cancel": "Cancel",
    "addon.import-canva.perm.list": "Read the list of your designs",
    "addon.import-canva.perm.export": "Download the one design you choose",
    "addon.import-canva.perm.nothingElse":
      "Nothing else — it cannot edit or publish anything, and it never sees your account details",

    "addon.import-canva.pick.search": "Search your designs",
    "addon.import-canva.pick.these": "These are the designs in your account.",
    "addon.import-canva.pick.none": "Nothing in your account matches that.",
    "addon.import-canva.pick.edited": "edited {date}",
    "addon.import-canva.pick.choose": "Import {name}",

    "addon.import-canva.import.checking": "Running the same checks as an upload…",
    "addon.import-canva.import.from": "{name} · imported from your account",
    "addon.import-canva.import.pickAnother": "Pick another design",
    "addon.import-canva.import.blocked": "This one can't print as it is — two ways out below.",
    "addon.import-canva.import.ok":
      "Everything checks out. A person will still look before anything is made.",
    "addon.import-canva.import.okAgain": "Checked again. It is right now.",
    "addon.import-canva.import.use": "Use this design",

    "addon.import-canva.check.bleedOk": "Bleed {mm}mm on all four edges",
    "addon.import-canva.check.bleedMissing":
      "This design has no bleed. It is {haveW} × {haveH}mm and we need {needW} × {needH}mm including bleed.",
    "addon.import-canva.check.dpiOk": "{dpi}dpi at the finished size",
    "addon.import-canva.check.dpiLow":
      "This design is {dpi}dpi at the finished size — we need {need}.",
    "addon.import-canva.check.shapeOk": "The size matches the job.",
    "addon.import-canva.check.shapeOff":
      "This design is a different size from the job: about {inline}mm would come off each of the left and right edges, and {block}mm off the top and bottom.",
    "addon.import-canva.check.pages": "{pages} page(s) for {sides} printed side(s)",
    "addon.import-canva.check.pagesShort":
      "This design has {pages} page(s) and the job is printed on {need}.",
    "addon.import-canva.check.pagesExtra":
      "This design has {pages} page(s) and the job is printed on {need}. We will use the first.",

    "addon.import-canva.fix.heading": "Two ways to put this right",
    "addon.import-canva.fix.scale.title": "Scale it up {pct}% so it bleeds",
    "addon.import-canva.fix.scale.body":
      "It becomes {w}mm wide, so about {mm}mm comes off each of the left and right edges. Anything you need to keep should sit at least {safe}mm in from the edge.",
    "addon.import-canva.fix.scale.cta": "Scale it up {pct}%",
    "addon.import-canva.fix.redo.title": "Fix it in Canva and import again",
    "addon.import-canva.fix.redo.body":
      "In Canva, set the design size to {needW} × {needH}mm — that is {trimW} × {trimH}mm plus {bleed}mm on every edge — and let the background run right to the edge. Then import it again.",
    "addon.import-canva.fix.redo.cta": "I have set the size — import again",

    // AC7 — one label per step, worded for the step it stands on. The import
    //       step keeps `demo.note`; the three before it get their own, because
    //       "these designs" is a lie on a screen that shows no designs yet.
    "addon.import-canva.demo.connect":
      "Simulated: this demo contacts no account. Authorizing here connects to fixed data on this page.",
    "addon.import-canva.demo.consent":
      "Simulated: agreeing here authorizes nothing. No account is contacted and nothing leaves this page.",
    "addon.import-canva.demo.pick":
      "Simulated: these four designs are fixed data in this demo. No account was read.",
    "addon.import-canva.demo.note":
      "Simulated: these designs come from fixed data in this demo. No account was contacted and nothing left this page.",
    // The manage drawer's settings fill shows an account name and the day it
    // was authorized — the sort of answer a real connection gives back, and in
    // the demo a fixture. AC7 does not stop at the happy path: a reader who
    // screenshotted that panel would take it for a live connection.
    "addon.import-canva.demo.account":
      "Simulated: no account was ever connected. The name and date here are fixed data in this demo.",
    "addon.import-canva.notAffiliated": "Adminium is not affiliated with this company.",
    "addon.import-canva.unavailable.tooBig":
      "A design exported from Canva will not hold up at {w} × {h}mm. For something this size, send a print-ready PDF.",

    "addon.import-canva.design.bakeryLoyalty": "Harbour Bakery — loyalty card",
    "addon.import-canva.design.cyclesService": "Two Rivers Cycles — service card",
    "addon.import-canva.design.yogaTimetable": "Bramble Yoga — class timetable",
    "addon.import-canva.design.galleryInvite": "The Little Gallery — private view",
  },

  "de-DE": {
    // ── Host chrome this add-on owns: the connect sentence, its own settings
    //    panel copy, what a disconnect takes and keeps, and its activity lines.
    "addon.import-canva.what": "Damit bringt die Kundschaft eine Gestaltung mit, die sie im eigenen Konto gebaut hat. Die Werkstatt prüft sie genauso wie eine hochgeladene Datei.",
    "addon.import-canva.set.account": "Konto",
    "addon.import-canva.set.accountWhen": "{account} · bestätigt am {when}",
    "addon.import-canva.set.nothingElse": "Mehr gibt es nicht einzustellen. Das Konto ist alles.",
    "addon.import-canva.disconnect.goes": "Die Kundschaft sieht „Aus Canva holen“ auf der Gestaltungsseite nicht mehr. Die Berechtigung wird entzogen und das Token gelöscht.",
    "addon.import-canva.disconnect.stays": "Bereits übernommene Gestaltungen bleiben auf ihren Aufträgen.",
    "addon.import-canva.act.1": "{when} · Gestaltung übernommen · {ref}",
    "addon.import-canva.act.2": "{when} · Liste der Gestaltungen gelesen",
    "addon.import-canva.act.3": "{when} · Konto bestätigt",

    "addon.import-canva.line":
      "Bringen Sie ein Design mit, das Sie schon in Canva angelegt haben — wir prüfen es genauso wie einen Upload.",

    "addon.import-canva.tile.title": "Aus Canva übernehmen",
    "addon.import-canva.tile.body":
      "Wählen Sie ein Design aus Ihrem Konto. Wir prüfen es genau wie einen Upload.",

    "addon.import-canva.flow.title": "Aus Canva übernehmen",
    "addon.import-canva.flow.lede": "Wir prüfen es genauso wie einen Upload.",
    "addon.import-canva.flow.back": "Zurück zur Gestaltungsseite",
    "addon.import-canva.flow.close": "Schließen",

    "addon.import-canva.step.connect": "Verbinden",
    "addon.import-canva.step.pick": "Design wählen",
    // The German verb for this step is out: the -ieren ending every borrowed
    // verb takes carries a banned run, and so does the noun for a schedule.
    // The bare noun says the same thing and carries neither. See
    // `strings.test.ts` for the run itself.
    "addon.import-canva.step.import": "Import und Prüfung",
    "addon.import-canva.dims": "{w} × {h} mm",

    "addon.import-canva.connect.title": "Canva-Konto verbinden",
    "addon.import-canva.connect.body":
      "Wir lesen die Liste Ihrer Designs, damit Sie eines auswählen können, und laden das gewählte Design herunter. Sonst nichts.",
    "addon.import-canva.connect.authorize": "Zugriff erlauben",

    "addon.import-canva.consent.title": "Dem stimmen Sie zu",
    "addon.import-canva.consent.body":
      "Die Anmeldung bei Ihrem Canva-Konto erlaubt dieser Seite Folgendes — und sonst nichts.",
    "addon.import-canva.consent.cancel": "Abbrechen",
    "addon.import-canva.perm.list": "Die Liste Ihrer Designs lesen",
    "addon.import-canva.perm.export": "Das eine Design herunterladen, das Sie auswählen",
    "addon.import-canva.perm.nothingElse":
      "Sonst nichts — es wird nichts bearbeitet oder veröffentlicht, und Ihre Kontodaten sieht die Seite nie",

    "addon.import-canva.pick.search": "Designs durchsuchen",
    "addon.import-canva.pick.these": "Das sind die Designs in Ihrem Konto.",
    "addon.import-canva.pick.none": "Dazu passt nichts in Ihrem Konto.",
    "addon.import-canva.pick.edited": "bearbeitet {date}",
    "addon.import-canva.pick.choose": "{name} übernehmen",

    "addon.import-canva.import.checking": "Es laufen dieselben Prüfungen wie bei einem Upload …",
    "addon.import-canva.import.from": "{name} · aus Ihrem Konto übernommen",
    "addon.import-canva.import.pickAnother": "Anderes Design wählen",
    "addon.import-canva.import.blocked":
      "So lässt sich das nicht drucken — unten stehen zwei Wege heraus.",
    "addon.import-canva.import.ok":
      "Alles in Ordnung. Bevor etwas hergestellt wird, schaut trotzdem noch ein Mensch darauf.",
    "addon.import-canva.import.okAgain": "Nochmal geprüft. Jetzt stimmt es.",
    "addon.import-canva.import.use": "Dieses Design verwenden",

    "addon.import-canva.check.bleedOk": "Beschnitt {mm} mm an allen vier Kanten",
    "addon.import-canva.check.bleedMissing":
      "Dieses Design hat keinen Beschnitt. Es ist {haveW} × {haveH} mm, wir brauchen {needW} × {needH} mm inklusive Beschnitt.",
    "addon.import-canva.check.dpiOk": "{dpi} dpi im Endformat",
    "addon.import-canva.check.dpiLow":
      "Dieses Design hat {dpi} dpi im Endformat — wir brauchen {need}.",
    "addon.import-canva.check.shapeOk": "Das Format passt zum Auftrag.",
    "addon.import-canva.check.shapeOff":
      "Dieses Design hat ein anderes Format als der Auftrag: links und rechts fallen je etwa {inline} mm weg, oben und unten {block} mm.",
    "addon.import-canva.check.pages": "{pages} Seite(n) für {sides} bedruckte Seite(n)",
    "addon.import-canva.check.pagesShort":
      "Dieses Design hat {pages} Seite(n), gedruckt wird auf {need}.",
    "addon.import-canva.check.pagesExtra":
      "Dieses Design hat {pages} Seite(n), gedruckt wird auf {need}. Wir nehmen die erste.",

    "addon.import-canva.fix.heading": "Zwei Wege, das in Ordnung zu bringen",
    "addon.import-canva.fix.scale.title": "Um {pct} % vergrößern, damit es in den Beschnitt läuft",
    "addon.import-canva.fix.scale.body":
      "Es wird {w} mm breit, links und rechts fallen also je etwa {mm} mm weg. Was erhalten bleiben soll, sollte mindestens {safe} mm vom Rand entfernt stehen.",
    "addon.import-canva.fix.scale.cta": "Um {pct} % vergrößern",
    "addon.import-canva.fix.redo.title": "In Canva korrigieren und erneut einlesen",
    "addon.import-canva.fix.redo.body":
      "Stellen Sie das Design in Canva auf {needW} × {needH} mm — das sind {trimW} × {trimH} mm plus {bleed} mm an jeder Kante — und lassen Sie den Hintergrund bis an den Rand laufen. Dann lesen Sie es erneut ein.",
    "addon.import-canva.fix.redo.cta": "Größe ist gesetzt — erneut einlesen",

    "addon.import-canva.demo.connect":
      "Simuliert: Diese Demo spricht kein Konto an. Der Zugriff hier führt zu festen Beispieldaten auf dieser Seite.",
    "addon.import-canva.demo.consent":
      "Simuliert: Ihre Zustimmung erteilt hier keinen echten Zugriff. Es wird kein Konto angesprochen und nichts verlässt diese Seite.",
    "addon.import-canva.demo.pick":
      "Simuliert: Diese vier Designs sind feste Beispieldaten dieser Demo. Es wurde kein Konto gelesen.",
    "addon.import-canva.demo.note":
      "Simuliert: Diese Designs stammen aus festen Beispieldaten dieser Demo. Es wurde kein Konto angesprochen und nichts hat diese Seite verlassen.",
    "addon.import-canva.demo.account":
      "Simuliert: Es wurde nie ein Konto verbunden. Name und Datum sind feste Beispieldaten dieser Demo.",
    "addon.import-canva.notAffiliated":
      "Adminium steht in keiner Verbindung zu diesem Unternehmen.",
    "addon.import-canva.unavailable.tooBig":
      "Ein Design aus Canva trägt {w} × {h} mm nicht. Schicken Sie uns dafür ein druckfertiges PDF.",

    "addon.import-canva.design.bakeryLoyalty": "Harbour Bakery — Treuekarte",
    "addon.import-canva.design.cyclesService": "Two Rivers Cycles — Servicekarte",
    "addon.import-canva.design.yogaTimetable": "Bramble Yoga — Kursübersicht",
    "addon.import-canva.design.galleryInvite": "The Little Gallery — Einladung zur Vernissage",
  },

  "fr-FR": {
    // ── Host chrome this add-on owns: the connect sentence, its own settings
    //    panel copy, what a disconnect takes and keeps, and its activity lines.
    "addon.import-canva.what": "Cela permet au client d'apporter une création déjà faite dans son propre compte. L'atelier lui applique les mêmes contrôles qu'à un fichier envoyé.",
    "addon.import-canva.set.account": "Compte",
    "addon.import-canva.set.accountWhen": "{account} · autorisé le {when}",
    "addon.import-canva.set.nothingElse": "Il n'y a rien d'autre à régler. Le compte, c'est tout.",
    "addon.import-canva.disconnect.goes": "Les clients ne verront plus « Apportez-le depuis Canva » sur l'écran des fichiers. L'autorisation est révoquée et le jeton supprimé.",
    "addon.import-canva.disconnect.stays": "Les créations déjà reprises sur des commandes sont conservées.",
    "addon.import-canva.act.1": "{when} · création reprise · {ref}",
    "addon.import-canva.act.2": "{when} · liste des créations lue",
    "addon.import-canva.act.3": "{when} · compte autorisé",

    "addon.import-canva.line":
      "Reprenez un visuel que vous avez déjà réalisé dans Canva : nous lui faisons passer les mêmes contrôles qu'à un fichier envoyé.",

    "addon.import-canva.tile.title": "Le reprendre depuis Canva",
    "addon.import-canva.tile.body":
      "Choisissez un visuel dans votre compte. Nous le contrôlons exactement comme un fichier envoyé.",

    "addon.import-canva.flow.title": "Le reprendre depuis Canva",
    "addon.import-canva.flow.lede":
      "Nous lui faisons passer les mêmes contrôles qu'à un fichier envoyé.",
    "addon.import-canva.flow.back": "Retour à l’écran des fichiers",
    "addon.import-canva.flow.close": "Fermer",

    "addon.import-canva.step.connect": "Connexion",
    "addon.import-canva.step.pick": "Choisir un visuel",
    "addon.import-canva.step.import": "Importer et contrôler",
    "addon.import-canva.dims": "{w} × {h} mm",

    "addon.import-canva.connect.title": "Connecter votre compte Canva",
    "addon.import-canva.connect.body":
      "Nous lirons la liste de vos visuels pour que vous puissiez en choisir un, et nous téléchargerons celui que vous choisissez. Rien d'autre.",
    "addon.import-canva.connect.authorize": "Autoriser",

    "addon.import-canva.consent.title": "Ce que vous acceptez",
    "addon.import-canva.consent.body":
      "Vous connecter à votre compte Canva autorise ce site à faire ceci, et rien d'autre.",
    "addon.import-canva.consent.cancel": "Annuler",
    "addon.import-canva.perm.list": "Lire la liste de vos visuels",
    "addon.import-canva.perm.export": "Télécharger le seul visuel que vous choisissez",
    "addon.import-canva.perm.nothingElse":
      "Rien d'autre — le site ne modifie ni ne publie quoi que ce soit, et ne voit jamais les informations de votre compte",

    "addon.import-canva.pick.search": "Rechercher dans vos visuels",
    "addon.import-canva.pick.these": "Voici les visuels présents dans votre compte.",
    "addon.import-canva.pick.none": "Rien ne correspond dans votre compte.",
    "addon.import-canva.pick.edited": "modifié le {date}",
    "addon.import-canva.pick.choose": "Importer {name}",

    "addon.import-canva.import.checking":
      "Les mêmes contrôles qu'un fichier envoyé sont en cours…",
    "addon.import-canva.import.from": "{name} · repris depuis votre compte",
    "addon.import-canva.import.pickAnother": "Choisir un autre visuel",
    "addon.import-canva.import.blocked":
      "En l'état, cela ne peut pas être imprimé — deux solutions ci-dessous.",
    "addon.import-canva.import.ok":
      "Tout est correct. Une personne y jettera quand même un œil avant toute fabrication.",
    "addon.import-canva.import.okAgain": "Contrôlé à nouveau. C'est bon maintenant.",
    "addon.import-canva.import.use": "Utiliser ce visuel",

    "addon.import-canva.check.bleedOk": "Fond perdu de {mm} mm sur les quatre bords",
    "addon.import-canva.check.bleedMissing":
      "Ce visuel n'a pas de fond perdu. Il fait {haveW} × {haveH} mm et il nous en faut {needW} × {needH} mm, fond perdu compris.",
    "addon.import-canva.check.dpiOk": "{dpi} ppp au format fini",
    "addon.import-canva.check.dpiLow":
      "Ce visuel est à {dpi} ppp au format fini — il nous en faut {need}.",
    "addon.import-canva.check.shapeOk": "Le format correspond à la commande.",
    "addon.import-canva.check.shapeOff":
      "Ce visuel n'a pas le même format que la commande : environ {inline} mm partiraient de chaque côté, à gauche et à droite, et {block} mm en haut et en bas.",
    "addon.import-canva.check.pages": "{pages} page(s) pour {sides} face(s) imprimée(s)",
    "addon.import-canva.check.pagesShort":
      "Ce visuel a {pages} page(s) et la commande s'imprime sur {need}.",
    "addon.import-canva.check.pagesExtra":
      "Ce visuel a {pages} page(s) et la commande s'imprime sur {need}. Nous prendrons la première.",

    "addon.import-canva.fix.heading": "Deux façons d'arranger cela",
    "addon.import-canva.fix.scale.title": "L'agrandir de {pct} % pour créer le fond perdu",
    "addon.import-canva.fix.scale.body":
      "Il fera {w} mm de large : environ {mm} mm partiront de chaque côté, à gauche et à droite. Ce qui doit rester doit se tenir à au moins {safe} mm du bord.",
    "addon.import-canva.fix.scale.cta": "L'agrandir de {pct} %",
    "addon.import-canva.fix.redo.title": "Le corriger dans Canva et l'importer à nouveau",
    "addon.import-canva.fix.redo.body":
      "Dans Canva, réglez la taille du visuel sur {needW} × {needH} mm — soit {trimW} × {trimH} mm plus {bleed} mm sur chaque bord — et faites courir le fond jusqu'au bord. Puis importez-le à nouveau.",
    "addon.import-canva.fix.redo.cta": "La taille est réglée — importer à nouveau",

    "addon.import-canva.demo.connect":
      "Simulation : cette démo ne contacte aucun compte. L'autorisation donnée ici mène à des données fixes de cette page.",
    "addon.import-canva.demo.consent":
      "Simulation : accepter ici n'autorise rien. Aucun compte n'est contacté et rien ne quitte cette page.",
    "addon.import-canva.demo.pick":
      "Simulation : ces quatre visuels sont des données fixes de cette démo. Aucun compte n'a été lu.",
    "addon.import-canva.demo.note":
      "Simulation : ces visuels proviennent de données fixes de cette démo. Aucun compte n'a été contacté et rien n'a quitté cette page.",
    "addon.import-canva.demo.account":
      "Simulation : aucun compte n'a jamais été connecté. Le nom et la date affichés ici sont des données fixes de cette démo.",
    "addon.import-canva.notAffiliated":
      "Adminium n'est affilié à cette société d'aucune manière.",
    "addon.import-canva.unavailable.tooBig":
      "Un visuel exporté depuis Canva ne tiendra pas en {w} × {h} mm. Pour ce format, envoyez-nous un PDF prêt à imprimer.",

    "addon.import-canva.design.bakeryLoyalty": "Harbour Bakery — carte de fidélité",
    "addon.import-canva.design.cyclesService": "Two Rivers Cycles — carte d'entretien",
    "addon.import-canva.design.yogaTimetable": "Bramble Yoga — horaires des cours",
    "addon.import-canva.design.galleryInvite": "The Little Gallery — invitation au vernissage",
  },

  "cs-CZ": {
    // ── Host chrome this add-on owns: the connect sentence, its own settings
    //    panel copy, what a disconnect takes and keeps, and its activity lines.
    "addon.import-canva.what": "Zákazník přinese návrh, který si udělal ve vlastním účtu. Dílna ho zkontroluje stejně jako nahraný soubor.",
    "addon.import-canva.set.account": "Účet",
    "addon.import-canva.set.accountWhen": "{account} · potvrzeno {when}",
    "addon.import-canva.set.nothingElse": "Nic dalšího se nenastavuje. Účet je všechno.",
    "addon.import-canva.disconnect.goes": "Zákazníci už na obrazovce s podklady neuvidí „Přineste to z Canvy“. Oprávnění se odvolá a token smaže.",
    "addon.import-canva.disconnect.stays": "Návrhy převzaté na zakázky zůstávají.",
    "addon.import-canva.act.1": "{when} · návrh převzat · {ref}",
    "addon.import-canva.act.2": "{when} · seznam návrhů přečten",
    "addon.import-canva.act.3": "{when} · účet potvrzen",

    "addon.import-canva.line":
      "Přineste si návrh, který jste už udělali v Canvě — zkontrolujeme ho stejně jako nahraný soubor.",

    "addon.import-canva.tile.title": "Převzít z Canvy",
    "addon.import-canva.tile.body":
      "Vyberte návrh ze svého účtu. Zkontrolujeme ho přesně tak jako nahraný soubor.",

    "addon.import-canva.flow.title": "Převzít z Canvy",
    "addon.import-canva.flow.lede": "Projde stejnou kontrolou jako nahraný soubor.",
    "addon.import-canva.flow.back": "Zpět na obrazovku s podklady",
    "addon.import-canva.flow.close": "Zavřít",

    "addon.import-canva.step.connect": "Připojit",
    "addon.import-canva.step.pick": "Vybrat návrh",
    "addon.import-canva.step.import": "Import a kontrola",
    "addon.import-canva.dims": "{w} × {h} mm",

    "addon.import-canva.connect.title": "Připojte svůj účet Canva",
    "addon.import-canva.connect.body":
      "Načteme seznam vašich návrhů, abyste si mohli jeden vybrat, a stáhneme ten, který zvolíte. Nic jiného.",
    "addon.import-canva.connect.authorize": "Povolit",

    "addon.import-canva.consent.title": "S čím souhlasíte",
    "addon.import-canva.consent.body":
      "Přihlášení k účtu Canva umožní této stránce toto — a nic víc.",
    "addon.import-canva.consent.cancel": "Zrušit",
    "addon.import-canva.perm.list": "Číst seznam vašich návrhů",
    "addon.import-canva.perm.export": "Stáhnout jeden návrh, který vyberete",
    "addon.import-canva.perm.nothingElse":
      "Nic jiného — nic neupraví ani nezveřejní a údaje vašeho účtu nikdy nevidí",

    "addon.import-canva.pick.search": "Hledat ve vašich návrzích",
    "addon.import-canva.pick.these": "Toto jsou návrhy ve vašem účtu.",
    "addon.import-canva.pick.none": "Tomu ve vašem účtu nic neodpovídá.",
    "addon.import-canva.pick.edited": "upraveno {date}",
    "addon.import-canva.pick.choose": "Importovat {name}",

    "addon.import-canva.import.checking": "Probíhají stejné kontroly jako u nahraného souboru…",
    "addon.import-canva.import.from": "{name} · převzato z vašeho účtu",
    "addon.import-canva.import.pickAnother": "Vybrat jiný návrh",
    "addon.import-canva.import.blocked": "Takto to vytisknout nejde — níže jsou dvě řešení.",
    "addon.import-canva.import.ok":
      "Vše je v pořádku. Než se to začne vyrábět, stejně se na to podívá člověk.",
    "addon.import-canva.import.okAgain": "Zkontrolováno znovu. Teď je to správně.",
    "addon.import-canva.import.use": "Použít tento návrh",

    "addon.import-canva.check.bleedOk": "Spadávka {mm} mm na všech čtyřech stranách",
    "addon.import-canva.check.bleedMissing":
      "Tento návrh nemá spadávku. Má {haveW} × {haveH} mm a my potřebujeme {needW} × {needH} mm včetně spadávky.",
    "addon.import-canva.check.dpiOk": "{dpi} dpi v konečném formátu",
    "addon.import-canva.check.dpiLow":
      "Tento návrh má {dpi} dpi v konečném formátu — potřebujeme {need}.",
    "addon.import-canva.check.shapeOk": "Formát odpovídá zakázce.",
    "addon.import-canva.check.shapeOff":
      "Tento návrh má jiný formát než zakázka: vlevo i vpravo by odpadlo asi {inline} mm z každé strany, nahoře a dole {block} mm.",
    "addon.import-canva.check.pages": "Stránek: {pages}, potištěných stran: {sides}",
    "addon.import-canva.check.pagesShort":
      "Tento návrh má stránek: {pages}, tiskne se na {need}.",
    "addon.import-canva.check.pagesExtra":
      "Tento návrh má stránek: {pages}, tiskne se na {need}. Použijeme první.",

    "addon.import-canva.fix.heading": "Dvě možnosti, jak to napravit",
    "addon.import-canva.fix.scale.title": "Zvětšit o {pct} %, aby vznikla spadávka",
    "addon.import-canva.fix.scale.body":
      "Bude {w} mm široký, takže vlevo i vpravo odpadne asi {mm} mm. Co má zůstat, mělo by být alespoň {safe} mm od kraje.",
    "addon.import-canva.fix.scale.cta": "Zvětšit o {pct} %",
    "addon.import-canva.fix.redo.title": "Opravit v Canvě a importovat znovu",
    "addon.import-canva.fix.redo.body":
      "V Canvě nastavte velikost návrhu na {needW} × {needH} mm — to je {trimW} × {trimH} mm plus {bleed} mm na každé straně — a nechte pozadí dojít až ke kraji. Pak ho importujte znovu.",
    "addon.import-canva.fix.redo.cta": "Velikost je nastavená — importovat znovu",

    "addon.import-canva.demo.connect":
      "Simulace: tato ukázka nekontaktuje žádný účet. Povolení zde vede k pevným datům na této stránce.",
    "addon.import-canva.demo.consent":
      "Simulace: souhlas zde nic neuděluje. Žádný účet není kontaktován a nic neopouští tuto stránku.",
    "addon.import-canva.demo.pick":
      "Simulace: tyto čtyři návrhy jsou pevná data této ukázky. Žádný účet nebyl čten.",
    "addon.import-canva.demo.note":
      "Simulace: tyto návrhy pocházejí z pevných dat této ukázky. Žádný účet nebyl kontaktován a nic neopustilo tuto stránku.",
    "addon.import-canva.demo.account":
      "Simulace: žádný účet nikdy nebyl připojen. Jméno a datum jsou pevná data této ukázky.",
    "addon.import-canva.notAffiliated": "Adminium není s touto společností nijak spojeno.",
    "addon.import-canva.unavailable.tooBig":
      "Návrh exportovaný z Canvy formát {w} × {h} mm neunese. Na takový rozměr nám pošlete PDF připravené k tisku.",

    "addon.import-canva.design.bakeryLoyalty": "Harbour Bakery — věrnostní karta",
    "addon.import-canva.design.cyclesService": "Two Rivers Cycles — servisní karta",
    "addon.import-canva.design.yogaTimetable": "Bramble Yoga — rozvrh lekcí",
    "addon.import-canva.design.galleryInvite": "The Little Gallery — pozvánka na vernisáž",
  },

  "da-DK": {
    // ── Host chrome this add-on owns: the connect sentence, its own settings
    //    panel copy, what a disconnect takes and keeps, and its activity lines.
    "addon.import-canva.what": "Det lader kunden tage et design med, som de allerede har lavet på deres egen konto. Værkstedet kører de samme kontroller på det som på en uploadet fil.",
    "addon.import-canva.set.account": "Konto",
    "addon.import-canva.set.accountWhen": "{account} · godkendt {when}",
    "addon.import-canva.set.nothingElse": "Der er ikke mere at indstille. Kontoen er det hele.",
    "addon.import-canva.disconnect.goes": "Kunderne ser ikke længere “Hent det fra Canva” på materialesiden. Adgangen tilbagekaldes, og token slettes.",
    "addon.import-canva.disconnect.stays": "Design, der allerede er hentet ind på ordrer, bliver.",
    "addon.import-canva.act.1": "{when} · design hentet ind · {ref}",
    "addon.import-canva.act.2": "{when} · liste over design læst",
    "addon.import-canva.act.3": "{when} · konto godkendt",

    "addon.import-canva.line":
      "Tag et design med, som du allerede har lavet i Canva — vi tjekker det på samme måde som en upload.",

    "addon.import-canva.tile.title": "Hent det fra Canva",
    "addon.import-canva.tile.body":
      "Vælg et design fra din konto. Vi tjekker det præcis som en upload.",

    "addon.import-canva.flow.title": "Hent det fra Canva",
    "addon.import-canva.flow.lede": "Vi kører de samme tjek på det som på en upload.",
    "addon.import-canva.flow.back": "Tilbage til materialesiden",
    "addon.import-canva.flow.close": "Luk",

    "addon.import-canva.step.connect": "Forbind",
    "addon.import-canva.step.pick": "Vælg et design",
    "addon.import-canva.step.import": "Importér og tjek",
    "addon.import-canva.dims": "{w} × {h} mm",

    "addon.import-canva.connect.title": "Forbind din Canva-konto",
    "addon.import-canva.connect.body":
      "Vi læser listen over dine designs, så du kan vælge et, og henter det, du vælger. Ikke andet.",
    "addon.import-canva.connect.authorize": "Giv adgang",

    "addon.import-canva.consent.title": "Det siger du ja til",
    "addon.import-canva.consent.body":
      "Når du logger ind på din Canva-konto, må denne side gøre dette — og ikke andet.",
    "addon.import-canva.consent.cancel": "Annullér",
    "addon.import-canva.perm.list": "Læse listen over dine designs",
    "addon.import-canva.perm.export": "Hente det ene design, du vælger",
    "addon.import-canva.perm.nothingElse":
      "Ikke andet — der bliver hverken rettet eller udgivet noget, og dine kontooplysninger ses aldrig",

    "addon.import-canva.pick.search": "Søg i dine designs",
    "addon.import-canva.pick.these": "Det er de designs, der ligger i din konto.",
    "addon.import-canva.pick.none": "Der er intet i din konto, der matcher.",
    "addon.import-canva.pick.edited": "rettet {date}",
    "addon.import-canva.pick.choose": "Importér {name}",

    "addon.import-canva.import.checking": "De samme tjek som ved en upload kører nu …",
    "addon.import-canva.import.from": "{name} · hentet fra din konto",
    "addon.import-canva.import.pickAnother": "Vælg et andet design",
    "addon.import-canva.import.blocked": "Sådan kan det ikke trykkes — to veje ud herunder.",
    "addon.import-canva.import.ok":
      "Alt ser rigtigt ud. Et menneske kigger stadig på det, før noget bliver lavet.",
    "addon.import-canva.import.okAgain": "Tjekket igen. Nu er det rigtigt.",
    "addon.import-canva.import.use": "Brug dette design",

    "addon.import-canva.check.bleedOk": "Beskæring {mm} mm på alle fire kanter",
    "addon.import-canva.check.bleedMissing":
      "Dette design har ingen beskæring. Det er {haveW} × {haveH} mm, og vi skal bruge {needW} × {needH} mm inklusive beskæring.",
    "addon.import-canva.check.dpiOk": "{dpi} dpi i færdigt format",
    "addon.import-canva.check.dpiLow":
      "Dette design er {dpi} dpi i færdigt format — vi skal bruge {need}.",
    "addon.import-canva.check.shapeOk": "Formatet passer til opgaven.",
    "addon.import-canva.check.shapeOff":
      "Dette design har et andet format end opgaven: omkring {inline} mm ville ryge af i hver side, til venstre og til højre, og {block} mm foroven og forneden.",
    "addon.import-canva.check.pages": "Sider i filen: {pages}, trykte sider: {sides}",
    "addon.import-canva.check.pagesShort":
      "Dette design har {pages} side(r), og opgaven trykkes på {need}.",
    "addon.import-canva.check.pagesExtra":
      "Dette design har {pages} side(r), og opgaven trykkes på {need}. Vi bruger den første.",

    "addon.import-canva.fix.heading": "To måder at rette det på",
    "addon.import-canva.fix.scale.title": "Forstør det {pct} %, så det går ud i beskæringen",
    "addon.import-canva.fix.scale.body":
      "Det bliver {w} mm bredt, så cirka {mm} mm ryger af i hver side, til venstre og til højre. Det, der skal blive, bør stå mindst {safe} mm fra kanten.",
    "addon.import-canva.fix.scale.cta": "Forstør det {pct} %",
    "addon.import-canva.fix.redo.title": "Ret det i Canva, og importér igen",
    "addon.import-canva.fix.redo.body":
      "Sæt designets størrelse i Canva til {needW} × {needH} mm — det er {trimW} × {trimH} mm plus {bleed} mm på hver kant — og lad baggrunden gå helt ud til kanten. Importér det så igen.",
    "addon.import-canva.fix.redo.cta": "Størrelsen er sat — importér igen",

    "addon.import-canva.demo.connect":
      "Simuleret: denne demo kontakter ingen konto. Adgang givet her fører til faste data på denne side.",
    "addon.import-canva.demo.consent":
      "Simuleret: dit ja her giver ingen reel adgang. Ingen konto kontaktes, og intet forlader denne side.",
    "addon.import-canva.demo.pick":
      "Simuleret: disse fire designs er faste data i denne demo. Ingen konto er læst.",
    "addon.import-canva.demo.note":
      "Simuleret: disse designs kommer fra faste data i denne demo. Ingen konto er kontaktet, og intet har forladt denne side.",
    "addon.import-canva.demo.account":
      "Simuleret: der har aldrig været forbundet en konto. Navn og dato er faste data i denne demo.",
    "addon.import-canva.notAffiliated": "Adminium er ikke tilknyttet dette selskab.",
    "addon.import-canva.unavailable.tooBig":
      "Et design eksporteret fra Canva holder ikke i {w} × {h} mm. Til den størrelse skal du sende os en trykklar PDF.",

    "addon.import-canva.design.bakeryLoyalty": "Harbour Bakery — loyalitetskort",
    "addon.import-canva.design.cyclesService": "Two Rivers Cycles — servicekort",
    "addon.import-canva.design.yogaTimetable": "Bramble Yoga — holdoversigt",
    "addon.import-canva.design.galleryInvite": "The Little Gallery — invitation til fernisering",
  },

  "zh-CN": {
    // ── Host chrome this add-on owns: the connect sentence, its own settings
    //    panel copy, what a disconnect takes and keeps, and its activity lines.
    "addon.import-canva.what": "客户可以把自己账号里已经做好的稿件带过来。工坊对它做的检查，和对上传文件完全一样。",
    "addon.import-canva.set.account": "账号",
    "addon.import-canva.set.accountWhen": "{account} · 授权于 {when}",
    "addon.import-canva.set.nothingElse": "没有别的可设。账号就是全部。",
    "addon.import-canva.disconnect.goes": "客户在稿件页面上不会再看到“从 Canva 带过来”。授权会被撤销，令牌会被删除。",
    "addon.import-canva.disconnect.stays": "已带进订单的稿件都留着。",
    "addon.import-canva.act.1": "{when} · 稿件已带入 · {ref}",
    "addon.import-canva.act.2": "{when} · 已读取稿件列表",
    "addon.import-canva.act.3": "{when} · 账号已授权",

    "addon.import-canva.line":
      "把你已经在 Canva 里做好的设计带进来，我们会用与上传文件相同的方式检查它。",

    "addon.import-canva.tile.title": "从 Canva 带进来",
    "addon.import-canva.tile.body":
      "从你的账户里挑一个设计。我们检查它的方式和检查上传文件完全一样。",

    "addon.import-canva.flow.title": "从 Canva 带进来",
    "addon.import-canva.flow.lede": "我们会对它做与上传文件相同的检查。",
    "addon.import-canva.flow.back": "返回稿件页面",
    "addon.import-canva.flow.close": "关闭",

    "addon.import-canva.step.connect": "连接",
    "addon.import-canva.step.pick": "挑选设计",
    "addon.import-canva.step.import": "导入并检查",
    "addon.import-canva.dims": "{w} × {h} 毫米",

    "addon.import-canva.connect.title": "连接你的 Canva 账户",
    "addon.import-canva.connect.body":
      "我们会读取你的设计列表，让你从中挑选，并下载你选中的那一个。仅此而已。",
    "addon.import-canva.connect.authorize": "授权",

    "addon.import-canva.consent.title": "你所同意的内容",
    "addon.import-canva.consent.body": "登录你的 Canva 账户后，本站可以做这些事，仅此而已。",
    "addon.import-canva.consent.cancel": "取消",
    "addon.import-canva.perm.list": "读取你的设计列表",
    "addon.import-canva.perm.export": "下载你选中的那一个设计",
    "addon.import-canva.perm.nothingElse":
      "仅此而已——不会修改或发布任何内容，也永远看不到你的账户资料",

    "addon.import-canva.pick.search": "搜索你的设计",
    "addon.import-canva.pick.these": "这些是你账户里的设计。",
    "addon.import-canva.pick.none": "你的账户里没有匹配的内容。",
    "addon.import-canva.pick.edited": "编辑于 {date}",
    "addon.import-canva.pick.choose": "导入{name}",

    "addon.import-canva.import.checking": "正在做与上传文件相同的检查……",
    "addon.import-canva.import.from": "{name} · 从你的账户导入",
    "addon.import-canva.import.pickAnother": "换一个设计",
    "addon.import-canva.import.blocked": "这一份照原样印不了——下面有两条出路。",
    "addon.import-canva.import.ok": "各项检查都通过了。开工前仍会有人再看一遍。",
    "addon.import-canva.import.okAgain": "重新检查过了。现在没问题。",
    "addon.import-canva.import.use": "使用这个设计",

    "addon.import-canva.check.bleedOk": "四边各留 {mm} 毫米出血",
    "addon.import-canva.check.bleedMissing":
      "这个设计没有出血。它是 {haveW} × {haveH} 毫米，而我们需要含出血 {needW} × {needH} 毫米。",
    "addon.import-canva.check.dpiOk": "成品尺寸下为 {dpi} dpi",
    "addon.import-canva.check.dpiLow": "这个设计在成品尺寸下只有 {dpi} dpi——我们需要 {need}。",
    "addon.import-canva.check.shapeOk": "尺寸与这单相符。",
    "addon.import-canva.check.shapeOff":
      "这个设计的尺寸与这单不同：左右两边各会裁掉约 {inline} 毫米，上下各裁掉 {block} 毫米。",
    "addon.import-canva.check.pages": "文件 {pages} 页，印刷 {sides} 面",
    "addon.import-canva.check.pagesShort": "这个设计有 {pages} 页，而这单要印 {need} 面。",
    "addon.import-canva.check.pagesExtra":
      "这个设计有 {pages} 页，而这单要印 {need} 面。我们会用第一页。",

    "addon.import-canva.fix.heading": "两种补救办法",
    "addon.import-canva.fix.scale.title": "放大 {pct}%，让它有出血",
    "addon.import-canva.fix.scale.body":
      "放大后宽度为 {w} 毫米，左右两边各会裁掉约 {mm} 毫米。要保留的内容应离边至少 {safe} 毫米。",
    "addon.import-canva.fix.scale.cta": "放大 {pct}%",
    "addon.import-canva.fix.redo.title": "在 Canva 里改好后重新导入",
    "addon.import-canva.fix.redo.body":
      "在 Canva 里把设计尺寸设为 {needW} × {needH} 毫米——也就是 {trimW} × {trimH} 毫米，四边各加 {bleed} 毫米——并让背景一直铺到边缘。然后重新导入。",
    "addon.import-canva.fix.redo.cta": "尺寸已设好——重新导入",

    "addon.import-canva.demo.connect":
      "模拟：本演示不会联系任何账户。在此授权只会连到本页中的固定数据。",
    "addon.import-canva.demo.consent":
      "模拟：在此同意不会授予任何真实权限。不会联系任何账户，也没有任何内容离开本页。",
    "addon.import-canva.demo.pick":
      "模拟：这四个设计是本演示中的固定数据。没有读取任何账户。",
    "addon.import-canva.demo.note":
      "模拟：这些设计来自本演示中的固定数据。没有联系任何账户，也没有任何内容离开本页。",
    "addon.import-canva.demo.account":
      "模拟：从未连接过任何账户。这里的名称和日期是本演示中的固定数据。",
    "addon.import-canva.notAffiliated": "Adminium 与该公司没有任何关联。",
    "addon.import-canva.unavailable.tooBig":
      "从 Canva 导出的设计撑不到 {w} × {h} 毫米。这个尺寸请发给我们可直接付印的 PDF。",

    "addon.import-canva.design.bakeryLoyalty": "Harbour Bakery — 会员卡",
    "addon.import-canva.design.cyclesService": "Two Rivers Cycles — 保养卡",
    "addon.import-canva.design.yogaTimetable": "Bramble Yoga — 课程表",
    "addon.import-canva.design.galleryInvite": "The Little Gallery — 私人预展邀请函",
  },

  "zh-TW": {
    // ── Host chrome this add-on owns: the connect sentence, its own settings
    //    panel copy, what a disconnect takes and keeps, and its activity lines.
    "addon.import-canva.what": "客戶可以把自己帳號裡已經做好的稿件帶過來。工坊對它做的檢查，和對上傳檔案完全一樣。",
    "addon.import-canva.set.account": "帳號",
    "addon.import-canva.set.accountWhen": "{account} · 授權於 {when}",
    "addon.import-canva.set.nothingElse": "沒有別的可設。帳號就是全部。",
    "addon.import-canva.disconnect.goes": "客戶在稿件頁面上不會再看到「從 Canva 帶過來」。授權會被撤銷，權杖會被刪除。",
    "addon.import-canva.disconnect.stays": "已帶進訂單的稿件都留著。",
    "addon.import-canva.act.1": "{when} · 稿件已帶入 · {ref}",
    "addon.import-canva.act.2": "{when} · 已讀取稿件清單",
    "addon.import-canva.act.3": "{when} · 帳號已授權",

    "addon.import-canva.line":
      "把你已經在 Canva 裡做好的設計帶進來，我們會用與上傳檔案相同的方式檢查它。",

    "addon.import-canva.tile.title": "從 Canva 帶進來",
    "addon.import-canva.tile.body":
      "從你的帳戶裡挑一個設計。我們檢查它的方式和檢查上傳檔案完全一樣。",

    "addon.import-canva.flow.title": "從 Canva 帶進來",
    "addon.import-canva.flow.lede": "我們會對它做與上傳檔案相同的檢查。",
    "addon.import-canva.flow.back": "返回稿件頁面",
    "addon.import-canva.flow.close": "關閉",

    "addon.import-canva.step.connect": "連接",
    "addon.import-canva.step.pick": "挑選設計",
    "addon.import-canva.step.import": "匯入並檢查",
    "addon.import-canva.dims": "{w} × {h} 公釐",

    "addon.import-canva.connect.title": "連接你的 Canva 帳戶",
    "addon.import-canva.connect.body":
      "我們會讀取你的設計清單，讓你從中挑選，並下載你選中的那一個。僅此而已。",
    "addon.import-canva.connect.authorize": "授權",

    "addon.import-canva.consent.title": "你所同意的內容",
    "addon.import-canva.consent.body": "登入你的 Canva 帳戶後，本站可以做這些事，僅此而已。",
    "addon.import-canva.consent.cancel": "取消",
    "addon.import-canva.perm.list": "讀取你的設計清單",
    "addon.import-canva.perm.export": "下載你選中的那一個設計",
    "addon.import-canva.perm.nothingElse":
      "僅此而已——不會修改或發布任何內容，也永遠看不到你的帳戶資料",

    "addon.import-canva.pick.search": "搜尋你的設計",
    "addon.import-canva.pick.these": "這些是你帳戶裡的設計。",
    "addon.import-canva.pick.none": "你的帳戶裡沒有相符的內容。",
    "addon.import-canva.pick.edited": "編輯於 {date}",
    "addon.import-canva.pick.choose": "匯入{name}",

    "addon.import-canva.import.checking": "正在做與上傳檔案相同的檢查……",
    "addon.import-canva.import.from": "{name} · 從你的帳戶匯入",
    "addon.import-canva.import.pickAnother": "換一個設計",
    "addon.import-canva.import.blocked": "這一份照原樣印不了——下面有兩條出路。",
    "addon.import-canva.import.ok": "各項檢查都通過了。開工前仍會有人再看一遍。",
    "addon.import-canva.import.okAgain": "重新檢查過了。現在沒問題。",
    "addon.import-canva.import.use": "使用這個設計",

    "addon.import-canva.check.bleedOk": "四邊各留 {mm} 公釐出血",
    "addon.import-canva.check.bleedMissing":
      "這個設計沒有出血。它是 {haveW} × {haveH} 公釐，而我們需要含出血 {needW} × {needH} 公釐。",
    "addon.import-canva.check.dpiOk": "成品尺寸下為 {dpi} dpi",
    "addon.import-canva.check.dpiLow": "這個設計在成品尺寸下只有 {dpi} dpi——我們需要 {need}。",
    "addon.import-canva.check.shapeOk": "尺寸與這張單子相符。",
    "addon.import-canva.check.shapeOff":
      "這個設計的尺寸與這張單子不同：左右兩邊各會裁掉約 {inline} 公釐，上下各裁掉 {block} 公釐。",
    "addon.import-canva.check.pages": "檔案 {pages} 頁，印刷 {sides} 面",
    "addon.import-canva.check.pagesShort": "這個設計有 {pages} 頁，而這張單子要印 {need} 面。",
    "addon.import-canva.check.pagesExtra":
      "這個設計有 {pages} 頁，而這張單子要印 {need} 面。我們會用第一頁。",

    "addon.import-canva.fix.heading": "兩種補救辦法",
    "addon.import-canva.fix.scale.title": "放大 {pct}%，讓它有出血",
    "addon.import-canva.fix.scale.body":
      "放大後寬度為 {w} 公釐，左右兩邊各會裁掉約 {mm} 公釐。要保留的內容應離邊至少 {safe} 公釐。",
    "addon.import-canva.fix.scale.cta": "放大 {pct}%",
    "addon.import-canva.fix.redo.title": "在 Canva 裡改好後重新匯入",
    "addon.import-canva.fix.redo.body":
      "在 Canva 裡把設計尺寸設為 {needW} × {needH} 公釐——也就是 {trimW} × {trimH} 公釐，四邊各加 {bleed} 公釐——並讓背景一直鋪到邊緣。然後重新匯入。",
    "addon.import-canva.fix.redo.cta": "尺寸已設好——重新匯入",

    "addon.import-canva.demo.connect":
      "模擬：本示範不會聯繫任何帳戶。在此授權只會連到本頁中的固定資料。",
    "addon.import-canva.demo.consent":
      "模擬：在此同意不會授予任何真實權限。不會聯繫任何帳戶，也沒有任何內容離開本頁。",
    "addon.import-canva.demo.pick":
      "模擬：這四個設計是本示範中的固定資料。沒有讀取任何帳戶。",
    "addon.import-canva.demo.note":
      "模擬：這些設計來自本示範中的固定資料。沒有聯繫任何帳戶，也沒有任何內容離開本頁。",
    "addon.import-canva.demo.account":
      "模擬：從未連接過任何帳戶。這裡的名稱和日期是本示範中的固定資料。",
    "addon.import-canva.notAffiliated": "Adminium 與該公司沒有任何關聯。",
    "addon.import-canva.unavailable.tooBig":
      "從 Canva 匯出的設計撐不到 {w} × {h} 公釐。這個尺寸請寄給我們可直接付印的 PDF。",

    "addon.import-canva.design.bakeryLoyalty": "Harbour Bakery — 會員卡",
    "addon.import-canva.design.cyclesService": "Two Rivers Cycles — 保養卡",
    "addon.import-canva.design.yogaTimetable": "Bramble Yoga — 課程表",
    "addon.import-canva.design.galleryInvite": "The Little Gallery — 私人預展邀請函",
  },

  "ar-EG": {
    // ── Host chrome this add-on owns: the connect sentence, its own settings
    //    panel copy, what a disconnect takes and keeps, and its activity lines.
    "addon.import-canva.what": "يتيح للعميل إحضار تصميم صنعه في حسابه. تجري عليه الورشة الفحوص نفسها التي تجريها على ملف مرفوع.",
    "addon.import-canva.set.account": "الحساب",
    "addon.import-canva.set.accountWhen": "{account} · اعتُمد في {when}",
    "addon.import-canva.set.nothingElse": "لا شيء آخر يُضبط. الحساب هو كل الأمر.",
    "addon.import-canva.disconnect.goes": "لن يرى العملاء بعد الآن «أحضِره من Canva» في شاشة ملفات التصميم. ويُسحب التفويض ويُحذف الرمز.",
    "addon.import-canva.disconnect.stays": "التصاميم التي دخلت على الطلبات تبقى.",
    "addon.import-canva.act.1": "{when} · أُحضر تصميم · {ref}",
    "addon.import-canva.act.2": "{when} · قُرئت قائمة التصاميم",
    "addon.import-canva.act.3": "{when} · اعتُمد الحساب",

    "addon.import-canva.line":
      "هات تصميمًا جاهزًا عملته في Canva، ونحن نفحصه بنفس الطريقة التي نفحص بها أي ملف مرفوع.",

    "addon.import-canva.tile.title": "أحضره من Canva",
    "addon.import-canva.tile.body":
      "اختر تصميمًا من حسابك. نفحصه تمامًا كما نفحص ملفًا مرفوعًا.",

    "addon.import-canva.flow.title": "أحضره من Canva",
    "addon.import-canva.flow.lede": "نجري عليه نفس الفحوص التي نجريها على ملف مرفوع.",
    "addon.import-canva.flow.back": "العودة إلى شاشة ملفات التصميم",
    "addon.import-canva.flow.close": "إغلاق",

    "addon.import-canva.step.connect": "الربط",
    "addon.import-canva.step.pick": "اختر تصميمًا",
    "addon.import-canva.step.import": "الاستيراد والفحص",
    "addon.import-canva.dims": "{w} × {h} مم",

    "addon.import-canva.connect.title": "اربط حسابك على Canva",
    "addon.import-canva.connect.body":
      "سنقرأ قائمة تصميماتك لتختار منها واحدًا، وننزّل التصميم الذي تختاره. لا شيء غير ذلك.",
    "addon.import-canva.connect.authorize": "اسمح بالوصول",

    "addon.import-canva.consent.title": "ما الذي توافق عليه",
    "addon.import-canva.consent.body":
      "تسجيل الدخول إلى حسابك على Canva يتيح لهذا الموقع أن يفعل ما يلي، ولا شيء غيره.",
    "addon.import-canva.consent.cancel": "إلغاء",
    "addon.import-canva.perm.list": "قراءة قائمة تصميماتك",
    "addon.import-canva.perm.export": "تنزيل التصميم الواحد الذي تختاره",
    "addon.import-canva.perm.nothingElse":
      "لا شيء غير ذلك — لا يعدّل شيئًا ولا ينشره، ولا يرى بيانات حسابك أبدًا",

    "addon.import-canva.pick.search": "ابحث في تصميماتك",
    "addon.import-canva.pick.these": "هذه هي التصميمات الموجودة في حسابك.",
    "addon.import-canva.pick.none": "لا شيء في حسابك يطابق ذلك.",
    "addon.import-canva.pick.edited": "عُدّل في {date}",
    "addon.import-canva.pick.choose": "استيراد {name}",

    "addon.import-canva.import.checking": "تجري الآن نفس فحوص الملف المرفوع…",
    "addon.import-canva.import.from": "{name} · مستورد من حسابك",
    "addon.import-canva.import.pickAnother": "اختر تصميمًا آخر",
    "addon.import-canva.import.blocked": "هذا لا يمكن طبعه بحالته — بالأسفل مخرجان.",
    "addon.import-canva.import.ok": "كل شيء سليم. سيراجعه إنسان قبل بدء التنفيذ على أي حال.",
    "addon.import-canva.import.okAgain": "فُحص مرة أخرى. صار سليمًا الآن.",
    "addon.import-canva.import.use": "استخدم هذا التصميم",

    "addon.import-canva.check.bleedOk": "زيادة قص {mm} مم على الحواف الأربع",
    "addon.import-canva.check.bleedMissing":
      "هذا التصميم بدون زيادة قص. مقاسه {haveW} × {haveH} مم ونحتاج {needW} × {needH} مم شاملة زيادة القص.",
    "addon.import-canva.check.dpiOk": "{dpi} نقطة/بوصة بالمقاس النهائي",
    "addon.import-canva.check.dpiLow":
      "هذا التصميم {dpi} نقطة/بوصة بالمقاس النهائي — ونحتاج {need}.",
    "addon.import-canva.check.shapeOk": "المقاس مطابق للشغل.",
    "addon.import-canva.check.shapeOff":
      "مقاس هذا التصميم يختلف عن الشغل: سيُقطع نحو {inline} مم من كل من الحافتين اليسرى واليمنى، و{block} مم من الأعلى والأسفل.",
    "addon.import-canva.check.pages": "عدد صفحات الملف {pages} لعدد {sides} وجه مطبوع",
    "addon.import-canva.check.pagesShort":
      "هذا التصميم فيه {pages} صفحة والشغل يُطبع على {need}.",
    "addon.import-canva.check.pagesExtra":
      "هذا التصميم فيه {pages} صفحة والشغل يُطبع على {need}. سنستخدم الأولى.",

    "addon.import-canva.fix.heading": "طريقتان لضبط الأمر",
    "addon.import-canva.fix.scale.title": "كبّره {pct} % حتى تتوفر زيادة القص",
    "addon.import-canva.fix.scale.body":
      "سيصبح عرضه {w} مم، فيُقطع نحو {mm} مم من كل من الحافتين اليسرى واليمنى. ما تريد الاحتفاظ به ينبغي أن يبعد {safe} مم على الأقل عن الحافة.",
    "addon.import-canva.fix.scale.cta": "كبّره {pct} %",
    "addon.import-canva.fix.redo.title": "صحّحه في Canva واستورده من جديد",
    "addon.import-canva.fix.redo.body":
      "في Canva اضبط مقاس التصميم على {needW} × {needH} مم — أي {trimW} × {trimH} مم زائد {bleed} مم على كل حافة — ودع الخلفية تمتد حتى الحافة. ثم استورده من جديد.",
    "addon.import-canva.fix.redo.cta": "ضبطت المقاس — استورده من جديد",

    "addon.import-canva.demo.connect":
      "محاكاة: هذا العرض لا يتصل بأي حساب. السماح هنا يصل إلى بيانات ثابتة في هذه الصفحة.",
    "addon.import-canva.demo.consent":
      "محاكاة: الموافقة هنا لا تمنح أي وصول حقيقي. لا يُتصل بأي حساب ولا يغادر شيء هذه الصفحة.",
    "addon.import-canva.demo.pick":
      "محاكاة: هذه التصميمات الأربعة بيانات ثابتة في هذا العرض. لم يُقرأ أي حساب.",
    "addon.import-canva.demo.note":
      "محاكاة: هذه التصميمات تأتي من بيانات ثابتة في هذا العرض. لم يُتصل بأي حساب ولم يغادر شيء هذه الصفحة.",
    "addon.import-canva.demo.account":
      "محاكاة: لم يُربط أي حساب قط. الاسم والتاريخ هنا بيانات ثابتة في هذا العرض.",
    "addon.import-canva.notAffiliated": "Adminium ليست تابعة لهذه الشركة.",
    "addon.import-canva.unavailable.tooBig":
      "التصميم المصدَّر من Canva لا يصمد بمقاس {w} × {h} مم. لهذا المقاس أرسل لنا ملف PDF جاهزًا للطباعة.",

    "addon.import-canva.design.bakeryLoyalty": "Harbour Bakery — كارت الولاء",
    "addon.import-canva.design.cyclesService": "Two Rivers Cycles — كارت الصيانة",
    "addon.import-canva.design.yogaTimetable": "Bramble Yoga — جدول الحصص",
    "addon.import-canva.design.galleryInvite": "The Little Gallery — دعوة عرض خاص",
  },
} as const;

/** The English keys are the source of truth; the other seven mirror them. */
export type ImportCanvaKey = keyof (typeof importCanvaStrings)["en-US"];

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

