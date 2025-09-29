/**
 * Jest configuration for performance tests
 * Optimized for memory usage and timing accuracy
 */

module.exports = {
  ...require('./jest.config.js'),
  
  // Performance-specific settings
  testTimeout: 60000,
  maxWorkers: 1, // Single worker for consistent performance measurements
  
  // Only run performance tests
  testMatch: [
    '**/tests/performance.test.js'
  ],
  
  // Disable coverage for performance tests to reduce overhead
  collectCoverage: false,
  
  // Performance test specific setup
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup/performance-setup.js'
  ],
  
  // Memory and timing optimizations
  logHeapUsage: true,
  detectOpenHandles: true,
  forceExit: true,
  
  // Custom test environment for performance testing
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    resources: 'usable',
    runScripts: 'dangerously'
  }
};