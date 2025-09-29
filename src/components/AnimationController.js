/**
 * AnimationController - Manages animation loops and timing
 */
class AnimationController {
  constructor(stepMs = 32) {
    this.stepMs = stepMs;
    this.animationId = null;
    this.isRunning = false;
    this.isPaused = false;
    this.animationOffset = 0;
    this.lastFrameTime = 0;
    this.accumulatedTime = 0;
    this.animationCallback = null;
  }

  /**
   * Start the animation loop with comprehensive error handling
   * @param {Function} callback - Function to call on each animation step
   */
  start(callback) {
    // Comprehensive callback validation
    if (callback === null || callback === undefined) {
      throw new Error('AnimationController.start: Animation callback is required');
    }
    
    if (typeof callback !== 'function') {
      throw new Error(`AnimationController.start: Animation callback must be a function. Received: ${typeof callback}`);
    }
    
    // Test callback to ensure it's callable
    try {
      // Create a test call to validate the callback
      if (callback.length > 1) {
        console.warn('AnimationController: Callback expects more than 1 parameter, but only offset will be provided');
      }
    } catch (error) {
      throw new Error(`AnimationController.start: Callback validation failed: ${error.message}`);
    }
    
    // Check if already running
    if (this.isRunning && !this.isPaused) {
      console.warn('AnimationController.start: Animation is already running');
      return;
    }
    
    // Validate step interval
    if (this.stepMs <= 0 || !Number.isFinite(this.stepMs)) {
      throw new Error(`AnimationController.start: Invalid step interval: ${this.stepMs}. Must be a positive finite number.`);
    }
    
    try {
      // Check if performance.now is available
      if (typeof performance === 'undefined' || typeof performance.now !== 'function') {
        throw new Error('performance.now() is not available. This browser may not support high-resolution timing.');
      }
      
      // Check if requestAnimationFrame is available
      if (typeof requestAnimationFrame !== 'function') {
        throw new Error('requestAnimationFrame is not available. This browser may not support smooth animations.');
      }
      
      this.animationCallback = callback;
      this.isRunning = true;
      this.isPaused = false;
      this.lastFrameTime = performance.now();
      this.accumulatedTime = 0;
      
      // Start animation with error handling
      this._animate();
      
    } catch (error) {
      // Reset state on failure
      this.isRunning = false;
      this.isPaused = false;
      this.animationCallback = null;
      throw new Error(`AnimationController.start failed: ${error.message}`);
    }
  }

  /**
   * Stop the animation loop
   */
  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.isRunning = false;
    this.isPaused = false;
    this.animationCallback = null;
  }

  /**
   * Destroy the animation controller and clean up all resources
   * This method ensures complete cleanup for memory leak prevention
   */
  destroy() {
    // Stop any running animation
    this.stop();
    
    // Reset all state to initial values
    this.animationOffset = 0;
    this.lastFrameTime = 0;
    this.accumulatedTime = 0;
    this.stepMs = 32; // Reset to default
    
    // Clear any remaining references
    this.animationCallback = null;
    this.animationId = null;
  }

  /**
   * Pause the animation loop
   */
  pause() {
    if (this.isRunning) {
      this.isPaused = true;
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
    }
  }

  /**
   * Resume the animation loop from pause
   */
  resume() {
    if (this.isRunning && this.isPaused) {
      this.isPaused = false;
      this.lastFrameTime = performance.now();
      this._animate();
    }
  }

  /**
   * Get the current animation offset
   * @returns {number} Current animation offset
   */
  getCurrentOffset() {
    return this.animationOffset;
  }

  /**
   * Set the animation step interval
   * @param {number} stepMs - Step interval in milliseconds
   */
  setStepInterval(stepMs) {
    if (typeof stepMs !== 'number' || stepMs <= 0) {
      throw new Error('Step interval must be a positive number');
    }
    this.stepMs = stepMs;
  }

  /**
   * Check if animation is currently running
   * @returns {boolean} True if running, false otherwise
   */
  isAnimationRunning() {
    return this.isRunning && !this.isPaused;
  }

  /**
   * Check if animation is paused
   * @returns {boolean} True if paused, false otherwise
   */
  isAnimationPaused() {
    return this.isPaused;
  }

  /**
   * Internal animation loop using requestAnimationFrame with comprehensive error handling
   * @private
   */
  _animate() {
    // Early exit conditions
    if (!this.isRunning || this.isPaused) {
      return;
    }

    try {
      // Validate performance.now is still available
      if (typeof performance === 'undefined' || typeof performance.now !== 'function') {
        throw new Error('performance.now() became unavailable during animation');
      }
      
      const currentTime = performance.now();
      
      // Validate timing values
      if (!Number.isFinite(currentTime)) {
        throw new Error(`Invalid current time: ${currentTime}`);
      }
      
      if (!Number.isFinite(this.lastFrameTime)) {
        console.warn('Invalid lastFrameTime, resetting to current time');
        this.lastFrameTime = currentTime;
      }
      
      const deltaTime = currentTime - this.lastFrameTime;
      
      // Handle edge cases with delta time
      if (deltaTime < 0) {
        console.warn('Negative delta time detected, skipping frame');
        this.lastFrameTime = currentTime;
        this._scheduleNextFrame();
        return;
      }
      
      // Cap delta time to prevent large jumps (e.g., when tab becomes inactive)
      const cappedDeltaTime = Math.min(deltaTime, 1000); // Max 1 second
      
      this.lastFrameTime = currentTime;
      this.accumulatedTime += cappedDeltaTime;

      // Only update animation when enough time has passed
      if (this.accumulatedTime >= this.stepMs) {
        const steps = Math.floor(this.accumulatedTime / this.stepMs);
        
        // Validate steps calculation
        if (!Number.isFinite(steps) || steps < 0) {
          console.warn(`Invalid steps calculation: ${steps}, resetting accumulated time`);
          this.accumulatedTime = 0;
          this._scheduleNextFrame();
          return;
        }
        
        // Cap steps to prevent excessive updates
        const cappedSteps = Math.min(steps, 10); // Max 10 steps per frame
        
        this.animationOffset += cappedSteps;
        this.accumulatedTime -= cappedSteps * this.stepMs;

        // Call the animation callback with current offset and error handling
        if (this.animationCallback) {
          try {
            this.animationCallback(this.animationOffset);
          } catch (callbackError) {
            console.error('Animation callback error:', callbackError.message);
            // Continue animation despite callback error
          }
        }
      }

      // Schedule next frame
      this._scheduleNextFrame();
      
    } catch (error) {
      console.error('Animation loop error:', error.message);
      
      // Attempt to continue animation despite error
      try {
        this._scheduleNextFrame();
      } catch (scheduleError) {
        console.error('Failed to schedule next frame, stopping animation:', scheduleError.message);
        this.stop();
      }
    }
  }

  /**
   * Schedule the next animation frame with error handling
   * @private
   */
  _scheduleNextFrame() {
    try {
      if (typeof requestAnimationFrame !== 'function') {
        throw new Error('requestAnimationFrame is not available');
      }
      
      this.animationId = requestAnimationFrame(() => this._animate());
      
      // In test environments, requestAnimationFrame might return 0 or undefined
      if (this.animationId === null || this.animationId === undefined) {
        throw new Error('requestAnimationFrame returned invalid ID');
      }
      
    } catch (error) {
      console.error('Failed to schedule animation frame:', error.message);
      
      // Fallback to setTimeout if requestAnimationFrame fails
      try {
        this.animationId = setTimeout(() => this._animate(), Math.max(16, this.stepMs));
      } catch (timeoutError) {
        console.error('Fallback setTimeout also failed:', timeoutError.message);
        this.stop();
      }
    }
  }
}

export default AnimationController;