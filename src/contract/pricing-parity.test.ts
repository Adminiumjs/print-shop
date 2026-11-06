/**
 * The parity check: Adminium prices Marlow Press's work as the old browser
 * code did, but for differences each of which is named.
 *
 * Marlow Press and the Customiser it requires are installed on a BUILT
 * Adminium (`ADMINIUM_REPO`, the core at 0.3.48) on each engine, SQLite,
 * Postgres and MySQL, with the sample added at the comps' pinned moment.
 * Then:
 *
 * - the sample prices itself: each of its fifteen jobs and two saved quotes
 *   comes to the comp's own quote of it (`JOB_FIGURES`), price and weight;
 * - two hundred jobs (`parityJobs`) are each priced by a dry run of a
 *   customer's order holding that one line, as the configurator asks it,
 *   and by the old browser code (`legacyQuote`): the line's price ex tax, its
 *   weight, the order's delivery (or none, quoted by hand), its tax and total.
 *   With every fix on, the old code comes to Adminium's figures to the penny
 *   on every job; and every job whose figures moved is moved by a fix named in
 *   `FIXES` (the four slips the plan found, or a place the old code had left
 *   the works' own rate card), each slip on at least one job.

 *
 * It runs with `CONTRACT=1` where a built Adminium and a built add-ons
 * checkout are (`TEST_POSTGRES_URL`, `TEST_MYSQL_URL` add those engines), and
 * says why it skipped otherwise.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { JOB_FIGURES } from "../sample/marlow-press.ts";
import { ENGINES, missing, missingAddOn, ok, PORTS_PER_ENGINE, type Engine } from "./harness.ts";
import { ALL_FIXES, FIXES, legacyQuote, SLIPS, type Fix, type LegacyQuote } from "./legacy-price.ts";
import { describeJob, parityJobs, toLegacy, toLine, type Catalogue, type Job } from "./parity-configs.ts";
import { ADDRESS, dryRun, openWorks, PACE_MS, readCatalogue, type Row, type Works } from "./works.ts";

const why = missing() ?? missingAddOn("customiser");
if (why !== null && process.env["ADMINIUM_REQUIRE_CONTRACT"] === "1") throw new Error(`the contract must run here, and cannot: ${why}`);
const PORT_BASE = Number(process.env["CONTRACT_PORT_BASE"] ?? 4980);

/** The figures compared, in pence and kilograms; a delivery the works quotes by hand is null. */
interface Figures {
  workCents: number;
  weightKg: number;
  deliveryCents: number | null;
  taxCents: number;
  totalCents: number;
}
const pence = (value: unknown): number => Math.round(Number(value) * 100);
const figuresOf = (q: LegacyQuote): Figures => ({ workCents: q.workCents, weightKg: q.weightKg, deliveryCents: q.deliveryCents, taxCents: q.taxCents, totalCents: q.totalCents });
const same = (a: Figures, b: Figures) => JSON.stringify(a) === JSON.stringify(b);

/** The fixes that move a job's figures: each one, taken off the rest, changes them. */
function explaining(job: Job): Fix[] {
  const all = figuresOf(legacyQuote(toLegacy(job), ALL_FIXES));
  return (Object.keys(FIXES) as Fix[]).filter((fix) => !same(figuresOf(legacyQuote(toLegacy(job), new Set([...ALL_FIXES].filter((f) => f !== fix)))), all));
}

describe.skipIf(why !== null)(`Marlow Press prices on a built Adminium${why === null ? "" : ` — skipped: ${why}`}`, () => {
  ENGINES.forEach(([engine, available], index) => {
    describe.skipIf(!available)(`on ${engine}`, () => {
      let works: Works;
      let catalogue: Catalogue;
      beforeAll(async () => {
        works = await openWorks(engine as Engine, PORT_BASE + index * PORTS_PER_ENGINE, `print_parity_${engine}${process.env["CONTRACT_DB_SUFFIX"] ?? ""}`);
        catalogue = await readCatalogue(works);
      }, 600_000);
      afterAll(async () => {
        await works?.server.stop();
      });

      it("prices its own sample as the comp quotes it: every job and saved quote, price and weight", async () => {
        const [orders, jobs, quotes, lines] = await Promise.all([works.rows("orders"), works.rows("jobs"), works.rows("saved_quotes"), works.rows("quote_lines")]);
        const numbers = (rows: Row[]) => new Map(rows.map((r) => [String(r["id"]), String(r["number"])]));
        const [order, quote] = [numbers(orders), numbers(quotes)];
        const figure = (row: Row) => ({ price: Number(row["price"]), weight: Number(row["weight_kg"]) });
        const got = Object.fromEntries([...jobs.map((j) => [order.get(String(j["order_id"])), figure(j)]), ...lines.map((l) => [quote.get(String(l["quote_id"])), figure(l)])]);
        expect(got).toEqual(JOB_FIGURES);
      });

      it("prices two hundred jobs as the old browser did, but for the fixes named", async () => {
        const report: { job: string; old: Figures; adminium: Figures; fixed: Figures; fixes: Fix[] }[] = [];
        for (const job of parityJobs()) {
          // A visitor's dry runs count among its reads, 120 a minute: kept under it.
          await new Promise((resolve) => setTimeout(resolve, PACE_MS));
          const reply = await dryRun(works.page, job.deliver ? { delivery_method: "deliver", ...ADDRESS } : { delivery_method: "collect" }, [toLine(job, catalogue)]);
          const { data: order, children } = ok(reply);
          const line = children.jobs[0]!.data;
          const adminium: Figures = {
            workCents: pence(line["price"]),
            weightKg: Number(line["weight_kg"]),
            deliveryCents: Number(order["delivery_to_quote"]) === 1 ? null : pence(order["delivery"]),
            taxCents: pence(order["tax"]),
            totalCents: pence(order["total"]),
          };
          report.push({ job: describeJob(job), old: figuresOf(legacyQuote(toLegacy(job))), adminium, fixed: figuresOf(legacyQuote(toLegacy(job), ALL_FIXES)), fixes: explaining(job) });
        }

        // With every fix on, the old code is Adminium to the penny.
        expect(report.filter((r) => !same(r.fixed, r.adminium)).map((r) => ({ job: r.job, fixed: r.fixed, adminium: r.adminium }))).toEqual([]);
        // Every job whose price moved is moved by a fix the test names.
        const moved = report.filter((r) => !same(r.old, r.adminium));
        expect(moved.filter((r) => r.fixes.length === 0).map((r) => r.job)).toEqual([]);
        // Each of the four slips is met, and put right.
        const met = new Map<Fix, number>();
        for (const r of moved) for (const fix of r.fixes) met.set(fix, (met.get(fix) ?? 0) + 1);
        for (const slip of SLIPS) expect(met.get(slip) ?? 0, slip).toBeGreaterThan(0);

        const repriced = moved.filter((r) => r.old.workCents !== r.adminium.workCents || r.old.totalCents !== r.adminium.totalCents).length;
        const summary = (Object.keys(FIXES) as Fix[]).map((fix) => `${String(met.get(fix) ?? 0).padStart(4)}  ${fix}: ${FIXES[fix]}`);
        console.info(
          `[parity ${engine}] ${String(report.length)} jobs: ${String(report.length - moved.length)} as before, ${String(moved.length)} moved by a fix (${String(repriced)} in price or total, the rest in weight alone); jobs each fix moves:\n${summary.join("\n")}`,
        );
      }, 600_000);

      it("dates the line's ready-by in working days: Mon 10 Aug for a standard job at Wednesday 10:20", async () => {
        const card = { product: "business-cards", material: "silk350", size: "bcard", sides: 2 as const, qty: 500 };
        const { children } = ok(await dryRun(works.page, { delivery_method: "collect" }, [toLine(card, catalogue)]));
        const readyBy = children.jobs[0]!.data["ready_by"] ?? null;
        expect(String(readyBy).slice(0, 10)).toBe("2026-08-10");
      });
    });
  });
});
