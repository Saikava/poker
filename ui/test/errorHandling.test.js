/**
 * Error Handling Tests for Poker UI
 * Tests error display and clearing functionality
 */

import { JSDOM } from 'jsdom';
import UIManager from '../src/uiManager.js';

// Mock the GameController
const createMockGameController = () => ({
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
  canStartGame: jest.fn(() => ({ canStart: false, playerCount: 0 }))
});

describe('Error Handling', () => {
  let dom;
  let document;
  let uiManager;
  let mockGameController;

  beforeEach(() => {
    // Create DOM environment
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="app">
            <!-- Player Management -->
            <input type="text" id="player-id">
            <input type="text" id="player-name">
            <button id="add-player-btn">Add Player</button>
            <div id="players-container"></div>
            
            <!-- Game Controls -->
            <button id="start-game-btn">Start Game</button>
            <button id="new-hand-btn">New Hand</button>
            
            <!-- Game State Display -->
            <div id="game-phase">Not Started</div>
            <div id="hand-number">0</div>
            <div id="current-player">None</div>
            <div id="total-pot">$0</div>
            <div id="side-pots">None</div>
            <div id="community-cards-container"></div>
            <div id="players-grid"></div>
            
            <!-- Player Actions -->
            <div id="current-player-info"></div>
            <div id="action-buttons">
              <button id="fold-btn">Fold</button>
              <button id="check-btn">Check</button>
              <button id="call-btn">Call</button>
              <button id="raise-btn">Raise</button>
            </div>
            <div id="raise-controls" style="display: none;">
              <input type="number" id="raise-amount">
              <button id="confirm-raise-btn">Confirm Raise</button>
              <button id="cancel-raise-btn">Cancel</button>
            </div>
            
            <!-- Error Display -->
            <section class="error-display" id="error-display" style="display: none;">
              <h2>Error</h2>
              <div class="error-message" id="error-message"></div>
              <button type="button" id="clear-error-btn" class="btn btn-secondary">Clear Error</button>
            </section>
            
            <!-- Hand Results -->
            <section id="hand-results" style="display: none;">
              <div id="results-content"></div>
            </section>
          </div>
        </body>
      </html>
    `);
    
    document = dom.window.document;
    global.document = document;
    global.window = dom.window;
    
    // Create UI manager with mocked game controller
    uiManager = new UIManager(document);
    mockGameController = createMockGameController();
    uiManager.gameController = mockGameController;
  });

  afterEach(() => {
    dom.window.close();
  });

  describe('Error Display Functionality', () => {
    test('should show error message when showError is called', () => {
      const errorMessage = 'Test error message';
      
      uiManager.showError(errorMessage);
      
      const errorDisplay = document.getElementById('error-display');
      const errorMessageElement = document.getElementById('error-message');
      
      expect(errorDisplay.style.display).toBe('block');
      expect(errorMessageElement.textContent).toBe(errorMessage);
    });

    test('should handle empty error messages', () => {
      uiManager.showError('');
      
      const errorDisplay = document.getElementById('error-display');
      const errorMessageElement = document.getElementById('error-message');
      
      expect(errorDisplay.style.display).toBe('block');
      expect(errorMessageElement.textContent).toBe('');
    });

    test('should handle null or undefined error messages', () => {
      uiManager.showError(null);
      
      const errorDisplay = document.getElementById('error-display');
      const errorMessageElement = document.getElementById('error-message');
      
      expect(errorDisplay.style.display).toBe('block');
      expect(errorMessageElement.textContent).toBe('');
      
      uiManager.showError(undefined);
      expect(errorMessageElement.textContent).toBe('');
    });

    test('should replace previous error message when new error is shown', () => {
      uiManager.showError('First error');
      expect(document.getElementById('error-message').textContent).toBe('First error');
      
      uiManager.showError('Second error');
      expect(document.getElementById('error-message').textContent).toBe('Second error');
    });

    test('should display complex error objects as strings', () => {
      const complexError = { type: 'ValidationError', message: 'Invalid input', code: 400 };
      
      uiManager.showError(complexError);
      
      const errorMessageElement = document.getElementById('error-message');
      expect(errorMessageElement.textContent).toContain('[object Object]');
    });
  });

  describe('Error Clearing Functionality', () => {
    test('should clear error message when clearError is called', () => {
      // First show an error
      uiManager.showError('Test error');
      expect(document.getElementById('error-display').style.display).toBe('block');
      expect(document.getElementById('error-message').textContent).toBe('Test error');
      
      // Then clear it
      uiManager.clearError();
      
      const errorDisplay = document.getElementById('error-display');
      const errorMessageElement = document.getElementById('error-message');
      
      expect(errorDisplay.style.display).toBe('none');
      expect(errorMessageElement.textContent).toBe('');
    });

    test('should handle clearing when no error is displayed', () => {
      // Clear error when none is shown - should not throw
      expect(() => uiManager.clearError()).not.toThrow();
      
      const errorDisplay = document.getElementById('error-display');
      const errorMessageElement = document.getElementById('error-message');
      
      expect(errorDisplay.style.display).toBe('none');
      expect(errorMessageElement.textContent).toBe('');
    });

    test('should clear error when clear error button is clicked', () => {
      // Show an error first
      uiManager.showError('Test error');
      expect(document.getElementById('error-display').style.display).toBe('block');
      
      // Click clear error button
      const clearErrorBtn = document.getElementById('clear-error-btn');
      clearErrorBtn.click();
      
      const errorDisplay = document.getElementById('error-display');
      const errorMessageElement = document.getElementById('error-message');
      
      expect(errorDisplay.style.display).toBe('none');
      expect(errorMessageElement.textContent).toBe('');
    });
  });

  describe('Automatic Error Clearing on Actions', () => {
    test('should clear errors when adding a player', () => {
      // Set up successful add player response
      mockGameController.addPlayer.mockReturnValue({ success: true });
      mockGameController.canStartGame.mockReturnValue({ canStart: true, playerCount: 1 });
      
      // Show an error first
      uiManager.showError('Previous error');
      expect(document.getElementById('error-display').style.display).toBe('block');
      
      // Set up form inputs
      document.getElementById('player-id').value = 'player1';
      document.getElementById('player-name').value = 'Player One';
      
      // Add player
      uiManager.handleAddPlayer();
      
      // Error should be cleared
      const errorDisplay = document.getElementById('error-display');
      expect(errorDisplay.style.display).toBe('none');
    });

    test('should clear errors when removing a player', () => {
      // Set up successful remove player response
      mockGameController.removePlayer.mockReturnValue({ success: true });
      mockGameController.canStartGame.mockReturnValue({ canStart: false, playerCount: 0 });
      
      // Show an error first
      uiManager.showError('Previous error');
      expect(document.getElementById('error-display').style.display).toBe('block');
      
      // Remove player
      uiManager.handleRemovePlayer('player1');
      
      // Error should be cleared
      const errorDisplay = document.getElementById('error-display');
      expect(errorDisplay.style.display).toBe('none');
    });

    test('should clear errors when starting a game', () => {
      // Set up successful start game response
      mockGameController.startGame.mockReturnValue({ success: true });
      mockGameController.getGameState.mockReturnValue({
        gameInfo: { isActive: true },
        players: [],
        table: { communityCards: [] },
        betting: {},
        pots: { total: 0 }
      });
      mockGameController.getGameStats.mockReturnValue({
        handNumber: 1,
        currentPhase: 'preflop',
        isGameActive: true
      });
      
      // Show an error first
      uiManager.showError('Previous error');
      expect(document.getElementById('error-display').style.display).toBe('block');
      
      // Start game
      uiManager.handleStartGame();
      
      // Error should be cleared
      const errorDisplay = document.getElementById('error-display');
      expect(errorDisplay.style.display).toBe('none');
    });

    test('should clear errors when starting a new hand', () => {
      // Set up successful start new hand response
      mockGameController.startNewHand.mockReturnValue({ success: true });
      mockGameController.getGameState.mockReturnValue({
        gameInfo: { isActive: true },
        players: [],
        table: { communityCards: [] },
        betting: {},
        pots: { total: 0 }
      });
      mockGameController.getGameStats.mockReturnValue({
        handNumber: 2,
        currentPhase: 'preflop',
        isGameActive: true
      });
      
      // Show an error first
      uiManager.showError('Previous error');
      expect(document.getElementById('error-display').style.display).toBe('block');
      
      // Start new hand
      uiManager.handleNewHand();
      
      // Error should be cleared
      const errorDisplay = document.getElementById('error-display');
      expect(errorDisplay.style.display).toBe('none');
    });

    test('should clear errors when performing player actions', () => {
      // Set up successful player action response
      mockGameController.playerAction.mockReturnValue({ success: true });
      mockGameController.getGameState.mockReturnValue({
        gameInfo: { isActive: true },
        players: [{ id: 'player1', name: 'Player One' }],
        table: { communityCards: [] },
        betting: { currentPlayer: 'player1' },
        pots: { total: 0 }
      });
      mockGameController.getGameStats.mockReturnValue({
        handNumber: 1,
        currentPhase: 'preflop',
        isGameActive: true
      });
      
      // Show an error first
      uiManager.showError('Previous error');
      expect(document.getElementById('error-display').style.display).toBe('block');
      
      // Perform player action
      uiManager.handlePlayerAction('fold');
      
      // Error should be cleared
      const errorDisplay = document.getElementById('error-display');
      expect(errorDisplay.style.display).toBe('none');
    });

    test('should clear errors when clicking raise button', () => {
      // Set up successful get player actions response
      mockGameController.getPlayerActions.mockReturnValue({
        success: true,
        actions: ['raise'],
        minRaise: 20,
        maxRaise: 1000
      });
      mockGameController.getGameState.mockReturnValue({
        gameInfo: { isActive: true },
        players: [{ id: 'player1', name: 'Player One' }],
        table: { communityCards: [] },
        betting: { currentPlayer: 'player1' },
        pots: { total: 0 }
      });
      
      // Show an error first
      uiManager.showError('Previous error');
      expect(document.getElementById('error-display').style.display).toBe('block');
      
      // Click raise button
      uiManager.handleRaiseClick();
      
      // Error should be cleared
      const errorDisplay = document.getElementById('error-display');
      expect(errorDisplay.style.display).toBe('none');
    });

    test('should clear errors when confirming raise', () => {
      // Set up successful raise action response
      mockGameController.playerAction.mockReturnValue({ success: true });
      mockGameController.getGameState.mockReturnValue({
        gameInfo: { isActive: true },
        players: [{ id: 'player1', name: 'Player One' }],
        table: { communityCards: [] },
        betting: { currentPlayer: 'player1' },
        pots: { total: 0 }
      });
      mockGameController.getGameStats.mockReturnValue({
        handNumber: 1,
        currentPhase: 'preflop',
        isGameActive: true
      });
      
      // Show an error first
      uiManager.showError('Previous error');
      expect(document.getElementById('error-display').style.display).toBe('block');
      
      // Set up raise amount
      document.getElementById('raise-amount').value = '50';
      
      // Confirm raise
      uiManager.handleConfirmRaise();
      
      // Error should be cleared
      const errorDisplay = document.getElementById('error-display');
      expect(errorDisplay.style.display).toBe('none');
    });
  });

  describe('Poker Engine Error Display', () => {
    test('should display poker engine errors without processing - add player', () => {
      const pokerEngineError = {
        type: 'ValidationError',
        message: 'Player ID already exists',
        code: 'DUPLICATE_PLAYER'
      };
      
      mockGameController.addPlayer.mockReturnValue({
        success: false,
        error: pokerEngineError
      });
      
      // Set up form inputs
      document.getElementById('player-id').value = 'player1';
      document.getElementById('player-name').value = 'Player One';
      
      // Add player
      uiManager.handleAddPlayer();
      
      // Should display the exact error message from poker engine
      const errorDisplay = document.getElementById('error-display');
      const errorMessageElement = document.getElementById('error-message');
      
      expect(errorDisplay.style.display).toBe('block');
      expect(errorMessageElement.textContent).toBe(pokerEngineError.message);
    });

    test('should display poker engine errors without processing - remove player', () => {
      const pokerEngineError = {
        type: 'GameStateError',
        message: 'Cannot remove player during active hand',
        code: 'PLAYER_IN_HAND'
      };
      
      mockGameController.removePlayer.mockReturnValue({
        success: false,
        error: pokerEngineError
      });
      
      // Remove player
      uiManager.handleRemovePlayer('player1');
      
      // Should display the exact error message from poker engine
      const errorDisplay = document.getElementById('error-display');
      const errorMessageElement = document.getElementById('error-message');
      
      expect(errorDisplay.style.display).toBe('block');
      expect(errorMessageElement.textContent).toBe(pokerEngineError.message);
    });

    test('should display poker engine errors without processing - start game', () => {
      const pokerEngineError = {
        type: 'GameStateError',
        message: 'Minimum 2 players required to start game',
        code: 'INSUFFICIENT_PLAYERS'
      };
      
      mockGameController.startGame.mockReturnValue({
        success: false,
        error: pokerEngineError
      });
      
      // Start game
      uiManager.handleStartGame();
      
      // Should display the exact error message from poker engine
      const errorDisplay = document.getElementById('error-display');
      const errorMessageElement = document.getElementById('error-message');
      
      expect(errorDisplay.style.display).toBe('block');
      expect(errorMessageElement.textContent).toBe(pokerEngineError.message);
    });

    test('should display poker engine errors without processing - player action', () => {
      const pokerEngineError = {
        type: 'ActionError',
        message: 'Invalid action: cannot check when bet is required',
        code: 'INVALID_ACTION'
      };
      
      mockGameController.playerAction.mockReturnValue({
        success: false,
        error: pokerEngineError
      });
      mockGameController.getGameState.mockReturnValue({
        gameInfo: { isActive: true },
        players: [{ id: 'player1', name: 'Player One' }],
        table: { communityCards: [] },
        betting: { currentPlayer: 'player1' },
        pots: { total: 0 }
      });
      
      // Perform player action
      uiManager.handlePlayerAction('check');
      
      // Should display the exact error message from poker engine
      const errorDisplay = document.getElementById('error-display');
      const errorMessageElement = document.getElementById('error-message');
      
      expect(errorDisplay.style.display).toBe('block');
      expect(errorMessageElement.textContent).toBe(pokerEngineError.message);
    });

    test('should handle poker engine errors without error object', () => {
      mockGameController.addPlayer.mockReturnValue({
        success: false
        // No error object provided
      });
      
      // Set up form inputs
      document.getElementById('player-id').value = 'player1';
      document.getElementById('player-name').value = 'Player One';
      
      // Add player
      uiManager.handleAddPlayer();
      
      // Should display fallback error message
      const errorDisplay = document.getElementById('error-display');
      const errorMessageElement = document.getElementById('error-message');
      
      expect(errorDisplay.style.display).toBe('block');
      expect(errorMessageElement.textContent).toBe('Failed to add player');
    });

    test('should handle poker engine errors with null error message', () => {
      mockGameController.startGame.mockReturnValue({
        success: false,
        error: {
          type: 'GameStateError',
          message: null,
          code: 'UNKNOWN_ERROR'
        }
      });
      
      // Start game
      uiManager.handleStartGame();
      
      // Should display fallback error message when poker engine error message is null
      const errorDisplay = document.getElementById('error-display');
      const errorMessageElement = document.getElementById('error-message');
      
      expect(errorDisplay.style.display).toBe('block');
      expect(errorMessageElement.textContent).toBe('Failed to start game');
    });
  });

  describe('Error State Maintenance', () => {
    test('should maintain current state when invalid action is attempted', () => {
      const pokerEngineError = {
        type: 'ActionError',
        message: 'Invalid action: not your turn',
        code: 'NOT_CURRENT_PLAYER'
      };
      
      mockGameController.playerAction.mockReturnValue({
        success: false,
        error: pokerEngineError
      });
      mockGameController.getGameState.mockReturnValue({
        gameInfo: { isActive: true },
        players: [
          { id: 'player1', name: 'Player One', chips: 1000 },
          { id: 'player2', name: 'Player Two', chips: 1000 }
        ],
        table: { communityCards: [] },
        betting: { currentPlayer: 'player2' },
        pots: { total: 40 }
      });
      
      // Attempt invalid action
      uiManager.handlePlayerAction('fold');
      
      // Should display error
      const errorDisplay = document.getElementById('error-display');
      expect(errorDisplay.style.display).toBe('block');
      
      // Game state should remain unchanged (refreshUI not called on error)
      expect(mockGameController.playerAction).toHaveBeenCalledTimes(1);
      // refreshUI would call getGameState multiple times, but on error it should only be called once
      expect(mockGameController.getGameState).toHaveBeenCalledTimes(1);
    });

    test('should not clear form inputs when add player fails', () => {
      const pokerEngineError = {
        type: 'ValidationError',
        message: 'Player name too long',
        code: 'INVALID_NAME'
      };
      
      mockGameController.addPlayer.mockReturnValue({
        success: false,
        error: pokerEngineError
      });
      
      // Set up form inputs
      const playerIdInput = document.getElementById('player-id');
      const playerNameInput = document.getElementById('player-name');
      playerIdInput.value = 'player1';
      playerNameInput.value = 'Very Long Player Name That Exceeds Limit';
      
      // Add player (should fail)
      uiManager.handleAddPlayer();
      
      // Form inputs should remain unchanged
      expect(playerIdInput.value).toBe('player1');
      expect(playerNameInput.value).toBe('Very Long Player Name That Exceeds Limit');
      
      // Error should be displayed
      const errorDisplay = document.getElementById('error-display');
      expect(errorDisplay.style.display).toBe('block');
    });
  });

  describe('Error Message Formatting', () => {
    test('should display error messages as plain text', () => {
      const errorWithHtml = '<script>alert("xss")</script>Error message';
      
      uiManager.showError(errorWithHtml);
      
      const errorMessageElement = document.getElementById('error-message');
      // Should display as plain text, not execute HTML
      expect(errorMessageElement.textContent).toBe(errorWithHtml);
      // innerHTML will be escaped by textContent assignment
      expect(errorMessageElement.innerHTML).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;Error message');
    });

    test('should handle multiline error messages', () => {
      const multilineError = 'Line 1\nLine 2\nLine 3';
      
      uiManager.showError(multilineError);
      
      const errorMessageElement = document.getElementById('error-message');
      expect(errorMessageElement.textContent).toBe(multilineError);
    });

    test('should handle very long error messages', () => {
      const longError = 'A'.repeat(1000);
      
      uiManager.showError(longError);
      
      const errorMessageElement = document.getElementById('error-message');
      expect(errorMessageElement.textContent).toBe(longError);
      expect(errorMessageElement.textContent.length).toBe(1000);
    });
  });
});