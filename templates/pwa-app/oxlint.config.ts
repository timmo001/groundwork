import recommended from "@timmo001/oxlint-rules/configs/recommended";

export default {
  extends: [recommended],
  ignorePatterns: ["dist/**"],
  options: {
    typeAware: true,
    typeCheck: true,
    maxWarnings: 0,
  },
};
