/*
 * VENDORED VERBATIM from packages/add-on-contracts/src/add-on-block.ts.
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
 * The `addOn` manifest block and its validation rules. Lives here rather than
 * in `@adminium/manifest` because the rules are assertions ABOUT the registries
 * in this package — a slot id or a contract id is only meaningful against the
 * closed lists in `slots.ts` / `contracts.ts`.
 *
 * `@adminium/manifest` imports this to build the `kind: "add-on"` branch of its
 * discriminated union.
 */

import { z } from 'zod';

import { i18nMessageSchema, wordsByLanguageSchema } from './common.ts';
import { contractIdSchema, hasContractVersion } from './contracts.ts';
import { RECORD_ACTION_KINDS } from './record-actions.ts';
import { framedPageSchema } from './framed-page.ts';
import { recordPanelsSchema } from './record-panels.ts';
import { recordTabsSchema } from './record-tabs.ts';
import { slotIdSchema } from './slots.ts';
import { addOnAssistantSchema } from './assistant-block.ts';
import { addOnStepsSchema } from './add-on-steps.ts';
import { BUILTIN_NAV_GROUP_KEYS, type BuiltinNavGroupKey } from './nav-groups.ts';
import { LEAD_SOURCE_CONTRACT, LEAD_SOURCE_GIVES } from './lead-source.ts';

/**
 * Add-ons get their OWN closed category vocabulary, because an add-on is
 * not a vertical and forcing it into the app facet set would make a carrier a
 * "commerce" product. Wave 4 uses two of the five; the other three exist so a
 * second add-on wave does not have to reopen the vocabulary. `marketing` is
 * for the add-ons that reach people outside the business: forms and surveys,
 * landing pages, chat, social posts, prospecting.
 */
export const ADD_ON_CATEGORIES = ['artwork', 'delivery', 'payments', 'email', 'data', 'marketing'] as const;
export const addOnCategorySchema = z.enum(ADD_ON_CATEGORIES);
export type AddOnCategory = (typeof ADD_ON_CATEGORIES)[number];

/** How the shop supplies credentials, if at all. */
export const CONNECT_KINDS = ['none', 'api-key', 'oauth2'] as const;
export const connectKindSchema = z.enum(CONNECT_KINDS);
export type ConnectKind = (typeof CONNECT_KINDS)[number];

const VERSION = String.raw`(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?`;
const COMPARATOR = new RegExp(`^(>=|<=|>|<|=|\\^|~)?${VERSION}$`);

/**
 * A semver range over an app's version: `^0.2.0`, `~0.2.1`, `0.2.0`, `*`,
 * `>=0.2.0`, `>=0.2.0 <1.0.0` (spaces join, `||` separates alternatives).
 * The same grammar `@adminium/manifest`'s `parseSemverRange` reads — written
 * again here because that package imports this one, not the reverse. In 0.x
 * `^0.2.0` stops before 0.3.0, so an add-on that means "0.2 and later" writes
 * `>=0.2.0`.
 */
export function isSemverRange(range: string): boolean {
  if (range.length === 0 || range.length > 120) return false;
  return range.split('||').every((alternative) => {
    const words = alternative.trim().split(/\s+/);
    if (words.length === 1 && words[0] === '*') return true;
    return words.length > 0 && words.every((word) => word !== '' && COMPARATOR.test(word));
  });
}

/**
 * Exact hostname — no wildcards, no bare IPs, no ports, no scheme.
 *
 * The final label is alphabetic on purpose: it is what makes `203.0.113.10`
 * fail. Every real TLD is alphabetic, and an egress allow-list that quietly
 * accepts a literal IP is an allow-list with a hole in it.
 */
const HOSTNAME = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))*\.[a-z]{2,63}$/;

export const attachTargetSchema = z
  .object({
    /** A known app key, or `"*"` when the contract is not host-specific. */
    app: z.union([z.literal('*'), z.string().regex(/^[a-z][a-z0-9-]{1,79}$/)]),
    range: z.string().refine(isSemverRange, 'range must be a semver range such as "^1.0.0", ">=0.2.0" or "*"').optional(),
    /** Only for `record.editor.panel`: which host tables the panel mounts on. */
    table: z.string().regex(/^[a-z][a-z0-9_]*$/).optional(),
  })
  .strict();

export const providesSchema = z
  .object({
    contract: contractIdSchema,
    version: z.number().int().positive(),
    server: z.string().min(1),
  })
  .strict();

export const consumesSchema = z
  .object({
    contract: contractIdSchema,
    version: z.number().int().positive(),
  })
  .strict();

/**
 * One slot an add-on fills, with the file its fill is in.
 *
 * A `record.actions` fill may also name the kind of declared table it acts
 * on (`on`): Adminium's generated record page then shows it on such a table,
 * as a button in the fill's own words (`label`, `labels`) and `icon`, beside
 * "Edit" (see `record-actions.ts`). A fill without `on` is for apps' own
 * screens alone, as every fill was before. The three words go together, and
 * only on that slot.
 */
export const slotFillSchema = z
  .object({
    slot: slotIdSchema,
    client: z.string().min(1),
    order: z.number().int(),
    /** `record.actions` only: the kind of declared table whose generated record page shows this fill. */
    on: z.enum(RECORD_ACTION_KINDS).optional(),
    /** The button's words, with `on`: a key in the add-on's own strings and the English fallback. */
    label: i18nMessageSchema.optional(),
    /** The button's words in the other languages: it is drawn before any of the add-on's code runs. */
    labels: wordsByLanguageSchema.optional(),
    /** The button's icon (a Lucide name), with `on`. */
    icon: z.string().regex(/^[a-z][a-z0-9-]{0,59}$/, 'an icon is a kebab-case Lucide name').optional(),
  })
  .strict()
  .superRefine((fill, ctx) => {
    const drawn = fill.label !== undefined || fill.labels !== undefined || fill.icon !== undefined;
    if (fill.on === undefined) {
      if (drawn) ctx.addIssue({ code: 'custom', path: ['on'], message: 'a fill\'s label, labels and icon are for a record action Adminium\'s record page shows: name the kind of table it acts on ("on")' });
      return;
    }
    if (fill.slot !== 'record.actions') ctx.addIssue({ code: 'custom', path: ['on'], message: '"on" is for a record.actions fill only' });
    if (fill.label === undefined) ctx.addIssue({ code: 'custom', path: ['label'], message: 'a record action Adminium\'s record page shows needs its words ("label")' });
    if (fill.icon === undefined) ctx.addIssue({ code: 'custom', path: ['icon'], message: 'a record action Adminium\'s record page shows needs an icon' });
  });

export const addOnEventSchema = z
  .object({
    on: z.string().min(1).max(80),
    server: z.string().min(1),
  })
  .strict();

/** Where an account's sign-in may be kept: one per install, or one per row of the app. */
export const CONNECT_ACCOUNTS = ['install', 'row'] as const;

/** The authorize parameters Adminium writes itself: a manifest's `authorizeParams` never names one. */
export const OAUTH_RESERVED_PARAMS: readonly string[] = ['response_type', 'client_id', 'redirect_uri', 'state', 'scope', 'code_challenge', 'code_challenge_method', 'login_hint'];

/** The slot a provider's sign-in address may hold for the customer's own directory. */
export const OAUTH_TENANT_SLOT = '{tenant}';

/** A directory's id or name: a GUID, a domain, or a word like `common`. Never a path. */
export const OAUTH_TENANT = /^[A-Za-z0-9](?:[A-Za-z0-9.-]{0,126}[A-Za-z0-9])?$/;

export const addOnConnectSchema = z
  .object({
    kind: connectKindSchema,
    authorizeUrl: z.url().optional(),
    tokenUrl: z.url().optional(),
    scopes: z.array(z.string().min(1)).optional(),
    /**
     * Connected accounts: Adminium keeps one sign-in per install or per row,
     * runs the flow and every refresh, and the add-on's code never holds a
     * token or the client secret. Absent: the one credential of the install.
     */
    accounts: z.enum(CONNECT_ACCOUNTS).optional(),
    /** Fixed extras on the authorize address (Google's `access_type=offline`, `prompt=consent`). */
    authorizeParams: z.record(z.string().regex(/^[a-z][a-z0-9_]{0,39}$/), z.string().min(1).max(200)).optional(),
    /** The scopes the add-on cannot work without: a shorter grant reads "partial", never "connected". */
    requiredScopes: z.array(z.string().min(1)).optional(),
    /** Where a grant is given back when a connection ends. */
    revokeUrl: z.url().optional(),
    /** Which claims of the ID token say who connected: a stable id, and an address (first one present). */
    identity: z.object({ subject: z.string().min(1).max(40), address: z.array(z.string().min(1).max(40)).min(1).max(4) }).strict().optional(),
    /** With `{tenant}` in the two addresses: what fills it when the registration names no directory. */
    tenant: z.object({ default: z.string().regex(OAUTH_TENANT) }).strict().optional(),
  })
  .strict()
  .superRefine((connect, ctx) => {
    const extras = ['authorizeParams', 'requiredScopes', 'revokeUrl', 'identity', 'tenant'] as const;
    if (connect.accounts === undefined) {
      for (const word of extras) {
        if (connect[word] !== undefined) ctx.addIssue({ code: 'custom', path: [word], message: `"${word}" is for connected accounts: declare "accounts"` });
      }
    } else {
      if (connect.kind !== 'oauth2') ctx.addIssue({ code: 'custom', path: ['accounts'], message: 'connected accounts sign in over oauth2' });
      if (connect.identity === undefined) ctx.addIssue({ code: 'custom', path: ['identity'], message: 'connected accounts name who connected: declare "identity"' });
    }
    for (const name of Object.keys(connect.authorizeParams ?? {})) {
      if (OAUTH_RESERVED_PARAMS.includes(name)) ctx.addIssue({ code: 'custom', path: ['authorizeParams', name], message: `"${name}" is written by Adminium` });
    }
    for (const scope of connect.requiredScopes ?? []) {
      if (!(connect.scopes ?? []).includes(scope)) ctx.addIssue({ code: 'custom', path: ['requiredScopes'], message: `"${scope}" is not one of "scopes"` });
    }
    const slotted = [connect.authorizeUrl, connect.tokenUrl].filter((url) => url?.includes(OAUTH_TENANT_SLOT) === true).length;
    if (slotted !== 0 && slotted !== 2) ctx.addIssue({ code: 'custom', path: ['tokenUrl'], message: `"${OAUTH_TENANT_SLOT}" goes in both addresses or neither` });
    if ((slotted === 2) !== (connect.tenant !== undefined)) {
      ctx.addIssue({ code: 'custom', path: ['tenant'], message: `"tenant" and "${OAUTH_TENANT_SLOT}" in the two addresses come together` });
    }
    for (const [field, raw] of [['authorizeUrl', connect.authorizeUrl], ['tokenUrl', connect.tokenUrl]] as const) {
      if (raw === undefined || !raw.includes(OAUTH_TENANT_SLOT)) continue;
      if (raw.indexOf(OAUTH_TENANT_SLOT) !== raw.lastIndexOf(OAUTH_TENANT_SLOT) || !new URL(raw.replace(OAUTH_TENANT_SLOT, 'common')).pathname.includes('/common')) {
        ctx.addIssue({ code: 'custom', path: [field], message: `"${OAUTH_TENANT_SLOT}" appears once, in the path` });
      }
    }
  });

export const addOnNetworkSchema = z
  .object({
    allow: z.array(z.string().regex(HOSTNAME, 'must be an exact https hostname')),
  })
  .strict();

// ── sources ──────────────────────────────────────────────────────────────────

/** The most sources one add-on declares. */
export const ADD_ON_SOURCES_MAX = 8;
/** What `reads` may say: the engine's own website reader, which an add-on only names. */
export const SOURCE_READS_WEBSITE = 'website';
/**
 * Ids no source may take: `sources` is the version field of the envelope the
 * engine keeps every source's key in (`{ sources: 1, <id>: { key } }`).
 */
export const RESERVED_SOURCE_IDS: readonly string[] = ['sources'];

/**
 * One place an add-on finds companies or people (`addOn.sources[]`): a
 * register, a search service, or the engine's own website reader
 * (`reads: "website"`). Each keyed source has its own key, a secret setting
 * no other source uses, and its own hosts, a part of `network.allow`: the
 * engine hands the add-on's code, per call, only that key and a client that
 * reaches only those hosts. The cross-checks with the rest of the block are
 * the block's own refines; that `key` is a secret setting is the manifest's
 * check, where the settings are seen.
 */
export const addOnSourceSchema = z
  .object({
    id: z
      .string()
      .regex(/^[a-z][a-z0-9-]{1,31}$/, 'a source id is kebab-case, 2 to 32 characters')
      .refine((id) => !RESERVED_SOURCE_IDS.includes(id), { message: 'a source id may not be "sources": the engine keeps its keys under that name' }),
    /** The hosts this source's code may reach: a part of `network.allow`. */
    hosts: z.array(z.string().regex(HOSTNAME, 'must be an exact https hostname')).min(1).max(8).optional(),
    /** `website`: the engine reads the company's website, and the add-on picks facts from what it read. */
    reads: z.literal(SOURCE_READS_WEBSITE).optional(),
    /** The secret setting that holds this source's key; absent for a source that needs none. */
    key: z.string().regex(/^[a-z][a-z0-9_]*$/, 'a setting key').optional(),
    gives: z.array(z.enum(LEAD_SOURCE_GIVES)).min(1).max(LEAD_SOURCE_GIVES.length),
    /** The source's own rate window: at most `calls` calls in `seconds`. */
    window: z.object({ calls: z.number().int().min(1).max(100_000), seconds: z.number().int().min(1).max(86_400) }).strict().optional(),
    /** Each call costs the owner money: it counts against the owner's daily cap. */
    paid: z.boolean().optional(),
    /**
     * The source's name as a person reads it ("Companies House", "the
     * website"): a key in the add-on's own strings and the English fallback.
     * The record page says where a filled field came from in these words.
     */
    label: i18nMessageSchema.optional(),
    /** The name in the other languages: drawn before any of the add-on's code runs. */
    labels: wordsByLanguageSchema.optional(),
  })
  .strict()
  .superRefine((source, ctx) => {
    if (new Set(source.gives).size !== source.gives.length) ctx.addIssue({ code: 'custom', path: ['gives'], message: 'a source names each thing it gives once' });
    if (source.reads === SOURCE_READS_WEBSITE) {
      // The engine reads the website itself: the add-on's code reaches no host for it and holds no key.
      if (source.hosts !== undefined) ctx.addIssue({ code: 'custom', path: ['hosts'], message: 'the website reader is the engine\'s: it names no hosts' });
      if (source.key !== undefined) ctx.addIssue({ code: 'custom', path: ['key'], message: 'the website reader needs no key' });
      if (source.gives.length !== 1 || source.gives[0] !== 'fill') ctx.addIssue({ code: 'custom', path: ['gives'], message: 'the website reader gives "fill" only' });
      if (source.paid === true) ctx.addIssue({ code: 'custom', path: ['paid'], message: 'the website reader costs nothing' });
    } else if (source.hosts === undefined) {
      ctx.addIssue({ code: 'custom', path: ['hosts'], message: 'a source names the hosts its code reaches' });
    }
  });
export type AddOnSource = z.infer<typeof addOnSourceSchema>;

/**
 * What the install's consent says of each source: the hosts it reaches, or
 * that the engine reads company websites for it. In the manifest's order.
 */
export function sourceConsentLines(block: { sources?: readonly AddOnSource[] | undefined }): { source: string; hosts: string[]; readsWebsites: boolean }[] {
  return (block.sources ?? []).map((source) => ({ source: source.id, hosts: [...(source.hosts ?? [])], readsWebsites: source.reads === SOURCE_READS_WEBSITE }));
}

// ── pages and navigation ─────────────────────────────────────────────────────

/**
 * An i18n message: a catalog key plus the English fallback rendered when the
 * key is absent. Defined in `common.ts`, where a record tab reads it too, and
 * exported from here as it always was.
 *
 * MOVED HERE FROM `@adminium/manifest` by 51a, which now re-exports it under
 * the same name. One definition rather than two, because both ends need it: a
 * page title and a nav-group label are written in a manifest and validated
 * there, and read back by a host through the schemas in THIS package. Two
 * four-line copies of the same shape are exactly the duplicate that drifts in a
 * field nobody reads — `max(400)` here and `max(200)` there — and then the
 * stricter copy refuses first, for a reason no message names.
 */
export { i18nMessageSchema, wordsByLanguageSchema, type I18nMessage, type WordsByLanguage } from './common.ts';

/**
 * THE RAIL'S BUILT-IN GROUPS now live in `nav-groups.ts`, re-exported here so
 * this module's public surface is unchanged. They moved so that a host needing
 * only the five keys — the dashboard's entry-chunk `app/bootstrap.ts` — can
 * import them without making this whole module, and everything the barrel
 * reaches from it, statically reachable. See that file's note.
 */
export { BUILTIN_NAV_GROUP_KEYS, type BuiltinNavGroupKey } from './nav-groups.ts';

/**
 * Where a page goes when its manifest asks for no group (the owner's ruling,
 * 51 D-nav). Applied at PARSE, so what a host reads is already resolved and the
 * rail never has to guess.
 *
 * The alternative is what generated pages do today, and it is worse: an app
 * page whose `navGroup` is not in the closed set is dropped into `hidden` at
 * `bootstrap/handlers.ts:146` — the page exists, nothing links to it, and
 * nothing says why. An add-on that omits a group has not made a mistake, so it
 * gets a home rather than a silence.
 */
export const DEFAULT_NAV_GROUP: BuiltinNavGroupKey = 'library';

/**
 * A group key, built-in or declared. Kebab-case, because it appears in no URL
 * but is compared against the built-in five, which are kebab.
 */
export const navGroupKeySchema = z
  .string()
  .regex(/^[a-z][a-z0-9-]{0,39}$/, 'a nav group key must be kebab-case, 1–40 characters');

/**
 * The host API an add-on's client code is written against.
 *
 * A version rather than a boolean because publishing `Modal` and `useNavigate`
 * to code the engine did not build makes them public API: the day that surface
 * changes shape, an add-on built against the old one must be REFUSED with its
 * version named, not mounted into a blank screen. There is deliberately no
 * `"*"`.
 */
export const hostApiVersionSchema = z.union([z.literal(1), z.literal(2)]);
export const HOST_API_VERSION = 1;
/**
 * `addOn.hostApi: 2` — "this add-on's pages also need the data kit"
 * (`host.data`). The host's own published version stays 1 for good: every
 * page built against it checks for exactly that, so the kit is a namespace
 * the host adds beside the others, with a version of its own.
 */
export const HOST_API_WITH_DATA = 2;

/**
 * A rail row. Omit `nav` entirely and the page is routable but unlisted —
 * a detail screen an add-on links to itself.
 */
export const addOnPageNavSchema = z
  .object({
    group: navGroupKeySchema.default(DEFAULT_NAV_GROUP),
    order: z.number().int(),
    /** Same audience the engine's own admin-only rail rows have. */
    adminOnly: z.boolean().optional(),
  })
  .strict();

/**
 * A page an add-on renders from its OWN bundle.
 *
 * NOT `pageSchema` in `@adminium/manifest`, which is a generated page: a
 * `template` the engine renders with `bindings` and `config`. This is code. The
 * two deliberately do not share a name in the same document — an add-on's live
 * under `addOn.pages` — because "page" meaning both a template row and a
 * JavaScript module in one manifest is how a reader ends up writing `template`
 * here and waiting for a screen that never comes.
 */
export const addOnPageSchema = z
  .object({
    /** The last segment of `/add-ons/<key>/<ref>`. */
    ref: z.string().regex(/^[a-z][a-z0-9-]*$/, 'page ref must be a kebab-case identifier'),
    title: i18nMessageSchema,
    /** The title in the other languages (see `wordsByLanguageSchema`): what the sidebar and the page's head show a reader. */
    titles: wordsByLanguageSchema.optional(),
    icon: z.string().min(1).max(60),
    /** A path the bundle route will serve; its default export is the page. */
    client: z.string().min(1),
    nav: addOnPageNavSchema.optional(),
    /** Reserve `/add-ons/<key>/<ref>/*` for the page's own sub-routes. */
    detail: z.boolean().optional(),
  })
  .strict();
export type AddOnPage = z.infer<typeof addOnPageSchema>;

/**
 * A group this add-on brings with it. Its label travels WITH the add-on — a key
 * plus an English fallback, resolved against the add-on's own translations —
 * which is the whole reason the engine does not have to own
 * `nav.group.<whatever>` in eight locales to let somebody name a group.
 */
export const addOnNavGroupSchema = z
  .object({
    key: navGroupKeySchema,
    label: i18nMessageSchema,
    /** The label in the other languages (see `wordsByLanguageSchema`). */
    labels: wordsByLanguageSchema.optional(),
    /** Orders the trailing add-on band only; built-in groups do not move. */
    order: z.number().int(),
  })
  .strict();
export type AddOnNavGroup = z.infer<typeof addOnNavGroupSchema>;

export const addOnBlockSchema = z
  .object({
    attaches: z.array(attachTargetSchema).min(1),
    /**
     * `server`: kept once per server (a payment provider: two businesses share
     * one provider account). Absent: installed per database, on its host
     * install's database — its settings, roles and keys are each business's own.
     */
    scope: z.enum(['server']).optional(),
    provides: z.array(providesSchema).optional(),
    consumes: z.array(consumesSchema).optional(),
    slots: z.array(slotFillSchema).optional(),
    events: z.array(addOnEventSchema).optional(),
    connect: addOnConnectSchema,
    /** Grants over host + own tables, checked against SCOPE_OUT_OF_RANGE. */
    scopes: z.array(z.string().min(1)).optional(),
    network: addOnNetworkSchema.optional(),
    /**
     * The places the add-on finds companies and people (see
     * {@link addOnSourceSchema}). A package with sources provides
     * `lead-source`, and a `lead-source` provider declares its sources.
     */
    sources: z.array(addOnSourceSchema).min(1).optional(),
    /**
     * The add-on's own tables for what its sources found: the people found
     * and where each filled field came from. Only the table refs are typed
     * here: the columns each must have are the manifest's own vocabulary, so
     * `@adminium/manifest` checks the whole of it.
     */
    leads: z
      .looseObject({
        foundPeople: z.string().regex(/^[a-z][a-z0-9_]*$/, 'a table ref'),
        fieldSources: z.string().regex(/^[a-z][a-z0-9_]*$/, 'a table ref'),
      })
      .optional(),
    /** The only settings the client bundle may read. */
    publicSettings: z.array(z.string().min(1)).optional(),
    /** One small page of its own, served in a sandbox with its own outside hosts (see `framed-page.ts`). */
    framedPage: framedPageSchema.optional(),
    /** Required to ship a demo that makes no real third-party call. */
    demoTransport: z.string().min(1).optional(),
    /**
     * Dashboard pages this add-on renders itself, and the groups it brings for
     * them. Both optional and additive: every manifest written before this
     * validates unchanged, which is the same promise `kind` kept when the
     * add-on branch itself was added.
     */
    pages: z.array(addOnPageSchema).min(1).optional(),
    navGroups: z.array(addOnNavGroupSchema).min(1).optional(),
    /** Required once `pages` is present; see {@link hostApiVersionSchema}. */
    hostApi: hostApiVersionSchema.optional(),
    /**
     * Shapes apps build their own tables on (an invoice with its lines and
     * payments). Only the name and version are typed here: a part's columns
     * and rules are the manifest's own vocabulary, which this package cannot
     * import, so `@adminium/manifest` checks the rest of each entry.
     */
    shapes: z
      .array(
        z.looseObject({
          name: z.string().regex(/^[a-z][a-z0-9-]*$/, 'a shape name is kebab-case'),
          version: z.number().int().min(1).max(99),
        }),
      )
      .min(1)
      .max(8)
      .optional(),
    /**
     * One of the add-on's own tables that holds a single row: its settings.
     * Adminium makes the row from the columns' defaults at install and hands
     * it to the add-on's deciding code. `@adminium/manifest` checks the table.
     */
    settingsTable: z.string().regex(/^[a-z][a-z0-9_]*$/, 'a table ref').optional(),
    /**
     * Ledgers: tables of the add-on's own that only Adminium writes, from
     * rows the add-on's `posting-rows` provider works out. Only the id is
     * typed here: the rest is the manifest's own vocabulary, which this
     * package cannot import, so `@adminium/manifest` checks each entry.
     */
    ledgers: z
      .array(z.looseObject({ id: z.string().regex(/^[a-z][a-z0-9-]{0,39}$/, 'a ledger id is kebab-case') }))
      .min(1)
      .max(4)
      .optional(),
    /**
     * What the add-on reads to answer a price question (offers, codes, what
     * was applied), served by its `price-adjust` provider. Its words are the
     * manifest's own, so `@adminium/manifest` checks the whole of it.
     */
    adjuster: z.record(z.string(), z.unknown()).optional(),
    /**
     * What the add-on reads to answer whether a design may be ordered (its
     * designs table and keyed reads from a design row), served by its
     * `design-check` provider. Its words are the manifest's own, so
     * `@adminium/manifest` checks the whole of it.
     */
    checker: z.record(z.string(), z.unknown()).optional(),
    /**
     * Stock words: a question a page may ask of a ledger without writing
     * anything — "is this in, low or out?". Only the id is typed here; the
     * rest names the manifest's own ledgers and settings, which
     * `@adminium/manifest` checks.
     */
    words: z
      .array(z.looseObject({ id: z.string().regex(/^[a-z][a-z0-9-]{0,39}$/, 'a words id is kebab-case') }))
      .min(1)
      .max(4)
      .optional(),
    /** Tabs on other tables' record pages that list this add-on's rows for the record (see `record-tabs.ts`). */
    recordTabs: recordTabsSchema.optional(),
    /** The add-on's own screens on the record pages of tables that link into one of its tables (see `record-panels.ts`). */
    panels: recordPanelsSchema.optional(),
    /**
     * What a typed or scanned code may find: the tables that hold codes and
     * the columns an answer may carry. Typed loosely here: it names the
     * manifest's own tables, so `@adminium/manifest` checks the whole of it.
     */
    lookUp: z.record(z.string(), z.unknown()).optional(),
    /**
     * Forms: which of the add-on's own tables hold the forms, the answers,
     * and (optional) the survey invitations and the strangers' files. The
     * engine reads, draws and writes them for a stranger; no add-on code
     * runs for one. Only the two tables every forms add-on has are typed
     * here: the columns each must have are the manifest's own vocabulary,
     * so `@adminium/manifest` checks the whole of it.
     */
    forms: z
      .looseObject({
        forms: z.string().regex(/^[a-z][a-z0-9_]*$/, 'a table ref'),
        answers: z.string().regex(/^[a-z][a-z0-9_]*$/, 'a table ref'),
      })
      .optional(),
    /**
     * Chat: which of the add-on's own tables hold the conversations, their
     * messages, the answers staff wrote for automatic replies and the
     * answerer's choices. The engine keeps the conversation for a stranger;
     * no add-on code runs for one. Only the table refs are typed here: the
     * columns each must have, and the settings table's, are the manifest's
     * own vocabulary, so `@adminium/manifest` checks the whole of it.
     */
    chat: z
      .looseObject({
        conversations: z.string().regex(/^[a-z][a-z0-9_]*$/, 'a table ref'),
        messages: z.string().regex(/^[a-z][a-z0-9_]*$/, 'a table ref'),
        answers: z.string().regex(/^[a-z][a-z0-9_]*$/, 'a table ref'),
        choices: z.string().regex(/^[a-z][a-z0-9_]*$/, 'a table ref'),
      })
      .optional(),
    /**
     * Landing pages: which of the add-on's own tables hold its pages and its
     * funnels. The engine draws a live page for a stranger and seals the
     * columns that publish one; no add-on code runs for a stranger. Only the
     * table refs are typed here: the columns each must have are the
     * manifest's own vocabulary, so `@adminium/manifest` checks the whole of
     * it. (`pages`, below, is the add-on's own staff screens.)
     */
    landing: z
      .looseObject({
        pages: z.string().regex(/^[a-z][a-z0-9_]*$/, 'a table ref'),
        funnels: z.string().regex(/^[a-z][a-z0-9_]*$/, 'a table ref'),
      })
      .optional(),
    /**
     * Reviews: which of the add-on's own tables hold the reviews customers
     * leave on an app's rows (a shipped order line, a visit) and the totals
     * the engine keeps of the published ones. The engine writes every review
     * through the app's `review` word and keeps the totals; staff move a
     * review's state and reply. Only the table refs are typed here: the
     * columns each must have are the manifest's own vocabulary, so
     * `@adminium/manifest` checks the whole of it.
     */
    reviews: z
      .looseObject({
        reviews: z.string().regex(/^[a-z][a-z0-9_]*$/, 'a table ref'),
        totals: z.string().regex(/^[a-z][a-z0-9_]*$/, 'a table ref'),
      })
      .optional(),
    /**
     * Steps the add-on gives to Automations: each a named write of one row of
     * one of its own tables (see `steps.ts`). Which table and columns they are
     * is `@adminium/manifest`'s to check.
     */
    steps: addOnStepsSchema.optional(),
    /**
     * What the add-on tells the assistant: what its tables are, and questions a
     * person might ask on its pages (see `assistant-block.ts`). Text only.
     */
    assistant: addOnAssistantSchema.optional(),
  })
  .strict()
  // A ref is a URL segment, so two pages sharing one is two screens at one
  // address — and the loser is whichever the host's lookup happens to find.
  .refine((b) => new Set((b.pages ?? []).map((p) => p.ref)).size === (b.pages ?? []).length, {
    message: 'duplicate page ref',
    path: ['pages'],
  })
  .refine((b) => new Set((b.navGroups ?? []).map((g) => g.key)).size === (b.navGroups ?? []).length, {
    message: 'duplicate nav group key',
    path: ['navGroups'],
  })
  // A declared group may not shadow a built-in one: the built-in label comes
  // from the engine's catalogue and the declared one from the add-on, so a
  // collision is two labels for one heading with no rule about which wins.
  .refine(
    (b) =>
      !(b.navGroups ?? []).some((g) =>
        (BUILTIN_NAV_GROUP_KEYS as readonly string[]).includes(g.key),
      ),
    {
      message: `a nav group key may not be one of the built-in groups (${BUILTIN_NAV_GROUP_KEYS.join(', ')})`,
      path: ['navGroups'],
    },
  )
  // NAV_GROUP_UNKNOWN, refused at parse rather than resolved at render. A group
  // nobody defines is the one failure this whole block exists to prevent: the
  // rail would draw a raw key as a heading, or drop the row into `hidden` the
  // way an unknown app group is dropped today, and both look like the add-on
  // simply not working.
  .refine(
    (b) =>
      (b.pages ?? []).every(
        (p) =>
          p.nav === undefined ||
          (BUILTIN_NAV_GROUP_KEYS as readonly string[]).includes(p.nav.group) ||
          (b.navGroups ?? []).some((g) => g.key === p.nav?.group),
      ),
    {
      message: 'a page names a nav group that is neither built in nor declared in navGroups',
      path: ['pages'],
    },
  )
  // The mirror of the rule above. A declared group no page uses renders as
  // nothing, so it is a typo in one of the two places — and refusing here names
  // it, where a silent empty heading would not.
  .refine(
    (b) =>
      (b.navGroups ?? []).every((g) => (b.pages ?? []).some((p) => p.nav?.group === g.key)),
    {
      message: 'a declared nav group is used by none of this add-on’s pages',
      path: ['navGroups'],
    },
  )
  // Pages are code the host runs against a published API surface. An add-on
  // that does not say which version it was built against cannot be refused
  // later on version grounds, which is the entire point of having a version.
  // The data kit is for pages: an add-on with none has nothing to build with it.
  .refine((b) => b.hostApi !== 2 || b.pages !== undefined, {
    message: 'hostApi 2 says the add-on\'s pages need the data kit: it declares pages',
    path: ['hostApi'],
  })
  .refine((b) => b.pages === undefined || b.hostApi !== undefined, {
    message: 'an add-on that declares pages must declare the hostApi version it is built against',
    path: ['hostApi'],
  })
  // Every `provides[].contract` must be in the registry AT the declared version.
  .refine((b) => (b.provides ?? []).every((p) => hasContractVersion(p.contract, p.version)), {
    message: 'CONTRACT_UNKNOWN: a provided contract is not in the registry at that version',
    path: ['provides'],
  })
  .refine((b) => (b.consumes ?? []).every((c) => hasContractVersion(c.contract, c.version)), {
    message: 'CONTRACT_UNKNOWN: a consumed contract is not in the registry at that version',
    path: ['consumes'],
  })
  // Sources: at most eight, each id once, the website reader at most once, and each key held by one source alone.
  .refine((b) => (b.sources ?? []).length <= ADD_ON_SOURCES_MAX, {
    message: `an add-on declares at most ${String(ADD_ON_SOURCES_MAX)} sources`,
    path: ['sources'],
  })
  .refine((b) => new Set((b.sources ?? []).map((source) => source.id)).size === (b.sources ?? []).length, {
    message: 'duplicate source id',
    path: ['sources'],
  })
  .refine((b) => (b.sources ?? []).filter((source) => source.reads === SOURCE_READS_WEBSITE).length <= 1, {
    message: 'the website reader is one source: declare it once',
    path: ['sources'],
  })
  .refine(
    (b) => {
      const keys = (b.sources ?? []).flatMap((source) => (source.key === undefined ? [] : [source.key]));
      return new Set(keys).size === keys.length;
    },
    { message: 'each source has a key of its own: two sources name the same setting', path: ['sources'] },
  )
  // A source's code reaches its own hosts only, and those are hosts the add-on declares it may contact at all.
  .superRefine((b, ctx) => {
    const allow = new Set(b.network?.allow ?? []);
    (b.sources ?? []).forEach((source, s) => {
      (source.hosts ?? []).forEach((host, h) => {
        if (!allow.has(host)) ctx.addIssue({ code: 'custom', path: ['sources', s, 'hosts', h], message: `"${host}" is not in network.allow: a source reaches only hosts the add-on declares` });
      });
    });
  })
  // The engine calls a package's sources through the one contract they answer by, and that contract only for sources.
  .refine((b) => b.sources === undefined || (b.provides ?? []).some((p) => p.contract === LEAD_SOURCE_CONTRACT), {
    message: `an add-on with sources provides the contract "${LEAD_SOURCE_CONTRACT}"`,
    path: ['provides'],
  })
  .refine((b) => !(b.provides ?? []).some((p) => p.contract === LEAD_SOURCE_CONTRACT) || b.sources !== undefined, {
    message: `an add-on that provides "${LEAD_SOURCE_CONTRACT}" declares its sources (addOn.sources)`,
    path: ['sources'],
  })
  .refine((b) => (b.provides ?? []).filter((p) => p.contract === LEAD_SOURCE_CONTRACT).length <= 1, {
    message: `an add-on provides "${LEAD_SOURCE_CONTRACT}" once: the engine calls it per source`,
    path: ['provides'],
  })
  // What sources find is kept in the add-on's own two tables, which the engine writes.
  .refine((b) => b.sources === undefined || b.leads !== undefined, {
    message: 'an add-on with sources names the tables the engine keeps what they found in (addOn.leads)',
    path: ['leads'],
  })
  .refine((b) => b.leads === undefined || b.sources !== undefined, {
    message: 'addOn.leads keeps what an add-on\'s sources found: it declares its sources (addOn.sources)',
    path: ['sources'],
  })
  // An oauth2 connect must name where it authorizes.
  .refine(
    (b) =>
      b.connect.kind !== 'oauth2' ||
      (b.connect.authorizeUrl !== undefined && b.connect.tokenUrl !== undefined),
    {
      message: 'an oauth2 connect must declare authorizeUrl and tokenUrl',
      path: ['connect'],
    },
  );

export type AddOnBlock = z.infer<typeof addOnBlockSchema>;

/** Issue codes the validators emit. */
export const ADD_ON_ISSUE_CODES = [
  'ATTACH_TARGET_UNKNOWN',
  'SLOT_UNKNOWN',
  'CONTRACT_UNKNOWN',
  'SCOPE_OUT_OF_RANGE',
  'NETWORK_ALLOW_REQUIRED',
  'CAPABILITY_CONFLICT',
  'FRONTEND_SECRET_LEAK',
  'SLOT_CONFLICT',
  /*
   * 51a adds no code for a bad nav group on purpose. `addOnBlockSchema` refuses
   * an undeclared group itself, and the cross-block rules in
   * `@adminium/manifest` run only after that schema has parsed — so a code here
   * would name a state no manifest can be in. The refusal is a schema issue
   * carrying the message, which is what a reader gets either way.
   */
] as const;
export type AddOnIssueCode = (typeof ADD_ON_ISSUE_CODES)[number];
