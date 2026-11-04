#!/usr/bin/env node
/**
 * Copy the Customiser's browser files (the shopper's editor) into
 * `vendor/customiser/`, where the shop's pages import them from.
 *
 * Adminium serves no add-on code to a shopper: the shop ships the editor in
 * its own bundle, at the version it was built with, and mounts it with its
 * own React. Three files make it up, all from the add-on's
 * `dist/browser/`: `index.js` (the editor), `stage3d.js` (the 3D stage it
 * fetches from beside itself only when a piece is shown in 3D) and
 * `editor.css` (its `cz-` classes).
 *
 * Two ways to take them:
 *
 *   node scripts/sync-customiser.mjs <dir>
 *       from a built add-ons checkout's `packages/customiser/dist/browser`;
 *
 *   node scripts/sync-customiser.mjs --tarball <file.tgz> --ledger <RELEASES.json>
 *       from the released package, as npm hands it over, after its bytes
 *       are held to the integrity the add-ons release ledger wrote for that
 *       version. A tarball the ledger does not name, or whose bytes differ,
 *       is refused and nothing is written.
 *
 * Either way `vendor/customiser/SOURCE.json` says where the files came from
 * and each file's hash. `--check` writes nothing and fails when the vendored
 * files are not the ones the source would give. `--out <dir>` writes
 * somewhere else (the tests use it).
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..');

/** The files the shop vendors, by their name in `dist/browser/`. */
export const FILES = ['index.js', 'stage3d.js', 'editor.css'];
/** The package the files come from, as npm names it. */
export const PACKAGE = '@adminiumjs/add-on-customiser';

const fail = (message) => {
  console.error(`[sync-customiser] ${message}`);
  process.exit(1);
};

/** `--name value` from the command line, or null. */
function option(args, name) {
  const at = args.indexOf(name);
  if (at === -1) return null;
  const value = args[at + 1];
  if (value === undefined || value.startsWith('--')) fail(`${name} needs a value`);
  return value;
}

const sha512 = (bytes) => `sha512-${createHash('sha512').update(bytes).digest('base64')}`;
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

/** The regular files of a gzipped ustar archive, by their path. */
export function untar(gzipped) {
  const tar = gunzipSync(gzipped);
  const out = new Map();
  let longName = null;
  for (let at = 0; at + 512 <= tar.length; ) {
    const header = tar.subarray(at, at + 512);
    if (header.every((byte) => byte === 0)) break;
    const field = (start, length) => {
      const raw = header.subarray(start, start + length);
      const end = raw.indexOf(0);
      return raw.subarray(0, end === -1 ? length : end).toString('utf8');
    };
    const size = Number.parseInt(field(124, 12).trim() || '0', 8);
    const type = field(156, 1) || '0';
    const prefix = field(345, 155);
    const name = longName ?? (prefix === '' ? field(0, 100) : `${prefix}/${field(0, 100)}`);
    const body = tar.subarray(at + 512, at + 512 + size);
    longName = null;
    if (type === 'L') longName = body.toString('utf8').replace(/\0+$/, '');
    else if (type === '0' || type === '\0') out.set(name, Buffer.from(body));
    at += 512 + Math.ceil(size / 512) * 512;
  }
  return out;
}

/** The files and where they came from: a built checkout's folder. */
function fromDir(dir) {
  const root = resolve(dir);
  const files = new Map();
  for (const name of FILES) {
    const path = join(root, name);
    if (!existsSync(path)) fail(`${path} is missing: build the add-on first (npm run build -w packages/customiser)`);
    files.set(name, readFileSync(path));
  }
  // Which build: the package's version and the checkout's commit, never a path on this machine.
  const pkgFile = join(root, '..', '..', 'package.json');
  const version = existsSync(pkgFile) ? JSON.parse(readFileSync(pkgFile, 'utf8')).version : null;
  let commit = null;
  try {
    commit = execFileSync('git', ['-C', root, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    // not a git checkout: the version says enough
  }
  return { files, source: { from: 'checkout', package: PACKAGE, version, commit } };
}

/** The files and where they came from: the released tarball, held to the ledger. */
function fromTarball(file, ledgerFile, wanted) {
  if (ledgerFile === null) fail('--tarball needs --ledger <RELEASES.json>: a release is taken only at the integrity its ledger wrote');
  const bytes = readFileSync(file);
  const members = untar(bytes);
  const pkgText = members.get('package/package.json');
  if (pkgText === undefined) fail(`${file} has no package/package.json`);
  const pkg = JSON.parse(pkgText.toString('utf8'));
  if (pkg.name !== PACKAGE) fail(`${file} is ${String(pkg.name)}, not ${PACKAGE}`);
  if (wanted !== null && pkg.version !== wanted) fail(`${file} is version ${String(pkg.version)}, not ${wanted}`);
  const ledger = JSON.parse(readFileSync(ledgerFile, 'utf8'));
  const row = (ledger.releases ?? []).find((one) => one.name === PACKAGE && one.version === pkg.version);
  if (row === undefined) fail(`the ledger names no ${PACKAGE}@${String(pkg.version)}`);
  const integrity = sha512(bytes);
  if (row.integrity !== integrity) fail(`${PACKAGE}@${String(pkg.version)}: the tarball's integrity ${integrity} is not the ledger's ${String(row.integrity)}`);
  const files = new Map();
  for (const name of FILES) {
    const body = members.get(`package/dist/browser/${name}`);
    if (body === undefined) fail(`${file} has no dist/browser/${name}`);
    files.set(name, body);
  }
  return { files, source: { from: 'release', package: PACKAGE, version: pkg.version, integrity } };
}

function main(args) {
  const check = args.includes('--check');
  const out = resolve(option(args, '--out') ?? join(repo, 'vendor', 'customiser'));
  const tarball = option(args, '--tarball');
  const valued = new Set(['--out', '--tarball', '--ledger', '--version']);
  const positional = args.filter((arg, i) => !arg.startsWith('--') && !valued.has(args[i - 1] ?? ''));
  let taken;
  if (tarball !== null) taken = fromTarball(tarball, option(args, '--ledger'), option(args, '--version'));
  else if (positional[0] !== undefined) taken = fromDir(positional[0]);
  else fail('say where from: a built dist/browser folder, or --tarball <file.tgz> --ledger <RELEASES.json>');

  const hashes = Object.fromEntries([...taken.files].map(([name, body]) => [name, sha256(body)]));
  const sourceText = `${JSON.stringify({ ...taken.source, files: hashes }, null, 2)}\n`;
  if (check) {
    const stale = FILES.filter((name) => !existsSync(join(out, name)) || sha256(readFileSync(join(out, name))) !== hashes[name]);
    if (stale.length > 0) fail(`out of date in ${out}: ${stale.join(', ')}. Run the sync again.`);
    console.info(`[sync-customiser] ${out} is current`);
    return;
  }
  mkdirSync(out, { recursive: true });
  for (const [name, body] of taken.files) writeFileSync(join(out, name), body);
  writeFileSync(join(out, 'SOURCE.json'), sourceText);
  console.info(`[sync-customiser] wrote ${FILES.length} files to ${out}`);
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
