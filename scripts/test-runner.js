#!/usr/bin/env node

/**
 * Comprehensive Test Runner for AnimatedNoiseText Library
 * Provides organized test execution with detailed reporting
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Test suite configurations
const testSuites = {
  unit: {
    name: 'Unit Tests',
    description: 'Tests for individual component classes',
    pattern: 'ConfigManager|CanvasManager|NoiseGenerator|TextRenderer|AnimationController',
    color: colors.green,
    timeout: 30000
  },
  integration: {
    name: 'Integration Tests',
    description: 'Tests for component interaction and main class',
    pattern: 'integration|main-class|animation-pipeline',
    color: colors.blue,
    timeout: 45000
  },
  performance: {
    name: 'Performance Tests',
    description: 'Tests for animation smoothness and memory usage',
    pattern: 'performance',
    color: colors.magenta,
    timeout: 60000,
    env: { NODE_OPTIONS: '--expose-gc' }
  },
  compatibility: {
    name: 'Browser Compatibility Tests',
    description: 'Tests for different browser environments',
    pattern: 'browser-compatibility',
    color: colors.cyan,
    timeout: 45000
  },
  errorHandling: {
    name: 'Error Handling Tests',
    description: 'Tests for error scenarios and recovery',
    pattern: 'error-handling',
    color: colors.yellow,
    timeout: 30000
  },
  resourceCleanup: {
    name: 'Resource Cleanup Tests',
    description: 'Tests for memory management and lifecycle',
    pattern: 'resource-cleanup',
    color: colors.red,
    timeout: 45000,
    env: { NODE_OPTIONS: '--expose-gc' }
  },
  responsive: {
    name: 'Responsive Behavior Tests',
    description: 'Tests for resize handling and adaptation',
    pattern: 'responsive-behavior',
    color: colors.blue,
    timeout: 30000
  },
  dynamicText: {
    name: 'Dynamic Text Update Tests',
    description: 'Tests for text update functionality',
    pattern: 'dynamic-text-update',
    color: colors.green,
    timeout: 30000
  }
};

// Utility functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(title) {
  const border = '='.repeat(title.length + 4);
  log(`\n${border}`, colors.bright);
  log(`  ${title}  `, colors.bright);
  log(`${border}`, colors.bright);
}

function logSubHeader(title, color = colors.cyan) {
  log(`\n${colors.bright}${color}${title}${colors.reset}`);
  log('-'.repeat(title.length), color);
}

function formatTime(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function runCommand(command, options = {}) {
  const startTime = Date.now();
  try {
    const result = execSync(command, {
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: options.timeout || 30000,
      env: { ...process.env, ...options.env },
      ...options
    });
    const endTime = Date.now();
    return {
      success: true,
      output: result,
      duration: endTime - startTime,
      error: null
    };
  } catch (error) {
    const endTime = Date.now();
    return {
      success: false,
      output: error.stdout || '',
      error: error.stderr || error.message,
      duration: endTime - startTime
    };
  }
}

function runTestSuite(suiteKey, suite) {
  logSubHeader(`${suite.name}`, suite.color);
  log(`Description: ${suite.description}`);
  
  const command = `npm test -- --testPathPattern="${suite.pattern}" --verbose --silent`;
  const options = {
    timeout: suite.timeout,
    env: suite.env
  };
  
  log(`Running: ${command}`);
  const result = runCommand(command, options);
  
  if (result.success) {
    log(`✅ ${suite.name} passed (${formatTime(result.duration)})`, colors.green);
    
    // Extract test statistics from output
    const testMatch = result.output.match(/Tests:\s+(\d+)\s+passed/);
    if (testMatch) {
      log(`   ${testMatch[1]} tests passed`, colors.green);
    }
  } else {
    log(`❌ ${suite.name} failed (${formatTime(result.duration)})`, colors.red);
    if (result.error) {
      log(`Error: ${result.error}`, colors.red);
    }
  }
  
  return result;
}

function runCoverageReport() {
  logSubHeader('Coverage Report', colors.yellow);
  
  const command = 'npm test -- --coverage --silent';
  const result = runCommand(command, { timeout: 60000 });
  
  if (result.success) {
    log('✅ Coverage report generated', colors.green);
    
    // Extract coverage summary
    const coverageMatch = result.output.match(/All files\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)/);
    if (coverageMatch) {
      log(`   Statements: ${coverageMatch[1]}%`, colors.cyan);
      log(`   Branches: ${coverageMatch[2]}%`, colors.cyan);
      log(`   Functions: ${coverageMatch[3]}%`, colors.cyan);
      log(`   Lines: ${coverageMatch[4]}%`, colors.cyan);
    }
  } else {
    log('❌ Coverage report failed', colors.red);
  }
  
  return result;
}

function generateTestReport(results) {
  const reportPath = path.join(process.cwd(), 'test-report.json');
  const timestamp = new Date().toISOString();
  
  const report = {
    timestamp,
    summary: {
      total: Object.keys(results).length,
      passed: Object.values(results).filter(r => r.success).length,
      failed: Object.values(results).filter(r => !r.success).length,
      totalDuration: Object.values(results).reduce((sum, r) => sum + r.duration, 0)
    },
    suites: {}
  };
  
  Object.entries(results).forEach(([suiteKey, result]) => {
    const suite = testSuites[suiteKey];
    report.suites[suiteKey] = {
      name: suite.name,
      description: suite.description,
      success: result.success,
      duration: result.duration,
      error: result.error
    };
  });
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\nTest report saved to: ${reportPath}`, colors.cyan);
  
  return report;
}

function printSummary(results, report) {
  logHeader('Test Summary');
  
  log(`Total Suites: ${report.summary.total}`);
  log(`Passed: ${report.summary.passed}`, colors.green);
  log(`Failed: ${report.summary.failed}`, report.summary.failed > 0 ? colors.red : colors.green);
  log(`Total Duration: ${formatTime(report.summary.totalDuration)}`);
  
  if (report.summary.failed > 0) {
    logSubHeader('Failed Suites', colors.red);
    Object.entries(results).forEach(([suiteKey, result]) => {
      if (!result.success) {
        const suite = testSuites[suiteKey];
        log(`❌ ${suite.name}`, colors.red);
      }
    });
  }
  
  // Coverage thresholds
  logSubHeader('Quality Gates', colors.yellow);
  log('Checking quality thresholds...');
  
  const qualityGates = {
    'Test Success Rate': {
      value: (report.summary.passed / report.summary.total) * 100,
      threshold: 100,
      unit: '%'
    }
  };
  
  Object.entries(qualityGates).forEach(([name, gate]) => {
    const passed = gate.value >= gate.threshold;
    const status = passed ? '✅' : '❌';
    const color = passed ? colors.green : colors.red;
    log(`${status} ${name}: ${gate.value.toFixed(1)}${gate.unit} (threshold: ${gate.threshold}${gate.unit})`, color);
  });
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const specificSuite = args[0];
  
  logHeader('AnimatedNoiseText Comprehensive Test Suite');
  
  if (specificSuite && testSuites[specificSuite]) {
    // Run specific test suite
    const suite = testSuites[specificSuite];
    const result = runTestSuite(specificSuite, suite);
    
    if (result.success) {
      log(`\n✅ ${suite.name} completed successfully!`, colors.green);
      process.exit(0);
    } else {
      log(`\n❌ ${suite.name} failed!`, colors.red);
      process.exit(1);
    }
  } else if (specificSuite === 'coverage') {
    // Run coverage report only
    const result = runCoverageReport();
    process.exit(result.success ? 0 : 1);
  } else if (specificSuite === 'list') {
    // List available test suites
    logSubHeader('Available Test Suites', colors.cyan);
    Object.entries(testSuites).forEach(([key, suite]) => {
      log(`${key.padEnd(15)} - ${suite.name}`, suite.color);
      log(`${' '.repeat(17)}${suite.description}`);
    });
    log('\nUsage:');
    log('  npm run test:comprehensive [suite]');
    log('  npm run test:comprehensive coverage');
    log('  npm run test:comprehensive list');
    process.exit(0);
  } else {
    // Run all test suites
    const results = {};
    let hasFailures = false;
    
    // Run each test suite
    for (const [suiteKey, suite] of Object.entries(testSuites)) {
      const result = runTestSuite(suiteKey, suite);
      results[suiteKey] = result;
      
      if (!result.success) {
        hasFailures = true;
      }
    }
    
    // Generate coverage report
    log('\n');
    const coverageResult = runCoverageReport();
    
    // Generate and display report
    const report = generateTestReport(results);
    printSummary(results, report);
    
    if (hasFailures) {
      log('\n❌ Some test suites failed. Check the output above for details.', colors.red);
      process.exit(1);
    } else {
      log('\n✅ All test suites passed successfully!', colors.green);
      process.exit(0);
    }
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log(`\n❌ Uncaught Exception: ${error.message}`, colors.red);
  console.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`\n❌ Unhandled Rejection at: ${promise}, reason: ${reason}`, colors.red);
  process.exit(1);
});

// Run the main function
main().catch((error) => {
  log(`\n❌ Test runner failed: ${error.message}`, colors.red);
  console.error(error.stack);
  process.exit(1);
});