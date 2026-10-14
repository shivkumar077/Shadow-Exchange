import { ArrowUpRight, BookOpen, Code2, Cpu, Database, ExternalLink, Globe, Layers, ShieldCheck, Terminal, User } from "lucide-react";

interface AboutMeViewProps {
  onNavigateOverview: () => void;
  onNavigateMarkets: () => void;
}

export function AboutMeView({ onNavigateOverview, onNavigateMarkets }: AboutMeViewProps) {
  return (
    <section className="about-me-view" aria-label="About the Creator and Engineering of Shadow Exchange">
      {/* Top Hero / Intro Card */}
      <section className="panel about-hero-panel">
        <div className="about-hero-grid">
          <div className="about-avatar-col">
            <div className="about-avatar-frame">
              <User size={38} className="about-avatar-icon" />
              <div className="about-status-indicator" title="Creator active" />
            </div>
            <div className="about-badge">CREATOR &amp; LEAD ENGINEER</div>
          </div>
          <div className="about-hero-info">
            <div className="eyebrow"><span className="eyebrow-line" /> ENGINEERING DISCIPLINE <span className="eyebrow-index">/ 001</span></div>
            <h2>Shivkumar</h2>
            <p className="about-role">Full-Stack &amp; Distributed Systems Engineer · Creator of Shadow Exchange</p>
            <p className="about-bio">
              Engineered Shadow Exchange as an exploration into institutional exchange mechanics: limit order books,
              deterministic price-time matching, balance reservations, and real-time STOMP event broadcasting. Focused on
              transactional integrity, thread safety, and zero-compromise terminal UI aesthetics.
            </p>
            <div className="about-links-row">
              <a
                href="https://github.com/shivkumar077/Shadow-Exchange"
                target="_blank"
                rel="noreferrer"
                className="about-link-pill"
              >
                <Code2 size={13} />
                <span>GitHub Repository</span>
                <ExternalLink size={11} />
              </a>
              <span className="about-link-pill is-placeholder" title="Profile placeholder">
                <Globe size={13} />
                <span>shivkumar077.dev</span>
              </span>
              <span className="about-link-pill is-placeholder" title="Contact placeholder">
                <Terminal size={13} />
                <span>contact@shadowexchange.internal</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Grid: Purpose & Scope, Technology Stack, and Engineering Decisions */}
      <div className="about-grid">
        {/* Purpose & Scope */}
        <section className="panel about-section-panel">
          <div className="panel-topline">
            <div className="panel-label">
              <span className="panel-index">01</span> PURPOSE &amp; SCOPE
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

        {/* Technology Stack Overview */}
        <section className="panel about-section-panel">
          <div className="panel-topline">
            <div className="panel-label">
              <span className="panel-index">02</span> ARCHITECTURAL STACK
            </div>
          </div>
          <div className="about-panel-body">
            <h3>Dual-Stack Distributed System</h3>
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
                  <strong>PostgreSQL / Neon Cloud</strong>
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
                <p>Curated dark terminal aesthetic, precision reticle &amp; paw cursors, responsive grid, zero external CSS bloat.</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Engineering Challenges & Order Lifecycle Walkthrough */}
      <section className="panel about-lifecycle-panel">
        <div className="panel-topline">
          <div className="panel-label">
            <span className="panel-index">03</span> ORDER LIFECYCLE &amp; MATCHING ENGINE ARCHITECTURE
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
              <code>UserService / Portfolio</code>
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

          <div className="about-source-references">
            <h4>Key Source Implementations in Repository:</h4>
            <div className="source-links-grid">
              <div className="source-link-box">
                <span className="source-path">src/main/java/com/shadowexchange/engine/MatchingEngine.java</span>
                <small>In-memory priority-queue price-time limit matching engine</small>
              </div>
              <div className="source-link-box">
                <span className="source-path">src/main/java/com/shadowexchange/service/OrderService.java</span>
                <small>Transactional order creation, validation, and balance locking</small>
              </div>
              <div className="source-link-box">
                <span className="source-path">frontend/src/useTradeStream.ts</span>
                <small>WebSocket client with coalesced refresh throttling</small>
              </div>
              <div className="source-link-box">
                <span className="source-path">frontend/src/marketPulse.ts</span>
                <small>30-minute cadence deterministic benchmark curves</small>
              </div>
            </div>
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
