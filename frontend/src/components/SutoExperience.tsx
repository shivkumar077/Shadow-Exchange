import { useEffect, useRef, useState, useCallback, type MouseEvent } from "react";
import {
  getSutoContent,
  getSutoStatus,
  initiateSutoGoogleSignIn,
  type SutoContent,
} from "../api";
import { navigateTo } from "../router";
import "../suto.css";

interface Sparkle {
  id: number;
  x: number;
  y: number;
}

export function SutoExperience() {
  const [viewState, setViewState] = useState<"loading" | "unauthenticated" | "unauthorized" | "authorized">("loading");
  const [content, setContent] = useState<SutoContent | null>(null);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Probe server-side authorization on mount
  useEffect(() => {
    let cancelled = false;

    async function checkAuthorization() {
      try {
        const privateContent = await getSutoContent();
        if (!cancelled) {
          setContent(privateContent);
          setViewState("authorized");
        }
      } catch (err: unknown) {
        if (cancelled) return;

        // Check if 401 (unauthenticated) vs 403 (unauthorized) via status probe
        try {
          const status = await getSutoStatus();
          if (!cancelled) {
            if (!status.authenticated) {
              setViewState("unauthenticated");
            } else if (!status.authorized) {
              setViewState("unauthorized");
            } else {
              // Retry fetching content once if status probe reported authorized
              try {
                const retryContent = await getSutoContent();
                if (!cancelled) {
                  setContent(retryContent);
                  setViewState("authorized");
                }
              } catch {
                setViewState("unauthorized");
              }
            }
          }
        } catch {
          if (!cancelled) {
            setViewState("unauthenticated");
          }
        }
      }
    }

    void checkAuthorization();

    return () => {
      cancelled = true;
    };
  }, []);

  // Falling cherry blossom petals animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Respect user's reduced-motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    interface Petal {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      angle: number;
      angularSpeed: number;
      opacity: number;
      petalColor: string;
    }

    const petalColors = [
      "rgba(253, 232, 239, 0.85)", // blush pink
      "rgba(247, 210, 222, 0.75)", // pastel pink
      "rgba(255, 245, 248, 0.9)",  // pale rose cream
      "rgba(240, 225, 245, 0.7)",  // lavender mist
    ];

    const PETAL_COUNT = Math.min(32, Math.floor(window.innerWidth / 40));
    const petals: Petal[] = Array.from({ length: PETAL_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height - height,
      size: 8 + Math.random() * 9,
      speedX: 0.6 + Math.random() * 1.2,
      speedY: 0.8 + Math.random() * 1.4,
      angle: Math.random() * Math.PI * 2,
      angularSpeed: (Math.random() - 0.5) * 0.03,
      opacity: 0.5 + Math.random() * 0.45,
      petalColor: petalColors[Math.floor(Math.random() * petalColors.length)],
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < petals.length; i++) {
        const p = petals[i];
        p.x += Math.sin(p.angle) * 0.8 + p.speedX;
        p.y += p.speedY;
        p.angle += p.angularSpeed;

        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
        }
        if (p.x > width + 20) {
          p.x = -20;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.petalColor;

        // Draw organic sakura petal shape
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-p.size / 2, -p.size / 2, -p.size / 2, -p.size, 0, -p.size * 1.2);
        ctx.bezierCurveTo(p.size / 2, -p.size, p.size / 2, -p.size / 2, 0, 0);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Spawn gentle floral sparkles on interactive garden click
  const handleGardenClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    // Only spawn if clicking on garden background, not on interactive buttons
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a") || target.closest("input")) return;

    const newSparkle: Sparkle = {
      id: Date.now() + Math.random(),
      x: e.clientX,
      y: e.clientY,
    };
    setSparkles((prev) => [...prev.slice(-8), newSparkle]);
    setTimeout(() => {
      setSparkles((prev) => prev.filter((s) => s.id !== newSparkle.id));
    }, 800);
  }, []);

  const handleReturnToTerminal = () => {
    navigateTo("/");
  };

  return (
    <div className="suto-experience" onClick={handleGardenClick} role="main" aria-label="A Private Romantic Garden">
      {/* Falling cherry blossoms canvas */}
      <canvas ref={canvasRef} className="suto-petals-canvas" aria-hidden="true" />

      {/* Layered scenery backdrop */}
      <div className="suto-garden-backdrop" aria-hidden="true">
        <div className="suto-sunlight-beam" />
        <div className="suto-forest-layer-back" />
        <div className="suto-forest-layer-front" />
      </div>

      {/* Top navigation header */}
      <header className="suto-topbar">
        <a
          href="/suto"
          className="suto-brand"
          onClick={(e) => {
            e.preventDefault();
            navigateTo("/suto");
          }}
          aria-label="Suto's Sanctuary"
        >
          <span className="suto-brand-icon" aria-hidden="true">
            {/* Delicate Blossom SVG icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C12 2 15 7 15 11C15 13 14 15 12 16C10 15 9 13 9 11C9 7 12 2 12 2Z"
                fill="currentColor"
              />
              <path
                d="M12 16C12 16 6 12 4 10C2.5 8.5 3 6.5 4.5 6C6.5 5.5 10 11 12 14"
                fill="currentColor"
                opacity="0.75"
              />
              <path
                d="M12 16C12 16 18 12 20 10C21.5 8.5 21 6.5 19.5 6C17.5 5.5 14 11 12 14"
                fill="currentColor"
                opacity="0.75"
              />
              <circle cx="12" cy="13" r="2" fill="#F5D77F" />
            </svg>
          </span>
          <span>Suto's World</span>
        </a>

        <div className="suto-nav-actions">
          <a
            href="/"
            className="suto-terminal-link"
            onClick={(e) => {
              e.preventDefault();
              handleReturnToTerminal();
            }}
          >
            <span>Shadow Exchange Terminal</span>
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </header>

      {/* View State: Loading */}
      {viewState === "loading" && (
        <div className="suto-loading-container" role="status" aria-label="Entering the garden">
          <div className="suto-loading-flower" aria-hidden="true">
            <svg viewBox="0 0 64 64" fill="none" width="64" height="64">
              <circle cx="32" cy="32" r="8" fill="#F5D77F" />
              <path d="M32 10C32 10 38 20 32 26C26 20 32 10 32 10Z" fill="#FDE8EF" stroke="#E594AD" strokeWidth="1.5" />
              <path d="M54 32C54 32 44 38 38 32C44 26 54 32 54 32Z" fill="#FDE8EF" stroke="#E594AD" strokeWidth="1.5" />
              <path d="M32 54C32 54 26 44 32 38C38 44 32 54 32 54Z" fill="#FDE8EF" stroke="#E594AD" strokeWidth="1.5" />
              <path d="M10 32C10 32 20 26 26 32C20 38 10 32 10 32Z" fill="#FDE8EF" stroke="#E594AD" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="suto-loading-text">Opening the garden gates…</div>
        </div>
      )}

      {/* View State: Unauthenticated visitor */}
      {viewState === "unauthenticated" && (
        <div className="suto-auth-container">
          <div className="suto-envelope-card" role="region" aria-label="Sign in to the garden">
            <div className="suto-card-floral-accent" aria-hidden="true">
              <span className="suto-card-floral-line" />
              <span>🌸</span>
              <span className="suto-card-floral-line" />
            </div>

            <h1 className="suto-auth-title">A Secret Garden</h1>
            <p className="suto-auth-subtitle">
              A quiet sanctuary crafted petal by petal. Please sign in with your Google account to step inside.
            </p>

            <button
              type="button"
              className="suto-google-btn"
              onClick={initiateSutoGoogleSignIn}
              id="suto-google-signin-btn"
            >
              <svg className="suto-google-g-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="suto-auth-footer-note">
              Private romantic experience • Access restricted to authorized accounts
            </div>
          </div>
        </div>
      )}

      {/* View State: Unauthorized Visitor (Mischievous Cat) */}
      {viewState === "unauthorized" && (
        <div className="suto-unauthorized-container">
          <div className="suto-cat-card" role="alert" aria-label="Access denied">
            <div className="suto-mischief-cat-stage" aria-hidden="true">
              {/* Mischievous Cat Vector Artwork with Animated Paw & Tail */}
              <svg className="suto-mischief-cat-svg" viewBox="0 0 200 200" fill="none">
                {/* Stone base with garden moss */}
                <ellipse cx="100" cy="180" rx="72" ry="14" fill="#97AB95" opacity="0.35" />
                <ellipse cx="100" cy="178" rx="60" ry="10" fill="#8FA38C" opacity="0.4" />

                {/* Animated swishing tail */}
                <g className="suto-cat-tail-swish">
                  <path
                    d="M48 140C30 135 22 110 32 95C38 85 50 88 48 100C45 115 56 128 65 132"
                    stroke="#223628"
                    strokeWidth="9"
                    strokeLinecap="round"
                  />
                </g>

                {/* Cat Body */}
                <ellipse cx="100" cy="138" rx="42" ry="34" fill="#223628" />

                {/* Chest Fluff */}
                <path d="M88 126C95 134 105 134 112 126C110 142 90 142 88 126Z" fill="#FDFBF7" />

                {/* Cat Head */}
                <circle cx="100" cy="85" r="32" fill="#223628" />

                {/* Left Ear */}
                <path d="M72 65L82 42L95 62Z" fill="#223628" />
                <path d="M77 62L83 48L91 60Z" fill="#FDE8EF" />

                {/* Right Ear */}
                <path d="M128 65L118 42L105 62Z" fill="#223628" />
                <path d="M123 62L117 48L109 60Z" fill="#FDE8EF" />

                {/* Mischievous floral head wreath */}
                <circle cx="82" cy="56" r="5" fill="#E594AD" />
                <circle cx="82" cy="56" r="2" fill="#F5D77F" />
                <circle cx="118" cy="56" r="5" fill="#E594AD" />
                <circle cx="118" cy="56" r="2" fill="#F5D77F" />
                <circle cx="100" cy="52" r="6" fill="#FDE8EF" />
                <circle cx="100" cy="52" r="2.5" fill="#E594AD" />

                {/* Mischievous Eyes (Winking / squinting cheeky look) */}
                {/* Left Eye: arched wink */}
                <path d="M84 82C87 78 92 78 95 82" stroke="#FDFBF7" strokeWidth="2.5" strokeLinecap="round" />
                {/* Right Eye: wide playful pupil with sparkle */}
                <circle cx="112" cy="82" r="4.5" fill="#FDFBF7" />
                <circle cx="112" cy="82" r="2.5" fill="#223628" />
                <circle cx="113.5" cy="80.5" r="1" fill="#FFFFFF" />

                {/* Cute Pink Nose */}
                <polygon points="100,90 96,86 104,86" fill="#E594AD" />

                {/* Cheeky Smiling Mouth */}
                <path d="M96 92C98 95 100 95 100 92C100 95 102 95 104 92" stroke="#FDFBF7" strokeWidth="2" strokeLinecap="round" />

                {/* Whiskers */}
                <line x1="70" y1="88" x2="86" y2="89" stroke="#8FA38C" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="68" y1="94" x2="86" y2="92" stroke="#8FA38C" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="130" y1="88" x2="114" y2="89" stroke="#8FA38C" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="132" y1="94" x2="114" y2="92" stroke="#8FA38C" strokeWidth="1.5" strokeLinecap="round" />

                {/* Left Paw resting */}
                <ellipse cx="80" cy="158" rx="9" ry="7" fill="#223628" />
                <ellipse cx="80" cy="157" rx="6" ry="4" fill="#FDE8EF" opacity="0.6" />

                {/* Right Animated Shoo Paw */}
                <g className="suto-cat-paw-shoo">
                  <path d="M125 130C135 125 145 110 148 100" stroke="#223628" strokeWidth="10" strokeLinecap="round" />
                  <circle cx="148" cy="100" r="9" fill="#223628" />
                  <ellipse cx="148" cy="100" rx="5" ry="4" fill="#FDE8EF" />
                  {/* Little paw pads */}
                  <circle cx="145" cy="94" r="2" fill="#E594AD" />
                  <circle cx="149" cy="93" r="2" fill="#E594AD" />
                  <circle cx="153" cy="95" r="2" fill="#E594AD" />
                </g>
              </svg>
            </div>

            <h2 className="suto-unauth-copy">
              “No, no, no. You're not invited here. Shoo, go away!”
            </h2>
            <p className="suto-unauth-desc">
              This little sanctuary is kept private for someone very special. Your authenticated account is not on the guest list.
            </p>

            <button
              type="button"
              className="suto-return-btn"
              onClick={handleReturnToTerminal}
              id="suto-return-to-terminal-btn"
            >
              <span>← Return to Shadow Exchange Terminal</span>
            </button>
          </div>
        </div>
      )}

      {/* View State: Authorized Welcome Experience */}
      {viewState === "authorized" && content && (
        <div className="suto-garden-content">
          {/* Welcome Hero Opening */}
          <section className="suto-welcome-hero" aria-label="Welcome moment">
            <div className="suto-hero-badge">
              <span>🌸</span>
              <span>A sanctuary crafted for {content.recipientName || "you"}</span>
            </div>

            <h1 className="suto-welcome-headline">
              {content.welcomeMessage}
            </h1>

            <div className="suto-floral-divider" aria-hidden="true">
              <span className="suto-divider-line" />
              <svg className="suto-divider-flower" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="3" fill="#F5D77F" />
                <path d="M12 4C12 4 14 8 12 10C10 8 12 4 12 4Z" />
                <path d="M20 12C20 12 16 14 14 12C16 10 20 12 20 12Z" />
                <path d="M12 20C12 20 10 16 12 14C14 16 12 20 12 20Z" />
                <path d="M4 12C4 12 8 10 10 12C8 14 4 12 4 12Z" />
              </svg>
              <span className="suto-divider-line" />
            </div>

            <p className="suto-hero-subtext">
              Far away from trading tickers, candle charts, and noise—this garden is forever yours.
            </p>
          </section>

          {/* Letter Sections */}
          <section className="suto-letters-grid" aria-label="Love letter chapters">
            {content.letterSections.map((section, idx) => (
              <article key={section.id || idx} className="suto-letter-card">
                <span className="suto-letter-tag">Chapter 0{idx + 1}</span>
                <h2 className="suto-letter-title">{section.title}</h2>
                <p className="suto-letter-body">{section.content}</p>
              </article>
            ))}
          </section>

          {/* Extensible Future Keepsakes Shelf */}
          <section className="suto-keepsakes-shelf" aria-label="Future keepsakes shelf">
            <h3 className="suto-shelf-title">Future Keepsakes & Memories</h3>
            <p className="suto-shelf-desc">
              This space will hold our letters, photographs, and voice memos as time blossoms.
            </p>
            <div className="suto-keepsakes-placeholders">
              <div className="suto-keepsake-box">
                <span className="suto-keepsake-icon">✉️</span>
                <span>Personal Letters</span>
              </div>
              <div className="suto-keepsake-box">
                <span className="suto-keepsake-icon">📷</span>
                <span>Photographs</span>
              </div>
              <div className="suto-keepsake-box">
                <span className="suto-keepsake-icon">🎙️</span>
                <span>Voice Notes</span>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Interactive floral click sparkles */}
      {sparkles.map((sparkle) => (
        <span
          key={sparkle.id}
          className="suto-click-sparkle"
          style={{ left: sparkle.x, top: sparkle.y }}
          aria-hidden="true"
        >
          🌸
        </span>
      ))}
    </div>
  );
}
