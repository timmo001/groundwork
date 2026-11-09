import recommended from "@timmo001/oxlint-rules/configs/recommended-effect";

export default {
  extends: [recommended],
  ignorePatterns: ["android/**"],
  options: {
    typeAware: true,
    typeCheck: true,
    maxWarnings: 0,
  },
};
