/**
 * Integration tests for comprehensive game state updates
 * Tests complete game flow from start to finish with real-time UI updates
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

describe('Game State Updates Integration Tests', () => {
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

  describe('Complete Game Flow Integration', () => {
    test('should handle complete poker game from start to finish', () => {
      // Phase 1: Add players
      mockGameController.addPlayer.mockReturnValue({ success: true });
      mockGameController.canStartGame.mockReturnValue({ canStart: true });
      
      // Add first player
      document.getElementById('player-id').value = 'player1';
      document.getElementById('player-name').value = 'Alice';
      document.getElementById('add-player-btn').click();
      
      expect(mockGameController.addPlayer).toHaveBeenCalledWith({
        id: 'player1',
        name: 'Alice',
        chips: 1000
      });
      
      // Add second player
      document.getElementById('player-id').value = 'player2';
      document.getElementById('player-name').value = 'Bob';
      document.getElementById('add-player-btn').click();
      
      expect(mockGameController.addPlayer).toHaveBeenCalledWith({
        id: 'player2',
        name: 'Bob',
        chips: 1000
      });
      
      // Phase 2: Start game
      mockGameController.startGame.mockReturnValue({ success: true });
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'preflop',
        handNumber: 1
      });
      mockGameController.getGameState.mockReturnValue({
        players: [
          { id: 'player1', name: 'Alice', chips: 980, bet: 20, cards: [{ rank: 'A', suit: 'hearts' }, { rank: 'K', suit: 'spades' }], folded: false },
          { id: 'player2', name: 'Bob', chips: 990, bet: 10, cards: [{ rank: 'Q', suit: 'diamonds' }, { rank: 'J', suit: 'clubs' }], folded: false }
        ],
        table: { communityCards: [] },
        betting: { currentPlayer: 'player1', callAmount: 10, minRaise: 20 },
        pots: { total: 30 }
      });
      
      document.getElementById('start-game-btn').click();
      
      expect(mockGameController.startGame).toHaveBeenCalled();
      
      // Verify UI updates after game start
      const gamePhase = document.getElementById('game-phase');
      const handNumber = document.getElementById('hand-number');
      const currentPlayer = document.getElementById('current-player');
      const totalPot = document.getElementById('total-pot');
      
      expect(gamePhase.textContent).toBe('Pre-Flop');
      expect(handNumber.textContent).toBe('1');
      expect(currentPlayer.textContent).toBe('Alice');
      expect(totalPot.textContent).toBe('$30');
      
      // Phase 3: Player actions
      mockGameController.getPlayerActions.mockReturnValue({
        success: true,
        availableActions: ['fold', 'call', 'raise'],
        actionDetails: {
          callAmount: 10,
          minRaise: 20,
          maxRaise: 980
        }
      });
      
      // Player 1 calls - first set up the action response
      mockGameController.playerAction.mockReturnValue({ success: true });
      
      // Call the action directly since we need the current game state to be available
      uiManager.handlePlayerAction('call');
      
      // Then update the game state for after the action
      mockGameController.getGameState.mockReturnValue({
        players: [
          { id: 'player1', name: 'Alice', chips: 970, bet: 30, cards: [{ rank: 'A', suit: 'hearts' }, { rank: 'K', suit: 'spades' }], folded: false },
          { id: 'player2', name: 'Bob', chips: 990, bet: 10, cards: [{ rank: 'Q', suit: 'diamonds' }, { rank: 'J', suit: 'clubs' }], folded: false }
        ],
        table: { communityCards: [] },
        betting: { currentPlayer: 'player2', callAmount: 20, minRaise: 40 },
        pots: { total: 40 }
      });
      
      // Refresh UI to reflect the updated game state
      uiManager.refreshUI();
      
      expect(mockGameController.playerAction).toHaveBeenCalledWith({
        playerId: 'player1',
        action: 'call'
      });
      
      // Verify UI updates after player action
      expect(currentPlayer.textContent).toBe('Bob');
      expect(totalPot.textContent).toBe('$40');
      
      // Phase 4: Flop
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'flop',
        handNumber: 1
      });
      mockGameController.getGameState.mockReturnValue({
        players: [
          { id: 'player1', name: 'Alice', chips: 970, bet: 0, cards: [{ rank: 'A', suit: 'hearts' }, { rank: 'K', suit: 'spades' }], folded: false },
          { id: 'player2', name: 'Bob', chips: 970, bet: 0, cards: [{ rank: 'Q', suit: 'diamonds' }, { rank: 'J', suit: 'clubs' }], folded: false }
        ],
        table: { 
          communityCards: [
            { rank: 'A', suit: 'diamonds' },
            { rank: 'K', suit: 'clubs' },
            { rank: '2', suit: 'hearts' }
          ]
        },
        betting: { currentPlayer: 'player1' },
        pots: { total: 60 }
      });
      
      uiManager.refreshUI();
      
      // Verify flop display
      expect(gamePhase.textContent).toBe('Flop');
      const communityCards = document.getElementById('community-cards-container');
      const cardElements = communityCards.querySelectorAll('.card');
      expect(cardElements.length).toBe(3);
      
      // Phase 5: Hand completion
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'complete',
        handNumber: 1
      });
      mockGameController.getGameState.mockReturnValue({
        players: [
          { id: 'player1', name: 'Alice', chips: 1060, bet: 0, cards: [{ rank: 'A', suit: 'hearts' }, { rank: 'K', suit: 'spades' }], folded: false },
          { id: 'player2', name: 'Bob', chips: 940, bet: 0, cards: [{ rank: 'Q', suit: 'diamonds' }, { rank: 'J', suit: 'clubs' }], folded: false }
        ],
        table: { 
          communityCards: [
            { rank: 'A', suit: 'diamonds' },
            { rank: 'K', suit: 'clubs' },
            { rank: '2', suit: 'hearts' },
            { rank: '3', suit: 'spades' },
            { rank: '4', suit: 'diamonds' }
          ]
        },
        betting: {},
        pots: { total: 0 },
        handResults: {
          winners: [
            { playerId: 'player1', handType: 'Two Pair', amount: 120 }
          ],
          potDistribution: {
            totalPot: 120,
            mainPot: 120
          },
          playerHands: [
            { playerId: 'player1', handType: 'Two Pair', cards: [{ rank: 'A', suit: 'hearts' }, { rank: 'K', suit: 'spades' }] },
            { playerId: 'player2', handType: 'High Card', cards: [{ rank: 'Q', suit: 'diamonds' }, { rank: 'J', suit: 'clubs' }] }
          ]
        }
      });
      
      uiManager.refreshUI();
      
      // Verify hand completion display
      expect(gamePhase.textContent).toBe('Hand Complete');
      
      // Verify hand results display
      const handResultsSection = document.getElementById('hand-results');
      expect(handResultsSection.style.display).toBe('block');
      
      const resultsContent = document.getElementById('results-content');
      expect(resultsContent.innerHTML).toContain('Hand Winners');
      expect(resultsContent.innerHTML).toContain('Alice');
      expect(resultsContent.innerHTML).toContain('Two Pair');
      expect(resultsContent.innerHTML).toContain('Won: $120');
      
      // Verify player chip updates
      const playersGrid = document.getElementById('players-grid');
      expect(playersGrid.innerHTML).toContain('$1060');
      expect(playersGrid.innerHTML).toContain('$940');
      
      // Phase 6: New hand
      mockGameController.startNewHand.mockReturnValue({ success: true });
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'preflop',
        handNumber: 2
      });
      mockGameController.getGameState.mockReturnValue({
        players: [
          { id: 'player1', name: 'Alice', chips: 1040, bet: 20, cards: [{ rank: '10', suit: 'hearts' }, { rank: '9', suit: 'spades' }], folded: false },
          { id: 'player2', name: 'Bob', chips: 930, bet: 10, cards: [{ rank: '8', suit: 'diamonds' }, { rank: '7', suit: 'clubs' }], folded: false }
        ],
        table: { communityCards: [] },
        betting: { currentPlayer: 'player2', callAmount: 10, minRaise: 20 },
        pots: { total: 30 }
      });
      
      document.getElementById('new-hand-btn').click();
      
      expect(mockGameController.startNewHand).toHaveBeenCalled();
      
      // Verify new hand UI updates
      expect(handNumber.textContent).toBe('2');
      expect(gamePhase.textContent).toBe('Pre-Flop');
      expect(currentPlayer.textContent).toBe('Bob');
      expect(totalPot.textContent).toBe('$30');
      
      // Verify hand results are hidden
      expect(handResultsSection.style.display).toBe('none');
      
      // Verify community cards are cleared
      const newCommunityCards = document.getElementById('community-cards-container');
      expect(newCommunityCards.innerHTML).toContain('No community cards dealt yet');
    });

    test('should handle player folding and update display correctly', () => {
      // Set up game in progress
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'preflop',
        handNumber: 1
      });
      mockGameController.getGameState.mockReturnValue({
        players: [
          { id: 'player1', name: 'Alice', chips: 980, bet: 20, cards: [{ rank: 'A', suit: 'hearts' }, { rank: 'K', suit: 'spades' }], folded: false },
          { id: 'player2', name: 'Bob', chips: 990, bet: 10, cards: [{ rank: '2', suit: 'diamonds' }, { rank: '3', suit: 'clubs' }], folded: false }
        ],
        table: { communityCards: [] },
        betting: { currentPlayer: 'player2' },
        pots: { total: 30 }
      });
      mockGameController.getPlayerActions.mockReturnValue({
        success: true,
        availableActions: ['fold', 'call', 'raise']
      });
      
      uiManager.refreshUI();
      
      // Player 2 folds
      mockGameController.playerAction.mockReturnValue({ success: true });
      
      // Call the action directly
      uiManager.handlePlayerAction('fold');
      
      // Update game state after the fold
      mockGameController.getGameState.mockReturnValue({
        players: [
          { id: 'player1', name: 'Alice', chips: 980, bet: 20, cards: [{ rank: 'A', suit: 'hearts' }, { rank: 'K', suit: 'spades' }], folded: false },
          { id: 'player2', name: 'Bob', chips: 990, bet: 10, cards: [], folded: true }
        ],
        table: { communityCards: [] },
        betting: {},
        pots: { total: 30 }
      });
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'complete',
        handNumber: 1
      });
      
      // Refresh UI to reflect the updated game state
      uiManager.refreshUI();
      
      expect(mockGameController.playerAction).toHaveBeenCalledWith({
        playerId: 'player2',
        action: 'fold'
      });
      
      // Verify folded player display
      const playersGrid = document.getElementById('players-grid');
      const playerElements = playersGrid.querySelectorAll('.player-state');
      
      // Find Bob's element
      const bobElement = Array.from(playerElements).find(el => 
        el.querySelector('.player-name').textContent === 'Bob'
      );
      
      expect(bobElement.classList.contains('folded')).toBe(true);
      expect(bobElement.querySelector('.player-stats').textContent).toContain('Status: Folded');
    });

    test('should handle raise actions with amount input', () => {
      // Set up game state
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'preflop',
        handNumber: 1
      });
      mockGameController.getGameState.mockReturnValue({
        players: [
          { id: 'player1', name: 'Alice', chips: 980, bet: 20, cards: [{ rank: 'A', suit: 'hearts' }, { rank: 'K', suit: 'spades' }], folded: false }
        ],
        table: { communityCards: [] },
        betting: { currentPlayer: 'player1', callAmount: 10, minRaise: 20 },
        pots: { total: 30 }
      });
      mockGameController.getPlayerActions.mockReturnValue({
        success: true,
        availableActions: ['fold', 'call', 'raise'],
        actionDetails: {
          minRaise: 20,
          maxRaise: 980
        }
      });
      
      uiManager.refreshUI();
      
      // Click raise button to show controls
      document.getElementById('raise-btn').click();
      
      const raiseControls = document.getElementById('raise-controls');
      const raiseAmount = document.getElementById('raise-amount');
      
      expect(raiseControls.style.display).toBe('block');
      expect(raiseAmount.min).toBe('20');
      expect(raiseAmount.max).toBe('980');
      expect(raiseAmount.value).toBe('20');
      
      // Set raise amount and confirm
      raiseAmount.value = '50';
      mockGameController.playerAction.mockReturnValue({ success: true });
      
      // Call the confirm raise directly
      uiManager.handleConfirmRaise();
      
      // Update game state after the raise
      mockGameController.getGameState.mockReturnValue({
        players: [
          { id: 'player1', name: 'Alice', chips: 930, bet: 70, cards: [{ rank: 'A', suit: 'hearts' }, { rank: 'K', suit: 'spades' }], folded: false }
        ],
        table: { communityCards: [] },
        betting: {},
        pots: { total: 80 }
      });
      
      // Refresh UI to reflect the updated game state
      uiManager.refreshUI();
      
      expect(mockGameController.playerAction).toHaveBeenCalledWith({
        playerId: 'player1',
        action: 'raise',
        amount: 50
      });
      
      // Verify raise controls are hidden and UI is updated
      expect(raiseControls.style.display).toBe('none');
      
      const totalPot = document.getElementById('total-pot');
      expect(totalPot.textContent).toBe('$80');
    });

    test('should handle side pots display correctly', () => {
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'river',
        handNumber: 1
      });
      mockGameController.getGameState.mockReturnValue({
        players: [
          { id: 'player1', name: 'Alice', chips: 0, bet: 100, cards: [{ rank: 'A', suit: 'hearts' }, { rank: 'K', suit: 'spades' }], folded: false },
          { id: 'player2', name: 'Bob', chips: 50, bet: 200, cards: [{ rank: 'Q', suit: 'diamonds' }, { rank: 'J', suit: 'clubs' }], folded: false },
          { id: 'player3', name: 'Charlie', chips: 100, bet: 200, cards: [{ rank: '10', suit: 'hearts' }, { rank: '9', suit: 'spades' }], folded: false }
        ],
        table: { 
          communityCards: [
            { rank: 'A', suit: 'diamonds' },
            { rank: 'K', suit: 'clubs' },
            { rank: 'Q', suit: 'hearts' },
            { rank: 'J', suit: 'spades' },
            { rank: '10', suit: 'diamonds' }
          ]
        },
        betting: {},
        pots: { 
          total: 500,
          sidePots: [
            { amount: 300 },
            { amount: 200 }
          ]
        }
      });
      
      uiManager.refreshUI();
      
      const totalPot = document.getElementById('total-pot');
      const sidePots = document.getElementById('side-pots');
      
      expect(totalPot.textContent).toBe('$500');
      expect(sidePots.textContent).toBe('Side Pot 1: $300, Side Pot 2: $200');
    });

    test('should update player chip counts in real-time', () => {
      // Initial state
      uiManager.currentPlayers = [
        { id: 'player1', name: 'Alice', chips: 1000 },
        { id: 'player2', name: 'Bob', chips: 1000 }
      ];
      
      // Game state with updated chip counts
      const gameState = {
        players: [
          { id: 'player1', name: 'Alice', chips: 850 },
          { id: 'player2', name: 'Bob', chips: 1150 }
        ],
        table: { communityCards: [] },
        betting: {},
        pots: { total: 0 }
      };
      
      uiManager.updatePlayerListFromGameState(gameState);
      
      // Verify local player data is updated
      expect(uiManager.currentPlayers[0].chips).toBe(850);
      expect(uiManager.currentPlayers[1].chips).toBe(1150);
      
      // Verify UI display is updated
      const playersContainer = document.getElementById('players-container');
      expect(playersContainer.innerHTML).toContain('Chips: $850');
      expect(playersContainer.innerHTML).toContain('Chips: $1150');
    });
  });

  describe('Error Handling in Game Flow', () => {
    test('should handle poker engine errors during game flow', () => {
      // Set up game state with current player
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'preflop',
        handNumber: 1
      });
      mockGameController.getGameState.mockReturnValue({
        players: [
          { id: 'player1', name: 'Alice', chips: 10, bet: 0, cards: [{ rank: 'A', suit: 'hearts' }, { rank: 'K', suit: 'spades' }], folded: false }
        ],
        table: { communityCards: [] },
        betting: { currentPlayer: 'player1', callAmount: 50 },
        pots: { total: 50 }
      });
      
      // Simulate error during player action
      mockGameController.playerAction.mockReturnValue({
        success: false,
        error: {
          type: 'InvalidActionError',
          message: 'Cannot call - insufficient chips'
        }
      });
      
      uiManager.handlePlayerAction('call');
      
      // Verify error is displayed
      const errorDisplay = document.getElementById('error-display');
      const errorMessage = document.getElementById('error-message');
      
      expect(errorDisplay.style.display).toBe('block');
      expect(errorMessage.textContent).toBe('Cannot call - insufficient chips');
    });

    test('should clear errors when successful actions are taken', () => {
      // Set up error state
      uiManager.showError('Test error');
      
      const errorDisplay = document.getElementById('error-display');
      expect(errorDisplay.style.display).toBe('block');
      
      // Set up game state with current player
      mockGameController.getGameState.mockReturnValue({
        players: [
          { id: 'player1', name: 'Alice', chips: 1000, bet: 0, cards: [{ rank: 'A', suit: 'hearts' }, { rank: 'K', suit: 'spades' }], folded: false }
        ],
        table: { communityCards: [] },
        betting: { currentPlayer: 'player1' },
        pots: { total: 0 }
      });
      
      // Successful action should clear error
      mockGameController.playerAction.mockReturnValue({ success: true });
      
      uiManager.handlePlayerAction('fold');
      
      expect(errorDisplay.style.display).toBe('none');
    });
  });

  describe('UI Refresh Mechanism', () => {
    test('should call refreshUI after all poker engine interactions', () => {
      const refreshUISpy = jest.spyOn(uiManager, 'refreshUI');
      
      // Test start game
      mockGameController.startGame.mockReturnValue({ success: true });
      uiManager.handleStartGame();
      expect(refreshUISpy).toHaveBeenCalled();
      
      refreshUISpy.mockClear();
      
      // Test new hand
      mockGameController.startNewHand.mockReturnValue({ success: true });
      uiManager.handleNewHand();
      expect(refreshUISpy).toHaveBeenCalled();
      
      refreshUISpy.mockClear();
      
      // Test player action - set up game state with current player
      mockGameController.getGameState.mockReturnValue({
        players: [
          { id: 'player1', name: 'Alice', chips: 1000, bet: 0, cards: [{ rank: 'A', suit: 'hearts' }, { rank: 'K', suit: 'spades' }], folded: false }
        ],
        table: { communityCards: [] },
        betting: { currentPlayer: 'player1' },
        pots: { total: 0 }
      });
      mockGameController.playerAction.mockReturnValue({ success: true });
      uiManager.handlePlayerAction('fold');
      expect(refreshUISpy).toHaveBeenCalled();
      
      refreshUISpy.mockClear();
      
      // Test raise action - set up game state with current player
      mockGameController.getGameState.mockReturnValue({
        players: [
          { id: 'player1', name: 'Alice', chips: 1000, bet: 0, cards: [{ rank: 'A', suit: 'hearts' }, { rank: 'K', suit: 'spades' }], folded: false }
        ],
        table: { communityCards: [] },
        betting: { currentPlayer: 'player1' },
        pots: { total: 0 }
      });
      mockGameController.playerAction.mockReturnValue({ success: true });
      // Set up raise amount input
      document.getElementById('raise-amount').value = '50';
      uiManager.handleConfirmRaise();
      expect(refreshUISpy).toHaveBeenCalled();
      
      refreshUISpy.mockRestore();
    });

    test('should update all UI components when refreshUI is called', () => {
      const updateGameStateDisplaySpy = jest.spyOn(uiManager, 'updateGameStateDisplay');
      
      uiManager.refreshUI();
      
      expect(updateGameStateDisplaySpy).toHaveBeenCalled();
      
      updateGameStateDisplaySpy.mockRestore();
    });
  });
});