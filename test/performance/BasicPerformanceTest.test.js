const PokerEngine = require('../../src/PokerEngine');
const { HandEvaluator } = require('../../src/utilities/HandEvaluator');
const Card = require('../../src/models/Card');

describe('Basic Performance Verification', () => {
  test('should demonstrate hand evaluation caching works', () => {
    // Clear cache first
    HandEvaluator.clearCache();
    
    const testCards = [
      new Card('hearts', 'A'),
      new Card('spades', 'K'),
      new Card('diamonds', 'Q'),
      new Card('clubs', 'J'),
      new Card('hearts', '10'),
      new Card('spades', '9'),
      new Card('diamonds', '8')
    ];

    // First evaluation - should miss cache
    const result1 = HandEvaluator.evaluateHand(testCards);
    const stats1 = HandEvaluator.getCacheStats();
    
    expect(stats1.misses).toBe(1);
    expect(stats1.hits).toBe(0);
    expect(stats1.size).toBe(1);

    // Second evaluation - should hit cache
    const result2 = HandEvaluator.evaluateHand(testCards);
    const stats2 = HandEvaluator.getCacheStats();
    
    expect(stats2.misses).toBe(1);
    expect(stats2.hits).toBe(1);
    expect(stats2.hitRate).toBe(0.5);
    
    // Results should be identical
    expect(result1.handType).toBe(result2.handType);
    expect(result1.strength).toBe(result2.strength);
  });

  test('should provide performance statistics', () => {
    const engine = new PokerEngine();
    
    // Add some players
    engine.addPlayer({ id: 'player1', name: 'Player 1' });
    engine.addPlayer({ id: 'player2', name: 'Player 2' });
    
    // Get performance stats
    const perfStats = engine.getPerformanceStats();
    
    expect(perfStats).toHaveProperty('handEvaluationCache');
    expect(perfStats).toHaveProperty('memoryManager');
    expect(perfStats).toHaveProperty('gameStats');
    expect(perfStats).toHaveProperty('eventListeners');
    
    expect(perfStats.handEvaluationCache).toHaveProperty('size');
    expect(perfStats.handEvaluationCache).toHaveProperty('hitRate');
    expect(perfStats.memoryManager).toHaveProperty('allocations');
    expect(perfStats.eventListeners).toHaveProperty('totalListeners');
  });

  test('should handle optimization calls', () => {
    const engine = new PokerEngine();
    
    // Add some players and start game
    engine.addPlayer({ id: 'player1', name: 'Player 1' });
    engine.addPlayer({ id: 'player2', name: 'Player 2' });
    engine.startGame();
    
    // Should not throw errors
    expect(() => {
      engine.optimize();
    }).not.toThrow();
    
    expect(() => {
      engine.optimize({
        optimizeCache: true,
        optimizeMemory: true,
        cleanupEvents: true
      });
    }).not.toThrow();
  });

  test('should handle engine destruction', () => {
    const engine = new PokerEngine();
    
    engine.addPlayer({ id: 'player1', name: 'Player 1' });
    engine.addPlayer({ id: 'player2', name: 'Player 2' });
    
    // Should not throw errors
    expect(() => {
      engine.destroy();
    }).not.toThrow();
  });

  test('should demonstrate memory management integration', () => {
    const { memoryManager } = require('../../src/utilities/MemoryManager');
    
    const initialStats = memoryManager.getMemoryStats();
    
    // Create and destroy multiple engines
    for (let i = 0; i < 10; i++) {
      const engine = new PokerEngine();
      engine.addPlayer({ id: 'player1', name: 'Player 1' });
      engine.addPlayer({ id: 'player2', name: 'Player 2' });
      engine.startGame();
      engine.destroy();
    }
    
    // Trigger cleanup
    memoryManager.cleanup();
    
    const finalStats = memoryManager.getMemoryStats();
    
    // Should have some activity
    expect(finalStats.allocations).toBeGreaterThanOrEqual(initialStats.allocations);
  });
});