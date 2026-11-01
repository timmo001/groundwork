/** How a property reads its attribute and writes it back. */
export interface PropertyOptions {
  /** How the attribute's text becomes the value. Defaults to `string`. */
  readonly type?: "string" | "boolean" | "number" | "json";
  /** Whether setting the property writes the attribute back. */
  readonly reflect?: boolean;
  /** The attribute's name, or `false` for a property with none. */
  readonly attribute?: string | false;
}

export type Properties = Readonly<Record<string, PropertyOptions>>;

/** A value parsed from JSON, as a `json` property holds. */
export type Json =
  | string
  | number
  | boolean
  | null
  | readonly Json[]
  | { readonly [key: string]: Json };

/** What a declared property can hold. */
export type PropertyValue = Json | undefined;

/**
 * A stylesheet from CSS text, shared by every element that adopts it.
 * Interpolations are joined in as text.
 */
export const css = (
  strings: TemplateStringsArray,
  ...values: readonly (string | number)[]
) => {
  const sheet = new CSSStyleSheet();

  sheet.replaceSync(String.raw({ raw: strings }, ...values));

  return sheet;
};

type Child = Node | string | false | null | undefined;

/**
 * Creates an element with attributes and children. An attribute of `false`,
 * `null` or `undefined` is left off, and `true` sets it empty.
 */
export const h = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes: Readonly<
    Record<string, string | number | boolean | null | undefined>
  > = {},
  ...children: readonly Child[]
) => {
  const element = document.createElement(tag);

  for (const [name, value] of Object.entries(attributes)) {
    setAttribute(element, name, value);
  }

  append(element, children);

  return element;
};

/** Appends children, skipping the empty ones. */
export const append = (parent: ParentNode, children: readonly Child[]) => {
  for (const child of children) {
    if (child !== false && child !== null && child !== undefined) {
      parent.append(child);
    }
  }
};

/**
 * Sets or removes an attribute: `false`, `null` and `undefined` remove it,
 * `true` sets it empty and anything else sets its text.
 */
export const setAttribute = (
  element: Element,
  name: string,
  value: string | number | boolean | null | undefined,
) => {
  if (value === false || value === null || value === undefined) {
    element.removeAttribute(name);
  } else {
    element.setAttribute(name, value === true ? "" : String(value));
  }
};

const fromAttribute = (
  value: string | null,
  type: PropertyOptions["type"],
): PropertyValue => {
  switch (type) {
    case "boolean": {
      return value !== null;
    }

    case "number": {
      return value === null ? undefined : Number(value);
    }

    case "json": {
      if (value === null) return undefined;

      try {
        const parsed: Json = JSON.parse(value);

        return parsed;
      } catch {
        return undefined;
      }
    }

    default: {
      return value ?? undefined;
    }
  }
};

const toAttribute = (value: PropertyValue, type: PropertyOptions["type"]) => {
  if (type === "boolean") return value ? "" : null;

  if (value === undefined || value === null) return null;

  return value instanceof Object ? JSON.stringify(value) : String(value);
};

const attributeName = (name: string, options: PropertyOptions) =>
  options.attribute === undefined ? name.toLowerCase() : options.attribute;

/**
 * The base for every `gw-` element, with no framework underneath.
 *
 * Declare `static properties` and `static styles`, give each property its
 * default in the constructor, build the shadow root once in `create()`, then
 * set what changed in `update()`. Changes made in the same task are batched
 * into one update. Define it with `define()`, which adds the properties'
 * accessors.
 */
export class GwElement extends HTMLElement {
  static properties: Properties = {};

  static styles: readonly CSSStyleSheet[] = [];

  /** Whether to attach a shadow root. Light DOM elements set this false. */
  static shadow = true;

  /** How the shadow root is attached. */
  static shadowRootOptions: ShadowRootInit = { mode: "open" };

  static get observedAttributes() {
    return Object.entries(this.properties).flatMap(([name, options]) => {
      const attribute = attributeName(name, options);

      return attribute === false ? [] : [attribute];
    });
  }

  /** Adds the property accessors, then defines the element. */
  static define(tag: string) {
    for (const [name, options] of Object.entries(this.properties)) {
      if (Object.hasOwn(this.prototype, name)) continue;

      Object.defineProperty(this.prototype, name, {
        configurable: true,
        enumerable: true,
        get(this: GwElement) {
          return this.#values.get(name);
        },
        set(this: GwElement, value: PropertyValue) {
          this.#setProperty(name, options, value);
        },
      });
    }

    if (!customElements.get(tag)) customElements.define(tag, this);
  }

  readonly #values = new Map<string, PropertyValue>();

  readonly #defaults = new Map<string, PropertyValue>();

  readonly #changed = new Set<string>();

  // Attributes can't be set in the constructor, so reflection waits until
  // the element first connects.
  readonly #unreflected = new Set<string>();

  #created = false;

  #queued = false;

  #pending: Promise<void> | undefined;

  #reflecting = false;

  #resolveUpdated: () => void = () => {};

  readonly #updated = new Promise<void>((resolve) => {
    this.#resolveUpdated = resolve;
  });

  /** The shadow root, or the element itself for a light DOM element. */
  readonly renderRoot: ShadowRoot | HTMLElement;

  /** The element's own class, for its static properties and styles. */
  readonly #own: typeof GwElement;

  constructor() {
    super();

    const own = new.target;

    this.#own = own;

    if (own.shadow) {
      const root = this.attachShadow(own.shadowRootOptions);

      root.adoptedStyleSheets = [...own.styles];
      this.renderRoot = root;
    } else {
      this.renderRoot = this;
    }
  }

  /** Resolves once the pending update has run, or the first one before it connects. */
  get updateComplete() {
    return this.#pending ?? this.#updated;
  }

  connectedCallback() {
    const own = this.#own;

    // A property set before the element upgraded sits on the instance and
    // hides the accessor, so move it through the accessor.
    for (const name of Object.keys(own.properties)) {
      if (Object.hasOwn(this, name)) {
        const value: PropertyValue = Object.getOwnPropertyDescriptor(
          this,
          name,
        )?.value;

        Reflect.deleteProperty(this, name);
        Reflect.set(this, name, value);
      }
    }

    if (this.#created) return;

    this.#created = true;

    for (const name of this.#unreflected) {
      const options = own.properties[name] ?? {};
      const attribute = attributeName(name, options);

      if (attribute !== false && !this.hasAttribute(attribute)) {
        this.#reflecting = true;
        setAttribute(
          this,
          attribute,
          toAttribute(this.#values.get(name), options.type),
        );
        this.#reflecting = false;
      }
    }

    this.#unreflected.clear();
    this.create(this.renderRoot);
    this.#changed.clear();

    for (const name of Object.keys(own.properties)) this.#changed.add(name);

    this.#flush();
    this.#resolveUpdated();
  }

  disconnectedCallback() {}

  attributeChangedCallback(
    attribute: string,
    previous: string | null,
    value: string | null,
  ) {
    if (this.#reflecting || previous === value) return;

    const own = this.#own;

    const entry = Object.entries(own.properties).find(
      ([name, options]) => attributeName(name, options) === attribute,
    );

    if (!entry) return;

    const [name, options] = entry;
    const parsed = fromAttribute(value, options.type);

    this.#setProperty(
      name,
      { ...options, reflect: false },
      parsed === undefined ? this.defaultOf(name) : parsed,
    );
  }

  /**
   * The value a property returns to when its attribute is removed. Defaults
   * to the value it was given in the constructor.
   */
  protected defaultOf(name: string) {
    return this.#defaults.get(name);
  }

  /** Asks for an update with the given properties marked as changed. */
  requestUpdate(...names: readonly string[]) {
    for (const name of names) this.#changed.add(name);

    if (!this.#created || this.#queued) return;

    this.#queued = true;
    this.#pending = new Promise((resolve) => {
      queueMicrotask(() => {
        this.#queued = false;
        this.#pending = undefined;
        this.#flush();
        resolve();
      });
    });
  }

  /** Builds the shadow root's content once, on first connection. */
  protected create(_root: ShadowRoot | HTMLElement) {}

  /** Sets what the changed properties affect. */
  protected update(_changed: ReadonlySet<string>) {}

  #flush() {
    if (this.#changed.size === 0) return;

    const changed = new Set(this.#changed);

    this.#changed.clear();
    this.update(changed);
  }

  #setProperty(name: string, options: PropertyOptions, value: PropertyValue) {
    if (!this.#defaults.has(name)) this.#defaults.set(name, value);

    const previous = this.#values.get(name);

    if (Object.is(previous, value) && this.#values.has(name)) return;

    this.#values.set(name, value);

    const attribute = attributeName(name, options);

    if (options.reflect && attribute !== false) {
      if (this.#created) {
        this.#reflecting = true;
        setAttribute(this, attribute, toAttribute(value, options.type));
        this.#reflecting = false;
      } else {
        this.#unreflected.add(name);
      }
    }

    this.requestUpdate(name);
  }
}
