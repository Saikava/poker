const BettingManager = require('../../src/managers/BettingManager');
const Player = require('../../src/models/Player');

describe('BettingManager', () => {
  let bettingManager;
  let players;

  beforeEach(() => {
    bettingManager = new BettingManager();
    players = [
      new Player('player1', 'Alice', 1000, 0),
      new Player('player2', 'Bob', 1000, 1),
      new Player('player3', 'Charlie', 1000, 2)
    ];
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(bettingManager.currentBet).toBe(0);
      expect(bettingManager.minRaise).toBe(0);
      expect(bettingManager.bettingRound).toBe(0);
      expect(bettingManager.bettingComplete).toBe(false);
    });
  });

  describe('startBettingRound', () => {
    test('should initialize new betting round', () => {
      bettingManager.startBettingRound(1, 20);
      
      expect(bettingManager.bettingRound).toBe(1);
      expect(bettingManager.currentBet).toBe(0);
      expect(bettingManager.minRaise).toBe(20);
      expect(bettingManager.playersActed.size).toBe(0);
      expect(bettingManager.bettingComplete).toBe(false);
    });

    test('should reset previous round state', () => {
      bettingManager.playersActed.add('player1');
      bettingManager.currentBet = 100;
      bettingManager.bettingComplete = true;

      bettingManager.startBettingRound(2, 50);

      expect(bettingManager.currentBet).toBe(0);
      expect(bettingManager.playersActed.size).toBe(0);
      expect(bettingManager.bettingComplete).toBe(false);
    });
  });

  describe('processAction', () => {
    beforeEach(() => {
      bettingManager.startBettingRound(0, 20);
    });

    test('should process fold action', () => {
      const result = bettingManager.processAction('player1', 'fold');
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('fold');
      expect(result.amount).toBe(0);
      expect(bettingManager.playersActed.has('player1')).toBe(true);
    });

    test('should process check action when no bet', () => {
      const result = bettingManager.processAction('player1', 'check');
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('check');
      expect(result.amount).toBe(0);
    });

    test('should reject check when there is a bet to call', () => {
      bettingManager.currentBet = 50;
      
      expect(() => {
        bettingManager.processAction('player1', 'check', 0, 0);
      }).toThrow('Cannot check when there is a bet to call');
    });

    test('should process call action', () => {
      bettingManager.currentBet = 50;
      const result = bettingManager.processAction('player1', 'call', 0, 0);
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('call');
      expect(result.amount).toBe(50);
    });

    test('should reject call when no amount to call', () => {
      expect(() => {
        bettingManager.processAction('player1', 'call', 0, 0);
      }).toThrow('No amount to call');
    });

    test('should process raise action', () => {
      const result = bettingManager.processAction('player1', 'raise', 50, 0);
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('raise');
      expect(result.amount).toBe(50);
      expect(result.newCurrentBet).toBe(50);
      expect(result.newMinRaise).toBe(50);
      expect(bettingManager.lastAggressorId).toBe('player1');
    });

    test('should process raise over existing bet', () => {
      bettingManager.currentBet = 30;
      const result = bettingManager.processAction('player1', 'raise', 50, 0);
      
      expect(result.amount).toBe(80); // 30 to call + 50 raise
      expect(result.newCurrentBet).toBe(80);
      expect(result.newMinRaise).toBe(50);
    });

    test('should reject raise below minimum', () => {
      bettingManager.minRaise = 50;
      
      expect(() => {
        bettingManager.processAction('player1', 'raise', 25, 0);
      }).toThrow('Raise amount must be at least 50');
    });

    test('should reset players acted on raise', () => {
      bettingManager.playersActed.add('player2');
      bettingManager.playersActed.add('player3');
      
      bettingManager.processAction('player1', 'raise', 50, 0);
      
      expect(bettingManager.playersActed.size).toBe(1);
      expect(bettingManager.playersActed.has('player1')).toBe(true);
    });

    test('should reject action when betting is complete', () => {
      bettingManager.bettingComplete = true;
      
      expect(() => {
        bettingManager.processAction('player1', 'check');
      }).toThrow('Betting round is already complete');
    });
  });

  describe('isBettingComplete', () => {
    beforeEach(() => {
      bettingManager.startBettingRound(0, 20);
    });

    test('should return false when players can still act', () => {
      expect(bettingManager.isBettingComplete(players)).toBe(false);
    });

    test('should return true when only one player remains', () => {
      players[1].status = 'folded';
      players[2].status = 'folded';
      
      expect(bettingManager.isBettingComplete(players)).toBe(true);
    });

    test('should return true when all players have matched the bet', () => {
      bettingManager.currentBet = 50;
      players.forEach(player => {
        player.currentBet = 50;
        bettingManager.playersActed.add(player.id);
      });
      
      expect(bettingManager.isBettingComplete(players)).toBe(true);
    });

    test('should return true when no players can act', () => {
      players[0].status = 'all-in';
      players[1].status = 'folded';
      players[2].status = 'all-in';
      
      expect(bettingManager.isBettingComplete(players)).toBe(true);
    });

    test('should handle players with different bet amounts', () => {
      bettingManager.currentBet = 100;
      players[0].currentBet = 100;
      players[1].currentBet = 50; // Still needs to act
      players[2].currentBet = 100;
      
      bettingManager.playersActed.add('player1');
      bettingManager.playersActed.add('player3');
      
      expect(bettingManager.isBettingComplete(players)).toBe(false);
    });
  });

  describe('getNextPlayerToAct', () => {
    beforeEach(() => {
      bettingManager.startBettingRound(0, 20);
      bettingManager.currentBet = 50;
    });

    test('should return first player who can act when no current player', () => {
      const nextPlayer = bettingManager.getNextPlayerToAct(players);
      expect(nextPlayer.id).toBe('player1');
    });

    test('should return next player in turn order', () => {
      const nextPlayer = bettingManager.getNextPlayerToAct(players, 'player1');
      expect(nextPlayer.id).toBe('player2');
    });

    test('should wrap around to beginning of player list', () => {
      const nextPlayer = bettingManager.getNextPlayerToAct(players, 'player3');
      expect(nextPlayer.id).toBe('player1');
    });

    test('should skip players who have already acted and matched bet', () => {
      players[1].currentBet = 50;
      bettingManager.playersActed.add('player2');
      
      const nextPlayer = bettingManager.getNextPlayerToAct(players, 'player1');
      expect(nextPlayer.id).toBe('player3');
    });

    test('should return null when betting is complete', () => {
      bettingManager.bettingComplete = true;
      const nextPlayer = bettingManager.getNextPlayerToAct(players);
      expect(nextPlayer).toBeNull();
    });

    test('should skip folded players', () => {
      players[1].status = 'folded';
      const nextPlayer = bettingManager.getNextPlayerToAct(players, 'player1');
      expect(nextPlayer.id).toBe('player3');
    });
  });

  describe('getCallAmount', () => {
    test('should return correct call amount', () => {
      bettingManager.currentBet = 100;
      expect(bettingManager.getCallAmount(30)).toBe(70);
    });

    test('should return 0 when player has already matched bet', () => {
      bettingManager.currentBet = 50;
      expect(bettingManager.getCallAmount(50)).toBe(0);
    });

    test('should return 0 when player bet exceeds current bet', () => {
      bettingManager.currentBet = 50;
      expect(bettingManager.getCallAmount(75)).toBe(0);
    });
  });

  describe('getMinRaiseAmount', () => {
    test('should return call amount plus minimum raise', () => {
      bettingManager.currentBet = 50;
      bettingManager.minRaise = 25;
      expect(bettingManager.getMinRaiseAmount(20)).toBe(55); // 30 to call + 25 min raise
    });

    test('should return minimum raise when no call needed', () => {
      bettingManager.currentBet = 50;
      bettingManager.minRaise = 25;
      expect(bettingManager.getMinRaiseAmount(50)).toBe(25);
    });
  });

  describe('validateAction', () => {
    beforeEach(() => {
      bettingManager.startBettingRound(0, 20);
    });

    test('should validate fold action', () => {
      const result = bettingManager.validateAction(players[0], 'fold');
      expect(result.valid).toBe(true);
    });

    test('should reject action for folded player', () => {
      players[0].status = 'folded';
      const result = bettingManager.validateAction(players[0], 'check');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('folded or eliminated');
    });

    test('should validate check when no bet', () => {
      const result = bettingManager.validateAction(players[0], 'check');
      expect(result.valid).toBe(true);
    });

    test('should reject check when there is a bet', () => {
      bettingManager.currentBet = 50;
      const result = bettingManager.validateAction(players[0], 'check');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('bet to call');
    });

    test('should validate call with sufficient chips', () => {
      bettingManager.currentBet = 50;
      const result = bettingManager.validateAction(players[0], 'call');
      expect(result.valid).toBe(true);
    });

    test('should reject call with insufficient chips', () => {
      bettingManager.currentBet = 1500;
      const result = bettingManager.validateAction(players[0], 'call');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Insufficient chips');
    });

    test('should validate raise with sufficient amount and chips', () => {
      bettingManager.minRaise = 20;
      const result = bettingManager.validateAction(players[0], 'raise', 50);
      expect(result.valid).toBe(true);
    });

    test('should reject raise below minimum', () => {
      bettingManager.minRaise = 50;
      const result = bettingManager.validateAction(players[0], 'raise', 25);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least 50');
    });

    test('should reject raise with insufficient chips', () => {
      bettingManager.currentBet = 500;
      bettingManager.minRaise = 600;
      const result = bettingManager.validateAction(players[0], 'raise', 600);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Insufficient chips');
    });
  });

  describe('reset', () => {
    test('should reset all betting state', () => {
      bettingManager.currentBet = 100;
      bettingManager.minRaise = 50;
      bettingManager.bettingRound = 2;
      bettingManager.playersActed.add('player1');
      bettingManager.bettingComplete = true;

      bettingManager.reset();

      expect(bettingManager.currentBet).toBe(0);
      expect(bettingManager.minRaise).toBe(0);
      expect(bettingManager.bettingRound).toBe(0);
      expect(bettingManager.playersActed.size).toBe(0);
      expect(bettingManager.bettingComplete).toBe(false);
    });
  });

  describe('getState', () => {
    test('should return current betting state', () => {
      bettingManager.currentBet = 100;
      bettingManager.minRaise = 50;
      bettingManager.playersActed.add('player1');
      bettingManager.lastAggressorId = 'player1';

      const state = bettingManager.getState();

      expect(state.currentBet).toBe(100);
      expect(state.minRaise).toBe(50);
      expect(state.playersActed).toEqual(['player1']);
      expect(state.lastAggressorId).toBe('player1');
      expect(state.bettingComplete).toBe(false);
    });
  });

  describe('complex betting scenarios', () => {
    test('should handle multiple raises correctly', () => {
      bettingManager.startBettingRound(0, 20);

      // Player 1 raises to 50
      let result = bettingManager.processAction('player1', 'raise', 50, 0);
      expect(result.newCurrentBet).toBe(50);
      expect(result.newMinRaise).toBe(50);

      // Player 2 raises to 150 (call 50 + raise 100)
      result = bettingManager.processAction('player2', 'raise', 100, 0);
      expect(result.newCurrentBet).toBe(150);
      expect(result.newMinRaise).toBe(100);

      // Player 3 calls
      result = bettingManager.processAction('player3', 'call', 0, 0);
      expect(result.amount).toBe(150);
    });

    test('should handle all-in scenarios', () => {
      players[0].chips = 30; // Short stack
      bettingManager.startBettingRound(0, 20);
      bettingManager.currentBet = 50;

      // Player can only call partial amount (all-in)
      players[0].bet(30); // Goes all-in
      players[0].status = 'all-in';

      expect(bettingManager.isBettingComplete([players[0]])).toBe(true);
    });

    test('should handle heads-up betting', () => {
      const headsUpPlayers = [players[0], players[1]];
      bettingManager.startBettingRound(0, 20);

      // Player1 raises to 50
      bettingManager.processAction('player1', 'raise', 50, 0);
      headsUpPlayers[0].currentBet = 50; // Simulate bet update
      expect(bettingManager.isBettingComplete(headsUpPlayers)).toBe(false);

      // Player2 calls the raise
      bettingManager.processAction('player2', 'call', 0, 0);
      headsUpPlayers[1].currentBet = 50; // Simulate bet update
      expect(bettingManager.isBettingComplete(headsUpPlayers)).toBe(true);
    });
  });
});