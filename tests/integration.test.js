/**
 * Integration tests for AnimatedNoiseText with ConfigManager
 */

import AnimatedNoiseText from '../src/index.js';

// Mock canvas and context for testing
const createMockCanvas = () => {
  const mockContext = {
    canvas: null,
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    scale: jest.fn(),
    drawImage: jest.fn(),
    fillStyle: '',
    font: '',
    textAlign: '',
    textBaseline: '',
    fillText: jest.fn(),
    measureText: jest.fn(() => ({ width: 100 })),
    getImageData: jest.fn(() => ({
      data: new Uint8ClampedArray(800 * 600 * 4),
      width: 800,
      height: 600
    })),
    imageSmoothingEnabled: true,
    globalCompositeOperation: 'source-over'
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
    }))
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

// Mock console.warn to capture warnings
const originalWarn = console.warn;
let warnMessages = [];

beforeEach(() => {
  warnMessages = [];
  console.warn = jest.fn((...args) => {
    warnMessages.push(args.join(' '));
  });
});

afterEach(() => {
  console.warn = originalWarn;
});

describe('AnimatedNoiseText Integration', () => {
  let mockCanvas;

  beforeEach(() => {
    mockCanvas = createMockCanvas();
  });

  describe('constructor with ConfigManager', () => {
    test('should initialize with default configuration', () => {
      const instance = new AnimatedNoiseText(mockCanvas);
      
      expect(instance.config).toBeDefined();
      expect(instance.config.text).toBe('HELLO');
      expect(instance.config.cellSize).toBe(2);
      expect(instance.config.circleRadius).toBe(300);
      expect(instance.configManager).toBeDefined();
    });

    test('should initialize with custom configuration', () => {
      const options = {
        text: 'CUSTOM',
        cellSize: 4,
        circleRadius: 250
      };
      
      const instance = new AnimatedNoiseText(mockCanvas, options);
      
      expect(instance.config.text).toBe('CUSTOM');
      expect(instance.config.cellSize).toBe(4);
      expect(instance.config.circleRadius).toBe(250);
      // Should still have defaults for unspecified options
      expect(instance.config.stepPixels).toBe(4);
      expect(instance.config.fontFamily).toBe('sans-serif');
    });

    test('should handle invalid configuration with warnings', () => {
      const options = {
        text: 'TEST',
        cellSize: 0, // Invalid - below minimum
        circleRadius: 2000 // Invalid - above maximum
      };
      
      const instance = new AnimatedNoiseText(mockCanvas, options);
      
      // Should have sanitized the invalid values
      expect(instance.config.cellSize).toBe(1); // Clamped to minimum
      expect(instance.config.circleRadius).toBe(1000); // Clamped to maximum
      expect(instance.config.text).toBe('TEST'); // Valid value preserved
      
      // Should have logged warnings
      expect(warnMessages).toHaveLength(1);
      expect(warnMessages[0]).toContain('configuration warnings');
    });

    test('should handle null options gracefully', () => {
      const instance = new AnimatedNoiseText(mockCanvas, null);
      
      expect(instance.config).toEqual({
        text: 'HELLO',
        cellSize: 2,
        circleRadius: 300,
        stepPixels: 4,
        stepMs: 32,
        maskBlockSize: 2,
        fontSize: null,
        fontWeight: 900,
        fontFamily: 'sans-serif'
      });
      
      expect(warnMessages).toHaveLength(0);
    });
  });

  describe('updateConfig method', () => {
    test('should update configuration correctly', () => {
      const instance = new AnimatedNoiseText(mockCanvas, { text: 'INITIAL' });
      
      instance.updateConfig({
        text: 'UPDATED',
        cellSize: 3
      });
      
      expect(instance.config.text).toBe('UPDATED');
      expect(instance.config.cellSize).toBe(3);
      // Other values should remain unchanged
      expect(instance.config.circleRadius).toBe(300);
    });

    test('should handle invalid updates with warnings', () => {
      const instance = new AnimatedNoiseText(mockCanvas);
      
      instance.updateConfig({
        cellSize: 25, // Invalid - above maximum
        stepMs: 10   // Invalid - below minimum
      });
      
      expect(instance.config.cellSize).toBe(20); // Clamped to maximum
      expect(instance.config.stepMs).toBe(16);   // Clamped to minimum
      
      expect(warnMessages).toHaveLength(1);
      expect(warnMessages[0]).toContain('configuration warnings');
    });
  });

  describe('setText method', () => {
    test('should update text configuration', () => {
      const instance = new AnimatedNoiseText(mockCanvas, { text: 'INITIAL' });
      
      instance.setText('NEW TEXT');
      
      expect(instance.config.text).toBe('NEW TEXT');
    });

    test('should handle empty string', () => {
      const instance = new AnimatedNoiseText(mockCanvas);
      
      instance.setText('');
      
      expect(instance.config.text).toBe('');
      expect(warnMessages).toHaveLength(0); // Empty string should be valid for text
    });
  });

  describe('configuration validation integration', () => {
    test('should validate all configuration options together', () => {
      const complexOptions = {
        text: 'COMPLEX TEST',
        cellSize: 3,
        circleRadius: 400,
        stepPixels: 6,
        stepMs: 50,
        maskBlockSize: 3,
        fontSize: 72,
        fontWeight: 'bold',
        fontFamily: 'Arial'
      };
      
      const instance = new AnimatedNoiseText(mockCanvas, complexOptions);
      
      expect(instance.config).toEqual(complexOptions);
      expect(warnMessages).toHaveLength(0);
    });

    test('should handle mixed valid and invalid options', () => {
      const mixedOptions = {
        text: 'MIXED',
        cellSize: 25,    // Invalid - above max
        circleRadius: 350, // Valid
        stepMs: 10,      // Invalid - below min
        fontSize: null,  // Valid
        fontWeight: 600  // Valid
      };
      
      const instance = new AnimatedNoiseText(mockCanvas, mixedOptions);
      
      expect(instance.config.text).toBe('MIXED');
      expect(instance.config.cellSize).toBe(20);    // Sanitized
      expect(instance.config.circleRadius).toBe(350); // Preserved
      expect(instance.config.stepMs).toBe(16);      // Sanitized
      expect(instance.config.fontSize).toBe(null);  // Preserved
      expect(instance.config.fontWeight).toBe(600); // Preserved
      
      expect(warnMessages).toHaveLength(1);
    });
  });
});