import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("Phase 1: Market Pulse layout structure and dividers", () => {
  const appFile = fs.readFileSync(path.join(__dirname, "../src/App.tsx"), "utf-8");
  const cssFile = fs.readFileSync(path.join(__dirname, "../src/styles.css"), "utf-8");

  // Verify App.tsx uses ribbon-header-cell and ribbon-benchmarks to avoid row spill
  assert.ok(appFile.includes('className="ribbon-header-cell"'), "App.tsx must wrap header and footnote in ribbon-header-cell");
  assert.ok(appFile.includes('className="ribbon-benchmarks"'), "App.tsx must group benchmark cards in ribbon-benchmarks");

  // Verify CSS defines consistent full-height vertical dividers without double-thick borders
  assert.ok(cssFile.includes(".ribbon-header-cell {"), "styles.css must style ribbon-header-cell");
  assert.ok(cssFile.includes(".ribbon-benchmarks {"), "styles.css must style ribbon-benchmarks");
  assert.ok(cssFile.includes(".ribbon-stat:last-child {"), "styles.css must remove border from last ribbon-stat");
  assert.ok(cssFile.includes("border-right: none;"), "Last ribbon-stat must have border-right: none");
});

test("Phase 2: Genuine refresh controls in Markets and Your Market tables", () => {
  const marketsView = fs.readFileSync(path.join(__dirname, "../src/components/MarketsView.tsx"), "utf-8");
  const yourMarketView = fs.readFileSync(path.join(__dirname, "../src/components/YourMarketView.tsx"), "utf-8");
  const cssFile = fs.readFileSync(path.join(__dirname, "../src/styles.css"), "utf-8");

  // RefreshCw icon and accessible aria-label
  assert.ok(marketsView.includes("RefreshCw"), "MarketsView must use RefreshCw icon");
  assert.ok(marketsView.includes('aria-label="Refresh market data"'), "MarketsView must have accessible aria-label");
  assert.ok(yourMarketView.includes("RefreshCw"), "YourMarketView must use RefreshCw icon");
  assert.ok(yourMarketView.includes('aria-label="Refresh market data"'), "YourMarketView must have accessible aria-label");

  // Spin animation class when loading
  assert.ok(cssFile.includes(".animate-spin {"), "styles.css must define .animate-spin");
});

test("Phase 3: Topbar search opens Command Palette with full 28-stock search", () => {
  const appFile = fs.readFileSync(path.join(__dirname, "../src/App.tsx"), "utf-8");
  const paletteFile = fs.readFileSync(path.join(__dirname, "../src/components/CommandPaletteModal.tsx"), "utf-8");

  // Topbar search button opens command palette directly
  assert.ok(appFile.includes("setCommandPaletteOpen(true)"), "Topbar search must open command palette in place");
  assert.ok(!appFile.includes("handleTopbarSearch"), "Old redirecting handleTopbarSearch must not exist");

  // Command palette includes stock searching across supported universe
  assert.ok(paletteFile.includes("command-stock-item"), "CommandPaletteModal must render stock search items");
  assert.ok(paletteFile.includes("watchedSymbols"), "CommandPaletteModal must accept reactive watchlist props");
  assert.ok(paletteFile.includes("onToggleWatchSymbol"), "CommandPaletteModal must allow toggling favorites");
});

test("Phase 4: About Me view replaces Help and Documentation", () => {
  const appFile = fs.readFileSync(path.join(__dirname, "../src/App.tsx"), "utf-8");
  const aboutMeFile = fs.readFileSync(path.join(__dirname, "../src/components/AboutMeView.tsx"), "utf-8");

  // App.tsx contains About Me navigation and component
  assert.ok(appFile.includes("<AboutMeView"), "App.tsx must render AboutMeView");
  assert.ok(appFile.includes('"About Me"'), "App.tsx must include About Me in navigation");
  assert.ok(!appFile.includes("Help and Documentation"), "Help and Documentation must be removed");

  // AboutMeView contains required sections
  assert.ok(aboutMeFile.includes("Creator of Shadow Exchange"), "AboutMeView must include Creator introduction");
  assert.ok(aboutMeFile.includes("MATCHING ENGINE ARCHITECTURE"), "AboutMeView must explain matching engine");
  assert.ok(aboutMeFile.includes("Balance &amp; Share Reservation"), "AboutMeView must explain reservation and settlement");
  assert.ok(aboutMeFile.includes("SIMULATION NOTICE"), "AboutMeView must clearly state it is a simulated exchange");
});
