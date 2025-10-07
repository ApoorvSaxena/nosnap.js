<template>
  <div class="animated-noise-text-app">
    <!-- Header -->
    <header class="header">
      <h1>nosnap.js - Vue.js Examples</h1>
      <nav class="nav">
        <button
          v-for="example in examples"
          :key="example.key"
          @click="currentExample = example.key"
          :class="['nav-button', { active: currentExample === example.key }]"
        >
          {{ example.name }}
        </button>
      </nav>
    </header>

    <!-- Example Components -->
    <main class="main">
      <BasicExample v-if="currentExample === 'basic'" />
      <InteractiveExample v-if="currentExample === 'interactive'" />
      <ResponsiveExample v-if="currentExample === 'responsive'" />
      <MultipleAnimationsExample v-if="currentExample === 'multiple'" />
    </main>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import NoSnap from 'nosnap.js';

// Composable for NoSnap
export function useNoSnap(canvasRef, options = {}) {
  const animation = ref(null);
  const isRunning = ref(false);
  const error = ref(null);

  const initialize = async () => {
    if (!canvasRef.value) return;

    try {
      animation.value = new NoSnap.NoSnap(canvasRef.value, options.value || options);
      error.value = null;
    } catch (err) {
      error.value = err.message;
      console.error('Failed to initialize NoSnap:', err);
    }
  };

  const start = () => {
    if (animation.value && !isRunning.value) {
      try {
        animation.value.start();
        isRunning.value = true;
        error.value = null;
      } catch (err) {
        error.value = err.message;
        console.error('Failed to start animation:', err);
      }
    }
  };

  const stop = () => {
    if (animation.value && isRunning.value) {
      try {
        animation.value.stop();
        isRunning.value = false;
        error.value = null;
      } catch (err) {
        error.value = err.message;
        console.error('Failed to stop animation:', err);
      }
    }
  };

  const setText = (text) => {
    if (animation.value) {
      try {
        animation.value.setText(text);
        error.value = null;
      } catch (err) {
        error.value = err.message;
        console.error('Failed to set text:', err);
      }
    }
  };

  const updateConfig = (newOptions) => {
    if (animation.value) {
      try {
        animation.value.updateConfig(newOptions);
        error.value = null;
      } catch (err) {
        error.value = err.message;
        console.error('Failed to update config:', err);
      }
    }
  };

  const destroy = () => {
    if (animation.value) {
      animation.value.destroy();
      animation.value = null;
      isRunning.value = false;
    }
  };

  return {
    animation,
    isRunning,
    error,
    initialize,
    start,
    stop,
    setText,
    updateConfig,
    destroy
  };
}

// Basic Example Component
const BasicExample = {
  setup() {
    const canvasRef = ref(null);
    const { initialize, start, error } = useNoSnap(canvasRef, {
      text: 'VUE BASIC',
      cellSize: 2,
      stepMs: 32
    });

    onMounted(async () => {
      await nextTick();
      await initialize();
      start();
    });

    return {
      canvasRef,
      error
    };
  },
  template: `
    <div class="example">
      <h2>Basic Vue.js Example</h2>
      <canvas
        ref="canvasRef"
        class="canvas"
        style="width: 600px; height: 300px;"
      ></canvas>
      <div v-if="error" class="error">
        Error: {{ error }}
      </div>
    </div>
  `
};

// Interactive Example Component
const InteractiveExample = {
  setup() {
    const canvasRef = ref(null);
    const text = ref('INTERACTIVE');
    const cellSize = ref(2);
    const stepMs = ref(32);
    
    const options = ref({
      text: text.value,
      cellSize: cellSize.value,
      stepMs: stepMs.value,
      fontWeight: 900
    });

    const {
      isRunning,
      error,
      initialize,
      start,
      stop,
      setText,
      updateConfig
    } = useNoSnap(canvasRef, options);

    // Watch for text changes
    watch(text, (newText) => {
      setText(newText.toUpperCase());
    });

    // Watch for config changes
    watch([cellSize, stepMs], ([newCellSize, newStepMs]) => {
      updateConfig({
        cellSize: newCellSize,
        stepMs: newStepMs
      });
    });

    onMounted(async () => {
      await nextTick();
      await initialize();
    });

    const handleTextInput = (event) => {
      text.value = event.target.value;
    };

    return {
      canvasRef,
      text,
      cellSize,
      stepMs,
      isRunning,
      error,
      start,
      stop,
      handleTextInput
    };
  },
  template: `
    <div class="example">
      <h2>Interactive Vue.js Example</h2>
      
      <canvas
        ref="canvasRef"
        class="canvas"
        style="width: 100%; height: 400px; margin-bottom: 20px;"
      ></canvas>

      <div class="controls">
        <div class="control-row">
          <button @click="start" :disabled="isRunning" class="button">
            Start Animation
          </button>
          <button @click="stop" :disabled="!isRunning" class="button">
            Stop Animation
          </button>
        </div>

        <div class="control-grid">
          <div class="control-group">
            <label class="label">Text:</label>
            <input
              type="text"
              :value="text"
              @input="handleTextInput"
              placeholder="Enter text..."
              class="input"
            />
          </div>

          <div class="control-group">
            <label class="label">Cell Size: {{ cellSize }}</label>
            <input
              type="range"
              min="1"
              max="6"
              v-model.number="cellSize"
              class="slider"
            />
          </div>

          <div class="control-group">
            <label class="label">Speed (ms): {{ stepMs }}</label>
            <input
              type="range"
              min="16"
              max="100"
              v-model.number="stepMs"
              class="slider"
            />
          </div>
        </div>
      </div>

      <div v-if="error" class="error">
        Error: {{ error }}
      </div>

      <div class="status">
        Status: {{ isRunning ? 'Running' : 'Stopped' }}
      </div>
    </div>
  `
};

// Responsive Example Component
const ResponsiveExample = {
  setup() {
    const canvasRef = ref(null);
    const containerRef = ref(null);
    const dimensions = ref({ width: 800, height: 400 });

    const {
      isRunning,
      initialize,
      start,
      stop,
      destroy
    } = useNoSnap(canvasRef, {
      text: 'RESPONSIVE',
      cellSize: 2,
      stepMs: 32,
      fontSize: null
    });

    const handleResize = () => {
      if (containerRef.value) {
        const rect = containerRef.value.getBoundingClientRect();
        dimensions.value = { width: rect.width, height: rect.height };
        
        if (canvasRef.value) {
          canvasRef.value.width = rect.width;
          canvasRef.value.height = rect.height;
        }
      }
    };

    onMounted(async () => {
      await nextTick();
      handleResize();
      await initialize();
      
      window.addEventListener('resize', handleResize);
    });

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize);
      destroy();
    });

    return {
      canvasRef,
      containerRef,
      dimensions,
      isRunning,
      start,
      stop
    };
  },
  template: `
    <div class="example">
      <h2>Responsive Vue.js Example</h2>
      
      <div ref="containerRef" class="canvas-container">
        <canvas
          ref="canvasRef"
          class="canvas responsive-canvas"
        ></canvas>
      </div>

      <div class="controls">
        <button @click="start" :disabled="isRunning" class="button">Start</button>
        <button @click="stop" :disabled="!isRunning" class="button">Stop</button>
        <span class="info">
          Canvas: {{ dimensions.width }}x{{ dimensions.height }}
        </span>
      </div>
    </div>
  `
};

// Multiple Animations Example Component
const MultipleAnimationsExample = {
  setup() {
    const animations = ref([
      { text: 'FIRST', cellSize: 2, stepMs: 32 },
      { text: 'SECOND', cellSize: 3, stepMs: 40 },
      { text: 'THIRD', cellSize: 4, stepMs: 50 }
    ]);

    return {
      animations
    };
  },
  components: {
    AnimationCard: {
      props: ['config', 'index'],
      setup(props) {
        const canvasRef = ref(null);
        const { initialize, start, destroy } = useNoSnap(canvasRef, props.config);

        onMounted(async () => {
          await nextTick();
          await initialize();
          start();
        });

        onUnmounted(() => {
          destroy();
        });

        return {
          canvasRef
        };
      },
      template: `
        <div class="animation-card">
          <h3>Animation {{ index + 1 }}</h3>
          <canvas
            ref="canvasRef"
            class="canvas"
            style="width: 100%; height: 200px;"
          ></canvas>
          <p class="card-info">
            Cell Size: {{ config.cellSize }}, Speed: {{ config.stepMs }}ms
          </p>
        </div>
      `
    }
  },
  template: `
    <div class="example">
      <h2>Multiple Animations Example</h2>
      
      <div class="animations-grid">
        <AnimationCard
          v-for="(config, index) in animations"
          :key="index"
          :config="config"
          :index="index"
        />
      </div>
    </div>
  `
};

// Main App Component
export default {
  components: {
    BasicExample,
    InteractiveExample,
    ResponsiveExample,
    MultipleAnimationsExample
  },
  setup() {
    const currentExample = ref('basic');
    
    const examples = [
      { key: 'basic', name: 'Basic' },
      { key: 'interactive', name: 'Interactive' },
      { key: 'responsive', name: 'Responsive' },
      { key: 'multiple', name: 'Multiple' }
    ];

    return {
      currentExample,
      examples
    };
  }
};
</script>

<style scoped>
.animated-noise-text-app {
  font-family: Arial, sans-serif;
}

.header {
  padding: 20px;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.header h1 {
  margin: 0 0 20px 0;
}

.nav {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.nav-button {
  padding: 10px 20px;
  background: #fff;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  text-transform: capitalize;
  transition: all 0.2s;
}

.nav-button:hover {
  background: #f0f0f0;
}

.nav-button.active {
  background: #007bff;
  color: #fff;
  border-color: #007bff;
}

.main {
  min-height: calc(100vh - 120px);
}

.example {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.example h2 {
  margin-bottom: 20px;
}

.canvas {
  border: 1px solid #333;
  background: #000;
  display: block;
}

.canvas-container {
  width: 100%;
  height: 400px;
  position: relative;
}

.responsive-canvas {
  width: 100%;
  height: 100%;
}

.controls {
  margin-top: 20px;
}

.control-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.control-grid {
  display: grid;
  gap: 15px;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

.control-group {
  display: flex;
  flex-direction: column;
}

.label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.input {
  width: 100%;
  padding: 8px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.slider {
  width: 100%;
}

.button {
  padding: 10px 20px;
  font-size: 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.button:hover:not(:disabled) {
  background: #0056b3;
}

.button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.error {
  margin-top: 20px;
  padding: 10px;
  background: #ffebee;
  border: 1px solid #f44336;
  border-radius: 4px;
  color: #c62828;
}

.status {
  margin-top: 20px;
  font-size: 14px;
  color: #666;
}

.info {
  margin-left: 20px;
  font-size: 14px;
  color: #666;
}

.animations-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.animation-card {
  text-align: center;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  background: #f9f9f9;
}

.animation-card h3 {
  margin-top: 0;
  margin-bottom: 15px;
}

.card-info {
  font-size: 12px;
  color: #666;
  margin-top: 10px;
  margin-bottom: 0;
}
</style>