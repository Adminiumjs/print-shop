/**
 * The customer side's served config, as Adminium answers it beside the
 * bundle: the key, the tables, and, for someone who manages payments and is
 * rehearsing on this address alone, the token their writes carry.
 */
import { describe, expect, it } from "vitest";

import { resolveShop } from "./served.ts";

const answering = (doc: unknown) => (async () => new Response(JSON.stringify(doc), { status: 200 })) as typeof fetch;

describe("the served config", () => {
  it("hands a rehearsing manager's write token to the shop's clients", async () => {
    const served = await resolveShop({ baked: {}, base: "/apps/printing/customer/", origin: "https://works.example", fetchImpl: answering({ publishableKey: "adm_pub_shop", rehearsal: { until: "2026-08-05T13:20:00Z", csrfToken: "csrf-r" } }) });
    expect(served).toEqual({ baseUrl: "https://works.example", publishableKey: "adm_pub_shop", rehearsalToken: "csrf-r" });
  });

  it("carries none for anyone else", async () => {
    const served = await resolveShop({ baked: {}, base: "/apps/printing/customer/", origin: "https://works.example", fetchImpl: answering({ publishableKey: "adm_pub_shop", rehearsal: { csrfToken: "" } }) });
    expect(served?.rehearsalToken).toBeUndefined();
  });
});
