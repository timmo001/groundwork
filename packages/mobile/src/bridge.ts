/**
 * The messages between the Android shell and its view, mirroring the
 * desktop's requests and messages. They travel as JSON text over the object
 * the shell injects with `WebViewCompat.addWebMessageListener`, each with a
 * `type`, so the Kotlin side reads them without a schema library. Every
 * reply and message is parsed here as it comes in. An app adds its own
 * requests and messages beside these, with its own schemas.
 */
import { Option, Schema } from "effect";

/** The name of the object the shell injects into allowed pages. */
export const bridgeObjectName = "groundworkShell";

/** A notification for the shell to show, or a notice in the app without one. */
export const Notice = Schema.Struct({
  heading: Schema.String,
  body: Schema.optionalKey(Schema.String),
  tone: Schema.optionalKey(
    Schema.Literals(["neutral", "info", "success", "warning", "danger"]),
  ),
  /** Like notices share a tag, so a new one replaces the last. */
  tag: Schema.optionalKey(Schema.String),
  /** Opens this page, relative to the app, on a tap. */
  link: Schema.optionalKey(Schema.String),
});

export interface Notice extends Schema.Schema.Type<typeof Notice> {}

/**
 * A share from another app, the same shape the PWA's share target gives,
 * plus the id of the sharing shortcut it was sent to, in the shell.
 */
export const ShellShare = Schema.Struct({
  title: Schema.optionalKey(Schema.String),
  text: Schema.optionalKey(Schema.String),
  url: Schema.optionalKey(Schema.String),
  shortcutId: Schema.optionalKey(Schema.String),
});

export interface ShellShare extends Schema.Schema.Type<typeof ShellShare> {}

/**
 * A launcher shortcut that opens `url` as a deep link: on a long press of
 * the app's icon, pinned to the home screen, and with `share` in the share
 * sheet's direct row too.
 */
export const Shortcut = Schema.Struct({
  /** Stays the same across updates, so a pinned one keeps working. */
  id: Schema.String,
  label: Schema.String,
  /** Shown where there's room, such as in the long-press menu. */
  longLabel: Schema.optionalKey(Schema.String),
  /** An allowed origin's page, or the app's own scheme. */
  url: Schema.String,
  /** An SVG path on a 24 unit grid, such as a Material Design Icon. */
  icon: Schema.optionalKey(Schema.String),
  /**
   * A sharing shortcut, whose shares carry its id as `shortcutId`. It shows
   * on a long press as well, so list it after the ones meant for that.
   */
  share: Schema.optionalKey(Schema.Boolean),
});

export interface Shortcut extends Schema.Schema.Type<typeof Shortcut> {}

export const DeepLink = Schema.Struct({ url: Schema.String });

export interface DeepLink extends Schema.Schema.Type<typeof DeepLink> {}

/** One mode's Material roles, as `androidTheme` in the tokens reads them. */
export const AndroidSchemeColors = Schema.Struct({
  surface: Schema.optionalKey(Schema.String),
  surfaceContainerLowest: Schema.optionalKey(Schema.String),
  surfaceContainer: Schema.optionalKey(Schema.String),
  surfaceContainerHigh: Schema.optionalKey(Schema.String),
  onSurface: Schema.optionalKey(Schema.String),
  onSurfaceVariant: Schema.optionalKey(Schema.String),
  outlineVariant: Schema.optionalKey(Schema.String),
  primary: Schema.optionalKey(Schema.String),
  error: Schema.optionalKey(Schema.String),
});

/** The phone's dynamic color, or `null` where there's none or it's off. */
export const AndroidThemeMessage = Schema.Struct({
  colors: Schema.NullOr(
    Schema.Struct({ light: AndroidSchemeColors, dark: AndroidSchemeColors }),
  ),
});

export interface AndroidThemeMessage extends Schema.Schema.Type<
  typeof AndroidThemeMessage
> {}

/** Where push stands, as the PWA's `pushState` reports it. */
export const ShellPushState = Schema.Literals([
  "unsupported",
  "default",
  "denied",
  "subscribed",
]);

export type ShellPushState = Schema.Schema.Type<typeof ShellPushState>;

/** What the shell reports about itself. */
export const ShellInfo = Schema.Struct({
  /** True in debug builds. */
  dev: Schema.Boolean,
  /** The shell's version, from the synced copy. */
  version: Schema.String,
});

export interface ShellInfo extends Schema.Schema.Type<typeof ShellInfo> {}

/**
 * Whether the app may reach the local network: `granted` (or not gated,
 * before Android 17), `denied`, or `undeclared` when the app's manifest
 * lacks ACCESS_LOCAL_NETWORK.
 */
export const LocalNetworkState = Schema.Literals([
  "granted",
  "denied",
  "undeclared",
]);

export type LocalNetworkState = Schema.Schema.Type<typeof LocalNetworkState>;

/** One mDNS service, resolved. */
export const DiscoveredService = Schema.Struct({
  /** The instance name, such as `Office PC`. */
  name: Schema.String,
  type: Schema.String,
  /** The `.local` hostname, on Android 17 and up. */
  hostname: Schema.NullOr(Schema.String),
  /** An address ready for a URL, IPv4 first, IPv6 in brackets. */
  host: Schema.NullOr(Schema.String),
  addresses: Schema.Array(Schema.String),
  port: Schema.Number,
  /** The TXT record's attributes, `null` for one with no value. */
  txt: Schema.Record(Schema.String, Schema.NullOr(Schema.String)),
});

export interface DiscoveredService extends Schema.Schema.Type<
  typeof DiscoveredService
> {}

/**
 * How `discoverServices` finds them: `picker` asks the person to choose one
 * in the system's picker, which grants the app that device alone; `browse`
 * lists every service, asking for the local network permission first. Left
 * out, it browses when it may and shows the picker otherwise.
 */
export const DiscoveryMode = Schema.Literals(["picker", "browse"]);

export type DiscoveryMode = Schema.Schema.Type<typeof DiscoveryMode>;

/**
 * The shell's requests, each with the schema its reply is read with. The
 * Kotlin side answers the same names.
 */
export const mobileRequests = {
  info: ShellInfo,
  /** Opens a URL in the browser or the app that handles it. */
  openExternal: Schema.Boolean,
  /** A system notification when the config turns them on, otherwise false. */
  notify: Schema.Boolean,
  /** The phone's dynamic color, when the config passes it on. */
  androidTheme: AndroidThemeMessage,
  /** Registers for UnifiedPush and posts the endpoint through the push contract. */
  subscribePush: ShellPushState,
  unsubscribePush: Schema.Boolean,
  pushState: ShellPushState,
  /** Asks for local network access where Android gates it. */
  localNetwork: LocalNetworkState,
  /** Finds mDNS services of a type, such as `_http._tcp`. */
  discoverServices: Schema.Array(DiscoveredService),
  /** Scans a QR code with the camera: its text, or `null` when cancelled. */
  scanQr: Schema.NullOr(Schema.String),
  /** Replaces the dynamic shortcuts: how many the launcher took. */
  setShortcuts: Schema.Number,
  /** Asks the launcher to pin a shortcut: false where it can't. */
  pinShortcut: Schema.Boolean,
  /** Removes shortcuts, greying out pinned ones. */
  disableShortcuts: Schema.Boolean,
} as const;

/** The shell's messages, each with the schema its data is read with. */
export const mobileMessages = {
  notice: Notice,
  /** A deep link or App Link the app was opened with. */
  deepLink: DeepLink,
  /** A share from another app. */
  share: ShellShare,
  /** The phone's dynamic color changed, such as with a new wallpaper. */
  androidTheme: AndroidThemeMessage,
} as const;

/**
 * The wire format. The view sends `request`; the shell answers each with a
 * `reply` carrying its `id`, and sends `message` whenever it has news.
 */
export const BridgeRequest = Schema.Struct({
  type: Schema.Literal("request"),
  id: Schema.Number,
  name: Schema.String,
  params: Schema.optionalKey(Schema.Json),
});

export interface BridgeRequest extends Schema.Schema.Type<
  typeof BridgeRequest
> {}

export const BridgeReply = Schema.Struct({
  type: Schema.Literal("reply"),
  id: Schema.Number,
  ok: Schema.Boolean,
  value: Schema.optionalKey(Schema.Json),
  error: Schema.optionalKey(Schema.String),
});

export interface BridgeReply extends Schema.Schema.Type<typeof BridgeReply> {}

export const BridgeMessage = Schema.Struct({
  type: Schema.Literal("message"),
  name: Schema.String,
  data: Schema.optionalKey(Schema.Json),
});

export interface BridgeMessage extends Schema.Schema.Type<
  typeof BridgeMessage
> {}

const decodeIncoming = Schema.decodeUnknownOption(
  Schema.fromJsonString(Schema.Union([BridgeReply, BridgeMessage])),
);

/** Reads what the shell sent, or `undefined` when it isn't bridge JSON. */
export const decodeIncomingText = (
  text: string,
): BridgeReply | BridgeMessage | undefined =>
  Option.getOrUndefined(decodeIncoming(text));
