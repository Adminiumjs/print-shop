/*
 * VENDORED VERBATIM from packages/manifest/src/holders.ts.
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
 * WHO HOLDS A ROW OF VALUE (`holders`), AND WHEN IT STOPS BEING WORTH ANYTHING.
 *
 * An add-on keeps things a person holds: a pack of visits, a gift card, store
 * credit. When that person asks to be forgotten, the row cannot simply lose
 * their name: while it still has value it must stay spendable by them. A table
 * of the add-on's own says how to tell:
 *
 *     holders: {
 *       live: { status: 'status', open: ['issued'], left: 'uses_left', until: 'expires_on' },
 *       people: [{ email: 'holder_email', name: 'holder_name', key: 'holder_key', forgotten: 'holder_forgotten' }],
 *     }
 *
 *  - `live`: a row is worth something while `status` is one of `open`, `left`
 *    is above zero and `until` has not passed. A status in `waiting` counts
 *    whatever `left` says: a card sold and not paid yet holds nothing so far,
 *    and is still on its way to somebody;
 *  - `people`: each person a row can name. `key` is the column ruled
 *    `customerKey` of `email`, the link that proves the row is theirs. `sale`
 *    names the columns that say which row of an app sold it (`tableRef` and its
 *    row): a person reaches such a row through their own purchase, and only if
 *    the address on it is the one they proved;
 *  - `forgotten`: a yes/no column of the add-on's. Set when the person asks.
 *    It holds nothing about them, and is how the daily sweep finds a kept row
 *    once its value has ended, to empty what was kept.
 *
 * Only an add-on's own table may say it. Pure.
 */
import { z } from 'zod';

import { refSchema } from './refs.ts';

const statusSchema = z.string().min(1).max(64);

export const holdersSchema = z
  .object({
    live: z
      .object({
        status: refSchema,
        open: z.array(statusSchema).min(1).max(8),
        /** Open statuses that count as live with nothing on the row yet. */
        waiting: z.array(statusSchema).min(1).max(8).optional(),
        /** What is left on the row: uses or money. */
        left: refSchema,
        /** The last day it can be used. */
        until: refSchema.optional(),
      })
      .strict(),
    people: z
      .array(
        z
          .object({
            email: refSchema,
            name: refSchema.optional(),
            key: refSchema.optional(),
            sale: z.object({ table: refSchema, row: refSchema }).strict().optional(),
            forgotten: refSchema,
          })
          .strict(),
      )
      .min(1)
      .max(3),
  })
  .strict();
export type Holders = z.infer<typeof holdersSchema>;

interface HoldersColumn {
  ref: string;
  type: string;
  nullable?: boolean | undefined;
  enum?: readonly string[] | undefined;
  rules?: Readonly<Record<string, unknown>> | undefined;
}

const AMOUNTS = ['int', 'decimal', 'money'];

/** Everything wrong with one table's `holders` that the table alone shows. */
export function holdersIssues(table: { holders?: Holders | undefined; keep?: unknown; columns: readonly HoldersColumn[] }): { path: (string | number)[]; message: string }[] {
  const holders = table.holders;
  if (holders === undefined) return [];
  const out: { path: (string | number)[]; message: string }[] = [];
  const column = (ref: string) => table.columns.find((one) => one.ref === ref);
  /** A column that exists and has one of these types. */
  const typed = (ref: string, types: readonly string[], path: (string | number)[], what: string): HoldersColumn | undefined => {
    const found = column(ref);
    if (found === undefined) out.push({ path, message: `the table has no column "${ref}"` });
    else if (!types.includes(found.type)) out.push({ path, message: `"${ref}" is not ${what}` });
    return found;
  };
  /** A column a forgotten person's value is emptied from: it has to be able to be empty. */
  const emptied = (ref: string, path: (string | number)[], what: string) => {
    const found = typed(ref, ['text'], path, what);
    if (found !== undefined && found.nullable !== true) out.push({ path, message: `"${ref}" cannot be emptied: it is not nullable` });
    return found;
  };
  if (table.keep !== undefined) out.push({ path: ['holders'], message: 'a table the law keeps stays whole, so it never loses a holder' });
  const status = typed(holders.live.status, ['enum'], ['holders', 'live', 'status'], 'an enum');
  for (const [where, values] of [['open', holders.live.open], ['waiting', holders.live.waiting ?? []]] as const) {
    values.forEach((value, v) => {
      if (status !== undefined && !(status.enum ?? []).includes(value)) out.push({ path: ['holders', 'live', where, v], message: `"${value}" is not one of the values of "${status.ref}"` });
      if (where === 'waiting' && !holders.live.open.includes(value)) out.push({ path: ['holders', 'live', 'waiting', v], message: `"${value}" is not in "open"` });
    });
  }
  typed(holders.live.left, AMOUNTS, ['holders', 'live', 'left'], 'a number or an amount');
  if (holders.live.until !== undefined) typed(holders.live.until, ['date'], ['holders', 'live', 'until'], 'a date');
  holders.people.forEach((person, p) => {
    const at = (...rest: string[]) => ['holders', 'people', p, ...rest];
    emptied(person.email, at('email'), 'text');
    if (person.name !== undefined) emptied(person.name, at('name'), 'text');
    if (person.key !== undefined) {
      const key = emptied(person.key, at('key'), 'text');
      const of = (key?.rules?.['customerKey'] as { of?: unknown } | undefined)?.of;
      if (key !== undefined && of !== person.email) out.push({ path: at('key'), message: `"${person.key}" is not ruled customerKey of "${person.email}"` });
    }
    if (person.sale !== undefined) {
      const named = typed(person.sale.table, ['text'], at('sale', 'table'), 'text');
      if (named !== undefined && named.rules?.['tableRef'] !== true) out.push({ path: at('sale', 'table'), message: `"${person.sale.table}" is not ruled tableRef` });
      typed(person.sale.row, ['text'], at('sale', 'row'), 'text');
    }
    if (person.key === undefined && person.sale === undefined) out.push({ path: at(), message: 'nothing links this person to the row: name a `key` or a `sale`' });
    typed(person.forgotten, ['bool'], at('forgotten'), 'a yes/no');
  });
  return out;
}
