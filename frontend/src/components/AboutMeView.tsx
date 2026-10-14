import {
  ArrowUpRight,
  BookOpen,
  Code2,
  Cpu,
  Database,
  ExternalLink,
  FileCode,
  GitBranch,
  Github,
  Instagram,
  Layers,
  Linkedin,
  ShieldCheck,
  Terminal,
  Twitter,
} from "lucide-react";
import shivProfileImg from "../assets/shiv-profile.jpg";

interface AboutMeViewProps {
  onNavigateOverview: () => void;
  onNavigateMarkets: () => void;
}

const GITHUB_REPO_URL = "https://github.com/shivkumar077/Shadow-Exchange";
const GITHUB_PROFILE_URL = "https://github.com/shivkumar077";
const LINKEDIN_URL = "https://www.linkedin.com/in/shiv-kumar-399a32231/";
const TWITTER_URL = "https://x.com/nightcore_077";
const INSTAGRAM_URL = "https://www.instagram.com/nightcore_077/";

export function AboutMeView({ onNavigateOverview, onNavigateMarkets }: AboutMeViewProps) {
  return (
    <section className="about-me-view" aria-label="About the Creator and Engineering of Shadow Exchange">
      {/* Top Hero / Creator Introduction */}
      <section className="panel about-hero-panel">
        <div className="about-hero-grid">
          <div className="about-avatar-col">
            <div className="about-avatar-frame">
              <img
                src={shivProfileImg}
                alt="Portrait of Shiv Kumar"
                className="about-avatar-image"
                width={78}
                height={78}
                loading="eager"
              />
              <div className="about-status-indicator" title="Creator active" />
            </div>
            <div className="about-badge">CREATOR &amp; LEAD ENGINEER</div>
          </div>
          <div className="about-hero-info">
            <div className="eyebrow">
              <span className="eyebrow-line" /> ENGINEERING DISCIPLINE <span className="eyebrow-index">/ 001</span>
            </div>
            <h2>Shiv Kumar</h2>
            <p className="about-role">Full-Stack &amp; Distributed Systems Engineer · Creator of Shadow Exchange</p>
            <p className="about-bio">
              Engineered Shadow Exchange as an exploration into institutional exchange mechanics: limit order books,
              deterministic price-time matching, balance reservations, and real-time STOMP event broadcasting. Focused on
              transactional integrity, thread safety, and zero-compromise terminal UI aesthetics.
            </p>

            {/* Social & Project Links Section */}
            <div className="about-links-row" aria-label="Social and repository links">
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="about-link-pill is-primary"
                aria-label="Shadow Exchange GitHub Repository (opens in new tab)"
                title="View Shadow Exchange repository on GitHub"
              >
                <GitBranch size={13} />
                <span>Shadow Exchange Repository</span>
                <ExternalLink size={11} />
              </a>

              <a
                href={GITHUB_PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="about-link-pill"
                aria-label="Shiv Kumar GitHub Profile (opens in new tab)"
                title="View GitHub profile"
              >
                <Github size={13} />
                <span>GitHub Profile</span>
                <ExternalLink size={11} />
              </a>

              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="about-link-pill"
                aria-label="Shiv Kumar LinkedIn Profile (opens in new tab)"
                title="View LinkedIn profile: Shiv Kumar"
              >
                <Linkedin size={13} />
                <span>LinkedIn</span>
                <ExternalLink size={11} />
              </a>

              <a
                href={TWITTER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="about-link-pill"
                aria-label="Shiv Kumar X / Twitter Profile (opens in new tab)"
                title="View X / Twitter profile: @nightcore_077"
              >
                <Twitter size={13} />
                <span>Twitter / X</span>
                <ExternalLink size={11} />
              </a>

              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="about-link-pill"
                aria-label="Shiv Kumar Instagram Profile (opens in new tab)"
                title="View Instagram profile: @nightcore_077"
              >
                <Instagram size={13} />
                <span>Instagram</span>
                <ExternalLink size={11} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Grid: Purpose & Scope, and Architecture */}
      <div className="about-grid">
        {/* Section 01: Purpose and Scope */}
        <section className="panel about-section-panel">
          <div className="panel-topline">
            <div className="panel-label">
              <span className="panel-index">01</span> PURPOSE AND SCOPE
            </div>
          </div>
          <div className="about-panel-body">
            <h3>Institutional Exchange Simulation</h3>
            <p>
              Shadow Exchange is designed from first principles to simulate how electronic order-driven financial exchanges operate.
              Unlike simplified broker mockups, the platform isolates order placement from trade settlement:
            </p>
            <ul className="about-bullet-list">
              <li>
                <strong>Price-Time Priority (FIFO) Matching:</strong> Orders are queued at explicit price boundary levels. At each price tick, orders are matched strictly in order of arrival.
              </li>
              <li>
                <strong>Deterministic Reservations:</strong> Buying power and stock certificates are pre-reserved upon order creation, preventing double-spend, race conditions, or unbacked orders.
              </li>
              <li>
                <strong>Simulated Market Environment:</strong> All quotes, balances, and trades are strictly simulated for systems engineering and architectural demonstrations. Not a real-money broker or financial exchange.
              </li>
            </ul>
          </div>
        </section>

        {/* Section 02: Architecture & System Design */}
        <section className="panel about-section-panel">
          <div className="panel-topline">
            <div className="panel-label">
              <span className="panel-index">02</span> ARCHITECTURE
            </div>
          </div>
          <div className="about-panel-body">
            <h3>Event-Driven Decoupled Architecture</h3>
            <p>
              The system operates as two cleanly decoupled tiers communicating through REST and full-duplex STOMP over WebSockets:
            </p>
            <ul className="about-bullet-list">
              <li>
                <strong>Spring Boot Matching Core:</strong> In-memory FIFO order book with thread-safe priority queues crossing matching bids and asks at the resting limit price.
              </li>
              <li>
                <strong>Pre-Trade Reservation Ledger:</strong> Eliminates cash overdrafts and short sales by locking buyer liquidity and seller equity inside transactional database boundaries.
              </li>
              <li>
                <strong>Public STOMP Market Feed:</strong> Publishes executed fills to <code>/topic/trades</code> using an anonymous, lean 6-field DTO for zero-latency UI rendering.
              </li>
            </ul>
          </div>
        </section>
      </div>

      {/* Section 03: Technology Stack */}
      <section className="panel about-section-panel">
        <div className="panel-topline">
          <div className="panel-label">
            <span className="panel-index">03</span> STACK
          </div>
        </div>
        <div className="about-panel-body">
          <div className="about-tech-matrix">
            <div className="tech-card">
              <div className="tech-card-header">
                <Cpu size={15} />
                <strong>Spring Boot 3 (Java 21)</strong>
              </div>
              <p>Core backend matching engine, transaction management, REST APIs, and STOMP WebSocket broker.</p>
            </div>
            <div className="tech-card">
              <div className="tech-card-header">
                <Database size={15} />
                <strong>PostgreSQL / Neon Cloud &amp; H2</strong>
              </div>
              <p>ACID-compliant persistence for demo accounts, stock catalog (28 instruments), ledger balances, and holdings.</p>
            </div>
            <div className="tech-card">
              <div className="tech-card-header">
                <Layers size={15} />
                <strong>React 18 &amp; TypeScript</strong>
              </div>
              <p>High-frequency event-driven UI, optimistic state machines, and zero-latency terminal workspaces.</p>
            </div>
            <div className="tech-card">
              <div className="tech-card-header">
                <Terminal size={15} />
                <strong>Vanilla CSS Design System</strong>
              </div>
              <p>Curated dark terminal aesthetic, precision reticle &amp; diamond cat-eye cursors, responsive grid, zero external CSS bloat.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Order Lifecycle Walkthrough */}
      <section className="panel about-lifecycle-panel">
        <div className="panel-topline">
          <div className="panel-label">
            <span className="panel-index">04</span> ORDER LIFECYCLE &amp; MATCHING ENGINE
          </div>
        </div>
        <div className="about-lifecycle-body">
          <div className="lifecycle-step-grid">
            <div className="lifecycle-card">
              <div className="step-number">01</div>
              <h4>Order Dispatch &amp; Validation</h4>
              <p>Client submits limit order. Backend verifies quantity &gt; 0, price boundary &gt; 0, and instrument validity.</p>
              <code>POST /orders</code>
            </div>
            <div className="lifecycle-card">
              <div className="step-number">02</div>
              <h4>Balance &amp; Share Reservation</h4>
              <p>Buying power (for BUY) or stock quantity (for SELL) is locked into <code>reservedBalance</code> to eliminate overdrafts.</p>
              <code>OrderService.java</code>
            </div>
            <div className="lifecycle-card">
              <div className="step-number">03</div>
              <h4>Order Book Matching (FIFO)</h4>
              <p>In-memory priority queues cross matching bids and asks. Fills occur at the resting limit price.</p>
              <code>MatchingEngine.java</code>
            </div>
            <div className="lifecycle-card">
              <div className="step-number">04</div>
              <h4>Settlement &amp; Trade Stream</h4>
              <p>Executed fills transfer funds and shares atomically. Trade is broadcast to subscribers via STOMP WebSocket.</p>
              <code>/topic/trades</code>
            </div>
          </div>
        </div>
      </section>

      {/* Section 05: Key Resources, Implementation, and Repository */}
      <section className="panel about-section-panel">
        <div className="panel-topline">
          <div className="panel-label">
            <span className="panel-index">05</span> KEY RESOURCES, IMPLEMENTATION, AND REPOSITORY
          </div>
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="subtle-button"
            aria-label="Open Shadow Exchange repository on GitHub"
          >
            <span>GitHub Repository</span>
            <ExternalLink size={12} />
          </a>
        </div>
        <div className="about-panel-body">
          <p style={{ color: "#8c9384", fontSize: "12px", marginBottom: "14px" }}>
            Direct links to verified core source implementations in the Shadow Exchange GitHub repository:
          </p>

          <div className="source-links-grid">
            <a
              href="https://github.com/shivkumar077/Shadow-Exchange/blob/main/src/main/java/com/shadowexchange/matching/MatchingEngine.java"
              target="_blank"
              rel="noopener noreferrer"
              className="source-link-box is-clickable"
              aria-label="View MatchingEngine.java source code on GitHub"
            >
              <div className="source-link-header">
                <FileCode size={13} className="source-icon" />
                <span className="source-path">src/main/java/com/shadowexchange/matching/MatchingEngine.java</span>
                <ExternalLink size={11} className="source-external-icon" />
              </div>
              <small>In-memory priority-queue price-time limit matching engine</small>
            </a>

            <a
              href="https://github.com/shivkumar077/Shadow-Exchange/blob/main/src/main/java/com/shadowexchange/service/OrderService.java"
              target="_blank"
              rel="noopener noreferrer"
              className="source-link-box is-clickable"
              aria-label="View OrderService.java source code on GitHub"
            >
              <div className="source-link-header">
                <FileCode size={13} className="source-icon" />
                <span className="source-path">src/main/java/com/shadowexchange/service/OrderService.java</span>
                <ExternalLink size={11} className="source-external-icon" />
              </div>
              <small>Transactional order creation, validation, and balance locking</small>
            </a>

            <a
              href="https://github.com/shivkumar077/Shadow-Exchange/blob/main/src/main/java/com/shadowexchange/service/SettlementService.java"
              target="_blank"
              rel="noopener noreferrer"
              className="source-link-box is-clickable"
              aria-label="View SettlementService.java source code on GitHub"
            >
              <div className="source-link-header">
                <FileCode size={13} className="source-icon" />
                <span className="source-path">src/main/java/com/shadowexchange/service/SettlementService.java</span>
                <ExternalLink size={11} className="source-external-icon" />
              </div>
              <small>Atomic balance transfer, share settlement, and reservation release</small>
            </a>

            <a
              href="https://github.com/shivkumar077/Shadow-Exchange/blob/main/src/main/java/com/shadowexchange/websocket/TradeWebSocketPublisher.java"
              target="_blank"
              rel="noopener noreferrer"
              className="source-link-box is-clickable"
              aria-label="View TradeWebSocketPublisher.java source code on GitHub"
            >
              <div className="source-link-header">
                <FileCode size={13} className="source-icon" />
                <span className="source-path">src/main/java/com/shadowexchange/websocket/TradeWebSocketPublisher.java</span>
                <ExternalLink size={11} className="source-external-icon" />
              </div>
              <small>Transaction-committed STOMP broker publisher broadcasting to /topic/trades</small>
            </a>

            <a
              href="https://github.com/shivkumar077/Shadow-Exchange/blob/main/frontend/src/useTradeStream.ts"
              target="_blank"
              rel="noopener noreferrer"
              className="source-link-box is-clickable"
              aria-label="View useTradeStream.ts source code on GitHub"
            >
              <div className="source-link-header">
                <Code2 size={13} className="source-icon" />
                <span className="source-path">frontend/src/useTradeStream.ts</span>
                <ExternalLink size={11} className="source-external-icon" />
              </div>
              <small>Low-latency WebSocket STOMP client with coalesced refresh throttling</small>
            </a>

            <a
              href="https://github.com/shivkumar077/Shadow-Exchange/blob/main/frontend/src/marketPulse.ts"
              target="_blank"
              rel="noopener noreferrer"
              className="source-link-box is-clickable"
              aria-label="View marketPulse.ts source code on GitHub"
            >
              <div className="source-link-header">
                <Code2 size={13} className="source-icon" />
                <span className="source-path">frontend/src/marketPulse.ts</span>
                <ExternalLink size={11} className="source-external-icon" />
              </div>
              <small>30-minute cadence deterministic benchmark curves and sparklines</small>
            </a>
          </div>
        </div>

        <div className="about-disclaimer-footer">
          <ShieldCheck size={14} />
          <span>
            SIMULATION NOTICE: Shadow Exchange is an independent software engineering portfolio project. All instruments, order books, and cash balances are virtual demonstrations.
          </span>
        </div>
      </section>

      {/* Quick Navigation Footer */}
      <div className="about-footer-nav">
        <button type="button" className="subtle-button" onClick={onNavigateOverview}>
          <Terminal size={13} />
          <span>Go to Trading Overview</span>
          <ArrowUpRight size={13} />
        </button>
        <button type="button" className="subtle-button" onClick={onNavigateMarkets}>
          <BookOpen size={13} />
          <span>View Listed Instruments</span>
          <ArrowUpRight size={13} />
        </button>
      </div>
    </section>
  );
}
