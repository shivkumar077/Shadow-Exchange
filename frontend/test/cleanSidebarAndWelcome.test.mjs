import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appContent = fs.readFileSync(path.resolve(__dirname, "../src/App.tsx"), "utf-8");
const cssContent = fs.readFileSync(path.resolve(__dirname, "../src/styles.css"), "utf-8");
const onboardingContent = fs.readFileSync(path.resolve(__dirname, "../src/components/OnboardingModal.tsx"), "utf-8");

test("Clean sidebar: stock preview list is removed while keeping navigation intact", () => {
  // Sidebar must NOT render mini-watchlist or mini-stock preview buttons
  assert.doesNotMatch(appContent, /className="mini-watchlist"/);
  assert.doesNotMatch(appContent, /className=\{`mini-stock/);

  // Sidebar must NOT have stranded sidebar-rule or duplicate YOUR MARKETS sub-label
  assert.doesNotMatch(appContent, /className="sidebar-rule"/);
  assert.doesNotMatch(appContent, /YOUR MARKETS\s*<button/);

  // Sidebar MUST retain the primary navigation item for "Your Market" with Star icon
  assert.match(appContent, /label:\s*"Your Market",\s*icon:\s*Star/);
  assert.match(appContent, /label === "Your Market" && <span className="nav-count">/);

  // Dead CSS selectors must be removed from styles.css
  assert.doesNotMatch(cssContent, /\.mini-watchlist\s*\{/);
  assert.doesNotMatch(cssContent, /\.mini-stock\s*\{/);
  assert.doesNotMatch(cssContent, /\.mini-stock-copy\s*\{/);
  assert.doesNotMatch(cssContent, /\.mini-change\s*\{/);
});

test("Onboarding welcome modal: typography, hierarchy, and subtitle spacing", () => {
  // Must render main heading "Welcome to Shadow Exchange"
  assert.match(onboardingContent, /<h2 className="onboarding-title"[^>]*>\s*Welcome to Shadow Exchange\s*<\/h2>/);

  // Must render humorous subtitle exactly as written: "You are financially imaginary"
  assert.match(onboardingContent, /<p className="onboarding-subtitle">\s*You are financially imaginary\s*<\/p>/);

  // Subtitle must sit directly beneath the heading in the onboarding-header
  assert.match(onboardingContent, /<div className="onboarding-header">[\s\S]*?<h2 className="onboarding-title"[\s\S]*?<p className="onboarding-subtitle">/);

  // Close button must be present with accessible label
  assert.match(onboardingContent, /className="icon-button modal-close-btn onboarding-close-btn"/);
  assert.match(onboardingContent, /aria-label="Close welcome modal"/);

  // CSS must enforce centered alignment, deliberate title/subtitle typography and responsive spacing
  assert.match(cssContent, /\.onboarding-title\s*\{[^}]*font:\s*700 22px\/1\.25/);
  assert.match(cssContent, /\.onboarding-subtitle\s*\{[^}]*font:\s*italic 500 15px\/1\.4/);
  assert.match(cssContent, /\.onboarding-subtitle\s*\{[^}]*color:\s*var\(--signal\)/);
  assert.match(cssContent, /\.onboarding-card\s*\{[^}]*text-align:\s*center/);
  assert.match(cssContent, /\.onboarding-card\s*\{[^}]*box-sizing:\s*border-box/);
  assert.match(cssContent, /@media\s*\(max-width:\s*480px\)[\s\S]*?\.onboarding-card/);
});
