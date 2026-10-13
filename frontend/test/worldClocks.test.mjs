import test from "node:test";
import assert from "node:assert/strict";
import {
  MARKET_CENTERS,
  getZonedTimeParts,
  getMarketSessionStatus,
} from "../src/worldClocks.ts";

test("WorldClocks market centers configuration defines all 4 required IANA financial zones", () => {
  assert.equal(MARKET_CENTERS.length, 4);
  const zones = MARKET_CENTERS.map((c) => c.timeZone);
  assert.ok(zones.includes("Asia/Kolkata"));
  assert.ok(zones.includes("America/New_York"));
  assert.ok(zones.includes("Europe/London"));
  assert.ok(zones.includes("Asia/Tokyo"));
});

test("getZonedTimeParts formats 24h digital time with IANA timezone name", () => {
  // 2026-10-13 14:30:45 UTC
  const fixedUtc = new Date(Date.UTC(2026, 9, 13, 14, 30, 45));

  const kolkata = getZonedTimeParts(fixedUtc, "Asia/Kolkata");
  assert.equal(kolkata.timeString, "20:00:45"); // UTC+5:30
  assert.equal(kolkata.tzName, "IST");

  const ny = getZonedTimeParts(fixedUtc, "America/New_York");
  assert.equal(ny.timeString, "10:30:45"); // EDT in October (UTC-4)
  assert.equal(ny.tzName, "EDT");

  const london = getZonedTimeParts(fixedUtc, "Europe/London");
  assert.equal(london.timeString, "15:30:45"); // BST in October (UTC+1)
  assert.equal(london.tzName, "BST");

  const tokyo = getZonedTimeParts(fixedUtc, "Asia/Tokyo");
  assert.equal(tokyo.timeString, "23:30:45"); // JST (UTC+9)
  assert.equal(tokyo.tzName, "JST");
});

test("getMarketSessionStatus handles weekend closures across all centers", () => {
  // Sunday 2026-10-18 14:00:00 UTC
  const sundayUtc = new Date(Date.UTC(2026, 9, 18, 14, 0, 0));
  assert.equal(getMarketSessionStatus(sundayUtc, "America/New_York"), "CLOSED");
  assert.equal(getMarketSessionStatus(sundayUtc, "Europe/London"), "CLOSED");
  assert.equal(getMarketSessionStatus(sundayUtc, "Asia/Kolkata"), "CLOSED");
  assert.equal(getMarketSessionStatus(sundayUtc, "Asia/Tokyo"), "CLOSED");
});

test("getMarketSessionStatus calculates regular-session hours for New York (NYSE / NASDAQ 09:30–16:00 ET)", () => {
  // Tuesday 2026-10-13 13:00 UTC = 09:00 EDT (Pre-market / closed)
  const preMarket = new Date(Date.UTC(2026, 9, 13, 13, 0, 0));
  assert.equal(getMarketSessionStatus(preMarket, "America/New_York"), "CLOSED");

  // Tuesday 2026-10-13 14:00 UTC = 10:00 EDT (Regular open)
  const openTime = new Date(Date.UTC(2026, 9, 13, 14, 0, 0));
  assert.equal(getMarketSessionStatus(openTime, "America/New_York"), "OPEN");

  // Tuesday 2026-10-13 20:30 UTC = 16:30 EDT (Post-market / closed)
  const closedTime = new Date(Date.UTC(2026, 9, 13, 20, 30, 0));
  assert.equal(getMarketSessionStatus(closedTime, "America/New_York"), "CLOSED");
});

test("getMarketSessionStatus calculates regular-session hours for London (LSE 08:00–16:30 local)", () => {
  // Tuesday 2026-10-13 06:30 UTC = 07:30 BST (closed)
  const earlyLondon = new Date(Date.UTC(2026, 9, 13, 6, 30, 0));
  assert.equal(getMarketSessionStatus(earlyLondon, "Europe/London"), "CLOSED");

  // Tuesday 2026-10-13 09:00 UTC = 10:00 BST (open)
  const openLondon = new Date(Date.UTC(2026, 9, 13, 9, 0, 0));
  assert.equal(getMarketSessionStatus(openLondon, "Europe/London"), "OPEN");

  // Tuesday 2026-10-13 16:00 UTC = 17:00 BST (closed)
  const closedLondon = new Date(Date.UTC(2026, 9, 13, 16, 0, 0));
  assert.equal(getMarketSessionStatus(closedLondon, "Europe/London"), "CLOSED");
});

test("getMarketSessionStatus calculates regular-session hours for Kolkata (NSE / BSE 09:15–15:30 IST)", () => {
  // Tuesday 2026-10-13 03:00 UTC = 08:30 IST (closed)
  const earlyKolkata = new Date(Date.UTC(2026, 9, 13, 3, 0, 0));
  assert.equal(getMarketSessionStatus(earlyKolkata, "Asia/Kolkata"), "CLOSED");

  // Tuesday 2026-10-13 04:30 UTC = 10:00 IST (open)
  const openKolkata = new Date(Date.UTC(2026, 9, 13, 4, 30, 0));
  assert.equal(getMarketSessionStatus(openKolkata, "Asia/Kolkata"), "OPEN");

  // Tuesday 2026-10-13 11:00 UTC = 16:30 IST (closed)
  const closedKolkata = new Date(Date.UTC(2026, 9, 13, 11, 0, 0));
  assert.equal(getMarketSessionStatus(closedKolkata, "Asia/Kolkata"), "CLOSED");
});

test("getMarketSessionStatus calculates Tokyo session including 11:30–12:30 JST lunch break", () => {
  // Tuesday 2026-10-13 01:00 UTC = 10:00 JST (Morning session open)
  const morningTyo = new Date(Date.UTC(2026, 9, 13, 1, 0, 0));
  assert.equal(getMarketSessionStatus(morningTyo, "Asia/Tokyo"), "OPEN");

  // Tuesday 2026-10-13 03:00 UTC = 12:00 JST (Lunch break)
  const lunchTyo = new Date(Date.UTC(2026, 9, 13, 3, 0, 0));
  assert.equal(getMarketSessionStatus(lunchTyo, "Asia/Tokyo"), "LUNCH");

  // Tuesday 2026-10-13 04:30 UTC = 13:30 JST (Afternoon session open)
  const afternoonTyo = new Date(Date.UTC(2026, 9, 13, 4, 30, 0));
  assert.equal(getMarketSessionStatus(afternoonTyo, "Asia/Tokyo"), "OPEN");

  // Tuesday 2026-10-13 07:00 UTC = 16:00 JST (Session closed)
  const closedTyo = new Date(Date.UTC(2026, 9, 13, 7, 0, 0));
  assert.equal(getMarketSessionStatus(closedTyo, "Asia/Tokyo"), "CLOSED");
});
