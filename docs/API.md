# Animated Noise Text Library - API Documentation

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Configuration Options](#configuration-options)
- [Methods](#methods)
- [Events](#events)
- [Error Handling](#error-handling)
- [Browser Compatibility](#browser-compatibility)
- [Performance Considerations](#performance-considerations)

## Installation

### NPM

```bash
npm install animated-noise-text
```

### CDN

```html
<!-- ES Module -->
<script type="module">
  import AnimatedNoiseText from 'https://unpkg.com/animated-noise-text/dist/animated-noise-text.esm.js';
</script>

<!-- UMD (Global) -->
<script src="https://unpkg.com/animated-noise-text/dist/animated-noise-text.umd.min.js"></script>
```

## Quick Start

```javascript
import AnimatedNoiseText from 'animated-noise-text';

// Get your canvas element
const canvas = document.getElementById('myCanvas');

// Create the animation
const animation = new AnimatedNoiseText(canvas, {
  text: 'HELLO WORLD',
  cellSize: 2,
  stepMs: 32
});

// Start the animation
animation.start();
```

## API Reference

### Constructor

```javascript
new AnimatedNoiseText(canvas, options)
```

Creates a new animated noise text instance.

**Parameters:**

- `canvas` (HTMLCanvasElement) - **Required.** The target canvas element where the animation will be rendered.
- `options` (Object) - **Optional.** Configuration options for the animation. See [Configuration Options](#configuration-options) for details.

**Returns:** AnimatedNoiseText instance

**Throws:**
- `Error` - If canvas is not a valid HTMLCanvasElement
- `Error` - If canvas context cannot be obtained
- `Error` - If critical components fail to initialize

**Example:**

```javascript
const canvas = document.getElementById('myCanvas');
const animation = new AnimatedNoiseText(canvas, {
  text: 'ANIMATED TEXT',
  cellSize: 3,
  stepMs: 40
});
```

## Configuration Options

All configuration options are optional and have sensible defaults.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `text` | string | `'HELLO'` | The text to display in the animation |
| `cellSize` | number | `2` | Size of individual noise cells (1-10) |
| `circleRadius` | number | `300` | Radius of the animated circle effect |
| `stepPixels` | number | `4` | Number of pixels to move per animation step |
| `stepMs` | number | `32` | Animation step interval in milliseconds |
| `maskBlockSize` | number | `2` | Size of text mask blocks for pixelation effect |
| `fontSize` | number | `null` | Font size in pixels (auto-calculated if null) |
| `fontWeight` | number\|string | `900` | Font weight (100-900 or 'normal', 'bold', etc.) |
| `fontFamily` | string | `'sans-serif'` | Font family for text rendering |

### Configuration Examples

```javascript
// Minimal configuration
const animation = new AnimatedNoiseText(canvas, {
  text: 'MINIMAL'
});

// Custom styling
const animation = new AnimatedNoiseText(canvas, {
  text: 'CUSTOM STYLE',
  fontSize: 48,
  fontWeight: 'bold',
  fontFamily: 'Arial, sans-serif'
});

// Performance optimized
const animation = new AnimatedNoiseText(canvas, {
  text: 'FAST',
  cellSize: 4,
  stepMs: 50,
  maskBlockSize: 4
});

// High quality
const animation = new AnimatedNoiseText(canvas, {
  text: 'HIGH QUALITY',
  cellSize: 1,
  stepMs: 16,
  maskBlockSize: 1
});
```

## Methods

### start()

Starts the animation loop.

**Returns:** void

**Throws:**
- `Error` - If instance has been destroyed
- `Error` - If required components are missing
- `Error` - If canvas context is unavailable

**Example:**

```javascript
animation.start();
```

### stop()

Stops the animation loop while preserving the instance state.

**Returns:** void

**Example:**

```javascript
animation.stop();
```

### destroy()

Stops the animation and cleans up all resources including event listeners and offscreen canvases. The instance cannot be reused after calling destroy().

**Returns:** void

**Example:**

```javascript
animation.destroy();
```

### setText(text)

Updates the displayed text dynamically without stopping the animation.

**Parameters:**
- `text` (string) - The new text to display

**Returns:** void

**Throws:**
- `Error` - If instance has been destroyed
- `Error` - If text mask generation fails

**Example:**

```javascript
animation.setText('NEW TEXT');
animation.setText(''); // Empty string is handled gracefully
animation.setText('🌟 UNICODE 🌟'); // Unicode characters supported
```

### updateConfig(options)

Updates configuration options dynamically. Only the provided options will be changed.

**Parameters:**
- `options` (Object) - Configuration options to update

**Returns:** void

**Throws:**
- `Error` - If instance has been destroyed

**Example:**

```javascript
animation.updateConfig({
  cellSize: 3,
  stepMs: 40
});

// Update multiple options
animation.updateConfig({
  text: 'UPDATED',
  fontSize: 64,
  fontWeight: 'normal'
});
```

## Events

The library automatically handles canvas resize events and adapts the animation accordingly. No manual event handling is required.

### Automatic Resize Handling

The animation automatically:
- Detects canvas size changes
- Regenerates text masks and noise patterns
- Maintains smooth animation during resize
- Handles high-DPI displays correctly

## Error Handling

The library includes comprehensive error handling with graceful fallbacks:

### Constructor Errors

```javascript
try {
  const animation = new AnimatedNoiseText(canvas, options);
} catch (error) {
  console.error('Failed to initialize:', error.message);
  // Handle initialization failure
}
```

### Runtime Errors

```javascript
try {
  animation.start();
} catch (error) {
  console.error('Failed to start animation:', error.message);
  // Handle start failure
}

try {
  animation.setText('NEW TEXT');
} catch (error) {
  console.error('Failed to update text:', error.message);
  // Handle text update failure
}
```

### Error Recovery

The library includes automatic error recovery mechanisms:
- Automatic retry for transient failures
- Fallback rendering when components fail
- Resource cleanup on errors to prevent memory leaks

## Browser Compatibility

### Supported Browsers

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### Required Features

- HTML5 Canvas 2D API
- ES6 Modules (for module builds)
- requestAnimationFrame
- ResizeObserver (with polyfill fallback)

### Polyfills

For older browser support, include these polyfills:

```html
<!-- ResizeObserver polyfill -->
<script src="https://unpkg.com/resize-observer-polyfill/dist/ResizeObserver.js"></script>

<!-- requestAnimationFrame polyfill -->
<script src="https://unpkg.com/raf/index.js"></script>
```

## Performance Considerations

### Optimization Tips

1. **Canvas Size**: Smaller canvases perform better
2. **Cell Size**: Larger cell sizes (3-4) improve performance
3. **Step Interval**: Higher stepMs values (40-60ms) reduce CPU usage
4. **Block Size**: Larger mask block sizes improve performance

### Performance Configuration

```javascript
// High performance (lower quality)
const fastAnimation = new AnimatedNoiseText(canvas, {
  cellSize: 4,
  stepMs: 50,
  maskBlockSize: 4
});

// Balanced performance
const balancedAnimation = new AnimatedNoiseText(canvas, {
  cellSize: 2,
  stepMs: 32,
  maskBlockSize: 2
});

// High quality (lower performance)
const qualityAnimation = new AnimatedNoiseText(canvas, {
  cellSize: 1,
  stepMs: 16,
  maskBlockSize: 1
});
```

### Memory Management

The library automatically:
- Cleans up resources when destroyed
- Performs periodic memory cleanup during long animations
- Removes event listeners on destroy
- Disposes of offscreen canvases properly

### Best Practices

1. **Always call destroy()** when removing the animation
2. **Use appropriate canvas sizes** for your use case
3. **Monitor performance** on target devices
4. **Consider using multiple smaller animations** instead of one large one
5. **Test on mobile devices** for performance validation

## TypeScript Support

The library includes TypeScript declarations:

```typescript
import AnimatedNoiseText, { AnimatedNoiseTextConfig } from 'animated-noise-text';

const config: AnimatedNoiseTextConfig = {
  text: 'TYPESCRIPT',
  cellSize: 2,
  stepMs: 32
};

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const animation = new AnimatedNoiseText(canvas, config);
```

## Debugging

Enable debug mode for development:

```javascript
// Enable console warnings and error details
const animation = new AnimatedNoiseText(canvas, options);

// Check for initialization errors
if (animation.initializationErrors?.length > 0) {
  console.warn('Initialization warnings:', animation.initializationErrors);
}

// Monitor runtime errors
if (animation.runtimeErrors?.length > 0) {
  console.warn('Runtime errors:', animation.runtimeErrors);
}
```