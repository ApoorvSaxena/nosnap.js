/**
 * Unit tests for ConfigManager class
 */

import ConfigManager from '../src/components/ConfigManager.js';

describe('ConfigManager', () => {
  let configManager;

  beforeEach(() => {
    configManager = new ConfigManager();
  });

  describe('constructor', () => {
    test('should create instance with default configuration', () => {
      expect(configManager).toBeInstanceOf(ConfigManager);
      expect(configManager.getDefaultConfig()).toBeDefined();
    });
  });

  describe('getDefaultConfig', () => {
    test('should return default configuration object', () => {
      const defaultConfig = configManager.getDefaultConfig();
      
      expect(defaultConfig).toEqual({
        text: 'HELLO',
        cellSize: 2,
        circleRadius: 300,
        stepPixels: 4,
        stepMs: 32,
        maskBlockSize: 2,
        fontSize: null,
        fontWeight: 900,
        fontFamily: 'sans-serif'
      });
    });

    test('should return a copy, not reference to internal config', () => {
      const config1 = configManager.getDefaultConfig();
      const config2 = configManager.getDefaultConfig();
      
      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe('validateConfigValue', () => {
    test('should validate valid string values', () => {
      const result = configManager.validateConfigValue('text', 'TEST');
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('TEST');
      expect(result.error).toBeUndefined();
    });

    test('should validate valid number values within range', () => {
      const result = configManager.validateConfigValue('cellSize', 5);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe(5);
    });

    test('should reject number values below minimum', () => {
      const result = configManager.validateConfigValue('cellSize', 0);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('below minimum');
      expect(result.sanitizedValue).toBe(1); // Should use minimum value
    });

    test('should reject number values above maximum', () => {
      const result = configManager.validateConfigValue('cellSize', 25);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('above maximum');
      expect(result.sanitizedValue).toBe(20); // Should use maximum value
    });

    test('should handle null fontSize correctly', () => {
      const result = configManager.validateConfigValue('fontSize', null);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe(null);
    });

    test('should validate fontSize number values', () => {
      const result = configManager.validateConfigValue('fontSize', 48);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe(48);
    });

    test('should reject invalid types', () => {
      const result = configManager.validateConfigValue('cellSize', 'invalid');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid type');
      expect(result.sanitizedValue).toBe(2); // Should use default
    });

    test('should reject unknown configuration keys', () => {
      const result = configManager.validateConfigValue('unknownKey', 'value');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Unknown configuration key');
    });

    test('should reject empty strings for non-text fields', () => {
      const result = configManager.validateConfigValue('fontFamily', '');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Empty string not allowed');
      expect(result.sanitizedValue).toBe('sans-serif');
    });

    test('should allow empty strings for text field', () => {
      const result = configManager.validateConfigValue('text', '');
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('');
    });

    test('should handle fontWeight as number', () => {
      const result = configManager.validateConfigValue('fontWeight', 700);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe(700);
    });

    test('should handle fontWeight as string', () => {
      const result = configManager.validateConfigValue('fontWeight', 'bold');
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('bold');
    });
  });

  describe('validateConfig', () => {
    test('should validate valid configuration object', () => {
      const config = {
        text: 'TEST',
        cellSize: 3,
        circleRadius: 250
      };
      
      const result = configManager.validateConfig(config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitizedConfig).toEqual(config);
    });

    test('should collect multiple validation errors', () => {
      const config = {
        cellSize: 0, // Below minimum
        circleRadius: 2000, // Above maximum
        stepMs: 'invalid' // Wrong type
      };
      
      const result = configManager.validateConfig(config);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.sanitizedConfig.cellSize).toBe(1);
      expect(result.sanitizedConfig.circleRadius).toBe(1000);
      expect(result.sanitizedConfig.stepMs).toBe(32);
    });

    test('should handle empty configuration object', () => {
      const result = configManager.validateConfig({});
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitizedConfig).toEqual({});
    });
  });

  describe('mergeWithDefaults', () => {
    test('should merge valid user options with defaults', () => {
      const userOptions = {
        text: 'CUSTOM',
        cellSize: 4
      };
      
      const result = configManager.mergeWithDefaults(userOptions);
      
      expect(result).toEqual({
        text: 'CUSTOM',
        cellSize: 4,
        circleRadius: 300,
        stepPixels: 4,
        stepMs: 32,
        maskBlockSize: 2,
        fontSize: null,
        fontWeight: 900,
        fontFamily: 'sans-serif'
      });
    });

    test('should return defaults when no user options provided', () => {
      const result = configManager.mergeWithDefaults();
      
      expect(result).toEqual(configManager.getDefaultConfig());
    });

    test('should return defaults when user options is null', () => {
      const result = configManager.mergeWithDefaults(null);
      
      expect(result).toEqual(configManager.getDefaultConfig());
    });

    test('should sanitize invalid values in non-strict mode', () => {
      const userOptions = {
        text: 'VALID',
        cellSize: 0, // Invalid - below minimum
        circleRadius: 2000 // Invalid - above maximum
      };
      
      const result = configManager.mergeWithDefaults(userOptions, false);
      
      expect(result.text).toBe('VALID');
      expect(result.cellSize).toBe(1); // Sanitized to minimum
      expect(result.circleRadius).toBe(1000); // Sanitized to maximum
    });

    test('should throw error in strict mode with invalid values', () => {
      const userOptions = {
        cellSize: 0 // Invalid
      };
      
      expect(() => {
        configManager.mergeWithDefaults(userOptions, true);
      }).toThrow('Configuration validation failed');
    });

    test('should throw error in strict mode with non-object input', () => {
      expect(() => {
        configManager.mergeWithDefaults('invalid', true);
      }).toThrow('Configuration options must be an object');
    });

    test('should handle non-object input gracefully in non-strict mode', () => {
      const result = configManager.mergeWithDefaults('invalid', false);
      
      expect(result).toEqual(configManager.getDefaultConfig());
    });
  });

  describe('createConfig', () => {
    test('should create valid configuration with no warnings', () => {
      const userOptions = {
        text: 'TEST',
        cellSize: 3
      };
      
      const result = configManager.createConfig(userOptions);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
      expect(result.config.text).toBe('TEST');
      expect(result.config.cellSize).toBe(3);
    });

    test('should create configuration with warnings for invalid values', () => {
      const userOptions = {
        text: 'TEST',
        cellSize: 0 // Invalid
      };
      
      const result = configManager.createConfig(userOptions);
      
      expect(result.isValid).toBe(false);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('below minimum');
      expect(result.config.cellSize).toBe(1); // Sanitized value
    });

    test('should handle empty user options', () => {
      const result = configManager.createConfig();
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
      expect(result.config).toEqual(configManager.getDefaultConfig());
    });

    test('should handle null user options', () => {
      const result = configManager.createConfig(null);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
      expect(result.config).toEqual(configManager.getDefaultConfig());
    });

    test('should fallback to defaults on unexpected errors', () => {
      // Mock validateConfig to throw an error
      const originalValidateConfig = configManager.validateConfig;
      configManager.validateConfig = jest.fn(() => {
        throw new Error('Unexpected error');
      });
      
      const result = configManager.createConfig({ text: 'TEST' });
      
      expect(result.isValid).toBe(false);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Configuration error');
      expect(result.config).toEqual(configManager.getDefaultConfig());
      
      // Restore original method
      configManager.validateConfig = originalValidateConfig;
    });
  });

  describe('integration tests', () => {
    test('should handle complex configuration scenarios', () => {
      const userOptions = {
        text: 'COMPLEX TEST',
        cellSize: 3,
        circleRadius: 400,
        stepPixels: 6,
        stepMs: 50,
        maskBlockSize: 3,
        fontSize: 72,
        fontWeight: 'bold',
        fontFamily: 'Arial'
      };
      
      const result = configManager.createConfig(userOptions);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
      expect(result.config).toEqual(userOptions);
    });

    test('should handle mixed valid and invalid options', () => {
      const userOptions = {
        text: 'MIXED',
        cellSize: 25, // Invalid - above max
        circleRadius: 350, // Valid
        stepMs: 10, // Invalid - below min
        fontSize: null, // Valid
        fontWeight: 600 // Valid
      };
      
      const result = configManager.createConfig(userOptions);
      
      expect(result.isValid).toBe(false);
      expect(result.warnings).toHaveLength(2); // cellSize and stepMs errors
      expect(result.config.text).toBe('MIXED');
      expect(result.config.cellSize).toBe(20); // Clamped to max
      expect(result.config.circleRadius).toBe(350);
      expect(result.config.stepMs).toBe(16); // Clamped to min
      expect(result.config.fontSize).toBe(null);
      expect(result.config.fontWeight).toBe(600);
    });
  });
});