// Main entry point for poker UI application
import './styles.css';
const UIManager = require('./uiManager.js');

console.log('Poker UI application starting...');

// Global UI manager instance
let uiManager = null;

// Initialize UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing poker UI...');
  
  try {
    uiManager = new UIManager();
    console.log('Poker UI initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Poker UI:', error);
  }
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (uiManager) {
    uiManager.destroy();
  }
});

// Export for testing
export { uiManager };