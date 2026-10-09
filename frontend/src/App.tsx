import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowLeftRight,
  ArrowUpRight,
  Bell,
  ChevronDown,
  CircleHelp,
  Command,
  Eye,
  LayoutDashboard,
  Menu,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Wallet,
  X,
} from "lucide-react";

type Stock = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  points: number[];
  volume: string;
  marketCap: string;
};

type LocalOrder = {
  id: number;
  side: "BUY" | "SELL";
  symbol: string;
  quantity: number;
  price: number;
  status: "QUEUED" | "FILLED";
  time: string;
};

const stocks: Stock[] = [
  { symbol: "NVDA", name: "NVIDIA Corporation", price: 142.87, change: 2.84, points: [30, 28, 33, 27, 37, 35, 41, 39, 45, 42, 49, 47, 55, 53, 62, 58, 66, 63, 71, 68, 78, 75, 84, 81, 92], volume: "42.8M", marketCap: "$3.48T" },
  { symbol: "AAPL", name: "Apple Inc.", price: 231.42, change: 1.26, points: [42, 39, 43, 40, 46, 44, 48, 43, 51, 48, 56, 52, 57, 55, 61, 58, 65, 62, 67, 65, 73, 69, 76, 74, 82], volume: "31.2M", marketCap: "$3.51T" },
  { symbol: "MSFT", name: "Microsoft Corporation", price: 428.76, change: -0.38, points: [70, 73, 68, 72, 65, 69, 63, 66, 60, 65, 58, 62, 55, 59, 54, 57, 51, 55, 49, 52, 46, 50, 43, 46, 41], volume: "18.6M", marketCap: "$3.19T" },
  { symbol: "TSLA", name: "Tesla, Inc.", price: 338.29, change: 4.17, points: [18, 24, 21, 32, 28, 38, 34, 46, 40, 51, 48, 60, 55, 66, 61, 73, 68, 78, 73, 84, 78, 89, 83, 94, 90], volume: "76.4M", marketCap: "$1.09T" },
  { symbol: "AMZN", name: "Amazon.com, Inc.", price: 214.19, change: -0.72, points: [76, 72, 78, 70, 74, 67, 71, 65, 69, 62, 66, 58, 63, 57, 61, 54, 58, 50, 55, 48, 52, 45, 49, 43, 46], volume: "27.9M", marketCap: "$2.27T" },
];

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

function Sparkline({ points, negative = false }: { points: number[]; negative?: boolean }) {
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${(index / (points.length - 1)) * 100} ${100 - point}`).join(" ");
  return (
    <svg className={`sparkline ${negative ? "is-negative" : ""}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path d={path} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function MarketChart({ stock }: { stock: Stock }) {
  const chartPoints = useMemo(() => {
    const base = stock.points;
    return base.map((point, index) => ({
      x: 8 + (index / (base.length - 1)) * 884,
      y: 222 - point * 1.88,
    }));
  }, [stock]);

  const linePath = chartPoints.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const areaPath = `${linePath} L 892 246 L 8 246 Z`;
  const last = chartPoints[chartPoints.length - 1];

  return (
    <svg className="market-chart" viewBox="0 0 900 270" role="img" aria-label={`${stock.symbol} illustrative price chart`}>
      <g className="chart-grid">
        {[42, 92, 142, 192, 242].map((y) => <line key={y} x1="8" x2="892" y1={y} y2={y} />)}
        {[8, 185, 362, 539, 716, 892].map((x) => <line key={x} x1={x} x2={x} y1="18" y2="246" />)}
      </g>
      <path className="chart-area" d={areaPath} />
      <path className="chart-line" d={linePath} />
      <line className="chart-crosshair" x1={last.x} x2={last.x} y1="18" y2="246" />
      <circle className="chart-point-halo" cx={last.x} cy={last.y} r="7" />
      <circle className="chart-point" cx={last.x} cy={last.y} r="3.2" />
      <g className="chart-axis-labels">
        <text x="8" y="264">09:30</text>
        <text x="185" y="264" textAnchor="middle">10:30</text>
        <text x="362" y="264" textAnchor="middle">11:30</text>
        <text x="539" y="264" textAnchor="middle">12:30</text>
        <text x="716" y="264" textAnchor="middle">13:30</text>
        <text x="892" y="264" textAnchor="end">NOW</text>
      </g>
    </svg>
  );
}

function App() {
  const [activeSection, setActiveSection] = useState("Overview");
  const [selectedSymbol, setSelectedSymbol] = useState("NVDA");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState("10");
  const [limitPrice, setLimitPrice] = useState("142.87");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [orders, setOrders] = useState<LocalOrder[]>([
    { id: 1048, side: "BUY", symbol: "AAPL", quantity: 12, price: 229.5, status: "QUEUED", time: "10:42:18" },
    { id: 1047, side: "SELL", symbol: "MSFT", quantity: 4, price: 431.2, status: "QUEUED", time: "10:39:06" },
    { id: 1046, side: "BUY", symbol: "NVDA", quantity: 8, price: 140.25, status: "FILLED", time: "10:31:52" },
  ]);

  const selectedStock = stocks.find((stock) => stock.symbol === selectedSymbol) ?? stocks[0];
  const filteredStocks = stocks.filter((stock) =>
    `${stock.symbol} ${stock.name}`.toLowerCase().includes(search.toLowerCase()),
  );
  const estimatedValue = Math.max(0, Number(quantity) || 0) * Math.max(0, Number(limitPrice) || 0);

  const chooseStock = (stock: Stock) => {
    setSelectedSymbol(stock.symbol);
    setLimitPrice(stock.price.toFixed(2));
  };

  const placeDemoOrder = () => {
    const parsedQuantity = Number(quantity);
    const parsedPrice = Number(limitPrice);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1 || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setToast("Enter a valid quantity and limit price.");
      return;
    }
    const newOrder: LocalOrder = {
      id: (orders[0]?.id ?? 1048) + 1,
      side,
      symbol: selectedSymbol,
      quantity: parsedQuantity,
      price: parsedPrice,
      status: "QUEUED",
      time: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    };
    setOrders((current) => [newOrder, ...current].slice(0, 5));
    setToast(`${side} order staged locally · ${parsedQuantity} ${selectedSymbol}`);
  };

  const navigation = [
    { label: "Overview", icon: LayoutDashboard },
    { label: "Markets", icon: Activity },
    { label: "Portfolio", icon: Wallet },
    { label: "Activity", icon: ArrowLeftRight },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={() => setActiveSection("Overview")} aria-label="Shadow Exchange home">
          <span className="brand-mark"><span /><span /><span /></span>
          <span className="brand-word">SHADOW<span>EXCHANGE</span></span>
        </a>

        <div className="workspace-label">WORKSPACE <span>01</span></div>
        <nav className="primary-nav" aria-label="Primary navigation">
          {navigation.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${activeSection === label ? "active" : ""}`} onClick={() => setActiveSection(label)}>
              <Icon size={16} strokeWidth={1.7} />
              <span>{label}</span>
              {label === "Activity" && <span className="nav-count">{orders.length}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-rule" />
        <div className="workspace-label">YOUR MARKETS <button className="tiny-icon-button" aria-label="Market settings"><SlidersHorizontal size={13} /></button></div>
        <div className="mini-watchlist">
          {stocks.slice(0, 4).map((stock) => (
            <button key={stock.symbol} className={`mini-stock ${selectedSymbol === stock.symbol ? "selected" : ""}`} onClick={() => chooseStock(stock)}>
              <span className="ticker-avatar">{stock.symbol.slice(0, 1)}</span>
              <span className="mini-stock-copy"><strong>{stock.symbol}</strong><small>{stock.name.split(" ")[0]}</small></span>
              <span className={`mini-change ${stock.change >= 0 ? "positive" : "negative"}`}>{stock.change > 0 ? "+" : ""}{stock.change.toFixed(2)}%</span>
            </button>
          ))}
        </div>

        <div className="sidebar-bottom">
          <div className="status-card">
            <span className="status-light" />
            <div><strong>Matching engine</strong><small>Simulation online</small></div>
            <span className="status-pulse" />
          </div>
          <button className="nav-item utility-item" onClick={() => setToast("Settings will be available in a later build.")}><Settings2 size={16} /><span>Preferences</span></button>
          <button className="nav-item utility-item" onClick={() => setToast("Help centre is coming soon.")}><CircleHelp size={16} /><span>Help & documentation</span></button>
          <div className="profile-row">
            <div className="profile-avatar">SK</div>
            <div className="profile-copy"><strong>Demo operator</strong><small>Personal workspace</small></div>
            <ChevronDown size={15} className="profile-chevron" />
          </div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>{activeSection}</strong></div>
          <div className="topbar-actions">
            <div className="session-pill"><span className="status-light" /> SIMULATED SESSION</div>
            <button className="icon-button" aria-label="Search" onClick={() => document.getElementById("market-search")?.focus()}><Search size={17} /></button>
            <button className="icon-button notification-button" aria-label="Notifications" onClick={() => setToast("You're all caught up.")}><Bell size={17} /><i /></button>
            <span className="topbar-divider" />
            <button className="shortcut-button" onClick={() => setToast("Keyboard shortcuts are coming soon.")}><Command size={13} /> <span>K</span></button>
          </div>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> MARKET INTELLIGENCE <span className="eyebrow-index">/ 001</span></div>
              <h1>{activeSection === "Overview" ? <>The market,<br /><em>without the noise.</em></> : <>{activeSection}<br /><em>at a glance.</em></>}</h1>
              <p className="heading-description">A considered view of the market. Every signal, nothing superfluous.</p>
            </div>
            <div className="heading-meta">
              <div className="date-label">NEW YORK · NYSE</div>
              <div className="market-time">10:42:18 <span>EDT</span></div>
              <div className="market-open"><span className="status-light" /> MARKET OPEN <span className="meta-separator">·</span> REGULAR SESSION</div>
            </div>
          </section>

          <section className="market-ribbon" aria-label="Market summary">
            <div className="ribbon-heading"><span className="ribbon-dot" /> MARKET PULSE</div>
            <div className="ribbon-stat"><span>S&amp;P 500</span><strong>5,842.47</strong><small className="positive">+0.68%</small><Sparkline points={[32, 35, 30, 42, 38, 45, 43, 55, 51, 62, 58, 70, 76]} /></div>
            <div className="ribbon-stat"><span>NASDAQ</span><strong>18,274.91</strong><small className="positive">+1.14%</small><Sparkline points={[25, 28, 27, 40, 36, 46, 44, 52, 49, 64, 61, 74, 82]} /></div>
            <div className="ribbon-stat"><span>DOW JONES</span><strong>42,118.09</strong><small className="negative">−0.12%</small><Sparkline points={[70, 68, 72, 65, 68, 61, 64, 56, 59, 52, 55, 48, 45]} negative /></div>
            <div className="ribbon-footnote">DELAYED DATA <span>·</span> ILLUSTRATIVE</div>
          </section>

          <div className="content-grid">
            <div className="left-column">
              <section className="panel featured-panel">
                <div className="panel-topline">
                  <div className="panel-label"><span className="panel-index">01</span> IN FOCUS</div>
                  <button className="subtle-button" onClick={() => setActiveSection("Markets")}>All markets <ArrowUpRight size={13} /></button>
                </div>
                <div className="featured-asset">
                  <div className="asset-identity">
                    <div className="asset-monogram">{selectedStock.symbol.slice(0, 1)}</div>
                    <div><div className="asset-symbol">{selectedStock.symbol}<span className="asset-exchange">NASDAQ</span></div><div className="asset-name">{selectedStock.name}</div></div>
                  </div>
                  <div className="asset-price-block">
                    <div className="asset-price">{money(selectedStock.price)}</div>
                    <div className={`asset-change ${selectedStock.change >= 0 ? "positive" : "negative"}`}>{selectedStock.change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{selectedStock.change > 0 ? "+" : ""}{selectedStock.change.toFixed(2)}% <span>today</span></div>
                  </div>
                </div>
                <div className="chart-toolbar">
                  <div className="chart-legend"><span className="legend-dot" /> PRICE <span className="legend-value">{money(selectedStock.price)}</span></div>
                  <div className="timeframes">{["1D", "1W", "1M", "3M", "1Y", "ALL"].map((frame) => <button key={frame} className={frame === "1D" ? "selected" : ""} onClick={() => setToast(`${frame} chart range is a visual prototype.`)}>{frame}</button>)}</div>
                </div>
                <MarketChart stock={selectedStock} />
                <div className="chart-footer"><span>OPEN <strong>{money(selectedStock.price * 0.986)}</strong></span><span>HIGH <strong className="positive">{money(selectedStock.price * 1.012)}</strong></span><span>LOW <strong>{money(selectedStock.price * 0.978)}</strong></span><span>VOLUME <strong>{selectedStock.volume}</strong></span></div>
              </section>

              <section className="panel watchlist-panel">
                <div className="panel-topline">
                  <div className="panel-label"><span className="panel-index">02</span> WATCHLIST <span className="panel-count">05 ASSETS</span></div>
                  <label className="search-field"><Search size={14} /><input id="market-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find an asset" /></label>
                </div>
                <div className="watchlist-table">
                  <div className="table-head"><span>INSTRUMENT</span><span>LAST PRICE</span><span>24H CHANGE</span><span className="spark-head">TREND</span><span /></div>
                  {filteredStocks.map((stock) => (
                    <button key={stock.symbol} className={`watchlist-row ${selectedSymbol === stock.symbol ? "chosen" : ""}`} onClick={() => chooseStock(stock)}>
                      <span className="table-asset"><span className="ticker-avatar">{stock.symbol.slice(0, 1)}</span><span><strong>{stock.symbol}</strong><small>{stock.name}</small></span></span>
                      <span className="table-price">{money(stock.price)}</span>
                      <span className={`table-change ${stock.change >= 0 ? "positive" : "negative"}`}>{stock.change > 0 ? "+" : ""}{stock.change.toFixed(2)}%</span>
                      <span className="table-spark"><Sparkline points={stock.points} negative={stock.change < 0} /></span>
                      <span className="row-arrow"><ArrowUpRight size={14} /></span>
                    </button>
                  ))}
                  {filteredStocks.length === 0 && <div className="empty-state">No instruments match “{search}”.</div>}
                </div>
                <div className="watchlist-footer"><span>SHOWING {filteredStocks.length.toString().padStart(2, "0")} OF 05 INSTRUMENTS</span><button onClick={() => setSearch("")}>RESET FILTER <X size={11} /></button></div>
              </section>
            </div>

            <div className="right-column">
              <section className="panel order-panel">
                <div className="panel-topline">
                  <div className="panel-label"><span className="panel-index">03</span> ORDER TICKET</div>
                  <button className="tiny-icon-button" aria-label="Order ticket settings" onClick={() => setToast("Advanced order settings are planned for a later build.")}><Settings2 size={14} /></button>
                </div>
                <div className="order-instrument">
                  <div><span className="field-caption">INSTRUMENT</span><strong>{selectedStock.symbol}<small> / USD</small></strong></div>
                  <button className="change-instrument" onClick={() => setActiveSection("Markets")}>CHANGE <ChevronDown size={12} /></button>
                </div>
                <div className="side-switch" role="group" aria-label="Order side">
                  <button className={side === "BUY" ? "buy-active" : ""} onClick={() => setSide("BUY")}><ArrowUpRight size={15} /> BUY</button>
                  <button className={side === "SELL" ? "sell-active" : ""} onClick={() => setSide("SELL")}><ArrowDownRight size={15} /> SELL</button>
                </div>
                <div className="order-field">
                  <label htmlFor="order-type">ORDER TYPE</label>
                  <button id="order-type" className="select-like" onClick={() => setToast("Limit orders are the supported order type in this prototype.")}>Limit order <ChevronDown size={14} /></button>
                </div>
                <div className="order-field">
                  <label htmlFor="limit-price">LIMIT PRICE <span>USD</span></label>
                  <div className="number-input"><span>$</span><input id="limit-price" inputMode="decimal" value={limitPrice} onChange={(event) => setLimitPrice(event.target.value)} /><button onClick={() => setLimitPrice(selectedStock.price.toFixed(2))}>MID</button></div>
                </div>
                <div className="order-field">
                  <label htmlFor="quantity">QUANTITY <span>SHARES</span></label>
                  <div className="number-input"><input id="quantity" inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} /><div className="stepper"><button aria-label="Decrease quantity" onClick={() => setQuantity(String(Math.max(1, (Number(quantity) || 1) - 1)))}>−</button><button aria-label="Increase quantity" onClick={() => setQuantity(String(Math.max(1, Number(quantity) || 1) + 1))}>+</button></div></div>
                  <div className="quantity-presets">{[1, 5, 10, 25].map((amount) => <button key={amount} className={Number(quantity) === amount ? "selected" : ""} onClick={() => setQuantity(String(amount))}>{amount}</button>)}</div>
                </div>
                <div className="order-estimate"><span>ESTIMATED ORDER VALUE</span><strong>{money(estimatedValue)}</strong></div>
                <div className="order-note"><ShieldCheck size={14} /><span>Simulation only. No real funds or securities.</span></div>
                <button className={`submit-order ${side === "SELL" ? "sell-submit" : ""}`} onClick={placeDemoOrder}>{side === "BUY" ? "Review buy order" : "Review sell order"} <ArrowUpRight size={16} /></button>
                <div className="ticket-footnote">By continuing, you acknowledge this is a simulated market.</div>
              </section>

              <section className="panel depth-panel">
                <div className="panel-topline">
                  <div className="panel-label"><span className="panel-index">04</span> MARKET DEPTH</div>
                  <span className="depth-live"><span className="status-light" /> LIVE SIM</span>
                </div>
                <div className="depth-head"><span>SIZE</span><span>BUY PRICE</span><span>SELL PRICE</span><span>SIZE</span></div>
                {[
                  { buySize: "124", buy: selectedStock.price - 0.12, sell: selectedStock.price + 0.13, sellSize: "86", width: 66 },
                  { buySize: "82", buy: selectedStock.price - 0.24, sell: selectedStock.price + 0.25, sellSize: "142", width: 45 },
                  { buySize: "206", buy: selectedStock.price - 0.37, sell: selectedStock.price + 0.38, sellSize: "98", width: 82 },
                  { buySize: "64", buy: selectedStock.price - 0.51, sell: selectedStock.price + 0.52, sellSize: "173", width: 34 },
                ].map((level, index) => (
                  <div className="depth-row" key={index}>
                    <span className="depth-size buy-depth" style={{ "--depth": `${level.width}%` } as CSSProperties}>{level.buySize}</span>
                    <strong className="positive">{level.buy.toFixed(2)}</strong>
                    <strong className="negative">{level.sell.toFixed(2)}</strong>
                    <span className="depth-size sell-depth" style={{ "--depth": `${100 - level.width}%` } as CSSProperties}>{level.sellSize}</span>
                  </div>
                ))}
                <div className="depth-mid"><span>SPREAD</span><strong>$0.25 <small>0.17%</small></strong></div>
              </section>

              <section className="panel session-panel">
                <div className="session-emblem"><Eye size={16} /></div>
                <div><strong>A market in miniature.</strong><p>Orders, matching and settlement run on your local exchange simulation.</p><button onClick={() => setToast("Exchange documentation is coming soon.")}>HOW IT WORKS <ArrowUpRight size={12} /></button></div>
              </section>
            </div>
          </div>

          <section className="panel activity-panel">
            <div className="panel-topline">
              <div className="panel-label"><span className="panel-index">05</span> ORDER ACTIVITY <span className="panel-count">LOCAL PREVIEW</span></div>
              <button className="subtle-button" onClick={() => setActiveSection("Activity")}>View activity <ArrowUpRight size={13} /></button>
            </div>
            <div className="activity-table">
              <div className="table-head"><span>ORDER</span><span>SIDE</span><span>INSTRUMENT</span><span>QUANTITY</span><span>LIMIT PRICE</span><span>STATUS</span><span>TIME</span></div>
              {orders.slice(0, 3).map((order) => (
                <div className="activity-row" key={order.id}>
                  <span className="order-id">#{order.id}</span>
                  <span className={`activity-side ${order.side.toLowerCase()}`}>{order.side}</span>
                  <strong>{order.symbol}</strong>
                  <span>{order.quantity}</span>
                  <span>{money(order.price)}</span>
                  <span><i className={`status-indicator ${order.status.toLowerCase()}`} />{order.status}</span>
                  <span className="activity-time">{order.time}</span>
                </div>
              ))}
            </div>
          </section>

          <footer className="page-footer">
            <div><span className="footer-brand-mark">S.</span><span>SHADOW EXCHANGE</span><span className="footer-separator">/</span><span>BUILT FOR PRECISION.</span></div>
            <div><span>DEMO ENVIRONMENT</span><span className="footer-separator">·</span><span>NOT FINANCIAL ADVICE</span><span className="footer-version">v0.1.0</span></div>
          </footer>
        </div>
      </main>

      {toast && <div className="toast" role="status"><span className="toast-mark">S.</span><span>{toast}</span><button aria-label="Dismiss message" onClick={() => setToast("")}><X size={14} /></button></div>}
      <button className="mobile-menu" aria-label="Open navigation" onClick={() => setToast("For the best terminal experience, use a wider screen.")}><Menu size={20} /></button>
    </div>
  );
}

export default App;
