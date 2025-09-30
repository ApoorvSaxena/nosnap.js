module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // Code style
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    
    // Best practices
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    'no-debugger': 'error',
    'no-alert': 'error',
    
    // ES6+
    'prefer-const': 'error',
    'no-var': 'error',
    'arrow-spacing': 'error',
    
    // Spacing and formatting
    'space-before-blocks': 'error',
    'keyword-spacing': 'error',
    'comma-spacing': 'error',
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    
    // Function style
    'space-before-function-paren': ['error', {
      'anonymous': 'always',
      'named': 'never',
      'asyncArrow': 'always'
    }],
    
    // Allow console in development (override the earlier rule)
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off'
  },
  globals: {
    // Browser globals
    'window': 'readonly',
    'document': 'readonly',
    'navigator': 'readonly',
    'HTMLCanvasElement': 'readonly',
    'CanvasRenderingContext2D': 'readonly',
    'ImageData': 'readonly',
    'ResizeObserver': 'readonly',
    'requestAnimationFrame': 'readonly',
    'cancelAnimationFrame': 'readonly',
    
    // Test globals
    'describe': 'readonly',
    'it': 'readonly',
    'expect': 'readonly',
    'beforeEach': 'readonly',
    'afterEach': 'readonly',
    'jest': 'readonly'
  }
};