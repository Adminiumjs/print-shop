/**
 * The works' screens offer a role only the moves the manifest lets it make:
 * `roles.ts` is held here to the job's states and to each role's limits.
 */
import { describe, expect, it } from "vitest";

import { ROLES } from "../manifest/roles.ts";
import { TABLES } from "../manifest/tables.ts";
import { JOB_MOVES, OWNER_ONLY, ROLE_MOVES } from "./roles.ts";

type Move = string | { to: string; roles?: string[] };

describe("the floor's moves, as the manifest has them", () => {
  const states = TABLES.find((t) => t.ref === "jobs")!.states as { moves: Record<string, Move[]> };

  it("are the job's declared moves", () => {
    const declared = Object.fromEntries(Object.entries(states.moves).map(([from, moves]) => [from, moves.map((m) => (typeof m === "string" ? m : m.to))]));
    expect(JOB_MOVES).toEqual(declared);
  });

  it("keep the owner's way back for the owner", () => {
    const owners = Object.fromEntries(
      Object.entries(states.moves)
        .map(([from, moves]) => [from, moves.flatMap((m) => (typeof m !== "string" && m.roles?.includes("owner") ? [m.to] : []))] as const)
        .filter(([, to]) => to.length > 0),
    );
    expect(OWNER_ONLY).toEqual(owners);
  });

  it("give each role the moves its limits write", () => {
    for (const [role, moves] of Object.entries(ROLE_MOVES)) {
      const limit = (ROLES.find((r) => r.key === role)!.limits as unknown as Record<string, { writableValues?: { stage?: string[] }; writableFrom?: { stage?: string[] } }>)["jobs"]!;
      const to = new Set(Object.values(moves).flat());
      const from = new Set(Object.keys(moves));
      expect([...to].sort(), role).toEqual([...(limit.writableValues?.stage ?? [])].sort());
      expect([...from].sort(), role).toEqual([...(limit.writableFrom?.stage ?? [])].sort());
    }
  });
});
