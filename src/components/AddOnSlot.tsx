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
 * IT ALSO INJECTS EACH FILL'S OWN SETTINGS. A screen used to pass
 * `settings['design-studio']` into the artwork slot's payload, which meant a
 * customer-facing screen named an add-on and would have had to name a second
 * one to offer it the same courtesy. The slot knows which add-on supplied each
 * fill, so it is the slot that hands over that add-on's saved values — and a
 * screen never looks a settings document up by key again.
 */

import type { ReactNode } from "react";

import type { SlotId } from "../add-ons/slots.ts";
import { useStore } from "../state/store.ts";

export function AddOnSlot<P>({
  slot,
  payload,
  forAddOn,
  fallback,
  wrap,
}: {
  slot: SlotId;
  payload: P;
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
    <div key={`${slot}-${i}`} className="mp-slot-fill">
      {(entry.fill.render as (p: P & { settings: unknown }) => ReactNode)({
        ...payload,
        settings: settings[entry.addOn] ?? {},
      })}
    </div>
  ));

  return <>{wrap ? wrap(rendered) : rendered}</>;
}

