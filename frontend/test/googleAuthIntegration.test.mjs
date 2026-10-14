import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getApiBaseUrl,
  getCsrfToken,
  getGoogleLoginUrl,
  resolveWebSocketUrl,
} from "../src/api.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiContent = fs.readFileSync(path.resolve(__dirname, "../src/api.ts"), "utf-8");
const appContent = fs.readFileSync(path.resolve(__dirname, "../src/App.tsx"), "utf-8");
const profileMenuContent = fs.readFileSync(path.resolve(__dirname, "../src/components/ProfileMenu.tsx"), "utf-8");
const vercelContent = fs.readFileSync(path.resolve(__dirname, "../vercel.json"), "utf-8");

test("Google Auth Integration: Vercel rewrites proxy all required backend routes", () => {
  const vercelConfig = JSON.parse(vercelContent);
  const sources = vercelConfig.rewrites.map((r) => r.source);
  const destinations = vercelConfig.rewrites.map((r) => r.destination);

  // Must proxy /api, /orders, /oauth2, /login to Render backend
  assert.ok(sources.includes("/api/(.*)"), "Must rewrite /api/(.*)");
  assert.ok(sources.includes("/orders/(.*)"), "Must rewrite /orders/(.*)");
  assert.ok(sources.includes("/oauth2/(.*)"), "Must rewrite /oauth2/(.*)");
  assert.ok(sources.includes("/login/(.*)"), "Must rewrite /login/(.*)");

  // SPA fallback rule must be at the end
  assert.equal(sources[sources.length - 1], "/((?!assets/).*)");
  assert.equal(destinations[destinations.length - 1], "/index.html");

  // Destination URLs target the Render production backend
  assert.ok(
    destinations.some((d) => d.startsWith("https://shadow-exchange-1.onrender.com/api/")),
    "API destination must point to Render backend"
  );
  assert.ok(
    destinations.some((d) => d.startsWith("https://shadow-exchange-1.onrender.com/login/")),
    "OAuth login destination must point to Render backend"
  );
});

test("Google Auth Integration: CSRF extraction and credential submission", () => {
  // getCsrfToken returns null when no cookie exists
  assert.equal(getCsrfToken(), null);

  // Simulate document.cookie containing XSRF-TOKEN
  globalThis.document = {
    cookie: "foo=bar; XSRF-TOKEN=mock-sec-csrf-token-12345; session=active",
  };
  try {
    assert.equal(getCsrfToken(), "mock-sec-csrf-token-12345");
  } finally {
    delete globalThis.document;
  }

  // Ensure request helper includes credentials: "include" and X-XSRF-TOKEN header
  assert.match(apiContent, /credentials:\s*["']include["']/);
  assert.match(apiContent, /headers\[["']X-XSRF-TOKEN["']\]\s*=\s*csrfToken/);
});

test("Google Auth Integration: OAuth authorization and endpoint URLs", () => {
  const googleLoginUrl = getGoogleLoginUrl();
  assert.ok(googleLoginUrl.endsWith("/oauth2/authorization/google"));

  // Check getAuthStatus endpoint
  assert.match(apiContent, /getAuthStatus\(\)[\s\S]*?\/api\/auth\/me/);

  // Check logout endpoint
  assert.match(apiContent, /logout\(\)[\s\S]*?\/api\/auth\/logout/);
});

test("Google Auth Integration: App startup checks session and handles OAuth redirect params", () => {
  // Checks URL query parameters for auth redirect
  assert.match(appContent, /params\.get\(["']auth["']\)/);
  assert.match(appContent, /window\.history\.replaceState/);

  // Probes /api/auth/me on startup before falling back to demo
  assert.match(appContent, /getAuthStatus\(\)/);

  // Handles Google user session loading without relying solely on localStorage
  assert.match(appContent, /authRedirectSuccess \|\| currentAuth\.authProvider === ["']GOOGLE["']/);

  // Handles Google login trigger
  assert.match(appContent, /window\.location\.href\s*=\s*getGoogleLoginUrl\(\)/);

  // Handles logout
  assert.match(appContent, /await logout\(\)/);
});

test("Google Auth Integration: ProfileMenu displays Google user and Sign Out action", () => {
  // Google sign in action for unauthenticated/demo users
  assert.match(profileMenuContent, /Continue with Google/);
  assert.match(profileMenuContent, /google-signin-btn/);

  // Google G logo vector
  assert.match(profileMenuContent, /GoogleGLogo/);

  // Authenticated state: shows Google Operator tag and Sign Out button
  assert.match(profileMenuContent, /GOOGLE OPERATOR/);
  assert.match(profileMenuContent, /logout-action-btn/);
  assert.match(profileMenuContent, /Sign Out/);
  assert.match(profileMenuContent, /GOOGLE OIDC VERIFIED SESSION/);

  // Anonymous demo mode remains available
  assert.match(profileMenuContent, /SIMULATED OPERATOR SESSION/);
  assert.match(profileMenuContent, /Create New Demo Account/);
});

test("Google Auth Integration: Production WebSocket URL on Vercel origin", () => {
  // Emulate Vercel environment
  globalThis.window = {
    location: {
      hostname: "shadow-exchange-live.vercel.app",
    },
  };
  try {
    const wsUrl = resolveWebSocketUrl();
    assert.equal(wsUrl, "wss://shadow-exchange-1.onrender.com/ws");
  } finally {
    delete globalThis.window;
  }
});
