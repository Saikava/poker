# Build Process Documentation

## Overview

The poker UI uses Webpack to bundle the application for browser use, integrating the existing Node.js poker engine into a browser-compatible format.

## Available Scripts

### Development
- `npm run dev` - Build in development mode with watch mode enabled
- `npm run serve` - Start development server on http://localhost:8080
- `npm start` - Start development server and open browser automatically
- `npm run build:dev` - Single development build without watch mode

### Production
- `npm run build` - Create optimized production build with minification and content hashing
- `npm run preview` - Start server with production build and open browser

### Utilities
- `npm run clean` - Remove dist directory
- `npm run analyze` - Analyze bundle size (requires production build first)
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## Build Features

### Development Mode
- Fast builds with eval-source-map for debugging
- Hot module replacement for live updates
- Unminified code for easier debugging
- Development server with auto-reload

### Production Mode
- Minified and optimized bundle
- Content hashing for cache busting (bundle.[hash].js)
- Source maps for debugging
- HTML minification
- Code splitting for vendor dependencies

## File Structure

```
ui/
├── src/                    # Source files
│   ├── index.html         # HTML template
│   ├── main.js           # Application entry point
│   ├── gameController.js  # Game logic controller
│   ├── uiManager.js      # UI management
│   └── styles.css        # Application styles
├── dist/                  # Built files (generated)
│   ├── index.html        # Processed HTML with injected scripts
│   ├── bundle.js         # Development bundle
│   └── bundle.[hash].js  # Production bundle with content hash
├── test/                  # Test files
├── webpack.config.js      # Webpack configuration
└── package.json          # Dependencies and scripts
```

## Browser Compatibility

The bundled application works in modern browsers that support:
- ES6+ features (or with Babel transpilation)
- DOM APIs used by the UI
- Local storage (if used by poker engine)

## Development Server

The development server provides:
- Live reloading on file changes
- Hot module replacement
- Proxy support for API calls (if needed)
- Serves files from memory for faster development

Access the development server at: http://localhost:8080

## Testing the Bundle

Run the bundle test script to verify the build:
```bash
node test-bundle.js
```

This verifies:
- Required files exist in dist/
- HTML properly references the bundle
- Bundle contains poker engine code
- Application is ready for browser testing

## Troubleshooting

### Common Issues

1. **Module not found errors**: Check that poker engine modules are properly aliased in webpack.config.js
2. **Bundle too large**: Use `npm run analyze` to identify large dependencies
3. **Development server not starting**: Check if port 8080 is available
4. **Build fails**: Check for syntax errors in source files

### Debug Mode

For debugging bundled application:
1. Use development build (`npm run build:dev`)
2. Open browser developer tools
3. Source maps allow debugging original source files
4. Check console for any runtime errors