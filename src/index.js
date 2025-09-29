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
    // Comprehensive input validation for constructor parameters
    this._validateConstructorInputs(canvas, options);
    
    // Initialize error handling state
    this.initializationErrors = [];
    this.runtimeErrors = [];
    this.errorRecoveryAttempts = 0;
    this.maxRecoveryAttempts = 3;
    
    // Initialize configuration manager with error handling (Requirement 1.4)
    try {
      this.configManager = new ConfigManager();
    } catch (error) {
      throw new Error(`Failed to initialize configuration manager: ${error.message}`);
    }
    
    // Validate and merge configuration with comprehensive error handling
    let configResult;
    try {
      configResult = this.configManager.createConfig(options);
      this.config = configResult.config;
    } catch (error) {
      // Fallback to default configuration if user config is completely invalid
      console.error('Configuration validation failed, using defaults:', error.message);
      this.config = this.configManager.getDefaultConfig();
      this.initializationErrors.push(`Configuration error: ${error.message}`);
    }
    
    // Log warnings if any configuration issues were found
    if (configResult && configResult.warnings.length > 0) {
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
    
    // Initialize all component classes with comprehensive error handling
    this._initializeComponentsWithErrorHandling();
  }

  /**
   * Validate constructor inputs with detailed error messages
   * @private
   * @param {*} canvas - Canvas parameter to validate
   * @param {*} options - Options parameter to validate
   */
  _validateConstructorInputs(canvas, options) {
    // Canvas validation with specific error messages
    if (canvas === null || canvas === undefined) {
      throw new Error('AnimatedNoiseText constructor requires a canvas element as the first parameter. Received: ' + canvas);
    }
    
    if (!(canvas instanceof HTMLCanvasElement)) {
      const actualType = canvas.constructor ? canvas.constructor.name : typeof canvas;
      throw new Error(`AnimatedNoiseText requires an HTMLCanvasElement. Received: ${actualType}. Please pass a valid <canvas> element.`);
    }
    
    // Check if canvas is attached to DOM (warning, not error)
    try {
      if (!canvas.parentNode) {
        console.warn('AnimatedNoiseText: Canvas element is not attached to the DOM. This may cause rendering issues.');
      }
    } catch (error) {
      // Ignore parentNode access errors in test environments
    }
    
    // Check canvas dimensions
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      console.warn('AnimatedNoiseText: Canvas has zero dimensions. Animation may not be visible until canvas is properly sized.');
    }
    
    // Options validation
    if (options !== null && options !== undefined && typeof options !== 'object') {
      throw new Error(`AnimatedNoiseText options must be an object or undefined. Received: ${typeof options}`);
    }
    
    // Check for common canvas context issues
    try {
      const testContext = canvas.getContext('2d');
      if (!testContext) {
        throw new Error('Failed to get 2D rendering context from canvas. This may indicate browser compatibility issues or canvas corruption.');
      }
    } catch (error) {
      throw new Error(`Canvas context validation failed: ${error.message}. Please ensure the canvas element is valid and the browser supports Canvas 2D API.`);
    }
  }

  /**
   * Initialize all components with comprehensive error handling and recovery
   * @private
   */
  _initializeComponentsWithErrorHandling() {
    const componentInitializers = [
      {
        name: 'CanvasManager',
        init: () => new CanvasManager(this.canvas),
        property: 'canvasManager',
        critical: true
      },
      {
        name: 'NoiseGenerator',
        init: () => new NoiseGenerator(this.config.cellSize),
        property: 'noiseGenerator',
        critical: true
      },
      {
        name: 'TextRenderer',
        init: () => new TextRenderer(this.config),
        property: 'textRenderer',
        critical: true
      },
      {
        name: 'AnimationController',
        init: () => new AnimationController(this.config.stepMs),
        property: 'animationController',
        critical: true
      }
    ];

    // Initialize each component with individual error handling
    for (const component of componentInitializers) {
      try {
        this[component.property] = component.init();
      } catch (error) {
        const errorMessage = `Failed to initialize ${component.name}: ${error.message}`;
        this.initializationErrors.push(errorMessage);
        
        if (component.critical) {
          // Clean up any successfully initialized components
          this._cleanup();
          throw new Error(`Critical component initialization failed. ${errorMessage}`);
        } else {
          console.error(errorMessage);
          // Set to null for non-critical components
          this[component.property] = null;
        }
      }
    }

    // Set up resize handling with error recovery
    try {
      if (this.canvasManager) {
        this.canvasManager.handleResize((dimensions) => {
          if (!this.isDestroyed) {
            this._handleResize(dimensions);
          }
        });
      }
    } catch (error) {
      const errorMessage = `Failed to set up resize handling: ${error.message}`;
      this.initializationErrors.push(errorMessage);
      console.error(errorMessage);
    }
    
    // Initialize animation resources with error handling
    try {
      this._initializeResourcesWithErrorHandling();
    } catch (error) {
      // Clean up on resource initialization failure
      this._cleanup();
      throw new Error(`Failed to initialize animation resources: ${error.message}`);
    }

    // Log initialization summary
    if (this.initializationErrors.length > 0) {
      console.warn('AnimatedNoiseText initialized with errors:', this.initializationErrors);
    }
  }

  /**
   * Initialize animation resources with comprehensive error handling
   * @private
   */
  _initializeResourcesWithErrorHandling() {
    try {
      if (!this.canvasManager) {
        throw new Error('CanvasManager not available for resource initialization');
      }

      const dimensions = this.canvasManager.getCanvasDimensions();
      
      // Create offscreen canvases for compositing with error handling
      this._createOffscreenCanvasesWithErrorHandling(dimensions);
      
      // Generate initial text mask with error handling
      this._generateTextMaskWithErrorHandling();
      
      // Generate noise pattern with error handling
      this._generateNoisePatternWithErrorHandling();
      
    } catch (error) {
      throw new Error(`Resource initialization failed: ${error.message}`);
    }
  }

  /**
   * Create offscreen canvases with error handling and fallbacks
   * @private
   * @param {Object} dimensions - Canvas dimensions
   */
  _createOffscreenCanvasesWithErrorHandling(dimensions) {
    try {
      // Validate dimensions
      if (!dimensions || dimensions.displayWidth <= 0 || dimensions.displayHeight <= 0) {
        throw new Error('Invalid canvas dimensions for offscreen canvas creation');
      }

      // Create circle canvas with error handling
      try {
        this.circleCanvas = document.createElement('canvas');
        this.circleCanvas.width = dimensions.displayWidth;
        this.circleCanvas.height = dimensions.displayHeight;
        this.circleCtx = this.circleCanvas.getContext('2d');
        
        if (!this.circleCtx) {
          throw new Error('Failed to get 2D context for circle canvas');
        }
      } catch (error) {
        throw new Error(`Circle canvas creation failed: ${error.message}`);
      }
      
      // Create composite canvas with error handling
      try {
        this.compositeCanvas = document.createElement('canvas');
        this.compositeCanvas.width = dimensions.displayWidth;
        this.compositeCanvas.height = dimensions.displayHeight;
        this.compositeCtx = this.compositeCanvas.getContext('2d');
        
        if (!this.compositeCtx) {
          throw new Error('Failed to get 2D context for composite canvas');
        }
      } catch (error) {
        throw new Error(`Composite canvas creation failed: ${error.message}`);
      }
      
    } catch (error) {
      // Clean up any partially created canvases
      this._cleanupOffscreenCanvases();
      throw error;
    }
  }

  /**
   * Generate text mask with comprehensive error handling
   * @private
   * @param {boolean} allowFailure - If true, creates fallback on error; if false, re-throws errors
   */
  _generateTextMaskWithErrorHandling(allowFailure = true) {
    try {
      if (!this.textRenderer) {
        throw new Error('TextRenderer not available for text mask generation');
      }

      if (!this.canvasManager) {
        throw new Error('CanvasManager not available for text mask generation');
      }

      const dimensions = this.canvasManager.getCanvasDimensions();
      
      this.textMask = this.textRenderer.createPixelatedTextMask(
        this.config.text,
        this.config.maskBlockSize,
        dimensions.displayWidth,
        dimensions.displayHeight
      );
      
      if (!this.textMask) {
        throw new Error('Text mask generation returned null');
      }
      
      // Resize offscreen canvases to match text mask dimensions for efficient compositing
      if (this.circleCanvas && this.compositeCanvas) {
        this._resizeOffscreenCanvasesWithErrorHandling(this.textMask.width, this.textMask.height);
      }
      
    } catch (error) {
      if (!allowFailure) {
        // Re-throw error for resize operations to allow proper error handling
        throw error;
      }
      
      // Create fallback empty mask
      console.error('Text mask generation failed, creating fallback:', error.message);
      this.textMask = this._createFallbackTextMask();
      this.runtimeErrors.push(`Text mask generation error: ${error.message}`);
    }
  }

  /**
   * Generate noise pattern with error handling
   * @private
   */
  _generateNoisePatternWithErrorHandling() {
    try {
      if (!this.noiseGenerator) {
        throw new Error('NoiseGenerator not available for noise pattern generation');
      }

      // Generate noise pattern that matches text mask dimensions for efficient tiling
      if (this.textMask) {
        this.noiseCanvas = this.noiseGenerator.createNoiseCanvas(
          this.textMask.width,
          this.textMask.height
        );
      } else {
        // Fallback to display dimensions if no text mask yet
        if (!this.canvasManager) {
          throw new Error('CanvasManager not available for fallback noise generation');
        }
        const dimensions = this.canvasManager.getCanvasDimensions();
        this.noiseCanvas = this.noiseGenerator.createNoiseCanvas(
          dimensions.displayWidth,
          dimensions.displayHeight
        );
      }
      
      if (!this.noiseCanvas) {
        throw new Error('Noise canvas generation returned null');
      }
      
    } catch (error) {
      // Create fallback noise pattern
      console.error('Noise pattern generation failed, creating fallback:', error.message);
      this.noiseCanvas = this._createFallbackNoiseCanvas();
      this.runtimeErrors.push(`Noise generation error: ${error.message}`);
    }
  }

  /**
   * Handle resize events with error recovery mechanisms
   * @private
   * @param {Object} dimensions - New canvas dimensions
   */
  _handleResizeWithErrorRecovery(dimensions) {
    if (this.isDestroyed) return;
    
    // Store animation state to ensure smooth continuation (Requirement 4.4)
    const wasRunning = this.isRunning;
    
    try {
      // Temporarily pause animation during resize to prevent rendering issues
      if (wasRunning && this.animationController) {
        this.animationController.pause();
      }
      
      // Recreate offscreen canvases with new dimensions (Requirement 4.1)
      this._createOffscreenCanvasesWithErrorHandling(dimensions);
      
      // Regenerate text mask first (Requirement 4.2)
      this._generateTextMaskWithErrorHandling();
      
      // Then regenerate noise pattern to match text mask dimensions (Requirement 4.2)
      this._generateNoisePatternWithErrorHandling();
      
      // Resume animation if it was running, maintaining smooth continuation
      if (wasRunning && this.animationController) {
        this.animationController.resume();
      }
      
      // Reset error recovery attempts on successful resize
      this.errorRecoveryAttempts = 0;
      
    } catch (error) {
      this.errorRecoveryAttempts++;
      const errorMessage = `Resize handling failed (attempt ${this.errorRecoveryAttempts}): ${error.message}`;
      console.error(errorMessage);
      this.runtimeErrors.push(errorMessage);
      
      // Attempt error recovery if under limit
      if (this.errorRecoveryAttempts < this.maxRecoveryAttempts) {
        console.log('Attempting resize error recovery...');
        setTimeout(() => {
          if (!this.isDestroyed) {
            this._attemptResizeRecovery(dimensions, wasRunning);
          }
        }, 1000); // Wait 1 second before retry
      } else {
        console.error('Maximum resize recovery attempts reached. Animation may be unstable.');
        // Force restart animation if it was running
        if (wasRunning && !this.isRunning) {
          try {
            this.start();
          } catch (restartError) {
            console.error('Failed to restart animation after resize recovery failure:', restartError.message);
          }
        }
      }
    }
  }

  /**
   * Attempt to recover from resize errors
   * @private
   * @param {Object} dimensions - Canvas dimensions
   * @param {boolean} wasRunning - Whether animation was running before error
   */
  _attemptResizeRecovery(dimensions, wasRunning) {
    try {
      // Try to reinitialize resources with simpler approach
      this._createOffscreenCanvasesWithErrorHandling(dimensions);
      this._generateTextMaskWithErrorHandling();
      this._generateNoisePatternWithErrorHandling();
      
      if (wasRunning && !this.isRunning) {
        this.start();
      }
      
      console.log('Resize error recovery successful');
      this.errorRecoveryAttempts = 0;
      
    } catch (recoveryError) {
      console.error('Resize recovery failed:', recoveryError.message);
    }
  }

  /**
   * Start the animation with comprehensive error handling (Requirement 3.1)
   */
  start() {
    // Validate instance state
    if (this.isDestroyed) {
      throw new Error('Cannot start animation on destroyed instance. Please create a new AnimatedNoiseText instance.');
    }
    
    if (this.isRunning) {
      return; // Already running
    }
    
    // Validate required components before starting
    const missingComponents = this._validateRequiredComponents();
    if (missingComponents.length > 0) {
      throw new Error(`Cannot start animation. Missing required components: ${missingComponents.join(', ')}. This may indicate initialization failures.`);
    }
    
    try {
      // Validate animation controller specifically
      if (!this.animationController) {
        throw new Error('AnimationController is not available');
      }
      
      // Validate canvas context is still available
      if (!this.canvasManager || !this.canvasManager.getContext()) {
        throw new Error('Canvas context is not available');
      }
      
      // Start animation controller with render callback and error handling
      this.animationController.start((offset) => {
        try {
          this._renderFrameWithErrorHandling(offset);
        } catch (renderError) {
          this._handleRenderError(renderError);
        }
      });
      
      this.isRunning = true;
      
      // Reset error recovery attempts on successful start
      this.errorRecoveryAttempts = 0;
      
    } catch (error) {
      const errorMessage = `Failed to start animation: ${error.message}`;
      console.error(errorMessage);
      this.runtimeErrors.push(errorMessage);
      
      // Attempt recovery if possible
      if (this.errorRecoveryAttempts < this.maxRecoveryAttempts) {
        this.errorRecoveryAttempts++;
        console.log(`Attempting animation start recovery (attempt ${this.errorRecoveryAttempts})...`);
        
        try {
          this._attemptStartRecovery();
        } catch (recoveryError) {
          throw new Error(`Animation start failed and recovery unsuccessful: ${error.message}. Recovery error: ${recoveryError.message}`);
        }
      } else {
        throw new Error(`Animation start failed after ${this.maxRecoveryAttempts} recovery attempts: ${error.message}`);
      }
    }
  }

  /**
   * Stop the animation with comprehensive error handling (Requirement 3.2)
   */
  stop() {
    if (!this.isRunning) {
      return; // Already stopped
    }
    
    try {
      // Stop animation controller
      if (this.animationController) {
        this.animationController.stop();
      } else {
        console.warn('AnimationController not available during stop operation');
      }
      
      this.isRunning = false;
      
    } catch (error) {
      const errorMessage = `Error stopping animation: ${error.message}`;
      console.error(errorMessage);
      this.runtimeErrors.push(errorMessage);
      
      // Force stop even if error occurred
      this.isRunning = false;
      
      // Try to force stop the animation controller
      try {
        if (this.animationController && typeof this.animationController.stop === 'function') {
          this.animationController.stop();
        }
      } catch (forceStopError) {
        console.error('Failed to force stop animation controller:', forceStopError.message);
      }
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
   * Resize offscreen canvases with error handling
   * @private
   * @param {number} width - New width for offscreen canvases
   * @param {number} height - New height for offscreen canvases
   */
  _resizeOffscreenCanvasesWithErrorHandling(width, height) {
    try {
      // Validate dimensions
      if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
        throw new Error(`Invalid canvas dimensions for resize: ${width}x${height}`);
      }

      // Resize circle canvas
      if (this.circleCanvas) {
        this.circleCanvas.width = width;
        this.circleCanvas.height = height;
        this.circleCtx = this.circleCanvas.getContext('2d');
        
        if (!this.circleCtx) {
          throw new Error('Failed to get 2D context for resized circle canvas');
        }
      }
      
      // Resize composite canvas
      if (this.compositeCanvas) {
        this.compositeCanvas.width = width;
        this.compositeCanvas.height = height;
        this.compositeCtx = this.compositeCanvas.getContext('2d');
        
        if (!this.compositeCtx) {
          throw new Error('Failed to get 2D context for resized composite canvas');
        }
      }
      
    } catch (error) {
      throw new Error(`Offscreen canvas resize failed: ${error.message}`);
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
    
    try {
      // Temporarily pause animation during resize to prevent rendering issues
      if (wasRunning && this.animationController) {
        this.animationController.pause();
      }
      
      // Recreate offscreen canvases with new dimensions (Requirement 4.1)
      this._createOffscreenCanvasesWithErrorHandling(dimensions);
      
      // Regenerate text mask first (Requirement 4.2)
      this._generateTextMaskWithErrorHandling();
      
      // Then regenerate noise pattern to match text mask dimensions (Requirement 4.2)
      this._generateNoisePatternWithErrorHandling();
      
      // Resume animation if it was running, maintaining smooth continuation
      if (wasRunning && this.animationController) {
        this.animationController.resume();
      }
      
      // Reset error recovery attempts on successful resize
      this.errorRecoveryAttempts = 0;
      
    } catch (error) {
      this.errorRecoveryAttempts++;
      const errorMessage = `Resize handling failed (attempt ${this.errorRecoveryAttempts}): ${error.message}`;
      console.error('Error during resize handling:', error);
      this.runtimeErrors.push(errorMessage);
      
      // Attempt error recovery if under limit
      if (this.errorRecoveryAttempts < this.maxRecoveryAttempts) {
        console.log('Attempting resize error recovery...');
        setTimeout(() => {
          if (!this.isDestroyed) {
            this._attemptResizeRecovery(dimensions, wasRunning);
          }
        }, 1000); // Wait 1 second before retry
      } else {
        console.error('Maximum resize recovery attempts reached. Animation may be unstable.');
        // Force restart animation if it was running
        if (wasRunning && !this.isRunning) {
          try {
            this.start();
          } catch (restartError) {
            console.error('Failed to restart animation after resize recovery failure:', restartError.message);
          }
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
   * Validate that all required components are available
   * @private
   * @returns {string[]} Array of missing component names
   */
  _validateRequiredComponents() {
    const requiredComponents = [
      { name: 'CanvasManager', component: this.canvasManager },
      { name: 'NoiseGenerator', component: this.noiseGenerator },
      { name: 'TextRenderer', component: this.textRenderer },
      { name: 'AnimationController', component: this.animationController }
    ];
    
    return requiredComponents
      .filter(comp => !comp.component)
      .map(comp => comp.name);
  }

  /**
   * Attempt to recover from animation start failures
   * @private
   */
  _attemptStartRecovery() {
    // Try to reinitialize failed components
    if (!this.animationController) {
      this.animationController = new AnimationController(this.config.stepMs);
    }
    
    if (!this.canvasManager) {
      this.canvasManager = new CanvasManager(this.canvas);
    }
    
    // Try to start again
    this.animationController.start((offset) => {
      try {
        this._renderFrameWithErrorHandling(offset);
      } catch (renderError) {
        this._handleRenderError(renderError);
      }
    });
    
    this.isRunning = true;
  }

  /**
   * Render frame with comprehensive error handling
   * @private
   * @param {number} offset - Current animation offset
   */
  _renderFrameWithErrorHandling(offset) {
    if (this.isDestroyed || !this.isRunning) {
      return;
    }
    
    try {
      // Validate required resources before rendering
      if (!this.canvasManager) {
        throw new Error('CanvasManager not available for rendering');
      }
      
      const ctx = this.canvasManager.getContext();
      if (!ctx) {
        throw new Error('Canvas context not available for rendering');
      }
      
      const dimensions = this.canvasManager.getCanvasDimensions();
      if (!dimensions || dimensions.displayWidth <= 0 || dimensions.displayHeight <= 0) {
        throw new Error('Invalid canvas dimensions for rendering');
      }
      
      // Clear main canvas and render background noise
      ctx.clearRect(0, 0, dimensions.displayWidth, dimensions.displayHeight);
      
      if (this.noiseGenerator) {
        this.noiseGenerator.renderDirectNoise(ctx, dimensions.displayWidth, dimensions.displayHeight);
      }
      
      // Render the moving circle animation if we have a text mask
      if (this.textMask && this.noiseCanvas) {
        this._drawMovingCircleWithErrorHandling(offset);
      }
      
      // Periodic cleanup for memory leak prevention
      this._performPeriodicCleanupWithErrorHandling();
      
    } catch (error) {
      throw new Error(`Frame rendering failed: ${error.message}`);
    }
  }

  /**
   * Handle rendering errors with recovery mechanisms
   * @private
   * @param {Error} error - The rendering error
   */
  _handleRenderError(error) {
    const errorMessage = `Rendering error: ${error.message}`;
    console.error(errorMessage);
    this.runtimeErrors.push(errorMessage);
    
    // Attempt to continue animation despite error
    // This prevents a single frame error from stopping the entire animation
    
    // If we have too many consecutive render errors, stop the animation
    const recentErrors = this.runtimeErrors.slice(-10); // Last 10 errors
    const renderErrors = recentErrors.filter(err => err.includes('Rendering error'));
    
    if (renderErrors.length >= 5) {
      console.error('Too many consecutive rendering errors, stopping animation');
      this.stop();
    }
  }

  /**
   * Draw moving circle with error handling
   * @private
   * @param {number} offset - Current animation offset
   */
  _drawMovingCircleWithErrorHandling(offset) {
    try {
      if (!this.canvasManager) {
        throw new Error('CanvasManager not available');
      }
      
      const ctx = this.canvasManager.getContext();
      if (!ctx) {
        throw new Error('Canvas context not available');
      }
      
      const dimensions = this.canvasManager.getCanvasDimensions();
      const cx = Math.floor(dimensions.displayWidth / 2);
      const cy = Math.floor(dimensions.displayHeight / 2);
      
      // Ensure we have all required resources
      if (!this.textMask || !this.noiseCanvas || !this.circleCtx || !this.compositeCtx) {
        // Try to regenerate missing resources
        if (!this.textMask) {
          this._generateTextMaskWithErrorHandling();
        }
        if (!this.noiseCanvas) {
          this._generateNoisePatternWithErrorHandling();
        }
        if (!this.circleCtx || !this.compositeCtx) {
          this._createOffscreenCanvasesWithErrorHandling(dimensions);
        }
        
        // If still missing resources, skip this frame
        if (!this.textMask || !this.noiseCanvas || !this.circleCtx || !this.compositeCtx) {
          return;
        }
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
      
    } catch (error) {
      throw new Error(`Moving circle rendering failed: ${error.message}`);
    }
  }

  /**
   * Perform periodic cleanup with error handling
   * @private
   */
  _performPeriodicCleanupWithErrorHandling() {
    try {
      this.frameCount++;
      const currentTime = Date.now();
      
      // Perform cleanup every 5 minutes or every 10000 frames, whichever comes first
      if (currentTime - this.lastCleanupTime > this.cleanupInterval || this.frameCount % 10000 === 0) {
        // Clear text renderer cache periodically to prevent memory buildup
        if (this.textRenderer && typeof this.textRenderer.getCacheSize === 'function' && this.textRenderer.getCacheSize() > 100) {
          this.textRenderer.clearCache();
        }
        
        // Force garbage collection hint (if available)
        if (typeof window !== 'undefined' && window.gc) {
          window.gc();
        }
        
        this.lastCleanupTime = currentTime;
        this.frameCount = 0;
      }
      
    } catch (error) {
      console.warn('Error during periodic cleanup:', error.message);
      // Don't throw error for cleanup failures, just log and continue
    }
  }

  /**
   * Resize offscreen canvases with error handling
   * @private
   * @param {number} width - New width for offscreen canvases
   * @param {number} height - New height for offscreen canvases
   */
  _resizeOffscreenCanvasesWithErrorHandling(width, height) {
    try {
      // Validate dimensions
      if (width <= 0 || height <= 0) {
        throw new Error(`Invalid dimensions for canvas resize: ${width}x${height}`);
      }
      
      // Resize circle canvas
      if (this.circleCanvas) {
        this.circleCanvas.width = width;
        this.circleCanvas.height = height;
        this.circleCtx = this.circleCanvas.getContext('2d');
        
        if (!this.circleCtx) {
          throw new Error('Failed to get context after circle canvas resize');
        }
      }
      
      // Resize composite canvas
      if (this.compositeCanvas) {
        this.compositeCanvas.width = width;
        this.compositeCanvas.height = height;
        this.compositeCtx = this.compositeCanvas.getContext('2d');
        
        if (!this.compositeCtx) {
          throw new Error('Failed to get context after composite canvas resize');
        }
      }
      
    } catch (error) {
      throw new Error(`Canvas resize failed: ${error.message}`);
    }
  }

  /**
   * Create fallback text mask for error recovery
   * @private
   * @returns {HTMLCanvasElement} Fallback text mask
   */
  _createFallbackTextMask() {
    try {
      const fallbackCanvas = document.createElement('canvas');
      fallbackCanvas.width = 100;
      fallbackCanvas.height = 50;
      const ctx = fallbackCanvas.getContext('2d');
      
      if (ctx) {
        // Create a simple rectangular mask as fallback
        ctx.fillStyle = '#000';
        ctx.fillRect(10, 10, 80, 30);
      }
      
      return fallbackCanvas;
    } catch (error) {
      console.error('Failed to create fallback text mask:', error.message);
      // Return minimal canvas if even fallback fails
      const minimalCanvas = document.createElement('canvas');
      minimalCanvas.width = 1;
      minimalCanvas.height = 1;
      return minimalCanvas;
    }
  }

  /**
   * Create fallback noise canvas for error recovery
   * @private
   * @returns {HTMLCanvasElement} Fallback noise canvas
   */
  _createFallbackNoiseCanvas() {
    try {
      const fallbackCanvas = document.createElement('canvas');
      fallbackCanvas.width = 100;
      fallbackCanvas.height = 100;
      const ctx = fallbackCanvas.getContext('2d');
      
      if (ctx) {
        // Create a simple checkerboard pattern as fallback
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 100, 100);
        ctx.fillStyle = '#fff';
        for (let y = 0; y < 100; y += 10) {
          for (let x = 0; x < 100; x += 20) {
            ctx.fillRect(x + (y % 20), y, 10, 10);
          }
        }
      }
      
      return fallbackCanvas;
    } catch (error) {
      console.error('Failed to create fallback noise canvas:', error.message);
      // Return minimal canvas if even fallback fails
      const minimalCanvas = document.createElement('canvas');
      minimalCanvas.width = 1;
      minimalCanvas.height = 1;
      return minimalCanvas;
    }
  }

  /**
   * Clean up offscreen canvases
   * @private
   */
  _cleanupOffscreenCanvases() {
    try {
      if (this.circleCanvas) {
        if (this.circleCtx) {
          this.circleCtx.clearRect(0, 0, this.circleCanvas.width, this.circleCanvas.height);
        }
        this.circleCanvas.width = 0;
        this.circleCanvas.height = 0;
        this.circleCanvas = null;
        this.circleCtx = null;
      }
      
      if (this.compositeCanvas) {
        if (this.compositeCtx) {
          this.compositeCtx.clearRect(0, 0, this.compositeCanvas.width, this.compositeCanvas.height);
        }
        this.compositeCanvas.width = 0;
        this.compositeCanvas.height = 0;
        this.compositeCanvas = null;
        this.compositeCtx = null;
      }
    } catch (error) {
      console.error('Error cleaning up offscreen canvases:', error.message);
    }
  }

  /**
   * Get current error status and history
   * @returns {Object} Error status information
   */
  getErrorStatus() {
    return {
      initializationErrors: [...this.initializationErrors],
      runtimeErrors: [...this.runtimeErrors],
      errorRecoveryAttempts: this.errorRecoveryAttempts,
      hasErrors: this.initializationErrors.length > 0 || this.runtimeErrors.length > 0
    };
  }

  /**
   * Clear error history (useful for debugging)
   */
  clearErrorHistory() {
    this.initializationErrors = [];
    this.runtimeErrors = [];
    this.errorRecoveryAttempts = 0;
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

// Export the main class as default
export default AnimatedNoiseText;

// Named exports for main class and all components
export { 
  AnimatedNoiseText,
  CanvasManager,
  NoiseGenerator,
  TextRenderer,
  AnimationController,
  ConfigManager
};