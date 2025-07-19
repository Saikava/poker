// Test helper utilities for poker UI testing

/**
 * Creates a mock poker engine for testing
 */
function createMockPokerEngine() {
  return {
    addPlayer: jest.fn(),
    removePlayer: jest.fn(),
    startGame: jest.fn(),
    playerAction: jest.fn(),
    getGameState: jest.fn(() => ({
      phase: 'waiting',
      players: [],
      communityCards: [],
      pot: 0,
      currentPlayer: null,
      handNumber: 0
    })),
    getPlayerState: jest.fn(() => ({
      id: 'test-player',
      name: 'Test Player',
      chips: 1000,
      cards: [],
      bet: 0,
      folded: false
    })),
    startNewHand: jest.fn(),
    getAvailableActions: jest.fn(() => [])
  };
}

/**
 * Creates a sample game state for testing
 */
function createSampleGameState(overrides = {}) {
  return {
    phase: 'preflop',
    players: [
      {
        id: 'player1',
        name: 'Player 1',
        chips: 1000,
        cards: [],
        bet: 0,
        folded: false
      },
      {
        id: 'player2', 
        name: 'Player 2',
        chips: 1000,
        cards: [],
        bet: 0,
        folded: false
      }
    ],
    communityCards: [],
    pot: 0,
    currentPlayer: 'player1',
    handNumber: 1,
    ...overrides
  };
}

/**
 * Creates sample player data for testing
 */
function createSamplePlayer(overrides = {}) {
  return {
    id: 'test-player',
    name: 'Test Player',
    chips: 1000,
    cards: [],
    bet: 0,
    folded: false,
    ...overrides
  };
}

/**
 * Simulates user input events for testing
 */
function simulateUserInput(element, value) {
  element.value = value;
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Simulates button clicks for testing
 */
function simulateClick(element) {
  const event = element.ownerDocument.defaultView.Event 
    ? new element.ownerDocument.defaultView.Event('click', { bubbles: true })
    : new Event('click', { bubbles: true });
  element.dispatchEvent(event);
}

/**
 * Waits for DOM updates in tests
 */
function waitForDOMUpdate() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Creates a basic HTML structure for testing UI components
 */
function createTestContainer() {
  const container = document.createElement('div');
  container.id = 'test-container';
  document.body.appendChild(container);
  return container;
}

/**
 * Cleans up test container
 */
function cleanupTestContainer() {
  const container = document.getElementById('test-container');
  if (container) {
    container.remove();
  }
}

module.exports = {
  createMockPokerEngine,
  createSampleGameState,
  createSamplePlayer,
  simulateUserInput,
  simulateClick,
  waitForDOMUpdate,
  createTestContainer,
  cleanupTestContainer
};