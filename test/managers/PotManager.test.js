const PotManager = require('../../src/managers/PotManager');
const Player = require('../../src/models/Player');

describe('PotManager', () => {
  let potManager;
  let players;

  beforeEach(() => {
    potManager = new PotManager();
    players = [
      new Player('player1', 'Alice', 1000, 0),
      new Player('player2', 'Bob', 1000, 1),
      new Player('player3', 'Charlie', 1000, 2),
      new Player('player4', 'David', 1000, 3)
    ];
  });

  describe('constructor', () => {
    test('should initialize with empty pots and contributions', () => {
      expect(potManager.pots).toEqual([]);
      expect(potManager.playerContributions.size).toBe(0);
    });
  });

  describe('createPot static method', () => {
    test('should create pot with default values', () => {
      const pot = PotManager.createPot();
      expect(pot.amount).toBe(0);
      expect(pot.eligiblePlayers).toEqual([]);
      expect(pot.isMainPot).toBe(true);
    });

    test('should create pot with specified values', () => {
      const pot = PotManager.createPot(100, ['player1', 'player2'], false);
      expect(pot.amount).toBe(100);
      expect(pot.eligiblePlayers).toEqual(['player1', 'player2']);
      expect(pot.isMainPot).toBe(false);
    });
  });

  describe('addBet', () => {
    test('should add bet to new main pot', () => {
      potManager.addBet('player1', 50);
      
      expect(potManager.pots).toHaveLength(1);
      expect(potManager.pots[0].amount).toBe(50);
      expect(potManager.pots[0].eligiblePlayers).toContain('player1');
      expect(potManager.pots[0].isMainPot).toBe(true);
      expect(potManager.playerContributions.get('player1')).toBe(50);
    });

    test('should add bet to existing main pot', () => {
      potManager.addBet('player1', 50);
      potManager.addBet('player2', 75);
      
      expect(potManager.pots).toHaveLength(1);
      expect(potManager.pots[0].amount).toBe(125);
      expect(potManager.pots[0].eligiblePlayers).toContain('player1');
      expect(potManager.pots[0].eligiblePlayers).toContain('player2');
    });

    test('should ignore zero or negative bets', () => {
      potManager.addBet('player1', 0);
      potManager.addBet('player2', -10);
      
      expect(potManager.pots).toHaveLength(0);
      expect(potManager.playerContributions.size).toBe(0);
    });

    test('should track cumulative contributions', () => {
      potManager.addBet('player1', 50);
      potManager.addBet('player1', 25);
      
      expect(potManager.playerContributions.get('player1')).toBe(75);
    });
  });

  describe('createSidePots', () => {
    test('should create single main pot when all players contribute equally', () => {
      players.forEach(player => {
        player.currentBet = 100;
        potManager.addBet(player.id, 100);
      });

      potManager.createSidePots(players);

      expect(potManager.pots).toHaveLength(1);
      expect(potManager.pots[0].amount).toBe(400);
      expect(potManager.pots[0].isMainPot).toBe(true);
      expect(potManager.pots[0].eligiblePlayers).toHaveLength(4);
    });

    test('should create side pots for all-in scenarios', () => {
      // Player 1 goes all-in with 50
      players[0].chips = 0;
      players[0].status = 'all-in';
      players[0].currentBet = 50;
      potManager.addBet('player1', 50);

      // Other players bet 100 each
      for (let i = 1; i < 4; i++) {
        players[i].currentBet = 100;
        potManager.addBet(players[i].id, 100);
      }

      potManager.createSidePots(players);

      expect(potManager.pots).toHaveLength(2);
      
      // Main pot: 50 * 4 players = 200
      expect(potManager.pots[0].amount).toBe(200);
      expect(potManager.pots[0].isMainPot).toBe(true);
      expect(potManager.pots[0].eligiblePlayers).toHaveLength(4);
      
      // Side pot: 50 * 3 remaining players = 150
      expect(potManager.pots[1].amount).toBe(150);
      expect(potManager.pots[1].isMainPot).toBe(false);
      expect(potManager.pots[1].eligiblePlayers).toHaveLength(3);
      expect(potManager.pots[1].eligiblePlayers).not.toContain('player1');
    });

    test('should create multiple side pots with different all-in amounts', () => {
      // Player 1: all-in 30
      players[0].chips = 0;
      players[0].status = 'all-in';
      players[0].currentBet = 30;
      potManager.addBet('player1', 30);

      // Player 2: all-in 70
      players[1].chips = 0;
      players[1].status = 'all-in';
      players[1].currentBet = 70;
      potManager.addBet('player2', 70);

      // Players 3 & 4: bet 100 each
      players[2].currentBet = 100;
      players[3].currentBet = 100;
      potManager.addBet('player3', 100);
      potManager.addBet('player4', 100);

      potManager.createSidePots(players);

      expect(potManager.pots).toHaveLength(3);
      
      // Main pot: 30 * 4 = 120
      expect(potManager.pots[0].amount).toBe(120);
      expect(potManager.pots[0].eligiblePlayers).toHaveLength(4);
      
      // Side pot 1: (70-30) * 3 = 120
      expect(potManager.pots[1].amount).toBe(120);
      expect(potManager.pots[1].eligiblePlayers).toHaveLength(3);
      expect(potManager.pots[1].eligiblePlayers).not.toContain('player1');
      
      // Side pot 2: (100-70) * 2 = 60
      expect(potManager.pots[2].amount).toBe(60);
      expect(potManager.pots[2].eligiblePlayers).toHaveLength(2);
      expect(potManager.pots[2].eligiblePlayers).toContain('player3');
      expect(potManager.pots[2].eligiblePlayers).toContain('player4');
    });

    test('should exclude folded players from side pots', () => {
      // Player 1: all-in 50
      players[0].chips = 0;
      players[0].status = 'all-in';
      players[0].currentBet = 50;
      potManager.addBet('player1', 50);

      // Player 2: folded after betting 25
      players[1].status = 'folded';
      players[1].currentBet = 25;
      potManager.addBet('player2', 25);

      // Players 3 & 4: bet 100 each
      players[2].currentBet = 100;
      players[3].currentBet = 100;
      potManager.addBet('player3', 100);
      potManager.addBet('player4', 100);

      potManager.createSidePots(players);

      // Check that folded player is not in eligible players for any pot
      potManager.pots.forEach(pot => {
        expect(pot.eligiblePlayers).not.toContain('player2');
      });
    });

    test('should handle empty player list', () => {
      potManager.createSidePots([]);
      expect(potManager.pots).toEqual([]);
    });
  });

  describe('distributeWinnings', () => {
    beforeEach(() => {
      // Set up a basic pot
      potManager.addBet('player1', 100);
      potManager.addBet('player2', 100);
      potManager.addBet('player3', 100);
      potManager.createSidePots(players.slice(0, 3));
    });

    test('should distribute winnings to single winner', () => {
      const handResults = [
        { playerId: 'player1', handStrength: 1000, handType: 'pair' },
        { playerId: 'player2', handStrength: 500, handType: 'high card' },
        { playerId: 'player3', handStrength: 300, handType: 'high card' }
      ];

      const distributions = potManager.distributeWinnings(handResults);

      expect(distributions).toHaveLength(1);
      expect(distributions[0].playerId).toBe('player1');
      expect(distributions[0].amount).toBe(300);
      expect(distributions[0].isMainPot).toBe(true);
    });

    test('should split pot between tied winners', () => {
      const handResults = [
        { playerId: 'player1', handStrength: 1000, handType: 'pair' },
        { playerId: 'player2', handStrength: 1000, handType: 'pair' },
        { playerId: 'player3', handStrength: 500, handType: 'high card' }
      ];

      const distributions = potManager.distributeWinnings(handResults);

      expect(distributions).toHaveLength(2);
      expect(distributions[0].amount).toBe(150);
      expect(distributions[1].amount).toBe(150);
      expect(distributions[0].sharedWith).toHaveLength(2);
    });

    test('should handle odd pot amounts in splits', () => {
      // Create pot with odd amount
      potManager.reset();
      potManager.addBet('player1', 101);
      potManager.addBet('player2', 101);
      potManager.createSidePots([players[0], players[1]]);

      const handResults = [
        { playerId: 'player1', handStrength: 1000, handType: 'pair' },
        { playerId: 'player2', handStrength: 1000, handType: 'pair' }
      ];

      const distributions = potManager.distributeWinnings(handResults);

      expect(distributions).toHaveLength(2);
      // First player gets the extra chip
      expect(distributions[0].amount).toBe(101);
      expect(distributions[1].amount).toBe(101);
    });

    test('should distribute multiple pots correctly', () => {
      // Set up side pot scenario
      potManager.reset();
      
      // Player 1: all-in 50
      players[0].status = 'all-in';
      potManager.addBet('player1', 50);
      
      // Players 2 & 3: bet 100 each
      potManager.addBet('player2', 100);
      potManager.addBet('player3', 100);
      
      potManager.createSidePots(players.slice(0, 3));

      const handResults = [
        { playerId: 'player1', handStrength: 1000, handType: 'pair' },
        { playerId: 'player2', handStrength: 500, handType: 'high card' },
        { playerId: 'player3', handStrength: 300, handType: 'high card' }
      ];

      const distributions = potManager.distributeWinnings(handResults);

      expect(distributions).toHaveLength(2);
      
      // Player 1 wins main pot
      const mainPotWin = distributions.find(d => d.isMainPot);
      expect(mainPotWin.playerId).toBe('player1');
      expect(mainPotWin.amount).toBe(150); // 50 * 3 players
      
      // Player 2 wins side pot
      const sidePotWin = distributions.find(d => !d.isMainPot);
      expect(sidePotWin.playerId).toBe('player2');
      expect(sidePotWin.amount).toBe(100); // 50 * 2 players
    });

    test('should handle empty hand results', () => {
      const distributions = potManager.distributeWinnings([]);
      expect(distributions).toEqual([]);
    });

    test('should only consider eligible players for each pot', () => {
      // Set up side pot where player is not eligible for side pot
      potManager.reset();
      
      players[0].status = 'all-in';
      potManager.addBet('player1', 50);
      potManager.addBet('player2', 100);
      potManager.addBet('player3', 100);
      
      potManager.createSidePots(players.slice(0, 3));

      // Player 1 has best hand but can't win side pot
      const handResults = [
        { playerId: 'player1', handStrength: 1000, handType: 'pair' },
        { playerId: 'player2', handStrength: 500, handType: 'high card' },
        { playerId: 'player3', handStrength: 800, handType: 'pair' }
      ];

      const distributions = potManager.distributeWinnings(handResults);

      expect(distributions).toHaveLength(2);
      
      // Player 1 wins main pot
      const mainPotWin = distributions.find(d => d.isMainPot);
      expect(mainPotWin.playerId).toBe('player1');
      
      // Player 3 wins side pot (better hand than player 2)
      const sidePotWin = distributions.find(d => !d.isMainPot);
      expect(sidePotWin.playerId).toBe('player3');
    });
  });

  describe('pot information methods', () => {
    beforeEach(() => {
      potManager.addBet('player1', 100);
      potManager.addBet('player2', 150);
      potManager.createSidePots(players.slice(0, 2));
    });

    test('getTotalPotAmount should return sum of all pots', () => {
      expect(potManager.getTotalPotAmount()).toBe(potManager.pots.reduce((sum, pot) => sum + pot.amount, 0));
    });

    test('getMainPotAmount should return main pot amount', () => {
      expect(potManager.getMainPotAmount()).toBeGreaterThan(0);
    });

    test('getSidePots should return only side pots', () => {
      const sidePots = potManager.getSidePots();
      sidePots.forEach(pot => {
        expect(pot.isMainPot).toBe(false);
      });
    });

    test('getSidePotCount should return number of side pots', () => {
      const count = potManager.getSidePotCount();
      expect(count).toBe(potManager.getSidePots().length);
    });

    test('isPlayerEligibleForPot should check eligibility correctly', () => {
      expect(potManager.isPlayerEligibleForPot('player1', 0)).toBe(true);
      expect(potManager.isPlayerEligibleForPot('player3', 0)).toBe(false);
      expect(potManager.isPlayerEligibleForPot('player1', 999)).toBe(false);
    });

    test('getPlayerContribution should return correct amounts', () => {
      expect(potManager.getPlayerContribution('player1')).toBe(100);
      expect(potManager.getPlayerContribution('player2')).toBe(150);
      expect(potManager.getPlayerContribution('player3')).toBe(0);
    });
  });

  describe('collectBets', () => {
    test('should collect bets from all players', () => {
      // Reset potManager to ensure clean state
      potManager.reset();
      
      players[0].currentBet = 50;
      players[1].currentBet = 100;
      players[2].currentBet = 75;

      potManager.collectBets(players);

      expect(potManager.getTotalPotAmount()).toBe(225);
      expect(potManager.getPlayerContribution('player1')).toBe(50);
      expect(potManager.getPlayerContribution('player2')).toBe(100);
      expect(potManager.getPlayerContribution('player3')).toBe(75);
    });

    test('should create side pots automatically', () => {
      players[0].currentBet = 50;
      players[0].status = 'all-in';
      players[1].currentBet = 100;
      players[2].currentBet = 100;

      potManager.collectBets(players);

      expect(potManager.pots.length).toBeGreaterThan(1);
    });

    test('should ignore players with zero bets', () => {
      // Reset potManager to ensure clean state
      potManager.reset();
      
      players[0].currentBet = 100;
      players[1].currentBet = 0;
      players[2].currentBet = 50;

      potManager.collectBets(players);

      expect(potManager.getPlayerContribution('player2')).toBe(0);
      expect(potManager.getTotalPotAmount()).toBe(150);
    });
  });

  describe('reset', () => {
    test('should clear all pots and contributions', () => {
      potManager.addBet('player1', 100);
      potManager.addBet('player2', 50);

      potManager.reset();

      expect(potManager.pots).toEqual([]);
      expect(potManager.playerContributions.size).toBe(0);
      expect(potManager.getTotalPotAmount()).toBe(0);
    });
  });

  describe('getState', () => {
    test('should return comprehensive pot state', () => {
      // Reset potManager to ensure clean state
      potManager.reset();
      
      potManager.addBet('player1', 100);
      potManager.addBet('player2', 150);
      potManager.createSidePots(players.slice(0, 2));

      const state = potManager.getState();

      expect(state).toHaveProperty('pots');
      expect(state).toHaveProperty('totalAmount');
      expect(state).toHaveProperty('mainPotAmount');
      expect(state).toHaveProperty('sidePotCount');
      expect(state).toHaveProperty('playerContributions');
      
      expect(state.totalAmount).toBe(250);
      expect(state.playerContributions.player1).toBe(100);
      expect(state.playerContributions.player2).toBe(150);
    });
  });

  describe('validatePots', () => {
    test('should validate correct pot setup', () => {
      potManager.addBet('player1', 100);
      potManager.addBet('player2', 100);
      potManager.createSidePots(players.slice(0, 2));

      const validation = potManager.validatePots(players.slice(0, 2));
      expect(validation.valid).toBe(true);
      expect(validation.errors).toEqual([]);
    });

    test('should detect contribution/pot amount mismatch', () => {
      potManager.addBet('player1', 100);
      potManager.pots[0].amount = 150; // Manually corrupt the amount

      const validation = potManager.validatePots(players.slice(0, 1));
      expect(validation.valid).toBe(false);
      expect(validation.errors[0]).toContain('don\'t match');
    });

    test('should detect non-existent players in pots', () => {
      potManager.addBet('nonexistent', 100);
      potManager.createSidePots([]);

      const validation = potManager.validatePots(players);
      expect(validation.valid).toBe(false);
      expect(validation.errors[0]).toContain('non-existent player');
    });
  });

  describe('complex all-in scenarios', () => {
    test('should handle multiple all-ins with same amount', () => {
      // Two players all-in with 50, two players bet 100
      players[0].status = 'all-in';
      players[1].status = 'all-in';
      
      potManager.addBet('player1', 50);
      potManager.addBet('player2', 50);
      potManager.addBet('player3', 100);
      potManager.addBet('player4', 100);

      potManager.createSidePots(players);

      expect(potManager.pots).toHaveLength(2);
      expect(potManager.pots[0].amount).toBe(200); // 50 * 4 players
      expect(potManager.pots[1].amount).toBe(100); // 50 * 2 remaining players
    });

    test('should handle single player remaining scenario', () => {
      // Reset potManager to ensure clean state
      potManager.reset();
      
      players[1].status = 'folded';
      players[2].status = 'folded';
      players[3].status = 'folded';

      potManager.addBet('player1', 100);
      potManager.addBet('player2', 50); // folded after betting
      potManager.addBet('player3', 25); // folded after betting
      potManager.addBet('player4', 75); // folded after betting

      potManager.createSidePots(players);

      const handResults = [
        { playerId: 'player1', handStrength: 1000, handType: 'high card' }
      ];

      const distributions = potManager.distributeWinnings(handResults);
      expect(distributions.length).toBeGreaterThan(0);
      
      // Player 1 should win all the money they're eligible for
      const totalWinnings = distributions.reduce((sum, dist) => sum + dist.amount, 0);
      expect(totalWinnings).toBeGreaterThan(0);
      
      // All distributions should be for player1
      distributions.forEach(dist => {
        expect(dist.playerId).toBe('player1');
      });
    });
  });
});