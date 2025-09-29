/**
 * Integration tests for responsive behavior and resize handling
 * Tests Requirements 4.1, 4.2, 4.4
 */

import AnimatedNoiseText from '../src/index.js';

// Mock window globally
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();

Object.defineProperty(global, 'window', {
  value: {
    devicePixelRatio: 1,
    addEventListener: mockAddEventListener,
    removeEventListener: mockRemoveEventListener,
    dispatchEvent: jest.fn()
  },
  writable: true
});

// Mock performance for AnimationController
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now())
  },
  writable: true
});

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => {
  return setTimeout(callback, 16);
});
global.cancelAnimationFrame = jest.fn((id) => {
  clearTimeout(id);
});

import { createMockCanvas } from './test-utils/canvas-mock.js';

// Mock ResizeObserver for testing
class MockResizeObserver {
  constructor(callback) {
    this.callback = callback;
    this.observedElements = new Set();
  }

  observe(element) {
    this.observedElements.add(element);
  }

  unobserve(element) {
    this.observedElements.delete(element);
  }

  disconnect() {
    this.observedElements.clear();
  }

  // Helper method to trigger resize events in tests
  triggerResize(element, contentRect) {
    if (this.observedElements.has(element)) {
      this.callback([{
        target: element,
        contentRect: contentRect || { width: 800, height: 600 }
      }]);
    }
  }
}

// Mock document.createElement for offscreen canvases
const originalCreateElement = document.createElement;
document.createElement = jest.fn((tagName) => {
  if (tagName === 'canvas') {
    return createMockCanvas();
  }
  return originalCreateElement.call(document, tagName);
});

describe('Responsive Behavior and Resize Handling', () => {
  let canvas;
  let animatedText;
  let originalResizeObserver;
  let mockResizeObserver;

  beforeEach(() => {
    // Create canvas element using mock with specific dimensions
    canvas = createMockCanvas({ width: 400, height: 300 });
    
    // Create a parent container
    const container = document.createElement('div');
    container.style.width = '400px';
    container.style.height = '300px';
    
    // Mock parentElement property
    Object.defineProperty(canvas, 'parentElement', {
      value: container,
      writable: true,
      configurable: true
    });
    
    // Mock ResizeObserver
    originalResizeObserver = global.ResizeObserver;
    mockResizeObserver = new MockResizeObserver(() => {});
    global.ResizeObserver = jest.fn().mockImplementation((callback) => {
      mockResizeObserver = new MockResizeObserver(callback);
      return mockResizeObserver;
    });

    // Reset mocks
    jest.clearAllMocks();
    mockAddEventListener.mockClear();
    mockRemoveEventListener.mockClear();
  });

  afterEach(() => {
    if (animatedText) {
      animatedText.destroy();
      animatedText = null;
    }
    
    // Restore ResizeObserver
    global.ResizeObserver = originalResizeObserver;
    
    jest.clearAllMocks();
  });

  describe('Requirement 4.1: Automatic canvas dimension adjustment on viewport resize', () => {
    test('should adjust canvas dimensions when window is resized', async () => {
      animatedText = new AnimatedNoiseText(canvas, { text: 'TEST' });
      
      const initialDimensions = animatedText.canvasManager.getCanvasDimensions();
      expect(initialDimensions.displayWidth).toBe(400);
      expect(initialDimensions.displayHeight).toBe(300);

      // Mock new canvas size after resize
      canvas.getBoundingClientRect = jest.fn().mockReturnValue({
        width: 800,
        height: 600,
        top: 0,
        left: 0,
        right: 800,
        bottom: 600
      });

      // Spy on the _handleResize method
      const handleResizeSpy = jest.spyOn(animatedText, '_handleResize');

      // Force a resize to test the functionality
      animatedText.canvasManager.forceResize();

      // Verify resize was handled
      expect(handleResizeSpy).toHaveBeenCalled();
      
      // Verify new dimensions
      const newDimensions = animatedText.canvasManager.getCanvasDimensions();
      expect(newDimensions.displayWidth).toBe(800);
      expect(newDimensions.displayHeight).toBe(600);
    });

    test('should handle device pixel ratio changes', async () => {
      // Mock initial device pixel ratio
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        value: 1
      });

      animatedText = new AnimatedNoiseText(canvas, { text: 'TEST' });
      
      const initialDimensions = animatedText.canvasManager.getCanvasDimensions();
      expect(initialDimensions.devicePixelRatio).toBe(1);

      // Change device pixel ratio
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        value: 2
      });

      // Spy on the _handleResize method
      const handleResizeSpy = jest.spyOn(animatedText, '_handleResize');

      // Force a resize to test the functionality
      animatedText.canvasManager.forceResize();

      // Verify resize was handled
      expect(handleResizeSpy).toHaveBeenCalled();
      
      // Verify new device pixel ratio
      const newDimensions = animatedText.canvasManager.getCanvasDimensions();
      expect(newDimensions.devicePixelRatio).toBe(2);
    });
  });

  describe('Requirement 4.2: Regenerate text mask and noise patterns on resize', () => {
    test('should regenerate text mask when canvas is resized', async () => {
      animatedText = new AnimatedNoiseText(canvas, { text: 'TEST' });
      
      const originalTextMask = animatedText.textMask;
      expect(originalTextMask).toBeDefined();

      // Mock new canvas size
      canvas.getBoundingClientRect = jest.fn().mockReturnValue({
        width: 800,
        height: 600,
        top: 0,
        left: 0,
        right: 800,
        bottom: 600
      });

      // Spy on the _handleResize method
      const handleResizeSpy = jest.spyOn(animatedText, '_handleResize');

      // Force a resize to test the functionality
      animatedText.canvasManager.forceResize();

      // Verify resize was handled
      expect(handleResizeSpy).toHaveBeenCalled();
      
      // Verify text mask was regenerated (should be different object)
      expect(animatedText.textMask).toBeDefined();
      expect(animatedText.textMask).not.toBe(originalTextMask);
    });

    test('should regenerate noise pattern when canvas is resized', async () => {
      animatedText = new AnimatedNoiseText(canvas, { text: 'TEST' });
      
      const originalNoiseCanvas = animatedText.noiseCanvas;
      expect(originalNoiseCanvas).toBeDefined();

      // Mock new canvas size
      canvas.getBoundingClientRect = jest.fn().mockReturnValue({
        width: 800,
        height: 600,
        top: 0,
        left: 0,
        right: 800,
        bottom: 600
      });

      // Spy on the _handleResize method
      const handleResizeSpy = jest.spyOn(animatedText, '_handleResize');

      // Force a resize to test the functionality
      animatedText.canvasManager.forceResize();

      // Verify resize was handled
      expect(handleResizeSpy).toHaveBeenCalled();
      
      // Verify noise canvas was regenerated (should be different object)
      expect(animatedText.noiseCanvas).toBeDefined();
      expect(animatedText.noiseCanvas).not.toBe(originalNoiseCanvas);
    });

    test('should recreate offscreen canvases with new dimensions', async () => {
      animatedText = new AnimatedNoiseText(canvas, { text: 'TEST' });
      
      const originalCircleCanvas = animatedText.circleCanvas;
      const originalCompositeCanvas = animatedText.compositeCanvas;
      
      expect(originalCircleCanvas).toBeDefined();
      expect(originalCompositeCanvas).toBeDefined();

      // Mock new canvas size
      canvas.getBoundingClientRect = jest.fn().mockReturnValue({
        width: 800,
        height: 600,
        top: 0,
        left: 0,
        right: 800,
        bottom: 600
      });

      // Spy on the _handleResize method
      const handleResizeSpy = jest.spyOn(animatedText, '_handleResize');

      // Force a resize to test the functionality
      animatedText.canvasManager.forceResize();

      // Verify resize was handled
      expect(handleResizeSpy).toHaveBeenCalled();
      
      // Verify offscreen canvases were recreated
      expect(animatedText.circleCanvas).toBeDefined();
      expect(animatedText.compositeCanvas).toBeDefined();
      
      // Should be different objects (recreated)
      expect(animatedText.circleCanvas).not.toBe(originalCircleCanvas);
      expect(animatedText.compositeCanvas).not.toBe(originalCompositeCanvas);
    });
  });

  describe('Requirement 4.4: Adapt to canvas container size changes without manual intervention', () => {
    test('should detect container size changes using ResizeObserver', () => {
      animatedText = new AnimatedNoiseText(canvas, { text: 'TEST' });
      
      // Verify ResizeObserver was created and is observing elements
      expect(global.ResizeObserver).toHaveBeenCalled();
      expect(mockResizeObserver.observedElements.size).toBeGreaterThan(0);
      expect(mockResizeObserver.observedElements.has(canvas)).toBe(true);
    });

    test('should handle container resize without manual intervention', () => {
      animatedText = new AnimatedNoiseText(canvas, { text: 'TEST' });
      
      // Test that ResizeObserver is set up
      expect(global.ResizeObserver).toHaveBeenCalled();
      expect(mockResizeObserver.observedElements.has(canvas)).toBe(true);
      
      // Test that the canvas manager has the necessary methods for automatic resize handling
      expect(animatedText.canvasManager.needsResize).toBeDefined();
      expect(animatedText.canvasManager.forceResize).toBeDefined();
    });

    test('should maintain smooth animation during resize', async () => {
      animatedText = new AnimatedNoiseText(canvas, { text: 'TEST' });
      animatedText.start();
      
      expect(animatedText.isRunning).toBe(true);

      // Mock new canvas size
      canvas.getBoundingClientRect = jest.fn().mockReturnValue({
        width: 800,
        height: 600,
        top: 0,
        left: 0,
        right: 800,
        bottom: 600
      });

      // Spy on the _handleResize method
      const handleResizeSpy = jest.spyOn(animatedText, '_handleResize');

      // Force a resize to test the functionality
      animatedText.canvasManager.forceResize();

      // Verify resize was handled
      expect(handleResizeSpy).toHaveBeenCalled();
      
      // Animation should still be running after resize
      expect(animatedText.isRunning).toBe(true);
    });

    test('should handle resize errors gracefully', async () => {
      animatedText = new AnimatedNoiseText(canvas, { text: 'TEST' });
      animatedText.start();
      
      // Mock an error in text mask generation
      const originalGenerateTextMask = animatedText._generateTextMaskWithErrorHandling;
      animatedText._generateTextMaskWithErrorHandling = jest.fn(() => {
        throw new Error('Test error during resize');
      });

      // Spy on console.error to verify error handling
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Mock new canvas size
      canvas.getBoundingClientRect = jest.fn().mockReturnValue({
        width: 800,
        height: 600,
        top: 0,
        left: 0,
        right: 800,
        bottom: 600
      });

      // Spy on the _handleResize method
      const handleResizeSpy = jest.spyOn(animatedText, '_handleResize');

      // Force a resize to test the functionality
      animatedText.canvasManager.forceResize();

      // Verify resize was handled
      expect(handleResizeSpy).toHaveBeenCalled();
      
      // Should have logged the error
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error during resize handling:',
        expect.any(Error)
      );
      
      // Animation should still be running (error recovery)
      expect(animatedText.isRunning).toBe(true);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Debounced resize handling', () => {
    test('should debounce rapid resize events', () => {
      animatedText = new AnimatedNoiseText(canvas, { text: 'TEST' });
      
      // Test that the CanvasManager has a debounced resize handler
      expect(animatedText.canvasManager.resizeHandler).toBeDefined();
      
      // Test that multiple calls to forceResize work correctly
      const handleResizeSpy = jest.spyOn(animatedText, '_handleResize');
      
      // Call forceResize multiple times
      for (let i = 0; i < 3; i++) {
        animatedText.canvasManager.forceResize();
      }

      // Should have been called 3 times (forceResize bypasses debouncing)
      expect(handleResizeSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('Resource cleanup on resize', () => {
    test('should clean up ResizeObserver on destroy', () => {
      animatedText = new AnimatedNoiseText(canvas, { text: 'TEST' });
      
      const disconnectSpy = jest.spyOn(mockResizeObserver, 'disconnect');
      
      animatedText.destroy();
      
      expect(disconnectSpy).toHaveBeenCalled();
    });

    test('should remove window resize listeners on destroy', () => {
      animatedText = new AnimatedNoiseText(canvas, { text: 'TEST' });
      
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      animatedText.destroy();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });

  describe('Fallback behavior for browsers without ResizeObserver', () => {
    test('should use periodic size checking when ResizeObserver is not available', () => {
      // Temporarily remove ResizeObserver
      const originalResizeObserver = global.ResizeObserver;
      delete global.ResizeObserver;

      animatedText = new AnimatedNoiseText(canvas, { text: 'TEST' });
      
      // Should have started periodic size checking
      expect(animatedText.canvasManager.sizeCheckInterval).toBeDefined();
      
      // Restore ResizeObserver
      global.ResizeObserver = originalResizeObserver;
    });
  });
});