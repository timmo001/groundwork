/**
 * The view half of `@timmo001/groundwork-desktop`: the browser defaults a
 * system webview lacks, built from Groundwork components. That's find in
 * page, the right-click menu, the reload, zoom, history and dev tools keys,
 * and in-app notices. The main half's `openDesktopWindow` answers its
 * requests.
 *
 * The app defines the RPC with its own Electrobun, so it keeps its pinned
 * release and Electrobun's types:
 *
 *   const desktop = await connectDesktop<AppRequests>((messages) => {
 *     const rpc = Electroview.defineRPC<DesktopSchema<AppRequests>>({ handlers: { messages } });
 *
 *     new Electroview({ rpc });
 *     return rpc;
 *   });
 */
import "@timmo001/groundwork-ui";

import type { ResolvedDesktopConfig } from "./config.ts";
import type {
  DesktopMessageHandlers,
  DesktopRequests,
  Notice,
  Reply,
  RequestHandlers,
} from "./rpc.ts";

export * from "./config.ts";

export type * from "./rpc.ts";

/** A set of requests as the view calls them: each one resolves later. */
export type Client<R> = {
  readonly [K in keyof R]: R[K] extends (...params: infer P) => infer T
    ? (...params: P) => Promise<Awaited<T>>
    : never;
};

/** The view's end of Electrobun's RPC, with the desktop requests and the app's own. */
export interface ViewRPC<AppRequests extends RequestHandlers> {
  readonly request: Client<DesktopRequests> & Client<AppRequests>;
}

/** What `connectDesktop` sets up. */
export interface ConnectOptions {
  /** Called with each deep link the app is opened with. */
  readonly onDeepLink?: (url: string) => void;
}

/** The connection to the main process. */
export interface Desktop<AppRequests extends RequestHandlers> {
  readonly config: ResolvedDesktopConfig;
  /** True in dev builds. */
  readonly dev: boolean;
  /** The desktop requests and the app's own. */
  readonly request: Client<DesktopRequests> & Client<AppRequests>;
  /** A system notification when the config turns them on, otherwise in the app. */
  readonly notify: (notice: Notice) => Promise<void>;
  /** Opens the find bar. */
  readonly find: () => void;
}

/** One entry in the right-click menu: a label and what it does, or a divider. */
type MenuItem = readonly [string, () => Reply | Promise<Reply>] | "divider";

const icons = {
  search:
    "M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z",
  up: "M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z",
  down: "M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z",
  close:
    "M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z",
  info: "M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z",
};

const styles = `
  .gw-desktop-find {
    position: fixed;
    inset-block-start: var(--gw-space-2);
    inset-inline-end: var(--gw-space-2);
    z-index: 1000;
    display: flex;
    gap: var(--gw-space-1);
    align-items: center;
    padding: var(--gw-space-1);
    background: var(--gw-color-surface-overlay);
    border: max(var(--gw-border-width), 1px) solid var(--gw-color-border-normal);
    border-radius: var(--gw-radius-l);
    box-shadow: var(--gw-shadow-m);
    transition:
      opacity var(--gw-motion-fast) var(--gw-motion-easing),
      translate var(--gw-motion-normal) var(--gw-motion-easing);
  }

  .gw-desktop-find[hidden] {
    display: flex;
    pointer-events: none;
    visibility: hidden;
    opacity: 0;
    translate: 0 -0.5rem;
  }

  .gw-desktop-find gw-input {
    width: 16rem;
  }

  .gw-desktop-menu {
    position: fixed;
    inset: auto;
    box-sizing: border-box;
    display: none;
    flex-direction: column;
    gap: var(--gw-space-0-5);
    min-width: 12rem;
    padding: var(--gw-space-1);
    margin: 0;
    color: var(--gw-color-text-primary);
    background: var(--gw-color-surface-overlay);
    border: max(var(--gw-border-width), 1px) solid var(--gw-color-border-normal);
    border-radius: var(--gw-radius-l);
    box-shadow: var(--gw-shadow-m);
    opacity: 0;
    transition:
      opacity var(--gw-motion-fast) var(--gw-motion-easing),
      display var(--gw-motion-fast) allow-discrete,
      overlay var(--gw-motion-fast) allow-discrete;
  }

  .gw-desktop-menu:popover-open {
    display: flex;
    opacity: 1;
  }

  @starting-style {
    .gw-desktop-menu:popover-open {
      opacity: 0;
    }
  }

  .gw-desktop-menu button {
    box-sizing: border-box;
    min-height: 2.25rem;
    padding: var(--gw-space-1-5, var(--gw-space-2)) var(--gw-space-3);
    font: inherit;
    font-size: var(--gw-font-size-s);
    color: inherit;
    text-align: start;
    cursor: pointer;
    background: transparent;
    border: 0;
    border-radius: var(--gw-radius-m);
  }

  .gw-desktop-menu button:hover,
  .gw-desktop-menu button:focus-visible {
    background: var(--gw-color-fill-neutral-hovered);
    outline: none;
  }

  .gw-desktop-menu button:focus-visible {
    box-shadow: inset 0 0 0 var(--gw-focus-width) var(--gw-color-focus);
  }

  .gw-desktop-menu hr {
    width: 100%;
    margin: var(--gw-space-0-5) 0;
    border: 0;
    border-block-start: max(var(--gw-border-width), 1px) solid var(--gw-color-border-normal);
  }

  .gw-desktop-notices {
    position: fixed;
    inset-block-end: var(--gw-space-3);
    inset-inline-end: var(--gw-space-3);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: var(--gw-space-2);
    width: min(22rem, calc(100vw - 2 * var(--gw-space-3)));
    pointer-events: none;
  }

  .gw-desktop-notices gw-notification {
    pointer-events: auto;
    overflow-wrap: anywhere;
  }
`;

const element = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes: Record<string, string> = {},
): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag);

  for (const [name, value] of Object.entries(attributes))
    node.setAttribute(name, value);

  return node;
};

const isTextField = (
  node: EventTarget | undefined,
): node is HTMLInputElement | HTMLTextAreaElement =>
  node instanceof HTMLTextAreaElement ||
  (node instanceof HTMLInputElement &&
    /^(text|search|url|tel|email|password|number|)$/.test(node.type));

const isEditable = (node: EventTarget | undefined): node is HTMLElement =>
  isTextField(node) || (node instanceof HTMLElement && node.isContentEditable);

const selectedText = (node: EventTarget | undefined): string =>
  isTextField(node)
    ? node.value.slice(node.selectionStart ?? 0, node.selectionEnd ?? 0)
    : (document.getSelection()?.toString() ?? "");

// Typing into a field the way a keyboard would, so its listeners hear it
const insertText = (node: HTMLElement, text: string) => {
  node.focus();

  if (isTextField(node)) {
    node.setRangeText(
      text,
      node.selectionStart ?? node.value.length,
      node.selectionEnd ?? node.value.length,
      "end",
    );
    node.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        composed: true,
        inputType: "insertText",
        data: text,
      }),
    );
  } else {
    document.execCommand("insertText", false, text);
  }
};

const linkOf = (path: readonly EventTarget[]): string | undefined => {
  for (const node of path) {
    if (node instanceof HTMLAnchorElement && node.href !== "") return node.href;
  }

  return undefined;
};

/** Connects the view to the main process and sets up the defaults its config leaves on. */
export const connectDesktop = async <AppRequests extends RequestHandlers = {}>(
  createRPC: (messages: DesktopMessageHandlers) => ViewRPC<AppRequests>,
  options: ConnectOptions = {},
): Promise<Desktop<AppRequests>> => {
  const notices = element("div", {
    class: "gw-desktop-notices",
    role: "region",
    "aria-label": "Notifications",
  });

  const showNotice = ({ heading, body, tone = "neutral" }: Notice) => {
    const card = element("gw-notification", {
      heading,
      tone,
      icon: icons.info,
      unread: "",
    });

    if (body !== undefined) card.textContent = body;
    card.addEventListener("dismiss", () => card.remove());
    notices.append(card);

    // Only the newest few stay; the rest have been seen or can go
    while (notices.childElementCount > 3) notices.firstElementChild?.remove();
  };

  const rpc = createRPC({
    notice: showNotice,
    deepLink: ({ url }) => {
      options.onDeepLink?.(url);
      window.dispatchEvent(
        new CustomEvent("gw-deep-link", { detail: { url } }),
      );
    },
  });

  const request: Client<DesktopRequests> = rpc.request;
  const { config, dev } = await request.config();
  const sheet = new CSSStyleSheet();

  sheet.replaceSync(styles);
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  document.body.append(notices);

  const notify = async (notice: Notice) => {
    if (!(await request.notify(notice))) showNotice(notice);
  };

  // Find in page: a bar in the top end corner, over the page so nothing moves
  const findBar = element("div", {
    class: "gw-desktop-find",
    role: "search",
    hidden: "",
  });

  const findField = element("gw-input", {
    label: "Find in page",
    "label-hidden": "",
    placeholder: "Find",
    icon: icons.search,
    size: "small",
    autocomplete: "off",
  });

  const findButton = (label: string, icon: string, run: () => void) => {
    const button = element("gw-button", {
      appearance: "plain",
      size: "small",
      labels: "hide",
      label,
      icon,
    });

    button.textContent = label;
    button.addEventListener("click", run);

    return button;
  };

  let findReturn: Element | null = null;

  const findText = () => findField.querySelector("input")?.value ?? "";

  const search = async (forward: boolean) => {
    const input = findField.querySelector("input");

    if (input === null || input.value === "") return;
    const start = input.selectionStart;
    const end = input.selectionEnd;

    await request.find({ text: input.value, forward });

    // The webview's find selects the match and takes focus; keep typing in the field
    if (findBar.hidden) return;
    input.focus();
    input.setSelectionRange(start, end);
  };

  const closeFind = () => {
    if (findBar.hidden) return;
    findBar.hidden = true;
    void request.stopFind();

    if (findReturn instanceof HTMLElement) findReturn.focus();
  };

  const openFind = () => {
    if (!config.find) return;

    if (findBar.hidden) findReturn = document.activeElement;
    findBar.hidden = false;
    const input = findField.querySelector("input");

    input?.focus();
    input?.select();
  };

  findBar.append(
    findField,
    findButton("Previous match", icons.up, () => void search(false)),
    findButton("Next match", icons.down, () => void search(true)),
    findButton("Close find", icons.close, closeFind),
  );
  findField.addEventListener("input", () =>
    findText() === "" ? void request.stopFind() : void search(true),
  );
  findBar.addEventListener("keydown", (event) => {
    if (event.key === "Enter") void search(!event.shiftKey);
    else if (event.key === "Escape") closeFind();
    else return;
    event.preventDefault();
    event.stopPropagation();
  });

  if (config.find) document.body.append(findBar);

  // The right-click menu: what a browser offers for the text or link under it
  const menu = element("div", {
    class: "gw-desktop-menu",
    popover: "auto",
    role: "menu",
  });

  let menuReturn: Element | null = null;

  const closeMenu = () => {
    menu.hidePopover();

    if (menuReturn instanceof HTMLElement) menuReturn.focus();
  };

  const showMenu = (event: MouseEvent, items: readonly MenuItem[]) => {
    menu.replaceChildren(
      ...items.map((item) => {
        if (item === "divider") return element("hr");
        const [label, run] = item;

        const button = element("button", {
          type: "button",
          role: "menuitem",
          tabindex: "-1",
        });

        button.textContent = label;
        button.addEventListener("click", () => {
          closeMenu();
          void run();
        });

        return button;
      }),
    );

    menuReturn = document.activeElement;
    menu.style.left = `${event.clientX}px`;
    menu.style.top = `${event.clientY}px`;
    menu.showPopover();

    // Kept inside the window, flipping to the other side of the pointer
    const { width, height } = menu.getBoundingClientRect();

    if (event.clientX + width > innerWidth)
      menu.style.left = `${Math.max(0, event.clientX - width)}px`;

    if (event.clientY + height > innerHeight)
      menu.style.top = `${Math.max(0, event.clientY - height)}px`;
    menu.querySelector("button")?.focus();
  };

  menu.addEventListener("keydown", (event) => {
    const buttons = [...menu.querySelectorAll("button")];

    const index = buttons.findIndex(
      (button) => button === document.activeElement,
    );

    const next =
      event.key === "ArrowDown"
        ? (index + 1) % buttons.length
        : event.key === "ArrowUp"
          ? (index - 1 + buttons.length) % buttons.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? buttons.length - 1
              : undefined;

    if (next === undefined) return;
    event.preventDefault();
    buttons[next]?.focus();
  });

  if (config.contextMenu) {
    document.body.append(menu);
    document.addEventListener("contextmenu", (event) => {
      const path = event.composedPath();
      const target = path[0];
      const editable = path.find(isEditable);
      const link = linkOf(path);
      const text = selectedText(editable ?? target);
      const copy = (value: string) => request.clipboardWrite({ text: value });
      const items: MenuItem[] = [];

      if (editable !== undefined && config.clipboard) {
        items.push(
          [
            "Cut",
            async () => {
              await copy(selectedText(editable));
              insertText(editable, "");
            },
          ],
          ["Copy", () => copy(selectedText(editable))],
          [
            "Paste",
            async () => insertText(editable, await request.clipboardRead()),
          ],
        );
      } else if (text !== "" && config.clipboard) {
        items.push(["Copy", () => copy(text)]);
      }

      if (editable !== undefined) {
        items.push([
          "Select all",
          () => {
            editable.focus();

            if (isTextField(editable)) editable.select();
            else document.execCommand("selectAll");
          },
        ]);
      }

      if (link !== undefined) {
        if (items.length > 0) items.push("divider");

        if (config.clipboard) items.push(["Copy link", () => copy(link)]);
        items.push([
          "Open link in browser",
          () => request.openExternal({ url: link }),
        ]);
      }

      // Nothing to offer here, so no menu at all, as in a browser's app mode
      event.preventDefault();

      if (items.length > 0) showMenu(event, items);
    });
  }

  // Browser keys
  document.addEventListener("keydown", (event) => {
    const ctrl = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();
    let handled = true;

    if (config.find && ctrl && key === "f") openFind();
    else if (config.find && (event.key === "F3" || (ctrl && key === "g"))) {
      if (findBar.hidden) openFind();
      else void search(!event.shiftKey);
    } else if (config.reload && (event.key === "F5" || (ctrl && key === "r")))
      location.reload();
    else if (config.zoomKeys && ctrl && (key === "=" || key === "+"))
      void request.zoom({ step: "in" });
    else if (config.zoomKeys && ctrl && key === "-")
      void request.zoom({ step: "out" });
    else if (config.zoomKeys && ctrl && key === "0")
      void request.zoom({ step: "reset" });
    else if (config.history && event.altKey && event.key === "ArrowLeft")
      history.back();
    else if (config.history && event.altKey && event.key === "ArrowRight")
      history.forward();
    else if (
      config.devTools &&
      dev &&
      (event.key === "F12" || (ctrl && event.shiftKey && key === "i"))
    )
      void request.devTools();
    else handled = false;

    if (handled) event.preventDefault();
  });

  if (config.history) {
    // The mouse's side buttons: 3 is back and 4 forward
    document.addEventListener("mouseup", (event) => {
      if (event.button === 3) history.back();
      else if (event.button === 4) history.forward();
      else return;
      event.preventDefault();
    });
  }

  return { config, dev, request: rpc.request, notify, find: openFind };
};
