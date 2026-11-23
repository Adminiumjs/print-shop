/**
 * HANDING AN ORDER OVER, on a built Adminium on all three databases, as the
 * counter and not as an administrator: what the role may do with labels, what
 * it may not write, that a bought label's number stays the works' own until
 * the hand-over, and that a new number mails the customer only when pressed.
 * No carrier is called. A bought label is written as the engine writes it.
 */
import { randomBytes } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AdminiumWorks } from "../studio/adminiumWorks.ts";
import { tellNewNumber } from "../studio/actions.ts";
import { createSessionTransport } from "../studio/transport/sessionSource.ts";
import { loadStaffConfig } from "../studio/transport/staffConnection.ts";
import { isApiError, type Row } from "../studio/wire.ts";
import { Caller, ENGINES, missing, missingAddOn, ok, PORTS_PER_ENGINE } from "./harness.ts";
import { delivered } from "./mail.ts";
import { MANIFEST_TEXT } from "./release.ts";
import { openWorks, type Works } from "./works.ts";

const why = missing() ?? missingAddOn("customiser");
const PORT_BASE = Number(process.env["CONTRACT_PORT_BASE"] ?? 5310);
const SHOPPER = "ruth@okafor-studio.dev";
const ACCESS = "/api/v1/apps/printing/shipping/access";

describe.skipIf(why !== null)(`handing an order over${why === null ? "" : ` — skipped: ${why}`}`, () => {
  ENGINES.forEach(([engine, available], index) => {
    describe.skipIf(!available)(`on ${engine}`, () => {
      let works: Works;
      let counter: Caller;
      let door: AdminiumWorks;
      let orderId: unknown;
      let number = "";

      const signedIn = async (role: string): Promise<Caller> => {
        const roles = ok(await works.staff.get<{ roles: { id: string; name: string; slug?: string }[] }>("/api/v1/roles")).roles;
        const found = roles.find((r) => r.slug === `printing-${role}`)!;
        const email = `${role}.ship.${engine}@marlowpress.example`;
        const invited = ok(await works.staff.post<{ invite: { token: string } }>("/api/v1/users", { email, name: role, roleIds: [found.id] }), 201);
        const password = `${randomBytes(18).toString("base64url")}Aa1!`;
        ok(await new Caller(works.server.base).post("/api/v1/auth/password/reset", { token: invited.invite.token, newPassword: password }));
        const caller = new Caller(works.server.base);
        ok(await caller.post("/api/v1/auth/login", { email, password }));
        return caller;
      };
      const doorOf = async (caller: Caller): Promise<AdminiumWorks> => {
        const cfg = (await loadStaffConfig({ hostedStaff: true, base: "/apps/printing/staff/", fetchImpl: caller.fetchAs() }))!;
        const transport = createSessionTransport({
          tableOfRef: cfg.tables,
          connectionId: cfg.connectionId ?? undefined,
          staff: { csrfToken: cfg.csrfToken, timezone: cfg.timezone, timezoneSource: cfg.timezoneSource, serverTimezone: cfg.serverTimezone, currency: cfg.currency },
          fetchImpl: caller.fetchAs(),
        });
        return new AdminiumWorks(transport, cfg, { fetchImpl: caller.fetchAs() });
      };
      const orderNow = async (): Promise<Row> => ((await works.rows("orders")) as Row[]).find((o) => String(o.id) === String(orderId))!;
      const mailRow = (kind: string) => async () => (await works.rows("messages")).find((m) => m["kind"] === kind && String(m["order_id"]) === String(orderId));

      beforeAll(async () => {
        works = await openWorks(engine, PORT_BASE + index * PORTS_PER_ENGINE, `printing_ship_${engine}`);
        counter = await signedIn("counter");
        door = await doorOf(counter);
        await door.load();
        // An order of its own: the sample's rows are on addresses the outbox never sends to.
        const made = ok(await works.staff.post<{ data: Row }>(`/api/v1/data/${works.connectionId}/printing_orders`, { values: { name: "Ruth Okafor", email: SHOPPER, delivery_method: "deliver", address_line1: "4 Mill Lane", town: "Bourne End", postcode: "SL8 5PQ", language: "en-US" } }), 201);
        orderId = made.data.id;
        number = String(made.data["number"]);
        ok(await works.staff.patch(`/api/v1/data/${works.connectionId}/printing_orders/${String(orderId)}`, { values: { status: "ready" } }));
      }, 240_000);
      afterAll(async () => {
        await works?.server.stop();
      });

      it("starts a new order from the works' country, and never from its money", async () => {
        const made = ok(await works.staff.post<{ data: Row }>(`/api/v1/data/${works.connectionId}/printing_orders`, { values: { name: "A", email: "a@okafor-studio.dev", delivery_method: "collect" } }), 201);
        expect(made.data["country"]).toBe("GB");
      });

      it("lets the counter buy labels and nothing more, and tells the press it has no right", async () => {
        const access = ok(await counter.get<{ data: { appUpdated: boolean; mayBook: boolean; mayCancel: boolean; manages: boolean } }>(ACCESS)).data;
        expect(access).toMatchObject({ appUpdated: true, mayBook: true, mayCancel: false, manages: false });
        const press = await signedIn("press");
        expect((await press.get(ACCESS)).status).toBe(403);
      });

      it("keeps a label's number from the counter's pen", async () => {
        const refused = await door.updateOrder({ id: orderId as number }, { label_tracking: "TYPED" }).then(() => null, (error: unknown) => error);
        expect(isApiError(refused) ? refused.status : refused).toBe(403);
        expect((await orderNow())["label_tracking"] ?? null).toBeNull();
      });

      it("hands over with the label's number and carrier, and mails them once", async () => {
        ok(await works.staff.patch(`/api/v1/data/${works.connectionId}/printing_orders/${String(orderId)}`, { values: { label_tracking: "TRK-1", label_carrier: "Evri" } }));
        expect((await orderNow())["tracking"] ?? null).toBeNull();
        await door.moveOrder(await orderNow(), "dispatched", { tracking: "TRK-1", carrier: "Evri" });
        const now = await orderNow();
        expect(now).toMatchObject({ status: "dispatched", tracking: "TRK-1", carrier: "Evri" });
        const { mail } = await delivered({ sink: works.server.sink, manifest: MANIFEST_TEXT, kind: "order-dispatched", to: SHOPPER, known: { "order.number": number }, body: /TRK-1/, row: mailRow("order-dispatched") });
        expect(`${mail.text}\n${mail.html}`).toContain("Evri");
        expect(`${mail.text}\n${mail.html}`).not.toMatch(/dhl/i);
        expect(await mailRow("order-new-number")()).toBeUndefined();
      }, 120_000);

      it("mails a new number only when the counter presses, on a locked order", async () => {
        await tellNewNumber(door, await orderNow(), "TRK-2", Date.now());
        expect(await orderNow()).toMatchObject({ status: "dispatched", tracking: "TRK-2" });
        const { mail } = await delivered({ sink: works.server.sink, manifest: MANIFEST_TEXT, kind: "order-new-number", to: SHOPPER, known: { "order.number": number }, body: /TRK-2/, row: mailRow("order-new-number") });
        expect(mail.subject).toContain("new tracking number");
      }, 120_000);
    });
  });
});
