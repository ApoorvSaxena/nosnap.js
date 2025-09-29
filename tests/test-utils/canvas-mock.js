/**
 * Shared canvas mock utilities for tests
 */

/**
 * Creates a comprehensive mock canvas with all required methods and properties
 * @param {Object} options - Optional configuration for the mock
 * @returns {Object} Mock canvas element
 */
export function createMockCanvas(options = {}) {
  const {
    width = 800,
    height = 600,
    contextFailure = false
  } = options;

  // Create comprehensive mock context with all Canvas 2D API methods
  const mockContext = {
    canvas: null,
    // Drawing methods
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    clearRect: jest.fn(),
    
    // Path methods
    beginPath: jest.fn(),
    closePath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    arc: jest.fn(),
    rect: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    
    // Text methods
    fillText: jest.fn(),
    strokeText: jest.fn(),
    measureText: jest.fn(() => ({ width: 100 })),
    
    // Transform methods
    save: jest.fn(),
    restore: jest.fn(),
    scale: jest.fn(),
    translate: jest.fn(),
    rotate: jest.fn(),
    transform: jest.fn(),
    setTransform: jest.fn(),
    resetTransform: jest.fn(),
    
    // Image methods
    drawImage: jest.fn(),
    getImageData: jest.fn(() => {
      // Create mock image data with some non-zero alpha values to simulate text
      const data = new Uint8ClampedArray(width * height * 4);
      // Add some fake text pixels in the middle
      for (let i = 100000; i < 100100; i += 4) {
        if (i < data.length) {
          data[i + 3] = 255; // Alpha channel
        }
      }
      return { data, width, height };
    }),
    putImageData: jest.fn(),
    createImageData: jest.fn(() => ({
      data: new Uint8ClampedArray(width * height * 4),
      width,
      height
    })),
    
    // Properties
    fillStyle: '',
    strokeStyle: '',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    font: '',
    textAlign: '',
    textBaseline: '',
    imageSmoothingEnabled: true,
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    miterLimit: 10,
    shadowBlur: 0,
    shadowColor: 'rgba(0, 0, 0, 0)',
    shadowOffsetX: 0,
    shadowOffsetY: 0
  };

  const mockCanvas = {
    width,
    height,
    style: {
      width: `${width}px`,
      height: `${height}px`
    },
    getContext: jest.fn(() => contextFailure ? null : mockContext),
    getBoundingClientRect: jest.fn(() => ({
      width,
      height,
      top: 0,
      left: 0,
      right: width,
      bottom: height,
      x: 0,
      y: 0
    })),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    parentNode: document.body,
    
    // Additional canvas methods that might be used
    toDataURL: jest.fn(() => 'data:image/png;base64,mock'),
    toBlob: jest.fn((callback) => callback(new Blob())),
    
    // Canvas size properties
    clientWidth: width,
    clientHeight: height,
    offsetWidth: width,
    offsetHeight: height
  };

  // Make it pass instanceof check
  Object.setPrototypeOf(mockCanvas, HTMLCanvasElement.prototype);
  mockContext.canvas = mockCanvas;

  return mockCanvas;
}

/**
 * Creates a mock canvas that will fail context creation
 * @returns {Object} Mock canvas that fails getContext
 */
export function createFailingMockCanvas() {
  return createMockCanvas({ contextFailure: true });
}

/**
 * Sets up global mocks for document.createElement to return mock canvases
 */
export function setupGlobalCanvasMock() {
  const originalCreateElement = document.createElement;
  
  document.createElement = jest.fn((tagName) => {
    if (tagName === 'canvas') {
      return createMockCanvas();
    }
    return originalCreateElement.call(document, tagName);
  });
  
  return () => {
    document.createElement = originalCreateElement;
  };
}

/**
 * Creates a mock window object with device pixel ratio and event listeners
 * @param {number} devicePixelRatio - Mock device pixel ratio
 * @returns {Object} Mock window object
 */
export function createMockWindow(devicePixelRatio = 2) {
  return {
    devicePixelRatio,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    requestAnimationFrame: jest.fn((callback) => {
      // Return a mock ID and don't actually call the callback
      return 1;
    }),
    cancelAnimationFrame: jest.fn(),
    performance: {
      now: jest.fn(() => Date.now())
    }
  };
}