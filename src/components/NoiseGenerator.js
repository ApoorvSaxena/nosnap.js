/**
 * NoiseGenerator class
 * Handles creation and management of noise patterns for the animated text effect
 */
class NoiseGenerator {
  /**
   * Create a NoiseGenerator instance
   * @param {number} cellSize - Size of each noise cell in pixels
   */
  constructor(cellSize = 2) {
    this.cellSize = cellSize;
  }

  /**
   * Create a noise canvas with random black and white cells
   * Ported from the original createNoiseCanvas function with comprehensive error handling
   * @param {number} width - Width of the noise canvas
   * @param {number} height - Height of the noise canvas
   * @returns {HTMLCanvasElement} Canvas element containing the noise pattern
   */
  createNoiseCanvas(width, height) {
    // Input validation with detailed error messages
    if (typeof width !== 'number' || typeof height !== 'number') {
      throw new Error(`NoiseGenerator.createNoiseCanvas: width and height must be numbers. Received: width=${typeof width}, height=${typeof height}`);
    }
    
    if (width <= 0 || height <= 0) {
      throw new Error(`NoiseGenerator.createNoiseCanvas: width and height must be positive. Received: width=${width}, height=${height}`);
    }
    
    if (!Number.isFinite(width) || !Number.isFinite(height)) {
      throw new Error(`NoiseGenerator.createNoiseCanvas: width and height must be finite numbers. Received: width=${width}, height=${height}`);
    }
    
    // Check for reasonable size limits to prevent memory issues
    const maxDimension = 8192; // 8K resolution limit
    if (width > maxDimension || height > maxDimension) {
      throw new Error(`NoiseGenerator.createNoiseCanvas: dimensions too large (max ${maxDimension}px). Received: ${width}x${height}`);
    }
    
    try {
      // Create canvas with error handling
      const canvas = document.createElement('canvas');
      if (!canvas) {
        throw new Error('Failed to create canvas element');
      }
      
      // Set canvas dimensions with validation
      try {
        canvas.width = Math.floor(width);
        canvas.height = Math.floor(height);
      } catch (error) {
        throw new Error(`Failed to set canvas dimensions: ${error.message}`);
      }
      
      // Get canvas context with error handling
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) {
        throw new Error('Failed to get 2D rendering context for noise canvas');
      }
      
      // Configure context
      ctx.imageSmoothingEnabled = false;

      // Calculate grid dimensions with validation
      if (this.cellSize <= 0) {
        throw new Error(`Invalid cell size: ${this.cellSize}. Cell size must be positive.`);
      }
      
      const cols = Math.ceil(width / this.cellSize);
      const rows = Math.ceil(height / this.cellSize);
      
      if (cols <= 0 || rows <= 0) {
        throw new Error(`Invalid grid dimensions: ${cols}x${rows}. Check width, height, and cellSize values.`);
      }
      
      // Generate noise pattern with error handling
      try {
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const random = Math.random();
            ctx.fillStyle = random < 0.5 ? '#000' : '#fff';
            ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
          }
        }
      } catch (error) {
        throw new Error(`Failed to generate noise pattern: ${error.message}`);
      }
      
      return canvas;
      
    } catch (error) {
      // Provide context-specific error message
      throw new Error(`NoiseGenerator.createNoiseCanvas failed: ${error.message}`);
    }
  }

  /**
   * Render noise directly to a canvas context with comprehensive error handling
   * Ported from the original renderNoise function
   * @param {CanvasRenderingContext2D} ctx - Canvas context to render to
   * @param {number} width - Width of the area to fill with noise
   * @param {number} height - Height of the area to fill with noise
   */
  renderDirectNoise(ctx, width, height) {
    // Input validation
    if (!ctx || typeof ctx.fillRect !== 'function') {
      throw new Error('NoiseGenerator.renderDirectNoise: Invalid canvas context provided. Expected CanvasRenderingContext2D.');
    }
    
    if (typeof width !== 'number' || typeof height !== 'number') {
      throw new Error(`NoiseGenerator.renderDirectNoise: width and height must be numbers. Received: width=${typeof width}, height=${typeof height}`);
    }
    
    if (width <= 0 || height <= 0) {
      throw new Error(`NoiseGenerator.renderDirectNoise: width and height must be positive. Received: width=${width}, height=${height}`);
    }
    
    if (!Number.isFinite(width) || !Number.isFinite(height)) {
      throw new Error(`NoiseGenerator.renderDirectNoise: width and height must be finite numbers. Received: width=${width}, height=${height}`);
    }
    
    // Validate cell size
    if (this.cellSize <= 0) {
      throw new Error(`NoiseGenerator.renderDirectNoise: Invalid cell size: ${this.cellSize}. Cell size must be positive.`);
    }

    try {
      const cols = Math.ceil(width / this.cellSize);
      const rows = Math.ceil(height / this.cellSize);
      
      if (cols <= 0 || rows <= 0) {
        throw new Error(`Invalid grid dimensions: ${cols}x${rows}. Check width, height, and cellSize values.`);
      }

      // Render noise pattern with error handling for each operation
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          try {
            const random = Math.random();
            ctx.fillStyle = random < 0.5 ? '#000' : '#fff';
            ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
          } catch (cellError) {
            // Log individual cell errors but continue rendering
            console.warn(`Failed to render noise cell at (${x}, ${y}):`, cellError.message);
          }
        }
      }
      
    } catch (error) {
      throw new Error(`NoiseGenerator.renderDirectNoise failed: ${error.message}`);
    }
  }

  /**
   * Generate an efficient noise tile that can be repeated
   * Creates a tileable noise pattern for performance optimization
   * @param {number} tileWidth - Width of the tile
   * @param {number} tileHeight - Height of the tile
   * @returns {HTMLCanvasElement} Canvas element containing the tileable noise pattern
   */
  generateNoiseTile(tileWidth, tileHeight) {
    // Ensure tile dimensions are multiples of cell size for seamless tiling
    const alignedWidth = Math.ceil(tileWidth / this.cellSize) * this.cellSize;
    const alignedHeight = Math.ceil(tileHeight / this.cellSize) * this.cellSize;
    
    return this.createNoiseCanvas(alignedWidth, alignedHeight);
  }

  /**
   * Update the cell size for noise generation with comprehensive validation
   * @param {number} newCellSize - New cell size in pixels
   */
  setCellSize(newCellSize) {
    // Comprehensive input validation
    if (newCellSize === null || newCellSize === undefined) {
      throw new Error('NoiseGenerator.setCellSize: Cell size cannot be null or undefined');
    }
    
    if (typeof newCellSize !== 'number') {
      throw new Error(`NoiseGenerator.setCellSize: Cell size must be a number. Received: ${typeof newCellSize}`);
    }
    
    if (!Number.isFinite(newCellSize)) {
      throw new Error(`NoiseGenerator.setCellSize: Cell size must be a finite number. Received: ${newCellSize}`);
    }
    
    if (newCellSize <= 0) {
      throw new Error(`NoiseGenerator.setCellSize: Cell size must be positive. Received: ${newCellSize}`);
    }
    
    // Check for reasonable limits
    const maxCellSize = 100;
    if (newCellSize > maxCellSize) {
      throw new Error(`NoiseGenerator.setCellSize: Cell size too large (max ${maxCellSize}px). Received: ${newCellSize}`);
    }
    
    try {
      this.cellSize = newCellSize;
    } catch (error) {
      throw new Error(`NoiseGenerator.setCellSize: Failed to set cell size: ${error.message}`);
    }
  }

  /**
   * Get the current cell size
   * @returns {number} Current cell size in pixels
   */
  getCellSize() {
    return this.cellSize;
  }

  /**
   * Destroy the noise generator and clean up all resources
   * This method ensures complete cleanup for memory leak prevention
   */
  destroy() {
    // Reset cell size to default
    this.cellSize = 2;
  }
}

export default NoiseGenerator;