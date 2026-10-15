import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  VALID_APPLICATION_ROUTES,
  normalizePath,
  isKnownAppPath,
  getRouteInfo,
  isSutoRoute,
} from "../src/router.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, "../src");

test("Route /suto is recognized, normalized, and strictly scoped", () => {
  // Exact lowercase route
  assert.equal(isSutoRoute("/suto"), true);
  assert.equal(isSutoRoute("/suto/"), true);
  assert.equal(isSutoRoute("/SUTO"), true);
  assert.equal(isSutoRoute("suto"), true);

  // Rejects invalid spellings like shooto, SHUTO as separate path
  assert.equal(isSutoRoute("/shooto"), false);
  assert.equal(isSutoRoute("/shooto/"), false);
  assert.equal(isSutoRoute("/sutos"), false);
  assert.equal(isSutoRoute("/suto-page"), false);
  assert.equal(isSutoRoute("/overview"), false);

  // Router route info
  const info = getRouteInfo("/suto");
  assert.equal(info.isNotFound, false);
  assert.equal(info.section, "Suto");

  // Valid application routes map includes /suto
  assert.equal(VALID_APPLICATION_ROUTES["/suto"], "Suto");
});

test("Unauthorized visitor experience contains mischievous cat and exact copy", () => {
  const compPath = path.join(srcDir, "components/SutoExperience.tsx");
  assert.ok(fs.existsSync(compPath), "SutoExperience.tsx component must exist");
  const content = fs.readFileSync(compPath, "utf-8");

  // Exact required mischievous copy
  assert.ok(
    content.includes("“No, no, no. You're not invited here. Shoo, go away!”") ||
    content.includes("No, no, no. You're not invited here. Shoo, go away!"),
    "Must include exact mischievous cat copy: No, no, no. You're not invited here. Shoo, go away!"
  );

  // Mischievous cat illustration with animated shoo paw & swishing tail
  assert.ok(content.includes("suto-cat-paw-shoo"), "Must include animated shoo paw");
  assert.ok(content.includes("suto-cat-tail-swish"), "Must include animated swishing tail");
  assert.ok(content.includes("suto-mischief-cat-svg"), "Must include cat SVG illustration");

  // Return to terminal button
  assert.ok(content.includes("Return to Shadow Exchange Terminal"), "Must provide button to return to terminal");

  // Must NEVER leak the allowlisted emails to visitors
  assert.ok(!content.includes("shivkumar6990655@gmail.com"), "Must not leak user email in frontend component");
  assert.ok(!content.includes("sutanukachakraborty004@gmail.com"), "Must not leak girlfriend email in frontend component");
});

test("Authorized welcome experience contains exact love letter opening", () => {
  const compPath = path.join(srcDir, "components/SutoExperience.tsx");
  const content = fs.readFileSync(compPath, "utf-8");

  // Exact welcome opening statement is handled
  assert.ok(content.includes("welcomeMessage"), "Must render backend welcomeMessage dynamically");
  assert.ok(content.includes("letterSections"), "Must render letter sections");

  // Check backend service defaults match exact required quote
  const sutoServicePath = path.resolve(__dirname, "../../src/main/java/com/shadowexchange/service/SutoService.java");
  assert.ok(fs.existsSync(sutoServicePath), "SutoService.java must exist");
  const backendServiceContent = fs.readFileSync(sutoServicePath, "utf-8");
  assert.ok(
    backendServiceContent.includes("Hey, baby. Welcome to the little world I made for you, where I poured my heart out for you."),
    "Backend must deliver exact welcome message"
  );

  // Extensible keepsakes structure for future letters, photos, voice notes
  assert.ok(content.includes("Future Keepsakes"), "Must include extensible future keepsakes container");
  assert.ok(content.includes("Personal Letters"), "Must have letter slot");
  assert.ok(content.includes("Photographs"), "Must have photo slot");
  assert.ok(content.includes("Voice Notes"), "Must have voice notes slot");
});

test("Custom lily cursor and responsive aesthetics in suto.css", () => {
  const cssPath = path.join(srcDir, "suto.css");
  assert.ok(fs.existsSync(cssPath), "suto.css must exist");
  const css = fs.readFileSync(cssPath, "utf-8");

  // Custom lily cursor SVG
  assert.ok(css.includes("cursor: url(\"data:image/svg+xml"), "Must define custom SVG lily cursor");
  assert.ok(css.includes(".suto-experience"), "Must scope cursor to .suto-experience");

  // Touch and coarse pointer fallback
  assert.ok(css.includes("@media (hover: none) or (pointer: coarse)"), "Must handle touch devices fallback");
  assert.ok(css.includes("cursor: auto !important"), "Must fallback to auto cursor on touch devices");

  // Reduced motion support
  assert.ok(css.includes("@media (prefers-reduced-motion: reduce)"), "Must respect prefers-reduced-motion");

  // Storybook garden color palette tokens
  assert.ok(css.includes("--suto-blush"), "Must include blush pink palette token");
  assert.ok(css.includes("--suto-cream"), "Must include cream palette token");
  assert.ok(css.includes("--suto-butter"), "Must include butter yellow palette token");
  assert.ok(css.includes("--suto-sage"), "Must include sage green palette token");
  assert.ok(css.includes("--suto-forest"), "Must include rich botanical green token");
});

test("App.tsx integrates /suto route cleanly without regressing trading terminal", () => {
  const appPath = path.join(srcDir, "App.tsx");
  const app = fs.readFileSync(appPath, "utf-8");

  // SutoExperience import and routing
  assert.ok(app.includes("import { SutoExperience }"), "App.tsx must import SutoExperience");
  assert.ok(app.includes("isSutoRoute(currentPath)"), "App.tsx must check isSutoRoute");
  assert.ok(app.includes("<SutoExperience />") || app.includes("<SutoExperience/>"), "App.tsx must render SutoExperience");

  // Trading terminal routes preserved
  assert.ok(app.includes("LoginPage"), "Trading LoginPage must be preserved");
  assert.ok(app.includes("NotFoundPage"), "NotFoundPage must be preserved");
  assert.ok(app.includes("MarketsView"), "MarketsView must be preserved");
});
