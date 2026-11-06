---
title: Lit
description: lit-effect's AtomController, registry context, typed router and @storage decorator, joining Lit components to Effect atoms.
---

`lit-effect` is the glue between Lit and Effect. App state lives in Effect atoms (`effect/reactivity`); components read them through a controller, and the URL is an atom too. It reaches apps through the [sync](/sync) as the `lit-effect` item.

## AtomController

```ts
import { AtomController } from "./atom-controller.js";

class GwIssues extends LitElement {
  readonly #issues = new AtomController(this, () => issuesAtom(this.query));

  override render() {
    return renderList(this.#issues.value);
  }
}
```

It keeps the atom mounted while the component is connected and redraws the component when the atom changes. The selector runs before each render, so the atom can depend on the component's properties.

## Registry context

Atoms are read from the registry provided by `registryContext` above the component, or `defaultRegistry` when none is. Provide one with `@lit/context`'s `ContextProvider` to give part of an app, or a test, a registry of its own.

## Router

```ts
const router = makeRouter(
  {
    home: route("/", NoParams, NoSearch),
    issue: route("/issues/:id", Schema.Struct({ id: Schema.String }), IssueSearch),
  },
  { basePath: import.meta.env.BASE_URL },
);

router.href("issue", { params: { id: "42" }, search: { q: "fan" } });
// "/issues/42?q=fan"
```

Routes' params and search are Schema codecs, so links are built from typed values and URLs decode back to them. A search param that doesn't decode is dropped rather than losing the page. `currentLocation` is an atom: links within the app navigate without a reload, back and forward follow it, and scroll positions are restored. `updateSearch` changes some search params and keeps the rest, which suits filters and sorting kept in the URL.

## Storage

```ts
import { Schema } from "effect";
import { storage } from "./storage.js";

class GwIssues extends LitElement {
  @storage({
    key: "issues:view",
    storage: "sessionStorage",
    schema: Schema.Literals(["list", "board"]),
  })
  accessor view: "list" | "board" = "list";
}
```

`@storage` keeps an `accessor` property in `localStorage` (the default) or `sessionStorage`. Its `schema` checks the kept value each time it's read, so a stale or hand-edited one is ignored. The property starts from the kept value, or from its initializer when nothing valid is kept yet. Setting it keeps the new value and redraws the component, so it needs no `@state` of its own. While the component is connected, it also redraws when the value changes elsewhere: another component with the same key, `getStorage`, or another tab (localStorage only). Values are kept as JSON, and a write where storage is blocked still holds until the page closes. `getStorage("sessionStorage").get(key, schema)` and `.set(key, schema, value)` read and write the same values from code that isn't a property.

It's adapted from the Home Assistant frontend's storage decorator, for standard decorators rather than TypeScript's experimental ones.

## References

- [Lit: Decorators](https://lit.dev/docs/components/decorators/)
- [MDN: Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- [Home Assistant frontend: `src/common/decorators/storage.ts`](https://github.com/home-assistant/frontend/blob/dev/src/common/decorators/storage.ts)
