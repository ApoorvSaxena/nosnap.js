# AnimatedNoiseText Test Suite

This directory contains a comprehensive test suite for the AnimatedNoiseText library, covering all aspects of functionality, performance, and browser compatibility.

## Test Structure

### Unit Tests
- **ConfigManager.test.js** - Configuration management and validation (32 tests)
- **CanvasManager.test.js** - Canvas setup, resize handling, and cleanup (24 tests)
- **NoiseGenerator.test.js** - Noise generation and cell size management (15 tests)
- **TextRenderer.test.js** - Text mask creation and font sizing (25 tests)
- **AnimationController.test.js** - Animation lifecycle and timing (19 tests)

### Integration Tests
- **main-class.test.js** - Main class API and component integration (15 tests)
- **integration.test.js** - Configuration integration and component interaction (10 tests)
- **animation-pipeline.test.js** - Animation rendering pipeline (17 tests)

### Feature-Specific Tests
- **dynamic-text-update.test.js** - Dynamic text update functionality (25 tests)
- **responsive-behavior.test.js** - Resize handling and responsive behavior (13 tests)

### Quality Assurance Tests
- **error-handling.test.js** - Comprehensive error handling scenarios (35 tests)
- **error-handling-unit.test.js** - Unit-level error handling (17 tests)
- **resource-cleanup.test.js** - Memory management and lifecycle (26 tests)
- **performance.test.js** - Animation smoothness and performance (13 tests)
- **browser-compatibility.test.js** - Cross-browser compatibility (25 tests)

## Test Utilities

### Mock Utilities
- **test-utils/canvas-mock.js** - Comprehensive canvas and context mocking
- **setup/performance-setup.js** - Performance testing environment setup

### Test Infrastructure
- **scripts/test-runner.js** - Comprehensive test runner with detailed reporting
- **.github/workflows/test.yml** - Automated CI/CD testing pipeline

## Running Tests

### Basic Test Commands
```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm run test:watch
```

### Comprehensive Test Commands
```bash
# Run comprehensive test suite with detailed reporting
npm run test:comprehensive

# Run specific test categories
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:performance    # Performance tests only
npm run test:compatibility  # Browser compatibility tests only
npm run test:errors         # Error handling tests only
npm run test:cleanup        # Resource cleanup tests only
npm run test:responsive     # Responsive behavior tests only
npm run test:dynamic        # Dynamic text update tests only

# Run coverage report
npm run test:coverage

# Run CI-optimized tests
npm run test:ci
```

### Test Runner Options
```bash
# List available test suites
npm run test:comprehensive list

# Run specific test suite
npm run test:comprehensive unit
npm run test:comprehensive performance

# Generate coverage report only
npm run test:comprehensive coverage
```

## Test Coverage

Current test coverage metrics:
- **Statements**: 83.84%
- **Branches**: 85.91%
- **Functions**: 89.06%
- **Lines**: 83.69%

### Coverage by Component
- **ConfigManager**: 100% (fully covered)
- **TextRenderer**: 93.6% statements, 95.18% branches
- **NoiseGenerator**: 80.72% statements, 89.23% branches
- **AnimationController**: 76.06% statements, 83.58% branches
- **CanvasManager**: 75.62% statements, 69.23% branches

## Test Categories

### 1. Unit Tests (115 tests)
Tests individual component classes in isolation:
- Constructor validation
- Method functionality
- Error handling
- State management
- Configuration handling

### 2. Integration Tests (42 tests)
Tests component interaction and full system behavior:
- Component initialization
- Configuration propagation
- Animation pipeline
- Resource coordination

### 3. Performance Tests (13 tests)
Tests animation smoothness and resource efficiency:
- Frame rate consistency
- Memory usage optimization
- Resize performance
- Configuration update efficiency

### 4. Browser Compatibility Tests (25 tests)
Tests cross-browser support and graceful degradation:
- Modern browser support (Chrome, Firefox, Safari, Edge)
- Device pixel ratio handling
- Animation API compatibility
- Canvas API support
- ResizeObserver fallbacks
- Module system compatibility

### 5. Error Handling Tests (52 tests)
Tests comprehensive error scenarios and recovery:
- Constructor error handling
- Runtime error management
- Component-specific errors
- Recovery mechanisms
- Memory management errors

### 6. Feature-Specific Tests (79 tests)
Tests specific library features:
- Dynamic text updates (25 tests)
- Responsive behavior (13 tests)
- Resource cleanup (26 tests)
- Animation pipeline (17 tests)

## Automated Testing Pipeline

The test suite includes a comprehensive GitHub Actions workflow that runs:

### Multi-Environment Testing
- **Cross-Platform**: Ubuntu, Windows, macOS
- **Multi-Version**: Node.js 16.x, 18.x, 20.x
- **Parallel Execution**: Optimized for CI/CD performance

### Test Jobs
1. **Unit Tests** - Component-level testing
2. **Integration Tests** - System-level testing
3. **Performance Tests** - Animation and memory performance
4. **Browser Compatibility** - Cross-browser support
5. **Error Handling** - Error scenarios and recovery
6. **Resource Cleanup** - Memory management
7. **Cross-Platform** - Platform compatibility
8. **Build and Test** - Distribution testing
9. **Lint and Format** - Code quality
10. **Security Audit** - Dependency security

### Quality Gates
- **Test Success Rate**: 100% (all tests must pass)
- **Coverage Thresholds**: Monitored and reported
- **Performance Benchmarks**: Animation smoothness validation
- **Security Checks**: Dependency vulnerability scanning

## Test Development Guidelines

### Writing New Tests
1. Use the existing mock utilities in `test-utils/`
2. Follow the established naming conventions
3. Include both positive and negative test cases
4. Add performance considerations for animation tests
5. Ensure proper cleanup in `afterEach` hooks

### Mock Usage
- Use `createMockCanvas()` for canvas elements
- Use `createMockWindow()` for window object mocking
- Use `setupGlobalCanvasMock()` for global canvas mocking
- Follow the established mock patterns for consistency

### Performance Testing
- Use the performance setup utilities
- Avoid memory-intensive operations in tests
- Include proper cleanup to prevent memory leaks
- Use realistic test scenarios

### Browser Compatibility Testing
- Test feature detection rather than full initialization
- Use environment mocking for different browser scenarios
- Focus on graceful degradation testing
- Validate API availability checks

## Maintenance

### Regular Tasks
- Review and update test coverage
- Add tests for new features
- Update browser compatibility tests for new browsers
- Monitor performance test thresholds
- Update CI/CD pipeline as needed

### Performance Monitoring
- Track test execution time
- Monitor memory usage during tests
- Update performance benchmarks
- Optimize slow tests

### Coverage Goals
- Maintain >80% statement coverage
- Maintain >85% branch coverage
- Achieve 100% function coverage
- Focus on critical path coverage

## Troubleshooting

### Common Issues
- **Canvas Context Errors**: Ensure proper mock setup
- **Animation Frame Errors**: Use proper requestAnimationFrame mocking
- **Memory Issues**: Include proper cleanup in tests
- **Timing Issues**: Use deterministic timing in tests

### Debug Commands
```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test file
npm test -- tests/specific-test.test.js

# Run tests with debugging
npm test -- --detectOpenHandles --forceExit

# Run tests with coverage details
npm test -- --coverage --verbose
```

This comprehensive test suite ensures the AnimatedNoiseText library maintains high quality, performance, and compatibility across different environments and use cases.