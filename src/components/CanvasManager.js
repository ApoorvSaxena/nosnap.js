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
    this.containerObserver = null;
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
    
    // Remove existing handlers if they exist
    this._cleanupResizeHandlers();
    
    // Create debounced resize handler
    let resizeTimeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (!this.isDestroyed && this._hasCanvasSizeChanged()) {
          this.setupCanvas();
          if (this.resizeCallback) {
            this.resizeCallback(this.getCanvasDimensions());
          }
        }
      }, 100); // 100ms debounce
    };
    
    // Listen for window resize events (Requirement 4.1)
    this.resizeHandler = debouncedResize;
    window.addEventListener('resize', this.resizeHandler);
    
    // Listen for container size changes using ResizeObserver (Requirement 4.4)
    if (typeof ResizeObserver !== 'undefined') {
      this.containerObserver = new ResizeObserver((entries) => {
        // Only trigger if the canvas container actually changed size
        for (const entry of entries) {
          if (entry.target === this.canvas || entry.target === this.canvas.parentElement) {
            debouncedResize();
            break;
          }
        }
      });
      
      // Observe the canvas element and its parent container
      this.containerObserver.observe(this.canvas);
      if (this.canvas.parentElement) {
        this.containerObserver.observe(this.canvas.parentElement);
      }
    }
    
    // Fallback: periodic size check for browsers without ResizeObserver
    if (typeof ResizeObserver === 'undefined') {
      this._startPeriodicSizeCheck();
    }
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
   * Checks if the canvas size has actually changed since last setup
   * @returns {boolean} True if canvas size changed
   * @private
   */
  _hasCanvasSizeChanged() {
    if (this.isDestroyed) return false;
    
    const rect = this.canvas.getBoundingClientRect();
    const dpr = this.getDevicePixelRatio();
    
    // Check if display dimensions or device pixel ratio changed significantly
    const displayWidthChanged = Math.abs(rect.width - this.displayWidth) > 1;
    const displayHeightChanged = Math.abs(rect.height - this.displayHeight) > 1;
    const dprChanged = Math.abs(dpr - this.devicePixelRatio) > 0.1;
    
    return displayWidthChanged || displayHeightChanged || dprChanged;
  }

  /**
   * Starts periodic size checking for browsers without ResizeObserver
   * @private
   */
  _startPeriodicSizeCheck() {
    if (this.isDestroyed) return;
    
    // Check every 500ms for size changes
    this.sizeCheckInterval = setInterval(() => {
      if (!this.isDestroyed && this._hasCanvasSizeChanged()) {
        this.setupCanvas();
        if (this.resizeCallback) {
          this.resizeCallback(this.getCanvasDimensions());
        }
      }
    }, 500);
  }

  /**
   * Cleans up resize event handlers and observers
   * @private
   */
  _cleanupResizeHandlers() {
    // Remove window resize listener
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
    
    // Disconnect ResizeObserver
    if (this.containerObserver) {
      this.containerObserver.disconnect();
      this.containerObserver = null;
    }
    
    // Clear periodic size check interval
    if (this.sizeCheckInterval) {
      clearInterval(this.sizeCheckInterval);
      this.sizeCheckInterval = null;
    }
  }

  /**
   * Cleans up resources and event listeners
   */
  cleanup() {
    this.isDestroyed = true;
    
    // Clean up all resize handlers and observers
    this._cleanupResizeHandlers();
    
    this.resizeCallback = null;
    
    // Clear the canvas
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

export default CanvasManager;