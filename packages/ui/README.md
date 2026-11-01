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

```html
<html data-gw-theme="base" data-gw-mode="dark">
  <gw-button variant="primary" appearance="filled">Save</gw-button>
</html>
```

The package ships TypeScript source, so it needs a bundler that compiles it,
such as Vite, Astro or Bun.

Every component, its attributes, slots, parts and events are documented at
[groundwork.timmo.dev/components](https://groundwork.timmo.dev/components).
