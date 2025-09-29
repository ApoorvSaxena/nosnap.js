/**
 * Animated Noise Text Library
 * A JavaScript library for creating animated noise text effects on HTML5 canvas
 */

// Import all component classes
import CanvasManager from './components/CanvasManager.js';
import NoiseGenerator from './components/NoiseGenerator.js';
import TextRenderer from './components/TextRenderer.js';
import AnimationController from './components/AnimationController.js';
import ConfigManager from './components/ConfigManager.js';

/**
 * Main AnimatedNoiseText class
 * Entry point for the library that orchestrates all components
 */
class AnimatedNoiseText {
  constructor(canvas, options = {}) {
    // Validate canvas parameter (Requirement 1.2)
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
      throw new Error('AnimatedNoiseText requires a valid HTMLCanvasElement as the first parameter');
    }
    
    // Initialize configuration manager (Requirement 1.4)
    this.configManager = new ConfigManager();
    
    // Validate and merge configuration
    const configResult = this.configManager.createConfig(options);
    this.config = configResult.config;
    
    // Log warnings if any configuration issues were found
    if (configResult.warnings.length > 0) {
      console.warn('AnimatedNoiseText configuration warnings:', configResult.warnings);
    }
    
    // Store canvas reference and state
    this.canvas = canvas;
    this.isRunning = false;
    this.isDestroyed = false;
    
    // Initialize all component classes
    try {
      // Canvas management with resize handling (Requirement 1.2)
      this.canvasManager = new CanvasManager(canvas);
      
      // Noise generation (Requirement 2.2)
      this.noiseGenerator = new NoiseGenerator(this.config.cellSize);
      
      // Text rendering with configuration (Requirement 2.1)
      this.textRenderer = new TextRenderer(this.config);
      
      // Animation control (Requirement 3.1)
      this.animationController = new AnimationController(this.config.stepMs);
      
      // Set up resize handling
      this.canvasManager.handleResize((dimensions) => {
        if (!this.isDestroyed) {
          this._handleResize(dimensions);
        }
      });
      
      // Initialize animation resources
      this._initializeResources();
      
    } catch (error) {
      // Clean up on initialization failure
      this._cleanup();
      throw new Error(`Failed to initialize AnimatedNoiseText: ${error.message}`);
    }
  }

  /**
   * Start the animation (Requirement 3.1)
   */
  start() {
    if (this.isDestroyed) {
      throw new Error('Cannot start animation on destroyed instance');
    }
    
    if (this.isRunning) {
      return; // Already running
    }
    
    try {
      // Start animation controller with render callback
      this.animationController.start((offset) => {
        this._renderFrame(offset);
      });
      
      this.isRunning = true;
    } catch (error) {
      console.error('Failed to start animation:', error);
      throw error;
    }
  }

  /**
   * Stop the animation (Requirement 3.2)
   */
  stop() {
    if (!this.isRunning) {
      return; // Already stopped
    }
    
    try {
      // Stop animation controller
      this.animationController.stop();
      this.isRunning = false;
    } catch (error) {
      console.error('Failed to stop animation:', error);
    }
  }

  /**
   * Destroy the animation and clean up resources (Requirement 3.4)
   */
  destroy() {
    if (this.isDestroyed) {
      return; // Already destroyed
    }
    
    // Stop animation first
    this.stop();
    
    // Clean up all resources
    this._cleanup();
    
    this.isDestroyed = true;
  }

  /**
   * Update the text content (Requirement 5.1)
   * @param {string} text - New text to display
   */
  setText(text) {
    if (this.isDestroyed) {
      throw new Error('Cannot set text on destroyed instance');
    }
    
    // Update configuration with new text
    this.updateConfig({ text });
    
    // Regenerate text mask with new text
    this._generateTextMask();
  }

  /**
   * Update configuration options
   * @param {Object} newOptions - New configuration options
   */
  updateConfig(newOptions) {
    if (this.isDestroyed) {
      throw new Error('Cannot update config on destroyed instance');
    }
    
    // Store old config for comparison
    const oldConfig = { ...this.config };
    
    // Merge new options with existing configuration
    const mergedOptions = { ...this.config, ...newOptions };
    const configResult = this.configManager.createConfig(mergedOptions);
    
    this.config = configResult.config;
    
    // Log warnings if any configuration issues were found
    if (configResult.warnings.length > 0) {
      console.warn('AnimatedNoiseText configuration warnings:', configResult.warnings);
    }
    
    // Update components that depend on configuration
    this._updateComponentsFromConfig(oldConfig);
  }

  /**
   * Initialize animation resources
   * @private
   */
  _initializeResources() {
    const dimensions = this.canvasManager.getCanvasDimensions();
    
    // Create offscreen canvases for compositing
    this._createOffscreenCanvases(dimensions);
    
    // Generate initial text mask (this will resize offscreen canvases to match)
    this._generateTextMask();
    
    // Generate noise pattern to match text mask dimensions
    this._generateNoisePattern();
  }

  /**
   * Create offscreen canvases for animation compositing
   * @private
   * @param {Object} dimensions - Canvas dimensions
   */
  _createOffscreenCanvases(dimensions) {
    // Initially create canvases with display dimensions
    // They will be resized to match text mask dimensions when text mask is generated
    this.circleCanvas = document.createElement('canvas');
    this.circleCanvas.width = dimensions.displayWidth;
    this.circleCanvas.height = dimensions.displayHeight;
    this.circleCtx = this.circleCanvas.getContext('2d');
    
    // Composite canvas for final composition
    this.compositeCanvas = document.createElement('canvas');
    this.compositeCanvas.width = dimensions.displayWidth;
    this.compositeCanvas.height = dimensions.displayHeight;
    this.compositeCtx = this.compositeCanvas.getContext('2d');
  }

  /**
   * Generate text mask using TextRenderer
   * @private
   */
  _generateTextMask() {
    const dimensions = this.canvasManager.getCanvasDimensions();
    
    this.textMask = this.textRenderer.createPixelatedTextMask(
      this.config.text,
      this.config.maskBlockSize,
      dimensions.displayWidth,
      dimensions.displayHeight
    );
    
    // Resize offscreen canvases to match text mask dimensions for efficient compositing
    if (this.textMask && this.circleCanvas && this.compositeCanvas) {
      this._resizeOffscreenCanvases(this.textMask.width, this.textMask.height);
    }
  }

  /**
   * Generate noise pattern using NoiseGenerator
   * @private
   */
  _generateNoisePattern() {
    // Generate noise pattern that matches text mask dimensions for efficient tiling
    if (this.textMask) {
      this.noiseCanvas = this.noiseGenerator.createNoiseCanvas(
        this.textMask.width,
        this.textMask.height
      );
    } else {
      // Fallback to display dimensions if no text mask yet
      const dimensions = this.canvasManager.getCanvasDimensions();
      this.noiseCanvas = this.noiseGenerator.createNoiseCanvas(
        dimensions.displayWidth,
        dimensions.displayHeight
      );
    }
  }

  /**
   * Resize offscreen canvases to match text mask dimensions
   * @private
   * @param {number} width - New width for offscreen canvases
   * @param {number} height - New height for offscreen canvases
   */
  _resizeOffscreenCanvases(width, height) {
    // Resize circle canvas
    if (this.circleCanvas) {
      this.circleCanvas.width = width;
      this.circleCanvas.height = height;
      this.circleCtx = this.circleCanvas.getContext('2d');
    }
    
    // Resize composite canvas
    if (this.compositeCanvas) {
      this.compositeCanvas.width = width;
      this.compositeCanvas.height = height;
      this.compositeCtx = this.compositeCanvas.getContext('2d');
    }
  }

  /**
   * Handle canvas resize events
   * @private
   * @param {Object} dimensions - New canvas dimensions
   */
  _handleResize(dimensions) {
    // Recreate offscreen canvases with new dimensions (will be resized to match text mask)
    this._createOffscreenCanvases(dimensions);
    
    // Regenerate text mask first (this will resize offscreen canvases to match)
    this._generateTextMask();
    
    // Then regenerate noise pattern to match text mask dimensions
    this._generateNoisePattern();
  }

  /**
   * Update components when configuration changes
   * @private
   * @param {Object} oldConfig - Previous configuration
   */
  _updateComponentsFromConfig(oldConfig) {
    // Update NoiseGenerator if cellSize changed
    if (oldConfig.cellSize !== this.config.cellSize) {
      this.noiseGenerator.setCellSize(this.config.cellSize);
      this._generateNoisePattern();
    }
    
    // Update TextRenderer configuration
    this.textRenderer.updateConfig(this.config);
    
    // Update AnimationController if stepMs changed
    if (oldConfig.stepMs !== this.config.stepMs) {
      this.animationController.setStepInterval(this.config.stepMs);
    }
    
    // Regenerate text mask if text-related config changed
    if (oldConfig.text !== this.config.text ||
        oldConfig.fontSize !== this.config.fontSize ||
        oldConfig.fontWeight !== this.config.fontWeight ||
        oldConfig.fontFamily !== this.config.fontFamily ||
        oldConfig.maskBlockSize !== this.config.maskBlockSize) {
      this._generateTextMask();
    }
  }

  /**
   * Render a single animation frame
   * @private
   * @param {number} offset - Current animation offset
   */
  _renderFrame(offset) {
    if (this.isDestroyed || !this.isRunning) {
      return;
    }
    
    const ctx = this.canvasManager.getContext();
    const dimensions = this.canvasManager.getCanvasDimensions();
    
    // Clear main canvas and render background noise
    ctx.clearRect(0, 0, dimensions.displayWidth, dimensions.displayHeight);
    this.noiseGenerator.renderDirectNoise(ctx, dimensions.displayWidth, dimensions.displayHeight);
    
    // Render the moving circle animation if we have a text mask
    if (this.textMask && this.noiseCanvas) {
      this._drawMovingCircle(offset);
    }
  }

  /**
   * Draw the moving circle animation with proper canvas compositing
   * Ported from the original drawMovingCircle function
   * @private
   * @param {number} offset - Current animation offset
   */
  _drawMovingCircle(offset) {
    const ctx = this.canvasManager.getContext();
    const dimensions = this.canvasManager.getCanvasDimensions();
    const cx = Math.floor(dimensions.displayWidth / 2);
    const cy = Math.floor(dimensions.displayHeight / 2);
    
    // Ensure we have all required resources
    if (!this.textMask || !this.noiseCanvas || !this.circleCtx || !this.compositeCtx) {
      return;
    }
    
    // Align the text to the grid based on mask block size
    const left = Math.round((cx - this.textMask.width / 2) / this.config.maskBlockSize) * this.config.maskBlockSize;
    const top = Math.round((cy - this.textMask.height / 2) / this.config.maskBlockSize) * this.config.maskBlockSize;
    
    // Calculate moving offset based on step pixels and animation offset
    const movingOffset = (offset * this.config.stepPixels) % this.noiseCanvas.height;
    
    // Render the moving noise into the circle buffer
    this.circleCtx.imageSmoothingEnabled = false;
    this.circleCtx.clearRect(0, 0, this.circleCanvas.width, this.circleCanvas.height);
    
    // Tile the noise pattern vertically with moving offset
    const tileHeight = this.noiseCanvas.height;
    const startY = -tileHeight + (movingOffset % tileHeight);
    
    for (let y = startY; y < this.circleCanvas.height; y += tileHeight) {
      this.circleCtx.drawImage(this.noiseCanvas, 0, y);
    }
    
    // Apply the pixelated text mask using composite operations
    this.compositeCtx.imageSmoothingEnabled = false;
    this.compositeCtx.globalCompositeOperation = 'copy';
    this.compositeCtx.drawImage(this.circleCanvas, 0, 0);
    this.compositeCtx.globalCompositeOperation = 'destination-in';
    this.compositeCtx.drawImage(this.textMask, 0, 0);
    this.compositeCtx.globalCompositeOperation = 'source-over';
    
    // Draw the composited result onto the main canvas
    ctx.drawImage(this.compositeCanvas, left, top);
  }

  /**
   * Clean up all resources
   * @private
   */
  _cleanup() {
    try {
      // Clean up canvas manager
      if (this.canvasManager) {
        this.canvasManager.cleanup();
      }
      
      // Clear text renderer cache
      if (this.textRenderer) {
        this.textRenderer.clearCache();
      }
      
      // Clear references to offscreen canvases
      this.circleCanvas = null;
      this.circleCtx = null;
      this.compositeCanvas = null;
      this.compositeCtx = null;
      this.textMask = null;
      this.noiseCanvas = null;
      
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

// Export the main class
export default AnimatedNoiseText;

// Also provide named export for flexibility
export { AnimatedNoiseText };