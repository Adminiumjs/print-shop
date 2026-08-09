/*
 * VENDORED from add-on-design-studio/src/ui/useHostLocale.ts — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the add-on repo and re-run `sync-add-ons.sh sync`.
 * The add-on key is `design-studio`; its manifest, tests and README live in that repo.
 */
import { useEffect, useMemo, useState } from "react";

import { DEFAULT_LOCALE, isLocaleTag, translator, type LocaleTag, type T } from "../i18n/strings.ts";

/**
 * The reader's language, taken from the host's own `<html lang>`.
 *
 * A slot fill is handed a payload and nothing else — no context, no `t`, no
 * locale — so an add-on that wants to speak the customer's language has to read
 * it from somewhere. `<html lang>` is the right somewhere: the host's i18n
 * provider stamps it on every locale change as its single source of truth, it
 * is what screen readers and CSS already believe, and reading it needs no API
 * the host would have to agree to keep.
 *
 * The observer is what makes the language picker work while the editor is open.
 * Without it the add-on would be correct exactly once, at mount, and then
 * quietly wrong for the rest of the session.
 */
export function useHostLocale(): LocaleTag {
  const [locale, setLocale] = useState<LocaleTag>(read);

  useEffect(() => {
    const observer = new MutationObserver(() => setLocale(read()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    return () => observer.disconnect();
  }, []);

  return locale;
}

/** The translate function for this add-on's own bundle, in the host's language. */
export function useHostT(): T {
  const locale = useHostLocale();
  return useMemo(() => translator(locale), [locale]);
}

function read(): LocaleTag {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const tag = document.documentElement.getAttribute("lang");
  return isLocaleTag(tag) ? tag : DEFAULT_LOCALE;
}
