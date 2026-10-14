import test from "node:test";
import assert from "node:assert/strict";
import {
  VALID_APPLICATION_ROUTES,
  normalizePath,
  isKnownAppPath,
  getRouteInfo,
} from "../src/router.ts";

test("normalizePath handles edge cases, slashes, and case-insensitivity", () => {
  assert.equal(normalizePath("/"), "/");
  assert.equal(normalizePath(""), "/");
  assert.equal(normalizePath("   "), "/");
  assert.equal(normalizePath("/overview/"), "/overview");
  assert.equal(normalizePath("markets"), "/markets");
  assert.equal(normalizePath("/MARKETS"), "/markets");
  assert.equal(normalizePath("/PORTFOLIO/"), "/portfolio");
});

test("isKnownAppPath identifies all valid application routes and rejects unknown routes", () => {
  // Valid routes
  assert.equal(isKnownAppPath("/"), true);
  assert.equal(isKnownAppPath("/index.html"), true);
  assert.equal(isKnownAppPath("/overview"), true);
  assert.equal(isKnownAppPath("/markets"), true);
  assert.equal(isKnownAppPath("/portfolio"), true);
  assert.equal(isKnownAppPath("/activity"), true);

  // Normalization allows trailing slashes and case variations
  assert.equal(isKnownAppPath("/markets/"), true);
  assert.equal(isKnownAppPath("/ACTIVITY"), true);

  // Unknown paths must return false
  assert.equal(isKnownAppPath("/lost-cat"), false);
  assert.equal(isKnownAppPath("/404"), false);
  assert.equal(isKnownAppPath("/random-page"), false);
  assert.equal(isKnownAppPath("/admin"), false);
  assert.equal(isKnownAppPath("/api/orders"), false);
  assert.equal(isKnownAppPath("/trade/BTC"), false);
});

test("getRouteInfo returns correct section for valid routes and flags not-found for unknown paths", () => {
  const root = getRouteInfo("/");
  assert.equal(root.isNotFound, false);
  assert.equal(root.section, "Overview");

  const markets = getRouteInfo("/markets");
  assert.equal(markets.isNotFound, false);
  assert.equal(markets.section, "Markets");

  const portfolio = getRouteInfo("/portfolio");
  assert.equal(portfolio.isNotFound, false);
  assert.equal(portfolio.section, "Portfolio");

  const activity = getRouteInfo("/activity");
  assert.equal(activity.isNotFound, false);
  assert.equal(activity.section, "Activity");

  // Unknown route
  const lostCat = getRouteInfo("/lost-cat");
  assert.equal(lostCat.isNotFound, true);

  const nestedUnknown = getRouteInfo("/markets/unknown/deep/link");
  assert.equal(nestedUnknown.isNotFound, true);
});

test("VALID_APPLICATION_ROUTES covers all primary terminal workspaces", () => {
  const sections = Object.values(VALID_APPLICATION_ROUTES);
  assert.ok(sections.includes("Overview"));
  assert.ok(sections.includes("Markets"));
  assert.ok(sections.includes("Portfolio"));
  assert.ok(sections.includes("Activity"));
  assert.ok(sections.includes("About Me"));
});

test("About Me routes /about and /about-me resolve correctly", () => {
  assert.equal(isKnownAppPath("/about"), true);
  assert.equal(isKnownAppPath("/about-me"), true);
  assert.equal(isKnownAppPath("/ABOUT"), true);

  const aboutRoute = getRouteInfo("/about");
  assert.equal(aboutRoute.isNotFound, false);
  assert.equal(aboutRoute.section, "About Me");

  const aboutMeRoute = getRouteInfo("/about-me");
  assert.equal(aboutMeRoute.isNotFound, false);
  assert.equal(aboutMeRoute.section, "About Me");
});
