import test from "node:test";
import assert from "node:assert/strict";
import { mapApiOrders } from "../src/api.ts";

test("mapApiOrders symbol resolution race condition: orders load before stocks", () => {
  const apiOrders = [
    {
      id: 101,
      userId: 1,
      stockId: 1,
      type: "BUY",
      price: 142.87,
      quantity: 10,
      status: "PENDING",
      createdAt: "2026-10-13T09:30:00",
    },
    {
      id: 102,
      userId: 1,
      stockId: 2,
      type: "SELL",
      price: 231.42,
      quantity: 5,
      status: "FILLED",
      createdAt: "2026-10-13T09:35:00",
    },
  ];

  // Phase 1: Startup race condition — demo account orders arrive while stocks is still empty []
  const initialLocalOrders = mapApiOrders(apiOrders, []);
  assert.equal(initialLocalOrders.length, 2);
  assert.equal(initialLocalOrders[0].symbol, "#1");
  assert.equal(initialLocalOrders[1].symbol, "#2");
  assert.equal(initialLocalOrders[0].stockId, 1);
  assert.equal(initialLocalOrders[1].stockId, 2);

  // Phase 2: Stocks API resolves asynchronously
  const resolvedStocks = [
    { id: 1, symbol: "NVDA" },
    { id: 2, symbol: "AAPL" },
  ];

  // Re-mapping (as reactive useMemo does in App.tsx) resolves tickers cleanly
  const resolvedLocalOrders = mapApiOrders(apiOrders, resolvedStocks);
  assert.equal(resolvedLocalOrders.length, 2);
  assert.equal(resolvedLocalOrders[0].symbol, "NVDA");
  assert.equal(resolvedLocalOrders[1].symbol, "AAPL");

  // Invariant preservation
  assert.equal(resolvedLocalOrders[0].id, 101);
  assert.equal(resolvedLocalOrders[0].side, "BUY");
  assert.equal(resolvedLocalOrders[0].price, 142.87);
  assert.equal(resolvedLocalOrders[0].quantity, 10);
  assert.equal(resolvedLocalOrders[0].status, "PENDING");
  assert.ok(resolvedLocalOrders[0].time.length > 0);

  assert.equal(resolvedLocalOrders[1].id, 102);
  assert.equal(resolvedLocalOrders[1].side, "SELL");
  assert.equal(resolvedLocalOrders[1].price, 231.42);
  assert.equal(resolvedLocalOrders[1].quantity, 5);
  assert.equal(resolvedLocalOrders[1].status, "FILLED");
});

test("mapApiOrders falls back cleanly to #<stockId> for unknown or deleted stock IDs", () => {
  const apiOrders = [
    {
      id: 201,
      userId: 1,
      stockId: 999, // not in stock universe
      type: "BUY",
      price: 50.00,
      quantity: 1,
      status: "PENDING",
    },
  ];

  const stocks = [{ id: 1, symbol: "NVDA" }];
  const localOrders = mapApiOrders(apiOrders, stocks);
  assert.equal(localOrders[0].symbol, "#999");
  assert.equal(localOrders[0].stockId, 999);
});
