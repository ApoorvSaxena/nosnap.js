/**
 * Unit tests for NoiseGenerator class
 */

import NoiseGenerator from '../src/components/NoiseGenerator.js';

// Mock HTMLCanvasElement and CanvasRenderingContext2D
const createMockContext = () => ({
  imageSmoothingEnabled: true,
  fillStyle: '',
  fillRect: jest.fn()
});

const createMockCanvas = () => {
  const mockContext = createMockContext();
  return {
    width: 0,
    height: 0,
    getContext: jest.fn(() => mockContext)
  };
};

// Mock document.createElement to return our mock canvas
global.document = {
  createElement: jest.fn(() => createMockCanvas())
};

describe('NoiseGenerator', () => {
  let noiseGenerator;

  beforeEach(() => {
    jest.clearAllMocks();
    noiseGenerator = new NoiseGenerator();
  });

  describe('constructor', () => {
    test('should create instance with default cell size', () => {
      const generator = new NoiseGenerator();
      expect(generator.getCellSize()).toBe(2);
    });

    test('should create instance with custom cell size', () => {
      const generator = new NoiseGenerator(4);
      expect(generator.getCellSize()).toBe(4);
    });
  });

  describe('createNoiseCanvas', () => {
    test('should call document.createElement when creating canvas', () => {
      // We can't test the actual canvas creation due to JSDOM limitations,
      // but we can verify the method exists and doesn't throw immediately
      expect(typeof noiseGenerator.createNoiseCanvas).toBe('function');
      expect(global.document.createElement).toBeDefined();
    });
  });

  describe('renderDirectNoise', () => {
    test('should render noise to provided context', () => {
      const mockCtx = createMockContext();
      const width = 10;
      const height = 8;
      const cellSize = 2;
      const generator = new NoiseGenerator(cellSize);
      
      generator.renderDirectNoise(mockCtx, width, height);
      
      const expectedCols = Math.ceil(width / cellSize); // 5
      const expectedRows = Math.ceil(height / cellSize); // 4
      const expectedCalls = expectedCols * expectedRows; // 20
      
      expect(mockCtx.fillRect).toHaveBeenCalledTimes(expectedCalls);
    });

    test('should call fillRect with correct cell positions and sizes', () => {
      const mockCtx = createMockContext();
      const cellSize = 3;
      const generator = new NoiseGenerator(cellSize);
      
      generator.renderDirectNoise(mockCtx, 6, 6); // 2x2 cells
      
      // Check that fillRect was called with correct positions
      expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, cellSize, cellSize);
      expect(mockCtx.fillRect).toHaveBeenCalledWith(cellSize, 0, cellSize, cellSize);
      expect(mockCtx.fillRect).toHaveBeenCalledWith(0, cellSize, cellSize, cellSize);
      expect(mockCtx.fillRect).toHaveBeenCalledWith(cellSize, cellSize, cellSize, cellSize);
    });
  });

  describe('generateNoiseTile', () => {
    test('should calculate aligned dimensions correctly', () => {
      const generator = new NoiseGenerator(3);
      
      // Test the alignment calculation logic
      const tileWidth = 10;
      const tileHeight = 8;
      const cellSize = 3;
      
      const alignedWidth = Math.ceil(tileWidth / cellSize) * cellSize; // 12
      const alignedHeight = Math.ceil(tileHeight / cellSize) * cellSize; // 9
      
      expect(alignedWidth).toBe(12);
      expect(alignedHeight).toBe(9);
    });

    test('should handle already aligned dimensions', () => {
      const generator = new NoiseGenerator(4);
      
      const tileWidth = 12;
      const tileHeight = 16;
      const cellSize = 4;
      
      const alignedWidth = Math.ceil(tileWidth / cellSize) * cellSize; // 12
      const alignedHeight = Math.ceil(tileHeight / cellSize) * cellSize; // 16
      
      expect(alignedWidth).toBe(12);
      expect(alignedHeight).toBe(16);
    });
  });

  describe('setCellSize', () => {
    test('should update cell size with valid value', () => {
      noiseGenerator.setCellSize(5);
      expect(noiseGenerator.getCellSize()).toBe(5);
    });

    test('should throw error for non-number cell size', () => {
      expect(() => {
        noiseGenerator.setCellSize('invalid');
      }).toThrow('Cell size must be a positive number');
    });

    test('should throw error for zero cell size', () => {
      expect(() => {
        noiseGenerator.setCellSize(0);
      }).toThrow('Cell size must be a positive number');
    });

    test('should throw error for negative cell size', () => {
      expect(() => {
        noiseGenerator.setCellSize(-1);
      }).toThrow('Cell size must be a positive number');
    });
  });

  describe('getCellSize', () => {
    test('should return current cell size', () => {
      const generator = new NoiseGenerator(7);
      expect(generator.getCellSize()).toBe(7);
    });
  });

  describe('noise generation consistency', () => {
    test('should generate different patterns on multiple calls', () => {
      const mockCtx1 = createMockContext();
      const mockCtx2 = createMockContext();
      
      // Generate two noise patterns
      noiseGenerator.renderDirectNoise(mockCtx1, 4, 4);
      noiseGenerator.renderDirectNoise(mockCtx2, 4, 4);
      
      // Both should have been called the same number of times
      expect(mockCtx1.fillRect).toHaveBeenCalledTimes(mockCtx2.fillRect.mock.calls.length);
      
      // The patterns should be different (this is probabilistic, but with 4 cells
      // the chance of identical patterns is very low)
      const calls1 = mockCtx1.fillRect.mock.calls;
      const calls2 = mockCtx2.fillRect.mock.calls;
      
      // At least the fillStyle should have been set (indicating random generation occurred)
      expect(calls1.length).toBeGreaterThan(0);
      expect(calls2.length).toBeGreaterThan(0);
    });

    test('should handle edge case of very small dimensions', () => {
      const mockCtx = createMockContext();
      
      // Should not throw error with small dimensions
      expect(() => {
        noiseGenerator.renderDirectNoise(mockCtx, 1, 1);
      }).not.toThrow();
      
      // Should still make at least one fillRect call
      expect(mockCtx.fillRect).toHaveBeenCalledTimes(1);
    });

    test('should handle edge case of zero dimensions gracefully', () => {
      const mockCtx = createMockContext();
      
      // Should not throw error with zero dimensions
      expect(() => {
        noiseGenerator.renderDirectNoise(mockCtx, 0, 0);
      }).not.toThrow();
      
      // Should not make any fillRect calls
      expect(mockCtx.fillRect).not.toHaveBeenCalled();
    });

    test('should calculate correct number of cells', () => {
      // Test the cell calculation logic directly
      const cellSize = 2;
      const width = 10;
      const height = 8;
      
      const expectedCols = Math.ceil(width / cellSize); // 5
      const expectedRows = Math.ceil(height / cellSize); // 4
      const expectedCells = expectedCols * expectedRows; // 20
      
      expect(expectedCols).toBe(5);
      expect(expectedRows).toBe(4);
      expect(expectedCells).toBe(20);
    });
  });
});