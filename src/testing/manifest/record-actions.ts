/*
 * VENDORED VERBATIM from packages/add-on-contracts/src/record-actions.ts.
 * Never hand-edit this copy: change the monorepo package and re-run
 * `node scripts/sync-manifest-validator.mjs`.
 *
 * WHY A COPY. `@adminium/manifest` is not published to npm and this app is a
 * standalone repo that must build from a clean clone, so it cannot depend on
 * the monorepo. It lives under `testing/` because `zod` is a devDependency
 * here and a runtime dependency the host does not carry — nothing in
 * the shipped bundle's import graph may reach it, which sources.test.ts gates.
 *
 * The only edits are import specifiers: `.js` becomes `.ts`, and the
 * `@adminium/add-on-contracts` package import becomes relative ones.
 */
/**
 * AN ADD-ON'S ACTION ON THE GENERATED RECORD PAGE (`record.actions`, `on`).
 *
 * The `record.actions` slot is one opening on the screen where somebody is
 * looking at ONE record, to do a thing to it. Apps' own screens mount it with
 * their own payload. Adminium's generated record page mounts it too, but only
 * for a fill that names the kind of table it acts on (`on`), and only on a
 * table an app declares as that kind (`people[].kind`, with the owner's word
 * on it): a companies table's "Fill in details", say.
 *
 * The page draws the button itself, in the fill's own words (`label`, and
 * `labels` in other languages, so it is named before any of the add-on's code
 * runs) with its `icon`, beside "Edit", and only for a reader who may change
 * the table. The button opens a side sheet holding the fill's code, handed
 * {@link RecordActionProps}. The fill reads the host's rows as the data kit
 * does; it writes through the engine's routes for that kind of table, never
 * through the kit.
 *
 * This file is the vocabulary and the shape the fill is handed.
 */

/** The kinds of declared table a fill on the generated record page may act on. */
export const RECORD_ACTION_KINDS = ['companies'] as const;
export type RecordActionKind = (typeof RECORD_ACTION_KINDS)[number];

/** What a `record.actions` fill drawn on the generated record page is handed (its `render(props)`). */
export interface RecordActionProps {
  /** The table as an add-on's tables name it: `<app>:<ref>` (`crm:companies`), else its id. */
  table: string;
  /** The row's key, as the data routes take it. */
  rowKey: string;
  /** The row as the reader sees it: their masks and column limits applied. */
  row: Readonly<Record<string, unknown>>;
  /** What the reader may do to the row's table. */
  grants: { update: boolean };
  /** Closes the sheet. */
  close(): void;
}
