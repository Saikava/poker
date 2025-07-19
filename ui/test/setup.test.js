// Basic test to verify test environment setup
const { createMockPokerEngine, createSampleGameState } = require('./helpers/testHelpers.js');
const { sampleCards, gameStates } = require('./helpers/fixtures.js');

describe('Test Environment Setup', () => {
  test('jsdom environment is working', () => {
    const div = document.createElement('div');
    div.textContent = 'Hello World';
    document.body.appendChild(div);
    
    expect(document.body.textContent).toContain('Hello World');
    expect(div).toBeInTheDocument();
  });

  test('mock poker engine helper works', () => {
    const mockEngine = createMockPokerEngine();
    
    expect(mockEngine.addPlayer).toBeDefined();
    expect(mockEngine.getGameState).toBeDefined();
    expect(typeof mockEngine.getGameState()).toBe('object');
  });

  test('sample game state helper works', () => {
    const gameState = createSampleGameState();
    
    expect(gameState).toHaveProperty('phase');
    expect(gameState).toHaveProperty('players');
    expect(gameState).toHaveProperty('pot');
    expect(Array.isArray(gameState.players)).toBe(true);
  });

  test('test fixtures are available', () => {
    expect(sampleCards.aceSpades).toEqual({ suit: 'spades', rank: 'A' });
    expect(gameStates.waiting).toHaveProperty('phase', 'waiting');
    expect(Array.isArray(gameStates.preflop.players)).toBe(true);
  });

  test('DOM manipulation works', () => {
    const button = document.createElement('button');
    button.textContent = 'Test Button';
    button.onclick = jest.fn();
    
    document.body.appendChild(button);
    button.click();
    
    expect(button.onclick).toHaveBeenCalled();
    expect(button).toBeInTheDocument();
  });
});