/**
 * The demo's Adminium, whole: Marlow Press's world in the page, the shop's
 * door into it and the works', one of each for the page. The demo card's
 * persona, theme and language sit beside it (`useDemo`), since the card, not
 * the app, chooses them.
 *
 * DEMO BUILD ONLY — nothing in a real build imports it.
 */
import { create } from "zustand";

import { DemoShop, type DemoAfter } from "./shop.ts";
import { DemoWorks } from "./works.ts";
import { DemoWorld } from "./world.ts";

export interface DemoAdminium {
  world: DemoWorld;
  shop: DemoShop;
  after: DemoAfter;
  works: DemoWorks;
}

export function makeDemo(start?: number): DemoAdminium {
  const world = new DemoWorld(start);
  const shop = new DemoShop(world);
  return { world, shop, after: shop.afterDoor, works: new DemoWorks(world) };
}

let demo: DemoAdminium | null = null;

/** The one demo Adminium of this page. */
export function demoAdminium(): DemoAdminium {
  demo ??= makeDemo();
  return demo;
}

/** A fresh Marlow Press in the same page: the card's "Back to Wednesday morning". Who is using it, the theme and the language stay. */
export function renewDemo(): DemoAdminium {
  demo = makeDemo();
  useDemo.setState((s) => ({ generation: s.generation + 1 }));
  return demo;
}

/** For tests: a fresh Marlow Press, as a new page would have. */
export function resetDemo(): DemoAdminium {
  demo = makeDemo();
  useDemo.setState((s) => ({ persona: "customer", theme: "light", locale: null, generation: s.generation + 1 }));
  return demo;
}

/** Who is using the demo: a customer of the works, or the works itself (the comp's "Customer" and "Shop"). */
export type Persona = "customer" | "shop";

export interface DemoState {
  persona: Persona;
  theme: "light" | "dark";
  /** The language the card asked for, or null until it asks. */
  locale: string | null;
  /** Counts the fresh worlds this page has had: the works' door is the newest one's. */
  generation: number;
}

export const useDemo = create<DemoState>(() => ({ persona: "customer", theme: "light", locale: null, generation: 0 }));
