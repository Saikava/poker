/**
 * Memory management utility for poker engine optimization
 * Handles object cleanup, memory monitoring, and resource management
 */
class MemoryManager {
  constructor() {
    this.objectPools = new Map();
    this.cleanupCallbacks = new Set();
    this.memoryStats = {
      allocations: 0,
      deallocations: 0,
      poolHits: 0,
      poolMisses: 0
    };
  }

  /**
   * Creates an object pool for reusing objects of a specific type
   * @param {string} type - Object type identifier
   * @param {Function} factory - Factory function to create new objects
   * @param {Function} reset - Function to reset object state
   * @param {number} maxSize - Maximum pool size
   */
  createObjectPool(type, factory, reset, maxSize = 100) {
    this.objectPools.set(type, {
      pool: [],
      factory,
      reset,
      maxSize,
      created: 0,
      reused: 0
    });
  }

  /**
   * Gets an object from the pool or creates a new one
   * @param {string} type - Object type identifier
   * @param {...any} args - Arguments for factory function
   * @returns {Object} Object instance
   */
  getObject(type, ...args) {
    const poolInfo = this.objectPools.get(type);
    if (!poolInfo) {
      throw new Error(`Object pool for type '${type}' not found`);
    }

    let obj;
    if (poolInfo.pool.length > 0) {
      obj = poolInfo.pool.pop();
      poolInfo.reset(obj, ...args);
      poolInfo.reused++;
      this.memoryStats.poolHits++;
    } else {
      obj = poolInfo.factory(...args);
      poolInfo.created++;
      this.memoryStats.poolMisses++;
    }

    this.memoryStats.allocations++;
    return obj;
  }

  /**
   * Returns an object to the pool for reuse
   * @param {string} type - Object type identifier
   * @param {Object} obj - Object to return to pool
   */
  returnObject(type, obj) {
    const poolInfo = this.objectPools.get(type);
    if (!poolInfo) {
      return; // Pool doesn't exist, just let GC handle it
    }

    if (poolInfo.pool.length < poolInfo.maxSize) {
      // Clear any references to prevent memory leaks
      this.clearObjectReferences(obj);
      poolInfo.pool.push(obj);
    }

    this.memoryStats.deallocations++;
  }

  /**
   * Clears object references to prevent memory leaks
   * @param {Object} obj - Object to clear
   * @private
   */
  clearObjectReferences(obj) {
    if (obj && typeof obj === 'object') {
      // Clear arrays
      Object.keys(obj).forEach(key => {
        if (Array.isArray(obj[key])) {
          obj[key].length = 0;
        } else if (obj[key] && typeof obj[key] === 'object') {
          // Don't clear nested objects completely, just null them
          obj[key] = null;
        }
      });
    }
  }

  /**
   * Registers a cleanup callback to be called during memory cleanup
   * @param {Function} callback - Cleanup callback function
   */
  registerCleanupCallback(callback) {
    this.cleanupCallbacks.add(callback);
  }

  /**
   * Unregisters a cleanup callback
   * @param {Function} callback - Cleanup callback function
   */
  unregisterCleanupCallback(callback) {
    this.cleanupCallbacks.delete(callback);
  }

  /**
   * Performs memory cleanup operations
   */
  cleanup() {
    // Run all registered cleanup callbacks
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.warn('Error in cleanup callback:', error);
      }
    });

    // Clear object pools if they're getting too large
    this.objectPools.forEach((poolInfo, type) => {
      if (poolInfo.pool.length > poolInfo.maxSize * 0.8) {
        const targetSize = Math.floor(poolInfo.maxSize * 0.5);
        poolInfo.pool.splice(0, poolInfo.pool.length - targetSize);
      }
    });

    // Force garbage collection if available (Node.js with --expose-gc)
    if (global.gc) {
      global.gc();
    }
  }

  /**
   * Gets memory usage statistics
   * @returns {Object} Memory statistics
   */
  getMemoryStats() {
    const poolStats = {};
    this.objectPools.forEach((poolInfo, type) => {
      poolStats[type] = {
        poolSize: poolInfo.pool.length,
        maxSize: poolInfo.maxSize,
        created: poolInfo.created,
        reused: poolInfo.reused,
        reuseRate: poolInfo.created > 0 ? poolInfo.reused / (poolInfo.created + poolInfo.reused) : 0
      };
    });

    return {
      ...this.memoryStats,
      poolHitRate: this.memoryStats.poolHits + this.memoryStats.poolMisses > 0 
        ? this.memoryStats.poolHits / (this.memoryStats.poolHits + this.memoryStats.poolMisses) 
        : 0,
      pools: poolStats,
      processMemory: this.getProcessMemoryUsage()
    };
  }

  /**
   * Gets process memory usage (Node.js specific)
   * @returns {Object} Process memory usage
   * @private
   */
  getProcessMemoryUsage() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        rss: usage.rss,
        heapTotal: usage.heapTotal,
        heapUsed: usage.heapUsed,
        external: usage.external,
        arrayBuffers: usage.arrayBuffers || 0
      };
    }
    return null;
  }

  /**
   * Optimizes memory usage by cleaning up and reorganizing pools
   */
  optimize() {
    this.cleanup();
    
    // Optimize object pools
    this.objectPools.forEach((poolInfo, type) => {
      // Remove excess objects from pools
      if (poolInfo.pool.length > poolInfo.maxSize * 0.6) {
        const targetSize = Math.floor(poolInfo.maxSize * 0.4);
        poolInfo.pool.splice(0, poolInfo.pool.length - targetSize);
      }
    });
  }

  /**
   * Resets all statistics
   */
  resetStats() {
    this.memoryStats = {
      allocations: 0,
      deallocations: 0,
      poolHits: 0,
      poolMisses: 0
    };

    this.objectPools.forEach(poolInfo => {
      poolInfo.created = 0;
      poolInfo.reused = 0;
    });
  }

  /**
   * Destroys the memory manager and cleans up all resources
   */
  destroy() {
    this.cleanup();
    this.objectPools.clear();
    this.cleanupCallbacks.clear();
    this.resetStats();
  }
}

// Singleton instance for global use
const memoryManager = new MemoryManager();

module.exports = { MemoryManager, memoryManager };