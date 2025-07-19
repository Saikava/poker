const { BenchmarkUtils } = require('./BenchmarkUtils');
const PokerEngine = require('../../src/PokerEngine');
const { HandEvaluator } = require('../../src/utilities/HandEvaluator');
const Card = require('../../src/models/Card');
const { memoryManager } = require('../../src/utilities/MemoryManager');

describe('Comprehensive Poker Engine Benchmarks', () => {
  let memoryProfiler;

  beforeAll(() => {
    memoryProfiler = BenchmarkUtils.createMemoryProfiler();
    memoryProfiler.snapshot('test-start');
  });

  afterAll(() => {
    memoryProfiler.snapshot('test-end');
    memoryProfiler.printReport();
  });

  describe('Hand Evaluation Benchmarks', () => {
    test('should benchmark hand evaluation with and without caching', async () => {
      const testCards = [
        new Card('hearts', 'A'),
        new Card('spades', 'K'),
        new Card('diamonds', 'Q'),
        new Card('clubs', 'J'),
        new Card('hearts', '10'),
        new Card('spades', '9'),
        new Card('diamonds', '8')
      ];

      // Clear cache first
      HandEvaluator.clearCache();

      // Pre-populate cache for the "with cache" test
      HandEvaluator.evaluateHand(testCards);

      const results = await BenchmarkUtils.compare({
        'Hand Evaluation (no cache)': () => {
          HandEvaluator.clearCache();
          const result = HandEvaluator.evaluateHand(testCards);
          return result;
        },
        'Hand Evaluation (with cache)': () => {
          // Cache should be populated from previous runs
          return HandEvaluator.evaluateHand(testCards);
        }
      }, 1000);

      // Cache should provide some speedup (but may not be dramatic for simple cases)
      expect(results['Hand Evaluation (with cache)'].slowdownFactor).toBeLessThan(2.0);

      console.log('\nHand Evaluation Benchmark Results:');
      Object.entries(results).forEach(([name, stats]) => {
        console.log(`${name}:`);
        console.log(`  Average: ${stats.avg.toFixed(3)}ms`);
        console.log(`  Slowdown factor: ${stats.slowdownFactor.toFixed(2)}x`);
      });
    }, 30000);

    test('should benchmark different hand types', async () => {
      const handTypes = {
        'Royal Flush': [
          new Card('hearts', 'A'),
          new Card('hearts', 'K'),
          new Card('hearts', 'Q'),
          new Card('hearts', 'J'),
          new Card('hearts', '10'),
          new Card('spades', '2'),
          new Card('clubs', '3')
        ],
        'Four of a Kind': [
          new Card('hearts', 'A'),
          new Card('spades', 'A'),
          new Card('diamonds', 'A'),
          new Card('clubs', 'A'),
          new Card('hearts', 'K'),
          new Card('spades', '2'),
          new Card('clubs', '3')
        ],
        'High Card': [
          new Card('hearts', 'A'),
          new Card('spades', 'K'),
          new Card('diamonds', '9'),
          new Card('clubs', '7'),
          new Card('hearts', '5'),
          new Card('spades', '3'),
          new Card('clubs', '2')
        ]
      };

      const functions = {};
      Object.entries(handTypes).forEach(([name, cards]) => {
        functions[name] = () => HandEvaluator.evaluateHand(cards);
      });

      const results = await BenchmarkUtils.compare(functions, 500);

      console.log('\nHand Type Evaluation Benchmark:');
      Object.entries(results).forEach(([name, stats]) => {
        console.log(`${name}: ${stats.avg.toFixed(3)}ms avg`);
      });
    }, 20000);
  });

  describe('Game Engine Benchmarks', () => {
    test('should benchmark game initialization and player management', async () => {
      const suite = BenchmarkUtils.createSuite('Game Management');

      suite.add('Create Engine', () => {
        return new PokerEngine({
          smallBlind: 10,
          bigBlind: 20,
          startingChips: 10000
        });
      }, { iterations: 1000 });

      suite.add('Add Single Player', () => {
        const engine = new PokerEngine();
        return engine.addPlayer({
          id: 'test-player',
          name: 'Test Player',
          chips: 10000
        });
      }, { iterations: 1000 });

      suite.add('Add 10 Players', () => {
        const engine = new PokerEngine();
        for (let i = 1; i <= 10; i++) {
          engine.addPlayer({
            id: `player${i}`,
            name: `Player ${i}`,
            chips: 10000
          });
        }
      }, { iterations: 100 });

      suite.add('Start Game (10 players)', () => {
        const engine = new PokerEngine();
        for (let i = 1; i <= 10; i++) {
          engine.addPlayer({
            id: `player${i}`,
            name: `Player ${i}`,
            chips: 10000
          });
        }
        return engine.startGame();
      }, { iterations: 100 });

      await suite.run();
      suite.printResults();
    }, 60000);

    test('should benchmark state queries', async () => {
      // Setup a game with multiple players
      const engine = new PokerEngine();
      for (let i = 1; i <= 8; i++) {
        engine.addPlayer({
          id: `player${i}`,
          name: `Player ${i}`,
          chips: 10000
        });
      }
      engine.startGame();

      const suite = BenchmarkUtils.createSuite('State Queries');

      suite.add('Get Game State', () => {
        return engine.getGameState();
      }, { iterations: 2000 });

      suite.add('Get Game Stats', () => {
        return engine.getGameStats();
      }, { iterations: 2000 });

      suite.add('Get Player State', () => {
        return engine.getPlayerState('player1');
      }, { iterations: 2000 });

      suite.add('Get Player Actions', () => {
        const gameState = engine.getGameState();
        if (gameState.gameInfo.currentPlayer) {
          return engine.getPlayerActions(gameState.gameInfo.currentPlayer);
        }
      }, { iterations: 2000 });

      await suite.run();
      suite.printResults();
    }, 30000);
  });

  describe('Scalability Benchmarks', () => {
    test('should benchmark performance with varying player counts', async () => {
      const playerCounts = [2, 6, 10, 15, 20];
      const results = {};

      for (const playerCount of playerCounts) {
        console.log(`\nBenchmarking with ${playerCount} players...`);
        
        const stats = await BenchmarkUtils.benchmark(async () => {
          const engine = new PokerEngine();
          
          // Add players
          for (let i = 1; i <= playerCount; i++) {
            engine.addPlayer({
              id: `player${i}`,
              name: `Player ${i}`,
              chips: 10000
            });
          }
          
          // Start game
          engine.startGame();
          
          // Simulate some actions
          let gameState = engine.getGameState();
          let actionCount = 0;
          const maxActions = Math.min(playerCount * 2, 20);
          
          while (gameState.gameInfo.currentPlayer && actionCount < maxActions) {
            const currentPlayer = gameState.gameInfo.currentPlayer;
            const actions = engine.getPlayerActions(currentPlayer);
            
            if (actions.success && actions.availableActions.length > 0) {
              const action = actionCount % 3 === 0 ? 'fold' : 
                           actions.availableActions.includes('call') ? 'call' : 'check';
              
              const result = engine.playerAction({ playerId: currentPlayer, action });
              if (result.success && result.handComplete) break;
            }
            
            gameState = engine.getGameState();
            actionCount++;
          }
        }, 50, 5);

        results[playerCount] = stats;
        
        console.log(`${playerCount} players: ${stats.avg.toFixed(2)}ms avg, ${stats.max.toFixed(2)}ms max`);
      }

      // Verify scalability is reasonable (should be roughly linear)
      const baseTime = results[2].avg;
      const maxTime = results[20].avg;
      const scalingFactor = maxTime / baseTime;
      
      expect(scalingFactor).toBeLessThan(15); // Should scale better than 15x for 10x players

      console.log(`\nScalability Analysis:`);
      console.log(`Base time (2 players): ${baseTime.toFixed(2)}ms`);
      console.log(`Max time (20 players): ${maxTime.toFixed(2)}ms`);
      console.log(`Scaling factor: ${scalingFactor.toFixed(2)}x`);
    }, 120000);

    test('should benchmark memory usage with large player counts', async () => {
      memoryProfiler.snapshot('before-large-game');

      const engine = new PokerEngine();
      
      // Add maximum players
      for (let i = 1; i <= 23; i++) {
        engine.addPlayer({
          id: `player${i}`,
          name: `Player ${i}`,
          chips: 50000
        });
      }

      memoryProfiler.snapshot('after-adding-players');

      engine.startGame();

      memoryProfiler.snapshot('after-starting-game');

      // Play multiple hands
      for (let hand = 0; hand < 5; hand++) {
        if (hand > 0) {
          engine.startNewHand();
        }

        // Quick hand resolution
        let gameState = engine.getGameState();
        let actionCount = 0;

        while (gameState.gameInfo.currentPlayer && actionCount < 50) {
          const currentPlayer = gameState.gameInfo.currentPlayer;
          const actions = engine.getPlayerActions(currentPlayer);
          
          if (actions.success && actions.availableActions.length > 0) {
            const action = actionCount < 5 ? 
              (actions.availableActions.includes('call') ? 'call' : 'check') : 'fold';
            
            const result = engine.playerAction({ playerId: currentPlayer, action });
            if (result.success && result.handComplete) break;
          }
          
          gameState = engine.getGameState();
          actionCount++;
        }

        if (hand % 2 === 0) {
          memoryProfiler.snapshot(`after-hand-${hand + 1}`);
        }
      }

      // Cleanup and measure
      memoryManager.cleanup();
      HandEvaluator.optimizeCache();
      
      memoryProfiler.snapshot('after-cleanup');

      const memoryStats = memoryManager.getMemoryStats();
      const cacheStats = HandEvaluator.getCacheStats();

      console.log(`\nMemory Usage with 23 Players:`);
      console.log(`Cache entries: ${cacheStats.size}`);
      console.log(`Cache hit rate: ${(cacheStats.hitRate * 100).toFixed(1)}%`);
      console.log(`Memory manager allocations: ${memoryStats.allocations}`);
      console.log(`Memory manager pool hit rate: ${(memoryStats.poolHitRate * 100).toFixed(1)}%`);

      // Memory usage should be reasonable
      const finalDiff = memoryProfiler.getDifference();
      expect(finalDiff.heapUsed).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
    }, 60000);
  });

  describe('Stress Tests', () => {
    test('should handle rapid consecutive operations', async () => {
      const engine = new PokerEngine();
      
      // Add players
      for (let i = 1; i <= 6; i++) {
        engine.addPlayer({
          id: `player${i}`,
          name: `Player ${i}`,
          chips: 100000
        });
      }
      
      engine.startGame();

      const operationCount = 10000;
      const startTime = process.hrtime.bigint();

      for (let i = 0; i < operationCount; i++) {
        // Mix of different operations
        switch (i % 5) {
          case 0:
            engine.getGameState();
            break;
          case 1:
            engine.getGameStats();
            break;
          case 2:
            engine.getPlayerState('player1');
            break;
          case 3:
            engine.canStartGame();
            break;
          case 4:
            const gameState = engine.getGameState();
            if (gameState.gameInfo.currentPlayer) {
              engine.getPlayerActions(gameState.gameInfo.currentPlayer);
            }
            break;
        }
      }

      const endTime = process.hrtime.bigint();
      const totalTime = Number(endTime - startTime) / 1000000;
      const avgTime = totalTime / operationCount;

      expect(avgTime).toBeLessThan(0.5); // Should average less than 0.5ms per operation
      expect(totalTime).toBeLessThan(3000); // Total should be under 3 seconds

      console.log(`\nStress Test Results:`);
      console.log(`${operationCount} operations: ${totalTime.toFixed(2)}ms`);
      console.log(`Average per operation: ${avgTime.toFixed(4)}ms`);
      console.log(`Operations per second: ${(operationCount / (totalTime / 1000)).toFixed(0)}`);
    }, 30000);

    test('should maintain performance over extended runtime', async () => {
      const engine = new PokerEngine();
      
      for (let i = 1; i <= 8; i++) {
        engine.addPlayer({
          id: `player${i}`,
          name: `Player ${i}`,
          chips: 1000000
        });
      }
      
      engine.startGame();

      const handCount = 20;
      const handTimes = [];
      
      for (let hand = 0; hand < handCount; hand++) {
        const handStart = process.hrtime.bigint();
        
        if (hand > 0) {
          engine.startNewHand();
        }

        // Play hand with varied actions
        let gameState = engine.getGameState();
        let actionCount = 0;

        while (gameState.gameInfo.currentPlayer && actionCount < 30) {
          const currentPlayer = gameState.gameInfo.currentPlayer;
          const actions = engine.getPlayerActions(currentPlayer);
          
          if (actions.success && actions.availableActions.length > 0) {
            // Varied strategy
            let action;
            if (actionCount < 3) {
              action = actions.availableActions.includes('call') ? 'call' : 'check';
            } else if (actionCount < 6 && actions.availableActions.includes('raise')) {
              action = 'raise';
            } else {
              action = 'fold';
            }
            
            const amount = action === 'raise' ? 100 : undefined;
            const result = engine.playerAction({ 
              playerId: currentPlayer, 
              action, 
              amount 
            });
            
            if (result.success && result.handComplete) break;
          }
          
          gameState = engine.getGameState();
          actionCount++;
        }

        const handEnd = process.hrtime.bigint();
        const handTime = Number(handEnd - handStart) / 1000000;
        handTimes.push(handTime);

        // Periodic cleanup
        if (hand % 5 === 0) {
          memoryManager.cleanup();
        }
      }

      // Analyze performance consistency
      const avgTime = handTimes.reduce((a, b) => a + b, 0) / handTimes.length;
      const maxTime = Math.max(...handTimes);
      const minTime = Math.min(...handTimes);
      const variance = maxTime - minTime;
      const stdDev = Math.sqrt(
        handTimes.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / handTimes.length
      );

      // Performance should remain consistent
      expect(variance).toBeLessThan(avgTime * 2); // Variance should be reasonable
      expect(stdDev).toBeLessThan(avgTime * 0.5); // Low standard deviation

      console.log(`\nExtended Runtime Performance (${handCount} hands):`);
      console.log(`Average hand time: ${avgTime.toFixed(2)}ms`);
      console.log(`Min hand time: ${minTime.toFixed(2)}ms`);
      console.log(`Max hand time: ${maxTime.toFixed(2)}ms`);
      console.log(`Variance: ${variance.toFixed(2)}ms`);
      console.log(`Standard deviation: ${stdDev.toFixed(2)}ms`);
      console.log(`Consistency ratio: ${(1 - stdDev / avgTime).toFixed(3)}`);
    }, 120000);
  });
});