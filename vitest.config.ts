import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["src/__tests__/vitest.setup.ts"],
    pool: "threads",
    coverage: {
      provider: "v8",
    },
  },
});
