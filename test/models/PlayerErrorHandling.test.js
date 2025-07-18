const Player = require('../../src/models/Player');
const { 
  InvalidInputError, 
  InsufficientChipsError, 
  InvalidActionError 
} = require('../../src/errors/PokerErrors');

describe('Player Error Handling', () => {
  let player;

  beforeEach(() => {
    player = new Player('player1', 'John Doe', 1000, 0);
  });

  describe('bet method error handling', () => {
    test('should throw InvalidInputError for non-integer amount', () => {
      expect(() => player.bet('not a number')).toThrow(InvalidInputError);
      expect(() => player.bet('not a number')).toThrow('Bet amount must be an integer');
    });

    test('should throw InvalidInputError for float amount', () => {
      expect(() => player.bet(100.5)).toThrow(InvalidInputError);
      expect(() => player.bet(100.5)).toThrow('Bet amount must be an integer');
    });

    test('should throw InvalidInputError for non-positive amount', () => {
      expect(() => player.bet(0)).toThrow(InvalidInputError);
      expect(() => player.bet(0)).toThrow('Bet amount must be positive');
    });

    test('should throw InvalidInputError for negative amount', () => {
      expect(() => player.bet(-100)).toThrow(InvalidInputError);
      expect(() => player.bet(-100)).toThrow('Bet amount must be positive');
    });

    test('should throw InsufficientChipsError when betting more than available chips', () => {
      expect(() => player.bet(1500)).toThrow(InsufficientChipsError);
      expect(() => player.bet(1500)).toThrow('Insufficient chips for bet');
    });

    test('should include proper error details for invalid amount type', () => {
      try {
        player.bet('invalid');
        fail('Expected InvalidInputError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual({
          provided: 'invalid',
          type: 'string',
          playerId: 'player1'
        });
      }
    });

    test('should include proper error details for insufficient chips', () => {
      try {
        player.bet(1500);
        fail('Expected InsufficientChipsError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(InsufficientChipsError);
        expect(error.details).toEqual({
          required: 1500,
          available: 1000,
          playerId: 'player1'
        });
      }
    });

    test('should successfully bet valid amount', () => {
      expect(() => player.bet(100)).not.toThrow();
      expect(player.chips).toBe(900);
      expect(player.currentBet).toBe(100);
    });

    test('should set status to all-in when betting all chips', () => {
      player.bet(1000);
      expect(player.status).toBe('all-in');
      expect(player.chips).toBe(0);
    });
  });

  describe('fold method error handling', () => {
    test('should throw InvalidActionError when already folded', () => {
      player.fold();
      expect(() => player.fold()).toThrow(InvalidActionError);
      expect(() => player.fold()).toThrow('Player cannot fold in current status');
    });

    test('should throw InvalidActionError when eliminated', () => {
      player.eliminate();
      expect(() => player.fold()).toThrow(InvalidActionError);
      expect(() => player.fold()).toThrow('Player cannot fold in current status');
    });

    test('should include proper error details for invalid fold', () => {
      player.fold();
      
      try {
        player.fold();
        fail('Expected InvalidActionError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidActionError);
        expect(error.details).toEqual({
          currentStatus: 'folded',
          playerId: 'player1'
        });
      }
    });

    test('should successfully fold when active', () => {
      expect(() => player.fold()).not.toThrow();
      expect(player.status).toBe('folded');
      expect(player.cards).toEqual([]);
    });

    test('should successfully fold when all-in', () => {
      player.bet(1000); // Go all-in
      expect(() => player.fold()).not.toThrow();
      expect(player.status).toBe('folded');
    });
  });

  describe('check method error handling', () => {
    test('should throw InvalidActionError when not active', () => {
      player.fold();
      expect(() => player.check()).toThrow(InvalidActionError);
      expect(() => player.check()).toThrow('Player cannot check in current status');
    });

    test('should throw InvalidActionError when all-in', () => {
      player.bet(1000); // Go all-in
      expect(() => player.check()).toThrow(InvalidActionError);
      expect(() => player.check()).toThrow('Player cannot check in current status');
    });

    test('should include proper error details for invalid check', () => {
      player.fold();
      
      try {
        player.check();
        fail('Expected InvalidActionError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidActionError);
        expect(error.details).toEqual({
          currentStatus: 'folded',
          playerId: 'player1',
          requiredStatus: 'active'
        });
      }
    });

    test('should successfully check when active', () => {
      expect(() => player.check()).not.toThrow();
      expect(player.status).toBe('active');
    });
  });

  describe('raise method error handling', () => {
    test('should throw InvalidInputError for non-integer raise amount', () => {
      expect(() => player.raise('not a number', 0)).toThrow(InvalidInputError);
      expect(() => player.raise('not a number', 0)).toThrow('Raise amount must be an integer');
    });

    test('should throw InvalidInputError for float raise amount', () => {
      expect(() => player.raise(100.5, 0)).toThrow(InvalidInputError);
      expect(() => player.raise(100.5, 0)).toThrow('Raise amount must be an integer');
    });

    test('should throw InvalidInputError for non-positive raise amount', () => {
      expect(() => player.raise(0, 0)).toThrow(InvalidInputError);
      expect(() => player.raise(0, 0)).toThrow('Raise amount must be positive');
    });

    test('should throw InvalidInputError for negative raise amount', () => {
      expect(() => player.raise(-100, 0)).toThrow(InvalidInputError);
      expect(() => player.raise(-100, 0)).toThrow('Raise amount must be positive');
    });

    test('should throw InvalidInputError for non-integer call amount', () => {
      expect(() => player.raise(100, 'not a number')).toThrow(InvalidInputError);
      expect(() => player.raise(100, 'not a number')).toThrow('Call amount must be an integer');
    });

    test('should throw InvalidInputError for negative call amount', () => {
      expect(() => player.raise(100, -50)).toThrow(InvalidInputError);
      expect(() => player.raise(100, -50)).toThrow('Call amount cannot be negative');
    });

    test('should throw InsufficientChipsError when total amount exceeds chips', () => {
      expect(() => player.raise(600, 500)).toThrow(InsufficientChipsError);
      expect(() => player.raise(600, 500)).toThrow('Insufficient chips for bet');
    });

    test('should include proper error details for invalid raise amount', () => {
      try {
        player.raise('invalid', 0);
        fail('Expected InvalidInputError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual({
          provided: 'invalid',
          type: 'string',
          playerId: 'player1'
        });
      }
    });

    test('should include proper error details for invalid call amount', () => {
      try {
        player.raise(100, -50);
        fail('Expected InvalidInputError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidInputError);
        expect(error.details).toEqual({
          provided: -50,
          playerId: 'player1'
        });
      }
    });

    test('should successfully raise with valid amounts', () => {
      expect(() => player.raise(100, 50)).not.toThrow();
      expect(player.chips).toBe(850);
      expect(player.currentBet).toBe(150);
    });

    test('should successfully raise with zero call amount', () => {
      expect(() => player.raise(100, 0)).not.toThrow();
      expect(player.chips).toBe(900);
      expect(player.currentBet).toBe(100);
    });
  });

  describe('call method error handling', () => {
    test('should handle call with sufficient chips', () => {
      expect(() => player.call(100)).not.toThrow();
      expect(player.chips).toBe(900);
      expect(player.currentBet).toBe(100);
    });

    test('should handle call with insufficient chips (partial call)', () => {
      expect(() => player.call(1500)).not.toThrow();
      expect(player.chips).toBe(0);
      expect(player.currentBet).toBe(1000);
      expect(player.status).toBe('all-in');
    });

    test('should handle call with zero amount (check)', () => {
      expect(() => player.call(0)).not.toThrow();
      expect(player.chips).toBe(1000);
      expect(player.currentBet).toBe(0);
    });

    test('should handle call with negative amount (check)', () => {
      expect(() => player.call(-50)).not.toThrow();
      expect(player.chips).toBe(1000);
      expect(player.currentBet).toBe(0);
    });
  });

  describe('error inheritance and formatting', () => {
    test('all player errors should inherit from PokerEngineError', () => {
      const errorTests = [
        () => player.bet('invalid'),
        () => player.bet(2000),
        () => { player.fold(); player.fold(); },
        () => { player.fold(); player.check(); },
        () => player.raise('invalid', 0)
      ];

      errorTests.forEach(testFn => {
        try {
          testFn();
          fail('Expected error to be thrown');
        } catch (error) {
          expect(error.name).toMatch(/Error$/);
          expect(typeof error.toResponse).toBe('function');
          expect(error.timestamp).toBeDefined();
        }
      });
    });

    test('should format error responses correctly', () => {
      try {
        player.bet(2000);
        fail('Expected InsufficientChipsError to be thrown');
      } catch (error) {
        const response = error.toResponse();
        
        expect(response).toEqual({
          success: false,
          error: {
            type: 'InsufficientChipsError',
            message: 'Insufficient chips for bet',
            details: {
              required: 2000,
              available: 1000,
              playerId: 'player1'
            },
            timestamp: error.timestamp
          }
        });
      }
    });
  });

  describe('edge cases', () => {
    test('should handle betting exact chip amount', () => {
      expect(() => player.bet(1000)).not.toThrow();
      expect(player.chips).toBe(0);
      expect(player.status).toBe('all-in');
    });

    test('should handle multiple small bets', () => {
      player.bet(100);
      player.bet(200);
      expect(player.chips).toBe(700);
      expect(player.currentBet).toBe(300);
    });

    test('should maintain error state consistency', () => {
      player.fold();
      expect(player.status).toBe('folded');
      
      // All actions should fail when folded
      expect(() => player.check()).toThrow(InvalidActionError);
      expect(() => player.fold()).toThrow(InvalidActionError);
    });
  });
});