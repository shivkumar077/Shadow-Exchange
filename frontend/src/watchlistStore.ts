export const ALL_EXCHANGE_SYMBOLS = [
  "NVDA", "AAPL", "MSFT", "TSLA", "AMZN", "GOOGL", "META", "AMD",
  "AVGO", "CSCO", "INTC", "NFLX", "JPM", "BAC", "GS", "MS",
  "V", "MA", "JNJ", "UNH", "PFE", "LLY", "WMT", "COST",
  "KO", "PEP", "XOM", "BA",
];

const WATCHLIST_STORAGE_PREFIX = "shadow_watchlist_user_";
const PERSONALIZED_MARKET_STORAGE_PREFIX = "shadow_personalized_stocks_user_";

/**
 * Generates an artfully selected, non-duplicate subset of 8–18 instruments
 * from the full exchange universe.
 * If a numeric seed is provided (e.g. demo userId), the selection is fully deterministic
 * for reliable debugging and unit tests, yet varies across distinct users.
 */
export function generatePersonalizedStockSubset(
  availableSymbols: string[] = ALL_EXCHANGE_SYMBOLS,
  seed: number = Date.now()
): string[] {
  if (!availableSymbols || availableSymbols.length === 0) return [];
  const pool = [...availableSymbols];
  const total = pool.length;

  // LCG pseudo-random generator
  let state = Math.abs(Math.floor(seed)) || 12345;
  const nextRand = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };

  // Subset size between 8 and 18 (bounded by total available)
  const minSize = Math.min(8, total);
  const maxSize = Math.min(18, total);
  const range = maxSize - minSize + 1;
  const targetCount = minSize + Math.floor(nextRand() * range);

  // Fisher-Yates shuffle with pseudo-random seed
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(nextRand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, targetCount);
}

export function getPersonalizedMarketStorageKey(userId?: number | null): string {
  if (userId && Number.isFinite(userId) && userId > 0) {
    return `${PERSONALIZED_MARKET_STORAGE_PREFIX}${userId}`;
  }
  return `${PERSONALIZED_MARKET_STORAGE_PREFIX}default`;
}

/**
 * Loads the user's persistent personalized market subset (8–18 instruments).
 * If the account does not yet have a personalized subset, generates one and persists it.
 */
export function loadPersonalizedMarket(
  userId?: number | null,
  availableSymbols: string[] = ALL_EXCHANGE_SYMBOLS
): string[] {
  try {
    const key = getPersonalizedMarketStorageKey(userId);
    const data = window.localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Non-fatal, fall through to generation
  }

  // Generate and persist once for this user
  const generated = generatePersonalizedStockSubset(availableSymbols, userId ?? Date.now());
  savePersonalizedMarket(generated, userId);
  return generated;
}

export function savePersonalizedMarket(symbols: string[], userId?: number | null): void {
  try {
    const key = getPersonalizedMarketStorageKey(userId);
    window.localStorage.setItem(key, JSON.stringify(symbols));
  } catch {
    // Non-fatal
  }
}

export function addStockToPersonalizedMarket(symbol: string, userId?: number | null): string[] {
  const current = loadPersonalizedMarket(userId);
  const upper = symbol.trim().toUpperCase();
  if (current.includes(upper)) return current;
  const updated = [...current, upper];
  savePersonalizedMarket(updated, userId);
  return updated;
}

export function removeStockFromPersonalizedMarket(symbol: string, userId?: number | null): string[] {
  const current = loadPersonalizedMarket(userId);
  const upper = symbol.trim().toUpperCase();
  const updated = current.filter((s) => s !== upper);
  savePersonalizedMarket(updated, userId);
  return updated;
}

/* =========================================================================
   USER FAVORITES / WATCHLIST (EXPLICIT USER ACTIONS ONLY)
   ========================================================================= */

type WatchlistSubscriber = (symbols: string[]) => void;
const subscribersMap = new Map<string, Set<WatchlistSubscriber>>();

function getSubscriberKey(userId?: number | null): string {
  if (userId && Number.isFinite(userId) && userId > 0) {
    return `user_${userId}`;
  }
  return "user_default";
}

function notifySubscribers(userId: number | null | undefined, symbols: string[]): void {
  const key = getSubscriberKey(userId);
  const subs = subscribersMap.get(key);
  if (subs) {
    subs.forEach((callback) => {
      try {
        callback(symbols);
      } catch {
        // Non-fatal subscriber error
      }
    });
  }
}

// Listen to storage events for cross-tab sync if running in a browser
if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
  window.addEventListener("storage", (event) => {
    if (!event.key || !event.key.startsWith(WATCHLIST_STORAGE_PREFIX)) return;
    const rawUserId = event.key.replace(WATCHLIST_STORAGE_PREFIX, "");
    const userId = rawUserId === "default" ? null : Number(rawUserId);
    const symbols = loadUserWatchlist(userId);
    notifySubscribers(userId, symbols);
  });
}

/**
 * Subscribes to watchlist updates for a specific user ID.
 * Fires immediately with the current watchlist state, then on every change.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeWatchlist(
  userId: number | null | undefined,
  callback: WatchlistSubscriber
): () => void {
  const key = getSubscriberKey(userId);
  if (!subscribersMap.has(key)) {
    subscribersMap.set(key, new Set());
  }
  subscribersMap.get(key)!.add(callback);

  // Immediately notify subscriber with current persisted state
  try {
    callback(loadUserWatchlist(userId));
  } catch {
    // Non-fatal
  }

  return () => {
    const subs = subscribersMap.get(key);
    if (subs) {
      subs.delete(callback);
      if (subs.size === 0) {
        subscribersMap.delete(key);
      }
    }
  };
}

export function getWatchlistStorageKey(userId?: number | null): string {
  if (userId && Number.isFinite(userId) && userId > 0) {
    return `${WATCHLIST_STORAGE_PREFIX}${userId}`;
  }
  return `${WATCHLIST_STORAGE_PREFIX}default`;
}

/**
 * Loads the user's explicit favorites list.
 * NOTE: New demo accounts start with NO default favorites ([]).
 * Users explicitly mark/unmark their favorites.
 */
export function loadUserWatchlist(userId?: number | null): string[] {
  try {
    const key = getWatchlistStorageKey(userId);
    const data = window.localStorage.getItem(key);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    // Deduplicate and filter out empty strings
    return Array.from(new Set(parsed.map((s) => String(s).trim().toUpperCase()).filter(Boolean)));
  } catch {
    return [];
  }
}

export function saveUserWatchlist(symbols: string[], userId?: number | null): void {
  const deduplicated = Array.from(
    new Set(symbols.map((s) => String(s).trim().toUpperCase()).filter(Boolean))
  );
  try {
    const key = getWatchlistStorageKey(userId);
    window.localStorage.setItem(key, JSON.stringify(deduplicated));
  } catch {
    // Non-fatal
  }
  notifySubscribers(userId, deduplicated);
}

export function toggleWatchlistSymbol(symbol: string, userId?: number | null): string[] {
  if (!symbol || !symbol.trim()) return loadUserWatchlist(userId);
  const current = loadUserWatchlist(userId);
  const upper = symbol.trim().toUpperCase();
  let updated: string[];
  if (current.includes(upper)) {
    updated = current.filter((s) => s !== upper);
  } else {
    updated = [...current, upper];
  }
  saveUserWatchlist(updated, userId);
  return updated;
}

export function addWatchlistSymbol(symbol: string, userId?: number | null): string[] {
  if (!symbol || !symbol.trim()) return loadUserWatchlist(userId);
  const current = loadUserWatchlist(userId);
  const upper = symbol.trim().toUpperCase();
  if (current.includes(upper)) return current;
  const updated = [...current, upper];
  saveUserWatchlist(updated, userId);
  return updated;
}

export function removeWatchlistSymbol(symbol: string, userId?: number | null): string[] {
  if (!symbol || !symbol.trim()) return loadUserWatchlist(userId);
  const current = loadUserWatchlist(userId);
  const upper = symbol.trim().toUpperCase();
  const updated = current.filter((s) => s !== upper);
  saveUserWatchlist(updated, userId);
  return updated;
}

export function isSymbolWatched(symbol: string, userId?: number | null): boolean {
  if (!symbol || !symbol.trim()) return false;
  return loadUserWatchlist(userId).includes(symbol.trim().toUpperCase());
}
