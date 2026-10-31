import recommended from "@timmo001/oxlint-rules/configs/recommended-effect";

export default {
  extends: [recommended],
  options: {
    typeAware: true,
    maxWarnings: 0,
  },
  ignorePatterns: ["generated/**"],
};
