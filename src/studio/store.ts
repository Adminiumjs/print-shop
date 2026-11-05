/**
 * The works' screen state: which screen is open and on what, the overlay over
 * it, the toasts, and the rows last read. The rows are Adminium's, read again
 * after every write; nothing here keeps a figure of its own.
 */
import { create } from "zustand";

import type { AddOnRegistry } from "../add-ons/host.ts";
import type { CatalogEntry, InstalledAddOn, WorksData } from "./door.ts";
import type { Id } from "./wire.ts";

import type { View } from "./view.ts";

export type { View };

export type Overlay =
  | { kind: "proof"; jobId: Id }
  | { kind: "spoil"; jobId: Id }
  | { kind: "quote"; orderId: Id }
  | { kind: "connect"; key: string }
  | { kind: "manage"; key: string }
  | { kind: "disconnect"; key: string }
  | { kind: "holes" }
  | null;

export interface Toast {
  id: number;
  tone: "pos" | "warn" | "info" | "danger";
  text: string;
}

export interface WorksState {
  view: View;
  jobId: Id | null;
  /** The order the dispatch page books a collection for. */
  orderId: Id | null;
  /** The add-on the detail page is about. */
  addOnKey: string | null;
  /** The shelf's category, and the activity's add-on. */
  category: string;
  activityFilter: string;
  /** The job whose "Move to" menu is open on the board. */
  boardMenu: Id | null;
  /** The job being dragged across the board. */
  dragging: Id | null;
  query: string;
  navOpen: boolean;
  overlay: Overlay;
  toasts: Toast[];
  data: WorksData | null;
  /** The last read failed: what it said. */
  failure: string | null;
  theme: "light" | "dark" | null;
  /** The add-ons installed, as Adminium last listed them; null until asked. */
  installed: InstalledAddOn[] | null;
  /** Adminium's catalogue, as it last answered; null until asked. */
  catalog: CatalogEntry[] | null;
  /** The add-ons' fills this build mounts (a delivery company's dispatch), loaded from Adminium. */
  registry: AddOnRegistry | null;
}

export const useWorks = create<WorksState>(() => ({
  view: "today",
  jobId: null,
  orderId: null,
  addOnKey: null,
  category: "all",
  activityFilter: "all",
  boardMenu: null,
  dragging: null,
  query: "",
  navOpen: false,
  overlay: null,
  toasts: [],
  data: null,
  failure: null,
  theme: null,
  installed: null,
  catalog: null,
  registry: null,
}));

/** Open a screen, closing whatever lay over the last one. */
export function go(view: View, more: Partial<Pick<WorksState, "jobId" | "orderId" | "addOnKey">> = {}): void {
  useWorks.setState({ view, ...more, overlay: null, navOpen: false, query: "", boardMenu: null });
}

export const currentView = (): View => useWorks.getState().view;

let toastId = 0;

/** A toast that goes by itself after a few seconds. */
export function toast(text: string, tone: Toast["tone"] = "pos"): void {
  toastId += 1;
  const id = toastId;
  useWorks.setState((s) => ({ toasts: [...s.toasts, { id, tone, text }] }));
  setTimeout(() => useWorks.setState((s) => ({ toasts: s.toasts.filter((one) => one.id !== id) })), 4_000);
}
