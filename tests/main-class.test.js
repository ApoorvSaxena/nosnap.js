/**
 * Tests for the main NoSnap class integration
 * These tests focus on the class structure and API without canvas operations
 */

import NoSnap from '../src/index.js';

// Mock canvas and context for testing
const createMockCanvas = () => {
  const mockContext = {
    canvas: null,
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    scale: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    translate: jest.fn(),
    rotate: jest.fn(),
    transform: jest.fn(),
    setTransform: jest.fn(),
    resetTransform: jest.fn(),
    createImageData: jest.fn(() => ({
      data: new Uint8ClampedArray(800 * 600 * 4),
      width: 800,
      height: 600
    })),
    putImageData: jest.fn(),
    fillStyle: '',
    strokeStyle: '',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    font: '',
    textAlign: '',
    textBaseline: '',
    fillText: jest.fn(),
    strokeText: jest.fn(),
    measureText: jest.fn(() => ({ width: 100 })),
    getImageData: jest.fn(() => {
      // Create mock image data with some non-zero alpha values to simulate text
      const data = new Uint8ClampedArray(800 * 600 * 4);
      // Add some fake text pixels in the middle
      for (let i = 100000; i < 100100; i += 4) {
        data[i + 3] = 255; // Alpha channel
      }
      return { data, width: 800, height: 600 };
    }),
    imageSmoothingEnabled: true,
    beginPath: jest.fn(),
    closePath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    arc: jest.fn(),
    rect: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn()
  };

  const mockCanvas = {
    width: 800,
    height: 600,
    style: {
      width: '800px',
      height: '600px'
    },
    getContext: jest.fn(() => mockContext),
    getBoundingClientRect: jest.fn(() => ({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      right: 800,
      bottom: 600
    })),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    parentNode: document.body
  };

  // Make it pass instanceof check
  Object.setPrototypeOf(mockCanvas, HTMLCanvasElement.prototype);
  mockContext.canvas = mockCanvas;

  return mockCanvas;
};

// Mock document.createElement to return our mock canvas
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

describe('NoSnap Main Class', () => {
  let mockCanvas;

  beforeEach(() => {
    mockCanvas = createMockCanvas();
  });

  describe('Constructor', () => {
    test('should create instance with valid canvas and default options', () => {
      const instance = new NoSnap(mockCanvas);
      
      expect(instance).toBeInstanceOf(NoSnap);
      expect(instance.canvas).toBe(mockCanvas);
      expect(instance.config).toBeDefined();
      expect(instance.config.text).toBe('HELLO');
      expect(instance.isRunning).toBe(false);
      expect(instance.isDestroyed).toBe(false);
    });

    test('should create instance with custom options', () => {
      const options = {
        text: 'CUSTOM',
        cellSize: 4,
        circleRadius: 250
      };
      
      const instance = new NoSnap(mockCanvas, options);
      
      expect(instance.config.text).toBe('CUSTOM');
      expect(instance.config.cellSize).toBe(4);
      expect(instance.config.circleRadius).toBe(250);
    });

    test('should throw error with invalid canvas', () => {
      expect(() => {
        new NoSnap(null);
      }).toThrow('NoSnap constructor requires a canvas element as the first parameter');

      expect(() => {
        new NoSnap({});
      }).toThrow('NoSnap requires an HTMLCanvasElement');
    });

    test('should initialize all component instances', () => {
      const instance = new NoSnap(mockCanvas);
      
      expect(instance.canvasManager).toBeDefined();
      expect(instance.noiseGenerator).toBeDefined();
      expect(instance.textRenderer).toBeDefined();
      expect(instance.animationController).toBeDefined();
      expect(instance.configManager).toBeDefined();
    });
  });

  describe('Public API Methods', () => {
    let instance;

    beforeEach(() => {
      instance = new NoSnap(mockCanvas);
    });

    test('should have start method', () => {
      expect(typeof instance.start).toBe('function');
      
      // Should not throw when called
      expect(() => instance.start()).not.toThrow();
      expect(instance.isRunning).toBe(true);
    });

    test('should have stop method', () => {
      expect(typeof instance.stop).toBe('function');
      
      instance.start();
      expect(instance.isRunning).toBe(true);
      
      instance.stop();
      expect(instance.isRunning).toBe(false);
    });

    test('should have destroy method', () => {
      expect(typeof instance.destroy).toBe('function');
      
      instance.start();
      instance.destroy();
      
      expect(instance.isRunning).toBe(false);
      expect(instance.isDestroyed).toBe(true);
    });

    test('should have setText method', () => {
      expect(typeof instance.setText).toBe('function');
      
      instance.setText('NEW TEXT');
      expect(instance.config.text).toBe('NEW TEXT');
    });

    test('should have updateConfig method', () => {
      expect(typeof instance.updateConfig).toBe('function');
      
      instance.updateConfig({ cellSize: 5, text: 'UPDATED' });
      expect(instance.config.cellSize).toBe(5);
      expect(instance.config.text).toBe('UPDATED');
    });
  });

  describe('Error Handling', () => {
    let instance;

    beforeEach(() => {
      instance = new NoSnap(mockCanvas);
    });

    test('should throw error when calling methods on destroyed instance', () => {
      instance.destroy();
      
      expect(() => instance.start()).toThrow('Cannot start animation on destroyed instance');
      expect(() => instance.setText('test')).toThrow('Cannot set text on destroyed instance');
      expect(() => instance.updateConfig({})).toThrow('Cannot update config on destroyed instance');
    });

    test('should handle multiple start calls gracefully', () => {
      instance.start();
      expect(instance.isRunning).toBe(true);
      
      // Second start should not throw
      expect(() => instance.start()).not.toThrow();
      expect(instance.isRunning).toBe(true);
    });

    test('should handle multiple stop calls gracefully', () => {
      instance.stop();
      expect(instance.isRunning).toBe(false);
      
      // Second stop should not throw
      expect(() => instance.stop()).not.toThrow();
      expect(instance.isRunning).toBe(false);
    });

    test('should handle multiple destroy calls gracefully', () => {
      instance.destroy();
      expect(instance.isDestroyed).toBe(true);
      
      // Second destroy should not throw
      expect(() => instance.destroy()).not.toThrow();
      expect(instance.isDestroyed).toBe(true);
    });
  });

  describe('Configuration Integration', () => {
    test('should handle configuration warnings', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const instance = new NoSnap(mockCanvas, {
        cellSize: 0, // Invalid
        text: 'VALID'
      });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'NoSnap configuration warnings:',
        expect.any(Array)
      );
      
      // Should use sanitized value
      expect(instance.config.cellSize).toBe(1);
      expect(instance.config.text).toBe('VALID');
      
      consoleSpy.mockRestore();
    });

    test('should update components when configuration changes', () => {
      const instance = new NoSnap(mockCanvas, { cellSize: 2 });
      
      // Change cellSize should update NoiseGenerator
      instance.updateConfig({ cellSize: 4 });
      expect(instance.noiseGenerator.getCellSize()).toBe(4);
      
      // Change stepMs should update AnimationController
      instance.updateConfig({ stepMs: 50 });
      expect(instance.config.stepMs).toBe(50);
    });
  });
});