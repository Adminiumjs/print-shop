#!/usr/bin/env bash
# sync-add-ons.sh — vendor the three add-on client halves into this app, and
# prove the copies have not drifted from their repos.
#
# THIS SCRIPT SHIPS IN THIS REPO, and that is the whole reason it exists here.
# The anti-drift check used to live only in the author's local workplan tree,
# which is gitignored: `src/add-ons/registry.ts` told a reader to "re-run the
# sync script", CI had no script to run, and a cloner could not have run one if
# they had wanted to. A gate nobody but one laptop can execute is not a gate.
#
# The Print Shop is a static Vite SPA published standalone to Adminiumjs, and
# the add-ons are three more standalone repos. There is no npm package tying
# them together and no monorepo to hoist them into, so the demo build gets a
# COPY — the same arrangement the marketplace apps already have for the
# demo-data toolkit, and for the same reason: one source of truth, synced by a
# script, so no repo is hand-edited out of step.
#
#   src/add-ons/vendor/<key>/…   byte-derived from <add-on repo>/src/…
#
# THE ADD-ON REPO IS THE SOURCE OF TRUTH. Edit it, then re-run `sync` here. A
# hand-edit under vendor/ is invisible until it is a bug in two places at once,
# which is exactly what `status` is for.
#
# Every vendored file carries a header naming its source repo and saying it is
# synced rather than hand-edited. `status` strips that header back off before
# comparing, so the header is not itself a source of drift.
#
# WHAT IS DELIBERATELY NOT COPIED, and it is not an oversight:
#   *.test.ts(x)   each repo runs its own suites; re-running them here would
#                  assert the copy rather than the thing (and the conformance
#                  suites pull in zod, which the host does not carry — D7).
#   src/testing/   the copied conformance harness, same reason.
#   src/carrier.ts src/http.ts src/server.ts   (shipping-dhl) the SERVER half.
#                  Secrets are server-only (24 D15) and the client bundle must
#                  not be able to reach the module that holds them. `status`
#                  fails if one of these ever appears under vendor/.
#   vite-env.d.ts  ambient Vite types the host already has.
#
# WHERE THE ADD-ON REPOS HAVE TO BE. Beside this one:
#
#   <somewhere>/print-shop            ← this repo
#   <somewhere>/add-on-design-studio
#   <somewhere>/add-on-shipping-dhl
#   <somewhere>/add-on-import-canva
#
# Override with ADD_ONS_DIR=/path/to/checkouts if yours live elsewhere. With
# none of them present, `status` reports SOURCE-MISSING and exits 0 — a clean
# clone of this app alone still builds, and its own suites still assert what is
# vendored. `sync` in that situation is an error, because there is nothing to
# sync FROM.
#
# Usage:
#   scripts/sync-add-ons.sh status   what is vendored, and whether it matches
#   scripts/sync-add-ons.sh sync     re-copy from the three repos
#   scripts/sync-add-ons.sh list     the file list each add-on contributes

set -euo pipefail

HOST="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECTS="${ADD_ONS_DIR:-$(cd "$HOST/.." && pwd)}"
VENDOR="$HOST/src/add-ons/vendor"

# key : repo directory. The key is the add-on's manifest key and the directory
# name under vendor/, so a reader who sees `vendor/shipping-dhl/` knows exactly
# which manifest to go and read.
KEYS=(design-studio shipping-dhl import-canva)
REPO_design_studio="add-on-design-studio"
REPO_shipping_dhl="add-on-shipping-dhl"
REPO_import_canva="add-on-import-canva"

# Reachable from the client entry point, and nothing else. Kept as an explicit
# list rather than a glob so that adding a file to an add-on repo is a decision
# here too — a new module appearing in the demo bundle without anyone naming it
# is how a server half ends up in a browser.
FILES_design_studio=(
  contracts.ts host.ts doc.ts layouts.ts artworkSource.ts hostJob.ts index.ts
  i18n/strings.ts
  styles/design-studio.css
  ui/Editor.tsx ui/Inspector.tsx ui/LayoutPicker.tsx ui/Monogram.tsx
  ui/SettingsPanel.tsx ui/SourceTile.tsx ui/editorState.ts ui/fills.tsx
  ui/tint.ts ui/useHostLocale.ts ui/useViewport.ts
)
FILES_shipping_dhl=(
  contracts.ts host.ts clock.ts parcel.ts rates.ts label.ts seed.ts
  demo-carrier.ts settings.ts runtime.ts index.ts
  i18n/strings.ts i18n/t.ts
  ui/atoms.tsx ui/labels.ts ui/DispatchAction.tsx ui/DeliveryMethods.tsx
  ui/SettingsPanel.tsx ui/TrackingPanel.tsx
)
FILES_import_canva=(
  contracts.ts host.ts import.ts job.ts oauth.ts source.ts index.ts
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
# in that repo's own `sources.test.ts`.
FORBIDDEN=(carrier.ts http.ts server.ts server/artwork-source.ts)

die()  { printf '\033[31m%s\033[0m\n' "$*" >&2; exit 1; }
ok()   { printf '\033[32m%s\033[0m\n' "$*"; }
warn() { printf '\033[33m%s\033[0m\n' "$*"; }

var() { printf '%s' "${1//-/_}"; }
repo_of() { local v; v="REPO_$(var "$1")"; printf '%s' "${!v}"; }
files_of() { local v; v="FILES_$(var "$1")[@]"; printf '%s\n' "${!v}"; }
src_of() { printf '%s' "$PROJECTS/$(repo_of "$1")/src"; }

[ -d "$HOST/src/add-ons" ] || die "run this from inside the print-shop checkout"

# Which add-on repos are actually beside us. Named, so the message says which.
MISSING=()
for key in "${KEYS[@]}"; do
  [ -d "$(src_of "$key")" ] || MISSING+=("$PROJECTS/$(repo_of "$key")")
done

require_sources() {
  [ ${#MISSING[@]} -eq 0 ] && return 0
  printf 'add-on checkouts not found:\n' >&2
  printf '  %s\n' "${MISSING[@]}" >&2
  die "clone them beside this repo, or set ADD_ONS_DIR to where they live"
}

# The header every vendored file wears. Four lines, then the file verbatim.
# `status` cuts exactly these lines back off, so editing the wording here is a
# one-line change followed by a sync, never a drift report.
header() { # $1 = key, $2 = repo, $3 = path within src/, $4 = comment opener
  local open="$4"
  cat <<EOF
$open
 * VENDORED from $2/src/$3 — synced by scripts/sync-add-ons.sh.
 * Never hand-edit this copy: edit the add-on repo and re-run \`sync-add-ons.sh sync\`.
 * The add-on key is \`$1\`; its manifest, tests and README live in that repo.
 */
EOF
}

HEADER_LINES=5

# ---------------------------------------------------------------------------

cmd_list() {
  for key in "${KEYS[@]}"; do
    local n
    n=$(files_of "$key" | wc -l | tr -d ' ')
    printf '%-16s %-24s %s files\n' "$key" "$(repo_of "$key")" "$n"
    files_of "$key" | sed 's/^/    /'
  done
}

# ---------------------------------------------------------------------------

cmd_sync() {
  require_sources
  local total=0
  for key in "${KEYS[@]}"; do
    local repo src dest
    repo="$(repo_of "$key")"
    src="$(src_of "$key")"
    dest="$VENDOR/$key"
    rm -rf "$dest"
    mkdir -p "$dest"
    local n=0
    while IFS= read -r rel; do
      [ -f "$src/$rel" ] || die "$repo: $rel is in the file list but not in the repo"
      mkdir -p "$dest/$(dirname "$rel")"
      # .css takes the same block comment; every extension here is either
      # C-style-commented or CSS, so one opener serves both.
      { header "$key" "$repo" "$rel" "/*"; cat "$src/$rel"; } > "$dest/$rel"
      n=$((n + 1))
    done < <(files_of "$key")
    printf '%-16s %-24s %s files\n' "$key" "$repo" "$n"
    total=$((total + n))
  done
  ok "vendored $total files into src/add-ons/vendor"
  echo "now run, in $HOST:  npx tsc -b && npx vitest run && npx vite build"
}

# ---------------------------------------------------------------------------

cmd_status() {
  local drift=0
  printf '%-16s %-24s %-8s %s\n' ADD-ON REPO FILES STATE
  for key in "${KEYS[@]}"; do
    local repo src dest state=ok n=0 want have_src=1
    repo="$(repo_of "$key")"
    src="$(src_of "$key")"
    dest="$VENDOR/$key"
    want=$(files_of "$key" | wc -l | tr -d ' ')
    [ -d "$src" ] || have_src=0

    if [ ! -d "$dest" ]; then
      state="MISSING"; drift=1
    else
      while IFS= read -r rel; do
        if [ ! -f "$dest/$rel" ]; then
          state="MISSING $rel"; drift=1; continue
        fi
        n=$((n + 1))
        # Cut the header back off, then compare against the repo byte for byte.
        # With no repo beside us there is nothing to compare to, and saying so
        # is honest where claiming "ok" would not be.
        if [ "$have_src" -eq 1 ] &&
           ! tail -n "+$((HEADER_LINES + 1))" "$dest/$rel" | cmp -s - "$src/$rel"; then
          state="DRIFT $rel"; drift=1
        fi
      done < <(files_of "$key")

      # Anything under vendor/ that the list does not name is either a stale
      # file from an older sync or something nobody decided to ship.
      while IFS= read -r extra; do
        files_of "$key" | grep -qxF "$extra" || { state="EXTRA $extra"; drift=1; }
      done < <(cd "$dest" && find . -type f | sed 's|^\./||' | sort)

      # D15: the server half must not be reachable from a browser bundle.
      for f in "${FORBIDDEN[@]}"; do
        [ -e "$dest/$f" ] && { state="SECRET-LEAK $f"; drift=1; }
      done

      [ "$have_src" -eq 0 ] && [ "$state" = ok ] && state="SOURCE-MISSING (not compared)"
    fi
    printf '%-16s %-24s %-8s %s\n' "$key" "$repo" "$n/$want" "$state"
  done
  echo
  if [ "$drift" -ne 0 ]; then
    die "drift found — run: scripts/sync-add-ons.sh sync"
  fi
  if [ ${#MISSING[@]} -ne 0 ]; then
    warn "vendored files are complete; ${#MISSING[@]} add-on repo(s) absent, so nothing was compared"
    printf '  %s\n' "${MISSING[@]}"
    exit 0
  fi
  ok "all three in sync"
}

case "${1:-status}" in
  status) cmd_status ;;
  sync)   cmd_sync ;;
  list)   cmd_list ;;
  *) die "usage: sync-add-ons.sh [status|sync|list]" ;;
esac
