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

test("Authorized view displays opening 'Hello Baby' and reversible, scroll-linked butterfly transition", () => {
  const compPath = path.join(srcDir, "components/SutoExperience.tsx");
  const cssPath = path.join(srcDir, "suto.css");
  assert.ok(fs.existsSync(compPath), "SutoExperience.tsx component must exist");
  assert.ok(fs.existsSync(cssPath), "suto.css must exist");
  const content = fs.readFileSync(compPath, "utf-8");
  const css = fs.readFileSync(cssPath, "utf-8");

  // Exact required opening heading
  assert.ok(content.includes("Hello Baby"), "Must contain exact text: Hello Baby");

  // Butterfly SVG & particles
  assert.ok(content.includes("ButterflySvg"), "Must define ButterflySvg component");
  assert.ok(content.includes("suto-butterfly-particle"), "Must render butterfly particles");
  assert.ok(content.includes("suto-butterflies-swarm"), "Must render butterflies swarm container");
  assert.ok(content.includes("BUTTERFLY_PARTICLES"), "Must define varied butterfly particles data");

  // Continuous, reversible scroll progress tracking (follows progress in both directions)
  assert.ok(content.includes("scrollProgress"), "Must track continuous scroll progress");
  assert.ok(content.includes("setScrollProgress"), "Must update scroll progress state");
  assert.ok(content.includes("scrollTrackRef"), "Must reference scroll track element");
  assert.ok(content.includes("computeButterflyStyle"), "Must compute butterfly styles from scroll progress");
  assert.ok(content.includes("computeHeadingStyle"), "Must compute heading styles from scroll progress");
  assert.ok(content.includes("computePartOneStyle") || content.includes("computeBodyStyle"), "Must compute body styles from scroll progress");
  assert.ok(!content.includes("hasTriggeredRef"), "Must NOT lock transition permanently into a one-way completed state");

  // Exact Part One love letter text
  const expectedPartOne =
    "Babu, you know, I would not have been able to do it if it was not for you. I know you don't give yourself the credit that you deserve, I think whatever I am, however I am, is all because of you. Really thankful I got to have you, my Babu.";
  assert.ok(content.includes(expectedPartOne), "Must contain exact Part One love letter text");
  assert.ok(content.includes("suto-part-one-stage") || content.includes("suto-body-stage"), "Must contain Part One stage");
  assert.ok(content.includes("suto-part-one-text") || content.includes("suto-body-text"), "Must contain Part One text element");

  // Part One -> Part Two transition petals swarm and structure
  assert.ok(content.includes("PETAL_TRANSITION_PARTICLES"), "Must define falling cherry-blossom transition petal particles");
  assert.ok(content.includes("SakuraPetalSvg"), "Must define SakuraPetalSvg component");
  assert.ok(content.includes("suto-transition-petal"), "Must render transition petals");
  assert.ok(content.includes("computePetalStyle"), "Must compute transition petal styles from scroll progress");

  // Part Two section structure prepared (without invented text or third section)
  assert.ok(content.includes("suto-part-two-stage"), "Must include continuous Part Two stage structure");
  assert.ok(content.includes("computePartTwoStyle"), "Must compute Part Two style from scroll progress");
  assert.ok(!content.includes("suto-part-three"), "Must not add a third section");

  // CSS rules for reversible scroll track, sticky stage, butterfly particles, transition petals, and peach-cream body text
  assert.ok(css.includes(".suto-scroll-track"), "CSS must style scroll track for stable scroll area");
  assert.ok(css.includes(".suto-sticky-stage"), "CSS must style sticky stage pinned during transition");
  assert.ok(css.includes(".suto-butterfly-particle"), "CSS must style butterfly particle");
  assert.ok(css.includes("sutoButterflyFlutter"), "CSS must define 3D wing flutter keyframes");
  assert.ok(css.includes(".suto-transition-petal"), "CSS must style falling cherry-blossom transition petals");
  assert.ok(css.includes("sutoPetalFlutter"), "CSS must define organic petal flutter keyframes");
  assert.ok(css.includes(".suto-part-two-stage"), "CSS must style Part Two stage");
  assert.ok(css.includes(".suto-body-text"), "CSS must style suto-body-text");
  assert.ok(css.includes("#FFE6D0") || css.includes("FFE6D0"), "CSS must use soft peach-cream / buttery gold color for body text");
  assert.ok(css.includes("overflow-x: hidden"), "CSS must prevent horizontal scroll");

  // Previous paragraphs, chapter sections, and keepsakes shelf must remain removed
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

test("SUTO Part One text is visibly rendered throughout its reading plateau and pinned to viewport", () => {
  const compPath = path.join(srcDir, "components/SutoExperience.tsx");
  const cssPath = path.join(srcDir, "suto.css");
  const content = fs.readFileSync(compPath, "utf-8");
  const css = fs.readFileSync(cssPath, "utf-8");

  // Exact Part One text must be present in JSX
  const expectedPartOne =
    "Babu, you know, I would not have been able to do it if it was not for you. I know you don't give yourself the credit that you deserve, I think whatever I am, however I am, is all because of you. Really thankful I got to have you, my Babu.";
  assert.ok(content.includes(expectedPartOne), "Part One exact text must be present in SutoExperience component");

  // Stage must remain pinned to viewport without being scrolled off-screen
  assert.ok(
    css.includes("position: fixed") || css.includes("position: sticky"),
    "Stage must have fixed/sticky positioning"
  );
  assert.ok(
    !css.includes("overflow-y: auto"),
    "suto-experience must not have overflow-y: auto that breaks viewport pinning and scrolls the stage off-screen"
  );

  // Robust scroll calculation combining window, documentElement, container, and bounding rect
  assert.ok(content.includes("Math.max("), "handleScroll must take maximum of windowScroll, containerScroll, and rect.top");
  assert.ok(content.includes("window.scrollY"), "handleScroll must inspect window.scrollY");

  // Reading plateau for Part One on expanded track
  assert.ok(content.includes("0.42"), "Part One reading plateau must extend through p = 0.42");
});

test("SUTO Part Two love letter (Miss Sunshine) and transitions are implemented with exact wording", () => {
  const compPath = path.join(srcDir, "components/SutoExperience.tsx");
  const cssPath = path.join(srcDir, "suto.css");
  const content = fs.readFileSync(compPath, "utf-8");
  const css = fs.readFileSync(cssPath, "utf-8");

  // Exact Part Two love letter text
  const expectedPartTwo =
    "You know, when I call you my Miss Sunshine. That was not like a flirty line. It was kind of a flirty line. I won't say wasn't a flirty line, but, like, it was more of the, like, you brighten up my day, and you brighten up everything. You are my sun. You are my brightest star. I love you. I love you. I love you so much. You are my pyaara bachcha.";
  assert.ok(content.includes(expectedPartTwo), "Part Two exact text must be present in SutoExperience component");

  // Part Two stage and text classes
  assert.ok(content.includes("suto-part-two-stage"), "Component must render suto-part-two-stage");
  assert.ok(content.includes("suto-part-two-text"), "Component must render suto-part-two-text");
  assert.ok(css.includes(".suto-part-two-text"), "CSS must style suto-part-two-text");

  // Transition from Part One to Part Two via falling cherry blossom petals
  assert.ok(content.includes("PETAL_TRANSITION_PARTICLES"), "Must define PETAL_TRANSITION_PARTICLES");
  assert.ok(content.includes("computePetalStyle"), "Must compute transition petal styles");
  assert.ok(content.includes("computePartTwoStyle"), "Must compute Part Two style");
});

test("SUTO Finale Ending Sequence: Upward butterflies + downward petals + final signature", () => {
  const compPath = path.join(srcDir, "components/SutoExperience.tsx");
  const cssPath = path.join(srcDir, "suto.css");
  const content = fs.readFileSync(compPath, "utf-8");
  const css = fs.readFileSync(cssPath, "utf-8");

  // Exact Final Signature text
  const expectedSignature = "With love, by your boyfriend";
  assert.ok(content.includes(expectedSignature), "Must contain exact final signature: With love, by your boyfriend");

  // Finale particles: upward butterflies (dy < 0) and downward petals (dy > 0)
  assert.ok(content.includes("FINALE_BUTTERFLY_PARTICLES"), "Must define FINALE_BUTTERFLY_PARTICLES");
  assert.ok(content.includes("FINALE_PETAL_PARTICLES"), "Must define FINALE_PETAL_PARTICLES");
  assert.ok(content.includes("computeFinaleButterflyStyle"), "Must define computeFinaleButterflyStyle");
  assert.ok(content.includes("computeFinalePetalStyle"), "Must define computeFinalePetalStyle");
  assert.ok(content.includes("computeSignatureStyle"), "Must define computeSignatureStyle");

  // Verify upward flight (negative dy) and downward fall (positive dy) in particle definitions
  assert.ok(content.includes("dy: -680") || content.includes("dy: -820"), "Finale butterflies must have negative dy to fly upward");
  assert.ok(content.includes("dy: 660") || content.includes("dy: 780"), "Finale petals must have positive dy to fall downward");

  // Signature and finale styling in CSS
  assert.ok(css.includes(".suto-signature-stage"), "CSS must style .suto-signature-stage");
  assert.ok(css.includes(".suto-signature-text"), "CSS must style .suto-signature-text");
  assert.ok(css.includes("sutoSignatureFloat"), "CSS must define subtle signature float animation");
  assert.ok(css.includes(".suto-finale-particles-container"), "CSS must style finale particles container");
  assert.ok(css.includes(".suto-finale-butterfly-particle"), "CSS must style finale butterfly particle");
  assert.ok(css.includes(".suto-finale-petal-particle"), "CSS must style finale petal particle");

  // Track height expanded for complete 3-transition sequence
  assert.ok(css.includes("580vh") || css.includes("580dvh"), "CSS must provide generous 580vh track for smooth pacing");

  // No extra text or third section
  assert.ok(!content.includes("suto-part-three"), "Must not add an unwanted third letter section");
});

