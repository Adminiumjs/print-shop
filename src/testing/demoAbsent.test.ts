/**
 * The demo's Marlow Press, its doors, the card's words and the card's protocol
 * are in the demo build and in no other: a hosted surface (either side) and a
 * connected build carry none of them. The control is the demo build, which
 * must carry every marker — a marker it lacked would prove nothing absent.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "..", "..");

/** Literals only the demo's modules hold: a holiday of its own, a card label, a shortcut's words, the protocol's prefix. */
const MARKERS = ["Boxing Day (substitute day)", "Back to Wednesday morning", "500 business cards, both sides, laminated", "adminium:demo:"];

function build(env: Record<string, string>, base: string): string {
  const out = mkdtempSync(join(tmpdir(), "demo-absent-"));
  execFileSync("npx", ["vite", "build", "--outDir", out, "--emptyOutDir", "--logLevel", "error", `--base=${base}`], {
    cwd: REPO,
    env: { ...process.env, NODE_ENV: "production", VITE_ADMINIUM_SURFACE_SIDE: "", VITE_ADMINIUM_API_BASE_URL: "", VITE_ADMINIUM_PUBLISHABLE_KEY: "", ...env },
    stdio: "pipe",
  });
  const assets = join(out, "assets");
  const text = readdirSync(assets)
    .filter((f) => f.endsWith(".js"))
    .map((f) => readFileSync(join(assets, f), "utf8"))
    .join("\n");
  rmSync(out, { recursive: true, force: true });
  return text;
}

const present = (bundle: string) => MARKERS.filter((m) => bundle.includes(m));

let bundles: Record<string, string> = {};

beforeAll(() => {
  bundles = {
    demo: build({}, "/demo/print-shop/app/"),
    staff: build({ VITE_ADMINIUM_SURFACE_SIDE: "staff" }, "/apps/printing/staff/"),
    customer: build({ VITE_ADMINIUM_SURFACE_SIDE: "customer" }, "/apps/printing/customer/"),
    connected: build({ VITE_ADMINIUM_API_BASE_URL: "https://admin.example.com", VITE_ADMINIUM_PUBLISHABLE_KEY: "adm_pub_example" }, "/"),
  };
}, 300_000);

afterAll(() => {
  bundles = {};
});

describe("the demo is in the demo build only", () => {
  it("the demo build carries every marker", () => {
    expect(present(bundles["demo"]!)).toEqual(MARKERS);
  });

  it("no hosted or connected build carries any", () => {
    expect({ staff: present(bundles["staff"]!), customer: present(bundles["customer"]!), connected: present(bundles["connected"]!) }).toEqual({ staff: [], customer: [], connected: [] });
  });
});
