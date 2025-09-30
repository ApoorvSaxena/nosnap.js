#!/usr/bin/env node

const http = require('http');
const path = require('path');

const PORT = 8080;
const HOST = 'localhost';

function checkServer() {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: HOST,
      port: PORT,
      path: '/examples/',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      resolve({
        status: res.statusCode,
        headers: res.headers
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function main() {
  console.log('🔍 Checking development server...');
  console.log(`📍 URL: http://${HOST}:${PORT}`);
  
  try {
    const result = await checkServer();
    console.log('✅ Server is running!');
    console.log(`📊 Status: ${result.status}`);
    console.log(`🌐 Access examples at: http://${HOST}:${PORT}/examples/`);
    console.log(`📚 View documentation at: http://${HOST}:${PORT}/docs/`);
    
    if (result.headers['access-control-allow-origin']) {
      console.log('🔓 CORS is enabled');
    }
    
    process.exit(0);
  } catch (error) {
    console.log('❌ Server is not running');
    console.log(`💡 Start the server with: npm run dev`);
    console.log(`🔧 Or just serve files with: npm run serve`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkServer };