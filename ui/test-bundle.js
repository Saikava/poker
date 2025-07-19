// Simple test script to verify the bundled application works
const fs = require('fs');
const path = require('path');

console.log('Testing bundled application...');

// Check if dist directory exists
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
    console.error('❌ dist directory does not exist');
    process.exit(1);
}

// Check if required files exist
const files = fs.readdirSync(distPath);
const hasHtml = files.includes('index.html');
const bundleFiles = files.filter(file => file.startsWith('bundle.') && file.endsWith('.js'));

if (!hasHtml) {
    console.error('❌ index.html not found');
    process.exit(1);
}

if (bundleFiles.length === 0) {
    console.error('❌ No bundle.js files found');
    process.exit(1);
}

const bundleFile = bundleFiles[0]; // Use the first bundle file found

// Check if HTML contains proper script tag
const htmlContent = fs.readFileSync(path.join(distPath, 'index.html'), 'utf8');
if (!htmlContent.includes(bundleFile)) {
    console.error(`❌ HTML does not reference ${bundleFile}`);
    process.exit(1);
}

// Check if bundle contains poker engine code
const bundleContent = fs.readFileSync(path.join(distPath, bundleFile), 'utf8');
if (!bundleContent.includes('PokerEngine') && !bundleContent.includes('GameManager')) {
    console.error('❌ Bundle does not contain poker engine code');
    process.exit(1);
}

console.log('✅ All bundle tests passed!');
console.log(`✅ dist/index.html exists and references ${bundleFile}`);
console.log(`✅ dist/${bundleFile} exists and contains poker engine code`);
console.log('✅ Bundle application is ready for browser testing');