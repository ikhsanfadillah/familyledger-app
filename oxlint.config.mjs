import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["import"],
  rules: {
    "no-unassigned-vars": "off",
  },
});
