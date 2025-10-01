# NoSnap.js Examples

This directory contains examples and demonstrations of the NoSnap.js library.

## Getting Started

To run the examples locally:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Then open your browser to `http://localhost:3000/examples/`

## Available Examples

### [Local Development Example](local-dev-example.html)
Interactive demonstration with controls to:
- Start/stop animation
- Change text dynamically  
- Randomize configuration
- Test different settings

### [Module Usage Examples](module-usage-examples.md)
Documentation showing how to integrate NoSnap.js with:
- ES6 Modules
- CommonJS (Node.js)
- UMD (Browser globals)
- TypeScript
- Various bundlers (Webpack, Rollup, Vite)

### Framework Integration
Examples for popular frameworks:
- React components
- Vue.js components  
- Angular integration
- Vanilla JavaScript

## Development Server

The development server provides:
- **Hot reloading**: Changes to examples are immediately visible
- **CORS enabled**: Allows cross-origin requests for testing
- **No caching**: Ensures you always see the latest changes
- **Local builds**: Uses your local library build for testing

### Server Commands

```bash
# Build and serve
npm run dev

# Just serve (after building)
npm run serve

# Check if server is running
npm run check-server
```

## Creating New Examples

1. Create an HTML file in this directory
2. Reference the local build: `../dist/nosnap.umd.js`
3. Add your example to the index.html file
4. Test with the development server

### Example Template

```html
<!DOCTYPE html>
<html>
<head>
  <title>My NoSnap.js Example</title>
</head>
<body>
  <canvas id="canvas" width="800" height="400"></canvas>
  
  <!-- Use local build -->
  <script src="../dist/nosnap.umd.js"></script>
  <script>
    const canvas = document.getElementById('canvas');
    const animation = new NoSnap(canvas, {
      text: 'MY EXAMPLE',
      cellSize: 2
    });
    animation.start();
  </script>
</body>
</html>
```

## Troubleshooting

### Server Won't Start
- Make sure port 3000 is available
- Check that dependencies are installed: `npm install`
- Try building first: `npm run build:dev`

### Examples Not Loading
- Ensure the library is built: `npm run build`
- Check browser console for errors
- Verify file paths are correct

### CORS Issues
- The development server enables CORS by default
- For production, configure your server appropriately
- Use relative paths for local development

## Performance Testing

Use the local development example to test:
- Different canvas sizes
- Various configuration options
- Performance on different devices
- Memory usage over time

The interactive controls make it easy to experiment with different settings and see their impact on performance.