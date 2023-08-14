import path from "path";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: "v8",
    },
    // Some tests are flaky due to comunication to external APIs.
    // In order to escape nightmare in CI/CD pipelines we will retrigger and rerun.
    // Retry the test specific number of times if it fails.
    retry: 5,
    exclude: [...configDefaults.exclude, "./build"],
  },
  resolve: {
    alias: {
      "@src": path.resolve(__dirname, "./src"),
    },
  },
});
