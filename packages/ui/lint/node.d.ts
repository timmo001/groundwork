/**
 * The few Node functions the lint plugin uses. The package typechecks without
 * Node's types, since its source runs in the browser.
 */
declare module "node:fs" {
  export function existsSync(path: string): boolean;
  export function readFileSync(path: string, encoding: "utf8"): string;
}

declare module "node:path" {
  export function dirname(path: string): string;
  export function resolve(...paths: string[]): string;
}
