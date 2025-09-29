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
let performanceCounter = 0;

mockPerformanceNow.mockImplementation(() => {
  performanceCounter += 16.67; // 60fps
  return performanceCounter;
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
  animationFrameCallbacks.set(id, callback);
  
  // Simulate async execution
  setTimeout(() => {
    if (animationFrameCallbacks.has(id)) {
      const cb = animationFrameCallbacks.get(id);
      animationFrameCallbacks.delete(id);
      cb(performance.now());
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
  
  // Reset counters
  hrTimeCounter = 0;
  performanceCounter = 0;
  
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