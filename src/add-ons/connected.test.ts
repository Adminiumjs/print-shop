/**
 * The connected add-on source (26-T13).
 *
 * `connected.ts` is the ONE file in `src/` allowed to name `fetch` and to
 * `import()` something that is not a relative literal. `sources.test.ts` grants
 * that exemption and points here for the narrowing that makes it honest, so the
 * refusals below are not incidental coverage — they are the argument.
 *
 * Everything is driven through the two injected seams. Nothing in this file
 * reaches a network or imports a real bundle: what is being asserted is which
 * URLs this loader will and will not import a script from, and what it does
 * with a bundle that lies about itself.
 */

import { describe, expect, it, vi } from 'vitest';

import { bundleUrlIsSafe, loadConnectedAddOns, type ConnectedAddOnDto } from './connected.ts';
import type { AddOn } from './host.ts';
import { LOCALE_TAGS } from '../i18n/locales.ts';

/**
 * A message bundle in EVERY locale this app ships.
 *
 * The loader registers messages itself now, and `registerAddOnMessages` refuses
 * a bundle that is short a locale — so a fixture carrying only `en-US` is
 * refused as `NO_REGISTER` before the disclaimer is ever asked about. That is
 * the right order (an add-on with a hole in its Arabic is refused either way),
 * and it means these fixtures have to be complete to test what they name.
 */
function inEveryLocale(entries: Record<string, string>): Record<string, Record<string, string>> {
  return Object.fromEntries(LOCALE_TAGS.map((tag) => [tag, { ...entries }]));
}

const ORIGIN = 'https://shop.example.test';

/** A minimal add-on object, the shape a real `register()` returns. */
function addOn(key: string): AddOn {
  return {
    key,
    name: 'A Thing',
    shortName: 'Thing',
    lineKey: `addon.${key}.line`,
    whatKey: `addon.${key}.what`,
    monogram: 'TH',
    category: 'data',
    connect: 'none',
    permissions: [],
    settings: [],
    namesCompany: false,
    fills: [],
  };
}

function dto(over: Partial<ConnectedAddOnDto> = {}): ConnectedAddOnDto {
  return {
    key: 'holiday-calendars',
    name: 'Holiday Calendars',
    version: '1.0.0',
    attachments: [{ attachedTo: 'printing', enabled: true }],
    bundles: [
      {
        path: 'dist/client.js',
        url: '/api/v1/add-ons/holiday-calendars/bundle/dist/client.js',
        // sha256 of the empty body the stub below returns.
        integrity: 'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=',
      },
    ],
    ...over,
  };
}

interface StubOptions {
  listed?: ConnectedAddOnDto[];
  /** Bytes each bundle URL answers with. Default: empty, matching `dto()`. */
  body?: Uint8Array;
  listStatus?: number;
  bundleStatus?: number;
  /** The whole reply body, for driving shapes `listed` cannot express. */
  listedRaw?: unknown;
  module?: unknown;
  importThrows?: Error;
}

function stub(options: StubOptions = {}) {
  const requested: string[] = [];
  const imported: string[] = [];

  const request = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    requested.push(url);
    if (url.endsWith('/api/v1/add-ons')) {
      const status = options.listStatus ?? 200;
      return {
        ok: status < 400,
        status,
        json: async () =>
          options.listedRaw === undefined
            ? { addOns: options.listed ?? [dto()] }
            : { addOns: options.listedRaw },
      } as unknown as Response;
    }
    const status = options.bundleStatus ?? 200;
    return {
      ok: status < 400,
      status,
      arrayBuffer: async () => (options.body ?? new Uint8Array()).buffer as ArrayBuffer,
    } as unknown as Response;
  }) as unknown as typeof fetch;

  const importBundle = async (url: string): Promise<unknown> => {
    imported.push(url);
    if (options.importThrows !== undefined) throw options.importThrows;
    return options.module ?? { register: () => addOn('holiday-calendars') };
  };

  return {
    requested,
    imported,
    load: async () =>
      loadConnectedAddOns({ appKey: 'printing', origin: ORIGIN, request, importBundle }),
  };
}

describe('which URLs this app will import a script from', () => {
  /*
   * The four shapes that read as same-origin and are not, plus the two obvious
   * ones. Each is a way a compromised or misconfigured server could point this
   * loader at somebody else's script, and each is why the check resolves the
   * URL rather than testing the raw string.
   */
  it.each([
    ['a different origin under the right path', 'https://evil.test/api/v1/add-ons/x/bundle/c.js'],
    ['a protocol-relative URL', '//evil.test/api/v1/add-ons/x/bundle/c.js'],
    ['userinfo that makes the host read as ours', 'https://shop.example.test@evil.test/api/v1/add-ons/x/c.js'],
    ['a traversal out of the fence', '/api/v1/add-ons/../../../evil.js'],
    ['same origin, outside the fence', '/assets/evil.js'],
    ['a data: URL', 'data:text/javascript,export const register=()=>({})'],
    ['nonsense', ':::'],
  ])('refuses %s', (_why, url) => {
    expect(bundleUrlIsSafe(url, ORIGIN)).toBe(false);
  });

  it('accepts the shape the server actually sends', () => {
    expect(bundleUrlIsSafe('/api/v1/add-ons/holiday-calendars/bundle/dist/client.js', ORIGIN)).toBe(
      true,
    );
    // And the absolute spelling of the same thing.
    expect(
      bundleUrlIsSafe(`${ORIGIN}/api/v1/add-ons/holiday-calendars/bundle/dist/client.js`, ORIGIN),
    ).toBe(true);
  });

  it('does not import a bundle whose URL it refused', async () => {
    // The refusal has to stop the import, not merely record a problem beside
    // it. Asserted through the loader rather than the predicate, because the
    // predicate being right is worth nothing if the caller ignores it.
    const s = stub({
      listed: [dto({ bundles: [{ path: 'c.js', url: 'https://evil.test/c.js', integrity: 'sha256-x' }] })],
    });
    const { addOns, problems } = await s.load();
    expect(addOns).toEqual([]);
    expect(problems[0]?.code).toBe('UNSAFE_URL');
    expect(s.imported).toEqual([]);
  });
});

describe('loading what this host hosts', () => {
  it('registers an add-on attached to this host and switched on', async () => {
    const { addOns, problems } = await stub().load();
    expect(problems).toEqual([]);
    expect(addOns.map((a) => a.key)).toEqual(['holiday-calendars']);
  });

  it('ignores an add-on attached to a DIFFERENT host', async () => {
    const s = stub({ listed: [dto({ attachments: [{ attachedTo: 'clinic', enabled: true }] })] });
    const { addOns } = await s.load();
    expect(addOns).toEqual([]);
    // And it did not even fetch the bundle.
    expect(s.requested.filter((u) => u.includes('/bundle/'))).toEqual([]);
  });

  it('ignores one DISABLED on this host — which is how a surface disappears', async () => {
    // Acceptance #3. Per-attachment, so an add-on can be off here and on in the
    // clinic; a single flag could not represent that.
    const s = stub({
      listed: [
        dto({
          attachments: [
            { attachedTo: 'printing', enabled: false },
            { attachedTo: 'clinic', enabled: true },
          ],
        }),
      ],
    });
    expect((await s.load()).addOns).toEqual([]);
  });

  it('passes over a data pack, which ships no client half at all', async () => {
    // Not a failure: an add-on the host reads through a typed surface fills no
    // slot, so there is nothing here to mount and nothing to report.
    const { addOns, problems } = await stub({ listed: [dto({ bundles: [] })] }).load();
    expect(addOns).toEqual([]);
    expect(problems).toEqual([]);
  });
});

describe('what it refuses, and what it does with the rest', () => {
  it('refuses bytes that do not match the integrity the list carried', async () => {
    const { addOns, problems } = await stub({ body: new Uint8Array([1, 2, 3]) }).load();
    expect(addOns).toEqual([]);
    expect(problems[0]?.code).toBe('INTEGRITY_MISMATCH');
    expect(problems[0]?.detail).toContain('sha256-');
  });

  it('refuses an add-on that names a company and ships no disclaimer (AC6)', async () => {
    // The tour cannot see this add-on — its marks are not in this checkout —
    // so the check moves to registration, the same move `registerAddOnMessages`
    // made for locale parity.
    const naming: AddOn = {
      ...addOn('holiday-calendars'),
      namesCompany: true,
      messages: inEveryLocale({ 'addon.holiday-calendars.line': 'Some line' }),
    };
    const { addOns, problems } = await stub({ module: { register: () => naming } }).load();
    expect(addOns).toEqual([]);
    expect(problems[0]?.code).toBe('NO_DISCLAIMER');
  });

  it('requires the disclaimer in every locale — including the one parity cannot see', async () => {
    /*
     * WHICH HALF OF THIS IS REACHABLE, AND WHY THE OTHER HALF IS NOT.
     *
     * `registerAddOnMessages` already refuses a bundle whose non-English
     * locales are short a key the ENGLISH bundle carries — so "the line is in
     * English and missing in Arabic" is refused one step earlier, as
     * `NO_REGISTER`. Good: the add-on does not load either way.
     *
     * What parity CANNOT see is the mirror image, because it keys off English:
     * a bundle whose other seven locales carry the line and whose English does
     * not. Every locale is complete by parity's measure and an English reader
     * meets a company's name with nothing beside it. That is the case this
     * check exists for, and it is the one driven here.
     */
    const englishHasNoLine: AddOn = {
      ...addOn('holiday-calendars'),
      namesCompany: true,
      messages: Object.fromEntries(
        LOCALE_TAGS.map((tag): [string, Record<string, string>] => [
          tag,
          tag === 'en-US'
            ? { 'addon.holiday-calendars.line': 'Bring it from Somewhere' }
            : {
                'addon.holiday-calendars.line': 'Bring it from Somewhere',
                'addon.holiday-calendars.notAffiliated': 'Not affiliated.',
              },
        ]),
      ),
    };
    expect(
      (await stub({ module: { register: () => englishHasNoLine } }).load()).problems[0]?.code,
    ).toBe('NO_DISCLAIMER');
  });

  it('accepts one that names a company and carries the line everywhere', async () => {
    const ok: AddOn = {
      ...addOn('holiday-calendars'),
      namesCompany: true,
      messages: inEveryLocale({ 'addon.holiday-calendars.notAffiliated': 'Not affiliated.' }),
    };
    const { addOns, problems } = await stub({ module: { register: () => ok } }).load();
    expect(problems).toEqual([]);
    expect(addOns.map((a) => a.key)).toEqual(['holiday-calendars']);
  });

  it('asks nothing of an add-on that names no company', async () => {
    // `holiday-calendars` really does declare `namesCompany: false` and ships
    // no `notAffiliated` key at all. Demanding one would refuse it.
    const { problems } = await stub().load();
    expect(problems).toEqual([]);
  });

  it('refuses a bundle that registers under somebody ELSE’s key', async () => {
    // The key is a namespace: it selects settings, messages and which fills the
    // registry attributes to whom. A bundle served as one add-on and
    // registering as another would take over the other's settings and overwrite
    // its strings.
    const { addOns, problems } = await stub({
      module: { register: () => addOn('shipping-dhl') },
    }).load();
    expect(addOns).toEqual([]);
    expect(problems[0]?.code).toBe('KEY_MISMATCH');
    expect(problems[0]?.detail).toContain('shipping-dhl');
  });

  it('refuses a module with no register(), without throwing on the way', async () => {
    const { problems } = await stub({ module: { register: 'not a function' } }).load();
    expect(problems[0]?.code).toBe('NO_REGISTER');
  });

  it('records a register() that throws rather than taking the boot down', async () => {
    const { problems } = await stub({ module: { register: () => { throw new Error('boom'); } } }).load();
    expect(problems[0]?.code).toBe('NO_REGISTER');
    expect(problems[0]?.detail).toContain('boom');
  });

  it('records an import that fails', async () => {
    const { problems } = await stub({ importThrows: new Error('404') }).load();
    expect(problems[0]?.code).toBe('NO_REGISTER');
  });

  it('lets ONE broken add-on through without losing the others', async () => {
    // The property the whole problem list exists for: four working add-ons and
    // one broken one is a shop that runs with a panel missing, not a white
    // screen. Same rule the server's own provider registry follows.
    const good = dto({ key: 'a' });
    const bad = dto({ key: 'b', bundles: [{ path: 'c.js', url: 'https://evil.test/c.js', integrity: 'x' }] });
    const request = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/api/v1/add-ons')) {
        return { ok: true, status: 200, json: async () => ({ addOns: [bad, good] }) } as unknown as Response;
      }
      return {
        ok: true,
        status: 200,
        arrayBuffer: async () => new Uint8Array().buffer as ArrayBuffer,
      } as unknown as Response;
    }) as unknown as typeof fetch;

    const { addOns, problems } = await loadConnectedAddOns({
      appKey: 'printing',
      origin: ORIGIN,
      request,
      importBundle: async () => ({ register: () => addOn('a') }),
    });
    expect(addOns.map((a) => a.key)).toEqual(['a']);
    expect(problems.map((p) => p.key)).toEqual(['b']);
  });

  /*
   * ── IT REALLY NEVER THROWS, WHICH IS THE CONTRACT AND WAS NOT TRUE ────────
   *
   * The docblock says NEVER THROWS and `App.tsx` has no `.catch`, so a
   * rejection here is not a caught error — it is an unhandled one, with no
   * registry installed, no problems logged, and a shop that looks exactly like
   * an instance with no add-ons at all. Every shape below used to do that; the
   * property is worth more than any one of them, so they are driven as a set.
   */
  it.each([
    ['a list entry with no attachments', { listed: [{ key: 'a' } as never] }],
    ['a list entry with no bundles', { listed: [{ key: 'a', attachments: [] } as never] }],
    ['addOns that is not an array', { listedRaw: { a: 1 } }],
    ['a register() that returns null', { module: { register: () => null } }],
    ['a register() that returns a string', { module: { register: () => 'nope' } }],
    [
      'a message value that is not a string',
      {
        module: {
          register: () => ({
            ...addOn('holiday-calendars'),
            namesCompany: true,
            messages: { 'en-US': { 'a.notAffiliated': 1 } },
          }),
        },
      },
    ],
    [
      'a property that throws when read',
      {
        module: {
          register: () => ({
            ...addOn('holiday-calendars'),
            get namesCompany(): boolean {
              throw new Error('boom');
            },
          }),
        },
      },
    ],
    [
      'a message bundle short a locale',
      {
        module: {
          register: () => ({
            ...addOn('holiday-calendars'),
            messages: { 'en-US': { 'addon.holiday-calendars.only': 'x' } },
          }),
        },
      },
    ],
  ])('resolves rather than rejecting on %s', async (_why, options) => {
    await expect(stub(options as StubOptions).load()).resolves.toBeTruthy();
  });

  it('loses only the malformed entry, not the well-formed one beside it', async () => {
    // The property the whole shape check exists for. One entry the server
    // described in a shape this build does not read used to take the entire
    // list down with it, including add-ons that were perfectly fine.
    const s = stub({ listed: [{ key: 'broken' } as never, dto({ key: 'holiday-calendars' })] });
    const { addOns, problems } = await s.load();
    expect(addOns.map((a) => a.key)).toEqual(['holiday-calendars']);
    expect(problems).toEqual([
      {
        key: 'broken',
        code: 'MALFORMED',
        detail: 'the server described this add-on in a shape this build does not read',
      },
    ]);
  });

  it('comes back empty rather than throwing when the server is unreachable', async () => {
    // A shop whose Adminium is briefly down shows its own screens with the
    // add-on panels empty — which is what these five slots already do when
    // nothing fills them. A throw here would be a white screen instead.
    const request = vi.fn(async () => {
      throw new Error('ECONNREFUSED');
    }) as unknown as typeof fetch;
    const { addOns, problems } = await loadConnectedAddOns({
      appKey: 'printing',
      origin: ORIGIN,
      request,
      importBundle: async () => ({}),
    });
    expect(addOns).toEqual([]);
    expect(problems).toEqual([
      { key: '*', code: 'LIST_UNAVAILABLE', detail: 'ECONNREFUSED' },
    ]);
  });

  it('says so when the list answers a status rather than a list', async () => {
    const { problems } = await stub({ listStatus: 403 }).load();
    expect(problems[0]?.code).toBe('LIST_UNAVAILABLE');
    expect(problems[0]?.detail).toContain('403');
  });

  it('says which bundle 404d', async () => {
    const { problems } = await stub({ bundleStatus: 404 }).load();
    expect(problems[0]?.code).toBe('BUNDLE_UNAVAILABLE');
    expect(problems[0]?.detail).toContain('dist/client.js');
  });

  it('sends the session cookie, because that is what authorises the list', async () => {
    // Connected add-on mode is a HOSTED build only: the add-on routes are
    // behind `manifests.manage` on a real session, and a standalone build
    // carries a publishable key and no session. `same-origin` rather than
    // `include` because there is no cross-origin case to serve.
    const requests: RequestInit[] = [];
    const request = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      requests.push(init ?? {});
      return { ok: true, status: 200, json: async () => ({ addOns: [] }) } as unknown as Response;
    }) as unknown as typeof fetch;
    await loadConnectedAddOns({
      appKey: 'printing',
      origin: ORIGIN,
      request,
      importBundle: async () => ({}),
    });
    expect(requests[0]?.credentials).toBe('same-origin');
  });
});
