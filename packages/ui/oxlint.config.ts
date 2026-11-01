import recommended from "@timmo001/oxlint-rules/configs/recommended";

export default {
  extends: [recommended],
  jsPlugins: [{ name: "groundwork", specifier: "./lint/elements.ts" }],
  rules: {
    "groundwork/element-docs": "error",
  },
  options: {
    typeAware: true,
    maxWarnings: 0,
  },
};
