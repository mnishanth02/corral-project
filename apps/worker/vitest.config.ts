import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

const swcPlugin = swc.vite({
  jsc: {
    parser: { syntax: "typescript", decorators: true },
    transform: { legacyDecorator: true, decoratorMetadata: true },
  },
  module: { type: "es6" },
}) as never;

export default defineConfig({
  plugins: [swcPlugin],
  test: {
    globals: true,
    environment: "node",
    root: "./",
  },
});
