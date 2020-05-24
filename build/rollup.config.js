import serve from 'rollup-plugin-serve';
import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import sucrase from '@rollup/plugin-sucrase';
import livereload from 'rollup-plugin-livereload';
import postcss from 'rollup-plugin-postcss';
import html from '@rollup/plugin-html';
import replace from '@rollup/plugin-replace';
import { terser } from 'rollup-plugin-terser';

const isProduction = process.env.NODE_ENV === 'production';

const envPlugins = isProduction
  ? [terser()]
  : [
      html(),
      livereload({
        watch: 'dist',
        verbose: true,
      }),
      serve({ contentBase: ['dist', 'public'], port: 8081 }),
    ];

export default {
  input: 'src/index.jsx',
  output: {
    file: 'dist/app.js',
    format: 'umd',
    name: 'quikpik',
  },
  plugins: [
    resolve({
      extensions: ['.js', '.jsx'],
    }),
    commonjs(),
    replace({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    }),
    babel({
      exclude: ['node_modules/**'],
      presets: ['solid'],
      plugins: ['solid-styled-jsx/babel'],
    }),
    sucrase({
      exclude: ['node_modules/**'],
      transforms: ['jsx'],
      jsxPragma: 'h',
      jsxFragmentPragma: 'h',
    }),
    postcss({
      plugins: [],
      extract: true,
      autoModules: false,
      minimize: isProduction,
      config: {
        path: 'build/postcss.config.js',
      },
    }),
    ...envPlugins,
  ],
};
