// Jest setup file for DOM testing
require('@testing-library/jest-dom');

// Global test utilities and mocks
global.console = {
  ...console,
  // Suppress console.log in tests unless needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock window.alert and window.confirm for testing
global.alert = jest.fn();
global.confirm = jest.fn(() => true);

// Setup DOM environment
beforeEach(() => {
  // Clear any previous DOM content
  document.body.innerHTML = '';
  
  // Reset all mocks
  jest.clearAllMocks();
});

// Cleanup after each test
afterEach(() => {
  // Clean up any timers or async operations
  jest.clearAllTimers();
});