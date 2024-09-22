import { defineConfig } from "tsup";

export default defineConfig({
  bundle: false,
  clean: true,
  dts: true,
  entry: ["src/**/*.ts", "!src/**/*.test.ts"],
  format: "esm",
  outDir: "lib",
  sourcemap: true,
});
