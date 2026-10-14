import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("Task 1: Market Pulse layout structure, non-overlapping stat cards, and responsive rules", () => {
  const appFile = fs.readFileSync(path.join(__dirname, "../src/App.tsx"), "utf-8");
  const cssFile = fs.readFileSync(path.join(__dirname, "../src/styles.css"), "utf-8");

  // Verify App.tsx uses ribbon-header-cell and ribbon-benchmarks to avoid row spill
  assert.ok(appFile.includes('className="ribbon-header-cell"'), "App.tsx must wrap header and footnote in ribbon-header-cell");
  assert.ok(appFile.includes('className="ribbon-benchmarks"'), "App.tsx must group benchmark cards in ribbon-benchmarks");

  // Verify stat card separates data info from chart to eliminate text-sparkline collisions
  assert.ok(appFile.includes('className="ribbon-stat-info"'), "App.tsx must use ribbon-stat-info for benchmark numbers");
  assert.ok(appFile.includes('className="ribbon-stat-chart"'), "App.tsx must use ribbon-stat-chart for sparkline container");

  // Verify footnote does NOT use brittle white-space: nowrap which causes overflow across cells
  assert.ok(cssFile.includes("white-space: normal;"), "ribbon-footnote must use white-space: normal to prevent cell overflow");
  assert.ok(cssFile.includes("flex-wrap: wrap;"), "ribbon-footnote must wrap cleanly");

  // Verify sparkline is static within its chart cell rather than absolute over text
  assert.ok(cssFile.includes(".ribbon-stat-chart .sparkline { position: static;"), "Sparkline must be statically placed in chart container");

  // Verify CSS defines consistent full-height vertical dividers without double-thick borders
  assert.ok(cssFile.includes(".ribbon-header-cell {"), "styles.css must style ribbon-header-cell");
  assert.ok(cssFile.includes(".ribbon-benchmarks {"), "styles.css must style ribbon-benchmarks");
  assert.ok(cssFile.includes(".ribbon-stat:last-child {"), "styles.css must remove border from last ribbon-stat");
  assert.ok(cssFile.includes("border-right: none;"), "Last ribbon-stat must have border-right: none");

  // Verify responsive reflow rules exist for tablet and mobile
  assert.ok(cssFile.includes("grid-template-columns: repeat(2, minmax(0, 1fr));"), "Tablet media query must reflow cards to 2x2 grid");
  assert.ok(cssFile.includes("grid-template-columns: 1fr;"), "Mobile media query must reflow cards to stacked single column");
});

test("Task 2: Overview 'All markets' arrow replaced by genuine refresh control", () => {
  const appFile = fs.readFileSync(path.join(__dirname, "../src/App.tsx"), "utf-8");

  // Old redirecting arrow button must be completely absent from Overview
  assert.ok(!appFile.includes('navigateToSection("Markets")}>All markets'), "Old 'All markets' redirect button must be removed from Overview");
  assert.ok(!appFile.includes('All markets <ArrowUpRight'), "Old redirect arrow must not exist in Overview");

  // Genuine refresh button is wired to handleRefreshFeaturedMarket
  assert.ok(appFile.includes('onClick={handleRefreshFeaturedMarket}'), "Overview must wire refresh button to handleRefreshFeaturedMarket");
  assert.ok(appFile.includes('aria-label="Refresh featured market data"'), "Overview refresh button must have accessible aria-label");
  assert.ok(appFile.includes('refreshingFeatured'), "Overview must have refreshing state to prevent duplicate clicks");
  assert.ok(appFile.includes('disabled={refreshingFeatured || stocksLoading}'), "Overview refresh button must be disabled while in flight");

  // Uses RefreshCw icon with spin animation
  assert.ok(appFile.includes('<RefreshCw size={12} className={refreshingFeatured || stocksLoading ? "animate-spin" : ""} />'), "Must render rotating RefreshCw icon");
});

test("Task 3: About Me page does not render Market Pulse, clocks, or timing widgets", () => {
  const appFile = fs.readFileSync(path.join(__dirname, "../src/App.tsx"), "utf-8");

  // App.tsx conditionally suppresses Market Pulse and WorldClocks when activeSection is 'About Me'
  assert.ok(appFile.includes('{activeSection !== "About Me" && ('), "App.tsx must exclude page-heading, WorldClocks, and market-ribbon when on About Me");
});

test("Task 3: About Me personal links, preserved sections, and clickable GitHub source references", () => {
  const aboutMeFile = fs.readFileSync(path.join(__dirname, "../src/components/AboutMeView.tsx"), "utf-8");

  // Creator name
  assert.ok(aboutMeFile.includes("Shivkumar"), "AboutMeView must display creator name Shivkumar");

  // Social & project links are clickable <a> tags
  const expectedLinks = [
    "https://github.com/shivkumar077/Shadow-Exchange",
    "https://github.com/shivkumar077",
    "https://linkedin.com/in/shivkumar077",
    "https://x.com/shivkumar077",
    "https://instagram.com/shivkumar077",
  ];
  for (const url of expectedLinks) {
    assert.ok(aboutMeFile.includes(url), `AboutMeView must contain link to ${url}`);
  }
  assert.ok(aboutMeFile.includes('target="_blank"'), "External links must open in new tab");
  assert.ok(aboutMeFile.includes('rel="noopener noreferrer"'), "External links must specify rel='noopener noreferrer'");

  // Preserved content sections
  assert.ok(aboutMeFile.includes("PURPOSE AND SCOPE"), "AboutMeView must preserve Purpose and Scope section");
  assert.ok(aboutMeFile.includes("ARCHITECTURE"), "AboutMeView must preserve Architecture section");
  assert.ok(aboutMeFile.includes("STACK"), "AboutMeView must preserve Stack section");
  assert.ok(aboutMeFile.includes("ORDER LIFECYCLE &amp; MATCHING ENGINE"), "AboutMeView must preserve Order Lifecycle & Matching Engine section");
  assert.ok(aboutMeFile.includes("KEY RESOURCES, IMPLEMENTATION, AND REPOSITORY"), "AboutMeView must preserve Key Resources section");

  // Verified GitHub source code references are clickable
  const expectedSourcePaths = [
    "src/main/java/com/shadowexchange/matching/MatchingEngine.java",
    "src/main/java/com/shadowexchange/service/OrderService.java",
    "src/main/java/com/shadowexchange/service/SettlementService.java",
    "src/main/java/com/shadowexchange/websocket/TradeWebSocketPublisher.java",
    "frontend/src/useTradeStream.ts",
    "frontend/src/marketPulse.ts",
  ];
  for (const srcPath of expectedSourcePaths) {
    const fullGitHubUrl = `https://github.com/shivkumar077/Shadow-Exchange/blob/main/${srcPath}`;
    assert.ok(aboutMeFile.includes(`href="${fullGitHubUrl}"`), `Must contain clickable link to ${fullGitHubUrl}`);
  }

  // No file:///C:/ local paths
  assert.ok(!aboutMeFile.includes("file:///"), "Must NOT contain any file:/// local filesystem links");
});
