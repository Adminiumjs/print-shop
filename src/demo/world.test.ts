/**
 * The demo's Adminium against what the real one answers: the sample priced
 * by the manifest's own rules comes to the comp's quote of every job (the
 * figures the contract holds a built Adminium to, `JOB_FIGURES`); a dry run
 * and the order it becomes come to the same total, dated three working days
 * on from before the cut-off; a price that moved refuses the save; a proof
 * approved lets the job go to press and dates it again; an order is ready
 * only once no job of it is on the floor; and a second sample pack to an
 * address is refused.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { JOB_FIGURES } from "../sample/marlow-press.ts";
import type { OrderBody } from "../shop/port.ts";
import { holidaysToAdd } from "../studio/screens/Prices.tsx";
import { sampleRefusal, samePlace } from "../shop/after.ts";
import { isShopError } from "../shop/port.ts";
import { makeDemo } from "./adminium.ts";
import { DEMO_HOLIDAYS } from "./world.ts";

const optionOf = (demo: ReturnType<typeof makeDemo>, product: string, kind: string, code: string) => {
  const p = demo.world.all("products").find((r) => r["code"] === product)!;
  return demo.world.all("options").find((o) => String(o["product_id"]) === String(p.id) && o["kind"] === kind && o["code"] === code)!.id;
};

function cards(demo: ReturnType<typeof makeDemo>, qty = 500): OrderBody {
  const p = demo.world.all("products").find((r) => r["code"] === "business-cards")!;
  return {
    values: { name: "Ruth Okafor", email: "ruth@okafor.example", delivery_method: "collect", language: "en-US", may_email: false },
    children: {
      jobs: [
        {
          values: {
            product_id: p.id,
            qty,
            material_option_id: optionOf(demo, "business-cards", "material", "silk350"),
            size_option_id: optionOf(demo, "business-cards", "size", "bcard"),
            sides_option_id: optionOf(demo, "business-cards", "sides", "double"),
            lamination_option_id: optionOf(demo, "business-cards", "lamination", "lam-both"),
            look: "matt",
            proof_by_post: false,
            express: false,
          },
        },
      ],
    },
  };
}

describe("the demo's Adminium", () => {
  it("prices every sample job as the comp quotes it, by the manifest's own rules", () => {
    const demo = makeDemo();
    const got: Record<string, { price: number; weight: number }> = Object.fromEntries(
      demo.world.all("orders").map((o) => {
        const job = demo.world.all("jobs").find((j) => String(j["order_id"]) === String(o.id))!;
        return [String(o["number"]), { price: Number(job["price"]), weight: Number(job["weight_kg"]) }];
      }),
    );
    for (const q of demo.world.all("saved_quotes")) {
      const line = demo.world.all("quote_lines").find((l) => String(l["quote_id"]) === String(q.id))!;
      got[String(q["number"])] = { price: Number(line["price"]), weight: Number(line["weight_kg"]) };
    }
    expect(got).toEqual(JOB_FIGURES);
    expect(demo.world.all("saved_quotes").find((q) => q["number"] === "MQ-2041")?.["total"]).toBe("238.31");
  });

  it("places the order its dry run priced, as MP-4127, ready three working days on", async () => {
    const demo = makeDemo();
    const dry = await demo.shop.quote(cards(demo));
    const placed = await demo.shop.place(cards(demo), "demo-test-0000000001", String(dry.order["total"]));
    expect([placed.order["number"], placed.order["total"], placed.order["ready_by"]]).toEqual(["MP-4127", dry.order["total"], "2026-08-10"]);
    expect(placed.jobs[0]?.["price"]).toBe(dry.jobs[0]?.["price"]);
    expect(placed.link?.token).toMatch(/^[0-9A-Z]{16}$/);
    // The same key again: the order already made, not a second.
    expect((await demo.shop.place(cards(demo), "demo-test-0000000001", String(dry.order["total"]))).replayed).toBe(true);
    expect(demo.world.all("orders").filter((o) => o["number"] === "MP-4127")).toHaveLength(1);
  });

  it("dates an order placed past the two o'clock cut-off from the next working day", async () => {
    const demo = makeDemo();
    demo.world.pastCutoff();
    expect((await demo.shop.quote(cards(demo))).order["ready_by"]).toBe("2026-08-11");
  });

  it("refuses a save at a total that has moved since, with the new figures", async () => {
    const demo = makeDemo();
    const dry = await demo.shop.quote(cards(demo));
    const silk = demo.world.all("materials").find((m) => m["code"] === "silk350")!;
    demo.world.write(() => demo.world.update("materials", silk.id, { rate: "0.441" }));
    const refused = await demo.shop.place(cards(demo), "demo-test-0000000002", String(dry.order["total"])).catch((e: unknown) => e);
    expect(isShopError(refused) && refused.refused.code).toBe("PUBLIC_PRICE_CHANGED");
    expect(isShopError(refused) && Number(refused.refused.changed?.order["total"])).toBeGreaterThan(Number(dry.order["total"]));
  });

  it("works a large-format run's area out whole and rounds it once, never a piece's rounded area times the run", async () => {
    const demo = makeDemo();
    const p = demo.world.all("products").find((r) => r["code"] === "canvas")!;
    const body: OrderBody = {
      values: { delivery_method: "collect", language: "en-US" },
      children: {
        jobs: [
          {
            values: {
              product_id: p.id,
              qty: 10,
              material_option_id: optionOf(demo, "canvas", "material", "canvas380"),
              sides_option_id: optionOf(demo, "canvas", "sides", "single"),
              width_mm: 333,
              height_mm: 777,
              proof_by_post: false,
              express: false,
            },
          },
        ],
      },
    };
    const job = (await demo.shop.quote(body)).jobs[0]!;
    // 0.258741 m² a piece reads 0.26; ten of them are 2.58741 m², 2.59 — not 2.60.
    expect([job["area_each"], job["area_total"]]).toEqual(["0.26", "2.59"]);
  });

  it("leaves a cancelled job out of its order's goods, weight and total, as the manifest's `unlessSet` says", async () => {
    const demo = makeDemo();
    const two = cards(demo);
    two.children.jobs.push({ values: { ...two.children.jobs[0]!.values, qty: 250 } });
    const placed = await demo.shop.place(two, "demo-test-0000000009", String((await demo.shop.quote(two)).order["total"]));
    const data = await demo.works.load();
    const jobs = data.jobs.filter((j) => String(j["order_id"]) === String(placed.order["id"]));
    const kept = jobs.find((j) => Number(j["qty"]) === 500)!;
    await demo.works.moveJob(jobs.find((j) => Number(j["qty"]) === 250)!, "cancelled");
    const order = (await demo.works.load()).orders.find((o) => String(o.id) === String(placed.order["id"]))!;
    expect([Number(order["item_count"]), order["goods_total"], order["weight_kg"]]).toEqual([1, kept["price"], kept["weight_kg"]]);
    expect(Number(order["total"])).toBeLessThan(Number(placed.order["total"]));
  });

  it("holds a job in prepress until its proof is approved, then dates it again from the approval", async () => {
    const demo = makeDemo();
    const placed = await demo.shop.place(cards(demo), "demo-test-0000000003", String((await demo.shop.quote(cards(demo))).order["total"]));
    const data = await demo.works.load();
    const job = data.jobs.find((j) => String(j["order_id"]) === String(placed.order["id"]))!;
    const order = data.orders.find((o) => String(o.id) === String(placed.order["id"]))!;
    expect(await demo.works.moveJob(job, "printing").catch((e: unknown) => (e as { code?: string }).code)).toBe("STATE_MOVE_REFUSED");
    const proof = await demo.works.sendProof({ job, kind: "email", file: { blob: new Blob(["%PDF-1.4"], { type: "application/pdf" }), filename: "proof.pdf" }, designVersionId: null, note: null });
    expect([proof["version"], proof["state"], proof["sent_by"]]).toEqual([1, "sent", "Rosa Marlow"]);
    // The proof's order is its job's, never sent.
    expect(String(proof["order_id"])).toBe(String(order.id));
    // Thursday afternoon, past the cut-off, the customer approves through the order's own link.
    demo.world.advanceWorkingDay();
    demo.world.pastCutoff();
    expect(await demo.after.openShared(String(placed.link!.token))).toBe("opened");
    await demo.after.answerProof("link", proof.id as number, { state: "approved" });
    const approved = demo.world.get("jobs", job.id)!;
    expect([approved["proof_state"], approved["proof_ok"], approved["ready_by"]]).toEqual(["approved", 1, "2026-08-12"]);
    const onPress = await demo.works.moveJob(approved, "printing");
    expect([onPress["stage"], onPress["printed_by"]]).toEqual(["printing", "Rosa Marlow"]);
    // Not ready while its job is still on the floor.
    expect(await demo.works.moveOrder(demo.world.get("orders", order.id)!, "ready").catch((e: unknown) => (e as { code?: string }).code)).toBe("STATE_MOVE_REFUSED");
    await demo.works.moveJob(demo.world.get("jobs", job.id)!, "ready");
    expect((await demo.works.moveOrder(demo.world.get("orders", order.id)!, "ready"))["status"]).toBe("ready");
  });

  it("refuses a second sample pack to an address that has had one", async () => {
    const demo = makeDemo();
    const silk = demo.world.all("materials").find((m) => m["code"] === "silk350")!;
    const refused = await demo.after
      .askSamples({ values: { name: "Harbour Bakery", email: "orders@harbourbakery.example", address_line1: "12 Quay Street", town: "Marlow", postcode: "SL7 1BT", language: "en-US", client_key: "demo-pack-1" }, children: { sample_stocks: [{ values: { material_id: silk.id } }] } })
      .catch((e: unknown) => e);
    // Refused as Adminium refuses it: no column named, so nobody learns which addresses have asked; the page still says one may have gone.
    expect(isShopError(refused) && [refused.refused.code, refused.refused.column]).toEqual(["PUBLIC_WRITE_REFUSED", null]);
    expect(samePlace(sampleRefusal(refused))).toBe(true);
    // Typed another way, it is the same address: the key is kept by its `normalize: "code"` rule, as Adminium keeps it.
    const retyped = await demo.after
      .askSamples({ values: { name: "Harbour Bakery", email: "post@harbourbakery.example", address_line1: "12 quay street", town: "Marlow", postcode: "sl7 1bt", language: "en-US", client_key: "demo-pack-3" }, children: { sample_stocks: [{ values: { material_id: silk.id } }] } })
      .catch((e: unknown) => e);
    expect(isShopError(retyped) && [retyped.refused.code, retyped.refused.column]).toEqual(["PUBLIC_WRITE_REFUSED", null]);
    const taken = await demo.after.askSamples({ values: { name: "Two Rivers", email: "ride@tworivers.example", address_line1: "8 Station Road", town: "Bourne End", postcode: "SL8 5QH", language: "en-US", client_key: "demo-pack-2" }, children: { sample_stocks: [{ values: { material_id: silk.id } }] } });
    expect(taken["status"]).toBe("new");
  });

  it("quotes 5,000 A4 flyers, over thirty kilograms, for delivery by hand", async () => {
    const demo = makeDemo();
    const p = demo.world.all("products").find((r) => r["code"] === "flyers")!;
    const first = (kind: string) => demo.world.all("options").find((o) => String(o["product_id"]) === String(p.id) && o["kind"] === kind && o["preselected"] === true) ?? demo.world.all("options").find((o) => String(o["product_id"]) === String(p.id) && o["kind"] === kind)!;
    const body: OrderBody = {
      values: { delivery_method: "deliver", language: "en-US" },
      children: { jobs: [{ values: { product_id: p.id, qty: 5000, material_option_id: first("material").id, size_option_id: optionOf(demo, "flyers", "size", "a4"), sides_option_id: first("sides").id, proof_by_post: false, express: false } }] },
    };
    const dry = await demo.shop.quote(body);
    expect([Number(dry.order["weight_kg"]) > 30, dry.order["delivery_to_quote"], dry.order["delivery_priced"]]).toEqual([true, 1, null]);
  });
});

/** Holiday calendars' starting rows, in an add-ons checkout beside this repo (`ADD_ONS_REPO`), when there is one. */
const SEED = join(process.env["ADD_ONS_REPO"] ?? join(import.meta.dirname, "..", "..", "..", "add-ons"), "packages", "holiday-calendars", "seeds", "holidays.json");

describe("the demo's public holidays", () => {
  it.skipIf(!existsSync(SEED))("are the England and Wales set Holiday calendars seeds, day for day and name for name", () => {
    const seeded = (JSON.parse(readFileSync(SEED, "utf8")) as { country: string; region: string | null; day: string; name: string }[]).filter((h) => h.country === "GB" && h.region === "england-and-wales");
    expect(DEMO_HOLIDAYS.map(({ country, region, day, name }) => ({ country, region, day, name }))).toEqual(seeded);
  });

  it("offers the ones to come as closures once Holiday calendars is on, those the sample shuts already left out", async () => {
    const demo = makeDemo();
    demo.world.addOns.add("holiday-calendars");
    const data = await demo.works.load();
    expect(data.holidays.every((h) => h["country"] === "GB" && h["region"] === "england-and-wales")).toBe(true);
    expect(holidaysToAdd(data, "2026-08-05").map((h) => `${String(h["day"])} ${String(h["name"])}`).slice(0, 2)).toEqual(["2027-01-01 New Year's Day", "2027-03-26 Good Friday"]);
  });
});
