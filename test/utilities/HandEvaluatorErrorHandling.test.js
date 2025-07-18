const { HandEvaluator } = require('../../src/utilities/HandEvaluator');
const Card = require('../../src/models/Card');
const { 
  InvalidInputError, 
  HandEvaluationError 
} = require('../../src/errors/PokerErrors');

describe('HandEvaluator Error Handling', () => {
  describe('evaluateHand method error handling', () => {
    test('should throw InvalidInputError for null cards', () => {
      expect(() => HandEvaluator.evaluateHand(null)).toThrow(InvalidInputError);
      expect(() => HandEvaluator.evaluateHand(null)).toThrow('Cards parameter is required');
    });

    test('should throw InvalidInputError for undefined cards', () => {
      expect(() => HandEvaluator.evaluateHand(undefined)).toThrow(InvalidInputError);
      expect(() => HandEvaluator.evaluateHand(undefined)).toThrow('Cards parameter is required');
    });

    test('should throw InvalidInputError for non-array cards', () => {
      expect(() => HandEvaluator.evaluateHand('not an array')).toThrow(InvalidInputError);
      expect(() => HandEvaluator.evaluateHand('not an array')).toThrow('Cards must be an array');
    });

    test('should throw InvalidInputError for insufficient cards', () => {
      const cards = [
        new Card('hearts', '2'),
        new Card('diamonds', '3'),
        new Card('clubs', '4')
      ];

      expect(() => HandEvaluator.evaluateHand(cards)).toThrow(InvalidInputError);
      expect(() => HandEvaluator.evaluateHand(cards)).toThrow('At least 5 cards required for hand evaluation');
    });

    test('should include proper error details for null cards', () => {
      try {
        HandEvaluator.evaluateHand(null);
        fail('Expected InvalidInputError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual({
          provided: null
        });
      }
    });

    test('should include proper error details for non-array cards', () => {
      try {
        HandEvaluator.evaluateHand('invalid');
        fail('Expected InvalidInputError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual({
          provided: 'invalid',
          type: 'string'
        });
      }
    });

    test('should include proper error details for insufficient cards', () => {
      const cards = [new Card('hearts', '2'), new Card('diamonds', '3')];
      
      try {
        HandEvaluator.evaluateHand(cards);
        fail('Expected InvalidInputError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual({
          provided: 2,
          minimum: 5
        });
      }
    });

    test('should throw InvalidInputError for invalid card objects', () => {
      const cards = [
        new Card('hearts', '2'),
        new Card('diamonds', '3'),
        new Card('clubs', '4'),
        new Card('spades', '5'),
        { invalid: 'card' } // Invalid card object
      ];

      expect(() => HandEvaluator.evaluateHand(cards)).toThrow(InvalidInputError);
      expect(() => HandEvaluator.evaluateHand(cards)).toThrow('Invalid card at index 4');
    });

    test('should include proper error details for invalid card objects', () => {
      const invalidCard = { invalid: 'card' };
      const cards = [
        new Card('hearts', '2'),
        new Card('diamonds', '3'),
        new Card('clubs', '4'),
        new Card('spades', '5'),
        invalidCard
      ];

      try {
        HandEvaluator.evaluateHand(cards);
        fail('Expected InvalidInputError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual({
          cardIndex: 4,
          card: invalidCard,
          expectedProperties: ['suit', 'rank', 'value']
        });
      }
    });

    test('should throw InvalidInputError for null card in array', () => {
      const cards = [
        new Card('hearts', '2'),
        new Card('diamonds', '3'),
        new Card('clubs', '4'),
        new Card('spades', '5'),
        null
      ];

      expect(() => HandEvaluator.evaluateHand(cards)).toThrow(InvalidInputError);
      expect(() => HandEvaluator.evaluateHand(cards)).toThrow('Invalid card at index 4');
    });

    test('should throw InvalidInputError for card missing properties', () => {
      const cards = [
        new Card('hearts', '2'),
        new Card('diamonds', '3'),
        new Card('clubs', '4'),
        new Card('spades', '5'),
        { suit: 'hearts' } // Missing rank and value
      ];

      expect(() => HandEvaluator.evaluateHand(cards)).toThrow(InvalidInputError);
      expect(() => HandEvaluator.evaluateHand(cards)).toThrow('Invalid card at index 4');
    });

    test('should successfully evaluate valid hand', () => {
      const cards = [
        new Card('hearts', '2'),
        new Card('diamonds', '3'),
        new Card('clubs', '4'),
        new Card('spades', '5'),
        new Card('hearts', '6')
      ];

      expect(() => HandEvaluator.evaluateHand(cards)).not.toThrow();
      const result = HandEvaluator.evaluateHand(cards);
      expect(result).toBeDefined();
      expect(result.handType).toBeDefined();
      expect(result.strength).toBeDefined();
      expect(result.cards).toBeDefined();
    });

    test('should successfully evaluate hand with more than 5 cards', () => {
      const cards = [
        new Card('hearts', '2'),
        new Card('diamonds', '3'),
        new Card('clubs', '4'),
        new Card('spades', '5'),
        new Card('hearts', '6'),
        new Card('diamonds', '7'),
        new Card('clubs', '8')
      ];

      expect(() => HandEvaluator.evaluateHand(cards)).not.toThrow();
      const result = HandEvaluator.evaluateHand(cards);
      expect(result).toBeDefined();
      expect(result.cards).toHaveLength(5); // Should return best 5-card hand
    });

    test('should handle HandEvaluationError for internal evaluation failures', () => {
      // Create a scenario that might cause internal evaluation to fail
      // by mocking a method to throw an error
      const originalCheckRoyalFlush = HandEvaluator._checkRoyalFlush;
      HandEvaluator._checkRoyalFlush = () => {
        throw new Error('Internal evaluation error');
      };

      const cards = [
        new Card('hearts', '2'),
        new Card('diamonds', '3'),
        new Card('clubs', '4'),
        new Card('spades', '5'),
        new Card('hearts', '6')
      ];

      try {
        expect(() => HandEvaluator.evaluateHand(cards)).toThrow(HandEvaluationError);
        expect(() => HandEvaluator.evaluateHand(cards)).toThrow('Failed to evaluate hand');
      } finally {
        // Restore original method
        HandEvaluator._checkRoyalFlush = originalCheckRoyalFlush;
      }
    });

    test('should include proper error details for HandEvaluationError', () => {
      // Mock internal method to throw error
      const originalCheckRoyalFlush = HandEvaluator._checkRoyalFlush;
      HandEvaluator._checkRoyalFlush = () => {
        throw new Error('Internal evaluation error');
      };

      const cards = [
        new Card('hearts', '2'),
        new Card('diamonds', '3'),
        new Card('clubs', '4'),
        new Card('spades', '5'),
        new Card('hearts', '6')
      ];

      try {
        HandEvaluator.evaluateHand(cards);
        fail('Expected HandEvaluationError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(HandEvaluationError);
        expect(error.details).toEqual({
          originalError: 'Internal evaluation error',
          cardsCount: 5
        });
      } finally {
        // Restore original method
        HandEvaluator._checkRoyalFlush = originalCheckRoyalFlush;
      }
    });
  });

  describe('error inheritance and formatting', () => {
    test('HandEvaluator errors should inherit from PokerEngineError', () => {
      try {
        HandEvaluator.evaluateHand(null);
        fail('Expected InvalidInputError to be thrown');
      } catch (error) {
        expect(error.name).toBe('InvalidInputError');
        expect(typeof error.toResponse).toBe('function');
        expect(error.timestamp).toBeDefined();
      }
    });

    test('should format error responses correctly', () => {
      try {
        HandEvaluator.evaluateHand([]);
        fail('Expected InvalidInputError to be thrown');
      } catch (error) {
        const response = error.toResponse();
        
        expect(response).toEqual({
          success: false,
          error: {
            type: 'InvalidInputError',
            message: 'At least 5 cards required for hand evaluation',
            details: {
              provided: 0,
              minimum: 5
            },
            timestamp: error.timestamp
          }
        });
      }
    });

    test('should maintain proper stack trace', () => {
      try {
        HandEvaluator.evaluateHand(null);
        fail('Expected InvalidInputError to be thrown');
      } catch (error) {
        expect(error.stack).toBeDefined();
        expect(error.stack).toContain('InvalidInputError');
      }
    });
  });

  describe('edge cases', () => {
    test('should handle exactly 5 cards', () => {
      const cards = [
        new Card('hearts', '2'),
        new Card('diamonds', '3'),
        new Card('clubs', '4'),
        new Card('spades', '5'),
        new Card('hearts', '6')
      ];

      expect(() => HandEvaluator.evaluateHand(cards)).not.toThrow();
    });

    test('should handle maximum cards (7 for Texas Hold\'em)', () => {
      const cards = [
        new Card('hearts', '2'),
        new Card('diamonds', '3'),
        new Card('clubs', '4'),
        new Card('spades', '5'),
        new Card('hearts', '6'),
        new Card('diamonds', '7'),
        new Card('clubs', '8')
      ];

      expect(() => HandEvaluator.evaluateHand(cards)).not.toThrow();
    });

    test('should handle cards with all required properties', () => {
      const validCard = {
        suit: 'hearts',
        rank: '2',
        value: 2
      };

      const cards = [validCard, validCard, validCard, validCard, validCard];

      expect(() => HandEvaluator.evaluateHand(cards)).not.toThrow();
    });

    test('should detect missing suit property', () => {
      const invalidCard = {
        rank: '2',
        value: 2
        // Missing suit
      };

      const cards = [
        new Card('hearts', '2'),
        new Card('diamonds', '3'),
        new Card('clubs', '4'),
        new Card('spades', '5'),
        invalidCard
      ];

      expect(() => HandEvaluator.evaluateHand(cards)).toThrow(InvalidInputError);
    });

    test('should detect missing rank property', () => {
      const invalidCard = {
        suit: 'hearts',
        value: 2
        // Missing rank
      };

      const cards = [
        new Card('hearts', '2'),
        new Card('diamonds', '3'),
        new Card('clubs', '4'),
        new Card('spades', '5'),
        invalidCard
      ];

      expect(() => HandEvaluator.evaluateHand(cards)).toThrow(InvalidInputError);
    });

    test('should detect missing value property', () => {
      const invalidCard = {
        suit: 'hearts',
        rank: '2'
        // Missing value
      };

      const cards = [
        new Card('hearts', '2'),
        new Card('diamonds', '3'),
        new Card('clubs', '4'),
        new Card('spades', '5'),
        invalidCard
      ];

      expect(() => HandEvaluator.evaluateHand(cards)).toThrow(InvalidInputError);
    });
  });
});