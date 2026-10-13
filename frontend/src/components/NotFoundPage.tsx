import { ArrowLeft, ArrowUpRight, Terminal } from "lucide-react";

interface NotFoundPageProps {
  onNavigateHome: () => void;
  onGoBack: () => void;
  attemptedPath?: string;
}

export function NotFoundPage({
  onNavigateHome,
  onGoBack,
  attemptedPath,
}: NotFoundPageProps) {
  return (
    <div className="not-found-page" role="main" aria-label="Page Not Found">
      <header className="not-found-header">
        <div className="brand">
          <span className="brand-mark"><span /><span /><span /></span>
          <span className="brand-word">SHADOW<span>EXCHANGE</span></span>
        </div>
        <div className="session-pill">
          <span className="status-light is-warning" /> SIGNAL LOST
        </div>
      </header>

      <div className="not-found-container">
        {/* Cat Illustration with Lost Signal & Floating Elements */}
        <div className="cat-illustration-stage">
          <svg
            className="cat-svg"
            viewBox="0 0 320 240"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Ambient radar orbit / lost signal rings */}
            <circle cx="160" cy="130" r="100" stroke="#2b3028" stroke-width="1" stroke-dasharray="4 6" opacity="0.4" />
            <circle cx="160" cy="130" r="75" stroke="#2b3028" stroke-width="1" stroke-dasharray="2 4" opacity="0.6" />

            {/* Floating stars & lost market signals */}
            <path d="M70 60 L72 65 L77 67 L72 69 L70 74 L68 69 L63 67 L68 65 Z" fill="#d3f17b" opacity="0.75" />
            <path d="M250 80 L251.5 84 L255.5 85.5 L251.5 87 L250 91 L248.5 87 L244.5 85.5 L248.5 84 Z" fill="#d3f17b" opacity="0.6" />
            <circle cx="95" cy="105" r="1.5" fill="#858a7f" />
            <circle cx="230" cy="50" r="2" fill="#858a7f" />
            <circle cx="265" cy="140" r="1.5" fill="#d3f17b" opacity="0.8" />

            {/* Little floating question mark / ticker fragment */}
            <text x="80" y="160" fill="#5e645a" font-family="'DM Mono', monospace" font-size="11">?404</text>
            <text x="235" y="125" fill="#5e645a" font-family="'DM Mono', monospace" font-size="10">NaN%</text>

            {/* Blinking lost cursor */}
            <rect x="195" y="65" width="7" height="13" fill="#d3f17b" opacity="0.9" className="blinking-cursor" />

            {/* Ground shadow */}
            <ellipse cx="160" cy="205" rx="55" ry="9" fill="#0d0f0c" />

            {/* Cat Body: Sleek dark obsidian silhouette */}
            <g className="cat-character">
              {/* Tail */}
              <path
                d="M125 185 C105 185 92 165 96 142 C98 128 112 126 114 135 C115 142 108 155 120 165 C124 168 130 172 135 174"
                stroke="#1b1e18"
                stroke-width="7"
                stroke-linecap="round"
                fill="none"
              />
              <path
                d="M125 185 C105 185 92 165 96 142 C98 128 112 126 114 135 C115 142 108 155 120 165 C124 168 130 172 135 174"
                stroke="#2a3025"
                stroke-width="3"
                stroke-linecap="round"
                fill="none"
              />

              {/* Main Body */}
              <path
                d="M135 195 C132 170 137 140 148 128 C153 123 167 123 172 128 C183 140 188 170 185 195 C182 201 138 201 135 195 Z"
                fill="#181b15"
                stroke="#2a3025"
                stroke-width="1.8"
              />

              {/* Little Front Paws */}
              <ellipse cx="150" cy="198" rx="6" ry="4" fill="#20241c" stroke="#2a3025" stroke-width="1" />
              <ellipse cx="170" cy="198" rx="6" ry="4" fill="#20241c" stroke="#2a3025" stroke-width="1" />

              {/* Cat Head */}
              <circle cx="160" cy="108" r="23" fill="#181b15" stroke="#2a3025" stroke-width="1.8" />

              {/* Cat Left Ear */}
              <polygon points="142,94 133,70 152,86" fill="#181b15" stroke="#2a3025" stroke-width="1.8" stroke-linejoin="round" />
              <polygon points="142,92 136,76 149,87" fill="#d3f17b" opacity="0.35" />

              {/* Cat Right Ear */}
              <polygon points="168,86 187,70 178,94" fill="#181b15" stroke="#2a3025" stroke-width="1.8" stroke-linejoin="round" />
              <polygon points="171,87 184,76 178,92" fill="#d3f17b" opacity="0.35" />

              {/* Glowing Luminous Eyes (curious, round, glowing lime) */}
              <ellipse cx="152" cy="106" rx="4.2" ry="4.8" fill="#d3f17b" />
              <ellipse cx="168" cy="106" rx="4.2" ry="4.8" fill="#d3f17b" />
              {/* Pupil highlights */}
              <ellipse cx="153" cy="106" rx="1.6" ry="3.8" fill="#11130f" />
              <ellipse cx="167" cy="106" rx="1.6" ry="3.8" fill="#11130f" />
              <circle cx="150.5" cy="104" r="1.2" fill="#ffffff" />
              <circle cx="166.5" cy="104" r="1.2" fill="#ffffff" />

              {/* Cute Little Nose & Mouth */}
              <polygon points="158.5,114 161.5,114 160,116" fill="#f19c65" />
              <path d="M157 117 C158.5 119 160 119 160 117 C160 119 161.5 119 163 117" stroke="#3b4233" stroke-width="1" stroke-linecap="round" fill="none" />

              {/* Tiny Whiskers */}
              <path d="M145 114 L132 112 M145 116 L131 117 M175 114 L188 112 M175 116 L189 117" stroke="#485040" stroke-width="1" stroke-linecap="round" />
            </g>
          </svg>
        </div>

        {/* 404 Heading & Playful Copy */}
        <div className="not-found-copy">
          <div className="not-found-code-badge">
            <span className="code-dot" />
            <span>ERROR 404 · ROUTE UNRECOGNIZED</span>
          </div>

          <h1 className="not-found-title">
            Looks like this little cat<br />
            <em>lost the signal.</em>
          </h1>

          <p className="not-found-description">
            The market route you were looking for doesn't exist or wandered outside the exchange perimeter.
            {attemptedPath && attemptedPath !== "/" && (
              <span className="attempted-path-tag">
                Path requested: <code>{attemptedPath}</code>
              </span>
            )}
          </p>

          {/* Action Buttons */}
          <div className="not-found-actions">
            <button
              type="button"
              className="not-found-primary-btn"
              onClick={onNavigateHome}
              aria-label="Return to trading terminal"
            >
              <Terminal size={15} />
              <span>Back to Terminal</span>
              <ArrowUpRight size={14} />
            </button>

            <button
              type="button"
              className="not-found-secondary-btn"
              onClick={onGoBack}
              aria-label="Go back to previous page"
            >
              <ArrowLeft size={14} />
              <span>Go back</span>
            </button>
          </div>
        </div>
      </div>

      <footer className="not-found-footer">
        <div><span>SHADOW EXCHANGE</span><span className="footer-separator">/</span><span>PERIMETER SYSTEM</span></div>
        <div><span>LOST PACKET RECOVERY</span><span className="footer-separator">·</span><span className="footer-version">v0.2.0</span></div>
      </footer>
    </div>
  );
}
