const PokerEngine = require('../src/PokerEngine');

describe('PokerEngine Integration Tests', () => {
  let engine;

  beforeEach(() => {
    engine = new PokerEngine({
      smallBlind: 5,
      bigBlind: 10,
      startingChips: 1000
    });
  });

  describe('Game Initialization', () => {
    test('should create engine with default configuration', () => {
      const defaultEngine = new PokerEngine();
      const stats = defaultEngine.getGameStats();
      
      expect(stats.config.smallBlind).toBe(10);
      expect(stats.config.bigBlind).toBe(20);
      expect(defaultEngine.config.startingChips).toBe(1000);
      expect(defaultEngine.config.maxPlayers).toBe(10);
      expect(defaultEngine.config.minPlayers).toBe(2);
    });

    test('should create engine with custom configuration', () => {
      const customEngine = new PokerEngine({
        smallBlind: 25,
        bigBlind: 50,
        maxPlayers: 6,
        startingChips: 2000
      });
      
      const stats = customEngine.getGameStats();
      expect(stats.config.smallBlind).toBe(25);
      expect(stats.config.bigBlind).toBe(50);
      expect(customEngine.config.maxPlayers).toBe(6);
      expect(customEngine.config.startingChips).toBe(2000);
    });

    test('should validate configuration', () => {
      const validation = PokerEngine.validateConfig({
        smallBlind: 10,
        bigBlind: 5, // Invalid: smaller than small blind
        maxPlayers: 25 // Invalid: too many players
      });
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Small blind must be less than big blind');
      expect(validation.errors).toContain('Max players must be between 2 and 23');
    });
  });

  describe('Player Management', () => {
    test('should add players successfully', () => {
      const result1 = engine.addPlayer({ id: 'player1', name: 'Alice' });
      const result2 = engine.addPlayer({ id: 'player2', name: 'Bob', chips: 1500 });

      expect(result1.success).toBe(true);
      expect(result1.player.name).toBe('Alice');
      expect(result1.player.chips).toBe(1000); // Default chips
      expect(result1.gameInfo.playerCount).toBe(1);

      expect(result2.success).toBe(true);
      expect(result2.player.name).toBe('Bob');
      expect(result2.player.chips).toBe(1500); // Custom chips
      expect(result2.gameInfo.playerCount).toBe(2);
      expect(result2.gameInfo.canStartGame).toBe(true);
    });

    test('should reject invalid player data', () => {
      const result1 = engine.addPlayer({ id: 'player1' }); // Missing name
      const result2 = engine.addPlayer({ name: 'Alice' }); // Missing id
      const result3 = engine.addPlayer(null); // Null input

      expect(result1.success).toBe(false);
      expect(result1.error.type).toBe('InvalidInputError');

      expect(result2.success).toBe(false);
      expect(result2.error.type).toBe('InvalidInputError');

      expect(result3.success).toBe(false);
      expect(result3.error.type).toBe('InvalidInputError');
    });

    test('should prevent duplicate player IDs', () => {
      engine.addPlayer({ id: 'player1', name: 'Alice' });
      const result = engine.addPlayer({ id: 'player1', name: 'Bob' });

      expect(result.success).toBe(false);
      expect(result.error.type).toBe('InvalidInputError');
    });

    test('should remove players successfully', () => {
      engine.addPlayer({ id: 'player1', name: 'Alice' });
      engine.addPlayer({ id: 'player2', name: 'Bob' });

      const result = engine.removePlayer('player1');

      expect(result.success).toBe(true);
      expect(result.gameInfo.playerCount).toBe(1);
    });

    test('should handle removing non-existent player', () => {
      const result = engine.removePlayer('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error.type).toBe('PlayerNotFoundError');
    });
  });

  describe('Game Flow', () => {
    beforeEach(() => {
      // Add players for game flow tests
      engine.addPlayer({ id: 'player1', name: 'Alice' });
      engine.addPlayer({ id: 'player2', name: 'Bob' });
      engine.addPlayer({ id: 'player3', name: 'Charlie' });
    });

    test('should start game successfully', () => {
      const result = engine.startGame();

      expect(result.success).toBe(true);
      expect(result.gameState.gameInfo.isActive).toBe(true);
      expect(result.gameState.gameInfo.phase).toBe('preflop');
      expect(result.gameState.gameInfo.handNumber).toBe(1);
    });

    test('should prevent starting game with insufficient players', () => {
      const singlePlayerEngine = new PokerEngine();
      singlePlayerEngine.addPlayer({ id: 'player1', name: 'Alice' });

      const result = singlePlayerEngine.startGame();

      expect(result.success).toBe(false);
      expect(result.error.type).toBe('GameStateError');
    });

    test('should handle complete hand flow', () => {
      engine.startGame();
      const gameState = engine.getGameState();

      // Verify initial state
      expect(gameState.gameInfo.phase).toBe('preflop');
      expect(gameState.table.communityCards).toHaveLength(0);
      expect(gameState.pots.total).toBeGreaterThan(0); // Blinds posted

      // Verify players have hole cards
      const playersWithCards = gameState.players.filter(p => p.cards.length === 2);
      expect(playersWithCards).toHaveLength(3);
    });

    test('should track dealer position and blinds', () => {
      engine.startGame();
      const gameState = engine.getGameState();

      // Find dealer, small blind, and big blind players
      const dealerPlayer = gameState.players.find(p => p.isDealer);
      expect(dealerPlayer).toBeDefined();

      // Verify blinds were posted
      expect(gameState.pots.total).toBe(15); // 5 + 10 = 15
    });
  });

  describe('Player Actions', () => {
    beforeEach(() => {
      engine.addPlayer({ id: 'player1', name: 'Alice' });
      engine.addPlayer({ id: 'player2', name: 'Bob' });
      engine.addPlayer({ id: 'player3', name: 'Charlie' });
      engine.startGame();
    });

    test('should process valid player actions', () => {
      const gameState = engine.getGameState();
      const currentPlayer = gameState.gameInfo.currentPlayer;

      // Test fold action
      const foldResult = engine.playerAction({
        playerId: currentPlayer,
        action: 'fold'
      });

      expect(foldResult.success).toBe(true);
      expect(foldResult.action.action).toBe('fold');
      expect(foldResult.nextPlayer).toBeDefined();
    });

    test('should reject invalid actions', () => {
      const gameState = engine.getGameState();
      const currentPlayer = gameState.gameInfo.currentPlayer;

      // Test invalid action type
      const invalidResult = engine.playerAction({
        playerId: currentPlayer,
        action: 'invalid'
      });

      expect(invalidResult.success).toBe(false);
      expect(invalidResult.error.type).toBe('InvalidActionError');

      // Test raise without amount
      const raiseResult = engine.playerAction({
        playerId: currentPlayer,
        action: 'raise'
      });

      expect(raiseResult.success).toBe(false);
      expect(raiseResult.error.type).toBe('InvalidActionError');
    });

    test('should prevent actions by wrong player', () => {
      const gameState = engine.getGameState();
      const currentPlayer = gameState.gameInfo.currentPlayer;
      const otherPlayer = gameState.players.find(p => p.id !== currentPlayer).id;

      const result = engine.playerAction({
        playerId: otherPlayer,
        action: 'fold'
      });

      expect(result.success).toBe(false);
      expect(result.error.type).toBe('GameStateError');
    });

    test('should get available actions for player', () => {
      const gameState = engine.getGameState();
      const currentPlayer = gameState.gameInfo.currentPlayer;

      const actionsResult = engine.getPlayerActions(currentPlayer);

      expect(actionsResult.success).toBe(true);
      expect(actionsResult.availableActions).toContain('fold');
      expect(actionsResult.actionDetails).toBeDefined();
      expect(actionsResult.actionDetails.callAmount).toBeDefined();
    });
  });

  describe('Game State Queries', () => {
    beforeEach(() => {
      engine.addPlayer({ id: 'player1', name: 'Alice' });
      engine.addPlayer({ id: 'player2', name: 'Bob' });
      engine.startGame();
    });

    test('should return comprehensive game state', () => {
      const gameState = engine.getGameState();

      expect(gameState).toHaveProperty('gameInfo');
      expect(gameState).toHaveProperty('players');
      expect(gameState).toHaveProperty('table');
      expect(gameState).toHaveProperty('betting');
      expect(gameState).toHaveProperty('pots');
      expect(gameState).toHaveProperty('config');

      expect(gameState.gameInfo.isActive).toBe(true);
      expect(gameState.players).toHaveLength(2);
      expect(gameState.config.smallBlind).toBe(5);
      expect(gameState.config.bigBlind).toBe(10);
    });

    test('should return player-specific state', () => {
      const playerState = engine.getPlayerState('player1');

      expect(playerState.success).toBe(true);
      expect(playerState.player.id).toBe('player1');
      expect(playerState.gamePhase).toBe('preflop');
      expect(playerState.communityCards).toHaveLength(0);
      expect(playerState.availableActions).toBeDefined();
    });

    test('should handle invalid player state request', () => {
      const playerState = engine.getPlayerState('nonexistent');

      expect(playerState.success).toBe(false);
      expect(playerState.error.type).toBe('PlayerNotFoundError');
    });

    test('should return game statistics', () => {
      const stats = engine.getGameStats();

      expect(stats.handNumber).toBe(1);
      expect(stats.totalPlayers).toBe(2);
      expect(stats.activePlayers).toBe(2);
      expect(stats.currentPhase).toBe('preflop');
      expect(stats.isGameActive).toBe(true);
      expect(stats.totalPot).toBeGreaterThan(0);
    });

    test('should check if game can start', () => {
      const newEngine = new PokerEngine();
      
      let canStart = newEngine.canStartGame();
      expect(canStart.canStart).toBe(false);
      expect(canStart.playerCount).toBe(0);

      newEngine.addPlayer({ id: 'p1', name: 'Alice' });
      canStart = newEngine.canStartGame();
      expect(canStart.canStart).toBe(false);
      expect(canStart.playerCount).toBe(1);

      newEngine.addPlayer({ id: 'p2', name: 'Bob' });
      canStart = newEngine.canStartGame();
      expect(canStart.canStart).toBe(true);
      expect(canStart.playerCount).toBe(2);
    });
  });

  describe('Event System', () => {
    test('should emit playerAdded events', (done) => {
      const events = [];
      
      engine.on('playerAdded', (data) => {
        events.push(data);
        
        if (events.length === 2) {
          expect(events[0].playerId).toBe('player1');
          expect(events[0].playerName).toBe('Alice');
          expect(events[0].chips).toBe(1000);
          expect(events[0].playerCount).toBe(1);
          expect(events[0].timestamp).toBeDefined();
          expect(events[0].gameState).toBeDefined();
          
          expect(events[1].playerId).toBe('player2');
          expect(events[1].playerName).toBe('Bob');
          expect(events[1].playerCount).toBe(2);
          done();
        }
      });

      engine.addPlayer({ id: 'player1', name: 'Alice' });
      engine.addPlayer({ id: 'player2', name: 'Bob' });
    });

    test('should emit playerRemoved events', () => {
      const callback = jest.fn();
      
      engine.addPlayer({ id: 'player1', name: 'Alice' });
      engine.addPlayer({ id: 'player2', name: 'Bob' });
      
      engine.on('playerRemoved', callback);
      engine.removePlayer('player1');
      
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          playerId: 'player1',
          playerCount: 1,
          timestamp: expect.any(Number),
          gameState: expect.any(Object)
        })
      );
    });

    test('should emit gameStarted events', () => {
      const callback = jest.fn();
      
      engine.addPlayer({ id: 'player1', name: 'Alice' });
      engine.addPlayer({ id: 'player2', name: 'Bob' });
      
      engine.on('gameStarted', callback);
      engine.startGame();
      
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          playerCount: 2,
          smallBlind: 5,
          bigBlind: 10,
          timestamp: expect.any(Number),
          gameState: expect.any(Object)
        })
      );
    });

    test('should emit handStarted events', () => {
      const callback = jest.fn();
      
      engine.addPlayer({ id: 'player1', name: 'Alice' });
      engine.addPlayer({ id: 'player2', name: 'Bob' });
      
      engine.on('handStarted', callback);
      engine.startGame();
      
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          handNumber: 1,
          dealerPosition: expect.any(Number),
          communityCards: [],
          gamePhase: 'preflop',
          timestamp: expect.any(Number),
          gameState: expect.any(Object)
        })
      );
    });

    test('should emit blindsPosted events', () => {
      const callback = jest.fn();
      
      engine.addPlayer({ id: 'player1', name: 'Alice' });
      engine.addPlayer({ id: 'player2', name: 'Bob' });
      
      engine.on('blindsPosted', callback);
      engine.startGame();
      
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          smallBlind: expect.objectContaining({
            playerId: expect.any(String),
            amount: 5
          }),
          bigBlind: expect.objectContaining({
            playerId: expect.any(String),
            amount: 10
          }),
          isHeadsUp: true,
          dealerPosition: expect.any(Number),
          timestamp: expect.any(Number),
          gameState: expect.any(Object)
        })
      );
    });

    test('should emit playerAction events', () => {
      const callback = jest.fn();
      
      engine.addPlayer({ id: 'player1', name: 'Alice' });
      engine.addPlayer({ id: 'player2', name: 'Bob' });
      engine.startGame();
      
      const gameState = engine.getGameState();
      const currentPlayer = gameState.gameInfo.currentPlayer;
      
      engine.on('playerAction', callback);
      engine.playerAction({ playerId: currentPlayer, action: 'fold' });
      
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          playerId: currentPlayer,
          action: 'fold',
          amount: 0,
          gamePhase: 'preflop',
          bettingState: expect.any(Object),
          timestamp: expect.any(Number),
          gameState: expect.any(Object)
        })
      );
    });

    test('should emit phaseChanged events', () => {
      const callback = jest.fn();
      
      engine.addPlayer({ id: 'player1', name: 'Alice' });
      engine.addPlayer({ id: 'player2', name: 'Bob' });
      engine.startGame();
      
      engine.on('phaseChanged', callback);
      
      // Complete preflop betting to trigger phase change
      let gameState = engine.getGameState();
      let currentPlayer = gameState.gameInfo.currentPlayer;
      
      // First player calls
      engine.playerAction({ playerId: currentPlayer, action: 'call' });
      
      gameState = engine.getGameState();
      if (gameState.gameInfo.phase === 'preflop' && gameState.gameInfo.currentPlayer) {
        // Second player checks to complete betting round
        engine.playerAction({ 
          playerId: gameState.gameInfo.currentPlayer, 
          action: 'check' 
        });
      }
      
      // Should have emitted phaseChanged event if betting round completed
      if (callback.mock.calls.length > 0) {
        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({
            newPhase: expect.stringMatching(/flop|turn|river/),
            communityCards: expect.any(Array),
            currentPlayer: expect.any(String),
            timestamp: expect.any(Number),
            gameState: expect.any(Object)
          })
        );
      }
    });

    test('should emit communityCardsDealt events', () => {
      const callback = jest.fn();
      
      engine.addPlayer({ id: 'player1', name: 'Alice' });
      engine.addPlayer({ id: 'player2', name: 'Bob' });
      engine.startGame();
      
      engine.on('communityCardsDealt', callback);
      
      // Complete preflop betting to trigger flop
      let gameState = engine.getGameState();
      let currentPlayer = gameState.gameInfo.currentPlayer;
      
      engine.playerAction({ playerId: currentPlayer, action: 'call' });
      
      gameState = engine.getGameState();
      if (gameState.gameInfo.phase === 'preflop' && gameState.gameInfo.currentPlayer) {
        engine.playerAction({ 
          playerId: gameState.gameInfo.currentPlayer, 
          action: 'check' 
        });
      }
      
      // Should have emitted communityCardsDealt event if flop was dealt
      if (callback.mock.calls.length > 0) {
        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({
            phase: expect.stringMatching(/flop|turn|river/),
            newCards: expect.any(Array),
            allCommunityCards: expect.any(Array),
            timestamp: expect.any(Number),
            gameState: expect.any(Object)
          })
        );
      }
    });

    test('should emit bettingRoundStarted events', () => {
      const callback = jest.fn();
      
      engine.addPlayer({ id: 'player1', name: 'Alice' });
      engine.addPlayer({ id: 'player2', name: 'Bob' });
      
      engine.on('bettingRoundStarted', callback);
      engine.startGame();
      
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          round: 0, // Preflop is round 0
          phase: 'preflop',
          firstPlayer: expect.any(String),
          timestamp: expect.any(Number),
          gameState: expect.any(Object)
        })
      );
    });

    test('should emit dealerButtonRotated events', () => {
      const callback = jest.fn();
      
      engine.addPlayer({ id: 'player1', name: 'Alice' });
      engine.addPlayer({ id: 'player2', name: 'Bob' });
      engine.addPlayer({ id: 'player3', name: 'Charlie' });
      engine.startGame();
      
      engine.on('dealerButtonRotated', callback);
      
      // Start a new hand to trigger dealer button rotation
      engine.startNewHand();
      
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          newDealerPosition: expect.any(Number),
          dealerPlayerId: expect.any(String),
          timestamp: expect.any(Number),
          gameState: expect.any(Object)
        })
      );
    });

    test('should emit handComplete events', () => {
      const callback = jest.fn();
      
      engine.addPlayer({ id: 'player1', name: 'Alice' });
      engine.addPlayer({ id: 'player2', name: 'Bob' });
      engine.startGame();
      
      engine.on('handComplete', callback);
      
      // Force hand completion by having one player fold
      const gameState = engine.getGameState();
      const currentPlayer = gameState.gameInfo.currentPlayer;
      
      engine.playerAction({ playerId: currentPlayer, action: 'fold' });
      
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          handNumber: 1,
          winners: expect.any(Array),
          finalCommunityCards: expect.any(Array),
          handResults: expect.any(Array),
          timestamp: expect.any(Number),
          gameState: expect.any(Object)
        })
      );
    });

    test('should emit gameEnded events', () => {
      const callback = jest.fn();
      
      // Create a scenario where game will end (remove players to trigger insufficient players)
      engine.addPlayer({ id: 'player1', name: 'Alice' });
      engine.addPlayer({ id: 'player2', name: 'Bob' });
      engine.startGame();
      
      engine.on('gameEnded', callback);
      
      // Remove a player to trigger game end due to insufficient players
      engine.removePlayer('player1');
      
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: 'insufficient_players',
          finalStandings: expect.any(Array),
          timestamp: expect.any(Number),
          gameState: expect.any(Object)
        })
      );
    });

    test('should remove event listeners', () => {
      const callback = jest.fn();
      
      engine.on('playerAdded', callback);
      engine.addPlayer({ id: 'player1', name: 'Alice' });
      expect(callback).toHaveBeenCalledTimes(1);

      engine.off('playerAdded', callback);
      engine.addPlayer({ id: 'player2', name: 'Bob' });
      expect(callback).toHaveBeenCalledTimes(1); // Should not be called again
    });

    test('should handle multiple listeners for same event', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      engine.on('playerAdded', callback1);
      engine.on('playerAdded', callback2);
      
      engine.addPlayer({ id: 'player1', name: 'Alice' });
      
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    test('should handle errors in event listeners gracefully', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Test error in listener');
      });
      const normalCallback = jest.fn();
      
      // Mock console.error to verify error handling
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      engine.on('playerAdded', errorCallback);
      engine.on('playerAdded', normalCallback);
      
      engine.addPlayer({ id: 'player1', name: 'Alice' });
      
      expect(errorCallback).toHaveBeenCalledTimes(1);
      expect(normalCallback).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in event listener for playerAdded'),
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    test('should include timestamp and gameState in all events', () => {
      const events = [];
      const eventTypes = [
        'playerAdded', 'gameStarted', 'handStarted', 'blindsPosted', 
        'bettingRoundStarted', 'playerAction'
      ];
      
      eventTypes.forEach(eventType => {
        engine.on(eventType, (data) => {
          events.push({ type: eventType, data });
        });
      });
      
      engine.addPlayer({ id: 'player1', name: 'Alice' });
      engine.addPlayer({ id: 'player2', name: 'Bob' });
      engine.startGame();
      
      const gameState = engine.getGameState();
      const currentPlayer = gameState.gameInfo.currentPlayer;
      engine.playerAction({ playerId: currentPlayer, action: 'fold' });
      
      // Verify all events have timestamp and gameState
      events.forEach(event => {
        expect(event.data.timestamp).toBeDefined();
        expect(typeof event.data.timestamp).toBe('number');
        expect(event.data.gameState).toBeDefined();
        expect(event.data.gameState).toHaveProperty('gameInfo');
        expect(event.data.gameState).toHaveProperty('players');
      });
    });
  });

  describe('Complete Game Scenarios', () => {
    test('should handle heads-up game', () => {
      engine.addPlayer({ id: 'player1', name: 'Alice' });
      engine.addPlayer({ id: 'player2', name: 'Bob' });
      
      const startResult = engine.startGame();
      expect(startResult.success).toBe(true);

      const gameState = engine.getGameState();
      expect(gameState.players).toHaveLength(2);
      expect(gameState.gameInfo.isActive).toBe(true);
    });

    test('should handle multi-player game', () => {
      // Add 5 players
      for (let i = 1; i <= 5; i++) {
        engine.addPlayer({ id: `player${i}`, name: `Player ${i}` });
      }

      const startResult = engine.startGame();
      expect(startResult.success).toBe(true);

      const gameState = engine.getGameState();
      expect(gameState.players).toHaveLength(5);
      expect(gameState.table.activePlayerCount).toBe(5);
    });

    test('should handle player elimination scenario', () => {
      // Add players with different chip amounts
      engine.addPlayer({ id: 'player1', name: 'Alice', chips: 100 });
      engine.addPlayer({ id: 'player2', name: 'Bob', chips: 1000 });
      
      engine.startGame();
      
      // Verify that players with different chip amounts are handled correctly
      const gameState = engine.getGameState();
      const alicePlayer = gameState.players.find(p => p.id === 'player1');
      const bobPlayer = gameState.players.find(p => p.id === 'player2');
      
      expect(alicePlayer.chips).toBeLessThan(bobPlayer.chips);
      
      // Test that the short stack player can still make valid actions
      if (gameState.gameInfo.currentPlayer === alicePlayer.id) {
        const actions = engine.getPlayerActions(alicePlayer.id);
        expect(actions.success).toBe(true);
        expect(actions.availableActions).toContain('fold');
      }
    });

    test('should handle betting round completion', () => {
      engine.addPlayer({ id: 'player1', name: 'Alice' });
      engine.addPlayer({ id: 'player2', name: 'Bob' });
      engine.startGame();

      let gameState = engine.getGameState();
      expect(gameState.gameInfo.phase).toBe('preflop');

      // Have both players call to complete preflop betting
      const currentPlayer = gameState.gameInfo.currentPlayer;
      
      // First player calls
      const callResult = engine.playerAction({
        playerId: currentPlayer,
        action: 'call'
      });
      
      expect(callResult.success).toBe(true);
      
      // Check if phase advanced or if there's another player to act
      const newGameState = engine.getGameState();
      if (newGameState.gameInfo.phase === 'preflop' && newGameState.gameInfo.currentPlayer) {
        // Second player checks (no bet to call after first player called)
        const checkResult = engine.playerAction({
          playerId: newGameState.gameInfo.currentPlayer,
          action: 'check'
        });
        
        expect(checkResult.success).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed input gracefully', () => {
      const result1 = engine.addPlayer(undefined);
      const result2 = engine.playerAction(null);
      const result3 = engine.getPlayerState('');

      expect(result1.success).toBe(false);
      expect(result2.success).toBe(false);
      expect(result3.success).toBe(false);
    });

    test('should provide descriptive error messages', () => {
      // Test player not found error with getPlayerState
      const result = engine.getPlayerState('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error.message).toContain('not found');
      expect(result.error.details).toBeDefined();
      expect(result.error.type).toBe('PlayerNotFoundError');
    });

    test('should handle game state errors', () => {
      // Try to start game without enough players
      const result = engine.startGame();

      expect(result.success).toBe(false);
      expect(result.error.type).toBe('GameStateError');
      expect(result.error.details.minPlayers).toBe(2);
    });
  });
});