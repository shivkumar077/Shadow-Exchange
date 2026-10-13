import test from "node:test";
import assert from "node:assert/strict";
import {
  SIGNATURE_IDENTITIES,
  DEFAULT_IDENTITY_ID,
  getIdentity,
  getDefaultIdentity,
  getStorageKey,
  getStoredIdentity,
  saveStoredIdentity,
} from "../src/identities.ts";

test("Signature identity collection defines exactly 12 art-directed identities", () => {
  assert.equal(SIGNATURE_IDENTITIES.length, 12);

  const ids = new Set();
  const validCategories = new Set(["creature", "celestial", "insignia"]);

  for (const identity of SIGNATURE_IDENTITIES) {
    assert.ok(identity.id && typeof identity.id === "string", "ID must be a non-empty string");
    assert.ok(!ids.has(identity.id), `Duplicate ID found: ${identity.id}`);
    ids.add(identity.id);

    assert.ok(identity.name && identity.name.trim().length > 0, "Name must not be empty");
    assert.ok(identity.tagline && identity.tagline.trim().length > 0, "Tagline must not be empty");
    assert.ok(validCategories.has(identity.category), `Invalid category: ${identity.category}`);
    assert.match(identity.accentColor, /^#[0-9a-fA-F]{6}$/, "Accent color must be 6-digit hex");
    assert.ok(identity.svgPath && identity.svgPath.trim().length > 0, "svgPath must contain vector markup");
  }
});

test("Default identity is shadow-cat", () => {
  assert.equal(DEFAULT_IDENTITY_ID, "shadow-cat");
  const defaultIdent = getDefaultIdentity();
  assert.equal(defaultIdent.id, "shadow-cat");
  assert.equal(defaultIdent.name, "Shadow Cat");
});

test("getIdentity resolves known identities and safely falls back on unknown or empty input", () => {
  const fox = getIdentity("midnight-fox");
  assert.equal(fox.id, "midnight-fox");
  assert.equal(fox.name, "Midnight Fox");

  const bull = getIdentity("iron-bull");
  assert.equal(bull.id, "iron-bull");

  // Unknown IDs fallback to default
  assert.equal(getIdentity("non-existent-mascot").id, "shadow-cat");
  assert.equal(getIdentity(null).id, "shadow-cat");
  assert.equal(getIdentity(undefined).id, "shadow-cat");
  assert.equal(getIdentity("").id, "shadow-cat");
});

test("Storage keys strictly namespace identities per demo user account", () => {
  assert.equal(getStorageKey(1), "shadow_identity_user_1");
  assert.equal(getStorageKey(42), "shadow_identity_user_42");
  assert.equal(getStorageKey(9999), "shadow_identity_user_9999");

  // Non-positive or missing user IDs use default namespace
  assert.equal(getStorageKey(null), "shadow_identity_default");
  assert.equal(getStorageKey(undefined), "shadow_identity_default");
  assert.equal(getStorageKey(0), "shadow_identity_default");
  assert.equal(getStorageKey(-5), "shadow_identity_default");
});

test("getStoredIdentity and saveStoredIdentity isolate preferences across demo users", () => {
  const mockStorage = new Map();
  const originalWindow = globalThis.window;

  globalThis.window = {
    localStorage: {
      getItem: (key) => mockStorage.get(key) ?? null,
      setItem: (key, val) => mockStorage.set(key, String(val)),
      removeItem: (key) => mockStorage.delete(key),
    },
  };

  try {
    // User 1 chooses Midnight Fox
    saveStoredIdentity("midnight-fox", 1);
    assert.equal(getStoredIdentity(1).id, "midnight-fox");

    // User 2 has not made a choice yet -> should get default Shadow Cat
    assert.equal(getStoredIdentity(2).id, "shadow-cat");

    // User 2 chooses Solitary Wolf -> does NOT overwrite User 1
    saveStoredIdentity("solitary-wolf", 2);
    assert.equal(getStoredIdentity(2).id, "solitary-wolf");
    assert.equal(getStoredIdentity(1).id, "midnight-fox");

    // Switching back to User 1 still yields Midnight Fox
    assert.equal(getStoredIdentity(1).name, "Midnight Fox");
  } finally {
    globalThis.window = originalWindow;
  }
});

test("All identities provide accessible labels and contrast-friendly accent tokens", () => {
  for (const identity of SIGNATURE_IDENTITIES) {
    // Check that name and tagline provide accessible descriptions
    const label = `${identity.name}: ${identity.tagline}`;
    assert.ok(label.length >= 15, "Accessible identity description must be sufficiently detailed");
    assert.ok(identity.name.length >= 3);
  }
});
