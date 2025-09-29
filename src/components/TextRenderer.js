/**
 * TextRenderer - Handles text mask generation and font size calculation
 * Provides pixelated text mask creation with automatic font sizing and alignment
 */

class TextRenderer {
  /**
   * Create a new TextRenderer instance
   * @param {Object} config - Configuration object containing text rendering options
   */
  constructor(config = {}) {
    this.config = {
      fontSize: config.fontSize || null, // Auto-calculated if null
      fontWeight: config.fontWeight || 900,
      fontFamily: config.fontFamily || 'sans-serif',
      maskBlockSize: config.maskBlockSize || 2
    };
    
    // Cache for font measurements to improve performance
    this.fontMeasurementCache = new Map();
  }

  /**
   * Update the configuration for text rendering
   * @param {Object} newConfig - New configuration options
   */
  updateConfig(newConfig) {
    this.config = {
      ...this.config,
      ...newConfig
    };
    // Clear cache when config changes
    this.fontMeasurementCache.clear();
  }

  /**
   * Calculate optimal font size for given text and target dimensions
   * @param {string} text - Text to measure
   * @param {number} targetWidth - Target width in pixels
   * @param {number} targetHeight - Target height in pixels
   * @param {CanvasRenderingContext2D} ctx - Canvas context for text measurement
   * @returns {number} Optimal font size in pixels
   */
  calculateOptimalFontSize(text, targetWidth, targetHeight, ctx) {
    const lines = String(text).split('\n');
    const lineHeightFactor = 1.2;
    const minFontSize = 8;
    const maxIterations = 5;

    // Create cache key for this measurement
    const cacheKey = `${text}:${targetWidth}:${targetHeight}:${this.config.fontWeight}:${this.config.fontFamily}`;
    
    if (this.fontMeasurementCache.has(cacheKey)) {
      return this.fontMeasurementCache.get(cacheKey);
    }

    // Initial font size estimate based on target height and number of lines
    let fontSize = Math.max(minFontSize, Math.floor(targetHeight / Math.max(1, lines.length)));

    // Iteratively refine font size to fit within target dimensions
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      ctx.font = `${this.config.fontWeight} ${fontSize}px ${this.config.fontFamily}`;
      
      let maxLineWidth = 1;
      for (const line of lines) {
        const width = Math.max(1, ctx.measureText(line).width);
        if (width > maxLineWidth) {
          maxLineWidth = width;
        }
      }
      
      const totalHeight = Math.max(1, Math.ceil(lines.length * fontSize * lineHeightFactor));
      const scaleX = targetWidth / maxLineWidth;
      const scaleY = targetHeight / totalHeight;
      const scale = Math.min(scaleX, scaleY, 1);
      
      const newFontSize = Math.max(minFontSize, Math.floor(fontSize * scale));
      
      // If font size converged or we're at minimum, break
      if (newFontSize === fontSize || newFontSize === minFontSize) {
        break;
      }
      
      fontSize = newFontSize;
    }

    // Cache the result
    this.fontMeasurementCache.set(cacheKey, fontSize);
    
    return fontSize;
  }

  /**
   * Create a pixelated text mask canvas
   * @param {string} text - Text to render
   * @param {number} blockSize - Size of pixelation blocks
   * @param {number} viewportWidth - Viewport width
   * @param {number} viewportHeight - Viewport height
   * @returns {HTMLCanvasElement} Canvas containing the pixelated text mask
   */
  createPixelatedTextMask(text, blockSize, viewportWidth, viewportHeight) {
    // Validate inputs
    if (typeof text !== 'string') {
      text = String(text || '');
    }
    
    if (blockSize <= 0 || viewportWidth <= 0 || viewportHeight <= 0) {
      return this._createEmptyMask(blockSize);
    }

    // Handle empty text early
    if (!text || text.trim() === '') {
      return this._createEmptyMask(blockSize);
    }

    const lines = text.split('\n');
    
    // Create scratch canvas for text rendering
    const scratch = document.createElement('canvas');
    scratch.width = viewportWidth;
    scratch.height = viewportHeight;
    const sctx = scratch.getContext('2d');
    sctx.imageSmoothingEnabled = false;

    // Calculate target dimensions (85% width, 60% height of viewport)
    const targetWidth = Math.max(1, Math.floor(viewportWidth * 0.85));
    const targetHeight = Math.max(1, Math.floor(viewportHeight * 0.6));

    // Determine font size
    let fontSize;
    if (this.config.fontSize && this.config.fontSize > 0) {
      fontSize = this.config.fontSize;
    } else {
      fontSize = this.calculateOptimalFontSize(text, targetWidth, targetHeight, sctx);
    }

    // Render text to scratch canvas
    this._renderTextToCanvas(sctx, lines, fontSize, viewportWidth, viewportHeight);

    // Extract image data and find text bounds
    const imageData = sctx.getImageData(0, 0, scratch.width, scratch.height);
    const bounds = this._findTextBounds(imageData);

    // Handle empty text case
    if (!bounds) {
      return this._createEmptyMask(blockSize);
    }

    // Create pixelated mask from text bounds
    return this._createPixelatedMask(imageData, bounds, blockSize);
  }

  /**
   * Render text lines to canvas with proper alignment and spacing
   * @private
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string[]} lines - Array of text lines
   * @param {number} fontSize - Font size in pixels
   * @param {number} canvasWidth - Canvas width
   * @param {number} canvasHeight - Canvas height
   */
  _renderTextToCanvas(ctx, lines, fontSize, canvasWidth, canvasHeight) {
    const lineHeightFactor = 1.2;
    
    // Clear canvas and set up text rendering
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.font = `${this.config.fontWeight} ${fontSize}px ${this.config.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';

    // Calculate text positioning
    const centerX = Math.floor(canvasWidth / 2);
    const centerY = Math.floor(canvasHeight / 2);
    const spacing = Math.ceil(fontSize * lineHeightFactor);
    const startY = Math.floor(centerY - ((lines.length - 1) * spacing) / 2);

    // Render each line
    for (let i = 0; i < lines.length; i++) {
      const y = startY + i * spacing;
      ctx.fillText(lines[i], centerX, y);
    }
  }

  /**
   * Find the bounding box of rendered text in image data
   * @private
   * @param {ImageData} imageData - Image data from canvas
   * @returns {Object|null} Bounds object with minX, minY, maxX, maxY or null if no text found
   */
  _findTextBounds(imageData) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    let minX = width, minY = height, maxX = 0, maxY = 0;
    let hasText = false;

    // Scan image data for non-transparent pixels
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha > 0) {
          hasText = true;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }

    return hasText ? { minX, minY, maxX, maxY } : null;
  }

  /**
   * Create a pixelated mask from text bounds
   * @private
   * @param {ImageData} imageData - Source image data
   * @param {Object} bounds - Text bounds
   * @param {number} blockSize - Pixelation block size
   * @returns {HTMLCanvasElement} Pixelated mask canvas
   */
  _createPixelatedMask(imageData, bounds, blockSize) {
    const { minX, minY, maxX, maxY } = bounds;
    const data = imageData.data;
    const width = imageData.width;

    // Align bounds to pixel grid defined by blockSize
    const alignedMinX = Math.floor(minX / blockSize) * blockSize;
    const alignedMinY = Math.floor(minY / blockSize) * blockSize;
    const rawWidth = maxX - alignedMinX + 1;
    const rawHeight = maxY - alignedMinY + 1;
    const alignedWidth = Math.ceil(rawWidth / blockSize) * blockSize;
    const alignedHeight = Math.ceil(rawHeight / blockSize) * blockSize;

    // Create mask canvas
    const mask = document.createElement('canvas');
    mask.width = alignedWidth;
    mask.height = alignedHeight;
    const mctx = mask.getContext('2d');
    mctx.imageSmoothingEnabled = false;
    mctx.clearRect(0, 0, alignedWidth, alignedHeight);
    mctx.fillStyle = '#000';

    // Sample pixels at block centers and fill blocks if text is present
    for (let y = 0; y < alignedHeight; y += blockSize) {
      for (let x = 0; x < alignedWidth; x += blockSize) {
        const sampleX = alignedMinX + x + Math.floor(blockSize / 2);
        const sampleY = alignedMinY + y + Math.floor(blockSize / 2);
        
        if (sampleX >= 0 && sampleY >= 0 && sampleX < width && sampleY < imageData.height) {
          const alpha = data[(sampleY * width + sampleX) * 4 + 3];
          if (alpha > 0) {
            mctx.fillRect(x, y, blockSize, blockSize);
          }
        }
      }
    }

    return mask;
  }

  /**
   * Create an empty mask canvas for edge cases
   * @private
   * @param {number} blockSize - Block size for the empty mask
   * @returns {HTMLCanvasElement} Empty mask canvas
   */
  _createEmptyMask(blockSize) {
    const empty = document.createElement('canvas');
    empty.width = Math.max(1, blockSize);
    empty.height = Math.max(1, blockSize);
    return empty;
  }

  /**
   * Clear the font measurement cache
   * Useful when memory management is needed for long-running applications
   */
  clearCache() {
    this.fontMeasurementCache.clear();
  }

  /**
   * Get current cache size (for debugging/monitoring)
   * @returns {number} Number of cached font measurements
   */
  getCacheSize() {
    return this.fontMeasurementCache.size;
  }

  /**
   * Destroy the text renderer and clean up all resources
   * This method ensures complete cleanup for memory leak prevention
   */
  destroy() {
    // Clear the font measurement cache
    this.clearCache();
    
    // Reset configuration to defaults
    this.config = {
      fontSize: null,
      fontWeight: 900,
      fontFamily: 'sans-serif',
      maskBlockSize: 2
    };
  }
}

export default TextRenderer;