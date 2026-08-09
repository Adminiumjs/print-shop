/*
 * VENDORED VERBATIM from packages/add-on-contracts/src/contracts.ts.
 * Never hand-edit this copy: change the monorepo package and re-copy.
 *
 * WHY A COPY. `@adminium/manifest` is not published to npm and this app is a
 * standalone repo that must build from a clean clone, so it cannot depend on
 * the monorepo. The same bind produced `src/add-ons/artwork.ts` and
 * `src/i18n/locales.ts`, and the same answer the three add-on repos already
 * use for their zod validators (`src/testing/schemas.ts`): copy it under
 * `testing/`, where `zod` is a devDependency and nothing in the shipped
 * bundle`s import graph can reach it.
 *
 * The only edits are import specifiers: `.js` becomes `.ts`, and the
 * `@adminium/add-on-contracts` package import becomes a relative one.
 */
/**
 * Provider contract registry v1 — CLOSED (24-marketplace-wave-4.md §5.5).
 *
 * Three, not eight. A contract that has no implementation is a guess about a
 * future add-on; the only way a contract gets in is alongside the add-on that
 * implements it.
 */

import { z } from 'zod';

export interface ContractDefinition {
  readonly id: string;
  readonly version: 1;
  readonly summary: string;
  /** How many add-ons implement it in wave 4 — the evidence the shape is real. */
  readonly implementations: number;
}

export const CONTRACT_REGISTRY = [
  {
    id: 'artwork-source',
    version: 1,
    summary:
      'A way for a customer to supply artwork that is not an upload. The host runs the checks on what comes back, so no implementation marks its own homework.',
    implementations: 2,
  },
  {
    id: 'shipping-carrier',
    version: 1,
    summary:
      'One delivery company: rates, booking, tracking, labels. Implemented so the second one is a copy.',
    implementations: 1,
  },
  {
    id: 'product-personalizer',
    version: 1,
    summary:
      'Personalization spanning three surfaces — shopper, staff, dashboard — which is why it is a contract rather than a screen.',
    implementations: 1,
  },
] as const satisfies readonly ContractDefinition[];

export type ContractId = (typeof CONTRACT_REGISTRY)[number]['id'];

export const CONTRACT_IDS = CONTRACT_REGISTRY.map((c) => c.id) as readonly ContractId[];

export const contractIdSchema = z.enum(
  CONTRACT_IDS as unknown as [ContractId, ...ContractId[]],
);

const BY_ID = new Map<string, ContractDefinition>(CONTRACT_REGISTRY.map((c) => [c.id, c]));

export function isContractId(v: unknown): v is ContractId {
  return typeof v === 'string' && BY_ID.has(v);
}

/** True when the registry carries this contract AT the declared version. */
export function hasContractVersion(id: string, version: number): boolean {
  const found = BY_ID.get(id);
  return found !== undefined && found.version === version;
}
