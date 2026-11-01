/**
 * The messages between a desktop app's main process and its view: what the
 * view asks for, and what the main process tells it. An app adds its own
 * requests beside these.
 */
import type { ResolvedDesktopConfig } from "./config.ts";

/** A notice for the view to show in the app, such as a finished download. */
export interface Notice {
  readonly heading: string;
  readonly body?: string;
  readonly tone?: "neutral" | "info" | "success" | "warning" | "danger";
}

/** What a request may answer with: anything that survives JSON. */
export type Reply = string | number | boolean | null | void | object;

/** An app's own requests from its view, by name. */
export type RequestHandlers = Record<
  string,
  (params: never) => Reply | Promise<Reply>
>;

/** What the view asks the main process for. */
export interface DesktopRequests {
  /** The resolved config and whether this is a dev build. */
  readonly config: () => {
    readonly config: ResolvedDesktopConfig;
    readonly dev: boolean;
  };
  /** Opens a URL in the system browser, when the config allows its scheme. */
  readonly openExternal: (params: { readonly url: string }) => boolean;
  readonly clipboardRead: () => string;
  readonly clipboardWrite: (params: { readonly text: string }) => boolean;
  /** Finds text in the page, or the next match. */
  readonly find: (params: {
    readonly text: string;
    readonly forward: boolean;
  }) => boolean;
  readonly stopFind: () => boolean;
  /** Steps the remembered zoom in or out, or back to 1. */
  readonly zoom: (params: { readonly step: "in" | "out" | "reset" }) => number;
  /** Opens or closes the dev tools, in dev builds only. */
  readonly devTools: () => boolean;
  /** A system notification when the config turns them on, otherwise false. */
  readonly notify: (params: Notice) => boolean;
}

/** What the main process tells the view. */
export interface DesktopMessages {
  readonly notice: Notice;
  /** A deep link the app was opened with. */
  readonly deepLink: { readonly url: string };
}

/** Requests in the `{ params, response }` shape Electrobun's schemas use. */
export type RequestSchemas<R> = {
  [K in keyof R]: R[K] extends () => infer T
    ? { params: undefined; response: Awaited<T> }
    : R[K] extends (params: infer P) => infer T
      ? { params: P; response: Awaited<T> }
      : never;
};

/**
 * The app's Electrobun RPC schema: the desktop requests and the app's own,
 * and the desktop messages. Pass it to `defineRPC` on both sides:
 *
 *   BrowserView.defineRPC<DesktopSchema<AppRequests>>(...)
 *   Electroview.defineRPC<DesktopSchema<AppRequests>>(...)
 */
export type DesktopSchema<AppRequests extends RequestHandlers = {}> = {
  bun: {
    requests: RequestSchemas<DesktopRequests & AppRequests>;
    messages: {};
  };
  webview: { requests: {}; messages: DesktopMessages };
};

/** The view's handlers for the desktop messages, for `Electroview.defineRPC`. */
export interface DesktopMessageHandlers {
  readonly notice: (notice: Notice) => void;
  readonly deepLink: (link: { readonly url: string }) => void;
}
