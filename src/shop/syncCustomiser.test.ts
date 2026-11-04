/**
 * The Customiser's editor comes into the shop by one script, from a built
 * checkout today and from the released package once it is on npm. The
 * release is taken only at the integrity the add-ons ledger wrote for it.
 * These run the script as a person runs it, against a stand-in release.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

import { afterAll, describe, expect, it } from "vitest";

const SCRIPT = "scripts/sync-customiser.mjs";
const temps: string[] = [];
const temp = () => {
  const dir = mkdtempSync(join(tmpdir(), "sync-customiser-"));
  temps.push(dir);
  return dir;
};
afterAll(() => {
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

/** An npm-shaped tarball: `package/…` members, gzipped. */
function tarball(files: Record<string, string>): Buffer {
  const blocks: Buffer[] = [];
  for (const [path, text] of Object.entries(files)) {
    const body = Buffer.from(text);
    const header = Buffer.alloc(512);
    const put = (at: number, length: number, value: string) => Buffer.from(value, "latin1").subarray(0, length).copy(header, at);
    put(0, 100, `package/${path}`);
    put(100, 8, "0000644\0");
    put(124, 12, `${body.length.toString(8).padStart(11, "0")}\0`);
    put(136, 12, "00000000000\0");
    put(156, 1, "0");
    put(257, 6, "ustar\0");
    header.fill(0x20, 148, 156);
    let sum = 0;
    for (const byte of header) sum += byte;
    put(148, 8, `${sum.toString(8).padStart(6, "0")}\0 `);
    blocks.push(header, body, Buffer.alloc((512 - (body.length % 512)) % 512));
  }
  blocks.push(Buffer.alloc(1024));
  return gzipSync(Buffer.concat(blocks));
}

const RELEASE = {
  "package.json": JSON.stringify({ name: "@adminiumjs/add-on-customiser", version: "1.0.16" }),
  "dist/browser/index.js": "export const CustomiserEditor = () => null;\n",
  "dist/browser/stage3d.js": "export const stage = 1;\n",
  "dist/browser/editor.css": ".cz { color: red; }\n",
};

function standIn(files: Record<string, string> = RELEASE): { dir: string; tgz: string; ledger: string; integrity: string } {
  const dir = temp();
  const bytes = tarball(files);
  const tgz = join(dir, "customiser.tgz");
  writeFileSync(tgz, bytes);
  const integrity = `sha512-${createHash("sha512").update(bytes).digest("base64")}`;
  const ledger = join(dir, "RELEASES.json");
  writeFileSync(ledger, JSON.stringify({ schemaVersion: 1, releases: [{ name: "@adminiumjs/add-on-customiser", key: "customiser", version: "1.0.16", integrity }] }));
  return { dir, tgz, ledger, integrity };
}

function run(...args: string[]): { ok: boolean; out: string } {
  try {
    return { ok: true, out: execFileSync("node", [SCRIPT, ...args], { encoding: "utf8", stdio: "pipe" }) };
  } catch (error) {
    const failed = error as { stderr?: string; stdout?: string };
    return { ok: false, out: `${failed.stdout ?? ""}${failed.stderr ?? ""}` };
  }
}

describe("taking the Customiser's editor into the shop", () => {
  it("takes the release at the integrity its ledger wrote, and says so", () => {
    const { tgz, ledger, integrity } = standIn();
    const out = temp();
    const done = run("--tarball", tgz, "--ledger", ledger, "--out", out);
    expect(done.ok, done.out).toBe(true);
    expect(readFileSync(join(out, "index.js"), "utf8")).toBe(RELEASE["dist/browser/index.js"]);
    expect(readFileSync(join(out, "stage3d.js"), "utf8")).toBe(RELEASE["dist/browser/stage3d.js"]);
    expect(readFileSync(join(out, "editor.css"), "utf8")).toBe(RELEASE["dist/browser/editor.css"]);
    const source = JSON.parse(readFileSync(join(out, "SOURCE.json"), "utf8")) as Record<string, unknown>;
    expect(source).toMatchObject({ from: "release", package: "@adminiumjs/add-on-customiser", version: "1.0.16", integrity });
    expect(run("--tarball", tgz, "--ledger", ledger, "--out", out, "--check").ok).toBe(true);
  });

  it("refuses a tarball whose bytes are not the ones the ledger names, and writes nothing", () => {
    const { tgz, ledger } = standIn();
    const other = standIn({ ...RELEASE, "dist/browser/index.js": "export const CustomiserEditor = () => 'changed';\n" });
    const out = temp();
    const refused = run("--tarball", other.tgz, "--ledger", ledger, "--out", out);
    expect(refused.ok).toBe(false);
    expect(refused.out).toMatch(/integrity/);
    expect(existsSync(join(out, "index.js"))).toBe(false);
    // The ledger's own tarball still goes in.
    expect(run("--tarball", tgz, "--ledger", ledger, "--out", out).ok).toBe(true);
  });

  it("refuses a release the ledger does not name, and one taken without a ledger", () => {
    const { tgz } = standIn();
    const dir = temp();
    const ledger = join(dir, "RELEASES.json");
    writeFileSync(ledger, JSON.stringify({ schemaVersion: 1, releases: [] }));
    expect(run("--tarball", tgz, "--ledger", ledger, "--out", temp()).out).toMatch(/names no/);
    expect(run("--tarball", tgz, "--out", temp()).out).toMatch(/needs --ledger/);
    expect(run("--tarball", tgz, "--ledger", standIn().ledger, "--version", "1.0.15", "--out", temp()).out).toMatch(/not 1\.0\.15/);
  });

  it("takes a built checkout's files, naming its version and never a path on this machine", () => {
    const dist = temp();
    for (const name of ["index.js", "stage3d.js", "editor.css"]) writeFileSync(join(dist, name), `/* ${name} */\n`);
    const out = temp();
    expect(run(dist, "--out", out).ok).toBe(true);
    const source = readFileSync(join(out, "SOURCE.json"), "utf8");
    expect(source).not.toContain(dist);
    expect(JSON.parse(source)).toMatchObject({ from: "checkout", package: "@adminiumjs/add-on-customiser" });
    writeFileSync(join(out, "editor.css"), "/* changed */\n");
    expect(run(dist, "--out", out, "--check").ok).toBe(false);
  });

  it("holds the vendored files to the hashes their SOURCE.json records", () => {
    const source = JSON.parse(readFileSync("vendor/customiser/SOURCE.json", "utf8")) as { files: Record<string, string> };
    for (const [name, hash] of Object.entries(source.files)) {
      expect(createHash("sha256").update(readFileSync(join("vendor/customiser", name))).digest("hex"), name).toBe(hash);
    }
  });
});

describe("the editor's declared types", () => {
  it("declare only names the built file exports, and every one of its exports", () => {
    const built = readFileSync("vendor/customiser/index.js", "utf8");
    const block = /export\s*\{([^}]*)\}\s*;?\s*$/.exec(built)?.[1] ?? "";
    const exported = block.split(",").map((one) => one.trim().split(/\s+as\s+/).pop()!).filter((name) => name !== "").sort();
    const declared = [...readFileSync("vendor/customiser/index.d.ts", "utf8").matchAll(/export declare (?:const|function) (\w+)/g)].map((m) => m[1]!).sort();
    expect(declared).toEqual(exported);
  });
});
