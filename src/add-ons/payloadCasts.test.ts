/**
 * NO CAST AT A MOUNT SITE — THE PAYLOAD CONTRACT IS THE ONLY THING HOLDING IT.
 *
 * ── THE DEFECT ──────────────────────────────────────────────────────────────
 *
 * A slot payload is the whole of the seam. The host builds it, the type says
 * what a slot carries, and every add-on written against that slot reads it —
 * so the payload's TYPE is the only thing that makes an add-on portable rather
 * than written for one shop. Round 1 found three `payload as ArtworkSlotPayload`
 * casts inside Design Studio and deleted them: a cast written to silence the
 * compiler, kept long after whatever it was silencing.
 *
 * The same hatch was still open on the HOST side, and a verifier proved it.
 * Replacing this app's `cart.line.preview` payload with
 *
 *     payload={{ line: { id: "x", name: "x" } as never }}
 *
 * leaves `npx tsc -b` completely clean and every test green in the OTHER host —
 * the studio, where the personalizer's fill then resolves nothing and the
 * picture on the proof surface disappears behind the fallback tile. The hatch
 * is identical here, on this app's own mount sites, and this file is the other
 * half of that repair: a fix that lands in one host and not the other is the
 * failure mode this wave has produced most often. `as never` assigns to anything.
 * Nothing else in either repository could have noticed: the type system was
 * asked not to look, and every suite that renders the surface sees a legitimate
 * empty state.
 *
 * ── WHAT IS BANNED, AND WHY IT IS NOT "NO CASTS IN THIS FILE" ───────────────
 *
 * A blanket ban on `as` in the screens would fire on working code on its first
 * run — these apps write `t(\`data.product.${key}.name\` as never)` about ninety
 * times, because a message key built at run time cannot be a member of a union
 * derived from the English bundle. A rule that fires on working code acquires
 * an exemption list, and an exemption list is where nine of this wave's holes
 * came from.
 *
 * So the rule is scoped to the thing that matters, by parsing rather than by
 * grepping: inside the `payload` of an `<AddOnSlot>`, a type assertion is a
 * defect. One shape is allowed, and it is a shape rather than a place — a cast
 * on a STRING LITERAL handed to a function, which is the message-key idiom
 * above and carries no payload data at all.
 *
 * A payload passed as a bare identifier is followed one hop to its `const` in
 * the same file, because moving the object up two lines is the obvious way to
 * put a cast back out of reach.
 *
 * ── AND WHAT IT CANNOT SEE ──────────────────────────────────────────────────
 *
 * A payload assembled in a helper module and imported. This reads one file at a
 * time — it is a syntax rule, with no type-checker and no cross-module
 * resolution — so `payload={buildIt(order)}` is inside the rule and whatever
 * `buildIt` does in another file is not. What that costs is stated rather than
 * hidden: the mount site is where the verifier's mutant went, and the helpers
 * these screens use (`records.ts`) return typed values with no cast in them
 * today.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

const SRC = join(process.cwd(), "src");

/** Every `.tsx` this app authors: no vendored add-on, no suite. */
function ownSources(dir: string = SRC): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return entry === "vendor" ? [] : ownSources(full);
    return full.endsWith(".tsx") && !full.includes(".test.") ? [full] : [];
  });
}

/** A cast that is really about a message key, which carries no payload data. */
function isMessageKeyCast(node: ts.AsExpression): boolean {
  const parent = node.parent;
  if (!ts.isCallExpression(parent)) return false;
  if (!parent.arguments.includes(node)) return false;
  return ts.isStringLiteralLike(node.expression) || ts.isTemplateExpression(node.expression);
}

export interface MountFinding {
  file: string;
  line: number;
  text: string;
}

/**
 * Every type assertion inside an `<AddOnSlot>`'s payload, in one source.
 *
 * Exported so the case at the foot can drive it over a synthetic mutant — the
 * rule is checked against a source that DOES have the defect, rather than only
 * against sources that do not.
 */
export function payloadCasts(file: string, source: string): MountFinding[] {
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const findings: MountFinding[] = [];

  const report = (node: ts.Node): void => {
    const { line } = tree.getLineAndCharacterOfPosition(node.getStart(tree));
    findings.push({ file, line: line + 1, text: node.getText(tree).replace(/\s+/g, " ").slice(0, 90) });
  };

  /** A payload expression, and anything it is built out of. */
  const inspect = (node: ts.Node): void => {
    if (ts.isAsExpression(node) && !isMessageKeyCast(node)) report(node);
    // `<T>value`, the older spelling, and `value!`, which is the same promise
    // to the compiler with fewer letters.
    else if (ts.isTypeAssertionExpression(node) || ts.isNonNullExpression(node)) report(node);
    node.forEachChild(inspect);
  };

  /** The `const x = …` a bare `payload={x}` refers to, in this file. */
  const declarationOf = (name: string): ts.Node | null => {
    let found: ts.Node | null = null;
    const look = (node: ts.Node): void => {
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === name &&
        node.initializer !== undefined
      ) {
        found = node.initializer;
      }
      node.forEachChild(look);
    };
    look(tree);
    return found;
  };

  const walk = (node: ts.Node): void => {
    const opening = ts.isJsxSelfClosingElement(node)
      ? node
      : ts.isJsxElement(node)
        ? node.openingElement
        : null;
    if (opening !== null && opening.tagName.getText(tree) === "AddOnSlot") {
      for (const attribute of opening.attributes.properties) {
        if (!ts.isJsxAttribute(attribute)) continue;
        if (attribute.name.getText(tree) !== "payload") continue;
        const value = attribute.initializer;
        if (value === undefined || !ts.isJsxExpression(value) || value.expression === undefined) {
          continue;
        }
        inspect(value.expression);
        if (ts.isIdentifier(value.expression)) {
          const declared = declarationOf(value.expression.text);
          if (declared !== null) inspect(declared);
        }
      }
    }
    node.forEachChild(walk);
  };
  walk(tree);
  return findings;
}

/** How many `<AddOnSlot>`s a source mounts, for the guard on the guard. */
export function mountCount(file: string, source: string): number {
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let mounts = 0;
  const walk = (node: ts.Node): void => {
    const opening = ts.isJsxSelfClosingElement(node)
      ? node
      : ts.isJsxElement(node)
        ? node.openingElement
        : null;
    if (opening !== null && opening.tagName.getText(tree) === "AddOnSlot") mounts += 1;
    node.forEachChild(walk);
  };
  walk(tree);
  return mounts;
}

describe("no host mount site casts its way past the payload contract", () => {
  const files = ownSources().map((file) => ({ file, source: readFileSync(file, "utf8") }));

  it("found every mount site, by two different means", () => {
    /*
     * THE GUARD ON THE GUARD, AND NOT A COUNT.
     *
     * A threshold ("more than five") is a number fitted to whichever app its
     * author had open — this rule's twin in the other host would have passed it
     * and this one would not, because the two shops mount a different number of
     * slots. So the parser is checked against a GREP instead: every file that
     * mentions the component in code has to produce at least one mount here. A
     * renamed component, a moved directory or a parser that stopped recognising
     * TSX shows up as a named disagreement rather than as a quiet zero.
     */
    const withoutComments = (source: string): string =>
      source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1");

    const missed = files
      .filter(({ file, source }) => {
        if (file.endsWith(join("components", "AddOnSlot.tsx"))) return false; // is the component
        return /<AddOnSlot[\s/>]/.test(withoutComments(source));
      })
      .filter(({ file, source }) => mountCount(file, source) === 0)
      .map(({ file }) => file.slice(process.cwd().length + 1));

    expect(missed, "these files mount the component and the parser did not see it").toEqual([]);
    const mounts = files.reduce((sum, f) => sum + mountCount(f.file, f.source), 0);
    expect(mounts, "no <AddOnSlot> was found in this app's own sources at all").toBeGreaterThan(3);
  });

  it("mounts every slot with a payload the compiler has actually checked", () => {
    const findings = files.flatMap(({ file, source }) => payloadCasts(file, source));
    expect(
      findings.map((f) => `${f.file.slice(process.cwd().length + 1)}:${f.line}  ${f.text}`),
      "\nA type assertion inside a slot payload switches off the one contract that " +
        "makes an add-on portable. `as never` assigns to anything, tsc stays clean, " +
        "and the add-on's fill silently resolves nothing. Give the payload the shape " +
        "the slot declares instead:\n",
    ).toEqual([]);
  });

  it("reports the verifier's mutant, and forgives the message-key idiom", () => {
    /*
     * THE RULE, DRIVEN. Both halves matter: a rule that reports nothing is
     * indistinguishable from a rule that is switched off, and a rule that
     * reports the app's own working code gets switched off.
     */
    const mutant = `
      const x = (
        <AddOnSlot
          slot="cart.line.preview"
          payload={{ line: { id: "x", name: "x" } as never }}
        />
      );
    `;
    expect(payloadCasts("mutant.tsx", mutant).length, "the mutant was not reported").toBe(1);

    const throughAVariable = `
      const payload = { line: undefined as never };
      const x = <AddOnSlot slot="cart.line.preview" payload={payload} />;
    `;
    expect(
      payloadCasts("hop.tsx", throughAVariable).length,
      "a payload built one line above the mount was not followed",
    ).toBe(1);

    const banged = `
      const x = <AddOnSlot slot="cart.line.preview" payload={{ line: maybe! }} />;
    `;
    expect(payloadCasts("bang.tsx", banged).length, "`!` is the same promise").toBe(1);

    const honest = `
      const x = (
        <AddOnSlot
          slot="cart.line.preview"
          payload={{ line: orderItem(waiting, t(\`data.product.\${k}.name\` as never)) }}
        />
      );
    `;
    expect(
      payloadCasts("honest.tsx", honest),
      "the message-key idiom this app uses ninety times must not be a finding",
    ).toEqual([]);
  });
});
