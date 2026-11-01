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
