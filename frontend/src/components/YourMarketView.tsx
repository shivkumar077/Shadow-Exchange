import { useState } from "react";
import { ArrowUpRight, Plus, Search, Star, Trash2, X } from "lucide-react";
import { ShadowCat } from "./ShadowCat";
import type { StockItem } from "./InstrumentPickerModal";

interface YourMarketViewProps {
  allStocks: StockItem[];
  watchedSymbols: string[];
  onToggleWatchSymbol: (symbol: string) => void;
  onSelectStock: (stock: StockItem) => void;
  onNavigateToOverview: () => void;
  onOpenInstrumentPicker: () => void;
}

const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

function Sparkline({ points }: { points: number[] }) {
  if (!points || points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * 100;
      const y = 100 - ((p - min) / range) * 80 - 10;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const negative = points[points.length - 1] < points[0];
  return (
    <svg className={`sparkline ${negative ? "is-negative" : ""}`} viewBox="0 0 100 100" preserveAspectRatio="none">
      <path d={path} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function YourMarketView({
  allStocks,
  watchedSymbols,
  onToggleWatchSymbol,
  onSelectStock,
  onNavigateToOverview,
  onOpenInstrumentPicker,
}: YourMarketViewProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"symbol" | "price_desc" | "price_asc">("symbol");

  const watchedStocks = allStocks.filter((s) => watchedSymbols.includes(s.symbol));

  const filtered = watchedStocks.filter(
    (s) =>
      s.symbol.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "price_desc") return b.price - a.price;
    if (sortBy === "price_asc") return a.price - b.price;
    return a.symbol.localeCompare(b.symbol);
  });

  const validPrices = watchedStocks.filter((s) => s.price > 0);
  const maxPrice = validPrices.length > 0 ? Math.max(...validPrices.map((s) => s.price)) : 0;
  const avgPrice = validPrices.length > 0 ? validPrices.reduce((a, s) => a + s.price, 0) / validPrices.length : 0;

  return (
    <section className="your-market-view" aria-label="Your Market Watchlist">
      <div className="markets-summary-grid">
        <article className="portfolio-metric">
          <span>WATCHED ASSETS</span>
          <strong>{watchedStocks.length.toString().padStart(2, "0")}</strong>
          <small>Curated operator watchlist</small>
        </article>
        <article className="portfolio-metric">
          <span>HIGHEST BENCHMARK</span>
          <strong>{maxPrice > 0 ? money(maxPrice) : "—"}</strong>
          <small>Peak watchlist asset</small>
        </article>
        <article className="portfolio-metric">
          <span>WATCHLIST MEAN</span>
          <strong>{avgPrice > 0 ? money(avgPrice) : "—"}</strong>
          <small>Average benchmark quote</small>
        </article>
        <article className="portfolio-metric">
          <span>UNIVERSE COVERAGE</span>
          <strong>
            {allStocks.length > 0
              ? `${Math.round((watchedStocks.length / allStocks.length) * 100)}%`
              : "0%"}
          </strong>
          <small>Fraction of exchange catalog</small>
        </article>
      </div>

      <section className="panel markets-table-panel">
        <div className="panel-topline">
          <div className="panel-label">
            <span className="panel-index">02</span> YOUR MARKET WATCHLIST ({sorted.length})
          </div>
          <div className="markets-controls">
            <label className="search-field">
              <Search size={14} />
              <input
                id="your-market-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search watched stocks…"
                aria-label="Search watched stocks"
              />
              {search && (
                <button
                  type="button"
                  className="clear-filter-btn"
                  onClick={() => setSearch("")}
                  aria-label="Clear filter"
                >
                  <X size={11} />
                </button>
              )}
            </label>
            <div className="sort-buttons">
              <button
                type="button"
                className={`sort-pill ${sortBy === "symbol" ? "is-active" : ""}`}
                onClick={() => setSortBy("symbol")}
              >
                Symbol
              </button>
              <button
                type="button"
                className={`sort-pill ${sortBy === "price_desc" ? "is-active" : ""}`}
                onClick={() => setSortBy("price_desc")}
              >
                Price ↓
              </button>
              <button
                type="button"
                className={`sort-pill ${sortBy === "price_asc" ? "is-active" : ""}`}
                onClick={() => setSortBy("price_asc")}
              >
                Price ↑
              </button>
            </div>
            <button
              type="button"
              className="subtle-button add-watch-btn"
              onClick={onOpenInstrumentPicker}
              title="Add instruments to watchlist"
            >
              <Plus size={13} />
              <span>Add Stock</span>
            </button>
          </div>
        </div>

        <div className="markets-table-wrap">
          <div className="markets-table-head">
            <span>INSTRUMENT</span>
            <span>SIMULATED PRICE</span>
            <span>24H TREND</span>
            <span>STATUS</span>
            <span>ACTIONS</span>
          </div>

          <div className="markets-table-rows">
            {sorted.map((stock) => (
              <div key={stock.id} className="market-table-row">
                <div className="market-row-asset">
                  <span className="ticker-avatar">{stock.symbol.slice(0, 1)}</span>
                  <div>
                    <strong>{stock.symbol}</strong>
                    <small>{stock.name}</small>
                  </div>
                </div>

                <div className="market-row-price">
                  <strong>{stock.price > 0 ? money(stock.price) : "Quote pending"}</strong>
                  <small>USD</small>
                </div>

                <div className="market-row-trend">
                  <Sparkline points={stock.points} />
                </div>

                <div className="market-row-status">
                  <span className="status-chip is-active">
                    <Star size={10} fill="currentColor" /> WATCHED
                  </span>
                </div>

                <div className="market-row-actions">
                  <button
                    type="button"
                    className="market-trade-btn"
                    onClick={() => {
                      onSelectStock(stock);
                      onNavigateToOverview();
                    }}
                  >
                    <span>Trade</span>
                    <ArrowUpRight size={13} />
                  </button>
                  <button
                    type="button"
                    className="icon-button unwatch-btn"
                    onClick={() => onToggleWatchSymbol(stock.symbol)}
                    title={`Remove ${stock.symbol} from watchlist`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}

            {sorted.length === 0 && watchedStocks.length > 0 && (
              <div className="empty-state">
                No watched instruments match “{search}”.
              </div>
            )}

            {watchedStocks.length === 0 && (
              <div className="empty-state your-market-empty">
                <ShadowCat expression="thinking" size={48} />
                <p>Your watchlist is currently empty.</p>
                <small>Select instruments from the exchange universe to build your custom market view.</small>
                <button
                  type="button"
                  className="not-found-primary-btn"
                  onClick={onOpenInstrumentPicker}
                  style={{ marginTop: "14px" }}
                >
                  <Plus size={14} />
                  <span>Add First Instrument</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="markets-footnote">
          <span>OPERATOR WATCHLIST PERSISTED LOCALLY · SIMULATED MARKET BENCHMARKS</span>
        </div>
      </section>
    </section>
  );
}
