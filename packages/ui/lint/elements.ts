/**
 * Groundwork's local Oxlint plugin. `element-docs` checks that every element
 * a file defines documents its API in its class docstring, for editor hovers
 * and the Custom Elements Manifest: `@element`, `@summary`, then an `@attr`
 * for each property with an attribute, a `@slot` for each slot, a `@csspart`
 * for each part and a typed `@fires` for each event it dispatches. A
 * `@csspart` for a part the class doesn't render fails too.
 *
 * Moving it to the shared rules is tracked in timmo001/oxlint-rules#107.
 *
 * @module
 */
import { defineRule, eslintCompatPlugin } from "@oxlint/plugins";
import type { ESTree } from "@oxlint/plugins";

type Node = ESTree.Node;

/** What a class renders, reflects and dispatches, gathered as it's walked. */
interface ElementApi {
  readonly node: ESTree.Class;
  readonly attributes: Set<string>;
  readonly slots: Set<string>;
  readonly parts: Set<string>;
  readonly events: Set<string>;
}

const emptyApi = (node: ESTree.Class): ElementApi => ({
  node,
  attributes: new Set(),
  slots: new Set(),
  parts: new Set(),
  events: new Set(),
});

const stringValue = (node: Node | null | undefined): string | null =>
  node?.type === "Literal" && /^["'`]/.test(node.raw ?? "")
    ? String(node.value)
    : null;

const keyName = (node: Node): string | null =>
  node.type === "Identifier" ? node.name : stringValue(node);

const unwrap = (node: Node): Node =>
  node.type === "TSAsExpression" || node.type === "TSSatisfiesExpression"
    ? unwrap(node.expression)
    : node;

const enclosingClass = (node: Node): ESTree.Class | null => {
  let current: Node | null = node.parent;

  while (current) {
    if (
      current.type === "ClassDeclaration" ||
      current.type === "ClassExpression"
    ) {
      return current;
    }

    current = current.parent;
  }

  return null;
};

/** The object property called `name` in an object literal, if it's a string. */
const objectString = (node: Node | undefined, name: string): string | null => {
  if (node?.type !== "ObjectExpression") return null;

  for (const property of node.properties) {
    if (property.type === "Property" && keyName(property.key) === name) {
      return stringValue(property.value);
    }
  }

  return null;
};

/** The attribute names a `static properties` object gives its properties. */
const attributeNames = (node: Node): string[] => {
  const object = unwrap(node);

  if (object.type !== "ObjectExpression") return [];

  return object.properties.flatMap((property) => {
    if (property.type !== "Property") return [];

    const name = keyName(property.key);
    const options = unwrap(property.value);

    if (name === null) return [];

    if (options.type === "ObjectExpression") {
      for (const option of options.properties) {
        if (option.type !== "Property" || keyName(option.key) !== "attribute") {
          continue;
        }

        if (option.value.type === "Literal" && option.value.value === false) {
          return [];
        }

        return [stringValue(option.value) ?? name.toLowerCase()];
      }
    }

    return [name.toLowerCase()];
  });
};

/** Whether an event is dispatched on `document` rather than the element. */
const dispatchedOnDocument = (node: Node) => {
  const call = node.parent;

  return (
    call?.type === "CallExpression" &&
    call.callee.type === "MemberExpression" &&
    call.callee.object.type === "Identifier" &&
    call.callee.object.name === "document"
  );
};

const escape = (text: string) => text.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");

const elementDocsRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Require each defined element's class docstring to document its API.",
    },
    messages: {
      missingDocstring:
        "`{{tag}}` has no class docstring. Document its API with `@element`, `@summary`, `@attr`, `@slot`, `@csspart`, `@cssprop` and `@fires`.",
      missingTag:
        "`{{tag}}`'s class docstring is missing `{{expected}}`, which editor hovers and the Custom Elements Manifest read.",
      staleTag:
        "`{{tag}}`'s class docstring documents `{{documented}}`, which it doesn't render.",
    },
  },
  create(context) {
    const classes = new Map<string, ElementApi>();
    const defined = new Map<string, string>();

    const apiFor = (node: Node) => {
      const owner = enclosingClass(node);

      if (!owner?.id) return null;

      const api = classes.get(owner.id.name) ?? emptyApi(owner);

      classes.set(owner.id.name, api);

      return api;
    };

    const docstring = (node: ESTree.Class) => {
      const target =
        node.parent.type === "ExportNamedDeclaration" ? node.parent : node;

      const comment = context.sourceCode.getCommentsBefore(target).at(-1);

      return comment?.type === "Block" && comment.value.startsWith("*")
        ? comment.value
        : null;
    };

    return {
      ClassDeclaration(node) {
        if (node.id && !classes.has(node.id.name)) {
          classes.set(node.id.name, emptyApi(node));
        }
      },
      PropertyDefinition(node) {
        if (!node.static || keyName(node.key) !== "properties" || !node.value) {
          return;
        }

        for (const name of attributeNames(node.value)) {
          apiFor(node)?.attributes.add(name);
        }
      },
      Property(node) {
        const part = keyName(node.key) === "part" && stringValue(node.value);

        if (part) {
          apiFor(node)?.parts.add(part);
        }
      },
      NewExpression(node) {
        const name = stringValue(node.arguments[0]);

        if (
          node.callee.type === "Identifier" &&
          (node.callee.name === "Event" ||
            node.callee.name === "CustomEvent") &&
          name !== null &&
          !dispatchedOnDocument(node)
        ) {
          apiFor(node)?.events.add(name);
        }
      },
      CallExpression(node) {
        const { callee } = node;

        if (
          callee.type === "MemberExpression" &&
          callee.object.type === "Identifier" &&
          keyName(callee.property) === "define"
        ) {
          const tag = stringValue(node.arguments[0]);

          if (tag) {
            defined.set(callee.object.name, tag);
          }

          return;
        }

        if (
          callee.type === "Identifier" &&
          callee.name === "h" &&
          stringValue(node.arguments[0]) === "slot"
        ) {
          apiFor(node)?.slots.add(
            objectString(node.arguments[1], "name") ?? "-",
          );
        }
      },
      "Program:exit"() {
        for (const [name, tag] of defined) {
          const api = classes.get(name);

          if (!api) continue;

          const report = (expected: string) => {
            context.report({
              node: api.node.id ?? api.node,
              messageId: "missingTag",
              data: { tag, expected },
            });
          };

          const text = docstring(api.node);

          if (text === null) {
            context.report({
              node: api.node.id ?? api.node,
              messageId: "missingDocstring",
              data: { tag },
            });
            continue;
          }

          const has = (pattern: string) =>
            new RegExp(`@${pattern}(?=\\s|$)`, "m").test(text);

          if (!has(`element\\s+${escape(tag)}`)) report(`@element ${tag}`);

          if (!has("summary\\s+\\S[^\\n]*")) report("@summary");

          for (const attribute of api.attributes) {
            if (!has(`attr\\s+\\{[^}]+\\}\\s+${escape(attribute)}`)) {
              report(`@attr {type} ${attribute}`);
            }
          }

          for (const slot of api.slots) {
            if (!has(`slot\\s+${escape(slot)}`)) report(`@slot ${slot}`);
          }

          for (const part of api.parts) {
            if (!has(`csspart\\s+${escape(part)}`)) report(`@csspart ${part}`);
          }

          for (const [, part = ""] of text.matchAll(/@csspart\s+(\S+)/g)) {
            if (!api.parts.has(part)) {
              context.report({
                node: api.node.id ?? api.node,
                messageId: "staleTag",
                data: { tag, documented: `@csspart ${part}` },
              });
            }
          }

          for (const event of api.events) {
            if (!has(`fires\\s+\\{[^\\n]+\\}\\s+${escape(event)}`)) {
              report(`@fires {type} ${event}`);
            }
          }
        }
      },
    };
  },
});

export default eslintCompatPlugin({
  meta: { name: "groundwork" },
  rules: { "element-docs": elementDocsRule },
});
