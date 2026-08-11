/**
 * WHO ELSE IS INVOLVED — the line every surface that names a company ends on.
 *
 * ── WHY IT MOVED OUT OF `Overlays.tsx` (24 AC6) ─────────────────────────────
 *
 * [Moved and widened 2026-08-11, wave 4b round 6.] This component already
 * existed, one file over, and it was already right. It was mounted on the three
 * DIALOGS — connect, manage, disconnect — and on nothing else, so the surface a
 * reader meets FIRST and most often carried none of it.
 *
 * `screens/Extras.tsx` printed `shop.notAffiliated` ONCE, at the bottom of the
 * whole shelf, under both lists. That footnote is the defect rather than a
 * partial fix, in three separate ways:
 *
 *   IT SITS ON NO CARD. Two of the seven entries name a real company; the other
 *   five name none. A single line under all of them disclaims a relationship on
 *   behalf of cards that have nothing to disclaim, and says nothing that a
 *   reader can attach to the two cards that do.
 *
 *   IT IS BELOW THE FOLD OF THE ONE ARRANGEMENT THAT MATTERS. Filter the shelf
 *   to `delivery` and the carrier's card is the only thing on the page — with
 *   the footnote three sections down, after an empty "Connected" state.
 *
 *   AND IT MADE THE PAGE-WIDE GREP PASS. A check for "affiliat" over the
 *   rendered shelf came back GREEN on a page where no card said it. That is the
 *   shape this wave keeps finding: a guard satisfied by an arrangement nobody
 *   reads. `add-ons/shelfClaims.test.tsx` scopes every assertion to the card of
 *   the add-on it is about, which is the only reading that cannot be satisfied
 *   by a sentence three sections away.
 *
 * The maker's bench has had this as a component since round 4 and mounts it on
 * its shelf card, its connect dialog and its disconnect confirm. This is the
 * same component, in this shop's voice and class names — the other half of the
 * one-fix-one-host drift this round was sent to close.
 *
 * ── THE TWO SENTENCES, AND WHOSE THEY ARE ───────────────────────────────────
 *
 * `namesCompany: true`  → the HOST's line, "Adminium is not affiliated with
 *                         this company." It names no add-on and no company, so
 *                         holding it here does not make the host know anything
 *                         about which add-ons exist (AC5).
 * `namesCompany: false` → the ADD-ON's own words, out of its own eight-locale
 *                         bundle. The host has no sentence of its own claiming
 *                         an add-on connects to nobody, because that is not the
 *                         host's fact to assert.
 *
 * An absent line is indistinguishable from a forgotten one, which is why the
 * second branch exists at all. NOTHING is still the right answer when the
 * add-on has supplied nothing to say: an empty paragraph in a `gap` layout is a
 * blank stripe with no words in it, which reads as a bug rather than as silence.
 */

import type { CSSProperties } from "react";

import type { AddOn } from "../add-ons/host.ts";
import { useT } from "../i18n/index.tsx";

export function Affiliation({ addOn, style }: { addOn: AddOn; style?: CSSProperties }) {
  const t = useT();
  const line = addOn.namesCompany
    ? t("shop.notAffiliated")
    : (addOn.noCompanyKeys ?? []).map((key) => t(key as never)).join(" ");
  if (line.trim().length === 0) return null;
  return (
    <p className="mp-fine" style={style}>
      {line}
    </p>
  );
}
