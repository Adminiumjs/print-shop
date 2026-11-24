/**
 * WHAT THE WORKS HAS ON SALE FOLLOWS ADMINIUM'S LIST. Removing a country takes
 * it off the list first, and a failure to mark its row after that is ignored,
 * so opening the panel puts right anything left on sale that Adminium would
 * refuse a label for. A row is never deleted: past orders name it.
 */
import type { EngineCarrier } from "../add-ons/vendor/host/engine-carrier.ts";
import type { WorksDoor } from "./door.ts";

/** Where the kit's Countries panel reads and writes each country's price: the works' own table, through its door. */
export interface CountryPriceStore {
  read(): Promise<Readonly<Record<string, string>>>;
  save(country: string, amount: string): Promise<void>;
  remove(country: string): Promise<void>;
}

export function countryPriceStore(door: WorksDoor, client: EngineCarrier | null): CountryPriceStore {
  return {
    async read() {
      if (client !== null) {
        const listed = (await client.international()).settings?.countries ?? [];
        // Refused now, it is tried again next time; the panel still shows what is there.
        await door.followCountries(listed).catch(() => undefined);
      }
      return door.countryPrices();
    },
    save: (country, amount) => door.saveCountryPrice(country, amount),
    remove: (country) => door.removeCountryPrice(country),
  };
}
