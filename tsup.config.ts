import { defineConfig } from "tsup";

const env = (process.env.NODE_ENV ?? "development") as
  | "development"
  | "production";

const isDev = env === "development";
const isProd = env === "production";

export default defineConfig({
  entry: ["./src/index.ts"],
  outDir: "dist",
  clean: true,
  dts: false,
  format: ["cjs"],
  minify: isProd,
  treeshake: isProd,
  watch: isDev,
  sourcemap: isDev,
});
