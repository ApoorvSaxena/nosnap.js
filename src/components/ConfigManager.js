/**
 * ConfigManager - Handles configuration validation and management
 * Provides default configuration and validates user input
 */

/**
 * Default configuration object with all supported options
 */
const DEFAULT_CONFIG = {
  text: 'HELLO',
  cellSize: 2,
  circleRadius: 300,
  stepPixels: 4,
  stepMs: 32,
  maskBlockSize: 2,
  fontSize: null, // Auto-calculated if null
  fontWeight: 900,
  fontFamily: 'sans-serif'
};

/**
 * Configuration validation rules
 */
const VALIDATION_RULES = {
  text: {
    type: 'string',
    required: false,
    default: DEFAULT_CONFIG.text
  },
  cellSize: {
    type: 'number',
    required: false,
    min: 1,
    max: 20,
    default: DEFAULT_CONFIG.cellSize
  },
  circleRadius: {
    type: 'number',
    required: false,
    min: 50,
    max: 1000,
    default: DEFAULT_CONFIG.circleRadius
  },
  stepPixels: {
    type: 'number',
    required: false,
    min: 1,
    max: 20,
    default: DEFAULT_CONFIG.stepPixels
  },
  stepMs: {
    type: 'number',
    required: false,
    min: 16,
    max: 200,
    default: DEFAULT_CONFIG.stepMs
  },
  maskBlockSize: {
    type: 'number',
    required: false,
    min: 1,
    max: 10,
    default: DEFAULT_CONFIG.maskBlockSize
  },
  fontSize: {
    type: ['number', 'null'],
    required: false,
    min: 10,
    max: 500,
    default: DEFAULT_CONFIG.fontSize
  },
  fontWeight: {
    type: ['number', 'string'],
    required: false,
    default: DEFAULT_CONFIG.fontWeight
  },
  fontFamily: {
    type: 'string',
    required: false,
    default: DEFAULT_CONFIG.fontFamily
  }
};

/**
 * ConfigManager class for handling configuration validation and merging
 */
class ConfigManager {
  /**
   * Create a new ConfigManager instance
   */
  constructor() {
    this.defaultConfig = { ...DEFAULT_CONFIG };
    this.validationRules = { ...VALIDATION_RULES };
  }

  /**
   * Get the default configuration object
   * @returns {Object} Default configuration
   */
  getDefaultConfig() {
    return { ...this.defaultConfig };
  }

  /**
   * Validate a single configuration value
   * @param {string} key - Configuration key
   * @param {*} value - Value to validate
   * @returns {Object} Validation result with isValid and sanitizedValue
   */
  validateConfigValue(key, value) {
    const rule = this.validationRules[key];
    
    if (!rule) {
      return {
        isValid: false,
        error: `Unknown configuration key: ${key}`,
        sanitizedValue: undefined
      };
    }

    // Handle null values for fontSize
    if (value === null && Array.isArray(rule.type) && rule.type.includes('null')) {
      return {
        isValid: true,
        sanitizedValue: null
      };
    }

    // Type checking
    const expectedTypes = Array.isArray(rule.type) ? rule.type : [rule.type];
    const actualType = typeof value;
    
    if (!expectedTypes.includes(actualType)) {
      return {
        isValid: false,
        error: `Invalid type for ${key}. Expected ${expectedTypes.join(' or ')}, got ${actualType}`,
        sanitizedValue: rule.default
      };
    }

    // Range validation for numbers
    if (actualType === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        return {
          isValid: false,
          error: `Value for ${key} (${value}) is below minimum (${rule.min})`,
          sanitizedValue: rule.min
        };
      }
      
      if (rule.max !== undefined && value > rule.max) {
        return {
          isValid: false,
          error: `Value for ${key} (${value}) is above maximum (${rule.max})`,
          sanitizedValue: rule.max
        };
      }
    }

    // String validation
    if (actualType === 'string' && value.trim() === '' && key !== 'text') {
      return {
        isValid: false,
        error: `Empty string not allowed for ${key}`,
        sanitizedValue: rule.default
      };
    }

    return {
      isValid: true,
      sanitizedValue: value
    };
  }

  /**
   * Validate an entire configuration object
   * @param {Object} config - Configuration object to validate
   * @returns {Object} Validation result with isValid, errors, and sanitizedConfig
   */
  validateConfig(config) {
    const errors = [];
    const sanitizedConfig = {};

    // Validate each provided configuration value
    for (const [key, value] of Object.entries(config)) {
      const validation = this.validateConfigValue(key, value);
      
      if (!validation.isValid) {
        errors.push(validation.error);
      }
      
      sanitizedConfig[key] = validation.sanitizedValue;
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedConfig
    };
  }

  /**
   * Merge user options with default configuration
   * @param {Object} userOptions - User-provided configuration options
   * @param {boolean} strict - If true, throw errors for invalid values. If false, use fallbacks
   * @returns {Object} Merged and validated configuration
   */
  mergeWithDefaults(userOptions = {}, strict = false) {
    // Start with default configuration
    const mergedConfig = { ...this.defaultConfig };

    // If no user options provided, return defaults
    if (!userOptions || typeof userOptions !== 'object') {
      if (strict && userOptions !== undefined) {
        throw new Error('Configuration options must be an object');
      }
      return mergedConfig;
    }

    // Validate user options
    const validation = this.validateConfig(userOptions);

    if (strict && !validation.isValid) {
      throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
    }

    // Merge validated options with defaults
    Object.assign(mergedConfig, validation.sanitizedConfig);

    return mergedConfig;
  }

  /**
   * Create a configuration with validation and error reporting
   * @param {Object} userOptions - User-provided configuration options
   * @returns {Object} Result with config and any warnings
   */
  createConfig(userOptions = {}) {
    const warnings = [];
    
    try {
      // Handle null or non-object inputs
      if (!userOptions || typeof userOptions !== 'object') {
        return {
          config: this.getDefaultConfig(),
          warnings: [],
          isValid: true
        };
      }

      const validation = this.validateConfig(userOptions);
      const config = this.mergeWithDefaults(userOptions, false);
      
      // Collect warnings for invalid values that were sanitized
      if (!validation.isValid) {
        warnings.push(...validation.errors);
      }
      
      return {
        config,
        warnings,
        isValid: validation.isValid
      };
    } catch (error) {
      // Fallback to defaults if something goes wrong
      return {
        config: this.getDefaultConfig(),
        warnings: [`Configuration error: ${error.message}. Using defaults.`],
        isValid: false
      };
    }
  }
}

export default ConfigManager;