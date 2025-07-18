const Deck = require('../../src/models/Deck');
const Card = require('../../src/models/Card');

describe('Deck', () => {
  let deck;

  beforeEach(() => {
    deck = new Deck();
  });

  describe('constructor', () => {
    test('should create a deck with 52 cards', () => {
      expect(deck.remainingCards()).toBe(52);
      expect(deck.dealtCount()).toBe(0);
    });

    test('should initialize with unshuffled state', () => {
      expect(deck.getShuffledState()).toBe(false);
    });

    test('should contain all standard playing cards', () => {
      const cards = deck.getRemainingCards();
      const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
      const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
      
      expect(cards).toHaveLength(52);
      
      // Check that we have exactly one of each card
      const cardCounts = {};
      cards.forEach(card => {
        const key = `${card.suit}-${card.rank}`;
        cardCounts[key] = (cardCounts[key] || 0) + 1;
      });

      suits.forEach(suit => {
        ranks.forEach(rank => {
          const key = `${suit}-${rank}`;
          expect(cardCounts[key]).toBe(1);
        });
      });
    });

    test('should validate deck state on initialization', () => {
      expect(deck.validateDeckState()).toBe(true);
    });
  });

  describe('shuffle', () => {
    test('should mark deck as shuffled', () => {
      deck.shuffle();
      expect(deck.getShuffledState()).toBe(true);
    });

    test('should return the deck instance for chaining', () => {
      const result = deck.shuffle();
      expect(result).toBe(deck);
    });

    test('should randomize card order', () => {
      const originalOrder = deck.getRemainingCards().map(card => `${card.suit}-${card.rank}`);
      deck.shuffle();
      const shuffledOrder = deck.getRemainingCards().map(card => `${card.suit}-${card.rank}`);
      
      // It's extremely unlikely that shuffle produces the same order
      expect(shuffledOrder).not.toEqual(originalOrder);
    });

    test('should maintain all 52 cards after shuffle', () => {
      deck.shuffle();
      expect(deck.remainingCards()).toBe(52);
      expect(deck.validateDeckState()).toBe(true);
    });

    test('should produce different orders on multiple shuffles', () => {
      deck.shuffle();
      const firstShuffle = deck.getRemainingCards().map(card => `${card.suit}-${card.rank}`);
      
      deck.shuffle();
      const secondShuffle = deck.getRemainingCards().map(card => `${card.suit}-${card.rank}`);
      
      // Very unlikely to get same order twice
      expect(firstShuffle).not.toEqual(secondShuffle);
    });
  });

  describe('deal', () => {
    test('should deal a single card from the top', () => {
      const topCard = deck.getRemainingCards()[deck.remainingCards() - 1];
      const dealtCard = deck.deal();
      
      expect(dealtCard).toEqual(topCard);
      expect(deck.remainingCards()).toBe(51);
      expect(deck.dealtCount()).toBe(1);
    });

    test('should move dealt card to dealt cards array', () => {
      const dealtCard = deck.deal();
      const dealtCards = deck.getDealtCards();
      
      expect(dealtCards).toHaveLength(1);
      expect(dealtCards[0]).toEqual(dealtCard);
    });

    test('should throw error when dealing from empty deck', () => {
      // Deal all cards
      for (let i = 0; i < 52; i++) {
        deck.deal();
      }
      
      expect(() => deck.deal()).toThrow('Cannot deal from empty deck');
    });

    test('should maintain deck state validity after dealing', () => {
      deck.deal();
      expect(deck.validateDeckState()).toBe(true);
    });

    test('should deal cards in LIFO order (last in, first out)', () => {
      const originalCards = deck.getRemainingCards();
      const expectedFirstCard = originalCards[originalCards.length - 1];
      const expectedSecondCard = originalCards[originalCards.length - 2];
      
      const firstDealt = deck.deal();
      const secondDealt = deck.deal();
      
      expect(firstDealt).toEqual(expectedFirstCard);
      expect(secondDealt).toEqual(expectedSecondCard);
    });
  });

  describe('dealCards', () => {
    test('should deal multiple cards correctly', () => {
      const dealtCards = deck.dealCards(5);
      
      expect(dealtCards).toHaveLength(5);
      expect(deck.remainingCards()).toBe(47);
      expect(deck.dealtCount()).toBe(5);
    });

    test('should throw error when dealing more cards than available', () => {
      expect(() => deck.dealCards(53)).toThrow('Cannot deal 53 cards, only 52 remaining');
    });

    test('should throw error when dealing more cards than remaining', () => {
      deck.dealCards(50); // Deal 50 cards, leaving 2
      expect(() => deck.dealCards(3)).toThrow('Cannot deal 3 cards, only 2 remaining');
    });

    test('should deal cards in correct order', () => {
      const originalCards = deck.getRemainingCards();
      const expectedCards = originalCards.slice(-3).reverse(); // Last 3 cards in reverse order
      
      const dealtCards = deck.dealCards(3);
      
      expect(dealtCards).toEqual(expectedCards);
    });

    test('should handle dealing zero cards', () => {
      const dealtCards = deck.dealCards(0);
      
      expect(dealtCards).toHaveLength(0);
      expect(deck.remainingCards()).toBe(52);
      expect(deck.dealtCount()).toBe(0);
    });
  });

  describe('reset', () => {
    test('should restore deck to initial state', () => {
      // Modify deck state
      deck.shuffle();
      deck.dealCards(10);
      
      // Reset
      deck.reset();
      
      expect(deck.remainingCards()).toBe(52);
      expect(deck.dealtCount()).toBe(0);
      expect(deck.getShuffledState()).toBe(false);
    });

    test('should return the deck instance for chaining', () => {
      const result = deck.reset();
      expect(result).toBe(deck);
    });

    test('should restore all 52 unique cards', () => {
      deck.dealCards(20);
      deck.reset();
      
      expect(deck.validateDeckState()).toBe(true);
      expect(deck.remainingCards()).toBe(52);
    });

    test('should clear dealt cards array', () => {
      deck.dealCards(10);
      expect(deck.getDealtCards()).toHaveLength(10);
      
      deck.reset();
      expect(deck.getDealtCards()).toHaveLength(0);
    });
  });

  describe('remainingCards', () => {
    test('should return correct count initially', () => {
      expect(deck.remainingCards()).toBe(52);
    });

    test('should decrease as cards are dealt', () => {
      deck.deal();
      expect(deck.remainingCards()).toBe(51);
      
      deck.dealCards(5);
      expect(deck.remainingCards()).toBe(46);
    });

    test('should return zero when all cards are dealt', () => {
      deck.dealCards(52);
      expect(deck.remainingCards()).toBe(0);
    });
  });

  describe('dealtCount', () => {
    test('should return zero initially', () => {
      expect(deck.dealtCount()).toBe(0);
    });

    test('should increase as cards are dealt', () => {
      deck.deal();
      expect(deck.dealtCount()).toBe(1);
      
      deck.dealCards(5);
      expect(deck.dealtCount()).toBe(6);
    });

    test('should return 52 when all cards are dealt', () => {
      deck.dealCards(52);
      expect(deck.dealtCount()).toBe(52);
    });
  });

  describe('isEmpty', () => {
    test('should return false for new deck', () => {
      expect(deck.isEmpty()).toBe(false);
    });

    test('should return false when some cards remain', () => {
      deck.dealCards(51);
      expect(deck.isEmpty()).toBe(false);
    });

    test('should return true when all cards are dealt', () => {
      deck.dealCards(52);
      expect(deck.isEmpty()).toBe(true);
    });
  });

  describe('validateDeckState', () => {
    test('should return true for valid deck state', () => {
      expect(deck.validateDeckState()).toBe(true);
      
      deck.shuffle();
      expect(deck.validateDeckState()).toBe(true);
      
      deck.dealCards(26);
      expect(deck.validateDeckState()).toBe(true);
    });

    test('should validate after various operations', () => {
      deck.shuffle();
      deck.dealCards(10);
      deck.reset();
      deck.shuffle();
      deck.dealCards(5);
      
      expect(deck.validateDeckState()).toBe(true);
    });
  });

  describe('state tracking', () => {
    test('should track remaining and dealt cards correctly', () => {
      expect(deck.remainingCards() + deck.dealtCount()).toBe(52);
      
      deck.dealCards(20);
      expect(deck.remainingCards() + deck.dealtCount()).toBe(52);
      
      deck.dealCards(32);
      expect(deck.remainingCards() + deck.dealtCount()).toBe(52);
    });

    test('should maintain card references correctly', () => {
      const originalCard = deck.getRemainingCards()[51]; // Top card
      const dealtCard = deck.deal();
      
      expect(dealtCard).toEqual(originalCard);
      expect(deck.getDealtCards()[0]).toEqual(originalCard);
    });
  });

  describe('edge cases', () => {
    test('should handle dealing all cards one by one', () => {
      const dealtCards = [];
      
      while (!deck.isEmpty()) {
        dealtCards.push(deck.deal());
      }
      
      expect(dealtCards).toHaveLength(52);
      expect(deck.remainingCards()).toBe(0);
      expect(deck.dealtCount()).toBe(52);
      expect(deck.validateDeckState()).toBe(true);
    });

    test('should handle multiple shuffle operations', () => {
      for (let i = 0; i < 5; i++) {
        deck.shuffle();
        expect(deck.getShuffledState()).toBe(true);
        expect(deck.remainingCards()).toBe(52);
        expect(deck.validateDeckState()).toBe(true);
      }
    });

    test('should handle shuffle after dealing some cards', () => {
      deck.dealCards(10);
      deck.shuffle();
      
      expect(deck.getShuffledState()).toBe(true);
      expect(deck.remainingCards()).toBe(42);
      expect(deck.dealtCount()).toBe(10);
      expect(deck.validateDeckState()).toBe(true);
    });

    test('should handle reset after partial dealing and shuffling', () => {
      deck.shuffle();
      deck.dealCards(25);
      deck.shuffle();
      deck.dealCards(10);
      deck.reset();
      
      expect(deck.remainingCards()).toBe(52);
      expect(deck.dealtCount()).toBe(0);
      expect(deck.getShuffledState()).toBe(false);
      expect(deck.validateDeckState()).toBe(true);
    });
  });

  describe('method chaining', () => {
    test('should support chaining shuffle and reset', () => {
      const result = deck.shuffle().reset().shuffle();
      
      expect(result).toBe(deck);
      expect(deck.getShuffledState()).toBe(true);
      expect(deck.remainingCards()).toBe(52);
    });
  });
});