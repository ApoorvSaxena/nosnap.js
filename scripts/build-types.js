#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const typeDefinitions = `// TypeScript declarations for nosnap.js

export interface NoSnapConfig {
  text?: string;
  cellSize?: number;
  circleRadius?: number;
  stepPixels?: number;
  stepMs?: number;
  maskBlockSize?: number;
  fontSize?: number | null;
  fontWeight?: number | string;
  fontFamily?: string;
}

export default class NoSnap {
  constructor(canvas: HTMLCanvasElement, options?: NoSnapConfig);
  
  start(): void;
  stop(): void;
  destroy(): void;
  setText(text: string): void;
  updateConfig(options: Partial<NoSnapConfig>): void;
}

export { NoSnap };
`;

// Ensure dist directory exists
const distDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Write TypeScript declarations
const typesPath = path.join(distDir, 'nosnap.d.ts');
fs.writeFileSync(typesPath, typeDefinitions);

console.log('✅ TypeScript declarations generated successfully');