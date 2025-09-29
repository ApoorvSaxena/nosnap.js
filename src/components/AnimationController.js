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
   * Start the animation loop
   * @param {Function} callback - Function to call on each animation step
   */
  start(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Animation callback must be a function');
    }

    this.animationCallback = callback;
    this.isRunning = true;
    this.isPaused = false;
    this.lastFrameTime = performance.now();
    this.accumulatedTime = 0;
    
    this._animate();
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
   * Internal animation loop using requestAnimationFrame
   * @private
   */
  _animate() {
    if (!this.isRunning || this.isPaused) {
      return;
    }

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;
    
    this.accumulatedTime += deltaTime;

    // Only update animation when enough time has passed
    if (this.accumulatedTime >= this.stepMs) {
      const steps = Math.floor(this.accumulatedTime / this.stepMs);
      this.animationOffset += steps;
      this.accumulatedTime -= steps * this.stepMs;

      // Call the animation callback with current offset
      if (this.animationCallback) {
        this.animationCallback(this.animationOffset);
      }
    }

    // Schedule next frame
    this.animationId = requestAnimationFrame(() => this._animate());
  }
}

export default AnimationController;