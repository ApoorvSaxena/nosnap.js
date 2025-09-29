/**
 * Performance test setup
 * Configures environment for accurate performance measurements
 */

// Increase timeout for performance tests
jest.setTimeout(60000);

// Mock high-resolution timer for consistent measurements
const mockHrTime = jest.fn();
let hrTimeCounter = 0;

mockHrTime.mockImplementation(() => {
  hrTimeCounter += 16666667; // Simulate 60fps (16.67ms per frame in nanoseconds)
  return [0, hrTimeCounter];
});

// Override process.hrtime for performance tests
process.hrtime = mockHrTime;

// Mock performance.now with high precision
const mockPerformanceNow = jest.fn();
let performanceCounter = 16.67; // Start with a valid time

mockPerformanceNow.mockImplementation(() => {
  performanceCounter += 16.67; // 60fps
  // Ensure we always return a valid finite number
  const result = Number.isFinite(performanceCounter) ? performanceCounter : (performanceCounter = 16.67);
  return result;
});

Object.defineProperty(global, 'performance', {
  value: {
    now: mockPerformanceNow,
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => [])
  },
  writable: true,
  configurable: true
});

// Memory usage tracking
const originalMemoryUsage = process.memoryUsage;
let memorySnapshots = [];

process.memoryUsage = jest.fn(() => {
  const usage = originalMemoryUsage();
  memorySnapshots.push({
    timestamp: Date.now(),
    ...usage
  });
  return usage;
});

// Garbage collection helper
if (global.gc) {
  global.forceGC = () => {
    global.gc();
    // Allow some time for GC to complete
    return new Promise(resolve => setTimeout(resolve, 100));
  };
} else {
  global.forceGC = () => Promise.resolve();
}

// Performance measurement utilities
global.measurePerformance = (name, fn) => {
  const startTime = performance.now();
  const startMemory = process.memoryUsage();
  
  const result = fn();
  
  const endTime = performance.now();
  const endMemory = process.memoryUsage();
  
  return {
    name,
    result,
    duration: endTime - startTime,
    memoryDelta: {
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      external: endMemory.external - startMemory.external
    }
  };
};

// Animation frame simulation
let animationFrameId = 0;
const animationFrameCallbacks = new Map();

global.requestAnimationFrame = jest.fn((callback) => {
  const id = ++animationFrameId;
  
  // Ensure we have a valid ID
  if (id <= 0 || !Number.isFinite(id)) {
    console.warn('Invalid animation frame ID generated, using fallback');
    return 1;
  }
  
  animationFrameCallbacks.set(id, callback);
  
  // Simulate async execution
  setTimeout(() => {
    if (animationFrameCallbacks.has(id)) {
      const cb = animationFrameCallbacks.get(id);
      animationFrameCallbacks.delete(id);
      try {
        const timestamp = performance.now();
        // Ensure timestamp is valid before calling callback
        if (typeof timestamp === 'number' && Number.isFinite(timestamp)) {
          cb(timestamp);
        }
      } catch (error) {
        // Ignore callback errors in test environment
      }
    }
  }, 16);
  
  return id;
});

global.cancelAnimationFrame = jest.fn((id) => {
  animationFrameCallbacks.delete(id);
});

// Cleanup after each test
afterEach(() => {
  // Clear animation frame callbacks
  animationFrameCallbacks.clear();
  
  // Reset counters but ensure they start from a valid value
  hrTimeCounter = 16666667; // Start from a valid time
  performanceCounter = 16.67; // Start from a valid time
  
  // Clear memory snapshots
  memorySnapshots = [];
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
});

// Performance test utilities
global.performanceTestUtils = {
  simulateFrames: (count = 60, fps = 60) => {
    const frameTime = 1000 / fps;
    const promises = [];
    
    for (let i = 0; i < count; i++) {
      promises.push(new Promise(resolve => {
        setTimeout(() => {
          // Trigger any pending animation frames
          const callbacks = Array.from(animationFrameCallbacks.values());
          animationFrameCallbacks.clear();
          
          callbacks.forEach(callback => {
            try {
              callback(performance.now());
            } catch (error) {
              // Ignore callback errors in simulation
            }
          });
          
          resolve();
        }, i * frameTime);
      }));
    }
    
    return Promise.all(promises);
  },
  
  measureMemoryUsage: () => {
    return process.memoryUsage();
  },
  
  getMemorySnapshots: () => {
    return [...memorySnapshots];
  },
  
  clearMemorySnapshots: () => {
    memorySnapshots = [];
  }
};