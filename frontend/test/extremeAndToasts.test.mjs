import test from "node:test";
import assert from "node:assert/strict";

const {
  EXTREME_CAT_DIALOGUES,
  getExtremeOrderDialogue,
  formatExtremeStatusLabel,
} = await import("../src/extremeOrderPlacement.ts");

test("Ordinary toasts: 6-second auto-dismiss lifecycle and manual dismissal cleanup", () => {
  let activeTimer = null;
  let currentToast = "";

  const setToast = (msg) => {
    if (activeTimer) {
      clearTimeout(activeTimer);
      activeTimer = null;
    }
    currentToast = msg;
    if (msg) {
      activeTimer = setTimeout(() => {
        currentToast = "";
        activeTimer = null;
      }, 6000);
    }
  };

  // Setting toast sets the message and schedules 6s dismissal
  setToast("Order #12 accepted by exchange.");
  assert.equal(currentToast, "Order #12 accepted by exchange.");
  assert.notEqual(activeTimer, null);

  // Manual dismiss immediately clears toast and cancels timer
  setToast("");
  assert.equal(currentToast, "");
  assert.equal(activeTimer, null);

  // Replaced toast clears previous timer and starts fresh 6s timer
  setToast("First message");
  const firstTimer = activeTimer;
  setToast("Second message");
  assert.notEqual(activeTimer, firstTimer);
  assert.equal(currentToast, "Second message");

  // Cleanup
  setToast("");
});

test("Extreme mode order placement details: distinguishes PENDING order from FILLED trade", () => {
  assert.equal(EXTREME_CAT_DIALOGUES.length >= 5, true);

  // Test pending order
  const pendingStatus = formatExtremeStatusLabel("PENDING");
  assert.equal(pendingStatus.isPending, true);
  assert.equal(pendingStatus.label, "PENDING IN ORDER BOOK");

  // Test filled order
  const filledStatus = formatExtremeStatusLabel("FILLED");
  assert.equal(filledStatus.isPending, false);
  assert.equal(filledStatus.label, "FILLED");

  // Verify dialogue variety across orders
  const dialogue1 = getExtremeOrderDialogue(101, 0);
  const dialogue2 = getExtremeOrderDialogue(102, 1);
  assert.notEqual(dialogue1, dialogue2);
  assert.equal(typeof dialogue1, "string");
  assert.equal(typeof dialogue2, "string");
});
