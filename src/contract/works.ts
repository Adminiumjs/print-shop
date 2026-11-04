/**
 * Marlow Press on a built Adminium, for the contract tests: the works'
 * own empty database on one engine, the Customiser and the app installed as
 * an operator installs them, the sample added at the comps' pinned moment
 * (10:20 on Wednesday 5 August 2026 in Marlow), the public API on, and a
 * caller that speaks to it as the customer's page does (the surface's own
 * publishable key).
 *
 * The works' data go in a database of their own, made empty here, never the
 * e2e Northwind the server boots beside (an app's tables would meet
 * Northwind's own `products`, `orders` and `customers`).
 *
 * Tests only; nothing that ships imports it.
 */
import { execFileSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { addOnBundle, appBundle, boot, Caller, ok, until, type Engine, type Reply, type Server } from "./harness.ts";
import type { Catalogue } from "./parity-configs.ts";

export const ADMIN = { email: process.env["E2E_ADMIN_EMAIL"] ?? "e2e@adminium.local", password: process.env["E2E_ADMIN_PASSWORD"] ?? "adminium-e2e-password" };
/** 10:20 on Wednesday 5 August 2026 in Marlow (British Summer Time), before the two o'clock cut-off. */
export const WEDNESDAY = Date.parse("2026-08-05T09:20:00Z");

/** A database of the works' own on the engine, made empty; its DSN. */
export function emptyDatabase(engine: Engine, name: string): string {
  if (engine === "sqlite") {
    const file = join(tmpdir(), `${name}.db`);
    rmSync(file, { force: true });
    writeFileSync(file, "");
    return `sqlite:${file}`;
  }
  if (engine === "postgres") {
    const url = new URL(process.env["TEST_POSTGRES_URL"]!);
    execFileSync("psql", [url.href, "-q", "-c", `DROP DATABASE IF EXISTS ${name} WITH (FORCE)`, "-c", `CREATE DATABASE ${name}`], { stdio: "pipe" });
    url.pathname = `/${name}`;
    return url.href;
  }
  const url = new URL(process.env["TEST_MYSQL_URL"]!);
  const args = ["-h", url.hostname, "-P", url.port || "3306", "-u", decodeURIComponent(url.username), ...(url.password === "" ? [] : [`-p${decodeURIComponent(url.password)}`])];
  execFileSync("mysql", [...args, "-e", `DROP DATABASE IF EXISTS \`${name}\`; CREATE DATABASE \`${name}\``], { stdio: "pipe" });
  url.pathname = `/${name}`;
  return url.href;
}

export interface Works {
  server: Server;
  staff: Caller;
  /** The customer's page: the surface's publishable key, from the surface's own origin. */
  page: Caller;
  connectionId: string;
  /** A public entry's rows, every page of them. */
  read(ref: string): Promise<Row[]>;
  /** A staff read of one of the app's tables, every row. */
  rows(table: string): Promise<Row[]>;
}
export type Row = Record<string, unknown>;

/**
 * Boot, install, add the sample, open the shop. `database` names the run's
 * own databases (the e2e server's and the works'), kept apart per checkout by
 * `CONTRACT_DB_SUFFIX`.
 */
export async function openWorks(engine: Engine, port: number, database: string): Promise<Works> {
  const suffix = process.env["CONTRACT_DB_SUFFIX"] ?? "";
  const server = await boot(engine, port, WEDNESDAY - 60_000, { database: `${database}_e2e${suffix}` });
  try {
    const staff = new Caller(server.base, { origin: server.base });
    await staff.signIn(ADMIN.email, ADMIN.password);
    const dsn = emptyDatabase(engine, `${database}_works${suffix}`);
    const connectionId = ok(await staff.post<{ id: string }>("/api/v1/connections", { name: "marlow-press", engine, dsn }), 201).id;

    // The Customiser first, staged at the release the app asks for; then the app, with it ticked.
    const addOn = addOnBundle("customiser");
    const stagedAddOn = await staff.post(`/api/v1/add-ons/upload?expectedSha512=${encodeURIComponent(addOn.integrity)}`, addOn.buffer);
    if (![200, 201].includes(stagedAddOn.status)) throw new Error(`add-on upload: ${JSON.stringify(stagedAddOn.body).slice(0, 600)}`);
    const app = appBundle();
    const staged = await staff.post(`/api/v1/apps/upload?expectedSha512=${encodeURIComponent(app.integrity)}`, app.buffer);
    if (![200, 201].includes(staged.status)) throw new Error(`upload: ${JSON.stringify(staged.body).slice(0, 1500)}`);
    const body = { key: app.key, version: app.version, connectionId };
    const plan = ok(await staff.post<{ plan: { checksum: string; installable: boolean } }>("/api/v1/apps/plan", body)).plan;
    if (!plan.installable) throw new Error(`not installable: ${JSON.stringify(plan).slice(0, 3000)}`);
    const installed = ok(await staff.post<{ rules: { skipped: unknown[] } }>("/api/v1/apps/install", { ...body, planChecksum: plan.checksum, addOns: [{ key: addOn.key, version: addOn.version }] }));
    if (installed.rules.skipped.length > 0) throw new Error(`the install skipped rules: ${JSON.stringify(installed.rules.skipped).slice(0, 1500)}`);
    // The works' zone decides its two o'clock cut-off; its money is pounds.
    ok(await staff.patch(`/api/v1/connections/${connectionId}`, { timezone: "Europe/London", currency: "GBP" }));

    // The sample is written for 10:20 on the dot: the clock stands there while it goes in, then runs on.
    await server.setClock(WEDNESDAY, true);
    const { jobId } = ok(await staff.post<{ jobId: string }>(`/api/v1/apps/${app.key}/sample-data`));
    // The sample goes in as a job: wait for it to finish, and say why when it failed.
    const job = await until(async () => {
      const got = ok(await staff.get<Row>(`/api/v1/jobs/${jobId}`));
      const view = (got["data"] as Row | undefined) ?? got;
      return view["status"] === "succeeded" || view["status"] === "failed" || view["status"] === "cancelled" || view["lastError"] != null ? view : undefined;
    }, "the sample to be added");
    if (job["status"] !== "succeeded") throw new Error(`the sample was not added (${String(job["status"])}): ${String(job["lastError"]).slice(0, 3000)}`);
    await until(async () => (ok(await staff.get<{ loaded: boolean }>(`/api/v1/apps/${app.key}/sample-data`)).loaded ? true : undefined), "the sample to be added");
    await server.setClock(WEDNESDAY);
    ok(await staff.put("/api/v1/public-api", { enabled: true }));
    ok(await staff.put("/api/v1/settings/email", { publicOrigin: server.base }));

    const served = ok(await new Caller(server.base).get<{ publishableKey: string }>(`/apps/${app.key}/customer/surface-config.json`));
    const page = new Caller(server.base, { origin: server.base, authorization: `Bearer ${served.publishableKey}` });
    const read = async (ref: string): Promise<Row[]> => {
      const out: Row[] = [];
      for (let offset = 0; ; offset += 100) {
        const got = ok(await page.get<{ data: Row[] }>(`/api/v1/public/records/${ref}?limit=100&offset=${String(offset)}`)).data;
        out.push(...got);
        if (got.length < 100) return out;
      }
    };
    const rows = async (table: string): Promise<Row[]> => {
      const out: Row[] = [];
      for (let offset = 0; ; offset += 200) {
        const got = ok(await staff.get<{ data: Row[] }>(`/api/v1/data/${connectionId}/printing_${table}?limit=200&offset=${String(offset)}`)).data;
        out.push(...got);
        if (got.length < 200) return out;
      }
    };
    return { server, staff, page, connectionId, read, rows };
  } catch (error) {
    await server.stop();
    throw error;
  }
}

/** A customer's dry run of an order: the order's figures, and each line's. */
export interface Priced {
  order: Row;
  lines: Row[];
}

/** What a dry run of placing an order answers, or the refusal. */
export async function dryRun(page: Caller, values: Row, lines: Row[]): Promise<Reply<{ data: Row; children: { jobs: { data: Row }[] } }>> {
  return page.post(`/api/v1/public/records/printing_orders_verified_2/dry-run`, { values, children: { jobs: lines.map((line) => ({ values: line })) } });
}

export async function priced(page: Caller, values: Row, lines: Row[]): Promise<Priced> {
  const reply = ok(await dryRun(page, values, lines));
  return { order: reply.data, lines: reply.children.jobs.map((j) => j.data) };
}

/** The gap between two dry runs: a visitor reads 120 times a minute at most. */
export const PACE_MS = 600;
/** Where a delivered order goes: a dry run of a delivery asks for its address, as the save does. */
export const ADDRESS = { address_line1: "12 Quay Street", town: "Marlow", postcode: "SL7 1BT" };

/** The catalogue as the customer's page reads it: each product, option and packaging by its code. */
export async function readCatalogue(works: Works): Promise<Catalogue> {
  const [products, options, packaging] = await Promise.all([works.read("printing_products"), works.read("printing_options"), works.read("printing_packaging")]);
  const productId = (code: string) => products.find((p) => p["code"] === code)?.["id"];
  const found = <T>(value: T | undefined, what: string): T => {
    if (value === undefined) throw new Error(`the catalogue has no ${what}`);
    return value;
  };
  return {
    product: (code) => found(productId(code), `product ${code}`),
    option: (product, kind, code) => found(options.find((o) => o["product_id"] === productId(product) && o["kind"] === kind && o["code"] === code)?.["id"], `${kind} ${code} of ${product}`),
    packaging: (code) => found(packaging.find((p) => p["code"] === code)?.["id"], `packaging ${code}`),
  };
}
