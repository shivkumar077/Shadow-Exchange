import test from "node:test";
import assert from "node:assert/strict";
import { MASCOT_EXPRESSIONS } from "../src/assets/mascot/mascotSvgs.ts";
import { getChartHistory, TIMEFRAME_LABELS } from "../src/chartHistory.ts";
import { getMarketPulseIndicators } from "../src/marketPulse.ts";
import {
  createReaction,
  shouldShowReaction,
  REACTION_DEFINITIONS,
} from "../src/personality/personalitySystem.ts";
import {
  createNotification,
  loadUserNotifications,
  saveUserNotifications,
} from "../src/notifications/notificationStore.ts";
import {
  loadUserWatchlist,
  toggleWatchlistSymbol,
  saveUserWatchlist,
  isSymbolWatched,
} from "../src/watchlistStore.ts";
import {
  assignRandomIdentityForUser,
  getStoredIdentity,
  SIGNATURE_IDENTITIES,
} from "../src/identities.ts";
import { unlockAchievement, loadUserAchievements } from "../src/achievements.ts";

test("Shadow Cat mascot library defines all 10 required artistic expressions", () => {
  const requiredExpressions = [
    "neutral",
    "blessed",
    "suspicious",
    "broke",
    "profit",
    "loss",
    "sleepy",
    "facepalm",
    "thinking",
    "404",
  ];

  for (const exp of requiredExpressions) {
    assert.ok(
      MASCOT_EXPRESSIONS[exp],
      `Expression '${exp}' must be defined in MASCOT_EXPRESSIONS`,
    );
    assert.ok(
      MASCOT_EXPRESSIONS[exp].description.length > 0,
      `Expression '${exp}' must have a description`,
    );
  }
});

test("Chart timeframes 1D, 1W, 1M, 1Y generate reproducible and valid datasets", () => {
  const timeframes = ["1D", "1W", "1M", "1Y"];
  const symbol = "NVDA";
  const refPrice = 128.5;

  for (const tf of timeframes) {
    const data1 = getChartHistory(symbol, tf, refPrice);
    const data2 = getChartHistory(symbol, tf, refPrice);

    assert.equal(data1.timeframe, tf);
    assert.deepEqual(
      data1.points,
      data2.points,
      `Synthetic history for ${tf} must be deterministic`,
    );
    assert.equal(data1.rawPrices.length, data1.points.length);
    assert.ok(data1.rawPrices.length >= 20, "Should have sufficient data points");

    // Mathematical agreement
    assert.ok(data1.periodHigh >= data1.periodLow, "High must be >= Low");
    assert.ok(data1.periodHigh >= data1.periodOpen, "High must be >= Open");
    assert.ok(data1.periodHigh >= data1.periodClose, "High must be >= Close");
    assert.ok(data1.periodLow <= data1.periodOpen, "Low must be <= Open");
    assert.ok(data1.periodLow <= data1.periodClose, "Low must be <= Close");

    const expectedChange = Number((data1.periodClose - data1.periodOpen).toFixed(2));
    assert.equal(data1.change, expectedChange, "Change must equal periodClose - periodOpen");

    const expectedPct = Number(((data1.change / data1.periodOpen) * 100).toFixed(2));
    assert.equal(data1.changePercent, expectedPct, "changePercent must agree with change and open");

    // X-axis labels
    assert.deepEqual(data1.xLabels, TIMEFRAME_LABELS[tf]);
  }
});

test("Switching instrument changes chart series reproducibly", () => {
  const nvda1 = getChartHistory("NVDA", "1D", 128.5);
  const aapl1 = getChartHistory("AAPL", "1D", 224.23);

  assert.notDeepEqual(
    nvda1.points,
    aapl1.points,
    "Different symbols must produce distinct chart paths",
  );
  assert.equal(nvda1.periodClose, 128.5);
  assert.equal(aapl1.periodClose, 224.23);
});

test("Market Pulse indicators are deterministic and stable across same 30m window", () => {
  const baseTime = 1776000000000; // arbitrary fixed epoch
  const run1 = getMarketPulseIndicators(baseTime);
  const run2 = getMarketPulseIndicators(baseTime + 5 * 60 * 1000); // 5 mins later in same 30m bucket

  assert.equal(run1.length, 4, "Must provide 4 benchmark indices");
  assert.deepEqual(run1, run2, "Observations must remain identical within the same 30m window");

  for (const ind of run1) {
    assert.ok(ind.name, "Index must have a name");
    assert.ok(ind.formattedValue, "Index must have formattedValue");
    assert.equal(ind.sparkline.length, 12, "Intraday sparkline must have 12 points");
    assert.equal(typeof ind.isPositive, "boolean");
    assert.equal(typeof ind.changePercent, "number");
  }

  // 35 minutes later should advance
  const run3 = getMarketPulseIndicators(baseTime + 35 * 60 * 1000);
  assert.notEqual(run1[0].currentValue, run3[0].currentValue, "Observations should advance after 30 mins");
});

test("Personality reaction system maps real events to deadpan cat responses", () => {
  const orderFilledReaction = createReaction("ORDER_FILLED");
  assert.equal(orderFilledReaction.expression, "blessed");
  assert.ok(orderFilledReaction.message.toLowerCase().includes("blessed"));
  assert.equal(orderFilledReaction.priority, "medium");

  const lowballReaction = createReaction("LOWBALL_OFFER");
  assert.equal(lowballReaction.expression, "suspicious");
  assert.ok(lowballReaction.message.toLowerCase().includes("unconvinced"));

  const brokeReaction = createReaction("INSUFFICIENT_FUNDS");
  assert.equal(brokeReaction.expression, "broke");
  assert.equal(brokeReaction.priority, "high");

  const lostReaction = createReaction("LOST_ROUTE");
  assert.equal(lostReaction.expression, "404");
});

test("Personality reactions respect operator preferences (full, minimal, muted)", () => {
  // High priority errors (e.g. insufficient funds) always show in full and minimal
  assert.equal(shouldShowReaction("high", "full"), true);
  assert.equal(shouldShowReaction("high", "minimal"), true);
  assert.equal(shouldShowReaction("high", "muted"), false);

  // Medium priority (e.g. order filled) shows in full, hidden in minimal and muted
  assert.equal(shouldShowReaction("medium", "full"), true);
  assert.equal(shouldShowReaction("medium", "minimal"), false);
  assert.equal(shouldShowReaction("medium", "muted"), false);

  // Low priority shows only in full
  assert.equal(shouldShowReaction("low", "full"), true);
  assert.equal(shouldShowReaction("low", "minimal"), false);
  assert.equal(shouldShowReaction("low", "muted"), false);
});

test("Notification store operates correctly with account scoping and read/unread dismissal", () => {
  const mockStorage = new Map();
  const originalWindow = globalThis.window;
  globalThis.window = {
    localStorage: {
      getItem: (k) => mockStorage.get(k) ?? null,
      setItem: (k, v) => mockStorage.set(k, String(v)),
      removeItem: (k) => mockStorage.delete(k),
    },
  };

  try {
    const user1 = 101;
    const user2 = 102;

    const notif1 = createNotification({
      type: "ORDER_FILLED",
      title: "Order #1 Filled",
      message: "BUY 10 NVDA executed at $128.50",
      expression: "blessed",
      orderId: 1,
      symbol: "NVDA",
    });

    saveUserNotifications([notif1], user1);
    assert.equal(loadUserNotifications(user1).length, 1);
    assert.equal(loadUserNotifications(user2).length, 0, "User 2 notifications must remain isolated");

    // Mark as read
    const user1Notifs = loadUserNotifications(user1);
    user1Notifs[0].read = true;
    saveUserNotifications(user1Notifs, user1);
    assert.equal(loadUserNotifications(user1)[0].read, true);

    // Dismiss
    saveUserNotifications([], user1);
    assert.equal(loadUserNotifications(user1).length, 0);
  } finally {
    globalThis.window = originalWindow;
  }
});

test("Your Market watchlist supports empty initial favorites, add/remove, and per-account isolation", () => {
  const mockStorage = new Map();
  const originalWindow = globalThis.window;
  globalThis.window = {
    localStorage: {
      getItem: (k) => mockStorage.get(k) ?? null,
      setItem: (k, v) => mockStorage.set(k, String(v)),
      removeItem: (k) => mockStorage.delete(k),
    },
  };

  try {
    const userA = 42;
    const userB = 99;

    // Initially loads empty favorites for new demo accounts (no hardcoded defaults)
    const initialA = loadUserWatchlist(userA);
    assert.deepEqual(initialA, []);
    assert.equal(isSymbolWatched("NVDA", userA), false);

    // Add NVDA for user A
    const updatedA = toggleWatchlistSymbol("NVDA", userA);
    assert.ok(updatedA.includes("NVDA"));
    assert.equal(isSymbolWatched("NVDA", userA), true);

    // User B is isolated and still has empty favorites
    const initialB = loadUserWatchlist(userB);
    assert.deepEqual(initialB, []);
    assert.equal(isSymbolWatched("NVDA", userB), false);

    // Add GOOGL to user A
    const withGoogl = toggleWatchlistSymbol("GOOGL", userA);
    assert.ok(withGoogl.includes("GOOGL"));
    assert.ok(withGoogl.includes("NVDA"));
    assert.equal(isSymbolWatched("GOOGL", userA), true);

    // Remove NVDA from user A
    const withoutNvda = toggleWatchlistSymbol("NVDA", userA);
    assert.ok(!withoutNvda.includes("NVDA"));
    assert.ok(withoutNvda.includes("GOOGL"));
    assert.equal(isSymbolWatched("NVDA", userA), false);

    // Persistence check on re-load
    const reloadedA = loadUserWatchlist(userA);
    assert.deepEqual(reloadedA, ["GOOGL"]);
  } finally {
    globalThis.window = originalWindow;
  }
});

test("Random identity assignment is persistent per new account without overwriting existing", () => {
  const mockStorage = new Map();
  const originalWindow = globalThis.window;
  globalThis.window = {
    localStorage: {
      getItem: (k) => mockStorage.get(k) ?? null,
      setItem: (k, v) => mockStorage.set(k, String(v)),
      removeItem: (k) => mockStorage.delete(k),
    },
  };

  try {
    const newUser1 = 501;
    const assigned1 = assignRandomIdentityForUser(newUser1);
    assert.ok(assigned1.id, "Assigned identity must have an id");
    assert.ok(
      SIGNATURE_IDENTITIES.some((id) => id.id === assigned1.id),
      "Assigned identity must belong to the signature collection",
    );

    // Re-assigning or getting stored returns identical identity
    const reassigned1 = assignRandomIdentityForUser(newUser1);
    assert.equal(reassigned1.id, assigned1.id, "Must be persistent, not re-randomized");

    const stored1 = getStoredIdentity(newUser1);
    assert.equal(stored1.id, assigned1.id, "getStoredIdentity must match assigned");
  } finally {
    globalThis.window = originalWindow;
  }
});

test("Achievements unlock and persist without granting financial rewards", () => {
  const mockStorage = new Map();
  const originalWindow = globalThis.window;
  globalThis.window = {
    localStorage: {
      getItem: (k) => mockStorage.get(k) ?? null,
      setItem: (k, v) => mockStorage.set(k, String(v)),
      removeItem: (k) => mockStorage.delete(k),
    },
  };

  try {
    const user = 777;
    assert.equal(Object.keys(loadUserAchievements(user)).length, 0);

    const first = unlockAchievement("first_order", user);
    assert.ok(first);
    assert.equal(first.id, "first_order");
    assert.equal(Object.keys(loadUserAchievements(user)).length, 1);

    // Idempotent: unlocking again does not duplicate
    const second = unlockAchievement("first_order", user);
    assert.equal(second, null);
    assert.equal(Object.keys(loadUserAchievements(user)).length, 1);
  } finally {
    globalThis.window = originalWindow;
  }
});
