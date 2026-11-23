/*
 * VENDORED VERBATIM from packages/add-on-contracts/src/framed-page.ts.
 * Never hand-edit this copy: change the monorepo package and re-run
 * `node scripts/sync-manifest-validator.mjs`.
 *
 * WHY A COPY. `@adminium/manifest` is not published to npm and this app is a
 * standalone repo that must build from a clean clone, so it cannot depend on
 * the monorepo. It lives under `testing/` because `zod` is a devDependency
 * here and a runtime dependency the host does not carry — nothing in
 * the shipped bundle's import graph may reach it, which sources.test.ts gates.
 *
 * The only edits are import specifiers: `.js` becomes `.ts`, and the
 * `@adminium/add-on-contracts` package import becomes relative ones.
 */
/**
 * AN ADD-ON'S OWN SMALL PAGE, SHOWN IN A SANDBOXED FRAME.
 *
 * Some outside services can only be used by loading their script in a
 * visitor's browser (Google's Maps JavaScript API). Such a script must never
 * run in an app's page, which holds a guest's session and whose policy allows
 * its own host alone. So the add-on names one small page: one script of its
 * package, and the outside hosts that page may reach. Adminium serves it at
 * `/x/add-on-frame/<add-on>` with a policy of its own. The policy itself
 * sandboxes the page, however it is opened, so it has no origin of its own, no
 * storage of the app's and no reach into the page around it.
 */
import { z } from 'zod';

/** One outside host: https, a name, at most one leading wildcard label. Never a bare `*`, a path or a policy keyword. */
const outsideHost = z.string().max(120).regex(/^https:\/\/(\*\.)?[a-z0-9-]+(\.[a-z0-9-]+)+$/, 'an https host such as https://maps.googleapis.com or https://*.gstatic.com');
const hosts = z.array(outsideHost).min(1).max(10).optional();

export const framedPageSchema = z
  .object({
    /** The page's one script: a file of the package. */
    script: z.string().max(120).regex(/^dist\/[a-z0-9][a-z0-9/_-]*\.js$/, 'a built script such as dist/frame.js'),
    /** The page's title, for a screen reader announcing the frame. */
    title: z.string().min(1).max(80),
    /** What the page may reach, directive by directive. Nothing that is not listed. */
    hosts: z.object({ script: hosts, style: hosts, img: hosts, font: hosts, connect: hosts, frame: hosts }).strict(),
    /** The outside script compiles code at run time (`'unsafe-eval'`, and workers from `blob:`). Only ever inside the sandbox. */
    evalScripts: z.literal(true).optional(),
  })
  .strict();
export type FramedPage = z.infer<typeof framedPageSchema>;

/** The address of an add-on's framed page, and of its one script. */
export const framedPagePath = (addOn: string): string => `/x/add-on-frame/${addOn}`;
export const framedScriptPath = (addOn: string): string => `${framedPagePath(addOn)}/frame.js`;

/**
 * The page's whole policy. `origin` is the address it was asked on, named
 * outright because a sandboxed page's `'self'` matches nothing. `framers` are
 * the listed websites: an app's page framed on one of them frames this in turn.
 */
export function framedPagePolicy(origin: string, addOn: string, page: FramedPage, framers: readonly string[]): string {
  const list = (name: keyof FramedPage['hosts']): string[] => [...(page.hosts[name] ?? [])];
  const directive = (name: string, sources: readonly string[]): string[] => (sources.length === 0 ? [] : [`${name} ${sources.join(' ')}`]);
  return [
    'sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox',
    "default-src 'none'",
    `script-src ${[`${origin}${framedScriptPath(addOn)}`, ...list('script'), ...(page.evalScripts === true ? ["'unsafe-eval'", 'blob:'] : [])].join(' ')}`,
    // An outside script draws with inline styles; nothing here can reach the app's page.
    `style-src ${["'unsafe-inline'", ...list('style')].join(' ')}`,
    ...directive('img-src', ['data:', ...list('img')]),
    ...directive('font-src', list('font')),
    ...directive('connect-src', list('connect')),
    ...directive('frame-src', list('frame')),
    ...(page.evalScripts === true ? ['worker-src blob:'] : []),
    "base-uri 'none'",
    "form-action 'none'",
    `frame-ancestors ${[origin, ...framers].join(' ')}`,
  ].join('; ');
}

/** The page itself: nothing but its title and its script. The script draws everything. */
export function framedPageHtml(addOn: string, page: FramedPage): string {
  const title = page.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><script src="${framedScriptPath(addOn)}" defer></script></head><body></body></html>`;
}
