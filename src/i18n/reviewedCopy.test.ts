/**
 * NO STRING ENTERS OR CHANGES IN ANY LANGUAGE WITHOUT SOMEBODY READING IT.
 *
 * ══════════════════════════════════════════════════════════════════════════
 *
 * ── WHY THIS EXISTS ────────────────────────────────────────────────────────
 *
 * `testing/lexicon.ts` says plainly, at length, that its `IDEA × LANGUAGE`
 * table is a REGRESSION SET and cannot be made complete. Deciding whether an
 * arbitrary sentence in seven languages raises the subject of paying for the
 * product is reading for meaning, and no list of stems does that. Two plants
 * proved it with every gate in this repo green:
 *
 *     "Wechseln Sie jetzt zur kostenpflichtigen Vollversion."   (de-DE)
 *     "انتقل إلى النسخة المدفوعة للحصول على مزايا إضافية."        (ar-EG)
 *
 * v1 ships completely free of charge and must never raise the subject in any
 * language, so this is the rule with the most direct release consequence and
 * the one a word list can least be trusted with.
 *
 * WHAT CAN BE MADE COMPLETE IS A GATE OVER CHANGE, and this is it:
 *
 *     every message key is fingerprinted across all eight locales, and any
 *     addition, edit or removal fails until the fingerprint is updated
 *
 * It decides nothing about the words. Its whole job is to make the judgement
 * happen — so that a sentence cannot reach eight locales because it used a
 * vocabulary nobody had thought to ban.
 *
 * ── HOW TO CLEAR A FAILURE, WHICH IS THE POINT OF THE FAILURE ──────────────
 *
 *   1. Read the diff to `i18n/strings/*.ts` for the keys this suite names —
 *      every language, not only the English.
 *   2. For each new or changed sentence ask: does it tell the reader that
 *      something costs money, or that more of the product can be had by
 *      paying — in any words at all? If yes, it does not ship. Ask the other
 *      two questions the sweep cannot ask either: does it name a real company
 *      as anything but "not affiliated", and does it state a fact about
 *      one particular shop that an add-on's copy has no business knowing?
 *   3. Only then run this file with `UPDATE_COPY_LEDGER=1`, which rewrites
 *      `reviewed-copy.json` in place, and commit it beside the strings.
 *
 * Updating without step 2 is the one way to make this worthless, and that is
 * the cost of any ratchet: it is only as good as the reading it forces.
 *
 * ── WHY ONE FINGERPRINT PER KEY, ACROSS ALL EIGHT LOCALES ──────────────────
 *
 * PER KEY, because the failure has to name what to read. A single hash over a
 * bundle goes red on every copy edit and tells a reviewer nothing about which
 * sentence moved, which trains everybody to update it without looking — the
 * failure mode that makes a ratchet worse than nothing.
 *
 * ACROSS ALL EIGHT, because the defect this is for is a TRANSLATOR's sentence.
 * The add-ons repo's own ledger fingerprints en-US alone, deliberately, since
 * the question it serves is about the sentence rather than its spellings. This
 * one serves a question that is entirely about the spellings: both plants were
 * invisible in English because in English nothing had changed.
 *
 * ── AND IT COVERS THIS APP'S OWN COPY, NOT THE ADD-ONS' ────────────────────
 *
 * The keys are read from `i18n/strings/*.ts` — the areas this app authors —
 * rather than from the merged `MESSAGES`, which an add-on registers into at
 * load. Fingerprinting the merged bundle would mean vendoring an add-on turned
 * this ledger red, which is the host-holds-an-add-on's-fact defect this wave
 * has now found five times. An add-on's copy is reviewed in the add-on's own
 * repo, where its own ledger sits.
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { LOCALE_TAGS } from "./locales.ts";

const LEDGER = fileURLToPath(new URL("./reviewed-copy.json", import.meta.url));

/**
 * Every area module this app authors, as `{ locale: { key: value } }`.
 *
 * Globbed rather than listed: an area added tomorrow is fingerprinted tomorrow,
 * with no edit here — and one that is never listed is one nobody ever reads.
 */
const AREAS = import.meta.glob<Record<string, Record<string, string>>>("./strings/*.ts", {
  eager: true,
});

const fingerprint = (text: string): string =>
  createHash("sha256").update(text, "utf8").digest("hex").slice(0, 12);

/**
 * key → one fingerprint over that key's value in every locale, in a fixed
 * order. A missing translation hashes differently from an empty one, which is
 * the honest reading: both are things a reviewer should see.
 */
function currentCopy(): Record<string, string> {
  const byKey: Record<string, string[]> = {};
  for (const module of Object.values(AREAS)) {
    for (const area of Object.values(module)) {
      if (typeof area !== "object" || area === null) continue;
      for (const locale of LOCALE_TAGS) {
        const bundle = (area as Record<string, unknown>)[locale];
        if (typeof bundle !== "object" || bundle === null) continue;
        for (const [key, value] of Object.entries(bundle as Record<string, unknown>)) {
          (byKey[key] ??= []).push(`${locale}\x00${String(value)}`);
        }
      }
    }
  }
  return Object.fromEntries(
    Object.entries(byKey).map(([key, parts]) => [key, fingerprint(parts.sort().join("\x01"))]),
  );
}

describe("no copy changes in any language without a reviewer looking at it", () => {
  const current = currentCopy();

  it("reads a whole bundle, in every locale", () => {
    // Guard on the guard. A glob that matched nothing, or a shape that stopped
    // being `{ locale: { key: value } }`, would produce an empty ledger that
    // agrees with an empty file forever.
    expect(Object.keys(current).length, "no message keys were read at all").toBeGreaterThan(300);
    expect(LOCALE_TAGS.length).toBe(8);
  });

  it("matches the reviewed ledger, key for key", () => {
    const reviewed = JSON.parse(readFileSync(LEDGER, "utf8")) as Record<string, string>;

    const added = Object.keys(current).filter((key) => reviewed[key] === undefined);
    const removed = Object.keys(reviewed).filter((key) => current[key] === undefined);
    const changed = Object.keys(current).filter(
      (key) => reviewed[key] !== undefined && reviewed[key] !== current[key],
    );

    if (process.env.UPDATE_COPY_LEDGER === "1") {
      const sorted = Object.fromEntries(Object.entries(current).sort(([a], [b]) => (a < b ? -1 : 1)));
      writeFileSync(LEDGER, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");
      return;
    }

    const report = [
      ...added.map((key) => `  NEW      ${key}`),
      ...changed.map((key) => `  CHANGED  ${key}`),
      ...removed.map((key) => `  GONE     ${key}`),
    ];
    expect(
      report,
      "\nCopy moved. Read these keys in EVERY language, then ask of each new or\n" +
        "changed sentence: does it tell the reader that something costs money, or\n" +
        "that more of the product can be had by paying? v1 is free of charge and\n" +
        "may not raise the subject in any language — and the word lists in\n" +
        "testing/lexicon.ts are a regression set, not coverage.\n\n" +
        report.join("\n") +
        "\n\nWhen you have read them: UPDATE_COPY_LEDGER=1 npx vitest run " +
        "src/i18n/reviewedCopy.test.ts\n",
    ).toEqual([]);
  });

  it("keeps a ledger that is worth comparing against", () => {
    const reviewed = JSON.parse(readFileSync(LEDGER, "utf8")) as Record<string, string>;
    expect(Object.keys(reviewed).length, "the ledger is empty or nearly so").toBeGreaterThan(300);
    // Every entry is a real fingerprint, so a file of nulls cannot pass.
    const malformed = Object.entries(reviewed).filter(([, hash]) => !/^[0-9a-f]{12}$/.test(hash));
    expect(malformed.map(([key]) => key)).toEqual([]);
  });

  it("moves when a single word in a single language moves", () => {
    // The case that says the fingerprint is over all eight and not over the
    // English. Both round-6 plants changed exactly one locale.
    const base = fingerprint(["en-US\x00Order", "de-DE\x00Bestellung"].sort().join("\x01"));
    const plant = fingerprint(
      ["en-US\x00Order", "de-DE\x00Zur kostenpflichtigen Vollversion"].sort().join("\x01"),
    );
    expect(plant).not.toBe(base);
  });
});
