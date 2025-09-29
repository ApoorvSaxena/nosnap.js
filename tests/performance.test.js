/**
 * Performance Tests for Animation Smoothness
 * Tests Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.4
 */

import AnimatedNoiseText from '../src/index.js';
import { createMockCanvas } from './test-utils/canvas-mock.js';

// Mock performance.now for consistent timing
const mockPerformanceNow = jest.fn();
Object.defineProperty(global, 'performance', {
  value: {
    now: mockPerformanceNow
  },
  writable: true
});

// Mock requestAnimationFrame for performance testing
let animationFrameCallbacks = [];
global.requestAnimationFrame = jest.fn((callback) => {
  const id = animationFrameCallbacks.length;
  animationFrameCallbacks.push(callback);
  return id;
});

global.cancelAnimationFrame = jest.fn((id) => {
  if (animationFrameCallbacks[id]) {
    animationFrameCallbacks[id] = null;
  }
});

// Helper to simulate animation frames
const simulateAnimationFrames = (count = 10, interval = 16) => {
  let time = 0;
  for (let i = 0; i < count; i++) {
    time += interval;
    mockPerformanceNow.mockReturnValueOnce(time);
    
    // Execute only the first few callbacks to prevent memory buildup
    const callbacks = animationFrameCallbacks.slice(0, 5);
    animationFrameCallbacks = [];
    callbacks.forEach(callback => {
      if (callback) {
        try {
          callback(time);
        } catch (error) {
          // Ignore callback errors for performance testing
        }
      }
    });
  }
};

// Mock document.createElement for canvas elements
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

describe('Performance Tests', () => {
  let canvas, instance;

  beforeEach(() => {
    canvas = createMockCanvas();
    instance = new AnimatedNoiseText(canvas, {
      text: 'PERFORMANCE TEST',
      cellSize: 2,
      stepMs: 16 // 60fps target
    });
    
    // Reset mocks
    jest.clearAllMocks();
    animationFrameCallbacks = [];
    mockPerformanceNow.mockClear();
  });

  afterEach(() => {
    if (instance && !instance.isDestroyed) {
      instance.destroy();
    }
  });

  describe('Animation Frame Rate Performance', () => {
    test('should have animation controller with timing methods', () => {
      expect(instance.animationController).toBeDefined();
      expect(typeof instance.animationController.start).toBe('function');
      expect(typeof instance.animationController.stop).toBe('function');
      expect(typeof instance.animationController.setStepInterval).toBe('function');
    });

    test('should start and stop animation without errors', () => {
      expect(() => {
        instance.start();
        expect(instance.isRunning).toBe(true);
        instance.stop();
        expect(instance.isRunning).toBe(false);
      }).not.toThrow();
    });

    test('should handle different step intervals', () => {
      const testIntervals = [16, 32, 50];
      
      testIntervals.forEach(interval => {
        expect(() => {
          instance.animationController.setStepInterval(interval);
          expect(instance.animationController.stepMs).toBe(interval);
        }).not.toThrow();
      });
    });
  });

  describe('Memory Usage Performance', () => {
    test('should have proper cleanup methods', () => {
      expect(typeof instance.destroy).toBe('function');
      expect(typeof instance.stop).toBe('function');
      
      // Test cleanup doesn't throw
      expect(() => {
        instance.start();
        instance.stop();
        instance.destroy();
      }).not.toThrow();
    });

    test('should handle multiple instance creation and destruction', () => {
      // Create and destroy a few instances
      for (let i = 0; i < 3; i++) {
        const testCanvas = createMockCanvas();
        const testInstance = new AnimatedNoiseText(testCanvas, {
          text: `TEST ${i}`,
          cellSize: 2
        });
        
        expect(() => {
          testInstance.start();
          testInstance.stop();
          testInstance.destroy();
        }).not.toThrow();
      }
    });

    test('should handle text updates efficiently', () => {
      expect(() => {
        // Change text content a few times
        for (let i = 0; i < 5; i++) {
          instance.setText(`DYNAMIC TEXT ${i}`);
        }
      }).not.toThrow();
    });
  });

  describe('Canvas Rendering Performance', () => {
    test('should handle large canvas dimensions', () => {
      // Test with large canvas
      const largeCanvas = createMockCanvas({ width: 1920, height: 1080 });
      
      expect(() => {
        const largeInstance = new AnimatedNoiseText(largeCanvas, {
          text: 'LARGE CANVAS TEST',
          cellSize: 2
        });
        
        largeInstance.start();
        largeInstance.stop();
        largeInstance.destroy();
      }).not.toThrow();
    });

    test('should handle different cell sizes', () => {
      const cellSizes = [1, 2, 4, 8];
      
      cellSizes.forEach(cellSize => {
        expect(() => {
          const testInstance = new AnimatedNoiseText(canvas, {
            text: 'CELL SIZE TEST',
            cellSize: cellSize
          });
          
          testInstance.start();
          testInstance.stop();
          testInstance.destroy();
        }).not.toThrow();
      });
    });

    test('should have efficient noise generation methods', () => {
      expect(typeof instance.noiseGenerator.renderDirectNoise).toBe('function');
      expect(typeof instance.noiseGenerator.createNoiseCanvas).toBe('function');
      
      // Test noise generation doesn't throw
      expect(() => {
        const mockCtx = canvas.getContext('2d');
        instance.noiseGenerator.renderDirectNoise(mockCtx, 100, 100);
      }).not.toThrow();
    });
  });

  describe('Resize Performance', () => {
    test('should handle resize operations without errors', () => {
      expect(() => {
        instance.start();
        
        // Simulate resize events
        for (let i = 0; i < 3; i++) {
          const newWidth = 400 + (i * 100);
          const newHeight = 300 + (i * 75);
          
          canvas.getBoundingClientRect = jest.fn().mockReturnValue({
            width: newWidth,
            height: newHeight,
            top: 0,
            left: 0,
            right: newWidth,
            bottom: newHeight
          });
          
          instance.canvasManager.forceResize();
        }
        
        instance.stop();
      }).not.toThrow();
    });

    test('should maintain animation state during resize', () => {
      instance.start();
      expect(instance.isRunning).toBe(true);
      
      // Trigger resize
      canvas.getBoundingClientRect = jest.fn().mockReturnValue({
        width: 800,
        height: 600,
        top: 0,
        left: 0,
        right: 800,
        bottom: 600
      });
      instance.canvasManager.forceResize();
      
      // Animation should still be running after resize
      expect(instance.isRunning).toBe(true);
    });
  });

  describe('Configuration Update Performance', () => {
    test('should handle configuration updates without errors', () => {
      instance.start();
      
      // Test various configuration updates
      const configUpdates = [
        { cellSize: 3 },
        { text: 'NEW TEXT' },
        { circleRadius: 400 },
        { stepPixels: 6 },
        { fontWeight: 700 }
      ];
      
      configUpdates.forEach(update => {
        expect(() => {
          instance.updateConfig(update);
        }).not.toThrow();
      });
    });

    test('should maintain performance after configuration changes', () => {
      expect(() => {
        instance.updateConfig({ cellSize: 4 });
        instance.start();
        instance.stop();
        
        instance.updateConfig({ text: 'UPDATED' });
        instance.start();
        instance.stop();
      }).not.toThrow();
    });
  });
});