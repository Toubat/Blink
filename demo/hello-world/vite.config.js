// vite.config.js
import { defineConfig } from "vite";

export default defineConfig({
  esbuild: {
    jsxInject: `import * as Blink from '../../../dist';`,
    jsxFactory: "Blink.h",
    jsxFragment: "Blink.Fragment",
  },
});
