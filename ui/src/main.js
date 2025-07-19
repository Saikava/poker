// Main entry point for poker UI application
import GameController from './gameController.js';

console.log('Poker UI application starting...');

// Test GameController integration
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, poker UI ready');
  
  // Test that GameController can be instantiated
  try {
    const gameController = new GameController();
    console.log('GameController initialized successfully:', gameController.isReady());
    
    // Clean up
    gameController.destroy();
  } catch (error) {
    console.error('Failed to initialize GameController:', error);
  }
});