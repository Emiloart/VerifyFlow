import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    testTimeout: 60000,
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", "dist/**", ".next/**"]
  }
});
