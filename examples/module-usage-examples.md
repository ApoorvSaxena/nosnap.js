# Module Usage Examples

This document demonstrates how to use the Animated Noise Text library with different module systems and environments.

## Table of Contents

- [ES6 Modules (ESM)](#es6-modules-esm)
- [CommonJS (Node.js)](#commonjs-nodejs)
- [UMD (Universal Module Definition)](#umd-universal-module-definition)
- [TypeScript](#typescript)
- [CDN Usage](#cdn-usage)
- [Webpack Integration](#webpack-integration)
- [Rollup Integration](#rollup-integration)
- [Vite Integration](#vite-integration)
- [Package.json Configuration](#packagejson-configuration)

## ES6 Modules (ESM)

### Basic Import

```javascript
// Import the main class (default export)
import NoSnap from 'nosnap.js';

// Usage
const canvas = document.getElementById('myCanvas');
const animation = new NoSnap(canvas, {
  text: 'HELLO WORLD',
  cellSize: 3,
  stepMs: 50
});

animation.start();
```

### Named Imports (if available)

```javascript
// Import named exports for advanced usage
import { NoSnap, CanvasManager, NoiseGenerator } from 'nosnap.js';

// Use individual components if needed
const canvasManager = new CanvasManager(canvas);
const noiseGenerator = new NoiseGenerator(2);
```

### Dynamic Import

```javascript
// Lazy loading for better performance
async function loadAnimation() {
  const { default: NoSnap } = await import('nosnap.js');
  
  const canvas = document.getElementById('myCanvas');
  const animation = new NoSnap(canvas, {
    text: 'DYNAMIC IMPORT',
    cellSize: 2
  });
  
  animation.start();
}

// Load when needed
document.getElementById('loadBtn').addEventListener('click', loadAnimation);
```

## CommonJS (Node.js)

### Basic Require

```javascript
// Import the main class (default export)
const NoSnap = require('nosnap.js').default;

// Or destructure
const { default: NoSnap } = require('nosnap.js');
```

### Node.js with Canvas

```javascript
// Usage in Node.js with node-canvas
const { createCanvas } = require('canvas');
const NoSnap = require('nosnap.js').default;

const canvas = createCanvas(800, 600);
const animation = new NoSnap(canvas, {
  text: 'NODE.JS',
  cellSize: 2
});

// Note: Animation won't run in Node.js without DOM APIs
// This is mainly for server-side rendering or testing
```

### Express.js Integration

```javascript
const express = require('express');
const { createCanvas } = require('canvas');
const NoSnap = require('nosnap.js').default;

const app = express();

app.get('/generate-text-image', (req, res) => {
  const canvas = createCanvas(800, 400);
  const animation = new NoSnap(canvas, {
    text: req.query.text || 'SERVER',
    cellSize: 3
  });
  
  // Generate static frame (animation won't work server-side)
  const buffer = canvas.toBuffer('image/png');
  res.type('png').send(buffer);
});
```

## UMD (Universal Module Definition)

### Browser Global

```html
<!DOCTYPE html>
<html>
<head>
  <title>Animated Noise Text - UMD Example</title>
</head>
<body>
  <canvas id="myCanvas" width="800" height="600"></canvas>
  
  <!-- Load the UMD build -->
  <script src="https://unpkg.com/nosnap.js/dist/nosnap.js.umd.min.js"></script>
  
  <script>
    // Access via global namespace
    const canvas = document.getElementById('myCanvas');
    const animation = new NoSnap(canvas, {
      text: 'UMD GLOBAL',
      cellSize: 4
    });
    
    animation.start();
  </script>
</body>
</html>
```

### AMD (RequireJS)

```javascript
// Configure RequireJS
require.config({
  paths: {
    'nosnap.js': 'https://unpkg.com/nosnap.js/dist/nosnap.js.umd'
  }
});

// Use with RequireJS
require(['nosnap.js'], function(NoSnap) {
  const canvas = document.getElementById('myCanvas');
  const animation = new NoSnap(canvas, {
    text: 'AMD MODULE',
    cellSize: 2
  });
  
  animation.start();
});
```

## TypeScript

### Basic TypeScript Usage

```typescript
import NoSnap, { NoSnapConfig } from 'nosnap.js';

// Configuration with full type checking
const config: NoSnapConfig = {
  text: 'TYPESCRIPT',
  cellSize: 3,
  stepMs: 40,
  fontSize: 48,
  fontWeight: 'bold',
  fontFamily: 'Arial, sans-serif'
};

const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
const animation = new NoSnap(canvas, config);

// All methods have proper type definitions
animation.start();
animation.setText('NEW TEXT');
animation.updateConfig({ cellSize: 5 });
```

### Advanced TypeScript with Interfaces

```typescript
import NoSnap, { 
  NoSnapConfig,
  AnimationState,
  ErrorHandler 
} from 'nosnap.js';

interface CustomAnimationConfig extends NoSnapConfig {
  customProperty?: string;
}

class AnimationManager {
  private animations: Map<string, NoSnap> = new Map();
  
  createAnimation(id: string, canvas: HTMLCanvasElement, config: CustomAnimationConfig): void {
    const animation = new NoSnap(canvas, config);
    this.animations.set(id, animation);
  }
  
  startAnimation(id: string): void {
    const animation = this.animations.get(id);
    if (animation) {
      animation.start();
    }
  }
  
  destroyAll(): void {
    this.animations.forEach(animation => animation.destroy());
    this.animations.clear();
  }
}
```

## CDN Usage

### Unpkg

```html
<!-- ES Module from CDN -->
<script type="module">
  import NoSnap from 'https://unpkg.com/nosnap.js/dist/nosnap.js.esm.js';
  
  const canvas = document.getElementById('canvas');
  const animation = new NoSnap(canvas, { text: 'CDN DEMO' });
  animation.start();
</script>

<!-- UMD from CDN -->
<script src="https://unpkg.com/nosnap.js/dist/nosnap.js.umd.min.js"></script>
<script>
  const animation = new NoSnap(canvas, { text: 'UMD CDN' });
  animation.start();
</script>
```

### jsDelivr

```html
<!-- ES Module -->
<script type="module">
  import NoSnap from 'https://cdn.jsdelivr.net/npm/nosnap.js/dist/nosnap.js.esm.js';
</script>

<!-- UMD -->
<script src="https://cdn.jsdelivr.net/npm/nosnap.js/dist/nosnap.js.umd.min.js"></script>
```

## Webpack Integration

### webpack.config.js

```javascript
const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  resolve: {
    alias: {
      'nosnap.js': path.resolve(__dirname, 'node_modules/nosnap.js/dist/nosnap.js.esm.js')
    }
  }
};
```

### Usage in Webpack Project

```javascript
// src/index.js
import NoSnap from 'nosnap.js';

const canvas = document.getElementById('canvas');
const animation = new NoSnap(canvas, {
  text: 'WEBPACK BUILD',
  cellSize: 2
});

animation.start();
```

## Rollup Integration

### rollup.config.js

```javascript
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/main.js',
  output: {
    file: 'dist/bundle.js',
    format: 'iife',
    name: 'MyApp'
  },
  plugins: [
    resolve(),
    commonjs(),
    terser()
  ]
};
```

### Usage in Rollup Project

```javascript
// src/main.js
import NoSnap from 'nosnap.js';

export function initAnimation(canvasId) {
  const canvas = document.getElementById(canvasId);
  const animation = new NoSnap(canvas, {
    text: 'ROLLUP BUILD',
    cellSize: 2
  });
  
  return animation;
}
```

## Vite Integration

### vite.config.js

```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/main.js',
      name: 'MyApp',
      fileName: 'my-app'
    }
  },
  optimizeDeps: {
    include: ['nosnap.js']
  }
});
```

### Usage in Vite Project

```javascript
// src/main.js
import NoSnap from 'nosnap.js';

const canvas = document.querySelector('#canvas');
const animation = new NoSnap(canvas, {
  text: 'VITE BUILD',
  cellSize: 2,
  stepMs: 32
});

// Hot module replacement support
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    animation.destroy();
  });
}

animation.start();
```

## Package.json Configuration

The library supports proper module resolution through package.json exports:

```json
{
  "name": "nosnap.js",
  "version": "1.0.0",
  "description": "A JavaScript library for creating animated noise text effects",
  "main": "dist/nosnap.js.cjs.js",
  "module": "dist/nosnap.js.esm.js",
  "browser": "dist/nosnap.js.umd.js",
  "types": "dist/nosnap.js.d.ts",
  "exports": {
    ".": {
      "import": "./dist/nosnap.js.esm.js",
      "require": "./dist/nosnap.js.cjs.js",
      "browser": "./dist/nosnap.js.umd.js",
      "types": "./dist/nosnap.js.d.ts"
    }
  },
  "files": [
    "dist/",
    "src/",
    "README.md"
  ]
}
```

### Module Resolution Benefits

This configuration ensures that:
- **Node.js** uses the CommonJS build by default (`main` field)
- **Bundlers** like Webpack/Rollup prefer the ES module build (`module` field)
- **Browsers** can use the UMD build (`browser` field)
- **TypeScript** gets proper type definitions (`types` field)
- **Modern tools** use the `exports` field for precise resolution

## Build Sizes and Performance

| Format | Size (Unminified) | Size (Minified) | Gzipped |
|--------|------------------|-----------------|---------|
| ESM | ~43.2 KB | ~39.1 KB | ~12.8 KB |
| CommonJS | ~43.3 KB | ~39.2 KB | ~12.9 KB |
| UMD | ~43.5 KB | ~39.6 KB | ~13.1 KB |
| TypeScript Declarations | ~5.9 KB | N/A | ~1.8 KB |

### Performance Recommendations

1. **Use ES Modules** when possible for better tree-shaking
2. **Use UMD minified** for direct browser usage
3. **Enable gzip compression** on your server for optimal delivery
4. **Consider dynamic imports** for code splitting in large applications

## Troubleshooting

### Common Issues

1. **Module not found**: Ensure the package is installed and the import path is correct
2. **TypeScript errors**: Make sure `@types/node` is installed if using Node.js APIs
3. **Canvas not found**: Ensure the canvas element exists before creating the animation
4. **Build errors**: Check that your bundler supports the module format you're using

### Debug Mode

```javascript
// Enable debug logging
const animation = new NoSnap(canvas, {
  text: 'DEBUG MODE',
  debug: true // If supported
});

// Check for errors
if (animation.initializationErrors?.length > 0) {
  console.warn('Initialization warnings:', animation.initializationErrors);
}
```