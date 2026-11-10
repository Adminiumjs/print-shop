/**
 * The contract's Adminium: the BUILT server of an Adminium checkout
 * (`ADMINIUM_REPO`), booted by its own e2e script on one engine, with this
 * repo's own `manifest.json` and samples packed as an operator would upload
 * them, and the Customiser it requires packed from a built add-ons checkout
 * (`ADD_ONS_REPO`).
 *
 * Everything is spoken over HTTP, as the dashboard and a client's page speak
 * it: nothing here reaches into the server's modules.
 *
 * Tests only; nothing that ships imports it.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

export type Engine = "sqlite" | "postgres" | "mysql";

const REPO = fileURLToPath(new URL("../..", import.meta.url));
const read = (path: string) => readFileSync(path, "utf8");

// ── what the contract needs, and whether it is here ─────────────────────────

export const ADMINIUM_REPO = process.env["ADMINIUM_REPO"] ?? "";
export const ADD_ONS_REPO = process.env["ADD_ONS_REPO"] ?? join(REPO, "..", "add-ons");
const E2E_SERVER = join(ADMINIUM_REPO, "apps", "e2e", "scripts", "e2e-server.mjs");
/** An add-on's package in the add-ons checkout, by its key. */
const addOnDir = (key: string) => join(ADD_ONS_REPO, "packages", key);

/** Why the contract cannot run here, or null when it can. */
export function missing(): string | null {
  // It boots servers: asked for, never a side effect of the ordinary suite.
  if (process.env["CONTRACT"] !== "1" && process.env["ADMINIUM_REQUIRE_CONTRACT"] !== "1") return "set CONTRACT=1 to run it";
  if (ADMINIUM_REPO === "") return "ADMINIUM_REPO is not set";
  if (!existsSync(join(ADMINIUM_REPO, "apps", "server", "dist", "app.js"))) return `no built server in ${ADMINIUM_REPO} (pnpm turbo run build --filter=@adminium/e2e...)`;
  if (!existsSync(join(ADMINIUM_REPO, "apps", "dashboard", "dist", "index.html"))) return `no built dashboard in ${ADMINIUM_REPO}`;
  if (!existsSync(E2E_SERVER)) return `no e2e server script in ${ADMINIUM_REPO}`;
  return null;
}

/** Why the checks that need an add-on cannot run here, or null when they can: its build has every file its manifest names. */
export function missingAddOn(key = "customiser"): string | null {
  const dir = addOnDir(key);
  if (!existsSync(join(dir, "manifest.json"))) return `no ${key} add-on in ${ADD_ONS_REPO}`;
  const manifest = JSON.parse(read(join(dir, "manifest.json"))) as { addOn?: { slots?: { client?: string }[] } };
  // Its screens; and a renderer's server half, which the host loads by its place in the package.
  const built = [...(manifest.addOn?.slots ?? []).map((s) => s.client), ...(existsSync(join(dir, "src", "server.ts")) ? ["dist/server.js"] : [])].filter((f): f is string => typeof f === "string");
  const absent = built.find((file) => !existsSync(join(dir, file)));
  return absent === undefined && existsSync(join(dir, "dist")) ? null : `no built ${key} add-on in ${ADD_ONS_REPO}`;
}

/** `CONTRACT_ENGINES=postgres,mysql` runs only those (a machine with few free ports runs them one at a time). */
const ONLY = (process.env["CONTRACT_ENGINES"] ?? "").split(",").map((e) => e.trim()).filter((e) => e !== "");
const wanted = (engine: Engine) => ONLY.length === 0 || ONLY.includes(engine);

/** The engines this run can reach: SQLite always, the others with their URLs. */
export const ENGINES: [Engine, boolean][] = [
  ["sqlite", wanted("sqlite")],
  ["postgres", wanted("postgres") && (process.env["TEST_POSTGRES_URL"] ?? "") !== ""],
  ["mysql", wanted("mysql") && (process.env["TEST_MYSQL_URL"] ?? "") !== ""],
];

// ── the packages, as an operator uploads them ───────────────────────────────

const BLOCK = 512;

/** An npm-shaped tarball (`package/…` members), which is what the server's hardened unpacker reads. */
function tarball(files: Record<string, Buffer>): Buffer {
  const members: Buffer[] = [];
  const put = (block: Buffer, at: number, length: number, value: string) => Buffer.from(value, "latin1").subarray(0, length).copy(block, at);
  for (const [path, body] of Object.entries(files)) {
    const header = Buffer.alloc(BLOCK);
    put(header, 0, 100, `package/${path}`);
    put(header, 100, 8, "0000644\0");
    put(header, 124, 12, `${body.length.toString(8).padStart(11, "0")}\0`);
    put(header, 136, 12, "00000000000\0");
    put(header, 156, 1, "0");
    put(header, 257, 6, "ustar\0");
    put(header, 263, 2, "00");
    header.fill(0x20, 148, 156);
    let sum = 0;
    for (const byte of header) sum += byte;
    put(header, 148, 8, `${sum.toString(8).padStart(6, "0")}\0 `);
    members.push(header, body, Buffer.alloc((BLOCK - (body.length % BLOCK)) % BLOCK));
  }
  members.push(Buffer.alloc(BLOCK * 2));
  return gzipSync(Buffer.concat(members), { mtime: 0 } as never);
}

export interface Bundle {
  buffer: Buffer;
  integrity: string;
}

const bundle = (files: Record<string, Buffer>): Bundle => {
  const buffer = tarball(files);
  return { buffer, integrity: `sha512-${createHash("sha512").update(buffer).digest("base64")}` };
};

/**
 * The version the app asks of an add-on (`addOns.requires[].range` `>=x.y.z`), and the
 * version the checkout carries.
 */
export function addOnVersions(key = "customiser"): { floor: string | null; checkout: string } {
  const app = JSON.parse(read(join(REPO, "manifest.json"))) as { addOns?: { requires?: { key: string; range: string }[]; suggests?: { key: string; range: string }[] } };
  const range = [...(app.addOns?.requires ?? []), ...(app.addOns?.suggests ?? [])].find((r) => r.key === key)?.range ?? "";
  // `>=1.0.16` or `^1.0.16`: either way the release named is the floor.
  const floor = /^(?:>=|\^)\s*(\d+\.\d+\.\d+)$/.exec(range.trim())?.[1] ?? null;
  const checkout = (JSON.parse(read(join(addOnDir(key), "manifest.json"))) as { version: string }).version;
  return { floor, checkout };
}

const newer = (a: string, b: string) => {
  const [x, y] = [a, b].map((v) => v.split(".").map(Number));
  for (let i = 0; i < 3; i += 1) if (x![i] !== y![i]) return x![i]! > y![i]!;
  return false;
};

/**
 * The version the add-on is packed as. The checkout is the next release of the
 * add-on BEFORE its release bumps the number (the add-ons repo stamps it when
 * it releases), so when the app already asks for that next number, the
 * checkout is packed as it — a rehearsal of the release, said in the test's
 * name — rather than failing on a number nobody has stamped yet.
 */
export function packedAddOnVersion(key = "customiser"): { version: string; rehearsed: boolean } {
  const { floor, checkout } = addOnVersions(key);
  if (floor !== null && newer(floor, checkout)) return { version: floor, rehearsed: true };
  return { version: checkout, rehearsed: false };
}

/** An add-on, packed as its release packs it: `files[]`, the name rewritten, no dev-only fields. */
export function addOnBundle(key = "customiser"): Bundle & { key: string; version: string } {
  const dir = addOnDir(key);
  const pkg = JSON.parse(read(join(dir, "package.json"))) as Record<string, unknown> & { name: string; version: string; files: string[] };
  const files: Record<string, Buffer> = {};
  const add = (path: string) => {
    const absolute = join(dir, path);
    if (!existsSync(absolute)) return;
    if (statSync(absolute).isDirectory()) {
      for (const name of readdirSync(absolute)) add(join(path, name));
      return;
    }
    files[relative(dir, absolute).split("\\").join("/")] = readFileSync(absolute);
  };
  for (const entry of pkg.files) add(entry);
  const { version } = packedAddOnVersion(key);
  const { devDependencies: _dev, scripts: _scripts, ...shipped } = pkg;
  files["package.json"] = Buffer.from(JSON.stringify({ ...shipped, name: pkg.name.replace(/^@adminium\//, "@adminiumjs/"), version }));
  const manifest = JSON.parse(read(join(dir, "manifest.json"))) as { key: string; version: string };
  files["manifest.json"] = Buffer.from(JSON.stringify({ ...manifest, version }));
  return { ...bundle(files), key: manifest.key, version };
}

/** Every file under a directory, by its path below it. */
function filesUnder(root: string, into: string, files: Record<string, Buffer>): void {
  for (const name of readdirSync(root)) {
    const absolute = join(root, name);
    if (statSync(absolute).isDirectory()) filesUnder(absolute, `${into}${name}/`, files);
    else files[`${into}${name}`] = readFileSync(absolute);
  }
}

/**
 * An app package: this repo's manifest and sample (or another app's, given),
 * and a page for each side — a placeholder page, or with `built: true` the
 * surfaces `npm run build:surface` made (`dist-surface/<key>/<side>`), as a
 * release packs them: what a browser test opens.
 */
export function appBundle(options: { built?: boolean; manifest?: string; sample?: string; seeds?: string } = {}): Bundle & { key: string; version: string } {
  const text = options.manifest ?? read(join(REPO, "manifest.json"));
  const manifest = JSON.parse(text) as { key: string; version: string; sampleData?: { file: string; addOns?: Record<string, { file: string }> } };
  const files: Record<string, Buffer> = {
    "package.json": Buffer.from(JSON.stringify({ name: `@adminiumjs/app-${manifest.key}`, version: manifest.version })),
    "manifest.json": Buffer.from(text),
  };
  for (const side of ["staff", "customer"]) {
    const built = join(REPO, "dist-surface", manifest.key, side);
    if (options.built !== true) files[`${side}/index.html`] = Buffer.from(`<!doctype html><html><body data-app="${manifest.key}-${side}"></body></html>`);
    else if (!existsSync(join(built, "index.html"))) throw new Error(`no built ${side} surface in ${built} — run \`npm run build:surface\` first`);
    else filesUnder(built, `${side}/`, files);
  }
  // Another app's manifest brings its own sample (`sample`); this repo's is read from its file, or from the folder a
  // release's own files are kept in (`seeds`: an older release installed as it shipped, each file by its name).
  const seed = (file: string) => readFileSync(options.seeds === undefined ? join(REPO, file) : join(options.seeds, file.replace(/^seeds\//, "")));
  if (manifest.sampleData !== undefined) files[manifest.sampleData.file] = options.sample !== undefined ? Buffer.from(options.sample) : seed(manifest.sampleData.file);
  // …and the rows it adds to an add-on's tables, one file for each add-on.
  // (this repo's own, also when its manifest is written for another floor; never another app's).
  if (options.sample === undefined) for (const section of Object.values(manifest.sampleData?.addOns ?? {})) files[section.file] = seed(section.file);
  return { ...bundle(files), key: manifest.key, version: manifest.version };
}

// ── the server ──────────────────────────────────────────────────────────────

export interface Server {
  base: string;
  sink: string;
  /** What the server has said so far (its log), for a failure to show. */
  log(): string;
  /** Set the server's clock to `at` (epoch ms); it runs on from there, or with `still` stands at it until set again. */
  setClock(at: number, still?: boolean): Promise<void>;
  stop(): Promise<void>;
}

/**
 * The ports one engine's server takes: the server at `port`, its SMTP sink
 * and the sink's mailbox on the next two. The script's scripted LLM, which
 * nothing here calls, takes whatever port is free.
 */
export const PORTS_PER_ENGINE = 3;

/**
 * Boot the built Adminium on one engine, its clock starting at `now`; resolves once it serves.
 * `database` names the Postgres/MySQL database the run owns (dropped and made again at boot).
 */
export interface BootOptions {
  database?: string;
  /** The built Adminium checkout to run (default `ADMINIUM_REPO`). */
  adminium?: string;

}

export async function boot(engine: Engine, port: number, now: number, options: BootOptions = {}): Promise<Server> {
  const clockFile = join(tmpdir(), `printing-contract-clock-${String(port)}`);
  const checkout = options.adminium ?? ADMINIUM_REPO;
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    // An add-on packed from a checkout has no catalogue to vouch for its bytes:
    // a developer's server runs it by name. Ignored in production.
    ADMINIUM_ADD_ON_DEV_TRUST: "customiser,holiday-calendars,shipping-dhl",
    E2E_ENGINE: engine,
    E2E_PORT: String(port),
    E2E_SMTP_PORT: String(port + 1),
    E2E_SINK_PORT: String(port + 2),
    E2E_FAKE_LLM_PORT: "0",
    // Its own database, so a contract never meets another run's rows (`CONTRACT_DB_SUFFIX` keeps two checkouts' runs apart).
    E2E_DATABASE: options.database ?? `printing_contract_${engine}${process.env["CONTRACT_DB_SUFFIX"] ?? ""}`,
    CONTRACT_NOW: String(now),
    CONTRACT_CLOCK_FILE: clockFile,
    NODE_OPTIONS: [
      process.env["NODE_OPTIONS"] ?? "",
      `--import=${pathToFileURL(fileURLToPath(new URL("./clock.mjs", import.meta.url))).href}`,
      // A checkout built before its version was moved, run as the release it becomes (`release.ts`).
      ...(process.env["CONTRACT_ENGINE_RELEASE"] === undefined ? [] : [`--import=${pathToFileURL(fileURLToPath(new URL("./engine-release.mjs", import.meta.url))).href}`]),
    ]
      .join(" ")
      .trim(),
  };
  const script = join(checkout, "apps", "e2e", "scripts", "e2e-server.mjs");
  const child: ChildProcess = spawn(process.execPath, [script], { cwd: join(checkout, "apps", "e2e"), env, stdio: ["ignore", "pipe", "pipe"] });
  let log = "";
  child.stdout?.on("data", (chunk: Buffer) => (log += chunk.toString()));
  child.stderr?.on("data", (chunk: Buffer) => (log += chunk.toString()));
  const base = `http://127.0.0.1:${String(port)}`;
  const deadline = Date.now() + 180_000;
  for (;;) {
    if (child.exitCode !== null) throw new Error(`the ${engine} server exited:\n${log.slice(-4000)}`);
    try {
      const res = await fetch(`${base}/api/v1/healthz`);
      if (res.ok) break;
    } catch {
      // not listening yet
    }
    if (Date.now() > deadline) {
      child.kill("SIGKILL");
      throw new Error(`the ${engine} server never answered:\n${log.slice(-4000)}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return {
    base,
    sink: `http://127.0.0.1:${String(port + 2)}`,
    log: () => log,
    setClock: async (at, still = false) => {
      writeFileSync(clockFile, still ? `${String(at)} still` : String(at));
      child.kill("SIGUSR2");
      // The signal is handled on the server's next turn of its loop.
      await new Promise((resolve) => setTimeout(resolve, 300));
    },
    stop: () =>
      new Promise<void>((resolve) => {
        if (child.exitCode !== null) return resolve();
        child.once("exit", () => resolve());
        child.kill("SIGTERM");
        setTimeout(() => child.kill("SIGKILL"), 5_000);
      }),
  };
}

// ── speaking to it ──────────────────────────────────────────────────────────

export interface Reply<T = unknown> {
  status: number;
  body: T;
  code: string | undefined;
  details: Record<string, unknown>;
}

/** A caller: the operator (a session cookie) or a client's page (a browser key, a public session). */
export class Caller {
  private cookie = "";
  /** The session cookie(s) this caller holds, `name=value; …` — for a browser to carry the same session. */
  get cookies(): string {
    return this.cookie;
  }
  private csrf = "";
  readonly base: string;
  private readonly headers: Record<string, string>;
  constructor(base: string, headers: Record<string, string> = {}) {
    this.base = base;
    this.headers = headers;
  }

  async send<T = unknown>(method: string, path: string, body?: unknown, extra: Record<string, string> = {}): Promise<Reply<T>> {
    for (let attempt = 0; ; attempt += 1) {
      const res = await fetch(`${this.base}${path}`, {
        method,
        headers: {
          ...this.headers,
          ...(this.cookie === "" ? {} : { cookie: this.cookie }),
          // Node's fetch says `sec-fetch-mode`, so the server asks what a browser page is asked: the session's token.
          ...(this.csrf === "" || method === "GET" ? {} : { "x-adminium-csrf": this.csrf }),
          ...(body === undefined ? {} : Buffer.isBuffer(body) ? { "content-type": "application/octet-stream" } : { "content-type": "application/json" }),
          ...extra,
        },
        ...(body === undefined ? {} : { body: Buffer.isBuffer(body) ? new Uint8Array(body) : JSON.stringify(body) }),
      });
      const set = res.headers.getSetCookie?.() ?? [];
      if (set.length > 0) this.cookie = set.map((c) => c.split(";")[0]).join("; ");
      // A burst the rate limit refused is the limit's, not the contract's: wait it out.
      if (res.status === 429 && attempt < 6) {
        await new Promise((resolve) => setTimeout(resolve, 5_000));
        continue;
      }
      const text = await res.text();
      let parsed: unknown = text;
      try {
        parsed = text === "" ? null : JSON.parse(text);
      } catch {
        // not JSON
      }
      const error = (parsed as { error?: { code?: string; details?: Record<string, unknown> } } | null)?.error;
      return { status: res.status, body: parsed as T, code: error?.code, details: error?.details ?? {} };
    }
  }

  /** Sign in as the operator, and take the session's write token as the dashboard does. */
  async signIn(email: string, password: string): Promise<void> {
    ok(await this.post("/api/v1/auth/login", { email, password }));
    this.csrf = ok(await this.get<{ data: { csrfToken: string } }>("/api/v1/bootstrap")).data.csrfToken;
  }

  /** The session this caller holds, for a screen that speaks to the same server through its own transport. */
  session(): { cookie: string; csrfToken: string } {
    return { cookie: this.cookie, csrfToken: this.csrf };
  }

  /**
   * A `fetch` that goes to this server with this caller's session: what the
   * studio's own transport is handed, so its code runs unchanged against
   * the contract's Adminium.
   */
  fetchAs(): typeof fetch {
    return (async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (this.cookie !== "") headers.set("cookie", this.cookie);
      headers.set("origin", this.base);
      return fetch(new URL(String(input), this.base), { ...init, headers });
    }) as typeof fetch;
  }

  get = <T = unknown>(path: string, extra?: Record<string, string>) => this.send<T>("GET", path, undefined, extra);
  post = <T = unknown>(path: string, body?: unknown, extra?: Record<string, string>) => this.send<T>("POST", path, body ?? {}, extra);
  patch = <T = unknown>(path: string, body: unknown, extra?: Record<string, string>) => this.send<T>("PATCH", path, body, extra);
  put = <T = unknown>(path: string, body: unknown, extra?: Record<string, string>) => this.send<T>("PUT", path, body, extra);
}

/** Expect a status, and hand back the body. */
export function ok<T>(reply: Reply<T>, status = 200): T {
  if (reply.status !== status) throw new Error(`expected ${String(status)}, got ${String(reply.status)}: ${JSON.stringify(reply.body).slice(0, 1500)}`);
  return reply.body;
}

/** The nonce a human check asks for: sha256(salt + nonce) starting with that many zero bits. */
export function solve(salt: string, difficulty: number): string {
  for (let n = 0; ; n += 1) {
    const nonce = n.toString(36);
    const digest = createHash("sha256").update(`${salt}${nonce}`).digest();
    let bits = 0;
    for (const byte of digest) {
      if (byte === 0) {
        bits += 8;
        continue;
      }
      bits += Math.clz32(byte) - 24;
      break;
    }
    if (bits >= difficulty) return nonce;
  }
}

export const until = async <T>(read: () => Promise<T | undefined>, label: string, ms = 120_000): Promise<T> => {
  const deadline = Date.now() + ms;
  for (;;) {
    const found = await read();
    if (found !== undefined) return found;
    if (Date.now() > deadline) throw new Error(`waited ${String(ms / 1000)} s for ${label}`);
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
};
