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
   * Ported from the original createNoiseCanvas function
   * @param {number} width - Width of the noise canvas
   * @param {number} height - Height of the noise canvas
   * @returns {HTMLCanvasElement} Canvas element containing the noise pattern
   */
  createNoiseCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.imageSmoothingEnabled = false;

    const cols = Math.ceil(width / this.cellSize);
    const rows = Math.ceil(height / this.cellSize);
    
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const random = Math.random();
        ctx.fillStyle = random < 0.5 ? '#000' : '#fff';
        ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
      }
    }
    
    return canvas;
  }

  /**
   * Render noise directly to a canvas context
   * Ported from the original renderNoise function
   * @param {CanvasRenderingContext2D} ctx - Canvas context to render to
   * @param {number} width - Width of the area to fill with noise
   * @param {number} height - Height of the area to fill with noise
   */
  renderDirectNoise(ctx, width, height) {
    const cols = Math.ceil(width / this.cellSize);
    const rows = Math.ceil(height / this.cellSize);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const random = Math.random();
        ctx.fillStyle = random < 0.5 ? '#000' : '#fff';
        ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
      }
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
   * Update the cell size for noise generation
   * @param {number} newCellSize - New cell size in pixels
   */
  setCellSize(newCellSize) {
    if (typeof newCellSize !== 'number' || newCellSize <= 0) {
      throw new Error('Cell size must be a positive number');
    }
    this.cellSize = newCellSize;
  }

  /**
   * Get the current cell size
   * @returns {number} Current cell size in pixels
   */
  getCellSize() {
    return this.cellSize;
  }
}

export default NoiseGenerator;