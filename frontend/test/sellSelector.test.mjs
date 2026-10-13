import test from "node:test";
import assert from "node:assert/strict";
import { computeSellableShares, isSellableStock } from "../src/api.ts";

test("computeSellableShares returns 0 for missing, undefined or null holdings", () => {
  assert.equal(computeSellableShares(null), 0);
  assert.equal(computeSellableShares(undefined), 0);
  assert.equal(computeSellableShares({}), 0);
});

test("computeSellableShares computes available shares from quantity and reservedQuantity", () => {
  // Case A: 10 shares owned, 0 reserved -> 10 available
  assert.equal(
    computeSellableShares({ quantity: 10, reservedQuantity: 0 }),
    10
  );

  // Case B: 10 shares owned, 4 reserved -> 6 available
  assert.equal(
    computeSellableShares({ quantity: 10, reservedQuantity: 4 }),
    6
  );

  // Case C: Fully reserved: 10 shares owned, 10 reserved -> 0 available
  assert.equal(
    computeSellableShares({ quantity: 10, reservedQuantity: 10 }),
    0
  );

  // Case D: Edge case: over-reserved clamped to 0
  assert.equal(
    computeSellableShares({ quantity: 5, reservedQuantity: 8 }),
    0
  );
});

test("computeSellableShares prioritizes explicit availableQuantity from backend", () => {
  // Backend provides precomputed availableQuantity = 7
  assert.equal(
    computeSellableShares({
      quantity: 10,
      reservedQuantity: 3,
      availableQuantity: 7,
    }),
    7
  );

  // Backend provides availableQuantity = 0 even if quantity is positive
  assert.equal(
    computeSellableShares({
      quantity: 10,
      reservedQuantity: 0,
      availableQuantity: 0,
    }),
    0
  );
});

test("isSellableStock verifies whether a stock is eligible for Sell order selection", () => {
  const holdings = [
    {
      id: 1,
      stockId: 10,
      symbol: "NVDA",
      quantity: 25,
      reservedQuantity: 5,
      availableQuantity: 20,
    },
    {
      id: 2,
      stockId: 20,
      symbol: "TSLA",
      quantity: 10,
      reservedQuantity: 10,
      availableQuantity: 0, // fully reserved by pending limit orders
    },
    {
      id: 3,
      stockId: 30,
      symbol: "AAPL",
      quantity: 0,
      reservedQuantity: 0,
      availableQuantity: 0, // zero holdings
    },
  ];

  // Stock with positive available quantity is sellable
  assert.equal(isSellableStock({ id: 10, symbol: "NVDA" }, holdings), true);

  // Stock with fully reserved quantity is NOT sellable
  assert.equal(isSellableStock({ id: 20, symbol: "TSLA" }, holdings), false);

  // Stock with 0 quantity is NOT sellable
  assert.equal(isSellableStock({ id: 30, symbol: "AAPL" }, holdings), false);

  // Stock not in holdings at all is NOT sellable
  assert.equal(isSellableStock({ id: 40, symbol: "MSFT" }, holdings), false);
});

test("Sell selector universe count identifies only instruments with positive available shares", () => {
  const stockUniverse = [
    { id: 1, symbol: "NVDA", name: "NVIDIA Corp" },
    { id: 2, symbol: "TSLA", name: "Tesla Inc" },
    { id: 3, symbol: "AAPL", name: "Apple Inc" },
    { id: 4, symbol: "MSFT", name: "Microsoft Corp" },
    { id: 5, symbol: "AMZN", name: "Amazon.com Inc" },
  ];

  const holdings = [
    { id: 101, stockId: 1, symbol: "NVDA", quantity: 15, reservedQuantity: 0 },
    { id: 102, stockId: 2, symbol: "TSLA", quantity: 10, reservedQuantity: 10 }, // locked
    { id: 103, stockId: 5, symbol: "AMZN", quantity: 8, reservedQuantity: 3 }, // 5 available
  ];

  const sellableStocks = stockUniverse.filter((s) => isSellableStock(s, holdings));
  assert.equal(sellableStocks.length, 2);
  assert.deepEqual(
    sellableStocks.map((s) => s.symbol),
    ["NVDA", "AMZN"]
  );

  const lockedStocks = stockUniverse.filter((s) => !isSellableStock(s, holdings));
  assert.equal(lockedStocks.length, 3);
  assert.deepEqual(
    lockedStocks.map((s) => s.symbol),
    ["TSLA", "AAPL", "MSFT"]
  );
});
