/**
 * The demo's copy of Adminium's arithmetic is the vendored validator's, byte
 * for byte: every declaration in `formula.ts` (its header aside) is text the
 * source holds, so a re-sync that moved the source turns this red until the
 * copy is taken again.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { evaluateFormula } from "./formula.ts";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const SOURCE = read("../testing/manifest/formula.ts");
const COPY = read("./formula.ts");

describe("the demo's formula copy", () => {
  const body = COPY.slice(COPY.indexOf("*/\n") + 3);
  const pieces = body.split(/\n(?=export |function |const |interface |\/\*\*)/).map((p) => p.trim()).filter((p) => p !== "");

  it("copies declarations, and only declarations the source holds", () => {
    expect(pieces.length).toBeGreaterThan(20);
    expect(pieces.filter((p) => !SOURCE.includes(p)).map((p) => p.split("\n")[0])).toEqual([]);
  });

  it("works a sheet count out as Adminium does: 250 cards at 24 a sheet are 11 sheets", () => {
    expect(evaluateFormula({ ceil: [{ div: ["qty", "up"] }, 0] }, { qty: 250, up: 24 }, 0)).toBe("11");
  });
});
