/**
 * Tests for resource cleanup and lifecycle management
 * These tests focus on memory leak prevention and proper resource disposal
 */

import AnimatedNoiseText from '../src/index.js';
import AnimationController from '../src/components/AnimationController.js';
import TextRenderer from '../src/components/TextRenderer.js';
import NoiseGenerator from '../src/components/NoiseGenerator.js';
import { createMockCanvas } from './test-utils/canvas-mock.js';

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

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn();
global.cancelAnimationFrame = jest.fn();

// Mock performance.now
const mockPerformanceNow = jest.fn();
Object.defineProperty(global, 'performance', {
  value: {
    now: mockPerformanceNow
  },
  writable: true
});

// Mock window for CanvasManager
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();

Object.defineProperty(global, 'window', {
  value: {
    devicePixelRatio: 2,
    addEventListener: mockAddEventListener,
    removeEventListener: mockRemoveEventListener
  },
  writable: true
});

describe('Resource Cleanup and Lifecycle Management', () => {
  let mockCanvas;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCanvas = createMockCanvas();
    
    // Reset performance.now mock
    let time = 0;
    mockPerformanceNow.mockImplementation(() => {
      time += 16; // Simulate 60fps
      return time;
    });
  });

  describe('AnimationController Resource Cleanup', () => {
    let controller;

    beforeEach(() => {
      controller = new AnimationController(32);
    });

    afterEach(() => {
      if (controller) {
        controller.destroy();
      }
    });

    test('should have destroy method', () => {
      expect(typeof controller.destroy).toBe('function');
    });

    test('should clean up animation frame on destroy', () => {
      const mockCallback = jest.fn();
      controller.start(mockCallback);
      controller.animationId = 123; // Simulate running animation
      
      controller.destroy();
      
      expect(global.cancelAnimationFrame).toHaveBeenCalledWith(123);
      expect(controller.animationId).toBe(null);
      expect(controller.isRunning).toBe(false);
    });

    test('should reset all state on destroy', () => {
      const mockCallback = jest.fn();
      controller.start(mockCallback);
      controller.animationOffset = 100;
      controller.accumulatedTime = 50;
      
      controller.destroy();
      
      expect(controller.animationOffset).toBe(0);
      expect(controller.lastFrameTime).toBe(0);
      expect(controller.accumulatedTime).toBe(0);
      expect(controller.stepMs).toBe(32);
      expect(controller.animationCallback).toBe(null);
    });

    test('should handle destroy when not running', () => {
      expect(() => controller.destroy()).not.toThrow();
      expect(controller.animationId).toBe(null);
      expect(controller.isRunning).toBe(false);
    });
  });

  describe('TextRenderer Resource Cleanup', () => {
    let textRenderer;

    beforeEach(() => {
      textRenderer = new TextRenderer({
        fontSize: 48,
        fontWeight: 900,
        fontFamily: 'Arial'
      });
    });

    afterEach(() => {
      if (textRenderer) {
        textRenderer.destroy();
      }
    });

    test('should have destroy method', () => {
      expect(typeof textRenderer.destroy).toBe('function');
    });

    test('should clear cache on destroy', () => {
      // Add some items to cache
      textRenderer.fontMeasurementCache.set('test1', 24);
      textRenderer.fontMeasurementCache.set('test2', 36);
      
      expect(textRenderer.getCacheSize()).toBe(2);
      
      textRenderer.destroy();
      
      expect(textRenderer.getCacheSize()).toBe(0);
    });

    test('should reset configuration on destroy', () => {
      textRenderer.destroy();
      
      expect(textRenderer.config).toEqual({
        fontSize: null,
        fontWeight: 900,
        fontFamily: 'sans-serif',
        maskBlockSize: 2
      });
    });

    test('should handle destroy with empty cache', () => {
      expect(textRenderer.getCacheSize()).toBe(0);
      expect(() => textRenderer.destroy()).not.toThrow();
      expect(textRenderer.getCacheSize()).toBe(0);
    });
  });

  describe('NoiseGenerator Resource Cleanup', () => {
    let noiseGenerator;

    beforeEach(() => {
      noiseGenerator = new NoiseGenerator(4);
    });

    afterEach(() => {
      if (noiseGenerator) {
        noiseGenerator.destroy();
      }
    });

    test('should have destroy method', () => {
      expect(typeof noiseGenerator.destroy).toBe('function');
    });

    test('should reset cell size on destroy', () => {
      expect(noiseGenerator.getCellSize()).toBe(4);
      
      noiseGenerator.destroy();
      
      expect(noiseGenerator.getCellSize()).toBe(2); // Default value
    });

    test('should handle destroy gracefully', () => {
      expect(() => noiseGenerator.destroy()).not.toThrow();
    });
  });

  describe('Main Class Resource Cleanup', () => {
    let instance;

    beforeEach(() => {
      instance = new AnimatedNoiseText(mockCanvas);
    });

    afterEach(() => {
      if (instance && !instance.isDestroyed) {
        instance.destroy();
      }
    });

    test('should clean up all component references on destroy', () => {
      instance.destroy();
      
      expect(instance.animationController).toBe(null);
      expect(instance.canvasManager).toBe(null);
      expect(instance.textRenderer).toBe(null);
      expect(instance.noiseGenerator).toBe(null);
      expect(instance.configManager).toBe(null);
      expect(instance.canvas).toBe(null);
      expect(instance.config).toBe(null);
    });

    test('should clean up offscreen canvases on destroy', () => {
      // Initialize resources to create offscreen canvases
      instance._initializeResources();
      
      expect(instance.circleCanvas).toBeDefined();
      expect(instance.compositeCanvas).toBeDefined();
      
      instance.destroy();
      
      expect(instance.circleCanvas).toBe(null);
      expect(instance.circleCtx).toBe(null);
      expect(instance.compositeCanvas).toBe(null);
      expect(instance.compositeCtx).toBe(null);
      expect(instance.textMask).toBe(null);
      expect(instance.noiseCanvas).toBe(null);
    });

    test('should handle destroy with partial initialization', () => {
      // Create instance but don't initialize resources
      const partialInstance = new AnimatedNoiseText(mockCanvas);
      
      // Manually set some properties to null to simulate partial initialization
      partialInstance.circleCanvas = null;
      partialInstance.textMask = null;
      
      expect(() => partialInstance.destroy()).not.toThrow();
      expect(partialInstance.isDestroyed).toBe(true);
    });

    test('should handle cleanup errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock a component to throw error during cleanup
      instance.canvasManager.cleanup = jest.fn(() => {
        throw new Error('Cleanup failed');
      });
      
      expect(() => instance.destroy()).not.toThrow();
      expect(instance.isDestroyed).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    test('should stop animation before cleanup on destroy', () => {
      const stopSpy = jest.spyOn(instance, 'stop');
      
      instance.start();
      instance.destroy();
      
      expect(stopSpy).toHaveBeenCalled();
      expect(instance.isRunning).toBe(false);
      expect(instance.isDestroyed).toBe(true);
    });

    test('should handle stop errors during destroy', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock stop to throw error
      instance.stop = jest.fn(() => {
        throw new Error('Stop failed');
      });
      
      expect(() => instance.destroy()).not.toThrow();
      expect(instance.isDestroyed).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Memory Leak Prevention', () => {
    let instance;

    beforeEach(() => {
      instance = new AnimatedNoiseText(mockCanvas);
    });

    afterEach(() => {
      if (instance && !instance.isDestroyed) {
        instance.destroy();
      }
    });

    test('should initialize memory leak prevention properties', () => {
      expect(instance.frameCount).toBe(0);
      expect(instance.lastCleanupTime).toBeDefined();
      expect(instance.cleanupInterval).toBe(300000); // 5 minutes
    });

    test('should perform periodic cleanup during animation', () => {
      const clearCacheSpy = jest.spyOn(instance.textRenderer, 'clearCache');
      
      // Mock large cache size to trigger cleanup
      instance.textRenderer.getCacheSize = jest.fn(() => 150);
      
      // Simulate frame rendering that doesn't trigger cleanup yet
      instance.frameCount = 9998; // Will become 9999 after increment
      instance._performPeriodicCleanup();
      
      expect(clearCacheSpy).not.toHaveBeenCalled();
      expect(instance.frameCount).toBe(9999);
      
      // Trigger cleanup with frame count (9999 will become 10000 and trigger cleanup)
      instance._performPeriodicCleanup();
      
      expect(clearCacheSpy).toHaveBeenCalled();
      expect(instance.frameCount).toBe(0); // Reset after cleanup
    });

    test('should perform periodic cleanup based on time interval', () => {
      const clearCacheSpy = jest.spyOn(instance.textRenderer, 'clearCache');
      
      // Mock large cache size and old timestamp
      instance.textRenderer.getCacheSize = jest.fn(() => 150);
      instance.lastCleanupTime = Date.now() - 400000; // 6+ minutes ago
      
      instance._performPeriodicCleanup();
      
      expect(clearCacheSpy).toHaveBeenCalled();
    });

    test('should handle cleanup errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Mock clearCache to throw error
      instance.textRenderer.clearCache = jest.fn(() => {
        throw new Error('Cache clear failed');
      });
      instance.textRenderer.getCacheSize = jest.fn(() => 150);
      instance.frameCount = 9999; // Will become 10000 and trigger cleanup
      
      expect(() => instance._performPeriodicCleanup()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    test('should call garbage collection if available', () => {
      const mockGC = jest.fn();
      global.window.gc = mockGC;
      
      instance.frameCount = 9999; // Will become 10000 and trigger cleanup
      instance._performPeriodicCleanup();
      
      expect(mockGC).toHaveBeenCalled();
      
      delete global.window.gc;
    });
  });

  describe('Error Handling in Resource Management', () => {
    let instance;

    beforeEach(() => {
      instance = new AnimatedNoiseText(mockCanvas);
    });

    afterEach(() => {
      if (instance && !instance.isDestroyed) {
        instance.destroy();
      }
    });

    test('should handle render frame errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Start the instance so it's in running state
      instance.start();
      
      // Mock getContext to throw error
      instance.canvasManager.getContext = jest.fn(() => {
        throw new Error('Context failed');
      });
      
      expect(() => instance._renderFrame(0)).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    test('should handle stop errors and force stop state', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      instance.start();
      expect(instance.isRunning).toBe(true);
      
      // Mock animationController.stop to throw error
      instance.animationController.stop = jest.fn(() => {
        throw new Error('Stop failed');
      });
      
      instance.stop();
      
      expect(instance.isRunning).toBe(false); // Should be forced to false
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    test('should handle missing animationController in stop', () => {
      instance.start();
      instance.animationController = null;
      
      expect(() => instance.stop()).not.toThrow();
      expect(instance.isRunning).toBe(false);
    });
  });

  describe('Canvas Resource Disposal', () => {
    let instance;

    beforeEach(() => {
      instance = new AnimatedNoiseText(mockCanvas);
    });

    afterEach(() => {
      if (instance && !instance.isDestroyed) {
        instance.destroy();
      }
    });

    test('should clear canvas dimensions on cleanup', () => {
      instance._initializeResources();
      
      const circleCanvas = instance.circleCanvas;
      const compositeCanvas = instance.compositeCanvas;
      
      expect(circleCanvas.width).toBeGreaterThan(0);
      expect(compositeCanvas.width).toBeGreaterThan(0);
      
      instance.destroy();
      
      // Canvas dimensions should be reset to 0
      expect(circleCanvas.width).toBe(0);
      expect(circleCanvas.height).toBe(0);
      expect(compositeCanvas.width).toBe(0);
      expect(compositeCanvas.height).toBe(0);
    });

    test('should clear canvas contexts before disposal', () => {
      instance._initializeResources();
      
      const clearRectSpy = jest.spyOn(instance.circleCtx, 'clearRect');
      const clearRectSpy2 = jest.spyOn(instance.compositeCtx, 'clearRect');
      
      instance.destroy();
      
      expect(clearRectSpy).toHaveBeenCalled();
      expect(clearRectSpy2).toHaveBeenCalled();
    });

    test('should handle canvas cleanup when contexts are null', () => {
      instance._initializeResources();
      
      // Simulate null contexts
      instance.circleCtx = null;
      instance.compositeCtx = null;
      
      expect(() => instance.destroy()).not.toThrow();
    });
  });
});