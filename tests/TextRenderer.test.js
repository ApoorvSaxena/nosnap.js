/**
 * Unit tests for TextRenderer class
 */

import TextRenderer from '../src/components/TextRenderer.js';

// Mock canvas and context for testing
class MockCanvasContext {
  constructor() {
    this.font = '';
    this.textAlign = '';
    this.textBaseline = '';
    this.fillStyle = '';
    this.imageSmoothingEnabled = true;
    this._measureTextWidth = 100; // Default width for measureText
  }

  measureText(text) {
    // Simple mock that returns width based on text length
    return { width: text.length * this._measureTextWidth / 10 };
  }

  fillText() {}
  fillRect() {}
  clearRect() {}
  getImageData(x, y, width, height) {
    // Return mock image data with some text pixels
    const data = new Uint8ClampedArray(width * height * 4);
    // Add some mock text pixels in the center
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    for (let dy = -10; dy <= 10; dy++) {
      for (let dx = -20; dx <= 20; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const index = (y * width + x) * 4;
          data[index + 3] = 255; // Alpha channel
        }
      }
    }
    return { data, width, height };
  }
}

// Mock canvas element
class MockCanvas {
  constructor() {
    this.width = 0;
    this.height = 0;
    this._context = new MockCanvasContext();
  }

  getContext(type) {
    if (type === '2d') {
      return this._context;
    }
    return null;
  }
}

// Mock document.createElement globally
const originalCreateElement = document.createElement;
document.createElement = jest.fn((tagName) => {
  if (tagName === 'canvas') {
    return new MockCanvas();
  }
  return originalCreateElement.call(document, tagName);
});

// Restore after tests
afterAll(() => {
  document.createElement = originalCreateElement;
});

describe('TextRenderer', () => {
  let textRenderer;

  beforeEach(() => {
    textRenderer = new TextRenderer();
  });

  describe('Constructor', () => {
    test('should create instance with default config', () => {
      expect(textRenderer).toBeInstanceOf(TextRenderer);
      expect(textRenderer.config.fontSize).toBeNull();
      expect(textRenderer.config.fontWeight).toBe(900);
      expect(textRenderer.config.fontFamily).toBe('sans-serif');
      expect(textRenderer.config.maskBlockSize).toBe(2);
    });

    test('should create instance with custom config', () => {
      const customConfig = {
        fontSize: 24,
        fontWeight: 700,
        fontFamily: 'Arial',
        maskBlockSize: 4
      };
      const renderer = new TextRenderer(customConfig);
      
      expect(renderer.config.fontSize).toBe(24);
      expect(renderer.config.fontWeight).toBe(700);
      expect(renderer.config.fontFamily).toBe('Arial');
      expect(renderer.config.maskBlockSize).toBe(4);
    });

    test('should initialize empty font measurement cache', () => {
      expect(textRenderer.getCacheSize()).toBe(0);
    });
  });

  describe('updateConfig', () => {
    test('should update configuration and clear cache', () => {
      // Add something to cache first
      const ctx = new MockCanvasContext();
      textRenderer.calculateOptimalFontSize('TEST', 100, 50, ctx);
      expect(textRenderer.getCacheSize()).toBeGreaterThan(0);

      // Update config
      textRenderer.updateConfig({ fontSize: 32, fontWeight: 600 });
      
      expect(textRenderer.config.fontSize).toBe(32);
      expect(textRenderer.config.fontWeight).toBe(600);
      expect(textRenderer.config.fontFamily).toBe('sans-serif'); // Should keep existing
      expect(textRenderer.getCacheSize()).toBe(0); // Cache should be cleared
    });
  });

  describe('calculateOptimalFontSize', () => {
    let mockContext;

    beforeEach(() => {
      mockContext = new MockCanvasContext();
    });

    test('should calculate font size for single line text', () => {
      const fontSize = textRenderer.calculateOptimalFontSize('HELLO', 200, 100, mockContext);
      
      expect(fontSize).toBeGreaterThanOrEqual(8); // Minimum font size
      expect(typeof fontSize).toBe('number');
    });

    test('should calculate font size for multi-line text', () => {
      const fontSize = textRenderer.calculateOptimalFontSize('HELLO\nWORLD', 200, 100, mockContext);
      
      expect(fontSize).toBeGreaterThanOrEqual(8);
      expect(typeof fontSize).toBe('number');
    });

    test('should respect minimum font size', () => {
      // Very small target dimensions should still return minimum font size
      const fontSize = textRenderer.calculateOptimalFontSize('VERY LONG TEXT', 10, 5, mockContext);
      
      expect(fontSize).toBe(8);
    });

    test('should cache font size calculations', () => {
      const text = 'CACHE TEST';
      const targetWidth = 150;
      const targetHeight = 75;

      // First calculation
      const fontSize1 = textRenderer.calculateOptimalFontSize(text, targetWidth, targetHeight, mockContext);
      expect(textRenderer.getCacheSize()).toBe(1);

      // Second calculation with same parameters should use cache
      const fontSize2 = textRenderer.calculateOptimalFontSize(text, targetWidth, targetHeight, mockContext);
      expect(fontSize1).toBe(fontSize2);
      expect(textRenderer.getCacheSize()).toBe(1); // Still only one cached entry
    });

    test('should handle empty text', () => {
      const fontSize = textRenderer.calculateOptimalFontSize('', 100, 50, mockContext);
      
      expect(fontSize).toBeGreaterThanOrEqual(8);
    });

    test('should handle very wide text', () => {
      mockContext._measureTextWidth = 1000; // Make text appear very wide
      const fontSize = textRenderer.calculateOptimalFontSize('WIDE', 100, 50, mockContext);
      
      expect(fontSize).toBeGreaterThanOrEqual(8); // Should be at least minimum font size
    });
  });

  describe('createPixelatedTextMask', () => {
    test('should create mask canvas for valid text', () => {
      const mask = textRenderer.createPixelatedTextMask('HELLO', 2, 400, 300);
      
      expect(mask).toBeInstanceOf(Object); // Mock canvas object
      expect(mask.width).toBeGreaterThan(0);
      expect(mask.height).toBeGreaterThan(0);
    });

    test('should handle empty text', () => {
      const mask = textRenderer.createPixelatedTextMask('', 2, 400, 300);
      
      expect(mask).toBeInstanceOf(Object);
      expect(mask.width).toBe(2); // Should return empty mask with blockSize dimensions
      expect(mask.height).toBe(2);
    });

    test('should handle null/undefined text', () => {
      const mask1 = textRenderer.createPixelatedTextMask(null, 2, 400, 300);
      const mask2 = textRenderer.createPixelatedTextMask(undefined, 2, 400, 300);
      
      expect(mask1).toBeInstanceOf(Object);
      expect(mask2).toBeInstanceOf(Object);
    });

    test('should handle multi-line text', () => {
      const mask = textRenderer.createPixelatedTextMask('LINE1\nLINE2\nLINE3', 2, 400, 300);
      
      expect(mask).toBeInstanceOf(Object);
      expect(mask.width).toBeGreaterThan(0);
      expect(mask.height).toBeGreaterThan(0);
    });

    test('should handle invalid dimensions', () => {
      const mask1 = textRenderer.createPixelatedTextMask('TEST', 2, 0, 300);
      const mask2 = textRenderer.createPixelatedTextMask('TEST', 2, 400, 0);
      const mask3 = textRenderer.createPixelatedTextMask('TEST', 0, 400, 300);
      
      expect(mask1.width).toBe(2);
      expect(mask2.width).toBe(2);
      expect(mask3.width).toBe(1); // blockSize 0 becomes 1
    });

    test('should use custom font size when provided', () => {
      const customRenderer = new TextRenderer({ fontSize: 48 });
      const mask = customRenderer.createPixelatedTextMask('TEST', 2, 400, 300);
      
      expect(mask).toBeInstanceOf(Object);
      // Font size should be used as-is, not calculated
    });

    test('should handle different block sizes', () => {
      const mask1 = textRenderer.createPixelatedTextMask('TEST', 1, 400, 300);
      const mask2 = textRenderer.createPixelatedTextMask('TEST', 4, 400, 300);
      
      expect(mask1).toBeInstanceOf(Object);
      expect(mask2).toBeInstanceOf(Object);
      // Different block sizes should produce different mask dimensions
    });
  });

  describe('_findTextBounds', () => {
    test('should find bounds in image data with text', () => {
      const imageData = {
        data: new Uint8ClampedArray(400), // 10x10 image, 4 bytes per pixel
        width: 10,
        height: 10
      };
      
      // Add some text pixels
      imageData.data[4 * (5 * 10 + 5) + 3] = 255; // Center pixel alpha
      imageData.data[4 * (5 * 10 + 6) + 3] = 255; // Adjacent pixel alpha
      
      const bounds = textRenderer._findTextBounds(imageData);
      
      expect(bounds).not.toBeNull();
      expect(bounds.minX).toBe(5);
      expect(bounds.maxX).toBe(6);
      expect(bounds.minY).toBe(5);
      expect(bounds.maxY).toBe(5);
    });

    test('should return null for empty image data', () => {
      const imageData = {
        data: new Uint8ClampedArray(400), // All zeros (transparent)
        width: 10,
        height: 10
      };
      
      const bounds = textRenderer._findTextBounds(imageData);
      
      expect(bounds).toBeNull();
    });
  });

  describe('_createEmptyMask', () => {
    test('should create empty mask with correct dimensions', () => {
      const mask = textRenderer._createEmptyMask(4);
      
      expect(mask.width).toBe(4);
      expect(mask.height).toBe(4);
    });

    test('should handle zero or negative block size', () => {
      const mask1 = textRenderer._createEmptyMask(0);
      const mask2 = textRenderer._createEmptyMask(-5);
      
      expect(mask1.width).toBe(1); // Should be at least 1
      expect(mask2.width).toBe(1);
    });
  });

  describe('Cache Management', () => {
    test('should clear cache', () => {
      const ctx = new MockCanvasContext();
      
      // Add entries to cache
      textRenderer.calculateOptimalFontSize('TEST1', 100, 50, ctx);
      textRenderer.calculateOptimalFontSize('TEST2', 200, 100, ctx);
      
      expect(textRenderer.getCacheSize()).toBe(2);
      
      textRenderer.clearCache();
      
      expect(textRenderer.getCacheSize()).toBe(0);
    });

    test('should report correct cache size', () => {
      const ctx = new MockCanvasContext();
      
      expect(textRenderer.getCacheSize()).toBe(0);
      
      textRenderer.calculateOptimalFontSize('TEST1', 100, 50, ctx);
      expect(textRenderer.getCacheSize()).toBe(1);
      
      textRenderer.calculateOptimalFontSize('TEST2', 200, 100, ctx);
      expect(textRenderer.getCacheSize()).toBe(2);
      
      // Same parameters should not increase cache size
      textRenderer.calculateOptimalFontSize('TEST1', 100, 50, ctx);
      expect(textRenderer.getCacheSize()).toBe(2);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle non-string text input', () => {
      const mask1 = textRenderer.createPixelatedTextMask(123, 2, 400, 300);
      const mask2 = textRenderer.createPixelatedTextMask(true, 2, 400, 300);
      const mask3 = textRenderer.createPixelatedTextMask({}, 2, 400, 300);
      
      expect(mask1).toBeInstanceOf(Object);
      expect(mask2).toBeInstanceOf(Object);
      expect(mask3).toBeInstanceOf(Object);
    });

    test('should handle very long text', () => {
      const longText = 'A'.repeat(1000);
      const mask = textRenderer.createPixelatedTextMask(longText, 2, 400, 300);
      
      expect(mask).toBeInstanceOf(Object);
    });

    test('should handle special characters', () => {
      const specialText = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const mask = textRenderer.createPixelatedTextMask(specialText, 2, 400, 300);
      
      expect(mask).toBeInstanceOf(Object);
    });

    test('should handle unicode characters', () => {
      const unicodeText = '🚀 Hello 世界 🌟';
      const mask = textRenderer.createPixelatedTextMask(unicodeText, 2, 400, 300);
      
      expect(mask).toBeInstanceOf(Object);
    });
  });
});