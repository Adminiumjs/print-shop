/**
 * DID THE FILL ACTUALLY DRAW ANYTHING? — the question `:empty` only half asks.
 *
 * ── THE DEFECT, AT ITS THIRD DEPTH ──────────────────────────────────────────
 *
 * [Added 2026-08-11, wave 4b round 6. Mirrored byte for byte into both hosts as
 * `src/add-ons/slotContent.ts`.]
 *
 * A host surface renders every fill, then renders its OWN content after them,
 * and one sibling rule decides which the reader sees:
 *
 *     .slot-spare { display: contents }
 *     .slot-fill:not(:empty) ~ .slot-spare { display: none }
 *
 * Round 2 wrote that to close a real defect: an add-on may register a fill and
 * correctly draw nothing for a particular record, and the version that hid the
 * host's fallback whenever a fill EXISTED meant connecting an add-on took a
 * picture away. Round 5 ported it to the second host. Round 6 is the same
 * defect one level deeper:
 *
 *   `:empty` IS NOT "DREW NOTHING". It is "has no child nodes". A fill that
 *   returns `null` is empty and the rule works. A fill that returns a bare
 *   `<div/>`, or a wrapper whose only child is `display: none`, is NOT empty —
 *   so the host's fallback is suppressed by a fill that painted nothing, and
 *   the reader gets a blank box exactly where the picture used to be.
 *
 * The old comment in `AddOnSlot` said "no JavaScript can ask this question and
 * CSS can". Half of that was right: JavaScript cannot ask it AT RENDER TIME,
 * before the fill has run. It can ask it afterwards, of the DOM, which is what
 * this file does — and CSS cannot ask it at all, because `:empty` is a question
 * about child nodes and this is a question about paint.
 *
 * ── THE RULE, IN ONE SENTENCE ───────────────────────────────────────────────
 *
 * An element DREW when it holds non-whitespace text, or is an element that
 * paints on its own (an image, a canvas, a control), or the browser gives it a
 * box of its own — a background, a border, a shadow, generated content — or any
 * descendant does; and NOTHING that is `hidden`, `display: none` or
 * `visibility: hidden` counts, however much is inside it.
 *
 * ── WHAT IT CANNOT SEE, STATED RATHER THAN DISCOVERED ───────────────────────
 *
 * It reads `getComputedStyle`, so in a browser it sees what a class did; under
 * jsdom with no stylesheet loaded it sees only inline styles — and that is the
 * SAME answer, not a weaker one, because a class with no stylesheet behind it
 * paints nothing there either.
 *
 * What it genuinely cannot see:
 *
 *   PAINT THAT BELONGS TO AN ANCESTOR. A fill drawing into a parent's
 *   background, or positioned outside its own subtree, reads as nothing.
 *   Nothing in these apps does that.
 *
 *   A ZERO-SIZED BOX WITH A BACKGROUND. `background` is taken as evidence of
 *   drawing without measuring whether the box has any area, deliberately: the
 *   alternative is a layout read, and a layout read returns zero for everything
 *   under jsdom, which would make the tested behaviour and the shipped
 *   behaviour two different behaviours.
 *
 * WHEN IN DOUBT IT SAYS "DREW", which is exactly what the app did before this
 * file existed. Every case it is unsure about therefore behaves as it always
 * has, and the only behaviour that changes is the one that was wrong.
 */

/**
 * Elements that put something on the screen with no content of their own.
 *
 * Not a taste list: each of these either paints pixels the moment it exists (a
 * replaced element) or is a control a reader can see and press. `<button>` and
 * `<input>` are here because a fill whose whole output is an empty-labelled
 * icon button HAS drawn something a reader can act on.
 */
const PAINTS_ON_ITS_OWN: readonly string[] = [
  'img',
  'picture',
  'svg',
  'canvas',
  'video',
  'iframe',
  'object',
  'embed',
  'input',
  'select',
  'textarea',
  'button',
  'progress',
  'meter',
  'hr',
  'math',
];

/** `rgba(0, 0, 0, 0)` in every spacing a browser might hand back. */
const FULLY_TRANSPARENT = /^rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)$/i;

const isNothing = (value: string | null | undefined): boolean =>
  value === null || value === undefined || value === '' || value === 'none';

/**
 * The four edges, in both spellings.
 *
 * Reading a COMPUTED value is not a violation of the logical-properties rule —
 * that rule is about the CSS this project AUTHORS, and a browser has already
 * resolved every logical property into a physical one by the time it answers.
 * The logical names are asked for as well because nothing guarantees a given
 * engine exposes both, and this file must not depend on which.
 */
const EDGES: readonly string[] = [
  // Physical, which is what a browser resolves everything INTO.
  'top',
  'right',
  'bottom',
  'left',
  // Logical, which is what this project authors. A browser exposes both; asking
  // for both costs one string comparison and means the rule does not depend on
  // which spelling a stylesheet happened to use.
  'block-start',
  'block-end',
  'inline-start',
  'inline-end',
];

function paintsABoxOfItsOwn(style: CSSStyleDeclaration): boolean {
  if (!isNothing(style.backgroundImage)) return true;
  const background = style.backgroundColor;
  if (!isNothing(background) && background !== 'transparent' && !FULLY_TRANSPARENT.test(background)) {
    return true;
  }
  if (!isNothing(style.boxShadow)) return true;
  for (const edge of EDGES) {
    const width = style.getPropertyValue(`border-${edge}-width`);
    const kind = style.getPropertyValue(`border-${edge}-style`);
    if (!isNothing(kind) && kind !== 'hidden' && width !== '' && parseFloat(width) > 0) return true;
  }
  const outlineWidth = style.outlineWidth;
  if (!isNothing(style.outlineStyle) && outlineWidth !== '' && parseFloat(outlineWidth) > 0) return true;
  return false;
}

/**
 * The same question asked of the `style=` ATTRIBUTE, verbatim.
 *
 * Needed because a computed style is only as good as the engine computing it,
 * and the two engines these apps run in do not agree: a browser resolves
 * `border-block-start: 1px solid #ddd` into `border-top-*` and jsdom leaves the
 * shorthand unexpanded, reporting `none`/`medium` for every longhand there is.
 * This project authors logical properties everywhere, so under a test run the
 * rule would have been blind to a hairline a fill drew — and a rule that answers
 * differently in the test than in the app is two rules.
 *
 * It reads a DECLARATION the author wrote, not a guess about a class: `style="…
 * background: …"` on an element with nothing inside it is somebody drawing a
 * box. A value of `none`, `0` or `transparent` is not, and is not counted.
 */
const INLINE_PAINT =
  /(?:^|;)\s*(background(?:-color|-image)?|box-shadow|outline|border(?:-(?:block|inline)-(?:start|end)|-top|-right|-bottom|-left)?)\s*:\s*([^;]+)/gi;

function declaresPaintInline(el: Element): boolean {
  const inline = el.getAttribute('style');
  if (inline === null || inline === '') return false;
  INLINE_PAINT.lastIndex = 0;
  for (let hit = INLINE_PAINT.exec(inline); hit !== null; hit = INLINE_PAINT.exec(inline)) {
    const value = (hit[2] ?? '').trim().toLowerCase();
    if (value === '' || value === 'none' || value === '0' || value === 'transparent') continue;
    // `border: 0` and `border: none` in any spelling, including `0 solid red`.
    if (/^0(?:[a-z%]*)?(?:\s|$)/.test(value) && hit[1]?.startsWith('border') === true) continue;
    return true;
  }
  return false;
}

/**
 * `::before { content: "\u2605" }` — a childless element that draws a character.
 *
 * ASKED ONCE PER PROCESS BEFORE IT IS TRUSTED. jsdom does not implement a
 * pseudo-element read: it prints "Not implemented" to the virtual console and
 * hands back an empty string for every property. A browser answers `none` for an
 * element with no rule. So the first call establishes which engine this is, and
 * on one that cannot answer the question is never asked again — a guard that
 * fills a test log with hundreds of warnings gets its output ignored, which is
 * its own kind of blindness.
 */
let pseudoReadsAnswer: boolean | null = null;

function hasGeneratedContent(view: Window, el: Element): boolean {
  if (pseudoReadsAnswer === false) return false;
  for (const pseudo of ['::before', '::after']) {
    let content = '';
    try {
      content = view.getComputedStyle(el, pseudo).content;
    } catch {
      // Some engines refuse a pseudo-element read on a detached node. Silence
      // here means "no evidence", which falls through to the rest of the rule.
      content = '';
    }
    if (pseudoReadsAnswer === null && content !== '') pseudoReadsAnswer = true;
    if (!isNothing(content) && content !== 'normal' && content !== '""' && content !== "''") return true;
  }
  if (pseudoReadsAnswer === null) pseudoReadsAnswer = false;
  return false;
}

/**
 * Did this node, or anything under it, put something on the screen?
 *
 * Exported for the hosts' `AddOnSlot` and for the suites that drive it over
 * mutants. Give it the fill's WRAPPER, not the fill's output — the wrapper is
 * the element the host owns and the one the stylesheet keys off.
 */
export function drewSomething(node: Node): boolean {
  // Text: the plainest evidence there is.
  if (node.nodeType === 3) return /\S/.test(node.nodeValue ?? '');
  // Comments, processing instructions, document fragments' own node — nothing a
  // reader can see. React renders comment nodes for some fragments, which is
  // precisely a case `:empty` gets wrong in the OTHER direction.
  if (node.nodeType !== 1) return false;

  const el = node as Element;
  if (el.hasAttribute('hidden')) return false;

  const view = el.ownerDocument?.defaultView ?? null;
  let style: CSSStyleDeclaration | null = null;
  if (view !== null) {
    style = view.getComputedStyle(el);
    if (style.display === 'none') return false;
    if (style.visibility === 'hidden' || style.visibility === 'collapse') return false;
  }

  if (PAINTS_ON_ITS_OWN.includes(el.localName)) return true;
  if (style !== null && paintsABoxOfItsOwn(style)) return true;
  if (declaresPaintInline(el)) return true;

  for (const child of Array.from(el.childNodes)) {
    if (drewSomething(child)) return true;
  }

  /*
   * ASKED LAST, AND ONLY OF A SUBTREE THAT DREW NOTHING ELSE. A pseudo-element
   * read is the one expensive question here — jsdom does not implement it and
   * warns on every call — and it can only ever change the answer for an element
   * that has nothing else to show. Everything that draws returns above without
   * ever asking it.
   */
  if (view !== null && hasGeneratedContent(view, el)) return true;
  return false;
}

/** The negation, named, because that is the question the caller is asking. */
export const drewNothing = (node: Node): boolean => !drewSomething(node);
