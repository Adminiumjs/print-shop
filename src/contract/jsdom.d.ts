/**
 * The one corner of jsdom the panel contract uses (a page to draw a panel
 * in): this repo takes jsdom as vitest's page and carries no types for it.
 */
declare module "jsdom" {
  export class JSDOM {
    constructor(html?: string, options?: { url?: string; pretendToBeVisual?: boolean });
    readonly window: Window & typeof globalThis;
  }
}
