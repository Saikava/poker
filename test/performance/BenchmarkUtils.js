/**
 * Benchmark utilities for poker engine performance testing
 */

/**
 * High-precision timer for benchmarking
 */
class BenchmarkTimer {
  constructor() {
    this.startTime = null;
    this.endTime = null;
    this.measurements = [];
  }

  /**
   * Starts the timer
   */
  start() {
    this.startTime = process.hrtime.bigint();
  }

  /**
   * Stops the timer and records measurement
   * @returns {number} Elapsed time in milliseconds
   */
  stop() {
    this.endTime = process.hrtime.bigint();
    const elapsed = Number(this.endTime - this.startTime) / 1000000;
    this.measurements.push(elapsed);
    return elapsed;
  }

  /**
   * Gets statistics for all measurements
   * @returns {Object} Statistics object
   */
  getStats() {
    if (this.measurements.length === 0) {
      return { count: 0, avg: 0, min: 0, max: 0, total: 0 };
    }

    const sorted = [...this.measurements].sort((a, b) => a - b);
    const total = this.measurements.reduce((sum, val) => sum + val, 0);
    const avg = total / this.measurements.length;

    return {
      count: this.measurements.length,
      total: total,
      avg: avg,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      stdDev: this.calculateStdDev(this.measurements, avg)
    };
  }

  /**
   * Calculates standard deviation
   * @param {number[]} values - Array of values
   * @param {number} mean - Mean value
   * @returns {number} Standard deviation
   * @private
   */
  calculateStdDev(values, mean) {
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Resets all measurements
   */
  reset() {
    this.measurements = [];
    this.startTime = null;
    this.endTime = null;
  }
}

/**
 * Benchmark suite for running multiple performance tests
 */
class BenchmarkSuite {
  constructor(name) {
    this.name = name;
    this.benchmarks = new Map();
    this.results = new Map();
  }

  /**
   * Adds a benchmark test
   * @param {string} name - Benchmark name
   * @param {Function} testFn - Test function
   * @param {Object} options - Options (iterations, warmup, etc.)
   */
  add(name, testFn, options = {}) {
    this.benchmarks.set(name, {
      testFn,
      iterations: options.iterations || 100,
      warmup: options.warmup || 10,
      timeout: options.timeout || 30000
    });
  }

  /**
   * Runs all benchmarks
   * @returns {Promise<Object>} Results object
   */
  async run() {
    console.log(`\n=== Running Benchmark Suite: ${this.name} ===`);
    
    for (const [name, config] of this.benchmarks) {
      console.log(`\nRunning benchmark: ${name}`);
      
      const timer = new BenchmarkTimer();
      const { testFn, iterations, warmup, timeout } = config;
      
      try {
        // Warmup runs
        console.log(`  Warmup (${warmup} iterations)...`);
        for (let i = 0; i < warmup; i++) {
          await testFn();
        }
        
        // Actual benchmark runs
        console.log(`  Measuring (${iterations} iterations)...`);
        const startTime = Date.now();
        
        for (let i = 0; i < iterations; i++) {
          timer.start();
          await testFn();
          timer.stop();
          
          // Check timeout
          if (Date.now() - startTime > timeout) {
            console.log(`  Timeout reached after ${i + 1} iterations`);
            break;
          }
        }
        
        const stats = timer.getStats();
        this.results.set(name, stats);
        
        console.log(`  Results: avg=${stats.avg.toFixed(3)}ms, min=${stats.min.toFixed(3)}ms, max=${stats.max.toFixed(3)}ms, p95=${stats.p95.toFixed(3)}ms`);
        
      } catch (error) {
        console.error(`  Error in benchmark ${name}:`, error.message);
        this.results.set(name, { error: error.message });
      }
    }
    
    return this.getResults();
  }

  /**
   * Gets formatted results
   * @returns {Object} Results object
   */
  getResults() {
    const results = {
      suiteName: this.name,
      benchmarks: {},
      summary: {
        totalBenchmarks: this.benchmarks.size,
        successful: 0,
        failed: 0
      }
    };
    
    for (const [name, stats] of this.results) {
      results.benchmarks[name] = stats;
      
      if (stats.error) {
        results.summary.failed++;
      } else {
        results.summary.successful++;
      }
    }
    
    return results;
  }

  /**
   * Prints detailed results
   */
  printResults() {
    const results = this.getResults();
    
    console.log(`\n=== Benchmark Results: ${results.suiteName} ===`);
    console.log(`Successful: ${results.summary.successful}, Failed: ${results.summary.failed}`);
    
    for (const [name, stats] of Object.entries(results.benchmarks)) {
      console.log(`\n${name}:`);
      
      if (stats.error) {
        console.log(`  ERROR: ${stats.error}`);
      } else {
        console.log(`  Iterations: ${stats.count}`);
        console.log(`  Average: ${stats.avg.toFixed(3)}ms`);
        console.log(`  Median: ${stats.median.toFixed(3)}ms`);
        console.log(`  Min: ${stats.min.toFixed(3)}ms`);
        console.log(`  Max: ${stats.max.toFixed(3)}ms`);
        console.log(`  95th percentile: ${stats.p95.toFixed(3)}ms`);
        console.log(`  99th percentile: ${stats.p99.toFixed(3)}ms`);
        console.log(`  Std deviation: ${stats.stdDev.toFixed(3)}ms`);
        console.log(`  Total time: ${stats.total.toFixed(3)}ms`);
      }
    }
  }
}

/**
 * Memory profiler for tracking memory usage during benchmarks
 */
class MemoryProfiler {
  constructor() {
    this.snapshots = [];
    this.baseline = null;
  }

  /**
   * Takes a memory snapshot
   * @param {string} label - Label for the snapshot
   */
  snapshot(label = 'unnamed') {
    const usage = process.memoryUsage();
    const timestamp = Date.now();
    
    const snapshot = {
      label,
      timestamp,
      rss: usage.rss,
      heapTotal: usage.heapTotal,
      heapUsed: usage.heapUsed,
      external: usage.external,
      arrayBuffers: usage.arrayBuffers || 0
    };
    
    if (!this.baseline) {
      this.baseline = snapshot;
    }
    
    this.snapshots.push(snapshot);
    return snapshot;
  }

  /**
   * Gets memory usage difference from baseline
   * @param {Object} snapshot - Snapshot to compare (defaults to latest)
   * @returns {Object} Memory difference
   */
  getDifference(snapshot = null) {
    if (!this.baseline) return null;
    
    const current = snapshot || this.snapshots[this.snapshots.length - 1];
    if (!current) return null;
    
    return {
      rss: current.rss - this.baseline.rss,
      heapTotal: current.heapTotal - this.baseline.heapTotal,
      heapUsed: current.heapUsed - this.baseline.heapUsed,
      external: current.external - this.baseline.external,
      arrayBuffers: current.arrayBuffers - this.baseline.arrayBuffers
    };
  }

  /**
   * Gets peak memory usage
   * @returns {Object} Peak memory usage
   */
  getPeakUsage() {
    if (this.snapshots.length === 0) return null;
    
    return this.snapshots.reduce((peak, snapshot) => ({
      rss: Math.max(peak.rss, snapshot.rss),
      heapTotal: Math.max(peak.heapTotal, snapshot.heapTotal),
      heapUsed: Math.max(peak.heapUsed, snapshot.heapUsed),
      external: Math.max(peak.external, snapshot.external),
      arrayBuffers: Math.max(peak.arrayBuffers, snapshot.arrayBuffers)
    }), this.snapshots[0]);
  }

  /**
   * Formats bytes to human readable format
   * @param {number} bytes - Bytes to format
   * @returns {string} Formatted string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Prints memory usage report
   */
  printReport() {
    if (this.snapshots.length === 0) {
      console.log('No memory snapshots available');
      return;
    }
    
    console.log('\n=== Memory Usage Report ===');
    
    if (this.baseline) {
      console.log(`Baseline (${this.baseline.label}):`);
      console.log(`  RSS: ${this.formatBytes(this.baseline.rss)}`);
      console.log(`  Heap Used: ${this.formatBytes(this.baseline.heapUsed)}`);
      console.log(`  Heap Total: ${this.formatBytes(this.baseline.heapTotal)}`);
    }
    
    const peak = this.getPeakUsage();
    if (peak) {
      console.log(`\nPeak Usage:`);
      console.log(`  RSS: ${this.formatBytes(peak.rss)}`);
      console.log(`  Heap Used: ${this.formatBytes(peak.heapUsed)}`);
      console.log(`  Heap Total: ${this.formatBytes(peak.heapTotal)}`);
    }
    
    const latest = this.snapshots[this.snapshots.length - 1];
    const diff = this.getDifference(latest);
    if (diff) {
      console.log(`\nMemory Change (from baseline):`);
      console.log(`  RSS: ${this.formatBytes(diff.rss)}`);
      console.log(`  Heap Used: ${this.formatBytes(diff.heapUsed)}`);
      console.log(`  Heap Total: ${this.formatBytes(diff.heapTotal)}`);
    }
  }

  /**
   * Resets the profiler
   */
  reset() {
    this.snapshots = [];
    this.baseline = null;
  }
}

/**
 * Utility functions for performance testing
 */
const BenchmarkUtils = {
  /**
   * Runs a function multiple times and measures performance
   * @param {Function} fn - Function to benchmark
   * @param {number} iterations - Number of iterations
   * @param {number} warmup - Number of warmup iterations
   * @returns {Object} Performance statistics
   */
  async benchmark(fn, iterations = 100, warmup = 10) {
    const timer = new BenchmarkTimer();
    
    // Warmup
    for (let i = 0; i < warmup; i++) {
      await fn();
    }
    
    // Measure
    for (let i = 0; i < iterations; i++) {
      timer.start();
      await fn();
      timer.stop();
    }
    
    return timer.getStats();
  },

  /**
   * Compares performance of multiple functions
   * @param {Object} functions - Object with function names as keys
   * @param {number} iterations - Number of iterations per function
   * @returns {Object} Comparison results
   */
  async compare(functions, iterations = 100) {
    const results = {};
    
    for (const [name, fn] of Object.entries(functions)) {
      console.log(`Benchmarking ${name}...`);
      results[name] = await this.benchmark(fn, iterations);
    }
    
    // Find fastest
    const fastest = Object.entries(results).reduce((fastest, [name, stats]) => {
      return !fastest || stats.avg < fastest.stats.avg ? { name, stats } : fastest;
    }, null);
    
    // Calculate relative performance
    if (fastest) {
      for (const [name, stats] of Object.entries(results)) {
        stats.relativeTo = fastest.name;
        stats.slowdownFactor = stats.avg / fastest.stats.avg;
      }
    }
    
    return results;
  },

  /**
   * Creates a memory profiler
   * @returns {MemoryProfiler} Memory profiler instance
   */
  createMemoryProfiler() {
    return new MemoryProfiler();
  },

  /**
   * Creates a benchmark suite
   * @param {string} name - Suite name
   * @returns {BenchmarkSuite} Benchmark suite instance
   */
  createSuite(name) {
    return new BenchmarkSuite(name);
  }
};

module.exports = {
  BenchmarkTimer,
  BenchmarkSuite,
  MemoryProfiler,
  BenchmarkUtils
};