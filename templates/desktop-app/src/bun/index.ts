/**
 * The main process: opens the app's one window on the demo view. A real app
 * adds its tray, menus and backend connection here.
 */
import { BrowserWindow } from "electrobun/main";

// GTK 3 only takes whole numbers in GDK_SCALE and drops the fraction, so on
// Linux the page zoom makes up the rest: 1.6 renders at 1 and zooms by 1.6
const gdkScale = Number(process.env.GDK_SCALE);

const toolkitZoom =
  process.platform === "linux" && gdkScale > 0
    ? gdkScale / Math.max(1, Math.floor(gdkScale))
    : 1;

// An extra factor on top, such as a browser's --force-device-scale-factor,
// so the app matches the size of browser windows
const zoom = toolkitZoom * (Number(process.env.GROUNDWORK_DESKTOP_ZOOM) || 1);

const window = new BrowserWindow({
  title: "Updates",
  url: "views://mainview/index.html",
  frame: {
    width: 760,
    height: 640,
    x: 200,
    y: 160,
  },
});

window.webview.setPageZoom(zoom);

window.webview.on("dom-ready", () => {
  window.webview.setPageZoom(zoom);
});
