
import { defineConfig } from "vitest/config";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";

export default defineConfig(({ mode }) => {
  const isTest = mode === "test";

  return {
    plugins: [
      react(),

      // Keep React Compiler enabled for development and production.
      // Skip it during tests to avoid compiler-generated coverage branches.
      ...(!isTest
        ? [
            babel({
              presets: [reactCompilerPreset()],
            }),
          ]
        : []),
    ],

    test: {
      environment: "jsdom",

      globals: true,

      setupFiles: "./src/test/setup.ts",

      css: true,

      clearMocks: true,

      restoreMocks: true,

      coverage: {
        provider: "v8",

        reporter: ["text", "html", "lcov"],

        reportsDirectory: "./coverage",

        include: ["src/**/*.{ts,tsx}"],

        exclude: [
          "src/test/**",
          "src/main.tsx",
          "src/**/*.d.ts",
          "src/**/*.test.{ts,tsx}",
          "src/**/*.spec.{ts,tsx}",
        ],

        thresholds: {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
      },
    },
  };
});
