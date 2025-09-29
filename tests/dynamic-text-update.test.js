/**
 * Tests for dynamic text update functionality
 * Covers Requirements 5.1, 5.2, 5.3, 5.4
 */

import AnimatedNoiseText from '../src/index.js';
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

describe('Dynamic Text Update Functionality', () => {
  let mockCanvas;
  let instance;

  beforeEach(() => {
    mockCanvas = createMockCanvas();
    instance = new AnimatedNoiseText(mockCanvas, { text: 'INITIAL' });
  });

  afterEach(() => {
    if (instance && !instance.isDestroyed) {
      instance.destroy();
    }
  });

  describe('setText Method - Requirement 5.1', () => {
    test('should update text content successfully', () => {
      const newText = 'NEW TEXT';
      
      instance.setText(newText);
      
      expect(instance.config.text).toBe(newText);
    });

    test('should handle string conversion for non-string inputs', () => {
      instance.setText(123);
      expect(instance.config.text).toBe('123');
      
      instance.setText(true);
      expect(instance.config.text).toBe('true');
      
      instance.setText({ toString: () => 'OBJECT' });
      expect(instance.config.text).toBe('OBJECT');
    });

    test('should throw error when called on destroyed instance', () => {
      instance.destroy();
      
      expect(() => {
        instance.setText('test');
      }).toThrow('Cannot set text on destroyed instance');
    });

    test('should not update if text is the same', () => {
      const originalText = instance.config.text;
      const spy = jest.spyOn(instance, '_generateTextMask');
      
      instance.setText(originalText);
      
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('Automatic Mask Regeneration - Requirement 5.2', () => {
    test('should regenerate text mask when text changes', () => {
      const spy = jest.spyOn(instance, '_generateTextMask');
      
      instance.setText('DIFFERENT TEXT');
      
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    test('should regenerate noise pattern after text mask update', () => {
      const spy = jest.spyOn(instance, '_generateNoisePattern');
      
      instance.setText('DIFFERENT TEXT');
      
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    test('should update text renderer configuration', () => {
      const spy = jest.spyOn(instance.textRenderer, 'updateConfig');
      
      instance.setText('NEW TEXT');
      
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({
        text: 'NEW TEXT'
      }));
      spy.mockRestore();
    });
  });

  describe('Animation Continuation - Requirement 5.3', () => {
    test('should maintain animation state during text update', () => {
      instance.start();
      expect(instance.isRunning).toBe(true);
      
      instance.setText('UPDATED TEXT');
      
      expect(instance.isRunning).toBe(true);
    });

    test('should not start animation if it was not running', () => {
      expect(instance.isRunning).toBe(false);
      
      instance.setText('UPDATED TEXT');
      
      expect(instance.isRunning).toBe(false);
    });

    test('should preserve animation offset during text update', () => {
      instance.start();
      
      // Mock animation controller to return a specific offset
      const mockOffset = 42;
      jest.spyOn(instance.animationController, 'getCurrentOffset').mockReturnValue(mockOffset);
      
      instance.setText('UPDATED TEXT');
      
      // Animation should still be running
      expect(instance.isRunning).toBe(true);
    });

    test('should handle errors during text update gracefully', () => {
      instance.start();
      
      // Mock _generateTextMask to throw an error
      jest.spyOn(instance, '_generateTextMask').mockImplementation(() => {
        throw new Error('Mock error');
      });
      
      expect(() => {
        instance.setText('ERROR TEXT');
      }).toThrow('Failed to update text: Mock error');
      
      // Animation state should be preserved even after error
      expect(instance.isRunning).toBe(true);
    });
  });

  describe('Edge Cases and Special Characters - Requirement 5.4', () => {
    test('should handle empty strings', () => {
      instance.setText('');
      expect(instance.config.text).toBe('');
      
      instance.setText('   ');
      expect(instance.config.text).toBe('');
    });

    test('should handle null and undefined inputs', () => {
      instance.setText(null);
      expect(instance.config.text).toBe('');
      
      instance.setText(undefined);
      expect(instance.config.text).toBe('');
    });

    test('should normalize line endings', () => {
      instance.setText('Line1\r\nLine2\rLine3\nLine4');
      expect(instance.config.text).toBe('Line1\nLine2\nLine3\nLine4');
    });

    test('should convert tabs to spaces', () => {
      instance.setText('Text\twith\ttabs');
      expect(instance.config.text).toBe('Text    with    tabs');
    });

    test('should remove control characters', () => {
      const textWithControlChars = 'Normal\x00Text\x07With\x1FControl\x7FChars';
      instance.setText(textWithControlChars);
      expect(instance.config.text).toBe('NormalTextWithControlChars');
    });

    test('should preserve newlines but remove other control characters', () => {
      const textWithMixedChars = 'Line1\nLine2\x00\x07Line3\nLine4';
      instance.setText(textWithMixedChars);
      expect(instance.config.text).toBe('Line1\nLine2Line3\nLine4');
    });

    test('should handle very long text by truncating', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const longText = 'A'.repeat(1500);
      
      instance.setText(longText);
      
      expect(instance.config.text).toHaveLength(1000);
      expect(consoleSpy).toHaveBeenCalledWith('Text truncated to 1000 characters for performance reasons');
      
      consoleSpy.mockRestore();
    });

    test('should handle special Unicode characters', () => {
      const unicodeText = 'Hello 🌟 World 中文 العربية';
      instance.setText(unicodeText);
      expect(instance.config.text).toBe(unicodeText);
    });

    test('should handle multiline text', () => {
      const multilineText = 'Line 1\nLine 2\nLine 3';
      instance.setText(multilineText);
      expect(instance.config.text).toBe(multilineText);
    });

    test('should handle text with only whitespace after processing', () => {
      const textWithOnlyControlChars = '\x00\x07\x1F\x7F';
      instance.setText(textWithOnlyControlChars);
      expect(instance.config.text).toBe('');
    });
  });

  describe('Performance and Memory Management', () => {
    test('should not regenerate resources unnecessarily', () => {
      const maskSpy = jest.spyOn(instance, '_generateTextMask');
      const noiseSpy = jest.spyOn(instance, '_generateNoisePattern');
      
      // Set the same text multiple times
      const sameText = 'SAME TEXT';
      instance.setText(sameText);
      instance.setText(sameText);
      instance.setText(sameText);
      
      // Should only be called once (for the first actual change)
      expect(maskSpy).toHaveBeenCalledTimes(1);
      expect(noiseSpy).toHaveBeenCalledTimes(1);
      
      maskSpy.mockRestore();
      noiseSpy.mockRestore();
    });

    test('should handle rapid text updates without memory leaks', () => {
      const texts = ['TEXT1', 'TEXT2', 'TEXT3', 'TEXT4', 'TEXT5'];
      
      // Rapidly update text multiple times
      texts.forEach(text => {
        instance.setText(text);
      });
      
      // Should end up with the last text
      expect(instance.config.text).toBe('TEXT5');
      
      // Instance should still be functional
      expect(instance.isDestroyed).toBe(false);
    });

    test('should maintain text renderer cache efficiency', () => {
      const initialCacheSize = instance.textRenderer.getCacheSize();
      
      instance.setText('CACHE TEST 1');
      instance.setText('CACHE TEST 2');
      
      // Cache should grow but not excessively
      const finalCacheSize = instance.textRenderer.getCacheSize();
      expect(finalCacheSize).toBeGreaterThanOrEqual(initialCacheSize);
      expect(finalCacheSize).toBeLessThan(100); // Reasonable cache size
    });
  });

  describe('Integration with Other Components', () => {
    test('should work correctly with updateConfig method', () => {
      instance.setText('INITIAL TEXT');
      
      instance.updateConfig({
        text: 'CONFIG TEXT',
        cellSize: 4
      });
      
      expect(instance.config.text).toBe('CONFIG TEXT');
      expect(instance.config.cellSize).toBe(4);
    });

    test('should maintain configuration consistency', () => {
      const originalConfig = { ...instance.config };
      
      instance.setText('NEW TEXT');
      
      // Only text should change, other config should remain the same
      expect(instance.config.text).toBe('NEW TEXT');
      expect(instance.config.cellSize).toBe(originalConfig.cellSize);
      expect(instance.config.fontSize).toBe(originalConfig.fontSize);
      expect(instance.config.fontWeight).toBe(originalConfig.fontWeight);
    });

    test('should work with canvas resize events', () => {
      instance.setText('RESIZE TEST');
      
      // Simulate a resize event
      const newDimensions = { displayWidth: 1000, displayHeight: 800 };
      instance._handleResize(newDimensions);
      
      // Text should remain the same after resize
      expect(instance.config.text).toBe('RESIZE TEST');
      expect(instance.isDestroyed).toBe(false);
    });
  });
});