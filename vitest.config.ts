import { defineConfig } from "vitest/config";

// Unit tests for the pure modules under src/lib. Component tests would need
// jsdom + Testing Library; add them here when the first one lands.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
