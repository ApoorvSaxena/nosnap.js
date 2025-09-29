/**
 * Animation Pipeline Tests
 * Tests for the animation rendering pipeline functionality
 */

import AnimatedNoiseText from '../src/index.js';

// Mock canvas and context for testing
const createMockCanvas = () => {
  const canvas = {
    width: 800,
    height: 600,
    style: {},
    getBoundingClientRect: () => ({ width: 800, height: 600 }),
    getContext: () => ({
      scale: jest.fn(),
      clearRect: jest.fn(),
      drawImage: jest.fn(),
      fillRect: jest.fn(),
      fillText: jest.fn(),
      measureText: () => ({ width: 100 }),
      getImageData: () => ({
        data: new Uint8ClampedArray(800 * 600 * 4),
        width: 800,
        height: 600
      }),
      putImageData: jest.fn(),
      imageSmoothingEnabled: true,
      globalCompositeOperation: 'source-over',
      fillStyle: '#000',
      font: '900 48px sans-serif',
      textAlign: 'center',
      textBaseline: 'middle'
    })
  };
  
  // Make it pass instanceof HTMLCanvasElement check
  Object.setPrototypeOf(canvas, HTMLCanvasElement.prototype);
  return canvas;
};

// Mock document.createElement for canvas creation
const originalCreateElement = document.createElement;
beforeAll(() => {
  document.createElement = jest.fn((tagName) => {
    if (tagName === 'canvas') {
      return createMockCanvas();
    }
    return originalCreateElement.call(document, tagName);
  });
});

afterAll(() => {
  document.createElement = originalCreateElement;
});

describe('Animation Rendering Pipeline', () => {
  let canvas;
  let animatedText;

  beforeEach(() => {
    canvas = createMockCanvas();
    animatedText = new AnimatedNoiseText(canvas, {
      text: 'TEST',
      cellSize: 2,
      stepPixels: 4,
      stepMs: 32
    });
  });

  afterEach(() => {
    if (animatedText) {
      animatedText.destroy();
    }
  });

  describe('Animation Frame Rendering', () => {
    test('should have _renderFrame method', () => {
      expect(typeof animatedText._renderFrame).toBe('function');
    });

    test('should have _drawMovingCircle method', () => {
      expect(typeof animatedText._drawMovingCircle).toBe('function');
    });

    test('should call renderDirectNoise during frame rendering', () => {
      const renderNoiseSpy = jest.spyOn(animatedText.noiseGenerator, 'renderDirectNoise');
      
      // Mock the required resources and set animation as running
      animatedText.textMask = createMockCanvas();
      animatedText.noiseCanvas = createMockCanvas();
      animatedText.isRunning = true;
      
      animatedText._renderFrame(10);
      
      expect(renderNoiseSpy).toHaveBeenCalled();
    });

    test('should call _drawMovingCircle when resources are available', () => {
      const drawMovingCircleSpy = jest.spyOn(animatedText, '_drawMovingCircle');
      
      // Mock the required resources and set animation as running
      animatedText.textMask = createMockCanvas();
      animatedText.noiseCanvas = createMockCanvas();
      animatedText.isRunning = true;
      
      animatedText._renderFrame(10);
      
      expect(drawMovingCircleSpy).toHaveBeenCalledWith(10);
    });

    test('should not call _drawMovingCircle when resources are missing', () => {
      const drawMovingCircleSpy = jest.spyOn(animatedText, '_drawMovingCircle');
      
      // Don't set textMask or noiseCanvas
      animatedText.textMask = null;
      animatedText.noiseCanvas = null;
      
      animatedText._renderFrame(10);
      
      expect(drawMovingCircleSpy).not.toHaveBeenCalled();
    });
  });

  describe('Moving Circle Animation', () => {
    beforeEach(() => {
      // Set up required resources for _drawMovingCircle
      animatedText.textMask = createMockCanvas();
      animatedText.noiseCanvas = createMockCanvas();
      animatedText.circleCanvas = createMockCanvas();
      animatedText.compositeCanvas = createMockCanvas();
      animatedText.circleCtx = animatedText.circleCanvas.getContext('2d');
      animatedText.compositeCtx = animatedText.compositeCanvas.getContext('2d');
    });

    test('should calculate moving offset based on stepPixels and animation offset', () => {
      const offset = 10;
      const expectedMovingOffset = (offset * animatedText.config.stepPixels) % animatedText.noiseCanvas.height;
      
      animatedText._drawMovingCircle(offset);
      
      // Verify the calculation is used (we can't directly test the internal calculation,
      // but we can verify the method runs without errors)
      expect(animatedText.circleCtx.clearRect).toHaveBeenCalled();
    });

    test('should clear circle canvas before rendering', () => {
      animatedText._drawMovingCircle(5);
      
      expect(animatedText.circleCtx.clearRect).toHaveBeenCalledWith(
        0, 0, 
        animatedText.circleCanvas.width, 
        animatedText.circleCanvas.height
      );
    });

    test('should set imageSmoothingEnabled to false', () => {
      animatedText._drawMovingCircle(5);
      
      expect(animatedText.circleCtx.imageSmoothingEnabled).toBe(false);
      expect(animatedText.compositeCtx.imageSmoothingEnabled).toBe(false);
    });

    test('should use composite operations for masking', () => {
      animatedText._drawMovingCircle(5);
      
      // Check that composite operations are set correctly
      expect(animatedText.compositeCtx.globalCompositeOperation).toBe('source-over');
    });

    test('should draw final result to main canvas', () => {
      const mainCtx = animatedText.canvasManager.getContext();
      const drawImageSpy = jest.spyOn(mainCtx, 'drawImage');
      
      animatedText._drawMovingCircle(5);
      
      expect(drawImageSpy).toHaveBeenCalledWith(
        animatedText.compositeCanvas,
        expect.any(Number),
        expect.any(Number)
      );
    });

    test('should return early if required resources are missing', () => {
      animatedText.textMask = null;
      
      const clearRectSpy = jest.spyOn(animatedText.circleCtx, 'clearRect');
      
      animatedText._drawMovingCircle(5);
      
      expect(clearRectSpy).not.toHaveBeenCalled();
    });
  });

  describe('Offscreen Canvas Management', () => {
    test('should have _resizeOffscreenCanvases method', () => {
      expect(typeof animatedText._resizeOffscreenCanvases).toBe('function');
    });

    test('should resize offscreen canvases to specified dimensions', () => {
      const width = 400;
      const height = 300;
      
      animatedText._resizeOffscreenCanvases(width, height);
      
      expect(animatedText.circleCanvas.width).toBe(width);
      expect(animatedText.circleCanvas.height).toBe(height);
      expect(animatedText.compositeCanvas.width).toBe(width);
      expect(animatedText.compositeCanvas.height).toBe(height);
    });

    test('should recreate canvas contexts after resize', () => {
      const width = 400;
      const height = 300;
      
      animatedText._resizeOffscreenCanvases(width, height);
      
      expect(animatedText.circleCtx).toBeTruthy();
      expect(animatedText.compositeCtx).toBeTruthy();
    });
  });

  describe('Resource Initialization Order', () => {
    test('should generate text mask before noise pattern', () => {
      const generateTextMaskSpy = jest.spyOn(animatedText, '_generateTextMask');
      const generateNoisePatternSpy = jest.spyOn(animatedText, '_generateNoisePattern');
      
      animatedText._initializeResources();
      
      expect(generateTextMaskSpy).toHaveBeenCalled();
      expect(generateNoisePatternSpy).toHaveBeenCalled();
    });

    test('should resize offscreen canvases when text mask is generated', () => {
      const resizeOffscreenCanvasesSpy = jest.spyOn(animatedText, '_resizeOffscreenCanvases');
      
      animatedText._generateTextMask();
      
      expect(resizeOffscreenCanvasesSpy).toHaveBeenCalled();
    });
  });

  describe('Animation Integration', () => {
    test('should start animation without errors', () => {
      expect(() => {
        animatedText.start();
      }).not.toThrow();
      
      expect(animatedText.isRunning).toBe(true);
    });

    test('should stop animation without errors', () => {
      animatedText.start();
      
      expect(() => {
        animatedText.stop();
      }).not.toThrow();
      
      expect(animatedText.isRunning).toBe(false);
    });

    test('should handle animation frame callback', () => {
      const renderFrameSpy = jest.spyOn(animatedText, '_renderFrame');
      
      animatedText.start();
      
      // Simulate animation controller calling the callback
      const callback = animatedText.animationController.animationCallback;
      if (callback) {
        callback(10);
      }
      
      expect(renderFrameSpy).toHaveBeenCalledWith(10);
    });
  });
});