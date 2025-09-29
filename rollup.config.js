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
      sourcemap: true
    },
    plugins: [
      nodeResolve(),
      ...(isProduction ? [terser()] : [])
    ]
  },
  // UMD build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/animated-noise-text.js',
      format: 'umd',
      name: 'AnimatedNoiseText',
      sourcemap: true
    },
    plugins: [
      nodeResolve(),
      ...(isProduction ? [terser()] : [])
    ]
  },
  // Minified UMD build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/animated-noise-text.min.js',
      format: 'umd',
      name: 'AnimatedNoiseText',
      sourcemap: true
    },
    plugins: [
      nodeResolve(),
      terser()
    ]
  }
];