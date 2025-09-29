import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

const isProduction = process.env.NODE_ENV === 'production';

export default [
  // ES Module build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/animated-noise-text.esm.js',
      format: 'es',
      sourcemap: true,
      exports: 'named'
    },
    plugins: [
      nodeResolve(),
      ...(isProduction ? [terser()] : [])
    ]
  },
  // CommonJS build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/animated-noise-text.cjs.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named'
    },
    plugins: [
      nodeResolve(),
      ...(isProduction ? [terser()] : [])
    ]
  },
  // UMD build (unminified)
  {
    input: 'src/index.js',
    output: {
      file: 'dist/animated-noise-text.umd.js',
      format: 'umd',
      name: 'AnimatedNoiseText',
      sourcemap: true,
      exports: 'named'
    },
    plugins: [
      nodeResolve(),
      ...(isProduction ? [terser()] : [])
    ]
  },
  // UMD build (minified)
  {
    input: 'src/index.js',
    output: {
      file: 'dist/animated-noise-text.umd.min.js',
      format: 'umd',
      name: 'AnimatedNoiseText',
      sourcemap: true,
      exports: 'named'
    },
    plugins: [
      nodeResolve(),
      terser({
        compress: {
          drop_console: true,
          drop_debugger: true
        },
        mangle: {
          reserved: ['AnimatedNoiseText']
        }
      })
    ]
  }
];