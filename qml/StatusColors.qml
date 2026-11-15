import QtQuick
import Quickshell.Io
import qs.Commons as Commons

// The status colors for a bar widget or panel: ok, running, warning, failed
// and muted. They follow the Omarchy theme's own green, blue, yellow and red
// by default, or a Groundwork theme's roles from Themes.qml, such as
// `roles: Themes.themes.glazing.dark`. Each can be set on its own too.
QtObject {
  id: root

  // A Groundwork theme mode's roles, in place of the Omarchy theme's colors.
  property var roles: ({})

  property color ok: pick("success", omarchyGreen)
  property color running: pick("info", omarchyBlue)
  property color warning: pick("warning", omarchyYellow)
  property color failed: pick("danger", Commons.Color.urgent)
  property color muted: pick("text-secondary", Commons.Color.muted)

  // The Omarchy theme's terminal colors, which its Color singleton doesn't
  // keep, read from its colors.toml.
  property color omarchyGreen: "#8fcf7a"
  property color omarchyBlue: Commons.Color.accent
  property color omarchyYellow: "#e6b45c"

  function pick(role, fallback) {
    var value = roles ? roles[role] : undefined
    return typeof value === "string" && value.length > 0 ? value : fallback
  }

  function loadColors(raw) {
    var named = {}
    var lines = String(raw || "").split("\n")
    for (var i = 0; i < lines.length; i++) {
      var match = lines[i].match(/^\s*([A-Za-z0-9_-]+)\s*=\s*["']?(#[0-9A-Fa-f]{6})/)
      if (match) named[match[1]] = match[2]
    }
    omarchyGreen = named.green || named.color2 || "#8fcf7a"
    omarchyYellow = named.yellow || named.color3 || "#e6b45c"
    omarchyBlue = named.blue || named.color4 || Commons.Color.accent
  }

  property FileView colorsFile: FileView {
    path: Commons.Color.currentThemePath + "/colors.toml"
    watchChanges: false
    printErrors: false
    onLoaded: root.loadColors(text())
  }

  // A theme switch changes the foreground or accent, so read them again then
  property Connections themeChanges: Connections {
    target: Commons.Color
    function onForegroundChanged() { root.colorsFile.reload() }
    function onAccentChanged() { root.colorsFile.reload() }
  }
}
