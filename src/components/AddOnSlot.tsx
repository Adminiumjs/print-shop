/**
 * The one place a host surface asks "is anything filling this?".
 *
 * Screens never reach into the registry themselves. They render `<AddOnSlot>`
 * and hand it what to show when nothing is there — which is how the same
 * component serves both empty-state behaviours (24 D6):
 *
 *   `fallback` given  → the slot SPEAKS: a real, honest empty state in words,
 *                       used where a customer has something to be told.
 *   `fallback` absent → the slot is SILENT: it renders nothing at all, used on
 *                       the shop floor where there is nothing to act on.
 *
 * The rule in one line: where an empty slot has something to explain it says it
 * in words; where it has nothing to explain it renders nothing.
 *
 * ── "NOTHING FILLS IT" AND "THE FILL HAD NOTHING TO DRAW" ARE TWO THINGS ────
 *
 * [Ported from `maker-shop` 2026-08-11, wave 4b round 5. It was fixed there in
 * round 2 and not here, which is the drift this round was sent to find: two
 * hosts, one seam, and a repair that landed in whichever one the defect was
 * noticed in.]
 *
 * `fills.length === 0` is only the first of them, and treating it as the whole
 * rule puts an empty box on a real screen.
 *
 * An add-on can register a fill and correctly draw NOTHING for a particular
 * record — Design Studio has no preview for a job whose artwork came from
 * somewhere else, and the Canva tile declines a job it cannot serve. When that
 * happens a fill EXISTS, so the fallback is suppressed, and the fill renders
 * null: the customer's panel goes from showing the works' own words to showing a
 * nought-by-nought div. Connecting an add-on takes a picture AWAY.
 *
 * The host cannot know in advance — asking would mean asking an add-on about a
 * record, which is the add-on's business and not a question this seam has. So
 * the fallback is rendered ANYWAY, after the fills, and hidden by one sibling
 * rule in `styles/components.css`:
 *
 *     .mp-slot-spare { display: contents; }
 *     .mp-slot-fill:not(:empty):not([data-drew='none']) ~ .mp-slot-spare {
 *       display: none;
 *     }
 *
 * A fill that drew something hides the host's own content; a fill that drew
 * nothing leaves it exactly where it was. `display: contents` keeps the
 * fallback in its parent's layout, so nothing about an empty slot's appearance
 * changes.
 *
 * ── AND `:empty` WAS NOT THE QUESTION EITHER (round 6) ──────────────────────
 *
 * What stood here said "no JavaScript can ask this question and CSS can". Half
 * of that was right — JavaScript cannot ask it at RENDER time, before the fill
 * has run — and the other half was the next defect: `:empty` asks about child
 * nodes, not about paint. A fill returning `<div/>`, or a wrapper whose only
 * child is `display: none`, is not empty and drew nothing, so the fallback went
 * away and the reader got a blank box.
 *
 * `SlotFill` below asks the DOM afterwards, which is when the question can
 * honestly be asked, and marks the wrapper `data-drew="none"`. The rule and the
 * things it deliberately cannot see are in `add-ons/slotContent.ts`, one file
 * shared byte for byte with the other host and the monorepo.
 *
 * ── AND IT IS TYPED BY THE SLOT NOW, WHICH IS THE POINT ─────────────────────
 *
 * `<AddOnSlot<P>>` used to be generic over the PAYLOAD, which meant it accepted
 * whatever a screen felt like passing: `payload={{ job }}` for a slot whose
 * fills read `{ order }` compiled perfectly and threw at runtime, in the second
 * host, on three separate screens. The parameter is the SLOT ID now, and
 * `payload` is that id's declared shape minus `settings` — so a screen that
 * passes the wrong record is a compile error in this repo, which is where the
 * mistake was made.
 *
 * IT ALSO INJECTS EACH FILL'S OWN SETTINGS, which is why `settings` is the one
 * member a caller does not pass. A screen used to look `settings['design-studio']`
 * up by key to pass it along — a customer-facing screen naming an add-on, and
 * one that would have had to name the second one too.
 */

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

import type { PayloadFor } from "../add-ons/payloads.ts";
import { drewSomething } from "../add-ons/slotContent.ts";
import type { SlotId } from "../add-ons/slots.ts";
import { useStore } from "../state/store.ts";

/**
 * One fill's wrapper, and the element that answers "did it draw anything?".
 *
 * [Added 2026-08-11, round 6.] The stylesheet asked `:not(:empty)`, which is a
 * question about CHILD NODES. A fill that returns a bare `<div/>`, or a wrapper
 * whose only child is `display: none`, has child nodes and drew nothing — so
 * the host's own content was suppressed by a fill that painted nothing and the
 * reader got a blank box. That is the round-2 defect at its third depth:
 * connecting an add-on still took the picture away.
 *
 * `add-ons/slotContent.ts` holds the rule and its limits; this reports the
 * answer as `data-drew="none"` for the stylesheet to key off. A MutationObserver
 * rather than a dependency list, because a fill may change its mind from its OWN
 * state — data arriving, a preview clearing — without this component
 * re-rendering, and the answer has to follow the DOM rather than follow React.
 */
function SlotFill({ slot, children }: { slot: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [drew, setDrew] = useState(true);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el === null) return;
    const look = () => setDrew(drewSomething(el));
    look();
    if (typeof MutationObserver === "undefined") return;
    const watch = new MutationObserver((records) => {
      // Ignore the one attribute this component writes itself, or it would
      // spend the rest of the session answering its own question.
      const mine = records.every(
        (r) => r.type === "attributes" && r.target === el && r.attributeName === "data-drew",
      );
      if (!mine) look();
    });
    watch.observe(el, { childList: true, subtree: true, attributes: true, characterData: true });
    return () => watch.disconnect();
  });

  return (
    <div
      ref={ref}
      className="mp-slot-fill"
      data-add-on-slot={slot}
      /* Absent when it drew, so the stylesheet's rule reads in the positive
         direction and an element that has never been measured behaves exactly
         as it did before this existed. */
      data-drew={drew ? undefined : "none"}
    >
      {children}
    </div>
  );
}

export function AddOnSlot<S extends SlotId>({
  slot,
  payload,
  forAddOn,
  fallback,
  wrap,
}: {
  slot: S;
  /**
   * Exactly what this slot declares, minus `settings` — which this component
   * adds on the way through, per fill, from the add-on that supplied it.
   */
  payload: Omit<PayloadFor<S>, "settings">;
  /**
   * Scope to one add-on — what a `per-add-on` slot means. The manage drawer
   * asks for the panel of the add-on it is managing and gets that one, or the
   * fallback if that add-on renders no settings form.
   */
  forAddOn?: string;
  /** What to render when nothing fills this slot. Omit for a silent slot. */
  fallback?: ReactNode;
  /** Wraps the fills when there is at least one — a panel, a row, a grid. */
  wrap?: (children: ReactNode) => ReactNode;
}) {
  const registry = useStore((s) => s.registry);
  const enabled = useStore((s) => s.enabled);
  const settings = useStore((s) => s.addOnSettings);

  const fills = registry.fillsFor(slot, enabled, forAddOn);
  if (fills.length === 0) return <>{fallback ?? null}</>;

  const rendered = fills.map((entry, i) => (
    // The registry has already ordered these by `order` then add-on key, so the
    // index is a stable identity here rather than a positional guess.
    /*
     * `data-add-on-slot` NAMES THE SEAM IN THE MARKUP, and it is here for the
     * test tour rather than for the stylesheet.
     *
     * `testing/tour.tsx` reaches an add-on's own surfaces — Design Studio's
     * editor, the Canva wizard, a settings form — by pressing what a fill drew
     * and looking at what appears, because no store field names any of them. To
     * do that it has to be able to say "this part of the page belongs to an
     * add-on", and a class a stylesheet happens to use is not that: it can be
     * renamed, shared, or dropped for a grid, and the crawl would silently stop
     * crawling.
     */
    <SlotFill key={`${slot}-${i}`} slot={slot}>
      {/*
        * The cast is over the SETTINGS SPREAD alone: `payload` is already this
        * slot's declared shape (the prop above says so), and what a generic `S`
        * cannot verify is that adding one known member back to `Omit<…>` gives
        * the whole again. Everything a screen actually gets wrong — the wrong
        * record, a missing field, a stale shape — is caught at the prop.
        */}
      {entry.fill.render({ ...payload, settings: settings[entry.addOn] ?? {} } as PayloadFor<S>)}
    </SlotFill>
  ));

  /*
   * THE HOST'S OWN CONTENT, KEPT IN THE TREE. See the header: a fill may
   * legitimately have nothing to draw for THIS record, and until the stylesheet
   * gets to see whether it did, both have to be present.
   */
  const spare =
    fallback === undefined ? null : (
      <div key={`${slot}-spare`} className="mp-slot-spare">
        {fallback}
      </div>
    );
  const all = spare === null ? rendered : [...rendered, spare];

  return <>{wrap ? wrap(all) : all}</>;
}

