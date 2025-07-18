const GameManager = require('../../src/managers/GameManager');

describe('GameManager', () => {
  let gameManager;

  beforeEach(() => {
    gameManager = new GameManager({
      smallBlind: 10,
      bigBlind: 20,
      maxPlayers: 6,
      minPlayers: 2
    });
  });

  describe('Constructor and Configuration', () => {
    test('should initialize with default configuration', () => {
      const gm = new GameManager();
      expect(gm.smallBlind).toBe(10);
      expect(gm.bigBlind).toBe(20);
      expect(gm.maxPlayers).toBe(10);
      expect(gm.minPlayers).toBe(2);
    });

    test('should initialize with custom configuration', () => {
      expect(gameManager.smallBlind).toBe(10);
      expect(gameManager.bigBlind).toBe(20);
      expect(gameManager.maxPlayers).toBe(6);
      expect(gameManager.minPlayers).toBe(2);
    });

    test('should initialize in waiting phase', () => {
      expect(gameManager.gamePhase).toBe(GameManager.PHASES.WAITING);
      expect(gameManager.isGameActive).toBe(false);
      expect(gameManager.handNumber).toBe(0);
      expect(gameManager.communityCards).toEqual([]);
    });

    test('should have phase constants', () => {
      expect(GameManager.PHASES.WAITING).toBe('waiting');
      expect(GameManager.PHASES.PREFLOP).toBe('preflop');
      expect(GameManager.PHASES.FLOP).toBe('flop');
      expect(GameManager.PHASES.TURN).toBe('turn');
      expect(GameManager.PHASES.RIVER).toBe('river');
      expect(GameManager.PHASES.SHOWDOWN).toBe('showdown');
      expect(GameManager.PHASES.FINISHED).toBe('finished');
    });
  });

  describe('Player Management', () => {
    test('should add players successfully', () => {
      const result = gameManager.addPlayer('player1', 'Alice', 1000);
      
      expect(result.success).toBe(true);
      expect(result.player.id).toBe('player1');
      expect(result.player.name).toBe('Alice');
      expect(result.player.chips).toBe(1000);
      expect(result.canStartGame).toBe(false); // Need 2 players minimum
    });

    test('should allow starting game with minimum players', () => {
      gameManager.addPlayer('player1', 'Alice', 1000);
      const result = gameManager.addPlayer('player2', 'Bob', 1000);
      
      expect(result.canStartGame).toBe(true);
    });

    test('should not allow adding players beyond maximum', () => {
      // Add maximum players
      for (let i = 1; i <= 6; i++) {
        gameManager.addPlayer(`player${i}`, `Player${i}`, 1000);
      }

      const result = gameManager.addPlayer('player7', 'Player7', 1000);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Maximum 6 players allowed');
    });

    test('should not allow adding players during active game', () => {
      gameManager.addPlayer('player1', 'Alice', 1000);
      gameManager.addPlayer('player2', 'Bob', 1000);
      gameManager.startGame();

      const result = gameManager.addPlayer('player3', 'Charlie', 1000);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot add players while game is active');
    });

    test('should remove players successfully', () => {
      gameManager.addPlayer('player1', 'Alice', 1000);
      gameManager.addPlayer('player2', 'Bob', 1000);
      
      const result = gameManager.removePlayer('player1');
      expect(result.success).toBe(true);
      expect(result.playerCount).toBe(1);
    });

    test('should end game when removing players below minimum', () => {
      gameManager.addPlayer('player1', 'Alice', 1000);
      gameManager.addPlayer('player2', 'Bob', 1000);
      gameManager.startGame();

      const result = gameManager.removePlayer('player1');
      expect(result.success).toBe(true);
      expect(result.canContinueGame).toBe(false);
      expect(gameManager.isGameActive).toBe(false);
    });
  });

  describe('Game Flow', () => {
    beforeEach(() => {
      gameManager.addPlayer('player1', 'Alice', 1000);
      gameManager.addPlayer('player2', 'Bob', 1000);
      gameManager.addPlayer('player3', 'Charlie', 1000);
    });

    test('should start game successfully', () => {
      const result = gameManager.startGame();
      
      expect(result.success).toBe(true);
      expect(gameManager.isGameActive).toBe(true);
      expect(gameManager.handNumber).toBe(1);
      expect(gameManager.gamePhase).toBe(GameManager.PHASES.PREFLOP);
    });

    test('should not start game without minimum players', () => {
      const gm = new GameManager();
      gm.addPlayer('player1', 'Alice', 1000);
      
      const result = gm.startGame();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Need at least 2 players to start');
    });

    test('should not start game if already active', () => {
      gameManager.startGame();
      
      const result = gameManager.startGame();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Game is already active');
    });

    test('should deal hole cards to all players', () => {
      gameManager.startGame();
      
      const players = gameManager.playerManager.getAllPlayers();
      players.forEach(player => {
        expect(player.cards).toHaveLength(2);
      });
    });

    test('should collect blinds properly', () => {
      gameManager.startGame();
      
      const sbPlayer = gameManager.playerManager.getSmallBlindPlayer();
      const bbPlayer = gameManager.playerManager.getBigBlindPlayer();
      
      expect(sbPlayer.currentBet).toBe(10);
      expect(bbPlayer.currentBet).toBe(20);
      expect(gameManager.potManager.getTotalPotAmount()).toBe(30);
    });
  });

  describe('Game Phase Transitions', () => {
    beforeEach(() => {
      gameManager.addPlayer('player1', 'Alice', 1000);
      gameManager.addPlayer('player2', 'Bob', 1000);
      gameManager.startGame();
    });

    test('should transition from preflop to flop', () => {
      // Simulate all players calling to complete preflop betting
      const players = gameManager.playerManager.getActivePlayers();
      
      // First player (after BB) calls
      gameManager.processPlayerAction(gameManager.currentPlayerId, 'call');
      // Small blind calls (needs to add 10 more)
      gameManager.processPlayerAction(gameManager.currentPlayerId, 'call');
      // Big blind checks
      const result = gameManager.processPlayerAction(gameManager.currentPlayerId, 'check');
      
      expect(result.success).toBe(true);
      expect(gameManager.gamePhase).toBe(GameManager.PHASES.FLOP);
      expect(gameManager.communityCards).toHaveLength(3);
    });

    test('should transition through all phases', () => {
      // Complete preflop
      gameManager.processPlayerAction(gameManager.currentPlayerId, 'call');
      gameManager.processPlayerAction(gameManager.currentPlayerId, 'call');
      gameManager.processPlayerAction(gameManager.currentPlayerId, 'check');
      
      expect(gameManager.gamePhase).toBe(GameManager.PHASES.FLOP);
      expect(gameManager.communityCards).toHaveLength(3);
      
      // Complete flop
      gameManager.processPlayerAction(gameManager.currentPlayerId, 'check');
      gameManager.processPlayerAction(gameManager.currentPlayerId, 'check');
      
      expect(gameManager.gamePhase).toBe(GameManager.PHASES.TURN);
      expect(gameManager.communityCards).toHaveLength(4);
      
      // Complete turn
      gameManager.processPlayerAction(gameManager.currentPlayerId, 'check');
      gameManager.processPlayerAction(gameManager.currentPlayerId, 'check');
      
      expect(gameManager.gamePhase).toBe(GameManager.PHASES.RIVER);
      expect(gameManager.communityCards).toHaveLength(5);
    });

    test('should end hand when only one player remains', () => {
      // Add a third player for this test
      gameManager.addPlayer('player3', 'Charlie', 1000);
      
      // First player folds
      gameManager.processPlayerAction(gameManager.currentPlayerId, 'fold');
      // Second player folds, leaving only one player
      const result = gameManager.processPlayerAction(gameManager.currentPlayerId, 'fold');
      
      expect(result.success).toBe(true);
      expect(gameManager.gamePhase).toBe(GameManager.PHASES.FINISHED);
      expect(gameManager.winners).toHaveLength(1);
    });
  });

  describe('Player Actions', () => {
    beforeEach(() => {
      gameManager.addPlayer('player1', 'Alice', 1000);
      gameManager.addPlayer('player2', 'Bob', 1000);
      gameManager.startGame();
    });

    test('should process valid player actions', () => {
      const currentPlayer = gameManager.currentPlayerId;
      const result = gameManager.processPlayerAction(currentPlayer, 'call');
      
      expect(result.success).toBe(true);
      expect(result.action.success).toBe(true);
      expect(result.action.action).toBe('call');
    });

    test('should reject actions from wrong player', () => {
      const wrongPlayer = gameManager.playerManager.getAllPlayers()
        .find(p => p.id !== gameManager.currentPlayerId).id;
      
      const result = gameManager.processPlayerAction(wrongPlayer, 'call');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Not player\'s turn');
    });

    test('should reject invalid actions', () => {
      const result = gameManager.processPlayerAction(gameManager.currentPlayerId, 'check');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot check when there is a bet to call');
    });

    test('should handle raises properly', () => {
      const result = gameManager.processPlayerAction(gameManager.currentPlayerId, 'raise', 40);
      
      expect(result.success).toBe(true);
      expect(gameManager.bettingManager.currentBet).toBe(60); // 20 call + 40 raise
    });
  });

  describe('Event System', () => {
    test('should emit events for game actions', () => {
      const events = [];
      
      gameManager.on('playerAdded', (data) => events.push({ type: 'playerAdded', data }));
      gameManager.on('gameStarted', (data) => events.push({ type: 'gameStarted', data }));
      gameManager.on('handStarted', (data) => events.push({ type: 'handStarted', data }));
      
      gameManager.addPlayer('player1', 'Alice', 1000);
      gameManager.addPlayer('player2', 'Bob', 1000);
      gameManager.startGame();
      
      expect(events).toHaveLength(4); // 2 playerAdded + 1 gameStarted + 1 handStarted
      expect(events[0].type).toBe('playerAdded');
      expect(events[2].type).toBe('gameStarted');
      expect(events[3].type).toBe('handStarted');
    });

    test('should remove event listeners', () => {
      const callback = jest.fn();
      
      gameManager.on('playerAdded', callback);
      gameManager.addPlayer('player1', 'Alice', 1000);
      expect(callback).toHaveBeenCalledTimes(1);
      
      gameManager.off('playerAdded', callback);
      gameManager.addPlayer('player2', 'Bob', 1000);
      expect(callback).toHaveBeenCalledTimes(1); // Should not be called again
    });

    test('should handle event listener errors gracefully', () => {
      const errorCallback = () => { throw new Error('Test error'); };
      const normalCallback = jest.fn();
      
      gameManager.on('playerAdded', errorCallback);
      gameManager.on('playerAdded', normalCallback);
      
      // Should not throw error and should still call other listeners
      expect(() => {
        gameManager.addPlayer('player1', 'Alice', 1000);
      }).not.toThrow();
      
      expect(normalCallback).toHaveBeenCalled();
    });
  });

  describe('Game State', () => {
    beforeEach(() => {
      gameManager.addPlayer('player1', 'Alice', 1000);
      gameManager.addPlayer('player2', 'Bob', 1000);
    });

    test('should return comprehensive game state', () => {
      gameManager.startGame();
      const state = gameManager.getGameState();
      
      expect(state).toHaveProperty('gamePhase');
      expect(state).toHaveProperty('handNumber');
      expect(state).toHaveProperty('isGameActive');
      expect(state).toHaveProperty('players');
      expect(state).toHaveProperty('currentPlayer');
      expect(state).toHaveProperty('communityCards');
      expect(state).toHaveProperty('betting');
      expect(state).toHaveProperty('pots');
      expect(state).toHaveProperty('blinds');
      
      expect(state.gamePhase).toBe(GameManager.PHASES.PREFLOP);
      expect(state.isGameActive).toBe(true);
      expect(state.handNumber).toBe(1);
    });

    test('should track community cards correctly', () => {
      gameManager.startGame();
      
      // Complete preflop to get to flop
      gameManager.processPlayerAction(gameManager.currentPlayerId, 'call');
      gameManager.processPlayerAction(gameManager.currentPlayerId, 'call');
      gameManager.processPlayerAction(gameManager.currentPlayerId, 'check');
      
      const state = gameManager.getGameState();
      expect(state.communityCards).toHaveLength(3);
      expect(state.gamePhase).toBe(GameManager.PHASES.FLOP);
    });
  });

  describe('Hand Evaluation and Winners', () => {
    beforeEach(() => {
      gameManager.addPlayer('player1', 'Alice', 1000);
      gameManager.addPlayer('player2', 'Bob', 1000);
      gameManager.startGame();
    });

    test('should evaluate hands at showdown', () => {
      // Play through to river
      gameManager.processPlayerAction(gameManager.currentPlayerId, 'call');
      gameManager.processPlayerAction(gameManager.currentPlayerId, 'call');
      gameManager.processPlayerAction(gameManager.currentPlayerId, 'check');
      
      // Flop
      gameManager.processPlayerAction(gameManager.currentPlayerId, 'check');
      gameManager.processPlayerAction(gameManager.currentPlayerId, 'check');
      
      // Turn
      gameManager.processPlayerAction(gameManager.currentPlayerId, 'check');
      gameManager.processPlayerAction(gameManager.currentPlayerId, 'check');
      
      // River
      gameManager.processPlayerAction(gameManager.currentPlayerId, 'check');
      gameManager.processPlayerAction(gameManager.currentPlayerId, 'check');
      
      expect(gameManager.gamePhase).toBe(GameManager.PHASES.FINISHED);
      expect(gameManager.handResults).toHaveLength(2);
      expect(gameManager.winners.length).toBeGreaterThan(0);
    });

    test('should award pot to last remaining player', () => {
      const initialPot = gameManager.potManager.getTotalPotAmount();
      
      // All players fold except one
      gameManager.processPlayerAction(gameManager.currentPlayerId, 'fold');
      gameManager.processPlayerAction(gameManager.currentPlayerId, 'fold');
      
      expect(gameManager.winners).toHaveLength(1);
      expect(gameManager.winners[0].amount).toBe(initialPot);
      expect(gameManager.winners[0].reason).toBe('last_player_standing');
    });
  });

  describe('Multiple Hands', () => {
    beforeEach(() => {
      gameManager.addPlayer('player1', 'Alice', 1000);
      gameManager.addPlayer('player2', 'Bob', 1000);
      gameManager.startGame();
    });

    test('should start new hand after previous hand completes', () => {
      // Complete first hand
      gameManager.processPlayerAction(gameManager.currentPlayerId, 'fold');
      gameManager.processPlayerAction(gameManager.currentPlayerId, 'fold');
      
      expect(gameManager.handNumber).toBe(1);
      expect(gameManager.gamePhase).toBe(GameManager.PHASES.FINISHED);
      
      // Start new hand
      const result = gameManager.startNewHand();
      expect(result.success).toBe(true);
      expect(gameManager.handNumber).toBe(2);
      expect(gameManager.gamePhase).toBe(GameManager.PHASES.PREFLOP);
    });

    test('should rotate dealer position between hands', () => {
      const initialDealer = gameManager.playerManager.dealerPosition;
      
      // Complete first hand
      gameManager.processPlayerAction(gameManager.currentPlayerId, 'fold');
      gameManager.processPlayerAction(gameManager.currentPlayerId, 'fold');
      
      // Start new hand
      gameManager.startNewHand();
      
      const newDealer = gameManager.playerManager.dealerPosition;
      expect(newDealer).not.toBe(initialDealer);
    });
  });

  describe('Edge Cases', () => {
    test('should handle heads-up play correctly', () => {
      gameManager.addPlayer('player1', 'Alice', 1000);
      gameManager.addPlayer('player2', 'Bob', 1000);
      gameManager.startGame();
      
      // In heads-up, dealer posts small blind
      const dealer = gameManager.playerManager.getDealerPlayer();
      const sbPlayer = gameManager.playerManager.getSmallBlindPlayer();
      
      expect(dealer.id).toBe(sbPlayer.id);
    });

    test('should end game when insufficient players remain', () => {
      gameManager.addPlayer('player1', 'Alice', 100);
      gameManager.addPlayer('player2', 'Bob', 100);
      gameManager.startGame();
      
      // Simulate player elimination by setting chips to 0
      const player1 = gameManager.playerManager.getPlayer('player1');
      player1.chips = 0;
      player1.eliminate();
      
      const result = gameManager.startNewHand();
      expect(result.success).toBe(true);
      expect(result.gameEnded).toBe(true);
      expect(result.reason).toBe('insufficient_players');
    });

    test('should handle all-in scenarios', () => {
      gameManager.addPlayer('player1', 'Alice', 50);
      gameManager.addPlayer('player2', 'Bob', 1000);
      gameManager.startGame();
      
      // Player with 50 chips goes all-in (they have 40 left after posting SB of 10)
      const originalPlayer = gameManager.currentPlayerId;
      const result = gameManager.processPlayerAction(originalPlayer, 'raise', 30);
      
      expect(result.success).toBe(true);
      const player = gameManager.playerManager.getPlayer(originalPlayer);
      expect(player.status).toBe('all-in');
    });
  });
});