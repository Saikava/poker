/**
 * Tests for Player Action Interface functionality
 * Tests action button display, user interactions, and current player highlighting
 */

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const {
  createMockPokerEngine,
  createSampleGameState,
  simulateClick,
  waitForDOMUpdate,
  createTestContainer,
  cleanupTestContainer
} = require('./helpers/testHelpers');

// Mock the GameController
jest.mock('../src/gameController.js', () => {
  return jest.fn().mockImplementation(() => ({
    addPlayer: jest.fn(),
    removePlayer: jest.fn(),
    startGame: jest.fn(),
    startNewHand: jest.fn(),
    playerAction: jest.fn(),
    getPlayerActions: jest.fn(),
    getGameState: jest.fn(),
    getGameStats: jest.fn(),
    canStartGame: jest.fn(),
    getConfig: jest.fn(() => ({ startingChips: 1000 })),
    destroy: jest.fn()
  }));
});

describe('Player Action Interface', () => {
  let dom;
  let document;
  let UIManager;
  let uiManager;
  let mockGameController;

  beforeAll(() => {
    // Read the HTML file
    const htmlPath = path.join(__dirname, '../src/index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Create JSDOM instance
    dom = new JSDOM(htmlContent, {
      url: 'http://localhost',
      pretendToBeVisual: true,
      resources: 'usable'
    });
    
    document = dom.window.document;
    global.document = document;
    global.window = dom.window;
    
    // Import UIManager after setting up DOM
    UIManager = require('../src/uiManager.js').default;
  });

  beforeEach(() => {
    // Create fresh UI manager instance
    uiManager = new UIManager(document);
    mockGameController = uiManager.getGameController();
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (uiManager) {
      uiManager.destroy();
    }
    cleanupTestContainer();
  });

  describe('Action Button Display', () => {
    test('should disable all action buttons when no current player', () => {
      // Setup game state with no current player
      mockGameController.getGameState.mockReturnValue({
        betting: null,
        players: []
      });
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: false
      });

      uiManager.updatePlayerActions({
        betting: null,
        players: []
      });

      const foldBtn = document.getElementById('fold-btn');
      const checkBtn = document.getElementById('check-btn');
      const callBtn = document.getElementById('call-btn');
      const raiseBtn = document.getElementById('raise-btn');

      expect(foldBtn.disabled).toBe(true);
      expect(checkBtn.disabled).toBe(true);
      expect(callBtn.disabled).toBe(true);
      expect(raiseBtn.disabled).toBe(true);
    });

    test('should enable buttons based on available actions', () => {
      const gameState = createSampleGameState({
        betting: { currentPlayer: 'player1' }
      });
      
      mockGameController.getGameState.mockReturnValue(gameState);
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true
      });
      mockGameController.getPlayerActions.mockReturnValue({
        success: true,
        actions: ['fold', 'check', 'raise']
      });

      uiManager.updatePlayerActions(gameState);

      const foldBtn = document.getElementById('fold-btn');
      const checkBtn = document.getElementById('check-btn');
      const callBtn = document.getElementById('call-btn');
      const raiseBtn = document.getElementById('raise-btn');

      expect(foldBtn.disabled).toBe(false);
      expect(checkBtn.disabled).toBe(false);
      expect(callBtn.disabled).toBe(true); // call not in available actions
      expect(raiseBtn.disabled).toBe(false);
    });

    test('should update call button text with call amount', () => {
      const gameState = createSampleGameState({
        betting: { currentPlayer: 'player1' }
      });
      
      mockGameController.getGameState.mockReturnValue(gameState);
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true
      });
      mockGameController.getPlayerActions.mockReturnValue({
        success: true,
        actions: ['fold', 'call'],
        callAmount: 50
      });

      uiManager.updatePlayerActions(gameState);

      const callBtn = document.getElementById('call-btn');
      expect(callBtn.disabled).toBe(false);
      expect(callBtn.textContent).toBe('Call 50');
    });

    test('should hide action buttons when game is not active', () => {
      const gameState = createSampleGameState({
        betting: { currentPlayer: 'player1' }
      });
      
      mockGameController.getGameState.mockReturnValue(gameState);
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: false
      });

      uiManager.updatePlayerActions(gameState);

      const foldBtn = document.getElementById('fold-btn');
      const checkBtn = document.getElementById('check-btn');
      const callBtn = document.getElementById('call-btn');
      const raiseBtn = document.getElementById('raise-btn');

      expect(foldBtn.disabled).toBe(true);
      expect(checkBtn.disabled).toBe(true);
      expect(callBtn.disabled).toBe(true);
      expect(raiseBtn.disabled).toBe(true);
    });
  });

  describe('Current Player Highlighting', () => {
    test('should display current player information', () => {
      const gameState = createSampleGameState({
        betting: { 
          currentPlayer: 'player1',
          callAmount: 20,
          minRaise: 40
        },
        players: [
          {
            id: 'player1',
            name: 'Alice',
            chips: 980,
            bet: 20
          }
        ]
      });

      uiManager.updateCurrentPlayerInfo(gameState, 'player1');

      const currentPlayerInfo = document.getElementById('current-player-info');
      expect(currentPlayerInfo.innerHTML).toContain('Alice');
      expect(currentPlayerInfo.innerHTML).toContain('player1');
      expect(currentPlayerInfo.innerHTML).toContain('Chips: 980');
      expect(currentPlayerInfo.innerHTML).toContain('Current Bet: 20');
      expect(currentPlayerInfo.innerHTML).toContain('Call Amount: 20');
      expect(currentPlayerInfo.innerHTML).toContain('Min Raise: 40');
    });

    test('should show waiting message when no current player', () => {
      uiManager.updateCurrentPlayerInfo({}, null);

      const currentPlayerInfo = document.getElementById('current-player-info');
      expect(currentPlayerInfo.innerHTML).toContain('Waiting for game to start...');
    });

    test('should handle missing player data gracefully', () => {
      const gameState = {
        betting: { currentPlayer: 'nonexistent' },
        players: []
      };

      uiManager.updateCurrentPlayerInfo(gameState, 'nonexistent');

      const currentPlayerInfo = document.getElementById('current-player-info');
      expect(currentPlayerInfo.innerHTML).toContain('No current player');
    });
  });

  describe('Player Action Handling', () => {
    test('should handle fold action successfully', async () => {
      const gameState = createSampleGameState({
        betting: { currentPlayer: 'player1' }
      });
      
      mockGameController.getGameState.mockReturnValue(gameState);
      mockGameController.playerAction.mockReturnValue({ success: true });

      uiManager.handlePlayerAction('fold');

      expect(mockGameController.playerAction).toHaveBeenCalledWith({
        playerId: 'player1',
        action: 'fold'
      });
    });

    test('should handle check action successfully', async () => {
      const gameState = createSampleGameState({
        betting: { currentPlayer: 'player1' }
      });
      
      mockGameController.getGameState.mockReturnValue(gameState);
      mockGameController.playerAction.mockReturnValue({ success: true });

      uiManager.handlePlayerAction('check');

      expect(mockGameController.playerAction).toHaveBeenCalledWith({
        playerId: 'player1',
        action: 'check'
      });
    });

    test('should handle call action successfully', async () => {
      const gameState = createSampleGameState({
        betting: { currentPlayer: 'player1' }
      });
      
      mockGameController.getGameState.mockReturnValue(gameState);
      mockGameController.playerAction.mockReturnValue({ success: true });

      uiManager.handlePlayerAction('call');

      expect(mockGameController.playerAction).toHaveBeenCalledWith({
        playerId: 'player1',
        action: 'call'
      });
    });

    test('should show error when no current player for action', () => {
      mockGameController.getGameState.mockReturnValue({
        betting: null
      });

      const showErrorSpy = jest.spyOn(uiManager, 'showError');
      uiManager.handlePlayerAction('fold');

      expect(showErrorSpy).toHaveBeenCalledWith('No current player to perform action');
    });

    test('should show error when action fails', () => {
      const gameState = createSampleGameState({
        betting: { currentPlayer: 'player1' }
      });
      
      mockGameController.getGameState.mockReturnValue(gameState);
      mockGameController.playerAction.mockReturnValue({
        success: false,
        error: { message: 'Invalid action' }
      });

      const showErrorSpy = jest.spyOn(uiManager, 'showError');
      uiManager.handlePlayerAction('fold');

      expect(showErrorSpy).toHaveBeenCalledWith('Invalid action');
    });
  });

  describe('Raise Functionality', () => {
    test('should show raise controls when raise button clicked', () => {
      const gameState = createSampleGameState({
        betting: { currentPlayer: 'player1' }
      });
      
      mockGameController.getGameState.mockReturnValue(gameState);
      mockGameController.getPlayerActions.mockReturnValue({
        success: true,
        minRaise: 40,
        maxRaise: 500
      });

      uiManager.handleRaiseClick();

      const raiseControls = document.getElementById('raise-controls');
      const raiseAmount = document.getElementById('raise-amount');

      expect(raiseControls.style.display).toBe('block');
      expect(raiseAmount.min).toBe('40');
      expect(raiseAmount.max).toBe('500');
      expect(raiseAmount.value).toBe('40');
    });

    test('should handle confirm raise successfully', () => {
      const gameState = createSampleGameState({
        betting: { currentPlayer: 'player1' }
      });
      
      mockGameController.getGameState.mockReturnValue(gameState);
      mockGameController.playerAction.mockReturnValue({ success: true });

      // Set raise amount
      const raiseAmount = document.getElementById('raise-amount');
      raiseAmount.value = '100';

      uiManager.handleConfirmRaise();

      expect(mockGameController.playerAction).toHaveBeenCalledWith({
        playerId: 'player1',
        action: 'raise',
        amount: 100
      });

      const raiseControls = document.getElementById('raise-controls');
      expect(raiseControls.style.display).toBe('none');
    });

    test('should validate raise amount', () => {
      const gameState = createSampleGameState({
        betting: { currentPlayer: 'player1' }
      });
      
      mockGameController.getGameState.mockReturnValue(gameState);

      // Set invalid raise amount
      const raiseAmount = document.getElementById('raise-amount');
      raiseAmount.value = 'invalid';

      const showErrorSpy = jest.spyOn(uiManager, 'showError');
      uiManager.handleConfirmRaise();

      expect(showErrorSpy).toHaveBeenCalledWith('Please enter a valid raise amount');
      expect(mockGameController.playerAction).not.toHaveBeenCalled();
    });

    test('should handle cancel raise', () => {
      // Show raise controls first
      const raiseControls = document.getElementById('raise-controls');
      raiseControls.style.display = 'block';

      const raiseAmount = document.getElementById('raise-amount');
      raiseAmount.value = '100';

      uiManager.handleCancelRaise();

      expect(raiseControls.style.display).toBe('none');
      expect(raiseAmount.value).toBe('');
    });

    test('should show error when raise fails', () => {
      const gameState = createSampleGameState({
        betting: { currentPlayer: 'player1' }
      });
      
      mockGameController.getGameState.mockReturnValue(gameState);
      mockGameController.playerAction.mockReturnValue({
        success: false,
        error: { message: 'Insufficient chips' }
      });

      const raiseAmount = document.getElementById('raise-amount');
      raiseAmount.value = '100';

      const showErrorSpy = jest.spyOn(uiManager, 'showError');
      uiManager.handleConfirmRaise();

      expect(showErrorSpy).toHaveBeenCalledWith('Insufficient chips');
    });
  });

  describe('User Interaction Events', () => {
    test('should handle fold button click', () => {
      const gameState = createSampleGameState({
        betting: { currentPlayer: 'player1' }
      });
      
      mockGameController.getGameState.mockReturnValue(gameState);
      mockGameController.playerAction.mockReturnValue({ success: true });

      const foldBtn = document.getElementById('fold-btn');
      simulateClick(foldBtn);

      expect(mockGameController.playerAction).toHaveBeenCalledWith({
        playerId: 'player1',
        action: 'fold'
      });
    });

    test('should handle check button click', () => {
      const gameState = createSampleGameState({
        betting: { currentPlayer: 'player1' }
      });
      
      mockGameController.getGameState.mockReturnValue(gameState);
      mockGameController.playerAction.mockReturnValue({ success: true });

      const checkBtn = document.getElementById('check-btn');
      simulateClick(checkBtn);

      expect(mockGameController.playerAction).toHaveBeenCalledWith({
        playerId: 'player1',
        action: 'check'
      });
    });

    test('should handle call button click', () => {
      const gameState = createSampleGameState({
        betting: { currentPlayer: 'player1' }
      });
      
      mockGameController.getGameState.mockReturnValue(gameState);
      mockGameController.playerAction.mockReturnValue({ success: true });

      const callBtn = document.getElementById('call-btn');
      simulateClick(callBtn);

      expect(mockGameController.playerAction).toHaveBeenCalledWith({
        playerId: 'player1',
        action: 'call'
      });
    });

    test('should handle raise button click', () => {
      const gameState = createSampleGameState({
        betting: { currentPlayer: 'player1' }
      });
      
      mockGameController.getGameState.mockReturnValue(gameState);
      mockGameController.getPlayerActions.mockReturnValue({
        success: true,
        minRaise: 40,
        maxRaise: 500
      });

      const raiseBtn = document.getElementById('raise-btn');
      simulateClick(raiseBtn);

      const raiseControls = document.getElementById('raise-controls');
      expect(raiseControls.style.display).toBe('block');
    });

    test('should handle confirm raise button click', () => {
      const gameState = createSampleGameState({
        betting: { currentPlayer: 'player1' }
      });
      
      mockGameController.getGameState.mockReturnValue(gameState);
      mockGameController.playerAction.mockReturnValue({ success: true });

      const raiseAmount = document.getElementById('raise-amount');
      raiseAmount.value = '100';

      const confirmRaiseBtn = document.getElementById('confirm-raise-btn');
      simulateClick(confirmRaiseBtn);

      expect(mockGameController.playerAction).toHaveBeenCalledWith({
        playerId: 'player1',
        action: 'raise',
        amount: 100
      });
    });

    test('should handle cancel raise button click', () => {
      const raiseControls = document.getElementById('raise-controls');
      raiseControls.style.display = 'block';

      const cancelRaiseBtn = document.getElementById('cancel-raise-btn');
      simulateClick(cancelRaiseBtn);

      expect(raiseControls.style.display).toBe('none');
    });

    test('should handle Enter key in raise amount input', () => {
      const gameState = createSampleGameState({
        betting: { currentPlayer: 'player1' }
      });
      
      mockGameController.getGameState.mockReturnValue(gameState);
      mockGameController.playerAction.mockReturnValue({ success: true });

      const raiseAmount = document.getElementById('raise-amount');
      raiseAmount.value = '100';

      // Simulate Enter key press
      const enterEvent = new dom.window.KeyboardEvent('keypress', { key: 'Enter' });
      raiseAmount.dispatchEvent(enterEvent);

      expect(mockGameController.playerAction).toHaveBeenCalledWith({
        playerId: 'player1',
        action: 'raise',
        amount: 100
      });
    });
  });

  describe('Integration with Game State Updates', () => {
    test('should update player actions when game state changes', () => {
      const gameState = createSampleGameState({
        betting: { currentPlayer: 'player1' }
      });
      
      mockGameController.getGameState.mockReturnValue(gameState);
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        handNumber: 1,
        currentPhase: 'preflop'
      });
      mockGameController.getPlayerActions.mockReturnValue({
        success: true,
        actions: ['fold', 'check', 'raise']
      });
      mockGameController.canStartGame.mockReturnValue({
        canStart: false
      });

      uiManager.updateGameStateDisplay();

      const foldBtn = document.getElementById('fold-btn');
      const checkBtn = document.getElementById('check-btn');
      const raiseBtn = document.getElementById('raise-btn');

      expect(foldBtn.disabled).toBe(false);
      expect(checkBtn.disabled).toBe(false);
      expect(raiseBtn.disabled).toBe(false);
    });

    test('should clear errors when performing actions', () => {
      const gameState = createSampleGameState({
        betting: { currentPlayer: 'player1' }
      });
      
      mockGameController.getGameState.mockReturnValue(gameState);
      mockGameController.playerAction.mockReturnValue({ success: true });

      // Show an error first
      uiManager.showError('Test error');
      const errorDisplay = document.getElementById('error-display');
      expect(errorDisplay.style.display).toBe('block');

      // Perform action - should clear error
      uiManager.handlePlayerAction('fold');

      expect(errorDisplay.style.display).toBe('none');
    });
  });
});