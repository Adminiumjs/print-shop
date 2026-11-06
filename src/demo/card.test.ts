/**
 * `demo.json` as the website checks it: Marlow Press's declaration, emitted in
 * the card's eight languages, passes the website's own `demoJsonIssues` —
 * with the add-ons the marketplace knows and icon names lucide draws — every
 * screen and shortcut it offers is one the bridge answers to, and none of the
 * card's own words says what the release vocabulary bans.
 */
import { icons } from "lucide-react";
import { describe, expect, it } from "vitest";

import { buildDemoJson } from "../../demo-emit.ts";
import { DEMO_LOCALES, demoJsonIssues } from "../demo-types.ts";
import { bundleOffences } from "../testing/lexicon.ts";
import { SCREEN_IDS, SHORTCUT_IDS } from "./shortcuts.ts";
import { CARD_MESSAGES, CARD_WORDS, DEMO_CARD } from "./card.ts";

const pascal = (name: string) => name.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
const kebab = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/([A-Za-z])([0-9])/g, "$1-$2").toLowerCase();
const ICONS = new Set(Object.keys(icons).map(kebab));
const ADD_ONS = new Set(["shipping-dhl", "inventory", "invoices", "holiday-calendars"]);

const doc = buildDemoJson({ ...DEMO_CARD, messages: CARD_MESSAGES });

describe("demo.json", () => {
  it("passes the website's check", () => {
    expect(demoJsonIssues(doc, { appKey: "printing", dir: "print-shop", addOnKeys: ADD_ONS, icons: ICONS })).toEqual([]);
    expect(doc.base).toBe("/demo/print-shop/app/");
  });

  it("offers the comp's fourteen customer screens and six shop screens, with seventeen shortcuts", () => {
    expect(doc.screens.filter((s) => s.persona === "customer").map((s) => s.labels["en-US"])).toEqual([
      "Products",
      "Configure",
      "Artwork",
      "Basket",
      "Confirmation",
      "Follow an order",
      "Order it again",
      "Sample pack",
      "Templates & sizes",
      "Your proofs",
      "Saved quotes",
      "Delivery & collection",
      "Find us",
      "404",
    ]);
    expect(doc.screens.filter((s) => s.persona === "shop").map((s) => s.labels["en-US"])).toEqual(["Today", "Job ticket", "Jobs", "Materials", "Price list", "404"]);
    expect(doc.screens.flatMap((s) => s.shortcuts ?? [])).toHaveLength(17);
    expect(doc.screens.find((s) => s.id === "config")?.shortcuts?.map((s) => s.labels["en-US"])).toEqual(["500 business cards, both sides, laminated", "999 flyers", "100 vinyl stickers", "Too big for the roll"]);
    expect(doc.clock?.advance.map((a) => a.labels["en-US"])).toEqual(["+1 working day", "Past the 14:00 cut-off"]);
    expect(doc.personas?.map((p) => p.labels["en-US"])).toEqual(["Customer", "Shop"]);
    expect(doc.addOns?.map((a) => a.key)).toEqual(["shipping-dhl", "inventory", "invoices", "holiday-calendars"]);
  });

  it("labels everything in all eight languages, and says each in that language", () => {
    const labelled = [
      ...doc.screens.flatMap((s) => [s.labels, ...(s.shortcuts ?? []).map((c) => c.labels)]),
      ...(doc.personas ?? []).map((p) => p.labels),
      ...(doc.clock?.advance ?? []).map((a) => a.labels),
      ...(doc.addOns ?? []).map((a) => a.labels),
    ];
    for (const labels of labelled) {
      expect(Object.keys(labels).sort()).toEqual([...DEMO_LOCALES].sort());
      for (const text of Object.values(labels)) expect(text.trim()).not.toBe("");
    }
    for (const s of doc.screens.flatMap((one) => one.shortcuts ?? [])) {
      expect(s.labels["de-DE"], s.id).not.toBe(s.labels["en-US"]);
      expect(s.labels["ar-EG"], s.id).not.toBe(s.labels["en-US"]);
    }
  });

  it("says nothing the release vocabulary bans, and no Latin digit in Arabic but a reference", () => {
    const hits = Object.entries(CARD_WORDS).flatMap(([key, words]) => words.flatMap((w) => bundleOffences(w).map((o) => `${key} · ${o.token} · ${w}`)));
    expect(hits).toEqual([]);
    const arabic = Object.entries(CARD_WORDS).filter(([, words]) => /[0-9]/.test(words[5]!.replace(/MP-\d+|PDF|DHL|404/g, ""))).map(([key]) => key);
    expect(arabic).toEqual([]);
  });

  it("names icons lucide draws, spelled as the card spells them", () => {
    for (const screen of doc.screens) {
      expect(icons[pascal(screen.icon) as keyof typeof icons], screen.icon).toBeDefined();
      for (const s of screen.shortcuts ?? []) expect(icons[pascal(s.icon) as keyof typeof icons], s.icon).toBeDefined();
    }
  });

  it("has no screen or shortcut the bridge does not answer to", () => {
    expect(doc.screens.map((s) => s.id).filter((id) => !SCREEN_IDS.includes(id))).toEqual([]);
    expect(doc.screens.flatMap((s) => s.shortcuts ?? []).map((s) => s.id).filter((id) => !SHORTCUT_IDS.includes(id))).toEqual([]);
  });
});
