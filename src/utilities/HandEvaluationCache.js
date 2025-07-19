/**
 * Hand evaluation caching system for performance optimization
 * Caches hand evaluation results for identical card combinations
 */
class HandEvaluationCache {
  constructor(maxSize = 10000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  /**
   * Generates a cache key from an array of cards
   * @param {Card[]} cards - Array of cards
   * @returns {string} Cache key
   */
  generateKey(cards) {
    // Sort cards by suit and rank for consistent key generation
    const sortedCards = [...cards].sort((a, b) => {
      if (a.suit !== b.suit) {
        return a.suit.localeCompare(b.suit);
      }
      return a.value - b.value;
    });

    return sortedCards.map(card => `${card.suit[0]}${card.rank}`).join('');
  }

  /**
   * Gets cached hand evaluation result
   * @param {Card[]} cards - Array of cards
   * @returns {HandResult|null} Cached result or null if not found
   */
  get(cards) {
    const key = this.generateKey(cards);
    const result = this.cache.get(key);
    
    if (result) {
      this.hits++;
      // Move to end (LRU)
      this.cache.delete(key);
      this.cache.set(key, result);
      return result;
    }
    
    this.misses++;
    return null;
  }

  /**
   * Stores hand evaluation result in cache
   * @param {Card[]} cards - Array of cards
   * @param {HandResult} result - Hand evaluation result
   */
  set(cards, result) {
    const key = this.generateKey(cards);
    
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      this.evictions++;
    }
    
    this.cache.set(key, {
      handType: result.handType,
      strength: result.strength,
      cards: [...result.cards], // Deep copy to prevent mutation
      kickers: [...result.kickers]
    });
  }

  /**
   * Clears the cache
   */
  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  /**
   * Gets cache statistics
   * @returns {Object} Cache performance statistics
   */
  getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      hitRate: total > 0 ? (this.hits / total) : 0,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Estimates memory usage of the cache
   * @returns {number} Estimated memory usage in bytes
   * @private
   */
  estimateMemoryUsage() {
    // Rough estimation: key (20 chars) + result object (~200 bytes)
    return this.cache.size * 220;
  }

  /**
   * Optimizes cache by removing least recently used entries
   * @param {number} targetSize - Target cache size
   */
  optimize(targetSize = null) {
    const target = targetSize || Math.floor(this.maxSize * 0.8);
    
    if (this.cache.size <= target) {
      return;
    }

    const entries = Array.from(this.cache.entries());
    const toKeep = entries.slice(-target);
    
    this.cache.clear();
    toKeep.forEach(([key, value]) => {
      this.cache.set(key, value);
    });
    
    this.evictions += entries.length - target;
  }
}

module.exports = HandEvaluationCache;