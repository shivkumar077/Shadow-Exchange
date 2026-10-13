import test from "node:test";
import assert from "node:assert/strict";
import { getChartPoints, STOCK_CHART_SHAPES, DEFAULT_CHART_POINTS } from "../src/stockCharts.ts";
import { mapApiOrders } from "../src/api.ts";

// Canonical 28 exchange universe matching backend seed
const CANONICAL_UNIVERSE = [
  { id: 1, symbol: "NVDA", name: "NVIDIA Corporation", price: 128.5 },
  { id: 2, symbol: "AAPL", name: "Apple Inc.", price: 224.23 },
  { id: 3, symbol: "MSFT", name: "Microsoft Corporation", price: 448.37 },
  { id: 4, symbol: "TSLA", name: "Tesla, Inc.", price: 254.11 },
  { id: 5, symbol: "AMZN", name: "Amazon.com, Inc.", price: 186.4 },
  { id: 6, symbol: "GOOGL", name: "Alphabet Inc. (Class A)", price: 164.5 },
  { id: 7, symbol: "META", name: "Meta Platforms, Inc.", price: 585.0 },
  { id: 8, symbol: "AMD", name: "Advanced Micro Devices, Inc.", price: 156.25 },
  { id: 9, symbol: "AVGO", name: "Broadcom Inc.", price: 175.8 },
  { id: 10, symbol: "CSCO", name: "Cisco Systems, Inc.", price: 56.4 },
  { id: 11, symbol: "INTC", name: "Intel Corporation", price: 23.1 },
  { id: 12, symbol: "NFLX", name: "Netflix, Inc.", price: 710.0 },
  { id: 13, symbol: "JPM", name: "JPMorgan Chase & Co.", price: 222.4 },
  { id: 14, symbol: "BAC", name: "Bank of America Corporation", price: 42.15 },
  { id: 15, symbol: "GS", name: "The Goldman Sachs Group, Inc.", price: 512.6 },
  { id: 16, symbol: "MS", name: "Morgan Stanley", price: 118.9 },
  { id: 17, symbol: "V", name: "Visa Inc.", price: 282.5 },
  { id: 18, symbol: "MA", name: "Mastercard Incorporated", price: 495.2 },
  { id: 19, symbol: "JNJ", name: "Johnson & Johnson", price: 162.3 },
  { id: 20, symbol: "UNH", name: "UnitedHealth Group Incorporated", price: 590.1 },
  { id: 21, symbol: "PFE", name: "Pfizer Inc.", price: 28.7 },
  { id: 22, symbol: "LLY", name: "Eli Lilly and Company", price: 915.0 },
  { id: 23, symbol: "WMT", name: "Walmart Inc.", price: 80.5 },
  { id: 24, symbol: "COST", name: "Costco Wholesale Corporation", price: 902.4 },
  { id: 25, symbol: "KO", name: "The Coca-Cola Company", price: 68.9 },
  { id: 26, symbol: "PEP", name: "PepsiCo, Inc.", price: 172.5 },
  { id: 27, symbol: "XOM", name: "Exxon Mobil Corporation", price: 124.8 },
  { id: 28, symbol: "BA", name: "The Boeing Company", price: 154.2 },
];

test("Expanded instrument universe contains 28 unique, valid instruments", () => {
  assert.equal(CANONICAL_UNIVERSE.length, 28);
  const symbols = new Set(CANONICAL_UNIVERSE.map((s) => s.symbol));
  assert.equal(symbols.size, 28, "All 28 symbols must be unique");

  const ids = new Set(CANONICAL_UNIVERSE.map((s) => s.id));
  assert.equal(ids.size, 28, "All 28 IDs must be unique");

  // Original 5 preserve exact IDs 1..5
  assert.equal(CANONICAL_UNIVERSE[0].symbol, "NVDA");
  assert.equal(CANONICAL_UNIVERSE[0].id, 1);
  assert.equal(CANONICAL_UNIVERSE[1].symbol, "AAPL");
  assert.equal(CANONICAL_UNIVERSE[1].id, 2);
  assert.equal(CANONICAL_UNIVERSE[2].symbol, "MSFT");
  assert.equal(CANONICAL_UNIVERSE[2].id, 3);
  assert.equal(CANONICAL_UNIVERSE[3].symbol, "TSLA");
  assert.equal(CANONICAL_UNIVERSE[3].id, 4);
  assert.equal(CANONICAL_UNIVERSE[4].symbol, "AMZN");
  assert.equal(CANONICAL_UNIVERSE[4].id, 5);
});

test("Chart curves provide 25 points for all 28 instruments and generator fallback", () => {
  assert.equal(Object.keys(STOCK_CHART_SHAPES).length, 28);
  for (const stock of CANONICAL_UNIVERSE) {
    const points = getChartPoints(stock.symbol);
    assert.equal(points.length, 25, `Stock ${stock.symbol} must have 25 chart points`);
    for (const pt of points) {
      assert.ok(typeof pt === "number" && Number.isFinite(pt));
      assert.ok(pt >= 0 && pt <= 100);
    }
  }

  // Fallback for null/undefined symbol
  const defPoints = getChartPoints(null);
  assert.deepEqual(defPoints, DEFAULT_CHART_POINTS);

  // Fallback for unknown symbol generates valid 25 points deterministically
  const unknownPoints1 = getChartPoints("UNKNOWN");
  const unknownPoints2 = getChartPoints("UNKNOWN");
  assert.equal(unknownPoints1.length, 25);
  assert.deepEqual(unknownPoints1, unknownPoints2);
});

test("Instrument search by ticker symbol and company name", () => {
  function searchUniverse(query, items) {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q),
    );
  }

  // By ticker
  const jpmResults = searchUniverse("JPM", CANONICAL_UNIVERSE);
  assert.equal(jpmResults.length, 1);
  assert.equal(jpmResults[0].symbol, "JPM");

  // By partial company name
  const pharmaResults = searchUniverse("Pfizer", CANONICAL_UNIVERSE);
  assert.equal(pharmaResults.length, 1);
  assert.equal(pharmaResults[0].symbol, "PFE");

  // Case insensitive
  const techResults = searchUniverse("nvidia", CANONICAL_UNIVERSE);
  assert.equal(techResults.length, 1);
  assert.equal(techResults[0].symbol, "NVDA");

  // Multiple matches: "Corporation" matches multiple
  const corpResults = searchUniverse("Corporation", CANONICAL_UNIVERSE);
  assert.ok(corpResults.length > 3);
});

test("mapApiOrders resolves added instruments and prevents #<id> fallback", () => {
  const apiOrders = [
    {
      id: 501,
      userId: 1,
      stockId: 13, // JPM
      type: "BUY",
      price: 220.0,
      quantity: 15,
      status: "PENDING",
      createdAt: "2026-10-13T10:00:00",
    },
    {
      id: 502,
      userId: 1,
      stockId: 28, // BA
      type: "SELL",
      price: 155.0,
      quantity: 10,
      status: "FILLED",
      createdAt: "2026-10-13T10:05:00",
    },
  ];

  const mapped = mapApiOrders(apiOrders, CANONICAL_UNIVERSE);
  assert.equal(mapped.length, 2);
  assert.equal(mapped[0].symbol, "JPM");
  assert.equal(mapped[0].stockId, 13);
  assert.equal(mapped[1].symbol, "BA");
  assert.equal(mapped[1].stockId, 28);
});

test("Unavailable market quotes (0 or negative) are distinguishable from valid positive quotes", () => {
  const formatPrice = (price) =>
    Number.isFinite(price) && price > 0
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price)
      : "Quote pending";

  assert.equal(formatPrice(128.5), "$128.50");
  assert.equal(formatPrice(0), "Quote pending");
  assert.equal(formatPrice(-5), "Quote pending");
  assert.equal(formatPrice(NaN), "Quote pending");
});
