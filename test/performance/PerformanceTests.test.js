const PokerEngine = require('../../src/PokerEngine');
const { HandEvaluator } = require('../../src/utilities/HandEvaluator');
const Card = require('../../src/models/Card');
const { memoryManager } = require('../../src/utilities/MemoryManager');

describe('Poker Engine Performance Tests', () => {
  let engine;

  beforeEach(() => {
    engine = new PokerEngine({
      smallBlind: 10,
      bigBlind: 20,
      startingChips: 10000
    });
    
    // Clear caches before each test
    HandEvaluator.clearCache();
    memoryManager.resetStats();
  });

  afterEach(() => {
    // Cleanup after each test
    memoryManager.cleanup();
  });

  describe('Hand Evaluation Performance', () => {
    test('should evaluate hands efficiently with caching', () => {
      const testCards = [
        new Card('hearts', 'A'),
        new Card('spades', 'K'),
        new Card('diamonds', 'Q'),
        new Card('clubs', 'J'),
        new Card('hearts', '10'),
        new Card('spades', '9'),
        new Card('diamonds', '8')
      ];

      const iterations = 1000;
      const startTime = process.hrtime.bigint();

      // First run - should populate cache
      for (let i = 0; i < iterations; i++) {
        HandEvaluator.evaluateHand(testCards);
      }

      const midTime = process.hrtime.bigint();

      // Second run - should hit cache
      for (let i = 0; i < iterations; i++) {
        HandEvaluator.evaluateHand(testCards);
      }

      const endTime = process.hrtime.bigint();

      const firstRunTime = Number(midTime - startTime) / 1000000; // Convert to ms
      const secondRunTime = Number(endTime - midTime) / 1000000;

      // Second run should be faster due to caching (but timing can vary)
      // We'll be more lenient with the performance expectation
      expect(secondRunTime).toBeLessThan(firstRunTime * 0.8);

      const cacheStats = HandEvaluator.getCacheStats();
      expect(cacheStats.hits).toBeGreaterThan(0);
      expect(cacheStats.hitRate).toBeGreaterThan(0.5);

      console.log(`Hand evaluation performance:
        First run (${iterations} iterations): ${firstRunTime.toFixed(2)}ms
        Second run (${iterations} iterations): ${secondRunTime.toFixed(2)}ms
        Cache hit rate: ${(cacheStats.hitRate * 100).toFixed(1)}%
        Speed improvement: ${(firstRunTime / secondRunTime).toFixed(1)}x`);
    });

    test('should handle large numbers of unique hand evaluations', () => {
      const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
      const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
      const iterations = 500;
      
      const startTime = process.hrtime.bigint();

      for (let i = 0; i < iterations; i++) {
        // Generate random 7-card hands
        const cards = [];
        const usedCards = new Set();
        
        while (cards.length < 7) {
          const suit = suits[Math.floor(Math.random() * suits.length)];
          const rank = ranks[Math.floor(Math.random() * ranks.length)];
          const cardKey = `${suit}-${rank}`;
          
          if (!usedCards.has(cardKey)) {
            cards.push(new Card(suit, rank));
            usedCards.add(cardKey);
          }
        }
        
        HandEvaluator.evaluateHand(cards);
      }

      const endTime = process.hrtime.bigint();
      const totalTime = Number(endTime - startTime) / 1000000;
      const avgTime = totalTime / iterations;

      expect(avgTime).toBeLessThan(5); // Should average less than 5ms per evaluation

      const cacheStats = HandEvaluator.getCacheStats();
      console.log(`Random hand evaluation performance:
        ${iterations} unique hands: ${totalTime.toFixed(2)}ms
        Average per hand: ${avgTime.toFixed(3)}ms
        Cache size: ${cacheStats.size}
        Cache hit rate: ${(cacheStats.hitRate * 100).toFixed(1)}%`);
    });
  });

  describe('Large Player Count Performance', () => {
    test('should handle 20+ players efficiently', () => {
      // Use a fresh engine with higher max players
      const largeEngine = new PokerEngine({
        smallBlind: 10,
        bigBlind: 20,
        startingChips: 10000,
        maxPlayers: 23
      });
      
      const playerCount = 23; // Maximum typical poker table size
      const startTime = process.hrtime.bigint();

      // Add players
      for (let i = 1; i <= playerCount; i++) {
        const result = largeEngine.addPlayer({
          id: `player${i}`,
          name: `Player ${i}`,
          chips: 10000
        });
        expect(result.success).toBe(true);
      }

      const addPlayersTime = process.hrtime.bigint();

      // Start game
      const startResult = largeEngine.startGame();
      expect(startResult.success).toBe(true);

      const startGameTime = process.hrtime.bigint();

      // Simulate betting round with all players
      let gameState = largeEngine.getGameState();
      let actionCount = 0;
      const maxActions = playerCount * 2; // Safety limit

      while (gameState.gameInfo.currentPlayer && actionCount < maxActions) {
        const currentPlayer = gameState.gameInfo.currentPlayer;
        const actions = largeEngine.getPlayerActions(currentPlayer);
        
        if (actions.success && actions.availableActions.length > 0) {
          // Simple strategy: fold every 4th player, others call/check
          const action = (actionCount % 4 === 3) ? 'fold' : 
                        actions.availableActions.includes('call') ? 'call' :
                        actions.availableActions.includes('check') ? 'check' : 'fold';
          
          const result = largeEngine.playerAction({ playerId: currentPlayer, action });
          expect(result.success).toBe(true);
          
          if (result.handComplete) break;
        }
        
        gameState = largeEngine.getGameState();
        actionCount++;
      }

      const endTime = process.hrtime.bigint();

      const addTime = Number(addPlayersTime - startTime) / 1000000;
      const startTime_ms = Number(startGameTime - addPlayersTime) / 1000000;
      const bettingTime = Number(endTime - startGameTime) / 1000000;
      const totalTime = Number(endTime - startTime) / 1000000;

      // Performance expectations
      expect(addTime).toBeLessThan(50); // Adding players should be fast
      expect(startTime_ms).toBeLessThan(100); // Starting game should be fast
      expect(bettingTime).toBeLessThan(200); // Betting round should be reasonable
      expect(totalTime).toBeLessThan(300); // Total should be under 300ms

      console.log(`Large player count performance (${playerCount} players):
        Adding players: ${addTime.toFixed(2)}ms
        Starting game: ${startTime_ms.toFixed(2)}ms
        Betting round (${actionCount} actions): ${bettingTime.toFixed(2)}ms
        Total time: ${totalTime.toFixed(2)}ms`);
    });

    test('should maintain performance with multiple hands', () => {
      const playerCount = 10;
      const handCount = 5;

      // Add players
      for (let i = 1; i <= playerCount; i++) {
        engine.addPlayer({
          id: `player${i}`,
          name: `Player ${i}`,
          chips: 50000
        });
      }

      engine.startGame();

      const handTimes = [];

      for (let hand = 0; hand < handCount; hand++) {
        const handStart = process.hrtime.bigint();

        if (hand > 0) {
          // Start new hand
          const newHandResult = engine.startNewHand();
          if (!newHandResult.success) break;
        }

        // Play out the hand quickly
        let gameState = engine.getGameState();
        let actionCount = 0;
        const maxActions = playerCount * 3;

        while (gameState.gameInfo.currentPlayer && actionCount < maxActions) {
          const currentPlayer = gameState.gameInfo.currentPlayer;
          const actions = engine.getPlayerActions(currentPlayer);
          
          if (actions.success && actions.availableActions.length > 0) {
            // Quick resolution: most players fold
            const action = (actionCount < 2) ? 
              (actions.availableActions.includes('call') ? 'call' : 'check') : 'fold';
            
            const result = engine.playerAction({ playerId: currentPlayer, action });
            if (result.success && result.handComplete) break;
          }
          
          gameState = engine.getGameState();
          actionCount++;
        }

        const handEnd = process.hrtime.bigint();
        const handTime = Number(handEnd - handStart) / 1000000;
        handTimes.push(handTime);
      }

      const avgHandTime = handTimes.reduce((a, b) => a + b, 0) / handTimes.length;
      const maxHandTime = Math.max(...handTimes);
      const minHandTime = Math.min(...handTimes);

      // Performance should be consistent across hands
      expect(avgHandTime).toBeLessThan(100);
      expect(maxHandTime - minHandTime).toBeLessThan(avgHandTime * 2); // Variance should be reasonable (relaxed)

      console.log(`Multiple hands performance (${handCount} hands, ${playerCount} players):
        Average hand time: ${avgHandTime.toFixed(2)}ms
        Min hand time: ${minHandTime.toFixed(2)}ms
        Max hand time: ${maxHandTime.toFixed(2)}ms
        Time variance: ${(maxHandTime - minHandTime).toFixed(2)}ms`);
    });
  });

  describe('Memory Usage Performance', () => {
    test('should manage memory efficiently during extended play', () => {
      const playerCount = 8;
      const handCount = 10;

      // Add players
      for (let i = 1; i <= playerCount; i++) {
        engine.addPlayer({
          id: `player${i}`,
          name: `Player ${i}`,
          chips: 100000
        });
      }

      engine.startGame();

      const initialMemory = process.memoryUsage();
      let maxMemoryIncrease = 0;

      for (let hand = 0; hand < handCount; hand++) {
        if (hand > 0) {
          engine.startNewHand();
        }

        // Play hand with some complexity
        let gameState = engine.getGameState();
        let actionCount = 0;

        while (gameState.gameInfo.currentPlayer && actionCount < 30) {
          const currentPlayer = gameState.gameInfo.currentPlayer;
          const actions = engine.getPlayerActions(currentPlayer);
          
          if (actions.success && actions.availableActions.length > 0) {
            const action = actions.availableActions.includes('fold') ? 'fold' : 
                          actions.availableActions[0];
            
            const result = engine.playerAction({ playerId: currentPlayer, action });
            if (result.success && result.handComplete) break;
          }
          
          gameState = engine.getGameState();
          actionCount++;
        }

        // Check memory usage
        const currentMemory = process.memoryUsage();
        const memoryIncrease = currentMemory.heapUsed - initialMemory.heapUsed;
        maxMemoryIncrease = Math.max(maxMemoryIncrease, memoryIncrease);

        // Trigger cleanup periodically
        if (hand % 3 === 0) {
          memoryManager.cleanup();
        }
      }

      const finalMemory = process.memoryUsage();
      const totalMemoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Memory increase should be reasonable
      expect(totalMemoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
      expect(maxMemoryIncrease).toBeLessThan(100 * 1024 * 1024); // Peak less than 100MB

      const memoryStats = memoryManager.getMemoryStats();
      const cacheStats = HandEvaluator.getCacheStats();

      console.log(`Memory usage performance (${handCount} hands, ${playerCount} players):
        Initial heap: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB
        Final heap: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB
        Total increase: ${(totalMemoryIncrease / 1024 / 1024).toFixed(2)}MB
        Max increase: ${(maxMemoryIncrease / 1024 / 1024).toFixed(2)}MB
        Cache size: ${cacheStats.size} entries
        Cache memory: ${(cacheStats.memoryUsage / 1024).toFixed(2)}KB`);
    });

    test('should handle cache optimization effectively', () => {
      // Generate many different hands to fill cache
      const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
      const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
      const iterations = 2000;

      for (let i = 0; i < iterations; i++) {
        const cards = [];
        const usedCards = new Set();
        
        while (cards.length < 7) {
          const suit = suits[Math.floor(Math.random() * suits.length)];
          const rank = ranks[Math.floor(Math.random() * ranks.length)];
          const cardKey = `${suit}-${rank}`;
          
          if (!usedCards.has(cardKey)) {
            cards.push(new Card(suit, rank));
            usedCards.add(cardKey);
          }
        }
        
        HandEvaluator.evaluateHand(cards);
      }

      const beforeOptimization = HandEvaluator.getCacheStats();
      
      // Optimize cache
      HandEvaluator.optimizeCache();
      
      const afterOptimization = HandEvaluator.getCacheStats();

      expect(afterOptimization.size).toBeLessThanOrEqual(beforeOptimization.size);
      expect(afterOptimization.memoryUsage).toBeLessThanOrEqual(beforeOptimization.memoryUsage);

      console.log(`Cache optimization performance:
        Before: ${beforeOptimization.size} entries, ${(beforeOptimization.memoryUsage / 1024).toFixed(2)}KB
        After: ${afterOptimization.size} entries, ${(afterOptimization.memoryUsage / 1024).toFixed(2)}KB
        Reduction: ${beforeOptimization.size - afterOptimization.size} entries
        Memory saved: ${((beforeOptimization.memoryUsage - afterOptimization.memoryUsage) / 1024).toFixed(2)}KB`);
    });
  });

  describe('Concurrent Operations Performance', () => {
    test('should handle rapid state queries efficiently', () => {
      const playerCount = 6;
      
      // Setup game
      for (let i = 1; i <= playerCount; i++) {
        engine.addPlayer({
          id: `player${i}`,
          name: `Player ${i}`,
          chips: 10000
        });
      }
      
      engine.startGame();

      const queryCount = 1000;
      const startTime = process.hrtime.bigint();

      // Rapid state queries
      for (let i = 0; i < queryCount; i++) {
        const gameState = engine.getGameState();
        const stats = engine.getGameStats();
        const canStart = engine.canStartGame();
        
        // Verify we get valid responses
        expect(gameState).toBeDefined();
        expect(stats).toBeDefined();
        expect(canStart).toBeDefined();
      }

      const endTime = process.hrtime.bigint();
      const totalTime = Number(endTime - startTime) / 1000000;
      const avgTime = totalTime / queryCount;

      expect(avgTime).toBeLessThan(1); // Should average less than 1ms per query
      expect(totalTime).toBeLessThan(500); // Total should be under 500ms

      console.log(`Rapid state query performance:
        ${queryCount} queries: ${totalTime.toFixed(2)}ms
        Average per query: ${avgTime.toFixed(3)}ms`);
    });

    test('should maintain performance under mixed operations', () => {
      const playerCount = 8;
      
      // Setup
      for (let i = 1; i <= playerCount; i++) {
        engine.addPlayer({
          id: `player${i}`,
          name: `Player ${i}`,
          chips: 20000
        });
      }
      
      engine.startGame();

      const operationCount = 500;
      const startTime = process.hrtime.bigint();

      for (let i = 0; i < operationCount; i++) {
        const operation = i % 4;
        
        switch (operation) {
          case 0:
            // State query
            engine.getGameState();
            break;
          case 1:
            // Player action query
            const gameState = engine.getGameState();
            if (gameState.gameInfo.currentPlayer) {
              engine.getPlayerActions(gameState.gameInfo.currentPlayer);
            }
            break;
          case 2:
            // Player state query
            engine.getPlayerState(`player${(i % playerCount) + 1}`);
            break;
          case 3:
            // Stats query
            engine.getGameStats();
            break;
        }
      }

      const endTime = process.hrtime.bigint();
      const totalTime = Number(endTime - startTime) / 1000000;
      const avgTime = totalTime / operationCount;

      expect(avgTime).toBeLessThan(2); // Should average less than 2ms per operation
      expect(totalTime).toBeLessThan(1000); // Total should be under 1 second

      console.log(`Mixed operations performance:
        ${operationCount} mixed operations: ${totalTime.toFixed(2)}ms
        Average per operation: ${avgTime.toFixed(3)}ms`);
    });
  });
});