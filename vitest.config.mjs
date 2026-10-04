import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.mjs"],
    include: ["src/**/*.test.{js,jsx,ts,tsx}"],
    // Unit tests must not depend on the developer's machine timezone
    env: { TZ: "UTC" },
    coverage: {
      provider: "v8",
      include: ["src/**/*.{js,jsx,ts,tsx}"],
      exclude: ["src/**/*.test.*", "src/__fixtures__/**"],
      reporter: ["text", "html", "lcov"],
    },
  },
});
