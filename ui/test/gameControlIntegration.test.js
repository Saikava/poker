/**
 * Integration tests for game control functionality
 * Tests the complete game control flow with DOM interactions
 */

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

// Mock the GameController
jest.mock('../src/gameController.js', () => {
  return jest.fn().mockImplementation(() => ({
    startGame: jest.fn(),
    startNewHand: jest.fn(),
    canStartGame: jest.fn(),
    getGameStats: jest.fn(),
    getGameState: jest.fn(),
    addPlayer: jest.fn(),
    removePlayer: jest.fn(),
    getConfig: jest.fn(() => ({ startingChips: 1000, minPlayers: 2, maxPlayers: 6 })),
    destroy: jest.fn()
  }));
});

describe('Game Control Integration Tests', () => {
  let dom;
  let document;
  let window;
  let UIManager;
  let uiManager;
  let mockGameController;

  beforeAll(() => {
    // Load the HTML file
    const htmlPath = path.join(__dirname, '../src/index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Create JSDOM instance
    dom = new JSDOM(htmlContent, {
      runScripts: 'dangerously'
    });
    
    document = dom.window.document;
    window = dom.window;
    
    // Make document and window available globally
    global.document = document;
    global.window = window;
    global.HTMLElement = window.HTMLElement;
    global.Event = window.Event;

    // Import UIManager after setting up globals
    UIManager = require('../src/uiManager.js');
  });

  beforeEach(() => {
    // Create fresh UI manager instance for each test
    uiManager = new UIManager(document);
    mockGameController = uiManager.getGameController();
    
    // Set up default mock responses
    mockGameController.getGameStats.mockReturnValue({
      isGameActive: false,
      currentPhase: 'waiting',
      handNumber: 0
    });
    mockGameController.canStartGame.mockReturnValue({ canStart: false });
    mockGameController.getGameState.mockReturnValue({
      players: [],
      table: { communityCards: [] },
      betting: {},
      pots: { total: 0 }
    });
  });

  afterEach(() => {
    if (uiManager) {
      uiManager.destroy();
    }
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Clean up global references
    delete global.document;
    delete global.window;
    delete global.HTMLElement;
    delete global.Event;
  });

  describe('Start Game Button', () => {
    test('should be disabled initially when no players', () => {
      const startGameBtn = document.getElementById('start-game-btn');
      
      expect(startGameBtn.disabled).toBe(true);
      expect(startGameBtn.textContent).toBe('Start Game');
    });

    test('should enable when enough players are added', () => {
      mockGameController.canStartGame.mockReturnValue({ canStart: true });
      
      uiManager.updateGameControls();
      
      const startGameBtn = document.getElementById('start-game-btn');
      expect(startGameBtn.disabled).toBe(false);
    });

    test('should call startGame when clicked', () => {
      mockGameController.canStartGame.mockReturnValue({ canStart: true });
      mockGameController.startGame.mockReturnValue({ success: true });
      
      uiManager.updateGameControls();
      
      const startGameBtn = document.getElementById('start-game-btn');
      startGameBtn.click();
      
      expect(mockGameController.startGame).toHaveBeenCalled();
    });

    test('should handle start game success', () => {
      mockGameController.startGame.mockReturnValue({ success: true });
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'preflop',
        handNumber: 1
      });
      
      uiManager.handleStartGame();
      
      expect(mockGameController.startGame).toHaveBeenCalled();
      
      // Verify UI updates
      const startGameBtn = document.getElementById('start-game-btn');
      expect(startGameBtn.disabled).toBe(true);
      expect(startGameBtn.textContent).toBe('Game Active');
    });

    test('should handle start game error', () => {
      mockGameController.startGame.mockReturnValue({
        success: false,
        error: {
          type: 'GameStateError',
          message: 'Not enough players'
        }
      });
      
      uiManager.handleStartGame();
      
      expect(mockGameController.startGame).toHaveBeenCalled();
      
      // Verify error is displayed
      const errorDisplay = document.getElementById('error-display');
      const errorMessage = document.getElementById('error-message');
      
      expect(errorDisplay.style.display).toBe('block');
      expect(errorMessage.textContent).toBe('Not enough players');
    });

    test('should handle start game error without error object', () => {
      mockGameController.startGame.mockReturnValue({ success: false });
      
      uiManager.handleStartGame();
      
      const errorMessage = document.getElementById('error-message');
      expect(errorMessage.textContent).toBe('Failed to start game');
    });

    test('should change text to "Game Active" when game is running', () => {
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'preflop',
        handNumber: 1
      });
      
      uiManager.updateGameControls();
      
      const startGameBtn = document.getElementById('start-game-btn');
      expect(startGameBtn.disabled).toBe(true);
      expect(startGameBtn.textContent).toBe('Game Active');
    });
  });

  describe('New Hand Button', () => {
    test('should be disabled initially', () => {
      // Update the game controls to set the initial state
      uiManager.updateGameControls();
      
      const newHandBtn = document.getElementById('new-hand-btn');
      
      expect(newHandBtn.disabled).toBe(true);
      expect(newHandBtn.textContent).toBe('New Hand');
    });

    test('should enable when hand is complete', () => {
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'complete',
        handNumber: 1
      });
      
      uiManager.updateGameControls();
      
      const newHandBtn = document.getElementById('new-hand-btn');
      expect(newHandBtn.disabled).toBe(false);
      expect(newHandBtn.textContent).toBe('New Hand');
    });

    test('should call startNewHand when clicked', () => {
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'complete',
        handNumber: 1
      });
      mockGameController.startNewHand.mockReturnValue({ success: true });
      
      uiManager.updateGameControls();
      
      const newHandBtn = document.getElementById('new-hand-btn');
      newHandBtn.click();
      
      expect(mockGameController.startNewHand).toHaveBeenCalled();
    });

    test('should handle new hand success', () => {
      mockGameController.startNewHand.mockReturnValue({ success: true });
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'preflop',
        handNumber: 2
      });
      
      uiManager.handleNewHand();
      
      expect(mockGameController.startNewHand).toHaveBeenCalled();
      
      // Verify UI updates
      const newHandBtn = document.getElementById('new-hand-btn');
      expect(newHandBtn.disabled).toBe(true);
      expect(newHandBtn.textContent).toBe('Hand in Progress');
    });

    test('should handle new hand error', () => {
      mockGameController.startNewHand.mockReturnValue({
        success: false,
        error: {
          type: 'GameStateError',
          message: 'Cannot start new hand'
        }
      });
      
      uiManager.handleNewHand();
      
      expect(mockGameController.startNewHand).toHaveBeenCalled();
      
      // Verify error is displayed
      const errorDisplay = document.getElementById('error-display');
      const errorMessage = document.getElementById('error-message');
      
      expect(errorDisplay.style.display).toBe('block');
      expect(errorMessage.textContent).toBe('Cannot start new hand');
    });

    test('should handle new hand error without error object', () => {
      mockGameController.startNewHand.mockReturnValue({ success: false });
      
      uiManager.handleNewHand();
      
      const errorMessage = document.getElementById('error-message');
      expect(errorMessage.textContent).toBe('Failed to start new hand');
    });

    test('should show "Hand in Progress" when hand is active', () => {
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'preflop',
        handNumber: 1
      });
      
      uiManager.updateGameControls();
      
      const newHandBtn = document.getElementById('new-hand-btn');
      expect(newHandBtn.disabled).toBe(true);
      expect(newHandBtn.textContent).toBe('Hand in Progress');
    });

    test('should enable when game is waiting for new hand', () => {
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'waiting',
        handNumber: 1
      });
      
      uiManager.updateGameControls();
      
      const newHandBtn = document.getElementById('new-hand-btn');
      expect(newHandBtn.disabled).toBe(false);
      expect(newHandBtn.textContent).toBe('New Hand');
    });
  });

  describe('Game State Updates', () => {
    test('should update game controls when game state changes', () => {
      // Initial state - no game
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: false,
        currentPhase: 'waiting',
        handNumber: 0
      });
      mockGameController.canStartGame.mockReturnValue({ canStart: true });
      
      uiManager.updateGameStateDisplay();
      
      let startGameBtn = document.getElementById('start-game-btn');
      let newHandBtn = document.getElementById('new-hand-btn');
      
      expect(startGameBtn.disabled).toBe(false);
      expect(startGameBtn.textContent).toBe('Start Game');
      expect(newHandBtn.disabled).toBe(true);
      
      // Game started
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'preflop',
        handNumber: 1
      });
      mockGameController.canStartGame.mockReturnValue({ canStart: false });
      
      uiManager.updateGameStateDisplay();
      
      expect(startGameBtn.disabled).toBe(true);
      expect(startGameBtn.textContent).toBe('Game Active');
      expect(newHandBtn.disabled).toBe(true);
      expect(newHandBtn.textContent).toBe('Hand in Progress');
      
      // Hand complete
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'complete',
        handNumber: 1
      });
      
      uiManager.updateGameStateDisplay();
      
      expect(startGameBtn.disabled).toBe(true);
      expect(startGameBtn.textContent).toBe('Game Active');
      expect(newHandBtn.disabled).toBe(false);
      expect(newHandBtn.textContent).toBe('New Hand');
    });

    test('should clear errors when starting game', () => {
      // Set up an error first
      uiManager.showError('Test error');
      
      const errorDisplay = document.getElementById('error-display');
      expect(errorDisplay.style.display).toBe('block');
      
      // Start game successfully
      mockGameController.startGame.mockReturnValue({ success: true });
      
      uiManager.handleStartGame();
      
      // Error should be cleared
      expect(errorDisplay.style.display).toBe('none');
    });

    test('should clear errors when starting new hand', () => {
      // Set up an error first
      uiManager.showError('Test error');
      
      const errorDisplay = document.getElementById('error-display');
      expect(errorDisplay.style.display).toBe('block');
      
      // Start new hand successfully
      mockGameController.startNewHand.mockReturnValue({ success: true });
      
      uiManager.handleNewHand();
      
      // Error should be cleared
      expect(errorDisplay.style.display).toBe('none');
    });
  });

  describe('Button State Transitions', () => {
    test('should handle complete game flow button states', () => {
      const startGameBtn = document.getElementById('start-game-btn');
      const newHandBtn = document.getElementById('new-hand-btn');
      
      // Phase 1: No players - start disabled, new hand disabled
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: false,
        currentPhase: 'waiting',
        handNumber: 0
      });
      mockGameController.canStartGame.mockReturnValue({ canStart: false });
      
      uiManager.updateGameControls();
      
      expect(startGameBtn.disabled).toBe(true);
      expect(startGameBtn.textContent).toBe('Start Game');
      expect(newHandBtn.disabled).toBe(true);
      expect(newHandBtn.textContent).toBe('New Hand');
      
      // Phase 2: Enough players - start enabled, new hand disabled
      mockGameController.canStartGame.mockReturnValue({ canStart: true });
      
      uiManager.updateGameControls();
      
      expect(startGameBtn.disabled).toBe(false);
      expect(startGameBtn.textContent).toBe('Start Game');
      expect(newHandBtn.disabled).toBe(true);
      
      // Phase 3: Game active - start disabled, new hand disabled
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'preflop',
        handNumber: 1
      });
      mockGameController.canStartGame.mockReturnValue({ canStart: false });
      
      uiManager.updateGameControls();
      
      expect(startGameBtn.disabled).toBe(true);
      expect(startGameBtn.textContent).toBe('Game Active');
      expect(newHandBtn.disabled).toBe(true);
      expect(newHandBtn.textContent).toBe('Hand in Progress');
      
      // Phase 4: Hand complete - start disabled, new hand enabled
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'complete',
        handNumber: 1
      });
      
      uiManager.updateGameControls();
      
      expect(startGameBtn.disabled).toBe(true);
      expect(startGameBtn.textContent).toBe('Game Active');
      expect(newHandBtn.disabled).toBe(false);
      expect(newHandBtn.textContent).toBe('New Hand');
    });
  });

  describe('Event Binding', () => {
    test('should bind start game button click event', () => {
      // Enable the button first
      mockGameController.canStartGame.mockReturnValue({ canStart: true });
      mockGameController.startGame.mockReturnValue({ success: true });
      
      uiManager.updateGameControls();
      
      const startGameBtn = document.getElementById('start-game-btn');
      expect(startGameBtn.disabled).toBe(false); // Verify button is enabled
      
      startGameBtn.click();
      
      expect(mockGameController.startGame).toHaveBeenCalled();
    });

    test('should bind new hand button click event', () => {
      // Enable the button first
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'complete',
        handNumber: 1
      });
      mockGameController.startNewHand.mockReturnValue({ success: true });
      
      uiManager.updateGameControls();
      
      const newHandBtn = document.getElementById('new-hand-btn');
      expect(newHandBtn.disabled).toBe(false); // Verify button is enabled
      
      newHandBtn.click();
      
      expect(mockGameController.startNewHand).toHaveBeenCalled();
    });
  });
});