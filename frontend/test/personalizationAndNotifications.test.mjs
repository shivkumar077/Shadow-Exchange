import test from "node:test";
import assert from "node:assert/strict";
import {
  ALL_EXCHANGE_SYMBOLS,
  generatePersonalizedStockSubset,
  loadPersonalizedMarket,
  savePersonalizedMarket,
  addStockToPersonalizedMarket,
  removeStockFromPersonalizedMarket,
  loadUserWatchlist,
  saveUserWatchlist,
  toggleWatchlistSymbol,
  isSymbolWatched,
} from "../src/watchlistStore.ts";
import {
  hasOrderNotificationBeenSent,
  recordOrderNotificationSent,
  formatOrderFilledMessage,
  formatOrderPartiallyFilledMessage,
  createNotification,
} from "../src/notifications/notificationStore.ts";
import {
  createReaction,
  shouldShowReaction,
} from "../src/personality/personalitySystem.ts";

function createMockStorage() {
  const store = new Map();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
}

test("Personalized stock universe: generates 8–18 unique stocks from the 28 universe", () => {
  assert.equal(ALL_EXCHANGE_SYMBOLS.length, 28);

  const subset = generatePersonalizedStockSubset(ALL_EXCHANGE_SYMBOLS, 101);
  assert.ok(subset.length >= 8 && subset.length <= 18, `Expected length between 8 and 18, got ${subset.length}`);

  // No duplicates
  const unique = new Set(subset);
  assert.equal(unique.size, subset.length);

  // Every stock is a genuine instrument from the 28 universe
  subset.forEach((sym) => {
    assert.ok(ALL_EXCHANGE_SYMBOLS.includes(sym), `Unknown stock symbol ${sym}`);
  });
});

test("Personalized stock universe: deterministic for same seed, varies across different users", () => {
  const user1 = generatePersonalizedStockSubset(ALL_EXCHANGE_SYMBOLS, 501);
  const user1Again = generatePersonalizedStockSubset(ALL_EXCHANGE_SYMBOLS, 501);
  const user2 = generatePersonalizedStockSubset(ALL_EXCHANGE_SYMBOLS, 802);

  // Same seed produces identical result
  assert.deepEqual(user1, user1Again);

  // Different seeds produce distinct selections
  assert.notDeepEqual(user1, user2);
});

test("Personalized stock universe: loads and persists per account without rerandomizing", () => {
  const originalWindow = globalThis.window;
  const mockStorage = createMockStorage();
  globalThis.window = { localStorage: mockStorage };

  try {
    const userId1 = 123;
    const userId2 = 456;

    const initial1 = loadPersonalizedMarket(userId1);
    assert.ok(initial1.length >= 8 && initial1.length <= 18);

    // Calling again does not re-randomize
    const secondCall1 = loadPersonalizedMarket(userId1);
    assert.deepEqual(secondCall1, initial1);

    // User 2 has distinct subset
    const initial2 = loadPersonalizedMarket(userId2);
    assert.notDeepEqual(initial2, initial1);

    // Adding and removing instruments from user 1's personalized view
    const added = addStockToPersonalizedMarket("BA", userId1);
    assert.ok(added.includes("BA"));

    const removed = removeStockFromPersonalizedMarket("BA", userId1);
    assert.ok(!removed.includes("BA"));

    // User 2 remains unaffected
    const check2 = loadPersonalizedMarket(userId2);
    assert.deepEqual(check2, initial2);
  } finally {
    globalThis.window = originalWindow;
  }
});

test("Default favorites: new accounts have empty favorites list with no preselected stocks", () => {
  const originalWindow = globalThis.window;
  const mockStorage = createMockStorage();
  globalThis.window = { localStorage: mockStorage };

  try {
    const newDemoUser = 789;
    const favorites = loadUserWatchlist(newDemoUser);

    // MUST be empty array, not the old 5 hardcoded stocks
    assert.deepEqual(favorites, []);
    assert.equal(isSymbolWatched("NVDA", newDemoUser), false);
    assert.equal(isSymbolWatched("AAPL", newDemoUser), false);

    // User marks AAPL as favorite
    const toggled = toggleWatchlistSymbol("AAPL", newDemoUser);
    assert.deepEqual(toggled, ["AAPL"]);
    assert.equal(isSymbolWatched("AAPL", newDemoUser), true);

    // Unmarking AAPL
    const untoggled = toggleWatchlistSymbol("AAPL", newDemoUser);
    assert.deepEqual(untoggled, []);
    assert.equal(isSymbolWatched("AAPL", newDemoUser), false);
  } finally {
    globalThis.window = originalWindow;
  }
});

test("Order notifications: message formatting contains real execution details", () => {
  const buyMsg = formatOrderFilledMessage("BUY", "AAPL", 10, 142.87);
  assert.equal(buyMsg, "Your BUY order for AAPL has been filled: 10 shares at $142.87.");

  const sellMsg = formatOrderFilledMessage("SELL", "NVDA", 25, 480.5);
  assert.equal(sellMsg, "Your SELL order for NVDA has been filled: 25 shares at $480.50.");

  const partialMsg = formatOrderPartiallyFilledMessage("BUY", "MSFT", 5, 320.0);
  assert.equal(partialMsg, "Your BUY order for MSFT partially filled: 5 shares at $320.00.");
});

test("Order notifications: deduplication prevents repeated notifications for the same status", () => {
  const originalWindow = globalThis.window;
  const mockStorage = createMockStorage();
  globalThis.window = { localStorage: mockStorage };

  try {
    const userId = 321;
    const orderId = 999;

    // Initially not sent
    assert.equal(hasOrderNotificationBeenSent(userId, orderId, "SUBMITTED"), false);
    assert.equal(hasOrderNotificationBeenSent(userId, orderId, "FILLED"), false);

    // Record submission
    recordOrderNotificationSent(userId, orderId, "SUBMITTED");
    assert.equal(hasOrderNotificationBeenSent(userId, orderId, "SUBMITTED"), true);
    // Fill has not yet been recorded
    assert.equal(hasOrderNotificationBeenSent(userId, orderId, "FILLED"), false);

    // Record fill
    recordOrderNotificationSent(userId, orderId, "FILLED");
    assert.equal(hasOrderNotificationBeenSent(userId, orderId, "FILLED"), true);

    // Different user is isolated
    assert.equal(hasOrderNotificationBeenSent(456, orderId, "FILLED"), false);
  } finally {
    globalThis.window = originalWindow;
  }
});

test("Shadow Cat personality: extreme and deadpan modes are supported with reactions", () => {
  // Extreme mode reaction check
  const reactionFilled = createReaction("ORDER_FILLED");
  assert.ok(reactionFilled.message.length > 0);
  assert.equal(shouldShowReaction("high", "extreme"), true);
  assert.equal(shouldShowReaction("low", "extreme"), true);

  // Deadpan mode reaction check
  assert.equal(shouldShowReaction("high", "deadpan"), true);
  assert.equal(shouldShowReaction("medium", "deadpan"), true);
  assert.equal(shouldShowReaction("low", "deadpan"), false);

  // Minimal mode filters low priority
  assert.equal(shouldShowReaction("low", "minimal"), false);
});
