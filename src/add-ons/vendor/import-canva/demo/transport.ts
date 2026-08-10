/*
 * VENDORED from add-ons/packages/import-canva/src/demo/transport.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `import-canva`; its manifest, tests and README live in the monorepo.
 */
/**
 * The demo transport (24 D11): four designs, no network.
 *
 * Nothing here calls out, and nothing here reads a real clock. Every date, file
 * id and filename is derived from the PINNED clock the host passes in
 * (Wednesday 5 August 2026, 10:20), so two visitors a month apart see the same
 * account with the same four designs edited on the same days — which is what
 * makes a demo reviewable rather than merely alive.
 *
 * A live demo that posted to a real vendor on every visitor's click would be a
 * defect, not a feature. The seam is the point: `CanvaTransport` is what a
 * self-host build swaps for the authorized client the host provides, and the
 * UI's "simulated" line is driven by `simulated` rather than hard-coded, so
 * swapping the transport also removes the label.
 */

import type { DesignSize } from "../import.ts";

/** The pinned clock, copied from the host's `Now`. */
export interface Clock {
  /** ISO date, `YYYY-MM-DD`. */
  iso: string;
  hour: number;
  minute: number;
}

export interface CanvaDesign {
  id: string;
  /** i18n key under `design.*` — the seeded fiction translates like everything else. */
  nameKey: string;
  /** Which gradient the picker tile uses. No photography anywhere in this app. */
  tint: "card" | "paper";
  /** ISO date, derived from the pinned clock rather than typed. */
  editedIso: string;
  size: DesignSize;
}

export interface CanvaExport {
  fileId: string;
  filename: string;
  design: DesignSize;
}

/** What the design tool was asked to be set to, when the customer went back and did it. */
export interface Refit {
  widthMm: number;
  heightMm: number;
  bleedMm: number;
}

export interface CanvaTransport {
  /** True when the answers come from a fixture — the UI says so where it shows them. */
  readonly simulated: boolean;
  list(): Promise<readonly CanvaDesign[]>;
  /** `refit` models the customer having gone back and set the size they were told to. */
  export(id: string, refit?: Refit): Promise<CanvaExport>;
}

/**
 * The four designs, as days before the pinned moment rather than as dates —
 * so advancing the demo clock moves "edited 4 days ago" with it instead of
 * leaving one screen claiming a design was edited in the future.
 */
const SEED: readonly {
  id: string;
  nameKey: string;
  tint: "card" | "paper";
  editedDaysAgo: number;
  size: DesignSize;
}[] = [
  {
    // THE ONE THE DEMO IMPORTS. Made at trim size, which is what a design tool
    // gives you unless you knew to ask for bleed — and nobody knows to ask for
    // bleed until a print works has told them once.
    //
    // TWO PAGES, and the count is load-bearing rather than decorative. The
    // Print Shop defaults business cards to two printed sides, and the page
    // check FAILS BEFORE the bleed remedy is offered: a one-page design on a
    // two-sided job is blocked for a reason scaling cannot fix, so
    // `assessImport` correctly withholds the scale button and the demo's whole
    // point — "+10.9%, and about 1.6mm comes off each of the left and right
    // edges" — never appears on the path a visitor actually walks. A loyalty
    // card with a back is also simply what a bakery would have made.
    // `import.test.ts` asserts the default path reaches the figure.
    id: "bakery-loyalty",
    nameKey: "design.bakeryLoyalty",
    tint: "card",
    editedDaysAgo: 1,
    size: { widthMm: 85, heightMm: 55, bleedMm: 0, dpi: 300, pages: 2 },
  },
  {
    // The clean one, and it is here so the flow is not only its failure case:
    // same job, same checks, every row green. Two pages for the same reason as
    // the card above — against the default two-sided job, a single page would
    // make "every row green" false.
    id: "cycles-service",
    nameKey: "design.cyclesService",
    tint: "card",
    editedDaysAgo: 4,
    size: { widthMm: 91, heightMm: 61, bleedMm: 3, dpi: 300, pages: 2 },
  },
  {
    id: "yoga-timetable",
    nameKey: "design.yogaTimetable",
    tint: "paper",
    editedDaysAgo: 9,
    size: { widthMm: 154, heightMm: 216, bleedMm: 3, dpi: 300, pages: 1 },
  },
  {
    id: "gallery-invite",
    nameKey: "design.galleryInvite",
    tint: "paper",
    editedDaysAgo: 23,
    size: { widthMm: 154, heightMm: 216, bleedMm: 3, dpi: 220, pages: 2 },
  },
];

/**
 * The account the shop authorized, and when.
 *
 * Seeded facts about THIS add-on's connection, so they live in this add-on. The
 * host held them until the settings seam landed — a host that hard-codes one
 * add-on's account is a host that knows which add-ons exist. `.test` is a
 * reserved TLD (RFC 2606): a demo address that could never be someone's real
 * mailbox.
 */
export const DEMO_ACCOUNT = "studio@marlowpress.test";
export const DEMO_AUTHORIZED_ON = "2026-08-01";

/**
 * Calendar arithmetic in UTC. `Date` is fine here — it is `Date.now()` that
 * would make this file lie, and there is none of it anywhere in this repo.
 */
function minusDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const at = new Date(Date.UTC(y, m - 1, d - days));
  return at.toISOString().slice(0, 10);
}

/** `20260805-1020` — the pinned moment, in the shape a file id can carry. */
function stamp(clock: Clock): string {
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${clock.iso.replaceAll("-", "")}-${pad(clock.hour)}${pad(clock.minute)}`;
}

export function createDemoTransport(clock: Clock): CanvaTransport {
  const designs: readonly CanvaDesign[] = SEED.map((seed) => ({
    id: seed.id,
    nameKey: seed.nameKey,
    tint: seed.tint,
    editedIso: minusDays(clock.iso, seed.editedDaysAgo),
    size: seed.size,
  }));

  return {
    simulated: true,

    async list() {
      return designs;
    },

    async export(id, refit) {
      const design = designs.find((d) => d.id === id);
      if (design === undefined) {
        // A transport failure is a typed refusal carrying what was asked for,
        // never a thrown string — the flow renders the message.
        throw new Error(`no design with id "${id}" in this account`);
      }

      // Going back and setting the size in the design tool re-renders the
      // artwork at that size, so the resolution comes back unchanged. Only the
      // geometry moves — which is exactly the difference between this remedy
      // and scaling the export we already have.
      const size: DesignSize =
        refit === undefined
          ? design.size
          : {
              widthMm: refit.widthMm,
              heightMm: refit.heightMm,
              bleedMm: refit.bleedMm,
              dpi: design.size.dpi,
              pages: design.size.pages,
            };

      return {
        fileId: `cnv-${stamp(clock)}-${design.id}${refit === undefined ? "" : "-refit"}`,
        filename: `${design.id}.pdf`,
        design: size,
      };
    },
  };
}
