# @timmo001/groundwork-tokens

Groundwork's design tokens: the theme schema, the OKLCH solver that turns a
theme into every role in light, dark and Darker, and every core and optional
theme as CSS and JSON.

## Install

```sh
bun add -E @timmo001/groundwork-tokens
```

## Use

The CSS sets every `--gw-*` custom property for each theme and mode, chosen by
`data-gw-theme` and `data-gw-mode`:

```ts
import "@timmo001/groundwork-tokens/themes.css";
```

```html
<html data-gw-theme="base" data-gw-mode="dark"></html>
```

`themes.json` holds the same solved themes as data. The `runtime` export
solves and applies a theme in the browser, for apps that let people bring
their own:

```ts
import { parseTheme, runtimeTheme } from "@timmo001/groundwork-tokens/runtime";
```

The themes, their roles and contrast targets are documented at
[groundwork.timmo.dev/themes](https://groundwork.timmo.dev/themes).
