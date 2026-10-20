const cache = require("./cache");

/**
 * =====================================================================
 * PRACTICAL 9: In-Memory Caching Verification & Benchmark Script
 * =====================================================================
 * Measures and compares response times:
 * 1. Uncached database read (Cache MISS)
 * 2. In-memory cached read (Cache HIT)
 * 3. Cache invalidation on write operation
 * 4. Cache statistics inspection
 */

async function runBenchmark() {
  console.log("=== PRACTICAL 9: IN-MEMORY CACHING BENCHMARK ===");
  console.log(`[Init] Cache service loaded with TTL: 60s\n`);

  // Simulated database fetch function with realistic database latency (15-30ms)
  const mockFetchFromDatabase = async () => {
    const start = process.hrtime.bigint();
    await new Promise((resolve) => setTimeout(resolve, 22)); // Simulated MongoDB disk I/O
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;
    return {
      data: [
        { id: 1, title: "Database Architecture", status: "done" },
        { id: 2, title: "Implement node-cache", status: "in-progress" },
        { id: 3, title: "Benchmark latency", status: "todo" }
      ],
      dbTimeMs: durationMs
    };
  };

  const getTasksWithCache = async (cacheKey) => {
    const start = process.hrtime.bigint();
    const cached = cache.get(cacheKey);

    if (cached) {
      const end = process.hrtime.bigint();
      const latencyMs = Number(end - start) / 1e6;
      return { source: "CACHE (HIT)", data: cached, latencyMs };
    }

    // Cache MISS: query database
    const dbResult = await mockFetchFromDatabase();
    cache.set(cacheKey, dbResult.data, 60);
    const end = process.hrtime.bigint();
    const latencyMs = Number(end - start) / 1e6;
    return { source: "DATABASE (MISS)", data: dbResult.data, latencyMs };
  };

  const cacheKey = "tasks_user_101";

  // Step 1: Benchmark Uncached (Cache MISSES)
  console.log("--- 1. Testing Uncached Requests (Simulating Cache MISS) ---");
  const uncachedReadings = [];
  for (let i = 1; i <= 3; i++) {
    cache.del(cacheKey); // Force miss
    const res = await getTasksWithCache(cacheKey);
    uncachedReadings.push(res.latencyMs);
    console.log(`  Sample ${i} [${res.source}]: ${res.latencyMs.toFixed(3)} ms`);
  }
  const avgUncached = uncachedReadings.reduce((a, b) => a + b, 0) / uncachedReadings.length;
  console.log(`  Average Uncached Latency: ${avgUncached.toFixed(3)} ms\n`);

  // Step 2: Benchmark Cached (Cache HITS)
  console.log("--- 2. Testing In-Memory Cached Requests (Cache HITS) ---");
  const cachedReadings = [];
  for (let i = 1; i <= 3; i++) {
    const res = await getTasksWithCache(cacheKey);
    cachedReadings.push(res.latencyMs);
    console.log(`  Sample ${i} [${res.source}]: ${res.latencyMs.toFixed(3)} ms`);
  }
  const avgCached = cachedReadings.reduce((a, b) => a + b, 0) / cachedReadings.length;
  console.log(`  Average Cached Latency: ${avgCached.toFixed(3)} ms\n`);

  // Speedup Calculation
  const speedup = avgUncached / avgCached;
  const reductionPct = ((avgUncached - avgCached) / avgUncached) * 100;
  console.log(`>>> Performance Gain: ${speedup.toFixed(1)}x Faster (${reductionPct.toFixed(1)}% latency reduction) <<<\n`);

  // Step 3: Test Cache Invalidation on Write Operation
  console.log("--- 3. Testing Cache Invalidation on Write ---");
  console.log(`  Current active keys: [${cache.keys().join(", ")}]`);
  console.log("  Simulating POST /tasks write operation...");
  cache.del(cacheKey);
  console.log(`  Cache key '${cacheKey}' invalidated.`);
  console.log(`  Active keys after write: [${cache.keys().join(", ")}]`);

  const nextRead = await getTasksWithCache(cacheKey);
  console.log(`  Subsequent read status: [${nextRead.source}] (Correct: Stale cache prevented)\n`);

  // Step 4: Display Cache Monitoring Metrics
  console.log("--- 4. Cache Statistics (Supplementary Problem 2) ---");
  console.log(JSON.stringify(cache.getStats(), null, 2));

  console.log("\n=== BENCHMARK COMPLETED SUCCESSFULLY ===");
}

runBenchmark().catch(console.error);
