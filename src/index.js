/**
 * Animated Noise Text Library
 * A JavaScript library for creating animated noise text effects on HTML5 canvas
 */

// Import component classes (to be implemented in later tasks)
// import CanvasManager from './components/CanvasManager.js';
// import NoiseGenerator from './components/NoiseGenerator.js';
// import TextRenderer from './components/TextRenderer.js';
// import AnimationController from './components/AnimationController.js';
import ConfigManager from './components/ConfigManager.js';

/**
 * Main AnimatedNoiseText class
 * Entry point for the library that orchestrates all components
 */
class AnimatedNoiseText {
  constructor(canvas, options = {}) {
    // Initialize configuration manager
    this.configManager = new ConfigManager();
    
    // Validate and merge configuration
    const configResult = this.configManager.createConfig(options);
    this.config = configResult.config;
    
    // Log warnings if any configuration issues were found
    if (configResult.warnings.length > 0) {
      console.warn('AnimatedNoiseText configuration warnings:', configResult.warnings);
    }
    
    // Store canvas reference
    this.canvas = canvas;
    this.isRunning = false;
    
    // Placeholder for other components - will be completed in later tasks
  }

  /**
   * Start the animation
   */
  start() {
    // To be implemented in later tasks
    this.isRunning = true;
  }

  /**
   * Stop the animation
   */
  stop() {
    // To be implemented in later tasks
    this.isRunning = false;
  }

  /**
   * Destroy the animation and clean up resources
   */
  destroy() {
    // To be implemented in later tasks
    this.stop();
  }

  /**
   * Update the text content
   * @param {string} text - New text to display
   */
  setText(text) {
    // Update configuration with new text
    this.updateConfig({ text });
    
    // TODO: Trigger text mask regeneration
    // This will be implemented in later tasks when TextRenderer is available
  }

  /**
   * Update configuration options
   * @param {Object} newOptions - New configuration options
   */
  updateConfig(newOptions) {
    // Merge new options with existing configuration
    const mergedOptions = { ...this.config, ...newOptions };
    const configResult = this.configManager.createConfig(mergedOptions);
    
    this.config = configResult.config;
    
    // Log warnings if any configuration issues were found
    if (configResult.warnings.length > 0) {
      console.warn('AnimatedNoiseText configuration warnings:', configResult.warnings);
    }
    
    // TODO: Trigger re-initialization of components that depend on config
    // This will be implemented in later tasks when other components are available
  }
}

// Export the main class
export default AnimatedNoiseText;

// Also provide named export for flexibility
export { AnimatedNoiseText };