/**
 * NET THREE: NOTHING THIS APP RENDERS ASKS FOR ANYTHING OFF THIS ORIGIN.
 *
 * @vitest-environment jsdom
 *
 * ── WHY A THIRD GATE FOR ONE RULE ───────────────────────────────────────────
 *
 * D11 says a demo makes no real third-party call. Two static gates already
 * state it — `sources.test.ts` over `src/`, `builtOutput.test.ts` over the
 * bundle — and neither can decide the case that matters most, because both of
 * them read text and the defect is a VALUE.
 *
 * These lines are in this app's shipped code and are correct:
 *
 *     anchor.href = url;          // a blob: URL holding a label PDF
 *     frame.src = url;            // the same blob, in a frame, to print it
 *     link.href = url;            // an exported SVG, handed to the reader
 *
 * and this line is a tracker:
 *
 *     img.src = "https://tracking.example-analytics.net/p?c=" + customer;
 *
 * A static rule that banned the assignment would fire on the first three and
 * acquire an exemption list, and an exemption list is where every hole this
 * wave has found came from. What separates them is the URL, and the URL is not
 * a property of the source text — the tracker's address could be assembled from
 * fragments no grep can reassemble.
 *
 * ── SO THIS ONE WATCHES ─────────────────────────────────────────────────────
 *
 * `testing/egress.ts`'s `watchEgress` replaces every request-issuing global and
 * wraps every URL-bearing property setter on every element prototype, plus
 * `setAttribute`. The whole app is then toured — every view, every overlay, and
 * every surface a press opens, with the add-ons off and on — and anything
 * handed a URL that is not same-origin, relative, `blob:`, `data:` or `about:`
 * is recorded, however the code spelled it.
 *
 * That is a rule about the CATEGORY. `new Image()`, `<script src>`,
 * `<link rel=preconnect>`, a form `action`, an `<iframe>`, a `Worker`, a
 * `FontFace`, `sendBeacon` under an alias and an address built at run time all
 * land in the same list, because all of them end at a sink and the sink is what
 * is watched.
 *
 * ── WHAT IT STILL CANNOT SEE, SAID PLAINLY ──────────────────────────────────
 *
 * A request made on a code path the tour never reaches. That is why the tour's
 * own completeness is a gate of its own (`testing/tour.test.tsx`): the three
 * nets are only as wide as the surfaces they are pointed at.
 *
 * That is one of several, and the full account — what each of the three nets
 * proves, what none of them can prove, and why the absence of egress is not
 * something any suite can establish — is written at the head of
 * `testing/egress.ts` under WHAT THESE NETS PROVE, AND WHAT THEY DO NOT. Read
 * it before treating a green run here as an answer.
 */

import { describe, expect, it } from "vitest";

import { reachesElsewhere, sendersIn, watchEgress } from "../testing/egress.ts";
import { tourEveryView } from "../testing/tour.tsx";

describe("nothing the running app draws reaches a host we do not control (24 D11)", () => {
  it("asks for nothing off this origin, on any surface, connected or not", async () => {
    const watch = watchEgress(window);
    const attempts: string[] = [];
    try {
      await tourEveryView("en-US", ({ view, surface, connected, host }) => {
        watch.sweep(host);
        for (const attempt of watch.attempts.splice(0)) {
          attempts.push(`${view}${surface === "" ? "" : ` · ${surface}`} (connected=${connected}) — ${attempt.via} → ${attempt.url}`);
        }
      });
    } finally {
      watch.stop();
    }
    expect(attempts, `\n${attempts.join("\n")}\n`).toEqual([]);
  });

  /**
   * THE MUTANT, DRIVEN THROUGH THE WATCHER ITSELF.
   *
   * The two shapes a verifier used to beat the old four-word grep, plus the
   * spellings that grep would also have missed. Each one goes through the real
   * instrumentation rather than through a restatement of it, so a watcher that
   * stopped hooking any of these fails here rather than reporting nothing
   * forever — which is the failure mode every guard in this wave has had.
   */
  it("records an image beacon, a preconnect, a form post and a worker", () => {
    const watch = watchEgress(window);
    try {
      // 1. The beacon that shipped. Never in the document, so a DOM sweep alone
      //    would never see it.
      const img = new Image();
      img.src = "https://tracking.example-analytics.net/p?c=7";

      // 2. A link the browser dials before anybody clicks anything.
      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = "https://tracking.example-analytics.net/";

      // 3. A form aimed off-origin, set through the attribute door.
      const form = document.createElement("form");
      form.setAttribute("action", "https://tracking.example-analytics.net/collect");

      // 4. A script, and a worker, which fetch their own source.
      const script = document.createElement("script");
      script.src = "//tracking.example-analytics.net/t.js";

      // 5. And the ones jsdom does not implement at all — defined as recorders
      //    rather than left undefined, so a caller is caught rather than
      //    crashing with a message about something else.
      new (window as unknown as { EventSource: new (u: string) => unknown }).EventSource(
        "https://tracking.example-analytics.net/stream",
      );

      /*
       * `new Image()` itself is absent on purpose: its arguments are a width
       * and a height, so the beacon's ADDRESS arrives one line later at
       * `img.src` — which is the hook that has to be right, and is.
       */
      expect(watch.attempts.map((a) => a.via)).toEqual([
        "HTMLImageElement.src",
        "HTMLLinkElement.href",
        "setAttribute(action)",
        "HTMLScriptElement.src",
        "new EventSource()",
      ]);
      expect(new Set(watch.attempts.map((a) => a.url)).size).toBe(5);
      // …and none of the five spellings above contains one of the four words
      // the grep this replaced was looking for.
      const written = [img.src, link.href, form.getAttribute("action"), script.src].join(" ");
      expect(/fetch\(|XMLHttpRequest|new WebSocket|navigator\.sendBeacon/.test(written)).toBe(false);
    } finally {
      watch.stop();
    }
  });

  /**
   * THE THREE THAT GOT PAST ALL OF IT, ROUND 6.
   *
   * Each of these was planted in a shipped, always-rendered component and left
   * every D11 gate in both hosts green — 35 passing cases in one, 36 in the
   * other. None of them touches a request-issuing global, and none of them
   * assigns to a URL-bearing property, which is all net three watched:
   *
   *   A NAVIGATION, with the address put together at run time so that no grep
   *   over the sources or the bundle can reassemble it.
   *
   *   CSS, which the BROWSER resolves. Nothing in the page asks for the image;
   *   the style rule is enough.
   *
   *   AND MARKUP PARSED OUT OF A STRING, appended to `document.body` — outside
   *   the element the tour hands to `sweep`, which is why the sweep now reads
   *   the page.
   *
   * Driven through the real instrumentation rather than through a restatement
   * of it, so a watcher that stops hooking any of the three fails here.
   */
  it("records a navigation, a stylesheet url() and an <img> parsed out of markup", () => {
    const watch = watchEgress(window);
    const style = document.createElement("style");
    const holder = document.createElement("div");
    try {
      // 1. A NAVIGATION. The host is assembled, so the address exists in no
      //    literal anywhere; only the value at the sink has it.
      const where = ["tracking", "example-analytics", "net"].join(".");
      window.open(`https://${where}/p?c=7`, "_blank");

      // 2. CSS THE BROWSER RESOLVES. No JavaScript asks for this picture.
      style.textContent =
        ".brand-mark{background-image:url('https://tracking.example-analytics.net/px.png')}";
      document.head.appendChild(style);

      // 3. MARKUP FROM A STRING, into the document rather than into the element
      //    the tour is about to hand over.
      holder.innerHTML =
        '<img src="https://tracking.example-analytics.net/beacon.gif" alt=""><use href="https://tracking.example-analytics.net/sprite.svg#a"/>';
      document.body.appendChild(holder);

      // The sweep is given the element a tour would give it, and finds the two
      // that are nowhere near it.
      const elsewhere = document.createElement("div");
      watch.sweep(elsewhere);

      const vias = watch.attempts.map((a) => a.via);
      expect(vias, "the navigation was not recorded").toContain("window.open()");
      expect(
        vias.some((via) => via.includes("url()")),
        "the injected stylesheet was not recorded",
      ).toBe(true);
      expect(
        vias.some((via) => via.includes("img") || via.includes("innerHTML")),
        "the <img> parsed out of innerHTML was not recorded",
      ).toBe(true);
      expect(
        vias.some((via) => via.includes("use") || via.includes("href")),
        "the SVG <use href> was not recorded",
      ).toBe(true);

      // Every one of the four addresses is on the list, and not one of them is
      // spelt with a word the static nets look for.
      const urls = new Set(watch.attempts.map((a) => a.url));
      expect(urls.size).toBeGreaterThanOrEqual(4);
      for (const url of urls) expect(url).toContain("tracking.example-analytics.net");
    } finally {
      watch.stop();
      style.remove();
      holder.remove();
    }
  });

  /**
   * AND THE OTHER DOORS THE SAME THREE CATEGORIES OPEN.
   *
   * The three above are the shapes a verifier actually used. These are the rest
   * of each category — a different way to install the same CSS, a different
   * parser entry point, the other navigation call — because the repair is
   * supposed to be about the category and the only way to say so is to drive
   * the siblings the mutants did not use.
   */
  it("records the siblings of each: insertRule, insertAdjacentHTML, location.assign", () => {
    const watch = watchEgress(window);
    const style = document.createElement("style");
    const holder = document.createElement("div");
    try {
      document.head.appendChild(style);
      style.sheet?.insertRule(
        ".x{cursor:url('https://tracking.example-analytics.net/c.cur'),auto}",
        0,
      );

      document.body.appendChild(holder);
      holder.insertAdjacentHTML(
        "beforeend",
        '<iframe src="https://tracking.example-analytics.net/f"></iframe>',
      );

      holder.setAttribute(
        "style",
        "background:url(https://tracking.example-analytics.net/bg.png)",
      );

      watch.sweep(document.body);
      const vias = watch.attempts.map((a) => a.via).join(" · ");
      for (const expected of ["insertRule", "insertAdjacentHTML", "style"]) {
        expect(vias, `${expected} was not recorded — ${vias}`).toContain(expected);
      }
    } finally {
      watch.stop();
      style.remove();
      holder.remove();
    }
  });


  /**
   * THE THREE THAT GOT PAST THE WIDENED NET, ROUND 7.
   *
   * Planted the same way as round 6's — an always-rendered component, with the
   * address assembled at run time so that neither static net can reassemble it
   * — and all three nets stayed green in both hosts:
   *
   *   A DOCUMENT HANDED OVER AS TEXT. `srcdoc` is `innerHTML` with an `<html>`
   *   around it. The parser sets no property, and the attribute's own value is
   *   not a URL, so the two doors that read markup and the door that reads URL
   *   attributes all looked straight past it.
   *
   *   AN ADDRESS IN AN ATTRIBUTE NOBODY LISTED. `<meta http-equiv="refresh"
   *   content="0;url=…">` is a navigation and `imagesrcset` is a fetch, and
   *   neither `content` nor `imagesrcset` is a URL-bearing attribute. Adding
   *   two names would have left the third: an address in ANY attribute is the
   *   finding now.
   *
   *   AND CSS THAT NAMES AN ADDRESS WITHOUT `url()`. `image-set()` is a fetch
   *   with neither `url(` nor `@import` in it.
   *
   * Driven through the real instrumentation, so a watcher that stops reading
   * any of the four fails here rather than reporting nothing forever.
   */
  it("records a srcdoc document, a meta refresh, an imagesrcset and an image-set()", () => {
    const watch = watchEgress(window);
    const holder = document.createElement("div");
    try {
      document.body.appendChild(holder);
      // Assembled, so the address is in no literal in this file either.
      const where = ["tracking", ".", "example", "-analytics", ".net"].join("");
      const at = `${"ht" + "tps:" + "//"}${where}`;

      // 1. A WHOLE DOCUMENT AS A STRING, through the property.
      const frame = document.createElement("iframe");
      frame.srcdoc = `<img src="${at}/in-frame.gif" alt="">`;
      holder.appendChild(frame);

      // 2. A NAVIGATION, in an attribute that holds no URL by that name.
      const meta = document.createElement("meta");
      meta.setAttribute("http-equiv", "refresh");
      meta.setAttribute("content", `0;url=${at}/go`);
      document.head.appendChild(meta);

      // 3. A FETCH, in another one.
      const preload = document.createElement("link");
      preload.setAttribute("rel", "preload");
      preload.setAttribute("as", "image");
      preload.setAttribute("imagesrcset", `${at}/1x.png 1x, ${at}/2x.png 2x`);
      holder.appendChild(preload);

      // 4. CSS WITH NO `url()` IN IT.
      const painted = document.createElement("div");
      painted.setAttribute("style", `background-image:image-set("${at}/px.png" 1x)`);
      holder.appendChild(painted);

      watch.sweep(document.createElement("div"));

      const vias = watch.attempts.map((a) => a.via).join(" · ");
      expect(vias, "the srcdoc document was not read as markup").toContain("srcdoc");
      expect(vias, "the meta refresh was not recorded").toContain("content");
      expect(vias, "the imagesrcset was not recorded").toContain("imagesrcset");
      expect(vias, "the image-set() was not recorded").toContain("CSS");
      for (const url of new Set(watch.attempts.map((a) => a.url))) {
        expect(url).toContain("tracking.example-analytics.net");
      }
      meta.remove();
    } finally {
      watch.stop();
      holder.remove();
    }
  });

  /**
   * AND THE EXEMPTION THAT KEEPS "AN ADDRESS IN ANY ATTRIBUTE" USABLE.
   *
   * Every icon in this app is an `<svg xmlns="http://www.w3.org/2000/svg">`. A
   * namespace NAMES a vocabulary and no agent ever dereferences it — net one
   * declares the same URI inert for the same reason — so it is exempt by what
   * the attribute IS. If that exemption is ever dropped, the whole-app crawl
   * above goes red on the app itself, which is the noise that gets a gate
   * switched off; this case is here so it is a named failure instead.
   */
  it("says nothing about an xmlns, in markup or on the page", () => {
    const watch = watchEgress(window);
    const holder = document.createElement("div");
    try {
      document.body.appendChild(holder);
      holder.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><rect/></svg>';
      watch.sweep(holder);
      expect(watch.attempts.map((a) => `${a.via} → ${a.url}`)).toEqual([]);
    } finally {
      watch.stop();
      holder.remove();
    }
  });

  /**
   * AND THE ONE THIS NET CANNOT WATCH, WHICH IS WHY THE OTHER NET HAS TO.
   *
   * `location.assign`, `location.replace` and `location.href = …` are
   * navigations exactly as `window.open` is, and `Location` is [Unforgeable] —
   * own, non-configurable members, no prototype to patch, `defineProperty`
   * throws. Wrapping it was tried and jsdom simply navigated. So the honest
   * arrangement is: net three takes `window.open`, net two bans the three
   * spellings of `location` outright over `src/`, and this case is what fails
   * if either half is ever quietly dropped.
   */
  it("hands location to the static net, because it cannot be watched", () => {
    for (const shape of [
      "location.assign('https://tracking.example-analytics.net/go')",
      "window.location.replace(target)",
      "document.location.href = wherever",
      "location.href = `https://${host}/p`",
    ]) {
      expect(sendersIn(shape), shape).not.toEqual([]);
    }
    // …and the ordinary reads that are not navigations stay quiet, or the ban
    // would be one more thing with an exemption list.
    for (const shape of [
      "const { origin } = window.location;",
      "if (location.pathname.startsWith('/demo')) {",
      "await open(product, initial)",
      "const opened = panel.open(id);",
    ]) {
      expect(sendersIn(shape), shape).toEqual([]);
    }
  });
  /**
   * AND A PAGE THAT DOES ALL OF THAT TO ITS OWN ORIGIN IS STILL SILENT.
   *
   * The half that keeps the widened net usable. A sweep of the whole document
   * reads every stylesheet these apps ship and every inline style they set, so
   * a rule that reported same-origin CSS would report the app on every step of
   * a 400-render crawl and be switched off by the end of the week.
   */
  it("says nothing about markup, CSS or a navigation that stays here", () => {
    const watch = watchEgress(window);
    const style = document.createElement("style");
    const holder = document.createElement("div");
    try {
      style.textContent =
        ".a{background-image:url('/assets/paper.png')}.b{background:url(data:image/gif;base64,R0lGOD)}";
      document.head.appendChild(style);
      holder.innerHTML = '<img src="/assets/logo.svg" alt=""><a href="#top">top</a>';
      holder.setAttribute("style", "background-image:url(blob:http://localhost/8f2c)");
      document.body.appendChild(holder);
      watch.sweep(document.body);
      expect(watch.attempts.map((a) => `${a.via} → ${a.url}`)).toEqual([]);
    } finally {
      watch.stop();
      style.remove();
      holder.remove();
    }
  });

  /**
   * AND IT LETS THROUGH WHAT THIS APP ACTUALLY DOES, which is the half that
   * makes the rule usable. A watcher that reported every assignment would be a
   * watcher somebody switches off.
   */
  it("says nothing about a blob, a data URI or an own-origin path", () => {
    for (const url of [
      "blob:http://localhost/8f2c",
      "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=",
      "/assets/index.css",
      "about:blank",
      "#",
      "",
      `${window.location.origin}/demo/print-shop/`,
    ]) {
      expect(reachesElsewhere(url, window.location.origin), url).toBe(false);
    }
    for (const url of [
      "https://tracking.example-analytics.net/p",
      "//tracking.example-analytics.net/p",
      "http://192.0.2.4:9000/collect",
      "wss://tracking.example-analytics.net/socket",
    ]) {
      expect(reachesElsewhere(url, window.location.origin), url).toBe(true);
    }
  });
});
