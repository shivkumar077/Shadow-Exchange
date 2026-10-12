import test from "node:test";
import assert from "node:assert/strict";
import { resolveWebSocketUrl, validatePublicTrade } from "../src/api.ts";
import { updateRecentTrades } from "../src/useTradeStream.ts";
import { Client } from "@stomp/stompjs";

test("resolveWebSocketUrl prioritizes explicit VITE_WS_URL override", () => {
  const result = resolveWebSocketUrl("http://localhost:8080", "wss://custom.gateway.internal/ws");
  assert.equal(result, "wss://custom.gateway.internal/ws");
});

test("resolveWebSocketUrl maps http localhost to ws localhost:8080/ws", () => {
  const result = resolveWebSocketUrl("http://localhost:8080");
  assert.equal(result, "ws://localhost:8080/ws");
});

test("resolveWebSocketUrl maps https Render backend to wss with /ws endpoint", () => {
  const result = resolveWebSocketUrl("https://shadow-exchange-1.onrender.com");
  assert.equal(result, "wss://shadow-exchange-1.onrender.com/ws");
});

test("resolveWebSocketUrl handles trailing slashes cleanly", () => {
  const result = resolveWebSocketUrl("https://shadow-exchange-1.onrender.com/");
  assert.equal(result, "wss://shadow-exchange-1.onrender.com/ws");
});

test("resolveWebSocketUrl defaults to ws://localhost:8080/ws for empty inputs", () => {
  assert.equal(resolveWebSocketUrl(""), "ws://localhost:8080/ws");
  assert.equal(resolveWebSocketUrl(undefined), "ws://localhost:8080/ws");
  assert.equal(resolveWebSocketUrl("   "), "ws://localhost:8080/ws");
});

test("validatePublicTrade accepts valid 6-field trade payload", () => {
  const valid = {
    tradeId: 101,
    stockId: 1,
    symbol: "NVDA",
    price: 142.87,
    quantity: 15,
    executedAt: "2026-10-13T10:30:00",
  };
  const result = validatePublicTrade(valid);
  assert.ok(result);
  assert.equal(result.tradeId, 101);
  assert.equal(result.stockId, 1);
  assert.equal(result.symbol, "NVDA");
  assert.equal(result.price, 142.87);
  assert.equal(result.quantity, 15);
  assert.equal(result.executedAt, "2026-10-13T10:30:00");
  assert.equal(Object.keys(result).length, 6);
});

test("validatePublicTrade strips out sensitive entities and unexpected keys", () => {
  const payloadWithSensitiveData = {
    tradeId: 102,
    stockId: 2,
    symbol: "AAPL",
    price: 230.50,
    quantity: 10,
    executedAt: "2026-10-13T10:31:00",
    buyer: { id: 99, email: "secret@example.com" },
    seller: { id: 88, balance: 50000 },
    buyOrder: { id: 501 },
  };
  const result = validatePublicTrade(payloadWithSensitiveData);
  assert.ok(result);
  assert.equal(result.tradeId, 102);
  assert.equal("buyer" in result, false);
  assert.equal("seller" in result, false);
  assert.equal("buyOrder" in result, false);
  assert.equal(Object.keys(result).length, 6);
});

test("validatePublicTrade rejects invalid or missing fields", () => {
  assert.equal(validatePublicTrade(null), null);
  assert.equal(validatePublicTrade(undefined), null);
  assert.equal(validatePublicTrade("not an object"), null);
  assert.equal(validatePublicTrade({ tradeId: -1, stockId: 1, symbol: "AAPL", price: 10, quantity: 1, executedAt: "time" }), null);
  assert.equal(validatePublicTrade({ tradeId: 1, stockId: 0, symbol: "AAPL", price: 10, quantity: 1, executedAt: "time" }), null);
  assert.equal(validatePublicTrade({ tradeId: 1, stockId: 1, symbol: "", price: 10, quantity: 1, executedAt: "time" }), null);
  assert.equal(validatePublicTrade({ tradeId: 1, stockId: 1, symbol: "AAPL", price: -5, quantity: 1, executedAt: "time" }), null);
  assert.equal(validatePublicTrade({ tradeId: 1, stockId: 1, symbol: "AAPL", price: 10, quantity: 0, executedAt: "time" }), null);
  assert.equal(validatePublicTrade({ tradeId: 1, stockId: 1, symbol: "AAPL", price: 10, quantity: 1, executedAt: "" }), null);
});

test("updateRecentTrades deduplicates incoming trades by tradeId", () => {
  const trade1 = { tradeId: 1, stockId: 1, symbol: "AAPL", price: 100, quantity: 5, executedAt: "T1" };
  const trade2 = { tradeId: 2, stockId: 1, symbol: "AAPL", price: 101, quantity: 10, executedAt: "T2" };

  let list = updateRecentTrades([], trade1);
  assert.equal(list.length, 1);

  // Duplicate insertion
  list = updateRecentTrades(list, trade1);
  assert.equal(list.length, 1);

  // New distinct trade
  list = updateRecentTrades(list, trade2);
  assert.equal(list.length, 2);
  assert.equal(list[0].tradeId, 2); // newest prepended
  assert.equal(list[1].tradeId, 1);
});

test("updateRecentTrades bounds history to maximum capacity", () => {
  let list = [];
  for (let i = 1; i <= 35; i++) {
    list = updateRecentTrades(list, {
      tradeId: i,
      stockId: 1,
      symbol: "NVDA",
      price: 100 + i,
      quantity: i,
      executedAt: `T${i}`,
    }, 30);
  }

  assert.equal(list.length, 30);
  assert.equal(list[0].tradeId, 35); // newest
  assert.equal(list[29].tradeId, 6); // oldest retained
});

test("STOMP Client initialization and deactivation lifecycle", async () => {
  const client = new Client({
    brokerURL: "ws://localhost:8080/ws",
    reconnectDelay: 0,
  });

  assert.equal(client.active, false);
  client.activate();
  assert.equal(client.active, true);
  await client.deactivate();
  assert.equal(client.active, false);
});
