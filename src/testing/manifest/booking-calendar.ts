/*
 * VENDORED VERBATIM from packages/manifest/src/booking-calendar.ts.
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
 * `table.booking.calendar` — a booking as a calendar entry: the invitation a
 * mail carries, the links that add it to a calendar, and a person's private
 * feed.
 *
 * What the entry may say is fenced here, because a calendar entry is copied to
 * shared calendars and forwarded with every field: the app names the visit's
 * title, the person's first name, the booking's code and the studio's own
 * details. There is no word for a guest's note, phone or price, and the entry
 * never carries a link that opens the booking.
 *
 * `revision` is a whole number Adminium keeps on the row and raises whenever
 * the start, the length, the person or the cancelled state changes: it is the
 * entry's SEQUENCE, so a calendar takes the newest of two quick moves.
 *
 * `notice` is the line every entry carries, in the mail's language: declining
 * in a calendar does not cancel the visit. The app words it, and cannot leave
 * it out.
 *
 * `feed` opens a private calendar feed for each row of the booked table's
 * resource: `own` is the column holding that person's sign-in address (only
 * they are shown their link), `active` a yes/no that ends it, and `detail` a
 * setting: while it reads `name`, the entries show the customer's first name
 * and initial from `customer`; otherwise the service alone.
 *
 * Pure.
 */
import { z } from 'zod';

import { bcp47TagSchema, refSchema, settingRefSchema, type ColumnShape, type ReferenceIssue, type TableIndex, type TableShape } from './refs.ts';

/** The longest line an entry carries beside its facts. */
export const BOOKING_CALENDAR_NOTICE_MAX = 200;

/** Links then a column: one to three steps. */
const calendarPath = z.array(refSchema).min(1).max(3);

export const bookingCalendarSchema = z
  .object({
    /** A whole number Adminium raises on every change a calendar must hear of. */
    revision: refSchema,
    /** The visit's title, along links (the service's name). */
    title: calendarPath,
    /** The booking's own code, shown in the entry's description. */
    code: refSchema.optional(),
    /** The person's first name, along links. */
    person: calendarPath.optional(),
    /** The studio's name, and optionally its address and website: text columns of its one-row settings table. */
    studio: z.object({ name: settingRefSchema, address: settingRefSchema.optional(), website: settingRefSchema.optional() }).strict(),
    /** "Declining in your calendar does not cancel", in each language the mails are written in. */
    notice: z
      .record(bcp47TagSchema, z.string().min(1).max(BOOKING_CALENDAR_NOTICE_MAX))
      .refine((notice) => notice['en-US'] !== undefined, { message: 'the notice is given in several languages, en-US among them' }),
    /** A private feed for each resource row. */
    feed: z
      .object({
        /** The resource's column holding the person's sign-in address. */
        own: refSchema,
        /** A yes/no of the resource: false ends the feed. */
        active: refSchema.optional(),
        /** A setting: while it reads `name`, an entry shows the customer's first name and initial. */
        detail: settingRefSchema.optional(),
        /** The customer's whole name, along links, for that setting. */
        customer: calendarPath.optional(),
      })
      .strict()
      .refine((feed) => (feed.detail === undefined) === (feed.customer === undefined), { message: 'a feed that may show a name says both which setting allows it (detail) and where the name is (customer)', path: ['customer'] })
      .optional(),
  })
  .strict();
export type BookingCalendar = z.infer<typeof bookingCalendarSchema>;

/** Everything wrong with a booking's calendar word that this manifest can see. */
export function bookingCalendarIssues(
  table: TableShape,
  calendar: BookingCalendar,
  resourceTable: string | undefined,
  index: TableIndex,
  here: (...rest: (string | number)[]) => (string | number)[],
): ReferenceIssue[] {
  const out: ReferenceIssue[] = [];
  const at = (...rest: (string | number)[]) => here('calendar', ...rest);
  const want = (tableRef: string, column: string, types: readonly string[], path: (string | number)[], what: string): ColumnShape | undefined => {
    const found = index.column(tableRef, column);
    if (found === undefined) out.push({ path, message: `"${tableRef}" has no column "${column}"` });
    else if (!types.includes(found.type)) out.push({ path, message: `"${tableRef}.${column}" must be ${what}` });
    else return found;
    return undefined;
  };
  /** A path of links, then a text column. */
  const text = (path: readonly string[], where: (string | number)[]) => {
    let of = table.ref;
    for (const link of path.slice(0, -1)) {
      const found = index.column(of, link);
      if (found?.type !== 'fk' || found.references === undefined) {
        out.push({ path: where, message: `"${of}.${link}" is not a link of this app` });
        return;
      }
      of = found.references;
    }
    want(of, path[path.length - 1]!, ['text', 'enum'], where, 'a text column');
  };

  const revision = want(table.ref, calendar.revision, ['int', 'bigint'], at('revision'), 'a whole number');
  if (revision?.nullable === true) out.push({ path: at('revision'), message: `"${table.ref}.${calendar.revision}" always holds a number: make it not nullable` });
  text(calendar.title, at('title'));
  if (calendar.code !== undefined) want(table.ref, calendar.code, ['text'], at('code'), 'a text column');
  if (calendar.person !== undefined) text(calendar.person, at('person'));
  for (const name of ['name', 'address', 'website'] as const) {
    const setting = calendar.studio[name];
    if (setting !== undefined) want(setting.table, setting.column, ['text'], at('studio', name), 'a text column');
  }
  const feed = calendar.feed;
  if (feed !== undefined) {
    if (resourceTable !== undefined) {
      want(resourceTable, feed.own, ['text'], at('feed', 'own'), 'a text column holding the person\'s sign-in address');
      if (feed.active !== undefined) want(resourceTable, feed.active, ['bool'], at('feed', 'active'), 'a bool');
    }
    if (feed.detail !== undefined) want(feed.detail.table, feed.detail.column, ['text', 'enum'], at('feed', 'detail'), 'a text column');
    if (feed.customer !== undefined) text(feed.customer, at('feed', 'customer'));
  }
  return out;
}
