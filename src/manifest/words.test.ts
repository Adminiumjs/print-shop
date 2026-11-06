/**
 * Every manifest label is said in all seven languages beside English, and
 * said properly: no empty or padded value, no value left in English unless it
 * is the same word in that language (named below — a new one fails until
 * named), the same `{…}` placeholders as English, Arabic numbers in
 * Arabic-Indic digits, and nothing the release vocabulary bans.
 *
 * That every label HAS an entry is the drift test's job
 * (`untranslated-labels.json`); this one reads what the entries say.
 */
import { describe, expect, it } from "vitest";

import { bundleOffences } from "../testing/lexicon.ts";
import type { Translation } from "./labels.ts";
import { WORDS } from "./words.ts";

type Tag = keyof Translation;
const TAGS: Tag[] = ["de-DE", "fr-FR", "da-DK", "cs-CZ", "ar-EG", "zh-CN", "zh-TW"];

/** Labels that are the same word in English and in the language. */
const SAME_AS_ENGLISH: Partial<Record<Tag, string[]>> = {
  "de-DE": ["Code", "Express", "Express (+%)", "Material", "Matt", "Name", "Option", "Position", "Proof", "Proofs", "Status"],
  "fr-FR": ["Code", "E-mail", "E-mails", "Express", "Express (+%)", "Machine", "Machines", "Note", "Option", "Options", "Photo", "Position", "Total"],
  "da-DK": ["Design", "E-mail", "E-mails", "Note", "Prepress", "Side", "Status"],
  "cs-CZ": ["E-mail"],
};

const ENTRIES = Object.entries(WORDS);
const placeholders = (text: string) => [...text.matchAll(/\{\{?[^{}]+\}?\}/g)].map((m) => m[0]).sort();

describe("the manifest's words", () => {
  it("has entries", () => {
    expect(ENTRIES.length).toBeGreaterThan(0);
  });

  describe.each(TAGS)("%s", (tag) => {
    it("says every label, trimmed and non-empty", () => {
      const bad = ENTRIES.filter(([, t]) => typeof t[tag] !== "string" || t[tag].trim() === "" || t[tag] !== t[tag].trim()).map(([en]) => en);
      expect(bad).toEqual([]);
    });

    it("leaves nothing in English but the named same words", () => {
      const same = ENTRIES.filter(([en, t]) => t[tag] === en).map(([en]) => en);
      expect(same.sort()).toEqual([...(SAME_AS_ENGLISH[tag] ?? [])].sort());
    });

    it("keeps English's placeholders and no others", () => {
      const wrong = ENTRIES.filter(([en, t]) => placeholders(en).join() !== placeholders(t[tag]).join()).map(([en]) => en);
      expect(wrong).toEqual([]);
    });

    it("says nothing the release vocabulary bans", () => {
      const hits = ENTRIES.flatMap(([en, t]) => bundleOffences(t[tag]).map((o) => `${en} · ${o.token} · ${t[tag]}`));
      expect(hits).toEqual([]);
    });
  });

  it("writes Arabic numbers in Arabic-Indic digits", () => {
    expect(ENTRIES.filter(([, t]) => /[0-9]/.test(t["ar-EG"])).map(([en]) => en)).toEqual([]);
  });

  it("would catch a banned word and a Latin digit if one arrived", () => {
    expect(bundleOffences("Kostenlose Lieferung").length).toBeGreaterThan(0);
    expect(bundleOffences("kopie pro dílnu").length).toBeGreaterThan(0);
    expect(/[0-9]/.test("آخر 7 أيام")).toBe(true);
  });
});
