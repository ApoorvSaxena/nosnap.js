import React, { useEffect, useRef, useState, useCallback } from 'react';
import AnimatedNoiseText from 'animated-noise-text';

/**
 * React Hook for Animated Noise Text
 * Provides a clean React interface for the library
 */
export function useAnimatedNoiseText(options = {}) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);

  // Initialize animation when canvas is available
  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      animationRef.current = new AnimatedNoiseText(canvasRef.current, options);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Failed to initialize AnimatedNoiseText:', err);
    }

    // Cleanup on unmount
    return () => {
      if (animationRef.current) {
        animationRef.current.destroy();
        animationRef.current = null;
      }
    };
  }, []);

  // Update configuration when options change
  useEffect(() => {
    if (animationRef.current && options) {
      try {
        animationRef.current.updateConfig(options);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Failed to update config:', err);
      }
    }
  }, [options]);

  const start = useCallback(() => {
    if (animationRef.current && !isRunning) {
      try {
        animationRef.current.start();
        setIsRunning(true);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Failed to start animation:', err);
      }
    }
  }, [isRunning]);

  const stop = useCallback(() => {
    if (animationRef.current && isRunning) {
      try {
        animationRef.current.stop();
        setIsRunning(false);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Failed to stop animation:', err);
      }
    }
  }, [isRunning]);

  const setText = useCallback((text) => {
    if (animationRef.current) {
      try {
        animationRef.current.setText(text);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Failed to set text:', err);
      }
    }
  }, []);

  const updateConfig = useCallback((newOptions) => {
    if (animationRef.current) {
      try {
        animationRef.current.updateConfig(newOptions);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Failed to update config:', err);
      }
    }
  }, []);

  return {
    canvasRef,
    isRunning,
    error,
    start,
    stop,
    setText,
    updateConfig
  };
}

/**
 * React Component for Animated Noise Text
 * Simple component wrapper for the library
 */
export function AnimatedNoiseTextComponent({ 
  text = 'HELLO REACT',
  autoStart = true,
  className = '',
  style = {},
  onError = null,
  ...options 
}) {
  const {
    canvasRef,
    isRunning,
    error,
    start,
    stop,
    setText,
    updateConfig
  } = useAnimatedNoiseText({ text, ...options });

  // Auto-start animation if requested
  useEffect(() => {
    if (autoStart && !isRunning && !error) {
      start();
    }
  }, [autoStart, isRunning, error, start]);

  // Update text when prop changes
  useEffect(() => {
    setText(text);
  }, [text, setText]);

  // Handle errors
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: '100%',
        height: '400px',
        border: '1px solid #333',
        background: '#000',
        ...style
      }}
    />
  );
}

/**
 * Example: Basic Usage Component
 */
export function BasicExample() {
  return (
    <div style={{ padding: '20px' }}>
      <h2>Basic React Example</h2>
      <AnimatedNoiseTextComponent
        text="REACT BASIC"
        cellSize={2}
        stepMs={32}
        style={{ width: '600px', height: '300px' }}
      />
    </div>
  );
}

/**
 * Example: Interactive Component with Controls
 */
export function InteractiveExample() {
  const [text, setText] = useState('INTERACTIVE');
  const [cellSize, setCellSize] = useState(2);
  const [stepMs, setStepMs] = useState(32);
  
  const {
    canvasRef,
    isRunning,
    error,
    start,
    stop,
    updateConfig
  } = useAnimatedNoiseText({
    text,
    cellSize,
    stepMs,
    fontWeight: 900
  });

  const handleTextChange = (e) => {
    setText(e.target.value.toUpperCase());
  };

  const handleCellSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setCellSize(newSize);
    updateConfig({ cellSize: newSize });
  };

  const handleSpeedChange = (e) => {
    const newSpeed = parseInt(e.target.value);
    setStepMs(newSpeed);
    updateConfig({ stepMs: newSpeed });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      <h2>Interactive React Example</h2>
      
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '400px',
          border: '1px solid #333',
          background: '#000',
          marginBottom: '20px'
        }}
      />

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <button 
          onClick={start} 
          disabled={isRunning}
          style={{ padding: '10px 20px', fontSize: '16px' }}
        >
          Start Animation
        </button>
        
        <button 
          onClick={stop} 
          disabled={!isRunning}
          style={{ padding: '10px 20px', fontSize: '16px' }}
        >
          Stop Animation
        </button>
      </div>

      <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Text:
          </label>
          <input
            type="text"
            value={text}
            onChange={handleTextChange}
            placeholder="Enter text..."
            style={{ width: '100%', padding: '8px', fontSize: '16px' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Cell Size: {cellSize}
          </label>
          <input
            type="range"
            min="1"
            max="6"
            value={cellSize}
            onChange={handleCellSizeChange}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Speed (ms): {stepMs}
          </label>
          <input
            type="range"
            min="16"
            max="100"
            value={stepMs}
            onChange={handleSpeedChange}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {error && (
        <div style={{ 
          marginTop: '20px', 
          padding: '10px', 
          background: '#ffebee', 
          border: '1px solid #f44336',
          borderRadius: '4px',
          color: '#c62828'
        }}>
          Error: {error}
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        Status: {isRunning ? 'Running' : 'Stopped'}
      </div>
    </div>
  );
}

/**
 * Example: Responsive Component
 */
export function ResponsiveExample() {
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  
  const {
    canvasRef,
    isRunning,
    start,
    stop
  } = useAnimatedNoiseText({
    text: 'RESPONSIVE',
    cellSize: 2,
    stepMs: 32,
    fontSize: null // Auto-calculate based on canvas size
  });

  useEffect(() => {
    const handleResize = () => {
      const container = canvasRef.current?.parentElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = dimensions.width;
      canvasRef.current.height = dimensions.height;
    }
  }, [dimensions]);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Responsive React Example</h2>
      
      <div style={{ width: '100%', height: '400px', position: 'relative' }}>
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            border: '1px solid #333',
            background: '#000'
          }}
        />
      </div>

      <div style={{ marginTop: '20px' }}>
        <button onClick={start} disabled={isRunning}>Start</button>
        <button onClick={stop} disabled={!isRunning} style={{ marginLeft: '10px' }}>Stop</button>
        <span style={{ marginLeft: '20px', fontSize: '14px', color: '#666' }}>
          Canvas: {dimensions.width}x{dimensions.height}
        </span>
      </div>
    </div>
  );
}

/**
 * Example: Multiple Animations
 */
export function MultipleAnimationsExample() {
  const animations = [
    { text: 'FIRST', cellSize: 2, stepMs: 32 },
    { text: 'SECOND', cellSize: 3, stepMs: 40 },
    { text: 'THIRD', cellSize: 4, stepMs: 50 }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h2>Multiple Animations Example</h2>
      
      <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {animations.map((config, index) => (
          <div key={index} style={{ textAlign: 'center' }}>
            <h3>Animation {index + 1}</h3>
            <AnimatedNoiseTextComponent
              {...config}
              style={{ width: '100%', height: '200px' }}
              autoStart={true}
            />
            <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
              Cell Size: {config.cellSize}, Speed: {config.stepMs}ms
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Complete App Example
 */
export default function App() {
  const [currentExample, setCurrentExample] = useState('basic');

  const examples = {
    basic: <BasicExample />,
    interactive: <InteractiveExample />,
    responsive: <ResponsiveExample />,
    multiple: <MultipleAnimationsExample />
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <header style={{ padding: '20px', background: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
        <h1>Animated Noise Text - React Examples</h1>
        
        <nav style={{ marginTop: '20px' }}>
          {Object.keys(examples).map(key => (
            <button
              key={key}
              onClick={() => setCurrentExample(key)}
              style={{
                padding: '10px 20px',
                marginRight: '10px',
                background: currentExample === key ? '#007bff' : '#fff',
                color: currentExample === key ? '#fff' : '#333',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {key}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {examples[currentExample]}
      </main>
    </div>
  );
}