/*
 * VENDORED from add-ons/packages/design-studio/src/i18n/strings.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `design-studio`; its manifest, tests and README live in the monorepo.
 */
/**
 * Design Studio's user-visible strings, in all eight locales.
 *
 * SHAPE AND PARITY. The nested shape mirrors the host's `i18n/strings/chrome.ts`
 * exactly — `{ "en-US": { key: value }, "de-DE": { …same keys… }, … }` — because
 * the host merges this module into its own bundle and its `Area<>` type turns a
 * missing key into a COMPILE error rather than a silent per-key fallback to
 * English. Every key here exists in all eight, or the host will not build.
 *
 * Every key is namespaced under `addon.design-studio.` so an add-on can never
 * shadow a host key or another add-on's: the host flattens all areas into one
 * bundle and a later area silently wins a collision.
 *
 * A NOTE FOR TRANSLATORS, and it is not optional. The English copy avoids seven
 * marketing words on purpose, and avoids them as SUBSTRINGS rather than as
 * words, because the release sweep greps built output case-insensitively. The
 * banned runs are listed in `strings.test.ts`, which checks all eight locales
 * against them; they are not spelled out in this file because this file SHIPS
 * — Vite's library build keeps comments so that pure annotations survive, and a
 * warning about a banned word that itself contains the banned word would be
 * the first thing a grep found.
 *
 * The traps are not only the obvious ones. Ordinary words in three of these
 * languages contain a banned run in the middle — an English word for a
 * clarification, an English word for a border, several French nouns for a
 * trade or a district, and the Danish and German noun for a scheme. Where your
 * language's natural term is one of those, prefer the plainer phrase a print
 * works would actually say to a customer; the suite will tell you if you did
 * not.
 *
 * Product names are names, not phrases, and are not here: "Design Studio" is
 * what a thing is called, and a translated product name is a different
 * product. Font family
 * names (Manrope, JetBrains Mono, Georgia, Helvetica) are names in the same way.
 */

export const designStudioStrings = {
  "en-US": {
    // ── Host chrome this add-on owns: the connect sentence, its own settings
    //    panel copy, what a disconnect takes and keeps, and its activity lines.
    "addon.design-studio.what": "This adds a small editor to your site. A customer makes a straightforward design at the finished size, and it arrives with the bleed already correct.",
    "addon.design-studio.set.layoutsNone": "Turn at least one on, or the editor has nothing to open.",
    "addon.design-studio.set.proofOn": "The works checks it like any other job before it goes on a press.",
    "addon.design-studio.set.proofOff": "Designs made here go straight to prepress. The works can still ask for a proof.",
    "addon.design-studio.disconnect.goes": "Customers will no longer see “Design it here” on the artwork screen.",
    "addon.design-studio.disconnect.stays": "Designs already sent with orders are kept, and so are the settings above if you connect it again.",
    "addon.design-studio.act.1": "{when} · design used on an order · {ref}",
    "addon.design-studio.act.2": "{when} · design saved for later",
    "addon.design-studio.act.3": "{when} · editor opened · {ref}",

    // Shelf and manage panel
    "addon.design-studio.line": "A small artwork editor inside your site.",
    "addon.design-studio.desc":
      "Customers pick a starting layout and edit it on a canvas drawn at the finished size, with the bleed and safe area already on it. What comes out is the right size by construction.",
    "addon.design-studio.disconnect":
      "Customers will no longer see “Design it here”. Designs already sent with orders are kept.",
    "addon.design-studio.noCompany": "Design Studio connects to no outside company.",
    "addon.design-studio.noAccount": "It needs no outside account at all.",

    // Permissions, ticked before the shop agrees
    "addon.design-studio.perm.readJob": "Read the job a design is being made for",
    "addon.design-studio.perm.saveDesigns": "Save designs against your orders",
    "addon.design-studio.perm.noAccount": "Nothing else, and no outside account",

    // Settings the manage panel renders
    "addon.design-studio.set.layouts": "Starting layouts customers may use",
    "addon.design-studio.set.layoutsHint": "Switch off anything the works does not make.",
    "addon.design-studio.set.proof": "A design still needs a proof",
    "addon.design-studio.set.proofHint":
      "On by default. The works checks every job, and the site already says so.",

    // Why the editor may not be on offer
    "addon.design-studio.reason.tooBig":
      "This one is larger than the editor draws. Send a print-ready PDF instead.",
    "addon.design-studio.reason.noLayouts": "The works has not made any starting layouts available.",

    // The action tile in the artwork slot
    "addon.design-studio.tile.title": "Design it here",
    "addon.design-studio.tile.body":
      "Pick a starting layout and edit it at the finished size. The bleed is already on it.",

    // What the customer sees once a design is done
    "addon.design-studio.result.title": "Design ready",
    "addon.design-studio.result.why":
      "It was made here at the finished size, so the bleed is right by construction — there is nothing for you to fix.",
    "addon.design-studio.result.saved": "Saved. You can come back to it from your order.",
    "addon.design-studio.result.reopen": "Open it again",

    // Editor chrome
    "addon.design-studio.editor.front": "Front",
    "addon.design-studio.editor.back": "Back",
    "addon.design-studio.editor.undo": "Undo",
    "addon.design-studio.editor.redo": "Redo",
    "addon.design-studio.editor.zoomIn": "Zoom in",
    "addon.design-studio.editor.zoomOut": "Zoom out",
    "addon.design-studio.editor.use": "Use this design",
    "addon.design-studio.editor.save": "Save and come back",
    "addon.design-studio.editor.withBleed": "with bleed",

    // Tool rail
    "addon.design-studio.tool.select": "Select",
    "addon.design-studio.tool.text": "Text",
    "addon.design-studio.tool.image": "Image",
    "addon.design-studio.tool.rect": "Rectangle",
    "addon.design-studio.tool.ellipse": "Ellipse",
    "addon.design-studio.tool.line": "Line",
    "addon.design-studio.tool.guides": "Guides",

    // Canvas legend and the honest lines
    "addon.design-studio.legend.trim": "Trim — where it is cut",
    "addon.design-studio.legend.bleed": "Bleed",
    "addon.design-studio.legend.bleedValue": "{v} outside",
    "addon.design-studio.legend.safe": "Safe area",
    "addon.design-studio.legend.safeValue": "{v} inside",
    "addon.design-studio.safeNote": "Anything outside the safe area may be trimmed off.",
    "addon.design-studio.honest":
      "This is a simple editor for straightforward jobs — for complex artwork, send a print-ready PDF.",
    "addon.design-studio.warn.outsideSafe":
      "Something sits outside the safe area and may be trimmed off.",

    // Inspector
    "addon.design-studio.insp.none":
      "Nothing selected. Click something on the canvas, or add text, an image or a shape from the tools.",
    "addon.design-studio.insp.posSize": "Position & size",
    "addon.design-studio.insp.mm": "mm",
    "addon.design-studio.insp.delete": "Delete",
    "addon.design-studio.insp.text": "Text",
    "addon.design-studio.insp.font": "Font",
    "addon.design-studio.insp.size": "Size",
    "addon.design-studio.insp.weight": "Weight",
    "addon.design-studio.insp.alignment": "Alignment",
    "addon.design-studio.align.start": "Align to the start",
    "addon.design-studio.align.center": "Centre",
    "addon.design-studio.align.end": "Align to the end",
    "addon.design-studio.insp.colour": "Colour",
    "addon.design-studio.insp.fill": "Fill",
    "addon.design-studio.insp.stroke": "Stroke",
    "addon.design-studio.insp.noStroke": "No stroke",
    "addon.design-studio.insp.lineWidth": "line",
    "addon.design-studio.insp.radius": "radius",
    "addon.design-studio.insp.alignPage": "Align to the page",
    "addon.design-studio.align.pageLeft": "To the start edge",
    "addon.design-studio.align.pageCentre": "Centre across",
    "addon.design-studio.align.pageRight": "To the end edge",
    "addon.design-studio.align.pageTop": "To the top",
    "addon.design-studio.align.pageMiddle": "Centre down",
    "addon.design-studio.align.pageBottom": "To the bottom",
    "addon.design-studio.insp.spreadX": "Spread across",
    "addon.design-studio.insp.spreadY": "Spread down",
    "addon.design-studio.insp.spreadNeedsThree": "Spreading needs three things on the canvas.",
    "addon.design-studio.insp.order": "Order",
    "addon.design-studio.order.front": "To front",
    "addon.design-studio.order.forward": "Forward",
    "addon.design-studio.order.backward": "Backward",
    "addon.design-studio.order.back": "To back",

    // Layers
    "addon.design-studio.layers": "Layers",
    "addon.design-studio.layers.empty": "Nothing on this side yet.",
    "addon.design-studio.layers.toggle": "Show or hide",
    "addon.design-studio.layers.up": "Move up",
    "addon.design-studio.layers.down": "Move down",

    // Narrow screens
    "addon.design-studio.properties": "Properties",
    "addon.design-studio.close": "Close",

    // Layer names and seeded words
    "addon.design-studio.layer.text": "Text",
    "addon.design-studio.layer.image": "Image",
    "addon.design-studio.layer.rect": "Rectangle",
    "addon.design-studio.layer.ellipse": "Ellipse",
    "addon.design-studio.layer.line": "Line",
    "addon.design-studio.seed.headline": "Your name here",
    "addon.design-studio.seed.detail": "what you do · 07700 900 000 · you@example.com",
    "addon.design-studio.seed.back": "Thank you",
    "addon.design-studio.seed.textDefault": "Your words here",
    "addon.design-studio.seed.imageLabel": "photo goes here",

    // Starting-layout picker
    "addon.design-studio.picker.title": "What are you making?",
    "addon.design-studio.picker.body":
      "The canvas opens at the finished size with the bleed already on it.",
    "addon.design-studio.picker.blank": "Start from blank",
    "addon.design-studio.picker.oneSide": "one side",
    "addon.design-studio.picker.twoSides": "front and back",
    "addon.design-studio.layout.business-card": "Business card",
    "addon.design-studio.layout.folded-card": "Folded card",
    "addon.design-studio.layout.flyer": "Flyer",
    "addon.design-studio.layout.envelope": "Envelope",
    "addon.design-studio.layout.sticker": "Sticker",
    "addon.design-studio.layout.roll-up": "Roll-up banner",

    // The twelve swatches
    "addon.design-studio.swatch.ink": "Ink",
    "addon.design-studio.swatch.slate": "Slate",
    "addon.design-studio.swatch.mist": "Mist",
    "addon.design-studio.swatch.paper": "Paper",
    "addon.design-studio.swatch.magenta": "Magenta",
    "addon.design-studio.swatch.wine": "Wine",
    "addon.design-studio.swatch.indigo": "Indigo",
    "addon.design-studio.swatch.teal": "Teal",
    "addon.design-studio.swatch.green": "Green",
    "addon.design-studio.swatch.amber": "Amber",
    "addon.design-studio.swatch.red": "Red",
    "addon.design-studio.swatch.blue": "Blue",
  },

  "de-DE": {
    // ── Host chrome this add-on owns: the connect sentence, its own settings
    //    panel copy, what a disconnect takes and keeps, and its activity lines.
    "addon.design-studio.what": "Das ergänzt Ihre Website um einen kleinen Editor. Die Kundschaft baut eine schlichte Gestaltung im Endformat, und sie kommt mit korrektem Anschnitt an.",
    "addon.design-studio.set.layoutsNone": "Schalten Sie mindestens eine ein, sonst hat der Editor nichts zu öffnen.",
    "addon.design-studio.set.proofOn": "Die Werkstatt prüft sie wie jeden anderen Auftrag, bevor sie auf eine Maschine geht.",
    "addon.design-studio.set.proofOff": "Hier gebaute Gestaltungen gehen direkt in die Druckvorstufe. Die Werkstatt kann trotzdem einen Andruck verlangen.",
    "addon.design-studio.disconnect.goes": "Die Kundschaft sieht „Hier gestalten“ auf der Druckdatenseite nicht mehr.",
    "addon.design-studio.disconnect.stays": "Bereits mit Aufträgen abgeschickte Gestaltungen bleiben erhalten, und die Einstellungen oben ebenso, falls Sie wieder verbinden.",
    "addon.design-studio.act.1": "{when} · Gestaltung für einen Auftrag genutzt · {ref}",
    "addon.design-studio.act.2": "{when} · Gestaltung für später gesichert",
    "addon.design-studio.act.3": "{when} · Editor geöffnet · {ref}",

    "addon.design-studio.line": "Ein kleiner Druckvorlagen-Editor auf Ihrer Website.",
    "addon.design-studio.desc":
      "Kundinnen und Kunden wählen ein Startformat und bearbeiten es auf einer Fläche in Endgröße, mit Anschnitt und Sicherheitsabstand darauf. Was herauskommt, hat schon durch die Bauart die richtige Größe.",
    "addon.design-studio.disconnect":
      "Kundinnen und Kunden sehen „Hier gestalten“ nicht mehr. Bereits mit Aufträgen gesendete Entwürfe bleiben erhalten.",
    "addon.design-studio.noCompany": "Design Studio verbindet sich mit keinem fremden Unternehmen.",
    "addon.design-studio.noAccount": "Ein Konto anderswo wird dafür nicht gebraucht.",

    "addon.design-studio.perm.readJob": "Den Auftrag lesen, für den gestaltet wird",
    "addon.design-studio.perm.saveDesigns": "Entwürfe zu Ihren Aufträgen speichern",
    "addon.design-studio.perm.noAccount": "Sonst nichts, und kein Konto anderswo",

    "addon.design-studio.set.layouts": "Startformate, die Kunden nutzen dürfen",
    "addon.design-studio.set.layoutsHint": "Schalten Sie ab, was die Druckerei nicht herstellt.",
    "addon.design-studio.set.proof": "Ein Entwurf braucht weiterhin einen Andruck",
    "addon.design-studio.set.proofHint":
      "Standardmäßig an. Die Druckerei prüft jeden Auftrag, und die Website sagt das bereits.",

    "addon.design-studio.reason.tooBig":
      "Das ist größer, als der Editor zeichnet. Senden Sie stattdessen eine druckfertige PDF-Datei.",
    "addon.design-studio.reason.noLayouts": "Die Druckerei hat kein Startformat freigeschaltet.",

    "addon.design-studio.tile.title": "Hier gestalten",
    "addon.design-studio.tile.body":
      "Wählen Sie ein Startformat und bearbeiten Sie es in Endgröße. Der Anschnitt ist schon darauf.",

    "addon.design-studio.result.title": "Entwurf fertig",
    "addon.design-studio.result.why":
      "Er ist hier in Endgröße entstanden, der Anschnitt stimmt also schon durch die Bauart — Sie müssen nichts nacharbeiten.",
    "addon.design-studio.result.saved":
      "Gespeichert. Sie können über Ihren Auftrag jederzeit zurückkehren.",
    "addon.design-studio.result.reopen": "Erneut öffnen",

    "addon.design-studio.editor.front": "Vorderseite",
    "addon.design-studio.editor.back": "Rückseite",
    "addon.design-studio.editor.undo": "Rückgängig",
    "addon.design-studio.editor.redo": "Wiederholen",
    "addon.design-studio.editor.zoomIn": "Vergrößern",
    "addon.design-studio.editor.zoomOut": "Verkleinern",
    "addon.design-studio.editor.use": "Diesen Entwurf verwenden",
    "addon.design-studio.editor.save": "Speichern und zurück",
    "addon.design-studio.editor.withBleed": "mit Anschnitt",

    "addon.design-studio.tool.select": "Auswählen",
    "addon.design-studio.tool.text": "Text",
    "addon.design-studio.tool.image": "Bild",
    "addon.design-studio.tool.rect": "Rechteck",
    "addon.design-studio.tool.ellipse": "Ellipse",
    "addon.design-studio.tool.line": "Linie",
    "addon.design-studio.tool.guides": "Hilfslinien",

    "addon.design-studio.legend.trim": "Schnittkante — hier wird geschnitten",
    "addon.design-studio.legend.bleed": "Anschnitt",
    "addon.design-studio.legend.bleedValue": "{v} außen",
    "addon.design-studio.legend.safe": "Sicherheitsabstand",
    "addon.design-studio.legend.safeValue": "{v} innen",
    "addon.design-studio.safeNote":
      "Alles außerhalb des Sicherheitsabstands kann weggeschnitten werden.",
    "addon.design-studio.honest":
      "Das ist ein einfacher Editor für unkomplizierte Aufträge — für aufwendige Gestaltung senden Sie bitte eine druckfertige PDF-Datei.",
    "addon.design-studio.warn.outsideSafe":
      "Etwas liegt außerhalb des Sicherheitsabstands und kann weggeschnitten werden.",

    "addon.design-studio.insp.none":
      "Nichts ausgewählt. Klicken Sie etwas auf der Fläche an oder fügen Sie Text, ein Bild oder eine Form aus den Werkzeugen ein.",
    "addon.design-studio.insp.posSize": "Position & Größe",
    "addon.design-studio.insp.mm": "mm",
    "addon.design-studio.insp.delete": "Löschen",
    "addon.design-studio.insp.text": "Text",
    "addon.design-studio.insp.font": "Schrift",
    "addon.design-studio.insp.size": "Größe",
    "addon.design-studio.insp.weight": "Stärke",
    "addon.design-studio.insp.alignment": "Ausrichtung",
    "addon.design-studio.align.start": "An den Anfang ausrichten",
    "addon.design-studio.align.center": "Mittig",
    "addon.design-studio.align.end": "An das Ende ausrichten",
    "addon.design-studio.insp.colour": "Farbe",
    "addon.design-studio.insp.fill": "Füllung",
    "addon.design-studio.insp.stroke": "Kontur",
    "addon.design-studio.insp.noStroke": "Keine Kontur",
    "addon.design-studio.insp.lineWidth": "Stärke",
    "addon.design-studio.insp.radius": "Radius",
    "addon.design-studio.insp.alignPage": "An der Seite ausrichten",
    "addon.design-studio.align.pageLeft": "An die Anfangskante",
    "addon.design-studio.align.pageCentre": "Waagerecht mittig",
    "addon.design-studio.align.pageRight": "An die Endkante",
    "addon.design-studio.align.pageTop": "Nach oben",
    "addon.design-studio.align.pageMiddle": "Senkrecht mittig",
    "addon.design-studio.align.pageBottom": "Nach unten",
    "addon.design-studio.insp.spreadX": "Waagerecht verteilen",
    "addon.design-studio.insp.spreadY": "Senkrecht verteilen",
    "addon.design-studio.insp.spreadNeedsThree":
      "Zum Verteilen braucht es drei Dinge auf der Fläche.",
    "addon.design-studio.insp.order": "Reihenfolge",
    "addon.design-studio.order.front": "Ganz nach vorn",
    "addon.design-studio.order.forward": "Nach vorn",
    "addon.design-studio.order.backward": "Nach hinten",
    "addon.design-studio.order.back": "Ganz nach hinten",

    "addon.design-studio.layers": "Ebenen",
    "addon.design-studio.layers.empty": "Auf dieser Seite ist noch nichts.",
    "addon.design-studio.layers.toggle": "Ein- oder ausblenden",
    "addon.design-studio.layers.up": "Nach oben",
    "addon.design-studio.layers.down": "Nach unten",

    "addon.design-studio.properties": "Eigenschaften",
    "addon.design-studio.close": "Schließen",

    "addon.design-studio.layer.text": "Text",
    "addon.design-studio.layer.image": "Bild",
    "addon.design-studio.layer.rect": "Rechteck",
    "addon.design-studio.layer.ellipse": "Ellipse",
    "addon.design-studio.layer.line": "Linie",
    "addon.design-studio.seed.headline": "Ihr Name hier",
    "addon.design-studio.seed.detail": "was Sie tun · 07700 900 000 · sie@example.com",
    "addon.design-studio.seed.back": "Vielen Dank",
    "addon.design-studio.seed.textDefault": "Ihre Worte hier",
    "addon.design-studio.seed.imageLabel": "Bild kommt hierhin",

    "addon.design-studio.picker.title": "Was stellen Sie her?",
    "addon.design-studio.picker.body":
      "Die Fläche öffnet sich in Endgröße, mit dem Anschnitt schon darauf.",
    "addon.design-studio.picker.blank": "Leer beginnen",
    "addon.design-studio.picker.oneSide": "einseitig",
    "addon.design-studio.picker.twoSides": "Vorder- und Rückseite",
    "addon.design-studio.layout.business-card": "Visitenkarte",
    "addon.design-studio.layout.folded-card": "Klappkarte",
    "addon.design-studio.layout.flyer": "Handzettel",
    "addon.design-studio.layout.envelope": "Briefumschlag",
    "addon.design-studio.layout.sticker": "Aufkleber",
    "addon.design-studio.layout.roll-up": "Roll-up-Banner",

    "addon.design-studio.swatch.ink": "Tiefschwarz",
    "addon.design-studio.swatch.slate": "Schiefer",
    "addon.design-studio.swatch.mist": "Nebel",
    "addon.design-studio.swatch.paper": "Papierweiß",
    "addon.design-studio.swatch.magenta": "Magenta",
    "addon.design-studio.swatch.wine": "Weinrot",
    "addon.design-studio.swatch.indigo": "Indigo",
    "addon.design-studio.swatch.teal": "Petrol",
    "addon.design-studio.swatch.green": "Grün",
    "addon.design-studio.swatch.amber": "Bernstein",
    "addon.design-studio.swatch.red": "Rot",
    "addon.design-studio.swatch.blue": "Blau",
  },

  "fr-FR": {
    // ── Host chrome this add-on owns: the connect sentence, its own settings
    //    panel copy, what a disconnect takes and keeps, and its activity lines.
    "addon.design-studio.what": "Cela ajoute un petit éditeur à votre site. Le client compose une création simple au format fini, et elle arrive avec le fond perdu déjà correct.",
    "addon.design-studio.set.layoutsNone": "Activez-en au moins une, sinon l'éditeur n'a rien à ouvrir.",
    "addon.design-studio.set.proofOn": "L'atelier la contrôle comme n'importe quel travail avant la mise en machine.",
    "addon.design-studio.set.proofOff": "Les créations faites ici vont directement au prépresse. L'atelier peut quand même demander un bon à tirer.",
    "addon.design-studio.disconnect.goes": "Les clients ne verront plus « Créez-le ici » sur l'écran des fichiers.",
    "addon.design-studio.disconnect.stays": "Les créations déjà envoyées avec des commandes sont conservées, ainsi que les réglages ci-dessus si vous le reconnectez.",
    "addon.design-studio.act.1": "{when} · création utilisée sur une commande · {ref}",
    "addon.design-studio.act.2": "{when} · création gardée pour plus tard",
    "addon.design-studio.act.3": "{when} · éditeur ouvert · {ref}",

    "addon.design-studio.line": "Un petit éditeur de fichiers d’impression sur votre site.",
    "addon.design-studio.desc":
      "Le client choisit une mise en page de départ et la modifie sur une zone tracée à la taille finie, avec le fond perdu et la zone de sécurité déjà dessinés. Ce qui en sort est à la bonne taille par construction.",
    "addon.design-studio.disconnect":
      "Les clients ne verront plus « Créez-le ici ». Les fichiers déjà envoyés avec des commandes sont conservés.",
    "addon.design-studio.noCompany": "Design Studio ne se connecte à aucune entreprise extérieure.",
    "addon.design-studio.noAccount": "Aucun compte extérieur n’est nécessaire.",

    "addon.design-studio.perm.readJob": "Lire la commande pour laquelle on crée",
    "addon.design-studio.perm.saveDesigns": "Enregistrer les créations sur vos commandes",
    "addon.design-studio.perm.noAccount": "Rien d’autre, et aucun compte extérieur",

    "addon.design-studio.set.layouts": "Mises en page de départ ouvertes aux clients",
    "addon.design-studio.set.layoutsHint": "Désactivez ce que l’atelier ne fabrique pas.",
    "addon.design-studio.set.proof": "Une création demande toujours un bon à tirer",
    "addon.design-studio.set.proofHint":
      "Activé par défaut. L’atelier vérifie chaque commande, et le site le dit déjà.",

    "addon.design-studio.reason.tooBig":
      "Ce format dépasse ce que l’éditeur trace. Envoyez plutôt un PDF prêt à imprimer.",
    "addon.design-studio.reason.noLayouts":
      "L’atelier n’a ouvert aucune mise en page de départ.",

    "addon.design-studio.tile.title": "Créez-le ici",
    "addon.design-studio.tile.body":
      "Choisissez une mise en page de départ et modifiez-la à la taille finie. Le fond perdu est déjà dessus.",

    "addon.design-studio.result.title": "Création prête",
    "addon.design-studio.result.why":
      "Elle a été faite ici à la taille finie : le fond perdu est donc juste par construction, vous n’avez rien à corriger.",
    "addon.design-studio.result.saved":
      "Enregistré. Vous pouvez y revenir depuis votre commande.",
    "addon.design-studio.result.reopen": "Rouvrir",

    "addon.design-studio.editor.front": "Recto",
    "addon.design-studio.editor.back": "Verso",
    "addon.design-studio.editor.undo": "Annuler",
    "addon.design-studio.editor.redo": "Rétablir",
    "addon.design-studio.editor.zoomIn": "Agrandir",
    "addon.design-studio.editor.zoomOut": "Réduire",
    "addon.design-studio.editor.use": "Utiliser cette création",
    "addon.design-studio.editor.save": "Enregistrer et revenir",
    "addon.design-studio.editor.withBleed": "avec fond perdu",

    "addon.design-studio.tool.select": "Sélection",
    "addon.design-studio.tool.text": "Texte",
    "addon.design-studio.tool.image": "Image",
    "addon.design-studio.tool.rect": "Rectangle",
    "addon.design-studio.tool.ellipse": "Ellipse",
    "addon.design-studio.tool.line": "Trait",
    "addon.design-studio.tool.guides": "Repères",

    "addon.design-studio.legend.trim": "Coupe — là où c’est massicoté",
    "addon.design-studio.legend.bleed": "Fond perdu",
    "addon.design-studio.legend.bleedValue": "{v} à l’extérieur",
    "addon.design-studio.legend.safe": "Zone de sécurité",
    "addon.design-studio.legend.safeValue": "{v} à l’intérieur",
    "addon.design-studio.safeNote":
      "Tout ce qui dépasse la zone de sécurité risque d’être massicoté.",
    "addon.design-studio.honest":
      "C’est un éditeur simple pour des travaux simples — pour une création complexe, envoyez un PDF prêt à imprimer.",
    "addon.design-studio.warn.outsideSafe":
      "Un élément dépasse la zone de sécurité et risque d’être massicoté.",

    "addon.design-studio.insp.none":
      "Rien de sélectionné. Cliquez un élément sur la zone, ou ajoutez du texte, une image ou une forme depuis les outils.",
    "addon.design-studio.insp.posSize": "Position et taille",
    "addon.design-studio.insp.mm": "mm",
    "addon.design-studio.insp.delete": "Supprimer",
    "addon.design-studio.insp.text": "Texte",
    "addon.design-studio.insp.font": "Police",
    "addon.design-studio.insp.size": "Corps",
    "addon.design-studio.insp.weight": "Graisse",
    "addon.design-studio.insp.alignment": "Alignement",
    "addon.design-studio.align.start": "Aligner au début",
    "addon.design-studio.align.center": "Centrer",
    "addon.design-studio.align.end": "Aligner à la fin",
    "addon.design-studio.insp.colour": "Couleur",
    "addon.design-studio.insp.fill": "Remplissage",
    "addon.design-studio.insp.stroke": "Contour",
    "addon.design-studio.insp.noStroke": "Sans contour",
    "addon.design-studio.insp.lineWidth": "trait",
    "addon.design-studio.insp.radius": "rayon",
    "addon.design-studio.insp.alignPage": "Aligner sur la page",
    "addon.design-studio.align.pageLeft": "Sur le bord de début",
    "addon.design-studio.align.pageCentre": "Centrer en largeur",
    "addon.design-studio.align.pageRight": "Sur le bord de fin",
    "addon.design-studio.align.pageTop": "En haut",
    "addon.design-studio.align.pageMiddle": "Centrer en hauteur",
    "addon.design-studio.align.pageBottom": "En bas",
    "addon.design-studio.insp.spreadX": "Répartir en largeur",
    "addon.design-studio.insp.spreadY": "Répartir en hauteur",
    "addon.design-studio.insp.spreadNeedsThree":
      "Répartir demande trois éléments sur la zone.",
    "addon.design-studio.insp.order": "Ordre",
    "addon.design-studio.order.front": "Au premier rang",
    "addon.design-studio.order.forward": "Vers l’avant",
    "addon.design-studio.order.backward": "Vers l’arrière",
    "addon.design-studio.order.back": "Au dernier rang",

    "addon.design-studio.layers": "Calques",
    "addon.design-studio.layers.empty": "Rien sur cette face pour l’instant.",
    "addon.design-studio.layers.toggle": "Afficher ou masquer",
    "addon.design-studio.layers.up": "Monter",
    "addon.design-studio.layers.down": "Descendre",

    "addon.design-studio.properties": "Propriétés",
    "addon.design-studio.close": "Fermer",

    "addon.design-studio.layer.text": "Texte",
    "addon.design-studio.layer.image": "Image",
    "addon.design-studio.layer.rect": "Rectangle",
    "addon.design-studio.layer.ellipse": "Ellipse",
    "addon.design-studio.layer.line": "Trait",
    "addon.design-studio.seed.headline": "Votre nom ici",
    // The natural French noun for a trade carries a banned run in the middle;
    // "travail" says the same thing and does not. See the header.
    "addon.design-studio.seed.detail": "votre travail · 07700 900 000 · vous@example.com",
    "addon.design-studio.seed.back": "Merci",
    "addon.design-studio.seed.textDefault": "Vos mots ici",
    "addon.design-studio.seed.imageLabel": "photo ici",

    "addon.design-studio.picker.title": "Que fabriquez-vous ?",
    "addon.design-studio.picker.body":
      "La zone s’ouvre à la taille finie, avec le fond perdu déjà dessus.",
    "addon.design-studio.picker.blank": "Partir d’une page vide",
    "addon.design-studio.picker.oneSide": "une face",
    "addon.design-studio.picker.twoSides": "recto et verso",
    "addon.design-studio.layout.business-card": "Carte de visite",
    "addon.design-studio.layout.folded-card": "Carte pliée",
    "addon.design-studio.layout.flyer": "Prospectus",
    "addon.design-studio.layout.envelope": "Enveloppe",
    "addon.design-studio.layout.sticker": "Autocollant",
    "addon.design-studio.layout.roll-up": "Banderole enroulable",

    "addon.design-studio.swatch.ink": "Encre",
    "addon.design-studio.swatch.slate": "Ardoise",
    "addon.design-studio.swatch.mist": "Brume",
    "addon.design-studio.swatch.paper": "Papier",
    "addon.design-studio.swatch.magenta": "Magenta",
    "addon.design-studio.swatch.wine": "Lie-de-vin",
    "addon.design-studio.swatch.indigo": "Indigo",
    "addon.design-studio.swatch.teal": "Bleu canard",
    "addon.design-studio.swatch.green": "Vert",
    "addon.design-studio.swatch.amber": "Ambre",
    "addon.design-studio.swatch.red": "Rouge",
    "addon.design-studio.swatch.blue": "Bleu",
  },

  "cs-CZ": {
    // ── Host chrome this add-on owns: the connect sentence, its own settings
    //    panel copy, what a disconnect takes and keeps, and its activity lines.
    "addon.design-studio.what": "Přidá na váš web malý editor. Zákazník udělá jednoduchý návrh v čistém formátu a přijde už se správným spadem.",
    "addon.design-studio.set.layoutsNone": "Zapněte alespoň jednu, jinak editor nemá co otevřít.",
    "addon.design-studio.set.proofOn": "Dílna ho zkontroluje jako každou jinou zakázku, než půjde do stroje.",
    "addon.design-studio.set.proofOff": "Návrhy udělané tady jdou rovnou do předtiskové přípravy. Dílna si nátisk může vyžádat i tak.",
    "addon.design-studio.disconnect.goes": "Zákazníci už na obrazovce s podklady neuvidí „Navrhněte to tady“.",
    "addon.design-studio.disconnect.stays": "Návrhy odeslané se zakázkami zůstávají, a nastavení výše také, kdybyste doplněk zapojili znovu.",
    "addon.design-studio.act.1": "{when} · návrh použit na zakázce · {ref}",
    "addon.design-studio.act.2": "{when} · návrh uložen na později",
    "addon.design-studio.act.3": "{when} · editor otevřen · {ref}",

    "addon.design-studio.line": "Malý editor tiskových podkladů přímo na vašem webu.",
    "addon.design-studio.desc":
      "Zákazník si vybere výchozí předlohu a upraví ji na ploše vykreslené v čisté velikosti, se spadávkou i bezpečnou zónou. To, co z toho vyjde, má správnou velikost už svou stavbou.",
    "addon.design-studio.disconnect":
      "Zákazníci už neuvidí „Navrhněte si to zde“. Návrhy odeslané se zakázkami zůstávají.",
    "addon.design-studio.noCompany": "Design Studio se nepřipojuje k žádné cizí firmě.",
    "addon.design-studio.noAccount": "Žádný účet jinde k tomu není potřeba.",

    "addon.design-studio.perm.readJob": "Číst zakázku, pro kterou se návrh dělá",
    "addon.design-studio.perm.saveDesigns": "Ukládat návrhy k vašim zakázkám",
    "addon.design-studio.perm.noAccount": "Nic dalšího a žádný účet jinde",

    "addon.design-studio.set.layouts": "Výchozí předlohy dostupné zákazníkům",
    "addon.design-studio.set.layoutsHint": "Vypněte to, co tiskárna nevyrábí.",
    "addon.design-studio.set.proof": "Návrh stále potřebuje náhled ke schválení",
    "addon.design-studio.set.proofHint":
      "Ve výchozím stavu zapnuto. Tiskárna kontroluje každou zakázku a web to už říká.",

    "addon.design-studio.reason.tooBig":
      "Tohle je větší, než editor vykreslí. Pošlete raději PDF připravené k tisku.",
    "addon.design-studio.reason.noLayouts": "Tiskárna nezpřístupnila žádnou výchozí předlohu.",

    "addon.design-studio.tile.title": "Navrhněte si to zde",
    "addon.design-studio.tile.body":
      "Vyberte výchozí předlohu a upravte ji v čisté velikosti. Spadávka už je na ní.",

    "addon.design-studio.result.title": "Návrh je hotový",
    "addon.design-studio.result.why":
      "Vznikl tady v čisté velikosti, takže spadávka sedí už svou stavbou — nemusíte nic opravovat.",
    "addon.design-studio.result.saved": "Uloženo. Vrátit se k tomu můžete ze své zakázky.",
    "addon.design-studio.result.reopen": "Otevřít znovu",

    "addon.design-studio.editor.front": "Přední strana",
    "addon.design-studio.editor.back": "Zadní strana",
    "addon.design-studio.editor.undo": "Zpět",
    "addon.design-studio.editor.redo": "Znovu",
    "addon.design-studio.editor.zoomIn": "Přiblížit",
    "addon.design-studio.editor.zoomOut": "Oddálit",
    "addon.design-studio.editor.use": "Použít tento návrh",
    "addon.design-studio.editor.save": "Uložit a vrátit se",
    "addon.design-studio.editor.withBleed": "se spadávkou",

    "addon.design-studio.tool.select": "Výběr",
    "addon.design-studio.tool.text": "Text",
    "addon.design-studio.tool.image": "Obrázek",
    "addon.design-studio.tool.rect": "Obdélník",
    "addon.design-studio.tool.ellipse": "Elipsa",
    "addon.design-studio.tool.line": "Linka",
    "addon.design-studio.tool.guides": "Vodítka",

    "addon.design-studio.legend.trim": "Ořez — tady se to řeže",
    "addon.design-studio.legend.bleed": "Spadávka",
    "addon.design-studio.legend.bleedValue": "{v} vně",
    "addon.design-studio.legend.safe": "Bezpečná zóna",
    "addon.design-studio.legend.safeValue": "{v} dovnitř",
    "addon.design-studio.safeNote": "Cokoli mimo bezpečnou zónu může být odříznuto.",
    "addon.design-studio.honest":
      "Tohle je jednoduchý editor na přímočaré zakázky — na složitější grafiku pošlete PDF připravené k tisku.",
    "addon.design-studio.warn.outsideSafe":
      "Něco leží mimo bezpečnou zónu a může být odříznuto.",

    "addon.design-studio.insp.none":
      "Nic není vybráno. Klepněte na něco na ploše, nebo z nástrojů přidejte text, obrázek či tvar.",
    "addon.design-studio.insp.posSize": "Poloha a velikost",
    "addon.design-studio.insp.mm": "mm",
    "addon.design-studio.insp.delete": "Smazat",
    "addon.design-studio.insp.text": "Text",
    "addon.design-studio.insp.font": "Písmo",
    "addon.design-studio.insp.size": "Velikost",
    "addon.design-studio.insp.weight": "Řez",
    "addon.design-studio.insp.alignment": "Zarovnání",
    "addon.design-studio.align.start": "Zarovnat na začátek",
    "addon.design-studio.align.center": "Na střed",
    "addon.design-studio.align.end": "Zarovnat na konec",
    "addon.design-studio.insp.colour": "Barva",
    "addon.design-studio.insp.fill": "Výplň",
    "addon.design-studio.insp.stroke": "Obrys",
    "addon.design-studio.insp.noStroke": "Bez obrysu",
    "addon.design-studio.insp.lineWidth": "linka",
    "addon.design-studio.insp.radius": "rádius",
    "addon.design-studio.insp.alignPage": "Zarovnat ke stránce",
    "addon.design-studio.align.pageLeft": "K počáteční hraně",
    "addon.design-studio.align.pageCentre": "Na střed vodorovně",
    "addon.design-studio.align.pageRight": "Ke koncové hraně",
    "addon.design-studio.align.pageTop": "Nahoru",
    "addon.design-studio.align.pageMiddle": "Na střed svisle",
    "addon.design-studio.align.pageBottom": "Dolů",
    "addon.design-studio.insp.spreadX": "Rozprostřít vodorovně",
    "addon.design-studio.insp.spreadY": "Rozprostřít svisle",
    "addon.design-studio.insp.spreadNeedsThree":
      "K rozprostření jsou potřeba tři věci na ploše.",
    "addon.design-studio.insp.order": "Pořadí",
    "addon.design-studio.order.front": "Úplně dopředu",
    "addon.design-studio.order.forward": "O krok dopředu",
    "addon.design-studio.order.backward": "O krok dozadu",
    "addon.design-studio.order.back": "Úplně dozadu",

    "addon.design-studio.layers": "Vrstvy",
    "addon.design-studio.layers.empty": "Na této straně zatím nic není.",
    "addon.design-studio.layers.toggle": "Zobrazit nebo skrýt",
    "addon.design-studio.layers.up": "Posunout nahoru",
    "addon.design-studio.layers.down": "Posunout dolů",

    "addon.design-studio.properties": "Vlastnosti",
    "addon.design-studio.close": "Zavřít",

    "addon.design-studio.layer.text": "Text",
    "addon.design-studio.layer.image": "Obrázek",
    "addon.design-studio.layer.rect": "Obdélník",
    "addon.design-studio.layer.ellipse": "Elipsa",
    "addon.design-studio.layer.line": "Linka",
    "addon.design-studio.seed.headline": "Vaše jméno sem",
    "addon.design-studio.seed.detail": "co děláte · 07700 900 000 · vy@example.com",
    "addon.design-studio.seed.back": "Děkujeme",
    "addon.design-studio.seed.textDefault": "Vaše slova sem",
    "addon.design-studio.seed.imageLabel": "sem přijde fotka",

    "addon.design-studio.picker.title": "Co vyrábíte?",
    "addon.design-studio.picker.body":
      "Plocha se otevře v čisté velikosti a spadávka je už na ní.",
    "addon.design-studio.picker.blank": "Začít s prázdnou stranou",
    "addon.design-studio.picker.oneSide": "jedna strana",
    "addon.design-studio.picker.twoSides": "přední i zadní strana",
    "addon.design-studio.layout.business-card": "Vizitka",
    "addon.design-studio.layout.folded-card": "Skládaná karta",
    "addon.design-studio.layout.flyer": "Leták",
    "addon.design-studio.layout.envelope": "Obálka",
    "addon.design-studio.layout.sticker": "Samolepka",
    "addon.design-studio.layout.roll-up": "Roll-up banner",

    "addon.design-studio.swatch.ink": "Inkoust",
    "addon.design-studio.swatch.slate": "Břidlice",
    "addon.design-studio.swatch.mist": "Mlha",
    "addon.design-studio.swatch.paper": "Papír",
    "addon.design-studio.swatch.magenta": "Purpurová",
    "addon.design-studio.swatch.wine": "Vínová",
    "addon.design-studio.swatch.indigo": "Indigová",
    "addon.design-studio.swatch.teal": "Modrozelená",
    "addon.design-studio.swatch.green": "Zelená",
    "addon.design-studio.swatch.amber": "Jantarová",
    "addon.design-studio.swatch.red": "Červená",
    "addon.design-studio.swatch.blue": "Modrá",
  },

  "da-DK": {
    // ── Host chrome this add-on owns: the connect sentence, its own settings
    //    panel copy, what a disconnect takes and keeps, and its activity lines.
    "addon.design-studio.what": "Det lægger en lille editor på jeres side. Kunden laver et enkelt design i færdigt format, og det ankommer med korrekt beskæring.",
    "addon.design-studio.set.layoutsNone": "Slå mindst én til, ellers har editoren ikke noget at åbne.",
    "addon.design-studio.set.proofOn": "Værkstedet tjekker det som enhver anden opgave, før det går i maskinen.",
    "addon.design-studio.set.proofOff": "Design lavet her går direkte til prepress. Værkstedet kan stadig bede om en prøve.",
    "addon.design-studio.disconnect.goes": "Kunderne ser ikke længere “Design det her” på materialesiden.",
    "addon.design-studio.disconnect.stays": "Design, der allerede er sendt med ordrer, bliver, og det gør indstillingerne ovenfor også, hvis I tilslutter igen.",
    "addon.design-studio.act.1": "{when} · design brugt på en ordre · {ref}",
    "addon.design-studio.act.2": "{when} · design gemt til senere",
    "addon.design-studio.act.3": "{when} · editor åbnet · {ref}",

    "addon.design-studio.line": "En lille grafikeditor inde på jeres eget site.",
    "addon.design-studio.desc":
      "Kunden vælger en startskabelon og retter den på en flade tegnet i færdig størrelse, med beskæring og sikkerhedsmargen på. Det, der kommer ud, har den rigtige størrelse i kraft af sin opbygning.",
    "addon.design-studio.disconnect":
      "Kunderne ser ikke længere “Lav den her”. Design, der allerede er sendt med ordrer, bliver gemt.",
    "addon.design-studio.noCompany": "Design Studio forbinder sig ikke til et firma udefra.",
    "addon.design-studio.noAccount": "Der skal slet ikke bruges en konto et andet sted.",

    "addon.design-studio.perm.readJob": "Læse den opgave, designet laves til",
    "addon.design-studio.perm.saveDesigns": "Gemme design på jeres ordrer",
    "addon.design-studio.perm.noAccount": "Intet andet, og ingen konto et andet sted",

    "addon.design-studio.set.layouts": "Startskabeloner kunderne må bruge",
    "addon.design-studio.set.layoutsHint": "Slå det fra, som værkstedet ikke laver.",
    "addon.design-studio.set.proof": "Et design skal stadig godkendes på prøvetryk",
    "addon.design-studio.set.proofHint":
      "Slået til som udgangspunkt. Værkstedet tjekker hver opgave, og sitet siger det allerede.",

    "addon.design-studio.reason.tooBig":
      "Den her er større, end editoren tegner. Send i stedet en trykklar PDF.",
    "addon.design-studio.reason.noLayouts": "Værkstedet har ikke gjort nogen startskabelon klar.",

    "addon.design-studio.tile.title": "Lav den her",
    "addon.design-studio.tile.body":
      "Vælg en startskabelon og ret den i færdig størrelse. Beskæringen er der allerede.",

    "addon.design-studio.result.title": "Designet er klar",
    "addon.design-studio.result.why":
      "Det er lavet her i færdig størrelse, så beskæringen passer i kraft af opbygningen — du skal ikke rette noget.",
    "addon.design-studio.result.saved": "Gemt. Du kan vende tilbage til det fra din ordre.",
    "addon.design-studio.result.reopen": "Åbn den igen",

    "addon.design-studio.editor.front": "Forside",
    "addon.design-studio.editor.back": "Bagside",
    "addon.design-studio.editor.undo": "Fortryd",
    "addon.design-studio.editor.redo": "Gentag",
    "addon.design-studio.editor.zoomIn": "Zoom ind",
    "addon.design-studio.editor.zoomOut": "Zoom ud",
    "addon.design-studio.editor.use": "Brug dette design",
    "addon.design-studio.editor.save": "Gem og kom tilbage",
    "addon.design-studio.editor.withBleed": "med beskæring",

    "addon.design-studio.tool.select": "Vælg",
    "addon.design-studio.tool.text": "Tekst",
    "addon.design-studio.tool.image": "Billede",
    "addon.design-studio.tool.rect": "Rektangel",
    "addon.design-studio.tool.ellipse": "Ellipse",
    "addon.design-studio.tool.line": "Streg",
    "addon.design-studio.tool.guides": "Hjælpelinjer",

    "addon.design-studio.legend.trim": "Snit — her bliver der skåret",
    "addon.design-studio.legend.bleed": "Beskæring",
    "addon.design-studio.legend.bleedValue": "{v} udenfor",
    "addon.design-studio.legend.safe": "Sikkerhedsmargen",
    "addon.design-studio.legend.safeValue": "{v} indenfor",
    "addon.design-studio.safeNote":
      "Alt uden for sikkerhedsmargenen kan blive skåret væk.",
    "addon.design-studio.honest":
      "Det her er en enkel editor til ligetil opgaver — til kompliceret grafik sender du en trykklar PDF.",
    "addon.design-studio.warn.outsideSafe":
      "Noget ligger uden for sikkerhedsmargenen og kan blive skåret væk.",

    "addon.design-studio.insp.none":
      "Der er ikke valgt noget. Klik på noget på fladen, eller tilføj tekst, et billede eller en form fra værktøjerne.",
    "addon.design-studio.insp.posSize": "Placering og størrelse",
    "addon.design-studio.insp.mm": "mm",
    "addon.design-studio.insp.delete": "Slet",
    "addon.design-studio.insp.text": "Tekst",
    "addon.design-studio.insp.font": "Skrift",
    "addon.design-studio.insp.size": "Størrelse",
    "addon.design-studio.insp.weight": "Vægt",
    "addon.design-studio.insp.alignment": "Justering",
    "addon.design-studio.align.start": "Justér mod begyndelsen",
    "addon.design-studio.align.center": "Midtstil",
    "addon.design-studio.align.end": "Justér mod slutningen",
    "addon.design-studio.insp.colour": "Farve",
    "addon.design-studio.insp.fill": "Fyld",
    "addon.design-studio.insp.stroke": "Streg",
    "addon.design-studio.insp.noStroke": "Ingen streg",
    "addon.design-studio.insp.lineWidth": "streg",
    "addon.design-studio.insp.radius": "radius",
    "addon.design-studio.insp.alignPage": "Justér efter siden",
    "addon.design-studio.align.pageLeft": "Til begyndelseskanten",
    "addon.design-studio.align.pageCentre": "Midt på tværs",
    "addon.design-studio.align.pageRight": "Til slutkanten",
    "addon.design-studio.align.pageTop": "Til toppen",
    "addon.design-studio.align.pageMiddle": "Midt ned",
    "addon.design-studio.align.pageBottom": "Til bunden",
    "addon.design-studio.insp.spreadX": "Fordel på tværs",
    "addon.design-studio.insp.spreadY": "Fordel nedad",
    "addon.design-studio.insp.spreadNeedsThree": "Fordeling kræver tre ting på fladen.",
    "addon.design-studio.insp.order": "Rækkefølge",
    "addon.design-studio.order.front": "Helt frem",
    "addon.design-studio.order.forward": "Et trin frem",
    "addon.design-studio.order.backward": "Et trin tilbage",
    "addon.design-studio.order.back": "Helt tilbage",

    "addon.design-studio.layers": "Lag",
    "addon.design-studio.layers.empty": "Der er ikke noget på denne side endnu.",
    "addon.design-studio.layers.toggle": "Vis eller skjul",
    "addon.design-studio.layers.up": "Flyt op",
    "addon.design-studio.layers.down": "Flyt ned",

    "addon.design-studio.properties": "Egenskaber",
    "addon.design-studio.close": "Luk",

    "addon.design-studio.layer.text": "Tekst",
    "addon.design-studio.layer.image": "Billede",
    "addon.design-studio.layer.rect": "Rektangel",
    "addon.design-studio.layer.ellipse": "Ellipse",
    "addon.design-studio.layer.line": "Streg",
    "addon.design-studio.seed.headline": "Dit navn her",
    "addon.design-studio.seed.detail": "hvad du laver · 07700 900 000 · dig@example.com",
    "addon.design-studio.seed.back": "Tak",
    "addon.design-studio.seed.textDefault": "Dine ord her",
    "addon.design-studio.seed.imageLabel": "her kommer et billede",

    "addon.design-studio.picker.title": "Hvad laver du?",
    "addon.design-studio.picker.body":
      "Fladen åbner i færdig størrelse med beskæringen allerede på.",
    "addon.design-studio.picker.blank": "Start med en blank side",
    "addon.design-studio.picker.oneSide": "én side",
    "addon.design-studio.picker.twoSides": "for- og bagside",
    "addon.design-studio.layout.business-card": "Visitkort",
    "addon.design-studio.layout.folded-card": "Foldet kort",
    "addon.design-studio.layout.flyer": "Løbeseddel",
    "addon.design-studio.layout.envelope": "Kuvert",
    "addon.design-studio.layout.sticker": "Klistermærke",
    "addon.design-studio.layout.roll-up": "Roll-up-banner",

    "addon.design-studio.swatch.ink": "Blæk",
    "addon.design-studio.swatch.slate": "Skifer",
    "addon.design-studio.swatch.mist": "Dis",
    "addon.design-studio.swatch.paper": "Papir",
    "addon.design-studio.swatch.magenta": "Magenta",
    "addon.design-studio.swatch.wine": "Vinrød",
    "addon.design-studio.swatch.indigo": "Indigo",
    "addon.design-studio.swatch.teal": "Petrol",
    "addon.design-studio.swatch.green": "Grøn",
    "addon.design-studio.swatch.amber": "Rav",
    "addon.design-studio.swatch.red": "Rød",
    "addon.design-studio.swatch.blue": "Blå",
  },

  "zh-CN": {
    // ── Host chrome this add-on owns: the connect sentence, its own settings
    //    panel copy, what a disconnect takes and keeps, and its activity lines.
    "addon.design-studio.what": "这会在您的网站上加一个小编辑器。客户按成品尺寸做出朴素的稿件，交过来时出血已经正确。",
    "addon.design-studio.set.layoutsNone": "至少打开一个，否则编辑器没有可打开的东西。",
    "addon.design-studio.set.proofOn": "上机之前，工坊会像检查其他活儿一样检查它。",
    "addon.design-studio.set.proofOff": "在这里做的稿件直接进印前。工坊仍可要求过样。",
    "addon.design-studio.disconnect.goes": "客户在稿件页面上不会再看到“在这里设计”。",
    "addon.design-studio.disconnect.stays": "已随订单交来的稿件都留着；若再次连接，上面的设置也还在。",
    "addon.design-studio.act.1": "{when} · 稿件用于订单 · {ref}",
    "addon.design-studio.act.2": "{when} · 稿件已存待用",
    "addon.design-studio.act.3": "{when} · 打开编辑器 · {ref}",

    "addon.design-studio.line": "站内的小型印刷稿编辑器。",
    "addon.design-studio.desc":
      "顾客选一个起始版式，在按成品尺寸绘制的画布上编辑，出血和安全区已经画好。做出来的稿件，尺寸天生就是对的。",
    "addon.design-studio.disconnect":
      "顾客将不再看到“在这里做设计”。已随订单发出的设计会保留。",
    "addon.design-studio.noCompany": "Design Studio 不连接任何外部公司。",
    "addon.design-studio.noAccount": "完全不需要外部账户。",

    "addon.design-studio.perm.readJob": "读取正在做稿的那份工单",
    "addon.design-studio.perm.saveDesigns": "把设计保存到你们的订单上",
    "addon.design-studio.perm.noAccount": "此外别无其他，也不需要外部账户",

    "addon.design-studio.set.layouts": "顾客可用的起始版式",
    "addon.design-studio.set.layoutsHint": "工坊不做的，就关掉。",
    "addon.design-studio.set.proof": "设计仍需打样确认",
    "addon.design-studio.set.proofHint": "默认开启。工坊会检查每一单，站点上也已经写明。",

    "addon.design-studio.reason.tooBig": "这个尺寸超出编辑器能画的范围，请改送可直接付印的 PDF。",
    "addon.design-studio.reason.noLayouts": "工坊尚未开放任何起始版式。",

    "addon.design-studio.tile.title": "在这里做设计",
    "addon.design-studio.tile.body": "选一个起始版式，按成品尺寸编辑。出血已经在上面了。",

    "addon.design-studio.result.title": "设计已就绪",
    "addon.design-studio.result.why":
      "它是在这里按成品尺寸做的，出血天生就是对的——你不需要再改什么。",
    "addon.design-studio.result.saved": "已保存。你可以从订单里再回到它。",
    "addon.design-studio.result.reopen": "重新打开",

    "addon.design-studio.editor.front": "正面",
    "addon.design-studio.editor.back": "反面",
    "addon.design-studio.editor.undo": "撤销",
    "addon.design-studio.editor.redo": "重做",
    "addon.design-studio.editor.zoomIn": "放大",
    "addon.design-studio.editor.zoomOut": "缩小",
    "addon.design-studio.editor.use": "就用这个设计",
    "addon.design-studio.editor.save": "保存，稍后再来",
    "addon.design-studio.editor.withBleed": "含出血",

    "addon.design-studio.tool.select": "选择",
    "addon.design-studio.tool.text": "文字",
    "addon.design-studio.tool.image": "图片",
    "addon.design-studio.tool.rect": "矩形",
    "addon.design-studio.tool.ellipse": "椭圆",
    "addon.design-studio.tool.line": "线条",
    "addon.design-studio.tool.guides": "参考线",

    "addon.design-studio.legend.trim": "裁切线 —— 从这里裁开",
    "addon.design-studio.legend.bleed": "出血",
    "addon.design-studio.legend.bleedValue": "向外 {v}",
    "addon.design-studio.legend.safe": "安全区",
    "addon.design-studio.legend.safeValue": "向内 {v}",
    "addon.design-studio.safeNote": "安全区以外的东西，可能会被裁掉。",
    "addon.design-studio.honest":
      "这是给简单活儿用的简单编辑器 —— 复杂稿件请送可直接付印的 PDF。",
    "addon.design-studio.warn.outsideSafe": "有东西落在安全区之外，可能会被裁掉。",

    "addon.design-studio.insp.none":
      "没有选中任何东西。点一下画布上的元素，或者从工具里加文字、图片或形状。",
    "addon.design-studio.insp.posSize": "位置与尺寸",
    "addon.design-studio.insp.mm": "毫米",
    "addon.design-studio.insp.delete": "删除",
    "addon.design-studio.insp.text": "文字",
    "addon.design-studio.insp.font": "字体",
    "addon.design-studio.insp.size": "字号",
    "addon.design-studio.insp.weight": "字重",
    "addon.design-studio.insp.alignment": "对齐",
    "addon.design-studio.align.start": "向起始端对齐",
    "addon.design-studio.align.center": "居中",
    "addon.design-studio.align.end": "向末端对齐",
    "addon.design-studio.insp.colour": "颜色",
    "addon.design-studio.insp.fill": "填充",
    "addon.design-studio.insp.stroke": "描边",
    "addon.design-studio.insp.noStroke": "无描边",
    "addon.design-studio.insp.lineWidth": "线宽",
    "addon.design-studio.insp.radius": "圆角",
    "addon.design-studio.insp.alignPage": "对齐到页面",
    "addon.design-studio.align.pageLeft": "贴起始边",
    "addon.design-studio.align.pageCentre": "水平居中",
    "addon.design-studio.align.pageRight": "贴末端边",
    "addon.design-studio.align.pageTop": "贴顶边",
    "addon.design-studio.align.pageMiddle": "垂直居中",
    "addon.design-studio.align.pageBottom": "贴底边",
    "addon.design-studio.insp.spreadX": "横向均分",
    "addon.design-studio.insp.spreadY": "纵向均分",
    "addon.design-studio.insp.spreadNeedsThree": "均分需要画布上有三样东西。",
    "addon.design-studio.insp.order": "叠放次序",
    "addon.design-studio.order.front": "移到最前",
    "addon.design-studio.order.forward": "前移一层",
    "addon.design-studio.order.backward": "后移一层",
    "addon.design-studio.order.back": "移到最后",

    "addon.design-studio.layers": "图层",
    "addon.design-studio.layers.empty": "这一面还什么都没有。",
    "addon.design-studio.layers.toggle": "显示或隐藏",
    "addon.design-studio.layers.up": "上移",
    "addon.design-studio.layers.down": "下移",

    "addon.design-studio.properties": "属性",
    "addon.design-studio.close": "关闭",

    "addon.design-studio.layer.text": "文字",
    "addon.design-studio.layer.image": "图片",
    "addon.design-studio.layer.rect": "矩形",
    "addon.design-studio.layer.ellipse": "椭圆",
    "addon.design-studio.layer.line": "线条",
    "addon.design-studio.seed.headline": "这里写你的名字",
    "addon.design-studio.seed.detail": "你做什么 · 07700 900 000 · you@example.com",
    "addon.design-studio.seed.back": "谢谢惠顾",
    "addon.design-studio.seed.textDefault": "这里写你的话",
    "addon.design-studio.seed.imageLabel": "这里放照片",

    "addon.design-studio.picker.title": "你要做什么？",
    "addon.design-studio.picker.body": "画布按成品尺寸打开，出血已经在上面了。",
    "addon.design-studio.picker.blank": "从空白开始",
    "addon.design-studio.picker.oneSide": "单面",
    "addon.design-studio.picker.twoSides": "正反两面",
    "addon.design-studio.layout.business-card": "名片",
    "addon.design-studio.layout.folded-card": "对折卡片",
    "addon.design-studio.layout.flyer": "宣传单",
    "addon.design-studio.layout.envelope": "信封",
    "addon.design-studio.layout.sticker": "不干胶贴纸",
    "addon.design-studio.layout.roll-up": "易拉宝",

    "addon.design-studio.swatch.ink": "墨黑",
    "addon.design-studio.swatch.slate": "石板灰",
    "addon.design-studio.swatch.mist": "雾灰",
    "addon.design-studio.swatch.paper": "纸白",
    "addon.design-studio.swatch.magenta": "品红",
    "addon.design-studio.swatch.wine": "酒红",
    "addon.design-studio.swatch.indigo": "靛蓝",
    "addon.design-studio.swatch.teal": "青蓝",
    "addon.design-studio.swatch.green": "绿",
    "addon.design-studio.swatch.amber": "琥珀",
    "addon.design-studio.swatch.red": "红",
    "addon.design-studio.swatch.blue": "蓝",
  },

  "zh-TW": {
    // ── Host chrome this add-on owns: the connect sentence, its own settings
    //    panel copy, what a disconnect takes and keeps, and its activity lines.
    "addon.design-studio.what": "這會在您的網站上加一個小編輯器。客戶依成品尺寸做出樸素的稿件，交過來時出血已經正確。",
    "addon.design-studio.set.layoutsNone": "至少打開一個，否則編輯器沒有可開的東西。",
    "addon.design-studio.set.proofOn": "上機之前，工坊會像檢查其他活兒一樣檢查它。",
    "addon.design-studio.set.proofOff": "在這裡做的稿件直接進印前。工坊仍可要求過樣。",
    "addon.design-studio.disconnect.goes": "客戶在稿件頁面上不會再看到「在這裡設計」。",
    "addon.design-studio.disconnect.stays": "已隨訂單交來的稿件都留著；若再次連接，上面的設定也還在。",
    "addon.design-studio.act.1": "{when} · 稿件用於訂單 · {ref}",
    "addon.design-studio.act.2": "{when} · 稿件已存待用",
    "addon.design-studio.act.3": "{when} · 開啟編輯器 · {ref}",

    "addon.design-studio.line": "站內的小型印刷稿編輯器。",
    "addon.design-studio.desc":
      "顧客挑一個起始版型，在按成品尺寸繪製的畫布上編輯，出血與安全區已經畫好。做出來的稿件，尺寸天生就是對的。",
    "addon.design-studio.disconnect":
      "顧客將不再看到「在這裡做設計」。已隨訂單送出的設計會保留。",
    "addon.design-studio.noCompany": "Design Studio 不連接任何外部公司。",
    "addon.design-studio.noAccount": "完全不需要外部帳號。",

    "addon.design-studio.perm.readJob": "讀取正在做稿的那張工單",
    "addon.design-studio.perm.saveDesigns": "把設計存到你們的訂單上",
    "addon.design-studio.perm.noAccount": "此外別無其他，也不需要外部帳號",

    "addon.design-studio.set.layouts": "顧客可用的起始版型",
    "addon.design-studio.set.layoutsHint": "工坊不做的，就關掉。",
    "addon.design-studio.set.proof": "設計仍需打樣確認",
    "addon.design-studio.set.proofHint": "預設開啟。工坊會檢查每一單，網站上也已經寫明。",

    "addon.design-studio.reason.tooBig": "這個尺寸超出編輯器能畫的範圍，請改送可直接付印的 PDF。",
    "addon.design-studio.reason.noLayouts": "工坊尚未開放任何起始版型。",

    "addon.design-studio.tile.title": "在這裡做設計",
    "addon.design-studio.tile.body": "挑一個起始版型，按成品尺寸編輯。出血已經在上面了。",

    "addon.design-studio.result.title": "設計已就緒",
    "addon.design-studio.result.why":
      "它是在這裡按成品尺寸做的，出血天生就是對的——你不需要再改什麼。",
    "addon.design-studio.result.saved": "已儲存。你可以從訂單裡再回到它。",
    "addon.design-studio.result.reopen": "重新開啟",

    "addon.design-studio.editor.front": "正面",
    "addon.design-studio.editor.back": "背面",
    "addon.design-studio.editor.undo": "復原",
    "addon.design-studio.editor.redo": "重做",
    "addon.design-studio.editor.zoomIn": "放大",
    "addon.design-studio.editor.zoomOut": "縮小",
    "addon.design-studio.editor.use": "就用這個設計",
    "addon.design-studio.editor.save": "儲存，稍後再來",
    "addon.design-studio.editor.withBleed": "含出血",

    "addon.design-studio.tool.select": "選取",
    "addon.design-studio.tool.text": "文字",
    "addon.design-studio.tool.image": "圖片",
    "addon.design-studio.tool.rect": "矩形",
    "addon.design-studio.tool.ellipse": "橢圓",
    "addon.design-studio.tool.line": "線條",
    "addon.design-studio.tool.guides": "參考線",

    "addon.design-studio.legend.trim": "裁切線 —— 從這裡裁開",
    "addon.design-studio.legend.bleed": "出血",
    "addon.design-studio.legend.bleedValue": "向外 {v}",
    "addon.design-studio.legend.safe": "安全區",
    "addon.design-studio.legend.safeValue": "向內 {v}",
    "addon.design-studio.safeNote": "安全區以外的東西，可能會被裁掉。",
    "addon.design-studio.honest":
      "這是給簡單活兒用的簡單編輯器 —— 複雜稿件請送可直接付印的 PDF。",
    "addon.design-studio.warn.outsideSafe": "有東西落在安全區之外，可能會被裁掉。",

    "addon.design-studio.insp.none":
      "沒有選取任何東西。點一下畫布上的元素，或者從工具裡加文字、圖片或形狀。",
    "addon.design-studio.insp.posSize": "位置與尺寸",
    "addon.design-studio.insp.mm": "公釐",
    "addon.design-studio.insp.delete": "刪除",
    "addon.design-studio.insp.text": "文字",
    "addon.design-studio.insp.font": "字體",
    "addon.design-studio.insp.size": "級數",
    "addon.design-studio.insp.weight": "字重",
    "addon.design-studio.insp.alignment": "對齊",
    "addon.design-studio.align.start": "向起始端對齊",
    "addon.design-studio.align.center": "置中",
    "addon.design-studio.align.end": "向末端對齊",
    "addon.design-studio.insp.colour": "顏色",
    "addon.design-studio.insp.fill": "填色",
    "addon.design-studio.insp.stroke": "外框",
    "addon.design-studio.insp.noStroke": "無外框",
    "addon.design-studio.insp.lineWidth": "線寬",
    "addon.design-studio.insp.radius": "圓角",
    "addon.design-studio.insp.alignPage": "對齊到頁面",
    "addon.design-studio.align.pageLeft": "貼起始邊",
    "addon.design-studio.align.pageCentre": "水平置中",
    "addon.design-studio.align.pageRight": "貼末端邊",
    "addon.design-studio.align.pageTop": "貼頂邊",
    "addon.design-studio.align.pageMiddle": "垂直置中",
    "addon.design-studio.align.pageBottom": "貼底邊",
    "addon.design-studio.insp.spreadX": "橫向均分",
    "addon.design-studio.insp.spreadY": "縱向均分",
    "addon.design-studio.insp.spreadNeedsThree": "均分需要畫布上有三樣東西。",
    "addon.design-studio.insp.order": "疊放順序",
    "addon.design-studio.order.front": "移到最前",
    "addon.design-studio.order.forward": "上移一層",
    "addon.design-studio.order.backward": "下移一層",
    "addon.design-studio.order.back": "移到最後",

    "addon.design-studio.layers": "圖層",
    "addon.design-studio.layers.empty": "這一面還什麼都沒有。",
    "addon.design-studio.layers.toggle": "顯示或隱藏",
    "addon.design-studio.layers.up": "上移",
    "addon.design-studio.layers.down": "下移",

    "addon.design-studio.properties": "屬性",
    "addon.design-studio.close": "關閉",

    "addon.design-studio.layer.text": "文字",
    "addon.design-studio.layer.image": "圖片",
    "addon.design-studio.layer.rect": "矩形",
    "addon.design-studio.layer.ellipse": "橢圓",
    "addon.design-studio.layer.line": "線條",
    "addon.design-studio.seed.headline": "這裡寫你的名字",
    "addon.design-studio.seed.detail": "你做什麼 · 07700 900 000 · you@example.com",
    "addon.design-studio.seed.back": "謝謝惠顧",
    "addon.design-studio.seed.textDefault": "這裡寫你的話",
    "addon.design-studio.seed.imageLabel": "這裡放照片",

    "addon.design-studio.picker.title": "你要做什麼？",
    "addon.design-studio.picker.body": "畫布按成品尺寸打開，出血已經在上面了。",
    "addon.design-studio.picker.blank": "從空白開始",
    "addon.design-studio.picker.oneSide": "單面",
    "addon.design-studio.picker.twoSides": "正反兩面",
    "addon.design-studio.layout.business-card": "名片",
    "addon.design-studio.layout.folded-card": "對摺卡片",
    "addon.design-studio.layout.flyer": "宣傳單",
    "addon.design-studio.layout.envelope": "信封",
    "addon.design-studio.layout.sticker": "貼紙",
    "addon.design-studio.layout.roll-up": "易拉展",

    "addon.design-studio.swatch.ink": "墨黑",
    "addon.design-studio.swatch.slate": "石板灰",
    "addon.design-studio.swatch.mist": "霧灰",
    "addon.design-studio.swatch.paper": "紙白",
    "addon.design-studio.swatch.magenta": "洋紅",
    "addon.design-studio.swatch.wine": "酒紅",
    "addon.design-studio.swatch.indigo": "靛藍",
    "addon.design-studio.swatch.teal": "青藍",
    "addon.design-studio.swatch.green": "綠",
    "addon.design-studio.swatch.amber": "琥珀",
    "addon.design-studio.swatch.red": "紅",
    "addon.design-studio.swatch.blue": "藍",
  },

  "ar-EG": {
    // ── Host chrome this add-on owns: the connect sentence, its own settings
    //    panel copy, what a disconnect takes and keeps, and its activity lines.
    "addon.design-studio.what": "يضيف محرِّرًا صغيرًا إلى موقعك. يصنع العميل تصميمًا بسيطًا بالمقاس النهائي، ويصل والهدر حوله مضبوط سلفًا.",
    "addon.design-studio.set.layoutsNone": "شغّل واحدًا على الأقل، وإلا فلن يجد المحرِّر ما يفتحه.",
    "addon.design-studio.set.proofOn": "تفحصه المطبعة مثل أي شغلة أخرى قبل أن يذهب إلى الماكينة.",
    "addon.design-studio.set.proofOff": "التصاميم المصنوعة هنا تذهب مباشرة إلى ما قبل الطبع. وتستطيع المطبعة طلب بروفة رغم ذلك.",
    "addon.design-studio.disconnect.goes": "لن يرى العملاء بعد الآن «صمِّمه هنا» في شاشة ملفات الطباعة.",
    "addon.design-studio.disconnect.stays": "التصاميم التي أُرسلت مع الطلبات تبقى، وكذلك الإعدادات أعلاه إن أعدت الوصل.",
    "addon.design-studio.act.1": "{when} · استُخدم تصميم في طلب · {ref}",
    "addon.design-studio.act.2": "{when} · حُفظ تصميم لوقت لاحق",
    "addon.design-studio.act.3": "{when} · فُتح المحرِّر · {ref}",

    "addon.design-studio.line": "محرِّر تصميم صغير داخل موقعكم.",
    "addon.design-studio.desc":
      "يختار العميل تخطيطًا للبداية ويعدِّله على مساحة مرسومة بالمقاس النهائي، وعليها هامش القص والمنطقة الآمنة. ما يخرج منها مقاسه صحيح بحكم طريقة بنائه.",
    "addon.design-studio.disconnect":
      "لن يرى العملاء «صمِّمه هنا» بعد الآن. التصاميم التي أُرسلت مع طلبات تبقى محفوظة.",
    "addon.design-studio.noCompany": "لا يتصل Design Studio بأي شركة خارجية.",
    "addon.design-studio.noAccount": "لا يحتاج إلى أي حساب خارجي على الإطلاق.",

    "addon.design-studio.perm.readJob": "قراءة الطلب الذي يُصمَّم من أجله",
    "addon.design-studio.perm.saveDesigns": "حفظ التصاميم مع طلباتكم",
    "addon.design-studio.perm.noAccount": "لا شيء غير ذلك، ولا حساب خارجي",

    "addon.design-studio.set.layouts": "تخطيطات البداية المتاحة للعملاء",
    "addon.design-studio.set.layoutsHint": "أوقِف ما لا تنتجه المطبعة.",
    "addon.design-studio.set.proof": "التصميم ما زال يحتاج نموذجًا للاعتماد",
    "addon.design-studio.set.proofHint":
      "مُفعَّل افتراضيًا. المطبعة تفحص كل طلب، والموقع يقول ذلك بالفعل.",

    "addon.design-studio.reason.tooBig":
      "هذا المقاس أكبر مما يرسمه المحرِّر. أرسل بدلًا منه ملف PDF جاهزًا للطباعة.",
    "addon.design-studio.reason.noLayouts": "لم تُتِح المطبعة أي تخطيط للبداية.",

    "addon.design-studio.tile.title": "صمِّمه هنا",
    "addon.design-studio.tile.body":
      "اختر تخطيطًا للبداية وعدِّله بالمقاس النهائي. هامش القص موجود عليه بالفعل.",

    "addon.design-studio.result.title": "التصميم جاهز",
    "addon.design-studio.result.why":
      "صُنع هنا بالمقاس النهائي، فهامش القص صحيح بحكم البناء — ليس عليك إصلاح أي شيء.",
    "addon.design-studio.result.saved": "حُفِظ. يمكنك العودة إليه من طلبك.",
    "addon.design-studio.result.reopen": "افتحه مرة أخرى",

    "addon.design-studio.editor.front": "الوجه",
    "addon.design-studio.editor.back": "الظهر",
    "addon.design-studio.editor.undo": "تراجع",
    "addon.design-studio.editor.redo": "إعادة",
    "addon.design-studio.editor.zoomIn": "تكبير",
    "addon.design-studio.editor.zoomOut": "تصغير",
    "addon.design-studio.editor.use": "استخدم هذا التصميم",
    "addon.design-studio.editor.save": "احفظ وعُد لاحقًا",
    "addon.design-studio.editor.withBleed": "مع هامش القص",

    "addon.design-studio.tool.select": "تحديد",
    "addon.design-studio.tool.text": "نص",
    "addon.design-studio.tool.image": "صورة",
    "addon.design-studio.tool.rect": "مستطيل",
    "addon.design-studio.tool.ellipse": "بيضاوي",
    "addon.design-studio.tool.line": "خط",
    "addon.design-studio.tool.guides": "الأدلة",

    "addon.design-studio.legend.trim": "خط القص — حيث يُقصّ",
    "addon.design-studio.legend.bleed": "هامش القص",
    "addon.design-studio.legend.bleedValue": "{v} للخارج",
    "addon.design-studio.legend.safe": "المنطقة الآمنة",
    "addon.design-studio.legend.safeValue": "{v} للداخل",
    "addon.design-studio.safeNote": "أي شيء خارج المنطقة الآمنة قد يُقصّ.",
    "addon.design-studio.honest":
      "هذا محرِّر بسيط للأعمال المباشرة — أما التصميم المعقّد فأرسله ملف PDF جاهزًا للطباعة.",
    "addon.design-studio.warn.outsideSafe": "هناك عنصر خارج المنطقة الآمنة وقد يُقصّ.",

    "addon.design-studio.insp.none":
      "لا شيء محدَّد. انقر عنصرًا على المساحة، أو أضِف نصًا أو صورة أو شكلًا من الأدوات.",
    "addon.design-studio.insp.posSize": "الموضع والمقاس",
    "addon.design-studio.insp.mm": "مم",
    "addon.design-studio.insp.delete": "حذف",
    "addon.design-studio.insp.text": "نص",
    "addon.design-studio.insp.font": "الخط",
    "addon.design-studio.insp.size": "المقاس",
    "addon.design-studio.insp.weight": "السماكة",
    "addon.design-studio.insp.alignment": "المحاذاة",
    "addon.design-studio.align.start": "محاذاة إلى البداية",
    "addon.design-studio.align.center": "توسيط",
    "addon.design-studio.align.end": "محاذاة إلى النهاية",
    "addon.design-studio.insp.colour": "اللون",
    "addon.design-studio.insp.fill": "التعبئة",
    "addon.design-studio.insp.stroke": "الحد",
    "addon.design-studio.insp.noStroke": "بلا حد",
    "addon.design-studio.insp.lineWidth": "سمك",
    "addon.design-studio.insp.radius": "استدارة",
    "addon.design-studio.insp.alignPage": "المحاذاة إلى الصفحة",
    "addon.design-studio.align.pageLeft": "إلى حافة البداية",
    "addon.design-studio.align.pageCentre": "توسيط أفقي",
    "addon.design-studio.align.pageRight": "إلى حافة النهاية",
    "addon.design-studio.align.pageTop": "إلى الأعلى",
    "addon.design-studio.align.pageMiddle": "توسيط رأسي",
    "addon.design-studio.align.pageBottom": "إلى الأسفل",
    "addon.design-studio.insp.spreadX": "توزيع أفقي",
    "addon.design-studio.insp.spreadY": "توزيع رأسي",
    "addon.design-studio.insp.spreadNeedsThree": "التوزيع يحتاج ثلاثة عناصر على المساحة.",
    "addon.design-studio.insp.order": "الترتيب",
    "addon.design-studio.order.front": "إلى المقدمة",
    "addon.design-studio.order.forward": "خطوة للأمام",
    "addon.design-studio.order.backward": "خطوة للخلف",
    "addon.design-studio.order.back": "إلى الخلف",

    "addon.design-studio.layers": "الطبقات",
    "addon.design-studio.layers.empty": "لا شيء على هذا الوجه بعد.",
    "addon.design-studio.layers.toggle": "إظهار أو إخفاء",
    "addon.design-studio.layers.up": "تحريك لأعلى",
    "addon.design-studio.layers.down": "تحريك لأسفل",

    "addon.design-studio.properties": "الخصائص",
    "addon.design-studio.close": "إغلاق",

    "addon.design-studio.layer.text": "نص",
    "addon.design-studio.layer.image": "صورة",
    "addon.design-studio.layer.rect": "مستطيل",
    "addon.design-studio.layer.ellipse": "بيضاوي",
    "addon.design-studio.layer.line": "خط",
    "addon.design-studio.seed.headline": "اسمك هنا",
    "addon.design-studio.seed.detail": "ما تعمله · 07700 900 000 · you@example.com",
    "addon.design-studio.seed.back": "شكرًا لك",
    "addon.design-studio.seed.textDefault": "كلماتك هنا",
    "addon.design-studio.seed.imageLabel": "الصورة توضع هنا",

    "addon.design-studio.picker.title": "ما الذي تصنعه؟",
    "addon.design-studio.picker.body":
      "تفتح المساحة بالمقاس النهائي وعليها هامش القص بالفعل.",
    "addon.design-studio.picker.blank": "ابدأ من صفحة فارغة",
    "addon.design-studio.picker.oneSide": "وجه واحد",
    "addon.design-studio.picker.twoSides": "وجه وظهر",
    "addon.design-studio.layout.business-card": "بطاقة عمل",
    "addon.design-studio.layout.folded-card": "بطاقة مطوية",
    "addon.design-studio.layout.flyer": "منشور",
    "addon.design-studio.layout.envelope": "ظرف",
    "addon.design-studio.layout.sticker": "ملصق",
    "addon.design-studio.layout.roll-up": "بانر قائم",

    "addon.design-studio.swatch.ink": "حبري",
    "addon.design-studio.swatch.slate": "رمادي حجري",
    "addon.design-studio.swatch.mist": "ضبابي",
    "addon.design-studio.swatch.paper": "ورقي",
    "addon.design-studio.swatch.magenta": "أرجواني وردي",
    "addon.design-studio.swatch.wine": "نبيذي",
    "addon.design-studio.swatch.indigo": "نيلي",
    "addon.design-studio.swatch.teal": "أزرق مخضر",
    "addon.design-studio.swatch.green": "أخضر",
    "addon.design-studio.swatch.amber": "كهرماني",
    "addon.design-studio.swatch.red": "أحمر",
    "addon.design-studio.swatch.blue": "أزرق",
  },
} as const;

/** Every key this add-on defines, typed off English — the source of truth. */
export type DesignStudioKey = keyof (typeof designStudioStrings)["en-US"];

/** The eight tags, in the host's own order. */
export type LocaleTag = keyof typeof designStudioStrings;

export const LOCALE_TAGS = Object.keys(designStudioStrings) as LocaleTag[];

export const DEFAULT_LOCALE: LocaleTag = "en-US";

export function isLocaleTag(v: unknown): v is LocaleTag {
  return typeof v === "string" && v in designStudioStrings;
}

/**
 * A translate function over this bundle alone.
 *
 * The HOST's `t` is the one that renders these in the shop, and it already
 * knows the reader's locale. This exists for the two callers that sit outside
 * the host's React tree: the `ArtworkSource` implementation, whose `label()` is
 * a plain synchronous string, and the vitest suites. It handles the same
 * `{placeholder}` substitution and nothing else — no plurals, because no string
 * in this bundle counts anything.
 */
export function translator(locale: LocaleTag = "en-US") {
  const bundle = designStudioStrings[locale];
  const english = designStudioStrings["en-US"];
  return (key: DesignStudioKey, params?: Record<string, string | number>): string => {
    const raw: string = bundle[key] ?? english[key] ?? key;
    if (params === undefined) return raw;
    return raw.replace(/\{(\w+)\}/g, (m, name: string) =>
      name in params ? String(params[name]) : m,
    );
  };
}

export type T = ReturnType<typeof translator>;
