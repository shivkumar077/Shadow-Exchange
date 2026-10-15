import { ShieldCheck, ArrowRight, Activity, Terminal, Lock } from "lucide-react";
import { ShadowCat } from "./ShadowCat";
import { GoogleGLogo } from "./ProfileMenu";

export interface LoginPageProps {
  onGoogleSignIn: () => void;
  onExploreDemo?: () => void;
  authError?: string | null;
}

export function LoginPage({
  onGoogleSignIn,
  onExploreDemo,
  authError,
}: LoginPageProps) {
  return (
    <div className="login-gateway-shell" role="main" aria-label="Shadow Exchange Login Gateway">
      {/* Background ambient grid and glow */}
      <div className="login-grid-backdrop" aria-hidden="true" />
      <div className="login-ambient-glow" aria-hidden="true" />

      {/* Top telemetry bar */}
      <header className="login-topbar">
        <div className="login-topbar-left">
          <span className="brand-mark">
            <ShadowCat expression="neutral" size={22} interactive={false} />
          </span>
          <span className="brand-word">
            SHADOW<span>EXCHANGE</span>
          </span>
          <span className="login-pill-divider" />
          <span className="login-system-pill">
            <span className="status-light" />
            <span>EXCHANGE GATEWAY ONLINE</span>
          </span>
        </div>
        <div className="login-topbar-right">
          <span className="login-telemetry-tag">
            <Lock size={11} />
            <span>OIDC 2.0 · TLS 1.3 SECURE</span>
          </span>
        </div>
      </header>

      {/* Central Auth Container */}
      <main className="login-center-stage">
        <div className="login-terminal-card">
          {/* Card Header & Eyebrow */}
          <div className="login-card-header">
            <div className="login-terminal-badge">
              <Terminal size={12} className="login-terminal-icon" />
              <span>TERMINAL ACCESS PORTAL</span>
            </div>
            <h1 className="login-heading">Institutional Execution Terminal</h1>
            <p className="login-subheading">
              Sub-millisecond liquidity routing, real-time depth book matching, and 28 active instruments.
            </p>
          </div>

          {/* Real-time Telemetry Strip */}
          <div className="login-ticker-tape" aria-hidden="true">
            <div className="login-ticker-item positive">
              <span className="ticker-sym">NVDA</span>
              <span className="ticker-val">$142.87</span>
              <span className="ticker-chg">+2.4%</span>
            </div>
            <div className="login-ticker-item positive">
              <span className="ticker-sym">AAPL</span>
              <span className="ticker-val">$228.15</span>
              <span className="ticker-chg">+1.1%</span>
            </div>
            <div className="login-ticker-item negative">
              <span className="ticker-sym">TSLA</span>
              <span className="ticker-val">$218.40</span>
              <span className="ticker-chg">-0.8%</span>
            </div>
            <div className="login-ticker-item positive">
              <span className="ticker-sym">MSFT</span>
              <span className="ticker-val">$448.20</span>
              <span className="ticker-chg">+0.9%</span>
            </div>
          </div>

          {/* Auth Error Banner if redirected with failure */}
          {authError && (
            <div className="login-error-banner" role="alert">
              <span>{authError}</span>
            </div>
          )}

          {/* Primary Action: Continue with Google */}
          <div className="login-actions">
            <button
              type="button"
              className="login-google-btn"
              onClick={onGoogleSignIn}
              id="continue-with-google-btn"
              aria-label="Continue with Google"
            >
              <span className="google-logo-wrap">
                <GoogleGLogo size={18} />
              </span>
              <span className="google-btn-text">
                <strong>Continue with Google</strong>
                <small>Secure OIDC Authentication · Instant Session</small>
              </span>
              <ArrowRight size={16} className="google-btn-arrow" />
            </button>

            {/* Sandbox / Demo option */}
            {onExploreDemo && (
              <div className="login-sandbox-row">
                <div className="login-divider-row">
                  <span className="login-divider-line" />
                  <span className="login-divider-text">OR EXPLORE ANONYMOUSLY</span>
                  <span className="login-divider-line" />
                </div>
                <button
                  type="button"
                  className="login-demo-btn"
                  onClick={onExploreDemo}
                  id="launch-demo-terminal-btn"
                  aria-label="Launch Simulated Demo Terminal"
                >
                  <Activity size={14} />
                  <span>Launch Simulated Sandbox ($10,000 Demo Account)</span>
                </button>
              </div>
            )}
          </div>

          {/* Security & Verification Callout */}
          <div className="login-footer-guarantee">
            <ShieldCheck size={14} className="positive" />
            <span>
              Sessions are securely verified by Spring Security HTTP-only cookies. No credentials or authentication tokens stored in localStorage.
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="login-bottom-bar">
        <span>SHADOW EXCHANGE · HIGH-VELOCITY TRADING ENGINE</span>
        <span>LATENCY: &lt;1.2MS · DEPTH: FULL ORDER BOOK</span>
      </footer>
    </div>
  );
}
