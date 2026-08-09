/**
 * The `artwork.sources` seam: what the host hands an artwork add-on, and what
 * it does with what comes back.
 *
 * `ArtworkRef` is a mirror of `artwork-source@1` in
 * `@adminium/add-on-contracts`, copied rather than imported for the same reason
 * `slots.ts`, `styles/tokens.css` and `i18n/locales.ts` are: this app is a
 * standalone repo published to the Adminiumjs org and cannot depend on the
 * monorepo. The shape is the contract — do not add a field here to make a
 * screen easier.
 */

import { BLEED_MM } from '../lib/rates.ts';
import { resolveSize, type ArtworkFile, type Configuration } from '../lib/quote.ts';

/** `artwork-source@1`. What an add-on resolves its flow to. */
export interface ArtworkRef {
  fileId: string;
  /** The add-on key that produced it. */
  source: string;
  widthMm: number;
  heightMm: number;
  bleedMm: number;
  dpi: number;
  pages: number;
  previewFileId?: string;
}

/** The job as an add-on wants to read it — trim size in millimetres, resolved. */
export interface JobSpec {
  productKey: string;
  productLabel: string;
  trimWidthMm: number;
  trimHeightMm: number;
  bleedMm: number;
  sides: 1 | 2;
  quantity: number;
}

/**
 * Everything the two artwork add-ons read, in one payload.
 *
 * They read overlapping but different subsets — one wants a resolved `job`,
 * the other a `config` plus the host's `size` — so the host sends both rather
 * than making either guess. A superset payload is cheap; an add-on re-deriving
 * a size the host already knows is how two screens end up disagreeing about
 * what is being printed.
 *
 * `settings` is NOT here and is not missing: `<AddOnSlot>` adds each fill's own
 * add-on's saved values on the way through. A screen that named one add-on's
 * settings to pass them along was a screen that would have had to name the
 * second one too.
 */
export interface ArtworkSlotPayload {
  config: Configuration;
  size: { widthMm: number; heightMm: number };
  productLabel: string;
  job: JobSpec;
  /** How a finished design gets back onto the order. */
  onArtwork: (ref: ArtworkRef) => void;
}

export function jobSpecFor(config: Configuration, productLabel: string): JobSpec {
  const size = resolveSize(config);
  return {
    productKey: config.product,
    productLabel,
    trimWidthMm: size.widthMm,
    trimHeightMm: size.heightMm,
    bleedMm: BLEED_MM,
    sides: config.sides,
    quantity: config.quantity,
  };
}

/**
 * An `ArtworkRef` as the works' own `checkArtwork()` wants to see it.
 *
 * THE HOST RUNS THE CHECKS, never the add-on that made the file (24 §5.5), and
 * this is the conversion that lets it: whatever an add-on believes about its
 * own output, what reaches `checkArtwork` is the four facts the contract
 * carries — finished size, bleed, dots and pages — measured the way an upload
 * is measured.
 *
 * THE OTHER THREE FACTS ARE NOT MEASURED, AND THAT IS THE POINT OF THIS
 * COMMENT. `artwork-source@1` carries no ink-to-trim distance, no colour space
 * and no font-embedding flag, so the host has nothing to check them against
 * short of opening the file — which a browser-side demo has no bytes for. They
 * are recorded here as "nothing to report" rather than as a pass or a warning,
 * because a warning nobody measured is a warning a customer cannot act on. It
 * is a real gap in the contract's version 1 and belongs in its version 2, not
 * in a screen that quietly invents a number.
 *
 * AND THE SCREEN SAYS SO. "Nothing to report" is indistinguishable from "we
 * checked and it was fine" once it reaches a customer, and three of the works'
 * six checks land in that state for every add-on-supplied design — so the
 * artwork screen prints `addon.host.artwork.unmeasured` beside the verdicts
 * whenever the file came from an add-on, naming which checks ran on measured
 * numbers and which had nothing to measure. `REF_UNMEASURED` is the list that
 * sentence is about, and `addOns.test.ts` asserts the two cannot drift apart.
 */
export function fileFromRef(ref: ArtworkRef): ArtworkFile {
  const px = (mm: number) => Math.round((mm / 25.4) * ref.dpi);
  return {
    filename: ref.fileId,
    widthPx: px(ref.widthMm),
    heightPx: px(ref.heightMm),
    widthMm: ref.widthMm,
    heightMm: ref.heightMm,
    bleedMm: ref.bleedMm,
    // Spread rather than three literals, so the constants the UI's sentence is
    // about and the constants the checks receive are the same three values.
    ...REF_UNMEASURED_VALUES,
    pages: ref.pages,
  };
}

/**
 * At the advisory threshold exactly, so the safe-area check neither fires nor
 * claims to have passed. See `fileFromRef` — this is the value of a fact the
 * contract does not carry, not a measurement.
 */
const UNMEASURED_INK_MM = 4;

/**
 * The three `ArtworkFile` fields `fileFromRef` fills with a constant.
 *
 * Named, exported and asserted so the sentence the customer reads can be
 * checked against the code rather than believed. Add a field to
 * `artwork-source` in version 2, measure it, and this list gets shorter and the
 * test fails until the copy catches up — which is the point.
 */
export const REF_UNMEASURED = ['nearestInkMm', 'colourSpace', 'fontsEmbedded'] as const;

/** What `fileFromRef` puts in each of those fields. */
export const REF_UNMEASURED_VALUES: {
  readonly [K in (typeof REF_UNMEASURED)[number]]: ArtworkFile[K];
} = {
  nearestInkMm: UNMEASURED_INK_MM,
  colourSpace: 'CMYK',
  fontsEmbedded: true,
};
