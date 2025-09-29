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
    
    // Memory leak prevention for long-running animations
    this.frameCount = 0;
    this.lastCleanupTime = Date.now();
    this.cleanupInterval = 300000; // 5 minutes in milliseconds
    
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
      if (this.animationController) {
        this.animationController.stop();
      }
      this.isRunning = false;
    } catch (error) {
      console.error('Failed to stop animation:', error);
      // Force stop even if error occurred
      this.isRunning = false;
    }
  }

  /**
   * Destroy the animation and clean up resources (Requirement 3.4)
   */
  destroy() {
    if (this.isDestroyed) {
      return; // Already destroyed
    }
    
    try {
      // Stop animation first
      this.stop();
    } catch (error) {
      console.error('Error stopping animation during destroy:', error);
    }
    
    try {
      // Clean up all resources
      this._cleanup();
    } catch (error) {
      console.error('Error during resource cleanup:', error);
    } finally {
      // Always mark as destroyed, even if cleanup failed
      this.isDestroyed = true;
    }
  }

  /**
   * Update the text content dynamically (Requirements 5.1, 5.2, 5.3, 5.4)
   * @param {string} text - New text to display
   */
  setText(text) {
    if (this.isDestroyed) {
      throw new Error('Cannot set text on destroyed instance');
    }
    
    // Handle edge cases for text input (Requirement 5.4)
    const processedText = this._processTextInput(text);
    
    // Check if text actually changed to avoid unnecessary work
    if (processedText === this.config.text) {
      return; // No change needed
    }
    
    // Store animation state to ensure smooth continuation (Requirement 5.3)
    const wasRunning = this.isRunning;
    
    try {
      // Update configuration with new text (Requirement 5.1)
      this.config = { ...this.config, text: processedText };
      
      // Update text renderer configuration
      if (this.textRenderer) {
        this.textRenderer.updateConfig(this.config);
      }
      
      // Regenerate text mask with new text (Requirement 5.2)
      this._generateTextMask();
      
      // Regenerate noise pattern to match new text mask dimensions if needed
      if (this.textMask) {
        this._generateNoisePattern();
      }
      
      // Ensure animation continues without interruption (Requirement 5.3)
      if (wasRunning && !this.isRunning) {
        // Restart animation if it was running but got stopped during text update
        this.start();
      }
      
    } catch (error) {
      console.error('Error updating text:', error);
      // Attempt to restore previous state on error
      throw new Error(`Failed to update text: ${error.message}`);
    }
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
    if (this.isDestroyed) return;
    
    // Store animation state to ensure smooth continuation (Requirement 4.4)
    const wasRunning = this.isRunning;
    const currentOffset = this.animationController ? this.animationController.getCurrentOffset() : 0;
    
    try {
      // Temporarily pause animation during resize to prevent rendering issues
      if (wasRunning) {
        this.animationController.pause();
      }
      
      // Recreate offscreen canvases with new dimensions (Requirement 4.1)
      this._createOffscreenCanvases(dimensions);
      
      // Regenerate text mask first (Requirement 4.2)
      this._generateTextMask();
      
      // Then regenerate noise pattern to match text mask dimensions (Requirement 4.2)
      this._generateNoisePattern();
      
      // Resume animation if it was running, maintaining smooth continuation
      if (wasRunning) {
        this.animationController.resume();
      }
      
    } catch (error) {
      console.error('Error during resize handling:', error);
      
      // Attempt to restart animation if it was running
      if (wasRunning && !this.isRunning) {
        try {
          this.start();
        } catch (restartError) {
          console.error('Failed to restart animation after resize error:', restartError);
        }
      }
    }
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
    
    try {
      const ctx = this.canvasManager.getContext();
      const dimensions = this.canvasManager.getCanvasDimensions();
      
      // Clear main canvas and render background noise
      ctx.clearRect(0, 0, dimensions.displayWidth, dimensions.displayHeight);
      this.noiseGenerator.renderDirectNoise(ctx, dimensions.displayWidth, dimensions.displayHeight);
      
      // Render the moving circle animation if we have a text mask
      if (this.textMask && this.noiseCanvas) {
        this._drawMovingCircle(offset);
      }
      
      // Periodic cleanup for memory leak prevention
      this._performPeriodicCleanup();
      
    } catch (error) {
      console.error('Error during frame rendering:', error);
      // Continue animation even if a single frame fails
    }
  }

  /**
   * Perform periodic cleanup to prevent memory leaks in long-running animations
   * @private
   */
  _performPeriodicCleanup() {
    this.frameCount++;
    const currentTime = Date.now();
    
    // Perform cleanup every 5 minutes or every 10000 frames, whichever comes first
    if (currentTime - this.lastCleanupTime > this.cleanupInterval || this.frameCount % 10000 === 0) {
      try {
        // Clear text renderer cache periodically to prevent memory buildup
        if (this.textRenderer && this.textRenderer.getCacheSize() > 100) {
          this.textRenderer.clearCache();
        }
        
        // Force garbage collection hint (if available)
        if (typeof window !== 'undefined' && window.gc) {
          window.gc();
        }
        
        this.lastCleanupTime = currentTime;
        this.frameCount = 0;
        
      } catch (error) {
        console.warn('Error during periodic cleanup:', error);
      }
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
   * Process text input to handle edge cases and special characters (Requirement 5.4)
   * @private
   * @param {*} text - Input text (any type)
   * @returns {string} Processed text string
   */
  _processTextInput(text) {
    // Handle null, undefined, and non-string inputs
    if (text === null || text === undefined) {
      return '';
    }
    
    // Convert to string if not already
    let processedText = String(text);
    
    // Handle empty strings and whitespace-only strings
    if (processedText.trim() === '') {
      return '';
    }
    
    // Normalize line endings and handle special characters
    processedText = processedText
      .replace(/\r\n/g, '\n')  // Normalize Windows line endings
      .replace(/\r/g, '\n')    // Normalize Mac line endings
      .replace(/\t/g, '    ');  // Convert tabs to spaces for consistent rendering
    
    // Limit text length to prevent performance issues (max 1000 characters)
    if (processedText.length > 1000) {
      processedText = processedText.substring(0, 1000);
      console.warn('Text truncated to 1000 characters for performance reasons');
    }
    
    // Remove or replace problematic characters that might cause rendering issues
    processedText = processedText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters except \n
    
    return processedText;
  }

  /**
   * Clean up all resources
   * @private
   */
  _cleanup() {
    const errors = [];
    
    try {
      // Stop animation controller and clean up
      if (this.animationController) {
        this.animationController.destroy();
        this.animationController = null;
      }
    } catch (error) {
      errors.push(`AnimationController cleanup failed: ${error.message}`);
    }
    
    try {
      // Clean up canvas manager
      if (this.canvasManager) {
        this.canvasManager.cleanup();
        this.canvasManager = null;
      }
    } catch (error) {
      errors.push(`CanvasManager cleanup failed: ${error.message}`);
    }
    
    try {
      // Destroy text renderer
      if (this.textRenderer) {
        this.textRenderer.destroy();
        this.textRenderer = null;
      }
    } catch (error) {
      errors.push(`TextRenderer cleanup failed: ${error.message}`);
    }
    
    try {
      // Destroy noise generator
      if (this.noiseGenerator) {
        this.noiseGenerator.destroy();
        this.noiseGenerator = null;
      }
    } catch (error) {
      errors.push(`NoiseGenerator cleanup failed: ${error.message}`);
    }
    
    try {
      // Clear references to offscreen canvases and contexts
      if (this.circleCanvas) {
        // Clear the canvas before disposing
        if (this.circleCtx) {
          this.circleCtx.clearRect(0, 0, this.circleCanvas.width, this.circleCanvas.height);
        }
        this.circleCanvas.width = 0;
        this.circleCanvas.height = 0;
        this.circleCanvas = null;
        this.circleCtx = null;
      }
      
      if (this.compositeCanvas) {
        // Clear the canvas before disposing
        if (this.compositeCtx) {
          this.compositeCtx.clearRect(0, 0, this.compositeCanvas.width, this.compositeCanvas.height);
        }
        this.compositeCanvas.width = 0;
        this.compositeCanvas.height = 0;
        this.compositeCanvas = null;
        this.compositeCtx = null;
      }
      
      if (this.textMask) {
        // Clear the text mask canvas
        this.textMask.width = 0;
        this.textMask.height = 0;
        this.textMask = null;
      }
      
      if (this.noiseCanvas) {
        // Clear the noise canvas
        this.noiseCanvas.width = 0;
        this.noiseCanvas.height = 0;
        this.noiseCanvas = null;
      }
    } catch (error) {
      errors.push(`Canvas cleanup failed: ${error.message}`);
    }
    
    try {
      // Clear configuration manager reference
      this.configManager = null;
      
      // Clear canvas reference
      this.canvas = null;
      
      // Reset configuration to prevent memory leaks
      this.config = null;
    } catch (error) {
      errors.push(`Reference cleanup failed: ${error.message}`);
    }
    
    // Log any cleanup errors that occurred
    if (errors.length > 0) {
      console.error('Errors occurred during cleanup:', errors);
    }
  }
}

// Export the main class
export default AnimatedNoiseText;

// Also provide named export for flexibility
export { AnimatedNoiseText };