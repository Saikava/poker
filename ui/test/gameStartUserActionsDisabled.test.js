/**
 * Test to reproduce the issue where user actions remain disabled after starting the game
 * This test specifically checks the scenario where:
 * 1. Two players are added
 * 2. Game is started successfully
 * 3. User actions should be enabled but remain disabled with "Waiting for game to start..." message
 */

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

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
    getConfig: jest.fn(() => ({ startingChips: 1000, minPlayers: 2, maxPlayers: 6 })),
    destroy: jest.fn()
  }));
});

describe('Game Start User Actions Disabled Bug', () => {
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
    mockGameController = uiManager.gameController;
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (uiManager) {
      uiManager.destroy();
    }
  });

  afterAll(() => {
    // Clean up global references
    delete global.document;
    delete global.window;
    delete global.HTMLElement;
    delete global.Event;
  });

  describe('Reproduce User Actions Disabled Bug', () => {
    test('should enable user actions after successfully starting game with 2 players', () => {
      // Step 1: Add first player
      mockGameController.addPlayer.mockReturnValue({
        success: true,
        player: { id: 'player1', name: 'Alice', chips: 1000 }
      });
      mockGameController.canStartGame.mockReturnValue({ canStart: false });
      
      // Simulate adding first player
      const playerIdInput = document.getElementById('player-id');
      const playerNameInput = document.getElementById('player-name');
      playerIdInput.value = 'player1';
      playerNameInput.value = 'Alice';
      
      uiManager.handleAddPlayer();
      
      expect(mockGameController.addPlayer).toHaveBeenCalledWith({
        id: 'player1',
        name: 'Alice',
        chips: 1000
      });

      // Step 2: Add second player
      mockGameController.addPlayer.mockReturnValue({
        success: true,
        player: { id: 'player2', name: 'Bob', chips: 1000 }
      });
      mockGameController.canStartGame.mockReturnValue({ canStart: true });
      
      playerIdInput.value = 'player2';
      playerNameInput.value = 'Bob';
      
      uiManager.handleAddPlayer();
      
      expect(mockGameController.addPlayer).toHaveBeenCalledWith({
        id: 'player2',
        name: 'Bob',
        chips: 1000
      });

      // Verify start game button is enabled
      const startGameBtn = document.getElementById('start-game-btn');
      expect(startGameBtn.disabled).toBe(false);

      // Step 3: Start the game successfully
      mockGameController.startGame.mockReturnValue({ success: true });
      
      // Mock game state after starting - this is the key part that might be missing
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'preflop',
        handNumber: 1
      });
      
      // Mock game state with current player set
      mockGameController.getGameState.mockReturnValue({
        gameInfo: {
          isActive: true,
          phase: 'preflop',
          handNumber: 1,
          currentPlayer: 'player1'
        },
        players: [
          {
            id: 'player1',
            name: 'Alice',
            chips: 980,
            cards: [{ rank: 'A', suit: 'hearts' }, { rank: 'K', suit: 'spades' }],
            position: 0,
            status: 'active',
            currentBet: 20,
            totalBet: 20,
            isDealer: false,
            isCurrentPlayer: true
          },
          {
            id: 'player2',
            name: 'Bob',
            chips: 990,
            cards: [{ rank: 'Q', suit: 'diamonds' }, { rank: 'J', suit: 'clubs' }],
            position: 1,
            status: 'active',
            currentBet: 10,
            totalBet: 10,
            isDealer: true,
            isCurrentPlayer: false
          }
        ],
        table: {
          communityCards: [],
          dealerPosition: 1,
          activePlayerCount: 2,
          playersInHand: 2
        },
        betting: {
          currentPlayer: 'player1',
          currentBet: 20,
          minRaise: 20,
          bettingRound: 1,
          bettingComplete: false,
          lastAggressor: null,
          callAmount: 10
        },
        pots: {
          total: 30,
          main: 30,
          sidePots: [],
          details: []
        },
        config: {
          smallBlind: 10,
          bigBlind: 20,
          maxPlayers: 6,
          minPlayers: 2
        }
      });

      // Mock available player actions
      mockGameController.getPlayerActions.mockReturnValue({
        success: true,
        availableActions: ['fold', 'call', 'raise'],
        actionDetails: {
          callAmount: 10,
          minRaise: 20
        }
      });

      // Start the game
      uiManager.handleStartGame();
      
      expect(mockGameController.startGame).toHaveBeenCalled();

      // Step 4: Verify the UI state after starting the game
      
      // Check that start game button is disabled and shows "Game Active"
      expect(startGameBtn.disabled).toBe(true);
      expect(startGameBtn.textContent).toBe('Game Active');

      // Check current player info - this is where the bug likely occurs
      const currentPlayerInfo = document.getElementById('current-player-info');
      
      // BUG: This should show current player info, not "Waiting for game to start..."
      console.log('Current player info content:', currentPlayerInfo.innerHTML);
      
      // The bug is that this shows "Waiting for game to start..." instead of player info
      expect(currentPlayerInfo.innerHTML).not.toContain('Waiting for game to start...');
      expect(currentPlayerInfo.innerHTML).toContain('Alice');
      expect(currentPlayerInfo.innerHTML).toContain('player1');

      // Check that action buttons are enabled
      const foldBtn = document.getElementById('fold-btn');
      const callBtn = document.getElementById('call-btn');
      const raiseBtn = document.getElementById('raise-btn');

      // BUG: These buttons should be enabled but remain disabled
      expect(foldBtn.disabled).toBe(false);
      expect(callBtn.disabled).toBe(false);
      expect(raiseBtn.disabled).toBe(false);
      
      // Verify call button shows correct amount
      expect(callBtn.textContent).toBe('Call 10');
    });

    test('should show correct current player info when game starts', () => {
      // Setup game state after starting
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'preflop',
        handNumber: 1
      });
      
      const gameState = {
        betting: { 
          currentPlayer: 'player1',
          callAmount: 10,
          minRaise: 20
        },
        players: [
          {
            id: 'player1',
            name: 'Alice',
            chips: 980,
            bet: 20
          }
        ]
      };
      
      mockGameController.getGameState.mockReturnValue(gameState);

      // This should update the current player info correctly
      uiManager.updateCurrentPlayerInfo(gameState, 'player1');

      const currentPlayerInfo = document.getElementById('current-player-info');
      
      // Verify current player info is displayed correctly
      expect(currentPlayerInfo.innerHTML).toContain('Current Player: Alice (player1)');
      expect(currentPlayerInfo.innerHTML).toContain('Chips: 980');
      expect(currentPlayerInfo.innerHTML).toContain('Current Bet: 20');
      expect(currentPlayerInfo.innerHTML).toContain('Call Amount: 10');
      expect(currentPlayerInfo.innerHTML).toContain('Min Raise: 20');
      
      // Should NOT show waiting message
      expect(currentPlayerInfo.innerHTML).not.toContain('Waiting for game to start...');
    });

    test('should enable action buttons when current player is set', () => {
      // Setup active game with current player
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'preflop',
        handNumber: 1
      });
      
      mockGameController.getPlayerActions.mockReturnValue({
        success: true,
        availableActions: ['fold', 'call', 'raise'],
        actionDetails: {
          callAmount: 10,
          minRaise: 20
        }
      });

      // Update action buttons for current player
      uiManager.updateActionButtons('player1', {
        isGameActive: true,
        currentPhase: 'preflop'
      });

      const foldBtn = document.getElementById('fold-btn');
      const callBtn = document.getElementById('call-btn');
      const raiseBtn = document.getElementById('raise-btn');

      // All buttons should be enabled
      expect(foldBtn.disabled).toBe(false);
      expect(callBtn.disabled).toBe(false);
      expect(raiseBtn.disabled).toBe(false);
      
      // Call button should show amount
      expect(callBtn.textContent).toBe('Call 10');
    });

    test('should identify the root cause of the bug - missing currentPlayer in betting object', () => {
      // This test demonstrates the actual root cause:
      // The PokerEngine's getGameState() returns currentPlayer in gameInfo.currentPlayer
      // but the UI Manager looks for it in gameState.betting.currentPlayer
      
      // Setup: Game state with currentPlayer in gameInfo but not in betting
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'preflop',
        handNumber: 1
      });
      
      const gameStateWithBug = {
        gameInfo: { currentPlayer: 'player1' }, // currentPlayer is here
        betting: { 
          // currentPlayer: 'player1', // but NOT here - this causes the bug
          currentBet: 20,
          minRaise: 20
        },
        players: [{ id: 'player1', name: 'Alice', chips: 980, bet: 20 }]
      };
      
      mockGameController.getGameState.mockReturnValue(gameStateWithBug);
      
      const foldBtn = document.getElementById('fold-btn');
      const currentPlayerInfo = document.getElementById('current-player-info');
      
      // Call updatePlayerActions with the buggy game state
      uiManager.updatePlayerActions(gameStateWithBug);
      
      // This should show the bug - "Waiting for game to start..." because
      // updateCurrentPlayerInfo looks for gameState.betting.currentPlayer which is null
      expect(currentPlayerInfo.innerHTML).toContain('Waiting for game to start...');
      expect(foldBtn.disabled).toBe(true);
      
      // Now test with the fixed game state structure
      const gameStateFixed = {
        gameInfo: { currentPlayer: 'player1' },
        betting: { 
          currentPlayer: 'player1', // Now currentPlayer is also in betting
          currentBet: 20,
          minRaise: 20,
          callAmount: 10
        },
        players: [{ id: 'player1', name: 'Alice', chips: 980, bet: 20 }]
      };
      
      mockGameController.getGameState.mockReturnValue(gameStateFixed);
      mockGameController.getPlayerActions.mockReturnValue({
        success: true,
        availableActions: ['fold', 'call', 'raise'],
        actionDetails: {
          callAmount: 10
        }
      });
      
      // Call updatePlayerActions with the fixed game state
      uiManager.updatePlayerActions(gameStateFixed);
      
      // Now it should work correctly
      expect(currentPlayerInfo.innerHTML).not.toContain('Waiting for game to start...');
      expect(currentPlayerInfo.innerHTML).toContain('Alice');
      expect(foldBtn.disabled).toBe(false);
    });
  });

  describe('Debug the refreshUI method', () => {
    test('should call all necessary update methods in refreshUI', () => {
      // Setup game state
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'preflop',
        handNumber: 1
      });
      
      const gameState = {
        gameInfo: { isActive: true, phase: 'preflop', currentPlayer: 'player1' },
        betting: { currentPlayer: 'player1' },
        players: [{ id: 'player1', name: 'Alice', chips: 980, bet: 20 }],
        table: { communityCards: [] },
        pots: { total: 30 }
      };
      
      mockGameController.getGameState.mockReturnValue(gameState);
      mockGameController.getPlayerActions.mockReturnValue({
        success: true,
        availableActions: ['fold', 'call', 'raise']
      });

      // Spy on the update methods to see if they're called
      const updateGameInfoSpy = jest.spyOn(uiManager, 'updateGameInfo');
      const updateGameControlsSpy = jest.spyOn(uiManager, 'updateGameControls');
      const updatePlayerActionsSpy = jest.spyOn(uiManager, 'updatePlayerActions');
      const updateCurrentPlayerInfoSpy = jest.spyOn(uiManager, 'updateCurrentPlayerInfo');
      const updateActionButtonsSpy = jest.spyOn(uiManager, 'updateActionButtons');

      // Call refreshUI
      uiManager.refreshUI();

      // Verify all update methods are called
      expect(updateGameInfoSpy).toHaveBeenCalled();
      expect(updateGameControlsSpy).toHaveBeenCalled();
      expect(updatePlayerActionsSpy).toHaveBeenCalledWith(gameState);
      expect(updateCurrentPlayerInfoSpy).toHaveBeenCalled();
      expect(updateActionButtonsSpy).toHaveBeenCalled();
    });
  });
});