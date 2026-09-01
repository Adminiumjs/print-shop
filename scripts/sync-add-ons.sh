#!/usr/bin/env bash
# sync-add-ons.sh — vendor the add-on client halves into this app, and prove the
# copies have not drifted from the repository they came from.
#
# THIS SCRIPT SHIPS IN THIS REPO, and that is the whole reason it exists here.
# The anti-drift check used to live only in the author's local workplan tree,
# which is gitignored: `src/add-ons/registry.ts` told a reader to "re-run the
# sync script", CI had no script to run, and a cloner could not have run one if
# they had wanted to. A gate nobody but one laptop can execute is not a gate.
#
# ── ONE SOURCE REPOSITORY, NOT THREE ────────────────────────────────────────
#
# The add-ons used to be three standalone repositories and this script pulled
# from three sibling checkouts. They are ONE monorepo now, and the reason is the
# same reason this script exists: each of the three carried its own copy of the
# host contract, and within a day the copies disagreed — the `AddOn` interface
# had 19 members in one, 18 in another, 18 in the third, and two members the
# host declares (`nameKey`, `inDemo`) in none of them. Nothing failed and
# nothing could have, because no suite anywhere had two copies in front of it.
#
#   <somewhere>/print-shop      ← this repo, the HOST
#   <somewhere>/add-ons         ← the monorepo
#       packages/host/              the ONE shared contract
#       packages/design-studio/
#       packages/shipping-dhl/
#       packages/import-canva/
#
# Override with ADD_ONS_DIR=/path/to/add-ons if yours lives elsewhere. NOTE the
# changed meaning: it used to name the directory CONTAINING three checkouts, and
# it now names the monorepo checkout itself. A stale value is caught below and
# reported as such rather than as a missing file.
#
# ── WHAT THE HOST VENDORS, AND WHY `vendor/host/` EXISTS ────────────────────
#
#   src/add-ons/vendor/host/<file>   from add-ons/packages/host/src/<file>
#   src/add-ons/vendor/<key>/<file>  from add-ons/packages/<key>/src/<file>
#
# The add-on sources import their shared contract as `@adminium/add-on-host`.
# This app has no node_modules for that package and never will: it is a static
# Vite SPA published standalone to the Adminiumjs org, built from a clean clone
# with no sibling checkout of anything. So the shared package is VENDORED TOO,
# once, into `vendor/host/`, and the copied files' imports are rewritten to
# reach it by relative path (see REWRITES below). The vendored tree is then
# self-contained: it compiles with nothing beside it.
#
# THAT IS A SECOND DECLARATION OF `AddOn` IN THIS REPO, and it is deliberate.
# `src/add-ons/host.ts` is this app's own seam and stays authoritative — where
# the two disagree, the app is right and the mirror is stale. What keeps them
# honest is not prose: the monorepo's `packages/host/src/host-mirror.test.ts`
# reads THIS repo's `host.ts` and `slots.ts` and fails when a member here is
# missing there, and `src/add-ons/registry.ts` assigns the objects the vendored
# `register()`s return into `readonly AddOn[]` typed by our own `host.ts` — so
# `npx tsc -b` in this repo is itself a structural conformance check between the
# two. Pointing the rewrite at `src/add-ons/host.ts` instead would have looked
# tidier and been worse: our seam exports no contract types (`JobSpec`,
# `ShippingCarrier`, `Rate`) and no `DeliveryChoice`, and an add-on written
# against a newer mirror would fail here as a pile of missing-property errors
# rather than as one clear "the host has not adopted this yet".
#
# THE MONOREPO IS THE SOURCE OF TRUTH. Edit it, then re-run `sync` here. A
# hand-edit under vendor/ is invisible until it is a bug in two places at once,
# which is exactly what `status` is for.
#
# Every vendored file carries a header naming its source and saying it is synced
# rather than hand-edited. `status` strips that header back off, and applies the
# same import rewrite to the source, before comparing — so neither the header
# nor the rewrite is itself a source of drift.
#
# WHAT IS DELIBERATELY NOT COPIED, and none of it is an oversight:
#   *.test.ts(x)   the monorepo runs its own suites; re-running them here would
#                  assert the copy rather than the thing (and the conformance
#                  suites pull in zod, which the host does not carry — 24 D7).
#   src/testing/   the copied conformance harness and build helpers, same
#                  reason. The shared package's `testing/` entry point — where
#                  its zod validators live — is never vendored either.
#   slots.ts       each package's `FILLED_SLOTS` is read only by its own
#                  manifest suite. This app has its own `src/add-ons/slots.ts`,
#                  which is the authoritative list of what it hosts.
#   src/carrier.ts src/http.ts src/server.ts src/server/artwork-source.ts
#                  the SERVER halves. Secrets are server-only (24 D15) and the
#                  client bundle must not be able to reach the module that holds
#                  them. `status` fails if one ever appears under vendor/.
#   vite-env.d.ts  ambient Vite types the host already has.
#
# With no monorepo checkout present, `status` reports SOURCE-MISSING and exits 0
# — a clean clone of this app alone still builds, and its own suites still
# assert what is vendored. `sync` in that situation is an error, because there
# is nothing to sync FROM.
#
# Usage:
#   scripts/sync-add-ons.sh status   what is vendored, and whether it matches
#   scripts/sync-add-ons.sh sync     re-copy from the monorepo
#   scripts/sync-add-ons.sh list     the file list each package contributes

set -euo pipefail

HOST="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MONO="${ADD_ONS_DIR:-$(cd "$HOST/.." && pwd)/add-ons}"
VENDOR="$HOST/src/add-ons/vendor"

# Vendoring targets, in the order they are written. `host` FIRST: it is the
# shared contract the other three import, and a reader of the output should see
# what everything else depends on before the things that depend on it.
#
# For an add-on the target name is its manifest key AND the directory name under
# vendor/, so a reader who sees `vendor/shipping-dhl/` knows exactly which
# package to go and read.
TARGETS=(host design-studio shipping-dhl import-canva)

# The shared contract, vendored ONCE. `testing/` is not here and must not be.
FILES_host=(
  index.ts host.ts payloads.ts slots.ts delivery.ts
  contracts/index.ts contracts/common.ts
  contracts/artwork-source.ts contracts/shipping-carrier.ts
  contracts/product-personalizer.ts
  # The ABI a CONNECTED bundle is loaded through (26 §0.7). A built add-on
  # aliases `react` to a shim that reads a global, so a host must publish its
  # React on that global before importing one — and the KEY it publishes under
  # is the contract, not a string a host should be retyping. Vendored for the
  # same reason `host.ts` is: this app has no node_modules entry that resolves
  # `@adminium/add-on-host`.
  runtime/index.ts
)

# Reachable from each client entry point, and nothing else. Kept as an explicit
# list rather than a glob so that adding a file to a package is a decision here
# too — a new module appearing in the demo bundle without anyone naming it is
# how a server half ends up in a browser.
FILES_design_studio=(
  add-on-facts.ts
  doc.ts layouts.ts artworkSource.ts hostJob.ts index.ts
  i18n/strings.ts
  styles/design-studio.css
  ui/Editor.tsx ui/Inspector.tsx ui/LayoutPicker.tsx ui/Monogram.tsx
  ui/SettingsPanel.tsx ui/SourceTile.tsx ui/editorState.ts ui/fills.tsx
  ui/tint.ts ui/useHostLocale.ts ui/useViewport.ts
)
FILES_shipping_dhl=(
  add-on-facts.ts
  label-store.ts clock.ts parcel.ts rates.ts label.ts seed.ts
  demo-carrier.ts settings.ts runtime.ts index.ts
  i18n/strings.ts i18n/t.ts
  ui/atoms.tsx ui/labels.ts ui/DispatchAction.tsx ui/DeliveryMethods.tsx
  ui/SettingsPanel.tsx ui/TrackingPanel.tsx ui/ReturnLabel.tsx
)
FILES_import_canva=(
  add-on-facts.ts
  import.ts job.ts oauth.ts source.ts index.ts
  demo/transport.ts
  i18n/strings.ts i18n/t.ts i18n/useT.ts
  client/SourceTile.tsx client/ImportFlow.tsx client/ConsentPanel.tsx
  client/SettingsPanel.tsx client/bits.tsx client/styles.css
)

# Modules that must never be reachable from the browser half (D15), and the
# server ENTRY POINTS a manifest's `provides[].server` names. `design-studio`
# holds no secret, so its server half is a packaging boundary rather than a leak
# — but a server entry that turns up in the demo bundle means the split the
# manifest describes stopped being true, which is worth catching here as well as
# in the monorepo's own `sources.test.ts`.
FORBIDDEN=(carrier.ts http.ts server.ts server/artwork-source.ts)

# Files the OLD three-repo layout vendored and this one does not: each add-on's
# private copy of the contract, now shared in `vendor/host/`. Finding one is not
# a leak, it is a vendor tree that has not been re-synced since the copies were
# consolidated — a different report, because it calls for a different action.
STALE=(contracts.ts host.ts)

die()  { printf '\033[31m%s\033[0m\n' "$*" >&2; exit 1; }
ok()   { printf '\033[32m%s\033[0m\n' "$*"; }
warn() { printf '\033[33m%s\033[0m\n' "$*"; }

var() { printf '%s' "${1//-/_}"; }
files_of() { local v; v="FILES_$(var "$1")[@]"; printf '%s\n' "${!v}"; }
pkg_of() { printf 'packages/%s' "$1"; }
src_of() { printf '%s/packages/%s/src' "$MONO" "$1"; }

[ -d "$HOST/src/add-ons" ] || die "run this from inside the print-shop checkout"

# Is the monorepo where we think it is? One directory to find, not three — and
# if what we find is the pre-monorepo layout, say THAT, because the fix is a
# different one (update ADD_ONS_DIR) from "clone it".
SOURCE_MISSING=0
if [ ! -d "$MONO/packages/host/src" ]; then
  SOURCE_MISSING=1
  OLD_LAYOUT=0
  [ -d "$MONO/add-on-design-studio/src" ] && OLD_LAYOUT=1
fi

require_source() {
  [ "$SOURCE_MISSING" -eq 0 ] && return 0
  printf 'add-ons monorepo not found at:\n  %s\n' "$MONO" >&2
  if [ "${OLD_LAYOUT:-0}" -eq 1 ]; then
    printf '\nthat directory holds the OLD three-repo layout. The add-ons are one\n' >&2
    printf 'repository now; ADD_ONS_DIR names that checkout, not its parent.\n' >&2
  fi
  die "clone it beside this repo as ../add-ons, or set ADD_ONS_DIR to where it lives"
}

# ---------------------------------------------------------------------------
# REWRITES
#
# The add-on sources import the shared contract by package name. This app has no
# node_modules for that package, so the vendored copies import the VENDORED
# contract by relative path instead. The depth is computed from the file's own
# position: `index.ts` is one level under `vendor/<key>/`, `ui/x.tsx` is two.
#
# THIS IS THE ONLY EDIT THE VENDORING MAKES to a file's bytes, and `status`
# applies exactly the same edit to the source before comparing, so the rewrite
# is not itself a source of drift. `vendor/host/` needs none of it — the shared
# package's own files already reach each other relatively — and gets it anyway,
# harmlessly, so there is one code path rather than two.
# ---------------------------------------------------------------------------
rewrite() { # $1 = path within src/  → filter stdin
  local depth up
  depth=$(awk -F/ '{print NF-1}' <<<"$1")
  up=""
  for ((i = 0; i < depth; i++)); do up="../$up"; done
  # Both quote styles, spelled out. A capture-and-put-back `sed -E` with a \1
  # backreference in the PATTERN is the obvious way to write this and it is
  # wrong: BSD ERE has no backreferences, so on macOS it matches nothing and
  # every specifier is copied through untouched — silently, because `status`
  # applies the same rewrite to the source and the two therefore still agree.
  # `unresolved_in` below is the check that caught it, and it stays.
  sed \
    -e "s|\"@adminium/add-on-host/contracts\"|\"${up}../host/contracts/index.ts\"|g" \
    -e "s|'@adminium/add-on-host/contracts'|'${up}../host/contracts/index.ts'|g" \
    -e "s|\"@adminium/add-on-host\"|\"${up}../host/index.ts\"|g" \
    -e "s|'@adminium/add-on-host'|'${up}../host/index.ts'|g"
}

# The header every vendored file wears. Five lines, then the file verbatim.
# `status` cuts exactly these lines back off, so editing the wording here is a
# one-line change followed by a sync, never a drift report.
header() { # $1 = target, $2 = path within src/, $3 = comment opener, $4 = closing sentence
  cat <<EOF
$3
 * VENDORED from add-ons/$(pkg_of "$1")/src/$2 — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the monorepo and re-run \`sync-add-ons.sh sync\`.
 * $4
 */
EOF
}

# Every bare `@adminium/…` specifier left in a vendored file, one per line.
# There is no node_modules here that could resolve one: a survivor means the
# rewrite did not fire, and the vendored tree stops being self-contained. This
# looks only at what a bundler would follow — an `import`/`export … from` or a
# dynamic `import(…)` — so the prose that NAMES the package (every one of these
# files explains that it is a mirror of it) is not a false positive.
unresolved_in() { # $1 = file
  grep -nE "(from|import)[[:space:]]*\(?[[:space:]]*['\"]@adminium/" "$1" || true
}

note_of() { # $1 = target → the header's third line
  if [ "$1" = host ]; then
    printf '%s' 'The ONE shared contract; the three add-ons here import it by relative path.'
  else
    printf 'The add-on key is `%s`; its manifest, tests and README live in the monorepo.' "$1"
  fi
}

HEADER_LINES=5

# ---------------------------------------------------------------------------

cmd_list() {
  for key in "${TARGETS[@]}"; do
    local n
    n=$(files_of "$key" | wc -l | tr -d ' ')
    printf '%-16s %-28s %s files\n' "$key" "$(pkg_of "$key")" "$n"
    files_of "$key" | sed 's/^/    /'
  done
}

# ---------------------------------------------------------------------------

cmd_sync() {
  require_source
  local total=0
  for key in "${TARGETS[@]}"; do
    local src dest note left n=0
    src="$(src_of "$key")"
    dest="$VENDOR/$key"
    note="$(note_of "$key")"
    rm -rf "$dest"
    mkdir -p "$dest"
    while IFS= read -r rel; do
      [ -f "$src/$rel" ] || die "$(pkg_of "$key"): $rel is in the file list but not in the package"
      mkdir -p "$dest/$(dirname "$rel")"
      # .css takes the same block comment; every extension here is either
      # C-style-commented or CSS, so one opener serves both.
      { header "$key" "$rel" "/*" "$note"; rewrite "$rel" < "$src/$rel"; } > "$dest/$rel"
      # Refuse to leave behind a copy this app cannot resolve. Checked at the
      # moment of writing, so the message names the file that was being written.
      left="$(unresolved_in "$dest/$rel")"
      [ -z "$left" ] || die "$key/$rel still imports the shared package by name:
$left
the import rewrite did not fire — see REWRITES in this script"
      n=$((n + 1))
    done < <(files_of "$key")
    printf '%-16s %-28s %s files\n' "$key" "$(pkg_of "$key")" "$n"
    total=$((total + n))
  done
  ok "vendored $total files into src/add-ons/vendor"
  echo "now run, in $HOST:  npx tsc -b && npx vitest run && npx vite build"
}

# ---------------------------------------------------------------------------

cmd_status() {
  local drift=0
  printf '%-16s %-28s %-8s %s\n' TARGET PACKAGE FILES STATE
  for key in "${TARGETS[@]}"; do
    local src dest state=ok n=0 want
    src="$(src_of "$key")"
    dest="$VENDOR/$key"
    want=$(files_of "$key" | wc -l | tr -d ' ')

    if [ ! -d "$dest" ]; then
      state="MISSING"; drift=1
    else
      while IFS= read -r rel; do
        if [ ! -f "$dest/$rel" ]; then
          state="MISSING $rel"; drift=1; continue
        fi
        n=$((n + 1))
        # A specifier no bundler here can resolve. Checked directly rather than
        # left to the byte comparison below, which cannot see it: the same
        # rewrite is applied to both sides, so a rewrite that fires on neither
        # produces two files that agree perfectly and a build that fails.
        [ -z "$(unresolved_in "$dest/$rel")" ] || { state="UNRESOLVED $rel"; drift=1; }
        # Cut the header back off, apply the same import rewrite to the source,
        # then compare byte for byte. With no monorepo beside us there is
        # nothing to compare to, and saying so is honest where claiming "ok"
        # would not be.
        if [ "$SOURCE_MISSING" -eq 0 ] &&
           ! tail -n "+$((HEADER_LINES + 1))" "$dest/$rel" |
             cmp -s - <(rewrite "$rel" < "$src/$rel"); then
          state="DRIFT $rel"; drift=1
        fi
      done < <(files_of "$key")

      # Anything under vendor/<target>/ that the list does not name is either a
      # stale file from an older sync or something nobody decided to ship.
      while IFS= read -r extra; do
        files_of "$key" | grep -qxF "$extra" || { state="EXTRA $extra"; drift=1; }
      done < <(cd "$dest" && find . -type f | sed 's|^\./||' | sort)

      if [ "$key" != host ]; then
        # D15: the server half must not be reachable from a browser bundle.
        for f in "${FORBIDDEN[@]}"; do
          [ -e "$dest/$f" ] && { state="SECRET-LEAK $f"; drift=1; }
        done
        # A private copy of the contract, from before there was one shared one.
        for f in "${STALE[@]}"; do
          [ -e "$dest/$f" ] && { state="STALE-LAYOUT $f (pre-monorepo copy; re-sync)"; drift=1; }
        done
      fi

      [ "$SOURCE_MISSING" -eq 1 ] && [ "$state" = ok ] && state="SOURCE-MISSING (not compared)"
    fi
    printf '%-16s %-28s %-8s %s\n' "$key" "$(pkg_of "$key")" "$n/$want" "$state"
  done

  # A directory under vendor/ that is not a target at all — the three-repo
  # layout's leftovers land here if one is ever removed from TARGETS.
  if [ -d "$VENDOR" ]; then
    while IFS= read -r dir; do
      printf '%s\n' "${TARGETS[@]}" | grep -qxF "$dir" ||
        { warn "UNKNOWN $dir/ under vendor/ — nothing syncs it"; drift=1; }
    done < <(cd "$VENDOR" && find . -mindepth 1 -maxdepth 1 -type d | sed 's|^\./||' | sort)
  fi

  echo
  if [ "$drift" -ne 0 ]; then
    die "drift found — run: scripts/sync-add-ons.sh sync"
  fi
  if [ "$SOURCE_MISSING" -eq 1 ]; then
    warn "vendored files are complete; the add-ons monorepo is absent, so nothing was compared"
    printf '  %s\n' "$MONO"
    exit 0
  fi
  ok "the vendored copies match the monorepo"
}

case "${1:-status}" in
  status) cmd_status ;;
  sync)   cmd_sync ;;
  list)   cmd_list ;;
  *) die "usage: sync-add-ons.sh [status|sync|list]" ;;
esac
