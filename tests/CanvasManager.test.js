import CanvasManager from '../src/components/CanvasManager.js';

// Mock window globally
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

// Mock canvas and context
const createMockCanvas = () => {
  const mockContext = {
    scale: jest.fn(),
    clearRect: jest.fn()
  };
  
  const canvas = {
    width: 0,
    height: 0,
    style: {},
    getBoundingClientRect: jest.fn(() => ({
      width: 800,
      height: 600
    })),
    getContext: jest.fn(() => mockContext)
  };
  
  // Make it pass instanceof check
  Object.setPrototypeOf(canvas, HTMLCanvasElement.prototype);
  
  return canvas;
};

describe('CanvasManager', () => {
  let canvas;
  let canvasManager;
  
  beforeEach(() => {
    canvas = createMockCanvas();
    
    // Reset mocks
    jest.clearAllMocks();
    mockAddEventListener.mockClear();
    mockRemoveEventListener.mockClear();
  });

  afterEach(() => {
    if (canvasManager) {
      canvasManager.cleanup();
    }
  });

  describe('Constructor', () => {
    test('should create CanvasManager with valid canvas', () => {
      canvasManager = new CanvasManager(canvas);
      
      expect(canvasManager.canvas).toBe(canvas);
      expect(canvasManager.ctx).toEqual(canvas.getContext('2d'));
      expect(canvasManager.isDestroyed).toBe(false);
    });

    test('should throw error with null canvas', () => {
      expect(() => {
        new CanvasManager(null);
      }).toThrow('CanvasManager requires a valid HTMLCanvasElement');
    });

    test('should throw error with non-canvas element', () => {
      const div = document.createElement('div');
      expect(() => {
        new CanvasManager(div);
      }).toThrow('CanvasManager requires a valid HTMLCanvasElement');
    });

    test('should throw error when canvas context fails', () => {
      const badCanvas = createMockCanvas();
      badCanvas.getContext = jest.fn(() => null);
      
      expect(() => {
        new CanvasManager(badCanvas);
      }).toThrow('Failed to get 2D rendering context from canvas');
    });
  });

  describe('Canvas Setup', () => {
    beforeEach(() => {
      // Ensure window mock is set up before creating CanvasManager
      global.window.devicePixelRatio = 2;
      canvasManager = new CanvasManager(canvas);
    });

    test('should setup canvas with device pixel ratio', () => {
      expect(canvas.width).toBe(1600); // 800 * 2 (dpr)
      expect(canvas.height).toBe(1200); // 600 * 2 (dpr)
      expect(canvas.style.width).toBe('800px');
      expect(canvas.style.height).toBe('600px');
      expect(canvasManager.ctx.scale).toHaveBeenCalledWith(2, 2);
    });

    test('should store dimensions correctly', () => {
      expect(canvasManager.displayWidth).toBe(800);
      expect(canvasManager.displayHeight).toBe(600);
      expect(canvasManager.actualWidth).toBe(1600);
      expect(canvasManager.actualHeight).toBe(1200);
      expect(canvasManager.devicePixelRatio).toBe(2);
    });

    test('should handle missing devicePixelRatio', () => {
      global.window.devicePixelRatio = undefined;
      
      const newCanvas = createMockCanvas();
      const newManager = new CanvasManager(newCanvas);
      
      expect(newManager.devicePixelRatio).toBe(1);
      
      newManager.cleanup();
    });
  });

  describe('Device Pixel Ratio', () => {
    beforeEach(() => {
      global.window.devicePixelRatio = 2;
      canvasManager = new CanvasManager(canvas);
    });

    test('should get device pixel ratio from window', () => {
      expect(canvasManager.getDevicePixelRatio()).toBe(2);
    });

    test('should fallback to 1 when devicePixelRatio is undefined', () => {
      global.window.devicePixelRatio = undefined;
      expect(canvasManager.getDevicePixelRatio()).toBe(1);
    });
  });

  describe('Resize Handling', () => {
    beforeEach(() => {
      global.window.devicePixelRatio = 2;
      canvasManager = new CanvasManager(canvas);
    });

    test('should setup resize event listener', () => {
      const callback = jest.fn();
      canvasManager.handleResize(callback);
      
      expect(mockAddEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
      expect(canvasManager.resizeCallback).toBe(callback);
    });

    test('should remove existing resize handler before adding new one', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      canvasManager.handleResize(callback1);
      const firstHandler = canvasManager.resizeHandler;
      
      canvasManager.handleResize(callback2);
      
      expect(mockRemoveEventListener).toHaveBeenCalledWith('resize', firstHandler);
      expect(mockAddEventListener).toHaveBeenCalledTimes(2);
    });

    test('should debounce resize events', (done) => {
      const callback = jest.fn();
      canvasManager.handleResize(callback);
      
      // Simulate multiple rapid resize events
      const resizeHandler = canvasManager.resizeHandler;
      resizeHandler();
      resizeHandler();
      resizeHandler();
      
      // Callback should not be called immediately
      expect(callback).not.toHaveBeenCalled();
      
      // Wait for debounce timeout
      setTimeout(() => {
        expect(callback).toHaveBeenCalledTimes(1);
        done();
      }, 150);
    });

    test('should not handle resize when destroyed', () => {
      const callback = jest.fn();
      canvasManager.cleanup();
      canvasManager.handleResize(callback);
      
      expect(mockAddEventListener).not.toHaveBeenCalled();
    });
  });

  describe('Canvas Dimensions', () => {
    beforeEach(() => {
      global.window.devicePixelRatio = 2;
      canvasManager = new CanvasManager(canvas);
    });

    test('should return correct canvas dimensions', () => {
      const dimensions = canvasManager.getCanvasDimensions();
      
      expect(dimensions).toEqual({
        displayWidth: 800,
        displayHeight: 600,
        actualWidth: 1600,
        actualHeight: 1200,
        devicePixelRatio: 2
      });
    });
  });

  describe('Getters', () => {
    beforeEach(() => {
      global.window.devicePixelRatio = 2;
      canvasManager = new CanvasManager(canvas);
    });

    test('should return canvas context', () => {
      expect(canvasManager.getContext()).toBe(canvasManager.ctx);
    });

    test('should return canvas element', () => {
      expect(canvasManager.getCanvas()).toBe(canvas);
    });
  });

  describe('Resize Detection', () => {
    beforeEach(() => {
      global.window.devicePixelRatio = 2;
      canvasManager = new CanvasManager(canvas);
    });

    test('should detect when resize is needed - size change', () => {
      canvas.getBoundingClientRect.mockReturnValue({
        width: 900, // Changed from 800
        height: 600
      });
      
      expect(canvasManager.needsResize()).toBe(true);
    });

    test('should detect when resize is needed - device pixel ratio change', () => {
      global.window.devicePixelRatio = 3; // Changed from 2
      
      expect(canvasManager.needsResize()).toBe(true);
    });

    test('should return false when no resize needed', () => {
      expect(canvasManager.needsResize()).toBe(false);
    });

    test('should return false when destroyed', () => {
      canvasManager.cleanup();
      expect(canvasManager.needsResize()).toBe(false);
    });
  });

  describe('Force Resize', () => {
    beforeEach(() => {
      global.window.devicePixelRatio = 2;
      canvasManager = new CanvasManager(canvas);
    });

    test('should force resize and call callback', () => {
      const callback = jest.fn();
      canvasManager.handleResize(callback);
      
      // Change canvas size
      canvas.getBoundingClientRect.mockReturnValue({
        width: 900,
        height: 700
      });
      
      canvasManager.forceResize();
      
      expect(canvas.width).toBe(1800); // 900 * 2
      expect(canvas.height).toBe(1400); // 700 * 2
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        displayWidth: 900,
        displayHeight: 700
      }));
    });

    test('should not resize when destroyed', () => {
      const callback = jest.fn();
      canvasManager.handleResize(callback);
      canvasManager.cleanup();
      
      canvasManager.forceResize();
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    beforeEach(() => {
      global.window.devicePixelRatio = 2;
      canvasManager = new CanvasManager(canvas);
    });

    test('should cleanup resources and event listeners', () => {
      const callback = jest.fn();
      canvasManager.handleResize(callback);
      const originalHandler = canvasManager.resizeHandler;
      
      canvasManager.cleanup();
      
      expect(canvasManager.isDestroyed).toBe(true);
      expect(mockRemoveEventListener).toHaveBeenCalledWith('resize', originalHandler);
      expect(canvasManager.resizeHandler).toBe(null);
      expect(canvasManager.resizeCallback).toBe(null);
      expect(canvasManager.ctx.clearRect).toHaveBeenCalled();
    });

    test('should handle cleanup when no resize handler exists', () => {
      canvasManager.cleanup();
      
      expect(canvasManager.isDestroyed).toBe(true);
      expect(mockRemoveEventListener).not.toHaveBeenCalled();
    });
  });
});