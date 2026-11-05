/**
 * Every language says every string, and says it with the same pieces:
 * the same placeholders as English, plural forms in the language's own CLDR
 * order, and no string left in English unless it is the same word there too
 * (a cognate, a unit, the brand or a trade term such as CMYK or SRA3, named
 * below — a new one fails until named).
 *
 * It reads the areas the app keeps (`chrome`, `shop`, `after`, `works`, and
 * `addOns`, the add-on host's own words) directly rather than the merged
 * bundle, so an add-on's registered strings do not decide what it checks.
 */
import { describe, expect, it } from "vitest";

import { LOCALE_TAGS, type LocaleTag } from "./locales.ts";
import { addOns } from "./strings/addOns.ts";
import { after } from "./strings/after.ts";
import { chrome } from "./strings/chrome.ts";
import { shop } from "./strings/shop.ts";
import { works } from "./strings/works.ts";

const AREAS = [chrome, shop, after, works, addOns] as const;
const BUNDLES = Object.fromEntries(
  LOCALE_TAGS.map((t) => [t, Object.assign({}, ...AREAS.map((a) => a[t]))]),
) as Record<LocaleTag, Record<string, string>>;

/**
 * How many `|` forms a language's plural strings carry (one form is always
 * allowed): the length of `PLURAL_ORDER` in `index.tsx`, which picks a form by
 * its place in that list. A Czech string with a fourth form for fractions
 * would have its `other` read as the fraction form ("5 dne").
 */
const FORMS: Record<LocaleTag, number> = { "en-US": 2, "de-DE": 2, "fr-FR": 2, "da-DK": 2, "cs-CZ": 3, "zh-CN": 1, "zh-TW": 1, "ar-EG": 6 };

/** Strings that are the same word in English and in the language. */
const SAME_AS_ENGLISH: Partial<Record<LocaleTag, string[]>> = {
  "de-DE": ["after.samples.name", "after.samples.optional", "chrome.brand", "common.mm", "common.sqm", "shop.artwork.req.cmyk", "shop.check.colour.cmyk", "shop.config.look.matt", "shop.config.material", "shop.m2", "shop.mm", "shop.quote.part.material", "works.addOns.details", "works.materials.sra3", "works.materials.unitMetres", "works.prices.express", "works.prices.perM2", "works.proofSheet.size", "works.shelf.sheets", "works.spec.material", "works.spec.matt"],
  "fr-FR": ["after.lookup.email", "after.proof.page1", "chrome.brand", "common.mm", "common.sqm", "shop.basket.express", "shop.checkout.email", "shop.config.options", "shop.m2", "shop.mm", "shop.quote.total", "works.actions.title", "works.addOns.cat.email", "works.addOns.version", "works.impose.title", "works.materials.sra3", "works.materials.unitMetres", "works.menu", "works.prices.express", "works.prices.perM2", "works.shelf.sheets"],
  "cs-CZ": ["after.lookup.email", "chrome.brand", "common.mm", "common.sqm", "shop.artwork.req.cmyk", "shop.check.colour.cmyk", "shop.checkout.email", "shop.m2", "shop.mm", "works.addOns.cat.email", "works.materials.sra3", "works.materials.unitMetres", "works.prices.perM2", "works.proofSheet.size", "works.shelf.sheets"],
  "da-DK": ["after.delivery.over", "after.lookup.email", "chrome.brand", "common.mm", "common.sqm", "shop.artwork.req.cmyk", "shop.check.colour.cmyk", "shop.checkout.email", "shop.config.finish", "shop.m2", "shop.mm", "shop.products.fromFor", "works.addOns.cat.email", "works.addOns.version", "works.materials.sra3", "works.materials.unitMetres", "works.menu", "works.nav.designs", "works.prices.perM2", "works.proofSheet.send", "works.proofSheet.size", "works.role.prepress", "works.shelf.sheets", "works.shipments.label", "works.stage.prepress"],
  "zh-CN": ["chrome.brand", "shop.artwork.req.cmyk", "works.materials.sra3", "works.proofSheet.size", "works.shelf.sheets"],
  "zh-TW": ["chrome.brand", "shop.artwork.req.cmyk", "works.materials.sra3", "works.proofSheet.size", "works.shelf.sheets"],
  "ar-EG": ["chrome.brand", "shop.artwork.req.cmyk", "shop.check.colour.cmyk", "works.materials.sra3", "works.shelf.sheets"],
};

const EN = BUNDLES["en-US"];
const params = (text: string) => new Set([...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!));

describe("en-US", () => {
  it("writes its plural strings in two forms", () => {
    expect(Object.keys(EN).filter((key) => EN[key]!.includes("|") && EN[key]!.split("|").length !== FORMS["en-US"])).toEqual([]);
  });
});

describe.each(LOCALE_TAGS.filter((t) => t !== "en-US"))("%s", (tag) => {
  const bundle = BUNDLES[tag];

  it("carries every English key", () => {
    expect(Object.keys(EN).filter((k) => bundle[k] === undefined || bundle[k] === "")).toEqual([]);
  });

  it("uses English's placeholders and no others", () => {
    const wrong: string[] = [];
    for (const [key, en] of Object.entries(EN)) {
      const text = bundle[key] ?? "";
      const want = params(en);
      const got = params(text);
      // A plural form may say its number in words ("قطعة واحدة"), so {count} may be missing.
      for (const p of want) if (p !== "count" && !got.has(p)) wrong.push(`${key}: no {${p}}`);
      for (const p of got) if (!want.has(p)) wrong.push(`${key}: {${p}} is not English's`);
    }
    expect(wrong).toEqual([]);
  });

  it("writes plural forms in the language's CLDR order", () => {
    const wrong = Object.keys(EN)
      .filter((key) => EN[key]!.includes("|"))
      .filter((key) => {
        const n = (bundle[key] ?? "").split("|").length;
        return n !== 1 && n !== FORMS[tag];
      });
    expect(wrong).toEqual([]);
  });

  it("leaves nothing in English but the named same words", () => {
    const same = Object.keys(EN).filter((k) => bundle[k] === EN[k] && /\p{L}/u.test(EN[k]!.replace(/\{\w+\}/g, "")));
    expect(same.sort()).toEqual([...(SAME_AS_ENGLISH[tag] ?? [])].sort());
  });
});

/** Labels that sit side by side and must never read the same. */
const SIDE_BY_SIDE = [
  ["chrome.nav.products", "chrome.nav.order", "chrome.nav.findus", "shop.nav.reorder", "shop.nav.follow"],
  ["shop.footer.before", "shop.footer.proofs", "shop.footer.quotes", "shop.footer.again"],
  ["works.nav.today", "works.nav.jobs", "works.nav.materials", "works.nav.prices", "works.nav.shipments", "works.nav.addOns"],
] as const;

describe.each(LOCALE_TAGS)("%s: side-by-side labels", (tag) => {
  it("are all different", () => {
    for (const group of SIDE_BY_SIDE) {
      const words = group.map((key) => BUNDLES[tag][key]);
      expect(words.every((w) => typeof w === "string"), group.join(", ")).toBe(true);
      expect(new Set(words).size, group.join(", ")).toBe(group.length);
    }
  });
});
