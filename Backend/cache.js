const NodeCache = require("node-cache");

/**
 * =====================================================================
 * PRACTICAL 9: In-Memory Server-Side Caching Module (node-cache)
 * =====================================================================
 * Standard TTL: 60 seconds (Time-To-Live)
 * Check period: 120 seconds (Automatic eviction of expired keys)
 */
const cache = new NodeCache({
  stdTTL: 60,
  checkperiod: 120,
  useClones: false // Performance optimization for read-heavy JSON objects
});

// Cache performance metrics tracking (Supplementary Problem 2)
let stats = {
  hits: 0,
  misses: 0
};

/**
 * Custom wrapper around node-cache to record Hit / Miss metrics
 */
const cacheService = {
  /**
   * Retrieve item from cache and update hit/miss counters
   */
  get: (key) => {
    const value = cache.get(key);
    if (value !== undefined) {
      stats.hits += 1;
      return value;
    }
    stats.misses += 1;
    return null;
  },

  /**
   * Store item in cache with optional custom TTL
   */
  set: (key, value, ttl) => {
    if (ttl !== undefined) {
      return cache.set(key, value, ttl);
    }
    return cache.set(key, value);
  },

  /**
   * Invalidate a single key
   */
  del: (key) => {
    return cache.del(key);
  },

  /**
   * Invalidate all keys matching a prefix or pattern (e.g. all user tasks)
   */
  delPattern: (prefix) => {
    const keys = cache.keys();
    const matching = keys.filter((k) => k.startsWith(prefix));
    if (matching.length > 0) {
      cache.del(matching);
    }
    return matching.length;
  },

  /**
   * Flush all keys in the cache
   */
  flushAll: () => {
    return cache.flushAll();
  },

  /**
   * Retrieve all active keys
   */
  keys: () => {
    return cache.keys();
  },

  /**
   * Expose debug statistics for /cache/stats endpoint
   */
  getStats: () => {
    const total = stats.hits + stats.misses;
    const hitRate = total > 0 ? `${((stats.hits / total) * 100).toFixed(1)}%` : "0.0%";
    const internalStats = cache.getStats();

    return {
      hits: stats.hits,
      misses: stats.misses,
      totalRequests: total,
      hitRate,
      activeKeyCount: cache.keys().length,
      activeKeys: cache.keys(),
      vsize: internalStats.vsize,
      ksize: internalStats.ksize
    };
  },

  /**
   * Reset stats counters for benchmarking
   */
  resetStats: () => {
    stats.hits = 0;
    stats.misses = 0;
  },

  // Expose underlying NodeCache instance if needed
  raw: cache
};

module.exports = cacheService;
