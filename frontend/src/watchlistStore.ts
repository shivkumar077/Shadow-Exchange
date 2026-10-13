const DEFAULT_WATCHED_SYMBOLS = ["NVDA", "AAPL", "MSFT", "TSLA", "AMZN"];
const WATCHLIST_STORAGE_PREFIX = "shadow_watchlist_user_";

export function getWatchlistStorageKey(userId?: number | null): string {
  if (userId && Number.isFinite(userId) && userId > 0) {
    return `${WATCHLIST_STORAGE_PREFIX}${userId}`;
  }
  return `${WATCHLIST_STORAGE_PREFIX}default`;
}

export function loadUserWatchlist(userId?: number | null): string[] {
  try {
    const key = getWatchlistStorageKey(userId);
    const data = window.localStorage.getItem(key);
    if (!data) return DEFAULT_WATCHED_SYMBOLS;
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : DEFAULT_WATCHED_SYMBOLS;
  } catch {
    return DEFAULT_WATCHED_SYMBOLS;
  }
}

export function saveUserWatchlist(symbols: string[], userId?: number | null): void {
  try {
    const key = getWatchlistStorageKey(userId);
    window.localStorage.setItem(key, JSON.stringify(symbols));
  } catch {
    // Non-fatal
  }
}

export function toggleWatchlistSymbol(symbol: string, userId?: number | null): string[] {
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

export function isSymbolWatched(symbol: string, userId?: number | null): boolean {
  return loadUserWatchlist(userId).includes(symbol.trim().toUpperCase());
}

