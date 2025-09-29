/**
 * CanvasManager - Handles canvas setup, resizing, and device pixel ratio management
 */
class CanvasManager {
  constructor(canvas) {
    // Comprehensive input validation
    this._validateCanvasInput(canvas);
    
    this.canvas = canvas;
    this.resizeCallback = null;
    this.resizeHandler = null;
    this.containerObserver = null;
    this.isDestroyed = false;
    this.contextLost = false;
    this.recoveryAttempts = 0;
    this.maxRecoveryAttempts = 3;
    
    // Get canvas context with error handling and recovery
    this._initializeCanvasContext();
    
    // Set up context lost/restored event handlers
    this._setupContextEventHandlers();
    
    // Initial canvas setup
    try {
      this.setupCanvas();
    } catch (error) {
      throw new Error(`Canvas setup failed: ${error.message}`);
    }
  }

  /**
   * Validate canvas input with detailed error messages
   * @private
   * @param {*} canvas - Canvas element to validate
   */
  _validateCanvasInput(canvas) {
    if (canvas === null || canvas === undefined) {
      throw new Error('CanvasManager: canvas parameter is required. Received: ' + canvas);
    }
    
    if (!(canvas instanceof HTMLCanvasElement)) {
      const actualType = canvas.constructor ? canvas.constructor.name : typeof canvas;
      throw new Error(`CanvasManager: Expected HTMLCanvasElement, received: ${actualType}. Please provide a valid <canvas> element.`);
    }
    
    // Check if canvas is in a valid state
    if (canvas.width < 0 || canvas.height < 0) {
      throw new Error('CanvasManager: Canvas has invalid dimensions');
    }
    
    // Warn about potential issues
    try {
      if (!canvas.parentNode) {
        console.warn('CanvasManager: Canvas is not attached to DOM. This may cause issues with resize detection.');
      }
    } catch (error) {
      // Ignore parentNode access errors in test environments
    }
  }

  /**
   * Initialize canvas context with error handling
   * @private
   */
  _initializeCanvasContext() {
    try {
      this.ctx = this.canvas.getContext('2d');
      
      if (!this.ctx) {
        throw new Error('Failed to get 2D rendering context. This may indicate browser compatibility issues or canvas corruption.');
      }
      
      // Test basic context functionality
      try {
        this.ctx.save();
        this.ctx.restore();
      } catch (testError) {
        throw new Error(`Canvas context is not functional: ${testError.message}`);
      }
      
    } catch (error) {
      throw new Error(`Canvas context initialization failed: ${error.message}`);
    }
  }

  /**
   * Set up context lost/restored event handlers for error recovery
   * @private
   */
  _setupContextEventHandlers() {
    try {
      // Handle context lost events
      this.canvas.addEventListener('webglcontextlost', (event) => {
        console.warn('Canvas context lost');
        event.preventDefault();
        this.contextLost = true;
      });
      
      // Handle context restored events
      this.canvas.addEventListener('webglcontextrestored', () => {
        console.log('Canvas context restored, attempting recovery');
        this.contextLost = false;
        this._attemptContextRecovery();
      });
      
    } catch (error) {
      console.warn('Failed to set up context event handlers:', error.message);
    }
  }

  /**
   * Attempt to recover from context loss
   * @private
   */
  _attemptContextRecovery() {
    if (this.recoveryAttempts >= this.maxRecoveryAttempts) {
      console.error('Maximum context recovery attempts reached');
      return;
    }
    
    this.recoveryAttempts++;
    
    try {
      // Reinitialize context
      this._initializeCanvasContext();
      
      // Reconfigure canvas
      this.setupCanvas();
      
      console.log('Canvas context recovery successful');
      this.recoveryAttempts = 0;
      
    } catch (error) {
      console.error(`Context recovery attempt ${this.recoveryAttempts} failed:`, error.message);
    }
  }

  /**
   * Sets up the canvas with proper device pixel ratio handling and comprehensive error handling
   */
  setupCanvas() {
    if (this.isDestroyed) {
      console.warn('CanvasManager.setupCanvas: Cannot setup destroyed canvas manager');
      return;
    }
    
    if (this.contextLost) {
      console.warn('CanvasManager.setupCanvas: Cannot setup canvas with lost context');
      return;
    }
    
    try {
      // Validate context is still available
      if (!this.ctx) {
        throw new Error('Canvas context is not available');
      }
      
      // Get device pixel ratio with fallback
      const dpr = this.getDevicePixelRatio();
      if (!Number.isFinite(dpr) || dpr <= 0) {
        throw new Error(`Invalid device pixel ratio: ${dpr}`);
      }
      
      // Get canvas bounding rect with error handling
      let rect;
      try {
        rect = this.canvas.getBoundingClientRect();
      } catch (error) {
        throw new Error(`Failed to get canvas bounding rect: ${error.message}`);
      }
      
      // Validate rect dimensions
      if (!rect || rect.width <= 0 || rect.height <= 0) {
        throw new Error(`Invalid canvas dimensions: ${rect ? rect.width + 'x' + rect.height : 'null rect'}`);
      }
      
      // Calculate actual dimensions with bounds checking
      const actualWidth = Math.floor(rect.width * dpr);
      const actualHeight = Math.floor(rect.height * dpr);
      
      // Check for reasonable size limits to prevent memory issues
      const maxDimension = 16384; // 16K limit
      if (actualWidth > maxDimension || actualHeight > maxDimension) {
        throw new Error(`Canvas dimensions too large: ${actualWidth}x${actualHeight} (max: ${maxDimension})`);
      }
      
      // Set the actual size in memory (scaled for device pixel ratio)
      try {
        this.canvas.width = actualWidth;
        this.canvas.height = actualHeight;
      } catch (error) {
        throw new Error(`Failed to set canvas dimensions: ${error.message}`);
      }
      
      // Scale the canvas back down using CSS
      try {
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
      } catch (error) {
        console.warn('Failed to set canvas CSS dimensions:', error.message);
      }
      
      // Scale the drawing context so everything draws at the correct size
      try {
        // Reset transform first to avoid accumulating transforms
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(dpr, dpr);
      } catch (error) {
        throw new Error(`Failed to scale canvas context: ${error.message}`);
      }
      
      // Store dimensions for easy access
      this.displayWidth = rect.width;
      this.displayHeight = rect.height;
      this.actualWidth = actualWidth;
      this.actualHeight = actualHeight;
      this.devicePixelRatio = dpr;
      
    } catch (error) {
      throw new Error(`Canvas setup failed: ${error.message}`);
    }
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