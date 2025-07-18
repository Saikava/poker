const PlayerManager = require('../../src/managers/PlayerManager');
const Player = require('../../src/models/Player');

describe('PlayerManager', () => {
  let playerManager;

  beforeEach(() => {
    playerManager = new PlayerManager();
  });

  describe('constructor', () => {
    test('should initialize with empty state', () => {
      expect(playerManager.players.size).toBe(0);
      expect(playerManager.playerOrder).toEqual([]);
      expect(playerManager.dealerPosition).toBe(0);
      expect(playerManager.currentPlayerIndex).toBe(0);
    });
  });

  describe('addPlayer', () => {
    test('should add player successfully', () => {
      const player = playerManager.addPlayer('player1', 'Alice', 1000);
      
      expect(player).toBeInstanceOf(Player);
      expect(player.id).toBe('player1');
      expect(player.name).toBe('Alice');
      expect(player.chips).toBe(1000);
      expect(player.position).toBe(0);
      expect(playerManager.getPlayerCount()).toBe(1);
    });

    test('should assign correct positions to multiple players', () => {
      playerManager.addPlayer('player1', 'Alice', 1000);
      playerManager.addPlayer('player2', 'Bob', 1000);
      playerManager.addPlayer('player3', 'Charlie', 1000);
      
      expect(playerManager.getPlayer('player1').position).toBe(0);
      expect(playerManager.getPlayer('player2').position).toBe(1);
      expect(playerManager.getPlayer('player3').position).toBe(2);
    });

    test('should throw error for duplicate player ID', () => {
      playerManager.addPlayer('player1', 'Alice', 1000);
      
      expect(() => {
        playerManager.addPlayer('player1', 'Bob', 1000);
      }).toThrow('Player with id player1 already exists');
    });
  });

  describe('removePlayer', () => {
    beforeEach(() => {
      playerManager.addPlayer('player1', 'Alice', 1000);
      playerManager.addPlayer('player2', 'Bob', 1000);
      playerManager.addPlayer('player3', 'Charlie', 1000);
    });

    test('should remove player successfully', () => {
      const result = playerManager.removePlayer('player2');
      
      expect(result).toBe(true);
      expect(playerManager.getPlayer('player2')).toBeNull();
      expect(playerManager.getPlayerCount()).toBe(2);
    });

    test('should update positions after removal', () => {
      playerManager.removePlayer('player1');
      
      expect(playerManager.getPlayer('player2').position).toBe(0);
      expect(playerManager.getPlayer('player3').position).toBe(1);
    });

    test('should adjust dealer position when removing player before dealer', () => {
      playerManager.dealerPosition = 2;
      playerManager.removePlayer('player1');
      
      expect(playerManager.dealerPosition).toBe(1); // Dealer position should adjust since player positions shifted
    });

    test('should reset dealer position when it exceeds player count', () => {
      playerManager.dealerPosition = 2;
      playerManager.removePlayer('player3');
      
      expect(playerManager.dealerPosition).toBe(0);
    });

    test('should return false for non-existent player', () => {
      const result = playerManager.removePlayer('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('getPlayer', () => {
    test('should return player by ID', () => {
      const addedPlayer = playerManager.addPlayer('player1', 'Alice', 1000);
      const retrievedPlayer = playerManager.getPlayer('player1');
      
      expect(retrievedPlayer).toBe(addedPlayer);
    });

    test('should return null for non-existent player', () => {
      const player = playerManager.getPlayer('nonexistent');
      expect(player).toBeNull();
    });
  });

  describe('getActivePlayers', () => {
    beforeEach(() => {
      playerManager.addPlayer('player1', 'Alice', 1000);
      playerManager.addPlayer('player2', 'Bob', 1000);
      playerManager.addPlayer('player3', 'Charlie', 1000);
    });

    test('should return all active players', () => {
      const activePlayers = playerManager.getActivePlayers();
      
      expect(activePlayers).toHaveLength(3);
      expect(activePlayers.every(p => p.status === 'active')).toBe(true);
    });

    test('should exclude folded players', () => {
      playerManager.getPlayer('player2').fold();
      const activePlayers = playerManager.getActivePlayers();
      
      expect(activePlayers).toHaveLength(2);
      expect(activePlayers.find(p => p.id === 'player2')).toBeUndefined();
    });

    test('should include all-in players', () => {
      playerManager.getPlayer('player2').bet(1000); // Go all-in
      const activePlayers = playerManager.getActivePlayers();
      
      expect(activePlayers).toHaveLength(3);
      expect(activePlayers.find(p => p.id === 'player2')).toBeDefined();
    });

    test('should exclude eliminated players', () => {
      playerManager.getPlayer('player2').eliminate();
      const activePlayers = playerManager.getActivePlayers();
      
      expect(activePlayers).toHaveLength(2);
      expect(activePlayers.find(p => p.id === 'player2')).toBeUndefined();
    });
  });

  describe('getPlayersInHand', () => {
    beforeEach(() => {
      playerManager.addPlayer('player1', 'Alice', 1000);
      playerManager.addPlayer('player2', 'Bob', 1000);
      playerManager.addPlayer('player3', 'Charlie', 1000);
    });

    test('should return players who havent folded or been eliminated', () => {
      playerManager.getPlayer('player2').fold();
      const playersInHand = playerManager.getPlayersInHand();
      
      expect(playersInHand).toHaveLength(2);
      expect(playersInHand.find(p => p.id === 'player2')).toBeUndefined();
    });

    test('should include all-in players', () => {
      playerManager.getPlayer('player2').bet(1000); // Go all-in
      const playersInHand = playerManager.getPlayersInHand();
      
      expect(playersInHand).toHaveLength(3);
      expect(playersInHand.find(p => p.id === 'player2')).toBeDefined();
    });
  });

  describe('validatePlayerAction', () => {
    beforeEach(() => {
      playerManager.addPlayer('player1', 'Alice', 1000);
    });

    test('should validate valid action', () => {
      const isValid = playerManager.validatePlayerAction('player1', 'check', 0);
      expect(isValid).toBe(true);
    });

    test('should allow call action even with insufficient chips (all-in)', () => {
      const isValid = playerManager.validatePlayerAction('player1', 'call', 1500);
      expect(isValid).toBe(true);
    });

    test('should throw error for non-existent player', () => {
      expect(() => {
        playerManager.validatePlayerAction('nonexistent', 'check');
      }).toThrow('Player nonexistent not found');
    });
  });

  describe('executePlayerAction', () => {
    beforeEach(() => {
      playerManager.addPlayer('player1', 'Alice', 1000);
    });

    test('should execute valid fold action', () => {
      const result = playerManager.executePlayerAction('player1', 'fold');
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('fold');
      expect(result.playerId).toBe('player1');
      expect(playerManager.getPlayer('player1').status).toBe('folded');
    });

    test('should execute valid check action', () => {
      const result = playerManager.executePlayerAction('player1', 'check');
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('check');
    });

    test('should execute valid call action', () => {
      const result = playerManager.executePlayerAction('player1', 'call', 0, 100);
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('call');
      expect(result.amount).toBe(100);
      expect(playerManager.getPlayer('player1').chips).toBe(900);
    });

    test('should execute valid raise action', () => {
      const result = playerManager.executePlayerAction('player1', 'raise', 200, 100);
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('raise');
      expect(result.amount).toBe(200);
      expect(playerManager.getPlayer('player1').chips).toBe(700);
    });

    test('should return error for invalid action', () => {
      expect(() => playerManager.executePlayerAction('player1', 'invalid'))
        .toThrow('Invalid action: invalid');
    });

    test('should allow all-in when call amount exceeds chips', () => {
      const result = playerManager.executePlayerAction('player1', 'call', 0, 1500);
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('call');
      expect(result.amount).toBe(1500);
      expect(playerManager.getPlayer('player1').chips).toBe(0);
      expect(playerManager.getPlayer('player1').status).toBe('all-in');
    });

    test('should throw error for non-existent player', () => {
      expect(() => {
        playerManager.executePlayerAction('nonexistent', 'check');
      }).toThrow('Player nonexistent not found');
    });
  });

  describe('dealer and blind positions', () => {
    beforeEach(() => {
      playerManager.addPlayer('player1', 'Alice', 1000);
      playerManager.addPlayer('player2', 'Bob', 1000);
      playerManager.addPlayer('player3', 'Charlie', 1000);
    });

    describe('rotateDealerPosition', () => {
      test('should rotate dealer position', () => {
        expect(playerManager.dealerPosition).toBe(0);
        
        playerManager.rotateDealerPosition();
        expect(playerManager.dealerPosition).toBe(1);
        
        playerManager.rotateDealerPosition();
        expect(playerManager.dealerPosition).toBe(2);
        
        playerManager.rotateDealerPosition();
        expect(playerManager.dealerPosition).toBe(0);
      });

      test('should handle empty player list', () => {
        const emptyManager = new PlayerManager();
        emptyManager.rotateDealerPosition();
        expect(emptyManager.dealerPosition).toBe(0);
      });
    });

    describe('getDealerPlayer', () => {
      test('should return dealer player', () => {
        const dealer = playerManager.getDealerPlayer();
        expect(dealer.id).toBe('player1');
        
        playerManager.rotateDealerPosition();
        const newDealer = playerManager.getDealerPlayer();
        expect(newDealer.id).toBe('player2');
      });

      test('should return null for empty player list', () => {
        const emptyManager = new PlayerManager();
        expect(emptyManager.getDealerPlayer()).toBeNull();
      });
    });

    describe('getSmallBlindPlayer', () => {
      test('should return small blind player in normal game', () => {
        const sbPlayer = playerManager.getSmallBlindPlayer();
        expect(sbPlayer.id).toBe('player2'); // Next after dealer
      });

      test('should return dealer in heads-up game', () => {
        playerManager.removePlayer('player3');
        const sbPlayer = playerManager.getSmallBlindPlayer();
        expect(sbPlayer.id).toBe('player1'); // Dealer in heads-up
      });

      test('should return null with insufficient players', () => {
        playerManager.removePlayer('player2');
        playerManager.removePlayer('player3');
        expect(playerManager.getSmallBlindPlayer()).toBeNull();
      });
    });

    describe('getBigBlindPlayer', () => {
      test('should return big blind player in normal game', () => {
        const bbPlayer = playerManager.getBigBlindPlayer();
        expect(bbPlayer.id).toBe('player3'); // Two positions after dealer
      });

      test('should return non-dealer in heads-up game', () => {
        playerManager.removePlayer('player3');
        const bbPlayer = playerManager.getBigBlindPlayer();
        expect(bbPlayer.id).toBe('player2'); // Non-dealer in heads-up
      });

      test('should return null with insufficient players', () => {
        playerManager.removePlayer('player2');
        playerManager.removePlayer('player3');
        expect(playerManager.getBigBlindPlayer()).toBeNull();
      });
    });
  });

  describe('resetPlayersForNewHand', () => {
    beforeEach(() => {
      playerManager.addPlayer('player1', 'Alice', 1000);
      playerManager.addPlayer('player2', 'Bob', 0); // No chips
      playerManager.addPlayer('player3', 'Charlie', 1000);
    });

    test('should reset all players for new hand', () => {
      const player1 = playerManager.getPlayer('player1');
      const player3 = playerManager.getPlayer('player3');
      
      player1.bet(100);
      player1.addCards([{ suit: 'hearts', rank: 'A' }]);
      player3.fold();
      
      playerManager.resetPlayersForNewHand();
      
      expect(player1.currentBet).toBe(0);
      expect(player1.totalBet).toBe(0);
      expect(player1.cards).toEqual([]);
      expect(player3.status).toBe('active');
    });

    test('should eliminate and remove players with no chips', () => {
      expect(playerManager.getPlayerCount()).toBe(3);
      
      playerManager.resetPlayersForNewHand();
      
      expect(playerManager.getPlayerCount()).toBe(2);
      expect(playerManager.getPlayer('player2')).toBeNull();
    });
  });

  describe('getNextPlayer', () => {
    beforeEach(() => {
      playerManager.addPlayer('player1', 'Alice', 1000);
      playerManager.addPlayer('player2', 'Bob', 1000);
      playerManager.addPlayer('player3', 'Charlie', 1000);
    });

    test('should return next active player', () => {
      const nextPlayer = playerManager.getNextPlayer('player1');
      expect(nextPlayer.id).toBe('player2');
    });

    test('should wrap around to first player', () => {
      const nextPlayer = playerManager.getNextPlayer('player3');
      expect(nextPlayer.id).toBe('player1');
    });

    test('should skip folded players', () => {
      playerManager.getPlayer('player2').fold();
      const nextPlayer = playerManager.getNextPlayer('player1');
      expect(nextPlayer.id).toBe('player3');
    });

    test('should include all-in players', () => {
      playerManager.getPlayer('player2').bet(1000); // Go all-in
      const nextPlayer = playerManager.getNextPlayer('player1');
      expect(nextPlayer.id).toBe('player2');
    });

    test('should return null for non-existent player', () => {
      const nextPlayer = playerManager.getNextPlayer('nonexistent');
      expect(nextPlayer).toBeNull();
    });

    test('should return null when only one active player remains', () => {
      playerManager.getPlayer('player2').fold();
      playerManager.getPlayer('player3').fold();
      const nextPlayer = playerManager.getNextPlayer('player1');
      expect(nextPlayer).toBeNull();
    });
  });

  describe('getState', () => {
    beforeEach(() => {
      playerManager.addPlayer('player1', 'Alice', 1000);
      playerManager.addPlayer('player2', 'Bob', 1000);
    });

    test('should return complete manager state', () => {
      const state = playerManager.getState();
      
      expect(state).toHaveProperty('players');
      expect(state).toHaveProperty('playerOrder');
      expect(state).toHaveProperty('dealerPosition');
      expect(state).toHaveProperty('activePlayerCount');
      expect(state).toHaveProperty('playersInHand');
      
      expect(state.players).toHaveLength(2);
      expect(state.playerOrder).toEqual(['player1', 'player2']);
      expect(state.dealerPosition).toBe(0);
      expect(state.activePlayerCount).toBe(2);
      expect(state.playersInHand).toBe(2);
    });
  });
});