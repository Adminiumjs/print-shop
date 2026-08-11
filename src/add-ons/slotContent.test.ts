/**
 * THE "DID THE FILL DRAW ANYTHING" RULE, DRIVEN OVER MUTANTS.
 *
 * @vitest-environment jsdom
 *
 * ── WHY MUTANTS AND NOT THE REAL FILLS ──────────────────────────────────────
 *
 * Because every fill this app vendors today draws something, so the rule returns
 * `true` for all of them whether it is right or wrong. A guard whose whole
 * evidence is "the real tree passes" is a guard that reports nothing on the day
 * it breaks — this wave has now found that shape eleven times.
 *
 * So the cases below are shapes a fill COULD return. Half must be reported as
 * having drawn nothing (they are the defect: the reader loses the shop's own
 * picture to a blank box) and half must be reported as having drawn (they are
 * correct output, and a rule that fires on them would acquire an exemption list,
 * which is where these holes come from in the first place).
 *
 * ── THE ONE THAT IS THE ACTUAL BUG ──────────────────────────────────────────
 *
 * `<div/>` and `<div><span style="display:none">…</span></div>`. Both have child
 * nodes, so `:not(:empty)` matched and the stylesheet hid the host's fallback on
 * their behalf. That is the round-2 defect at its third depth, and it is the
 * first two cases here.
 *
 * ── AND THE BOUNDARY, ASSERTED RATHER THAN DESCRIBED ────────────────────────
 *
 * `slotContent.ts` says it errs towards "drew" whenever it cannot see. The last
 * group pins that down: a classed element with no stylesheet behind it reads as
 * nothing HERE, and reads as drawing in a browser where the class paints —
 * because the rule reads `getComputedStyle`, which is the same answer in both
 * places rather than two behaviours.
 */

import { afterEach, describe, expect, it } from 'vitest';

import { drewNothing, drewSomething } from './slotContent.ts';

/** Build a fill wrapper holding `markup`, attached so styles resolve. */
function fill(markup: string): HTMLElement {
  const el = document.createElement('div');
  el.className = 'mp-slot-fill';
  el.innerHTML = markup;
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  document.body.innerHTML = '';
});

/**
 * Everything a fill can return that puts NOTHING on the screen.
 *
 * Each of these used to suppress the host's own content, because each of them
 * has at least one child node.
 */
const DREW_NOTHING: readonly { what: string; markup: string }[] = [
  { what: 'the bare wrapper the report named', markup: `<div></div>` },
  {
    what: 'a wrapper whose only child is display:none',
    markup: `<div><span style="display: none">a preview</span></div>`,
  },
  { what: 'a `hidden` element', markup: `<div hidden>a preview</div>` },
  { what: 'visibility: hidden', markup: `<div style="visibility: hidden">a preview</div>` },
  { what: 'nesting, three deep, ending in nothing', markup: `<div><div><div></div></div></div>` },
  { what: 'whitespace only', markup: `<div>   \n\t </div>` },
  {
    what: 'a comment, which React emits for some fragments',
    markup: `<div><!-- nothing for this record --></div>`,
  },
  {
    what: 'an empty element inside a visible one',
    markup: `<section><div></div><div></div></section>`,
  },
  {
    what: 'a display:none wrapper around real content',
    markup: `<div style="display:none"><img src="a.png" alt="a proof"><p>Ready</p></div>`,
  },
];

/**
 * And everything that DOES draw. If the rule fires on any of these the host
 * shows its fallback beside an add-on's real output — two answers to the same
 * question, on the same card.
 */
const DREW: readonly { what: string; markup: string }[] = [
  { what: 'plain text', markup: `<div>Collection booked</div>` },
  { what: 'text several levels down', markup: `<div><div><span>DHL</span></div></div>` },
  { what: 'an image with no text at all', markup: `<div><img src="proof.png" alt=""></div>` },
  { what: 'an SVG preview, which is what the personalizer returns', markup: `<div><svg></svg></div>` },
  { what: 'a control', markup: `<div><button type="button"></button></div>` },
  {
    what: 'a swatch that is nothing but a colour',
    markup: `<div><span style="background: #c8102e"></span></div>`,
  },
  {
    what: 'a rule drawn as a border',
    markup: `<div><span style="border-block-start: 1px solid #ddd"></span></div>`,
  },
  {
    what: 'one visible child among hidden ones',
    markup: `<div><span hidden>a</span><span style="display:none">b</span><span>c</span></div>`,
  },
  {
    what: 'an input a reader can type into',
    markup: `<div><label><input type="text"></label></div>`,
  },
];

describe('a fill that drew nothing is reported as having drawn nothing', () => {
  it.each(DREW_NOTHING)('$what', ({ markup }) => {
    const el = fill(markup);
    expect(
      drewSomething(el),
      `this markup puts nothing on the screen, and reporting it as drawn is what hides ` +
        `the shop's own content behind a blank box:\n  ${markup}`,
    ).toBe(false);
    expect(drewNothing(el)).toBe(true);
  });

  /*
   * THE OLD RULE, RUN BESIDE THE NEW ONE. Not decoration: it is the evidence
   * that these cases are a real change rather than a restatement. Every one of
   * them is NOT `:empty`, which is exactly why the stylesheet got them wrong.
   */
  it('is a different answer from `:empty`, which is the whole repair', () => {
    const disagreements = DREW_NOTHING.filter(({ markup }) => {
      const el = fill(markup);
      return !el.matches(':empty');
    });
    expect(
      disagreements.length,
      'every case here should be one `:empty` gets wrong; a case that IS empty proves nothing',
    ).toBe(DREW_NOTHING.length);
  });
});

describe('a fill that drew something is left alone', () => {
  it.each(DREW)('$what', ({ markup }) => {
    const el = fill(markup);
    expect(
      drewSomething(el),
      `this markup draws, and reporting it as blank would put the shop's own words ` +
        `underneath an add-on's real output:\n  ${markup}`,
    ).toBe(true);
  });
});

describe('the rule reads the document rather than guessing', () => {
  it('returns to "drew" the moment the fill puts something in', () => {
    const el = fill('<div></div>');
    expect(drewSomething(el)).toBe(false);
    el.querySelector('div')!.textContent = 'Booked with the carrier';
    expect(drewSomething(el)).toBe(true);
  });

  it('follows a child being hidden, not only added', () => {
    const el = fill('<div><span>Booked</span></div>');
    expect(drewSomething(el)).toBe(true);
    (el.querySelector('span') as HTMLElement).style.display = 'none';
    expect(drewSomething(el)).toBe(false);
  });

  /**
   * THE BOUNDARY THE RULE'S OWN HEADER CLAIMS, held to.
   *
   * A class is not evidence on its own — under jsdom with no stylesheet there is
   * nothing behind it, and the honest answer is that nothing was drawn. In a
   * browser the same call reads the same property and gets the class's own
   * background, which is why this is one rule and not two behaviours.
   */
  it('takes a class as no evidence when no stylesheet stands behind it', () => {
    expect(drewSomething(fill(`<div class="mp-card"></div>`))).toBe(false);
  });

  it('takes the same class as evidence once a stylesheet does', () => {
    const style = document.createElement('style');
    style.textContent = `.mp-card { background: #fff }`;
    document.head.appendChild(style);
    try {
      expect(drewSomething(fill(`<div class="mp-card"></div>`))).toBe(true);
    } finally {
      style.remove();
    }
  });
});
