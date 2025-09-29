import AnimationController from '../src/components/AnimationController.js';

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

describe('AnimationController', () => {
  let controller;
  let mockCallback;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AnimationController(32);
    mockCallback = jest.fn();
    
    // Reset performance.now mock
    let time = 0;
    mockPerformanceNow.mockImplementation(() => {
      time += 16; // Simulate 60fps
      return time;
    });
  });

  afterEach(() => {
    if (controller) {
      controller.stop();
    }
  });

  describe('Constructor', () => {
    test('should initialize with default step interval', () => {
      const defaultController = new AnimationController();
      expect(defaultController.stepMs).toBe(32);
      expect(defaultController.isRunning).toBe(false);
      expect(defaultController.isPaused).toBe(false);
      expect(defaultController.getCurrentOffset()).toBe(0);
    });

    test('should initialize with custom step interval', () => {
      const customController = new AnimationController(50);
      expect(customController.stepMs).toBe(50);
    });
  });

  describe('Animation Lifecycle', () => {
    test('should start animation with valid callback', () => {
      controller.start(mockCallback);
      
      expect(controller.isRunning).toBe(true);
      expect(controller.isPaused).toBe(false);
      expect(controller.isAnimationRunning()).toBe(true);
      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    test('should throw error when starting without callback', () => {
      expect(() => controller.start()).toThrow('Animation callback must be a function');
      expect(() => controller.start('not a function')).toThrow('Animation callback must be a function');
    });

    test('should stop animation and clean up', () => {
      controller.start(mockCallback);
      controller.animationId = 123; // Set after start to simulate running animation
      controller.stop();
      
      expect(controller.isRunning).toBe(false);
      expect(controller.isPaused).toBe(false);
      expect(controller.animationCallback).toBe(null);
      expect(global.cancelAnimationFrame).toHaveBeenCalledWith(123);
    });

    test('should pause animation', () => {
      controller.start(mockCallback);
      controller.pause();
      
      expect(controller.isRunning).toBe(true);
      expect(controller.isPaused).toBe(true);
      expect(controller.isAnimationRunning()).toBe(false);
      expect(controller.isAnimationPaused()).toBe(true);
    });

    test('should resume animation from pause', () => {
      controller.start(mockCallback);
      controller.pause();
      controller.resume();
      
      expect(controller.isRunning).toBe(true);
      expect(controller.isPaused).toBe(false);
      expect(controller.isAnimationRunning()).toBe(true);
      expect(controller.isAnimationPaused()).toBe(false);
    });

    test('should not resume if not running', () => {
      controller.resume();
      expect(controller.isAnimationRunning()).toBe(false);
    });

    test('should not pause if not running', () => {
      controller.pause();
      expect(controller.isPaused).toBe(false);
    });
  });

  describe('Timing Control', () => {
    test('should set step interval', () => {
      controller.setStepInterval(50);
      expect(controller.stepMs).toBe(50);
    });

    test('should throw error for invalid step interval', () => {
      expect(() => controller.setStepInterval(-1)).toThrow('Step interval must be a positive number');
      expect(() => controller.setStepInterval(0)).toThrow('Step interval must be a positive number');
      expect(() => controller.setStepInterval('invalid')).toThrow('Step interval must be a positive number');
    });
  });

  describe('Animation Offset Tracking', () => {
    test('should track animation offset', () => {
      expect(controller.getCurrentOffset()).toBe(0);
      
      // Simulate animation steps
      controller.animationOffset = 5;
      expect(controller.getCurrentOffset()).toBe(5);
    });

    test('should increment offset during animation', () => {
      // Set up timing to trigger animation step
      controller.lastFrameTime = 0;
      controller.accumulatedTime = 0;
      controller.stepMs = 32;
      controller.isRunning = true;
      controller.isPaused = false;
      controller.animationCallback = mockCallback;
      
      mockPerformanceNow.mockReturnValueOnce(50); // Simulate 50ms passed
      
      // Mock requestAnimationFrame to not recurse
      global.requestAnimationFrame.mockImplementation(() => 1);
      
      controller._animate();
      
      expect(controller.getCurrentOffset()).toBeGreaterThan(0);
      expect(mockCallback).toHaveBeenCalled();
    });
  });

  describe('Animation Loop', () => {
    test('should call animation callback with current offset', () => {
      controller.lastFrameTime = 0;
      controller.accumulatedTime = 0;
      controller.stepMs = 32;
      controller.isRunning = true;
      controller.isPaused = false;
      controller.animationCallback = mockCallback;
      
      mockPerformanceNow.mockReturnValueOnce(50); // Simulate 50ms passed
      global.requestAnimationFrame.mockImplementation(() => 1);

      controller._animate();

      expect(mockCallback).toHaveBeenCalledWith(expect.any(Number));
    });

    test('should not animate when stopped', () => {
      controller.isRunning = false;
      controller._animate();
      
      expect(global.requestAnimationFrame).not.toHaveBeenCalled();
    });

    test('should not animate when paused', () => {
      controller.isRunning = true;
      controller.isPaused = true;
      controller._animate();
      
      expect(global.requestAnimationFrame).not.toHaveBeenCalled();
    });

    test('should accumulate time correctly', () => {
      controller.lastFrameTime = 0;
      controller.accumulatedTime = 0;
      controller.stepMs = 32;
      controller.isRunning = true;
      controller.isPaused = false;
      controller.animationCallback = mockCallback;
      
      global.requestAnimationFrame.mockImplementation(() => 1);

      // First call - should not trigger callback yet (16ms < 32ms step)
      mockPerformanceNow.mockReturnValueOnce(16);
      controller._animate();
      expect(controller.accumulatedTime).toBe(16);

      // Second call - should trigger callback (32ms total >= 32ms step)
      mockPerformanceNow.mockReturnValueOnce(32);
      controller._animate();
      expect(controller.accumulatedTime).toBeLessThan(32);
    });
  });

  describe('State Management', () => {
    test('should maintain correct state during lifecycle', () => {
      // Mock requestAnimationFrame to not recurse
      global.requestAnimationFrame.mockImplementation(() => 1);
      
      // Initial state
      expect(controller.isAnimationRunning()).toBe(false);
      expect(controller.isAnimationPaused()).toBe(false);

      // After start
      controller.start(mockCallback);
      expect(controller.isAnimationRunning()).toBe(true);
      expect(controller.isAnimationPaused()).toBe(false);

      // After pause
      controller.pause();
      expect(controller.isAnimationRunning()).toBe(false);
      expect(controller.isAnimationPaused()).toBe(true);

      // After resume
      controller.resume();
      expect(controller.isAnimationRunning()).toBe(true);
      expect(controller.isAnimationPaused()).toBe(false);

      // After stop
      controller.stop();
      expect(controller.isAnimationRunning()).toBe(false);
      expect(controller.isAnimationPaused()).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing callback gracefully in animation loop', () => {
      controller.animationCallback = null;
      controller.isRunning = true;
      controller.isPaused = false;
      controller.lastFrameTime = 0;
      controller.accumulatedTime = 0;
      
      mockPerformanceNow.mockReturnValueOnce(50);
      global.requestAnimationFrame.mockImplementation(() => 1);
      
      expect(() => controller._animate()).not.toThrow();
    });

    test('should handle cleanup when animationId is null', () => {
      controller.animationId = null;
      expect(() => controller.stop()).not.toThrow();
    });
  });
});