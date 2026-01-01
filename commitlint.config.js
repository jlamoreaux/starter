export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // New feature
        "fix", // Bug fix
        "docs", // Documentation
        "style", // Formatting (no code change)
        "refactor", // Code restructure (no feature/fix)
        "perf", // Performance improvement
        "test", // Adding tests
        "chore", // Maintenance
        "ci", // CI/CD changes
        "revert", // Revert commit
      ],
    ],
    "subject-case": [2, "always", "lower-case"],
  },
};
