import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**"],
      exclude: ["**/*.test.ts", "src/lib/database.types.ts"],
      // The eligibility engine is the core of the product: keep it fully tested.
      thresholds: {
        "src/lib/eligibility/**": { statements: 95, branches: 90, functions: 95, lines: 95 },
      },
    },
  },
});
