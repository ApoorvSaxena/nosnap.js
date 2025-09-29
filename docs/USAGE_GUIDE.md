# Usage Guide - Common Configuration Scenarios

This guide provides practical examples for common use cases and configuration scenarios with nosnap.js.

## Table of Contents

- [Basic Usage Patterns](#basic-usage-patterns)
- [Text Styling Scenarios](#text-styling-scenarios)
- [Animation Speed and Performance](#animation-speed-and-performance)
- [Responsive Design](#responsive-design)
- [Interactive Examples](#interactive-examples)
- [Advanced Configurations](#advanced-configurations)
- [Troubleshooting Common Issues](#troubleshooting-common-issues)

## Basic Usage Patterns

### Simple Text Animation

Perfect for basic text effects with minimal configuration:

```javascript
import NoSnap from 'nosnap.js';

const canvas = document.getElementById('canvas');
const animation = new NoSnap(canvas, {
  text: 'HELLO WORLD'
});

animation.start();
```

### Auto-sizing Text

Let the library automatically calculate the optimal font size:

```javascript
const animation = new NoSnap(canvas, {
  text: 'AUTO SIZE',
  fontSize: null, // Auto-calculated based on canvas size
  fontWeight: 900
});
```

### Custom Font Styling

Use custom fonts and styling:

```javascript
const animation = new NoSnap(canvas, {
  text: 'CUSTOM FONT',
  fontFamily: 'Arial Black, sans-serif',
  fontWeight: 'bold',
  fontSize: 48
});
```

## Text Styling Scenarios

### Large Display Text

Configuration for large, bold display text:

```javascript
const displayAnimation = new NoSnap(canvas, {
  text: 'DISPLAY',
  fontSize: 72,
  fontWeight: 900,
  fontFamily: 'Impact, Arial Black, sans-serif',
  maskBlockSize: 1, // Fine detail
  cellSize: 2
});
```

### Subtle Background Effect

Subtle animation for background text effects:

```javascript
const subtleAnimation = new NoSnap(canvas, {
  text: 'BACKGROUND',
  cellSize: 4,
  stepMs: 60,
  stepPixels: 2,
  maskBlockSize: 3,
  circleRadius: 200
});
```

### Retro/Pixelated Style

Achieve a retro, pixelated aesthetic:

```javascript
const retroAnimation = new NoSnap(canvas, {
  text: 'RETRO',
  cellSize: 6,
  maskBlockSize: 6,
  stepMs: 80,
  stepPixels: 6,
  fontFamily: 'monospace',
  fontWeight: 'bold'
});
```

### Modern Clean Style

Clean, modern animation with smooth movement:

```javascript
const modernAnimation = new NoSnap(canvas, {
  text: 'MODERN',
  cellSize: 1,
  maskBlockSize: 1,
  stepMs: 16,
  stepPixels: 2,
  fontFamily: 'Helvetica, Arial, sans-serif',
  fontWeight: 300
});
```

## Animation Speed and Performance

### High Performance (Mobile-Friendly)

Optimized for mobile devices and lower-end hardware:

```javascript
const mobileAnimation = new NoSnap(canvas, {
  text: 'MOBILE',
  cellSize: 4,        // Larger cells = better performance
  stepMs: 50,         // Slower updates = less CPU usage
  maskBlockSize: 4,   // Larger blocks = faster rendering
  stepPixels: 4       // Larger steps = smoother on slow devices
});
```

### Smooth High-Quality

For desktop applications where quality is prioritized:

```javascript
const qualityAnimation = new NoSnap(canvas, {
  text: 'QUALITY',
  cellSize: 1,        // Fine detail
  stepMs: 16,         // 60fps animation
  maskBlockSize: 1,   // Sharp text edges
  stepPixels: 1       // Smooth movement
});
```

### Balanced Performance

Good balance between quality and performance:

```javascript
const balancedAnimation = new NoSnap(canvas, {
  text: 'BALANCED',
  cellSize: 2,
  stepMs: 32,         // ~30fps
  maskBlockSize: 2,
  stepPixels: 3
});
```

### Slow Dramatic Effect

Slow, dramatic animation for emphasis:

```javascript
const dramaticAnimation = new NoSnap(canvas, {
  text: 'DRAMATIC',
  cellSize: 2,
  stepMs: 100,        // Very slow updates
  stepPixels: 1,      // Slow movement
  circleRadius: 400   // Large effect radius
});
```

## Responsive Design

### Auto-Responsive Setup

Automatically adapt to container size changes:

```javascript
const canvas = document.getElementById('canvas');

// Set up responsive canvas
function resizeCanvas() {
  const container = canvas.parentElement;
  const rect = container.getBoundingClientRect();
  
  canvas.width = rect.width;
  canvas.height = rect.height;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
}

// Initial resize
resizeCanvas();

// Create animation (it will automatically handle resize events)
const animation = new NoSnap(canvas, {
  text: 'RESPONSIVE',
  fontSize: null // Auto-calculate based on canvas size
});

// Handle window resize
window.addEventListener('resize', resizeCanvas);

animation.start();
```

### Breakpoint-Based Configuration

Different configurations for different screen sizes:

```javascript
function getConfigForScreenSize() {
  const width = window.innerWidth;
  
  if (width < 768) {
    // Mobile configuration
    return {
      text: 'MOBILE',
      cellSize: 4,
      stepMs: 50,
      maskBlockSize: 4,
      fontSize: 24
    };
  } else if (width < 1200) {
    // Tablet configuration
    return {
      text: 'TABLET',
      cellSize: 3,
      stepMs: 40,
      maskBlockSize: 3,
      fontSize: 36
    };
  } else {
    // Desktop configuration
    return {
      text: 'DESKTOP',
      cellSize: 2,
      stepMs: 32,
      maskBlockSize: 2,
      fontSize: 48
    };
  }
}

const animation = new NoSnap(canvas, getConfigForScreenSize());
```

## Interactive Examples

### Text Input Integration

Allow users to change the text dynamically:

```javascript
const animation = new NoSnap(canvas, {
  text: 'TYPE HERE'
});

const textInput = document.getElementById('textInput');
textInput.addEventListener('input', (e) => {
  const newText = e.target.value || 'TYPE HERE';
  animation.setText(newText.toUpperCase());
});

animation.start();
```

### Animation Controls

Provide user controls for animation:

```javascript
const animation = new NoSnap(canvas, {
  text: 'CONTROLS'
});

// Start/Stop buttons
document.getElementById('startBtn').addEventListener('click', () => {
  animation.start();
});

document.getElementById('stopBtn').addEventListener('click', () => {
  animation.stop();
});

// Speed control
document.getElementById('speedSlider').addEventListener('input', (e) => {
  const speed = parseInt(e.target.value);
  animation.updateConfig({ stepMs: speed });
});

// Text presets
document.getElementById('preset1').addEventListener('click', () => {
  animation.setText('PRESET ONE');
});

document.getElementById('preset2').addEventListener('click', () => {
  animation.setText('PRESET TWO');
});
```

### Theme Switching

Switch between different visual themes:

```javascript
const themes = {
  retro: {
    cellSize: 6,
    maskBlockSize: 6,
    stepMs: 80,
    fontFamily: 'monospace'
  },
  modern: {
    cellSize: 1,
    maskBlockSize: 1,
    stepMs: 16,
    fontFamily: 'Helvetica, sans-serif'
  },
  dramatic: {
    cellSize: 3,
    maskBlockSize: 2,
    stepMs: 100,
    circleRadius: 500
  }
};

const animation = new NoSnap(canvas, {
  text: 'THEME DEMO',
  ...themes.modern
});

function switchTheme(themeName) {
  animation.updateConfig(themes[themeName]);
}

// Theme buttons
document.getElementById('retroBtn').addEventListener('click', () => switchTheme('retro'));
document.getElementById('modernBtn').addEventListener('click', () => switchTheme('modern'));
document.getElementById('dramaticBtn').addEventListener('click', () => switchTheme('dramatic'));
```

## Advanced Configurations

### Multi-Line Text

Handle multi-line text with line breaks:

```javascript
const multilineAnimation = new NoSnap(canvas, {
  text: 'MULTI\nLINE\nTEXT',
  fontSize: 36,
  fontWeight: 'bold'
});
```

### Unicode and Special Characters

Support for Unicode characters and emojis:

```javascript
const unicodeAnimation = new NoSnap(canvas, {
  text: '🌟 UNICODE 🌟',
  fontSize: 40,
  fontFamily: 'Arial, sans-serif'
});
```

### Dynamic Text Cycling

Automatically cycle through different text values:

```javascript
const texts = ['FIRST', 'SECOND', 'THIRD', 'FOURTH'];
let currentIndex = 0;

const cyclingAnimation = new NoSnap(canvas, {
  text: texts[0],
  cellSize: 2,
  stepMs: 32
});

// Cycle text every 3 seconds
setInterval(() => {
  currentIndex = (currentIndex + 1) % texts.length;
  cyclingAnimation.setText(texts[currentIndex]);
}, 3000);

cyclingAnimation.start();
```

### Performance Monitoring

Monitor and adjust performance dynamically:

```javascript
let frameCount = 0;
let lastTime = Date.now();

const monitoredAnimation = new NoSnap(canvas, {
  text: 'MONITORED',
  cellSize: 2,
  stepMs: 32
});

// Monitor performance every second
setInterval(() => {
  const currentTime = Date.now();
  const fps = frameCount / ((currentTime - lastTime) / 1000);
  
  console.log(`FPS: ${fps.toFixed(1)}`);
  
  // Adjust quality based on performance
  if (fps < 20) {
    // Reduce quality for better performance
    monitoredAnimation.updateConfig({
      cellSize: 4,
      stepMs: 50,
      maskBlockSize: 4
    });
  } else if (fps > 50) {
    // Increase quality if performance allows
    monitoredAnimation.updateConfig({
      cellSize: 2,
      stepMs: 32,
      maskBlockSize: 2
    });
  }
  
  frameCount = 0;
  lastTime = currentTime;
}, 1000);
```

## Troubleshooting Common Issues

### Canvas Not Visible

```javascript
// Ensure canvas has proper dimensions
const canvas = document.getElementById('canvas');
canvas.width = 800;
canvas.height = 400;
canvas.style.width = '800px';
canvas.style.height = '400px';
canvas.style.border = '1px solid #ccc'; // Temporary border to see canvas
```

### Animation Too Slow/Fast

```javascript
// Adjust animation speed
animation.updateConfig({
  stepMs: 16  // Faster (60fps)
  // stepMs: 100 // Slower
});
```

### Poor Performance on Mobile

```javascript
// Mobile-optimized configuration
const mobileConfig = {
  cellSize: 4,
  stepMs: 50,
  maskBlockSize: 4,
  stepPixels: 4
};

animation.updateConfig(mobileConfig);
```

### Text Not Fitting Canvas

```javascript
// Let the library auto-calculate font size
animation.updateConfig({
  fontSize: null // Auto-calculated
});

// Or manually adjust
animation.updateConfig({
  fontSize: 24 // Smaller font
});
```

### Memory Issues with Long-Running Animations

```javascript
// The library handles this automatically, but you can help by:

// 1. Destroying animations when not needed
animation.destroy();

// 2. Avoiding too many simultaneous animations
// 3. Using appropriate canvas sizes
// 4. Monitoring memory usage in development tools
```