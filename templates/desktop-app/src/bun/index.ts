/**
 * The main process: opens the app's one window on the demo view. A real app
 * adds its tray, menus and backend connection here.
 */
import { BrowserWindow } from "electrobun/main";

new BrowserWindow({
  title: "Updates",
  url: "views://mainview/index.html",
  frame: {
    width: 760,
    height: 640,
    x: 200,
    y: 160,
  },
});
