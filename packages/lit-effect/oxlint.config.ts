import recommended from "@timmo001/oxlint-rules/configs/recommended-effect";

export default {
  extends: [recommended],
  options: {
    typeAware: true,
    typeCheck: true,
    maxWarnings: 0,
  },
  overrides: [
    {
      // The router's one cast: a matched route's name and both codecs come
      // from the same entry of `routes`, which TypeScript can't correlate.
      files: ["src/router.ts"],
      rules: {
        "timmo/prefer-types-over-assertions": "off",
      },
    },
  ],
};
