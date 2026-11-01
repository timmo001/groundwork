/**
 * The requests the demo view makes of the main process, beside the desktop
 * ones. Shared by both sides so the calls stay typed.
 */

/** What the demo shows about the machine it runs on. */
export interface SystemInfo {
  readonly platform: string;
  readonly arch: string;
  readonly bun: string;
  readonly webview: string;
}

/** The demo's own requests; a type rather than an interface, so it fits a record of requests. */
export type DemoRequests = {
  readonly systemInfo: () => SystemInfo;
};
