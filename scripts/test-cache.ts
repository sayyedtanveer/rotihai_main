import { cache, setCache, getCache, invalidateCachePrefix, invalidateCache } from "../server/cache";

async function runTests() {
  console.log("--- Test 1: Cache Overwrite & Memory Leak Prevention ---");
  setCache("test-key", "value1", 5000);
  const size1 = cache.size;
  setCache("test-key", "value2", 5000); // Shoud clear previous timeout
  console.log(`Value: ${getCache("test-key")} (Expected: value2)`);
  console.log(`Cache size: ${cache.size} (Expected: 1)`);

  console.log("\n--- Test 2: TTL Expiry ---");
  setCache("ttl-key", "temp", 100);
  console.log(`Before expiry: ${getCache("ttl-key")}`);
  await new Promise(r => setTimeout(r, 150));
  console.log(`After expiry: ${getCache("ttl-key") || "null"} (Expected: null)`);

  console.log("\n--- Test 3: Prefix Invalidation ---");
  setCache("prefix-1", "a", 10000);
  setCache("prefix-2", "b", 10000);
  setCache("keep-1", "c", 10000);
  
  invalidateCachePrefix("prefix-");
  console.log(`prefix-1: ${getCache("prefix-1") || "null"}`);
  console.log(`prefix-2: ${getCache("prefix-2") || "null"}`);
  console.log(`keep-1: ${getCache("keep-1")} (Expected: c)`);

  console.log("\n--- Test 4: Max Size Limit (FIFO) ---");
  cache.clear(); // Reset
  for (let i = 0; i < 505; i++) {
    setCache(`key-${i}`, i, 10000);
  }
  console.log(`Final size: ${cache.size} (Expected: 500)`);
  console.log(`key-0: ${getCache("key-0") || "null"} (Expected: null)`);
  console.log(`key-10: ${getCache("key-10")} (Expected: 10)`);
  
  process.exit(0);
}

runTests();
