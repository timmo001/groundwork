/**
 * The operations the CLI and MCP server share, and the `Items` service they
 * run against. Here they come from Groundwork's demo app, so this template is
 * also the CLI demo. In a real tool, define `Items` here with the system's
 * SDK behind it, and give it a `fixture` layer for the tool's own demo.
 *
 * @module
 */
export {
  Access,
  Item,
  Items,
  ItemsError,
  operations,
  type Operation,
} from "@timmo001/groundwork-demo";
