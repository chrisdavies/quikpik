import childProcess from 'child_process';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import replace from '@rollup/plugin-replace';
import babel from '@rollup/plugin-babel';
import postcss from 'rollup-plugin-postcss';
const postcssImport = require('postcss-import');
const postcssReporter = require('postcss-reporter');
const autoprefixer = require('autoprefixer');

const production = !process.env.ROLLUP_WATCH;

function runNpm(cmdName) {
  const started = {};

  return {
    writeBundle() {
      if (!started[cmdName]) {
        started[cmdName] = true;

        childProcess.spawn('npm', ['run', cmdName], {
          stdio: ['ignore', 'inherit', 'inherit'],
          shell: true,
        });
      }
    },
  };
}

export default {
  input: production ? 'lib/index.jsx' : 'src/main.jsx',
  output: {
    name: 'quikpik',
    sourcemap: true,
    format: production ? 'umd' : 'iife',
    file: production ? 'dist/quikpik.js' : 'public/build/bundle.js',
  },
  plugins: [
    resolve({
      browser: true,
      extensions: ['.js', '.jsx'],
    }),

    commonjs(),

    replace({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    }),

    babel({ babelHelpers: 'runtime', plugins: ['@babel/plugin-transform-runtime'] }),

    postcss({
      config: false,
      minimize: production,
      plugins: [postcssImport(), autoprefixer(), postcssReporter({ clearReportedMessages: true })],
    }),

    // In dev mode, call `npm run start` once
    // the bundle has been generated
    !production && runNpm('start'),

    // Watch the `public` directory and refresh the
    // browser on changes when not in production
    !production && livereload('public'),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser(),
  ],
  watch: {
    clearScreen: false,
  },
};
