const ValidationUtils = require('../../src/utilities/ValidationUtils');
const {
  InvalidInputError,
  ConfigurationError,
  InvalidActionError
} = require('../../src/errors/PokerErrors');

describe('ValidationUtils', () => {
  describe('validatePlayerConfig', () => {
    test('should validate valid player configuration', () => {
      const validConfig = {
        id: 'player1',
        name: 'John Doe',
        chips: 1000
      };

      expect(() => ValidationUtils.validatePlayerConfig(validConfig)).not.toThrow();
    });

    test('should validate player config without chips', () => {
      const validConfig = {
        id: 'player1',
        name: 'John Doe'
      };

      expect(() => ValidationUtils.validatePlayerConfig(validConfig)).not.toThrow();
    });

    test('should throw InvalidInputError for null config', () => {
      expect(() => ValidationUtils.validatePlayerConfig(null))
        .toThrow(InvalidInputError);
    });

    test('should throw InvalidInputError for non-object config', () => {
      expect(() => ValidationUtils.validatePlayerConfig('not an object'))
        .toThrow(InvalidInputError);
    });

    test('should throw InvalidInputError for missing id', () => {
      const config = { name: 'John Doe' };
      
      expect(() => ValidationUtils.validatePlayerConfig(config))
        .toThrow(InvalidInputError);
    });

    test('should throw InvalidInputError for non-string id', () => {
      const config = { id: 123, name: 'John Doe' };
      
      expect(() => ValidationUtils.validatePlayerConfig(config))
        .toThrow(InvalidInputError);
    });

    test('should throw InvalidInputError for empty id', () => {
      const config = { id: '   ', name: 'John Doe' };
      
      expect(() => ValidationUtils.validatePlayerConfig(config))
        .toThrow(InvalidInputError);
    });

    test('should throw InvalidInputError for missing name', () => {
      const config = { id: 'player1' };
      
      expect(() => ValidationUtils.validatePlayerConfig(config))
        .toThrow(InvalidInputError);
    });

    test('should throw InvalidInputError for non-string name', () => {
      const config = { id: 'player1', name: 123 };
      
      expect(() => ValidationUtils.validatePlayerConfig(config))
        .toThrow(InvalidInputError);
    });

    test('should throw InvalidInputError for empty name', () => {
      const config = { id: 'player1', name: '   ' };
      
      expect(() => ValidationUtils.validatePlayerConfig(config))
        .toThrow(InvalidInputError);
    });

    test('should throw InvalidInputError for non-integer chips', () => {
      const config = { id: 'player1', name: 'John Doe', chips: 'not a number' };
      
      expect(() => ValidationUtils.validatePlayerConfig(config))
        .toThrow(InvalidInputError);
    });

    test('should throw InvalidInputError for float chips', () => {
      const config = { id: 'player1', name: 'John Doe', chips: 100.5 };
      
      expect(() => ValidationUtils.validatePlayerConfig(config))
        .toThrow(InvalidInputError);
    });

    test('should throw InvalidInputError for negative chips', () => {
      const config = { id: 'player1', name: 'John Doe', chips: -100 };
      
      expect(() => ValidationUtils.validatePlayerConfig(config))
        .toThrow(InvalidInputError);
    });

    test('should allow zero chips', () => {
      const config = { id: 'player1', name: 'John Doe', chips: 0 };
      
      expect(() => ValidationUtils.validatePlayerConfig(config)).not.toThrow();
    });
  });

  describe('validateGameConfig', () => {
    test('should validate valid game configuration', () => {
      const validConfig = {
        smallBlind: 10,
        bigBlind: 20,
        maxPlayers: 8,
        minPlayers: 2,
        startingChips: 1000
      };

      expect(() => ValidationUtils.validateGameConfig(validConfig)).not.toThrow();
    });

    test('should validate empty configuration', () => {
      expect(() => ValidationUtils.validateGameConfig({})).not.toThrow();
    });

    test('should throw ConfigurationError for null config', () => {
      expect(() => ValidationUtils.validateGameConfig(null))
        .toThrow(ConfigurationError);
    });

    test('should throw ConfigurationError for non-object config', () => {
      expect(() => ValidationUtils.validateGameConfig('not an object'))
        .toThrow(ConfigurationError);
    });

    test('should throw ConfigurationError for non-integer small blind', () => {
      const config = { smallBlind: 'not a number' };
      
      expect(() => ValidationUtils.validateGameConfig(config))
        .toThrow(ConfigurationError);
    });

    test('should throw ConfigurationError for float small blind', () => {
      const config = { smallBlind: 10.5 };
      
      expect(() => ValidationUtils.validateGameConfig(config))
        .toThrow(ConfigurationError);
    });

    test('should throw ConfigurationError for non-positive small blind', () => {
      const config = { smallBlind: 0 };
      
      expect(() => ValidationUtils.validateGameConfig(config))
        .toThrow(ConfigurationError);
    });

    test('should throw ConfigurationError for negative small blind', () => {
      const config = { smallBlind: -10 };
      
      expect(() => ValidationUtils.validateGameConfig(config))
        .toThrow(ConfigurationError);
    });

    test('should throw ConfigurationError for non-integer big blind', () => {
      const config = { bigBlind: 'not a number' };
      
      expect(() => ValidationUtils.validateGameConfig(config))
        .toThrow(ConfigurationError);
    });

    test('should throw ConfigurationError for non-positive big blind', () => {
      const config = { bigBlind: 0 };
      
      expect(() => ValidationUtils.validateGameConfig(config))
        .toThrow(ConfigurationError);
    });

    test('should throw ConfigurationError when small blind >= big blind', () => {
      const config = { smallBlind: 20, bigBlind: 20 };
      
      expect(() => ValidationUtils.validateGameConfig(config))
        .toThrow(ConfigurationError);
    });

    test('should throw ConfigurationError when small blind > big blind', () => {
      const config = { smallBlind: 30, bigBlind: 20 };
      
      expect(() => ValidationUtils.validateGameConfig(config))
        .toThrow(ConfigurationError);
    });

    test('should throw ConfigurationError for invalid max players', () => {
      const config = { maxPlayers: 1 };
      
      expect(() => ValidationUtils.validateGameConfig(config))
        .toThrow(ConfigurationError);
    });

    test('should throw ConfigurationError for too many max players', () => {
      const config = { maxPlayers: 25 };
      
      expect(() => ValidationUtils.validateGameConfig(config))
        .toThrow(ConfigurationError);
    });

    test('should throw ConfigurationError for invalid min players', () => {
      const config = { minPlayers: 1 };
      
      expect(() => ValidationUtils.validateGameConfig(config))
        .toThrow(ConfigurationError);
    });

    test('should throw ConfigurationError when min players > max players', () => {
      const config = { minPlayers: 8, maxPlayers: 6 };
      
      expect(() => ValidationUtils.validateGameConfig(config))
        .toThrow(ConfigurationError);
    });

    test('should throw ConfigurationError for non-positive starting chips', () => {
      const config = { startingChips: 0 };
      
      expect(() => ValidationUtils.validateGameConfig(config))
        .toThrow(ConfigurationError);
    });

    test('should throw ConfigurationError for non-integer starting chips', () => {
      const config = { startingChips: 100.5 };
      
      expect(() => ValidationUtils.validateGameConfig(config))
        .toThrow(ConfigurationError);
    });
  });

  describe('validateActionConfig', () => {
    test('should validate valid action configuration', () => {
      const validConfigs = [
        { playerId: 'player1', action: 'fold' },
        { playerId: 'player1', action: 'check' },
        { playerId: 'player1', action: 'call' },
        { playerId: 'player1', action: 'raise', amount: 100 }
      ];

      validConfigs.forEach(config => {
        expect(() => ValidationUtils.validateActionConfig(config)).not.toThrow();
      });
    });

    test('should throw InvalidActionError for null config', () => {
      expect(() => ValidationUtils.validateActionConfig(null))
        .toThrow(InvalidActionError);
    });

    test('should throw InvalidActionError for non-object config', () => {
      expect(() => ValidationUtils.validateActionConfig('not an object'))
        .toThrow(InvalidActionError);
    });

    test('should throw InvalidActionError for missing playerId', () => {
      const config = { action: 'fold' };
      
      expect(() => ValidationUtils.validateActionConfig(config))
        .toThrow(InvalidActionError);
    });

    test('should throw InvalidActionError for non-string playerId', () => {
      const config = { playerId: 123, action: 'fold' };
      
      expect(() => ValidationUtils.validateActionConfig(config))
        .toThrow(InvalidActionError);
    });

    test('should throw InvalidActionError for empty playerId', () => {
      const config = { playerId: '   ', action: 'fold' };
      
      expect(() => ValidationUtils.validateActionConfig(config))
        .toThrow(InvalidActionError);
    });

    test('should throw InvalidActionError for missing action', () => {
      const config = { playerId: 'player1' };
      
      expect(() => ValidationUtils.validateActionConfig(config))
        .toThrow(InvalidActionError);
    });

    test('should throw InvalidActionError for non-string action', () => {
      const config = { playerId: 'player1', action: 123 };
      
      expect(() => ValidationUtils.validateActionConfig(config))
        .toThrow(InvalidActionError);
    });

    test('should throw InvalidActionError for invalid action type', () => {
      const config = { playerId: 'player1', action: 'invalid' };
      
      expect(() => ValidationUtils.validateActionConfig(config))
        .toThrow(InvalidActionError);
    });

    test('should throw InvalidActionError for raise without amount', () => {
      const config = { playerId: 'player1', action: 'raise' };
      
      expect(() => ValidationUtils.validateActionConfig(config))
        .toThrow(InvalidActionError);
    });

    test('should throw InvalidActionError for raise with null amount', () => {
      const config = { playerId: 'player1', action: 'raise', amount: null };
      
      expect(() => ValidationUtils.validateActionConfig(config))
        .toThrow(InvalidActionError);
    });

    test('should throw InvalidActionError for raise with non-integer amount', () => {
      const config = { playerId: 'player1', action: 'raise', amount: 'not a number' };
      
      expect(() => ValidationUtils.validateActionConfig(config))
        .toThrow(InvalidActionError);
    });

    test('should throw InvalidActionError for raise with float amount', () => {
      const config = { playerId: 'player1', action: 'raise', amount: 100.5 };
      
      expect(() => ValidationUtils.validateActionConfig(config))
        .toThrow(InvalidActionError);
    });

    test('should throw InvalidActionError for raise with non-positive amount', () => {
      const config = { playerId: 'player1', action: 'raise', amount: 0 };
      
      expect(() => ValidationUtils.validateActionConfig(config))
        .toThrow(InvalidActionError);
    });

    test('should throw InvalidActionError for raise with negative amount', () => {
      const config = { playerId: 'player1', action: 'raise', amount: -100 };
      
      expect(() => ValidationUtils.validateActionConfig(config))
        .toThrow(InvalidActionError);
    });
  });

  describe('validateString', () => {
    test('should validate valid string', () => {
      expect(() => ValidationUtils.validateString('valid string', 'testParam')).not.toThrow();
    });

    test('should throw InvalidInputError for undefined value', () => {
      expect(() => ValidationUtils.validateString(undefined, 'testParam'))
        .toThrow(InvalidInputError);
    });

    test('should throw InvalidInputError for null value', () => {
      expect(() => ValidationUtils.validateString(null, 'testParam'))
        .toThrow(InvalidInputError);
    });

    test('should throw InvalidInputError for non-string value', () => {
      expect(() => ValidationUtils.validateString(123, 'testParam'))
        .toThrow(InvalidInputError);
    });

    test('should throw InvalidInputError for empty string when not allowed', () => {
      expect(() => ValidationUtils.validateString('   ', 'testParam', false))
        .toThrow(InvalidInputError);
    });

    test('should allow empty string when explicitly allowed', () => {
      expect(() => ValidationUtils.validateString('   ', 'testParam', true)).not.toThrow();
    });
  });

  describe('validatePositiveInteger', () => {
    test('should validate positive integer', () => {
      expect(() => ValidationUtils.validatePositiveInteger(5, 'testParam')).not.toThrow();
    });

    test('should validate with custom min value', () => {
      expect(() => ValidationUtils.validatePositiveInteger(10, 'testParam', 5)).not.toThrow();
    });

    test('should validate with max value', () => {
      expect(() => ValidationUtils.validatePositiveInteger(5, 'testParam', 1, 10)).not.toThrow();
    });

    test('should throw InvalidInputError for undefined value', () => {
      expect(() => ValidationUtils.validatePositiveInteger(undefined, 'testParam'))
        .toThrow(InvalidInputError);
    });

    test('should throw InvalidInputError for non-integer value', () => {
      expect(() => ValidationUtils.validatePositiveInteger(5.5, 'testParam'))
        .toThrow(InvalidInputError);
    });

    test('should throw InvalidInputError for value below minimum', () => {
      expect(() => ValidationUtils.validatePositiveInteger(0, 'testParam', 1))
        .toThrow(InvalidInputError);
    });

    test('should throw InvalidInputError for value above maximum', () => {
      expect(() => ValidationUtils.validatePositiveInteger(15, 'testParam', 1, 10))
        .toThrow(InvalidInputError);
    });
  });

  describe('validateNonNegativeInteger', () => {
    test('should validate non-negative integer', () => {
      expect(() => ValidationUtils.validateNonNegativeInteger(0, 'testParam')).not.toThrow();
      expect(() => ValidationUtils.validateNonNegativeInteger(5, 'testParam')).not.toThrow();
    });

    test('should throw InvalidInputError for negative value', () => {
      expect(() => ValidationUtils.validateNonNegativeInteger(-1, 'testParam'))
        .toThrow(InvalidInputError);
    });

    test('should throw InvalidInputError for non-integer value', () => {
      expect(() => ValidationUtils.validateNonNegativeInteger(5.5, 'testParam'))
        .toThrow(InvalidInputError);
    });
  });

  describe('validateArray', () => {
    test('should validate valid array', () => {
      expect(() => ValidationUtils.validateArray([1, 2, 3], 'testParam')).not.toThrow();
    });

    test('should validate empty array when allowed', () => {
      expect(() => ValidationUtils.validateArray([], 'testParam', 0)).not.toThrow();
    });

    test('should throw InvalidInputError for non-array value', () => {
      expect(() => ValidationUtils.validateArray('not an array', 'testParam'))
        .toThrow(InvalidInputError);
    });

    test('should throw InvalidInputError for array below minimum length', () => {
      expect(() => ValidationUtils.validateArray([1], 'testParam', 2))
        .toThrow(InvalidInputError);
    });

    test('should throw InvalidInputError for array above maximum length', () => {
      expect(() => ValidationUtils.validateArray([1, 2, 3, 4], 'testParam', 0, 3))
        .toThrow(InvalidInputError);
    });
  });
});