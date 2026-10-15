import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SIGNATURE_IDENTITIES,
  GOOGLE_AVATAR_ID,
  createGoogleIdentity,
  getStoredIdentity,
  saveStoredIdentity,
  getIdentity,
  getDefaultIdentity,
} from "../src/identities.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const loginPageContent = fs.readFileSync(path.resolve(__dirname, "../src/components/LoginPage.tsx"), "utf-8");
const appContent = fs.readFileSync(path.resolve(__dirname, "../src/App.tsx"), "utf-8");
const profileMenuContent = fs.readFileSync(path.resolve(__dirname, "../src/components/ProfileMenu.tsx"), "utf-8");
const identityModalContent = fs.readFileSync(path.resolve(__dirname, "../src/components/IdentityPickerModal.tsx"), "utf-8");
const cssContent = fs.readFileSync(path.resolve(__dirname, "../src/styles.css"), "utf-8");

test("Requirement 1 & 2: Login-first experience & session loading", () => {
  // LoginPage renders terminal branding, subtitle, telemetry, and Continue with Google
  assert.match(loginPageContent, /SHADOW EXCHANGE/);
  assert.match(loginPageContent, /Institutional Execution Terminal/);
  assert.match(loginPageContent, /Continue with Google/);
  assert.match(loginPageContent, /continue-with-google-btn/);
  assert.match(loginPageContent, /GoogleGLogo/);
  assert.match(loginPageContent, /OIDC 2\.0 · TLS 1\.3 SECURE/);
  assert.match(loginPageContent, /Launch Simulated Sandbox/);

  // App.tsx verifies /api/auth/me before deciding whether to show login or terminal
  assert.match(appContent, /const \[authLoading, setAuthLoading\] = useState\(true\)/);
  assert.match(appContent, /terminal-boot-screen/);
  assert.match(appContent, /getAuthStatus\(\)/);
  assert.match(appContent, /<LoginPage/);

  // Authenticated sessions bypass login page and go straight to terminal
  assert.match(appContent, /if \(!authStatus\?\.authenticated\)/);
});

test("Requirement 3: Desktop Google Operator layout eliminates name truncation", () => {
  // .profile-identity-name-row must use column or wrapping layout to avoid S... truncation
  assert.match(cssContent, /\.profile-identity-name-row\s*\{[^}]*flex-direction:\s*column/);
  assert.match(cssContent, /\.profile-identity-name-row strong\s*\{[^}]*width:\s*100%/);

  // Google Operator badge and session verified indicator must be preserved
  assert.match(profileMenuContent, /GOOGLE OPERATOR/);
  assert.match(profileMenuContent, /GOOGLE OIDC VERIFIED SESSION/);

  // Footer must wrap cleanly without truncating verified badge
  assert.match(cssContent, /\.profile-menu-footer\s*\{[^}]*white-space:\s*normal/);
});

test("Requirement 4: Identity emblem selection supports Google photo alongside signature emblems", () => {
  // IdentityPickerModal supports Google photo card when available
  assert.match(identityModalContent, /hasGooglePhoto/);
  assert.match(identityModalContent, /GOOGLE_AVATAR_ID/);
  assert.match(identityModalContent, /Google Photo/);
  assert.match(identityModalContent, /identity-google-picker-img/);

  // Signature identities are fully preserved (all 12 emblems)
  assert.equal(SIGNATURE_IDENTITIES.length, 12);

  // createGoogleIdentity creates a valid Google identity
  const googleIdent = createGoogleIdentity("https://lh3.googleusercontent.com/alice", "Alice");
  assert.equal(googleIdent.id, GOOGLE_AVATAR_ID);
  assert.equal(googleIdent.category, "google");
  assert.equal(googleIdent.imageUrl, "https://lh3.googleusercontent.com/alice");

  // Mock localStorage for persistence test
  const storageMap = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (key) => storageMap.get(key) ?? null,
      setItem: (key, val) => storageMap.set(key, String(val)),
      removeItem: (key) => storageMap.delete(key),
    },
  };

  try {
    const userId = 777;

    // 1. By default, returning Google user with an avatar resolves to Google photo
    const defaultGoogleIdent = getStoredIdentity(userId, "https://lh3.googleusercontent.com/alice", "Alice");
    assert.equal(defaultGoogleIdent.id, GOOGLE_AVATAR_ID);
    assert.equal(defaultGoogleIdent.imageUrl, "https://lh3.googleusercontent.com/alice");

    // 2. User chooses built-in emblem (e.g. midnight-fox)
    saveStoredIdentity("midnight-fox", userId);
    const chosenEmblem = getStoredIdentity(userId, "https://lh3.googleusercontent.com/alice", "Alice");
    assert.equal(chosenEmblem.id, "midnight-fox");
    assert.equal(chosenEmblem.name, "Midnight Fox");

    // 3. User switches back to Google photo
    saveStoredIdentity(GOOGLE_AVATAR_ID, userId);
    const switchedBack = getStoredIdentity(userId, "https://lh3.googleusercontent.com/alice", "Alice");
    assert.equal(switchedBack.id, GOOGLE_AVATAR_ID);
    assert.equal(switchedBack.imageUrl, "https://lh3.googleusercontent.com/alice");

    // 4. Graceful fallback when no Google picture is available
    const fallbackDemo = getStoredIdentity(999, null, null);
    assert.equal(fallbackDemo.id, "shadow-cat");
  } finally {
    delete globalThis.window;
  }
});
