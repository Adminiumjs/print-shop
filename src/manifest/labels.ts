/**
 * Every word the manifest shows a person, in the eight languages the app
 * ships.
 *
 * The manifest is written in English (`tables.ts`, `pages.ts` …) and each
 * English label is looked up in `words.ts` when `manifest.json` is written.
 * A label with no entry there is written in English alone and listed by
 * `untranslated()`; the drift test holds that list to what it was, so a new
 * label cannot slip in untranslated once the words are in.
 */
import { WORDS } from "./words.ts";

export const LOCALES = ["en-US", "de-DE", "fr-FR", "da-DK", "cs-CZ", "ar-EG", "zh-CN", "zh-TW"] as const;
export type Tag = (typeof LOCALES)[number];
export type Labels = { "en-US": string } & Partial<Record<Exclude<Tag, "en-US">, string>>;

/** The seven languages beside English, as a translation carries them. */
export type Translation = Record<Exclude<Tag, "en-US">, string>;

/** English labels asked for while writing that have no translation yet. */
const missing = new Set<string>();

/** One label in every language it has. */
export function l(en: string): Labels {
  const found = WORDS[en];
  if (found === undefined) {
    missing.add(en);
    return { "en-US": en };
  }
  return { "en-US": en, ...found };
}

/** A page's other seven titles, keyed as `titles` wants them. */
export function titles(en: string): Partial<Translation> {
  const { "en-US": _en, ...rest } = l(en);
  return rest;
}

/** Every English label asked for that has no translation, sorted. */
export function untranslated(): string[] {
  return [...missing].sort();
}
