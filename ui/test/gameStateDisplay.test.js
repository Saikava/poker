// Tests for game state display components
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
// Test helpers are available but not used in this file

// Mock the GameController
jest.mock('../src/gameController.js', () => {
  return jest.fn().mockImplementation(() => ({
    getGameState: jest.fn(),
    getGameStats: jest.fn(),
    addPlayer: jest.fn(),
    removePlayer: jest.fn(),
    canStartGame: jest.fn(),
    getConfig: jest.fn(() => ({ startingChips: 1000 })),
    destroy: jest.fn()
  }));
});

describe('Game State Display Components', () => {
  let dom;
  let document;
  let window;
  let UIManager;
  let uiManager;
  let mockGameController;

  beforeAll(async () => {
    // Load the HTML file
    const htmlPath = path.join(__dirname, '../src/index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Create JSDOM instance
    dom = new JSDOM(htmlContent, {
      runScripts: 'dangerously',
      resources: 'usable'
    });
    
    document = dom.window.document;
    window = dom.window;
    
    // Make document and window available globally
    global.document = document;
    global.window = window;
    global.HTMLElement = window.HTMLElement;
    global.Event = window.Event;

    // Import UIManager after setting up globals
    const UIManagerModule = await import('../src/uiManager.js');
    UIManager = UIManagerModule.default;
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset DOM to initial state
    const totalPotElement = document.getElementById('total-pot');
    if (totalPotElement) {
      totalPotElement.textContent = '$0'; // Reset to initial HTML value
    }
    
    // Create fresh UI manager instance for each test with document reference
    uiManager = new UIManager(document);
    mockGameController = uiManager.getGameController();
    
    // Verify the mock is working
    expect(mockGameController.getGameState).toBeDefined();
    expect(mockGameController.getGameStats).toBeDefined();
    
    // Setup default mock returns
    mockGameController.getGameState.mockReturnValue({
      gameInfo: { isActive: false },
      players: [],
      table: { communityCards: [] },
      betting: {},
      pots: { total: 0 },
      config: { startingChips: 1000 }
    });
    
    mockGameController.getGameStats.mockReturnValue({
      handNumber: 0,
      currentPhase: 'waiting',
      totalPot: 0,
      isGameActive: false
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

  describe('Game Info Display', () => {
    test('displays initial game phase correctly', () => {
      // Set up mock data
      mockGameController.getGameStats.mockReturnValue({
        handNumber: 0,
        currentPhase: 'waiting',
        totalPot: 0,
        isGameActive: false
      });
      
      uiManager.updateGameStateDisplay();
      
      const gamePhaseElement = document.getElementById('game-phase');
      expect(gamePhaseElement.textContent).toBe('Not Started');
    });

    test('displays different game phases correctly', () => {
      const phases = [
        { phase: 'preflop', expected: 'Pre-Flop' },
        { phase: 'flop', expected: 'Flop' },
        { phase: 'turn', expected: 'Turn' },
        { phase: 'river', expected: 'River' },
        { phase: 'showdown', expected: 'Showdown' },
        { phase: 'complete', expected: 'Hand Complete' }
      ];

      phases.forEach(({ phase, expected }) => {
        // Clear previous mocks
        jest.clearAllMocks();
        
        // Reset mocks for each phase
        mockGameController.getGameState.mockReturnValue({
          gameInfo: { isActive: true },
          players: [],
          table: { communityCards: [] },
          betting: {},
          pots: { total: 100 },
          config: { startingChips: 1000 }
        });
        
        mockGameController.getGameStats.mockReturnValue({
          handNumber: 1,
          currentPhase: phase,
          totalPot: 100,
          isGameActive: true
        });

        uiManager.updateGameStateDisplay();
        
        const gamePhaseElement = document.getElementById('game-phase');
        expect(gamePhaseElement.textContent).toBe(expected);
      });
    });

    test('displays hand number correctly', () => {
      // Test that the mock is working first
      expect(typeof mockGameController.getGameStats).toBe('function');
      expect(mockGameController.getGameStats.mock).toBeDefined();
      
      mockGameController.getGameState.mockReturnValue({
        gameInfo: { isActive: true },
        players: [],
        table: { communityCards: [] },
        betting: {},
        pots: { total: 200 },
        config: { startingChips: 1000 }
      });
      
      mockGameController.getGameStats.mockReturnValue({
        handNumber: 5,
        currentPhase: 'flop',
        totalPot: 200,
        isGameActive: true
      });

      // Test the mock directly
      const testStats = mockGameController.getGameStats();
      expect(testStats.handNumber).toBe(5);
      
      uiManager.updateGameStateDisplay();
      
      const handNumberElement = document.getElementById('hand-number');
      expect(handNumberElement.textContent).toBe('5');
    });

    test('displays current player correctly', () => {
      const gameState = {
        gameInfo: { isActive: true },
        players: [
          { id: 'player1', name: 'Alice' },
          { id: 'player2', name: 'Bob' }
        ],
        betting: { currentPlayer: 'player1' },
        table: { communityCards: [] },
        pots: { total: 100 },
        config: { startingChips: 1000 }
      };

      mockGameController.getGameState.mockReturnValue(gameState);
      mockGameController.getGameStats.mockReturnValue({
        handNumber: 1,
        currentPhase: 'preflop',
        totalPot: 100,
        isGameActive: true
      });

      uiManager.updateGameStateDisplay();
      
      const currentPlayerElement = document.getElementById('current-player');
      expect(currentPlayerElement.textContent).toBe('Alice');
    });

    test('displays "None" when no current player', () => {
      const gameState = {
        gameInfo: { isActive: false },
        players: [],
        betting: {},
        table: { communityCards: [] },
        pots: { total: 0 },
        config: { startingChips: 1000 }
      };

      mockGameController.getGameState.mockReturnValue(gameState);
      mockGameController.getGameStats.mockReturnValue({
        handNumber: 0,
        currentPhase: 'waiting',
        totalPot: 0,
        isGameActive: false
      });

      uiManager.updateGameStateDisplay();
      
      const currentPlayerElement = document.getElementById('current-player');
      expect(currentPlayerElement.textContent).toBe('None');
    });
  });

  describe('Pot Information Display', () => {
    test('displays total pot correctly', () => {
      const gameState = {
        gameInfo: { isActive: true },
        players: [],
        table: { communityCards: [] },
        betting: {},
        pots: { total: 250 },
        config: { startingChips: 1000 }
      };

      mockGameController.getGameState.mockReturnValue(gameState);
      mockGameController.getGameStats.mockReturnValue({
        handNumber: 1,
        currentPhase: 'flop',
        totalPot: 250,
        isGameActive: true
      });

      uiManager.updateGameStateDisplay();
      
      const totalPotElement = document.getElementById('total-pot');
      expect(totalPotElement.textContent).toBe('$250');
    });

    test('displays zero pot correctly', () => {
      const gameState = {
        gameInfo: { isActive: false },
        players: [],
        table: { communityCards: [] },
        betting: {},
        pots: { total: 0 },
        config: { startingChips: 1000 }
      };

      mockGameController.getGameState.mockReturnValue(gameState);
      mockGameController.getGameStats.mockReturnValue({
        handNumber: 0,
        currentPhase: 'waiting',
        totalPot: 0,
        isGameActive: false
      });



      uiManager.updateGameStateDisplay();
      
      const totalPotElement = document.getElementById('total-pot');
      expect(totalPotElement.textContent).toBe('$0');
    });

    test('displays "None" when no side pots', () => {
      const gameState = {
        gameInfo: { isActive: true },
        players: [],
        table: { communityCards: [] },
        betting: {},
        pots: { total: 100, sidePots: [] },
        config: { startingChips: 1000 }
      };

      mockGameController.getGameState.mockReturnValue(gameState);
      mockGameController.getGameStats.mockReturnValue({
        handNumber: 1,
        currentPhase: 'flop',
        totalPot: 100,
        isGameActive: true
      });

      uiManager.updateGameStateDisplay();
      
      const sidePotsElement = document.getElementById('side-pots');
      expect(sidePotsElement.textContent).toBe('None');
    });

    test('displays side pots correctly', () => {
      const gameState = {
        gameInfo: { isActive: true },
        players: [],
        table: { communityCards: [] },
        betting: {},
        pots: { 
          total: 300, 
          sidePots: [
            { amount: 100 },
            { amount: 50 }
          ]
        },
        config: { startingChips: 1000 }
      };

      mockGameController.getGameState.mockReturnValue(gameState);
      mockGameController.getGameStats.mockReturnValue({
        handNumber: 1,
        currentPhase: 'river',
        totalPot: 300,
        isGameActive: true
      });

      uiManager.updateGameStateDisplay();
      
      const sidePotsElement = document.getElementById('side-pots');
      expect(sidePotsElement.textContent).toBe('Side Pot 1: $100, Side Pot 2: $50');
    });
  });

  describe('Community Cards Display', () => {
    test('displays message when no community cards', () => {
      const gameState = {
        gameInfo: { isActive: false },
        players: [],
        table: { communityCards: [] },
        betting: {},
        pots: { total: 0 },
        config: { startingChips: 1000 }
      };

      mockGameController.getGameState.mockReturnValue(gameState);
      mockGameController.getGameStats.mockReturnValue({
        handNumber: 0,
        currentPhase: 'waiting',
        totalPot: 0,
        isGameActive: false
      });

      uiManager.updateGameStateDisplay();
      
      const communityCardsContainer = document.getElementById('community-cards-container');
      expect(communityCardsContainer.innerHTML).toContain('No community cards dealt yet');
    });

    test('displays community cards correctly', () => {
      const gameState = {
        gameInfo: { isActive: true },
        players: [],
        table: { 
          communityCards: [
            { rank: 'A', suit: 'hearts' },
            { rank: 'K', suit: 'spades' },
            { rank: 'Q', suit: 'diamonds' }
          ]
        },
        betting: {},
        pots: { total: 100 },
        config: { startingChips: 1000 }
      };

      mockGameController.getGameState.mockReturnValue(gameState);
      mockGameController.getGameStats.mockReturnValue({
        handNumber: 1,
        currentPhase: 'flop',
        totalPot: 100,
        isGameActive: true
      });

      uiManager.updateGameStateDisplay();
      
      const communityCardsContainer = document.getElementById('community-cards-container');
      const cardElements = communityCardsContainer.querySelectorAll('.card');
      
      expect(cardElements.length).toBe(3);
      
      // Check first card (Ace of Hearts)
      expect(cardElements[0].classList.contains('red')).toBe(true);
      expect(cardElements[0].querySelector('.card-rank').textContent).toBe('A');
      expect(cardElements[0].querySelector('.card-suit').textContent).toBe('♥');
      
      // Check second card (King of Spades)
      expect(cardElements[1].classList.contains('black')).toBe(true);
      expect(cardElements[1].querySelector('.card-rank').textContent).toBe('K');
      expect(cardElements[1].querySelector('.card-suit').textContent).toBe('♠');
      
      // Check third card (Queen of Diamonds)
      expect(cardElements[2].classList.contains('red')).toBe(true);
      expect(cardElements[2].querySelector('.card-rank').textContent).toBe('Q');
      expect(cardElements[2].querySelector('.card-suit').textContent).toBe('♦');
    });

    test('handles 10 rank display correctly', () => {
      const gameState = {
        gameInfo: { isActive: true },
        players: [],
        table: { 
          communityCards: [
            { rank: '10', suit: 'clubs' }
          ]
        },
        betting: {},
        pots: { total: 50 },
        config: { startingChips: 1000 }
      };

      mockGameController.getGameState.mockReturnValue(gameState);
      mockGameController.getGameStats.mockReturnValue({
        handNumber: 1,
        currentPhase: 'turn',
        totalPot: 50,
        isGameActive: true
      });

      uiManager.updateGameStateDisplay();
      
      const communityCardsContainer = document.getElementById('community-cards-container');
      const cardElement = communityCardsContainer.querySelector('.card');
      
      expect(cardElement.querySelector('.card-rank').textContent).toBe('T');
      expect(cardElement.querySelector('.card-suit').textContent).toBe('♣');
    });
  });

  describe('Players Display', () => {
    test('displays message when no players', () => {
      const gameState = {
        gameInfo: { isActive: false },
        players: [],
        table: { communityCards: [] },
        betting: {},
        pots: { total: 0 },
        config: { startingChips: 1000 }
      };

      mockGameController.getGameState.mockReturnValue(gameState);
      mockGameController.getGameStats.mockReturnValue({
        handNumber: 0,
        currentPhase: 'waiting',
        totalPot: 0,
        isGameActive: false
      });

      uiManager.updateGameStateDisplay();
      
      const playersGrid = document.getElementById('players-grid');
      expect(playersGrid.innerHTML).toContain('No players in game');
    });

    test('displays players correctly', () => {
      const gameState = {
        gameInfo: { isActive: true },
        players: [
          {
            id: 'player1',
            name: 'Alice',
            chips: 1000,
            bet: 50,
            cards: [
              { rank: 'A', suit: 'hearts' },
              { rank: 'K', suit: 'spades' }
            ],
            folded: false
          },
          {
            id: 'player2',
            name: 'Bob',
            chips: 950,
            bet: 50,
            cards: [
              { rank: 'Q', suit: 'diamonds' },
              { rank: 'J', suit: 'clubs' }
            ],
            folded: false
          }
        ],
        table: { communityCards: [] },
        betting: { currentPlayer: 'player1' },
        pots: { total: 100 },
        config: { startingChips: 1000 }
      };

      mockGameController.getGameState.mockReturnValue(gameState);
      mockGameController.getGameStats.mockReturnValue({
        handNumber: 1,
        currentPhase: 'preflop',
        totalPot: 100,
        isGameActive: true
      });

      uiManager.updateGameStateDisplay();
      
      const playersGrid = document.getElementById('players-grid');
      const playerElements = playersGrid.querySelectorAll('.player-state');
      
      expect(playerElements.length).toBe(2);
      
      // Check first player (current player)
      const player1Element = playerElements[0];
      expect(player1Element.classList.contains('current-player')).toBe(true);
      expect(player1Element.querySelector('.player-name').textContent).toBe('Alice');
      expect(player1Element.querySelector('.player-id').textContent).toBe('(player1)');
      
      const player1Cards = player1Element.querySelectorAll('.card');
      expect(player1Cards.length).toBe(2);
      expect(player1Cards[0].classList.contains('small')).toBe(true);
      
      // Check player stats
      const player1Stats = player1Element.querySelector('.player-stats');
      expect(player1Stats.textContent).toContain('Chips: $1000');
      expect(player1Stats.textContent).toContain('Current Bet: $50');
      expect(player1Stats.textContent).toContain('Status: Active');
      
      // Check second player
      const player2Element = playerElements[1];
      expect(player2Element.classList.contains('current-player')).toBe(false);
      expect(player2Element.querySelector('.player-name').textContent).toBe('Bob');
    });

    test('displays folded players correctly', () => {
      const gameState = {
        gameInfo: { isActive: true },
        players: [
          {
            id: 'player1',
            name: 'Alice',
            chips: 1000,
            bet: 0,
            cards: [],
            folded: true
          }
        ],
        table: { communityCards: [] },
        betting: {},
        pots: { total: 50 },
        config: { startingChips: 1000 }
      };

      mockGameController.getGameState.mockReturnValue(gameState);
      mockGameController.getGameStats.mockReturnValue({
        handNumber: 1,
        currentPhase: 'flop',
        totalPot: 50,
        isGameActive: true
      });

      uiManager.updateGameStateDisplay();
      
      const playersGrid = document.getElementById('players-grid');
      const playerElement = playersGrid.querySelector('.player-state');
      
      expect(playerElement.classList.contains('folded')).toBe(true);
      expect(playerElement.querySelector('.player-stats').textContent).toContain('Status: Folded');
    });

    test('displays players with no cards correctly', () => {
      const gameState = {
        gameInfo: { isActive: true },
        players: [
          {
            id: 'player1',
            name: 'Alice',
            chips: 1000,
            bet: 0,
            cards: [],
            folded: false
          }
        ],
        table: { communityCards: [] },
        betting: {},
        pots: { total: 0 },
        config: { startingChips: 1000 }
      };

      mockGameController.getGameState.mockReturnValue(gameState);
      mockGameController.getGameStats.mockReturnValue({
        handNumber: 1,
        currentPhase: 'preflop',
        totalPot: 0,
        isGameActive: true
      });

      uiManager.updateGameStateDisplay();
      
      const playersGrid = document.getElementById('players-grid');
      const playerElement = playersGrid.querySelector('.player-state');
      const cardsArea = playerElement.querySelector('.player-cards');
      
      expect(cardsArea.innerHTML).toContain('No cards');
    });
  });

  describe('Card Creation', () => {
    test('creates card element correctly', () => {
      const card = { rank: 'A', suit: 'hearts' };
      const cardHtml = uiManager.createCardElement(card);
      
      expect(cardHtml).toContain('card red');
      expect(cardHtml).toContain('data-rank="A"');
      expect(cardHtml).toContain('data-suit="hearts"');
      expect(cardHtml).toContain('A');
      expect(cardHtml).toContain('♥');
    });

    test('creates small card element correctly', () => {
      const card = { rank: 'K', suit: 'spades' };
      const cardHtml = uiManager.createCardElement(card, true);
      
      expect(cardHtml).toContain('card black small');
      expect(cardHtml).toContain('K');
      expect(cardHtml).toContain('♠');
    });

    test('handles invalid card data', () => {
      const cardHtml = uiManager.createCardElement(null);
      expect(cardHtml).toContain('?');
      
      const incompleteCard = { rank: 'A' };
      const incompleteCardHtml = uiManager.createCardElement(incompleteCard);
      expect(incompleteCardHtml).toContain('?');
    });

    test('handles all suits correctly', () => {
      const suits = [
        { suit: 'hearts', symbol: '♥', color: 'red' },
        { suit: 'diamonds', symbol: '♦', color: 'red' },
        { suit: 'clubs', symbol: '♣', color: 'black' },
        { suit: 'spades', symbol: '♠', color: 'black' }
      ];

      suits.forEach(({ suit, symbol, color }) => {
        const card = { rank: 'A', suit };
        const cardHtml = uiManager.createCardElement(card);
        
        expect(cardHtml).toContain(`card ${color}`);
        expect(cardHtml).toContain(symbol);
      });
    });
  });

  describe('Integration with Game Controller', () => {
    test('calls game controller methods correctly', () => {
      // Set up basic mock data
      mockGameController.getGameState.mockReturnValue({
        gameInfo: { isActive: false },
        players: [],
        table: { communityCards: [] },
        betting: {},
        pots: { total: 0 },
        config: { startingChips: 1000 }
      });
      
      mockGameController.getGameStats.mockReturnValue({
        handNumber: 0,
        currentPhase: 'waiting',
        totalPot: 0,
        isGameActive: false
      });
      
      uiManager.updateGameStateDisplay();
      
      expect(mockGameController.getGameState).toHaveBeenCalled();
      expect(mockGameController.getGameStats).toHaveBeenCalled();
    });

    test('handles game controller errors gracefully', () => {
      mockGameController.getGameState.mockImplementation(() => {
        throw new Error('Game controller error');
      });

      expect(() => {
        uiManager.updateGameStateDisplay();
      }).not.toThrow();
    });
  });

  describe('HTML Escaping', () => {
    test('escapes player names to prevent XSS', () => {
      const gameState = {
        gameInfo: { isActive: true },
        players: [
          {
            id: '<script>alert("xss")</script>',
            name: '<img src="x" onerror="alert(\'xss\')">',
            chips: 1000,
            bet: 0,
            cards: [],
            folded: false
          }
        ],
        table: { communityCards: [] },
        betting: {},
        pots: { total: 0 },
        config: { startingChips: 1000 }
      };

      mockGameController.getGameState.mockReturnValue(gameState);
      mockGameController.getGameStats.mockReturnValue({
        handNumber: 1,
        currentPhase: 'preflop',
        totalPot: 0,
        isGameActive: true
      });

      uiManager.updateGameStateDisplay();
      
      const playersGrid = document.getElementById('players-grid');
      const innerHTML = playersGrid.innerHTML;
      
      // Check that content is properly escaped (this is working)
      expect(innerHTML).toContain('&lt;img src="x" onerror="alert(\'xss\')"&gt;');
      expect(innerHTML).toContain('&lt;script&gt;alert("xss")&lt;/script&gt;');
      
      // Check that dangerous HTML tags are not present in unescaped form in the content
      const playerNameSpan = playersGrid.querySelector('.player-name');
      const playerIdSpan = playersGrid.querySelector('.player-id');
      
      // The dangerous HTML tags should be escaped
      expect(playerNameSpan.innerHTML).not.toContain('<img');
      expect(playerNameSpan.innerHTML).not.toContain('<script>');
      expect(playerIdSpan.innerHTML).not.toContain('<script>');
      
      // Verify escaped content is present (< and > should be escaped)
      expect(playerNameSpan.innerHTML).toContain('&lt;');
      expect(playerNameSpan.innerHTML).toContain('&gt;');
      expect(playerIdSpan.innerHTML).toContain('&lt;');
      expect(playerIdSpan.innerHTML).toContain('&gt;');
      
      // The text content should be safe (onerror is just text now, not executable)
      expect(playerNameSpan.innerHTML).toContain('onerror'); // This is now safe text
      expect(playerIdSpan.innerHTML).toContain('alert'); // This is now safe text
    });
  });
});