/**
 * The demo's stand-in for paying online: "Pay now" on an order that may be
 * paid lands its payment at once, as Adminium records an online one, and the
 * order's own figures say it is paid. No page is left; no money moves.
 */
import { describe, expect, it } from "vitest";

import { DemoAfter } from "./shop.ts";
import { DemoWorld } from "./world.ts";

const order = (w: DemoWorld, number: string) => w.all("orders").find((o) => o["number"] === number)!;

describe("paying online in the demo", () => {
  it("offers it by its stand-in", async () => {
    expect(await new DemoAfter(new DemoWorld()).payOffer()).toEqual({ online: true, test: false, standIn: true });
  });

  it("takes what the order owes as an online payment, and the order then owes nothing", async () => {
    const w = new DemoWorld();
    const door = new DemoAfter(w);
    const ready = order(w, "MP-4115");
    door.adopt(ready.id);
    expect(ready["pay_open"]).toBe(1);
    const owed = String(ready["due"]);
    await door.startPay("link", ready.id);
    const paid = order(w, "MP-4115");
    expect(paid["due"]).toBe("0.00");
    expect(paid["paid"]).toBe(owed);
    expect(paid["paid_online"]).toBe(owed);
    expect(w.all("payments")).toMatchObject([{ order_id: ready.id, method: "online", provider: "Demo", amount: owed }]);
    // Nothing left to pay: a second press is refused, as Adminium refuses it.
    await expect(door.startPay("link", ready.id)).rejects.toMatchObject({ refused: { code: "PUBLIC_PAY_REFUSED" } });
  });

  it("refuses an order whose proof still waits, and one the session does not open", async () => {
    const w = new DemoWorld();
    const door = new DemoAfter(w);
    const waiting = order(w, "MP-4121");
    door.adopt(waiting.id);
    await expect(door.startPay("link", waiting.id)).rejects.toMatchObject({ refused: { code: "PUBLIC_PAY_REFUSED" } });
    await expect(door.startPay("link", order(w, "MP-4115").id)).rejects.toMatchObject({ refused: { code: "PUBLIC_NOT_FOUND" } });
    expect(w.all("payments")).toEqual([]);
  });
});
