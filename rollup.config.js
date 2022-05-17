import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import { terser } from 'rollup-plugin-terser'; // 读取 package.json 配置

const env = process.env.NODE_ENV;

const config = {
  input: './src/index.ts',
  output: {
    dir: 'dist',
    // {
    //   format: 'cjs',
    //   file: 'dist/index.js',
    // },
    // {
    //   format: 'es',
    //   file: 'dist/index.es.js',
    // },
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript(),
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
  ],
};

if (env === 'production') {
  config.plugins.push(
    terser({
      compress: {
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true,
        warnings: false,
      },
    })
  );
}

export default config;
