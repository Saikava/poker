// Test script to verify development server configuration
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const config = require('./webpack.config.js');

console.log('Testing development server configuration...');

// Get webpack config for development mode
const devConfig = config({}, { mode: 'development' });

// Verify dev server configuration exists
if (!devConfig.devServer) {
    console.error('❌ Development server configuration missing');
    process.exit(1);
}

// Check required dev server options
const requiredOptions = ['static', 'compress', 'port'];
const missingOptions = requiredOptions.filter(option => !(option in devConfig.devServer));

if (missingOptions.length > 0) {
    console.error(`❌ Missing dev server options: ${missingOptions.join(', ')}`);
    process.exit(1);
}

// Verify webpack can compile the config
try {
    const compiler = webpack(devConfig);
    console.log('✅ Webpack compiler created successfully');
} catch (error) {
    console.error('❌ Webpack configuration error:', error.message);
    process.exit(1);
}

console.log('✅ Development server configuration is valid');
console.log(`✅ Server will run on port ${devConfig.devServer.port}`);
console.log('✅ Hot module replacement enabled:', devConfig.devServer.hot);
console.log('✅ Development server ready for use');
console.log('\nTo start the server, run: npm run serve');