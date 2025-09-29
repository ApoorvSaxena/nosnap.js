# Animated Noise Text Library

A JavaScript library for creating animated noise text effects on HTML5 canvas.

## Installation

```bash
npm install animated-noise-text
```

## Usage

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

## API

### Constructor

```javascript
new AnimatedNoiseText(canvas, options)
```

- `canvas`: HTMLCanvasElement - The target canvas element
- `options`: Object - Configuration options (optional)

### Methods

- `start()` - Start the animation
- `stop()` - Stop the animation
- `destroy()` - Stop animation and clean up resources
- `setText(text)` - Update the displayed text
- `updateConfig(options)` - Update configuration options

## Configuration Options

- `text`: String - Text to display (default: 'HELLO')
- `cellSize`: Number - Size of noise cells (default: 2)
- `stepMs`: Number - Animation step interval in milliseconds (default: 32)
- `fontSize`: Number - Font size (auto-calculated if not provided)
- `fontWeight`: Number - Font weight (default: 900)
- `fontFamily`: String - Font family (default: 'sans-serif')

## License

MIT