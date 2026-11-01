import recommended from "@timmo001/oxlint-rules/configs/recommended-effect";

export default {
  extends: [recommended],
  ignorePatterns: [
    ".hutch/**",
    ".cottontail-tmp/**",
    "build/**",
    "artifacts/**",
  ],
  options: {
    typeAware: true,
    maxWarnings: 0,
  },
};
