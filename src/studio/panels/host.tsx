/**
 * THE HOST A CUSTOMISER PANEL IS DRAWN WITH, ON THE WORKS' OWN SCREENS.
 *
 * A record panel is the add-on's code (the Customiser's "Customising" tab on
 * a job or a product), built to run inside Adminium's dashboard: it
 * imports no React and no parts of its own, and reads them as its module
 * starts from the host API on the well-known global (`host`: the basic kit,
 * the data kit, the router and the dashboard's helpers). Prepress and the
 * press open only the works' screens, never the dashboard, so the works
 * publishes the SMALLEST HOST THE PANELS DRAW WITH, under the same names:
 *
 *   - the parts the two panels draw (a card, a stack, a grid, a list of
 *     facts, a status pill, a button, an empty state, a segmented control),
 *     drawn with the works' own classes;
 *   - the data kit's reads and writes of the add-on's own tables
 *     (`useRecords`, `useRecord`, `useRead`, `useWrite`, `useUpload`) over
 *     the works' door: the same data and files routes the dashboard's kit
 *     calls, as the person signed in, by the add-on's short table names (the
 *     staff config says their real names), so their role's grants and limits
 *     hold every one;
 *   - the helpers: the add-on's own words in the reader's language, the
 *     studio's toasts, a few icons by their lucide names, the reader's
 *     language tag.
 *
 * Every other name the dashboard publishes is left out: a panel that reads
 * one only reads it, and draws nothing with it. The panel's words, its
 * drawings and how it makes a proof and the files are its own, unchanged.
 *
 * Its own utility classes (`flex`, `gap-2`, `text-fg-muted`) are the
 * dashboard's: `panels.css` gives the ones the panels use, inside the sheet.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ComponentType, type MouseEvent, type ReactNode } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Box, Download, FileCode2, FileDown, FileText, Image, LockKeyhole, TriangleAlert, type LucideIcon } from "lucide-react";

import type { PanelDoor, PanelList } from "../door.ts";
import { toast } from "../store.ts";
import type { Id, Row } from "../wire.ts";

/** The version of the host API and of the data kit the panels are built against. */
const HOST_API = 1;
const DATA_KIT = 1;

// ── whose panel this is ──────────────────────────────────────────────────────

export interface PanelScope {
  door: PanelDoor;
  /** The add-on whose tables the short names mean. */
  addOn: string;
  /** The reader's language, as the works' screens speak it. */
  locale: string;
}

interface ScopeValue extends PanelScope {
  /** Moves on after every write: every read of the panel is read again, as the dashboard's kit refreshes its queries. */
  epoch: number;
  wrote: () => void;
}

const Scope = createContext<ScopeValue | null>(null);

/** The reader's language for the add-on's words: set while a panel is drawn, read by its translator. */
let speaking = "en-US";

/** Around a panel: its door, its add-on and the reader's language. */
export function PanelScopeProvider({ scope, children }: { scope: PanelScope; children: ReactNode }) {
  const [epoch, setEpoch] = useState(0);
  const wrote = useCallback(() => setEpoch((n) => n + 1), []);
  speaking = scope.locale;
  const value = useMemo(() => ({ ...scope, epoch, wrote }), [scope, epoch, wrote]);
  return <Scope.Provider value={value}>{children}</Scope.Provider>;
}

function useScope(): ScopeValue {
  const scope = useContext(Scope);
  if (scope === null) throw new Error("A panel's data hooks are read inside the works' panel sheet only.");
  return scope;
}

// ── refusals ─────────────────────────────────────────────────────────────────

export interface DataError {
  code: string;
  message: string;
  details?: Readonly<Record<string, unknown>>;
}

/** A refusal as a panel reads it: the server's code, its words, what it said beside. */
export function dataError(caught: unknown): DataError {
  if (typeof caught === "object" && caught !== null && typeof (caught as { code?: unknown }).code === "string") {
    const error = caught as { code: string; message?: unknown; details?: unknown };
    return {
      code: error.code,
      message: typeof error.message === "string" ? error.message : "",
      ...(typeof error.details === "object" && error.details !== null ? { details: error.details as Record<string, unknown> } : {}),
    };
  }
  return { code: "CLIENT_ERROR", message: caught instanceof Error ? caught.message : String(caught) };
}

// ── reading ──────────────────────────────────────────────────────────────────

interface Filter {
  column: string;
  op: string;
  value?: unknown;
}

export interface RecordsOptions {
  filter?: readonly Filter[];
  sort?: readonly { column: string; direction: "asc" | "desc" }[];
  columns?: readonly string[];
  page?: number;
  pageSize?: number;
  enabled?: boolean;
}

const DEFAULT_PAGE = 50;
/** One short of the data routes' ceiling: a list reads one row more than a page to know whether another follows. */
const MAX_PAGE = 199;

/** One filter as the list route's condition, as the dashboard's kit writes it. */
function condition(filter: Filter): Record<string, unknown> {
  const { column, op, value } = filter;
  if (op === "empty") return { column, op: "is_null" };
  if (op === "notEmpty") return { column, op: "not_null" };
  // A typed `%` or `_` is the character, not a wildcard.
  if (op === "contains") return { column, op: "ilike", value: `%${String(value ?? "").replace(/[\\%_]/g, (hit) => `\\${hit}`)}%` };
  return { column, op, value };
}

/** A kit list as the data routes' query: one row more than the page. */
export function listQuery(options: RecordsOptions): { query: PanelList; pageSize: number } {
  const pageSize = Math.min(Math.max(Math.trunc(options.pageSize ?? DEFAULT_PAGE), 1), MAX_PAGE);
  const page = Math.max(Math.trunc(options.page ?? 1), 1);
  const conditions = (options.filter ?? []).map(condition);
  return {
    pageSize,
    query: {
      ...(conditions.length === 0 ? {} : { where: conditions.length === 1 ? conditions[0] : { and: conditions } }),
      ...(options.sort === undefined || options.sort.length === 0 ? {} : { order: options.sort.map((s) => `${s.column}.${s.direction}`).join(",") }),
      ...(options.columns === undefined ? {} : { select: options.columns }),
      limit: pageSize + 1,
      offset: (page - 1) * pageSize,
    },
  };
}

/** A read as the panel holds it: the last answer kept while the next is on its way. */
function useAsk<T>(key: string | null, ask: () => Promise<T>, empty: T): { value: T; loading: boolean; error: DataError | null; refetch: () => void } {
  const { epoch } = useScope();
  const [state, setState] = useState<{ key: string | null; value: T; error: DataError | null; done: boolean }>({ key: null, value: empty, error: null, done: false });
  const [again, setAgain] = useState(0);
  const latest = useRef(ask);
  latest.current = ask;
  useEffect(() => {
    if (key === null) return;
    let live = true;
    latest.current().then(
      (value) => live && setState({ key, value, error: null, done: true }),
      (caught: unknown) => live && setState((s) => ({ key, value: s.value, error: dataError(caught), done: true })),
    );
    return () => {
      live = false;
    };
  }, [key, epoch, again]);
  const refetch = useCallback(() => setAgain((n) => n + 1), []);
  if (key === null) return { value: empty, loading: false, error: null, refetch };
  return { value: state.value, loading: !state.done || state.key !== key, error: state.key === key ? state.error : null, refetch };
}

const NO_ROWS: Row[] = [];

export function useRecords(table: string, options: RecordsOptions = {}) {
  const { door, addOn } = useScope();
  const { query, pageSize } = listQuery(options);
  const key = options.enabled === false ? null : JSON.stringify([table, query]);
  const asked = useAsk(key, () => door.list(addOn, table, query), NO_ROWS);
  const rows = asked.value;
  return { rows: rows.length > pageSize ? rows.slice(0, pageSize) : rows, hasMore: rows.length > pageSize, loading: asked.loading, error: asked.error, refetch: asked.refetch };
}

export function useRecord(table: string, key: Id | null) {
  const { door, addOn } = useScope();
  const asked = useAsk<Row | null>(key === null ? null : JSON.stringify([table, String(key)]), () => door.get(addOn, table, key!), null);
  return { row: key === null ? null : asked.value, loading: asked.loading, error: asked.error, refetch: asked.refetch };
}

/**
 * What the reader may do with the add-on's tables (`useAccess`), as Adminium
 * said it in the staff config. Where it did not say, every right is taken as
 * held, and the server still refuses what it refuses.
 */
export function useAccess() {
  const { door, addOn } = useScope();
  return useMemo(() => {
    const may = (table: string, action: "read" | "create" | "update") => {
      const held = door.access(addOn, table);
      return held === null || held.includes(action);
    };
    return {
      ready: true,
      canRead: (table: string) => may(table, "read"),
      canCreate: (table: string) => may(table, "create"),
      canUpdate: (table: string) => may(table, "update"),
      canMove: () => false,
      has: () => false,
      currency: null,
    };
  }, [door, addOn]);
}

export function useRead() {
  const { door, addOn } = useScope();
  return useMemo(
    () => ({
      list: async (table: string, options: RecordsOptions = {}) => {
        const { query, pageSize } = listQuery(options);
        const rows = await door.list(addOn, table, query);
        return { rows: rows.length > pageSize ? rows.slice(0, pageSize) : rows, hasMore: rows.length > pageSize };
      },
      get: (table: string, key: Id) => door.get(addOn, table, key),
    }),
    [door, addOn],
  );
}

// ── writing ──────────────────────────────────────────────────────────────────

/** How many writes are on, the last refusal, and every read of the panel read again after each (refused or not). */
function useRunner() {
  const { wrote } = useScope();
  const [running, setRunning] = useState(0);
  const [error, setError] = useState<DataError | null>(null);
  const run = useCallback(
    async <T,>(call: () => Promise<T>): Promise<T> => {
      setRunning((n) => n + 1);
      setError(null);
      try {
        return await call();
      } catch (caught) {
        setError(dataError(caught));
        throw caught;
      } finally {
        setRunning((n) => n - 1);
        wrote();
      }
    },
    [wrote],
  );
  return { run, saving: running > 0, error };
}

const written = (reply: { data: Row; postings?: unknown[] }) => ({ row: reply.data, ...(reply.postings === undefined || reply.postings.length === 0 ? {} : { postings: reply.postings }) });

export function useWrite(table: string) {
  const { door, addOn } = useScope();
  const { run, saving, error } = useRunner();
  return useMemo(() => {
    /** Row by row, one save each, as the one-by-one route answers: a refusal marks its row and the rest still run. */
    const each = async <T,>(items: readonly T[], keyOf: (item: T, index: number) => string, save: (item: T) => Promise<{ data: Row; postings?: unknown[] }>) => {
      const out: Record<string, unknown>[] = [];
      for (const [index, item] of items.entries()) {
        try {
          const reply = await save(item);
          out.push({ key: String(reply.data["id"] ?? keyOf(item, index)), ok: true, ...written(reply) });
        } catch (caught) {
          out.push({ key: keyOf(item, index), ok: false, error: dataError(caught) });
        }
      }
      return out;
    };
    return {
      create: (values: Record<string, unknown>) => run(async () => written(await door.create(addOn, table, values))),
      update: (key: Id, values: Record<string, unknown>) => run(async () => written(await door.update(addOn, table, key, values))),
      remove: (key: Id) => run(() => door.remove(addOn, table, key)),
      updateEach: (keys: readonly Id[], values: Record<string, unknown>) => run(() => each(keys, (key) => String(key), (key) => door.update(addOn, table, key, values))),
      createEach: (rows: readonly Record<string, unknown>[]) => run(() => each(rows, (_row, index) => String(index), (row) => door.create(addOn, table, row))),
      saving,
      error,
    };
  }, [door, addOn, table, run, saving, error]);
}

export function useUpload(table: string, column: string) {
  const { door, addOn } = useScope();
  const { run, saving, error } = useRunner();
  return useMemo(
    () => ({
      upload: (key: Id, file: Blob, options?: { name?: string }) =>
        run(async () => {
          const name = options?.name ?? (typeof File !== "undefined" && file instanceof File ? file.name : "");
          if (name === "") throw new Error("A file sent without a name needs one: pass { name }.");
          return door.upload(addOn, table, column, key, file, name);
        }),
      uploading: saving,
      error,
    }),
    [door, addOn, table, column, run, saving, error],
  );
}

// ── the add-on's words ───────────────────────────────────────────────────────

type Bundles = Readonly<Record<string, Readonly<Record<string, string>>>>;

/** The end of the brace that opens at `from`, braces inside counted. */
function closing(text: string, from: number): number {
  let depth = 0;
  for (let i = from; i < text.length; i += 1) {
    if (text[i] === "{") depth += 1;
    else if (text[i] === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * A message with its values: `{name}`, and `{n, plural, one {# file} other {# files}}`
 * (an `=0` case first, then the reader's plural category, then `other`), as
 * the add-on writes its words for the dashboard.
 */
export function formatMessage(template: string, vars: Readonly<Record<string, unknown>> = {}, locale = "en-US"): string {
  let out = "";
  let i = 0;
  while (i < template.length) {
    const open = template.indexOf("{", i);
    if (open === -1) {
      out += template.slice(i);
      break;
    }
    out += template.slice(i, open);
    const end = closing(template, open);
    if (end === -1) {
      out += template.slice(open);
      break;
    }
    const inner = template.slice(open + 1, end);
    const plural = /^\s*(\w+)\s*,\s*plural\s*,(.*)$/s.exec(inner);
    if (plural === null) {
      const name = inner.trim();
      out += vars[name] === undefined ? `{${inner}}` : String(vars[name]);
    } else {
      const name = plural[1]!;
      const n = Number(vars[name]);
      const cases = new Map<string, string>();
      const body = plural[2]!;
      let at = 0;
      while (at < body.length) {
        const brace = body.indexOf("{", at);
        if (brace === -1) break;
        const label = body.slice(at, brace).trim();
        const stop = closing(body, brace);
        if (stop === -1) break;
        cases.set(label, body.slice(brace + 1, stop));
        at = stop + 1;
      }
      const category = Number.isFinite(n) ? new Intl.PluralRules(locale).select(n) : "other";
      const chosen = cases.get(`=${String(n)}`) ?? cases.get(category) ?? cases.get("other") ?? "";
      out += formatMessage(chosen.replace(/#/g, Number.isFinite(n) ? new Intl.NumberFormat(locale).format(n) : String(vars[name] ?? "")), vars, locale);
    }
    i = end + 1;
  }
  return out;
}

/** The add-on's words, every language it ships: a translator in the reader's language, English where it has none. */
export function registerMessages(_addOn: string, bundles: Bundles) {
  return (key: string, fallback: string, vars?: Readonly<Record<string, unknown>>): string => {
    const words = bundles[speaking]?.[key] ?? bundles["en-US"]?.[key] ?? fallback;
    return formatMessage(words, vars, speaking);
  };
}

/** The reader's language tag, as the works' screens speak it. */
export function useLocaleTag(): string {
  return useScope().locale;
}

/** The works' toasts, as a panel pushes one. */
export function useAppToasts() {
  return useMemo(() => ({ push: (entry: { variant?: string; title: string }) => toast(entry.title, entry.variant === "error" ? "danger" : entry.variant === "warning" ? "warn" : "pos") }), []);
}

// ── icons ────────────────────────────────────────────────────────────────────

/** The icons the two panels ask for by their lucide names; any other draws nothing. */
const ICONS: Readonly<Record<string, LucideIcon>> = {
  "arrow-down": ArrowDown,
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  "arrow-up": ArrowUp,
  box: Box,
  download: Download,
  "file-code-2": FileCode2,
  "file-down": FileDown,
  "file-text": FileText,
  image: Image,
  "lock-keyhole": LockKeyhole,
  "triangle-alert": TriangleAlert,
};
const Nothing: ComponentType = () => null;

export function lucideByName(name: string): ComponentType<{ size?: number; className?: string }> {
  const Found = ICONS[name];
  if (Found === undefined) return Nothing;
  return function PanelIcon(props: { size?: number; className?: string }) {
    return <Found size={props.size ?? 15} aria-hidden="true" focusable="false" {...(props.className === undefined ? {} : { className: props.className })} />;
  };
}

// ── the parts ────────────────────────────────────────────────────────────────

type Tone = "neutral" | "accent" | "pos" | "warn" | "danger" | "info";

function Button({ variant = "secondary", size = "md", type = "button", loading = false, disabled, onClick, iconLeft, children, ...rest }: { variant?: string; size?: string; type?: "button" | "submit"; loading?: boolean; disabled?: boolean; onClick?: (event: MouseEvent<HTMLButtonElement>) => void; iconLeft?: ReactNode; children?: ReactNode; "aria-label"?: string }) {
  const kind = variant === "primary" ? " wk-btn--primary" : variant === "destructive" ? " wk-btn--danger" : variant === "link" || variant === "ghost" ? " wk-btn--link" : "";
  return (
    <button type={type} className={`wk-btn${kind}${size === "sm" ? " wk-btn--small" : ""}`} disabled={disabled === true || loading} aria-busy={loading || undefined} onClick={onClick} aria-label={rest["aria-label"]}>
      {iconLeft}
      {children}
    </button>
  );
}

function IconButton({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick?: (event: MouseEvent<HTMLButtonElement>) => void; children?: ReactNode }) {
  return (
    <button type="button" className="wk-btn wk-btn--small" aria-label={label} title={label} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

function EmptyState({ title, body, actions }: { title: ReactNode; body?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="wk-empty">
      <p className="wk-empty-title">{title}</p>
      {body !== undefined && <p className="wk-cz-body">{body}</p>}
      {actions !== undefined && <div className="wk-cz-actions">{actions}</div>}
    </div>
  );
}

function Spinner({ label }: { label?: string }) {
  return (
    <span className="wk-cz-spinner" role="status">
      {label ?? ""}
    </span>
  );
}

function SegmentedControl({ options, value, onValueChange, disabled, ...rest }: { options: readonly { value: string; label: ReactNode }[]; value: string; onValueChange: (value: string) => void; disabled?: boolean; "aria-label"?: string }) {
  return (
    <div className="wk-cz-segments" role="radiogroup" aria-label={rest["aria-label"]}>
      {options.map((option) => (
        <button key={option.value} type="button" role="radio" aria-checked={option.value === value} className="wk-cz-segment" disabled={disabled} onClick={() => onValueChange(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Alert({ tone = "info", title, body, action, role = "status" }: { tone?: string; title: ReactNode; body?: ReactNode; action?: ReactNode; role?: "alert" | "status" }) {
  return (
    <div className="wk-cz-alert" data-tone={tone} role={role}>
      <strong>{title}</strong>
      {body !== undefined && <span>{body}</span>}
      {action}
    </div>
  );
}

function Pill({ tone = "neutral", children }: { tone?: Tone; children?: ReactNode }) {
  return (
    <span className="wk-cz-pill" data-tone={tone}>
      {children}
    </span>
  );
}

function StatusPill({ tone = "neutral", children }: { status?: string; tone?: Tone; children?: ReactNode }) {
  return <Pill tone={tone}>{children}</Pill>;
}

function Card({ title, description, actions, children }: { title?: ReactNode; description?: ReactNode; actions?: ReactNode; padded?: boolean; children?: ReactNode }) {
  return (
    <section className="wk-cz-card">
      {(title !== undefined || actions !== undefined) && (
        <div className="wk-cz-card-head">
          <div className="wk-cz-card-titles">
            {title !== undefined && <h3 className="wk-cz-card-title">{title}</h3>}
            {description !== undefined && <span className="wk-cz-card-sub">{description}</span>}
          </div>
          {actions}
        </div>
      )}
      <div className="wk-cz-card-body">{children}</div>
    </section>
  );
}

function Stack({ direction = "column", gap = "md", align, justify, wrap, children }: { direction?: "column" | "row"; gap?: string; align?: string; justify?: string; wrap?: boolean; children?: ReactNode }) {
  return (
    <div className="wk-cz-stack" data-direction={direction} data-gap={gap} data-align={align} data-justify={justify} data-wrap={wrap === true ? "" : undefined}>
      {children}
    </div>
  );
}

function Grid({ columns = 2, gap = "md", children }: { columns?: number; gap?: string; aside?: ReactNode; children?: ReactNode }) {
  return (
    <div className="wk-cz-grid" data-columns={String(columns)} data-gap={gap}>
      {children}
    </div>
  );
}

function KeyValueList({ items }: { items: readonly { label: ReactNode; value: ReactNode; mono?: boolean }[] }) {
  return (
    <dl className="wk-cz-facts">
      {items.map((item, index) => (
        <div key={index} className="wk-cz-fact">
          <dt>{item.label}</dt>
          <dd className={item.mono === true ? "wk-mono" : undefined}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function MonoText({ children }: { children?: ReactNode }) {
  return <span className="wk-mono wk-cz-small">{children}</span>;
}

/** A way to one of the add-on's dashboard pages: opened in the dashboard, which the works' screens sit in or beside. */
function Link({ to, children }: { to: string; children?: ReactNode }) {
  return (
    <a className="wk-btn wk-btn--link" href={to} target="_top">
      {children}
    </a>
  );
}

function Divider() {
  return <hr className="wk-cz-divider" />;
}

function Skeleton() {
  return <span className="wk-cz-skeleton" aria-hidden="true" />;
}

// ── the host, as a panel reads it ────────────────────────────────────────────

/** `en_US` as `en-US`. */
const tagForLocale = (id: string): string => id.replace("_", "-");

/** The host API published for the panels (see the header), on the global beside React. */
export const PANEL_HOST = Object.freeze({
  version: HOST_API,
  ui: Object.freeze({ Alert, Badge: Pill, Button, EmptyState, IconButton, SegmentedControl, Spinner, Tag: Pill }),
  data: Object.freeze({
    version: DATA_KIT,
    Card,
    Grid,
    Stack,
    Divider,
    Skeleton,
    KeyValueList,
    StatusPill,
    MonoText,
    Link,
    useRecords,
    useRecord,
    useRead,
    useWrite,
    useUpload,
    useAccess,
  }),
  router: Object.freeze({
    // The panels move nowhere by themselves; a way to a page is a link (`Link`).
    useNavigate: () => () => undefined,
    useParams: () => ({}),
    useSearch: () => ({}),
    useBlocker: () => undefined,
  }),
  query: Object.freeze({}),
  i18n: Object.freeze({ tagForLocale }),
  app: Object.freeze({
    lucideByName,
    registerMessages,
    t: (_key: string, fallback: string, vars?: Readonly<Record<string, unknown>>) => formatMessage(fallback, vars, speaking),
    useLocaleTag,
    useAppToasts,
  }),
});
