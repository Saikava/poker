const {
  PokerEngineError,
  InvalidInputError,
  InvalidActionError,
  InsufficientChipsError,
  GameStateError,
  PlayerNotFoundError,
  DeckError,
  HandEvaluationError,
  BettingError,
  PotManagementError,
  ConfigurationError
} = require('../../src/errors/PokerErrors');

describe('PokerErrors', () => {
  describe('PokerEngineError (Base Class)', () => {
    test('should create error with message and details', () => {
      const details = { playerId: 'player1', action: 'fold' };
      const error = new PokerEngineError('Test error message', details);

      expect(error.message).toBe('Test error message');
      expect(error.name).toBe('PokerEngineError');
      expect(error.details).toEqual(details);
      expect(error.timestamp).toBeDefined();
      expect(error instanceof Error).toBe(true);
    });

    test('should create error without details', () => {
      const error = new PokerEngineError('Test error message');

      expect(error.message).toBe('Test error message');
      expect(error.details).toBeNull();
    });

    test('should format error response correctly', () => {
      const details = { playerId: 'player1' };
      const error = new PokerEngineError('Test error', details);
      const response = error.toResponse();

      expect(response).toEqual({
        success: false,
        error: {
          type: 'PokerEngineError',
          message: 'Test error',
          details: details,
          timestamp: error.timestamp
        }
      });
    });

    test('should maintain proper stack trace', () => {
      const error = new PokerEngineError('Test error');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('PokerEngineError');
    });
  });

  describe('InvalidInputError', () => {
    test('should create InvalidInputError with correct name', () => {
      const error = new InvalidInputError('Invalid input');
      
      expect(error.name).toBe('InvalidInputError');
      expect(error.message).toBe('Invalid input');
      expect(error instanceof PokerEngineError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    test('should format response correctly', () => {
      const details = { provided: null, expected: 'string' };
      const error = new InvalidInputError('Input is required', details);
      const response = error.toResponse();

      expect(response.error.type).toBe('InvalidInputError');
      expect(response.error.message).toBe('Input is required');
      expect(response.error.details).toEqual(details);
    });
  });

  describe('InvalidActionError', () => {
    test('should create InvalidActionError with correct name', () => {
      const error = new InvalidActionError('Invalid action');
      
      expect(error.name).toBe('InvalidActionError');
      expect(error.message).toBe('Invalid action');
      expect(error instanceof PokerEngineError).toBe(true);
    });
  });

  describe('InsufficientChipsError', () => {
    test('should create InsufficientChipsError with correct name', () => {
      const error = new InsufficientChipsError('Not enough chips');
      
      expect(error.name).toBe('InsufficientChipsError');
      expect(error.message).toBe('Not enough chips');
      expect(error instanceof PokerEngineError).toBe(true);
    });

    test('should include chip details', () => {
      const details = { required: 100, available: 50 };
      const error = new InsufficientChipsError('Not enough chips', details);
      
      expect(error.details).toEqual(details);
    });
  });

  describe('GameStateError', () => {
    test('should create GameStateError with correct name', () => {
      const error = new GameStateError('Invalid game state');
      
      expect(error.name).toBe('GameStateError');
      expect(error.message).toBe('Invalid game state');
      expect(error instanceof PokerEngineError).toBe(true);
    });
  });

  describe('PlayerNotFoundError', () => {
    test('should create PlayerNotFoundError with correct name', () => {
      const error = new PlayerNotFoundError('Player not found');
      
      expect(error.name).toBe('PlayerNotFoundError');
      expect(error.message).toBe('Player not found');
      expect(error instanceof PokerEngineError).toBe(true);
    });

    test('should include player details', () => {
      const details = { playerId: 'player1', availablePlayers: ['player2', 'player3'] };
      const error = new PlayerNotFoundError('Player not found', details);
      
      expect(error.details).toEqual(details);
    });
  });

  describe('DeckError', () => {
    test('should create DeckError with correct name', () => {
      const error = new DeckError('Deck operation failed');
      
      expect(error.name).toBe('DeckError');
      expect(error.message).toBe('Deck operation failed');
      expect(error instanceof PokerEngineError).toBe(true);
    });
  });

  describe('HandEvaluationError', () => {
    test('should create HandEvaluationError with correct name', () => {
      const error = new HandEvaluationError('Hand evaluation failed');
      
      expect(error.name).toBe('HandEvaluationError');
      expect(error.message).toBe('Hand evaluation failed');
      expect(error instanceof PokerEngineError).toBe(true);
    });
  });

  describe('BettingError', () => {
    test('should create BettingError with correct name', () => {
      const error = new BettingError('Betting operation failed');
      
      expect(error.name).toBe('BettingError');
      expect(error.message).toBe('Betting operation failed');
      expect(error instanceof PokerEngineError).toBe(true);
    });
  });

  describe('PotManagementError', () => {
    test('should create PotManagementError with correct name', () => {
      const error = new PotManagementError('Pot management failed');
      
      expect(error.name).toBe('PotManagementError');
      expect(error.message).toBe('Pot management failed');
      expect(error instanceof PokerEngineError).toBe(true);
    });
  });

  describe('ConfigurationError', () => {
    test('should create ConfigurationError with correct name', () => {
      const error = new ConfigurationError('Invalid configuration');
      
      expect(error.name).toBe('ConfigurationError');
      expect(error.message).toBe('Invalid configuration');
      expect(error instanceof PokerEngineError).toBe(true);
    });

    test('should include configuration details', () => {
      const details = { smallBlind: -5, bigBlind: 10 };
      const error = new ConfigurationError('Invalid blind values', details);
      
      expect(error.details).toEqual(details);
    });
  });

  describe('Error Inheritance Chain', () => {
    test('all custom errors should inherit from PokerEngineError', () => {
      const errors = [
        new InvalidInputError('test'),
        new InvalidActionError('test'),
        new InsufficientChipsError('test'),
        new GameStateError('test'),
        new PlayerNotFoundError('test'),
        new DeckError('test'),
        new HandEvaluationError('test'),
        new BettingError('test'),
        new PotManagementError('test'),
        new ConfigurationError('test')
      ];

      errors.forEach(error => {
        expect(error instanceof PokerEngineError).toBe(true);
        expect(error instanceof Error).toBe(true);
        expect(typeof error.toResponse).toBe('function');
      });
    });
  });

  describe('Error Response Format', () => {
    test('all errors should have consistent response format', () => {
      const errors = [
        new InvalidInputError('test', { field: 'value' }),
        new InvalidActionError('test', { action: 'fold' }),
        new InsufficientChipsError('test', { required: 100 }),
        new GameStateError('test', { phase: 'preflop' }),
        new PlayerNotFoundError('test', { playerId: 'player1' })
      ];

      errors.forEach(error => {
        const response = error.toResponse();
        
        expect(response).toHaveProperty('success', false);
        expect(response).toHaveProperty('error');
        expect(response.error).toHaveProperty('type');
        expect(response.error).toHaveProperty('message');
        expect(response.error).toHaveProperty('details');
        expect(response.error).toHaveProperty('timestamp');
        
        expect(typeof response.error.type).toBe('string');
        expect(typeof response.error.message).toBe('string');
        expect(typeof response.error.timestamp).toBe('string');
      });
    });
  });
});