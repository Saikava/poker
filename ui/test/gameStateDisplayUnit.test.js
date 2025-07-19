// Unit tests for game state display methods
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

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

describe('Game State Display Unit Tests', () => {
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
    // Test if DOM is ready
    const testElement = document.getElementById('hand-number');
    expect(testElement).not.toBeNull();
    
    try {
      // Create fresh UI manager instance for each test, passing the document reference
      uiManager = new UIManager(document);
      mockGameController = uiManager.getGameController();
      
      // Debug: Check if UIManager was created successfully
      expect(uiManager).toBeDefined();
      expect(uiManager.elements).toBeDefined();
    } catch (error) {
      console.error('Error creating UIManager:', error);
      throw error;
    }
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

  describe('updateGameInfo method', () => {
    test('updates game phase correctly', () => {
      const gameStats = {
        handNumber: 1,
        currentPhase: 'preflop',
        totalPot: 100,
        isGameActive: true
      };

      mockGameController.getGameState.mockReturnValue({
        players: [],
        betting: {},
        table: { communityCards: [] },
        pots: { total: 100 }
      });

      uiManager.updateGameInfo(gameStats);
      
      const gamePhaseElement = document.getElementById('game-phase');
      expect(gamePhaseElement.textContent).toBe('Pre-Flop');
    });

    test('updates hand number correctly', () => {
      const gameStats = {
        handNumber: 5,
        currentPhase: 'flop',
        totalPot: 200,
        isGameActive: true
      };

      mockGameController.getGameState.mockReturnValue({
        players: [],
        betting: {},
        table: { communityCards: [] },
        pots: { total: 200 }
      });

      uiManager.updateGameInfo(gameStats);
      
      const handNumberElement = document.getElementById('hand-number');
      expect(handNumberElement.textContent).toBe('5');
    });

    test('updates current player correctly', () => {
      const gameStats = {
        handNumber: 1,
        currentPhase: 'preflop',
        totalPot: 100,
        isGameActive: true
      };

      mockGameController.getGameState.mockReturnValue({
        players: [
          { id: 'player1', name: 'Alice' },
          { id: 'player2', name: 'Bob' }
        ],
        betting: { currentPlayer: 'player1' },
        table: { communityCards: [] },
        pots: { total: 100 }
      });

      uiManager.updateGameInfo(gameStats);
      
      const currentPlayerElement = document.getElementById('current-player');
      expect(currentPlayerElement.textContent).toBe('Alice');
    });
  });

  describe('updatePotDisplay method', () => {
    test('updates total pot correctly', () => {
      const gameState = {
        players: [],
        table: { communityCards: [] },
        betting: {},
        pots: { total: 250 }
      };

      uiManager.updatePotDisplay(gameState);
      
      const totalPotElement = document.getElementById('total-pot');
      expect(totalPotElement.textContent).toBe('$250');
    });

    test('displays side pots correctly', () => {
      const gameState = {
        players: [],
        table: { communityCards: [] },
        betting: {},
        pots: { 
          total: 300, 
          sidePots: [
            { amount: 100 },
            { amount: 50 }
          ]
        }
      };

      uiManager.updatePotDisplay(gameState);
      
      const sidePotsElement = document.getElementById('side-pots');
      expect(sidePotsElement.textContent).toBe('Side Pot 1: $100, Side Pot 2: $50');
    });
  });

  describe('updateCommunityCards method', () => {
    test('displays community cards correctly', () => {
      const gameState = {
        players: [],
        table: { 
          communityCards: [
            { rank: 'A', suit: 'hearts' },
            { rank: 'K', suit: 'spades' }
          ]
        },
        betting: {},
        pots: { total: 100 }
      };

      uiManager.updateCommunityCards(gameState);
      
      const communityCardsContainer = document.getElementById('community-cards-container');
      const cardElements = communityCardsContainer.querySelectorAll('.card');
      
      expect(cardElements.length).toBe(2);
      expect(cardElements[0].classList.contains('red')).toBe(true);
      expect(cardElements[1].classList.contains('black')).toBe(true);
    });

    test('displays no cards message when empty', () => {
      const gameState = {
        players: [],
        table: { communityCards: [] },
        betting: {},
        pots: { total: 0 }
      };

      uiManager.updateCommunityCards(gameState);
      
      const communityCardsContainer = document.getElementById('community-cards-container');
      expect(communityCardsContainer.innerHTML).toContain('No community cards dealt yet');
    });
  });

  describe('updatePlayersDisplay method', () => {
    test('displays players correctly', () => {
      const gameState = {
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
          }
        ],
        table: { communityCards: [] },
        betting: { currentPlayer: 'player1' },
        pots: { total: 50 }
      };

      uiManager.updatePlayersDisplay(gameState);
      
      const playersGrid = document.getElementById('players-grid');
      const playerElements = playersGrid.querySelectorAll('.player-state');
      
      expect(playerElements.length).toBe(1);
      
      const playerElement = playerElements[0];
      expect(playerElement.classList.contains('current-player')).toBe(true);
      expect(playerElement.querySelector('.player-name').textContent).toBe('Alice');
      
      const playerCards = playerElement.querySelectorAll('.card');
      expect(playerCards.length).toBe(2);
    });

    test('displays no players message when empty', () => {
      const gameState = {
        players: [],
        table: { communityCards: [] },
        betting: {},
        pots: { total: 0 }
      };

      uiManager.updatePlayersDisplay(gameState);
      
      const playersGrid = document.getElementById('players-grid');
      expect(playersGrid.innerHTML).toContain('No players in game');
    });
  });

  describe('createCardElement method', () => {
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

  describe('HTML escaping methods', () => {
    test('escapeHtmlAttribute escapes dangerous characters', () => {
      const dangerous = '<script>alert("xss")</script>';
      const escaped = uiManager.escapeHtmlAttribute(dangerous);
      
      expect(escaped).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      expect(escaped).not.toContain('<script>');
      expect(escaped).not.toContain('</script>');
    });

    test('escapeHtml escapes dangerous characters', () => {
      const dangerous = '<img src="x" onerror="alert(\'xss\')">';
      const escaped = uiManager.escapeHtml(dangerous);
      
      expect(escaped).toContain('&lt;');
      expect(escaped).toContain('&gt;');
      expect(escaped).not.toContain('<img');
    });
  });
});