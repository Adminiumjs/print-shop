/** What the works has on sale follows Adminium's list, so a price whose removal failed cannot go on selling. */
import { describe, expect, it, vi } from "vitest";

import type { EngineCarrier } from "../add-ons/vendor/host/engine-carrier.ts";
import { countryPriceStore } from "./countryPrices.ts";
import type { WorksDoor } from "./door.ts";

const door = (over: Partial<WorksDoor> = {}) =>
  ({
    countryPrices: vi.fn(async () => ({ DE: "14.50" })),
    saveCountryPrice: vi.fn(async () => undefined),
    removeCountryPrice: vi.fn(async () => undefined),
    followCountries: vi.fn(async () => undefined),
    ...over,
  }) as unknown as WorksDoor & { followCountries: ReturnType<typeof vi.fn>; countryPrices: ReturnType<typeof vi.fn> };

const engine = (countries: string[] | null) => ({ international: vi.fn(async () => ({ settings: countries === null ? null : { countries } })) }) as unknown as EngineCarrier;

describe("the country prices the panel reads", () => {
  it("puts what is on sale in step with Adminium's list first", async () => {
    const works = door();
    await expect(countryPriceStore(works, engine(["FR"])).read()).resolves.toEqual({ DE: "14.50" });
    expect(works.followCountries).toHaveBeenCalledWith(["FR"]);
    expect(works.followCountries.mock.invocationCallOrder[0]!).toBeLessThan(works.countryPrices.mock.invocationCallOrder[0]!);
  });

  it("takes everything off sale for a shop with nothing saved", async () => {
    const works = door();
    await countryPriceStore(works, engine(null)).read();
    expect(works.followCountries).toHaveBeenCalledWith([]);
  });

  it("still reads the prices when the repair is refused", async () => {
    const works = door({ followCountries: vi.fn(async () => { throw new Error("refused"); }) });
    await expect(countryPriceStore(works, engine(["DE"])).read()).resolves.toEqual({ DE: "14.50" });
  });

  it("changes nothing without a carrier to ask", async () => {
    const works = door();
    await countryPriceStore(works, null).read();
    expect(works.followCountries).not.toHaveBeenCalled();
  });
});
