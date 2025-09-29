/**
 * CanvasManager - Handles canvas setup, resizing, and device pixel ratio management
 */
class CanvasManager {
  constructor(canvas) {
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
      throw new Error('CanvasManager requires a valid HTMLCanvasElement');
    }
    
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resizeCallback = null;
    this.resizeHandler = null;
    this.isDestroyed = false;
    
    if (!this.ctx) {
      throw new Error('Failed to get 2D rendering context from canvas');
    }
    
    this.setupCanvas();
  }

  /**
   * Sets up the canvas with proper device pixel ratio handling
   */
  setupCanvas() {
    if (this.isDestroyed) return;
    
    const dpr = this.getDevicePixelRatio();
    const rect = this.canvas.getBoundingClientRect();
    
    // Set the actual size in memory (scaled for device pixel ratio)
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    
    // Scale the canvas back down using CSS
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    
    // Scale the drawing context so everything draws at the correct size
    this.ctx.scale(dpr, dpr);
    
    // Store dimensions for easy access
    this.displayWidth = rect.width;
    this.displayHeight = rect.height;
    this.actualWidth = this.canvas.width;
    this.actualHeight = this.canvas.height;
    this.devicePixelRatio = dpr;
  }

  /**
   * Gets the device pixel ratio, with fallback for older browsers
   */
  getDevicePixelRatio() {
    return window.devicePixelRatio || 1;
  }

  /**
   * Sets up resize event handling with proper cleanup
   * @param {Function} callback - Function to call when canvas is resized
   */
  handleResize(callback) {
    if (this.isDestroyed) return;
    
    this.resizeCallback = callback;
    
    // Remove existing handler if it exists
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    
    // Create debounced resize handler
    let resizeTimeout;
    this.resizeHandler = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (!this.isDestroyed) {
          this.setupCanvas();
          if (this.resizeCallback) {
            this.resizeCallback(this.getCanvasDimensions());
          }
        }
      }, 100); // 100ms debounce
    };
    
    window.addEventListener('resize', this.resizeHandler);
  }

  /**
   * Gets current canvas dimensions
   * @returns {Object} Object containing display and actual dimensions
   */
  getCanvasDimensions() {
    return {
      displayWidth: this.displayWidth,
      displayHeight: this.displayHeight,
      actualWidth: this.actualWidth,
      actualHeight: this.actualHeight,
      devicePixelRatio: this.devicePixelRatio
    };
  }

  /**
   * Gets the canvas context
   * @returns {CanvasRenderingContext2D} The 2D rendering context
   */
  getContext() {
    return this.ctx;
  }

  /**
   * Gets the canvas element
   * @returns {HTMLCanvasElement} The canvas element
   */
  getCanvas() {
    return this.canvas;
  }

  /**
   * Checks if the canvas needs to be resized based on current container size
   * @returns {boolean} True if resize is needed
   */
  needsResize() {
    if (this.isDestroyed) return false;
    
    const rect = this.canvas.getBoundingClientRect();
    const dpr = this.getDevicePixelRatio();
    
    return (
      Math.abs(rect.width - this.displayWidth) > 1 ||
      Math.abs(rect.height - this.displayHeight) > 1 ||
      Math.abs(dpr - this.devicePixelRatio) > 0.1
    );
  }

  /**
   * Forces a canvas resize check and update
   */
  forceResize() {
    if (this.isDestroyed) return;
    
    this.setupCanvas();
    if (this.resizeCallback) {
      this.resizeCallback(this.getCanvasDimensions());
    }
  }

  /**
   * Cleans up resources and event listeners
   */
  cleanup() {
    this.isDestroyed = true;
    
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
    
    this.resizeCallback = null;
    
    // Clear the canvas
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

export default CanvasManager;