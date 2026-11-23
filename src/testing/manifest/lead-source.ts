/*
 * VENDORED VERBATIM from packages/add-on-contracts/src/lead-source.ts.
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
 * `lead-source@1` — a place that knows about companies (a business register,
 * a company search service) or about the people who work at one.
 *
 * One package may hold several sources (`addOn.sources`, each with its own
 * hosts and its own key), and provides this contract ONCE. The engine builds
 * one `LeadSource` per call and per source with {@link CreateLeadSource},
 * handing it only that source's key and an http client narrowed to that
 * source's hosts, so one source's code can neither see another's key nor
 * reach another's service.
 *
 * The questions:
 *  - `checkKey`: is the key the owner saved accepted?
 *  - `findCompanies` (a source that `gives: find`): companies by activity
 *    and place, a page at a time;
 *  - `fillCompany` (`gives: fill`): one company by its number, or by its
 *    name and town; more than one match is a choice the person makes;
 *  - `fromWebsite`: the company's facts picked out of a page the ENGINE read
 *    (this question gets no http of its own);
 *  - `findPeople` (`gives: people`): the people at a company's domain.
 *
 * Every method may answer a {@link LeadSourceError} instead; none throws for
 * an ordinary refusal. A call the signal stops may throw (as `fetch` does).
 * Every answer is parsed engine-side with {@link LEAD_SOURCE_ANSWER_SCHEMAS}:
 * every string is bounded, every URL is https, every list is capped, and an
 * answer that fails is treated as the source being unavailable.
 */
import { z } from 'zod';

export const LEAD_SOURCE_CONTRACT = 'lead-source';
export const LEAD_SOURCE_VERSION = 1;
/** The server half's export an add-on providing the contract names. */
export const LEAD_SOURCE_FACTORY = 'createLeadSource';

/** What a source gives: companies found by activity and place, a company's details filled in, people at a company. */
export const LEAD_SOURCE_GIVES = ['find', 'fill', 'people'] as const;
export type LeadSourceGive = (typeof LEAD_SOURCE_GIVES)[number];

/** The call each `gives` answers through. */
export const LEAD_SOURCE_CALL_FOR: Readonly<Record<LeadSourceGive, 'findCompanies' | 'fillCompany' | 'findPeople'>> = {
  find: 'findCompanies',
  fill: 'fillCompany',
  people: 'findPeople',
};

/** The most companies or people one answer carries, and the largest page a search asks for. */
export const LEAD_SOURCE_PAGE_MAX = 50;
/** The most source pages one found person names. */
export const LEAD_SOURCE_PERSON_PAGES_MAX = 20;

/** Why a source said no. */
export const LEAD_SOURCE_ERROR_CODES = ['KEY_REFUSED', 'RATE_LIMITED', 'QUOTA_SPENT', 'NOT_FOUND', 'UNAVAILABLE', 'INVALID_REQUEST'] as const;
export type LeadSourceErrorCode = (typeof LEAD_SOURCE_ERROR_CODES)[number];

// ─── What the engine hands a source ─────────────────────────────────────────

/** The fields of an HTTP response a source reads. A real `Response` has them all. */
export interface LeadSourceHttpResponse {
  readonly status: number;
  readonly headers: { get(name: string): string | null };
  text(): Promise<string>;
}

/**
 * The egress-bound client, narrowed to THIS source's hosts: any other host is
 * refused, and a redirect is refused rather than followed. The engine's own
 * add-on client has this shape; it is stopped by the call's signal.
 */
export type LeadSourceHttpClient = (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
) => Promise<LeadSourceHttpResponse>;

export interface LeadSourceContext {
  /** The `addOn.sources[].id` this call is for. */
  readonly source: string;
  /** THAT source's key only; null when it needs none. */
  readonly key: string | null;
  /** Narrowed to THAT source's hosts. */
  readonly http: LeadSourceHttpClient;
  /** Stop, and the engine's own deadline. */
  readonly signal: AbortSignal;
  /** BCP 47: for labels the source has in several languages. */
  readonly locale: string;
}

// ─── The questions ──────────────────────────────────────────────────────────

/** Companies by activity and place. */
export interface FindQuery {
  /** An activity code in the source's own scheme (a SIC code, a NAF code, an SN2025 code). */
  readonly activity: string;
  readonly place: {
    /** The place as the person typed it. */
    readonly text: string;
    /** ISO 3166-1 alpha-2. */
    readonly country: string;
    /** The place's codes, resolved by the engine where a register needs them (France's INSEE codes, Norway's municipalities). */
    readonly codes?: readonly string[];
  };
  readonly page: {
    /** Null for the first page; else the `next` of the page before. */
    readonly cursor: string | null;
    /** At most {@link LEAD_SOURCE_PAGE_MAX}. */
    readonly size: number;
  };
}

/** One company, by its number; else by its name and town. */
export interface FillQuery {
  readonly number?: string;
  readonly name?: string;
  readonly town?: string;
  /** ISO 3166-1 alpha-2. */
  readonly country?: string;
}

/** The people at one company. */
export interface PeopleQuery {
  /** The company's web domain (`kestrelyard.example`). */
  readonly domain: string;
  readonly company: string;
}

// ─── The answers ────────────────────────────────────────────────────────────

const URL_MAX = 2048;
/** An https URL: no other scheme reaches a link the engine draws or a row it writes. */
export const leadSourceUrlSchema = z.url({ protocol: /^https$/, error: 'an https URL' }).max(URL_MAX);
/** ISO 3166-1 alpha-2, upper case. */
const countrySchema = z.string().regex(/^[A-Z]{2}$/, 'an ISO 3166-1 alpha-2 country code');
/** A line of text: bounded, and at least one character. */
const words = (max: number) => z.string().min(1).max(max);

export const leadSourceErrorSchema = z
  .object({
    ok: z.literal(false),
    code: z.enum(LEAD_SOURCE_ERROR_CODES),
    message: z.string().max(1000),
    retryAfterSeconds: z.number().int().min(0).max(86_400).optional(),
  })
  .strict();
export type LeadSourceError = z.infer<typeof leadSourceErrorSchema>;

/** Whether an answer is a refusal. */
export function isLeadSourceError(answer: unknown): answer is LeadSourceError {
  return typeof answer === 'object' && answer !== null && (answer as { ok?: unknown }).ok === false;
}

export const keyCheckedSchema = z.object({ ok: z.literal(true), account: words(100).optional() }).strict();
export type KeyChecked = z.infer<typeof keyCheckedSchema>;

export const foundAddressSchema = z
  .object({
    lines: words(500).optional(),
    town: words(120).optional(),
    region: words(120).optional(),
    postalCode: words(20).optional(),
    country: countrySchema.optional(),
  })
  .strict();
export type FoundAddress = z.infer<typeof foundAddressSchema>;

/** A company's facts: what a fill may write. */
const factsShape = {
  name: words(300),
  /** The company's number in its register. */
  number: words(40),
  website: leadSourceUrlSchema,
  phone: words(40),
  address: foundAddressSchema,
  activity: z.object({ code: words(20).optional(), label: words(300).optional() }).strict(),
  about: words(2000),
  /** The page the facts were read from. */
  sourceUrl: leadSourceUrlSchema,
};

/** An officer: a name and a role only, never a birth date, a nationality or a home address. */
export const foundOfficerSchema = z.object({ name: words(200), role: words(100).optional() }).strict();

export const foundCompanySchema = z
  .object({
    /** The source's own id for the company. */
    ref: words(100),
    name: factsShape.name,
    number: factsShape.number.optional(),
    website: factsShape.website.optional(),
    phone: factsShape.phone.optional(),
    address: factsShape.address.optional(),
    activity: factsShape.activity.optional(),
    about: factsShape.about.optional(),
    /** A sole trader: a natural person (France `nature_juridique` 1000, Norway ENK). */
    natural: z.boolean(),
    /** The unit asked not to be approached for sales (France's opposition flag or `statut_diffusion` P; OpenCorporates' restricted for marketing). */
    noMarketing: z.boolean(),
    officers: z.array(foundOfficerSchema).max(LEAD_SOURCE_PAGE_MAX).optional(),
    sourceUrl: factsShape.sourceUrl.optional(),
  })
  .strict();
export type FoundCompany = z.infer<typeof foundCompanySchema>;

export const companiesFoundSchema = z
  .object({
    ok: z.literal(true),
    companies: z.array(foundCompanySchema).max(LEAD_SOURCE_PAGE_MAX),
    next: z.string().min(1).max(1024).nullable(),
    total: z.number().int().min(0).optional(),
  })
  .strict();
export type CompaniesFound = z.infer<typeof companiesFoundSchema>;

/** A company's facts picked from its website: a found company's fields, less what only a register says. */
export const companyFactsSchema = z
  .object({
    name: factsShape.name.optional(),
    number: factsShape.number.optional(),
    website: factsShape.website.optional(),
    phone: factsShape.phone.optional(),
    address: factsShape.address.optional(),
    activity: factsShape.activity.optional(),
    about: factsShape.about.optional(),
    sourceUrl: factsShape.sourceUrl.optional(),
  })
  .strict();
export type CompanyFacts = z.infer<typeof companyFactsSchema>;

export const foundPersonSchema = z
  .object({
    name: words(200),
    role: words(100).optional(),
    email: z.email().max(320),
    /** The pages the address was seen on. */
    sources: z.array(leadSourceUrlSchema).max(LEAD_SOURCE_PERSON_PAGES_MAX),
  })
  .strict();
export type FoundPerson = z.infer<typeof foundPersonSchema>;

export const peopleFoundSchema = z.object({ ok: z.literal(true), people: z.array(foundPersonSchema).max(LEAD_SOURCE_PAGE_MAX) }).strict();
export type PeopleFound = z.infer<typeof peopleFoundSchema>;

/**
 * A company's web page as the ENGINE read it (robots, redirects and size
 * held by the engine's reader): typed fields only, never the page's body.
 */
export interface WebsitePage {
  /** The address asked for. */
  readonly url: string;
  /** The address read, after the redirects the reader allowed. */
  readonly finalUrl: string;
  readonly name?: string;
  /** The site's own description of itself. */
  readonly about?: string;
  /** Organization and LocalBusiness blocks of the page, mapped; at most 5. */
  readonly jsonLd: readonly CompanyFacts[];
  /** Generic addresses only (`info@`, `contact@`). */
  readonly emails: readonly string[];
  /** Switchboard numbers only; at most 2. */
  readonly phones: readonly string[];
  readonly address?: FoundAddress;
}

/** One source. Each question is there only when the source gives it. */
export interface LeadSource {
  checkKey(): Promise<KeyChecked | LeadSourceError>;
  /** `gives: find`. */
  findCompanies?(query: FindQuery): Promise<CompaniesFound | LeadSourceError>;
  /** `gives: fill`: 0..n matches; more than one is a choice the person makes. */
  fillCompany?(query: FillQuery): Promise<CompaniesFound | LeadSourceError>;
  /** The company's facts from a page the engine read. */
  fromWebsite?(page: WebsitePage): Promise<CompanyFacts | LeadSourceError>;
  /** `gives: people`. */
  findPeople?(query: PeopleQuery): Promise<PeopleFound | LeadSourceError>;
}

/** The server half's export. Called once per call, per source. */
export type CreateLeadSource = (context: LeadSourceContext) => LeadSource;

/** The schema each answer must pass, by call. A refusal is parsed with {@link leadSourceErrorSchema}. */
export const LEAD_SOURCE_ANSWER_SCHEMAS = {
  checkKey: keyCheckedSchema,
  findCompanies: companiesFoundSchema,
  fillCompany: companiesFoundSchema,
  fromWebsite: companyFactsSchema,
  findPeople: peopleFoundSchema,
} as const;

export type LeadSourceCall = keyof typeof LEAD_SOURCE_ANSWER_SCHEMAS;

/** What each call answers when it is not refused. */
export interface LeadSourceAnswers {
  checkKey: KeyChecked;
  findCompanies: CompaniesFound;
  fillCompany: CompaniesFound;
  fromWebsite: CompanyFacts;
  findPeople: PeopleFound;
}

/**
 * Parses one answer as the engine does: the call's own shape, or a refusal.
 * Anything else answers `UNAVAILABLE` (with the parse's reason in `issues`,
 * for the log; never shown).
 */
export function parseLeadSourceAnswer<C extends LeadSourceCall>(
  call: C,
  answer: unknown,
): { answer: LeadSourceAnswers[C] | LeadSourceError; issues: string[] } {
  if (isLeadSourceError(answer)) {
    const refused = leadSourceErrorSchema.safeParse(answer);
    if (refused.success) return { answer: refused.data, issues: [] };
    return { answer: { ok: false, code: 'UNAVAILABLE', message: 'The source gave an answer Adminium could not read.' }, issues: refused.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`) };
  }
  const parsed = LEAD_SOURCE_ANSWER_SCHEMAS[call].safeParse(answer);
  if (parsed.success) return { answer: parsed.data as LeadSourceAnswers[C], issues: [] };
  return { answer: { ok: false, code: 'UNAVAILABLE', message: 'The source gave an answer Adminium could not read.' }, issues: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`) };
}
