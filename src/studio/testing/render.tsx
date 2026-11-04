/**
 * Drawing the works' screens in a test: mount the whole app over a stand-in
 * door at a screen, let its writes and reads settle, press and type as a
 * person would, and sweep the page with axe.
 *
 * Tests only; nothing that ships imports it.
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import axe from "axe-core";
import { afterEach, beforeEach, expect } from "vitest";

import { I18nProvider } from "../../i18n/index.tsx";
import { WorksProvider, type WorksEnv } from "../env.tsx";
import { WorksApp } from "../WorksApp.tsx";
import { useWorks, type View, type WorksState } from "../store.ts";
import { DASHBOARD_LINKS } from "../boot.tsx";
import type { FakeDoor } from "./fakeDoor.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLElement;

const INITIAL = useWorks.getState();

/** Each test starts on a clean page and store. */
export function freshPage(): void {
  beforeEach(() => {
    useWorks.setState({ ...INITIAL, toasts: [], overlay: null, data: null, failure: null, boardMenu: null, query: "", installed: null, registry: null });
    host = document.createElement("div");
    document.body.replaceChildren(host);
    localStorage.clear();
  });
  afterEach(() => unmount());
}

export function unmount(): void {
  act(() => root?.unmount());
  root = null;
}

/** The app drawn over this door, before it has read anything. */
export async function mountBare(door: FakeDoor): Promise<void> {
  const env: WorksEnv = { door, ...DASHBOARD_LINKS };
  await act(async () => {
    root = createRoot(host);
    root.render(
      <I18nProvider>
        <WorksProvider env={env}>
          <WorksApp />
        </WorksProvider>
      </I18nProvider>,
    );
  });
}

export async function mount(door: FakeDoor, view: View = "today", more: Partial<WorksState> = {}): Promise<void> {
  useWorks.setState({ data: await door.load(), view, ...more });
  await mountBare(door);
  await settle();
}

/** Let effects, the door's promises and the reload after a write run. */
export async function settle(): Promise<void> {
  for (let i = 0; i < 6; i += 1) await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
}

export async function click(el: Element | null | undefined): Promise<void> {
  if (el === null || el === undefined) throw new Error("nothing to click");
  await act(async () => {
    (el as HTMLElement).click();
  });
  await settle();
}

export async function type(el: Element | null | undefined, value: string): Promise<void> {
  if (el === null || el === undefined) throw new Error("nothing to type into");
  const input = el as HTMLInputElement;
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), "value")!.set!;
  await act(async () => {
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await settle();
}

export async function press(el: Element | null | undefined, key: string): Promise<void> {
  if (el === null || el === undefined) throw new Error("nothing to press a key in");
  await act(async () => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
  });
  await settle();
}

export async function choose(input: HTMLInputElement, file: File): Promise<void> {
  Object.defineProperty(input, "files", { value: [file], configurable: true });
  await act(async () => {
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await settle();
}

export const button = (name: string | RegExp): HTMLButtonElement | undefined =>
  [...document.querySelectorAll("button")].find((b) => (typeof name === "string" ? (b.textContent ?? "").trim() === name || b.getAttribute("aria-label") === name : name.test(b.textContent ?? "") || name.test(b.getAttribute("aria-label") ?? ""))) as HTMLButtonElement | undefined;

export const text = () => document.body.textContent ?? "";
export const toasts = () => useWorks.getState().toasts.map((t) => t.text);

/** axe over the whole page: WCAG A and AA, the rules jsdom can judge (no layout, so no contrast). */
export async function sweep(label: string): Promise<void> {
  const result = await axe.run(document.body, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
    rules: { "color-contrast": { enabled: false } },
  });
  expect(result.passes.length, `${label}: axe looked at something`).toBeGreaterThan(0);
  expect(result.violations.map((v) => `${label}: ${v.id} — ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
}
