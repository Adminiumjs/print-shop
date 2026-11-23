/*
 * VENDORED VERBATIM from packages/manifest/src/embed.ts.
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
 * `frontends[].embed`: THE SCREENS OF A CUSTOMER SIDE A LISTED WEBSITE MAY
 * SHOW IN A FRAME.
 *
 *   "embed": {
 *     "paths": ["/", { "path": "/book", "label": "Book a service",
 *                      "choose": { "query": "service", "table": "services", "value": "slug", "label": "name" } },
 *               "/reviews"],
 *     "modes": ["inline", "button", "floating"]
 *   }
 *
 * WHAT THIS DECIDES, AND WHAT IT CANNOT. The server reads the list once, when
 * a frame's document loads: it says which ADDRESSES a website on "Your
 * websites" may load with `?frame=1`. An app changes screens in the browser
 * with no new request, so the list cannot hold which SCREENS end up framed.
 * That half is the app's, through the public client's frame helper
 * (`@adminium/public-client/frame`), which refuses every screen it was not
 * told to show. So never declare a path that carries a private link or an
 * action on somebody's record (a booking's own page, with its Cancel): a state
 * reached after a booking made in the frame needs no address of its own.
 *
 * A path is compared whole, after the side's mount, with no query: `/book`
 * also covers `/book?service=gel`, and nothing under it.
 */
import { z } from 'zod';

import { refSchema, textOrLabels } from './refs.ts';

/** How a website shows the screen: in the page, opened by the site's own button, or from a corner of the page. */
export const EMBED_MODES = ['inline', 'button', 'floating'] as const;
export type EmbedMode = (typeof EMBED_MODES)[number];

/** How many screens one app may offer a website. */
export const EMBED_MAX_PATHS = 12;

/**
 * A path after the mount: starts with `/`, plain URL letters, no empty, `.`
 * or `..` part, no query and no escapes, so it reads the same raw and decoded.
 */
export function isEmbedPath(path: string): boolean {
  if (path.length > 120 || !/^\/[A-Za-z0-9._~/-]*$/.test(path)) return false;
  if (path === '/') return true;
  return path
    .slice(1)
    .split('/')
    .every((part) => part !== '' && part !== '.' && part !== '..');
}

const embedPath = z.string().refine(isEmbedPath, 'a path after the side’s mount, like "/book": no query, no "..", no empty part');

/** What the loader writes on a frame's address: a choice may not be called one of them. */
const EMBED_RESERVED_QUERY: readonly string[] = ['frame', 'mode', 'lang', 'theme'];

/** A query name the snippet may set to one of a table's values (`/book?service=gel`). */
const embedChoice = z
  .object({
    query: z.string().regex(/^[a-z][a-z0-9_-]{0,31}$/, 'a query name').refine((name) => !EMBED_RESERVED_QUERY.includes(name), 'a name the frame itself uses'),
    table: refSchema,
    value: z.string().regex(/^[a-z][a-z0-9_]*$/, 'a column'),
    label: z.string().regex(/^[a-z][a-z0-9_]*$/, 'a column'),
    /** What the snippet maker calls the choice ("A particular service") and its first answer ("Any service"). */
    title: textOrLabels.optional(),
    any: textOrLabels.optional(),
  })
  .strict();

const embedScreen = z.union([embedPath, z.object({ path: embedPath, label: textOrLabels.optional(), choose: embedChoice.optional() }).strict()]);

export const frontendEmbedSchema = z
  .object({
    paths: z.array(embedScreen).min(1).max(EMBED_MAX_PATHS),
    modes: z.array(z.enum(EMBED_MODES)).min(1).max(EMBED_MODES.length).optional(),
  })
  .strict()
  .superRefine((embed, ctx) => {
    const seen = new Set<string>();
    embed.paths.forEach((screen, index) => {
      const path = typeof screen === 'string' ? screen : screen.path;
      if (seen.has(path)) ctx.addIssue({ code: 'custom', message: `"${path}" is listed twice`, path: ['paths', index] });
      seen.add(path);
    });
    if (embed.modes !== undefined && new Set(embed.modes).size !== embed.modes.length) ctx.addIssue({ code: 'custom', message: 'a way is listed twice', path: ['modes'] });
  });

export type FrontendEmbed = z.infer<typeof frontendEmbedSchema>;

/** One screen a website may show, as the server and the snippet maker read it. */
export interface EmbedScreen {
  path: string;
  label?: z.infer<typeof textOrLabels>;
  choose?: z.infer<typeof embedChoice>;
}

/**
 * What a stored manifest's customer side declares, or null when it declares
 * nothing. Read defensively: a stored document may predate the word, and a
 * shape that does not parse opens nothing.
 */
export function embedOfDocument(document: unknown): { screens: EmbedScreen[]; modes: EmbedMode[] } | null {
  if (document === null || typeof document !== 'object') return null;
  const frontends = (document as { frontends?: unknown }).frontends;
  if (!Array.isArray(frontends)) return null;
  const customer = frontends.find((one): one is Record<string, unknown> => one !== null && typeof one === 'object' && (one as { side?: unknown }).side === 'customer');
  if (customer === undefined) return null;
  const parsed = frontendEmbedSchema.safeParse(customer['embed']);
  if (!parsed.success) return null;
  return {
    screens: parsed.data.paths.map((screen) => (typeof screen === 'string' ? { path: screen } : stripped(screen))),
    modes: parsed.data.modes ?? [...EMBED_MODES],
  };
}

function stripped(screen: Exclude<FrontendEmbed['paths'][number], string>): EmbedScreen {
  return {
    path: screen.path,
    ...(screen.label === undefined ? {} : { label: screen.label }),
    ...(screen.choose === undefined ? {} : { choose: screen.choose }),
  };
}

/** Only a customer side may be framed, and a named table must be one of the app's. */
export function embedIssues(m: {
  frontends: readonly Record<string, unknown>[];
  requiredSchema: { tables: readonly { ref: string; private?: true | undefined; columns: readonly { ref: string; type?: string | undefined; hidden?: boolean | undefined; rules?: unknown }[] }[] };
}): { path: (string | number)[]; message: string }[] {
  const out: { path: (string | number)[]; message: string }[] = [];
  const tables = new Map(m.requiredSchema.tables.map((table) => [table.ref, table]));
  m.frontends.forEach((frontend, index) => {
    const embed = frontend['embed'] as FrontendEmbed | undefined;
    if (embed === undefined) return;
    if (frontend['side'] !== 'customer') out.push({ path: ['frontends', index, 'embed'], message: 'only a customer side may be shown on a website' });
    embed.paths.forEach((screen, at) => {
      if (typeof screen === 'string' || screen.choose === undefined) return;
      const here = ['frontends', index, 'embed', 'paths', at, 'choose'];
      const table = tables.get(screen.choose.table);
      if (table === undefined || table.private === true) {
        out.push({ path: [...here, 'table'], message: `"${screen.choose.table}" is not one of this app's open tables` });
        return;
      }
      // What the maker reads and prints in a snippet: never a column kept from staff.
      for (const word of ['value', 'label'] as const) {
        const column = table.columns.find((one) => one.ref === screen.choose?.[word]);
        const secret = (column?.rules as { code?: { hiddenFromStaff?: unknown } } | undefined)?.code?.hiddenFromStaff === true;
        if (column === undefined || column.hidden === true || column.type === 'json' || column.type === 'blob' || secret) out.push({ path: [...here, word], message: `"${screen.choose[word]}" is not a shown column of "${table.ref}"` });
      }
    });
  });
  return out;
}
