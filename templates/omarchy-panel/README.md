# omarchy-panel template

The Omarchy panel target of Groundwork's [demo app](https://groundwork.timmo.dev/demo): a bar button with the pending count, opening a keyboard panel that lists the fixture items, built from Omarchy's own `Panel`, `KeyboardPanel` and `CursorSurface` and Groundwork's shared panel components in `qml/`.

```sh
mise run demo:panel     # publish it to the bar through Pitchfork
pitchfork stop panel    # take it off again and restore what was there
```

Once it's published, enable it once with `omarchy plugin enable timmo.groundwork-demo`, then click the button or run `qs ipc -p "$OMARCHY_PATH/shell/shell.qml" call timmo.groundwork-demo toggle`.

What it shows:

- The same fixture items as `@timmo001/groundwork-demo`: apply one, apply all, or restart to start over.
- Type to filter, arrow keys to move, Enter to activate, Escape to clear or close, Tab to the next panel.
- The panel's colors and font from the bar, so it follows the Omarchy theme.

The dev script copies `manifest.json`, `Panel.qml` and `qml/*.qml` into one plugin folder, since Omarchy loads a plugin from a single directory. Copy this folder, rename the plugin id, and replace the fixture items with a `Service.qml` that talks to the real system, as Up Next's plugin does.
