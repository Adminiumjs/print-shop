/**
 * THE ADD-ONS, as Adminium has them for this app (comp `J - Marlow Press
 * Add-ons`: the shelf 942-1021, an add-on's page 1321-1386, the activity
 * 1436-1469, and the connect, manage, disconnect and "where the add-ons
 * appear" dialogs 1492-1698).
 *
 * The shelf lists exactly the add-ons this app names (`addOns.requires` and
 * `addOns.suggests` in its manifest), with Adminium's word on each: installed
 * or not, attached and switched on for the works, connected to its account,
 * its line and kind from the catalogue. Connecting, keys and installing are
 * Adminium's own (its add-ons page opens for them, and the dialog reads the
 * list again when the person comes back); switching an installed add-on on or
 * off for the works is one write of Adminium's. The Customiser is required:
 * it shows as connected and is never switched off here. What an add-on did
 * is Adminium's log of it, and the collections the delivery company booked.
 */
import { useCallback, useEffect, useId, useState } from "react";
import { ArrowLeft, Check, Clock, ExternalLink, History, KeyRound, LayoutPanelTop, ShieldCheck, Unplug, X } from "lucide-react";

import { useData, useEnv, useRun } from "../env.tsx";
import { useFmt } from "../format.ts";
import { go, useWorks } from "../store.ts";
import { Mono } from "../ui.tsx";
import { dayIn } from "../time.ts";
import { text } from "../wire.ts";
import type { ActivityEntry, CatalogEntry, InstalledAddOn, WorksDoor } from "../door.ts";
import { close, Modal } from "./Modal.tsx";
import { ADD_ONS } from "../../manifest/add-ons.ts";
import { useI18n, useT, type MessageKey } from "../../i18n/index.tsx";

/** One add-on on the shelf: the app's word on it, and Adminium's. */
export interface ShelfEntry {
  key: string;
  name: string;
  mono: string;
  required: boolean;
  /** Why the works wants it, as the manifest says it, in the reader's language where it has one. */
  reason: string;
  tagline: string | null;
  category: string | null;
  connectKind: "none" | "api-key" | "oauth2";
  installed: InstalledAddOn | undefined;
  /** Attached to the works, switched on, and its account connected where it needs one. */
  connected: boolean;
}

const CATEGORIES: Record<string, MessageKey> = {
  artwork: "works.addOns.cat.artwork",
  delivery: "works.addOns.cat.delivery",
  payments: "works.addOns.cat.payments",
  email: "works.addOns.cat.email",
  data: "works.addOns.cat.data",
};

/** The slots this app mounts, and what the works and the shop show in each. */
const SLOT_WORDS: Record<string, { where: MessageKey; what: MessageKey }> = {
  "artwork.sources": { where: "works.where.artwork", what: "works.where.artworkWhat" },
  "checkout.delivery.methods": { where: "works.where.checkout", what: "works.where.checkoutWhat" },
  "order.dispatch.panel": { where: "works.where.order", what: "works.where.orderWhat" },
  "order.dispatch.actions": { where: "works.where.dispatch", what: "works.where.dispatchWhat" },
  "settings.add-on.panel": { where: "works.where.settings", what: "works.where.settingsWhat" },
};

/** Two or three capitals for an add-on's tile, from the catalogue's or its name. */
const monoOf = (name: string, catalogue: string | null): string =>
  catalogue ??
  name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toLocaleUpperCase())
    .join("");

/** The shelf, from the app's own list and what Adminium answered. */
export function useShelf(): ShelfEntry[] {
  const { locale } = useI18n();
  const installed = useWorks((s) => s.installed) ?? [];
  const catalog = useWorks((s) => s.catalog) ?? [];
  const named = [...ADD_ONS.requires.map((a) => ({ ...a, required: true })), ...ADD_ONS.suggests.map((a) => ({ ...a, required: false }))];
  return named.map((a) => {
    const here = installed.find((i) => i.key === a.key);
    const listed: CatalogEntry | undefined = catalog.find((c) => c.key === a.key);
    const name = here?.name ?? listed?.name ?? a.key;
    const kind = here?.connectKind ?? listed?.connectKind ?? "none";
    const reason = (a.reason as Record<string, string | undefined>)[locale] ?? a.reason["en-US"];
    return {
      key: a.key,
      name,
      mono: monoOf(name, listed?.monogram ?? null),
      required: a.required,
      reason,
      tagline: listed?.tagline ?? null,
      category: listed?.categories[0] ?? null,
      connectKind: kind,
      installed: here,
      connected: here !== undefined && here.attached && here.enabled && !here.missing && (kind === "none" || here.connected),
    };
  });
}

/** Read Adminium's list and catalogue again. */
export async function refreshShelf(door: WorksDoor): Promise<void> {
  const [installed, catalog] = await Promise.all([door.addOns(), door.catalog()]);
  useWorks.setState({ installed, catalog });
}

/** The shelf read on opening, and again whenever the person comes back to this tab (from Adminium's add-ons page). */
function useShelfReads(): void {
  const { door } = useEnv();
  useEffect(() => {
    const read = () => void refreshShelf(door).catch(() => undefined);
    read();
    window.addEventListener("focus", read);
    return () => window.removeEventListener("focus", read);
  }, [door]);
}

/**
 * WHO ELSE IS INVOLVED, on every surface that names an add-on that reaches a
 * company outside this Adminium (it lists an address it may reach): the works
 * is not affiliated with it. An add-on that reaches nothing says nothing.
 */
function Affiliation({ entry }: { entry: ShelfEntry }) {
  const t = useT();
  const data = useData();
  if ((entry.installed?.networkAllow ?? []).length === 0) return null;
  return <span className="wk-affiliation wk-affiliation--bare">{t("works.addOn.notAffiliated", { works: text(data.settings?.["works_name"]) ?? "", name: entry.name })}</span>;
}

function CategoryChip({ category }: { category: string | null }) {
  const t = useT();
  if (category === null) return null;
  return <span className="wk-addon-cat">{CATEGORIES[category] === undefined ? category : t(CATEGORIES[category]!)}</span>;
}

function Tile({ entry, big = false }: { entry: ShelfEntry; big?: boolean }) {
  return (
    <span className={`wk-addon-tile${big ? " wk-addon-tile--big" : ""}`} aria-hidden="true">
      {entry.mono}
    </span>
  );
}

function Needs({ entry }: { entry: ShelfEntry }) {
  const t = useT();
  return (
    <div className="wk-needs">
      <Mono className="wk-need">{t(entry.connectKind === "none" ? "works.addOns.noAccount" : "works.addOns.account")}</Mono>
      {entry.required && <Mono className="wk-need">{t("works.addOns.required")}</Mono>}
    </div>
  );
}

export function AddOnsScreen() {
  const t = useT();
  useShelfReads();
  const shelf = useShelf();
  const category = useWorks((s) => s.category);
  const loaded = useWorks((s) => s.installed) !== null;
  const cats = ["all", ...new Set(shelf.flatMap((e) => (e.category === null ? [] : [e.category])))];
  const inCat = (e: ShelfEntry) => category === "all" || e.category === category;
  const connected = shelf.filter((e) => e.connected && inCat(e));
  const available = shelf.filter((e) => !e.connected && inCat(e));

  return (
    <section className="wk-screen wk-addons" aria-labelledby="wk-addons-title">
      <div className="wk-head wk-head--tight">
        <h1 className="wk-h1" id="wk-addons-title">
          {t("works.addOns.title")}
        </h1>
        <div className="wk-head-end wk-head-buttons">
          <button type="button" className="wk-btn wk-btn--small wk-btn--edit" onClick={() => useWorks.setState({ overlay: { kind: "holes" } })}>
            <LayoutPanelTop size={14} aria-hidden="true" />
            {t("works.addOns.where")}
          </button>
          {shelf.some((e) => e.connected) && (
            <button type="button" className="wk-btn wk-btn--small wk-btn--edit" onClick={() => go("activity")}>
              <History size={14} aria-hidden="true" />
              {t("works.addOns.activity")}
            </button>
          )}
        </div>
      </div>
      <p className="wk-lede">{t("works.addOns.lede")}</p>
      {!loaded ? (
        <div role="status" aria-busy="true" className="wk-skel wk-skel--title">
          <span className="wk-sr">{t("works.loading")}</span>
        </div>
      ) : (
        <div className="wk-addons-grid">
          <nav className="wk-cats" aria-label={t("works.addOns.cats")}>
            {cats.map((c) => (
              <button key={c} type="button" className="wk-cat" aria-current={category === c ? "true" : undefined} onClick={() => useWorks.setState({ category: c })}>
                <span>{c === "all" ? t("works.addOns.cat.all") : CATEGORIES[c] === undefined ? c : t(CATEGORIES[c]!)}</span>
                <Mono className="wk-cat-n">{c === "all" ? shelf.length : shelf.filter((e) => e.category === c).length}</Mono>
              </button>
            ))}
          </nav>
          <div className="wk-addons-lists">
            <div>
              <div className="wk-addons-subhead">
                <h2>{t("works.addOns.connected")}</h2>
                <Mono>{connected.length}</Mono>
              </div>
              {connected.length === 0 ? (
                <div className="wk-empty">
                  <div className="wk-empty-title">{t("works.addOns.none")}</div>
                  <div className="wk-empty-body">{t("works.addOns.noneBody")}</div>
                </div>
              ) : (
                <ul className="wk-addon-rows" role="list">
                  {connected.map((e) => (
                    <li key={e.key} className="wk-addon-row">
                      <Tile entry={e} />
                      <div className="wk-addon-row-text">
                        <div className="wk-addon-row-name">
                          <span>{e.name}</span>
                          <span className="wk-chip-pos">
                            <Check size={11} aria-hidden="true" />
                            {t("works.addOns.isConnected")}
                          </span>
                        </div>
                        <div className="wk-addon-row-line">{e.reason}</div>
                        <Affiliation entry={e} />
                      </div>
                      <div className="wk-addon-row-end">
                        <Mono className="wk-addon-version">{t("works.addOns.version", { version: e.installed?.version ?? "" })}</Mono>
                        <button type="button" className="wk-btn wk-btn--small" aria-label={t("works.addOns.detailsAria", { name: e.name })} onClick={() => go("addon", { addOnKey: e.key })}>
                          {t("works.addOns.details")}
                        </button>
                        <button type="button" className="wk-btn wk-btn--small" aria-label={t("works.addOns.manageAria", { name: e.name })} onClick={() => useWorks.setState({ overlay: { kind: "manage", key: e.key } })}>
                          {t("works.addOns.manage")}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <div className="wk-addons-subhead">
                <h2>{t("works.addOns.available")}</h2>
                <Mono>{available.length}</Mono>
              </div>
              <ul className="wk-addon-cards" role="list">
                {available.map((e) => (
                  <li key={e.key} className="wk-addon-card">
                    <div className="wk-addon-card-top">
                      <Tile entry={e} />
                      <div>
                        <div className="wk-addon-card-name">{e.name}</div>
                        <CategoryChip category={e.category} />
                      </div>
                    </div>
                    <div className="wk-addon-card-body">{e.tagline === null ? e.reason : `${e.tagline} ${e.reason}`}</div>
                    <Needs entry={e} />
                    <Affiliation entry={e} />
                    <div className="wk-addon-card-actions">
                      <button type="button" className="wk-btn wk-btn--primary wk-grow" aria-label={t("works.addOns.connectAria", { name: e.name })} onClick={() => useWorks.setState({ overlay: { kind: "connect", key: e.key } })}>
                        {t("works.addOns.connect")}
                      </button>
                      <button type="button" className="wk-btn wk-btn--small" aria-label={t("works.addOns.whatAria", { name: e.name })} onClick={() => go("addon", { addOnKey: e.key })}>
                        {t("works.addOns.what")}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/** Where an add-on shows, from the slots, pages and panels Adminium lists for it. */
function useAppears(entry: ShelfEntry): { where: string; what: string }[] {
  const t = useT();
  if (entry.installed === undefined) return [{ where: t("works.where.notYet"), what: t("works.where.notYetWhat") }];
  return [
    ...entry.installed.slots.flatMap((slot) => (SLOT_WORDS[slot] === undefined ? [] : [{ where: t(SLOT_WORDS[slot]!.where), what: t(SLOT_WORDS[slot]!.what) }])),
    ...entry.installed.pages.map(() => ({ where: t("works.where.page"), what: t("works.where.pageWhat") })),
    ...entry.installed.panels.map(() => ({ where: t("works.where.panel"), what: t("works.where.panelWhat") })),
  ].filter((row, i, all) => all.findIndex((r) => r.where === row.where && r.what === row.what) === i);
}

/** What an add-on will be able to do: its account, and the one address it may reach. */
function useCan(entry: ShelfEntry): string[] {
  const t = useT();
  const hosts = entry.installed?.networkAllow ?? [];
  return [
    t(entry.connectKind === "api-key" ? "works.can.keys" : entry.connectKind === "oauth2" ? "works.can.account" : "works.can.none"),
    t("works.can.tables"),
    ...(hosts.length === 0 ? [t("works.can.noNetwork")] : hosts.map((host) => t("works.can.network", { host }))),
  ];
}

export function AddOnScreen() {
  const t = useT();
  useShelfReads();
  const key = useWorks((s) => s.addOnKey);
  const entry = useShelf().find((e) => e.key === key);
  const appears = useAppearsSafe(entry);
  const can = useCanSafe(entry);
  if (entry === undefined) {
    return (
      <section className="wk-screen wk-narrow">
        <div className="wk-empty">
          <div className="wk-empty-title">{t("works.addOn.none")}</div>
          <button type="button" className="wk-btn" onClick={() => go("addons")}>
            {t("works.addOns.all")}
          </button>
        </div>
      </section>
    );
  }
  return (
    <section className="wk-screen wk-addon" aria-labelledby="wk-addon-name">
      <button type="button" className="wk-back" onClick={() => go("addons")}>
        <ArrowLeft size={15} className="wk-flip" aria-hidden="true" />
        {t("works.addOns.all")}
      </button>
      <div className="wk-addon-head">
        <Tile entry={entry} big />
        <div>
          <h1 className="wk-h1" id="wk-addon-name">
            {entry.name}
          </h1>
          <div className="wk-addon-chips">
            <CategoryChip category={entry.category} />
            {entry.connected && (
              <span className="wk-chip-pos">
                <Check size={11} aria-hidden="true" />
                {t("works.addOns.isConnected")}
              </span>
            )}
          </div>
        </div>
        <div className="wk-head-end wk-head-buttons">
          {!entry.connected && (
            <button type="button" className="wk-btn wk-btn--primary" onClick={() => useWorks.setState({ overlay: { kind: "connect", key: entry.key } })}>
              {t("works.addOns.connect")}
            </button>
          )}
          {entry.connected && (
            <button type="button" className="wk-btn" onClick={() => useWorks.setState({ overlay: { kind: "manage", key: entry.key } })}>
              {t("works.addOns.manage")}
            </button>
          )}
        </div>
      </div>
      <div className="wk-addon-panels">
        <div className="wk-panel wk-addon-panel">
          <h2 className="wk-panel-head wk-panel-head--plain">{t("works.addOn.does")}</h2>
          {entry.tagline !== null && <p className="wk-addon-p">{entry.tagline}</p>}
          <p className="wk-addon-p">{entry.reason}</p>
          <Needs entry={entry} />
        </div>
        <div className="wk-panel wk-addon-panel">
          <h2 className="wk-panel-head wk-panel-head--plain">{t("works.addOn.appears")}</h2>
          <dl className="wk-appears">
            {appears.map((row, i) => (
              <div key={i} className="wk-appears-row">
                <dt className="wk-mono">{row.where}</dt>
                <dd>{row.what}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="wk-panel wk-addon-panel">
          <h2 className="wk-panel-head wk-panel-head--plain">{t("works.addOn.can")}</h2>
          <ul className="wk-can" role="list">
            {can.map((line, i) => (
              <li key={i}>
                <Check size={15} aria-hidden="true" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <div className="wk-addon-foot">
            <span>{t(entry.required ? "works.addOn.requiredNote" : "works.addOn.anyTime")}</span>
            <Affiliation entry={entry} />
          </div>
        </div>
      </div>
    </section>
  );
}

// Hooks called before the early return: an add-on page that is not there still calls them, on an empty entry.
const EMPTY: ShelfEntry = { key: "", name: "", mono: "", required: false, reason: "", tagline: null, category: null, connectKind: "none", installed: undefined, connected: false };
function useAppearsSafe(entry: ShelfEntry | undefined) {
  return useAppears(entry ?? EMPTY);
}
function useCanSafe(entry: ShelfEntry | undefined) {
  return useCan(entry ?? EMPTY);
}

/** What the add-ons did, as Adminium's log and the delivery company's bookings say it, newest first. */
export function useActivity(): { entries: ActivityEntry[]; loaded: boolean } {
  const data = useData();
  const { door } = useEnv();
  const [log, setLog] = useState<ActivityEntry[] | null>(null);
  useEffect(() => {
    let live = true;
    void door
      .activity()
      .then((entries) => live && setLog(entries))
      .catch(() => live && setLog([]));
    return () => {
      live = false;
    };
  }, [door]);
  const carrier = door.facts().carrier;
  const booked: ActivityEntry[] =
    carrier === null
      ? []
      : data.shipments.flatMap((s) => {
          const at = Date.parse(String(s["created_at"] ?? ""));
          return Number.isNaN(at) ? [] : [{ id: `shipment-${String(s.id)}`, at, addOn: carrier.key, action: "booked", by: [text(s["service"]), text(s["tracking"])].filter(Boolean).join(" · "), ref: text(s["order_reference"]) }];
        });
  return { entries: [...(log ?? []), ...booked].sort((a, b) => b.at - a.at), loaded: log !== null };
}

const ACTION_WORDS: Record<string, MessageKey> = {
  connected: "works.activity.connected",
  disconnected: "works.activity.disconnected",
  enabled: "works.activity.enabled",
  attached: "works.activity.attached",
  installed: "works.activity.installed",
  "settings-changed": "works.activity.settings",
  uninstalled: "works.activity.uninstalled",
  booked: "works.activity.booked",
};

export function useActivityWords(): (entry: ActivityEntry) => string {
  const t = useT();
  return (entry) => t(ACTION_WORDS[entry.action] ?? "works.activity.other", { by: entry.by });
}

export function ActivityScreen() {
  const t = useT();
  const fmt = useFmt();
  const { door } = useEnv();
  useShelfReads();
  const shelf = useShelf();
  const filter = useWorks((s) => s.activityFilter);
  const words = useActivityWords();
  const { entries, loaded } = useActivity();
  const zone = door.facts().zone;
  const live = shelf.filter((e) => e.connected);
  const mine = entries.filter((e) => live.some((l) => l.key === e.addOn));
  const shown = mine.filter((e) => filter === "all" || e.addOn === filter);
  const days: { day: string; items: ActivityEntry[] }[] = [];
  for (const entry of shown) {
    const day = dayIn(entry.at, zone);
    const found = days.find((d) => d.day === day);
    if (found === undefined) days.push({ day, items: [entry] });
    else found.items.push(entry);
  }
  const filters = [{ key: "all", name: t("works.addOns.cat.all") }, ...live.map((e) => ({ key: e.key, name: e.name }))];

  return (
    <section className="wk-screen wk-activity" aria-labelledby="wk-activity-title">
      <button type="button" className="wk-back" onClick={() => go("addons")}>
        <ArrowLeft size={15} className="wk-flip" aria-hidden="true" />
        {t("works.addOns.all")}
      </button>
      <h1 className="wk-h1" id="wk-activity-title">
        {t("works.activity.title")}
      </h1>
      <p className="wk-lede">{t("works.activity.lede")}</p>
      <div className="wk-filters" role="group" aria-label={t("works.activity.filters")}>
        {filters.map((f) => (
          <button key={f.key} type="button" className="wk-filter" aria-pressed={filter === f.key} onClick={() => useWorks.setState({ activityFilter: f.key })}>
            {f.name}
            <Mono className="wk-cat-n">{f.key === "all" ? mine.length : mine.filter((e) => e.addOn === f.key).length}</Mono>
          </button>
        ))}
      </div>
      {loaded && shown.length === 0 && <div className="wk-empty wk-empty-body">{t("works.activity.empty")}</div>}
      {days.map((d) => (
        <div key={d.day} className="wk-act-day">
          <h2 className="wk-group-title">{fmt.dayHeading(d.day)}</h2>
          <ul className="wk-act-list" role="list">
            {d.items.map((entry) => {
              const by = shelf.find((e) => e.key === entry.addOn);
              return (
                <li key={entry.id} className="wk-act-row">
                  <Mono className="wk-act-time">{fmt.time(entry.at)}</Mono>
                  <span className="wk-addon-tile wk-addon-tile--small" aria-hidden="true">
                    {by?.mono ?? ""}
                  </span>
                  <span className="wk-act-text">
                    {by === undefined ? "" : `${by.name} · `}
                    {words(entry)}
                  </span>
                  {entry.ref !== null && <Mono className="wk-act-ref">{entry.ref}</Mono>}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <p className="wk-price-note">
        <Clock size={14} aria-hidden="true" />
        {t("works.activity.note")}
      </p>
    </section>
  );
}

// ── the dialogs ───────────────────────────────────────────────────────────

export function AddOnOverlays() {
  const overlay = useWorks((s) => s.overlay);
  const shelf = useShelf();
  if (overlay === null) return null;
  if (overlay.kind === "holes") return <WhereTheyAppear shelf={shelf} />;
  if (overlay.kind !== "connect" && overlay.kind !== "manage" && overlay.kind !== "disconnect") return null;
  const entry = shelf.find((e) => e.key === overlay.key);
  if (entry === undefined) return null;
  if (overlay.kind === "connect") return <ConnectDialog entry={entry} />;
  if (overlay.kind === "manage") return <ManageSheet entry={entry} />;
  return <DisconnectDialog entry={entry} />;
}

function ConnectDialog({ entry }: { entry: ShelfEntry }) {
  const t = useT();
  const env = useEnv();
  const { busy, run } = useRun();
  const titleId = useId();
  const can = useCan(entry);
  const here = entry.installed;
  const ready = here !== undefined && !here.missing && (entry.connectKind === "none" || here.connected);
  const connect = () =>
    run(async (door) => {
      await door.setAddOn(entry.key, true);
      await refreshShelf(door);
      close();
      return t("works.connect.done", { name: entry.name });
    });
  return (
    <Modal kind="wide" labelledBy={titleId}>
      <div className="wk-sheet-head">
        <span className="wk-addon-head-inline">
          <Tile entry={entry} />
          <h2 className="wk-sheet-title" id={titleId}>
            {t("works.connect.title", { name: entry.name })}
          </h2>
        </span>
        <button type="button" className="wk-close" aria-label={t("works.close")} onClick={close}>
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="wk-sheet-body">
        <p className="wk-sheet-lede">{entry.tagline ?? entry.reason}</p>
        <div>
          <div className="wk-group-title">{t("works.addOn.can")}</div>
          <ul className="wk-can wk-can--boxed" role="list">
            {can.map((line, i) => (
              <li key={i}>
                <Check size={15} aria-hidden="true" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="wk-creds">
          <div className="wk-group-title">{t(here === undefined ? "works.connect.install" : "works.connect.account")}</div>
          <p className="wk-sheet-lede">{t(here === undefined ? "works.connect.installLede" : entry.connectKind === "none" ? "works.connect.noAccount" : "works.connect.keys", { name: entry.name })}</p>
          {ready ? (
            <div className="wk-done">
              <ShieldCheck size={17} aria-hidden="true" />
              {t(here?.attached === true && here.enabled ? "works.addOns.isConnected" : "works.connect.ready")}
            </div>
          ) : (
            <a className="wk-btn wk-btn--link" href={env.addOnsHref} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={14} aria-hidden="true" />
              {t("works.connect.open", { name: entry.name })}
            </a>
          )}
        </div>
        <span className="wk-muted">{t("works.addOn.anyTime")}</span>
        <Affiliation entry={entry} />
      </div>
      <div className="wk-sheet-foot wk-sheet-foot--end">
        <button type="button" className="wk-btn" onClick={close}>
          {t("works.cancel")}
        </button>
        <button type="button" className={`wk-btn wk-btn--primary${ready ? "" : " wk-btn--off"}`} disabled={!ready || busy} onClick={() => void connect()}>
          {t("works.connect.title", { name: entry.name })}
        </button>
      </div>
    </Modal>
  );
}

function ManageSheet({ entry }: { entry: ShelfEntry }) {
  const t = useT();
  const fmt = useFmt();
  const env = useEnv();
  const titleId = useId();
  const can = useCan(entry);
  const words = useActivityWords();
  const { entries } = useActivity();
  const recent = entries.filter((e) => e.addOn === entry.key).slice(0, 3);
  const seeAll = useCallback(() => {
    useWorks.setState({ activityFilter: entry.key });
    go("activity");
  }, [entry.key]);
  return (
    <Modal kind="sheet" labelledBy={titleId}>
      <div className="wk-sheet-head">
        <span className="wk-addon-head-inline">
          <Tile entry={entry} />
          <span>
            <h2 className="wk-sheet-title" id={titleId}>
              {entry.name}
            </h2>
            <span className="wk-chip-pos wk-chip-pos--bare">
              <Check size={11} aria-hidden="true" />
              {t("works.addOns.isConnected")}
            </span>
          </span>
        </span>
        <button type="button" className="wk-close" aria-label={t("works.close")} onClick={close}>
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="wk-sheet-body">
        <div>
          <div className="wk-group-title">{t("works.manage.can")}</div>
          <ul className="wk-can" role="list">
            {can.map((line, i) => (
              <li key={i}>
                <Check size={15} aria-hidden="true" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="wk-group-title">{t("works.manage.settings")}</div>
          <div className="wk-manage-keys">
            <KeyRound size={17} aria-hidden="true" />
            <span className="wk-grow">
              <span className="wk-cell-strong">{t("works.manage.kept")}</span>
              <span className="wk-cell-sub">{t("works.manage.keptLede")}</span>
            </span>
            <a className="wk-btn wk-btn--link" href={env.addOnsHref} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={14} aria-hidden="true" />
              {t("works.connect.open", { name: entry.name })}
            </a>
          </div>
        </div>
        <div>
          <div className="wk-manage-recent-head">
            <span className="wk-group-title">{t("works.manage.recent")}</span>
            <button type="button" className="wk-inline-link" onClick={seeAll}>
              {t("works.manage.seeAll")}
            </button>
          </div>
          {recent.length === 0 ? (
            <div className="wk-muted">{t("works.activity.empty")}</div>
          ) : (
            recent.map((e) => (
              <div key={e.id} className="wk-manage-recent wk-mono">
                {t("works.manage.recentLine", { day: fmt.moment(new Date(e.at).toISOString()), time: fmt.time(e.at), what: words(e) })}
              </div>
            ))
          )}
        </div>
        <Affiliation entry={entry} />
      </div>
      {!entry.required && (
        <div className="wk-sheet-foot">
          <button type="button" className="wk-btn wk-btn--danger-outline wk-grow" onClick={() => useWorks.setState({ overlay: { kind: "disconnect", key: entry.key } })}>
            {t("works.manage.disconnect", { name: entry.name })}
          </button>
        </div>
      )}
    </Modal>
  );
}

function DisconnectDialog({ entry }: { entry: ShelfEntry }) {
  const t = useT();
  const { busy, run } = useRun();
  const titleId = useId();
  const lineId = useId();
  const disconnect = () =>
    run(async (door) => {
      await door.setAddOn(entry.key, false);
      await refreshShelf(door);
      close();
      return t("works.disconnect.done", { name: entry.name });
    });
  return (
    <Modal labelledBy={titleId} describedBy={lineId} alert>
      <span className="wk-dialog-icon wk-dialog-icon--danger" aria-hidden="true">
        <Unplug size={19} />
      </span>
      <h2 className="wk-dialog-title" id={titleId}>
        {t("works.disconnect.title", { name: entry.name })}
      </h2>
      <p className="wk-dialog-text" id={lineId}>
        {t("works.disconnect.line")}
      </p>
      <Affiliation entry={entry} />
      <div className="wk-dialog-foot">
        <button type="button" className="wk-btn wk-btn--danger wk-grow" disabled={busy} onClick={() => void disconnect()}>
          {t("works.disconnect.do")}
        </button>
        <button type="button" className="wk-btn" onClick={close}>
          {t("works.cancel")}
        </button>
      </div>
    </Modal>
  );
}

/** The three panels of the shop drawn with the hole in them, and what fills each now. */
function WhereTheyAppear({ shelf }: { shelf: ShelfEntry[] }) {
  const t = useT();
  const titleId = useId();
  const filling = (slot: string) => shelf.filter((e) => e.connected && (e.installed?.slots.includes(slot) ?? false)).map((e) => e.name);
  const holes: { where: MessageKey; names: string[]; full: [MessageKey, MessageKey]; empty: [MessageKey, MessageKey] }[] = [
    { where: "works.where.artwork", names: filling("artwork.sources"), full: ["works.holes.artwork", "works.holes.artworkFull"], empty: ["works.holes.artwork", "works.holes.artworkEmpty"] },
    { where: "works.where.checkout", names: filling("checkout.delivery.methods"), full: ["works.holes.checkout", "works.holes.checkoutFull"], empty: ["works.holes.checkoutNone", "works.holes.checkoutEmpty"] },
    { where: "works.where.orderDispatch", names: filling("order.dispatch.panel"), full: ["works.holes.dispatch", "works.holes.dispatchFull"], empty: ["works.holes.dispatch", "works.holes.dispatchEmpty"] },
  ];
  return (
    <Modal kind="wide" labelledBy={titleId}>
      <div className="wk-sheet-head">
        <span>
          <h2 className="wk-sheet-title" id={titleId}>
            {t("works.holes.title")}
          </h2>
          <span className="wk-cell-sub">{t("works.holes.lede")}</span>
        </span>
        <button type="button" className="wk-close" aria-label={t("works.close")} onClick={close}>
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="wk-sheet-body">
        {holes.map((h) => {
          const full = h.names.length > 0;
          const [title, body] = full ? h.full : h.empty;
          return (
            <div key={h.where}>
              <div className="wk-hole-where">
                <Mono className="wk-cell-sub">{t(h.where)}</Mono>
                <span className={full ? "wk-chip-pos wk-chip-pos--bare" : "wk-chip-empty"}>{t(full ? "works.holes.filled" : "works.holes.empty")}</span>
              </div>
              <div className={`wk-hole${full ? " wk-hole--full" : ""}`}>
                <div className="wk-cell-strong">{t(title)}</div>
                <div className="wk-cell-muted">{t(body, { names: h.names.join(", ") })}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
