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

/** A share from another app, the same shape the PWA's share target gives. */
export const ShellShare = Schema.Struct({
  title: Schema.optionalKey(Schema.String),
  text: Schema.optionalKey(Schema.String),
  url: Schema.optionalKey(Schema.String),
});

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
