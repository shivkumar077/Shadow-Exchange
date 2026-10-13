import test from "node:test";
import assert from "node:assert/strict";

// Mock localStorage for Node test runner
const storage = new Map();
globalThis.window = {
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, val) => storage.set(key, String(val)),
    removeItem: (key) => storage.delete(key),
    clear: () => storage.clear(),
  },
  addEventListener: () => {},
  removeEventListener: () => {},
};

const {
  subscribeWatchlist,
  loadUserWatchlist,
  saveUserWatchlist,
  toggleWatchlistSymbol,
  addWatchlistSymbol,
  removeWatchlistSymbol,
  isSymbolWatched,
} = await import("../src/watchlistStore.ts");

test("Watchlist reactivity: subscribeWatchlist fires immediately with current state and on updates", () => {
  storage.clear();
  const userId = 101;
  saveUserWatchlist(["NVDA", "AAPL"], userId);

  let notifiedCount = 0;
  let lastReceived = [];

  const unsubscribe = subscribeWatchlist(userId, (symbols) => {
    notifiedCount++;
    lastReceived = symbols;
  });

  // Immediate notification on subscribe
  assert.equal(notifiedCount, 1);
  assert.deepEqual(lastReceived, ["NVDA", "AAPL"]);

  // Toggle new symbol
  toggleWatchlistSymbol("MSFT", userId);
  assert.equal(notifiedCount, 2);
  assert.deepEqual(lastReceived, ["NVDA", "AAPL", "MSFT"]);

  // Unsubscribe stops notifications
  unsubscribe();
  toggleWatchlistSymbol("TSLA", userId);
  assert.equal(notifiedCount, 2); // Unsubscribed, count did not increase
});

test("Watchlist deduplication: rapid repeated additions never create duplicate entries", () => {
  storage.clear();
  const userId = 202;

  // Rapid toggles
  toggleWatchlistSymbol("NVDA", userId);
  assert.deepEqual(loadUserWatchlist(userId), ["NVDA"]);

  toggleWatchlistSymbol("NVDA", userId);
  assert.deepEqual(loadUserWatchlist(userId), []);

  toggleWatchlistSymbol("NVDA", userId);
  assert.deepEqual(loadUserWatchlist(userId), ["NVDA"]);

  // Rapid direct adds
  addWatchlistSymbol("NVDA", userId);
  addWatchlistSymbol("nvda", userId);
  addWatchlistSymbol("NVDA", userId);
  assert.deepEqual(loadUserWatchlist(userId), ["NVDA"]);
  assert.equal(isSymbolWatched("NVDA", userId), true);
  assert.equal(isSymbolWatched("nvda", userId), true);

  // Direct array with duplicates passed to saveUserWatchlist
  saveUserWatchlist(["AAPL", "aapl", "AAPL", "MSFT"], userId);
  assert.deepEqual(loadUserWatchlist(userId), ["AAPL", "MSFT"]);
});

test("Watchlist empty state: removing final favorite results in empty array without stale entries", () => {
  storage.clear();
  const userId = 303;

  saveUserWatchlist(["GOOGL"], userId);
  assert.equal(loadUserWatchlist(userId).length, 1);

  removeWatchlistSymbol("GOOGL", userId);
  const remaining = loadUserWatchlist(userId);
  assert.deepEqual(remaining, []);
  assert.equal(isSymbolWatched("GOOGL", userId), false);
});

test("Watchlist account isolation: User A's watchlist does not leak into User B's watchlist", () => {
  storage.clear();
  const userA = 401;
  const userB = 402;

  let userANotified = [];
  let userBNotified = [];

  const unsubA = subscribeWatchlist(userA, (s) => { userANotified = s; });
  const unsubB = subscribeWatchlist(userB, (s) => { userBNotified = s; });

  saveUserWatchlist(["NVDA", "TSLA"], userA);
  saveUserWatchlist(["JPM", "BAC"], userB);

  assert.deepEqual(loadUserWatchlist(userA), ["NVDA", "TSLA"]);
  assert.deepEqual(loadUserWatchlist(userB), ["JPM", "BAC"]);
  assert.deepEqual(userANotified, ["NVDA", "TSLA"]);
  assert.deepEqual(userBNotified, ["JPM", "BAC"]);

  // Mutating User A does not alter User B
  toggleWatchlistSymbol("AAPL", userA);
  assert.deepEqual(loadUserWatchlist(userA), ["NVDA", "TSLA", "AAPL"]);
  assert.deepEqual(loadUserWatchlist(userB), ["JPM", "BAC"]);

  unsubA();
  unsubB();
});
