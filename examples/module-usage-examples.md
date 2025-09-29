# Module Usage Examples

This document demonstrates how to use the Animated Noise Text library with different module systems.

## ES6 Modules (ESM)

```javascript
// Import the main class (default export)
import AnimatedNoiseText from './dist/animated-noise-text.esm.js';

// Or import named exports
import { AnimatedNoiseText, CanvasManager, NoiseGenerator } from './dist/animated-noise-text.esm.js';

// Usage
const canvas = document.getElementById('myCanvas');
const animation = new AnimatedNoiseText(canvas, {
  text: 'HELLO WORLD',
  cellSize: 3,
  stepMs: 50
});

animation.start();
```

## CommonJS (Node.js)

```javascript
// Import the main class (default export)
const AnimatedNoiseText = require('./dist/animated-noise-text.cjs.js').default;

// Or import named exports
const { AnimatedNoiseText, CanvasManager, NoiseGenerator } = require('./dist/animated-noise-text.cjs.js');

// Usage (in Node.js with canvas library like node-canvas)
const { createCanvas } = require('canvas');
const canvas = createCanvas(800, 600);

const animation = new AnimatedNoiseText(canvas, {
  text: 'NODE.JS',
  cellSize: 2
});

animation.start();
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
  <script src="./dist/animated-noise-text.umd.js"></script>
  
  <script>
    // Access via global namespace
    const canvas = document.getElementById('myCanvas');
    const animation = new AnimatedNoiseText.default(canvas, {
      text: 'UMD GLOBAL',
      cellSize: 4
    });
    
    // Or use named exports
    const { CanvasManager, NoiseGenerator } = AnimatedNoiseText;
    
    animation.start();
  </script>
</body>
</html>
```

### AMD (RequireJS)

```javascript
require(['./dist/animated-noise-text.umd.js'], function(AnimatedNoiseText) {
  const canvas = document.getElementById('myCanvas');
  const animation = new AnimatedNoiseText.default(canvas, {
    text: 'AMD MODULE',
    cellSize: 2
  });
  
  animation.start();
});
```

## TypeScript

```typescript
// Import with full type support
import AnimatedNoiseText, { 
  AnimatedNoiseTextConfig, 
  CanvasManager, 
  NoiseGenerator 
} from './dist/animated-noise-text.esm.js';

// Configuration with type checking
const config: AnimatedNoiseTextConfig = {
  text: 'TYPESCRIPT',
  cellSize: 3,
  stepMs: 40,
  fontSize: 48,
  fontWeight: 'bold'
};

const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
const animation = new AnimatedNoiseText(canvas, config);

// All methods have proper type definitions
animation.start();
animation.setText('NEW TEXT');
animation.updateConfig({ cellSize: 5 });
```

## Package.json Configuration

The library supports proper module resolution through package.json exports:

```json
{
  "main": "dist/animated-noise-text.cjs.js",
  "module": "dist/animated-noise-text.esm.js",
  "browser": "dist/animated-noise-text.umd.js",
  "types": "dist/animated-noise-text.d.ts",
  "exports": {
    ".": {
      "import": "./dist/animated-noise-text.esm.js",
      "require": "./dist/animated-noise-text.cjs.js",
      "browser": "./dist/animated-noise-text.umd.js",
      "types": "./dist/animated-noise-text.d.ts"
    }
  }
}
```

This ensures that:
- Node.js uses the CommonJS build by default
- Bundlers like Webpack/Rollup prefer the ES module build
- Browsers can use the UMD build
- TypeScript gets proper type definitions

## Build Sizes

- **ESM**: ~43.2 KB (unminified)
- **CommonJS**: ~43.3 KB (unminified)  
- **UMD**: ~43.5 KB (unminified)
- **UMD Minified**: ~39.6 KB (production-ready)
- **TypeScript Declarations**: ~5.9 KB

All builds include source maps for debugging.