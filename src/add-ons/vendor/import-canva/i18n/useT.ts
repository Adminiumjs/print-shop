/*
 * VENDORED from add-on-import-canva/src/i18n/useT.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the add-on repo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `import-canva`; its manifest, tests and README live in that repo.
 */
/**
 * The React half of the translator, and the only module in `src/i18n/` that
 * imports React.
 *
 * It is separate from `t.ts` so the `artwork-source@1` implementation — which
 * needs `t()` for `label()` and is reachable from the manifest's
 * `provides[].server` entry — can be bundled without dragging a renderer into
 * an output that never renders anything. `built-output.test.ts` asserts that
 * no `dist/server/**` file imports React, which is the check that keeps this
 * file from quietly being merged back.
 *
 * `useAddOnT` SUBSCRIBES to the host's `lang` attribute rather than reading it
 * during render. The host stamps it in an effect, i.e. AFTER the render that
 * changed the locale, so a translator that only read it would show one stale
 * frame of the previous language on every switch.
 */

import { useMemo, useSyncExternalStore } from "react";

import {
  DEFAULT_LOCALE,
  currentTag,
  makeT,
  resolveLocale,
  subscribeToLang,
  type LocaleTag,
  type TFunction,
} from "./t.ts";

export function useLocale(): LocaleTag {
  return resolveLocale(
    useSyncExternalStore(subscribeToLang, currentTag, () => DEFAULT_LOCALE),
  );
}

export function useAddOnT(): TFunction {
  const locale = useLocale();
  return useMemo(() => makeT(locale), [locale]);
}
