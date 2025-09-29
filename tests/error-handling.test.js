/**
 * Comprehensive Error Handling Tests
 * Tests for all error handling scenarios in the AnimatedNoiseText library
 */

import AnimatedNoiseText from '../src/index.js';
import CanvasManager from '../src/components/CanvasManager.js';
import NoiseGenerator from '../src/components/NoiseGenerator.js';
import TextRenderer from '../src/components/TextRenderer.js';
import AnimationController from '../src/components/AnimationController.js';
import ConfigManager from '../src/components/ConfigManager.js';

// Mock canvas and context for testing
const createMockCanvas = (width = 100, height = 100, shouldFailContext = false) => {
  const mockContext = {
    scale: jest.fn(),
    clearRect: jest.fn(),
    fillRect: jest.fn(),
    fillText: jest.fn(),
    measureText: jest.fn(() => ({ width: 50 })),
    drawImage: jest.fn(),
    getImageData: jest.fn(() => ({
      data: new Uint8ClampedArray(width * height * 4),
      width,
      height
    })),
    save: jest.fn(),
    restore: jest.fn(),
    setTransform: jest.fn(),
    imageSmoothingEnabled: false,
    fillStyle: '#000',
    globalCompositeOperation: 'source-over'
  };

  const canvas = {
    width,
    height,
    style: {},
    getBoundingClientRect: () => ({ width, height, left: 0, top: 0 }),
    getContext: jest.fn(() => shouldFailContext ? null : mockContext),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    parentNode: document.body
  };
  
  // Make it instanceof HTMLCanvasElement
  Object.setPrototypeOf(canvas, HTMLCanvasElement.prototype);
  
  return canvas;
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

describe('AnimatedNoiseText Constructor Error Handling', () => {
  test('should throw error for null canvas', () => {
    expect(() => {
      new AnimatedNoiseText(null);
    }).toThrow('AnimatedNoiseText constructor requires a canvas element as the first parameter. Received: null');
  });

  test('should throw error for undefined canvas', () => {
    expect(() => {
      new AnimatedNoiseText(undefined);
    }).toThrow('AnimatedNoiseText constructor requires a canvas element as the first parameter. Received: undefined');
  });

  test('should throw error for non-canvas element', () => {
    const div = document.createElement('div');
    expect(() => {
      new AnimatedNoiseText(div);
    }).toThrow(/AnimatedNoiseText requires an HTMLCanvasElement. Received: HTMLDivElement/);
  });

  test('should throw error for invalid options type', () => {
    const canvas = createMockCanvas();
    expect(() => {
      new AnimatedNoiseText(canvas, 'invalid');
    }).toThrow(/AnimatedNoiseText options must be an object or undefined. Received: string/);
  });

  test('should handle canvas context failure', () => {
    const canvas = createMockCanvas();
    canvas.getContext = jest.fn(() => null);
    
    expect(() => {
      new AnimatedNoiseText(canvas);
    }).toThrow(/Canvas context validation failed.*Failed to get 2D rendering context/);
  });

  test('should warn about unattached canvas', () => {
    const canvas = createMockCanvas();
    canvas.parentNode = null;
    
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    new AnimatedNoiseText(canvas);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Canvas element is not attached to the DOM')
    );
    
    consoleSpy.mockRestore();
  });

  test('should warn about zero-dimension canvas', () => {
    const canvas = createMockCanvas(0, 0);
    
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    new AnimatedNoiseText(canvas);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Canvas has zero dimensions')
    );
    
    consoleSpy.mockRestore();
  });
});

describe('AnimatedNoiseText Runtime Error Handling', () => {
  let canvas, instance;

  beforeEach(() => {
    canvas = createMockCanvas();
    instance = new AnimatedNoiseText(canvas);
  });

  afterEach(() => {
    if (instance && !instance.isDestroyed) {
      instance.destroy();
    }
  });

  test('should handle start on destroyed instance', () => {
    instance.destroy();
    
    expect(() => {
      instance.start();
    }).toThrow('Cannot start animation on destroyed instance');
  });

  test('should handle setText on destroyed instance', () => {
    instance.destroy();
    
    expect(() => {
      instance.setText('test');
    }).toThrow('Cannot set text on destroyed instance');
  });

  test('should handle updateConfig on destroyed instance', () => {
    instance.destroy();
    
    expect(() => {
      instance.updateConfig({ text: 'test' });
    }).toThrow('Cannot update config on destroyed instance');
  });

  test('should provide error status information', () => {
    const errorStatus = instance.getErrorStatus();
    
    expect(errorStatus).toHaveProperty('initializationErrors');
    expect(errorStatus).toHaveProperty('runtimeErrors');
    expect(errorStatus).toHaveProperty('errorRecoveryAttempts');
    expect(errorStatus).toHaveProperty('hasErrors');
    expect(Array.isArray(errorStatus.initializationErrors)).toBe(true);
    expect(Array.isArray(errorStatus.runtimeErrors)).toBe(true);
  });

  test('should clear error history', () => {
    // Add some errors
    instance.initializationErrors.push('test error');
    instance.runtimeErrors.push('runtime error');
    instance.errorRecoveryAttempts = 2;
    
    instance.clearErrorHistory();
    
    const errorStatus = instance.getErrorStatus();
    expect(errorStatus.initializationErrors).toHaveLength(0);
    expect(errorStatus.runtimeErrors).toHaveLength(0);
    expect(errorStatus.errorRecoveryAttempts).toBe(0);
  });
});

describe('CanvasManager Error Handling', () => {
  test('should throw error for null canvas', () => {
    expect(() => {
      new CanvasManager(null);
    }).toThrow('CanvasManager: canvas parameter is required. Received: null');
  });

  test('should throw error for non-canvas element', () => {
    const div = document.createElement('div');
    expect(() => {
      new CanvasManager(div);
    }).toThrow(/CanvasManager: Expected HTMLCanvasElement, received: HTMLDivElement/);
  });

  test('should handle context initialization failure', () => {
    const canvas = createMockCanvas();
    canvas.getContext = jest.fn(() => null);
    
    expect(() => {
      new CanvasManager(canvas);
    }).toThrow(/Canvas context initialization failed.*Failed to get 2D rendering context/);
  });

  test('should handle invalid canvas dimensions', () => {
    const canvas = createMockCanvas(-1, -1);
    
    expect(() => {
      new CanvasManager(canvas);
    }).toThrow('CanvasManager: Canvas has invalid dimensions');
  });

  test('should warn about unattached canvas', () => {
    const canvas = createMockCanvas();
    canvas.parentNode = null;
    
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    new CanvasManager(canvas);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Canvas is not attached to DOM')
    );
    
    consoleSpy.mockRestore();
  });
});

describe('NoiseGenerator Error Handling', () => {
  let generator;

  beforeEach(() => {
    generator = new NoiseGenerator(2);
  });

  test('should handle invalid width/height in createNoiseCanvas', () => {
    expect(() => {
      generator.createNoiseCanvas('invalid', 100);
    }).toThrow(/width and height must be numbers.*width=string/);

    expect(() => {
      generator.createNoiseCanvas(0, 100);
    }).toThrow(/width and height must be positive.*width=0/);

    expect(() => {
      generator.createNoiseCanvas(Infinity, 100);
    }).toThrow(/width and height must be finite numbers.*width=Infinity/);

    expect(() => {
      generator.createNoiseCanvas(10000, 10000);
    }).toThrow(/dimensions too large.*10000x10000/);
  });

  test('should handle invalid context in renderDirectNoise', () => {
    expect(() => {
      generator.renderDirectNoise(null, 100, 100);
    }).toThrow(/Invalid canvas context provided/);

    expect(() => {
      generator.renderDirectNoise({}, 100, 100);
    }).toThrow(/Invalid canvas context provided/);
  });

  test('should handle invalid dimensions in renderDirectNoise', () => {
    const mockCtx = { fillRect: jest.fn() };
    
    expect(() => {
      generator.renderDirectNoise(mockCtx, 'invalid', 100);
    }).toThrow(/width and height must be numbers/);

    expect(() => {
      generator.renderDirectNoise(mockCtx, -1, 100);
    }).toThrow(/width and height must be positive/);
  });

  test('should handle invalid cell size in setCellSize', () => {
    expect(() => {
      generator.setCellSize(null);
    }).toThrow(/Cell size cannot be null or undefined/);

    expect(() => {
      generator.setCellSize('invalid');
    }).toThrow(/Cell size must be a number.*string/);

    expect(() => {
      generator.setCellSize(-1);
    }).toThrow(/Cell size must be positive.*-1/);

    expect(() => {
      generator.setCellSize(Infinity);
    }).toThrow(/Cell size must be a finite number.*Infinity/);

    expect(() => {
      generator.setCellSize(200);
    }).toThrow(/Cell size too large.*200/);
  });
});

describe('TextRenderer Error Handling', () => {
  let renderer;

  beforeEach(() => {
    renderer = new TextRenderer();
  });

  test('should handle invalid inputs in createPixelatedTextMask', () => {
    // TextRenderer now catches errors and returns fallback masks instead of throwing
    // So we test that it returns a valid canvas for invalid inputs
    
    const result1 = renderer.createPixelatedTextMask('test', 'invalid', 100, 100);
    expect(result1).toBeInstanceOf(HTMLCanvasElement);
    expect(result1.width).toBeGreaterThan(0);
    expect(result1.height).toBeGreaterThan(0);

    const result2 = renderer.createPixelatedTextMask('test', -1, 100, 100);
    expect(result2).toBeInstanceOf(HTMLCanvasElement);

    const result3 = renderer.createPixelatedTextMask('test', 100, 100, 100);
    expect(result3).toBeInstanceOf(HTMLCanvasElement);

    const result4 = renderer.createPixelatedTextMask('test', 2, 'invalid', 100);
    expect(result4).toBeInstanceOf(HTMLCanvasElement);

    const result5 = renderer.createPixelatedTextMask('test', 2, -1, 100);
    expect(result5).toBeInstanceOf(HTMLCanvasElement);

    const result6 = renderer.createPixelatedTextMask('test', 2, 10000, 10000);
    expect(result6).toBeInstanceOf(HTMLCanvasElement);
  });

  test('should handle empty or invalid text gracefully', () => {
    const result1 = renderer.createPixelatedTextMask('', 2, 100, 100);
    expect(result1).toBeInstanceOf(HTMLCanvasElement);
    expect(result1.width).toBe(2);
    expect(result1.height).toBe(2);

    const result2 = renderer.createPixelatedTextMask(null, 2, 100, 100);
    expect(result2).toBeInstanceOf(HTMLCanvasElement);

    const result3 = renderer.createPixelatedTextMask(undefined, 2, 100, 100);
    expect(result3).toBeInstanceOf(HTMLCanvasElement);
  });

  test('should handle very long text by truncating', () => {
    const longText = 'a'.repeat(2000);
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    const result = renderer.createPixelatedTextMask(longText, 2, 100, 100);
    
    expect(result).toBeInstanceOf(HTMLCanvasElement);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Text truncated to 1000 characters')
    );
    
    consoleSpy.mockRestore();
  });
});

describe('AnimationController Error Handling', () => {
  let controller;

  beforeEach(() => {
    controller = new AnimationController(32);
  });

  afterEach(() => {
    if (controller) {
      controller.destroy();
    }
  });

  test('should handle invalid callback in start', () => {
    expect(() => {
      controller.start(null);
    }).toThrow(/Animation callback is required/);

    expect(() => {
      controller.start('invalid');
    }).toThrow(/Animation callback must be a function.*string/);
  });

  test('should handle invalid step interval in setStepInterval', () => {
    expect(() => {
      controller.setStepInterval('invalid');
    }).toThrow(/Step interval must be a positive number/);

    expect(() => {
      controller.setStepInterval(-1);
    }).toThrow(/Step interval must be a positive number/);

    expect(() => {
      controller.setStepInterval(0);
    }).toThrow(/Step interval must be a positive number/);
  });

  test('should handle callback errors gracefully', () => {
    const errorCallback = () => {
      throw new Error('Callback error');
    };
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    controller.start(errorCallback);
    
    // Wait for animation frame
    return new Promise(resolve => {
      setTimeout(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Animation callback error:',
          'Callback error'
        );
        consoleSpy.mockRestore();
        resolve();
      }, 50);
    });
  });

  test('should continue animation despite callback errors', () => {
    let callCount = 0;
    const errorCallback = () => {
      callCount++;
      if (callCount === 1) {
        throw new Error('First call error');
      }
    };
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    controller.start(errorCallback);
    
    return new Promise(resolve => {
      setTimeout(() => {
        expect(callCount).toBeGreaterThan(1); // Should continue after error
        consoleSpy.mockRestore();
        resolve();
      }, 100);
    });
  });
});

describe('ConfigManager Error Handling', () => {
  let configManager;

  beforeEach(() => {
    configManager = new ConfigManager();
  });

  test('should handle invalid configuration gracefully', () => {
    const result = configManager.createConfig('invalid');
    
    expect(result.config).toEqual(configManager.getDefaultConfig());
    expect(result.warnings).toHaveLength(0);
    expect(result.isValid).toBe(true);
  });

  test('should validate individual config values', () => {
    const validation1 = configManager.validateConfigValue('cellSize', 'invalid');
    expect(validation1.isValid).toBe(false);
    expect(validation1.error).toContain('Invalid type for cellSize');

    const validation2 = configManager.validateConfigValue('cellSize', -1);
    expect(validation2.isValid).toBe(false);
    expect(validation2.error).toContain('below minimum');

    const validation3 = configManager.validateConfigValue('cellSize', 100);
    expect(validation3.isValid).toBe(false);
    expect(validation3.error).toContain('above maximum');

    const validation4 = configManager.validateConfigValue('unknownKey', 'value');
    expect(validation4.isValid).toBe(false);
    expect(validation4.error).toContain('Unknown configuration key');
  });

  test('should handle null fontSize correctly', () => {
    const validation = configManager.validateConfigValue('fontSize', null);
    expect(validation.isValid).toBe(true);
    expect(validation.sanitizedValue).toBe(null);
  });

  test('should merge with defaults in strict mode', () => {
    expect(() => {
      configManager.mergeWithDefaults('invalid', true);
    }).toThrow(/Configuration options must be an object/);

    expect(() => {
      configManager.mergeWithDefaults({ cellSize: 'invalid' }, true);
    }).toThrow(/Configuration validation failed/);
  });
});

describe('Error Recovery Mechanisms', () => {
  let canvas, instance;

  beforeEach(() => {
    canvas = createMockCanvas();
    instance = new AnimatedNoiseText(canvas);
  });

  afterEach(() => {
    if (instance && !instance.isDestroyed) {
      instance.destroy();
    }
  });

  test('should attempt recovery on animation start failure', () => {
    // Mock AnimationController to fail initially
    const originalController = instance.animationController;
    instance.animationController = null;
    
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // This should trigger recovery attempt
    expect(() => {
      instance.start();
    }).toThrow(/Missing required components.*AnimationController/);
    
    consoleSpy.mockRestore();
  });

  test('should handle multiple consecutive render errors', () => {
    // Mock render method to always throw
    const originalRender = instance._renderFrameWithErrorHandling;
    instance._renderFrameWithErrorHandling = () => {
      throw new Error('Render error');
    };
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Simulate multiple render errors
    for (let i = 0; i < 6; i++) {
      instance._handleRenderError(new Error('Render error'));
    }
    
    expect(instance.isRunning).toBe(false);
    
    consoleSpy.mockRestore();
    instance._renderFrameWithErrorHandling = originalRender;
  });

  test('should create fallback resources on generation failure', () => {
    // Test fallback text mask creation
    const fallbackMask = instance._createFallbackTextMask();
    expect(fallbackMask).toBeInstanceOf(HTMLCanvasElement);
    expect(fallbackMask.width).toBeGreaterThan(0);
    expect(fallbackMask.height).toBeGreaterThan(0);

    // Test fallback noise canvas creation
    const fallbackNoise = instance._createFallbackNoiseCanvas();
    expect(fallbackNoise).toBeInstanceOf(HTMLCanvasElement);
    expect(fallbackNoise.width).toBeGreaterThan(0);
    expect(fallbackNoise.height).toBeGreaterThan(0);
  });
});

describe('Memory Management and Cleanup', () => {
  test('should clean up resources properly on destroy', () => {
    const canvas = createMockCanvas();
    const instance = new AnimatedNoiseText(canvas);
    
    // Verify resources are created
    expect(instance.canvasManager).toBeDefined();
    expect(instance.noiseGenerator).toBeDefined();
    expect(instance.textRenderer).toBeDefined();
    expect(instance.animationController).toBeDefined();
    
    instance.destroy();
    
    // Verify cleanup
    expect(instance.isDestroyed).toBe(true);
    expect(instance.canvasManager).toBeNull();
    expect(instance.noiseGenerator).toBeNull();
    expect(instance.textRenderer).toBeNull();
    expect(instance.animationController).toBeNull();
  });

  test('should handle cleanup errors gracefully', () => {
    const canvas = createMockCanvas();
    const instance = new AnimatedNoiseText(canvas);
    
    // Mock component cleanup to throw error
    instance.canvasManager.cleanup = () => {
      throw new Error('Cleanup error');
    };
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Should not throw despite cleanup error
    expect(() => {
      instance.destroy();
    }).not.toThrow();
    
    expect(instance.isDestroyed).toBe(true);
    
    consoleSpy.mockRestore();
  });
});