/**
 * The demo dock: persona segment, the pinned clock, "+1 working day", the
 * theme toggle, the locale picker, and — once add-ons are compiled in — one
 * toggle per add-on.
 *
 * THE ADD-ON TOGGLES ARE THE MOST IMPORTANT INTERACTION IN THIS APP. A reviewer
 * has to be able to watch a feature arrive and leave: turning one on makes its
 * surfaces appear where the empty panels were, turning it off puts the empty
 * panels back, and neither direction leaves a leftover button or a dead link.
 * They drive the same `enabled` set the Add-ons screen's Connect/Disconnect
 * buttons drive, so the two controls can never disagree.
 *
 * The dock is fixed, and it MUST NOT COVER A PRIMARY ACTION: on a narrow
 * viewport the configurator's quote bar and the ticket's action row both sit
 * low, so the dock lifts clear of them rather than sitting on top.
 */

import { Clock, FastForward, Globe, Moon, Sun } from "lucide-react";

import { isConnectable } from "../add-ons/host.ts";
import { LOCALES, LOCALE_TAGS, useI18n, useT } from "../i18n/index.tsx";
import { clock, day } from "../lib/format.ts";
import { useStore } from "../state/store.ts";

export function ThemeToggle() {
  const t = useT();
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const dark = theme === "dark";

  return (
    <button
      type="button"
      className="mp-iconbtn mp-btn"
      aria-label={dark ? t("chrome.theme.toLight") : t("chrome.theme.toDark")}
      title={dark ? t("chrome.theme.toLight") : t("chrome.theme.toDark")}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {dark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
    </button>
  );
}

/**
 * Languages listed in their own language, always — a reader looking for
 * `العربية` should not have to find it under "Arabic".
 */
export function LocalePicker() {
  const t = useT();
  const { locale, setLocale } = useI18n();

  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <Globe
        size={15}
        aria-hidden="true"
        style={{
          position: "absolute",
          insetInlineStart: 9,
          pointerEvents: "none",
          color: "var(--fg-subtle)",
        }}
      />
      <select
        className="mp-input mp-fld"
        aria-label={t("chrome.dock.language")}
        value={locale}
        onChange={(e) => setLocale(e.target.value as (typeof LOCALE_TAGS)[number])}
        style={{
          paddingInlineStart: 28,
          paddingBlock: 7,
          fontSize: 12.5,
          fontWeight: 600,
          inlineSize: "auto",
          borderRadius: 9,
        }}
      >
        {LOCALE_TAGS.map((tag) => (
          <option key={tag} value={tag}>
            {LOCALES[tag].native}
          </option>
        ))}
      </select>
    </span>
  );
}

export function DemoDock() {
  const t = useT();
  const persona = useStore((s) => s.persona);
  const setPersona = useStore((s) => s.setPersona);
  const view = useStore((s) => s.view);
  const now = useStore((s) => s.now);
  const dayOffset = useStore((s) => s.dayOffset);
  const todayIso = useStore((s) => s.todayIso);
  const advanceDay = useStore((s) => s.advanceDay);
  const resetDay = useStore((s) => s.resetDay);
  const toast = useStore((s) => s.toast);
  const registry = useStore((s) => s.registry);
  const enabled = useStore((s) => s.enabled);
  const toggleAddOn = useStore((s) => s.toggleAddOn);

  const iso = todayIso();

  // Only what a reviewer can actually watch arrive and leave. The shelf's
  // described-but-not-built entries get no toggle, because a switch that
  // reveals nothing is the same broken promise as a button that does nothing.
  const toggleable = registry.all.filter(isConnectable);

  /*
   * Views whose primary action sits at the bottom of a narrow viewport. On
   * those the dock lifts above the bar instead of covering it — rule (1) of the
   * comp's four layout rules, and the one a fixed dock gets wrong by default.
   */
  const lifted = view === "configure" || view === "ticket";

  return (
    <div className="mp-dock" data-lifted={lifted} role="region" aria-label={t("chrome.dock.label")}>
      <span className="mp-dock-label">{t("chrome.dock.label")}</span>

      <div className="mp-seg">
        <button
          type="button"
          aria-pressed={persona === "customer"}
          onClick={() => setPersona("customer")}
        >
          {t("chrome.dock.customer")}
        </button>
        <button type="button" aria-pressed={persona === "shop"} onClick={() => setPersona("shop")}>
          {t("chrome.dock.shop")}
        </button>
      </div>

      <button
        type="button"
        className="mp-dock-chip mp-btn mp-mono"
        title={t("chrome.dock.clockTitle")}
        onClick={() => {
          if (dayOffset === 0) return;
          resetDay();
          toast(t("toast.clockReset", { day: day(now.iso) }));
        }}
      >
        <Clock size={13} aria-hidden="true" />
        {clock(iso, now.hour, now.minute)}
      </button>

      <button
        type="button"
        className="mp-dock-chip mp-btn"
        onClick={() => {
          advanceDay();
          toast(t("toast.dayAdvanced", { day: day(useStore.getState().todayIso()) }));
        }}
      >
        <FastForward size={13} aria-hidden="true" />
        {t("chrome.dock.advance")}
      </button>

      {toggleable.length > 0 && (
        <div className="mp-dock-toggles">
          {toggleable.map((addOn) => (
            <button
              key={addOn.key}
              type="button"
              className="mp-toggle mp-btn"
              aria-pressed={enabled.has(addOn.key)}
              onClick={() => {
                const wasOn = enabled.has(addOn.key);
                toggleAddOn(addOn.key);
                toast(
                  wasOn
                    ? t("toast.addonDisconnected", { name: addOn.name })
                    : t("toast.addonConnected", { name: addOn.name }),
                  wasOn ? "neutral" : "pos",
                );
              }}
            >
              <span className="mp-toggle-dot" aria-hidden="true" />
              {addOn.shortName}
            </button>
          ))}
        </div>
      )}

      <ThemeToggle />
    </div>
  );
}
