import { defineConfig } from "tsup";

export default defineConfig({
  bundle: false,
  clean: true,
  dts: false,
  entry: ["src/**/*.ts", "!src/**/*.test.ts"],
  format: "esm",
  outDir: "lib",
  sourcemap: false,
});
