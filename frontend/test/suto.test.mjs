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
const publicDir = path.resolve(__dirname, "../public");

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

test("Assets exist: 3d-render-lake-landscape-with-retro-effect.jpg and Night Bubble.ttf are in public assets", () => {
  const lakeImg = path.join(publicDir, "assets/suto/3d-render-lake-landscape-with-retro-effect.jpg");
  const sutoFont = path.join(publicDir, "assets/suto/Night Bubble.ttf");

  assert.ok(fs.existsSync(lakeImg), "3d-render-lake-landscape-with-retro-effect.jpg must exist in public assets");
  assert.ok(fs.existsSync(sutoFont), "Night Bubble.ttf must exist in public assets");
});

test("Full-screen background coverage and specimen-matched chunky typography in suto.css", () => {
  const cssPath = path.join(srcDir, "suto.css");
  assert.ok(fs.existsSync(cssPath), "suto.css must exist");
  const css = fs.readFileSync(cssPath, "utf-8");

  // Night Bubble font-face declaration
  assert.ok(css.includes("@font-face"), "Must declare @font-face");
  assert.ok(css.includes("font-family: 'Night Bubble'"), "Must declare font-family Night Bubble");
  assert.ok(css.includes("Night%20Bubble.ttf") || css.includes("Night Bubble.ttf"), "Must reference Night Bubble.ttf");

  // Full-screen background cover with 3D render lake landscape
  assert.ok(css.includes("background-size: cover"), "Must use background-size: cover");
  assert.ok(css.includes("3d-render-lake-landscape-with-retro-effect.jpg"), "Must reference 3d-render-lake-landscape-with-retro-effect.jpg");
  assert.ok(!css.includes("download%20(2).jpg") && !css.includes("download (2).jpg"), "Must not use old background download (2).jpg");
  assert.ok(css.includes("100vh"), "Must cover full viewport height");

  // Chunky bubbly typography styling matching specimen reference
  assert.ok(css.includes("-webkit-text-stroke"), "Must use text-stroke for thick golden outline");
  assert.ok(css.includes("paint-order: stroke fill"), "Must use paint-order to keep lettering chunky");
  assert.ok(css.includes("#F5B81C") || css.includes("var(--suto-gold-outline)"), "Must use golden-yellow outline");
  assert.ok(css.includes("#FFFECB") || css.includes("var(--suto-cream-fill)"), "Must use pale buttery cream fill");
  assert.ok(css.includes("suto-accent-decor"), "Must style tiny heart/sparkle accents");

  // Custom lily cursor SVG
  assert.ok(css.includes("cursor: url(\"data:image/svg+xml"), "Must define custom SVG lily cursor");
  assert.ok(css.includes(".suto-experience"), "Must scope cursor to .suto-experience");

  // Touch and coarse pointer fallback
  assert.ok(css.includes("@media (hover: none) or (pointer: coarse)"), "Must handle touch devices fallback");
  assert.ok(css.includes("cursor: auto !important"), "Must fallback to auto cursor on touch devices");

  // Reduced motion support
  assert.ok(css.includes("@media (prefers-reduced-motion: reduce)"), "Must respect prefers-reduced-motion");
});

test("Authorized view displays exclusively 'Hello Baby' without clutter or decorative cards", () => {
  const compPath = path.join(srcDir, "components/SutoExperience.tsx");
  assert.ok(fs.existsSync(compPath), "SutoExperience.tsx component must exist");
  const content = fs.readFileSync(compPath, "utf-8");

  // Exact required heading
  assert.ok(content.includes("Hello Baby"), "Must contain exact text: Hello Baby");

  // Previous paragraphs, chapter sections, and keepsakes shelf must be removed from authorized view
  assert.ok(!content.includes("suto-letters-grid"), "Chapter letters grid must be removed");
  assert.ok(!content.includes("suto-keepsakes-shelf"), "Keepsakes shelf must be removed");
  assert.ok(!content.includes("suto-topbar"), "Topbar must be removed for clean full-screen look");

  // Falling cherry-blossom animation and custom lily cursor preserved
  assert.ok(content.includes("suto-petals-canvas"), "Must keep falling cherry blossom petals canvas");
  assert.ok(content.includes("canvasRef"), "Must manage canvas animation loop");
});

test("Unauthorized visitor experience preserves mischievous cat and exact copy", () => {
  const compPath = path.join(srcDir, "components/SutoExperience.tsx");
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
