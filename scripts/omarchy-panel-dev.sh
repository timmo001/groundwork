#!/usr/bin/env bash
# Publishes the Omarchy panel demo into the local Omarchy plugins folder, with
# the shared panel components from qml/ beside it, and puts back whatever was
# there when it stops. Run through pitchfork with `mise run demo:panel`.

set -euo pipefail

repo_dir="$(realpath "$(dirname "${BASH_SOURCE[0]}")/..")"
source_dir="$repo_dir/templates/omarchy-panel"
plugin_dir="${XDG_CONFIG_HOME:-$HOME/.config}/omarchy/plugins/timmo.groundwork-demo"
backup_dir="$(mktemp -d)"
had_plugin=false

cleanup() {
  trap - EXIT INT TERM HUP
  rm -rf "$plugin_dir"
  if [[ "$had_plugin" == true ]]; then
    mv "$backup_dir/plugin" "$plugin_dir"
  fi
  rm -rf "$backup_dir"
}

trap cleanup EXIT
trap 'exit 143' INT TERM HUP

if [[ -d "$plugin_dir" ]]; then
  had_plugin=true
  mv "$plugin_dir" "$backup_dir/plugin"
fi

mkdir -p "$plugin_dir"
cp "$source_dir/manifest.json" "$source_dir/Panel.qml" "$repo_dir"/qml/*.qml "$plugin_dir/"
omarchy plugin validate "$plugin_dir"
printf 'Published %s to %s\n' "$source_dir" "$plugin_dir"

while true; do sleep 3600; done
