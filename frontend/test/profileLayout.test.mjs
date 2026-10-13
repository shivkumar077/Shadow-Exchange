import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cssContent = fs.readFileSync(path.resolve(__dirname, "../src/styles.css"), "utf-8");
const profileMenuContent = fs.readFileSync(path.resolve(__dirname, "../src/components/ProfileMenu.tsx"), "utf-8");
const appContent = fs.readFileSync(path.resolve(__dirname, "../src/App.tsx"), "utf-8");

test("Profile layout: styles.css eliminates horizontal overflow at source", () => {
  // Sidebar must have overflow-x: hidden and box-sizing: border-box
  assert.match(cssContent, /\.sidebar\s*\{[^}]*overflow-x:\s*hidden/);
  assert.match(cssContent, /\.sidebar\s*\{[^}]*box-sizing:\s*border-box/);

  // Profile popover must NOT have a hardcoded 275px width that overflows the sidebar
  assert.doesNotMatch(cssContent, /\.profile-menu-popover\s*\{[^}]*min-width:\s*275px/);
  assert.match(cssContent, /\.profile-menu-popover\s*\{[^}]*width:\s*100%/);
  assert.match(cssContent, /\.profile-menu-popover\s*\{[^}]*max-width:\s*100%/);
  assert.match(cssContent, /\.profile-menu-popover\s*\{[^}]*box-sizing:\s*border-box/);

  // Collapsed sidebar responsive breakpoint (tablet 721px - 1080px)
  assert.match(cssContent, /@media\s*\(max-width:\s*1080px\)\s*and\s*\(min-width:\s*721px\)[\s\S]*?\.profile-menu-popover\s*\{[\s\S]*?position:\s*fixed/);
});

test("Profile layout: operator information rows align cleanly and support responsive wrapping", () => {
  // Check stat row layout
  assert.match(cssContent, /\.profile-stat-row\s*\{[^}]*display:\s*flex/);
  assert.match(cssContent, /\.profile-stat-row\s*\{[^}]*justify-content:\s*space-between/);
  assert.match(cssContent, /\.profile-stat-row\s*\{[^}]*flex-wrap:\s*wrap/);
  assert.match(cssContent, /\.profile-stat-val\s*\{[^}]*font-variant-numeric:\s*tabular-nums/);

  // Check that all 4 required financial rows exist in ProfileMenu.tsx
  assert.match(profileMenuContent, /OPERATOR ID/);
  assert.match(profileMenuContent, /NET EQUITY/);
  assert.match(profileMenuContent, /AVAILABLE CASH/);
  assert.match(profileMenuContent, /RESERVED IN ORDERS/);

  // Check truncation and title tooltips for Operator ID and values
  assert.match(profileMenuContent, /operator-id-val/);
  assert.match(profileMenuContent, /title=\{demoUserId \? `Operator ID #\$\{demoUserId\}` : "No operator ID"\}/);
});

test("Bottom account selector: stays contained within sidebar with graceful truncation", () => {
  // interactive-profile-row must have box-sizing and min-width: 0
  assert.match(cssContent, /\.interactive-profile-row\s*\{[^}]*box-sizing:\s*border-box/);
  assert.match(cssContent, /\.interactive-profile-row\s*\{[^}]*min-width:\s*0/);

  // profile-copy strong and small must have text-overflow: ellipsis and overflow: hidden
  assert.match(cssContent, /\.profile-copy strong\s*\{[^}]*text-overflow:\s*ellipsis/);
  assert.match(cssContent, /\.profile-copy small\s*\{[^}]*text-overflow:\s*ellipsis/);

  // App.tsx must provide hover title tooltips on the identity name and cash
  assert.match(appContent, /<strong title=\{identity\.name\}>\{identity\.name\}<\/strong>/);
  assert.match(appContent, /<small title=\{accountLoading \? "Connecting…" : `\$\{money\(availableCash\)\} cash`\}>/);
});

test("Profile menu: preserves all actions, emblem picker, copy ID, and session indicators", () => {
  assert.match(profileMenuContent, /Change Identity Emblem/);
  assert.match(profileMenuContent, /Copy Operator ID/);
  assert.match(profileMenuContent, /Create New Demo Account/);
  assert.match(profileMenuContent, /SIMULATED OPERATOR SESSION/);
  assert.match(profileMenuContent, /PERSONA/);

  // Outside click handler must ignore clicks on .interactive-profile-row to prevent toggle conflicts
  assert.match(profileMenuContent, /target\?\.closest\?\.\(["']\.interactive-profile-row["']\)/);
});
