import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Mock browser window and localStorage for store tests
class MemoryStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

globalThis.window = {
  localStorage: new MemoryStorage(),
  addEventListener: () => {},
  removeEventListener: () => {},
};

// Import watchlist store
const {
  loadUserWatchlist,
  saveUserWatchlist,
  toggleWatchlistSymbol,
  addWatchlistSymbol,
  removeWatchlistSymbol,
  isSymbolWatched,
  subscribeWatchlist,
  getWatchlistStorageKey,
} = await import("../src/watchlistStore.ts");

test("Deliverable 1: Stock Identity structure guarantees separate elements and no inline text collision", () => {
  const stockIdentitySource = fs.readFileSync(
    path.resolve(__dirname, "../src/components/StockIdentity.tsx"),
    "utf8"
  );
  const stylesSource = fs.readFileSync(path.resolve(__dirname, "../src/styles.css"), "utf8");

  // Verify StockIdentity component renders separate elements for symbol and name
  assert.ok(stockIdentitySource.includes("stock-identity-symbol"), "Must contain stock-identity-symbol");
  assert.ok(stockIdentitySource.includes("stock-identity-name"), "Must contain stock-identity-name");
  assert.ok(stockIdentitySource.includes("stock-identity-info"), "Must contain stock-identity-info container");

  // Verify CSS defines flex-direction column with gap for symbol and name
  assert.ok(stylesSource.includes(".stock-identity-info"), "styles.css must style .stock-identity-info");
  assert.ok(stylesSource.includes("flex-direction: column"), "Must use column direction to prevent inline text collision");
  assert.ok(stylesSource.includes("text-overflow: ellipsis"), "Must enforce sensible text truncation for long names");

  // Verify legacy table-asset and your-market-asset are guarded against inline collision
  assert.ok(stylesSource.includes(".table-asset"), "styles.css must guard .table-asset");
  assert.ok(stylesSource.includes(".your-market-asset"), "styles.css must guard .your-market-asset");
});

test("Deliverable 2: Watchlist functional immediate add, remove, and toggle", () => {
  const userId = 77889;
  window.localStorage.clear();

  // Initial state should be empty
  assert.deepEqual(loadUserWatchlist(userId), [], "New user starts with empty favorites");
  assert.equal(isSymbolWatched("NVDA", userId), false, "NVDA initially not watched");

  // Add favorite
  const afterAdd = toggleWatchlistSymbol("NVDA", userId);
  assert.deepEqual(afterAdd, ["NVDA"], "NVDA added to watchlist");
  assert.equal(isSymbolWatched("NVDA", userId), true, "isSymbolWatched returns true for NVDA");
  assert.deepEqual(loadUserWatchlist(userId), ["NVDA"], "Persisted watchlist has NVDA");

  // Add second favorite
  const afterSecond = toggleWatchlistSymbol("AAPL", userId);
  assert.deepEqual(afterSecond.sort(), ["AAPL", "NVDA"], "Both AAPL and NVDA present");

  // Remove favorite
  const afterRemove = toggleWatchlistSymbol("NVDA", userId);
  assert.deepEqual(afterRemove, ["AAPL"], "NVDA removed, AAPL remains");
  assert.equal(isSymbolWatched("NVDA", userId), false, "NVDA no longer watched");

  // Remove final favorite
  const afterEmpty = toggleWatchlistSymbol("AAPL", userId);
  assert.deepEqual(afterEmpty, [], "Watchlist empty after removing final favorite");
  assert.equal(loadUserWatchlist(userId).length, 0, "Persisted watchlist has 0 items");
});

test("Deliverable 2: Watchlist reactivity and subscriber notification", () => {
  const userId = 99123;
  window.localStorage.clear();

  let subscriberCalls = 0;
  let latestSymbols = [];

  const unsubscribe = subscribeWatchlist(userId, (symbols) => {
    subscriberCalls++;
    latestSymbols = symbols;
  });

  // Subscriber should fire immediately with current state
  assert.equal(subscriberCalls, 1, "Fires immediately on subscription");
  assert.deepEqual(latestSymbols, [], "Initial subscriber payload is empty array");

  // Mutate watchlist
  toggleWatchlistSymbol("TSLA", userId);
  assert.equal(subscriberCalls, 2, "Subscriber called on addition");
  assert.deepEqual(latestSymbols, ["TSLA"], "Subscriber received TSLA");

  toggleWatchlistSymbol("MSFT", userId);
  assert.equal(subscriberCalls, 3, "Subscriber called on second addition");
  assert.deepEqual(latestSymbols.sort(), ["MSFT", "TSLA"], "Subscriber received TSLA and MSFT");

  toggleWatchlistSymbol("TSLA", userId);
  assert.equal(subscriberCalls, 4, "Subscriber called on removal");
  assert.deepEqual(latestSymbols, ["MSFT"], "Subscriber received MSFT");

  unsubscribe();
  toggleWatchlistSymbol("GOOGL", userId);
  assert.equal(subscriberCalls, 4, "Subscriber not called after unsubscription");
});

test("Deliverable 2: Watchlist account isolation and persistence across reload", () => {
  const userA = 1001;
  const userB = 2002;
  window.localStorage.clear();

  // User A adds stocks
  addWatchlistSymbol("NVDA", userA);
  addWatchlistSymbol("AMD", userA);

  // User B adds different stocks
  addWatchlistSymbol("KO", userB);
  addWatchlistSymbol("PEP", userB);

  // Verify complete isolation
  assert.deepEqual(loadUserWatchlist(userA).sort(), ["AMD", "NVDA"]);
  assert.deepEqual(loadUserWatchlist(userB).sort(), ["KO", "PEP"]);
  assert.equal(isSymbolWatched("NVDA", userA), true);
  assert.equal(isSymbolWatched("NVDA", userB), false);

  // Simulate page reload by re-reading localStorage
  const keyA = getWatchlistStorageKey(userA);
  const rawDataA = JSON.parse(window.localStorage.getItem(keyA));
  assert.deepEqual(rawDataA.sort(), ["AMD", "NVDA"], "User A persisted correctly");

  const keyB = getWatchlistStorageKey(userB);
  const rawDataB = JSON.parse(window.localStorage.getItem(keyB));
  assert.deepEqual(rawDataB.sort(), ["KO", "PEP"], "User B persisted correctly");
});

test("Deliverable 2: Rapid toggling and duplicate prevention", () => {
  const userId = 55443;
  window.localStorage.clear();

  // Rapidly add same symbol multiple times
  addWatchlistSymbol("AMZN", userId);
  addWatchlistSymbol("AMZN", userId);
  addWatchlistSymbol("amzn", userId);
  addWatchlistSymbol(" AMZN ", userId);

  const list = loadUserWatchlist(userId);
  assert.deepEqual(list, ["AMZN"], "No duplicate entries created from repeated additions");

  // Rapid toggling 6 times from ['AMZN'] should leave it in its original state ['AMZN']
  for (let i = 0; i < 6; i++) {
    toggleWatchlistSymbol("AMZN", userId);
  }
  assert.deepEqual(loadUserWatchlist(userId), ["AMZN"], "Even number of rapid toggles leaves item in initial state");

  // Toggling once more (odd number) removes it
  toggleWatchlistSymbol("AMZN", userId);
  assert.deepEqual(loadUserWatchlist(userId), [], "Single toggle removes item from watchlist");
});

test("Deliverable 2: WATCH button styling prevents star wrapping and defines clear states", () => {
  const stylesSource = fs.readFileSync(path.resolve(__dirname, "../src/styles.css"), "utf8");

  // Verify .star-watch-btn uses inline-flex with horizontal row alignment
  assert.ok(stylesSource.includes(".star-watch-btn {"), "Must contain .star-watch-btn");
  assert.ok(stylesSource.includes("display: inline-flex;"), "Must use inline-flex for horizontal alignment");
  assert.ok(stylesSource.includes("align-items: center;"), "Must center items vertically");
  assert.ok(stylesSource.includes("white-space: nowrap;"), "Must prevent text from wrapping");

  // Verify watched state styling
  assert.ok(stylesSource.includes(".star-watch-btn.is-watched"), "Must define .star-watch-btn.is-watched");
  assert.ok(stylesSource.includes(".star-watch-btn:focus-visible"), "Must define focus-visible state");
  assert.ok(stylesSource.includes(".star-watch-btn:disabled"), "Must define disabled state");

  // Verify labeled button variant has min-width
  assert.ok(stylesSource.includes(".star-watch-btn.watch-status-btn"), "Must define .watch-status-btn variant");
});

test("Deliverable 3: Custom cursor defines precision trading reticle and interactive pointer", () => {
  const stylesSource = fs.readFileSync(path.resolve(__dirname, "../src/styles.css"), "utf8");

  // Verify custom cursor CSS custom properties
  assert.ok(stylesSource.includes("--cursor-default:"), "Must define --cursor-default");
  assert.ok(stylesSource.includes("--cursor-pointer:"), "Must define --cursor-pointer");
  assert.ok(stylesSource.includes("--cursor-crosshair:"), "Must define --cursor-crosshair");

  // Verify SVG data-URI with reticle crosshair and lime green pupil (%23d3f17b)
  assert.ok(stylesSource.includes("%23d3f17b"), "Must use brand signal accent #d3f17b in cursor SVG");
  assert.ok(stylesSource.includes("12 12, crosshair"), "Must use 12 12 hotspot and crosshair fallback");
  assert.ok(stylesSource.includes("12 12, pointer"), "Must use 12 12 hotspot and pointer fallback for precision diamond cat-eye pointer");
  assert.ok(stylesSource.includes("points='12,3 21,12 12,21 3,12'"), "Must define precision diamond polygon in interactive pointer");
  assert.ok(!stylesSource.includes("rx='1.6' ry='1.9'"), "Must remove old paw pad prints from interactive cursor");

  // Verify interactive elements use var(--cursor-pointer)
  assert.ok(stylesSource.includes("cursor: var(--cursor-pointer)"), "Interactive elements must use var(--cursor-pointer)");

  // Verify native text selection and input cursor preservation
  assert.ok(stylesSource.includes("cursor: text !important"), "Must preserve native text cursor on inputs and textareas");
  assert.ok(stylesSource.includes("cursor: not-allowed !important"), "Must preserve not-allowed cursor on disabled elements");

  // Verify graceful degradation on touch devices
  assert.ok(stylesSource.includes("@media (hover: none) and (pointer: coarse)"), "Must degrade gracefully on touch devices");
  assert.ok(stylesSource.includes("cursor: auto !important"), "Must reset to auto on touch devices");
});

test("Order ticket simplification: redundant Order Type section removed, limit price preserved", () => {
  const appSource = fs.readFileSync(path.resolve(__dirname, "../src/App.tsx"), "utf8");

  // Verify Order Type section, badges, and redundant text are removed from App.tsx
  assert.equal(appSource.includes("SUPPORTED TYPE"), false, "Must not contain redundant 'SUPPORTED TYPE' label");
  assert.equal(appSource.includes("Specified boundary price"), false, "Must not contain 'Specified boundary price' explainer");
  assert.equal(appSource.includes('htmlFor="order-type"'), false, "Must not contain order-type label");
  assert.equal(appSource.includes('id="order-type"'), false, "Must not contain order-type container");

  // Verify LIMIT PRICE input and placeholder remain present and clear
  assert.ok(appSource.includes('id="limit-price"'), "Must preserve limit-price input");
  assert.ok(appSource.includes('placeholder="Limit price per share"'), "Must provide clear limit price placeholder");
  assert.ok(appSource.includes('LIMIT PRICE'), "Must preserve LIMIT PRICE label");
});

test("Available cash readability: font size, weight, and hierarchy enhanced", () => {
  const stylesSource = fs.readFileSync(path.resolve(__dirname, "../src/styles.css"), "utf8");

  // Verify .order-balance-pill styling
  assert.ok(stylesSource.includes(".order-balance-pill strong {"), "Must style .order-balance-pill strong");
  assert.ok(stylesSource.includes("font-size: 13px;"), "Must increase available cash font size to 13px");
  assert.ok(stylesSource.includes("font-weight: 600;"), "Must give available cash prominent font-weight 600");
  assert.ok(stylesSource.includes(".order-balance-pill > span {"), "Must style balance pill label as secondary");
  assert.ok(stylesSource.includes("letter-spacing: .08em;"), "Must preserve uppercase monospace styling for balance label");
});
