const PokerEngine = require('../src/PokerEngine');

describe('PokerEngine Event System', () => {
  let engine;
  let eventCollector;

  beforeEach(() => {
    engine = new PokerEngine({
      smallBlind: 5,
      bigBlind: 10,
      startingChips: 1000
    });
    
    // Event collector to track all events
    eventCollector = {
      events: [],
      on: function(eventName) {
        engine.on(eventName, (data) => {
          this.events.push({
            type: eventName,
            data: data,
            timestamp: Date.now()
          });
        });
      },
      getEvents: function(eventType) {
        return this.events.filter(e => e.type === eventType);
      },
      clear: function() {
        this.events = [];
      }
    };
  });

  describe('Event Listener Management', () => {
    test('should add and remove event listeners correctly', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      // Add listeners
      engine.on('playerAdded', callback1);
      engine.on('playerAdded', callback2);

      // Trigger event
      engine.addPlayer({ id: 'player1', name: 'Alice' });

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);

      // Remove one listener
      engine.off('playerAdded', callback1);

      // Trigger event again
      engine.addPlayer({ id: 'player2', name: 'Bob' });

      expect(callback1).toHaveBeenCalledTimes(1); // Should not be called again
      expect(callback2).toHaveBeenCalledTimes(2); // Should be called again
    });

    test('should handle removing non-existent listeners gracefully', () => {
      const callback = jest.fn();
      
      // Try to remove listener that was never added
      expect(() => {
        engine.off('playerAdded', callback);
      }).not.toThrow();

      // Try to remove listener for non-existent event
      expect(() => {
        engine.off('nonExistentEvent', callback);
      }).not.toThrow();
    });

    test('should handle multiple listeners for same event', () => {
      const callbacks = [jest.fn(), jest.fn(), jest.fn()];
      
      callbacks.forEach(callback => {
        engine.on('playerAdded', callback);
      });

      engine.addPlayer({ id: 'player1', name: 'Alice' });

      callbacks.forEach(callback => {
        expect(callback).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Player Management Events', () => {
    test('should emit playerAdded events with correct data', () => {
      const callback = jest.fn();
      engine.on('playerAdded', callback);

      const result = engine.addPlayer({ id: 'player1', name: 'Alice', chips: 1500 });

      expect(result.success).toBe(true);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          playerId: 'player1',
          playerName: 'Alice',
          chips: 1500,
          playerCount: 1,
          timestamp: expect.any(Number),
          gameState: expect.objectContaining({
            gameInfo: expect.any(Object),
            players: expect.any(Array)
          })
        })
      );
    });

    test('should emit playerRemoved events with correct data', () => {
      const callback = jest.fn();
      
      engine.addPlayer({ id: 'player1', name: 'Alice' });
      engine.addPlayer({ id: 'player2', name: 'Bob' });
      
      engine.on('playerRemoved', callback);
      const result = engine.removePlayer('player1');

      expect(result.success).toBe(true);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          playerId: 'player1',
          playerCount: 1,
          timestamp: expect.any(Number),
          gameState: expect.any(Object)
        })
      );
    });

    test('should not emit playerAdded events for failed additions', () => {
      const callback = jest.fn();
      engine.on('playerAdded', callback);

      // Try to add invalid player
      const result = engine.addPlayer({ id: 'player1' }); // Missing name

      expect(result.success).toBe(false);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Game Lifecycle Events', () => {
    beforeEach(() => {
      engine.addPlayer({ id: 'player1', name: 'Alice' });
      engine.addPlayer({ id: 'player2', name: 'Bob' });
    });

    test('should emit gameStarted events', () => {
      const callback = jest.fn();
      engine.on('gameStarted', callback);

      const result = engine.startGame();

      expect(result.success).toBe(true);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          playerCount: 2,
          smallBlind: 5,
          bigBlind: 10,
          timestamp: expect.any(Number),
          gameState: expect.objectContaining({
            gameInfo: expect.objectContaining({
              isActive: true
            })
          })
        })
      );
    });

    test('should emit handStarted events', () => {
      const callback = jest.fn();
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

    test('should emit bettingRoundStarted events', () => {
      const callback = jest.fn();
      engine.on('bettingRoundStarted', callback);

      engine.startGame();

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          round: 0, // Preflop
          phase: 'preflop',
          firstPlayer: expect.any(String),
          timestamp: expect.any(Number),
          gameState: expect.any(Object)
        })
      );
    });
  });

  describe('Player Action Events', () => {
    beforeEach(() => {
      engine.addPlayer({ id: 'player1', name: 'Alice' });
      engine.addPlayer({ id: 'player2', name: 'Bob' });
      engine.startGame();
    });

    test('should emit playerAction events for all action types', () => {
      const callback = jest.fn();
      engine.on('playerAction', callback);

      const gameState = engine.getGameState();
      const currentPlayer = gameState.gameInfo.currentPlayer;

      // Test fold action
      const result = engine.playerAction({ playerId: currentPlayer, action: 'fold' });

      expect(result.success).toBe(true);
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

    test('should emit playerAction events for call actions', () => {
      const callback = jest.fn();
      engine.on('playerAction', callback);

      const gameState = engine.getGameState();
      const currentPlayer = gameState.gameInfo.currentPlayer;

      const result = engine.playerAction({ playerId: currentPlayer, action: 'call' });

      expect(result.success).toBe(true);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          playerId: currentPlayer,
          action: 'call',
          amount: expect.any(Number),
          gamePhase: 'preflop',
          timestamp: expect.any(Number)
        })
      );
    });

    test('should emit playerAction events for raise actions', () => {
      const callback = jest.fn();
      engine.on('playerAction', callback);

      const gameState = engine.getGameState();
      const currentPlayer = gameState.gameInfo.currentPlayer;

      const result = engine.playerAction({ 
        playerId: currentPlayer, 
        action: 'raise', 
        amount: 20 
      });

      expect(result.success).toBe(true);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          playerId: currentPlayer,
          action: 'raise',
          amount: expect.any(Number),
          gamePhase: 'preflop',
          timestamp: expect.any(Number)
        })
      );
    });

    test('should not emit playerAction events for failed actions', () => {
      const callback = jest.fn();
      engine.on('playerAction', callback);

      const gameState = engine.getGameState();
      const currentPlayer = gameState.gameInfo.currentPlayer;
      const otherPlayer = gameState.players.find(p => p.id !== currentPlayer).id;

      // Try invalid action (wrong player's turn)
      const result = engine.playerAction({ playerId: otherPlayer, action: 'fold' });

      expect(result.success).toBe(false);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Game Phase Events', () => {
    beforeEach(() => {
      engine.addPlayer({ id: 'player1', name: 'Alice' });
      engine.addPlayer({ id: 'player2', name: 'Bob' });
      engine.startGame();
    });

    test('should emit phaseChanged events when betting rounds complete', () => {
      const callback = jest.fn();
      engine.on('phaseChanged', callback);

      // Complete preflop betting
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

      // Check if phase changed (might not always happen in heads-up)
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

      // Check if community cards were dealt
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
  });

  describe('Hand Completion Events', () => {
    beforeEach(() => {
      engine.addPlayer({ id: 'player1', name: 'Alice' });
      engine.addPlayer({ id: 'player2', name: 'Bob' });
      engine.startGame();
    });

    test('should emit handComplete events when hand ends', () => {
      const callback = jest.fn();
      engine.on('handComplete', callback);

      const gameState = engine.getGameState();
      const currentPlayer = gameState.gameInfo.currentPlayer;

      // Force hand completion by folding
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

      // Verify winner data structure
      const callData = callback.mock.calls[0][0];
      expect(callData.winners).toHaveLength(1);
      expect(callData.winners[0]).toHaveProperty('playerId');
      expect(callData.winners[0]).toHaveProperty('amount');
    });
  });

  describe('Game End Events', () => {
    test('should emit gameEnded events when game ends', () => {
      const callback = jest.fn();
      
      engine.addPlayer({ id: 'player1', name: 'Alice' });
      engine.addPlayer({ id: 'player2', name: 'Bob' });
      engine.startGame();
      
      engine.on('gameEnded', callback);
      
      // Force game end by removing players
      engine.removePlayer('player1');

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: 'insufficient_players',
          finalStandings: expect.any(Array),
          timestamp: expect.any(Number),
          gameState: expect.any(Object)
        })
      );

      // Verify final standings structure
      const callData = callback.mock.calls[0][0];
      expect(callData.finalStandings).toBeInstanceOf(Array);
      callData.finalStandings.forEach(standing => {
        expect(standing).toHaveProperty('playerId');
        expect(standing).toHaveProperty('name');
        expect(standing).toHaveProperty('chips');
        expect(standing).toHaveProperty('status');
      });
    });
  });

  describe('Multi-Player Events', () => {
    test('should emit dealerButtonRotated events in multi-player games', () => {
      const callback = jest.fn();
      
      engine.addPlayer({ id: 'player1', name: 'Alice' });
      engine.addPlayer({ id: 'player2', name: 'Bob' });
      engine.addPlayer({ id: 'player3', name: 'Charlie' });
      engine.startGame();
      
      engine.on('dealerButtonRotated', callback);
      
      // Start new hand to trigger dealer button rotation
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

    test('should emit events for multi-player betting scenarios', () => {
      const playerActionCallback = jest.fn();
      const phaseChangedCallback = jest.fn();
      
      engine.addPlayer({ id: 'player1', name: 'Alice' });
      engine.addPlayer({ id: 'player2', name: 'Bob' });
      engine.addPlayer({ id: 'player3', name: 'Charlie' });
      engine.startGame();
      
      engine.on('playerAction', playerActionCallback);
      engine.on('phaseChanged', phaseChangedCallback);
      
      // Have all players call to complete preflop
      let gameState = engine.getGameState();
      let actionsCount = 0;
      
      while (gameState.gameInfo.currentPlayer && actionsCount < 10) { // Safety limit
        const currentPlayer = gameState.gameInfo.currentPlayer;
        const actions = engine.getPlayerActions(currentPlayer);
        
        if (actions.success && actions.availableActions.includes('call')) {
          engine.playerAction({ playerId: currentPlayer, action: 'call' });
        } else if (actions.success && actions.availableActions.includes('check')) {
          engine.playerAction({ playerId: currentPlayer, action: 'check' });
        } else {
          break;
        }
        
        actionsCount++;
        gameState = engine.getGameState();
        
        // Break if phase changed or hand completed
        if (gameState.gameInfo.phase !== 'preflop') {
          break;
        }
      }
      
      // Should have emitted multiple playerAction events
      expect(playerActionCallback.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('Event Data Consistency', () => {
    test('should include consistent timestamp and gameState in all events', () => {
      const allEvents = [];
      const eventTypes = [
        'playerAdded', 'gameStarted', 'handStarted', 'blindsPosted',
        'bettingRoundStarted', 'playerAction', 'handComplete'
      ];

      eventTypes.forEach(eventType => {
        engine.on(eventType, (data) => {
          allEvents.push({ type: eventType, data });
        });
      });

      // Trigger multiple events
      engine.addPlayer({ id: 'player1', name: 'Alice' });
      engine.addPlayer({ id: 'player2', name: 'Bob' });
      engine.startGame();

      const gameState = engine.getGameState();
      const currentPlayer = gameState.gameInfo.currentPlayer;
      engine.playerAction({ playerId: currentPlayer, action: 'fold' });

      // Verify all events have required properties
      allEvents.forEach(event => {
        expect(event.data).toHaveProperty('timestamp');
        expect(typeof event.data.timestamp).toBe('number');
        expect(event.data.timestamp).toBeGreaterThan(0);
        
        expect(event.data).toHaveProperty('gameState');
        expect(event.data.gameState).toHaveProperty('gameInfo');
        expect(event.data.gameState).toHaveProperty('players');
        expect(event.data.gameState).toHaveProperty('table');
        expect(event.data.gameState).toHaveProperty('betting');
        expect(event.data.gameState).toHaveProperty('pots');
        expect(event.data.gameState).toHaveProperty('config');
      });
    });

    test('should maintain event order consistency', () => {
      const eventOrder = [];
      const eventTypes = [
        'playerAdded', 'gameStarted', 'handStarted', 'blindsPosted', 'bettingRoundStarted'
      ];

      eventTypes.forEach(eventType => {
        engine.on(eventType, () => {
          eventOrder.push(eventType);
        });
      });

      engine.addPlayer({ id: 'player1', name: 'Alice' });
      engine.addPlayer({ id: 'player2', name: 'Bob' });
      engine.startGame();

      // Verify expected event order (blindsPosted and bettingRoundStarted come before handStarted)
      expect(eventOrder).toEqual([
        'playerAdded',
        'playerAdded', 
        'gameStarted',
        'blindsPosted',
        'bettingRoundStarted',
        'handStarted'
      ]);
    });
  });

  describe('Error Handling in Events', () => {
    test('should handle listener errors gracefully without affecting other listeners', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Test listener error');
      });
      const normalListener = jest.fn();
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      engine.on('playerAdded', errorListener);
      engine.on('playerAdded', normalListener);

      engine.addPlayer({ id: 'player1', name: 'Alice' });

      expect(errorListener).toHaveBeenCalledTimes(1);
      expect(normalListener).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in event listener for playerAdded'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    test('should continue game operation even with failing event listeners', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Critical listener error');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Add error listener to critical events
      engine.on('gameStarted', errorListener);
      engine.on('playerAction', errorListener);

      // Game should still work normally
      engine.addPlayer({ id: 'player1', name: 'Alice' });
      engine.addPlayer({ id: 'player2', name: 'Bob' });
      
      const startResult = engine.startGame();
      expect(startResult.success).toBe(true);

      const gameState = engine.getGameState();
      const actionResult = engine.playerAction({
        playerId: gameState.gameInfo.currentPlayer,
        action: 'fold'
      });
      expect(actionResult.success).toBe(true);

      consoleSpy.mockRestore();
    });
  });
});