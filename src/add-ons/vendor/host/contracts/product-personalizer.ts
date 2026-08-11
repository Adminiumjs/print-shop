/*
 * VENDORED from add-ons/packages/host/src/contracts/product-personalizer.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The ONE shared contract; the three add-ons here import it by relative path.
 */
/**
 * `product-personalizer@1` — the third contract in the closed registry
 * (24 §5.5), and the one whose implementation spans three surfaces: the
 * shopper's live preview, the maker's setup panel, and — in Phase B — a record
 * editor inside the generated dashboard. That spread is why it is a contract at
 * all rather than a screen.
 *
 * MIRRORED, NOT IMPORTED, exactly like its two siblings in this directory. The
 * upstream is `packages/add-on-contracts/src/product-personalizer.ts` in the
 * Adminium monorepo, which is not on npm and which this repo cannot reach; the
 * types are restated here and the Zod validators are restated under
 * `../testing/schemas.ts`, because a validator needs `zod` and an add-on's
 * shipped bundle may take no runtime dependency the host does not already have
 * (24 D7).
 *
 * WHERE THIS FILE AND THE MONOREPO DISAGREE, THE MONOREPO IS RIGHT. The shapes
 * below are copied member for member from it, including the two that a reader
 * might otherwise think were invented here:
 *
 *   `PreviewRef.digest` — a content hash, and the whole mechanism behind
 *   acceptance criterion 17. Equal values and an equal angle must produce an
 *   equal digest, which is what lets a cart thumbnail, a proof and an order line
 *   be provably the same picture rather than three pictures that look alike.
 *
 *   `Verdict`'s failing branch — it carries `remedies`, and `remedies` carries
 *   NUMBERS. "It doesn't fit" with no way out is a contract violation rather
 *   than a UI choice (D5c, AC18): the surface renders each remedy as a button
 *   and the number is what the button does.
 */

import type { FileRef } from './common.ts';

export type ZoneKind = 'text-line' | 'text-block' | 'image' | 'colour';
export type ZoneFinish = 'engraved' | 'raised' | 'printed' | 'painted';

export interface Zone {
  id: string;
  name: string;
  kind: ZoneKind;
  shape: {
    type: 'rect' | 'ellipse';
    xMm: number;
    yMm: number;
    wMm: number;
    hMm: number;
  };
  constraints: {
    maxChars?: number;
    fonts?: string[];
    minSizeMm?: number;
    maxSizeMm?: number;
    palette?: string[];
  };
  finish: ZoneFinish;
  /** Where the zone lands on each supplied angle; absent ⇒ not visible there. */
  perAngle: Record<
    string,
    { xPct: number; yPct: number; wPct: number; hPct: number; skewDeg?: number }
  >;
}

export interface Template {
  productKey: string;
  angles: { id: string; label: string; fileId: string }[];
  zones: Zone[];
}

export interface Personalization {
  templateId: string;
  values: Record<string, string>;
  font?: string;
  sizeMm?: number;
  finish?: ZoneFinish;
}

export interface ProductRef {
  productKey: string;
  variant?: string;
  quantity: number;
}

export interface PreviewRef {
  fileId: string;
  angle: string;
  widthPx: number;
  /** Content hash — equal values + equal angle ⇒ equal digest (determinism). */
  digest: string;
}

/**
 * An overrun carries BOTH remedies with their numbers where both exist — the UI
 * renders them as buttons. A bare "doesn't fit" is a contract violation.
 */
export type Verdict =
  | { zone: string; ok: true }
  | {
      zone: string;
      ok: false;
      reason: string;
      remedies: { setSizeMm?: number; shortenToChars?: number };
    };

export interface ProductPersonalizer {
  readonly key: string;
  available(product: ProductRef): { ok: true } | { ok: false; reason: string };
  /** The shopper's surface. Resolves to their choices, or null if they backed out. */
  open(product: ProductRef, initial?: Personalization): Promise<Personalization | null>;
  /** Deterministic: same values + same angle ⇒ same image. */
  render(p: Personalization, opts: { angle: string; widthPx: number }): Promise<PreviewRef>;
  /** What goes to the machine — outlines, layered. Never drives hardware. */
  productionFile(p: Personalization): Promise<FileRef>;
  validate(p: Personalization, t: Template): Verdict[];
}
