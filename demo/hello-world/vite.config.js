// vite.config.js
import { defineConfig } from "vite";
import babel from "vite-plugin-babel";
import { blink } from "./plugin-blink";

export default defineConfig({
  plugins: [
    babel({
      babelConfig: {
        babelrc: false,
        configFile: false,
        presets: ["@babel/preset-typescript"],
        plugins: [blink()],
      },
      filter: /\.tsx?$/,
    }),
  ],
  esbuild: {
    jsxInject: `import * as Blink from '../../../dist';`,
    jsxFactory: "Blink.h",
    jsxFragment: "Blink.Fragment",
  },
});
