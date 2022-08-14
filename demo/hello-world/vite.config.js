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
    loader: "tsx",
    include: /src\/.*\.[tj]sx?$/,
    jsxInject: `import { h, NodeFlags, cs } from '../../../dist';`,
    jsxFactory: "h",
    jsxFragment: "NodeFlags.FRAGMENT_NODE",
  },
});
