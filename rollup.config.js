import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

const isProduction = process.env.NODE_ENV === 'production';

export default [
  // ES Module build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/nosnap.esm.js',
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
      file: 'dist/nosnap.cjs.js',
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
      file: 'dist/nosnap.umd.js',
      format: 'umd',
      name: 'NoSnap',
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
      file: 'dist/nosnap.umd.min.js',
      format: 'umd',
      name: 'NoSnap',
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
          reserved: ['NoSnap']
        }
      })
    ]
  }
];