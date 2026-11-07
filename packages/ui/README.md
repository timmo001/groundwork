# @timmo001/groundwork-ui

Groundwork's web components: framework-free custom elements styled by the
`--gw-*` tokens from
[`@timmo001/groundwork-tokens`](https://www.npmjs.com/package/@timmo001/groundwork-tokens).

## Install

```sh
bun add -E @timmo001/groundwork-ui @timmo001/groundwork-tokens
```

## Use

Import the theme CSS once, then the components. Importing the package defines
every `gw-` element.

```ts
import "@timmo001/groundwork-tokens/themes.css";
import "@timmo001/groundwork-ui";
```

To define only the elements an app uses, import each one's `define/` entry,
which also defines the elements it renders. The element files themselves,
such as `gw-button.ts`, only export the class and define nothing, so an app
can extend or wrap a class, or register it under its own tag.

```ts
import "@timmo001/groundwork-ui/define/gw-button.ts";
import { GwSelect } from "@timmo001/groundwork-ui/gw-select.ts";
```

`define()` leaves a tag another class already holds to that class, with a
console warning, as when two copies of the package load.

```html
<html data-gw-theme="base" data-gw-mode="dark">
  <gw-button appearance="filled">Save</gw-button>
</html>
```

The package ships TypeScript source, so it needs a bundler that compiles it,
such as Vite, Astro or Bun.

Every component, its attributes, slots, parts and events are documented at
[groundwork.timmo.dev/components](https://groundwork.timmo.dev/components).

## Custom Elements Manifest

The package ships `custom-elements.json`, a
[Custom Elements Manifest](https://custom-elements-manifest.open-wc.org/)
generated from each element's class docstring, and points to it from
`customElements` in `package.json`. Editors, `lit-analyzer` and framework
wrappers read it for the elements' attributes, properties, slots, parts and
events. `mise run gen` writes it, and `mise run check` fails when it's stale.
