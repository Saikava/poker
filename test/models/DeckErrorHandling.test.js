const Deck = require('../../src/models/Deck');
const { DeckError } = require('../../src/errors/PokerErrors');

describe('Deck Error Handling', () => {
  let deck;

  beforeEach(() => {
    deck = new Deck();
  });

  describe('deal method error handling', () => {
    test('should throw DeckError when dealing from empty deck', () => {
      // Deal all cards to empty the deck
      while (!deck.isEmpty()) {
        deck.deal();
      }

      expect(() => deck.deal()).toThrow(DeckError);
      expect(() => deck.deal()).toThrow('Cannot deal from empty deck');
    });

    test('should include proper error details when dealing from empty deck', () => {
      // Deal all cards to empty the deck
      while (!deck.isEmpty()) {
        deck.deal();
      }

      try {
        deck.deal();
        fail('Expected DeckError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(DeckError);
        expect(error.details).toEqual({
          remainingCards: 0,
          dealtCards: 52
        });
      }
    });

    test('should format error response correctly', () => {
      // Deal all cards to empty the deck
      while (!deck.isEmpty()) {
        deck.deal();
      }

      try {
        deck.deal();
        fail('Expected DeckError to be thrown');
      } catch (error) {
        const response = error.toResponse();
        
        expect(response).toEqual({
          success: false,
          error: {
            type: 'DeckError',
            message: 'Cannot deal from empty deck',
            details: {
              remainingCards: 0,
              dealtCards: 52
            },
            timestamp: error.timestamp
          }
        });
      }
    });
  });

  describe('dealCards method error handling', () => {
    test('should throw DeckError for non-integer count', () => {
      expect(() => deck.dealCards('not a number')).toThrow(DeckError);
      expect(() => deck.dealCards('not a number')).toThrow('Card count must be an integer');
    });

    test('should throw DeckError for float count', () => {
      expect(() => deck.dealCards(2.5)).toThrow(DeckError);
      expect(() => deck.dealCards(2.5)).toThrow('Card count must be an integer');
    });

    test('should throw DeckError for negative count', () => {
      expect(() => deck.dealCards(-1)).toThrow(DeckError);
      expect(() => deck.dealCards(-1)).toThrow('Card count cannot be negative');
    });

    test('should throw DeckError when requesting more cards than available', () => {
      expect(() => deck.dealCards(53)).toThrow(DeckError);
      expect(() => deck.dealCards(53)).toThrow('Cannot deal 53 cards, only 52 remaining');
    });

    test('should include proper error details for invalid count type', () => {
      try {
        deck.dealCards('invalid');
        fail('Expected DeckError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(DeckError);
        expect(error.details).toEqual({
          provided: 'invalid',
          type: 'string'
        });
      }
    });

    test('should include proper error details for negative count', () => {
      try {
        deck.dealCards(-5);
        fail('Expected DeckError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(DeckError);
        expect(error.details).toEqual({
          provided: -5
        });
      }
    });

    test('should include proper error details for insufficient cards', () => {
      // Deal some cards first
      deck.dealCards(10);
      
      try {
        deck.dealCards(50); // Only 42 remaining
        fail('Expected DeckError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(DeckError);
        expect(error.details).toEqual({
          requested: 50,
          available: 42
        });
      }
    });

    test('should allow dealing zero cards', () => {
      expect(() => deck.dealCards(0)).not.toThrow();
      const result = deck.dealCards(0);
      expect(result).toEqual([]);
    });

    test('should successfully deal valid number of cards', () => {
      const cards = deck.dealCards(5);
      expect(cards).toHaveLength(5);
      expect(deck.remainingCards()).toBe(47);
    });
  });

  describe('error inheritance and formatting', () => {
    test('DeckError should inherit from PokerEngineError', () => {
      try {
        deck.dealCards(-1);
        fail('Expected DeckError to be thrown');
      } catch (error) {
        expect(error.name).toBe('DeckError');
        expect(typeof error.toResponse).toBe('function');
        expect(error.timestamp).toBeDefined();
      }
    });

    test('should maintain proper stack trace', () => {
      try {
        deck.dealCards(-1);
        fail('Expected DeckError to be thrown');
      } catch (error) {
        expect(error.stack).toBeDefined();
        expect(error.stack).toContain('DeckError');
      }
    });
  });

  describe('edge cases', () => {
    test('should handle dealing exact remaining cards', () => {
      deck.dealCards(50); // Deal 50, leaving 2
      expect(() => deck.dealCards(2)).not.toThrow();
      expect(deck.isEmpty()).toBe(true);
    });

    test('should handle multiple small deals until empty', () => {
      while (deck.remainingCards() > 0) {
        expect(() => deck.deal()).not.toThrow();
      }
      expect(() => deck.deal()).toThrow(DeckError);
    });

    test('should reset error state after deck reset', () => {
      // Empty the deck
      deck.dealCards(52);
      expect(() => deck.deal()).toThrow(DeckError);
      
      // Reset and verify it works again
      deck.reset();
      expect(() => deck.deal()).not.toThrow();
      expect(deck.remainingCards()).toBe(51);
    });
  });
});