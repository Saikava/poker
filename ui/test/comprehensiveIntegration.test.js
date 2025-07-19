/**
 * Comprehensive Integration Tests for Poker UI
 * Tests complete poker games from start to finish with multiple scenarios
 * Requirements: 4.6, 6.5
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

describe('Comprehensive Integration Tests', () => {
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

  describe('End-to-End Complete Poker Games', () => {
    test('should simulate complete two-player poker game with winner', async () => {
      // Phase 1: Add two players
      mockGameController.addPlayer.mockReturnValue({ success: true });
      mockGameController.canStartGame.mockReturnValue({ canStart: true });

      // Add Player 1
      document.getElementById('player-id').value = 'alice';
      document.getElementById('player-name').value = 'Alice';
      document.getElementById('add-player-btn').click();

      // Add Player 2
      document.getElementById('player-id').value = 'bob';
      document.getElementById('player-name').value = 'Bob';
      document.getElementById('add-player-btn').click();

      expect(mockGameController.addPlayer).toHaveBeenCalledTimes(2);

      // Phase 2: Start game
      mockGameController.startGame.mockReturnValue({ success: true });
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'preflop',
        handNumber: 1
      });
      mockGameController.getGameState.mockReturnValue({
        players: [
          { id: 'alice', name: 'Alice', chips: 980, bet: 20, cards: [{ rank: 'A', suit: 'hearts' }, { rank: 'K', suit: 'spades' }], folded: false },
          { id: 'bob', name: 'Bob', chips: 990, bet: 10, cards: [{ rank: '2', suit: 'diamonds' }, { rank: '3', suit: 'clubs' }], folded: false }
        ],
        table: { communityCards: [] },
        betting: { currentPlayer: 'bob', callAmount: 10, minRaise: 20 },
        pots: { total: 30 }
      });

      document.getElementById('start-game-btn').click();

      expect(mockGameController.startGame).toHaveBeenCalled();

      // Verify preflop UI state
      expect(document.getElementById('game-phase').textContent).toBe('Pre-Flop');
      expect(document.getElementById('hand-number').textContent).toBe('1');
      expect(document.getElementById('current-player').textContent).toBe('Bob');
      expect(document.getElementById('total-pot').textContent).toBe('$30');

      // Phase 3: Preflop betting - Bob calls
      mockGameController.getPlayerActions.mockReturnValue({
        success: true,
        actions: ['fold', 'call', 'raise'],
        callAmount: 10
      });
      mockGameController.playerAction.mockReturnValue({ success: true });

      uiManager.handlePlayerAction('call');

      // Update state after Bob calls
      mockGameController.getGameState.mockReturnValue({
        players: [
          { id: 'alice', name: 'Alice', chips: 980, bet: 20, cards: [{ rank: 'A', suit: 'hearts' }, { rank: 'K', suit: 'spades' }], folded: false },
          { id: 'bob', name: 'Bob', chips: 980, bet: 20, cards: [{ rank: '2', suit: 'diamonds' }, { rank: '3', suit: 'clubs' }], folded: false }
        ],
        table: { communityCards: [] },
        betting: {},
        pots: { total: 40 }
      });

      uiManager.refreshUI();

      expect(mockGameController.playerAction).toHaveBeenCalledWith({
        playerId: 'bob',
        action: 'call'
      });

      // Phase 4: Flop
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'flop',
        handNumber: 1
      });
      mockGameController.getGameState.mockReturnValue({
        players: [
          { id: 'alice', name: 'Alice', chips: 980, bet: 0, cards: [{ rank: 'A', suit: 'hearts' }, { rank: 'K', suit: 'spades' }], folded: false },
          { id: 'bob', name: 'Bob', chips: 980, bet: 0, cards: [{ rank: '2', suit: 'diamonds' }, { rank: '3', suit: 'clubs' }], folded: false }
        ],
        table: {
          communityCards: [
            { rank: 'A', suit: 'diamonds' },
            { rank: 'K', suit: 'clubs' },
            { rank: '5', suit: 'hearts' }
          ]
        },
        betting: { currentPlayer: 'alice' },
        pots: { total: 40 }
      });

      uiManager.refreshUI();

      // Verify flop display
      expect(document.getElementById('game-phase').textContent).toBe('Flop');
      const communityCards = document.getElementById('community-cards-container');
      const cardElements = communityCards.querySelectorAll('.card');
      expect(cardElements.length).toBe(3);

      // Phase 5: Flop betting - Alice bets
      mockGameController.getPlayerActions.mockReturnValue({
        success: true,
        actions: ['check', 'raise'],
        minRaise: 20,
        maxRaise: 980
      });

      // Alice raises
      uiManager.handleRaiseClick();
      document.getElementById('raise-amount').value = '50';
      uiManager.handleConfirmRaise();

      // Update state after Alice raises
      mockGameController.getGameState.mockReturnValue({
        players: [
          { id: 'alice', name: 'Alice', chips: 930, bet: 50, cards: [{ rank: 'A', suit: 'hearts' }, { rank: 'K', suit: 'spades' }], folded: false },
          { id: 'bob', name: 'Bob', chips: 980, bet: 0, cards: [{ rank: '2', suit: 'diamonds' }, { rank: '3', suit: 'clubs' }], folded: false }
        ],
        table: {
          communityCards: [
            { rank: 'A', suit: 'diamonds' },
            { rank: 'K', suit: 'clubs' },
            { rank: '5', suit: 'hearts' }
          ]
        },
        betting: { currentPlayer: 'bob', callAmount: 50 },
        pots: { total: 90 }
      });

      uiManager.refreshUI();

      expect(mockGameController.playerAction).toHaveBeenCalledWith({
        playerId: 'alice',
        action: 'raise',
        amount: 50
      });

      // Phase 6: Bob folds
      mockGameController.getPlayerActions.mockReturnValue({
        success: true,
        actions: ['fold', 'call', 'raise']
      });

      uiManager.handlePlayerAction('fold');

      // Phase 7: Hand completion - Alice wins
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'complete',
        handNumber: 1
      });
      mockGameController.getGameState.mockReturnValue({
        players: [
          { id: 'alice', name: 'Alice', chips: 1040, bet: 0, cards: [{ rank: 'A', suit: 'hearts' }, { rank: 'K', suit: 'spades' }], folded: false },
          { id: 'bob', name: 'Bob', chips: 960, bet: 0, cards: [], folded: true }
        ],
        table: {
          communityCards: [
            { rank: 'A', suit: 'diamonds' },
            { rank: 'K', suit: 'clubs' },
            { rank: '5', suit: 'hearts' }
          ]
        },
        betting: {},
        pots: { total: 0 },
        handResults: {
          winners: [
            { playerId: 'alice', handType: 'Fold Win', amount: 90 }
          ],
          potDistribution: {
            totalPot: 90,
            mainPot: 90
          }
        }
      });

      uiManager.refreshUI();

      // Verify hand completion
      expect(document.getElementById('game-phase').textContent).toBe('Hand Complete');

      // Verify hand results display
      const handResultsSection = document.getElementById('hand-results');
      expect(handResultsSection.style.display).toBe('block');

      const resultsContent = document.getElementById('results-content');
      expect(resultsContent.innerHTML).toContain('Hand Winners');
      expect(resultsContent.innerHTML).toContain('Alice');
      expect(resultsContent.innerHTML).toContain('Won: $90');

      // Verify chip updates
      const playersGrid = document.getElementById('players-grid');
      expect(playersGrid.innerHTML).toContain('1040');
      expect(playersGrid.innerHTML).toContain('960');

      // Phase 8: Start new hand
      mockGameController.startNewHand.mockReturnValue({ success: true });
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'preflop',
        handNumber: 2
      });

      document.getElementById('new-hand-btn').click();

      expect(mockGameController.startNewHand).toHaveBeenCalled();
      expect(document.getElementById('hand-number').textContent).toBe('2');
    });

    test('should simulate three-player game with all-in situation', async () => {
      // Add three players
      mockGameController.addPlayer.mockReturnValue({ success: true });
      mockGameController.canStartGame.mockReturnValue({ canStart: true });

      ['alice', 'bob', 'charlie'].forEach((id, index) => {
        document.getElementById('player-id').value = id;
        document.getElementById('player-name').value = id.charAt(0).toUpperCase() + id.slice(1);
        document.getElementById('add-player-btn').click();
      });

      // Start game
      mockGameController.startGame.mockReturnValue({ success: true });
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'preflop',
        handNumber: 1
      });

      // Set up all-in scenario - Alice has very few chips
      mockGameController.getGameState.mockReturnValue({
        players: [
          { id: 'alice', name: 'Alice', chips: 50, bet: 0, cards: [{ rank: 'A', suit: 'hearts' }, { rank: 'A', suit: 'spades' }], folded: false },
          { id: 'bob', name: 'Bob', chips: 1000, bet: 0, cards: [{ rank: 'K', suit: 'diamonds' }, { rank: 'K', suit: 'clubs' }], folded: false },
          { id: 'charlie', name: 'Charlie', chips: 1000, bet: 0, cards: [{ rank: 'Q', suit: 'hearts' }, { rank: 'Q', suit: 'spades' }], folded: false }
        ],
        table: { communityCards: [] },
        betting: { currentPlayer: 'alice' },
        pots: { total: 0 }
      });

      document.getElementById('start-game-btn').click();
      uiManager.refreshUI();

      // Alice goes all-in
      mockGameController.getPlayerActions.mockReturnValue({
        success: true,
        actions: ['fold', 'raise'],
        minRaise: 20,
        maxRaise: 50
      });
      mockGameController.playerAction.mockReturnValue({ success: true });

      uiManager.handleRaiseClick();
      document.getElementById('raise-amount').value = '50';
      uiManager.handleConfirmRaise();

      // Update state after Alice all-in
      mockGameController.getGameState.mockReturnValue({
        players: [
          { id: 'alice', name: 'Alice', chips: 0, bet: 50, cards: [{ rank: 'A', suit: 'hearts' }, { rank: 'A', suit: 'spades' }], folded: false },
          { id: 'bob', name: 'Bob', chips: 1000, bet: 0, cards: [{ rank: 'K', suit: 'diamonds' }, { rank: 'K', suit: 'clubs' }], folded: false },
          { id: 'charlie', name: 'Charlie', chips: 1000, bet: 0, cards: [{ rank: 'Q', suit: 'hearts' }, { rank: 'Q', suit: 'spades' }], folded: false }
        ],
        table: { communityCards: [] },
        betting: { currentPlayer: 'bob', callAmount: 50 },
        pots: { total: 50 }
      });

      uiManager.refreshUI();

      expect(mockGameController.playerAction).toHaveBeenCalledWith({
        playerId: 'alice',
        action: 'raise',
        amount: 50
      });

      // Bob calls
      uiManager.handlePlayerAction('call');

      // Charlie raises
      mockGameController.getGameState.mockReturnValue({
        players: [
          { id: 'alice', name: 'Alice', chips: 0, bet: 50, cards: [{ rank: 'A', suit: 'hearts' }, { rank: 'A', suit: 'spades' }], folded: false },
          { id: 'bob', name: 'Bob', chips: 950, bet: 50, cards: [{ rank: 'K', suit: 'diamonds' }, { rank: 'K', suit: 'clubs' }], folded: false },
          { id: 'charlie', name: 'Charlie', chips: 1000, bet: 0, cards: [{ rank: 'Q', suit: 'hearts' }, { rank: 'Q', suit: 'spades' }], folded: false }
        ],
        table: { communityCards: [] },
        betting: { currentPlayer: 'charlie', callAmount: 50 },
        pots: { total: 100 }
      });

      uiManager.refreshUI();

      mockGameController.getPlayerActions.mockReturnValue({
        success: true,
        actions: ['fold', 'call', 'raise'],
        minRaise: 100,
        maxRaise: 1000
      });

      uiManager.handleRaiseClick();
      document.getElementById('raise-amount').value = '100';
      uiManager.handleConfirmRaise();

      // Simulate side pot creation
      mockGameController.getGameState.mockReturnValue({
        players: [
          { id: 'alice', name: 'Alice', chips: 0, bet: 50, cards: [{ rank: 'A', suit: 'hearts' }, { rank: 'A', suit: 'spades' }], folded: false },
          { id: 'bob', name: 'Bob', chips: 850, bet: 150, cards: [{ rank: 'K', suit: 'diamonds' }, { rank: 'K', suit: 'clubs' }], folded: false },
          { id: 'charlie', name: 'Charlie', chips: 900, bet: 100, cards: [{ rank: 'Q', suit: 'hearts' }, { rank: 'Q', suit: 'spades' }], folded: false }
        ],
        table: {
          communityCards: [
            { rank: '2', suit: 'hearts' },
            { rank: '3', suit: 'diamonds' },
            { rank: '4', suit: 'clubs' },
            { rank: '5', suit: 'spades' },
            { rank: '6', suit: 'hearts' }
          ]
        },
        betting: {},
        pots: {
          total: 300,
          sidePots: [
            { amount: 150 }, // Main pot (Alice eligible)
            { amount: 150 }  // Side pot (Bob and Charlie only)
          ]
        }
      });

      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'complete',
        handNumber: 1
      });

      uiManager.refreshUI();

      // Verify side pots display
      const sidePots = document.getElementById('side-pots');
      expect(sidePots.textContent).toContain('Side Pot 1: $150');
      expect(sidePots.textContent).toContain('Side Pot 2: $150');

      // Verify total pot
      expect(document.getElementById('total-pot').textContent).toBe('$300');
    });
  });

  describe('Multiple Player Action Sequences', () => {
    test('should handle complex betting round with multiple raises', async () => {
      // Set up 4-player game
      mockGameController.addPlayer.mockReturnValue({ success: true });
      mockGameController.canStartGame.mockReturnValue({ canStart: true });

      ['alice', 'bob', 'charlie', 'diana'].forEach((id) => {
        document.getElementById('player-id').value = id;
        document.getElementById('player-name').value = id.charAt(0).toUpperCase() + id.slice(1);
        document.getElementById('add-player-btn').click();
      });

      mockGameController.startGame.mockReturnValue({ success: true });
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'preflop',
        handNumber: 1
      });

      // Initial state
      let gameState = {
        players: [
          { id: 'alice', name: 'Alice', chips: 1000, bet: 0, cards: [{ rank: 'A', suit: 'hearts' }, { rank: 'K', suit: 'spades' }], folded: false },
          { id: 'bob', name: 'Bob', chips: 1000, bet: 0, cards: [{ rank: 'Q', suit: 'diamonds' }, { rank: 'J', suit: 'clubs' }], folded: false },
          { id: 'charlie', name: 'Charlie', chips: 1000, bet: 0, cards: [{ rank: '10', suit: 'hearts' }, { rank: '9', suit: 'spades' }], folded: false },
          { id: 'diana', name: 'Diana', chips: 1000, bet: 0, cards: [{ rank: '8', suit: 'diamonds' }, { rank: '7', suit: 'clubs' }], folded: false }
        ],
        table: { communityCards: [] },
        betting: { currentPlayer: 'alice' },
        pots: { total: 0 }
      };

      mockGameController.getGameState.mockReturnValue(gameState);
      document.getElementById('start-game-btn').click();
      uiManager.refreshUI();

      // Round 1: Alice raises to 50
      mockGameController.getPlayerActions.mockReturnValue({
        success: true,
        actions: ['fold', 'check', 'raise'],
        minRaise: 20,
        maxRaise: 1000
      });
      mockGameController.playerAction.mockReturnValue({ success: true });

      uiManager.handleRaiseClick();
      document.getElementById('raise-amount').value = '50';
      uiManager.handleConfirmRaise();

      // Update state after Alice raises
      gameState.players[0].chips = 950;
      gameState.players[0].bet = 50;
      gameState.betting.currentPlayer = 'bob';
      gameState.betting.callAmount = 50;
      gameState.pots.total = 50;
      mockGameController.getGameState.mockReturnValue(gameState);
      uiManager.refreshUI();

      expect(mockGameController.playerAction).toHaveBeenCalledWith({
        playerId: 'alice',
        action: 'raise',
        amount: 50
      });

      // Round 2: Bob re-raises to 150
      mockGameController.getPlayerActions.mockReturnValue({
        success: true,
        actions: ['fold', 'call', 'raise'],
        callAmount: 50,
        minRaise: 100,
        maxRaise: 1000
      });

      uiManager.handleRaiseClick();
      document.getElementById('raise-amount').value = '150';
      uiManager.handleConfirmRaise();

      // Update state after Bob raises
      gameState.players[1].chips = 850;
      gameState.players[1].bet = 150;
      gameState.betting.currentPlayer = 'charlie';
      gameState.betting.callAmount = 150;
      gameState.pots.total = 200;
      mockGameController.getGameState.mockReturnValue(gameState);
      uiManager.refreshUI();

      expect(mockGameController.playerAction).toHaveBeenCalledWith({
        playerId: 'bob',
        action: 'raise',
        amount: 150
      });

      // Round 3: Charlie folds
      mockGameController.getPlayerActions.mockReturnValue({
        success: true,
        actions: ['fold', 'call', 'raise']
      });

      uiManager.handlePlayerAction('fold');

      // Update state after Charlie folds
      gameState.players[2].folded = true;
      gameState.players[2].cards = [];
      gameState.betting.currentPlayer = 'diana';
      mockGameController.getGameState.mockReturnValue(gameState);
      uiManager.refreshUI();

      expect(mockGameController.playerAction).toHaveBeenCalledWith({
        playerId: 'charlie',
        action: 'fold'
      });

      // Verify Charlie is marked as folded in UI
      const playersGrid = document.getElementById('players-grid');
      const charlieElement = Array.from(playersGrid.querySelectorAll('.player-state')).find(el =>
        el.querySelector('.player-name').textContent === 'Charlie'
      );
      expect(charlieElement.classList.contains('folded')).toBe(true);

      // Round 4: Diana calls
      uiManager.handlePlayerAction('call');

      // Update state after Diana calls
      gameState.players[3].chips = 850;
      gameState.players[3].bet = 150;
      gameState.betting.currentPlayer = 'alice';
      gameState.betting.callAmount = 100; // Alice needs to call 100 more
      gameState.pots.total = 350;
      mockGameController.getGameState.mockReturnValue(gameState);
      uiManager.refreshUI();

      // Round 5: Alice calls to complete the betting round
      uiManager.handlePlayerAction('call');

      // Final state for preflop
      gameState.players[0].chips = 850;
      gameState.players[0].bet = 150;
      gameState.betting = {};
      gameState.pots.total = 450;
      mockGameController.getGameState.mockReturnValue(gameState);
      uiManager.refreshUI();

      expect(document.getElementById('total-pot').textContent).toBe('$450');

      // Verify all active players have equal bets
      const activePlayers = gameState.players.filter(p => !p.folded);
      activePlayers.forEach(player => {
        expect(player.bet).toBe(150);
      });
    });

    test('should handle check-check-check scenario', async () => {
      // Set up 3-player game on the flop
      mockGameController.addPlayer.mockReturnValue({ success: true });
      mockGameController.canStartGame.mockReturnValue({ canStart: true });
      mockGameController.startGame.mockReturnValue({ success: true });

      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'flop',
        handNumber: 1
      });

      let gameState = {
        players: [
          { id: 'alice', name: 'Alice', chips: 980, bet: 0, cards: [{ rank: '2', suit: 'hearts' }, { rank: '3', suit: 'spades' }], folded: false },
          { id: 'bob', name: 'Bob', chips: 980, bet: 0, cards: [{ rank: '4', suit: 'diamonds' }, { rank: '5', suit: 'clubs' }], folded: false },
          { id: 'charlie', name: 'Charlie', chips: 980, bet: 0, cards: [{ rank: '6', suit: 'hearts' }, { rank: '7', suit: 'spades' }], folded: false }
        ],
        table: {
          communityCards: [
            { rank: 'A', suit: 'diamonds' },
            { rank: 'K', suit: 'clubs' },
            { rank: 'Q', suit: 'hearts' }
          ]
        },
        betting: { currentPlayer: 'alice' },
        pots: { total: 60 }
      };

      mockGameController.getGameState.mockReturnValue(gameState);
      uiManager.refreshUI();

      // Alice checks
      mockGameController.getPlayerActions.mockReturnValue({
        success: true,
        actions: ['check', 'raise']
      });
      mockGameController.playerAction.mockReturnValue({ success: true });

      uiManager.handlePlayerAction('check');

      // Update state after Alice checks
      gameState.betting.currentPlayer = 'bob';
      mockGameController.getGameState.mockReturnValue(gameState);
      uiManager.refreshUI();

      expect(mockGameController.playerAction).toHaveBeenCalledWith({
        playerId: 'alice',
        action: 'check'
      });

      // Bob checks
      uiManager.handlePlayerAction('check');

      // Update state after Bob checks
      gameState.betting.currentPlayer = 'charlie';
      mockGameController.getGameState.mockReturnValue(gameState);
      uiManager.refreshUI();

      expect(mockGameController.playerAction).toHaveBeenCalledWith({
        playerId: 'bob',
        action: 'check'
      });

      // Charlie checks - round complete
      uiManager.handlePlayerAction('check');

      // Update to turn phase
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'turn',
        handNumber: 1
      });
      gameState.table.communityCards.push({ rank: 'J', suit: 'spades' });
      gameState.betting = { currentPlayer: 'alice' };
      mockGameController.getGameState.mockReturnValue(gameState);
      uiManager.refreshUI();

      expect(mockGameController.playerAction).toHaveBeenCalledWith({
        playerId: 'charlie',
        action: 'check'
      });

      // Verify turn phase and 4 community cards
      expect(document.getElementById('game-phase').textContent).toBe('Turn');
      const communityCards = document.getElementById('community-cards-container');
      const cardElements = communityCards.querySelectorAll('.card');
      expect(cardElements.length).toBe(4);
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    test('should handle invalid raise amount', async () => {
      // Set up game with current player
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'preflop',
        handNumber: 1
      });
      mockGameController.getGameState.mockReturnValue({
        players: [
          { id: 'alice', name: 'Alice', chips: 100, bet: 0, cards: [{ rank: 'A', suit: 'hearts' }, { rank: 'K', suit: 'spades' }], folded: false }
        ],
        table: { communityCards: [] },
        betting: { currentPlayer: 'alice' },
        pots: { total: 0 }
      });

      uiManager.refreshUI();

      // Try to raise more than available chips
      mockGameController.getPlayerActions.mockReturnValue({
        success: true,
        actions: ['fold', 'check', 'raise'],
        minRaise: 20,
        maxRaise: 100
      });

      uiManager.handleRaiseClick();
      document.getElementById('raise-amount').value = '200'; // More than max

      mockGameController.playerAction.mockReturnValue({
        success: false,
        error: {
          type: 'InvalidActionError',
          message: 'Raise amount exceeds available chips'
        }
      });

      uiManager.handleConfirmRaise();

      // Verify error is displayed
      const errorDisplay = document.getElementById('error-display');
      const errorMessage = document.getElementById('error-message');

      expect(errorDisplay.style.display).toBe('block');
      expect(errorMessage.textContent).toBe('Raise amount exceeds available chips');

      // Verify raise controls are still visible for retry
      const raiseControls = document.getElementById('raise-controls');
      expect(raiseControls.style.display).toBe('block');
    });

    test('should handle action when no current player', async () => {
      // Set up game state with no current player
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'complete',
        handNumber: 1
      });
      mockGameController.getGameState.mockReturnValue({
        players: [
          { id: 'alice', name: 'Alice', chips: 1000, bet: 0, cards: [], folded: false }
        ],
        table: { communityCards: [] },
        betting: {}, // No current player
        pots: { total: 0 }
      });

      uiManager.refreshUI();

      // Try to perform action when no current player
      uiManager.handlePlayerAction('fold');

      // Verify error is displayed
      const errorDisplay = document.getElementById('error-display');
      const errorMessage = document.getElementById('error-message');

      expect(errorDisplay.style.display).toBe('block');
      expect(errorMessage.textContent).toBe('No current player to perform action');
    });

    test('should handle poker engine returning invalid game state', async () => {
      // Mock poker engine returning malformed data
      mockGameController.getGameState.mockReturnValue({
        players: null, // Invalid
        table: undefined, // Invalid
        betting: {},
        pots: { total: 0 }
      });

      // Should not crash when updating UI
      expect(() => {
        uiManager.updateGameStateDisplay();
      }).not.toThrow();

      // Should display fallback content
      const playersGrid = document.getElementById('players-grid');
      expect(playersGrid.innerHTML).toContain('No players in game');

      const communityCards = document.getElementById('community-cards-container');
      expect(communityCards.innerHTML).toContain('No community cards dealt yet');
    });
  });

  describe('UI State Consistency Verification', () => {
    test('should maintain UI consistency with poker engine state throughout game', async () => {
      // Set up complete game scenario
      mockGameController.addPlayer.mockReturnValue({ success: true });
      mockGameController.canStartGame.mockReturnValue({ canStart: true });
      mockGameController.startGame.mockReturnValue({ success: true });

      // Add players
      document.getElementById('player-id').value = 'alice';
      document.getElementById('player-name').value = 'Alice';
      document.getElementById('add-player-btn').click();

      document.getElementById('player-id').value = 'bob';
      document.getElementById('player-name').value = 'Bob';
      document.getElementById('add-player-btn').click();

      // Define game progression states
      const gameStates = [
        {
          phase: 'preflop',
          players: [
            { id: 'alice', name: 'Alice', chips: 980, bet: 20, cards: [{ rank: 'A', suit: 'hearts' }, { rank: 'K', suit: 'spades' }], folded: false },
            { id: 'bob', name: 'Bob', chips: 990, bet: 10, cards: [{ rank: 'Q', suit: 'diamonds' }, { rank: 'J', suit: 'clubs' }], folded: false }
          ],
          communityCards: [],
          currentPlayer: 'bob',
          pot: 30,
          handNumber: 1
        },
        {
          phase: 'flop',
          players: [
            { id: 'alice', name: 'Alice', chips: 970, bet: 0, cards: [{ rank: 'A', suit: 'hearts' }, { rank: 'K', suit: 'spades' }], folded: false },
            { id: 'bob', name: 'Bob', chips: 970, bet: 0, cards: [{ rank: 'Q', suit: 'diamonds' }, { rank: 'J', suit: 'clubs' }], folded: false }
          ],
          communityCards: [
            { rank: 'A', suit: 'diamonds' },
            { rank: 'K', suit: 'clubs' },
            { rank: '2', suit: 'hearts' }
          ],
          currentPlayer: 'alice',
          pot: 60,
          handNumber: 1
        },
        {
          phase: 'complete',
          players: [
            { id: 'alice', name: 'Alice', chips: 1030, bet: 0, cards: [{ rank: 'A', suit: 'hearts' }, { rank: 'K', suit: 'spades' }], folded: false },
            { id: 'bob', name: 'Bob', chips: 970, bet: 0, cards: [{ rank: 'Q', suit: 'diamonds' }, { rank: 'J', suit: 'clubs' }], folded: false }
          ],
          communityCards: [
            { rank: 'A', suit: 'diamonds' },
            { rank: 'K', suit: 'clubs' },
            { rank: '2', suit: 'hearts' },
            { rank: '3', suit: 'spades' },
            { rank: '4', suit: 'diamonds' }
          ],
          currentPlayer: null,
          pot: 0,
          handNumber: 1,
          handResults: {
            winners: [{ playerId: 'alice', handType: 'Two Pair', amount: 60 }]
          }
        }
      ];

      // Test each state
      gameStates.forEach((state, index) => {
        mockGameController.getGameStats.mockReturnValue({
          isGameActive: true,
          currentPhase: state.phase,
          handNumber: state.handNumber
        });

        mockGameController.getGameState.mockReturnValue({
          players: state.players,
          table: { communityCards: state.communityCards },
          betting: { currentPlayer: state.currentPlayer },
          pots: { total: state.pot },
          handResults: state.handResults
        });

        uiManager.refreshUI();

        // Verify UI matches engine state
        const phaseDisplayNames = {
          'preflop': 'Pre-Flop',
          'flop': 'Flop',
          'turn': 'Turn',
          'river': 'River',
          'complete': 'Hand Complete'
        };

        expect(document.getElementById('game-phase').textContent).toBe(phaseDisplayNames[state.phase]);
        expect(document.getElementById('hand-number').textContent).toBe(state.handNumber.toString());
        expect(document.getElementById('total-pot').textContent).toBe(`$${state.pot}`);

        if (state.currentPlayer) {
          const currentPlayerData = state.players.find(p => p.id === state.currentPlayer);
          expect(document.getElementById('current-player').textContent).toBe(currentPlayerData.name);
        } else {
          expect(document.getElementById('current-player').textContent).toBe('None');
        }

        // Verify community cards count
        const communityCards = document.getElementById('community-cards-container');
        const cardElements = communityCards.querySelectorAll('.card');
        expect(cardElements.length).toBe(state.communityCards.length);

        // Verify player chip counts in UI
        state.players.forEach(player => {
          const playersGrid = document.getElementById('players-grid');
          expect(playersGrid.innerHTML).toContain(player.chips.toString());
        });

        // Verify hand results display for complete phase
        if (state.phase === 'complete' && state.handResults) {
          const handResultsSection = document.getElementById('hand-results');
          expect(handResultsSection.style.display).toBe('block');

          const resultsContent = document.getElementById('results-content');
          expect(resultsContent.innerHTML).toContain('Hand Winners');
          expect(resultsContent.innerHTML).toContain('Alice');
        }
      });
    });
  });

  describe('Complex Multi-Hand Game Scenarios', () => {
    test('should handle multiple hands with changing chip stacks', async () => {
      // Set up 3-player game
      mockGameController.addPlayer.mockReturnValue({ success: true });
      mockGameController.canStartGame.mockReturnValue({ canStart: true });
      mockGameController.startGame.mockReturnValue({ success: true });

      ['alice', 'bob', 'charlie'].forEach((id) => {
        document.getElementById('player-id').value = id;
        document.getElementById('player-name').value = id.charAt(0).toUpperCase() + id.slice(1);
        document.getElementById('add-player-btn').click();
      });

      document.getElementById('start-game-btn').click();

      // Hand 1: Alice wins big pot
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'complete',
        handNumber: 1
      });
      mockGameController.getGameState.mockReturnValue({
        players: [
          { id: 'alice', name: 'Alice', chips: 1200, bet: 0, cards: [], folded: false },
          { id: 'bob', name: 'Bob', chips: 900, bet: 0, cards: [], folded: false },
          { id: 'charlie', name: 'Charlie', chips: 900, bet: 0, cards: [], folded: false }
        ],
        table: { communityCards: [] },
        betting: {},
        pots: { total: 0 },
        handResults: {
          winners: [{ playerId: 'alice', handType: 'Full House', amount: 300 }]
        }
      });

      uiManager.refreshUI();

      // Verify chip distribution after hand 1
      const playersGrid = document.getElementById('players-grid');
      expect(playersGrid.innerHTML).toContain('1200'); // Alice
      expect(playersGrid.innerHTML).toContain('900');  // Bob and Charlie

      // Start hand 2
      mockGameController.startNewHand.mockReturnValue({ success: true });
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'preflop',
        handNumber: 2
      });

      document.getElementById('new-hand-btn').click();

      expect(mockGameController.startNewHand).toHaveBeenCalled();
      expect(document.getElementById('hand-number').textContent).toBe('2');

      // Hand 2: Bob wins to even out
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'complete',
        handNumber: 2
      });
      mockGameController.getGameState.mockReturnValue({
        players: [
          { id: 'alice', name: 'Alice', chips: 1000, bet: 0, cards: [], folded: false },
          { id: 'bob', name: 'Bob', chips: 1100, bet: 0, cards: [], folded: false },
          { id: 'charlie', name: 'Charlie', chips: 900, bet: 0, cards: [], folded: false }
        ],
        table: { communityCards: [] },
        betting: {},
        pots: { total: 0 },
        handResults: {
          winners: [{ playerId: 'bob', handType: 'Straight', amount: 200 }]
        }
      });

      uiManager.refreshUI();

      // Verify updated chip counts
      expect(playersGrid.innerHTML).toContain('1000'); // Alice
      expect(playersGrid.innerHTML).toContain('1100'); // Bob
      expect(playersGrid.innerHTML).toContain('900');  // Charlie

      // Hand 3: Charlie eliminated
      mockGameController.startNewHand.mockReturnValue({ success: true });
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'complete',
        handNumber: 3
      });
      mockGameController.getGameState.mockReturnValue({
        players: [
          { id: 'alice', name: 'Alice', chips: 1450, bet: 0, cards: [], folded: false },
          { id: 'bob', name: 'Bob', chips: 1550, bet: 0, cards: [], folded: false },
          { id: 'charlie', name: 'Charlie', chips: 0, bet: 0, cards: [], folded: false }
        ],
        table: { communityCards: [] },
        betting: {},
        pots: { total: 0 },
        handResults: {
          winners: [
            { playerId: 'alice', handType: 'Flush', amount: 450 },
            { playerId: 'bob', handType: 'Flush', amount: 450 }
          ]
        }
      });

      document.getElementById('new-hand-btn').click();
      uiManager.refreshUI();

      // Verify Charlie is eliminated (0 chips)
      expect(playersGrid.innerHTML).toContain('1450'); // Alice
      expect(playersGrid.innerHTML).toContain('1550'); // Bob
      expect(playersGrid.innerHTML).toContain('0');    // Charlie eliminated

      // Verify multiple winners display
      const resultsContent = document.getElementById('results-content');
      expect(resultsContent.innerHTML).toContain('Alice');
      expect(resultsContent.innerHTML).toContain('Bob');
      expect(resultsContent.innerHTML).toContain('Flush');
    });

    test('should handle player elimination and game continuation', async () => {
      // Start with 4 players, eliminate down to 2
      mockGameController.addPlayer.mockReturnValue({ success: true });
      mockGameController.canStartGame.mockReturnValue({ canStart: true });
      mockGameController.startGame.mockReturnValue({ success: true });

      ['alice', 'bob', 'charlie', 'diana'].forEach((id) => {
        document.getElementById('player-id').value = id;
        document.getElementById('player-name').value = id.charAt(0).toUpperCase() + id.slice(1);
        document.getElementById('add-player-btn').click();
      });

      document.getElementById('start-game-btn').click();

      // Simulate several hands with eliminations
      const eliminationScenarios = [
        {
          handNumber: 1,
          survivors: [
            { id: 'alice', name: 'Alice', chips: 1200 },
            { id: 'bob', name: 'Bob', chips: 1300 },
            { id: 'charlie', name: 'Charlie', chips: 500 },
            { id: 'diana', name: 'Diana', chips: 0 } // Eliminated
          ]
        },
        {
          handNumber: 2,
          survivors: [
            { id: 'alice', name: 'Alice', chips: 1500 },
            { id: 'bob', name: 'Bob', chips: 1500 },
            { id: 'charlie', name: 'Charlie', chips: 0 } // Eliminated
          ]
        }
      ];

      eliminationScenarios.forEach((scenario) => {
        mockGameController.getGameStats.mockReturnValue({
          isGameActive: true,
          currentPhase: 'complete',
          handNumber: scenario.handNumber
        });

        mockGameController.getGameState.mockReturnValue({
          players: scenario.survivors.map(p => ({
            ...p,
            bet: 0,
            cards: [],
            folded: false
          })),
          table: { communityCards: [] },
          betting: {},
          pots: { total: 0 }
        });

        uiManager.refreshUI();

        // Verify remaining players
        const playersGrid = document.getElementById('players-grid');
        const activePlayers = scenario.survivors.filter(p => p.chips > 0);
        const eliminatedPlayers = scenario.survivors.filter(p => p.chips === 0);

        activePlayers.forEach(player => {
          expect(playersGrid.innerHTML).toContain(player.name);
          expect(playersGrid.innerHTML).toContain(player.chips.toString());
        });

        eliminatedPlayers.forEach(player => {
          expect(playersGrid.innerHTML).toContain(player.name);
          expect(playersGrid.innerHTML).toContain('0');
        });

        // Start next hand if not final
        if (scenario.handNumber < eliminationScenarios.length) {
          mockGameController.startNewHand.mockReturnValue({ success: true });
          document.getElementById('new-hand-btn').click();
        }
      });
    });
  });

  describe('Advanced Side Pot Scenarios', () => {
    test('should handle complex side pot with multiple all-ins', async () => {
      // Set up 4-player game with varying chip stacks
      mockGameController.addPlayer.mockReturnValue({ success: true });
      mockGameController.canStartGame.mockReturnValue({ canStart: true });
      mockGameController.startGame.mockReturnValue({ success: true });

      // Start game
      document.getElementById('start-game-btn').click();

      // Complex all-in scenario:
      // Alice: 100 chips (all-in)
      // Bob: 300 chips (all-in) 
      // Charlie: 500 chips (calls 300)
      // Diana: 1000 chips (calls 300)
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'river',
        handNumber: 1
      });

      mockGameController.getGameState.mockReturnValue({
        players: [
          { id: 'alice', name: 'Alice', chips: 0, bet: 100, cards: [{ rank: 'A', suit: 'hearts' }, { rank: 'A', suit: 'spades' }], folded: false },
          { id: 'bob', name: 'Bob', chips: 0, bet: 300, cards: [{ rank: 'K', suit: 'diamonds' }, { rank: 'K', suit: 'clubs' }], folded: false },
          { id: 'charlie', name: 'Charlie', chips: 200, bet: 300, cards: [{ rank: 'Q', suit: 'hearts' }, { rank: 'Q', suit: 'spades' }], folded: false },
          { id: 'diana', name: 'Diana', chips: 700, bet: 300, cards: [{ rank: 'J', suit: 'diamonds' }, { rank: 'J', suit: 'clubs' }], folded: false }
        ],
        table: {
          communityCards: [
            { rank: '2', suit: 'hearts' },
            { rank: '3', suit: 'diamonds' },
            { rank: '4', suit: 'clubs' },
            { rank: '5', suit: 'spades' },
            { rank: '6', suit: 'hearts' }
          ]
        },
        betting: {},
        pots: {
          total: 1000,
          sidePots: [
            { amount: 400 }, // Main pot: Alice eligible (4 * 100)
            { amount: 600 }  // Side pot: Bob, Charlie, Diana eligible (3 * 200)
          ]
        }
      });

      uiManager.refreshUI();

      // Verify complex side pot display
      const totalPot = document.getElementById('total-pot');
      const sidePots = document.getElementById('side-pots');

      expect(totalPot.textContent).toBe('$1000');
      expect(sidePots.textContent).toContain('Side Pot 1: $400');
      expect(sidePots.textContent).toContain('Side Pot 2: $600');

      // Verify all players show correct all-in status
      const playersGrid = document.getElementById('players-grid');
      expect(playersGrid.innerHTML).toContain('0'); // Alice all-in
      expect(playersGrid.innerHTML).toContain('0'); // Bob all-in
      expect(playersGrid.innerHTML).toContain('200'); // Charlie remaining
      expect(playersGrid.innerHTML).toContain('700'); // Diana remaining

      // Complete hand with side pot winners
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'complete',
        handNumber: 1
      });

      mockGameController.getGameState.mockReturnValue({
        players: [
          { id: 'alice', name: 'Alice', chips: 400, bet: 0, cards: [], folded: false }, // Won main pot
          { id: 'bob', name: 'Bob', chips: 600, bet: 0, cards: [], folded: false },     // Won side pot
          { id: 'charlie', name: 'Charlie', chips: 200, bet: 0, cards: [], folded: false },
          { id: 'diana', name: 'Diana', chips: 700, bet: 0, cards: [], folded: false }
        ],
        table: {
          communityCards: [
            { rank: '2', suit: 'hearts' },
            { rank: '3', suit: 'diamonds' },
            { rank: '4', suit: 'clubs' },
            { rank: '5', suit: 'spades' },
            { rank: '6', suit: 'hearts' }
          ]
        },
        betting: {},
        pots: { total: 0 },
        handResults: {
          winners: [
            { playerId: 'alice', handType: 'Pair of Aces', amount: 400 },
            { playerId: 'bob', handType: 'Pair of Kings', amount: 600 }
          ],
          potDistribution: {
            totalPot: 1000,
            mainPot: 400,
            sidePots: [{ amount: 600 }]
          }
        }
      });

      uiManager.refreshUI();

      // Verify hand results show multiple winners
      const handResultsSection = document.getElementById('hand-results');
      expect(handResultsSection.style.display).toBe('block');

      const resultsContent = document.getElementById('results-content');
      expect(resultsContent.innerHTML).toContain('Alice');
      expect(resultsContent.innerHTML).toContain('Won: $400');
      expect(resultsContent.innerHTML).toContain('Bob');
      expect(resultsContent.innerHTML).toContain('Won: $600');
      expect(resultsContent.innerHTML).toContain('Pair of Aces');
      expect(resultsContent.innerHTML).toContain('Pair of Kings');
    });
  });

  describe('Stress Testing and Performance', () => {
    test('should handle rapid UI updates without errors', async () => {
      // Set up game
      mockGameController.addPlayer.mockReturnValue({ success: true });
      mockGameController.canStartGame.mockReturnValue({ canStart: true });
      mockGameController.startGame.mockReturnValue({ success: true });

      // Simulate rapid state changes
      const rapidStates = Array.from({ length: 20 }, (_, i) => ({
        isGameActive: true,
        currentPhase: ['preflop', 'flop', 'turn', 'river'][i % 4],
        handNumber: Math.floor(i / 4) + 1,
        players: [
          { id: 'alice', name: 'Alice', chips: 1000 - (i * 10), bet: i * 5, cards: [], folded: false },
          { id: 'bob', name: 'Bob', chips: 1000 + (i * 10), bet: i * 5, cards: [], folded: false }
        ],
        pot: i * 20
      }));

      // Apply each state rapidly
      rapidStates.forEach((state, index) => {
        mockGameController.getGameStats.mockReturnValue({
          isGameActive: state.isGameActive,
          currentPhase: state.currentPhase,
          handNumber: state.handNumber
        });

        mockGameController.getGameState.mockReturnValue({
          players: state.players,
          table: { communityCards: [] },
          betting: { currentPlayer: index % 2 === 0 ? 'alice' : 'bob' },
          pots: { total: state.pot }
        });

        // Should not throw errors during rapid updates
        expect(() => {
          uiManager.refreshUI();
        }).not.toThrow();

        // Verify final state is correctly displayed
        if (index === rapidStates.length - 1) {
          expect(document.getElementById('hand-number').textContent).toBe(state.handNumber.toString());
          expect(document.getElementById('total-pot').textContent).toBe(`$${state.pot}`);
        }
      });
    });

    test('should handle large number of community cards and players gracefully', async () => {
      // Test with maximum players and all community cards
      const maxPlayers = Array.from({ length: 8 }, (_, i) => ({
        id: `player${i + 1}`,
        name: `Player ${i + 1}`,
        chips: 1000,
        bet: 50,
        cards: [
          { rank: 'A', suit: 'hearts' },
          { rank: 'K', suit: 'spades' }
        ],
        folded: false
      }));

      const allCommunityCards = [
        { rank: 'Q', suit: 'diamonds' },
        { rank: 'J', suit: 'clubs' },
        { rank: '10', suit: 'hearts' },
        { rank: '9', suit: 'spades' },
        { rank: '8', suit: 'diamonds' }
      ];

      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'river',
        handNumber: 1
      });

      mockGameController.getGameState.mockReturnValue({
        players: maxPlayers,
        table: { communityCards: allCommunityCards },
        betting: { currentPlayer: 'player1' },
        pots: { total: 400 }
      });

      // Should handle large state without errors
      expect(() => {
        uiManager.refreshUI();
      }).not.toThrow();

      // Verify all players are displayed
      const playersGrid = document.getElementById('players-grid');
      const playerElements = playersGrid.querySelectorAll('.player-state');
      expect(playerElements.length).toBe(8);

      // Verify all community cards are displayed
      const communityCards = document.getElementById('community-cards-container');
      const cardElements = communityCards.querySelectorAll('.card');
      expect(cardElements.length).toBe(5);

      // Verify UI remains responsive
      expect(document.getElementById('total-pot').textContent).toBe('$400');
      expect(document.getElementById('current-player').textContent).toBe('Player 1');
    });
  });

  describe('Error Recovery and Resilience', () => {
    test('should recover from poker engine errors and continue functioning', async () => {
      // Set up normal game state
      mockGameController.getGameStats.mockReturnValue({
        isGameActive: true,
        currentPhase: 'preflop',
        handNumber: 1
      });

      mockGameController.getGameState.mockReturnValue({
        players: [
          { id: 'alice', name: 'Alice', chips: 1000, bet: 0, cards: [], folded: false }
        ],
        table: { communityCards: [] },
        betting: { currentPlayer: 'alice' },
        pots: { total: 0 }
      });

      uiManager.refreshUI();

      // Simulate poker engine error
      mockGameController.playerAction.mockReturnValue({
        success: false,
        error: {
          type: 'EngineError',
          message: 'Internal poker engine error'
        }
      });

      uiManager.handlePlayerAction('fold');

      // Verify error is displayed
      const errorDisplay = document.getElementById('error-display');
      expect(errorDisplay.style.display).toBe('block');

      // Clear error and continue
      uiManager.clearError();
      expect(errorDisplay.style.display).toBe('none');

      // Engine recovers
      mockGameController.playerAction.mockReturnValue({ success: true });

      // Should be able to continue playing
      uiManager.handlePlayerAction('check');

      expect(mockGameController.playerAction).toHaveBeenCalledWith({
        playerId: 'alice',
        action: 'check'
      });

      // Error should remain cleared
      expect(errorDisplay.style.display).toBe('none');
    });

    test('should handle malformed poker engine responses gracefully', async () => {
      // Test various malformed responses
      const malformedResponses = [
        null,
        undefined,
        {},
        { players: null },
        { players: [], table: null },
        { players: [], table: {}, betting: null },
        { players: [], table: { communityCards: null }, betting: {} }
      ];

      malformedResponses.forEach((response, index) => {
        mockGameController.getGameState.mockReturnValue(response);

        // Should not crash
        expect(() => {
          uiManager.updateGameStateDisplay();
        }).not.toThrow();

        // For empty player arrays, should show no players message
        if (response && Array.isArray(response.players) && response.players.length === 0) {
          const playersGrid = document.getElementById('players-grid');
          expect(playersGrid.innerHTML).toContain('No players in game');
        }
      });
    });
  });
});