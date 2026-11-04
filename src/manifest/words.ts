/**
 * The manifest's labels in the seven languages beside English, keyed by the
 * English label (see `labels.ts`).
 *
 * Empty for now: every label is written in English alone, and the drift test
 * holds the list of English-only labels to `untranslated-labels.json`, so the
 * list can only shrink. The translations arrive with the app's languages.
 */
import type { Translation } from "./labels.ts";

export const WORDS: Record<string, Translation> = {};
